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
