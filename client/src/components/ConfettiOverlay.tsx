import React, { useEffect, useRef } from 'react';

export type ConfettiType = 'clap' | 'ribbons' | 'simple' | 'celebration' | string | null | undefined;

interface ConfettiOverlayProps {
  type: ConfettiType;
  className?: string;
  loopCycle?: boolean; // Default true: 5s animation -> 15s pause loop
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotSpeed: number;
  opacity: number;
  shape: 'rect' | 'circle' | 'ribbon' | 'emoji' | 'star';
  emoji?: string;
  swayFreq: number;
  swayAmp: number;
  age: number;
  maxAge: number;
}

const PALETTES = {
  clap: ['#FFB800', '#FF5A36', '#FF53C0', '#7B62FF', '#00C2FF', '#4CD964'],
  ribbons: ['#FF2A6D', '#05D9E8', '#D1F7FF', '#FFB800', '#9D4EDD', '#00F5D4'],
  simple: ['#FE6349', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'],
  celebration: ['#FFD700', '#FF4500', '#00BFFF', '#FF1493', '#32CD32', '#9400D3', '#FF8C00']
};

const EMOJIS = {
  clap: ['👏', '👏', '✨', '⭐', '🙌', '💖', '👏'],
  celebration: ['🎉', '🎈', '🥳', '🌟', '🎊', '✨', '🎈'],
  ribbons: ['🎀', '✨', '💫', '🌸', '🎀'],
  simple: ['✨', '⭐', '💫']
};

export const ConfettiOverlay: React.FC<ConfettiOverlayProps> = ({
  type,
  className = "absolute inset-0 pointer-events-none z-30 overflow-hidden rounded-[2rem]",
  loopCycle = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!type) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: Particle[] = [];
    let startTime = Date.now();
    let wasActive = false;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth || 380;
        canvas.height = parent.clientHeight || 474;
      }
    };

    resize();
    const resizeObserver = new ResizeObserver(() => resize());
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const palette = PALETTES[type as keyof typeof PALETTES] || PALETTES.simple;
    const emojiList = EMOJIS[type as keyof typeof EMOJIS] || EMOJIS.simple;

    const createParticle = (initialBurst = false): Particle => {
      const width = canvas.width || 380;
      const height = canvas.height || 474;

      const isEmoji = Math.random() < (type === 'clap' ? 0.45 : type === 'celebration' ? 0.35 : type === 'ribbons' ? 0.25 : 0.2);
      const isRibbon = type === 'ribbons' && !isEmoji && Math.random() < 0.6;
      const isStar = (type === 'simple' || type === 'celebration') && !isEmoji && Math.random() < 0.3;

      const shape: Particle['shape'] = isEmoji ? 'emoji' : isRibbon ? 'ribbon' : isStar ? 'star' : (Math.random() > 0.5 ? 'rect' : 'circle');

      const emoji = isEmoji ? emojiList[Math.floor(Math.random() * emojiList.length)] : undefined;
      const color = palette[Math.floor(Math.random() * palette.length)];

      let x = Math.random() * width;
      let y = initialBurst ? Math.random() * height * 0.8 : -20 - Math.random() * 40;

      let vx = (Math.random() - 0.5) * 2;
      let vy = Math.random() * 2 + 1.2;

      if (type === 'clap') {
        vy = (Math.random() - 0.7) * 2.5;
        vx = (Math.random() - 0.5) * 3;
        if (!initialBurst) y = height + 10;
      } else if (type === 'celebration' && initialBurst) {
        const angle = (Math.random() * 0.8 + 0.1) * -Math.PI;
        const speed = Math.random() * 8 + 3;
        x = width / 2;
        y = height * 0.7;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;
      }

      return {
        x,
        y,
        vx,
        vy,
        size: isEmoji ? Math.random() * 12 + 16 : isRibbon ? Math.random() * 18 + 14 : Math.random() * 8 + 6,
        color,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.12,
        opacity: Math.random() * 0.3 + 0.7,
        shape,
        emoji,
        swayFreq: Math.random() * 0.05 + 0.01,
        swayAmp: Math.random() * 2.5 + 0.8,
        age: 0,
        maxAge: Math.random() * 200 + 150
      };
    };

    const initBurst = () => {
      const particleCount = type === 'celebration' ? 55 : type === 'ribbons' ? 45 : 40;
      particles = Array.from({ length: particleCount }, () => createParticle(true));
    };

    initBurst();

    const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number, color: string) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };

    const drawRibbon = (ctx: CanvasRenderingContext2D, p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.beginPath();
      ctx.moveTo(-p.size / 2, 0);
      ctx.bezierCurveTo(-p.size / 4, -8, p.size / 4, 8, p.size / 2, 0);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
    };

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Check loop timer: 5s (5000ms) active, 15s (15000ms) pause => 20s (20000ms) total cycle
      if (loopCycle) {
        const elapsed = Date.now() - startTime;
        const cycleTime = elapsed % 20000;
        const isActive = cycleTime < 5000;

        if (!isActive) {
          if (wasActive) {
            ctx.clearRect(0, 0, width, height);
            wasActive = false;
          }
          animId = requestAnimationFrame(render);
          return;
        }

        // Just transitioned from paused to active phase
        if (!wasActive) {
          initBurst();
          wasActive = true;
        }
      }

      ctx.clearRect(0, 0, width, height);

      // Determine fade multiplier near the end of 5s window (last 600ms)
      let cycleFade = 1;
      if (loopCycle) {
        const elapsed = Date.now() - startTime;
        const cycleTime = elapsed % 20000;
        if (cycleTime > 4400) {
          cycleFade = Math.max(0, (5000 - cycleTime) / 600);
        }
      }

      particles.forEach((p, idx) => {
        p.age += 1;
        p.rotation += p.rotSpeed;

        if (type === 'clap') {
          p.x += p.vx + Math.sin(p.age * p.swayFreq) * p.swayAmp * 0.5;
          p.y += p.vy;
          if (p.y < -30 || p.x < -30 || p.x > width + 30 || p.age > p.maxAge) {
            particles[idx] = createParticle(false);
          }
        } else {
          p.x += p.vx + Math.sin(p.age * p.swayFreq) * p.swayAmp;
          p.y += p.vy;
          p.vy += 0.02;

          if (p.y > height + 30 || p.x < -30 || p.x > width + 30 || p.age > p.maxAge) {
            particles[idx] = createParticle(false);
          }
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity * (1 - p.age / p.maxAge) * cycleFade);

        if (p.shape === 'emoji' && p.emoji) {
          ctx.font = `${p.size}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillText(p.emoji, 0, 0);
        } else if (p.shape === 'ribbon') {
          drawRibbon(ctx, p);
        } else if (p.shape === 'star') {
          drawStar(ctx, p.x, p.y, 4, p.size, p.size / 2, p.color);
        } else if (p.shape === 'rect') {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size / 1.5);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        }

        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, [type, loopCycle]);

  if (!type) return null;

  return (
    <canvas 
      ref={canvasRef} 
      className={className} 
      style={{ pointerEvents: 'none' }}
    />
  );
};
