import { AssignedPlan } from '@/types/performancePlan';
import { Goal, PerformanceReview, Conversation } from '@/types/performance';
import { differenceInDays, parseISO, addDays, isPast, isToday, isTomorrow, isWithinInterval } from 'date-fns';
import { PerformanceNotification, NotificationSeverity, NotificationType } from './performanceNotificationService';

export type PlanNotificationType = 
  | 'plan_milestone_due' 
  | 'plan_milestone_overdue'
  | 'plan_review_due'
  | 'plan_review_overdue'
  | 'plan_conversation_upcoming'
  | 'plan_ending_soon'
  | 'plan_goal_at_risk';

export interface PlanNotification {
  id: string;
  type: PlanNotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  planId: string;
  planName: string;
  staffId: string;
  staffName?: string;
  entityId?: string;
  entityType?: 'goal' | 'review' | 'conversation' | 'milestone';
  dueDate?: string;
  createdAt: string;
}

export function detectPlanMilestoneNotifications(
  plans: AssignedPlan[],
  goals: Goal[],
  managerId: string
): PlanNotification[] {
  const notifications: PlanNotification[] = [];
  const now = new Date();

  plans
    .filter(p => p.status === 'active' && p.assignedBy === managerId)
    .forEach(plan => {
      // Check linked goals for milestone issues
      plan.goalIds.forEach(goalId => {
        const goal = goals.find(g => g.id === goalId);
        if (!goal || goal.status === 'completed' || goal.status === 'cancelled') return;

        // Check each milestone
        goal.milestones.forEach(milestone => {
          if (milestone.completed) return;
          
          const targetDate = parseISO(milestone.targetDate);
          const daysUntilDue = differenceInDays(targetDate, now);

          if (isPast(targetDate)) {
            notifications.push({
              id: `plan-milestone-overdue-${plan.id}-${goal.id}-${milestone.id}`,
              type: 'plan_milestone_overdue',
              severity: 'error',
              title: 'Milestone Overdue',
              message: `"${milestone.title}" in "${goal.title}" is overdue by ${Math.abs(daysUntilDue)} days`,
              planId: plan.id,
              planName: plan.templateName,
              staffId: plan.staffId,
              entityId: goal.id,
              entityType: 'milestone',
              dueDate: milestone.targetDate,
              createdAt: now.toISOString(),
            });
          } else if (daysUntilDue <= 3 && daysUntilDue >= 0) {
            notifications.push({
              id: `plan-milestone-due-${plan.id}-${goal.id}-${milestone.id}`,
              type: 'plan_milestone_due',
              severity: 'warning',
              title: 'Milestone Due Soon',
              message: `"${milestone.title}" in "${goal.title}" is due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`,
              planId: plan.id,
              planName: plan.templateName,
              staffId: plan.staffId,
              entityId: goal.id,
              entityType: 'milestone',
              dueDate: milestone.targetDate,
              createdAt: now.toISOString(),
            });
          }
        });

        // Check if goal is at risk (less than 50% progress with less than 25% time remaining)
        const targetDate = parseISO(goal.targetDate);
        const startDate = parseISO(goal.startDate);
        const totalDays = differenceInDays(targetDate, startDate);
        const daysRemaining = differenceInDays(targetDate, now);
        const timeRemainingPercent = (daysRemaining / totalDays) * 100;

        if (timeRemainingPercent <= 25 && goal.progress < 50 && daysRemaining > 0) {
          notifications.push({
            id: `plan-goal-at-risk-${plan.id}-${goal.id}`,
            type: 'plan_goal_at_risk',
            severity: 'warning',
            title: 'Goal At Risk',
            message: `"${goal.title}" is only ${goal.progress}% complete with ${daysRemaining} days remaining`,
            planId: plan.id,
            planName: plan.templateName,
            staffId: plan.staffId,
            entityId: goal.id,
            entityType: 'goal',
            dueDate: goal.targetDate,
            createdAt: now.toISOString(),
          });
        }
      });
    });

  return notifications;
}

export function detectPlanReviewNotifications(
  plans: AssignedPlan[],
  reviews: PerformanceReview[],
  managerId: string
): PlanNotification[] {
  const notifications: PlanNotification[] = [];
  const now = new Date();

  plans
    .filter(p => p.status === 'active' && p.assignedBy === managerId)
    .forEach(plan => {
      plan.reviewIds.forEach(reviewId => {
        const review = reviews.find(r => r.id === reviewId);
        if (!review) return;
        // Skip completed or cancelled reviews
        if (['completed', 'cancelled'].includes(review.status)) return;

        const periodEnd = parseISO(review.periodEnd);
        const daysUntilDue = differenceInDays(periodEnd, now);

        if (isPast(periodEnd) && review.status !== 'completed') {
          notifications.push({
            id: `plan-review-overdue-${plan.id}-${review.id}`,
            type: 'plan_review_overdue',
            severity: 'error',
            title: 'Review Overdue',
            message: `${review.reviewCycle} review is overdue by ${Math.abs(daysUntilDue)} days`,
            planId: plan.id,
            planName: plan.templateName,
            staffId: plan.staffId,
            entityId: review.id,
            entityType: 'review',
            dueDate: review.periodEnd,
            createdAt: now.toISOString(),
          });
        } else if (daysUntilDue <= 7 && daysUntilDue >= 0) {
          notifications.push({
            id: `plan-review-due-${plan.id}-${review.id}`,
            type: 'plan_review_due',
            severity: 'warning',
            title: 'Review Due Soon',
            message: `${review.reviewCycle} review is due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`,
            planId: plan.id,
            planName: plan.templateName,
            staffId: plan.staffId,
            entityId: review.id,
            entityType: 'review',
            dueDate: review.periodEnd,
            createdAt: now.toISOString(),
          });
        }
      });
    });

  return notifications;
}

export function detectPlanConversationNotifications(
  plans: AssignedPlan[],
  conversations: Conversation[],
  managerId: string
): PlanNotification[] {
  const notifications: PlanNotification[] = [];
  const now = new Date();

  plans
    .filter(p => p.status === 'active' && p.assignedBy === managerId)
    .forEach(plan => {
      plan.conversationIds.forEach(convId => {
        const conv = conversations.find(c => c.id === convId);
        if (!conv || conv.completed) return;

        const scheduledDate = parseISO(conv.scheduledDate);

        if (isToday(scheduledDate)) {
          notifications.push({
            id: `plan-conv-today-${plan.id}-${conv.id}`,
            type: 'plan_conversation_upcoming',
            severity: 'info',
            title: '1:1 Today',
            message: `"${conv.title}" is scheduled for today`,
            planId: plan.id,
            planName: plan.templateName,
            staffId: plan.staffId,
            entityId: conv.id,
            entityType: 'conversation',
            dueDate: conv.scheduledDate,
            createdAt: now.toISOString(),
          });
        } else if (isTomorrow(scheduledDate)) {
          notifications.push({
            id: `plan-conv-tomorrow-${plan.id}-${conv.id}`,
            type: 'plan_conversation_upcoming',
            severity: 'info',
            title: '1:1 Tomorrow',
            message: `"${conv.title}" is scheduled for tomorrow`,
            planId: plan.id,
            planName: plan.templateName,
            staffId: plan.staffId,
            entityId: conv.id,
            entityType: 'conversation',
            dueDate: conv.scheduledDate,
            createdAt: now.toISOString(),
          });
        }
      });
    });

  return notifications;
}

export function detectPlanEndingNotifications(
  plans: AssignedPlan[],
  managerId: string
): PlanNotification[] {
  const notifications: PlanNotification[] = [];
  const now = new Date();

  plans
    .filter(p => p.status === 'active' && p.assignedBy === managerId)
    .forEach(plan => {
      const endDate = parseISO(plan.endDate);
      const daysUntilEnd = differenceInDays(endDate, now);

      if (daysUntilEnd <= 14 && daysUntilEnd >= 0) {
        const severity: NotificationSeverity = daysUntilEnd <= 3 ? 'warning' : 'info';
        notifications.push({
          id: `plan-ending-${plan.id}`,
          type: 'plan_ending_soon',
          severity,
          title: 'Plan Ending Soon',
          message: `"${plan.templateName}" ends in ${daysUntilEnd} day${daysUntilEnd === 1 ? '' : 's'} (${plan.progress}% complete)`,
          planId: plan.id,
          planName: plan.templateName,
          staffId: plan.staffId,
          dueDate: plan.endDate,
          createdAt: now.toISOString(),
        });
      }
    });

  return notifications;
}

export function getAllPlanNotifications(
  plans: AssignedPlan[],
  goals: Goal[],
  reviews: PerformanceReview[],
  conversations: Conversation[],
  managerId: string
): PlanNotification[] {
  const milestoneNotifications = detectPlanMilestoneNotifications(plans, goals, managerId);
  const reviewNotifications = detectPlanReviewNotifications(plans, reviews, managerId);
  const conversationNotifications = detectPlanConversationNotifications(plans, conversations, managerId);
  const endingNotifications = detectPlanEndingNotifications(plans, managerId);

  const allNotifications = [
    ...milestoneNotifications,
    ...reviewNotifications,
    ...conversationNotifications,
    ...endingNotifications,
  ];

  // Sort by severity
  const severityOrder: Record<NotificationSeverity, number> = {
    error: 0,
    warning: 1,
    info: 2,
  };

  return allNotifications.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

export function getPlanNotificationCount(notifications: PlanNotification[]): {
  total: number;
  error: number;
  warning: number;
  info: number;
} {
  return {
    total: notifications.length,
    error: notifications.filter(n => n.severity === 'error').length,
    warning: notifications.filter(n => n.severity === 'warning').length,
    info: notifications.filter(n => n.severity === 'info').length,
  };
}
