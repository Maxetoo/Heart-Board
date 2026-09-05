
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { EntityType, Post, PostVisibility, RegisteredUser, Contribution } from './types';
import { useAuth } from './contexts/AuthContext';
import { useSearch } from './hooks/useSearch';
import { useDiscoverFeed } from './hooks/useBoards';
import { useBoardMessages } from './hooks/useBoardMessages';
import { getGlobalStats } from './services/stats.api';
import * as boardApi from './services/board.api';
import * as messageApi from './services/message.api';
import { toApiError } from './lib/api';
import { usernameOf, userFromHandle } from './lib/adapters';
import { PostCard } from './components/PostCard';
import { MediaModal } from './components/MediaModal';
import { CreateAppreciationModal } from './components/CreateAppreciationModal';
import { FilterModal, FILTER_OPTIONS } from './components/FilterModal';
import { HeartboardView } from './components/HeartboardView';
import { HashtagView } from './components/HashtagView';
import { AuthView } from './components/AuthModal';
import { WelcomeModal } from './components/WelcomeModal';
import { EngagementPromptModal } from './components/EngagementPromptModal';
import { useEngagementPrompt } from './hooks/useEngagementPrompt';
import { HeroHeartAnimation } from './components/HeroHeartAnimation';
import { EmailVerificationBanner } from './components/EmailVerificationBanner';
import { 
  SlidersHorizontal, 
  Search, 
  Sparkles, 
  Flame, 
  EyeOff, 
  Award, 
  Check, 
  Lock, 
  Heart,
  Home,
  Plus,
  User,
  X,
  ArrowLeft,
  ChevronLeft,
  TrendingUp,
  Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function canViewPostPublicly(post: any) {
  if (!post.visibility || post.visibility === PostVisibility.PUBLIC || post.visibility === PostVisibility.ANONYMOUS) {
    return true;
  }
  if (post.visibility === PostVisibility.PRIVATE) {
    if (post.isCreatedByUser) return true;
    if (Array.isArray(post.recipients) && post.recipients.some((r: string) => r === '@you' || r.toLowerCase().includes('you'))) {
      return true;
    }
    return false;
  }
  return true;
}


interface TopNavigationProps {
  onFilterClick: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  posts: any[];
  onSelectBoard: (post: any) => void;
  onSelectUser?: (user: RegisteredUser) => void;
  onSelectHashtag?: (hashtag: string) => void;
  currentUser?: RegisteredUser | null;
  onOpenAuth?: (mode?: 'login' | 'signup', prompt?: string) => void;
  onGoToProfile?: () => void;
}

const TopNavigation: React.FC<TopNavigationProps> = ({ 
  onFilterClick, 
  searchQuery, 
  setSearchQuery, 
  posts, 
  onSelectBoard,
  onSelectUser,
  onSelectHashtag,
  currentUser,
  onOpenAuth,
  onGoToProfile
}) => {
  const [isFullPageOpen, setIsFullPageOpen] = useState(false);
  const [activeSearchTab, setActiveSearchTab] = useState<'all' | 'users' | 'boards' | 'hashtags'>('all');
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Close full page search on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullPageOpen) {
        setIsFullPageOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullPageOpen]);

  const query = searchQuery.trim().toLowerCase();

  // Real platform search — GET /api/v1/search, debounced.
  // This replaces filtering a hard-coded list of fabricated celebrity accounts,
  // which showed users that do not exist in the database.
  const searchResults = useSearch(searchQuery, currentUser?.id);

  const matchingUsers = searchResults.users;

  // Boards come from the server when searching; otherwise show the loaded feed.
  const matchingBoards = searchResults.active
    ? searchResults.boards
    : posts.filter(canViewPostPublicly);

  const popularHashtags = searchResults.hashtags.map((h) => ({
    tag: h.tag.startsWith('#') ? h.tag : `#${h.tag}`,
    count: `${h.count} ${h.count === 1 ? 'board' : 'boards'}`,
    category: 'Hashtag',
  }));

  const hasSearchInput = searchQuery.trim().length > 0;

  return (
    <>
      <header className="bg-white py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-[50]">
        {/* Brand logo - left */}
        <div 
          onClick={() => {
            setSearchQuery('');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-3 shrink-0 cursor-pointer"
        >
          <div className="w-10 h-10 shrink-0 aspect-square rounded-full bg-[#FE6349] flex items-center justify-center relative transform hover:rotate-6 transition-all">
            <svg className="w-6 h-6 text-white fill-current" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <div className="absolute top-[40%] left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="flex gap-1">
                <span className="w-1 h-1 rounded-full bg-white inline-block"></span>
                <span className="w-1 h-1 rounded-full bg-white inline-block"></span>
              </div>
            </div>
          </div>
          <span className="font-extrabold text-lg text-gray-900 tracking-tight hidden sm:block">Heartboard</span>
        </div>

        {/* Search - center (Target selector: header > div:nth-of-type(2) > input:nth-of-type(1)) */}
        <div className="flex-grow w-full mx-4 relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none z-10">
            <Search size={18} strokeWidth={2.2} />
          </div>
          
          <input 
            type="text" 
            value={searchQuery}
            onClick={() => setIsFullPageOpen(true)}
            onFocus={() => setIsFullPageOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsFullPageOpen(true);
            }}
            placeholder="Search user accounts (@mercy, @ronaldo), created boards..."
            className="w-full bg-gray-25 border-none rounded-full py-2.5 pl-12 pr-10 text-sm text-gray-800 placeholder:text-gray-400 focus:bg-gray-50 active:bg-gray-50 focus:outline-none transition-all duration-200 cursor-pointer"
          />

          {hasSearchInput && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSearchQuery('');
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-all cursor-pointer"
              aria-label="Clear search"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Header Right Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Sliders config */}
          <button 
            onClick={onFilterClick}
            aria-label="Open filters"
            className="w-10 h-10 shrink-0 aspect-square rounded-full bg-gray-25 flex items-center justify-center text-[#808897] hover:text-gray-800 transition-all cursor-pointer hover:bg-gray-100"
          >
            <SlidersHorizontal size={18} strokeWidth={2.5} className="text-[#808897]" />
          </button>

          {/* User Profile or Sign In button */}
          {currentUser ? (
            <button
              onClick={onGoToProfile}
              className="w-10 h-10 shrink-0 aspect-square rounded-full bg-gray-25 hover:bg-gray-100 flex items-center justify-center transition-all cursor-pointer overflow-hidden"
              title={`${currentUser.name} (${currentUser.handle})`}
              aria-label="User Profile"
            >
              {currentUser.avatar ? (
                <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                <User size={18} strokeWidth={2.2} className="text-gray-500 hover:text-gray-800" />
              )}
            </button>
          ) : (
            <button
              onClick={() => onOpenAuth && onOpenAuth('login', 'Sign in to access your Heartboard, blow hearts, and post tributes.')}
              className="w-10 h-10 shrink-0 aspect-square rounded-full bg-gray-25 hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-all cursor-pointer flex items-center justify-center"
              title="Sign In"
              aria-label="Sign In"
            >
              <User size={18} strokeWidth={2.2} />
            </button>
          )}
        </div>
      </header>

      {/* Full Page Expanded Search Overlay */}
      <AnimatePresence>
        {isFullPageOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed inset-0 z-[200] bg-white text-gray-900 flex flex-col h-screen w-screen overflow-hidden font-sans select-none"
          >
            {/* Full-Page Search Header */}
            <div className="bg-white px-4 sm:px-8 md:px-12 pt-5 pb-3 shrink-0">
              <div className="max-w-[1400px] mx-auto flex flex-col gap-4">
                {/* Search Bar Input Container */}
                <div className="flex items-center gap-3 w-full">
                  <div className="relative flex-grow">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none z-10">
                      <Search size={18} strokeWidth={2.2} />
                    </div>

                    <input
                      ref={inputRef}
                      type="text"
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search anything here...."
                      className="w-full bg-[#F8F9FB] hover:bg-[#F6F8FA] focus:bg-[#F8F9FB] border-none rounded-full py-3.5 pl-12 pr-12 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all"
                    />

                    {hasSearchInput && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 bg-gray-200/80 hover:bg-gray-300 rounded-full p-1.5 transition-all cursor-pointer"
                        aria-label="Clear text"
                      >
                        <X size={14} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>

                  {/* Close / Dismiss Search Button */}
                  <button
                    onClick={() => setIsFullPageOpen(false)}
                    className="w-10 h-10 shrink-0 aspect-square rounded-full bg-[#F8F9FB] hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-all cursor-pointer flex items-center justify-center"
                    title="Close Search (ESC)"
                    aria-label="Close Search"
                  >
                    <X size={18} strokeWidth={2.2} />
                  </button>
                </div>

                {/* Filter Pills (All result, User, Boards, Hashtag) */}
                <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
                  <button
                    onClick={() => setActiveSearchTab('all')}
                    className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                      activeSearchTab === 'all'
                        ? 'bg-[#1A1B25] text-white shadow-xs'
                        : 'bg-[#F8F9FB] text-[#A4ABB8] hover:text-[#666D80] hover:bg-[#ECEFF3]'
                    }`}
                  >
                    All result
                  </button>

                  <button
                    onClick={() => setActiveSearchTab('users')}
                    className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                      activeSearchTab === 'users'
                        ? 'bg-[#1A1B25] text-white shadow-xs'
                        : 'bg-[#F8F9FB] text-[#A4ABB8] hover:text-[#666D80] hover:bg-[#ECEFF3]'
                    }`}
                  >
                    User
                  </button>

                  <button
                    onClick={() => setActiveSearchTab('boards')}
                    className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                      activeSearchTab === 'boards'
                        ? 'bg-[#1A1B25] text-white shadow-xs'
                        : 'bg-[#F8F9FB] text-[#A4ABB8] hover:text-[#666D80] hover:bg-[#ECEFF3]'
                    }`}
                  >
                    Boards
                  </button>

                  <button
                    onClick={() => setActiveSearchTab('hashtags')}
                    className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                      activeSearchTab === 'hashtags'
                        ? 'bg-[#1A1B25] text-white shadow-xs'
                        : 'bg-[#F8F9FB] text-[#A4ABB8] hover:text-[#666D80] hover:bg-[#ECEFF3]'
                    }`}
                  >
                    Hashtag
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Search Results Area */}
            <div className="flex-grow overflow-y-auto px-4 sm:px-8 md:px-12 py-6 bg-white">
              <div className="max-w-[1400px] mx-auto space-y-10 pb-16">

                {/* 1. User Accounts Section */}
                {(activeSearchTab === 'all' || activeSearchTab === 'users') && matchingUsers.length > 0 && (
                  <section className="space-y-3">
                    <h2 className="text-xs sm:text-sm font-semibold text-gray-400 tracking-normal">
                      {activeSearchTab === 'all' ? 'Recent users' : 'Registered users'}
                    </h2>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                      {matchingUsers.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => {
                            setIsFullPageOpen(false);
                            if (onSelectUser) {
                              onSelectUser(user);
                            } else {
                              setSearchQuery(user.handle);
                            }
                          }}
                          className="bg-white rounded-[28px] p-6 border border-gray-100 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col items-center justify-center text-center group aspect-[4/5] sm:aspect-square"
                        >
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden flex items-center justify-center shrink-0 mb-3 bg-[#FFEBE8]">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#FFEBE8] flex items-center justify-center text-[#FE6349]/70">
                                <svg className="w-12 h-12 fill-current opacity-80" viewBox="0 0 24 24">
                                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                              </div>
                            )}
                          </div>

                          <span className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-[#FE6349] transition-colors truncate max-w-full px-1">
                            @{user.handle.replace(/^@/, '')}
                          </span>
                          <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1">
                            {user.boardsCount || 0} BOARD CREATED
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 2. Created Boards Section */}
                {(activeSearchTab === 'all' || activeSearchTab === 'boards') && matchingBoards.length > 0 && (
                  <section className="space-y-3">
                    <h2 className="text-xs sm:text-sm font-semibold text-gray-400 tracking-normal">
                      {activeSearchTab === 'all' ? 'Hot Boards' : 'Registered users'}
                    </h2>

                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-6">
                      {matchingBoards.map((post) => (
                        <div key={post.id} className="w-full">
                          <PostCard
                            post={post}
                            onClick={() => {
                              onSelectBoard(post);
                              setIsFullPageOpen(false);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 3. Popular Hashtags Section */}
                {(activeSearchTab === 'all' || activeSearchTab === 'hashtags') && popularHashtags.length > 0 && (
                  <section className="space-y-3">
                    <h2 className="text-xs sm:text-sm font-semibold text-gray-400 tracking-normal">
                      {activeSearchTab === 'all' ? 'Hashtag' : 'Popular Global Hashtag Tags'}
                    </h2>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                      {popularHashtags.map((h) => (
                        <div
                          key={h.tag}
                          onClick={() => {
                            setIsFullPageOpen(false);
                            if (onSelectHashtag) {
                              onSelectHashtag(h.tag);
                            } else {
                              setSearchQuery(h.tag);
                              setActiveSearchTab('all');
                            }
                          }}
                          className="bg-white rounded-[28px] p-6 border border-gray-100 shadow-2xs hover:shadow-md hover:border-rose-200 transition-all cursor-pointer flex flex-col items-center justify-center text-center group aspect-[4/5] sm:aspect-square"
                        >
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#FFEBE8] flex items-center justify-center shrink-0 mb-3 group-hover:scale-105 transition-transform">
                            <span className="text-3xl sm:text-4xl font-extrabold text-[#FE6349]">#</span>
                          </div>

                          <span className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-[#FE6349] transition-colors truncate max-w-full px-1">
                            #{h.tag.replace(/^#/, '')}
                          </span>
                          <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1">
                            {h.count ? h.count.toUpperCase() : '10.6M'} MESSAGE
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Empty State */}
                {matchingUsers.length === 0 && matchingBoards.length === 0 && popularHashtags.length === 0 && (
                  <div className="py-20 text-center flex flex-col items-center justify-center bg-[#F8F9FB] rounded-3xl p-8">
                    <div className="w-16 h-16 rounded-full bg-rose-50 text-[#FE6349] flex items-center justify-center mb-4">
                      <Search size={28} strokeWidth={2} />
                    </div>
                    <h3 className="text-base font-extrabold text-gray-900">
                      No results found
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm leading-relaxed">
                      {hasSearchInput 
                        ? `We couldn't find any results for "${searchQuery}".`
                        : "Start typing to search users, boards, or hashtags."
                      }
                    </p>
                    {hasSearchInput && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="mt-5 px-5 py-2.5 rounded-full bg-[#1A1B25] text-white text-xs font-extrabold hover:bg-black transition-all cursor-pointer"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                )}

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

interface HeroPulseFeedProps {
  posts?: any[];
  onGiftVouchClick: () => void;
}

const HeroPulseFeed: React.FC<HeroPulseFeedProps> = ({ posts = [], onGiftVouchClick }) => {
  const [activeMessageIndex, setActiveMessageIndex] = useState(0);

  const defaultMockActivities = useMemo(() => [
    { sender: "Mercy24", heartType: "Loving Heart 💖", receiver: "Matthew", color: "text-[#FE6349]", hexColor: "#FE6349" },
    { sender: "Amino", heartType: "Reliable Heart 🧡", receiver: "Cristiano", color: "text-[#FF8A65]", hexColor: "#FF8A65" },
    { sender: "Sarah", heartType: "Hard Work Heart 💚", receiver: "Alex", color: "text-[#4CD964]", hexColor: "#4CD964" },
    { sender: "Seyi", heartType: "Workspace Legend 💜", receiver: "Ronike", color: "text-[#7B62FF]", hexColor: "#7B62FF" },
    { sender: "Tyler", heartType: "Visionary Heart 💖", receiver: "James", color: "text-[#FF53C0]", hexColor: "#FF53C0" },
    { sender: "Sophia", heartType: "Golden Status 💙", receiver: "Emma", color: "text-[#007A78]", hexColor: "#007A78" },
  ], []);

  // Derive live activities from user posts & blown hearts dynamically
  const userHeartActivities = useMemo(() => {
    const list: any[] = [];
    posts.forEach((p) => {
      if (p.isHeartToken || p.type === 'heart_token' || p.heartDetails) {
        const hex = p.heartDetails?.bubbleColor || '#FE6349';
        const label = p.heartDetails?.label || 'Loving';
        const emoji = p.heartDetails?.emoji || '💖';
        list.push({
          sender: p.authorName || 'Curator',
          heartType: `${label} Heart ${emoji}`,
          receiver: (p.recipientName || p.targetId || 'Recipient').replace(/^@/, ''),
          color: `text-[${hex}]`,
          hexColor: hex,
        });
      } else if (p.isCreatedByUser) {
        let hex = '#FE6349';
        let label = 'Loving';
        let emoji = '💖';
        if (p.category === 'vouch') { hex = '#FFB800'; label = 'Loving'; emoji = '💛'; }
        else if (p.category === 'tears') { hex = '#FF8A65'; label = 'Reliable'; emoji = '🧡'; }
        else if (p.category === 'hype') { hex = '#FF53C0'; label = 'Visionary'; emoji = '💖'; }
        list.push({
          sender: p.authorName || 'You',
          heartType: `${label} Heart ${emoji}`,
          receiver: (p.recipientName || p.targetId || 'Recipient').replace(/^@/, ''),
          color: `text-[${hex}]`,
          hexColor: hex,
        });
      }
    });
    return list;
  }, [posts]);

  const liveActivities = useMemo(() => {
    return [...userHeartActivities, ...defaultMockActivities];
  }, [userHeartActivities, defaultMockActivities]);

  // When a user blows a new heart, reset active index to 0 so hero section updates immediately!
  const lastUserCountRef = useRef(userHeartActivities.length);
  useEffect(() => {
    if (userHeartActivities.length > lastUserCountRef.current) {
      setActiveMessageIndex(0);
    }
    lastUserCountRef.current = userHeartActivities.length;
  }, [userHeartActivities.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveMessageIndex((prev) => (prev + 1) % liveActivities.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [liveActivities.length]);

  const currentActivity = liveActivities[activeMessageIndex] || liveActivities[0];

  return (
    <div className="relative w-full overflow-hidden bg-white py-10 md:py-16 flex flex-col items-center justify-center min-h-[380px] md:min-h-[440px]">
      {/* Dynamic Organic Multi-Layer Hero Heart Animation Canvas */}
      <div className="w-full max-w-4xl h-[260px] md:h-[300px] relative flex items-center justify-center">
        <HeroHeartAnimation
          activeColor={currentActivity.hexColor}
          activeActivityKey={`${activeMessageIndex}-${currentActivity.sender}-${currentActivity.hexColor}`}
          onCentralHeartClick={onGiftVouchClick}
        />
      </div>

      {/* Highly Animated Real-Time Ticker */}
      <div className="mt-4 sm:mt-6 relative min-h-[52px] h-auto w-full max-w-md overflow-hidden flex items-center justify-center px-4 z-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMessageIndex}
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#F8F9FB] border border-[#ECEFF3] shadow-2xs py-3 px-5 rounded-full flex items-center justify-center gap-1.5 text-xs sm:text-sm text-[#1A1B25] max-w-full truncate cursor-pointer hover:bg-[#ECEFF3] transition-colors"
            onClick={onGiftVouchClick}
          >
            <span className="font-extrabold text-[#1A1B25]">{currentActivity.sender}</span>
            <span className="text-[#666D80]">blew a</span>
            <span 
              className="font-extrabold select-none flex items-center gap-0.5" 
              style={{ color: currentActivity.hexColor }}
            >
              {currentActivity.heartType}
            </span>
            <span className="text-[#666D80]">to</span>
            <span className="font-extrabold text-[#1A1B25]">@{currentActivity.receiver}</span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

interface BottomNavProps {
  activeTab: 'home' | 'hearts';
  setActiveTab: (tab: 'home' | 'hearts') => void;
  onPlusClick: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, onPlusClick }) => {
  return (
    <nav 
      id="main-bottom-navbar" 
      className="fixed bottom-0 left-0 right-0 z-[100] w-full bg-white py-3.5 px-6"
    >
      <div className="max-w-xs mx-auto flex items-center justify-center gap-12 sm:gap-16">
        {/* Home Button */}
        <button 
          id="bottom-nav-home"
          onClick={() => {
            setActiveTab('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          aria-label="Home"
          className="p-1.5 text-gray-600 hover:text-gray-900 transition-all duration-200 transform hover:scale-110 active:scale-90"
        >
          <Home className="w-6 h-6" strokeWidth={1.8} />
        </button>

        {/* Plus Button */}
        <button 
          id="bottom-nav-plus"
          onClick={onPlusClick}
          aria-label="Create Appreciation"
          className="p-1.5 text-gray-600 hover:text-gray-900 transition-all duration-200 transform hover:scale-110 active:scale-90"
        >
          <Plus className="w-6 h-6" strokeWidth={1.8} />
        </button>

        {/* Heart Button */}
        <button 
          id="bottom-nav-heart"
          onClick={() => {
            setActiveTab('hearts');
          }}
          aria-label="My Heartboard"
          className="p-1.5 text-gray-600 hover:text-gray-900 transition-all duration-200 transform hover:scale-110 active:scale-90"
        >
          <Heart className="w-6 h-6" strokeWidth={1.8} />
        </button>
      </div>
    </nav>
  );
};

const formatStatNumber = (num: number): string => {
  if (num >= 1000000) {
    const val = (num / 1000000).toFixed(1);
    return (val.endsWith('.0') ? Math.floor(num / 1000000) : val) + 'M';
  }
  if (num >= 1000) {
    const val = (num / 1000).toFixed(1);
    return (val.endsWith('.0') ? Math.floor(num / 1000) : val) + 'k';
  }
  return num.toLocaleString();
};

const MasonryFeed = ({ 
  posts, 
  onPostClick,
  activeFilter,
  setActiveFilter,
  realtimeStats,
  searchQuery,
  setSearchQuery,
  matchingUsersCount
}: { 
  posts: any[], 
  onPostClick: (index: number) => void,
  activeFilter: 'all' | 'tears' | 'vouch' | 'hype',
  setActiveFilter: (filter: 'all' | 'tears' | 'vouch' | 'hype') => void,
  realtimeStats: { totalMessages: number; totalCurators: number; totalReactions: number },
  searchQuery: string,
  setSearchQuery: (query: string) => void,
  matchingUsersCount: number
}) => {
  const TABS: Array<{ id: 'all' | 'vouch' | 'tears' | 'hype'; label: string; emoji: string }> = [
    { id: 'all', label: 'Most Loved Today', emoji: '❤️' },
    { id: 'vouch', label: 'This Moved People', emoji: '🥺' },
    { id: 'tears', label: 'This made people cry', emoji: '😭' },
    { id: 'hype', label: 'Joyful post around world', emoji: '😇' },
  ];

  return (
    <div className="app-container pb-40 px-3 sm:px-6 md:px-12 mt-6 sm:mt-8">
      {/* Tab Navigation Section */}
      <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto pb-3 scrollbar-none mb-8 -mx-2 px-2">
        {TABS.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs md:text-sm font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-[#1A1B25] text-white shadow-2xs'
                  : 'bg-[#F8F9FB] text-[#A4ABB8] hover:text-[#666D80] hover:bg-[#ECEFF3]'
              }`}
            >
              <span className="text-base md:text-lg leading-none">{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search active banner indicator */}
      {searchQuery.trim() && (
        <div className="bg-rose-50/90 border border-rose-100 rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 text-xs text-gray-900">
            <Search className="w-4 h-4 text-[#FE6349] shrink-0" />
            <span>
              Showing results for <strong className="font-extrabold text-[#FE6349]">"{searchQuery}"</strong>
              {' '}(Found {posts.length} board{posts.length !== 1 ? 's' : ''} {matchingUsersCount > 0 ? `& ${matchingUsersCount} user account${matchingUsersCount !== 1 ? 's' : ''}` : ''})
            </span>
          </div>
          <button 
            onClick={() => setSearchQuery('')}
            className="text-xs font-bold text-[#FE6349] hover:text-rose-700 bg-white border border-rose-200/80 px-3 py-1 rounded-full hover:shadow-xs transition-all flex items-center gap-1 cursor-pointer"
          >
            Clear Search ✕
          </button>
        </div>
      )}

      {/* Grid rendering with smooth animations */}
      {posts.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-12 text-center border border-gray-100 shadow-2xs">
          <p className="text-gray-400 font-bold text-lg">No heartfelt notes or boards found.</p>
          {searchQuery.trim() && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-3 px-4 py-2 rounded-full bg-[#FE6349] text-white text-xs font-bold hover:bg-rose-600 transition-all cursor-pointer shadow-2xs"
            >
              Reset Search Filter
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6 lg:gap-8">
          {posts.map((post, index) => (
            <motion.div 
              key={post.id} 
              className="w-full relative"
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Card container */}
              <PostCard post={post} onClick={() => onPostClick(index)} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

interface EventCategoryViewProps {
  filterId: string;
  posts: any[];
  onBack: () => void;
  onFilterClick: () => void;
  onPostClick: (index: number) => void;
  onCreateBoard: (eventType?: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const EventCategoryView: React.FC<EventCategoryViewProps> = ({
  filterId,
  posts,
  onBack,
  onFilterClick,
  onPostClick,
  onCreateBoard,
  searchQuery,
  setSearchQuery,
}) => {
  const currentOption = FILTER_OPTIONS.find(opt => opt.id === filterId) || {
    id: filterId,
    label: filterId.charAt(0).toUpperCase() + filterId.slice(1),
    emoji: '🎉'
  };

  const targetLabel = currentOption.label.toLowerCase();
  const targetId = currentOption.id.toLowerCase();

  const matchedPosts = posts.filter(post => {
    if (!canViewPostPublicly(post)) return false;
    if (post.eventType) {
      const pEv = post.eventType.toLowerCase().replace(/_/g, ' ');
      if (pEv === targetLabel || pEv === targetId) return true;
    }
    const content = (post.content || '').toLowerCase();
    const badge = (post.statusBadge || '').toLowerCase();
    const cat = (post.category || '').toLowerCase();
    const tags = (post.hashtags || []).map((h: string) => h.toLowerCase()).join(' ');

    return (
      content.includes(targetLabel) || 
      content.includes(targetId) ||
      badge.includes(targetLabel) || 
      cat.includes(targetLabel) ||
      tags.includes(targetId)
    );
  });

  const query = searchQuery.trim().toLowerCase();
  const displayPosts = matchedPosts.filter(post => {
    if (!query) return true;
    const author = (post.authorName || post.curatorName || post.creator || '').toLowerCase();
    const recipient = (post.recipientName || post.targetId || '').toLowerCase();
    const recipientsList = Array.isArray(post.recipients) ? post.recipients.join(' ').toLowerCase() : '';
    const hashtagsList = Array.isArray(post.hashtags) ? post.hashtags.join(' ').toLowerCase() : '';
    const content = (post.content || post.caption || post.title || '').toLowerCase();
    const badge = (post.statusBadge || '').toLowerCase();
    const eventType = (post.eventType || '').toLowerCase();

    return (
      author.includes(query) ||
      recipient.includes(query) ||
      recipientsList.includes(query) ||
      hashtagsList.includes(query) ||
      content.includes(query) ||
      badge.includes(query) ||
      eventType.includes(query)
    );
  });

  return (
    <div className="w-full min-h-screen bg-white pb-36">
      {/* Top Utility Section */}
      <div className="bg-white px-6 md:px-12 pt-6 pb-6 border-b border-gray-100">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Top row: Left (Back button), Right (Filter button + + button) */}
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              aria-label="Back"
              className="w-12 h-12 rounded-full bg-[#F6F8FA] hover:bg-[#ECEFF3] active:bg-[#DFE1E6] text-[#1A1B25] flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0"
            >
              <ChevronLeft size={22} strokeWidth={2.5} />
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onFilterClick}
                aria-label="Filter"
                className="w-12 h-12 rounded-full bg-[#F6F8FA] hover:bg-[#ECEFF3] active:bg-[#DFE1E6] text-[#353849] flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0"
              >
                <SlidersHorizontal size={20} strokeWidth={2.2} />
              </button>

              <button
                onClick={() => onCreateBoard(currentOption.label)}
                aria-label="Create Board"
                className="w-12 h-12 rounded-full bg-[#FE6349] hover:bg-[#ff5833] active:bg-[#e05234] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0"
              >
                <Plus size={22} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Current Message Board / Event Category Name + Count */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1B25] tracking-tight">
              {currentOption.label} ({formatStatNumber(matchedPosts.length)})
            </h1>
          </div>

          {/* Search Section */}
          <div className="relative w-full">
            <div className="w-full bg-[#F6F8FA] rounded-full px-5 py-3.5 sm:py-4 flex items-center gap-3 border border-transparent focus-within:border-[#DFE1E6] focus-within:bg-white transition-all shadow-2xs">
              <Search className="w-5 h-5 text-[#808897] shrink-0" strokeWidth={2} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, name...."
                className="w-full bg-transparent border-none outline-hidden text-sm sm:text-base text-[#1A1B25] placeholder-[#808897] font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="text-[#808897] hover:text-[#1A1B25] p-1 rounded-full hover:bg-gray-200/60 transition-all cursor-pointer"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Boards */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 md:px-12 pt-6 sm:pt-8">
        {displayPosts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-2xs max-w-md mx-auto my-12 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-[#FE6349] flex items-center justify-center text-3xl">
              {currentOption.emoji}
            </div>
            <h3 className="text-lg font-extrabold text-gray-900">
              {query ? `No boards found for "${searchQuery}"` : `No ${currentOption.label} boards yet`}
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed max-w-xs">
              {query 
                ? 'Try searching by a different caption, recipient, or creator name.' 
                : `No message boards have been created under the ${currentOption.label} event category yet. Be the first to create one!`}
            </p>
            {query ? (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 px-6 py-3 rounded-full bg-[#F6F8FA] hover:bg-[#ECEFF3] text-[#1A1B25] text-xs font-extrabold transition-all shadow-2xs cursor-pointer flex items-center gap-2"
              >
                <X size={14} />
                <span>Clear Search</span>
              </button>
            ) : (
              <button
                onClick={() => onCreateBoard(currentOption.label)}
                className="mt-2 px-6 py-3 rounded-full bg-[#FE6349] text-white text-xs font-extrabold hover:bg-rose-600 transition-all shadow-sm cursor-pointer flex items-center gap-2"
              >
                <Plus size={16} />
                <span>Create {currentOption.label} Board</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6 lg:gap-8">
            {displayPosts.map((post) => {
              const globalIndex = posts.findIndex(p => p.id === post.id);
              return (
                <motion.div
                  key={post.id}
                  className="w-full relative"
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <PostCard post={post} onClick={() => onPostClick(globalIndex !== -1 ? globalIndex : 0)} />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Identity comes from the server session (GET /user/me), never localStorage.
  const {
    user: currentUser,
    isAuthenticated,
    needsProfileSetup,
    isEmailVerified,
    ready: authReady,
    logout,
  } = useAuth();

  // Server-paginated discover feed, replacing INITIAL_MOCK_POSTS.
  const feed = useDiscoverFeed({ currentUserId: currentUser?.id, enabled: authReady });
  const { posts, setPosts, patchPost, removePost, prependPost } = feed;

  const [selectedFilterId, setSelectedFilterId] = useState<string>('moment');
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterModalMode, setFilterModalMode] = useState<'events' | 'hearts'>('events');
  const [activeFilter, setActiveFilter] = useState<'all' | 'tears' | 'vouch' | 'hype'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNavTab, setActiveNavTab] = useState<'home' | 'hearts'>('home');
  const [heartFilter, setHeartFilter] = useState<'received' | 'sent'>('received');

  // Authentication & Onboarding State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [authModalPrompt, setAuthModalPrompt] = useState<string | undefined>(undefined);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(() => {
    try {
      const hasSeen = localStorage.getItem('heartboard_welcome_dismissed');
      return !hasSeen;
    } catch (e) {
      return false;
    }
  });

  const isAnyModalOpen = isAuthModalOpen || isCreateModalOpen || isFilterModalOpen || isWelcomeModalOpen || selectedPostIndex !== null;

  const {
    isPromptOpen: isEngagementPromptOpen,
    activeTriggerReason: engagementTriggerReason,
    dismissPrompt: handleDismissEngagementPrompt,
    recordBoardViewed,
    recordUserCreatedMessageOrHeart,
  } = useEngagementPrompt(currentUser, posts, isAnyModalOpen);

  const handleEngagementPromptSendLove = () => {
    handleDismissEngagementPrompt();
    setContributionParentPost(null);
    setEditingPost(null);
    setEditingContribution(null);
    setEditMode(null);
    setCreateModalRecipient(undefined);
    setCreateModalHashtag(undefined);
    setCreateModalMode('create_message');
    setIsCreateModalOpen(true);
  };

  const handleOpenAuth = (mode: 'login' | 'signup' = 'login', prompt?: string) => {
    setAuthModalMode(mode);
    setAuthModalPrompt(prompt);
    setIsAuthModalOpen(true);
  };

  // AuthContext already holds the session; this only resets local view state.
  const handleAuthSuccess = (_user: RegisteredUser, isNewRegistration?: boolean) => {
    setIsAuthModalOpen(false);
    setAuthModalPrompt(undefined);
    feed.reload();

    if (isNewRegistration) {
      // Return user to Home Page and show welcome popup
      setActiveNavTab('home');
      setSelectedFilterId('moment');
      setViewingProfileUser(null);
      setViewingHashtag(null);
      setIsWelcomeModalOpen(true);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setActiveNavTab('home');
    setSelectedFilterId('moment');
    setViewingProfileUser(null);
    setViewingHashtag(null);
    navigate('/');
  };

  const handleCloseWelcomeModal = () => {
    setIsWelcomeModalOpen(false);
    try {
      localStorage.setItem('heartboard_welcome_dismissed', 'true');
    } catch (e) {
      // ignore
    }
  };

  const handleWelcomeLeaveMessage = () => {
    handleCloseWelcomeModal();
    setContributionParentPost(null);
    setEditingPost(null);
    setEditingContribution(null);
    setEditMode(null);
    setCreateModalRecipient(undefined);
    setCreateModalHashtag(undefined);
    setCreateModalMode('create_message');
    setIsCreateModalOpen(true);
  };

  // Profile and Hashtag view states
  const [viewingProfileUser, setViewingProfileUser] = useState<RegisteredUser | null>(null);
  const [viewingHashtag, setViewingHashtag] = useState<string | null>(null);
  const [createModalRecipient, setCreateModalRecipient] = useState<{ id?: string; name: string; handle: string; avatar?: string } | undefined>(undefined);
  const [createModalHashtag, setCreateModalHashtag] = useState<string | undefined>(undefined);
  const [createModalMode, setCreateModalMode] = useState<'create_message' | 'send_heart' | undefined>(undefined);
  const [createModalEventType, setCreateModalEventType] = useState<string | undefined>(undefined);
  const [contributionParentPost, setContributionParentPost] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editingContribution, setEditingContribution] = useState<Contribution | null>(null);
  const [editMode, setEditMode] = useState<'board' | 'message' | 'contribution' | null>(null);

  // ── URL <-> view state sync ────────────────────────────────────────────────
  //
  // The prototype drove profile / hashtag / board views purely from React
  // state, so none of them had a URL: share links, refresh and browser
  // back/forward all failed. These two effects make the URL authoritative.

  // URL -> state. Runs on every navigation, including a cold load of a
  // pasted link.
  useEffect(() => {
    const path = location.pathname;

    const profileMatch = path.match(/^\/profile\/([^/]+)$/);
    const hashtagMatch = path.match(/^\/hashtag\/([^/]+)$/);
    const boardMatch = path.match(/^\/board\/([^/]+)$/);

    if (profileMatch) {
      const handle = decodeURIComponent(profileMatch[1]);
      // Only replace when the target actually changed, or we fight the user.
      if (usernameOf(viewingProfileUser?.handle) !== handle.toLowerCase()) {
        setViewingProfileUser(userFromHandle(handle));
      }
      setViewingHashtag(null);
      return;
    }

    if (hashtagMatch) {
      const tag = decodeURIComponent(hashtagMatch[1]);
      setViewingHashtag(tag);
      setViewingProfileUser(null);
      return;
    }

    if (boardMatch) {
      const slug = decodeURIComponent(boardMatch[1]);
      const idx = posts.findIndex((p) => p.slug === slug || p.id === slug);
      if (idx !== -1) setSelectedPostIndex(idx);
      setViewingProfileUser(null);
      setViewingHashtag(null);
      return;
    }

    if (path === '/profile') {
      // Own profile.
      setViewingProfileUser(null);
      setViewingHashtag(null);
      setActiveNavTab('hearts');
      return;
    }

    if (path === '/login' || path === '/signup') {
      setAuthModalMode(path === '/signup' ? 'signup' : 'login');
      setIsAuthModalOpen(true);
      return;
    }

    if (path === '/create') {
      setIsCreateModalOpen(true);
      return;
    }

    // Feed
    setViewingProfileUser(null);
    setViewingHashtag(null);
    setSelectedPostIndex(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, posts.length]);

  /**
   * State -> URL. Called by the handlers below instead of setting state
   * directly, so navigating always leaves an address behind.
   */
  const goToProfile = (user: RegisteredUser) => {
    const handle = usernameOf(user.handle);
    navigate(handle ? `/profile/${encodeURIComponent(handle)}` : '/profile');
  };

  const goToHashtag = (tag: string) => {
    navigate(`/hashtag/${encodeURIComponent(tag.replace(/^#/, ''))}`);
  };

  const goToBoard = (post: Post) => {
    navigate(`/board/${encodeURIComponent(post.slug || post.id)}`);
  };

  const handleGiftHeartForUser = (user: RegisteredUser) => {
    if (!currentUser) {
      handleOpenAuth('login', `Please sign in or create an account to gift a heart token to ${user.name}.`);
      return;
    }
    setCreateModalRecipient({
      id: user.id,
      name: user.name,
      handle: user.handle,
      avatar: user.avatar
    });
    setCreateModalHashtag(undefined);
    setCreateModalMode('send_heart');
    setIsCreateModalOpen(true);
  };

  const handleSendMessageForUser = (user: RegisteredUser) => {
    if (!currentUser) {
      handleOpenAuth('login', `Please sign in or create an account to send a message to ${user.name}.`);
      return;
    }
    setCreateModalRecipient({
      id: user.id,
      name: user.name,
      handle: user.handle,
      avatar: user.avatar
    });
    setCreateModalHashtag(undefined);
    setCreateModalMode('create_message');
    setIsCreateModalOpen(true);
  };

  // Navigate by URL; the sync effect above applies the resulting view state,
  // so these views are shareable and survive a refresh.
  const handleSelectUser = (user: RegisteredUser) => goToProfile(user);

  const handleSelectHashtag = (tag: string) => goToHashtag(tag);

  const handleCreateBoardForHashtag = (tag: string) => {
    if (!currentUser) {
      handleOpenAuth('login', `Please sign in or create an account to contribute to ${tag}.`);
      return;
    }
    setCreateModalHashtag(tag);
    setCreateModalRecipient(undefined);
    setCreateModalMode('create_message');
    setIsCreateModalOpen(true);
  };

  // Real platform totals from GET /api/v1/stats.
  //
  // These used to be fabricated: a hard-coded 8,300 messages / 245 curators /
  // 7,600,000 reactions, plus a timer that added 1-4 random "reactions" every
  // 2.8 seconds so the number appeared to climb. That is now a real query.
  const [realtimeStats, setRealtimeStats] = useState({
    totalMessages: 0,
    totalCurators: 0,
    totalReactions: 0,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const stats = await getGlobalStats();
        if (!cancelled) {
          setRealtimeStats({
            totalMessages: stats.totalMessages,
            totalCurators: stats.totalCurators,
            totalReactions: stats.totalReactions,
          });
        }
      } catch {
        // Leave the previous figures in place on a transient failure.
      }
    };

    void load();
    // Refresh periodically so the counters stay live without inventing motion.
    const timer = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const handleTabChange = (tab: 'home' | 'hearts') => {
    setActiveNavTab(tab);
    if (tab === 'home') {
      setActiveFilter('all');
    } else if (tab === 'hearts') {
      setActiveFilter('tears');
    }
  };

  const handlePrev = () => {
    setSelectedPostIndex((prev) => 
      prev !== null ? (prev - 1 + posts.length) % posts.length : null
    );
  };

  const handleNext = () => {
    setSelectedPostIndex((prev) => 
      prev !== null ? (prev + 1) % posts.length : null
    );
  };

  const handleNewPost = (newPost: any) => {
    // If it's a heart token (from Send Heart / Blow Heart)
    const isHeart = Boolean(
      newPost.isHeartToken || 
      newPost.type === 'heart_token' || 
      newPost.section === 'hearts' || 
      (Array.isArray(newPost.selectedHearts) && newPost.selectedHearts.length > 0 && !newPost.mediaType && newPost.type !== 'image' && newPost.type !== 'audio' && newPost.type !== 'text')
    );

    if (isHeart) {
      const heartPost = {
        visibility: PostVisibility.PUBLIC,
        targetType: newPost.targetType || EntityType.WALL,
        ...newPost,
        reactions: newPost.reactions ?? 1,
        isHeartToken: true,
        isCreatedByUser: true,
        section: 'hearts',
        type: 'heart_token'
      };
      prependPost(heartPost);
      recordUserCreatedMessageOrHeart();
      return;
    }

    // Determine target category for standard message boards
    let inferredCategory: 'tears' | 'vouch' | 'hype' = 'hype';
    let label = '🔥 NEW VIBE';
    if (newPost.type === 'text') {
      inferredCategory = 'tears';
      label = '😭 BROUGHT THEM TO TEARS';
    } else if (newPost.type === 'audio') {
      inferredCategory = 'tears';
      label = '😭 HEART VOUCH';
    } else {
      inferredCategory = 'vouch';
      label = '⭐ VOUCH CERTIFIED';
    }

    const postWithTheme = {
      visibility: PostVisibility.PUBLIC,
      targetType: newPost.targetType || EntityType.WALL,
      ...newPost,
      reactions: newPost.reactions ?? 0,
      isCreatedByUser: true,
      isHeartToken: false,
      section: newPost.section || 'board',
      theme: newPost.theme || '#FAF5E8',
      mediaType: newPost.type === 'text' ? 'note' : newPost.type,
      category: inferredCategory,
      statusBadge: label
    };
    prependPost(postWithTheme);
    recordUserCreatedMessageOrHeart();
  };

  const MOMENT_REACTION_THRESHOLD = 50;

  const isEligibleForMoment = (post: any) => {
    if (!canViewPostPublicly(post)) return false;
    if (post.isMomentEligible) return true;
    if ((post.reactions || 0) >= MOMENT_REACTION_THRESHOLD) return true;
    if (!post.isCreatedByUser && (post.reactions || 0) > 0) return true;
    return false;
  };

  const momentPosts = posts.filter(isEligibleForMoment);

  const query = searchQuery.trim().toLowerCase();

  // Count of real matching accounts, from GET /api/v1/search.
  const appSearch = useSearch(searchQuery, currentUser?.id);
  const matchingUsersCount = appSearch.users.length;

  const filteredPosts = momentPosts.filter(post => {
    // Filter category
    if (activeFilter !== 'all' && post.category !== activeFilter) {
      return false;
    }
    // Filter search query
    if (query) {
      const author = (post.authorName || '').toLowerCase();
      const recipient = (post.recipientName || post.targetId || '').toLowerCase();
      const recipientsList = Array.isArray(post.recipients) ? post.recipients.join(' ').toLowerCase() : '';
      const hashtagsList = Array.isArray(post.hashtags) ? post.hashtags.join(' ').toLowerCase() : '';
      const content = (post.content || '').toLowerCase();
      const badge = (post.statusBadge || '').toLowerCase();
      const cat = (post.category || '').toLowerCase();

      return (
        author.includes(query) ||
        recipient.includes(query) ||
        recipientsList.includes(query) ||
        hashtagsList.includes(query) ||
        content.includes(query) ||
        badge.includes(query) ||
        cat.includes(query)
      );
    }
    return true;
  });

  const handleSelectBoardFromSearch = (post: any) => {
    goToBoard(post);
    recordBoardViewed();
  };

  // Hydrate the open board with its full document and messages. Feed cards come
  // from a .select()-ed list query and carry neither.
  const openPost = selectedPostIndex !== null ? posts[selectedPostIndex] : null;
  useBoardMessages(openPost, currentUser?.id, patchPost);

  return (
    <>
      <div className="min-h-screen flex flex-col bg-white font-sans selection:bg-orange-100">
        <EmailVerificationBanner />
        {isAuthModalOpen ? (
          <main className="flex-grow bg-[#F8F9FB] min-h-screen">
            <AuthView
              isOpen={isAuthModalOpen}
              initialMode={authModalMode}
              promptMessage={authModalPrompt}
              onClose={() => {
                setIsAuthModalOpen(false);
                setAuthModalPrompt(undefined);
              }}
              onAuthSuccess={handleAuthSuccess}
            />
          </main>
        ) : viewingHashtag ? (
          <main className="flex-grow bg-white">
            <HashtagView 
              hashtag={viewingHashtag}
              posts={posts}
              onBack={() => navigate("/")}
              onCreateBoard={handleCreateBoardForHashtag}
              onSelectUser={handleSelectUser}
              onPostClick={(post) => {
                goToBoard(post);
                recordBoardViewed();
              }}
            />
          </main>
        ) : viewingProfileUser ? (
          <main className="flex-grow bg-white">
            <HeartboardView  
              profileUser={viewingProfileUser}
              currentUser={currentUser}
              onSignOut={handleSignOut}
              onBack={() => navigate("/")}
              onGiftHeart={handleGiftHeartForUser}
              onSendMessage={handleSendMessageForUser}
              onSelectUser={handleSelectUser}
              posts={posts}
              heartFilter={heartFilter}
              onHeartFilterChange={setHeartFilter}
              onFilterClick={(subTab) => {
                setFilterModalMode(subTab === 'hearts' ? 'hearts' : 'events');
                setIsFilterModalOpen(true);
              }}
              onPostClick={(post) => {
                goToBoard(post);
                recordBoardViewed();
              }}
            />
          </main>
        ) : activeNavTab === 'home' ? (
          <>
            <TopNavigation 
              onFilterClick={() => {
                setFilterModalMode('events');
                setIsFilterModalOpen(true);
              }} 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              posts={posts}
              onSelectBoard={handleSelectBoardFromSearch}
              onSelectUser={handleSelectUser}
              onSelectHashtag={handleSelectHashtag}
              currentUser={currentUser}
              onOpenAuth={handleOpenAuth}
              onGoToProfile={() => {
                setActiveNavTab('hearts');
                setViewingProfileUser(null);
                setViewingHashtag(null);
              }}
            />
            
            {selectedFilterId === 'moment' ? (
              <>
                {/* Concentric radar hero feed */}
                <HeroPulseFeed 
                  posts={momentPosts}
                  onGiftVouchClick={() => {
                    if (!currentUser) {
                      handleOpenAuth('login', 'Please sign in or create an account to gift a vouch.');
                      return;
                    }
                    setCreateModalRecipient(undefined);
                    setCreateModalHashtag(undefined);
                    setCreateModalMode(undefined);
                    setIsCreateModalOpen(true);
                  }} 
                />

                <main className="flex-grow bg-white">
                  <MasonryFeed
                    posts={filteredPosts}
                    onPostClick={(index) => {
                      const target = filteredPosts[index];
                      if (target) {
                        // Navigate so the board gets a real, shareable URL.
                        goToBoard(target);
                        recordBoardViewed();
                      }
                    }}
                    activeFilter={activeFilter}
                    setActiveFilter={setActiveFilter}
                    realtimeStats={realtimeStats}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    matchingUsersCount={matchingUsersCount}
                  />
                </main>
              </>
            ) : (
              <main className="flex-grow bg-white">
                <EventCategoryView 
                  filterId={selectedFilterId}
                  posts={posts}
                  onBack={() => setSelectedFilterId('moment')}
                  onFilterClick={() => {
                    setFilterModalMode('events');
                    setIsFilterModalOpen(true);
                  }}
                  onPostClick={(index) => {
                    setSelectedPostIndex(index);
                    recordBoardViewed();
                  }}
                  onCreateBoard={(eventType) => {
                    if (!currentUser) {
                      handleOpenAuth('login', 'Please sign in or create an account to create a board.');
                      return;
                    }
                    setCreateModalRecipient(undefined);
                    setCreateModalHashtag(undefined);
                    setCreateModalMode('create_message');
                    setCreateModalEventType(eventType);
                    setIsCreateModalOpen(true);
                  }}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
              </main>
            )}
          </>
        ) : (
          <main className="flex-grow bg-white">
            <HeartboardView  
              posts={posts}
              currentUser={currentUser}
              onSignOut={handleSignOut}
              selectedFilterId={selectedFilterId}
              onClearFilter={() => setSelectedFilterId('moment')}
              heartFilter={heartFilter}
              onHeartFilterChange={setHeartFilter}
              onFilterClick={(subTab) => {
                setFilterModalMode(subTab === 'hearts' ? 'hearts' : 'events');
                setIsFilterModalOpen(true);
              }}
              onPostClick={(post) => {
                goToBoard(post);
                recordBoardViewed();
              }}
            />
          </main>
        )}

        {!isAuthModalOpen && (
          <BottomNav 
            activeTab={activeNavTab} 
            setActiveTab={(tab) => {
              if (tab === 'hearts' && !currentUser) {
                handleOpenAuth('login', 'Please sign in or create an account to access your personal Heartboard.');
                return;
              }
              handleTabChange(tab);
              setViewingProfileUser(null);
              setViewingHashtag(null);
            }} 
            onPlusClick={() => {
              if (!currentUser) {
                handleOpenAuth('login', 'Please sign in or create an account to create a board or message.');
                return;
              }
              setCreateModalRecipient(undefined);
              setCreateModalHashtag(undefined);
              setCreateModalMode(undefined);
              setCreateModalEventType(undefined);
              setIsCreateModalOpen(true);
            }} 
          />
        )}

        {isCreateModalOpen && (
          <CreateAppreciationModal 
            onClose={() => {
              setIsCreateModalOpen(false);
              setCreateModalRecipient(undefined);
              setCreateModalHashtag(undefined);
              setCreateModalMode(undefined);
              setCreateModalEventType(undefined);
              setContributionParentPost(null);
              setEditingPost(null);
              setEditingContribution(null);
              setEditMode(null);
            }} 
            onPostCreated={handleNewPost}
            initialRecipient={createModalRecipient}
            initialHashtag={createModalHashtag}
            initialMode={createModalMode}
            initialEventType={createModalEventType}
            parentBoard={contributionParentPost}
            isContribution={Boolean(contributionParentPost)}
            editingPost={editingPost}
            editingContribution={editingContribution}
            editMode={editMode}
            onUpdatePost={(updatedPost) => {
              setPosts((prevPosts) =>
                prevPosts.map((p) => (p.id === updatedPost.id ? { ...p, ...updatedPost } : p))
              );
              setEditingPost(null);
              setEditMode(null);
              setIsCreateModalOpen(false);
            }}
            onUpdateContribution={(parentBoardId, updatedContrib) => {
              setPosts((prevPosts) =>
                prevPosts.map((p) => {
                  if (p.id !== parentBoardId) return p;
                  return {
                    ...p,
                    contributions: (p.contributions || []).map((c) =>
                      c.id === updatedContrib.id ? updatedContrib : c
                    ),
                  };
                })
              );
              setEditingContribution(null);
              setContributionParentPost(null);
              setEditMode(null);
              setIsCreateModalOpen(false);
            }}
            onDeletePost={async (postId) => {
              // Optimistic removal, rolled back by a reload if the server refuses.
              const snapshot = posts;
              removePost(postId);
              setSelectedPostIndex(null);
              setEditingPost(null);
              setEditMode(null);
              setIsCreateModalOpen(false);
              try {
                await boardApi.deleteBoard(postId);
              } catch (e) {
                setPosts(snapshot);
                window.alert(toApiError(e).message);
              }
            }}
            onDeleteContribution={(parentBoardId, contribId) => {
              setPosts((prevPosts) =>
                prevPosts.map((p) => {
                  if (p.id !== parentBoardId) return p;
                  const remaining = (p.contributions || []).filter((c) => c.id !== contribId);
                  const userHandle = currentUser?.handle ?? '';
                  const userStillHasContrib = remaining.some((c) => 
                    c.isCreatedByUser === true || 
                    (c.authorHandle && c.authorHandle.toLowerCase().replace(/^@/, '') === userHandle.toLowerCase().replace(/^@/, ''))
                  );
                  return {
                    ...p,
                    contributions: remaining,
                    hasUserContributed: userStillHasContrib,
                  };
                })
              );
              setEditingContribution(null);
              setContributionParentPost(null);
              setEditMode(null);
              setIsCreateModalOpen(false);
            }}
            onAddContribution={(parentBoardId, newContrib) => {
              setPosts((prevPosts) =>
                prevPosts.map((p) => {
                  if (p.id !== parentBoardId) return p;
                  const currentContribs = p.contributions || [];
                  const userHandle = currentUser?.handle || newContrib.authorHandle || '@guest';
                  const userId = currentUser?.id || newContrib.authorId || `guest-${Math.random().toString(36).substring(2, 7)}`;
                  const userCollabs = p.collaboratorHandles || [];
                  const updatedCollabs = userCollabs.includes(userHandle) ? userCollabs : [...userCollabs, userHandle];
                  const userCollabIds = p.collaboratorIds || [];
                  const updatedCollabIds = userCollabIds.includes(userId) ? userCollabIds : [...userCollabIds, userId];
                  return {
                    ...p,
                    hasUserContributed: true,
                    collaboratorHandles: updatedCollabs,
                    collaboratorIds: updatedCollabIds,
                    contributions: [...currentContribs, { ...newContrib, isCreatedByUser: true }],
                  };
                })
              );
              setContributionParentPost(null);
              setIsCreateModalOpen(false);
            }}
          />
        )}

        <FilterModal 
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          mode={filterModalMode}
          selectedFilterId={selectedFilterId}
          heartFilter={heartFilter}
          onApplyFilter={(selectedOptionId, selectedHeartFilter) => {
            setSelectedFilterId(selectedOptionId);
            if (selectedHeartFilter) {
              setHeartFilter(selectedHeartFilter);
            }
          }}
        />

        {selectedPostIndex !== null && posts[selectedPostIndex] && (
          <MediaModal 
            post={posts[selectedPostIndex]} 
            currentUser={currentUser}
            onRequireAuth={(prompt) => handleOpenAuth('login', prompt)}
            onClose={() => setSelectedPostIndex(null)}
            onPrev={() => setSelectedPostIndex((prev) => prev !== null ? (prev - 1 + posts.length) % posts.length : null)}
            onNext={() => setSelectedPostIndex((prev) => prev !== null ? (prev + 1) % posts.length : null)}
            onSelectUser={(user) => {
              setSelectedPostIndex(null);
              handleSelectUser(user);
            }}
            onSelectHashtag={(tag) => {
              setSelectedPostIndex(null);
              handleSelectHashtag(tag);
            }}
            onAddContributionClick={(parentPost) => {
              setContributionParentPost(parentPost);
              setCreateModalRecipient(undefined);
              setCreateModalHashtag(undefined);
              setCreateModalMode('create_message');
              setEditingPost(null);
              setEditingContribution(null);
              setEditMode(null);
              setIsCreateModalOpen(true);
            }}
            onEditBoard={(targetPost) => {
              setEditingPost(targetPost);
              setEditingContribution(null);
              setContributionParentPost(null);
              setEditMode('board');
              setIsCreateModalOpen(true);
            }}
            onDeleteBoard={async (postId) => {
              const snapshot = posts;
              removePost(postId);
              setSelectedPostIndex(null);
              try {
                await boardApi.deleteBoard(postId);
              } catch (e) {
                setPosts(snapshot);
                window.alert(toApiError(e).message);
              }
            }}
            onEditMessage={(targetPost, targetContribution) => {
              if (targetContribution) {
                setContributionParentPost(targetPost);
                setEditingContribution(targetContribution);
                setEditingPost(null);
                setEditMode('contribution');
              } else {
                setEditingPost(targetPost);
                setEditingContribution(null);
                setContributionParentPost(null);
                setEditMode('message');
              }
              setIsCreateModalOpen(true);
            }}
            onDeleteMessage={async (targetPost, targetContribution) => {
              const snapshot = posts;
              if (targetContribution) {
                setPosts((prevPosts) =>
                  prevPosts.map((p) => {
                    if (p.id !== targetPost.id) return p;
                    return {
                      ...p,
                      contributions: (p.contributions || []).filter(
                        (c) => c.id !== targetContribution.id
                      ),
                    };
                  })
                );
                try {
                  const res = await messageApi.deleteMessage(targetContribution.id);
                  // Removing the last message can delete the board too.
                  if (res.boardDeleted) {
                    removePost(targetPost.id);
                    setSelectedPostIndex(null);
                  }
                } catch (e) {
                  setPosts(snapshot);
                  window.alert(toApiError(e).message);
                }
              } else {
                removePost(targetPost.id);
                setSelectedPostIndex(null);
                try {
                  await boardApi.deleteBoard(targetPost.id);
                } catch (e) {
                  setPosts(snapshot);
                  window.alert(toApiError(e).message);
                }
              }
            }}
            onReactionBlown={async (postId) => {
              const snapshot = posts;
              patchPost(postId, {
                reactions: (posts.find((p) => p.id === postId)?.reactions || 0) + 1,
              });
              recordUserCreatedMessageOrHeart();
              try {
                const { likeCount } = await boardApi.likeBoard(postId);
                patchPost(postId, { reactions: likeCount });
              } catch (e) {
                setPosts(snapshot);
                if (toApiError(e).status === 401) {
                  handleOpenAuth('login', 'Sign in to react to this board.');
                }
              }
            }}
            onUpdateReactions={(postId, counts, userReactions) => {
              const total = (counts.clap || 0) + (counts.heart || 0) + (counts.smiley || 0) + (counts.fire || 0);
              setPosts((prevPosts) =>
                prevPosts.map((p) => {
                  if (p.id !== postId) return p;
                  return {
                    ...p,
                    reactionCounts: counts,
                    userReactions: userReactions,
                    reactions: total,
                  };
                })
              );
            }}
          />
        )}

        {/* Welcome Onboarding Modal */}
        <WelcomeModal
          isOpen={isWelcomeModalOpen}
          onClose={handleCloseWelcomeModal}
          onLeaveMessage={handleWelcomeLeaveMessage}
        />

        {/* Heartboard Engagement Prompt Modal */}
        <EngagementPromptModal
          isOpen={isEngagementPromptOpen}
          triggerReason={engagementTriggerReason}
          onClose={handleDismissEngagementPrompt}
          onSendLoveOrHeart={handleEngagementPromptSendLove}
        />
      </div>
    </>
  );
};

export default App;
