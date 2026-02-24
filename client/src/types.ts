export interface User {
  id: number;
  username: string;
  email: string;
}

export interface GameState {
  roomCode: string;
  fen: string;
  pgn: string;
  status: 'waiting' | 'active' | 'finished';
  result: 'white' | 'black' | 'draw' | null;
  white: { id: number; username: string } | null;
  black: { id: number; username: string } | null;
}

export interface GameOverInfo {
  result: 'white' | 'black' | 'draw';
  reason: 'checkmate' | 'stalemate' | 'draw' | 'resignation' | 'agreement';
  winnerId: number | null;
}

export interface MovePayload {
  fen: string;
  pgn: string;
  move: { from: string; to: string; san: string };
  turn: 'w' | 'b';
}
