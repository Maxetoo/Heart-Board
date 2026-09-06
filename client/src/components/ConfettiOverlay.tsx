import React, { useEffect, useRef, useState } from 'react';

export type ConfettiType = 'clap' | 'ribbons' | 'simple' | 'celebration' | string | null | undefined;

interface ConfettiOverlayProps {
  type: ConfettiType;
  className?: string;
  /**
   * @deprecated No longer read. Confetti fires ONCE when the element first
   * comes into view; it no longer loops. Kept so existing call sites compile.
   */
  loopCycle?: boolean;
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

  /**
   * Set once, when the element first scrolls into view — which is what fires
   * the burst.
   *
   * Every feed and profile card mounts one of these. Each used to run its own
   * uncapped requestAnimationFrame loop redrawing 40-55 recycled particles on a
   * 5s-on/15s-off cycle for as long as the card existed, on screen or not, so
   * scrolling accumulated dozens of concurrent canvas animations and the page
   * stuttered. Now a card animates once, briefly, and only if it is actually
   * seen; off-screen cards cost nothing and finished ones cost nothing.
   */
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    if (!type) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Without IntersectionObserver, fall back to always-on rather than never.
    if (typeof IntersectionObserver === 'undefined') {
      setOnScreen(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        // Latch: the burst plays once, on first sight. Toggling this back off
        // when the card scrolls away would replay it on every pass.
        setOnScreen(true);
        io.disconnect();
      },
      // A small margin starts the burst just before the card scrolls in, so it
      // does not visibly pop on.
      { rootMargin: '100px' },
    );
    io.observe(canvas);
    return () => io.disconnect();
  }, [type]);

  useEffect(() => {
    if (!type || !onScreen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: Particle[] = [];
    const startTime = Date.now();

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

    // 30fps is indistinguishable for confetti and halves the draw cost when
    // several cards are visible at once.
    const FRAME_MS = 1000 / 30;
    /** How long the single burst lasts before the canvas is cleared for good. */
    const BURST_MS = 4000;
    /** Particles fade out over the tail of the burst rather than vanishing. */
    const FADE_MS = 900;
    let lastFrame = 0;

    const render = (now = 0) => {
      const width = canvas.width;
      const height = canvas.height;
      const elapsed = Date.now() - startTime;

      // ONE burst, then stop. This used to run a 5s-on / 15s-off cycle forever,
      // so every card on the page kept a canvas animating for as long as it was
      // mounted. Nothing reschedules after this point — the effect's cleanup is
      // the only thing left to run.
      if (elapsed >= BURST_MS) {
        ctx.clearRect(0, 0, width, height);
        particles = [];
        return;
      }

      // Frame-rate cap. rAF still drives the loop, so a background tab is
      // throttled by the browser as usual; we just skip draws between slots.
      if (now && now - lastFrame < FRAME_MS) {
        animId = requestAnimationFrame(render);
        return;
      }
      lastFrame = now;

      ctx.clearRect(0, 0, width, height);

      // Fade out over the tail of the burst.
      const cycleFade = elapsed > BURST_MS - FADE_MS
        ? Math.max(0, (BURST_MS - elapsed) / FADE_MS)
        : 1;

      // A particle that leaves the frame is DROPPED, not respawned. Recycling
      // them is what made a "burst" run forever — the population never fell.
      particles = particles.filter((p) => {
        p.age += 1;
        p.rotation += p.rotSpeed;

        if (type === 'clap') {
          p.x += p.vx + Math.sin(p.age * p.swayFreq) * p.swayAmp * 0.5;
          p.y += p.vy;
          return !(p.y < -30 || p.x < -30 || p.x > width + 30 || p.age > p.maxAge);
        }

        p.x += p.vx + Math.sin(p.age * p.swayFreq) * p.swayAmp;
        p.y += p.vy;
        p.vy += 0.02;
        return !(p.y > height + 30 || p.x < -30 || p.x > width + 30 || p.age > p.maxAge);
      });

      // Every particle has left the frame — stop early rather than burn the
      // remainder of the burst window drawing nothing.
      if (particles.length === 0) {
        ctx.clearRect(0, 0, width, height);
        return;
      }

      particles.forEach((p) => {
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

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, [type, loopCycle, onScreen]);

  if (!type) return null;

  return (
    <canvas 
      ref={canvasRef} 
      className={className} 
      style={{ pointerEvents: 'none' }}
    />
  );
};
