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
      { value: 'morning', label: 'Morning (6am–12pm)' },
      { value: 'afternoon', label: 'Afternoon (12pm–6pm)' },
      { value: 'evening', label: 'Evening (6pm–10pm)' },
      { value: 'night', label: 'Night (10pm–6am)' },
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
    id: 'H1', code: 'H1', name: 'Required Employee Coverage',
    category: 'coverage_staffing', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Each shift must meet minimum required headcount per role & qualification',
    businessReason: 'Understaffed shifts are illegal / unsafe',
    parameters: [
      { key: 'minHeadcount', label: 'Default Min Headcount', type: 'number', defaultValue: 1, min: 1, max: 50, tooltip: 'Minimum employees per shift (overridden per shift template)' },
      { key: 'countStrategy', label: 'Count Strategy', type: 'select', defaultValue: 'PER_ROLE', options: [{ value: 'PER_ROLE', label: 'Per Role' }, { value: 'TOTAL', label: 'Total Headcount' }] },
      { key: 'allowPartialCoverage', label: 'Allow Partial Coverage', type: 'boolean', defaultValue: false, tooltip: 'If true, partial coverage is penalised (soft) rather than blocked' },
    ],
    timefoldMapping: 'introduction',
  },
  {
    id: 'H20', code: 'H20', name: 'Location Capacity',
    category: 'coverage_staffing', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Assigned staff count must not exceed location capacity',
    businessReason: 'Physical space & safety',
    parameters: [
      { key: 'capacitySource', label: 'Capacity Source', type: 'select', defaultValue: 'LOCATION_SETTING', options: [{ value: 'LOCATION_SETTING', label: 'From Location Config' }, { value: 'MANUAL', label: 'Manual Override' }] },
      { key: 'manualCapacity', label: 'Manual Capacity', type: 'number', defaultValue: 50, min: 1, max: 500, tooltip: 'Only used when source is Manual Override' },
      { key: 'includeSupernumerary', label: 'Include Supernumerary', type: 'boolean', defaultValue: false, tooltip: 'Count non-working staff toward capacity' },
    ],
    timefoldMapping: 'shift-service-constraints/shift-assignments/shift-selection#concurrent_shift_rules',
  },
  {
    id: 'H15', code: 'H15', name: 'Supervisor / Senior Coverage',
    category: 'coverage_staffing', defaultEnforcement: 'OFF', defaultSatisfiability: 'REQUIRED',
    description: 'Shift must include at least one senior/supervisor where required',
    businessReason: 'Regulatory & operational',
    parameters: [
      { key: 'requireSupervisor', label: 'Require Supervisor', type: 'boolean', defaultValue: true },
      { key: 'minSupervisors', label: 'Min Supervisors', type: 'number', defaultValue: 1, min: 1, max: 5 },
      { key: 'supervisorRoles', label: 'Supervisor Roles', type: 'text', defaultValue: 'Supervisor, Team Lead, Senior', tooltip: 'Comma-separated role names that qualify' },
    ],
    timefoldMapping: 'shift-service-constraints/skills-and-risk-factors',
  },

  // --- Employee Matching ---
  {
    id: 'H2', code: 'H2', name: 'Role & Qualification Match',
    category: 'employee_matching', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Assigned employee must possess required role AND all mandatory qualifications',
    businessReason: 'Award & safety compliance',
    parameters: [
      { key: 'matchStrategy', label: 'Match Strategy', type: 'select', defaultValue: 'ALL', options: [{ value: 'ALL', label: 'All Required' }, { value: 'ANY', label: 'Any Match' }, { value: 'BEST_FIT', label: 'Best Fit Score' }] },
      { key: 'penaltyPerMissingSkill', label: 'Penalty Per Missing Skill', type: 'number', defaultValue: 100, min: 0, max: 1000, tooltip: 'Solver penalty units per unmatched qualification' },
      { key: 'allowTemporaryExemption', label: 'Allow Temp Exemption', type: 'boolean', defaultValue: false, tooltip: 'Permit assignment during skill gap with elevated penalty' },
    ],
    timefoldMapping: 'shift-service-constraints/skills-and-risk-factors',
  },
  {
    id: 'H14', code: 'H14', name: 'Qualification Validity (Expiry)',
    category: 'employee_matching', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Qualification must be valid on shift date',
    businessReason: 'Regulatory compliance',
    parameters: [
      { key: 'gracePeriodDays', label: 'Grace Period', type: 'number', unit: 'days', defaultValue: 0, min: 0, max: 90, tooltip: 'Days after expiry before blocking (0 = immediate)' },
      { key: 'warningPeriodDays', label: 'Warning Period', type: 'number', unit: 'days', defaultValue: 30, min: 0, max: 180, tooltip: 'Days before expiry to flag in alerts' },
      { key: 'blockOnWarning', label: 'Block on Warning', type: 'boolean', defaultValue: false, tooltip: 'Prevent assignment during warning period too' },
    ],
    timefoldMapping: 'shift-service-constraints/skills-and-risk-factors#assigning_employees_with_required_skills',
  },
  {
    id: 'H13', code: 'H13', name: 'Role Exclusivity',
    category: 'employee_matching', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Employee cannot perform incompatible roles in the same shift',
    businessReason: 'Safety & governance',
    parameters: [
      { key: 'exclusionScope', label: 'Exclusion Scope', type: 'select', defaultValue: 'SAME_SHIFT', options: [{ value: 'SAME_SHIFT', label: 'Same Shift' }, { value: 'SAME_DAY', label: 'Same Day' }] },
      { key: 'exclusionPairs', label: 'Excluded Role Pairs', type: 'text', defaultValue: '', tooltip: 'Comma-separated pairs e.g. "Cook:Cleaner, Driver:Admin"' },
    ],
    timefoldMapping: 'employee-resource-constraints/shift-type-diversity/shift-tag-types',
  },
  {
    id: 'H18', code: 'H18', name: 'Training / Shadow Requirement',
    category: 'employee_matching', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Trainee must be paired with qualified mentor',
    businessReason: 'Onboarding & safety',
    parameters: [
      { key: 'maxTraineesPerMentor', label: 'Max Trainees per Mentor', type: 'number', defaultValue: 2, min: 1, max: 5 },
      { key: 'mentorMinExperienceMonths', label: 'Mentor Min Experience', type: 'number', unit: 'months', defaultValue: 6, min: 1, max: 60 },
      { key: 'requireSameRole', label: 'Mentor Must Share Role', type: 'boolean', defaultValue: true },
    ],
    timefoldMapping: 'employee-resource-constraints/pairing-employees',
  },
  {
    id: 'H16', code: 'H16', name: 'Gender / Compliance Staffing',
    category: 'employee_matching', defaultEnforcement: 'OFF', defaultSatisfiability: 'REQUIRED',
    description: 'Shift must meet gender or diversity staffing mandates',
    businessReason: 'Legal & care compliance',
    parameters: [
      { key: 'requireMixedGender', label: 'Require Mixed Gender', type: 'boolean', defaultValue: false },
      { key: 'minFemaleRatio', label: 'Min Female Ratio', type: 'number', defaultValue: 0, min: 0, max: 1, step: 0.1, tooltip: '0 = no requirement, 0.5 = at least 50%' },
      { key: 'minMaleRatio', label: 'Min Male Ratio', type: 'number', defaultValue: 0, min: 0, max: 1, step: 0.1 },
    ],
    timefoldMapping: 'shift-service-constraints/skills-and-risk-factors',
  },

  // --- Work Limits & Rest ---
  {
    id: 'H7', code: 'H7', name: 'Maximum Working Hours',
    category: 'work_limits', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Employee total hours must not exceed daily/weekly limits',
    businessReason: 'Award & labour law',
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
    id: 'H6', code: 'H6', name: 'Minimum Rest Between Shifts',
    category: 'work_limits', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Rest gap between consecutive shifts ≥ award-defined minimum',
    businessReason: 'Fatigue & award compliance',
    parameters: [
      { key: 'minRestHours', label: 'Min Rest Period', type: 'number', unit: 'hrs', defaultValue: 10, min: 6, max: 16, perContract: true },
      { key: 'includeTravel', label: 'Include Travel Time', type: 'boolean', defaultValue: false, tooltip: 'Deduct estimated travel from rest period' },
      { key: 'reducedRestAllowed', label: 'Allow Reduced Rest', type: 'boolean', defaultValue: false, tooltip: 'Permit shorter rest with penalty (e.g. 8hrs instead of 10)' },
      { key: 'reducedRestMinHours', label: 'Reduced Rest Minimum', type: 'number', unit: 'hrs', defaultValue: 8, min: 4, max: 12 },
    ],
    timefoldMapping: 'employee-resource-constraints/shift-rotations-and-patterns/minutes-between-shifts',
  },
  {
    id: 'H17', code: 'H17', name: 'Consecutive Working Days Limit',
    category: 'work_limits', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Employee cannot exceed max consecutive working days',
    businessReason: 'Fatigue management',
    parameters: [
      { key: 'maxConsecutiveDays', label: 'Max Consecutive Days', type: 'number', unit: 'days', defaultValue: 6, min: 3, max: 14, perContract: true },
      { key: 'minDaysOffAfterMax', label: 'Min Days Off After Max', type: 'number', unit: 'days', defaultValue: 1, min: 1, max: 4 },
      { key: 'countPartDays', label: 'Count Partial Days', type: 'boolean', defaultValue: true, tooltip: 'Count short shifts (<4hrs) as a worked day' },
    ],
    timefoldMapping: 'employee-resource-constraints/work-limits/consecutive-days-worked',
  },

  // --- Shift Rules ---
  {
    id: 'H3', code: 'H3', name: 'No Duplicate Employee in Shift',
    category: 'shift_rules', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Same employee cannot be assigned more than once to the same shift',
    businessReason: 'Data integrity',
    parameters: [
      { key: 'allowSplitRoles', label: 'Allow Split Roles', type: 'boolean', defaultValue: false, tooltip: 'If true, same employee can fill two different roles in one shift' },
    ],
    timefoldMapping: 'user-guide/terminology',
  },
  {
    id: 'H4', code: 'H4', name: 'No Overlapping Shifts',
    category: 'shift_rules', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Employee cannot be assigned to overlapping time ranges',
    businessReason: 'Physical impossibility',
    parameters: [
      { key: 'bufferMinutes', label: 'Buffer Between Shifts', type: 'number', unit: 'min', defaultValue: 0, min: 0, max: 60, tooltip: 'Extra gap required between back-to-back shifts' },
      { key: 'allowAdjacentShifts', label: 'Allow Adjacent Shifts', type: 'boolean', defaultValue: true, tooltip: 'Permit shifts that end exactly when next begins' },
    ],
    timefoldMapping: 'employee-resource-constraints/shift-rotations-and-patterns/overlapping-shifts',
  },
  {
    id: 'H5', code: 'H5', name: 'Employee Availability Compliance',
    category: 'shift_rules', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Employee must be available for entire shift duration',
    businessReason: 'Approved leave & availability',
    parameters: [
      { key: 'respectLeave', label: 'Block During Leave', type: 'boolean', defaultValue: true },
      { key: 'respectUnavailable', label: 'Block During Unavailable', type: 'boolean', defaultValue: true },
      { key: 'respectPreferred', label: 'Prefer Available Windows', type: 'boolean', defaultValue: true, tooltip: 'Soft preference for employee-preferred times' },
      { key: 'preferenceWeight', label: 'Preference Weight', type: 'number', defaultValue: 50, min: 0, max: 100, tooltip: 'How strongly to prefer available vs just not-unavailable' },
    ],
    timefoldMapping: 'employee-resource-constraints/employee-availability',
  },
  {
    id: 'H8', code: 'H8', name: 'Immutable Pre-Assignments (Locked)',
    category: 'shift_rules', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Locked assignments cannot be changed unless employee becomes unavailable',
    businessReason: 'Managerial override protection',
    parameters: [
      { key: 'allowOverrideOnUnavailable', label: 'Override if Unavailable', type: 'boolean', defaultValue: true },
      { key: 'lockScope', label: 'Lock Scope', type: 'select', defaultValue: 'ASSIGNMENT', options: [{ value: 'ASSIGNMENT', label: 'Assignment Only' }, { value: 'SHIFT', label: 'Entire Shift' }] },
      { key: 'notifyOnOverride', label: 'Notify on Override', type: 'boolean', defaultValue: true },
    ],
    timefoldMapping: 'manual-intervention',
  },
  {
    id: 'H11', code: 'H11', name: 'Minimum Shift Length',
    category: 'shift_rules', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Shift duration must be ≥ award minimum',
    businessReason: 'Minimum payable hours',
    parameters: [
      { key: 'minShiftHours', label: 'Min Shift Duration', type: 'number', unit: 'hrs', defaultValue: 3, min: 1, max: 8, perContract: true },
      { key: 'casualMinHours', label: 'Casual Min Hours', type: 'number', unit: 'hrs', defaultValue: 3, min: 1, max: 8, tooltip: 'Separate minimum for casual employees' },
    ],
    timefoldMapping: 'employee-resource-constraints/employee-contracts',
  },
  {
    id: 'H12', code: 'H12', name: 'Maximum Shift Length',
    category: 'shift_rules', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Shift duration must not exceed award maximum',
    businessReason: 'Safety & fatigue',
    parameters: [
      { key: 'maxShiftHours', label: 'Max Shift Duration', type: 'number', unit: 'hrs', defaultValue: 12, min: 6, max: 16, perContract: true },
      { key: 'extendedShiftAllowed', label: 'Allow Extended Shifts', type: 'boolean', defaultValue: false, tooltip: 'Permit longer shifts with penalty rate and approval' },
      { key: 'extendedMaxHours', label: 'Extended Max', type: 'number', unit: 'hrs', defaultValue: 16, min: 8, max: 24 },
    ],
    timefoldMapping: 'employee-resource-constraints/employee-contracts',
  },

  // --- Award & Compliance ---
  {
    id: 'H9', code: 'H9', name: 'Award Applicability',
    category: 'compliance', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Employee can only work shifts governed by their assigned award',
    businessReason: 'Legal employment classification',
    parameters: [
      { key: 'strictAwardMatch', label: 'Strict Award Match', type: 'boolean', defaultValue: true },
      { key: 'allowCrossAward', label: 'Allow Cross-Award', type: 'boolean', defaultValue: false, tooltip: 'Permit assignment to shifts under a different award with penalty' },
      { key: 'crossAwardPenalty', label: 'Cross-Award Penalty', type: 'number', defaultValue: 500, min: 0, max: 1000 },
    ],
    timefoldMapping: 'employee-resource-constraints/shift-type-diversity/shift-tag-types',
  },
  {
    id: 'H10', code: 'H10', name: 'Employment Type Compliance',
    category: 'compliance', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Shift assignment must respect full-time/part-time/casual rules',
    businessReason: 'Contractual rules',
    parameters: [
      { key: 'preferPermanentFirst', label: 'Prefer Permanent First', type: 'boolean', defaultValue: true, tooltip: 'Fill with FT/PT before casuals/agency' },
      { key: 'casualFillOrder', label: 'Casual Fill Priority', type: 'select', defaultValue: 'AFTER_PERMANENT', options: [{ value: 'AFTER_PERMANENT', label: 'After Permanent Staff' }, { value: 'EQUAL', label: 'Equal Priority' }, { value: 'LAST_RESORT', label: 'Last Resort Only' }] },
      { key: 'agencyFillOrder', label: 'Agency Fill Priority', type: 'select', defaultValue: 'LAST_RESORT', options: [{ value: 'AFTER_PERMANENT', label: 'After Permanent' }, { value: 'AFTER_CASUAL', label: 'After Casual' }, { value: 'LAST_RESORT', label: 'Last Resort Only' }] },
    ],
    timefoldMapping: 'employee-resource-constraints/employee-contracts',
  },
  {
    id: 'H19', code: 'H19', name: 'Public Holiday Eligibility',
    category: 'compliance', defaultEnforcement: 'HARD', defaultSatisfiability: 'REQUIRED',
    description: 'Only eligible employees may be rostered on public holidays',
    businessReason: 'Award rules',
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
    id: 'S2', code: 'S2', name: 'Penalise Empty Shifts',
    category: 'coverage_staffing', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Strongly penalise shifts with zero assigned employees',
    businessReason: 'Visibility of staffing gaps',
    parameters: [
      { key: 'emptyShiftPenalty', label: 'Empty Shift Penalty', type: 'number', defaultValue: 500, min: 0, max: 1000, tooltip: 'Solver penalty units for completely empty shifts' },
      { key: 'escalateToHard', label: 'Escalate to Hard if Mandatory', type: 'boolean', defaultValue: true, tooltip: 'Treat as hard constraint if shift is flagged mandatory' },
    ],
    timefoldMapping: 'shift-service-constraints/mandatory-and-optional-shifts',
  },
  {
    id: 'S3', code: 'S3', name: 'Penalise Incomplete Shifts',
    category: 'coverage_staffing', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Penalise partially filled shifts',
    businessReason: 'Improve coverage quality',
    parameters: [
      { key: 'penaltyPerMissing', label: 'Penalty Per Missing', type: 'number', defaultValue: 100, min: 0, max: 500, tooltip: 'Penalty per missing employee vs required' },
      { key: 'minFillPercentage', label: 'Min Fill %', type: 'number', unit: '%', defaultValue: 80, min: 0, max: 100, tooltip: 'Below this % triggers penalty' },
    ],
    timefoldMapping: 'shift-service-constraints/mandatory-and-optional-shifts',
  },
  {
    id: 'S4', code: 'S4', name: 'Reward Complete Shift Coverage',
    category: 'coverage_staffing', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Reward shifts that meet full coverage',
    businessReason: 'Operational excellence',
    parameters: [
      { key: 'rewardPerComplete', label: 'Reward Per Complete', type: 'number', defaultValue: 50, min: 0, max: 500, tooltip: 'Solver bonus for 100% filled shifts' },
      { key: 'bonusForOverstaffed', label: 'Bonus for Buffer Staff', type: 'boolean', defaultValue: false },
    ],
  },
  {
    id: 'S5', code: 'S5', name: 'Reward Employee Utilisation',
    category: 'coverage_staffing', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Reward valid employee assignments within limits',
    businessReason: 'Workforce efficiency',
    parameters: [
      { key: 'targetUtilisation', label: 'Target Utilisation', type: 'number', unit: '%', defaultValue: 85, min: 50, max: 100, tooltip: 'Optimal employee utilisation percentage' },
      { key: 'utilizationPenaltyPerPercent', label: 'Penalty Per % Below', type: 'number', defaultValue: 5, min: 0, max: 50 },
    ],
    timefoldMapping: 'employee-resource-constraints/employee-activation#maximize_activated_employee_saturation',
  },

  // --- Cost Optimization ---
  {
    id: 'S6', code: 'S6', name: 'Minimise Overtime Exposure',
    category: 'cost_optimization', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Penalise assignments causing overtime',
    businessReason: 'Cost control',
    parameters: [
      { key: 'overtimePenaltyPerHour', label: 'Penalty Per OT Hour', type: 'number', defaultValue: 200, min: 0, max: 1000, tooltip: 'Solver penalty per overtime hour' },
      { key: 'doubleTimePenalty', label: 'Double Time Penalty', type: 'number', defaultValue: 400, min: 0, max: 2000, tooltip: 'Extra penalty for double-time hours' },
      { key: 'maxOvertimeHoursPerWeek', label: 'Max OT Hours/Week', type: 'number', unit: 'hrs', defaultValue: 10, min: 0, max: 30, perContract: true },
      { key: 'spreadOvertimeEvenly', label: 'Spread OT Evenly', type: 'boolean', defaultValue: true, tooltip: 'Distribute overtime across staff rather than concentrating' },
    ],
    timefoldMapping: 'employee-resource-constraints/work-limits/shifts-worked-per-period#managing_overtime',
  },
  {
    id: 'S9', code: 'S9', name: 'Minimise Penalty Rates',
    category: 'cost_optimization', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Prefer lower penalty cost assignments',
    businessReason: 'Wage optimisation',
    parameters: [
      { key: 'penaltyRateWeight', label: 'Penalty Rate Weight', type: 'number', defaultValue: 60, min: 0, max: 100, tooltip: 'How aggressively to avoid penalty rate assignments' },
      { key: 'preferRegularOverCasual', label: 'Prefer Regular Over Casual', type: 'boolean', defaultValue: true, tooltip: 'Casual loading adds cost — prefer permanent' },
      { key: 'saturdayMultiplier', label: 'Saturday Cost Multiplier', type: 'number', defaultValue: 1.5, min: 1, max: 3, step: 0.25 },
      { key: 'sundayMultiplier', label: 'Sunday Cost Multiplier', type: 'number', defaultValue: 2.0, min: 1, max: 3, step: 0.25 },
    ],
    timefoldMapping: 'shift-service-constraints/cost-management/cost-management',
  },
  {
    id: 'S13', code: 'S13', name: 'Minimise Travel Distance',
    category: 'cost_optimization', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Prefer closer locations',
    businessReason: 'Cost & fatigue',
    parameters: [
      { key: 'maxTravelKm', label: 'Max Travel Distance', type: 'number', unit: 'km', defaultValue: 50, min: 5, max: 200 },
      { key: 'penaltyPerKm', label: 'Penalty Per km', type: 'number', defaultValue: 2, min: 0, max: 20, tooltip: 'Solver penalty per km of travel' },
      { key: 'travelTimeMinutesPerKm', label: 'Travel Time', type: 'number', unit: 'min/km', defaultValue: 1.5, min: 0.5, max: 5, step: 0.5 },
      { key: 'maxLocationsPerWeek', label: 'Max Locations/Week', type: 'number', defaultValue: 3, min: 1, max: 10 },
    ],
    timefoldMapping: 'employee-resource-constraints/shift-travel-and-locations',
  },
  {
    id: 'S1', code: 'S1', name: 'Location & Area Preference',
    category: 'cost_optimization', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Prefer same location/area assignments (tiered scoring)',
    businessReason: 'Reduce travel & improve efficiency',
    parameters: [
      { key: 'sameLocationBonus', label: 'Same Location Bonus', type: 'number', defaultValue: 100, min: 0, max: 500 },
      { key: 'sameAreaBonus', label: 'Same Area Bonus', type: 'number', defaultValue: 50, min: 0, max: 500 },
      { key: 'homeLocationPreferred', label: 'Prefer Home Location', type: 'boolean', defaultValue: true },
    ],
    timefoldMapping: 'employee-resource-constraints/shift-travel-and-locations',
  },

  // --- Fairness & Preferences ---
  {
    id: 'S7', code: 'S7', name: 'Fair Distribution of Shifts',
    category: 'fairness_preferences', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Minimise variance in shift distribution',
    businessReason: 'Employee morale',
    parameters: [
      { key: 'fairnessMetric', label: 'Fairness Metric', type: 'select', defaultValue: 'HOURS', options: [{ value: 'HOURS', label: 'Total Hours' }, { value: 'SHIFT_COUNT', label: 'Shift Count' }, { value: 'BOTH', label: 'Both' }] },
      { key: 'maxDeviationPercent', label: 'Max Deviation', type: 'number', unit: '%', defaultValue: 15, min: 5, max: 50, tooltip: 'Max allowed deviation from mean before penalty' },
      { key: 'fairnessWeight', label: 'Fairness Weight', type: 'number', defaultValue: 60, min: 0, max: 100 },
      { key: 'groupByRole', label: 'Group by Role', type: 'boolean', defaultValue: true, tooltip: 'Compare fairness within same role group' },
    ],
    timefoldMapping: 'employee-resource-constraints/container-fairness/fairness',
  },
  {
    id: 'S10', code: 'S10', name: 'Weekend / Night Shift Fairness',
    category: 'fairness_preferences', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Distribute undesirable shifts evenly',
    businessReason: 'Retention',
    parameters: [
      { key: 'maxWeekendsPerMonth', label: 'Max Weekends/Month', type: 'number', defaultValue: 2, min: 0, max: 5, perContract: true },
      { key: 'maxConsecutiveWeekends', label: 'Max Consecutive Weekends', type: 'number', defaultValue: 2, min: 0, max: 4 },
      { key: 'maxNightShiftsPerWeek', label: 'Max Nights/Week', type: 'number', defaultValue: 3, min: 0, max: 7 },
      { key: 'nightShiftStartAfter', label: 'Night Shift After', type: 'text', defaultValue: '18:00', tooltip: 'Shifts starting after this time count as night' },
      { key: 'weekendDefinition', label: 'Weekend Days', type: 'select', defaultValue: 'SAT_SUN', options: [{ value: 'SAT_SUN', label: 'Sat-Sun' }, { value: 'FRI_SAT', label: 'Fri-Sat' }, { value: 'FRI_SAT_SUN', label: 'Fri-Sun' }] },
    ],
    timefoldMapping: 'employee-resource-constraints/work-limits/weekends-worked-per-period',
  },
  {
    id: 'S11', code: 'S11', name: 'Employee Shift Preferences',
    category: 'fairness_preferences', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Prefer employee-preferred days/times',
    businessReason: 'Engagement',
    parameters: [
      { key: 'preferenceWeight', label: 'Preference Weight', type: 'number', defaultValue: 50, min: 0, max: 100, tooltip: 'How strongly to honour preferences vs other constraints' },
      { key: 'preferredDayBonus', label: 'Preferred Day Bonus', type: 'number', defaultValue: 30, min: 0, max: 200 },
      { key: 'unpreferredDayPenalty', label: 'Unpreferred Day Penalty', type: 'number', defaultValue: 50, min: 0, max: 200 },
      { key: 'allowPreferenceSubmission', label: 'Allow Employee Input', type: 'boolean', defaultValue: true },
    ],
    timefoldMapping: 'employee-resource-constraints/employee-availability#employee_preferred_times',
  },
  {
    id: 'S17', code: 'S17', name: 'Respect Contracted Hours',
    category: 'fairness_preferences', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Prefer employees close to contracted hours',
    businessReason: 'Predictability',
    parameters: [
      { key: 'targetHoursSource', label: 'Target Hours', type: 'select', defaultValue: 'CONTRACT', options: [{ value: 'CONTRACT', label: 'From Contract' }, { value: 'MANUAL', label: 'Manual' }] },
      { key: 'tolerancePercent', label: 'Tolerance', type: 'number', unit: '%', defaultValue: 10, min: 0, max: 30, tooltip: 'Acceptable deviation from target before penalty' },
      { key: 'underschedulePenalty', label: 'Under-Schedule Penalty', type: 'number', defaultValue: 30, min: 0, max: 200 },
      { key: 'overschedulePenalty', label: 'Over-Schedule Penalty', type: 'number', defaultValue: 50, min: 0, max: 200 },
    ],
    timefoldMapping: 'employee-resource-constraints/work-limits/work-limits',
  },
  {
    id: 'S15', code: 'S15', name: 'Avoid Split Shifts',
    category: 'fairness_preferences', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Penalise fragmented daily schedules',
    businessReason: 'Employee satisfaction',
    parameters: [
      { key: 'splitShiftPenalty', label: 'Split Shift Penalty', type: 'number', defaultValue: 150, min: 0, max: 500, tooltip: 'Penalty for assigning split shifts' },
      { key: 'maxSplitsPerWeek', label: 'Max Splits/Week', type: 'number', defaultValue: 2, min: 0, max: 7 },
      { key: 'minGapForSplit', label: 'Min Gap to Count as Split', type: 'number', unit: 'hrs', defaultValue: 2, min: 1, max: 6 },
    ],
  },

  // --- Operational Quality ---
  {
    id: 'S8', code: 'S8', name: 'Preserve Pre-Assignments',
    category: 'operational_quality', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Prefer retaining manually assigned employees',
    businessReason: 'Trust & stability',
    parameters: [
      { key: 'preservationWeight', label: 'Preservation Weight', type: 'number', defaultValue: 80, min: 0, max: 100, tooltip: 'How strongly to keep existing assignments' },
      { key: 'maxReassignments', label: 'Max Reassignments', type: 'number', defaultValue: 5, min: 0, max: 50, tooltip: 'Max shifts solver can reassign per run' },
      { key: 'lockAfterDays', label: 'Auto-Lock After', type: 'number', unit: 'days', defaultValue: 3, min: 0, max: 14, tooltip: 'Days before shift start when assignments auto-lock' },
    ],
    timefoldMapping: 'real-time-planning-preview#minimizing_disruption_due_to_real_time_planning',
  },
  {
    id: 'S12', code: 'S12', name: 'Client-Specific Staff Preference',
    category: 'operational_quality', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Prefer employees familiar with client/site',
    businessReason: 'Client satisfaction',
    parameters: [
      { key: 'familiarityBonus', label: 'Familiarity Bonus', type: 'number', defaultValue: 80, min: 0, max: 500, tooltip: 'Reward for assigning familiar staff' },
      { key: 'familiarityLookbackDays', label: 'Lookback Period', type: 'number', unit: 'days', defaultValue: 90, min: 7, max: 365, tooltip: 'How far back to check assignment history' },
      { key: 'minVisitsForFamiliar', label: 'Min Visits for Familiar', type: 'number', defaultValue: 3, min: 1, max: 20 },
    ],
    timefoldMapping: 'shift-service-constraints/shift-assignments/employee-selection#preferred_employee',
  },
  {
    id: 'S14', code: 'S14', name: 'Continuity of Care / Service',
    category: 'operational_quality', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Prefer same staff for same client/location',
    businessReason: 'Quality & compliance',
    parameters: [
      { key: 'continuityBonus', label: 'Continuity Bonus', type: 'number', defaultValue: 100, min: 0, max: 500 },
      { key: 'maxDifferentStaffPerWeek', label: 'Max Different Staff/Week', type: 'number', defaultValue: 3, min: 1, max: 20, tooltip: 'Per client/location' },
      { key: 'continuityLookbackDays', label: 'Lookback Period', type: 'number', unit: 'days', defaultValue: 14, min: 7, max: 90 },
    ],
    timefoldMapping: 'shift-service-constraints/shift-assignments/employee-selection#preferred_employee',
  },
  {
    id: 'S16', code: 'S16', name: 'Reduce Roster Volatility',
    category: 'operational_quality', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Penalise frequent reassignments',
    businessReason: 'Operational stability',
    parameters: [
      { key: 'reassignmentPenalty', label: 'Reassignment Penalty', type: 'number', defaultValue: 50, min: 0, max: 500, tooltip: 'Penalty per reassignment from previous version' },
      { key: 'volatilityWindow', label: 'Volatility Window', type: 'number', unit: 'days', defaultValue: 7, min: 1, max: 28, tooltip: 'Period over which to measure changes' },
      { key: 'maxChangesPerWindow', label: 'Max Changes/Window', type: 'number', defaultValue: 10, min: 0, max: 100 },
    ],
    timefoldMapping: 'real-time-planning-preview#minimizing_disruption_due_to_real_time_planning',
  },
  {
    id: 'S18', code: 'S18', name: 'Team Cohesion',
    category: 'operational_quality', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Prefer assigning known teams together',
    businessReason: 'Productivity',
    parameters: [
      { key: 'teamCohesionBonus', label: 'Team Cohesion Bonus', type: 'number', defaultValue: 60, min: 0, max: 500 },
      { key: 'minTeamOverlap', label: 'Min Team Overlap', type: 'number', unit: '%', defaultValue: 50, min: 0, max: 100, tooltip: 'Min % of regular team members on shift' },
      { key: 'teamHistoryDays', label: 'Team History Window', type: 'number', unit: 'days', defaultValue: 30, min: 7, max: 180 },
    ],
    timefoldMapping: 'employee-resource-constraints/pairing-employees',
  },
  {
    id: 'S19', code: 'S19', name: 'Managerial Override Respect',
    category: 'operational_quality', defaultEnforcement: 'SOFT', defaultSatisfiability: 'PREFERRED',
    description: 'Penalise solver changes to curated rosters',
    businessReason: 'Human trust',
    parameters: [
      { key: 'overrideRespectWeight', label: 'Override Respect Weight', type: 'number', defaultValue: 90, min: 0, max: 100 },
      { key: 'protectManualChanges', label: 'Protect Manual Changes', type: 'boolean', defaultValue: true },
      { key: 'protectionWindowHours', label: 'Protection Window', type: 'number', unit: 'hrs', defaultValue: 48, min: 0, max: 168, tooltip: 'Hours after manual change during which solver respects it' },
    ],
    timefoldMapping: 'real-time-planning-preview#minimizing_disruption_due_to_real_time_planning',
  },
  {
    id: 'S20', code: 'S20', name: 'Workforce Diversity Balance',
    category: 'operational_quality', defaultEnforcement: 'OFF', defaultSatisfiability: 'PREFERRED',
    description: 'Encourage balanced team composition',
    businessReason: 'Policy & ESG goals',
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
