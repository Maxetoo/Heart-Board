/**
 * Locally generated DiceBear avatars, in the `avataaars` style.
 *
 * The rest of the app points *fallback* avatars at api.dicebear.com (see
 * FALLBACK_AVATAR in ./adapters). That is fine for a placeholder, but an avatar
 * the user deliberately picks should not depend on a third party staying up, so
 * these are rendered in the browser and then uploaded like any other profile
 * picture.
 */

// Type-only, so nothing DiceBear reaches the bundle from this line. The
// runtime import is dynamic — see loadRenderer.
import type { Avatar as AvatarClass, Style as StyleClass } from '@dicebear/core';

/** Rendered size, in px. Also the raster size when uploading. */
export const AVATAR_PX = 256;

interface Renderer {
  Avatar: typeof AvatarClass;
  style: StyleClass<unknown>;
}

/**
 * The renderer is ~400KB of engine plus ~120KB of style definition, and only
 * the avatar picker in Settings ever needs it, so both are fetched on first use
 * instead of riding along in the initial bundle. The promise is cached; a
 * failure clears the cache so the next attempt retries rather than replaying
 * the rejection forever.
 */
let rendererPromise: Promise<Renderer> | null = null;

function loadRenderer(): Promise<Renderer> {
  if (!rendererPromise) {
    rendererPromise = Promise.all([
      import('@dicebear/core'),
      import('@dicebear/styles/avataaars.json'),
    ])
      .then(([{ Avatar, Style }, avataaars]) => ({
        Avatar,
        // One Style instance, reused: constructing it validates and deep-clones
        // the whole definition, which is not worth repeating per avatar.
        style: new Style(avataaars.default),
      }))
      .catch((err) => {
        rendererPromise = null;
        throw err;
      });
  }
  return rendererPromise;
}

/**
 * A fresh random seed. DiceBear is deterministic — the same seed always renders
 * the same face — so the seed is the only thing worth keeping in state.
 */
export function randomAvatarSeed(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function randomAvatarSeeds(count: number): string[] {
  return Array.from({ length: count }, randomAvatarSeed);
}

export async function avatarSvg(seed: string, size: number = AVATAR_PX): Promise<string> {
  const { Avatar, style } = await loadRenderer();
  return new Avatar(style, { seed, size }).toString();
}

/** `data:image/svg+xml` — for previews only; see avatarPngFile for storage. */
export async function avatarDataUri(seed: string, size: number = AVATAR_PX): Promise<string> {
  const { Avatar, style } = await loadRenderer();
  return new Avatar(style, { seed, size }).toDataUri();
}

/**
 * Rasterises a generated avatar into a PNG File, ready for POST /upload.
 *
 * Two server rules make this necessary rather than just saving the SVG:
 * updateProfile rejects any `profileImage` starting with `data:` (a blob in a
 * user document is how Message.canvasData got bloated), and /upload only
 * accepts jpeg/png/webp/gif — so the SVG cannot be handed over as is either.
 *
 * The SVG is drawn via a blob URL, which is same-origin and therefore leaves
 * the canvas untainted, so toBlob() is allowed to read it back.
 */
export async function avatarPngFile(seed: string, size: number = AVATAR_PX): Promise<File> {
  const svg = await avatarSvg(seed, size);
  const svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));

  try {
    const image = new Image();
    image.width = size;
    image.height = size;

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Could not render the generated avatar.'));
      image.src = svgUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('This browser cannot render the generated avatar.');
    ctx.drawImage(image, 0, 0, size, size);

    const png = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    );
    if (!png) throw new Error('Could not save the generated avatar.');

    return new File([png], `avatar-${seed}.png`, { type: 'image/png' });
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
