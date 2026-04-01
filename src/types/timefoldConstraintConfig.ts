/**
 * Timefold Employee Shift Scheduling - Constraint Configuration Types
 * Based on: https://docs.timefold.ai/employee-shift-scheduling/latest/
 */

// ============= Common Types =============

export type ConstraintType = 'HARD' | 'SOFT';
export type Priority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
export type Period = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
export type Satisfiability = 'REQUIRED' | 'PREFERRED';
export type SkillMatchStrategy = 'ALL' | 'ANY';
export type AvailabilityType = 'AVAILABLE' | 'UNAVAILABLE' | 'PREFERRED' | 'UNPREFERRED';
export type PairingType = 'REQUIRED' | 'PREFERRED' | 'UNPREFERRED' | 'PROHIBITED';

// ============= Employee Resource Constraints =============

/** Employee Contracts - work conditions and limits */
export interface ContractConfig {
  enabled: boolean;
  contracts: ContractRule[];
}

export interface ContractRule {
  id: string;
  name: string;
  priority: Priority;
  employmentType: string; // e.g. 'full_time', 'part_time', 'casual', 'contractor'
  workLimits: WorkLimitConfig;
  timeOffRules: TimeOffConfig;
  shiftPatterns: ShiftPatternConfig;
}

/** Work Limits - hours/days per period */
export interface WorkLimitConfig {
  enabled: boolean;
  minutesPerPeriod: {
    enabled: boolean;
    period: Period;
    minMinutes?: number;
    maxMinutes?: number;
    satisfiability: Satisfiability;
  };
  minutesRollingWindow: {
    enabled: boolean;
    windowDays: number;
    minMinutes?: number;
    maxMinutes?: number;
    satisfiability: Satisfiability;
  };
  daysPerPeriod: {
    enabled: boolean;
    period: Period;
    minDays?: number;
    maxDays?: number;
    satisfiability: Satisfiability;
  };
  daysRollingWindow: {
    enabled: boolean;
    windowDays: number;
    minDays?: number;
    maxDays?: number;
    satisfiability: Satisfiability;
  };
  shiftsPerPeriod: {
    enabled: boolean;
    period: Period;
    minShifts?: number;
    maxShifts?: number;
    satisfiability: Satisfiability;
  };
  weekendLimits: {
    enabled: boolean;
    maxWeekendsPerPeriod?: number;
    period: Period;
    maxConsecutiveWeekends?: number;
    maxWeekendMinutes?: number;
  };
  consecutiveDaysWorked: {
    enabled: boolean;
    maxConsecutiveDays: number;
    satisfiability: Satisfiability;
  };
}

/** Time Off */
export interface TimeOffConfig {
  enabled: boolean;
  minTimeBetweenShiftsMinutes: number;
  consecutiveDaysOff: {
    enabled: boolean;
    minConsecutiveDaysOff: number;
    period: Period;
    satisfiability: Satisfiability;
  };
  daysOffPerPeriod: {
    enabled: boolean;
    period: Period;
    minDaysOff: number;
    satisfiability: Satisfiability;
  };
}

/** Shift Rotations and Patterns */
export interface ShiftPatternConfig {
  enabled: boolean;
  minTimeBetweenShiftsMinutes: number;
  shiftRotations: {
    enabled: boolean;
    enforceRotationPattern: boolean;
  };
  splitShifts: {
    enabled: boolean;
    minGapBetweenPartsMinutes: number;
    maxGapBetweenPartsMinutes: number;
  };
  onCallShifts: {
    enabled: boolean;
    countAsWorkedTime: boolean;
  };
}

/** Employee Availability */
export interface AvailabilityConfig {
  enabled: boolean;
  respectUnavailability: boolean; // HARD constraint
  preferAvailableSlots: boolean; // SOFT constraint
  allowPreferences: boolean;
  preferenceWeight: number; // 0-100
}

/** Employee Priority */
export interface EmployeePriorityConfig {
  enabled: boolean;
  priorityLevels: Priority[];
  higherPriorityWeight: number; // How much more weight high-priority employees get
}

/** Pairing Employees */
export interface PairingConfig {
  enabled: boolean;
  pairs: PairingRule[];
}

export interface PairingRule {
  id: string;
  employee1Id: string;
  employee1Name: string;
  employee2Id: string;
  employee2Name: string;
  pairingType: PairingType;
  reason?: string;
}

/** Shift Travel and Locations */
export interface TravelConfig {
  enabled: boolean;
  maxTravelDistanceKm: number;
  satisfiability: Satisfiability;
  minTimeBetweenShiftsIncludingTravelMinutes: number;
  minimizeTravelDistance: boolean;
  maxLocationsPerPeriod: {
    enabled: boolean;
    period: Period;
    maxLocations: number;
  };
}

/** Shift Breaks */
export interface BreakConfig {
  enabled: boolean;
  deductBreaksFromWorkedTime: boolean;
  defaultBreakRules: {
    minShiftDurationForBreakMinutes: number;
    breakDurationMinutes: number;
  };
}

/** Employee Activation */
export interface ActivationConfig {
  enabled: boolean;
  minimizeActivatedEmployees: boolean;
  maximizeActivatedSaturation: boolean;
  activationRatio: {
    enabled: boolean;
    employeeGroup1: string;
    employeeGroup2: string;
    minRatio: number;
    maxRatio: number;
  };
}

/** Fairness */
export interface FairnessConfig {
  enabled: boolean;
  balanceTimeWorked: {
    enabled: boolean;
    weight: number;
  };
  balanceShiftCount: {
    enabled: boolean;
    weight: number;
  };
}

/** Shift Type Diversity */
export interface ShiftTypeDiversityConfig {
  enabled: boolean;
  limitShiftTypePerPeriod: {
    enabled: boolean;
    period: Period;
    maxShiftTypesPerEmployee: number;
  };
}

// ============= Shift Service Constraints =============

/** Alternative Shifts */
export interface AlternativeShiftsConfig {
  enabled: boolean;
  allowShiftGroups: boolean;
  maxAlternativesPerGroup: number;
}

/** Cost Management */
export interface CostManagementConfig {
  enabled: boolean;
  costGroups: {
    enabled: boolean;
    minimizeCostGroupUsage: boolean;
  };
  employeeRates: {
    enabled: boolean;
    preferLowerCostEmployees: boolean;
    weight: number;
  };
}

/** Demand-Based Scheduling */
export interface DemandSchedulingConfig {
  enabled: boolean;
  mode: 'shift_slot' | 'hourly_demand';
  hourlyDemand: {
    enabled: boolean;
    allowOverstaffing: boolean;
    allowUnderstaffing: boolean;
    overstaffingPenaltyWeight: number;
    understaffingPenaltyWeight: number;
  };
}

/** Mandatory and Optional Shifts */
export interface ShiftPriorityConfig {
  enabled: boolean;
  usePriorities: boolean;
  mandatoryShiftsMustBeAssigned: boolean; // HARD constraint
  optionalShiftsCanBeSkipped: boolean;
}

/** Skills and Risk Factors */
export interface SkillsConfig {
  enabled: boolean;
  requiredSkillsEnforced: boolean; // HARD constraint
  preferredSkillsWeight: number; // SOFT weight
  skillMatchStrategy: SkillMatchStrategy;
  riskFactors: {
    enabled: boolean;
    prohibitHighRisk: boolean; // HARD
    penalizeModerateRisk: boolean; // SOFT
  };
}

/** Shift Assignments - Shift Selection */
export interface ShiftSelectionConfig {
  enabled: boolean;
  shiftsWorkedPerPeriod: {
    enabled: boolean;
    period: Period;
    minShifts?: number;
    maxShifts?: number;
    satisfiability: Satisfiability;
  };
  limitByEmployeeType: {
    enabled: boolean;
  };
  limitByShiftType: {
    enabled: boolean;
  };
  concurrentShiftRules: {
    enabled: boolean;
    maxConcurrentShifts: number;
    resourceLimited: boolean;
  };
}

/** Shift Assignments - Employee Selection */
export interface EmployeeSelectionConfig {
  enabled: boolean;
  preferredEmployees: boolean; // SOFT reward
  unpreferredEmployees: boolean; // SOFT penalty
  prohibitedEmployees: boolean; // HARD constraint
}

// ============= Full Configuration =============

export interface TimefoldConstraintConfiguration {
  // Employee Resource Constraints
  employeeConstraints: {
    contracts: ContractConfig;
    availability: AvailabilityConfig;
    priority: EmployeePriorityConfig;
    pairing: PairingConfig;
    travel: TravelConfig;
    breaks: BreakConfig;
    activation: ActivationConfig;
    fairness: FairnessConfig;
    shiftTypeDiversity: ShiftTypeDiversityConfig;
  };
  // Shift Service Constraints  
  shiftConstraints: {
    alternativeShifts: AlternativeShiftsConfig;
    costManagement: CostManagementConfig;
    demandScheduling: DemandSchedulingConfig;
    shiftPriority: ShiftPriorityConfig;
    skills: SkillsConfig;
    shiftSelection: ShiftSelectionConfig;
    employeeSelection: EmployeeSelectionConfig;
  };
}

// ============= Defaults =============

export const defaultWorkLimits: WorkLimitConfig = {
  enabled: true,
  minutesPerPeriod: { enabled: true, period: 'WEEK', minMinutes: 0, maxMinutes: 2400, satisfiability: 'REQUIRED' },
  minutesRollingWindow: { enabled: false, windowDays: 7, minMinutes: 0, maxMinutes: 2400, satisfiability: 'PREFERRED' },
  daysPerPeriod: { enabled: true, period: 'WEEK', minDays: 0, maxDays: 5, satisfiability: 'REQUIRED' },
  daysRollingWindow: { enabled: false, windowDays: 14, minDays: 0, maxDays: 10, satisfiability: 'PREFERRED' },
  shiftsPerPeriod: { enabled: false, period: 'WEEK', minShifts: 0, maxShifts: 5, satisfiability: 'PREFERRED' },
  weekendLimits: { enabled: false, maxWeekendsPerPeriod: 2, period: 'MONTH', maxConsecutiveWeekends: 2, maxWeekendMinutes: 960 },
  consecutiveDaysWorked: { enabled: true, maxConsecutiveDays: 6, satisfiability: 'REQUIRED' },
};

export const defaultTimeOff: TimeOffConfig = {
  enabled: true,
  minTimeBetweenShiftsMinutes: 600, // 10 hours
  consecutiveDaysOff: { enabled: true, minConsecutiveDaysOff: 2, period: 'WEEK', satisfiability: 'PREFERRED' },
  daysOffPerPeriod: { enabled: true, period: 'WEEK', minDaysOff: 2, satisfiability: 'PREFERRED' },
};

export const defaultCasualWorkLimits: WorkLimitConfig = {
  enabled: true,
  minutesPerPeriod: { enabled: true, period: 'WEEK', minMinutes: 0, maxMinutes: 2280, satisfiability: 'REQUIRED' },
  minutesRollingWindow: { enabled: false, windowDays: 7, satisfiability: 'PREFERRED' },
  daysPerPeriod: { enabled: true, period: 'WEEK', minDays: 0, maxDays: 5, satisfiability: 'PREFERRED' },
  daysRollingWindow: { enabled: false, windowDays: 14, satisfiability: 'PREFERRED' },
  shiftsPerPeriod: { enabled: false, period: 'WEEK', satisfiability: 'PREFERRED' },
  weekendLimits: { enabled: false, maxWeekendsPerPeriod: 4, period: 'MONTH', maxConsecutiveWeekends: 4, maxWeekendMinutes: 1920 },
  consecutiveDaysWorked: { enabled: true, maxConsecutiveDays: 6, satisfiability: 'REQUIRED' },
};

export const defaultAgencyWorkLimits: WorkLimitConfig = {
  enabled: true,
  minutesPerPeriod: { enabled: true, period: 'WEEK', minMinutes: 0, maxMinutes: 2400, satisfiability: 'PREFERRED' },
  minutesRollingWindow: { enabled: false, windowDays: 7, satisfiability: 'PREFERRED' },
  daysPerPeriod: { enabled: true, period: 'WEEK', minDays: 0, maxDays: 6, satisfiability: 'PREFERRED' },
  daysRollingWindow: { enabled: false, windowDays: 14, satisfiability: 'PREFERRED' },
  shiftsPerPeriod: { enabled: false, period: 'WEEK', satisfiability: 'PREFERRED' },
  weekendLimits: { enabled: false, maxWeekendsPerPeriod: 4, period: 'MONTH', maxConsecutiveWeekends: 4, maxWeekendMinutes: 1920 },
  consecutiveDaysWorked: { enabled: true, maxConsecutiveDays: 6, satisfiability: 'PREFERRED' },
};

export const defaultCasualContract: ContractRule = {
  id: 'default-casual',
  name: 'Casual',
  priority: 'LOW',
  employmentType: 'casual',
  workLimits: defaultCasualWorkLimits,
  timeOffRules: {
    enabled: true,
    minTimeBetweenShiftsMinutes: 480, // 8 hours
    consecutiveDaysOff: { enabled: false, minConsecutiveDaysOff: 1, period: 'WEEK', satisfiability: 'PREFERRED' },
    daysOffPerPeriod: { enabled: false, period: 'WEEK', minDaysOff: 1, satisfiability: 'PREFERRED' },
  },
  shiftPatterns: {
    enabled: true,
    minTimeBetweenShiftsMinutes: 480,
    shiftRotations: { enabled: false, enforceRotationPattern: false },
    splitShifts: { enabled: true, minGapBetweenPartsMinutes: 60, maxGapBetweenPartsMinutes: 240 },
    onCallShifts: { enabled: false, countAsWorkedTime: false },
  },
};

export const defaultAgencyContract: ContractRule = {
  id: 'default-agency',
  name: 'Agency / Third Party',
  priority: 'LOW',
  employmentType: 'agency',
  workLimits: defaultAgencyWorkLimits,
  timeOffRules: {
    enabled: true,
    minTimeBetweenShiftsMinutes: 600, // 10 hours
    consecutiveDaysOff: { enabled: false, minConsecutiveDaysOff: 1, period: 'WEEK', satisfiability: 'PREFERRED' },
    daysOffPerPeriod: { enabled: false, period: 'WEEK', minDaysOff: 1, satisfiability: 'PREFERRED' },
  },
  shiftPatterns: {
    enabled: true,
    minTimeBetweenShiftsMinutes: 600,
    shiftRotations: { enabled: false, enforceRotationPattern: false },
    splitShifts: { enabled: false, minGapBetweenPartsMinutes: 60, maxGapBetweenPartsMinutes: 240 },
    onCallShifts: { enabled: true, countAsWorkedTime: false },
  },
};

export const defaultConstraintConfig: TimefoldConstraintConfiguration = {
  employeeConstraints: {
    contracts: {
      enabled: true,
      contracts: [
        {
          id: 'default-ft',
          name: 'Full Time',
          priority: 'NORMAL',
          employmentType: 'full_time',
          workLimits: defaultWorkLimits,
          timeOffRules: defaultTimeOff,
          shiftPatterns: {
            enabled: true,
            minTimeBetweenShiftsMinutes: 600,
            shiftRotations: { enabled: false, enforceRotationPattern: false },
            splitShifts: { enabled: false, minGapBetweenPartsMinutes: 60, maxGapBetweenPartsMinutes: 240 },
            onCallShifts: { enabled: false, countAsWorkedTime: false },
          },
        },
        {
          id: 'default-pt',
          name: 'Part Time',
          priority: 'NORMAL',
          employmentType: 'part_time',
          workLimits: {
            ...defaultWorkLimits,
            minutesPerPeriod: { enabled: true, period: 'WEEK', minMinutes: 0, maxMinutes: 1520, satisfiability: 'REQUIRED' },
            daysPerPeriod: { enabled: true, period: 'WEEK', minDays: 0, maxDays: 4, satisfiability: 'REQUIRED' },
          },
          timeOffRules: defaultTimeOff,
          shiftPatterns: {
            enabled: true,
            minTimeBetweenShiftsMinutes: 600,
            shiftRotations: { enabled: false, enforceRotationPattern: false },
            splitShifts: { enabled: false, minGapBetweenPartsMinutes: 60, maxGapBetweenPartsMinutes: 240 },
            onCallShifts: { enabled: false, countAsWorkedTime: false },
          },
        },
        defaultCasualContract,
        defaultAgencyContract,
      ],
    },
    availability: {
      enabled: true,
      respectUnavailability: true,
      preferAvailableSlots: true,
      allowPreferences: true,
      preferenceWeight: 50,
    },
    priority: {
      enabled: false,
      priorityLevels: ['CRITICAL', 'HIGH', 'NORMAL', 'LOW'],
      higherPriorityWeight: 2,
    },
    pairing: { enabled: false, pairs: [] },
    travel: {
      enabled: false,
      maxTravelDistanceKm: 50,
      satisfiability: 'PREFERRED',
      minTimeBetweenShiftsIncludingTravelMinutes: 60,
      minimizeTravelDistance: true,
      maxLocationsPerPeriod: { enabled: false, period: 'WEEK', maxLocations: 3 },
    },
    breaks: {
      enabled: true,
      deductBreaksFromWorkedTime: true,
      defaultBreakRules: { minShiftDurationForBreakMinutes: 300, breakDurationMinutes: 30 },
    },
    activation: {
      enabled: false,
      minimizeActivatedEmployees: false,
      maximizeActivatedSaturation: false,
      activationRatio: { enabled: false, employeeGroup1: '', employeeGroup2: '', minRatio: 0, maxRatio: 1 },
    },
    fairness: {
      enabled: true,
      balanceTimeWorked: { enabled: true, weight: 50 },
      balanceShiftCount: { enabled: true, weight: 50 },
    },
    shiftTypeDiversity: {
      enabled: false,
      limitShiftTypePerPeriod: { enabled: false, period: 'WEEK', maxShiftTypesPerEmployee: 3 },
    },
  },
  shiftConstraints: {
    alternativeShifts: { enabled: false, allowShiftGroups: false, maxAlternativesPerGroup: 4 },
    costManagement: {
      enabled: true,
      costGroups: { enabled: false, minimizeCostGroupUsage: false },
      employeeRates: { enabled: true, preferLowerCostEmployees: true, weight: 30 },
    },
    demandScheduling: {
      enabled: true,
      mode: 'shift_slot',
      hourlyDemand: { enabled: false, allowOverstaffing: false, allowUnderstaffing: false, overstaffingPenaltyWeight: 50, understaffingPenaltyWeight: 80 },
    },
    shiftPriority: {
      enabled: true,
      usePriorities: true,
      mandatoryShiftsMustBeAssigned: true,
      optionalShiftsCanBeSkipped: true,
    },
    skills: {
      enabled: true,
      requiredSkillsEnforced: true,
      preferredSkillsWeight: 40,
      skillMatchStrategy: 'ALL',
      riskFactors: { enabled: false, prohibitHighRisk: true, penalizeModerateRisk: true },
    },
    shiftSelection: {
      enabled: false,
      shiftsWorkedPerPeriod: { enabled: false, period: 'WEEK', minShifts: 0, maxShifts: 5, satisfiability: 'PREFERRED' },
      limitByEmployeeType: { enabled: false },
      limitByShiftType: { enabled: false },
      concurrentShiftRules: { enabled: false, maxConcurrentShifts: 1, resourceLimited: false },
    },
    employeeSelection: {
      enabled: false,
      preferredEmployees: true,
      unpreferredEmployees: true,
      prohibitedEmployees: true,
    },
  },
};

// ============= Labels =============

export const constraintCategoryLabels = {
  // Employee
  contracts: 'Employee Contracts',
  availability: 'Employee Availability',
  priority: 'Employee Priority',
  pairing: 'Pairing Employees',
  travel: 'Shift Travel & Locations',
  breaks: 'Shift Breaks',
  activation: 'Employee Activation',
  fairness: 'Fairness',
  shiftTypeDiversity: 'Shift Type Diversity',
  // Shift
  alternativeShifts: 'Alternative Shifts',
  costManagement: 'Cost Management',
  demandScheduling: 'Demand-Based Scheduling',
  shiftPriority: 'Mandatory & Optional Shifts',
  skills: 'Skills & Risk Factors',
  shiftSelection: 'Shift Selection',
  employeeSelection: 'Employee Selection',
} as const;

export const constraintCategoryDescriptions = {
  contracts: 'Define work limits, time off rules, and shift patterns per contract type',
  availability: 'Respect employee availability windows and scheduling preferences',
  priority: 'Assign priority levels to employees for preference weighting',
  pairing: 'Configure required, preferred, unpreferred, or prohibited employee pairings',
  travel: 'Manage travel distances between shifts and location limits',
  breaks: 'Define break rules and deduction from worked time',
  activation: 'Optimize which employees are activated and their utilization',
  fairness: 'Balance workload distribution across employees',
  shiftTypeDiversity: 'Limit the variety of shift types assigned per employee',
  alternativeShifts: 'Allow flexible time slots for shifts within groups',
  costManagement: 'Optimize labor costs with cost groups and employee rates',
  demandScheduling: 'Schedule based on hourly demand curves vs fixed shift slots',
  shiftPriority: 'Set mandatory/optional status and priority levels for shifts',
  skills: 'Match required/preferred skills and manage risk factors',
  shiftSelection: 'Control shift counts per period and concurrent shift limits',
  employeeSelection: 'Set preferred, unpreferred, or prohibited employees per shift',
} as const;

export const constraintCategoryIcons = {
  contracts: 'FileText',
  availability: 'CalendarCheck',
  priority: 'Star',
  pairing: 'Users',
  travel: 'MapPin',
  breaks: 'Coffee',
  activation: 'UserCheck',
  fairness: 'Scale',
  shiftTypeDiversity: 'Layers',
  alternativeShifts: 'ArrowLeftRight',
  costManagement: 'DollarSign',
  demandScheduling: 'TrendingUp',
  shiftPriority: 'AlertTriangle',
  skills: 'Award',
  shiftSelection: 'ListChecks',
  employeeSelection: 'UserPlus',
} as const;
