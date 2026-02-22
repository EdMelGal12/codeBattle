import { useState, useEffect } from 'react';
import { PixelCrown } from './PixelArt';
import { getSocket } from '../hooks/useSocket';

export default function Leaderboard({ entries }) {
  const [tab,       setTab]    = useState('session');
  const [global,    setGlobal] = useState([]);
  const [loading,   setLoading] = useState(false);

  useEffect(() => {
    if (tab !== 'global') return;
    setLoading(true);
    getSocket().emit('get_top_players', {}, (data) => {
      setGlobal(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, [tab]);

  const hasSession = entries && entries.length > 0;
  if (!hasSession && tab === 'session') return null;

  const sessionSorted = [...(entries || [])].sort((a, b) => (b.elo ?? 1200) - (a.elo ?? 1200) || b.wins - a.wins);
  const displayRows   = tab === 'session' ? sessionSorted : global;

  return (
    <div className="pixel-panel p-4 flex flex-col gap-4 border border-gray-800">
      {/* Tabs */}
      <div className="flex gap-4">
        <button
          onClick={() => setTab('session')}
          className={`text-[7px] pixel-shadow ${tab === 'session' ? 'text-red-500' : 'text-gray-600 hover:text-gray-400'}`}
        >
          &gt; SESSION
        </button>
        <button
          onClick={() => setTab('global')}
          className={`text-[7px] pixel-shadow ${tab === 'global' ? 'text-red-500' : 'text-gray-600 hover:text-gray-400'}`}
        >
          &gt; GLOBAL
        </button>
      </div>
      <hr className="term-divider" />

      {loading && (
        <p className="text-[7px] text-gray-600 pixel-shadow">LOADING...</p>
      )}

      {!loading && displayRows.length === 0 && (
        <p className="text-[7px] text-gray-600 pixel-shadow">NO DATA YET.</p>
      )}

      {!loading && displayRows.length > 0 && (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left pb-3 text-[7px] text-gray-600 pixel-shadow font-normal">PLAYER</th>
              <th className="text-center pb-3 text-[7px] text-gray-600 pixel-shadow font-normal">ELO</th>
              <th className="text-center pb-3 text-[7px] text-gray-600 pixel-shadow font-normal">W</th>
              <th className="text-center pb-3 text-[7px] text-gray-600 pixel-shadow font-normal">L</th>
              <th className="text-center pb-3 text-[7px] text-gray-600 pixel-shadow font-normal">D</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((entry, i) => (
              <tr key={entry.username} style={{ borderTop: '1px solid #1a1a1a' }}>
                <td className="py-3 text-[7px]">
                  <div className="flex items-center gap-2">
                    {i === 0 && <PixelCrown size={2} />}
                    <span className="text-gray-300 pixel-shadow">
                      {entry.username.slice(0, 12).toUpperCase()}
                    </span>
                  </div>
                </td>
                <td className="py-3 text-center text-[8px] pixel-shadow font-bold" style={{ color: '#cc9900' }}>
                  {entry.elo ?? 1200}
                </td>
                <td className="py-3 text-center text-[8px] text-red-500 pixel-shadow">{entry.wins}</td>
                <td className="py-3 text-center text-[8px] text-blue-500 pixel-shadow">{entry.losses}</td>
                <td className="py-3 text-center text-[8px] text-gray-600 pixel-shadow">{entry.draws || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
