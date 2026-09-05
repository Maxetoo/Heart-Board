import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HeartBubbleSvg } from './CreateAppreciationModal';
import { HeartCategoryCardData } from './HeartboardView';

interface FloatingHeartItem {
  id: number;
  bubbleColor: string;
  categoryName: string;
  size: number;
  leftPercent: number;
  delay: number;
  duration: number;
  swayX: number;
  rotation: number;
  scale: number;
  isBurst?: boolean;
  depth: 'bg' | 'mid' | 'fg';
}

interface LiveHeartAnimationProps {
  categories: HeartCategoryCardData[];
  isActive: boolean;
  onComplete?: () => void;
  durationMs?: number;
}

export const LiveHeartAnimation: React.FC<LiveHeartAnimationProps> = ({
  categories,
  isActive,
  onComplete,
  durationMs = 6500,
}) => {
  const [items, setItems] = useState<FloatingHeartItem[]>([]);

  useEffect(() => {
    if (!isActive) {
      setItems([]);
      return;
    }

    // Filter categories that have received counts > 0 or all available categories
    const activeCats = (categories || []).filter((c) => c && typeof c.count === 'number' && c.count > 0);
    const pool = activeCats.length > 0 ? activeCats : (categories || []).filter(c => Boolean(c));

    if (pool.length === 0) {
      setItems([]);
      return;
    }

    // Generate ~36 floating hearts with multi-depth organic variation
    const newItems: FloatingHeartItem[] = [];
    const countToGenerate = 36;

    for (let i = 0; i < countToGenerate; i++) {
      const cat = pool[i % pool.length];
      if (!cat) continue;

      const depth: 'bg' | 'mid' | 'fg' = i % 3 === 0 ? 'bg' : i % 3 === 1 ? 'mid' : 'fg';
      const size = depth === 'bg'
        ? Math.floor(Math.random() * 16) + 24 // 24px - 40px
        : depth === 'mid'
        ? Math.floor(Math.random() * 20) + 38 // 38px - 58px
        : Math.floor(Math.random() * 24) + 52; // 52px - 76px

      const leftPercent = Math.floor(Math.random() * 88) + 6; // 6% to 94%
      const delay = Math.random() * 3.2; // staggered delays 0 to 3.2s
      const duration = Math.random() * 1.8 + 3.4; // 3.4s to 5.2s float duration
      const swayX = (Math.random() - 0.5) * (depth === 'fg' ? 140 : 80);
      const rotation = (Math.random() - 0.5) * 55; // -27deg to +27deg
      const scale = depth === 'fg' ? Math.random() * 0.25 + 0.95 : Math.random() * 0.2 + 0.8;
      const isBurst = i % 6 === 0;

      newItems.push({
        id: i,
        bubbleColor: cat.bubbleColor || '#FE6349',
        categoryName: cat.categoryName || 'Heart',
        size,
        leftPercent,
        delay,
        duration,
        swayX,
        rotation,
        scale,
        isBurst,
        depth,
      });
    }

    setItems(newItems);

    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [isActive, categories, durationMs]);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {/* Floating, drifting, popping celebratory hearts */}
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{
              y: '105vh',
              x: 0,
              opacity: 0,
              scale: 0.2,
              rotate: 0,
            }}
            animate={{
              y: '-18vh',
              x: [0, item.swayX * 0.4, item.swayX, item.swayX * 0.7, item.swayX * 0.2],
              opacity: [0, 0.95, 1, 0.9, 0],
              scale: item.isBurst 
                ? [0.2, item.scale * 1.3, item.scale, item.scale * 1.08, item.scale * 0.6]
                : [0.2, item.scale * 1.1, item.scale, item.scale * 0.95, item.scale * 0.5],
              rotate: [0, item.rotation, -item.rotation * 0.8, item.rotation * 0.5, 0],
            }}
            transition={{
              duration: item.duration,
              delay: item.delay,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{
              position: 'absolute',
              left: `${item.leftPercent}%`,
              bottom: 0,
              zIndex: item.depth === 'fg' ? 30 : item.depth === 'mid' ? 20 : 10,
            }}
            className="pointer-events-none select-none"
          >
            <div className="relative flex items-center justify-center">
              <HeartBubbleSvg
                color={item.bubbleColor}
                size={item.size}
              />
              <div
                className="absolute inset-0 rounded-full blur-md opacity-45 -z-10 transition-transform"
                style={{ 
                  backgroundColor: item.bubbleColor,
                  transform: 'scale(1.25)' 
                }}
              />
              {item.isBurst && (
                <div className="absolute -top-1 -right-1 w-3 h-3 text-white">
                  <svg viewBox="0 0 24 24" className="w-full h-full fill-white drop-shadow-xs">
                    <path d="M12 0l2.5 9.5L24 12l-9.5 2.5L12 24l-2.5-9.5L0 12l9.5-2.5z" />
                  </svg>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
};
