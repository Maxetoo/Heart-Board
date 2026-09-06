import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Post, Contribution, PostVisibility, ReactionCounts, RegisteredUser } from '../types';
import { userFromHandle, avatarFromParts, usernameOf, toHandle, toUsername } from '../lib/adapters';
import {
  X,
  ChevronLeft,
  ChevronRight,
  User,
  UserCheck,
  LayoutGrid,
  Sparkles,
  Check,
  Plus
} from 'lucide-react';
import {
  HandsClapping,
  Heart as PhosphorHeart,
  Smiley as PhosphorSmiley,
  Fire as PhosphorFire,
  ShareFat,
  Flag as PhosphorFlag,
  Plus as PhosphorPlus
} from '@phosphor-icons/react';
import { ConfettiOverlay } from './ConfettiOverlay';
import { CanvasReadOnlyCard } from './CreateAppreciationModal';
import { ShareProfileModal } from './ShareProfileModal';
import { SmartImage } from './SmartImage';
import { ActionMenuModal } from './ActionMenuModal';
import { motion, AnimatePresence } from 'motion/react';

/**
 * The message swap inside a board frame.
 *
 * Deliberately small and quick: the outgoing message recedes and fades like a
 * card going to the back of a stack while the next one comes forward. The frame
 * around it never moves, so the board reads as a fixed object you are dealing
 * cards into rather than something being dragged around.
 */
const MESSAGE_CARD_VARIANTS = {
  enter: (direction: 1 | -1) => ({ opacity: 0, scale: 0.94, x: direction * 28 }),
  center: { opacity: 1, scale: 1, x: 0 },
  exit: (direction: 1 | -1) => ({ opacity: 0, scale: 0.94, x: direction * -28 }),
};

/** How far the card follows the finger, and the cap that keeps it subtle. */
const DRAG_FOLLOW_RATIO = 0.22;
const DRAG_FOLLOW_MAX_PX = 26;

interface MediaModalProps {
  post: Post & {
    theme?: string;
    mediaType?: 'audio' | 'video' | 'image' | 'text' | 'note';
    sponsor?: string;
    sticker?: string;
    confetti?: string;
    secondaryImage?: string;
    isBlurred?: boolean;
    statusBadge?: string;
    selectedHearts?: string[];
  };
  currentUser?: RegisteredUser | null;
  /** True while the board's full document and messages are still loading. */
  isHydrating?: boolean;
  onRequireAuth?: (prompt?: string) => void;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onAddContributionClick?: (post: Post) => void;
  onReactionBlown?: (postId: string) => void;
  onUpdateReactions?: (postId: string, counts: ReactionCounts, userReactions: ('clap' | 'heart' | 'smiley' | 'fire')[]) => void;
  onEditBoard?: (post: Post) => void;
  onDeleteBoard?: (postId: string) => void;
  onEditMessage?: (post: Post, contribution?: Contribution) => void;
  onDeleteMessage?: (post: Post, contribution?: Contribution) => void;
  onSelectUser?: (user: RegisteredUser) => void;
  onSelectHashtag?: (tag: string) => void;
}

export const MediaModal: React.FC<MediaModalProps> = ({
  post,
  currentUser,
  isHydrating = false,
  onRequireAuth,
  onClose,
  onPrev,
  onNext,
  onAddContributionClick,
  onReactionBlown,
  onUpdateReactions,
  onEditBoard,
  onDeleteBoard,
  onEditMessage,
  onDeleteMessage,
  onSelectUser,
  onSelectHashtag
}) => {
  // Toggle between 'main' (Main Board) and 'contributions' (Contributions by other curators)
  const [activeTab, setActiveTab] = useState<'main' | 'contributions'>('main');
  // Index for navigating through multiple contribution messages
  const [activeContributionIndex, setActiveContributionIndex] = useState(0);

  // Helper to get real initial reaction breakdown
  const getInitialReactionCounts = (p: Post): { clap: number; heart: number; smiley: number; fire: number } => {
    if (p.reactionCounts) {
      return {
        clap: p.reactionCounts.clap ?? 0,
        heart: p.reactionCounts.heart ?? 0,
        smiley: p.reactionCounts.smiley ?? 0,
        fire: p.reactionCounts.fire ?? 0,
      };
    }
    const total = p.reactions || 0;
    if (total <= 0) return { clap: 0, heart: 0, smiley: 0, fire: 0 };
    if (total >= 10000) {
      return {
        clap: 34,
        heart: 11200,
        smiley: 1,
        fire: 64,
      };
    }
    if (total >= 1000) {
      return {
        clap: Math.max(1, Math.floor(total * 0.05)),
        heart: Math.floor(total * 0.88),
        smiley: Math.max(1, Math.floor(total * 0.005)),
        fire: Math.floor(total * 0.065),
      };
    }
    return {
      clap: Math.floor(total * 0.08),
      heart: Math.floor(total * 0.82),
      smiley: Math.max(0, Math.floor(total * 0.02)),
      fire: Math.floor(total * 0.08),
    };
  };

  // Interactive reaction states
  const [reactionCounts, setReactionCounts] = useState(() => getInitialReactionCounts(post));
  const [userReactions, setUserReactions] = useState<('clap' | 'heart' | 'smiley' | 'fire')[]>(() => post.userReactions || []);
  const [isReactionPickerOpen, setIsReactionPickerOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [showContributorDetails, setShowContributorDetails] = useState(false);
  const [showFlagToast, setShowFlagToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Single Click vs Double Click Disambiguation Ref
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const gestureDirectionRef = useRef<'horizontal' | 'vertical' | null>(null);
  /** The pointer currently driving a swipe, so a second finger is ignored. */
  const activePointerIdRef = useRef<number | null>(null);
  /**
   * The live drag distance.
   *
   * Kept in a ref as well as state because the release handler has to read the
   * TRUE final distance. Reading it from state meant reading whatever React had
   * last committed, which lags the pointer — a quick flick could travel 150px
   * and still be judged as 30px, so the swipe silently did nothing. Touch drags
   * are slow enough that state keeps up, which is exactly why this only showed
   * up with a mouse.
   */
  const dragDeltaRef = useRef(0);
  const hasMovedRef = useRef<boolean>(false);

  // Swipe gesture tracking for mobile expanded view
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Contributions list
  const contributions: Contribution[] = post.contributions || [];
  const hasContributions = contributions.length > 0;

  // Determine if the current active viewer is the creator/owner of this board
  const isViewerCreator = useMemo(() => {
    if (post.isCreatedByUser === true) return true;
    if (!currentUser) return Boolean(post.isCreatedByUser);

    const curHandle = (currentUser.handle || '').toLowerCase().replace(/^@/, '');
    const curName = (currentUser.name || '').toLowerCase();
    const curId = (currentUser.id || '').toLowerCase();

    const authorHandle = (post.authorHandle || '').toLowerCase().replace(/^@/, '');
    const authorName = (post.authorName || '').toLowerCase();
    const authorId = (post.authorId || '').toLowerCase();

    if (curHandle && authorHandle && curHandle === authorHandle) return true;
    if (curName && authorName && (curName === authorName || curName.replace(/\s+/g, '') === authorName.replace(/\s+/g, ''))) return true;
    if (curId && authorId && (curId === authorId || curId === `u-${authorId}`)) return true;

    return Boolean(post.isCreatedByUser);
  }, [post.isCreatedByUser, post.authorHandle, post.authorName, post.authorId, currentUser]);

  const isCreator = isViewerCreator;

  // Identify all contributions made by the current user on this board (independent of the currently viewed contribution)
  const userContributions = useMemo(() => {
    if (!currentUser) {
      return contributions.filter((c) => c.isCreatedByUser === true);
    }
    const curHandle = (currentUser.handle || '').toLowerCase().replace(/^@/, '');
    const curName = (currentUser.name || '').toLowerCase();
    const curId = (currentUser.id || '').toLowerCase();

    return contributions.filter((c) => {
      if (c.isCreatedByUser === true) return true;
      const cHandle = (c.authorHandle || '').toLowerCase().replace(/^@/, '');
      const cName = (c.authorName || '').toLowerCase();
      const cId = (c.authorId || '').toLowerCase();
      if (curHandle && cHandle && curHandle === cHandle) return true;
      if (curName && cName && (curName === cName || curName.replace(/\s+/g, '') === cName.replace(/\s+/g, ''))) return true;
      if (curId && cId && (curId === cId || curId === `u-${cId}`)) return true;
      return false;
    });
  }, [contributions, currentUser]);
  const maxCapacity = post.maxCapacity || (post.boardCapacity === 'solo' ? 1 : 20);
  const isSoloMode = post.boardCapacity === 'solo' || maxCapacity === 1;
  const isCapacityReached = contributions.length >= maxCapacity;
  const canToggleContributions = !isSoloMode && contributions.length > 0;
  const effectiveActiveTab = canToggleContributions ? activeTab : 'main';

  // ── The board's messages, as one flat sequence ──────────────────────────────
  //
  // Index 0 is the board's own face; 1..n are the contributed messages. Swiping
  // walks this list and never leaves the board.
  const messageCount = canToggleContributions ? contributions.length + 1 : 1;
  const messageIndex = effectiveActiveTab === 'main' ? 0 : activeContributionIndex + 1;

  /** Which way the last change went: 1 forward, -1 back. Aims the card animation. */
  const [swipeDirection, setSwipeDirection] = useState<1 | -1>(1);

  /**
   * How far the message card is nudged while a drag is in progress.
   *
   * Damped and clamped, and zero on a board with only one message — there is
   * nothing to swipe to, so the card should not suggest otherwise.
   */
  const dragNudge =
    messageCount > 1
      ? Math.max(
          -DRAG_FOLLOW_MAX_PX,
          Math.min(DRAG_FOLLOW_MAX_PX, dragOffset * DRAG_FOLLOW_RATIO),
        )
      : 0;

  /**
   * Moves to a message by flat index.
   *
   * No wrapping, and no falling through to the next board at the ends — the
   * last message just holds, the way the top card of a stack does.
   */
  const goToMessage = (nextIndex: number) => {
    if (nextIndex === messageIndex || nextIndex < 0 || nextIndex >= messageCount) return;
    setSwipeDirection(nextIndex > messageIndex ? 1 : -1);
    if (nextIndex === 0) {
      setActiveTab('main');
    } else {
      setActiveTab('contributions');
      setActiveContributionIndex(nextIndex - 1);
    }
  };

  // Track previous post ID and contribution count to handle smooth contribution addition
  const prevPostIdRef = useRef(post.id);
  const prevContribCountRef = useRef((post.contributions || []).length);

  // Reset or update tab and reactions when post changes
  useEffect(() => {
    const currentContribCount = (post.contributions || []).length;
    if (prevPostIdRef.current !== post.id) {
      // Navigated to a different post
      prevPostIdRef.current = post.id;
      prevContribCountRef.current = currentContribCount;
      setActiveTab('main');
      setActiveContributionIndex(0);
      setShowContributorDetails(false);
      setIsActionMenuOpen(false);
      setIsReactionPickerOpen(false);
      setReactionCounts(getInitialReactionCounts(post));
      setUserReactions(post.userReactions || []);
    } else if (currentContribCount > prevContribCountRef.current) {
      // New contribution added to this same post -> immediately show contributions tab with the newest contribution
      prevContribCountRef.current = currentContribCount;
      setActiveTab('contributions');
      setActiveContributionIndex(currentContribCount - 1);
      setReactionCounts(getInitialReactionCounts(post));
      setUserReactions(post.userReactions || []);
    } else {
      prevContribCountRef.current = currentContribCount;
      setReactionCounts(getInitialReactionCounts(post));
      setUserReactions(post.userReactions || []);
    }
  }, [post]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  // Board click handler with distinct single-click and double-click behaviors
  const handleBoardCardClick = (e: React.MouseEvent) => {
    // If the user was dragging/swiping, do not fire card clicks
    if (hasMovedRef.current || Math.abs(dragOffset) > 6) {
      hasMovedRef.current = false;
      return;
    }

    if (clickTimerRef.current) {
      // Double click detected! Cancel single click and open Action Page
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      setIsActionMenuOpen(true);
    } else {
      // First click: wait briefly to see if a second click arrives
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
        setShowContributorDetails((prev) => !prev);
      }, 240);
    }
  };

  // Swipe navigation.
  //
  // Pointer events rather than touch events: the same handlers then cover
  // finger, trackpad, mouse and pen. These were touch-only, so the board could
  // not be swiped at all on a desktop — the gesture logic below was already
  // written, it just never received an event from anything but a touchscreen.
  //
  // The container carries `touch-pan-y`, so the browser keeps vertical
  // scrolling for itself and hands us the horizontal movement.
  const handlePointerDown = (e: React.PointerEvent) => {
    // Primary contact only, and never a secondary mouse button.
    if (!e.isPrimary || e.button !== 0) return;

    touchStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    activePointerIdRef.current = e.pointerId;
    gestureDirectionRef.current = null;
    hasMovedRef.current = false;
    dragDeltaRef.current = 0;
    setIsDragging(false);
    setDragOffset(0);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!touchStartRef.current || e.pointerId !== activePointerIdRef.current) return;

    const deltaX = e.clientX - touchStartRef.current.x;
    const deltaY = e.clientY - touchStartRef.current.y;

    // Lock gesture direction once threshold is crossed
    if (gestureDirectionRef.current === null) {
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        if (Math.abs(deltaX) >= Math.abs(deltaY)) {
          gestureDirectionRef.current = 'horizontal';
          setIsDragging(true);
          hasMovedRef.current = true;
          // Capture only now that the gesture is definitely a swipe, so a
          // plain press still reaches the buttons inside the board.
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            // Capture is a nicety; the drag still tracks without it.
          }
        } else {
          gestureDirectionRef.current = 'vertical';
        }
      }
    }

    if (gestureDirectionRef.current === 'horizontal') {
      hasMovedRef.current = true;
      // Damped direct finger following
      dragDeltaRef.current = deltaX;
      setDragOffset(deltaX);
    }
  };

  /**
   * The browser took the gesture over (it became a scroll, or the window lost
   * focus). Snap back rather than committing whatever the drag had reached.
   */
  const handlePointerCancel = () => {
    activePointerIdRef.current = null;
    touchStartRef.current = null;
    gestureDirectionRef.current = null;
    hasMovedRef.current = false;
    dragDeltaRef.current = 0;
    setIsDragging(false);
    setDragOffset(0);
  };

  const handlePointerUp = (e?: React.PointerEvent) => {
    if (e && activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) {
      return;
    }
    activePointerIdRef.current = null;

    if (!touchStartRef.current) {
      setDragOffset(0);
      setIsDragging(false);
      return;
    }

    const startInfo = touchStartRef.current;
    const deltaX = dragDeltaRef.current;
    const elapsed = Date.now() - startInfo.time;
    const velocity = Math.abs(deltaX) / (elapsed || 1);
    const isHorizontal = gestureDirectionRef.current === 'horizontal';

    touchStartRef.current = null;
    gestureDirectionRef.current = null;
    setIsDragging(false);

    if (!isHorizontal || Math.abs(deltaX) < 8) {
      setDragOffset(0);
      return;
    }

    const swipeThreshold = 50;
    const isFastSwipe = velocity > 0.35 && Math.abs(deltaX) > 20;
    const hasTriggered = Math.abs(deltaX) > swipeThreshold || isFastSwipe;

    // The drag itself always releases. Whether the message changed or not, the
    // card returns to rest — the swap is carried by the card transition, not by
    // flinging anything off screen.
    dragDeltaRef.current = 0;
    setDragOffset(0);

    if (hasTriggered) {
      // Swiping moves between the messages ON this board, and nothing else.
      // Changing boards is the left/right chevrons' job, which is why they are
      // desktop-only: on a phone a board is a place you swipe through, not a
      // place you swipe out of.
      goToMessage(messageIndex + (deltaX < 0 ? 1 : -1));
    }

    // hasMovedRef is deliberately NOT cleared here. The click event fires after
    // pointerup, and handleBoardCardClick reads this flag to know the gesture
    // was a swipe rather than a tap — clearing it now would open the contributor
    // panel at the end of every drag. The next pointerdown resets it.
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        // Arrows mirror the on-screen chevrons: previous/next BOARD.
        onPrev();
      } else if (e.key === 'ArrowRight') {
        onNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext]);

  // Current active message depending on tab
  const activeMessage = effectiveActiveTab === 'main'
    ? post
    : (contributions[activeContributionIndex] || post);


  // Frame Background resolution (reusing main curator's theme consistently)
  const getFrameBg = () => {
    const theme = post.theme || '';
    if (theme.startsWith('#')) return theme;
    if (theme.includes('bg-[')) {
      const match = theme.match(/bg-\[(#[0-9a-fA-F]+)\]/);
      if (match) return match[1];
    }
    if (theme.includes('slate') || theme.includes('272835')) return '#272835';
    if (theme.includes('mint') || theme.includes('ECEFE6')) return '#ECEFE6';
    if (theme.includes('sunset') || theme.includes('FAF5E8')) return '#FAF5E8';
    if (theme.includes('lavender') || theme.includes('EEF1FA')) return '#EEF1FA';
    if (theme.includes('blush') || theme.includes('FDE8E8')) return '#FDE8E8';
    if (theme.includes('sky') || theme.includes('E0F2FE')) return '#E0F2FE';
    if (theme.includes('emerald') || theme.includes('E6F4EA')) return '#E6F4EA';
    if (theme.includes('amber') || theme.includes('FEF3C7')) return '#FEF3C7';
    if (theme.includes('lilac') || theme.includes('F3E8FF')) return '#F3E8FF';
    if (theme.includes('peach') || theme.includes('F7F0ED') || theme.includes('FAF0EC')) return '#F7F0ED';
    return '#F7F0ED';
  };

  const frameBgColor = getFrameBg();

  // Active message contributor details (for single-click contributor details overlay on the board)
  const activeContributorName = effectiveActiveTab === 'main'
    ? (post.authorName || 'Curator')
    : (activeMessage.authorName || 'Contributor');
  const activeContributorAvatar = effectiveActiveTab === 'main'
    ? post.authorAvatar
    : activeMessage.authorAvatar;

  /**
   * Who wrote the message currently on the board — the @handle under it.
   *
   * The caption and the tagged recipients above are board-level and stay put as
   * you swipe. This line does not: the whole point of swiping through a board
   * is reading each person's message, so it has to say whose message you are
   * looking at. It used to be pinned to the board's owner, which named the
   * wrong person on every message but the first.
   */
  const activeAuthor = useMemo(() => {
    const source: { authorName?: string; authorHandle?: string; authorAvatar?: string } =
      effectiveActiveTab === 'main' ? post : activeMessage;

    const name = source.authorName || (effectiveActiveTab === 'main' ? 'Curator' : 'Contributor');
    const raw = (source.authorHandle || '').trim();
    const handle = raw
      ? (raw.startsWith('@') ? raw : `@${raw}`)
      : toHandle(name, 'curator');

    return {
      name,
      handle,
      avatar: source.authorAvatar,
      // The board's face message is the owner's, so only that one is labelled.
      isBoardOwner: effectiveActiveTab === 'main',
    };
  }, [effectiveActiveTab, post, activeMessage]);

  // Resolve creator's profile object.
  // The post already carries the author fields populated by the server, so we
  // build the stub from those rather than looking the handle up in a table.
  const creatorUser = useMemo((): RegisteredUser => {
    if (isViewerCreator && currentUser) return currentUser;

    const displayName = post.authorName || 'Curator';
    const displayHandle = post.authorHandle
      ? (post.authorHandle.startsWith('@') ? post.authorHandle : `@${post.authorHandle}`)
      : toHandle(displayName, 'curator');

    return {
      id: post.authorId || `u-${toUsername(displayName) || 'curator'}`,
      name: displayName,
      handle: displayHandle,
      avatar: avatarFromParts({
        id: post.authorId,
        username: usernameOf(displayHandle),
        name: displayName,
        profileImage: post.authorAvatar,
      }),
      isVerified: false,
      heartsCount: 1,
      boardsCount: 1,
      bio: 'Heartboard curator',
      roleLabel: 'Board Curator',
    };
  }, [post.authorHandle, post.authorName, post.authorId, post.authorAvatar, isViewerCreator, currentUser]);

  // Helper to find or build registered user object
  const findRegisteredUser = (input: string): RegisteredUser => {
    const clean = input.trim().replace(/^@/, '').toLowerCase();

    // Handle @you: opens the viewing user's Heartboard/profile
    if (clean === 'you') {
      return (isViewerCreator && currentUser) ? currentUser : creatorUser;
    }

    // Handle @creator: opens the board creator's Heartboard/profile
    if (clean === 'creator') {
      return creatorUser;
    }

    // Build a navigable stub from the handle. The profile route fetches the
    // authoritative record via GET /user/profile/:username and renders a
    // not-found state if the handle does not exist.
    return userFromHandle(input);
  };

  const handleUserClick = (userNameOrHandle: string) => {
    const clean = userNameOrHandle.trim().replace(/^@/, '').toLowerCase();
    if (clean === 'you') {
      const target = (isViewerCreator && currentUser) ? currentUser : creatorUser;
      if (onSelectUser) onSelectUser(target);
      return;
    }
    if (clean === 'creator') {
      if (onSelectUser) onSelectUser(creatorUser);
      return;
    }
    const user = findRegisteredUser(userNameOrHandle);
    if (onSelectUser) {
      onSelectUser(user);
    }
  };

  const handleHashtagClick = (tag: string) => {
    const cleanTag = tag.trim().startsWith('#') ? tag.trim() : `#${tag.trim()}`;
    if (onSelectHashtag) {
      onSelectHashtag(cleanTag);
    }
  };

  // Extract structured recipient & hashtag tokens for display and interaction
  const displayTokens = useMemo(() => {
    interface RecipientToken {
      text: string;
      isHashtag: boolean;
      cleanTag?: string;
      userQuery?: string;
      userObj?: RegisteredUser;
    }
    const tokens: RecipientToken[] = [];
    const addedTokens = new Set<string>();

    const authorHandle = (post.authorHandle || '').toLowerCase().replace(/^@/, '');
    const authorName = (post.authorName || '').toLowerCase();
    const authorId = (post.authorId || '').toLowerCase();

    const isCreatorToken = (raw: string) => {
      const clean = raw.trim().toLowerCase().replace(/^@/, '');
      if (!clean) return true;
      if (clean === 'you' || clean === 'creator' || clean === 'community') return true;
      if (authorHandle && clean === authorHandle) return true;
      if (authorName && (clean === authorName || clean.replace(/\s+/g, '') === authorName.replace(/\s+/g, ''))) return true;
      if (authorId && (clean === authorId || clean === `u-${authorId}`)) return true;
      if (isViewerCreator && currentUser) {
        const curHandle = (currentUser.handle || '').toLowerCase().replace(/^@/, '');
        const curName = (currentUser.name || '').toLowerCase();
        if (curHandle && clean === curHandle) return true;
        if (curName && (clean === curName || clean.replace(/\s+/g, '') === curName.replace(/\s+/g, ''))) return true;
      }
      return false;
    };

    const addToken = (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      const lower = trimmed.toLowerCase();
      if (addedTokens.has(lower)) return;

      if (trimmed.startsWith('#')) {
        addedTokens.add(lower);
        tokens.push({
          text: trimmed,
          isHashtag: true,
          cleanTag: trimmed,
        });
        return;
      }

      if (isCreatorToken(trimmed)) {
        return;
      }

      // Filter out internal non-user entity keywords (e.g. 'bey', 'family', 'workspace', 'wall', 'board')
      const nonUserKeywords = ['bey', 'family', 'workspace', 'wall', 'board', 'all'];
      const cleanNoAt = trimmed.replace(/^@/, '').toLowerCase();
      // Anything explicitly written as @handle is treated as a user mention;
      // bare keywords from the list above are structural, not people.
      if (nonUserKeywords.includes(cleanNoAt) && !trimmed.startsWith('@')) {
        return;
      }

      addedTokens.add(lower);
      const formatted = trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
      tokens.push({
        text: formatted,
        isHashtag: false,
        userQuery: trimmed,
      });
    };

    if (Array.isArray(post.recipients) && post.recipients.length > 0) {
      post.recipients.forEach(r => addToken(r));
    } else if (post.recipientHandle) {
      // The recipient's real handle, straight from the server. Preferred over
      // recipientName: a display name has to be guessed back into a username,
      // and that guess is how "@ms.lawson" became "ms_lawson".
      addToken(post.recipientHandle);
    } else if (post.recipientName) {
      post.recipientName.split(',').forEach(r => addToken(r));
    } else if (post.targetId) {
      addToken(post.targetId);
    }

    if (Array.isArray(post.hashtags)) {
      post.hashtags.forEach(h => addToken(h));
    }

    // When a message board has only the creator as the recipient:
    // If the creator is viewing their own board, display @you.
    // If another user is viewing the board, display @creator.
    // Remove the incorrect @community display in this scenario.
    if (tokens.length === 0) {
      if (isViewerCreator) {
        tokens.push({
          text: '@you',
          isHashtag: false,
          userQuery: '@you',
          userObj: (isViewerCreator && currentUser) ? currentUser : creatorUser,
        });
      } else {
        tokens.push({
          text: '@creator',
          isHashtag: false,
          userQuery: '@creator',
          userObj: creatorUser,
        });
      }
    }

    return tokens;
  }, [post.recipients, post.recipientHandle, post.recipientName, post.targetId, post.hashtags, post.authorHandle, post.authorName, post.authorId, isViewerCreator, currentUser, creatorUser]);


  // Reaction formatting helper
  const formatReactionCount = (count?: number) => {
    if (!count || count <= 0) return null;
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return count.toString();
  };

  // Toggle specific reaction type
  const handleToggleReaction = (type: 'clap' | 'heart' | 'smiley' | 'fire') => {
    if (!currentUser && onRequireAuth) {
      setIsReactionPickerOpen(false);
      onRequireAuth('Please sign in or create an account to react and blow hearts.');
      return;
    }

    const isAlreadySelected = userReactions.includes(type);
    const newUserReactions = isAlreadySelected
      ? userReactions.filter((r) => r !== type)
      : [...userReactions, type];

    const currentCount = reactionCounts[type] || 0;
    const newCount = isAlreadySelected ? Math.max(0, currentCount - 1) : currentCount + 1;

    const newCounts = {
      ...reactionCounts,
      [type]: newCount,
    };

    setUserReactions(newUserReactions);
    setReactionCounts(newCounts);

    if (onUpdateReactions) {
      onUpdateReactions(post.id, newCounts, newUserReactions);
    }
    if (!isAlreadySelected && onReactionBlown) {
      onReactionBlown(post.id);
    }
  };

  // Handle flag click
  const handleFlagClick = () => {
    setShowFlagToast(true);
    setToastMessage('Board flagged for review. Thank you for keeping Heartboard safe.');
    setTimeout(() => {
      setShowFlagToast(false);
      setToastMessage(null);
    }, 3000);
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex flex-col items-center justify-between bg-[#1A1B25] text-white font-sans select-none overflow-y-auto antialiased"
      style={{ backgroundColor: '#1A1B25' }}
    >
      {/* 1. TOP BAR */}
      <header className="w-full px-4 sm:px-8 md:px-16 lg:px-24 xl:px-[192px] pt-5 pb-3 flex items-center justify-between z-30 shrink-0">

        {/* Top-Left: Toggle / Switch Component (Main Board vs. Contributions) */}
        <div className="flex items-center bg-[#272835] p-1 rounded-full">
          {/* Main Board Button */}
          <button
            type="button"
            onClick={() => {
              if (canToggleContributions) {
                setActiveTab('main');
              }
            }}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${
              canToggleContributions ? 'cursor-pointer' : 'cursor-default'
            } ${
              effectiveActiveTab === 'main'
                ? 'bg-white/20 text-white'
                : 'text-white/50 hover:text-white/80'
            }`}
            title="Main Board (Original by Curator)"
            aria-label="Main Board"
          >
            <UserCheck className="w-4 h-4" />
          </button>

          {/* Contributions Button */}
          <button
            type="button"
            disabled={!canToggleContributions}
            onClick={() => {
              if (!canToggleContributions) return;
              setActiveTab('contributions');
              setActiveContributionIndex(0);
            }}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-all relative ${
              canToggleContributions
                ? 'cursor-pointer hover:text-white/80'
                : 'cursor-not-allowed opacity-40 select-none'
            } ${
              effectiveActiveTab === 'contributions'
                ? 'bg-white/20 text-white'
                : canToggleContributions
                  ? 'text-white/50'
                  : 'text-white/30'
            }`}
            title={
              !canToggleContributions
                ? isSoloMode
                  ? 'Contributions disabled (Solo Board)'
                  : 'No contributions yet'
                : 'Contributions (Messages by other curators)'
            }
            aria-label="Contributions"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>

        {/* Top-Right: Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-[#222330] hover:bg-[#2c2e3e] active:scale-95 text-white/60 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          aria-label="Close message board"
        >
          <X className="w-5 h-5 text-white/60 hover:text-white transition-colors" />
        </button>
      </header>

      {/* Desktop-only chevrons: previous / next BOARD.
          Messages within a board are reached by swiping the card instead, which
          is why these stay hidden on mobile — a phone has no way to switch
          boards from here, by design. */}
      <button
        onClick={onPrev}
        className="hidden md:flex fixed left-4 sm:left-8 md:left-16 lg:left-24 xl:left-[192px] top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full hover:scale-105 active:scale-95 items-center justify-center text-white/60 hover:text-white transition-all cursor-pointer"
        aria-label="Previous board"
      >
        <ChevronLeft className="w-6 h-6 text-white/60 hover:text-white transition-colors" />
      </button>

      <button
        onClick={onNext}
        className="hidden md:flex fixed right-4 sm:right-8 md:right-16 lg:right-24 xl:right-[192px] top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full hover:scale-105 active:scale-95 items-center justify-center text-white/60 hover:text-white transition-all cursor-pointer"
        aria-label="Next board"
      >
        <ChevronRight className="w-6 h-6 text-white/60 hover:text-white transition-colors" />
      </button>

      {/* 2. MIDDLE: ACTUAL MESSAGE BOARD / CONTENT */}
      <main
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        // A mouse press on the artwork would otherwise start a native HTML5
        // image drag, which cancels the pointer stream mid-gesture. Touch has
        // no such thing, so this too only ever bit on desktop.
        onDragStart={(e) => e.preventDefault()}
        className={`w-full flex-1 flex flex-col items-center justify-center px-4 py-2 my-auto z-10 touch-pan-y select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >

        {effectiveActiveTab === 'contributions' && !hasContributions ? (
          /* Empty state when there are no contributions yet */
          <div
            style={{
              backgroundColor: frameBgColor,
              transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.015}deg)`,
              transition: isDragging ? 'none' : 'transform 0.24s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.24s ease',
              opacity: isDragging ? Math.max(0.72, 1 - Math.abs(dragOffset) / 500) : 1
            }}
            className="w-full max-w-[340px] sm:max-w-[380px] h-[380px] sm:h-[430px] rounded-[2.5rem] p-6 flex flex-col items-center justify-center text-center shadow-2xl relative select-none will-change-transform"
          >
            <div className="bg-white rounded-3xl w-full h-full p-6 flex flex-col items-center justify-center text-center shadow-xs">
              <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center text-[#FE6349] mb-3">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-base font-extrabold text-[#1A1B25] mb-1">
                No Contributions Yet
              </h3>
              <p className="text-xs text-gray-500 font-medium max-w-[220px] mb-5 leading-relaxed">
                {isSoloMode
                  ? "This board is set to Solo Mode (Only Me)."
                  : "Be the first to add a heartfelt message to this board!"}
              </p>

              {!isSoloMode && !isCapacityReached && onAddContributionClick && (
                <button
                  type="button"
                  onClick={() => onAddContributionClick(post)}
                  className="bg-[#FE6349] hover:bg-[#e05234] text-white px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add First Contribution</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* The Actual Message Board Frame (Fixed & Pristine) */
          <div
            onClick={handleBoardCardClick}
            // The frame does not move. It is the board — swiping changes which
            // message sits inside it, so the board itself staying put is the
            // whole point. It used to translate and rotate with the finger,
            // which read as dragging the board away.
            style={{ backgroundColor: frameBgColor }}
            className="w-full max-w-[320px] sm:max-w-[360px] md:max-w-[380px] h-[400px] sm:h-[450px] md:h-[474px] rounded-[2.2rem] sm:rounded-[2.5rem] p-5 sm:p-6 md:p-7 flex items-center justify-center shadow-[0_20px_60px_rgba(0,0,0,0.45)] relative overflow-hidden cursor-pointer active:scale-[0.995] select-none will-change-transform"
            title="Single-click for contributor details, double-click for action menu"
          >
            {/* Confetti Overlay inside frame if enabled */}
            {(activeMessage.confetti || post.confetti) && (
              <ConfettiOverlay type={(activeMessage.confetti || post.confetti) as any} />
            )}

            {/* Board artwork lives on the board's messages, so opening a board
                always costs a round trip. Say so, instead of showing a bare
                card that silently fills in a moment later. */}
            {isHydrating && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-sm text-white text-[11px] font-bold pointer-events-none">
                <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                <span>Loading board…</span>
              </div>
            )}

            {/* Inner Canvas Container (Preserving exact visual appearance from Create Page).
                This layer — not the frame — is what follows the finger, damped
                and capped so it reads as a nudge on the message rather than the
                board being dragged. */}
            <div
              className="relative z-10 w-full h-full flex items-center justify-center"
              style={{
                transform: `translateX(${dragNudge}px)`,
                transition: isDragging ? 'none' : 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              {/* Only the message moves.
                  While dragging it follows the finger a little — heavily damped
                  and capped, so it reads as the card being nudged rather than
                  thrown. On release it settles, and the swap itself is the card
                  transition below. */}
              {/* Both cards are absolutely stacked, so the one leaving and the
                  one arriving overlap for the length of the transition instead
                  of reflowing the frame. */}
              <AnimatePresence initial={false} custom={swipeDirection}>
                <motion.div
                  key={messageIndex}
                  custom={swipeDirection}
                  variants={MESSAGE_CARD_VARIANTS}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <CanvasReadOnlyCard
                canvasElements={activeMessage.canvasElements || (effectiveActiveTab === 'main' ? post.canvasElements : undefined) || []}
                content={activeMessage.content || post.content}
                uploadedImage={activeMessage.imageUrl || activeMessage.mediaUrl || (effectiveActiveTab === 'main' ? (post.imageUrl || post.mediaUrl) : undefined)}
                selectedConfetti={(activeMessage.confetti || post.confetti) as any}
                authorName={activeMessage.authorName}
                recipient={Array.isArray(post.recipients) ? post.recipients.filter(r => r !== '@you').join(', ') || post.recipients[0] : (post.recipientName || post.targetId)}
                selectedHearts={(activeMessage as Post).selectedHearts || post.selectedHearts || []}
                activeType={activeMessage.mediaType === 'audio' ? 'audio' : activeMessage.mediaType === 'video' ? 'video' : 'text'}
                isCollaborative={!isSoloMode}
                visibility={post.visibility}
                showMetadata={false} // Strictly clean: No status pills, capacity info, or duplicate badges on the board!
                  />
                </motion.div>
              </AnimatePresence>

              {/* Single Click — Contributor Details Overlay */}
              {showContributorDetails && (
                <div className="absolute inset-x-0 bottom-0 pt-16 pb-3.5 px-4 sm:px-5 bg-gradient-to-t from-black/85 via-black/45 to-transparent rounded-b-[1.8rem] sm:rounded-b-[2rem] md:rounded-b-3xl flex items-center gap-2.5 z-30 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 pointer-events-none">
                  <div className="w-8 h-8 rounded-full bg-[#FAF0EC] border border-white/30 flex items-center justify-center text-xs font-extrabold text-[#FE6349] shrink-0 overflow-hidden shadow-xs">
                    {activeContributorAvatar ? (
                      <SmartImage
                        src={activeContributorAvatar}
                        alt={activeContributorName}
                        rounded="rounded-full"
                        instant
                        wrapperClassName="w-full h-full"
                        className="w-full h-full object-cover"
                        fallback={<span className="text-xs font-bold">{activeContributorName.charAt(0).toUpperCase()}</span>}
                      />
                    ) : (
                      <User className="w-4 h-4 text-[#FE6349]" />
                    )}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs sm:text-sm font-bold text-white tracking-tight leading-tight drop-shadow-sm">
                      {activeContributorName}
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-medium text-white/75 leading-tight mt-0.5">
                      {effectiveActiveTab === 'main' ? 'Message Creator' : 'Contributor'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* 4. BELOW THE BOARD (Strictly permanent main board metadata) */}
      <footer className="w-full max-w-[320px] sm:max-w-[360px] md:max-w-[380px] mx-auto px-0 pb-6 pt-1 flex flex-col items-start text-left gap-3 z-20 shrink-0">

        {/* Tagged recipient(s) and hashtags. */}
        <p className="text-xs sm:text-sm font-semibold text-white/60 break-words flex flex-wrap items-center gap-x-2 gap-y-1">
          {displayTokens
            .map((token, idx) => (
            <button
              key={`${token.text}-${idx}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (token.isHashtag) {
                  handleHashtagClick(token.cleanTag || token.text);
                } else {
                  handleUserClick(token.userQuery || token.text);
                }
              }}
              className={`transition-colors cursor-pointer hover:underline text-left inline-block text-white/60 ${
                token.isHashtag
                  ? 'hover:text-[#FE6349]'
                  : 'hover:text-white'
              }`}
              title={token.isHashtag ? `View all boards for ${token.text}` : `View ${token.text}'s Heartboard`}
            >
              {token.text}
            </button>
          ))}
        </p>

        {/* C. Whose message is on the board right now — follows the swipe. */}
        <button
          type="button"
          onClick={() => handleUserClick(activeAuthor.handle)}
          className="flex items-center gap-2 group cursor-pointer text-left transition-opacity hover:opacity-95"
          title={`View ${activeAuthor.handle}'s Heartboard`}
        >
          <div className="w-6 h-6 rounded-full bg-[#353849] border border-white/20 flex items-center justify-center text-[10px] font-extrabold text-white shrink-0 overflow-hidden group-hover:border-[#FE6349] transition-colors">
            {activeAuthor.avatar ? (
              <SmartImage
                src={activeAuthor.avatar}
                alt={activeAuthor.name}
                rounded="rounded-full"
                instant
                wrapperClassName="w-full h-full"
                className="w-full h-full object-cover"
                fallback={<span className="text-xs font-bold">{activeAuthor.name.charAt(0).toUpperCase()}</span>}
              />
            ) : (
              activeAuthor.name.charAt(0).toUpperCase()
            )}
          </div>
          <span className="text-xs sm:text-sm font-semibold text-white/60 group-hover:text-white group-hover:underline transition-colors">
            {activeAuthor.handle}
            {activeAuthor.isBoardOwner && ' (Curator)'}
          </span>
        </button>


        {/* D. Reaction Picker & Action Bar */}
        <div className="w-fit relative flex flex-col items-start">

          {/* Dismiss backdrop when picker is open */}
          {isReactionPickerOpen && (
            <div
              className="fixed inset-0 z-20 cursor-default"
              onClick={() => setIsReactionPickerOpen(false)}
            />
          )}

          {/* Top Floating Pill: Reaction Picker (Absolute overlay - zero layout shift) */}
          {isReactionPickerOpen && (
            <div
              className="absolute bottom-[calc(100%+10px)] left-0 w-fit whitespace-nowrap flex items-center justify-start gap-4 bg-[#272835] rounded-full px-5 py-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150 z-30"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 1. Clap */}
              <button
                type="button"
                onClick={() => handleToggleReaction('clap')}
                className="flex items-center gap-1.5 transition-transform active:scale-90 cursor-pointer py-1 px-1 rounded-full hover:bg-white/5"
                title="Clap"
              >
                <HandsClapping
                  size={24}
                  weight={userReactions.includes('clap') ? "fill" : "bold"}
                  color={userReactions.includes('clap') ? "#00D09C" : "#FFFFFF"}
                />
                {formatReactionCount(reactionCounts.clap) && (
                  <span className="text-xs font-bold text-white tracking-tight ml-0.5">
                    {formatReactionCount(reactionCounts.clap)}
                  </span>
                )}
              </button>

              {/* 2. Heart */}
              <button
                type="button"
                onClick={() => handleToggleReaction('heart')}
                className="flex items-center gap-1.5 transition-transform active:scale-90 cursor-pointer py-1 px-1 rounded-full hover:bg-white/5"
                title="Heart / Love"
              >
                <PhosphorHeart
                  size={24}
                  weight="fill"
                  color={userReactions.includes('heart') ? "#FF3838" : "#FFFFFF"}
                />
                {formatReactionCount(reactionCounts.heart) && (
                  <span className="text-xs font-bold text-white tracking-tight ml-0.5">
                    {formatReactionCount(reactionCounts.heart)}
                  </span>
                )}
              </button>

              {/* 3. Smiley */}
              <button
                type="button"
                onClick={() => handleToggleReaction('smiley')}
                className="flex items-center gap-1.5 transition-transform active:scale-90 cursor-pointer py-1 px-1 rounded-full hover:bg-white/5"
                title="Smiley"
              >
                <PhosphorSmiley
                  size={24}
                  weight={userReactions.includes('smiley') ? "fill" : "bold"}
                  color={userReactions.includes('smiley') ? "#FFC72C" : "#FFFFFF"}
                />
                {formatReactionCount(reactionCounts.smiley) && (
                  <span className="text-xs font-bold text-white tracking-tight ml-0.5">
                    {formatReactionCount(reactionCounts.smiley)}
                  </span>
                )}
              </button>

              {/* 4. Fire */}
              <button
                type="button"
                onClick={() => handleToggleReaction('fire')}
                className="flex items-center gap-1.5 transition-transform active:scale-90 cursor-pointer py-1 px-1 rounded-full hover:bg-white/5"
                title="Fire"
              >
                <PhosphorFire
                  size={24}
                  weight="fill"
                  color={userReactions.includes('fire') ? "#FF7629" : "#FFFFFF"}
                />
                {formatReactionCount(reactionCounts.fire) && (
                  <span className="text-xs font-bold text-white tracking-tight ml-0.5">
                    {formatReactionCount(reactionCounts.fire)}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Bottom Pill: Action Bar */}
          <div className="w-fit flex items-center justify-center gap-4 bg-[#272835] rounded-full px-5 py-2.5 relative z-30">

            {/* 1. Reaction Button (Smiley) - Default State has no count, only icon */}
            <button
              type="button"
              onClick={() => setIsReactionPickerOpen((prev) => !prev)}
              className={`flex items-center justify-center p-1 rounded-full active:scale-95 transition-all cursor-pointer ${
                isReactionPickerOpen ? 'bg-white/15 text-white' : 'text-white/90 hover:text-white'
              }`}
              title="Reactions"
            >
              <PhosphorSmiley size={24} weight="bold" color="#FFFFFF" />
            </button>

            {/* 2. Share Button */}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="text-white/90 hover:text-white active:scale-95 transition-all cursor-pointer p-1"
              title="Share board link & image"
            >
              <ShareFat size={24} weight="bold" color="#FFFFFF" />
            </button>

            {/* 3. Flag Button */}
            <button
              type="button"
              onClick={handleFlagClick}
              className="text-white/90 hover:text-white active:scale-95 transition-all cursor-pointer p-1"
              title="Flag / Report this board"
            >
              <PhosphorFlag size={24} weight="bold" color="#FFFFFF" />
            </button>

            {/* 4. + / Add Message Button (ONLY if collaborative and capacity not reached) */}
            {!isSoloMode && !isCapacityReached && onAddContributionClick && (
              <button
                type="button"
                onClick={() => onAddContributionClick(post)}
                className="text-white hover:text-[#FE6349] active:scale-95 transition-all cursor-pointer p-1 flex items-center justify-center"
                title="Add a message to this board"
              >
                <PhosphorPlus size={24} weight="bold" color="#FFFFFF" />
              </button>
            )}

          </div>

        </div>

      </footer>

      {/* Flag / Report Toast Feedback */}
      {showFlagToast && toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[1100] bg-[#272835] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Share Modal Integration (Context-Aware for Message Board) */}
      {isShareModalOpen && (
        <ShareProfileModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          shareData={{
            type: 'board',
            // The slug is what /board/:slug resolves; ShareProfileModal builds
            // the link from this. Passing the raw id produced a URL that only
            // worked by accident.
            boardId: post.slug || post.id,
            boardTitle: post.caption || (post.content && post.content.length <= 40 ? post.content : undefined) || (post.recipientName ? `Tribute for ${post.recipientName}` : undefined) || `${post.authorName || 'Curator'}'s Board`,
            boardThumbnail: post.imageUrl || post.mediaUrl || post.authorAvatar,
            boardTheme: post.theme || '#BEE27C',
            boardAuthorName: post.authorName,
            boardRecipientName: post.recipientName || (Array.isArray(post.recipients) ? post.recipients[0] : undefined),
            // No `url`: ShareProfileModal builds /board/:slug itself. This used
            // to pass /?board=<id>, a prototype HashRouter link that resolves
            // to nothing under BrowserRouter.
          }}
          onShowToast={(msg) => {
            setToastMessage(msg);
            setShowFlagToast(true);
            setTimeout(() => {
              setShowFlagToast(false);
              setToastMessage(null);
            }, 3000);
          }}
        />
      )}

      {/* Action Menu Pop-up Modal (Double Click / Action Page) */}
      {isActionMenuOpen && (
        <ActionMenuModal
          isOpen={isActionMenuOpen}
          onClose={() => setIsActionMenuOpen(false)}
          post={post}
          isCreator={isCreator}
          userContributions={userContributions}
          onAddPost={() => {
            onAddContributionClick?.(post);
          }}
          onShare={() => {
            setIsShareModalOpen(true);
          }}
          onEditBoard={() => {
            onEditBoard?.(post);
          }}
          onDeleteBoard={() => {
            onDeleteBoard?.(post.id);
          }}
          onEditMainMessage={() => {
            onEditMessage?.(post);
          }}
          onDeleteMainMessage={() => {
            onDeleteMessage?.(post);
          }}
          onEditContribution={(contribution) => {
            onEditMessage?.(post, contribution);
          }}
          onDeleteContribution={(contribution) => {
            onDeleteMessage?.(post, contribution);
          }}
        />
      )}

    </div>
  );
};
