import { describe, it, expect } from 'vitest';
import { DEFAULT_RATE_TABLE as T, detectRateReviews, resolveCategoryRate, RateProfile } from './rateCategory';

const today = new Date(2026, 9, 13);

describe('rate category', () => {
  it('pays an approved 18-year-old junior 70% of the adult rate with the working shown', () => {
    const r = resolveCategoryRate(28.12, { staffId: 's', category: 'junior', approvedJuniorAge: 18 }, T, 'Level 2');
    expect(r.hourlyRate).toBe(19.68);
    expect(r.working).toBe('Level 2 adult $28.12 × 70% (Junior, age 18) = $19.68/hr');
  });

  it('does not raise pay on a birthday until a manager approves', () => {
    const p: RateProfile = { staffId: 's', category: 'junior', approvedJuniorAge: 17 };
    const staff = { id: 's', dateOfBirth: '2008-09-30' }; // 18 on today
    expect(resolveCategoryRate(28.12, p, T).percent).toBe(60);
    const reviews = detectRateReviews(staff, p, T, today);
    expect(reviews[0]).toMatchObject({ kind: 'junior_birthday', needsApproval: true, fromPercent: 60, toPercent: 70 });
    expect(resolveCategoryRate(28.12, { ...p, ...reviews[0].approve }, T).percent).toBe(70);
  });

  it('asks for approval before a qualification gives a junior the adult rate', () => {
    const p: RateProfile = { staffId: 's', category: 'junior', approvedJuniorAge: 18 };
    const staff = { id: 's', dateOfBirth: '2008-01-01', qualifications: ['Certificate III in Early Childhood'] };
    const q = detectRateReviews(staff, p, T, today).find(r => r.kind === 'qualification_adult_rate');
    expect(q?.needsApproval).toBe(true);
    expect(resolveCategoryRate(28.12, p, T).percent).toBe(70);
    const approved = { ...p, adultRateQualification: { name: q!.qualification!, approvedAt: '', approvedBy: '' } };
    expect(resolveCategoryRate(28.12, approved, T).percent).toBe(100);
  });

  it('warns when a traineeship ends within 30 days', () => {
    const p: RateProfile = { staffId: 's', category: 'trainee', traineeEndDate: '2026-11-01' };
    expect(detectRateReviews({ id: 's' }, p, T, today)[0].kind).toBe('traineeship_ending');
  });

  it('flags a new apprenticeship year for approval', () => {
    const p: RateProfile = { staffId: 's', category: 'apprentice', apprenticeStartDate: '2025-02-01', approvedApprenticeYear: 1 };
    const r = detectRateReviews({ id: 's' }, p, T, today)[0];
    expect(r).toMatchObject({ kind: 'apprentice_year', fromPercent: 55, toPercent: 65 });
  });
});
