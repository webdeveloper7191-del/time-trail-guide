export type FlagSeverity = 'info' | 'warning' | 'critical';
export type FlagType = 
  | 'irregular_punch' 
  | 'pattern_drift' 
  | 'buddy_punching' 
  | 'missed_break' 
  | 'exceeded_break'
  | 'overtime_threshold'
  | 'max_daily_hours'
  | 'missing_clock_out'
  | 'early_clock_in'
  | 'late_clock_out';

export interface ComplianceFlag {
  id: string;
  type: FlagType;
  severity: FlagSeverity;
  title: string;
  description: string;
  entryDate?: string;
  autoResolved?: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export type BreakType = 'paid' | 'unpaid';

export interface BreakRule {
  id: string;
  name: string;
  minWorkHoursRequired: number;
  breakDurationMinutes: number;
  type: BreakType;
  isMandatory: boolean;
}

export interface Jurisdiction {
  id: string;
  name: string;
  code: string;
  maxDailyHours: number;
  maxWeeklyHours: number;
  breakRules: BreakRule[];
  overtimeThresholdDaily: number;
  overtimeThresholdWeekly: number;
  overtimeMultiplier: number;
  doubleTimeThreshold?: number;
  doubleTimeMultiplier?: number;
}

export type ApprovalTier = 'auto' | 'manager' | 'senior_manager' | 'director' | 'hr';

export interface ApprovalRule {
  id: string;
  name: string;
  condition: 'overtime' | 'exception' | 'high_hours' | 'compliance_flag' | 'all';
  threshold?: number;
  requiredTier: ApprovalTier;
  escalationTier?: ApprovalTier;
  escalationHours?: number;
}

export interface ApprovalStep {
  tier: ApprovalTier;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  approverName?: string;
  approverId?: string;
  timestamp?: string;
  notes?: string;
  slaDeadline?: string;
  isEscalated?: boolean;
}

export interface ApprovalChain {
  timesheetId: string;
  steps: ApprovalStep[];
  currentStepIndex: number;
  isComplete: boolean;
  startedAt: string;
  completedAt?: string;
  autoApproved?: boolean;
}

export interface OvertimeCalculation {
  regularHours: number;
  dailyOvertimeHours: number;
  weeklyOvertimeHours: number;
  doubleTimeHours: number;
  regularPay: number;
  overtimePay: number;
  doubleTimePay: number;
  totalPay: number;
}

export interface ComplianceValidation {
  isCompliant: boolean;
  flags: ComplianceFlag[];
  canSubmit: boolean;
  blockingIssues: string[];
  warnings: string[];
}
