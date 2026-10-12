/**
 * Rate limiting keyed on WHO is calling, not just where from.
 *
 * The old limiters were in-memory and keyed on the IP alone. Two problems:
 *  - Everyone behind one mobile carrier's shared IP (very common) counted as a
 *    single user, so a busy carrier IP could lock out many real people at once,
 *    while anyone who simply switched networks got a fresh allowance.
 *  - Counts lived in the process, so every restart or deploy wiped them, and
 *    two instances would each have kept their own.
 *
 * Now each request gets a fingerprint, most specific first:
 *   1. the signed-in account       — one person, whatever device or network
 *   2. the device                  — X-Device-Id (a random id the app keeps in
 *                                    localStorage) together with the browser
 *   3. the network and browser     — IP + user agent + language, when there is
 *                                    no valid device id
 * and a separate, much higher per-network CEILING sits underneath, so rotating
 * device ids cannot get round the limits either.
 *
 * Counts are kept in Redis so they survive restarts and are shared between
 * instances. If Redis is unavailable the store counts in memory instead, so a
 * Redis outage never takes the API down with it.
 */
const crypto = require('crypto');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const redis = require('../configs/redisConfig');
const { signJwt } = require('../helpers/jwtHelper');

const hash = (value) => crypto.createHash('sha256').update(value).digest('base64url').slice(0, 24);
const DEVICE_ID = /^[A-Za-z0-9-]{16,64}$/;

/** The signed-in account, read from the session cookie without requiring one. */
const accountOf = (req) => {
  if (req.user?.userId) return String(req.user.userId);
  const token = req.signedCookies?.token;
  if (!token) return null;
  try {
    const payload = signJwt(token);
    return payload?.userId ? String(payload.userId) : null;
  } catch {
    return null; // expired or tampered: treat as signed out
  }
};

/** The network: the IP, with IPv6 grouped by /56 so one household is one key. */
const networkOf = (req) => `ip:${ipKeyGenerator(req.ip || '0.0.0.0')}`;

const fingerprintOf = (req) => {
  const account = accountOf(req);
  if (account) return `u:${account}`;
  const userAgent = String(req.get('user-agent') || '').slice(0, 256);
  const device = String(req.get('x-device-id') || '');
  if (DEVICE_ID.test(device)) return `d:${hash(`${device}|${userAgent}`)}`;
  const language = String(req.get('accept-language') || '').slice(0, 64);
  return `n:${hash(`${networkOf(req)}|${userAgent}|${language}`)}`;
};

// INCR and set the expiry in one atomic step, so a window can never be left
// without an expiry (which would block that key for good).
const INCR_WITH_TTL = `
local hits = redis.call('INCR', KEYS[1])
if hits == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
local ttl = redis.call('PTTL', KEYS[1])
if ttl < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return { hits, ttl }`;

/** express-rate-limit store: Redis first, in-memory when Redis is unavailable. */
class RedisWindowStore {
  constructor(name) {
    this.prefix = `rl:${name}:`;
    this.localKeys = false;
    this.windowMs = 60 * 1000;
    this.memory = new Map();
  }

  init(options) {
    this.windowMs = options.windowMs;
    const sweep = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.memory) if (entry.resetAt <= now) this.memory.delete(key);
    }, Math.min(this.windowMs, 60 * 1000));
    if (sweep.unref) sweep.unref();
  }

  get redisReady() {
    return redis.status === 'ready';
  }

  async increment(key) {
    const k = this.prefix + key;
    if (this.redisReady) {
      try {
        const [hits, ttl] = await redis.eval(INCR_WITH_TTL, 1, k, this.windowMs);
        return { totalHits: Number(hits), resetTime: new Date(Date.now() + Number(ttl)) };
      } catch {
        // A Redis hiccup must not block requests: count locally instead.
      }
    }
    return this.incrementLocally(k);
  }

  incrementLocally(k) {
    const now = Date.now();
    let entry = this.memory.get(k);
    if (!entry || entry.resetAt <= now) {
      entry = { hits: 0, resetAt: now + this.windowMs };
      this.memory.set(k, entry);
    }
    entry.hits += 1;
    return { totalHits: entry.hits, resetTime: new Date(entry.resetAt) };
  }

  async decrement(key) {
    const k = this.prefix + key;
    if (this.redisReady) {
      try { await redis.decr(k); } catch { /* best-effort */ }
    }
    const entry = this.memory.get(k);
    if (entry && entry.hits > 0) entry.hits -= 1;
  }

  async resetKey(key) {
    const k = this.prefix + key;
    if (this.redisReady) {
      try { await redis.del(k); } catch { /* best-effort */ }
    }
    this.memory.delete(k);
  }
}

const makeLimiter = ({ name, windowMs, limit, key = fingerprintOf, message, skip }) =>
  rateLimit({
    windowMs,
    limit,
    keyGenerator: key,
    store: new RedisWindowStore(name),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip,
    message: { message },
    // Any key built from an IP goes through ipKeyGenerator (see networkOf).
    validate: { keyGeneratorIpFallback: false },
  });

const MIN = 60 * 1000;
const isApiCall = (req) => req.path.startsWith('/api/') && req.method !== 'OPTIONS';

/** Everyone, per person/device. Generous: the app is chatty by design. */
const apiLimiter = makeLimiter({
  name: 'api', windowMs: 15 * MIN, limit: 600,
  skip: (req) => !isApiCall(req),
  message: 'You are doing that a lot. Please wait a moment and try again.',
});

/** Per network: a high ceiling for shared IPs, and the backstop for id-rotation. */
const networkLimiter = makeLimiter({
  name: 'net', windowMs: 15 * MIN, limit: 6000, key: networkOf,
  skip: (req) => !isApiCall(req),
  message: 'Too many requests from this network. Please try again shortly.',
});

/** Sign-in / sign-up attempts: per person, plus a per-network ceiling. */
const authLimiter = makeLimiter({
  name: 'auth', windowMs: 15 * MIN, limit: 30,
  message: 'Too many sign-in attempts. Please try again later.',
});
const authNetworkLimiter = makeLimiter({
  name: 'authnet', windowMs: 15 * MIN, limit: 150, key: networkOf,
  message: 'Too many sign-in attempts from this network. Please try again later.',
});

/** AI calls cost money per request. Mounted after authentication. */
const aiLimiter = makeLimiter({
  name: 'ai', windowMs: 5 * MIN, limit: 40,
  message: 'Too many AI requests. Please slow down and try again shortly.',
});

/** Signed-out visitors adding messages to boards: per device, plus a network ceiling. */
const guestPostLimiter = makeLimiter({
  name: 'guest', windowMs: 15 * MIN, limit: 10,
  skip: (req) => Boolean(req.user),
  message: 'Too many messages from this device. Please wait a little, or sign in.',
});
const guestNetworkLimiter = makeLimiter({
  name: 'guestnet', windowMs: 15 * MIN, limit: 60, key: networkOf,
  skip: (req) => Boolean(req.user),
  message: 'Too many messages from this network. Please wait a little, or sign in.',
});

module.exports = {
  fingerprintOf,
  networkOf,
  makeLimiter,
  RedisWindowStore,
  apiLimiter,
  networkLimiter,
  authLimiter,
  authNetworkLimiter,
  aiLimiter,
  guestPostLimiter,
  guestNetworkLimiter,
};
