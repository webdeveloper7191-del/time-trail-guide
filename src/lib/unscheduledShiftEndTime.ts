/**
 * Unscheduled shift end-time resolution, validation and guardrails.
 *
 * When a staff member clocks in without a rostered shift, the timesheet policy
 * (`unscheduled` section) decides whether a roster shift is created and how its
 * end time is derived. This module owns:
 *   1. Config validation  — `validateUnscheduledEndTimeSettings`
 *   2. Runtime resolution — `resolveUnscheduledShiftWindow`
 *
 * All arithmetic is done on absolute instants (UTC ms); wall-clock rules
 * (location close time, area default end) are interpreted in the *location's*
 * timezone, which keeps overnight and DST transitions correct.
 */

import type { UnscheduledShiftsSettings, UnscheduledEndTimeRule } from '@/types/timesheetPolicy';
import type { OperatingHours } from '@/types/location';

// ============= Guardrail bounds =============

export const END_TIME_GUARDRAILS = {
  minFixedDurationHours: 0.25,
  maxFixedDurationHours: 24,
  minMaxDurationHours: 1,
  maxMaxDurationHours: 24,
  allowedRoundingMinutes: [0, 1, 5, 6, 10, 15, 20, 30, 60],
} as const;

// ============= Validation =============

export type EndTimeIssueLevel = 'error' | 'warning' | 'info';

export interface EndTimeValidationIssue {
  field: keyof UnscheduledShiftsSettings | 'createdShiftEndTimeRule';
  level: EndTimeIssueLevel;
  message: string;
}

export interface EndTimeValidationContext {
  /** Location has operating hours configured (needed for `location_close`). */
  hasOperatingHours?: boolean;
  /** At least one area defines a default shift end (needed for `area_default_shift`). */
  hasAreaDefaultShiftEnd?: boolean;
  /** Editing tenant defaults (locations may still differ). */
  isTenantScope?: boolean;
}

export function validateUnscheduledEndTimeSettings(
  s: UnscheduledShiftsSettings,
  ctx: EndTimeValidationContext = {},
): EndTimeValidationIssue[] {
  const issues: EndTimeValidationIssue[] = [];
  if (s.createShiftInRoster === 'never') return issues;

  const g = END_TIME_GUARDRAILS;
  const rule = s.createdShiftEndTimeRule;

  // --- Max duration (applies to every rule; it is the universal safety cap) ---
  if (!Number.isFinite(s.createdShiftMaxDurationHours) || s.createdShiftMaxDurationHours <= 0) {
    issues.push({
      field: 'createdShiftMaxDurationHours',
      level: 'error',
      message: 'Maximum shift length must be greater than 0 hours — it is the safety cap that closes a shift when no clock-out arrives.',
    });
  } else if (s.createdShiftMaxDurationHours < g.minMaxDurationHours) {
    issues.push({
      field: 'createdShiftMaxDurationHours',
      level: 'error',
      message: `Maximum shift length must be at least ${g.minMaxDurationHours} hour.`,
    });
  } else if (s.createdShiftMaxDurationHours > g.maxMaxDurationHours) {
    issues.push({
      field: 'createdShiftMaxDurationHours',
      level: 'error',
      message: `Maximum shift length cannot exceed ${g.maxMaxDurationHours} hours (a shift may not span more than one day).`,
    });
  } else if (s.createdShiftMaxDurationHours > 16) {
    issues.push({
      field: 'createdShiftMaxDurationHours',
      level: 'warning',
      message: 'Shifts longer than 16 hours are unusual and may breach fatigue rules. Confirm this is intended.',
    });
  }

  // --- Rounding (applies to every rule) ---
  if (!Number.isInteger(s.createdShiftRoundToMinutes) || s.createdShiftRoundToMinutes < 0) {
    issues.push({
      field: 'createdShiftRoundToMinutes',
      level: 'error',
      message: 'Rounding must be a whole number of minutes (use 0 to keep exact times).',
    });
  } else if (s.createdShiftRoundToMinutes > 60) {
    issues.push({
      field: 'createdShiftRoundToMinutes',
      level: 'error',
      message: 'Rounding cannot exceed 60 minutes.',
    });
  } else if (
    s.createdShiftRoundToMinutes > 0 &&
    60 % s.createdShiftRoundToMinutes !== 0
  ) {
    issues.push({
      field: 'createdShiftRoundToMinutes',
      level: 'warning',
      message: `${s.createdShiftRoundToMinutes} minutes does not divide evenly into an hour, so rounded shift times will drift across the day. Use ${g.allowedRoundingMinutes.filter(m => m > 0).join(', ')}.`,
    });
  }
  if (
    s.createdShiftRoundToMinutes > 0 &&
    s.createdShiftMaxDurationHours > 0 &&
    s.createdShiftRoundToMinutes / 60 > s.createdShiftMaxDurationHours
  ) {
    issues.push({
      field: 'createdShiftRoundToMinutes',
      level: 'error',
      message: 'Rounding interval is longer than the maximum shift length, which would round every shift away to zero.',
    });
  }
  if (rule === 'open_ended' && s.createdShiftRoundToMinutes > 0) {
    issues.push({
      field: 'createdShiftRoundToMinutes',
      level: 'info',
      message: 'Open-ended shifts have no end time until clock-out, so rounding only applies to the start time (and to the end once the clock-out lands).',
    });
  }

  // --- Rule-specific ---
  switch (rule) {
    case 'fixed_duration': {
      const d = s.createdShiftFixedDurationHours;
      if (!Number.isFinite(d) || d <= 0) {
        issues.push({
          field: 'createdShiftFixedDurationHours',
          level: 'error',
          message: 'Fixed shift length must be greater than 0 hours.',
        });
      } else if (d < g.minFixedDurationHours) {
        issues.push({
          field: 'createdShiftFixedDurationHours',
          level: 'error',
          message: `Fixed shift length must be at least ${g.minFixedDurationHours * 60} minutes.`,
        });
      } else if (d > g.maxFixedDurationHours) {
        issues.push({
          field: 'createdShiftFixedDurationHours',
          level: 'error',
          message: `Fixed shift length cannot exceed ${g.maxFixedDurationHours} hours.`,
        });
      } else if (d > s.createdShiftMaxDurationHours && s.createdShiftMaxDurationHours > 0) {
        issues.push({
          field: 'createdShiftFixedDurationHours',
          level: 'error',
          message: `Fixed shift length (${d}h) exceeds the maximum shift length (${s.createdShiftMaxDurationHours}h), so every created shift would be truncated by the cap. Lower the fixed length or raise the cap.`,
        });
      }
      break;
    }
    case 'location_close': {
      if (ctx.hasOperatingHours === false) {
        issues.push({
          field: 'createdShiftEndTimeRule',
          level: ctx.isTenantScope ? 'warning' : 'error',
          message: ctx.isTenantScope
            ? 'Some locations have no operating hours configured. For those the created shift falls back to the maximum shift length.'
            : 'This location has no operating hours configured, so the closing time is unknown. The created shift will fall back to the maximum shift length.',
        });
      }
      issues.push({
        field: 'createdShiftEndTimeRule',
        level: 'info',
        message: 'Closing time is read in the location\'s own timezone. A clock-in after closing rolls forward to the next open day.',
      });
      break;
    }
    case 'area_default_shift': {
      if (ctx.hasAreaDefaultShiftEnd === false) {
        issues.push({
          field: 'createdShiftEndTimeRule',
          level: ctx.isTenantScope ? 'warning' : 'error',
          message: 'No area default shift end time is configured, so the created shift will fall back to the location closing time, then to the maximum shift length.',
        });
      }
      break;
    }
    case 'open_ended': {
      if (s.createShiftInRoster === 'on_clock_in') {
        issues.push({
          field: 'createdShiftEndTimeRule',
          level: 'warning',
          message: 'Open-ended shifts created on clock-in have no end time on the roster until the staff member clocks out. Coverage, cost and ratio calculations treat them as running to the maximum shift length.',
        });
      }
      if (!s.markCreatedShiftUnapproved) {
        issues.push({
          field: 'markCreatedShiftUnapproved',
          level: 'warning',
          message: 'Open-ended shifts are provisional. Keep "Mark created shift as unapproved" on so they are excluded from published rosters and budget actuals.',
        });
      }
      break;
    }
    case 'actual_clock_out': {
      if (s.createShiftInRoster === 'on_clock_in') {
        issues.push({
          field: 'createdShiftEndTimeRule',
          level: 'info',
          message: 'On clock-in the actual clock-out is not known yet, so the shift is created provisionally at the maximum shift length and corrected when the staff member clocks out.',
        });
      }
      break;
    }
  }

  return issues;
}

export function hasBlockingEndTimeIssue(issues: EndTimeValidationIssue[]): boolean {
  return issues.some(i => i.level === 'error');
}

// ============= Timezone helpers =============

/** Offset (ms) of `tz` at the given instant. */
function tzOffsetMs(instant: number, tz: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const parts = dtf.formatToParts(new Date(instant));
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value);
  const asUtc = Date.UTC(
    get('year'), get('month') - 1, get('day'),
    get('hour') % 24, get('minute'), get('second'),
  );
  return asUtc - instant;
}

function safeTz(tz?: string): string {
  if (!tz) return 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return tz;
  } catch {
    return 'UTC';
  }
}

export interface LocalWallClock {
  year: number; month: number; day: number; hour: number; minute: number;
  /** 0 = Sunday */
  dayOfWeek: number;
}

/** Wall-clock representation of an instant in a timezone. */
export function toLocalWallClock(instant: number, tz: string): LocalWallClock {
  const zone = safeTz(tz);
  const shifted = new Date(instant + tzOffsetMs(instant, zone));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    dayOfWeek: shifted.getUTCDay(),
  };
}

/**
 * Instant for a local wall-clock time in `tz`. DST-safe: resolves the offset
 * iteratively so spring-forward / fall-back boundaries land on a real instant.
 */
export function fromLocalWallClock(
  parts: { year: number; month: number; day: number; hour: number; minute: number },
  tz: string,
): number {
  const zone = safeTz(tz);
  const naive = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0);
  let instant = naive - tzOffsetMs(naive, zone);
  // Second pass corrects offset changes across the boundary.
  instant = naive - tzOffsetMs(instant, zone);
  return instant;
}

function parseHhMm(value?: string): { hour: number; minute: number } | null {
  if (!value) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour < 0 || hour > 24 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

/** Round an instant to the nearest `minutes` boundary in local wall-clock terms. */
export function roundInstant(
  instant: number,
  minutes: number,
  tz: string,
  direction: 'nearest' | 'up' | 'down' = 'nearest',
): number {
  if (!minutes || minutes <= 0) return instant;
  const zone = safeTz(tz);
  const local = toLocalWallClock(instant, zone);
  const minutesOfDay = local.hour * 60 + local.minute;
  const remainder = minutesOfDay % minutes;
  let target = minutesOfDay - remainder;
  if (direction === 'up' && remainder > 0) target += minutes;
  if (direction === 'nearest' && remainder >= minutes / 2) target += minutes;
  const dayStart = fromLocalWallClock(
    { year: local.year, month: local.month, day: local.day, hour: 0, minute: 0 },
    zone,
  );
  return dayStart + target * 60_000;
}

// ============= Resolution =============

export interface ResolveWindowInput {
  settings: UnscheduledShiftsSettings;
  /** Clock-in instant (ISO string or ms). */
  clockIn: string | number;
  /** Clock-out instant, when known. */
  clockOut?: string | number | null;
  /** IANA timezone of the location. Defaults to UTC when missing/invalid. */
  timezone?: string;
  /** Location operating hours (used by `location_close`). */
  operatingHours?: OperatingHours[];
  /** Area default shift end, "HH:mm" local (used by `area_default_shift`). */
  areaDefaultShiftEnd?: string;
  /** When true the shift is being created before the clock-out is known. */
  provisional?: boolean;
}

export interface ResolvedShiftWindow {
  startIso: string;
  /** Null only for `open_ended` while still provisional. */
  endIso: string | null;
  startMs: number;
  endMs: number | null;
  durationHours: number | null;
  rule: UnscheduledEndTimeRule;
  /** Rule actually used after fallbacks (e.g. location_close → max_duration). */
  appliedRule: UnscheduledEndTimeRule | 'max_duration';
  /** Truncated by the maximum shift length guardrail. */
  cappedByMaxDuration: boolean;
  /** End time is a placeholder to be corrected at clock-out. */
  isProvisional: boolean;
  roundedToMinutes: number;
  timezone: string;
  warnings: string[];
}

const MS_HOUR = 3_600_000;

function toMs(v: string | number): number {
  return typeof v === 'number' ? v : new Date(v).getTime();
}

export function resolveUnscheduledShiftWindow(input: ResolveWindowInput): ResolvedShiftWindow {
  const { settings: s } = input;
  const tz = safeTz(input.timezone);
  const warnings: string[] = [];

  const startRaw = toMs(input.clockIn);
  if (!Number.isFinite(startRaw)) throw new Error('resolveUnscheduledShiftWindow: invalid clock-in');
  const clockOutMs = input.clockOut != null ? toMs(input.clockOut) : null;

  const round = Math.max(0, Math.round(s.createdShiftRoundToMinutes || 0));
  const maxHours = clampNumber(s.createdShiftMaxDurationHours, 0.25, END_TIME_GUARDRAILS.maxMaxDurationHours, 12);
  const maxEnd = startRaw + maxHours * MS_HOUR;

  const provisional = input.provisional ?? clockOutMs == null;
  let appliedRule: ResolvedShiftWindow['appliedRule'] = s.createdShiftEndTimeRule;
  let end: number | null = null;

  if (clockOutMs != null && Number.isFinite(clockOutMs) && !provisional &&
      (s.createdShiftEndTimeRule === 'actual_clock_out' || s.createdShiftEndTimeRule === 'open_ended')) {
    end = clockOutMs;
    appliedRule = s.createdShiftEndTimeRule;
  } else {
    switch (s.createdShiftEndTimeRule) {
      case 'fixed_duration': {
        const fixed = clampNumber(s.createdShiftFixedDurationHours, 0.25, END_TIME_GUARDRAILS.maxFixedDurationHours, 8);
        end = startRaw + fixed * MS_HOUR;
        break;
      }
      case 'location_close': {
        end = resolveLocationClose(startRaw, tz, input.operatingHours);
        if (end == null) {
          warnings.push('No operating hours configured for this location — fell back to the maximum shift length.');
          end = maxEnd;
          appliedRule = 'max_duration';
        }
        break;
      }
      case 'area_default_shift': {
        end = resolveWallClockAfter(startRaw, tz, input.areaDefaultShiftEnd);
        if (end == null) {
          end = resolveLocationClose(startRaw, tz, input.operatingHours);
          if (end != null) {
            warnings.push('No area default shift end configured — used the location closing time.');
            appliedRule = 'location_close';
          }
        }
        if (end == null) {
          warnings.push('No area default shift end or operating hours configured — fell back to the maximum shift length.');
          end = maxEnd;
          appliedRule = 'max_duration';
        }
        break;
      }
      case 'open_ended': {
        if (provisional) {
          end = null;
        } else {
          end = clockOutMs ?? maxEnd;
        }
        break;
      }
      case 'actual_clock_out':
      default: {
        if (clockOutMs != null && Number.isFinite(clockOutMs)) {
          end = clockOutMs;
        } else {
          warnings.push('Clock-out not recorded yet — the shift is provisional at the maximum shift length and will be corrected on clock-out.');
          end = maxEnd;
          appliedRule = 'max_duration';
        }
        break;
      }
    }
  }

  // ---- Guardrails -------------------------------------------------------
  let cappedByMaxDuration = false;
  if (end != null) {
    if (end <= startRaw) {
      warnings.push('Resolved end time was not after the clock-in — extended to the minimum 15 minutes.');
      end = startRaw + 15 * 60_000;
    }
    if (end > maxEnd) {
      end = maxEnd;
      cappedByMaxDuration = true;
      warnings.push(`Shift truncated at the ${maxHours}h maximum shift length.`);
    }
  }

  // ---- Rounding ---------------------------------------------------------
  let start = startRaw;
  if (round > 0) {
    start = roundInstant(startRaw, round, tz, 'down');
    if (end != null) {
      let roundedEnd = roundInstant(end, round, tz, 'up');
      // Never let rounding push the shift past the max-duration cap.
      if (roundedEnd > start + maxHours * MS_HOUR) {
        roundedEnd = roundInstant(start + maxHours * MS_HOUR, round, tz, 'down');
        cappedByMaxDuration = true;
      }
      if (roundedEnd <= start) roundedEnd = start + round * 60_000;
      end = roundedEnd;
    }
  }

  return {
    startIso: new Date(start).toISOString(),
    endIso: end != null ? new Date(end).toISOString() : null,
    startMs: start,
    endMs: end,
    durationHours: end != null ? Number(((end - start) / MS_HOUR).toFixed(4)) : null,
    rule: s.createdShiftEndTimeRule,
    appliedRule,
    cappedByMaxDuration,
    isProvisional: provisional,
    roundedToMinutes: round,
    timezone: tz,
    warnings,
  };
}

function clampNumber(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.min(Math.max(value, min), max);
}

/** Next closing instant at/after `instant`, honouring overnight closes and closed days. */
function resolveLocationClose(instant: number, tz: string, hours?: OperatingHours[]): number | null {
  if (!hours || hours.length === 0) return null;
  const byDay = new Map<number, OperatingHours>();
  hours.forEach(h => byDay.set(h.dayOfWeek, h));

  for (let offset = 0; offset <= 7; offset++) {
    const probe = instant + offset * 24 * MS_HOUR;
    const local = toLocalWallClock(probe, tz);
    const day = byDay.get(local.dayOfWeek);
    if (!day || !day.isOpen) continue;
    const close = parseHhMm(day.closeTime);
    if (!close) continue;
    const open = parseHhMm(day.openTime);
    // Overnight trading (close <= open) rolls the close into the next day.
    const overnight = open != null && (close.hour * 60 + close.minute) <= (open.hour * 60 + open.minute);
    let end = fromLocalWallClock(
      { year: local.year, month: local.month, day: local.day, hour: close.hour % 24, minute: close.minute },
      tz,
    );
    if (close.hour >= 24) end += 24 * MS_HOUR;
    if (overnight) end += 24 * MS_HOUR;
    if (end > instant) return end;
  }
  return null;
}

/** Next occurrence of a local "HH:mm" strictly after `instant`. */
function resolveWallClockAfter(instant: number, tz: string, hhmm?: string): number | null {
  const t = parseHhMm(hhmm);
  if (!t) return null;
  for (let offset = 0; offset <= 1; offset++) {
    const local = toLocalWallClock(instant + offset * 24 * MS_HOUR, tz);
    let candidate = fromLocalWallClock(
      { year: local.year, month: local.month, day: local.day, hour: t.hour % 24, minute: t.minute },
      tz,
    );
    if (t.hour >= 24) candidate += 24 * MS_HOUR;
    if (candidate > instant) return candidate;
  }
  return null;
}
