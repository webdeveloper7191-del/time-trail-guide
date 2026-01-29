// OKR (Objectives & Key Results) Types

export type OKRLevel = 'company' | 'team' | 'individual';
export type OKRStatus = 'draft' | 'active' | 'at_risk' | 'on_track' | 'completed' | 'cancelled';
export type KeyResultType = 'percentage' | 'number' | 'currency' | 'boolean';

export interface KeyResult {
  id: string;
  title: string;
  description?: string;
  type: KeyResultType;
  startValue: number;
  targetValue: number;
  currentValue: number;
  unit?: string; // e.g., "%", "$", "users"
  progress: number; // 0-100
  ownerId?: string;
  dueDate?: string;
  updatedAt: string;
}

export interface Objective {
  id: string;
  title: string;
  description?: string;
  level: OKRLevel;
  status: OKRStatus;
  ownerId: string;
  teamId?: string; // For team-level OKRs
  parentObjectiveId?: string; // For cascading alignment
  keyResults: KeyResult[];
  progress: number; // Calculated from key results
  startDate: string;
  endDate: string;
  cycle: string; // e.g., "Q1 2025", "2025"
  childObjectives?: string[]; // IDs of aligned child objectives
  createdAt: string;
  updatedAt: string;
}

export interface OKRCycle {
  id: string;
  name: string; // e.g., "Q1 2025"
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Team {
  id: string;
  name: string;
  leaderId: string;
  memberIds: string[];
}

// Label mappings
export const okrLevelLabels: Record<OKRLevel, string> = {
  company: 'Company',
  team: 'Team',
  individual: 'Individual',
};

export const okrStatusLabels: Record<OKRStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  at_risk: 'At Risk',
  on_track: 'On Track',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const keyResultTypeLabels: Record<KeyResultType, string> = {
  percentage: 'Percentage',
  number: 'Number',
  currency: 'Currency',
  boolean: 'Yes/No',
};
