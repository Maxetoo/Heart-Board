const { Worker } = require('bullmq');
const bullConnection = require('../configs/bullMqConfig');

const {
  resetPasswordEmail,
  resendVerificationEmail
} = require('../email');

const EMAIL_FUNCTIONS = {
  resetPasswordEmail,
  resendVerificationEmail
};

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