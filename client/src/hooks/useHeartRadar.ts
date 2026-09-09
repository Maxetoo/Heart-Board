import { useEffect, useRef, useState } from 'react';
import * as boardApi from '../services/board.api';
import type { RadarHeart } from '../services/board.api';

/** How often the pool is refreshed from the server. */
const POLL_MS = 30_000;

/**
 * The pool of recent public hearts behind the hero radar.
 *
 * Two deliberate properties:
 *
 *  - It holds a POOL, not the latest heart. What is on screen and how often it
 *    changes are separate concerns: the ticker rotates on its own fixed clock
 *    and reads from here, so twenty people blowing hearts at once enlarges the
 *    pool without making anything move faster.
 *
 *  - It stops polling while the tab is hidden, and refreshes once on the way
 *    back. A backgrounded tab has nobody watching the radar, and left running
 *    it would keep a request every 30 seconds going indefinitely.
 *
 * Works signed out — the landing page shows the radar to visitors.
 */
export function useHeartRadar(limit = 25): { hearts: RadarHeart[]; loading: boolean } {
  const [hearts, setHearts] = useState<RadarHeart[]>([]);
  const [loading, setLoading] = useState(true);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const load = async () => {
      try {
        const list = await boardApi.getRecentHearts(limit);
        if (mounted.current) setHearts(list);
      } catch {
        // Keep whatever is already on the radar; a failed refresh must not
        // blank a ticker that is happily rotating.
      } finally {
        if (mounted.current) setLoading(false);
      }
    };

    const start = () => {
      if (timer) return;
      timer = setInterval(load, POLL_MS);
    };

    const stop = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void load();
        start();
      } else {
        stop();
      }
    };

    void load();
    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [limit]);

  return { hearts, loading };
}
