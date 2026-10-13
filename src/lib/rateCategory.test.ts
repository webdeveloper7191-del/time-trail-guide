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

import { rateCategoryStore } from './rateCategoryStore';
describe('rate category flows into costs', () => {
  it('applies 70% for an approved junior age 18', () => {
    rateCategoryStore.saveProfile({ staffId: 'cost-test', category: 'junior', approvedJuniorAge: 18 });
    expect(rateCategoryStore.applyToRate('cost-test', 28.12).hourlyRate).toBeCloseTo(19.68, 2);
  });
  it('bulk-set to adult pays 100%', () => {
    rateCategoryStore.setCategoryBulkAudited(['cost-test'], 'adult');
    expect(rateCategoryStore.applyToRate('cost-test', 28.12).hourlyRate).toBe(28.12);
  });
});

import { mergeRateTable, overridesFromDraft, staleOverrides, PUBLISHED_RATE_TABLE } from './rateTableOverrides';
import { backPayAmount, daysLate } from './rateBackPay';

describe('award tables and overrides', () => {
  it('uses the award figure when nothing is overridden', () => {
    expect(mergeRateTable(PUBLISHED_RATE_TABLE.table, { cells: {} }).juniorByAge[18]).toBe(70);
  });
  it('stores only edited cells as overrides', () => {
    const draft = structuredClone(PUBLISHED_RATE_TABLE.table); draft.juniorByAge[18] = 75;
    const o = overridesFromDraft(PUBLISHED_RATE_TABLE, draft, { cells: {} });
    expect(Object.keys(o.cells)).toEqual(['juniorByAge.18']);
    expect(mergeRateTable(PUBLISHED_RATE_TABLE.table, o).juniorByAge[18]).toBe(75);
  });
  it('keeps overrides but flags them when the award version changes', () => {
    const o = { cells: { 'juniorByAge.18': { value: 75, pinnedVersion: 'FWC 2024-25', awardValueAtPin: 68 } } };
    expect(staleOverrides(o, 'FWC 2025-26')).toEqual(['juniorByAge.18']);
    expect(mergeRateTable(PUBLISHED_RATE_TABLE.table, o).juniorByAge[18]).toBe(75);
  });
});

describe('back-pay on late approval', () => {
  it('counts days late from the due date', () => {
    expect(daysLate('2026-10-06', new Date(2026, 9, 13))).toBe(7);
  });
  it('owes the percentage difference for hours worked', () => {
    expect(backPayAmount(28.12, 20, 60, 70)).toBe(56.24);
  });
});
