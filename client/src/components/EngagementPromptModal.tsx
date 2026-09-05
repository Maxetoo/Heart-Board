import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface EngagementPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendLoveOrHeart: () => void;
  triggerReason?: string;
}

export const EngagementPromptModal: React.FC<EngagementPromptModalProps> = ({
  isOpen,
  onClose,
  onSendLoveOrHeart,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-[#0F1017]/80 backdrop-blur-sm select-none"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-[370px] sm:max-w-[390px] bg-white rounded-[2.5rem] shadow-[0_25px_70px_rgba(0,0,0,0.45)] overflow-hidden text-center border border-white/20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Envelope Flap / Layered Curved Illustration matching Image Reference */}
          <div className="relative w-full h-[190px] sm:h-[200px] overflow-hidden bg-[#FDB388]">
            <svg
              viewBox="0 0 380 200"
              className="w-full h-full object-cover"
              preserveAspectRatio="none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Layer 1: Top Soft Warm Peach Base (Already in background) */}
              <rect width="380" height="200" fill="#FDB388" />

              {/* Layer 2: Middle Orange Curved Band */}
              <path
                d="M-20 -10 C90 130, 290 130, 400 -10 L400 170 C290 230, 90 230, -20 170 Z"
                fill="#FA7A52"
              />

              {/* Layer 3: Vibrant Bottom Arch Dropping Across Width */}
              <path
                d="M-20 40 C80 175, 300 175, 400 40 L400 210 L-20 210 Z"
                fill="#FA5738"
              />

              {/* Center Medallion Base Pill/Circle */}
              <circle cx="190" cy="140" r="33" fill="#FA5738" />

              {/* White Heart with Cute Smile Icon */}
              <g transform="translate(174, 124)">
                {/* Heart Base Shape */}
                <path
                  d="M16 27.5 L14.1 25.8 C6.8 19.2 2 14.8 2 9.5 C2 5.1 5.4 1.7 9.8 1.7 C12.3 1.7 14.7 2.9 16 4.7 C17.3 2.9 19.7 1.7 22.2 1.7 C26.6 1.7 30 5.1 30 9.5 C30 14.8 25.2 19.2 17.9 25.8 L16 27.5 Z"
                  fill="#FFFFFF"
                />
                
                {/* Smiling Eyes */}
                <circle cx="12" cy="10" r="1.3" fill="#FA5738" />
                <circle cx="20" cy="10" r="1.3" fill="#FA5738" />
                
                {/* Smile Arc */}
                <path
                  d="M12.5 13.5 Q16 17.5 19.5 13.5"
                  stroke="#FA5738"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
            </svg>
          </div>

          {/* Body Content */}
          <div className="px-6 sm:px-8 pt-6 pb-7">
            {/* Title */}
            <h2 className="text-[19px] sm:text-[21px] font-extrabold text-[#1A1B25] leading-tight tracking-tight">
              You Might Want to Say Something Too
            </h2>

            {/* Subtext */}
            <p className="text-xs sm:text-[13px] text-[#808897] font-medium leading-relaxed max-w-[270px] mx-auto mt-2 mb-6">
              Someone in your life deserves this kind of message too.
            </p>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              {/* Primary: Send some love or heart */}
              <button
                type="button"
                onClick={onSendLoveOrHeart}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#FE6349] hover:bg-[#FE6349]/90 active:scale-[0.98] text-white font-bold text-sm tracking-tight transition-all duration-150 shadow-md cursor-pointer flex items-center justify-center"
              >
                Send some love or heart
              </button>

              {/* Secondary: Later */}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#ECEFF3] hover:bg-[#DFE1E6] active:scale-[0.98] text-[#1A1B25] font-bold text-sm tracking-tight transition-all duration-150 cursor-pointer flex items-center justify-center"
              >
                Later
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
