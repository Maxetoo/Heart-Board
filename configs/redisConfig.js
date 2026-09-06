const IORedis = require('ioredis');

/**
 * Redis client for the HTTP response cache.
 *
 * This client sits in front of every cached read, so a stalled connection
 * stalls the request. It previously used `maxRetriesPerRequest: null`, which
 * makes ioredis retry a command FOREVER — a single slow moment left
 * GET /board/discover hanging with no response and no error, and the feed
 * never loaded.
 *
 * BullMQ requires `maxRetriesPerRequest: null` and has its own separate client
 * in configs/bullMqConfig.js, so tightening things here does not affect the
 * workers.
 */
const client = new IORedis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  username: 'default',

  // Fail a command rather than queueing it forever. The cache is best-effort:
  // a failure must degrade to a cache miss, never to a hung request.
  maxRetriesPerRequest: 1,
  commandTimeout: 1500,
  connectTimeout: 5000,
  enableReadyCheck: false,
  // Do not buffer commands while disconnected; fail fast instead.
  enableOfflineQueue: false,

  retryStrategy: (times) => Math.min(times * 500, 5000),
});

client.on('connect', () => console.log('Redis Client Connected'));

// Without an error listener, ioredis emits an unhandled 'error' event that can
// take the process down. Log and carry on — the cache is optional.
client.on('error', (err) => {
  console.warn('[redis] connection error:', err.message);
});

module.exports = client;
