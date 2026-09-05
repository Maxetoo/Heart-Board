import React, { useState } from 'react';
import { Check, X } from 'lucide-react';

export type ShareTargetType = 'profile' | 'board';

export interface ShareData {
  type: ShareTargetType;
  // Profile specific
  userHandle?: string;
  userName?: string;
  profileImage?: string | null;
  // Board specific
  boardId?: string;
  boardTitle?: string;
  boardThumbnail?: string;
  boardTheme?: string;
  boardMediaType?: string;
  boardAuthorName?: string;
  boardRecipientName?: string;
  // URL override if needed
  url?: string;
}

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareData?: ShareData;
  // Backwards compatibility props for direct profile sharing
  userHandle?: string;
  userName?: string;
  profileImage?: string | null;
  onShowToast?: (message: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  shareData,
  userHandle: propUserHandle,
  userName: propUserName,
  profileImage: propProfileImage,
  onShowToast,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  // Determine effective share data
  const effectiveData: ShareData = shareData || {
    type: 'profile',
    userHandle: propUserHandle || '@mickymouse',
    userName: propUserName || 'Micky Mouse',
    profileImage: propProfileImage || null,
  };

  const isProfile = effectiveData.type === 'profile';

  // Format Display texts
  const displayTitle = isProfile 
    ? (effectiveData.userHandle?.startsWith('@') ? effectiveData.userHandle : `@${effectiveData.userHandle || 'user'}`)
    : (effectiveData.boardTitle || (effectiveData.boardAuthorName ? `${effectiveData.boardAuthorName}'s Board` : 'Heartboard'));

  const displaySubtitle = isProfile 
    ? 'Write messages on my Heartboard wall'
    : 'Write messages on this heartboard';

  // Construct target URL
  const getShareUrl = () => {
    if (effectiveData.url) return effectiveData.url;
    const origin = window.location.origin;
    if (isProfile) {
      const cleanHandle = (effectiveData.userHandle || 'mickymouse').replace('@', '');
      return `${origin}/#${cleanHandle}`;
    } else {
      const boardId = effectiveData.boardId || 'board';
      return `${origin}/?board=${encodeURIComponent(boardId)}`;
    }
  };

  const shareUrl = getShareUrl();

  // Copy link handler
  const handleCopyOnlyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      onShowToast?.('Link copied to clipboard!');
    } catch {
      onShowToast?.('Link copied!');
    }
  };

  // Generate Canvas Card Image matching Images 3 & 4
  const generateCanvasImage = async (): Promise<string | null> => {
    return new Promise((resolve) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 760;
        canvas.height = 860;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        // 1. Draw Card Base with Rounded Corners
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(0, 0, 760, 860, 48);
        ctx.clip();

        // 2. Diagonal Striped Background (#FFF7F3 & #FAF0EC)
        ctx.fillStyle = '#FFF7F3';
        ctx.fillRect(0, 0, 760, 860);

        ctx.strokeStyle = '#FAF0EC';
        ctx.lineWidth = 24;
        const stripeGap = 48;
        for (let i = -860; i < 760 + 860; i += stripeGap) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i + 860, 860);
          ctx.stroke();
        }

        // 3. Top-Left Heart Bubble Logo
        const drawBubbleLogo = () => {
          const bx = 40;
          const by = 40;
          const bsize = 80;

          ctx.save();
          // Bubble background (#FE5C3E)
          ctx.fillStyle = '#FE5C3E';
          ctx.beginPath();
          ctx.roundRect(bx, by, bsize, bsize, 24);
          ctx.fill();

          // Bubble small tail pointing down-left
          ctx.beginPath();
          ctx.moveTo(bx + 14, by + bsize - 6);
          ctx.lineTo(bx - 6, by + bsize + 14);
          ctx.lineTo(bx + 30, by + bsize);
          ctx.closePath();
          ctx.fill();

          // White heart with smiley
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          const hx = bx + bsize / 2;
          const hy = by + bsize / 2 - 4;
          const hr = 18;

          ctx.moveTo(hx, hy + hr * 0.8);
          ctx.bezierCurveTo(hx - hr * 1.2, hy - hr * 0.4, hx - hr * 1.2, hy - hr * 1.1, hx - hr * 0.5, hy - hr * 1.1);
          ctx.bezierCurveTo(hx - hr * 0.1, hy - hr * 1.1, hx, hy - hr * 0.7, hx, hy - hr * 0.5);
          ctx.bezierCurveTo(hx, hy - hr * 0.7, hx + hr * 0.1, hy - hr * 1.1, hx + hr * 0.5, hy - hr * 1.1);
          ctx.bezierCurveTo(hx + hr * 1.2, hy - hr * 1.1, hx + hr * 1.2, hy - hr * 0.4, hx, hy + hr * 0.8);
          ctx.fill();

          // Smiley eyes & mouth inside heart
          ctx.fillStyle = '#FE5C3E';
          ctx.beginPath();
          ctx.arc(hx - 5, hy - 4, 1.8, 0, Math.PI * 2);
          ctx.arc(hx + 5, hy - 4, 1.8, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#FE5C3E';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(hx, hy - 2, 4, 0.2 * Math.PI, 0.8 * Math.PI, false);
          ctx.stroke();

          ctx.restore();
        };

        drawBubbleLogo();

        // 4. Center Graphic Drawing
        const finalizeAndReturn = () => {
          // Typography: Title
          ctx.fillStyle = '#1A1B25';
          ctx.font = '900 48px Nunito, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(displayTitle, 380, 570);

          // Typography: Subtitle
          ctx.fillStyle = '#50576B';
          ctx.font = '700 28px Nunito, sans-serif';
          ctx.textAlign = 'center';
          if (isProfile) {
            ctx.fillText('Write messages on my', 380, 630);
            ctx.fillText('Heartboard wall', 380, 670);
          } else {
            ctx.fillText('Write messages on this', 380, 630);
            ctx.fillText('heartboard', 380, 670);
          }

          ctx.restore();
          resolve(canvas.toDataURL('image/png'));
        };

        if (isProfile) {
          // PROFILE: Large Circular Avatar with clean border
          const avatarSize = 280;
          const avatarX = 380 - avatarSize / 2;
          const avatarY = 160;

          // White circle glow / border
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(380, avatarY + avatarSize / 2, avatarSize / 2 + 10, 0, Math.PI * 2);
          ctx.fill();

          if (effectiveData.profileImage) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              ctx.save();
              ctx.beginPath();
              ctx.arc(380, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
              ctx.clip();
              ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
              ctx.restore();
              finalizeAndReturn();
            };
            img.onerror = () => {
              // Fallback avatar
              ctx.fillStyle = '#FDF4F2';
              ctx.beginPath();
              ctx.arc(380, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#FFB5A9';
              ctx.font = 'bold 110px Nunito, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText((effectiveData.userName || 'M').charAt(0).toUpperCase(), 380, avatarY + avatarSize / 2 + 35);
              finalizeAndReturn();
            };
            img.src = effectiveData.profileImage;
          } else {
            ctx.fillStyle = '#FDF4F2';
            ctx.beginPath();
            ctx.arc(380, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFB5A9';
            ctx.font = 'bold 110px Nunito, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText((effectiveData.userName || 'M').charAt(0).toUpperCase(), 380, avatarY + avatarSize / 2 + 35);
            finalizeAndReturn();
          }
        } else {
          // BOARD: Large White Circle with Miniature Lined Note Card
          const circleSize = 300;
          const circleX = 380;
          const circleY = 300;

          // White circle backdrop
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(circleX, circleY, circleSize / 2, 0, Math.PI * 2);
          ctx.fill();

          // Miniature Card Frame
          const frameWidth = 176;
          const frameHeight = 224;
          const frameX = circleX - frameWidth / 2;
          const frameY = circleY - frameHeight / 2;
          const frameColor = effectiveData.boardTheme?.startsWith('#') 
            ? effectiveData.boardTheme 
            : '#BEE27C'; // Default vibrant lime green frame

          // Frame outer border
          ctx.fillStyle = frameColor;
          ctx.beginPath();
          ctx.roundRect(frameX, frameY, frameWidth, frameHeight, 18);
          ctx.fill();

          // Inner white notebook paper
          const paperMargin = 12;
          const paperWidth = frameWidth - paperMargin * 2;
          const paperHeight = frameHeight - paperMargin * 2;
          const paperX = frameX + paperMargin;
          const paperY = frameY + paperMargin;

          ctx.fillStyle = '#FFFDF9';
          ctx.beginPath();
          ctx.roundRect(paperX, paperY, paperWidth, paperHeight, 10);
          ctx.fill();

          // Lined paper horizontal lines
          ctx.strokeStyle = '#E8ECEF';
          ctx.lineWidth = 1.5;
          for (let ly = paperY + 24; ly < paperY + paperHeight - 16; ly += 14) {
            ctx.beginPath();
            ctx.moveTo(paperX + 8, ly);
            ctx.lineTo(paperX + paperWidth - 8, ly);
            ctx.stroke();
          }

          // Notebook spiral/punched holes on right side
          ctx.fillStyle = '#737A8C';
          [paperY + 20, paperY + paperHeight / 2, paperY + paperHeight - 20].forEach(hy => {
            ctx.beginPath();
            ctx.arc(paperX + paperWidth - 8, hy, 2.5, 0, Math.PI * 2);
            ctx.fill();
          });

          // Top red heart sticker
          const drawHeartSticker = () => {
            const hx = circleX;
            const hy = paperY + 38;
            const hr = 20;

            ctx.fillStyle = '#FE5C3E';
            ctx.beginPath();
            ctx.moveTo(hx, hy + hr * 0.8);
            ctx.bezierCurveTo(hx - hr * 1.2, hy - hr * 0.4, hx - hr * 1.2, hy - hr * 1.1, hx - hr * 0.5, hy - hr * 1.1);
            ctx.bezierCurveTo(hx - hr * 0.1, hy - hr * 1.1, hx, hy - hr * 0.7, hx, hy - hr * 0.5);
            ctx.bezierCurveTo(hx, hy - hr * 0.7, hx + hr * 0.1, hy - hr * 1.1, hx + hr * 0.5, hy - hr * 1.1);
            ctx.bezierCurveTo(hx + hr * 1.2, hy - hr * 1.1, hx + hr * 1.2, hy - hr * 0.4, hx, hy + hr * 0.8);
            ctx.fill();
          };

          drawHeartSticker();

          // Inner photo / thumbnail
          const thumbWidth = 92;
          const thumbHeight = 72;
          const thumbX = circleX - thumbWidth / 2;
          const thumbY = paperY + 68;

          const finishBoardCard = () => {
            // Caption "001" or ID beneath photo
            ctx.fillStyle = '#1A1B25';
            ctx.font = '800 15px Nunito, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('001', circleX, thumbY + thumbHeight + 20);
            finalizeAndReturn();
          };

          if (effectiveData.boardThumbnail) {
            const thumbImg = new Image();
            thumbImg.crossOrigin = 'anonymous';
            thumbImg.onload = () => {
              ctx.save();
              ctx.beginPath();
              ctx.roundRect(thumbX, thumbY, thumbWidth, thumbHeight, 4);
              ctx.clip();
              ctx.drawImage(thumbImg, thumbX, thumbY, thumbWidth, thumbHeight);
              ctx.restore();
              finishBoardCard();
            };
            thumbImg.onerror = () => {
              ctx.fillStyle = '#272835';
              ctx.fillRect(thumbX, thumbY, thumbWidth, thumbHeight);
              finishBoardCard();
            };
            thumbImg.src = effectiveData.boardThumbnail;
          } else {
            // Stylized placeholder image
            ctx.fillStyle = '#272835';
            ctx.beginPath();
            ctx.roundRect(thumbX, thumbY, thumbWidth, thumbHeight, 4);
            ctx.fill();
            ctx.fillStyle = '#F8F9FB';
            ctx.font = 'bold 12px Nunito, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Tribute', circleX, thumbY + thumbHeight / 2 + 4);
            finishBoardCard();
          }
        }
      } catch (err) {
        console.error('Canvas generation error:', err);
        resolve(null);
      }
    });
  };

  // “Share & Copy Link” Action: Generates/downloads image, triggers native share, and copies link
  const handleShareAndCopyLink = async () => {
    setDownloading(true);

    // 1. Copy link first
    await handleCopyOnlyLink();

    // 2. Generate and download card image
    try {
      const dataUrl = await generateCanvasImage();
      if (dataUrl) {
        // Trigger automatic image download
        const cleanSlug = isProfile 
          ? (effectiveData.userHandle || 'profile').replace('@', '')
          : (effectiveData.boardId || 'board');

        const link = document.createElement('a');
        link.download = `heartboard-${cleanSlug}.png`;
        link.href = dataUrl;
        link.click();

        // 3. Convert DataUrl to File to pass to Web Share API if supported
        let shareFile: File | null = null;
        try {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          shareFile = new File([blob], `heartboard-${cleanSlug}.png`, { type: 'image/png' });
        } catch {
          // ignore file conversion failure
        }

        // 4. Trigger native platform share if supported
        if (navigator.share) {
          const sharePayload: ShareData & any = {
            title: isProfile ? `${displayTitle} on Heartboard` : displayTitle,
            text: `${displaySubtitle} | ${shareUrl}`,
            url: shareUrl,
          };

          if (shareFile && navigator.canShare && navigator.canShare({ files: [shareFile] })) {
            sharePayload.files = [shareFile];
          }

          try {
            await navigator.share(sharePayload);
          } catch (shareErr) {
            // User cancelled share or window error, non-fatal
          }
        }

        onShowToast?.('Share link copied & preview card downloaded!');
      } else {
        onShowToast?.('Link copied to clipboard!');
      }
    } catch {
      onShowToast?.('Link copied to clipboard!');
    } finally {
      setDownloading(false);
    }
  };

  // Get frame background color for preview note
  const getBoardFrameBg = () => {
    const theme = effectiveData.boardTheme || '';
    if (theme.startsWith('#')) return theme;
    if (theme.includes('mint') || theme.includes('ECEFE6')) return '#ECEFE6';
    if (theme.includes('slate') || theme.includes('272835')) return '#272835';
    if (theme.includes('sunset') || theme.includes('FAF5E8')) return '#FAF5E8';
    if (theme.includes('lavender') || theme.includes('EEF1FA')) return '#EEF1FA';
    return '#BEE27C'; // default vibrant lime frame matching mockup
  };

  return (
    <div 
      className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-[380px] bg-white rounded-[2.2rem] sm:rounded-[2.6rem] shadow-2xl flex flex-col font-sans animate-in zoom-in-95 duration-200 overflow-hidden select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button Top-Right */}
        <button
          onClick={onClose}
          aria-label="Close share modal"
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-400 hover:text-gray-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs backdrop-blur-xs"
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        {/* 
          1. Upper Card Area: 
          Subtle warm diagonal stripes background matching Images 1 & 2 
        */}
        <div 
          className="relative w-full pt-8 pb-7 px-6 flex flex-col items-center justify-center overflow-hidden"
          style={{
            background: 'repeating-linear-gradient(45deg, #FFF9F6, #FFF9F6 14px, #FAF2ED 14px, #FAF2ED 28px)'
          }}
        >
          {/* Top-Left Speech Bubble Logo with Heart Smile */}
          <div className="absolute top-4 left-4 z-10">
            <div className="relative w-12 h-12 bg-[#FE5C3E] rounded-2xl flex items-center justify-center shadow-xs">
              {/* Bubble Tail */}
              <div 
                className="absolute -bottom-1.5 left-1.5 w-3.5 h-3.5 bg-[#FE5C3E] rotate-45 rounded-xs"
              />
              {/* White Heart with Smiley */}
              <div className="relative z-10 flex flex-col items-center justify-center">
                <svg className="w-6 h-6 text-white fill-current" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                {/* Smiley Face inside Heart */}
                <div className="absolute top-[42%] left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                  <div className="flex gap-1">
                    <span className="w-0.5 h-0.5 rounded-full bg-[#FE5C3E] inline-block" />
                    <span className="w-0.5 h-0.5 rounded-full bg-[#FE5C3E] inline-block" />
                  </div>
                  <div className="w-2 h-1 border-b border-[#FE5C3E] rounded-full -mt-0.5" />
                </div>
              </div>
            </div>
          </div>

          {/* 
            Center Graphic: 
            - If Profile: Circular Avatar (Image 1)
            - If Board: Circular Backdrop with Styled Board Note (Image 2)
          */}
          <div className="mt-4 mb-4 flex items-center justify-center">
            {isProfile ? (
              // Profile circular avatar
              <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full overflow-hidden bg-white shadow-md border-4 border-white/80 flex items-center justify-center shrink-0">
                {effectiveData.profileImage ? (
                  <img 
                    src={effectiveData.profileImage} 
                    alt={displayTitle} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full bg-[#FDF4F2] flex items-center justify-center text-[#FFB5A9] font-extrabold text-5xl">
                    {(effectiveData.userName || 'M').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ) : (
              // Message Board preview inside circular white halo
              <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 border border-orange-100/40">
                {/* Miniature Note Card */}
                <div 
                  style={{ backgroundColor: getBoardFrameBg() }}
                  className="w-24 h-32 rounded-xl p-1.5 flex flex-col items-center justify-between shadow-2xs relative overflow-hidden"
                >
                  {/* Notebook Paper Surface */}
                  <div className="w-full h-full bg-[#FFFDF9] rounded-lg p-1.5 flex flex-col items-center justify-between relative">
                    {/* Top Heart Sticker */}
                    <div className="w-7 h-7 -mt-0.5 flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6 text-[#FE5C3E] fill-current" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </div>

                    {/* Thumbnail image / note illustration */}
                    <div className="w-12 h-10 bg-[#272835] rounded-xs overflow-hidden shrink-0 flex items-center justify-center my-0.5 shadow-2xs">
                      {effectiveData.boardThumbnail ? (
                        <img 
                          src={effectiveData.boardThumbnail} 
                          alt="Thumbnail" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span className="text-[7px] text-white font-bold tracking-tight">Board</span>
                      )}
                    </div>

                    {/* Caption 001 */}
                    <span className="text-[8px] font-bold text-[#1A1B25] tracking-tight">
                      001
                    </span>

                    {/* Paper punched holes on right side */}
                    <div className="absolute right-0.5 top-2 w-1 h-1 rounded-full bg-gray-400" />
                    <div className="absolute right-0.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-gray-400" />
                    <div className="absolute right-0.5 bottom-2 w-1 h-1 rounded-full bg-gray-400" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Title Headline */}
          <h3 className="text-2xl sm:text-[26px] font-black text-[#1A1B25] tracking-tight text-center px-4 leading-tight mb-1 font-sans">
            {displayTitle}
          </h3>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm font-semibold text-[#50576B] text-center max-w-[230px] leading-snug">
            {displaySubtitle}
          </p>
        </div>

        {/* 
          2. Bottom Buttons Area (Images 1 & 2):
          - Button 1: "Share & Copy Link" (Full Coral/Orange Filled Button)
          - Button 2: "Copy Link" (Light Gray Filled Button)
        */}
        <div className="p-5 sm:p-6 bg-white flex flex-col gap-3">
          {/* Button 1: Share & Copy Link */}
          <button
            type="button"
            onClick={handleShareAndCopyLink}
            disabled={downloading}
            className="w-full py-4 rounded-full bg-[#FE6349] hover:bg-[#eb5238] active:scale-[0.98] text-white font-black text-sm sm:text-base tracking-normal transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
          >
            {downloading ? (
              <span className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : (
              <span>Share & Copy Link</span>
            )}
          </button>

          {/* Button 2: Copy Link */}
          <button
            type="button"
            onClick={handleCopyOnlyLink}
            className="w-full py-3.5 rounded-full bg-[#F6F8FA] hover:bg-[#ECEFF3] active:scale-[0.98] text-[#1A1B25] font-black text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                <span className="text-emerald-700">Link Copied!</span>
              </>
            ) : (
              <span>Copy Link</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Backwards compatibility export
export const ShareProfileModal: React.FC<ShareModalProps> = (props) => {
  return <ShareModal {...props} />;
};
