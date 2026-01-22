/**
 * Centralized Roster Color System
 * Single source of truth for all roster-related colors.
 * All roster components should import from here to ensure consistency.
 */

// =============================================================================
// SHIFT STATUS COLORS
// =============================================================================

export const shiftStatusColors = {
  draft: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-300 dark:border-amber-800',
    borderDashed: 'border-dashed',
    text: 'text-amber-800 dark:text-amber-200',
    accent: 'bg-amber-400',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-200',
  },
  published: {
    bg: 'bg-[hsl(var(--info-bg))]',
    border: 'border-[hsl(var(--info)/0.35)]',
    borderDashed: '',
    text: 'text-[hsl(var(--info))] dark:text-[hsl(var(--info))]',
    accent: 'bg-[hsl(var(--info))]',
    badgeBg: 'bg-[hsl(var(--info)/0.2)]',
    badgeText: 'text-[hsl(var(--info))]',
  },
  confirmed: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-300 dark:border-emerald-800',
    borderDashed: '',
    text: 'text-emerald-800 dark:text-emerald-200',
    accent: 'bg-emerald-500',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-200',
  },
  completed: {
    bg: 'bg-slate-50 dark:bg-slate-900/40',
    border: 'border-slate-300 dark:border-slate-700',
    borderDashed: '',
    text: 'text-slate-600 dark:text-slate-300',
    accent: 'bg-slate-400',
    badgeBg: 'bg-slate-500/20',
    badgeText: 'text-slate-300',
  },
} as const;

export type ShiftStatus = keyof typeof shiftStatusColors;

// =============================================================================
// OPEN SHIFT COLORS (Unified dark orange)
// =============================================================================

export const openShiftColors = {
  bg: 'bg-[hsl(var(--open-shift-bg))]',
  bgGradient: 'bg-gradient-to-br from-[hsl(var(--open-shift-bg))] to-[hsl(var(--open-shift-bg-2))]',
  border: 'border-[hsl(var(--open-shift-border))]',
  accent: 'bg-[hsl(var(--open-shift))]',
  text: 'text-[hsl(var(--open-shift))]',
  icon: 'text-[hsl(var(--open-shift))]',
} as const;

// =============================================================================
// SHIFT TYPE COLORS (On-Call, Sleepover, Split, etc.)
// =============================================================================

export const shiftTypeColors = {
  regular: {
    color: 'text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
  },
  on_call: {
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-100 dark:bg-cyan-500/20',
  },
  sleepover: {
    color: 'text-violet-500',
    bgColor: 'bg-violet-100 dark:bg-violet-500/20',
  },
  broken: {
    color: 'text-amber-500',
    bgColor: 'bg-amber-100 dark:bg-amber-500/20',
  },
  recall: {
    color: 'text-rose-500',
    bgColor: 'bg-rose-100 dark:bg-rose-500/20',
  },
  emergency: {
    color: 'text-rose-600',
    bgColor: 'bg-rose-100 dark:bg-rose-500/20',
  },
} as const;

export type ShiftType = keyof typeof shiftTypeColors;

// =============================================================================
// CALENDAR / EVENT COLORS
// =============================================================================

export const calendarEventColors = {
  publicHoliday: {
    bg: 'bg-rose-500',
    text: 'text-rose-500',
  },
  schoolHoliday: {
    bg: 'bg-amber-500',
    text: 'text-amber-500',
  },
  centreEvent: {
    bg: 'bg-cyan-500',
    text: 'text-cyan-500',
  },
} as const;

// =============================================================================
// LEAVE / AVAILABILITY COLORS
// =============================================================================

export const leaveColors = {
  approved: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-600',
  },
  pending: {
    dot: 'bg-amber-500',
    text: 'text-amber-600',
  },
  unavailable: {
    bg: 'bg-slate-100 dark:bg-slate-700',
    pattern: 'repeating-linear-gradient(135deg, transparent 0px, transparent 2px, rgba(148,163,184,0.3) 2px, rgba(148,163,184,0.3) 4px)',
  },
} as const;

// =============================================================================
// SPECIAL INDICATOR COLORS
// =============================================================================

export const specialIndicatorColors = {
  aiGenerated: {
    bg: 'bg-violet-100 dark:bg-violet-500/20',
    icon: 'text-violet-500',
  },
  recurring: {
    bg: 'bg-emerald-100 dark:bg-emerald-500/20',
    icon: 'text-emerald-500',
  },
  absent: {
    bg: 'bg-destructive',
    icon: 'text-destructive-foreground',
  },
  warning: {
    icon: 'text-amber-500',
  },
  overtime: {
    border: 'border-amber-400',
    text: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
  },
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get shift status styles by status key
 */
export function getShiftStatusStyles(status: ShiftStatus) {
  return shiftStatusColors[status] || shiftStatusColors.draft;
}

/**
 * Get shift type styles by type key
 */
export function getShiftTypeStyles(type: ShiftType) {
  return shiftTypeColors[type] || shiftTypeColors.regular;
}
