import type { BoardEvent } from '../types/api';

/**
 * The board categories — ONE list, used by the composer's picker, the filter
 * modal and the server's enum (models/boardModel.js `event`).
 *
 * They used to be three lists that disagreed: the composer offered ten
 * categories, the server accepted eight, and five of the composer's
 * (Appreciation, Congratulations, Condolence, Friendship, Love) were not among
 * them — so they were silently saved as "other". That is the "it keeps going
 * back to Other" bug. Keep this list and the server enum in step.
 */
export interface BoardCategory {
  id: BoardEvent;
  label: string;
  emoji: string;
}

export const BOARD_CATEGORIES: BoardCategory[] = [
  { id: 'graduation', label: 'Graduation', emoji: '🎓' },
  { id: 'wedding', label: 'Wedding', emoji: '💍' },
  { id: 'birthday', label: 'Birthday', emoji: '🎂' },
  { id: 'anniversary', label: 'Anniversary', emoji: '💐' },
  { id: 'appreciation', label: 'Appreciation', emoji: '🙌' },
  { id: 'congratulations', label: 'Congratulations', emoji: '🎉' },
  { id: 'condolence', label: 'Condolence', emoji: '🕯️' },
  { id: 'friendship', label: 'Friendship', emoji: '🤝' },
  { id: 'love', label: 'Love', emoji: '❤️' },
  { id: 'other', label: 'Other', emoji: '✨' },
];

/** Older boards may carry these; they still read back and filter correctly. */
const LEGACY: Partial<Record<string, { label: string }>> = {
  sport: { label: 'Sport' },
  retirement: { label: 'Retirement' },
  promotion: { label: 'Promotion' },
};

/**
 * A category id from either an id ("birthday") or a label ("Birthday").
 * Exact matches only — no guessing from substrings, which is how a board
 * captioned "Lovely day" used to land in Love. Unknown input gives null.
 */
export function categoryIdOf(value?: string | null): BoardEvent | null {
  if (!value) return null;
  const clean = value.trim().toLowerCase().replace(/_/g, ' ');
  const hit = BOARD_CATEGORIES.find((c) => c.id === clean || c.label.toLowerCase() === clean);
  if (hit) return hit.id;
  return LEGACY[clean] ? (clean as BoardEvent) : null;
}

/** The label to show for a stored category id (or label). */
export function categoryLabelOf(value?: string | null): string {
  const id = categoryIdOf(value);
  if (!id) return '';
  return BOARD_CATEGORIES.find((c) => c.id === id)?.label ?? LEGACY[id]?.label ?? '';
}

/** True when a board belongs to the category a filter is set to. */
export function matchesCategory(boardEvent: string | null | undefined, filterId: string): boolean {
  const want = categoryIdOf(filterId);
  return Boolean(want) && categoryIdOf(boardEvent) === want;
}
