import { Shift, StaffMember } from '@/types/roster';
import { format, differenceInDays } from 'date-fns';

export interface ExpiringSeriesNotification {
  seriesId: string;
  staffId: string;
  staffName: string;
  staffEmail?: string;
  pattern: string;
  endDate: Date;
  daysUntilExpiry: number;
  occurrencesRemaining: number;
  severity: 'warning' | 'critical';
}

export interface NotificationResult {
  success: boolean;
  method: 'email' | 'in-app';
  recipientId: string;
  recipientName: string;
  message: string;
  timestamp: Date;
}

/**
 * Detects recurring shift series that are about to expire
 */
export function detectExpiringRecurringSeries(
  shifts: Shift[],
  staff: StaffMember[],
  warningDays: number = 14,
  criticalDays: number = 7
): ExpiringSeriesNotification[] {
  const notifications: ExpiringSeriesNotification[] = [];
  const today = new Date();
  
  // Group shifts by recurring series
  const seriesMap = new Map<string, Shift[]>();
  
  shifts.forEach(shift => {
    if (shift.recurring?.isRecurring && shift.recurring?.recurrenceGroupId) {
      const groupId = shift.recurring.recurrenceGroupId;
      const existing = seriesMap.get(groupId) || [];
      seriesMap.set(groupId, [...existing, shift]);
    }
  });
  
  seriesMap.forEach((seriesShifts, seriesId) => {
    if (seriesShifts.length === 0) return;
    
    // Sort by date to find upcoming shifts
    const sortedShifts = [...seriesShifts].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Find future occurrences
    const futureShifts = sortedShifts.filter(
      s => new Date(s.date) >= today
    );
    
    if (futureShifts.length === 0) return;
    
    const lastShift = futureShifts[futureShifts.length - 1];
    const endDate = new Date(lastShift.date);
    const daysUntilExpiry = differenceInDays(endDate, today);
    
    // Check if it's within warning threshold
    if (daysUntilExpiry <= warningDays) {
      const staffMember = staff.find(s => s.id === lastShift.staffId);
      if (!staffMember) return;
      
      // Determine pattern from the first shift's recurrence config
      const firstShift = sortedShifts[0];
      const pattern = firstShift.recurring?.pattern || 'weekly';
      const patternLabel = pattern === 'daily' ? 'Daily' : 
                          pattern === 'weekly' ? 'Weekly' :
                          pattern === 'fortnightly' ? 'Fortnightly' : 'Monthly';
      
      notifications.push({
        seriesId,
        staffId: staffMember.id,
        staffName: staffMember.name,
        staffEmail: staffMember.email,
        pattern: patternLabel,
        endDate,
        daysUntilExpiry,
        occurrencesRemaining: futureShifts.length,
        severity: daysUntilExpiry <= criticalDays ? 'critical' : 'warning',
      });
    }
  });
  
  return notifications.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
}

/**
 * Mock email notification service for recurring shift expiry
 * This simulates sending emails and logs the attempt.
 * Replace with real email service (e.g., Resend) when Cloud is enabled.
 */
export async function sendExpiryNotificationEmail(
  notification: ExpiringSeriesNotification,
  managerEmail?: string
): Promise<NotificationResult> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const message = buildExpiryEmailMessage(notification);
  
  // Log the mock email (in production, this would call a real email API)
  console.log('[Mock Email Service] Sending expiry notification:', {
    to: notification.staffEmail || managerEmail || 'manager@example.com',
    subject: `Recurring Shift Series Expiring Soon - ${notification.staffName}`,
    body: message,
    severity: notification.severity,
    timestamp: new Date().toISOString(),
  });
  
  return {
    success: true,
    method: 'email',
    recipientId: notification.staffId,
    recipientName: notification.staffName,
    message: `Email notification queued for ${notification.staffName}'s recurring series expiring in ${notification.daysUntilExpiry} days`,
    timestamp: new Date(),
  };
}

/**
 * Send batch notifications for all expiring series
 */
export async function sendBatchExpiryNotifications(
  notifications: ExpiringSeriesNotification[],
  options: {
    sendEmail?: boolean;
    sendInApp?: boolean;
    managerEmail?: string;
  } = { sendEmail: true, sendInApp: true }
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = [];
  
  for (const notification of notifications) {
    // In-app notification (always succeeds as it's local state)
    if (options.sendInApp) {
      results.push({
        success: true,
        method: 'in-app',
        recipientId: notification.staffId,
        recipientName: notification.staffName,
        message: `In-app alert created for ${notification.staffName}'s recurring series`,
        timestamp: new Date(),
      });
    }
    
    // Email notification (mock)
    if (options.sendEmail && notification.staffEmail) {
      try {
        const emailResult = await sendExpiryNotificationEmail(notification, options.managerEmail);
        results.push(emailResult);
      } catch (error) {
        results.push({
          success: false,
          method: 'email',
          recipientId: notification.staffId,
          recipientName: notification.staffName,
          message: `Failed to send email to ${notification.staffName}: ${error}`,
          timestamp: new Date(),
        });
      }
    }
  }
  
  return results;
}

function buildExpiryEmailMessage(notification: ExpiringSeriesNotification): string {
  const expiryDateFormatted = format(notification.endDate, 'EEEE, MMMM d, yyyy');
  const urgencyLabel = notification.severity === 'critical' ? '⚠️ URGENT' : '📅 Reminder';
  
  return `
${urgencyLabel}: Recurring Shift Series Expiring Soon

Dear ${notification.staffName},

Your ${notification.pattern.toLowerCase()} recurring shift series is scheduled to end on ${expiryDateFormatted}.

Details:
- Days until expiry: ${notification.daysUntilExpiry}
- Remaining shifts: ${notification.occurrencesRemaining}
- Pattern: ${notification.pattern}

${notification.severity === 'critical' 
  ? 'This series will end very soon. Please contact your manager if you need this series extended.'
  : 'Please review your schedule and contact your manager if you need this series extended.'}

Best regards,
Roster Management System

---
This is an automated notification from your roster system.
  `.trim();
}

/**
 * Hook into the alert system to trigger notifications
 */
export function shouldTriggerExpiryNotification(
  notification: ExpiringSeriesNotification,
  lastNotifiedMap: Map<string, Date>,
  notificationIntervalDays: number = 3
): boolean {
  const lastNotified = lastNotifiedMap.get(notification.seriesId);
  if (!lastNotified) return true;
  
  const daysSinceLastNotification = differenceInDays(new Date(), lastNotified);
  return daysSinceLastNotification >= notificationIntervalDays;
}
