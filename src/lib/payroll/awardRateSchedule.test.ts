import { describe, it, expect } from 'vitest';
import { applyAwr2026, rateOn } from './awardRateSchedule';
import { australianAwards } from '@/data/australianAwards';

describe('Annual Wage Review 2026', () => {
  it('raises award weekly rates by 4.75% rounded to 10c', () => {
    expect(applyAwr2026(1137.84)).toBe(1191.9);
  });
  it('lifts the lowest adult rate to at least $1,004.90 a week', () => {
    expect(applyAwr2026(950)).toBe(1004.9);
  });
  it('uses the old rate before 1 July 2026 and the new one from that date', () => {
    const cs31 = australianAwards.find((a) => a.id === 'children-services-2020')!.classifications.find((c) => c.id === 'cs-3-1')!;
    expect(rateOn(cs31, '2026-06-30')).toBe(29.94);
    expect(rateOn(cs31, '2026-07-01')).toBe(31.37);
  });
});
