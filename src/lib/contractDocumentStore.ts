/**
 * Contract & document signing store (mock, in-memory with subscribers).
 *
 * Covers the two workflows the business needs everywhere a contract exists:
 *  1. Send a contract/document out for e-signature.
 *  2. Upload a contract that was signed offline (wet-ink / emailed PDF).
 */

export type ContractDocumentStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'signed'
  | 'declined'
  | 'expired'
  | 'uploaded';

export type ContractDocumentType =
  | 'employment_contract'
  | 'pay_variation'
  | 'policy'
  | 'agreement'
  | 'other';

export interface ContractSignatory {
  name: string;
  email: string;
  role: 'employee' | 'manager' | 'witness';
  signedAt?: string;
}

export interface ContractDocument {
  id: string;
  staffId: string;
  staffName: string;
  title: string;
  type: ContractDocumentType;
  status: ContractDocumentStatus;
  createdAt: string;
  sentAt?: string;
  viewedAt?: string;
  completedAt?: string;
  dueDate?: string;
  effectiveDate?: string;
  signatories: ContractSignatory[];
  message?: string;
  /** Set when the signed copy was uploaded rather than e-signed. */
  fileName?: string;
  fileSize?: number;
  source: 'e-signature' | 'upload';
  history: { at: string; label: string; by?: string }[];
}

export const contractDocumentTypeLabels: Record<ContractDocumentType, string> = {
  employment_contract: 'Employment contract',
  pay_variation: 'Pay variation letter',
  policy: 'Policy acknowledgement',
  agreement: 'Agreement',
  other: 'Other document',
};

export const contractStatusLabels: Record<ContractDocumentStatus, string> = {
  draft: 'Draft',
  sent: 'Awaiting signature',
  viewed: 'Viewed',
  signed: 'Signed',
  declined: 'Declined',
  expired: 'Expired',
  uploaded: 'Signed (uploaded)',
};

const iso = (d: Date) => d.toISOString();
const daysAgo = (n: number) => iso(new Date(Date.now() - n * 86400000));
const daysAhead = (n: number) => iso(new Date(Date.now() + n * 86400000));

let documents: ContractDocument[] = [
  {
    id: 'doc-001',
    staffId: '1',
    staffName: 'Sarah Chen',
    title: 'Employment Contract — Operations Coordinator',
    type: 'employment_contract',
    status: 'signed',
    createdAt: daysAgo(120),
    sentAt: daysAgo(119),
    viewedAt: daysAgo(119),
    completedAt: daysAgo(118),
    effectiveDate: daysAgo(115),
    signatories: [
      { name: 'Sarah Chen', email: 'sarah.chen@company.com', role: 'employee', signedAt: daysAgo(118) },
      { name: 'Priya Nair', email: 'priya.nair@company.com', role: 'manager', signedAt: daysAgo(118) },
    ],
    source: 'e-signature',
    history: [
      { at: daysAgo(119), label: 'Sent for signature', by: 'Priya Nair' },
      { at: daysAgo(118), label: 'Signed by all parties' },
    ],
  },
  {
    id: 'doc-002',
    staffId: '1',
    staffName: 'Sarah Chen',
    title: 'Pay Variation Letter — Level 3.2',
    type: 'pay_variation',
    status: 'sent',
    createdAt: daysAgo(3),
    sentAt: daysAgo(2),
    dueDate: daysAhead(5),
    effectiveDate: daysAhead(14),
    signatories: [
      { name: 'Sarah Chen', email: 'sarah.chen@company.com', role: 'employee' },
    ],
    message: 'Please review and sign your updated pay conditions.',
    source: 'e-signature',
    history: [{ at: daysAgo(2), label: 'Sent for signature', by: 'Priya Nair' }],
  },
  {
    id: 'doc-003',
    staffId: '2',
    staffName: 'Marcus Webb',
    title: 'Casual Employment Agreement',
    type: 'agreement',
    status: 'uploaded',
    createdAt: daysAgo(40),
    completedAt: daysAgo(40),
    signatories: [{ name: 'Marcus Webb', email: 'marcus.webb@company.com', role: 'employee', signedAt: daysAgo(41) }],
    fileName: 'marcus-webb-casual-agreement-signed.pdf',
    fileSize: 428_112,
    source: 'upload',
    history: [{ at: daysAgo(40), label: 'Signed copy uploaded', by: 'Priya Nair' }],
  },
];

type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach(l => l());

export const contractDocumentStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  all(): ContractDocument[] {
    return [...documents].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },

  forStaff(staffId: string): ContractDocument[] {
    return contractDocumentStore.all().filter(d => d.staffId === staffId);
  },

  forStaffName(staffName: string): ContractDocument[] {
    return contractDocumentStore.all().filter(d => d.staffName === staffName);
  },

  pendingForStaffName(staffName: string): ContractDocument[] {
    return contractDocumentStore
      .forStaffName(staffName)
      .filter(d => d.status === 'sent' || d.status === 'viewed');
  },

  /** Send a new document out for e-signature. */
  sendForSignature(input: {
    staffId: string;
    staffName: string;
    title: string;
    type: ContractDocumentType;
    signatories: ContractSignatory[];
    message?: string;
    dueDate?: string;
    effectiveDate?: string;
  }): ContractDocument {
    const doc: ContractDocument = {
      id: `doc-${Date.now()}`,
      staffId: input.staffId,
      staffName: input.staffName,
      title: input.title,
      type: input.type,
      status: 'sent',
      createdAt: iso(new Date()),
      sentAt: iso(new Date()),
      dueDate: input.dueDate,
      effectiveDate: input.effectiveDate,
      signatories: input.signatories,
      message: input.message,
      source: 'e-signature',
      history: [{ at: iso(new Date()), label: 'Sent for signature' }],
    };
    documents = [doc, ...documents];
    emit();
    return doc;
  },

  /** Record a contract that was signed outside the system. */
  uploadSigned(input: {
    staffId: string;
    staffName: string;
    title: string;
    type: ContractDocumentType;
    fileName: string;
    fileSize: number;
    signedAt: string;
    effectiveDate?: string;
    note?: string;
  }): ContractDocument {
    const doc: ContractDocument = {
      id: `doc-${Date.now()}`,
      staffId: input.staffId,
      staffName: input.staffName,
      title: input.title,
      type: input.type,
      status: 'uploaded',
      createdAt: iso(new Date()),
      completedAt: input.signedAt,
      effectiveDate: input.effectiveDate,
      signatories: [{ name: input.staffName, email: '', role: 'employee', signedAt: input.signedAt }],
      message: input.note,
      fileName: input.fileName,
      fileSize: input.fileSize,
      source: 'upload',
      history: [{ at: iso(new Date()), label: 'Signed copy uploaded' }],
    };
    documents = [doc, ...documents];
    emit();
    return doc;
  },

  markViewed(id: string) {
    documents = documents.map(d =>
      d.id === id && d.status === 'sent'
        ? {
            ...d,
            status: 'viewed',
            viewedAt: iso(new Date()),
            history: [...d.history, { at: iso(new Date()), label: 'Opened by recipient' }],
          }
        : d,
    );
    emit();
  },

  sign(id: string, signerName: string) {
    const now = iso(new Date());
    documents = documents.map(d =>
      d.id === id
        ? {
            ...d,
            status: 'signed',
            completedAt: now,
            signatories: d.signatories.map(s =>
              s.name === signerName || s.role === 'employee' ? { ...s, signedAt: s.signedAt ?? now } : s,
            ),
            history: [...d.history, { at: now, label: `Signed by ${signerName}` }],
          }
        : d,
    );
    emit();
  },

  decline(id: string, reason: string) {
    const now = iso(new Date());
    documents = documents.map(d =>
      d.id === id
        ? { ...d, status: 'declined', history: [...d.history, { at: now, label: `Declined — ${reason}` }] }
        : d,
    );
    emit();
  },

  resend(id: string) {
    const now = iso(new Date());
    documents = documents.map(d =>
      d.id === id
        ? { ...d, status: 'sent', sentAt: now, history: [...d.history, { at: now, label: 'Reminder sent' }] }
        : d,
    );
    emit();
  },

  remove(id: string) {
    documents = documents.filter(d => d.id !== id);
    emit();
  },
};
