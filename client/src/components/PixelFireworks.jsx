import { useMemo } from 'react';

// Colors scale up in variety with streak
const COLOR_TIERS = [
  ['#ff4444', '#ff6666', '#4488ff', '#66aaff', '#ffffff'],                             // streak 0
  ['#ff4444', '#ff6666', '#4488ff', '#66aaff', '#ffffff', '#ff88cc', '#44ffcc'],       // streak 1
  ['#ff4444', '#ff6666', '#4488ff', '#66aaff', '#ffffff', '#ff88cc', '#44ffcc',
   '#ffff44', '#ff8800', '#aa44ff'],                                                   // streak 2
  ['#ff4444', '#ff6666', '#ff0000', '#4488ff', '#66aaff', '#0044ff', '#ffffff',
   '#ff88cc', '#44ffcc', '#ffff44', '#ff8800', '#aa44ff', '#00ffff', '#ff4400'],       // streak 3+
];

function getBurstConfig(streak) {
  if (streak >= 3) return { bursts: 14, perBurst: 22, minSize: 6, maxSize: 14, minSpeed: 90, maxSpeed: 200 };
  if (streak === 2) return { bursts: 11, perBurst: 18, minSize: 5, maxSize: 11, minSpeed: 80, maxSpeed: 170 };
  if (streak === 1) return { bursts:  9, perBurst: 15, minSize: 4, maxSize:  9, minSpeed: 75, maxSpeed: 150 };
  return              { bursts:  7, perBurst: 12, minSize: 4, maxSize:  8, minSpeed: 70, maxSpeed: 130 };
}

// Burst origin positions (cx%, cy%) — more origins for higher streaks
const ORIGINS = [
  [50, 25], [20, 45], [80, 35], [50, 60], [30, 20], [70, 55], [50, 38],
  [15, 30], [85, 50], [40, 70], [60, 15], [25, 65], [75, 25], [50, 50],
];

function makeBurst(cx, cy, count, startDelay, colors, minSize, maxSize, minSpeed, maxSpeed) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
    const size  = minSize + Math.floor(Math.random() * (maxSize - minSize + 1));
    return {
      id: `${cx}-${cy}-${i}-${startDelay}`,
      cx, cy,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      color: colors[Math.floor(Math.random() * colors.length)],
      size,
      delay:    startDelay + Math.random() * 180,
      duration: 650 + Math.random() * 450,
    };
  });
}

export default function PixelFireworks({ streak = 0 }) {
  const config = getBurstConfig(streak);
  const colors = COLOR_TIERS[Math.min(streak, COLOR_TIERS.length - 1)];

  const particles = useMemo(() => {
    const result = [];
    const origins = ORIGINS.slice(0, config.bursts);
    // Stagger bursts: faster gaps for higher streaks
    const gapMs = streak >= 3 ? 200 : streak === 2 ? 260 : streak === 1 ? 300 : 350;

    origins.forEach(([ cx, cy ], i) => {
      result.push(...makeBurst(
        cx, cy,
        config.perBurst,
        i * gapMs,
        colors,
        config.minSize, config.maxSize,
        config.minSpeed, config.maxSpeed,
      ));
    });
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streak]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 60 }}>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.cx}%`,
            top:  `${p.cy}%`,
            width:  p.size,
            height: p.size,
            backgroundColor: p.color,
            imageRendering: 'pixelated',
            animation: `fireworkFly ${p.duration}ms ease-out ${p.delay}ms both`,
            '--fx': `${p.dx}px`,
            '--fy': `${p.dy}px`,
          }}
        />
      ))}
    </div>
  );
}
