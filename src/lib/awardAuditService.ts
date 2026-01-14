/**
 * Award Audit Service
 * Manages audit trails, version history, and compliance alerts
 */

import { format } from 'date-fns';
import {
  AuditEvent,
  AuditEventType,
  RateChangeAlert,
  AlertPriority,
  AlertStatus,
  AwardVersion,
  AwardVersionChange,
  ComplianceCheckResult,
  ComplianceIssue,
  ComplianceWarning,
  HistoricalRateComparison,
} from '@/types/awardAudit';

// In-memory storage for audit events (would be database in production)
let auditEvents: AuditEvent[] = [];
let rateAlerts: RateChangeAlert[] = [];
let awardVersions: AwardVersion[] = [];

// Create an audit event
export function createAuditEvent(
  eventType: AuditEventType,
  entityType: AuditEvent['entityType'],
  entityId: string,
  entityName: string,
  action: AuditEvent['action'],
  changes: AuditEvent['changes'],
  performedBy: string,
  performedByName?: string,
  source: AuditEvent['source'] = 'user',
  reason?: string
): AuditEvent {
  const event: AuditEvent = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    eventType,
    entityType,
    entityId,
    entityName,
    action,
    changes,
    reason,
    performedBy,
    performedByName,
    performedAt: new Date().toISOString(),
    source,
    alertsCreated: [],
  };
  
  auditEvents.push(event);
  
  // Check if this change should trigger an alert
  const alerts = checkForAlertTriggers(event);
  if (alerts.length > 0) {
    event.alertsCreated = alerts.map(a => a.id);
    rateAlerts.push(...alerts);
  }
  
  return event;
}

// Check if an audit event should trigger alerts
function checkForAlertTriggers(event: AuditEvent): RateChangeAlert[] {
  const alerts: RateChangeAlert[] = [];
  
  // Rate override changes
  if (event.eventType === 'rate_override_created' || event.eventType === 'rate_override_updated') {
    alerts.push(createAlert(
      'custom_rate_review',
      'medium',
      `Rate Override ${event.action === 'create' ? 'Created' : 'Updated'}`,
      `A custom rate override has been ${event.action === 'create' ? 'created' : 'updated'} for ${event.entityName}. Please review to ensure compliance with minimum award rates.`,
      event.performedAt,
      event.entityId,
      event.entityName
    ));
  }
  
  // EBA expiry warning
  if (event.eventType === 'eba_expired') {
    alerts.push(createAlert(
      'eba_expiry',
      'high',
      `Enterprise Agreement Expired: ${event.entityName}`,
      `The enterprise agreement "${event.entityName}" has reached its nominal expiry date. Employees will continue under the EBA until a new agreement is made or they revert to the underlying Modern Award.`,
      event.performedAt,
      undefined,
      undefined,
      event.entityId,
      event.entityName
    ));
  }
  
  return alerts;
}

// Create a rate change alert
export function createAlert(
  alertType: RateChangeAlert['alertType'],
  priority: AlertPriority,
  title: string,
  message: string,
  triggerDate: string,
  affectedAwardId?: string,
  affectedAwardName?: string,
  affectedEbaId?: string,
  affectedEbaName?: string,
  affectedStaffIds?: string[],
  actionRequired?: string,
  actionDeadline?: string
): RateChangeAlert {
  const alert: RateChangeAlert = {
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    alertType,
    priority,
    status: 'pending',
    affectedAwardId,
    affectedAwardName,
    affectedEbaId,
    affectedEbaName,
    affectedStaffIds,
    title,
    message,
    actionRequired,
    actionDeadline,
    triggerDate,
    createdAt: new Date().toISOString(),
  };
  
  rateAlerts.push(alert);
  return alert;
}

// Create FWC rate update alert (for annual wage review)
export function createFWCRateUpdateAlert(
  effectiveDate: string,
  increasePercent: number,
  affectedAwards: { id: string; name: string }[]
): RateChangeAlert {
  const affectedAwardIds = affectedAwards.map(a => a.id);
  const affectedAwardNames = affectedAwards.map(a => a.name).join(', ');
  
  return createAlert(
    'upcoming_fwc_change',
    'high',
    `FWC Annual Wage Review - ${increasePercent}% Increase`,
    `The Fair Work Commission has announced a ${increasePercent}% increase to minimum wages effective ${format(new Date(effectiveDate), 'dd MMMM yyyy')}. Affected awards: ${affectedAwardNames}. Please review and update pay rates before the effective date.`,
    effectiveDate,
    affectedAwardIds.length === 1 ? affectedAwardIds[0] : undefined,
    affectedAwardIds.length === 1 ? affectedAwardNames : undefined,
    undefined,
    undefined,
    undefined,
    'Update pay rates in payroll system before effective date',
    effectiveDate
  );
}

// Acknowledge an alert
export function acknowledgeAlert(
  alertId: string,
  acknowledgedBy: string,
  notes?: string
): RateChangeAlert | null {
  const alert = rateAlerts.find(a => a.id === alertId);
  if (!alert) return null;
  
  alert.status = 'acknowledged';
  alert.acknowledgedAt = new Date().toISOString();
  alert.acknowledgedBy = acknowledgedBy;
  if (notes) alert.notes = notes;
  
  return alert;
}

// Action an alert
export function actionAlert(
  alertId: string,
  actionedBy: string,
  notes?: string
): RateChangeAlert | null {
  const alert = rateAlerts.find(a => a.id === alertId);
  if (!alert) return null;
  
  alert.status = 'actioned';
  alert.actionedAt = new Date().toISOString();
  alert.actionedBy = actionedBy;
  if (notes) alert.notes = (alert.notes ? alert.notes + '\n' : '') + notes;
  
  return alert;
}

// Dismiss an alert
export function dismissAlert(
  alertId: string,
  dismissedBy: string,
  reason: string
): RateChangeAlert | null {
  const alert = rateAlerts.find(a => a.id === alertId);
  if (!alert) return null;
  
  alert.status = 'dismissed';
  alert.actionedAt = new Date().toISOString();
  alert.actionedBy = dismissedBy;
  alert.notes = (alert.notes ? alert.notes + '\n' : '') + `Dismissed: ${reason}`;
  
  return alert;
}

// Get all alerts
export function getAlerts(
  status?: AlertStatus,
  priority?: AlertPriority
): RateChangeAlert[] {
  let filtered = [...rateAlerts];
  
  if (status) {
    filtered = filtered.filter(a => a.status === status);
  }
  
  if (priority) {
    filtered = filtered.filter(a => a.priority === priority);
  }
  
  // Sort by priority and date
  const priorityOrder: Record<AlertPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  filtered.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  return filtered;
}

// Get pending alerts count
export function getPendingAlertsCount(): { total: number; critical: number; high: number; medium: number; low: number } {
  const pending = rateAlerts.filter(a => a.status === 'pending');
  return {
    total: pending.length,
    critical: pending.filter(a => a.priority === 'critical').length,
    high: pending.filter(a => a.priority === 'high').length,
    medium: pending.filter(a => a.priority === 'medium').length,
    low: pending.filter(a => a.priority === 'low').length,
  };
}

// Get audit events for an entity
export function getAuditEventsForEntity(
  entityId: string,
  entityType?: AuditEvent['entityType']
): AuditEvent[] {
  let filtered = auditEvents.filter(e => e.entityId === entityId);
  
  if (entityType) {
    filtered = filtered.filter(e => e.entityType === entityType);
  }
  
  return filtered.sort((a, b) => 
    new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
  );
}

// Get all audit events
export function getAuditEvents(
  limit: number = 100,
  offset: number = 0,
  eventType?: AuditEventType,
  source?: AuditEvent['source']
): AuditEvent[] {
  let filtered = [...auditEvents];
  
  if (eventType) {
    filtered = filtered.filter(e => e.eventType === eventType);
  }
  
  if (source) {
    filtered = filtered.filter(e => e.source === source);
  }
  
  // Sort by date descending
  filtered.sort((a, b) => 
    new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
  );
  
  return filtered.slice(offset, offset + limit);
}

// Create award version snapshot
export function createAwardVersionSnapshot(
  awardId: string,
  awardName: string,
  version: string,
  effectiveDate: string,
  fwcReference: string,
  changesSummary: string,
  changes: AwardVersionChange[],
  rateSnapshot: AwardVersion['rateSnapshot'],
  importedBy: string,
  notes?: string
): AwardVersion {
  // Mark previous version as not current
  awardVersions
    .filter(v => v.awardId === awardId && v.isCurrent)
    .forEach(v => { v.isCurrent = false; });
  
  const awardVersion: AwardVersion = {
    id: `av-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    awardId,
    awardName,
    version,
    effectiveDate,
    fwcReference,
    fwcPublicationDate: new Date().toISOString(),
    changesSummary,
    changes,
    rateSnapshot,
    isCurrent: true,
    isArchived: false,
    importedAt: new Date().toISOString(),
    importedBy,
    notes,
  };
  
  awardVersions.push(awardVersion);
  
  // Create audit event
  createAuditEvent(
    'fwc_rate_update',
    'award',
    awardId,
    awardName,
    'update',
    changes.map(c => ({
      field: c.affectedItem,
      oldValue: c.previousValue,
      newValue: c.newValue,
    })),
    importedBy,
    undefined,
    'fwc_sync',
    changesSummary
  );
  
  return awardVersion;
}

// Get award version history
export function getAwardVersionHistory(awardId: string): AwardVersion[] {
  return awardVersions
    .filter(v => v.awardId === awardId)
    .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
}

// Get current award version
export function getCurrentAwardVersion(awardId: string): AwardVersion | undefined {
  return awardVersions.find(v => v.awardId === awardId && v.isCurrent);
}

// Get historical rate comparison
export function getHistoricalRateComparison(
  awardId: string,
  classificationId: string,
  classificationName: string
): HistoricalRateComparison {
  const versions = getAwardVersionHistory(awardId);
  
  const rateHistory: HistoricalRateComparison['rateHistory'] = [];
  
  for (let i = 0; i < versions.length; i++) {
    const version = versions[i];
    const classification = version.rateSnapshot.classifications.find(c => c.code === classificationId);
    
    if (classification) {
      const previousRate = i < versions.length - 1 
        ? versions[i + 1].rateSnapshot.classifications.find(c => c.code === classificationId)?.hourlyRate 
        : undefined;
      
      rateHistory.push({
        effectiveDate: version.effectiveDate,
        hourlyRate: classification.hourlyRate,
        weeklyRate: classification.weeklyRate,
        annualRate: classification.annualRate,
        changeFromPrevious: previousRate ? classification.hourlyRate - previousRate : undefined,
        changePercentFromPrevious: previousRate ? ((classification.hourlyRate - previousRate) / previousRate) * 100 : undefined,
        version: version.version,
      });
    }
  }
  
  // Calculate trend metrics
  let averageAnnualIncrease = 0;
  let compoundAnnualGrowthRate = 0;
  
  if (rateHistory.length >= 2) {
    const increases = rateHistory
      .map(r => r.changePercentFromPrevious)
      .filter((p): p is number => p !== undefined);
    
    if (increases.length > 0) {
      averageAnnualIncrease = increases.reduce((sum, i) => sum + i, 0) / increases.length;
    }
    
    const firstRate = rateHistory[rateHistory.length - 1].hourlyRate;
    const lastRate = rateHistory[0].hourlyRate;
    const years = rateHistory.length - 1;
    
    if (years > 0 && firstRate > 0) {
      compoundAnnualGrowthRate = (Math.pow(lastRate / firstRate, 1 / years) - 1) * 100;
    }
  }
  
  // Project next rate (assuming average increase)
  const projectedNextRate = rateHistory.length > 0 
    ? rateHistory[0].hourlyRate * (1 + averageAnnualIncrease / 100)
    : undefined;
  
  return {
    awardId,
    classificationId,
    classificationName,
    rateHistory,
    averageAnnualIncrease: Math.round(averageAnnualIncrease * 100) / 100,
    compoundAnnualGrowthRate: Math.round(compoundAnnualGrowthRate * 100) / 100,
    projectedNextRate: projectedNextRate ? Math.round(projectedNextRate * 100) / 100 : undefined,
    projectedIncreaseDate: '2025-07-01', // Typical FWC increase date
  };
}

// Run compliance check
export function runComplianceCheck(
  staffId: string,
  currentHourlyRate: number,
  awardId: string,
  classificationId: string,
  customOverrides: { field: string; value: number }[] = []
): ComplianceCheckResult {
  const issues: ComplianceIssue[] = [];
  const warnings: ComplianceWarning[] = [];
  
  // Get current award version
  const currentVersion = getCurrentAwardVersion(awardId);
  if (!currentVersion) {
    issues.push({
      id: `issue-${Date.now()}`,
      severity: 'major',
      category: 'pay_rate',
      title: 'Award Version Not Found',
      description: 'Unable to find current award version for compliance check',
      recommendedAction: 'Ensure award data is up to date',
      status: 'open',
    });
    
    return {
      id: `check-${Date.now()}`,
      checkDate: new Date().toISOString(),
      staffId,
      awardId,
      isCompliant: false,
      issues,
      warnings,
      complianceScore: 0,
      performedBy: 'system',
    };
  }
  
  // Check pay rate against minimum
  const classification = currentVersion.rateSnapshot.classifications.find(c => c.code === classificationId);
  if (classification) {
    if (currentHourlyRate < classification.hourlyRate) {
      const underpayment = classification.hourlyRate - currentHourlyRate;
      issues.push({
        id: `issue-${Date.now()}`,
        severity: 'critical',
        category: 'pay_rate',
        title: 'Rate Below Award Minimum',
        description: `Current rate ($${currentHourlyRate.toFixed(2)}/hr) is below the award minimum ($${classification.hourlyRate.toFixed(2)}/hr)`,
        affectedStaffIds: [staffId],
        estimatedUnderpayment: underpayment * 38 * 52, // Rough annual estimate
        recommendedAction: `Increase hourly rate to at least $${classification.hourlyRate.toFixed(2)}`,
        remediationDeadline: format(new Date(), 'yyyy-MM-dd'),
        status: 'open',
      });
    } else if (currentHourlyRate < classification.hourlyRate * 1.02) {
      warnings.push({
        id: `warn-${Date.now()}`,
        category: 'pay_rate',
        title: 'Rate Close to Minimum',
        description: `Current rate is within 2% of award minimum. Next FWC increase may result in underpayment.`,
        recommendation: 'Consider proactive rate increase before next FWC review',
      });
    }
  }
  
  // Check for rate overrides
  if (customOverrides.length > 0) {
    warnings.push({
      id: `warn-${Date.now()}`,
      category: 'pay_rate',
      title: 'Custom Rate Overrides Active',
      description: `${customOverrides.length} custom rate override(s) are active for this employee`,
      recommendation: 'Review overrides to ensure they meet or exceed award minimums',
    });
  }
  
  // Calculate compliance score
  const baseScore = 100;
  const criticalDeduction = issues.filter(i => i.severity === 'critical').length * 30;
  const majorDeduction = issues.filter(i => i.severity === 'major').length * 15;
  const minorDeduction = issues.filter(i => i.severity === 'minor').length * 5;
  const warningDeduction = warnings.length * 2;
  
  const complianceScore = Math.max(0, baseScore - criticalDeduction - majorDeduction - minorDeduction - warningDeduction);
  
  return {
    id: `check-${Date.now()}`,
    checkDate: new Date().toISOString(),
    staffId,
    awardId,
    isCompliant: issues.filter(i => i.severity === 'critical').length === 0,
    issues,
    warnings,
    complianceScore,
    performedBy: 'system',
  };
}

// Export audit events for reporting
export function exportAuditEventsCSV(
  startDate: string,
  endDate: string
): string {
  const filtered = auditEvents.filter(e => {
    const date = new Date(e.performedAt);
    return date >= new Date(startDate) && date <= new Date(endDate);
  });
  
  const headers = ['Date', 'Event Type', 'Entity Type', 'Entity Name', 'Action', 'Performed By', 'Source', 'Changes'];
  const rows = filtered.map(e => [
    format(new Date(e.performedAt), 'yyyy-MM-dd HH:mm:ss'),
    e.eventType,
    e.entityType,
    e.entityName,
    e.action,
    e.performedByName || e.performedBy,
    e.source,
    e.changes.map(c => `${c.field}: ${c.oldValue} → ${c.newValue}`).join('; '),
  ]);
  
  return [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
}
