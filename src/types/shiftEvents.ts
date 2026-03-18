// Unified event types for specialized shift workflows

export interface SleepoverEvent {
  id: string;
  shiftId: string;
  staffId: string;
  staffName: string;
  centreId: string;
  date: string;
  // Check-in/out
  checkInTime: string;
  checkOutTime: string;
  // Disturbances
  disturbances: SleepoverDisturbance[];
  totalDisturbanceMinutes: number;
  overtimeTriggered: boolean;
  overtimeMinutes: number;
  // Environment
  environmentNotes?: string;
  childWelfareChecks: number;
  // Pay
  flatRate: number;
  overtimePay: number;
  totalPay: number;
  // Meta
  status: 'logged' | 'approved' | 'rejected' | 'paid';
  loggedBy: string;
  loggedAt: string;
  notes?: string;
}

export interface SleepoverDisturbance {
  id: string;
  time: string;
  durationMinutes: number;
  reason: string;
  actionTaken: string;
  emergencyServicesContacted: boolean;
}

export interface SplitShiftEvent {
  id: string;
  shiftId: string;
  staffId: string;
  staffName: string;
  centreId: string;
  date: string;
  // Segments
  segments: SplitShiftSegment[];
  gapMinutes: number;
  gapCompliant: boolean;
  // Allowance
  splitShiftAllowance: number;
  baseRate: number;
  totalSegmentPay: number;
  totalPay: number;
  // Meta
  status: 'logged' | 'approved' | 'rejected' | 'paid';
  loggedBy: string;
  loggedAt: string;
  notes?: string;
}

export interface SplitShiftSegment {
  id: string;
  segmentNumber: number;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  workedMinutes: number;
  roomId?: string;
  roomName?: string;
}
