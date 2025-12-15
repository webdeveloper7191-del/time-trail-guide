export type TimesheetStatus = 'pending' | 'approved' | 'rejected';

export interface BreakEntry {
  id: string;
  startTime: string;
  endTime: string | null;
  duration: number; // in minutes
  type: 'lunch' | 'short' | 'other';
}

export interface ClockEntry {
  id: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  breaks: BreakEntry[];
  totalBreakMinutes: number;
  grossHours: number; // before break deduction
  netHours: number; // after break deduction
  overtime: number;
  notes?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  department: string;
  position: string;
  hourlyRate?: number;
}

export interface Location {
  id: string;
  name: string;
  address: string;
}

export interface Timesheet {
  id: string;
  employee: Employee;
  location: Location;
  weekStartDate: string;
  weekEndDate: string;
  status: TimesheetStatus;
  entries: ClockEntry[];
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  totalBreakMinutes: number;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
  appliedAllowances?: import('./allowances').AppliedAllowance[];
  awardType?: import('./allowances').AwardType;
}
