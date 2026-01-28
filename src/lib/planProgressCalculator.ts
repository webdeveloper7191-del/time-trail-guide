import { AssignedPlan } from '@/types/performancePlan';
import { Goal, PerformanceReview, Conversation } from '@/types/performance';
import { Enrollment, LearningPath, Course } from '@/types/lms';

export interface PlanProgressBreakdown {
  totalProgress: number;
  goalProgress: number;
  reviewProgress: number;
  conversationProgress: number;
  learningProgress: number;
  completedGoals: number;
  totalGoals: number;
  completedReviews: number;
  totalReviews: number;
  completedConversations: number;
  totalConversations: number;
  completedCourses: number;
  totalCourses: number;
  completedPaths: number;
  totalPaths: number;
}

export interface LMSData {
  enrollments: Enrollment[];
  learningPaths: LearningPath[];
  courses: Course[];
}

/**
 * Calculate plan progress based on linked goals, reviews, conversations, and LMS items
 * Progress is weighted: Goals 40%, Reviews 20%, Conversations 15%, Learning 25%
 */
export function calculatePlanProgress(
  plan: AssignedPlan,
  goals: Goal[],
  reviews: PerformanceReview[],
  conversations: Conversation[],
  lmsData?: LMSData
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

  // Calculate learning progress from LMS
  let learningProgress = 0;
  let completedCourses = 0;
  let totalCourses = 0;
  let completedPaths = 0;
  let totalPaths = 0;

  if (lmsData && (plan.learningPathIds?.length || plan.courseIds?.length)) {
    const staffEnrollments = lmsData.enrollments.filter(e => e.staffId === plan.staffId);
    
    // Calculate course completion
    const linkedCourseIds = new Set<string>();
    
    // Add directly linked courses
    plan.courseIds?.forEach(id => linkedCourseIds.add(id));
    
    // Add courses from linked learning paths
    plan.learningPathIds?.forEach(pathId => {
      const path = lmsData.learningPaths.find(p => p.id === pathId);
      if (path) {
        path.courseIds.forEach(id => linkedCourseIds.add(id));
      }
    });
    
    totalCourses = linkedCourseIds.size;
    
    linkedCourseIds.forEach(courseId => {
      const enrollment = staffEnrollments.find(e => e.courseId === courseId);
      if (enrollment?.status === 'completed') {
        completedCourses++;
      }
    });

    // Calculate path completion
    totalPaths = plan.learningPathIds?.length || 0;
    plan.learningPathIds?.forEach(pathId => {
      const path = lmsData.learningPaths.find(p => p.id === pathId);
      if (path) {
        const pathCourseEnrollments = path.courseIds.map(cId => 
          staffEnrollments.find(e => e.courseId === cId)
        );
        const allPathCoursesComplete = pathCourseEnrollments.every(e => e?.status === 'completed');
        if (allPathCoursesComplete && pathCourseEnrollments.length > 0) {
          completedPaths++;
        }
      }
    });

    // Learning progress is based on course completion
    learningProgress = totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0;
  }

  // Calculate weighted total progress
  // Weights adjust based on what items exist in the plan
  let totalWeight = 0;
  let weightedProgress = 0;

  if (planGoals.length > 0) {
    totalWeight += 40;
    weightedProgress += goalProgress * 0.4;
  }
  if (planReviews.length > 0) {
    totalWeight += 20;
    weightedProgress += reviewProgress * 0.2;
  }
  if (planConversations.length > 0) {
    totalWeight += 15;
    weightedProgress += conversationProgress * 0.15;
  }
  if (totalCourses > 0) {
    totalWeight += 25;
    weightedProgress += learningProgress * 0.25;
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
    learningProgress: Math.round(learningProgress),
    completedGoals,
    totalGoals: planGoals.length,
    completedReviews,
    totalReviews: planReviews.length,
    completedConversations,
    totalConversations: planConversations.length,
    completedCourses,
    totalCourses,
    completedPaths,
    totalPaths,
  };
}

/**
 * Check if a plan should be auto-completed based on all items being done
 */
export function shouldAutoCompletePlan(breakdown: PlanProgressBreakdown): boolean {
  const goalsComplete = breakdown.completedGoals === breakdown.totalGoals;
  const reviewsComplete = breakdown.completedReviews === breakdown.totalReviews;
  const conversationsComplete = breakdown.completedConversations === breakdown.totalConversations;
  const learningComplete = breakdown.completedCourses === breakdown.totalCourses;
  
  return breakdown.totalProgress >= 100 && goalsComplete && reviewsComplete && conversationsComplete && learningComplete;
}

/**
 * Sync LMS course completion with linked performance goals
 * Returns goal IDs that should be updated
 */
export function syncLMSToGoals(
  plan: AssignedPlan,
  goals: Goal[],
  lmsData: LMSData
): { goalId: string; newProgress: number }[] {
  const updates: { goalId: string; newProgress: number }[] = [];
  
  const staffEnrollments = lmsData.enrollments.filter(e => e.staffId === plan.staffId);
  const planGoals = goals.filter(g => plan.goalIds.includes(g.id));
  
  // Find goals that reference learning/training in their title or description
  planGoals.forEach(goal => {
    const titleLower = goal.title.toLowerCase();
    const descLower = goal.description.toLowerCase();
    
    const isLearningGoal = 
      titleLower.includes('training') || 
      titleLower.includes('course') || 
      titleLower.includes('certification') ||
      titleLower.includes('learning') ||
      titleLower.includes('complete') && (descLower.includes('module') || descLower.includes('training'));
    
    if (isLearningGoal && plan.learningPathIds?.length || plan.courseIds?.length) {
      // Calculate learning completion for this staff member
      const linkedCourseIds = new Set<string>();
      plan.courseIds?.forEach(id => linkedCourseIds.add(id));
      plan.learningPathIds?.forEach(pathId => {
        const path = lmsData.learningPaths.find(p => p.id === pathId);
        if (path) {
          path.courseIds.forEach(id => linkedCourseIds.add(id));
        }
      });
      
      let completed = 0;
      linkedCourseIds.forEach(courseId => {
        const enrollment = staffEnrollments.find(e => e.courseId === courseId);
        if (enrollment?.status === 'completed') {
          completed++;
        }
      });
      
      const newProgress = linkedCourseIds.size > 0 
        ? Math.round((completed / linkedCourseIds.size) * 100) 
        : goal.progress;
      
      if (newProgress > goal.progress) {
        updates.push({ goalId: goal.id, newProgress });
      }
    }
  });
  
  return updates;
}
