import type { CalibrationRating, RatingDistribution } from '@/types/advancedPerformance';

export function buildCalibrationDistribution(ratings: CalibrationRating[], targets: { rating: number; percentage: number }[]): RatingDistribution[] {
  const values = ratings.map(r => r.calibratedRating ?? r.originalRating).filter(r => Number.isFinite(r) && r >= 1 && r <= 5).map(Math.round);
  return [1, 2, 3, 4, 5].map(rating => {
    const count = values.filter(value => value === rating).length;
    const percentage = values.length ? count / values.length * 100 : 0;
    const expectedPercentage = targets.find(target => target.rating === rating)?.percentage ?? 0;
    return { rating, count, percentage, expectedPercentage, variance: percentage - expectedPercentage };
  });
}