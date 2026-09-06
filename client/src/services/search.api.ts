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
 *
 * An empty or one-character `q` is a real request, not a no-op: the endpoint
 * answers it in browse mode with the most active accounts and the most used
 * hashtags. This used to return three empty arrays without asking, which is why
 * the search panel opened with nothing under People or Hashtags.
 */
export async function search(
  q: string,
  params: { type?: 'all' | 'users' | 'boards' | 'hashtags'; limit?: number } = {},
): Promise<SearchResults> {
  const { data } = await api.get<SearchResults>('/search', {
    params: cleanParams({ q: q.trim(), type: 'all', limit: 10, ...params }),
  });
  return data;
}
