import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { notificationPermission, showNotification } from '../lib/notifications';

/**
 * Raises a browser notification when the signed-in user's counters move.
 *
 * There is no realtime channel in this app (no websocket, no SSE), so the
 * signals come from the counters GET /user/me already returns:
 *
 *   heartsCount   stats.profileLikes  -> someone blew you a heart
 *   taggedCount   stats.totalTagged   -> you were added to a new board
 *   messagesCount stats.totalMessages -> a new message landed on your boards
 *
 * That endpoint is Redis-cached for 5 minutes server-side, but every write path
 * that moves these numbers calls invalidate(keys.profile(userId)), so a poll
 * sees the change on the next tick rather than up to a TTL later.
 *
 * Each toggle in Settings gates its own notifications, and nothing is raised
 * until permission is actually granted.
 */

/** Long enough not to hammer the API, short enough to feel like a notification. */
const POLL_MS = 60_000;

interface Counters {
  hearts: number;
  tagged: number;
  messages: number;
}

const num = (v: string | number | undefined): number => {
  const n = typeof v === 'number' ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export function useHeartboardNotifications(): void {
  const { user, refresh } = useAuth();

  const heartsOn = user?.notificationPrefs?.heartTokenAlerts ?? true;
  const trophyOn = user?.notificationPrefs?.trophyCaseUpdates ?? true;
  const enabled = Boolean(user) && (heartsOn || trophyOn);

  /**
   * Last counters seen. `null` means "no baseline yet" — the first reading only
   * establishes one. Without that guard, signing in would fire a notification
   * for every heart the account has ever received.
   */
  const seen = useRef<Counters | null>(null);

  // Poll while the prefs are on and the browser will actually let us notify.
  useEffect(() => {
    if (!enabled) return;
    if (notificationPermission() !== 'granted') return;

    const id = window.setInterval(() => {
      void refresh();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [enabled, refresh]);

  // Compare each fresh profile against the last one and notify on increases.
  useEffect(() => {
    if (!user) {
      seen.current = null;
      return;
    }

    const next: Counters = {
      hearts: num(user.heartsCount),
      tagged: num(user.taggedCount),
      messages: num(user.messagesCount),
    };
    const prev = seen.current;
    seen.current = next;

    if (!prev) return;
    if (notificationPermission() !== 'granted') return;

    if (heartsOn && next.hearts > prev.hearts) {
      const n = next.hearts - prev.hearts;
      showNotification(n === 1 ? 'Someone blew you a heart' : `${n} people blew you a heart`, {
        body: 'Open Heartboard to see who.',
        tag: 'heartboard-hearts',
      });
    }

    if (trophyOn && next.tagged > prev.tagged) {
      const n = next.tagged - prev.tagged;
      showNotification(n === 1 ? 'You were added to a new board' : `You were added to ${n} new boards`, {
        body: 'A new entry for your trophy case.',
        tag: 'heartboard-tagged',
      });
    }

    if (trophyOn && next.messages > prev.messages) {
      const n = next.messages - prev.messages;
      showNotification(n === 1 ? 'New message on your board' : `${n} new messages on your boards`, {
        body: 'Someone added their appreciation.',
        tag: 'heartboard-messages',
      });
    }
  }, [user, heartsOn, trophyOn]);
}
