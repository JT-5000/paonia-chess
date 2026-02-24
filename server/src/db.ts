import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      username   TEXT NOT NULL UNIQUE,
      email      TEXT NOT NULL UNIQUE,
      password   TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (NOW()::text)
    );

    CREATE TABLE IF NOT EXISTS games (
      id         SERIAL PRIMARY KEY,
      room_code  TEXT NOT NULL UNIQUE,
      white_id   INTEGER REFERENCES users(id),
      black_id   INTEGER REFERENCES users(id),
      fen        TEXT NOT NULL DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      pgn        TEXT NOT NULL DEFAULT '',
      status     TEXT NOT NULL DEFAULT 'waiting',
      winner_id  INTEGER REFERENCES users(id),
      result     TEXT,
      created_at TEXT NOT NULL DEFAULT (NOW()::text),
      updated_at TEXT NOT NULL DEFAULT (NOW()::text)
    );
  `);
}

export default pool;
