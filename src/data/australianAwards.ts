// Australian Modern Awards Data - 2025 FWC Rates
// Reference: Fair Work Commission - https://www.fwc.gov.au/awards-and-agreements/awards/modern-awards

export interface RateSchedule {
  effectiveFrom: string;
  weeklyRate: number;
  hourlyRate: number;
}

export interface AwardClassification {
  id: string;
  level: string;
  description: string;
  stream?: string;
  employeeType?: 'adult' | 'junior' | 'apprentice';
  baseHourlyRate: number;
  baseWeeklyRate?: number;
  minAge?: number;
  qualificationRequired?: string;
  // Multi-date effective support
  rateSchedule?: RateSchedule[];
}

export interface AustralianAward {
  id: string;
  code: string;
  name: string;
  shortName: string;
  industry: string;
  effectiveDate: string;
  version: string;
  streams?: string[];
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
    type: 'per_hour' | 'per_shift' | 'per_week' | 'per_km' | 'one_off' | 'per_day' | 'per_occasion';
    amount: number;
    description: string;
    effectiveFrom?: string;
  }[];
}

// Helper to calculate hourly from weekly (38hr week)
const weeklyToHourly = (weekly: number): number => Math.round((weekly / 38) * 100) / 100;

export const australianAwards: AustralianAward[] = [
  // ============================================
  // AGED CARE AWARD 2010 (MA000018)
  // Updated with 2025 FWC Work Value increases
  // ============================================
  {
    id: 'aged-care-2010',
    code: 'MA000018',
    name: 'Aged Care Award 2010',
    shortName: 'Aged Care',
    industry: 'Aged Care',
    effectiveDate: '2025-01-01',
    version: 'FWC 2025-26',
    streams: ['General', 'Direct Care', 'Food Services'],
    casualLoading: 25,
    saturdayPenalty: 150,
    sundayPenalty: 200,
    publicHolidayPenalty: 250,
    eveningPenalty: 115,
    nightPenalty: 115,
    overtimeRates: {
      first2Hours: 150,
      after2Hours: 200,
      sundayOvertime: 200,
    },
    classifications: [
      // Direct Care Stream - with October 2025 second tranche
      { 
        id: 'ac-dc-1', 
        level: 'Level 1', 
        stream: 'Direct Care',
        description: 'Direct Care - Introductory', 
        baseWeeklyRate: 1101.50,
        baseHourlyRate: weeklyToHourly(1101.50),
        rateSchedule: [
          { effectiveFrom: '2025-01-01', weeklyRate: 1101.50, hourlyRate: weeklyToHourly(1101.50) },
          { effectiveFrom: '2025-10-01', weeklyRate: 1138.05, hourlyRate: weeklyToHourly(1138.05) }, // +3.3% Oct increase
        ]
      },
      { 
        id: 'ac-dc-2', 
        level: 'Level 2', 
        stream: 'Direct Care',
        description: 'Direct Care - Direct Carer', 
        baseWeeklyRate: 1162.70,
        baseHourlyRate: weeklyToHourly(1162.70),
        qualificationRequired: 'Cert III recommended',
        rateSchedule: [
          { effectiveFrom: '2025-01-01', weeklyRate: 1162.70, hourlyRate: weeklyToHourly(1162.70) },
          { effectiveFrom: '2025-10-01', weeklyRate: 1201.29, hourlyRate: weeklyToHourly(1201.29) },
        ]
      },
      { 
        id: 'ac-dc-3', 
        level: 'Level 3', 
        stream: 'Direct Care',
        description: 'Direct Care - Qualified', 
        baseWeeklyRate: 1223.90,
        baseHourlyRate: weeklyToHourly(1223.90),
        qualificationRequired: 'Certificate III Individual Support',
        rateSchedule: [
          { effectiveFrom: '2025-01-01', weeklyRate: 1223.90, hourlyRate: weeklyToHourly(1223.90) },
          { effectiveFrom: '2025-10-01', weeklyRate: 1264.49, hourlyRate: weeklyToHourly(1264.49) },
        ]
      },
      { 
        id: 'ac-dc-4', 
        level: 'Level 4', 
        stream: 'Direct Care',
        description: 'Direct Care - Senior', 
        baseWeeklyRate: 1272.90,
        baseHourlyRate: weeklyToHourly(1272.90),
        qualificationRequired: 'Cert III + experience',
        rateSchedule: [
          { effectiveFrom: '2025-01-01', weeklyRate: 1272.90, hourlyRate: weeklyToHourly(1272.90) },
          { effectiveFrom: '2025-10-01', weeklyRate: 1315.13, hourlyRate: weeklyToHourly(1315.13) },
        ]
      },
      { 
        id: 'ac-dc-5', 
        level: 'Level 5', 
        stream: 'Direct Care',
        description: 'Direct Care - Specialist', 
        baseWeeklyRate: 1321.80,
        baseHourlyRate: weeklyToHourly(1321.80),
        qualificationRequired: 'Certificate IV Ageing Support',
        rateSchedule: [
          { effectiveFrom: '2025-01-01', weeklyRate: 1321.80, hourlyRate: weeklyToHourly(1321.80) },
          { effectiveFrom: '2025-10-01', weeklyRate: 1365.62, hourlyRate: weeklyToHourly(1365.62) },
        ]
      },
      { 
        id: 'ac-dc-6', 
        level: 'Level 6', 
        stream: 'Direct Care',
        description: 'Direct Care - Team Leader', 
        baseWeeklyRate: 1370.80,
        baseHourlyRate: weeklyToHourly(1370.80),
        qualificationRequired: 'Cert IV + leadership',
        rateSchedule: [
          { effectiveFrom: '2025-01-01', weeklyRate: 1370.80, hourlyRate: weeklyToHourly(1370.80) },
          { effectiveFrom: '2025-10-01', weeklyRate: 1416.27, hourlyRate: weeklyToHourly(1416.27) },
        ]
      },
      // General/Indirect Care Stream
      { 
        id: 'ac-gen-1', 
        level: 'Level 1', 
        stream: 'General',
        description: 'General - Entry', 
        baseWeeklyRate: 938.20,
        baseHourlyRate: weeklyToHourly(938.20),
      },
      { 
        id: 'ac-gen-2', 
        level: 'Level 2', 
        stream: 'General',
        description: 'General - Experienced', 
        baseWeeklyRate: 975.40,
        baseHourlyRate: weeklyToHourly(975.40),
      },
      { 
        id: 'ac-gen-3', 
        level: 'Level 3', 
        stream: 'General',
        description: 'General - Qualified', 
        baseWeeklyRate: 1012.90,
        baseHourlyRate: weeklyToHourly(1012.90),
      },
      { 
        id: 'ac-gen-4', 
        level: 'Level 4', 
        stream: 'General',
        description: 'General - Senior', 
        baseWeeklyRate: 1024.90,
        baseHourlyRate: weeklyToHourly(1024.90),
      },
      { 
        id: 'ac-gen-5', 
        level: 'Level 5', 
        stream: 'General',
        description: 'General - Specialist', 
        baseWeeklyRate: 1059.60,
        baseHourlyRate: weeklyToHourly(1059.60),
      },
      { 
        id: 'ac-gen-6', 
        level: 'Level 6', 
        stream: 'General',
        description: 'General - Advanced', 
        baseWeeklyRate: 1116.60,
        baseHourlyRate: weeklyToHourly(1116.60),
      },
      { 
        id: 'ac-gen-7', 
        level: 'Level 7', 
        stream: 'General',
        description: 'General - Team Leader', 
        baseWeeklyRate: 1136.70,
        baseHourlyRate: weeklyToHourly(1136.70),
      },
      // Food Services Stream
      { 
        id: 'ac-fs-1', 
        level: 'Level 1', 
        stream: 'Food Services',
        description: 'Food Services - Entry', 
        baseWeeklyRate: 938.20,
        baseHourlyRate: weeklyToHourly(938.20),
      },
      { 
        id: 'ac-fs-2', 
        level: 'Level 2', 
        stream: 'Food Services',
        description: 'Food Services - Cook Grade 1', 
        baseWeeklyRate: 975.40,
        baseHourlyRate: weeklyToHourly(975.40),
      },
      { 
        id: 'ac-fs-3', 
        level: 'Level 3', 
        stream: 'Food Services',
        description: 'Food Services - Cook Grade 2', 
        baseWeeklyRate: 1012.90,
        baseHourlyRate: weeklyToHourly(1012.90),
        qualificationRequired: 'Cert III Commercial Cookery',
      },
      { 
        id: 'ac-fs-4', 
        level: 'Level 4', 
        stream: 'Food Services',
        description: 'Food Services - Chef', 
        baseWeeklyRate: 1059.60,
        baseHourlyRate: weeklyToHourly(1059.60),
        qualificationRequired: 'Cert IV Hospitality',
      },
      { 
        id: 'ac-fs-5', 
        level: 'Level 5', 
        stream: 'Food Services',
        description: 'Food Services - Head Chef', 
        baseWeeklyRate: 1116.60,
        baseHourlyRate: weeklyToHourly(1116.60),
      },
    ],
    allowances: [
      { id: 'ac-fa', name: 'First Aid Allowance', type: 'per_week', amount: 18.93, description: 'Holder of current first aid certificate' },
      { id: 'ac-laundry', name: 'Laundry Allowance', type: 'per_week', amount: 3.55, description: 'Laundering uniform' },
      { id: 'ac-vehicle', name: 'Vehicle Allowance', type: 'per_km', amount: 0.98, description: 'Use of personal vehicle', effectiveFrom: '2025-07-01' },
      { id: 'ac-meal', name: 'Meal Allowance', type: 'per_occasion', amount: 18.58, description: 'Overtime meal allowance', effectiveFrom: '2025-07-01' },
      { id: 'ac-uniform', name: 'Uniform Allowance', type: 'per_week', amount: 6.25, description: 'Required to wear uniform' },
      { id: 'ac-oncall', name: 'On-Call Allowance', type: 'per_day', amount: 21.40, description: 'Required to be on-call' },
    ],
  },

  // ============================================
  // NURSES AWARD 2020 (MA000034)
  // With RN/EN/NP classifications
  // ============================================
  {
    id: 'nurses-2020',
    code: 'MA000034',
    name: 'Nurses Award 2020',
    shortName: 'Nurses',
    industry: 'Healthcare',
    effectiveDate: '2025-07-01',
    version: 'FWC 2025-26',
    streams: ['Registered Nurse', 'Enrolled Nurse', 'Nurse Practitioner', 'Nursing Assistant'],
    casualLoading: 25,
    saturdayPenalty: 150,
    sundayPenalty: 175,
    publicHolidayPenalty: 250,
    eveningPenalty: 112.5,
    nightPenalty: 125,
    overtimeRates: {
      first2Hours: 150,
      after2Hours: 200,
      sundayOvertime: 200,
    },
    classifications: [
      // Nursing Assistants
      { 
        id: 'na-1', 
        level: '1st Year', 
        stream: 'Nursing Assistant',
        description: 'Nursing Assistant - 1st Year', 
        baseWeeklyRate: 1003.10,
        baseHourlyRate: 26.40,
      },
      { 
        id: 'na-2', 
        level: '2nd Year', 
        stream: 'Nursing Assistant',
        description: 'Nursing Assistant - 2nd Year', 
        baseWeeklyRate: 1018.90,
        baseHourlyRate: 26.81,
      },
      { 
        id: 'na-3', 
        level: '3rd Year+', 
        stream: 'Nursing Assistant',
        description: 'Nursing Assistant - 3rd Year and thereafter', 
        baseWeeklyRate: 1035.20,
        baseHourlyRate: 27.24,
      },
      { 
        id: 'na-exp', 
        level: 'Experienced', 
        stream: 'Nursing Assistant',
        description: 'Nursing Assistant - Experienced (Cert III)', 
        baseWeeklyRate: 1068.40,
        baseHourlyRate: 28.12,
        qualificationRequired: 'Certificate III',
      },
      // Student Enrolled Nurses
      { 
        id: 'en-student-u21', 
        level: 'Student (<21)', 
        stream: 'Enrolled Nurse',
        description: 'Student Enrolled Nurse - Under 21', 
        baseWeeklyRate: 931.90,
        baseHourlyRate: 24.52,
        employeeType: 'junior',
      },
      { 
        id: 'en-student-21', 
        level: 'Student (21+)', 
        stream: 'Enrolled Nurse',
        description: 'Student Enrolled Nurse - 21+ years', 
        baseWeeklyRate: 978.20,
        baseHourlyRate: 25.74,
      },
      // Enrolled Nurses
      { 
        id: 'en-pp1', 
        level: 'Pay Point 1', 
        stream: 'Enrolled Nurse',
        description: 'Enrolled Nurse - Pay Point 1', 
        baseWeeklyRate: 1088.20,
        baseHourlyRate: 28.64,
        qualificationRequired: 'Diploma of Nursing',
      },
      { 
        id: 'en-pp2', 
        level: 'Pay Point 2', 
        stream: 'Enrolled Nurse',
        description: 'Enrolled Nurse - Pay Point 2', 
        baseWeeklyRate: 1102.60,
        baseHourlyRate: 29.02,
      },
      { 
        id: 'en-pp3', 
        level: 'Pay Point 3', 
        stream: 'Enrolled Nurse',
        description: 'Enrolled Nurse - Pay Point 3', 
        baseWeeklyRate: 1117.30,
        baseHourlyRate: 29.40,
      },
      { 
        id: 'en-pp4', 
        level: 'Pay Point 4', 
        stream: 'Enrolled Nurse',
        description: 'Enrolled Nurse - Pay Point 4', 
        baseWeeklyRate: 1133.40,
        baseHourlyRate: 29.83,
      },
      { 
        id: 'en-pp5', 
        level: 'Pay Point 5', 
        stream: 'Enrolled Nurse',
        description: 'Enrolled Nurse - Pay Point 5', 
        baseWeeklyRate: 1144.80,
        baseHourlyRate: 30.13,
      },
      // Registered Nurses - Level 1
      { 
        id: 'rn-l1-pp1', 
        level: 'Level 1.1', 
        stream: 'Registered Nurse',
        description: 'RN Level 1 - Pay Point 1', 
        baseWeeklyRate: 1164.20,
        baseHourlyRate: 30.64,
        qualificationRequired: 'Bachelor of Nursing',
      },
      { 
        id: 'rn-l1-pp2', 
        level: 'Level 1.2', 
        stream: 'Registered Nurse',
        description: 'RN Level 1 - Pay Point 2', 
        baseWeeklyRate: 1188.10,
        baseHourlyRate: 31.27,
      },
      { 
        id: 'rn-l1-pp3', 
        level: 'Level 1.3', 
        stream: 'Registered Nurse',
        description: 'RN Level 1 - Pay Point 3', 
        baseWeeklyRate: 1217.20,
        baseHourlyRate: 32.03,
      },
      { 
        id: 'rn-l1-pp4', 
        level: 'Level 1.4', 
        stream: 'Registered Nurse',
        description: 'RN Level 1 - Pay Point 4', 
        baseWeeklyRate: 1249.60,
        baseHourlyRate: 32.88,
      },
      { 
        id: 'rn-l1-pp5', 
        level: 'Level 1.5', 
        stream: 'Registered Nurse',
        description: 'RN Level 1 - Pay Point 5', 
        baseWeeklyRate: 1288.00,
        baseHourlyRate: 33.89,
      },
      { 
        id: 'rn-l1-pp6', 
        level: 'Level 1.6', 
        stream: 'Registered Nurse',
        description: 'RN Level 1 - Pay Point 6', 
        baseWeeklyRate: 1325.20,
        baseHourlyRate: 34.87,
      },
      { 
        id: 'rn-l1-pp7', 
        level: 'Level 1.7', 
        stream: 'Registered Nurse',
        description: 'RN Level 1 - Pay Point 7', 
        baseWeeklyRate: 1363.50,
        baseHourlyRate: 35.88,
      },
      { 
        id: 'rn-l1-pp8', 
        level: 'Level 1.8+', 
        stream: 'Registered Nurse',
        description: 'RN Level 1 - Pay Point 8+', 
        baseWeeklyRate: 1399.00,
        baseHourlyRate: 36.82,
      },
      // Registered Nurses - Level 2 (Clinical Nurse)
      { 
        id: 'rn-l2-pp1', 
        level: 'Level 2.1', 
        stream: 'Registered Nurse',
        description: 'RN Level 2 (Clinical) - Pay Point 1', 
        baseWeeklyRate: 1436.20,
        baseHourlyRate: 37.79,
      },
      { 
        id: 'rn-l2-pp2', 
        level: 'Level 2.2', 
        stream: 'Registered Nurse',
        description: 'RN Level 2 (Clinical) - Pay Point 2', 
        baseWeeklyRate: 1459.00,
        baseHourlyRate: 38.39,
      },
      { 
        id: 'rn-l2-pp3', 
        level: 'Level 2.3', 
        stream: 'Registered Nurse',
        description: 'RN Level 2 (Clinical) - Pay Point 3', 
        baseWeeklyRate: 1484.30,
        baseHourlyRate: 39.06,
      },
      { 
        id: 'rn-l2-pp4', 
        level: 'Level 2.4+', 
        stream: 'Registered Nurse',
        description: 'RN Level 2 (Clinical) - Pay Point 4+', 
        baseWeeklyRate: 1508.60,
        baseHourlyRate: 39.70,
      },
      // Registered Nurses - Level 3 (Nurse Unit Manager)
      { 
        id: 'rn-l3-pp1', 
        level: 'Level 3.1', 
        stream: 'Registered Nurse',
        description: 'RN Level 3 (NUM) - Pay Point 1', 
        baseWeeklyRate: 1557.20,
        baseHourlyRate: 40.98,
      },
      { 
        id: 'rn-l3-pp2', 
        level: 'Level 3.2', 
        stream: 'Registered Nurse',
        description: 'RN Level 3 (NUM) - Pay Point 2', 
        baseWeeklyRate: 1585.80,
        baseHourlyRate: 41.73,
      },
      { 
        id: 'rn-l3-pp3', 
        level: 'Level 3.3', 
        stream: 'Registered Nurse',
        description: 'RN Level 3 (NUM) - Pay Point 3', 
        baseWeeklyRate: 1613.20,
        baseHourlyRate: 42.45,
      },
      { 
        id: 'rn-l3-pp4', 
        level: 'Level 3.4+', 
        stream: 'Registered Nurse',
        description: 'RN Level 3 (NUM) - Pay Point 4+', 
        baseWeeklyRate: 1642.10,
        baseHourlyRate: 43.21,
      },
      // Registered Nurses - Level 4 (Assistant Director of Nursing)
      { 
        id: 'rn-l4-g1', 
        level: 'Level 4 Grade 1', 
        stream: 'Registered Nurse',
        description: 'RN Level 4 (ADON) - Grade 1', 
        baseWeeklyRate: 1777.30,
        baseHourlyRate: 46.77,
      },
      { 
        id: 'rn-l4-g2', 
        level: 'Level 4 Grade 2', 
        stream: 'Registered Nurse',
        description: 'RN Level 4 (ADON) - Grade 2', 
        baseWeeklyRate: 1904.60,
        baseHourlyRate: 50.12,
      },
      { 
        id: 'rn-l4-g3', 
        level: 'Level 4 Grade 3', 
        stream: 'Registered Nurse',
        description: 'RN Level 4 (ADON) - Grade 3', 
        baseWeeklyRate: 2015.80,
        baseHourlyRate: 53.05,
      },
      // Registered Nurses - Level 5 (Director of Nursing)
      { 
        id: 'rn-l5-g1', 
        level: 'Level 5 Grade 1', 
        stream: 'Registered Nurse',
        description: 'RN Level 5 (DON) - Grade 1 (<25 beds)', 
        baseWeeklyRate: 1793.40,
        baseHourlyRate: 47.19,
      },
      { 
        id: 'rn-l5-g2', 
        level: 'Level 5 Grade 2', 
        stream: 'Registered Nurse',
        description: 'RN Level 5 (DON) - Grade 2 (25-49 beds)', 
        baseWeeklyRate: 1888.70,
        baseHourlyRate: 49.70,
      },
      { 
        id: 'rn-l5-g3', 
        level: 'Level 5 Grade 3', 
        stream: 'Registered Nurse',
        description: 'RN Level 5 (DON) - Grade 3 (50-99 beds)', 
        baseWeeklyRate: 2015.80,
        baseHourlyRate: 53.05,
      },
      { 
        id: 'rn-l5-g4', 
        level: 'Level 5 Grade 4', 
        stream: 'Registered Nurse',
        description: 'RN Level 5 (DON) - Grade 4 (100-199 beds)', 
        baseWeeklyRate: 2141.40,
        baseHourlyRate: 56.35,
      },
      { 
        id: 'rn-l5-g5', 
        level: 'Level 5 Grade 5', 
        stream: 'Registered Nurse',
        description: 'RN Level 5 (DON) - Grade 5 (200-299 beds)', 
        baseWeeklyRate: 2361.90,
        baseHourlyRate: 62.16,
      },
      { 
        id: 'rn-l5-g6', 
        level: 'Level 5 Grade 6', 
        stream: 'Registered Nurse',
        description: 'RN Level 5 (DON) - Grade 6 (300+ beds)', 
        baseWeeklyRate: 2584.20,
        baseHourlyRate: 68.01,
      },
      // Nurse Practitioners
      { 
        id: 'np-1', 
        level: '1st Year', 
        stream: 'Nurse Practitioner',
        description: 'Nurse Practitioner - 1st Year', 
        baseWeeklyRate: 1791.90,
        baseHourlyRate: 47.16,
        qualificationRequired: 'Masters + AHPRA endorsement',
      },
      { 
        id: 'np-2', 
        level: '2nd Year', 
        stream: 'Nurse Practitioner',
        description: 'Nurse Practitioner - 2nd Year', 
        baseWeeklyRate: 1845.10,
        baseHourlyRate: 48.56,
      },
    ],
    allowances: [
      { id: 'nu-fa', name: 'First Aid Allowance', type: 'per_week', amount: 18.93, description: 'Appointed first aid officer' },
      { id: 'nu-oncall', name: 'On-Call Allowance', type: 'per_day', amount: 24.08, description: 'Required to be on-call' },
      { id: 'nu-meal', name: 'Meal Allowance', type: 'per_occasion', amount: 19.93, description: 'Overtime meal allowance', effectiveFrom: '2025-07-01' },
      { id: 'nu-vehicle', name: 'Vehicle Allowance', type: 'per_km', amount: 0.98, description: 'Use of personal vehicle', effectiveFrom: '2025-07-01' },
      { id: 'nu-incharge', name: 'In-Charge Allowance', type: 'per_shift', amount: 16.93, description: 'Nurse in charge of shift' },
      { id: 'nu-lead', name: 'Lead Apron Allowance', type: 'per_shift', amount: 1.61, description: 'Required to wear lead apron' },
    ],
  },

  // ============================================
  // CHILDREN'S SERVICES AWARD 2020 (MA000120)
  // Updated 2025 rates
  // ============================================
  {
    id: 'children-services-2020',
    code: 'MA000120',
    name: "Children's Services Award 2020",
    shortName: "Children's Services",
    industry: 'Childcare',
    effectiveDate: '2025-07-01',
    version: 'FWC 2025-26',
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
      { id: 'cs-1-1', level: 'Level 1.1', description: 'Support Worker - Entry', baseWeeklyRate: 958.97, baseHourlyRate: 25.24, qualificationRequired: 'None' },
      { id: 'cs-1-2', level: 'Level 1.2', description: 'Support Worker - 1 year experience', baseWeeklyRate: 983.98, baseHourlyRate: 25.89 },
      { id: 'cs-1-3', level: 'Level 1.3', description: 'Support Worker - 2+ years experience', baseWeeklyRate: 1009.46, baseHourlyRate: 26.56 },
      { id: 'cs-2-1', level: 'Level 2.1', description: 'CSE - Entry', baseWeeklyRate: 1035.27, baseHourlyRate: 27.24, qualificationRequired: 'Cert III or studying' },
      { id: 'cs-2-2', level: 'Level 2.2', description: 'CSE - 1 year', baseWeeklyRate: 1061.08, baseHourlyRate: 27.92 },
      { id: 'cs-2-3', level: 'Level 2.3', description: 'CSE - 2+ years', baseWeeklyRate: 1086.70, baseHourlyRate: 28.60 },
      { id: 'cs-3-1', level: 'Level 3.1', description: 'Qualified Employee - Cert III', baseWeeklyRate: 1137.84, baseHourlyRate: 29.94, qualificationRequired: 'Certificate III' },
      { id: 'cs-3-2', level: 'Level 3.2', description: 'Qualified Employee - 1 year', baseWeeklyRate: 1163.46, baseHourlyRate: 30.62 },
      { id: 'cs-3-3', level: 'Level 3.3', description: 'Qualified Employee - 2+ years', baseWeeklyRate: 1189.27, baseHourlyRate: 31.30 },
      { id: 'cs-3-4', level: 'Level 3.4', description: 'Qualified Employee - Senior', baseWeeklyRate: 1214.89, baseHourlyRate: 31.97 },
      { id: 'cs-4-1', level: 'Level 4.1', description: 'Diploma Qualified - Entry', baseWeeklyRate: 1266.03, baseHourlyRate: 33.32, qualificationRequired: 'Diploma' },
      { id: 'cs-4-2', level: 'Level 4.2', description: 'Diploma Qualified - 1 year', baseWeeklyRate: 1316.98, baseHourlyRate: 34.66 },
      { id: 'cs-4-3', level: 'Level 4.3', description: 'Diploma Qualified - 2+ years', baseWeeklyRate: 1368.12, baseHourlyRate: 36.00 },
      { id: 'cs-4a-1', level: 'Level 4A.1', description: 'Room/2IC - Entry', baseWeeklyRate: 1291.46, baseHourlyRate: 33.99, qualificationRequired: 'Diploma' },
      { id: 'cs-4a-2', level: 'Level 4A.2', description: 'Room/2IC - 1 year', baseWeeklyRate: 1342.41, baseHourlyRate: 35.33 },
      { id: 'cs-4a-3', level: 'Level 4A.3', description: 'Room/2IC - 2+ years', baseWeeklyRate: 1393.36, baseHourlyRate: 36.67 },
      { id: 'cs-5-1', level: 'Level 5.1', description: 'Bachelor/ECT - Entry', baseWeeklyRate: 1444.50, baseHourlyRate: 38.01, qualificationRequired: 'Bachelor Degree' },
      { id: 'cs-5-2', level: 'Level 5.2', description: 'Bachelor/ECT - 1 year', baseWeeklyRate: 1495.64, baseHourlyRate: 39.36 },
      { id: 'cs-5-3', level: 'Level 5.3', description: 'Bachelor/ECT - 2+ years', baseWeeklyRate: 1546.59, baseHourlyRate: 40.70 },
      { id: 'cs-5-4', level: 'Level 5.4', description: 'Bachelor/ECT - Senior', baseWeeklyRate: 1597.73, baseHourlyRate: 42.05 },
      { id: 'cs-6-1', level: 'Level 6.1', description: 'Director - Small Service', baseWeeklyRate: 1674.20, baseHourlyRate: 44.06, qualificationRequired: 'Diploma + Experience' },
      { id: 'cs-6-2', level: 'Level 6.2', description: 'Director - Medium Service', baseWeeklyRate: 1750.67, baseHourlyRate: 46.07 },
      { id: 'cs-6-3', level: 'Level 6.3', description: 'Director - Large Service', baseWeeklyRate: 1827.14, baseHourlyRate: 48.08 },
    ],
    allowances: [
      { id: 'cs-fa', name: 'First Aid Allowance', type: 'per_week', amount: 19.50, description: 'Holder of current first aid certificate', effectiveFrom: '2025-07-01' },
      { id: 'cs-ed', name: 'Educational Leader Allowance', type: 'per_hour', amount: 2.42, description: 'Appointed educational program leader', effectiveFrom: '2025-07-01' },
      { id: 'cs-resp', name: 'Responsible Person Allowance', type: 'per_hour', amount: 1.55, description: 'Nominated responsible person in charge' },
      { id: 'cs-vehicle', name: 'Vehicle Allowance', type: 'per_km', amount: 0.99, description: 'Use of personal vehicle for work duties', effectiveFrom: '2025-07-01' },
      { id: 'cs-laundry', name: 'Laundry Allowance', type: 'per_week', amount: 6.52, description: 'Required to launder uniform', effectiveFrom: '2025-07-01' },
      { id: 'cs-meal', name: 'Meal Allowance', type: 'per_occasion', amount: 19.54, description: 'Overtime meal allowance', effectiveFrom: '2025-07-01' },
      { id: 'cs-sleepover', name: 'Sleepover Allowance', type: 'one_off', amount: 72.47, description: 'Required to sleep over at work', effectiveFrom: '2025-07-01' },
      { id: 'cs-oncall', name: 'On-Call Allowance', type: 'per_day', amount: 16.00, description: 'Required to be on-call', effectiveFrom: '2025-07-01' },
      { id: 'cs-broken', name: 'Broken Shift Allowance', type: 'per_shift', amount: 19.15, description: 'Working a broken shift', effectiveFrom: '2025-07-01' },
    ],
  },

  // ============================================
  // HEALTH PROFESSIONALS AWARD 2020 (MA000027)
  // ============================================
  {
    id: 'health-professionals-2020',
    code: 'MA000027',
    name: 'Health Professionals and Support Services Award 2020',
    shortName: 'Health Professionals',
    industry: 'Healthcare',
    effectiveDate: '2025-07-01',
    version: 'FWC 2025-26',
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
      { id: 'hp-ss-1', level: 'Support 1', description: 'Support Services Level 1', baseWeeklyRate: 913.91, baseHourlyRate: 24.05 },
      { id: 'hp-ss-2', level: 'Support 2', description: 'Support Services Level 2', baseWeeklyRate: 951.11, baseHourlyRate: 25.03 },
      { id: 'hp-ss-3', level: 'Support 3', description: 'Support Services Level 3', baseWeeklyRate: 988.14, baseHourlyRate: 26.00 },
      { id: 'hp-ss-4', level: 'Support 4', description: 'Support Services Level 4', baseWeeklyRate: 1012.90, baseHourlyRate: 26.66 },
      { id: 'hp-ss-5', level: 'Support 5', description: 'Support Services Level 5', baseWeeklyRate: 1048.43, baseHourlyRate: 27.59 },
      { id: 'hp-ss-6', level: 'Support 6', description: 'Support Services Level 6', baseWeeklyRate: 1100.28, baseHourlyRate: 28.95 },
      { id: 'hp-ss-7', level: 'Support 7', description: 'Support Services Level 7', baseWeeklyRate: 1137.84, baseHourlyRate: 29.94 },
      { id: 'hp-ss-8', level: 'Support 8', description: 'Support Services Level 8', baseWeeklyRate: 1176.15, baseHourlyRate: 30.95 },
      { id: 'hp-ss-9', level: 'Support 9', description: 'Support Services Level 9', baseWeeklyRate: 1232.37, baseHourlyRate: 32.43 },
      { id: 'hp-1-pp1', level: 'HP Level 1.1', description: 'Health Professional Level 1 - Pay Point 1', baseWeeklyRate: 1100.28, baseHourlyRate: 28.95, qualificationRequired: 'Relevant degree' },
      { id: 'hp-1-pp2', level: 'HP Level 1.2', description: 'Health Professional Level 1 - Pay Point 2', baseWeeklyRate: 1137.84, baseHourlyRate: 29.94 },
      { id: 'hp-1-pp3', level: 'HP Level 1.3', description: 'Health Professional Level 1 - Pay Point 3', baseWeeklyRate: 1176.15, baseHourlyRate: 30.95 },
      { id: 'hp-1-pp4', level: 'HP Level 1.4', description: 'Health Professional Level 1 - Pay Point 4', baseWeeklyRate: 1232.37, baseHourlyRate: 32.43 },
      { id: 'hp-2-pp1', level: 'HP Level 2.1', description: 'Health Professional Level 2 - Pay Point 1', baseWeeklyRate: 1270.12, baseHourlyRate: 33.42 },
      { id: 'hp-2-pp2', level: 'HP Level 2.2', description: 'Health Professional Level 2 - Pay Point 2', baseWeeklyRate: 1316.98, baseHourlyRate: 34.66 },
      { id: 'hp-2-pp3', level: 'HP Level 2.3', description: 'Health Professional Level 2 - Pay Point 3', baseWeeklyRate: 1368.12, baseHourlyRate: 36.00 },
      { id: 'hp-2-pp4', level: 'HP Level 2.4', description: 'Health Professional Level 2 - Pay Point 4', baseWeeklyRate: 1419.07, baseHourlyRate: 37.34 },
      { id: 'hp-3-pp1', level: 'HP Level 3.1', description: 'Health Professional Level 3 - Pay Point 1', baseWeeklyRate: 1470.02, baseHourlyRate: 38.68 },
      { id: 'hp-3-pp2', level: 'HP Level 3.2', description: 'Health Professional Level 3 - Pay Point 2', baseWeeklyRate: 1520.97, baseHourlyRate: 40.03 },
      { id: 'hp-3-pp3', level: 'HP Level 3.3', description: 'Health Professional Level 3 - Pay Point 3', baseWeeklyRate: 1572.11, baseHourlyRate: 41.37 },
      { id: 'hp-3-pp4', level: 'HP Level 3.4', description: 'Health Professional Level 3 - Pay Point 4', baseWeeklyRate: 1623.06, baseHourlyRate: 42.71 },
      { id: 'hp-4-pp1', level: 'HP Level 4.1', description: 'Health Professional Level 4 - Pay Point 1', baseWeeklyRate: 1674.20, baseHourlyRate: 44.06 },
      { id: 'hp-4-pp2', level: 'HP Level 4.2', description: 'Health Professional Level 4 - Pay Point 2', baseWeeklyRate: 1750.67, baseHourlyRate: 46.07 },
      { id: 'hp-4-pp3', level: 'HP Level 4.3', description: 'Health Professional Level 4 - Pay Point 3', baseWeeklyRate: 1827.14, baseHourlyRate: 48.08 },
    ],
    allowances: [
      { id: 'hp-meal', name: 'Meal Allowance', type: 'per_occasion', amount: 20.78, description: 'Overtime meal allowance', effectiveFrom: '2025-07-01' },
      { id: 'hp-oncall', name: 'On-Call Allowance', type: 'per_day', amount: 19.19, description: 'Required to be on-call', effectiveFrom: '2025-07-01' },
      { id: 'hp-vehicle', name: 'Vehicle Allowance', type: 'per_km', amount: 0.98, description: 'Use of personal vehicle', effectiveFrom: '2025-07-01' },
      { id: 'hp-uniform', name: 'Uniform Allowance', type: 'per_week', amount: 6.25, description: 'Required to wear uniform' },
    ],
  },

  // ============================================
  // HOSPITALITY INDUSTRY (GENERAL) AWARD 2020 (MA000009)
  // ============================================
  {
    id: 'hospitality-2020',
    code: 'MA000009',
    name: 'Hospitality Industry (General) Award 2020',
    shortName: 'Hospitality',
    industry: 'Hospitality',
    effectiveDate: '2025-07-01',
    version: 'FWC 2025-26',
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
      { id: 'hosp-1', level: 'Level 1', description: 'Introductory', baseWeeklyRate: 913.91, baseHourlyRate: 24.05 },
      { id: 'hosp-2', level: 'Level 2', description: 'F&B Attendant Grade 1', baseWeeklyRate: 958.97, baseHourlyRate: 25.24 },
      { id: 'hosp-3', level: 'Level 3', description: 'F&B Attendant Grade 2', baseWeeklyRate: 996.36, baseHourlyRate: 26.22 },
      { id: 'hosp-4', level: 'Level 4', description: 'F&B Attendant Grade 3 / Cook 1', baseWeeklyRate: 1035.27, baseHourlyRate: 27.24 },
      { id: 'hosp-5', level: 'Level 5', description: 'Cook Grade 2', baseWeeklyRate: 1078.48, baseHourlyRate: 28.38 },
      { id: 'hosp-6', level: 'Level 6', description: 'Cook Grade 3 / Supervisor', baseWeeklyRate: 1137.84, baseHourlyRate: 29.94 },
    ],
    allowances: [
      { id: 'hosp-meal', name: 'Meal Allowance', type: 'per_occasion', amount: 16.73, description: 'Overtime meal allowance', effectiveFrom: '2025-07-01' },
      { id: 'hosp-split', name: 'Split Shift Allowance', type: 'per_shift', amount: 5.41, description: 'Working a split shift' },
      { id: 'hosp-laundry', name: 'Laundry Allowance', type: 'per_week', amount: 6.00, description: 'Laundering uniform' },
      { id: 'hosp-vehicle', name: 'Vehicle Allowance', type: 'per_km', amount: 0.99, description: 'Use of personal vehicle', effectiveFrom: '2025-07-01' },
    ],
  },

  // ============================================
  // SCHADS AWARD 2010 (MA000100)
  // ============================================
  {
    id: 'social-2020',
    code: 'MA000100',
    name: 'Social, Community, Home Care and Disability Services Industry Award 2010',
    shortName: 'SCHADS',
    industry: 'Community Services',
    effectiveDate: '2025-07-01',
    version: 'FWC 2025-26',
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
      { id: 'sc-hc-1-1', level: 'Level 1.1', stream: 'Home Care', description: 'Home Care Employee', baseWeeklyRate: 1035.27, baseHourlyRate: 27.24 },
      { id: 'sc-hc-1-2', level: 'Level 1.2', stream: 'Home Care', description: 'Home Care Employee - 1 year', baseWeeklyRate: 1061.08, baseHourlyRate: 27.92 },
      { id: 'sc-hc-2-1', level: 'Level 2.1', stream: 'Home Care', description: 'Home Care Employee Level 2', baseWeeklyRate: 1086.70, baseHourlyRate: 28.60 },
      { id: 'sc-hc-2-2', level: 'Level 2.2', stream: 'Home Care', description: 'Home Care Employee Level 2 - 1 year', baseWeeklyRate: 1112.51, baseHourlyRate: 29.28 },
      { id: 'sc-hc-3', level: 'Level 3', stream: 'Home Care', description: 'Home Care Employee Level 3', baseWeeklyRate: 1163.46, baseHourlyRate: 30.62 },
      { id: 'sc-scs-2-1', level: 'Level 2.1', stream: 'Social & Community Services', description: 'SACS Employee Level 2', baseWeeklyRate: 1137.84, baseHourlyRate: 29.94 },
      { id: 'sc-scs-2-2', level: 'Level 2.2', stream: 'Social & Community Services', description: 'SACS Employee Level 2 - 1 year', baseWeeklyRate: 1163.46, baseHourlyRate: 30.62 },
      { id: 'sc-scs-2-3', level: 'Level 2.3', stream: 'Social & Community Services', description: 'SACS Employee Level 2 - 2+ years', baseWeeklyRate: 1189.27, baseHourlyRate: 31.30 },
      { id: 'sc-scs-3-1', level: 'Level 3.1', stream: 'Social & Community Services', description: 'SACS Employee Level 3', baseWeeklyRate: 1240.22, baseHourlyRate: 32.64 },
      { id: 'sc-scs-3-2', level: 'Level 3.2', stream: 'Social & Community Services', description: 'SACS Employee Level 3 - 1 year', baseWeeklyRate: 1265.84, baseHourlyRate: 33.31 },
      { id: 'sc-scs-4-1', level: 'Level 4.1', stream: 'Social & Community Services', description: 'SACS Employee Level 4', baseWeeklyRate: 1342.41, baseHourlyRate: 35.33 },
      { id: 'sc-scs-4-2', level: 'Level 4.2', stream: 'Social & Community Services', description: 'SACS Employee Level 4 - Experienced', baseWeeklyRate: 1368.12, baseHourlyRate: 36.00 },
      { id: 'sc-ds-2-1', level: 'Level 2.1', stream: 'Disability Services', description: 'Disability Services Worker Level 2', baseWeeklyRate: 1137.84, baseHourlyRate: 29.94 },
      { id: 'sc-ds-2-2', level: 'Level 2.2', stream: 'Disability Services', description: 'Disability Services Worker Level 2 - 1 year', baseWeeklyRate: 1163.46, baseHourlyRate: 30.62 },
      { id: 'sc-ds-3', level: 'Level 3', stream: 'Disability Services', description: 'Disability Services Worker Level 3', baseWeeklyRate: 1214.89, baseHourlyRate: 31.97 },
      { id: 'sc-ds-4', level: 'Level 4', stream: 'Disability Services', description: 'Disability Services Worker Level 4', baseWeeklyRate: 1291.46, baseHourlyRate: 33.99 },
    ],
    allowances: [
      { id: 'sc-fa', name: 'First Aid Allowance', type: 'per_week', amount: 19.57, description: 'Appointed first aid officer', effectiveFrom: '2025-07-01' },
      { id: 'sc-vehicle', name: 'Vehicle Allowance', type: 'per_km', amount: 0.99, description: 'Use of personal vehicle', effectiveFrom: '2025-07-01' },
      { id: 'sc-broken', name: 'Broken Shift Allowance', type: 'per_shift', amount: 18.74, description: 'Working a broken shift', effectiveFrom: '2025-07-01' },
      { id: 'sc-sleep', name: 'Sleepover Allowance', type: 'one_off', amount: 67.80, description: 'Required to sleep over at work', effectiveFrom: '2025-07-01' },
      { id: 'sc-meal', name: 'Meal Allowance', type: 'per_occasion', amount: 19.77, description: 'Overtime meal allowance', effectiveFrom: '2025-07-01' },
    ],
  },

  // ============================================
  // GENERAL RETAIL INDUSTRY AWARD 2020 (MA000004)
  // ============================================
  {
    id: 'retail-2020',
    code: 'MA000004',
    name: 'General Retail Industry Award 2020',
    shortName: 'Retail',
    industry: 'Retail',
    effectiveDate: '2025-07-01',
    version: 'FWC 2025-26',
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
      { id: 'ret-1', level: 'Level 1', description: 'Retail Employee - Entry', baseWeeklyRate: 1035.27, baseHourlyRate: 27.24 },
      { id: 'ret-2', level: 'Level 2', description: 'Retail Employee - Experienced', baseWeeklyRate: 1061.08, baseHourlyRate: 27.92 },
      { id: 'ret-3', level: 'Level 3', description: 'Retail Employee - Senior', baseWeeklyRate: 1078.48, baseHourlyRate: 28.38 },
      { id: 'ret-4', level: 'Level 4', description: 'Supervisor / Specialist', baseWeeklyRate: 1100.28, baseHourlyRate: 28.95 },
      { id: 'ret-5', level: 'Level 5', description: 'Manager - Small Store', baseWeeklyRate: 1137.84, baseHourlyRate: 29.94 },
      { id: 'ret-6', level: 'Level 6', description: 'Manager - Large Store', baseWeeklyRate: 1189.27, baseHourlyRate: 31.30 },
    ],
    allowances: [
      { id: 'ret-fa', name: 'First Aid Allowance', type: 'per_week', amount: 16.24, description: 'Appointed first aid officer', effectiveFrom: '2025-07-01' },
      { id: 'ret-cold', name: 'Cold Work Allowance', type: 'per_hour', amount: 0.64, description: 'Work in cold storage below 0°C', effectiveFrom: '2025-07-01' },
      { id: 'ret-meal', name: 'Meal Allowance', type: 'per_occasion', amount: 23.59, description: 'Overtime meal allowance', effectiveFrom: '2025-07-01' },
      { id: 'ret-laundry', name: 'Laundry Allowance', type: 'per_week', amount: 6.25, description: 'Laundering uniform' },
    ],
  },
];

// Helper function to get award by ID
export const getAwardById = (id: string): AustralianAward | undefined => {
  return australianAwards.find(award => award.id === id);
};

// Helper function to get award by code
export const getAwardByCode = (code: string): AustralianAward | undefined => {
  return australianAwards.find(award => award.code === code);
};

// Helper function to get classification by ID within an award
export const getClassificationById = (awardId: string, classificationId: string): AwardClassification | undefined => {
  const award = getAwardById(awardId);
  return award?.classifications.find(c => c.id === classificationId);
};

// Helper to get classifications by stream
export const getClassificationsByStream = (awardId: string, stream: string): AwardClassification[] => {
  const award = getAwardById(awardId);
  if (!award) return [];
  return award.classifications.filter(c => c.stream === stream);
};

// Helper to get the effective rate for a date
export const getEffectiveRate = (
  classification: AwardClassification,
  effectiveDate: Date = new Date()
): { weeklyRate: number; hourlyRate: number } => {
  if (!classification.rateSchedule || classification.rateSchedule.length === 0) {
    return {
      weeklyRate: classification.baseWeeklyRate || classification.baseHourlyRate * 38,
      hourlyRate: classification.baseHourlyRate,
    };
  }

  // Sort by date descending to find most recent applicable rate
  const sortedSchedule = [...classification.rateSchedule].sort(
    (a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()
  );

  const applicableRate = sortedSchedule.find(
    schedule => new Date(schedule.effectiveFrom) <= effectiveDate
  );

  if (applicableRate) {
    return {
      weeklyRate: applicableRate.weeklyRate,
      hourlyRate: applicableRate.hourlyRate,
    };
  }

  return {
    weeklyRate: classification.baseWeeklyRate || classification.baseHourlyRate * 38,
    hourlyRate: classification.baseHourlyRate,
  };
};

// Helper function to calculate rates based on employment type
export const calculateRates = (
  award: AustralianAward,
  classification: AwardClassification,
  employmentType: string,
  effectiveDate: Date = new Date()
) => {
  const { weeklyRate, hourlyRate } = getEffectiveRate(classification, effectiveDate);
  const isCasual = employmentType === 'casual';
  const casualLoadedRate = isCasual ? hourlyRate * (1 + award.casualLoading / 100) : hourlyRate;

  return {
    baseWeeklyRate: weeklyRate,
    baseHourlyRate: hourlyRate,
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

// Get awards by industry
export const getAwardsByIndustry = (industry: string): AustralianAward[] => {
  return australianAwards.filter(a => a.industry === industry);
};
