/**
 * Demand Integration Data Formats
 * 
 * These interfaces define the expected data formats for external systems
 * to integrate booking, attendance, and room data with the roster optimization engine.
 * 
 * INDUSTRY: Childcare (initial implementation)
 * COMPLIANCE: Australian NQF ratios
 * 
 * Data can be provided via:
 * - API endpoints (JSON)
 * - CSV/Excel file imports
 * - Direct database integration
 */

// ============= AGE GROUP DEFINITIONS =============

/**
 * Childcare-specific age groups aligned with NQF requirements
 */
export type ChildcareAgeGroup = 'babies' | 'toddlers' | 'preschool' | 'kindy';

export interface AgeGroupDefinition {
  id: ChildcareAgeGroup;
  label: string;
  minAgeMonths: number;
  maxAgeMonths: number;
  nqfRatio: number; // Staff-to-child ratio (e.g., 4 = 1:4)
  qualificationRequired: 'diploma_ece' | 'certificate_iii' | 'certificate_iv';
}

export const CHILDCARE_AGE_GROUPS: AgeGroupDefinition[] = [
  { id: 'babies', label: 'Babies (0-2 years)', minAgeMonths: 0, maxAgeMonths: 24, nqfRatio: 4, qualificationRequired: 'diploma_ece' },
  { id: 'toddlers', label: 'Toddlers (2-3 years)', minAgeMonths: 24, maxAgeMonths: 36, nqfRatio: 5, qualificationRequired: 'certificate_iii' },
  { id: 'preschool', label: 'Preschool (3-4 years)', minAgeMonths: 36, maxAgeMonths: 48, nqfRatio: 10, qualificationRequired: 'certificate_iii' },
  { id: 'kindy', label: 'Kindergarten (4-5 years)', minAgeMonths: 48, maxAgeMonths: 72, nqfRatio: 11, qualificationRequired: 'certificate_iii' },
];

// ============= ROOM DATA FORMAT =============

/**
 * Room configuration data required for roster optimization
 * 
 * CSV Header: room_id,room_name,centre_id,age_group,capacity,operating_start,operating_end,min_qualified_staff
 */
export interface RoomDataImport {
  /** Unique identifier for the room */
  roomId: string;
  
  /** Display name (e.g., "Joeys", "Possums") */
  roomName: string;
  
  /** Parent centre identifier */
  centreId: string;
  
  /** Age group served by this room */
  ageGroup: ChildcareAgeGroup;
  
  /** Maximum licensed capacity */
  capacity: number;
  
  /** Room-specific operating hours (optional, defaults to centre hours) */
  operatingHours?: {
    start: string; // HH:mm format (e.g., "06:30")
    end: string;   // HH:mm format (e.g., "18:30")
  };
  
  /** Minimum qualified staff required at all times */
  minQualifiedStaff: number;
  
  /** Optional color for UI display */
  color?: string;
}

// ============= BOOKINGS DATA FORMAT =============

/**
 * Child booking data by age group and time slot
 * This is the PRIMARY input for demand-based roster optimization
 * 
 * CSV Header: date,centre_id,room_id,child_id,child_name,age_months,booking_type,start_time,end_time,status
 */
export interface ChildBookingImport {
  /** Booking date (YYYY-MM-DD) */
  date: string;
  
  /** Centre identifier */
  centreId: string;
  
  /** Room identifier */
  roomId: string;
  
  /** Unique child identifier */
  childId: string;
  
  /** Child's display name (optional, for reporting) */
  childName?: string;
  
  /** Child's age in months (used to validate room placement) */
  ageMonths: number;
  
  /** Type of booking */
  bookingType: 'permanent' | 'casual' | 'makeup' | 'extra';
  
  /** Booked arrival time (HH:mm) */
  startTime: string;
  
  /** Booked departure time (HH:mm) */
  endTime: string;
  
  /** Current booking status */
  status: 'confirmed' | 'pending' | 'cancelled' | 'waitlist';
  
  /** Parent/guardian contact (optional, for emergency) */
  guardianContact?: string;
  
  /** Special requirements or notes */
  notes?: string;
}

/**
 * Aggregated booking summary by time slot
 * Used for quick demand visualization and staffing calculations
 * 
 * CSV Header: date,centre_id,room_id,time_slot_start,time_slot_end,booked_count,confirmed_count,casual_count,capacity,utilisation_percent
 */
export interface BookingSummaryImport {
  /** Date (YYYY-MM-DD) */
  date: string;
  
  /** Centre identifier */
  centreId: string;
  
  /** Room identifier */
  roomId: string;
  
  /** Time slot start (HH:mm) */
  timeSlotStart: string;
  
  /** Time slot end (HH:mm) */
  timeSlotEnd: string;
  
  /** Total booked children for this slot */
  bookedCount: number;
  
  /** Confirmed permanent bookings */
  confirmedCount: number;
  
  /** Casual/one-off bookings */
  casualCount: number;
  
  /** Room capacity */
  capacity: number;
  
  /** Calculated utilisation percentage */
  utilisationPercent: number;
}

// ============= HISTORICAL ATTENDANCE DATA =============

/**
 * Historical attendance records for trend analysis
 * Used to predict actual attendance vs bookings
 * 
 * CSV Header: date,centre_id,room_id,time_slot,booked_children,attended_children,absent_children,late_arrivals,early_departures
 */
export interface HistoricalAttendanceImport {
  /** Date (YYYY-MM-DD) */
  date: string;
  
  /** Centre identifier */
  centreId: string;
  
  /** Room identifier */
  roomId: string;
  
  /** Time slot identifier (e.g., "09:00-12:00" or "AM"/"PM") */
  timeSlot: string;
  
  /** Number of children booked */
  bookedChildren: number;
  
  /** Number of children who actually attended */
  attendedChildren: number;
  
  /** Number of children absent (booked - attended) */
  absentChildren: number;
  
  /** Number who arrived after their booked start time */
  lateArrivals: number;
  
  /** Number who departed before their booked end time */
  earlyDepartures: number;
  
  /** Calculated attendance rate (attendedChildren / bookedChildren * 100) */
  attendanceRate: number;
  
  /** Day of week for pattern analysis (0=Sunday, 1=Monday, etc.) */
  dayOfWeek: number;
  
  /** Week number for seasonal analysis */
  weekNumber: number;
  
  /** Is this a school holiday period? */
  isSchoolHoliday: boolean;
  
  /** Is this a public holiday? */
  isPublicHoliday: boolean;
}

/**
 * Aggregated historical patterns for forecasting
 */
export interface AttendancePattern {
  /** Room identifier */
  roomId: string;
  
  /** Day of week (0-6) */
  dayOfWeek: number;
  
  /** Time slot */
  timeSlot: string;
  
  /** Average attendance rate over period */
  avgAttendanceRate: number;
  
  /** Standard deviation for variance */
  stdDeviation: number;
  
  /** Sample size (number of data points) */
  sampleSize: number;
  
  /** Trend direction */
  trend: 'increasing' | 'stable' | 'decreasing';
}

// ============= TODAY'S ATTENDANCE DATA =============

/**
 * Real-time attendance tracking for today
 * Used for live ratio monitoring and alerts
 * 
 * CSV Header: timestamp,centre_id,room_id,child_id,event_type,actual_time,booked_time,recorded_by
 */
export interface TodayAttendanceEvent {
  /** Event timestamp (ISO 8601) */
  timestamp: string;
  
  /** Centre identifier */
  centreId: string;
  
  /** Room identifier */
  roomId: string;
  
  /** Child identifier */
  childId: string;
  
  /** Type of attendance event */
  eventType: 'sign_in' | 'sign_out' | 'room_transfer' | 'absent_notified' | 'late_arrival';
  
  /** Actual time of event (HH:mm) */
  actualTime: string;
  
  /** Originally booked time (HH:mm) */
  bookedTime: string;
  
  /** Staff member who recorded the event */
  recordedBy?: string;
  
  /** For room transfers: destination room */
  transferToRoomId?: string;
  
  /** Notes (e.g., reason for absence) */
  notes?: string;
}

/**
 * Real-time room occupancy snapshot
 * Used for live dashboard and ratio alerts
 */
export interface RoomOccupancySnapshot {
  /** Snapshot timestamp (ISO 8601) */
  timestamp: string;
  
  /** Centre identifier */
  centreId: string;
  
  /** Room identifier */
  roomId: string;
  
  /** Room name */
  roomName: string;
  
  /** Age group */
  ageGroup: ChildcareAgeGroup;
  
  /** Current children present */
  currentOccupancy: number;
  
  /** Room capacity */
  capacity: number;
  
  /** Expected arrivals remaining today */
  expectedArrivals: number;
  
  /** Expected departures remaining today */
  expectedDepartures: number;
  
  /** Booked for today (total) */
  bookedToday: number;
  
  /** Already signed in today */
  signedInToday: number;
  
  /** Already signed out today */
  signedOutToday: number;
  
  /** Marked absent today */
  absentToday: number;
  
  /** Current staff count in room */
  currentStaff: number;
  
  /** Required staff based on NQF ratio */
  requiredStaff: number;
  
  /** Is ratio currently compliant? */
  ratioCompliant: boolean;
  
  /** Staff-to-child ratio (e.g., "1:4") */
  currentRatio: string;
}

// ============= IMPORT VALIDATION =============

export interface ImportValidationResult {
  isValid: boolean;
  totalRows: number;
  validRows: number;
  errorRows: number;
  warnings: ImportWarning[];
  errors: ImportError[];
}

export interface ImportWarning {
  row: number;
  field: string;
  message: string;
  value: string;
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
  value: string;
  severity: 'error' | 'critical';
}

// ============= API REQUEST/RESPONSE FORMATS =============

/**
 * Bulk booking import request
 */
export interface BulkBookingImportRequest {
  /** Import source identifier */
  sourceSystem: string;
  
  /** Import timestamp */
  importedAt: string;
  
  /** Date range for bookings */
  dateRange: {
    startDate: string;
    endDate: string;
  };
  
  /** Booking data */
  bookings: ChildBookingImport[];
  
  /** Should existing bookings be replaced? */
  replaceExisting: boolean;
}

/**
 * Historical attendance import request
 */
export interface HistoricalAttendanceImportRequest {
  /** Import source */
  sourceSystem: string;
  
  /** Date range */
  dateRange: {
    startDate: string;
    endDate: string;
  };
  
  /** Attendance records */
  records: HistoricalAttendanceImport[];
}

/**
 * Today's attendance sync request (real-time)
 */
export interface TodayAttendanceSyncRequest {
  /** Centre identifier */
  centreId: string;
  
  /** Sync timestamp */
  syncedAt: string;
  
  /** Events since last sync */
  events: TodayAttendanceEvent[];
  
  /** Current room snapshots */
  roomSnapshots: RoomOccupancySnapshot[];
}

// ============= DEMAND OPTIMIZATION OUTPUT =============

/**
 * Recommended staffing based on demand analysis
 */
export interface DemandBasedStaffingRecommendation {
  date: string;
  centreId: string;
  roomId: string;
  timeSlot: string;
  
  /** Predicted attendance based on bookings + historical patterns */
  predictedAttendance: number;
  
  /** Confidence level (0-100) */
  confidenceLevel: number;
  
  /** Minimum staff required (NQF compliance) */
  minStaffRequired: number;
  
  /** Recommended staff (including buffer) */
  recommendedStaff: number;
  
  /** Currently scheduled staff */
  scheduledStaff: number;
  
  /** Staffing gap (positive = understaffed, negative = overstaffed) */
  staffingGap: number;
  
  /** Risk level */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  /** Action recommendation */
  recommendation: string;
  
  /** Factors influencing prediction */
  factors: {
    name: string;
    impact: number;
    description: string;
  }[];
}

// ============= CSV TEMPLATES =============

/**
 * CSV column mappings for file imports
 */
export const CSV_TEMPLATES = {
  rooms: {
    headers: ['room_id', 'room_name', 'centre_id', 'age_group', 'capacity', 'operating_start', 'operating_end', 'min_qualified_staff'],
    example: 'room-1a,Joeys,centre-1,babies,12,06:30,18:30,2',
    description: 'Room configuration data'
  },
  
  bookings: {
    headers: ['date', 'centre_id', 'room_id', 'child_id', 'child_name', 'age_months', 'booking_type', 'start_time', 'end_time', 'status'],
    example: '2024-03-15,centre-1,room-1a,child-001,Emma Smith,18,permanent,07:30,17:30,confirmed',
    description: 'Individual child booking records'
  },
  
  bookingSummary: {
    headers: ['date', 'centre_id', 'room_id', 'time_slot_start', 'time_slot_end', 'booked_count', 'confirmed_count', 'casual_count', 'capacity', 'utilisation_percent'],
    example: '2024-03-15,centre-1,room-1a,09:00,12:00,10,8,2,12,83',
    description: 'Aggregated booking summary by time slot'
  },
  
  historicalAttendance: {
    headers: ['date', 'centre_id', 'room_id', 'time_slot', 'booked_children', 'attended_children', 'absent_children', 'late_arrivals', 'early_departures', 'attendance_rate', 'day_of_week', 'week_number', 'is_school_holiday', 'is_public_holiday'],
    example: '2024-03-14,centre-1,room-1a,09:00-12:00,10,9,1,2,1,90,4,11,false,false',
    description: 'Historical attendance records for trend analysis'
  },
  
  todayAttendance: {
    headers: ['timestamp', 'centre_id', 'room_id', 'child_id', 'event_type', 'actual_time', 'booked_time', 'recorded_by', 'notes'],
    example: '2024-03-15T07:45:00Z,centre-1,room-1a,child-001,sign_in,07:45,07:30,Sarah Johnson,',
    description: 'Real-time attendance events'
  }
};

// ============= VALIDATION SCHEMAS =============

export const VALIDATION_RULES = {
  ageGroup: {
    validValues: ['babies', 'toddlers', 'preschool', 'kindy'],
    message: 'Age group must be one of: babies, toddlers, preschool, kindy'
  },
  
  bookingType: {
    validValues: ['permanent', 'casual', 'makeup', 'extra'],
    message: 'Booking type must be one of: permanent, casual, makeup, extra'
  },
  
  bookingStatus: {
    validValues: ['confirmed', 'pending', 'cancelled', 'waitlist'],
    message: 'Status must be one of: confirmed, pending, cancelled, waitlist'
  },
  
  eventType: {
    validValues: ['sign_in', 'sign_out', 'room_transfer', 'absent_notified', 'late_arrival'],
    message: 'Event type must be one of: sign_in, sign_out, room_transfer, absent_notified, late_arrival'
  },
  
  timeFormat: {
    pattern: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
    message: 'Time must be in HH:mm format (e.g., 07:30)'
  },
  
  dateFormat: {
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    message: 'Date must be in YYYY-MM-DD format'
  },
  
  ageMonths: {
    min: 0,
    max: 72,
    message: 'Age must be between 0 and 72 months'
  },
  
  capacity: {
    min: 1,
    max: 50,
    message: 'Capacity must be between 1 and 50'
  }
};
