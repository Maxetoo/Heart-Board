import React, { useCallback, useState } from 'react';
import { HandTap, X } from '@phosphor-icons/react';

/**
 * Whether a one-time guide has already been seen, remembered per browser.
 *
 * Storage can be unavailable (private mode, blocked site data); then the guide
 * simply shows again next time, which is harmless.
 */
export function useGuideSeen(key: string): [boolean, () => void] {
  const storageKey = `hb:guide:${key}`;
  const [seen, setSeen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(storageKey) === '1';
    } catch {
      return false;
    }
  });
  const markSeen = useCallback(() => {
    setSeen(true);
    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      // Not persisted; the in-memory flag still hides it for this session.
    }
  }, [storageKey]);
  return [seen, markSeen];
}

interface FeatureGuideProps {
  /** One short instruction per line. */
  lines: { action: string; result: string }[];
  onDismiss: () => void;
  className?: string;
}

/** A small dark tip card: what to tap, and what it does. */
export const FeatureGuide: React.FC<FeatureGuideProps> = ({ lines, onDismiss, className = '' }) => (
  <div
    role="note"
    className={`bg-[#1A1B25]/90 backdrop-blur-sm text-white rounded-2xl pl-3.5 pr-2 py-3 shadow-lg flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-300 ${className}`}
    onPointerDown={(e) => e.stopPropagation()}
    onClick={(e) => e.stopPropagation()}
    onDoubleClick={(e) => e.stopPropagation()}
  >
    <HandTap size={22} weight="bold" className="shrink-0 mt-0.5 text-[#FFB8A8]" />
    <ul className="flex-1 space-y-1 text-[13px] leading-snug">
      {lines.map((l) => (
        <li key={l.action}>
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
  </div>
);
