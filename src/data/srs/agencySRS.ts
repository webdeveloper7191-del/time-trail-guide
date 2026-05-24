// Agency Integration Module - Software Requirements Specification
// Includes full API endpoint catalogue (request / response contracts) and
// end-to-end workflow wiring across the centre <-> agency boundary.

import type { ModuleSRS } from './rosterSRS';

export interface ApiEndpointSpec {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  auth: string;
  consumer: string; // who calls it (Centre app / Agency portal / Webhook)
  request: {
    headers?: Record<string, string>;
    pathParams?: Record<string, string>;
    queryParams?: Record<string, string>;
    body?: string; // JSON example
  };
  response: {
    status: number;
    body: string; // JSON example
  };
  errors?: { status: number; code: string; description: string }[];
  sideEffects?: string[];
}

export interface WorkflowStep {
  step: number;
  actor: string;
  action: string;
  endpoint?: string; // references ApiEndpointSpec.id
  notes?: string;
}

export interface WorkflowSpec {
  id: string;
  name: string;
  trigger: string;
  steps: WorkflowStep[];
  outcome: string;
}

export interface AgencyModuleSRS extends ModuleSRS {
  apiEndpoints: ApiEndpointSpec[];
  workflows: WorkflowSpec[];
}

// ---------- API ENDPOINTS ----------

const apiEndpoints: ApiEndpointSpec[] = [
  // ====== SHIFT REQUEST / BROADCAST ======
  {
    id: 'API-AG-001',
    name: 'Create Shift Request (Centre -> Agency)',
    method: 'POST',
    path: '/api/v1/agency/shift-requests',
    description: 'Centre broadcasts an unfilled shift to one or more partner agencies.',
    auth: 'Bearer JWT (centre admin) + tenant scope',
    consumer: 'Centre Roster (SendToAgencyModal)',
    request: {
      headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': '<uuid>' },
      body: `{
  "clientId": "centre-123",
  "locationId": "loc-44",
  "areaId": "area-toddler-2",
  "date": "2026-06-04",
  "startTime": "07:00",
  "endTime": "15:30",
  "breakMinutes": 30,
  "requiredRole": "Diploma Educator",
  "requiredQualifications": ["WWCC", "FirstAid"],
  "urgency": "high",
  "rateCardId": "rc-9",
  "notes": "Cover for sick leave",
  "agencyIds": ["agc-1","agc-2"],
  "responseDeadline": "2026-06-03T18:00:00Z"
}`,
    },
    response: {
      status: 201,
      body: `{
  "id": "sr-7781",
  "status": "broadcasting",
  "broadcastedTo": ["agc-1","agc-2"],
  "createdAt": "2026-06-03T09:12:11Z",
  "expiresAt": "2026-06-03T18:00:00Z"
}`,
    },
    errors: [
      { status: 400, code: 'INVALID_TIME_RANGE', description: 'endTime must be after startTime' },
      { status: 409, code: 'DUPLICATE_REQUEST', description: 'Identical open request already exists' },
    ],
    sideEffects: [
      'Webhook POST /agency-webhook/shift.broadcast fired to each agency',
      'Notification dispatched via agencyNotificationService',
    ],
  },
  {
    id: 'API-AG-002',
    name: 'List Shift Requests (Agency Inbox)',
    method: 'GET',
    path: '/api/v1/agency/shift-requests',
    description: 'Agency fetches the inbox of broadcast shifts assigned to them.',
    auth: 'Bearer JWT (agency user)',
    consumer: 'AgencyPortal -> ShiftBroadcastInbox',
    request: {
      queryParams: {
        status: 'open|matched|filled|cancelled',
        urgency: 'low|medium|high|critical',
        dateFrom: 'YYYY-MM-DD',
        dateTo: 'YYYY-MM-DD',
        page: '1',
        pageSize: '20',
      },
    },
    response: {
      status: 200,
      body: `{
  "data": [
    {
      "id":"sr-7781","clientName":"Sunshine ELC","locationName":"Bondi",
      "date":"2026-06-04","startTime":"07:00","endTime":"15:30",
      "requiredRole":"Diploma Educator","urgency":"high",
      "rate":{"chargeRate":62.0,"payRate":48.0,"currency":"AUD"},
      "expiresAt":"2026-06-03T18:00:00Z","status":"open"
    }
  ],
  "pagination":{"page":1,"pageSize":20,"total":34}
}`,
    },
  },
  {
    id: 'API-AG-003',
    name: 'Match Candidates for a Shift',
    method: 'POST',
    path: '/api/v1/agency/shift-requests/:id/match',
    description: 'Runs the matching engine and returns ranked eligible candidates.',
    auth: 'Bearer JWT (agency scheduler)',
    consumer: 'AgencyPortal -> ShiftMatchingPanel',
    request: { pathParams: { id: 'sr-7781' }, body: `{ "limit": 10, "includeIneligible": false }` },
    response: {
      status: 200,
      body: `{
  "matches":[
    {"candidateId":"cand-22","matchScore":94,"skillMatch":95,"proximityMatch":92,
     "availabilityMatch":100,"reliabilityScore":4.8,"isEligible":true,
     "complianceStatus":"compliant","distanceKm":3.2}
  ]
}`,
    },
  },

  // ====== CANDIDATE SUBMISSION & BOOKING CONFIRMATION ======
  {
    id: 'API-AG-004',
    name: 'Submit Candidate (Agency -> Centre)',
    method: 'POST',
    path: '/api/v1/agency/shift-requests/:id/submissions',
    description: 'Agency proposes one or more candidates for a shift; awaits centre confirmation.',
    auth: 'Bearer JWT (agency)',
    consumer: 'AgencyPortal -> ShiftMatchingPanel',
    request: {
      pathParams: { id: 'sr-7781' },
      body: `{
  "candidateIds": ["cand-22","cand-45"],
  "proposedRate": {"chargeRate": 62.0, "payRate": 48.0},
  "agencyNotes": "Both have prior experience at this centre"
}`,
    },
    response: {
      status: 201,
      body: `{
  "submissionId":"sub-901",
  "status":"pending_centre_confirmation",
  "slaDeadline":"2026-06-03T13:12:11Z",
  "candidates":[{"id":"cand-22","status":"submitted"},{"id":"cand-45","status":"submitted"}]
}`,
    },
    sideEffects: ['Reverse SLA timer started via bookingConfirmationService'],
  },
  {
    id: 'API-AG-005',
    name: 'Centre Confirm / Reject Submission',
    method: 'POST',
    path: '/api/v1/agency/submissions/:submissionId/decision',
    description: 'Centre accepts or rejects a submitted candidate. Acceptance creates a Placement.',
    auth: 'Bearer JWT (centre admin)',
    consumer: 'Centre -> BookingConfirmationPanel',
    request: {
      pathParams: { submissionId: 'sub-901' },
      body: `{
  "candidateId":"cand-22",
  "decision":"accept",
  "rejectionReason": null,
  "interviewRequested": false
}`,
    },
    response: {
      status: 200,
      body: `{
  "submissionId":"sub-901",
  "candidateId":"cand-22",
  "placementId":"plc-555",
  "status":"confirmed",
  "decidedAt":"2026-06-03T11:00:02Z"
}`,
    },
    errors: [
      { status: 410, code: 'SLA_EXPIRED', description: 'Submission window closed; resubmit required' },
    ],
    sideEffects: [
      'Placement row created (status=pending)',
      'Webhook agency.submission.decided fired to agency',
      'Notification to candidate via candidate channel',
    ],
  },

  // ====== COMPLIANCE ======
  {
    id: 'API-AG-006',
    name: 'List Candidate Compliance Documents',
    method: 'GET',
    path: '/api/v1/agency/candidates/:candidateId/compliance',
    description: 'Returns per-candidate documents with expiry + compliance score.',
    auth: 'Bearer JWT (agency or centre with placement link)',
    consumer: 'CandidateComplianceManager',
    request: { pathParams: { candidateId: 'cand-22' } },
    response: {
      status: 200,
      body: `{
  "candidateId":"cand-22",
  "complianceScore":96,
  "status":"compliant",
  "documents":[
    {"id":"doc-1","type":"WWCC","number":"WWC1234567E","jurisdiction":"NSW",
     "issuedAt":"2024-01-12","expiresAt":"2029-01-11","fileUrl":"https://...","status":"valid"},
    {"id":"doc-2","type":"FirstAid","expiresAt":"2026-08-01","status":"expiring_soon"}
  ],
  "missingRequired":[]
}`,
    },
  },
  {
    id: 'API-AG-007',
    name: 'Upload Candidate Compliance Document',
    method: 'POST',
    path: '/api/v1/agency/candidates/:candidateId/compliance',
    description: 'Multipart upload of a compliance document; triggers OCR + verification job.',
    auth: 'Bearer JWT (agency)',
    consumer: 'CandidateComplianceManager',
    request: {
      pathParams: { candidateId: 'cand-22' },
      headers: { 'Content-Type': 'multipart/form-data' },
      body: `form-data:
  type: "PoliceCheck"
  jurisdiction: "NSW"
  number: "PC998877"
  issuedAt: "2026-02-01"
  expiresAt: "2029-02-01"
  file: <binary>`,
    },
    response: {
      status: 201,
      body: `{"id":"doc-9","status":"pending_verification","verificationJobId":"vrf-31"}`,
    },
  },

  // ====== CLOCK-IN / ATTENDANCE RECONCILIATION ======
  {
    id: 'API-AG-008',
    name: 'Agency Worker Clock Event',
    method: 'POST',
    path: '/api/v1/agency/placements/:placementId/clock-events',
    description: 'Records a clock-in / clock-out event with method + verification payload.',
    auth: 'Short-lived candidate token OR centre kiosk token',
    consumer: 'Kiosk / Mobile / QR scan',
    request: {
      pathParams: { placementId: 'plc-555' },
      body: `{
  "eventType":"clock_in",
  "method":"qr",
  "timestamp":"2026-06-04T06:58:11Z",
  "geo":{"lat":-33.89,"lng":151.27,"accuracyM":12},
  "deviceId":"kiosk-front-desk"
}`,
    },
    response: {
      status: 201,
      body: `{
  "id":"evt-9981","placementId":"plc-555","eventType":"clock_in",
  "verified":true,"withinGeofence":true,"varianceMinutes":-2
}`,
    },
  },
  {
    id: 'API-AG-009',
    name: 'Reconcile Placement -> Timesheet',
    method: 'POST',
    path: '/api/v1/agency/placements/:placementId/reconcile',
    description: 'Calculates actual hours vs booked, flags discrepancies, creates timesheet entry.',
    auth: 'Bearer JWT (centre admin)',
    consumer: 'AttendanceReconciliationPanel',
    request: {
      pathParams: { placementId: 'plc-555' },
      body: `{
  "approvedHours": 8.0,
  "payableBreakMinutes": 30,
  "discrepancyResolution":"accept_actual",
  "adminNotes":"Worker stayed 15 min late at parent request"
}`,
    },
    response: {
      status: 200,
      body: `{
  "placementId":"plc-555",
  "timesheetId":"ts-7811",
  "bookedHours":8.0,"actualHours":8.25,"approvedHours":8.0,
  "discrepancies":[{"type":"late_clock_out","minutes":15}],
  "status":"reconciled"
}`,
    },
    sideEffects: [
      'Timesheet entry created in timesheets table',
      'Invoice line item queued',
      'Audit log entry written',
    ],
  },

  // ====== INVOICING ======
  {
    id: 'API-AG-010',
    name: 'Generate Invoice',
    method: 'POST',
    path: '/api/v1/agency/invoices',
    description: 'Aggregates reconciled placements into an invoice (supports RCTI / self-bill).',
    auth: 'Bearer JWT (agency billing OR centre when RCTI)',
    consumer: 'InvoiceGenerator',
    request: {
      body: `{
  "clientId":"centre-123",
  "billingPeriod":{"from":"2026-06-01","to":"2026-06-14"},
  "placementIds":["plc-555","plc-556"],
  "type":"standard",
  "includeGst":true
}`,
    },
    response: {
      status: 201,
      body: `{
  "id":"inv-3301","invoiceNumber":"AGC-2026-0421",
  "subtotal":984.00,"gst":98.40,"total":1082.40,"currency":"AUD",
  "status":"draft","dueDate":"2026-07-01"
}`,
    },
  },

  // ====== POST-PLACEMENT RATING ======
  {
    id: 'API-AG-011',
    name: 'Submit Post-Placement Rating',
    method: 'POST',
    path: '/api/v1/agency/placements/:placementId/rating',
    description: 'Centre rates the candidate after the shift; feeds matching engine.',
    auth: 'Bearer JWT (centre admin)',
    consumer: 'PostPlacementRatingModal',
    request: {
      pathParams: { placementId: 'plc-555' },
      body: `{
  "ratings":{"punctuality":5,"skill":4,"culture":5,"overall":5},
  "wouldRebook":true,
  "comments":"Excellent fit, children responded well."
}`,
    },
    response: {
      status: 201,
      body: `{ "id":"rt-220","candidateNewAvgRating":4.82 }`,
    },
  },

  // ====== WEBHOOKS (outbound) ======
  {
    id: 'API-AG-012',
    name: 'Webhook: shift.broadcast',
    method: 'POST',
    path: '{agencyWebhookUrl}',
    description: 'Outbound webhook to agency when a new shift is broadcast.',
    auth: 'HMAC-SHA256 signature in X-Lovable-Signature',
    consumer: 'Agency webhook endpoint',
    request: {
      headers: { 'X-Lovable-Signature': 'sha256=...', 'X-Event-Type': 'shift.broadcast' },
      body: `{
  "event":"shift.broadcast",
  "shiftRequestId":"sr-7781",
  "expiresAt":"2026-06-03T18:00:00Z",
  "payload":{ "...":"see API-AG-001 response" }
}`,
    },
    response: { status: 200, body: `{ "received": true }` },
    errors: [
      { status: 401, code: 'BAD_SIGNATURE', description: 'HMAC verification failed' },
    ],
  },
  {
    id: 'API-AG-013',
    name: 'Webhook: submission.decided',
    method: 'POST',
    path: '{agencyWebhookUrl}',
    description: 'Notifies agency when centre accepts or rejects a candidate submission.',
    auth: 'HMAC-SHA256 signature',
    consumer: 'Agency webhook endpoint',
    request: {
      headers: { 'X-Event-Type': 'submission.decided' },
      body: `{
  "event":"submission.decided",
  "submissionId":"sub-901","candidateId":"cand-22",
  "decision":"accept","placementId":"plc-555"
}`,
    },
    response: { status: 200, body: `{"received":true}` },
  },
];

// ---------- WORKFLOWS ----------

const workflows: WorkflowSpec[] = [
  {
    id: 'WF-AG-01',
    name: 'End-to-End: Open Shift -> Filled -> Paid',
    trigger: 'Centre identifies an unfilled shift on the roster',
    steps: [
      { step: 1, actor: 'Centre Admin', action: 'Open SendToAgencyModal, pick agencies, set urgency + deadline', endpoint: 'API-AG-001' },
      { step: 2, actor: 'System', action: 'Persist ShiftRequest, dispatch webhook + notifications', endpoint: 'API-AG-012' },
      { step: 3, actor: 'Agency Scheduler', action: 'Open ShiftBroadcastInbox, view shift', endpoint: 'API-AG-002' },
      { step: 4, actor: 'Agency Scheduler', action: 'Run match engine', endpoint: 'API-AG-003' },
      { step: 5, actor: 'Agency Scheduler', action: 'Submit one/more candidates (compliance pre-checked)', endpoint: 'API-AG-004' },
      { step: 6, actor: 'System', action: 'Start reverse-SLA timer for centre decision' },
      { step: 7, actor: 'Centre Admin', action: 'Accept/Reject submission via BookingConfirmationPanel', endpoint: 'API-AG-005' },
      { step: 8, actor: 'System', action: 'Create Placement; emit submission.decided webhook', endpoint: 'API-AG-013' },
      { step: 9, actor: 'Candidate', action: 'Clocks in on shift day (QR/geofence/PIN)', endpoint: 'API-AG-008' },
      { step: 10, actor: 'Centre Admin', action: 'Reconcile actual vs booked, push to timesheet', endpoint: 'API-AG-009' },
      { step: 11, actor: 'Agency Billing', action: 'Generate invoice (RCTI optional)', endpoint: 'API-AG-010' },
      { step: 12, actor: 'Centre Admin', action: 'Submit post-placement rating', endpoint: 'API-AG-011' },
    ],
    outcome: 'Shift filled, hours captured, invoice issued, candidate rated. All steps audit-logged and budget-tracked.',
  },
  {
    id: 'WF-AG-02',
    name: 'Candidate Compliance Lifecycle',
    trigger: 'Agency onboards a new candidate or document nears expiry',
    steps: [
      { step: 1, actor: 'Agency', action: 'Upload document', endpoint: 'API-AG-007' },
      { step: 2, actor: 'System', action: 'OCR + verification job; updates document.status' },
      { step: 3, actor: 'System', action: 'Nightly job scans expiries; sends alerts T-60/30/7 days' },
      { step: 4, actor: 'Centre Admin', action: 'Reviews compliance before accepting submission', endpoint: 'API-AG-006' },
      { step: 5, actor: 'System', action: 'Blocks submissions when missingRequired is non-empty' },
    ],
    outcome: 'Only compliant candidates can be placed; centres see live compliance status.',
  },
];

export const agencySRS: AgencyModuleSRS = {
  moduleName: 'Agency Integration',
  version: '1.0.0',
  lastUpdated: '2026-05-24',
  overview:
    'The Agency Integration module connects centres with external staffing agencies to broadcast unfilled shifts, match and submit candidates, confirm bookings under reverse SLA, capture compliant attendance, reconcile timesheets, generate invoices (including RCTI), and rate placements. It exposes a REST API plus signed outbound webhooks, with all calls scoped per tenant and per agency relationship.',
  objectives: [
    'Fill open shifts within the urgency SLA via ranked agency matching',
    'Guarantee per-candidate compliance (WWCC, Police Check, NDIS, Visa) at submission time',
    'Close the booking loop with explicit centre confirmation (two-way handshake)',
    'Eliminate manual timesheet entry through clock-event -> timesheet bridge',
    'Provide auditable invoicing (charge vs pay rate, GST, RCTI)',
    'Feed match quality back into the engine via post-placement ratings',
  ],
  scope: [
    'Shift broadcast + agency inbox',
    'Candidate matching, submission, and centre confirmation',
    'Per-candidate compliance documents with expiry alerts',
    'Clock-in (QR / geofence / PIN / kiosk) and discrepancy handling',
    'Placement -> Timesheet bridge',
    'Invoicing incl. RCTI / GST',
    'Outbound webhooks (HMAC signed)',
    'Post-placement ratings feeding the match engine',
  ],
  outOfScope: [
    'Payroll disbursement to candidates (handled by agency payroll)',
    'Background-check provider integrations (future)',
    'End-user candidate mobile app (future release)',
  ],
  actors: [
    { name: 'Centre Admin', description: 'Schedules, broadcasts, confirms bookings, reconciles attendance.', permissions: ['shift_request.create', 'submission.decide', 'placement.reconcile', 'invoice.view'] },
    { name: 'Agency Scheduler', description: 'Receives broadcasts, matches and submits candidates.', permissions: ['shift_request.read', 'submission.create', 'candidate.manage'] },
    { name: 'Agency Billing', description: 'Generates invoices and tracks payments.', permissions: ['invoice.create', 'invoice.send'] },
    { name: 'Candidate', description: 'Clocks in/out for assigned placements.', permissions: ['clock_event.create:self'] },
    { name: 'System', description: 'Webhooks, SLA timers, compliance jobs.', permissions: ['webhook.dispatch', 'job.run'] },
  ],
  functionalRequirements: [
    { id: 'FR-AG-01', category: 'Broadcast', requirement: 'Centre can broadcast a shift to N agencies with a deadline', priority: 'must' },
    { id: 'FR-AG-02', category: 'Matching', requirement: 'Agency can run match engine returning ranked candidates', priority: 'must' },
    { id: 'FR-AG-03', category: 'Booking', requirement: 'Centre must explicitly accept a submission before a placement is created', priority: 'must' },
    { id: 'FR-AG-04', category: 'Compliance', requirement: 'Submission blocked when required candidate docs are missing/expired', priority: 'must' },
    { id: 'FR-AG-05', category: 'Attendance', requirement: 'Clock events must capture method + geo and flag variance', priority: 'must' },
    { id: 'FR-AG-06', category: 'Invoicing', requirement: 'Invoice must include GST and support RCTI mode', priority: 'must' },
    { id: 'FR-AG-07', category: 'Webhooks', requirement: 'All outbound webhooks signed with HMAC-SHA256', priority: 'must' },
  ],
  nonFunctionalRequirements: [
    { id: 'NFR-AG-01', category: 'Performance', requirement: 'Match engine returns within 1.5s for <500 candidates' },
    { id: 'NFR-AG-02', category: 'Security', requirement: 'All API endpoints scoped per tenant + per agency relationship' },
    { id: 'NFR-AG-03', category: 'Reliability', requirement: 'Webhook retries with exponential backoff, max 24h' },
    { id: 'NFR-AG-04', category: 'Auditability', requirement: 'Every state change written to audit_log with actor + diff' },
  ],
  userStories: [
    {
      id: 'US-AG-01',
      title: 'Centre broadcasts unfilled shift and gets confirmed candidate',
      actors: ['Centre Admin', 'Agency Scheduler'],
      description: 'As a centre admin I want to send an unfilled shift to my preferred agencies and confirm the best candidate before they are booked.',
      acceptanceCriteria: [
        'Modal lets me select agencies, urgency, deadline, rate card',
        'Agencies receive shift in their inbox within seconds',
        'I can review submissions and accept/reject within SLA window',
        'Accepted candidate becomes a Placement linked to the roster cell',
      ],
      businessLogic: [
        'Reverse SLA defaults: critical=1h, high=4h, medium=24h, low=48h',
        'Compliance pre-check blocks ineligible candidates from submission',
      ],
      priority: 'critical',
      relatedModules: [
        { module: 'Roster', relationship: 'Placement renders on roster grid' },
        { module: 'Timesheets', relationship: 'Reconciliation creates timesheet entry' },
      ],
      endToEndJourney: [
        'Open shift detected in roster',
        'Centre broadcasts -> agencies match -> submit -> centre confirms',
        'Placement created -> candidate clocks in -> reconciled -> invoiced -> rated',
      ],
      realWorldExample: {
        scenario: 'Diploma Educator calls in sick at Bondi at 6am for a 7am start',
        steps: [
          'Centre marks shift as agency-eligible, urgency=critical',
          'Two preferred agencies receive broadcast at 06:02',
          'Agency A submits 1 candidate at 06:11 (compliance verified)',
          'Centre confirms at 06:14, candidate notified',
          'Candidate QR-clocks in at 06:58, geo verified',
        ],
        outcome: 'Shift filled within 12 min of broadcast; no manual phone calls.',
      },
    },
  ],
  tableSpecs: [
    {
      name: 'agency_shift_requests',
      schema: 'public',
      description: 'Shifts broadcast from centres to agencies.',
      fields: [
        { name: 'id', type: 'uuid', mandatory: true, description: 'PK' },
        { name: 'tenant_id', type: 'uuid', mandatory: true, description: 'Tenant scope', indexed: true },
        { name: 'client_id', type: 'uuid', mandatory: true, description: 'Centre', foreignKey: 'centres.id' },
        { name: 'location_id', type: 'uuid', mandatory: true, description: 'Location', foreignKey: 'locations.id' },
        { name: 'date', type: 'date', mandatory: true, description: 'Shift date', indexed: true },
        { name: 'start_time', type: 'time', mandatory: true, description: 'Start time' },
        { name: 'end_time', type: 'time', mandatory: true, description: 'End time' },
        { name: 'required_role', type: 'text', mandatory: true, description: 'Role required' },
        { name: 'urgency', type: 'enum', mandatory: true, description: 'low/medium/high/critical' },
        { name: 'status', type: 'enum', mandatory: true, description: 'open/broadcasting/matched/filled/cancelled/expired' },
        { name: 'expires_at', type: 'timestamptz', mandatory: true, description: 'Response deadline' },
      ],
    },
    {
      name: 'agency_submissions',
      schema: 'public',
      description: 'Candidate proposals awaiting centre decision.',
      fields: [
        { name: 'id', type: 'uuid', mandatory: true, description: 'PK' },
        { name: 'shift_request_id', type: 'uuid', mandatory: true, description: 'FK', foreignKey: 'agency_shift_requests.id' },
        { name: 'candidate_id', type: 'uuid', mandatory: true, description: 'FK', foreignKey: 'candidates.id' },
        { name: 'status', type: 'enum', mandatory: true, description: 'pending/accepted/rejected/expired' },
        { name: 'sla_deadline', type: 'timestamptz', mandatory: true, description: 'Centre decision deadline' },
        { name: 'decided_at', type: 'timestamptz', mandatory: false, description: 'When centre decided' },
      ],
    },
    {
      name: 'agency_placements',
      schema: 'public',
      description: 'Confirmed bookings linking candidate -> shift.',
      fields: [
        { name: 'id', type: 'uuid', mandatory: true, description: 'PK' },
        { name: 'submission_id', type: 'uuid', mandatory: true, description: 'Source submission' },
        { name: 'candidate_id', type: 'uuid', mandatory: true, description: 'FK' },
        { name: 'scheduled_start', type: 'timestamptz', mandatory: true, description: 'Booked start' },
        { name: 'scheduled_end', type: 'timestamptz', mandatory: true, description: 'Booked end' },
        { name: 'actual_start', type: 'timestamptz', mandatory: false, description: 'From clock event' },
        { name: 'actual_end', type: 'timestamptz', mandatory: false, description: 'From clock event' },
        { name: 'status', type: 'enum', mandatory: true, description: 'pending/checked_in/completed/no_show/cancelled' },
      ],
    },
    {
      name: 'candidate_compliance_documents',
      schema: 'public',
      description: 'Per-candidate compliance docs with expiry.',
      fields: [
        { name: 'id', type: 'uuid', mandatory: true, description: 'PK' },
        { name: 'candidate_id', type: 'uuid', mandatory: true, description: 'FK' },
        { name: 'type', type: 'enum', mandatory: true, description: 'WWCC/PoliceCheck/FirstAid/NDIS/Visa/Qualification/Immunisation' },
        { name: 'number', type: 'text', mandatory: false, description: 'Document number' },
        { name: 'jurisdiction', type: 'text', mandatory: false, description: 'State/territory' },
        { name: 'issued_at', type: 'date', mandatory: false, description: 'Issue date' },
        { name: 'expires_at', type: 'date', mandatory: false, description: 'Expiry' },
        { name: 'file_url', type: 'text', mandatory: false, description: 'Storage URL' },
        { name: 'status', type: 'enum', mandatory: true, description: 'valid/expiring_soon/expired/pending_verification/rejected' },
      ],
    },
    {
      name: 'agency_clock_events',
      schema: 'public',
      description: 'Clock-in/out events for placements.',
      fields: [
        { name: 'id', type: 'uuid', mandatory: true, description: 'PK' },
        { name: 'placement_id', type: 'uuid', mandatory: true, description: 'FK' },
        { name: 'event_type', type: 'enum', mandatory: true, description: 'clock_in/clock_out/break_start/break_end' },
        { name: 'method', type: 'enum', mandatory: true, description: 'qr/geofence/pin/kiosk/manual' },
        { name: 'timestamp', type: 'timestamptz', mandatory: true, description: 'Event time' },
        { name: 'geo_lat', type: 'numeric', mandatory: false, description: 'Latitude' },
        { name: 'geo_lng', type: 'numeric', mandatory: false, description: 'Longitude' },
        { name: 'within_geofence', type: 'boolean', mandatory: false, description: 'Geo verification' },
      ],
    },
    {
      name: 'agency_invoices',
      schema: 'public',
      description: 'Invoices generated from reconciled placements.',
      fields: [
        { name: 'id', type: 'uuid', mandatory: true, description: 'PK' },
        { name: 'invoice_number', type: 'text', mandatory: true, description: 'Human ref' },
        { name: 'client_id', type: 'uuid', mandatory: true, description: 'Centre' },
        { name: 'subtotal', type: 'numeric', mandatory: true, description: 'Pre-GST' },
        { name: 'gst', type: 'numeric', mandatory: true, description: 'GST amount' },
        { name: 'total', type: 'numeric', mandatory: true, description: 'Grand total' },
        { name: 'type', type: 'enum', mandatory: true, description: 'standard/rcti/credit_note' },
        { name: 'status', type: 'enum', mandatory: true, description: 'draft/sent/paid/overdue/disputed' },
        { name: 'due_date', type: 'date', mandatory: true, description: 'Payment due' },
      ],
    },
  ],
  integrations: [
    { system: 'Centre Roster', type: 'internal', description: 'Placements render on roster grid; cost flows into budget' },
    { system: 'Timesheets', type: 'internal', description: 'Reconciliation creates timesheet entries' },
    { system: 'Notification Service', type: 'internal', description: 'Email/SMS via Resend + Twilio edge functions' },
    { system: 'Agency Webhook Endpoint', type: 'outbound', description: 'HMAC-signed POSTs for shift/submission events' },
    { system: 'Storage (Cloud)', type: 'internal', description: 'Compliance document file storage' },
  ],
  businessRules: [
    { id: 'BR-AG-01', rule: 'A submission is auto-expired when SLA deadline passes without centre decision', rationale: 'Prevents stale bookings and frees the agency to re-pitch' },
    { id: 'BR-AG-02', rule: 'A placement cannot be created without an accepted submission', rationale: 'Closes the booking loop with explicit centre consent' },
    { id: 'BR-AG-03', rule: 'Submissions with missing or expired required docs are blocked', rationale: 'Legal/regulatory compliance' },
    { id: 'BR-AG-04', rule: 'Clock events outside the geofence are flagged but not rejected', rationale: 'Allow override with admin note for edge cases' },
    { id: 'BR-AG-05', rule: 'Invoice line item = max(actual_hours, minimum_engagement_hours) x charge_rate', rationale: 'Honours minimum engagement contracts' },
    { id: 'BR-AG-06', rule: 'Outbound webhook failures retry with exponential backoff up to 24h, then dead-letter', rationale: 'Reliability without infinite retries' },
  ],
  apiEndpoints,
  workflows,
};
