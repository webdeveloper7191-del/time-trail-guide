/**
 * Types for demand-driven shift generation system.
 * Converts 15-minute interval demand data + room ratios into optimized open shifts.
 */

export interface DemandInterval {
  time: string;          // HH:mm format
  minuteOfDay: number;   // 0–1439
  bookedChildren: number;
  predictedAttendance: number;
  requiredStaff: number;
  scheduledStaff: number;
  surplus: number;       // scheduledStaff - requiredStaff
}

export interface RoomDemandProfile {
  roomId: string;
  roomName: string;
  centreId: string;
  date: string;
  ageGroup: string;
  capacity: number;
  requiredRatio: number; // children per educator
  intervals: DemandInterval[];
}

export interface ShiftEnvelope {
  id: string;
  roomId: string;
  roomName: string;
  centreId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  breakMinutes: number;
  requiredStaff: number;     // peak required during this envelope
  averageDemand: number;     // avg children during envelope
  peakDemand: number;        // max children during envelope
  priority: 'critical' | 'high' | 'normal' | 'low';
  source: 'demand-engine';
  color: string;             // for visual display
}

export interface DemandShiftConfig {
  /** Operating hours */
  operatingStart: string;    // HH:mm, default "06:00"
  operatingEnd: string;      // HH:mm, default "18:00"
  /** Minimum generated shift duration in minutes */
  minShiftMinutes: number;   // default 240 (4 hours)
  /** Maximum generated shift duration in minutes */
  maxShiftMinutes: number;   // default 600 (10 hours)
  /** Overlap buffer between adjacent shifts in minutes */
  overlapBufferMinutes: number; // default 15
  /** How to round staff requirements */
  roundingStrategy: 'ceiling' | 'predicted';
  /** Historical attendance rate override (0-1), null = use per-slot data */
  attendanceRateOverride: number | null;
  /** Optimization goal */
  optimizationGoal: 'compliance' | 'cost' | 'balanced';
}

export const DEFAULT_DEMAND_SHIFT_CONFIG: DemandShiftConfig = {
  operatingStart: '06:00',
  operatingEnd: '18:00',
  minShiftMinutes: 240,
  maxShiftMinutes: 600,
  overlapBufferMinutes: 15,
  roundingStrategy: 'ceiling',
  attendanceRateOverride: null,
  optimizationGoal: 'balanced',
};

export interface DemandShiftGenerationResult {
  roomProfiles: RoomDemandProfile[];
  shiftEnvelopes: ShiftEnvelope[];
  summary: {
    totalShifts: number;
    totalHours: number;
    roomBreakdown: { roomId: string; roomName: string; shifts: number; hours: number }[];
    peakStaffRequired: number;
    averageStaffRequired: number;
    coverageGaps: { roomId: string; time: string; deficit: number }[];
  };
}
