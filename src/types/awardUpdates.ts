// Award update types for managing Fair Work Commission rate changes

export interface AwardRateChange {
  classificationId: string;
  classificationName: string;
  previousRate: number;
  newRate: number;
  changePercent: number;
  changeType: 'increase' | 'decrease' | 'unchanged';
}

export interface AllowanceChange {
  allowanceId: string;
  allowanceName: string;
  previousRate: number;
  newRate: number;
  changePercent: number;
}

export interface PenaltyRateChange {
  penaltyType: string;
  previousMultiplier: number;
  newMultiplier: number;
}

export interface AwardUpdate {
  id: string;
  awardId: string;
  awardName: string;
  awardCode: string;
  version: string;
  previousVersion: string;
  releaseDate: string;
  effectiveDate: string;
  source: 'fwc' | 'manual' | 'imported';
  sourceUrl?: string;
  status: 'available' | 'installed' | 'scheduled' | 'skipped';
  
  // Summary
  totalChanges: number;
  rateIncreasePercent: number;
  
  // Detailed changes
  rateChanges: AwardRateChange[];
  allowanceChanges: AllowanceChange[];
  penaltyRateChanges: PenaltyRateChange[];
  
  // Notes
  summaryNotes: string;
  detailedNotes?: string;
  
  // Installation tracking
  installedAt?: string;
  installedBy?: string;
  scheduledFor?: string;
}

export interface TenantAwardVersion {
  awardId: string;
  currentVersion: string;
  installedAt: string;
  autoUpdate: boolean;
}

// Mock available updates for demonstration
export const MOCK_AVAILABLE_UPDATES: AwardUpdate[] = [
  {
    id: 'update-cs-2025',
    awardId: 'children-services-2020',
    awardName: "Children's Services Award 2020",
    awardCode: 'MA000120',
    version: 'FWC 2025-26',
    previousVersion: 'FWC 2024-25',
    releaseDate: '2025-06-01',
    effectiveDate: '2025-07-01',
    source: 'fwc',
    sourceUrl: 'https://www.fwc.gov.au/awards/childrens-services-award-ma000120',
    status: 'available',
    totalChanges: 18,
    rateIncreasePercent: 3.75,
    rateChanges: [
      { classificationId: 'cs-1.1', classificationName: 'Support Worker Level 1.1', previousRate: 24.36, newRate: 25.27, changePercent: 3.75, changeType: 'increase' },
      { classificationId: 'cs-2.1', classificationName: 'Support Worker Level 2.1', previousRate: 25.41, newRate: 26.36, changePercent: 3.75, changeType: 'increase' },
      { classificationId: 'cs-3.1', classificationName: 'Children\'s Services Employee Level 3.1', previousRate: 27.89, newRate: 28.94, changePercent: 3.75, changeType: 'increase' },
      { classificationId: 'cs-4.1', classificationName: 'Children\'s Services Employee Level 4.1', previousRate: 31.23, newRate: 32.40, changePercent: 3.75, changeType: 'increase' },
      { classificationId: 'cs-4a.1', classificationName: 'Children\'s Services Employee Level 4A.1', previousRate: 32.68, newRate: 33.91, changePercent: 3.75, changeType: 'increase' },
      { classificationId: 'cs-5.1', classificationName: 'Children\'s Services Employee Level 5.1', previousRate: 34.12, newRate: 35.40, changePercent: 3.75, changeType: 'increase' },
      { classificationId: 'cs-6.1', classificationName: 'Children\'s Services Employee Level 6.1', previousRate: 36.89, newRate: 38.27, changePercent: 3.75, changeType: 'increase' },
    ],
    allowanceChanges: [
      { allowanceId: 'cs-broken-shift', allowanceName: 'Broken Shift Allowance', previousRate: 18.46, newRate: 19.15, changePercent: 3.75 },
      { allowanceId: 'cs-first-aid', allowanceName: 'First Aid Allowance', previousRate: 3.32, newRate: 3.44, changePercent: 3.75 },
      { allowanceId: 'cs-meal', allowanceName: 'Meal Allowance', previousRate: 18.83, newRate: 19.54, changePercent: 3.75 },
      { allowanceId: 'cs-vehicle', allowanceName: 'Vehicle Allowance', previousRate: 0.96, newRate: 0.99, changePercent: 3.13 },
      { allowanceId: 'cs-sleepover', allowanceName: 'Sleepover Allowance', previousRate: 69.85, newRate: 72.47, changePercent: 3.75 },
      { allowanceId: 'cs-on-call', allowanceName: 'On-Call Allowance', previousRate: 15.42, newRate: 16.00, changePercent: 3.75 },
    ],
    penaltyRateChanges: [],
    summaryNotes: 'Annual Wage Review 2025 - Fair Work Commission has determined a 3.75% increase to minimum wages effective from 1 July 2025.',
    detailedNotes: 'This update applies the 2025 Annual Wage Review increase to all classification levels and expense-related allowances under the Children\'s Services Award 2020.',
  },
  {
    id: 'update-hp-2025',
    awardId: 'health-professionals-2020',
    awardName: 'Health Professionals and Support Services Award 2020',
    awardCode: 'MA000027',
    version: 'FWC 2025-26',
    previousVersion: 'FWC 2024-25',
    releaseDate: '2025-06-01',
    effectiveDate: '2025-07-01',
    source: 'fwc',
    sourceUrl: 'https://www.fwc.gov.au/awards/health-professionals-award-ma000027',
    status: 'available',
    totalChanges: 12,
    rateIncreasePercent: 3.75,
    rateChanges: [
      { classificationId: 'hp-1', classificationName: 'Support Services Level 1', previousRate: 23.45, newRate: 24.33, changePercent: 3.75, changeType: 'increase' },
      { classificationId: 'hp-2', classificationName: 'Support Services Level 2', previousRate: 24.89, newRate: 25.82, changePercent: 3.75, changeType: 'increase' },
      { classificationId: 'hp-3', classificationName: 'Health Professional Level 1', previousRate: 28.67, newRate: 29.75, changePercent: 3.75, changeType: 'increase' },
      { classificationId: 'hp-4', classificationName: 'Health Professional Level 2', previousRate: 32.15, newRate: 33.36, changePercent: 3.75, changeType: 'increase' },
    ],
    allowanceChanges: [
      { allowanceId: 'hp-on-call', allowanceName: 'On-Call Allowance', previousRate: 18.50, newRate: 19.19, changePercent: 3.75 },
      { allowanceId: 'hp-meal', allowanceName: 'Meal Allowance', previousRate: 17.25, newRate: 17.90, changePercent: 3.75 },
    ],
    penaltyRateChanges: [],
    summaryNotes: 'Annual Wage Review 2025 - Fair Work Commission has determined a 3.75% increase to minimum wages effective from 1 July 2025.',
  },
];

// Installed versions tracking
export const MOCK_TENANT_VERSIONS: TenantAwardVersion[] = [
  {
    awardId: 'children-services-2020',
    currentVersion: 'FWC 2024-25',
    installedAt: '2024-07-01T00:00:00Z',
    autoUpdate: false,
  },
];
