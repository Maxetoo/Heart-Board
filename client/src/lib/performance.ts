/**
 * Device capability, for scaling back visual effects where they would stutter.
 *
 * Old and budget Android phones were the ones lagging on boards with effects.
 * Their GPUs stall on blurs and filters — worst of all on elements that are
 * also animating, which forces the blur to be redrawn every frame. Capable
 * devices keep every effect; a low-power device gets a lighter version: no
 * blurred glows, drop-shadows or backdrop blur, fewer floating hearts, and
 * lighter confetti.
 *
 * Signals, all best-effort (a browser that hides them is treated as capable):
 *   - prefers-reduced-motion: the person asked their OS for less motion
 *   - Data Saver switched on
 *   - 2GB of RAM or less (navigator.deviceMemory, which the browser rounds down)
 *   - 4 CPU cores or fewer
 *
 * For testing on any device: localStorage.setItem('hb_low_power', '1') forces
 * the light version on, '0' forces it off. Reload after changing it.
 */
type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

const matches = (query: string): boolean => {
  try {
    return window.matchMedia?.(query).matches ?? false;
  } catch {
    return false;
  }
};

/** The person asked their OS for less motion. Confetti is skipped entirely. */
export const PREFERS_REDUCED_MOTION =
  typeof window !== 'undefined' && matches('(prefers-reduced-motion: reduce)');

export function detectLowPower(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  try {
    const forced = localStorage.getItem('hb_low_power');
    if (forced === '1') return true;
    if (forced === '0') return false;
  } catch {
    /* storage blocked: fall through to detection */
  }
  if (PREFERS_REDUCED_MOTION) return true;
  const nav = navigator as NavigatorWithHints;
  if (nav.connection?.saveData) return true;
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory > 0 && nav.deviceMemory <= 2) return true;
  if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency > 0 && nav.hardwareConcurrency <= 4) {
    return true;
  }
  return false;
}

/** Decided once at startup: a device's capability does not change mid-session. */
export const IS_LOW_POWER = detectLowPower();
