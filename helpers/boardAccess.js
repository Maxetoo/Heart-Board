/**
 * Who may open a board, and who may write on it.
 *
 * A private board is for its owner and for the people it tags — the
 * recipient and everyone in `taggedUsers`. It used to admit the owner alone,
 * so the very people a private board was made for could neither read it nor
 * add a message. Guests (no userId) are never let into a private board.
 */

const idOf = (ref) => (ref && ref._id ? ref._id : ref);
const same = (ref, userId) => Boolean(ref) && String(idOf(ref)) === String(userId);

/** True when `userId` is the board's owner or one of the people it tags. */
const isBoardMember = (board, userId) => {
  if (!board || !userId) return false;
  return (
    same(board.owner, userId) ||
    same(board.receipent, userId) ||
    same(board.receipentOriginal, userId) ||
    (Array.isArray(board.taggedUsers) && board.taggedUsers.some((t) => same(t, userId)))
  );
};

/** Whether `userId` (null for a guest) may see this board and its messages. */
const canViewBoard = (board, userId) =>
  board.visibility !== 'private' || isBoardMember(board, userId);

module.exports = { isBoardMember, canViewBoard };
