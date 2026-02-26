import { z } from 'zod';

// Common validation helpers
const requiredString = (fieldName: string) =>
  z.string().min(1, { message: `${fieldName} is required` });

const timeString = z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
  message: 'Invalid time format (HH:MM)',
});

// Shift validation schema
export const shiftSchema = z.object({
  staffId: requiredString('Staff'),
  centreId: requiredString('Centre'),
  roomId: requiredString('Room'),
  date: requiredString('Date'),
  startTime: timeString,
  endTime: timeString,
  breakMinutes: z.number().min(0).max(120),
  status: z.enum(['draft', 'published', 'confirmed', 'completed']),
  isOpenShift: z.boolean(),
  notes: z.string().max(500).optional(),
}).refine(
  (data) => {
    const [startH, startM] = data.startTime.split(':').map(Number);
    const [endH, endM] = data.endTime.split(':').map(Number);
    return (endH * 60 + endM) > (startH * 60 + startM);
  },
  { message: 'End time must be after start time', path: ['endTime'] }
);

export type ShiftFormValues = z.infer<typeof shiftSchema>;

// Shift swap validation schema
export const shiftSwapSchema = z.object({
  shiftId: requiredString('Shift'),
  fromStaffId: requiredString('Current staff'),
  toStaffId: requiredString('New staff'),
  reason: z.string().max(500).optional(),
});

export type ShiftSwapFormValues = z.infer<typeof shiftSwapSchema>;

// Open shift validation schema
export const openShiftSchema = z.object({
  centreId: requiredString('Centre'),
  roomId: requiredString('Room'),
  date: requiredString('Date'),
  startTime: timeString,
  endTime: timeString,
  urgency: z.enum(['low', 'medium', 'high', 'critical']),
  requiredQualifications: z.array(z.string()),
  requiredEmployeeCount: z.number().min(1).max(50).optional(),
  notes: z.string().max(500).optional(),
  
  // Template-based fields
  breakMinutes: z.number().min(0).max(120).optional(),
  shiftType: z.enum(['regular', 'on_call', 'sleepover', 'broken', 'recall', 'emergency']).optional(),
  minimumClassification: z.string().optional(),
  preferredRole: z.enum(['lead_educator', 'educator', 'assistant', 'cook', 'admin']).optional(),
  templateId: z.string().optional(),
  selectedAllowances: z.array(z.string()).optional(),
  
  // On-call settings
  onCallStandbyRate: z.number().optional(),
  onCallStandbyRateType: z.enum(['per_period', 'per_hour', 'daily']).optional(),
  onCallCallbackMinimumHours: z.number().optional(),
  
  // Sleepover settings
  sleepoverBedtimeStart: z.string().optional(),
  sleepoverBedtimeEnd: z.string().optional(),
  sleepoverFlatRate: z.number().optional(),
  
  // Broken shift settings
  brokenFirstShiftEnd: z.string().optional(),
  brokenSecondShiftStart: z.string().optional(),
  brokenUnpaidGapMinutes: z.number().optional(),
  
  // Higher duties and travel
  higherDutiesClassification: z.string().optional(),
  isRemoteLocation: z.boolean().optional(),
  defaultTravelKilometres: z.number().optional(),
}).refine(
  (data) => {
    const [startH, startM] = data.startTime.split(':').map(Number);
    const [endH, endM] = data.endTime.split(':').map(Number);
    // Allow overnight shifts (end time before start time)
    if (data.shiftType === 'on_call' || data.shiftType === 'sleepover') return true;
    return (endH * 60 + endM) > (startH * 60 + startM);
  },
  { message: 'End time must be after start time', path: ['endTime'] }
);

export type OpenShiftFormValues = z.infer<typeof openShiftSchema>;

// Leave request validation schema
export const leaveRequestSchema = z.object({
  staffId: requiredString('Staff'),
  startDate: requiredString('Start date'),
  endDate: requiredString('End date'),
  type: z.enum(['annual_leave', 'sick_leave', 'personal_leave', 'unpaid_leave']),
  notes: z.string().max(500).optional(),
}).refine(
  (data) => new Date(data.endDate) >= new Date(data.startDate),
  { message: 'End date must be on or after start date', path: ['endDate'] }
);

export type LeaveRequestFormValues = z.infer<typeof leaveRequestSchema>;

// Budget settings validation schema
export const budgetSettingsSchema = z.object({
  weeklyBudget: z.number().min(0).max(1000000),
  warningThreshold: z.number().min(0).max(100),
  criticalThreshold: z.number().min(0).max(100),
  includeOvertimeCosts: z.boolean(),
  includePenaltyRates: z.boolean(),
});

export type BudgetSettingsFormValues = z.infer<typeof budgetSettingsSchema>;

// Shift copy validation schema
export const shiftCopySchema = z.object({
  sourceShiftId: requiredString('Source shift'),
  targetDates: z.array(z.string()).min(1, { message: 'Select at least one date' }),
  copyMode: z.enum(['single', 'multiple', 'recurring']),
  recurringPattern: z.enum(['daily', 'weekly', 'fortnightly']).optional(),
  recurringEndDate: z.string().optional(),
  targetRoomId: z.string().optional(),
  copyToAllRooms: z.boolean().default(false),
  // New: allow copying to different staff members
  targetStaffIds: z.array(z.string()).optional(),
  keepOriginalStaff: z.boolean().default(true),
});

export type ShiftCopyFormValues = z.infer<typeof shiftCopySchema>;

// Scheduling preferences validation schema
export const schedulingPreferencesSchema = z.object({
  preferredRooms: z.array(z.string()),
  avoidRooms: z.array(z.string()),
  maxConsecutiveDays: z.number().min(1).max(14),
  minRestHoursBetweenShifts: z.number().min(8).max(24),
  preferEarlyShifts: z.boolean(),
  preferLateShifts: z.boolean(),
  maxShiftsPerWeek: z.number().min(1).max(7),
  notifyOnPublish: z.boolean(),
  notifyOnSwap: z.boolean(),
  notifyOnOpenShifts: z.boolean(),
});

export type SchedulingPreferencesFormValues = z.infer<typeof schedulingPreferencesSchema>;

// Roster template validation schema
export const rosterTemplateSchema = z.object({
  name: requiredString('Template name')
    .min(3, { message: 'Name must be at least 3 characters' })
    .max(100, { message: 'Name must be less than 100 characters' }),
  description: z.string().max(500).optional(),
  centreId: requiredString('Centre'),
  isActive: z.boolean().default(true),
});

export type RosterTemplateFormValues = z.infer<typeof rosterTemplateSchema>;

// Bulk assignment validation schema  
export const bulkAssignmentSchema = z.object({
  staffIds: z.array(z.string()).min(1, { message: 'Select at least one staff member' }),
  roomId: requiredString('Room'),
  dates: z.array(z.string()).min(1, { message: 'Select at least one date' }),
  shiftTemplateId: z.string().optional(),
  startTime: timeString.optional(),
  endTime: timeString.optional(),
  breakMinutes: z.number().min(0).max(120).optional(),
});

export type BulkAssignmentFormValues = z.infer<typeof bulkAssignmentSchema>;

// Staff member validation schema
export const staffMemberSchema = z.object({
  name: requiredString('Name')
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name must be less than 100 characters' }),
  email: z.string().email({ message: 'Invalid email address' }).optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  role: z.enum(['lead_educator', 'educator', 'assistant', 'cook', 'admin']),
  employmentType: z.enum(['permanent', 'casual']),
  hourlyRate: z.number().min(0).max(500),
  maxHoursPerWeek: z.number().min(1).max(60),
});

export type StaffMemberFormValues = z.infer<typeof staffMemberSchema>;

// Validation helper functions
export const validateShift = (data: unknown) => shiftSchema.safeParse(data);
export const validateShiftSwap = (data: unknown) => shiftSwapSchema.safeParse(data);
export const validateOpenShift = (data: unknown) => openShiftSchema.safeParse(data);
export const validateLeaveRequest = (data: unknown) => leaveRequestSchema.safeParse(data);
export const validateBudgetSettings = (data: unknown) => budgetSettingsSchema.safeParse(data);
export const validateShiftCopy = (data: unknown) => shiftCopySchema.safeParse(data);
export const validateSchedulingPreferences = (data: unknown) => schedulingPreferencesSchema.safeParse(data);
export const validateRosterTemplate = (data: unknown) => rosterTemplateSchema.safeParse(data);
export const validateBulkAssignment = (data: unknown) => bulkAssignmentSchema.safeParse(data);
export const validateStaffMember = (data: unknown) => staffMemberSchema.safeParse(data);
