export default function Countdown({ value, opponent }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4">
      {opponent && (
        <p className="text-gray-400 text-lg">
          You vs{' '}
          <span className="text-yellow-400 font-bold">{opponent.username}</span>
        </p>
      )}

      <div className="relative flex items-center justify-center w-48 h-48">
        {/* Glowing background ring */}
        <div className="absolute inset-0 rounded-full border-4 border-yellow-400/30 animate-ping" />
        <div className="absolute inset-0 rounded-full border-4 border-yellow-400/60" />

        <span
          key={value}
          className="text-8xl font-black text-yellow-400 animate-[scale-in_0.3s_ease-out]"
          style={{ animation: 'scaleIn 0.3s ease-out' }}
        >
          {value}
        </span>
      </div>

      <p className="text-gray-400 text-xl font-semibold uppercase tracking-widest">
        Get Ready!
      </p>

      <style>{`
        @keyframes scaleIn {
          from { transform: scale(1.8); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  );
}
