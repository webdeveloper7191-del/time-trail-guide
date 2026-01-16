export type ViewMode = 'day' | 'week' | 'fortnight' | 'month';

export type EmploymentType = 'permanent' | 'casual';

export type AgencyType = 'anzuk' | 'randstad' | 'quickcare' | 'hays' | 'internal';

export type QualificationType = 
  | 'diploma_ece' 
  | 'certificate_iii' 
  | 'first_aid' 
  | 'food_safety' 
  | 'working_with_children'
  | 'bachelor_ece'
  | 'masters_ece';

export interface Qualification {
  type: QualificationType;
  name: string;
  expiryDate?: string;
  isExpired?: boolean;
  isExpiringSoon?: boolean;
}

export interface TimeOff {
  id: string;
  staffId: string;
  startDate: string;
  endDate: string;
  type: 'annual_leave' | 'sick_leave' | 'personal_leave' | 'unpaid_leave';
  status: 'approved' | 'pending' | 'rejected';
  notes?: string;
}

export interface ShiftTemplate {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  color: string;
  
  // Special shift type configuration
  shiftType?: ShiftSpecialType;
  
  // Qualification and classification requirements
  requiredQualifications?: QualificationType[];
  minimumClassification?: string; // e.g. "Level 3.1", "Level 4.2"
  preferredRole?: StaffMember['role'];
  
  // On-call template settings
  onCallSettings?: {
    defaultStartTime?: string;
    defaultEndTime?: string;
    // Pay configuration
    standbyRate?: number;
    standbyRateType?: 'per_period' | 'per_hour' | 'daily';
    callbackMinimumHours?: number;
    callbackRateMultiplier?: number;
    weekendStandbyRate?: number;
    publicHolidayStandbyMultiplier?: number;
  };
  
  // Sleepover template settings
  sleepoverSettings?: {
    bedtimeStart?: string;
    bedtimeEnd?: string;
    // Pay configuration
    flatRate?: number;
    disturbanceRatePerHour?: number;
    disturbanceMinimumHours?: number;
    disturbanceRateMultiplier?: number;
    weekendFlatRate?: number;
    publicHolidayFlatRate?: number;
  };
  
  // Broken/split shift settings
  brokenShiftSettings?: {
    firstShiftEnd?: string;
    secondShiftStart?: string;
    unpaidGapMinutes?: number;
    // Pay configuration
    allowanceRate?: number;
    minimumGapMinutes?: number;
    maximumGapMinutes?: number;
    gapBonusRate?: number;
  };
  
  // Higher duties preset
  higherDutiesClassification?: string;
  
  // Travel/remote defaults
  isRemoteLocation?: boolean;
  defaultTravelKilometres?: number;
  
  // Selected allowances from the allowance dropdown
  selectedAllowances?: string[];
}

export interface SchedulingPreferences {
  preferredRooms: string[];
  avoidRooms: string[];
  maxConsecutiveDays: number;
  minRestHoursBetweenShifts: number;
  preferEarlyShifts: boolean;
  preferLateShifts: boolean;
  maxShiftsPerWeek: number;
  notifyOnPublish: boolean;
  notifyOnSwap: boolean;
  notifyOnOpenShifts: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  avatar?: string;
  role: 'lead_educator' | 'educator' | 'assistant' | 'cook' | 'admin';
  employmentType: EmploymentType;
  agency?: AgencyType;
  qualifications: Qualification[];
  hourlyRate: number;
  overtimeRate: number;
  maxHoursPerWeek: number;
  currentWeeklyHours: number;
  preferredCentres: string[];
  availability: DayAvailability[];
  color: string;
  timeOff?: TimeOff[];
  email?: string;
  phone?: string;
  schedulingPreferences?: SchedulingPreferences;
  
  // Cross-location scheduling fields
  defaultCentreId?: string; // Primary/home location
  willingToWorkMultipleLocations?: boolean; // Indicates flexibility
  maxTravelDistanceKm?: number; // Maximum travel distance willing to travel
  crossLocationNotes?: string; // Notes about location preferences
}

export type ShiftConflictType = 
  | 'overlap'
  | 'outside_availability'
  | 'overtime_exceeded'
  | 'insufficient_rest'
  | 'max_consecutive_days'
  | 'on_leave'
  | 'qualification_missing'
  | 'preferred_room_violated';

export interface ShiftConflict {
  id: string;
  type: ShiftConflictType;
  severity: 'warning' | 'error';
  shiftId: string;
  staffId: string;
  message: string;
  details?: string;
  canOverride: boolean;
}

export interface ShiftNotification {
  id: string;
  type: 'shift_published' | 'shift_swapped' | 'open_shift_available' | 'shift_reminder' | 'leave_approved' | 'leave_rejected';
  recipientId: string;
  recipientName: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  sentVia: ('email' | 'sms' | 'push')[];
}

export interface DayAvailability {
  dayOfWeek: number; // 0-6, Sunday-Saturday
  available: boolean;
  startTime?: string;
  endTime?: string;
}

export interface Centre {
  id: string;
  name: string;
  code: string;
  rooms: Room[];
  address: string;
  operatingHours: { start: string; end: string };
}

export interface Room {
  id: string;
  name: string;
  centreId: string;
  ageGroup: 'nursery' | 'toddler' | 'preschool' | 'kindy';
  capacity: number;
  requiredRatio: number; // children per educator
  minQualifiedStaff: number;
  color?: string; // Color for room header border/accent
}

// Special shift types that trigger allowances
export type ShiftSpecialType = 
  | 'regular'
  | 'on_call'        // Available but not working - triggers on-call allowance
  | 'sleepover'      // Overnight at facility - triggers sleepover allowance
  | 'broken'         // Split shift with unpaid break >1hr - triggers broken shift allowance
  | 'recall'         // Called back during on-call - triggers recall rates
  | 'emergency';     // Emergency call-out - may trigger additional penalties

export interface Shift {
  id: string;
  staffId: string;
  centreId: string;
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  status: 'draft' | 'published' | 'confirmed' | 'completed';
  isOpenShift: boolean;
  notes?: string;
  
  // Absence tracking
  isAbsent?: boolean;
  absenceReason?: 'leave' | 'sick' | 'no_show' | 'other';
  replacementStaffId?: string; // Staff who covered this shift
  
  // AI/Solver generated indicator
  isAIGenerated?: boolean;
  aiGeneratedAt?: string; // ISO timestamp when AI created this assignment
  
  // Special shift flags for allowance calculation
  shiftType?: ShiftSpecialType;
  
  // On-call specific fields
  onCallDetails?: {
    startTime: string;       // On-call period start
    endTime: string;         // On-call period end
    wasRecalled: boolean;    // Whether staff was called in
    recallTime?: string;     // Time recalled
    recallDuration?: number; // Minutes worked after recall
  };
  
  // Sleepover specific fields
  sleepoverDetails?: {
    bedtimeStart: string;    // When sleepover period begins (e.g., 22:00)
    bedtimeEnd: string;      // When sleepover period ends (e.g., 06:00)
    wasDisturbed: boolean;   // If woken during sleepover (triggers additional pay)
    disturbanceMinutes?: number; // How long disturbance lasted
  };
  
  // Split/broken shift fields
  brokenShiftDetails?: {
    firstShiftEnd: string;   // When first portion ends
    secondShiftStart: string; // When second portion starts
    unpaidGapMinutes: number; // Duration of unpaid gap
  };
  
  // Higher duties during this shift
  higherDuties?: {
    classification: string;  // The higher classification performed
    durationMinutes?: number; // If only part of shift
  };
  
  // Travel/remote work
  isRemoteLocation?: boolean;
  travelKilometres?: number;
}

export interface OpenShift {
  id: string;
  centreId: string;
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  requiredQualifications: QualificationType[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  applicants: string[]; // staff IDs who applied
  
  // Fields from ShiftTemplate
  breakMinutes?: number;
  shiftType?: ShiftSpecialType;
  minimumClassification?: string;
  preferredRole?: StaffMember['role'];
  templateId?: string; // Reference to the template used
  selectedAllowances?: string[];
  
  // On-call settings
  onCallSettings?: {
    standbyRate?: number;
    standbyRateType?: 'per_period' | 'per_hour' | 'daily';
    callbackMinimumHours?: number;
    callbackRateMultiplier?: number;
  };
  
  // Sleepover settings
  sleepoverSettings?: {
    bedtimeStart?: string;
    bedtimeEnd?: string;
    flatRate?: number;
    disturbanceRatePerHour?: number;
  };
  
  // Broken shift settings
  brokenShiftSettings?: {
    firstShiftEnd?: string;
    secondShiftStart?: string;
    unpaidGapMinutes?: number;
    allowanceRate?: number;
  };
  
  // Higher duties
  higherDutiesClassification?: string;
  
  // Travel/remote
  isRemoteLocation?: boolean;
  defaultTravelKilometres?: number;
  
  notes?: string;
}

export type ComplianceFlagType = 
  | 'ratio_breach'
  | 'qualification_gap'
  | 'overtime_warning'
  | 'break_violation'
  | 'understaffed'
  | 'certificate_expiring'
  | 'no_first_aid';

export interface RosterComplianceFlag {
  id: string;
  type: ComplianceFlagType;
  severity: 'info' | 'warning' | 'critical';
  centreId: string;
  roomId?: string;
  date: string;
  timeSlot?: string;
  message: string;
  affectedStaff?: string[];
}

export interface DemandData {
  date: string;
  centreId: string;
  roomId: string;
  timeSlot: string;
  bookedChildren: number;
  projectedChildren: number;
  historicalAttendance: number;
  utilisationPercent: number;
}

export interface RosterCostSummary {
  regularHours: number;
  overtimeHours: number;
  regularCost: number;
  overtimeCost: number;
  totalCost: number;
  costPerChild: number;
  budgetVariance: number;
}

export interface RosterState {
  shifts: Shift[];
  openShifts: OpenShift[];
  complianceFlags: RosterComplianceFlag[];
  demandData: DemandData[];
  costSummary: RosterCostSummary;
  isDirty: boolean;
  lastPublished?: string;
}

// Utility functions
export const qualificationLabels: Record<QualificationType, string> = {
  diploma_ece: 'Diploma ECE',
  certificate_iii: 'Certificate III',
  first_aid: 'First Aid',
  food_safety: 'Food Safety',
  working_with_children: 'WWC Check',
  bachelor_ece: 'Bachelor ECE',
  masters_ece: 'Masters ECE',
};

export const roleLabels: Record<StaffMember['role'], string> = {
  lead_educator: 'Lead Educator',
  educator: 'Educator',
  assistant: 'Assistant',
  cook: 'Cook',
  admin: 'Admin',
};

export const ageGroupLabels: Record<Room['ageGroup'], string> = {
  nursery: 'Nursery (0-2)',
  toddler: 'Toddler (2-3)',
  preschool: 'Preschool (3-4)',
  kindy: 'Kindy (4-5)',
};

export const ageGroupRatios: Record<Room['ageGroup'], number> = {
  nursery: 4,
  toddler: 5,
  preschool: 10,
  kindy: 11,
};

export const employmentTypeLabels: Record<EmploymentType, string> = {
  permanent: 'Permanent',
  casual: 'Casual',
};

export const agencyLabels: Record<AgencyType, string> = {
  anzuk: 'Anzuk',
  randstad: 'Randstad',
  quickcare: 'Quick Care',
  hays: 'Hays',
  internal: 'Internal',
};

export const agencyColors: Record<AgencyType, string> = {
  anzuk: 'hsl(220, 70%, 50%)',
  randstad: 'hsl(340, 75%, 50%)',
  quickcare: 'hsl(150, 65%, 40%)',
  hays: 'hsl(30, 80%, 50%)',
  internal: 'hsl(0, 0%, 50%)',
};

export const timeOffTypeLabels: Record<TimeOff['type'], string> = {
  annual_leave: 'Annual Leave',
  sick_leave: 'Sick Leave',
  personal_leave: 'Personal Leave',
  unpaid_leave: 'Unpaid Leave',
};

export const shiftTypeLabels: Record<ShiftSpecialType, string> = {
  regular: 'Regular Shift',
  on_call: 'On-Call',
  sleepover: 'Sleepover',
  broken: 'Broken/Split Shift',
  recall: 'Recall',
  emergency: 'Emergency',
};

export const shiftTypeDescriptions: Record<ShiftSpecialType, string> = {
  regular: 'Standard working shift with normal pay conditions',
  on_call: 'Available outside regular hours - triggers on-call allowance',
  sleepover: 'Required to stay overnight at facility - triggers sleepover allowance',
  broken: 'Split shift with unpaid break >1 hour - triggers broken shift allowance',
  recall: 'Called back during on-call period - paid at overtime rates',
  emergency: 'Emergency call-out - may trigger additional penalties',
};

export const defaultShiftTemplates: ShiftTemplate[] = [
  { id: 'early', name: 'Early', startTime: '06:30', endTime: '14:30', breakMinutes: 30, color: 'hsl(200, 70%, 50%)', shiftType: 'regular' },
  { id: 'mid', name: 'Mid', startTime: '09:00', endTime: '17:00', breakMinutes: 30, color: 'hsl(150, 60%, 45%)', shiftType: 'regular' },
  { id: 'late', name: 'Late', startTime: '10:30', endTime: '18:30', breakMinutes: 30, color: 'hsl(280, 60%, 50%)', shiftType: 'regular' },
  { id: 'short', name: 'Short', startTime: '09:00', endTime: '15:00', breakMinutes: 0, color: 'hsl(30, 70%, 50%)', shiftType: 'regular' },
  { id: 'full', name: 'Full Day', startTime: '07:00', endTime: '18:00', breakMinutes: 60, color: 'hsl(340, 65%, 50%)', shiftType: 'regular' },
  { id: 'on_call', name: 'On-Call', startTime: '18:00', endTime: '06:00', breakMinutes: 0, color: 'hsl(45, 80%, 50%)', shiftType: 'on_call', onCallSettings: { defaultStartTime: '18:00', defaultEndTime: '06:00' } },
  { id: 'sleepover', name: 'Sleepover', startTime: '20:00', endTime: '07:00', breakMinutes: 0, color: 'hsl(260, 60%, 50%)', shiftType: 'sleepover', sleepoverSettings: { bedtimeStart: '22:00', bedtimeEnd: '06:00' } },
  { id: 'split', name: 'Split Shift', startTime: '07:00', endTime: '18:00', breakMinutes: 0, color: 'hsl(15, 75%, 50%)', shiftType: 'broken', brokenShiftSettings: { firstShiftEnd: '11:00', secondShiftStart: '15:00', unpaidGapMinutes: 240 } },
];
