import React, { useEffect, useRef, useState } from 'react';
import { ImageOff } from 'lucide-react';

export interface SmartImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError' | 'src'> {
  /** Accepts null so callers can pass an optional field straight through. */
  src?: string | null;
  alt: string;
  /** Classes for the <img> itself. */
  className?: string;
  /** Classes for the wrapper that hosts the skeleton. Should size the box. */
  wrapperClassName?: string;
  /** Rounding applied to the skeleton so it matches the final image. */
  rounded?: string;
  /** Rendered instead of the broken-image icon when the load fails. */
  fallback?: React.ReactNode;
  /** Skip the fade-in (useful for tiny avatars where it reads as flicker). */
  instant?: boolean;
  onLoaded?: () => void;
}

/**
 * An <img> that actually reports its loading state.
 *
 * Every image in the app previously rendered as a blank gap that popped in
 * whenever the network happened to finish — no skeleton, no fade, and a broken
 * URL left an empty hole with no explanation. Cloudinary-hosted board art and
 * avatars are the worst affected because they are the largest payloads.
 *
 * Behaviour:
 *   - shows a pulsing skeleton until the bitmap is decoded
 *   - fades the image in, so it does not snap
 *   - shows an explicit fallback if the URL fails
 *   - if the image is already in the browser cache, skips straight to loaded
 *     (the `complete` check) so cached images never flash a skeleton
 */
export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  className = '',
  wrapperClassName = '',
  rounded = 'rounded-xl',
  fallback,
  instant = false,
  onLoaded,
  style,
  ...rest
}) => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(
    src ? 'loading' : 'error',
  );
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setStatus(src ? 'loading' : 'error');
  }, [src]);

  // A cached image can finish decoding before React attaches onLoad, which
  // would otherwise leave the skeleton up forever.
  useEffect(() => {
    const el = imgRef.current;
    if (el?.complete && el.naturalWidth > 0) {
      setStatus('loaded');
      onLoaded?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  if (!src || status === 'error') {
    return (
      <span
        className={`flex items-center justify-center bg-[#F1F3F7] text-[#A4ABB8] ${rounded} ${wrapperClassName}`}
        aria-label={alt}
        role="img"
      >
        {fallback ?? <ImageOff className="w-5 h-5" strokeWidth={1.75} />}
      </span>
    );
  }

  return (
    <span className={`relative inline-flex overflow-hidden ${rounded} ${wrapperClassName}`}>
      {status === 'loading' && (
        <span
          aria-hidden="true"
          className={`absolute inset-0 animate-pulse bg-gradient-to-br from-[#ECEFF3] via-[#F6F8FA] to-[#ECEFF3] ${rounded}`}
        />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => {
          setStatus('loaded');
          onLoaded?.();
        }}
        onError={() => setStatus('error')}
        style={style}
        className={`${className} ${
          instant
            ? ''
            : `transition-opacity duration-300 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`
        }`}
        {...rest}
      />
    </span>
  );
};

/** Rectangular placeholder used while a list of cards is still loading. */
export const SkeletonBlock: React.FC<{ className?: string; rounded?: string }> = ({
  className = '',
  rounded = 'rounded-2xl',
}) => (
  <div
    aria-hidden="true"
    className={`animate-pulse bg-gradient-to-br from-[#ECEFF3] via-[#F6F8FA] to-[#ECEFF3] ${rounded} ${className}`}
  />
);
