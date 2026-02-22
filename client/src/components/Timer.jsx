export default function Timer({ timeLeft, total = 30 }) {
  const pct = Math.max(0, (timeLeft / total) * 100);
  const isUrgent = timeLeft < 10;
  const isWarning = timeLeft < 20;

  const barColor = isUrgent
    ? 'bg-red-500'
    : isWarning
    ? 'bg-yellow-400'
    : 'bg-green-400';

  return (
    <div className="w-full flex flex-col gap-1">
      <div className="flex justify-between text-sm font-semibold">
        <span className={isUrgent ? 'text-red-400 animate-pulse' : 'text-gray-400'}>
          Time Left
        </span>
        <span className={isUrgent ? 'text-red-400 font-bold text-lg animate-pulse' : 'text-white font-bold text-lg'}>
          {timeLeft}s
        </span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
        <div
          className={`h-4 rounded-full transition-all duration-1000 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
