import { useState } from 'react';
import { PixelSwordsCrossed } from './PixelArt';
import Leaderboard from './Leaderboard';
import WagerSelect from './WagerSelect';
import { useWallet } from '@solana/wallet-adapter-react';

const LS_KEY = 'codebattle_player';

function loadLocalPlayer() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function LandingPage({ onEnterQueue, leaderboard }) {
  const [username,    setUsername]    = useState('');
  const [error,       setError]       = useState('');
  const [wagerAmount, setWagerAmount] = useState(0);
  const { publicKey } = useWallet();

  const cached = loadLocalPlayer();
  const showEloHint = cached && username.trim().toLowerCase() === cached.username?.toLowerCase() && cached.elo;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed)            { setError('USERNAME REQUIRED.'); return; }
    if (trimmed.length > 20) { setError('MAX 20 CHARS.'); return; }
    if (wagerAmount > 0 && !publicKey) { setError('CONNECT WALLET FOR WAGER MODE.'); return; }
    setError('');
    onEnterQueue({ name: trimmed, wager: wagerAmount });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 gap-10">

      <div className="flex flex-col items-center gap-5">
        <PixelSwordsCrossed size={4} />
        <div className="text-center">
          <p className="text-[8px] text-gray-800 pixel-shadow mb-2">================================</p>
          <h1 className="text-2xl text-red-500 pixel-shadow cursor">CODEBATTLE</h1>
          <p className="text-[8px] text-gray-800 pixel-shadow mt-2">================================</p>
        </div>
        <p className="text-[8px] text-gray-600 pixel-shadow leading-6 text-center">
          1V1 REAL-TIME TRIVIA COMBAT
        </p>
      </div>

      <div className="pixel-panel w-full max-w-xs flex flex-col gap-5 p-6 border border-gray-800">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <label className="text-[8px] text-gray-600 pixel-shadow">&gt; ENTER USERNAME</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="PLAYER_001"
            maxLength={20}
            className="term-input w-full px-3 py-3 text-[10px] text-red-400 pixel-shadow"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
            autoFocus
          />

          {/* ELO hint for returning players */}
          {showEloHint && (
            <p className="text-[7px] pixel-shadow" style={{ color: '#cc9900' }}>
              ELO: {cached.elo} &nbsp; W:{cached.wins ?? 0} L:{cached.losses ?? 0}
            </p>
          )}

          {error && <p className="text-[8px] text-red-600 pixel-shadow">{error}</p>}

          {/* Wager mode */}
          <WagerSelect selected={wagerAmount} onChange={setWagerAmount} />

          <button
            type="submit"
            className="pixel-btn text-red-500 text-[9px] py-3 w-full uppercase border border-red-900 hover:border-red-500"
          >
            &gt; ENTER MATCHMAKING
          </button>
        </form>
      </div>

      {leaderboard.length > 0 && (
        <div className="w-full max-w-xs">
          <Leaderboard entries={leaderboard} />
        </div>
      )}
    </div>
  );
}
