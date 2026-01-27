// Unified Task Types for consolidated view across modules

import { Task, TaskStatus, TaskPriority, TaskAttachment, TaskComment, TaskActivityLog } from './tasks';
import { PerformanceTask, PerformanceTaskStatus, PerformanceTaskPriority } from './performanceTasks';

export type ModuleType = 'forms' | 'performance' | 'roster' | 'timesheet';

export interface UnifiedTask {
  id: string;
  title: string;
  description: string;
  type: string;
  status: TaskStatus | PerformanceTaskStatus;
  priority: TaskPriority | PerformanceTaskPriority;
  module: ModuleType;
  moduleLabel: string;
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: string;
  location?: string;
  // Original task reference
  originalTask: Task | PerformanceTask;
  // Computed fields
  isOverdue: boolean;
  daysUntilDue: number | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface TaskFilter {
  modules: ModuleType[];
  statuses: string[];
  priorities: string[];
  search: string;
  showCompleted: boolean;
  dateRange: 'all' | 'today' | 'week' | 'month' | 'overdue';
}

export const defaultTaskFilter: TaskFilter = {
  modules: ['forms', 'performance'],
  statuses: [],
  priorities: [],
  search: '',
  showCompleted: false,
  dateRange: 'all',
};

export const moduleLabels: Record<ModuleType, string> = {
  forms: 'Forms & Audits',
  performance: 'Performance',
  roster: 'Roster',
  timesheet: 'Timesheets',
};

export const moduleColors: Record<ModuleType, string> = {
  forms: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  performance: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  roster: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  timesheet: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

export const typeLabels: Record<string, string> = {
  // Forms module
  work_order: 'Work Order',
  corrective_action: 'Corrective Action',
  maintenance_request: 'Maintenance',
  // Performance module
  goal_action: 'Goal Action',
  review_followup: 'Review Follow-up',
  development_task: 'Development',
  coaching_task: 'Coaching',
  pip_action: 'PIP Action',
  training_task: 'Training',
};
