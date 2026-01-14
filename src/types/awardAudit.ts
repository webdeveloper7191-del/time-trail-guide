/**
 * Award Audit Trail and Compliance Types
 * Covers version history, rate change alerts, and audit logging
 */

// Audit event types
export type AuditEventType = 
  | 'rate_override_created'
  | 'rate_override_updated'
  | 'rate_override_deleted'
  | 'award_enabled'
  | 'award_disabled'
  | 'classification_changed'
  | 'allowance_modified'
  | 'penalty_rate_changed'
  | 'leave_entitlement_changed'
  | 'eba_created'
  | 'eba_updated'
  | 'eba_expired'
  | 'fwc_rate_update'
  | 'system_rate_sync';

// Alert priority
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

// Alert status
export type AlertStatus = 'pending' | 'acknowledged' | 'actioned' | 'dismissed';

// Award version record
export interface AwardVersion {
  id: string;
  awardId: string;
  awardName: string;
  
  // Version info
  version: string;                // e.g., "2024-07"
  effectiveDate: string;
  expiryDate?: string;
  
  // FWC reference
  fwcReference?: string;
  fwcPublicationDate?: string;
  
  // Changes from previous version
  changesSummary: string;
  changes: AwardVersionChange[];
  
  // Full rate snapshot
  rateSnapshot: {
    classifications: {
      code: string;
      name: string;
      hourlyRate: number;
      weeklyRate: number;
      annualRate: number;
    }[];
    allowances: {
      code: string;
      name: string;
      amount: number;
      frequency: string;
    }[];
    penalties: {
      type: string;
      multiplier: number;
    }[];
    casualLoading: number;
    superannuationRate: number;
  };
  
  // Status
  isCurrent: boolean;
  isArchived: boolean;
  
  // Audit
  importedAt: string;
  importedBy: string;
  notes?: string;
}

// Individual change within a version
export interface AwardVersionChange {
  id: string;
  changeType: 'rate_increase' | 'allowance_change' | 'penalty_change' | 'new_entitlement' | 'removed_entitlement' | 'structural';
  
  // What changed
  affectedItem: string;           // e.g., "Level 3.1 Base Rate"
  affectedItemId?: string;
  
  // Values
  previousValue?: number | string;
  newValue?: number | string;
  
  // Calculated impact
  changePercent?: number;
  
  // Description
  description: string;
}

// Rate change alert
export interface RateChangeAlert {
  id: string;
  
  // Alert type
  alertType: 'upcoming_fwc_change' | 'eba_expiry' | 'rate_below_award' | 'compliance_issue' | 'custom_rate_review';
  priority: AlertPriority;
  status: AlertStatus;
  
  // What it affects
  affectedAwardId?: string;
  affectedAwardName?: string;
  affectedEbaId?: string;
  affectedEbaName?: string;
  affectedStaffIds?: string[];
  
  // Alert details
  title: string;
  message: string;
  details?: string;
  
  // Action required
  actionRequired?: string;
  actionDeadline?: string;
  
  // Dates
  triggerDate: string;           // When the change takes effect
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  actionedAt?: string;
  actionedBy?: string;
  
  // Related data
  relatedVersionId?: string;
  relatedAuditEventId?: string;
  
  // Notes
  notes?: string;
}

// Audit event record
export interface AuditEvent {
  id: string;
  eventType: AuditEventType;
  
  // What was affected
  entityType: 'award' | 'eba' | 'classification' | 'allowance' | 'penalty' | 'leave' | 'staff';
  entityId: string;
  entityName: string;
  
  // What changed
  action: 'create' | 'update' | 'delete' | 'enable' | 'disable' | 'sync';
  
  // Change details
  changes: {
    field: string;
    oldValue?: any;
    newValue?: any;
  }[];
  
  // Context
  reason?: string;
  
  // Who made the change
  performedBy: string;
  performedByName?: string;
  performedAt: string;
  
  // Source
  source: 'user' | 'system' | 'fwc_sync' | 'import';
  
  // Related alerts created
  alertsCreated?: string[];
}

// Compliance check result
export interface ComplianceCheckResult {
  id: string;
  checkDate: string;
  
  // Scope
  staffId?: string;
  awardId?: string;
  ebaId?: string;
  
  // Results
  isCompliant: boolean;
  issues: ComplianceIssue[];
  warnings: ComplianceWarning[];
  
  // Score
  complianceScore: number;       // 0-100
  
  // Performed by
  performedBy: string;
  
  // Notes
  notes?: string;
}

// Compliance issue
export interface ComplianceIssue {
  id: string;
  severity: 'critical' | 'major' | 'minor';
  category: 'pay_rate' | 'allowance' | 'leave' | 'penalty' | 'super' | 'classification';
  
  // Issue details
  title: string;
  description: string;
  
  // Affected items
  affectedStaffIds?: string[];
  affectedPayPeriods?: string[];
  
  // Potential underpayment
  estimatedUnderpayment?: number;
  
  // Remediation
  recommendedAction: string;
  remediationDeadline?: string;
  
  // Status
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
}

// Compliance warning
export interface ComplianceWarning {
  id: string;
  category: string;
  title: string;
  description: string;
  recommendation: string;
}

// Historical rate comparison
export interface HistoricalRateComparison {
  awardId: string;
  classificationId: string;
  classificationName: string;
  
  // Rate history
  rateHistory: {
    effectiveDate: string;
    hourlyRate: number;
    weeklyRate: number;
    annualRate: number;
    changeFromPrevious?: number;
    changePercentFromPrevious?: number;
    version: string;
  }[];
  
  // Trend analysis
  averageAnnualIncrease: number;
  compoundAnnualGrowthRate: number;
  
  // Projection (next FWC increase)
  projectedNextRate?: number;
  projectedIncreaseDate?: string;
}

// Xero sync status
export interface XeroSyncStatus {
  id: string;
  lastSyncAt: string;
  lastSyncStatus: 'success' | 'partial' | 'failed';
  
  // What was synced
  employeesSynced: number;
  leaveBalancesSynced: number;
  payItemsSynced: number;
  
  // Errors
  errors: {
    entityType: string;
    entityId: string;
    error: string;
  }[];
  
  // Next scheduled sync
  nextScheduledSync?: string;
}

// Audit event type labels
export const auditEventTypeLabels: Record<AuditEventType, string> = {
  rate_override_created: 'Rate Override Created',
  rate_override_updated: 'Rate Override Updated',
  rate_override_deleted: 'Rate Override Deleted',
  award_enabled: 'Award Enabled',
  award_disabled: 'Award Disabled',
  classification_changed: 'Classification Changed',
  allowance_modified: 'Allowance Modified',
  penalty_rate_changed: 'Penalty Rate Changed',
  leave_entitlement_changed: 'Leave Entitlement Changed',
  eba_created: 'Enterprise Agreement Created',
  eba_updated: 'Enterprise Agreement Updated',
  eba_expired: 'Enterprise Agreement Expired',
  fwc_rate_update: 'FWC Rate Update Applied',
  system_rate_sync: 'System Rate Synchronization',
};

// Alert priority labels
export const alertPriorityLabels: Record<AlertPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

// Alert status labels
export const alertStatusLabels: Record<AlertStatus, string> = {
  pending: 'Pending',
  acknowledged: 'Acknowledged',
  actioned: 'Actioned',
  dismissed: 'Dismissed',
};
