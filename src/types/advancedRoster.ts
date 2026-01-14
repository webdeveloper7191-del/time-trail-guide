// Advanced Roster Types

// ============= Recurring Shift Patterns =============
export type RecurrencePattern = 'daily' | 'weekly' | 'fortnightly' | 'monthly' | 'custom';

export interface RecurringShiftPattern {
  id: string;
  name: string;
  description?: string;
  pattern: RecurrencePattern;
  startDate: string;
  endDate?: string;
  daysOfWeek?: number[]; // 0=Sunday, 1=Monday, etc.
  weekInterval?: number; // For fortnightly or custom
  monthDay?: number; // For monthly patterns
  shiftTemplate: {
    startTime: string;
    endTime: string;
    roleId: string;
    roleName: string;
    centreId: string;
    requiredQualifications?: string[];
    breakDuration?: number; // minutes
  };
  assignedStaffId?: string;
  assignedStaffName?: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

export interface GeneratedShift {
  date: string;
  patternId: string;
  shiftDetails: RecurringShiftPattern['shiftTemplate'];
  status: 'pending' | 'confirmed' | 'modified' | 'cancelled';
}

// ============= Break Scheduling =============
export interface BreakRule {
  id: string;
  name: string;
  minShiftDuration: number; // hours
  breakDuration: number; // minutes
  isPaid: boolean;
  isMandatory: boolean;
  earliestBreakStart: number; // hours after shift start
  latestBreakEnd: number; // hours before shift end
  awardReference?: string;
}

export interface ScheduledBreak {
  id: string;
  shiftId: string;
  staffId: string;
  breakType: 'meal' | 'rest' | 'other';
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  duration: number; // minutes
  isPaid: boolean;
  status: 'scheduled' | 'started' | 'completed' | 'missed' | 'skipped';
}

export interface BreakAllocationResult {
  shiftId: string;
  allocatedBreaks: ScheduledBreak[];
  conflicts: string[];
  coverageGaps: { start: string; end: string }[];
}

// ============= Skill Matrix Matching =============
export interface SkillWeight {
  skillId: string;
  skillName: string;
  weight: number; // 0-100
  isRequired: boolean;
  expiryCheck: boolean;
}

export interface SkillMatrix {
  roleId: string;
  roleName: string;
  requiredSkills: SkillWeight[];
  preferredSkills: SkillWeight[];
  minimumMatchScore: number; // 0-100
}

export interface StaffSkillProfile {
  staffId: string;
  staffName: string;
  skills: {
    skillId: string;
    skillName: string;
    proficiencyLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
    certificationDate?: string;
    expiryDate?: string;
    isExpired: boolean;
  }[];
}

export interface SkillMatchResult {
  staffId: string;
  staffName: string;
  matchScore: number; // 0-100
  matchedSkills: string[];
  missingRequired: string[];
  missingPreferred: string[];
  expiringSkills: { skill: string; expiryDate: string }[];
  recommendation: 'excellent' | 'good' | 'acceptable' | 'not_recommended';
}

// ============= Fatigue Management =============
export interface FatigueRule {
  id: string;
  name: string;
  description: string;
  maxConsecutiveDays: number;
  maxWeeklyHours: number;
  minRestBetweenShifts: number; // hours
  maxNightShiftsConsecutive: number;
  nightShiftStart: string; // e.g., "22:00"
  nightShiftEnd: string; // e.g., "06:00"
  fatigueScoreThreshold: number; // 0-100
  isActive: boolean;
}

export interface FatigueScore {
  staffId: string;
  staffName: string;
  currentScore: number; // 0-100, higher = more fatigued
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  factors: {
    factor: string;
    contribution: number;
    details: string;
  }[];
  lastUpdated: string;
  recommendations: string[];
  projectedScoreNextWeek: number;
}

export interface FatigueViolation {
  id: string;
  staffId: string;
  staffName: string;
  violationType: 'consecutive_days' | 'weekly_hours' | 'rest_break' | 'night_shifts' | 'fatigue_threshold';
  severity: 'warning' | 'violation' | 'critical';
  description: string;
  currentValue: number;
  limitValue: number;
  shiftIds: string[];
  detectedAt: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
}

// ============= GPS Clock-in/Clock-out =============
export interface GeofenceZone {
  id: string;
  name: string;
  centreId: string;
  centreName: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isActive: boolean;
  allowedBuffer: number; // meters beyond radius still allowed
  createdAt: string;
}

export interface ClockEvent {
  id: string;
  staffId: string;
  staffName: string;
  shiftId: string;
  eventType: 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
  scheduledTime: string;
  actualTime: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number; // meters
  geofenceId?: string;
  withinGeofence: boolean;
  distanceFromCentre?: number; // meters
  validationStatus: 'valid' | 'warning' | 'invalid' | 'manual_override';
  validationNotes?: string;
  deviceInfo?: string;
  ipAddress?: string;
}

export interface AttendanceValidation {
  shiftId: string;
  staffId: string;
  clockIn?: ClockEvent;
  clockOut?: ClockEvent;
  breaks: ClockEvent[];
  totalWorkedMinutes: number;
  scheduledMinutes: number;
  variance: number; // minutes
  issues: {
    type: 'early_clock_in' | 'late_clock_in' | 'early_clock_out' | 'late_clock_out' | 'outside_geofence' | 'missing_clock' | 'break_violation';
    description: string;
    severity: 'info' | 'warning' | 'error';
  }[];
  overallStatus: 'valid' | 'needs_review' | 'invalid';
}

// ============= Weather Integration =============
export type WeatherCondition = 'clear' | 'cloudy' | 'rain' | 'heavy_rain' | 'storm' | 'snow' | 'extreme_heat' | 'extreme_cold';

export interface WeatherForecast {
  date: string;
  location: string;
  condition: WeatherCondition;
  temperature: {
    min: number;
    max: number;
    unit: 'celsius' | 'fahrenheit';
  };
  precipitation: {
    probability: number; // 0-100
    amount?: number; // mm
  };
  wind: {
    speed: number;
    unit: 'kmh' | 'mph';
  };
  uvIndex: number;
  humidity: number;
  alerts: string[];
}

export interface WeatherDemandAdjustment {
  condition: WeatherCondition;
  demandMultiplier: number; // e.g., 0.8 = 20% less demand, 1.2 = 20% more
  applyTo: 'all' | 'outdoor' | 'indoor';
  notes: string;
}

export interface ExternalFactor {
  id: string;
  type: 'weather' | 'public_holiday' | 'school_holidays' | 'event' | 'custom';
  name: string;
  startDate: string;
  endDate: string;
  demandMultiplier: number;
  affectedCentres: string[] | 'all';
  notes?: string;
  source: 'automatic' | 'manual';
}

export interface DemandForecast {
  date: string;
  centreId: string;
  baselineDemand: number;
  adjustedDemand: number;
  factors: {
    factorType: string;
    factorName: string;
    multiplier: number;
  }[];
  confidence: number; // 0-100
  recommendedStaffCount: number;
  scheduledStaffCount: number;
  variance: number;
}

// ============= Label Maps =============
export const recurrencePatternLabels: Record<RecurrencePattern, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  fortnightly: 'Fortnightly',
  monthly: 'Monthly',
  custom: 'Custom',
};

export const weatherConditionLabels: Record<WeatherCondition, string> = {
  clear: 'Clear',
  cloudy: 'Cloudy',
  rain: 'Rain',
  heavy_rain: 'Heavy Rain',
  storm: 'Storm',
  snow: 'Snow',
  extreme_heat: 'Extreme Heat',
  extreme_cold: 'Extreme Cold',
};

export const fatigueRiskColors: Record<FatigueScore['riskLevel'], string> = {
  low: 'bg-emerald-500/10 text-emerald-700',
  moderate: 'bg-amber-500/10 text-amber-700',
  high: 'bg-orange-500/10 text-orange-700',
  critical: 'bg-red-500/10 text-red-700',
};
