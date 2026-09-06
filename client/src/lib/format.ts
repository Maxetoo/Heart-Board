/**
 * Display formatting for counts.
 *
 * Kept here rather than in a component so the feed and the profile header agree
 * on what "1.2k" means. Neither invents a value: a missing or unparseable count
 * is zero, which is the honest answer for a new account.
 */

/** 999 -> "999", 1_200 -> "1.2k", 1_200_000 -> "1.2M". */
export function formatCount(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0';

  if (value >= 1_000_000) {
    const val = (value / 1_000_000).toFixed(1);
    return (val.endsWith('.0') ? String(Math.floor(value / 1_000_000)) : val) + 'M';
  }

  if (value >= 1_000) {
    const val = (value / 1_000).toFixed(1);
    return (val.endsWith('.0') ? String(Math.floor(value / 1_000)) : val) + 'k';
  }

  return Math.round(value).toLocaleString();
}

/**
 * The same, for counts that reach the client as strings (RegisteredUser carries
 * messagesCount and taggedCount that way).
 */
export function formatStatCount(value?: string | number | null): string {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').trim());
  return formatCount(Number.isFinite(n) ? n : 0);
}

/** Pluralises a label against one of those counts: 1 Message, 2 Messages. */
export function plural(value: string | number | null | undefined, word: string): string {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').trim());
  return n === 1 ? word : `${word}s`;
}
