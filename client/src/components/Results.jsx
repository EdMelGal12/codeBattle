import { PixelCrown, PixelSkull, PixelShield } from './PixelArt';
import Leaderboard from './Leaderboard';

export default function Results({ result, username, opponent, onPlayAgain, leaderboard }) {
  const { winner, yourScore, opponentScore, questions } = result;
  const isWinner = winner === username;
  const isDraw   = winner === null;

  const sprite = isDraw
    ? <PixelShield size={7} />
    : isWinner
    ? <PixelCrown size={7} />
    : <PixelSkull size={7} />;

  const bannerBorder = isDraw
    ? 'border-gray-500'
    : isWinner
    ? 'border-yellow-400'
    : 'border-red-500';

  const bannerText = isDraw
    ? 'text-gray-300'
    : isWinner
    ? 'text-yellow-400'
    : 'text-red-400';

  const bannerLabel = isDraw ? 'DRAW!' : isWinner ? 'YOU WIN!' : 'YOU LOSE!';

  return (
    <div
      className="flex flex-col items-center min-h-screen px-4 py-10 gap-7 max-w-2xl mx-auto w-full"
      style={{ animation: 'pixelFlicker 4s linear infinite' }}
    >
      {/* Banner */}
      <div className={`pixel-panel w-full flex flex-col items-center gap-5 py-10 border-4 ${bannerBorder}`}>
        {sprite}
        <h2 className={`text-2xl pixel-shadow ${bannerText}`}>
          {bannerLabel}
        </h2>
        {!isDraw && (
          <p className="text-[8px] text-gray-400 pixel-shadow leading-6 text-center">
            {isWinner
              ? `GG ${(opponent?.username || 'OPPONENT').toUpperCase()}!`
              : `GG ${winner?.toUpperCase()}!`}
          </p>
        )}
      </div>

      {/* Score breakdown */}
      <div className="pixel-panel w-full flex justify-around py-6 px-4">
        <div className="flex flex-col items-center gap-3">
          <span className="text-[7px] text-gray-500 pixel-shadow">YOUR SCORE</span>
          <span className="text-4xl text-yellow-400 pixel-shadow">{yourScore}</span>
          <span className="text-[7px] text-gray-300 pixel-shadow">{username?.slice(0,10).toUpperCase()}</span>
        </div>
        <div className="text-[9px] text-gray-600 pixel-shadow self-center">VS</div>
        <div className="flex flex-col items-center gap-3">
          <span className="text-[7px] text-gray-500 pixel-shadow">THEIR SCORE</span>
          <span className="text-4xl text-blue-400 pixel-shadow">{opponentScore}</span>
          <span className="text-[7px] text-gray-300 pixel-shadow">
            {(opponent?.username || 'OPPONENT').slice(0,10).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Answer review */}
      {questions?.length > 0 && (
        <div className="pixel-panel w-full p-4 flex flex-col gap-3">
          <h3 className="text-[8px] text-gray-400 pixel-shadow">ANSWERS</h3>
          <div className="flex flex-col gap-3 max-h-44 overflow-y-auto pr-1">
            {questions.map((q, i) => (
              <div key={i} className="flex flex-col gap-1">
                <p className="text-[7px] text-gray-300 pixel-shadow leading-5">
                  {i + 1}. {q.question}
                </p>
                <p className="text-[7px] text-green-400 pixel-shadow leading-5 pl-3">
                  ANS: {q.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Play Again */}
      <button
        onClick={onPlayAgain}
        className="pixel-btn bg-yellow-400 text-gray-950 text-[10px] py-3 px-10 pixel-shadow uppercase"
      >
        Play Again
      </button>

      {/* Session leaderboard */}
      {leaderboard.length > 0 && (
        <div className="w-full">
          <Leaderboard entries={leaderboard} />
        </div>
      )}
    </div>
  );
}
