import { describe, it, expect } from 'vitest';
import { allowedEventsFor, eventBelongsToShift } from './shiftEventRules';

describe('shift event rules', () => {
  it('regular shifts allow callback and split, not sleepover', () => {
    expect(allowedEventsFor('regular')).toEqual(['callback', 'split']);
  });
  it('sleepover shifts allow only sleepover', () => {
    expect(allowedEventsFor('sleepover')).toEqual(['sleepover']);
  });
  it('on-call shifts allow only callback', () => {
    expect(allowedEventsFor('on_call')).toEqual(['callback']);
  });
  it('events with a shiftId only show on that shift', () => {
    const shift = { id: 's1', staffId: 'a', date: '2026-10-12' };
    expect(eventBelongsToShift({ shiftId: 's2', staffId: 'a', date: '2026-10-12' }, shift)).toBe(false);
    expect(eventBelongsToShift({ shiftId: 's1', staffId: 'a', date: '2026-10-12' }, shift)).toBe(true);
  });
  it('legacy events without shiftId fall back to staff + date', () => {
    const shift = { id: 's1', staffId: 'a', date: '2026-10-12' };
    expect(eventBelongsToShift({ shiftId: '', staffId: 'a', date: '2026-10-12' }, shift)).toBe(true);
  });
});
