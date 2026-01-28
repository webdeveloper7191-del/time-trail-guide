// Performance Task Management Types

// Built-in task types
export type BuiltInPerformanceTaskType = 
  | 'goal_action' 
  | 'review_followup' 
  | 'development_task' 
  | 'coaching_task'
  | 'pip_action'
  | 'training_task';

// Task type can be built-in or custom (string)
export type PerformanceTaskType = BuiltInPerformanceTaskType | string;

export interface CustomTaskType {
  id: string;
  label: string;
  color: string;
  createdAt: string;
}

export type PerformanceTaskStatus = 'open' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
export type PerformanceTaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface PerformanceTaskAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface PerformanceTaskComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface PerformanceTaskActivityLog {
  id: string;
  type: 'status_change' | 'assignment_change' | 'priority_change' | 'comment_added' | 'attachment_added' | 'edit' | 'created' | 'pipeline_change';
  description: string;
  userId: string;
  userName: string;
  timestamp: string;
  metadata?: {
    oldValue?: string;
    newValue?: string;
    fieldName?: string;
  };
}

export interface PerformanceTaskPipelineStage {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface PerformanceTaskPipeline {
  id: string;
  name: string;
  description?: string;
  stages: PerformanceTaskPipelineStage[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceTask {
  id: string;
  title: string;
  description: string;
  type: PerformanceTaskType;
  status: PerformanceTaskStatus;
  priority: PerformanceTaskPriority;
  pipelineId?: string;
  stageId?: string;
  assigneeId?: string;
  assigneeName?: string;
  createdForId?: string; // The employee this task is about
  createdForName?: string;
  dueDate?: string;
  // Linked performance items
  linkedGoalId?: string;
  linkedReviewId?: string;
  linkedPlanId?: string;
  linkedConversationId?: string;
  attachments: PerformanceTaskAttachment[];
  comments: PerformanceTaskComment[];
  activityLog: PerformanceTaskActivityLog[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  createdBy: string;
  // For consolidated view
  module: 'performance';
}

export interface PerformanceTaskFormData {
  title: string;
  description: string;
  type: PerformanceTaskType;
  priority: PerformanceTaskPriority;
  assigneeId: string;
  assigneeName: string;
  createdForId: string;
  createdForName: string;
  dueDate: string;
  linkedGoalId?: string;
  linkedReviewId?: string;
  linkedPlanId?: string;
  pipelineId?: string;
  stageId?: string;
}

export const performanceTaskTypeConfig: Record<BuiltInPerformanceTaskType, { label: string; color: string }> = {
  goal_action: { label: 'Goal Action', color: 'primary' },
  review_followup: { label: 'Review Follow-up', color: 'secondary' },
  development_task: { label: 'Development', color: 'info' },
  coaching_task: { label: 'Coaching', color: 'success' },
  pip_action: { label: 'PIP Action', color: 'error' },
  training_task: { label: 'Training', color: 'warning' },
};

// Helper to get task type config (handles both built-in and custom types)
export const getTaskTypeConfig = (
  type: PerformanceTaskType, 
  customTypes: CustomTaskType[]
): { label: string; color: string } => {
  if (type in performanceTaskTypeConfig) {
    return performanceTaskTypeConfig[type as BuiltInPerformanceTaskType];
  }
  const custom = customTypes.find(t => t.id === type);
  return custom 
    ? { label: custom.label, color: custom.color }
    : { label: type, color: 'default' };
};

export const performanceTaskStatusConfig: Record<PerformanceTaskStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: 'info' },
  in_progress: { label: 'In Progress', color: 'primary' },
  blocked: { label: 'Blocked', color: 'error' },
  completed: { label: 'Completed', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'default' },
};

export const performanceTaskPriorityConfig: Record<PerformanceTaskPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'default' },
  medium: { label: 'Medium', color: 'info' },
  high: { label: 'High', color: 'warning' },
  critical: { label: 'Critical', color: 'error' },
};
