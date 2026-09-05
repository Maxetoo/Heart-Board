import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as boardApi from '../services/board.api';
import { boardToPost } from '../lib/adapters';
import { toApiError } from '../lib/api';
import type { Post } from '../types';
import type { BoardEvent, PaginationDTO } from '../types/api';

export interface FeedState {
  posts: Post[];
  /**
   * Direct access for optimistic local edits (contributions, inline updates).
   * Prefer patchPost/removePost/prependPost where they fit; always pair an
   * optimistic change here with the corresponding API call.
   */
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  pagination: PaginationDTO | null;
  hasMore: boolean;
  loadMore(): void;
  reload(): void;
  /** Replace a single post in place, e.g. after a like or an edit. */
  patchPost(id: string, patch: Partial<Post>): void;
  /** Drop a post from the list, e.g. after a delete. */
  removePost(id: string): void;
  /** Insert a freshly created post at the top. */
  prependPost(post: Post): void;
}

interface FeedOptions {
  sort?: string;
  event?: BoardEvent;
  limit?: number;
  currentUserId?: string;
  /** Set false to skip fetching (e.g. while auth is still resolving). */
  enabled?: boolean;
}

/**
 * Server-paginated discover feed.
 *
 * Replaces the prototype's `useState(INITIAL_MOCK_POSTS)` plus in-memory
 * .filter(), which could only ever show the first page of data.
 */
export function useDiscoverFeed(options: FeedOptions = {}): FeedState {
  const { sort = 'latest', event, limit = 12, currentUserId, enabled = true } = options;

  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<PaginationDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guards against a stale response from a superseded filter overwriting a
  // newer one.
  const requestId = useRef(0);

  const fetchPage = useCallback(
    async (page: number, append: boolean) => {
      const id = ++requestId.current;
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const data = await boardApi.discoverBoards({ page, limit, sort, event });
        if (id !== requestId.current) return;

        const mapped = data.boards.map((b) => boardToPost(b, currentUserId));
        setPosts((prev) => (append ? [...prev, ...mapped] : mapped));
        setPagination(data.pagination);
      } catch (e) {
        if (id !== requestId.current) return;
        setError(toApiError(e).message);
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [limit, sort, event, currentUserId],
  );

  useEffect(() => {
    if (!enabled) return;
    void fetchPage(1, false);
  }, [fetchPage, enabled]);

  const hasMore = Boolean(pagination && pagination.page < pagination.pages);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading || !pagination) return;
    void fetchPage(pagination.page + 1, true);
  }, [hasMore, loadingMore, loading, pagination, fetchPage]);

  const reload = useCallback(() => void fetchPage(1, false), [fetchPage]);

  const patchPost = useCallback((id: string, patch: Partial<Post>) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const removePost = useCallback((id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const prependPost = useCallback((post: Post) => {
    setPosts((prev) => [post, ...prev]);
  }, []);

  return {
    posts,
    setPosts,
    loading,
    loadingMore,
    error,
    pagination,
    hasMore,
    loadMore,
    reload,
    patchPost,
    removePost,
    prependPost,
  };
}

/** A single board plus its sponsors, addressed by slug. */
export function useBoard(slug: string | undefined, currentUserId?: string) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(Boolean(slug));
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const { board } = await boardApi.getBoardBySlug(slug);
      setPost(boardToPost(board, currentUserId));
    } catch (e) {
      const err = toApiError(e);
      setStatus(err.status);
      setError(
        err.status === 403
          ? 'This board is private.'
          : err.status === 404
            ? 'That board could not be found.'
            : err.message,
      );
    } finally {
      setLoading(false);
    }
  }, [slug, currentUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { post, setPost, loading, error, status, reload: load };
}
