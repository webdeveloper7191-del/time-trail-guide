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
export type TimeDrift = 'never' | 'within_15m' | 'within_30m' | 'within_1h' | 'within_2h' | 'within_4h' | 'custom';
export type PaidMealMode = 'never' | 'always';
export type VarianceFlag = 'never' | 'over_5m' | 'over_10m' | 'over_15m' | 'always';

export type KioskVerificationMode = 'pin' | 'face' | 'pin_and_face';

export interface TimeTrackingSettings {
  /** Web Employee Portal — self-service channel. */
  enableWebClock: boolean;
  /** Rostered.ai Kiosk App — fixed-location shared device, not a self-service channel. */
  enableMobileClock: boolean;
  /** Staff personal mobile app — self-service channel. */
  enableStaffMobileApp: boolean;
  captureGpsOnMobile: boolean;
  restrictToGeofence: boolean;
  geofenceRadiusMeters: number;
  enableSmsClock: boolean;
  /** How staff identify themselves at the shared Rostered.ai Kiosk App. */
  kioskVerificationMode: KioskVerificationMode;
  requireKioskPhoto: boolean; // derived: true when mode includes face verification
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

export type NoShiftClockInAction = 'block' | 'allow_flag' | 'allow_silent';
export type UnscheduledRosterFlag = 'off' | 'info' | 'warning' | 'critical';
export type UnscheduledShiftCreation = 'never' | 'on_clock_in' | 'on_clock_out' | 'on_approval';
export type UnscheduledEndTimeRule =
  | 'actual_clock_out'
  | 'fixed_duration'
  | 'location_close'
  | 'area_default_shift'
  | 'open_ended';

export interface UnscheduledShiftsSettings {
  linkUnscheduledToScheduled: LinkUnscheduled;
  allowTimeDriftMatching: TimeDrift;
  /** Used when allowTimeDriftMatching === 'custom'. Best-fit window in minutes. */
  allowTimeDriftCustomMinutes: number;
  requireTrainingForUnscheduled: boolean;
  // Clock-in with no rostered shift
  noShiftClockInAction: NoShiftClockInAction;
  rosterFlagSeverity: UnscheduledRosterFlag;
  notifyManagerOnUnscheduledClockIn: boolean;
  // Auto-created roster shift
  createShiftInRoster: UnscheduledShiftCreation;
  createdShiftEndTimeRule: UnscheduledEndTimeRule;
  createdShiftFixedDurationHours: number;
  createdShiftMaxDurationHours: number;
  createdShiftRoundToMinutes: number;
  markCreatedShiftUnapproved: boolean;
}


export interface BreaksSettings {
  autoIncludeScheduledOnClockOut: boolean;
  flagShortOrMissedBreaks: boolean;
  paidMealBreaks: PaidMealMode;
  /** @deprecated legacy minutes threshold — no longer surfaced in UI */
  paidMealOverMinutesThreshold?: number;
  /** @deprecated legacy hours threshold — no longer surfaced in UI */
  paidMealOverShiftHours?: number;
  /** @deprecated legacy cap — no longer surfaced in UI */
  paidMealMaxPaidMinutes?: number;
  /** @deprecated legacy accrual toggle — no longer surfaced in UI */
  paidMealCountsTowardHours?: boolean;
  /** @deprecated legacy interrupted meal toggle — no longer surfaced in UI */
  payInterruptedUnpaidMeal?: boolean;
}


export type AnomalySeverity = 'off' | 'info' | 'warning' | 'critical';

export type ClockBoundaryReference = 'operating_window' | 'scheduled_shift';



export interface TimesheetIssuesSettings {
  // Time variance
  flagShiftTimeVariance: VarianceFlag;
  flagBreakDurationVariance: VarianceFlag;
  // Missing / unusual entries
  flagMissingClockOut: AnomalySeverity;
  // Clock-event boundary tolerance (operating window & shift times are configured elsewhere)
  clockBoundaryReference: ClockBoundaryReference;
  earlyClockInToleranceMinutes: number;  // clock-in more than this many min before boundary → flag
  lateClockOutToleranceMinutes: number;  // clock-out more than this many min after boundary → flag
  flagClockBoundaryBreach: AnomalySeverity;


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
    enableStaffMobileApp: false,
    captureGpsOnMobile: false,
    restrictToGeofence: false,
    geofenceRadiusMeters: 100,
    enableSmsClock: false,
    kioskVerificationMode: 'pin',
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
    allowTimeDriftCustomMinutes: 45,
    requireTrainingForUnscheduled: false,
    noShiftClockInAction: 'allow_flag',
    rosterFlagSeverity: 'warning',
    notifyManagerOnUnscheduledClockIn: true,
    createShiftInRoster: 'on_clock_out',
    createdShiftEndTimeRule: 'actual_clock_out',
    createdShiftFixedDurationHours: 8,
    createdShiftMaxDurationHours: 12,
    createdShiftRoundToMinutes: 15,
    markCreatedShiftUnapproved: true,
  },

  breaks: {
    autoIncludeScheduledOnClockOut: false,
    flagShortOrMissedBreaks: false,
    paidMealBreaks: 'never',
    paidMealOverMinutesThreshold: 30,
    paidMealOverShiftHours: 6,
    paidMealMaxPaidMinutes: 0,
    paidMealCountsTowardHours: true,
    payInterruptedUnpaidMeal: true,

  },
  issues: {
    flagShiftTimeVariance: 'never',
    flagBreakDurationVariance: 'over_10m',
    flagMissingClockOut: 'critical',
    clockBoundaryReference: 'scheduled_shift',
    earlyClockInToleranceMinutes: 30,
    lateClockOutToleranceMinutes: 30,
    flagClockBoundaryBreach: 'warning',



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

export const kioskVerificationOptions: { value: KioskVerificationMode; label: string }[] = [
  { value: 'pin', label: 'PIN only' },
  { value: 'face', label: 'Face verification only' },
  { value: 'pin_and_face', label: 'PIN + face verification' },
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
  { value: 'custom', label: 'Custom (minutes)' },
];

export const paidMealOptions: { value: PaidMealMode; label: string }[] = [
  { value: 'never', label: 'Never (unpaid)' },
  { value: 'always', label: 'Always paid' },
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

export const clockBoundaryReferenceOptions: { value: ClockBoundaryReference; label: string }[] = [
  { value: 'scheduled_shift', label: 'Scheduled shift (per staff roster)' },
  { value: 'operating_window', label: 'Operating window (location hours)' },
];


export const noShiftClockInActionOptions: { value: NoShiftClockInAction; label: string }[] = [
  { value: 'block', label: 'Block the clock-in (no rostered shift)' },
  { value: 'allow_flag', label: 'Allow and flag for review' },
  { value: 'allow_silent', label: 'Allow without flagging' },
];

export const unscheduledRosterFlagOptions: { value: UnscheduledRosterFlag; label: string }[] = [
  { value: 'off', label: 'No roster flag' },
  { value: 'info', label: 'Info — grey marker on the roster cell' },
  { value: 'warning', label: 'Warning — amber "Unrostered" badge' },
  { value: 'critical', label: 'Critical — red badge + compliance alert' },
];

export const unscheduledShiftCreationOptions: { value: UnscheduledShiftCreation; label: string }[] = [
  { value: 'never', label: 'Never — timesheet only, roster untouched' },
  { value: 'on_clock_in', label: 'On clock-in (live shift appears immediately)' },
  { value: 'on_clock_out', label: 'On clock-out (once actual times are known)' },
  { value: 'on_approval', label: 'On timesheet approval' },
];

export const unscheduledEndTimeRuleOptions: { value: UnscheduledEndTimeRule; label: string }[] = [
  { value: 'actual_clock_out', label: 'Actual clock-out time' },
  { value: 'fixed_duration', label: 'Clock-in + fixed duration' },
  { value: 'location_close', label: 'Location closing time' },
  { value: 'area_default_shift', label: 'Area default shift end time' },
  { value: 'open_ended', label: 'Leave open-ended until clock-out' },
];
