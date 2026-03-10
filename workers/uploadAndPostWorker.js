const { Worker } = require('bullmq');
const cloudinary = require('cloudinary').v2;
const bullConnection = require('../configs/bullMqConfig');
const Message = require('../models/message');
const Board = require('../models/boardModel');

const worker = new Worker('upload-queue', async (job) => {
  const { boardId, messageId, cloudinaryPublicId, fileType } = job.data;

  const resourceType = fileType === 'audio' ? 'video' : 'image';

  // Check board always
  const board = await Board.findById(boardId).select('_id');
  if (!board) {
    await cloudinary.uploader.destroy(cloudinaryPublicId, { resource_type: resourceType });
    throw new Error(`Rollback: board ${boardId} not found — deleted Cloudinary asset ${cloudinaryPublicId}`);
  }

  // Check message only when a messageId was provided (postMessage guard)
  if (messageId) {
    const message = await Message.findById(messageId).select('_id');
    if (!message) {
      await cloudinary.uploader.destroy(cloudinaryPublicId, { resource_type: resourceType });
      throw new Error(`Rollback: message ${messageId} not found — deleted Cloudinary asset ${cloudinaryPublicId}`);
    }
  }

  return { ok: true, boardId, messageId: messageId || null };

}, { connection: bullConnection });

worker.on('failed', (job, err) => {
  console.error(`[uploadWorker] Job ${job.id} failed:`, err.message);
});

worker.on('completed', (job) => {
  console.log(`[uploadWorker] Job ${job.id} verified cleanly`);
});

module.exports = worker;