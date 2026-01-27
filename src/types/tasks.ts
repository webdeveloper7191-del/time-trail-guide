// Task Management Types

export type TaskType = 'work_order' | 'corrective_action' | 'maintenance_request';
export type TaskStatus = 'open' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface TaskActivityLog {
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

export interface TaskPipelineStage {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface TaskPipeline {
  id: string;
  name: string;
  description?: string;
  stages: TaskPipelineStage[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  pipelineId?: string;
  stageId?: string;
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: string;
  location?: string;
  assetId?: string;
  assetName?: string;
  linkedSubmissionId?: string;
  linkedFieldId?: string;
  attachments: TaskAttachment[];
  comments: TaskComment[];
  activityLog: TaskActivityLog[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  createdBy: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  assigneeId: string;
  assigneeName: string;
  dueDate: string;
  location: string;
  pipelineId?: string;
  stageId?: string;
}

export interface StaffOption {
  id: string;
  name: string;
  position: string;
  avatar?: string;
}
