import { format, subDays, subHours, addMinutes, startOfWeek, addDays } from 'date-fns';

const today = new Date();
const weekStart = startOfWeek(today, { weekStartsOn: 1 });

// Approval pipeline
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'escalated' | 'auto_approved';

export interface TimesheetApprovalRecord {
  id: string;
  staffName: string;
  location: string;
  department: string;
  period: string;
  totalHours: number;
  overtimeHours: number;
  status: ApprovalStatus;
  submittedAt: string;
  approvedAt?: string;
  approverName?: string;
  tier: 1 | 2 | 3;
  slaHours: number;
  turnaroundHours?: number;
  hasExceptions: boolean;
}

export const mockApprovalPipeline: TimesheetApprovalRecord[] = [
  { id: 'ta1', staffName: 'Sarah Johnson', location: 'Sunshine Centre', department: 'Nursery', period: '07-13 Apr', totalHours: 40, overtimeHours: 2, status: 'pending', submittedAt: format(subHours(today, 6), "yyyy-MM-dd'T'HH:mm"), tier: 1, slaHours: 24, hasExceptions: true },
  { id: 'ta2', staffName: 'Michael Chen', location: 'Sunshine Centre', department: 'Toddler', period: '07-13 Apr', totalHours: 38, overtimeHours: 0, status: 'pending', submittedAt: format(subHours(today, 18), "yyyy-MM-dd'T'HH:mm"), tier: 1, slaHours: 24, hasExceptions: false },
  { id: 'ta3', staffName: 'Emily Rodriguez', location: 'Harbor View', department: 'Preschool', period: '07-13 Apr', totalHours: 44, overtimeHours: 4, status: 'escalated', submittedAt: format(subHours(today, 30), "yyyy-MM-dd'T'HH:mm"), tier: 2, slaHours: 48, hasExceptions: true },
  { id: 'ta4', staffName: 'James Wilson', location: 'Harbor View', department: 'Kindy', period: '07-13 Apr', totalHours: 36, overtimeHours: 0, status: 'approved', submittedAt: format(subHours(today, 48), "yyyy-MM-dd'T'HH:mm"), approvedAt: format(subHours(today, 24), "yyyy-MM-dd'T'HH:mm"), approverName: 'Linda Park', tier: 1, slaHours: 24, turnaroundHours: 24, hasExceptions: false },
  { id: 'ta5', staffName: 'Aisha Patel', location: 'Mountain Peak', department: 'Toddler', period: '07-13 Apr', totalHours: 40, overtimeHours: 0, status: 'approved', submittedAt: format(subHours(today, 72), "yyyy-MM-dd'T'HH:mm"), approvedAt: format(subHours(today, 60), "yyyy-MM-dd'T'HH:mm"), approverName: 'Linda Park', tier: 1, slaHours: 24, turnaroundHours: 12, hasExceptions: false },
  { id: 'ta6', staffName: 'David Kim', location: 'Sunshine Centre', department: 'Kitchen', period: '07-13 Apr', totalHours: 35, overtimeHours: 0, status: 'auto_approved', submittedAt: format(subHours(today, 50), "yyyy-MM-dd'T'HH:mm"), approvedAt: format(subHours(today, 50), "yyyy-MM-dd'T'HH:mm"), tier: 1, slaHours: 24, turnaroundHours: 0, hasExceptions: false },
  { id: 'ta7', staffName: 'Lisa Thompson', location: 'Mountain Peak', department: 'Preschool', period: '07-13 Apr', totalHours: 24, overtimeHours: 0, status: 'rejected', submittedAt: format(subHours(today, 40), "yyyy-MM-dd'T'HH:mm"), approvedAt: format(subHours(today, 30), "yyyy-MM-dd'T'HH:mm"), approverName: 'Linda Park', tier: 1, slaHours: 24, turnaroundHours: 10, hasExceptions: true },
  { id: 'ta8', staffName: 'Robert Garcia', location: 'Sunshine Centre', department: 'Nursery', period: '07-13 Apr', totalHours: 46, overtimeHours: 6, status: 'pending', submittedAt: format(subHours(today, 3), "yyyy-MM-dd'T'HH:mm"), tier: 2, slaHours: 48, hasExceptions: true },
];

// Real-time attendance
export type ClockStatus = 'clocked_in' | 'on_break' | 'clocked_out' | 'absent' | 'late' | 'not_started';

export interface RealTimeAttendanceRecord {
  staffId: string;
  staffName: string;
  location: string;
  department: string;
  role: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualClockIn?: string;
  actualClockOut?: string;
  status: ClockStatus;
  breakStatus?: 'on_break' | 'break_ended';
  breakStartedAt?: string;
  lateMinutes?: number;
  currentShiftHours?: number;
}

const makeTime = (h: number, m: number) => format(new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m), 'h:mm a');

export const mockRealTimeAttendance: RealTimeAttendanceRecord[] = [
  { staffId: '1', staffName: 'Sarah Johnson', location: 'Sunshine Centre', department: 'Nursery', role: 'Lead Educator', scheduledStart: makeTime(6, 30), scheduledEnd: makeTime(14, 30), actualClockIn: makeTime(6, 28), status: 'clocked_in', currentShiftHours: 5.2 },
  { staffId: '2', staffName: 'Michael Chen', location: 'Sunshine Centre', department: 'Toddler', role: 'Educator', scheduledStart: makeTime(7, 0), scheduledEnd: makeTime(15, 0), actualClockIn: makeTime(7, 12), status: 'clocked_in', lateMinutes: 12, currentShiftHours: 4.5 },
  { staffId: '3', staffName: 'Emily Rodriguez', location: 'Harbor View', department: 'Preschool', role: 'Assistant', scheduledStart: makeTime(9, 0), scheduledEnd: makeTime(17, 0), actualClockIn: makeTime(8, 58), status: 'on_break', breakStatus: 'on_break', breakStartedAt: makeTime(12, 0), currentShiftHours: 3 },
  { staffId: '4', staffName: 'James Wilson', location: 'Harbor View', department: 'Kindy', role: 'Educator', scheduledStart: makeTime(9, 0), scheduledEnd: makeTime(17, 0), status: 'absent' },
  { staffId: '5', staffName: 'Aisha Patel', location: 'Mountain Peak', department: 'Toddler', role: 'Lead Educator', scheduledStart: makeTime(7, 30), scheduledEnd: makeTime(15, 30), actualClockIn: makeTime(7, 30), status: 'clocked_in', currentShiftHours: 4.2 },
  { staffId: '6', staffName: 'David Kim', location: 'Sunshine Centre', department: 'Kitchen', role: 'Cook', scheduledStart: makeTime(6, 0), scheduledEnd: makeTime(14, 0), actualClockIn: makeTime(5, 55), actualClockOut: makeTime(14, 5), status: 'clocked_out', currentShiftHours: 8.2 },
  { staffId: '7', staffName: 'Lisa Thompson', location: 'Mountain Peak', department: 'Preschool', role: 'Educator', scheduledStart: makeTime(10, 30), scheduledEnd: makeTime(18, 30), status: 'not_started' },
  { staffId: '8', staffName: 'Robert Garcia', location: 'Sunshine Centre', department: 'Nursery', role: 'Assistant', scheduledStart: makeTime(7, 0), scheduledEnd: makeTime(15, 0), actualClockIn: makeTime(7, 25), status: 'late', lateMinutes: 25, currentShiftHours: 4.3 },
  { staffId: '9', staffName: 'Nina Williams', location: 'Harbor View', department: 'Nursery', role: 'Educator', scheduledStart: makeTime(8, 0), scheduledEnd: makeTime(16, 0), actualClockIn: makeTime(8, 0), status: 'clocked_in', currentShiftHours: 3.7 },
  { staffId: '10', staffName: 'Tom Baker', location: 'Mountain Peak', department: 'Kindy', role: 'Assistant', scheduledStart: makeTime(9, 0), scheduledEnd: makeTime(17, 0), actualClockIn: makeTime(9, 3), status: 'clocked_in', lateMinutes: 3, currentShiftHours: 2.7 },
];

// Weekly timesheet summary
export interface WeeklyTimesheetSummary {
  staffName: string;
  location: string;
  department: string;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  breakMinutes: number;
  daysWorked: number;
  status: ApprovalStatus;
  period: string;
}

export const mockWeeklyTimesheets: WeeklyTimesheetSummary[] = [
  { staffName: 'Sarah Johnson', location: 'Sunshine Centre', department: 'Nursery', regularHours: 38, overtimeHours: 2, totalHours: 40, breakMinutes: 150, daysWorked: 5, status: 'approved', period: '07-13 Apr' },
  { staffName: 'Michael Chen', location: 'Sunshine Centre', department: 'Toddler', regularHours: 38, overtimeHours: 0, totalHours: 38, breakMinutes: 150, daysWorked: 5, status: 'pending', period: '07-13 Apr' },
  { staffName: 'Emily Rodriguez', location: 'Harbor View', department: 'Preschool', regularHours: 38, overtimeHours: 6, totalHours: 44, breakMinutes: 120, daysWorked: 5, status: 'escalated', period: '07-13 Apr' },
  { staffName: 'James Wilson', location: 'Harbor View', department: 'Kindy', regularHours: 36, overtimeHours: 0, totalHours: 36, breakMinutes: 150, daysWorked: 4, status: 'approved', period: '07-13 Apr' },
  { staffName: 'Aisha Patel', location: 'Mountain Peak', department: 'Toddler', regularHours: 38, overtimeHours: 2, totalHours: 40, breakMinutes: 150, daysWorked: 5, status: 'approved', period: '07-13 Apr' },
  { staffName: 'David Kim', location: 'Sunshine Centre', department: 'Kitchen', regularHours: 35, overtimeHours: 0, totalHours: 35, breakMinutes: 150, daysWorked: 5, status: 'auto_approved', period: '07-13 Apr' },
  { staffName: 'Robert Garcia', location: 'Sunshine Centre', department: 'Nursery', regularHours: 38, overtimeHours: 8, totalHours: 46, breakMinutes: 90, daysWorked: 6, status: 'pending', period: '07-13 Apr' },
  { staffName: 'Lisa Thompson', location: 'Mountain Peak', department: 'Preschool', regularHours: 24, overtimeHours: 0, totalHours: 24, breakMinutes: 90, daysWorked: 3, status: 'rejected', period: '07-13 Apr' },
];

// Late clock-in / early clock-out
export interface LatePunctualityRecord {
  staffName: string;
  location: string;
  department: string;
  date: string;
  scheduledStart: string;
  actualClockIn: string;
  lateMinutes: number;
  scheduledEnd: string;
  actualClockOut: string;
  earlyMinutes: number;
  type: 'late_in' | 'early_out' | 'both';
}

export const mockLatePunctuality: LatePunctualityRecord[] = [
  { staffName: 'Michael Chen', location: 'Sunshine Centre', department: 'Toddler', date: format(subDays(today, 1), 'yyyy-MM-dd'), scheduledStart: '7:00 AM', actualClockIn: '7:12 AM', lateMinutes: 12, scheduledEnd: '3:00 PM', actualClockOut: '3:00 PM', earlyMinutes: 0, type: 'late_in' },
  { staffName: 'Robert Garcia', location: 'Sunshine Centre', department: 'Nursery', date: format(subDays(today, 1), 'yyyy-MM-dd'), scheduledStart: '7:00 AM', actualClockIn: '7:25 AM', lateMinutes: 25, scheduledEnd: '3:00 PM', actualClockOut: '2:45 PM', earlyMinutes: 15, type: 'both' },
  { staffName: 'Emily Rodriguez', location: 'Harbor View', department: 'Preschool', date: format(subDays(today, 2), 'yyyy-MM-dd'), scheduledStart: '9:00 AM', actualClockIn: '9:05 AM', lateMinutes: 5, scheduledEnd: '5:00 PM', actualClockOut: '5:00 PM', earlyMinutes: 0, type: 'late_in' },
  { staffName: 'Lisa Thompson', location: 'Mountain Peak', department: 'Preschool', date: format(subDays(today, 3), 'yyyy-MM-dd'), scheduledStart: '10:30 AM', actualClockIn: '10:30 AM', lateMinutes: 0, scheduledEnd: '6:30 PM', actualClockOut: '6:00 PM', earlyMinutes: 30, type: 'early_out' },
  { staffName: 'Tom Baker', location: 'Mountain Peak', department: 'Kindy', date: format(today, 'yyyy-MM-dd'), scheduledStart: '9:00 AM', actualClockIn: '9:03 AM', lateMinutes: 3, scheduledEnd: '5:00 PM', actualClockOut: '5:00 PM', earlyMinutes: 0, type: 'late_in' },
  { staffName: 'Michael Chen', location: 'Sunshine Centre', department: 'Toddler', date: format(subDays(today, 4), 'yyyy-MM-dd'), scheduledStart: '7:00 AM', actualClockIn: '7:20 AM', lateMinutes: 20, scheduledEnd: '3:00 PM', actualClockOut: '3:00 PM', earlyMinutes: 0, type: 'late_in' },
];

// Break compliance
export interface BreakComplianceRecord {
  staffName: string;
  location: string;
  department: string;
  date: string;
  shiftDuration: number;
  requiredBreakMinutes: number;
  actualBreakMinutes: number;
  compliant: boolean;
  breaksTaken: number;
  breakTimings: string;
  violation?: string;
}

export const mockBreakCompliance: BreakComplianceRecord[] = [
  { staffName: 'Sarah Johnson', location: 'Sunshine Centre', department: 'Nursery', date: format(subDays(today, 1), 'yyyy-MM-dd'), shiftDuration: 8, requiredBreakMinutes: 30, actualBreakMinutes: 30, compliant: true, breaksTaken: 1, breakTimings: '12:00 PM - 12:30 PM' },
  { staffName: 'Robert Garcia', location: 'Sunshine Centre', department: 'Nursery', date: format(subDays(today, 1), 'yyyy-MM-dd'), shiftDuration: 8, requiredBreakMinutes: 30, actualBreakMinutes: 15, compliant: false, breaksTaken: 1, breakTimings: '12:00 PM - 12:15 PM', violation: 'Break too short (15 min vs 30 min required)' },
  { staffName: 'Emily Rodriguez', location: 'Harbor View', department: 'Preschool', date: format(subDays(today, 1), 'yyyy-MM-dd'), shiftDuration: 8, requiredBreakMinutes: 30, actualBreakMinutes: 0, compliant: false, breaksTaken: 0, breakTimings: 'None', violation: 'No break taken during 8-hour shift' },
  { staffName: 'Aisha Patel', location: 'Mountain Peak', department: 'Toddler', date: format(subDays(today, 2), 'yyyy-MM-dd'), shiftDuration: 8, requiredBreakMinutes: 30, actualBreakMinutes: 45, compliant: true, breaksTaken: 2, breakTimings: '10:00 AM - 10:15 AM, 1:00 PM - 1:30 PM' },
  { staffName: 'David Kim', location: 'Sunshine Centre', department: 'Kitchen', date: format(subDays(today, 1), 'yyyy-MM-dd'), shiftDuration: 8, requiredBreakMinutes: 30, actualBreakMinutes: 30, compliant: true, breaksTaken: 1, breakTimings: '11:30 AM - 12:00 PM' },
  { staffName: 'Michael Chen', location: 'Sunshine Centre', department: 'Toddler', date: format(subDays(today, 2), 'yyyy-MM-dd'), shiftDuration: 8, requiredBreakMinutes: 30, actualBreakMinutes: 20, compliant: false, breaksTaken: 1, breakTimings: '12:30 PM - 12:50 PM', violation: 'Break too short (20 min vs 30 min required)' },
];

// Timesheet exceptions
export type ExceptionType = 'manual_edit' | 'manager_override' | 'time_adjustment' | 'retroactive_entry' | 'system_correction';

export interface TimesheetExceptionRecord {
  id: string;
  staffName: string;
  location: string;
  date: string;
  exceptionType: ExceptionType;
  field: string;
  originalValue: string;
  newValue: string;
  editedBy: string;
  editedAt: string;
  reason: string;
}

export const mockTimesheetExceptions: TimesheetExceptionRecord[] = [
  { id: 'ex1', staffName: 'Robert Garcia', location: 'Sunshine Centre', date: format(subDays(today, 1), 'yyyy-MM-dd'), exceptionType: 'manual_edit', field: 'Clock-in time', originalValue: '7:25 AM', newValue: '7:00 AM', editedBy: 'Linda Park', editedAt: format(subHours(today, 12), "yyyy-MM-dd'T'HH:mm"), reason: 'System error at entry point' },
  { id: 'ex2', staffName: 'Emily Rodriguez', location: 'Harbor View', date: format(subDays(today, 2), 'yyyy-MM-dd'), exceptionType: 'manager_override', field: 'Total hours', originalValue: '7.5', newValue: '8.0', editedBy: 'Linda Park', editedAt: format(subHours(today, 20), "yyyy-MM-dd'T'HH:mm"), reason: 'Worked through break due to staffing shortage' },
  { id: 'ex3', staffName: 'Lisa Thompson', location: 'Mountain Peak', date: format(subDays(today, 3), 'yyyy-MM-dd'), exceptionType: 'retroactive_entry', field: 'Full timesheet', originalValue: 'Missing', newValue: '6h shift logged', editedBy: 'Lisa Thompson', editedAt: format(subHours(today, 30), "yyyy-MM-dd'T'HH:mm"), reason: 'Forgot to clock in/out' },
  { id: 'ex4', staffName: 'Michael Chen', location: 'Sunshine Centre', date: format(subDays(today, 4), 'yyyy-MM-dd'), exceptionType: 'time_adjustment', field: 'Clock-out time', originalValue: '3:00 PM', newValue: '3:30 PM', editedBy: 'Michael Chen', editedAt: format(subHours(today, 48), "yyyy-MM-dd'T'HH:mm"), reason: 'Stayed for handover' },
  { id: 'ex5', staffName: 'Aisha Patel', location: 'Mountain Peak', date: format(subDays(today, 1), 'yyyy-MM-dd'), exceptionType: 'system_correction', field: 'Break duration', originalValue: '0 min', newValue: '30 min', editedBy: 'System', editedAt: format(subHours(today, 8), "yyyy-MM-dd'T'HH:mm"), reason: 'Break auto-detected from location data' },
];

// Approval SLA
export interface ApprovalSLARecord {
  approverName: string;
  location: string;
  totalApprovals: number;
  withinSLA: number;
  breachedSLA: number;
  avgTurnaroundHours: number;
  slaCompliancePercent: number;
  tier: number;
  period: string;
}

export const mockApprovalSLA: ApprovalSLARecord[] = [
  { approverName: 'Linda Park', location: 'All Locations', totalApprovals: 24, withinSLA: 20, breachedSLA: 4, avgTurnaroundHours: 14.5, slaCompliancePercent: 83, tier: 1, period: '07-13 Apr' },
  { approverName: 'Mark Stevens', location: 'Sunshine Centre', totalApprovals: 10, withinSLA: 9, breachedSLA: 1, avgTurnaroundHours: 8.2, slaCompliancePercent: 90, tier: 1, period: '07-13 Apr' },
  { approverName: 'Rachel Adams', location: 'Harbor View', totalApprovals: 8, withinSLA: 5, breachedSLA: 3, avgTurnaroundHours: 22.1, slaCompliancePercent: 63, tier: 2, period: '07-13 Apr' },
  { approverName: 'Tony Nguyen', location: 'Mountain Peak', totalApprovals: 6, withinSLA: 6, breachedSLA: 0, avgTurnaroundHours: 6.0, slaCompliancePercent: 100, tier: 1, period: '07-13 Apr' },
];

// Overtime by location
export interface OvertimeByLocationRecord {
  location: string;
  department: string;
  staffCount: number;
  totalOvertimeHours: number;
  avgOvertimePerStaff: number;
  overtimeCost: number;
  topOvertimeStaff: string;
  topOvertimeHours: number;
  weekTrend: number[];
}

export const mockOvertimeByLocation: OvertimeByLocationRecord[] = [
  { location: 'Sunshine Centre', department: 'Nursery', staffCount: 4, totalOvertimeHours: 14, avgOvertimePerStaff: 3.5, overtimeCost: 840, topOvertimeStaff: 'Robert Garcia', topOvertimeHours: 8, weekTrend: [2, 3, 2, 4, 3] },
  { location: 'Sunshine Centre', department: 'Toddler', staffCount: 3, totalOvertimeHours: 4, avgOvertimePerStaff: 1.3, overtimeCost: 240, topOvertimeStaff: 'Michael Chen', topOvertimeHours: 4, weekTrend: [0, 1, 1, 1, 1] },
  { location: 'Harbor View', department: 'Preschool', staffCount: 3, totalOvertimeHours: 10, avgOvertimePerStaff: 3.3, overtimeCost: 600, topOvertimeStaff: 'Emily Rodriguez', topOvertimeHours: 6, weekTrend: [1, 2, 3, 2, 2] },
  { location: 'Harbor View', department: 'Kindy', staffCount: 2, totalOvertimeHours: 2, avgOvertimePerStaff: 1.0, overtimeCost: 120, topOvertimeStaff: 'James Wilson', topOvertimeHours: 2, weekTrend: [0, 0, 1, 0, 1] },
  { location: 'Mountain Peak', department: 'Toddler', staffCount: 2, totalOvertimeHours: 6, avgOvertimePerStaff: 3.0, overtimeCost: 360, topOvertimeStaff: 'Aisha Patel', topOvertimeHours: 4, weekTrend: [1, 1, 2, 1, 1] },
  { location: 'Mountain Peak', department: 'Preschool', staffCount: 2, totalOvertimeHours: 0, avgOvertimePerStaff: 0, overtimeCost: 0, topOvertimeStaff: '—', topOvertimeHours: 0, weekTrend: [0, 0, 0, 0, 0] },
];

// Attendance trends
export interface AttendanceTrendRecord {
  date: string;
  location: string;
  totalScheduled: number;
  present: number;
  absent: number;
  late: number;
  attendanceRate: number;
  absenceType: { sick: number; annual: number; personal: number; noShow: number };
}

export const mockAttendanceTrends: AttendanceTrendRecord[] = Array.from({ length: 14 }, (_, i) => {
  const date = format(subDays(today, 13 - i), 'yyyy-MM-dd');
  const loc = ['Sunshine Centre', 'Harbor View', 'Mountain Peak'][i % 3];
  const total = Math.floor(Math.random() * 6) + 10;
  const absent = Math.floor(Math.random() * 3);
  const late = Math.floor(Math.random() * 2);
  const present = total - absent;
  return {
    date,
    location: loc,
    totalScheduled: total,
    present,
    absent,
    late,
    attendanceRate: Math.round((present / total) * 100),
    absenceType: {
      sick: Math.floor(Math.random() * (absent + 1)),
      annual: Math.floor(Math.random() * 2),
      personal: Math.random() > 0.7 ? 1 : 0,
      noShow: Math.random() > 0.8 ? 1 : 0,
    },
  };
});

export const exceptionTypeLabels: Record<ExceptionType, string> = {
  manual_edit: 'Manual Edit',
  manager_override: 'Manager Override',
  time_adjustment: 'Time Adjustment',
  retroactive_entry: 'Retroactive Entry',
  system_correction: 'System Correction',
};

export const approvalStatusLabels: Record<ApprovalStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  escalated: 'Escalated',
  auto_approved: 'Auto-Approved',
};

export const clockStatusLabels: Record<ClockStatus, string> = {
  clocked_in: 'Clocked In',
  on_break: 'On Break',
  clocked_out: 'Clocked Out',
  absent: 'Absent',
  late: 'Late',
  not_started: 'Not Started',
};

// =================== Enrichment: extra fields for richer reports ===================

declare module './mockTimesheetReportData' {}

// Augment records by adding optional enrichment fields via casting
export interface TimesheetApprovalRecord {
  costEstimate?: number;
  exceptionsCount?: number;
  payPeriodStart?: string;
  payPeriodEnd?: string;
  managerNotes?: string;
  priorityLevel?: 'low' | 'medium' | 'high';
}

export interface RealTimeAttendanceRecord {
  shiftDuration?: number;
  shiftCompletionPct?: number;
  expectedCost?: number;
  contactNumber?: string;
  area?: string;
  hoursRemaining?: number;
}

export interface WeeklyTimesheetSummary {
  hourlyRate?: number;
  estimatedGross?: number;
  exceptions?: number;
  submittedAt?: string;
  approverName?: string;
  avgDailyHours?: number;
}

export interface LatePunctualityRecord {
  totalLateMinutes?: number;
  occurrencesThisMonth?: number;
  costImpact?: number;
  actionTaken?: 'none' | 'warned' | 'meeting_scheduled' | 'formal_notice';
  pattern?: 'isolated' | 'recurring' | 'chronic';
}

export interface BreakComplianceRecord {
  hourlyRate?: number;
  potentialLiability?: number;
  shiftStart?: string;
  shiftEnd?: string;
  awardReference?: string;
  riskLevel?: 'low' | 'medium' | 'high';
}

export interface TimesheetExceptionRecord {
  amountImpact?: number;
  approvalRequired?: boolean;
  category?: 'time' | 'rate' | 'allowance' | 'other';
  approverName?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface ApprovalSLARecord {
  pendingApprovals?: number;
  fastestTurnaroundHrs?: number;
  slowestTurnaroundHrs?: number;
  escalations?: number;
  rejectionRate?: number;
}

export interface OvertimeByLocationRecord {
  budgetedOvertimeCost?: number;
  variance?: number;
  variancePercent?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  policyLimit?: number;
}

export interface AttendanceTrendRecord {
  fillRatePct?: number;
  costOfAbsence?: number;
  weekday?: string;
  area?: string;
  forecastVariance?: number;
}

// Enrich data
const _approvers = ['Linda Park', 'Mark Stevens', 'Rachel Adams', 'Tony Nguyen'];
mockApprovalPipeline.forEach((r, i) => {
  r.costEstimate = r.costEstimate ?? Math.round(r.totalHours * 32 + r.overtimeHours * 16);
  r.exceptionsCount = r.exceptionsCount ?? (r.hasExceptions ? 1 + (i % 3) : 0);
  r.payPeriodStart = r.payPeriodStart ?? '2026-04-07';
  r.payPeriodEnd = r.payPeriodEnd ?? '2026-04-13';
  r.managerNotes = r.managerNotes ?? (r.hasExceptions ? 'Review OT and exception fields' : '');
  r.priorityLevel = r.priorityLevel ?? (r.overtimeHours > 4 ? 'high' : r.overtimeHours > 0 ? 'medium' : 'low');
});

const _areas = ['Nursery', 'Toddler', 'Preschool', 'Kindy', 'Kitchen'];
mockRealTimeAttendance.forEach((r, i) => {
  // Parse scheduled times (h:mm AM/PM) into hours
  const parseT = (t: string) => {
    const [time, ap] = t.split(' ');
    const [h, m] = time.split(':').map(Number);
    return (ap === 'PM' && h !== 12 ? h + 12 : ap === 'AM' && h === 12 ? 0 : h) + m / 60;
  };
  const dur = Math.max(0, parseT(r.scheduledEnd) - parseT(r.scheduledStart));
  r.shiftDuration = r.shiftDuration ?? Number(dur.toFixed(1));
  r.shiftCompletionPct = r.shiftCompletionPct ?? (r.currentShiftHours ? Math.min(100, Math.round((r.currentShiftHours / dur) * 100)) : 0);
  r.expectedCost = r.expectedCost ?? Math.round(dur * 34);
  r.contactNumber = r.contactNumber ?? `04${String(20000000 + i * 11119).slice(0, 8)}`;
  r.area = r.area ?? _areas[i % _areas.length];
  r.hoursRemaining = r.hoursRemaining ?? Number(Math.max(0, dur - (r.currentShiftHours ?? 0)).toFixed(1));
});

mockWeeklyTimesheets.forEach((r, i) => {
  r.hourlyRate = r.hourlyRate ?? (28 + (i % 5) * 2);
  r.estimatedGross = r.estimatedGross ?? Math.round(r.regularHours * (r.hourlyRate ?? 32) + r.overtimeHours * (r.hourlyRate ?? 32) * 1.5);
  r.exceptions = r.exceptions ?? (r.overtimeHours > 4 ? 2 : r.totalHours < 30 ? 1 : 0);
  r.submittedAt = r.submittedAt ?? '2026-04-14T08:00';
  r.approverName = r.approverName ?? _approvers[i % _approvers.length];
  r.avgDailyHours = r.avgDailyHours ?? Number((r.totalHours / Math.max(1, r.daysWorked)).toFixed(1));
});

mockLatePunctuality.forEach((r, i) => {
  r.totalLateMinutes = r.totalLateMinutes ?? (r.lateMinutes + r.earlyMinutes);
  r.occurrencesThisMonth = r.occurrencesThisMonth ?? (1 + (i % 5));
  r.costImpact = r.costImpact ?? Math.round(((r.lateMinutes + r.earlyMinutes) / 60) * 32);
  r.actionTaken = r.actionTaken ?? (r.lateMinutes > 20 ? 'warned' : r.lateMinutes > 10 ? 'meeting_scheduled' : 'none');
  r.pattern = r.pattern ?? ((r.occurrencesThisMonth ?? 0) > 4 ? 'chronic' : (r.occurrencesThisMonth ?? 0) > 2 ? 'recurring' : 'isolated');
});

mockBreakCompliance.forEach((r, i) => {
  r.hourlyRate = r.hourlyRate ?? 32;
  r.potentialLiability = r.potentialLiability ?? (r.compliant ? 0 : Math.round(((r.requiredBreakMinutes - r.actualBreakMinutes) / 60) * 32 * 2));
  r.shiftStart = r.shiftStart ?? '7:00 AM';
  r.shiftEnd = r.shiftEnd ?? '3:00 PM';
  r.awardReference = r.awardReference ?? 'MA000120';
  r.riskLevel = r.riskLevel ?? (r.compliant ? 'low' : r.actualBreakMinutes === 0 ? 'high' : 'medium');
});

mockTimesheetExceptions.forEach((r, i) => {
  r.amountImpact = r.amountImpact ?? (i % 2 === 0 ? 25 + i * 8 : -10 - i * 3);
  r.approvalRequired = r.approvalRequired ?? (r.exceptionType === 'manager_override' || r.exceptionType === 'retroactive_entry');
  r.category = r.category ?? (r.field.includes('time') || r.field.includes('Clock') ? 'time' : r.field.includes('rate') ? 'rate' : 'other');
  r.approverName = r.approverName ?? _approvers[i % _approvers.length];
  r.status = r.status ?? (r.editedBy === 'System' ? 'approved' : i % 3 === 0 ? 'pending' : 'approved');
});

mockApprovalSLA.forEach((r, i) => {
  r.pendingApprovals = r.pendingApprovals ?? Math.max(0, r.totalApprovals - r.withinSLA - r.breachedSLA + (i % 3));
  r.fastestTurnaroundHrs = r.fastestTurnaroundHrs ?? Math.max(0.5, r.avgTurnaroundHours - 4 - i);
  r.slowestTurnaroundHrs = r.slowestTurnaroundHrs ?? r.avgTurnaroundHours + 8 + i * 2;
  r.escalations = r.escalations ?? Math.round(r.breachedSLA * 0.5);
  r.rejectionRate = r.rejectionRate ?? Math.round((i + 1) * 3.5);
});

mockOvertimeByLocation.forEach((r, i) => {
  r.budgetedOvertimeCost = r.budgetedOvertimeCost ?? Math.round(r.overtimeCost * 0.8 + 200);
  r.variance = r.variance ?? r.overtimeCost - (r.budgetedOvertimeCost ?? 0);
  r.variancePercent = r.variancePercent ?? Math.round((r.variance / Math.max(1, r.budgetedOvertimeCost ?? 1)) * 100);
  r.riskLevel = r.riskLevel ?? (r.totalOvertimeHours > 12 ? 'critical' : r.totalOvertimeHours > 6 ? 'high' : r.totalOvertimeHours > 2 ? 'medium' : 'low');
  r.policyLimit = r.policyLimit ?? 10;
});

const _weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
mockAttendanceTrends.forEach((r, i) => {
  r.fillRatePct = r.fillRatePct ?? Math.round(((r.totalScheduled - r.absent) / r.totalScheduled) * 100);
  r.costOfAbsence = r.costOfAbsence ?? r.absent * 8 * 32;
  const d = new Date(r.date);
  r.weekday = r.weekday ?? _weekdays[(d.getDay() + 6) % 7];
  r.area = r.area ?? _areas[i % _areas.length];
  r.forecastVariance = r.forecastVariance ?? (Math.round((Math.random() - 0.5) * 6));
});


// =================== Sparkline trends (last 8 periods) ===================

export interface WeeklyTimesheetSummary {
  totalHoursTrend?: number[];
  overtimeTrend?: number[];
}
export interface OvertimeByLocationRecord {
  overtimeHoursTrend?: number[];
  overtimeCostTrend?: number[];
}
export interface AttendanceTrendRecord {
  attendanceRateTrend?: number[];
}
export interface LatePunctualityRecord {
  lateMinutesTrend?: number[];
}
export interface BreakComplianceRecord {
  complianceRateTrend?: number[];
}
export interface ApprovalSLARecord {
  slaComplianceTrend?: number[];
}

function _seedTrend(seed: number, base: number, variance: number, len = 8, drift = 0): number[] {
  // Deterministic pseudo-random based on seed
  const out: number[] = [];
  let x = seed * 9301 + 49297;
  for (let i = 0; i < len; i++) {
    x = (x * 9301 + 49297) % 233280;
    const r = (x / 233280) - 0.5;
    out.push(Math.max(0, Math.round((base + r * variance + drift * i) * 10) / 10));
  }
  return out;
}

mockWeeklyTimesheets.forEach((r, i) => {
  r.totalHoursTrend = r.totalHoursTrend ?? _seedTrend(i + 1, r.totalHours, 6, 8, -0.1);
  r.overtimeTrend = r.overtimeTrend ?? _seedTrend(i + 7, Math.max(1, r.overtimeHours), 3, 8, 0.2);
});

mockOvertimeByLocation.forEach((r, i) => {
  r.overtimeHoursTrend = r.overtimeHoursTrend ?? _seedTrend(i + 11, r.totalOvertimeHours, 4, 8, 0.3);
  r.overtimeCostTrend = r.overtimeCostTrend ?? _seedTrend(i + 13, r.overtimeCost, 250, 8, 25);
});

mockAttendanceTrends.forEach((r, i) => {
  const rate = ((r.totalScheduled - r.absent) / r.totalScheduled) * 100;
  r.attendanceRateTrend = r.attendanceRateTrend ?? _seedTrend(i + 3, rate, 6, 8, 0.4);
});

mockLatePunctuality.forEach((r, i) => {
  r.lateMinutesTrend = r.lateMinutesTrend ?? _seedTrend(i + 17, r.lateMinutes, 8, 8, -0.5);
});

mockBreakCompliance.forEach((r, i) => {
  const base = r.compliant ? 92 : 70;
  r.complianceRateTrend = r.complianceRateTrend ?? _seedTrend(i + 19, base, 8, 8, r.compliant ? 0.3 : -0.4);
});

mockApprovalSLA.forEach((r, i) => {
  const base = (r.withinSLA / Math.max(1, r.totalApprovals)) * 100;
  r.slaComplianceTrend = r.slaComplianceTrend ?? _seedTrend(i + 23, base, 5, 8, 0.2);
});

// --- Additional sparkline trends ---
export interface TimesheetExceptionRecord {
  frequencyTrend?: number[];
}

mockTimesheetExceptions.forEach((r, i) => {
  r.frequencyTrend = r.frequencyTrend ?? _seedTrend(i + 199, 2 + (i % 3), 1.5, 8, 0.1);
});
