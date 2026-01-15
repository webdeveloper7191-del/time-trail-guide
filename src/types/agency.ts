// Agency Portal Types

// ============ ENUMS & CONSTANTS ============

export type AgencyStatus = 'pending' | 'active' | 'suspended' | 'inactive';
export type ComplianceStatus = 'valid' | 'expiring_soon' | 'expired' | 'missing';
export type CandidateStatus = 'available' | 'on_shift' | 'unavailable' | 'inactive';
export type ShiftRequestStatus = 'open' | 'filled' | 'partially_filled' | 'cancelled' | 'expired';
export type ShiftUrgency = 'standard' | 'urgent' | 'critical';
export type PlacementStatus = 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'no_show' | 'cancelled';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'disputed';
export type FillMode = 'express' | 'managed';

export const agencyStatusLabels: Record<AgencyStatus, string> = {
  pending: 'Pending Approval',
  active: 'Active',
  suspended: 'Suspended',
  inactive: 'Inactive',
};

export const complianceStatusLabels: Record<ComplianceStatus, string> = {
  valid: 'Valid',
  expiring_soon: 'Expiring Soon',
  expired: 'Expired',
  missing: 'Missing',
};

export const shiftUrgencyLabels: Record<ShiftUrgency, string> = {
  standard: 'Standard',
  urgent: 'Urgent',
  critical: 'Critical',
};

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
  disputed: 'Disputed',
};

// ============ AGENCY PROFILE & COMPLIANCE ============

export interface ComplianceDocument {
  id: string;
  type: 'abn' | 'insurance' | 'licence' | 'certification' | 'policy' | 'other';
  name: string;
  documentNumber?: string;
  issueDate: string;
  expiryDate: string;
  status: ComplianceStatus;
  fileUrl?: string;
  uploadedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  roles: string[];
  isActive: boolean;
}

export interface CoverageZone {
  id: string;
  name: string;
  postcodes: string[];
  responseSlaMinutes: number;
  isActive: boolean;
}

export interface RateCard {
  id: string;
  roleId: string;
  roleName: string;
  baseRate: number;
  casualLoading: number;
  weekendRate: number;
  publicHolidayRate: number;
  overtimeRate: number;
  nightShiftRate: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface Agency {
  id: string;
  name: string;
  tradingName?: string;
  abn: string;
  acn?: string;
  status: AgencyStatus;
  
  // Contact details
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  address: {
    street: string;
    suburb: string;
    state: string;
    postcode: string;
  };
  
  // Business details
  serviceCategories: ServiceCategory[];
  coverageZones: CoverageZone[];
  rateCards: RateCard[];
  
  // Compliance
  complianceDocuments: ComplianceDocument[];
  complianceScore: number; // 0-100
  
  // Awards & Classifications
  applicableAwards: string[];
  
  // Metrics
  fillRate: number; // percentage
  avgTimeToFill: number; // minutes
  reliabilityScore: number; // 0-100
  
  // Timestamps
  onboardedAt: string;
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
}

// ============ CANDIDATE & TALENT POOL ============

export interface CandidateSkill {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsExperience: number;
  verifiedAt?: string;
}

export interface CandidateCertification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  status: ComplianceStatus;
  documentUrl?: string;
}

export interface CandidateAvailability {
  dayOfWeek: number; // 0-6, Sunday = 0
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isAvailable: boolean;
}

export interface Candidate {
  id: string;
  agencyId: string;
  
  // Personal details
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImageUrl?: string;
  
  // Employment
  employmentType: 'casual' | 'temp' | 'temp_to_perm' | 'contractor';
  status: CandidateStatus;
  
  // Skills & experience
  primaryRole: string;
  secondaryRoles: string[];
  skills: CandidateSkill[];
  certifications: CandidateCertification[];
  yearsExperience: number;
  
  // Award classification
  awardClassification: string;
  payRate: number;
  
  // Availability
  availability: CandidateAvailability[];
  preferredLocations: string[];
  maxTravelDistance: number; // km
  
  // Scores & metrics
  complianceScore: number; // 0-100
  reliabilityScore: number; // based on attendance
  averageRating: number; // 0-5
  totalShiftsCompleted: number;
  noShowCount: number;
  
  // Fatigue tracking
  hoursWorkedThisWeek: number;
  lastShiftEndTime?: string;
  
  // Timestamps
  joinedAt: string;
  lastActiveAt: string;
}

// ============ SHIFT INTAKE & PLACEMENT ============

export interface ShiftRequirement {
  roleId: string;
  roleName: string;
  quantity: number;
  filledCount: number;
  skills: string[];
  certifications: string[];
  minExperience?: number;
}

export interface ShiftRequest {
  id: string;
  clientId: string;
  clientName: string;
  locationName: string;
  locationAddress: string;
  
  // Shift details
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  
  // Requirements
  requirements: ShiftRequirement[];
  totalPositions: number;
  filledPositions: number;
  
  // Status & urgency
  status: ShiftRequestStatus;
  urgency: ShiftUrgency;
  fillMode: FillMode;
  slaDeadline: string; // ISO timestamp
  
  // Rates
  payRate: number;
  chargeRate: number;
  
  // Notes
  instructions?: string;
  dresscode?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface CandidateMatch {
  candidateId: string;
  candidate: Candidate;
  matchScore: number; // 0-100
  skillMatch: number;
  proximityMatch: number;
  availabilityMatch: number;
  reliabilityScore: number;
  isEligible: boolean;
  ineligibilityReasons?: string[];
}

export interface Placement {
  id: string;
  shiftRequestId: string;
  candidateId: string;
  candidate: Candidate;
  
  // Assignment
  assignedBy: string;
  assignedAt: string;
  status: PlacementStatus;
  
  // Time tracking
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  breakMinutes: number;
  
  // Backup
  isBackup: boolean;
  backupPriority?: number;
  
  // Verification
  clockedInAt?: string;
  clockedOutAt?: string;
  geoLocationClockIn?: { lat: number; lng: number };
  supervisorApproval?: {
    approvedBy: string;
    approvedAt: string;
    notes?: string;
  };
  
  // Post-shift
  clientRating?: number;
  clientFeedback?: string;
  incidentReports?: string[];
}

// ============ BILLING & INVOICING ============

export interface InvoiceLineItem {
  id: string;
  description: string;
  placementId?: string;
  candidateName?: string;
  shiftDate?: string;
  hours: number;
  rate: number;
  subtotal: number;
  
  // Adjustments
  loadings: {
    type: string;
    percentage: number;
    amount: number;
  }[];
  
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  agencyId: string;
  clientId: string;
  clientName: string;
  
  // Period
  periodStart: string;
  periodEnd: string;
  
  // Amounts
  lineItems: InvoiceLineItem[];
  subtotal: number;
  gst: number;
  total: number;
  
  // Margin
  totalCost: number; // what agency pays workers
  grossMargin: number;
  marginPercentage: number;
  
  // Status
  status: InvoiceStatus;
  dueDate: string;
  paidAt?: string;
  
  // Timestamps
  createdAt: string;
  sentAt?: string;
  updatedAt: string;
}

// ============ AGENCY ANALYTICS ============

export interface AgencyAnalytics {
  // Fill rates
  totalShiftsRequested: number;
  totalShiftsFilled: number;
  fillRate: number;
  avgTimeToFillMinutes: number;
  
  // Revenue
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  marginPercentage: number;
  
  // Worker metrics
  totalActiveCandidates: number;
  avgWorkerUtilization: number;
  topPerformers: { candidateId: string; name: string; shiftsCompleted: number }[];
  
  // Client metrics
  totalActiveClients: number;
  topClients: { clientId: string; name: string; revenue: number }[];
  
  // Compliance
  complianceAlerts: number;
  expiringDocuments: number;
}

// ============ FILTERS ============

export interface CandidateFilters {
  search?: string;
  status?: CandidateStatus;
  roles?: string[];
  skills?: string[];
  availableOn?: string;
  minRating?: number;
  complianceStatus?: ComplianceStatus;
}

export interface ShiftRequestFilters {
  search?: string;
  status?: ShiftRequestStatus;
  urgency?: ShiftUrgency;
  dateFrom?: string;
  dateTo?: string;
  clientId?: string;
  roleId?: string;
}

export interface InvoiceFilters {
  search?: string;
  status?: InvoiceStatus;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
}
