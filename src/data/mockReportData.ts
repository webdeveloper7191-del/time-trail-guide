import { format, subDays, startOfWeek, addDays } from 'date-fns';

const today = new Date();
const weekStart = startOfWeek(today, { weekStartsOn: 1 });

// Staff utilisation data
export interface StaffUtilisationRecord {
  staffId: string;
  staffName: string;
  role: string;
  location: string;
  scheduledHours: number;
  capacityHours: number;
  utilisationPercent: number;
  overtimeHours: number;
  leaveHours: number;
}

export const mockStaffUtilisation: StaffUtilisationRecord[] = [
  { staffId: '1', staffName: 'Sarah Johnson', role: 'Lead Educator', location: 'Sunshine Centre', scheduledHours: 38, capacityHours: 40, utilisationPercent: 95, overtimeHours: 2, leaveHours: 0 },
  { staffId: '2', staffName: 'Michael Chen', role: 'Educator', location: 'Sunshine Centre', scheduledHours: 32, capacityHours: 38, utilisationPercent: 84, overtimeHours: 0, leaveHours: 8 },
  { staffId: '3', staffName: 'Emily Rodriguez', role: 'Assistant', location: 'Harbor View', scheduledHours: 40, capacityHours: 40, utilisationPercent: 100, overtimeHours: 4, leaveHours: 0 },
  { staffId: '4', staffName: 'James Wilson', role: 'Educator', location: 'Harbor View', scheduledHours: 28, capacityHours: 38, utilisationPercent: 74, overtimeHours: 0, leaveHours: 0 },
  { staffId: '5', staffName: 'Aisha Patel', role: 'Lead Educator', location: 'Mountain Peak', scheduledHours: 36, capacityHours: 40, utilisationPercent: 90, overtimeHours: 0, leaveHours: 4 },
  { staffId: '6', staffName: 'David Kim', role: 'Cook', location: 'Sunshine Centre', scheduledHours: 35, capacityHours: 38, utilisationPercent: 92, overtimeHours: 0, leaveHours: 0 },
  { staffId: '7', staffName: 'Lisa Thompson', role: 'Educator', location: 'Mountain Peak', scheduledHours: 24, capacityHours: 38, utilisationPercent: 63, overtimeHours: 0, leaveHours: 16 },
  { staffId: '8', staffName: 'Robert Garcia', role: 'Assistant', location: 'Sunshine Centre', scheduledHours: 40, capacityHours: 40, utilisationPercent: 100, overtimeHours: 6, leaveHours: 0 },
];

// Overtime & fatigue data
export interface OvertimeFatigueRecord {
  staffId: string;
  staffName: string;
  location: string;
  weeklyHours: number;
  maxHours: number;
  overtimeHours: number;
  consecutiveDays: number;
  fatigueScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  restHoursBetweenShifts: number;
}

export const mockOvertimeFatigue: OvertimeFatigueRecord[] = [
  { staffId: '3', staffName: 'Emily Rodriguez', location: 'Harbor View', weeklyHours: 44, maxHours: 40, overtimeHours: 4, consecutiveDays: 6, fatigueScore: 78, riskLevel: 'high', restHoursBetweenShifts: 9 },
  { staffId: '8', staffName: 'Robert Garcia', location: 'Sunshine Centre', weeklyHours: 46, maxHours: 40, overtimeHours: 6, consecutiveDays: 7, fatigueScore: 85, riskLevel: 'critical', restHoursBetweenShifts: 8 },
  { staffId: '1', staffName: 'Sarah Johnson', location: 'Sunshine Centre', weeklyHours: 42, maxHours: 40, overtimeHours: 2, consecutiveDays: 5, fatigueScore: 55, riskLevel: 'medium', restHoursBetweenShifts: 11 },
  { staffId: '5', staffName: 'Aisha Patel', location: 'Mountain Peak', weeklyHours: 36, maxHours: 40, overtimeHours: 0, consecutiveDays: 4, fatigueScore: 30, riskLevel: 'low', restHoursBetweenShifts: 14 },
  { staffId: '2', staffName: 'Michael Chen', location: 'Sunshine Centre', weeklyHours: 32, maxHours: 38, overtimeHours: 0, consecutiveDays: 3, fatigueScore: 20, riskLevel: 'low', restHoursBetweenShifts: 16 },
];

// Open shift fill rate data
export interface OpenShiftFillRecord {
  date: string;
  location: string;
  area: string;
  totalOpenShifts: number;
  filledShifts: number;
  fillRate: number;
  avgTimeToFillHours: number;
  filledByInternal: number;
  filledByAgency: number;
  unfilled: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export const mockOpenShiftFill: OpenShiftFillRecord[] = Array.from({ length: 14 }, (_, i) => {
  const date = format(subDays(today, 13 - i), 'yyyy-MM-dd');
  const total = Math.floor(Math.random() * 8) + 2;
  const filled = Math.floor(Math.random() * total) + 1;
  const internal = Math.floor(Math.random() * filled);
  return {
    date,
    location: ['Sunshine Centre', 'Harbor View', 'Mountain Peak'][i % 3],
    area: ['Nursery', 'Toddler', 'Preschool', 'Kindy'][i % 4],
    totalOpenShifts: total,
    filledShifts: filled,
    fillRate: Math.round((filled / total) * 100),
    avgTimeToFillHours: Math.round(Math.random() * 24 + 2),
    filledByInternal: internal,
    filledByAgency: filled - internal,
    unfilled: total - filled,
    urgency: (['low', 'medium', 'high', 'critical'] as const)[Math.floor(Math.random() * 4)],
  };
});

// Agency usage data
export interface AgencyUsageRecord {
  agencyName: string;
  shiftsProvided: number;
  totalHours: number;
  totalCost: number;
  avgHourlyRate: number;
  fillRate: number;
  avgResponseTimeHours: number;
  qualityScore: number;
  cancellationRate: number;
}

export const mockAgencyUsage: AgencyUsageRecord[] = [
  { agencyName: 'Anzuk', shiftsProvided: 24, totalHours: 192, totalCost: 11520, avgHourlyRate: 60, fillRate: 88, avgResponseTimeHours: 4.2, qualityScore: 92, cancellationRate: 3 },
  { agencyName: 'Randstad', shiftsProvided: 18, totalHours: 144, totalCost: 9360, avgHourlyRate: 65, fillRate: 75, avgResponseTimeHours: 6.5, qualityScore: 85, cancellationRate: 8 },
  { agencyName: 'Quick Care', shiftsProvided: 12, totalHours: 96, totalCost: 5280, avgHourlyRate: 55, fillRate: 92, avgResponseTimeHours: 2.1, qualityScore: 88, cancellationRate: 2 },
  { agencyName: 'Hays', shiftsProvided: 8, totalHours: 64, totalCost: 4160, avgHourlyRate: 65, fillRate: 70, avgResponseTimeHours: 8.0, qualityScore: 80, cancellationRate: 12 },
];

// Coverage gap data
export interface CoverageGapRecord {
  date: string;
  location: string;
  area: string;
  timeSlot: string;
  requiredStaff: number;
  scheduledStaff: number;
  gap: number;
  gapSeverity: 'minor' | 'moderate' | 'critical';
  reason: string;
}

export const mockCoverageGaps: CoverageGapRecord[] = [
  { date: format(today, 'yyyy-MM-dd'), location: 'Sunshine Centre', area: 'Nursery', timeSlot: '7:00 AM - 9:00 AM', requiredStaff: 3, scheduledStaff: 2, gap: 1, gapSeverity: 'moderate', reason: 'Staff on leave' },
  { date: format(today, 'yyyy-MM-dd'), location: 'Harbor View', area: 'Toddler', timeSlot: '12:00 PM - 2:00 PM', requiredStaff: 4, scheduledStaff: 2, gap: 2, gapSeverity: 'critical', reason: 'Sick call' },
  { date: format(addDays(today, 1), 'yyyy-MM-dd'), location: 'Mountain Peak', area: 'Preschool', timeSlot: '3:00 PM - 6:00 PM', requiredStaff: 2, scheduledStaff: 1, gap: 1, gapSeverity: 'moderate', reason: 'Understaffed' },
  { date: format(addDays(today, 2), 'yyyy-MM-dd'), location: 'Sunshine Centre', area: 'Kindy', timeSlot: '9:00 AM - 11:00 AM', requiredStaff: 3, scheduledStaff: 3, gap: 0, gapSeverity: 'minor', reason: '' },
  { date: format(addDays(today, 1), 'yyyy-MM-dd'), location: 'Harbor View', area: 'Nursery', timeSlot: '6:30 AM - 8:00 AM', requiredStaff: 2, scheduledStaff: 0, gap: 2, gapSeverity: 'critical', reason: 'No coverage scheduled' },
];

// Area combining savings
export interface AreaCombiningSavingsRecord {
  date: string;
  location: string;
  combinedAreas: string;
  staffSaved: number;
  hoursSaved: number;
  costSaved: number;
  childrenAffected: number;
  durationMinutes: number;
}

export const mockAreaCombiningSavings: AreaCombiningSavingsRecord[] = [
  { date: format(subDays(today, 2), 'yyyy-MM-dd'), location: 'Sunshine Centre', combinedAreas: 'Nursery + Toddler', staffSaved: 1, hoursSaved: 4, costSaved: 160, childrenAffected: 12, durationMinutes: 240 },
  { date: format(subDays(today, 3), 'yyyy-MM-dd'), location: 'Harbor View', combinedAreas: 'Preschool + Kindy', staffSaved: 2, hoursSaved: 8, costSaved: 320, childrenAffected: 18, durationMinutes: 480 },
  { date: format(subDays(today, 5), 'yyyy-MM-dd'), location: 'Mountain Peak', combinedAreas: 'Toddler + Preschool', staffSaved: 1, hoursSaved: 3, costSaved: 120, childrenAffected: 10, durationMinutes: 180 },
  { date: format(subDays(today, 7), 'yyyy-MM-dd'), location: 'Sunshine Centre', combinedAreas: 'Nursery + Toddler', staffSaved: 1, hoursSaved: 5, costSaved: 200, childrenAffected: 14, durationMinutes: 300 },
];

// Fairness data
export interface FairnessRecord {
  staffId: string;
  staffName: string;
  location: string;
  weekendShifts: number;
  earlyShifts: number;
  lateShifts: number;
  totalShifts: number;
  fairnessScore: number; // 0-100
  deviationFromAvg: number; // percentage
}

export const mockFairness: FairnessRecord[] = [
  { staffId: '1', staffName: 'Sarah Johnson', location: 'Sunshine Centre', weekendShifts: 4, earlyShifts: 6, lateShifts: 2, totalShifts: 20, fairnessScore: 88, deviationFromAvg: -3 },
  { staffId: '2', staffName: 'Michael Chen', location: 'Sunshine Centre', weekendShifts: 2, earlyShifts: 4, lateShifts: 5, totalShifts: 18, fairnessScore: 72, deviationFromAvg: -12 },
  { staffId: '3', staffName: 'Emily Rodriguez', location: 'Harbor View', weekendShifts: 6, earlyShifts: 3, lateShifts: 4, totalShifts: 22, fairnessScore: 65, deviationFromAvg: 8 },
  { staffId: '4', staffName: 'James Wilson', location: 'Harbor View', weekendShifts: 3, earlyShifts: 5, lateShifts: 3, totalShifts: 16, fairnessScore: 92, deviationFromAvg: -1 },
  { staffId: '5', staffName: 'Aisha Patel', location: 'Mountain Peak', weekendShifts: 5, earlyShifts: 4, lateShifts: 6, totalShifts: 21, fairnessScore: 70, deviationFromAvg: 5 },
  { staffId: '8', staffName: 'Robert Garcia', location: 'Sunshine Centre', weekendShifts: 7, earlyShifts: 7, lateShifts: 2, totalShifts: 24, fairnessScore: 55, deviationFromAvg: 18 },
];

// Recurring pattern adherence
export interface RecurringPatternRecord {
  patternName: string;
  location: string;
  totalExpectedShifts: number;
  actualShifts: number;
  adherencePercent: number;
  deviations: number;
  deviationReasons: string[];
}

export const mockRecurringPatterns: RecurringPatternRecord[] = [
  { patternName: 'Mon-Fri Early Shift', location: 'Sunshine Centre', totalExpectedShifts: 20, actualShifts: 18, adherencePercent: 90, deviations: 2, deviationReasons: ['Staff leave', 'Schedule swap'] },
  { patternName: 'Weekend Coverage', location: 'Harbor View', totalExpectedShifts: 8, actualShifts: 8, adherencePercent: 100, deviations: 0, deviationReasons: [] },
  { patternName: 'Late Shift Rotation', location: 'Mountain Peak', totalExpectedShifts: 12, actualShifts: 10, adherencePercent: 83, deviations: 2, deviationReasons: ['Sick call', 'Area combining'] },
  { patternName: 'Split Shift - Kitchen', location: 'Sunshine Centre', totalExpectedShifts: 10, actualShifts: 9, adherencePercent: 90, deviations: 1, deviationReasons: ['Public holiday'] },
  { patternName: 'Fortnightly On-Call', location: 'Harbor View', totalExpectedShifts: 4, actualShifts: 3, adherencePercent: 75, deviations: 1, deviationReasons: ['No availability'] },
];

// Multi-location overview data
export interface LocationOverviewRecord {
  locationId: string;
  locationName: string;
  totalStaff: number;
  activeToday: number;
  onLeave: number;
  openShifts: number;
  complianceScore: number;
  labourCost: number;
  budgetVariance: number;
  utilisationPercent: number;
  areas: { name: string; staffCount: number; required: number; compliant: boolean }[];
}

export const mockLocationOverview: LocationOverviewRecord[] = [
  {
    locationId: '1', locationName: 'Sunshine Centre', totalStaff: 18, activeToday: 14, onLeave: 2, openShifts: 3,
    complianceScore: 94, labourCost: 12450, budgetVariance: -320, utilisationPercent: 88,
    areas: [
      { name: 'Nursery', staffCount: 3, required: 3, compliant: true },
      { name: 'Toddler', staffCount: 4, required: 4, compliant: true },
      { name: 'Preschool', staffCount: 3, required: 3, compliant: true },
      { name: 'Kindy', staffCount: 4, required: 3, compliant: true },
    ],
  },
  {
    locationId: '2', locationName: 'Harbor View', totalStaff: 14, activeToday: 10, onLeave: 3, openShifts: 5,
    complianceScore: 82, labourCost: 9800, budgetVariance: 650, utilisationPercent: 76,
    areas: [
      { name: 'Nursery', staffCount: 2, required: 3, compliant: false },
      { name: 'Toddler', staffCount: 3, required: 3, compliant: true },
      { name: 'Preschool', staffCount: 3, required: 3, compliant: true },
      { name: 'Kindy', staffCount: 2, required: 3, compliant: false },
    ],
  },
  {
    locationId: '3', locationName: 'Mountain Peak', totalStaff: 10, activeToday: 8, onLeave: 1, openShifts: 2,
    complianceScore: 90, labourCost: 7200, budgetVariance: -120, utilisationPercent: 85,
    areas: [
      { name: 'Toddler', staffCount: 3, required: 3, compliant: true },
      { name: 'Preschool', staffCount: 3, required: 3, compliant: true },
      { name: 'Kindy', staffCount: 2, required: 2, compliant: true },
    ],
  },
];

// Demand vs actuals data
export interface DemandVsActualRecord {
  date: string;
  location: string;
  area: string;
  timeSlot: string;
  forecastedChildren: number;
  actualChildren: number;
  forecastedStaff: number;
  actualStaff: number;
  demandAccuracy: number;
  staffingAccuracy: number;
}

export const mockDemandVsActuals: DemandVsActualRecord[] = Array.from({ length: 7 }, (_, dayIndex) => {
  const date = format(addDays(weekStart, dayIndex), 'yyyy-MM-dd');
  return ['Nursery', 'Toddler', 'Preschool', 'Kindy'].map(area => {
    const fc = Math.floor(Math.random() * 15) + 5;
    const ac = fc + Math.floor(Math.random() * 6) - 3;
    const fs = Math.ceil(fc / (area === 'Nursery' ? 4 : area === 'Toddler' ? 5 : 10));
    const as_ = fs + (Math.random() > 0.7 ? -1 : 0);
    return {
      date,
      location: 'Sunshine Centre',
      area,
      timeSlot: '9:00 AM - 3:00 PM',
      forecastedChildren: fc,
      actualChildren: Math.max(0, ac),
      forecastedStaff: fs,
      actualStaff: Math.max(1, as_),
      demandAccuracy: Math.round((1 - Math.abs(fc - ac) / fc) * 100),
      staffingAccuracy: Math.round((1 - Math.abs(fs - as_) / fs) * 100),
    };
  });
}).flat();

// Summary metrics for dashboard cards
export const reportSummaryMetrics = {
  avgUtilisation: 87,
  totalOvertimeHours: 12,
  openShiftFillRate: 78,
  agencySpend: 30320,
  coverageGaps: 4,
  areaCombiningSavings: 800,
  avgFairnessScore: 74,
  recurringAdherence: 88,
};

// =================== Enrichment: extra fields for richer reports ===================

export interface StaffUtilisationRecord {
  department?: string;
  contractType?: 'full_time' | 'part_time' | 'casual' | 'contractor';
  utilisationTrend?: 'up' | 'down' | 'stable';
  totalCost?: number;
  shiftsWorked?: number;
  avgShiftLength?: number;
}

export interface OvertimeFatigueRecord {
  totalShiftsThisMonth?: number;
  recommendedAction?: string;
  overtimeCost?: number;
  daysOff7d?: number;
  trend?: 'improving' | 'stable' | 'worsening';
}

export interface OpenShiftFillRecord {
  agencyCost?: number;
  internalCost?: number;
  totalCost?: number;
  costPerShift?: number;
  reason?: string;
  notificationsSent?: number;
}

export interface AgencyUsageRecord {
  ytdCost?: number;
  contractEndDate?: string;
  primaryContact?: string;
  noShowCount?: number;
  preferredStatus?: 'preferred' | 'standard' | 'last_resort';
}

export interface CoverageGapRecord {
  durationHours?: number;
  estimatedCost?: number;
  resolution?: 'agency' | 'internal' | 'unfilled' | 'pending';
  notifiedAt?: string;
  ratioImpact?: string;
}

export interface AreaCombiningSavingsRecord {
  combinedDurationHrs?: number;
  newRatio?: string;
  approvedBy?: string;
  ratioCompliant?: boolean;
  alternativeCost?: number;
}

export interface FairnessRecord {
  publicHolidayShifts?: number;
  preferredShiftMatchPct?: number;
  swapsRequested?: number;
  lastReviewDate?: string;
  ranking?: number;
}

export interface RecurringPatternRecord {
  daysActive?: number;
  staffAssigned?: number;
  failureCost?: number;
  lastDeviation?: string;
  owner?: string;
}

export interface DemandVsActualRecord {
  variance?: number;
  costImpact?: number;
  weatherCondition?: string;
  daysOfNotice?: number;
  ratioImpact?: string;
}

const _depts = ['Nursery', 'Toddler', 'Preschool', 'Kindy', 'Kitchen'];
const _today = new Date();
const _fmtDate = (offset: number) => {
  const d = new Date(_today);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

mockStaffUtilisation.forEach((r, i) => {
  r.department = r.department ?? _depts[i % _depts.length];
  r.contractType = r.contractType ?? (['full_time', 'part_time', 'casual', 'full_time', 'full_time'] as const)[i % 5];
  r.utilisationTrend = r.utilisationTrend ?? (r.utilisationPercent > 90 ? 'up' : r.utilisationPercent < 75 ? 'down' : 'stable');
  r.totalCost = r.totalCost ?? Math.round(r.scheduledHours * 32 + r.overtimeHours * 48);
  r.shiftsWorked = r.shiftsWorked ?? Math.max(1, Math.round(r.scheduledHours / 8));
  r.avgShiftLength = r.avgShiftLength ?? Number((r.scheduledHours / Math.max(1, r.shiftsWorked ?? 1)).toFixed(1));
});

mockOvertimeFatigue.forEach((r, i) => {
  r.totalShiftsThisMonth = r.totalShiftsThisMonth ?? (15 + i * 2);
  r.recommendedAction = r.recommendedAction ?? (r.riskLevel === 'critical' ? 'Mandatory rest period' : r.riskLevel === 'high' ? 'Reduce next-week hours' : r.riskLevel === 'medium' ? 'Monitor' : 'No action');
  r.overtimeCost = r.overtimeCost ?? Math.round(r.overtimeHours * 48);
  r.daysOff7d = r.daysOff7d ?? Math.max(0, 7 - r.consecutiveDays);
  r.trend = r.trend ?? (r.fatigueScore > 70 ? 'worsening' : r.fatigueScore < 40 ? 'improving' : 'stable');
});

mockOpenShiftFill.forEach((r, i) => {
  r.agencyCost = r.agencyCost ?? r.filledByAgency * 8 * 60;
  r.internalCost = r.internalCost ?? r.filledByInternal * 8 * 32;
  r.totalCost = r.totalCost ?? ((r.agencyCost ?? 0) + (r.internalCost ?? 0));
  r.costPerShift = r.costPerShift ?? (r.filledShifts > 0 ? Math.round((r.totalCost ?? 0) / r.filledShifts) : 0);
  r.reason = r.reason ?? (['Sick leave', 'Last-minute resignation', 'Increased demand', 'Annual leave', 'Public holiday'][i % 5]);
  r.notificationsSent = r.notificationsSent ?? (r.totalOpenShifts * 5);
});

mockAgencyUsage.forEach((r, i) => {
  r.ytdCost = r.ytdCost ?? r.totalCost * (4 + i);
  r.contractEndDate = r.contractEndDate ?? `2026-${String(8 + i).padStart(2, '0')}-30`;
  r.primaryContact = r.primaryContact ?? ['Jane Smith', 'Mark Davis', 'Lisa Wong', 'Tom Bradley'][i % 4];
  r.noShowCount = r.noShowCount ?? Math.round(r.shiftsProvided * (r.cancellationRate / 100));
  r.preferredStatus = r.preferredStatus ?? (r.qualityScore >= 90 ? 'preferred' : r.qualityScore >= 82 ? 'standard' : 'last_resort');
});

mockCoverageGaps.forEach((r, i) => {
  // Calculate hours from "7:00 AM - 9:00 AM"-style timeSlot
  const m = r.timeSlot.match(/(\d+):(\d+)\s*(AM|PM)\s*-\s*(\d+):(\d+)\s*(AM|PM)/);
  let hrs = 2;
  if (m) {
    const toH = (h: string, mn: string, ap: string) => {
      let hh = parseInt(h);
      if (ap === 'PM' && hh !== 12) hh += 12;
      if (ap === 'AM' && hh === 12) hh = 0;
      return hh + parseInt(mn) / 60;
    };
    hrs = Math.max(0.5, toH(m[4], m[5], m[6]) - toH(m[1], m[2], m[3]));
  }
  r.durationHours = r.durationHours ?? Number(hrs.toFixed(1));
  r.estimatedCost = r.estimatedCost ?? Math.round(r.gap * (r.durationHours ?? hrs) * 32);
  r.resolution = r.resolution ?? (r.gap === 0 ? 'internal' : i % 3 === 0 ? 'agency' : i % 3 === 1 ? 'pending' : 'unfilled');
  r.notifiedAt = r.notifiedAt ?? `${r.date} 06:00`;
  r.ratioImpact = r.ratioImpact ?? (r.gap > 0 ? `1:${Math.ceil((r.requiredStaff + r.gap) / r.scheduledStaff)}` : '1:4');
});

mockAreaCombiningSavings.forEach((r, i) => {
  r.combinedDurationHrs = r.combinedDurationHrs ?? Number((r.durationMinutes / 60).toFixed(1));
  r.newRatio = r.newRatio ?? '1:6';
  r.approvedBy = r.approvedBy ?? ['Sarah Williams', 'Mark Stevens', 'Linda Park'][i % 3];
  r.ratioCompliant = r.ratioCompliant ?? true;
  r.alternativeCost = r.alternativeCost ?? Math.round(r.costSaved * 1.4);
});

mockFairness.forEach((r, i) => {
  r.publicHolidayShifts = r.publicHolidayShifts ?? Math.round(r.weekendShifts * 0.3);
  r.preferredShiftMatchPct = r.preferredShiftMatchPct ?? (60 + (r.fairnessScore % 30));
  r.swapsRequested = r.swapsRequested ?? Math.round((100 - r.fairnessScore) / 10);
  r.lastReviewDate = r.lastReviewDate ?? _fmtDate(-30 - i);
  r.ranking = r.ranking ?? (i + 1);
});

mockRecurringPatterns.forEach((r, i) => {
  r.daysActive = r.daysActive ?? (30 + i * 15);
  r.staffAssigned = r.staffAssigned ?? (3 + (i % 4));
  r.failureCost = r.failureCost ?? r.deviations * 280;
  r.lastDeviation = r.lastDeviation ?? (r.deviations > 0 ? _fmtDate(-(2 + i * 2)) : '—');
  r.owner = r.owner ?? ['Sarah Williams', 'Mark Stevens', 'Linda Park'][i % 3];
});

mockDemandVsActuals.forEach((r, i) => {
  r.variance = r.variance ?? (r.actualChildren - r.forecastedChildren);
  r.costImpact = r.costImpact ?? Math.abs(r.variance ?? 0) * 25;
  r.weatherCondition = r.weatherCondition ?? (['Sunny', 'Rainy', 'Cloudy', 'Hot'][i % 4]);
  r.daysOfNotice = r.daysOfNotice ?? 7;
  r.ratioImpact = r.ratioImpact ?? `1:${Math.max(2, Math.ceil((r.actualChildren) / Math.max(1, r.actualStaff)))}`;
});

