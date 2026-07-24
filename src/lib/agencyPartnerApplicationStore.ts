// Tenant-admin agency-partner intake store
// Manages invitations and applications BEFORE the AgencyOnboardingWizard runs.
// In-memory (pre-Cloud) with subscribe/notify for reactive views.

import type { DocumentUpload, RateCardEntry, CoverageZoneEntry } from '@/components/agency/AgencyOnboardingWizard';


export type InviteStatus = 'sent' | 'opened' | 'accepted' | 'expired' | 'revoked';
export type ApplicationStatus =
  | 'invited'
  | 'submitted'
  | 'in_review'
  | 'changes_requested'
  | 'approved'
  | 'rejected';

export interface AgencyPartnerInvite {
  id: string;
  agencyName: string;
  contactName: string;
  contactEmail: string;
  serviceCategoryIds: string[];
  regionNotes?: string;
  message?: string;
  token: string;
  status: InviteStatus;
  createdAt: string;
  createdBy: string;
  expiresAt: string;
  acceptedAt?: string;
  applicationId?: string;
}

export interface AgencyPartnerApplication {
  id: string;
  inviteId?: string;
  agencyName: string;
  legalEntityName?: string;
  abn?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  headquartersCity?: string;
  serviceCategoryIds: string[];
  yearsInOperation?: number;
  candidatePoolSize?: number;
  insuranceProvider?: string;
  insuranceExpiry?: string;
  references?: string;
  notesFromApplicant?: string;
  status: ApplicationStatus;
  submittedAt: string;
  updatedAt: string;
  reviewNotes?: ReviewNote[];
  decisionAt?: string;
  decisionBy?: string;
  rejectionReason?: string;
  changeRequestSummary?: string;
  // Post-approval lifecycle
  onboardingCompletedAt?: string;
  onboardingSummary?: {
    documentsUploaded: number;
    rateCardCount: number;
    coverageZoneCount: number;
    serviceCategoryCount: number;
  };
  assignedLocationIds?: string[];
  activatedAt?: string;
  // Independently editable onboarding sections
  documents?: DocumentUpload[];
  rateCards?: RateCardEntry[];
  coverageZones?: CoverageZoneEntry[];
  // Integration configuration (post-approval)
  integration?: AgencyIntegrationConfig;
}

// ============================================================================
// Integration types
// ============================================================================

export type IntegrationEnv = 'sandbox' | 'production';
export const ALL_SCOPES = [
  'shifts.read',
  'shifts.write',
  'placements.read',
  'placements.write',
  'candidates.read',
  'candidates.write',
  'timesheets.read',
  'invoices.read',
] as const;
export type IntegrationScope = typeof ALL_SCOPES[number];

export const ALL_WEBHOOK_EVENTS = [
  'shift.broadcast',
  'shift.updated',
  'shift.cancelled',
  'placement.confirmed',
  'placement.cancelled',
  'timesheet.approved',
  'invoice.issued',
] as const;
export type WebhookEvent = typeof ALL_WEBHOOK_EVENTS[number];

export interface ApiCredential {
  id: string;
  clientId: string;
  clientSecretPreview: string; // e.g. "sk_live_••••••4f9c"
  env: IntegrationEnv;
  scopes: IntegrationScope[];
  createdAt: string;
  createdBy: string;
  lastUsedAt?: string;
  rotatedAt?: string;
  revokedAt?: string;
}

export interface RoleMapping {
  id: string;
  agencyRoleLabel: string; // free-text label agency sends
  positionId?: string;     // tenant canonical position id
  positionLabel?: string;  // denormalised for display
  confirmedAt?: string;
  confirmedBy?: string;
}

export interface NotificationRouting {
  dispatchFailureRecipients: string[]; // email addresses
  deadLetterRecipients: string[];
  channelEmail: boolean;
  channelInApp: boolean;
}

export type DeliveryStatus = 'delivered' | 'failed' | 'retrying' | 'dead_letter';

export interface WebhookDelivery {
  id: string;
  event: WebhookEvent;
  attemptedAt: string;
  status: DeliveryStatus;
  responseCode?: number;
  latencyMs?: number;
  attempt: number;
  errorMessage?: string;
  payloadPreview?: string;
  isTest?: boolean;
}

export interface AgencyIntegrationConfig {
  env: IntegrationEnv;
  credentials: ApiCredential[];
  webhookUrl?: string;
  webhookSigningSecretPreview?: string; // "whsec_••••••ab12"
  webhookVerifiedAt?: string;
  eventSubscriptions: WebhookEvent[];
  rateLimitRpm: number;         // requests/min override (default 60)
  rateLimitBurst: number;       // burst allowance
  ipAllowlist: string[];        // CIDR or IPs; empty = any
  roleMappings: RoleMapping[];
  notifications: NotificationRouting;
  deliveries: WebhookDelivery[];
  lastSuccessfulDeliveryAt?: string;
  lastFailedDeliveryAt?: string;
}

export function integrationReadiness(cfg?: AgencyIntegrationConfig): {
  credentials: boolean;
  webhook: boolean;
  events: boolean;
  mapping: boolean;
  overall: 'not_configured' | 'partial' | 'ready';
} {
  const credentials = !!cfg?.credentials.some(c => !c.revokedAt);
  const webhook = !!cfg?.webhookUrl && !!cfg?.webhookVerifiedAt;
  const events = !!cfg && cfg.eventSubscriptions.length > 0;
  const mapping = !!cfg && cfg.roleMappings.length > 0 && cfg.roleMappings.every(m => !!m.positionId);
  const flags = [credentials, webhook, events, mapping];
  const done = flags.filter(Boolean).length;
  const overall = done === 4 ? 'ready' : done === 0 ? 'not_configured' : 'partial';
  return { credentials, webhook, events, mapping, overall };
}


export interface ReviewNote {
  id: string;
  at: string;
  by: string;
  action:
    | 'submitted'
    | 'moved_to_review'
    | 'changes_requested'
    | 'approved'
    | 'rejected'
    | 'note'
    | 'invited'
    | 'reminded'
    | 'onboarding_completed'
    | 'locations_assigned'
    | 'activated'
    | 'integration_updated';
  message?: string;
}

interface State {
  invites: AgencyPartnerInvite[];
  applications: AgencyPartnerApplication[];
}

const state: State = { invites: [], applications: [] };
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(l => l());

const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 10)}`;
const now = () => new Date().toISOString();
const addDays = (d: number) => new Date(Date.now() + d * 86400_000).toISOString();

function seed() {
  if (state.invites.length || state.applications.length) return;
  const inv: AgencyPartnerInvite = {
    id: uid('inv'),
    agencyName: 'Bluewater Nursing Group',
    contactName: 'Rachel Adams',
    contactEmail: 'rachel@bluewaternursing.com.au',
    serviceCategoryIds: ['cat-1'],
    message: 'Following our chat at the sector event.',
    token: uid('tok'),
    status: 'opened',
    createdAt: addDays(-4),
    createdBy: 'admin@rostered.ai',
    expiresAt: addDays(10),
  };
  const app: AgencyPartnerApplication = {
    id: uid('app'),
    agencyName: 'Northern Suburbs Educators',
    contactName: 'Priya Menon',
    contactEmail: 'priya@nsedu.com.au',
    contactPhone: '+61 400 111 222',
    abn: '12 345 678 901',
    website: 'https://nsedu.com.au',
    headquartersCity: 'Sydney',
    serviceCategoryIds: ['cat-3'],
    yearsInOperation: 7,
    candidatePoolSize: 84,
    insuranceProvider: 'CGU',
    insuranceExpiry: addDays(220),
    references: 'Bright Beginnings, Little Steps ELC',
    notesFromApplicant: 'Available to start dispatch in 2 weeks.',
    status: 'submitted',
    submittedAt: addDays(-2),
    updatedAt: addDays(-2),
    reviewNotes: [
      { id: uid('n'), at: addDays(-2), by: 'system', action: 'submitted', message: 'Application submitted via invite link.' },
    ],
  };
  const rejected: AgencyPartnerApplication = {
    id: uid('app'),
    agencyName: 'QuickStaff Co',
    contactName: 'Sam Lee',
    contactEmail: 'sam@quickstaff.example',
    serviceCategoryIds: ['cat-2'],
    status: 'rejected',
    submittedAt: addDays(-14),
    updatedAt: addDays(-9),
    decisionAt: addDays(-9),
    decisionBy: 'admin@rostered.ai',
    rejectionReason: 'Insufficient insurance coverage for target locations.',
    reviewNotes: [
      { id: uid('n'), at: addDays(-9), by: 'admin@rostered.ai', action: 'rejected', message: 'Insurance below required threshold.' },
    ],
  };
  state.invites.push(inv);
  state.applications.push(app, rejected);
}
seed();

export const AgencyPartnerStore = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  getInvites: () => [...state.invites].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  getApplications: () => [...state.applications].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  getApplication: (id: string) => state.applications.find(a => a.id === id),

  createInvite(input: Omit<AgencyPartnerInvite, 'id' | 'token' | 'status' | 'createdAt' | 'expiresAt'> & { expiresInDays?: number }) {
    const invite: AgencyPartnerInvite = {
      ...input,
      id: uid('inv'),
      token: uid('tok'),
      status: 'sent',
      createdAt: now(),
      expiresAt: addDays(input.expiresInDays ?? 14),
    };
    state.invites.unshift(invite);
    notify();
    return invite;
  },

  revokeInvite(id: string) {
    const i = state.invites.find(x => x.id === id);
    if (!i) return;
    i.status = 'revoked';
    notify();
  },

  resendInvite(id: string) {
    const i = state.invites.find(x => x.id === id);
    if (!i) return;
    i.status = 'sent';
    i.createdAt = now();
    i.expiresAt = addDays(14);
    notify();
  },

  // Simulate the agency accepting the invite and submitting an application draft.
  simulateAcceptance(inviteId: string) {
    const inv = state.invites.find(x => x.id === inviteId);
    if (!inv || inv.status === 'accepted' || inv.status === 'revoked') return;
    const app: AgencyPartnerApplication = {
      id: uid('app'),
      inviteId: inv.id,
      agencyName: inv.agencyName,
      contactName: inv.contactName,
      contactEmail: inv.contactEmail,
      serviceCategoryIds: inv.serviceCategoryIds,
      status: 'submitted',
      submittedAt: now(),
      updatedAt: now(),
      reviewNotes: [
        { id: uid('n'), at: now(), by: 'system', action: 'submitted', message: 'Invite accepted; application submitted.' },
      ],
    };
    inv.status = 'accepted';
    inv.acceptedAt = now();
    inv.applicationId = app.id;
    state.applications.unshift(app);
    notify();
    return app;
  },

  moveToReview(appId: string, by: string) {
    const a = state.applications.find(x => x.id === appId);
    if (!a) return;
    a.status = 'in_review';
    a.updatedAt = now();
    a.reviewNotes = [...(a.reviewNotes ?? []), { id: uid('n'), at: now(), by, action: 'moved_to_review' }];
    notify();
  },

  requestChanges(appId: string, by: string, summary: string) {
    const a = state.applications.find(x => x.id === appId);
    if (!a) return;
    a.status = 'changes_requested';
    a.changeRequestSummary = summary;
    a.updatedAt = now();
    a.reviewNotes = [...(a.reviewNotes ?? []), { id: uid('n'), at: now(), by, action: 'changes_requested', message: summary }];
    notify();
  },

  approve(appId: string, by: string, message?: string) {
    const a = state.applications.find(x => x.id === appId);
    if (!a) return;
    a.status = 'approved';
    a.decisionAt = now();
    a.decisionBy = by;
    a.updatedAt = now();
    a.reviewNotes = [...(a.reviewNotes ?? []), { id: uid('n'), at: now(), by, action: 'approved', message }];
    notify();
  },

  reject(appId: string, by: string, reason: string) {
    const a = state.applications.find(x => x.id === appId);
    if (!a) return;
    a.status = 'rejected';
    a.rejectionReason = reason;
    a.decisionAt = now();
    a.decisionBy = by;
    a.updatedAt = now();
    a.reviewNotes = [...(a.reviewNotes ?? []), { id: uid('n'), at: now(), by, action: 'rejected', message: reason }];
    notify();
  },

  addNote(appId: string, by: string, message: string) {
    const a = state.applications.find(x => x.id === appId);
    if (!a) return;
    a.updatedAt = now();
    a.reviewNotes = [...(a.reviewNotes ?? []), { id: uid('n'), at: now(), by, action: 'note', message }];
    notify();
  },

  completeOnboarding(appId: string, by: string, summary: NonNullable<AgencyPartnerApplication['onboardingSummary']>) {
    const a = state.applications.find(x => x.id === appId);
    if (!a || a.status !== 'approved') return;
    a.onboardingCompletedAt = now();
    a.onboardingSummary = summary;
    a.updatedAt = now();
    a.reviewNotes = [
      ...(a.reviewNotes ?? []),
      {
        id: uid('n'), at: now(), by, action: 'onboarding_completed',
        message: `Docs ${summary.documentsUploaded} · Rate cards ${summary.rateCardCount} · Zones ${summary.coverageZoneCount}`,
      },
    ];
    notify();
  },

  assignLocations(appId: string, by: string, locationIds: string[]) {
    const a = state.applications.find(x => x.id === appId);
    if (!a || a.status !== 'approved') return;
    const previous = a.assignedLocationIds ?? [];
    a.assignedLocationIds = [...locationIds];
    a.updatedAt = now();
    const wasActivated = !!a.activatedAt;
    if (locationIds.length > 0 && a.onboardingCompletedAt && !wasActivated) {
      a.activatedAt = now();
    }
    a.reviewNotes = [
      ...(a.reviewNotes ?? []),
      {
        id: uid('n'), at: now(), by, action: 'locations_assigned',
        message: `${locationIds.length} location(s) assigned (was ${previous.length}).`,
      },
      ...(!wasActivated && a.activatedAt
        ? [{ id: uid('n'), at: now(), by, action: 'activated' as const, message: 'Agency activated for dispatch.' }]
        : []),
    ];
    notify();
  },

  updateOnboardingSection<K extends 'documents' | 'rateCards' | 'coverageZones'>(
    appId: string, section: K, value: NonNullable<AgencyPartnerApplication[K]>, by: string,
  ) {
    const a = state.applications.find(x => x.id === appId);
    if (!a) return;
    (a[section] as NonNullable<AgencyPartnerApplication[K]>) = value;
    a.updatedAt = now();
    const labels = { documents: 'Compliance documents', rateCards: 'Rate cards', coverageZones: 'Coverage zones' } as const;
    a.reviewNotes = [
      ...(a.reviewNotes ?? []),
      { id: uid('n'), at: now(), by, action: 'note', message: `${labels[section]} updated.` },
    ];
    notify();
  },

  // ------------------------------------------------------------------ Integration
  getIntegration(appId: string): AgencyIntegrationConfig {
    const a = state.applications.find(x => x.id === appId);
    if (!a) throw new Error('Application not found');
    if (!a.integration) {
      a.integration = {
        env: 'sandbox',
        credentials: [],
        eventSubscriptions: [],
        rateLimitRpm: 60,
        rateLimitBurst: 20,
        ipAllowlist: [],
        roleMappings: [],
        notifications: {
          dispatchFailureRecipients: [],
          deadLetterRecipients: [],
          channelEmail: true,
          channelInApp: true,
        },
        deliveries: [],
      };
    }
    return a.integration;
  },

  updateIntegration(appId: string, by: string, patch: Partial<AgencyIntegrationConfig>, note?: string) {
    const a = state.applications.find(x => x.id === appId);
    if (!a) return;
    const cur = this.getIntegration(appId);
    a.integration = { ...cur, ...patch };
    a.updatedAt = now();
    a.reviewNotes = [
      ...(a.reviewNotes ?? []),
      { id: uid('n'), at: now(), by, action: 'integration_updated', message: note ?? 'Integration settings updated.' },
    ];
    notify();
  },

  issueCredentials(appId: string, by: string, env: IntegrationEnv, scopes: IntegrationScope[]) {
    const cfg = this.getIntegration(appId);
    const suffix = Math.random().toString(36).slice(2, 6);
    const cred: ApiCredential = {
      id: uid('cred'),
      clientId: `${env === 'production' ? 'live' : 'sbx'}_${uid('cid').slice(4)}`,
      clientSecretPreview: `sk_${env === 'production' ? 'live' : 'test'}_••••••${suffix}`,
      env,
      scopes,
      createdAt: now(),
      createdBy: by,
    };
    this.updateIntegration(appId, by, { credentials: [cred, ...cfg.credentials] }, `Issued ${env} credentials.`);
    return cred;
  },

  rotateClientSecret(appId: string, credentialId: string, by: string) {
    const cfg = this.getIntegration(appId);
    const next = cfg.credentials.map(c => c.id === credentialId
      ? { ...c, clientSecretPreview: `sk_${c.env === 'production' ? 'live' : 'test'}_••••••${Math.random().toString(36).slice(2, 6)}`, rotatedAt: now() }
      : c);
    this.updateIntegration(appId, by, { credentials: next }, 'Client secret rotated.');
  },

  revokeCredential(appId: string, credentialId: string, by: string) {
    const cfg = this.getIntegration(appId);
    const next = cfg.credentials.map(c => c.id === credentialId ? { ...c, revokedAt: now() } : c);
    this.updateIntegration(appId, by, { credentials: next }, 'Credential revoked.');
  },

  rotateWebhookSecret(appId: string, by: string) {
    const suffix = Math.random().toString(36).slice(2, 6);
    this.updateIntegration(appId, by, {
      webhookSigningSecretPreview: `whsec_••••••${suffix}`,
      webhookVerifiedAt: undefined,
    }, 'Webhook signing secret rotated — resend test to re-verify.');
  },

  recordDelivery(appId: string, delivery: Omit<WebhookDelivery, 'id'>) {
    const a = state.applications.find(x => x.id === appId);
    if (!a) return;
    const cfg = this.getIntegration(appId);
    const d: WebhookDelivery = { ...delivery, id: uid('dlv') };
    const deliveries = [d, ...cfg.deliveries].slice(0, 200);
    const patch: Partial<AgencyIntegrationConfig> = { deliveries };
    if (d.status === 'delivered') patch.lastSuccessfulDeliveryAt = d.attemptedAt;
    if (d.status === 'failed' || d.status === 'dead_letter') patch.lastFailedDeliveryAt = d.attemptedAt;
    a.integration = { ...cfg, ...patch };
    a.updatedAt = now();
    notify();
  },

  sendTestDelivery(appId: string, event: WebhookEvent, by: string) {
    const cfg = this.getIntegration(appId);
    if (!cfg.webhookUrl) throw new Error('Set a webhook URL first.');
    const success = Math.random() > 0.15;
    this.recordDelivery(appId, {
      event,
      attemptedAt: now(),
      status: success ? 'delivered' : 'failed',
      responseCode: success ? 200 : 500,
      latencyMs: 80 + Math.floor(Math.random() * 400),
      attempt: 1,
      isTest: true,
      errorMessage: success ? undefined : 'Endpoint returned 500 Internal Server Error',
      payloadPreview: `{"event":"${event}","test":true}`,
    });
    if (success) {
      this.updateIntegration(appId, by, { webhookVerifiedAt: now() }, `Test ${event} delivered — webhook verified.`);
    }
    return success;
  },

  retryDelivery(appId: string, deliveryId: string, by: string) {
    const cfg = this.getIntegration(appId);
    const original = cfg.deliveries.find(d => d.id === deliveryId);
    if (!original) return;
    const success = Math.random() > 0.3;
    this.recordDelivery(appId, {
      event: original.event,
      attemptedAt: now(),
      status: success ? 'delivered' : 'failed',
      responseCode: success ? 200 : 502,
      latencyMs: 100 + Math.floor(Math.random() * 500),
      attempt: original.attempt + 1,
      errorMessage: success ? undefined : 'Endpoint returned 502 Bad Gateway',
      payloadPreview: original.payloadPreview,
    });
  },
};


export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  invited: 'Invited',
  submitted: 'Submitted',
  in_review: 'In review',
  changes_requested: 'Changes requested',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const inviteStatusLabels: Record<InviteStatus, string> = {
  sent: 'Sent',
  opened: 'Opened',
  accepted: 'Accepted',
  expired: 'Expired',
  revoked: 'Revoked',
};
