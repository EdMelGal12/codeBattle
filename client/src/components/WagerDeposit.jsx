import { useState, useEffect } from 'react';
import { useWager } from '../hooks/useWager';
import { getSocket } from '../hooks/useSocket';

const DEPOSIT_TIMEOUT = 30; // seconds to sign before cancelled

export default function WagerDeposit({ wagerInfo, onCancelled }) {
  const { initializeWager, joinWager } = useWager();
  const [status, setStatus]   = useState('idle');   // idle | signing | confirming | done | error
  const [timeLeft, setTimeLeft] = useState(DEPOSIT_TIMEOUT);
  const [opReady, setOpReady]   = useState(false);
  const [errMsg, setErrMsg]     = useState('');

  const { roomId, amount, serverPubkey, role } = wagerInfo;
  const solAmount = (amount / 1e9).toFixed(3);

  // Countdown timer
  useEffect(() => {
    const t = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) onCancelled('WAGER TIMEOUT. RETURNING TO QUEUE.');
  }, [timeLeft, onCancelled]);

  // Listen for opponent confirming
  useEffect(() => {
    const sock = getSocket();
    const handler = () => setOpReady(true);
    sock.on('wager_opponent_ready', handler);
    return () => sock.off('wager_opponent_ready', handler);
  }, []);

  const handleConfirm = async () => {
    setStatus('signing');
    setErrMsg('');
    try {
      let sig;
      if (role === 'init') {
        sig = await initializeWager(roomId, amount, serverPubkey);
      } else {
        sig = await joinWager(roomId, amount);
      }
      setStatus('confirming');
      getSocket().emit('wager_deposited', { signature: sig });
      setStatus('done');
    } catch (e) {
      setErrMsg(e.message || 'TRANSACTION FAILED');
      setStatus('error');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 gap-8">

      <p className="text-[8px] text-red-600 pixel-shadow">CODEBATTLE</p>
      <hr className="term-divider w-full max-w-xs" />

      <div className="pixel-panel w-full max-w-xs p-6 flex flex-col gap-5 border border-gray-800">
        <p className="text-[7px] text-gray-600 pixel-shadow">&gt; WAGER CONFIRMATION</p>
        <hr className="term-divider" />

        <div className="flex justify-between items-center">
          <span className="text-[7px] text-gray-600 pixel-shadow">AMOUNT</span>
          <span className="text-[10px] text-yellow-500 pixel-shadow">{solAmount} SOL</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[7px] text-gray-600 pixel-shadow">WIN</span>
          <span className="text-[9px] text-green-500 pixel-shadow">{(amount / 1e9 * 2 * 0.95).toFixed(3)} SOL</span>
        </div>

        <hr className="term-divider" />

        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <span className="text-[7px] text-gray-600 pixel-shadow">YOU</span>
            <span className={`text-[7px] pixel-shadow ${status === 'done' ? 'text-green-500' : status === 'signing' || status === 'confirming' ? 'text-yellow-500' : 'text-gray-600'}`}>
              {status === 'idle'       ? 'PENDING...' :
               status === 'signing'    ? 'SIGNING...' :
               status === 'confirming' ? 'CONFIRMING...' :
               status === 'done'       ? 'CONFIRMED' : 'ERROR'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[7px] text-gray-600 pixel-shadow">OPPONENT</span>
            <span className={`text-[7px] pixel-shadow ${opReady ? 'text-green-500' : 'text-gray-600'}`}>
              {opReady ? 'CONFIRMED' : 'PENDING...'}
            </span>
          </div>
        </div>

        {errMsg && (
          <p className="text-[7px] text-red-600 pixel-shadow leading-5">&gt; {errMsg}</p>
        )}
      </div>

      {/* Timer bar */}
      <div className="w-full max-w-xs flex gap-[2px]">
        {Array.from({ length: 30 }, (_, i) => (
          <div
            key={i}
            className="flex-1 h-2"
            style={{
              backgroundColor: i < timeLeft
                ? timeLeft > 15 ? '#226622' : timeLeft > 8 ? '#cc8800' : '#cc2222'
                : '#111',
              border: '1px solid #0d0d0d',
            }}
          />
        ))}
      </div>

      <p className="text-[7px] text-gray-700 pixel-shadow">{timeLeft}s TO CONFIRM</p>

      {status === 'idle' || status === 'error' ? (
        <button
          onClick={handleConfirm}
          className="pixel-btn text-[9px] text-yellow-500 py-3 px-10 border border-yellow-900 hover:border-yellow-500"
        >
          &gt; CONFIRM WAGER
        </button>
      ) : status === 'done' ? (
        <p className="text-[8px] text-green-600 pixel-shadow">AWAITING OPPONENT...</p>
      ) : (
        <p className="text-[8px] text-yellow-600 pixel-shadow cursor">PROCESSING...</p>
      )}
    </div>
  );
}
