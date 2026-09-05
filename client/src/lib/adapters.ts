/**
 * Adapters between backend DTOs (src/types/api.ts) and the client view models
 * (src/types/index.ts). Convert at the API boundary only — components should
 * never see a raw DTO, and services should never see a view model.
 *
 * Notable reconciliations:
 *   - Board.visibility 'public'|'private'|'anonymous'  <->  PostVisibility enum
 *   - Board.receipent (server misspelling)             <->  Post.recipientName
 *   - Message.type 'emblem'                            <->  client 'image'
 *   - BoardLike reaction 'smile'                       <->  client 'smiley'
 *   - User.username is the ONLY name field server-side; displayName is optional
 */

import {
  EntityType,
  PostVisibility,
  type Contribution,
  type Post,
  type ReactionCounts,
  type RegisteredUser,
} from '../types';
import type {
  BoardDTO,
  BoardVisibility,
  MessageDTO,
  MessageType,
  ReactionKey,
  UserDTO,
  UserRefDTO,
} from '../types/api';

// ── Visibility ───────────────────────────────────────────────────────────────

export function toPostVisibility(v?: BoardVisibility | null): PostVisibility {
  if (v === 'private') return PostVisibility.PRIVATE;
  if (v === 'anonymous') return PostVisibility.ANONYMOUS;
  return PostVisibility.PUBLIC;
}

export function fromPostVisibility(v?: PostVisibility): BoardVisibility {
  if (v === PostVisibility.PRIVATE) return 'private';
  if (v === PostVisibility.ANONYMOUS) return 'anonymous';
  return 'public';
}

// ── Reactions ────────────────────────────────────────────────────────────────
// The client offers clap | heart | smiley | fire.
// The server enum is    clap | heart | thumbs | smile | fire.
// 'smiley' <-> 'smile' is the only mismatch; 'thumbs' has no client equivalent.

export type ClientReaction = 'clap' | 'heart' | 'smiley' | 'fire';

export function toClientReaction(r?: ReactionKey | null): ClientReaction | null {
  if (!r) return null;
  if (r === 'smile') return 'smiley';
  if (r === 'thumbs') return 'clap'; // legacy rows, folded into the nearest match
  return r as ClientReaction;
}

export function fromClientReaction(r: ClientReaction): ReactionKey {
  return r === 'smiley' ? 'smile' : r;
}

export function toReactionCounts(
  counts?: Partial<Record<ReactionKey, number>> | null,
): ReactionCounts {
  if (!counts) return {};
  return {
    clap: (counts.clap ?? 0) + (counts.thumbs ?? 0),
    heart: counts.heart ?? 0,
    smiley: counts.smile ?? 0,
    fire: counts.fire ?? 0,
  };
}

// ── Users ────────────────────────────────────────────────────────────────────

const FALLBACK_AVATAR = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed || 'heartboard')}`;

export function handleOf(username?: string | null): string {
  return username ? `@${username}` : '@unknown';
}

/** Strips a leading @ so a handle can be used as a :username route param. */
export function usernameOf(handle?: string | null): string {
  return (handle ?? '').trim().replace(/^@/, '');
}

export function userToRegisteredUser(u: UserDTO | UserRefDTO): RegisteredUser {
  const full = u as UserDTO;
  const name = full.displayName || u.username || 'Heartboard member';
  const stats = full.stats ?? {};

  return {
    id: u._id,
    name,
    handle: handleOf(u.username),
    avatar: u.profileImage || FALLBACK_AVATAR(name),
    isVerified: Boolean(u.isVerified),
    heartsCount: stats.profileLikes ?? 0,
    boardsCount: stats.totalBoards ?? 0,
    messagesCount: stats.totalMessages != null ? String(stats.totalMessages) : undefined,
    bio: full.bio ?? '',
    // Display label only. The server's authorization role lives on roleName.
    roleLabel: u.isVerified ? 'Verified Curator' : 'Member',
    roleName: full.role,
  };
}

// ── Boards -> Post ───────────────────────────────────────────────────────────

function refOf(x: UserRefDTO | string | null | undefined): UserRefDTO | null {
  if (!x) return null;
  return typeof x === 'string' ? { _id: x } : x;
}

/**
 * Board -> Post.
 *
 * IMPORTANT: list endpoints (/board, /board/discover) use .select(...) and do
 * NOT return `receipent`, so recipient fields will be undefined on feed cards.
 * Only GET /board/:slug returns the full document. Render defensively.
 */
export function boardToPost(b: BoardDTO, currentUserId?: string): Post {
  const owner = refOf(b.owner);
  const recipient = refOf(b.receipent);
  const isAnon = b.visibility === 'anonymous';
  const ownerName = owner?.displayName || owner?.username || 'Curator';

  const tags = [
    ...(b.tags ?? []),
    ...(b.receipentHashtag ? [b.receipentHashtag] : []),
  ].map((t) => (t.startsWith('#') ? t : `#${t}`));

  return {
    id: b._id,
    slug: b.slug,

    authorName: isAnon ? 'Anon' : ownerName,
    authorHandle: isAnon ? '@anon' : handleOf(owner?.username),
    authorAvatar: isAnon ? undefined : owner?.profileImage || FALLBACK_AVATAR(ownerName),
    authorId: owner?._id,

    recipientName: recipient?.displayName || recipient?.username || b.receipentHashtag || undefined,
    recipientHandle: recipient?.username
      ? handleOf(recipient.username)
      : b.receipentHashtag
        ? `#${b.receipentHashtag}`
        : undefined,

    content: b.description ?? '',
    caption: b.title,

    type: b.coverImage ? 'image' : 'text',
    mediaType: b.coverImage ? 'image' : 'note',
    imageUrl: b.coverImage ?? undefined,
    mediaUrl: b.coverImage ?? undefined,

    visibility: toPostVisibility(b.visibility),
    createdAt: b.createdAt,

    targetId: b.slug,
    targetType: b.receipentHashtag ? EntityType.WALL : EntityType.BOARD,

    reactions: b.stats?.likes ?? 0,
    reactionCounts: toReactionCounts(b.reactionCounts),
    userReactions: [],

    eventType: b.event ?? undefined,
    hashtags: tags,
    statusBadge: b.tier && b.tier !== 'basic' ? b.tier : undefined,

    theme: b.style?.theme,
    sticker: b.style?.sticker,
    confetti: b.style?.confetti,

    contributions: [],
    isCreatedByUser: Boolean(currentUserId && owner?._id === currentUserId),
    section: 'board',

    messageCount: b.stats?.messages ?? 0,
    shareCount: b.stats?.shares ?? 0,
    visitCount: b.stats?.visits ?? 0,
    tier: b.tier,
  };
}

// ── Messages -> Contribution ─────────────────────────────────────────────────

/** Server has no 'image' message type — images are 'emblem' + content.imageUrls. */
export function toClientMessageType(t: MessageType): 'text' | 'image' | 'audio' {
  if (t === 'audio') return 'audio';
  if (t === 'emblem') return 'image';
  return 'text';
}

export function fromClientMessageType(t: 'text' | 'image' | 'audio'): MessageType {
  if (t === 'audio') return 'audio';
  if (t === 'image') return 'emblem';
  return 'text';
}

export function messageToContribution(m: MessageDTO, currentUserId?: string): Contribution {
  const sender = refOf(m.sender as UserRefDTO | string);
  const senderName = sender?.displayName || sender?.username || 'Guest';
  const clientType = toClientMessageType(m.type);
  const image = m.content?.imageUrls?.[0];

  return {
    id: m._id,
    authorName: senderName,
    authorHandle: handleOf(sender?.username),
    authorAvatar: sender?.profileImage || FALLBACK_AVATAR(senderName),
    authorId: sender?._id,

    content: m.content?.text ?? '',
    createdAt: m.createdAt,

    type: clientType,
    mediaType: clientType === 'text' ? 'note' : clientType,
    imageUrl: image,
    mediaUrl: m.content?.audioUrl ?? image,

    canvasElements: unwrapCanvasData(m.canvasData),
    sticker: m.content?.vectorKey ?? undefined,

    reactions: 0,
    reactionCounts: {},
    userReactions: [],
    isCreatedByUser: Boolean(currentUserId && sender?._id === currentUserId),
  };
}

// ── Canvas data ──────────────────────────────────────────────────────────────
// Message.canvasData is a Mixed field, so the shape is entirely ours. We write
// a versioned envelope so the renderer can evolve, but we must keep reading the
// bare array written by the previous frontend.

export const CANVAS_DATA_VERSION = 1;

export interface CanvasEnvelope {
  v: number;
  elements: unknown[];
}

export function wrapCanvasData(elements: unknown[] | undefined | null): CanvasEnvelope | null {
  if (!elements || !elements.length) return null;
  return { v: CANVAS_DATA_VERSION, elements };
}

/**
 * Reads both the new envelope and the legacy bare-array format written by the
 * old frontend, so boards created before this migration still render.
 */
export function unwrapCanvasData(data: unknown): unknown[] | undefined {
  if (!data) return undefined;
  if (Array.isArray(data)) return data; // legacy format
  const env = data as Partial<CanvasEnvelope>;
  if (Array.isArray(env.elements)) return env.elements;
  return undefined;
}

// ── Board payload out ────────────────────────────────────────────────────────

/**
 * Builds a minimal RegisteredUser from a @handle or display name.
 *
 * Used where the UI needs *something* to navigate with before the real profile
 * has been fetched (e.g. an @mention inside message text). The profile page
 * then loads the authoritative record via GET /user/profile/:username, and
 * shows a not-found state if the handle does not exist.
 *
 * This replaces the prototype's MOCK_REGISTERED_USERS lookups, which silently
 * resolved unknown handles to fabricated celebrity accounts.
 */
export function userFromHandle(
  input: string,
  overrides: Partial<RegisteredUser> = {},
): RegisteredUser {
  const raw = (input ?? '').trim().replace(/^@/, '');
  const name = raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'Member';
  const handle = `@${raw.toLowerCase().replace(/[^a-z0-9_]/g, '_') || 'member'}`;

  return {
    id: overrides.id ?? '',
    name,
    handle,
    avatar: FALLBACK_AVATAR(name),
    isVerified: false,
    heartsCount: 0,
    boardsCount: 0,
    bio: '',
    ...overrides,
  };
}

/** Builds a RegisteredUser stub from the author fields already on a Post. */
export function authorOf(post: Pick<Post, 'authorName' | 'authorHandle' | 'authorAvatar' | 'authorId'>): RegisteredUser {
  return userFromHandle(post.authorHandle || post.authorName || '', {
    id: post.authorId ?? '',
    name: post.authorName || 'Curator',
    handle: post.authorHandle || handleOf(undefined),
    avatar: post.authorAvatar || FALLBACK_AVATAR(post.authorName || 'Curator'),
  });
}

/** Extracts #hashtags from free text, lowercased and de-duplicated. */
export function extractHashtags(text: string): string[] {
  const found = text.match(/#[\p{L}\p{N}_]+/gu) ?? [];
  return [...new Set(found.map((t) => t.slice(1).toLowerCase()))];
}
