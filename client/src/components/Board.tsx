import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import socket from '../socket';

interface Props {
  fen: string;
  playerColor: 'white' | 'black';
  roomCode: string;
  isMyTurn: boolean;
}

export function Board({ fen, playerColor, roomCode, isMyTurn }: Props) {
  function onPieceDrop(sourceSquare: string, targetSquare: string): boolean {
    if (!isMyTurn) return false;

    // Validate the move locally before emitting
    const testChess = new Chess(fen);
    const move = testChess.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q', // auto-queen promotions
    });

    if (!move) return false; // illegal — piece snaps back

    // Server is authoritative; do NOT update fen here. Wait for move-made echo.
    socket.emit('make-move', {
      roomCode,
      move: { from: sourceSquare, to: targetSquare, promotion: 'q' },
    });

    return true;
  }

  return (
    <div style={{ width: '100%', maxWidth: '560px' }}>
      <Chessboard
        position={fen}
        onPieceDrop={onPieceDrop}
        boardOrientation={playerColor}
        arePiecesDraggable={isMyTurn}
        customBoardStyle={{
          borderRadius: '8px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        }}
      />
    </div>
  );
}
