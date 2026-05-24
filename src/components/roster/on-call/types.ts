import type { OnCallTriggerType } from '@/types/allowances';

export interface OnCallAssignment {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  staffPhone: string;
  staffAvatar?: string;
  centreId: string;
  centreName: string;
  date: string;
  dayOfWeek?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  startTime: string;
  endTime: string;
  isPrimary: boolean;
  escalationOrder: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  /** Whether the standby window is currently live (drives pulsing badge) */
  isStandbyActive?: boolean;
  /** @deprecated Use currentCallbackCount */
  callbackCount: number;
  /** Number of callbacks performed during this on-call period */
  currentCallbackCount?: number;
  /** Maximum callbacks permitted in this period (from award config) */
  maxCallbacks?: number;
  /** Hours actually worked across all callbacks in this assignment */
  actualHoursWorked?: number;
  /** Minimum engagement hours per callback (e.g. 3-hour minimum) */
  minimumCallbackHours?: number;
  /** Flat allowance paid for being on-call (regardless of callback) */
  standbyAllowanceAmount?: number;
  /** Base hourly rate used to compute callback pay */
  baseHourlyRate?: number;
  /** Callback rate multiplier (e.g. 1.5 for time-and-a-half) */
  callbackRateMultiplier?: number;
  /** SLA for responding to a callback in minutes */
  responseSlaMinutes?: number;
  lastCallback?: string;
}

export interface EscalationContact {
  order: number;
  staffId: string;
  staffName: string;
  staffRole: string;
  phone: string;
  responseTimeMinutes: number;
  isAvailable: boolean;
}

export interface CallbackHistoryItem {
  id: string;
  date: string;
  staffName: string;
  type: 'callback' | 'recall' | 'emergency';
  /** How the callback was initiated — for audit */
  triggerType?: OnCallTriggerType;
  /** Free-text reason / notes captured at callback time */
  recallReason?: string;
  duration: string;
  /** Actual minutes worked on this callback (raw) */
  actualMinutesWorked?: number;
  /** Minimum engagement hours applied for payroll */
  minimumHoursApplied?: number;
  outcome: string;
  paidAmount: number;
  /** Response time achieved vs SLA, in minutes */
  responseTimeMinutes?: number;
}

export interface AvailableStaff {
  id: string;
  name: string;
  role: string;
  phone: string;
  isAvailable: boolean;
}

export const statusColors: Record<OnCallAssignment['status'], string> = {
  scheduled: 'bg-blue-500/10 text-blue-700',
  active: 'bg-green-500/10 text-green-700 animate-pulse',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-red-500/10 text-red-700',
};

export const callbackTypeColors: Record<CallbackHistoryItem['type'], string> = {
  callback: 'bg-amber-500/10 text-amber-700',
  recall: 'bg-orange-500/10 text-orange-700',
  emergency: 'bg-red-500/10 text-red-700',
};
