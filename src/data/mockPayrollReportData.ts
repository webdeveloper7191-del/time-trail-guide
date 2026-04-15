// Mock data for Payroll & Awards reports

export interface PayRunRecord {
  id: string;
  staffName: string;
  staffId: string;
  location: string;
  department: string;
  role: string;
  contractType: 'full_time' | 'part_time' | 'casual' | 'contractor';
  regularHours: number;
  overtimeHours: number;
  basePay: number;
  overtimePay: number;
  allowances: number;
  penalties: number;
  superannuation: number;
  totalGross: number;
  payPeriod: string;
}

export interface AllowancePenaltyRecord {
  id: string;
  staffName: string;
  location: string;
  type: 'allowance' | 'penalty';
  category: string;
  description: string;
  hours: number;
  rate: number;
  amount: number;
  date: string;
  awardReference: string;
}

export interface RetrospectivePayRecord {
  id: string;
  staffName: string;
  location: string;
  adjustmentType: 'rate_change' | 'classification_change' | 'back_pay' | 'correction';
  originalAmount: number;
  adjustedAmount: number;
  difference: number;
  effectiveFrom: string;
  processedDate: string;
  status: 'pending' | 'approved' | 'processed' | 'rejected';
  reason: string;
}

export interface AwardOverrideRecord {
  id: string;
  staffName: string;
  location: string;
  awardName: string;
  classification: string;
  originalRate: number;
  overrideRate: number;
  overrideType: 'increase' | 'decrease' | 'custom';
  reason: string;
  approvedBy: string;
  approvedDate: string;
  expiryDate?: string;
}

export interface LabourCostRecord {
  location: string;
  department: string;
  role: string;
  headcount: number;
  regularCost: number;
  overtimeCost: number;
  allowanceCost: number;
  penaltyCost: number;
  agencyCost: number;
  totalCost: number;
  budgetAmount: number;
  variance: number;
}

export interface OnCallCostRecord {
  id: string;
  staffName: string;
  location: string;
  type: 'on_call' | 'callback' | 'recall';
  standbyHours: number;
  standbyRate: number;
  standbyCost: number;
  activatedHours: number;
  activatedRate: number;
  activatedCost: number;
  totalCost: number;
  date: string;
}

export interface CasualVsPermanentRecord {
  location: string;
  period: string;
  permanentHeadcount: number;
  casualHeadcount: number;
  permanentHours: number;
  casualHours: number;
  permanentCost: number;
  casualCost: number;
  casualLoadingPercent: number;
  costPerHourPermanent: number;
  costPerHourCasual: number;
}

const locations = ['Sunshine Centre', 'Harbour View', 'Mountain Creek', 'Valley Springs', 'Coastal Hub'];
const departments = ['Operations', 'Admin', 'Kitchen', 'Management', 'Support'];
const roles = ['Educator', 'Team Leader', 'Support Worker', 'Coordinator', 'Cook', 'Admin Officer'];
const staffNames = ['Sarah Chen', 'James Wilson', 'Emily Davis', 'Michael Brown', 'Jessica Taylor', 'David Lee', 'Amanda Clark', 'Ryan Martinez', 'Lisa Thompson', 'Chris Anderson', 'Megan White', 'Tom Harris'];

export const mockPayRunRecords: PayRunRecord[] = staffNames.map((name, i) => {
  const regularHours = 30 + (i % 4) * 5;
  const overtimeHours = i % 3 === 0 ? 4 + i : 0;
  const basePay = regularHours * (28 + i * 1.5);
  const overtimePay = overtimeHours * (28 + i * 1.5) * 1.5;
  const allowances = i % 2 === 0 ? 45 + i * 10 : 0;
  const penalties = i % 3 === 1 ? 80 + i * 15 : 0;
  const superannuation = Math.round((basePay + overtimePay) * 0.115);
  return {
    id: `pr-${i}`,
    staffName: name,
    staffId: `staff-${i}`,
    location: locations[i % locations.length],
    department: departments[i % departments.length],
    role: roles[i % roles.length],
    contractType: (['full_time', 'part_time', 'casual', 'contractor'] as const)[i % 4],
    regularHours,
    overtimeHours,
    basePay: Math.round(basePay),
    overtimePay: Math.round(overtimePay),
    allowances,
    penalties,
    superannuation,
    totalGross: Math.round(basePay + overtimePay + allowances + penalties),
    payPeriod: '01 Apr – 14 Apr 2026',
  };
});

const allowanceCategories = ['Travel', 'Meal', 'First Aid', 'Uniform', 'Phone', 'Higher Duties'];
const penaltyCategories = ['Saturday', 'Sunday', 'Public Holiday', 'Evening', 'Night', 'Early Morning'];

export const mockAllowancePenalties: AllowancePenaltyRecord[] = staffNames.flatMap((name, i) => [
  { id: `ap-${i}-a`, staffName: name, location: locations[i % locations.length], type: 'allowance' as const, category: allowanceCategories[i % allowanceCategories.length], description: `${allowanceCategories[i % allowanceCategories.length]} Allowance`, hours: 0, rate: 12 + i * 2, amount: 12 + i * 2, date: `2026-04-${String(5 + (i % 10)).padStart(2, '0')}`, awardReference: 'MA000120' },
  { id: `ap-${i}-p`, staffName: name, location: locations[i % locations.length], type: 'penalty' as const, category: penaltyCategories[i % penaltyCategories.length], description: `${penaltyCategories[i % penaltyCategories.length]} Penalty Rate`, hours: 3 + i, rate: 42 + i * 3, amount: (3 + i) * (42 + i * 3), date: `2026-04-${String(6 + (i % 8)).padStart(2, '0')}`, awardReference: 'MA000120' },
]);

export const mockRetrospectivePay: RetrospectivePayRecord[] = staffNames.slice(0, 6).map((name, i) => ({
  id: `rp-${i}`,
  staffName: name,
  location: locations[i % locations.length],
  adjustmentType: (['rate_change', 'classification_change', 'back_pay', 'correction'] as const)[i % 4],
  originalAmount: 1200 + i * 300,
  adjustedAmount: 1350 + i * 320,
  difference: 150 + i * 20,
  effectiveFrom: `2026-0${2 + (i % 3)}-01`,
  processedDate: `2026-04-${String(10 + i).padStart(2, '0')}`,
  status: (['pending', 'approved', 'processed', 'rejected'] as const)[i % 4],
  reason: ['Annual rate increase', 'Reclassification to Level 3', 'Missing weekend penalties', 'Incorrect base rate applied'][i % 4],
}));

export const mockAwardOverrides: AwardOverrideRecord[] = staffNames.slice(0, 8).map((name, i) => ({
  id: `ao-${i}`,
  staffName: name,
  location: locations[i % locations.length],
  awardName: ['Children\'s Services Award', 'Social Services Award', 'General Retail Award'][i % 3],
  classification: `Level ${2 + (i % 4)}.${1 + (i % 3)}`,
  originalRate: 28 + i * 1.5,
  overrideRate: 30 + i * 2,
  overrideType: (['increase', 'decrease', 'custom'] as const)[i % 3],
  reason: ['Market adjustment', 'Qualification premium', 'Retention incentive', 'Experience credit'][i % 4],
  approvedBy: ['HR Manager', 'Operations Director', 'Centre Manager'][i % 3],
  approvedDate: `2026-03-${String(15 + i).padStart(2, '0')}`,
  expiryDate: i % 3 === 0 ? `2026-09-${String(15 + i).padStart(2, '0')}` : undefined,
}));

export const mockLabourCosts: LabourCostRecord[] = locations.flatMap((loc, li) =>
  departments.slice(0, 3).map((dept, di) => ({
    location: loc,
    department: dept,
    role: roles[di],
    headcount: 5 + li + di * 2,
    regularCost: 15000 + li * 3000 + di * 2000,
    overtimeCost: 1200 + li * 400 + di * 300,
    allowanceCost: 600 + li * 100 + di * 80,
    penaltyCost: 900 + li * 200 + di * 150,
    agencyCost: li % 2 === 0 ? 3000 + di * 500 : 0,
    totalCost: 17700 + li * 3700 + di * 3030,
    budgetAmount: 18000 + li * 3500 + di * 3000,
    variance: 300 - li * 200 - di * 30,
  }))
);

export const mockOnCallCosts: OnCallCostRecord[] = staffNames.slice(0, 8).map((name, i) => ({
  id: `oc-${i}`,
  staffName: name,
  location: locations[i % locations.length],
  type: (['on_call', 'callback', 'recall'] as const)[i % 3],
  standbyHours: 8 + i * 2,
  standbyRate: 15 + i,
  standbyCost: (8 + i * 2) * (15 + i),
  activatedHours: i % 2 === 0 ? 2 + i * 0.5 : 0,
  activatedRate: 45 + i * 3,
  activatedCost: i % 2 === 0 ? Math.round((2 + i * 0.5) * (45 + i * 3)) : 0,
  totalCost: (8 + i * 2) * (15 + i) + (i % 2 === 0 ? Math.round((2 + i * 0.5) * (45 + i * 3)) : 0),
  date: `2026-04-${String(8 + i).padStart(2, '0')}`,
}));

const periods = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

export const mockCasualVsPermanent: CasualVsPermanentRecord[] = locations.flatMap((loc, li) =>
  periods.map((period, pi) => ({
    location: loc,
    period,
    permanentHeadcount: 12 + li * 3,
    casualHeadcount: 5 + li + pi,
    permanentHours: (12 + li * 3) * 38,
    casualHours: (5 + li + pi) * 22,
    permanentCost: (12 + li * 3) * 38 * 32,
    casualCost: (5 + li + pi) * 22 * 38,
    casualLoadingPercent: 25,
    costPerHourPermanent: 32,
    costPerHourCasual: 38,
  }))
);

// Trend data
export const payrollTrendData = periods.map((m, i) => ({
  month: m,
  totalLabour: 120000 + i * 8000 + Math.round(Math.random() * 5000),
  overtime: 8000 + i * 500 + Math.round(Math.random() * 2000),
  penalties: 5000 + i * 300 + Math.round(Math.random() * 1500),
  allowances: 3000 + i * 200,
  budget: 140000 + i * 5000,
}));

export const awardComplianceTrend = periods.map((m, i) => ({
  month: m,
  complianceRate: 92 + i * 1.2,
  overrides: 8 - i * 0.5,
  violations: 3 - i * 0.3 + Math.round(Math.random() * 2),
}));
