import { describe, it, expect } from 'vitest';
import { weightedAverage, classifyBand, buildContiguousBands, trendFromSeries, annualProjection, giniCoefficient } from './metrics';

describe('weightedAverage', () => {
  it('weights by volume rather than treating every item equally', () => {
    const items = [
      { rate: 100, volume: 90 },
      { rate: 0, volume: 10 },
    ];
    const weighted = weightedAverage(items, (i) => i.rate, (i) => i.volume);
    expect(weighted).toBeCloseTo(90, 5);
    const unweighted = (100 + 0) / 2;
    expect(unweighted).toBe(50);
    expect(weighted).not.toBe(unweighted);
  });

  it('returns 0 for empty input', () => {
    expect(weightedAverage([] as { a: number }[], (i) => i.a, () => 1)).toBe(0);
  });

  it('ignores zero/negative weights', () => {
    const items = [{ v: 10, w: 0 }, { v: 20, w: 5 }];
    expect(weightedAverage(items, (i) => i.v, (i) => i.w)).toBe(20);
  });
});

describe('classifyBand', () => {
  const bands = buildContiguousBands([
    { upTo: 69, label: 'Critical', variant: 'danger' },
    { upTo: 84, label: 'Warning', variant: 'warning' },
    { upTo: Infinity, label: 'Good', variant: 'success' },
  ]);

  it('classifies values into the correct band', () => {
    expect(classifyBand(50, bands).label).toBe('Critical');
    expect(classifyBand(69, bands).label).toBe('Critical');
    expect(classifyBand(70, bands).label).toBe('Warning');
    expect(classifyBand(84, bands).label).toBe('Warning');
    expect(classifyBand(85, bands).label).toBe('Good');
    expect(classifyBand(1000, bands).label).toBe('Good');
  });

  it('has no gaps across the full range (every integer 0-100 resolves to a band)', () => {
    for (let v = 0; v <= 100; v++) {
      const result = classifyBand(v, bands);
      expect(result.label).toBeTruthy();
    }
  });
});

describe('trendFromSeries', () => {
  it('is deterministic for the same input', () => {
    const series = [10, 12, 14, 20, 22, 24];
    const a = trendFromSeries(series);
    const b = trendFromSeries(series);
    expect(a).toEqual(b);
  });

  it('detects an upward trend', () => {
    const result = trendFromSeries([10, 10, 20, 20]);
    expect(result.direction).toBe('up');
    expect(result.deltaPct).toBeGreaterThan(0);
  });

  it('returns flat for series too short to compare', () => {
    expect(trendFromSeries([5]).direction).toBe('flat');
    expect(trendFromSeries([]).direction).toBe('flat');
  });
});

describe('annualProjection', () => {
  it('scales by actual days in period rather than a fixed multiplier', () => {
    expect(annualProjection(100, 7)).toBe(Math.round((100 * 365) / 7));
    expect(annualProjection(100, 91)).toBe(Math.round((100 * 365) / 91));
  });

  it('returns 0 when there is no period length', () => {
    expect(annualProjection(100, 0)).toBe(0);
  });
});

describe('giniCoefficient', () => {
  it('is 0 for perfectly equal distribution', () => {
    expect(giniCoefficient([10, 10, 10, 10])).toBe(0);
  });

  it('increases with inequality', () => {
    const low = giniCoefficient([9, 10, 11, 10]);
    const high = giniCoefficient([1, 1, 1, 37]);
    expect(high).toBeGreaterThan(low);
  });
});
