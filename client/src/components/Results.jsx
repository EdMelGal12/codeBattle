import { PixelCrown, PixelSkull, PixelShield } from './PixelArt';
import PixelFireworks from './PixelFireworks';
import Leaderboard from './Leaderboard';

function multLabel(m) {
  return Number.isInteger(m) ? `${m}x` : `${m.toFixed(1)}x`;
}

export default function Results({ result, username, opponent, onPlayAgain, leaderboard, winStreak }) {
  const { winner, yourScore, opponentScore, questions } = result;
  const isWinner = winner === username;
  const isDraw   = winner === null;

  const sprite      = isDraw ? <PixelShield size={7} /> : isWinner ? <PixelCrown size={7} /> : <PixelSkull size={7} />;
  const bannerBorder = isDraw ? '#333333' : isWinner ? '#cc2222' : '#333333';
  const bannerBg     = isDraw ? '#0d0d0d' : isWinner ? '#0f0000' : '#0a0000';
  const labelColor   = isDraw ? '#666666' : isWinner ? '#ff4444' : '#444444';
  const bannerLabel  = isDraw ? 'DRAW' : isWinner ? 'YOU WIN' : 'YOU LOSE';

  // Streak shown on win (it's already been incremented by the time Results renders)
  const streakOnWin = isWinner ? winStreak : 0;

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-8 gap-6 max-w-2xl mx-auto w-full">

      {/* Pixel fireworks — winner only, intensity scales with streak */}
      {isWinner && <PixelFireworks streak={streakOnWin} />}

      {/* Banner */}
      <div
        className="w-full flex flex-col items-center gap-5 py-10 border"
        style={{ backgroundColor: bannerBg, borderColor: bannerBorder, animation: 'pixelFlicker 5s linear infinite' }}
      >
        {sprite}
        <h2 className="text-2xl pixel-shadow mt-2" style={{ color: labelColor }}>
          {bannerLabel}
        </h2>

        {/* Streak badge — winner only */}
        {isWinner && streakOnWin > 0 && (
          <div className="pixel-panel px-5 py-2 border border-red-900 flex flex-col items-center gap-2 mt-1">
            <span className="text-[7px] text-gray-600 pixel-shadow">WIN STREAK</span>
            <span className="text-xl text-red-500 pixel-shadow">{streakOnWin}</span>
            <span className="text-[7px] text-gray-600 pixel-shadow">
              NEXT GAME: {multLabel(Math.min(1 + streakOnWin * 0.5, 3))} MULTIPLIER
            </span>
          </div>
        )}

        {!isDraw && (
          <p className="text-[8px] text-gray-600 pixel-shadow leading-6 text-center mt-1">
            {isWinner
              ? `GG ${(opponent?.username || 'OPPONENT').toUpperCase()}`
              : `GG ${winner?.toUpperCase()}`}
          </p>
        )}
      </div>

      {/* Score breakdown */}
      <div className="pixel-panel w-full flex justify-around py-6 px-4 border border-gray-800">
        <div className="flex flex-col items-center gap-3">
          <span className="text-[7px] text-gray-600 pixel-shadow">&gt; YOUR SCORE</span>
          <span className="text-4xl text-red-500 pixel-shadow">{yourScore}</span>
          <span className="text-[7px] text-gray-500 pixel-shadow">{username?.slice(0, 10).toUpperCase()}</span>
        </div>
        <div className="text-[8px] text-gray-700 pixel-shadow self-center">VS</div>
        <div className="flex flex-col items-center gap-3">
          <span className="text-[7px] text-gray-600 pixel-shadow">&gt; THEIR SCORE</span>
          <span className="text-4xl text-blue-500 pixel-shadow">{opponentScore}</span>
          <span className="text-[7px] text-gray-500 pixel-shadow">
            {(opponent?.username || 'OPPONENT').slice(0, 10).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Answer review */}
      {questions?.length > 0 && (
        <div className="pixel-panel w-full p-4 flex flex-col gap-3 border border-gray-800">
          <h3 className="text-[8px] text-gray-600 pixel-shadow">&gt; ANSWERS</h3>
          <hr className="term-divider" />
          <div className="flex flex-col gap-3 max-h-44 overflow-y-auto pr-1">
            {questions.map((q, i) => (
              <div key={i} className="flex flex-col gap-1">
                <p className="text-[7px] text-gray-500 pixel-shadow leading-5">
                  {String(i + 1).padStart(2, '0')}. {q.question}
                </p>
                <p className="text-[7px] text-green-600 pixel-shadow leading-5 pl-3">
                  ANS: {q.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Play Again — no pixel-shadow on button text (fixes doubled text bug) */}
      <button
        onClick={onPlayAgain}
        className="pixel-btn text-red-500 text-[10px] py-3 px-10 uppercase border border-red-900 hover:border-red-500"
      >
        &gt; Play Again
      </button>

      {/* Leaderboard */}
      <div className="w-full">
        <Leaderboard entries={leaderboard} />
      </div>
    </div>
  );
}
