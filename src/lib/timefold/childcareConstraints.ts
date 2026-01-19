/**
 * Childcare Industry-Specific Constraints for Timefold Solver
 * 
 * Based on Australian National Quality Framework (NQF), Children's Services Award 2020,
 * and Fair Work regulations for early childhood education and care.
 */

import { TimefoldConstraint, ConstraintCategory, ConstraintLevel } from '../timefoldSolver';

// ============================================================================
// CONSTRAINT CATEGORIES FOR CHILDCARE
// ============================================================================

export type ChildcareConstraintCategory = 
  | ConstraintCategory 
  | 'ratio'           // Staff-to-child ratios
  | 'regulatory'      // NQF/regulatory requirements
  | 'demand'          // Booking and attendance based
  | 'budget'          // Financial constraints
  | 'award';          // Award/pay related

// ============================================================================
// HARD CONSTRAINTS - Must be satisfied (NQF Regulatory)
// ============================================================================

export const nqfRatioConstraints: TimefoldConstraint[] = [
  {
    id: 'nqf-ratio-babies',
    name: 'Babies Room Ratio (1:4)',
    description: 'Maintain 1 educator per 4 children aged 0-2 years as per NQF regulations',
    category: 'capacity',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'Baby',
    parameters: {
      ratio: { key: 'ratio', label: 'Children per educator', type: 'number', value: 4, min: 1, max: 10, description: 'NQF mandated ratio for 0-2 years' },
      ageMin: { key: 'ageMin', label: 'Minimum age (years)', type: 'number', value: 0, min: 0, max: 5 },
      ageMax: { key: 'ageMax', label: 'Maximum age (years)', type: 'number', value: 2, min: 0, max: 5 },
      enforceAtAllTimes: { key: 'enforceAtAllTimes', label: 'Enforce at all times (incl. breaks)', type: 'boolean', value: true },
    },
  },
  {
    id: 'nqf-ratio-toddlers',
    name: 'Toddlers Room Ratio (1:5)',
    description: 'Maintain 1 educator per 5 children aged 2-3 years as per NQF regulations',
    category: 'capacity',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'Users',
    parameters: {
      ratio: { key: 'ratio', label: 'Children per educator', type: 'number', value: 5, min: 1, max: 10 },
      ageMin: { key: 'ageMin', label: 'Minimum age (years)', type: 'number', value: 2, min: 0, max: 5 },
      ageMax: { key: 'ageMax', label: 'Maximum age (years)', type: 'number', value: 3, min: 0, max: 5 },
      enforceAtAllTimes: { key: 'enforceAtAllTimes', label: 'Enforce at all times', type: 'boolean', value: true },
    },
  },
  {
    id: 'nqf-ratio-preschool',
    name: 'Preschool Room Ratio (1:10)',
    description: 'Maintain 1 educator per 10 children aged 3-4 years as per NQF regulations',
    category: 'capacity',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'GraduationCap',
    parameters: {
      ratio: { key: 'ratio', label: 'Children per educator', type: 'number', value: 10, min: 1, max: 15 },
      ageMin: { key: 'ageMin', label: 'Minimum age (years)', type: 'number', value: 3, min: 0, max: 5 },
      ageMax: { key: 'ageMax', label: 'Maximum age (years)', type: 'number', value: 4, min: 0, max: 5 },
    },
  },
  {
    id: 'nqf-ratio-kindy',
    name: 'Kindergarten Room Ratio (1:11)',
    description: 'Maintain 1 educator per 11 children aged 4-5 years as per NQF regulations',
    category: 'capacity',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'School',
    parameters: {
      ratio: { key: 'ratio', label: 'Children per educator', type: 'number', value: 11, min: 1, max: 15 },
      ageMin: { key: 'ageMin', label: 'Minimum age (years)', type: 'number', value: 4, min: 0, max: 6 },
      ageMax: { key: 'ageMax', label: 'Maximum age (years)', type: 'number', value: 5, min: 0, max: 6 },
    },
  },
  {
    id: 'room-capacity-limit',
    name: 'Room Capacity Limit',
    description: 'Never exceed maximum licensed capacity for any room',
    category: 'capacity',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'DoorOpen',
    parameters: {
      enforceStrictly: { key: 'enforceStrictly', label: 'Strict enforcement (no exceptions)', type: 'boolean', value: true },
      capacityBuffer: { key: 'capacityBuffer', label: 'Buffer below capacity', type: 'number', value: 0, min: 0, max: 5, unit: 'children' },
    },
  },
];

export const qualificationConstraints: TimefoldConstraint[] = [
  {
    id: 'qualified-educator-presence',
    name: 'Qualified Educator Present',
    description: 'At least 50% of educators must hold Diploma or higher qualification at all times',
    category: 'qualification',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'Award',
    parameters: {
      minimumPercentage: { key: 'minimumPercentage', label: 'Minimum qualified %', type: 'number', value: 50, min: 25, max: 100, unit: '%' },
      acceptedQualifications: { 
        key: 'acceptedQualifications', 
        label: 'Accepted qualifications', 
        type: 'select', 
        value: 'diploma_or_higher',
        options: [
          { value: 'diploma_or_higher', label: 'Diploma or higher' },
          { value: 'bachelor_only', label: 'Bachelor degree only' },
          { value: 'cert_iii_or_higher', label: 'Certificate III or higher' },
        ]
      },
    },
  },
  {
    id: 'babies-room-diploma',
    name: 'Babies Room Diploma Requirement',
    description: 'Babies room (0-2) requires at least one Diploma-qualified educator at all times',
    category: 'qualification',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'Baby',
    parameters: {
      minimumDiplomaStaff: { key: 'minimumDiplomaStaff', label: 'Minimum Diploma staff', type: 'number', value: 1, min: 1, max: 5 },
      applyToAgeGroup: { key: 'applyToAgeGroup', label: 'Age group', type: 'select', value: 'babies', options: [
        { value: 'babies', label: 'Babies (0-2)' },
        { value: 'toddlers', label: 'Toddlers (2-3)' },
        { value: 'all', label: 'All rooms' },
      ]},
    },
  },
  {
    id: 'early-childhood-teacher',
    name: 'Early Childhood Teacher Requirement',
    description: 'Services with 25+ children require a 4-year qualified ECT for specified hours',
    category: 'qualification',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'GraduationCap',
    parameters: {
      childThreshold: { key: 'childThreshold', label: 'Child count threshold', type: 'number', value: 25, min: 0, max: 100 },
      requiredHoursPerWeek: { key: 'requiredHoursPerWeek', label: 'Required ECT hours/week', type: 'number', value: 20, min: 0, max: 40, unit: 'hours' },
      requireBachelorDegree: { key: 'requireBachelorDegree', label: 'Require Bachelor degree', type: 'boolean', value: true },
    },
  },
  {
    id: 'wwc-check-valid',
    name: 'Working With Children Check',
    description: 'All staff must have valid Working With Children check',
    category: 'qualification',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'ShieldCheck',
    parameters: {
      checkExpiryBuffer: { key: 'checkExpiryBuffer', label: 'Expiry warning buffer', type: 'number', value: 30, min: 7, max: 90, unit: 'days' },
      blockIfExpired: { key: 'blockIfExpired', label: 'Block assignment if expired', type: 'boolean', value: true },
    },
  },
  {
    id: 'first-aid-certified',
    name: 'First Aid Certificate Required',
    description: 'At least one staff member with current First Aid certificate per room',
    category: 'qualification',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'HeartPulse',
    parameters: {
      minimumPerRoom: { key: 'minimumPerRoom', label: 'Minimum per room', type: 'number', value: 1, min: 1, max: 3 },
      includesCPR: { key: 'includesCPR', label: 'Must include CPR', type: 'boolean', value: true },
      includesAnaphylaxis: { key: 'includesAnaphylaxis', label: 'Must include Anaphylaxis', type: 'boolean', value: true },
      includesAsthma: { key: 'includesAsthma', label: 'Must include Asthma', type: 'boolean', value: true },
    },
  },
  {
    id: 'responsible-person-present',
    name: 'Responsible Person In Attendance',
    description: 'A Responsible Person must be present at all times during operating hours',
    category: 'qualification',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'UserCheck',
    parameters: {
      minimumCount: { key: 'minimumCount', label: 'Minimum responsible persons', type: 'number', value: 1, min: 1, max: 3 },
      requireDiploma: { key: 'requireDiploma', label: 'Require Diploma or higher', type: 'boolean', value: true },
    },
  },
];

export const availabilityConstraints: TimefoldConstraint[] = [
  {
    id: 'staff-availability',
    name: 'Staff Availability',
    description: 'Staff must be available during the shift time based on their preferences',
    category: 'availability',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'Calendar',
    parameters: {
      checkDayAvailability: { key: 'checkDayAvailability', label: 'Check day availability', type: 'boolean', value: true },
      checkTimeWindow: { key: 'checkTimeWindow', label: 'Check time window', type: 'boolean', value: true },
      allowPartialOverlap: { key: 'allowPartialOverlap', label: 'Allow partial overlap', type: 'boolean', value: false },
    },
  },
  {
    id: 'no-overlapping-shifts',
    name: 'No Overlapping Shifts',
    description: 'Staff cannot work overlapping shifts at any location',
    category: 'availability',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'XCircle',
    parameters: {
      checkAcrossCentres: { key: 'checkAcrossCentres', label: 'Check across all centres', type: 'boolean', value: true },
    },
  },
  {
    id: 'respect-approved-leave',
    name: 'Respect Approved Leave',
    description: 'Staff on approved leave cannot be assigned shifts',
    category: 'availability',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'CalendarOff',
    parameters: {
      includesPendingLeave: { key: 'includesPendingLeave', label: 'Include pending leave', type: 'boolean', value: false },
    },
  },
  {
    id: 'max-weekly-hours',
    name: 'Maximum Weekly Hours',
    description: 'Staff cannot exceed their contracted/maximum weekly hours',
    category: 'capacity',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'Clock',
    parameters: {
      defaultMaxHours: { key: 'defaultMaxHours', label: 'Default max hours', type: 'number', value: 38, min: 20, max: 60, unit: 'hours' },
      allowOvertimePercent: { key: 'allowOvertimePercent', label: 'Allow overtime %', type: 'number', value: 0, min: 0, max: 50, unit: '%' },
      casualMaxHours: { key: 'casualMaxHours', label: 'Casual max hours', type: 'number', value: 38, min: 10, max: 50, unit: 'hours' },
    },
  },
];

export const complianceConstraints: TimefoldConstraint[] = [
  {
    id: 'minimum-rest-between-shifts',
    name: 'Minimum Rest Period',
    description: 'Minimum hours between consecutive shifts (Fair Work requirement)',
    category: 'compliance',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'Moon',
    parameters: {
      minRestHours: { key: 'minRestHours', label: 'Minimum rest hours', type: 'number', value: 10, min: 8, max: 24, unit: 'hours' },
      applyToSameDayShifts: { key: 'applyToSameDayShifts', label: 'Apply to same-day split shifts', type: 'boolean', value: true },
    },
  },
  {
    id: 'max-consecutive-days',
    name: 'Maximum Consecutive Days',
    description: 'Maximum number of consecutive working days (fatigue management)',
    category: 'compliance',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'CalendarDays',
    parameters: {
      maxDays: { key: 'maxDays', label: 'Maximum consecutive days', type: 'number', value: 6, min: 4, max: 10, unit: 'days' },
      enforceWeeklyRestDay: { key: 'enforceWeeklyRestDay', label: 'Enforce weekly rest day', type: 'boolean', value: true },
    },
  },
  {
    id: 'max-daily-hours',
    name: 'Maximum Daily Hours',
    description: 'Maximum hours per day including all shifts',
    category: 'compliance',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'Timer',
    parameters: {
      maxHours: { key: 'maxHours', label: 'Maximum hours per day', type: 'number', value: 10, min: 6, max: 14, unit: 'hours' },
      includeBreaks: { key: 'includeBreaks', label: 'Include unpaid breaks', type: 'boolean', value: false },
    },
  },
];

// ============================================================================
// MEDIUM CONSTRAINTS - Strongly Preferred (Quality & Efficiency)
// ============================================================================

export const qualityConstraints: TimefoldConstraint[] = [
  {
    id: 'room-continuity',
    name: 'Room Assignment Continuity',
    description: 'Prefer assigning staff to the same room throughout the week for child attachment',
    category: 'continuity',
    level: 'MEDIUM',
    weight: 60,
    enabled: true,
    isBuiltIn: true,
    icon: 'Heart',
    parameters: {
      continuityBonus: { key: 'continuityBonus', label: 'Continuity bonus points', type: 'number', value: 30, min: 0, max: 100 },
      preferPrimaryRoom: { key: 'preferPrimaryRoom', label: 'Prefer staff primary room', type: 'boolean', value: true },
    },
  },
  {
    id: 'skill-match',
    name: 'Skill & Specialty Match',
    description: 'Match staff skills and specialties to room requirements',
    category: 'qualification',
    level: 'MEDIUM',
    weight: 45,
    enabled: true,
    isBuiltIn: true,
    icon: 'Sparkles',
    parameters: {
      bonusPerMatchingSkill: { key: 'bonusPerMatchingSkill', label: 'Bonus per skill match', type: 'number', value: 10, min: 0, max: 50 },
      prioritizeSpecialists: { key: 'prioritizeSpecialists', label: 'Prioritize specialists', type: 'boolean', value: true },
    },
  },
  {
    id: 'experience-level-match',
    name: 'Experience Level Distribution',
    description: 'Ensure mix of experienced and newer staff per room',
    category: 'qualification',
    level: 'MEDIUM',
    weight: 35,
    enabled: true,
    isBuiltIn: true,
    icon: 'Users',
    parameters: {
      minExperiencedPerRoom: { key: 'minExperiencedPerRoom', label: 'Min experienced staff per room', type: 'number', value: 1, min: 0, max: 5 },
      experienceYearsThreshold: { key: 'experienceYearsThreshold', label: 'Years to be "experienced"', type: 'number', value: 2, min: 1, max: 10, unit: 'years' },
    },
  },
  {
    id: 'educational-leader-coverage',
    name: 'Educational Leader Coverage',
    description: 'Ensure Educational Leader presence during key programming times',
    category: 'qualification',
    level: 'MEDIUM',
    weight: 40,
    enabled: true,
    isBuiltIn: true,
    icon: 'BookOpen',
    parameters: {
      coreProgrammingStart: { key: 'coreProgrammingStart', label: 'Core hours start', type: 'time', value: '09:00' },
      coreProgrammingEnd: { key: 'coreProgrammingEnd', label: 'Core hours end', type: 'time', value: '15:00' },
      minimumCoveragePercent: { key: 'minimumCoveragePercent', label: 'Minimum coverage %', type: 'number', value: 80, min: 50, max: 100, unit: '%' },
    },
  },
];

// ============================================================================
// DEMAND-BASED CONSTRAINTS
// ============================================================================

export const demandConstraints: TimefoldConstraint[] = [
  {
    id: 'match-booked-attendance',
    name: 'Match Booked Attendance',
    description: 'Staff allocation should match confirmed bookings for the day',
    category: 'capacity',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'CalendarCheck',
    parameters: {
      useConfirmedOnly: { key: 'useConfirmedOnly', label: 'Use confirmed bookings only', type: 'boolean', value: true },
      bufferPercentage: { key: 'bufferPercentage', label: 'Staffing buffer %', type: 'number', value: 0, min: 0, max: 20, unit: '%' },
    },
  },
  {
    id: 'historical-attendance-adjustment',
    name: 'Historical Attendance Adjustment',
    description: 'Adjust staffing based on historical attendance patterns (no-shows, late arrivals)',
    category: 'capacity',
    level: 'SOFT',
    weight: 25,
    enabled: true,
    isBuiltIn: true,
    icon: 'TrendingUp',
    parameters: {
      useHistoricalData: { key: 'useHistoricalData', label: 'Use historical patterns', type: 'boolean', value: true },
      lookbackWeeks: { key: 'lookbackWeeks', label: 'Lookback period', type: 'number', value: 4, min: 1, max: 12, unit: 'weeks' },
      attendanceRateThreshold: { key: 'attendanceRateThreshold', label: 'Attendance rate threshold', type: 'number', value: 85, min: 50, max: 100, unit: '%' },
    },
  },
  {
    id: 'peak-hours-coverage',
    name: 'Peak Hours Coverage',
    description: 'Ensure adequate staffing during peak drop-off and pick-up times',
    category: 'capacity',
    level: 'MEDIUM',
    weight: 50,
    enabled: true,
    isBuiltIn: true,
    icon: 'Activity',
    parameters: {
      morningPeakStart: { key: 'morningPeakStart', label: 'Morning peak start', type: 'time', value: '07:30' },
      morningPeakEnd: { key: 'morningPeakEnd', label: 'Morning peak end', type: 'time', value: '09:00' },
      afternoonPeakStart: { key: 'afternoonPeakStart', label: 'Afternoon peak start', type: 'time', value: '15:30' },
      afternoonPeakEnd: { key: 'afternoonPeakEnd', label: 'Afternoon peak end', type: 'time', value: '18:00' },
      extraStaffDuringPeak: { key: 'extraStaffDuringPeak', label: 'Extra staff during peaks', type: 'number', value: 1, min: 0, max: 5 },
    },
  },
  {
    id: 'session-type-matching',
    name: 'Session Type Matching',
    description: 'Match shift patterns to booking session types (AM, PM, Full Day)',
    category: 'capacity',
    level: 'SOFT',
    weight: 20,
    enabled: true,
    isBuiltIn: true,
    icon: 'Clock',
    parameters: {
      prioritizeFullDayShifts: { key: 'prioritizeFullDayShifts', label: 'Prioritize full-day shifts', type: 'boolean', value: true },
      splitShiftThreshold: { key: 'splitShiftThreshold', label: 'Min gap for split shift', type: 'number', value: 2, min: 1, max: 4, unit: 'hours' },
    },
  },
];

// ============================================================================
// COST & BUDGET CONSTRAINTS
// ============================================================================

export const budgetConstraints: TimefoldConstraint[] = [
  {
    id: 'daily-budget-limit',
    name: 'Daily Labour Budget',
    description: 'Keep daily staffing costs within allocated budget',
    category: 'cost',
    level: 'MEDIUM',
    weight: 55,
    enabled: true,
    isBuiltIn: true,
    icon: 'DollarSign',
    parameters: {
      dailyBudgetLimit: { key: 'dailyBudgetLimit', label: 'Daily budget limit', type: 'number', value: 2500, min: 500, max: 10000, unit: 'AUD' },
      softBudgetBuffer: { key: 'softBudgetBuffer', label: 'Soft buffer %', type: 'number', value: 10, min: 0, max: 25, unit: '%' },
      hardBudgetEnforcement: { key: 'hardBudgetEnforcement', label: 'Hard budget enforcement', type: 'boolean', value: false },
    },
  },
  {
    id: 'weekly-budget-limit',
    name: 'Weekly Labour Budget',
    description: 'Keep weekly staffing costs within allocated budget',
    category: 'cost',
    level: 'MEDIUM',
    weight: 50,
    enabled: true,
    isBuiltIn: true,
    icon: 'Wallet',
    parameters: {
      weeklyBudgetLimit: { key: 'weeklyBudgetLimit', label: 'Weekly budget limit', type: 'number', value: 12500, min: 2500, max: 50000, unit: 'AUD' },
      includesOnCosts: { key: 'includesOnCosts', label: 'Includes on-costs', type: 'boolean', value: true },
      onCostsPercentage: { key: 'onCostsPercentage', label: 'On-costs %', type: 'number', value: 15, min: 10, max: 30, unit: '%' },
    },
  },
  {
    id: 'minimize-labour-cost',
    name: 'Minimize Labour Cost',
    description: 'Prefer lower-cost staff assignments while meeting requirements',
    category: 'cost',
    level: 'SOFT',
    weight: 35,
    enabled: true,
    isBuiltIn: true,
    icon: 'TrendingDown',
    parameters: {
      considerHourlyRate: { key: 'considerHourlyRate', label: 'Consider hourly rate', type: 'boolean', value: true },
      considerPenaltyRates: { key: 'considerPenaltyRates', label: 'Consider penalty rates', type: 'boolean', value: true },
      considerCasualLoading: { key: 'considerCasualLoading', label: 'Consider casual loading', type: 'boolean', value: true },
    },
  },
  {
    id: 'minimize-overtime',
    name: 'Minimize Overtime',
    description: 'Avoid overtime where possible to control costs',
    category: 'cost',
    level: 'SOFT',
    weight: 40,
    enabled: true,
    isBuiltIn: true,
    icon: 'AlertTriangle',
    parameters: {
      overtimePenalty: { key: 'overtimePenalty', label: 'Overtime penalty score', type: 'number', value: 25, min: 0, max: 100 },
      weekdayOTThreshold: { key: 'weekdayOTThreshold', label: 'Weekday OT threshold', type: 'number', value: 38, min: 30, max: 45, unit: 'hours' },
      dailyOTThreshold: { key: 'dailyOTThreshold', label: 'Daily OT threshold', type: 'number', value: 7.6, min: 6, max: 10, unit: 'hours' },
    },
  },
  {
    id: 'minimize-weekend-penalties',
    name: 'Minimize Weekend Penalty Rates',
    description: 'Prefer staff with lower weekend penalty obligations',
    category: 'cost',
    level: 'SOFT',
    weight: 25,
    enabled: true,
    isBuiltIn: true,
    icon: 'Calendar',
    parameters: {
      saturdayPenaltyWeight: { key: 'saturdayPenaltyWeight', label: 'Saturday penalty weight', type: 'number', value: 50, min: 0, max: 100, unit: '%' },
      sundayPenaltyWeight: { key: 'sundayPenaltyWeight', label: 'Sunday penalty weight', type: 'number', value: 100, min: 0, max: 150, unit: '%' },
      publicHolidayPenaltyWeight: { key: 'publicHolidayPenaltyWeight', label: 'Public holiday weight', type: 'number', value: 150, min: 0, max: 200, unit: '%' },
    },
  },
  {
    id: 'prefer-permanent-staff',
    name: 'Prefer Permanent Staff',
    description: 'Prefer permanent staff over casual (lower casual loading costs)',
    category: 'cost',
    level: 'SOFT',
    weight: 30,
    enabled: true,
    isBuiltIn: true,
    icon: 'UserCheck',
    parameters: {
      casualPenalty: { key: 'casualPenalty', label: 'Casual staff penalty', type: 'number', value: 15, min: 0, max: 50 },
      casualLoadingRate: { key: 'casualLoadingRate', label: 'Casual loading %', type: 'number', value: 25, min: 20, max: 30, unit: '%' },
    },
  },
  {
    id: 'prefer-internal-over-agency',
    name: 'Prefer Internal Over Agency',
    description: 'Prefer internal staff over agency workers (significant cost difference)',
    category: 'cost',
    level: 'SOFT',
    weight: 45,
    enabled: true,
    isBuiltIn: true,
    icon: 'Building2',
    parameters: {
      agencyPenalty: { key: 'agencyPenalty', label: 'Agency staff penalty', type: 'number', value: 40, min: 0, max: 100 },
      agencyMarkupRate: { key: 'agencyMarkupRate', label: 'Typical agency markup %', type: 'number', value: 30, min: 15, max: 50, unit: '%' },
      allowAgencyForGaps: { key: 'allowAgencyForGaps', label: 'Allow agency for gaps only', type: 'boolean', value: true },
    },
  },
];

// ============================================================================
// AWARD & PAY CONSTRAINTS (Children's Services Award 2020)
// ============================================================================

export const awardConstraints: TimefoldConstraint[] = [
  {
    id: 'award-classification-match',
    name: 'Award Classification Match',
    description: 'Ensure staff are assigned at appropriate classification level for duties',
    category: 'compliance',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'FileText',
    parameters: {
      awardId: { key: 'awardId', label: 'Applicable award', type: 'select', value: 'children-services-2020', options: [
        { value: 'children-services-2020', label: "Children's Services Award 2020" },
        { value: 'educational-services-2020', label: 'Educational Services Award 2020' },
        { value: 'social-2020', label: 'SCHADS Award 2010' },
      ]},
      enforceMinimumClassification: { key: 'enforceMinimumClassification', label: 'Enforce minimum classification', type: 'boolean', value: true },
    },
  },
  {
    id: 'higher-duties-allowance',
    name: 'Higher Duties Recognition',
    description: 'Assign higher duties allowance when staff perform above their classification',
    category: 'compliance',
    level: 'MEDIUM',
    weight: 30,
    enabled: true,
    isBuiltIn: true,
    icon: 'ArrowUpCircle',
    parameters: {
      trackHigherDuties: { key: 'trackHigherDuties', label: 'Track higher duties', type: 'boolean', value: true },
      minimumDurationMinutes: { key: 'minimumDurationMinutes', label: 'Minimum duration for allowance', type: 'number', value: 120, min: 30, max: 480, unit: 'minutes' },
    },
  },
  {
    id: 'educational-leader-allowance',
    name: 'Educational Leader Allowance',
    description: 'Track and allocate Educational Leader allowance shifts',
    category: 'compliance',
    level: 'MEDIUM',
    weight: 25,
    enabled: true,
    isBuiltIn: true,
    icon: 'Award',
    parameters: {
      hourlyAllowance: { key: 'hourlyAllowance', label: 'Hourly allowance', type: 'number', value: 2.34, min: 0, max: 10, unit: 'AUD' },
      requiresAppointment: { key: 'requiresAppointment', label: 'Requires formal appointment', type: 'boolean', value: true },
    },
  },
  {
    id: 'first-aid-allowance',
    name: 'First Aid Allowance',
    description: 'Track First Aid officer designation and allowance',
    category: 'compliance',
    level: 'SOFT',
    weight: 15,
    enabled: true,
    isBuiltIn: true,
    icon: 'HeartPulse',
    parameters: {
      weeklyAllowance: { key: 'weeklyAllowance', label: 'Weekly allowance', type: 'number', value: 18.93, min: 0, max: 50, unit: 'AUD' },
      onePerCentre: { key: 'onePerCentre', label: 'One designated per centre', type: 'boolean', value: true },
    },
  },
  {
    id: 'responsible-person-allowance',
    name: 'Responsible Person Allowance',
    description: 'Track and allocate Responsible Person in Charge allowance',
    category: 'compliance',
    level: 'MEDIUM',
    weight: 25,
    enabled: true,
    isBuiltIn: true,
    icon: 'Shield',
    parameters: {
      hourlyAllowance: { key: 'hourlyAllowance', label: 'Hourly allowance', type: 'number', value: 1.50, min: 0, max: 5, unit: 'AUD' },
      alwaysRequired: { key: 'alwaysRequired', label: 'Always required during operating hours', type: 'boolean', value: true },
    },
  },
];

// ============================================================================
// STAFF PREFERENCE & FAIRNESS CONSTRAINTS
// ============================================================================

export const fairnessConstraints: TimefoldConstraint[] = [
  {
    id: 'fair-shift-distribution',
    name: 'Fair Shift Distribution',
    description: 'Distribute shifts fairly among available staff',
    category: 'fairness',
    level: 'SOFT',
    weight: 35,
    enabled: true,
    isBuiltIn: true,
    icon: 'Scale',
    parameters: {
      maxHoursVariance: { key: 'maxHoursVariance', label: 'Max hours variance', type: 'number', value: 8, min: 2, max: 20, unit: 'hours' },
      considerContractedHours: { key: 'considerContractedHours', label: 'Consider contracted hours', type: 'boolean', value: true },
    },
  },
  {
    id: 'preferred-centre',
    name: 'Preferred Centre Assignment',
    description: 'Assign staff to their preferred centres where possible',
    category: 'preference',
    level: 'SOFT',
    weight: 25,
    enabled: true,
    isBuiltIn: true,
    icon: 'MapPin',
    parameters: {
      preferenceBonus: { key: 'preferenceBonus', label: 'Preference bonus', type: 'number', value: 20, min: 0, max: 50 },
      prioritizeDefaultCentre: { key: 'prioritizeDefaultCentre', label: 'Prioritize default centre', type: 'boolean', value: true },
    },
  },
  {
    id: 'preferred-room',
    name: 'Preferred Room Assignment',
    description: 'Assign staff to their preferred age group/room',
    category: 'preference',
    level: 'SOFT',
    weight: 20,
    enabled: true,
    isBuiltIn: true,
    icon: 'Home',
    parameters: {
      roomPreferenceBonus: { key: 'roomPreferenceBonus', label: 'Room preference bonus', type: 'number', value: 15, min: 0, max: 50 },
    },
  },
  {
    id: 'shift-time-preference',
    name: 'Shift Time Preference',
    description: 'Respect staff preferences for early/late shifts',
    category: 'preference',
    level: 'SOFT',
    weight: 15,
    enabled: true,
    isBuiltIn: true,
    icon: 'Sunrise',
    parameters: {
      earlyShiftEndsBefore: { key: 'earlyShiftEndsBefore', label: 'Early shift ends before', type: 'time', value: '14:00' },
      lateShiftStartsAfter: { key: 'lateShiftStartsAfter', label: 'Late shift starts after', type: 'time', value: '11:00' },
      preferenceBonus: { key: 'preferenceBonus', label: 'Preference match bonus', type: 'number', value: 10, min: 0, max: 30 },
    },
  },
  {
    id: 'weekend-rotation',
    name: 'Fair Weekend Rotation',
    description: 'Ensure fair rotation of weekend shifts among eligible staff',
    category: 'fairness',
    level: 'SOFT',
    weight: 25,
    enabled: true,
    isBuiltIn: true,
    icon: 'RotateCcw',
    parameters: {
      maxConsecutiveWeekends: { key: 'maxConsecutiveWeekends', label: 'Max consecutive weekends', type: 'number', value: 2, min: 1, max: 4 },
      weekendHoursVariance: { key: 'weekendHoursVariance', label: 'Weekend hours variance', type: 'number', value: 4, min: 0, max: 10, unit: 'hours' },
    },
  },
  {
    id: 'guaranteed-hours',
    name: 'Guaranteed Hours',
    description: 'Ensure permanent part-time staff receive their guaranteed hours',
    category: 'fairness',
    level: 'MEDIUM',
    weight: 50,
    enabled: true,
    isBuiltIn: true,
    icon: 'CheckCircle',
    parameters: {
      enforceMinimumHours: { key: 'enforceMinimumHours', label: 'Enforce minimum hours', type: 'boolean', value: true },
      shortfallPenalty: { key: 'shortfallPenalty', label: 'Shortfall penalty per hour', type: 'number', value: 20, min: 0, max: 50 },
    },
  },
];

// ============================================================================
// COMBINE ALL CHILDCARE CONSTRAINTS
// ============================================================================

export const allChildcareConstraints: TimefoldConstraint[] = [
  // Hard Constraints (Regulatory)
  ...nqfRatioConstraints,
  ...qualificationConstraints,
  ...availabilityConstraints,
  ...complianceConstraints,
  
  // Medium & Soft Constraints (Quality, Cost, Fairness)
  ...qualityConstraints,
  ...demandConstraints,
  ...budgetConstraints,
  ...awardConstraints,
  ...fairnessConstraints,
];

// ============================================================================
// CHILDCARE-SPECIFIC CATEGORY WEIGHTS
// ============================================================================

export const childcareCategoryWeights: Record<string, number> = {
  availability: 100,      // Must respect availability
  qualification: 100,     // Qualifications are regulatory requirements
  capacity: 100,          // Ratio compliance is mandatory
  compliance: 95,         // Fair Work & award compliance
  continuity: 60,         // Child attachment is important
  fairness: 50,           // Fair distribution of shifts
  cost: 55,               // Budget management
  preference: 40,         // Staff preferences (nice to have)
};

// ============================================================================
// SOLVER PRESETS FOR CHILDCARE
// ============================================================================

export const childcarePresets = {
  compliance_first: {
    name: 'Compliance First',
    description: 'Prioritize NQF ratios and qualification requirements above all else',
    categoryWeights: {
      availability: 100,
      qualification: 100,
      capacity: 100,
      compliance: 100,
      continuity: 50,
      fairness: 40,
      cost: 30,
      preference: 20,
    },
  },
  balanced: {
    name: 'Balanced',
    description: 'Balance compliance, cost, and staff satisfaction',
    categoryWeights: childcareCategoryWeights,
  },
  cost_focused: {
    name: 'Cost Focused',
    description: 'Minimize costs while maintaining compliance',
    categoryWeights: {
      availability: 100,
      qualification: 100,
      capacity: 100,
      compliance: 90,
      continuity: 40,
      fairness: 35,
      cost: 85,
      preference: 25,
    },
  },
  staff_satisfaction: {
    name: 'Staff Satisfaction',
    description: 'Prioritize staff preferences and fair distribution',
    categoryWeights: {
      availability: 100,
      qualification: 100,
      capacity: 100,
      compliance: 90,
      continuity: 70,
      fairness: 85,
      cost: 40,
      preference: 80,
    },
  },
  quality_care: {
    name: 'Quality Care',
    description: 'Prioritize continuity, experience, and child outcomes',
    categoryWeights: {
      availability: 100,
      qualification: 100,
      capacity: 100,
      compliance: 95,
      continuity: 90,
      fairness: 55,
      cost: 35,
      preference: 50,
    },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getConstraintsByLevel(level: ConstraintLevel): TimefoldConstraint[] {
  return allChildcareConstraints.filter(c => c.level === level);
}

export function getConstraintsByCategory(category: string): TimefoldConstraint[] {
  return allChildcareConstraints.filter(c => c.category === category);
}

export function getHardConstraints(): TimefoldConstraint[] {
  return getConstraintsByLevel('HARD');
}

export function getSoftConstraints(): TimefoldConstraint[] {
  return getConstraintsByLevel('SOFT');
}

export function getMediumConstraints(): TimefoldConstraint[] {
  return getConstraintsByLevel('MEDIUM');
}

export function countEnabledConstraints(constraints: TimefoldConstraint[]): {
  total: number;
  hard: number;
  medium: number;
  soft: number;
} {
  const enabled = constraints.filter(c => c.enabled);
  return {
    total: enabled.length,
    hard: enabled.filter(c => c.level === 'HARD').length,
    medium: enabled.filter(c => c.level === 'MEDIUM').length,
    soft: enabled.filter(c => c.level === 'SOFT').length,
  };
}
