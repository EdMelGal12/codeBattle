export default function Leaderboard({ entries }) {
  if (!entries || entries.length === 0) return null;

  const sorted = [...entries].sort((a, b) => b.wins - a.wins || a.losses - b.losses);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 flex flex-col gap-3">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
        Session Leaderboard
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-gray-700">
            <th className="text-left py-2 font-semibold">Player</th>
            <th className="text-center py-2 font-semibold">W</th>
            <th className="text-center py-2 font-semibold">L</th>
            <th className="text-center py-2 font-semibold">D</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry, i) => (
            <tr key={entry.username} className="border-b border-gray-800 last:border-0">
              <td className="py-2 text-white font-semibold flex items-center gap-2">
                {i === 0 && <span className="text-yellow-400">👑</span>}
                <span>{entry.username}</span>
              </td>
              <td className="py-2 text-center text-green-400 font-bold">{entry.wins}</td>
              <td className="py-2 text-center text-red-400 font-bold">{entry.losses}</td>
              <td className="py-2 text-center text-gray-400 font-bold">{entry.draws || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
