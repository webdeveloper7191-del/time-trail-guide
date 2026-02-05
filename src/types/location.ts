// Location Management Types with Industry-Agnostic Compliance Settings

import { IndustryType } from './industryConfig';

// ============= Core Location Types =============

export type LocationStatus = 'active' | 'inactive' | 'pending_setup' | 'temporarily_closed';

export interface OperatingHours {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  isOpen: boolean;
  openTime: string; // HH:mm
  closeTime: string; // HH:mm
}

export interface GeofenceZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isClockInZone: boolean;
}

export interface Location {
  id: string;
  name: string;
  code: string; // Short code for the location
  status: LocationStatus;
  
  // Address
  address: {
    line1: string;
    line2?: string;
    suburb: string;
    state: string;
    postcode: string;
    country: string;
  };
  
  // Contact
  phone?: string;
  email?: string;
  
  // Operating Configuration
  timezone: string;
  operatingHours: OperatingHours[];
  
  // Capacity & Staffing
  totalCapacity: number;
  maxStaff: number;
  
  // Industry Configuration
  industryType: IndustryType;
  
  // Custom service categories for this location
  serviceCategories?: string[];
  
  // Geofencing
  geofenceZones?: GeofenceZone[];
  
  // Relationships
  areaIds: string[]; // Areas within this location
  departmentIds: string[]; // Departments within this location
  
  // Audit
  createdAt: string;
  updatedAt: string;
}

// ============= Area Types (Sub-locations with compliance settings) =============

export type AreaStatus = 'active' | 'inactive' | 'maintenance';

export interface StaffingRatio {
  id: string;
  name: string; // e.g., "Standard", "High Care", "Night"
  demandUnit: string; // e.g., "Children", "Patients", "Customers"
  minAttendance: number; // Minimum attendance count
  maxAttendance: number; // Maximum attendance count
  staffRequired: number; // Staff required for this range
  isDefault: boolean;
  applicableTimeStart?: string; // Time-based ratio
  applicableTimeEnd?: string;
  applicableDays?: number[]; // Day-based ratio (0-6)
  notes?: string;
}

export interface QualificationRequirement {
  id: string;
  qualificationId: string;
  qualificationName: string;
  qualificationShortName: string;
  requirementType: 'mandatory' | 'preferred' | 'percentage';
  percentageRequired?: number; // For percentage type (e.g., 50% must have Diploma)
  minimumCount?: number; // Minimum count required
  notes?: string;
}

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  ruleType: 'ratio' | 'qualification' | 'time' | 'capacity' | 'custom';
  severity: 'info' | 'warning' | 'critical';
  isActive: boolean;
  
  // Rule configuration
  conditions: {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'between' | 'in';
    value: string | number | (string | number)[];
  }[];
  
  // Action when violated
  action: 'warn' | 'block' | 'escalate';
  notifyRoles?: string[];
}

export interface Area {
  id: string;
  locationId: string;
  name: string;
  code: string;
  status: AreaStatus;
  color?: string; // For visual identification
  
  // Capacity
  capacity: number;
  serviceCategory?: string; // Industry-agnostic grouping (e.g., "Nursery", "ICU", "Kitchen", "Checkout")
  serviceType?: string; // Type of service offered
  
  // Staffing Configuration
  staffingRatios: StaffingRatio[];
  minimumStaff: number;
  maximumStaff?: number;
  
  // Qualification Requirements
  qualificationRequirements: QualificationRequirement[];
  
  // Compliance Rules
  complianceRules: ComplianceRule[];
  
  // Operating Hours (can override location)
  overrideOperatingHours?: boolean;
  operatingHours?: OperatingHours[];
  
  // Audit
  createdAt: string;
  updatedAt: string;
}

// ============= Department Types =============

export type DepartmentType = 'operational' | 'support' | 'management' | 'administrative';

export interface Department {
  id: string;
  locationId: string;
  name: string;
  code: string;
  type: DepartmentType;
  description?: string;
  
  // Hierarchy
  parentDepartmentId?: string; // For nested departments
  childDepartmentIds?: string[];
  
  // Areas assigned to this department
  areaIds: string[];
  
  // Manager
  managerId?: string;
  managerName?: string;
  
  // Budget
  budgetAllocation?: number;
  costCentreCode?: string;
  
  // Staffing
  headcount?: number;
  
  // Status
  isActive: boolean;
  
  // Audit
  createdAt: string;
  updatedAt: string;
}

// ============= Industry-Specific Configuration =============

export interface IndustryComplianceConfig {
  id: string;
  industryType: IndustryType;
  name: string;
  
  // Default ratios for this industry
  defaultRatios: StaffingRatio[];
  
  // Default qualification requirements
  defaultQualifications: QualificationRequirement[];
  
  // Regulatory information
  regulatoryBody?: string;
  regulatoryReference?: string;
  regulatoryUrl?: string;
  
  // Pre-defined compliance rules
  defaultComplianceRules: ComplianceRule[];
  
  // Service category / service type presets
  areaPresets: {
    name: string;
    serviceCategory?: string;
    serviceType?: string;
    capacity: number;
    ratios: StaffingRatio[];
    qualifications: QualificationRequirement[];
  }[];
}

// ============= Summary Types =============

export interface LocationSummary {
  id: string;
  name: string;
  code: string;
  status: LocationStatus;
  areaCount: number;
  departmentCount: number;
  totalCapacity: number;
  currentOccupancy?: number;
  staffCount?: number;
  complianceStatus: 'compliant' | 'warning' | 'non_compliant';
}

export interface AreaSummary {
  id: string;
  name: string;
  code: string;
  status: AreaStatus;
  capacity: number;
  currentOccupancy?: number;
  staffOnDuty?: number;
  requiredStaff?: number;
  complianceStatus: 'compliant' | 'warning' | 'non_compliant';
  complianceIssues?: string[];
}

// ============= Location-Level Compliance Types =============

export interface UnderRoofRatio {
  id: string;
  name: string;
  description?: string;
  minTotalAttendance: number;
  maxTotalAttendance: number;
  totalStaffRequired: number;
  isActive: boolean;
}

export interface AreaCombiningThreshold {
  id: string;
  name: string;
  description?: string;
  triggerType: 'attendance_percentage' | 'absolute_count' | 'staff_ratio';
  triggerValue: number; // e.g., 50 for 50% or 5 for absolute count
  combineWithAreaIds?: string[]; // Specific areas to suggest combining with
  applicableServiceCategories?: string[]; // Service categories this threshold applies to
  combineOnlyWithSameCategory?: boolean; // Only suggest combining with same service category
  isActive: boolean;
  promptMessage?: string; // Custom message to show roster manager
}

export interface LocationComplianceConfig {
  underRoofRatios: UnderRoofRatio[];
  areaCombiningThresholds: AreaCombiningThreshold[];
  locationQualifications: QualificationRequirement[];
}

// ============= Constants =============

export const LOCATION_STATUS_LABELS: Record<LocationStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  pending_setup: 'Pending Setup',
  temporarily_closed: 'Temporarily Closed',
};

export const AREA_STATUS_LABELS: Record<AreaStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  maintenance: 'Under Maintenance',
};

export const DEPARTMENT_TYPE_LABELS: Record<DepartmentType, string> = {
  operational: 'Operational',
  support: 'Support',
  management: 'Management',
  administrative: 'Administrative',
};

export const AUSTRALIAN_STATES = [
  { value: 'NSW', label: 'New South Wales' },
  { value: 'VIC', label: 'Victoria' },
  { value: 'QLD', label: 'Queensland' },
  { value: 'WA', label: 'Western Australia' },
  { value: 'SA', label: 'South Australia' },
  { value: 'TAS', label: 'Tasmania' },
  { value: 'ACT', label: 'Australian Capital Territory' },
  { value: 'NT', label: 'Northern Territory' },
];

export const AUSTRALIAN_TIMEZONES = [
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)' },
  { value: 'Australia/Brisbane', label: 'Brisbane (AEST)' },
  { value: 'Australia/Perth', label: 'Perth (AWST)' },
  { value: 'Australia/Adelaide', label: 'Adelaide (ACST/ACDT)' },
  { value: 'Australia/Hobart', label: 'Hobart (AEST/AEDT)' },
  { value: 'Australia/Darwin', label: 'Darwin (ACST)' },
];
