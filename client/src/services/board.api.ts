import { api, cleanParams } from '../lib/api';
import type {
  BoardDTO,
  BoardEvent,
  BoardTier,
  BoardVisibility,
  PaginationDTO,
  ReactionKey,
  UserRefDTO,
} from '../types/api';

export interface CreateBoardPayload {
  title: string;
  description?: string;
  visibility?: BoardVisibility;
  /**
   * The recipient, as a plain USERNAME ("mercy24") or a hashtag ("#birthday").
   * The server resolves it: a leading '#' is stored as receipentHashtag, and
   * anything else is looked up as a username and stored as an ObjectId.
   * Send it WITHOUT a leading '@'. (controllers/boardController.js createBoard)
   */
  receipent?: string | null;
  /**
   * 'heart' stores this row as a blown heart token rather than a message board.
   * Heart tokens are excluded from the plan's board quota server-side.
   */
  kind?: 'board' | 'heart';
  event?: BoardEvent | null;
  coverImage?: string | null;
  coverImagePublicId?: string | null;
  tags?: string[];
  onlyMe?: boolean;
  /**
   * `hearts` are Semantic Heart Spectrum ids; the server caps the list at 12.
   *
   * Pass `null` to CLEAR theme/sticker/confetti — the server only overwrites a
   * field it actually receives, and JSON.stringify silently drops `undefined`,
   * so `undefined` means "leave as is". The types allowed only `string`, which
   * is why clearing a confetti was impossible to express.
   */
  style?: {
    theme?: string | null;
    sticker?: string | null;
    confetti?: string | null;
    hearts?: string[];
  };
}

export async function createBoard(payload: CreateBoardPayload) {
  const { data } = await api.post<{
    message: string;
    board: BoardDTO;
    /**
     * Heart tokens only: this category had already been blown at this person,
     * so the EXISTING token is being returned rather than a duplicate created.
     */
    alreadySent?: boolean;
  }>('/board', payload);
  return data;
}

export async function getMyBoards(
  params: {
    page?: number;
    limit?: number;
    view?: 'owned' | 'tagged' | 'collaboration';
    tier?: BoardTier;
    visibility?: BoardVisibility;
    status?: string;
    event?: BoardEvent;
    /**
     * Omitted, the server returns message boards ONLY. Pass 'heart' for the
     * Heartboard tabs — heart tokens are boards underneath but never appear in
     * a board listing.
     */
    kind?: 'heart';
  } = {},
) {
  const { data } = await api.get<{ view: string; boards: BoardDTO[]; pagination: PaginationDTO }>(
    '/board',
    { params: cleanParams({ page: 1, limit: 12, view: 'owned', ...params }) },
  );
  return data;
}

/** Public feed. Works signed-out (checkUser middleware). */
export async function discoverBoards(
  params: { page?: number; limit?: number; sort?: string; event?: BoardEvent } = {},
) {
  const { data } = await api.get<{ boards: BoardDTO[]; pagination: PaginationDTO }>(
    '/board/discover',
    { params: cleanParams({ page: 1, limit: 12, sort: 'latest', ...params }) },
  );
  return data;
}

/** Full board including populated owner + receipent, plus sponsors. */
export async function getBoardBySlug(slug: string) {
  const { data } = await api.get<{ board: BoardDTO; sponsors: unknown[] }>(
    `/board/${encodeURIComponent(slug)}`,
  );
  return data;
}

export async function updateBoard(id: string, fields: Partial<CreateBoardPayload>) {
  const { data } = await api.patch<{ message: string; board: BoardDTO }>(`/board/${id}`, fields);
  return data;
}

export async function deleteBoard(id: string) {
  const { data } = await api.delete<{ message: string }>(`/board/${id}`);
  return data;
}

/** Toggles the like. `liked` tells you which way it went. */
export async function likeBoard(id: string) {
  const { data } = await api.post<{ liked: boolean; likeCount: number }>(`/board/${id}/like`);
  return data;
}

export async function getMyReaction(id: string) {
  const { data } = await api.get<{ reaction: ReactionKey | null; reactions: ReactionKey[] }>(
    `/board/${id}/reaction/me`,
  );
  return data.reactions ?? [];
}

/**
 * Replaces this account's reactions on a board with exactly `reactions`.
 *
 * Send `[]` to clear them. The endpoint upserts, so this is also how a FIRST
 * reaction is stored — nothing has to have liked the board beforehand.
 */
export async function setReactions(id: string, reactions: ReactionKey[]) {
  const { data } = await api.patch<{
    reaction: ReactionKey | null;
    reactions: ReactionKey[];
    reactionCounts: Partial<Record<ReactionKey, number>>;
    likeCount: number;
  }>(`/board/${id}/reaction`, { reactions });
  return data;
}

/** Increments the share counter and returns the canonical share URL. */
export async function shareBoard(id: string) {
  const { data } = await api.post<{ shareUrl: string; shares: number }>(`/board/${id}/share`);
  return data;
}

/**
 * GET /board/hashtag/:tag
 * NOTE: this endpoint returns a FLAT { boards, total, page, pages } shape rather
 * than the { boards, pagination } used everywhere else. Normalised here.
 */
export async function getBoardsByHashtag(tag: string, params: { page?: number; limit?: number } = {}) {
  const { data } = await api.get<{
    boards: BoardDTO[];
    total: number;
    page: number;
    pages: number;
  }>(`/board/hashtag/${encodeURIComponent(tag.replace(/^#/, ''))}`, {
    params: cleanParams({ page: 1, limit: 20, ...params }),
  });

  return {
    boards: data.boards,
    pagination: {
      total: data.total,
      page: data.page,
      pages: data.pages,
      limit: params.limit ?? 20,
    } as PaginationDTO,
  };
}

export async function getLikedBoardIds() {
  const { data } = await api.get<{ likedBoardIds: string[] }>('/board/likes/me');
  return data.likedBoardIds ?? [];
}

/** One public heart, as the hero radar renders it. */
export interface RadarHeart {
  id: string;
  /** Semantic Heart Spectrum id, e.g. 'loving'. */
  heart: string | null;
  createdAt: string;
  sender: { name: string; username: string };
  recipient: { name: string; username: string };
}

/**
 * Recent public hearts, platform-wide.
 *
 * A POOL, not the single newest one: the radar shows one line at a time on a
 * fixed cadence and picks from this at random, so a rush of activity changes
 * what is on screen without changing how fast it moves.
 */
export async function getRecentHearts(limit = 25) {
  const { data } = await api.get<{ hearts: RadarHeart[] }>('/board/hearts/recent', {
    params: { limit },
  });
  return data.hearts ?? [];
}

/** One heart token the caller has blown at somebody. */
export interface SentHeart {
  _id: string;
  slug: string;
  /** Semantic Heart Spectrum id, e.g. 'loving'. */
  heart: string | null;
  createdAt: string;
}

/**
 * Which heart categories the caller has already blown at `username`.
 *
 * Backs the profile heart button: it is filled when a 'loving' token exists and
 * pressing it again deletes that token.
 */
export async function getSentHearts(username: string) {
  const { data } = await api.get<{ hearts: SentHeart[] }>('/board/hearts/sent', {
    params: { to: username },
  });
  return data.hearts ?? [];
}

/**
 * Every reaction this account has left, keyed by board id.
 *
 * The board list responses are cached with no viewer in the key, so they carry
 * the TOTALS only. This is the other half: which of them are yours.
 */
export async function getMyReactions() {
  const { data } = await api.get<{
    likedBoardIds: string[];
    reactions: Record<string, ReactionKey[]>;
  }>('/board/likes/me');
  return data.reactions ?? {};
}

export async function flagBoard(slug: string, reason?: string) {
  const { data } = await api.patch<{ message: string }>(`/board/${slug}/flag`, { reason });
  return data;
}

export async function unflagBoard(slug: string) {
  const { data } = await api.patch<{ message: string }>(`/board/${slug}/unflag`);
  return data;
}

export type { UserRefDTO };
