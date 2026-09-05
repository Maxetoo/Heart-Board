import React, { useState } from 'react';
import { ShareProfileModal, ShareData } from './ShareProfileModal';
import { SEMANTIC_HEARTS, HeartBubbleSvg } from './CreateAppreciationModal';
import { LiveHeartAnimation } from './LiveHeartAnimation';
import { PostCard } from './PostCard';
import type { RegisteredUser } from '../types';
import { 
  Settings, 
  Share2, 
  Camera, 
  Search, 
  SlidersHorizontal, 
  Mic,
  X,
  User,
  Lock,
  Bell,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Globe,
  Sparkles,
  Award,
  Heart,
  CheckCircle2,
  PenLine,
  ArrowLeft,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * The subset of a user this view renders.
 *
 * Every required field is also required on RegisteredUser, so a RegisteredUser
 * is always assignable here. Previously the two types diverged (this one had an
 * extra `role`, and lacked `isVerified`), which made the callback props
 * contravariant with App's handlers.
 */
export interface UserProfileData {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  messagesCount?: string;
  taggedCount?: string;
  heartsCount?: number;
  boardsCount?: number;
  bio?: string;
  isVerified?: boolean;
  /** Display label such as "Verified Curator" — never an authorization role. */
  roleLabel?: string;
}

/** Widens the view's looser profile shape into a full RegisteredUser. */
export function asRegisteredUser(u: UserProfileData): RegisteredUser {
  return {
    id: u.id,
    name: u.name,
    handle: u.handle,
    avatar: u.avatar,
    isVerified: u.isVerified ?? false,
    heartsCount: u.heartsCount ?? 0,
    boardsCount: u.boardsCount ?? 0,
    messagesCount: u.messagesCount,
    taggedCount: u.taggedCount,
    bio: u.bio ?? '',
    roleLabel: u.roleLabel,
  };
}

export interface HeartboardViewProps {
  posts?: any[];
  onPostClick?: (post: any) => void;
  onFilterClick?: (subTab?: 'board' | 'tagged' | 'collaboration' | 'hearts') => void;
  profileUser?: UserProfileData | null;
  currentUser?: RegisteredUser | null;
  onBack?: () => void;
  onGiftHeart?: (user: RegisteredUser) => void;
  onSendMessage?: (user: RegisteredUser) => void;
  onSelectUser?: (user: RegisteredUser) => void;
  selectedFilterId?: string;
  onClearFilter?: () => void;
  defaultTab?: 'board' | 'tagged' | 'collaboration' | 'hearts';
  heartFilter?: 'received' | 'sent';
  onHeartFilterChange?: (filter: 'received' | 'sent') => void;
  onSignOut?: () => void;
}

// Re-use the exact HeartBubbleSvg component from Page 2 (Send/Blow Heart)
const HeartBubbleSVG: React.FC<{
  size?: number;
  bubbleColor?: string;
  className?: string;
}> = ({ size = 56, bubbleColor = '#FE6349', className = '' }) => {
  return <HeartBubbleSvg color={bubbleColor || '#FE6349'} size={size} className={className} />;
};

export interface HeartCategoryCardData {
  id: string;
  categoryName: string;
  count: number;
  bubbleColor: string;
  bgHalo: string;
  dotColors: string[];
  layoutType: 'cluster3' | 'pair2' | 'single1';
  badgeExtra?: string;
  items?: any[];
}

export const HeartCategoryCard: React.FC<{
  data: HeartCategoryCardData;
  onShare?: (data: HeartCategoryCardData) => void;
  onClick?: (data: HeartCategoryCardData) => void;
}> = ({ data, onShare, onClick }) => {
  const {
    categoryName = 'Heart',
    count = 0,
    bubbleColor = '#FE6349',
    bgHalo = '#FDF4F2',
    dotColors = [],
    badgeExtra
  } = data || {};

  const effectiveLayout = count === 1 ? 'single1' : count === 2 ? 'pair2' : 'cluster3';

  return (
    <div
      onClick={() => onClick && onClick(data)}
      className="bg-white rounded-2xl sm:rounded-[2.25rem] transition-all duration-300 p-3 sm:p-7 flex flex-col justify-between items-center h-[270px] sm:h-[350px] relative overflow-hidden group cursor-pointer shadow-[3px_0px_45px_0px_rgba(0,0,0,0.08)] w-full"
      style={{ boxShadow: '3px 0px 45px 0px rgba(0, 0, 0, 0.08)' }}
    >
      {/* 1. Header Category Title */}
      <div className="w-full flex items-center justify-between z-10">
        <span className="text-[#808897] font-semibold text-xs sm:text-base tracking-wide pl-1 truncate">
          {categoryName}
        </span>
      </div>

      {/* 2. Center Graphic Area */}
      <div className="relative flex items-center justify-center my-auto scale-[0.75] sm:scale-100 origin-center">
        {/* Soft Circular Background Halo */}
        <div 
          className="w-40 h-40 sm:w-44 sm:h-44 rounded-full flex items-center justify-center relative transition-transform duration-300 group-hover:scale-105"
          style={{ backgroundColor: bgHalo }}
        >
          {/* Decorative Scattered Dots */}
          <div 
            className="absolute -top-1 left-4 w-2.5 h-2.5 rounded-full opacity-75"
            style={{ backgroundColor: dotColors[0] || bubbleColor }}
          />
          <div 
            className="absolute top-8 -right-3 w-3 h-3 rounded-full opacity-80"
            style={{ backgroundColor: dotColors[1] || bubbleColor }}
          />
          <div 
            className="absolute bottom-6 -left-3 w-3.5 h-3.5 rounded-full opacity-60"
            style={{ backgroundColor: dotColors[2] || bubbleColor }}
          />
          <div 
            className="absolute -bottom-1 right-8 w-2.5 h-2.5 rounded-full opacity-75"
            style={{ backgroundColor: dotColors[3] || bubbleColor }}
          />
          <div 
            className="absolute top-2 right-12 w-1.5 h-1.5 rounded-full opacity-50"
            style={{ backgroundColor: dotColors[0] || bubbleColor }}
          />
          <div 
            className="absolute bottom-12 left-2 w-2 h-2 rounded-full opacity-65"
            style={{ backgroundColor: dotColors[1] || bubbleColor }}
          />

          {/* Heart Token Cluster Layout */}
          {effectiveLayout === 'cluster3' && (
            <div className="relative w-32 h-32 flex items-center justify-center">
              {/* Top Token */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                <HeartBubbleSVG size={58} bubbleColor={bubbleColor} />
              </div>
              {/* Bottom Left Token */}
              <div className="absolute bottom-0 left-0 z-10">
                <HeartBubbleSVG size={52} bubbleColor={bubbleColor} />
              </div>
              {/* Bottom Right Token */}
              <div className="absolute bottom-0 right-0 z-10">
                <HeartBubbleSVG size={52} bubbleColor={bubbleColor} />
              </div>

              {/* Optional Numeric Overlay Badge for > 3 hearts */}
              {(badgeExtra || count > 3) && (
                <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-[#353849]/90 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-white shadow-xs">
                  {badgeExtra || (count > 20 ? `+${count - 3}` : `${count}`)}
                </div>
              )}
            </div>
          )}

          {effectiveLayout === 'pair2' && (
            <div className="relative w-32 h-32 flex items-center justify-center">
              {/* Top Right Bubble */}
              <div className="absolute top-2 right-2 z-10">
                <HeartBubbleSVG size={58} bubbleColor={bubbleColor} />
              </div>
              {/* Bottom Left Bubble */}
              <div className="absolute bottom-2 left-2 z-10">
                <HeartBubbleSVG size={58} bubbleColor={bubbleColor} />
              </div>
            </div>
          )}

          {effectiveLayout === 'single1' && (
            <div className="relative w-32 h-32 flex items-center justify-center z-10">
              <HeartBubbleSVG size={72} bubbleColor={bubbleColor} />
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

const HeartboardCard: React.FC<{ item: any; onClick: () => void }> = ({ item, onClick }) => {
  return <PostCard post={item} onClick={onClick} />;
};

const DEFAULT_MOCK_RECEIVED_HEARTS = [
  {
    id: 'rec-heart-loving-1',
    authorName: 'Mercy24',
    authorHandle: '@mercy24',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mercy24',
    recipientName: 'Micky Mouse',
    recipients: ['@mickymouse'],
    selectedHearts: ['loving'],
    heartDetails: { id: 'loving', label: 'Loving Partner', emoji: '💖', bubbleColor: '#FFB800' },
    content: 'Loving Heart 💖 blown to Micky Mouse with deepest appreciation!',
    createdAt: '2024-03-21T08:00:00Z',
    isHeartToken: true,
    isCreatedByUser: false,
    section: 'hearts'
  },
  {
    id: 'rec-heart-loving-2',
    authorName: 'Ronike',
    authorHandle: '@ronike_vibe',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    recipientName: 'Micky Mouse',
    recipients: ['@mickymouse'],
    selectedHearts: ['loving'],
    heartDetails: { id: 'loving', label: 'Loving Partner', emoji: '💖', bubbleColor: '#FFB800' },
    content: 'Loving soul and always spreading sunshine everywhere! ✨',
    createdAt: '2024-03-20T14:15:00Z',
    isHeartToken: true,
    isCreatedByUser: false,
    section: 'hearts'
  },
  {
    id: 'rec-heart-loving-3',
    authorName: 'Tyler',
    authorHandle: '@tyler_grandson',
    authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
    recipientName: 'Micky Mouse',
    recipients: ['@mickymouse'],
    selectedHearts: ['loving'],
    heartDetails: { id: 'loving', label: 'Loving Partner', emoji: '💖', bubbleColor: '#FFB800' },
    content: 'Endless love and appreciation for your support throughout the journey!',
    createdAt: '2024-03-19T11:20:00Z',
    isHeartToken: true,
    isCreatedByUser: false,
    section: 'hearts'
  },
  {
    id: 'rec-heart-reliable-1',
    authorName: 'Alex_Dev',
    authorHandle: '@alex_dev',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    recipientName: 'Micky Mouse',
    recipients: ['@mickymouse'],
    selectedHearts: ['reliable'],
    heartDetails: { id: 'reliable', label: 'Reliable', emoji: '🤝', bubbleColor: '#FF8A65' },
    content: 'Always dependable and on time whenever a deadline approaches. True rock! 🤝',
    createdAt: '2024-03-20T16:45:00Z',
    isHeartToken: true,
    isCreatedByUser: false,
    section: 'hearts'
  },
  {
    id: 'rec-heart-reliable-2',
    authorName: 'Sarah',
    authorHandle: '@sarah_zen',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    recipientName: 'Micky Mouse',
    recipients: ['@mickymouse'],
    selectedHearts: ['reliable'],
    heartDetails: { id: 'reliable', label: 'Reliable', emoji: '🤝', bubbleColor: '#FF8A65' },
    content: 'Rock-solid reliability through thick and thin.',
    createdAt: '2024-03-18T09:30:00Z',
    isHeartToken: true,
    isCreatedByUser: false,
    section: 'hearts'
  },
  {
    id: 'rec-heart-leadership-1',
    authorName: 'Cristiano Ronaldo',
    authorHandle: '@cristiano',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cristiano',
    recipientName: 'Micky Mouse',
    recipients: ['@mickymouse'],
    selectedHearts: ['leadership'],
    heartDetails: { id: 'leadership', label: 'Leadership', emoji: '👑', bubbleColor: '#7B62FF' },
    content: 'True leadership that inspires the entire community. Keep pushing! 👑',
    createdAt: '2024-03-19T18:00:00Z',
    isHeartToken: true,
    isCreatedByUser: false,
    section: 'hearts'
  },
  {
    id: 'rec-heart-leadership-2',
    authorName: 'Amino',
    authorHandle: '@amino_official',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amino',
    recipientName: 'Micky Mouse',
    recipients: ['@mickymouse'],
    selectedHearts: ['leadership'],
    heartDetails: { id: 'leadership', label: 'Leadership', emoji: '👑', bubbleColor: '#7B62FF' },
    content: 'Guiding light for our creative projects and team coordination!',
    createdAt: '2024-03-17T12:00:00Z',
    isHeartToken: true,
    isCreatedByUser: false,
    section: 'hearts'
  },
  {
    id: 'rec-heart-hardworking-1',
    authorName: 'Sarah',
    authorHandle: '@sarah_zen',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    recipientName: 'Micky Mouse',
    recipients: ['@mickymouse'],
    selectedHearts: ['hardworking'],
    heartDetails: { id: 'hardworking', label: 'Hard working', emoji: '💪', bubbleColor: '#4CD964' },
    content: 'Incredible work ethic day in and day out! Never ceases to amaze. 💪',
    createdAt: '2024-03-21T07:10:00Z',
    isHeartToken: true,
    isCreatedByUser: false,
    section: 'hearts'
  },
  {
    id: 'rec-heart-hardworking-2',
    authorName: 'Davido Fans',
    authorHandle: '@davido_30bg',
    authorAvatar: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=200',
    recipientName: 'Micky Mouse',
    recipients: ['@mickymouse'],
    selectedHearts: ['hardworking'],
    heartDetails: { id: 'hardworking', label: 'Hard working', emoji: '💪', bubbleColor: '#4CD964' },
    content: 'Non-stop dedication, hard work and persistent positivity!',
    createdAt: '2024-03-16T15:00:00Z',
    isHeartToken: true,
    isCreatedByUser: false,
    section: 'hearts'
  },
  {
    id: 'rec-heart-visionary-1',
    authorName: 'Beyoncé Fan',
    authorHandle: '@bey_hive',
    authorAvatar: 'https://images.unsplash.com/photo-1574100004472-e536d3b6bacc?auto=format&fit=crop&q=80&w=200',
    recipientName: 'Micky Mouse',
    recipients: ['@mickymouse'],
    selectedHearts: ['visionary'],
    heartDetails: { id: 'visionary', label: 'Visionary', emoji: '✨', bubbleColor: '#FF53C0' },
    content: 'Foresight that changes the game. Truly a visionary creator! ✨',
    createdAt: '2024-03-20T10:30:00Z',
    isHeartToken: true,
    isCreatedByUser: false,
    section: 'hearts'
  },
  {
    id: 'rec-heart-best-1',
    authorName: 'Argentina Fans',
    authorHandle: '@argentina_fans',
    authorAvatar: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=200',
    recipientName: 'Micky Mouse',
    recipients: ['@mickymouse'],
    selectedHearts: ['best'],
    heartDetails: { id: 'best', label: 'Best of all', emoji: '🏆', bubbleColor: '#007A78' },
    content: 'Best of all! A genuine legend and inspiring soul in the community. 🏆',
    createdAt: '2024-03-19T20:15:00Z',
    isHeartToken: true,
    isCreatedByUser: false,
    section: 'hearts'
  }
];

const DEFAULT_MOCK_SENT_HEARTS = [
  {
    id: 'sent-heart-loving-1',
    authorName: 'Micky Mouse',
    authorHandle: '@mickymouse',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Micky',
    recipientName: 'Beyounce',
    recipientHandle: '@beyounce',
    recipientAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    recipients: ['@beyounce'],
    selectedHearts: ['loving'],
    heartDetails: { id: 'loving', label: 'Loving Partner', emoji: '💖', bubbleColor: '#FFB800' },
    content: 'Queen Bey, your music healed my heart! Loving token for you 💖',
    createdAt: '2024-03-21T09:00:00Z',
    isHeartToken: true,
    isCreatedByUser: true,
    section: 'hearts'
  },
  {
    id: 'sent-heart-loving-2',
    authorName: 'Micky Mouse',
    authorHandle: '@mickymouse',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Micky',
    recipientName: 'Sarah',
    recipientHandle: '@sarah_zen',
    recipientAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    recipients: ['@sarah_zen'],
    selectedHearts: ['loving'],
    heartDetails: { id: 'loving', label: 'Loving Partner', emoji: '💖', bubbleColor: '#FFB800' },
    content: 'Thank you for the warm guidance, calm mindset, and kindness! 💖',
    createdAt: '2024-03-20T17:00:00Z',
    isHeartToken: true,
    isCreatedByUser: true,
    section: 'hearts'
  },
  {
    id: 'sent-heart-reliable-1',
    authorName: 'Micky Mouse',
    authorHandle: '@mickymouse',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Micky',
    recipientName: 'Tyler',
    recipientHandle: '@tyler_grandson',
    recipientAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
    recipients: ['@tyler_grandson'],
    selectedHearts: ['reliable'],
    heartDetails: { id: 'reliable', label: 'Reliable', emoji: '🤝', bubbleColor: '#FF8A65' },
    content: 'Thank you for always keeping your word and standing strong with family.',
    createdAt: '2024-03-19T13:40:00Z',
    isHeartToken: true,
    isCreatedByUser: true,
    section: 'hearts'
  },
  {
    id: 'sent-heart-leadership-1',
    authorName: 'Micky Mouse',
    authorHandle: '@mickymouse',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Micky',
    recipientName: 'Cristiano Ronaldo',
    recipientHandle: '@cristiano',
    recipientAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cristiano',
    recipients: ['@cristiano'],
    selectedHearts: ['leadership'],
    heartDetails: { id: 'leadership', label: 'Leadership', emoji: '👑', bubbleColor: '#7B62FF' },
    content: 'Unmatched leadership on and off the pitch. True global inspiration! 👑',
    createdAt: '2024-03-20T21:10:00Z',
    isHeartToken: true,
    isCreatedByUser: true,
    section: 'hearts'
  },
  {
    id: 'sent-heart-leadership-2',
    authorName: 'Micky Mouse',
    authorHandle: '@mickymouse',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Micky',
    recipientName: 'Lionel Messi',
    recipientHandle: '@messi',
    recipientAvatar: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=200',
    recipients: ['@messi'],
    selectedHearts: ['leadership'],
    heartDetails: { id: 'leadership', label: 'Leadership', emoji: '👑', bubbleColor: '#7B62FF' },
    content: 'Masterful captaincy and calm leadership in the world cup final.',
    createdAt: '2024-03-18T19:30:00Z',
    isHeartToken: true,
    isCreatedByUser: true,
    section: 'hearts'
  },
  {
    id: 'sent-heart-hardworking-1',
    authorName: 'Micky Mouse',
    authorHandle: '@mickymouse',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Micky',
    recipientName: 'Alex_Dev',
    recipientHandle: '@alex_dev',
    recipientAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    recipients: ['@alex_dev'],
    selectedHearts: ['hardworking'],
    heartDetails: { id: 'hardworking', label: 'Hard working', emoji: '💪', bubbleColor: '#4CD964' },
    content: 'Astonishing technical grit and late-night coding breakthroughs! 🛠️💪',
    createdAt: '2024-03-21T06:45:00Z',
    isHeartToken: true,
    isCreatedByUser: true,
    section: 'hearts'
  },
  {
    id: 'sent-heart-visionary-1',
    authorName: 'Micky Mouse',
    authorHandle: '@mickymouse',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Micky',
    recipientName: 'Davido',
    recipientHandle: '@davido_30bg',
    recipientAvatar: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=200',
    recipients: ['@davido_30bg'],
    selectedHearts: ['visionary'],
    heartDetails: { id: 'visionary', label: 'Visionary', emoji: '✨', bubbleColor: '#FF53C0' },
    content: 'Visionary music pioneer taking global Afrobeats to unprecedented heights! 🌟',
    createdAt: '2024-03-19T15:20:00Z',
    isHeartToken: true,
    isCreatedByUser: true,
    section: 'hearts'
  },
  {
    id: 'sent-heart-best-1',
    authorName: 'Micky Mouse',
    authorHandle: '@mickymouse',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Micky',
    recipientName: 'Cristiano Ronaldo',
    recipientHandle: '@cristiano',
    recipientAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cristiano',
    recipients: ['@cristiano'],
    selectedHearts: ['best'],
    heartDetails: { id: 'best', label: 'Best of all', emoji: '🏆', bubbleColor: '#007A78' },
    content: 'The greatest of all time. Respect and honor forever! 🏆',
    createdAt: '2024-03-18T22:00:00Z',
    isHeartToken: true,
    isCreatedByUser: true,
    section: 'hearts'
  },
  {
    id: 'sent-heart-best-2',
    authorName: 'Micky Mouse',
    authorHandle: '@mickymouse',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Micky',
    recipientName: 'Lionel Messi',
    recipientHandle: '@messi',
    recipientAvatar: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=200',
    recipients: ['@messi'],
    selectedHearts: ['best'],
    heartDetails: { id: 'best', label: 'Best of all', emoji: '🏆', bubbleColor: '#007A78' },
    content: 'Pure footballing perfection. Best of all time! 🏆',
    createdAt: '2024-03-17T18:15:00Z',
    isHeartToken: true,
    isCreatedByUser: true,
    section: 'hearts'
  }
];

const MOCK_HEARTBOARD_ITEMS = [
  {
    id: 'hb-1',
    title: 'Beyoncé Live World Tour',
    authorName: 'Curated by @mickymouse',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1574100004472-e536d3b6bacc?auto=format&fit=crop&q=80&w=500',
    frameBg: '#FAF0EC', // cozy soft peach frame
    aspectRatio: 'portrait',
    tab: 'board'
  },
  {
    id: 'hb-2',
    title: 'Love Granpa So Much',
    authorName: 'Tyler',
    type: 'image_note',
    content: 'Love Granpa So Much',
    mediaUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
    frameBg: '#1A1B25', // dark charcoal border frame
    paperBg: '#F8F9FB',
    aspectRatio: 'landscape',
    tab: 'board'
  },
  {
    id: 'hb-3',
    title: 'Tribute to Davido',
    authorName: 'Amino',
    type: 'note',
    content: 'I love you ronaldo!. Happy retirement, Your cousin Amino',
    mediaUrl: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=300',
    frameBg: '#F7B238', // warm yellow orange frame
    paperBg: '#FFFDF9',
    aspectRatio: 'tall_note',
    tab: 'board'
  },
  {
    id: 'hb-4',
    title: 'Voice Note Tribute',
    authorName: 'Anonymous',
    type: 'audio',
    content: 'Voice capsule appreciation',
    frameBg: '#FAF0EC', // soft pinkish peach
    aspectRatio: 'square_audio',
    tab: 'board'
  },
  {
    id: 'hb-5',
    title: 'Ronaldo Retirement Card',
    authorName: 'Amino',
    type: 'note_stickers',
    content: 'I love you ronaldo!. Happy retirement, Your cousin Amino',
    frameBg: '#149B88', // teal green frame
    paperBg: '#FFFDF9',
    stickers: ['red_heart', 'yellow_star'],
    aspectRatio: 'landscape_note',
    tab: 'tagged'
  },
  {
    id: 'hb-6',
    title: 'Tupac Loved Memorial',
    authorName: 'Fanbase',
    type: 'note_stickers',
    content: 'Legacy lives forever',
    mediaUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=300',
    frameBg: '#BEE27C', // lime green frame
    paperBg: '#FFFDF9',
    stickers: ['giant_heart'],
    aspectRatio: 'tall_note',
    tab: 'board',
    section: 'board'
  }
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200'
];

export type HeartboardSubTab = 'board' | 'tagged' | 'collaboration' | 'hearts';

export const HeartboardView: React.FC<HeartboardViewProps> = ({ 
  posts = [], 
  onPostClick, 
  onFilterClick,
  profileUser = null,
  currentUser = null,
  onBack,
  onGiftHeart,
  onSendMessage,
  onSelectUser,
  selectedFilterId = 'moment',
  onClearFilter,
  defaultTab = 'board',
  heartFilter: heartFilterProp,
  onHeartFilterChange,
  onSignOut
}) => {
  const [activeSubTab, setActiveSubTab] = useState<HeartboardSubTab>(defaultTab);
  const [internalHeartFilter, setInternalHeartFilter] = useState<'received' | 'sent'>(heartFilterProp || 'received');
  
  React.useEffect(() => {
    if (heartFilterProp !== undefined) {
      setInternalHeartFilter(heartFilterProp);
    }
  }, [heartFilterProp]);

  const heartFilter = heartFilterProp !== undefined ? heartFilterProp : internalHeartFilter;
  const setHeartFilter = (newFilter: 'received' | 'sent') => {
    setInternalHeartFilter(newFilter);
    if (onHeartFilterChange) {
      onHeartFilterChange(newFilter);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isHeartsAnimationActive, setIsHeartsAnimationActive] = useState(false);

  const triggerHeartsCelebration = () => {
    setIsHeartsAnimationActive(false);
    setTimeout(() => {
      setIsHeartsAnimationActive(true);
    }, 50);
  };

  // Profile State
  const [userName, setUserName] = useState(currentUser ? currentUser.name : 'Micky Mouse');
  const [userHandle, setUserHandle] = useState(currentUser ? currentUser.handle : '@mickymouse');
  const [userEmail, setUserEmail] = useState(currentUser?.email || 'Aminuolawale@gmail.com');
  const [profileImage, setProfileImage] = useState<string | null>(currentUser?.avatar || null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Sync profile details when currentUser changes
  React.useEffect(() => {
    if (currentUser) {
      setUserName(currentUser.name);
      setUserHandle(currentUser.handle);
      if (currentUser.avatar) {
        setProfileImage(currentUser.avatar);
      }
      if (currentUser.email) {
        setUserEmail(currentUser.email);
      }
    }
  }, [currentUser]);

  // File Input Ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Temporary edit state
  const [tempName, setTempName] = useState(userName);
  const [tempEmail, setTempEmail] = useState(userEmail);
  const [tempProfileImage, setTempProfileImage] = useState<string | null>(profileImage);

  // Settings State & Interactive Handlers
  const [boardVisibility, setBoardVisibility] = useState<'Public' | 'Only Recipient' | 'Anonymous'>('Public');
  const [contributionLimit, setContributionLimit] = useState<'Free' | 'Unlimited'>('Free');
  const [handshakeAutoConfirm, setHandshakeAutoConfirm] = useState(true);
  const [heartTokenAlerts, setHeartTokenAlerts] = useState(true);
  const [trophyCaseUpdates, setTrophyCaseUpdates] = useState(true);
  const [activeHeartTags, setActiveHeartTags] = useState<string[]>(['#loveRonaldo', '#messi', '#workspacelegend']);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagManager, setShowTagManager] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedProfileLink, setCopiedProfileLink] = useState(false);
  const [shareModalData, setShareModalData] = useState<ShareData | null>(null);

  const handleCopyProfileLink = () => {
    const profileUrl = window.location.origin ? `${window.location.origin}?profile=${encodeURIComponent(userHandle)}` : `https://heartboard.app/${userHandle}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(profileUrl).then(() => {
        setCopiedProfileLink(true);
        showToast('Profile link copied to clipboard!');
        setTimeout(() => setCopiedProfileLink(false), 2000);
      }).catch(() => {
        showToast('Profile link copied!');
      });
    } else {
      showToast('Profile link copied!');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const handleToggleVisibility = () => {
    const nextVis = boardVisibility === 'Public' ? 'Only Recipient' : boardVisibility === 'Only Recipient' ? 'Anonymous' : 'Public';
    setBoardVisibility(nextVis);
    showToast(`Visibility set to: ${nextVis}`);
  };

  const handleToggleLimit = () => {
    const nextLimit = contributionLimit === 'Free' ? 'Unlimited' : 'Free';
    setContributionLimit(nextLimit);
    showToast(`Contribution Mode: ${nextLimit === 'Free' ? 'Free (20 Curators)' : 'Unlimited (Pro Space)'}`);
  };

  const handleAddTag = () => {
    let tag = newTagInput.trim();
    if (!tag) return;
    if (!tag.startsWith('#')) tag = `#${tag}`;
    if (activeHeartTags.includes(tag)) {
      showToast(`${tag} is already in your verified list`);
      return;
    }
    setActiveHeartTags([...activeHeartTags, tag]);
    setNewTagInput('');
    showToast(`Claimed new Heart Tag: ${tag}`);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setActiveHeartTags(activeHeartTags.filter((t) => t !== tagToRemove));
    showToast(`Removed tag: ${tagToRemove}`);
  };

  const [selectedCategoryModal, setSelectedCategoryModal] = useState<HeartCategoryCardData | null>(null);
  const lastSelectedCategoryModalRef = React.useRef<HeartCategoryCardData | null>(null);
  if (selectedCategoryModal) {
    lastSelectedCategoryModalRef.current = selectedCategoryModal;
  }
  const activeCategoryModal = selectedCategoryModal || lastSelectedCategoryModalRef.current;

  const [drawerSearchQuery, setDrawerSearchQuery] = useState('');
  const [activeTooltipIndex, setActiveTooltipIndex] = useState<string | null>(null);

  // Semantic Heart Spectrum specifications matching SEMANTIC_HEARTS
  const SEMANTIC_SPECS = [
    {
      id: 'loving',
      categoryName: 'Loving',
      bubbleColor: '#FFB800',
      bgHalo: '#FEF3C7',
      dotColors: ['#FDE047', '#FFB800', '#FEF08A', '#D97706'],
    },
    {
      id: 'reliable',
      categoryName: 'Reliable',
      bubbleColor: '#FF8A65',
      bgHalo: '#FFF0EB',
      dotColors: ['#FFD8CC', '#FF8A65', '#FFC1B0', '#E65100'],
    },
    {
      id: 'leadership',
      categoryName: 'Leadership',
      bubbleColor: '#7B62FF',
      bgHalo: '#F3F0FF',
      dotColors: ['#C4B5FD', '#7B62FF', '#DDD6FE', '#5B21B6'],
    },
    {
      id: 'hardworking',
      categoryName: 'Hard working',
      bubbleColor: '#4CD964',
      bgHalo: '#ECFDF5',
      dotColors: ['#A7F3D0', '#4CD964', '#6EE7B7', '#047857'],
    },
    {
      id: 'visionary',
      categoryName: 'Visionary',
      bubbleColor: '#FF53C0',
      bgHalo: '#FDF2F8',
      dotColors: ['#FBCFE8', '#FF53C0', '#F472B6', '#BE185D'],
    },
    {
      id: 'best',
      categoryName: 'Best of all',
      bubbleColor: '#007A78',
      bgHalo: '#E6F4F4',
      dotColors: ['#80CBD2', '#007A78', '#4DB6AC', '#004D40'],
    },
  ];

  const handleStartEdit = () => {
    setTempName(userName);
    setTempEmail(userEmail);
    setTempProfileImage(profileImage);
    setIsEditingProfile(true);
  };

  const handleSaveProfile = () => {
    const rawVal = tempName.trim() || 'Micky Mouse';
    setUserName(rawVal);
    const derivedHandle = rawVal.startsWith('@')
      ? rawVal
      : `@${rawVal.toLowerCase().replace(/\s+/g, '')}`;
    setUserHandle(derivedHandle);
    setUserEmail(tempEmail.trim() || 'Aminuolawale@gmail.com');
    setProfileImage(tempProfileImage);
    setIsEditingProfile(false);
    showToast('Profile details saved');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setTempProfileImage(result);
        setProfileImage(result);
        showToast('Profile picture updated');
      };
      reader.readAsDataURL(file);
    }
  };

  const allAvailableItems = posts.length > 0 ? posts : MOCK_HEARTBOARD_ITEMS;

  // Helper to reliably identify heart token items vs message boards
  const isHeartPost = (item: any) => {
    return Boolean(
      item.isHeartToken || 
      item.type === 'heart_token' || 
      item.section === 'hearts' || 
      item.tab === 'hearts'
    );
  };

  // Is this viewing another user's profile or own heartboard?
  const isViewingOtherUser = Boolean(profileUser);
  const currentUserName = isViewingOtherUser ? profileUser!.name : userName;
  const currentUserHandle = isViewingOtherUser ? profileUser!.handle : userHandle;

  // Extract all heart token posts from dynamic posts
  const allHeartTokenPosts = posts.filter((p: any) => isHeartPost(p));

  // Dynamic user-sent hearts: hearts sent BY the active user/profile
  const dynamicSentHearts = allHeartTokenPosts.filter((p: any) => {
    if (isViewingOtherUser) {
      const auth = (p.authorName || '').toLowerCase();
      const authH = (p.authorHandle || '').toLowerCase();
      const target = currentUserName.toLowerCase();
      const targetH = currentUserHandle.toLowerCase();
      return auth === target || authH === targetH;
    }
    return p.isCreatedByUser === true || (p.authorName && p.authorName.toLowerCase() === userName.toLowerCase());
  });

  // Dynamic user-received hearts: hearts sent TO the active user/profile
  const dynamicReceivedHearts = allHeartTokenPosts.filter((p: any) => {
    if (isViewingOtherUser) {
      const rec = (p.recipientName || p.targetId || '').toLowerCase();
      const recH = (p.recipientHandle || '').toLowerCase();
      const target = currentUserName.toLowerCase();
      const targetH = currentUserHandle.toLowerCase();
      const recs = (p.recipients || []).map((r: string) => r.toLowerCase());
      return rec === target || recH === targetH || recs.includes(target) || recs.includes(targetH);
    }
    return p.isCreatedByUser !== true;
  });

  // Combine defaults with user actions without duplicates
  const allReceivedHearts = [
    ...dynamicReceivedHearts,
    ...DEFAULT_MOCK_RECEIVED_HEARTS.filter(
      def => !dynamicReceivedHearts.some((dyn: any) => dyn.id === def.id)
    )
  ];

  const allSentHearts = [
    ...dynamicSentHearts,
    ...DEFAULT_MOCK_SENT_HEARTS.filter(
      def => !dynamicSentHearts.some((dyn: any) => dyn.id === def.id)
    )
  ];

  // Dynamically calculate category stats strictly for the active filter (Received vs Sent)
  const buildCategoriesForDataset = (dataset: any[], isSentFilter: boolean): HeartCategoryCardData[] => {
    return SEMANTIC_SPECS.map((spec) => {
      const matchedEntries: any[] = [];

      dataset.forEach((post) => {
        let isMatch = false;

        // 1. Check selectedHearts array
        if (Array.isArray(post.selectedHearts) && post.selectedHearts.length > 0) {
          if (
            post.selectedHearts.includes(spec.id) ||
            post.selectedHearts.some((h: string) => h.toLowerCase().includes(spec.categoryName.toLowerCase()))
          ) {
            isMatch = true;
          }
        }

        // 2. Check heartDetails object
        if (!isMatch && post.heartDetails) {
          const hId = (post.heartDetails.id || '').toLowerCase();
          const hLabel = (post.heartDetails.label || '').toLowerCase();
          if (hId === spec.id || hLabel.includes(spec.categoryName.toLowerCase()) || spec.categoryName.toLowerCase().includes(hLabel)) {
            isMatch = true;
          }
        }

        // 3. Check heart token type / section / content
        if (!isMatch && (post.isHeartToken || post.section === 'hearts' || post.type === 'heart_token')) {
          const content = (post.content || '').toLowerCase();
          const badge = (post.statusBadge || '').toLowerCase();
          const title = (post.title || '').toLowerCase();
          const catNameLower = spec.categoryName.toLowerCase();

          if (
            content.includes(catNameLower) ||
            badge.includes(catNameLower) ||
            title.includes(catNameLower) ||
            (spec.id === 'loving' && (content.includes('loving') || content.includes('love'))) ||
            (spec.id === 'visionary' && content.includes('vision')) ||
            (spec.id === 'leadership' && content.includes('leader')) ||
            (spec.id === 'hardworking' && (content.includes('hard work') || content.includes('hardworking'))) ||
            (spec.id === 'reliable' && content.includes('reliab'))
          ) {
            isMatch = true;
          }
        }

        if (isMatch) {
          if (isSentFilter) {
            // In Sent mode, show recipient details
            const recName = post.recipientName || post.targetId || 'Recipient';
            const recHandle = post.recipientHandle || post.recipients?.[0] || (post.recipientName ? `@${post.recipientName.toLowerCase().replace(/\s+/g, '')}` : '@recipient');
            const recAvatar = post.recipientAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(recName)}`;

            matchedEntries.push({
              id: post.id,
              name: recName,
              handle: recHandle,
              avatar: recAvatar,
              date: post.createdAt 
                ? new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
                : 'Recently',
              content: post.content || `${spec.categoryName} Heart Token Sent`
            });
          } else {
            // In Received mode, show sender details
            const sndName = post.authorName || 'Anonymous';
            const sndHandle = post.authorHandle || (post.authorName ? `@${post.authorName.toLowerCase().replace(/\s+/g, '')}` : '@anonymous');
            const sndAvatar = post.authorAvatar || post.mediaUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(sndName)}`;

            matchedEntries.push({
              id: post.id,
              name: sndName,
              handle: sndHandle,
              avatar: sndAvatar,
              date: post.createdAt 
                ? new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
                : 'Recently',
              content: post.content || `${spec.categoryName} Heart Token`
            });
          }
        }
      });

      const count = matchedEntries.length;
      const layoutType = count === 1 ? 'single1' : count === 2 ? 'pair2' : 'cluster3';

      return {
        id: `cat-${spec.id}`,
        categoryName: spec.categoryName,
        count: count,
        bubbleColor: spec.bubbleColor,
        bgHalo: spec.bgHalo,
        dotColors: spec.dotColors,
        layoutType: layoutType,
        items: matchedEntries
      };
    });
  };

  const calculatedReceivedCategories = React.useMemo(() => {
    return buildCategoriesForDataset(allReceivedHearts, false);
  }, [allReceivedHearts]);

  const calculatedSentCategories = React.useMemo(() => {
    return buildCategoriesForDataset(allSentHearts, true);
  }, [allSentHearts]);

  const totalReceivedHeartsCount = React.useMemo(() => {
    return calculatedReceivedCategories.reduce((sum, cat) => sum + cat.count, 0);
  }, [calculatedReceivedCategories]);

  const totalSentHeartsCount = React.useMemo(() => {
    return calculatedSentCategories.reduce((sum, cat) => sum + cat.count, 0);
  }, [calculatedSentCategories]);

  // Selected dataset based strictly on active filter
  const activeHeartCategories = heartFilter === 'received' ? calculatedReceivedCategories : calculatedSentCategories;

  // Only display categories that have count > 0 (at least 1 send/receive)
  const nonZeroCategories = activeHeartCategories.filter((cat) => cat.count > 0);

  const displayHeartCategories = nonZeroCategories.filter((cat) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    
    // 1. Heart type / category match
    const catNameLower = cat.categoryName.toLowerCase();
    const matchesCatName = catNameLower.includes(q) || q.includes(catNameLower);
    
    // 2. Sender / Recipient name / handle match
    const matchesUser = cat.items && cat.items.some((item: any) => 
      item.name.toLowerCase().includes(q) || item.handle.toLowerCase().includes(q)
    );
      
    return matchesCatName || matchesUser;
  });

  const filteredItems = allAvailableItems.filter((item) => {
    // 1. Target user resolution for current profile context
    const targetName = (profileUser?.name || currentUser?.name || userName || 'Micky Mouse').trim();
    const targetHandle = (profileUser?.handle || currentUser?.handle || userHandle || '@mickymouse').trim();
    const targetHandleClean = targetHandle.replace(/^@/, '').toLowerCase();
    const targetNameClean = targetName.toLowerCase();
    const targetNameNoSpaces = targetNameClean.replace(/\s+/g, '');
    const targetId = (profileUser?.id || currentUser?.id || 'u9').trim().toLowerCase();
    const isOwnProfile = !profileUser;

    // Helper: is the current target user the CREATOR of this board?
    const isCreator = (it: any): boolean => {
      if (isOwnProfile && it.isCreatedByUser === true) return true;
      const aName = (it.authorName || '').trim().toLowerCase();
      const aHandle = (it.authorHandle || '').trim().toLowerCase().replace(/^@/, '');
      const aId = (it.authorId || '').trim().toLowerCase();
      if (aHandle && aHandle === targetHandleClean) return true;
      if (aName && (aName === targetNameClean || aName.replace(/\s+/g, '') === targetNameNoSpaces)) return true;
      if (targetId && aId && aId === targetId) return true;
      // Default fallback for mock items with explicit tab/section 'board' if own profile
      if (isOwnProfile && (it.section === 'board' || it.tab === 'board') && !it.isTaggedForUser) return true;
      return false;
    };

    // Helper: was the current target user TAGGED as a recipient on this board?
    const isTagged = (it: any): boolean => {
      // If target user created the board, it belongs under Board, NEVER Tagged!
      if (isCreator(it)) return false;

      const recipientsList = (Array.isArray(it.recipients) ? it.recipients : []).map((r: string) => r.trim().toLowerCase());
      const recipientName = (it.recipientName || it.recipient || '').trim().toLowerCase();
      const recipientHandle = (it.recipientHandle || '').trim().toLowerCase().replace(/^@/, '');
      const targetField = (it.targetId || '').trim().toLowerCase();
      const taggedList = (Array.isArray(it.taggedUsers) ? it.taggedUsers : []).map((u: string) => u.trim().toLowerCase());

      const inRecipientsList = recipientsList.some((r: string) => {
        const clean = r.replace(/^@/, '');
        return clean === targetHandleClean || clean === targetNameNoSpaces || r === targetHandle.toLowerCase() || r === `@${targetNameNoSpaces}`;
      });

      const matchesRecipientName = 
        (recipientName && (recipientName.includes(targetNameClean) || recipientName.includes(targetHandleClean))) ||
        (recipientHandle && recipientHandle === targetHandleClean);

      const matchesTargetId = targetField === targetHandleClean || targetField === targetNameNoSpaces || (targetId && targetField === targetId);
      const inTaggedList = taggedList.some((u: string) => u.replace(/^@/, '') === targetHandleClean || u === targetNameClean);
      const isTaggedExplicit = isOwnProfile && (it.isTaggedForUser === true || it.section === 'tagged' || it.tab === 'tagged') && !it.isCreatedByUser;

      return inRecipientsList || matchesRecipientName || matchesTargetId || inTaggedList || isTaggedExplicit;
    };

    // Helper: did the current target user CONTRIBUTE/curate a message on this board?
    const isContributor = (it: any): boolean => {
      const contribs = Array.isArray(it.contributions) ? it.contributions : [];
      const hasContribution = contribs.some((c: any) => {
        if (isOwnProfile && c.isCreatedByUser === true) return true;
        const cName = (c.authorName || '').trim().toLowerCase();
        const cHandle = (c.authorHandle || '').trim().toLowerCase().replace(/^@/, '');
        const cId = (c.authorId || '').trim().toLowerCase();
        if (cHandle && cHandle === targetHandleClean) return true;
        if (cName && (cName === targetNameClean || cName.replace(/\s+/g, '') === targetNameNoSpaces)) return true;
        if (targetId && cId && cId === targetId) return true;
        return false;
      });

      const hasCollabMeta = 
        (it.collaboratorHandles || []).some((h: string) => h.replace(/^@/, '').toLowerCase() === targetHandleClean) ||
        (it.collaboratorIds || []).some((id: string) => id.toLowerCase() === targetId) ||
        (it.collaborators || []).some((collab: string) => collab.toLowerCase() === targetNameClean);

      const isCollabExplicit = isOwnProfile && (it.hasUserContributed === true || it.section === 'collaboration' || it.tab === 'collaboration');

      return hasContribution || hasCollabMeta || isCollabExplicit;
    };

    let matchesTab = false;

    if (activeSubTab === 'board') {
      // 1. Board section = Message boards created by this user only (NEVER heart tokens!)
      if (isHeartPost(item)) return false;
      matchesTab = isCreator(item);
    } else if (activeSubTab === 'tagged') {
      // 2. Tagged section = Message boards where this user was tagged (NEVER heart tokens!)
      if (isHeartPost(item)) return false;
      matchesTab = isTagged(item);
    } else if (activeSubTab === 'collaboration') {
      // 3. Collaboration section = Message boards where this user contributed a message (NEVER heart tokens!)
      if (isHeartPost(item)) return false;
      matchesTab = isContributor(item);
    } else if (activeSubTab === 'hearts') {
      // 4. Hearts section = Heart tokens
      matchesTab = isHeartPost(item);
    }

    if (!matchesTab) return false;

    // Apply User-Controlled Event Category Filter on Boards/Tagged/Collaboration tabs if explicitly selected by user
    if (activeSubTab !== 'hearts' && selectedFilterId && selectedFilterId !== 'moment' && selectedFilterId !== 'all') {
      const targetFilter = selectedFilterId.toLowerCase();
      const pEv = (item.eventType || '').toLowerCase().replace(/_/g, ' ');
      const content = (item.content || '').toLowerCase();
      const title = (item.title || '').toLowerCase();
      const badge = (item.statusBadge || '').toLowerCase();
      
      const matchesEvent = pEv === targetFilter || 
                           content.includes(targetFilter) || 
                           title.includes(targetFilter) || 
                           badge.includes(targetFilter);
      if (!matchesEvent) return false;
    }

    if (!searchQuery.trim()) return true;

    const q = searchQuery.trim().toLowerCase();

    // Section-specific search logic: Caption, Recipient Name, or Creator/Contributor Name
    const matchesCaption = 
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.content && item.content.toLowerCase().includes(q)) ||
      (item.caption && item.caption.toLowerCase().includes(q)) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
      (item.quote && item.quote.toLowerCase().includes(q));

    const matchesRecipient = 
      (item.recipientName && item.recipientName.toLowerCase().includes(q)) ||
      (item.recipient && item.recipient.toLowerCase().includes(q)) ||
      (item.recipientHandle && item.recipientHandle.toLowerCase().includes(q)) ||
      (Array.isArray(item.recipients) && item.recipients.some((r: string) => r.toLowerCase().includes(q)));

    const matchesCreatorOrTagged = 
      (item.authorName && item.authorName.toLowerCase().includes(q)) ||
      (item.authorHandle && item.authorHandle.toLowerCase().includes(q)) ||
      (item.creatorName && item.creatorName.toLowerCase().includes(q)) ||
      (item.curatorName && item.curatorName.toLowerCase().includes(q)) ||
      (item.taggedUser && item.taggedUser.toLowerCase().includes(q)) ||
      (item.userHandle && item.userHandle.toLowerCase().includes(q)) ||
      (Array.isArray(item.taggedUsers) && item.taggedUsers.some((u: string) => u.toLowerCase().includes(q))) ||
      (Array.isArray(item.contributions) && item.contributions.some((c: any) => 
        (c.authorName && c.authorName.toLowerCase().includes(q)) ||
        (c.authorHandle && c.authorHandle.toLowerCase().includes(q)) ||
        (c.content && c.content.toLowerCase().includes(q))
      ));

    return matchesCaption || matchesRecipient || matchesCreatorOrTagged;
  }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  return (
    <div className="w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-12 py-8 pb-32">
      {/* Live & Fun Floating Hearts Celebration Experience */}
      <LiveHeartAnimation 
        categories={displayHeartCategories} 
        isActive={isHeartsAnimationActive} 
        onComplete={() => setIsHeartsAnimationActive(false)} 
        durationMs={6500} 
      />

      {/* 1. Top Header: Page Title & Settings OR Back & Share */}
      {profileUser ? (
        <div className="flex items-center justify-between mb-8">
          <button 
            aria-label="Go Back"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-[#1A1B25] transition-all cursor-pointer shadow-2xs"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>
          
          <button 
            aria-label="Share Profile"
            onClick={() => setIsShareModalOpen(true)}
            className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-[#353849] transition-all cursor-pointer shadow-2xs"
          >
            <Share2 className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1B25] tracking-tight">
            My Heartboard
          </h1>
          <button 
            aria-label="Settings"
            onClick={() => setIsSettingsOpen(true)}
            className="w-9 h-9 rounded-full bg-gray-25 flex items-center justify-center text-[#353849] hover:bg-gray-50 transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4 stroke-[2]" />
          </button>
        </div>
      )}

      {/* 2. User Profile Banner */}
      {profileUser ? (
        <div className="flex flex-row items-center gap-6 mb-8">
          {/* Avatar */}
          <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-[140px] md:h-[140px] rounded-full bg-[#FDF4F2] flex items-center justify-center shrink-0 overflow-hidden shadow-2xs border border-rose-100/60">
            {profileUser.avatar ? (
              <img src={profileUser.avatar} alt={profileUser.name} className="w-full h-full object-cover" />
            ) : (
              <svg className="w-16 h-16 sm:w-20 sm:h-20 text-[#FFB5A9] fill-current" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            )}
          </div>

          {/* User Name, Stats & Action Buttons */}
          <div className="flex flex-col justify-center gap-2">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1A1B25] tracking-tight">
                {profileUser.name}
              </h2>
              <p className="text-xs sm:text-sm md:text-base font-semibold text-[#808897] mt-1">
                {profileUser.messagesCount || '101.6M'} Messages &nbsp;|&nbsp; {profileUser.taggedCount || '30.6M'} Tagged
              </p>
            </div>

            {/* Action buttons: Heart & Message */}
            <div className="flex items-center gap-3 mt-2">
              <button 
                onClick={() => onGiftHeart && onGiftHeart(asRegisteredUser(profileUser))}
                className="bg-[#ffffff] hover:bg-[#F8F9FB] text-[#1A1B25] border-2 border-[#ECEFF3] px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <Heart className="w-4 h-4 text-[#1A1B25] fill-none stroke-[2.5]" />
                <span>Heart</span>
              </button>

              <button 
                onClick={() => onSendMessage && onSendMessage(asRegisteredUser(profileUser))}
                className="bg-[#ffffff] hover:bg-[#F8F9FB] text-[#1A1B25] border-2 border-[#ECEFF3] px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <PenLine className="w-4 h-4 text-[#1A1B25] stroke-[2.5]" />
                <span>Message</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-row items-center gap-6 mb-8">
          {/* Hidden File Input for Profile Picture Upload */}
          <input 
            ref={fileInputRef} 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileChange} 
          />

          {/* Avatar */}
          <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-[144px] md:h-[144px] max-w-[144px] max-h-[144px] rounded-full bg-[#FDF4F2] flex items-center justify-center shrink-0 relative overflow-hidden group">
            {profileImage ? (
              <img src={profileImage} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <svg className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-[#FFB5A9] fill-current transform translate-y-2" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Change Profile Picture"
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-xs font-semibold gap-1 transition-opacity cursor-pointer"
            >
              <Camera className="w-6 h-6" />
              <span>Change Photo</span>
            </button>
          </div>

          {/* User Handle & Action Buttons */}
          <div className="flex flex-col gap-2">
            <div>
              <h2 className="text-2xl sm:text-3xl font-medium text-[#1A1B25] tracking-tight">
                {userHandle}
              </h2>
              <p className="text-xs sm:text-sm font-medium text-[#A4ABB8] mt-0.5">
                {userEmail}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-1">
              <button 
                onClick={() => {
                  setShareModalData({
                    type: 'profile',
                    userHandle: userHandle,
                    userName: userName,
                    profileImage: profileImage,
                    url: `${window.location.origin}/#${userHandle.replace('@', '')}`
                  });
                  setIsShareModalOpen(true);
                }}
                className="bg-[#ffffff] hover:bg-[#F8F9FB] text-[#353849] border-2 border-[#ECEFF3] px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Share</span>
              </button>
              <button 
                onClick={handleCopyProfileLink}
                className="bg-[#ffffff] hover:bg-[#F8F9FB] text-[#353849] border-2 border-[#ECEFF3] px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-95"
                title="Copy profile link"
              >
                {copiedProfileLink ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5] text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
                )}
                <span>{copiedProfileLink ? 'Copied' : 'Link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Filter Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        {/* Filter Sub-Tabs: Exact requested order: Board -> Tagged -> Collaboration -> Hearts */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            id="heartboard-tab-board"
            onClick={() => setActiveSubTab('board')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'board'
                ? 'bg-[#1A1B25] text-white shadow-2xs'
                : 'bg-[#F8F9FB] text-[#A4ABB8] hover:text-[#666D80] hover:bg-[#ECEFF3]'
            }`}
          >
            Board
          </button>
          <button
            id="heartboard-tab-tagged"
            onClick={() => setActiveSubTab('tagged')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'tagged'
                ? 'bg-[#1A1B25] text-white shadow-2xs'
                : 'bg-[#F8F9FB] text-[#A4ABB8] hover:text-[#666D80] hover:bg-[#ECEFF3]'
            }`}
          >
            Tagged
          </button>
          <button
            id="heartboard-tab-collaboration"
            onClick={() => setActiveSubTab('collaboration')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'collaboration'
                ? 'bg-[#1A1B25] text-white shadow-2xs'
                : 'bg-[#F8F9FB] text-[#A4ABB8] hover:text-[#666D80] hover:bg-[#ECEFF3]'
            }`}
          >
            Collaboration
          </button>
          <button
            id="heartboard-tab-hearts"
            onClick={() => {
              setActiveSubTab('hearts');
              triggerHeartsCelebration();
            }}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'hearts'
                ? 'bg-[#1A1B25] text-white shadow-2xs'
                : 'bg-[#F8F9FB] text-[#A4ABB8] hover:text-[#666D80] hover:bg-[#ECEFF3]'
            }`}
          >
            Hearts
          </button>
        </div>
      </div>

      {/* Active Filter Banner when user selects an event filter on Heartboard */}
      {activeSubTab !== 'hearts' && selectedFilterId && selectedFilterId !== 'moment' && selectedFilterId !== 'all' && (
        <div className="bg-[#FAF0EC] border border-orange-200/60 rounded-2xl p-3.5 mb-6 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2 text-xs text-gray-900 font-bold">
            <SlidersHorizontal className="w-4 h-4 text-[#FE6349] shrink-0" />
            <span>
              Filtered by event: <strong className="font-extrabold text-[#FE6349] capitalize">{selectedFilterId}</strong>
              {' '}({filteredItems.length} {filteredItems.length === 1 ? 'board' : 'boards'})
            </span>
          </div>
          {onClearFilter && (
            <button 
              onClick={onClearFilter}
              className="text-xs font-bold text-[#FE6349] hover:text-rose-700 bg-white border border-rose-200/80 px-3 py-1 rounded-full hover:shadow-xs transition-all flex items-center gap-1 cursor-pointer"
            >
              Show All Boards ✕
            </button>
          )}
        </div>
      )}

      {/* 4. Search Bar Row */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-grow relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A4ABB8]">
            <Search className="w-4 h-4 stroke-[2.5]" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeSubTab === 'board'
                ? "Search boards created by you by caption, recipient, or event..."
                : activeSubTab === 'tagged'
                ? "Search boards you were tagged in by caption, creator, or event..."
                : activeSubTab === 'collaboration'
                ? "Search boards you contributed to by caption, creator, or message..."
                : heartFilter === 'received'
                ? "Search received hearts by type or sender's name (e.g. Mercy24)..."
                : "Search sent hearts by type or recipient's name (e.g. Cristiano)..."
            }
            className="w-full bg-gray-25 border-0 outline-none focus:outline-none focus:ring-0 rounded-full py-3 pl-10 pr-4 text-xs font-medium text-[#1A1B25] placeholder:text-[#A4ABB8]"
          />
        </div>
        <button 
          onClick={() => {
            if (onFilterClick) {
              onFilterClick(activeSubTab);
            }
          }}
          aria-label="Filter"
          className="w-10 h-10 rounded-full bg-gray-25 flex items-center justify-center text-[#808897] hover:text-[#1A1B25] transition-all cursor-pointer shrink-0"
        >
          <SlidersHorizontal className="w-4 h-4 stroke-[2] text-[#808897]" />
        </button>
      </div>

      {/* 5. Heartboard Grid / Trophy Case */}
      {activeSubTab === 'hearts' ? (
        displayHeartCategories.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-12 text-center border border-gray-100 flex flex-col items-center justify-center my-6">
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-3 text-[#FE6349]">
              <Search className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="text-lg font-bold text-[#1A1B25]">
              {searchQuery.trim()
                ? `No ${heartFilter === 'received' ? 'received' : 'sent'} hearts found matching "${searchQuery}"`
                : `No ${heartFilter === 'received' ? 'received' : 'sent'} hearts yet`}
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm">
              {searchQuery.trim()
                ? `No ${heartFilter === 'received' ? 'received' : 'sent'} hearts match "${searchQuery}". Try searching for a category like "Loving" or a username.`
                : `Heart tokens ${heartFilter === 'received' ? 'blown to you by other users' : 'you have blown to other users'} will appear here.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-6 w-full">
            {displayHeartCategories.map((cat) => (
              <HeartCategoryCard
                key={cat.id}
                data={cat}
                onShare={(catData) => {
                  setSelectedCategoryModal(catData);
                  setShareModalData({
                    type: 'board',
                    boardTitle: `${catData.categoryName} Hearts`,
                    boardTheme: catData.bubbleColor,
                    url: `${window.location.origin}/?hearts=${encodeURIComponent(catData.id)}`
                  });
                  setIsShareModalOpen(true);
                }}
                onClick={(catData) => {
                  setSelectedCategoryModal(catData);
                }}
              />
            ))}
          </div>
        )
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-12 text-center border border-gray-100 flex flex-col items-center justify-center my-6">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-3 text-[#FE6349]">
            {searchQuery.trim() ? <Search className="w-6 h-6 stroke-[2]" /> : <Sparkles className="w-6 h-6" />}
          </div>
          <h3 className="text-lg font-bold text-[#1A1B25]">
            {searchQuery.trim() 
              ? `No ${
                  activeSubTab === 'board'
                    ? 'created boards'
                    : activeSubTab === 'tagged'
                    ? 'tagged boards'
                    : 'collaborated boards'
                } found matching "${searchQuery}"`
              : activeSubTab === 'board'
                ? 'No boards created yet'
                : activeSubTab === 'tagged'
                ? 'No tagged boards yet'
                : 'No collaborative boards yet'}
          </h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm">
            {searchQuery.trim()
              ? `No boards matched "${searchQuery}". Try searching by caption, recipient name, or creator name.`
              : activeSubTab === 'board'
                ? "Messages and boards you create will appear here under your Board section."
                : activeSubTab === 'tagged'
                ? "Boards where you were tagged as a recipient will appear here."
                : "Boards where you contributed tributes or messages will appear here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 sm:gap-6 w-full">
          {filteredItems.map((item) => (
            <HeartboardCard 
              key={item.id} 
              item={item} 
              onClick={() => onPostClick && onPostClick(item)} 
            />
          ))}
        </div>
      )}

      {/* Heart Category Detail Side Drawer */}
      <AnimatePresence>
        {selectedCategoryModal && activeCategoryModal && (
          <React.Fragment key="heart-category-drawer">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                setSelectedCategoryModal(null);
                setDrawerSearchQuery('');
              }}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-xs"
            />

            {/* Side Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm sm:max-w-md bg-white z-50 flex flex-col overflow-hidden font-sans shadow-2xl"
            >
              {/* Top Header Area */}
              <div className="p-6 sm:p-8 bg-white border-b border-gray-100/80 flex flex-col gap-6 relative">
                {/* Back Arrow Button */}
                <button
                  onClick={() => {
                    setSelectedCategoryModal(null);
                    setDrawerSearchQuery('');
                  }}
                  className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-[#1A1B25] transition-all cursor-pointer self-start -ml-2"
                  aria-label="Back"
                >
                  <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
                </button>

                {/* Main Hero Header: Circular Heart Avatar + Category Details */}
                <div className="flex items-center gap-5 sm:gap-6">
                  {/* Soft Colored Circular Avatar with Heart Bubble */}
                  <div
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center shrink-0 relative transition-transform duration-300 shadow-xs"
                    style={{ backgroundColor: activeCategoryModal.bgHalo || '#FDF2F8' }}
                  >
                    <HeartBubbleSVG
                      size={72}
                      bubbleColor={activeCategoryModal.bubbleColor || '#FE6349'}
                    />
                  </div>

                  {/* Title & Stats */}
                  <div className="flex flex-col items-start gap-1">
                    <h2 className="text-lg sm:text-xl font-bold text-[#1A1B25] tracking-tight">
                      {activeCategoryModal.categoryName || 'Heart'} Heart
                    </h2>
                    <p className="text-xs sm:text-sm text-[#808897] font-medium leading-snug">
                      {heartFilter === 'received'
                        ? (activeCategoryModal.items?.length || activeCategoryModal.count || 0) === 1
                          ? '1 person sent you this heart'
                          : `${activeCategoryModal.items?.length || activeCategoryModal.count || 0} people sent you this heart`
                        : (activeCategoryModal.items?.length || activeCategoryModal.count || 0) === 1
                          ? 'You sent this heart to 1 person'
                          : `You sent this heart to ${activeCategoryModal.items?.length || activeCategoryModal.count || 0} people`}
                    </p>

                    {/* Share Button Pill */}
                    <button
                      onClick={() => {
                        setShareModalData({
                          type: 'board',
                          boardTitle: `${activeCategoryModal.categoryName} Hearts`,
                          boardTheme: activeCategoryModal.bubbleColor,
                          url: `${window.location.origin}/?hearts=${encodeURIComponent(activeCategoryModal.id)}`
                        });
                        setIsShareModalOpen(true);
                      }}
                      className="mt-2.5 px-4 py-1.5 rounded-full border border-gray-200 text-[#353849] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer bg-white shadow-2xs"
                    >
                      <Share2 className="w-3.5 h-3.5 stroke-[1.8] text-[#353849]" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Body Section (Filled with #ffffff background) */}
              <div className="flex-1 bg-white flex flex-col overflow-hidden relative">
                {/* Search Bar Input */}
                <div className="p-5 pb-3">
                  <div className="relative w-full">
                    <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={heartFilter === 'received' ? "Search by sender username" : "Search by recipient username"}
                      value={drawerSearchQuery}
                      onChange={(e) => setDrawerSearchQuery(e.target.value)}
                      className="w-full bg-[#F6F8FA] focus:bg-gray-50 border border-gray-100 rounded-full pl-10 pr-4 py-3 text-xs font-medium text-[#1A1B25] placeholder-gray-400 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Scrollable Floating Hearts Canvas */}
                <div className="flex-1 overflow-y-auto px-5 py-3">
                  {(() => {
                    const categoryItems = activeCategoryModal.items || [];
                    const isSearching = drawerSearchQuery.trim().length > 0;
                    const filteredList = categoryItems.filter((s: any) =>
                      s.name.toLowerCase().includes(drawerSearchQuery.trim().toLowerCase()) ||
                      (s.handle && s.handle.toLowerCase().includes(drawerSearchQuery.trim().toLowerCase())) ||
                      (s.content && s.content.toLowerCase().includes(drawerSearchQuery.trim().toLowerCase()))
                    );

                    if (isSearching && filteredList.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center my-auto h-full">
                          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-[#FE6349] mb-3 shrink-0">
                            <Search className="w-5 h-5 stroke-[2]" />
                          </div>
                          <h4 className="text-sm font-bold text-[#1A1B25]">
                            {heartFilter === 'received' ? 'No hearts found from this sender' : 'No hearts found for this recipient'}
                          </h4>
                          <p className="text-xs text-[#808897] mt-1 max-w-xs leading-relaxed">
                            No {heartFilter === 'received' ? 'received' : 'sent'} hearts matching "{drawerSearchQuery}" were found in the {activeCategoryModal.categoryName || 'Heart'} category.
                          </p>
                        </div>
                      );
                    }

                    if (isSearching && filteredList.length > 0) {
                      return (
                        <div className="flex flex-col gap-3 py-2">
                          <p className="text-[11px] font-bold text-[#808897] uppercase tracking-wider px-1">
                            {filteredList.length} {filteredList.length === 1 ? 'heart' : 'hearts'} {heartFilter === 'received' ? 'from' : 'sent to'} "{drawerSearchQuery}"
                          </p>
                          {filteredList.map((item: any, idx: number) => (
                            <motion.div
                              key={`${item.id || item.name}-${idx}`}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.15, delay: idx * 0.03 }}
                              className="p-3.5 rounded-2xl bg-[#F6F8FA] border border-gray-100/80 flex items-center gap-3.5 shadow-2xs hover:border-purple-200 transition-all cursor-pointer"
                            >
                              <div
                                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-2xs"
                                style={{ backgroundColor: activeCategoryModal.bgHalo || '#FDF2F8' }}
                              >
                                <HeartBubbleSVG size={30} bubbleColor={activeCategoryModal.bubbleColor || '#FE6349'} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={item.avatar}
                                    alt={item.name}
                                    className="w-5 h-5 rounded-full object-cover border border-gray-200 shrink-0"
                                  />
                                  <h5 className="text-xs font-bold text-[#1A1B25] truncate">{item.name}</h5>
                                </div>
                                <p className="text-[11px] text-[#808897] mt-0.5 font-medium truncate">
                                  "{item.content}" • {item.date}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      );
                    }

                    if (categoryItems.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center my-auto h-full">
                          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-[#FE6349] mb-3 shrink-0">
                            <Search className="w-5 h-5 stroke-[2]" />
                          </div>
                          <h4 className="text-sm font-bold text-[#1A1B25]">No hearts yet</h4>
                          <p className="text-xs text-[#808897] mt-1 max-w-xs leading-relaxed">
                            No hearts have been {heartFilter === 'received' ? 'received' : 'sent'} in this category yet.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="relative pt-10 pb-6 flex flex-wrap items-center justify-center gap-4 sm:gap-5 w-full max-w-xs mx-auto">
                        {/* Background scattered dots */}
                        <div className="absolute top-2 left-6 w-2 h-2 rounded-full opacity-50" style={{ backgroundColor: activeCategoryModal.bubbleColor || '#FE6349' }} />
                        <div className="absolute top-10 left-2 w-3 h-3 rounded-full opacity-30" style={{ backgroundColor: activeCategoryModal.bubbleColor || '#FE6349' }} />
                        <div className="absolute top-8 right-8 w-2.5 h-2.5 rounded-full opacity-70" style={{ backgroundColor: activeCategoryModal.bubbleColor || '#FE6349' }} />
                        <div className="absolute top-1/3 right-3 w-2 h-2 rounded-full opacity-60" style={{ backgroundColor: activeCategoryModal.bubbleColor || '#FE6349' }} />
                        <div className="absolute bottom-1/3 left-4 w-3 h-3 rounded-full opacity-40" style={{ backgroundColor: activeCategoryModal.bubbleColor || '#FE6349' }} />

                        {categoryItems.map((personItem: any, index: number) => {
                          const itemKey = `person-${personItem.id || index}`;
                          const isTooltipOpen = activeTooltipIndex === itemKey;

                          return (
                            <div key={itemKey} className="relative">
                              {/* Tooltip Card */}
                              <AnimatePresence>
                                {isTooltipOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 6, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto min-w-[160px]"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="bg-white rounded-2xl px-4 py-3 shadow-xl border border-gray-100/90 flex flex-col items-center relative">
                                      {/* Top: Avatar + Name */}
                                      <div className="flex items-center gap-2">
                                        <img
                                          src={personItem.avatar}
                                          alt={personItem.name}
                                          className="w-6 h-6 rounded-full object-cover border border-gray-100 shrink-0"
                                        />
                                        <span className="text-xs font-bold text-[#1A1B25] tracking-tight">
                                          {personItem.name}
                                        </span>
                                      </div>

                                      {/* Dotted Line Divider */}
                                      <div className="w-full border-b border-dashed border-gray-200/90 my-2" />

                                      {/* Content Note */}
                                      <span className="text-[11px] text-[#808897] font-medium text-center line-clamp-2 max-w-[180px]">
                                        "{personItem.content}"
                                      </span>

                                      {/* Date */}
                                      <span className="text-[10px] text-[#A4ABB8] font-semibold mt-1">
                                        {personItem.date}
                                      </span>

                                      {/* Bottom Pointer Tail Arrow */}
                                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-gray-100/90 rotate-45" />
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Heart Bubble Button */}
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.04 }}
                                onClick={() => setActiveTooltipIndex(isTooltipOpen ? null : itemKey)}
                                className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center relative transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-2xs ${
                                  isTooltipOpen ? 'scale-105 ring-2 ring-offset-2 ring-purple-300/80' : ''
                                }`}
                                style={{ backgroundColor: activeCategoryModal.bgHalo || '#FDF2F8' }}
                              >
                                <HeartBubbleSVG size={40} bubbleColor={activeCategoryModal.bubbleColor || '#FE6349'} />
                              </motion.div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>

      {/* Side Drawer Panel for Settings */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsSettingsOpen(false)}
              className="fixed inset-0 bg-black/40 z-50 backdrop-blur-xs"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 240 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm sm:max-w-md bg-white z-50 flex flex-col overflow-hidden font-sans"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-6 bg-white sticky top-0 z-10">
                <div>
                  <h2 className="text-xl font-bold text-[#1A1B25]">Settings</h2>
                  <p className="text-xs text-[#A4ABB8] font-medium mt-0.5">Preferences & Account Controls</p>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-[#353849] transition-all cursor-pointer"
                  aria-label="Close settings"
                >
                  <X className="w-4 h-4 stroke-[2]" />
                </button>
              </div>

              {/* Drawer Content Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Profile Quick Overview & Editing */}
                <div className="bg-gray-25 p-4 rounded-2xl transition-all">
                  {!isEditingProfile ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative group">
                          <div className="w-12 h-12 rounded-full bg-[#FDF4F2] flex items-center justify-center overflow-hidden shrink-0">
                            {profileImage ? (
                              <img src={profileImage} alt={userName} className="w-full h-full object-cover" />
                            ) : (
                              <svg className="w-8 h-8 text-[#FFB5A9] fill-current transform translate-y-1" viewBox="0 0 24 24">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                              </svg>
                            )}
                          </div>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            title="Upload profile picture"
                            className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#1A1B25]">{userName}</h3>
                          <p className="text-xs text-[#A4ABB8] font-medium">{userHandle}</p>
                        </div>
                      </div>
                      <button 
                        onClick={handleStartEdit}
                        className="px-3.5 py-1.5 rounded-full bg-white text-xs font-semibold text-[#1A1B25] hover:bg-gray-50 transition-all cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-xs font-bold text-[#1A1B25]">Edit Profile Details</span>
                      </div>

                      {/* Profile Picture Option */}
                      <div className="flex items-center gap-3.5 py-1">
                        <div className="w-14 h-14 rounded-full bg-[#FDF4F2] flex items-center justify-center overflow-hidden shrink-0 relative">
                          {tempProfileImage ? (
                            <img src={tempProfileImage} alt="Profile preview" className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-9 h-9 text-[#FFB5A9] fill-current transform translate-y-1" viewBox="0 0 24 24">
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                          )}
                        </div>

                        <div className="flex flex-col gap-1.5 flex-1">
                          <span className="text-[11px] font-semibold text-[#666D80]">Profile Picture</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-3 py-1.5 rounded-full bg-white text-xs font-semibold text-[#1A1B25] hover:bg-gray-50 transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <Camera className="w-3.5 h-3.5 text-[#666D80]" />
                              <span>Upload Photo</span>
                            </button>
                            {tempProfileImage && (
                              <button
                                type="button"
                                onClick={() => setTempProfileImage(null)}
                                className="px-2.5 py-1.5 rounded-full bg-gray-100 text-xs font-medium text-[#666D80] hover:bg-gray-200 transition-all cursor-pointer"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Preset Avatars */}
                      <div>
                        <span className="text-[10px] font-semibold text-[#808897] block mb-1.5">Or choose a preset avatar:</span>
                        <div className="flex items-center gap-2">
                          {PRESET_AVATARS.map((url, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setTempProfileImage(url)}
                              className={`w-8 h-8 rounded-full overflow-hidden transition-all cursor-pointer ${
                                tempProfileImage === url ? 'scale-105 opacity-100' : 'opacity-60 hover:opacity-100'
                              }`}
                            >
                              <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-[#666D80] mb-1 block">Name & Handle</label>
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          className="w-full bg-gray-25 border-none outline-none rounded-xl px-3 py-2 text-xs font-medium text-[#1A1B25]"
                          placeholder="Name / Handle (e.g. Micky Mouse)"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-[#666D80] mb-1 block">Email</label>
                        <input
                          type="email"
                          value={tempEmail}
                          onChange={(e) => setTempEmail(e.target.value)}
                          className="w-full bg-gray-25 border-none outline-none rounded-xl px-3 py-2 text-xs font-medium text-[#1A1B25]"
                          placeholder="Email address"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => setIsEditingProfile(false)}
                          className="px-3 py-1.5 rounded-full bg-gray-25 text-xs font-medium text-[#666D80] hover:bg-gray-50 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          className="px-4 py-1.5 rounded-full bg-[#1A1B25] text-white text-xs font-semibold hover:bg-black cursor-pointer"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {/* Section: Notifications */}
                <div>
                  <h4 className="text-xs font-bold text-[#808897] uppercase tracking-wider mb-3">Notifications</h4>
                  <div className="bg-gray-25 rounded-2xl overflow-hidden divide-y divide-gray-100">
                    <div 
                      onClick={() => {
                        const nextVal = !heartTokenAlerts;
                        setHeartTokenAlerts(nextVal);
                        showToast(`Heart Token Alerts ${nextVal ? 'enabled' : 'disabled'}`);
                      }}
                      className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Bell className="w-4 h-4 text-[#666D80]" />
                        <div>
                          <p className="text-xs font-bold text-[#1A1B25]">Heart Token Alerts</p>
                          <p className="text-[11px] text-[#A4ABB8] font-medium">Notify when someone blows a heart</p>
                        </div>
                      </div>
                      <div className={`w-8 h-4 rounded-full p-0.5 flex items-center transition-all ${heartTokenAlerts ? 'bg-[#4CB993] justify-end' : 'bg-gray-300 justify-start'}`}>
                        <div className="w-3 h-3 rounded-full bg-white shadow-xs" />
                      </div>
                    </div>

                    <div 
                      onClick={() => {
                        const nextVal = !trophyCaseUpdates;
                        setTrophyCaseUpdates(nextVal);
                        showToast(`Trophy Case Updates ${nextVal ? 'enabled' : 'disabled'}`);
                      }}
                      className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Award className="w-4 h-4 text-[#666D80]" />
                        <div>
                          <p className="text-xs font-bold text-[#1A1B25]">Trophy Case Updates</p>
                          <p className="text-[11px] text-[#A4ABB8] font-medium">New badges and vouch tokens</p>
                        </div>
                      </div>
                      <div className={`w-8 h-4 rounded-full p-0.5 flex items-center transition-all ${trophyCaseUpdates ? 'bg-[#4CB993] justify-end' : 'bg-gray-300 justify-start'}`}>
                        <div className="w-3 h-3 rounded-full bg-white shadow-xs" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Digital Reputation & Claiming */}
                <div>
                  <h4 className="text-xs font-bold text-[#808897] uppercase tracking-wider mb-3">Reputation & Claims</h4>
                  <div className="bg-gray-25 rounded-2xl overflow-hidden divide-y divide-gray-100">
                    <div 
                      onClick={() => setShowTagManager(!showTagManager)}
                      className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-[#666D80]" />
                        <div>
                          <p className="text-xs font-bold text-[#1A1B25]">Verified Heart Tags</p>
                          <p className="text-[11px] text-[#A4ABB8] font-medium">Claim public hashtag walls</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-white text-[#1A1B25] rounded-full border border-gray-100">
                          {activeHeartTags.length} Active
                        </span>
                        <ChevronRight className={`w-4 h-4 text-[#A4ABB8] transition-transform ${showTagManager ? 'rotate-90' : ''}`} />
                      </div>
                    </div>

                    {showTagManager && (
                      <div className="p-4 bg-gray-25 space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                            placeholder="e.g. #loveRonaldo"
                            className="flex-1 bg-gray-25 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-medium text-[#1A1B25] outline-none focus:border-[#1A1B25]"
                          />
                          <button
                            onClick={handleAddTag}
                            className="px-3 py-1.5 rounded-xl bg-[#1A1B25] text-white text-xs font-semibold hover:bg-black transition-all cursor-pointer"
                          >
                            Claim
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {activeHeartTags.map((tag) => (
                            <span 
                              key={tag}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-25 text-[#1A1B25] rounded-full text-xs font-medium border border-gray-200/80"
                            >
                              <span>{tag}</span>
                              <button
                                onClick={() => handleRemoveTag(tag)}
                                className="text-[#A4ABB8] hover:text-red-500 cursor-pointer"
                                aria-label={`Remove ${tag}`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Logout Button */}
                <button 
                  onClick={() => {
                    showToast('Signed out of Heartboard session');
                    setIsSettingsOpen(false);
                    if (onSignOut) {
                      onSignOut();
                    }
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-gray-25 hover:bg-red-50 text-red-600 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4 stroke-[2]" />
                  <span>Sign Out</span>
                </button>
              </div>

              {/* Toast Notification Pill */}
              <AnimatePresence>
                {toastMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-6 left-6 right-6 bg-[#1A1B25] text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-lg text-center z-50 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{toastMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Share Profile / Board Overlay Modal (Context-Aware) */}
      <ShareProfileModal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setShareModalData(null);
        }}
        shareData={shareModalData || {
          type: 'profile',
          userHandle: userHandle,
          userName: userName,
          profileImage: profileImage,
          url: `${window.location.origin}/#${userHandle.replace('@', '')}`
        }}
        onShowToast={showToast}
      />
    </div>
  );
};
