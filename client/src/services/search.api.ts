import { api, cleanParams } from '../lib/api';
import type { BoardDTO, UserDTO } from '../types/api';

export interface SearchResults {
  query: string;
  users: UserDTO[];
  boards: BoardDTO[];
  hashtags: { tag: string; count: number }[];
}

/**
 * GET /search — public, works signed out.
 * Replaces the prototype's in-memory filtering of a hard-coded user list.
 */
export async function search(
  q: string,
  params: { type?: 'all' | 'users' | 'boards' | 'hashtags'; limit?: number } = {},
): Promise<SearchResults> {
  if (!q || q.trim().length < 2) {
    return { query: q, users: [], boards: [], hashtags: [] };
  }

  const { data } = await api.get<SearchResults>('/search', {
    params: cleanParams({ q: q.trim(), type: 'all', limit: 10, ...params }),
  });
  return data;
}
