import { Task } from '@/types/tasks';
import { differenceInDays, differenceInHours, format, isToday, isTomorrow, isPast } from 'date-fns';

export interface TaskDueDateNotification {
  taskId: string;
  taskTitle: string;
  dueDate: Date;
  assigneeId?: string;
  assigneeName?: string;
  status: 'overdue' | 'due_today' | 'due_tomorrow' | 'due_soon';
  hoursUntilDue: number;
  daysUntilDue: number;
  severity: 'critical' | 'warning' | 'info';
}

export interface NotificationResult {
  success: boolean;
  method: 'email' | 'in-app';
  taskId: string;
  message: string;
  timestamp: Date;
}

/**
 * Detects tasks with approaching or overdue due dates
 */
export function detectDueDateNotifications(
  tasks: Task[],
  options: {
    soonThresholdDays?: number; // Default 3 days
    excludeCompleted?: boolean;
  } = {}
): TaskDueDateNotification[] {
  const { soonThresholdDays = 3, excludeCompleted = true } = options;
  const notifications: TaskDueDateNotification[] = [];
  const now = new Date();

  tasks.forEach(task => {
    // Skip tasks without due dates
    if (!task.dueDate) return;
    
    // Skip completed/cancelled tasks if requested
    if (excludeCompleted && (task.status === 'completed' || task.status === 'cancelled')) return;

    const dueDate = new Date(task.dueDate);
    const hoursUntilDue = differenceInHours(dueDate, now);
    const daysUntilDue = differenceInDays(dueDate, now);

    let status: TaskDueDateNotification['status'] | null = null;
    let severity: TaskDueDateNotification['severity'] = 'info';

    if (isPast(dueDate) && !isToday(dueDate)) {
      status = 'overdue';
      severity = 'critical';
    } else if (isToday(dueDate)) {
      status = 'due_today';
      severity = 'critical';
    } else if (isTomorrow(dueDate)) {
      status = 'due_tomorrow';
      severity = 'warning';
    } else if (daysUntilDue <= soonThresholdDays) {
      status = 'due_soon';
      severity = 'info';
    }

    if (status) {
      notifications.push({
        taskId: task.id,
        taskTitle: task.title,
        dueDate,
        assigneeId: task.assigneeId,
        assigneeName: task.assigneeName,
        status,
        hoursUntilDue,
        daysUntilDue,
        severity,
      });
    }
  });

  // Sort by severity (critical first) then by due date
  return notifications.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return a.hoursUntilDue - b.hoursUntilDue;
  });
}

/**
 * Get a human-readable label for the due date status
 */
export function getDueDateStatusLabel(notification: TaskDueDateNotification): string {
  switch (notification.status) {
    case 'overdue':
      const overdueDays = Math.abs(notification.daysUntilDue);
      return overdueDays === 1 ? '1 day overdue' : `${overdueDays} days overdue`;
    case 'due_today':
      return 'Due today';
    case 'due_tomorrow':
      return 'Due tomorrow';
    case 'due_soon':
      return `Due in ${notification.daysUntilDue} days`;
    default:
      return '';
  }
}

/**
 * Build notification message for a task
 */
export function buildDueDateNotificationMessage(notification: TaskDueDateNotification): string {
  const dueDateFormatted = format(notification.dueDate, 'MMMM d, yyyy');
  const statusLabel = getDueDateStatusLabel(notification);
  
  let urgencyPrefix = '';
  if (notification.severity === 'critical') {
    urgencyPrefix = '⚠️ URGENT: ';
  } else if (notification.severity === 'warning') {
    urgencyPrefix = '📅 Reminder: ';
  }

  return `${urgencyPrefix}Task "${notification.taskTitle}" is ${statusLabel.toLowerCase()} (${dueDateFormatted})${notification.assigneeName ? ` - Assigned to ${notification.assigneeName}` : ''}`;
}

/**
 * Mock email notification for task due dates
 * Replace with real email service when Cloud is enabled
 */
export async function sendTaskDueDateEmail(
  notification: TaskDueDateNotification,
  recipientEmail?: string
): Promise<NotificationResult> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const message = buildDueDateNotificationMessage(notification);

  // Log mock email
  console.log('[Mock Email Service] Task due date reminder:', {
    to: recipientEmail || 'manager@example.com',
    subject: `Task Due Date Alert: ${notification.taskTitle}`,
    body: message,
    severity: notification.severity,
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    method: 'email',
    taskId: notification.taskId,
    message: `Email notification sent for "${notification.taskTitle}"`,
    timestamp: new Date(),
  };
}

/**
 * Get summary stats for task due dates
 */
export function getDueDateSummary(tasks: Task[]): {
  overdue: number;
  dueToday: number;
  dueTomorrow: number;
  dueSoon: number;
  total: number;
} {
  const notifications = detectDueDateNotifications(tasks);
  
  return {
    overdue: notifications.filter(n => n.status === 'overdue').length,
    dueToday: notifications.filter(n => n.status === 'due_today').length,
    dueTomorrow: notifications.filter(n => n.status === 'due_tomorrow').length,
    dueSoon: notifications.filter(n => n.status === 'due_soon').length,
    total: notifications.length,
  };
}
