import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <nav style={styles.nav}>
      <span style={styles.logo}>Paonia Chess</span>
      {user && (
        <div style={styles.right}>
          <span style={styles.username}>{user.username}</span>
          <button onClick={handleLogout} style={styles.btn}>Log out</button>
        </div>
      )}
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    background: '#1a1a2e',
    color: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
  },
  logo: {
    fontSize: '1.2rem',
    fontWeight: 700,
    letterSpacing: '0.5px',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  username: {
    fontSize: '0.95rem',
    color: '#a8b2d8',
  },
  btn: {
    padding: '6px 14px',
    background: 'transparent',
    border: '1px solid #555',
    borderRadius: '6px',
    color: '#ccc',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
};
