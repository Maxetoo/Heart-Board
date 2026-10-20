import React from 'react';
import { X } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** "Create Message". */
  onLeaveMessage: () => void;
  /** "Explore Moment". Defaults to closing, which leaves the discover feed. */
  onExplore?: () => void;
}

/**
 * A heart in a 100x96 box, point at the bottom. Shared by the photo clip, the
 * pink rim behind it and the white edge that separates overlapping hearts.
 */
const HEART_PATH =
  'M50 92 C22 72 4 56 4 33 C4 16 17 4 32 4 C41 4 47 9 50 15 C53 9 59 4 68 4 C83 4 96 16 96 33 C96 56 78 72 50 92 Z';

/**
 * The photos live on Cloudinary (boardapp/site/welcome), not in the app
 * bundle. Each is delivered as a 400px square cropped around its subject, in
 * whichever format and quality the browser handles best — a few KB each.
 */
const welcomePhoto = (name: string, version: string) =>
  `https://res.cloudinary.com/dertr1bwm/image/upload/f_auto,q_auto,c_fill,g_auto,w_400,h_400/${version}/boardapp/site/welcome/${name}.webp`;

/** Back to front. */
const HEARTS = [
  { id: 'love', src: welcomePhoto('love', 'v1792496627'), x: 100, y: 0, size: 104 },
  { id: 'birthday', src: welcomePhoto('birthday', 'v1792496669'), x: 38, y: 50, size: 112 },
  { id: 'graduation', src: welcomePhoto('graduation', 'v1792496739'), x: 150, y: 50, size: 112 },
];

/** Three photos cut into overlapping hearts, each with a soft pink rim. */
const HeartCollage: React.FC = () => (
  <svg viewBox="30 -4 240 162" className="w-full max-w-[300px] tall-lg:max-w-[380px] mx-auto" role="img" aria-label="Photos of people celebrating">
    <defs>
      {HEARTS.map((h) => (
        <clipPath key={h.id} id={`hb-welcome-heart-${h.id}`}>
          <path d={HEART_PATH} transform={`translate(${h.x} ${h.y}) scale(${h.size / 100})`} />
        </clipPath>
      ))}
    </defs>
    {HEARTS.map((h) => {
      const t = `translate(${h.x} ${h.y}) scale(${h.size / 100})`;
      return (
        <g key={h.id}>
          <path d={HEART_PATH} transform={`translate(${h.x + 4} ${h.y + 3}) scale(${h.size / 100})`} fill="#FDE1DC" />
          <image
            href={h.src}
            x={h.x}
            y={h.y}
            width={h.size}
            height={h.size}
            preserveAspectRatio="xMidYMid slice"
            clipPath={`url(#hb-welcome-heart-${h.id})`}
          />
          <path d={HEART_PATH} transform={t} fill="none" stroke="#FFFFFF" strokeWidth={3 / (h.size / 100)} />
        </g>
      );
    })}
  </svg>
);

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onLeaveMessage,
  onExplore,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[350] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        className="relative w-full max-w-[400px] tall-lg:max-w-[540px] min-h-[min(720px,92dvh)] tall-lg:min-h-[min(860px,92dvh)] max-h-[92dvh] bg-white rounded-[2rem] tall-lg:rounded-[2.5rem] shadow-2xl flex flex-col font-sans overflow-y-auto my-auto text-center select-none px-5 pt-5 pb-5 tall-lg:px-9 tall-lg:pt-7 tall-lg:pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 tall-lg:top-7 tall-lg:right-7 w-10 h-10 tall-lg:w-12 tall-lg:h-12 rounded-full bg-[#F5F6F8] hover:bg-[#ECEFF3] text-[#666D80] hover:text-[#1A1B25] flex items-center justify-center transition-colors cursor-pointer z-10"
          aria-label="Close welcome"
        >
          <X className="w-5 h-5 stroke-[2]" />
        </button>

        <div className="shrink-0 pt-12 [@media(max-height:760px)]:pt-8 tall-lg:pt-14 px-3">
          <HeartCollage />
        </div>

        <h2 id="welcome-title" className="shrink-0 mt-5 tall-lg:mt-7 text-[30px] sm:text-[32px] tall-lg:text-[42px] leading-[1.15] font-extrabold text-[#1A1B25] tracking-tight">
          Make Someone
          <br />
          Feel Loved
        </h2>
        <p className="shrink-0 mt-3 tall-lg:mt-4 px-2 tall-lg:px-6 text-[15px] tall-lg:text-[18px] leading-relaxed font-medium text-[#808897]">
          Leave a heartfelt message, bring people together for someone who matters, publicly,
          privately, or anonymously.
        </p>

        {/* Pushes the tagline and buttons to the bottom of the card. */}
        <div className="flex-1 min-h-8 [@media(max-height:760px)]:min-h-4" />

        <p className="shrink-0 text-[14px] tall-lg:text-[17px] leading-snug font-semibold text-[#666D80]">
          Make it meaningful. Make it together.
          <br />
          Create with Heartboard.
        </p>

        <button
          type="button"
          onClick={onLeaveMessage}
          className="shrink-0 mt-5 tall-lg:mt-6 w-full h-14 tall-lg:h-16 rounded-full bg-[#FE6349] hover:bg-[#e05234] text-white font-bold text-base tall-lg:text-lg transition-all active:scale-[0.98] cursor-pointer"
        >
          Create Message
        </button>
        <button
          type="button"
          onClick={onExplore ?? onClose}
          className="shrink-0 mt-3 w-full h-14 tall-lg:h-16 rounded-full bg-[#F5F6F8] hover:bg-[#ECEFF3] text-[#1A1B25] font-bold text-base tall-lg:text-lg transition-all active:scale-[0.98] cursor-pointer"
        >
          Explore Moment
        </button>
      </div>
    </div>
  );
};
