import { StaffMember, Centre, Shift, OpenShift, DemandData, RosterComplianceFlag, AgencyType } from '@/types/roster';
import { format, addDays, startOfWeek } from 'date-fns';

const today = new Date();
const weekStart = startOfWeek(today, { weekStartsOn: 1 });

export const mockCentres: Centre[] = [
  {
    id: 'centre-1',
    name: 'Sunshine Early Learning',
    code: 'SEL',
    address: '123 Main Street, Sydney NSW 2000',
    operatingHours: { start: '06:30', end: '18:30' },
    rooms: [
      { id: 'room-1a', name: 'Joeys', centreId: 'centre-1', ageGroup: 'nursery', capacity: 12, requiredRatio: 4, minQualifiedStaff: 2 },
      { id: 'room-1b', name: 'Possums', centreId: 'centre-1', ageGroup: 'toddler', capacity: 15, requiredRatio: 5, minQualifiedStaff: 2 },
      { id: 'room-1c', name: 'Koalas', centreId: 'centre-1', ageGroup: 'preschool', capacity: 22, requiredRatio: 10, minQualifiedStaff: 2 },
      { id: 'room-1d', name: 'Kangaroos', centreId: 'centre-1', ageGroup: 'kindy', capacity: 22, requiredRatio: 11, minQualifiedStaff: 2 },
    ],
  },
  {
    id: 'centre-2',
    name: 'Little Stars Childcare',
    code: 'LSC',
    address: '456 Park Avenue, Melbourne VIC 3000',
    operatingHours: { start: '07:00', end: '18:00' },
    rooms: [
      { id: 'room-2a', name: 'Butterflies', centreId: 'centre-2', ageGroup: 'nursery', capacity: 10, requiredRatio: 4, minQualifiedStaff: 2 },
      { id: 'room-2b', name: 'Ladybugs', centreId: 'centre-2', ageGroup: 'toddler', capacity: 12, requiredRatio: 5, minQualifiedStaff: 2 },
      { id: 'room-2c', name: 'Dragonflies', centreId: 'centre-2', ageGroup: 'preschool', capacity: 20, requiredRatio: 10, minQualifiedStaff: 2 },
    ],
  },
  {
    id: 'centre-3',
    name: 'Rainbow Kids Academy',
    code: 'RKA',
    address: '789 Ocean Road, Brisbane QLD 4000',
    operatingHours: { start: '06:00', end: '19:00' },
    rooms: [
      { id: 'room-3a', name: 'Starfish', centreId: 'centre-3', ageGroup: 'nursery', capacity: 8, requiredRatio: 4, minQualifiedStaff: 2 },
      { id: 'room-3b', name: 'Dolphins', centreId: 'centre-3', ageGroup: 'toddler', capacity: 15, requiredRatio: 5, minQualifiedStaff: 2 },
      { id: 'room-3c', name: 'Seahorses', centreId: 'centre-3', ageGroup: 'preschool', capacity: 22, requiredRatio: 10, minQualifiedStaff: 2 },
      { id: 'room-3d', name: 'Turtles', centreId: 'centre-3', ageGroup: 'kindy', capacity: 24, requiredRatio: 11, minQualifiedStaff: 2 },
    ],
  },
];

export const mockStaff: StaffMember[] = [
  {
    id: 'staff-1',
    name: 'Emma Wilson',
    role: 'lead_educator',
    employmentType: 'permanent',
    qualifications: [
      { type: 'bachelor_ece', name: 'Bachelor of Early Childhood Education' },
      { type: 'first_aid', name: 'First Aid Certificate', expiryDate: '2025-06-15' },
      { type: 'working_with_children', name: 'Working With Children Check', expiryDate: '2026-03-20' },
    ],
    hourlyRate: 38.50,
    overtimeRate: 57.75,
    maxHoursPerWeek: 38,
    currentWeeklyHours: 32,
    preferredCentres: ['centre-1', 'centre-2'],
    availability: [
      { dayOfWeek: 1, available: true, startTime: '07:00', endTime: '17:00' },
      { dayOfWeek: 2, available: true, startTime: '07:00', endTime: '17:00' },
      { dayOfWeek: 3, available: true, startTime: '07:00', endTime: '17:00' },
      { dayOfWeek: 4, available: true, startTime: '07:00', endTime: '17:00' },
      { dayOfWeek: 5, available: true, startTime: '07:00', endTime: '15:00' },
      { dayOfWeek: 0, available: false },
      { dayOfWeek: 6, available: false },
    ],
    color: 'hsl(220, 70%, 55%)',
    timeOff: [
      { id: 'to-1', staffId: 'staff-1', startDate: '2025-12-19', endDate: '2025-12-19', type: 'annual_leave', status: 'approved' }
    ],
  },
  {
    id: 'staff-2',
    name: 'Sarah Chen',
    role: 'educator',
    employmentType: 'permanent',
    qualifications: [
      { type: 'diploma_ece', name: 'Diploma of Early Childhood' },
      { type: 'first_aid', name: 'First Aid Certificate', expiryDate: '2024-12-01', isExpiringSoon: true },
      { type: 'working_with_children', name: 'Working With Children Check', expiryDate: '2025-08-10' },
    ],
    hourlyRate: 32.00,
    overtimeRate: 48.00,
    maxHoursPerWeek: 38,
    currentWeeklyHours: 38,
    preferredCentres: ['centre-1'],
    availability: [
      { dayOfWeek: 1, available: true, startTime: '06:30', endTime: '18:30' },
      { dayOfWeek: 2, available: true, startTime: '06:30', endTime: '18:30' },
      { dayOfWeek: 3, available: true, startTime: '06:30', endTime: '18:30' },
      { dayOfWeek: 4, available: true, startTime: '06:30', endTime: '18:30' },
      { dayOfWeek: 5, available: true, startTime: '06:30', endTime: '18:30' },
      { dayOfWeek: 0, available: false },
      { dayOfWeek: 6, available: false },
    ],
    color: 'hsl(340, 65%, 50%)',
  },
  {
    id: 'staff-3',
    name: 'Michael Brown',
    role: 'educator',
    employmentType: 'casual',
    qualifications: [
      { type: 'certificate_iii', name: 'Certificate III in Early Childhood' },
      { type: 'first_aid', name: 'First Aid Certificate', expiryDate: '2025-09-20' },
      { type: 'working_with_children', name: 'Working With Children Check', expiryDate: '2025-11-30' },
      { type: 'food_safety', name: 'Food Safety Certificate', expiryDate: '2025-04-15' },
    ],
    hourlyRate: 28.50,
    overtimeRate: 42.75,
    maxHoursPerWeek: 30,
    currentWeeklyHours: 24,
    preferredCentres: ['centre-1', 'centre-3'],
    availability: [
      { dayOfWeek: 1, available: true, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 2, available: true, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 3, available: false },
      { dayOfWeek: 4, available: true, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 5, available: true, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 0, available: false },
      { dayOfWeek: 6, available: true, startTime: '08:00', endTime: '14:00' },
    ],
    color: 'hsl(150, 60%, 40%)',
  },
  {
    id: 'staff-4',
    name: 'Jessica Taylor',
    role: 'lead_educator',
    employmentType: 'permanent',
    qualifications: [
      { type: 'diploma_ece', name: 'Diploma of Early Childhood' },
      { type: 'bachelor_ece', name: 'Bachelor of Early Childhood Education' },
      { type: 'first_aid', name: 'First Aid Certificate', expiryDate: '2025-07-01' },
      { type: 'working_with_children', name: 'Working With Children Check', expiryDate: '2026-01-15' },
    ],
    hourlyRate: 40.00,
    overtimeRate: 60.00,
    maxHoursPerWeek: 38,
    currentWeeklyHours: 36,
    preferredCentres: ['centre-2'],
    availability: [
      { dayOfWeek: 1, available: true, startTime: '07:00', endTime: '18:00' },
      { dayOfWeek: 2, available: true, startTime: '07:00', endTime: '18:00' },
      { dayOfWeek: 3, available: true, startTime: '07:00', endTime: '18:00' },
      { dayOfWeek: 4, available: true, startTime: '07:00', endTime: '18:00' },
      { dayOfWeek: 5, available: false },
      { dayOfWeek: 0, available: false },
      { dayOfWeek: 6, available: false },
    ],
    color: 'hsl(280, 60%, 50%)',
  },
  {
    id: 'staff-5',
    name: 'David Kim',
    role: 'assistant',
    employmentType: 'casual',
    qualifications: [
      { type: 'certificate_iii', name: 'Certificate III in Early Childhood' },
      { type: 'working_with_children', name: 'Working With Children Check', expiryDate: '2025-05-20' },
    ],
    hourlyRate: 25.00,
    overtimeRate: 37.50,
    maxHoursPerWeek: 25,
    currentWeeklyHours: 20,
    preferredCentres: ['centre-1', 'centre-2', 'centre-3'],
    availability: [
      { dayOfWeek: 1, available: true, startTime: '09:00', endTime: '15:00' },
      { dayOfWeek: 2, available: true, startTime: '09:00', endTime: '15:00' },
      { dayOfWeek: 3, available: true, startTime: '09:00', endTime: '15:00' },
      { dayOfWeek: 4, available: true, startTime: '09:00', endTime: '15:00' },
      { dayOfWeek: 5, available: true, startTime: '09:00', endTime: '15:00' },
      { dayOfWeek: 0, available: false },
      { dayOfWeek: 6, available: false },
    ],
    color: 'hsl(30, 70%, 50%)',
  },
  {
    id: 'staff-6',
    name: 'Lisa Anderson',
    role: 'educator',
    employmentType: 'permanent',
    qualifications: [
      { type: 'diploma_ece', name: 'Diploma of Early Childhood' },
      { type: 'first_aid', name: 'First Aid Certificate', expiryDate: '2024-11-15', isExpired: true },
      { type: 'working_with_children', name: 'Working With Children Check', expiryDate: '2025-09-01' },
    ],
    hourlyRate: 31.00,
    overtimeRate: 46.50,
    maxHoursPerWeek: 38,
    currentWeeklyHours: 40,
    preferredCentres: ['centre-3'],
    availability: [
      { dayOfWeek: 1, available: true, startTime: '06:00', endTime: '19:00' },
      { dayOfWeek: 2, available: true, startTime: '06:00', endTime: '19:00' },
      { dayOfWeek: 3, available: true, startTime: '06:00', endTime: '19:00' },
      { dayOfWeek: 4, available: true, startTime: '06:00', endTime: '19:00' },
      { dayOfWeek: 5, available: true, startTime: '06:00', endTime: '19:00' },
      { dayOfWeek: 0, available: false },
      { dayOfWeek: 6, available: false },
    ],
    color: 'hsl(180, 55%, 45%)',
    timeOff: [
      { id: 'to-2', staffId: 'staff-6', startDate: '2025-12-17', endDate: '2025-12-18', type: 'sick_leave', status: 'approved' }
    ],
  },
  {
    id: 'staff-7',
    name: 'Rachel Green',
    role: 'cook',
    employmentType: 'permanent',
    qualifications: [
      { type: 'food_safety', name: 'Food Safety Certificate', expiryDate: '2025-08-30' },
      { type: 'working_with_children', name: 'Working With Children Check', expiryDate: '2026-02-28' },
    ],
    hourlyRate: 27.00,
    overtimeRate: 40.50,
    maxHoursPerWeek: 30,
    currentWeeklyHours: 25,
    preferredCentres: ['centre-1'],
    availability: [
      { dayOfWeek: 1, available: true, startTime: '07:00', endTime: '14:00' },
      { dayOfWeek: 2, available: true, startTime: '07:00', endTime: '14:00' },
      { dayOfWeek: 3, available: true, startTime: '07:00', endTime: '14:00' },
      { dayOfWeek: 4, available: true, startTime: '07:00', endTime: '14:00' },
      { dayOfWeek: 5, available: true, startTime: '07:00', endTime: '14:00' },
      { dayOfWeek: 0, available: false },
      { dayOfWeek: 6, available: false },
    ],
    color: 'hsl(45, 80%, 45%)',
  },
  {
    id: 'staff-8',
    name: 'Tom Martinez',
    role: 'educator',
    employmentType: 'casual',
    qualifications: [
      { type: 'diploma_ece', name: 'Diploma of Early Childhood' },
      { type: 'first_aid', name: 'First Aid Certificate', expiryDate: '2025-10-10' },
      { type: 'working_with_children', name: 'Working With Children Check', expiryDate: '2025-12-20' },
    ],
    hourlyRate: 30.00,
    overtimeRate: 45.00,
    maxHoursPerWeek: 38,
    currentWeeklyHours: 30,
    preferredCentres: ['centre-2', 'centre-3'],
    availability: [
      { dayOfWeek: 1, available: true, startTime: '08:00', endTime: '17:00' },
      { dayOfWeek: 2, available: true, startTime: '08:00', endTime: '17:00' },
      { dayOfWeek: 3, available: true, startTime: '08:00', endTime: '17:00' },
      { dayOfWeek: 4, available: true, startTime: '08:00', endTime: '17:00' },
      { dayOfWeek: 5, available: true, startTime: '08:00', endTime: '17:00' },
      { dayOfWeek: 0, available: false },
      { dayOfWeek: 6, available: false },
    ],
    color: 'hsl(10, 65%, 50%)',
  },
  {
    id: 'staff-9',
    name: 'Amy Patterson',
    role: 'educator',
    employmentType: 'casual',
    qualifications: [
      { type: 'certificate_iii', name: 'Certificate III in Early Childhood' },
      { type: 'first_aid', name: 'First Aid Certificate', expiryDate: '2025-11-01' },
      { type: 'working_with_children', name: 'Working With Children Check', expiryDate: '2026-04-15' },
    ],
    hourlyRate: 28.00,
    overtimeRate: 42.00,
    maxHoursPerWeek: 20,
    currentWeeklyHours: 0,
    preferredCentres: ['centre-1', 'centre-2'],
    availability: [
      { dayOfWeek: 1, available: true, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 2, available: false },
      { dayOfWeek: 3, available: true, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 4, available: false },
      { dayOfWeek: 5, available: true, startTime: '09:00', endTime: '15:00' },
      { dayOfWeek: 0, available: false },
      { dayOfWeek: 6, available: false },
    ],
    color: 'hsl(260, 55%, 55%)',
  },
  {
    id: 'staff-10',
    name: 'James Cooper',
    role: 'assistant',
    employmentType: 'casual',
    qualifications: [
      { type: 'working_with_children', name: 'Working With Children Check', expiryDate: '2026-01-20' },
    ],
    hourlyRate: 24.00,
    overtimeRate: 36.00,
    maxHoursPerWeek: 15,
    currentWeeklyHours: 0,
    preferredCentres: ['centre-1', 'centre-3'],
    availability: [
      { dayOfWeek: 1, available: false },
      { dayOfWeek: 2, available: true, startTime: '14:00', endTime: '18:00' },
      { dayOfWeek: 3, available: true, startTime: '14:00', endTime: '18:00' },
      { dayOfWeek: 4, available: true, startTime: '14:00', endTime: '18:00' },
      { dayOfWeek: 5, available: true, startTime: '14:00', endTime: '18:00' },
      { dayOfWeek: 0, available: false },
      { dayOfWeek: 6, available: true, startTime: '08:00', endTime: '16:00' },
    ],
    color: 'hsl(100, 50%, 45%)',
  },
];

// Agency staff for recruitment agencies
export const mockAgencyStaff: StaffMember[] = [
  {
    id: 'agency-1',
    name: 'Kelly Thompson',
    role: 'educator',
    employmentType: 'casual',
    agency: 'anzuk',
    qualifications: [
      { type: 'diploma_ece', name: 'Diploma of Early Childhood' },
      { type: 'first_aid', name: 'First Aid Certificate', expiryDate: '2025-08-20' },
      { type: 'working_with_children', name: 'Working With Children Check', expiryDate: '2026-02-15' },
    ],
    hourlyRate: 42.00,
    overtimeRate: 63.00,
    maxHoursPerWeek: 38,
    currentWeeklyHours: 0,
    preferredCentres: [],
    availability: [
      { dayOfWeek: 1, available: true, startTime: '07:00', endTime: '18:00' },
      { dayOfWeek: 2, available: true, startTime: '07:00', endTime: '18:00' },
      { dayOfWeek: 3, available: true, startTime: '07:00', endTime: '18:00' },
      { dayOfWeek: 4, available: true, startTime: '07:00', endTime: '18:00' },
      { dayOfWeek: 5, available: true, startTime: '07:00', endTime: '18:00' },
      { dayOfWeek: 0, available: false },
      { dayOfWeek: 6, available: false },
    ],
    color: 'hsl(220, 70%, 50%)',
  },
  {
    id: 'agency-2',
    name: 'Mark Stevens',
    role: 'lead_educator',
    employmentType: 'casual',
    agency: 'anzuk',
    qualifications: [
      { type: 'bachelor_ece', name: 'Bachelor of Early Childhood Education' },
      { type: 'first_aid', name: 'First Aid Certificate', expiryDate: '2025-10-15' },
      { type: 'working_with_children', name: 'Working With Children Check', expiryDate: '2026-05-20' },
    ],
    hourlyRate: 48.00,
    overtimeRate: 72.00,
    maxHoursPerWeek: 38,
    currentWeeklyHours: 0,
    preferredCentres: [],
    availability: [
      { dayOfWeek: 1, available: true, startTime: '06:30', endTime: '17:00' },
      { dayOfWeek: 2, available: true, startTime: '06:30', endTime: '17:00' },
      { dayOfWeek: 3, available: false },
      { dayOfWeek: 4, available: true, startTime: '06:30', endTime: '17:00' },
      { dayOfWeek: 5, available: true, startTime: '06:30', endTime: '17:00' },
      { dayOfWeek: 0, available: false },
      { dayOfWeek: 6, available: false },
    ],
    color: 'hsl(220, 70%, 60%)',
  },
  {
    id: 'agency-3',
    name: 'Sophie Williams',
    role: 'educator',
    employmentType: 'casual',
    agency: 'randstad',
    qualifications: [
      { type: 'diploma_ece', name: 'Diploma of Early Childhood' },
      { type: 'first_aid', name: 'First Aid Certificate', expiryDate: '2025-06-30' },
      { type: 'working_with_children', name: 'Working With Children Check', expiryDate: '2025-12-01' },
      { type: 'food_safety', name: 'Food Safety Certificate', expiryDate: '2025-09-15' },
    ],
    hourlyRate: 40.00,
    overtimeRate: 60.00,
    maxHoursPerWeek: 30,
    currentWeeklyHours: 0,
    preferredCentres: [],
    availability: [
      { dayOfWeek: 1, available: true, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 2, available: true, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 3, available: true, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 4, available: true, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 5, available: true, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 0, available: false },
      { dayOfWeek: 6, available: false },
    ],
    color: 'hsl(340, 75%, 50%)',
  },
  {
    id: 'agency-4',
    name: 'Nathan Lee',
    role: 'assistant',
    employmentType: 'casual',
    agency: 'randstad',
    qualifications: [
      { type: 'certificate_iii', name: 'Certificate III in Early Childhood' },
      { type: 'working_with_children', name: 'Working With Children Check', expiryDate: '2026-03-10' },
    ],
    hourlyRate: 32.00,
    overtimeRate: 48.00,
    maxHoursPerWeek: 25,
    currentWeeklyHours: 0,
    preferredCentres: [],
    availability: [
      { dayOfWeek: 1, available: true, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 2, available: false },
      { dayOfWeek: 3, available: true, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 4, available: true, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 5, available: false },
      { dayOfWeek: 0, available: false },
      { dayOfWeek: 6, available: true, startTime: '08:00', endTime: '14:00' },
    ],
    color: 'hsl(340, 75%, 60%)',
  },
  {
    id: 'agency-5',
    name: 'Olivia Chen',
    role: 'educator',
    employmentType: 'casual',
    agency: 'quickcare',
    qualifications: [
      { type: 'diploma_ece', name: 'Diploma of Early Childhood' },
      { type: 'first_aid', name: 'First Aid Certificate', expiryDate: '2025-11-20' },
      { type: 'working_with_children', name: 'Working With Children Check', expiryDate: '2026-04-15' },
    ],
    hourlyRate: 38.00,
    overtimeRate: 57.00,
    maxHoursPerWeek: 38,
    currentWeeklyHours: 0,
    preferredCentres: [],
    availability: [
      { dayOfWeek: 1, available: true, startTime: '07:00', endTime: '18:00' },
      { dayOfWeek: 2, available: true, startTime: '07:00', endTime: '18:00' },
      { dayOfWeek: 3, available: true, startTime: '07:00', endTime: '18:00' },
      { dayOfWeek: 4, available: true, startTime: '07:00', endTime: '18:00' },
      { dayOfWeek: 5, available: true, startTime: '07:00', endTime: '18:00' },
      { dayOfWeek: 0, available: false },
      { dayOfWeek: 6, available: false },
    ],
    color: 'hsl(150, 65%, 40%)',
  },
  {
    id: 'agency-6',
    name: 'Daniel Park',
    role: 'lead_educator',
    employmentType: 'casual',
    agency: 'quickcare',
    qualifications: [
      { type: 'bachelor_ece', name: 'Bachelor of Early Childhood Education' },
      { type: 'masters_ece', name: 'Masters of Early Childhood Education' },
      { type: 'first_aid', name: 'First Aid Certificate', expiryDate: '2025-07-10' },
      { type: 'working_with_children', name: 'Working With Children Check', expiryDate: '2026-01-25' },
    ],
    hourlyRate: 52.00,
    overtimeRate: 78.00,
    maxHoursPerWeek: 38,
    currentWeeklyHours: 0,
    preferredCentres: [],
    availability: [
      { dayOfWeek: 1, available: true, startTime: '06:30', endTime: '18:30' },
      { dayOfWeek: 2, available: true, startTime: '06:30', endTime: '18:30' },
      { dayOfWeek: 3, available: true, startTime: '06:30', endTime: '18:30' },
      { dayOfWeek: 4, available: true, startTime: '06:30', endTime: '18:30' },
      { dayOfWeek: 5, available: true, startTime: '06:30', endTime: '18:30' },
      { dayOfWeek: 0, available: false },
      { dayOfWeek: 6, available: false },
    ],
    color: 'hsl(150, 65%, 50%)',
  },
  {
    id: 'agency-7',
    name: 'Emily Roberts',
    role: 'educator',
    employmentType: 'casual',
    agency: 'hays',
    qualifications: [
      { type: 'certificate_iii', name: 'Certificate III in Early Childhood' },
      { type: 'first_aid', name: 'First Aid Certificate', expiryDate: '2025-09-05' },
      { type: 'working_with_children', name: 'Working With Children Check', expiryDate: '2025-11-30' },
    ],
    hourlyRate: 35.00,
    overtimeRate: 52.50,
    maxHoursPerWeek: 30,
    currentWeeklyHours: 0,
    preferredCentres: [],
    availability: [
      { dayOfWeek: 1, available: true, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 2, available: true, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 3, available: true, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 4, available: false },
      { dayOfWeek: 5, available: true, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 0, available: false },
      { dayOfWeek: 6, available: false },
    ],
    color: 'hsl(30, 80%, 50%)',
  },
];

// Generate shifts for the current week
export const generateMockShifts = (): Shift[] => {
  const shifts: Shift[] = [];
  
  // Monday shifts
  shifts.push(
    { id: 'shift-1', staffId: 'staff-1', centreId: 'centre-1', roomId: 'room-1a', date: format(addDays(weekStart, 0), 'yyyy-MM-dd'), startTime: '07:00', endTime: '15:00', breakMinutes: 30, status: 'published', isOpenShift: false },
    { id: 'shift-2', staffId: 'staff-2', centreId: 'centre-1', roomId: 'room-1a', date: format(addDays(weekStart, 0), 'yyyy-MM-dd'), startTime: '10:00', endTime: '18:30', breakMinutes: 30, status: 'published', isOpenShift: false },
    { id: 'shift-3', staffId: 'staff-3', centreId: 'centre-1', roomId: 'room-1b', date: format(addDays(weekStart, 0), 'yyyy-MM-dd'), startTime: '08:00', endTime: '16:00', breakMinutes: 30, status: 'published', isOpenShift: false },
    { id: 'shift-4', staffId: 'staff-4', centreId: 'centre-2', roomId: 'room-2a', date: format(addDays(weekStart, 0), 'yyyy-MM-dd'), startTime: '07:00', endTime: '15:00', breakMinutes: 30, status: 'published', isOpenShift: false },
    { id: 'shift-5', staffId: 'staff-5', centreId: 'centre-1', roomId: 'room-1c', date: format(addDays(weekStart, 0), 'yyyy-MM-dd'), startTime: '09:00', endTime: '15:00', breakMinutes: 0, status: 'draft', isOpenShift: false },
  );

  // Tuesday shifts
  shifts.push(
    { id: 'shift-6', staffId: 'staff-1', centreId: 'centre-1', roomId: 'room-1b', date: format(addDays(weekStart, 1), 'yyyy-MM-dd'), startTime: '07:00', endTime: '15:00', breakMinutes: 30, status: 'published', isOpenShift: false },
    { id: 'shift-7', staffId: 'staff-2', centreId: 'centre-1', roomId: 'room-1a', date: format(addDays(weekStart, 1), 'yyyy-MM-dd'), startTime: '06:30', endTime: '14:30', breakMinutes: 30, status: 'published', isOpenShift: false },
    { id: 'shift-8', staffId: 'staff-6', centreId: 'centre-3', roomId: 'room-3a', date: format(addDays(weekStart, 1), 'yyyy-MM-dd'), startTime: '06:00', endTime: '14:00', breakMinutes: 30, status: 'published', isOpenShift: false },
    { id: 'shift-9', staffId: 'staff-8', centreId: 'centre-2', roomId: 'room-2b', date: format(addDays(weekStart, 1), 'yyyy-MM-dd'), startTime: '08:00', endTime: '17:00', breakMinutes: 30, status: 'draft', isOpenShift: false },
  );

  // Wednesday shifts
  shifts.push(
    { id: 'shift-10', staffId: 'staff-1', centreId: 'centre-1', roomId: 'room-1c', date: format(addDays(weekStart, 2), 'yyyy-MM-dd'), startTime: '07:00', endTime: '15:00', breakMinutes: 30, status: 'published', isOpenShift: false },
    { id: 'shift-11', staffId: 'staff-2', centreId: 'centre-1', roomId: 'room-1a', date: format(addDays(weekStart, 2), 'yyyy-MM-dd'), startTime: '10:00', endTime: '18:30', breakMinutes: 30, status: 'published', isOpenShift: false },
    { id: 'shift-12', staffId: 'staff-4', centreId: 'centre-2', roomId: 'room-2c', date: format(addDays(weekStart, 2), 'yyyy-MM-dd'), startTime: '07:00', endTime: '18:00', breakMinutes: 60, status: 'published', isOpenShift: false },
    { id: 'shift-13', staffId: 'staff-6', centreId: 'centre-3', roomId: 'room-3b', date: format(addDays(weekStart, 2), 'yyyy-MM-dd'), startTime: '06:00', endTime: '19:00', breakMinutes: 60, status: 'draft', isOpenShift: false },
  );

  // Thursday shifts
  shifts.push(
    { id: 'shift-14', staffId: 'staff-1', centreId: 'centre-1', roomId: 'room-1d', date: format(addDays(weekStart, 3), 'yyyy-MM-dd'), startTime: '07:00', endTime: '15:00', breakMinutes: 30, status: 'published', isOpenShift: false },
    { id: 'shift-15', staffId: 'staff-3', centreId: 'centre-1', roomId: 'room-1b', date: format(addDays(weekStart, 3), 'yyyy-MM-dd'), startTime: '08:00', endTime: '16:00', breakMinutes: 30, status: 'published', isOpenShift: false },
    { id: 'shift-16', staffId: 'staff-4', centreId: 'centre-2', roomId: 'room-2a', date: format(addDays(weekStart, 3), 'yyyy-MM-dd'), startTime: '07:00', endTime: '15:00', breakMinutes: 30, status: 'published', isOpenShift: false },
    { id: 'shift-17', staffId: 'staff-5', centreId: 'centre-1', roomId: 'room-1a', date: format(addDays(weekStart, 3), 'yyyy-MM-dd'), startTime: '09:00', endTime: '15:00', breakMinutes: 0, status: 'draft', isOpenShift: false },
  );

  // Friday shifts
  shifts.push(
    { id: 'shift-18', staffId: 'staff-1', centreId: 'centre-1', roomId: 'room-1a', date: format(addDays(weekStart, 4), 'yyyy-MM-dd'), startTime: '07:00', endTime: '13:00', breakMinutes: 0, status: 'published', isOpenShift: false },
    { id: 'shift-19', staffId: 'staff-2', centreId: 'centre-1', roomId: 'room-1c', date: format(addDays(weekStart, 4), 'yyyy-MM-dd'), startTime: '06:30', endTime: '18:30', breakMinutes: 60, status: 'published', isOpenShift: false },
    { id: 'shift-20', staffId: 'staff-3', centreId: 'centre-1', roomId: 'room-1b', date: format(addDays(weekStart, 4), 'yyyy-MM-dd'), startTime: '08:00', endTime: '16:00', breakMinutes: 30, status: 'published', isOpenShift: false },
    { id: 'shift-21', staffId: 'staff-6', centreId: 'centre-3', roomId: 'room-3c', date: format(addDays(weekStart, 4), 'yyyy-MM-dd'), startTime: '06:00', endTime: '19:00', breakMinutes: 60, status: 'draft', isOpenShift: false },
  );

  return shifts;
};

export const mockOpenShifts: OpenShift[] = [
  {
    id: 'open-1',
    centreId: 'centre-1',
    roomId: 'room-1a',
    date: format(addDays(weekStart, 0), 'yyyy-MM-dd'),
    startTime: '15:00',
    endTime: '18:30',
    requiredQualifications: ['diploma_ece', 'first_aid'],
    urgency: 'high',
    applicants: [],
  },
  {
    id: 'open-2',
    centreId: 'centre-1',
    roomId: 'room-1c',
    date: format(addDays(weekStart, 2), 'yyyy-MM-dd'),
    startTime: '06:30',
    endTime: '10:00',
    requiredQualifications: ['certificate_iii'],
    urgency: 'medium',
    applicants: ['staff-5'],
  },
  {
    id: 'open-3',
    centreId: 'centre-2',
    roomId: 'room-2b',
    date: format(addDays(weekStart, 3), 'yyyy-MM-dd'),
    startTime: '07:00',
    endTime: '18:00',
    requiredQualifications: ['diploma_ece', 'first_aid'],
    urgency: 'critical',
    applicants: [],
  },
  {
    id: 'open-4',
    centreId: 'centre-3',
    roomId: 'room-3d',
    date: format(addDays(weekStart, 4), 'yyyy-MM-dd'),
    startTime: '12:00',
    endTime: '19:00',
    requiredQualifications: ['certificate_iii'],
    urgency: 'low',
    applicants: ['staff-3', 'staff-8'],
  },
];

export const generateMockDemandData = (): DemandData[] => {
  const demandData: DemandData[] = [];
  const timeSlots = ['06:00-09:00', '09:00-12:00', '12:00-15:00', '15:00-18:00'];
  
  for (let day = 0; day < 5; day++) {
    const date = format(addDays(weekStart, day), 'yyyy-MM-dd');
    
    mockCentres.forEach(centre => {
      centre.rooms.forEach(room => {
        timeSlots.forEach((timeSlot, idx) => {
          const baseBookings = Math.floor(room.capacity * 0.7);
          const variance = Math.floor(Math.random() * 6) - 2;
          const bookedChildren = Math.max(0, Math.min(room.capacity, baseBookings + variance));
          
          // Morning and afternoon tend to have lower attendance
          const attendanceModifier = idx === 0 || idx === 3 ? 0.85 : 1;
          const historicalAttendance = Math.floor(bookedChildren * attendanceModifier * (0.9 + Math.random() * 0.15));
          
          demandData.push({
            date,
            centreId: centre.id,
            roomId: room.id,
            timeSlot,
            bookedChildren,
            projectedChildren: Math.floor(bookedChildren * 0.95),
            historicalAttendance,
            utilisationPercent: Math.round((bookedChildren / room.capacity) * 100),
          });
        });
      });
    });
  }
  
  return demandData;
};

export const generateMockComplianceFlags = (): RosterComplianceFlag[] => {
  return [
    {
      id: 'flag-1',
      type: 'ratio_breach',
      severity: 'critical',
      centreId: 'centre-1',
      roomId: 'room-1a',
      date: format(addDays(weekStart, 0), 'yyyy-MM-dd'),
      timeSlot: '15:00-18:30',
      message: 'Ratio breach: 1 educator for 8 children (required 1:4)',
      affectedStaff: [],
    },
    {
      id: 'flag-2',
      type: 'overtime_warning',
      severity: 'warning',
      centreId: 'centre-1',
      date: format(addDays(weekStart, 2), 'yyyy-MM-dd'),
      message: 'Sarah Chen will exceed 38 hours this week',
      affectedStaff: ['staff-2'],
    },
    {
      id: 'flag-3',
      type: 'certificate_expiring',
      severity: 'warning',
      centreId: 'centre-1',
      date: format(addDays(weekStart, 0), 'yyyy-MM-dd'),
      message: 'Sarah Chen\'s First Aid expires on Dec 1, 2024',
      affectedStaff: ['staff-2'],
    },
    {
      id: 'flag-4',
      type: 'no_first_aid',
      severity: 'critical',
      centreId: 'centre-3',
      roomId: 'room-3a',
      date: format(addDays(weekStart, 1), 'yyyy-MM-dd'),
      timeSlot: '06:00-14:00',
      message: 'No staff with valid First Aid certificate rostered',
      affectedStaff: ['staff-6'],
    },
    {
      id: 'flag-5',
      type: 'understaffed',
      severity: 'critical',
      centreId: 'centre-2',
      roomId: 'room-2b',
      date: format(addDays(weekStart, 3), 'yyyy-MM-dd'),
      timeSlot: '07:00-18:00',
      message: 'Open shift unfilled: requires qualified educator',
    },
    {
      id: 'flag-6',
      type: 'qualification_gap',
      severity: 'warning',
      centreId: 'centre-1',
      roomId: 'room-1c',
      date: format(addDays(weekStart, 0), 'yyyy-MM-dd'),
      timeSlot: '09:00-15:00',
      message: 'No diploma-qualified educator rostered (minimum 1 required)',
      affectedStaff: ['staff-5'],
    },
  ];
};
