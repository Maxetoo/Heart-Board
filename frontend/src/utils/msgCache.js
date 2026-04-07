// Shared first-message caches — module-level so they survive page navigation.
// Reset only on full browser refresh OR when invalidateAllMsgCaches() is called
// (e.g. after a board/message edit).

export const homeFirstMsgCache        = {}
export const profileFirstMsgCache     = {}
export const userProfileFirstMsgCache = {}

/**
 * Remove a single board's cached first message from all caches.
 * Call this after editing a board or its first message.
 */
export const invalidateMsgCache = (boardId) => {
  delete homeFirstMsgCache[boardId]
  delete profileFirstMsgCache[boardId]
  delete userProfileFirstMsgCache[boardId]
}

/**
 * Wipe all caches. Call this when the full board list should be treated as stale.
 */
export const invalidateAllMsgCaches = () => {
  Object.keys(homeFirstMsgCache).forEach(k        => delete homeFirstMsgCache[k])
  Object.keys(profileFirstMsgCache).forEach(k     => delete profileFirstMsgCache[k])
  Object.keys(userProfileFirstMsgCache).forEach(k => delete userProfileFirstMsgCache[k])
}
