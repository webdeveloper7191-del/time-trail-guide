// ETL Pipeline for transforming external integration data to standardized demand format
import { format, parseISO, isValid } from 'date-fns';
import { GenericDemandData, IntegrationOption, IndustryType } from '@/types/industryConfig';
import { ManualDemandEntry } from '@/contexts/DemandContext';

// ==================== TYPES ====================

export type IntegrationSourceType = 'pos' | 'booking' | 'hr' | 'payroll' | 'iot' | 'forecast' | 'custom';

export interface RawIntegrationData {
  source: IntegrationSourceType;
  integrationId: string;
  timestamp: string;
  rawPayload: Record<string, any>;
}

export interface TransformationResult {
  success: boolean;
  standardizedData: StandardizedDemandRecord[];
  errors: TransformationError[];
  warnings: string[];
  stats: {
    totalRecords: number;
    successfulRecords: number;
    failedRecords: number;
    skippedRecords: number;
  };
}

export interface TransformationError {
  recordIndex: number;
  field: string;
  message: string;
  rawValue: any;
}

export interface StandardizedDemandRecord {
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:mm-HH:mm
  zoneId: string;
  zoneName: string;
  demandValue: number;
  demandType: 'expected' | 'actual' | 'forecast';
  confidence: number; // 0-100
  source: string;
  metadata: Record<string, any>;
}

// ==================== FIELD MAPPINGS ====================

export interface FieldMapping {
  sourceField: string;
  targetField: keyof StandardizedDemandRecord;
  transform?: (value: any, record: Record<string, any>) => any;
  required: boolean;
  defaultValue?: any;
}

export interface IntegrationAdapter {
  id: string;
  name: string;
  sourceType: IntegrationSourceType;
  fieldMappings: FieldMapping[];
  
  // Pre-processing hooks
  preProcess?: (rawData: any[]) => any[];
  
  // Post-processing hooks
  postProcess?: (standardized: StandardizedDemandRecord[]) => StandardizedDemandRecord[];
  
  // Validation
  validate?: (record: any) => { valid: boolean; errors: string[] };
}

// ==================== ADAPTERS FOR DIFFERENT SYSTEMS ====================

// Childcare: Xplor adapter
export const XplorAdapter: IntegrationAdapter = {
  id: 'xplor',
  name: 'Xplor',
  sourceType: 'booking',
  fieldMappings: [
    { sourceField: 'booking_date', targetField: 'date', required: true, transform: normalizeDate },
    { sourceField: 'session_time', targetField: 'timeSlot', required: true, transform: normalizeTimeSlot },
    { sourceField: 'room_id', targetField: 'zoneId', required: true },
    { sourceField: 'room_name', targetField: 'zoneName', required: false, defaultValue: 'Unknown Room' },
    { sourceField: 'booked_children', targetField: 'demandValue', required: true, transform: toNumber },
  ],
  preProcess: (data) => data.filter(r => r.status !== 'cancelled'),
  validate: (record) => {
    const errors: string[] = [];
    if (!record.booking_date) errors.push('Missing booking_date');
    if (record.booked_children < 0) errors.push('Invalid booked_children count');
    return { valid: errors.length === 0, errors };
  },
};

// Childcare: Xap adapter
export const XapAdapter: IntegrationAdapter = {
  id: 'xap',
  name: 'Xap',
  sourceType: 'booking',
  fieldMappings: [
    { sourceField: 'date', targetField: 'date', required: true, transform: normalizeDate },
    { sourceField: 'session', targetField: 'timeSlot', required: true, transform: normalizeTimeSlot },
    { sourceField: 'room_id', targetField: 'zoneId', required: true },
    { sourceField: 'room_name', targetField: 'zoneName', required: false, defaultValue: 'Unknown Room' },
    { sourceField: 'child_count', targetField: 'demandValue', required: true, transform: toNumber },
  ],
  preProcess: (data) => data.filter(r => r.status !== 'cancelled'),
  validate: (record) => {
    const errors: string[] = [];
    if (!record.date) errors.push('Missing date');
    if (record.child_count < 0) errors.push('Invalid child_count');
    return { valid: errors.length === 0, errors };
  },
};

// Childcare: Owna adapter
export const OwnaAdapter: IntegrationAdapter = {
  id: 'owna',
  name: 'Owna',
  sourceType: 'booking',
  fieldMappings: [
    { sourceField: 'booking_date', targetField: 'date', required: true, transform: normalizeDate },
    { sourceField: 'time_slot', targetField: 'timeSlot', required: true, transform: normalizeTimeSlot },
    { sourceField: 'room_id', targetField: 'zoneId', required: true },
    { sourceField: 'room_name', targetField: 'zoneName', required: false, defaultValue: 'Unknown Room' },
    { sourceField: 'enrolled_children', targetField: 'demandValue', required: true, transform: toNumber },
  ],
  validate: (record) => {
    const errors: string[] = [];
    if (!record.booking_date) errors.push('Missing booking_date');
    if (record.enrolled_children < 0) errors.push('Invalid enrolled_children count');
    return { valid: errors.length === 0, errors };
  },
};

// Childcare: Kidsoft adapter
export const KidsoftAdapter: IntegrationAdapter = {
  id: 'kidsoft',
  name: 'Kidsoft',
  sourceType: 'booking',
  fieldMappings: [
    { sourceField: 'attendance_date', targetField: 'date', required: true, transform: normalizeDate },
    { sourceField: 'session_type', targetField: 'timeSlot', required: true, transform: normalizeTimeSlot },
    { sourceField: 'room_code', targetField: 'zoneId', required: true },
    { sourceField: 'room_description', targetField: 'zoneName', required: false, defaultValue: 'Unknown Room' },
    { sourceField: 'booked_count', targetField: 'demandValue', required: true, transform: toNumber },
  ],
  preProcess: (data) => data.filter(r => r.booking_status === 'confirmed' || r.booking_status === 'active'),
  validate: (record) => {
    const errors: string[] = [];
    if (!record.attendance_date) errors.push('Missing attendance_date');
    if (record.booked_count < 0) errors.push('Invalid booked_count');
    return { valid: errors.length === 0, errors };
  },
};

// Childcare: QikKids adapter
export const QikKidsAdapter: IntegrationAdapter = {
  id: 'qikkids',
  name: 'QikKids',
  sourceType: 'booking',
  fieldMappings: [
    { sourceField: 'attendance_date', targetField: 'date', required: true, transform: normalizeDate },
    { sourceField: 'time_period', targetField: 'timeSlot', required: true, transform: normalizeTimeSlot },
    { sourceField: 'class_id', targetField: 'zoneId', required: true },
    { sourceField: 'class_name', targetField: 'zoneName', required: false },
    { sourceField: 'enrolled_count', targetField: 'demandValue', required: true, transform: toNumber },
  ],
};

// Retail: Shopify POS adapter
export const ShopifyPOSAdapter: IntegrationAdapter = {
  id: 'shopify',
  name: 'Shopify POS',
  sourceType: 'pos',
  fieldMappings: [
    { sourceField: 'created_at', targetField: 'date', required: true, transform: extractDateFromISO },
    { sourceField: 'created_at', targetField: 'timeSlot', required: true, transform: (v) => extractTimeSlotFromISO(v) },
    { sourceField: 'location_id', targetField: 'zoneId', required: true },
    { sourceField: 'location_name', targetField: 'zoneName', required: false },
    { sourceField: 'customer_count', targetField: 'demandValue', required: false, defaultValue: 1, transform: toNumber },
  ],
  // Aggregate transactions by time slot
  postProcess: aggregateByTimeSlot,
};

// Retail: Lightspeed adapter  
export const LightspeedAdapter: IntegrationAdapter = {
  id: 'lightspeed',
  name: 'Lightspeed',
  sourceType: 'pos',
  fieldMappings: [
    { sourceField: 'transaction_date', targetField: 'date', required: true, transform: normalizeDate },
    { sourceField: 'hour', targetField: 'timeSlot', required: true, transform: hourToTimeSlot },
    { sourceField: 'register_id', targetField: 'zoneId', required: true },
    { sourceField: 'register_name', targetField: 'zoneName', required: false },
    { sourceField: 'transactions', targetField: 'demandValue', required: true, transform: toNumber },
  ],
};

// Hospitality: OpenTable adapter
export const OpenTableAdapter: IntegrationAdapter = {
  id: 'opentable',
  name: 'OpenTable',
  sourceType: 'booking',
  fieldMappings: [
    { sourceField: 'reservation_date', targetField: 'date', required: true, transform: normalizeDate },
    { sourceField: 'reservation_time', targetField: 'timeSlot', required: true, transform: (v) => timeToSlot(v) },
    { sourceField: 'table_section', targetField: 'zoneId', required: false, defaultValue: 'main' },
    { sourceField: 'section_name', targetField: 'zoneName', required: false },
    { sourceField: 'party_size', targetField: 'demandValue', required: true, transform: toNumber },
  ],
  postProcess: aggregateByTimeSlot,
};

// Hospitality: Resy adapter
export const ResyAdapter: IntegrationAdapter = {
  id: 'resy',
  name: 'Resy',
  sourceType: 'booking',
  fieldMappings: [
    { sourceField: 'date', targetField: 'date', required: true, transform: normalizeDate },
    { sourceField: 'time_slot', targetField: 'timeSlot', required: true },
    { sourceField: 'venue_id', targetField: 'zoneId', required: true },
    { sourceField: 'venue_name', targetField: 'zoneName', required: false },
    { sourceField: 'covers', targetField: 'demandValue', required: true, transform: toNumber },
  ],
};

// Call Center: Genesys adapter
export const GenesysAdapter: IntegrationAdapter = {
  id: 'genesys',
  name: 'Genesys Cloud',
  sourceType: 'forecast',
  fieldMappings: [
    { sourceField: 'interval_start', targetField: 'date', required: true, transform: extractDateFromISO },
    { sourceField: 'interval_start', targetField: 'timeSlot', required: true, transform: (v) => extractTimeSlotFromISO(v) },
    { sourceField: 'queue_id', targetField: 'zoneId', required: true },
    { sourceField: 'queue_name', targetField: 'zoneName', required: false },
    { sourceField: 'forecast_contacts', targetField: 'demandValue', required: true, transform: toNumber },
  ],
};

// Events: Eventbrite adapter
export const EventbriteAdapter: IntegrationAdapter = {
  id: 'eventbrite',
  name: 'Eventbrite',
  sourceType: 'booking',
  fieldMappings: [
    { sourceField: 'event_date', targetField: 'date', required: true, transform: normalizeDate },
    { sourceField: 'start_time', targetField: 'timeSlot', required: true, transform: (v) => timeToSlot(v) },
    { sourceField: 'venue_area', targetField: 'zoneId', required: false, defaultValue: 'general' },
    { sourceField: 'area_name', targetField: 'zoneName', required: false },
    { sourceField: 'tickets_sold', targetField: 'demandValue', required: true, transform: toNumber },
  ],
};

// Generic Webhook adapter
export const WebhookAdapter: IntegrationAdapter = {
  id: 'webhook',
  name: 'Custom Webhook',
  sourceType: 'custom',
  fieldMappings: [
    { sourceField: 'date', targetField: 'date', required: true, transform: normalizeDate },
    { sourceField: 'time_slot', targetField: 'timeSlot', required: false, defaultValue: 'All Day' },
    { sourceField: 'zone_id', targetField: 'zoneId', required: true },
    { sourceField: 'zone_name', targetField: 'zoneName', required: false },
    { sourceField: 'demand', targetField: 'demandValue', required: true, transform: toNumber },
  ],
};

// REST API adapter
export const RestAPIAdapter: IntegrationAdapter = {
  id: 'api',
  name: 'REST API',
  sourceType: 'custom',
  fieldMappings: [
    { sourceField: 'date', targetField: 'date', required: true, transform: normalizeDate },
    { sourceField: 'timeSlot', targetField: 'timeSlot', required: false, defaultValue: 'All Day' },
    { sourceField: 'zoneId', targetField: 'zoneId', required: true },
    { sourceField: 'zoneName', targetField: 'zoneName', required: false },
    { sourceField: 'demand', targetField: 'demandValue', required: true, transform: toNumber },
  ],
};

// Registry of all adapters
export const INTEGRATION_ADAPTERS: Record<string, IntegrationAdapter> = {
  xplor: XplorAdapter,
  xap: XapAdapter,
  owna: OwnaAdapter,
  kidsoft: KidsoftAdapter,
  qikkids: QikKidsAdapter,
  shopify: ShopifyPOSAdapter,
  lightspeed: LightspeedAdapter,
  opentable: OpenTableAdapter,
  resy: ResyAdapter,
  genesys: GenesysAdapter,
  five9: GenesysAdapter, // Similar format
  eventbrite: EventbriteAdapter,
  ticketmaster: EventbriteAdapter, // Similar format
  webhook: WebhookAdapter,
  api: RestAPIAdapter,
};

// ==================== TRANSFORM FUNCTIONS ====================

function normalizeDate(value: any): string {
  if (!value) return '';
  
  // Handle various date formats
  if (typeof value === 'string') {
    // Try ISO format first
    if (value.includes('T')) {
      const parsed = parseISO(value);
      if (isValid(parsed)) return format(parsed, 'yyyy-MM-dd');
    }
    
    // Try common formats
    const formats = ['yyyy-MM-dd', 'dd/MM/yyyy', 'MM/dd/yyyy', 'dd-MM-yyyy'];
    for (const fmt of formats) {
      try {
        const parsed = parseISO(value);
        if (isValid(parsed)) return format(parsed, 'yyyy-MM-dd');
      } catch (e) {
        continue;
      }
    }
    
    // Return as-is if it looks like a date
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  }
  
  if (value instanceof Date && isValid(value)) {
    return format(value, 'yyyy-MM-dd');
  }
  
  return '';
}

function extractDateFromISO(value: any): string {
  if (!value) return '';
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, 'yyyy-MM-dd') : '';
}

function extractTimeSlotFromISO(value: any, granularityMinutes: number = 30): string {
  if (!value) return '';
  const parsed = parseISO(value);
  if (!isValid(parsed)) return '';
  
  const hours = parsed.getHours();
  const minutes = Math.floor(parsed.getMinutes() / granularityMinutes) * granularityMinutes;
  
  const startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  const endMinutes = minutes + granularityMinutes;
  const endHour = hours + Math.floor(endMinutes / 60);
  const endMin = endMinutes % 60;
  const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
  
  return `${startTime}-${endTime}`;
}

function normalizeTimeSlot(value: any): string {
  if (!value) return 'All Day';
  if (typeof value !== 'string') return 'All Day';
  
  // Already in HH:mm-HH:mm format
  if (/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(value)) return value;
  
  // Session names like "AM", "PM", "Full Day"
  const sessionMap: Record<string, string> = {
    'am': '06:00-12:00',
    'pm': '12:00-18:00',
    'morning': '06:00-12:00',
    'afternoon': '12:00-18:00',
    'full': '06:00-18:00',
    'full day': '06:00-18:00',
    'all day': 'All Day',
  };
  
  return sessionMap[value.toLowerCase()] || value;
}

function timeToSlot(value: any, granularityMinutes: number = 30): string {
  if (!value) return 'All Day';
  
  // Parse HH:mm format
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return 'All Day';
  
  const hours = parseInt(match[1]);
  const minutes = Math.floor(parseInt(match[2]) / granularityMinutes) * granularityMinutes;
  
  const startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  const endMinutes = minutes + granularityMinutes;
  const endHour = hours + Math.floor(endMinutes / 60);
  const endMin = endMinutes % 60;
  const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
  
  return `${startTime}-${endTime}`;
}

function hourToTimeSlot(value: any): string {
  const hour = typeof value === 'number' ? value : parseInt(value);
  if (isNaN(hour)) return 'All Day';
  
  const startTime = `${hour.toString().padStart(2, '0')}:00`;
  const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
  return `${startTime}-${endTime}`;
}

function toNumber(value: any): number {
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

function aggregateByTimeSlot(records: StandardizedDemandRecord[]): StandardizedDemandRecord[] {
  const aggregated = new Map<string, StandardizedDemandRecord>();
  
  for (const record of records) {
    const key = `${record.date}-${record.timeSlot}-${record.zoneId}`;
    const existing = aggregated.get(key);
    
    if (existing) {
      existing.demandValue += record.demandValue;
    } else {
      aggregated.set(key, { ...record });
    }
  }
  
  return Array.from(aggregated.values());
}

// ==================== ETL PIPELINE ====================

export class DemandETLPipeline {
  private adapters: Map<string, IntegrationAdapter>;
  
  constructor() {
    this.adapters = new Map(Object.entries(INTEGRATION_ADAPTERS));
  }
  
  // Register a custom adapter
  registerAdapter(adapter: IntegrationAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }
  
  // Get adapter by ID
  getAdapter(integrationId: string): IntegrationAdapter | undefined {
    return this.adapters.get(integrationId);
  }
  
  // List available adapters
  listAdapters(): IntegrationAdapter[] {
    return Array.from(this.adapters.values());
  }
  
  // EXTRACT: Get raw data from integration
  async extract(
    integrationId: string, 
    config: { 
      endpoint?: string; 
      apiKey?: string; 
      webhookData?: any[];
    }
  ): Promise<any[]> {
    // In a real implementation, this would call the actual API
    // For now, we return webhook data or mock data
    if (config.webhookData) {
      return config.webhookData;
    }
    
    // Mock extraction for demo purposes
    console.log(`Extracting data from ${integrationId}...`);
    return [];
  }
  
  // TRANSFORM: Apply adapter mappings to raw data
  transform(
    integrationId: string,
    rawData: any[],
    options: {
      defaultZoneId?: string;
      demandType?: 'expected' | 'actual' | 'forecast';
      confidenceLevel?: number;
    } = {}
  ): TransformationResult {
    const adapter = this.adapters.get(integrationId);
    
    if (!adapter) {
      return {
        success: false,
        standardizedData: [],
        errors: [{ recordIndex: -1, field: '', message: `Unknown integration: ${integrationId}`, rawValue: null }],
        warnings: [],
        stats: { totalRecords: rawData.length, successfulRecords: 0, failedRecords: rawData.length, skippedRecords: 0 },
      };
    }
    
    const standardizedData: StandardizedDemandRecord[] = [];
    const errors: TransformationError[] = [];
    const warnings: string[] = [];
    
    // Pre-process
    let processedData = adapter.preProcess ? adapter.preProcess(rawData) : rawData;
    
    for (let i = 0; i < processedData.length; i++) {
      const record = processedData[i];
      
      // Validate
      if (adapter.validate) {
        const validation = adapter.validate(record);
        if (!validation.valid) {
          errors.push({
            recordIndex: i,
            field: 'validation',
            message: validation.errors.join(', '),
            rawValue: record,
          });
          continue;
        }
      }
      
      // Transform
      try {
        const standardized = this.applyMappings(adapter.fieldMappings, record, options);
        
        if (!standardized.date) {
          errors.push({ recordIndex: i, field: 'date', message: 'Missing or invalid date', rawValue: record });
          continue;
        }
        
        if (!standardized.zoneId && !options.defaultZoneId) {
          errors.push({ recordIndex: i, field: 'zoneId', message: 'Missing zone ID', rawValue: record });
          continue;
        }
        
        const finalRecord: StandardizedDemandRecord = {
          date: standardized.date || '',
          timeSlot: standardized.timeSlot || 'All Day',
          zoneId: standardized.zoneId || options.defaultZoneId || 'default',
          zoneName: standardized.zoneName || '',
          demandValue: standardized.demandValue || 0,
          demandType: options.demandType || 'expected',
          confidence: options.confidenceLevel || 100,
          source: adapter.id,
          metadata: { originalIndex: i },
        };
        
        standardizedData.push(finalRecord);
      } catch (err) {
        errors.push({
          recordIndex: i,
          field: 'transform',
          message: err instanceof Error ? err.message : 'Unknown transformation error',
          rawValue: record,
        });
      }
    }
    
    // Post-process
    const finalData = adapter.postProcess ? adapter.postProcess(standardizedData) : standardizedData;
    
    return {
      success: errors.length === 0,
      standardizedData: finalData,
      errors,
      warnings,
      stats: {
        totalRecords: rawData.length,
        successfulRecords: finalData.length,
        failedRecords: errors.length,
        skippedRecords: rawData.length - processedData.length,
      },
    };
  }
  
  private applyMappings(
    mappings: FieldMapping[],
    record: Record<string, any>,
    options: Record<string, any>
  ): Partial<StandardizedDemandRecord> {
    const result: Record<string, any> = {};
    
    for (const mapping of mappings) {
      let value = this.getNestedValue(record, mapping.sourceField);
      
      // Apply default if missing
      if (value === undefined || value === null) {
        if (mapping.required && mapping.defaultValue === undefined) {
          throw new Error(`Required field ${mapping.sourceField} is missing`);
        }
        value = mapping.defaultValue;
      }
      
      // Apply transform
      if (mapping.transform && value !== undefined) {
        value = mapping.transform(value, record);
      }
      
      result[mapping.targetField] = value;
    }
    
    return result as Partial<StandardizedDemandRecord>;
  }
  
  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }
  
  // LOAD: Convert standardized records to ManualDemandEntry format
  load(
    standardizedData: StandardizedDemandRecord[],
    centreId: string
  ): Omit<ManualDemandEntry, 'id' | 'createdAt' | 'updatedAt'>[] {
    return standardizedData.map(record => ({
      date: record.date,
      centreId,
      roomId: record.zoneId,
      timeSlot: record.timeSlot,
      expectedDemand: record.demandValue,
      notes: `Imported from ${record.source}`,
      source: 'import' as const,
    }));
  }
  
  // Full ETL process
  async runETL(
    integrationId: string,
    config: {
      endpoint?: string;
      apiKey?: string;
      webhookData?: any[];
      defaultZoneId?: string;
      centreId: string;
      demandType?: 'expected' | 'actual' | 'forecast';
    }
  ): Promise<{
    success: boolean;
    entries: Omit<ManualDemandEntry, 'id' | 'createdAt' | 'updatedAt'>[];
    result: TransformationResult;
  }> {
    // Extract
    const rawData = await this.extract(integrationId, {
      endpoint: config.endpoint,
      apiKey: config.apiKey,
      webhookData: config.webhookData,
    });
    
    // Transform
    const transformResult = this.transform(integrationId, rawData, {
      defaultZoneId: config.defaultZoneId,
      demandType: config.demandType,
    });
    
    // Load
    const entries = this.load(transformResult.standardizedData, config.centreId);
    
    return {
      success: transformResult.success,
      entries,
      result: transformResult,
    };
  }
}

// Export singleton instance
export const demandETL = new DemandETLPipeline();
