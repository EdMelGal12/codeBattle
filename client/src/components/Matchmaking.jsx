import { PixelSword } from './PixelArt';

function multLabel(m) {
  return Number.isInteger(m) ? `${m}x` : `${m.toFixed(1)}x`;
}

export default function Matchmaking({ username, onCancel, winStreak }) {
  const multiplier = Math.min(1 + winStreak * 0.5, 3);
  const showStreak = winStreak > 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-10 px-4">

      <div style={{ animation: 'pixelFlicker 3s linear infinite' }}>
        <PixelSword size={6} />
      </div>

      <div className="pixel-panel w-full max-w-xs p-6 flex flex-col gap-5 border border-gray-800">
        <p className="text-[8px] text-gray-600 pixel-shadow">&gt; STATUS</p>
        <hr className="term-divider" />
        <p className="text-[10px] text-red-500 pixel-shadow cursor leading-7">
          SEARCHING FOR OPPONENT
        </p>
        <p className="text-[8px] text-gray-600 pixel-shadow leading-6">
          USER: <span className="text-gray-300">{username.toUpperCase()}</span>
        </p>
        {showStreak && (
          <>
            <hr className="term-divider" />
            <p className="text-[8px] text-gray-600 pixel-shadow leading-6">
              STREAK: <span className="text-red-500">{winStreak}</span>
            </p>
            <p className="text-[8px] text-gray-600 pixel-shadow leading-6">
              MULTI:  <span className="text-red-500">{multLabel(multiplier)}</span>
            </p>
          </>
        )}
      </div>

      <div className="flex gap-[3px]">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="w-3 h-6 bg-red-700"
            style={{ animation: 'pixelChase 1.4s linear infinite', animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>

      {/* No pixel-shadow on button */}
      <button
        onClick={onCancel}
        className="pixel-btn text-[8px] text-gray-700 px-4 py-2 hover:text-gray-400"
      >
        &gt; CANCEL
      </button>
    </div>
  );
}
