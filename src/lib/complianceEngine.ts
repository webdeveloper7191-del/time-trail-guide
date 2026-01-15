import { Timesheet, ClockEntry } from '@/types/timesheet';
import { 
  ComplianceFlag, 
  ComplianceValidation, 
  Jurisdiction, 
  OvertimeCalculation,
  ApprovalChain,
  ApprovalRule,
  ApprovalStep
} from '@/types/compliance';
import { 
  australianJurisdiction, 
  getJurisdictionByAward, 
  getJurisdictionByAwardId,
  AwardType 
} from './australianJurisdiction';
import { calculateTimesheetOvertime, TimesheetEntry } from './unifiedOvertimeCalculator';

// Re-export Australian jurisdiction as default
export const defaultJurisdiction: Jurisdiction = australianJurisdiction;

// Legacy US jurisdiction (kept for backwards compatibility)
export const usJurisdiction: Jurisdiction = {
  id: 'us-federal',
  name: 'US Federal',
  code: 'US-FED',
  maxDailyHours: 12,
  maxWeeklyHours: 60,
  breakRules: [
    { id: 'br1', name: 'Lunch Break', minWorkHoursRequired: 6, breakDurationMinutes: 30, type: 'unpaid', isMandatory: true },
    { id: 'br2', name: 'Rest Break', minWorkHoursRequired: 4, breakDurationMinutes: 15, type: 'paid', isMandatory: false },
  ],
  overtimeThresholdDaily: 8,
  overtimeThresholdWeekly: 40,
  overtimeMultiplier: 1.5,
  doubleTimeThreshold: 12,
  doubleTimeMultiplier: 2,
};

// Get jurisdiction by country code
export function getJurisdiction(countryCode: string = 'AU', awardId?: string): Jurisdiction {
  if (countryCode === 'AU' && awardId) {
    return getJurisdictionByAwardId(awardId);
  }
  if (countryCode === 'AU') {
    return australianJurisdiction;
  }
  if (countryCode === 'US') {
    return usJurisdiction;
  }
  return australianJurisdiction; // Default to AU
}

export const defaultApprovalRules: ApprovalRule[] = [
  { id: 'ar1', name: 'Normal Hours Auto-Approve', condition: 'all', requiredTier: 'auto' },
  { id: 'ar2', name: 'Overtime Review', condition: 'overtime', threshold: 2, requiredTier: 'manager', escalationTier: 'senior_manager', escalationHours: 24 },
  { id: 'ar3', name: 'High Overtime', condition: 'overtime', threshold: 8, requiredTier: 'senior_manager', escalationTier: 'director', escalationHours: 48 },
  { id: 'ar4', name: 'Compliance Issues', condition: 'compliance_flag', requiredTier: 'hr' },
  { id: 'ar5', name: 'Exception Handling', condition: 'exception', requiredTier: 'manager' },
];

// Detect irregular punches and anomalies
export function detectAnomalies(timesheet: Timesheet, historicalData?: Timesheet[]): ComplianceFlag[] {
  const flags: ComplianceFlag[] = [];
  
  timesheet.entries.forEach((entry, index) => {
    // Missing clock out
    if (!entry.clockOut) {
      flags.push({
        id: `flag-${entry.id}-missing-out`,
        type: 'missing_clock_out',
        severity: 'critical',
        title: 'Missing Clock Out',
        description: `No clock-out recorded for ${entry.date}`,
        entryDate: entry.date,
      });
    }

    // Early clock in (before 5 AM)
    if (entry.clockIn) {
      const [hour] = entry.clockIn.split(':').map(Number);
      if (hour < 5) {
        flags.push({
          id: `flag-${entry.id}-early-in`,
          type: 'early_clock_in',
          severity: 'warning',
          title: 'Unusual Early Start',
          description: `Clock-in at ${entry.clockIn} is unusually early`,
          entryDate: entry.date,
        });
      }
    }

    // Late clock out (after 10 PM)
    if (entry.clockOut) {
      const [hour] = entry.clockOut.split(':').map(Number);
      if (hour >= 22) {
        flags.push({
          id: `flag-${entry.id}-late-out`,
          type: 'late_clock_out',
          severity: 'warning',
          title: 'Unusual Late End',
          description: `Clock-out at ${entry.clockOut} is unusually late`,
          entryDate: entry.date,
        });
      }
    }

    // Excessive daily hours
    if (entry.grossHours > 12) {
      flags.push({
        id: `flag-${entry.id}-max-hours`,
        type: 'max_daily_hours',
        severity: 'critical',
        title: 'Excessive Daily Hours',
        description: `${entry.grossHours}h exceeds maximum allowed 12h`,
        entryDate: entry.date,
      });
    }

    // Pattern drift detection (comparing to historical average)
    if (historicalData && historicalData.length > 0) {
      const avgClockIn = getAverageClockInTime(historicalData);
      if (avgClockIn && entry.clockIn) {
        const diff = getTimeDifferenceMinutes(avgClockIn, entry.clockIn);
        if (Math.abs(diff) > 60) {
          flags.push({
            id: `flag-${entry.id}-pattern-drift`,
            type: 'pattern_drift',
            severity: 'info',
            title: 'Pattern Deviation',
            description: `Clock-in time deviates ${Math.abs(diff)} minutes from usual pattern`,
            entryDate: entry.date,
          });
        }
      }
    }
  });

  // Check for buddy punching indicators (same location, similar times)
  // This would require multi-employee data comparison

  return flags;
}

// Validate break compliance
export function validateBreaks(entry: ClockEntry, jurisdiction: Jurisdiction): ComplianceFlag[] {
  const flags: ComplianceFlag[] = [];
  
  jurisdiction.breakRules.forEach((rule) => {
    if (entry.grossHours >= rule.minWorkHoursRequired && rule.isMandatory) {
      const totalBreakMinutes = entry.breaks.reduce((sum, b) => sum + b.duration, 0);
      
      if (totalBreakMinutes < rule.breakDurationMinutes) {
        flags.push({
          id: `flag-${entry.id}-missed-break-${rule.id}`,
          type: 'missed_break',
          severity: 'warning',
          title: 'Missed Required Break',
          description: `${rule.name} (${rule.breakDurationMinutes}m) not taken. Only ${totalBreakMinutes}m recorded.`,
          entryDate: entry.date,
        });
      } else if (totalBreakMinutes > rule.breakDurationMinutes * 1.5) {
        flags.push({
          id: `flag-${entry.id}-exceeded-break-${rule.id}`,
          type: 'exceeded_break',
          severity: 'info',
          title: 'Extended Break Time',
          description: `Break time (${totalBreakMinutes}m) exceeds typical duration`,
          entryDate: entry.date,
        });
      }
    }
  });

  return flags;
}

// Full compliance validation
export function validateCompliance(
  timesheet: Timesheet, 
  jurisdiction: Jurisdiction = defaultJurisdiction
): ComplianceValidation {
  const flags: ComplianceFlag[] = [];
  const blockingIssues: string[] = [];
  const warnings: string[] = [];

  // Run anomaly detection
  const anomalies = detectAnomalies(timesheet);
  flags.push(...anomalies);

  // Validate breaks for each entry
  timesheet.entries.forEach((entry) => {
    const breakFlags = validateBreaks(entry, jurisdiction);
    flags.push(...breakFlags);
  });

  // Check weekly hour limits
  if (timesheet.totalHours > jurisdiction.maxWeeklyHours) {
    flags.push({
      id: `flag-weekly-max`,
      type: 'max_daily_hours',
      severity: 'critical',
      title: 'Weekly Hours Exceeded',
      description: `${timesheet.totalHours}h exceeds maximum ${jurisdiction.maxWeeklyHours}h weekly limit`,
    });
    blockingIssues.push('Weekly hours exceed legal limit');
  }

  // Check overtime threshold
  if (timesheet.overtimeHours > jurisdiction.overtimeThresholdWeekly * 0.5) {
    flags.push({
      id: `flag-high-overtime`,
      type: 'overtime_threshold',
      severity: 'warning',
      title: 'High Overtime',
      description: `${timesheet.overtimeHours}h overtime requires additional approval`,
    });
    warnings.push('High overtime hours flagged for review');
  }

  // Categorize issues
  flags.forEach((flag) => {
    if (flag.severity === 'critical' && !blockingIssues.includes(flag.description)) {
      blockingIssues.push(flag.description);
    } else if (flag.severity === 'warning' && !warnings.includes(flag.description)) {
      warnings.push(flag.description);
    }
  });

  return {
    isCompliant: blockingIssues.length === 0,
    flags,
    canSubmit: blockingIssues.length === 0,
    blockingIssues,
    warnings,
  };
}

// Calculate overtime with stacked rates
/**
 * Calculate overtime using the unified overtime calculator
 * This uses Australian award rules by default
 */
export function calculateOvertime(
  timesheet: Timesheet,
  hourlyRate: number,
  jurisdiction: Jurisdiction = defaultJurisdiction,
  isCasual: boolean = false,
  awardType: AwardType = 'general'
): OvertimeCalculation {
  // Convert timesheet entries to unified format
  const entries: TimesheetEntry[] = timesheet.entries.map(entry => ({
    date: entry.date,
    netHours: entry.netHours,
    // Determine day type based on date
    dayType: getDayTypeFromDate(entry.date),
  }));
  
  // Use unified calculator
  const breakdown = calculateTimesheetOvertime(entries, hourlyRate, isCasual, awardType, jurisdiction);
  
  // Map to legacy OvertimeCalculation format for backwards compatibility
  const dailyOvertimeHours = breakdown.dailyBreakdowns.reduce(
    (sum, d) => sum + d.overtime15Hours, 0
  );
  const doubleTimeHours = breakdown.dailyBreakdowns.reduce(
    (sum, d) => sum + d.overtime20Hours, 0
  );
  
  return {
    regularHours: breakdown.weeklyOrdinaryHours,
    dailyOvertimeHours,
    weeklyOvertimeHours: breakdown.weeklyOvertimeHoursFromThreshold,
    doubleTimeHours,
    regularPay: breakdown.totalOrdinaryPay,
    overtimePay: breakdown.totalOvertimePay,
    doubleTimePay: doubleTimeHours * hourlyRate * (jurisdiction.doubleTimeMultiplier || 2),
    totalPay: breakdown.grossPay,
  };
}

// Helper to determine day type from date string
function getDayTypeFromDate(dateStr: string): 'weekday' | 'saturday' | 'sunday' | 'public_holiday' {
  const date = new Date(dateStr);
  const day = date.getDay();
  if (day === 0) return 'sunday';
  if (day === 6) return 'saturday';
  // TODO: Check against public holiday calendar
  return 'weekday';
}

// Determine approval chain based on rules
export function determineApprovalChain(
  timesheet: Timesheet,
  validation: ComplianceValidation,
  rules: ApprovalRule[] = defaultApprovalRules
): ApprovalChain {
  const steps: ApprovalStep[] = [];
  const now = new Date().toISOString();

  // Check if auto-approval is possible
  const hasExceptions = validation.flags.some(f => f.severity === 'critical' || f.severity === 'warning');
  const hasHighOvertime = timesheet.overtimeHours > 8;
  const hasModerateOvertime = timesheet.overtimeHours > 2;

  if (!hasExceptions && !hasHighOvertime && !hasModerateOvertime) {
    // Auto-approve
    return {
      timesheetId: timesheet.id,
      steps: [{
        tier: 'auto',
        status: 'approved',
        timestamp: now,
        notes: 'Automatically approved - no exceptions detected',
      }],
      currentStepIndex: 0,
      isComplete: true,
      startedAt: now,
      completedAt: now,
      autoApproved: true,
    };
  }

  // Build approval chain based on conditions
  if (hasExceptions) {
    steps.push({
      tier: 'manager',
      status: 'pending',
      slaDeadline: getDeadline(24),
    });
  }

  if (hasModerateOvertime) {
    steps.push({
      tier: 'manager',
      status: 'pending',
      slaDeadline: getDeadline(24),
    });
  }

  if (hasHighOvertime) {
    steps.push({
      tier: 'senior_manager',
      status: 'pending',
      slaDeadline: getDeadline(48),
    });
  }

  if (validation.flags.some(f => f.type === 'max_daily_hours')) {
    steps.push({
      tier: 'hr',
      status: 'pending',
      slaDeadline: getDeadline(72),
    });
  }

  // Deduplicate consecutive same-tier steps
  const uniqueSteps = steps.reduce<ApprovalStep[]>((acc, step) => {
    if (acc.length === 0 || acc[acc.length - 1].tier !== step.tier) {
      acc.push(step);
    }
    return acc;
  }, []);

  return {
    timesheetId: timesheet.id,
    steps: uniqueSteps,
    currentStepIndex: 0,
    isComplete: false,
    startedAt: now,
  };
}

// Helper functions
function getAverageClockInTime(timesheets: Timesheet[]): string | null {
  const allClockIns = timesheets.flatMap(t => t.entries.map(e => e.clockIn)).filter(Boolean);
  if (allClockIns.length === 0) return null;

  const totalMinutes = allClockIns.reduce((sum, time) => {
    const [h, m] = time.split(':').map(Number);
    return sum + h * 60 + m;
  }, 0);

  const avgMinutes = Math.round(totalMinutes / allClockIns.length);
  const hours = Math.floor(avgMinutes / 60);
  const mins = avgMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function getTimeDifferenceMinutes(time1: string, time2: string): number {
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  return (h2 * 60 + m2) - (h1 * 60 + m1);
}

function getDeadline(hours: number): string {
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + hours);
  return deadline.toISOString();
}
