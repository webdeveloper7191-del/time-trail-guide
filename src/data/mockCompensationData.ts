import {
  SalaryBand,
  EmployeeCompensation,
  MeritMatrix,
  MeritRecommendation,
  BonusCalculation,
  PerformanceImprovementPlan,
  KeyRole,
  SuccessionCandidate,
} from '@/types/compensation';

// Salary Bands
export const mockSalaryBands: SalaryBand[] = [
  { id: 'band-1', level: 'entry', title: 'Entry Level', minSalary: 45000, midSalary: 52500, maxSalary: 60000, currency: 'AUD', effectiveDate: '2024-01-01' },
  { id: 'band-2', level: 'mid', title: 'Mid Level', minSalary: 60000, midSalary: 72500, maxSalary: 85000, currency: 'AUD', effectiveDate: '2024-01-01' },
  { id: 'band-3', level: 'senior', title: 'Senior', minSalary: 85000, midSalary: 100000, maxSalary: 115000, currency: 'AUD', effectiveDate: '2024-01-01' },
  { id: 'band-4', level: 'lead', title: 'Lead', minSalary: 110000, midSalary: 130000, maxSalary: 150000, currency: 'AUD', effectiveDate: '2024-01-01' },
  { id: 'band-5', level: 'principal', title: 'Principal', minSalary: 140000, midSalary: 165000, maxSalary: 190000, currency: 'AUD', effectiveDate: '2024-01-01' },
  { id: 'band-6', level: 'executive', title: 'Executive', minSalary: 180000, midSalary: 220000, maxSalary: 260000, currency: 'AUD', effectiveDate: '2024-01-01' },
];

// Employee Compensation
export const mockEmployeeCompensation: EmployeeCompensation[] = [
  { id: 'comp-1', staffId: 'staff-1', currentSalary: 95000, salaryBandId: 'band-3', compaRatio: 0.95, lastReviewDate: '2024-01-15', lastIncreaseDate: '2024-01-01', lastIncreasePercent: 4.5, bonusTarget: 10, currency: 'AUD' },
  { id: 'comp-2', staffId: 'staff-2', currentSalary: 72000, salaryBandId: 'band-2', compaRatio: 0.99, lastReviewDate: '2024-02-01', lastIncreaseDate: '2024-01-01', lastIncreasePercent: 3.0, bonusTarget: 8, currency: 'AUD' },
  { id: 'comp-3', staffId: 'staff-3', currentSalary: 58000, salaryBandId: 'band-1', compaRatio: 1.1, lastReviewDate: '2024-01-20', bonusTarget: 5, currency: 'AUD' },
  { id: 'comp-4', staffId: 'staff-4', currentSalary: 125000, salaryBandId: 'band-4', compaRatio: 0.96, lastReviewDate: '2024-03-01', lastIncreaseDate: '2024-01-01', lastIncreasePercent: 5.0, bonusTarget: 15, currency: 'AUD' },
];

// Merit Matrix
export const mockMeritMatrix: MeritMatrix = {
  id: 'merit-2024',
  name: '2024 Merit Increase Matrix',
  effectiveYear: 2024,
  budget: 4.0,
  matrix: [
    { performanceRating: 5, compaRatioRange: 'below', recommendedIncrease: 8, minIncrease: 6, maxIncrease: 10 },
    { performanceRating: 5, compaRatioRange: 'at', recommendedIncrease: 6, minIncrease: 5, maxIncrease: 8 },
    { performanceRating: 5, compaRatioRange: 'above', recommendedIncrease: 4, minIncrease: 3, maxIncrease: 6 },
    { performanceRating: 4, compaRatioRange: 'below', recommendedIncrease: 6, minIncrease: 5, maxIncrease: 8 },
    { performanceRating: 4, compaRatioRange: 'at', recommendedIncrease: 5, minIncrease: 4, maxIncrease: 6 },
    { performanceRating: 4, compaRatioRange: 'above', recommendedIncrease: 3, minIncrease: 2, maxIncrease: 5 },
    { performanceRating: 3, compaRatioRange: 'below', recommendedIncrease: 4, minIncrease: 3, maxIncrease: 5 },
    { performanceRating: 3, compaRatioRange: 'at', recommendedIncrease: 3, minIncrease: 2, maxIncrease: 4 },
    { performanceRating: 3, compaRatioRange: 'above', recommendedIncrease: 2, minIncrease: 0, maxIncrease: 3 },
    { performanceRating: 2, compaRatioRange: 'below', recommendedIncrease: 2, minIncrease: 0, maxIncrease: 3 },
    { performanceRating: 2, compaRatioRange: 'at', recommendedIncrease: 0, minIncrease: 0, maxIncrease: 2 },
    { performanceRating: 2, compaRatioRange: 'above', recommendedIncrease: 0, minIncrease: 0, maxIncrease: 0 },
    { performanceRating: 1, compaRatioRange: 'below', recommendedIncrease: 0, minIncrease: 0, maxIncrease: 0 },
    { performanceRating: 1, compaRatioRange: 'at', recommendedIncrease: 0, minIncrease: 0, maxIncrease: 0 },
    { performanceRating: 1, compaRatioRange: 'above', recommendedIncrease: 0, minIncrease: 0, maxIncrease: 0 },
  ],
};

// Merit Recommendations
export const mockMeritRecommendations: MeritRecommendation[] = [
  { id: 'merit-rec-1', staffId: 'staff-1', cycleYear: 2024, performanceRating: 4, currentSalary: 95000, currentCompaRatio: 0.95, recommendedIncreasePercent: 6, recommendedNewSalary: 100700, status: 'pending' },
  { id: 'merit-rec-2', staffId: 'staff-2', cycleYear: 2024, performanceRating: 4, currentSalary: 72000, currentCompaRatio: 0.99, recommendedIncreasePercent: 5, recommendedNewSalary: 75600, status: 'approved', approvedBy: 'manager-1', approvedAt: '2024-02-15', effectiveDate: '2024-03-01' },
  { id: 'merit-rec-3', staffId: 'staff-3', cycleYear: 2024, performanceRating: 3, currentSalary: 58000, currentCompaRatio: 1.1, recommendedIncreasePercent: 2, recommendedNewSalary: 59160, managerAdjustedPercent: 3, managerAdjustedSalary: 59740, justification: 'Taking on additional responsibilities', status: 'pending' },
];

// Bonus Calculations
export const mockBonusCalculations: BonusCalculation[] = [
  { id: 'bonus-1', staffId: 'staff-1', bonusType: 'annual', cycleYear: 2024, targetPercent: 10, performanceMultiplier: 1.25, companyMultiplier: 1.1, individualMultiplier: 1.0, calculatedAmount: 13062, finalAmount: 13062, status: 'approved' },
  { id: 'bonus-2', staffId: 'staff-2', bonusType: 'annual', cycleYear: 2024, targetPercent: 8, performanceMultiplier: 1.25, companyMultiplier: 1.1, individualMultiplier: 1.0, calculatedAmount: 7920, status: 'pending_approval' },
  { id: 'bonus-3', staffId: 'staff-4', bonusType: 'annual', cycleYear: 2024, targetPercent: 15, performanceMultiplier: 1.0, companyMultiplier: 1.1, individualMultiplier: 1.0, calculatedAmount: 20625, status: 'draft' },
];

// PIPs
export const mockPIPs: PerformanceImprovementPlan[] = [
  {
    id: 'pip-1',
    staffId: 'staff-5',
    managerId: 'staff-4',
    hrPartnerId: 'staff-1',
    status: 'active',
    reason: 'Consistent underperformance in meeting project deadlines and quality standards',
    performanceGaps: [
      'Missed 5 out of 8 project deadlines in Q3',
      'Quality issues resulting in 3 customer escalations',
      'Inadequate documentation practices',
    ],
    expectedOutcomes: [
      'Meet 90% of deadlines within agreed timeframes',
      'Zero customer escalations related to quality',
      'Complete documentation for all deliverables',
    ],
    supportProvided: [
      'Weekly 1:1 coaching sessions with manager',
      'Time management training course',
      'Reduced workload during improvement period',
    ],
    startDate: '2024-01-15',
    originalEndDate: '2024-04-15',
    currentEndDate: '2024-04-15',
    extensionCount: 0,
    milestones: [
      { id: 'ms-1', title: 'Complete time management training', description: 'Finish the assigned course', targetDate: '2024-02-01', completedDate: '2024-01-28', status: 'completed' },
      { id: 'ms-2', title: 'Deliver Project Alpha on time', description: 'Complete all deliverables by deadline', targetDate: '2024-02-28', status: 'in_progress' },
      { id: 'ms-3', title: 'Zero quality escalations for 30 days', description: 'Maintain quality standards', targetDate: '2024-03-15', status: 'pending' },
      { id: 'ms-4', title: 'Documentation compliance', description: 'All work fully documented', targetDate: '2024-04-01', status: 'pending' },
    ],
    checkIns: [
      { id: 'ci-1', scheduledDate: '2024-01-22', completedDate: '2024-01-22', attendees: ['staff-5', 'staff-4'], notes: 'Initial check-in. Employee acknowledges issues and committed to improvement.', progressRating: 2, nextSteps: 'Begin time management course', createdBy: 'staff-4' },
      { id: 'ci-2', scheduledDate: '2024-02-05', completedDate: '2024-02-05', attendees: ['staff-5', 'staff-4', 'staff-1'], notes: 'Good progress on training. Project Alpha planning underway.', progressRating: 3, nextSteps: 'Focus on Project Alpha milestones', createdBy: 'staff-4' },
    ],
    documents: [
      { id: 'doc-1', type: 'initial_notice', title: 'PIP Initial Notice - Signed', uploadedAt: '2024-01-15', uploadedBy: 'staff-1' },
    ],
    createdAt: '2024-01-10',
    updatedAt: '2024-02-05',
  },
];

// Key Roles for Succession
export const mockKeyRoles: KeyRole[] = [
  { id: 'role-1', title: 'Centre Director', department: 'Operations', currentHolderId: 'staff-1', criticality: 'essential', vacancyRisk: 'high', impactOfVacancy: 'Major operational disruption, regulatory compliance risk', requiredCompetencies: ['Leadership', 'Regulatory Compliance', 'Financial Management', 'Staff Development'], successorCount: 2, lastReviewedAt: '2024-01-15' },
  { id: 'role-2', title: 'Lead Educator', department: 'Education', currentHolderId: 'staff-2', criticality: 'important', vacancyRisk: 'medium', impactOfVacancy: 'Quality of education programs affected', requiredCompetencies: ['Early Childhood Education', 'Team Leadership', 'Parent Communication', 'Curriculum Development'], successorCount: 3, lastReviewedAt: '2024-01-20' },
  { id: 'role-3', title: 'Operations Manager', department: 'Operations', currentHolderId: 'staff-4', criticality: 'essential', vacancyRisk: 'critical', impactOfVacancy: 'Multi-centre coordination breakdown', requiredCompetencies: ['Multi-site Management', 'Strategic Planning', 'Budget Management', 'Crisis Management'], successorCount: 1, lastReviewedAt: '2024-02-01' },
];

// Succession Candidates
export const mockSuccessionCandidates: SuccessionCandidate[] = [
  {
    id: 'succ-1',
    staffId: 'staff-2',
    keyRoleId: 'role-1',
    readiness: 'ready_1_2_years',
    overallScore: 78,
    performanceScore: 85,
    potentialScore: 80,
    experienceScore: 70,
    competencyGaps: [
      { id: 'gap-1', competency: 'Financial Management', currentLevel: 3, requiredLevel: 5, gap: 2, developmentPriority: 'high' },
      { id: 'gap-2', competency: 'Regulatory Compliance', currentLevel: 4, requiredLevel: 5, gap: 1, developmentPriority: 'medium' },
    ],
    developmentActions: [
      { id: 'dev-1', title: 'Financial Management for Leaders', type: 'training', description: 'Complete finance training course', targetDate: '2024-06-30', status: 'in_progress' },
      { id: 'dev-2', title: 'Shadow Centre Director', type: 'stretch_assignment', description: 'Monthly shadowing sessions', targetDate: '2024-12-31', status: 'planned' },
    ],
    mentorId: 'staff-1',
    notes: 'Strong performer with high potential. Needs financial acumen development.',
    addedAt: '2023-06-01',
    lastAssessedAt: '2024-01-15',
  },
  {
    id: 'succ-2',
    staffId: 'staff-3',
    keyRoleId: 'role-1',
    readiness: 'ready_3_5_years',
    overallScore: 62,
    performanceScore: 70,
    potentialScore: 75,
    experienceScore: 45,
    competencyGaps: [
      { id: 'gap-3', competency: 'Leadership', currentLevel: 2, requiredLevel: 5, gap: 3, developmentPriority: 'high' },
      { id: 'gap-4', competency: 'Financial Management', currentLevel: 2, requiredLevel: 5, gap: 3, developmentPriority: 'high' },
      { id: 'gap-5', competency: 'Staff Development', currentLevel: 3, requiredLevel: 4, gap: 1, developmentPriority: 'medium' },
    ],
    developmentActions: [
      { id: 'dev-3', title: 'Emerging Leaders Program', type: 'training', description: '6-month leadership development', targetDate: '2024-12-31', status: 'planned' },
    ],
    addedAt: '2023-09-01',
    lastAssessedAt: '2024-01-15',
  },
  {
    id: 'succ-3',
    staffId: 'staff-6',
    keyRoleId: 'role-2',
    readiness: 'ready_now',
    overallScore: 88,
    performanceScore: 90,
    potentialScore: 85,
    experienceScore: 88,
    competencyGaps: [],
    developmentActions: [
      { id: 'dev-4', title: 'Acting Lead Educator', type: 'stretch_assignment', description: 'Cover during leave periods', targetDate: '2024-06-30', status: 'completed', completedDate: '2024-02-28' },
    ],
    mentorId: 'staff-2',
    notes: 'Fully ready to step into Lead Educator role. Has acted in role multiple times.',
    addedAt: '2022-03-01',
    lastAssessedAt: '2024-02-01',
  },
];
