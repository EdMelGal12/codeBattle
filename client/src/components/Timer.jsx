export default function Timer({ timeLeft, total = 30 }) {
  const filled    = Math.round((timeLeft / total) * 20);
  const isUrgent  = timeLeft < 10;
  const isWarning = timeLeft < 20;

  const blockColor = isUrgent ? '#cc2222' : isWarning ? '#cc8800' : '#226622';

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className={`text-[7px] pixel-shadow ${isUrgent ? 'text-red-600' : 'text-gray-700'}`}>
          &gt; TIME
        </span>
        <span
          className={`text-[11px] pixel-shadow ${isUrgent ? 'text-red-500' : 'text-gray-400'}`}
          style={isUrgent ? { animation: 'blink 0.6s step-end infinite' } : {}}
        >
          {timeLeft}s
        </span>
      </div>

      {/* Segmented block bar — no rounding */}
      <div className="flex gap-[2px] w-full">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-3"
            style={{
              backgroundColor: i < filled ? blockColor : '#111111',
              border: '1px solid #1a1a1a',
            }}
          />
        ))}
      </div>
    </div>
  );
}
