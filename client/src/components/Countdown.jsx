export default function Countdown({ value, opponent }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4">

      {/* Versus label */}
      {opponent && (
        <p className="text-[9px] text-gray-400 pixel-shadow text-center leading-7">
          YOU VS{' '}
          <span className="text-yellow-400">{opponent.username.toUpperCase()}</span>
        </p>
      )}

      {/* Big countdown number with pixel stamp animation */}
      <div className="pixel-panel flex items-center justify-center w-40 h-40">
        <span
          key={value}
          className="text-7xl text-yellow-400 pixel-shadow"
          style={{ animation: 'pixelStamp 0.35s ease-out both' }}
        >
          {value}
        </span>
      </div>

      {/* Pixel block progress bar showing which tick we're on */}
      <div className="flex gap-2">
        {[5, 4, 3, 2, 1].map((tick) => (
          <div
            key={tick}
            className={`w-6 h-6 ${
              tick >= value ? 'bg-yellow-400' : 'bg-gray-700'
            }`}
          />
        ))}
      </div>

      <p className="text-[9px] text-gray-400 pixel-shadow uppercase tracking-widest">
        Get Ready
      </p>
    </div>
  );
}
