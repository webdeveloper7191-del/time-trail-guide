// Australian Modern Awards Data
// Reference: Fair Work Commission - https://www.fwc.gov.au/awards-and-agreements/awards/modern-awards

export interface AwardClassification {
  id: string;
  level: string;
  description: string;
  baseHourlyRate: number;
  minAge?: number;
  qualificationRequired?: string;
}

export interface AustralianAward {
  id: string;
  code: string;
  name: string;
  shortName: string;
  industry: string;
  effectiveDate: string;
  classifications: AwardClassification[];
  casualLoading: number;
  saturdayPenalty: number;
  sundayPenalty: number;
  publicHolidayPenalty: number;
  eveningPenalty?: number;
  nightPenalty?: number;
  overtimeRates: {
    first2Hours: number;
    after2Hours: number;
    sundayOvertime: number;
  };
  allowances: {
    id: string;
    name: string;
    type: 'per_hour' | 'per_shift' | 'per_week' | 'per_km' | 'one_off';
    amount: number;
    description: string;
  }[];
}

export const australianAwards: AustralianAward[] = [
  {
    id: 'children-services-2020',
    code: 'MA000120',
    name: "Children's Services Award 2020",
    shortName: "Children's Services",
    industry: 'Childcare',
    effectiveDate: '2024-07-01',
    casualLoading: 25,
    saturdayPenalty: 150,
    sundayPenalty: 200,
    publicHolidayPenalty: 250,
    eveningPenalty: 110,
    overtimeRates: {
      first2Hours: 150,
      after2Hours: 200,
      sundayOvertime: 200,
    },
    classifications: [
      { id: 'cs-1-1', level: 'Level 1.1', description: 'Support Worker - Entry', baseHourlyRate: 22.46, qualificationRequired: 'None' },
      { id: 'cs-1-2', level: 'Level 1.2', description: 'Support Worker - 1 year experience', baseHourlyRate: 23.12 },
      { id: 'cs-1-3', level: 'Level 1.3', description: 'Support Worker - 2+ years experience', baseHourlyRate: 23.78 },
      { id: 'cs-2-1', level: 'Level 2.1', description: 'Children\'s Services Employee - Entry', baseHourlyRate: 24.44, qualificationRequired: 'Cert III or studying' },
      { id: 'cs-2-2', level: 'Level 2.2', description: 'Children\'s Services Employee - 1 year', baseHourlyRate: 25.10 },
      { id: 'cs-2-3', level: 'Level 2.3', description: 'Children\'s Services Employee - 2+ years', baseHourlyRate: 25.76 },
      { id: 'cs-3-1', level: 'Level 3.1', description: 'Qualified Employee - Cert III', baseHourlyRate: 26.98, qualificationRequired: 'Certificate III' },
      { id: 'cs-3-2', level: 'Level 3.2', description: 'Qualified Employee - 1 year', baseHourlyRate: 27.64 },
      { id: 'cs-3-3', level: 'Level 3.3', description: 'Qualified Employee - 2+ years', baseHourlyRate: 28.30 },
      { id: 'cs-3-4', level: 'Level 3.4', description: 'Qualified Employee - Senior', baseHourlyRate: 28.96 },
      { id: 'cs-4-1', level: 'Level 4.1', description: 'Diploma Qualified - Entry', baseHourlyRate: 30.28, qualificationRequired: 'Diploma' },
      { id: 'cs-4-2', level: 'Level 4.2', description: 'Diploma Qualified - 1 year', baseHourlyRate: 31.50 },
      { id: 'cs-4-3', level: 'Level 4.3', description: 'Diploma Qualified - 2+ years', baseHourlyRate: 32.72 },
      { id: 'cs-5-1', level: 'Level 5.1', description: 'Bachelor/ECT - Entry', baseHourlyRate: 34.60, qualificationRequired: 'Bachelor Degree' },
      { id: 'cs-5-2', level: 'Level 5.2', description: 'Bachelor/ECT - 1 year', baseHourlyRate: 35.82 },
      { id: 'cs-5-3', level: 'Level 5.3', description: 'Bachelor/ECT - 2+ years', baseHourlyRate: 37.04 },
      { id: 'cs-5-4', level: 'Level 5.4', description: 'Bachelor/ECT - Senior', baseHourlyRate: 38.26 },
      { id: 'cs-6-1', level: 'Level 6.1', description: 'Director - Small Service', baseHourlyRate: 40.14, qualificationRequired: 'Diploma + Experience' },
      { id: 'cs-6-2', level: 'Level 6.2', description: 'Director - Medium Service', baseHourlyRate: 42.02 },
      { id: 'cs-6-3', level: 'Level 6.3', description: 'Director - Large Service', baseHourlyRate: 43.90 },
    ],
    allowances: [
      { id: 'cs-fa', name: 'First Aid Allowance', type: 'per_week', amount: 18.93, description: 'Holder of current first aid certificate required to perform duties' },
      { id: 'cs-ed', name: 'Educational Leader Allowance', type: 'per_hour', amount: 2.34, description: 'Appointed educational program leader' },
      { id: 'cs-resp', name: 'Responsible Person Allowance', type: 'per_hour', amount: 1.50, description: 'Nominated responsible person in charge' },
      { id: 'cs-vehicle', name: 'Vehicle Allowance', type: 'per_km', amount: 0.96, description: 'Use of personal vehicle for work duties' },
      { id: 'cs-laundry', name: 'Laundry Allowance', type: 'per_week', amount: 6.30, description: 'Required to launder uniform' },
    ],
  },
  {
    id: 'educational-services-2020',
    code: 'MA000076',
    name: 'Educational Services (Teachers) Award 2020',
    shortName: 'Educational Services',
    industry: 'Education',
    effectiveDate: '2024-07-01',
    casualLoading: 25,
    saturdayPenalty: 150,
    sundayPenalty: 200,
    publicHolidayPenalty: 250,
    overtimeRates: {
      first2Hours: 150,
      after2Hours: 200,
      sundayOvertime: 200,
    },
    classifications: [
      { id: 'et-1', level: 'Level 1', description: 'Graduate Teacher - Year 1', baseHourlyRate: 42.50 },
      { id: 'et-2', level: 'Level 2', description: 'Graduate Teacher - Year 2', baseHourlyRate: 44.20 },
      { id: 'et-3', level: 'Level 3', description: 'Graduate Teacher - Year 3', baseHourlyRate: 45.90 },
      { id: 'et-4', level: 'Level 4', description: 'Proficient Teacher', baseHourlyRate: 48.30 },
      { id: 'et-5', level: 'Level 5', description: 'Highly Accomplished Teacher', baseHourlyRate: 52.40 },
      { id: 'et-6', level: 'Level 6', description: 'Lead Teacher', baseHourlyRate: 56.80 },
    ],
    allowances: [
      { id: 'et-spec', name: 'Special Education Allowance', type: 'per_week', amount: 45.00, description: 'Teaching students with special needs' },
      { id: 'et-coord', name: 'Coordinator Allowance', type: 'per_week', amount: 120.00, description: 'Curriculum or year level coordinator' },
    ],
  },
  {
    id: 'hospitality-2020',
    code: 'MA000009',
    name: 'Hospitality Industry (General) Award 2020',
    shortName: 'Hospitality',
    industry: 'Hospitality',
    effectiveDate: '2024-07-01',
    casualLoading: 25,
    saturdayPenalty: 125,
    sundayPenalty: 150,
    publicHolidayPenalty: 250,
    eveningPenalty: 115,
    nightPenalty: 130,
    overtimeRates: {
      first2Hours: 150,
      after2Hours: 200,
      sundayOvertime: 200,
    },
    classifications: [
      { id: 'hosp-1', level: 'Level 1', description: 'Introductory', baseHourlyRate: 21.38 },
      { id: 'hosp-2', level: 'Level 2', description: 'Food & Beverage Attendant Grade 1', baseHourlyRate: 22.46 },
      { id: 'hosp-3', level: 'Level 3', description: 'Food & Beverage Attendant Grade 2', baseHourlyRate: 23.34 },
      { id: 'hosp-4', level: 'Level 4', description: 'Food & Beverage Attendant Grade 3', baseHourlyRate: 24.44 },
      { id: 'hosp-5', level: 'Level 5', description: 'Cook Grade 1', baseHourlyRate: 25.10 },
      { id: 'hosp-6', level: 'Level 6', description: 'Cook Grade 2 / Supervisor', baseHourlyRate: 26.42 },
    ],
    allowances: [
      { id: 'hosp-meal', name: 'Meal Allowance', type: 'per_shift', amount: 16.89, description: 'When required to work overtime' },
      { id: 'hosp-split', name: 'Split Shift Allowance', type: 'per_shift', amount: 5.23, description: 'Working a split shift' },
    ],
  },
  {
    id: 'retail-2020',
    code: 'MA000004',
    name: 'General Retail Industry Award 2020',
    shortName: 'Retail',
    industry: 'Retail',
    effectiveDate: '2024-07-01',
    casualLoading: 25,
    saturdayPenalty: 125,
    sundayPenalty: 200,
    publicHolidayPenalty: 250,
    eveningPenalty: 125,
    overtimeRates: {
      first2Hours: 150,
      after2Hours: 200,
      sundayOvertime: 200,
    },
    classifications: [
      { id: 'ret-1', level: 'Level 1', description: 'Retail Employee - Entry', baseHourlyRate: 24.73 },
      { id: 'ret-2', level: 'Level 2', description: 'Retail Employee - Experienced', baseHourlyRate: 25.28 },
      { id: 'ret-3', level: 'Level 3', description: 'Retail Employee - Senior', baseHourlyRate: 25.68 },
      { id: 'ret-4', level: 'Level 4', description: 'Supervisor / Specialist', baseHourlyRate: 26.35 },
      { id: 'ret-5', level: 'Level 5', description: 'Manager - Small Store', baseHourlyRate: 27.29 },
      { id: 'ret-6', level: 'Level 6', description: 'Manager - Large Store', baseHourlyRate: 28.59 },
    ],
    allowances: [
      { id: 'ret-fa', name: 'First Aid Allowance', type: 'per_week', amount: 15.70, description: 'Appointed first aid officer' },
      { id: 'ret-cold', name: 'Cold Work Allowance', type: 'per_hour', amount: 0.62, description: 'Work in cold storage below 0°C' },
    ],
  },
  {
    id: 'fast-food-2020',
    code: 'MA000003',
    name: 'Fast Food Industry Award 2020',
    shortName: 'Fast Food',
    industry: 'Food Service',
    effectiveDate: '2024-07-01',
    casualLoading: 25,
    saturdayPenalty: 125,
    sundayPenalty: 150,
    publicHolidayPenalty: 250,
    nightPenalty: 115,
    overtimeRates: {
      first2Hours: 150,
      after2Hours: 200,
      sundayOvertime: 200,
    },
    classifications: [
      { id: 'ff-1', level: 'Level 1', description: 'Team Member - Entry', baseHourlyRate: 23.23 },
      { id: 'ff-2', level: 'Level 2', description: 'Team Member - Experienced', baseHourlyRate: 24.02 },
      { id: 'ff-3', level: 'Level 3', description: 'Shift Supervisor', baseHourlyRate: 25.01 },
      { id: 'ff-4', level: 'Level 4', description: 'Assistant Manager', baseHourlyRate: 26.18 },
      { id: 'ff-5', level: 'Level 5', description: 'Restaurant Manager', baseHourlyRate: 28.35 },
    ],
    allowances: [
      { id: 'ff-meal', name: 'Meal Allowance', type: 'per_shift', amount: 14.29, description: 'When required to work overtime' },
    ],
  },
  {
    id: 'clerks-2020',
    code: 'MA000002',
    name: 'Clerks—Private Sector Award 2020',
    shortName: 'Clerks',
    industry: 'Administration',
    effectiveDate: '2024-07-01',
    casualLoading: 25,
    saturdayPenalty: 150,
    sundayPenalty: 200,
    publicHolidayPenalty: 250,
    overtimeRates: {
      first2Hours: 150,
      after2Hours: 200,
      sundayOvertime: 200,
    },
    classifications: [
      { id: 'cl-1', level: 'Level 1', description: 'Clerk - Entry', baseHourlyRate: 24.73 },
      { id: 'cl-2', level: 'Level 2', description: 'Clerk - Experienced', baseHourlyRate: 25.77 },
      { id: 'cl-3', level: 'Level 3', description: 'Senior Clerk', baseHourlyRate: 26.73 },
      { id: 'cl-4', level: 'Level 4', description: 'Administrative Officer', baseHourlyRate: 28.09 },
      { id: 'cl-5', level: 'Level 5', description: 'Senior Administrative Officer', baseHourlyRate: 29.22 },
    ],
    allowances: [
      { id: 'cl-meal', name: 'Meal Allowance', type: 'per_shift', amount: 18.33, description: 'When required to work overtime' },
    ],
  },
  {
    id: 'social-2020',
    code: 'MA000100',
    name: 'Social, Community, Home Care and Disability Services Industry Award 2010',
    shortName: 'SCHADS',
    industry: 'Community Services',
    effectiveDate: '2024-07-01',
    casualLoading: 25,
    saturdayPenalty: 150,
    sundayPenalty: 200,
    publicHolidayPenalty: 250,
    eveningPenalty: 112.5,
    nightPenalty: 115,
    overtimeRates: {
      first2Hours: 150,
      after2Hours: 200,
      sundayOvertime: 200,
    },
    classifications: [
      { id: 'sc-1-1', level: 'Level 1.1', description: 'Home Care Employee', baseHourlyRate: 24.55 },
      { id: 'sc-1-2', level: 'Level 1.2', description: 'Home Care Employee - 1 year', baseHourlyRate: 25.21 },
      { id: 'sc-2-1', level: 'Level 2.1', description: 'Social & Community Services Employee', baseHourlyRate: 27.07 },
      { id: 'sc-2-2', level: 'Level 2.2', description: 'Social & Community Services - 1 year', baseHourlyRate: 27.73 },
      { id: 'sc-2-3', level: 'Level 2.3', description: 'Social & Community Services - 2+ years', baseHourlyRate: 28.39 },
      { id: 'sc-3-1', level: 'Level 3.1', description: 'Qualified Worker - Entry', baseHourlyRate: 29.71 },
      { id: 'sc-3-2', level: 'Level 3.2', description: 'Qualified Worker - 1 year', baseHourlyRate: 30.37 },
      { id: 'sc-4-1', level: 'Level 4.1', description: 'Senior Worker', baseHourlyRate: 32.35 },
      { id: 'sc-4-2', level: 'Level 4.2', description: 'Senior Worker - Experienced', baseHourlyRate: 33.01 },
    ],
    allowances: [
      { id: 'sc-fa', name: 'First Aid Allowance', type: 'per_week', amount: 18.93, description: 'Appointed first aid officer' },
      { id: 'sc-vehicle', name: 'Vehicle Allowance', type: 'per_km', amount: 0.96, description: 'Use of personal vehicle' },
      { id: 'sc-broken', name: 'Broken Shift Allowance', type: 'per_shift', amount: 18.12, description: 'Working a broken shift' },
      { id: 'sc-sleep', name: 'Sleepover Allowance', type: 'one_off', amount: 65.56, description: 'Required to sleep over at work' },
    ],
  },
];

// Helper function to get award by ID
export const getAwardById = (id: string): AustralianAward | undefined => {
  return australianAwards.find(award => award.id === id);
};

// Helper function to get classification by ID within an award
export const getClassificationById = (awardId: string, classificationId: string): AwardClassification | undefined => {
  const award = getAwardById(awardId);
  return award?.classifications.find(c => c.id === classificationId);
};

// Helper function to calculate rates based on employment type
export const calculateRates = (
  award: AustralianAward,
  classification: AwardClassification,
  employmentType: string
) => {
  const baseRate = classification.baseHourlyRate;
  const isCasual = employmentType === 'casual';
  const casualLoadedRate = isCasual ? baseRate * (1 + award.casualLoading / 100) : baseRate;

  return {
    baseRate,
    casualLoadedRate: isCasual ? casualLoadedRate : null,
    effectiveRate: casualLoadedRate,
    saturdayRate: casualLoadedRate * (award.saturdayPenalty / 100),
    sundayRate: casualLoadedRate * (award.sundayPenalty / 100),
    publicHolidayRate: casualLoadedRate * (award.publicHolidayPenalty / 100),
    eveningRate: award.eveningPenalty ? casualLoadedRate * (award.eveningPenalty / 100) : null,
    nightRate: award.nightPenalty ? casualLoadedRate * (award.nightPenalty / 100) : null,
    overtime: {
      first2Hours: casualLoadedRate * (award.overtimeRates.first2Hours / 100),
      after2Hours: casualLoadedRate * (award.overtimeRates.after2Hours / 100),
    },
  };
};

// Get unique industries for filtering
export const getIndustries = (): string[] => {
  return [...new Set(australianAwards.map(a => a.industry))];
};
