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

export const refineText = async (text: string): Promise<string> => {
  if (!text || !text.trim()) return text;
  try {
    const { data } = await api.post<{ text: string }>('/ai/refine', { text });
    return data.text || text;
  } catch (error) {
    console.error('Refine text error:', error);
    return text;
  }
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
