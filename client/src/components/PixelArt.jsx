// SVG pixel-art sprites. Each sprite is a 2D array where each number
// maps to a color (0 = transparent). Rendered as a grid of SVG <rect> elements.

function PixelSprite({ pixels, colors, pixelSize = 5 }) {
  const rows = pixels.length;
  const cols = pixels[0].length;
  return (
    <svg
      width={cols * pixelSize}
      height={rows * pixelSize}
      style={{ imageRendering: 'pixelated', display: 'block' }}
    >
      {pixels.map((row, y) =>
        row.map((colorIdx, x) => {
          if (colorIdx === 0) return null;
          return (
            <rect
              key={`${x}-${y}`}
              x={x * pixelSize}
              y={y * pixelSize}
              width={pixelSize}
              height={pixelSize}
              fill={colors[colorIdx]}
            />
          );
        })
      )}
    </svg>
  );
}

// ── Sprite data ──────────────────────────────────────────────────────────────

const CROWN_PIXELS = [
  [0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0],
  [0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0],
  [0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0],
  [0,1,1,2,0,0,2,0,1,2,0,2,1,2,0,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,1,1,1,1,1,1,1,1,1,1,1,1,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,3,1,1,1,1,1,1,1,1,1,1,1,1,3,1],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
];
const CROWN_COLORS = { 1: '#FFAA00', 2: '#FFE066', 3: '#C87800' };

const SKULL_PIXELS = [
  [0,0,1,1,1,1,1,1,0,0],
  [0,1,1,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1,1,1],
  [1,1,2,2,1,1,2,2,1,1],
  [1,1,2,2,1,1,2,2,1,1],
  [1,1,1,1,1,1,1,1,1,1],
  [1,1,3,1,1,1,1,3,1,1],
  [0,1,1,1,1,1,1,1,1,0],
  [0,0,1,2,1,1,2,1,0,0],
  [0,0,1,1,0,0,1,1,0,0],
];
const SKULL_COLORS = { 1: '#C8C8C8', 2: '#111111', 3: '#909090' };

const SHIELD_PIXELS = [
  [0,1,1,1,1,1,1,1,1,0],
  [1,1,1,2,2,2,2,1,1,1],
  [1,1,1,2,1,1,2,1,1,1],
  [1,1,1,2,2,2,2,1,1,1],
  [1,2,1,1,1,1,1,1,2,1],
  [1,2,1,1,1,1,1,1,2,1],
  [0,1,2,1,1,1,1,2,1,0],
  [0,0,1,1,1,1,1,1,0,0],
  [0,0,0,1,1,1,1,0,0,0],
  [0,0,0,0,1,1,0,0,0,0],
];
const SHIELD_COLORS = { 1: '#7090C0', 2: '#E0E8FF', 3: '#4060A0' };

// Diagonal diamond sword (top-right blade → bottom-left handle)
const SWORD_PIXELS = [
  [0,0,0,0,0,0,0,0,0,1,2,3],
  [0,0,0,0,0,0,0,0,1,2,3,0],
  [0,0,0,0,0,0,0,1,2,3,0,0],
  [0,0,0,0,0,0,1,2,3,0,0,0],
  [0,0,0,0,0,1,2,3,0,0,0,0],
  [0,0,0,0,4,2,3,0,0,0,0,0],
  [0,0,0,4,4,3,0,0,0,0,0,0],
  [0,0,5,5,0,0,0,0,0,0,0,0],
  [0,5,5,0,0,0,0,0,0,0,0,0],
  [5,5,0,0,0,0,0,0,0,0,0,0],
  [5,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0],
];
const SWORD_COLORS = { 1: '#C8F0FF', 2: '#5DE4E4', 3: '#2AACAC', 4: '#FFAA00', 5: '#8B5E3C' };

// Two swords crossed (mirrored) for the logo/title area
const SWORDS_CROSSED_PIXELS = [
  [0,0,0,0,0,0,0,0,0,1,2,3,  0,3,2,1,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,1,2,3,0,  0,0,3,2,1,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,1,2,3,0,0,  0,0,0,3,2,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,2,3,0,0,0,  0,0,0,0,3,2,1,0,0,0,0,0],
  [0,0,0,0,0,1,2,3,0,0,0,0,  0,0,0,0,0,3,2,1,0,0,0,0],
  [0,0,0,0,4,4,3,0,0,0,0,0,  0,0,0,0,0,0,3,4,4,0,0,0],
  [0,0,0,4,0,3,0,0,0,0,0,0,  0,0,0,0,0,0,0,3,0,4,0,0],
  [0,0,5,5,0,0,0,0,0,0,0,0,  0,0,0,0,0,0,0,0,5,5,0,0],
  [0,5,5,0,0,0,0,0,0,0,0,0,  0,0,0,0,0,0,0,0,0,5,5,0],
  [5,5,0,0,0,0,0,0,0,0,0,0,  0,0,0,0,0,0,0,0,0,0,5,5],
];
const SWORDS_COLORS = { 1: '#C8F0FF', 2: '#5DE4E4', 3: '#2AACAC', 4: '#FFAA00', 5: '#8B5E3C' };

// ── Exported components ──────────────────────────────────────────────────────

export function PixelCrown({ size = 5 }) {
  return <PixelSprite pixels={CROWN_PIXELS} colors={CROWN_COLORS} pixelSize={size} />;
}

export function PixelSkull({ size = 5 }) {
  return <PixelSprite pixels={SKULL_PIXELS} colors={SKULL_COLORS} pixelSize={size} />;
}

export function PixelShield({ size = 5 }) {
  return <PixelSprite pixels={SHIELD_PIXELS} colors={SHIELD_COLORS} pixelSize={size} />;
}

export function PixelSword({ size = 5 }) {
  return <PixelSprite pixels={SWORD_PIXELS} colors={SWORD_COLORS} pixelSize={size} />;
}

export function PixelSwordsCrossed({ size = 4 }) {
  return <PixelSprite pixels={SWORDS_CROSSED_PIXELS} colors={SWORDS_COLORS} pixelSize={size} />;
}
