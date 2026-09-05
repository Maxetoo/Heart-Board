import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Semantic Heart Spectrum Colors strictly adhering to Heartboard's design system
export const SEMANTIC_HEART_COLORS = [
  { name: 'Loving (Yellow)', hex: '#FFB800', emoji: '💛' },
  { name: 'Reliable (Peach/Orange)', hex: '#FF8A65', emoji: '🧡' },
  { name: 'Leadership (Purple)', hex: '#7B62FF', emoji: '💜' },
  { name: 'Hard Working (Green)', hex: '#4CD964', emoji: '💚' },
  { name: 'Visionary (Pink)', hex: '#FF53C0', emoji: '💖' },
  { name: 'Best of All (Teal)', hex: '#007A78', emoji: '💙' },
  { name: 'Coral Love', hex: '#FE6349', emoji: '💖' },
];

interface AmbientHeart {
  id: string;
  color: string;
  size: number;
  startX: number; // percentage 0-100%
  startY: number; // percentage 0-100%
  targetY: number;
  swayX: number;
  rotation: number;
  duration: number;
  delay: number;
  scale: number;
  opacity: number;
  isBurst?: boolean;
  glowBlur?: number;
  depth: 'bg' | 'mid' | 'fg';
}

interface BurstParticle {
  id: string;
  color: string;
  size: number;
  angle: number; // in radians
  distance: number;
  duration: number;
  delay: number;
  scale: number;
  rotation: number;
}

interface HeroHeartAnimationProps {
  activeColor: string;
  activeActivityKey: number | string;
  onCentralHeartClick?: () => void;
}

export const HeroHeartAnimation: React.FC<HeroHeartAnimationProps> = ({
  activeColor,
  activeActivityKey,
  onCentralHeartClick,
}) => {
  const [burstParticles, setBurstParticles] = useState<BurstParticle[]>([]);
  const [interactiveHearts, setInteractiveHearts] = useState<AmbientHeart[]>([]);
  const [isWinking, setIsWinking] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate a continuous, beautifully balanced organic set of ambient floating hearts
  const ambientHearts = useMemo<AmbientHeart[]>(() => {
    const list: AmbientHeart[] = [];
    const count = 18; // Balanced number for visual richness without clutter

    // Distribution zones to ensure balanced left, right, top, and bottom framing
    const zones = [
      // Left wing
      { minX: 4, maxX: 26, minY: 10, maxY: 85 },
      { minX: 10, maxX: 30, minY: 20, maxY: 75 },
      { minX: 6, maxX: 22, minY: 40, maxY: 90 },
      // Right wing
      { minX: 74, maxX: 94, minY: 10, maxY: 85 },
      { minX: 70, maxX: 90, minY: 25, maxY: 75 },
      { minX: 76, maxX: 96, minY: 45, maxY: 90 },
      // Upper perimeter
      { minX: 25, maxX: 42, minY: 8, maxY: 35 },
      { minX: 58, maxX: 75, minY: 8, maxY: 35 },
      // Floating surrounding orbit
      { minX: 18, maxX: 36, minY: 55, maxY: 85 },
      { minX: 64, maxX: 82, minY: 55, maxY: 85 },
    ];

    for (let i = 0; i < count; i++) {
      const zone = zones[i % zones.length];
      const colorObj = SEMANTIC_HEART_COLORS[i % SEMANTIC_HEART_COLORS.length];
      const depth: 'bg' | 'mid' | 'fg' = i % 3 === 0 ? 'bg' : i % 3 === 1 ? 'mid' : 'fg';
      
      const size = depth === 'bg'
        ? Math.floor(Math.random() * 12) + 16  // 16px - 28px
        : depth === 'mid'
        ? Math.floor(Math.random() * 16) + 26  // 26px - 42px
        : Math.floor(Math.random() * 18) + 36; // 36px - 54px

      const startX = zone.minX + Math.random() * (zone.maxX - zone.minX);
      const startY = zone.minY + Math.random() * (zone.maxY - zone.minY);
      const swayX = (Math.random() - 0.5) * (depth === 'fg' ? 44 : 28);
      const rotation = (Math.random() - 0.5) * 36;
      const duration = 3.6 + Math.random() * 2.8; // 3.6s to 6.4s
      const delay = (i * 0.35) % 3.2;
      const isBurst = i % 5 === 0; // occasional surprise burst heart
      const opacity = depth === 'bg' ? 0.45 : depth === 'mid' ? 0.8 : 0.95;

      list.push({
        id: `ambient-${i}`,
        color: colorObj.hex,
        size,
        startX,
        startY,
        targetY: startY - (18 + Math.random() * 25),
        swayX,
        rotation,
        duration,
        delay,
        scale: depth === 'fg' ? 1.05 : depth === 'mid' ? 0.9 : 0.75,
        opacity,
        isBurst,
        depth,
        glowBlur: depth === 'fg' ? 10 : 6,
      });
    }

    return list;
  }, []);

  // Trigger dynamic outward burst particles whenever activeActivityKey changes (live heart blown or ticker transition)
  useEffect(() => {
    const newBurst: BurstParticle[] = [];
    const count = 7; // 7 lively particles radiating outward

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
      const distance = 80 + Math.random() * 95; // 80px to 175px outward
      const size = 16 + Math.floor(Math.random() * 18); // 16px to 34px
      const duration = 1.1 + Math.random() * 0.6;
      const delay = i * 0.05;
      const rotation = (Math.random() - 0.5) * 45;

      newBurst.push({
        id: `burst-${Date.now()}-${i}`,
        color: activeColor,
        size,
        angle,
        distance,
        duration,
        delay,
        scale: 0.9 + Math.random() * 0.3,
        rotation,
      });
    }

    setBurstParticles(newBurst);
    setIsWinking(true);
    const winkTimer = setTimeout(() => setIsWinking(false), 800);

    const cleanupTimer = setTimeout(() => {
      setBurstParticles([]);
    }, 2000);

    return () => {
      clearTimeout(cleanupTimer);
      clearTimeout(winkTimer);
    };
  }, [activeActivityKey, activeColor]);

  // Interactive user click handler to spawn joyous hearts
  const handleHeartClick = () => {
    if (onCentralHeartClick) onCentralHeartClick();

    // Spawn 3 playful mini floating hearts
    const clicks: AmbientHeart[] = [];
    for (let i = 0; i < 4; i++) {
      const colorObj = SEMANTIC_HEART_COLORS[Math.floor(Math.random() * SEMANTIC_HEART_COLORS.length)];
      clicks.push({
        id: `click-${Date.now()}-${i}`,
        color: colorObj.hex,
        size: 24 + Math.floor(Math.random() * 18),
        startX: 45 + (Math.random() - 0.5) * 20,
        startY: 40 + (Math.random() - 0.5) * 15,
        targetY: 15 + Math.random() * 15,
        swayX: (Math.random() - 0.5) * 60,
        rotation: (Math.random() - 0.5) * 50,
        duration: 1.8 + Math.random() * 0.8,
        delay: i * 0.08,
        scale: 1.15,
        opacity: 1,
        depth: 'fg',
        glowBlur: 12,
        isBurst: true,
      });
    }

    setInteractiveHearts((prev) => [...prev.slice(-10), ...clicks]);
    setIsWinking(true);
    setTimeout(() => setIsWinking(false), 900);

    setTimeout(() => {
      setInteractiveHearts((prev) => prev.filter((h) => !clicks.some((c) => c.id === h.id)));
    }, 3000);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center pointer-events-none select-none"
    >
      {/* 1. Ambient Dynamic Floating & Popping Hearts Field */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {ambientHearts.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{
              x: 0,
              y: 0,
              scale: 0.1,
              opacity: 0,
              rotate: 0,
            }}
            animate={{
              // Natural float-drift-pop-spread-fade cycle
              y: [0, -14, -28, -12, 0],
              x: [0, heart.swayX * 0.6, heart.swayX, heart.swayX * 0.3, 0],
              scale: heart.isBurst
                ? [0.3, heart.scale * 1.25, heart.scale * 0.95, heart.scale * 1.1, heart.scale]
                : [heart.scale * 0.85, heart.scale * 1.08, heart.scale, heart.scale * 1.04, heart.scale * 0.85],
              rotate: [0, heart.rotation, -heart.rotation * 0.6, heart.rotation * 0.4, 0],
              opacity: [
                heart.opacity * 0.6,
                heart.opacity,
                heart.opacity * 0.9,
                heart.opacity * 0.95,
                heart.opacity * 0.6,
              ],
            }}
            transition={{
              duration: heart.duration,
              delay: heart.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              left: `${heart.startX}%`,
              top: `${heart.startY}%`,
              zIndex: heart.depth === 'fg' ? 25 : heart.depth === 'mid' ? 18 : 10,
            }}
            className="pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
          >
            <div className="relative flex items-center justify-center">
              {/* Soft colored atmospheric glow aura */}
              <div
                className="absolute inset-0 rounded-full blur-md -z-10 transition-opacity duration-700"
                style={{
                  backgroundColor: heart.color,
                  opacity: heart.depth === 'fg' ? 0.35 : 0.2,
                  transform: 'scale(1.3)',
                }}
              />

              {/* Heart SVG */}
              <svg
                style={{
                  width: `${heart.size}px`,
                  height: `${heart.size}px`,
                  color: heart.color,
                }}
                className="fill-current drop-shadow-xs transition-colors duration-500"
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>

              {/* Sparkle pop effect on burst entrance */}
              {heart.isBurst && (
                <motion.div
                  animate={{
                    scale: [0.8, 1.3, 0.8],
                    opacity: [0.2, 0.6, 0.2],
                    rotate: [0, 90, 180],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 text-white pointer-events-none"
                >
                  <svg viewBox="0 0 24 24" className="w-full h-full fill-white drop-shadow-xs">
                    <path d="M12 0l2.5 9.5L24 12l-9.5 2.5L12 24l-2.5-9.5L0 12l9.5-2.5z" />
                  </svg>
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}

        {/* 2. Interactive Click / Tap Hearts */}
        {interactiveHearts.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{
              scale: 0.2,
              opacity: 0,
              y: 0,
              x: 0,
              rotate: 0,
            }}
            animate={{
              scale: [0.2, 1.25, 1.0, 0.6],
              opacity: [0, 1, 0.9, 0],
              y: [0, -60, -120, -180],
              x: [0, heart.swayX * 0.5, heart.swayX, heart.swayX * 1.2],
              rotate: [0, heart.rotation, -heart.rotation, heart.rotation * 1.5],
            }}
            transition={{
              duration: heart.duration,
              delay: heart.delay,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{
              position: 'absolute',
              left: `${heart.startX}%`,
              top: `${heart.startY}%`,
              zIndex: 35,
            }}
            className="pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
          >
            <div className="relative flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full blur-md -z-10"
                style={{ backgroundColor: heart.color, opacity: 0.45 }}
              />
              <svg
                style={{ width: `${heart.size}px`, height: `${heart.size}px`, color: heart.color }}
                className="fill-current drop-shadow-md"
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 3. Concentric Radial Radar Waves with Responsive Breathing */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        {/* Active color pulse ping ring */}
        <motion.div
          animate={{
            borderColor: activeColor,
            scale: [0.96, 1.04, 0.96],
            opacity: [0.08, 0.16, 0.08],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-[520px] h-[520px] sm:w-[640px] sm:h-[640px] border rounded-full absolute pointer-events-none"
        />

        {[
          'w-[520px] h-[520px] sm:w-[640px] sm:h-[640px]',
          'w-[640px] h-[640px] sm:w-[760px] sm:h-[760px]',
          'w-[760px] h-[760px] sm:w-[880px] sm:h-[880px]',
          'w-[880px] h-[880px] sm:w-[1000px] sm:h-[1000px]',
          'w-[1000px] h-[1000px] sm:w-[1120px] sm:h-[1120px]',
          'w-[1120px] h-[1120px] sm:w-[1240px] sm:h-[1240px]',
          'w-[1240px] h-[1240px] sm:w-[1360px] sm:h-[1360px]',
        ].map((sizeClass, idx) => (
          <motion.div
            key={idx}
            animate={{
              borderColor: activeColor,
              opacity: [0.05 + idx * 0.005, 0.08 + idx * 0.005, 0.05 + idx * 0.005],
            }}
            transition={{
              duration: 0.8,
              ease: 'easeInOut',
            }}
            className={`${sizeClass} border rounded-full absolute bg-transparent pointer-events-none transition-colors duration-700`}
          />
        ))}
      </div>

      {/* 4. Live Burst Particle Embers when New Activity / Heart Event Occurs */}
      <AnimatePresence>
        {burstParticles.map((particle) => {
          const targetX = Math.cos(particle.angle) * particle.distance;
          const targetY = Math.sin(particle.angle) * particle.distance;

          return (
            <motion.div
              key={particle.id}
              initial={{
                x: 0,
                y: 0,
                scale: 0.2,
                opacity: 0,
                rotate: 0,
              }}
              animate={{
                x: [0, targetX * 0.7, targetX],
                y: [0, targetY * 0.7 - 20, targetY - 45],
                scale: [0.2, particle.scale * 1.25, particle.scale, 0.4],
                opacity: [0, 0.95, 0.85, 0],
                rotate: [0, particle.rotation, particle.rotation * 1.5],
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{ zIndex: 30 }}
              className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
            >
              <div className="relative flex items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full blur-xs -z-10"
                  style={{ backgroundColor: particle.color, opacity: 0.5 }}
                />
                <svg
                  style={{ width: `${particle.size}px`, height: `${particle.size}px`, color: particle.color }}
                  className="fill-current drop-shadow-sm"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* 5. Central Hero Speech Bubble Heart with Natural Breathing & Heartbeat Pulse */}
      <div className="relative z-20 flex flex-col items-center pointer-events-auto">
        <motion.div
          animate={{
            y: [0, -6, 0],
            rotate: [0, 1.2, -1.2, 0],
          }}
          transition={{
            y: { duration: 4.2, repeat: Infinity, ease: 'easeInOut' },
            rotate: { duration: 5.4, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="relative flex items-center justify-center"
        >
          {/* Outer Halo Glow Disc */}
          <motion.div
            animate={{
              backgroundColor: `${activeColor}1F`,
              scale: [1, 1.05, 1],
            }}
            transition={{
              backgroundColor: { duration: 0.8, ease: 'easeInOut' },
              scale: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="w-52 h-52 md:w-64 md:h-64 rounded-full flex items-center justify-center relative cursor-pointer group"
            onClick={handleHeartClick}
            role="button"
            tabIndex={0}
            aria-label="Interactive Hero Heart"
          >
            {/* Subtle soft radiant shadow behind the speech bubble */}
            <motion.div
              animate={{
                boxShadow: `0 14px 40px ${activeColor}4D`,
                backgroundColor: activeColor,
              }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              className="w-[140px] h-[140px] md:w-[170px] md:h-[170px] rounded-full flex items-center justify-center relative transition-transform duration-300 group-hover:scale-105 group-active:scale-95 shadow-lg"
            >
              {/* Speech bubble tail pointer */}
              <motion.div
                animate={{ backgroundColor: activeColor }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
                className="absolute -bottom-1.5 -left-1 w-9 h-9 rounded-br-2xl transform rotate-12"
              />

              {/* Inner White Smiling Heart */}
              <motion.div
                key={activeActivityKey}
                initial={{ scale: 0.94 }}
                animate={{
                  // Heartbeat double-pulse on new activity
                  scale: [0.94, 1.14, 0.98, 1.06, 1.0],
                }}
                transition={{
                  duration: 0.9,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="w-20 h-20 md:w-24 md:h-24 fill-white flex items-center justify-center relative z-20"
              >
                <svg className="w-full h-full text-white fill-current drop-shadow-xs" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>

                {/* Friendly smiling face inside the heart with interactive eye expressions */}
                <motion.div
                  animate={{ color: activeColor }}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                  className="absolute top-[32%] md:top-[34%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none select-none"
                >
                  <div className="flex gap-2 items-center">
                    {/* Left Eye */}
                    <motion.span
                      animate={{
                        backgroundColor: activeColor,
                        scaleY: isWinking ? 0.2 : 1,
                      }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="w-2 h-2 rounded-full inline-block"
                    />
                    {/* Right Eye (winks on pulse or click) */}
                    <motion.span
                      animate={{
                        backgroundColor: activeColor,
                        scaleY: isWinking ? 0.2 : 1,
                      }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="w-2 h-2 rounded-full inline-block"
                    />
                  </div>

                  {/* Warm Smile Curve */}
                  <svg className="w-7 h-4 fill-none" viewBox="0 0 20 10">
                    <path
                      d="M2,2 Q10,11 18,2"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
