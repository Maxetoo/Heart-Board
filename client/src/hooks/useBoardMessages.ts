import { useEffect, useRef, useState } from 'react';
import * as messageApi from '../services/message.api';
import * as boardApi from '../services/board.api';
import { messageToContribution, boardToPost } from '../lib/adapters';
import type { Post } from '../types';
import type { BoardDTO, UserRefDTO } from '../types/api';

/** Board.owner is either a populated ref or a bare id string. */
function refOwnerId(board: BoardDTO): string | undefined {
  const owner = board.owner as UserRefDTO | string | undefined;
  if (!owner) return undefined;
  return typeof owner === 'string' ? owner : owner._id;
}

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
): { hydrating: boolean } {
  const slug = post?.slug;
  const postId = post?.id;
  // Only fetch once per board per open; contributions already present mean the
  // board has been hydrated.
  const loadedFor = useRef<string | null>(null);
  const [hydrating, setHydrating] = useState(false);

  useEffect(() => {
    if (!slug || !postId) {
      setHydrating(false);
      return;
    }
    if (loadedFor.current === slug) return;

    loadedFor.current = slug;
    let cancelled = false;
    setHydrating(true);

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
          // The per-reaction breakdown the picker renders. Without it the
          // detail view reset every count to zero the moment it hydrated.
          patch.reactionCounts = full.reactionCounts;
          patch.hashtags = full.hashtags;
        }

        if (messages?.messages) {
          const all = messages.messages.map((m) => messageToContribution(m, currentUserId));

          // A Board has no canvas of its own — the artwork lives on its
          // messages. MediaModal's "main" tab renders `post.canvasElements`,
          // so without this the board view showed only the cover image and
          // fallback text: no canvas images, vectors or styled text.
          //
          // The board's own message is the first one written by the board
          // owner; treat that as the board face and the rest as contributions.
          const ownerId = detail?.board ? refOwnerId(detail.board) : post?.authorId;
          const faceIndex = ownerId
            ? all.findIndex((c) => c.authorId === ownerId)
            : 0;
          const face = faceIndex >= 0 ? all[faceIndex] : undefined;

          if (face) {
            // Keep the face message's id: editing a board edits this row, not
            // the board document, because that is where the artwork lives.
            patch.faceMessageId = face.id;
            patch.canvasElements = face.canvasElements;
            patch.imageUrl = face.imageUrl ?? patch.imageUrl;
            patch.mediaUrl = face.mediaUrl ?? patch.mediaUrl;
            patch.mediaType = face.mediaType;
            if (face.content) patch.content = face.content;
          }

          const contributions = faceIndex >= 0
            ? all.filter((_, i) => i !== faceIndex)
            : all;

          patch.contributions = contributions;
          patch.hasUserContributed = all.some((c) => c.isCreatedByUser);
        }

        if (Object.keys(patch).length) onLoaded(postId, patch);
      } catch {
        // Leave the feed card's data in place; the modal still renders.
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, postId, currentUserId, onLoaded]);

  return { hydrating };
}
