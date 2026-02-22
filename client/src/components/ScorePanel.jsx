export default function ScorePanel({ username, myScore, opponentName, opponentScore, myElo, opponentElo }) {
  return (
    <div className="pixel-panel flex justify-between items-center px-5 py-4 border border-gray-800">
      {/* You — RED */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-[7px] text-gray-600 pixel-shadow uppercase">&gt; You</span>
        <span className="text-2xl text-red-500 pixel-shadow">{myScore}</span>
        <span className="text-[7px] text-gray-400 pixel-shadow truncate max-w-[90px]">
          {username?.slice(0, 10).toUpperCase()}
        </span>
        {myElo != null && (
          <span className="text-[6px] text-red-800 pixel-shadow">[{myElo}]</span>
        )}
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="text-[8px] text-gray-700 pixel-shadow">VS</span>
      </div>

      {/* Opponent — BLUE */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-[7px] text-gray-600 pixel-shadow uppercase">&gt; Opp</span>
        <span className="text-2xl text-blue-500 pixel-shadow">{opponentScore}</span>
        <span className="text-[7px] text-gray-400 pixel-shadow truncate max-w-[90px]">
          {(opponentName || 'OPPONENT').slice(0, 10).toUpperCase()}
        </span>
        {opponentElo != null && (
          <span className="text-[6px] text-blue-800 pixel-shadow">[{opponentElo}]</span>
        )}
      </div>
    </div>
  );
}
