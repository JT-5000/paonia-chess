export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  created_at: string;
}

export interface Game {
  id: number;
  room_code: string;
  white_id: number | null;
  black_id: number | null;
  fen: string;
  pgn: string;
  status: 'waiting' | 'active' | 'finished';
  winner_id: number | null;
  result: 'white' | 'black' | 'draw' | null;
  created_at: string;
  updated_at: string;
}

export interface JwtPayload {
  userId: number;
  username: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
