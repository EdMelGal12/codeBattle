import { PixelCrown } from './PixelArt';

export default function Leaderboard({ entries }) {
  if (!entries || entries.length === 0) return null;

  const sorted = [...entries].sort((a, b) => b.wins - a.wins || a.losses - b.losses);

  return (
    <div className="pixel-panel p-4 flex flex-col gap-4">
      <h3 className="text-[8px] text-gray-400 pixel-shadow uppercase">
        Session Board
      </h3>
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-gray-700">
            <th className="text-left pb-2 text-[7px] text-gray-500 pixel-shadow font-normal">PLAYER</th>
            <th className="text-center pb-2 text-[7px] text-gray-500 pixel-shadow font-normal">W</th>
            <th className="text-center pb-2 text-[7px] text-gray-500 pixel-shadow font-normal">L</th>
            <th className="text-center pb-2 text-[7px] text-gray-500 pixel-shadow font-normal">D</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry, i) => (
            <tr key={entry.username} className="border-b border-gray-800 last:border-0">
              <td className="py-3 flex items-center gap-2">
                {i === 0 && <PixelCrown size={2} />}
                <span className="text-[7px] text-white pixel-shadow">
                  {entry.username.slice(0, 10).toUpperCase()}
                </span>
              </td>
              <td className="py-3 text-center text-[8px] text-green-400 pixel-shadow">{entry.wins}</td>
              <td className="py-3 text-center text-[8px] text-red-400 pixel-shadow">{entry.losses}</td>
              <td className="py-3 text-center text-[8px] text-gray-400 pixel-shadow">{entry.draws || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
