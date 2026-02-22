export default function ScorePanel({ username, myScore, opponentName, opponentScore }) {
  return (
    <div className="pixel-panel flex justify-between items-center px-5 py-4">
      <div className="flex flex-col items-center gap-2">
        <span className="text-[7px] text-gray-500 pixel-shadow uppercase">You</span>
        <span className="text-2xl text-yellow-400 pixel-shadow">{myScore}</span>
        <span className="text-[7px] text-gray-300 pixel-shadow truncate max-w-[90px]">
          {username?.slice(0, 10).toUpperCase()}
        </span>
      </div>

      <div className="text-[9px] text-gray-600 pixel-shadow">VS</div>

      <div className="flex flex-col items-center gap-2">
        <span className="text-[7px] text-gray-500 pixel-shadow uppercase">Opponent</span>
        <span className="text-2xl text-blue-400 pixel-shadow">{opponentScore}</span>
        <span className="text-[7px] text-gray-300 pixel-shadow truncate max-w-[90px]">
          {(opponentName || 'OPPONENT').slice(0, 10).toUpperCase()}
        </span>
      </div>
    </div>
  );
}
