/**
 * Browser (Web Notifications API) delivery for the two toggles in Settings.
 *
 * SCOPE — read this before extending it:
 * These are notifications the page raises itself while it is open in a tab.
 * They are NOT Web Push: Web Push additionally needs a service worker, a VAPID
 * key pair, a stored PushSubscription per device and a server that sends to the
 * push endpoint — none of which exist in this codebase yet. When that lands,
 * `showNotification` is the seam to swap: everything else here (permission
 * handling, the pref gate, the dedupe tag) stays the same.
 *
 * Every call is defensive. Notification is absent in some embedded webviews and
 * on iOS Safari outside an installed PWA, and constructing one can throw even
 * when the constructor exists (Chrome on Android requires a service worker), so
 * nothing here is allowed to break the caller.
 */

export type NotificationSupport = 'supported' | 'unsupported';

export function notificationSupport(): NotificationSupport {
  return typeof window !== 'undefined' && 'Notification' in window ? 'supported' : 'unsupported';
}

/** 'denied' when unsupported, so callers can treat one path as "cannot notify". */
export function notificationPermission(): NotificationPermission {
  if (notificationSupport() === 'unsupported') return 'denied';
  try {
    return Notification.permission;
  } catch {
    return 'denied';
  }
}

/**
 * Asks for permission if it has not been decided yet.
 *
 * Must be called from a user gesture — browsers ignore (and Firefox rejects)
 * a permission prompt raised outside one, which is why this is wired to the
 * toggle's click handler rather than to an effect on mount.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (notificationSupport() === 'unsupported') return 'denied';
  try {
    if (Notification.permission !== 'default') return Notification.permission;
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export interface ShowOptions {
  body?: string;
  /** Same tag replaces an existing notification instead of stacking a duplicate. */
  tag?: string;
  /** Where to send the user on click. Defaults to focusing the current tab. */
  url?: string;
  icon?: string;
}

/**
 * Shows one notification. Silently does nothing without permission — a missing
 * notification is a far better failure than a thrown error inside a poll loop.
 */
export function showNotification(title: string, opts: ShowOptions = {}): boolean {
  if (notificationPermission() !== 'granted') return false;

  // The tab is already in front of the user; a desktop toast on top of it is
  // noise, not information.
  if (typeof document !== 'undefined' && document.visibilityState === 'visible') return false;

  try {
    const n = new Notification(title, {
      body: opts.body,
      tag: opts.tag,
      icon: opts.icon ?? '/favicon.ico',
    });
    n.onclick = () => {
      try {
        window.focus();
        if (opts.url) window.location.assign(opts.url);
        n.close();
      } catch {
        /* the tab may already be gone */
      }
    };
    return true;
  } catch {
    return false;
  }
}
