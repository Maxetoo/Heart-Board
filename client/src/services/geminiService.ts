import { api } from '../lib/api';
import type { ModerationResult } from '../types';

/**
 * AI helpers, proxied through our own backend (/api/v1/ai/*).
 *
 * These used to call the Gemini API directly from the browser using a key
 * injected at build time by vite.config.ts `define`. That published the key in
 * the JS bundle to every visitor, and made moderation trivially bypassable with
 * devtools. The key now lives only in the server's .env.
 *
 * Function signatures are unchanged so existing call sites keep working.
 */

export const moderateContent = async (text: string): Promise<ModerationResult> => {
  try {
    const { data } = await api.post<ModerationResult>('/ai/moderate', { text });
    return data;
  } catch (error) {
    console.error('Moderation error:', error);
    // Fail open on the client: the server also moderates on write, so a failure
    // here degrades the preview hint rather than blocking the user.
    return { isSafe: true, sentiment: 'neutral' };
  }
};

/**
 * Rewrites `text` with Gemini, keeping the writer's own details and voice.
 *
 * `maxChars` is the composer's own character cap, passed through so the model
 * writes to fit instead of getting truncated after the fact.
 *
 * Throws on failure rather than echoing the input back: silently returning the
 * unchanged text made the Refine button look broken.
 */
export const refineText = async (text: string, maxChars = 250): Promise<string> => {
  if (!text || !text.trim()) return text;
  const { data } = await api.post<{ text: string }>('/ai/refine', { text, maxChars });
  if (!data.text) throw new Error("Couldn't refine that right now. Please try again.");
  return data.text;
};

export const transcribeAudio = async (base64Audio: string): Promise<string> => {
  try {
    const { data } = await api.post<{ text: string }>('/ai/transcribe', { audio: base64Audio });
    return data.text || '';
  } catch (error) {
    console.error('Transcription error:', error);
    return '';
  }
};
