import { describe, it, expect } from 'vitest';
import {
  unpaidBreakTotal,
  paidBreakTotal,
  computeSplitSegmentWorkedMinutes,
} from '@/components/roster/ShiftBreaksEditor';
import type { ShiftBreak, Shift } from '@/types/roster';

const mk = (
  id: string,
  start: string,
  end: string,
  paid: boolean,
  label?: string,
): ShiftBreak => ({ id, start, end, paid, label });

describe('break totals (shared helper)', () => {
  it('sums only unpaid break minutes', () => {
    const breaks: ShiftBreak[] = [
      mk('a', '12:00', '12:30', false), // 30 unpaid
      mk('b', '15:00', '15:15', true),  // 15 paid
      mk('c', '10:00', '10:10', false), // 10 unpaid
    ];
    expect(unpaidBreakTotal(breaks)).toBe(40);
    expect(paidBreakTotal(breaks)).toBe(15);
  });

  it('returns 0 for empty / undefined', () => {
    expect(unpaidBreakTotal([])).toBe(0);
    expect(unpaidBreakTotal(undefined)).toBe(0);
    expect(paidBreakTotal([])).toBe(0);
    expect(paidBreakTotal(undefined)).toBe(0);
  });

  it('handles breaks crossing midnight', () => {
    const breaks: ShiftBreak[] = [mk('a', '23:45', '00:15', false)];
    expect(unpaidBreakTotal(breaks)).toBe(30);
  });
});

/* ------------------------------------------------------------------ */
/* Propagation contracts — mirrors what each modal does on save.       */
/* ------------------------------------------------------------------ */

describe('AddEmptyShiftModal propagation', () => {
  // Modal saves: { breaks, breakMinutes: unpaidBreakTotal(breaks) }
  it('derives Shift.breakMinutes from unpaid breaks only', () => {
    const breaks: ShiftBreak[] = [
      mk('u', '12:00', '12:30', false),
      mk('p', '10:00', '10:15', true),
    ];
    const shift: Partial<Shift> = {
      breaks,
      breakMinutes: unpaidBreakTotal(breaks),
    };
    expect(shift.breakMinutes).toBe(30);
    expect(shift.breaks).toHaveLength(2);
    // Paid break preserved on the shift even though it's not in the minutes total
    expect(shift.breaks!.find(b => b.paid)?.id).toBe('p');
  });
});

describe('BulkSeriesEditModal propagation', () => {
  // Modal applies: updates.breaks = breaks; updates.breakMinutes = unpaidBreakTotal(breaks)
  it('applies identical break payload to every shift in the series', () => {
    const seriesShifts = [
      { id: 's1', breaks: [], breakMinutes: 0 },
      { id: 's2', breaks: [], breakMinutes: 0 },
      { id: 's3', breaks: [], breakMinutes: 0 },
    ];

    const newBreaks: ShiftBreak[] = [
      mk('u', '12:00', '13:00', false), // 60 unpaid
      mk('p', '15:30', '15:45', true),  //  15 paid
    ];
    const updates = {
      breaks: newBreaks,
      breakMinutes: unpaidBreakTotal(newBreaks),
    };

    const updated = seriesShifts.map(s => ({ ...s, ...updates }));

    updated.forEach(s => {
      expect(s.breakMinutes).toBe(60);
      expect(s.breaks).toEqual(newBreaks);
    });
  });
});

describe('LogSplitShiftSheet propagation', () => {
  it('deducts only unpaid break minutes from a segment', () => {
    // 09:00 -> 12:00 = 180 min, 30 unpaid, 15 paid -> worked 150
    const worked = computeSplitSegmentWorkedMinutes(
      '2026-01-01T09:00:00',
      '2026-01-01T12:00:00',
      30,
      15,
    );
    expect(worked).toBe(150);
  });

  it('paid break minutes do not reduce worked time', () => {
    const withoutPaid = computeSplitSegmentWorkedMinutes(
      '2026-01-01T09:00:00',
      '2026-01-01T12:00:00',
      30,
      0,
    );
    const withPaid = computeSplitSegmentWorkedMinutes(
      '2026-01-01T09:00:00',
      '2026-01-01T12:00:00',
      30,
      45,
    );
    expect(withoutPaid).toBe(withPaid);
  });

  it('never returns negative worked minutes', () => {
    const worked = computeSplitSegmentWorkedMinutes(
      '2026-01-01T09:00:00',
      '2026-01-01T09:30:00',
      120, // more unpaid than duration
      0,
    );
    expect(worked).toBe(0);
  });

  it('returns 0 for empty inputs', () => {
    expect(computeSplitSegmentWorkedMinutes('', '', 0, 0)).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/* Persistence round-trip                                              */
/* ------------------------------------------------------------------ */

describe('Shift break persistence round-trip', () => {
  it('preserves paid/unpaid distinction across save + reopen + edit', () => {
    // 1. Initial save from AddEmptyShiftModal
    const initialBreaks: ShiftBreak[] = [
      mk('b1', '12:00', '12:30', false, 'Meal'),
      mk('b2', '15:00', '15:15', true, 'Tea'),
    ];
    const saved: Partial<Shift> = {
      breaks: initialBreaks,
      breakMinutes: unpaidBreakTotal(initialBreaks),
    };
    expect(saved.breakMinutes).toBe(30);

    // 2. Simulate reopen — editor is seeded from saved.breaks
    const reopened = saved.breaks!;
    expect(reopened).toHaveLength(2);
    expect(reopened.filter(b => b.paid)).toHaveLength(1);
    expect(reopened.filter(b => !b.paid)).toHaveLength(1);

    // 3. Edit: extend the meal break by 15 min, flip tea to unpaid
    const edited: ShiftBreak[] = reopened.map(b => {
      if (b.id === 'b1') return { ...b, end: '12:45' };
      if (b.id === 'b2') return { ...b, paid: false };
      return b;
    });

    const resaved: Partial<Shift> = {
      breaks: edited,
      breakMinutes: unpaidBreakTotal(edited),
    };

    // 45 (meal) + 15 (former paid tea, now unpaid) = 60
    expect(resaved.breakMinutes).toBe(60);
    expect(paidBreakTotal(edited)).toBe(0);
    expect(resaved.breaks!.map(b => b.paid)).toEqual([false, false]);
  });
});
