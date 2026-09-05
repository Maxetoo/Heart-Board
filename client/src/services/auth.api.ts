import { api, API_ORIGIN } from '../lib/api';
import type { UserDTO } from '../types/api';

/**
 * POST /auth/register
 * Returns ONLY a message — no user, no cookie. The account must be verified by
 * email before login works. (controllers/authController.js:64)
 */
export async function register(email: string, password: string) {
  const { data } = await api.post<{ message: string }>('/auth/register', { email, password });
  return data;
}

/**
 * POST /auth/verify-email?verificationToken=...
 * The token goes in the QUERY STRING, not the body.
 */
export async function verifyEmail(verificationToken: string) {
  const { data } = await api.post<{ message: string }>(
    '/auth/verify-email',
    {},
    { params: { verificationToken } },
  );
  return data;
}

export async function resendVerificationEmail(email: string) {
  const { data } = await api.post<{ message: string }>('/auth/resend-verification-email', {
    email,
  });
  return data;
}

/** POST /auth/login — sets the signed `token` cookie as a side effect. */
export async function login(email: string, password: string) {
  const { data } = await api.post<{ message: string; user: Partial<UserDTO> & { id: string } }>(
    '/auth/login',
    { email, password },
  );
  return data;
}

export async function logout() {
  const { data } = await api.post<{ success: boolean; msg: string }>('/auth/logout', {});
  return data;
}

export async function forgotPassword(email: string) {
  const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email });
  return data;
}

/** PATCH (not POST) /auth/reset-password */
export async function resetPassword(payload: {
  token: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const { data } = await api.patch<{ message: string }>('/auth/reset-password', payload);
  return data;
}

/**
 * Google OAuth is a full-page redirect, not an XHR. The server redirects back
 * to CLIENT_URL on success, or CLIENT_URL/login?error=oauth_failed on failure.
 */
export function startGoogleLogin(): void {
  window.location.href = `${API_ORIGIN}/api/v1/auth/google`;
}
