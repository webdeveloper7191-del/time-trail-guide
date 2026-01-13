// Industry-agnostic configuration for demand and staffing

export type IndustryType = 
  | 'childcare'
  | 'retail'
  | 'healthcare'
  | 'hospitality'
  | 'call_center'
  | 'manufacturing'
  | 'events'
  | 'custom';

export interface IndustryTemplate {
  id: IndustryType;
  name: string;
  description: string;
  icon: string;
  
  // Demand configuration
  demandConfig: DemandConfig;
  
  // Staffing configuration
  staffingConfig: StaffingConfig;
  
  // Integration options
  integrations: IntegrationOption[];
}

export interface DemandConfig {
  // What unit represents demand (e.g., "Children", "Customers", "Patients")
  demandUnit: string;
  demandUnitPlural: string;
  
  // What we're tracking
  primaryMetric: string; // e.g., "Bookings", "Foot Traffic", "Appointments"
  secondaryMetric?: string; // e.g., "Attendance", "Purchases", "Check-ins"
  
  // Ratio/capacity terminology
  ratioLabel: string; // e.g., "Staff:Child", "Staff:Customer", "Nurse:Patient"
  capacityLabel: string; // e.g., "Room Capacity", "Store Capacity", "Bed Capacity"
  
  // Time-based demand patterns
  peakIndicators: string[]; // e.g., ["Drop-off 7-9am", "Lunch 12-2pm"]
  
  // Zone/area terminology (instead of "Room")
  zoneLabel: string; // e.g., "Room", "Department", "Section", "Station"
  zoneLabelPlural: string;
}

// Extended demand data configuration
export type DemandDataSourceType = 'manual' | 'integration' | 'historical' | 'forecast' | 'hybrid';
export type DemandGranularity = '15min' | '30min' | '1hour' | '2hour' | '4hour' | 'daily';
export type ForecastMethod = 'moving_average' | 'weighted_average' | 'seasonal' | 'ml_prediction' | 'manual';

export interface DemandDataSourceConfig {
  type: DemandDataSourceType;
  enabled: boolean;
  priority: number; // Lower = higher priority when merging sources
  settings: Record<string, any>;
}

export interface DemandSchedulePattern {
  id: string;
  name: string;
  dayOfWeek: number[]; // 0-6
  startTime: string;
  endTime: string;
  expectedDemandMultiplier: number; // 1.0 = normal, 1.5 = 50% higher
  color: string;
}

export interface DemandThreshold {
  id: string;
  name: string;
  minDemand: number;
  maxDemand?: number;
  requiredStaff: number;
  color: string;
  alertLevel: 'info' | 'warning' | 'critical';
}

export interface DemandMasterSettings {
  // Basic settings
  enabled: boolean;
  granularity: DemandGranularity;
  timezone: string;
  
  // Operating hours
  operatingHours: {
    dayOfWeek: number;
    open: string;
    close: string;
    isOpen: boolean;
  }[];
  
  // Data sources
  dataSources: {
    manual: DemandDataSourceConfig;
    historical: DemandDataSourceConfig;
    integration: DemandDataSourceConfig;
    forecast: DemandDataSourceConfig;
  };
  
  // Forecasting
  forecasting: {
    enabled: boolean;
    method: ForecastMethod;
    lookbackWeeks: number;
    confidenceThreshold: number; // 0-100
    autoAdjust: boolean;
    seasonalAdjustments: boolean;
  };
  
  // Patterns & thresholds
  schedulePatterns: DemandSchedulePattern[];
  thresholds: DemandThreshold[];
  
  // Alerts
  alerts: {
    understaffing: boolean;
    overstaffing: boolean;
    demandSpike: boolean;
    forecastAccuracy: boolean;
    thresholdPercentage: number;
  };
  
  // Display preferences
  display: {
    showForecast: boolean;
    showHistorical: boolean;
    showVariance: boolean;
    chartType: 'bar' | 'line' | 'area';
    colorScheme: 'default' | 'heatmap' | 'gradient';
  };
}

export interface StaffingConfig {
  // Role terminology
  roleLabel: string; // e.g., "Educator", "Associate", "Nurse"
  roleLabelPlural: string;
  
  // Qualification requirements
  qualificationTypes: QualificationConfig[];
  
  // Compliance terminology
  complianceLabel: string; // e.g., "Ratio Compliance", "Coverage Target"
  
  // Budget terminology
  budgetPeriod: 'daily' | 'weekly' | 'fortnightly' | 'monthly';
}

export interface QualificationConfig {
  id: string;
  name: string;
  shortName: string;
  required: boolean;
  expiryTracked: boolean;
}

export interface IntegrationOption {
  id: string;
  name: string;
  type: 'pos' | 'booking' | 'hr' | 'payroll' | 'iot' | 'forecast' | 'custom';
  description: string;
  fields: IntegrationField[];
}

export interface IntegrationField {
  name: string;
  type: 'text' | 'url' | 'api_key' | 'webhook';
  required: boolean;
}

// Industry-agnostic demand data
export interface GenericDemandData {
  date: string;
  locationId: string;
  zoneId: string;
  timeSlot: string;
  
  // Generic demand metrics
  expectedDemand: number; // Primary metric (bookings, traffic, appointments)
  actualDemand: number; // What actually occurred
  demandForecast: number; // AI/historical prediction
  
  // Capacity
  capacity: number;
  utilizationPercent: number;
  
  // Staffing
  requiredStaff: number;
  scheduledStaff: number;
  staffingGap: number;
  isCompliant: boolean;
  
  // Source of data
  dataSource: 'manual' | 'integration' | 'forecast' | 'historical';
  confidence: number; // 0-100, how confident is the forecast
}

// Pre-defined industry templates
export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  {
    id: 'childcare',
    name: 'Childcare',
    description: 'Early learning centres, daycare, preschools',
    icon: 'Baby',
    demandConfig: {
      demandUnit: 'Child',
      demandUnitPlural: 'Children',
      primaryMetric: 'Bookings',
      secondaryMetric: 'Attendance',
      ratioLabel: 'Staff:Child Ratio',
      capacityLabel: 'Room Capacity',
      peakIndicators: ['Drop-off 7-9am', 'Pick-up 3-6pm'],
      zoneLabel: 'Room',
      zoneLabelPlural: 'Rooms',
    },
    staffingConfig: {
      roleLabel: 'Educator',
      roleLabelPlural: 'Educators',
      qualificationTypes: [
        { id: 'diploma_ece', name: 'Diploma in Early Childhood Education', shortName: 'Diploma ECE', required: true, expiryTracked: false },
        { id: 'first_aid', name: 'First Aid Certificate', shortName: 'First Aid', required: true, expiryTracked: true },
        { id: 'wwc', name: 'Working with Children Check', shortName: 'WWC', required: true, expiryTracked: true },
      ],
      complianceLabel: 'Ratio Compliance',
      budgetPeriod: 'weekly',
    },
    integrations: [
      { id: 'xplor', name: 'Xplor', type: 'booking', description: 'Sync child bookings and attendance', fields: [{ name: 'API Key', type: 'api_key', required: true }] },
      { id: 'xap', name: 'Xap', type: 'booking', description: 'Sync child bookings and session data', fields: [{ name: 'API Key', type: 'api_key', required: true }] },
      { id: 'owna', name: 'Owna', type: 'booking', description: 'Sync enrolments and attendance tracking', fields: [{ name: 'API Key', type: 'api_key', required: true }] },
      { id: 'kidsoft', name: 'Kidsoft', type: 'booking', description: 'Sync bookings and room occupancy', fields: [{ name: 'API Key', type: 'api_key', required: true }] },
      { id: 'qikkids', name: 'QikKids', type: 'booking', description: 'Sync enrolments and sign-ins', fields: [{ name: 'API Key', type: 'api_key', required: true }] },
    ],
  },
  {
    id: 'retail',
    name: 'Retail',
    description: 'Stores, supermarkets, shopping centres',
    icon: 'ShoppingCart',
    demandConfig: {
      demandUnit: 'Customer',
      demandUnitPlural: 'Customers',
      primaryMetric: 'Foot Traffic',
      secondaryMetric: 'Sales',
      ratioLabel: 'Staff:Customer Target',
      capacityLabel: 'Store Capacity',
      peakIndicators: ['Lunch 12-2pm', 'After Work 5-7pm', 'Weekends'],
      zoneLabel: 'Department',
      zoneLabelPlural: 'Departments',
    },
    staffingConfig: {
      roleLabel: 'Associate',
      roleLabelPlural: 'Associates',
      qualificationTypes: [
        { id: 'rsa', name: 'Responsible Service of Alcohol', shortName: 'RSA', required: false, expiryTracked: true },
        { id: 'pos', name: 'POS Training', shortName: 'POS', required: true, expiryTracked: false },
      ],
      complianceLabel: 'Coverage Target',
      budgetPeriod: 'weekly',
    },
    integrations: [
      { id: 'shopify', name: 'Shopify POS', type: 'pos', description: 'Sync sales and traffic data', fields: [{ name: 'Store URL', type: 'url', required: true }, { name: 'API Key', type: 'api_key', required: true }] },
      { id: 'lightspeed', name: 'Lightspeed', type: 'pos', description: 'Sync transactions and forecasts', fields: [{ name: 'API Key', type: 'api_key', required: true }] },
    ],
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Hospitals, clinics, aged care',
    icon: 'Heart',
    demandConfig: {
      demandUnit: 'Patient',
      demandUnitPlural: 'Patients',
      primaryMetric: 'Appointments',
      secondaryMetric: 'Bed Occupancy',
      ratioLabel: 'Nurse:Patient Ratio',
      capacityLabel: 'Bed Capacity',
      peakIndicators: ['Shift Change 7am', 'Shift Change 3pm', 'Shift Change 11pm'],
      zoneLabel: 'Ward',
      zoneLabelPlural: 'Wards',
    },
    staffingConfig: {
      roleLabel: 'Nurse',
      roleLabelPlural: 'Nurses',
      qualificationTypes: [
        { id: 'rn', name: 'Registered Nurse', shortName: 'RN', required: true, expiryTracked: true },
        { id: 'bls', name: 'Basic Life Support', shortName: 'BLS', required: true, expiryTracked: true },
        { id: 'acls', name: 'Advanced Cardiac Life Support', shortName: 'ACLS', required: false, expiryTracked: true },
      ],
      complianceLabel: 'Safe Staffing',
      budgetPeriod: 'fortnightly',
    },
    integrations: [
      { id: 'epic', name: 'Epic', type: 'hr', description: 'Sync patient census and scheduling', fields: [{ name: 'API Endpoint', type: 'url', required: true }] },
    ],
  },
  {
    id: 'hospitality',
    name: 'Hospitality',
    description: 'Restaurants, cafes, hotels, bars',
    icon: 'Utensils',
    demandConfig: {
      demandUnit: 'Cover',
      demandUnitPlural: 'Covers',
      primaryMetric: 'Reservations',
      secondaryMetric: 'Walk-ins',
      ratioLabel: 'Server:Table Ratio',
      capacityLabel: 'Seating Capacity',
      peakIndicators: ['Lunch 12-2pm', 'Dinner 6-9pm', 'Weekend Brunch'],
      zoneLabel: 'Section',
      zoneLabelPlural: 'Sections',
    },
    staffingConfig: {
      roleLabel: 'Server',
      roleLabelPlural: 'Staff',
      qualificationTypes: [
        { id: 'rsa', name: 'Responsible Service of Alcohol', shortName: 'RSA', required: true, expiryTracked: true },
        { id: 'food_safety', name: 'Food Safety Certificate', shortName: 'Food Safety', required: true, expiryTracked: true },
      ],
      complianceLabel: 'Service Level',
      budgetPeriod: 'weekly',
    },
    integrations: [
      { id: 'opentable', name: 'OpenTable', type: 'booking', description: 'Sync reservations', fields: [{ name: 'Restaurant ID', type: 'text', required: true }] },
      { id: 'resy', name: 'Resy', type: 'booking', description: 'Sync reservations and covers', fields: [{ name: 'API Key', type: 'api_key', required: true }] },
    ],
  },
  {
    id: 'call_center',
    name: 'Call Centre',
    description: 'Contact centres, customer service, support',
    icon: 'Headphones',
    demandConfig: {
      demandUnit: 'Call',
      demandUnitPlural: 'Calls',
      primaryMetric: 'Call Volume',
      secondaryMetric: 'Handle Time',
      ratioLabel: 'Agent:Call Ratio',
      capacityLabel: 'Queue Capacity',
      peakIndicators: ['Morning 9-11am', 'After Lunch 1-3pm', 'Campaign Days'],
      zoneLabel: 'Queue',
      zoneLabelPlural: 'Queues',
    },
    staffingConfig: {
      roleLabel: 'Agent',
      roleLabelPlural: 'Agents',
      qualificationTypes: [
        { id: 'product_cert', name: 'Product Certification', shortName: 'Product', required: true, expiryTracked: false },
        { id: 'escalation', name: 'Escalation Handling', shortName: 'Escalation', required: false, expiryTracked: false },
      ],
      complianceLabel: 'Service Level Agreement',
      budgetPeriod: 'weekly',
    },
    integrations: [
      { id: 'genesys', name: 'Genesys Cloud', type: 'forecast', description: 'Sync call forecasts', fields: [{ name: 'API Key', type: 'api_key', required: true }] },
      { id: 'five9', name: 'Five9', type: 'forecast', description: 'Sync volume predictions', fields: [{ name: 'API Key', type: 'api_key', required: true }] },
    ],
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    description: 'Factories, warehouses, production',
    icon: 'Factory',
    demandConfig: {
      demandUnit: 'Unit',
      demandUnitPlural: 'Units',
      primaryMetric: 'Production Target',
      secondaryMetric: 'Orders',
      ratioLabel: 'Operator:Line Ratio',
      capacityLabel: 'Line Capacity',
      peakIndicators: ['Shift Start 6am', 'Shift Change 2pm', 'Rush Orders'],
      zoneLabel: 'Line',
      zoneLabelPlural: 'Lines',
    },
    staffingConfig: {
      roleLabel: 'Operator',
      roleLabelPlural: 'Operators',
      qualificationTypes: [
        { id: 'forklift', name: 'Forklift License', shortName: 'Forklift', required: false, expiryTracked: true },
        { id: 'machinery', name: 'Machinery Operation', shortName: 'Machinery', required: true, expiryTracked: false },
      ],
      complianceLabel: 'Production Target',
      budgetPeriod: 'weekly',
    },
    integrations: [
      { id: 'sap', name: 'SAP', type: 'hr', description: 'Sync production orders', fields: [{ name: 'API Endpoint', type: 'url', required: true }] },
    ],
  },
  {
    id: 'events',
    name: 'Events',
    description: 'Venues, conferences, concerts, festivals',
    icon: 'Calendar',
    demandConfig: {
      demandUnit: 'Attendee',
      demandUnitPlural: 'Attendees',
      primaryMetric: 'Ticket Sales',
      secondaryMetric: 'Check-ins',
      ratioLabel: 'Staff:Attendee Ratio',
      capacityLabel: 'Venue Capacity',
      peakIndicators: ['Doors Open', 'Intermission', 'Post-Event'],
      zoneLabel: 'Area',
      zoneLabelPlural: 'Areas',
    },
    staffingConfig: {
      roleLabel: 'Crew',
      roleLabelPlural: 'Crew',
      qualificationTypes: [
        { id: 'security', name: 'Security License', shortName: 'Security', required: false, expiryTracked: true },
        { id: 'rsa', name: 'Responsible Service of Alcohol', shortName: 'RSA', required: false, expiryTracked: true },
      ],
      complianceLabel: 'Coverage Level',
      budgetPeriod: 'daily',
    },
    integrations: [
      { id: 'eventbrite', name: 'Eventbrite', type: 'booking', description: 'Sync ticket sales', fields: [{ name: 'API Key', type: 'api_key', required: true }] },
      { id: 'ticketmaster', name: 'Ticketmaster', type: 'booking', description: 'Sync sales and attendance', fields: [{ name: 'API Key', type: 'api_key', required: true }] },
    ],
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Define your own industry settings',
    icon: 'Settings',
    demandConfig: {
      demandUnit: 'Unit',
      demandUnitPlural: 'Units',
      primaryMetric: 'Demand',
      secondaryMetric: 'Actual',
      ratioLabel: 'Staff Ratio',
      capacityLabel: 'Capacity',
      peakIndicators: [],
      zoneLabel: 'Zone',
      zoneLabelPlural: 'Zones',
    },
    staffingConfig: {
      roleLabel: 'Staff',
      roleLabelPlural: 'Staff',
      qualificationTypes: [],
      complianceLabel: 'Compliance',
      budgetPeriod: 'weekly',
    },
    integrations: [
      { id: 'webhook', name: 'Custom Webhook', type: 'custom', description: 'Connect via webhook', fields: [{ name: 'Webhook URL', type: 'webhook', required: true }] },
      { id: 'api', name: 'REST API', type: 'custom', description: 'Connect via API', fields: [{ name: 'API Endpoint', type: 'url', required: true }, { name: 'API Key', type: 'api_key', required: true }] },
    ],
  },
];

// Get a template by ID
export function getIndustryTemplate(id: IndustryType): IndustryTemplate {
  return INDUSTRY_TEMPLATES.find(t => t.id === id) || INDUSTRY_TEMPLATES.find(t => t.id === 'custom')!;
}
