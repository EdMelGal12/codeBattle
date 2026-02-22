import { useEffect, useRef } from 'react';

const CHARS = '01{}[]()<>=#/\\|functionconstletvarreturnifelse=>async';
const FONT_SIZE = 14;
const COLOR = '#00ff33';

export default function CodeBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const cols = () => Math.floor(canvas.width / FONT_SIZE);
    let drops = [];
    const resetDrops = () => {
      drops = Array.from({ length: cols() }, () => Math.random() * -canvas.height / FONT_SIZE);
    };
    resetDrops();
    window.addEventListener('resize', resetDrops);

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = COLOR;
      ctx.font = `${FONT_SIZE}px monospace`;

      const numCols = cols();
      for (let i = 0; i < numCols; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        ctx.fillText(char, i * FONT_SIZE, drops[i] * FONT_SIZE);

        if (drops[i] * FONT_SIZE > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += 0.5;
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('resize', resetDrops);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      'fixed',
        inset:         0,
        zIndex:        0,
        pointerEvents: 'none',
        opacity:       0.12,
        filter:        'blur(4px)',
      }}
    />
  );
}
