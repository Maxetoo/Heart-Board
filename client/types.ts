
export enum EntityType {
  WALL = 'WALL',
  BOARD = 'BOARD',
  EVENT = 'EVENT'
}

export enum PostVisibility {
  PUBLIC = 'PUBLIC',
  ANONYMOUS = 'ANONYMOUS',
  PRIVATE = 'PRIVATE'
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
  role?: string;
}

export const MOCK_REGISTERED_USERS: RegisteredUser[] = [
  {
    id: 'u-beyounce',
    name: 'Beyounce',
    handle: '@beyounce',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    isVerified: true,
    heartsCount: 101600000,
    boardsCount: 120,
    messagesCount: '101.6M',
    taggedCount: '30.6M',
    bio: 'Queen Bey Official Heartboard Profile',
    role: 'Verified Icon'
  },
  {
    id: 'u1',
    name: 'Mercy24',
    handle: '@mercy24',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mercy24',
    isVerified: true,
    heartsCount: 88,
    boardsCount: 5,
    messagesCount: '12.4k',
    taggedCount: '3.2k',
    bio: 'Curator & Goodwill Ambassador on Heartboard',
    role: 'Verified Curator'
  },
  {
    id: 'u2',
    name: 'Amino',
    handle: '@amino_official',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amino',
    isVerified: true,
    heartsCount: 562,
    boardsCount: 12,
    bio: 'Spreading positive vibes & heartfelt vouches',
    role: 'Verified Curator'
  },
  {
    id: 'u3',
    name: 'Beyoncé Fan',
    handle: '@bey_hive',
    avatar: 'https://images.unsplash.com/photo-1574100004472-e536d3b6bacc?auto=format&fit=crop&q=80&w=200',
    isVerified: true,
    heartsCount: 12400,
    boardsCount: 18,
    bio: 'Queen Bey fan club curator & concert memory builder',
    role: 'Community Lead'
  },
  {
    id: 'u4',
    name: 'Davido Fans',
    handle: '@davido_30bg',
    avatar: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=200',
    isVerified: true,
    heartsCount: 1200000,
    boardsCount: 42,
    bio: '30BG Global Heartboard Official Curator',
    role: 'Official Celebrity Account'
  },
  {
    id: 'u5',
    name: 'Tyler',
    handle: '@tyler_grandson',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
    isVerified: false,
    heartsCount: 412,
    boardsCount: 3,
    bio: 'Grateful grandson & story writer',
    role: 'Registered Member'
  },
  {
    id: 'u6',
    name: 'Cristiano Ronaldo',
    handle: '@cristiano',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cristiano',
    isVerified: true,
    heartsCount: 890000,
    boardsCount: 150,
    bio: 'Claimed Official Profile • Football Legend & Global Icon',
    role: 'Verified Celebrity'
  },
  {
    id: 'u7',
    name: 'Lionel Messi',
    handle: '@messi',
    avatar: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=200',
    isVerified: true,
    heartsCount: 2100000,
    boardsCount: 210,
    bio: 'Claimed Official Profile • World Champion & Legend',
    role: 'Verified Celebrity'
  },
  {
    id: 'u8',
    name: 'Sarah',
    handle: '@sarah_zen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    isVerified: true,
    heartsCount: 194,
    boardsCount: 7,
    bio: 'Hard work & workplace appreciation notes creator',
    role: 'Verified Curator'
  },
  {
    id: 'u9',
    name: 'Micky Mouse',
    handle: '@mickymouse',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Micky',
    isVerified: true,
    heartsCount: 88,
    boardsCount: 2,
    bio: 'Disney Magic & Joy Receiver',
    role: 'Registered Member'
  },
  {
    id: 'u10',
    name: 'Argentina Fans',
    handle: '@argentina_fans',
    avatar: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=200',
    isVerified: true,
    heartsCount: 89000,
    boardsCount: 25,
    bio: 'World Cup Champions Tribute Curator',
    role: 'Verified Curator'
  },
  {
    id: 'u11',
    name: 'Alex_Dev',
    handle: '@alex_dev',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    isVerified: false,
    heartsCount: 320,
    boardsCount: 6,
    bio: 'Building goodwill tools & appreciation boards',
    role: 'Registered Member'
  },
  {
    id: 'u12',
    name: 'Ronike',
    handle: '@ronike_vibe',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    isVerified: true,
    heartsCount: 150,
    boardsCount: 4,
    bio: 'Goodwill Ambassador & Heartboard Curator',
    role: 'Verified Curator'
  },
  {
    id: 'u13',
    name: 'Ronny',
    handle: '@ronny',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    isVerified: false,
    heartsCount: 75,
    boardsCount: 2,
    bio: 'Heartboard member',
    role: 'Registered Member'
  },
  {
    id: 'u14',
    name: 'Ronaldo',
    handle: '@ronaldo',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cristiano',
    isVerified: true,
    heartsCount: 890000,
    boardsCount: 150,
    bio: 'Claimed Official Profile • Football Legend & Global Icon',
    role: 'Verified Celebrity'
  }
];

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
  reactions?: number;
  reactionCounts?: ReactionCounts;
  userReactions?: ('clap' | 'heart' | 'smiley' | 'fire')[];
  isCreatedByUser?: boolean;
}

export interface Post {
  id: string;
  authorName: string;
  authorHandle?: string;
  authorAvatar?: string;
  authorId?: string;
  recipientName?: string;
  recipientHandle?: string;
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
