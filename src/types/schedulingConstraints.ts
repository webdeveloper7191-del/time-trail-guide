/**
 * Scheduling Constraints Configuration
 * Maps H1-H20 (Hard) and S1-S20 (Soft) constraints from the business requirements
 * Each constraint supports business-wide defaults with location-level overrides
 */

// ============= Core Types =============

export type ConstraintEnforcement = 'HARD' | 'SOFT' | 'OFF';
export type ConstraintScope = 'business' | 'location';

export interface ConstraintSetting {
  id: string;
  enforcement: ConstraintEnforcement;
  weight: number; // 0-100, only relevant for SOFT
  parameters: Record<string, any>;
  locationOverrides: Record<string, LocationOverride>; // locationId -> override
}

export interface LocationOverride {
  enforcement?: ConstraintEnforcement;
  weight?: number;
  parameters?: Record<string, any>;
}

// ============= Constraint Definitions (Static metadata) =============

export interface ConstraintDefinition {
  id: string;
  code: string; // H1, H2, S1 etc.
  name: string;
  category: ConstraintCategory;
  defaultEnforcement: ConstraintEnforcement;
  description: string;
  businessReason: string;
  parameters: ParameterDefinition[];
  timefoldMapping?: string; // Timefold docs reference
}

export interface ParameterDefinition {
  key: string;
  label: string;
  type: 'number' | 'select' | 'boolean' | 'text';
  unit?: string;
  defaultValue: any;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  tooltip?: string;
  perContract?: boolean; // If true, value can differ per employment type
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

// ============= All 40 Constraint Definitions =============

export const CONSTRAINT_DEFINITIONS: ConstraintDefinition[] = [
  // ==================== HARD CONSTRAINTS ====================

  // --- Coverage & Staffing ---
  {
    id: 'H1', code: 'H1', name: 'Required Employee Coverage',
    category: 'coverage_staffing', defaultEnforcement: 'HARD',
    description: 'Each shift must meet minimum required headcount per role & qualification',
    businessReason: 'Understaffed shifts are illegal / unsafe',
    parameters: [],
    timefoldMapping: 'introduction',
  },
  {
    id: 'H20', code: 'H20', name: 'Location Capacity',
    category: 'coverage_staffing', defaultEnforcement: 'HARD',
    description: 'Assigned staff count must not exceed location capacity',
    businessReason: 'Physical space & safety',
    parameters: [],
    timefoldMapping: 'shift-service-constraints/shift-assignments/shift-selection#concurrent_shift_rules',
  },
  {
    id: 'H15', code: 'H15', name: 'Supervisor / Senior Coverage',
    category: 'coverage_staffing', defaultEnforcement: 'OFF',
    description: 'Shift must include at least one senior/supervisor where required',
    businessReason: 'Regulatory & operational',
    parameters: [
      { key: 'requireSupervisor', label: 'Require Supervisor', type: 'boolean', defaultValue: true },
    ],
    timefoldMapping: 'shift-service-constraints/skills-and-risk-factors',
  },

  // --- Employee Matching ---
  {
    id: 'H2', code: 'H2', name: 'Role & Qualification Match',
    category: 'employee_matching', defaultEnforcement: 'HARD',
    description: 'Assigned employee must possess required role AND all mandatory qualifications',
    businessReason: 'Award & safety compliance',
    parameters: [
      { key: 'matchStrategy', label: 'Match Strategy', type: 'select', defaultValue: 'ALL', options: [{ value: 'ALL', label: 'All Required' }, { value: 'ANY', label: 'Any Match' }] },
    ],
    timefoldMapping: 'shift-service-constraints/skills-and-risk-factors',
  },
  {
    id: 'H14', code: 'H14', name: 'Qualification Validity (Expiry)',
    category: 'employee_matching', defaultEnforcement: 'HARD',
    description: 'Qualification must be valid on shift date',
    businessReason: 'Regulatory compliance',
    parameters: [
      { key: 'gracePeriodDays', label: 'Grace Period', type: 'number', unit: 'days', defaultValue: 0, min: 0, max: 30, tooltip: 'Days after expiry before blocking (0 = immediate block)' },
    ],
    timefoldMapping: 'shift-service-constraints/skills-and-risk-factors#assigning_employees_with_required_skills',
  },
  {
    id: 'H13', code: 'H13', name: 'Role Exclusivity',
    category: 'employee_matching', defaultEnforcement: 'HARD',
    description: 'Employee cannot perform incompatible roles in the same shift',
    businessReason: 'Safety & governance',
    parameters: [],
    timefoldMapping: 'employee-resource-constraints/shift-type-diversity/shift-tag-types',
  },
  {
    id: 'H18', code: 'H18', name: 'Training / Shadow Requirement',
    category: 'employee_matching', defaultEnforcement: 'SOFT',
    description: 'Trainee must be paired with qualified mentor',
    businessReason: 'Onboarding & safety',
    parameters: [
      { key: 'maxTraineesPerMentor', label: 'Max Trainees per Mentor', type: 'number', defaultValue: 2, min: 1, max: 5 },
    ],
    timefoldMapping: 'employee-resource-constraints/pairing-employees',
  },
  {
    id: 'H16', code: 'H16', name: 'Gender / Compliance Staffing',
    category: 'employee_matching', defaultEnforcement: 'OFF',
    description: 'Shift must meet gender or diversity staffing mandates',
    businessReason: 'Legal & care compliance',
    parameters: [],
    timefoldMapping: 'shift-service-constraints/skills-and-risk-factors',
  },

  // --- Work Limits & Rest ---
  {
    id: 'H7', code: 'H7', name: 'Maximum Working Hours',
    category: 'work_limits', defaultEnforcement: 'HARD',
    description: 'Employee total hours must not exceed daily/weekly limits',
    businessReason: 'Award & labour law',
    parameters: [
      { key: 'maxDailyHours', label: 'Max Daily Hours', type: 'number', unit: 'hrs', defaultValue: 10, min: 4, max: 16, perContract: true },
      { key: 'maxWeeklyHours', label: 'Max Weekly Hours', type: 'number', unit: 'hrs', defaultValue: 38, min: 10, max: 60, perContract: true },
    ],
    timefoldMapping: 'employee-resource-constraints/work-limits/minutes-worked-per-period',
  },
  {
    id: 'H6', code: 'H6', name: 'Minimum Rest Between Shifts',
    category: 'work_limits', defaultEnforcement: 'HARD',
    description: 'Rest gap between consecutive shifts ≥ award-defined minimum',
    businessReason: 'Fatigue & award compliance',
    parameters: [
      { key: 'minRestHours', label: 'Min Rest Period', type: 'number', unit: 'hrs', defaultValue: 10, min: 6, max: 16, perContract: true },
    ],
    timefoldMapping: 'employee-resource-constraints/shift-rotations-and-patterns/minutes-between-shifts',
  },
  {
    id: 'H17', code: 'H17', name: 'Consecutive Working Days Limit',
    category: 'work_limits', defaultEnforcement: 'HARD',
    description: 'Employee cannot exceed max consecutive working days',
    businessReason: 'Fatigue management',
    parameters: [
      { key: 'maxConsecutiveDays', label: 'Max Consecutive Days', type: 'number', unit: 'days', defaultValue: 6, min: 3, max: 14, perContract: true },
    ],
    timefoldMapping: 'employee-resource-constraints/work-limits/consecutive-days-worked',
  },

  // --- Shift Rules ---
  {
    id: 'H3', code: 'H3', name: 'No Duplicate Employee in Shift',
    category: 'shift_rules', defaultEnforcement: 'HARD',
    description: 'Same employee cannot be assigned more than once to the same shift',
    businessReason: 'Data integrity',
    parameters: [],
    timefoldMapping: 'user-guide/terminology',
  },
  {
    id: 'H4', code: 'H4', name: 'No Overlapping Shifts',
    category: 'shift_rules', defaultEnforcement: 'HARD',
    description: 'Employee cannot be assigned to overlapping time ranges',
    businessReason: 'Physical impossibility',
    parameters: [],
    timefoldMapping: 'employee-resource-constraints/shift-rotations-and-patterns/overlapping-shifts',
  },
  {
    id: 'H5', code: 'H5', name: 'Employee Availability Compliance',
    category: 'shift_rules', defaultEnforcement: 'HARD',
    description: 'Employee must be available for entire shift duration',
    businessReason: 'Approved leave & availability',
    parameters: [],
    timefoldMapping: 'employee-resource-constraints/employee-availability',
  },
  {
    id: 'H8', code: 'H8', name: 'Immutable Pre-Assignments (Locked)',
    category: 'shift_rules', defaultEnforcement: 'HARD',
    description: 'Locked assignments cannot be changed unless employee becomes unavailable',
    businessReason: 'Managerial override protection',
    parameters: [],
    timefoldMapping: 'manual-intervention',
  },
  {
    id: 'H11', code: 'H11', name: 'Minimum Shift Length',
    category: 'shift_rules', defaultEnforcement: 'HARD',
    description: 'Shift duration must be ≥ award minimum',
    businessReason: 'Minimum payable hours',
    parameters: [
      { key: 'minShiftHours', label: 'Min Shift Duration', type: 'number', unit: 'hrs', defaultValue: 3, min: 1, max: 8, perContract: true },
    ],
    timefoldMapping: 'employee-resource-constraints/employee-contracts',
  },
  {
    id: 'H12', code: 'H12', name: 'Maximum Shift Length',
    category: 'shift_rules', defaultEnforcement: 'HARD',
    description: 'Shift duration must not exceed award maximum',
    businessReason: 'Safety & fatigue',
    parameters: [
      { key: 'maxShiftHours', label: 'Max Shift Duration', type: 'number', unit: 'hrs', defaultValue: 12, min: 6, max: 16, perContract: true },
    ],
    timefoldMapping: 'employee-resource-constraints/employee-contracts',
  },

  // --- Award & Compliance ---
  {
    id: 'H9', code: 'H9', name: 'Award Applicability',
    category: 'compliance', defaultEnforcement: 'HARD',
    description: 'Employee can only work shifts governed by their assigned award',
    businessReason: 'Legal employment classification',
    parameters: [],
    timefoldMapping: 'employee-resource-constraints/shift-type-diversity/shift-tag-types',
  },
  {
    id: 'H10', code: 'H10', name: 'Employment Type Compliance',
    category: 'compliance', defaultEnforcement: 'HARD',
    description: 'Shift assignment must respect full-time/part-time/casual rules',
    businessReason: 'Contractual rules',
    parameters: [],
    timefoldMapping: 'employee-resource-constraints/employee-contracts',
  },
  {
    id: 'H19', code: 'H19', name: 'Public Holiday Eligibility',
    category: 'compliance', defaultEnforcement: 'HARD',
    description: 'Only eligible employees may be rostered on public holidays',
    businessReason: 'Award rules',
    parameters: [],
    timefoldMapping: 'employee-resource-constraints/employee-contracts',
  },

  // ==================== SOFT CONSTRAINTS ====================

  // --- Coverage & Staffing ---
  {
    id: 'S2', code: 'S2', name: 'Penalise Empty Shifts',
    category: 'coverage_staffing', defaultEnforcement: 'SOFT',
    description: 'Strongly penalise shifts with zero assigned employees',
    businessReason: 'Visibility of staffing gaps',
    parameters: [],
    timefoldMapping: 'shift-service-constraints/mandatory-and-optional-shifts',
  },
  {
    id: 'S3', code: 'S3', name: 'Penalise Incomplete Shifts',
    category: 'coverage_staffing', defaultEnforcement: 'SOFT',
    description: 'Penalise partially filled shifts',
    businessReason: 'Improve coverage quality',
    parameters: [],
    timefoldMapping: 'shift-service-constraints/mandatory-and-optional-shifts',
  },
  {
    id: 'S4', code: 'S4', name: 'Reward Complete Shift Coverage',
    category: 'coverage_staffing', defaultEnforcement: 'SOFT',
    description: 'Reward shifts that meet full coverage',
    businessReason: 'Operational excellence',
    parameters: [],
  },
  {
    id: 'S5', code: 'S5', name: 'Reward Employee Utilisation',
    category: 'coverage_staffing', defaultEnforcement: 'SOFT',
    description: 'Reward valid employee assignments within limits',
    businessReason: 'Workforce efficiency',
    parameters: [],
    timefoldMapping: 'employee-resource-constraints/employee-activation#maximize_activated_employee_saturation',
  },

  // --- Cost Optimization ---
  {
    id: 'S6', code: 'S6', name: 'Minimise Overtime Exposure',
    category: 'cost_optimization', defaultEnforcement: 'SOFT',
    description: 'Penalise assignments causing overtime',
    businessReason: 'Cost control',
    parameters: [],
    timefoldMapping: 'employee-resource-constraints/work-limits/shifts-worked-per-period#managing_overtime',
  },
  {
    id: 'S9', code: 'S9', name: 'Minimise Penalty Rates',
    category: 'cost_optimization', defaultEnforcement: 'SOFT',
    description: 'Prefer lower penalty cost assignments',
    businessReason: 'Wage optimisation',
    parameters: [],
    timefoldMapping: 'shift-service-constraints/cost-management/cost-management',
  },
  {
    id: 'S13', code: 'S13', name: 'Minimise Travel Distance',
    category: 'cost_optimization', defaultEnforcement: 'SOFT',
    description: 'Prefer closer locations',
    businessReason: 'Cost & fatigue',
    parameters: [
      { key: 'maxTravelKm', label: 'Max Travel Distance', type: 'number', unit: 'km', defaultValue: 50, min: 5, max: 200 },
    ],
    timefoldMapping: 'employee-resource-constraints/shift-travel-and-locations',
  },
  {
    id: 'S1', code: 'S1', name: 'Location & Area Preference',
    category: 'cost_optimization', defaultEnforcement: 'SOFT',
    description: 'Prefer same location/area assignments (tiered scoring)',
    businessReason: 'Reduce travel & improve efficiency',
    parameters: [],
    timefoldMapping: 'employee-resource-constraints/shift-travel-and-locations',
  },

  // --- Fairness & Preferences ---
  {
    id: 'S7', code: 'S7', name: 'Fair Distribution of Shifts',
    category: 'fairness_preferences', defaultEnforcement: 'SOFT',
    description: 'Minimise variance in shift distribution',
    businessReason: 'Employee morale',
    parameters: [],
    timefoldMapping: 'employee-resource-constraints/container-fairness/fairness',
  },
  {
    id: 'S10', code: 'S10', name: 'Weekend / Night Shift Fairness',
    category: 'fairness_preferences', defaultEnforcement: 'SOFT',
    description: 'Distribute undesirable shifts evenly',
    businessReason: 'Retention',
    parameters: [
      { key: 'maxWeekendsPerMonth', label: 'Max Weekends per Month', type: 'number', defaultValue: 2, min: 1, max: 5 },
    ],
    timefoldMapping: 'employee-resource-constraints/work-limits/weekends-worked-per-period',
  },
  {
    id: 'S11', code: 'S11', name: 'Employee Shift Preferences',
    category: 'fairness_preferences', defaultEnforcement: 'SOFT',
    description: 'Prefer employee-preferred days/times',
    businessReason: 'Engagement',
    parameters: [],
    timefoldMapping: 'employee-resource-constraints/employee-availability#employee_preferred_times',
  },
  {
    id: 'S17', code: 'S17', name: 'Respect Contracted Hours',
    category: 'fairness_preferences', defaultEnforcement: 'SOFT',
    description: 'Prefer employees close to contracted hours',
    businessReason: 'Predictability',
    parameters: [],
    timefoldMapping: 'employee-resource-constraints/work-limits/work-limits',
  },
  {
    id: 'S15', code: 'S15', name: 'Avoid Split Shifts',
    category: 'fairness_preferences', defaultEnforcement: 'SOFT',
    description: 'Penalise fragmented daily schedules',
    businessReason: 'Employee satisfaction',
    parameters: [],
  },

  // --- Operational Quality ---
  {
    id: 'S8', code: 'S8', name: 'Preserve Pre-Assignments',
    category: 'operational_quality', defaultEnforcement: 'SOFT',
    description: 'Prefer retaining manually assigned employees',
    businessReason: 'Trust & stability',
    parameters: [],
    timefoldMapping: 'real-time-planning-preview#minimizing_disruption_due_to_real_time_planning',
  },
  {
    id: 'S12', code: 'S12', name: 'Client-Specific Staff Preference',
    category: 'operational_quality', defaultEnforcement: 'SOFT',
    description: 'Prefer employees familiar with client/site',
    businessReason: 'Client satisfaction',
    parameters: [],
    timefoldMapping: 'shift-service-constraints/shift-assignments/employee-selection#preferred_employee',
  },
  {
    id: 'S14', code: 'S14', name: 'Continuity of Care / Service',
    category: 'operational_quality', defaultEnforcement: 'SOFT',
    description: 'Prefer same staff for same client/location',
    businessReason: 'Quality & compliance',
    parameters: [],
    timefoldMapping: 'shift-service-constraints/shift-assignments/employee-selection#preferred_employee',
  },
  {
    id: 'S16', code: 'S16', name: 'Reduce Roster Volatility',
    category: 'operational_quality', defaultEnforcement: 'SOFT',
    description: 'Penalise frequent reassignments',
    businessReason: 'Operational stability',
    parameters: [],
    timefoldMapping: 'real-time-planning-preview#minimizing_disruption_due_to_real_time_planning',
  },
  {
    id: 'S18', code: 'S18', name: 'Team Cohesion',
    category: 'operational_quality', defaultEnforcement: 'SOFT',
    description: 'Prefer assigning known teams together',
    businessReason: 'Productivity',
    parameters: [],
    timefoldMapping: 'employee-resource-constraints/pairing-employees',
  },
  {
    id: 'S19', code: 'S19', name: 'Managerial Override Respect',
    category: 'operational_quality', defaultEnforcement: 'SOFT',
    description: 'Penalise solver changes to curated rosters',
    businessReason: 'Human trust',
    parameters: [],
    timefoldMapping: 'real-time-planning-preview#minimizing_disruption_due_to_real_time_planning',
  },
  {
    id: 'S20', code: 'S20', name: 'Workforce Diversity Balance',
    category: 'operational_quality', defaultEnforcement: 'OFF',
    description: 'Encourage balanced team composition',
    businessReason: 'Policy & ESG goals',
    parameters: [],
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
      weight: 50,
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
): { enforcement: ConstraintEnforcement; weight: number; parameters: Record<string, any> } {
  if (!locationId || !setting.locationOverrides[locationId]) {
    return { enforcement: setting.enforcement, weight: setting.weight, parameters: setting.parameters };
  }
  const override = setting.locationOverrides[locationId];
  return {
    enforcement: override.enforcement ?? setting.enforcement,
    weight: override.weight ?? setting.weight,
    parameters: { ...setting.parameters, ...(override.parameters ?? {}) },
  };
}
