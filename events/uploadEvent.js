const { Queue } = require('bullmq');
const bullConnection = require('../configs/bullMqConfig');

const uploadSendingQueue = new Queue('upload-queue', {
  connection: bullConnection,
});

module.exports = uploadSendingQueue