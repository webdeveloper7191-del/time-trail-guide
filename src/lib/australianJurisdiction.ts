/**
 * Australian Jurisdiction Configuration
 * Proper break rules, overtime thresholds, and penalty rate support for Modern Awards
 */

import { Jurisdiction, BreakRule } from '@/types/compliance';

// Australian state-specific configurations
export type AustralianState = 'NSW' | 'VIC' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'NT' | 'ACT';

// Modern Award types for different industries
export type AwardType = 
  | 'children_services'
  | 'healthcare'
  | 'hospitality'
  | 'retail'
  | 'general';

// Australian break rules (per NES and Modern Awards)
export const australianBreakRules: BreakRule[] = [
  { 
    id: 'au-meal-break', 
    name: 'Meal Break', 
    minWorkHoursRequired: 5, 
    breakDurationMinutes: 30, 
    type: 'unpaid', 
    isMandatory: true 
  },
  { 
    id: 'au-rest-break-1', 
    name: 'Rest Break (Morning)', 
    minWorkHoursRequired: 4, 
    breakDurationMinutes: 10, 
    type: 'paid', 
    isMandatory: true 
  },
  { 
    id: 'au-rest-break-2', 
    name: 'Rest Break (Afternoon)', 
    minWorkHoursRequired: 7, 
    breakDurationMinutes: 10, 
    type: 'paid', 
    isMandatory: true 
  },
];

// Default Australian jurisdiction (based on NES and Modern Awards)
export const australianJurisdiction: Jurisdiction = {
  id: 'au-federal',
  name: 'Australia Federal (Modern Awards)',
  code: 'AU-NES',
  maxDailyHours: 10,              // Standard max, can be extended by agreement
  maxWeeklyHours: 38,             // NES ordinary hours
  breakRules: australianBreakRules,
  overtimeThresholdDaily: 8,       // Australian awards use daily triggers
  overtimeThresholdWeekly: 38,     // Standard 38-hour week
  overtimeMultiplier: 1.5,         // First 2 hours at time and a half
  doubleTimeThreshold: 10,         // After 2 hours OT, double time
  doubleTimeMultiplier: 2,
};

// Children's Services Award specific rules
export const childrenServicesJurisdiction: Jurisdiction = {
  id: 'au-children-services',
  name: "Children's Services Award 2020",
  code: 'MA000120',
  maxDailyHours: 10,
  maxWeeklyHours: 38,
  breakRules: [
    { id: 'cs-meal-break', name: 'Meal Break', minWorkHoursRequired: 5, breakDurationMinutes: 30, type: 'unpaid', isMandatory: true },
    { id: 'cs-rest-break', name: 'Rest Break', minWorkHoursRequired: 4, breakDurationMinutes: 10, type: 'paid', isMandatory: true },
  ],
  overtimeThresholdDaily: 8,
  overtimeThresholdWeekly: 38,
  overtimeMultiplier: 1.5,
  doubleTimeThreshold: 10,
  doubleTimeMultiplier: 2,
};

// Healthcare Award specific rules
export const healthcareJurisdiction: Jurisdiction = {
  id: 'au-healthcare',
  name: 'Health Professionals Award 2020',
  code: 'MA000027',
  maxDailyHours: 12,               // Can work up to 12 hours in healthcare
  maxWeeklyHours: 38,
  breakRules: [
    { id: 'hc-meal-break', name: 'Meal Break', minWorkHoursRequired: 5, breakDurationMinutes: 30, type: 'unpaid', isMandatory: true },
    { id: 'hc-rest-break-1', name: 'Rest Break', minWorkHoursRequired: 4, breakDurationMinutes: 10, type: 'paid', isMandatory: true },
    { id: 'hc-rest-break-2', name: 'Additional Rest Break', minWorkHoursRequired: 10, breakDurationMinutes: 20, type: 'paid', isMandatory: true },
  ],
  overtimeThresholdDaily: 8,
  overtimeThresholdWeekly: 38,
  overtimeMultiplier: 1.5,
  doubleTimeThreshold: 10,
  doubleTimeMultiplier: 2,
};

// Hospitality Award specific rules
export const hospitalityJurisdiction: Jurisdiction = {
  id: 'au-hospitality',
  name: 'Hospitality Industry Award 2020',
  code: 'MA000009',
  maxDailyHours: 11.5,              // Hospitality allows extended hours
  maxWeeklyHours: 38,
  breakRules: [
    { id: 'hosp-meal-break', name: 'Meal Break', minWorkHoursRequired: 5, breakDurationMinutes: 30, type: 'unpaid', isMandatory: true },
    { id: 'hosp-rest-break', name: 'Rest Break', minWorkHoursRequired: 4, breakDurationMinutes: 10, type: 'paid', isMandatory: false },
  ],
  overtimeThresholdDaily: 8,        // Or 10 hours if agreed
  overtimeThresholdWeekly: 38,
  overtimeMultiplier: 1.5,
  doubleTimeThreshold: 10,
  doubleTimeMultiplier: 2,
};

// Retail Award specific rules
export const retailJurisdiction: Jurisdiction = {
  id: 'au-retail',
  name: 'General Retail Industry Award 2020',
  code: 'MA000004',
  maxDailyHours: 9,
  maxWeeklyHours: 38,
  breakRules: [
    { id: 'retail-meal-break', name: 'Meal Break', minWorkHoursRequired: 5, breakDurationMinutes: 30, type: 'unpaid', isMandatory: true },
    { id: 'retail-rest-break', name: 'Rest Break', minWorkHoursRequired: 4, breakDurationMinutes: 10, type: 'paid', isMandatory: true },
  ],
  overtimeThresholdDaily: 9,
  overtimeThresholdWeekly: 38,
  overtimeMultiplier: 1.5,
  doubleTimeThreshold: 11,
  doubleTimeMultiplier: 2,
};

// Map of all Australian jurisdictions by award type
export const australianJurisdictions: Record<AwardType, Jurisdiction> = {
  children_services: childrenServicesJurisdiction,
  healthcare: healthcareJurisdiction,
  hospitality: hospitalityJurisdiction,
  retail: retailJurisdiction,
  general: australianJurisdiction,
};

// Get jurisdiction by award type
export function getJurisdictionByAward(awardType: AwardType): Jurisdiction {
  return australianJurisdictions[awardType] || australianJurisdiction;
}

// Get jurisdiction by award ID (mapping award IDs to types)
export function getJurisdictionByAwardId(awardId: string): Jurisdiction {
  const awardIdToType: Record<string, AwardType> = {
    'children-services-2020': 'children_services',
    'healthcare-2020': 'healthcare',
    'hospitality-2020': 'hospitality',
    'retail-2020': 'retail',
  };
  
  const awardType = awardIdToType[awardId] || 'general';
  return getJurisdictionByAward(awardType);
}

// Penalty rate configuration for Australian awards
export interface PenaltyRateConfig {
  saturday: number;          // Multiplier (e.g., 1.5 = 150%)
  sunday: number;            // Multiplier
  publicHoliday: number;     // Multiplier
  evening: number;           // % loading (e.g., 10 = 10%)
  night: number;             // % loading
  earlyMorning: number;      // % loading
}

// Default penalty rates by award type
export const penaltyRatesByAward: Record<AwardType, PenaltyRateConfig> = {
  children_services: {
    saturday: 1.5,           // 150%
    sunday: 2.0,             // 200%
    publicHoliday: 2.5,      // 250%
    evening: 10,             // 10% loading 6pm-10pm
    night: 15,               // 15% loading 10pm-6am
    earlyMorning: 15,        // 15% loading before 6am
  },
  healthcare: {
    saturday: 1.5,
    sunday: 1.75,
    publicHoliday: 2.5,
    evening: 12.5,
    night: 15,
    earlyMorning: 12.5,
  },
  hospitality: {
    saturday: 1.25,          // Hospitality has lower Saturday rate
    sunday: 1.5,
    publicHoliday: 2.5,
    evening: 10,
    night: 15,
    earlyMorning: 0,
  },
  retail: {
    saturday: 1.25,
    sunday: 1.5,             // Reduced for retail under gradual phase-in
    publicHoliday: 2.5,
    evening: 15,
    night: 15,
    earlyMorning: 0,
  },
  general: {
    saturday: 1.5,
    sunday: 2.0,
    publicHoliday: 2.5,
    evening: 10,
    night: 15,
    earlyMorning: 15,
  },
};

// Get penalty rates for an award
export function getPenaltyRates(awardType: AwardType): PenaltyRateConfig {
  return penaltyRatesByAward[awardType] || penaltyRatesByAward.general;
}

// Casual loading configuration
export const casualLoadingByAward: Record<AwardType, number> = {
  children_services: 25,     // 25% casual loading
  healthcare: 25,
  hospitality: 25,
  retail: 25,
  general: 25,
};

// Superannuation rate (current as of July 2024)
export const SUPERANNUATION_RATE = 11.5;

// NES constants
export const NES_CONSTANTS = {
  maxWeeklyHours: 38,
  annualLeaveWeeks: 4,
  personalLeaveWeeks: 2,
  casualLoading: 25,
  noticePeriodsWeeks: {
    lessThan1Year: 1,
    '1To3Years': 2,
    '3To5Years': 3,
    over5Years: 4,
  },
  redundancyWeeks: {
    '1To2Years': 4,
    '2To3Years': 6,
    '3To4Years': 7,
    '4To5Years': 8,
    '5To6Years': 10,
    '6To7Years': 11,
    '7To8Years': 13,
    '8To9Years': 14,
    '9To10Years': 16,
    over10Years: 12, // Capped after certain point
  },
};
