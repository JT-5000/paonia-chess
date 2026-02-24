import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { applyMove, clearGame, getOrLoadGame } from './gameManager';
import { Game, JwtPayload, User } from '../types';

interface AuthSocket extends Socket {
  user: JwtPayload;
}

export function registerSocketHandlers(io: Server): void {
  // Authenticate every socket connection via JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      (socket as AuthSocket).user = payload;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const { userId, username } = (socket as AuthSocket).user;

    socket.on('join-room', async ({ roomCode }: { roomCode: string }) => {
      const { rows } = await pool.query('SELECT * FROM games WHERE room_code = $1', [roomCode]);
      const game = rows[0] as Game | undefined;
      if (!game) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // If game is waiting and this user is NOT the creator, they join as black
      if (game.status === 'waiting' && game.white_id !== userId) {
        await pool.query(
          `UPDATE games SET black_id = $1, status = $2, updated_at = NOW()::text WHERE room_code = $3`,
          [userId, 'active', roomCode]
        );

        socket.join(roomCode);

        const { rows: whiteRows } = await pool.query('SELECT username FROM users WHERE id = $1', [game.white_id]);
        const { rows: blackRows } = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
        const whiteUser = whiteRows[0] as Pick<User, 'username'> | undefined;
        const blackUser = blackRows[0] as Pick<User, 'username'> | undefined;

        io.to(roomCode).emit('game-started', {
          fen: game.fen,
          white: { id: game.white_id, username: whiteUser?.username },
          black: { id: userId, username: blackUser?.username },
        });

        socket.to(roomCode).emit('opponent-joined', { username });
        return;
      }

      // Creator rejoining or reconnecting player
      socket.join(roomCode);

      if (game.status === 'active') {
        socket.to(roomCode).emit('opponent-reconnected', { username });
      }
    });

    socket.on('make-move', async ({ roomCode, move }: { roomCode: string; move: { from: string; to: string; promotion?: string } }) => {
      const { rows } = await pool.query('SELECT * FROM games WHERE room_code = $1', [roomCode]);
      const game = rows[0] as Game | undefined;
      if (!game || game.status !== 'active') {
        socket.emit('error', { message: 'Game not active' });
        return;
      }

      const chess = await getOrLoadGame(roomCode);
      if (!chess) {
        socket.emit('error', { message: 'Game state not found' });
        return;
      }

      // Verify it is this player's turn
      const isWhite = game.white_id === userId;
      const isBlack = game.black_id === userId;
      const currentTurn = chess.turn();

      if ((currentTurn === 'w' && !isWhite) || (currentTurn === 'b' && !isBlack)) {
        socket.emit('move-rejected', { reason: 'Not your turn' });
        return;
      }

      try {
        const result = await applyMove(roomCode, move);

        io.to(roomCode).emit('move-made', {
          fen: result.fen,
          pgn: result.pgn,
          move: result.move,
          turn: result.turn,
        });

        if (result.isGameOver) {
          let gameResult: 'white' | 'black' | 'draw';
          let winnerId: number | null = null;

          if (result.isCheckmate) {
            // The player who just moved wins (currentTurn was their color before the move)
            gameResult = currentTurn === 'w' ? 'white' : 'black';
            winnerId = isWhite ? game.white_id : game.black_id;
          } else {
            gameResult = 'draw';
          }

          await pool.query(
            `UPDATE games SET status = $1, winner_id = $2, result = $3, updated_at = NOW()::text WHERE room_code = $4`,
            ['finished', winnerId, gameResult, roomCode]
          );

          clearGame(roomCode);

          io.to(roomCode).emit('game-over', {
            result: gameResult,
            reason: result.isCheckmate
              ? 'checkmate'
              : result.isStalemate
              ? 'stalemate'
              : 'draw',
            winnerId,
          });
        }
      } catch (err: unknown) {
        socket.emit('move-rejected', { reason: err instanceof Error ? err.message : 'Unknown error' });
      }
    });

    socket.on('resign', async ({ roomCode }: { roomCode: string }) => {
      const { rows } = await pool.query('SELECT * FROM games WHERE room_code = $1', [roomCode]);
      const game = rows[0] as Game | undefined;
      if (!game || game.status !== 'active') return;

      const isWhite = game.white_id === userId;
      const result: 'white' | 'black' = isWhite ? 'black' : 'white';
      const winnerId = isWhite ? game.black_id : game.white_id;

      await pool.query(
        `UPDATE games SET status = $1, winner_id = $2, result = $3, updated_at = NOW()::text WHERE room_code = $4`,
        ['finished', winnerId, result, roomCode]
      );

      clearGame(roomCode);

      io.to(roomCode).emit('game-over', { result, reason: 'resignation', winnerId });
    });

    socket.on('offer-draw', ({ roomCode }: { roomCode: string }) => {
      socket.to(roomCode).emit('draw-offered', { by: username });
    });

    socket.on('accept-draw', async ({ roomCode }: { roomCode: string }) => {
      const { rows } = await pool.query('SELECT * FROM games WHERE room_code = $1', [roomCode]);
      const game = rows[0] as Game | undefined;
      if (!game || game.status !== 'active') return;

      await pool.query(
        `UPDATE games SET status = $1, result = $2, updated_at = NOW()::text WHERE room_code = $3`,
        ['finished', 'draw', roomCode]
      );

      clearGame(roomCode);

      io.to(roomCode).emit('game-over', { result: 'draw', reason: 'agreement', winnerId: null });
    });

    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          socket.to(room).emit('opponent-disconnected', { username });
        }
      }
    });
  });
}
