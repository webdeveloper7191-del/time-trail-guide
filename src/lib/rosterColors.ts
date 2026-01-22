/**
 * Centralized Roster Color System
 * Single source of truth for all roster-related colors.
 * All roster components should import from here to ensure consistency.
 */

import { 
  Clock, 
  Phone, 
  Moon, 
  Zap, 
  PhoneCall, 
  AlertCircle,
  AlertTriangle,
  Bot,
  RefreshCw,
  UserX,
  LucideIcon
} from 'lucide-react';

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
    legendBg: 'bg-amber-500',
    legendLabel: 'Draft/Unpublished',
    legendDescription: 'Dashed border, not yet published',
  },
  published: {
    bg: 'bg-[hsl(var(--info-bg))]',
    border: 'border-[hsl(var(--info)/0.35)]',
    borderDashed: '',
    text: 'text-[hsl(var(--info))] dark:text-[hsl(var(--info))]',
    accent: 'bg-[hsl(var(--info))]',
    badgeBg: 'bg-[hsl(var(--info)/0.2)]',
    badgeText: 'text-[hsl(var(--info))]',
    legendBg: 'bg-cyan-500',
    legendLabel: 'Published',
    legendDescription: 'Solid border, visible to staff',
  },
  confirmed: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-300 dark:border-emerald-800',
    borderDashed: '',
    text: 'text-emerald-800 dark:text-emerald-200',
    accent: 'bg-emerald-500',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-200',
    legendBg: 'bg-emerald-500',
    legendLabel: 'Confirmed',
    legendDescription: 'Acknowledged by staff',
  },
  completed: {
    bg: 'bg-slate-50 dark:bg-slate-900/40',
    border: 'border-slate-300 dark:border-slate-700',
    borderDashed: '',
    text: 'text-slate-600 dark:text-slate-300',
    accent: 'bg-slate-400',
    badgeBg: 'bg-slate-500/20',
    badgeText: 'text-slate-300',
    legendBg: 'bg-slate-400',
    legendLabel: 'Completed',
    legendDescription: 'Past shift',
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
  legendLabel: 'Open Shift',
  legendDescription: 'Unassigned shift requiring coverage',
} as const;

// =============================================================================
// SHIFT TYPE COLORS (On-Call, Sleepover, Split, etc.)
// =============================================================================

export interface ShiftTypeConfig {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  label: string;
  description: string;
}

export const shiftTypeConfig: Record<string, ShiftTypeConfig> = {
  regular: { 
    icon: Clock, 
    color: 'text-slate-400', 
    bgColor: 'bg-slate-100 dark:bg-slate-800', 
    label: 'Regular',
    description: 'Standard shift',
  },
  on_call: { 
    icon: Phone, 
    color: 'text-cyan-500', 
    bgColor: 'bg-cyan-100 dark:bg-cyan-500/20', 
    label: 'On-Call',
    description: 'Available if needed',
  },
  sleepover: { 
    icon: Moon, 
    color: 'text-violet-500', 
    bgColor: 'bg-violet-100 dark:bg-violet-500/20', 
    label: 'Sleepover',
    description: 'Overnight stay shift',
  },
  broken: { 
    icon: Zap, 
    color: 'text-amber-500', 
    bgColor: 'bg-amber-100 dark:bg-amber-500/20', 
    label: 'Split/Broken',
    description: 'Non-continuous shift',
  },
  recall: { 
    icon: PhoneCall, 
    color: 'text-rose-500', 
    bgColor: 'bg-rose-100 dark:bg-rose-500/20', 
    label: 'Recall',
    description: 'Called back to work',
  },
  emergency: { 
    icon: AlertCircle, 
    color: 'text-rose-600', 
    bgColor: 'bg-rose-100 dark:bg-rose-500/20', 
    label: 'Emergency',
    description: 'Urgent coverage needed',
  },
} as const;

// Legacy export for backwards compatibility
export const shiftTypeColors = Object.fromEntries(
  Object.entries(shiftTypeConfig).map(([key, value]) => [
    key,
    { color: value.color, bgColor: value.bgColor }
  ])
) as Record<string, { color: string; bgColor: string }>;

export type ShiftType = keyof typeof shiftTypeConfig;

// =============================================================================
// CALENDAR / EVENT COLORS
// =============================================================================

export const calendarEventColors = {
  publicHoliday: {
    bg: 'bg-rose-500',
    text: 'text-rose-500',
    label: 'Public Holiday',
    description: 'Government holiday',
  },
  schoolHoliday: {
    bg: 'bg-amber-500',
    text: 'text-amber-500',
    label: 'School Holiday',
    description: 'School break period',
  },
  centreEvent: {
    bg: 'bg-cyan-500',
    text: 'text-cyan-500',
    label: 'Centre Event',
    description: 'Special occasion',
  },
} as const;

// =============================================================================
// LEAVE / AVAILABILITY COLORS
// =============================================================================

export const leaveColors = {
  approved: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-600',
    label: 'Leave Approved',
    description: 'Time off confirmed',
  },
  pending: {
    dot: 'bg-amber-500',
    text: 'text-amber-600',
    label: 'Leave Pending',
    description: 'Awaiting approval',
  },
  unavailable: {
    bg: 'bg-slate-100 dark:bg-slate-700',
    pattern: 'repeating-linear-gradient(135deg, transparent 0px, transparent 2px, rgba(148,163,184,0.3) 2px, rgba(148,163,184,0.3) 4px)',
    label: 'Unavailable',
    description: 'Staff not available to work',
  },
} as const;

// =============================================================================
// SPECIAL INDICATOR COLORS
// =============================================================================

export interface SpecialIndicatorConfig {
  icon: LucideIcon;
  bg: string;
  iconColor: string;
  label: string;
  description: string;
}

export const specialIndicatorConfig: Record<string, SpecialIndicatorConfig> = {
  aiGenerated: {
    icon: Bot,
    bg: 'bg-violet-100 dark:bg-violet-500/20',
    iconColor: 'text-violet-500',
    label: 'AI Generated',
    description: 'Auto-assigned by solver',
  },
  recurring: {
    icon: RefreshCw,
    bg: 'bg-emerald-100 dark:bg-emerald-500/20',
    iconColor: 'text-emerald-500',
    label: 'Recurring',
    description: 'Part of a recurring series',
  },
  absent: {
    icon: UserX,
    bg: 'bg-destructive',
    iconColor: 'text-destructive-foreground',
    label: 'Absent',
    description: 'Staff marked absent',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-100 dark:bg-amber-500/20',
    iconColor: 'text-amber-500',
    label: 'Warning',
    description: 'Compliance issue detected',
  },
} as const;

// Legacy export for backwards compatibility
export const specialIndicatorColors = Object.fromEntries(
  Object.entries(specialIndicatorConfig).map(([key, value]) => [
    key,
    { bg: value.bg, icon: value.iconColor }
  ])
) as Record<string, { bg: string; icon: string }>;

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
 * Get shift type config by type key
 */
export function getShiftTypeConfig(type: string): ShiftTypeConfig {
  return shiftTypeConfig[type] || shiftTypeConfig.regular;
}

/**
 * Get shift type styles by type key (legacy)
 */
export function getShiftTypeStyles(type: string) {
  const config = getShiftTypeConfig(type);
  return { color: config.color, bgColor: config.bgColor };
}

/**
 * Get special indicator config by key
 */
export function getSpecialIndicatorConfig(key: string): SpecialIndicatorConfig | undefined {
  return specialIndicatorConfig[key];
}
