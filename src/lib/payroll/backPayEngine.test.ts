import { describe, it, expect } from 'vitest';
import { detectBackPay, backPayAdjustmentsFor } from './backPayEngine';
import type { PayRun, PayrollSettings } from '@/types/payroll';
import type { StaffMember } from '@/types/staff';

const settings = { useAwardRates: true, ordinaryHoursPerWeek: 38 } as PayrollSettings;
const staff = [{
  id: 's1', firstName: 'Ann', lastName: 'Lee', email: 'a@x.com',
  applicableAward: { id: 'x', awardName: "Children's Services Award 2020", classification: 'Educator', level: 'Level 3.1', baseHourlyRate: 29.94, overtimeRates: { first2Hours: 150, after2Hours: 200 }, allowances: [] },
  payConditionHistory: [], currentPayCondition: { id: 'pc', effectiveFrom: '2025-01-01', position: 'Educator', payRateType: 'hourly', hourlyRate: 29.94, employmentType: 'full_time', payPeriod: 'weekly' },
}] as unknown as StaffMember[];

const run = (status: PayRun['status']): PayRun => ({
  id: 'R1', name: 'July wk1', cycle: 'weekly', periodStart: '2026-07-06', periodEnd: '2026-07-12', paymentDate: '2026-07-15',
  status, createdAt: '', exports: [], totals: {} as PayRun['totals'],
  lines: [{ id: 'L1', staffId: 'e1', staffName: 'Ann Lee', staffRecordId: 's1', baseRate: 29.94, rateSource: 'award',
    components: [{ id: 'e1-ord-0', kind: 'ordinary', label: 'Ordinary', units: 38, rate: 29.94, amount: 1137.72, superable: true, taxable: true }],
  } as unknown as PayRun['lines'][number]],
});

describe('automatic back pay', () => {
  it('owes the 1 July 2026 award increase on a run paid at the old rate', () => {
    const items = detectBackPay({ runs: [run('approved')], staff, settings, timesheets: [], ledger: {} });
    expect(items).toHaveLength(1);
    expect(items[0].reason).toBe('award_increase');
    expect(items[0].dueRate).toBe(31.37);
    expect(items[0].amount).toBe(54.34);
  });
  it('ignores draft runs', () => {
    expect(detectBackPay({ runs: [run('draft')], staff, settings, timesheets: [], ledger: {} })).toHaveLength(0);
  });
  it('does not pay an item twice once it is in a run', () => {
    const r = run('approved');
    const items = detectBackPay({ runs: [r], staff, settings, timesheets: [], ledger: { [`run:R1:L1:31.37`]: 'R1' } });
    expect(backPayAdjustmentsFor(r, items).adjustments).toHaveLength(0);
  });
});
