// const redis = require('../configs/redisConfig');

// const TTL = {
//   PROFILE:        5 * 60,   
//   PUBLIC_PROFILE: 3 * 60,   
//   BOARD:          5 * 60,   
//   MY_BOARDS:      2 * 60,   
//   DISCOVER:       5 * 60,   
//   BOARD_MESSAGES: 1 * 60,   
//   MESSAGE:        5 * 60,   
//   MY_MESSAGES:    2 * 60,   
// };


// function isRedisReady() {
//   return redis.status === 'ready';
// }

// async function cacheGet(key) {
//   if (!isRedisReady()) {
//     console.log('Cache miss (Redis not ready)');
//     return null;
//   }
//   try {
//     const val = await redis.get(key);
//     if (val) {
//       console.log(`Cache hit: ${key}`);
//       return JSON.parse(val);
//     }
//     console.log(`Cache miss: ${key}`);
//     return null;
//   } catch (err) {
//     console.error(`[cache] GET error key="${key}": ${err.message}`);
//     return null;
//   }
// }

// async function cacheSet(key, data, ttlSeconds) {
//   if (!isRedisReady()) return;
//   // Fire-and-forget — never awaited in the request path
//   redis.set(key, JSON.stringify(data), 'EX', ttlSeconds).catch(err => {
//     console.error(`[cache] SET error key="${key}": ${err.message}`);
//   });
// }

// async function invalidate(...keysToDelete) {
//   if (!keysToDelete.length || !isRedisReady()) return;
//   try {
//     await redis.del(...keysToDelete);
//   } catch (err) {
//     console.warn(`[cache] DEL error: ${err.message}`);
//   }
// }

// async function invalidatePattern(pattern) {
//   if (!isRedisReady()) return;
//   try {
//     let cursor = '0';
//     do {
//       const [nextCursor, found] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
//       cursor = nextCursor;
//       if (found.length) await redis.del(...found);
//     } while (cursor !== '0');
//   } catch (err) {
//     console.warn(`[cache] SCAN/DEL error pattern="${pattern}": ${err.message}`);
//   }
// }

// // ─── Express middleware ───────────────────────────────────────────────────────

// function cache(ttl, keyFn) {
//   return async (req, res, next) => {
//     const key = keyFn(req);

//     const cached = await cacheGet(key);
//     if (cached !== null) {
//       res.setHeader('X-Cache', 'HIT');
//       return res.status(200).json(cached);
//     }

//     res.setHeader('X-Cache', 'MISS');

//     // Patch res.json to capture the response body after the controller runs
//     const _originalJson = res.json.bind(res);
//     res.json = function (body) {
//       res.json = _originalJson; // restore immediately — prevent double-patching
//       if (res.statusCode >= 200 && res.statusCode < 300) {
//         cacheSet(key, body, ttl); // fire-and-forget
//       }
//       return _originalJson(body);
//     };

//     next();
//   };
// }

// const keys = {
//   profile:       (userId)      => `profile:${userId}`,
//   publicProfile: (username)    => `publicProfile:${username}`,
//   board:         (slug)        => `board:${slug}`,
//   myBoards:      (userId, qs)  => `myBoards:${userId}:${qs}`,
//   discover:      (qs)          => `discover:${qs}`,
//   boardMessages: (slug, qs)    => `boardMsgs:${slug}:${qs}`,
//   message:       (id)          => `msg:${id}`,
//   myMessages:    (userId, qs)  => `myMsgs:${userId}:${qs}`,
// };

// module.exports = { cache, invalidate, invalidatePattern, cacheGet, cacheSet, keys, TTL };


/**
 * cacheMiddleware.js
 *
 * Two rules that prevent stale data:
 *
 * 1. cacheGet / cacheSet are best-effort (Redis down = fall through to DB).
 *    A GET miss never blocks the user — they just hit the DB instead.
 *
 * 2. invalidate / invalidatePattern are ALWAYS awaited before the mutation
 *    response is sent. If Redis is down the invalidation is a no-op (safe,
 *    because the TTL will expire naturally), but when Redis IS up the old
 *    key is guaranteed deleted before the client receives the 200 and
 *    immediately re-fetches.
 */

const redis = require('../configs/redisConfig');

// ─── TTL constants (seconds) ──────────────────────────────────────────────────
const TTL = {
  PROFILE:        5 * 60,
  PUBLIC_PROFILE: 3 * 60,
  BOARD:          5 * 60,
  MY_BOARDS:      2 * 60,
  DISCOVER:       5 * 60,
  BOARD_MESSAGES: 2 * 60,
  MESSAGE:        5 * 60,
  MY_MESSAGES:    2 * 60,
};

// ─── Readiness ────────────────────────────────────────────────────────────────
function isRedisReady() {
  return redis.status === 'ready';
}

// ─── cacheGet — best-effort read ─────────────────────────────────────────────
// Returns parsed value on HIT, null on MISS or any error.
// Never throws, never hangs (ioredis commandTimeout handles the timeout).
async function cacheGet(key) {
  if (!isRedisReady()) return null;
  try {
    const val = await redis.get(key);
    if (val !== null) {
      console.log(`[cache] HIT  ${key}`);
      return JSON.parse(val);
    }
    console.log(`[cache] MISS ${key}`);
    return null;
  } catch (err) {
    console.error(`[cache] GET error "${key}": ${err.message}`);
    return null;
  }
}

// ─── cacheSet — fire-and-forget write ────────────────────────────────────────
// Called after the controller has already sent the response.
// Errors are logged but never surface to the caller.
function cacheSet(key, data, ttlSeconds) {
  if (!isRedisReady()) return;
  redis.set(key, JSON.stringify(data), 'EX', ttlSeconds).catch(err => {
    console.error(`[cache] SET error "${key}": ${err.message}`);
  });
}

// ─── invalidate — AWAITED deletion of exact keys ─────────────────────────────
// Must complete before the mutation response is sent so the next GET
// does not return stale data. Errors are swallowed (TTL handles expiry).
async function invalidate(...keysToDelete) {
  const valid = keysToDelete.filter(Boolean);
  if (!valid.length || !isRedisReady()) return;
  try {
    await redis.del(...valid);
    console.log(`[cache] DEL  ${valid.join(', ')}`);
  } catch (err) {
    console.warn(`[cache] DEL error: ${err.message}`);
  }
}

// ─── invalidatePattern — AWAITED pattern deletion ────────────────────────────
// Uses SCAN (non-blocking on large keyspaces). Also awaited before response.
async function invalidatePattern(pattern) {
  if (!isRedisReady()) return;
  try {
    let cursor = '0';
    let totalDeleted = 0;
    do {
      const [nextCursor, found] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (found.length) {
        await redis.del(...found);
        totalDeleted += found.length;
      }
    } while (cursor !== '0');
    if (totalDeleted > 0) {
      console.log(`[cache] DEL pattern="${pattern}" (${totalDeleted} keys)`);
    }
  } catch (err) {
    console.warn(`[cache] SCAN/DEL error pattern="${pattern}": ${err.message}`);
  }
}

// ─── cache() middleware ───────────────────────────────────────────────────────
function cache(ttl, keyFn) {
  return async (req, res, next) => {
    const key = keyFn(req);

    const cached = await cacheGet(key);
    if (cached !== null) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }

    res.setHeader('X-Cache', 'MISS');

    // Intercept res.json to store the response body after controller runs
    const _originalJson = res.json.bind(res);
    res.json = function (body) {
      res.json = _originalJson; // restore before calling to prevent re-entry
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheSet(key, body, ttl); // fire-and-forget — response already sent
      }
      return _originalJson(body);
    };

    next();
  };
}

// ─── Key builders ─────────────────────────────────────────────────────────────
const keys = {
  profile:       (userId)      => `profile:${userId}`,
  publicProfile: (username)    => `publicProfile:${username}`,
  board:         (slug)        => `board:${slug}`,
  myBoards:      (userId, qs)  => `myBoards:${userId}:${qs}`,
  discover:      (qs)          => `discover:${qs}`,
  boardMessages: (slug, qs)    => `boardMsgs:${slug}:${qs}`,
  message:       (id)          => `msg:${id}`,
  myMessages:    (userId, qs)  => `myMsgs:${userId}:${qs}`,
};

module.exports = { cache, invalidate, invalidatePattern, cacheGet, cacheSet, keys, TTL };