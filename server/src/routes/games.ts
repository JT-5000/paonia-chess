import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db';
import { requireAuth } from '../middleware/auth';
import { Game, User } from '../types';

const router = Router();

function generateRoomCode(): string {
  return uuidv4().replace(/-/g, '').toUpperCase().slice(0, 6);
}

router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
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
    const { rows } = await pool.query('SELECT id FROM games WHERE room_code = $1', [roomCode]);
    if (rows.length === 0) break;
  } while (true);

  await pool.query('INSERT INTO games (room_code, white_id) VALUES ($1, $2)', [roomCode, req.user!.userId]);

  res.status(201).json({ roomCode });
});

router.get('/:roomCode', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { rows } = await pool.query('SELECT * FROM games WHERE room_code = $1', [req.params.roomCode]);
  const game = rows[0] as Game | undefined;

  if (!game) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }

  const white = game.white_id
    ? ((await pool.query('SELECT id, username FROM users WHERE id = $1', [game.white_id])).rows[0] as Pick<User, 'id' | 'username'> | undefined)
    : null;
  const black = game.black_id
    ? ((await pool.query('SELECT id, username FROM users WHERE id = $1', [game.black_id])).rows[0] as Pick<User, 'id' | 'username'> | undefined)
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
