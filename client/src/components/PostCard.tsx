
import React from 'react';
import { Post } from '../types';
import { ConfettiOverlay } from './ConfettiOverlay';
import { CanvasReadOnlyCard } from './CreateAppreciationModal';

interface PostCardProps {
  post: Post & { 
    theme?: string; 
    mediaType?: 'audio' | 'video' | 'image' | 'text' | 'note';
    sponsor?: string;
    sticker?: string;
    confetti?: string;
    secondaryImage?: string;
    category?: 'tears' | 'vouch' | 'hype';
    inactive?: boolean;
    disabled?: boolean;
  };
  onClick?: () => void;
  disabled?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onClick, disabled }) => {
  const isDarkTheme = post.theme === '#272835' || post.theme === 'bg-slate-900';
  const isInactive = disabled || post.disabled || post.inactive;

  const handleClick = (e: React.MouseEvent) => {
    if (isInactive) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick?.();
  };

  const getBgStyle = () => {
    if (post.theme && post.theme.startsWith('#')) {
      return { backgroundColor: post.theme };
    }
    return { backgroundColor: '#FAF0EC' }; // Cozy peach default frame color
  };

  const getBgClass = (fallback: string) => {
    if (post.theme && !post.theme.startsWith('#')) {
      return post.theme;
    }
    return fallback;
  };

  const isCollaborative = post.boardCapacity !== 'solo' && (post.maxCapacity === undefined || post.maxCapacity > 1);

  return (
    <div 
      className={`group h-full select-none ${isInactive ? 'cursor-default' : 'cursor-pointer'}`} 
      onClick={handleClick}
    >
      {/* 
        MAIN FRAME: Outer container with frame color background & concentric rings pattern.
        No shadow, clean filled style.
      */}
      <div 
        className={`relative overflow-hidden rounded-2xl sm:rounded-[2.5rem] p-2 sm:p-5 aspect-[380/474] flex flex-col justify-between ${getBgClass('bg-[#FAF0EC]')}`}
        style={getBgStyle()}
      >
        {/* 
          INNER FRAME: Inner card container strictly using CanvasReadOnlyCard
        */}
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          <CanvasReadOnlyCard
            canvasElements={post.canvasElements || []}
            selectedConfetti={post.confetti || (post as any).selectedConfetti}
            content={post.content || (post as any).title}
            uploadedImage={post.imageUrl || post.mediaUrl}
            authorName={post.authorName}
            recipient={Array.isArray((post as any).recipients) ? (post as any).recipients[0] : (post.recipientName || post.targetId)}
            selectedHearts={(post as any).selectedHearts || []}
            activeType={post.mediaType || post.type || 'text'}
            isCollaborative={isCollaborative}
            visibility={post.visibility}
            showMetadata={false}
          />
        </div>
      </div>
    </div>
  );
};


