/**
 * Aged Care Industry-Specific Constraints for Timefold Solver
 * 
 * Based on Australian Aged Care Quality Standards, AN-ACC (Australian National 
 * Aged Care Classification) funding model, and mandatory care minute requirements
 * effective from October 2024.
 */

import { TimefoldConstraint, ConstraintCategory, ConstraintLevel } from '../timefoldSolver';

// ============================================================================
// AN-ACC CARE MINUTE REQUIREMENTS (as of October 2024)
// ============================================================================
// Total: 215 care minutes per resident per day
// - Registered Nurse (RN): 44 minutes minimum
// - Total nursing/personal care: 215 minutes
// ============================================================================

// ============================================================================
// HARD CONSTRAINTS - Regulatory Requirements (Must Satisfy)
// ============================================================================

export const rnCoverageConstraints: TimefoldConstraint[] = [
  {
    id: 'rn-24-7-coverage',
    name: '24/7 Registered Nurse Coverage',
    description: 'A Registered Nurse must be on-site 24 hours a day, 7 days a week',
    category: 'qualification',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'Stethoscope',
    parameters: {
      minimumRNs: { key: 'minimumRNs', label: 'Minimum RNs at all times', type: 'number', value: 1, min: 1, max: 5 },
      enforceNightShift: { key: 'enforceNightShift', label: 'Enforce during night shift', type: 'boolean', value: true },
      nightShiftStart: { key: 'nightShiftStart', label: 'Night shift starts', type: 'time', value: '22:00' },
      nightShiftEnd: { key: 'nightShiftEnd', label: 'Night shift ends', type: 'time', value: '06:00' },
    },
  },
  {
    id: 'rn-care-minutes',
    name: 'RN Care Minutes (44 min/resident/day)',
    description: 'Minimum 44 minutes of Registered Nurse care per resident per day (AN-ACC)',
    category: 'capacity',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'Clock',
    parameters: {
      minutesPerResident: { key: 'minutesPerResident', label: 'RN minutes per resident', type: 'number', value: 44, min: 30, max: 60, unit: 'minutes' },
      calculateAcrossFacility: { key: 'calculateAcrossFacility', label: 'Calculate facility-wide', type: 'boolean', value: true },
    },
  },
  {
    id: 'total-care-minutes',
    name: 'Total Care Minutes (215 min/resident/day)',
    description: 'Minimum 215 total care minutes per resident per day (AN-ACC mandate)',
    category: 'capacity',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'Timer',
    parameters: {
      minutesPerResident: { key: 'minutesPerResident', label: 'Total care minutes per resident', type: 'number', value: 215, min: 180, max: 250, unit: 'minutes' },
      includedRoles: { key: 'includedRoles', label: 'Roles included', type: 'select', value: 'nursing_and_care', options: [
        { value: 'nursing_and_care', label: 'Nursing & Personal Care Workers' },
        { value: 'all_direct_care', label: 'All Direct Care Staff' },
      ]},
    },
  },
  {
    id: 'clinical-lead-presence',
    name: 'Clinical Care Manager/DON Presence',
    description: 'Director of Nursing or Clinical Care Manager must be available during core hours',
    category: 'qualification',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'UserCog',
    parameters: {
      coreHoursStart: { key: 'coreHoursStart', label: 'Core hours start', type: 'time', value: '08:00' },
      coreHoursEnd: { key: 'coreHoursEnd', label: 'Core hours end', type: 'time', value: '17:00' },
      weekdaysOnly: { key: 'weekdaysOnly', label: 'Weekdays only', type: 'boolean', value: true },
    },
  },
];

export const qualificationConstraints: TimefoldConstraint[] = [
  {
    id: 'ahpra-registration-valid',
    name: 'AHPRA Registration Valid',
    description: 'All nurses must have valid AHPRA registration',
    category: 'qualification',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'BadgeCheck',
    parameters: {
      checkExpiryBuffer: { key: 'checkExpiryBuffer', label: 'Expiry warning buffer', type: 'number', value: 30, min: 7, max: 90, unit: 'days' },
      blockIfExpired: { key: 'blockIfExpired', label: 'Block assignment if expired', type: 'boolean', value: true },
    },
  },
  {
    id: 'police-check-valid',
    name: 'National Police Check',
    description: 'All staff must have valid National Police Check (within 3 years)',
    category: 'qualification',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'Shield',
    parameters: {
      validityPeriod: { key: 'validityPeriod', label: 'Validity period', type: 'number', value: 36, min: 12, max: 60, unit: 'months' },
      checkExpiryBuffer: { key: 'checkExpiryBuffer', label: 'Expiry warning buffer', type: 'number', value: 60, min: 30, max: 90, unit: 'days' },
    },
  },
  {
    id: 'medication-competency',
    name: 'Medication Competency',
    description: 'Staff administering medications must have current medication competency',
    category: 'qualification',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'Pill',
    parameters: {
      requireForMedRound: { key: 'requireForMedRound', label: 'Required for medication rounds', type: 'boolean', value: true },
      validityPeriod: { key: 'validityPeriod', label: 'Validity period', type: 'number', value: 12, min: 6, max: 24, unit: 'months' },
    },
  },
  {
    id: 'manual-handling-cert',
    name: 'Manual Handling Certification',
    description: 'All direct care staff must have current manual handling training',
    category: 'qualification',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'HandMetal',
    parameters: {
      validityPeriod: { key: 'validityPeriod', label: 'Validity period', type: 'number', value: 12, min: 6, max: 24, unit: 'months' },
    },
  },
  {
    id: 'dementia-training',
    name: 'Dementia Care Training',
    description: 'Staff in memory support units must have dementia care training',
    category: 'qualification',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'Brain',
    parameters: {
      applyToMemoryUnits: { key: 'applyToMemoryUnits', label: 'Apply to memory support units', type: 'boolean', value: true },
      minimumPerShift: { key: 'minimumPerShift', label: 'Minimum trained staff per shift', type: 'number', value: 1, min: 1, max: 5 },
    },
  },
  {
    id: 'first-aid-certified',
    name: 'First Aid Certificate',
    description: 'Minimum first aid certified staff per shift',
    category: 'qualification',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'HeartPulse',
    parameters: {
      minimumPerShift: { key: 'minimumPerShift', label: 'Minimum per shift', type: 'number', value: 2, min: 1, max: 5 },
      includesCPR: { key: 'includesCPR', label: 'Must include CPR', type: 'boolean', value: true },
    },
  },
];

export const skillsMixConstraints: TimefoldConstraint[] = [
  {
    id: 'skills-mix-ratio',
    name: 'Skills Mix Ratio',
    description: 'Maintain appropriate ratio of RN:EN:PCW per shift',
    category: 'capacity',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'Users',
    parameters: {
      rnMinPercent: { key: 'rnMinPercent', label: 'Minimum RN %', type: 'number', value: 20, min: 10, max: 50, unit: '%' },
      enMinPercent: { key: 'enMinPercent', label: 'Minimum EN %', type: 'number', value: 15, min: 0, max: 40, unit: '%' },
      qualifiedNurseMinPercent: { key: 'qualifiedNurseMinPercent', label: 'Min qualified nurses (RN+EN) %', type: 'number', value: 40, min: 25, max: 75, unit: '%' },
    },
  },
  {
    id: 'minimum-staffing-per-wing',
    name: 'Minimum Staffing Per Wing/Unit',
    description: 'Maintain minimum staff numbers per residential wing or unit',
    category: 'capacity',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'Building',
    parameters: {
      minimumDayShift: { key: 'minimumDayShift', label: 'Minimum staff (day shift)', type: 'number', value: 4, min: 2, max: 10 },
      minimumEveningShift: { key: 'minimumEveningShift', label: 'Minimum staff (evening)', type: 'number', value: 3, min: 2, max: 8 },
      minimumNightShift: { key: 'minimumNightShift', label: 'Minimum staff (night)', type: 'number', value: 2, min: 1, max: 6 },
      residentsPerStaff: { key: 'residentsPerStaff', label: 'Max residents per staff', type: 'number', value: 8, min: 4, max: 15 },
    },
  },
  {
    id: 'high-care-staffing',
    name: 'High Care Resident Staffing',
    description: 'Additional staffing for high AN-ACC category residents',
    category: 'capacity',
    level: 'MEDIUM',
    weight: 60,
    enabled: true,
    isBuiltIn: true,
    icon: 'Activity',
    parameters: {
      highCareThreshold: { key: 'highCareThreshold', label: 'AN-ACC category threshold', type: 'number', value: 10, min: 8, max: 13 },
      additionalMinutesPerResident: { key: 'additionalMinutesPerResident', label: 'Extra minutes/resident', type: 'number', value: 30, min: 15, max: 60, unit: 'minutes' },
    },
  },
];

export const availabilityConstraints: TimefoldConstraint[] = [
  {
    id: 'staff-availability',
    name: 'Staff Availability',
    description: 'Staff must be available during the shift time',
    category: 'availability',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'Calendar',
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
    icon: 'XCircle',
    parameters: {
      checkAcrossFacilities: { key: 'checkAcrossFacilities', label: 'Check across facilities', type: 'boolean', value: true },
    },
  },
  {
    id: 'respect-approved-leave',
    name: 'Respect Approved Leave',
    description: 'Staff on approved leave cannot be assigned',
    category: 'availability',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'CalendarOff',
    parameters: {},
  },
  {
    id: 'max-weekly-hours',
    name: 'Maximum Weekly Hours',
    description: 'Staff cannot exceed maximum weekly hours',
    category: 'capacity',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'Clock',
    parameters: {
      defaultMaxHours: { key: 'defaultMaxHours', label: 'Default max hours', type: 'number', value: 38, min: 20, max: 60, unit: 'hours' },
      allowOvertimePercent: { key: 'allowOvertimePercent', label: 'Allow overtime %', type: 'number', value: 10, min: 0, max: 50, unit: '%' },
    },
  },
];

export const complianceConstraints: TimefoldConstraint[] = [
  {
    id: 'minimum-rest-between-shifts',
    name: 'Minimum Rest Period',
    description: 'Minimum 10 hours rest between shifts (Aged Care Award)',
    category: 'compliance',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'Moon',
    parameters: {
      minRestHours: { key: 'minRestHours', label: 'Minimum rest hours', type: 'number', value: 10, min: 8, max: 12, unit: 'hours' },
    },
  },
  {
    id: 'max-consecutive-days',
    name: 'Maximum Consecutive Days',
    description: 'Maximum consecutive working days (fatigue management)',
    category: 'compliance',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'CalendarDays',
    parameters: {
      maxDays: { key: 'maxDays', label: 'Maximum consecutive days', type: 'number', value: 6, min: 4, max: 10, unit: 'days' },
    },
  },
  {
    id: 'max-night-shifts',
    name: 'Maximum Consecutive Night Shifts',
    description: 'Limit consecutive night shifts for fatigue management',
    category: 'compliance',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'Moon',
    parameters: {
      maxNights: { key: 'maxNights', label: 'Maximum consecutive nights', type: 'number', value: 4, min: 2, max: 7, unit: 'nights' },
      restDaysAfterNights: { key: 'restDaysAfterNights', label: 'Rest days after night block', type: 'number', value: 2, min: 1, max: 4, unit: 'days' },
    },
  },
  {
    id: 'sleepover-allowance',
    name: 'Sleepover Shift Rules',
    description: 'Sleepover shifts must comply with award conditions',
    category: 'compliance',
    level: 'HARD',
    weight: 0,
    enabled: true,
    isBuiltIn: true,
    icon: 'Bed',
    parameters: {
      maxConsecutiveSleepovers: { key: 'maxConsecutiveSleepovers', label: 'Max consecutive sleepovers', type: 'number', value: 3, min: 1, max: 5 },
      requireNextDayOff: { key: 'requireNextDayOff', label: 'Require next day off', type: 'boolean', value: false },
    },
  },
];

// ============================================================================
// MEDIUM/SOFT CONSTRAINTS - Quality, Cost, and Preferences
// ============================================================================

export const qualityConstraints: TimefoldConstraint[] = [
  {
    id: 'resident-continuity',
    name: 'Resident-Staff Continuity',
    description: 'Prefer consistent staff assignment for resident familiarity',
    category: 'continuity',
    level: 'MEDIUM',
    weight: 55,
    enabled: true,
    isBuiltIn: true,
    icon: 'Heart',
    parameters: {
      continuityBonus: { key: 'continuityBonus', label: 'Continuity bonus', type: 'number', value: 30, min: 0, max: 100 },
      preferPrimaryCarers: { key: 'preferPrimaryCarers', label: 'Prefer primary carers', type: 'boolean', value: true },
    },
  },
  {
    id: 'handover-overlap',
    name: 'Shift Handover Overlap',
    description: 'Ensure adequate overlap between shifts for proper handover',
    category: 'continuity',
    level: 'MEDIUM',
    weight: 45,
    enabled: true,
    isBuiltIn: true,
    icon: 'ArrowRightLeft',
    parameters: {
      minimumOverlapMinutes: { key: 'minimumOverlapMinutes', label: 'Minimum overlap', type: 'number', value: 15, min: 10, max: 30, unit: 'minutes' },
      enforceRNHandover: { key: 'enforceRNHandover', label: 'Enforce RN-to-RN handover', type: 'boolean', value: true },
    },
  },
  {
    id: 'experience-mix',
    name: 'Experience Level Mix',
    description: 'Ensure mix of experienced and newer staff per shift',
    category: 'qualification',
    level: 'MEDIUM',
    weight: 40,
    enabled: true,
    isBuiltIn: true,
    icon: 'Users',
    parameters: {
      minExperiencedPerShift: { key: 'minExperiencedPerShift', label: 'Min experienced staff', type: 'number', value: 2, min: 1, max: 5 },
      experienceYearsThreshold: { key: 'experienceYearsThreshold', label: 'Years for "experienced"', type: 'number', value: 2, min: 1, max: 5, unit: 'years' },
    },
  },
  {
    id: 'specialty-coverage',
    name: 'Specialty Skills Coverage',
    description: 'Ensure specialty skills available per shift (palliative, wound care, etc.)',
    category: 'qualification',
    level: 'MEDIUM',
    weight: 50,
    enabled: true,
    isBuiltIn: true,
    icon: 'Award',
    parameters: {
      palliativeCareRequired: { key: 'palliativeCareRequired', label: 'Palliative care trained', type: 'boolean', value: true },
      woundCareRequired: { key: 'woundCareRequired', label: 'Wound care specialist', type: 'boolean', value: true },
      behavioralSupportRequired: { key: 'behavioralSupportRequired', label: 'Behavioral support', type: 'boolean', value: false },
    },
  },
];

export const careMinuteTrackingConstraints: TimefoldConstraint[] = [
  {
    id: 'care-minute-tracking',
    name: 'Care Minute Tracking & Reporting',
    description: 'Track and report care minutes for AN-ACC funding compliance',
    category: 'compliance',
    level: 'MEDIUM',
    weight: 70,
    enabled: true,
    isBuiltIn: true,
    icon: 'BarChart',
    parameters: {
      trackDirectCareOnly: { key: 'trackDirectCareOnly', label: 'Track direct care only', type: 'boolean', value: true },
      excludeBreakTime: { key: 'excludeBreakTime', label: 'Exclude break time', type: 'boolean', value: true },
      reportingFrequency: { key: 'reportingFrequency', label: 'Reporting frequency', type: 'select', value: 'daily', options: [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly (Quarterly Star Rating)' },
      ]},
    },
  },
  {
    id: 'anac-category-matching',
    name: 'AN-ACC Category Staffing Match',
    description: 'Match staffing levels to resident AN-ACC classification mix',
    category: 'capacity',
    level: 'MEDIUM',
    weight: 55,
    enabled: true,
    isBuiltIn: true,
    icon: 'Target',
    parameters: {
      useWeightedAverage: { key: 'useWeightedAverage', label: 'Use weighted average', type: 'boolean', value: true },
      bufferPercent: { key: 'bufferPercent', label: 'Staffing buffer %', type: 'number', value: 5, min: 0, max: 20, unit: '%' },
    },
  },
  {
    id: 'star-rating-compliance',
    name: 'Star Rating Staffing Compliance',
    description: 'Meet staffing targets for Aged Care Quality Star Ratings',
    category: 'compliance',
    level: 'MEDIUM',
    weight: 60,
    enabled: true,
    isBuiltIn: true,
    icon: 'Star',
    parameters: {
      targetStarRating: { key: 'targetStarRating', label: 'Target star rating', type: 'select', value: '4', options: [
        { value: '3', label: '3 Stars (Acceptable)' },
        { value: '4', label: '4 Stars (Good)' },
        { value: '5', label: '5 Stars (Excellent)' },
      ]},
      meetQuarterlyTarget: { key: 'meetQuarterlyTarget', label: 'Meet quarterly target', type: 'boolean', value: true },
    },
  },
];

export const budgetConstraints: TimefoldConstraint[] = [
  {
    id: 'daily-labour-budget',
    name: 'Daily Labour Budget',
    description: 'Keep daily staffing costs within allocated budget',
    category: 'cost',
    level: 'MEDIUM',
    weight: 50,
    enabled: true,
    isBuiltIn: true,
    icon: 'DollarSign',
    parameters: {
      dailyBudgetLimit: { key: 'dailyBudgetLimit', label: 'Daily budget limit', type: 'number', value: 8000, min: 2000, max: 30000, unit: 'AUD' },
      softBudgetBuffer: { key: 'softBudgetBuffer', label: 'Soft buffer %', type: 'number', value: 10, min: 0, max: 25, unit: '%' },
    },
  },
  {
    id: 'minimize-agency-usage',
    name: 'Minimize Agency Usage',
    description: 'Prefer internal staff over agency workers',
    category: 'cost',
    level: 'SOFT',
    weight: 40,
    enabled: true,
    isBuiltIn: true,
    icon: 'Building2',
    parameters: {
      agencyPenalty: { key: 'agencyPenalty', label: 'Agency penalty score', type: 'number', value: 35, min: 0, max: 100 },
      maxAgencyPercent: { key: 'maxAgencyPercent', label: 'Max agency % of staff', type: 'number', value: 20, min: 0, max: 50, unit: '%' },
    },
  },
  {
    id: 'minimize-overtime',
    name: 'Minimize Overtime',
    description: 'Avoid overtime where possible to control costs',
    category: 'cost',
    level: 'SOFT',
    weight: 35,
    enabled: true,
    isBuiltIn: true,
    icon: 'TrendingDown',
    parameters: {
      overtimePenalty: { key: 'overtimePenalty', label: 'Overtime penalty', type: 'number', value: 25, min: 0, max: 100 },
    },
  },
  {
    id: 'weekend-penalty-optimization',
    name: 'Weekend Penalty Optimization',
    description: 'Consider penalty rates when scheduling weekend shifts',
    category: 'cost',
    level: 'SOFT',
    weight: 25,
    enabled: true,
    isBuiltIn: true,
    icon: 'Calendar',
    parameters: {
      saturdayWeight: { key: 'saturdayWeight', label: 'Saturday penalty weight', type: 'number', value: 50, min: 0, max: 100, unit: '%' },
      sundayWeight: { key: 'sundayWeight', label: 'Sunday penalty weight', type: 'number', value: 100, min: 0, max: 150, unit: '%' },
    },
  },
  {
    id: 'prefer-permanent-staff',
    name: 'Prefer Permanent Staff',
    description: 'Prefer permanent staff over casual for cost and continuity',
    category: 'cost',
    level: 'SOFT',
    weight: 30,
    enabled: true,
    isBuiltIn: true,
    icon: 'UserCheck',
    parameters: {
      casualPenalty: { key: 'casualPenalty', label: 'Casual staff penalty', type: 'number', value: 15, min: 0, max: 50 },
    },
  },
];

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
    },
  },
  {
    id: 'weekend-rotation',
    name: 'Fair Weekend Rotation',
    description: 'Rotate weekend shifts fairly among eligible staff',
    category: 'fairness',
    level: 'SOFT',
    weight: 30,
    enabled: true,
    isBuiltIn: true,
    icon: 'RotateCcw',
    parameters: {
      maxConsecutiveWeekends: { key: 'maxConsecutiveWeekends', label: 'Max consecutive weekends', type: 'number', value: 2, min: 1, max: 4 },
    },
  },
  {
    id: 'night-shift-rotation',
    name: 'Fair Night Shift Rotation',
    description: 'Rotate night shifts fairly among eligible staff',
    category: 'fairness',
    level: 'SOFT',
    weight: 30,
    enabled: true,
    isBuiltIn: true,
    icon: 'Moon',
    parameters: {
      maxNightShiftsPerMonth: { key: 'maxNightShiftsPerMonth', label: 'Max nights per month', type: 'number', value: 8, min: 4, max: 15 },
    },
  },
  {
    id: 'preferred-shifts',
    name: 'Shift Preference Matching',
    description: 'Respect staff preferences for shift times',
    category: 'preference',
    level: 'SOFT',
    weight: 20,
    enabled: true,
    isBuiltIn: true,
    icon: 'Heart',
    parameters: {
      preferenceBonus: { key: 'preferenceBonus', label: 'Preference match bonus', type: 'number', value: 15, min: 0, max: 50 },
    },
  },
  {
    id: 'guaranteed-hours',
    name: 'Guaranteed Hours',
    description: 'Ensure permanent part-time staff receive guaranteed hours',
    category: 'fairness',
    level: 'MEDIUM',
    weight: 50,
    enabled: true,
    isBuiltIn: true,
    icon: 'CheckCircle',
    parameters: {
      enforceMinimumHours: { key: 'enforceMinimumHours', label: 'Enforce minimum hours', type: 'boolean', value: true },
    },
  },
];

// ============================================================================
// COMBINE ALL AGED CARE CONSTRAINTS
// ============================================================================

export const allAgedCareConstraints: TimefoldConstraint[] = [
  // Hard Constraints (Regulatory)
  ...rnCoverageConstraints,
  ...qualificationConstraints,
  ...skillsMixConstraints,
  ...availabilityConstraints,
  ...complianceConstraints,
  
  // Medium & Soft Constraints
  ...qualityConstraints,
  ...careMinuteTrackingConstraints,
  ...budgetConstraints,
  ...fairnessConstraints,
];

// ============================================================================
// AGED CARE CATEGORY WEIGHTS
// ============================================================================

export const agedCareCategoryWeights: Record<string, number> = {
  availability: 100,
  qualification: 100,     // AHPRA, certifications mandatory
  capacity: 100,          // Care minutes are regulatory
  compliance: 95,         // Fair Work & Award compliance
  continuity: 65,         // Resident-staff relationships important
  fairness: 50,
  cost: 50,               // Budget important but not at expense of care
  preference: 35,
};

// ============================================================================
// AGED CARE SOLVER PRESETS
// ============================================================================

export const agedCarePresets = {
  compliance_first: {
    name: 'Compliance First',
    description: 'Prioritize AN-ACC care minutes and 24/7 RN coverage',
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
    description: 'Balance compliance, quality of care, and budget',
    categoryWeights: agedCareCategoryWeights,
  },
  cost_focused: {
    name: 'Cost Focused',
    description: 'Minimize costs while meeting all regulatory requirements',
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
  quality_care: {
    name: 'Quality Care',
    description: 'Prioritize care quality, continuity, and resident outcomes',
    categoryWeights: {
      availability: 100,
      qualification: 100,
      capacity: 100,
      compliance: 95,
      continuity: 90,
      fairness: 55,
      cost: 35,
      preference: 45,
    },
  },
  star_rating_focus: {
    name: 'Star Rating Focus',
    description: 'Optimize for Aged Care Quality Star Rating staffing metrics',
    categoryWeights: {
      availability: 100,
      qualification: 100,
      capacity: 100,
      compliance: 100,
      continuity: 70,
      fairness: 50,
      cost: 40,
      preference: 30,
    },
  },
};

// ============================================================================
// AGED CARE CONSTRAINT GROUPS FOR UI DISPLAY
// ============================================================================

export const agedCareConstraintGroups = [
  {
    id: 'rn_care_minutes',
    name: 'RN Coverage & Care Minutes',
    description: 'AN-ACC mandatory 24/7 RN coverage and 215 care minutes requirements',
    icon: 'Stethoscope',
    isHardGroup: true,
    color: 'error' as const,
    constraints: rnCoverageConstraints,
  },
  {
    id: 'qualifications_certifications',
    name: 'Qualifications & Certifications',
    description: 'AHPRA registration, police checks, and mandatory training',
    icon: 'BadgeCheck',
    isHardGroup: true,
    color: 'error' as const,
    constraints: qualificationConstraints,
  },
  {
    id: 'skills_mix_staffing',
    name: 'Skills Mix & Staffing Levels',
    description: 'RN:EN:PCW ratios and minimum staffing per unit',
    icon: 'Users',
    isHardGroup: true,
    color: 'error' as const,
    constraints: skillsMixConstraints,
  },
  {
    id: 'availability_compliance',
    name: 'Availability & Fair Work Compliance',
    description: 'Staff availability, rest periods, and fatigue management',
    icon: 'Clock',
    isHardGroup: true,
    color: 'error' as const,
    constraints: [...availabilityConstraints, ...complianceConstraints],
  },
  {
    id: 'quality_continuity',
    name: 'Quality & Continuity of Care',
    description: 'Resident-staff relationships, handovers, and specialty coverage',
    icon: 'Heart',
    isHardGroup: false,
    color: 'warning' as const,
    constraints: qualityConstraints,
  },
  {
    id: 'care_minute_tracking',
    name: 'Care Minute Tracking & Star Ratings',
    description: 'AN-ACC reporting and Aged Care Quality Star Rating compliance',
    icon: 'BarChart',
    isHardGroup: false,
    color: 'warning' as const,
    constraints: careMinuteTrackingConstraints,
  },
  {
    id: 'cost_budget',
    name: 'Cost & Budget Management',
    description: 'Labour costs, overtime, and agency usage optimization',
    icon: 'DollarSign',
    isHardGroup: false,
    color: 'info' as const,
    constraints: budgetConstraints,
  },
  {
    id: 'fairness_preferences',
    name: 'Fairness & Staff Preferences',
    description: 'Fair distribution, weekend rotation, and preference matching',
    icon: 'Scale',
    isHardGroup: false,
    color: 'info' as const,
    constraints: fairnessConstraints,
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getAgedCareConstraintsByLevel(level: ConstraintLevel): TimefoldConstraint[] {
  return allAgedCareConstraints.filter(c => c.level === level);
}

export function calculateCareMinuteCompliance(
  scheduledMinutes: number,
  residentCount: number,
  rnMinutes: number
): {
  isCompliant: boolean;
  totalMinutesPerResident: number;
  rnMinutesPerResident: number;
  totalShortfall: number;
  rnShortfall: number;
} {
  const totalMinutesPerResident = scheduledMinutes / residentCount;
  const rnMinutesPerResident = rnMinutes / residentCount;
  
  const totalShortfall = Math.max(0, 215 - totalMinutesPerResident);
  const rnShortfall = Math.max(0, 44 - rnMinutesPerResident);
  
  return {
    isCompliant: totalShortfall === 0 && rnShortfall === 0,
    totalMinutesPerResident: Math.round(totalMinutesPerResident),
    rnMinutesPerResident: Math.round(rnMinutesPerResident),
    totalShortfall: Math.round(totalShortfall),
    rnShortfall: Math.round(rnShortfall),
  };
}
