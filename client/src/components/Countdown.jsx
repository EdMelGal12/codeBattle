function multLabel(m) {
  return Number.isInteger(m) ? `${m}x` : `${m.toFixed(1)}x`;
}

export default function Countdown({ value, opponent, multiplier }) {
  const showMult = multiplier && multiplier > 1;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4">

      {opponent && (
        <p className="text-[8px] text-gray-600 pixel-shadow leading-7 text-center">
          YOU &gt;&gt; VS &lt;&lt;{' '}
          <span className="text-blue-500">{opponent.username.toUpperCase()}</span>
        </p>
      )}

      {/* Active multiplier notice */}
      {showMult && (
        <div className="pixel-panel px-6 py-2 border border-red-900 text-center">
          <span className="text-[8px] text-red-500 pixel-shadow" style={{ animation: 'blink 1s step-end infinite' }}>
            STREAK BONUS: {multLabel(multiplier)}
          </span>
        </div>
      )}

      <div
        className="pixel-panel flex items-center justify-center border border-gray-800"
        style={{ width: 160, height: 160 }}
      >
        <span
          key={value}
          className="text-7xl text-red-500 pixel-shadow"
          style={{ animation: 'pixelStamp 0.35s ease-out both' }}
        >
          {value}
        </span>
      </div>

      <div className="flex gap-[3px]">
        {[5, 4, 3, 2, 1].map((tick) => (
          <div
            key={tick}
            className="w-8 h-4"
            style={{ backgroundColor: tick >= value ? '#cc2222' : '#1a1a1a', border: '1px solid #2a2a2a' }}
          />
        ))}
      </div>

      <p className="text-[8px] text-gray-700 pixel-shadow uppercase tracking-widest">GET READY</p>
    </div>
  );
}
