
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { EntityType, Post, PostVisibility, RegisteredUser, Contribution } from './types';
import { useAuth } from './contexts/AuthContext';
import { useSearch } from './hooks/useSearch';
import { useDiscoverFeed } from './hooks/useBoards';
import { useBoardMessages } from './hooks/useBoardMessages';
import { getGlobalStats } from './services/stats.api';
import * as boardApi from './services/board.api';
import * as messageApi from './services/message.api';
import * as userApi from './services/user.api';
import { toApiError } from './lib/api';
import {
  usernameOf,
  userFromHandle,
  boardToPost,
  userToRegisteredUser,
  fromClientReactions,
  toClientReactions,
  toReactionCounts,
  totalReactions,
  postMatchesFeedTab,
  type ClientReaction,
} from './lib/adapters';
import { formatCount, plural } from './lib/format';
import { PostCard } from './components/PostCard';
import { MediaModal } from './components/MediaModal';
import { CreateAppreciationModal, SEMANTIC_HEARTS } from './components/CreateAppreciationModal';
import { FilterModal, FILTER_OPTIONS } from './components/FilterModal';
import { HeartboardView } from './components/HeartboardView';
import { HashtagView } from './components/HashtagView';
import { AuthView } from './components/AuthModal';
import { WelcomeModal } from './components/WelcomeModal';
import { EngagementPromptModal } from './components/EngagementPromptModal';
import { useEngagementPrompt } from './hooks/useEngagementPrompt';
import { useHeartboardNotifications } from './hooks/useHeartboardNotifications';
import { useHeartRadar } from './hooks/useHeartRadar';
import { HeroHeartAnimation } from './components/HeroHeartAnimation';
import { HeartboardLogo } from './components/HeartboardLogo';
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
  Hash,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SmartImage, SkeletonBlock } from './components/SmartImage';

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


/** People and hashtags in the search panel reveal this many at a time. */
const SEARCH_REVEAL_STEP = 7;

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
  /** Clears feed state behind the brand link; the Link itself navigates. */
  onGoHome?: () => void;
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
  onGoToProfile,
  onGoHome
}) => {
  const location = useLocation();
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
  //
  // Only while the panel is open: with no query this browses rather than
  // returning nothing, so an ungated hook would fetch on every page load.
  const searchResults = useSearch(searchQuery, currentUser?.id, { enabled: isFullPageOpen });

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

  // People and hashtags reveal a row at a time rather than dumping the whole
  // pool into the panel.
  const [visibleUsers, setVisibleUsers] = useState(SEARCH_REVEAL_STEP);
  const [visibleHashtags, setVisibleHashtags] = useState(SEARCH_REVEAL_STEP);

  // A new result set starts from the first page again — otherwise a query that
  // returns three people keeps a "Show more" count from the previous one.
  useEffect(() => {
    setVisibleUsers(SEARCH_REVEAL_STEP);
    setVisibleHashtags(SEARCH_REVEAL_STEP);
  }, [searchQuery, activeSearchTab]);

  // How many results the ACTIVE tab has. The empty state used to require all
  // three collections to be empty, so picking "User" or "Hashtag" while only
  // boards had matched rendered a completely blank panel — the tab looked dead.
  const activeTabCount =
    activeSearchTab === 'users'
      ? matchingUsers.length
      : activeSearchTab === 'boards'
        ? matchingBoards.length
        : activeSearchTab === 'hashtags'
          ? popularHashtags.length
          : matchingUsers.length + matchingBoards.length + popularHashtags.length;

  /** What this tab is looking for, for the empty and loading copy. */
  const activeTabNoun =
    activeSearchTab === 'users'
      ? 'people'
      : activeSearchTab === 'boards'
        ? 'boards'
        : activeSearchTab === 'hashtags'
          ? 'hashtags'
          : 'results';


  return (
    <>
      <header className="bg-white py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-[50]">
        {/* Brand logo - left. A real link to the feed, so the mark and the
            wordmark behave like a home button should: a visible href, and
            cmd/middle-click opens a new tab. It used to be a bare div that only
            cleared the search box and scrolled up, which left you exactly where
            you were — an event category, say — with nothing having happened.
            Replaces rather than pushes when already home, so repeat clicks do
            not stack identical history entries. */}
        <Link
          to="/"
          replace={location.pathname === '/'}
          onClick={onGoHome}
          aria-label="Heartboard home"
          className="flex items-center gap-3 shrink-0 cursor-pointer"
        >
          <HeartboardLogo className="w-10 h-10 shrink-0 transform hover:rotate-6 transition-all" />
          <span className="font-extrabold text-lg text-gray-900 tracking-tight hidden sm:block">Heartboard</span>
        </Link>

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
            className="w-full h-10 py-0 bg-gray-25 border-0 rounded-full pl-12 pr-10 text-sm text-gray-800 placeholder:text-gray-400 focus:bg-gray-50 active:bg-gray-50 focus:outline-none appearance-none transition-colors duration-200 cursor-pointer"
          />

          {hasSearchInput && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSearchQuery('');
              }}
              // Square box + rounded-full, so it is a circle. Padding around an
              // inline SVG is not: the icon's line box is taller than it is
              // wide, which rounded the button into an egg.
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 aspect-square flex items-center justify-center text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-all cursor-pointer"
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
                <SmartImage
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  rounded="rounded-full"
                  instant
                  wrapperClassName="w-full h-full"
                  className="w-full h-full object-cover"
                  fallback={<User size={18} strokeWidth={2.2} className="text-gray-500" />}
                />
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
                      className="w-full h-10 py-0 bg-[#F8F9FB] hover:bg-[#F6F8FA] focus:bg-[#F8F9FB] border-0 rounded-full pl-12 pr-12 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none appearance-none transition-colors"
                    />

                    {hasSearchInput && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 aspect-square flex items-center justify-center text-gray-400 hover:text-gray-700 bg-gray-200/80 hover:bg-gray-300 rounded-full transition-all cursor-pointer"
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
                      {hasSearchInput ? 'People' : 'Most active curators'}
                    </h2>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                      {matchingUsers.slice(0, visibleUsers).map((user) => (
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
                              <SmartImage
                                src={user.avatar}
                                alt={user.name}
                                rounded="rounded-full"
                                instant
                                wrapperClassName="w-full h-full"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                fallback={<span className="text-sm font-bold text-gray-500">{user.name.charAt(0).toUpperCase()}</span>}
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
                            {user.boardsCount || 0} {plural(user.boardsCount ?? 0, 'BOARD')} CREATED
                          </span>
                        </div>
                      ))}
                    </div>

                    {matchingUsers.length > visibleUsers && (
                      <div className="flex justify-center pt-2">
                        <button
                          onClick={() => setVisibleUsers((n) => n + SEARCH_REVEAL_STEP)}
                          className="px-6 py-2.5 rounded-full bg-[#F8F9FB] hover:bg-[#ECEFF3] text-[#1A1B25] text-xs font-extrabold transition-all cursor-pointer"
                        >
                          Show more people ({matchingUsers.length - visibleUsers})
                        </button>
                      </div>
                    )}
                  </section>
                )}

                {/* 2. Created Boards Section */}
                {(activeSearchTab === 'all' || activeSearchTab === 'boards') && matchingBoards.length > 0 && (
                  <section className="space-y-3">
                    <h2 className="text-xs sm:text-sm font-semibold text-gray-400 tracking-normal">
                      {/* The Boards tab used to be captioned "Registered
                          users", copied from the section above it. */}
                      {activeSearchTab === 'all' ? 'Hot Boards' : 'Boards'}
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
                      {hasSearchInput ? 'Hashtags' : 'Most used hashtags'}
                    </h2>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                      {popularHashtags.slice(0, visibleHashtags).map((h) => (
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
                            {h.count}
                          </span>
                        </div>
                      ))}
                    </div>

                    {popularHashtags.length > visibleHashtags && (
                      <div className="flex justify-center pt-2">
                        <button
                          onClick={() => setVisibleHashtags((n) => n + SEARCH_REVEAL_STEP)}
                          className="px-6 py-2.5 rounded-full bg-[#F8F9FB] hover:bg-[#ECEFF3] text-[#1A1B25] text-xs font-extrabold transition-all cursor-pointer"
                        >
                          Show more hashtags ({popularHashtags.length - visibleHashtags})
                        </button>
                      </div>
                    )}
                  </section>
                )}

                {/* Searching. Without this the 300ms debounce plus the request
                    round-trip read as "this tab is empty" until results landed. */}
                {searchResults.loading && activeTabCount === 0 && (
                  <div className="py-20 flex flex-col items-center justify-center bg-[#F8F9FB] rounded-3xl p-8 gap-3">
                    <Loader2 className="w-6 h-6 text-[#FE6349] animate-spin" />
                    <p className="text-xs font-semibold text-gray-400">Searching {activeTabNoun}…</p>
                  </div>
                )}

                {/* Empty state, scoped to the tab the user is actually on. */}
                {!searchResults.loading && activeTabCount === 0 && (
                  <div className="py-20 text-center flex flex-col items-center justify-center bg-[#F8F9FB] rounded-3xl p-8">
                    <div className="w-16 h-16 rounded-full bg-rose-50 text-[#FE6349] flex items-center justify-center mb-4">
                      {activeSearchTab === 'hashtags' ? (
                        <Hash size={28} strokeWidth={2} />
                      ) : activeSearchTab === 'users' ? (
                        <User size={28} strokeWidth={2} />
                      ) : (
                        <Search size={28} strokeWidth={2} />
                      )}
                    </div>
                    <h3 className="text-base font-extrabold text-gray-900">
                      No {activeTabNoun} found
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm leading-relaxed">
                      {hasSearchInput
                        ? `We couldn't find any ${activeTabNoun} for "${searchQuery}".`
                        : `There are no ${activeTabNoun} on Heartboard yet.`}
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
  onGiftVouchClick: () => void;
}

/**
 * A person's name in the live ticker, linked to their Heartboard.
 *
 * The name is shown as written, without an "@" in front of it — the handle is
 * only the address it points at. Falls back to plain text when we have no
 * handle to link to, so a recipient the server did not resolve still reads
 * correctly instead of leading nowhere.
 */
const TickerName: React.FC<{ name: string; handle?: string }> = ({ name, handle }) => {
  if (!handle) {
    return <span className="font-extrabold text-[#1A1B25]">{name}</span>;
  }
  return (
    <Link
      to={`/profile/${encodeURIComponent(handle)}`}
      className="font-extrabold text-[#1A1B25] hover:text-[#FE6349] transition-colors cursor-pointer"
    >
      {name}
    </Link>
  );
};

/**
 * How long one line stays on the radar.
 *
 * A FIXED clock, deliberately decoupled from how fast hearts are actually being
 * blown. The rate people blow hearts at decides WHAT the radar has to show, and
 * nothing else — twenty at once enlarges the pool, it does not make the ticker
 * flicker through them.
 */
const RADAR_ROTATE_MS = 20_000;

const HeroPulseFeed: React.FC<HeroPulseFeedProps> = ({ onGiftVouchClick }) => {
  const [activeMessageIndex, setActiveMessageIndex] = useState(0);

  // Real hearts, platform-wide, refreshed in the background. This used to be
  // derived from the discover feed, which no longer carries heart tokens at all
  // — so the radar sat on "Be the first to blow a heart today" no matter how
  // many had been blown. Its other branch was worse: it announced that someone
  // "blew a Loving Heart" whenever they had merely created a board.
  const { hearts: radarHearts } = useHeartRadar();

  const liveActivities = useMemo(
    () =>
      radarHearts.map((h) => {
        const spec = SEMANTIC_HEARTS.find((s) => s.id === h.heart) ?? SEMANTIC_HEARTS[0];
        return {
          sender: h.sender.name,
          senderHandle: h.sender.username,
          heartType: `${spec.label} Heart ${spec.emoji}`,
          receiver: h.recipient.name,
          receiverHandle: h.recipient.username,
          hexColor: spec.bubbleColor,
        };
      }),
    [radarHearts],
  );

  const hasActivity = liveActivities.length > 0;

  /**
   * Read inside the interval WITHOUT being a dependency of it.
   *
   * If the effect below restarted whenever the pool changed, a refresh landing
   * mid-cycle would cut the current line short — and with hearts arriving
   * steadily the ticker would end up churning. The timer is started once and
   * left alone; it looks up the current pool when it fires.
   */
  const activitiesRef = useRef(liveActivities);
  activitiesRef.current = liveActivities;

  useEffect(() => {
    if (!hasActivity) return;

    const timer = setInterval(() => {
      const total = activitiesRef.current.length;
      if (total === 0) return;
      // Random, not sequential: the radar is a sample of what is happening, not
      // a list to be read in order. Never the line already showing, so a change
      // is always visible.
      setActiveMessageIndex((prev) => {
        if (total === 1) return 0;
        let next = Math.floor(Math.random() * (total - 1));
        if (next >= prev % total) next += 1;
        return next;
      });
    }, RADAR_ROTATE_MS);

    return () => clearInterval(timer);
  }, [hasActivity]);

  // Modulo, because the pool can shrink under a held index between refreshes.
  const currentActivity = hasActivity
    ? liveActivities[activeMessageIndex % liveActivities.length]
    : null;

  return (
    <div className="relative w-full overflow-hidden bg-white py-10 md:py-16 flex flex-col items-center justify-center min-h-[380px] md:min-h-[440px]">
      {/* Dynamic Organic Multi-Layer Hero Heart Animation Canvas */}
      <div className="w-full max-w-4xl h-[260px] md:h-[300px] relative flex items-center justify-center">
        <HeroHeartAnimation
          activeColor={currentActivity?.hexColor ?? '#FE6349'}
          activeActivityKey={currentActivity ? `${activeMessageIndex}-${currentActivity.sender}-${currentActivity.hexColor}` : 'idle'}
          onCentralHeartClick={onGiftVouchClick}
        />
      </div>

      {/* Highly Animated Real-Time Ticker */}
      <div className="mt-4 sm:mt-6 relative min-h-[52px] h-auto w-full max-w-md overflow-hidden flex items-center justify-center px-4 z-20">
        <AnimatePresence mode="wait">
          {currentActivity ? (
            <motion.div
              key={activeMessageIndex}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              // No longer a create link. The pill names two people, and both are
              // links now — wrapping them in a third click target meant tapping
              // a name opened the composer instead of that person's profile.
              // The animated heart above remains the way to start one.
              className="bg-[#F8F9FB] border border-[#ECEFF3] shadow-2xs py-3 px-5 rounded-full flex items-center justify-center gap-1.5 text-xs sm:text-sm text-[#1A1B25] max-w-full truncate"
            >
              <TickerName name={currentActivity.sender} handle={currentActivity.senderHandle} />
              <span className="text-[#666D80]">blew a</span>
              <span
                className="font-extrabold select-none flex items-center gap-0.5"
                style={{ color: currentActivity.hexColor }}
              >
                {currentActivity.heartType}
              </span>
              <span className="text-[#666D80]">to</span>
              <TickerName name={currentActivity.receiver} handle={currentActivity.receiverHandle} />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#F8F9FB] border border-[#ECEFF3] shadow-2xs py-3 px-5 rounded-full flex items-center justify-center gap-1.5 text-xs sm:text-sm text-[#666D80] max-w-full truncate cursor-pointer hover:bg-[#ECEFF3] transition-colors"
              onClick={onGiftVouchClick}
            >
              <span>Be the first to blow a heart today</span>
            </motion.div>
          )}
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

const MasonryFeed = ({ 
  posts, 
  onPostClick,
  activeFilter,
  setActiveFilter,
  realtimeStats,
  searchQuery,
  setSearchQuery,
  matchingUsersCount,
  loading = false,
  loadingMore = false,
  error = null,
  hasMore = false,
  onLoadMore,
  onRetry,
}: { 
  posts: any[], 
  onPostClick: (index: number) => void,
  activeFilter: 'all' | 'tears' | 'vouch' | 'hype',
  setActiveFilter: (filter: 'all' | 'tears' | 'vouch' | 'hype') => void,
  realtimeStats: { totalMessages: number; totalCurators: number; totalReactions: number },
  searchQuery: string,
  setSearchQuery: (query: string) => void,
  matchingUsersCount: number,
  /** First page in flight — render skeleton cards, not an empty state. */
  loading?: boolean,
  /** A later page in flight — keep the grid, append a spinner row. */
  loadingMore?: boolean,
  error?: string | null,
  hasMore?: boolean,
  onLoadMore?: () => void,
  onRetry?: () => void,
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
      {loading && posts.length === 0 ? (
        // Skeleton grid. The feed previously rendered "No heartfelt notes or
        // boards found." while the very first request was still in flight,
        // which read as an empty account rather than as loading.
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6 lg:gap-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonBlock key={i} className="w-full aspect-[3/4]" rounded="rounded-2xl sm:rounded-[2.5rem]" />
          ))}
        </div>
      ) : error && posts.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-12 text-center border border-gray-100 shadow-2xs">
          <p className="text-[#1A1B25] font-bold text-lg mb-1">We could not load the feed</p>
          <p className="text-sm text-[#808897] mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-5 py-2.5 rounded-full bg-[#FE6349] text-white text-xs font-bold hover:bg-[#e05234] transition-all cursor-pointer"
            >
              Try again
            </button>
          )}
        </div>
      ) : posts.length === 0 ? (
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

      {/* Pagination. The feed hook has always been server-paginated, but nothing
          ever rendered a way to reach page 2, so the app only showed the first
          12 boards. */}
      {posts.length > 0 && (hasMore || loadingMore) && (
        <div className="flex justify-center mt-10">
          {loadingMore ? (
            <div className="flex items-center gap-2 text-sm font-bold text-[#808897]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading more boards…</span>
            </div>
          ) : (
            <button
              onClick={onLoadMore}
              className="px-6 py-3 rounded-full bg-white border border-[#ECEFF3] text-[#1A1B25] text-xs font-extrabold hover:bg-[#F8F9FB] transition-all cursor-pointer shadow-2xs"
            >
              Load more boards
            </button>
          )}
        </div>
      )}

      {/* A page-2 failure must not wipe the boards already on screen. */}
      {error && posts.length > 0 && (
        <p className="text-center text-xs font-semibold text-[#FE6349] mt-6">{error}</p>
      )}
    </div>
  );
};

interface EventCategoryViewProps {
  filterId: string;
  posts: any[];
  onBack: () => void;
  onPostClick: (index: number) => void;
  onCreateBoard: (eventType?: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const EventCategoryView: React.FC<EventCategoryViewProps> = ({
  filterId,
  posts,
  onBack,
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
    // No targetId fallback: it is the board's slug, not a recipient.
    const recipient = (post.recipientName || '').toLowerCase();
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
          {/* Top row: Left (Back button), Right (+ button).
              The filter control lives once, in TopNavigation's sticky header,
              which stays mounted above this view — a second one here was a
              duplicate that opened the identical filter modal. */}
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              aria-label="Back"
              className="w-12 h-12 rounded-full bg-[#F6F8FA] hover:bg-[#ECEFF3] active:bg-[#DFE1E6] text-[#1A1B25] flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0"
            >
              <ChevronLeft size={22} strokeWidth={2.5} />
            </button>

            <button
              onClick={() => onCreateBoard(currentOption.label)}
              aria-label="Create Board"
              className="w-12 h-12 rounded-full bg-[#FE6349] hover:bg-[#ff5833] active:bg-[#e05234] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0"
            >
              <Plus size={22} strokeWidth={2.5} />
            </button>
          </div>

          {/* Current Message Board / Event Category Name + Count */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1B25] tracking-tight">
              {currentOption.label} ({formatCount(matchedPosts.length)})
            </h1>
          </div>

          {/* Search Section — matches TopNavigation's search bar exactly. */}
          <div className="relative w-full">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none z-10">
              <Search size={18} strokeWidth={2.2} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, name...."
              className="w-full h-10 py-0 bg-gray-25 border-0 rounded-full pl-12 pr-10 text-sm text-gray-800 placeholder:text-gray-400 focus:bg-gray-50 active:bg-gray-50 focus:outline-none appearance-none transition-colors duration-200"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 aspect-square flex items-center justify-center text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-all cursor-pointer"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            )}
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

  const handleEngagementPromptSendLove = () => {
    handleDismissEngagementPrompt();
    setContributionParentPost(null);
    setEditingPost(null);
    setEditingContribution(null);
    setEditMode(null);
    goToCreate({ mode: 'create_message' });
  };

  /**
   * Where to put the user back once they have signed in.
   *
   * Captured at the moment the sign-in was demanded, so reacting to a board at
   * /board/:slug and then signing in returns to that board rather than dumping
   * them on the feed.
   */
  const authReturnToRef = useRef<string | null>(null);

  /**
   * Sends the user to the real sign-in ROUTE.
   *
   * Every gated action used to flip a piece of local state instead, so the auth
   * screen appeared at whatever address the user happened to be on: the back
   * button did not dismiss it, a refresh threw the half-finished sign-in away,
   * and /login could not be linked to from anywhere. /login and /signup are
   * already routes — use them.
   */
  const handleOpenAuth = (mode: 'login' | 'signup' = 'login', prompt?: string) => {
    const target = mode === 'signup' ? '/signup' : '/login';
    setAuthModalMode(mode);
    setAuthModalPrompt(prompt);

    if (location.pathname === target) {
      setIsAuthModalOpen(true);
      return;
    }

    authReturnToRef.current = `${location.pathname}${location.search}`;
    // pushView marks the entry as ours, so closing the auth screen goes back to
    // whatever the user was doing rather than out of the app.
    pushView(target);
  };

  // AuthContext already holds the session; this only resets local view state.
  const handleAuthSuccess = (_user: RegisteredUser, isNewRegistration?: boolean) => {
    setIsAuthModalOpen(false);
    setAuthModalPrompt(undefined);
    feed.reload();

    const returnTo = authReturnToRef.current;
    authReturnToRef.current = null;

    if (isNewRegistration) {
      // Return user to Home Page and show welcome popup
      setSelectedFilterId('moment');
      setIsWelcomeModalOpen(true);
      navigate('/', { replace: true });
      return;
    }

    // Signing in from /login or /signup has to leave that address, or the app
    // sits on an auth URL with the auth view already dismissed. Replace, so
    // Back does not return to the sign-in page. Land back on whatever the user
    // was trying to do when they were asked to sign in.
    if (location.pathname === '/login' || location.pathname === '/signup') {
      const safeReturn =
        returnTo && !returnTo.startsWith('/login') && !returnTo.startsWith('/signup')
          ? returnTo
          : '/';
      navigate(safeReturn, { replace: true });
    }
  };

  const handleSignOut = async () => {
    await logout();
    setSelectedFilterId('moment');
    // Replace, so Back does not return to a signed-in-only page. The sync
    // effect clears the profile/hashtag view when the path changes.
    navigate('/', { replace: true });
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
    goToCreate({ mode: 'create_message' });
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
  // The URL is the single source of truth for which view is showing. The
  // prototype drove profile / hashtag / board views purely from React state, so
  // none of them had an address; share links, refresh and browser back/forward
  // all failed. Closing an overlay also left a stale /board/:slug in the bar,
  // because the close handlers only reset state.
  //
  // Rules:
  //   * to OPEN a view, call the goTo* helpers (they navigate)
  //   * to CLOSE a view, call closeOverlay() (it navigates back)
  //   * never set viewingProfileUser / viewingHashtag / selectedPostIndex
  //     directly outside the effect below

  /**
   * Pushes a view and marks the history entry as one we created.
   *
   * The marker lives on the history entry itself rather than in a counter,
   * because a counter drifts the moment the user presses the browser Back
   * button, which pops an entry without telling us.
   */
  const pushView = (to: string) => {
    navigate(to, { state: { fromApp: true } });
  };

  /**
   * Closes whatever overlay is open and restores the underlying URL.
   *
   * If we pushed the current entry then something of ours sits behind it, so a
   * real history back keeps the in-app close button and the browser Back button
   * behaving identically. If the user deep-linked straight here there is
   * nothing of ours to return to, so replace with the feed — going back would
   * take them out of the app entirely.
   */
  const closeOverlay = () => {
    const cameFromApp = (location.state as { fromApp?: boolean } | null)?.fromApp;
    if (cameFromApp) navigate(-1);
    else navigate('/', { replace: true });
  };

  const goToProfile = (user: RegisteredUser) => {
    const handle = usernameOf(user.handle);
    pushView(handle ? `/profile/${encodeURIComponent(handle)}` : '/profile');
  };

  const goToHashtag = (tag: string) => {
    pushView(`/hashtag/${encodeURIComponent(tag.replace(/^#/, ''))}`);
  };

  const goToBoard = (post: Post) => {
    pushView(`/board/${encodeURIComponent(post.slug || post.id)}`);
  };

  /**
   * Opens the composer at a real address.
   *
   * The prefill (who it is for, which hashtag, heart vs message) lives in the
   * query string rather than in React state alone, so "send a heart to @x"
   * survives a refresh and can be shared or bookmarked.
   */
  /** /board/:slug/add-message — contribute to a board. */
  const goToContribute = (post: Post) =>
    pushView(`/board/${encodeURIComponent(post.slug || post.id)}/add-message`);

  /** /board/:slug/edit — edit a board you own. */
  const goToEditBoard = (post: Post) =>
    pushView(`/board/${encodeURIComponent(post.slug || post.id)}/edit`);

  const goToCreate = (opts: {
    recipient?: string;
    tag?: string;
    mode?: 'create_message' | 'send_heart';
    eventType?: string;
  } = {}) => {
    const params = new URLSearchParams();
    if (opts.recipient) params.set('to', usernameOf(opts.recipient));
    if (opts.tag) params.set('tag', opts.tag.replace(/^#/, ''));
    if (opts.mode) params.set('mode', opts.mode);
    if (opts.eventType) params.set('event', opts.eventType);
    const qs = params.toString();
    pushView(qs ? `/create?${qs}` : '/create');
  };

  /** Board prev/next swaps the address in place rather than stacking history. */
  const replaceBoard = (post: Post) => {
    navigate(`/board/${encodeURIComponent(post.slug || post.id)}`, { replace: true });
  };

  /**
   * Leaves a board that no longer exists.
   *
   * Uses replace rather than a history back so the dead /board/:slug is dropped
   * from the stack entirely — going Back onto a deleted board would 404.
   */
  const leaveDeletedBoard = () => {
    navigate('/', { replace: true });
  };


  const {
    user: currentUser,
    isAuthenticated,
    needsProfileSetup,
    isEmailVerified,
    ready: authReady,
    logout,
  } = useAuth();

  // Raises browser notifications for the two Settings toggles. No-op until the
  // user has enabled a toggle and granted permission.
  useHeartboardNotifications();

  // Server-paginated discover feed, replacing INITIAL_MOCK_POSTS.
  const feed = useDiscoverFeed({ currentUserId: currentUser?.id, enabled: authReady });
  const { posts: rawPosts, setPosts, patchPost, removePost, prependPost } = feed;

  /**
   * The signed-in user's own reactions, board id -> reactions.
   *
   * Kept apart from the feed rows because the board list responses are cached
   * server-side with no viewer in the key and can only carry the totals. This
   * is the viewer-dependent half, from GET /board/likes/me, and it is also the
   * source of truth for optimistic toggles — merging it over the feed below
   * means a reaction cannot be lost when a page reloads or the feed refreshes.
   */
  const [myReactions, setMyReactions] = useState<Record<string, ClientReaction[]>>({});

  useEffect(() => {
    if (!authReady || !currentUser) {
      setMyReactions({});
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const map = await boardApi.getMyReactions();
        if (cancelled) return;
        const mapped: Record<string, ClientReaction[]> = {};
        Object.entries(map).forEach(([boardId, list]) => {
          const picked = toClientReactions(list);
          if (picked.length) mapped[boardId] = picked;
        });
        setMyReactions(mapped);
      } catch {
        // No reactions rendered as picked; toggling still works.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authReady, currentUser?.id]);

  const posts = useMemo(
    () =>
      rawPosts.map((p) => {
        const mine = myReactions[p.id];
        if (!mine && !(p.userReactions && p.userReactions.length)) return p;
        return { ...p, userReactions: mine ?? [] };
      }),
    [rawPosts, myReactions],
  );

  const [selectedFilterId, setSelectedFilterId] = useState<string>('moment');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterModalMode, setFilterModalMode] = useState<'events' | 'hearts'>('events');
  const [activeFilter, setActiveFilter] = useState<'all' | 'tears' | 'vouch' | 'hype'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  // Seeded from the address so a cold load of /profile paints the heartboard
  // directly, rather than flashing the feed until the sync effect below runs.
  const [activeNavTab, setActiveNavTab] = useState<'home' | 'hearts'>(() =>
    window.location.pathname === '/profile' ? 'hearts' : 'home',
  );
  const [heartFilter, setHeartFilter] = useState<'received' | 'sent'>('received');

  // Authentication & Onboarding State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [authModalPrompt, setAuthModalPrompt] = useState<string | undefined>(undefined);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(() => {
    // Someone following a shared link came for a specific board or profile.
    // Opening a generic welcome dialogue over it buries what they clicked.
    const deepLinked = /^\/(board|profile|hashtag)\//.test(window.location.pathname);
    if (deepLinked) return false;
    try {
      const hasSeen = localStorage.getItem('heartboard_welcome_dismissed');
      return !hasSeen;
    } catch (e) {
      return false;
    }
  });


  const path = location.pathname;
  const profileMatch = path.match(/^\/profile\/([^/]+)$/);
  const hashtagMatch = path.match(/^\/hashtag\/([^/]+)$/);
  // Also matches the composer sub-routes, so the board stays resolved
  // underneath /board/:slug/add-message and /board/:slug/edit.
  const boardMatch = path.match(/^\/board\/([^/]+)(?:\/(add-message|edit))?$/);
  const boardSlug = boardMatch ? decodeURIComponent(boardMatch[1]) : null;
  const boardSubRoute = boardMatch?.[2] as 'add-message' | 'edit' | undefined;

  // Which board is open is DERIVED from the slug in the URL, never stored.
  //
  // It used to be an index into `posts`, which broke as soon as the list
  // changed underneath it: prepending a deep-linked board shifted every index,
  // so the modal briefly addressed — and started loading — a different board.
  // Deriving from the slug makes that impossible.
  const selectedPostIndex = useMemo(() => {
    if (!boardSlug) return null;
    const i = posts.findIndex((p) => p.slug === boardSlug || p.id === boardSlug);
    return i === -1 ? null : i;
  }, [boardSlug, posts]);

  const isAnyModalOpen = isAuthModalOpen || isCreateModalOpen || isFilterModalOpen || isWelcomeModalOpen || selectedPostIndex !== null;

  const {
    isPromptOpen: isEngagementPromptOpen,
    activeTriggerReason: engagementTriggerReason,
    dismissPrompt: handleDismissEngagementPrompt,
    recordBoardViewed,
    recordUserCreatedMessageOrHeart,
  } = useEngagementPrompt(currentUser, posts, isAnyModalOpen);

  // URL -> state, on navigation ONLY.
  //
  // Deliberately depends on the pathname alone. An earlier version also
  // depended on posts.length, which meant loading the next page of the feed
  // re-ran this and closed whatever modal the user had open.
  useEffect(() => {
    const isAuthPath = path === '/login' || path === '/signup';
    const isCreatePath = path === '/create' || Boolean(boardSubRoute);

    // The bottom-nav tab is part of the address like everything else: /profile
    // is the Hearts tab, every other base route is Home. Overlay routes (auth,
    // the composer, an open board) sit on top of whichever tab was showing, so
    // they leave it alone.
    //
    // This used to be state nothing ever reset, so the personal heartboard
    // leaked onto the home feed: returning to / from /profile kept rendering
    // it, and the heart tab flipped the state without navigating at all.
    if (!isAuthPath && !isCreatePath && !boardSlug) {
      setActiveNavTab(path === '/profile' ? 'hearts' : 'home');
    }

    // Route-backed overlays follow the URL exactly. Contextual opens (e.g.
    // "send a message to @x") set their own state and have no address, so they
    // are unaffected — this effect no longer runs unless the path changes.
    setIsAuthModalOpen(isAuthPath);
    if (isAuthPath) {
      setAuthModalMode(path === '/signup' ? 'signup' : 'login');
      // The OAuth callback bounces back to /login?error=... on failure. Without
      // this the modal just reopens with no explanation.
      const oauthError = new URLSearchParams(location.search).get('error');
      if (oauthError) {
        setAuthModalPrompt(
          oauthError === 'oauth_failed'
            ? 'Google sign-in was cancelled or failed. Try again, or sign in with your email.'
            : 'Sign-in failed. Please try again.',
        );
      }
    }
    setIsCreateModalOpen(isCreatePath);

    if (isCreatePath && !boardSubRoute) {
      // Restore the composer's prefill from the query string, so /create?to=x
      // works on a cold load, a refresh, or a shared link.
      const q = new URLSearchParams(location.search);
      const to = q.get('to');
      const tag = q.get('tag');
      const mode = q.get('mode');
      const event = q.get('event');

      setCreateModalHashtag(tag ? `#${tag.replace(/^#/, '')}` : undefined);
      setCreateModalMode(
        mode === 'send_heart' || mode === 'create_message' ? mode : undefined,
      );
      setCreateModalEventType(event ?? undefined);

      if (to) {
        // Show a stub immediately, then fill in the real name and avatar.
        setCreateModalRecipient((prev) =>
          prev && usernameOf(prev.handle) === to.toLowerCase()
            ? prev
            : { name: to, handle: `@${to}` },
        );
        void userApi
          .getPublicProfile(to)
          .then(({ user }) => {
            const view = userToRegisteredUser(user);
            setCreateModalRecipient({
              id: view.id,
              name: view.name,
              handle: view.handle,
              avatar: view.avatar,
            });
          })
          .catch(() => {
            // Unknown handle: keep the stub so the composer still opens.
          });
      } else {
        setCreateModalRecipient(undefined);
      }
    }

    // Your own handle is not somebody else's profile — leave it to the redirect
    // below, which swaps the address for /profile. Setting the view here first
    // would paint the public copy of your own account for a frame on the way.
    if (profileMatch && !isOwnProfileUrl) {
      const handle = decodeURIComponent(profileMatch[1]);
      // Only replace the object when the target actually changed, so a data
      // refresh does not clobber a richer profile already loaded.
      if (usernameOf(viewingProfileUser?.handle) !== handle.toLowerCase()) {
        setViewingProfileUser(userFromHandle(handle));
      }
      setViewingHashtag(null);
      return;
    }

    if (hashtagMatch) {
      setViewingHashtag(decodeURIComponent(hashtagMatch[1]));
      setViewingProfileUser(null);
      return;
    }

    if (path === '/profile') {
      setViewingProfileUser(null);
      setViewingHashtag(null);
      return;
    }

    // Board, feed, and everything else: no profile or hashtag view.
    setViewingProfileUser(null);
    setViewingHashtag(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, location.search, boardSubRoute]);

  // ── Search destinations ────────────────────────────────────────────────────
  //
  // Both of these views used to render from `posts` alone — the loaded page of
  // the discover feed. So picking a person or a hashtag out of search navigated
  // correctly and then showed nothing: a placeholder profile built from the
  // handle in the URL (no real name, avatar or counts, because goToProfile
  // discards the user object it was handed), or a hashtag page filtered against
  // twelve unrelated feed cards. The endpoints for both already existed and
  // were never called.

  const profileHandleInUrl = profileMatch ? decodeURIComponent(profileMatch[1]) : null;
  const hashtagTag = hashtagMatch ? decodeURIComponent(hashtagMatch[1]) : null;

  /**
   * True when the signed-in user is looking at their OWN handle's public page.
   *
   * /profile/:username is the read-only view of somebody else — no settings, no
   * private boards, no edit controls — so landing on your own there gives you a
   * hollow copy of a page you already have. /profile is the real one. The
   * redirect below sends you to it.
   */
  const isOwnProfileUrl = Boolean(
    profileHandleInUrl &&
      currentUser?.handle &&
      usernameOf(currentUser.handle).toLowerCase() === profileHandleInUrl.toLowerCase(),
  );

  /**
   * The handle to FETCH, which is nothing while we are bouncing to /profile.
   *
   * Kept separate from the URL so the redirect does not first spend a request
   * on the public copy of your own account, nor flash it on screen.
   */
  const profileHandle = isOwnProfileUrl ? null : profileHandleInUrl;

  /** Boards owned by the profile on screen, from GET /user/profile/:username. */
  const [profileBoards, setProfileBoards] = useState<Post[] | null>(null);
  /**
   * True while the real account behind the handle in the URL is still loading.
   *
   * Until it lands, all we have is a stub built from the handle: a name guessed
   * by capitalising it and a generated avatar. Rendering that and then swapping
   * in the real name and photo looked like one profile turning into a different
   * person, so the view shows placeholders for this instead.
   */
  const [profileLoading, setProfileLoading] = useState(false);
  /** Boards carrying the hashtag on screen, from GET /board/hashtag/:tag. */
  const [hashtagBoards, setHashtagBoards] = useState<Post[] | null>(null);

  useEffect(() => {
    if (!profileHandle) {
      setProfileBoards(null);
      setProfileLoading(false);
      return;
    }

    let cancelled = false;
    setProfileBoards(null);
    setProfileLoading(true);

    (async () => {
      try {
        const { user, boards } = await userApi.getPublicProfile(profileHandle);
        if (cancelled) return;

        // Upgrade the URL-derived stub to the real account, so the header shows
        // their display name, avatar and stats — and so the board filtering in
        // HeartboardView can match on a real id.
        const author = userToRegisteredUser(user);
        setViewingProfileUser(author);

        // This endpoint selects the board fields it needs and leaves `owner`
        // out, so boardToPost cannot resolve an author and HeartboardView's
        // "did this person create it" check would reject every one of them.
        // They are this account's public boards by definition — say so.
        setProfileBoards(
          boards.map((b) => ({
            ...boardToPost(b, currentUser?.id),
            authorId: author.id,
            authorName: author.name,
            authorHandle: author.handle,
            authorAvatar: author.avatar,
          })),
        );
      } catch {
        // Keep the stub; the view still renders with the handle from the URL.
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profileHandle, currentUser?.id]);

  useEffect(() => {
    if (!hashtagTag) {
      setHashtagBoards(null);
      return;
    }

    let cancelled = false;
    setHashtagBoards(null);

    (async () => {
      try {
        const { boards } = await boardApi.getBoardsByHashtag(hashtagTag, { limit: 40 });
        if (!cancelled) setHashtagBoards(boards.map((b) => boardToPost(b, currentUser?.id)));
      } catch {
        // Fall back to filtering whatever the feed already has.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hashtagTag, currentUser?.id]);

  // /profile is the signed-in user's own heartboard, so it needs a session to
  // render anything. The bottom-nav heart button already asks a guest to sign
  // in, but a direct link, a refresh, or a sign-out bypasses that and left an
  // empty "My Heartboard" on screen. Wait for the session check before
  // deciding — otherwise a reload bounces the signed-in user to /login.
  useEffect(() => {
    if (!authReady || currentUser) return;

    if (path === '/profile') {
      authReturnToRef.current = '/profile';
      setAuthModalPrompt('Please sign in or create an account to access your personal Heartboard.');
      navigate('/login', { replace: true });
      return;
    }

    // The composer routes write on submit, so reaching one without a session —
    // a shared /create link, a refresh after signing out — has to ask for one
    // up front rather than at the end. The return path brings them straight
    // back to the composer they were headed for.
    if (path === '/create' || boardSubRoute) {
      authReturnToRef.current = `${path}${location.search}`;
      setAuthModalPrompt('Please sign in or create an account to post on Heartboard.');
      navigate('/login', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, currentUser, path, boardSubRoute]);

  /**
   * Your own handle in the URL sends you to your own Heartboard.
   *
   * /profile/:username is the view OTHER people get: public boards only, no
   * settings, no edit controls, and a "Heart" button you cannot press on
   * yourself. Reaching it as its owner — from a share link, a bookmark, or your
   * own name in a ticker — showed that stripped-down copy instead of the page
   * you actually have at /profile.
   *
   * Waits for authReady, or a refresh would resolve the public page before the
   * session lands. Replaces rather than pushes, so Back leaves cleanly instead
   * of returning to a URL that immediately redirects again.
   */
  useEffect(() => {
    if (!authReady || !isOwnProfileUrl) return;
    // Drop the stub the URL sync built from the handle before navigating. On a
    // cold load the session resolves AFTER that effect has already run, and the
    // path is what it keys on — so without this the public view stays on screen
    // until the redirect lands.
    setViewingProfileUser(null);
    navigate('/profile', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, isOwnProfileUrl]);

  // Cold load of /board/:slug/add-message or /board/:slug/edit: the composer
  // needs its parent board, which only exists once the board has resolved.
  useEffect(() => {
    if (!boardSlug) return;
    const idx = selectedPostIndex;
    if (idx !== null && boardSubRoute) {
      const parent = posts[idx];
      if (boardSubRoute === 'add-message') {
        setContributionParentPost(parent);
        setEditingPost(null);
        setEditingContribution(null);
        setEditMode(null);
        setCreateModalMode('create_message');
      } else {
        setEditingPost(parent);
        setEditingContribution(null);
        setContributionParentPost(null);
        setEditMode('board');
      }
    }
  }, [boardSlug, boardSubRoute, posts, selectedPostIndex]);

  /**
   * Deep link to a board that is not in the loaded feed — a shared link, a
   * private board, or simply one further down the pagination. Fetch it on its
   * own and prepend it so the URL resolves to something.
   */
  const fetchedSlugRef = useRef<string | null>(null);
  const [boardNotFound, setBoardNotFound] = useState<string | null>(null);

  // Latest posts, read inside the effect below without becoming a dependency.
  const postsRef = useRef(posts);
  postsRef.current = posts;

  useEffect(() => {
    if (!boardSlug) {
      setBoardNotFound(null);
      fetchedSlugRef.current = null;
      return;
    }
    if (postsRef.current.some((p) => p.slug === boardSlug || p.id === boardSlug)) return;
    if (fetchedSlugRef.current === boardSlug) return;

    fetchedSlugRef.current = boardSlug;
    setBoardNotFound(null);

    // Deliberately keyed on boardSlug ALONE. Depending on `posts` meant the
    // discover feed resolving mid-flight re-ran this effect, and the cleanup
    // cancelled the in-flight request — so a 404 never surfaced and the page
    // sat silently on a board that does not exist.
    let cancelled = false;

    (async () => {
      try {
        const { board } = await boardApi.getBoardBySlug(boardSlug);
        if (cancelled) return;
        prependPost(boardToPost(board, currentUser?.id));
        setBoardNotFound(null);
      } catch (e) {
        if (cancelled) return;
        const err = toApiError(e);
        setBoardNotFound(
          err.status === 403
            ? 'This board is private.'
            : err.status === 404
              ? 'That board could not be found.'
              : err.message,
        );
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardSlug]);

  const handleGiftHeartForUser = (user: RegisteredUser) => {
    if (!currentUser) {
      handleOpenAuth('login', `Please sign in or create an account to gift a heart token to ${user.name}.`);
      return;
    }
    setCreateModalRecipient({
      id: user.id,
      name: user.name,
      handle: user.handle,
      avatar: user.avatar,
    });
    goToCreate({ recipient: user.handle, mode: 'send_heart' });
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
      avatar: user.avatar,
    });
    goToCreate({ recipient: user.handle, mode: 'create_message' });
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
    goToCreate({ tag, mode: 'create_message' });
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

  /**
   * Switches the bottom-nav tab by navigating, since the tab lives in the URL.
   *
   * Setting state alone left the address on / while the personal heartboard
   * rendered over the feed. The guards keep a repeat tap on the current tab
   * from stacking duplicate history entries.
   */
  /**
   * Resets the feed to its default view: no search, no event category, no
   * category filter. Navigation is the caller's job — the brand link is a real
   * <Link> and does its own, while the bottom nav has to navigate explicitly.
   */
  const resetFeedView = () => {
    setSearchQuery('');
    setSelectedFilterId('moment');
    setActiveFilter('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabChange = (tab: 'home' | 'hearts') => {
    if (tab === 'hearts') {
      if (path !== '/profile') pushView('/profile');
      return;
    }
    // Home returns to the unfiltered feed. Pressing it from inside an event
    // category used to leave that category selected, so "Home" appeared to do
    // nothing. (The heartboard never reads activeFilter, which is why switching
    // to it has no business touching these.)
    resetFeedView();
    if (path !== '/') navigate('/');
  };

  const handleNewPost = (newPost: any) => {
    // If it's a heart token (from Send Heart / Blow Heart)
    const isHeart = Boolean(
      newPost.isHeartToken || 
      newPost.type === 'heart_token' || 
      newPost.section === 'hearts' || 
      (Array.isArray(newPost.selectedHearts) && newPost.selectedHearts.length > 0 && !newPost.mediaType && newPost.type !== 'image' && newPost.type !== 'audio' && newPost.type !== 'text')
    );

    // A heart token is NOT a board and never belongs in the discover feed — it
    // lives on the sender's and the recipient's Heartboards, and nowhere else.
    // It used to be prepended here, which is why hearts turned up among the
    // boards on the home page.
    if (isHeart) {
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

  /**
   * What the home feed is allowed to show.
   *
   * This used to also require a board to have picked up reactions — 50 of them,
   * or at least one if somebody else made it — so a board nobody had reacted to
   * yet was invisible on the feed the moment it was published. Which tab a
   * board lands in is decided by its reactions below; whether it appears at all
   * is just a visibility question.
   */
  const momentPosts = posts.filter(canViewPostPublicly);

  const query = searchQuery.trim().toLowerCase();

  // Count of real matching accounts, for the feed's "showing results for…"
  // banner. Only ever rendered while searching, so it never needs browse
  // results — and must not report them, or the banner would claim the browse
  // list as matches for the query.
  const appSearch = useSearch(searchQuery, currentUser?.id, { enabled: query.length >= 2 });
  const matchingUsersCount = appSearch.active ? appSearch.users.length : 0;

  const filteredPosts = momentPosts.filter(post => {
    // The four tabs ARE the reactions, read back off the board: hearts land it
    // in Most Loved Today, claps and sads in This Moved People, sads in This
    // Made People Cry, smileys and fires in Joyful Posts. A board can therefore
    // sit in more than one, which is only honest — people reacted to it in more
    // than one way. It used to filter on `category`, a bucket the composer
    // guessed from the media type at publish time and nobody could change.
    if (!postMatchesFeedTab(post.reactionCounts, activeFilter)) {
      return false;
    }
    // Filter search query
    if (query) {
      const author = (post.authorName || '').toLowerCase();
      // No targetId fallback: it is the board's slug, not a recipient.
      const recipient = (post.recipientName || '').toLowerCase();
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
  const { hydrating: boardHydrating } = useBoardMessages(openPost, currentUser?.id, patchPost);

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
                setAuthModalPrompt(undefined);
                // /login and /signup are real routes; closing must leave them,
                // otherwise the modal reopens on the next render pass.
                if (location.pathname === '/login' || location.pathname === '/signup') {
                  closeOverlay();
                } else {
                  setIsAuthModalOpen(false);
                }
              }}
              onAuthSuccess={handleAuthSuccess}
            />
          </main>
        ) : viewingHashtag ? (
          <main className="flex-grow bg-white">
            <HashtagView
              hashtag={viewingHashtag}
              // Server results for this tag; the loaded feed until they arrive.
              posts={hashtagBoards ?? posts}
              onBack={closeOverlay}
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
              onBack={closeOverlay}
              onGiftHeart={handleGiftHeartForUser}
              onSendMessage={handleSendMessageForUser}
              onSelectUser={handleSelectUser}
              isProfileLoading={profileLoading}
              // This person's own boards, not the discover feed. Empty rather
              // than the feed while loading, so no unrelated board flashes up
              // under someone else's name.
              posts={profileBoards ?? (profileLoading ? [] : posts)}
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
              onGoToProfile={() => pushView('/profile')}
              onGoHome={resetFeedView}
            />
            
            {selectedFilterId === 'moment' ? (
              <>
                {/* Concentric radar hero feed */}
                <HeroPulseFeed
                  onGiftVouchClick={() => {
                    if (!currentUser) {
                      handleOpenAuth('login', 'Please sign in or create an account to gift a vouch.');
                      return;
                    }
                    goToCreate();
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
                    loading={feed.loading}
                    loadingMore={feed.loadingMore}
                    error={feed.error}
                    hasMore={feed.hasMore}
                    onLoadMore={feed.loadMore}
                    onRetry={feed.reload}
                  />
                </main>
              </>
            ) : (
              <main className="flex-grow bg-white">
                <EventCategoryView 
                  filterId={selectedFilterId}
                  posts={posts}
                  onBack={() => setSelectedFilterId('moment')}
                  onPostClick={(index) => {
                    const target = posts[index];
                    if (target) {
                      goToBoard(target);
                      recordBoardViewed();
                    }
                  }}
                  onCreateBoard={(eventType) => {
                    if (!currentUser) {
                      handleOpenAuth('login', 'Please sign in or create an account to create a board.');
                      return;
                    }
                    goToCreate({ mode: 'create_message', eventType });
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
              // handleTabChange navigates; the URL -> state effect clears the
              // profile and hashtag views on arrival.
              handleTabChange(tab);
            }}
            onPlusClick={() => {
              if (!currentUser) {
                handleOpenAuth('login', 'Please sign in or create an account to create a board or message.');
                return;
              }
              goToCreate();
            }} 
          />
        )}

        {isCreateModalOpen && (
          <CreateAppreciationModal 
            onClose={() => {
              // /create is a real route; closing must leave it, or the sync
              // effect immediately reopens the modal.
              if (location.pathname === '/create') closeOverlay();
              else setIsCreateModalOpen(false);
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
            // The composer has always taken this prop and never been given it,
            // so every contribution it posted was attributed to "@guest" and
            // the send-heart flow had no idea who was blowing the heart.
            currentUser={currentUser}
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
              leaveDeletedBoard();
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

        {/* A /board/:slug that could not be loaded — private, deleted, or a bad
            link. Without this the address bar showed a board while the page
            silently rendered the feed underneath. */}
        {boardSlug && boardNotFound && selectedPostIndex === null && (
          <div className="fixed inset-0 z-[1500] bg-[#F8F9FB] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xs border border-[#ECEFF3] text-center">
              <div className="w-12 h-12 rounded-full bg-[#FE6349]/10 text-[#FE6349] flex items-center justify-center mx-auto mb-4 text-2xl">
                💛
              </div>
              <h2 className="text-xl font-extrabold text-[#1A1B25] mb-2">
                This board is not available
              </h2>
              <p className="text-sm text-[#666D80] mb-6">{boardNotFound}</p>
              <button
                onClick={closeOverlay}
                className="px-6 py-2.5 bg-[#FE6349] hover:bg-[#e05234] text-white font-bold rounded-full text-sm transition-all cursor-pointer"
              >
                Back to Heartboard
              </button>
            </div>
          </div>
        )}

        {selectedPostIndex !== null && posts[selectedPostIndex] && (
          <MediaModal 
            post={posts[selectedPostIndex]} 
            currentUser={currentUser}
            isHydrating={boardHydrating}
            onRequireAuth={(prompt) => handleOpenAuth('login', prompt)}
            // Closing the board restores the previous URL. Previously this only
            // reset state, leaving /board/:slug stale in the address bar.
            onClose={closeOverlay}
            // Prev/next swap the address in place, so paging through boards
            // does not bury the feed under a long history stack.
            onPrev={() => {
              const target = posts[(selectedPostIndex - 1 + posts.length) % posts.length];
              if (target) replaceBoard(target);
            }}
            onNext={() => {
              const target = posts[(selectedPostIndex + 1) % posts.length];
              if (target) replaceBoard(target);
            }}
            onSelectUser={(user) => handleSelectUser(user)}
            onSelectHashtag={(tag) => handleSelectHashtag(tag)}
            onAddContributionClick={(parentPost) => {
              // Contributing writes a message, so it needs a session. Without
              // this the composer opened for a guest and only failed with a 401
              // after they had written the whole thing.
              if (!currentUser) {
                handleOpenAuth('login', 'Please sign in or create an account to add a message to this board.');
                return;
              }
              setContributionParentPost(parentPost);
              setCreateModalRecipient(undefined);
              setCreateModalHashtag(undefined);
              setCreateModalMode('create_message');
              setEditingPost(null);
              setEditingContribution(null);
              setEditMode(null);
              goToContribute(parentPost);
            }}
            onEditBoard={(targetPost) => {
              setEditingPost(targetPost);
              setEditingContribution(null);
              setContributionParentPost(null);
              setEditMode('board');
              goToEditBoard(targetPost);
            }}
            onDeleteBoard={async (postId) => {
              const snapshot = posts;
              removePost(postId);
              leaveDeletedBoard();
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
                    leaveDeletedBoard();
                  }
                } catch (e) {
                  setPosts(snapshot);
                  window.alert(toApiError(e).message);
                }
              } else {
                removePost(targetPost.id);
                leaveDeletedBoard();
                try {
                  await boardApi.deleteBoard(targetPost.id);
                } catch (e) {
                  setPosts(snapshot);
                  window.alert(toApiError(e).message);
                }
              }
            }}
            // Reacting is recorded for the engagement prompt only. Persisting
            // the reaction is onUpdateReactions' job — this used to also call
            // the like TOGGLE, so picking a second reaction quietly un-liked
            // the board and the count went down instead of up.
            onReactionBlown={() => recordUserCreatedMessageOrHeart()}
            onUpdateReactions={async (postId, counts, userReactions) => {
              const previousMine = myReactions[postId] ?? [];
              const previousCounts = rawPosts.find((p) => p.id === postId)?.reactionCounts;
              const previousTotal = rawPosts.find((p) => p.id === postId)?.reactions ?? 0;

              // Optimistic: the picker should not wait on a round trip.
              setMyReactions((prev) => ({ ...prev, [postId]: userReactions }));
              patchPost(postId, {
                reactionCounts: counts,
                reactions: totalReactions(counts),
              });

              try {
                // PATCH /board/:id/reaction replaces the whole set, so it is
                // also how a reaction is REMOVED. Nothing persisted reactions
                // at all before this — they lived in React state and were gone
                // on the next refresh.
                const saved = await boardApi.setReactions(postId, fromClientReactions(userReactions));
                const serverCounts = toReactionCounts(saved.reactionCounts);
                patchPost(postId, {
                  reactionCounts: serverCounts,
                  reactions: totalReactions(serverCounts) || saved.likeCount,
                });
                setMyReactions((prev) => ({ ...prev, [postId]: toClientReactions(saved.reactions) }));
              } catch (e) {
                setMyReactions((prev) => ({ ...prev, [postId]: previousMine }));
                patchPost(postId, { reactionCounts: previousCounts, reactions: previousTotal });
                if (toApiError(e).status === 401) {
                  handleOpenAuth('login', 'Sign in to react to this board.');
                }
              }
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
