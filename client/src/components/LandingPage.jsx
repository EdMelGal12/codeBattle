import { useState } from 'react';
import Leaderboard from './Leaderboard';

export default function LandingPage({ onEnterQueue, leaderboard }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      setError('Please enter a username.');
      return;
    }
    if (trimmed.length > 20) {
      setError('Username must be 20 characters or fewer.');
      return;
    }
    setError('');
    onEnterQueue(trimmed);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 gap-10">
      {/* Title */}
      <div className="text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-white">
          Code<span className="text-yellow-400">Battle</span>
        </h1>
        <p className="mt-2 text-gray-400 text-lg">
          1v1 real-time trivia. First to answer wins.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-sm shadow-xl flex flex-col gap-4"
      >
        <label className="text-gray-300 font-semibold text-sm uppercase tracking-wider">
          Your username
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. CodeNinja42"
          maxLength={20}
          className="bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-gray-500"
          autoFocus
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          className="bg-yellow-400 hover:bg-yellow-300 text-gray-950 font-bold py-3 rounded-lg text-base transition-colors"
        >
          Enter Matchmaking
        </button>
      </form>

      {/* Session Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="w-full max-w-sm">
          <Leaderboard entries={leaderboard} />
        </div>
      )}
    </div>
  );
}
