import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db';
import { requireAuth } from '../middleware/auth';
import { User } from '../types';

const router = Router();

router.post('/register', (req: Request, res: Response): void => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ error: 'username, email, and password are required' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
  if (existing) {
    res.status(409).json({ error: 'Email or username already in use' });
    return;
  }

  const hashed = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(username, email, hashed);

  const token = jwt.sign(
    { userId: result.lastInsertRowid, username },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    user: { id: result.lastInsertRowid, username, email },
    token,
  });
});

router.post('/login', (req: Request, res: Response): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
  if (!user || !bcrypt.compareSync(password, user.password)) {
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

router.get('/me', requireAuth, (req: Request, res: Response): void => {
  const user = db.prepare('SELECT id, username, email FROM users WHERE id = ?').get(req.user!.userId) as Omit<User, 'password' | 'created_at'> | undefined;
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user });
});

export default router;
