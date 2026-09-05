import { api } from '../lib/api';
import type { GlobalStatsDTO } from '../types/api';

/**
 * GET /stats — real platform totals, replacing the fabricated counters that
 * used to live in App.tsx (8300 + ..., 7_600_000 + a random ticker).
 * Cached server-side; safe to call on mount.
 */
export async function getGlobalStats(): Promise<GlobalStatsDTO> {
  const { data } = await api.get<GlobalStatsDTO>('/stats');
  return data;
}
