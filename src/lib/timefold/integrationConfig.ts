// Timefold Integration Configuration Types and Storage
// Handles API connection, data mapping, and external constraint import

import { TimefoldConstraint, TimefoldSolverConfig } from '../timefoldSolver';

// ============= ENVIRONMENT TYPES =============

export type EnvironmentType = 'development' | 'staging' | 'production';

export interface ApiEnvironment {
  id: EnvironmentType;
  name: string;
  description: string;
  color: string;
}

export const API_ENVIRONMENTS: ApiEnvironment[] = [
  { id: 'development', name: 'Development', description: 'Local testing environment', color: 'bg-blue-500' },
  { id: 'staging', name: 'Staging', description: 'Pre-production testing', color: 'bg-amber-500' },
  { id: 'production', name: 'Production', description: 'Live production environment', color: 'bg-green-500' },
];

// ============= API CONNECTION TYPES =============

export interface ApiConnectionConfig {
  id: string;
  name: string;
  environment: EnvironmentType;
  endpointUrl: string;
  authType: 'none' | 'api_key' | 'bearer_token' | 'basic_auth' | 'oauth2';
  
  // Auth credentials (stored in localStorage - warning displayed to user)
  apiKey?: string;
  bearerToken?: string;
  basicAuthUsername?: string;
  basicAuthPassword?: string;
  oauth2ClientId?: string;
  oauth2ClientSecret?: string;
  oauth2TokenUrl?: string;
  
  // Request settings
  timeoutSeconds: number;
  retryAttempts: number;
  retryDelayMs: number;
  
  // Headers
  customHeaders: { key: string; value: string }[];
  
  // Health check
  healthCheckPath?: string;
  lastHealthCheck?: {
    timestamp: string;
    status: 'healthy' | 'unhealthy' | 'unknown';
    responseTimeMs?: number;
    error?: string;
  };
  
  // Metadata
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============= DATA MAPPING TYPES =============

export type SolverEntityType = 'shift' | 'staff';

export interface SolverFieldDefinition {
  field: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'time' | 'array' | 'object';
  required: boolean;
  description: string;
  example: string;
}

// Shift Planning Entity fields that can be mapped
export const SHIFT_ENTITY_FIELDS: SolverFieldDefinition[] = [
  { field: 'id', label: 'Shift ID', type: 'string', required: true, description: 'Unique identifier for the shift', example: 'shift-001' },
  { field: 'shiftId', label: 'External Shift ID', type: 'string', required: false, description: 'ID from external system', example: 'EXT-12345' },
  { field: 'date', label: 'Date', type: 'date', required: true, description: 'Shift date (YYYY-MM-DD)', example: '2024-01-15' },
  { field: 'startTime', label: 'Start Time', type: 'time', required: true, description: 'Shift start time (HH:mm)', example: '09:00' },
  { field: 'endTime', label: 'End Time', type: 'time', required: true, description: 'Shift end time (HH:mm)', example: '17:00' },
  { field: 'roomId', label: 'Room/Zone ID', type: 'string', required: true, description: 'Room or zone identifier', example: 'room-babies' },
  { field: 'centreId', label: 'Centre/Location ID', type: 'string', required: true, description: 'Centre or location identifier', example: 'centre-001' },
  { field: 'requiredQualifications', label: 'Required Qualifications', type: 'array', required: false, description: 'List of required qualification codes', example: '["CERT3", "FIRST_AID"]' },
  { field: 'minimumClassification', label: 'Minimum Classification', type: 'string', required: false, description: 'Minimum pay classification level', example: 'L3.1' },
  { field: 'preferredRole', label: 'Preferred Role', type: 'string', required: false, description: 'Preferred staff role', example: 'Lead Educator' },
];

// Staff Planning Entity fields that can be mapped
export const STAFF_ENTITY_FIELDS: SolverFieldDefinition[] = [
  { field: 'id', label: 'Staff ID', type: 'string', required: true, description: 'Unique identifier for staff member', example: 'staff-001' },
  { field: 'name', label: 'Name', type: 'string', required: true, description: 'Staff member full name', example: 'Jane Smith' },
  { field: 'role', label: 'Role', type: 'string', required: true, description: 'Staff role/position', example: 'Educator' },
  { field: 'employmentType', label: 'Employment Type', type: 'string', required: true, description: 'permanent or casual', example: 'permanent' },
  { field: 'isAgency', label: 'Is Agency Staff', type: 'boolean', required: false, description: 'Whether staff is from agency', example: 'false' },
  { field: 'hourlyRate', label: 'Hourly Rate', type: 'number', required: true, description: 'Staff hourly rate in dollars', example: '35.50' },
  { field: 'maxHoursPerWeek', label: 'Max Hours/Week', type: 'number', required: true, description: 'Maximum weekly hours', example: '38' },
  { field: 'currentHoursAssigned', label: 'Current Hours Assigned', type: 'number', required: false, description: 'Hours already assigned this week', example: '24' },
  { field: 'qualifications', label: 'Qualifications', type: 'array', required: true, description: 'List of qualification codes', example: '["DIPLOMA", "FIRST_AID"]' },
  { field: 'availability', label: 'Availability', type: 'array', required: true, description: 'Weekly availability schedule', example: '[{dayOfWeek: 1, available: true}]' },
  { field: 'preferredCentres', label: 'Preferred Centres', type: 'array', required: false, description: 'List of preferred centre IDs', example: '["centre-001"]' },
  { field: 'defaultCentreId', label: 'Default Centre', type: 'string', required: false, description: 'Default centre assignment', example: 'centre-001' },
  { field: 'leavesDates', label: 'Leave Dates', type: 'array', required: false, description: 'List of leave dates', example: '["2024-01-20", "2024-01-21"]' },
];

export interface FieldMappingConfig {
  id: string;
  sourceField: string;
  targetField: string;
  targetEntity: SolverEntityType;
  transform?: 'none' | 'to_string' | 'to_number' | 'to_boolean' | 'to_date' | 'to_time' | 'to_array' | 'json_parse' | 'custom';
  customTransformCode?: string; // JavaScript code for custom transform
  defaultValue?: string;
  isRequired: boolean;
  isActive: boolean;
}

export interface DataMappingProfile {
  id: string;
  name: string;
  description?: string;
  sourceSystem: string; // e.g., 'xplor', 'employment_hero', 'custom'
  shiftMappings: FieldMappingConfig[];
  staffMappings: FieldMappingConfig[];
  
  // Pre/post processing
  preProcessScript?: string; // JavaScript code
  postProcessScript?: string;
  
  // Validation rules
  validationRules: ValidationRule[];
  
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationRule {
  id: string;
  field: string;
  entityType: SolverEntityType;
  ruleType: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: string | number;
  message: string;
  isActive: boolean;
}

// ============= EXTERNAL CONSTRAINT IMPORT =============

export interface ImportedConstraintSet {
  id: string;
  name: string;
  description?: string;
  source: 'file' | 'url' | 'api';
  sourceUrl?: string;
  
  constraints: TimefoldConstraint[];
  
  // Merge behavior
  mergeStrategy: 'replace_all' | 'merge_by_id' | 'add_new_only';
  
  // Validation
  isValid: boolean;
  validationErrors: string[];
  
  // Status
  lastImportedAt: string;
  autoRefresh: boolean;
  refreshIntervalMinutes?: number;
  
  createdAt: string;
  updatedAt: string;
}

// ============= WEBHOOK CONFIGURATION =============

export type WebhookEventType = 
  | 'solver.started'
  | 'solver.completed'
  | 'solver.failed'
  | 'data.sync.started'
  | 'data.sync.completed'
  | 'data.sync.failed'
  | 'constraint.violation'
  | 'assignment.created'
  | 'assignment.updated';

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  secret?: string;
  events: WebhookEventType[];
  isActive: boolean;
  retryCount: number;
  timeoutSeconds: number;
  headers: { key: string; value: string }[];
  lastTriggeredAt?: string;
  lastStatus?: 'success' | 'failed' | 'pending';
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookLog {
  id: string;
  endpointId: string;
  eventType: WebhookEventType;
  payload: Record<string, unknown>;
  responseStatus?: number;
  responseBody?: string;
  duration?: number;
  status: 'success' | 'failed' | 'pending' | 'retrying';
  error?: string;
  timestamp: string;
  retryAttempt: number;
}

export const WEBHOOK_EVENTS: { type: WebhookEventType; label: string; description: string }[] = [
  { type: 'solver.started', label: 'Solver Started', description: 'Triggered when solver begins optimization' },
  { type: 'solver.completed', label: 'Solver Completed', description: 'Triggered when solver finishes successfully' },
  { type: 'solver.failed', label: 'Solver Failed', description: 'Triggered when solver encounters an error' },
  { type: 'data.sync.started', label: 'Data Sync Started', description: 'Triggered when data sync begins' },
  { type: 'data.sync.completed', label: 'Data Sync Completed', description: 'Triggered when data sync completes' },
  { type: 'data.sync.failed', label: 'Data Sync Failed', description: 'Triggered when data sync fails' },
  { type: 'constraint.violation', label: 'Constraint Violation', description: 'Triggered when hard constraint is violated' },
  { type: 'assignment.created', label: 'Assignment Created', description: 'Triggered when new shift assignment is made' },
  { type: 'assignment.updated', label: 'Assignment Updated', description: 'Triggered when shift assignment is modified' },
];

// ============= INTEGRATION SETTINGS AGGREGATE =============

export interface TimefoldIntegrationSettings {
  // API Connections (multiple environments)
  apiConnections: ApiConnectionConfig[];
  activeConnectionId?: string;
  
  // Data Mapping Profiles
  mappingProfiles: DataMappingProfile[];
  activeMappingProfileId?: string;
  
  // External Constraint Sets
  importedConstraintSets: ImportedConstraintSet[];
  
  // Webhook endpoints
  webhookEndpoints: WebhookEndpoint[];
  webhookLogs: WebhookLog[];
  
  // Global settings
  enableWebhooks: boolean;
  webhookUrl?: string;
  webhookSecret?: string;
  
  // Sync settings
  autoSyncEnabled: boolean;
  syncIntervalMinutes: number;
  lastSyncAt?: string;
  
  // Logging
  enableDetailedLogging: boolean;
  logRetentionDays: number;
}

// ============= STORAGE HELPERS =============

const STORAGE_KEY = 'timefold-integration-settings';

export function loadIntegrationSettings(): TimefoldIntegrationSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load integration settings:', error);
  }
  return getDefaultIntegrationSettings();
}

export function saveIntegrationSettings(settings: TimefoldIntegrationSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save integration settings:', error);
  }
}

export function getDefaultIntegrationSettings(): TimefoldIntegrationSettings {
  return {
    apiConnections: [],
    mappingProfiles: [],
    importedConstraintSets: [],
    webhookEndpoints: [],
    webhookLogs: [],
    enableWebhooks: false,
    autoSyncEnabled: false,
    syncIntervalMinutes: 60,
    enableDetailedLogging: false,
    logRetentionDays: 7,
  };
}

// ============= TRANSFORMATION PREVIEW HELPERS =============

export interface TransformPreviewResult {
  success: boolean;
  input: string;
  output: string;
  error?: string;
}

export function applyTransform(value: string, transform: FieldMappingConfig['transform']): TransformPreviewResult {
  try {
    let result: string;
    
    switch (transform) {
      case 'none':
        result = value;
        break;
      case 'to_string':
        result = String(value);
        break;
      case 'to_number':
        const num = parseFloat(value);
        if (isNaN(num)) throw new Error('Cannot convert to number');
        result = String(num);
        break;
      case 'to_boolean':
        const lower = value.toLowerCase();
        if (['true', '1', 'yes', 'on'].includes(lower)) result = 'true';
        else if (['false', '0', 'no', 'off'].includes(lower)) result = 'false';
        else throw new Error('Cannot convert to boolean');
        break;
      case 'to_date':
        const date = new Date(value);
        if (isNaN(date.getTime())) throw new Error('Invalid date');
        result = date.toISOString().split('T')[0];
        break;
      case 'to_time':
        // Try parsing as time string or full date
        const timeParts = value.match(/(\d{1,2}):(\d{2})/);
        if (timeParts) {
          result = `${timeParts[1].padStart(2, '0')}:${timeParts[2]}`;
        } else {
          const timeDate = new Date(value);
          if (isNaN(timeDate.getTime())) throw new Error('Invalid time');
          result = timeDate.toTimeString().slice(0, 5);
        }
        break;
      case 'to_array':
        // Try JSON parse first, then split by comma
        try {
          const arr = JSON.parse(value);
          result = JSON.stringify(Array.isArray(arr) ? arr : [arr]);
        } catch {
          result = JSON.stringify(value.split(',').map(s => s.trim()));
        }
        break;
      case 'json_parse':
        const parsed = JSON.parse(value);
        result = JSON.stringify(parsed, null, 2);
        break;
      case 'custom':
        result = value; // Custom handled separately
        break;
      default:
        result = value;
    }
    
    return { success: true, input: value, output: result };
  } catch (error) {
    return { 
      success: false, 
      input: value, 
      output: '', 
      error: error instanceof Error ? error.message : 'Transform failed' 
    };
  }
}

export const SAMPLE_INPUT_VALUES: Record<string, string> = {
  id: 'EMP-12345',
  date: '2024-01-15',
  time: '09:30',
  number: '42.5',
  boolean: 'true',
  array: '["item1", "item2"]',
  json: '{"key": "value", "nested": {"a": 1}}',
};

// ============= VALIDATION HELPERS =============

export function validateApiConnection(connection: ApiConnectionConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!connection.name.trim()) {
    errors.push('Connection name is required');
  }
  
  if (!connection.endpointUrl.trim()) {
    errors.push('Endpoint URL is required');
  } else {
    try {
      new URL(connection.endpointUrl);
    } catch {
      errors.push('Invalid endpoint URL format');
    }
  }
  
  if (connection.authType === 'api_key' && !connection.apiKey) {
    errors.push('API key is required for API Key authentication');
  }
  
  if (connection.authType === 'bearer_token' && !connection.bearerToken) {
    errors.push('Bearer token is required for Bearer Token authentication');
  }
  
  if (connection.authType === 'basic_auth') {
    if (!connection.basicAuthUsername) errors.push('Username is required for Basic Auth');
    if (!connection.basicAuthPassword) errors.push('Password is required for Basic Auth');
  }
  
  if (connection.authType === 'oauth2') {
    if (!connection.oauth2ClientId) errors.push('Client ID is required for OAuth2');
    if (!connection.oauth2ClientSecret) errors.push('Client Secret is required for OAuth2');
    if (!connection.oauth2TokenUrl) errors.push('Token URL is required for OAuth2');
  }
  
  if (connection.timeoutSeconds < 1 || connection.timeoutSeconds > 300) {
    errors.push('Timeout must be between 1 and 300 seconds');
  }
  
  return { valid: errors.length === 0, errors };
}

export function validateConstraintImport(constraints: unknown): { valid: boolean; errors: string[]; constraints?: TimefoldConstraint[] } {
  const errors: string[] = [];
  
  if (!Array.isArray(constraints)) {
    errors.push('Constraints must be an array');
    return { valid: false, errors };
  }
  
  const validatedConstraints: TimefoldConstraint[] = [];
  
  constraints.forEach((constraint: any, index: number) => {
    const prefix = `Constraint ${index + 1}`;
    
    if (!constraint.id) errors.push(`${prefix}: Missing 'id' field`);
    if (!constraint.name) errors.push(`${prefix}: Missing 'name' field`);
    if (!constraint.level || !['HARD', 'MEDIUM', 'SOFT'].includes(constraint.level)) {
      errors.push(`${prefix}: Invalid 'level' - must be HARD, MEDIUM, or SOFT`);
    }
    if (typeof constraint.weight !== 'number') {
      errors.push(`${prefix}: 'weight' must be a number`);
    }
    if (typeof constraint.enabled !== 'boolean') {
      errors.push(`${prefix}: 'enabled' must be a boolean`);
    }
    
    if (errors.length === 0) {
      validatedConstraints.push({
        id: constraint.id,
        name: constraint.name,
        description: constraint.description || '',
        category: constraint.category || 'preference',
        level: constraint.level,
        weight: constraint.weight,
        enabled: constraint.enabled,
        parameters: constraint.parameters || {},
        isBuiltIn: false,
        icon: constraint.icon,
      });
    }
  });
  
  return { 
    valid: errors.length === 0, 
    errors, 
    constraints: errors.length === 0 ? validatedConstraints : undefined 
  };
}

// ============= SAMPLE CONFIGURATIONS =============

export const SAMPLE_API_CONNECTION: ApiConnectionConfig = {
  id: 'sample-dev',
  name: 'Development Timefold API',
  environment: 'development',
  endpointUrl: 'http://localhost:8080/api/v1/solver',
  authType: 'api_key',
  apiKey: '',
  timeoutSeconds: 120,
  retryAttempts: 3,
  retryDelayMs: 1000,
  customHeaders: [
    { key: 'X-Client-Name', value: 'Roster-Scheduler' },
  ],
  healthCheckPath: '/health',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const SAMPLE_MAPPING_PROFILE: DataMappingProfile = {
  id: 'sample-xplor',
  name: 'Xplor Integration',
  description: 'Maps Xplor booking data to solver entities',
  sourceSystem: 'xplor',
  shiftMappings: [
    { id: 'sm-1', sourceField: 'booking_id', targetField: 'id', targetEntity: 'shift', transform: 'to_string', isRequired: true, isActive: true },
    { id: 'sm-2', sourceField: 'booking_date', targetField: 'date', targetEntity: 'shift', transform: 'to_date', isRequired: true, isActive: true },
    { id: 'sm-3', sourceField: 'start_time', targetField: 'startTime', targetEntity: 'shift', transform: 'to_time', isRequired: true, isActive: true },
    { id: 'sm-4', sourceField: 'end_time', targetField: 'endTime', targetEntity: 'shift', transform: 'to_time', isRequired: true, isActive: true },
    { id: 'sm-5', sourceField: 'room_id', targetField: 'roomId', targetEntity: 'shift', transform: 'to_string', isRequired: true, isActive: true },
  ],
  staffMappings: [
    { id: 'stm-1', sourceField: 'employee_id', targetField: 'id', targetEntity: 'staff', transform: 'to_string', isRequired: true, isActive: true },
    { id: 'stm-2', sourceField: 'full_name', targetField: 'name', targetEntity: 'staff', transform: 'to_string', isRequired: true, isActive: true },
    { id: 'stm-3', sourceField: 'position', targetField: 'role', targetEntity: 'staff', transform: 'to_string', isRequired: true, isActive: true },
    { id: 'stm-4', sourceField: 'hourly_rate', targetField: 'hourlyRate', targetEntity: 'staff', transform: 'to_number', isRequired: true, isActive: true },
  ],
  validationRules: [],
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
