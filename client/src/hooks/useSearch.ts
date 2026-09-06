import { useEffect, useState } from 'react';
import { search, type SearchResults } from '../services/search.api';
import { boardToPost, userToRegisteredUser } from '../lib/adapters';
import type { Post, RegisteredUser } from '../types';

const EMPTY: SearchResults = { query: '', users: [], boards: [], hashtags: [] };

export interface SearchState {
  users: RegisteredUser[];
  boards: Post[];
  hashtags: { tag: string; count: number }[];
  loading: boolean;
  /** True once a query long enough to search has been issued. */
  active: boolean;
}

/**
 * How many of each kind to pull down. The panel reveals seven at a time, so
 * this is the pool the "Show more" buttons page through without another
 * request.
 */
const RESULT_POOL = 24;

/**
 * Debounced platform search.
 *
 * A query under two characters is still sent: the endpoint answers it in browse
 * mode with the most active accounts and most used tags, so the panel has
 * people and hashtags to show the moment it opens. It used to skip the request
 * entirely and render nothing until you had typed something to guess at.
 */
export function useSearch(
  query: string,
  currentUserId?: string,
  {
    /**
     * Whether to talk to the server at all. Required, because browse mode
     * fetches without a query — so an ungated hook would fire a request on
     * every page load whether or not anyone opened the search panel.
     */
    enabled = true,
    delay = 300,
  }: { enabled?: boolean; delay?: number } = {},
): SearchState {
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);

  const trimmed = query.trim();
  const active = trimmed.length >= 2;

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    // Browsing is not a keystroke, so it should not wait out the debounce.
    const timer = setTimeout(
      async () => {
        try {
          const data = await search(trimmed, { limit: RESULT_POOL });
          if (!cancelled) setResults(data);
        } catch {
          if (!cancelled) setResults(EMPTY);
        } finally {
          if (!cancelled) setLoading(false);
        }
      },
      active ? delay : 0,
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed, active, delay, enabled]);

  return {
    users: results.users.map(userToRegisteredUser),
    boards: results.boards.map((b) => boardToPost(b, currentUserId)),
    hashtags: results.hashtags,
    loading,
    active,
  };
}
