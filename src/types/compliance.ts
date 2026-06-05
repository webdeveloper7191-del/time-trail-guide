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

export type ApprovalRuleCondition =
  | 'all'
  | 'overtime'
  | 'exception'
  | 'high_hours'
  | 'compliance_flag'
  | 'location'
  | 'employment_type';

export type SlaBreachAction = 'escalate' | 'auto_approve' | 'auto_reject' | 'hold';

export interface ApprovalRule {
  id: string;
  name: string;
  condition: ApprovalRuleCondition;
  threshold?: number;
  requiredTier: ApprovalTier;
  /** Specific user assigned as the approver for this rule (overrides tier-based lookup). */
  assignedApproverId?: string;
  /** Restrict rule to specific locations (when condition = 'location' or as extra filter). */
  locationIds?: string[];
  /** Restrict rule to specific employment types (e.g. casual, agency). */
  employmentTypes?: string[];
  escalationTier?: ApprovalTier;
  escalationHours?: number;
  /** Send a reminder N hours before SLA breach. */
  reminderHours?: number;
  /** Action to take when SLA is breached. */
  slaBreachAction?: SlaBreachAction;
  /** Require approvers to enter a comment when rejecting or adjusting. */
  requireCommentOnReject?: boolean;
  /** Approval mode: serial (default) or parallel (all approvers must approve). */
  parallelApproval?: boolean;
  /** Notify the staff member when this rule routes their timesheet. */
  notifyStaffOnRoute?: boolean;
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
