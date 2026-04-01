/**
 * Industry Preset Configurations for Timefold Constraint Configuration
 * Pre-fills constraint values based on industry best practices
 */

import {
  TimefoldConstraintConfiguration,
  defaultConstraintConfig,
  defaultWorkLimits,
  defaultTimeOff,
  defaultCasualWorkLimits,
  defaultAgencyWorkLimits,
} from './timefoldConstraintConfig';

export interface IndustryPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  highlights: string[];
  config: TimefoldConstraintConfiguration;
}

// ============= CHILDCARE =============

const childcarePreset: TimefoldConstraintConfiguration = {
  employeeConstraints: {
    contracts: {
      enabled: true,
      contracts: [
        {
          id: 'childcare-ft',
          name: 'Full Time Educator',
          priority: 'NORMAL',
          employmentType: 'full_time',
          workLimits: {
            ...defaultWorkLimits,
            minutesPerPeriod: { enabled: true, period: 'WEEK', minMinutes: 1520, maxMinutes: 2280, satisfiability: 'REQUIRED' },
            daysPerPeriod: { enabled: true, period: 'WEEK', minDays: 4, maxDays: 5, satisfiability: 'REQUIRED' },
            consecutiveDaysWorked: { enabled: true, maxConsecutiveDays: 5, satisfiability: 'REQUIRED' },
            weekendLimits: { enabled: false, maxWeekendsPerPeriod: 0, period: 'MONTH', maxConsecutiveWeekends: 0, maxWeekendMinutes: 0 },
            minutesRollingWindow: { enabled: false, windowDays: 7, satisfiability: 'PREFERRED' },
            daysRollingWindow: { enabled: false, windowDays: 14, satisfiability: 'PREFERRED' },
            shiftsPerPeriod: { enabled: false, period: 'WEEK', satisfiability: 'PREFERRED' },
          },
          timeOffRules: {
            enabled: true,
            minTimeBetweenShiftsMinutes: 660, // 11 hours
            consecutiveDaysOff: { enabled: true, minConsecutiveDaysOff: 2, period: 'WEEK', satisfiability: 'REQUIRED' },
            daysOffPerPeriod: { enabled: true, period: 'WEEK', minDaysOff: 2, satisfiability: 'REQUIRED' },
          },
          shiftPatterns: {
            enabled: true,
            minTimeBetweenShiftsMinutes: 660,
            shiftRotations: { enabled: true, enforceRotationPattern: false },
            splitShifts: { enabled: false, minGapBetweenPartsMinutes: 60, maxGapBetweenPartsMinutes: 240 },
            onCallShifts: { enabled: false, countAsWorkedTime: false },
          },
        },
        {
          id: 'childcare-pt',
          name: 'Part Time Educator',
          priority: 'NORMAL',
          employmentType: 'part_time',
          workLimits: {
            ...defaultWorkLimits,
            minutesPerPeriod: { enabled: true, period: 'WEEK', minMinutes: 480, maxMinutes: 1520, satisfiability: 'REQUIRED' },
            daysPerPeriod: { enabled: true, period: 'WEEK', minDays: 2, maxDays: 4, satisfiability: 'REQUIRED' },
            consecutiveDaysWorked: { enabled: true, maxConsecutiveDays: 5, satisfiability: 'REQUIRED' },
            weekendLimits: { enabled: false, maxWeekendsPerPeriod: 0, period: 'MONTH', maxConsecutiveWeekends: 0, maxWeekendMinutes: 0 },
            minutesRollingWindow: { enabled: false, windowDays: 7, satisfiability: 'PREFERRED' },
            daysRollingWindow: { enabled: false, windowDays: 14, satisfiability: 'PREFERRED' },
            shiftsPerPeriod: { enabled: false, period: 'WEEK', satisfiability: 'PREFERRED' },
          },
          timeOffRules: defaultTimeOff,
          shiftPatterns: {
            enabled: true,
            minTimeBetweenShiftsMinutes: 660,
            shiftRotations: { enabled: false, enforceRotationPattern: false },
            splitShifts: { enabled: false, minGapBetweenPartsMinutes: 60, maxGapBetweenPartsMinutes: 240 },
            onCallShifts: { enabled: false, countAsWorkedTime: false },
          },
        },
        {
          id: 'childcare-casual',
          name: 'Casual Educator',
          priority: 'LOW',
          employmentType: 'casual',
          workLimits: {
            ...defaultCasualWorkLimits,
            consecutiveDaysWorked: { enabled: true, maxConsecutiveDays: 5, satisfiability: 'REQUIRED' },
          },
          timeOffRules: {
            enabled: true,
            minTimeBetweenShiftsMinutes: 600,
            consecutiveDaysOff: { enabled: false, minConsecutiveDaysOff: 1, period: 'WEEK', satisfiability: 'PREFERRED' },
            daysOffPerPeriod: { enabled: false, period: 'WEEK', minDaysOff: 1, satisfiability: 'PREFERRED' },
          },
          shiftPatterns: {
            enabled: true,
            minTimeBetweenShiftsMinutes: 600,
            shiftRotations: { enabled: false, enforceRotationPattern: false },
            splitShifts: { enabled: false, minGapBetweenPartsMinutes: 60, maxGapBetweenPartsMinutes: 240 },
            onCallShifts: { enabled: false, countAsWorkedTime: false },
          },
        },
        {
          id: 'childcare-agency',
          name: 'Agency Relief Educator',
          priority: 'LOW',
          employmentType: 'agency',
          workLimits: {
            ...defaultAgencyWorkLimits,
            consecutiveDaysWorked: { enabled: true, maxConsecutiveDays: 5, satisfiability: 'PREFERRED' },
          },
          timeOffRules: {
            enabled: true,
            minTimeBetweenShiftsMinutes: 600,
            consecutiveDaysOff: { enabled: false, minConsecutiveDaysOff: 1, period: 'WEEK', satisfiability: 'PREFERRED' },
            daysOffPerPeriod: { enabled: false, period: 'WEEK', minDaysOff: 1, satisfiability: 'PREFERRED' },
          },
          shiftPatterns: {
            enabled: true,
            minTimeBetweenShiftsMinutes: 600,
            shiftRotations: { enabled: false, enforceRotationPattern: false },
            splitShifts: { enabled: false, minGapBetweenPartsMinutes: 60, maxGapBetweenPartsMinutes: 240 },
            onCallShifts: { enabled: false, countAsWorkedTime: false },
          },
        },
      ],
    },
    availability: { enabled: true, respectUnavailability: true, preferAvailableSlots: true, allowPreferences: true, preferenceWeight: 60 },
    priority: { enabled: true, priorityLevels: ['CRITICAL', 'HIGH', 'NORMAL', 'LOW'], higherPriorityWeight: 3 },
    pairing: { enabled: false, pairs: [] },
    travel: { enabled: false, maxTravelDistanceKm: 30, satisfiability: 'PREFERRED', minTimeBetweenShiftsIncludingTravelMinutes: 60, minimizeTravelDistance: true, maxLocationsPerPeriod: { enabled: false, period: 'WEEK', maxLocations: 2 } },
    breaks: { enabled: true, deductBreaksFromWorkedTime: true, defaultBreakRules: { minShiftDurationForBreakMinutes: 300, breakDurationMinutes: 30 } },
    activation: { enabled: false, minimizeActivatedEmployees: false, maximizeActivatedSaturation: false, activationRatio: { enabled: true, employeeGroup1: 'qualified_educators', employeeGroup2: 'total_educators', minRatio: 0.5, maxRatio: 1 } },
    fairness: { enabled: true, balanceTimeWorked: { enabled: true, weight: 60 }, balanceShiftCount: { enabled: true, weight: 55 } },
    shiftTypeDiversity: { enabled: false, limitShiftTypePerPeriod: { enabled: false, period: 'WEEK', maxShiftTypesPerEmployee: 2 } },
  },
  shiftConstraints: {
    alternativeShifts: { enabled: false, allowShiftGroups: false, maxAlternativesPerGroup: 4 },
    costManagement: { enabled: true, costGroups: { enabled: false, minimizeCostGroupUsage: false }, employeeRates: { enabled: true, preferLowerCostEmployees: false, weight: 20 } },
    demandScheduling: { enabled: true, mode: 'shift_slot', hourlyDemand: { enabled: false, allowOverstaffing: false, allowUnderstaffing: false, overstaffingPenaltyWeight: 70, understaffingPenaltyWeight: 95 } },
    shiftPriority: { enabled: true, usePriorities: true, mandatoryShiftsMustBeAssigned: true, optionalShiftsCanBeSkipped: false },
    skills: { enabled: true, requiredSkillsEnforced: true, preferredSkillsWeight: 70, skillMatchStrategy: 'ALL', riskFactors: { enabled: true, prohibitHighRisk: true, penalizeModerateRisk: true } },
    shiftSelection: { enabled: false, shiftsWorkedPerPeriod: { enabled: false, period: 'WEEK', satisfiability: 'PREFERRED' }, limitByEmployeeType: { enabled: false }, limitByShiftType: { enabled: false }, concurrentShiftRules: { enabled: false, maxConcurrentShifts: 1, resourceLimited: false } },
    employeeSelection: { enabled: false, preferredEmployees: true, unpreferredEmployees: true, prohibitedEmployees: true },
  },
};

// ============= HEALTHCARE =============

const healthcarePreset: TimefoldConstraintConfiguration = {
  employeeConstraints: {
    contracts: {
      enabled: true,
      contracts: [
        {
          id: 'healthcare-rn',
          name: 'Registered Nurse',
          priority: 'HIGH',
          employmentType: 'full_time',
          workLimits: {
            ...defaultWorkLimits,
            minutesPerPeriod: { enabled: true, period: 'WEEK', minMinutes: 1920, maxMinutes: 2400, satisfiability: 'REQUIRED' },
            daysPerPeriod: { enabled: true, period: 'WEEK', minDays: 3, maxDays: 5, satisfiability: 'REQUIRED' },
            consecutiveDaysWorked: { enabled: true, maxConsecutiveDays: 4, satisfiability: 'REQUIRED' },
            weekendLimits: { enabled: true, maxWeekendsPerPeriod: 2, period: 'MONTH', maxConsecutiveWeekends: 2, maxWeekendMinutes: 1440 },
            minutesRollingWindow: { enabled: true, windowDays: 14, minMinutes: 0, maxMinutes: 4800, satisfiability: 'REQUIRED' },
            daysRollingWindow: { enabled: false, windowDays: 14, satisfiability: 'PREFERRED' },
            shiftsPerPeriod: { enabled: true, period: 'WEEK', minShifts: 3, maxShifts: 5, satisfiability: 'REQUIRED' },
          },
          timeOffRules: {
            enabled: true,
            minTimeBetweenShiftsMinutes: 660, // 11 hours mandatory
            consecutiveDaysOff: { enabled: true, minConsecutiveDaysOff: 2, period: 'WEEK', satisfiability: 'REQUIRED' },
            daysOffPerPeriod: { enabled: true, period: 'WEEK', minDaysOff: 2, satisfiability: 'REQUIRED' },
          },
          shiftPatterns: {
            enabled: true,
            minTimeBetweenShiftsMinutes: 660,
            shiftRotations: { enabled: true, enforceRotationPattern: true },
            splitShifts: { enabled: false, minGapBetweenPartsMinutes: 60, maxGapBetweenPartsMinutes: 240 },
            onCallShifts: { enabled: true, countAsWorkedTime: false },
          },
        },
        {
          id: 'healthcare-en',
          name: 'Enrolled Nurse',
          priority: 'NORMAL',
          employmentType: 'full_time',
          workLimits: {
            ...defaultWorkLimits,
            minutesPerPeriod: { enabled: true, period: 'WEEK', minMinutes: 1920, maxMinutes: 2400, satisfiability: 'REQUIRED' },
            daysPerPeriod: { enabled: true, period: 'WEEK', minDays: 3, maxDays: 5, satisfiability: 'REQUIRED' },
            consecutiveDaysWorked: { enabled: true, maxConsecutiveDays: 5, satisfiability: 'REQUIRED' },
            weekendLimits: { enabled: true, maxWeekendsPerPeriod: 2, period: 'MONTH', maxConsecutiveWeekends: 2, maxWeekendMinutes: 1440 },
            minutesRollingWindow: { enabled: false, windowDays: 14, satisfiability: 'PREFERRED' },
            daysRollingWindow: { enabled: false, windowDays: 14, satisfiability: 'PREFERRED' },
            shiftsPerPeriod: { enabled: false, period: 'WEEK', satisfiability: 'PREFERRED' },
          },
          timeOffRules: defaultTimeOff,
          shiftPatterns: {
            enabled: true,
            minTimeBetweenShiftsMinutes: 660,
            shiftRotations: { enabled: true, enforceRotationPattern: false },
            splitShifts: { enabled: false, minGapBetweenPartsMinutes: 60, maxGapBetweenPartsMinutes: 240 },
            onCallShifts: { enabled: true, countAsWorkedTime: false },
          },
        },
        {
          id: 'healthcare-casual',
          name: 'Casual Nurse / HCA',
          priority: 'LOW',
          employmentType: 'casual',
          workLimits: {
            ...defaultCasualWorkLimits,
            consecutiveDaysWorked: { enabled: true, maxConsecutiveDays: 5, satisfiability: 'REQUIRED' },
            weekendLimits: { enabled: true, maxWeekendsPerPeriod: 3, period: 'MONTH', maxConsecutiveWeekends: 3, maxWeekendMinutes: 1440 },
          },
          timeOffRules: { enabled: true, minTimeBetweenShiftsMinutes: 600, consecutiveDaysOff: { enabled: false, minConsecutiveDaysOff: 1, period: 'WEEK', satisfiability: 'PREFERRED' }, daysOffPerPeriod: { enabled: false, period: 'WEEK', minDaysOff: 1, satisfiability: 'PREFERRED' } },
          shiftPatterns: { enabled: true, minTimeBetweenShiftsMinutes: 600, shiftRotations: { enabled: false, enforceRotationPattern: false }, splitShifts: { enabled: false, minGapBetweenPartsMinutes: 60, maxGapBetweenPartsMinutes: 240 }, onCallShifts: { enabled: true, countAsWorkedTime: false } },
        },
        {
          id: 'healthcare-agency',
          name: 'Agency Nurse',
          priority: 'LOW',
          employmentType: 'agency',
          workLimits: {
            ...defaultAgencyWorkLimits,
            consecutiveDaysWorked: { enabled: true, maxConsecutiveDays: 4, satisfiability: 'PREFERRED' },
          },
          timeOffRules: { enabled: true, minTimeBetweenShiftsMinutes: 660, consecutiveDaysOff: { enabled: false, minConsecutiveDaysOff: 1, period: 'WEEK', satisfiability: 'PREFERRED' }, daysOffPerPeriod: { enabled: false, period: 'WEEK', minDaysOff: 1, satisfiability: 'PREFERRED' } },
          shiftPatterns: { enabled: true, minTimeBetweenShiftsMinutes: 660, shiftRotations: { enabled: false, enforceRotationPattern: false }, splitShifts: { enabled: false, minGapBetweenPartsMinutes: 60, maxGapBetweenPartsMinutes: 240 }, onCallShifts: { enabled: true, countAsWorkedTime: false } },
        },
      ],
    },
    availability: { enabled: true, respectUnavailability: true, preferAvailableSlots: true, allowPreferences: true, preferenceWeight: 70 },
    priority: { enabled: true, priorityLevels: ['CRITICAL', 'HIGH', 'NORMAL', 'LOW'], higherPriorityWeight: 3 },
    pairing: { enabled: true, pairs: [] },
    travel: { enabled: true, maxTravelDistanceKm: 50, satisfiability: 'PREFERRED', minTimeBetweenShiftsIncludingTravelMinutes: 90, minimizeTravelDistance: true, maxLocationsPerPeriod: { enabled: true, period: 'WEEK', maxLocations: 2 } },
    breaks: { enabled: true, deductBreaksFromWorkedTime: true, defaultBreakRules: { minShiftDurationForBreakMinutes: 300, breakDurationMinutes: 30 } },
    activation: { enabled: true, minimizeActivatedEmployees: false, maximizeActivatedSaturation: true, activationRatio: { enabled: true, employeeGroup1: 'registered_nurses', employeeGroup2: 'total_nursing', minRatio: 0.3, maxRatio: 1 } },
    fairness: { enabled: true, balanceTimeWorked: { enabled: true, weight: 70 }, balanceShiftCount: { enabled: true, weight: 65 } },
    shiftTypeDiversity: { enabled: true, limitShiftTypePerPeriod: { enabled: true, period: 'WEEK', maxShiftTypesPerEmployee: 2 } },
  },
  shiftConstraints: {
    alternativeShifts: { enabled: true, allowShiftGroups: true, maxAlternativesPerGroup: 3 },
    costManagement: { enabled: true, costGroups: { enabled: true, minimizeCostGroupUsage: true }, employeeRates: { enabled: true, preferLowerCostEmployees: true, weight: 40 } },
    demandScheduling: { enabled: true, mode: 'hourly_demand', hourlyDemand: { enabled: true, allowOverstaffing: false, allowUnderstaffing: false, overstaffingPenaltyWeight: 60, understaffingPenaltyWeight: 95 } },
    shiftPriority: { enabled: true, usePriorities: true, mandatoryShiftsMustBeAssigned: true, optionalShiftsCanBeSkipped: true },
    skills: { enabled: true, requiredSkillsEnforced: true, preferredSkillsWeight: 80, skillMatchStrategy: 'ALL', riskFactors: { enabled: true, prohibitHighRisk: true, penalizeModerateRisk: true } },
    shiftSelection: { enabled: true, shiftsWorkedPerPeriod: { enabled: true, period: 'WEEK', minShifts: 3, maxShifts: 5, satisfiability: 'REQUIRED' }, limitByEmployeeType: { enabled: true }, limitByShiftType: { enabled: true }, concurrentShiftRules: { enabled: true, maxConcurrentShifts: 1, resourceLimited: true } },
    employeeSelection: { enabled: true, preferredEmployees: true, unpreferredEmployees: true, prohibitedEmployees: true },
  },
};

// ============= RETAIL =============

const retailPreset: TimefoldConstraintConfiguration = {
  employeeConstraints: {
    contracts: {
      enabled: true,
      contracts: [
        {
          id: 'retail-ft',
          name: 'Full Time Sales',
          priority: 'NORMAL',
          employmentType: 'full_time',
          workLimits: {
            ...defaultWorkLimits,
            minutesPerPeriod: { enabled: true, period: 'WEEK', minMinutes: 1920, maxMinutes: 2280, satisfiability: 'REQUIRED' },
            daysPerPeriod: { enabled: true, period: 'WEEK', minDays: 4, maxDays: 5, satisfiability: 'REQUIRED' },
            consecutiveDaysWorked: { enabled: true, maxConsecutiveDays: 6, satisfiability: 'REQUIRED' },
            weekendLimits: { enabled: true, maxWeekendsPerPeriod: 3, period: 'MONTH', maxConsecutiveWeekends: 3, maxWeekendMinutes: 1440 },
            minutesRollingWindow: { enabled: false, windowDays: 7, satisfiability: 'PREFERRED' },
            daysRollingWindow: { enabled: false, windowDays: 14, satisfiability: 'PREFERRED' },
            shiftsPerPeriod: { enabled: false, period: 'WEEK', satisfiability: 'PREFERRED' },
          },
          timeOffRules: {
            enabled: true,
            minTimeBetweenShiftsMinutes: 600, // 10 hours
            consecutiveDaysOff: { enabled: true, minConsecutiveDaysOff: 1, period: 'WEEK', satisfiability: 'PREFERRED' },
            daysOffPerPeriod: { enabled: true, period: 'WEEK', minDaysOff: 2, satisfiability: 'PREFERRED' },
          },
          shiftPatterns: {
            enabled: true,
            minTimeBetweenShiftsMinutes: 600,
            shiftRotations: { enabled: false, enforceRotationPattern: false },
            splitShifts: { enabled: true, minGapBetweenPartsMinutes: 60, maxGapBetweenPartsMinutes: 180 },
            onCallShifts: { enabled: false, countAsWorkedTime: false },
          },
        },
        {
          id: 'retail-casual',
          name: 'Casual Staff',
          priority: 'LOW',
          employmentType: 'casual',
          workLimits: {
            ...defaultWorkLimits,
            minutesPerPeriod: { enabled: true, period: 'WEEK', minMinutes: 0, maxMinutes: 2280, satisfiability: 'REQUIRED' },
            daysPerPeriod: { enabled: true, period: 'WEEK', minDays: 0, maxDays: 5, satisfiability: 'PREFERRED' },
            consecutiveDaysWorked: { enabled: true, maxConsecutiveDays: 6, satisfiability: 'REQUIRED' },
            weekendLimits: { enabled: false, maxWeekendsPerPeriod: 4, period: 'MONTH', maxConsecutiveWeekends: 4, maxWeekendMinutes: 1920 },
            minutesRollingWindow: { enabled: false, windowDays: 7, satisfiability: 'PREFERRED' },
            daysRollingWindow: { enabled: false, windowDays: 14, satisfiability: 'PREFERRED' },
            shiftsPerPeriod: { enabled: false, period: 'WEEK', satisfiability: 'PREFERRED' },
          },
          timeOffRules: { ...defaultTimeOff, minTimeBetweenShiftsMinutes: 480 },
          shiftPatterns: {
            enabled: true,
            minTimeBetweenShiftsMinutes: 480,
            shiftRotations: { enabled: false, enforceRotationPattern: false },
            splitShifts: { enabled: true, minGapBetweenPartsMinutes: 60, maxGapBetweenPartsMinutes: 180 },
            onCallShifts: { enabled: false, countAsWorkedTime: false },
          },
        },
        {
          id: 'retail-agency',
          name: 'Agency / Temp Staff',
          priority: 'LOW',
          employmentType: 'agency',
          workLimits: { ...defaultAgencyWorkLimits, consecutiveDaysWorked: { enabled: true, maxConsecutiveDays: 6, satisfiability: 'PREFERRED' } },
          timeOffRules: { enabled: true, minTimeBetweenShiftsMinutes: 480, consecutiveDaysOff: { enabled: false, minConsecutiveDaysOff: 1, period: 'WEEK', satisfiability: 'PREFERRED' }, daysOffPerPeriod: { enabled: false, period: 'WEEK', minDaysOff: 1, satisfiability: 'PREFERRED' } },
          shiftPatterns: { enabled: true, minTimeBetweenShiftsMinutes: 480, shiftRotations: { enabled: false, enforceRotationPattern: false }, splitShifts: { enabled: true, minGapBetweenPartsMinutes: 60, maxGapBetweenPartsMinutes: 180 }, onCallShifts: { enabled: false, countAsWorkedTime: false } },
        },
      ],
    },
    availability: { enabled: true, respectUnavailability: true, preferAvailableSlots: true, allowPreferences: true, preferenceWeight: 40 },
    priority: { enabled: false, priorityLevels: ['CRITICAL', 'HIGH', 'NORMAL', 'LOW'], higherPriorityWeight: 2 },
    pairing: { enabled: false, pairs: [] },
    travel: { enabled: false, maxTravelDistanceKm: 30, satisfiability: 'PREFERRED', minTimeBetweenShiftsIncludingTravelMinutes: 60, minimizeTravelDistance: true, maxLocationsPerPeriod: { enabled: false, period: 'WEEK', maxLocations: 3 } },
    breaks: { enabled: true, deductBreaksFromWorkedTime: true, defaultBreakRules: { minShiftDurationForBreakMinutes: 300, breakDurationMinutes: 30 } },
    activation: { enabled: false, minimizeActivatedEmployees: false, maximizeActivatedSaturation: false, activationRatio: { enabled: false, employeeGroup1: '', employeeGroup2: '', minRatio: 0, maxRatio: 1 } },
    fairness: { enabled: true, balanceTimeWorked: { enabled: true, weight: 45 }, balanceShiftCount: { enabled: true, weight: 50 } },
    shiftTypeDiversity: { enabled: false, limitShiftTypePerPeriod: { enabled: false, period: 'WEEK', maxShiftTypesPerEmployee: 3 } },
  },
  shiftConstraints: {
    alternativeShifts: { enabled: false, allowShiftGroups: false, maxAlternativesPerGroup: 4 },
    costManagement: { enabled: true, costGroups: { enabled: true, minimizeCostGroupUsage: true }, employeeRates: { enabled: true, preferLowerCostEmployees: true, weight: 70 } },
    demandScheduling: { enabled: true, mode: 'hourly_demand', hourlyDemand: { enabled: true, allowOverstaffing: false, allowUnderstaffing: true, overstaffingPenaltyWeight: 80, understaffingPenaltyWeight: 60 } },
    shiftPriority: { enabled: true, usePriorities: true, mandatoryShiftsMustBeAssigned: true, optionalShiftsCanBeSkipped: true },
    skills: { enabled: true, requiredSkillsEnforced: false, preferredSkillsWeight: 30, skillMatchStrategy: 'ANY', riskFactors: { enabled: false, prohibitHighRisk: false, penalizeModerateRisk: false } },
    shiftSelection: { enabled: false, shiftsWorkedPerPeriod: { enabled: false, period: 'WEEK', satisfiability: 'PREFERRED' }, limitByEmployeeType: { enabled: false }, limitByShiftType: { enabled: false }, concurrentShiftRules: { enabled: false, maxConcurrentShifts: 1, resourceLimited: false } },
    employeeSelection: { enabled: false, preferredEmployees: true, unpreferredEmployees: false, prohibitedEmployees: true },
  },
};

// ============= HOSPITALITY =============

const hospitalityPreset: TimefoldConstraintConfiguration = {
  employeeConstraints: {
    contracts: {
      enabled: true,
      contracts: [
        {
          id: 'hosp-ft',
          name: 'Full Time Staff',
          priority: 'NORMAL',
          employmentType: 'full_time',
          workLimits: {
            ...defaultWorkLimits,
            minutesPerPeriod: { enabled: true, period: 'WEEK', minMinutes: 1920, maxMinutes: 2280, satisfiability: 'REQUIRED' },
            daysPerPeriod: { enabled: true, period: 'WEEK', minDays: 4, maxDays: 5, satisfiability: 'REQUIRED' },
            consecutiveDaysWorked: { enabled: true, maxConsecutiveDays: 6, satisfiability: 'REQUIRED' },
            weekendLimits: { enabled: true, maxWeekendsPerPeriod: 3, period: 'MONTH', maxConsecutiveWeekends: 3, maxWeekendMinutes: 1440 },
            minutesRollingWindow: { enabled: false, windowDays: 7, satisfiability: 'PREFERRED' },
            daysRollingWindow: { enabled: false, windowDays: 14, satisfiability: 'PREFERRED' },
            shiftsPerPeriod: { enabled: false, period: 'WEEK', satisfiability: 'PREFERRED' },
          },
          timeOffRules: {
            enabled: true,
            minTimeBetweenShiftsMinutes: 600,
            consecutiveDaysOff: { enabled: true, minConsecutiveDaysOff: 1, period: 'WEEK', satisfiability: 'PREFERRED' },
            daysOffPerPeriod: { enabled: true, period: 'WEEK', minDaysOff: 2, satisfiability: 'PREFERRED' },
          },
          shiftPatterns: {
            enabled: true,
            minTimeBetweenShiftsMinutes: 600,
            shiftRotations: { enabled: true, enforceRotationPattern: false },
            splitShifts: { enabled: true, minGapBetweenPartsMinutes: 60, maxGapBetweenPartsMinutes: 240 },
            onCallShifts: { enabled: false, countAsWorkedTime: false },
          },
        },
        {
          id: 'hosp-casual',
          name: 'Casual / On-Call',
          priority: 'LOW',
          employmentType: 'casual',
          workLimits: {
            ...defaultWorkLimits,
            minutesPerPeriod: { enabled: true, period: 'WEEK', minMinutes: 0, maxMinutes: 2400, satisfiability: 'PREFERRED' },
            daysPerPeriod: { enabled: true, period: 'WEEK', minDays: 0, maxDays: 6, satisfiability: 'PREFERRED' },
            consecutiveDaysWorked: { enabled: true, maxConsecutiveDays: 6, satisfiability: 'REQUIRED' },
            weekendLimits: { enabled: false, maxWeekendsPerPeriod: 4, period: 'MONTH', maxConsecutiveWeekends: 4, maxWeekendMinutes: 1920 },
            minutesRollingWindow: { enabled: false, windowDays: 7, satisfiability: 'PREFERRED' },
            daysRollingWindow: { enabled: false, windowDays: 14, satisfiability: 'PREFERRED' },
            shiftsPerPeriod: { enabled: false, period: 'WEEK', satisfiability: 'PREFERRED' },
          },
          timeOffRules: { ...defaultTimeOff, minTimeBetweenShiftsMinutes: 480 },
          shiftPatterns: {
            enabled: true,
            minTimeBetweenShiftsMinutes: 480,
            shiftRotations: { enabled: false, enforceRotationPattern: false },
            splitShifts: { enabled: true, minGapBetweenPartsMinutes: 30, maxGapBetweenPartsMinutes: 300 },
            onCallShifts: { enabled: true, countAsWorkedTime: false },
          },
        },
      ],
    },
    availability: { enabled: true, respectUnavailability: true, preferAvailableSlots: true, allowPreferences: true, preferenceWeight: 50 },
    priority: { enabled: false, priorityLevels: ['CRITICAL', 'HIGH', 'NORMAL', 'LOW'], higherPriorityWeight: 2 },
    pairing: { enabled: true, pairs: [] },
    travel: { enabled: false, maxTravelDistanceKm: 30, satisfiability: 'PREFERRED', minTimeBetweenShiftsIncludingTravelMinutes: 60, minimizeTravelDistance: true, maxLocationsPerPeriod: { enabled: false, period: 'WEEK', maxLocations: 3 } },
    breaks: { enabled: true, deductBreaksFromWorkedTime: true, defaultBreakRules: { minShiftDurationForBreakMinutes: 300, breakDurationMinutes: 30 } },
    activation: { enabled: false, minimizeActivatedEmployees: false, maximizeActivatedSaturation: false, activationRatio: { enabled: false, employeeGroup1: '', employeeGroup2: '', minRatio: 0, maxRatio: 1 } },
    fairness: { enabled: true, balanceTimeWorked: { enabled: true, weight: 40 }, balanceShiftCount: { enabled: true, weight: 45 } },
    shiftTypeDiversity: { enabled: true, limitShiftTypePerPeriod: { enabled: true, period: 'WEEK', maxShiftTypesPerEmployee: 3 } },
  },
  shiftConstraints: {
    alternativeShifts: { enabled: true, allowShiftGroups: true, maxAlternativesPerGroup: 4 },
    costManagement: { enabled: true, costGroups: { enabled: true, minimizeCostGroupUsage: true }, employeeRates: { enabled: true, preferLowerCostEmployees: true, weight: 60 } },
    demandScheduling: { enabled: true, mode: 'hourly_demand', hourlyDemand: { enabled: true, allowOverstaffing: true, allowUnderstaffing: false, overstaffingPenaltyWeight: 40, understaffingPenaltyWeight: 90 } },
    shiftPriority: { enabled: true, usePriorities: true, mandatoryShiftsMustBeAssigned: true, optionalShiftsCanBeSkipped: true },
    skills: { enabled: true, requiredSkillsEnforced: true, preferredSkillsWeight: 50, skillMatchStrategy: 'ANY', riskFactors: { enabled: true, prohibitHighRisk: true, penalizeModerateRisk: false } },
    shiftSelection: { enabled: false, shiftsWorkedPerPeriod: { enabled: false, period: 'WEEK', satisfiability: 'PREFERRED' }, limitByEmployeeType: { enabled: false }, limitByShiftType: { enabled: false }, concurrentShiftRules: { enabled: false, maxConcurrentShifts: 1, resourceLimited: false } },
    employeeSelection: { enabled: true, preferredEmployees: true, unpreferredEmployees: true, prohibitedEmployees: true },
  },
};

// ============= AGED CARE =============

const agedCarePreset: TimefoldConstraintConfiguration = {
  employeeConstraints: {
    contracts: {
      enabled: true,
      contracts: [
        {
          id: 'aged-rn',
          name: 'Registered Nurse (24/7)',
          priority: 'CRITICAL',
          employmentType: 'full_time',
          workLimits: {
            ...defaultWorkLimits,
            minutesPerPeriod: { enabled: true, period: 'WEEK', minMinutes: 1920, maxMinutes: 2400, satisfiability: 'REQUIRED' },
            daysPerPeriod: { enabled: true, period: 'WEEK', minDays: 3, maxDays: 5, satisfiability: 'REQUIRED' },
            consecutiveDaysWorked: { enabled: true, maxConsecutiveDays: 4, satisfiability: 'REQUIRED' },
            weekendLimits: { enabled: true, maxWeekendsPerPeriod: 2, period: 'MONTH', maxConsecutiveWeekends: 2, maxWeekendMinutes: 1440 },
            minutesRollingWindow: { enabled: true, windowDays: 14, minMinutes: 0, maxMinutes: 4800, satisfiability: 'REQUIRED' },
            daysRollingWindow: { enabled: false, windowDays: 14, satisfiability: 'PREFERRED' },
            shiftsPerPeriod: { enabled: true, period: 'WEEK', minShifts: 3, maxShifts: 5, satisfiability: 'REQUIRED' },
          },
          timeOffRules: {
            enabled: true,
            minTimeBetweenShiftsMinutes: 660,
            consecutiveDaysOff: { enabled: true, minConsecutiveDaysOff: 2, period: 'WEEK', satisfiability: 'REQUIRED' },
            daysOffPerPeriod: { enabled: true, period: 'WEEK', minDaysOff: 2, satisfiability: 'REQUIRED' },
          },
          shiftPatterns: {
            enabled: true,
            minTimeBetweenShiftsMinutes: 660,
            shiftRotations: { enabled: true, enforceRotationPattern: true },
            splitShifts: { enabled: false, minGapBetweenPartsMinutes: 60, maxGapBetweenPartsMinutes: 240 },
            onCallShifts: { enabled: true, countAsWorkedTime: false },
          },
        },
        {
          id: 'aged-pcw',
          name: 'Personal Care Worker',
          priority: 'NORMAL',
          employmentType: 'full_time',
          workLimits: {
            ...defaultWorkLimits,
            minutesPerPeriod: { enabled: true, period: 'WEEK', minMinutes: 1920, maxMinutes: 2400, satisfiability: 'REQUIRED' },
            daysPerPeriod: { enabled: true, period: 'WEEK', minDays: 3, maxDays: 5, satisfiability: 'REQUIRED' },
            consecutiveDaysWorked: { enabled: true, maxConsecutiveDays: 5, satisfiability: 'REQUIRED' },
            weekendLimits: { enabled: true, maxWeekendsPerPeriod: 2, period: 'MONTH', maxConsecutiveWeekends: 2, maxWeekendMinutes: 1440 },
            minutesRollingWindow: { enabled: false, windowDays: 14, satisfiability: 'PREFERRED' },
            daysRollingWindow: { enabled: false, windowDays: 14, satisfiability: 'PREFERRED' },
            shiftsPerPeriod: { enabled: false, period: 'WEEK', satisfiability: 'PREFERRED' },
          },
          timeOffRules: defaultTimeOff,
          shiftPatterns: {
            enabled: true,
            minTimeBetweenShiftsMinutes: 600,
            shiftRotations: { enabled: true, enforceRotationPattern: false },
            splitShifts: { enabled: false, minGapBetweenPartsMinutes: 60, maxGapBetweenPartsMinutes: 240 },
            onCallShifts: { enabled: true, countAsWorkedTime: false },
          },
        },
      ],
    },
    availability: { enabled: true, respectUnavailability: true, preferAvailableSlots: true, allowPreferences: true, preferenceWeight: 65 },
    priority: { enabled: true, priorityLevels: ['CRITICAL', 'HIGH', 'NORMAL', 'LOW'], higherPriorityWeight: 3 },
    pairing: { enabled: true, pairs: [] },
    travel: { enabled: true, maxTravelDistanceKm: 40, satisfiability: 'PREFERRED', minTimeBetweenShiftsIncludingTravelMinutes: 90, minimizeTravelDistance: true, maxLocationsPerPeriod: { enabled: true, period: 'WEEK', maxLocations: 2 } },
    breaks: { enabled: true, deductBreaksFromWorkedTime: true, defaultBreakRules: { minShiftDurationForBreakMinutes: 300, breakDurationMinutes: 30 } },
    activation: { enabled: true, minimizeActivatedEmployees: false, maximizeActivatedSaturation: true, activationRatio: { enabled: true, employeeGroup1: 'registered_nurses', employeeGroup2: 'total_care_staff', minRatio: 0.2, maxRatio: 1 } },
    fairness: { enabled: true, balanceTimeWorked: { enabled: true, weight: 65 }, balanceShiftCount: { enabled: true, weight: 60 } },
    shiftTypeDiversity: { enabled: true, limitShiftTypePerPeriod: { enabled: true, period: 'WEEK', maxShiftTypesPerEmployee: 2 } },
  },
  shiftConstraints: {
    alternativeShifts: { enabled: true, allowShiftGroups: true, maxAlternativesPerGroup: 3 },
    costManagement: { enabled: true, costGroups: { enabled: true, minimizeCostGroupUsage: true }, employeeRates: { enabled: true, preferLowerCostEmployees: true, weight: 35 } },
    demandScheduling: { enabled: true, mode: 'hourly_demand', hourlyDemand: { enabled: true, allowOverstaffing: false, allowUnderstaffing: false, overstaffingPenaltyWeight: 50, understaffingPenaltyWeight: 98 } },
    shiftPriority: { enabled: true, usePriorities: true, mandatoryShiftsMustBeAssigned: true, optionalShiftsCanBeSkipped: false },
    skills: { enabled: true, requiredSkillsEnforced: true, preferredSkillsWeight: 85, skillMatchStrategy: 'ALL', riskFactors: { enabled: true, prohibitHighRisk: true, penalizeModerateRisk: true } },
    shiftSelection: { enabled: true, shiftsWorkedPerPeriod: { enabled: true, period: 'WEEK', minShifts: 3, maxShifts: 5, satisfiability: 'REQUIRED' }, limitByEmployeeType: { enabled: true }, limitByShiftType: { enabled: true }, concurrentShiftRules: { enabled: true, maxConcurrentShifts: 1, resourceLimited: true } },
    employeeSelection: { enabled: true, preferredEmployees: true, unpreferredEmployees: true, prohibitedEmployees: true },
  },
};

// ============= REGISTRY =============

export const industryPresets: IndustryPreset[] = [
  {
    id: 'childcare',
    name: 'Childcare',
    icon: '👶',
    description: 'Early childhood education & care with NQF ratio compliance',
    highlights: [
      'Qualified educator ratio enforcement (50%+)',
      'Strict consecutive day limits (max 5)',
      '11-hour minimum rest between shifts',
      'Skills & risk factors mandatory',
      'No weekend work by default',
    ],
    config: childcarePreset,
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    icon: '🏥',
    description: 'Hospitals, clinics & nursing with 24/7 coverage requirements',
    highlights: [
      'Shift rotation enforcement for nursing staff',
      'On-call shift support',
      'Rolling window hour limits (14-day)',
      'Weekend limits (max 2/month)',
      'Hourly demand scheduling mode',
      'Skill match strategy: ALL required',
    ],
    config: healthcarePreset,
  },
  {
    id: 'aged_care',
    name: 'Aged Care',
    icon: '🏠',
    description: 'Residential aged care with AN-ACC care minute requirements',
    highlights: [
      'RN 24/7 coverage (critical priority)',
      'Care staff ratio enforcement',
      'Understaffing penalty: 98% weight',
      'Skill & risk factor enforcement',
      'Shift rotation with on-call support',
      'Multi-location travel management',
    ],
    config: agedCarePreset,
  },
  {
    id: 'retail',
    name: 'Retail',
    icon: '🛒',
    description: 'Retail stores with flexible casual staffing and cost optimization',
    highlights: [
      'High cost optimization weight (70%)',
      'Flexible casual staff contracts',
      'Split shift support',
      'Weekend-heavy scheduling allowed',
      'Skill match: ANY (flexible)',
      'Hourly demand-based scheduling',
    ],
    config: retailPreset,
  },
  {
    id: 'hospitality',
    name: 'Hospitality',
    icon: '🍽️',
    description: 'Hotels, restaurants & cafes with split shifts and variable demand',
    highlights: [
      'Split shift support (30-300 min gap)',
      'On-call casual contracts',
      'Employee pairing enabled',
      'Alternative shift groups',
      'Allows overstaffing for peak demand',
      'Shift type diversity management',
    ],
    config: hospitalityPreset,
  },
];

export const getPresetById = (id: string): IndustryPreset | undefined => 
  industryPresets.find(p => p.id === id);
