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
}

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

export const defaultShiftTemplates: ShiftTemplate[] = [
  { id: 'early', name: 'Early', startTime: '06:30', endTime: '14:30', breakMinutes: 30, color: 'hsl(200, 70%, 50%)' },
  { id: 'mid', name: 'Mid', startTime: '09:00', endTime: '17:00', breakMinutes: 30, color: 'hsl(150, 60%, 45%)' },
  { id: 'late', name: 'Late', startTime: '10:30', endTime: '18:30', breakMinutes: 30, color: 'hsl(280, 60%, 50%)' },
  { id: 'short', name: 'Short', startTime: '09:00', endTime: '15:00', breakMinutes: 0, color: 'hsl(30, 70%, 50%)' },
  { id: 'full', name: 'Full Day', startTime: '07:00', endTime: '18:00', breakMinutes: 60, color: 'hsl(340, 65%, 50%)' },
];
