import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Board } from '../components/Board';
import { GameInfo } from '../components/GameInfo';
import { api } from '../api';
import socket from '../socket';
import { useAuth } from '../contexts/AuthContext';
import { GameOverInfo, GameState, MovePayload } from '../types';

export function GamePage() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [fen, setFen] = useState('start');
  const [turn, setTurn] = useState<'w' | 'b'>('w');
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [status, setStatus] = useState<'waiting' | 'active' | 'finished'>('waiting');
  const [white, setWhite] = useState<{ id: number; username: string } | null>(null);
  const [black, setBlack] = useState<{ id: number; username: string } | null>(null);
  const [gameOver, setGameOver] = useState<GameOverInfo | null>(null);
  const [drawOfferedBy, setDrawOfferedBy] = useState<string | null>(null);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [loadError, setLoadError] = useState('');

  const isMyTurn =
    status === 'active' &&
    !gameOver &&
    ((turn === 'w' && playerColor === 'white') || (turn === 'b' && playerColor === 'black'));

  useEffect(() => {
    if (!roomCode) return;

    // Load game state from REST (handles fresh load + reconnect)
    api.get<GameState>(`/games/${roomCode}`)
      .then((game) => {
        setFen(game.fen);
        setStatus(game.status);
        setWhite(game.white);
        setBlack(game.black);

        if (game.fen !== 'start') {
          try {
            const chess = new Chess();
            chess.load(game.fen);
            setTurn(chess.turn());
          } catch {
            // fallback
          }
        }

        if (game.white?.id === user?.id) setPlayerColor('white');
        else if (game.black?.id === user?.id) setPlayerColor('black');

        if (game.status === 'finished' && game.result) {
          setGameOver({ result: game.result, reason: 'checkmate', winnerId: null });
        }
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : 'Failed to load game');
      });

    // Connect socket and join room
    socket.connect();
    socket.emit('join-room', { roomCode });

    socket.on('game-started', (data: { fen: string; white: { id: number; username: string }; black: { id: number; username: string } }) => {
      setWhite(data.white);
      setBlack(data.black);
      setStatus('active');
      setFen(data.fen);

      if (data.white.id === user?.id) setPlayerColor('white');
      else setPlayerColor('black');
    });

    socket.on('move-made', (data: MovePayload) => {
      setFen(data.fen);
      setTurn(data.turn);
    });

    socket.on('game-over', (data: GameOverInfo) => {
      setGameOver(data);
      setStatus('finished');
    });

    socket.on('draw-offered', ({ by }: { by: string }) => {
      setDrawOfferedBy(by);
    });

    socket.on('opponent-disconnected', () => {
      setOpponentDisconnected(true);
    });

    socket.on('opponent-reconnected', () => {
      setOpponentDisconnected(false);
    });

    socket.on('error', ({ message }: { message: string }) => {
      console.error('Socket error:', message);
    });

    return () => {
      socket.off('game-started');
      socket.off('move-made');
      socket.off('game-over');
      socket.off('draw-offered');
      socket.off('opponent-disconnected');
      socket.off('opponent-reconnected');
      socket.off('error');
      socket.disconnect();
    };
  }, [roomCode, user?.id]);

  function handleResign() {
    if (!roomCode) return;
    if (window.confirm('Are you sure you want to resign?')) {
      socket.emit('resign', { roomCode });
    }
  }

  function handleOfferDraw() {
    if (!roomCode) return;
    socket.emit('offer-draw', { roomCode });
  }

  function handleAcceptDraw() {
    if (!roomCode) return;
    socket.emit('accept-draw', { roomCode });
    setDrawOfferedBy(null);
  }

  if (loadError) {
    return (
      <div style={styles.errorPage}>
        <p style={{ color: '#fc8181' }}>{loadError}</p>
        <button style={styles.backBtn} onClick={() => navigate('/lobby')}>Back to Lobby</button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.layout}>
        <Board
          fen={fen}
          playerColor={playerColor}
          roomCode={roomCode!}
          isMyTurn={isMyTurn}
        />
        <div style={styles.sidebar}>
          <GameInfo
            white={white}
            black={black}
            turn={turn}
            status={status}
            gameOver={gameOver}
            roomCode={roomCode!}
            drawOfferedBy={drawOfferedBy}
            onResign={handleResign}
            onOfferDraw={handleOfferDraw}
            onAcceptDraw={handleAcceptDraw}
            opponentDisconnected={opponentDisconnected}
            currentUserId={user?.id}
          />
          {gameOver && (
            <button style={styles.backBtn} onClick={() => navigate('/lobby')}>
              Back to Lobby
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: 'calc(100vh - 52px)',
    background: '#0f1117',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  layout: {
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '900px',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    minWidth: '220px',
  },
  errorPage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: 'calc(100vh - 52px)',
    gap: '16px',
  },
  backBtn: {
    padding: '10px 20px',
    background: '#4299e1',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.95rem',
  },
};
