import { PixelSword } from './PixelArt';

export default function Matchmaking({ username, onCancel }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-10 px-4">

      {/* Pixel sword spinner */}
      <div
        className="flex items-center justify-center"
        style={{ animation: 'pixelFlicker 2s linear infinite' }}
      >
        <PixelSword size={6} />
      </div>

      {/* Status text */}
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-yellow-400 text-[11px] pixel-shadow">
          FINDING OPPONENT...
        </p>
        <p className="text-gray-500 text-[8px] pixel-shadow leading-6">
          SEARCHING AS{' '}
          <span className="text-white">{username.toUpperCase()}</span>
        </p>
      </div>

      {/* Pixel block chase loader */}
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-4 h-4 bg-yellow-400"
            style={{
              animation: 'pixelChase 1.2s linear infinite',
              animationDelay: `${i * 0.24}s`,
            }}
          />
        ))}
      </div>

      <button
        onClick={onCancel}
        className="text-gray-600 hover:text-gray-300 text-[8px] pixel-shadow underline"
      >
        CANCEL
      </button>
    </div>
  );
}
