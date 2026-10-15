/**
 * Scheduling Constraints Configuration
 * Maps H1-H20 (Hard) and S1-S20 (Soft) constraints from the business requirements
 * Each constraint supports business-wide defaults with location-level overrides
 * All constraints have fully configurable parameters
 */

// ============= Core Types =============

export type ConstraintEnforcement = 'HARD' | 'SOFT' | 'OFF';
export type ConstraintScope = 'business' | 'location';
export type Satisfiability = 'REQUIRED' | 'PREFERRED';

// ============= Conditional Rules =============

export type ConditionField = 'dayOfWeek' | 'shiftType' | 'employmentType' | 'timeOfDay' | 'publicHoliday';

export interface ConditionOption {
  value: string;
  label: string;
}

export const CONDITION_FIELDS: { field: ConditionField; label: string; type: 'multi-select' | 'boolean' | 'time-range'; options?: ConditionOption[] }[] = [
  {
    field: 'dayOfWeek',
    label: 'Day of Week',
    type: 'multi-select',
    options: [
      { value: 'mon', label: 'Monday' },
      { value: 'tue', label: 'Tuesday' },
      { value: 'wed', label: 'Wednesday' },
      { value: 'thu', label: 'Thursday' },
      { value: 'fri', label: 'Friday' },
      { value: 'sat', label: 'Saturday' },
      { value: 'sun', label: 'Sunday' },
    ],
  },
  {
    field: 'shiftType',
    label: 'Shift Type',
    type: 'multi-select',
    options: [
      { value: 'regular', label: 'Regular' },
      { value: 'on-call', label: 'On-Call / Standby' },
      { value: 'callback', label: 'Callback' },
      { value: 'recall', label: 'Recall' },
      { value: 'emergency', label: 'Emergency' },
      { value: 'sleepover', label: 'Sleepover' },
      { value: 'broken', label: 'Broken / Split' },
    ],
  },
  {
    field: 'employmentType',
    label: 'Employment Type',
    type: 'multi-select',
    options: [
      { value: 'full-time', label: 'Full-Time' },
      { value: 'part-time', label: 'Part-Time' },
      { value: 'casual', label: 'Casual' },
      { value: 'agency', label: 'Agency' },
    ],
  },
  {
    field: 'timeOfDay',
    label: 'Time of Day',
    type: 'multi-select',
    options: [
      { value: 'morning', label: 'Morning (6:00 AM – 12:00 PM)' },
      { value: 'afternoon', label: 'Afternoon (12:00 PM – 6:00 PM)' },
      { value: 'evening', label: 'Evening (6:00 PM – 10:00 PM)' },
      { value: 'night', label: 'Night (10:00 PM – 6:00 AM)' },
    ],
  },
  {
    field: 'publicHoliday',
    label: 'Public Holiday',
    type: 'boolean',
  },
];

export interface ConstraintCondition {
  id: string;
  field: ConditionField;
  values: string[]; // selected values for multi-select, ['true'/'false'] for boolean
}

export interface ConditionalRule {
  id: string;
  label: string; // e.g., "Weekend Override", "Night Shift Rule"
  enabled: boolean;
  conditions: ConstraintCondition[];
  // Override values when conditions match
  enforcement?: ConstraintEnforcement;
  satisfiability?: Satisfiability;
  weight?: number;
  priority?: number;
  parameterOverrides: Record<string, any>;
}

export interface ConstraintSetting {
  id: string;
  enforcement: ConstraintEnforcement;
  satisfiability: Satisfiability; // REQUIRED = hard blocker, PREFERRED = soft with priority
  weight: number; // 0-100, penalty weight for SOFT / PREFERRED
  priority: number; // 1-10, Timefold priority multiplier (1=highest 10×, 10=lowest 1×)
  parameters: Record<string, any>;
  locationOverrides: Record<string, LocationOverride>;
  conditionalRules: ConditionalRule[];
}

export interface LocationOverride {
  enforcement?: ConstraintEnforcement;
  satisfiability?: Satisfiability;
  weight?: number;
  priority?: number;
  parameters?: Record<string, any>;
}

// ============= Constraint Definitions (Static metadata) =============

export interface ConstraintDefinition {
  id: string;
  code: string;
  name: string;
  category: ConstraintCategory;
  defaultEnforcement: ConstraintEnforcement;
  defaultSatisfiability: Satisfiability;
  description: string;
  businessReason: string;
  example?: string;
  parameters: ParameterDefinition[];
  timefoldMapping?: string;
}

export interface ParameterDefinition {
  key: string;
  label: string;
  type: 'number' | 'select' | 'boolean' | 'text' | 'period' | 'days-multi';
  unit?: string;
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
  tooltip?: string;
  perContract?: boolean;
  group?: string; // visual grouping within parameters
}

export type ConstraintCategory =
  | 'coverage_staffing'
  | 'employee_matching'
  | 'work_limits'
  | 'shift_rules'
  | 'compliance'
  | 'cost_optimization'
  | 'fairness_preferences'
  | 'operational_quality';

export const constraintCategories: Record<ConstraintCategory, { label: string; description: string; icon: string }> = {
  coverage_staffing: {
    label: 'Coverage & Staffing',
    description: 'Ensure shifts are adequately staffed with required headcount',
    icon: 'Users',
  },
  employee_matching: {
    label: 'Employee Matching',
    description: 'Match employees to shifts based on roles, skills, and qualifications',
    icon: 'UserCheck',
  },
  work_limits: {
    label: 'Work Limits & Rest',
    description: 'Enforce maximum hours, rest periods, and consecutive day limits',
    icon: 'Clock',
  },
  shift_rules: {
    label: 'Shift Rules',
    description: 'Control shift duration, overlaps, and assignment locks',
    icon: 'Calendar',
  },
  compliance: {
    label: 'Award & Compliance',
    description: 'Ensure compliance with awards, employment types, and public holidays',
    icon: 'Shield',
  },
  cost_optimization: {
    label: 'Cost Optimization',
    description: 'Minimize overtime, penalty rates, and travel costs',
    icon: 'DollarSign',
  },
  fairness_preferences: {
    label: 'Fairness & Preferences',
    description: 'Balance workload distribution and respect employee preferences',
    icon: 'Scale',
  },
  operational_quality: {
    label: 'Operational Quality',
    description: 'Maintain continuity, team cohesion, and roster stability',
    icon: 'Target',
  },
};

// ============= All 40 Constraint Definitions (Fully Enriched) =============

export const CONSTRAINT_DEFINITIONS: ConstraintDefinition[] = [
  // ==================== HARD CONSTRAINTS ====================

  // --- Coverage & Staffing ---
  {
    id: 'H1', code: 'H1', name: 'Minimum staff per shift',
    category: 'coverage_staffing', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Compare assigned staff with the required staff count, either in total or for each role.',
    businessReason: 'Demand planning and shift requirements determine staffing needs separately. This default does not calculate demand or replace area ratios.',
    example: 'Example only: A shift needs 4 staff and has 3 assigned: it is short by 1.',
    parameters: [
      { key: 'minHeadcount', label: 'Default staff required per shift', type: 'number', defaultValue: 1, min: 1, max: 50, tooltip: 'Minimum employees per shift (overridden per shift template)' },
      { key: 'countStrategy', label: 'Count required staff', type: 'select', defaultValue: 'PER_ROLE', options: [{ value: 'PER_ROLE', label: 'Per Role' }, { value: 'TOTAL', label: 'Total Headcount' }] },
      { key: 'allowPartialCoverage', label: 'Allow Partial Coverage', type: 'boolean', defaultValue: false, tooltip: 'If true, partial coverage is penalised (soft) rather than blocked' },
    ],
    timefoldMapping: 'introduction',
  },
  {
    id: 'H20', code: 'H20', name: 'Maximum concurrent staff at a location',
    category: 'coverage_staffing', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Set an upper limit on staff working at the same location at the same time.',
    businessReason: 'This is a staff limit, not customer capacity or the demand-to-staff ratio.',
    example: 'Example only: A staff limit of 10 means 11 staff working at once would exceed the limit.',
    parameters: [
      { key: 'capacitySource', label: 'Capacity Source', type: 'select', defaultValue: 'LOCATION_SETTING', options: [{ value: 'LOCATION_SETTING', label: 'From Location Config' }, { value: 'MANUAL', label: 'Manual Override' }] },
      { key: 'manualCapacity', label: 'Manual Capacity', type: 'number', defaultValue: 50, min: 1, max: 500, tooltip: 'Staff limit, used only when the source is Manual Override; not customer capacity' },
      { key: 'includeSupernumerary', label: 'Count additional non-working staff', type: 'boolean', defaultValue: false, tooltip: 'Count non-working staff toward capacity' },
    ],
    timefoldMapping: 'shift-service-constraints/shift-assignments/shift-selection#concurrent_shift_rules',
  },
  {
    id: 'H15', code: 'H15', name: 'Supervisor coverage',
    category: 'coverage_staffing', defaultEnforcement: 'OFF', defaultSatisfiability: 'REQUIRED',
    description: 'Set how many supervisors must be included and which roles qualify.',
    businessReason: 'Supervisor coverage is part of the required team, not an automatic increase to total headcount.',
    example: 'Example only: If 1 supervisor is required, a fully staffed shift with no qualifying supervisor still falls short.',
    parameters: [
      { key: 'requireSupervisor', label: 'Require Supervisor', type: 'boolean', defaultValue: true },
      { key: 'minSupervisors', label: 'Min Supervisors', type: 'number', defaultValue: 1, min: 1, max: 5 },
      { key: 'supervisorRoles', label: 'Supervisor Roles', type: 'text', defaultValue: 'Supervisor, Team Lead, Senior', tooltip: 'Comma-separated role names that qualify' },
    ],
    timefoldMapping: 'shift-service-constraints/skills-and-risk-factors',
  },

  // --- Employee Matching ---
  {
    id: 'H2', code: 'H2', name: 'Required roles and qualifications',
    category: 'employee_matching', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Choose how staff roles and qualifications are compared with shift requirements.',
    businessReason: 'All required matches is the strict option. Any match and best fit do not establish that every mandatory qualification is held.',
    example: 'Example only: For a shift requiring two qualifications, All required matches expects both; Any match accepts one.',
    parameters: [
      { key: 'matchStrategy', label: 'Match Strategy', type: 'select', defaultValue: 'ALL', options: [{ value: 'ALL', label: 'All required matches' }, { value: 'ANY', label: 'Any one match' }, { value: 'BEST_FIT', label: 'Best fit (not all required)' }] },
      { key: 'penaltyPerMissingSkill', label: 'Penalty Per Missing Skill', type: 'number', defaultValue: 100, min: 0, max: 1000, tooltip: 'Solver penalty units per unmatched qualification' },
      { key: 'allowTemporaryExemption', label: 'Allow qualification exception', type: 'boolean', defaultValue: false, tooltip: 'Permit assignment during skill gap with elevated penalty' },
    ],
    timefoldMapping: 'shift-service-constraints/skills-and-risk-factors',
  },
  {
    id: 'H14', code: 'H14', name: 'Qualification expiry',
    category: 'employee_matching', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Set the expiry tolerance and how early a qualification should be flagged.',
    businessReason: 'An expiry tolerance is a proposed policy exception, not an extension of a qualification or permission to ignore a legal requirement.',
    example: 'Example only: With 0 days of expiry tolerance, an expired qualification fails the proposed check. A 30-day warning flags upcoming expiry.',
    parameters: [
      { key: 'gracePeriodDays', label: 'Expiry tolerance', type: 'number', unit: 'days', defaultValue: 0, min: 0, max: 90, tooltip: 'Days after expiry before blocking (0 = immediate)' },
      { key: 'warningPeriodDays', label: 'Warn before expiry', type: 'number', unit: 'days', defaultValue: 30, min: 0, max: 180, tooltip: 'Days before expiry to flag in alerts' },
      { key: 'blockOnWarning', label: 'Block before expiry warning ends', type: 'boolean', defaultValue: false, tooltip: 'Prevent assignment during warning period too' },
    ],
    timefoldMapping: 'shift-service-constraints/skills-and-risk-factors#assigning_employees_with_required_skills',
  },
  {
    id: 'H13', code: 'H13', name: 'Incompatible role combinations',
    category: 'employee_matching', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'List role combinations that one staff member should not perform within the selected period.',
    businessReason: 'This does not define which roles are incompatible; the pairs must be entered explicitly.',
    example: 'Example only: Supervisor:Reviewer means the same person should not perform both roles in the selected shift or day.',
    parameters: [
      { key: 'exclusionScope', label: 'Exclusion Scope', type: 'select', defaultValue: 'SAME_SHIFT', options: [{ value: 'SAME_SHIFT', label: 'Same Shift' }, { value: 'SAME_DAY', label: 'Same Day' }] },
      { key: 'exclusionPairs', label: 'Excluded Role Pairs', type: 'text', defaultValue: '', tooltip: 'Comma-separated pairs e.g. "Cook:Cleaner, Driver:Admin"' },
    ],
    timefoldMapping: 'employee-resource-constraints/shift-type-diversity/shift-tag-types',
  },
  {
    id: 'H18', code: 'H18', name: 'Mentor support for trainees',
    category: 'employee_matching', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Set mentor experience, trainee-to-mentor limits and whether the mentor must share the trainee’s role.',
    businessReason: 'A preference allows unsupported assignments in the proposed policy; use the appropriate required rule where supervision is mandatory.',
    example: 'Example only: A maximum of 2 trainees per mentor means a team with 3 trainees needs at least 2 qualifying mentors.',
    parameters: [
      { key: 'maxTraineesPerMentor', label: 'Max Trainees per Mentor', type: 'number', defaultValue: 2, min: 1, max: 5 },
      { key: 'mentorMinExperienceMonths', label: 'Mentor Min Experience', type: 'number', unit: 'months', defaultValue: 6, min: 1, max: 60 },
      { key: 'requireSameRole', label: 'Mentor Must Share Role', type: 'boolean', defaultValue: true },
    ],
    timefoldMapping: 'employee-resource-constraints/pairing-employees',
  },
  {
    id: 'H16', code: 'H16', name: 'Gender-based staffing policy',
    category: 'employee_matching', defaultEnforcement: 'OFF', defaultSatisfiability: 'REQUIRED',
    description: 'Describe a gender-based staffing requirement only where a documented lawful requirement applies.',
    businessReason: 'Do not assume a gender mix is a universal legal requirement. Review the policy before using personal characteristics in assignment decisions.',
    example: 'Example only: A ratio of 0.5 represents 50%; it does not establish that the requirement is lawful or suitable.',
    parameters: [
      { key: 'requireMixedGender', label: 'Require Mixed Gender', type: 'boolean', defaultValue: false },
      { key: 'minFemaleRatio', label: 'Min Female Ratio', type: 'number', defaultValue: 0, min: 0, max: 1, step: 0.1, tooltip: '0 = no requirement, 0.5 = at least 50%' },
      { key: 'minMaleRatio', label: 'Min Male Ratio', type: 'number', defaultValue: 0, min: 0, max: 1, step: 0.1 },
    ],
    timefoldMapping: 'shift-service-constraints/skills-and-risk-factors',
  },

  // --- Work Limits & Rest ---
  {
    id: 'H7', code: 'H7', name: 'Maximum working hours',
    category: 'work_limits', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Set upper work totals for each period.',
    businessReason: 'Use Contract templates for the applicable work limits; these independent values are not synchronised.',
    example: 'Example only: A weekly limit is a total across shifts, not the length of one shift.',
    parameters: [
      { key: 'maxDailyHours', label: 'Max Daily Hours', type: 'number', unit: 'hrs', defaultValue: 10, min: 4, max: 16, perContract: true },
      { key: 'maxWeeklyHours', label: 'Max Weekly Hours', type: 'number', unit: 'hrs', defaultValue: 38, min: 10, max: 60, perContract: true },
      { key: 'maxMonthlyHours', label: 'Max Monthly Hours', type: 'number', unit: 'hrs', defaultValue: 160, min: 40, max: 250, perContract: true },
      { key: 'period', label: 'Primary Period', type: 'select', defaultValue: 'WEEK', options: [{ value: 'DAY', label: 'Day' }, { value: 'WEEK', label: 'Week' }, { value: 'MONTH', label: 'Month' }, { value: 'SCHEDULE', label: 'Schedule' }] },
      { key: 'includeBreaks', label: 'Include Breaks in Calc', type: 'boolean', defaultValue: false, tooltip: 'Whether breaks count toward total worked hours' },
      { key: 'overtimeThresholdHours', label: 'Overtime Threshold', type: 'number', unit: 'hrs', defaultValue: 38, min: 0, max: 60, perContract: true, tooltip: 'Hours after which overtime rates apply' },
    ],
    timefoldMapping: 'employee-resource-constraints/work-limits/minutes-worked-per-period',
  },
  {
    id: 'H6', code: 'H6', name: 'Minimum rest between shifts',
    category: 'work_limits', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Set the gap between one shift ending and the next beginning.',
    businessReason: 'Use Contract templates for the applicable rest limits; travel deductions and reduced-rest exceptions require separate policy review.',
    example: 'Example only: A shift ending at 9:00 PM followed by one at 7:00 AM leaves 10 hours between shifts.',
    parameters: [
      { key: 'minRestHours', label: 'Min Rest Period', type: 'number', unit: 'hrs', defaultValue: 10, min: 6, max: 16, perContract: true },
      { key: 'includeTravel', label: 'Include Travel Time', type: 'boolean', defaultValue: false, tooltip: 'Deduct estimated travel from rest period' },
      { key: 'reducedRestAllowed', label: 'Allow Reduced Rest', type: 'boolean', defaultValue: false, tooltip: 'Permit shorter rest with penalty (e.g. 8hrs instead of 10)' },
      { key: 'reducedRestMinHours', label: 'Reduced Rest Minimum', type: 'number', unit: 'hrs', defaultValue: 8, min: 4, max: 12 },
    ],
    timefoldMapping: 'employee-resource-constraints/shift-rotations-and-patterns/minutes-between-shifts',
  },
  {
    id: 'H17', code: 'H17', name: 'Consecutive working days',
    category: 'work_limits', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Set how many days in a row staff may work.',
    businessReason: 'Use Contract templates for the applicable consecutive-day limit.',
    example: 'Example only: Six consecutive working days followed by a day off resets the sequence.',
    parameters: [
      { key: 'maxConsecutiveDays', label: 'Max Consecutive Days', type: 'number', unit: 'days', defaultValue: 6, min: 3, max: 14, perContract: true },
      { key: 'minDaysOffAfterMax', label: 'Min Days Off After Max', type: 'number', unit: 'days', defaultValue: 1, min: 1, max: 4 },
      { key: 'countPartDays', label: 'Count Partial Days', type: 'boolean', defaultValue: true, tooltip: 'Count short shifts (<4hrs) as a worked day' },
    ],
    timefoldMapping: 'employee-resource-constraints/work-limits/consecutive-days-worked',
  },

  // --- Shift Rules ---
  {
    id: 'H3', code: 'H3', name: 'Count each staff member once per shift',
    category: 'shift_rules', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Prevent the same person from filling more than one staffing slot in a shift.',
    businessReason: 'Allowing two roles for one person does not provide two people for coverage.',
    example: 'Example only: One person assigned twice still represents only one staff member.',
    parameters: [
      { key: 'allowSplitRoles', label: 'Allow Split Roles', type: 'boolean', defaultValue: false, tooltip: 'If true, same employee can fill two different roles in one shift' },
    ],
    timefoldMapping: 'user-guide/terminology',
  },
  {
    id: 'H4', code: 'H4', name: 'Overlapping shifts and handover gaps',
    category: 'shift_rules', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Compare shift time ranges and any additional gap required between shifts.',
    businessReason: 'A handover gap is distinct from the longer rest requirement in Contract templates.',
    example: 'Example only: A shift ending at 5:00 PM and another starting at 5:00 PM are adjacent, not overlapping; an extra gap would make this pairing unsuitable.',
    parameters: [
      { key: 'bufferMinutes', label: 'Buffer Between Shifts', type: 'number', unit: 'min', defaultValue: 0, min: 0, max: 60, tooltip: 'Extra gap required between back-to-back shifts' },
      { key: 'allowAdjacentShifts', label: 'Allow Adjacent Shifts', type: 'boolean', defaultValue: true, tooltip: 'Permit shifts that end exactly when next begins' },
    ],
    timefoldMapping: 'employee-resource-constraints/shift-rotations-and-patterns/overlapping-shifts',
  },
  {
    id: 'H5', code: 'H5', name: 'Leave and staff availability',
    category: 'shift_rules', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Choose whether approved leave and unavailable time prevent assignments, and whether preferred times receive extra priority.',
    businessReason: 'Unavailable time is a restriction; preferred time is a choice. They should not be treated as the same thing.',
    example: 'Example only: A staff member unavailable from 2:00 PM cannot cover an entire 9:00 AM – 5:00 PM shift.',
    parameters: [
      { key: 'respectLeave', label: 'Block During Leave', type: 'boolean', defaultValue: true },
      { key: 'respectUnavailable', label: 'Block During Unavailable', type: 'boolean', defaultValue: true },
      { key: 'respectPreferred', label: 'Prefer Available Windows', type: 'boolean', defaultValue: true, tooltip: 'Soft preference for employee-preferred times' },
      { key: 'preferenceWeight', label: 'Preference Weight', type: 'number', defaultValue: 50, min: 0, max: 100, tooltip: 'How strongly to prefer available vs just not-unavailable' },
    ],
    timefoldMapping: 'employee-resource-constraints/employee-availability',
  },
  {
    id: 'H8', code: 'H8', name: 'Protect locked assignments',
    category: 'shift_rules', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Specify which locked details are protected and whether unavailability is a reason to reconsider the lock.',
    businessReason: 'A lock does not make an unavailable person eligible. The notification option here does not send notifications.',
    example: 'Example only: Assignment only protects the assigned person; Entire shift also describes protection for the shift itself.',
    parameters: [
      { key: 'allowOverrideOnUnavailable', label: 'Override if Unavailable', type: 'boolean', defaultValue: true },
      { key: 'lockScope', label: 'Lock Scope', type: 'select', defaultValue: 'ASSIGNMENT', options: [{ value: 'ASSIGNMENT', label: 'Assignment Only' }, { value: 'SHIFT', label: 'Entire Shift' }] },
      { key: 'notifyOnOverride', label: 'Notify on Override', type: 'boolean', defaultValue: true },
    ],
    timefoldMapping: 'manual-intervention',
  },
  {
    id: 'H11', code: 'H11', name: 'Minimum shift duration',
    category: 'shift_rules', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Set the shortest planned shift, including a separate value for casual staff.',
    businessReason: 'Planned shift duration and minimum payable engagement are different. These fields do not calculate minimum engagement pay.',
    example: 'Example only: A planned 2-hour shift is below a 3-hour duration target; payroll entitlements must still be checked separately.',
    parameters: [
      { key: 'minShiftHours', label: 'Min Shift Duration', type: 'number', unit: 'hrs', defaultValue: 3, min: 1, max: 8, perContract: true },
      { key: 'casualMinHours', label: 'Casual Min Hours', type: 'number', unit: 'hrs', defaultValue: 3, min: 1, max: 8, tooltip: 'Separate minimum for casual employees' },
    ],
    timefoldMapping: 'employee-resource-constraints/employee-contracts',
  },
  {
    id: 'H12', code: 'H12', name: 'Maximum shift duration',
    category: 'shift_rules', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Set the longest planned shift and an optional extended-shift limit.',
    businessReason: 'An extended limit is not manager approval and does not set penalty pay or replace an award limit.',
    example: 'Example only: A 13-hour shift exceeds a 12-hour standard limit even if an extended limit is configured.',
    parameters: [
      { key: 'maxShiftHours', label: 'Max Shift Duration', type: 'number', unit: 'hrs', defaultValue: 12, min: 6, max: 16, perContract: true },
      { key: 'extendedShiftAllowed', label: 'Allow Extended Shifts', type: 'boolean', defaultValue: false, tooltip: 'Describe an extended duration exception; does not approve shifts or calculate penalty pay' },
      { key: 'extendedMaxHours', label: 'Extended Max', type: 'number', unit: 'hrs', defaultValue: 16, min: 8, max: 24 },
    ],
    timefoldMapping: 'employee-resource-constraints/employee-contracts',
  },

  // --- Award & Compliance ---
  {
    id: 'H9', code: 'H9', name: 'Award compatibility policy',
    category: 'compliance', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Describe whether staff and shift award classifications should match.',
    businessReason: 'Award coverage depends on the applicable employment conditions. A cross-award option does not change a staff member’s award or pay.',
    example: 'Example only: Matching an award label alone does not prove that the classification or pay rate is correct.',
    parameters: [
      { key: 'strictAwardMatch', label: 'Strict Award Match', type: 'boolean', defaultValue: true },
      { key: 'allowCrossAward', label: 'Allow Cross-Award', type: 'boolean', defaultValue: false, tooltip: 'Permit assignment to shifts under a different award with penalty' },
      { key: 'crossAwardPenalty', label: 'Cross-Award Penalty', type: 'number', defaultValue: 500, min: 0, max: 1000 },
    ],
    timefoldMapping: 'employee-resource-constraints/shift-type-diversity/shift-tag-types',
  },
  {
    id: 'H10', code: 'H10', name: 'Employment type selection order',
    category: 'compliance', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Set the preferred order for permanent, casual and agency staff.',
    businessReason: 'These options describe assignment preferences, not employment entitlements or guaranteed contracted hours.',
    example: 'Example only: After permanent staff means consider eligible permanent staff first; it does not make an unavailable person eligible.',
    parameters: [
      { key: 'preferPermanentFirst', label: 'Prefer Permanent First', type: 'boolean', defaultValue: true, tooltip: 'Fill with FT/PT before casuals/agency' },
      { key: 'casualFillOrder', label: 'Casual Fill Priority', type: 'select', defaultValue: 'AFTER_PERMANENT', options: [{ value: 'AFTER_PERMANENT', label: 'After Permanent Staff' }, { value: 'EQUAL', label: 'Equal Priority' }, { value: 'LAST_RESORT', label: 'Last Resort Only' }] },
      { key: 'agencyFillOrder', label: 'Agency Fill Priority', type: 'select', defaultValue: 'LAST_RESORT', options: [{ value: 'AFTER_PERMANENT', label: 'After Permanent' }, { value: 'AFTER_CASUAL', label: 'After Casual' }, { value: 'LAST_RESORT', label: 'Last Resort Only' }] },
    ],
    timefoldMapping: 'employee-resource-constraints/employee-contracts',
  },
  {
    id: 'H19', code: 'H19', name: 'Public holiday assignment policy',
    category: 'compliance', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Describe eligibility, voluntary acceptance and a monthly holiday-shift limit.',
    businessReason: 'Holiday entitlements and actual pay come from Awards and Pay Conditions. The cost multiplier here is an estimate only.',
    example: 'Example only: A voluntary-acceptance requirement describes an opt-in policy; this screen does not collect staff acceptance.',
    parameters: [
      { key: 'blockNonEligible', label: 'Block Non-Eligible', type: 'boolean', defaultValue: true },
      { key: 'requireVoluntary', label: 'Require Voluntary Acceptance', type: 'boolean', defaultValue: false, tooltip: 'Only roster employees who opted in' },
      { key: 'maxHolidayShiftsPerMonth', label: 'Max Holiday Shifts/Month', type: 'number', defaultValue: 4, min: 0, max: 10, tooltip: 'Cap per employee per month' },
      { key: 'penaltyRateMultiplier', label: 'Penalty Rate Multiplier', type: 'number', defaultValue: 2.5, min: 1, max: 4, step: 0.25, tooltip: 'Cost multiplier for holiday shifts' },
    ],
    timefoldMapping: 'employee-resource-constraints/employee-contracts',
  },

  // ==================== SOFT CONSTRAINTS ====================

  // --- Coverage & Staffing ---
  {
    id: 'S2', code: 'S2', name: 'Prioritise shifts with no staff',
    category: 'coverage_staffing', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Give extra importance to shifts with no assigned staff.',
    businessReason: 'This is a coverage preference, separate from the minimum staffing requirement.',
    example: 'Example only: A shift with 0 of 4 required staff is empty; a shift with 1 of 4 is partially filled.',
    parameters: [
      { key: 'emptyShiftPenalty', label: 'Empty Shift Penalty', type: 'number', defaultValue: 500, min: 0, max: 1000, tooltip: 'Solver penalty units for completely empty shifts' },
      { key: 'escalateToHard', label: 'Escalate to Hard if Mandatory', type: 'boolean', defaultValue: true, tooltip: 'Treat as hard constraint if shift is flagged mandatory' },
    ],
    timefoldMapping: 'shift-service-constraints/mandatory-and-optional-shifts',
  },
  {
    id: 'S3', code: 'S3', name: 'Reduce partially filled shifts',
    category: 'coverage_staffing', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Describe how strongly to prioritise missing staff and the fill percentage below which a penalty is proposed.',
    businessReason: 'The fill threshold is a preference, not a reduction to required staff.',
    example: 'Example only: With 3 of 4 staff assigned, coverage is 75%, below an 80% fill target.',
    parameters: [
      { key: 'penaltyPerMissing', label: 'Penalty Per Missing', type: 'number', defaultValue: 100, min: 0, max: 500, tooltip: 'Penalty per missing employee vs required' },
      { key: 'minFillPercentage', label: 'Min Fill %', type: 'number', unit: '%', defaultValue: 80, min: 0, max: 100, tooltip: 'Below this % triggers penalty' },
    ],
    timefoldMapping: 'shift-service-constraints/mandatory-and-optional-shifts',
  },
  {
    id: 'S4', code: 'S4', name: 'Prefer fully staffed shifts',
    category: 'coverage_staffing', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Give extra preference to shifts that reach their required staff count.',
    businessReason: 'A reward is a scheduling score, not a payment. Extra staff should remain within capacity and budget.',
    example: 'Example only: A shift needing 4 staff is fully staffed with 4 assigned; buffer staff are optional additional staff.',
    parameters: [
      { key: 'rewardPerComplete', label: 'Reward Per Complete', type: 'number', defaultValue: 50, min: 0, max: 500, tooltip: 'Solver bonus for 100% filled shifts' },
      { key: 'bonusForOverstaffed', label: 'Bonus for Buffer Staff', type: 'boolean', defaultValue: false },
    ],
  },
  {
    id: 'S5', code: 'S5', name: 'Staff utilisation target',
    category: 'coverage_staffing', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Set a target for use of available staff capacity.',
    businessReason: 'The available-capacity basis is not defined by this screen. This is not a guarantee of hours or permission to exceed work limits.',
    example: 'Example only: An 85% target describes a preference to use 85% of available capacity once that capacity is defined.',
    parameters: [
      { key: 'targetUtilisation', label: 'Target Utilisation', type: 'number', unit: '%', defaultValue: 85, min: 50, max: 100, tooltip: 'Optimal employee utilisation percentage' },
      { key: 'utilizationPenaltyPerPercent', label: 'Penalty Per % Below', type: 'number', defaultValue: 5, min: 0, max: 50 },
    ],
    timefoldMapping: 'employee-resource-constraints/employee-activation#maximize_activated_employee_saturation',
  },

  // --- Cost Optimization ---
  {
    id: 'S6', code: 'S6', name: 'Prefer less overtime',
    category: 'cost_optimization', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Set preferences for avoiding and distributing overtime.',
    businessReason: 'Overtime eligibility, thresholds and rates remain in Awards and Pay Conditions; a preferred weekly target is not a hard work limit.',
    example: 'Example only: Prefer an eligible person within ordinary hours over one who would incur overtime, where coverage allows.',
    parameters: [
      { key: 'overtimePenaltyPerHour', label: 'Penalty Per OT Hour', type: 'number', defaultValue: 200, min: 0, max: 1000, tooltip: 'Solver penalty per overtime hour' },
      { key: 'doubleTimePenalty', label: 'Double Time Penalty', type: 'number', defaultValue: 400, min: 0, max: 2000, tooltip: 'Extra penalty for double-time hours' },
      { key: 'maxOvertimeHoursPerWeek', label: 'Max OT Hours/Week', type: 'number', unit: 'hrs', defaultValue: 10, min: 0, max: 30, perContract: true },
      { key: 'spreadOvertimeEvenly', label: 'Spread OT Evenly', type: 'boolean', defaultValue: true, tooltip: 'Distribute overtime across staff rather than concentrating' },
    ],
    timefoldMapping: 'employee-resource-constraints/work-limits/shifts-worked-per-period#managing_overtime',
  },
  {
    id: 'S9', code: 'S9', name: 'Prefer lower estimated labour cost',
    category: 'cost_optimization', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Set cost-comparison preferences and weekend cost estimates.',
    businessReason: 'Multipliers here are planning assumptions, not published award rates or payroll overrides.',
    example: 'Example only: A Saturday multiplier of 1.5 describes an estimated cost of 1.5 times the base; actual award pay may differ.',
    parameters: [
      { key: 'penaltyRateWeight', label: 'Penalty Rate Weight', type: 'number', defaultValue: 60, min: 0, max: 100, tooltip: 'How aggressively to avoid penalty rate assignments' },
      { key: 'preferRegularOverCasual', label: 'Prefer Regular Over Casual', type: 'boolean', defaultValue: true, tooltip: 'Casual loading adds cost — prefer permanent' },
      { key: 'saturdayMultiplier', label: 'Saturday Cost Multiplier', type: 'number', defaultValue: 1.5, min: 1, max: 3, step: 0.25 },
      { key: 'sundayMultiplier', label: 'Sunday Cost Multiplier', type: 'number', defaultValue: 2.0, min: 1, max: 3, step: 0.25 },
    ],
    timefoldMapping: 'shift-service-constraints/cost-management/cost-management',
  },
  {
    id: 'S13', code: 'S13', name: 'Prefer shorter travel',
    category: 'cost_optimization', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Set travel distance, estimated travel time and location-count targets.',
    businessReason: 'The journey origin and distance source are not defined by these fields. Estimated travel is not a travel allowance.',
    example: 'Example only: At 1.5 minutes per kilometre, 20 kilometres represents 30 minutes of estimated travel.',
    parameters: [
      { key: 'maxTravelKm', label: 'Max Travel Distance', type: 'number', unit: 'km', defaultValue: 50, min: 5, max: 200 },
      { key: 'penaltyPerKm', label: 'Penalty Per km', type: 'number', defaultValue: 2, min: 0, max: 20, tooltip: 'Solver penalty per km of travel' },
      { key: 'travelTimeMinutesPerKm', label: 'Travel Time', type: 'number', unit: 'min/km', defaultValue: 1.5, min: 0.5, max: 5, step: 0.5 },
      { key: 'maxLocationsPerWeek', label: 'Max Locations/Week', type: 'number', defaultValue: 3, min: 1, max: 10 },
    ],
    timefoldMapping: 'employee-resource-constraints/shift-travel-and-locations',
  },
  {
    id: 'S1', code: 'S1', name: 'Prefer home location and area',
    category: 'cost_optimization', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Give extra preference to assignments at the staff member’s home location or an existing location and area.',
    businessReason: 'This expresses a preference; it does not change permitted location assignments.',
    example: 'Example only: Prefer a suitable person’s home location over another permitted location when other requirements can still be met.',
    parameters: [
      { key: 'sameLocationBonus', label: 'Same Location Bonus', type: 'number', defaultValue: 100, min: 0, max: 500 },
      { key: 'sameAreaBonus', label: 'Same Area Bonus', type: 'number', defaultValue: 50, min: 0, max: 500 },
      { key: 'homeLocationPreferred', label: 'Prefer Home Location', type: 'boolean', defaultValue: true },
    ],
    timefoldMapping: 'employee-resource-constraints/shift-travel-and-locations',
  },

  // --- Fairness & Preferences ---
  {
    id: 'S7', code: 'S7', name: 'Balance hours and shift counts',
    category: 'fairness_preferences', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Choose whether to compare staff by hours, shift counts or both, optionally within each role.',
    businessReason: 'Equal shift counts can still mean unequal hours. These comparisons do not automatically account for different contracted hours.',
    example: 'Example only: Two staff with 4 shifts each may work different totals if their shift lengths differ.',
    parameters: [
      { key: 'fairnessMetric', label: 'Fairness Metric', type: 'select', defaultValue: 'HOURS', options: [{ value: 'HOURS', label: 'Total Hours' }, { value: 'SHIFT_COUNT', label: 'Shift Count' }, { value: 'BOTH', label: 'Both' }] },
      { key: 'maxDeviationPercent', label: 'Max Deviation', type: 'number', unit: '%', defaultValue: 15, min: 5, max: 50, tooltip: 'Max allowed deviation from mean before penalty' },
      { key: 'fairnessWeight', label: 'Fairness Weight', type: 'number', defaultValue: 60, min: 0, max: 100 },
      { key: 'groupByRole', label: 'Group by Role', type: 'boolean', defaultValue: true, tooltip: 'Compare fairness within same role group' },
    ],
    timefoldMapping: 'employee-resource-constraints/container-fairness/fairness',
  },
  {
    id: 'S10', code: 'S10', name: 'Share weekend and night work',
    category: 'fairness_preferences', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Set targets for weekend and night assignments and define the time used to count night work.',
    businessReason: 'These are fairness targets, not payroll definitions of night work or automatic contract limits.',
    example: 'Example only: With a night-work boundary of 6:00 PM, shifts starting after that boundary count toward this proposed night-work target.',
    parameters: [
      { key: 'maxWeekendsPerMonth', label: 'Max Weekends/Month', type: 'number', defaultValue: 2, min: 0, max: 5, perContract: true },
      { key: 'maxConsecutiveWeekends', label: 'Max Consecutive Weekends', type: 'number', defaultValue: 2, min: 0, max: 4 },
      { key: 'maxNightShiftsPerWeek', label: 'Max Nights/Week', type: 'number', defaultValue: 3, min: 0, max: 7 },
      { key: 'nightShiftStartAfter', label: 'Count night work starting after', type: 'text', defaultValue: '18:00', tooltip: 'Shifts starting after this time count as night' },
      { key: 'weekendDefinition', label: 'Weekend Days', type: 'select', defaultValue: 'SAT_SUN', options: [{ value: 'SAT_SUN', label: 'Sat-Sun' }, { value: 'FRI_SAT', label: 'Fri-Sat' }, { value: 'FRI_SAT_SUN', label: 'Fri-Sun' }] },
    ],
    timefoldMapping: 'employee-resource-constraints/work-limits/weekends-worked-per-period',
  },
  {
    id: 'S11', code: 'S11', name: 'Prefer staff-requested days and times',
    category: 'fairness_preferences', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Give extra preference to requested times and less preference to unwanted times.',
    businessReason: 'Preferences do not replace approved leave or unavailable time. The staff-input option here does not open a submission process.',
    example: 'Example only: A request for Monday is a preference; approved leave on Monday remains a separate restriction.',
    parameters: [
      { key: 'preferenceWeight', label: 'Preference Weight', type: 'number', defaultValue: 50, min: 0, max: 100, tooltip: 'How strongly to honour preferences vs other constraints' },
      { key: 'preferredDayBonus', label: 'Preferred Day Bonus', type: 'number', defaultValue: 30, min: 0, max: 200 },
      { key: 'unpreferredDayPenalty', label: 'Unpreferred Day Penalty', type: 'number', defaultValue: 50, min: 0, max: 200 },
      { key: 'allowPreferenceSubmission', label: 'Allow Employee Input', type: 'boolean', defaultValue: true },
    ],
    timefoldMapping: 'employee-resource-constraints/employee-availability#employee_preferred_times',
  },
  {
    id: 'S17', code: 'S17', name: 'Aim for contracted hours',
    category: 'fairness_preferences', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Describe how close scheduled hours should stay to the staff member’s contracted target.',
    businessReason: 'This is a target, not the maximum work limit. The Manual option currently has no target-hours input in this editor.',
    example: 'Example only: For a 30-hour target, a 10% tolerance represents 27–33 scheduled hours.',
    parameters: [
      { key: 'targetHoursSource', label: 'Target Hours', type: 'select', defaultValue: 'CONTRACT', options: [{ value: 'CONTRACT', label: 'From Contract' }, { value: 'MANUAL', label: 'Manual' }] },
      { key: 'tolerancePercent', label: 'Tolerance', type: 'number', unit: '%', defaultValue: 10, min: 0, max: 30, tooltip: 'Acceptable deviation from target before penalty' },
      { key: 'underschedulePenalty', label: 'Under-Schedule Penalty', type: 'number', defaultValue: 30, min: 0, max: 200 },
      { key: 'overschedulePenalty', label: 'Over-Schedule Penalty', type: 'number', defaultValue: 50, min: 0, max: 200 },
    ],
    timefoldMapping: 'employee-resource-constraints/work-limits/work-limits',
  },
  {
    id: 'S15', code: 'S15', name: 'Prefer fewer split shifts',
    category: 'fairness_preferences', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Set targets for split shifts and the gap used to count separated work as a split.',
    businessReason: 'This does not determine split-shift allowances or minimum engagements.',
    example: 'Example only: Two work periods separated by a 2-hour gap meet a proposed 2-hour split-gap threshold.',
    parameters: [
      { key: 'splitShiftPenalty', label: 'Split Shift Penalty', type: 'number', defaultValue: 150, min: 0, max: 500, tooltip: 'Penalty for assigning split shifts' },
      { key: 'maxSplitsPerWeek', label: 'Max Splits/Week', type: 'number', defaultValue: 2, min: 0, max: 7 },
      { key: 'minGapForSplit', label: 'Min Gap to Count as Split', type: 'number', unit: 'hrs', defaultValue: 2, min: 1, max: 6 },
    ],
  },

  // --- Operational Quality ---
  {
    id: 'S8', code: 'S8', name: 'Prefer keeping existing assignments',
    category: 'operational_quality', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Describe how strongly to retain assigned staff and the proposed reassignment and locking targets.',
    businessReason: 'Keeping an assignment is a preference, unlike an explicit lock. The auto-lock field here does not create locks.',
    example: 'Example only: An existing assignment may be reconsidered for availability or coverage; a lock is managed separately.',
    parameters: [
      { key: 'preservationWeight', label: 'Preservation Weight', type: 'number', defaultValue: 80, min: 0, max: 100, tooltip: 'How strongly to keep existing assignments' },
      { key: 'maxReassignments', label: 'Max Reassignments', type: 'number', defaultValue: 5, min: 0, max: 50, tooltip: 'Max shifts solver can reassign per run' },
      { key: 'lockAfterDays', label: 'Proposed lock lead time', type: 'number', unit: 'days', defaultValue: 3, min: 0, max: 14, tooltip: 'Proposed number of days before a shift to lock assignments; no locks are created here' },
    ],
    timefoldMapping: 'real-time-planning-preview#minimizing_disruption_due_to_real_time_planning',
  },
  {
    id: 'S12', code: 'S12', name: 'Prefer staff familiar with a location',
    category: 'operational_quality', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Define familiarity using previous assignments within a chosen history period.',
    businessReason: 'Familiarity is based on the proposed visit count, not a qualification or guaranteed assignment.',
    example: 'Example only: With 3 visits in a 90-day history period, a person would meet a 3-visit familiarity target.',
    parameters: [
      { key: 'familiarityBonus', label: 'Familiarity Bonus', type: 'number', defaultValue: 80, min: 0, max: 500, tooltip: 'Reward for assigning familiar staff' },
      { key: 'familiarityLookbackDays', label: 'Lookback Period', type: 'number', unit: 'days', defaultValue: 90, min: 7, max: 365, tooltip: 'How far back to check assignment history' },
      { key: 'minVisitsForFamiliar', label: 'Min Visits for Familiar', type: 'number', defaultValue: 3, min: 1, max: 20 },
    ],
    timefoldMapping: 'shift-service-constraints/shift-assignments/employee-selection#preferred_employee',
  },
  {
    id: 'S14', code: 'S14', name: 'Maintain staff continuity',
    category: 'operational_quality', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Prefer a smaller, familiar group of staff at the same location over time.',
    businessReason: 'Continuity concerns the recurring team; familiarity concerns one person’s previous assignments.',
    example: 'Example only: A target of 3 different staff per week favours a recurring group rather than a different person every day.',
    parameters: [
      { key: 'continuityBonus', label: 'Continuity Bonus', type: 'number', defaultValue: 100, min: 0, max: 500 },
      { key: 'maxDifferentStaffPerWeek', label: 'Max Different Staff/Week', type: 'number', defaultValue: 3, min: 1, max: 20, tooltip: 'Per client/location' },
      { key: 'continuityLookbackDays', label: 'Lookback Period', type: 'number', unit: 'days', defaultValue: 14, min: 7, max: 90 },
    ],
    timefoldMapping: 'shift-service-constraints/shift-assignments/employee-selection#preferred_employee',
  },
  {
    id: 'S16', code: 'S16', name: 'Reduce changes to the roster',
    category: 'operational_quality', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Describe targets for reassignment changes over a chosen period.',
    businessReason: 'This is a stability preference, not a lock on published or manually assigned shifts.',
    example: 'Example only: A 7-day window describes the period over which reassignment changes would be compared.',
    parameters: [
      { key: 'reassignmentPenalty', label: 'Reassignment Penalty', type: 'number', defaultValue: 50, min: 0, max: 500, tooltip: 'Penalty per reassignment from previous version' },
      { key: 'volatilityWindow', label: 'Volatility Window', type: 'number', unit: 'days', defaultValue: 7, min: 1, max: 28, tooltip: 'Period over which to measure changes' },
      { key: 'maxChangesPerWindow', label: 'Max Changes/Window', type: 'number', defaultValue: 10, min: 0, max: 100 },
    ],
    timefoldMapping: 'real-time-planning-preview#minimizing_disruption_due_to_real_time_planning',
  },
  {
    id: 'S18', code: 'S18', name: 'Prefer established teams',
    category: 'operational_quality', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Describe the desired overlap with a regular team using a chosen history period.',
    businessReason: 'This screen does not define regular team membership. A team preference never establishes qualification eligibility.',
    example: 'Example only: A 50% overlap target means half the assigned team should belong to the regular team once membership is defined.',
    parameters: [
      { key: 'teamCohesionBonus', label: 'Team Cohesion Bonus', type: 'number', defaultValue: 60, min: 0, max: 500 },
      { key: 'minTeamOverlap', label: 'Min Team Overlap', type: 'number', unit: '%', defaultValue: 50, min: 0, max: 100, tooltip: 'Min % of regular team members on shift' },
      { key: 'teamHistoryDays', label: 'Team History Window', type: 'number', unit: 'days', defaultValue: 30, min: 7, max: 180 },
    ],
    timefoldMapping: 'employee-resource-constraints/pairing-employees',
  },
  {
    id: 'S19', code: 'S19', name: 'Prefer keeping manager edits',
    category: 'operational_quality', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Give extra preference to preserving recent manual assignment changes.',
    businessReason: 'This overlaps with keeping existing assignments but focuses on recent manager edits. It does not create a hard lock.',
    example: 'Example only: A 48-hour protection preference describes recent edits made within that period, not a guarantee they cannot change.',
    parameters: [
      { key: 'overrideRespectWeight', label: 'Override Respect Weight', type: 'number', defaultValue: 90, min: 0, max: 100 },
      { key: 'protectManualChanges', label: 'Protect Manual Changes', type: 'boolean', defaultValue: true },
      { key: 'protectionWindowHours', label: 'Protection Window', type: 'number', unit: 'hrs', defaultValue: 48, min: 0, max: 168, tooltip: 'Hours after manual change during which solver respects it' },
    ],
    timefoldMapping: 'real-time-planning-preview#minimizing_disruption_due_to_real_time_planning',
  },
  {
    id: 'S20', code: 'S20', name: 'Team composition preference',
    category: 'operational_quality', defaultEnforcement: 'OFF', defaultSatisfiability: 'PREFERRED',
    description: 'Describe an optional team-composition goal.',
    businessReason: 'The grouping and measurement basis are not defined here. Review lawful, appropriate use of personal characteristics before applying any such policy.',
    example: 'Example only: An experience-mix preference is different from a mandatory skill or qualification requirement.',
    parameters: [
      { key: 'diversityMetric', label: 'Diversity Metric', type: 'select', defaultValue: 'GENDER', options: [{ value: 'GENDER', label: 'Gender Balance' }, { value: 'AGE', label: 'Age Diversity' }, { value: 'EXPERIENCE', label: 'Experience Mix' }, { value: 'ALL', label: 'All Metrics' }] },
      { key: 'diversityWeight', label: 'Diversity Weight', type: 'number', defaultValue: 30, min: 0, max: 100 },
      { key: 'targetRatio', label: 'Target Balance Ratio', type: 'number', defaultValue: 0.5, min: 0, max: 1, step: 0.1 },
    ],
  },
];

// ============= Default Configuration State =============

export interface SchedulingConstraintsConfig {
  scope: ConstraintScope;
  activeLocationId: string | null;
  constraints: Record<string, ConstraintSetting>;
}

export function createDefaultConstraintsConfig(): SchedulingConstraintsConfig {
  const constraints: Record<string, ConstraintSetting> = {};
  
  CONSTRAINT_DEFINITIONS.forEach(def => {
    const params: Record<string, any> = {};
    def.parameters.forEach(p => { params[p.key] = p.defaultValue; });
    
    constraints[def.id] = {
      id: def.id,
      enforcement: def.defaultEnforcement,
      satisfiability: def.defaultSatisfiability,
      weight: 50,
      priority: def.defaultEnforcement === 'HARD' ? 1 : 5,
      parameters: params,
      locationOverrides: {},
      conditionalRules: [],
    };
  });

  return { scope: 'business', activeLocationId: null, constraints };
}

// ============= Helpers =============

export function getConstraintsByCategory(category: ConstraintCategory): ConstraintDefinition[] {
  return CONSTRAINT_DEFINITIONS.filter(c => c.category === category);
}

export function getHardConstraints(): ConstraintDefinition[] {
  return CONSTRAINT_DEFINITIONS.filter(c => c.code.startsWith('H'));
}

export function getSoftConstraints(): ConstraintDefinition[] {
  return CONSTRAINT_DEFINITIONS.filter(c => c.code.startsWith('S'));
}

export function getEffectiveSetting(
  setting: ConstraintSetting,
  locationId: string | null,
): { enforcement: ConstraintEnforcement; satisfiability: Satisfiability; weight: number; priority: number; parameters: Record<string, any> } {
  if (!locationId || !setting.locationOverrides[locationId]) {
    return { enforcement: setting.enforcement, satisfiability: setting.satisfiability, weight: setting.weight, priority: setting.priority, parameters: setting.parameters };
  }
  const override = setting.locationOverrides[locationId];
  return {
    enforcement: override.enforcement ?? setting.enforcement,
    satisfiability: override.satisfiability ?? setting.satisfiability,
    weight: override.weight ?? setting.weight,
    priority: override.priority ?? setting.priority,
    parameters: { ...setting.parameters, ...(override.parameters ?? {}) },
  };
}
