#!/usr/bin/env node
/**
 * Backfill Board.taggedUsers for boards created before it existed.
 *
 * WHY
 *   Boards used to store a single person — `receipent`, the first name in the
 *   composer's To field. Anyone tagged after them, or @mentioned in the text,
 *   was never written down, so those people neither saw the board in their
 *   Tagged section nor could open it when it was private.
 *
 *   This rebuilds the list from what IS stored: the recipient, plus every
 *   @username in the board's title, description and face-message preview.
 *   People who were only ever a second chip in the To field left no trace and
 *   cannot be recovered — re-add them by editing the board.
 *
 * USAGE
 *   node scripts/backfillTaggedUsers.js --dry     # report only, no writes
 *   node scripts/backfillTaggedUsers.js           # apply
 *
 * Safe to re-run: tags are only ever ADDED ($addToSet), never removed.
 */

require('dotenv').config();
const mongoose = require('mongoose');

const Board = require('../models/boardModel');
const User = require('../models/userModel');

const DRY_RUN = process.argv.includes('--dry');
const MENTION = /(^|[^\w@])@([a-zA-Z0-9_.-]{3,30})/g;

/** Every @username in a piece of text, lowercased, trailing punctuation off. */
const mentionsIn = (text) => {
  const out = [];
  if (typeof text !== 'string') return out;
  for (const m of text.matchAll(MENTION)) out.push(m[2].replace(/[.-]+$/, '').toLowerCase());
  return out;
};

/** Text elements of a canvas, in any of the shapes canvasData has had. */
const canvasTexts = (canvasData) => {
  if (!canvasData) return [];
  const elements = Array.isArray(canvasData) ? canvasData : canvasData.elements;
  if (Array.isArray(elements)) return elements.map((e) => (e && e.type === 'text' ? e.text : '')).filter(Boolean);
  if (Array.isArray(canvasData.canvasTexts)) return canvasData.canvasTexts.map((t) => t && t.content).filter(Boolean);
  return [];
};

async function main() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log(`[backfillTaggedUsers] connected${DRY_RUN ? ' (dry run — no writes)' : ''}`);

  const cursor = Board.find({ kind: { $ne: 'heart' } })
    .select('_id slug owner receipent receipentOriginal taggedUsers title description preview')
    .lean()
    .cursor();

  let scanned = 0;
  let updated = 0;
  let added = 0;

  for await (const board of cursor) {
    scanned += 1;

    const have = new Set((board.taggedUsers || []).map(String));
    const toAdd = new Set();

    for (const ref of [board.receipent, board.receipentOriginal]) {
      if (ref && !have.has(String(ref))) toAdd.add(String(ref));
    }

    const names = [
      ...mentionsIn(board.title),
      ...mentionsIn(board.description),
      ...mentionsIn(board.preview && board.preview.text),
      ...canvasTexts(board.preview && board.preview.canvasData).flatMap(mentionsIn),
    ];
    if (names.length) {
      const users = await User.find({ username: { $in: [...new Set(names)] } }).select('_id').lean();
      for (const u of users) {
        const id = String(u._id);
        // The owner tagging themselves never puts a board in their own Tagged.
        if (id !== String(board.owner) && !have.has(id)) toAdd.add(id);
      }
    }

    if (!toAdd.size) continue;
    updated += 1;
    added += toAdd.size;
    console.log(`  ${board.slug}: +${toAdd.size} tagged`);

    if (!DRY_RUN) {
      await Board.updateOne(
        { _id: board._id },
        { $addToSet: { taggedUsers: { $each: [...toAdd].map((id) => new mongoose.Types.ObjectId(id)) } } },
      );
    }
  }

  console.log(
    `[backfillTaggedUsers] scanned ${scanned} boards, ${DRY_RUN ? 'would update' : 'updated'} ${updated}, ` +
      `${added} tag${added === 1 ? '' : 's'} ${DRY_RUN ? 'to add' : 'added'}`,
  );
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('[backfillTaggedUsers] failed:', err);
  process.exit(1);
});
