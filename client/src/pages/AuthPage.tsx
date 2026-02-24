import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { RegisterForm } from '../components/RegisterForm';

export function AuthPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const navigate = useNavigate();

  function onSuccess() {
    navigate('/lobby');
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Paonia Chess</h1>
        <p style={styles.subtitle}>Play chess with a friend in real time</p>

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(tab === 'login' ? styles.tabActive : {}) }}
            onClick={() => setTab('login')}
          >
            Sign In
          </button>
          <button
            style={{ ...styles.tab, ...(tab === 'register' ? styles.tabActive : {}) }}
            onClick={() => setTab('register')}
          >
            Register
          </button>
        </div>

        {tab === 'login' ? (
          <LoginForm onSuccess={onSuccess} />
        ) : (
          <RegisterForm onSuccess={onSuccess} />
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
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
    maxWidth: '400px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  title: {
    margin: '0 0 4px',
    color: '#e2e8f0',
    fontSize: '1.8rem',
    textAlign: 'center',
  },
  subtitle: {
    color: '#718096',
    textAlign: 'center',
    marginBottom: '24px',
    fontSize: '0.9rem',
  },
  tabs: {
    display: 'flex',
    marginBottom: '20px',
    background: '#2d3748',
    borderRadius: '8px',
    padding: '4px',
    gap: '4px',
  },
  tab: {
    flex: 1,
    padding: '8px',
    border: 'none',
    borderRadius: '6px',
    background: 'transparent',
    color: '#a0aec0',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  tabActive: {
    background: '#4a5568',
    color: '#e2e8f0',
    fontWeight: 600,
  },
};
