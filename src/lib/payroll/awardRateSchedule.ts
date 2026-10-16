/**
 * Effective-dated award minimum rates.
 *
 * Base figures are the FY2025-26 rates in australianAwards. The Annual Wage
 * Review 2026 ([2026] FWCFB 3500, 2 June 2026) applies from the first full pay
 * period on or after 1 July 2026:
 *   • modern award minimum wages +4.75%, weekly rates rounded to the nearest 10c
 *   • the lowest adult ongoing rate must be at least $1,004.90/wk ($26.44/hr)
 * Hourly = weekly / 38, rounded to the cent.
 */
import type { AustralianAward, AwardClassification, RateSchedule } from '@/data/australianAwards';
import type { AwardRule } from '@/types/staff';

export const AWR_2026 = {
  effectiveFrom: '2026-07-01',
  increasePct: 4.75,
  adultFloorWeekly: 1004.9,
  decision: '[2026] FWCFB 3500',
};

const round10c = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Apply the 2026 Annual Wage Review to a weekly rate. */
export function applyAwr2026(weekly: number, isAdult = true): number {
  const raised = round10c(weekly * (1 + AWR_2026.increasePct / 100));
  return isAdult ? Math.max(raised, AWR_2026.adultFloorWeekly) : raised;
}

export function scheduleFor(award: AustralianAward, c: AwardClassification): RateSchedule[] {
  const weekly = c.baseWeeklyRate ?? round2(c.baseHourlyRate * 38);
  const isAdult = !c.employeeType || c.employeeType === 'adult';
  const base: RateSchedule = { effectiveFrom: award.effectiveDate, weeklyRate: weekly, hourlyRate: round2(weekly / 38) };
  const next = applyAwr2026(weekly, isAdult);
  return [base, { effectiveFrom: AWR_2026.effectiveFrom, weeklyRate: next, hourlyRate: round2(next / 38) }];
}

/** Attach the schedule to every classification and roll base rates to the one in force today. */
export function applyRateSchedules(awards: AustralianAward[], today = new Date()): void {
  const iso = today.toISOString().slice(0, 10);
  awards.forEach((a) => {
    a.classifications.forEach((c) => {
      const isAdult = !c.employeeType || c.employeeType === 'adult';
      if (c.rateSchedule?.length) {
        if (!c.rateSchedule.some((s) => s.effectiveFrom >= AWR_2026.effectiveFrom)) {
          const latest = [...c.rateSchedule].sort((x, y) => y.effectiveFrom.localeCompare(x.effectiveFrom))[0];
          const next = applyAwr2026(latest.weeklyRate, isAdult);
          c.rateSchedule = [...c.rateSchedule, { effectiveFrom: AWR_2026.effectiveFrom, weeklyRate: next, hourlyRate: round2(next / 38) }];
        }
      } else {
        c.rateSchedule = scheduleFor(a, c);
      }
      c.rateSchedule.sort((x, y) => x.effectiveFrom.localeCompare(y.effectiveFrom));
      const inForce = [...c.rateSchedule].reverse().find((s) => s.effectiveFrom <= iso) ?? c.rateSchedule[0];
      c.baseWeeklyRate = inForce.weeklyRate;
      c.baseHourlyRate = inForce.hourlyRate;
    });
    if (iso >= AWR_2026.effectiveFrom) {
      a.version = `AWR 2026 (${AWR_2026.decision})`;
    }
  });
}

export function rateOn(c: AwardClassification, dateIso: string): number {
  const sched = c.rateSchedule ?? [];
  const hit = [...sched].sort((x, y) => y.effectiveFrom.localeCompare(x.effectiveFrom)).find((s) => s.effectiveFrom <= dateIso);
  return hit?.hourlyRate ?? c.baseHourlyRate;
}

const norm = (s?: string) => (s ?? '').toLowerCase().replace(/[^a-z0-9.]/g, '');

/** Match a staff member's award rule to the published classification. */
export function matchClassification(
  awards: AustralianAward[],
  rule?: AwardRule,
): { award: AustralianAward; classification: AwardClassification } | undefined {
  if (!rule) return undefined;
  const name = norm(rule.awardName);
  const award = awards.find((a) => name.includes(norm(a.shortName)) || norm(a.name).includes(name) || name.includes(norm(a.name)));
  if (!award) return undefined;
  const level = norm(rule.level);
  const cls =
    award.classifications.find((c) => norm(c.id) === norm(rule.id)) ??
    award.classifications.find((c) => level && norm(c.level) === level) ??
    award.classifications.find((c) => level && (norm(c.level).includes(level) || level.includes(norm(c.level))));
  return cls ? { award, classification: cls } : undefined;
}
