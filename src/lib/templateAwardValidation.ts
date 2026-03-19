/**
 * Template-Award Validation Service
 * Compares shift template settings against award configuration boundaries
 * Implements layered validation: templates can customize upward from award minimums
 */

import { ShiftTemplate, ShiftSpecialType } from '@/types/roster';
import {
  AwardType,
  OnCallConfiguration,
  SleepoverConfiguration,
  BrokenShiftConfiguration,
  DEFAULT_ON_CALL_CONFIGS,
  DEFAULT_SLEEPOVER_CONFIGS,
  DEFAULT_BROKEN_SHIFT_CONFIGS,
} from '@/types/allowances';

export type ConflictSeverity = 'info' | 'warning' | 'error';
export type ConflictDirection = 'above' | 'below' | 'equal' | 'custom';

export interface TemplateConflict {
  id: string;
  field: string;
  label: string;
  awardValue: number | string;
  templateValue: number | string;
  severity: ConflictSeverity;
  direction: ConflictDirection;
  message: string;
  section: 'on_call' | 'sleepover' | 'broken_shift';
}

export interface ValidationResult {
  isValid: boolean;
  conflicts: TemplateConflict[];
  hasErrors: boolean;
  hasWarnings: boolean;
  conflictCount: number;
}

/**
 * Get the award defaults for a given field in a specific shift type
 */
export function getAwardDefault(
  shiftType: ShiftSpecialType,
  field: string,
  awardType: AwardType = 'general'
): number | string | undefined {
  if (shiftType === 'on_call') {
    const config = DEFAULT_ON_CALL_CONFIGS[awardType];
    return (config as unknown as Record<string, number | string | undefined>)[field];
  }
  if (shiftType === 'sleepover') {
    const config = DEFAULT_SLEEPOVER_CONFIGS[awardType];
    return (config as unknown as Record<string, number | string | undefined>)[field];
  }
  if (shiftType === 'broken') {
    const config = DEFAULT_BROKEN_SHIFT_CONFIGS[awardType];
    return (config as unknown as Record<string, number | string | undefined>)[field];
  }
  return undefined;
}

/**
 * Get all award defaults for a shift type as a flat record
 */
export function getAwardDefaults(
  shiftType: ShiftSpecialType,
  awardType: AwardType = 'general'
): Record<string, number | string | undefined> {
  if (shiftType === 'on_call') return { ...DEFAULT_ON_CALL_CONFIGS[awardType] };
  if (shiftType === 'sleepover') return { ...DEFAULT_SLEEPOVER_CONFIGS[awardType] };
  if (shiftType === 'broken') return { ...DEFAULT_BROKEN_SHIFT_CONFIGS[awardType] };
  return {};
}

// Fields where template value must be >= award value (upward-only overrides)
const MINIMUM_FIELDS: Record<string, { label: string; section: TemplateConflict['section'] }> = {
  // On-Call
  standbyRate: { label: 'Standby Rate', section: 'on_call' },
  callbackMinimumHours: { label: 'Callback Minimum Hours', section: 'on_call' },
  callbackRateMultiplier: { label: 'Callback Rate Multiplier', section: 'on_call' },
  weekendStandbyRate: { label: 'Weekend Standby Rate', section: 'on_call' },
  publicHolidayStandbyMultiplier: { label: 'Public Holiday Multiplier', section: 'on_call' },
  // Sleepover
  flatRate: { label: 'Sleepover Flat Rate', section: 'sleepover' },
  disturbanceRatePerHour: { label: 'Disturbance Hourly Rate', section: 'sleepover' },
  disturbanceMinimumHours: { label: 'Disturbance Min Hours', section: 'sleepover' },
  disturbanceRateMultiplier: { label: 'Disturbance Multiplier', section: 'sleepover' },
  weekendFlatRate: { label: 'Weekend Flat Rate', section: 'sleepover' },
  publicHolidayFlatRate: { label: 'Public Holiday Flat Rate', section: 'sleepover' },
  // Broken Shift
  allowanceRate: { label: 'Allowance Rate', section: 'broken_shift' },
  minimumGapMinutes: { label: 'Minimum Gap', section: 'broken_shift' },
};

/**
 * Validate a shift template against award configuration
 */
export function validateTemplateAgainstAward(
  template: Partial<ShiftTemplate>,
  awardType: AwardType = 'general'
): ValidationResult {
  const conflicts: TemplateConflict[] = [];
  const shiftType = template.shiftType || 'regular';

  if (shiftType === 'regular' || shiftType === 'recall' || shiftType === 'emergency') {
    return { isValid: true, conflicts: [], hasErrors: false, hasWarnings: false, conflictCount: 0 };
  }

  const awardDefaults = getAwardDefaults(shiftType, awardType);
  const templateSettings = getTemplateSettings(template, shiftType);

  for (const [field, meta] of Object.entries(MINIMUM_FIELDS)) {
    if (meta.section !== getSection(shiftType)) continue;

    const awardVal = awardDefaults[field];
    const templateVal = templateSettings[field];

    if (awardVal === undefined || templateVal === undefined) continue;

    const awardNum = Number(awardVal);
    const templateNum = Number(templateVal);

    if (isNaN(awardNum) || isNaN(templateNum)) continue;

    if (templateNum < awardNum) {
      conflicts.push({
        id: `${shiftType}-${field}`,
        field,
        label: meta.label,
        awardValue: awardNum,
        templateValue: templateNum,
        severity: 'error',
        direction: 'below',
        message: `Template value ($${templateNum}) is below the award minimum ($${awardNum})`,
        section: meta.section,
      });
    } else if (templateNum > awardNum) {
      conflicts.push({
        id: `${shiftType}-${field}`,
        field,
        label: meta.label,
        awardValue: awardNum,
        templateValue: templateNum,
        severity: 'info',
        direction: 'above',
        message: `Template value ($${templateNum}) is above award default ($${awardNum})`,
        section: meta.section,
      });
    }
  }

  const hasErrors = conflicts.some(c => c.severity === 'error');
  const hasWarnings = conflicts.some(c => c.severity === 'warning');

  return {
    isValid: !hasErrors,
    conflicts,
    hasErrors,
    hasWarnings,
    conflictCount: conflicts.filter(c => c.severity !== 'info').length,
  };
}

function getSection(shiftType: ShiftSpecialType): TemplateConflict['section'] {
  if (shiftType === 'on_call') return 'on_call';
  if (shiftType === 'sleepover') return 'sleepover';
  return 'broken_shift';
}

function getTemplateSettings(
  template: Partial<ShiftTemplate>,
  shiftType: ShiftSpecialType
): Record<string, number | string | undefined> {
  if (shiftType === 'on_call' && template.onCallSettings) {
    return { ...template.onCallSettings };
  }
  if (shiftType === 'sleepover' && template.sleepoverSettings) {
    return { ...template.sleepoverSettings };
  }
  if (shiftType === 'broken' && template.brokenShiftSettings) {
    return { ...template.brokenShiftSettings };
  }
  return {};
}

/**
 * Check if a specific field uses award default or has a custom value
 */
export function isUsingAwardDefault(
  template: Partial<ShiftTemplate>,
  field: string,
  awardType: AwardType = 'general'
): boolean {
  const shiftType = template.shiftType || 'regular';
  const awardDefaults = getAwardDefaults(shiftType, awardType);
  const templateSettings = getTemplateSettings(template, shiftType);

  const awardVal = awardDefaults[field];
  const templateVal = templateSettings[field];

  if (templateVal === undefined) return true;
  return Number(awardVal) === Number(templateVal);
}

/**
 * Get a summary of all deviations for display on template cards
 */
export function getDeviationSummary(
  template: ShiftTemplate,
  awardType: AwardType = 'general'
): { aboveCount: number; belowCount: number; totalDeviations: number } {
  const result = validateTemplateAgainstAward(template, awardType);
  const aboveCount = result.conflicts.filter(c => c.direction === 'above').length;
  const belowCount = result.conflicts.filter(c => c.direction === 'below').length;
  return { aboveCount, belowCount, totalDeviations: aboveCount + belowCount };
}
