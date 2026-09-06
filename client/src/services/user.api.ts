import { api, cleanParams } from '../lib/api';
import type { BoardDTO, PaginationDTO, ProfileSummaryDTO, UserDTO } from '../types/api';

export async function checkUsername(username: string) {
  const { data } = await api.get<{ available: boolean; message: string }>(
    `/user/check-username/${encodeURIComponent(username)}`,
  );
  return data;
}

/** GET /user/me — the source of truth for "am I logged in". 401 when not. */
export async function getMyProfile() {
  const { data } = await api.get<{ user: UserDTO }>('/user/me');
  return data.user;
}

/**
 * PATCH /user/profile.
 *
 * `email` is NOT accepted — changing it has to go through the verification
 * flow, and the server rejects the field outright.
 */
export async function updateProfile(payload: {
  username?: string;
  profileImage?: string;
  country?: string;
  accountType?: 'personal' | 'enterprise';
  bio?: string;
  displayName?: string;
  notificationPrefs?: { heartTokenAlerts?: boolean; trophyCaseUpdates?: boolean };
}) {
  const { data } = await api.patch<{ message: string; user: UserDTO }>('/user/profile', payload);
  return data;
}

export async function getPublicProfile(username: string, view?: string) {
  const { data } = await api.get<{
    user: UserDTO;
    boards: BoardDTO[];
    view: string;
    summary: ProfileSummaryDTO;
  }>(`/user/profile/${encodeURIComponent(username)}`, { params: cleanParams({ view }) });
  return data;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const { data } = await api.patch<{ message: string }>('/user/change-password', {
    currentPassword,
    newPassword,
  });
  return data;
}

export async function deleteAccount() {
  const { data } = await api.delete<{ message: string }>('/user/delete-account');
  return data;
}

/** Toggles a profile like. Returns the new total. */
export async function likeProfile(userId: string) {
  const { data } = await api.post<{ likeCount: number; liked?: boolean }>(`/user/${userId}/like`);
  return data;
}

export async function getLikedProfiles() {
  const { data } = await api.get<{ likedProfileIds: string[] }>('/user/likes/me');
  return data.likedProfileIds ?? [];
}

// ── Admin ────────────────────────────────────────────────────────────────────

export async function listUsers(params: { page?: number; limit?: number; search?: string } = {}) {
  const { data } = await api.get<{ users: UserDTO[]; pagination: PaginationDTO }>('/user', {
    params: cleanParams({ page: 1, limit: 20, ...params }),
  });
  return data;
}

export async function updateUserRole(id: string, role: 'user' | 'admin' | 'super_admin') {
  const { data } = await api.patch<{ message: string; user: UserDTO }>(`/user/${id}/role`, { role });
  return data;
}
