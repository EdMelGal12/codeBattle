import { useState } from 'react';
import { PixelSwordsCrossed } from './PixelArt';
import Leaderboard from './Leaderboard';

export default function LandingPage({ onEnterQueue, leaderboard }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) { setError('Enter a username.'); return; }
    if (trimmed.length > 20) { setError('Max 20 characters.'); return; }
    setError('');
    onEnterQueue(trimmed);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 gap-10">

      {/* Title block */}
      <div className="flex flex-col items-center gap-5">
        <PixelSwordsCrossed size={4} />
        <h1 className="text-3xl text-yellow-400 pixel-shadow tracking-wide">
          CODEBATTLE
        </h1>
        <p className="text-[9px] text-gray-400 pixel-shadow text-center leading-6">
          1V1 REAL-TIME TRIVIA
        </p>
      </div>

      {/* Form panel */}
      <form
        onSubmit={handleSubmit}
        className="pixel-panel w-full max-w-xs flex flex-col gap-5 p-6"
      >
        <label className="text-[9px] text-gray-300 pixel-shadow uppercase">
          Your Username
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="CODESLAYER99"
          maxLength={20}
          className="bg-black text-yellow-400 border-2 border-gray-600 px-3 py-3 text-[10px] focus:outline-none focus:border-yellow-400 placeholder-gray-600 w-full"
          autoFocus
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        />
        {error && (
          <p className="text-red-400 text-[8px] pixel-shadow">{error}</p>
        )}
        <button
          type="submit"
          className="pixel-btn bg-yellow-400 text-gray-950 text-[10px] py-3 w-full pixel-shadow uppercase"
        >
          Enter Matchmaking
        </button>
      </form>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="w-full max-w-xs">
          <Leaderboard entries={leaderboard} />
        </div>
      )}
    </div>
  );
}
