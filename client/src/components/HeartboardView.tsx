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
  Check,
  Loader2,
  RefreshCw,
  Trash2,
  AlertTriangle,
  KeyRound
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import * as userApi from '../services/user.api';
import { uploadFile, validateFile } from '../services/upload.api';
import { toApiError } from '../lib/api';
import {
  notificationPermission,
  notificationSupport,
  requestNotificationPermission,
} from '../lib/notifications';
import { avatarDataUri, avatarPngFile, randomAvatarSeeds } from '../lib/avatars';
import { avatarFromParts, usernameOf } from '../lib/adapters';
import { useProfileHeartTokens, type HeartSpec } from '../hooks/useHeartTokens';
import { useMyBoards, useProfileBoards } from '../hooks/useBoards';
import { formatStatCount, plural } from '../lib/format';
import { SkeletonBlock } from './SmartImage';

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
  /**
   * The `profileUser` is still the stub derived from the handle in the URL —
   * its name and avatar are guesses. Show placeholders rather than rendering
   * them as if they were real.
   */
  isProfileLoading?: boolean;
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


/**
 * How many generated avatars the picker offers at once.
 *
 * These used to be five hard-coded Unsplash stock photos — real photographs of
 * real people, offered as if they were yours to wear. They are now DiceBear
 * `avataaars`, generated in the browser from random seeds (see ../lib/avatars).
 */
const GENERATED_AVATAR_COUNT = 5;

export type HeartboardSubTab = 'board' | 'tagged' | 'collaboration' | 'hearts';

export const HeartboardView: React.FC<HeartboardViewProps> = ({ 
  posts = [], 
  onPostClick, 
  onFilterClick,
  profileUser = null,
  isProfileLoading = false,
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

  // ── Profile state ──────────────────────────────────────────────────────────
  // The signed-in account comes from AuthContext (/user/me), which is the only
  // authority. `currentUser` is still accepted as a prop so this component keeps
  // working in isolation, but auth wins whenever a session exists.
  const { user: authUser, refresh: refreshAuth, logout } = useAuth();
  const account = authUser ?? currentUser ?? null;

  const [userName, setUserName] = useState(account?.name ?? 'You');
  const [userHandle, setUserHandle] = useState(account?.handle ?? '@you');
  const [userEmail, setUserEmail] = useState(account?.email ?? '');
  const [userBio, setUserBio] = useState(account?.bio ?? '');
  const [profileImage, setProfileImage] = useState<string | null>(account?.avatar || null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  /**
   * Whose profile the page is showing — the ONLY identity that share, copy-link
   * and the downloadable card may read.
   *
   * userName/userHandle/profileImage above are the SIGNED-IN account's editable
   * state. On someone else's profile they are still you, so every share path
   * that read them produced your own card and your own link while the page
   * showed theirs.
   */
  const sharedProfile = {
    name: profileUser?.name ?? userName,
    handle: profileUser?.handle ?? userHandle,
    avatar: profileUser?.avatar ?? profileImage ?? null,
  };

  // Mirror the account onto local state whenever it changes (initial /user/me
  // resolving, or a save that returns an updated document).
  React.useEffect(() => {
    if (!account) return;
    setUserName(account.name);
    setUserHandle(account.handle);
    setUserBio(account.bio ?? '');
    setUserEmail(account.email ?? '');
    if (account.avatar) setProfileImage(account.avatar);
  }, [account]);

  /** The signed-in user is the only one whose settings may be edited. */
  const canEditAccount = Boolean(authUser);
  const isOAuthAccount = authUser?.oauthProvider === 'google';

  // ── The profile heart button ───────────────────────────────────────────────
  //
  // It used to toggle POST /user/:id/like — a private counter that showed up
  // nowhere. It now blows a real LOVING heart token at this person, which lands
  // in the Loving category of their Heartboard, and pressing it again takes that
  // token back. One token per category per pair of people, so the button is a
  // straight on/off: given, or not given.
  //
  // The category itself is not a fixed list — it exists exactly as long as
  // somebody's token is in it. Take back the last Loving heart on a profile and
  // Loving stops being one of their categories.
  const LOVING_HEART: HeartSpec = { id: 'loving', label: 'Loving', emoji: '💛', theme: '#FAF0EC' };

  const viewedProfileHandle = usernameOf(profileUser?.handle);
  const viewedProfileId = profileUser?.id || undefined;
  const profileHearts = useProfileHeartTokens(
    viewedProfileHandle || undefined,
    authUser?.id,
  );
  const hasHeartedProfile = profileHearts.has(LOVING_HEART.id);
  const heartPending = profileHearts.pending;
  /** You cannot blow a heart at yourself, and a signed-out viewer has no set. */
  const canHeartThisProfile = Boolean(
    authUser && viewedProfileHandle && viewedProfileId !== authUser.id,
  );

  const handleToggleProfileHeart = async () => {
    if (!authUser) {
      // Reuses the gift-heart entry point purely for its auth gate: App sends
      // the visitor to /login and brings them back here afterwards. Showing a
      // toast and stopping left them with no way to act on the prompt.
      if (onGiftHeart && profileUser) onGiftHeart(asRegisteredUser(profileUser));
      else showToast('Sign in to blow a heart');
      return;
    }
    if (!canHeartThisProfile) return;

    const result = await profileHearts.toggle(LOVING_HEART);
    if (result === true) {
      showToast(`You blew a Loving Heart 💛 to ${profileUser?.name ?? 'this profile'}`);
    } else if (result === false) {
      showToast('Loving Heart removed');
    } else {
      showToast('That did not go through. Please try again.');
      return;
    }

    // The heart it just wrote (or removed) belongs to this profile's Hearts tab,
    // so whatever is on screen there is now one token out of date.
    if (isOwnProfileView) {
      myHeartsReceived.reload();
    } else {
      otherHeartsReceived.reload();
    }
  };

  // File Input Ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Temporary edit state. `tempHandle` is the real `username` (unique, used in
  // URLs); `tempName` is the cosmetic displayName. They used to be one field,
  // with the handle silently derived from the name — which meant renaming
  // yourself also changed your profile URL.
  const [tempName, setTempName] = useState(userName);
  const [tempHandle, setTempHandle] = useState(userHandle.replace(/^@/, ''));
  const [tempBio, setTempBio] = useState(userBio);
  const [tempProfileImage, setTempProfileImage] = useState<string | null>(profileImage);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Generated-avatar picker. Seeds are the state, not images: DiceBear is
  // deterministic, so a seed is the whole avatar and a reroll is one crypto
  // call. Previews are rendered from them on demand and kept by seed.
  const [avatarSeeds, setAvatarSeeds] = useState<string[]>(() =>
    randomAvatarSeeds(GENERATED_AVATAR_COUNT),
  );
  const [avatarPreviews, setAvatarPreviews] = useState<Record<string, string>>({});
  /** Which generated avatar is currently being rasterised and uploaded. */
  const [pendingAvatarSeed, setPendingAvatarSeed] = useState<string | null>(null);
  /**
   * The chosen seed, tracked separately because tempProfileImage holds the
   * uploaded Cloudinary URL rather than the preview, so it cannot identify
   * which tile it came from.
   */
  const [selectedAvatarSeed, setSelectedAvatarSeed] = useState<string | null>(null);

  // Settings State & Interactive Handlers
  const [boardVisibility, setBoardVisibility] = useState<'Public' | 'Only Recipient' | 'Anonymous'>('Public');
  const [contributionLimit, setContributionLimit] = useState<'Free' | 'Unlimited'>('Free');
  const [handshakeAutoConfirm, setHandshakeAutoConfirm] = useState(true);
  const [heartTokenAlerts, setHeartTokenAlerts] = useState(
    authUser?.notificationPrefs?.heartTokenAlerts ?? true,
  );
  const [trophyCaseUpdates, setTrophyCaseUpdates] = useState(
    authUser?.notificationPrefs?.trophyCaseUpdates ?? true,
  );
  const [savingPrefs, setSavingPrefs] = useState(false);

  React.useEffect(() => {
    const prefs = authUser?.notificationPrefs;
    if (!prefs) return;
    setHeartTokenAlerts(prefs.heartTokenAlerts ?? true);
    setTrophyCaseUpdates(prefs.trophyCaseUpdates ?? true);
  }, [authUser?.notificationPrefs]);

  // ── Account controls ───────────────────────────────────────────────────────
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Hashtag claiming has no backend yet (see CLIENT_MIGRATION_INSTRUCTIONS.txt) —
  // this list used to be seeded with fake pre-claimed tags. Starting empty is
  // honest about the fact that nothing has actually been claimed.
  const [activeHeartTags, setActiveHeartTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagManager, setShowTagManager] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedProfileLink, setCopiedProfileLink] = useState(false);
  const [shareModalData, setShareModalData] = useState<ShareData | null>(null);

  const handleCopyProfileLink = () => {
    // /profile/:username is the real route. This used to copy
    // "?profile=@handle", a prototype link that opens the bare feed.
    //
    // sharedProfile, not userHandle: on someone else's profile the latter is
    // still the SIGNED-IN account, so Copy handed out your own link while you
    // were looking at theirs.
    const profileUrl = `${window.location.origin}/profile/${encodeURIComponent(usernameOf(sharedProfile.handle))}`;
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
    setTempHandle(userHandle.replace(/^@/, ''));
    setTempBio(userBio);
    setTempProfileImage(profileImage);
    setSelectedAvatarSeed(null);
    setProfileError(null);
    setIsEditingProfile(true);
  };

  /**
   * Persists the profile to PATCH /user/profile.
   *
   * This used to set local React state and nothing else, so "Save Changes"
   * appeared to work and then reverted on the next reload.
   *
   * Only changed fields are sent: the server rejects an empty update, and
   * sending an unchanged username would still cost a uniqueness lookup.
   */
  const handleSaveProfile = async () => {
    if (!canEditAccount) {
      setProfileError('You need to be signed in to edit your profile.');
      return;
    }

    const nextName = tempName.trim();
    const nextHandle = tempHandle.trim().replace(/^@/, '').toLowerCase();
    const nextBio = tempBio.trim();

    if (nextHandle && (nextHandle.length < 3 || nextHandle.length > 14)) {
      setProfileError('Username must be between 3 and 14 characters.');
      return;
    }
    if (nextHandle && !/^[a-z0-9_.-]+$/.test(nextHandle)) {
      setProfileError('Username can only contain letters, numbers, . _ and -');
      return;
    }
    if (nextBio.length > 160) {
      setProfileError('Bio must be 160 characters or fewer.');
      return;
    }

    const payload: Parameters<typeof userApi.updateProfile>[0] = {};
    if (nextName !== userName) payload.displayName = nextName;
    if (nextHandle !== userHandle.replace(/^@/, '').toLowerCase()) payload.username = nextHandle;
    if (nextBio !== userBio) payload.bio = nextBio;
    if ((tempProfileImage ?? '') !== (profileImage ?? '')) {
      payload.profileImage = tempProfileImage ?? '';
    }

    if (Object.keys(payload).length === 0) {
      setIsEditingProfile(false);
      showToast('No changes to save');
      return;
    }

    setIsSavingProfile(true);
    setProfileError(null);
    try {
      await userApi.updateProfile(payload);
      // Re-read /user/me so every consumer of AuthContext sees the new values,
      // not just this drawer.
      await refreshAuth();
      setIsEditingProfile(false);
      showToast('Profile updated');
    } catch (e) {
      // 409 = username taken. Surface the server's own wording.
      setProfileError(toApiError(e).message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  /**
   * Uploads the avatar to Cloudinary and keeps only the URL.
   *
   * The previous implementation stored a base64 data URL in state and would
   * have written multiple megabytes into the user document — the same failure
   * that bloated Message.canvasData. The server now rejects `data:` URLs.
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset the input so re-picking the same file fires a change event again.
    e.target.value = '';
    if (!file) return;

    const problem = validateFile(file, 'image');
    if (problem) {
      showToast(problem);
      return;
    }

    if (!canEditAccount) {
      showToast('Sign in to change your profile picture');
      return;
    }

    setIsUploadingAvatar(true);
    setProfileError(null);
    try {
      const { url } = await uploadFile(file, 'image');
      setTempProfileImage(url);
      // An uploaded photo replaces a generated pick, so drop the tile's ring.
      setSelectedAvatarSeed(null);

      // The camera button is also reachable outside the edit form, where there
      // is no Save button to press — persist immediately in that case.
      if (!isEditingProfile) {
        await userApi.updateProfile({ profileImage: url });
        await refreshAuth();
        setProfileImage(url);
        showToast('Profile picture updated');
      } else {
        showToast('Picture ready — press Save Changes');
      }
    } catch (err) {
      const message = toApiError(err).message;
      setProfileError(message);
      showToast(message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  /**
   * Renders previews for the offered seeds, but only while the edit form is
   * open — that keeps the 120KB style definition off every other page load,
   * since the dynamic import inside avatarDataUri never runs until now.
   */
  React.useEffect(() => {
    if (!isEditingProfile) return;

    let cancelled = false;
    void Promise.all(
      avatarSeeds.map(async (seed) => [seed, await avatarDataUri(seed)] as const),
    )
      .then((entries) => {
        if (!cancelled) setAvatarPreviews(Object.fromEntries(entries));
      })
      .catch(() => {
        // The tiles stay as placeholders; uploading a photo still works.
        if (!cancelled) setAvatarPreviews({});
      });

    return () => {
      cancelled = true;
    };
  }, [isEditingProfile, avatarSeeds]);

  /**
   * Picks a generated avatar.
   *
   * The SVG is rasterised and uploaded rather than stored directly: the server
   * rejects `data:` URLs on profileImage, so a generated avatar has to become a
   * hosted image exactly like an uploaded photo. Save Changes then persists the
   * returned URL along with the rest of the form.
   */
  const handlePickGeneratedAvatar = async (seed: string) => {
    if (!canEditAccount) {
      showToast('Sign in to change your profile picture');
      return;
    }

    setPendingAvatarSeed(seed);
    setProfileError(null);
    try {
      const { url } = await uploadFile(await avatarPngFile(seed), 'image');
      setTempProfileImage(url);
      setSelectedAvatarSeed(seed);
      showToast('Avatar ready — press Save Changes');
    } catch (err) {
      const message = toApiError(err).message;
      setProfileError(message);
      showToast(message);
    } finally {
      setPendingAvatarSeed(null);
    }
  };

  /** Rolls a fresh set of faces. Any pick already made is left alone. */
  const handleShuffleAvatars = () => {
    setAvatarPreviews({});
    setAvatarSeeds(randomAvatarSeeds(GENERATED_AVATAR_COUNT));
  };

  /** Notification toggles: optimistic, reverted if the request fails. */
  const persistNotificationPref = async (
    key: 'heartTokenAlerts' | 'trophyCaseUpdates',
    value: boolean,
    label: string,
  ) => {
    const setter = key === 'heartTokenAlerts' ? setHeartTokenAlerts : setTrophyCaseUpdates;
    setter(value);

    if (!canEditAccount) {
      showToast('Sign in to change notification settings');
      setter(!value);
      return;
    }

    // Turning a toggle on is the user gesture the browser requires for the
    // permission prompt — asking anywhere else is silently ignored. Saving the
    // pref does not depend on the answer: the toggle is the user's intent, and
    // permission can be granted later from the address bar.
    let permission = notificationPermission();
    if (value && notificationSupport() === 'supported' && permission === 'default') {
      permission = await requestNotificationPermission();
    }

    setSavingPrefs(true);
    try {
      await userApi.updateProfile({
        notificationPrefs: { [key]: value } as Record<typeof key, boolean>,
      });
      await refreshAuth();

      if (!value) {
        showToast(`${label} disabled`);
      } else if (notificationSupport() === 'unsupported') {
        showToast(`${label} enabled — this browser cannot show notifications`);
      } else if (permission === 'denied') {
        showToast(`${label} enabled — allow notifications in your browser to receive them`);
      } else if (permission === 'granted') {
        showToast(`${label} enabled`);
      } else {
        showToast(`${label} enabled — allow notifications when your browser asks`);
      }
    } catch (err) {
      setter(!value);
      showToast(toApiError(err).message);
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setPasswordError('Enter both your current and new password.');
      return;
    }
    setIsChangingPassword(true);
    setPasswordError(null);
    try {
      await userApi.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setShowPasswordForm(false);
      showToast('Password changed');
    } catch (err) {
      setPasswordError(toApiError(err).message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  /**
   * Deletes the account. The server deactivates the user's boards and removes
   * the user and subscription — it is not reversible, hence the typed
   * confirmation.
   */
  const handleDeleteAccount = async () => {
    if (deleteConfirm.trim().toLowerCase() !== 'delete') return;
    setIsDeleting(true);
    try {
      await userApi.deleteAccount();
      await logout();
      setIsSettingsOpen(false);
      if (onSignOut) onSignOut();
    } catch (err) {
      showToast(toApiError(err).message);
      setIsDeleting(false);
    }
  };

  /**
   * Board and Tagged always come from the server, on ANY profile — your own or
   * someone else's. The server draws the line the product intends:
   *
   *   Board  = boards this person CREATED
   *   Tagged = boards someone ELSE created with this person as the recipient
   *
   *   Collab = boards someone ELSE created that this person left a message on
   *
   * Hearts uses the owned/tagged views too — a blown heart is stored as a board
   * with kind 'heart' — see the heart queries below.
   *
   * Collaboration used to have no server view and filtered the `posts` this
   * component happened to be handed (the discover feed) for a contributor whose
   * name matched. A board you wrote on is not in that list except by accident,
   * so the tab was empty for almost everyone. The server answers it now, from
   * the messages themselves.
   */
  const isOwnProfileView = !profileUser;
  const serverBoardView: 'owned' | 'tagged' | 'collaboration' | null =
    activeSubTab === 'board'
      ? 'owned'
      : activeSubTab === 'tagged'
        ? 'tagged'
        : activeSubTab === 'collaboration'
          ? 'collaboration'
          : null;

  // Own profile: GET /board?view=… (includes private and link-only boards).
  const myBoards = useMyBoards(serverBoardView ?? 'owned', {
    enabled: Boolean(serverBoardView && isOwnProfileView && authUser),
    currentUserId: authUser?.id,
  });

  // Someone else's profile: GET /user/profile/:username?view=… (public only).
  const otherBoards = useProfileBoards(usernameOf(profileUser?.handle), serverBoardView ?? 'owned', {
    enabled: Boolean(serverBoardView && !isOwnProfileView && profileUser?.handle),
    currentUserId: authUser?.id,
  });

  const serverBoards = isOwnProfileView ? myBoards.items : otherBoards.items;
  const serverBoardsLoading = isOwnProfileView ? myBoards.loading : otherBoards.loading;
  const usingServerBoards = Boolean(serverBoardView && serverBoards);

  // Helper to reliably identify heart token items vs message boards
  const isHeartPost = (item: any) => {
    return Boolean(
      item.isHeartToken ||
      item.type === 'heart_token' ||
      item.section === 'hearts' ||
      item.tab === 'hearts'
    );
  };

  // A heart token IS a board underneath, so it would otherwise show up as a
  // card on the Board and Tagged tabs as well as under Hearts.
  const allAvailableItems = (usingServerBoards ? (serverBoards as any[]) : posts).filter(
    (item) => !isHeartPost(item),
  );

  // ── Hearts, from the server ────────────────────────────────────────────────
  //
  // Sent hearts are boards this person owns; received hearts are boards
  // addressed to them. Both were previously filtered out of whatever `posts`
  // the view happened to be handed — the discover feed's first page on your own
  // Heartboard, that person's public boards on someone else's — so a heart
  // blown to you appeared only if it happened to be in that slice, and usually
  // never appeared at all.
  const heartsTabActive = activeSubTab === 'hearts';
  const heartsEnabled =
    heartsTabActive && (isOwnProfileView ? Boolean(authUser) : Boolean(profileUser?.handle));

  const myHeartsSent = useMyBoards('owned', {
    kind: 'heart',
    enabled: heartsEnabled && isOwnProfileView,
    currentUserId: authUser?.id,
  });
  const myHeartsReceived = useMyBoards('tagged', {
    kind: 'heart',
    enabled: heartsEnabled && isOwnProfileView,
    currentUserId: authUser?.id,
  });
  const otherHeartsSent = useProfileBoards(usernameOf(profileUser?.handle), 'owned', {
    kind: 'heart',
    enabled: heartsEnabled && !isOwnProfileView,
    currentUserId: authUser?.id,
  });
  const otherHeartsReceived = useProfileBoards(usernameOf(profileUser?.handle), 'tagged', {
    kind: 'heart',
    enabled: heartsEnabled && !isOwnProfileView,
    currentUserId: authUser?.id,
  });

  const serverSentHearts = isOwnProfileView ? myHeartsSent.items : otherHeartsSent.items;
  const serverReceivedHearts = isOwnProfileView ? myHeartsReceived.items : otherHeartsReceived.items;
  // `items === null` covers the render between mount and the fetch effect, when
  // `loading` is still false — otherwise the trophy case flashes "no hearts
  // yet" before the first request has even been sent.
  const heartsLoading =
    heartsEnabled &&
    (isOwnProfileView
      ? myHeartsSent.loading || myHeartsReceived.loading ||
        myHeartsSent.items === null || myHeartsReceived.items === null
      : otherHeartsSent.loading || otherHeartsReceived.loading ||
        otherHeartsSent.items === null || otherHeartsReceived.items === null);

  // Is this viewing another user's profile or own heartboard?
  const isViewingOtherUser = Boolean(profileUser);
  const currentUserName = isViewingOtherUser ? profileUser!.name : userName;
  const currentUserHandle = isViewingOtherUser ? profileUser!.handle : userHandle;

  /**
   * Where to send someone who shares a heart category.
   *
   * A heart category is not addressable — there is no route for one — so the
   * shareable thing is the Heartboard it lives on. The links used to point at
   * /?hearts=<id>, which no route has ever matched.
   */
  const heartboardShareUrl = `${window.location.origin}/profile/${encodeURIComponent(
    usernameOf(sharedProfile.handle),
  )}`;

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

  // Dynamic user-received hearts: hearts sent TO the active user/profile.
  //
  // The own-profile branch used to be "anything I did not create". That was
  // harmless while `posts` only ever held tokens made in this browser session,
  // but heart tokens are stored server-side now, so the discover feed carries
  // everyone's — and every one of them would have counted as received by you.
  // Match the recipient properly instead.
  const dynamicReceivedHearts = allHeartTokenPosts.filter((p: any) => {
    if (!isViewingOtherUser && p.isCreatedByUser === true) return false;

    const rec = (p.recipientName || p.targetId || '').toLowerCase();
    const recH = usernameOf(p.recipientHandle);
    const recs = (p.recipients || []).map((r: string) => r.toLowerCase());
    const target = currentUserName.toLowerCase();
    const targetH = usernameOf(currentUserHandle);
    const recipientId = (p.recipientId || '').toLowerCase();

    return (
      (Boolean(targetH) && (recH === targetH || recs.includes(`@${targetH}`) || recs.includes(targetH))) ||
      (Boolean(target) && (rec === target || recs.includes(target))) ||
      (Boolean(authUser?.id) && !isViewingOtherUser && recipientId === authUser!.id.toLowerCase()) ||
      (Boolean(profileUser?.id) && isViewingOtherUser && recipientId === profileUser!.id.toLowerCase())
    );
  });

  /**
   * Server hearts first, with anything created in this session merged on top.
   *
   * The local half matters for the seconds between blowing a heart and the
   * server list refetching — the newly created token is already in `posts`, and
   * dropping it would make the heart look like it had not landed.
   */
  const mergeHearts = (fromServer: any[] | null, local: any[]) => {
    const server = (fromServer ?? []).filter(isHeartPost);
    if (!fromServer) return local;
    const seen = new Set(server.map((p) => p.id));
    return [...server, ...local.filter((p) => !seen.has(p.id))];
  };

  const allReceivedHearts = mergeHearts(serverReceivedHearts, dynamicReceivedHearts);
  const allSentHearts = mergeHearts(serverSentHearts, dynamicSentHearts);

  // Dynamically calculate category stats strictly for the active filter (Received vs Sent)
  const buildCategoriesForDataset = (dataset: any[], isSentFilter: boolean): HeartCategoryCardData[] => {
    return SEMANTIC_SPECS.map((spec) => {
      const matchedEntries: any[] = [];

      dataset.forEach((post) => {
        // A heart token carries the category it WAS SENT AS, and nothing else
        // decides which category it belongs to.
        //
        // This used to fall back to scanning the token's text — "loving" in the
        // body put it under Loving, "vision" under Visionary, and the default
        // wording ("Loving Heart 💛 blown to X with deepest appreciation!")
        // contains several of those words at once. So one heart could light up
        // three categories, and a category could appear on a profile that had
        // never been sent it. Every token has a real id now; use it.
        const heartIds: string[] = [
          ...(Array.isArray(post.selectedHearts) ? post.selectedHearts : []),
          ...(post.heartDetails?.id ? [post.heartDetails.id] : []),
        ].map((h: string) => String(h).toLowerCase());

        const isMatch = heartIds.includes(spec.id);

        if (isMatch) {
          if (isSentFilter) {
            // In Sent mode, show recipient details
            const recName = post.recipientName || post.targetId || 'Recipient';
            const recHandle = post.recipientHandle || post.recipients?.[0] || (post.recipientName ? `@${post.recipientName.toLowerCase().replace(/\s+/g, '')}` : '@recipient');
            const recAvatar = avatarFromParts({
              id: post.recipientId,
              username: usernameOf(recHandle),
              name: recName,
              profileImage: post.recipientAvatar,
            });

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
            const sndAvatar = avatarFromParts({
              id: post.authorId,
              username: usernameOf(sndHandle),
              name: sndName,
              profileImage: post.authorAvatar,
            });

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
    const targetName = (profileUser?.name || currentUser?.name || userName || 'You').trim();
    const targetHandle = (profileUser?.handle || currentUser?.handle || userHandle || '@you').trim();
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

    // The server already returned exactly this tab's boards (owner: me for
    // Board, receipent: me for Tagged), so re-deciding membership here with
    // name matching could only throw correct rows away.
    if (usingServerBoards) {
      if (isHeartPost(item)) return false;
      matchesTab = true;
    } else if (activeSubTab === 'board') {
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
            onClick={() => {
              // Set the data explicitly rather than relying on the fallback, so
              // a stale shareModalData from a previously shared board or heart
              // category cannot be reused for this profile.
              setShareModalData({
                type: 'profile',
                userHandle: sharedProfile.handle,
                userName: sharedProfile.name,
                profileImage: sharedProfile.avatar,
              });
              setIsShareModalOpen(true);
            }}
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
            {isProfileLoading ? (
              <SkeletonBlock className="w-full h-full" rounded="rounded-full" />
            ) : profileUser.avatar ? (
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
              {isProfileLoading ? (
                // The stub's name is the URL handle with its first letter
                // capitalised, and its counts are zero. Showing that and then
                // replacing it read as one profile becoming a different person.
                <>
                  <SkeletonBlock className="h-8 sm:h-9 md:h-10 w-48 sm:w-56" rounded="rounded-xl" />
                  <SkeletonBlock className="h-4 w-40 mt-2" rounded="rounded-lg" />
                </>
              ) : (
                <>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1A1B25] tracking-tight">
                    {profileUser.name}
                  </h2>
                  {/* Real counts from the profile's live stats. These used to
                      fall back to a hard-coded "101.6M Messages | 30.6M
                      Tagged" — and taggedCount was never mapped from the API
                      at all, so the fallback is what every profile showed. */}
                  <p className="text-xs sm:text-sm md:text-base font-semibold text-[#808897] mt-1">
                    {formatStatCount(profileUser.messagesCount)} {plural(profileUser.messagesCount, 'Message')}
                    &nbsp;|&nbsp;
                    {formatStatCount(profileUser.taggedCount)} Tagged
                  </p>
                </>
              )}
            </div>

            {/* Action buttons: Heart & Message */}
            <div className="flex items-center gap-3 mt-2">
              {/* Blows a Loving heart token straight at this person — no
                  composer, no form. Pressing it again takes that heart back
                  off their Heartboard. */}
              <button
                onClick={handleToggleProfileHeart}
                // Signed-out visitors keep the button live: pressing it routes
                // them to sign-in. Only "this is you" makes it inert.
                disabled={heartPending || Boolean(authUser && viewedProfileId === authUser.id)}
                aria-pressed={hasHeartedProfile}
                className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-95 border-2 disabled:cursor-default disabled:opacity-60 ${
                  hasHeartedProfile
                    ? 'bg-[#FFF1EE] border-[#FFD5CC] text-[#FE6349] hover:bg-[#FFE7E2]'
                    : 'bg-[#ffffff] border-[#ECEFF3] text-[#1A1B25] hover:bg-[#F8F9FB]'
                }`}
              >
                <Heart
                  className={`w-4 h-4 stroke-[2.5] transition-colors ${
                    hasHeartedProfile ? 'text-[#FE6349] fill-[#FE6349]' : 'text-[#1A1B25] fill-none'
                  }`}
                />
                <span>{hasHeartedProfile ? 'Hearted' : 'Heart'}</span>
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
                    userHandle: sharedProfile.handle,
                    userName: sharedProfile.name,
                    profileImage: sharedProfile.avatar,
                    // No `url`: ShareProfileModal builds /profile/:handle. This
                    // used to pass /#handle, which lands on the bare feed.
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
                ? "Search received hearts by type or sender's name..."
                : "Search sent hearts by type or recipient's name..."
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
            {/* Hearts are fetched now, so "none yet" must not be shown while
                the request is still out — that reads as an empty trophy case. */}
            {heartsLoading ? (
              <>
                <div className="w-6 h-6 border-2 border-[#FE6349] border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs font-semibold text-gray-400">Loading hearts…</p>
              </>
            ) : (
            <>
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
            </>
            )}
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
                    url: heartboardShareUrl,
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
      ) : serverBoardsLoading && filteredItems.length === 0 ? (
        // "No boards yet" while the request is still in flight reads as an
        // empty account rather than as loading.
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 my-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="w-full aspect-[380/474]" rounded="rounded-2xl sm:rounded-[2.5rem]" />
          ))}
        </div>
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
                          url: heartboardShareUrl,
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
                              {/*
                                Tooltip Card. Opens BELOW the bubble.
                                It used to open above (bottom-full), but the
                                grid's scrollable area sits directly under the
                                drawer's search bar with only ~40px of padding
                                above the first row — nowhere near enough room
                                for the ~120px tall card, so it was clipped by
                                the drawer's overflow-hidden body for every
                                heart in that row (the ones a user opens first).
                                Opening downward always has scrollable room
                                below, so it can never run out of space the
                                same way.
                              */}
                              <AnimatePresence>
                                {isTooltipOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -6, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute top-full mt-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto min-w-[160px]"
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

                                      {/* Top Pointer Tail Arrow — points up at the bubble above it */}
                                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-gray-100/90 rotate-45" />
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
              // Above the bottom nav (z-100), not below it. At z-50 the nav sat
              // on top of the drawer and covered Sign Out at the bottom of it,
              // and stayed tappable through the backdrop.
              className="fixed inset-0 bg-black/40 z-[110] backdrop-blur-xs"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 240 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-sm sm:max-w-md bg-white z-[110] flex flex-col overflow-hidden font-sans"
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

              {/* Drawer Content Body. The trailing padding keeps Sign Out clear
                  of a phone's home indicator once it is scrolled to. */}
              <div className="flex-1 overflow-y-auto p-6 pb-10 space-y-6">
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
                            disabled={isUploadingAvatar || !canEditAccount}
                            title="Upload profile picture"
                            className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer disabled:cursor-not-allowed"
                          >
                            {isUploadingAvatar ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Camera className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-[#1A1B25] truncate">{userName}</h3>
                          <p className="text-xs text-[#A4ABB8] font-medium truncate">{userHandle}</p>
                          {userEmail && (
                            <p className="text-[11px] text-[#A4ABB8] font-medium truncate">{userEmail}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={handleStartEdit}
                        disabled={!canEditAccount}
                        className="px-3.5 py-1.5 rounded-full bg-white text-xs font-semibold text-[#1A1B25] hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
                              disabled={isUploadingAvatar}
                              className="px-3 py-1.5 rounded-full bg-white text-xs font-semibold text-[#1A1B25] hover:bg-gray-50 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {isUploadingAvatar ? (
                                <Loader2 className="w-3.5 h-3.5 text-[#666D80] animate-spin" />
                              ) : (
                                <Camera className="w-3.5 h-3.5 text-[#666D80]" />
                              )}
                              <span>{isUploadingAvatar ? 'Uploading…' : 'Upload Photo'}</span>
                            </button>
                            {tempProfileImage && (
                              <button
                                type="button"
                                onClick={() => {
                                  setTempProfileImage(null);
                                  setSelectedAvatarSeed(null);
                                }}
                                className="px-2.5 py-1.5 rounded-full bg-gray-100 text-xs font-medium text-[#666D80] hover:bg-gray-200 transition-all cursor-pointer"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Generated Avatars */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-semibold text-[#808897]">Or choose a generated avatar:</span>
                          <button
                            type="button"
                            onClick={handleShuffleAvatars}
                            disabled={pendingAvatarSeed !== null}
                            title="Generate a new set"
                            className="flex items-center gap-1 text-[10px] font-semibold text-[#666D80] hover:text-[#1A1B25] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <RefreshCw className="w-3 h-3" strokeWidth={2.5} />
                            <span>Shuffle</span>
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          {avatarSeeds.map((seed) => {
                            const preview = avatarPreviews[seed];
                            const isSelected = selectedAvatarSeed === seed;
                            const isPending = pendingAvatarSeed === seed;
                            return (
                              <button
                                key={seed}
                                type="button"
                                onClick={() => handlePickGeneratedAvatar(seed)}
                                disabled={pendingAvatarSeed !== null || isUploadingAvatar}
                                title="Use this avatar"
                                className={`w-8 h-8 rounded-full overflow-hidden bg-[#FDF4F2] flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed ${
                                  isSelected
                                    ? 'ring-2 ring-[#FE6349] scale-105 opacity-100'
                                    : 'opacity-60 hover:opacity-100'
                                }`}
                              >
                                {isPending ? (
                                  <Loader2 className="w-3.5 h-3.5 text-[#FE6349] animate-spin" />
                                ) : preview ? (
                                  <img src={preview} alt="Generated avatar" className="w-full h-full object-cover" />
                                ) : (
                                  // Waiting on the style definition to load.
                                  <span className="w-full h-full bg-gray-100 animate-pulse" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-[#353849] mb-1 block">Display Name</label>
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          maxLength={50}
                          className="w-full bg-gray-25 border-none outline-none rounded-xl px-3 py-2 text-xs font-bold text-[#1A1B25]"
                          placeholder="e.g. Micky Mouse"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-[#353849] mb-1 block">Username</label>
                        <div className="flex items-center bg-gray-25 rounded-xl px-3">
                          <span className="text-xs font-bold text-[#666D80]">@</span>
                          <input
                            type="text"
                            value={tempHandle}
                            onChange={(e) => setTempHandle(e.target.value.replace(/\s+/g, ''))}
                            maxLength={14}
                            className="flex-1 bg-transparent border-none outline-none py-2 pl-0.5 text-xs font-bold text-[#1A1B25]"
                            placeholder="mickymouse"
                          />
                        </div>
                        <p className="text-[10px] text-[#666D80] font-semibold mt-1">
                          This is your profile URL. 3–14 characters.
                        </p>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-[#353849] mb-1 block">Bio</label>
                        <textarea
                          value={tempBio}
                          onChange={(e) => setTempBio(e.target.value)}
                          maxLength={160}
                          rows={2}
                          className="w-full bg-gray-25 border-none outline-none rounded-xl px-3 py-2 text-xs font-bold text-[#1A1B25] resize-none"
                          placeholder="A short line about you"
                        />
                        <p className="text-[10px] text-[#666D80] font-semibold mt-1 text-right">
                          {tempBio.length}/160
                        </p>
                      </div>

                      {/*
                        Email is read-only. There is no change-email endpoint —
                        moving an account to a new address has to re-run the
                        verification flow, and PATCH /user/profile rejects the
                        field outright.
                      */}
                      <div>
                        <label className="text-[11px] font-bold text-[#353849] mb-1 block">Email</label>
                        <div className="w-full bg-gray-25 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#1A1B25] truncate">
                            {userEmail || 'Not signed in'}
                          </span>
                          {userEmail && (
                            authUser?.isEmailVerified ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-[#4CB993] shrink-0">
                                <CheckCircle2 className="w-3 h-3" /> Verified
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-[#E8A33D] shrink-0">Unverified</span>
                            )
                          )}
                        </div>
                        <p className="text-[10px] text-[#666D80] font-semibold mt-1">
                          Email can't be changed here — it needs re-verification.
                        </p>
                      </div>

                      {profileError && (
                        <p className="text-[11px] font-semibold text-red-600 bg-red-50 rounded-xl px-3 py-2">
                          {profileError}
                        </p>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => {
                            setIsEditingProfile(false);
                            setProfileError(null);
                          }}
                          disabled={isSavingProfile}
                          className="px-3 py-1.5 rounded-full bg-gray-25 text-xs font-medium text-[#666D80] hover:bg-gray-50 cursor-pointer disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          disabled={isSavingProfile || isUploadingAvatar}
                          className="px-4 py-1.5 rounded-full bg-[#1A1B25] text-white text-xs font-semibold hover:bg-black cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                          {isSavingProfile && <Loader2 className="w-3 h-3 animate-spin" />}
                          {isSavingProfile ? 'Saving…' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {/* Section: Notifications */}
                <div>
                  <h4 className="text-xs font-bold text-[#808897] uppercase tracking-wider mb-3">Notifications</h4>
                  {/* Without this, a browser-level block is invisible: the
                      toggles read as on while nothing ever arrives. */}
                  {(heartTokenAlerts || trophyCaseUpdates) && notificationSupport() === 'unsupported' && (
                    <p className="text-[11px] font-medium text-[#A4ABB8] mb-2 px-1">
                      This browser cannot show notifications.
                    </p>
                  )}
                  {(heartTokenAlerts || trophyCaseUpdates) && notificationPermission() === 'denied' &&
                    notificationSupport() === 'supported' && (
                    <p className="text-[11px] font-semibold text-amber-600 mb-2 px-1">
                      Notifications are blocked for this site — allow them in your browser to receive these.
                    </p>
                  )}
                  <div className="bg-gray-25 rounded-2xl overflow-hidden divide-y divide-gray-100">
                    <div
                      onClick={() => {
                        if (savingPrefs) return;
                        void persistNotificationPref('heartTokenAlerts', !heartTokenAlerts, 'Heart Token Alerts');
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
                        if (savingPrefs) return;
                        void persistNotificationPref('trophyCaseUpdates', !trophyCaseUpdates, 'Trophy Case Updates');
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

                {/* Section: Account — backed by /user/change-password and
                    /user/delete-account, which existed on the server but had
                    no UI. */}
                {canEditAccount && (
                  <div>
                    <h4 className="text-xs font-bold text-[#808897] uppercase tracking-wider mb-3">Account</h4>
                    <div className="bg-gray-25 rounded-2xl overflow-hidden divide-y divide-gray-100">
                      {/* Change password — unavailable for Google accounts,
                          which have no password on the server at all. */}
                      <div
                        onClick={() => !isOAuthAccount && setShowPasswordForm(!showPasswordForm)}
                        className={`p-4 flex items-center justify-between transition-colors ${
                          isOAuthAccount ? 'opacity-60' : 'hover:bg-gray-50 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <KeyRound className="w-4 h-4 text-[#666D80]" />
                          <div>
                            <p className="text-xs font-bold text-[#1A1B25]">Change Password</p>
                            <p className="text-[11px] text-[#A4ABB8] font-medium">
                              {isOAuthAccount
                                ? 'Managed by Google — change it there'
                                : 'Update your sign-in password'}
                            </p>
                          </div>
                        </div>
                        {!isOAuthAccount && (
                          <ChevronRight
                            className={`w-4 h-4 text-[#A4ABB8] transition-transform ${showPasswordForm ? 'rotate-90' : ''}`}
                          />
                        )}
                      </div>

                      {showPasswordForm && !isOAuthAccount && (
                        <div className="p-4 space-y-2.5">
                          <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Current password"
                            autoComplete="current-password"
                            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-[#1A1B25] outline-none focus:border-[#1A1B25]"
                          />
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New password"
                            autoComplete="new-password"
                            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-[#1A1B25] outline-none focus:border-[#1A1B25]"
                          />
                          <p className="text-[10px] text-[#A4ABB8] font-medium">
                            At least 5 characters, with an uppercase letter, a number and a symbol.
                          </p>
                          {passwordError && (
                            <p className="text-[11px] font-semibold text-red-600">{passwordError}</p>
                          )}
                          <button
                            onClick={handleChangePassword}
                            disabled={isChangingPassword}
                            className="w-full py-2 rounded-xl bg-[#1A1B25] text-white text-xs font-semibold hover:bg-black cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
                          >
                            {isChangingPassword && <Loader2 className="w-3 h-3 animate-spin" />}
                            {isChangingPassword ? 'Updating…' : 'Update Password'}
                          </button>
                        </div>
                      )}

                      {/* Delete account */}
                      <div
                        onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                        className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Trash2 className="w-4 h-4 text-red-500" />
                          <div>
                            <p className="text-xs font-bold text-red-600">Delete Account</p>
                            <p className="text-[11px] text-[#A4ABB8] font-medium">
                              Permanently removes your account
                            </p>
                          </div>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 text-[#A4ABB8] transition-transform ${showDeleteConfirm ? 'rotate-90' : ''}`}
                        />
                      </div>

                      {showDeleteConfirm && (
                        <div className="p-4 space-y-2.5 bg-red-50/50">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-[#666D80] font-medium">
                              Your boards will be deactivated and your account removed. This cannot be undone.
                            </p>
                          </div>
                          <input
                            type="text"
                            value={deleteConfirm}
                            onChange={(e) => setDeleteConfirm(e.target.value)}
                            placeholder='Type "delete" to confirm'
                            className="w-full bg-white border border-red-200 rounded-xl px-3 py-2 text-xs font-medium text-[#1A1B25] outline-none focus:border-red-500"
                          />
                          <button
                            onClick={handleDeleteAccount}
                            disabled={isDeleting || deleteConfirm.trim().toLowerCase() !== 'delete'}
                            className="w-full py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                          >
                            {isDeleting && <Loader2 className="w-3 h-3 animate-spin" />}
                            {isDeleting ? 'Deleting…' : 'Delete My Account'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
          // The profile ON SCREEN, not the signed-in account. The modal derives
          // /profile/:handle and renders the downloadable card from these.
          userHandle: sharedProfile.handle,
          userName: sharedProfile.name,
          profileImage: sharedProfile.avatar,
        }}
        onShowToast={showToast}
      />
    </div>
  );
};
