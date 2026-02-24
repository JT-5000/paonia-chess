import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { requireAuth } from '../middleware/auth';
import { Game, User } from '../types';

const router = Router();

function generateRoomCode(): string {
  return uuidv4().replace(/-/g, '').toUpperCase().slice(0, 6);
}

router.post('/', requireAuth, (req: Request, res: Response): void => {
  let roomCode: string;
  let attempts = 0;

  // Ensure uniqueness
  do {
    roomCode = generateRoomCode();
    attempts++;
    if (attempts > 10) {
      res.status(500).json({ error: 'Failed to generate unique room code' });
      return;
    }
  } while (db.prepare('SELECT id FROM games WHERE room_code = ?').get(roomCode));

  db.prepare('INSERT INTO games (room_code, white_id) VALUES (?, ?)').run(roomCode, req.user!.userId);

  res.status(201).json({ roomCode });
});

router.get('/:roomCode', requireAuth, (req: Request, res: Response): void => {
  const game = db.prepare('SELECT * FROM games WHERE room_code = ?').get(req.params.roomCode) as Game | undefined;

  if (!game) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }

  const white = game.white_id
    ? (db.prepare('SELECT id, username FROM users WHERE id = ?').get(game.white_id) as Pick<User, 'id' | 'username'> | undefined)
    : null;
  const black = game.black_id
    ? (db.prepare('SELECT id, username FROM users WHERE id = ?').get(game.black_id) as Pick<User, 'id' | 'username'> | undefined)
    : null;

  res.json({
    roomCode: game.room_code,
    fen: game.fen,
    pgn: game.pgn,
    status: game.status,
    result: game.result,
    white: white ?? null,
    black: black ?? null,
  });
});

export default router;
