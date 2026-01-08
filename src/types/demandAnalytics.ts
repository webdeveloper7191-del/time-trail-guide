export interface DemandAnalyticsData {
  date: string;
  centreId: string;
  roomId: string;
  timeSlot: string;
  
  // Booking data
  bookedChildren: number;
  confirmedBookings: number;
  casualBookings: number;
  
  // Historical attendance
  historicalAttendance: number;
  attendanceRate: number; // percentage of booked that actually attended
  
  // Capacity and ratios
  capacity: number;
  utilisationPercent: number;
  requiredStaff: number;
  scheduledStaff: number;
  staffRatioCompliant: boolean;
  
  // Absences
  staffAbsences: StaffAbsence[];
  childAbsences: number;
}

export interface StaffAbsence {
  staffId: string;
  staffName: string;
  type: 'sick' | 'annual' | 'personal' | 'other';
  date: string;
  centreId: string;
  roomId?: string;
}

export interface DemandChartConfig {
  showBookings: boolean;
  showAttendance: boolean;
  showRatios: boolean;
  showAbsences: boolean;
}
