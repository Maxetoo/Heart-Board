const { Worker } = require('bullmq');
const bullConnection = require('../configs/bullMqConfig');

// The registry lives in email/index.js, so a new template is registered once
// rather than here as well — the two lists could previously drift, and a
// template missing from this copy failed every job that named it.
const { templates: EMAIL_FUNCTIONS } = require('../email');

const worker = new Worker(
  'email-sending-queue',
  async job => {
    const { funcName, args } = job.data;

    const fn = EMAIL_FUNCTIONS[funcName];

    if (!fn) {
      throw new Error(`Email function '${funcName}' not found.`);
    }

    return await fn(...args);
  },
  { connection: bullConnection }
);

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});

module.exports = worker;