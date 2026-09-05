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
 * Debounced platform search. Queries shorter than 2 characters are not sent —
 * the server returns empty for those anyway.
 */
export function useSearch(query: string, currentUserId?: string, delay = 300): SearchState {
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);

  const trimmed = query.trim();
  const active = trimmed.length >= 2;

  useEffect(() => {
    if (!active) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const data = await search(trimmed);
        if (!cancelled) setResults(data);
      } catch {
        if (!cancelled) setResults(EMPTY);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed, active, delay]);

  return {
    users: results.users.map(userToRegisteredUser),
    boards: results.boards.map((b) => boardToPost(b, currentUserId)),
    hashtags: results.hashtags,
    loading,
    active,
  };
}
