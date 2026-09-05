import { api, cleanParams } from '../lib/api';
import type {
  MessageContentDTO,
  MessageDTO,
  MessageStatus,
  MessageType,
  PaginationDTO,
} from '../types/api';

export interface PostMessagePayload {
  /** Server enum is text | audio | emblem. There is NO 'image' type — an image
   *  message is type 'emblem' with content.imageUrls populated. */
  type: MessageType;
  content: MessageContentDTO;
  cloudinaryPublicId?: string | null;
  fileType?: 'image' | 'video' | 'audio' | null;
  canvasData?: unknown;
}

/**
 * POST /message/board/:slug
 * Path fixed in this migration: it used to be POST /message/:slug, which
 * shadowed POST /message/:username and made direct messages unreachable.
 * See CLIENT_MIGRATION_INSTRUCTIONS.txt §12.1.
 */
export async function postMessage(slug: string, payload: PostMessagePayload) {
  const { data } = await api.post<{ message: string; data: MessageDTO }>(
    `/message/board/${encodeURIComponent(slug)}`,
    payload,
  );
  return data.data;
}

export async function getBoardMessages(
  slug: string,
  params: { page?: number; limit?: number; type?: MessageType; status?: MessageStatus } = {},
) {
  const { data } = await api.get<{ messages: MessageDTO[]; pagination: PaginationDTO }>(
    `/message/${encodeURIComponent(slug)}/board`,
    { params: cleanParams({ page: 1, limit: 20, ...params }) },
  );
  return data;
}

export async function getMessage(id: string) {
  const { data } = await api.get<{ message: MessageDTO }>(`/message/${id}`);
  return data.message;
}

export async function editMessage(
  id: string,
  payload: {
    content?: MessageContentDTO;
    cloudinaryPublicId?: string | null;
    fileType?: string | null;
    canvasData?: unknown;
  },
) {
  const { data } = await api.patch<{ message: string; data: MessageDTO }>(`/message/${id}`, payload);
  return data;
}

/** Deleting the last message on a board can delete the board — check boardDeleted. */
export async function deleteMessage(id: string) {
  const { data } = await api.delete<{ message: string; boardDeleted?: boolean }>(`/message/${id}`);
  return data;
}

export async function getMyMessages(
  params: { page?: number; limit?: number; context?: 'board' | 'direct' } = {},
) {
  const { data } = await api.get<{ messages: MessageDTO[]; pagination: PaginationDTO }>(
    '/message/mine',
    { params: cleanParams({ page: 1, limit: 20, ...params }) },
  );
  return data;
}

export async function moderateBoardMessage(id: string, status: MessageStatus) {
  const { data } = await api.patch<{ message: string; data: MessageDTO }>(
    `/message/${id}/board/moderate`,
    { status },
  );
  return data;
}

export async function moderateDirectMessage(id: string, status: MessageStatus) {
  const { data } = await api.patch<{ message: string; data: MessageDTO }>(
    `/message/${id}/direct/moderate`,
    { status },
  );
  return data;
}

/**
 * POST /message/direct/:username — path fixed in this migration (§12.1).
 */
export async function postDirectMessage(
  username: string,
  payload: { type: MessageType; content: MessageContentDTO },
) {
  const { data } = await api.post<{ message: string; data: MessageDTO }>(
    `/message/direct/${encodeURIComponent(username)}`,
    payload,
  );
  return data.data;
}

/**
 * GET /message/wall/:username — path fixed in this migration (§12.2).
 */
export async function getUserWallMessages(
  username: string,
  params: { page?: number; limit?: number; type?: MessageType; status?: MessageStatus } = {},
) {
  const { data } = await api.get<{ messages: MessageDTO[]; pagination: PaginationDTO }>(
    `/message/wall/${encodeURIComponent(username)}`,
    { params: cleanParams({ page: 1, limit: 20, ...params }) },
  );
  return data;
}
