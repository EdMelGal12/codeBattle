export default function Matchmaking({ username, onCancel }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-4">
      {/* Animated ring */}
      <div className="relative w-28 h-28">
        <div className="absolute inset-0 rounded-full border-4 border-yellow-400 border-t-transparent animate-spin" />
        <div className="absolute inset-4 rounded-full border-4 border-yellow-400/30 border-b-transparent animate-spin animate-[spin_1.5s_linear_infinite_reverse]" />
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">Finding an opponent…</h2>
        <p className="text-gray-400 mt-1">
          Searching as <span className="text-yellow-400 font-semibold">{username}</span>
        </p>
      </div>

      {/* Pulsing dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-3 h-3 rounded-full bg-yellow-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>

      <button
        onClick={onCancel}
        className="text-gray-500 hover:text-gray-300 text-sm underline transition-colors"
      >
        Cancel search
      </button>
    </div>
  );
}
