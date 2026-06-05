// Award preset values — selecting an award auto-fills every compliance field.
// Values approximate AU Modern Awards / NES baselines for setup convenience.
// Admins can override any field; overrides are tracked separately from these defaults.

export type AwardTypeKey =
  | 'general'
  | 'children_services'
  | 'healthcare'
  | 'hospitality'
  | 'retail'
  | 'social_community'
  | 'aged_care'
  | 'disability';

export interface AwardPreset {
  label: string;
  reference: string;
  maxDailyHours: number;
  maxWeeklyHours: number;
  overtimeThresholdDaily: number;
  overtimeThresholdWeekly: number;
  overtimeMultiplier: number;
  doubleTimeThreshold: number;
  doubleTimeMultiplier: number;
  minRestBetweenShiftsHours: number;
  maxConsecutiveDays: number;
  spanOfHoursMax: number;
  saturdayMultiplier: number;
  sundayMultiplier: number;
  publicHolidayMultiplier: number;
  nightLoadingMultiplier: number;
  casualLoadingPercent: number;
  minEngagementHours: number;
}

export const AWARD_PRESETS: Record<AwardTypeKey, AwardPreset> = {
  general: {
    label: 'General / Clerks',
    reference: 'MA000002',
    maxDailyHours: 10, maxWeeklyHours: 38,
    overtimeThresholdDaily: 8, overtimeThresholdWeekly: 38,
    overtimeMultiplier: 1.5, doubleTimeThreshold: 10, doubleTimeMultiplier: 2.0,
    minRestBetweenShiftsHours: 10, maxConsecutiveDays: 6, spanOfHoursMax: 12,
    saturdayMultiplier: 1.25, sundayMultiplier: 1.5, publicHolidayMultiplier: 2.5, nightLoadingMultiplier: 1.15,
    casualLoadingPercent: 25, minEngagementHours: 3,
  },
  children_services: {
    label: "Children's Services Award",
    reference: 'MA000120',
    maxDailyHours: 10, maxWeeklyHours: 38,
    overtimeThresholdDaily: 8, overtimeThresholdWeekly: 38,
    overtimeMultiplier: 1.5, doubleTimeThreshold: 10, doubleTimeMultiplier: 2.0,
    minRestBetweenShiftsHours: 10, maxConsecutiveDays: 6, spanOfHoursMax: 12,
    saturdayMultiplier: 1.5, sundayMultiplier: 2.0, publicHolidayMultiplier: 2.5, nightLoadingMultiplier: 1.15,
    casualLoadingPercent: 25, minEngagementHours: 2,
  },
  healthcare: {
    label: 'Health Professionals Award',
    reference: 'MA000027',
    maxDailyHours: 12, maxWeeklyHours: 38,
    overtimeThresholdDaily: 8, overtimeThresholdWeekly: 38,
    overtimeMultiplier: 1.5, doubleTimeThreshold: 10, doubleTimeMultiplier: 2.0,
    minRestBetweenShiftsHours: 10, maxConsecutiveDays: 7, spanOfHoursMax: 14,
    saturdayMultiplier: 1.5, sundayMultiplier: 1.75, publicHolidayMultiplier: 2.5, nightLoadingMultiplier: 1.15,
    casualLoadingPercent: 25, minEngagementHours: 3,
  },
  aged_care: {
    label: 'Aged Care Award',
    reference: 'MA000018',
    maxDailyHours: 10, maxWeeklyHours: 38,
    overtimeThresholdDaily: 8, overtimeThresholdWeekly: 38,
    overtimeMultiplier: 1.5, doubleTimeThreshold: 10, doubleTimeMultiplier: 2.0,
    minRestBetweenShiftsHours: 10, maxConsecutiveDays: 6, spanOfHoursMax: 12,
    saturdayMultiplier: 1.5, sundayMultiplier: 2.0, publicHolidayMultiplier: 2.5, nightLoadingMultiplier: 1.15,
    casualLoadingPercent: 25, minEngagementHours: 2,
  },
  disability: {
    label: 'SCHCADS Disability Stream',
    reference: 'MA000100',
    maxDailyHours: 10, maxWeeklyHours: 38,
    overtimeThresholdDaily: 7.6, overtimeThresholdWeekly: 38,
    overtimeMultiplier: 1.5, doubleTimeThreshold: 10, doubleTimeMultiplier: 2.0,
    minRestBetweenShiftsHours: 10, maxConsecutiveDays: 6, spanOfHoursMax: 12,
    saturdayMultiplier: 1.5, sundayMultiplier: 2.0, publicHolidayMultiplier: 2.5, nightLoadingMultiplier: 1.15,
    casualLoadingPercent: 25, minEngagementHours: 2,
  },
  social_community: {
    label: 'SCHCADS',
    reference: 'MA000100',
    maxDailyHours: 10, maxWeeklyHours: 38,
    overtimeThresholdDaily: 7.6, overtimeThresholdWeekly: 38,
    overtimeMultiplier: 1.5, doubleTimeThreshold: 10, doubleTimeMultiplier: 2.0,
    minRestBetweenShiftsHours: 10, maxConsecutiveDays: 6, spanOfHoursMax: 12,
    saturdayMultiplier: 1.5, sundayMultiplier: 2.0, publicHolidayMultiplier: 2.5, nightLoadingMultiplier: 1.15,
    casualLoadingPercent: 25, minEngagementHours: 3,
  },
  hospitality: {
    label: 'Hospitality Award',
    reference: 'MA000009',
    maxDailyHours: 11.5, maxWeeklyHours: 38,
    overtimeThresholdDaily: 9, overtimeThresholdWeekly: 38,
    overtimeMultiplier: 1.5, doubleTimeThreshold: 11, doubleTimeMultiplier: 2.0,
    minRestBetweenShiftsHours: 10, maxConsecutiveDays: 6, spanOfHoursMax: 12,
    saturdayMultiplier: 1.25, sundayMultiplier: 1.5, publicHolidayMultiplier: 2.25, nightLoadingMultiplier: 1.15,
    casualLoadingPercent: 25, minEngagementHours: 2,
  },
  retail: {
    label: 'Retail Award',
    reference: 'MA000004',
    maxDailyHours: 11, maxWeeklyHours: 38,
    overtimeThresholdDaily: 9, overtimeThresholdWeekly: 38,
    overtimeMultiplier: 1.5, doubleTimeThreshold: 11, doubleTimeMultiplier: 2.0,
    minRestBetweenShiftsHours: 12, maxConsecutiveDays: 6, spanOfHoursMax: 11,
    saturdayMultiplier: 1.25, sundayMultiplier: 2.0, publicHolidayMultiplier: 2.5, nightLoadingMultiplier: 1.15,
    casualLoadingPercent: 25, minEngagementHours: 3,
  },
};

export const formatPresetSummary = (state: string, award: AwardPreset) =>
  `${state} · ${award.label} · ${award.maxWeeklyHours}h/week · OT ${award.overtimeMultiplier}× after ${award.overtimeThresholdDaily}h/day · ${award.minRestBetweenShiftsHours}h rest · ${award.casualLoadingPercent}% casual loading`;
