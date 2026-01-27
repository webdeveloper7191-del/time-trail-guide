// Unified Task Service - consolidates tasks from all modules

import { Task } from '@/types/tasks';
import { PerformanceTask } from '@/types/performanceTasks';
import { UnifiedTask, ModuleType, TaskFilter, moduleLabels } from '@/types/unifiedTasks';
import { mockTasks } from '@/data/mockTaskData';
import { mockPerformanceTasks } from '@/data/mockPerformanceTaskData';
import { differenceInDays, isPast, isToday, isTomorrow, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

// Mock current user ID - in production this would come from auth context
const CURRENT_USER_ID = 'staff-1';

/**
 * Convert a Forms module task to unified format
 */
function convertFormTask(task: Task): UnifiedTask {
  const now = new Date();
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate ? isPast(dueDate) && !isToday(dueDate) && task.status !== 'completed' && task.status !== 'cancelled' : false;
  const daysUntilDue = dueDate ? differenceInDays(dueDate, now) : null;

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    type: task.type,
    status: task.status,
    priority: task.priority,
    module: 'forms',
    moduleLabel: moduleLabels.forms,
    assigneeId: task.assigneeId,
    assigneeName: task.assigneeName,
    dueDate: task.dueDate,
    location: task.location,
    originalTask: task,
    isOverdue,
    daysUntilDue,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    completedAt: task.completedAt,
  };
}

/**
 * Convert a Performance module task to unified format
 */
function convertPerformanceTask(task: PerformanceTask): UnifiedTask {
  const now = new Date();
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate ? isPast(dueDate) && !isToday(dueDate) && task.status !== 'completed' && task.status !== 'cancelled' : false;
  const daysUntilDue = dueDate ? differenceInDays(dueDate, now) : null;

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    type: task.type,
    status: task.status,
    priority: task.priority,
    module: 'performance',
    moduleLabel: moduleLabels.performance,
    assigneeId: task.assigneeId,
    assigneeName: task.assigneeName,
    dueDate: task.dueDate,
    originalTask: task,
    isOverdue,
    daysUntilDue,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    completedAt: task.completedAt,
  };
}

/**
 * Get all tasks from all modules
 */
export function getAllUnifiedTasks(): UnifiedTask[] {
  const formTasks = mockTasks.map(convertFormTask);
  const performanceTasks = mockPerformanceTasks.map(convertPerformanceTask);
  
  return [...formTasks, ...performanceTasks];
}

/**
 * Get tasks assigned to current user
 */
export function getMyTasks(userId: string = CURRENT_USER_ID): UnifiedTask[] {
  const allTasks = getAllUnifiedTasks();
  return allTasks.filter(task => task.assigneeId === userId);
}

/**
 * Filter tasks based on filter criteria
 */
export function filterTasks(tasks: UnifiedTask[], filter: TaskFilter): UnifiedTask[] {
  return tasks.filter(task => {
    // Module filter
    if (filter.modules.length > 0 && !filter.modules.includes(task.module)) {
      return false;
    }

    // Status filter
    if (filter.statuses.length > 0 && !filter.statuses.includes(task.status)) {
      return false;
    }

    // Priority filter
    if (filter.priorities.length > 0 && !filter.priorities.includes(task.priority)) {
      return false;
    }

    // Search filter
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const matchesSearch = 
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower) ||
        task.assigneeName?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Completed filter
    if (!filter.showCompleted && (task.status === 'completed' || task.status === 'cancelled')) {
      return false;
    }

    // Date range filter
    if (filter.dateRange !== 'all' && task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const now = new Date();

      switch (filter.dateRange) {
        case 'today':
          if (!isToday(dueDate)) return false;
          break;
        case 'week':
          if (dueDate < startOfWeek(now) || dueDate > endOfWeek(now)) return false;
          break;
        case 'month':
          if (dueDate < startOfMonth(now) || dueDate > endOfMonth(now)) return false;
          break;
        case 'overdue':
          if (!task.isOverdue) return false;
          break;
      }
    }

    return true;
  });
}

/**
 * Sort tasks by priority and due date
 */
export function sortTasks(tasks: UnifiedTask[], sortBy: 'dueDate' | 'priority' | 'module' | 'status' = 'dueDate'): UnifiedTask[] {
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const statusOrder = { open: 0, in_progress: 1, blocked: 2, completed: 3, cancelled: 4 };

  return [...tasks].sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      case 'module':
        return a.module.localeCompare(b.module);
      case 'status':
        return statusOrder[a.status] - statusOrder[b.status];
      case 'dueDate':
      default:
        // Overdue first, then by due date
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
    }
  });
}

/**
 * Get task statistics
 */
export function getTaskStats(tasks: UnifiedTask[]): {
  total: number;
  overdue: number;
  dueToday: number;
  dueSoon: number;
  byModule: Record<ModuleType, number>;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
} {
  const byModule: Record<ModuleType, number> = { forms: 0, performance: 0, roster: 0, timesheet: 0 };
  const byStatus: Record<string, number> = {};
  const byPriority: Record<string, number> = {};

  let overdue = 0;
  let dueToday = 0;
  let dueSoon = 0;

  tasks.forEach(task => {
    byModule[task.module]++;
    byStatus[task.status] = (byStatus[task.status] || 0) + 1;
    byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;

    if (task.isOverdue) overdue++;
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      if (isToday(dueDate)) dueToday++;
      else if (isTomorrow(dueDate) || (task.daysUntilDue !== null && task.daysUntilDue > 0 && task.daysUntilDue <= 3)) {
        dueSoon++;
      }
    }
  });

  return {
    total: tasks.length,
    overdue,
    dueToday,
    dueSoon,
    byModule,
    byStatus,
    byPriority,
  };
}
