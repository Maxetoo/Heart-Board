import React, { useState } from 'react';
import { 
  ChevronLeft, 
  Plus, 
  Hash, 
  Share2
} from 'lucide-react';
import { PostCard } from './PostCard';
import { RegisteredUser, PostVisibility } from '../types';
import { ShareProfileModal } from './ShareProfileModal';

export interface HashtagViewProps {
  hashtag: string; // e.g. "#ronaldo" or "ronaldo"
  posts: any[];
  onBack: () => void;
  onCreateBoard: (hashtag: string) => void;
  onPostClick?: (post: any) => void;
  onSelectUser?: (user: RegisteredUser) => void;
}

export const HashtagView: React.FC<HashtagViewProps> = ({
  hashtag,
  posts = [],
  onBack,
  onCreateBoard,
  onPostClick
}) => {
  const [searchQuery] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Format clean hashtag string
  const cleanHashtag = hashtag.trim().startsWith('#') ? hashtag.trim() : `#${hashtag.trim()}`;
  const rawTag = cleanHashtag.replace('#', '').toLowerCase();

  // Filter posts that belong to this hashtag
  const matchingPosts = posts.filter(post => {
    // Check privacy
    if (post.visibility === PostVisibility.PRIVATE) {
      if (!post.isCreatedByUser && (!Array.isArray(post.recipients) || !post.recipients.some((r: string) => r === '@you' || r.toLowerCase().includes('you')))) {
        return false;
      }
    }

    // Check hashtags array
    if (Array.isArray(post.hashtags)) {
      if (post.hashtags.some((h: string) => h.toLowerCase().replace('#', '') === rawTag)) {
        return true;
      }
    }
    // Check recipients array
    if (Array.isArray(post.recipients)) {
      if (post.recipients.some((r: string) => r.toLowerCase().replace('#', '').replace('@', '') === rawTag)) {
        return true;
      }
    }
    // No targetId check: it holds the board's slug, so matching it against a
    // tag only ever produced false positives (a board slugged '#birthday' is
    // not a board tagged #birthday). The recipients and hashtags checks above
    // are where a real tag lives.
    // Check content or caption
    const textToSearch = `${post.content || ''} ${post.caption || ''}`.toLowerCase();
    if (textToSearch.includes(`#${rawTag}`) || textToSearch.includes(rawTag)) {
      return true;
    }
    return false;
  });

  // Filter matching posts by search query if user types in search
  const filteredPosts = searchQuery.trim() 
    ? matchingPosts.filter(p => p.content?.toLowerCase().includes(searchQuery.toLowerCase()) || p.authorName?.toLowerCase().includes(searchQuery.toLowerCase()))
    : matchingPosts;

  const handleShareHashtag = () => {
    setIsShareModalOpen(true);
  };

  // Mock engagement stats formatted like "1.2M Board | 800k Message | 30k Curator"
  const totalBoardCount = Math.max(matchingPosts.length, 12) * 100000;
  const boardsDisplay = matchingPosts.length > 5 ? `${(totalBoardCount / 1000000).toFixed(1)}M Board` : '1.2M Board';
  const messagesDisplay = '800k Message';
  const curatorsDisplay = '30k Curator';

  return (
    <div className="min-h-screen bg-white text-[#1A1B25] pt-4 pb-28 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto font-sans antialiased select-none">
      
      {/* 1. Header Navigation: Back button & Share action */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <button 
          aria-label="Go Back"
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-[#1A1B25] transition-all cursor-pointer shadow-2xs active:scale-95"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>

        <div className="flex items-center gap-2">
          <button 
            aria-label="Share Hashtag Community"
            onClick={handleShareHashtag}
            className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-[#353849] transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <Share2 className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* 2. Grid Container for Hashtag Card + Message Boards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-6 lg:gap-8 items-stretch">
        
        {/* SLOT 1: Specialized Hashtag Hero Card (Matching reference image) */}
        <div className="bg-white rounded-2xl sm:rounded-[2.5rem] p-3 sm:p-8 border border-gray-100 shadow-2xs hover:shadow-md transition-all flex flex-col items-center justify-center text-center aspect-[380/474] relative overflow-hidden group">
          
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-rose-50/30 to-transparent pointer-events-none" />

          {/* Hashtag Avatar Circle */}
          <div className="w-14 h-14 sm:w-32 sm:h-32 rounded-full bg-[#FAF0EC] border-2 border-rose-100/60 flex items-center justify-center shrink-0 mb-2 sm:mb-4 shadow-2xs relative overflow-hidden group-hover:scale-105 transition-transform">
            <div className="w-8 h-8 sm:w-20 sm:h-20 rounded-full bg-[#FFB5A9]/20 flex items-center justify-center text-[#FE6349]">
              <Hash className="w-4 h-4 sm:w-12 sm:h-12 stroke-[2.5]" />
            </div>
          </div>

          {/* Hashtag Title */}
          <h1 className="text-sm sm:text-3xl font-extrabold text-[#1A1B25] tracking-tight mb-2 sm:mb-3 truncate max-w-full px-1">
            {cleanHashtag}
          </h1>

          {/* Create Board CTA Button */}
          <button
            onClick={() => onCreateBoard(cleanHashtag)}
            className="bg-[#FE6349] hover:bg-[#e05238] active:scale-95 text-white text-xs sm:text-base font-extrabold px-3 py-1.5 sm:px-7 sm:py-3 rounded-full shadow-md hover:shadow-lg transition-all cursor-pointer mb-2 sm:mb-5 flex items-center gap-1.5"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 stroke-[3]" />
            <span>Create Board</span>
          </button>

          {/* Sub-stats label */}
          <p className="text-[10px] sm:text-sm font-semibold text-[#808897] tracking-tight truncate max-w-full">
            {boardsDisplay} &nbsp;|&nbsp; {messagesDisplay}
          </p>
        </div>

        {/* SLOT 2..N: Message Boards in Platform Visual Style */}
        {filteredPosts.map((post) => (
          <div key={post.id} className="h-full">
            <PostCard 
              post={post} 
              onClick={() => onPostClick && onPostClick(post)} 
            />
          </div>
        ))}
      </div>

      {/* Empty State if no filtered posts */}
      {filteredPosts.length === 0 && (
        <div className="mt-12 text-center py-16 bg-gray-25 rounded-[2.5rem] border border-dashed border-gray-200 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-[#FE6349] flex items-center justify-center mx-auto mb-4">
            <Hash className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[#1A1B25] mb-2">
            Be the first to create a board for {cleanHashtag}!
          </h3>
          <p className="text-sm text-[#808897] max-w-md mx-auto mb-6">
            Start a public community message board under {cleanHashtag} to share appreciation, tributes, or warm wishes.
          </p>
          <button
            onClick={() => onCreateBoard(cleanHashtag)}
            className="bg-[#FE6349] hover:bg-[#e05238] text-white font-bold text-sm px-6 py-3 rounded-full shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create {cleanHashtag} Board</span>
          </button>
        </div>
      )}

      {/* Share Hashtag Community Board Modal */}
      <ShareProfileModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareData={{
          type: 'board',
          boardTitle: `${cleanHashtag} Community`,
          boardTheme: '#149B88',
          // ShareProfileModal only builds profile and board links, so a hashtag
          // has to supply its own. It was /#tag-<tag>, a prototype HashRouter
          // link that resolves to nothing under BrowserRouter.
          url: `${window.location.origin}/hashtag/${encodeURIComponent(rawTag)}`
        }}
      />
    </div>
  );
};
