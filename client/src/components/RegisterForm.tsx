import { FormEvent, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  onSuccess: () => void;
}

export function RegisterForm({ onSuccess }: Props) {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(username, email, password);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2 style={styles.heading}>Create Account</h2>
      {error && <p style={styles.error}>{error}</p>}
      <input
        style={styles.input}
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        minLength={2}
      />
      <input
        style={styles.input}
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        style={styles.input}
        type="password"
        placeholder="Password (min 6 chars)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
      />
      <button style={styles.btn} type="submit" disabled={loading}>
        {loading ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  heading: { margin: '0 0 8px', color: '#e2e8f0' },
  error: { color: '#fc8181', margin: 0, fontSize: '0.9rem' },
  input: {
    padding: '10px 14px',
    borderRadius: '6px',
    border: '1px solid #444',
    background: '#2d3748',
    color: '#e2e8f0',
    fontSize: '1rem',
  },
  btn: {
    padding: '10px',
    borderRadius: '6px',
    border: 'none',
    background: '#68d391',
    color: '#1a202c',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '4px',
  },
};
