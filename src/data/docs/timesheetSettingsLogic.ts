/**
 * Timesheet Settings — Business Logic Reference
 *
 * Documentation-only data. Every entry describes the runtime behaviour of a
 * single setting in Settings → Timesheets, so operations, payroll and QA share
 * one source of truth. Keep field keys in sync with `src/types/timesheetPolicy.ts`.
 */

export interface SettingLogicItem {
  /** Dot path in TimesheetPolicy, or a descriptive key for non-policy settings. */
  key: string;
  label: string;
  type: string;
  options?: string[];
  defaultValue: string;
  purpose: string;
  /** Ordered evaluation rules applied at runtime. */
  logic: string[];
  /** Other settings/modules this rule reads from or writes to. */
  interactions?: string[];
  /** Edge cases and guardrails. */
  edgeCases?: string[];
  example?: string;
}

export interface SettingLogicGroup {
  id: string;
  title: string;
  summary: string;
  items: SettingLogicItem[];
}

export interface SettingLogicSection {
  id: string;
  title: string;
  icon: string;
  summary: string;
  /** When this section's rules are evaluated in the timesheet lifecycle. */
  evaluationPoint: string;
  groups: SettingLogicGroup[];
}

export const policyResolutionNotes = {
  title: 'Policy resolution & precedence',
  points: [
    'Settings are stored in two tiers: a tenant default policy and optional per-location overrides. A location field that is `undefined` inherits the tenant value.',
    'Resolution order for any field: Location override → Tenant default → System default (`defaultTimesheetPolicy`).',
    'Resolved policies are memoised per location and invalidated whenever any field is saved, so open screens re-render with the new rule immediately.',
    'Award rules always win over policy rules for anything that changes pay. Timesheet policy governs capture, validation, flagging and approval routing only — never rates, penalties or loadings.',
    'All thresholds are evaluated in the location’s local timezone, using DST-safe date arithmetic. A shift that crosses midnight belongs to the day of its clock-in.',
    'Every automatic adjustment (rounding, auto clock-out, auto-created shift, auto-approval) writes an audit record containing the original value, the new value, the rule that fired and the actor `system`.',
  ],
};

export const lifecycleStages = [
  { stage: '1. Capture', detail: 'Clock-in/out via the Employee Portal (web), the Staff Mobile App, SMS, or the shared Rostered.ai Kiosk App. Time Tracking + Team Member Permissions decide whether the punch is accepted at all.' },
  { stage: '2. Attach', detail: 'The punch is matched to a rostered shift. Unscheduled Shifts rules decide what happens when no shift exists.' },
  { stage: '3. Normalise', detail: 'Breaks are applied and Rounding adjusts start/end/break values. Net hours are recalculated.' },
  { stage: '4. Validate', detail: 'Timesheet Issues and Compliance thresholds raise info/warning/critical flags against the day and the week.' },
  { stage: '5. Route', detail: 'Auto-approval is attempted; otherwise the approval chain routes to the first matching approver band with SLA tracking.' },
  { stage: '6. Export', detail: 'Approved hours, allowances and overtime are handed to payroll. Flags block export only when configured as critical + blocking.' },
];

export const timesheetSettingsLogic: SettingLogicSection[] = [
  /* ------------------------------------------------------------------ */
  {
    id: 'time-tracking',
    title: 'Time Tracking',
    icon: 'Fingerprint',
    summary: 'Which capture channels staff may use to record time, and the integrity checks applied at the moment of the punch.',
    evaluationPoint: 'Evaluated synchronously at clock-in and clock-out, before any timesheet record is written.',
    groups: [
      {
        id: 'channels',
        title: 'Capture channels',
        summary: 'Each channel is independently enabled. Self-service channels are Web and Staff Mobile App. The Rostered.ai Kiosk App is a shared fixed-location device and is not a self-service channel. If every channel is disabled, time can only be entered manually by a manager.',
        items: [
          {
            key: 'timeTracking.enableWebClock',
            label: 'Web clock',
            type: 'Boolean',
            defaultValue: 'On',
            purpose: 'Allows staff to clock in/out from the browser via the Employee Portal (self-service).',
            logic: [
              'When off, the clock widget is hidden in the Employee Portal and any API punch with source `web` is rejected with `CHANNEL_DISABLED`.',
              'Turning it off does not delete existing punches; open shifts already clocked in can still be clocked out to avoid stranded records.',
            ],
            interactions: ['Employee Portal clock widget', 'Team Member Permissions → early/late clock-in rules run after the channel check'],
            edgeCases: ['If all channels are disabled while a staff member is mid-shift, the system falls back to Auto clock-out after shift.'],
          },
          {
            key: 'timeTracking.enableStaffMobileApp',
            label: 'Staff mobile app clock',
            type: 'Boolean',
            defaultValue: 'Off',
            purpose: 'Allows punches from the staff personal mobile app (self-service).',
            logic: [
              'When off, mobile app punches are rejected and the staff mobile app shows a "clock disabled by your organisation" state.',
              'GPS capture and geofencing for mobile punches are only evaluated when this channel is enabled.',
            ],
            interactions: ['captureGpsOnMobile', 'restrictToGeofence'],
            edgeCases: ['This feature is currently under development and is shown as coming soon.'],
          },
          {
            key: 'timeTracking.enableMobileClock',
            label: 'Rostered.ai Kiosk App (fixed location)',
            type: 'Boolean',
            defaultValue: 'On',
            purpose: 'Allows punches from the fixed-location Rostered.ai Kiosk App. This is a shared device, not a personal self-service channel.',
            logic: [
              'When off, kiosk punches are rejected and the shared kiosk device shows a "clock disabled by your organisation" state.',
              'Face verification and geofencing can apply to this channel.',
            ],
            interactions: ['requireKioskPhoto', 'restrictToGeofence'],
          },
          {
            key: 'timeTracking.captureGpsOnMobile',
            label: 'Capture GPS on staff mobile app',
            type: 'Boolean',
            defaultValue: 'Off',
            purpose: 'Stores latitude/longitude with each staff mobile app punch for audit.',
            logic: [
              'Coordinates plus accuracy radius are stored on the clock event and shown in the audit trail.',
              'If the device denies location permission the punch is still accepted, but tagged `location_unavailable` — unless geofencing is on, in which case it is blocked.',
            ],
            edgeCases: ['Coordinates are retained for the audit retention period only and are never used for pay calculation.'],
          },
          {
            key: 'timeTracking.restrictToGeofence',
            label: 'Restrict to geofence',
            type: 'Boolean',
            defaultValue: 'Off',
            purpose: 'Blocks punches recorded outside the location’s geofence.',
            logic: [
              'Requires GPS capture; enabling geofencing forces GPS on.',
              'Distance is measured from the location’s configured coordinates to the punch coordinates using the haversine formula.',
              'If distance > geofence radius + device accuracy, the punch is blocked with `OUTSIDE_GEOFENCE` and a manager notification is raised.',
              'Device accuracy is added as tolerance so poor GPS does not create false blocks.',
            ],
            interactions: ['geofenceRadiusMeters', 'Location Management → location coordinates'],
            edgeCases: ['A location without coordinates cannot enforce a geofence; the rule is skipped and a configuration warning is shown in settings.'],
            example: 'Radius 100 m, device reports accuracy ±40 m, staff is 130 m away → allowed (130 ≤ 140). At 200 m → blocked.',
          },
          {
            key: 'timeTracking.geofenceRadiusMeters',
            label: 'Geofence radius',
            type: 'Number (metres)',
            defaultValue: '100',
            purpose: 'Permitted distance from the location’s coordinates.',
            logic: [
              'Valid range 25–5,000 m. Values below 25 m are rejected because consumer GPS accuracy makes them unusable.',
              'Radius is per-location when overridden, otherwise the tenant value applies to all sites.',
            ],
          },
          {
            key: 'timeTracking.kioskVerificationMode',
            label: 'Kiosk identity verification',
            type: 'Enum',
            options: ['PIN only', 'Face verification only', 'PIN + face verification'],
            defaultValue: 'PIN only',
            purpose: 'How staff prove who they are at the shared Rostered.ai Kiosk App.',
            logic: [
              '"PIN only": the staff member enters their personal kiosk PIN. No camera is required, so the kiosk works on devices without a front camera.',
              '"Face verification only": the kiosk captures a photo and matches it against the enrolled face template. No PIN is entered.',
              '"PIN + face verification": both must succeed. The PIN identifies the staff member and the face check confirms it — the strongest anti-buddy-punching setting.',
              'Any mode that includes face verification sets `requireKioskPhoto` to true; selecting "PIN only" clears it.',
              'If the camera is unavailable in a face-enabled mode the punch is blocked with `VERIFICATION_UNAVAILABLE`; it is never silently downgraded to PIN.',
              'A staff member with no enrolled face template cannot punch in a face-only mode — the kiosk prompts for enrolment and notifies the location manager.',
            ],
            interactions: ['timeTracking.enableMobileClock (Rostered.ai Kiosk App)', 'timeTracking.requireKioskPhoto (derived)', 'Timesheet Issues → Buddy punching detection'],
            edgeCases: ['Applies only to the shared kiosk. Web (Employee Portal) and Staff Mobile App punches are authenticated by the user’s own login, not by kiosk PIN or face.'],
          },
          {
            key: 'timeTracking.requireKioskPhoto',
            label: 'Require kiosk photo (derived)',
            type: 'Boolean (read-only)',
            defaultValue: 'Off',
            purpose: 'Captures a photo at shared-device punches to deter buddy punching.',
            logic: [
              'Not edited directly — it is derived from Kiosk identity verification and is true whenever the selected mode includes face verification.',
              'Photos are attached to the clock event and surfaced in the reviewer panel next to any buddy-punching flag.',
            ],
            interactions: ['timeTracking.kioskVerificationMode', 'Timesheet Issues → Buddy punching detection uses photo presence as corroborating evidence'],
          },
        ],
      },
      {
        id: 'integrity',
        title: 'Record integrity',
        summary: 'Minimum viable data quality for a timesheet record.',
        items: [
          {
            key: 'timeTracking.minTimesheetMinutes',
            label: 'Minimum timesheet length',
            type: 'Number (minutes)',
            defaultValue: '15',
            purpose: 'Discards accidental double punches that create near-zero shifts.',
            logic: [
              'On clock-out, if (clock-out − clock-in) < threshold, the record is not saved as a worked shift.',
              'Instead it is voided and written to the audit trail as `discarded_short_punch`, so the event is still traceable.',
              'A manager can restore a discarded punch from the audit trail within the current pay period.',
            ],
            edgeCases: [
              'Set to 0 to keep every punch, including 1-minute records.',
              'The rule never discards a record that already has an approved leave day, exception or allowance attached.',
            ],
            example: 'Threshold 15 min. Staff clocks in 9:00 and out 9:04 → discarded. Clocks in 9:00 and out 9:20 → kept.',
          },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'permissions',
    title: 'Team Member Permissions',
    icon: 'ShieldCheck',
    summary: 'What staff may do to their own timesheets, and the tolerances applied around scheduled start and end times.',
    evaluationPoint: 'Evaluated on every staff-initiated action in the Employee Portal, and again server-side before the write is committed.',
    groups: [
      {
        id: 'editing',
        title: 'Editing',
        summary: 'Self-service edit rights via the web app or Staff Mobile App. Manager rights are governed separately by the Users & Permissions matrix. Kiosk edits are controlled by Time Tracking settings.',
        items: [
          {
            key: 'permissions.createAndEditTimesheets',
            label: 'Create and edit own timesheets',
            type: 'Boolean',
            defaultValue: 'Off',
            purpose: 'Allows staff to add a manual timesheet via the web or Staff Mobile App rather than only clocking.',
            logic: [
              'When on, the Employee Portal and Staff Mobile App show "Add timesheet" and staff can edit any day in the current, unsubmitted period.',
              'Manually created entries are always tagged `source: manual` and are excluded from auto-approval when "When matches scheduled shift" is selected unless the times match within tolerance.',
              'When off, staff can view but not create; the add button is hidden and the API rejects staff-authored creates.',
            ],
            interactions: ['Auto-approval', 'Timesheet Issues → manual entries are eligible for pattern-drift checks'],
          },
          {
            key: 'permissions.updateTimesheetsDuringShift',
            label: 'Update timesheets during shift',
            type: 'Boolean',
            defaultValue: 'Off',
            purpose: 'Allows in-progress corrections before clock-out.',
            logic: [
              'Applies only while the record has no clock-out. Once clocked out, the "after submission" rule takes over.',
              'Each in-shift edit stores the previous value so the reviewer sees original vs adjusted.',
            ],
          },
          {
            key: 'permissions.editClockTimesAfterSubmission',
            label: 'Edit clock times after submission',
            type: 'Boolean',
            defaultValue: 'Off',
            purpose: 'Allows staff to amend a submitted but not yet approved timesheet.',
            logic: [
              'Edits are blocked once the timesheet reaches `approved` or is locked by a payroll export, regardless of this setting.',
              'When on, an edit after submission resets the approval chain to step 1 and re-runs all validation flags.',
              'When off, staff must raise an exception instead, which routes to the approver as a change request.',
            ],
            interactions: ['Approval chain reset', 'Raise exception workflow'],
          },
          {
            key: 'permissions.addNotesAndAttachments',
            label: 'Add notes and attachments',
            type: 'Boolean',
            defaultValue: 'On',
            purpose: 'Lets staff supply evidence (photos, receipts, explanations).',
            logic: [
              'Notes and attachments never change hours or pay; they are advisory context for the approver.',
              'Allowed even after approval so evidence can be added retrospectively, but post-approval additions are marked `late_evidence`.',
            ],
          },
        ],
      },
      {
        id: 'clocking',
        title: 'Clock-in & clock-out tolerances',
        summary: 'Guardrails that prevent early starts and forgotten clock-outs from inflating paid hours.',
        items: [
          {
            key: 'permissions.earlyClockInPolicy',
            label: 'Early clock-in policy',
            type: 'Enum',
            options: ['Not allowed', 'Up to X minutes early', 'Anytime before shift'],
            defaultValue: 'Up to X minutes early (15)',
            purpose: 'Controls how far ahead of the rostered start a punch is accepted.',
            logic: [
              '"Not allowed": a punch before the scheduled start is rejected; the app shows a countdown to the permitted time.',
              '"Up to X minutes early": accepted when (scheduled start − now) ≤ earlyClockInMinutes, otherwise rejected.',
              '"Anytime before shift": always accepted on the rostered day; rounding rules then decide whether the extra time is paid.',
              'Where no shift is rostered, this rule does not apply — Unscheduled Shifts rules apply instead.',
            ],
            interactions: ['earlyClockInMinutes', 'Rounding → Adjust start to scheduled if earlier', 'Timesheet Issues → early clock-in tolerance flag'],
            example: 'Shift 9:00, limit 15 min. Punch at 8:50 → accepted. Punch at 8:30 → rejected.',
          },
          {
            key: 'permissions.earlyClockInMinutes',
            label: 'Early clock-in window',
            type: 'Number (minutes)',
            defaultValue: '15',
            purpose: 'The X in "up to X minutes early".',
            logic: [
              'Only meaningful when the policy is "Up to X minutes early"; otherwise the field is ignored and hidden.',
              'Recommended to keep this at or below the start-rounding interval so early minutes are absorbed rather than paid.',
            ],
          },
          {
            key: 'permissions.lateClockInGraceMinutes',
            label: 'Late clock-in grace',
            type: 'Number (minutes)',
            defaultValue: '5',
            purpose: 'Suppresses lateness flags for trivial delays.',
            logic: [
              'A punch after the scheduled start is treated as on-time when (actual − scheduled) ≤ grace.',
              'Beyond grace, the day is marked `late_start` with the exact minutes late recorded for reporting.',
              'The grace affects flagging and reporting only; paid time always starts at the actual (post-rounding) punch.',
            ],
            interactions: ['Attendance reports', 'Timesheet Issues → shift time variance'],
          },
          {
            key: 'permissions.allowEarlyClockOut',
            label: 'Allow early clock-out',
            type: 'Boolean',
            defaultValue: 'Off',
            purpose: 'Controls whether staff can end a shift before the rostered finish.',
            logic: [
              'When off, the clock-out button is disabled until the scheduled end; staff must raise an exception (e.g. "shift cut short") to finish early.',
              'When on, the early finish is recorded as actual worked time and the shortfall is reported against the roster as under-coverage.',
              'Approved leave for part of the day bypasses this rule.',
            ],
            interactions: ['Roster coverage reporting', 'Raise exception workflow'],
          },
          {
            key: 'permissions.autoClockOutAfterShiftMinutes',
            label: 'Auto clock-out after shift',
            type: 'Number (minutes, 0 = off)',
            defaultValue: '30',
            purpose: 'Closes forgotten clock-outs so records do not run indefinitely.',
            logic: [
              'A background job runs every 5 minutes. If a record is still open and now > scheduled end + N minutes, the system clocks out.',
              'The clock-out time is set to the scheduled end (not the current time), so forgotten punches never inflate pay.',
              'The day is flagged `auto_clocked_out` and always excluded from auto-approval so a human confirms it.',
              'For unscheduled shifts with no scheduled end, the Unscheduled Shifts end-time rule determines the close-off time instead.',
            ],
            interactions: ['Timesheet Issues → Missing clock-out', 'Unscheduled Shifts → end time rule', 'Auto-approval (always skipped)'],
            edgeCases: ['Set to 0 to disable; open records then stay open and are surfaced by the Missing clock-out flag on the Daily Clock view.'],
            example: 'Shift ends 17:00, setting 30 min. At 17:30 the record is closed at 17:00 and flagged for review.',
          },
        ],
      },
      {
        id: 'break-permissions',
        title: 'Break permissions',
        summary: 'How much control staff have over their own break records.',
        items: [
          {
            key: 'permissions.wrapUpBreaksSooner',
            label: 'End breaks early',
            type: 'Boolean',
            defaultValue: 'Off',
            purpose: 'Allows returning from a break before the scheduled duration elapses.',
            logic: [
              'When off, the "end break" action is disabled until the scheduled break duration has passed.',
              'When on, the shortened break is recorded as actual and evaluated against the short-break flag.',
              'Award-mandated minimum break durations still apply; ending early may raise a compliance flag even when permitted here.',
            ],
            interactions: ['Breaks → Flag short or missed breaks', 'Awards → mandatory break rules'],
          },
          {
            key: 'permissions.editOwnBreakDuration',
            label: 'Edit own break duration',
            type: 'Boolean',
            defaultValue: 'Off',
            purpose: 'Lets staff correct a break they forgot to punch.',
            logic: [
              'Edits are capped at the shift window — a break cannot start before clock-in or end after clock-out.',
              'Reducing an unpaid break increases paid hours, so every edit is recorded with original vs adjusted and is excluded from auto-approval.',
            ],
          },
          {
            key: 'permissions.addBreaksToPastTimesheets',
            label: 'Add breaks to past timesheets',
            type: 'Boolean',
            defaultValue: 'Off',
            purpose: 'Allows retrospective break entry for prior days in the open period.',
            logic: [
              'Limited to days within the current unapproved period; locked/exported periods reject the change.',
              'A retrospective break that reduces paid hours is applied immediately; one that increases paid hours requires approver confirmation.',
            ],
          },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'approving',
    title: 'Approving & Rounding',
    icon: 'CheckSquare',
    summary: 'When a timesheet approves itself, and how raw punches are normalised into payable times.',
    evaluationPoint: 'Rounding runs at clock-out (and on every subsequent edit). Auto-approval runs after validation, immediately before the approval chain would start.',
    groups: [
      {
        id: 'auto-approval',
        title: 'Auto-approval',
        summary: 'Reduces manual review for clean, predictable timesheets. Auto-approval never bypasses critical flags unless explicitly configured.',
        items: [
          {
            key: 'approving.autoApproval',
            label: 'Auto-approval cadence',
            type: 'Enum',
            options: ['Never', 'On submission', 'When matches scheduled shift', 'Daily (end of day)'],
            defaultValue: 'Never',
            purpose: 'Defines the trigger that attempts automatic approval.',
            logic: [
              '"Never": every timesheet routes to the approval chain.',
              '"On submission": approval is attempted the moment the staff member submits.',
              '"When matches scheduled shift": approves only if every day’s start, end and break totals fall within the match tolerance of the roster.',
              '"Daily (end of day)": a nightly job evaluates each completed day independently, so a clean Monday approves even if Friday is flagged.',
              'In all modes the timesheet must pass the flag gate and the daily-hours cap before approval is granted.',
              'Auto-approved records are stamped approver `system` with the rule that fired, and remain fully auditable and reversible.',
            ],
            interactions: ['skipAutoApprovalIfFlagged', 'autoApprovalMatchToleranceMinutes', 'autoApprovalMaxDailyHours', 'Approval chain step 1'],
          },
          {
            key: 'approving.skipAutoApprovalIfFlagged',
            label: 'Skip auto-approval when flagged',
            type: 'Boolean',
            defaultValue: 'On',
            purpose: 'Forces human review of any timesheet carrying an issue flag.',
            logic: [
              'When on, the presence of any warning or critical flag (or an unresolved exception) cancels auto-approval and routes to the chain.',
              'Info-level flags do not block auto-approval.',
              'When off, only critical flags block — and only if "Block submission on critical" is also enabled.',
            ],
            interactions: ['Timesheet Issues (all severities)', 'blockSubmissionOnCritical'],
          },
          {
            key: 'approving.autoApprovalMatchToleranceMinutes',
            label: 'Match tolerance',
            type: 'Number (minutes)',
            defaultValue: '5',
            purpose: 'How closely actual times must match the roster to count as a match.',
            logic: [
              'Applied independently to start, end and total break minutes: |actual − scheduled| ≤ tolerance for each.',
              'Comparison uses post-rounding values, so rounding can bring a punch inside tolerance.',
              'Only relevant to the "When matches scheduled shift" cadence.',
            ],
            example: 'Tolerance 5. Rostered 9:00–17:00; worked 9:03–17:04 → match. Worked 9:00–17:20 → no match, routes to approver.',
          },
          {
            key: 'approving.autoApprovalMaxDailyHours',
            label: 'Auto-approval daily hours cap',
            type: 'Number (hours, 0 = no cap)',
            defaultValue: '0',
            purpose: 'Safety ceiling so unusually long days always get human eyes.',
            logic: [
              'If any day in the timesheet exceeds the cap (net hours), auto-approval is cancelled for the whole timesheet.',
              'A value of 0 disables the check entirely.',
              'The cap is evaluated on net paid hours after unpaid break deduction and rounding.',
            ],
          },
          {
            key: 'approving.notifyStaffOnAdjustment',
            label: 'Notify staff on adjustment',
            type: 'Boolean',
            defaultValue: 'On',
            purpose: 'Transparency when the system or an approver changes recorded times.',
            logic: [
              'Sends a notification whenever rounding, auto clock-out, an auto-created shift or an approver edit changes a stored time or break value.',
              'One digest per timesheet per change batch, listing original → adjusted for each affected field.',
              'Notifications are informational; they do not require acknowledgement and do not delay approval.',
            ],
          },
        ],
      },
      {
        id: 'rounding',
        title: 'Rounding',
        summary: 'Rounding changes payable time. It is a master switch: when off, all rounding sub-rules are inert and actual punches are used verbatim.',
        items: [
          {
            key: 'approving.roundingEnabled',
            label: 'Enable rounding',
            type: 'Boolean',
            defaultValue: 'Off',
            purpose: 'Master switch for all start, end and break rounding.',
            logic: [
              'When off, payable times equal actual punch times to the minute and every rounding dropdown is disabled.',
              'When on, rounding is applied in a fixed order: (1) snap-to-schedule adjustments, (2) interval rounding, (3) break rounding, (4) net-hours recalculation.',
              'Rounding must remain neutral or favourable to the employee under Australian award obligations; consistently down-rounding worked time is a compliance risk and is surfaced as a configuration warning.',
            ],
            interactions: ['Awards → payable hours', 'Timesheet Issues → variance flags compare actual vs scheduled, not rounded values'],
          },
          {
            key: 'approving.adjustStartToScheduledIfEarlier',
            label: 'Adjust start to scheduled if earlier',
            type: 'Boolean',
            defaultValue: 'Off',
            purpose: 'Prevents paying for time worked before the rostered start.',
            logic: [
              'If actual clock-in < scheduled start, the payable start is moved forward to the scheduled start.',
              'Applied before interval rounding, so the result is exactly the rostered time.',
              'Skipped when there is no rostered shift, or when the shift was explicitly started early with approval.',
            ],
            example: 'Rostered 9:00, punched 8:47 → paid from 9:00; the 13 early minutes remain visible in the audit trail.',
          },
          {
            key: 'approving.startTimeAdjustment',
            label: 'Start time rounding',
            type: 'Enum',
            options: ['Never', 'Nearest 5/10/15 minutes', 'Round up to 15', 'Round down to 15'],
            defaultValue: 'Never',
            purpose: 'Snaps the payable start to a clean interval.',
            logic: [
              '"Nearest N": rounds to the closest boundary; exact midpoints round up (in the employee’s favour at the end of a shift, against at the start — hence prefer "nearest" over directional rounding).',
              '"Round up to 15" delays the paid start to the next boundary; "round down" brings it earlier.',
              'Applied after the snap-to-schedule adjustment, so a start already snapped to 9:00 is unaffected.',
            ],
            edgeCases: ['Using "round up" on starts and "round down" on ends systematically reduces paid time and triggers a compliance warning in settings.'],
          },
          {
            key: 'approving.adjustEndToScheduledIfDelayed',
            label: 'Adjust end to scheduled if delayed',
            type: 'Boolean',
            defaultValue: 'Off',
            purpose: 'Prevents unapproved overtime from a late clock-out.',
            logic: [
              'If actual clock-out > scheduled end, the payable end is pulled back to the scheduled end.',
              'Never applied when the extra time has an approved overtime request, an allowance, or an exception raised against it.',
              'The trimmed minutes are still recorded and reported as unpaid overrun so managers can see systematic overruns.',
            ],
            interactions: ['Overtime engine', 'Raise exception workflow'],
          },
          {
            key: 'approving.endTimeAdjustment',
            label: 'End time rounding',
            type: 'Enum',
            options: ['Never', 'Nearest 5/10/15 minutes', 'Round up to 15', 'Round down to 15'],
            defaultValue: 'Never',
            purpose: 'Snaps the payable end to a clean interval.',
            logic: [
              'Same interval mechanics as start rounding, applied to the payable end after any snap-to-schedule adjustment.',
              'Net hours and overtime are recalculated from rounded start/end, never from raw punches.',
            ],
          },
          {
            key: 'approving.breakRoundingAdjustment',
            label: 'Break rounding',
            type: 'Enum',
            options: ['Never', 'Nearest 5/10/15 minutes', 'Round up to 15', 'Round down to 15'],
            defaultValue: 'Never',
            purpose: 'Snaps recorded break duration to a clean interval.',
            logic: [
              'Rounds total break minutes per day, not each individual break, to avoid compounding error across multiple breaks.',
              'Rounded break minutes are then subtracted from gross hours to produce net hours.',
            ],
          },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'unscheduled',
    title: 'Unscheduled Shifts',
    icon: 'CalendarClock',
    summary: 'What happens when someone clocks in without a matching rostered shift — matching, blocking, flagging and automatic roster creation.',
    evaluationPoint: 'Evaluated at clock-in (matching and blocking) and again at clock-out or approval (roster shift creation).',
    groups: [
      {
        id: 'matching',
        title: 'Matching to a rostered shift',
        summary: 'Before treating a punch as unscheduled, the system attempts to attach it to an existing shift.',
        items: [
          {
            key: 'unscheduled.linkUnscheduledToScheduled',
            label: 'Link unscheduled punches to shifts',
            type: 'Enum',
            options: ['Never', 'Best fit (±8 hours)', 'Exact start/end match', 'Same location/area only'],
            defaultValue: 'Never',
            purpose: 'Defines how aggressively a stray punch is attached to a rostered shift.',
            logic: [
              '"Never": no matching; every punch without an exact roster link is unscheduled.',
              '"Best fit": searches shifts for that staff member within ±8 hours of the punch and selects the one with the smallest start-time delta.',
              '"Exact start/end match": links only when both start and end align with the roster within the drift tolerance.',
              '"Same location/area only": best-fit matching, but candidate shifts must share the punch’s location and area.',
              'Ties are broken by (1) same area, (2) earliest start, (3) shift id — deterministic so replays produce the same result.',
              'A shift already linked to another punch is never reused.',
            ],
            interactions: ['allowTimeDriftMatching', 'noShiftClockInAction (only fires when matching fails)'],
          },
          {
            key: 'unscheduled.allowTimeDriftMatching',
            label: 'Time drift tolerance',
            type: 'Enum',
            options: ['Never', 'Within 15m / 30m / 1h / 2h / 4h'],
            defaultValue: 'Never',
            purpose: 'How far a punch can differ from a shift’s start and still match.',
            logic: [
              'Acts as the hard boundary for the matching strategy above: candidates outside the drift window are discarded before best-fit scoring.',
              '"Never" combined with a matching strategy means only exact-minute matches link.',
              'Wide windows (2–4h) are appropriate for on-call or split-shift operations; narrow windows suit fixed rosters.',
            ],
            edgeCases: ['A large drift window can attach a late-night punch to the wrong shift on split-shift days; prefer "Same location/area only" in that case.'],
          },
          {
            key: 'unscheduled.requireTrainingForUnscheduled',
            label: 'Require qualifications for unscheduled work',
            type: 'Boolean',
            defaultValue: 'Off',
            purpose: 'Stops unqualified staff working in an area they are not certified for.',
            logic: [
              'At clock-in the staff member’s current qualifications and expiry dates are checked against the area’s required qualifications.',
              'Missing or expired qualification → punch blocked with `QUALIFICATION_REQUIRED` and a manager alert.',
              'Only applies to unscheduled punches; rostered shifts are validated at scheduling time instead.',
            ],
            interactions: ['Location Management → area qualification requirements', 'Workforce → staff qualifications'],
          },
        ],
      },
      {
        id: 'no-shift',
        title: 'Clock-in with no rostered shift',
        summary: 'The response when matching finds nothing.',
        items: [
          {
            key: 'unscheduled.noShiftClockInAction',
            label: 'No-shift action',
            type: 'Enum',
            options: ['Block the punch', 'Allow and flag', 'Allow silently'],
            defaultValue: 'Allow and flag',
            purpose: 'The primary control for unrostered work.',
            logic: [
              '"Block": the punch is rejected; staff see guidance to contact their manager. Nothing is written except an audit entry.',
              '"Allow and flag": the punch is accepted, the timesheet day is tagged `unscheduled` and a roster flag is raised at the configured severity.',
              '"Allow silently": accepted with no flag — appropriate only for casual pools or agency-heavy sites where rosters are indicative.',
              'Blocking is bypassed for approved emergency/on-call staff so callbacks are never prevented.',
            ],
            interactions: ['rosterFlagSeverity', 'notifyManagerOnUnscheduledClockIn', 'createShiftInRoster'],
          },
          {
            key: 'unscheduled.rosterFlagSeverity',
            label: 'Roster flag severity',
            type: 'Enum',
            options: ['Off', 'Info', 'Warning', 'Critical'],
            defaultValue: 'Warning',
            purpose: 'How prominently the unscheduled shift appears on the roster and in review queues.',
            logic: [
              'Info: subtle badge on the roster cell, no queue entry.',
              'Warning: amber badge, appears in the reviewer panel, blocks auto-approval when "skip when flagged" is on.',
              'Critical: red badge and, when "Block submission on critical" is on, prevents submission/approval until resolved.',
              'Only meaningful when the no-shift action is "Allow and flag".',
            ],
          },
          {
            key: 'unscheduled.notifyManagerOnUnscheduledClockIn',
            label: 'Notify manager on unscheduled clock-in',
            type: 'Boolean',
            defaultValue: 'On',
            purpose: 'Real-time awareness of unbudgeted labour.',
            logic: [
              'Sends an immediate notification to the location manager (and any delegate) at the moment the punch is accepted.',
              'Payload includes staff name, area, time, and whether a roster shift was auto-created.',
              'Notifications are deduplicated per staff member per day.',
            ],
          },
        ],
      },
      {
        id: 'auto-shift',
        title: 'Automatic roster shift creation',
        summary: 'Keeps the roster a true record of who worked, so coverage, cost and ratio reporting stay accurate.',
        items: [
          {
            key: 'unscheduled.createShiftInRoster',
            label: 'Create shift in roster',
            type: 'Enum',
            options: ['Never', 'On clock-in', 'On clock-out', 'On approval'],
            defaultValue: 'On clock-out',
            purpose: 'When the placeholder roster shift is written.',
            logic: [
              '"On clock-in" creates a provisional shift immediately, so live coverage and ratio dashboards are correct during the shift. The end time comes from the end-time rule.',
              '"On clock-out" creates a completed shift with the true worked window — the most accurate option, but the roster is blind during the shift.',
              '"On approval" creates the shift only once the timesheet is approved, keeping the roster free of unverified records.',
              '"Never" leaves the roster untouched; the worked time exists only on the timesheet, and coverage reports will understate actual staffing.',
              'Created shifts are tagged `auto_generated: unscheduled_clock_in` and link back to the originating timesheet day.',
              'If the punch is later voided or the timesheet rejected, the auto-created shift is deleted unless a manager has since edited it.',
            ],
            interactions: ['Roster coverage & ratio compliance', 'Labour cost reporting', 'markCreatedShiftUnapproved'],
          },
          {
            key: 'unscheduled.createdShiftEndTimeRule',
            label: 'End time rule',
            type: 'Enum',
            options: ['Actual clock-out', 'Fixed duration', 'Location closing time', 'Area default shift length', 'Open-ended'],
            defaultValue: 'Actual clock-out',
            purpose: 'Determines the provisional end time when the shift is created before the staff member clocks out.',
            logic: [
              '"Actual clock-out": only valid with "On clock-out"/"On approval". With "On clock-in" the system falls back to fixed duration until the real clock-out arrives.',
              '"Fixed duration": end = start + createdShiftFixedDurationHours.',
              '"Location closing time": end = the location’s operating close for that weekday; if the location is 24-hour or has no hours defined, falls back to fixed duration.',
              '"Area default shift length": end = start + the area’s configured default shift length; falls back to the location default, then fixed duration.',
              '"Open-ended": the shift is created with no end time and shown as in-progress; it must be closed by the real clock-out or by auto clock-out.',
              'Every computed end is then clamped by the max duration and snapped by the rounding interval, in that order.',
              'All arithmetic uses the location’s timezone and is DST-safe: a shift crossing a DST boundary keeps its wall-clock duration intent and the actual elapsed hours are recalculated.',
            ],
            interactions: ['createdShiftFixedDurationHours', 'createdShiftMaxDurationHours', 'createdShiftRoundToMinutes', 'Location operating hours', 'Area default shift length'],
            example: 'Clock-in 6:40am, rule "Location closing time" (close 18:00), max 12h, round 15 min → provisional end 18:00 (11h20m, under the cap).',
          },
          {
            key: 'unscheduled.createdShiftFixedDurationHours',
            label: 'Fixed duration',
            type: 'Number (hours)',
            defaultValue: '8',
            purpose: 'Length used by the fixed-duration rule and by all fallbacks.',
            logic: [
              'Valid range 0.5–24 hours; values above the max duration are rejected as a configuration error.',
              'Used whenever a preferred rule cannot resolve (no operating hours, no area default, actual clock-out not yet known).',
            ],
          },
          {
            key: 'unscheduled.createdShiftMaxDurationHours',
            label: 'Maximum duration',
            type: 'Number (hours)',
            defaultValue: '12',
            purpose: 'Hard safety ceiling on any auto-created shift.',
            logic: [
              'After the end time is computed, if (end − start) > max, the end is clamped to start + max and the shift is flagged `clamped_max_duration`.',
              'Bounded to 1–24 hours. Clamping also applies to open-ended shifts closed by auto clock-out.',
              'Prevents a forgotten clock-out from creating a multi-day roster entry that corrupts cost and ratio reporting.',
            ],
          },
          {
            key: 'unscheduled.createdShiftRoundToMinutes',
            label: 'Round created shift to',
            type: 'Number (minutes)',
            defaultValue: '15',
            purpose: 'Keeps auto-created roster entries tidy and comparable to planned shifts.',
            logic: [
              'Must divide evenly into 60 (1, 5, 10, 15, 20, 30, 60); other values are rejected.',
              'Start is rounded down and end rounded up to the nearest interval, so the roster block never understates the worked window.',
              'This rounding affects the roster block only — payable time still follows the Rounding settings under Approving.',
            ],
            edgeCases: ['Set to 1 to disable practical rounding.'],
          },
          {
            key: 'unscheduled.markCreatedShiftUnapproved',
            label: 'Mark created shift as unapproved',
            type: 'Boolean',
            defaultValue: 'On',
            purpose: 'Keeps auto-created shifts visually distinct until a manager confirms them.',
            logic: [
              'The shift is written with status `pending_confirmation`, rendered with a dashed border on the roster grid.',
              'Unapproved shifts are excluded from committed labour-cost budgets but included in actual-cost and ratio compliance.',
              'Manager confirmation converts it to a normal shift; rejection deletes it and flags the timesheet day for correction.',
            ],
            interactions: ['Budget vs actual reporting', 'Roster shift colour/status visualisation'],
          },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'breaks',
    title: 'Breaks',
    icon: 'Coffee',
    summary: 'How breaks are captured, whether they are paid, and how missing break data is handled.',
    evaluationPoint: 'Applied at clock-out and on every timesheet recalculation, before net hours are derived.',
    groups: [
      {
        id: 'behaviour',
        title: 'Break behaviour',
        summary: 'Break rules interact directly with net paid hours, so they run before validation and approval.',
        items: [
          {
            key: 'breaks.autoIncludeScheduledOnClockOut',
            label: 'Auto-include scheduled breaks on clock-out',
            type: 'Boolean',
            defaultValue: 'Off',
            purpose: 'Fills in break data when staff do not punch their breaks.',
            logic: [
              'At clock-out, if no break was recorded and the rostered shift includes a scheduled break, that break is inserted automatically.',
              'The inserted break is positioned at the scheduled time when it fits inside the actual worked window; otherwise at the midpoint of the shift.',
              'Auto-inserted breaks are tagged `system_inserted` and shown distinctly to the approver.',
              'Never applied when the actual worked time is shorter than the break itself, or when the staff member recorded any break at all.',
            ],
            interactions: ['Break rules library (minimum hours → break entitlement)', 'Net hours calculation'],
            example: 'Rostered 9:00–17:00 with a 30-min unpaid break; staff punched only in/out → 30 min deducted, day shows 7.5 net hours.',
          },
          {
            key: 'breaks.paidMealBreaks',
            label: 'Paid meal breaks',
            type: 'Enum',
            options: ['Never (unpaid)', 'Always paid'],
            defaultValue: 'Never (unpaid)',
            purpose: 'Determines whether meal-break minutes are deducted from paid hours.',
            logic: [
              '"Never": all meal breaks are unpaid and deducted from gross hours.',
              '"Always": meal breaks are paid and not deducted; gross equals net for break purposes.',
              'Where the applicable award mandates a paid meal break, the award wins and this setting cannot make it unpaid.',
              'Rest/tea breaks are always paid and are not governed by this setting.',
            ],
            interactions: ['Awards → paid break provisions', 'Net hours and overtime calculation'],
            edgeCases: ['The settings screen renders a live "Current outcome" sentence describing the resolved rule in plain English.'],
          },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'issues',
    title: 'Timesheet Issues (flagging)',
    icon: 'AlertCircle',
    summary: 'Detection rules that raise info, warning or critical flags. Flags never change pay — they change who must look at the record and whether it can progress.',
    evaluationPoint: 'Runs after normalisation on every save, submission and edit. Weekly rules re-run whenever any day in the week changes.',
    groups: [
      {
        id: 'severity-model',
        title: 'Severity model',
        summary: 'Every rule below shares the same four-level severity scale.',
        items: [
          {
            key: 'issues.__severity',
            label: 'Severity levels',
            type: 'Enum',
            options: ['Off', 'Info', 'Warning', 'Critical'],
            defaultValue: 'Varies per rule',
            purpose: 'Controls visibility and whether a flag gates progression.',
            logic: [
              'Off: the rule is not evaluated at all (no performance cost, no records).',
              'Info: recorded and visible in the reviewer panel and reports; does not block auto-approval or submission.',
              'Warning: visible with an amber indicator; blocks auto-approval when "Skip auto-approval when flagged" is on; approval still possible.',
              'Critical: red indicator; blocks submission/approval when "Block submission on critical" is on, otherwise requires an explicit override with a comment.',
              'Overrides are always recorded with actor, timestamp and reason in the audit trail.',
            ],
          },
        ],
      },
      {
        id: 'variance',
        title: 'Time variance',
        summary: 'Compares actual punches to the rostered plan. Distinct from rounding: variance flags always use raw actual times so rounding cannot hide a variance.',
        items: [
          {
            key: 'issues.flagBreakDurationVariance',
            label: 'Flag break duration variance',
            type: 'Enum',
            options: ['Never', 'Over 5m', 'Over 10m', 'Over 15m', 'Always'],
            defaultValue: 'Over 10m',
            purpose: 'Detects breaks materially shorter or longer than planned.',
            logic: [
              'Compares total recorded break minutes for the day against total scheduled break minutes.',
              'Both directions are flagged; the flag records whether the break was short or long.',
              'When no break is scheduled, the rule is skipped and the long-shift-without-break rule covers the risk instead.',
            ],
          },
        ],
      },
      {
        id: 'missing',
        title: 'Missing & unusual entries',
        summary: 'Structural problems with the record itself.',
        items: [
          {
            key: 'issues.flagMissingClockOut',
            label: 'Flag missing clock-out',
            type: 'Severity',
            defaultValue: 'Critical',
            purpose: 'Catches open records with no end time.',
            logic: [
              'Raised when a day has a clock-in but no clock-out and the shift end (or the auto clock-out window) has passed.',
              'Persists until a clock-out is supplied by the staff member, the auto clock-out job, or a manager edit.',
              'At critical severity with blocking on, the whole timesheet cannot be submitted while any day remains open.',
              'The Daily Clock view exposes a dedicated "Missing clock-out" filter driven by this flag.',
            ],
            interactions: ['autoClockOutAfterShiftMinutes', 'Daily Clock view filters'],
          },
          {
            key: 'issues.clockBoundaryReference',
            label: 'Clock boundary reference',
            type: 'Enum',
            options: ['Operating window', 'Scheduled shift'],
            defaultValue: 'Scheduled shift',
            purpose: 'Defines what "too early" and "too late" are measured against.',
            logic: [
              '"Scheduled shift": tolerances are measured from the staff member’s own rostered start and end.',
              '"Operating window": tolerances are measured from the location’s opening and closing times — useful where rosters are indicative but the site has fixed hours.',
              'If the chosen reference is unavailable (no shift, or no operating hours defined), the boundary check is skipped for that day rather than guessed.',
            ],
            interactions: ['Location operating hours', 'Roster shift times'],
          },
          {
            key: 'issues.earlyClockInToleranceMinutes',
            label: 'Early clock-in tolerance',
            type: 'Number (minutes)',
            defaultValue: '30',
            purpose: 'How far before the boundary a punch may occur without a flag.',
            logic: [
              'Flag raised when (boundary start − actual clock-in) > tolerance.',
              'Independent of the Team Member Permissions early clock-in rule: permissions decide whether the punch is *allowed*, this decides whether it is *flagged*.',
              'Set the tolerance at or above the permitted early window to avoid flagging behaviour you explicitly allow.',
            ],
            interactions: ['permissions.earlyClockInPolicy'],
          },
          {
            key: 'issues.lateClockOutToleranceMinutes',
            label: 'Late clock-out tolerance',
            type: 'Number (minutes)',
            defaultValue: '30',
            purpose: 'How far past the boundary a punch may occur without a flag.',
            logic: [
              'Flag raised when (actual clock-out − boundary end) > tolerance.',
              'Suppressed when the overrun is covered by an approved overtime request or a callback/recall event.',
            ],
            interactions: ['Overtime approvals', 'Specialised shift types (callback, recall)'],
          },
          {
            key: 'issues.flagClockBoundaryBreach',
            label: 'Boundary breach severity',
            type: 'Severity',
            defaultValue: 'Warning',
            purpose: 'Severity assigned when either tolerance above is exceeded.',
            logic: ['A single flag is raised per day per direction (early-in, late-out), carrying the minutes over tolerance.'],
          },
        ],
      },
      {
        id: 'excessive',
        title: 'Excessive hours',
        summary: 'Fatigue and cost controls. These duplicate the Compliance thresholds intentionally: Compliance governs approval blocking, Issues governs day-level visibility.',
        items: [
          {
            key: 'issues.flagLongShiftWithoutBreak',
            label: 'Flag long shift without break',
            type: 'Severity + threshold',
            defaultValue: 'Warning @ 6 hours',
            purpose: 'Detects continuous work beyond the legal break point.',
            logic: [
              'Raised when worked hours exceed the threshold and zero break minutes are recorded for the day.',
              'Auto-included scheduled breaks satisfy the rule for pay but the underlying "not punched" note remains.',
              'Threshold should match the first break entitlement in the break rules library (commonly 5–6 hours).',
            ],
            interactions: ['breaks.autoIncludeScheduledOnClockOut', 'Break rules library'],
          },
          {
            key: 'issues.flagHighWeeklyOvertime',
            label: 'Flag high weekly overtime',
            type: 'Severity + threshold',
            defaultValue: 'Warning @ 8 hours',
            purpose: 'Cost and fatigue control across the week.',
            logic: [
              'Sums overtime hours calculated by the unified overtime engine across all days in the timesheet week.',
              'Evaluated once per week, at submission and on any subsequent edit.',
              'Flag is attached to the timesheet (not a single day) and is visible in the approver’s cost summary.',
            ],
            interactions: ['Unified overtime engine', 'Awards → overtime thresholds'],
          },
        ],
      },
      {
        id: 'break-behaviour',
        title: 'Break behaviour',
        summary: 'Detects overuse of break time.',
        items: [
        ],
      },
      {
        id: 'patterns',
        title: 'Behavioural patterns',
        summary: 'Statistical and anti-fraud detections that look across multiple records rather than a single day.',
        items: [
          {
            key: 'issues.flagBuddyPunching',
            label: 'Flag buddy punching',
            type: 'Severity',
            defaultValue: 'Critical',
            purpose: 'Detects one person clocking in on behalf of another.',
            logic: [
              'Signals evaluated together, each contributing to a confidence score: (1) two or more staff punched from the same device within 60 seconds, (2) identical GPS coordinates to within device accuracy, (3) the punch pattern repeats across multiple days, (4) a kiosk photo is missing or mismatched.',
              'A flag is raised when two or more signals are present; a single signal alone is not sufficient.',
              'The flag lists the co-punched staff members so the approver can investigate both records.',
              'At critical severity the affected days require an explicit override with a written reason.',
            ],
            interactions: ['requireKioskPhoto', 'captureGpsOnMobile'],
            edgeCases: ['Shared kiosks legitimately produce clustered punches; without GPS or photo signals the rule tends toward false positives, so pair it with at least one verification channel.'],
          },
          {
            key: 'issues.flagIrregularPunchPattern',
            label: 'Flag irregular punch pattern',
            type: 'Severity',
            defaultValue: 'Warning',
            purpose: 'Catches structurally impossible or suspicious punch sequences.',
            logic: [
              'Detects: overlapping shifts for the same person, a clock-in before the previous clock-out, punches at two locations that are physically impossible in the elapsed time, duplicate punches within one minute, and clock events outside the location’s operating window.',
              'Each detection is a discrete flag entry so the approver can resolve them individually.',
              'Physically-impossible-travel detection uses straight-line distance between locations and a 60 km/h assumption; it is skipped when either location lacks coordinates.',
            ],
          },
        ],
      },
      {
        id: 'submission',
        title: 'Submission behaviour',
        summary: 'How flags gate the workflow.',
        items: [
          {
            key: 'issues.blockSubmissionOnCritical',
            label: 'Block submission on critical flags',
            type: 'Boolean',
            defaultValue: 'On',
            purpose: 'Prevents known-bad data reaching payroll.',
            logic: [
              'When on, a timesheet with any unresolved critical flag cannot be submitted by staff or approved by a manager.',
              'Resolution paths: fix the underlying data, or record an explicit override with a mandatory comment (permission-gated).',
              'When off, critical flags are advisory: they display prominently and block auto-approval but do not prevent progression.',
              'Overrides are always audited and reported in the compliance scorecard.',
            ],
            interactions: ['Approval chain', 'Compliance scorecard', 'Users & Permissions → override capability'],
          },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'compliance',
    title: 'Compliance Thresholds',
    icon: 'Scale',
    summary: 'Award-aligned validation limits applied to the timesheet as a whole. These are validation rules only — they never alter pay, which is governed by Awards.',
    evaluationPoint: 'Evaluated on submission and on every approver action, across the full timesheet week and the preceding week where rest/consecutive-day rules span periods.',
    groups: [
      {
        id: 'thresholds',
        title: 'Flag thresholds',
        summary: 'Each threshold has an on/off switch, a value, and a severity. Warning allows approval; Critical blocks it until resolved or overridden.',
        items: [
          {
            key: 'compliance.maxDailyHours',
            label: 'Daily hours limit',
            type: 'Toggle + hours + severity',
            defaultValue: 'On, 10 hrs, Warning',
            purpose: 'Flags a day whose worked hours exceed the limit.',
            logic: [
              'Uses net paid hours for the day after break deduction and rounding.',
              'Days spanning midnight are attributed to the clock-in date so a day is counted once.',
              'Independent of the Issues "excessive daily hours" rule: this one gates approval, that one drives day-level visibility. Keep this value at or below that threshold.',
            ],
            interactions: ['Awards → ordinary hours', 'issues.flagExcessiveDailyHours'],
          },
          {
            key: 'compliance.maxWeeklyHours',
            label: 'Weekly hours limit',
            type: 'Toggle + hours + severity',
            defaultValue: 'On, 38 hrs, Warning',
            purpose: 'Flags a week whose total hours exceed the limit.',
            logic: [
              'Sums net hours across all days in the timesheet period, including approved paid leave where the award counts it toward ordinary hours.',
              'Unpaid leave and unpaid breaks are excluded.',
              'For part-time and casual staff the contracted weekly hours from Pay Conditions override this tenant value where set.',
            ],
            interactions: ['Pay Conditions → contracted hours', 'Leave types → paid/unpaid classification'],
          },
          {
            key: 'compliance.minRestBetweenShiftsHours',
            label: 'Minimum rest between shifts',
            type: 'Toggle + hours + severity',
            defaultValue: 'On, 10 hrs, Critical',
            purpose: 'Enforces the fatigue break between consecutive shifts.',
            logic: [
              'Measured from the clock-out of one shift to the clock-in of the next, including across the week boundary into the prior period.',
              'A breach flags the *second* shift, since that is the one that can still be adjusted.',
              'Common award value is 10 hours (12 for shift workers); set as Critical because insufficient rest typically attracts penalty rates or is prohibited outright.',
              'Callbacks and recalls are evaluated under their own rules where the specialised shift type defines them.',
            ],
            interactions: ['Awards → rest period provisions', 'Roster fatigue scoring', 'Specialised shift types'],
            example: 'Clock-out 23:30 Monday, clock-in 07:00 Tuesday = 7.5 hrs rest → critical flag on the Tuesday shift.',
          },
          {
            key: 'compliance.maxConsecutiveDays',
            label: 'Consecutive workdays limit',
            type: 'Toggle + days + severity',
            defaultValue: 'On, 6 days, Warning',
            purpose: 'Ensures a rest day within a defined run.',
            logic: [
              'Counts unbroken days with at least one worked shift, looking back across the previous period so runs spanning a week boundary are caught.',
              'Approved paid leave days do not break the run for fatigue purposes but are excluded from the worked count; a full rest day (no shift, no leave) resets the counter.',
              'The flag is raised on the day that exceeds the limit.',
            ],
            interactions: ['Leave calendar', 'Roster compliance engine'],
          },
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    id: 'approval-chain',
    title: 'Approval Chain',
    icon: 'Workflow',
    summary: 'Who approves a timesheet, in what order, within what SLA, and what happens when the SLA is breached.',
    evaluationPoint: 'The chain is constructed at submission (after auto-approval is attempted) and re-evaluated whenever the timesheet is edited.',
    groups: [
      {
        id: 'structure',
        title: 'Chain structure',
        summary: 'Step 1 is always the location manager. Additional steps run only when their triggers match.',
        items: [
          {
            key: 'approvalChain.step1',
            label: 'Step 1 — Location Manager',
            type: 'Always-on step',
            defaultValue: 'Enabled, 24h SLA, 4h reminder, escalate on breach',
            purpose: 'The mandatory first review by the person accountable for the location’s labour.',
            logic: [
              'Cannot be removed. It can be skipped only when auto-approval succeeded and "skip when auto-approved" is enabled.',
              'The approver is resolved from the timesheet’s location; if that manager is on leave, an active delegation reroutes to the delegate.',
              'Approving at step 1 either completes the chain or advances to the first additional step whose triggers match.',
            ],
            interactions: ['Approval delegation', 'Auto-approval'],
          },
          {
            key: 'approvalChain.triggers',
            label: 'Additional step triggers',
            type: 'Trigger set',
            options: ['Has overtime', 'Overtime over N hours', 'Daily hours over N', 'Has compliance flag', 'Has exception'],
            defaultValue: 'No additional steps',
            purpose: 'Conditionally adds senior review for higher-risk timesheets.',
            logic: [
              'A step runs when ANY of its enabled triggers matches (OR logic). A step with no triggers always runs after step 1.',
              'Triggers are evaluated against the post-normalisation, post-validation state of the timesheet.',
              'Steps execute in the order they are listed; each must complete before the next begins, unless the step is marked parallel.',
              'If an edit changes the timesheet after routing, the chain is rebuilt from step 1 and prior approvals are voided.',
            ],
          },
          {
            key: 'approvalChain.bands',
            label: 'Approver bands',
            type: 'Ordered list per step',
            defaultValue: 'One catch-all band',
            purpose: 'Routes different scopes (location group, location, employment type) to different approvers within one step.',
            logic: [
              'Bands are evaluated top to bottom; the first band whose scope matches the timesheet routes it. Evaluation stops at the first match.',
              'A band with all scope fields empty is the catch-all and should be placed last.',
              'Scope matching is AND across dimensions (group AND location AND employment type) and OR within a dimension.',
              'If no band matches and there is no catch-all, the step is skipped and logged as `no_matching_band` so timesheets are never stranded.',
            ],
          },
        ],
      },
      {
        id: 'sla',
        title: 'SLA & escalation',
        summary: 'Time-bound accountability for approvers.',
        items: [
          {
            key: 'approvalChain.slaHours',
            label: 'SLA hours',
            type: 'Number (hours)',
            defaultValue: '24',
            purpose: 'The window in which the step’s approver must act.',
            logic: [
              'The clock starts when the step becomes active, not when the timesheet was submitted.',
              'Measured in business hours where the location defines operating days; otherwise elapsed hours.',
              'The deadline is stored on the step so it survives reassignment and delegation.',
            ],
          },
          {
            key: 'approvalChain.reminderHours',
            label: 'Reminder before breach',
            type: 'Number (hours)',
            defaultValue: '4',
            purpose: 'Nudges the approver before the SLA expires.',
            logic: [
              'A single reminder is sent when (deadline − now) ≤ reminderHours.',
              'Suppressed if the approver has already opened the timesheet within the last hour.',
            ],
          },
          {
            key: 'approvalChain.slaBreachAction',
            label: 'SLA breach action',
            type: 'Enum',
            options: ['Escalate', 'Auto-approve', 'Auto-reject', 'Hold'],
            defaultValue: 'Escalate',
            purpose: 'What the system does when the deadline passes with no decision.',
            logic: [
              '"Escalate": routes to the configured escalation tier and marks the step `escalated`; the original approver retains view access.',
              '"Auto-approve": approves on behalf of the approver, stamped `sla_auto_approved`. Never applied to timesheets carrying critical flags.',
              '"Auto-reject": rejects and returns to the staff member with a system comment; requires a reason template.',
              '"Hold": leaves the step open and surfaces it in the overdue work queue with no automated decision.',
              'Every breach action is written to the audit trail and counted in approver SLA reporting.',
            ],
            interactions: ['Approval work queue', 'Compliance scorecard'],
          },
          {
            key: 'approvalChain.parallelApproval',
            label: 'Parallel approval',
            type: 'Boolean',
            defaultValue: 'Off',
            purpose: 'Requires all approvers in a step to approve, rather than the first responder.',
            logic: [
              'When on, the step completes only when every matched approver has approved; a single rejection ends the step immediately.',
              'Each approver has an independent SLA clock, so one slow approver does not reset the others.',
            ],
          },
          {
            key: 'approvalChain.requireCommentOnReject',
            label: 'Require comment on reject',
            type: 'Boolean',
            defaultValue: 'On',
            purpose: 'Ensures staff receive an actionable reason.',
            logic: [
              'A rejection without a comment is refused by the API, not just the UI.',
              'The comment is included in the notification to the staff member and stored in the audit trail.',
            ],
          },
          {
            key: 'approvalChain.notifyStaffOnRoute',
            label: 'Notify staff on route',
            type: 'Boolean',
            defaultValue: 'Off',
            purpose: 'Tells staff where their timesheet currently sits.',
            logic: ['Sends a notification each time the timesheet advances to a new step, naming the current approver and the SLA deadline.'],
          },
        ],
      },
      {
        id: 'workflow-validation',
        title: 'Configuration validation & notifications',
        summary: 'The Workflow tab validates the approval flow as it is edited and explains the resolved routing in plain English before it is saved.',
        items: [
          {
            key: 'workflow.__outcomeSummary',
            label: 'Current outcome summary',
            type: 'Derived (read-only)',
            defaultValue: 'Always shown',
            purpose: 'Describes the configured chain as a single sentence so a non-technical reviewer can confirm intent.',
            logic: [
              'Renders the number of steps, the first-step approver, and whether the chain ends in auto-approval, escalation or hold.',
              'Recomputed on every edit before save, so the summary always reflects the draft, not the persisted policy.',
            ],
          },
          {
            key: 'workflow.__validation',
            label: 'Approval flow validation',
            type: 'Derived (read-only)',
            defaultValue: 'Always evaluated',
            purpose: 'Blocks or warns about approval configurations that would stall or silently approve timesheets.',
            logic: [
              'Error — SLA hours of zero or negative on any step or band: the step would breach immediately.',
              'Error — reminder lead time greater than or equal to the SLA: the reminder would fire at or after the breach.',
              'Warning — breach action set to auto-approve or auto-reject: timesheets can clear or fail without human review.',
              'Warning — an escalation step with no triggers and no scope: it runs on every timesheet, which is rarely intended.',
              'Warning — a band placed after a catch-all band (no location, group or employment filter): later bands are unreachable.',
            ],
            interactions: ['approvalChain.slaHours', 'approvalChain.reminderHours', 'approvalChain.slaBreachAction', 'approvalChain.bands'],
            edgeCases: ['Warnings do not block saving; errors do. A saved chain that later becomes unreachable (for example a deleted location) is re-validated on load and surfaced as a banner.'],
          },
          {
            key: 'workflow.notifications',
            label: 'Notification events & recipients',
            type: 'Per-event channels + recipient roles',
            defaultValue: 'Email on submission and rejection',
            purpose: 'Controls who is told what, and on which channel, as a timesheet moves through the chain.',
            logic: [
              'Each event (submitted, approved, rejected, SLA reminder, SLA breach, adjustment) has independent channel toggles and a recipient role list.',
              'An event with a channel enabled but no recipient roles sends nothing — the settings screen raises a warning for this combination.',
              'The digest sends a single rolled-up summary on its cadence instead of per-event messages; enabling it with no recipients also raises a warning.',
              'Cadence values are stored canonically (for example `on_submit`), so legacy variants are normalised on load.',
            ],
            interactions: ['approvalChain.notifyStaffOnRoute', 'approving.notifyStaffOnAdjustment'],
          },
        ],
      },
    ],
  },
];

export const conflictMatrix: { rule: string; conflictsWith: string; resolution: string }[] = [
  {
    rule: 'Rounding: round start up to 15',
    conflictsWith: 'Early clock-in allowed up to 15 minutes',
    resolution: 'Early minutes are permitted but unpaid. Intentional in most operations — confirm it is not systematically disadvantaging staff under the award.',
  },
  {
    rule: 'Adjust end to scheduled if delayed',
    conflictsWith: 'Overtime detection',
    resolution: 'Approved overtime requests bypass the adjustment; unapproved overruns are trimmed and reported as unpaid overrun rather than paid overtime.',
  },
  {
    rule: 'Auto-approval "On submission"',
    conflictsWith: 'Compliance critical thresholds',
    resolution: 'Critical compliance flags always cancel auto-approval regardless of cadence.',
  },
  {
    rule: 'No-shift action "Block"',
    conflictsWith: 'Create shift in roster',
    resolution: 'Blocking means no punch exists, so no shift is created. The creation settings become inert and are disabled in the UI.',
  },
  {
    rule: 'End time rule "Actual clock-out"',
    conflictsWith: 'Create shift "On clock-in"',
    resolution: 'The clock-out is unknown at creation time, so the system falls back to fixed duration and corrects the shift when the real clock-out arrives.',
  },
  {
    rule: 'Auto-include scheduled breaks',
    conflictsWith: 'Flag long shift without break',
    resolution: 'The inserted break satisfies the pay calculation and clears the flag, but an info note records that the break was never punched.',
  },
  {
    rule: 'Flag buddy punching',
    conflictsWith: 'Kiosk verification set to "PIN only" and no GPS',
    resolution: 'Only the device/time-cluster signal is available, which alone is insufficient. Move the kiosk to a face-verification mode or lower the severity.',
  },
  {
    rule: 'Kiosk verification includes face',
    conflictsWith: 'Staff with no enrolled face template',
    resolution: 'The punch is blocked rather than downgraded to PIN. Enrol the staff member, or use "PIN + face" so identification still works while enrolment is completed.',
  },
  {
    rule: 'Paid meal breaks + cap on paid minutes',
    conflictsWith: 'Award-mandated paid meal duration',
    resolution: 'The award duration wins. The cap can only reduce paid minutes below an award minimum where no award provision applies.',
  },
  {
    rule: 'Paid meal counts toward hours = Off',
    conflictsWith: 'Excessive daily hours / overtime thresholds',
    resolution: 'Paid meal minutes are paid but excluded from threshold maths, so a day can be paid above the cap without flagging. Leave on unless the award says otherwise.',
  },
  {
    rule: 'Compliance daily limit 10h',
    conflictsWith: 'Issues excessive daily hours 12h',
    resolution: 'Both fire independently. Compliance gates approval at 10h; the Issues flag adds a second, louder signal at 12h. Keep compliance ≤ issues threshold.',
  },
  {
    rule: 'SLA breach action "Auto-approve"',
    conflictsWith: 'Skip auto-approval when flagged',
    resolution: 'The skip rule only governs the initial auto-approval attempt. A breach-driven auto-approve still clears flagged timesheets — use "Escalate" or "Hold" if that is unacceptable.',
  },
];
