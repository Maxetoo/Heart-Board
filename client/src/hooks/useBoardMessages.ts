import { useEffect, useRef } from 'react';
import * as messageApi from '../services/message.api';
import * as boardApi from '../services/board.api';
import { messageToContribution, boardToPost } from '../lib/adapters';
import type { Post } from '../types';

/**
 * Loads the full board (owner, recipient, style) and its messages whenever a
 * board is opened, and merges them into the post already in the feed.
 *
 * The list endpoints use .select(...) and return neither `receipent` nor the
 * board's messages, so a feed card alone cannot render the detail view. Only
 * GET /board/:slug returns the full document.
 */
export function useBoardMessages(
  post: Post | null | undefined,
  currentUserId: string | undefined,
  onLoaded: (postId: string, patch: Partial<Post>) => void,
) {
  const slug = post?.slug;
  const postId = post?.id;
  // Only fetch once per board per open; contributions already present mean the
  // board has been hydrated.
  const loadedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!slug || !postId) return;
    if (loadedFor.current === slug) return;

    loadedFor.current = slug;
    let cancelled = false;

    (async () => {
      try {
        const [detail, messages] = await Promise.all([
          boardApi.getBoardBySlug(slug).catch(() => null),
          messageApi.getBoardMessages(slug, { limit: 50 }).catch(() => null),
        ]);
        if (cancelled) return;

        const patch: Partial<Post> = {};

        if (detail?.board) {
          const full = boardToPost(detail.board, currentUserId);
          // Keep the identity fields stable; take the richer detail data.
          patch.recipientName = full.recipientName;
          patch.recipientHandle = full.recipientHandle;
          patch.content = full.content;
          patch.theme = full.theme;
          patch.sticker = full.sticker;
          patch.confetti = full.confetti;
          patch.tier = full.tier;
          patch.messageCount = full.messageCount;
          patch.shareCount = full.shareCount;
          patch.reactions = full.reactions;
          patch.hashtags = full.hashtags;
        }

        if (messages?.messages) {
          const contributions = messages.messages.map((m) =>
            messageToContribution(m, currentUserId),
          );
          patch.contributions = contributions;
          patch.hasUserContributed = contributions.some((c) => c.isCreatedByUser);
        }

        if (Object.keys(patch).length) onLoaded(postId, patch);
      } catch {
        // Leave the feed card's data in place; the modal still renders.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, postId, currentUserId, onLoaded]);
}
