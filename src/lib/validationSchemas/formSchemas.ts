import { z } from 'zod';

// Field option schema
export const fieldOptionSchema = z.object({
  id: z.string().min(1, 'Option ID is required'),
  label: z.string().min(1, 'Option label is required'),
  value: z.string().min(1, 'Option value is required'),
  score: z.number().optional(),
});

// Validation rule schema
export const validationRuleSchema = z.object({
  type: z.enum(['required', 'min_length', 'max_length', 'min_value', 'max_value', 'pattern', 'file_size', 'file_type']),
  value: z.union([z.string(), z.number()]).optional(),
  message: z.string().min(1, 'Validation message is required'),
});

// Conditional logic schema
export const conditionalLogicSchema = z.object({
  id: z.string(),
  action: z.enum(['show', 'hide', 'require', 'set_value']),
  conditions: z.array(z.object({
    fieldId: z.string(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'is_empty', 'is_not_empty']),
    value: z.union([z.string(), z.number(), z.boolean()]),
  })),
  logicOperator: z.enum(['and', 'or']),
});

// Form field schema
export const formFieldSchema = z.object({
  id: z.string().min(1, 'Field ID is required'),
  type: z.enum([
    'short_text', 'long_text', 'number', 'date', 'time', 'datetime',
    'dropdown', 'multi_select', 'radio', 'checkbox',
    'signature', 'photo_upload', 'video_upload', 'file_upload',
    'barcode_scan', 'qr_scan', 'location', 'staff_selector',
    'section_header', 'instructions'
  ]),
  label: z.string().min(1, 'Field label is required').max(200, 'Label must be under 200 characters'),
  description: z.string().max(500, 'Description must be under 500 characters').optional(),
  placeholder: z.string().max(100, 'Placeholder must be under 100 characters').optional(),
  required: z.boolean(),
  options: z.array(fieldOptionSchema).optional(),
  validation: z.array(validationRuleSchema).optional(),
  conditionalLogic: z.array(conditionalLogicSchema).optional(),
  defaultValue: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
  scoring: z.object({
    enabled: z.boolean(),
    passValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
    failValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
    weight: z.number().min(0).max(100).optional(),
  }).optional(),
  settings: z.object({
    maxFiles: z.number().min(1).max(20).optional(),
    acceptedTypes: z.array(z.string()).optional(),
    maxFileSize: z.number().min(1).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().optional(),
    minLength: z.number().min(0).optional(),
    maxLength: z.number().min(1).optional(),
    minDate: z.string().optional(),
    maxDate: z.string().optional(),
    allowMultiple: z.boolean().optional(),
    filterByRole: z.array(z.string()).optional(),
    filterByLocation: z.array(z.string()).optional(),
  }).optional(),
  sectionId: z.string().optional(),
  order: z.number().min(0),
});

// Form section schema
export const formSectionSchema = z.object({
  id: z.string().min(1, 'Section ID is required'),
  title: z.string().min(1, 'Section title is required').max(100, 'Title must be under 100 characters'),
  description: z.string().max(300, 'Description must be under 300 characters').optional(),
  order: z.number().min(0),
  collapsible: z.boolean().optional(),
  defaultCollapsed: z.boolean().optional(),
  conditionalLogic: z.array(conditionalLogicSchema).optional(),
});

// Scoring config schema
export const scoringConfigSchema = z.object({
  enabled: z.boolean(),
  passingScore: z.number().min(0).max(100).optional(),
  failThreshold: z.number().min(0).max(100).optional(),
  weightedScoring: z.boolean().optional(),
  fieldWeights: z.record(z.string(), z.number()).optional(),
});

// Form template schema
export const formTemplateSchema = z.object({
  id: z.string().min(1, 'Template ID is required'),
  name: z.string().min(1, 'Template name is required').max(100, 'Name must be under 100 characters'),
  description: z.string().max(500, 'Description must be under 500 characters').optional(),
  category: z.string().min(1, 'Category is required'),
  version: z.number().min(1),
  status: z.enum(['draft', 'published', 'archived']),
  sections: z.array(formSectionSchema).min(1, 'At least one section is required'),
  fields: z.array(formFieldSchema),
  scoring: scoringConfigSchema.optional(),
  branding: z.object({
    logo: z.string().url().optional(),
    primaryColor: z.string().optional(),
    headerImage: z.string().url().optional(),
  }).optional(),
  settings: z.object({
    allowDrafts: z.boolean().optional(),
    requireSignature: z.boolean().optional(),
    requirePhoto: z.boolean().optional(),
    offlineEnabled: z.boolean().optional(),
    reviewRequired: z.boolean().optional(),
    autoCreateTask: z.boolean().optional(),
    taskTriggerConditions: z.array(z.object({
      fieldId: z.string(),
      operator: z.enum(['equals', 'not_equals', 'less_than', 'greater_than']),
      value: z.union([z.string(), z.number()]),
    })).optional(),
  }).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: z.string().optional(),
  createdBy: z.string().optional(),
});

// Form assignment schema
export const formAssignmentSchema = z.object({
  id: z.string().min(1),
  templateId: z.string().min(1, 'Template is required'),
  name: z.string().min(1, 'Assignment name is required').max(100),
  targetType: z.enum(['individual', 'role', 'team', 'location', 'shift_staff']),
  targetIds: z.array(z.string()).optional(),
  trigger: z.enum(['roster_shift_start', 'roster_shift_end', 'roster_mid_shift', 'scheduled', 'event_based']),
  schedule: z.object({
    frequency: z.enum(['once', 'daily', 'weekly', 'monthly']),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    dayOfMonth: z.number().min(1).max(31).optional(),
    time: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }).optional(),
  dueAfterMinutes: z.number().min(1).max(10080).optional(), // Max 1 week
  escalationRules: z.array(z.object({
    afterMinutes: z.number().min(1),
    notifyUserIds: z.array(z.string()),
    action: z.enum(['notify', 'reassign', 'escalate']),
  })).optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Template name/description edit schema
export const templateDetailsSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be under 100 characters'),
  description: z.string().max(500, 'Description must be under 500 characters'),
});

// Types inferred from schemas
export type FormFieldInput = z.infer<typeof formFieldSchema>;
export type FormSectionInput = z.infer<typeof formSectionSchema>;
export type FormTemplateInput = z.infer<typeof formTemplateSchema>;
export type FormAssignmentInput = z.infer<typeof formAssignmentSchema>;
export type TemplateDetailsInput = z.infer<typeof templateDetailsSchema>;

// Validation helper functions
export function validateFormTemplate(data: unknown) {
  return formTemplateSchema.safeParse(data);
}

export function validateFormField(data: unknown) {
  return formFieldSchema.safeParse(data);
}

export function validateFormSection(data: unknown) {
  return formSectionSchema.safeParse(data);
}

export function validateTemplateDetails(data: unknown) {
  return templateDetailsSchema.safeParse(data);
}

export function validateFormAssignment(data: unknown) {
  return formAssignmentSchema.safeParse(data);
}
