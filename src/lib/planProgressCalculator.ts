import { AssignedPlan } from '@/types/performancePlan';
import { Goal, PerformanceReview, Conversation } from '@/types/performance';

export interface PlanProgressBreakdown {
  totalProgress: number;
  goalProgress: number;
  reviewProgress: number;
  conversationProgress: number;
  completedGoals: number;
  totalGoals: number;
  completedReviews: number;
  totalReviews: number;
  completedConversations: number;
  totalConversations: number;
}

/**
 * Calculate plan progress based on linked goals, reviews, and conversations
 * Progress is weighted: Goals 50%, Reviews 30%, Conversations 20%
 */
export function calculatePlanProgress(
  plan: AssignedPlan,
  goals: Goal[],
  reviews: PerformanceReview[],
  conversations: Conversation[]
): PlanProgressBreakdown {
  // Filter linked items
  const planGoals = goals.filter(g => plan.goalIds.includes(g.id));
  const planReviews = reviews.filter(r => plan.reviewIds.includes(r.id));
  const planConversations = conversations.filter(c => plan.conversationIds.includes(c.id));

  // Calculate goal progress (average of individual goal progress)
  const completedGoals = planGoals.filter(g => g.status === 'completed').length;
  const goalProgress = planGoals.length > 0
    ? planGoals.reduce((sum, g) => sum + g.progress, 0) / planGoals.length
    : 0;

  // Calculate review progress (completed reviews / total)
  const completedReviews = planReviews.filter(r => r.status === 'completed').length;
  const reviewProgress = planReviews.length > 0
    ? (completedReviews / planReviews.length) * 100
    : 0;

  // Calculate conversation progress (completed / total)
  const completedConversations = planConversations.filter(c => c.completed).length;
  const conversationProgress = planConversations.length > 0
    ? (completedConversations / planConversations.length) * 100
    : 0;

  // Calculate weighted total progress
  // Weights adjust based on what items exist in the plan
  let totalWeight = 0;
  let weightedProgress = 0;

  if (planGoals.length > 0) {
    totalWeight += 50;
    weightedProgress += goalProgress * 0.5;
  }
  if (planReviews.length > 0) {
    totalWeight += 30;
    weightedProgress += reviewProgress * 0.3;
  }
  if (planConversations.length > 0) {
    totalWeight += 20;
    weightedProgress += conversationProgress * 0.2;
  }

  // Normalize if not all components exist
  const totalProgress = totalWeight > 0 
    ? Math.round((weightedProgress / totalWeight) * 100)
    : 0;

  return {
    totalProgress,
    goalProgress: Math.round(goalProgress),
    reviewProgress: Math.round(reviewProgress),
    conversationProgress: Math.round(conversationProgress),
    completedGoals,
    totalGoals: planGoals.length,
    completedReviews,
    totalReviews: planReviews.length,
    completedConversations,
    totalConversations: planConversations.length,
  };
}

/**
 * Check if a plan should be auto-completed based on all items being done
 */
export function shouldAutoCompletePlan(breakdown: PlanProgressBreakdown): boolean {
  return breakdown.totalProgress >= 100 &&
    breakdown.completedGoals === breakdown.totalGoals &&
    breakdown.completedReviews === breakdown.totalReviews &&
    breakdown.completedConversations === breakdown.totalConversations;
}
