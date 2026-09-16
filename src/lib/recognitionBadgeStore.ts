import { useEffect, useState } from 'react';
import { planStore } from '@/lib/planStore';
import { praiseWallBadges } from '@/data/mockRecognitionData';

export type BadgeAudience = 'everyone' | 'managers' | 'admins';

export interface RecognitionBadge {
  id: string;
  label: string;
  emoji: string;
  description: string;
  category: string;
  active: boolean;
  /** Who is allowed to award this badge */
  awardableBy: BadgeAudience;
  system?: boolean;
}

export interface RecognitionPublisher {
  id: string;
  label: string;
  active: boolean;
}

interface BadgeState {
  badges: RecognitionBadge[];
  publishers: RecognitionPublisher[];
}

const KEY = 'rai.recognition.badges.v1';

export const BADGE_CATEGORIES = ['Values', 'Performance', 'Teamwork', 'Service', 'Learning', 'Safety'];

/** Active badges allowed on non-Enterprise plans. */
export const BADGE_CAP = 5;

const DEFAULTS: BadgeState = {
  badges: praiseWallBadges.map((b, i) => ({
    id: b.id,
    label: b.label,
    emoji: b.emoji,
    description: '',
    category: 'Values',
    active: i < BADGE_CAP,
    awardableBy: 'everyone' as BadgeAudience,
    system: true,
  })),
  publishers: [
    { id: 'self', label: 'Yourself', active: true },
    { id: 'leadership', label: 'Leadership Team', active: true },
    { id: 'people-culture', label: 'People & Culture', active: true },
  ],
};

let cache: BadgeState | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function read(): BadgeState {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    cache = DEFAULTS;
  }
  return cache!;
}

function write(next: BadgeState) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  emit();
}

export const recognitionBadgeStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  getBadges: (): RecognitionBadge[] => read().badges,
  getActiveBadges: (): RecognitionBadge[] => read().badges.filter((b) => b.active),
  getPublishers: (): RecognitionPublisher[] => read().publishers.filter((p) => p.active),
  /** null = unlimited */
  badgeLimit(): number | null {
    return planStore.getTier() === 'enterprise' ? null : BADGE_CAP;
  },
  activeCount: () => read().badges.filter((b) => b.active).length,
  canActivateMore(): boolean {
    const limit = recognitionBadgeStore.badgeLimit();
    return limit === null || recognitionBadgeStore.activeCount() < limit;
  },
  save(badge: RecognitionBadge) {
    const state = read();
    const exists = state.badges.some((b) => b.id === badge.id);
    write({
      ...state,
      badges: exists
        ? state.badges.map((b) => (b.id === badge.id ? badge : b))
        : [...state.badges, badge],
    });
  },
  remove(id: string) {
    const state = read();
    write({ ...state, badges: state.badges.filter((b) => b.id !== id) });
  },
  toggleActive(id: string) {
    const state = read();
    write({
      ...state,
      badges: state.badges.map((b) => (b.id === id ? { ...b, active: !b.active } : b)),
    });
  },
};

export function useRecognitionBadges() {
  const [, force] = useState(0);
  useEffect(() => recognitionBadgeStore.subscribe(() => force((n) => n + 1)), []);
  return {
    badges: recognitionBadgeStore.getBadges(),
    activeBadges: recognitionBadgeStore.getActiveBadges(),
    publishers: recognitionBadgeStore.getPublishers(),
    limit: recognitionBadgeStore.badgeLimit(),
    activeCount: recognitionBadgeStore.activeCount(),
    store: recognitionBadgeStore,
  };
}
