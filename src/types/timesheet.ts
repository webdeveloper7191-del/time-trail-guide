export type TimesheetStatus = 'pending' | 'approved' | 'rejected';

export interface ClockEntry {
  id: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  breakStart?: string;
  breakEnd?: string;
  totalHours: number;
  overtime: number;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  department: string;
  position: string;
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
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
}
