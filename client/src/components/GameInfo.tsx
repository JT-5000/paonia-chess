import { GameOverInfo } from '../types';

interface Props {
  white: { id: number; username: string } | null;
  black: { id: number; username: string } | null;
  turn: 'w' | 'b';
  status: 'waiting' | 'active' | 'finished';
  gameOver: GameOverInfo | null;
  roomCode: string;
  drawOfferedBy: string | null;
  onResign: () => void;
  onOfferDraw: () => void;
  onAcceptDraw: () => void;
  opponentDisconnected: boolean;
  currentUserId: number | undefined;
}

export function GameInfo({
  white,
  black,
  turn,
  status,
  gameOver,
  roomCode,
  drawOfferedBy,
  onResign,
  onOfferDraw,
  onAcceptDraw,
  opponentDisconnected,
  currentUserId,
}: Props) {
  const isWhiteTurn = turn === 'w';

  function getGameOverMessage() {
    if (!gameOver) return null;
    const { result, reason } = gameOver;

    if (reason === 'checkmate') {
      const winner = result === 'white' ? white?.username : black?.username;
      return `Checkmate! ${winner} wins.`;
    }
    if (reason === 'stalemate') return 'Stalemate — draw!';
    if (reason === 'draw') return 'Draw by repetition / insufficient material.';
    if (reason === 'agreement') return 'Draw by agreement.';
    if (reason === 'resignation') {
      const winner = result === 'white' ? white?.username : black?.username;
      return `${winner} wins by resignation.`;
    }
    return 'Game over.';
  }

  const gameOverMsg = getGameOverMessage();

  return (
    <div style={styles.container}>
      {/* Players */}
      <div style={styles.players}>
        <PlayerChip
          label="White"
          username={white?.username ?? '—'}
          active={status === 'active' && isWhiteTurn}
          isYou={white?.id === currentUserId}
        />
        <span style={styles.vs}>vs</span>
        <PlayerChip
          label="Black"
          username={black?.username ?? 'Waiting...'}
          active={status === 'active' && !isWhiteTurn}
          isYou={black?.id === currentUserId}
        />
      </div>

      {/* Status messages */}
      {status === 'waiting' && (
        <div style={styles.statusBox}>
          <p style={styles.waitingText}>Waiting for opponent to join...</p>
          <p style={styles.roomCodeLabel}>Share this room code:</p>
          <div style={styles.roomCode}>{roomCode}</div>
        </div>
      )}

      {status === 'active' && !gameOver && (
        <p style={styles.turnText}>
          {isWhiteTurn ? (white?.username ?? 'White') : (black?.username ?? 'Black')}'s turn
        </p>
      )}

      {gameOverMsg && (
        <div style={styles.gameOverBox}>
          <p style={styles.gameOverText}>{gameOverMsg}</p>
        </div>
      )}

      {opponentDisconnected && status === 'active' && (
        <p style={styles.disconnected}>Opponent disconnected. Waiting for reconnect...</p>
      )}

      {/* Draw offer */}
      {drawOfferedBy && (
        <div style={styles.drawOffer}>
          <p>{drawOfferedBy} offered a draw.</p>
          <button style={styles.acceptBtn} onClick={onAcceptDraw}>Accept</button>
        </div>
      )}

      {/* Action buttons */}
      {status === 'active' && !gameOver && (
        <div style={styles.actions}>
          <button style={styles.resignBtn} onClick={onResign}>Resign</button>
          {!drawOfferedBy && (
            <button style={styles.drawBtn} onClick={onOfferDraw}>Offer Draw</button>
          )}
        </div>
      )}
    </div>
  );
}

function PlayerChip({ label, username, active, isYou }: { label: string; username: string; active: boolean; isYou: boolean }) {
  return (
    <div style={{ ...chipStyles.chip, borderColor: active ? '#63b3ed' : '#444' }}>
      <span style={chipStyles.label}>{label}</span>
      <span style={chipStyles.username}>
        {username}{isYou ? ' (you)' : ''}
      </span>
      {active && <span style={chipStyles.dot} />}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px',
    background: '#1e2535',
    borderRadius: '10px',
    color: '#e2e8f0',
    minWidth: '220px',
  },
  players: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  vs: { color: '#718096', fontSize: '0.85rem' },
  statusBox: { textAlign: 'center' },
  waitingText: { color: '#a0aec0', marginBottom: '12px' },
  roomCodeLabel: { color: '#a0aec0', fontSize: '0.8rem', marginBottom: '4px' },
  roomCode: {
    fontSize: '2rem',
    fontWeight: 700,
    letterSpacing: '0.2em',
    color: '#63b3ed',
    background: '#2d3748',
    borderRadius: '8px',
    padding: '8px 16px',
    display: 'inline-block',
  },
  turnText: { color: '#a0aec0', fontSize: '0.9rem', margin: '0 0 12px' },
  gameOverBox: {
    background: '#2d3748',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '12px',
  },
  gameOverText: { margin: 0, fontWeight: 600, color: '#68d391' },
  disconnected: { color: '#fc8181', fontSize: '0.85rem' },
  drawOffer: {
    background: '#2d3748',
    borderRadius: '8px',
    padding: '10px',
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  acceptBtn: {
    padding: '4px 12px',
    background: '#68d391',
    color: '#1a202c',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  actions: { display: 'flex', gap: '8px', marginTop: '8px' },
  resignBtn: {
    flex: 1,
    padding: '8px',
    background: 'transparent',
    border: '1px solid #fc8181',
    borderRadius: '6px',
    color: '#fc8181',
    cursor: 'pointer',
  },
  drawBtn: {
    flex: 1,
    padding: '8px',
    background: 'transparent',
    border: '1px solid #a0aec0',
    borderRadius: '6px',
    color: '#a0aec0',
    cursor: 'pointer',
  },
};

const chipStyles: Record<string, React.CSSProperties> = {
  chip: {
    display: 'flex',
    flexDirection: 'column',
    padding: '8px 12px',
    background: '#2d3748',
    borderRadius: '8px',
    border: '2px solid',
    transition: 'border-color 0.2s',
    position: 'relative',
    minWidth: '90px',
  },
  label: { fontSize: '0.7rem', color: '#718096', textTransform: 'uppercase' },
  username: { fontSize: '0.9rem', fontWeight: 600 },
  dot: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#63b3ed',
  },
};
