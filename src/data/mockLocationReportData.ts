// Mock data for Location Management reports

export interface MultiSiteOpsData {
  locationId: string;
  locationName: string;
  status: 'online' | 'partial' | 'offline';
  totalStaff: number;
  onDuty: number;
  areas: number;
  occupancy: number;
  capacity: number;
  complianceScore: number;
  budgetUsed: number;
  budgetTotal: number;
  alerts: number;
}

export interface CapacityUtilData {
  locationName: string;
  areaName: string;
  capacity: number;
  currentOccupancy: number;
  peakOccupancy: number;
  avgOccupancy: number;
  utilisationPercent: number;
  trend: 'up' | 'down' | 'stable';
}

export interface BudgetVsActualRecord {
  locationName: string;
  category: string;
  budgetAmount: number;
  actualAmount: number;
  variance: number;
  variancePercent: number;
  month: string;
}

export interface AreaUtilRecord {
  locationName: string;
  areaName: string;
  serviceCategory: string;
  capacity: number;
  avgOccupancy: number;
  peakOccupancy: number;
  utilisationPercent: number;
  hoursOperating: number;
  hoursUsed: number;
  status: 'active' | 'inactive' | 'maintenance';
}

export interface ComplianceViolationRecord {
  id: string;
  locationName: string;
  areaName: string;
  violationType: string;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  date: string;
  resolvedAt?: string;
  status: 'open' | 'resolved' | 'acknowledged';
}

export interface StaffingRatioRecord {
  locationName: string;
  areaName: string;
  serviceCategory: string;
  requiredRatio: string;
  actualRatio: string;
  attendance: number;
  requiredStaff: number;
  actualStaff: number;
  isCompliant: boolean;
  date: string;
  timeSlot: string;
}

export interface CrossLocationDeployment {
  staffName: string;
  staffId: string;
  primaryLocation: string;
  deployedLocation: string;
  role: string;
  hoursAtPrimary: number;
  hoursDeployed: number;
  deploymentCount: number;
  lastDeployed: string;
}

const locations = ['Sunshine Centre', 'Harbour View', 'Mountain Creek', 'Valley Springs', 'Coastal Hub'];
const areas = ['Room A', 'Room B', 'Room C', 'Kitchen', 'Outdoor Area', 'Reception'];
const categories = ['Nursery', 'Toddler', 'Preschool', 'Support', 'Outdoor', 'Admin'];

export const mockMultiSiteOps: MultiSiteOpsData[] = locations.map((name, i) => ({
  locationId: `loc-${i + 1}`,
  locationName: name,
  status: i === 2 ? 'partial' : 'online',
  totalStaff: 20 + i * 5,
  onDuty: 14 + i * 3,
  areas: 4 + (i % 3),
  occupancy: 50 + i * 12,
  capacity: 80 + i * 10,
  complianceScore: 85 + i * 3,
  budgetUsed: 45000 + i * 8000,
  budgetTotal: 60000 + i * 10000,
  alerts: i === 2 ? 3 : i === 0 ? 1 : 0,
}));

export const mockCapacityUtil: CapacityUtilData[] = locations.flatMap((loc, li) =>
  areas.slice(0, 3 + (li % 2)).map((area, ai) => ({
    locationName: loc,
    areaName: area,
    capacity: 20 + ai * 5,
    currentOccupancy: 12 + ai * 3 + li,
    peakOccupancy: 18 + ai * 4,
    avgOccupancy: 14 + ai * 2,
    utilisationPercent: Math.round((14 + ai * 2) / (20 + ai * 5) * 100),
    trend: ai % 3 === 0 ? 'up' as const : ai % 3 === 1 ? 'stable' as const : 'down' as const,
  }))
);

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const budgetCategories = ['Labour', 'Agency', 'Supplies', 'Maintenance', 'Training'];

export const mockBudgetVsActuals: BudgetVsActualRecord[] = locations.flatMap((loc, li) =>
  budgetCategories.map((cat, ci) => ({
    locationName: loc,
    category: cat,
    budgetAmount: 10000 + ci * 5000 + li * 2000,
    actualAmount: 9500 + ci * 5200 + li * 1800 + (ci === 1 ? 3000 : 0),
    variance: -(500 + ci * 200 - (ci === 1 ? 3000 : 0)),
    variancePercent: Math.round((-(500 + ci * 200 - (ci === 1 ? 3000 : 0))) / (10000 + ci * 5000 + li * 2000) * 100),
    month: months[li % 6],
  }))
);

export const mockAreaUtil: AreaUtilRecord[] = locations.flatMap((loc, li) =>
  areas.map((area, ai) => ({
    locationName: loc,
    areaName: area,
    serviceCategory: categories[ai],
    capacity: 20 + ai * 5,
    avgOccupancy: 10 + ai * 3 + li,
    peakOccupancy: 16 + ai * 4,
    utilisationPercent: Math.round((10 + ai * 3 + li) / (20 + ai * 5) * 100),
    hoursOperating: 10,
    hoursUsed: 6 + ai + li * 0.5,
    status: ai === 5 ? 'inactive' as const : 'active' as const,
  }))
);

const violationTypes = ['Staffing Ratio Breach', 'Qualification Gap', 'Capacity Exceeded', 'Break Compliance', 'Operating Hours Violation'];

export const mockComplianceViolations: ComplianceViolationRecord[] = locations.flatMap((loc, li) =>
  violationTypes.slice(0, 2 + (li % 3)).map((vt, vi) => ({
    id: `cv-${li}-${vi}`,
    locationName: loc,
    areaName: areas[vi % areas.length],
    violationType: vt,
    severity: vi === 0 ? 'critical' as const : vi === 1 ? 'warning' as const : 'info' as const,
    description: `${vt} detected in ${areas[vi % areas.length]}`,
    date: `2026-04-${String(10 - vi).padStart(2, '0')}`,
    resolvedAt: vi > 1 ? `2026-04-${String(11 - vi).padStart(2, '0')}` : undefined,
    status: vi > 1 ? 'resolved' as const : vi === 1 ? 'acknowledged' as const : 'open' as const,
  }))
);

const timeSlots = ['7:00 AM', '9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM', '5:00 PM'];

export const mockStaffingRatios: StaffingRatioRecord[] = locations.flatMap((loc, li) =>
  areas.slice(0, 3).flatMap((area, ai) =>
    timeSlots.slice(0, 3).map((ts, ti) => ({
      locationName: loc,
      areaName: area,
      serviceCategory: categories[ai],
      requiredRatio: '1:4',
      actualRatio: ti === 0 && ai === 0 ? '1:5' : '1:4',
      attendance: 12 + ai * 4 + ti * 2,
      requiredStaff: Math.ceil((12 + ai * 4 + ti * 2) / 4),
      actualStaff: Math.ceil((12 + ai * 4 + ti * 2) / 4) + (ti === 0 && ai === 0 ? -1 : 0),
      isCompliant: !(ti === 0 && ai === 0),
      date: `2026-04-${String(10 + li).padStart(2, '0')}`,
      timeSlot: ts,
    }))
  )
);

const staffNames = ['Sarah Chen', 'James Wilson', 'Emily Davis', 'Michael Brown', 'Jessica Taylor', 'David Lee', 'Amanda Clark', 'Ryan Martinez'];

export const mockCrossLocationDeployments: CrossLocationDeployment[] = staffNames.map((name, i) => ({
  staffName: name,
  staffId: `staff-${i + 1}`,
  primaryLocation: locations[i % locations.length],
  deployedLocation: locations[(i + 1) % locations.length],
  role: ['Educator', 'Team Leader', 'Support Worker', 'Coordinator'][i % 4],
  hoursAtPrimary: 30 + i * 2,
  hoursDeployed: 8 + i,
  deploymentCount: 2 + (i % 4),
  lastDeployed: `2026-04-${String(12 - i).padStart(2, '0')}`,
}));

// Trend data for charts
export const locationTrendData = months.map((m, i) => ({
  month: m,
  avgUtilisation: 65 + i * 3 + Math.round(Math.random() * 5),
  avgCompliance: 88 + i * 1.5,
  totalViolations: 12 - i * 1.5 + Math.round(Math.random() * 3),
  budgetVariance: -2 + i * 0.8,
}));

export const capacityByHourData = Array.from({ length: 11 }, (_, i) => ({
  hour: `${7 + i}:00`,
  occupancy: Math.round(20 + Math.sin((i - 2) * 0.5) * 40 + 30),
  capacity: 80,
}));

// =================== Enrichment: extra fields ===================

export interface MultiSiteOpsData {
  occupancyPercent?: number;
  budgetUsedPct?: number;
  managerName?: string;
  openShifts?: number;
  staffOnLeave?: number;
  lastUpdated?: string;
}

export interface CapacityUtilData {
  freeCapacity?: number;
  utilisationVsTarget?: number;
  hourPeakStart?: string;
  forecastNext7d?: number;
  revenuePerSeat?: number;
}

export interface BudgetVsActualRecord {
  ytdBudget?: number;
  ytdActual?: number;
  forecastEoY?: number;
  status?: 'on_track' | 'at_risk' | 'over_budget';
  owner?: string;
}

export interface AreaUtilRecord {
  freeHours?: number;
  bookings?: number;
  staffAssigned?: number;
  revenueImpact?: number;
  efficiencyScore?: number;
}

export interface ComplianceViolationRecord {
  ageInDays?: number;
  responsibleStaff?: string;
  potentialFine?: number;
  evidence?: string;
  riskCategory?: 'safety' | 'staffing' | 'documentation' | 'operational';
}

export interface StaffingRatioRecord {
  gap?: number;
  costOfNonCompliance?: number;
  trend?: 'improving' | 'stable' | 'worsening';
  shiftLeader?: string;
}

export interface CrossLocationDeployment {
  utilisationAtPrimaryPct?: number;
  reasonForDeployment?: string;
  travelCost?: number;
  approvedBy?: string;
  status?: 'active' | 'completed' | 'cancelled';
}

const _locManagers = ['Sarah Williams', 'Mark Stevens', 'Rachel Adams', 'Tony Nguyen', 'Linda Park'];
mockMultiSiteOps.forEach((r, i) => {
  r.occupancyPercent = r.occupancyPercent ?? Math.round((r.occupancy / r.capacity) * 100);
  r.budgetUsedPct = r.budgetUsedPct ?? Math.round((r.budgetUsed / r.budgetTotal) * 100);
  r.managerName = r.managerName ?? _locManagers[i % _locManagers.length];
  r.openShifts = r.openShifts ?? (i === 2 ? 5 : i === 0 ? 2 : 1);
  r.staffOnLeave = r.staffOnLeave ?? Math.max(0, r.totalStaff - r.onDuty - 3);
  r.lastUpdated = r.lastUpdated ?? new Date().toISOString().slice(0, 16).replace('T', ' ');
});

mockCapacityUtil.forEach((r, i) => {
  r.freeCapacity = r.freeCapacity ?? Math.max(0, r.capacity - r.currentOccupancy);
  r.utilisationVsTarget = r.utilisationVsTarget ?? (r.utilisationPercent - 75);
  r.hourPeakStart = r.hourPeakStart ?? `${9 + (i % 6)}:00`;
  r.forecastNext7d = r.forecastNext7d ?? Math.round(r.avgOccupancy * (1 + (i % 3) * 0.05));
  r.revenuePerSeat = r.revenuePerSeat ?? (45 + (i % 4) * 8);
});

mockBudgetVsActuals.forEach((r, i) => {
  r.ytdBudget = r.ytdBudget ?? Math.round(r.budgetAmount * 6);
  r.ytdActual = r.ytdActual ?? Math.round(r.actualAmount * 6);
  r.forecastEoY = r.forecastEoY ?? Math.round(r.actualAmount * 12);
  r.status = r.status ?? (r.variancePercent < -10 ? 'over_budget' : r.variancePercent < -3 ? 'at_risk' : 'on_track');
  r.owner = r.owner ?? _locManagers[i % _locManagers.length];
});

mockAreaUtil.forEach((r, i) => {
  r.freeHours = r.freeHours ?? Math.max(0, r.hoursOperating - r.hoursUsed);
  r.bookings = r.bookings ?? (10 + i * 2);
  r.staffAssigned = r.staffAssigned ?? Math.ceil(r.avgOccupancy / 6);
  r.revenueImpact = r.revenueImpact ?? Math.round(r.avgOccupancy * 55);
  r.efficiencyScore = r.efficiencyScore ?? Math.min(100, Math.round((r.utilisationPercent + (r.hoursUsed / r.hoursOperating) * 100) / 2));
});

const _evidenceItems = ['Photo report', 'Manager log', 'System alert', 'Audit finding', 'Staff report'];
mockComplianceViolations.forEach((r, i) => {
  const date = new Date(r.date);
  r.ageInDays = r.ageInDays ?? Math.max(0, Math.round((Date.now() - date.getTime()) / 86400000));
  r.responsibleStaff = r.responsibleStaff ?? _locManagers[i % _locManagers.length];
  r.potentialFine = r.potentialFine ?? (r.severity === 'critical' ? 5000 + i * 500 : r.severity === 'warning' ? 1000 + i * 200 : 250);
  r.evidence = r.evidence ?? _evidenceItems[i % _evidenceItems.length];
  r.riskCategory = r.riskCategory ?? (r.violationType.toLowerCase().includes('staff') || r.violationType.toLowerCase().includes('ratio') ? 'staffing' : r.violationType.toLowerCase().includes('break') ? 'operational' : r.violationType.toLowerCase().includes('qual') ? 'documentation' : 'safety');
});

mockStaffingRatios.forEach((r, i) => {
  r.gap = r.gap ?? (r.requiredStaff - r.actualStaff);
  r.costOfNonCompliance = r.costOfNonCompliance ?? (r.isCompliant ? 0 : Math.abs(r.gap ?? 0) * 250);
  r.trend = r.trend ?? ((['improving', 'stable', 'worsening', 'stable'] as const)[i % 4]);
  r.shiftLeader = r.shiftLeader ?? _locManagers[i % _locManagers.length];
});

const _deployReasons = ['Staff shortage', 'Special event', 'Cover for leave', 'Project rollout', 'Training delivery'];
mockCrossLocationDeployments.forEach((r, i) => {
  r.utilisationAtPrimaryPct = r.utilisationAtPrimaryPct ?? Math.round((r.hoursAtPrimary / (r.hoursAtPrimary + r.hoursDeployed)) * 100);
  r.reasonForDeployment = r.reasonForDeployment ?? _deployReasons[i % _deployReasons.length];
  r.travelCost = r.travelCost ?? (45 + i * 8);
  r.approvedBy = r.approvedBy ?? _locManagers[i % _locManagers.length];
  r.status = r.status ?? ((['active', 'completed', 'active', 'completed'] as const)[i % 4]);
});


// =================== Sparkline trends ===================

export interface MultiSiteOpsData {
  utilisationTrend?: number[];
  costTrend?: number[];
}
export interface BudgetVsActualRecord {
  variancePctTrend?: number[];
}
export interface AreaUtilRecord {
  utilisationTrend?: number[];
}
export interface ComplianceViolationRecord {
  violationsTrend?: number[];
}
export interface StaffingRatioRecord {
  ratioTrend?: number[];
}

function _seedTrendL(seed: number, base: number, variance: number, len = 8, drift = 0): number[] {
  const out: number[] = [];
  let x = seed * 9301 + 49297;
  for (let i = 0; i < len; i++) {
    x = (x * 9301 + 49297) % 233280;
    const r = (x / 233280) - 0.5;
    out.push(Math.max(0, Math.round((base + r * variance + drift * i) * 10) / 10));
  }
  return out;
}

mockMultiSiteOps.forEach((r, i) => {
  r.utilisationTrend = r.utilisationTrend ?? _seedTrendL(i + 61, (r as any).utilisation ?? 75, 8, 8, 0.5);
  r.costTrend = r.costTrend ?? _seedTrendL(i + 67, (r as any).laborCost ?? 50000, 4000, 8, 200);
});

mockBudgetVsActuals.forEach((r, i) => {
  r.variancePctTrend = r.variancePctTrend ?? _seedTrendL(i + 71, (r as any).variancePercent ?? 3, 4, 8, -0.1);
});

mockAreaUtil.forEach((r, i) => {
  r.utilisationTrend = r.utilisationTrend ?? _seedTrendL(i + 73, (r as any).utilisation ?? 70, 8, 8, 0.3);
});

mockComplianceViolations.forEach((r, i) => {
  r.violationsTrend = r.violationsTrend ?? _seedTrendL(i + 79, (r as any).violations ?? 2, 2, 8, -0.1);
});

mockStaffingRatios.forEach((r, i) => {
  r.ratioTrend = r.ratioTrend ?? _seedTrendL(i + 83, (r as any).actualRatio ?? 4, 1, 8, 0);
});
