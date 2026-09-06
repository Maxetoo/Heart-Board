/**
 * Backend DTOs — the exact shapes returned by the Express API.
 *
 * These mirror models/ and controllers/ on the server. Do NOT use them in
 * components; convert to the client view models in src/types/index.ts via
 * src/lib/adapters.ts at the API boundary.
 *
 * NOTE: the server misspells "recipient" as "receipent" throughout BoardSchema
 * (and "receiprentFlagReason" differently again). That spelling is preserved
 * here deliberately — it is absorbed by the adapter layer, not by a risky DB
 * migration. See CLIENT_MIGRATION_INSTRUCTIONS.txt §12.4.
 */

export type BoardVisibility = 'public' | 'private' | 'anonymous';
export type BoardTier = 'basic' | 'standard' | 'premium';
export type BoardEvent =
  | 'birthday'
  | 'wedding'
  | 'anniversary'
  | 'graduation'
  | 'sport'
  | 'retirement'
  | 'promotion'
  | 'other';

/** models/boardLikeModel.js — note 'smile', not 'smiley', and 'thumbs' exists. */
export type ReactionKey = 'clap' | 'heart' | 'thumbs' | 'smile' | 'fire';

export type MessageType = 'text' | 'audio' | 'emblem';
export type MessageContext = 'board' | 'direct';
export type MessageStatus = 'pending' | 'approved' | 'rejected';

export type UserRole = 'user' | 'admin' | 'super_admin';
export type AccountType = 'personal' | 'enterprise';

export interface UserStatsDTO {
  totalBoards: number;
  totalMessages: number;
  totalLikes: number;
  totalCurators: number;
  totalBoardsUpgraded: number;
  profileLikes: number;
}

export interface UserDTO {
  _id: string;
  username?: string;
  email?: string;
  profileImage?: string | null;
  role?: UserRole;
  country?: string;
  accountType?: AccountType;
  isEmailVerified?: boolean;
  oauthProvider?: 'google' | 'email';
  lastLoginMethod?: 'email' | 'oauth';
  likedProfiles?: string[];
  stats?: Partial<UserStatsDTO>;
  /** Added by this migration — see §11.5 of the migration doc. */
  bio?: string;
  isVerified?: boolean;
  displayName?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** A populated `owner` / `receipent` reference: only username + profileImage. */
export interface UserRefDTO {
  _id: string;
  username?: string;
  profileImage?: string | null;
  isVerified?: boolean;
  displayName?: string;
}

export interface BoardStatsDTO {
  likes: number;
  shares: number;
  visits: number;
  messages: number;
}

export interface BoardDTO {
  _id: string;
  slug: string;
  title: string;
  description?: string;
  owner: UserRefDTO | string;
  receipent?: UserRefDTO | string | null;
  receipentOriginal?: string | null;
  receipentHashtag?: string | null;
  receipentFlagged?: boolean;
  receiprentFlagReason?: string | null;
  coverImage?: string | null;
  event?: BoardEvent | null;
  visibility: BoardVisibility;
  tier: BoardTier;
  tags?: string[];
  stats?: Partial<BoardStatsDTO>;
  lastReaction?: ReactionKey | null;
  isActive?: boolean;
  onlyMe?: boolean;
  /** Added by this migration — see §11.1 of the migration doc. */
  style?: { theme?: string; sticker?: string; confetti?: string } | null;
  /**
   * Denormalised snapshot of the board's face message, so feed cards can show
   * the artwork without fetching messages. Inline data: URLs are stripped
   * server-side, so this stays small.
   */
  preview?: {
    text?: string | null;
    imageUrl?: string | null;
    audioUrl?: string | null;
    type?: MessageType | null;
    canvasData?: unknown;
  } | null;
  /** Per-reaction totals, aggregated server-side. See §11.4. */
  reactionCounts?: Partial<Record<ReactionKey, number>>;
  createdAt: string;
  updatedAt?: string;
}

export interface MessageContentDTO {
  text?: string | null;
  font?: string | null;
  color?: string | null;
  background?: string | null;
  frame?: string | null;
  imageUrls?: string[];
  vectorKey?: string | null;
  audioUrl?: string | null;
  duration?: number | null;
}

export interface MessageDTO {
  _id: string;
  context: MessageContext;
  board?: BoardDTO | string | null;
  recipient?: UserRefDTO | string | null;
  sender: UserRefDTO | string;
  type: MessageType;
  content: MessageContentDTO;
  status: MessageStatus;
  isRead?: boolean;
  /** Free-form canvas editor state. Versioned by us — see adapters. */
  canvasData?: unknown;
  createdAt: string;
  updatedAt?: string;
}

/** Most list endpoints. NOTE: /board/hashtag/:tag returns a FLAT shape instead. */
export interface PaginationDTO {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface UploadResultDTO {
  message: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  publicId: string;
  format: string;
  bytes: number;
  duration: number | null;
  width: number | null;
  height: number | null;
}

export interface SubscriptionDTO {
  _id: string;
  user: string;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired';
  currentPeriodEnd: string | null;
  revenueCatUserId?: string | null;
  revenueCatProductId?: string | null;
  revenueCatEntitlement?: string | null;
}

export interface ProfileSummaryDTO {
  mostLikedBoard: BoardDTO | null;
  activeBoard: BoardDTO | null;
  topCurator: UserRefDTO | null;
}

export interface GlobalStatsDTO {
  totalMessages: number;
  totalCurators: number;
  totalReactions: number;
  totalBoards: number;
}
