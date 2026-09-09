import { useCallback, useEffect, useRef, useState } from 'react';
import * as boardApi from '../services/board.api';

export interface HeartSpec {
  /** Semantic Heart Spectrum id, e.g. 'loving'. */
  id: string;
  label: string;
  emoji?: string;
  /** Frame colour stored on the token, so it renders like any other board. */
  theme?: string;
}

export interface ProfileHeartTokens {
  /** Has the viewer already blown this heart category at this profile? */
  has(heartId: string): boolean;
  /** True while a toggle is in flight. */
  pending: boolean;
  /** True until the first lookup resolves. */
  loading: boolean;
  /**
   * Blows the heart, or takes it back if it is already there.
   * Resolves true when it was sent, false when it was removed, null on failure.
   */
  toggle(heart: HeartSpec): Promise<boolean | null>;
  reload(): void;
}

/**
 * The heart tokens the signed-in viewer has blown at ONE profile.
 *
 * A heart category is a statement, not a tally: you have either given this
 * person a Loving heart or you have not, so one token exists per (sender,
 * recipient, category). That is what lets the profile heart button be a true
 * toggle — pressing it writes a real token onto their Heartboard, pressing it
 * again deletes that token, and when the last person takes theirs back the
 * category stops appearing on their profile because nothing is left in it.
 *
 * The server enforces the same rule (createBoard returns the existing token
 * rather than a duplicate), so a double-tap cannot leave two behind.
 */
export function useProfileHeartTokens(
  username: string | undefined,
  viewerId: string | undefined,
): ProfileHeartTokens {
  const [hearts, setHearts] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);
  /** boardId per heart id, so a toggle-off knows what to delete. */
  const boardIds = useRef<Record<string, string>>({});

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!username || !viewerId) {
      setHearts([]);
      boardIds.current = {};
      return;
    }
    setLoading(true);
    try {
      const sent = await boardApi.getSentHearts(username);
      if (!mounted.current) return;
      const map: Record<string, string> = {};
      sent.forEach((h) => {
        if (h.heart) map[h.heart.toLowerCase()] = h._id;
      });
      boardIds.current = map;
      setHearts(Object.keys(map));
    } catch {
      // The button renders as un-given; pressing it still works.
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [username, viewerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const has = useCallback((heartId: string) => hearts.includes(heartId.toLowerCase()), [hearts]);

  const toggle = useCallback(
    async (heart: HeartSpec): Promise<boolean | null> => {
      if (!username || !viewerId || pending) return null;
      const key = heart.id.toLowerCase();
      const existingBoardId = boardIds.current[key];
      const wasGiven = Boolean(existingBoardId);

      setPending(true);
      // Optimistic: the heart fills on press and reverts if the write fails.
      setHearts((prev) => (wasGiven ? prev.filter((h) => h !== key) : [...prev, key]));

      try {
        if (wasGiven) {
          await boardApi.deleteBoard(existingBoardId);
          delete boardIds.current[key];
          return false;
        }

        const body = `${heart.label} Heart${heart.emoji ? ` ${heart.emoji}` : ''}`;
        const { board } = await boardApi.createBoard({
          title: body.slice(0, 80),
          description: body.slice(0, 300),
          visibility: 'public',
          receipent: username,
          kind: 'heart',
          style: {
            theme: heart.theme ?? '#FAF0EC',
            sticker: null,
            confetti: 'heart',
            hearts: [heart.id],
          },
        });
        boardIds.current[key] = board._id;
        return true;
      } catch {
        if (mounted.current) {
          setHearts((prev) => (wasGiven ? [...prev, key] : prev.filter((h) => h !== key)));
        }
        return null;
      } finally {
        if (mounted.current) setPending(false);
      }
    },
    [username, viewerId, pending],
  );

  return { has, pending, loading, toggle, reload: load };
}
