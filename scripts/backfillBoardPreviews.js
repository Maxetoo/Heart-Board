#!/usr/bin/env node
/**
 * Backfill Board.preview for every existing board, and lift legacy inline
 * base64 canvas images out into Cloudinary.
 *
 * WHY
 *   Feed cards render the board's artwork, but the artwork lives on the board's
 *   messages and the list endpoints only project board fields. Boards created
 *   before Board.preview existed therefore show as text-only on the feed until
 *   they are opened.
 *
 *   Separately, the old frontend embedded canvas images as base64 data URLs
 *   directly in Message.canvasData. One production document is 3.1MB; a single
 *   board's messages were 3.2MB over the wire, against MongoDB's 16MB
 *   per-document ceiling. Those images are uploaded to Cloudinary here and the
 *   documents rewritten to reference them.
 *
 * USAGE
 *   node scripts/backfillBoardPreviews.js --dry     # report only, no writes
 *   node scripts/backfillBoardPreviews.js           # apply
 *
 * Safe to re-run: previews are recomputed, and messages with no inline images
 * are left untouched.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const Board = require('../models/boardModel');
const Message = require('../models/message');
const { buildBoardPreview } = require('../helpers/boardPreview');

const DRY_RUN = process.argv.includes('--dry');

const isDataUrl = (v) => typeof v === 'string' && v.startsWith('data:');

/** Writes a data: URL to a temp file so it can be uploaded to Cloudinary. */
async function dataUrlToTempFile(dataUrl) {
  const match = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(dataUrl);
  if (!match) return null;

  const [, mime, isB64, payload] = match;
  const ext = (mime.split('/')[1] || 'png').replace(/[^a-z0-9]/gi, '');
  const buf = isB64
    ? Buffer.from(payload, 'base64')
    : Buffer.from(decodeURIComponent(payload), 'utf8');

  const file = path.join(os.tmpdir(), `hb-${crypto.randomBytes(8).toString('hex')}.${ext}`);
  await fs.writeFile(file, buf);
  return { file, bytes: buf.length };
}

async function uploadDataUrl(dataUrl, stats) {
  const tmp = await dataUrlToTempFile(dataUrl);
  if (!tmp) return null;

  try {
    const { uploadToCloudinary } = require('../services/cloudinaryUpload');
    const result = await uploadToCloudinary(tmp.file, 'image');
    stats.bytesFreed += tmp.bytes;
    return result.url;
  } catch (err) {
    console.error('    upload failed:', err.message);
    return null;
  } finally {
    try { await fs.unlink(tmp.file); } catch {}
  }
}

/**
 * Walks a canvasData document replacing inline images with uploaded URLs.
 * Handles both the legacy `{ canvasImages: [{ src }] }` shape and the current
 * `{ elements: [{ imageUrl }] }` envelope.
 */
async function liftInlineImages(node, stats) {
  if (Array.isArray(node)) {
    const out = [];
    for (const item of node) out.push(await liftInlineImages(item, stats));
    return out;
  }

  if (node && typeof node === 'object') {
    const out = {};
    for (const [key, value] of Object.entries(node)) {
      if ((key === 'src' || key === 'imageUrl') && isDataUrl(value)) {
        const url = await uploadDataUrl(value, stats);
        if (url) {
          out[key] = url;
          stats.imagesLifted += 1;
        } else {
          // Could not upload — drop the inline blob rather than keep 3MB of it.
          out[key] = '';
          stats.imagesDropped += 1;
        }
      } else {
        out[key] = await liftInlineImages(value, stats);
      }
    }
    return out;
  }

  return node;
}

const hasInlineImage = (json) => json.includes('"data:');

async function main() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log(`Connected. ${DRY_RUN ? 'DRY RUN — no writes.' : 'Applying changes.'}\n`);

  const stats = {
    boards: 0,
    previewsWritten: 0,
    messagesRewritten: 0,
    imagesLifted: 0,
    imagesDropped: 0,
    bytesFreed: 0,
  };

  // ── 1. Lift inline images out of message canvasData ──────────────────────
  const withCanvas = await Message.find({ canvasData: { $ne: null } }).select('canvasData');
  console.log(`Scanning ${withCanvas.length} messages with canvas data…`);

  for (const msg of withCanvas) {
    const json = JSON.stringify(msg.canvasData ?? null);
    if (!hasInlineImage(json)) continue;

    const sizeKb = Math.round(json.length / 1024);
    console.log(`  message ${msg._id} — ${sizeKb}KB, contains inline images`);

    if (DRY_RUN) {
      stats.messagesRewritten += 1;
      continue;
    }

    const lifted = await liftInlineImages(msg.canvasData, stats);
    msg.canvasData = lifted;
    msg.markModified('canvasData');
    await msg.save();
    stats.messagesRewritten += 1;

    const after = Math.round(JSON.stringify(lifted).length / 1024);
    console.log(`    rewritten: ${sizeKb}KB -> ${after}KB`);
  }

  // ── 2. Rebuild every board's preview from its face message ───────────────
  const boards = await Board.find({}).select('_id owner slug');
  console.log(`\nRebuilding previews for ${boards.length} boards…`);

  for (const board of boards) {
    stats.boards += 1;

    // The board's face is the earliest message written by its owner; fall back
    // to the earliest message of any author so a board is never blank.
    const face =
      (await Message.findOne({ board: board._id, context: 'board', sender: board.owner })
        .sort({ createdAt: 1 })
        .lean()) ||
      (await Message.findOne({ board: board._id, context: 'board' })
        .sort({ createdAt: 1 })
        .lean());

    if (!face) continue;

    const preview = buildBoardPreview(face);
    if (!preview) continue;

    if (!DRY_RUN) {
      await Board.findByIdAndUpdate(board._id, { $set: { preview } });
    }
    stats.previewsWritten += 1;
  }

  console.log('\n── Summary ─────────────────────────────');
  console.log(`  boards scanned:      ${stats.boards}`);
  console.log(`  previews written:    ${stats.previewsWritten}`);
  console.log(`  messages rewritten:  ${stats.messagesRewritten}`);
  console.log(`  images -> Cloudinary: ${stats.imagesLifted}`);
  console.log(`  images dropped:      ${stats.imagesDropped}`);
  console.log(`  inline bytes freed:  ${(stats.bytesFreed / 1024 / 1024).toFixed(2)} MB`);
  if (DRY_RUN) console.log('\n  (dry run — nothing was written)');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
