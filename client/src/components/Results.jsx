import Leaderboard from './Leaderboard';

export default function Results({ result, username, opponent, onPlayAgain, leaderboard }) {
  const { winner, yourScore, opponentScore, questions } = result;
  const isWinner = winner === username;
  const isDraw = winner === null;

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-10 gap-8 max-w-2xl mx-auto w-full">
      {/* Banner */}
      <div
        className={`w-full rounded-2xl py-10 flex flex-col items-center gap-2 border ${
          isDraw
            ? 'bg-gray-800 border-gray-600'
            : isWinner
            ? 'bg-yellow-400/10 border-yellow-400'
            : 'bg-red-500/10 border-red-500'
        }`}
      >
        <span className="text-5xl">{isDraw ? '🤝' : isWinner ? '🏆' : '💀'}</span>
        <h2
          className={`text-4xl font-black ${
            isDraw ? 'text-gray-300' : isWinner ? 'text-yellow-400' : 'text-red-400'
          }`}
        >
          {isDraw ? 'Draw!' : isWinner ? 'You Win!' : 'You Lose!'}
        </h2>
        {!isDraw && (
          <p className="text-gray-400 text-sm">
            {isWinner
              ? `Better luck next time, ${opponent?.username || 'opponent'}!`
              : `Good game, ${winner}!`}
          </p>
        )}
      </div>

      {/* Score breakdown */}
      <div className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-6 flex justify-around">
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Your Score</p>
          <p className="text-4xl font-black text-yellow-400">{yourScore}</p>
          <p className="text-sm text-gray-400 mt-1">{username}</p>
        </div>
        <div className="text-gray-600 text-2xl font-bold self-center">VS</div>
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Their Score</p>
          <p className="text-4xl font-black text-blue-400">{opponentScore}</p>
          <p className="text-sm text-gray-400 mt-1">{opponent?.username || 'Opponent'}</p>
        </div>
      </div>

      {/* Answers review */}
      {questions && questions.length > 0 && (
        <div className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-5 flex flex-col gap-3">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Question Answers</h3>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {questions.map((q, i) => (
              <div key={i} className="flex flex-col gap-0.5 text-sm">
                <p className="text-gray-300 leading-snug">{i + 1}. {q.question}</p>
                <p className="text-green-400 font-semibold pl-3">→ {q.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Play Again */}
      <button
        onClick={onPlayAgain}
        className="bg-yellow-400 hover:bg-yellow-300 text-gray-950 font-bold py-3 px-10 rounded-xl text-base transition-colors"
      >
        Play Again
      </button>

      {/* Session Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="w-full">
          <Leaderboard entries={leaderboard} />
        </div>
      )}
    </div>
  );
}
