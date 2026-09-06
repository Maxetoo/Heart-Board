import { useCallback, useEffect, useRef, useState } from 'react';
import * as userApi from '../services/user.api';

/**
 * Which profiles the signed-in user has dropped a heart on.
 *
 * The server has always had both halves of this — POST /user/:id/like toggles
 * it, GET /user/likes/me returns the set — but nothing in the client ever read
 * them, so a heart the user had already dropped looked exactly like one they
 * had not.
 *
 * The set is loaded once per session and then maintained optimistically; the
 * toggle response is authoritative and reconciles it.
 */
export interface LikedProfiles {
  /** Has the signed-in user hearted this profile? */
  isLiked(userId: string | undefined | null): boolean;
  /** True while a toggle for this profile is in flight. */
  isPending(userId: string | undefined | null): boolean;
  /** Toggles the heart. Resolves to the new state, or null if it could not run. */
  toggle(userId: string | undefined | null): Promise<boolean | null>;
  ready: boolean;
}

export function useLikedProfiles(currentUserId: string | undefined): LikedProfiles {
  const [liked, setLiked] = useState<Set<string>>(() => new Set());
  const [pending, setPending] = useState<Set<string>>(() => new Set());
  const [ready, setReady] = useState(false);

  // Guards a toggle that resolves after the user has signed out.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!currentUserId) {
      setLiked(new Set());
      setReady(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const ids = await userApi.getLikedProfiles();
        if (!cancelled) setLiked(new Set(ids));
      } catch {
        // A failure here only means hearts render as un-dropped; it must not
        // break the profile page.
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUserId]);

  const isLiked = useCallback(
    (userId: string | undefined | null) => Boolean(userId && liked.has(userId)),
    [liked],
  );

  const isPending = useCallback(
    (userId: string | undefined | null) => Boolean(userId && pending.has(userId)),
    [pending],
  );

  const toggle = useCallback(
    async (userId: string | undefined | null): Promise<boolean | null> => {
      // The server rejects hearting yourself; do not spend a request on it.
      if (!userId || !currentUserId || userId === currentUserId) return null;
      if (pending.has(userId)) return null;

      const wasLiked = liked.has(userId);
      setPending((prev) => new Set(prev).add(userId));
      // Optimistic: the heart fills on click, and reverts if the write fails.
      setLiked((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.delete(userId);
        else next.add(userId);
        return next;
      });

      try {
        const { liked: nowLiked } = await userApi.likeProfile(userId);
        if (!mounted.current) return null;
        // Trust the server over the optimistic guess.
        if (typeof nowLiked === 'boolean') {
          setLiked((prev) => {
            const next = new Set(prev);
            if (nowLiked) next.add(userId);
            else next.delete(userId);
            return next;
          });
          return nowLiked;
        }
        return !wasLiked;
      } catch {
        if (mounted.current) {
          setLiked((prev) => {
            const next = new Set(prev);
            if (wasLiked) next.add(userId);
            else next.delete(userId);
            return next;
          });
        }
        return null;
      } finally {
        if (mounted.current) {
          setPending((prev) => {
            const next = new Set(prev);
            next.delete(userId);
            return next;
          });
        }
      }
    },
    [currentUserId, liked, pending],
  );

  return { isLiked, isPending, toggle, ready };
}
