import { Chess } from 'chess.js';
import db from '../db';
import { Game } from '../types';

// In-memory cache: roomCode -> Chess instance
const activeGames = new Map<string, Chess>();

export function getOrLoadGame(roomCode: string): Chess | null {
  if (activeGames.has(roomCode)) return activeGames.get(roomCode)!;

  const row = db.prepare('SELECT pgn, status FROM games WHERE room_code = ?').get(roomCode) as Pick<Game, 'pgn' | 'status'> | undefined;
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

export function applyMove(
  roomCode: string,
  move: { from: string; to: string; promotion?: string }
): MoveResult {
  const chess = getOrLoadGame(roomCode);
  if (!chess) throw new Error('Game not found or already finished');

  const result = chess.move(move);
  if (!result) throw new Error('Illegal move');

  db.prepare(
    'UPDATE games SET fen = ?, pgn = ?, updated_at = datetime("now") WHERE room_code = ?'
  ).run(chess.fen(), chess.pgn(), roomCode);

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
