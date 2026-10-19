import type { PerformanceReview, ReviewRating } from '@/types/performance';
import { performanceConfigStore } from './performanceConfigStore';
import type { Feedback360Request, Feedback360Response } from '@/types/advancedPerformance';

/** Existing unlinked records use their recorded criteria and historical five-point scale. */
export function snapshotReview<T extends Omit<PerformanceReview, 'id' | 'createdAt' | 'updatedAt'>>(review: T): T & Pick<PerformanceReview,'ratingScaleSnapshot'|'reviewCycleId'|'customCriteria'> {
  if (review.ratingScaleSnapshot && review.customCriteria) return review;
  const config = performanceConfigStore.get();
  const cycle = config.reviewCycles.find(c => review.reviewCycleId ? c.id === review.reviewCycleId : c.cycle === review.reviewCycle && c.periodStart === review.periodStart && c.periodEnd === review.periodEnd);
  const scale = config.ratingScales.find(s => s.id === cycle?.ratingScaleId) ?? config.ratingScales.find(s => s.isDefault && s.isActive && s.appliesTo !== 'goals');
  return { ...review, reviewCycleId: cycle?.id ?? review.reviewCycleId,
    customCriteria: structuredClone(review.customCriteria ?? config.competencies.filter(c => c.isActive && (!cycle || cycle.competencyIds.includes(c.id)))),
    ratingScaleSnapshot: structuredClone(review.ratingScaleSnapshot ?? scale ?? { id: 'legacy', name: 'Historical five-point scale', points: [1,2,3,4,5].map(value => ({ value, label: String(value) })) }) };
}
export function mergeReviewRatings(existing: ReviewRating[], incoming: ReviewRating[], stage: 'self' | 'manager'): ReviewRating[] {
  const merged = new Map(existing.map(r => [r.criteriaId, { ...r }]));
  incoming.forEach(r => merged.set(r.criteriaId, { ...merged.get(r.criteriaId), criteriaId: r.criteriaId,
    ...(stage === 'self' ? { selfRating: r.selfRating, selfComments: r.selfComments } : { managerRating: r.managerRating, managerComments: r.managerComments }) }));
  return [...merged.values()];
}
export function weightedReviewRating(review: PerformanceReview, stage: 'self' | 'manager'): number | undefined {
  const criteria = review.customCriteria ?? [];
  const points = review.ratingScaleSnapshot?.points.map(p => p.value) ?? [1,2,3,4,5];
  let sum = 0, weight = 0;
  for (const c of criteria) {
    if (c.weight <= 0) continue;
    const r = review.ratings.find(r => r.criteriaId === c.id);
    const value = stage === 'self' ? r?.selfRating : r?.managerRating;
    if (value === undefined || !points.includes(value)) return undefined;
    sum += value * c.weight; weight += c.weight;
  }
  return weight > 0 ? Math.round(sum / weight * 100) / 100 : undefined;
}
export function reviewPercentage(review: PerformanceReview): number | null {
  const value = review.ratingScaleSnapshot ? weightedReviewRating(review, 'manager') : review.overallManagerRating;
  const max = Math.max(...(review.ratingScaleSnapshot?.points.map(p => p.value) ?? [5]));
  return value === undefined || !Number.isFinite(value) || max <= 0 ? null : Math.max(0, Math.min(100, value / max * 100));
}
/** Never pool undersized surveys to bypass their individual disclosure threshold. */
export function eligibleScorecard360(requests: Feedback360Request[], responses: Feedback360Response[], minimum: number): Feedback360Response[] {
  return requests.flatMap(q => {
    const rows = responses.filter(r => r.requestId === q.id && r.status === 'completed' && r.ratings.some(a => a.rating > 0));
    if (q.anonymousResponses && new Set(rows.filter(r=>r.isAnonymous).map(r=>r.responderId||r.id)).size < minimum) return [];
    const people = new Set(rows.map(r => r.responderId || r.id));
    return people.size >= minimum ? [...new Map(rows.map(r => [r.responderId || r.id, r])).values()] : [];
  });
}
export function keyResultProgress(start: number, target: number, current: number): number {
  if (![start,target,current].every(Number.isFinite)) throw new Error('Enter a valid progress value');
  if (target === start) return current === target ? 100 : 0;
  return Math.max(0, Math.min(100, Math.round((current - start) / (target - start) * 100)));
}