/**
 * Learning & Development settings store.
 * Plain-language configuration for the Learning module, persisted to localStorage.
 */

const STORAGE_KEY = 'rostered.lms.settings.v1';

export interface LmsSettings {
  // Assigning learning
  defaultDueDays: number;
  autoAssignOnHire: boolean;
  autoAssignPathId: string | null;
  allowManagerAssign: boolean;
  allowSelfEnrol: boolean;

  // Reminders
  remindBeforeDueDays: number;
  overdueReminderFrequency: 'off' | 'daily' | 'every_3_days' | 'weekly';
  notifyManagerOnOverdue: boolean;
  weeklyDigest: boolean;

  // Completion & compliance
  passMark: number;
  maxAttempts: number;
  requireManagerSignOff: boolean;
  issueCertificates: boolean;
  refresherReminderDays: number;
  blockShiftsOnExpiredCompliance: boolean;

  // Learner experience
  countLearningAsPaidTime: boolean;
  maxLearningHoursPerWeek: number;
  showRatingsAndReviews: boolean;
  allowMobileLearning: boolean;

  // Course library
  requireApprovalBeforePublish: boolean;
  allowScormUpload: boolean;
  defaultCourseVisibility: 'all_staff' | 'by_position' | 'by_location';
}

export const defaultLmsSettings: LmsSettings = {
  defaultDueDays: 30,
  autoAssignOnHire: true,
  autoAssignPathId: null,
  allowManagerAssign: true,
  allowSelfEnrol: true,

  remindBeforeDueDays: 7,
  overdueReminderFrequency: 'every_3_days',
  notifyManagerOnOverdue: true,
  weeklyDigest: true,

  passMark: 80,
  maxAttempts: 3,
  requireManagerSignOff: false,
  issueCertificates: true,
  refresherReminderDays: 60,
  blockShiftsOnExpiredCompliance: false,

  countLearningAsPaidTime: true,
  maxLearningHoursPerWeek: 4,
  showRatingsAndReviews: true,
  allowMobileLearning: true,

  requireApprovalBeforePublish: true,
  allowScormUpload: true,
  defaultCourseVisibility: 'all_staff',
};

export function loadLmsSettings(): LmsSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultLmsSettings };
    return { ...defaultLmsSettings, ...(JSON.parse(raw) as Partial<LmsSettings>) };
  } catch {
    return { ...defaultLmsSettings };
  }
}

export function saveLmsSettings(settings: LmsSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function resetLmsSettings(): LmsSettings {
  localStorage.removeItem(STORAGE_KEY);
  return { ...defaultLmsSettings };
}

/** Human readable summary used for the settings review strip. */
export function summariseLmsSettings(s: LmsSettings): string[] {
  const lines = [
    `New learning is due ${s.defaultDueDays} days after it is assigned.`,
    'Assignments and reminders are saved in this browser; no emails are delivered.',
    s.overdueReminderFrequency === 'off'
      ? 'Overdue reminders are disabled.'
      : `Overdue reminder preference: ${s.overdueReminderFrequency.replace(/_/g, ' ')}.`,
    `Staff must score at least ${s.passMark}% to pass, with up to ${s.maxAttempts} attempts.`,
  ];
  if (s.blockShiftsOnExpiredCompliance) {
    lines.push('Staff with expired mandatory training are flagged when rostered.');
  }
  return lines;
}
