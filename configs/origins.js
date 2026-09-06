/**
 * Single source of truth for "where does the browser app live".
 *
 * There were two competing answers before this file existed:
 *
 *   ALLOWED_ORIGIN — the origin CORS trusts (i.e. where the SPA is served)
 *   CLIENT_URL     — used by the OAuth redirects
 *
 * In this checkout they disagree (ALLOWED_ORIGIN is the SPA, CLIENT_URL is the
 * API tunnel), so a successful Google sign-in bounced the browser to the API
 * host instead of back to the app. Everything that redirects a *browser* must
 * use `appOrigin` below; `CLIENT_URL` is kept only as a fallback.
 *
 * ALLOWED_ORIGIN may be a comma-separated list. The first entry is treated as
 * the canonical app origin.
 */

const parseList = (value) =>
  (value || '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);

const configuredOrigins = parseList(process.env.ALLOWED_ORIGIN);

const devOrigins =
  process.env.NODE_ENV === 'production'
    ? []
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

/** Origins CORS accepts. */
const allowedOrigins = [
  ...configuredOrigins,
  'https://res.cloudinary.com',
  ...devOrigins,
].filter((v, i, arr) => arr.indexOf(v) === i);

/** Where a browser should be sent after an OAuth round-trip. */
const appOrigin =
  configuredOrigins[0] ||
  (process.env.CLIENT_URL || '').replace(/\/+$/, '') ||
  devOrigins[0] ||
  '';

/**
 * Builds an absolute redirect back into the SPA.
 *
 * `path` is always our own literal, never user input — this exists so no
 * caller has to remember which env var to interpolate.
 */
const appUrl = (path = '/') => `${appOrigin}${path.startsWith('/') ? path : `/${path}`}`;

module.exports = { allowedOrigins, appOrigin, appUrl };
