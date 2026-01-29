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
  
  // Calculate similarity score between two strings (0-1)
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().replace(/[_\-\s]+/g, '');
    const s2 = str2.toLowerCase().replace(/[_\-\s]+/g, '');
    
    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;
    
    // Check if one contains the other
    if (s1.includes(s2) || s2.includes(s1)) {
      const ratio = Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length);
      return 0.7 + (ratio * 0.3);
    }
    
    // Levenshtein distance based similarity
    const matrix: number[][] = [];
    for (let i = 0; i <= s1.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= s2.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    const distance = matrix[s1.length][s2.length];
    const maxLen = Math.max(s1.length, s2.length);
    return 1 - (distance / maxLen);
  }

  // Get all keywords/aliases for a target field
  private getFieldAliases(): Record<string, { aliases: string[]; transform?: TransformType }> {
    return {
      // Personal
      'firstName': { aliases: ['first name', 'firstname', 'first_name', 'given name', 'givenname', 'forename'] },
      'lastName': { aliases: ['last name', 'lastname', 'last_name', 'surname', 'family name', 'familyname'] },
      'middleName': { aliases: ['middle name', 'middlename', 'middle_name', 'middle'] },
      'preferredName': { aliases: ['preferred name', 'preferredname', 'preferred_name', 'nickname', 'known as'] },
      'email': { aliases: ['email', 'email address', 'emailaddress', 'e-mail', 'mail'] },
      'mobilePhone': { aliases: ['mobile', 'mobile phone', 'mobilephone', 'cell', 'cell phone', 'cellphone', 'phone', 'telephone', 'contact number'], transform: 'phone_au' },
      'workPhone': { aliases: ['work phone', 'workphone', 'work_phone', 'office phone', 'business phone'], transform: 'phone_au' },
      'gender': { aliases: ['gender', 'sex'], transform: 'gender' },
      'dateOfBirth': { aliases: ['date of birth', 'dateofbirth', 'dob', 'birth date', 'birthdate', 'birthday'], transform: 'date_dmy' },
      
      // Employment
      'employeeId': { aliases: ['employee id', 'employeeid', 'employee_id', 'emp id', 'empid', 'staff id', 'staffid', 'id', 'employee number', 'emp no', 'employee no'] },
      'employmentStartDate': { aliases: ['start date', 'startdate', 'start_date', 'employment start', 'hire date', 'hiredate', 'hired', 'commenced', 'commencement date'], transform: 'date_dmy' },
      'employmentEndDate': { aliases: ['end date', 'enddate', 'end_date', 'termination date', 'terminationdate', 'finish date', 'finishdate', 'left date'], transform: 'date_dmy' },
      'status': { aliases: ['status', 'employment status', 'employmentstatus', 'emp status', 'active', 'state'], transform: 'employment_status' },
      'department': { aliases: ['department', 'dept', 'division', 'team', 'unit', 'group', 'section'] },
      'position': { aliases: ['position', 'job title', 'jobtitle', 'title', 'role', 'occupation', 'job', 'designation'] },
      
      // Address
      'address.line1': { aliases: ['address', 'address line 1', 'addressline1', 'address1', 'street', 'street address', 'line1'] },
      'address.line2': { aliases: ['address line 2', 'addressline2', 'address2', 'line2', 'unit', 'apt', 'apartment'] },
      'address.suburb': { aliases: ['suburb', 'city', 'town', 'locality'] },
      'address.state': { aliases: ['state', 'province', 'region'] },
      'address.postcode': { aliases: ['postcode', 'post code', 'zip', 'zipcode', 'zip code', 'postal code', 'postalcode'] },
      'address.country': { aliases: ['country', 'nation'] },
      
      // Bank
      'bankDetails.bsb': { aliases: ['bsb', 'bsb number', 'bsbnumber', 'bank bsb', 'routing number'] },
      'bankDetails.accountNumber': { aliases: ['account number', 'accountnumber', 'account_number', 'bank account', 'acc no', 'acc number'] },
      'bankDetails.accountName': { aliases: ['account name', 'accountname', 'account_name', 'bank account name'] },
      'bankDetails.superFundName': { aliases: ['super fund', 'superfund', 'super fund name', 'superannuation', 'super'] },
      'bankDetails.superMemberNumber': { aliases: ['super member', 'supermember', 'super member number', 'member number', 'super no'] },
      'taxFileNumber': { aliases: ['tfn', 'tax file number', 'taxfilenumber', 'tax_file_number'] },
      
      // Pay
      'currentPayCondition.hourlyRate': { aliases: ['hourly rate', 'hourlyrate', 'rate', 'pay rate', 'payrate', 'hour rate', 'rate per hour'], transform: 'number' },
      'currentPayCondition.annualSalary': { aliases: ['salary', 'annual salary', 'annualsalary', 'yearly salary', 'annual pay'], transform: 'number' },
      'currentPayCondition.employmentType': { aliases: ['employment type', 'employmenttype', 'emp type', 'contract type', 'work type', 'type'], transform: 'employment_type' },
      'currentPayCondition.contractedHours': { aliases: ['contracted hours', 'contractedhours', 'hours', 'weekly hours', 'work hours'], transform: 'number' },
      'currentPayCondition.industryAward': { aliases: ['award', 'industry award', 'industryaward', 'modern award'] },
      'currentPayCondition.classification': { aliases: ['classification', 'class', 'level', 'grade', 'pay level'] },
      
      // Other
      'payrollId': { aliases: ['payroll id', 'payrollid', 'payroll_id', 'payroll number', 'payroll no'] },
      'timeClockPasscode': { aliases: ['passcode', 'time clock passcode', 'pin', 'clock pin', 'time pin'] },
      'notes': { aliases: ['notes', 'comments', 'remarks', 'memo', 'additional info'] },
    };
  }

  // Auto-detect column mappings based on header name similarity
  autoDetectMappings(headers: string[]): ColumnMappingConfig[] {
    const detected: ColumnMappingConfig[] = [];
    const usedTargets = new Set<string>();
    const fieldAliases = this.getFieldAliases();
    
    // Score each header against all target fields
    const scoredMappings: Array<{
      header: string;
      target: string;
      score: number;
      transform?: TransformType;
    }> = [];
    
    for (const header of headers) {
      const normalizedHeader = header.toLowerCase().trim();
      
      for (const [targetField, config] of Object.entries(fieldAliases)) {
        let bestScore = 0;
        
        // Check exact match with aliases
        for (const alias of config.aliases) {
          const similarity = this.calculateSimilarity(normalizedHeader, alias);
          bestScore = Math.max(bestScore, similarity);
        }
        
        // Also check against the target field label
        const fieldDef = STAFF_TARGET_FIELDS.find(f => f.path === targetField);
        if (fieldDef) {
          const labelSimilarity = this.calculateSimilarity(normalizedHeader, fieldDef.label);
          bestScore = Math.max(bestScore, labelSimilarity);
        }
        
        if (bestScore > 0.5) { // Threshold for suggesting a match
          scoredMappings.push({
            header,
            target: targetField,
            score: bestScore,
            transform: config.transform,
          });
        }
      }
    }
    
    // Sort by score descending and pick best non-conflicting mappings
    scoredMappings.sort((a, b) => b.score - a.score);
    const usedHeaders = new Set<string>();
    
    for (const mapping of scoredMappings) {
      if (!usedHeaders.has(mapping.header) && !usedTargets.has(mapping.target)) {
        detected.push({
          sourceColumn: mapping.header,
          targetField: mapping.target,
          transformType: mapping.transform || 'none',
        });
        usedHeaders.add(mapping.header);
        usedTargets.add(mapping.target);
      }
    }
    
    return detected;
  }
  
  // Get suggested mappings with confidence scores for UI display
  getSuggestedMappings(headers: string[]): Array<{
    sourceColumn: string;
    suggestions: Array<{
      targetField: string;
      confidence: number;
      transform?: TransformType;
    }>;
  }> {
    const fieldAliases = this.getFieldAliases();
    const results: Array<{
      sourceColumn: string;
      suggestions: Array<{
        targetField: string;
        confidence: number;
        transform?: TransformType;
      }>;
    }> = [];
    
    for (const header of headers) {
      const normalizedHeader = header.toLowerCase().trim();
      const suggestions: Array<{
        targetField: string;
        confidence: number;
        transform?: TransformType;
      }> = [];
      
      for (const [targetField, config] of Object.entries(fieldAliases)) {
        let bestScore = 0;
        
        for (const alias of config.aliases) {
          const similarity = this.calculateSimilarity(normalizedHeader, alias);
          bestScore = Math.max(bestScore, similarity);
        }
        
        const fieldDef = STAFF_TARGET_FIELDS.find(f => f.path === targetField);
        if (fieldDef) {
          const labelSimilarity = this.calculateSimilarity(normalizedHeader, fieldDef.label);
          bestScore = Math.max(bestScore, labelSimilarity);
        }
        
        if (bestScore > 0.4) { // Lower threshold for showing suggestions
          suggestions.push({
            targetField,
            confidence: Math.round(bestScore * 100),
            transform: config.transform,
          });
        }
      }
      
      // Sort suggestions by confidence
      suggestions.sort((a, b) => b.confidence - a.confidence);
      
      results.push({
        sourceColumn: header,
        suggestions: suggestions.slice(0, 3), // Top 3 suggestions
      });
    }
    
    return results;
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
