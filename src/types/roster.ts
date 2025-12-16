export type ViewMode = 'day' | 'week' | 'fortnight' | 'month';

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

export interface StaffMember {
  id: string;
  name: string;
  avatar?: string;
  role: 'lead_educator' | 'educator' | 'assistant' | 'cook' | 'admin';
  qualifications: Qualification[];
  hourlyRate: number;
  maxHoursPerWeek: number;
  currentWeeklyHours: number;
  preferredCentres: string[];
  availability: DayAvailability[];
  color: string;
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
  nursery: 4,    // 1:4 ratio
  toddler: 5,    // 1:5 ratio
  preschool: 10, // 1:10 ratio
  kindy: 11,     // 1:11 ratio
};
