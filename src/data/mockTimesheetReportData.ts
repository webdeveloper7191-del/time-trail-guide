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
