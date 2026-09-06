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

    // Account fields. These are only ever present on /user/me (a populated
    // UserRefDTO carries none of them), which is exactly where the settings
    // drawer reads from. Omitting them here was why Settings showed a
    // placeholder email instead of the signed-in account's.
    email: full.email,
    isEmailVerified: full.isEmailVerified,
    country: full.country,
    accountType: full.accountType,
    oauthProvider: full.oauthProvider,
    notificationPrefs: full.notificationPrefs,
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

  // The board's artwork lives on its face message. `preview` is the server's
  // denormalised snapshot of it, which is what lets a feed card render the real
  // card instead of a bare text placeholder.
  const previewElements = unwrapCanvasData(b.preview?.canvasData);
  const previewImage = b.preview?.imageUrl ?? undefined;

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

    // Prefer the face message's own words; the board description is a fallback.
    content: b.preview?.text || b.description || '',
    caption: b.title,

    type: b.preview?.type === 'audio' ? 'audio' : b.coverImage || previewImage ? 'image' : 'text',
    mediaType:
      b.preview?.type === 'audio'
        ? 'audio'
        : b.coverImage || previewImage
          ? 'image'
          : 'note',
    imageUrl: b.coverImage ?? previewImage,
    mediaUrl: b.coverImage ?? previewImage ?? b.preview?.audioUrl ?? undefined,

    // Renders the real card on the feed rather than a text-only placeholder.
    canvasElements: previewElements,

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
//
// Message.canvasData is a Mixed field, so the shape is entirely ours. We write
// a versioned envelope going forward, but messages already in the database were
// written by the old frontend in a completely different shape and must keep
// rendering. This is the single biggest data-compatibility risk in the
// migration — see CLIENT_MIGRATION_INSTRUCTIONS.txt §14.6.
//
// LEGACY SHAPE (old frontend, src/canvas/CanvasRenderer.jsx):
//   {
//     canvasTexts:   [{ id, content, font:{label,family,style}, color,
//                       fontSize, textAlign, position:{x,y} }],
//     canvasBg:      { id, label, value }              // CSS background value
//     canvasFrame:   { style, thickness, radius, color, border, borderRadius }
//     canvasVectors: [{ id, label, icon, color, opacity, vectorId, size,
//                       position:{x,y} }],
//     canvasImages:  [{ id, src, position?, size?, rotation? }],
//     aspectRatio:   string
//   }
//
// NEW SHAPE: a flat CanvasElement[] with { id, type, x, y, scale, rotation, … }.
// Positions are percentages in both, so they carry over directly.

export const CANVAS_DATA_VERSION = 2;

export interface CanvasEnvelope {
  v: number;
  elements: unknown[];
  /** Preserved so a round-trip through this client does not lose the ratio. */
  aspectRatio?: string;
}

interface LegacyPos {
  x?: number;
  y?: number;
}

interface LegacyCanvas {
  canvasTexts?: {
    id?: number | string;
    content?: string;
    font?: { label?: string; family?: string; style?: Record<string, unknown> };
    color?: string;
    fontSize?: number;
    textAlign?: string;
    position?: LegacyPos;
  }[];
  canvasBg?: { id?: string; label?: string; value?: string } | null;
  canvasFrame?: {
    style?: string;
    thickness?: number;
    radius?: number;
    color?: string;
    border?: string;
    borderRadius?: string;
  } | null;
  canvasVectors?: {
    id?: number | string;
    label?: string;
    icon?: string;
    color?: string;
    opacity?: number;
    vectorId?: string;
    size?: number;
    position?: LegacyPos;
  }[];
  canvasImages?: {
    id?: number | string;
    src?: string;
    position?: LegacyPos;
    size?: number;
    scale?: number;
    rotation?: number;
  }[];
  aspectRatio?: string;
}

function isLegacyCanvas(data: unknown): data is LegacyCanvas {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const d = data as Record<string, unknown>;
  return (
    'canvasTexts' in d || 'canvasVectors' in d || 'canvasImages' in d || 'canvasBg' in d
  );
}

/**
 * Reference canvas size used to convert legacy percentage positions into the
 * pixel offsets the current renderer expects.
 *
 * The two formats position elements completely differently:
 *   legacy  -> position.x / position.y are PERCENTAGES (0-100) of the card,
 *              where 50/50 is the centre
 *   current -> x / y are PIXEL offsets from the centre of the card
 *              (the container is `flex items-center justify-center`, and each
 *               element is `translate3d(${x}px, ${y}px, 0)`)
 *
 * So a legacy element at 50/50 must become 0/0, and one at 80/60 must become
 * roughly +30% / +10% of the card size in pixels. These dimensions match the
 * board frame in MediaModal (max-w-[320..380px], h-[400..474px]); the midpoint
 * keeps legacy art close to where it was authored at any breakpoint.
 */
const LEGACY_CANVAS_W = 340;
const LEGACY_CANVAS_H = 430;

/** percent (0-100, 50 = centre) -> pixel offset from centre */
function pctToOffset(pct: number | undefined, extent: number): number {
  if (pct == null || Number.isNaN(pct)) return 0;
  return Math.round(((pct - 50) / 100) * extent);
}

/** Converts one legacy canvasData document into the flat element list. */
export function convertLegacyCanvas(data: LegacyCanvas): unknown[] {
  const elements: Record<string, unknown>[] = [];

  // Background first, so it renders behind everything else.
  if (data.canvasBg?.value) {
    elements.push({
      id: `bg-${data.canvasBg.id ?? 'legacy'}`,
      type: 'bg',
      bgHex: data.canvasBg.value,
      frameName: data.canvasBg.label,
    });
  }

  if (data.canvasFrame?.color) {
    elements.push({
      id: 'frame-legacy',
      type: 'bg',
      frameName: data.canvasFrame.style,
      strokeEnabled: true,
      strokeColor: data.canvasFrame.color,
      strokeWidth: data.canvasFrame.thickness,
      cornerRadius: data.canvasFrame.radius,
    });
  }

  for (const img of data.canvasImages ?? []) {
    if (!img.src) continue;
    elements.push({
      id: `img-${img.id ?? Math.random().toString(36).slice(2)}`,
      type: 'image',
      imageUrl: img.src,
      x: pctToOffset(img.position?.x, LEGACY_CANVAS_W),
      y: pctToOffset(img.position?.y, LEGACY_CANVAS_H),
      scale: img.scale ?? (img.size ? img.size / 220 : 1),
      rotation: img.rotation ?? 0,
    });
  }

  for (const t of data.canvasTexts ?? []) {
    elements.push({
      id: `text-${t.id ?? Math.random().toString(36).slice(2)}`,
      type: 'text',
      text: t.content ?? '',
      fontFamily: t.font?.family,
      color: t.color,
      align: (t.textAlign as 'left' | 'center' | 'right') ?? 'left',
      x: pctToOffset(t.position?.x, LEGACY_CANVAS_W),
      y: pctToOffset(t.position?.y, LEGACY_CANVAS_H),
      // The old renderer sized text in px against a fixed canvas; the new one
      // scales relative to a 16px base.
      scale: t.fontSize ? t.fontSize / 16 : 1,
      rotation: 0,
    });
  }

  for (const v of data.canvasVectors ?? []) {
    elements.push({
      id: `vec-${v.id ?? Math.random().toString(36).slice(2)}`,
      type: 'vector',
      vectorId: v.vectorId ?? v.icon,
      vectorName: v.label,
      // RenderCanvasElementReadOnly reads `vectorColor`; `color` is the text
      // colour field and is ignored for vectors.
      vectorColor: v.color,
      color: v.color,
      bubbleColor: v.color,
      x: pctToOffset(v.position?.x, LEGACY_CANVAS_W),
      y: pctToOffset(v.position?.y, LEGACY_CANVAS_H),
      scale: v.size ? v.size / 48 : 1,
      rotation: 0,
    });
  }

  return elements;
}

/**
 * Single choke point for saving canvas state.
 *
 * Strips any element whose image is still an inline data: URL. Images must be
 * uploaded to Cloudinary and referenced by URL — the old frontend embedded
 * base64 straight into canvasData and produced message documents over 3MB
 * (MongoDB's hard limit is 16MB per document, and every reader pays the cost
 * on every fetch). Dropping the image is better than writing a document that
 * may be rejected or that makes the board unusably slow to load.
 */
export function wrapCanvasData(
  elements: unknown[] | undefined | null,
  aspectRatio?: string,
): CanvasEnvelope | null {
  if (!elements || !elements.length) return null;

  const safe = elements.map((el) => {
    const e = el as Record<string, unknown>;
    const url = e?.imageUrl;
    if (typeof url === 'string' && url.startsWith('data:')) {
      console.warn(
        '[canvas] dropping an un-uploaded inline image; it must be uploaded first',
      );
      return { ...e, imageUrl: '' };
    }
    return el;
  });

  return { v: CANVAS_DATA_VERSION, elements: safe, aspectRatio };
}

/**
 * Reads every canvasData format we have ever written:
 *   - v2 envelope   { v, elements, aspectRatio }   (current)
 *   - bare array    [...]                          (transitional)
 *   - legacy object { canvasTexts, canvasBg, … }   (old frontend, in production)
 */
export function unwrapCanvasData(data: unknown): unknown[] | undefined {
  if (!data) return undefined;

  if (Array.isArray(data)) return data;

  const env = data as Partial<CanvasEnvelope>;
  if (Array.isArray(env.elements)) return env.elements;

  if (isLegacyCanvas(data)) return convertLegacyCanvas(data);

  return undefined;
}

/** Reads the aspect ratio from either format. */
export function canvasAspectRatio(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  return (data as { aspectRatio?: string }).aspectRatio;
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
