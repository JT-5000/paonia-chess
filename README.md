# Paonia Chess

Real-time multiplayer chess for two players. Built with React, Node.js, Socket.IO, and SQLite.

## Local Development

### Prerequisites
- Node.js 18+

### 1. Configure the server environment

```bash
# server/.env is already created with defaults — no changes needed for local dev
```

### 2. Start the server (Terminal 1)

```bash
cd server
npm run dev
# Running on http://localhost:3001
```

### 3. Start the client (Terminal 2)

```bash
cd client
npm run dev
# Running on http://localhost:5173
```

### 4. Play

1. Open `http://localhost:5173` in **two browser windows** (use incognito for the second)
2. Register two separate accounts
3. In window 1 — click **Create New Game** and copy the 6-character room code
4. In window 2 — paste the code and click **Join Game**
5. Play!

## Deploying to Render

### One-time setup

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Blueprint
3. Connect your GitHub repo — Render will detect `render.yaml` automatically
4. Review the service and click **Apply**

> **Note:** The SQLite database is stored on a persistent disk (`/data/paonia.db`). The `render.yaml` is configured to provision a 1 GB disk, which requires Render's **paid plan** (Individual or higher). If you want to stay on the free tier, swap SQLite for a hosted database like Render's free PostgreSQL.

### After first deploy

Update `render.yaml` line 14 to your actual Render service URL:

```yaml
value: https://your-actual-service-name.onrender.com
```

Then redeploy.

## Project Structure

```
paonia-chess/
├── client/          React + TypeScript + Vite frontend
├── server/          Node.js + Express + Socket.IO backend
├── render.yaml      Render deployment blueprint
└── package.json     Root build scripts for deployment
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Chess UI | react-chessboard, chess.js |
| Backend | Node.js, Express, TypeScript |
| Real-time | Socket.IO |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Database | SQLite (better-sqlite3) |
