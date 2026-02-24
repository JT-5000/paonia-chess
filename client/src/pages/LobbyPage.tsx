import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export function LobbyPage() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    setError('');
    setCreating(true);
    try {
      const { roomCode } = await api.post<{ roomCode: string }>('/games');
      navigate(`/game/${roomCode}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
      setCreating(false);
    }
  }

  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setError('');
    setJoining(true);
    try {
      await api.get(`/games/${code}`);
      navigate(`/game/${code}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Game not found');
      setJoining(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.heading}>Game Lobby</h2>
        <p style={styles.sub}>Start a new game or join one with a code.</p>

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.createBtn} onClick={handleCreate} disabled={creating}>
          {creating ? 'Creating...' : 'Create New Game'}
        </button>

        <div style={styles.divider}><span>or</span></div>

        <form onSubmit={handleJoin} style={styles.joinForm}>
          <input
            style={styles.input}
            type="text"
            placeholder="Enter room code (e.g. K7X2PQ)"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
          />
          <button style={styles.joinBtn} type="submit" disabled={joining || !joinCode.trim()}>
            {joining ? 'Joining...' : 'Join Game'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: 'calc(100vh - 52px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f1117',
  },
  card: {
    background: '#1a1f2e',
    borderRadius: '12px',
    padding: '36px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  heading: { margin: '0 0 6px', color: '#e2e8f0' },
  sub: { color: '#718096', marginBottom: '24px', fontSize: '0.9rem' },
  error: { color: '#fc8181', fontSize: '0.9rem', marginBottom: '12px' },
  createBtn: {
    width: '100%',
    padding: '12px',
    background: '#4299e1',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  divider: {
    textAlign: 'center',
    color: '#4a5568',
    margin: '20px 0',
    position: 'relative',
  },
  joinForm: { display: 'flex', flexDirection: 'column', gap: '10px' },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #444',
    background: '#2d3748',
    color: '#e2e8f0',
    fontSize: '1rem',
    letterSpacing: '0.1em',
  },
  joinBtn: {
    padding: '10px',
    background: '#68d391',
    color: '#1a202c',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
