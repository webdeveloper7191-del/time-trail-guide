// Timefold Solver Integration Types and Configuration
// Timefold is a Java/Python constraint solver - this defines the constraint model
// that would be passed to a Timefold backend service

export type ConstraintLevel = 'HARD' | 'MEDIUM' | 'SOFT';
export type ConstraintCategory = 
  | 'availability' 
  | 'qualification' 
  | 'capacity' 
  | 'fairness' 
  | 'cost' 
  | 'preference'
  | 'compliance'
  | 'continuity';

export interface TimefoldConstraint {
  id: string;
  name: string;
  description: string;
  category: ConstraintCategory;
  level: ConstraintLevel;
  weight: number; // Score impact for soft/medium constraints
  enabled: boolean;
  
  // Constraint-specific parameters
  parameters: Record<string, ConstraintParameter>;
  
  // Built-in or custom
  isBuiltIn: boolean;
  
  // For UI display
  icon?: string;
}

export interface ConstraintParameter {
  key: string;
  label: string;
  type: 'number' | 'boolean' | 'string' | 'select' | 'time' | 'duration';
  value: any;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  unit?: string;
  description?: string;
}

export interface TimefoldSolverConfig {
  // Solver settings
  terminationTimeSeconds: number;
  moveThreadCount: number;
  
  // Constraint weights by category
  categoryWeights: Record<ConstraintCategory, number>;
  
  // Individual constraints
  constraints: TimefoldConstraint[];
  
  // Solution preferences
  optimizationGoal: 'balanced' | 'cost_minimization' | 'staff_satisfaction' | 'compliance_first';
}

export interface ShiftPlanningEntity {
  id: string;
  shiftId: string;
  date: string;
  startTime: string;
  endTime: string;
  roomId: string;
  centreId: string;
  requiredQualifications: string[];
  minimumClassification?: string;
  preferredRole?: string;
  
  // Planning variable - assigned by solver
  assignedStaffId?: string | null;
}

export interface StaffPlanningEntity {
  id: string;
  name: string;
  role: string;
  employmentType: 'permanent' | 'casual';
  isAgency: boolean;
  hourlyRate: number;
  maxHoursPerWeek: number;
  currentHoursAssigned: number;
  qualifications: string[];
  availability: {
    dayOfWeek: number;
    available: boolean;
    startTime?: string;
    endTime?: string;
  }[];
  preferredCentres: string[];
  defaultCentreId?: string;
  willingToWorkMultipleLocations?: boolean;
  leavesDates: string[];
}

export interface TimefoldSolution {
  score: {
    hardScore: number;
    mediumScore: number;
    softScore: number;
    isFeasible: boolean;
  };
  assignments: {
    shiftId: string;
    staffId: string;
    constraintViolations: {
      constraintId: string;
      constraintName: string;
      impact: number;
      level: ConstraintLevel;
    }[];
  }[];
  unassignedShifts: string[];
  solverTimeMs: number;
  movesEvaluated: number;
  
  // Work-saved metrics
  workSavedMetrics: {
    estimatedManualTimeMinutes: number; // Time it would take to manually schedule
    actualSolverTimeSeconds: number;
    timeSavedMinutes: number;
    efficiencyPercentage: number;
    shiftsPerMinute: number; // Solving rate
    constraintsEvaluated: number;
    optimalAssignmentsFound: number;
  };
}

// Custom preset for saving configurations
export interface ConstraintPreset {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  config: TimefoldSolverConfig;
  isBuiltIn: boolean;
}

// ============ DEFAULT CONSTRAINTS ============

export const defaultConstraints: TimefoldConstraint[] = [
  // === HARD CONSTRAINTS (Must be satisfied) ===
  {
    id: 'staff-availability',
    name: 'Staff Availability',
    description: 'Staff must be available during the shift time',
    category: 'availability',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    parameters: {
      checkDayAvailability: { key: 'checkDayAvailability', label: 'Check day availability', type: 'boolean', value: true },
      checkTimeWindow: { key: 'checkTimeWindow', label: 'Check time window', type: 'boolean', value: true },
    },
  },
  {
    id: 'no-overlapping-shifts',
    name: 'No Overlapping Shifts',
    description: 'Staff cannot work overlapping shifts',
    category: 'availability',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    parameters: {},
  },
  {
    id: 'staff-on-leave',
    name: 'Respect Leave',
    description: 'Staff on approved leave cannot be assigned',
    category: 'availability',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    parameters: {},
  },
  {
    id: 'required-qualifications',
    name: 'Required Qualifications',
    description: 'Staff must have all required qualifications for the shift',
    category: 'qualification',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    parameters: {
      strictMode: { key: 'strictMode', label: 'Strict mode (no exceptions)', type: 'boolean', value: true },
    },
  },
  {
    id: 'max-hours-per-week',
    name: 'Maximum Weekly Hours',
    description: 'Staff cannot exceed their maximum weekly hours',
    category: 'capacity',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    parameters: {
      allowOvertimePercent: { key: 'allowOvertimePercent', label: 'Allow overtime %', type: 'number', value: 0, min: 0, max: 50, unit: '%' },
    },
  },
  {
    id: 'minimum-rest-between-shifts',
    name: 'Minimum Rest Period',
    description: 'Minimum hours between consecutive shifts',
    category: 'compliance',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    parameters: {
      minRestHours: { key: 'minRestHours', label: 'Minimum rest hours', type: 'number', value: 10, min: 8, max: 24, unit: 'hours' },
    },
  },
  
  // === MEDIUM CONSTRAINTS (Strongly preferred) ===
  {
    id: 'preferred-centre',
    name: 'Preferred Centre',
    description: 'Assign staff to their preferred centres',
    category: 'preference',
    level: 'MEDIUM',
    weight: 50,
    enabled: true,
    isBuiltIn: true,
    parameters: {
      prioritizeDefaultCentre: { key: 'prioritizeDefaultCentre', label: 'Prioritize default centre', type: 'boolean', value: true },
    },
  },
  {
    id: 'qualification-match',
    name: 'Qualification Match',
    description: 'Prefer staff with matching qualifications over minimum requirements',
    category: 'qualification',
    level: 'MEDIUM',
    weight: 40,
    enabled: true,
    isBuiltIn: true,
    parameters: {
      bonusPerExtraQual: { key: 'bonusPerExtraQual', label: 'Bonus per extra qualification', type: 'number', value: 10, min: 0, max: 50 },
    },
  },
  {
    id: 'role-match',
    name: 'Role Match',
    description: 'Prefer staff with matching role for the shift',
    category: 'qualification',
    level: 'MEDIUM',
    weight: 35,
    enabled: true,
    isBuiltIn: true,
    parameters: {},
  },
  
  // === SOFT CONSTRAINTS (Nice to have) ===
  {
    id: 'minimize-cost',
    name: 'Minimize Labour Cost',
    description: 'Prefer lower-cost staff assignments',
    category: 'cost',
    level: 'SOFT',
    weight: 30,
    enabled: true,
    isBuiltIn: true,
    parameters: {
      considerPenaltyRates: { key: 'considerPenaltyRates', label: 'Consider penalty rates', type: 'boolean', value: true },
      weekendPenaltyMultiplier: { key: 'weekendPenaltyMultiplier', label: 'Weekend penalty multiplier', type: 'number', value: 1.5, min: 1, max: 3 },
    },
  },
  {
    id: 'fair-distribution',
    name: 'Fair Shift Distribution',
    description: 'Distribute shifts fairly among available staff',
    category: 'fairness',
    level: 'SOFT',
    weight: 25,
    enabled: true,
    isBuiltIn: true,
    parameters: {
      varianceThreshold: { key: 'varianceThreshold', label: 'Max hours variance', type: 'number', value: 8, min: 0, max: 20, unit: 'hours' },
    },
  },
  {
    id: 'prefer-permanent-over-casual',
    name: 'Prefer Permanent Staff',
    description: 'Prefer permanent staff over casual workers',
    category: 'cost',
    level: 'SOFT',
    weight: 20,
    enabled: true,
    isBuiltIn: true,
    parameters: {
      casualPenalty: { key: 'casualPenalty', label: 'Casual staff penalty', type: 'number', value: 10, min: 0, max: 50 },
    },
  },
  {
    id: 'prefer-internal-over-agency',
    name: 'Prefer Internal Staff',
    description: 'Prefer internal staff over agency workers',
    category: 'cost',
    level: 'SOFT',
    weight: 35,
    enabled: true,
    isBuiltIn: true,
    parameters: {
      agencyPenalty: { key: 'agencyPenalty', label: 'Agency staff penalty', type: 'number', value: 25, min: 0, max: 100 },
      allowAgency: { key: 'allowAgency', label: 'Allow agency staff', type: 'boolean', value: true },
    },
  },
  {
    id: 'shift-continuity',
    name: 'Shift Continuity',
    description: 'Prefer assigning same staff to consecutive shifts in a room',
    category: 'continuity',
    level: 'SOFT',
    weight: 15,
    enabled: true,
    isBuiltIn: true,
    parameters: {
      continuityBonus: { key: 'continuityBonus', label: 'Continuity bonus', type: 'number', value: 15, min: 0, max: 50 },
    },
  },
  {
    id: 'max-consecutive-days',
    name: 'Max Consecutive Days',
    description: 'Limit consecutive working days for fatigue management',
    category: 'compliance',
    level: 'SOFT',
    weight: 20,
    enabled: true,
    isBuiltIn: true,
    parameters: {
      maxDays: { key: 'maxDays', label: 'Maximum consecutive days', type: 'number', value: 5, min: 3, max: 7, unit: 'days' },
      penaltyPerExtraDay: { key: 'penaltyPerExtraDay', label: 'Penalty per extra day', type: 'number', value: 10, min: 0, max: 50 },
    },
  },
  {
    id: 'early-late-preference',
    name: 'Shift Time Preference',
    description: 'Respect staff preferences for early/late shifts',
    category: 'preference',
    level: 'SOFT',
    weight: 10,
    enabled: false,
    isBuiltIn: true,
    parameters: {
      earlyShiftBefore: { key: 'earlyShiftBefore', label: 'Early shift ends before', type: 'time', value: '12:00' },
      lateShiftAfter: { key: 'lateShiftAfter', label: 'Late shift starts after', type: 'time', value: '14:00' },
    },
  },
];

export const defaultCategoryWeights: Record<ConstraintCategory, number> = {
  availability: 100,
  qualification: 90,
  capacity: 100,
  compliance: 85,
  fairness: 50,
  cost: 60,
  preference: 40,
  continuity: 30,
};

export const defaultSolverConfig: TimefoldSolverConfig = {
  terminationTimeSeconds: 30,
  moveThreadCount: 4,
  categoryWeights: defaultCategoryWeights,
  constraints: defaultConstraints,
  optimizationGoal: 'balanced',
};

// ============ SOLVER PRESETS ============

export const solverPresets: Record<string, Partial<TimefoldSolverConfig>> = {
  balanced: {
    optimizationGoal: 'balanced',
    categoryWeights: {
      availability: 100,
      qualification: 90,
      capacity: 100,
      compliance: 85,
      fairness: 50,
      cost: 60,
      preference: 40,
      continuity: 30,
    },
  },
  cost_minimization: {
    optimizationGoal: 'cost_minimization',
    categoryWeights: {
      availability: 100,
      qualification: 80,
      capacity: 100,
      compliance: 70,
      fairness: 30,
      cost: 100,
      preference: 20,
      continuity: 20,
    },
  },
  staff_satisfaction: {
    optimizationGoal: 'staff_satisfaction',
    categoryWeights: {
      availability: 100,
      qualification: 90,
      capacity: 100,
      compliance: 90,
      fairness: 80,
      cost: 30,
      preference: 90,
      continuity: 60,
    },
  },
  compliance_first: {
    optimizationGoal: 'compliance_first',
    categoryWeights: {
      availability: 100,
      qualification: 100,
      capacity: 100,
      compliance: 100,
      fairness: 60,
      cost: 40,
      preference: 30,
      continuity: 40,
    },
  },
};

// ============ MOCK SOLVER (Replace with actual Timefold API call) ============

export async function solveWithTimefold(
  config: TimefoldSolverConfig,
  shifts: ShiftPlanningEntity[],
  staff: StaffPlanningEntity[]
): Promise<TimefoldSolution> {
  // This is a mock implementation
  // In production, this would call your Timefold backend service:
  // POST https://your-timefold-service/solve
  // Body: { config, shifts, staff }
  
  console.log('Timefold Solver Config:', config);
  console.log('Shifts to assign:', shifts.length);
  console.log('Available staff:', staff.length);
  
  // Simulate solver time
  await new Promise(resolve => setTimeout(resolve, config.terminationTimeSeconds * 100));
  
  // Simple heuristic assignment for demo
  const assignments: TimefoldSolution['assignments'] = [];
  const usedStaff = new Map<string, number>(); // staffId -> hours assigned
  const unassignedShifts: string[] = [];
  
  for (const shift of shifts) {
    // Find best available staff based on constraints
    let bestStaff: StaffPlanningEntity | null = null;
    let bestScore = -Infinity;
    
    for (const s of staff) {
      let score = 0;
      const violations: TimefoldSolution['assignments'][0]['constraintViolations'] = [];
      
      // Check hard constraints
      const dayOfWeek = new Date(shift.date).getDay();
      const dayAvail = s.availability.find(a => a.dayOfWeek === dayOfWeek);
      
      if (!dayAvail?.available) continue; // Hard constraint
      if (s.leavesDates.includes(shift.date)) continue; // Hard constraint
      
      // Check hours
      const currentHours = usedStaff.get(s.id) || s.currentHoursAssigned;
      const shiftHours = calculateShiftHours(shift.startTime, shift.endTime);
      if (currentHours + shiftHours > s.maxHoursPerWeek) continue;
      
      // Check qualifications
      const hasRequiredQuals = shift.requiredQualifications.every(q => 
        s.qualifications.includes(q)
      );
      if (!hasRequiredQuals && config.constraints.find(c => c.id === 'required-qualifications')?.parameters.strictMode?.value) {
        continue;
      }
      
      // Soft scoring
      // Preferred centre bonus
      if (s.preferredCentres.includes(shift.centreId)) {
        score += config.categoryWeights.preference * 0.5;
      }
      if (s.defaultCentreId === shift.centreId) {
        score += config.categoryWeights.preference * 0.5;
      }
      
      // Cost scoring (lower is better)
      score -= s.hourlyRate * (config.categoryWeights.cost / 100);
      
      // Fairness - prefer staff with fewer hours
      score += (s.maxHoursPerWeek - currentHours) * (config.categoryWeights.fairness / 100);
      
      // Agency penalty
      if (s.isAgency) {
        score -= config.constraints.find(c => c.id === 'prefer-internal-over-agency')?.parameters.agencyPenalty?.value || 25;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestStaff = s;
      }
    }
    
    if (bestStaff) {
      const shiftHours = calculateShiftHours(shift.startTime, shift.endTime);
      usedStaff.set(bestStaff.id, (usedStaff.get(bestStaff.id) || bestStaff.currentHoursAssigned) + shiftHours);
      
      assignments.push({
        shiftId: shift.id,
        staffId: bestStaff.id,
        constraintViolations: [],
      });
    } else {
      unassignedShifts.push(shift.id);
    }
  }
  
  // Calculate work-saved metrics
  const actualSolverTimeSeconds = config.terminationTimeSeconds * 0.1; // Simulated
  const estimatedManualTimeMinutes = shifts.length * 3; // Assume 3 minutes per shift manually
  const timeSavedMinutes = estimatedManualTimeMinutes - (actualSolverTimeSeconds / 60);
  const constraintsEvaluated = assignments.length * config.constraints.filter(c => c.enabled).length;
  
  return {
    score: {
      hardScore: unassignedShifts.length > 0 ? -unassignedShifts.length : 0,
      mediumScore: 0,
      softScore: Math.round(assignments.length * 10 - unassignedShifts.length * 50),
      isFeasible: unassignedShifts.length === 0,
    },
    assignments,
    unassignedShifts,
    solverTimeMs: config.terminationTimeSeconds * 100,
    movesEvaluated: assignments.length * staff.length * 10,
    workSavedMetrics: {
      estimatedManualTimeMinutes,
      actualSolverTimeSeconds,
      timeSavedMinutes: Math.max(0, timeSavedMinutes),
      efficiencyPercentage: Math.round((timeSavedMinutes / estimatedManualTimeMinutes) * 100),
      shiftsPerMinute: actualSolverTimeSeconds > 0 ? Math.round((assignments.length / actualSolverTimeSeconds) * 60) : assignments.length,
      constraintsEvaluated,
      optimalAssignmentsFound: assignments.length,
    },
  };
}

function calculateShiftHours(start: string, end: string): number {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  return (endH * 60 + endM - startH * 60 - startM) / 60;
}

// ============ CONSTRAINT VALIDATION ============

export function validateConstraintConfig(config: TimefoldSolverConfig): string[] {
  const errors: string[] = [];
  
  const hardConstraints = config.constraints.filter(c => c.level === 'HARD' && c.enabled);
  if (hardConstraints.length === 0) {
    errors.push('At least one hard constraint should be enabled');
  }
  
  if (config.terminationTimeSeconds < 5) {
    errors.push('Termination time should be at least 5 seconds');
  }
  
  if (config.terminationTimeSeconds > 300) {
    errors.push('Termination time should not exceed 5 minutes');
  }
  
  return errors;
}
