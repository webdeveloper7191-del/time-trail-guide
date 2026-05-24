// Candidate Compliance Service
// Per-candidate document tracking with expiry computation, alerting, and policy checks.

import {
  CandidateComplianceDocument,
  CandidateComplianceSummary,
  CandidateDocumentType,
  ComplianceAlertConfig,
  RequiredDocumentPolicy,
} from '@/types/agencyCompliance';
import type { ComplianceStatus } from '@/types/agency';

export const DEFAULT_ALERT_CONFIG: ComplianceAlertConfig = {
  daysBeforeExpiryWarn: 30,
  daysBeforeExpiryCritical: 7,
  notifyAgencyAdmin: true,
  notifyCandidate: true,
  notifyClientCentre: false,
};

// Sensible default per-role required docs for AU childcare; extendable.
export const DEFAULT_REQUIRED_DOCS_BY_ROLE: RequiredDocumentPolicy[] = [
  {
    roleId: 'ece',
    roleName: 'Early Childhood Educator',
    industry: 'childcare',
    required: ['wwcc', 'police_check', 'first_aid', 'cpr', 'qualification', 'visa_work_rights', 'immunisation'],
  },
  {
    roleId: 'lead-educator',
    roleName: 'Lead Educator',
    industry: 'childcare',
    required: ['wwcc', 'police_check', 'first_aid', 'cpr', 'qualification', 'visa_work_rights', 'immunisation'],
  },
  {
    roleId: 'disability-support',
    roleName: 'Disability Support Worker',
    industry: 'ndis',
    required: ['ndis_screening', 'police_check', 'first_aid', 'cpr', 'visa_work_rights'],
  },
  {
    roleId: 'aged-care',
    roleName: 'Aged Care Worker',
    industry: 'aged_care',
    required: ['police_check', 'first_aid', 'cpr', 'immunisation', 'visa_work_rights'],
  },
];

export function computeDocumentStatus(
  doc: Pick<CandidateComplianceDocument, 'expiryDate'>,
  cfg: ComplianceAlertConfig = DEFAULT_ALERT_CONFIG,
): ComplianceStatus {
  if (!doc.expiryDate) return 'valid';
  const now = Date.now();
  const exp = new Date(doc.expiryDate).getTime();
  const daysToExpiry = Math.floor((exp - now) / (1000 * 60 * 60 * 24));
  if (daysToExpiry < 0) return 'expired';
  if (daysToExpiry <= cfg.daysBeforeExpiryWarn) return 'expiring_soon';
  return 'valid';
}

export function computeCandidateComplianceSummary(
  candidateId: string,
  docs: CandidateComplianceDocument[],
  requiredTypes: CandidateDocumentType[] = [],
  cfg: ComplianceAlertConfig = DEFAULT_ALERT_CONFIG,
): CandidateComplianceSummary {
  const myDocs = docs.filter(d => d.candidateId === candidateId);
  const refreshed = myDocs.map(d => ({ ...d, status: computeDocumentStatus(d, cfg) }));

  const validCount = refreshed.filter(d => d.status === 'valid').length;
  const expiringSoonCount = refreshed.filter(d => d.status === 'expiring_soon').length;
  const expiredCount = refreshed.filter(d => d.status === 'expired').length;
  const presentTypes = new Set(refreshed.map(d => d.type));
  const missingRequired = requiredTypes.filter(t => !presentTypes.has(t));

  const futureExpiries = refreshed
    .filter(d => d.expiryDate)
    .map(d => ({ type: d.type, ts: new Date(d.expiryDate!).getTime() }))
    .sort((a, b) => a.ts - b.ts);
  const next = futureExpiries[0];

  // Compliance score: weighted by required + valid ratio
  const totalRequiredMet = requiredTypes.length - missingRequired.length;
  const requiredScore = requiredTypes.length === 0 ? 100 : (totalRequiredMet / requiredTypes.length) * 70;
  const docHealth = refreshed.length === 0 ? 0 : (validCount / refreshed.length) * 30;
  const complianceScore = Math.max(0, Math.min(100, Math.round(requiredScore + docHealth)));

  return {
    candidateId,
    complianceScore,
    totalDocuments: refreshed.length,
    validCount,
    expiringSoonCount,
    expiredCount,
    missingRequired,
    nextExpiryDate: next ? new Date(next.ts).toISOString() : undefined,
    nextExpiryType: next?.type,
    isFullyCompliant: missingRequired.length === 0 && expiredCount === 0,
  };
}

export function getExpiringDocuments(
  docs: CandidateComplianceDocument[],
  cfg: ComplianceAlertConfig = DEFAULT_ALERT_CONFIG,
): CandidateComplianceDocument[] {
  return docs
    .map(d => ({ ...d, status: computeDocumentStatus(d, cfg) }))
    .filter(d => d.status === 'expiring_soon' || d.status === 'expired')
    .sort((a, b) => {
      const ax = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
      const bx = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
      return ax - bx;
    });
}

export function shouldSendExpiryAlert(
  doc: CandidateComplianceDocument,
  cfg: ComplianceAlertConfig = DEFAULT_ALERT_CONFIG,
): { send: boolean; severity: 'warning' | 'critical' | null } {
  if (!doc.expiryDate) return { send: false, severity: null };
  const daysToExpiry = Math.floor(
    (new Date(doc.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (daysToExpiry < 0) return { send: true, severity: 'critical' };
  if (daysToExpiry <= cfg.daysBeforeExpiryCritical) return { send: true, severity: 'critical' };
  if (daysToExpiry <= cfg.daysBeforeExpiryWarn) return { send: true, severity: 'warning' };
  return { send: false, severity: null };
}

export function formatExpiryRelative(expiryDate?: string): string {
  if (!expiryDate) return 'No expiry';
  const days = Math.floor((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return 'Expires today';
  if (days < 30) return `Expires in ${days}d`;
  if (days < 365) return `Expires in ${Math.round(days / 30)}mo`;
  return `Expires in ${Math.round(days / 365)}y`;
}

// Mock dataset
export function generateMockCandidateComplianceDocs(): CandidateComplianceDocument[] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const mk = (
    id: string,
    candidateId: string,
    type: CandidateDocumentType,
    name: string,
    daysToExpiry: number | null,
    extra: Partial<CandidateComplianceDocument> = {},
  ): CandidateComplianceDocument => ({
    id,
    candidateId,
    type,
    name,
    issueDate: new Date(now - 365 * day).toISOString(),
    expiryDate: daysToExpiry === null ? undefined : new Date(now + daysToExpiry * day).toISOString(),
    status: 'valid',
    uploadedAt: new Date(now - 30 * day).toISOString(),
    alertsSent: 0,
    fileName: `${type}-${candidateId}.pdf`,
    fileSize: 240_000,
    fileMimeType: 'application/pdf',
    ...extra,
  });

  const docs: CandidateComplianceDocument[] = [
    mk('cdoc-1', 'cand-1', 'wwcc', 'WWCC NSW', 180, { documentNumber: 'WWC1234567E', jurisdiction: 'NSW', verifiedAt: new Date(now - 25 * day).toISOString(), verifiedBy: 'A. Patel' }),
    mk('cdoc-2', 'cand-1', 'police_check', 'National Police Check', 22, { verifiedAt: new Date(now - 20 * day).toISOString() }),
    mk('cdoc-3', 'cand-1', 'first_aid', 'HLTAID011 First Aid', 90),
    mk('cdoc-4', 'cand-1', 'cpr', 'HLTAID009 CPR', 4),
    mk('cdoc-5', 'cand-1', 'qualification', 'Cert III in Early Childhood', null),
    mk('cdoc-6', 'cand-1', 'visa_work_rights', 'Australian Citizen', null, { verifiedAt: new Date(now - 60 * day).toISOString() }),
    mk('cdoc-7', 'cand-1', 'immunisation', 'Immunisation Record', 365),

    mk('cdoc-8', 'cand-2', 'wwcc', 'WWCC VIC', -3, { documentNumber: 'WWC9876543E', jurisdiction: 'VIC' }),
    mk('cdoc-9', 'cand-2', 'police_check', 'National Police Check', 120),
    mk('cdoc-10', 'cand-2', 'first_aid', 'HLTAID011 First Aid', 250),
    mk('cdoc-11', 'cand-2', 'qualification', 'Diploma of Early Childhood', null),

    mk('cdoc-12', 'cand-3', 'wwcc', 'WWCC QLD', 60, { documentNumber: 'WWC5550101E', jurisdiction: 'QLD' }),
    mk('cdoc-13', 'cand-3', 'ndis_screening', 'NDIS Worker Screening', 280),
    mk('cdoc-14', 'cand-3', 'police_check', 'National Police Check', 200),
    mk('cdoc-15', 'cand-3', 'cpr', 'HLTAID009 CPR', 14),
    mk('cdoc-16', 'cand-3', 'first_aid', 'HLTAID011 First Aid', 200),

    mk('cdoc-17', 'cand-4', 'visa_work_rights', 'Working Holiday Visa 417', 45, { verifiedAt: new Date(now - 10 * day).toISOString() }),
    mk('cdoc-18', 'cand-4', 'wwcc', 'WWCC NSW', 300),
    mk('cdoc-19', 'cand-4', 'police_check', 'National Police Check', 365),

    mk('cdoc-20', 'cand-5', 'anti_modern_slavery', 'Anti-Modern-Slavery Declaration', null, { verifiedAt: new Date(now - 5 * day).toISOString() }),
    mk('cdoc-21', 'cand-5', 'wwcc', 'WWCC NSW', 500),
    mk('cdoc-22', 'cand-5', 'first_aid', 'HLTAID011 First Aid', 25),
  ];

  // refresh statuses
  return docs.map(d => ({ ...d, status: computeDocumentStatus(d) }));
}

// Simulated upload (in a real app this would call storage/edge function)
export async function uploadComplianceDocument(
  candidateId: string,
  file: File,
  meta: Omit<Partial<CandidateComplianceDocument>, 'id' | 'candidateId' | 'uploadedAt' | 'alertsSent'> & {
    type: CandidateDocumentType;
    name: string;
  },
): Promise<CandidateComplianceDocument> {
  // Pretend network
  await new Promise(r => setTimeout(r, 400));
  const doc: CandidateComplianceDocument = {
    id: `cdoc-${Date.now()}`,
    candidateId,
    type: meta.type,
    name: meta.name,
    documentNumber: meta.documentNumber,
    jurisdiction: meta.jurisdiction,
    issueDate: meta.issueDate ?? new Date().toISOString(),
    expiryDate: meta.expiryDate,
    status: 'valid',
    fileName: file.name,
    fileSize: file.size,
    fileMimeType: file.type,
    fileUrl: URL.createObjectURL(file),
    uploadedAt: new Date().toISOString(),
    uploadedBy: meta.uploadedBy,
    alertsSent: 0,
  };
  doc.status = computeDocumentStatus(doc);
  return doc;
}
