import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { requireAuth } from '../middleware/auth';
import { User } from '../types';

const router = Router();

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ error: 'username, email, and password are required' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  const { rows: existing } = await pool.query(
    'SELECT id FROM users WHERE email = $1 OR username = $2',
    [email, username]
  );
  if (existing.length > 0) {
    res.status(409).json({ error: 'Email or username already in use' });
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
    [username, email, hashed]
  );
  const newId = rows[0].id;

  const token = jwt.sign(
    { userId: newId, username },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    user: { id: newId, username, email },
    token,
  });
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0] as User | undefined;
  if (!user || !await bcrypt.compare(password, user.password)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  res.json({
    user: { id: user.id, username: user.username, email: user.email },
    token,
  });
});

router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { rows } = await pool.query(
    'SELECT id, username, email FROM users WHERE id = $1',
    [req.user!.userId]
  );
  const user = rows[0] as Omit<User, 'password' | 'created_at'> | undefined;
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user });
});

export default router;
