import { useState, useEffect, useCallback, useRef } from 'react';
import { Post, RegisteredUser } from '../types';

interface EngagementStorageData {
  totalUsageSeconds: number;
  lastVisitTimestamp: number;
  lastMessageCreatedTimestamp: number | null;
  hasCreatedOrSentHeart: boolean;
  shownTriggers: string[];
  lastDismissedTimestamp: number | null;
}

const STORAGE_KEY = 'heartboard_engagement_tracker_v1';
const COOLDOWN_MS = 12 * 60 * 60 * 1000; // 12 hours between prompts if dismissed

function getStoredData(): EngagementStorageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // fallback
  }
  return {
    totalUsageSeconds: 0,
    lastVisitTimestamp: Date.now(),
    lastMessageCreatedTimestamp: null,
    hasCreatedOrSentHeart: false,
    shownTriggers: [],
    lastDismissedTimestamp: null,
  };
}

function saveStoredData(data: EngagementStorageData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // fallback
  }
}

export function useEngagementPrompt(
  currentUser: RegisteredUser | null,
  posts: Post[],
  isAnyOtherModalOpen: boolean
) {
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [activeTriggerReason, setActiveTriggerReason] = useState<string>('');
  const sessionBoardsViewedRef = useRef<number>(0);
  const hasTriggeredThisSessionRef = useRef<boolean>(false);

  // Mark an action taken (created message, blew heart)
  const recordUserCreatedMessageOrHeart = useCallback(() => {
    const data = getStoredData();
    data.hasCreatedOrSentHeart = true;
    data.lastMessageCreatedTimestamp = Date.now();
    saveStoredData(data);
  }, []);

  // Track viewing a board
  const recordBoardViewed = useCallback(() => {
    sessionBoardsViewedRef.current += 1;
    checkTriggers('board_view');
  }, []);

  // Dismiss prompt
  const dismissPrompt = useCallback(() => {
    setIsPromptOpen(false);
    const data = getStoredData();
    data.lastDismissedTimestamp = Date.now();
    saveStoredData(data);
  }, []);

  // Trigger checker
  const checkTriggers = useCallback((source: 'timer' | 'board_view' | 'initial_load') => {
    if (isAnyOtherModalOpen || isPromptOpen || hasTriggeredThisSessionRef.current) {
      return;
    }

    const data = getStoredData();
    const now = Date.now();

    // Check cooldown
    if (data.lastDismissedTimestamp && (now - data.lastDismissedTimestamp) < COOLDOWN_MS) {
      return;
    }

    const shown = new Set(data.shownTriggers || []);

    // 1. Returning User: User returns after being away for 7+ days and has previously interacted/created
    const daysSinceLastVisit = (now - (data.lastVisitTimestamp || now)) / (1000 * 60 * 60 * 24);
    if (!shown.has('returning_user') && daysSinceLastVisit >= 7 && data.hasCreatedOrSentHeart) {
      firePrompt('returning_user', 'Welcome back! Reconnect and share appreciation.');
      return;
    }

    // 2. Inactive Creator: Created at least one message before, but has not created for 15+ days
    if (!shown.has('inactive_creator') && data.lastMessageCreatedTimestamp) {
      const daysSinceCreated = (now - data.lastMessageCreatedTimestamp) / (1000 * 60 * 60 * 24);
      if (daysSinceCreated >= 15) {
        firePrompt('inactive_creator', 'It has been a while since your last message. Who deserves some love today?');
        return;
      }
    }

    // 3. Recent Engagement: Viewed 5+ boards in current session without taking action
    if (!shown.has('recent_engagement_5_boards') && sessionBoardsViewedRef.current >= 5 && !data.hasCreatedOrSentHeart) {
      firePrompt('recent_engagement_5_boards', 'You have been exploring heartfelt tributes. Send one of your own!');
      return;
    }

    // 4. Active Viewer: Spent 10+ minutes (600s) viewing/browsing without creating or sending a heart
    if (!shown.has('active_viewer_10_min') && data.totalUsageSeconds >= 600 && !data.hasCreatedOrSentHeart) {
      firePrompt('active_viewer_10_min', 'You have spent time exploring Heartboard. Why not send a heart to someone you care about?');
      return;
    }

    // 5. New User: Accumulated 20+ minutes (1200s) of total usage
    if (!shown.has('new_user_20_min') && data.totalUsageSeconds >= 1200) {
      firePrompt('new_user_20_min', 'You are now part of our community. Create a tribute for someone special!');
      return;
    }
  }, [isAnyOtherModalOpen, isPromptOpen]);

  const firePrompt = (triggerKey: string, reasonDescription: string) => {
    const data = getStoredData();
    if (!data.shownTriggers.includes(triggerKey)) {
      data.shownTriggers.push(triggerKey);
      saveStoredData(data);
    }
    hasTriggeredThisSessionRef.current = true;
    setActiveTriggerReason(reasonDescription);
    setIsPromptOpen(true);
  };

  // Sync user post creation from posts array on mount/updates
  useEffect(() => {
    const userHasPosts = posts.some(p => p.isCreatedByUser);
    if (userHasPosts) {
      const data = getStoredData();
      if (!data.hasCreatedOrSentHeart) {
        data.hasCreatedOrSentHeart = true;
        if (!data.lastMessageCreatedTimestamp) {
          data.lastMessageCreatedTimestamp = Date.now();
        }
        saveStoredData(data);
      }
    }
  }, [posts]);

  // Usage timer (ticks every 10 seconds to accumulate active platform usage)
  useEffect(() => {
    // Record visit timestamp once on load
    const data = getStoredData();
    const lastVisit = data.lastVisitTimestamp;
    data.lastVisitTimestamp = Date.now();
    saveStoredData(data);

    // Initial trigger check after a brief 2-second delay
    const initialTimeout = setTimeout(() => {
      checkTriggers('initial_load');
    }, 2000);

    const interval = setInterval(() => {
      // Only increment if tab is visible/active
      if (!document.hidden) {
        const currentData = getStoredData();
        currentData.totalUsageSeconds += 10;
        saveStoredData(currentData);
        checkTriggers('timer');
      }
    }, 10000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [checkTriggers]);

  return {
    isPromptOpen,
    activeTriggerReason,
    dismissPrompt,
    recordBoardViewed,
    recordUserCreatedMessageOrHeart,
    // Optional programmatic opener for testing or custom triggers
    triggerEngagementPromptManually: () => {
      setIsPromptOpen(true);
    },
  };
}
