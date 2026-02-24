import { FormEvent, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2 style={styles.heading}>Sign In</h2>
      {error && <p style={styles.error}>{error}</p>}
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
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button style={styles.btn} type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
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
    background: '#4299e1',
    color: '#fff',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '4px',
  },
};
