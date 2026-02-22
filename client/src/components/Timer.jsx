export default function Timer({ timeLeft, total = 30 }) {
  const filled = Math.round((timeLeft / total) * 20); // 20-block bar
  const isUrgent  = timeLeft < 10;
  const isWarning = timeLeft < 20;

  const blockColor = isUrgent
    ? 'bg-red-500'
    : isWarning
    ? 'bg-yellow-400'
    : 'bg-green-500';

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className={`text-[8px] pixel-shadow ${isUrgent ? 'text-red-400 animate-pulse' : 'text-gray-400'}`}>
          TIME
        </span>
        <span className={`text-[11px] pixel-shadow ${isUrgent ? 'text-red-400 animate-pulse' : 'text-white'}`}>
          {timeLeft}s
        </span>
      </div>

      {/* Segmented pixel block bar */}
      <div className="flex gap-[2px] w-full">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-4 ${i < filled ? blockColor : 'bg-gray-800'}`}
          />
        ))}
      </div>
    </div>
  );
}
