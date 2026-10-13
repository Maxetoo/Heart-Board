import { useEffect, useRef } from 'react';

/**
 * "Boards changed" — fired after any board is created, edited or deleted (and
 * after a message is posted, which moves boards into Collaboration).
 *
 * Profile tabs and the Home category view each fetch their list once and keep
 * it, so after an edit they went on showing the board under its OLD category
 * until the page was reloaded. They listen for this and refetch instead.
 */
const target = typeof window !== 'undefined' ? new EventTarget() : null;
const EVENT = 'hb:boards-changed';

export function notifyBoardsChanged(): void {
  target?.dispatchEvent(new Event(EVENT));
}

/** Calls `onChange` whenever boards change. The latest callback is always used. */
export function useBoardsChanged(onChange: () => void, enabled = true): void {
  const ref = useRef(onChange);
  ref.current = onChange;
  useEffect(() => {
    if (!enabled || !target) return;
    const handler = () => ref.current();
    target.addEventListener(EVENT, handler);
    return () => target.removeEventListener(EVENT, handler);
  }, [enabled]);
}
