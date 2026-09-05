import React from 'react';
import { X } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeaveMessage: () => void;
}

/* --- Flaticon Style Illustrated Vector Icons matching UI reference --- */

// 1. Paper plane flying with pink/red heart
const PaperPlaneHeartIllustration: React.FC = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 sm:w-16 sm:h-16 shrink-0">
    {/* Speed/motion hatch lines */}
    <path d="M12 36L18 36" stroke="#1A1B25" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M8 43L16 43" stroke="#1A1B25" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M14 50L22 50" stroke="#1A1B25" strokeWidth="2.2" strokeLinecap="round" />
    
    <g transform="translate(3, -2)">
      {/* Paper airplane lower fold shadow */}
      <path d="M25 50L33 54L37 41L25 50Z" fill="#E2E6ED" stroke="#1A1B25" strokeWidth="2.2" strokeLinejoin="round" />
      {/* Main wing under side */}
      <path d="M54 13L20 39L37 41L54 13Z" fill="#F4F6F9" stroke="#1A1B25" strokeWidth="2.2" strokeLinejoin="round" />
      {/* Center crease plane */}
      <path d="M54 13L37 41L46 45L54 13Z" fill="#FFFFFF" stroke="#1A1B25" strokeWidth="2.2" strokeLinejoin="round" />
      {/* Top main wing */}
      <path d="M54 13L16 32L37 41L54 13Z" fill="#FFFFFF" stroke="#1A1B25" strokeWidth="2.2" strokeLinejoin="round" />
      
      {/* Floating 3D Heart Token */}
      <g transform="translate(13, 6)">
        <path
          d="M15 4.5C12.5 1.5 8 2 6 4.8C4 7.5 4.5 11.5 7.5 14.5L15 21L22.5 14.5C25.5 11.5 26 7.5 24 4.8C22 2 17.5 1.5 15 4.5Z"
          fill="#FF4D6D"
          stroke="#1A1B25"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        {/* Heart highlight shine */}
        <path d="M9 6.5C10 5.2 12.2 5 13.5 6" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      </g>
    </g>
  </svg>
);

// 2. Soft pink sticky note / memo sheet with curled edge and red heart
const StickyNoteHeartIllustration: React.FC = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 sm:w-16 sm:h-16 shrink-0">
    <g transform="translate(6, 4)">
      {/* Curled note base shadow */}
      <path d="M10 6C10 4.89543 10.8954 4 12 4H40C41.1046 4 42 4.89543 42 6V36C42 41 38 46 22 47L9 52V6C9 4.89543 9.89543 4 11 4H12" fill="#FFCAD4" />
      
      {/* Main note body with soft pink fill */}
      <path d="M11 6C11 4.89543 11.8954 4 13 4H40C41.1046 4 42 4.89543 42 6V34C42 38 38 43 24 44L11 49V6Z" fill="#FFCCD7" />
      <path d="M12 5C12 4.44772 12.4477 4 13 4H39C39.5523 4 40 4.44772 40 5V33C40 37 36 41 24 43L12 48V5Z" fill="#FFAEC0" />
      <path d="M13 5C13 4.44772 13.4477 4 14 4H38C38.5523 4 39 4.44772 39 5V32C39 36 34 40 24 42L13 47V5Z" fill="#FFC2D1" />
      
      {/* Soft reflection sheen */}
      <path d="M16 8V16C16 17.1046 15.1046 18 14 18" stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity="0.75" />
      
      {/* Vivid Heart in center */}
      <g transform="translate(18, 17)">
        <path
          d="M8 2.5C6.5 0.5 3.5 1 2 3C0.5 5 1 8 3 10L8 15L13 10C15 8 15.5 5 14 3C12.5 1 9.5 0.5 8 2.5Z"
          fill="#FF2E55"
        />
      </g>
    </g>
  </svg>
);

// 3. Two speech bubbles (pink hatched + yellow) with hearts
const ChatBubblesHeartIllustration: React.FC = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 sm:w-16 sm:h-16 shrink-0">
    <g transform="translate(4, 4)">
      {/* Back bubble (Coral/Pink with texture and white heart) */}
      <g transform="translate(10, 0)">
        <path
          d="M23 4C15.5 4 10 9 10 15.5C10 18.8 11.8 21.6 14.5 23.8L12.5 30L19.5 27.2C20.6 27.4 21.8 27.5 23 27.5C30.5 27.5 36 22.5 36 15.5C36 8.5 30.5 4 23 4Z"
          fill="#FF4D6D"
          stroke="#1A1B25"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        {/* Subtle diagonal texture */}
        <path d="M15 10L30 22" stroke="rgba(255,255,255,0.45)" strokeWidth="1.6" />
        <path d="M19 8L33 19" stroke="rgba(255,255,255,0.45)" strokeWidth="1.6" />
        <path d="M13 14L27 24" stroke="rgba(255,255,255,0.45)" strokeWidth="1.6" />
        {/* White heart inside */}
        <path
          d="M23 10C21.8 8.5 19.5 8.8 18.5 10.2C17.5 11.6 17.8 13.7 19.2 15.1L23 18.8L26.8 15.1C28.2 13.7 28.5 11.6 27.5 10.2C26.5 8.8 24.2 8.5 23 10Z"
          fill="white"
        />
      </g>

      {/* Front bubble (Sunny Yellow with heart) */}
      <g transform="translate(0, 10)">
        <path
          d="M17 5C9.5 5 4 10 4 16.5C4 19.8 5.8 22.6 8.5 24.8L6.5 31L13.5 28.2C14.6 28.4 15.8 28.5 17 28.5C24.5 28.5 30 23.5 30 16.5C30 9.5 24.5 5 17 5Z"
          fill="#FFD166"
          stroke="#1A1B25"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        {/* White heart inside with outline */}
        <path
          d="M17 11.5C15.8 10 13.8 10.3 12.8 11.6C11.8 13 12.2 14.8 13.5 16.2L17 19.5L20.5 16.2C21.8 14.8 22.2 13 21.2 11.6C20.2 10.3 18.2 10 17 11.5Z"
          fill="white"
          stroke="#1A1B25"
          strokeWidth="1.5"
        />
      </g>
    </g>
  </svg>
);

// 4. "Enjoy every moment" delicate pink wreath illustration
const EnjoyEveryMomentIllustration: React.FC = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 sm:w-16 sm:h-16 shrink-0">
    <g transform="translate(3, 4)">
      {/* Top decorative loop sprig with delicate leaves */}
      <path d="M12 11C14 9 17 8 20 9C23 10 25 12 28 11C31 10 33 8 36 9C39 10 41 12 44 11C47 10 49 8 51 9" stroke="#FF5C7A" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="16" cy="7" r="1.6" fill="#FF5C7A" />
      <circle cx="28" cy="6" r="1.6" fill="#FF5C7A" />
      <circle cx="40" cy="6" r="1.6" fill="#FF5C7A" />
      <circle cx="48" cy="8" r="1.6" fill="#FF5C7A" />
      
      {/* Script Text "Enjoy" */}
      <text x="31" y="27" textAnchor="middle" fill="#FF4D6D" fontFamily="Caveat, cursive, sans-serif" fontSize="17" fontWeight="bold">
        Enjoy
      </text>
      
      {/* "every moment" subtitle */}
      <text x="31" y="37" textAnchor="middle" fill="#FF5C7A" fontFamily="Nunito, sans-serif" fontSize="6.5" fontWeight="800" letterSpacing="0.6">
        EVERY MOMENT
      </text>
      
      {/* Bottom flourish loop */}
      <path d="M12 45C14 47 17 48 20 47C23 46 25 44 28 45C31 46 33 48 36 47C39 46 41 44 44 45C47 46 49 48 51 47" stroke="#FF5C7A" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="16" cy="49" r="1.6" fill="#FF5C7A" />
      <circle cx="28" cy="50" r="1.6" fill="#FF5C7A" />
      <circle cx="40" cy="50" r="1.6" fill="#FF5C7A" />
      <circle cx="48" cy="48" r="1.6" fill="#FF5C7A" />
    </g>
  </svg>
);

// 5. Celebration party popper horn with confetti blast
const PartyPopperIllustration: React.FC = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14 sm:w-16 sm:h-16 shrink-0">
    <g transform="translate(4, 4)">
      {/* 4-point yellow celebration star */}
      <path d="M10 8L11.5 12L15.5 13.5L11.5 15L10 19L8.5 15L4.5 13.5L8.5 12L10 8Z" fill="#FFD166" stroke="#1A1B25" strokeWidth="1.5" strokeLinejoin="round" />
      
      {/* Sparkle star and celebration dots */}
      <path d="M32 5L33 7.5L35.5 8.5L33 9.5L32 12L31 9.5L28.5 8.5L31 7.5L32 5Z" fill="#1A1B25" />
      <circle cx="23" cy="11" r="2" fill="#1A1B25" />
      <circle cx="39" cy="17" r="2" fill="#1A1B25" />
      <circle cx="38" cy="28" r="2.2" fill="#1A1B25" />
      
      {/* Ribbons */}
      <path d="M22 17C25 14 29 15 32 13" stroke="#1A1B25" strokeWidth="2" strokeLinecap="round" />
      <path d="M26 23C30 21 34 25 38 23" stroke="#1A1B25" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 25C19 22 21 24 25 21" stroke="#1A1B25" strokeWidth="2" strokeLinecap="round" />
      
      {/* Horn Body */}
      <g transform="translate(4, 21)">
        <path d="M4 25L21 8L28 15L11 32L4 25Z" fill="#FF4D6D" stroke="#1A1B25" strokeWidth="2.2" strokeLinejoin="round" />
        {/* Horn stripes */}
        <path d="M10 19L16 25" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M16 13L22 19" stroke="#FFD166" strokeWidth="2.8" strokeLinecap="round" />
        {/* Mouth rim */}
        <path d="M19 6L30 17" stroke="#1A1B25" strokeWidth="2.8" strokeLinecap="round" />
      </g>
    </g>
  </svg>
);

const WELCOME_FEATURE_CARDS = [
  {
    id: 'leave-message',
    title: 'Leave a message',
    description: 'Say something meaningful to someone — publicly, privately, or anonymously.',
    Icon: PaperPlaneHeartIllustration,
  },
  {
    id: 'create-heartboard',
    title: 'Create a Heartboard',
    description: 'Bring people together to celebrate someone special.',
    Icon: StickyNoteHeartIllustration,
  },
  {
    id: 'join-heartboard',
    title: 'Join a Heartboard',
    description: 'Find a Heartboard someone created and add your own words to the celebration.',
    Icon: ChatBubblesHeartIllustration,
  },
  {
    id: 'discover-moments',
    title: 'Discover moments',
    description: 'Explore messages, celebrations, and stories that are making people smile, cry, and feel good.',
    Icon: EnjoyEveryMomentIllustration,
  },
  {
    id: 'celebrate-moment',
    title: 'Celebrate a moment',
    description: 'Take part in special events and community moments where everyone can contribute something meaningful.',
    Icon: PartyPopperIllustration,
  },
];

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onLeaveMessage,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[350] bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Modal Dialog Card */}
      <div
        className="relative w-full max-w-[1040px] max-h-[92dvh] sm:max-h-[90vh] bg-white rounded-[28px] sm:rounded-[36px] shadow-2xl flex flex-col font-sans overflow-hidden my-auto text-left select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 sm:top-7 sm:right-7 w-10 h-10 rounded-full bg-[#ECEFF3] hover:bg-[#DFE1E6] text-[#1A1B25] flex items-center justify-center transition-colors cursor-pointer z-20 shadow-xs"
          aria-label="Close welcome modal"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Scrollable Container for All Viewports */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-10 md:px-12 pt-7 sm:pt-10 pb-8 sm:pb-12 scrollbar-thin">
          {/* Header Section */}
          <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-9 pr-8 sm:pr-0">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1A1B25] tracking-tight">
              Welcome to Heartboard
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-[#1A1B25]/80 font-medium mt-2 sm:mt-2.5 leading-relaxed">
              Give appreciation a place to live. Celebrate someone you love, leave a message for a person
            </p>
          </div>

          {/* 3x2 Grid on Desktop / Vertical Stack on Mobile */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5 md:gap-6">
            {WELCOME_FEATURE_CARDS.map((card) => {
              const IconComponent = card.Icon;
              return (
                <div
                  key={card.id}
                  className="bg-[#F8F9FB] rounded-[22px] sm:rounded-[24px] p-5 sm:p-6 md:p-7 flex flex-col justify-start items-start text-left transition-all"
                >
                  {/* Top Illustration Icon */}
                  <div className="mb-4 sm:mb-6 flex items-center justify-start">
                    <IconComponent />
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base sm:text-lg font-extrabold text-[#1A1B25] mb-1.5 sm:mb-2 leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#666D80] leading-relaxed font-normal">
                    {card.description}
                  </p>
                </div>
              );
            })}

            {/* 6th Card: Callout Card with "Leave a message" button */}
            <div className="bg-[#F8F9FB] rounded-[22px] sm:rounded-[24px] p-5 sm:p-6 md:p-7 flex flex-col justify-between items-start text-left">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#1A1B25] mb-1.5 sm:mb-2 leading-snug">
                  You don't have to know what to say.
                </h3>
                <p className="text-xs sm:text-sm text-[#666D80] leading-relaxed font-normal mb-5 sm:mb-6">
                  Sometimes a few words are enough. Someone deserves to hear something good from you.
                </p>
              </div>

              {/* Primary Callout Button */}
              <button
                type="button"
                onClick={onLeaveMessage}
                className="w-full py-3.5 px-6 rounded-full bg-[#FE6349] hover:bg-[#e05234] text-white font-bold text-sm sm:text-base shadow-xs hover:shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center"
              >
                Leave a message
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

