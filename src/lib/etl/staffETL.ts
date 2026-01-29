// ETL Pipeline for transforming CSV/Excel data to Staff profile format
import { StaffMember, EmploymentStatus, EmploymentType, PayRateType, Gender } from '@/types/staff';
import { format, parseISO, isValid, parse } from 'date-fns';

// ==================== TYPES ====================

export interface StaffFieldMapping {
  sourceField: string;
  targetField: keyof StaffMember | string; // Supports nested paths like 'address.line1'
  transform?: (value: any, record: Record<string, any>) => any;
  required: boolean;
  defaultValue?: any;
}

export interface StaffImportResult {
  success: number;
  failed: number;
  warnings: number;
  records: ImportedStaffRecord[];
  errors: StaffImportError[];
}

export interface ImportedStaffRecord {
  index: number;
  data: Partial<StaffMember>;
  status: 'success' | 'warning' | 'error';
  messages: string[];
}

export interface StaffImportError {
  recordIndex: number;
  field: string;
  message: string;
  rawValue: any;
}

export interface ColumnMappingConfig {
  sourceColumn: string;
  targetField: string;
  transformType?: TransformType;
  customTransform?: string;
}

export type TransformType = 
  | 'none'
  | 'uppercase'
  | 'lowercase'
  | 'trim'
  | 'date_dmy'
  | 'date_mdy'
  | 'date_ymd'
  | 'boolean'
  | 'number'
  | 'phone_au'
  | 'employment_status'
  | 'employment_type'
  | 'pay_rate_type'
  | 'gender';

// ==================== DATABASE FIELD DEFINITIONS ====================

export interface TargetFieldDefinition {
  path: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'enum' | 'array';
  required: boolean;
  category: string;
  enumValues?: string[];
}

export const STAFF_TARGET_FIELDS: TargetFieldDefinition[] = [
  // Personal Details
  { path: 'firstName', label: 'First Name', type: 'string', required: true, category: 'Personal' },
  { path: 'middleName', label: 'Middle Name', type: 'string', required: false, category: 'Personal' },
  { path: 'lastName', label: 'Last Name', type: 'string', required: true, category: 'Personal' },
  { path: 'preferredName', label: 'Preferred Name', type: 'string', required: false, category: 'Personal' },
  { path: 'email', label: 'Email', type: 'string', required: true, category: 'Personal' },
  { path: 'mobilePhone', label: 'Mobile Phone', type: 'string', required: true, category: 'Personal' },
  { path: 'workPhone', label: 'Work Phone', type: 'string', required: false, category: 'Personal' },
  { path: 'gender', label: 'Gender', type: 'enum', required: false, category: 'Personal', enumValues: ['male', 'female', 'other', 'prefer_not_to_say'] },
  { path: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: false, category: 'Personal' },
  
  // Employment
  { path: 'employeeId', label: 'Employee ID', type: 'string', required: true, category: 'Employment' },
  { path: 'employmentStartDate', label: 'Start Date', type: 'date', required: true, category: 'Employment' },
  { path: 'employmentEndDate', label: 'End Date', type: 'date', required: false, category: 'Employment' },
  { path: 'status', label: 'Status', type: 'enum', required: true, category: 'Employment', enumValues: ['active', 'inactive', 'onboarding', 'terminated'] },
  { path: 'department', label: 'Department', type: 'string', required: false, category: 'Employment' },
  { path: 'position', label: 'Position', type: 'string', required: true, category: 'Employment' },
  
  // Address
  { path: 'address.line1', label: 'Address Line 1', type: 'string', required: false, category: 'Address' },
  { path: 'address.line2', label: 'Address Line 2', type: 'string', required: false, category: 'Address' },
  { path: 'address.suburb', label: 'Suburb', type: 'string', required: false, category: 'Address' },
  { path: 'address.state', label: 'State', type: 'string', required: false, category: 'Address' },
  { path: 'address.postcode', label: 'Postcode', type: 'string', required: false, category: 'Address' },
  { path: 'address.country', label: 'Country', type: 'string', required: false, category: 'Address' },
  
  // Bank Details
  { path: 'bankDetails.accountName', label: 'Account Name', type: 'string', required: false, category: 'Bank' },
  { path: 'bankDetails.bsb', label: 'BSB', type: 'string', required: false, category: 'Bank' },
  { path: 'bankDetails.accountNumber', label: 'Account Number', type: 'string', required: false, category: 'Bank' },
  { path: 'bankDetails.superFundName', label: 'Super Fund Name', type: 'string', required: false, category: 'Bank' },
  { path: 'bankDetails.superMemberNumber', label: 'Super Member Number', type: 'string', required: false, category: 'Bank' },
  { path: 'taxFileNumber', label: 'Tax File Number', type: 'string', required: false, category: 'Bank' },
  
  // Pay Conditions
  { path: 'currentPayCondition.payRateType', label: 'Pay Rate Type', type: 'enum', required: false, category: 'Pay', enumValues: ['hourly', 'salary', 'award'] },
  { path: 'currentPayCondition.hourlyRate', label: 'Hourly Rate', type: 'number', required: false, category: 'Pay' },
  { path: 'currentPayCondition.annualSalary', label: 'Annual Salary', type: 'number', required: false, category: 'Pay' },
  { path: 'currentPayCondition.employmentType', label: 'Employment Type', type: 'enum', required: false, category: 'Pay', enumValues: ['full_time', 'part_time', 'casual', 'contractor'] },
  { path: 'currentPayCondition.contractedHours', label: 'Contracted Hours', type: 'number', required: false, category: 'Pay' },
  { path: 'currentPayCondition.industryAward', label: 'Industry Award', type: 'string', required: false, category: 'Pay' },
  { path: 'currentPayCondition.classification', label: 'Classification', type: 'string', required: false, category: 'Pay' },
  
  // Other
  { path: 'payrollId', label: 'Payroll ID', type: 'string', required: false, category: 'Other' },
  { path: 'timeClockPasscode', label: 'Time Clock Passcode', type: 'string', required: false, category: 'Other' },
  { path: 'notes', label: 'Notes', type: 'string', required: false, category: 'Other' },
];

// ==================== TRANSFORM FUNCTIONS ====================

export function normalizeDate(value: any, dateFormat?: string): string {
  if (!value) return '';
  
  if (typeof value === 'string') {
    // Try ISO format first
    if (value.includes('T') || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const parsed = parseISO(value);
      if (isValid(parsed)) return format(parsed, 'yyyy-MM-dd');
    }
    
    // Try DD/MM/YYYY (Australian format)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
      const parsed = parse(value, 'dd/MM/yyyy', new Date());
      if (isValid(parsed)) return format(parsed, 'yyyy-MM-dd');
    }
    
    // Try MM/DD/YYYY (US format)
    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(value)) {
      const parsed = parse(value, 'MM-dd-yyyy', new Date());
      if (isValid(parsed)) return format(parsed, 'yyyy-MM-dd');
    }
  }
  
  if (value instanceof Date && isValid(value)) {
    return format(value, 'yyyy-MM-dd');
  }
  
  return '';
}

export function normalizePhone(value: any): string {
  if (!value) return '';
  // Remove all non-digit characters except +
  let phone = String(value).replace(/[^\d+]/g, '');
  
  // Add Australian country code if starts with 0
  if (phone.startsWith('0') && phone.length === 10) {
    phone = '+61 ' + phone.substring(1);
  }
  
  // Format with spaces
  if (phone.startsWith('+61')) {
    return phone.replace(/(\+61)(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
  }
  
  return phone;
}

export function normalizeBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return ['true', 'yes', 'y', '1', 'active', 'on'].includes(lower);
  }
  return false;
}

export function toNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Remove currency symbols and commas
    const cleaned = value.replace(/[$,]/g, '').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function normalizeEmploymentStatus(value: any): EmploymentStatus {
  if (!value) return 'active';
  const lower = String(value).toLowerCase().trim();
  
  const statusMap: Record<string, EmploymentStatus> = {
    'active': 'active',
    'employed': 'active',
    'current': 'active',
    'inactive': 'inactive',
    'leave': 'inactive',
    'on leave': 'inactive',
    'onboarding': 'onboarding',
    'new': 'onboarding',
    'pending': 'onboarding',
    'terminated': 'terminated',
    'resigned': 'terminated',
    'left': 'terminated',
    'former': 'terminated',
  };
  
  return statusMap[lower] || 'active';
}

export function normalizeEmploymentType(value: any): EmploymentType {
  if (!value) return 'full_time';
  const lower = String(value).toLowerCase().trim().replace(/[\s-]/g, '_');
  
  const typeMap: Record<string, EmploymentType> = {
    'full_time': 'full_time',
    'fulltime': 'full_time',
    'ft': 'full_time',
    'part_time': 'part_time',
    'parttime': 'part_time',
    'pt': 'part_time',
    'casual': 'casual',
    'cas': 'casual',
    'contractor': 'contractor',
    'contract': 'contractor',
  };
  
  return typeMap[lower] || 'full_time';
}

export function normalizeGender(value: any): Gender | undefined {
  if (!value) return undefined;
  const lower = String(value).toLowerCase().trim();
  
  const genderMap: Record<string, Gender> = {
    'male': 'male',
    'm': 'male',
    'female': 'female',
    'f': 'female',
    'other': 'other',
    'o': 'other',
    'prefer_not_to_say': 'prefer_not_to_say',
    'prefer not to say': 'prefer_not_to_say',
    'not specified': 'prefer_not_to_say',
  };
  
  return genderMap[lower];
}

// ==================== TRANSFORM REGISTRY ====================

export const TRANSFORM_FUNCTIONS: Record<TransformType, (value: any) => any> = {
  none: (v) => v,
  uppercase: (v) => String(v || '').toUpperCase(),
  lowercase: (v) => String(v || '').toLowerCase(),
  trim: (v) => String(v || '').trim(),
  date_dmy: (v) => normalizeDate(v, 'dd/MM/yyyy'),
  date_mdy: (v) => normalizeDate(v, 'MM/dd/yyyy'),
  date_ymd: (v) => normalizeDate(v),
  boolean: normalizeBoolean,
  number: toNumber,
  phone_au: normalizePhone,
  employment_status: normalizeEmploymentStatus,
  employment_type: normalizeEmploymentType,
  pay_rate_type: (v) => {
    const lower = String(v || '').toLowerCase();
    if (lower.includes('salary')) return 'salary';
    if (lower.includes('award')) return 'award';
    return 'hourly';
  },
  gender: normalizeGender,
};

// ==================== ETL PIPELINE ====================

export class StaffETLPipeline {
  private mappings: ColumnMappingConfig[] = [];
  
  setMappings(mappings: ColumnMappingConfig[]): void {
    this.mappings = mappings;
  }
  
  getMappings(): ColumnMappingConfig[] {
    return this.mappings;
  }
  
  // Auto-detect column mappings based on header names
  autoDetectMappings(headers: string[]): ColumnMappingConfig[] {
    const detected: ColumnMappingConfig[] = [];
    
    const headerMappings: Record<string, { target: string; transform?: TransformType }> = {
      // Personal
      'first name': { target: 'firstName' },
      'firstname': { target: 'firstName' },
      'first_name': { target: 'firstName' },
      'given name': { target: 'firstName' },
      'last name': { target: 'lastName' },
      'lastname': { target: 'lastName' },
      'last_name': { target: 'lastName' },
      'surname': { target: 'lastName' },
      'family name': { target: 'lastName' },
      'middle name': { target: 'middleName' },
      'middlename': { target: 'middleName' },
      'preferred name': { target: 'preferredName' },
      'email': { target: 'email' },
      'email address': { target: 'email' },
      'mobile': { target: 'mobilePhone', transform: 'phone_au' },
      'mobile phone': { target: 'mobilePhone', transform: 'phone_au' },
      'phone': { target: 'mobilePhone', transform: 'phone_au' },
      'work phone': { target: 'workPhone', transform: 'phone_au' },
      'gender': { target: 'gender', transform: 'gender' },
      'sex': { target: 'gender', transform: 'gender' },
      'dob': { target: 'dateOfBirth', transform: 'date_dmy' },
      'date of birth': { target: 'dateOfBirth', transform: 'date_dmy' },
      'birth date': { target: 'dateOfBirth', transform: 'date_dmy' },
      
      // Employment
      'employee id': { target: 'employeeId' },
      'employeeid': { target: 'employeeId' },
      'employee_id': { target: 'employeeId' },
      'emp id': { target: 'employeeId' },
      'staff id': { target: 'employeeId' },
      'start date': { target: 'employmentStartDate', transform: 'date_dmy' },
      'employment start': { target: 'employmentStartDate', transform: 'date_dmy' },
      'hire date': { target: 'employmentStartDate', transform: 'date_dmy' },
      'end date': { target: 'employmentEndDate', transform: 'date_dmy' },
      'termination date': { target: 'employmentEndDate', transform: 'date_dmy' },
      'status': { target: 'status', transform: 'employment_status' },
      'employment status': { target: 'status', transform: 'employment_status' },
      'department': { target: 'department' },
      'dept': { target: 'department' },
      'position': { target: 'position' },
      'job title': { target: 'position' },
      'title': { target: 'position' },
      'role': { target: 'position' },
      
      // Address
      'address': { target: 'address.line1' },
      'address line 1': { target: 'address.line1' },
      'street': { target: 'address.line1' },
      'address line 2': { target: 'address.line2' },
      'suburb': { target: 'address.suburb' },
      'city': { target: 'address.suburb' },
      'state': { target: 'address.state' },
      'postcode': { target: 'address.postcode' },
      'zip': { target: 'address.postcode' },
      'postal code': { target: 'address.postcode' },
      'country': { target: 'address.country' },
      
      // Bank
      'bsb': { target: 'bankDetails.bsb' },
      'account number': { target: 'bankDetails.accountNumber' },
      'account name': { target: 'bankDetails.accountName' },
      'bank account': { target: 'bankDetails.accountNumber' },
      'super fund': { target: 'bankDetails.superFundName' },
      'super member': { target: 'bankDetails.superMemberNumber' },
      'tfn': { target: 'taxFileNumber' },
      'tax file number': { target: 'taxFileNumber' },
      
      // Pay
      'hourly rate': { target: 'currentPayCondition.hourlyRate', transform: 'number' },
      'rate': { target: 'currentPayCondition.hourlyRate', transform: 'number' },
      'pay rate': { target: 'currentPayCondition.hourlyRate', transform: 'number' },
      'salary': { target: 'currentPayCondition.annualSalary', transform: 'number' },
      'annual salary': { target: 'currentPayCondition.annualSalary', transform: 'number' },
      'employment type': { target: 'currentPayCondition.employmentType', transform: 'employment_type' },
      'contract type': { target: 'currentPayCondition.employmentType', transform: 'employment_type' },
      'contracted hours': { target: 'currentPayCondition.contractedHours', transform: 'number' },
      'hours': { target: 'currentPayCondition.contractedHours', transform: 'number' },
      'award': { target: 'currentPayCondition.industryAward' },
      'industry award': { target: 'currentPayCondition.industryAward' },
      'classification': { target: 'currentPayCondition.classification' },
      'level': { target: 'currentPayCondition.classification' },
      
      // Other
      'payroll id': { target: 'payrollId' },
      'passcode': { target: 'timeClockPasscode' },
      'pin': { target: 'timeClockPasscode' },
      'notes': { target: 'notes' },
      'comments': { target: 'notes' },
    };
    
    for (const header of headers) {
      const normalized = header.toLowerCase().trim();
      const mapping = headerMappings[normalized];
      
      if (mapping) {
        detected.push({
          sourceColumn: header,
          targetField: mapping.target,
          transformType: mapping.transform || 'none',
        });
      }
    }
    
    return detected;
  }
  
  // Transform a single record
  transformRecord(record: Record<string, any>, index: number): ImportedStaffRecord {
    const data: Record<string, any> = {};
    const messages: string[] = [];
    let hasError = false;
    
    for (const mapping of this.mappings) {
      const { sourceColumn, targetField, transformType = 'none' } = mapping;
      const rawValue = record[sourceColumn];
      
      if (rawValue === undefined || rawValue === null || rawValue === '') {
        // Check if required
        const fieldDef = STAFF_TARGET_FIELDS.find(f => f.path === targetField);
        if (fieldDef?.required) {
          messages.push(`Missing required field: ${fieldDef.label}`);
          hasError = true;
        }
        continue;
      }
      
      try {
        const transform = TRANSFORM_FUNCTIONS[transformType] || TRANSFORM_FUNCTIONS.none;
        const transformedValue = transform(rawValue);
        
        // Handle nested paths (e.g., 'address.line1')
        if (targetField.includes('.')) {
          const parts = targetField.split('.');
          if (!data[parts[0]]) data[parts[0]] = {};
          data[parts[0]][parts[1]] = transformedValue;
        } else {
          data[targetField] = transformedValue;
        }
      } catch (error) {
        messages.push(`Error transforming ${sourceColumn}: ${error}`);
        hasError = true;
      }
    }
    
    // Validate required fields
    if (!data.firstName) {
      messages.push('First name is required');
      hasError = true;
    }
    if (!data.lastName) {
      messages.push('Last name is required');
      hasError = true;
    }
    if (!data.email) {
      messages.push('Email is required');
      hasError = true;
    }
    
    // Set defaults
    if (!data.id) {
      data.id = `staff-import-${Date.now()}-${index}`;
    }
    if (!data.status) {
      data.status = 'active';
    }
    if (!data.weeklyAvailability) {
      data.weeklyAvailability = [];
    }
    if (!data.payConditionHistory) {
      data.payConditionHistory = [];
    }
    if (!data.customAllowances) {
      data.customAllowances = [];
    }
    if (!data.emergencyContacts) {
      data.emergencyContacts = [];
    }
    if (!data.qualifications) {
      data.qualifications = [];
    }
    if (!data.availabilityPattern) {
      data.availabilityPattern = 'same_every_week';
    }
    
    const now = new Date().toISOString();
    data.createdAt = now;
    data.updatedAt = now;
    
    return {
      index,
      data: data as Partial<StaffMember>,
      status: hasError ? 'error' : messages.length > 0 ? 'warning' : 'success',
      messages,
    };
  }
  
  // Transform all records
  transform(records: Record<string, any>[]): StaffImportResult {
    const results: ImportedStaffRecord[] = [];
    const errors: StaffImportError[] = [];
    
    let success = 0;
    let failed = 0;
    let warnings = 0;
    
    for (let i = 0; i < records.length; i++) {
      const result = this.transformRecord(records[i], i);
      results.push(result);
      
      if (result.status === 'success') {
        success++;
      } else if (result.status === 'warning') {
        warnings++;
        success++; // Warnings still count as successful
      } else {
        failed++;
        for (const msg of result.messages) {
          errors.push({
            recordIndex: i,
            field: '',
            message: msg,
            rawValue: records[i],
          });
        }
      }
    }
    
    return { success, failed, warnings, records: results, errors };
  }
}

// Singleton instance
export const staffETL = new StaffETLPipeline();
