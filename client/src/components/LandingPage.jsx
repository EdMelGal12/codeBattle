import { useState } from 'react';
import { PixelSwordsCrossed } from './PixelArt';
import Leaderboard from './Leaderboard';

export default function LandingPage({ onEnterQueue, leaderboard }) {
  const [username, setUsername] = useState('');
  const [error, setError]       = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed)            { setError('USERNAME REQUIRED.'); return; }
    if (trimmed.length > 20) { setError('MAX 20 CHARS.'); return; }
    setError('');
    onEnterQueue(trimmed);
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
          {error && <p className="text-[8px] text-red-600 pixel-shadow">{error}</p>}

          {/* No pixel-shadow on button — fixes the doubled text rendering */}
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
