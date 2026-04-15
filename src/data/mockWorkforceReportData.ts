export interface HeadcountRecord {
  department: string;
  location: string;
  totalHeadcount: number;
  fte: number;
  fullTime: number;
  partTime: number;
  casual: number;
  contractor: number;
  newHires: number;
  terminations: number;
  turnoverRate: number;
}

export interface TurnoverRecord {
  month: string;
  hires: number;
  terminations: number;
  headcount: number;
  turnoverRate: number;
  retentionRate: number;
  avgTenureMonths: number;
  voluntaryExits: number;
  involuntaryExits: number;
}

export interface OnboardingRecord {
  id: string;
  staffName: string;
  position: string;
  location: string;
  startDate: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  stepsCompleted: number;
  totalSteps: number;
  completionPct: number;
  daysInPipeline: number;
  assignedTo: string;
}

export interface QualificationRecord {
  id: string;
  staffName: string;
  location: string;
  qualification: string;
  issueDate: string;
  expiryDate: string;
  daysUntilExpiry: number;
  status: 'valid' | 'expiring_soon' | 'expired';
}

export interface AvailabilityVsScheduledRecord {
  staffName: string;
  location: string;
  department: string;
  availableHours: number;
  scheduledHours: number;
  utilisationPct: number;
  unscheduledHours: number;
  overtimeHours: number;
}

export interface ContractDistributionRecord {
  location: string;
  department: string;
  fullTime: number;
  partTime: number;
  casual: number;
  contractor: number;
  totalStaff: number;
}

export interface SkillsMatrixRecord {
  staffName: string;
  location: string;
  department: string;
  skills: { name: string; level: 'beginner' | 'intermediate' | 'advanced' | 'expert' }[];
  totalSkills: number;
  certifications: number;
}

// Mock data

export const mockHeadcountData: HeadcountRecord[] = [
  { department: 'Operations', location: 'Melbourne CBD', totalHeadcount: 28, fte: 24.5, fullTime: 18, partTime: 6, casual: 3, contractor: 1, newHires: 3, terminations: 1, turnoverRate: 3.6 },
  { department: 'Education', location: 'Melbourne CBD', totalHeadcount: 15, fte: 13.0, fullTime: 10, partTime: 3, casual: 2, contractor: 0, newHires: 2, terminations: 0, turnoverRate: 0 },
  { department: 'Operations', location: 'South Yarra', totalHeadcount: 22, fte: 19.0, fullTime: 14, partTime: 5, casual: 2, contractor: 1, newHires: 1, terminations: 2, turnoverRate: 9.1 },
  { department: 'Education', location: 'South Yarra', totalHeadcount: 12, fte: 10.5, fullTime: 8, partTime: 3, casual: 1, contractor: 0, newHires: 1, terminations: 0, turnoverRate: 0 },
  { department: 'Administration', location: 'Melbourne CBD', totalHeadcount: 8, fte: 7.5, fullTime: 6, partTime: 2, casual: 0, contractor: 0, newHires: 0, terminations: 0, turnoverRate: 0 },
  { department: 'Operations', location: 'Prahran', totalHeadcount: 18, fte: 15.0, fullTime: 11, partTime: 4, casual: 2, contractor: 1, newHires: 2, terminations: 1, turnoverRate: 5.6 },
  { department: 'Management', location: 'Melbourne CBD', totalHeadcount: 5, fte: 5.0, fullTime: 5, partTime: 0, casual: 0, contractor: 0, newHires: 0, terminations: 0, turnoverRate: 0 },
  { department: 'Education', location: 'Prahran', totalHeadcount: 10, fte: 8.5, fullTime: 6, partTime: 3, casual: 1, contractor: 0, newHires: 1, terminations: 1, turnoverRate: 10.0 },
];

export const mockTurnoverData: TurnoverRecord[] = [
  { month: '2024-07', hires: 4, terminations: 1, headcount: 110, turnoverRate: 0.9, retentionRate: 99.1, avgTenureMonths: 18, voluntaryExits: 1, involuntaryExits: 0 },
  { month: '2024-08', hires: 3, terminations: 2, headcount: 111, turnoverRate: 1.8, retentionRate: 98.2, avgTenureMonths: 18, voluntaryExits: 1, involuntaryExits: 1 },
  { month: '2024-09', hires: 5, terminations: 1, headcount: 115, turnoverRate: 0.9, retentionRate: 99.1, avgTenureMonths: 17, voluntaryExits: 0, involuntaryExits: 1 },
  { month: '2024-10', hires: 2, terminations: 3, headcount: 114, turnoverRate: 2.6, retentionRate: 97.4, avgTenureMonths: 17, voluntaryExits: 2, involuntaryExits: 1 },
  { month: '2024-11', hires: 6, terminations: 2, headcount: 118, turnoverRate: 1.7, retentionRate: 98.3, avgTenureMonths: 16, voluntaryExits: 1, involuntaryExits: 1 },
  { month: '2024-12', hires: 3, terminations: 1, headcount: 120, turnoverRate: 0.8, retentionRate: 99.2, avgTenureMonths: 16, voluntaryExits: 1, involuntaryExits: 0 },
  { month: '2025-01', hires: 4, terminations: 2, headcount: 122, turnoverRate: 1.6, retentionRate: 98.4, avgTenureMonths: 15, voluntaryExits: 2, involuntaryExits: 0 },
  { month: '2025-02', hires: 3, terminations: 1, headcount: 124, turnoverRate: 0.8, retentionRate: 99.2, avgTenureMonths: 15, voluntaryExits: 0, involuntaryExits: 1 },
  { month: '2025-03', hires: 5, terminations: 2, headcount: 127, turnoverRate: 1.6, retentionRate: 98.4, avgTenureMonths: 14, voluntaryExits: 1, involuntaryExits: 1 },
];

export const mockOnboardingData: OnboardingRecord[] = [
  { id: 'ob-1', staffName: 'Emily Rodriguez', position: 'Trainee Educator', location: 'Melbourne CBD', startDate: '2025-03-01', status: 'in_progress', stepsCompleted: 5, totalSteps: 8, completionPct: 62.5, daysInPipeline: 14, assignedTo: 'Sarah Williams' },
  { id: 'ob-2', staffName: 'Alex Nguyen', position: 'Assistant Educator', location: 'South Yarra', startDate: '2025-03-10', status: 'in_progress', stepsCompleted: 3, totalSteps: 8, completionPct: 37.5, daysInPipeline: 5, assignedTo: 'Mark John' },
  { id: 'ob-3', staffName: 'Lisa Park', position: 'Support Worker', location: 'Prahran', startDate: '2025-02-15', status: 'overdue', stepsCompleted: 4, totalSteps: 8, completionPct: 50, daysInPipeline: 28, assignedTo: 'James Chen' },
  { id: 'ob-4', staffName: 'Tom Bradley', position: 'Educator', location: 'Melbourne CBD', startDate: '2025-02-01', status: 'completed', stepsCompleted: 8, totalSteps: 8, completionPct: 100, daysInPipeline: 12, assignedTo: 'Sarah Williams' },
  { id: 'ob-5', staffName: 'Priya Sharma', position: 'Lead Educator', location: 'South Yarra', startDate: '2025-03-15', status: 'not_started', stepsCompleted: 0, totalSteps: 8, completionPct: 0, daysInPipeline: 0, assignedTo: 'Mark John' },
  { id: 'ob-6', staffName: 'David Kim', position: 'Casual Educator', location: 'Prahran', startDate: '2025-01-20', status: 'completed', stepsCompleted: 8, totalSteps: 8, completionPct: 100, daysInPipeline: 10, assignedTo: 'James Chen' },
];

export const mockQualificationData: QualificationRecord[] = [
  { id: 'q-1', staffName: 'Mark John', location: 'Melbourne CBD', qualification: 'First Aid Certificate', issueDate: '2023-06-15', expiryDate: '2025-06-15', daysUntilExpiry: 92, status: 'valid' },
  { id: 'q-2', staffName: 'Mark John', location: 'Melbourne CBD', qualification: 'Working with Children Check', issueDate: '2022-01-10', expiryDate: '2027-01-10', daysUntilExpiry: 665, status: 'valid' },
  { id: 'q-3', staffName: 'Sarah Williams', location: 'Melbourne CBD', qualification: 'First Aid Certificate', issueDate: '2023-04-20', expiryDate: '2025-04-20', daysUntilExpiry: 36, status: 'expiring_soon' },
  { id: 'q-4', staffName: 'Sarah Williams', location: 'Melbourne CBD', qualification: 'Working with Children Check', issueDate: '2021-08-01', expiryDate: '2026-08-01', daysUntilExpiry: 504, status: 'valid' },
  { id: 'q-5', staffName: 'James Chen', location: 'South Yarra', qualification: 'First Aid Certificate', issueDate: '2022-11-01', expiryDate: '2024-11-01', daysUntilExpiry: -135, status: 'expired' },
  { id: 'q-6', staffName: 'James Chen', location: 'South Yarra', qualification: 'Working with Children Check', issueDate: '2023-03-15', expiryDate: '2028-03-15', daysUntilExpiry: 1096, status: 'valid' },
  { id: 'q-7', staffName: 'Emily Rodriguez', location: 'Melbourne CBD', qualification: 'Working with Children Check', issueDate: '2024-08-01', expiryDate: '2029-08-01', daysUntilExpiry: 1600, status: 'valid' },
  { id: 'q-8', staffName: 'Michael Thompson', location: 'Prahran', qualification: 'First Aid Certificate', issueDate: '2023-01-10', expiryDate: '2025-01-10', daysUntilExpiry: -64, status: 'expired' },
  { id: 'q-9', staffName: 'Alex Nguyen', location: 'South Yarra', qualification: 'First Aid Certificate', issueDate: '2024-01-15', expiryDate: '2026-01-15', daysUntilExpiry: 306, status: 'valid' },
  { id: 'q-10', staffName: 'Lisa Park', location: 'Prahran', qualification: 'CPR Certificate', issueDate: '2024-06-01', expiryDate: '2025-06-01', daysUntilExpiry: 78, status: 'expiring_soon' },
];

export const mockAvailabilityVsScheduled: AvailabilityVsScheduledRecord[] = [
  { staffName: 'Mark John', location: 'Melbourne CBD', department: 'Operations', availableHours: 40, scheduledHours: 38, utilisationPct: 95, unscheduledHours: 2, overtimeHours: 0 },
  { staffName: 'Sarah Williams', location: 'Melbourne CBD', department: 'Education', availableHours: 40, scheduledHours: 40, utilisationPct: 100, unscheduledHours: 0, overtimeHours: 2 },
  { staffName: 'James Chen', location: 'South Yarra', department: 'Operations', availableHours: 32, scheduledHours: 24, utilisationPct: 75, unscheduledHours: 8, overtimeHours: 0 },
  { staffName: 'Emily Rodriguez', location: 'Melbourne CBD', department: 'Education', availableHours: 20, scheduledHours: 16, utilisationPct: 80, unscheduledHours: 4, overtimeHours: 0 },
  { staffName: 'Tom Bradley', location: 'Melbourne CBD', department: 'Operations', availableHours: 40, scheduledHours: 42, utilisationPct: 105, unscheduledHours: 0, overtimeHours: 4 },
  { staffName: 'Lisa Park', location: 'Prahran', department: 'Operations', availableHours: 38, scheduledHours: 30, utilisationPct: 79, unscheduledHours: 8, overtimeHours: 0 },
  { staffName: 'Alex Nguyen', location: 'South Yarra', department: 'Education', availableHours: 35, scheduledHours: 35, utilisationPct: 100, unscheduledHours: 0, overtimeHours: 1 },
  { staffName: 'David Kim', location: 'Prahran', department: 'Operations', availableHours: 24, scheduledHours: 18, utilisationPct: 75, unscheduledHours: 6, overtimeHours: 0 },
];

export const mockContractDistribution: ContractDistributionRecord[] = [
  { location: 'Melbourne CBD', department: 'Operations', fullTime: 18, partTime: 6, casual: 3, contractor: 1, totalStaff: 28 },
  { location: 'Melbourne CBD', department: 'Education', fullTime: 10, partTime: 3, casual: 2, contractor: 0, totalStaff: 15 },
  { location: 'Melbourne CBD', department: 'Administration', fullTime: 6, partTime: 2, casual: 0, contractor: 0, totalStaff: 8 },
  { location: 'South Yarra', department: 'Operations', fullTime: 14, partTime: 5, casual: 2, contractor: 1, totalStaff: 22 },
  { location: 'South Yarra', department: 'Education', fullTime: 8, partTime: 3, casual: 1, contractor: 0, totalStaff: 12 },
  { location: 'Prahran', department: 'Operations', fullTime: 11, partTime: 4, casual: 2, contractor: 1, totalStaff: 18 },
  { location: 'Prahran', department: 'Education', fullTime: 6, partTime: 3, casual: 1, contractor: 0, totalStaff: 10 },
  { location: 'Melbourne CBD', department: 'Management', fullTime: 5, partTime: 0, casual: 0, contractor: 0, totalStaff: 5 },
];

export const mockSkillsMatrix: SkillsMatrixRecord[] = [
  { staffName: 'Mark John', location: 'Melbourne CBD', department: 'Operations', skills: [{ name: 'First Aid', level: 'advanced' }, { name: 'Child Safety', level: 'expert' }, { name: 'Leadership', level: 'intermediate' }, { name: 'Conflict Resolution', level: 'advanced' }], totalSkills: 4, certifications: 3 },
  { staffName: 'Sarah Williams', location: 'Melbourne CBD', department: 'Education', skills: [{ name: 'Curriculum Planning', level: 'expert' }, { name: 'First Aid', level: 'advanced' }, { name: 'Mentoring', level: 'expert' }, { name: 'Assessment', level: 'advanced' }], totalSkills: 4, certifications: 3 },
  { staffName: 'James Chen', location: 'South Yarra', department: 'Operations', skills: [{ name: 'First Aid', level: 'intermediate' }, { name: 'Child Safety', level: 'intermediate' }], totalSkills: 2, certifications: 1 },
  { staffName: 'Emily Rodriguez', location: 'Melbourne CBD', department: 'Education', skills: [{ name: 'Child Safety', level: 'beginner' }], totalSkills: 1, certifications: 1 },
  { staffName: 'Tom Bradley', location: 'Melbourne CBD', department: 'Operations', skills: [{ name: 'First Aid', level: 'advanced' }, { name: 'Child Safety', level: 'advanced' }, { name: 'Leadership', level: 'advanced' }], totalSkills: 3, certifications: 2 },
  { staffName: 'Lisa Park', location: 'Prahran', department: 'Operations', skills: [{ name: 'First Aid', level: 'intermediate' }, { name: 'Child Safety', level: 'intermediate' }, { name: 'Administration', level: 'beginner' }], totalSkills: 3, certifications: 1 },
  { staffName: 'Alex Nguyen', location: 'South Yarra', department: 'Education', skills: [{ name: 'Curriculum Planning', level: 'intermediate' }, { name: 'First Aid', level: 'advanced' }, { name: 'Assessment', level: 'intermediate' }], totalSkills: 3, certifications: 2 },
  { staffName: 'David Kim', location: 'Prahran', department: 'Operations', skills: [{ name: 'First Aid', level: 'beginner' }, { name: 'Child Safety', level: 'beginner' }], totalSkills: 2, certifications: 0 },
];

export const workforceSummaryMetrics = {
  totalHeadcount: 118,
  totalFTE: 103.0,
  turnoverRate: 1.4,
  onboardingInProgress: 3,
  expiringSoon: 4,
  avgTenureMonths: 15,
};
