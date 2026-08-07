import { Shift, ShiftTemplate } from './roster';

export interface RosterTemplateShift {
  id: string;
  roomId: string;
  dayOfWeek: number; // 0-6, Sunday-Saturday
  startTime: string;
  endTime: string;
  breakMinutes: number;
  /** Saved staff assignment (when the template was saved "with staff"). */
  staffId?: string;
  staffRole?: string;
  requiredQualifications?: string[];
  notes?: string;
}

export interface RosterTemplate {
  id: string;
  name: string;
  description?: string;
  centreId: string;
  shifts: RosterTemplateShift[];
  /** True when at least one shift carries a saved staff assignment. */
  includesStaff?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavedShiftTemplate extends ShiftTemplate {
  isCustom: boolean;
  centreId?: string;
}

export interface BulkAssignmentTarget {
  roomId: string;
  dates: string[];
  shiftTemplateId: string;
  staffIds: string[];
}

export interface TemplateMatchResult {
  templateShift: RosterTemplateShift;
  existingShift?: Shift;
  date: string;
  action: 'skip' | 'add' | 'update';
  reason?: string;
}
