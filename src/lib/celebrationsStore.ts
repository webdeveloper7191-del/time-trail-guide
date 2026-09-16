import { useEffect, useState } from 'react';
import type { StaffMember } from '@/types/staff';

export type CelebrationVisibility = 'public' | 'team' | 'hidden';

export interface CelebrationSettings {
  birthdaysEnabled: boolean;
  anniversariesEnabled: boolean;
  /** Default privacy for date of birth when the staff member has not chosen */
  defaultBirthdayVisibility: CelebrationVisibility;
  /** 'company' posts to everyone, 'team' limits to the same department */
  audience: 'company' | 'team';
  /** Days ahead to surface upcoming celebrations */
  lookAheadDays: number;
  /** Only celebrate these anniversary years; empty = every year */
  milestoneYears: number[];
  /** Auto-post a celebration to the praise wall on the day */
  autoPost: boolean;
  /** Per-staff overrides: staffId -> visibility */
  overrides: Record<string, CelebrationVisibility>;
}

export interface Celebration {
  id: string;
  staffId: string;
  staffName: string;
  department?: string;
  type: 'birthday' | 'anniversary';
  /** ISO date of this year's occurrence */
  date: string;
  years?: number;
  visibility: CelebrationVisibility;
  daysAway: number;
}

const KEY = 'rai.recognition.celebrations.v1';

const DEFAULTS: CelebrationSettings = {
  birthdaysEnabled: true,
  anniversariesEnabled: true,
  defaultBirthdayVisibility: 'team',
  audience: 'company',
  lookAheadDays: 30,
  milestoneYears: [],
  autoPost: true,
  overrides: {},
};

let cache: CelebrationSettings | null = null;
const listeners = new Set<() => void>();

function read(): CelebrationSettings {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    cache = DEFAULTS;
  }
  return cache!;
}

export const celebrationsStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  get: read,
  update(patch: Partial<CelebrationSettings>) {
    const next = { ...read(), ...patch };
    cache = next;
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l());
  },
  setVisibility(staffId: string, visibility: CelebrationVisibility) {
    const s = read();
    celebrationsStore.update({ overrides: { ...s.overrides, [staffId]: visibility } });
  },
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

function nextOccurrence(iso: string, from: Date): Date {
  const src = new Date(iso);
  let next = new Date(from.getFullYear(), src.getMonth(), src.getDate());
  if (next < startOfDay(from)) next = new Date(from.getFullYear() + 1, src.getMonth(), src.getDate());
  return next;
}

/** Build the upcoming celebration list from staff records and the current settings. */
export function buildCelebrations(
  staff: StaffMember[],
  settings: CelebrationSettings = read(),
  from: Date = new Date(),
): Celebration[] {
  const today = startOfDay(from);
  const out: Celebration[] = [];

  for (const s of staff) {
    if (s.status !== 'active') continue;
    const name = `${s.firstName} ${s.lastName}`;
    const visibility = settings.overrides[s.id] ?? settings.defaultBirthdayVisibility;

    if (settings.birthdaysEnabled && s.dateOfBirth && visibility !== 'hidden') {
      const date = nextOccurrence(s.dateOfBirth, today);
      const daysAway = Math.round((date.getTime() - today.getTime()) / 86400000);
      if (daysAway <= settings.lookAheadDays) {
        out.push({
          id: `bd-${s.id}`,
          staffId: s.id,
          staffName: name,
          department: s.department,
          type: 'birthday',
          date: date.toISOString().slice(0, 10),
          visibility,
          daysAway,
        });
      }
    }

    if (settings.anniversariesEnabled && s.employmentStartDate) {
      const date = nextOccurrence(s.employmentStartDate, today);
      const years = date.getFullYear() - new Date(s.employmentStartDate).getFullYear();
      const isMilestone = settings.milestoneYears.length === 0 || settings.milestoneYears.includes(years);
      const daysAway = Math.round((date.getTime() - today.getTime()) / 86400000);
      if (years > 0 && isMilestone && daysAway <= settings.lookAheadDays) {
        out.push({
          id: `an-${s.id}`,
          staffId: s.id,
          staffName: name,
          department: s.department,
          type: 'anniversary',
          date: date.toISOString().slice(0, 10),
          years,
          visibility: 'public',
          daysAway,
        });
      }
    }
  }

  return out.sort((a, b) => a.daysAway - b.daysAway);
}

export function useCelebrationSettings() {
  const [, force] = useState(0);
  useEffect(() => celebrationsStore.subscribe(() => force((n) => n + 1)), []);
  return { settings: celebrationsStore.get(), update: celebrationsStore.update, setVisibility: celebrationsStore.setVisibility };
}
