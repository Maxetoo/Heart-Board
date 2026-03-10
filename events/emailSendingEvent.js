const { Queue } = require('bullmq');
const bullConnection = require('../configs/bullMqConfig');

const emailSendingQueue = new Queue('email-sending-queue', {
  connection: bullConnection,
});

module.exports = emailSendingQueue