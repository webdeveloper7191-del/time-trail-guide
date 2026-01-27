import { Goal, PerformanceReview, Conversation } from '@/types/performance';
import { differenceInDays, isPast, parseISO, isToday, isTomorrow } from 'date-fns';

export type NotificationSeverity = 'error' | 'warning' | 'info';
export type NotificationType = 'goal_overdue' | 'goal_due_soon' | 'review_pending' | 'conversation_today' | 'conversation_tomorrow';

export interface PerformanceNotification {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  entityId: string;
  entityType: 'goal' | 'review' | 'conversation';
  dueDate?: string;
  createdAt: string;
}

export function detectGoalNotifications(goals: Goal[], staffId: string): PerformanceNotification[] {
  const notifications: PerformanceNotification[] = [];
  const now = new Date();

  goals
    .filter((g) => g.staffId === staffId && g.status !== 'completed' && g.status !== 'cancelled')
    .forEach((goal) => {
      const targetDate = parseISO(goal.targetDate);
      const daysUntilDue = differenceInDays(targetDate, now);

      if (isPast(targetDate) && goal.status !== 'completed') {
        notifications.push({
          id: `goal-overdue-${goal.id}`,
          type: 'goal_overdue',
          severity: 'error',
          title: 'Goal Overdue',
          message: `"${goal.title}" is overdue by ${Math.abs(daysUntilDue)} days`,
          entityId: goal.id,
          entityType: 'goal',
          dueDate: goal.targetDate,
          createdAt: now.toISOString(),
        });
      } else if (daysUntilDue <= 7 && daysUntilDue >= 0) {
        notifications.push({
          id: `goal-due-soon-${goal.id}`,
          type: 'goal_due_soon',
          severity: 'warning',
          title: 'Goal Due Soon',
          message: `"${goal.title}" is due in ${daysUntilDue} days`,
          entityId: goal.id,
          entityType: 'goal',
          dueDate: goal.targetDate,
          createdAt: now.toISOString(),
        });
      }
    });

  return notifications;
}

export function detectReviewNotifications(reviews: PerformanceReview[], staffId: string): PerformanceNotification[] {
  const notifications: PerformanceNotification[] = [];
  const now = new Date();

  reviews.forEach((review) => {
    // Self-review pending
    if (review.status === 'pending_self' && review.staffId === staffId) {
      notifications.push({
        id: `review-self-pending-${review.id}`,
        type: 'review_pending',
        severity: 'warning',
        title: 'Self-Review Required',
        message: `Your ${review.reviewCycle} performance review is pending self-assessment`,
        entityId: review.id,
        entityType: 'review',
        createdAt: now.toISOString(),
      });
    }

    // Manager review pending
    if (review.status === 'pending_manager' && review.reviewerId === staffId) {
      notifications.push({
        id: `review-manager-pending-${review.id}`,
        type: 'review_pending',
        severity: 'warning',
        title: 'Manager Review Required',
        message: `You need to complete the manager review for a team member`,
        entityId: review.id,
        entityType: 'review',
        createdAt: now.toISOString(),
      });
    }
  });

  return notifications;
}

export function detectConversationNotifications(conversations: Conversation[], staffId: string): PerformanceNotification[] {
  const notifications: PerformanceNotification[] = [];
  const now = new Date();

  conversations
    .filter((c) => !c.completed && (c.staffId === staffId || c.managerId === staffId))
    .forEach((conv) => {
      const scheduledDate = parseISO(conv.scheduledDate);

      if (isToday(scheduledDate)) {
        notifications.push({
          id: `conversation-today-${conv.id}`,
          type: 'conversation_today',
          severity: 'info',
          title: '1:1 Meeting Today',
          message: `"${conv.title}" is scheduled for today`,
          entityId: conv.id,
          entityType: 'conversation',
          dueDate: conv.scheduledDate,
          createdAt: now.toISOString(),
        });
      } else if (isTomorrow(scheduledDate)) {
        notifications.push({
          id: `conversation-tomorrow-${conv.id}`,
          type: 'conversation_tomorrow',
          severity: 'info',
          title: '1:1 Meeting Tomorrow',
          message: `"${conv.title}" is scheduled for tomorrow`,
          entityId: conv.id,
          entityType: 'conversation',
          dueDate: conv.scheduledDate,
          createdAt: now.toISOString(),
        });
      }
    });

  return notifications;
}

export function getAllPerformanceNotifications(
  goals: Goal[],
  reviews: PerformanceReview[],
  conversations: Conversation[],
  staffId: string
): PerformanceNotification[] {
  const goalNotifications = detectGoalNotifications(goals, staffId);
  const reviewNotifications = detectReviewNotifications(reviews, staffId);
  const conversationNotifications = detectConversationNotifications(conversations, staffId);

  // Sort by severity (error first, then warning, then info)
  const allNotifications = [...goalNotifications, ...reviewNotifications, ...conversationNotifications];
  
  const severityOrder: Record<NotificationSeverity, number> = {
    error: 0,
    warning: 1,
    info: 2,
  };

  return allNotifications.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

export function getNotificationCount(notifications: PerformanceNotification[]): {
  total: number;
  error: number;
  warning: number;
  info: number;
} {
  return {
    total: notifications.length,
    error: notifications.filter((n) => n.severity === 'error').length,
    warning: notifications.filter((n) => n.severity === 'warning').length,
    info: notifications.filter((n) => n.severity === 'info').length,
  };
}
