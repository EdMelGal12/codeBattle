import { PixelCrown } from './PixelArt';

export default function Leaderboard({ entries }) {
  if (!entries || entries.length === 0) return null;

  const sorted = [...entries].sort((a, b) => b.wins - a.wins || a.losses - b.losses);

  return (
    <div className="pixel-panel p-4 flex flex-col gap-4 border border-gray-800">
      <h3 className="text-[8px] text-gray-600 pixel-shadow">
        &gt; SESSION BOARD
      </h3>
      <hr className="term-divider" />
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left pb-3 text-[7px] text-gray-600 pixel-shadow font-normal">PLAYER</th>
            <th className="text-center pb-3 text-[7px] text-gray-600 pixel-shadow font-normal">W</th>
            <th className="text-center pb-3 text-[7px] text-gray-600 pixel-shadow font-normal">L</th>
            <th className="text-center pb-3 text-[7px] text-gray-600 pixel-shadow font-normal">D</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry, i) => (
            <tr key={entry.username} style={{ borderTop: '1px solid #1a1a1a' }}>
              <td className="py-3 text-[7px]">
                <div className="flex items-center gap-2">
                  {i === 0 && <PixelCrown size={2} />}
                  <span className="text-gray-300 pixel-shadow">
                    {entry.username.slice(0, 12).toUpperCase()}
                  </span>
                </div>
              </td>
              <td className="py-3 text-center text-[8px] text-red-500 pixel-shadow">{entry.wins}</td>
              <td className="py-3 text-center text-[8px] text-blue-500 pixel-shadow">{entry.losses}</td>
              <td className="py-3 text-center text-[8px] text-gray-600 pixel-shadow">{entry.draws || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
