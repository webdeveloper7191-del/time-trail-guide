/**
 * ETL Pipeline for importing CSV/Excel demand data
 * Supports: Room data, Bookings, Historical attendance, Today's attendance
 * Industry-agnostic with configurable field definitions
 */

import { format, parseISO, isValid, parse } from 'date-fns';
import type {
  ChildBookingImport,
  TodayAttendanceEvent,
  ChildcareAgeGroup,
} from '@/types/demandIntegration';
import {
  IndustryImportType,
  getIndustryFields,
  getIndustryFieldAliases,
  type IndustryFieldAlias,
} from './industryImportConfig';
import type { IndustryType } from '@/lib/timefold/industryConstraints';

// ==================== TYPES ====================

export type DemandImportType = 'bookings' | 'bookingSummary' | 'historicalAttendance' | 'todayAttendance' | 'rooms';

export interface DemandImportResult {
  type: IndustryImportType;
  industry: IndustryType;
  success: number;
  failed: number;
  warnings: number;
  records: ImportedDemandRecord[];
  errors: DemandImportError[];
}

export interface ImportedDemandRecord {
  index: number;
  data: Record<string, any>;
  status: 'success' | 'warning' | 'error';
  messages: string[];
}

export interface DemandImportError {
  recordIndex: number;
  field: string;
  message: string;
  rawValue: any;
}

export interface ColumnMappingConfig {
  sourceColumn: string;
  targetField: string;
  transformType?: TransformType;
}

export type TransformType =
  | 'none'
  | 'uppercase'
  | 'lowercase'
  | 'trim'
  | 'date_dmy'
  | 'date_mdy'
  | 'date_ymd'
  | 'time_hhmm'
  | 'boolean'
  | 'number'
  | 'integer'
  | 'percentage'
  | 'age_group'
  | 'booking_type'
  | 'booking_status'
  | 'event_type';

// ==================== FIELD DEFINITIONS ====================

export interface TargetFieldDefinition {
  path: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'time' | 'boolean' | 'enum';
  required: boolean;
  category: string;
  enumValues?: string[];
}

// Field definitions for each import type
export const DEMAND_TARGET_FIELDS: Record<DemandImportType, TargetFieldDefinition[]> = {
  rooms: [
    { path: 'roomId', label: 'Room ID', type: 'string', required: true, category: 'Identification' },
    { path: 'roomName', label: 'Room Name', type: 'string', required: true, category: 'Identification' },
    { path: 'centreId', label: 'Centre ID', type: 'string', required: true, category: 'Identification' },
    { path: 'ageGroup', label: 'Age Group', type: 'enum', required: true, category: 'Configuration', enumValues: ['babies', 'toddlers', 'preschool', 'kindy'] },
    { path: 'capacity', label: 'Capacity', type: 'number', required: true, category: 'Configuration' },
    { path: 'operatingHours.start', label: 'Operating Start', type: 'time', required: false, category: 'Configuration' },
    { path: 'operatingHours.end', label: 'Operating End', type: 'time', required: false, category: 'Configuration' },
    { path: 'minQualifiedStaff', label: 'Min Qualified Staff', type: 'number', required: true, category: 'Configuration' },
  ],

  bookings: [
    { path: 'date', label: 'Date', type: 'date', required: true, category: 'Booking' },
    { path: 'centreId', label: 'Centre ID', type: 'string', required: true, category: 'Location' },
    { path: 'roomId', label: 'Room ID', type: 'string', required: true, category: 'Location' },
    { path: 'childId', label: 'Child ID', type: 'string', required: true, category: 'Child' },
    { path: 'childName', label: 'Child Name', type: 'string', required: false, category: 'Child' },
    { path: 'ageMonths', label: 'Age (Months)', type: 'number', required: true, category: 'Child' },
    { path: 'bookingType', label: 'Booking Type', type: 'enum', required: true, category: 'Booking', enumValues: ['permanent', 'casual', 'makeup', 'extra'] },
    { path: 'startTime', label: 'Start Time', type: 'time', required: true, category: 'Booking' },
    { path: 'endTime', label: 'End Time', type: 'time', required: true, category: 'Booking' },
    { path: 'status', label: 'Status', type: 'enum', required: true, category: 'Booking', enumValues: ['confirmed', 'pending', 'cancelled', 'waitlist'] },
    { path: 'guardianContact', label: 'Guardian Contact', type: 'string', required: false, category: 'Child' },
    { path: 'notes', label: 'Notes', type: 'string', required: false, category: 'Other' },
  ],

  bookingSummary: [
    { path: 'date', label: 'Date', type: 'date', required: true, category: 'Summary' },
    { path: 'centreId', label: 'Centre ID', type: 'string', required: true, category: 'Location' },
    { path: 'roomId', label: 'Room ID', type: 'string', required: true, category: 'Location' },
    { path: 'timeSlotStart', label: 'Time Slot Start', type: 'time', required: true, category: 'Summary' },
    { path: 'timeSlotEnd', label: 'Time Slot End', type: 'time', required: true, category: 'Summary' },
    { path: 'bookedCount', label: 'Booked Count', type: 'number', required: true, category: 'Counts' },
    { path: 'confirmedCount', label: 'Confirmed Count', type: 'number', required: true, category: 'Counts' },
    { path: 'casualCount', label: 'Casual Count', type: 'number', required: true, category: 'Counts' },
    { path: 'capacity', label: 'Capacity', type: 'number', required: true, category: 'Counts' },
    { path: 'utilisationPercent', label: 'Utilisation %', type: 'number', required: false, category: 'Counts' },
  ],

  historicalAttendance: [
    { path: 'date', label: 'Date', type: 'date', required: true, category: 'Record' },
    { path: 'centreId', label: 'Centre ID', type: 'string', required: true, category: 'Location' },
    { path: 'roomId', label: 'Room ID', type: 'string', required: true, category: 'Location' },
    { path: 'timeSlot', label: 'Time Slot', type: 'string', required: true, category: 'Record' },
    { path: 'bookedChildren', label: 'Booked Children', type: 'number', required: true, category: 'Attendance' },
    { path: 'attendedChildren', label: 'Attended Children', type: 'number', required: true, category: 'Attendance' },
    { path: 'absentChildren', label: 'Absent Children', type: 'number', required: false, category: 'Attendance' },
    { path: 'lateArrivals', label: 'Late Arrivals', type: 'number', required: false, category: 'Attendance' },
    { path: 'earlyDepartures', label: 'Early Departures', type: 'number', required: false, category: 'Attendance' },
    { path: 'attendanceRate', label: 'Attendance Rate %', type: 'number', required: false, category: 'Attendance' },
    { path: 'dayOfWeek', label: 'Day of Week', type: 'number', required: false, category: 'Metadata' },
    { path: 'weekNumber', label: 'Week Number', type: 'number', required: false, category: 'Metadata' },
    { path: 'isSchoolHoliday', label: 'School Holiday', type: 'boolean', required: false, category: 'Metadata' },
    { path: 'isPublicHoliday', label: 'Public Holiday', type: 'boolean', required: false, category: 'Metadata' },
  ],

  todayAttendance: [
    { path: 'timestamp', label: 'Timestamp', type: 'string', required: true, category: 'Event' },
    { path: 'centreId', label: 'Centre ID', type: 'string', required: true, category: 'Location' },
    { path: 'roomId', label: 'Room ID', type: 'string', required: true, category: 'Location' },
    { path: 'childId', label: 'Child ID', type: 'string', required: true, category: 'Event' },
    { path: 'eventType', label: 'Event Type', type: 'enum', required: true, category: 'Event', enumValues: ['sign_in', 'sign_out', 'room_transfer', 'absent_notified', 'late_arrival'] },
    { path: 'actualTime', label: 'Actual Time', type: 'time', required: true, category: 'Event' },
    { path: 'bookedTime', label: 'Booked Time', type: 'time', required: true, category: 'Event' },
    { path: 'recordedBy', label: 'Recorded By', type: 'string', required: false, category: 'Other' },
    { path: 'transferToRoomId', label: 'Transfer To Room', type: 'string', required: false, category: 'Other' },
    { path: 'notes', label: 'Notes', type: 'string', required: false, category: 'Other' },
  ],
};

// ==================== TRANSFORM FUNCTIONS ====================

export function normalizeDate(value: any): string {
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

export function normalizeTime(value: any): string {
  if (!value) return '';
  const str = String(value).trim();

  // Already in HH:mm format
  if (/^\d{1,2}:\d{2}$/.test(str)) {
    const [h, m] = str.split(':');
    return `${h.padStart(2, '0')}:${m}`;
  }

  // HH:mm:ss format
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(str)) {
    const [h, m] = str.split(':');
    return `${h.padStart(2, '0')}:${m}`;
  }

  // Handle AM/PM
  const ampmMatch = str.match(/^(\d{1,2}):?(\d{2})?\s*(am|pm)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1]);
    const minutes = ampmMatch[2] || '00';
    const isPM = ampmMatch[3].toLowerCase() === 'pm';
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }

  return '';
}

export function normalizeBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return ['true', 'yes', 'y', '1', 'on'].includes(lower);
  }
  return false;
}

export function toNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[%$,]/g, '').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function toInteger(value: any): number {
  return Math.round(toNumber(value));
}

export function normalizeAgeGroup(value: any): ChildcareAgeGroup {
  if (!value) return 'toddlers';
  const lower = String(value).toLowerCase().trim();

  const ageGroupMap: Record<string, ChildcareAgeGroup> = {
    babies: 'babies',
    baby: 'babies',
    infant: 'babies',
    infants: 'babies',
    nursery: 'babies',
    '0-2': 'babies',
    toddlers: 'toddlers',
    toddler: 'toddlers',
    '2-3': 'toddlers',
    preschool: 'preschool',
    'pre-school': 'preschool',
    '3-4': 'preschool',
    kindy: 'kindy',
    kindergarten: 'kindy',
    kinder: 'kindy',
    '4-5': 'kindy',
  };

  return ageGroupMap[lower] || 'toddlers';
}

export function normalizeBookingType(value: any): ChildBookingImport['bookingType'] {
  if (!value) return 'permanent';
  const lower = String(value).toLowerCase().trim();

  const typeMap: Record<string, ChildBookingImport['bookingType']> = {
    permanent: 'permanent',
    perm: 'permanent',
    regular: 'permanent',
    casual: 'casual',
    cas: 'casual',
    'one-off': 'casual',
    oneoff: 'casual',
    makeup: 'makeup',
    'make-up': 'makeup',
    makeUp: 'makeup',
    extra: 'extra',
    additional: 'extra',
  };

  return typeMap[lower] || 'permanent';
}

export function normalizeBookingStatus(value: any): ChildBookingImport['status'] {
  if (!value) return 'confirmed';
  const lower = String(value).toLowerCase().trim();

  const statusMap: Record<string, ChildBookingImport['status']> = {
    confirmed: 'confirmed',
    conf: 'confirmed',
    active: 'confirmed',
    pending: 'pending',
    pend: 'pending',
    cancelled: 'cancelled',
    canceled: 'cancelled',
    cancel: 'cancelled',
    waitlist: 'waitlist',
    waiting: 'waitlist',
    'wait list': 'waitlist',
  };

  return statusMap[lower] || 'confirmed';
}

export function normalizeEventType(value: any): TodayAttendanceEvent['eventType'] {
  if (!value) return 'sign_in';
  const lower = String(value).toLowerCase().trim().replace(/[\s-]/g, '_');

  const typeMap: Record<string, TodayAttendanceEvent['eventType']> = {
    sign_in: 'sign_in',
    signin: 'sign_in',
    arrival: 'sign_in',
    arrive: 'sign_in',
    in: 'sign_in',
    sign_out: 'sign_out',
    signout: 'sign_out',
    departure: 'sign_out',
    depart: 'sign_out',
    out: 'sign_out',
    room_transfer: 'room_transfer',
    transfer: 'room_transfer',
    move: 'room_transfer',
    absent_notified: 'absent_notified',
    absent: 'absent_notified',
    late_arrival: 'late_arrival',
    late: 'late_arrival',
  };

  return typeMap[lower] || 'sign_in';
}

// ==================== TRANSFORM REGISTRY ====================

export const TRANSFORM_FUNCTIONS: Record<TransformType, (value: any) => any> = {
  none: (v) => v,
  uppercase: (v) => String(v || '').toUpperCase(),
  lowercase: (v) => String(v || '').toLowerCase(),
  trim: (v) => String(v || '').trim(),
  date_dmy: normalizeDate,
  date_mdy: normalizeDate,
  date_ymd: normalizeDate,
  time_hhmm: normalizeTime,
  boolean: normalizeBoolean,
  number: toNumber,
  integer: toInteger,
  percentage: (v) => Math.min(100, Math.max(0, toNumber(v))),
  age_group: normalizeAgeGroup,
  booking_type: normalizeBookingType,
  booking_status: normalizeBookingStatus,
  event_type: normalizeEventType,
};

export const TRANSFORM_OPTIONS: { value: TransformType; label: string }[] = [
  { value: 'none', label: 'No transform' },
  { value: 'trim', label: 'Trim whitespace' },
  { value: 'uppercase', label: 'UPPERCASE' },
  { value: 'lowercase', label: 'lowercase' },
  { value: 'date_dmy', label: 'Date (DD/MM/YYYY)' },
  { value: 'date_mdy', label: 'Date (MM/DD/YYYY)' },
  { value: 'date_ymd', label: 'Date (YYYY-MM-DD)' },
  { value: 'time_hhmm', label: 'Time (HH:mm)' },
  { value: 'number', label: 'Number' },
  { value: 'integer', label: 'Integer' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'boolean', label: 'Yes/No' },
  { value: 'age_group', label: 'Age Group' },
  { value: 'booking_type', label: 'Booking Type' },
  { value: 'booking_status', label: 'Booking Status' },
  { value: 'event_type', label: 'Event Type' },
];

// ==================== CSV IMPORT ETL PIPELINE ====================

export class DemandCSVImportPipeline {
  private industry: IndustryType = 'childcare';
  private importType: IndustryImportType = 'demand';
  private mappings: ColumnMappingConfig[] = [];

  setIndustryConfig(industry: IndustryType, importType: IndustryImportType): void {
    this.industry = industry;
    this.importType = importType;
    this.mappings = [];
  }

  // Legacy method for backward compatibility
  setImportType(type: DemandImportType): void {
    // Map old types to new types
    const typeMap: Record<DemandImportType, IndustryImportType> = {
      bookings: 'demand',
      bookingSummary: 'summary',
      historicalAttendance: 'historical',
      todayAttendance: 'realtime',
      rooms: 'locations',
    };
    this.importType = typeMap[type] || 'demand';
    this.mappings = [];
  }

  getImportType(): IndustryImportType {
    return this.importType;
  }

  getIndustry(): IndustryType {
    return this.industry;
  }

  setMappings(mappings: ColumnMappingConfig[]): void {
    this.mappings = mappings;
  }

  getMappings(): ColumnMappingConfig[] {
    return this.mappings;
  }

  getTargetFields(): TargetFieldDefinition[] {
    return getIndustryFields(this.industry, this.importType);
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
      return 0.7 + ratio * 0.3;
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
        matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
      }
    }
    const distance = matrix[s1.length][s2.length];
    const maxLen = Math.max(s1.length, s2.length);
    return 1 - distance / maxLen;
  }

  // Get field aliases from industry config
  private getFieldAliases(): Record<string, IndustryFieldAlias> {
    return getIndustryFieldAliases(this.industry);
  }


  // Get all keywords/aliases for target fields - now uses industry config
  private getCommonAliases(): Record<string, { aliases: string[]; transform?: TransformType }> {
    // Common aliases that apply across industries
    return {
      // Date/time
      date: { aliases: ['date', 'booking date', 'record date', 'attendance date'], transform: 'date_dmy' },
      startTime: { aliases: ['start time', 'starttime', 'arrival time', 'booked start', 'from'], transform: 'time_hhmm' },
      endTime: { aliases: ['end time', 'endtime', 'departure time', 'booked end', 'to'], transform: 'time_hhmm' },
      timeSlot: { aliases: ['time slot', 'timeslot', 'slot', 'session', 'period'] },
      timestamp: { aliases: ['timestamp', 'datetime', 'date time', 'event time'] },
      
      // Common identifiers
      notes: { aliases: ['notes', 'comments', 'remarks', 'memo'] },
      status: { aliases: ['status', 'booking status', 'state'], transform: 'booking_status' },
      
      // Operating hours
      'operatingHours.start': { aliases: ['operating start', 'open time', 'start time', 'opens'], transform: 'time_hhmm' },
      'operatingHours.end': { aliases: ['operating end', 'close time', 'end time', 'closes'], transform: 'time_hhmm' },
    };
  }


  // Auto-detect column mappings based on header name similarity
  autoDetectMappings(headers: string[]): ColumnMappingConfig[] {
    const detected: ColumnMappingConfig[] = [];
    const usedTargets = new Set<string>();
    const industryAliases = this.getFieldAliases();
    const commonAliases = this.getCommonAliases();
    const targetFields = this.getTargetFields();

    // Merge industry and common aliases
    const fieldAliases = { ...commonAliases, ...industryAliases };

    // Score each header against all target fields
    const scoredMappings: Array<{
      header: string;
      target: string;
      score: number;
      transform?: TransformType;
    }> = [];

    for (const header of headers) {
      const normalizedHeader = header.toLowerCase().trim();

      for (const field of targetFields) {
        const aliasConfig = fieldAliases[field.path];
        let bestScore = 0;
        let transform: TransformType | undefined;

        if (aliasConfig) {
          for (const alias of aliasConfig.aliases) {
            const similarity = this.calculateSimilarity(normalizedHeader, alias);
            if (similarity > bestScore) {
              bestScore = similarity;
              transform = aliasConfig.transform;
            }
          }
        }

        // Also check direct match with field path/label
        const labelScore = this.calculateSimilarity(normalizedHeader, field.label);
        const pathScore = this.calculateSimilarity(normalizedHeader, field.path);
        bestScore = Math.max(bestScore, labelScore, pathScore);

        if (bestScore >= 0.6) {
          scoredMappings.push({
            header,
            target: field.path,
            score: bestScore,
            transform,
          });
        }
      }
    }

    // Sort by score descending and pick best unique mappings
    scoredMappings.sort((a, b) => b.score - a.score);

    const usedHeaders = new Set<string>();
    for (const mapping of scoredMappings) {
      if (!usedTargets.has(mapping.target) && !usedHeaders.has(mapping.header)) {
        detected.push({
          sourceColumn: mapping.header,
          targetField: mapping.target,
          transformType: mapping.transform,
        });
        usedTargets.add(mapping.target);
        usedHeaders.add(mapping.header);
      }
    }

    return detected;
  }

  // Get suggested mappings with confidence scores for UI
  getSuggestedMappings(headers: string[]): Array<{
    sourceColumn: string;
    suggestions: Array<{ targetField: string; confidence: number }>;
  }> {
    const industryAliases = this.getFieldAliases();
    const commonAliases = this.getCommonAliases();
    const fieldAliases = { ...commonAliases, ...industryAliases };
    const targetFields = this.getTargetFields();
    const result: Array<{
      sourceColumn: string;
      suggestions: Array<{ targetField: string; confidence: number }>;
    }> = [];

    for (const header of headers) {
      const normalizedHeader = header.toLowerCase().trim();
      const suggestions: Array<{ targetField: string; confidence: number }> = [];

      for (const field of targetFields) {
        const aliasConfig = fieldAliases[field.path];
        let bestScore = 0;

        if (aliasConfig) {
          for (const alias of aliasConfig.aliases) {
            const similarity = this.calculateSimilarity(normalizedHeader, alias);
            bestScore = Math.max(bestScore, similarity);
          }
        }

        const labelScore = this.calculateSimilarity(normalizedHeader, field.label);
        const pathScore = this.calculateSimilarity(normalizedHeader, field.path);
        bestScore = Math.max(bestScore, labelScore, pathScore);

        if (bestScore >= 0.5) {
          suggestions.push({
            targetField: field.path,
            confidence: Math.round(bestScore * 100),
          });
        }
      }

      suggestions.sort((a, b) => b.confidence - a.confidence);
      result.push({ sourceColumn: header, suggestions: suggestions.slice(0, 5) });
    }

    return result;
  }


  // Transform a single record
  private transformRecord(record: Record<string, any>, index: number): ImportedDemandRecord {
    const result: Record<string, any> = {};
    const messages: string[] = [];
    let hasError = false;
    let hasWarning = false;

    const targetFields = this.getTargetFields();
    const requiredFields = targetFields.filter((f) => f.required);

    // Apply mappings
    for (const mapping of this.mappings) {
      const rawValue = record[mapping.sourceColumn];
      const transformFn = TRANSFORM_FUNCTIONS[mapping.transformType || 'none'];
      const transformedValue = transformFn(rawValue);

      // Handle nested paths
      if (mapping.targetField.includes('.')) {
        const [parent, child] = mapping.targetField.split('.');
        if (!result[parent]) result[parent] = {};
        result[parent][child] = transformedValue;
      } else {
        result[mapping.targetField] = transformedValue;
      }
    }

    // Check required fields
    for (const field of requiredFields) {
      let value: any;
      if (field.path.includes('.')) {
        const [parent, child] = field.path.split('.');
        value = result[parent]?.[child];
      } else {
        value = result[field.path];
      }

      if (value === undefined || value === null || value === '') {
        messages.push(`Missing required field: ${field.label}`);
        hasError = true;
      }
    }

    // Validate enum values
    for (const field of targetFields.filter((f) => f.type === 'enum')) {
      let value: any;
      if (field.path.includes('.')) {
        const [parent, child] = field.path.split('.');
        value = result[parent]?.[child];
      } else {
        value = result[field.path];
      }

      if (value && field.enumValues && !field.enumValues.includes(value)) {
        messages.push(`Invalid value for ${field.label}: "${value}"`);
        hasWarning = true;
      }
    }

    return {
      index,
      data: result,
      status: hasError ? 'error' : hasWarning ? 'warning' : 'success',
      messages,
    };
  }

  // Transform all records
  transform(records: Record<string, any>[]): DemandImportResult {
    const results: ImportedDemandRecord[] = [];
    let success = 0;
    let failed = 0;
    let warnings = 0;

    for (let i = 0; i < records.length; i++) {
      const result = this.transformRecord(records[i], i);
      results.push(result);

      if (result.status === 'success') success++;
      else if (result.status === 'error') failed++;
      else warnings++;
    }

    return {
      type: this.importType,
      industry: this.industry,
      success,
      failed,
      warnings,
      records: results,
      errors: [],
    };
  }
}

// Singleton instance for CSV imports
export const demandCSVImport = new DemandCSVImportPipeline();
