// Per-candidate compliance, booking confirmation, and attendance reconciliation
// for the Agency module. Separate from Agency-level ComplianceDocument in agency.ts.

import type { ComplianceStatus } from './agency';

// ============ CANDIDATE-LEVEL COMPLIANCE ============

export type CandidateDocumentType =
  | 'wwcc'                   // Working With Children Check (AU)
  | 'police_check'           // National Police Check
  | 'ndis_screening'         // NDIS Worker Screening (AU)
  | 'visa_work_rights'       // Visa / Right to Work
  | 'immunisation'           // Immunisation record
  | 'first_aid'              // First Aid certificate
  | 'cpr'                    // CPR
  | 'qualification'          // Cert III / Diploma / Degree
  | 'drivers_licence'
  | 'identity'               // Passport / Drivers licence ID copy
  | 'anti_modern_slavery'    // Declaration
  | 'reference'
  | 'other';

export const candidateDocumentTypeLabels: Record<CandidateDocumentType, string> = {
  wwcc: 'Working With Children Check',
  police_check: 'National Police Check',
  ndis_screening: 'NDIS Worker Screening',
  visa_work_rights: 'Visa / Work Rights',
  immunisation: 'Immunisation Record',
  first_aid: 'First Aid Certificate',
  cpr: 'CPR Certificate',
  qualification: 'Qualification',
  drivers_licence: "Driver's Licence",
  identity: 'Identity Document',
  anti_modern_slavery: 'Anti-Modern-Slavery Declaration',
  reference: 'Reference',
  other: 'Other Document',
};

export interface CandidateComplianceDocument {
  id: string;
  candidateId: string;
  type: CandidateDocumentType;
  name: string;
  documentNumber?: string;
  jurisdiction?: string;                // e.g. "NSW", "VIC"
  issueDate: string;                    // ISO date
  expiryDate?: string;                  // optional for documents that don't expire
  status: ComplianceStatus;
  // File storage (metadata only — file is held by storage adapter)
  fileName?: string;
  fileSize?: number;                    // bytes
  fileMimeType?: string;
  fileUrl?: string;                     // signed URL or storage path
  uploadedAt: string;
  uploadedBy?: string;
  // Verification
  verifiedAt?: string;
  verifiedBy?: string;
  verificationNotes?: string;
  // Alerting
  lastAlertSentAt?: string;
  alertsSent: number;
}

export interface CandidateComplianceSummary {
  candidateId: string;
  complianceScore: number;              // 0-100
  totalDocuments: number;
  validCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  missingRequired: CandidateDocumentType[];
  nextExpiryDate?: string;
  nextExpiryType?: CandidateDocumentType;
  isFullyCompliant: boolean;
}

// Required-doc policy (per role) — used to compute "missing"
export interface RequiredDocumentPolicy {
  roleId: string;
  roleName: string;
  required: CandidateDocumentType[];
  industry?: string;
}

// Expiry alert config
export interface ComplianceAlertConfig {
  daysBeforeExpiryWarn: number;         // default 30
  daysBeforeExpiryCritical: number;     // default 7
  notifyAgencyAdmin: boolean;
  notifyCandidate: boolean;
  notifyClientCentre: boolean;
}

// ============ BOOKING CONFIRMATION (centre-side accept/reject) ============

export type BookingConfirmationStatus =
  | 'awaiting_centre'      // submission sent, centre must respond
  | 'preview_scheduled'    // optional interview/preview booked
  | 'confirmed'            // centre accepted -> placement created
  | 'rejected'             // centre rejected -> back to agency
  | 'auto_confirmed'       // reverse SLA expired
  | 'auto_rejected'        // optional opposite policy
  | 'withdrawn'            // agency withdrew the candidate
  | 'expired';             // hard deadline passed

export interface BookingConfirmation {
  id: string;
  submissionId: string;                 // -> CandidateSubmission.id
  shiftRequestId: string;
  candidateId: string;
  candidateName: string;
  agencyId: string;
  agencyName: string;
  centreId: string;
  centreName: string;
  roleName?: string;
  shiftDate: string;
  shiftStartTime: string;
  shiftEndTime: string;

  // Reverse SLA - centre must respond within X minutes
  submittedAt: string;
  responseDeadline: string;             // ISO timestamp
  responseSlaMinutes: number;
  autoConfirmOnExpiry: boolean;         // true = auto-confirm, false = auto-reject

  // Decision
  status: BookingConfirmationStatus;
  decidedAt?: string;
  decidedBy?: string;
  rejectionReason?: string;
  rejectionCategory?: 'experience' | 'compliance' | 'rate' | 'availability' | 'fit' | 'other';

  // Optional preview / interview
  previewScheduledAt?: string;
  previewMode?: 'phone' | 'video' | 'in_person';
  previewNotes?: string;

  // Notifications
  remindersSent: number;
  lastReminderAt?: string;
}

export interface BookingConfirmationSettings {
  defaultResponseSlaMinutes: number;    // e.g. 60
  urgentResponseSlaMinutes: number;     // e.g. 30
  criticalResponseSlaMinutes: number;   // e.g. 15
  autoConfirmOnExpiry: boolean;
  reminderIntervalsMinutes: number[];   // [30, 10] = remind at 30m and 10m before deadline
  allowPreviewBooking: boolean;
}

// ============ CHECK-IN / ATTENDANCE RECONCILIATION ============

export type ClockMethod = 'qr_code' | 'geofence' | 'pin' | 'kiosk' | 'manual' | 'supervisor';

export type ClockEventType = 'clock_in' | 'clock_out' | 'break_start' | 'break_end';

export interface ClockEvent {
  id: string;
  placementId: string;
  candidateId: string;
  type: ClockEventType;
  timestamp: string;
  method: ClockMethod;
  geoLocation?: { lat: number; lng: number; accuracyMeters?: number };
  geofenceMatched?: boolean;            // false = clocked outside the venue
  deviceId?: string;
  ipAddress?: string;
  recordedBy?: string;                  // supervisor name if method = supervisor
  notes?: string;
  isManualOverride: boolean;
}

export type DiscrepancyType =
  | 'late_start'
  | 'early_finish'
  | 'late_finish'
  | 'early_start'
  | 'no_show'
  | 'partial_shift'
  | 'outside_geofence'
  | 'missing_clock_out'
  | 'over_break';

export type ReconciliationStatus =
  | 'pending'              // discrepancies need review
  | 'auto_matched'         // within tolerance, auto-approved
  | 'supervisor_approved'  // discrepancy explained & approved
  | 'disputed'             // candidate disagrees
  | 'rejected'             // rejected, no pay
  | 'pushed_to_timesheet'; // a timesheet entry exists

export interface AttendanceReconciliation {
  id: string;
  placementId: string;
  candidateId: string;
  candidateName: string;
  shiftRequestId: string;
  centreId: string;
  centreName: string;
  shiftDate: string;

  scheduledStart: string;
  scheduledEnd: string;
  scheduledBreakMinutes: number;

  actualStart?: string;
  actualEnd?: string;
  actualBreakMinutes: number;

  // Computed deltas
  startDeltaMinutes: number;            // +ve = late
  endDeltaMinutes: number;              // +ve = ran over
  hoursWorked: number;
  hoursBooked: number;
  hoursPayable: number;                 // after reconciliation

  discrepancies: DiscrepancyType[];
  status: ReconciliationStatus;

  clockEvents: ClockEvent[];

  // Approval
  approvedAt?: string;
  approvedBy?: string;
  approvalNotes?: string;

  // Timesheet bridge
  timesheetEntryId?: string;
  timesheetPushedAt?: string;
}

export interface AttendanceReconciliationSettings {
  toleranceMinutesEarlyStart: number;   // e.g. 5
  toleranceMinutesLateStart: number;    // e.g. 5
  toleranceMinutesEarlyFinish: number;  // e.g. 5
  toleranceMinutesLateFinish: number;   // e.g. 15 (overtime threshold)
  autoMatchWithinTolerance: boolean;
  requireGeofenceMatch: boolean;
  geofenceRadiusMeters: number;
  allowedClockMethods: ClockMethod[];
  pinCodeRequired: boolean;
  autoPushToTimesheetOnApproval: boolean;
}
