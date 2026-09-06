/**
 * Client view models.
 *
 * These describe what components render. They are produced from the backend
 * DTOs in ./api.ts by the adapters in ../lib/adapters.ts — never fetch straight
 * into these shapes.
 *
 * MOCK_REGISTERED_USERS used to live here (14 fabricated celebrity accounts).
 * It has been removed: it was the source of the fake auth in AuthModal and the
 * fake search results in TopNavigation. Real data now comes from the API.
 */

export enum EntityType {
  WALL = 'WALL',
  BOARD = 'BOARD',
  EVENT = 'EVENT',
}

export enum PostVisibility {
  PUBLIC = 'PUBLIC',
  ANONYMOUS = 'ANONYMOUS',
  PRIVATE = 'PRIVATE',
}

export interface User {
  id: string;
  name: string;
  avatar?: string;
  isClaimed: boolean;
  socialUrl?: string;
}

export interface RegisteredUser {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  isVerified: boolean;
  heartsCount: number;
  boardsCount: number;
  messagesCount?: string;
  taggedCount?: string;
  bio: string;
  /**
   * DISPLAY label only ("Verified Curator"). Never use this for permission
   * checks — the server's authorization role is `roleName`.
   */
  roleLabel?: string;
  /** Server authorization role: user | admin | super_admin. */
  roleName?: 'user' | 'admin' | 'super_admin';
  /** Present on the signed-in user only. */
  email?: string;
  isEmailVerified?: boolean;
  country?: string;
  accountType?: 'personal' | 'enterprise';
  /** 'google' accounts have no password, so password change is unavailable. */
  oauthProvider?: 'google' | 'email';
  notificationPrefs?: {
    heartTokenAlerts?: boolean;
    trophyCaseUpdates?: boolean;
  };
}

export interface ReactionCounts {
  clap?: number;
  heart?: number;
  smiley?: number;
  fire?: number;
}

export interface Contribution {
  id: string;
  authorName: string;
  authorHandle?: string;
  authorAvatar?: string;
  authorId?: string;
  content: string;
  caption?: string;
  createdAt: string;
  canvasElements?: any[];
  imageUrl?: string;
  mediaUrl?: string;
  type?: 'text' | 'image' | 'audio';
  mediaType?: 'audio' | 'video' | 'image' | 'text' | 'note';
  sticker?: string;
  confetti?: string;
  /** Semantic Heart Spectrum ids, persisted on the message's content.hearts. */
  selectedHearts?: string[];
  reactions?: number;
  reactionCounts?: ReactionCounts;
  userReactions?: ('clap' | 'heart' | 'smiley' | 'fire')[];
  isCreatedByUser?: boolean;
}

export interface Post {
  id: string;
  /**
   * Board slug — the route key for /board/:slug and every board-scoped message
   * endpoint. Boards are addressed by slug, not id, almost everywhere.
   */
  slug?: string;
  authorName: string;
  authorHandle?: string;
  authorAvatar?: string;
  authorId?: string;
  recipientName?: string;
  recipientHandle?: string;
  /** Resolved through avatarFor(), so it matches the recipient's profile page. */
  recipientAvatar?: string;
  recipientId?: string;
  content: string;
  caption?: string;
  type: 'text' | 'image' | 'audio' | 'heart_token';
  mediaUrl?: string;
  imageUrl?: string;
  visibility: PostVisibility;
  createdAt: string;
  targetId: string;
  targetType: EntityType;
  reactions: number;
  reactionCounts?: ReactionCounts;
  userReactions?: ('clap' | 'heart' | 'smiley' | 'fire')[];
  canvasElements?: any[];
  /**
   * The message row holding this board's artwork.
   *
   * A board document has no canvas of its own — `canvasElements` above is
   * copied off its first owner-written message (see useBoardMessages). Editing
   * the board's background therefore has to write back to THAT row, so its id
   * has to survive the hydration.
   */
  faceMessageId?: string;
  eventType?: string;
  recipients?: string[];
  hashtags?: string[];
  boardCapacity?: 'solo' | 'collaborative' | string;
  maxCapacity?: number;
  contributions?: Contribution[];
  isCreatedByUser?: boolean;
  isTaggedForUser?: boolean;
  hasUserContributed?: boolean;
  collaborators?: string[];
  collaboratorHandles?: string[];
  collaboratorIds?: string[];
  section?: 'board' | 'tagged' | 'collaboration' | 'hearts' | string;
  theme?: string;
  mediaType?: 'audio' | 'video' | 'image' | 'text' | 'note';
  sponsor?: string;
  sticker?: string;
  confetti?: string;
  secondaryImage?: string;
  isBlurred?: boolean;
  statusBadge?: string;
  isHeartToken?: boolean;
  selectedHearts?: string[];
  heartDetails?: {
    id?: string;
    label?: string;
    emoji?: string;
    bubbleColor?: string;
  };

  // ── Server-backed counters, surfaced from Board.stats ──────────────────────
  messageCount?: number;
  shareCount?: number;
  visitCount?: number;
  /** basic | standard | premium — drives the message-limit upsell. */
  tier?: 'basic' | 'standard' | 'premium';
  /** Feed bucket used by the tears/vouch/hype filter chips. */
  category?: 'tears' | 'vouch' | 'hype';
}

export interface AppreciationEntity {
  id: string;
  name: string;
  description: string;
  type: EntityType;
  owner?: User;
  avatar?: string;
  postCount: number;
  isSponsored?: boolean;
  sponsorName?: string;
}

export interface ModerationResult {
  isSafe: boolean;
  reason?: string;
  sentiment?: string;
}

/** Message capacity per board tier — mirrors BOARD_TIER_LIMITS in boardModel.js. */
export const BOARD_TIER_LIMITS: Record<string, number> = {
  basic: 30,
  standard: 50,
  premium: -1,
};

export function boardIsFull(post: Pick<Post, 'tier' | 'messageCount'>): boolean {
  const limit = BOARD_TIER_LIMITS[post.tier ?? 'basic'] ?? 30;
  if (limit === -1) return false;
  return (post.messageCount ?? 0) >= limit;
}
