export type TimesheetStatus = 'pending' | 'approved' | 'rejected';

export interface BreakEntry {
  id: string;
  startTime: string;
  endTime: string | null;
  duration: number; // in minutes
  type: 'lunch' | 'short' | 'other';
}

export type ExceptionReason =
  | 'missed_clock_in'
  | 'missed_clock_out'
  | 'missed_break'
  | 'unpaid_overtime'
  | 'equipment_issue'
  | 'incorrect_rate'
  | 'shift_cut_short'
  | 'other';

export interface TimesheetException {
  reason: ExceptionReason;
  note: string;
  raisedBy: 'staff' | 'manager' | 'system';
  raisedAt: string;
  resolved?: boolean;
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
  exception?: TimesheetException;
  // Original values for audit trail
  originalClockIn?: string;
  originalClockOut?: string | null;
  originalBreaks?: BreakEntry[];
  wasEdited?: boolean;
  editedAt?: string;
  editedBy?: string;
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
