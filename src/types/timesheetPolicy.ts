/**
 * Timesheet Policy Settings
 *
 * Two-tier configuration: tenant-level defaults + optional per-location overrides.
 * When a location field is `undefined`, the tenant default is used.
 * See `src/lib/timesheetPolicyStore.ts` for resolution.
 */

export type RoundingDirection = 'never' | 'nearest_5' | 'nearest_10' | 'nearest_15' | 'up_nearest_15' | 'down_nearest_15';
export type ApprovalCadence = 'never' | 'daily' | 'on_submit' | 'matches_schedule';
export type LinkUnscheduled = 'never' | 'best_fit' | 'exact_match' | 'same_location';
export type TimeDrift = 'never' | 'within_15m' | 'within_30m' | 'within_1h' | 'within_2h' | 'within_4h';
export type PaidMealMode = 'never' | 'always' | 'over_threshold';
export type VarianceFlag = 'never' | 'over_5m' | 'over_10m' | 'over_15m' | 'always';

export interface TimeTrackingSettings {
  enableWebClock: boolean;
  enableMobileClock: boolean;
  captureGpsOnMobile: boolean;
  restrictToGeofence: boolean;
  geofenceRadiusMeters: number;
  enableSmsClock: boolean;
  requireKioskPhoto: boolean;
  minTimesheetMinutes: number;
}

export type EarlyClockInPolicy = 'never' | 'within_minutes' | 'anytime';

export interface TeamMemberPermissions {
  // Editing
  createAndEditTimesheets: boolean;
  updateTimesheetsDuringShift: boolean;
  editClockTimesAfterSubmission: boolean;
  addNotesAndAttachments: boolean;
  // Clock-in / out
  earlyClockInPolicy: EarlyClockInPolicy;
  earlyClockInMinutes: number;
  lateClockInGraceMinutes: number;
  allowEarlyClockOut: boolean;
  autoClockOutAfterShiftMinutes: number;
  // Breaks
  wrapUpBreaksSooner: boolean;
  editOwnBreakDuration: boolean;
  addBreaksToPastTimesheets: boolean;
}


export interface TimesheetApprovingSettings {
  // Auto-approval
  autoApproval: ApprovalCadence;
  skipAutoApprovalIfFlagged: boolean;
  autoApprovalMatchToleranceMinutes: number;
  autoApprovalMaxDailyHours: number; // 0 disables the cap
  notifyStaffOnAdjustment: boolean;
  // Rounding (master + start/end)
  roundingEnabled: boolean;
  adjustStartToScheduledIfEarlier: boolean;
  startTimeAdjustment: RoundingDirection;
  adjustEndToScheduledIfDelayed: boolean;
  endTimeAdjustment: RoundingDirection;
  // Break rounding (rendered inside Breaks tab, owned here for now)
  roundShortBreakUpToScheduled: boolean;
  breakRoundingAdjustment: RoundingDirection;
}

export interface UnscheduledShiftsSettings {
  linkUnscheduledToScheduled: LinkUnscheduled;
  allowTimeDriftMatching: TimeDrift;
  requireTrainingForUnscheduled: boolean;
}

export interface BreaksSettings {
  autoIncludeScheduledOnClockOut: boolean;
  flagShortOrMissedBreaks: boolean;
  paidMealBreaks: PaidMealMode;
  paidMealOverMinutesThreshold: number;
}

export type AnomalySeverity = 'off' | 'info' | 'warning' | 'critical';

export type OperatingHoursMode = 'fixed_window' | 'always_open';


export interface TimesheetIssuesSettings {
  // Time variance
  flagShiftTimeVariance: VarianceFlag;
  flagBreakDurationVariance: VarianceFlag;
  // Missing / unusual entries
  flagMissingClockOut: AnomalySeverity;
  // Operating hours window (replaces separate early-in / late-out rules)
  operatingHoursMode: OperatingHoursMode;
  operatingHoursStartMinutes: number; // 0-1439 minutes from midnight
  operatingHoursEndMinutes: number;   // 0-1439 minutes from midnight; if end < start, window wraps midnight
  flagOutsideOperatingHours: AnomalySeverity;

  // Excessive hours
  flagExcessiveDailyHours: AnomalySeverity;
  excessiveDailyHoursThreshold: number; // e.g. 12
  flagLongShiftWithoutBreak: AnomalySeverity;
  longShiftWithoutBreakHours: number; // e.g. 6
  flagHighWeeklyOvertime: AnomalySeverity;
  highWeeklyOvertimeThreshold: number; // hours
  // Break behaviour
  flagExceededBreak: AnomalySeverity;
  exceededBreakPercent: number; // % of scheduled/allowed break, e.g. 150
  // Behavioural patterns
  flagPatternDrift: AnomalySeverity;
  patternDriftMinutes: number; // deviation from historical average
  flagBuddyPunching: AnomalySeverity;
  flagIrregularPunchPattern: AnomalySeverity;
  // Routing
  blockSubmissionOnCritical: boolean;
}


export interface TimesheetPolicy {
  timeTracking: TimeTrackingSettings;
  permissions: TeamMemberPermissions;
  approving: TimesheetApprovingSettings;
  unscheduled: UnscheduledShiftsSettings;
  breaks: BreaksSettings;
  issues: TimesheetIssuesSettings;
}

/** Partial override — every field optional, including sub-sections. */
export type TimesheetPolicyOverride = {
  [K in keyof TimesheetPolicy]?: Partial<TimesheetPolicy[K]>;
};

export const defaultTimesheetPolicy: TimesheetPolicy = {
  timeTracking: {
    enableWebClock: true,
    enableMobileClock: true,
    captureGpsOnMobile: false,
    restrictToGeofence: false,
    geofenceRadiusMeters: 100,
    enableSmsClock: false,
    requireKioskPhoto: false,
    minTimesheetMinutes: 15,
  },
  permissions: {
    createAndEditTimesheets: false,
    updateTimesheetsDuringShift: false,
    editClockTimesAfterSubmission: false,
    addNotesAndAttachments: true,
    earlyClockInPolicy: 'within_minutes',
    earlyClockInMinutes: 15,
    lateClockInGraceMinutes: 5,
    allowEarlyClockOut: false,
    autoClockOutAfterShiftMinutes: 30,
    wrapUpBreaksSooner: false,
    editOwnBreakDuration: false,
    addBreaksToPastTimesheets: false,
  },

  approving: {
    autoApproval: 'never',
    skipAutoApprovalIfFlagged: true,
    autoApprovalMatchToleranceMinutes: 5,
    autoApprovalMaxDailyHours: 0,
    notifyStaffOnAdjustment: true,
    roundingEnabled: false,
    adjustStartToScheduledIfEarlier: false,
    startTimeAdjustment: 'never',
    adjustEndToScheduledIfDelayed: false,
    endTimeAdjustment: 'never',
    roundShortBreakUpToScheduled: false,
    breakRoundingAdjustment: 'never',
  },
  unscheduled: {
    linkUnscheduledToScheduled: 'never',
    allowTimeDriftMatching: 'never',
    requireTrainingForUnscheduled: false,
  },
  breaks: {
    autoIncludeScheduledOnClockOut: false,
    flagShortOrMissedBreaks: false,
    paidMealBreaks: 'never',
    paidMealOverMinutesThreshold: 30,
  },
  issues: {
    flagShiftTimeVariance: 'never',
    flagBreakDurationVariance: 'over_10m',
    flagMissingClockOut: 'critical',
    flagUnusualEarlyClockIn: 'warning',
    unusualEarlyClockInBeforeHour: 5,
    flagUnusualLateClockOut: 'warning',
    unusualLateClockOutAfterHour: 22,
    flagExcessiveDailyHours: 'critical',
    excessiveDailyHoursThreshold: 12,
    flagLongShiftWithoutBreak: 'warning',
    longShiftWithoutBreakHours: 6,
    flagHighWeeklyOvertime: 'warning',
    highWeeklyOvertimeThreshold: 8,
    flagExceededBreak: 'info',
    exceededBreakPercent: 150,
    flagPatternDrift: 'info',
    patternDriftMinutes: 60,
    flagBuddyPunching: 'critical',
    flagIrregularPunchPattern: 'warning',
    blockSubmissionOnCritical: true,

  },
};

export const roundingOptions: { value: RoundingDirection; label: string }[] = [
  { value: 'never', label: 'Never' },
  { value: 'nearest_5', label: 'Nearest 5 minutes' },
  { value: 'nearest_10', label: 'Nearest 10 minutes' },
  { value: 'nearest_15', label: 'Nearest 15 minutes' },
  { value: 'up_nearest_15', label: 'Round up to 15 minutes' },
  { value: 'down_nearest_15', label: 'Round down to 15 minutes' },
];

export const approvalCadenceOptions: { value: ApprovalCadence; label: string }[] = [
  { value: 'never', label: 'Never' },
  { value: 'on_submit', label: 'On submission' },
  { value: 'matches_schedule', label: 'When matches scheduled shift' },
  { value: 'daily', label: 'Daily (end of day)' },
];

export const earlyClockInOptions: { value: EarlyClockInPolicy; label: string }[] = [
  { value: 'never', label: 'Not allowed' },
  { value: 'within_minutes', label: 'Up to X minutes early' },
  { value: 'anytime', label: 'Anytime before shift' },
];


export const linkUnscheduledOptions: { value: LinkUnscheduled; label: string }[] = [
  { value: 'never', label: 'Never' },
  { value: 'best_fit', label: 'Best Fit (±8 hours)' },
  { value: 'exact_match', label: 'Exact start/end match' },
  { value: 'same_location', label: 'Same location/area only' },
];

export const timeDriftOptions: { value: TimeDrift; label: string }[] = [
  { value: 'never', label: 'Never' },
  { value: 'within_15m', label: 'Within 15 minutes' },
  { value: 'within_30m', label: 'Within 30 minutes' },
  { value: 'within_1h', label: 'Within 1 hour' },
  { value: 'within_2h', label: 'Within 2 hours' },
  { value: 'within_4h', label: 'Within 4 hours' },
];

export const paidMealOptions: { value: PaidMealMode; label: string }[] = [
  { value: 'never', label: 'Never (unpaid)' },
  { value: 'always', label: 'Always paid' },
  { value: 'over_threshold', label: 'Paid if shift exceeds threshold' },
];

export const varianceFlagOptions: { value: VarianceFlag; label: string }[] = [
  { value: 'never', label: 'Never' },
  { value: 'over_5m', label: 'Variance over 5 minutes' },
  { value: 'over_10m', label: 'Variance over 10 minutes' },
  { value: 'over_15m', label: 'Variance over 15 minutes' },
  { value: 'always', label: 'Always' },
];

export const anomalySeverityOptions: { value: AnomalySeverity; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'critical', label: 'Critical' },
];
