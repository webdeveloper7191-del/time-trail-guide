/**
 * Rate category engine (Adult / Junior / Apprentice / Trainee).
 *
 * Pure functions only. Pay always uses the *approved* step (approved junior age,
 * approved apprentice year, approved adult-rate qualification). Detected changes
 * (birthdays, new qualifications, new apprentice years) become pending reviews
 * that a manager must approve before pay changes.
 */

export type RateCategory = 'adult' | 'junior' | 'apprentice' | 'trainee';

export const rateCategoryLabels: Record<RateCategory, string> = {
  adult: 'Adult',
  junior: 'Junior',
  apprentice: 'Apprentice',
  trainee: 'Trainee',
};

export interface RateProfile {
  staffId: string;
  category: RateCategory;
  /** Junior: age step currently approved for pay. */
  approvedJuniorAge?: number;
  /** Apprentice */
  apprenticeStartDate?: string;
  approvedApprenticeYear?: 1 | 2 | 3 | 4;
  completedYear12?: boolean;
  adultApprentice?: boolean;
  /** Trainee */
  traineeLevel?: string;
  traineeProgress?: string;
  traineeEndDate?: string;
  trainingContractNumber?: string;
  /** Qualification approved by a manager as earning the adult rate. */
  adultRateQualification?: { name: string; approvedAt: string; approvedBy: string };
  /** Qualifications a manager declined (don't ask again). */
  dismissedQualifications?: string[];
  /** Manual "pay adult rate" override with reason. */
  adultOverride?: { reason: string; at: string; by: string };
}

export interface RateTable {
  /** Age -> % of adult rate. Ages missing fall back to nearest lower age; >= adultAge = 100. */
  juniorByAge: Record<number, number>;
  adultAge: number;
  apprenticeByYear: Record<number, number>;
  apprenticeYear12ByYear: Record<number, number>;
  adultApprenticeByYear: Record<number, number>;
  traineeByLevel: Record<string, number>;
  /** Qualifications that earn juniors the adult rate under this award. */
  adultRateQualifications: string[];
}

export const DEFAULT_RATE_TABLE: RateTable = {
  juniorByAge: { 15: 40, 16: 50, 17: 60, 18: 70, 19: 80, 20: 90 },
  adultAge: 21,
  apprenticeByYear: { 1: 55, 2: 65, 3: 80, 4: 95 },
  apprenticeYear12ByYear: { 1: 60, 2: 70, 3: 80, 4: 95 },
  adultApprenticeByYear: { 1: 80, 2: 85, 3: 90, 4: 95 },
  traineeByLevel: { 'Level A': 75, 'Level B': 70, 'Level C': 65 },
  adultRateQualifications: ['Certificate III in Early Childhood', 'Diploma of Early Childhood'],
};

const DAY = 86_400_000;

export function ageOn(dob: string, on: Date): number {
  const d = new Date(dob);
  let age = on.getFullYear() - d.getFullYear();
  const m = on.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && on.getDate() < d.getDate())) age--;
  return age;
}

export function nextBirthday(dob: string, from: Date): Date {
  const d = new Date(dob);
  const next = new Date(from.getFullYear(), d.getMonth(), d.getDate());
  if (next < startOfDay(from)) next.setFullYear(next.getFullYear() + 1);
  return next;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function juniorPercent(age: number, table: RateTable): number {
  if (age >= table.adultAge) return 100;
  const ages = Object.keys(table.juniorByAge).map(Number).sort((a, b) => a - b);
  let pct = table.juniorByAge[ages[0]] ?? 100;
  for (const a of ages) if (age >= a) pct = table.juniorByAge[a];
  return pct;
}

export function apprenticeYearOn(startDate: string, on: Date): 1 | 2 | 3 | 4 {
  const s = new Date(startDate);
  let years = on.getFullYear() - s.getFullYear();
  if (on.getMonth() < s.getMonth() || (on.getMonth() === s.getMonth() && on.getDate() < s.getDate())) years--;
  return Math.min(4, Math.max(1, years + 1)) as 1 | 2 | 3 | 4;
}

export function apprenticePercent(p: RateProfile, year: number, table: RateTable): number {
  const src = p.adultApprentice
    ? table.adultApprenticeByYear
    : p.completedYear12 ? table.apprenticeYear12ByYear : table.apprenticeByYear;
  return src[year] ?? 100;
}

export interface ResolvedCategoryRate {
  adultRate: number;
  percent: number;
  hourlyRate: number;
  /** e.g. "Level 2 adult $28.12 × 70% (Junior, age 18) = $19.68/hr" */
  working: string;
}

const money = (n: number) => `$${n.toFixed(2)}`;

export function resolveCategoryRate(
  adultRate: number,
  profile: RateProfile | undefined,
  table: RateTable,
  classificationLabel = 'Adult',
): ResolvedCategoryRate {
  const base = `${classificationLabel} adult ${money(adultRate)}`;
  const done = (percent: number, why: string): ResolvedCategoryRate => {
    const hourlyRate = Math.round(adultRate * percent) / 100;
    return {
      adultRate,
      percent,
      hourlyRate,
      working: percent === 100 && why === '' ? `${base}/hr` : `${base} × ${percent}%${why ? ` (${why})` : ''} = ${money(hourlyRate)}/hr`,
    };
  };

  if (!profile || profile.category === 'adult') return done(100, '');
  if (profile.adultOverride) return done(100, `adult rate override — ${profile.adultOverride.reason}`);

  switch (profile.category) {
    case 'junior': {
      if (profile.adultRateQualification) return done(100, `Junior, holds ${profile.adultRateQualification.name} — adult rate`);
      const age = profile.approvedJuniorAge ?? table.adultAge;
      return done(juniorPercent(age, table), `Junior, age ${age}`);
    }
    case 'apprentice': {
      const y = profile.approvedApprenticeYear ?? 1;
      const kind = profile.adultApprentice ? 'Adult apprentice' : 'Apprentice';
      return done(apprenticePercent(profile, y, table), `${kind}, year ${y}`);
    }
    case 'trainee': {
      const lvl = profile.traineeLevel ?? '';
      return done(table.traineeByLevel[lvl] ?? 100, `Trainee${lvl ? `, ${lvl}` : ''}`);
    }
  }
  return done(100, '');
}

export type ReviewKind =
  | 'junior_birthday'
  | 'junior_upcoming_birthday'
  | 'qualification_adult_rate'
  | 'apprentice_year'
  | 'apprentice_upcoming_year'
  | 'traineeship_ending'
  | 'traineeship_ended';

export interface RateReview {
  id: string;
  staffId: string;
  kind: ReviewKind;
  /** true = manager must approve/decline; false = heads-up only */
  needsApproval: boolean;
  severity: 'action' | 'warning' | 'info';
  title: string;
  detail: string;
  dueDate?: string;
  /** Date the change was due — used for back-pay when approval is late. */
  effectiveFrom?: string;
  fromPercent?: number;
  toPercent?: number;
  /** Payload used when approving */
  approve?: Partial<RateProfile>;
  qualification?: string;
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function detectRateReviews(
  staff: { id: string; dateOfBirth?: string; qualifications?: string[] },
  profile: RateProfile | undefined,
  table: RateTable,
  today: Date,
  lookaheadDays = 30,
): RateReview[] {
  if (!profile || profile.category === 'adult') return [];
  const out: RateReview[] = [];
  const horizon = new Date(startOfDay(today).getTime() + lookaheadDays * DAY);

  if (profile.category === 'junior' && !profile.adultRateQualification && !profile.adultOverride) {
    if (staff.dateOfBirth) {
      const actual = ageOn(staff.dateOfBirth, today);
      const approved = profile.approvedJuniorAge ?? actual;
      const from = juniorPercent(approved, table);
      const to = juniorPercent(actual, table);
      if (actual > approved && to !== from) {
        out.push({
          id: `${staff.id}:junior_birthday:${actual}`,
          staffId: staff.id, kind: 'junior_birthday', needsApproval: true, severity: 'action',
          title: `Turned ${actual} — pay increase awaiting approval`,
          detail: `Junior rate moves from ${from}% (age ${approved}) to ${to}% (age ${actual}).`,
          fromPercent: from, toPercent: to, approve: { approvedJuniorAge: actual },
          effectiveFrom: (() => { const d = new Date(staff.dateOfBirth!); return iso(new Date(d.getFullYear() + actual, d.getMonth(), d.getDate())); })(),
        });
      } else {
        const nb = nextBirthday(staff.dateOfBirth, today);
        const nextPct = juniorPercent(actual + 1, table);
        if (nb <= horizon && nextPct !== to) {
          out.push({
            id: `${staff.id}:junior_upcoming:${actual + 1}`,
            staffId: staff.id, kind: 'junior_upcoming_birthday', needsApproval: false, severity: 'info',
            title: `Turns ${actual + 1} on ${nb.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}`,
            detail: `Junior rate will move from ${to}% to ${nextPct}% once approved.`,
            dueDate: iso(nb), fromPercent: to, toPercent: nextPct,
          });
        }
      }
    }
    const match = (staff.qualifications ?? []).find(
      q => table.adultRateQualifications.includes(q) && !(profile.dismissedQualifications ?? []).includes(q),
    );
    if (match) {
      const from = juniorPercent(profile.approvedJuniorAge ?? table.adultAge, table);
      out.push({
        id: `${staff.id}:qual:${match}`,
        staffId: staff.id, kind: 'qualification_adult_rate', needsApproval: true, severity: 'action',
        title: `Holds ${match} — adult rate awaiting approval`,
        detail: `This qualification earns the adult rate under the award (${from}% → 100%).`,
        fromPercent: from, toPercent: 100, qualification: match,
      });
    }
  }

  if (profile.category === 'apprentice' && profile.apprenticeStartDate) {
    const actual = apprenticeYearOn(profile.apprenticeStartDate, today);
    const approved = profile.approvedApprenticeYear ?? actual;
    if (actual > approved) {
      out.push({
        id: `${staff.id}:apprentice_year:${actual}`,
        staffId: staff.id, kind: 'apprentice_year', needsApproval: true, severity: 'action',
        title: `Started apprenticeship year ${actual} — pay increase awaiting approval`,
        detail: `Moves from ${apprenticePercent(profile, approved, table)}% to ${apprenticePercent(profile, actual, table)}%.`,
        fromPercent: apprenticePercent(profile, approved, table), toPercent: apprenticePercent(profile, actual, table),
        approve: { approvedApprenticeYear: actual },
        effectiveFrom: (() => { const d = new Date(profile.apprenticeStartDate!); return iso(new Date(d.getFullYear() + actual - 1, d.getMonth(), d.getDate())); })(),
      });
    } else if (actual < 4) {
      const s = new Date(profile.apprenticeStartDate);
      const next = new Date(s.getFullYear() + actual, s.getMonth(), s.getDate());
      if (next <= horizon) {
        out.push({
          id: `${staff.id}:apprentice_upcoming:${actual + 1}`,
          staffId: staff.id, kind: 'apprentice_upcoming_year', needsApproval: false, severity: 'info',
          title: `Apprenticeship year ${actual + 1} starts ${next.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}`,
          detail: `Rate will move to ${apprenticePercent(profile, actual + 1, table)}% once approved.`,
          dueDate: iso(next),
        });
      }
    }
  }

  if (profile.category === 'trainee' && profile.traineeEndDate) {
    const end = new Date(profile.traineeEndDate);
    if (end < startOfDay(today)) {
      out.push({
        id: `${staff.id}:trainee_ended`, staffId: staff.id, kind: 'traineeship_ended', needsApproval: false, severity: 'warning',
        title: 'Traineeship has ended', detail: 'Review their rate category — they may now need the adult rate.',
        dueDate: profile.traineeEndDate,
      });
    } else if (end <= horizon) {
      out.push({
        id: `${staff.id}:trainee_ending`, staffId: staff.id, kind: 'traineeship_ending', needsApproval: false, severity: 'warning',
        title: `Traineeship ends ${end.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`,
        detail: 'Plan the move to the adult rate or a new arrangement.', dueDate: profile.traineeEndDate,
      });
    }
  }

  return out;
}
