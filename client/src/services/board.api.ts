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
  const { data } = await api.post<{ message: string; board: BoardDTO }>('/board', payload);
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
  const { data } = await api.get<{ reaction: ReactionKey | null }>(`/board/${id}/reaction/me`);
  return data.reaction;
}

export async function patchReaction(id: string, reaction: ReactionKey | null) {
  const { data } = await api.patch<{ reaction: ReactionKey | null; lastReaction: ReactionKey | null }>(
    `/board/${id}/reaction`,
    { reaction },
  );
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

export async function flagBoard(slug: string, reason?: string) {
  const { data } = await api.patch<{ message: string }>(`/board/${slug}/flag`, { reason });
  return data;
}

export async function unflagBoard(slug: string) {
  const { data } = await api.patch<{ message: string }>(`/board/${slug}/unflag`);
  return data;
}

export type { UserRefDTO };
