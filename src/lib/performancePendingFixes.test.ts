import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildCalibrationDistribution } from './calibrationDistribution';
import { updateWellbeingIndicators } from './engagementLogic';
import { createBrowserState } from './browserState';
import { performanceTaxonomyStore } from './performanceTaxonomyStore';
import type { WellbeingCheckIn } from '@/types/advancedPerformance';

describe('performance gap rules', () => {
  beforeEach(() => localStorage.clear());
  it('counts saved calibrated ratings ahead of original ratings', () => {
    const distribution = buildCalibrationDistribution([
      { id: 'a', sessionId: 's', staffId: '1', originalRating: 2, calibratedRating: 4 },
      { id: 'b', sessionId: 's', staffId: '2', originalRating: 3 },
    ], [{ rating: 4, percentage: 20 }]);
    expect(distribution.find(r => r.rating === 2)?.count).toBe(0);
    expect(distribution.find(r => r.rating === 4)).toEqual({ rating: 4, count: 1, percentage: 50, expectedPercentage: 20, variance: 30 });
  });
  it('does not invent observed percentages without ratings', () => {
    expect(buildCalibrationDistribution([], []).every(r => r.count === 0 && r.percentage === 0)).toBe(true);
  });
  it('creates a missing wellbeing indicator and uses the latest check-in without duplicates', () => {
    const entry: WellbeingCheckIn = { id: 'c', staffId: 'new-staff', date: '2026-10-19', createdAt: '2026-10-19', energyLevel: 2, stressLevel: 9, workloadRating: 9, workLifeBalance: 2 };
    const rules = performanceTaxonomyStore.get().rules.wellbeing;
    const older = { ...entry, id: 'old', date: '2026-10-18', energyLevel: 8, stressLevel: 2, workloadRating: 3 };
    const indicators = updateWellbeingIndicators([], [entry, older], rules);
    expect(indicators).toHaveLength(1);
    expect(indicators[0]).toMatchObject({ staffId: 'new-staff', engagementScore: 2, workloadScore: 9, riskLevel: 'high', overtimeHours: 0 });
    expect(updateWellbeingIndicators(indicators, [older, entry], rules)).toHaveLength(1);
  });
  it('persists task edits, comments, pipelines and types across store reload', () => {
    const task = createBrowserState('test.tasks', [{ id: 't', status: 'open', comments: [] as string[] }]);
    task.set(previous => previous.map(t => ({ ...t, status: 'completed', comments: ['Follow up'] })));
    expect(createBrowserState('test.tasks', []).get()).toEqual([{ id: 't', status: 'completed', comments: ['Follow up'] }]);
    const pipeline = createBrowserState('test.pipeline', ['Open']);
    pipeline.set(['Phone review', 'Completed']);
    expect(createBrowserState('test.pipeline', []).get()).toEqual(['Phone review', 'Completed']);
    const types = createBrowserState('test.types', [] as string[]);
    types.set(['Custom coaching']);
    expect(createBrowserState('test.types', []).get()).toEqual(['Custom coaching']);
  });
  it('keeps per-person skill changes isolated and persistent', () => {
    const one = createBrowserState('test.skills.person1', [] as string[]);
    one.set(['Leadership']);
    expect(createBrowserState('test.skills.person1', []).get()).toEqual(['Leadership']);
    expect(createBrowserState('test.skills.person2', []).get()).toEqual([]);
  });
  it('retains archived roles and candidates and can restore roles', () => {
    const roles = createBrowserState('test.roles', [{ id: 'r', archived: false }]);
    roles.set(previous => previous.map(role => ({ ...role, archived: true })));
    const restored = createBrowserState('test.roles', [] as { id: string; archived: boolean }[]);
    expect(restored.get()).toEqual([{ id: 'r', archived: true }]);
    restored.set(previous => previous.map(role => ({ ...role, archived: false })));
    expect(restored.get().filter(role => !role.archived)).toHaveLength(1);
  });
  it('does not update memory or report persistence when saving fails', () => {
    const store = createBrowserState('test.fail', 1);
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage full'); });
    expect(() => store.set(2)).toThrow('Storage full');
    expect(store.get()).toBe(1);
    spy.mockRestore();
  });
});