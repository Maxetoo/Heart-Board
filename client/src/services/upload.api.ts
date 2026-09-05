import { api } from '../lib/api';
import type { UploadResultDTO } from '../types/api';

/** Mirrors MAX_SIZES in controllers/uploadController.js. */
export const MAX_UPLOAD_BYTES = {
  image: 10 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  audio: 20 * 1024 * 1024,
} as const;

/** Mirrors ALLOWED_TYPES in controllers/uploadController.js. */
export const ALLOWED_MIME = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  video: ['video/mp4', 'video/quicktime', 'video/webm'],
  audio: [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'audio/m4a',
    'audio/mp4',
    'audio/aac',
    'audio/x-m4a',
  ],
} as const;

export type UploadKind = keyof typeof MAX_UPLOAD_BYTES;

export function detectKind(file: File): UploadKind | null {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return null;
}

/**
 * Validates against the same rules the server enforces, so the user gets a
 * useful message instead of a generic 400. Returns null when the file is fine.
 */
export function validateFile(file: File, kind?: UploadKind): string | null {
  const type = kind ?? detectKind(file);
  if (!type) return 'Unsupported file type. Upload an image, video, or audio file.';

  if (!(ALLOWED_MIME[type] as readonly string[]).includes(file.type)) {
    return `That ${type} format is not supported. Allowed: ${ALLOWED_MIME[type].join(', ')}`;
  }

  if (file.size > MAX_UPLOAD_BYTES[type]) {
    const mb = MAX_UPLOAD_BYTES[type] / (1024 * 1024);
    return `File is too large. The maximum ${type} size is ${mb}MB.`;
  }

  return null;
}

/**
 * POST /upload (multipart).
 *
 * Two-step media flow: upload FIRST, then send the returned url + publicId in
 * the board/message payload. Always pass the publicId through, so the server
 * can clean up the Cloudinary asset if the second step fails.
 */
export async function uploadFile(
  file: File,
  kind?: UploadKind,
  onProgress?: (percent: number) => void,
): Promise<UploadResultDTO> {
  const problem = validateFile(file, kind);
  if (problem) throw new Error(problem);

  const form = new FormData();
  form.append('file', file);
  const type = kind ?? detectKind(file);
  if (type) form.append('type', type);

  const { data } = await api.post<UploadResultDTO>('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });

  return data;
}
