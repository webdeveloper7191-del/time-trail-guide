// Form Builder Types

export type FieldType =
  | 'short_text'
  | 'long_text'
  | 'number'
  | 'date'
  | 'time'
  | 'datetime'
  | 'dropdown'
  | 'multi_select'
  | 'radio'
  | 'checkbox'
  | 'signature'
  | 'photo_upload'
  | 'video_upload'
  | 'file_upload'
  | 'barcode_scan'
  | 'qr_scan'
  | 'location'
  | 'staff_selector'
  | 'section_header'
  | 'instructions';

export interface FieldOption {
  id: string;
  label: string;
  value: string;
  score?: number;
}

export interface ValidationRule {
  type: 'required' | 'min_length' | 'max_length' | 'min_value' | 'max_value' | 'pattern' | 'file_size' | 'file_type';
  value?: string | number;
  message: string;
}

export interface ConditionalLogic {
  id: string;
  action: 'show' | 'hide' | 'require' | 'set_value';
  conditions: {
    fieldId: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
    value: string | number | boolean;
  }[];
  logicOperator: 'and' | 'or';
}

export interface ScoringConfig {
  enabled: boolean;
  passingScore?: number;
  failThreshold?: number;
  weightedScoring?: boolean;
  fieldWeights?: Record<string, number>;
}

// Field width options for grid layout
export type FieldWidth = 'full' | '1/2' | '1/3' | '2/3' | '1/4' | '3/4';

export const FIELD_WIDTH_OPTIONS: { value: FieldWidth; label: string; cols: number }[] = [
  { value: 'full', label: 'Full', cols: 12 },
  { value: '3/4', label: '3/4', cols: 9 },
  { value: '2/3', label: '2/3', cols: 8 },
  { value: '1/2', label: '1/2', cols: 6 },
  { value: '1/3', label: '1/3', cols: 4 },
  { value: '1/4', label: '1/4', cols: 3 },
];

// Saved field template for reuse
export interface FieldTemplate {
  id: string;
  name: string;
  description?: string;
  field: Omit<FormField, 'id' | 'order' | 'sectionId'>;
  createdAt: string;
  category?: string;
}

// Row group for visually grouping related fields
export interface FieldGroup {
  id: string;
  label: string;
  sectionId: string;
  order: number;
  description?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  style?: 'outlined' | 'filled' | 'minimal';
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  width?: FieldWidth;
  options?: FieldOption[];
  validation?: ValidationRule[];
  conditionalLogic?: ConditionalLogic[];
  defaultValue?: string | number | boolean | string[];
  scoring?: {
    enabled: boolean;
    passValue?: string | number | boolean;
    failValue?: string | number | boolean;
    weight?: number;
  };
  settings?: {
    // Photo/Video/File settings
    maxFiles?: number;
    acceptedTypes?: string[];
    maxFileSize?: number;
    // Number settings
    min?: number;
    max?: number;
    step?: number;
    // Text settings
    minLength?: number;
    maxLength?: number;
    // Date/Time settings
    minDate?: string;
    maxDate?: string;
    // Staff selector settings
    allowMultiple?: boolean;
    filterByRole?: string[];
    filterByLocation?: string[];
  };
  sectionId?: string;
  groupId?: string; // Optional group ID for row grouping
  order: number;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  conditionalLogic?: ConditionalLogic[];
}

export interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  version: number;
  status: 'draft' | 'published' | 'archived';
  sections: FormSection[];
  fields: FormField[];
  groups?: FieldGroup[]; // Optional field groups for row grouping
  scoring?: ScoringConfig;
  branding?: {
    logo?: string;
    primaryColor?: string;
    headerImage?: string;
  };
  settings?: {
    allowDrafts?: boolean;
    requireSignature?: boolean;
    requirePhoto?: boolean;
    offlineEnabled?: boolean;
    reviewRequired?: boolean;
    autoCreateTask?: boolean;
    taskTriggerConditions?: {
      fieldId: string;
      operator: 'equals' | 'not_equals' | 'less_than' | 'greater_than';
      value: string | number;
    }[];
  };
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  createdBy?: string;
}

export interface FormSubmission {
  id: string;
  templateId: string;
  templateVersion: number;
  status: 'draft' | 'submitted' | 'pending_review' | 'approved' | 'rejected';
  responses: Record<string, string | number | boolean | string[] | File[]>;
  score?: number;
  passFail?: 'pass' | 'fail' | 'n/a';
  submittedBy: string;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComments?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  attachments?: {
    fieldId: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

// Assignment types
export type AssignmentTarget = 'individual' | 'role' | 'team' | 'location' | 'shift_staff';
export type AssignmentTrigger = 'roster_shift_start' | 'roster_shift_end' | 'roster_mid_shift' | 'scheduled' | 'event_based';

export interface FormAssignment {
  id: string;
  templateId: string;
  name: string;
  targetType: AssignmentTarget;
  targetIds?: string[];
  trigger: AssignmentTrigger;
  schedule?: {
    frequency: 'once' | 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[];
    dayOfMonth?: number;
    time?: string;
    startDate?: string;
    endDate?: string;
  };
  dueAfterMinutes?: number;
  escalationRules?: {
    afterMinutes: number;
    notifyUserIds: string[];
    action: 'notify' | 'reassign' | 'escalate';
  }[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Template categories
export const FORM_CATEGORIES = [
  { id: 'safety', label: 'Safety & Compliance', icon: 'Shield' },
  { id: 'cleaning', label: 'Cleaning & Hygiene', icon: 'Sparkles' },
  { id: 'maintenance', label: 'Maintenance & Equipment', icon: 'Wrench' },
  { id: 'incident', label: 'Incident & Accident', icon: 'AlertTriangle' },
  { id: 'handover', label: 'Handover & Communication', icon: 'ArrowLeftRight' },
  { id: 'inspection', label: 'Inspections & Audits', icon: 'ClipboardCheck' },
  { id: 'training', label: 'Training & Competency', icon: 'GraduationCap' },
  { id: 'custom', label: 'Custom Forms', icon: 'FileText' },
] as const;

// Field type definitions with metadata
export const FIELD_TYPES: { 
  type: FieldType; 
  label: string; 
  icon: string; 
  category: 'basic' | 'choice' | 'media' | 'advanced';
  description: string;
}[] = [
  // Basic fields
  { type: 'short_text', label: 'Short Text', icon: 'Type', category: 'basic', description: 'Single line text input' },
  { type: 'long_text', label: 'Long Text', icon: 'AlignLeft', category: 'basic', description: 'Multi-line text area' },
  { type: 'number', label: 'Number', icon: 'Hash', category: 'basic', description: 'Numeric input with optional range' },
  { type: 'date', label: 'Date', icon: 'Calendar', category: 'basic', description: 'Date picker' },
  { type: 'time', label: 'Time', icon: 'Clock', category: 'basic', description: 'Time picker' },
  { type: 'datetime', label: 'Date & Time', icon: 'CalendarClock', category: 'basic', description: 'Combined date and time' },
  
  // Choice fields
  { type: 'dropdown', label: 'Dropdown', icon: 'ChevronDown', category: 'choice', description: 'Single selection dropdown' },
  { type: 'multi_select', label: 'Multi-Select', icon: 'ListChecks', category: 'choice', description: 'Multiple selection dropdown' },
  { type: 'radio', label: 'Radio Buttons', icon: 'Circle', category: 'choice', description: 'Single choice from visible options' },
  { type: 'checkbox', label: 'Checkbox', icon: 'CheckSquare', category: 'choice', description: 'Yes/No or multiple checkboxes' },
  
  // Media fields
  { type: 'signature', label: 'Signature', icon: 'PenTool', category: 'media', description: 'Digital signature capture' },
  { type: 'photo_upload', label: 'Photo Upload', icon: 'Camera', category: 'media', description: 'Take or upload photos' },
  { type: 'video_upload', label: 'Video Upload', icon: 'Video', category: 'media', description: 'Record or upload videos' },
  { type: 'file_upload', label: 'File Upload', icon: 'Paperclip', category: 'media', description: 'Upload documents or files' },
  
  // Advanced fields
  { type: 'barcode_scan', label: 'Barcode Scan', icon: 'ScanBarcode', category: 'advanced', description: 'Scan barcode using camera' },
  { type: 'qr_scan', label: 'QR Code Scan', icon: 'QrCode', category: 'advanced', description: 'Scan QR code using camera' },
  { type: 'location', label: 'Location', icon: 'MapPin', category: 'advanced', description: 'GPS location capture' },
  { type: 'staff_selector', label: 'Staff Selector', icon: 'Users', category: 'advanced', description: 'Select staff members' },
  
  // Layout fields
  { type: 'section_header', label: 'Section Header', icon: 'Heading', category: 'basic', description: 'Visual section divider' },
  { type: 'instructions', label: 'Instructions', icon: 'Info', category: 'basic', description: 'Read-only instruction text' },
];
