export default function ScorePanel({ username, myScore, opponentName, opponentScore }) {
  return (
    <div className="flex justify-between items-center bg-gray-900 border border-gray-700 rounded-xl px-6 py-3">
      <div className="text-center">
        <p className="text-xs text-gray-500 uppercase tracking-wider">You</p>
        <p className="text-xl font-black text-yellow-400">{myScore}</p>
        <p className="text-sm text-gray-300 font-semibold truncate max-w-[120px]">{username}</p>
      </div>

      <div className="text-gray-600 font-bold text-lg">VS</div>

      <div className="text-center">
        <p className="text-xs text-gray-500 uppercase tracking-wider">Opponent</p>
        <p className="text-xl font-black text-blue-400">{opponentScore}</p>
        <p className="text-sm text-gray-300 font-semibold truncate max-w-[120px]">
          {opponentName || 'Opponent'}
        </p>
      </div>
    </div>
  );
}
