import { Chess } from 'chess.js';
import pool from '../db';
import { Game } from '../types';

// In-memory cache: roomCode -> Chess instance
const activeGames = new Map<string, Chess>();

export async function getOrLoadGame(roomCode: string): Promise<Chess | null> {
  if (activeGames.has(roomCode)) return activeGames.get(roomCode)!;

  const { rows } = await pool.query('SELECT pgn, status FROM games WHERE room_code = $1', [roomCode]);
  const row = rows[0] as Pick<Game, 'pgn' | 'status'> | undefined;
  if (!row || row.status === 'finished') return null;

  const chess = new Chess();
  if (row.pgn) chess.loadPgn(row.pgn);
  activeGames.set(roomCode, chess);
  return chess;
}

export interface MoveResult {
  fen: string;
  pgn: string;
  move: ReturnType<Chess['move']>;
  turn: string;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  isGameOver: boolean;
}

export async function applyMove(
  roomCode: string,
  move: { from: string; to: string; promotion?: string }
): Promise<MoveResult> {
  const chess = await getOrLoadGame(roomCode);
  if (!chess) throw new Error('Game not found or already finished');

  const result = chess.move(move);
  if (!result) throw new Error('Illegal move');

  await pool.query(
    `UPDATE games SET fen = $1, pgn = $2, updated_at = NOW()::text WHERE room_code = $3`,
    [chess.fen(), chess.pgn(), roomCode]
  );

  return {
    fen: chess.fen(),
    pgn: chess.pgn(),
    move: result,
    turn: chess.turn(),
    isCheck: chess.isCheck(),
    isCheckmate: chess.isCheckmate(),
    isStalemate: chess.isStalemate(),
    isDraw: chess.isDraw(),
    isGameOver: chess.isGameOver(),
  };
}

export function clearGame(roomCode: string): void {
  activeGames.delete(roomCode);
}
