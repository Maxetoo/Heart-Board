import React, { useCallback, useEffect, useState } from 'react';
import { HandTap, X } from '@phosphor-icons/react';

/**
 * One-time guides: each is shown to a person ONCE, ever, on this browser.
 *
 * It counts as seen the moment it appears — not only when it is dismissed —
 * so leaving the page with a tip still open does not bring it back. Recorded
 * in localStorage and mirrored to a long-lived cookie, so clearing one store
 * (or a browser that blocks localStorage) does not resurface every tip.
 */
const COOKIE = 'hb_guides';
const ONE_YEAR_S = 60 * 60 * 24 * 365;

const cookieKeys = (): string[] => {
  try {
    const raw = document.cookie.split('; ').find((c) => c.startsWith(`${COOKIE}=`));
    return raw ? decodeURIComponent(raw.slice(COOKIE.length + 1)).split('|').filter(Boolean) : [];
  } catch {
    return [];
  }
};

const hasSeenGuide = (key: string): boolean => {
  try {
    if (localStorage.getItem(`hb:guide:${key}`) === '1') return true;
  } catch {
    // Fall through to the cookie.
  }
  return cookieKeys().includes(key);
};

const recordGuideSeen = (key: string) => {
  try {
    localStorage.setItem(`hb:guide:${key}`, '1');
  } catch {
    // Storage blocked; the cookie below still remembers it.
  }
  try {
    const keys = new Set(cookieKeys());
    keys.add(key);
    document.cookie =
      `${COOKIE}=${encodeURIComponent([...keys].join('|'))}; max-age=${ONE_YEAR_S}; path=/; SameSite=Lax`;
  } catch {
    // Nothing more we can do; worst case it shows once more.
  }
};

/**
 * [hidden, dismiss, recordShown] for one guide.
 *
 * `hidden` is decided when the screen mounts: a guide already shown once stays
 * hidden from then on. `recordShown` is called by <FeatureGuide> as it appears;
 * it saves the guide as seen but leaves it on screen until it is dismissed.
 */
export function useGuideSeen(key: string): [boolean, () => void, () => void] {
  const [hidden, setHidden] = useState<boolean>(() => hasSeenGuide(key));
  const dismiss = useCallback(() => {
    setHidden(true);
    recordGuideSeen(key);
  }, [key]);
  const recordShown = useCallback(() => recordGuideSeen(key), [key]);
  return [hidden, dismiss, recordShown];
}

interface FeatureGuideProps {
  /** One short instruction per line. */
  lines: { action: React.ReactNode; result: string }[];
  onDismiss: () => void;
  /** Called once as the guide appears, to save it as seen. */
  onShown?: () => void;
  className?: string;
  /** A speech-bubble pointer on the card's bottom-right edge. */
  tail?: 'bottom-right';
}

/** A small dark tip card: what to tap, and what it does. */
export const FeatureGuide: React.FC<FeatureGuideProps> = ({ lines, onDismiss, onShown, className = '', tail }) => {
  // Saved as seen the moment it is on screen: a guide is shown once, ever.
  useEffect(() => {
    onShown?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
  <div
    role="note"
    className={`bg-[#1A1B25]/90 backdrop-blur-sm text-white rounded-2xl pl-3.5 pr-2 py-3 shadow-lg flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-300 ${className}`}
    onPointerDown={(e) => e.stopPropagation()}
    onClick={(e) => e.stopPropagation()}
    onDoubleClick={(e) => e.stopPropagation()}
  >
    <HandTap size={22} weight="bold" className="shrink-0 mt-0.5 text-[#FFB8A8]" />
    <ul className="flex-1 space-y-1 text-[13px] leading-snug">
      {lines.map((l, i) => (
        <li key={i}>
          <span className="font-extrabold">{l.action}</span>
          <span className="text-white/75"> {l.result}</span>
        </li>
      ))}
    </ul>
    <button
      type="button"
      onClick={onDismiss}
      className="shrink-0 w-7 h-7 -mt-1 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
      aria-label="Dismiss tip"
    >
      <X size={16} weight="bold" />
    </button>
    {tail === 'bottom-right' && (
      <span
        aria-hidden
        className="absolute top-full right-6 w-4 h-2 bg-[#1A1B25]/90 [clip-path:polygon(0_0,100%_0,50%_100%)]"
      />
    )}
  </div>
);
};
