// Agency Integration API Specification
// REST contract for integrating 3rd-party staffing agency platforms with the Roster platform.
// All endpoints are JSON over HTTPS. Auth: Bearer token (OAuth 2.0 client credentials) +
// optional HMAC-SHA256 signature header (X-Signature) for webhooks.

export interface ApiField {
  name: string;
  type: string;
  required?: boolean;
  description: string;
  example?: string | number | boolean | null;
}

export interface ApiEndpoint {
  id: string;
  group: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  summary: string;
  description: string;
  direction: 'outbound' | 'inbound' | 'webhook';
  auth: string;
  requestHeaders?: ApiField[];
  pathParams?: ApiField[];
  queryParams?: ApiField[];
  requestBody?: ApiField[];
  requestExample?: string;
  responseBody?: ApiField[];
  responseExample?: string;
  errorCodes?: { code: string; description: string }[];
}

const commonHeaders: ApiField[] = [
  { name: 'Authorization', type: 'string', required: true, description: 'Bearer access token (OAuth2 client_credentials).', example: 'Bearer eyJhbGciOi…' },
  { name: 'X-Tenant-Id', type: 'string', required: true, description: 'Tenant (client organisation) identifier.', example: 'tnt_4f9a…' },
  { name: 'X-Request-Id', type: 'string (uuid)', required: false, description: 'Idempotency / tracing key. Echoed in the response.', example: 'a1b2c3d4-…' },
  { name: 'Content-Type', type: 'string', required: true, description: 'Must be application/json.', example: 'application/json' },
];

export const agencyApiSpec: ApiEndpoint[] = [
  // ============ AUTH ============
  {
    id: 'oauth-token',
    group: 'Authentication',
    method: 'POST',
    path: '/oauth/token',
    direction: 'outbound',
    auth: 'client_id + client_secret (Basic auth)',
    summary: 'Exchange client credentials for an access token',
    description: 'OAuth 2.0 client_credentials grant. Returns a short-lived bearer token used for all subsequent calls.',
    requestHeaders: [
      { name: 'Authorization', type: 'string', required: true, description: 'Basic base64(client_id:client_secret).' },
      { name: 'Content-Type', type: 'string', required: true, description: 'application/x-www-form-urlencoded' },
    ],
    requestBody: [
      { name: 'grant_type', type: 'string', required: true, description: 'Must be "client_credentials".', example: 'client_credentials' },
      { name: 'scope', type: 'string', required: false, description: 'Space-separated scopes: shifts.read shifts.write candidates.read placements.write timesheets.read invoices.write', example: 'shifts.read placements.write' },
    ],
    requestExample: `grant_type=client_credentials&scope=shifts.read+placements.write`,
    responseBody: [
      { name: 'access_token', type: 'string', description: 'JWT bearer token.', example: 'eyJhbGciOi…' },
      { name: 'token_type', type: 'string', description: 'Always "Bearer".', example: 'Bearer' },
      { name: 'expires_in', type: 'integer', description: 'Lifetime in seconds.', example: 3600 },
      { name: 'scope', type: 'string', description: 'Granted scopes.', example: 'shifts.read placements.write' },
    ],
    responseExample: `{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "shifts.read placements.write"
}`,
    errorCodes: [
      { code: '401 invalid_client', description: 'client_id / client_secret rejected.' },
      { code: '400 invalid_scope', description: 'Requested scope not allowed for this agency.' },
    ],
  },

  // ============ AGENCY PROFILE ============
  {
    id: 'agency-register',
    group: 'Agency Profile',
    method: 'POST',
    path: '/v1/agencies',
    direction: 'inbound',
    auth: 'Bearer (admin scope)',
    summary: 'Register a new 3rd-party agency',
    description: 'Called by the Roster platform admin when onboarding a new agency partner. Returns the agency record plus a one-time bootstrap secret used to exchange for OAuth credentials.',
    requestHeaders: commonHeaders,
    requestBody: [
      { name: 'name', type: 'string', required: true, description: 'Legal/registered name.', example: 'Bright Staffing Pty Ltd' },
      { name: 'tradingName', type: 'string', required: false, description: 'Public trading name.', example: 'Bright Staff' },
      { name: 'abn', type: 'string', required: true, description: 'Australian Business Number (11 digits).', example: '53 004 085 616' },
      { name: 'primaryContactName', type: 'string', required: true, description: 'Account owner full name.' },
      { name: 'primaryContactEmail', type: 'string (email)', required: true, description: 'Account owner email.' },
      { name: 'primaryContactPhone', type: 'string (E.164)', required: true, description: 'Account owner phone.' },
      { name: 'address', type: 'object', required: true, description: '{ street, suburb, state, postcode, country }' },
      { name: 'serviceCategories', type: 'string[]', required: true, description: 'Role types the agency supplies.', example: '["Educator","Cook"]' },
      { name: 'coverageZones', type: 'object[]', required: true, description: '[{ name, postcodes[], responseSlaMinutes }]' },
      { name: 'applicableAwards', type: 'string[]', required: false, description: 'Award codes the agency operates under.', example: '["MA000120"]' },
      { name: 'webhookUrl', type: 'string (uri)', required: true, description: 'HTTPS endpoint that will receive shift / placement events.' },
      { name: 'webhookSecret', type: 'string', required: true, description: 'Shared secret used to sign X-Signature header.' },
    ],
    requestExample: `{
  "name": "Bright Staffing Pty Ltd",
  "abn": "53004085616",
  "primaryContactName": "Sarah Lee",
  "primaryContactEmail": "sarah@brightstaff.com.au",
  "primaryContactPhone": "+61400111222",
  "address": { "street": "12 King St", "suburb": "Sydney", "state": "NSW", "postcode": "2000", "country": "AU" },
  "serviceCategories": ["Educator", "Cook"],
  "coverageZones": [{ "name": "Inner Sydney", "postcodes": ["2000","2010","2011"], "responseSlaMinutes": 30 }],
  "webhookUrl": "https://api.brightstaff.com.au/lovable/events",
  "webhookSecret": "whsec_3f9c…"
}`,
    responseBody: [
      { name: 'id', type: 'string', description: 'Agency identifier.', example: 'agy_01HXYZ…' },
      { name: 'status', type: 'enum', description: 'pending | active | suspended | inactive', example: 'pending' },
      { name: 'clientId', type: 'string', description: 'OAuth client_id issued to the agency.' },
      { name: 'clientSecret', type: 'string', description: 'OAuth client_secret. Shown ONCE — store securely.' },
      { name: 'createdAt', type: 'string (ISO-8601)', description: 'Creation timestamp.' },
    ],
    responseExample: `{
  "id": "agy_01HXYZABCD1234",
  "status": "pending",
  "clientId": "cli_brightstaff_prod",
  "clientSecret": "cs_8d4b…(shown once)",
  "createdAt": "2026-06-10T09:14:22Z"
}`,
    errorCodes: [
      { code: '409 abn_exists', description: 'An agency with this ABN is already registered.' },
      { code: '422 validation_error', description: 'Missing or malformed fields. See `errors[]` in response.' },
    ],
  },

  {
    id: 'agency-get',
    group: 'Agency Profile',
    method: 'GET',
    path: '/v1/agencies/{agencyId}',
    direction: 'outbound',
    auth: 'Bearer',
    summary: 'Retrieve agency profile, compliance score & metrics',
    description: 'Returns the full agency record including compliance documents, rate cards, fill rate and reliability score.',
    pathParams: [{ name: 'agencyId', type: 'string', required: true, description: 'Agency identifier.', example: 'agy_01HXYZ…' }],
    responseBody: [
      { name: 'id', type: 'string', description: 'Agency id.' },
      { name: 'name', type: 'string', description: 'Legal name.' },
      { name: 'status', type: 'enum', description: 'pending | active | suspended | inactive' },
      { name: 'complianceScore', type: 'integer (0-100)', description: 'Aggregate compliance score.' },
      { name: 'fillRate', type: 'number (0-100)', description: 'Percentage of requested shifts filled.' },
      { name: 'avgTimeToFill', type: 'integer (minutes)', description: 'Average time-to-fill.' },
      { name: 'reliabilityScore', type: 'integer (0-100)', description: 'Show-rate based score.' },
      { name: 'complianceDocuments', type: 'object[]', description: 'See ComplianceDocument schema.' },
      { name: 'rateCards', type: 'object[]', description: 'See RateCard schema.' },
    ],
    responseExample: `{
  "id": "agy_01HXYZ…",
  "name": "Bright Staffing Pty Ltd",
  "status": "active",
  "complianceScore": 96,
  "fillRate": 87.4,
  "avgTimeToFill": 42,
  "reliabilityScore": 92,
  "complianceDocuments": [
    { "type": "insurance", "name": "Public Liability $20M", "expiryDate": "2027-03-31", "status": "valid" }
  ],
  "rateCards": [
    { "roleName": "Educator – Diploma", "baseRate": 38.50, "casualLoading": 0.25, "weekendRate": 48.13, "publicHolidayRate": 96.25, "effectiveFrom": "2026-01-01" }
  ]
}`,
  },

  // ============ COMPLIANCE ============
  {
    id: 'compliance-upload',
    group: 'Compliance',
    method: 'POST',
    path: '/v1/agencies/{agencyId}/compliance-documents',
    direction: 'inbound',
    auth: 'Bearer (agency)',
    summary: 'Upload or update a compliance document',
    description: 'Agency uploads insurance certificates, licences, policies, etc. The platform verifies expiry and recomputes complianceScore.',
    pathParams: [{ name: 'agencyId', type: 'string', required: true, description: 'Agency id.' }],
    requestBody: [
      { name: 'type', type: 'enum', required: true, description: 'abn | insurance | licence | certification | policy | other' },
      { name: 'name', type: 'string', required: true, description: 'Display name.', example: 'Public Liability Insurance' },
      { name: 'documentNumber', type: 'string', required: false, description: 'Reference / policy number.' },
      { name: 'issueDate', type: 'string (ISO date)', required: true, description: 'Issue date.' },
      { name: 'expiryDate', type: 'string (ISO date)', required: true, description: 'Expiry date.' },
      { name: 'fileUrl', type: 'string (uri)', required: true, description: 'Signed URL to the PDF/image (must be HTTPS, ≤ 25 MB).' },
    ],
    requestExample: `{
  "type": "insurance",
  "name": "Public Liability $20M",
  "documentNumber": "PL-998877",
  "issueDate": "2026-04-01",
  "expiryDate": "2027-03-31",
  "fileUrl": "https://files.brightstaff.com.au/pl-998877.pdf?sig=…"
}`,
    responseBody: [
      { name: 'id', type: 'string', description: 'Document id.' },
      { name: 'status', type: 'enum', description: 'valid | expiring_soon | expired | missing' },
      { name: 'uploadedAt', type: 'string (ISO-8601)', description: 'Server timestamp.' },
      { name: 'verifiedAt', type: 'string|null', description: 'When platform verified it (null until reviewed).' },
    ],
    responseExample: `{ "id":"doc_88f2…","status":"valid","uploadedAt":"2026-06-10T09:20:11Z","verifiedAt":null }`,
  },

  // ============ SHIFT REQUESTS (Broadcast → Agency) ============
  {
    id: 'shift-broadcast',
    group: 'Shift Requests',
    method: 'POST',
    path: '{agency.webhookUrl}/shifts.broadcast',
    direction: 'webhook',
    auth: 'HMAC X-Signature',
    summary: 'Broadcast a new open shift to the agency',
    description: 'Fired when the tenant broadcasts an open shift. Agency must respond 200 within 5 s; matching candidates are submitted asynchronously via POST /v1/shift-requests/{id}/candidates.',
    requestHeaders: [
      { name: 'X-Signature', type: 'string', required: true, description: 'hex(HMAC_SHA256(webhookSecret, rawBody))' },
      { name: 'X-Event', type: 'string', required: true, description: 'Event name.', example: 'shift.broadcast' },
      { name: 'X-Event-Id', type: 'string (uuid)', required: true, description: 'Unique event id (use for idempotency).' },
    ],
    requestBody: [
      { name: 'shiftRequestId', type: 'string', required: true, description: 'Platform shift request id.', example: 'sr_01HXYZ…' },
      { name: 'tenantId', type: 'string', required: true, description: 'Originating tenant.' },
      { name: 'clientName', type: 'string', required: true, description: 'End-client / location name.' },
      { name: 'locationAddress', type: 'string', required: true, description: 'Address of the work site.' },
      { name: 'date', type: 'string (ISO date)', required: true, description: 'Shift date.' },
      { name: 'startTime', type: 'string (HH:mm)', required: true, description: 'Local start time.' },
      { name: 'endTime', type: 'string (HH:mm)', required: true, description: 'Local end time.' },
      { name: 'breakMinutes', type: 'integer', required: true, description: 'Unpaid break minutes.' },
      { name: 'requirements', type: 'object[]', required: true, description: '[{ roleName, quantity, skills[], certifications[], minExperience }]' },
      { name: 'urgency', type: 'enum', required: true, description: 'standard | urgent | critical' },
      { name: 'fillMode', type: 'enum', required: true, description: 'express (auto-confirm first qualified) | managed (await agency selection)' },
      { name: 'slaDeadline', type: 'string (ISO-8601)', required: true, description: 'Respond-by deadline.' },
      { name: 'payRate', type: 'number', required: true, description: 'Pay rate $/hr to worker.' },
      { name: 'chargeRate', type: 'number', required: true, description: 'Agreed charge rate $/hr.' },
      { name: 'instructions', type: 'string', required: false, description: 'Free-text site instructions.' },
    ],
    requestExample: `{
  "shiftRequestId": "sr_01HXYZ",
  "tenantId": "tnt_4f9a",
  "clientName": "Sunrise Early Learning – Bondi",
  "locationAddress": "12 Beach Rd, Bondi NSW 2026",
  "date": "2026-06-15",
  "startTime": "07:30",
  "endTime": "16:30",
  "breakMinutes": 30,
  "requirements": [
    { "roleName": "Educator – Diploma", "quantity": 2, "skills": ["0-2yr room"], "certifications": ["WWCC","First Aid"], "minExperience": 2 }
  ],
  "urgency": "urgent",
  "fillMode": "managed",
  "slaDeadline": "2026-06-14T18:00:00+10:00",
  "payRate": 38.50,
  "chargeRate": 62.00,
  "instructions": "Use staff entry on Curlewis St."
}`,
    responseBody: [
      { name: 'accepted', type: 'boolean', description: 'Whether the agency accepts the brief.', example: true },
      { name: 'estimatedCandidates', type: 'integer', description: 'Number of candidates the agency expects to submit.', example: 3 },
      { name: 'declineReason', type: 'string', description: 'Required when accepted=false.' },
    ],
    responseExample: `{ "accepted": true, "estimatedCandidates": 3 }`,
  },

  {
    id: 'submit-candidates',
    group: 'Shift Requests',
    method: 'POST',
    path: '/v1/shift-requests/{shiftRequestId}/candidates',
    direction: 'inbound',
    auth: 'Bearer (agency)',
    summary: 'Submit candidate matches for a broadcast shift',
    description: 'Agency posts one or more candidates it proposes for the shift. Platform runs eligibility + compliance checks and returns per-candidate status.',
    pathParams: [{ name: 'shiftRequestId', type: 'string', required: true, description: 'Platform shift request id.' }],
    requestBody: [
      { name: 'candidates', type: 'object[]', required: true, description: 'See Candidate schema below.' },
    ],
    requestExample: `{
  "candidates": [
    {
      "externalId": "bsc_993",
      "firstName": "Maria",
      "lastName": "Nguyen",
      "email": "maria.n@brightstaff.com.au",
      "phone": "+61400999111",
      "primaryRole": "Educator – Diploma",
      "yearsExperience": 5,
      "awardClassification": "CS Level 3.4",
      "payRate": 38.50,
      "skills": [{ "name":"0-2yr room","level":"advanced","yearsExperience":4 }],
      "certifications": [
        { "name":"WWCC","issuer":"NSW Govt","expiryDate":"2028-02-10","status":"valid" },
        { "name":"First Aid","issuer":"St John","expiryDate":"2026-09-01","status":"valid" }
      ],
      "complianceScore": 98,
      "reliabilityScore": 95,
      "hoursWorkedThisWeek": 22
    }
  ]
}`,
    responseBody: [
      { name: 'results', type: 'object[]', description: '[{ externalId, candidateId, matchScore, isEligible, ineligibilityReasons[] }]' },
    ],
    responseExample: `{
  "results": [
    { "externalId":"bsc_993","candidateId":"cand_77a1","matchScore":92,"isEligible":true }
  ]
}`,
    errorCodes: [
      { code: '404 shift_not_found', description: 'Shift request id not recognised.' },
      { code: '410 shift_closed', description: 'SLA expired or shift already filled.' },
    ],
  },

  // ============ PLACEMENTS ============
  {
    id: 'placement-create',
    group: 'Placements',
    method: 'POST',
    path: '/v1/placements',
    direction: 'inbound',
    auth: 'Bearer (agency)',
    summary: 'Confirm a placement (assign candidate to shift)',
    description: 'In express mode this auto-confirms; in managed mode this awaits client approval and returns status=pending.',
    requestBody: [
      { name: 'shiftRequestId', type: 'string', required: true, description: 'Target shift.' },
      { name: 'candidateId', type: 'string', required: true, description: 'Platform candidate id (returned from submit-candidates).' },
      { name: 'scheduledStart', type: 'string (ISO-8601)', required: true, description: 'Local datetime with offset.' },
      { name: 'scheduledEnd', type: 'string (ISO-8601)', required: true, description: 'Local datetime with offset.' },
      { name: 'breakMinutes', type: 'integer', required: true, description: 'Unpaid break minutes.' },
      { name: 'isBackup', type: 'boolean', required: false, description: 'Mark as standby candidate.', example: false },
      { name: 'backupPriority', type: 'integer', required: false, description: '1 = first standby.' },
    ],
    requestExample: `{
  "shiftRequestId": "sr_01HXYZ",
  "candidateId": "cand_77a1",
  "scheduledStart": "2026-06-15T07:30:00+10:00",
  "scheduledEnd": "2026-06-15T16:30:00+10:00",
  "breakMinutes": 30,
  "isBackup": false
}`,
    responseBody: [
      { name: 'id', type: 'string', description: 'Placement id.' },
      { name: 'status', type: 'enum', description: 'pending | confirmed | checked_in | completed | no_show | cancelled' },
      { name: 'assignedAt', type: 'string (ISO-8601)', description: 'Assignment timestamp.' },
    ],
    responseExample: `{ "id":"plc_55ab","status":"confirmed","assignedAt":"2026-06-10T09:42:11Z" }`,
    errorCodes: [
      { code: '409 already_filled', description: 'All positions already filled.' },
      { code: '422 not_eligible', description: 'Candidate failed eligibility (returned reasons in errors[]).' },
    ],
  },

  {
    id: 'placement-update',
    group: 'Placements',
    method: 'PATCH',
    path: '/v1/placements/{placementId}',
    direction: 'inbound',
    auth: 'Bearer (agency)',
    summary: 'Update placement status (cancel / replace candidate)',
    description: 'Used to cancel a placement or swap to another candidate before the shift starts.',
    pathParams: [{ name: 'placementId', type: 'string', required: true, description: 'Placement id.' }],
    requestBody: [
      { name: 'status', type: 'enum', required: false, description: 'cancelled | confirmed' },
      { name: 'replacementCandidateId', type: 'string', required: false, description: 'New candidate id (for swap).' },
      { name: 'reason', type: 'string', required: false, description: 'Required when status=cancelled.' },
    ],
    requestExample: `{ "status":"cancelled","reason":"Candidate sick" }`,
    responseExample: `{ "id":"plc_55ab","status":"cancelled","updatedAt":"2026-06-14T22:10:00+10:00" }`,
  },

  {
    id: 'placement-webhook',
    group: 'Placements',
    method: 'POST',
    path: '{agency.webhookUrl}/placement.status',
    direction: 'webhook',
    auth: 'HMAC X-Signature',
    summary: 'Placement status change pushed to agency',
    description: 'Emitted when status transitions: confirmed → checked_in → completed → no_show / cancelled.',
    requestBody: [
      { name: 'placementId', type: 'string', required: true, description: 'Placement id.' },
      { name: 'shiftRequestId', type: 'string', required: true, description: 'Related shift.' },
      { name: 'candidateId', type: 'string', required: true, description: 'Candidate id.' },
      { name: 'status', type: 'enum', required: true, description: 'pending|confirmed|checked_in|completed|no_show|cancelled' },
      { name: 'clockedInAt', type: 'string (ISO-8601)', required: false, description: 'Actual clock-in.' },
      { name: 'clockedOutAt', type: 'string (ISO-8601)', required: false, description: 'Actual clock-out.' },
      { name: 'geoLocationClockIn', type: 'object', required: false, description: '{ lat, lng }' },
      { name: 'occurredAt', type: 'string (ISO-8601)', required: true, description: 'When this event happened.' },
    ],
    requestExample: `{
  "placementId":"plc_55ab",
  "shiftRequestId":"sr_01HXYZ",
  "candidateId":"cand_77a1",
  "status":"checked_in",
  "clockedInAt":"2026-06-15T07:28:42+10:00",
  "geoLocationClockIn":{ "lat":-33.8915,"lng":151.2767 },
  "occurredAt":"2026-06-15T07:28:43+10:00"
}`,
    responseExample: `{ "received": true }`,
  },

  // ============ TIMESHEETS ============
  {
    id: 'timesheet-submit',
    group: 'Timesheets',
    method: 'POST',
    path: '/v1/placements/{placementId}/timesheet',
    direction: 'inbound',
    auth: 'Bearer (agency)',
    summary: 'Submit a timesheet for an agency placement',
    description: 'Submitted after the shift ends. Triggers approval workflow on the client side.',
    pathParams: [{ name: 'placementId', type: 'string', required: true, description: 'Placement id.' }],
    requestBody: [
      { name: 'actualStart', type: 'string (ISO-8601)', required: true, description: 'Actual start.' },
      { name: 'actualEnd', type: 'string (ISO-8601)', required: true, description: 'Actual end.' },
      { name: 'breakMinutes', type: 'integer', required: true, description: 'Unpaid break minutes taken.' },
      { name: 'grossHours', type: 'number', required: true, description: 'Hours before break deduction.' },
      { name: 'netHours', type: 'number', required: true, description: 'Hours after break deduction.' },
      { name: 'overtimeHours', type: 'number', required: false, description: 'Overtime portion.' },
      { name: 'allowances', type: 'object[]', required: false, description: '[{ name, type, amount, taxable }]' },
      { name: 'exceptions', type: 'object[]', required: false, description: '[{ reason, note }] — see ExceptionReason enum.' },
      { name: 'supervisorSignatureUrl', type: 'string (uri)', required: false, description: 'Signed image of supervisor approval.' },
      { name: 'notes', type: 'string', required: false, description: 'Free-text notes.' },
    ],
    requestExample: `{
  "actualStart":"2026-06-15T07:28:42+10:00",
  "actualEnd":"2026-06-15T16:32:10+10:00",
  "breakMinutes":30,
  "grossHours":9.05,
  "netHours":8.55,
  "overtimeHours":0.55,
  "allowances":[{ "name":"Travel","type":"per_shift","amount":15.00,"taxable":true }],
  "exceptions":[{ "reason":"unpaid_overtime","note":"Stayed late for handover" }],
  "supervisorSignatureUrl":"https://files.brightstaff.com.au/sig_plc55ab.png"
}`,
    responseBody: [
      { name: 'timesheetId', type: 'string', description: 'Platform timesheet id.' },
      { name: 'status', type: 'enum', description: 'pending | approved | rejected' },
      { name: 'submittedAt', type: 'string (ISO-8601)', description: 'Server timestamp.' },
    ],
    responseExample: `{ "timesheetId":"ts_91cd","status":"pending","submittedAt":"2026-06-15T16:40:02+10:00" }`,
  },

  {
    id: 'timesheet-status-webhook',
    group: 'Timesheets',
    method: 'POST',
    path: '{agency.webhookUrl}/timesheet.status',
    direction: 'webhook',
    auth: 'HMAC X-Signature',
    summary: 'Timesheet approved / rejected event',
    requestBody: [
      { name: 'timesheetId', type: 'string', required: true, description: 'Timesheet id.' },
      { name: 'placementId', type: 'string', required: true, description: 'Related placement.' },
      { name: 'status', type: 'enum', required: true, description: 'approved | rejected' },
      { name: 'reviewedBy', type: 'string', required: true, description: 'Reviewer name.' },
      { name: 'reviewedAt', type: 'string (ISO-8601)', required: true, description: 'Decision timestamp.' },
      { name: 'rejectionReason', type: 'string', required: false, description: 'Required when status=rejected.' },
      { name: 'approvedHours', type: 'number', required: false, description: 'Adjusted hours if reviewer edited.' },
    ],
    requestExample: `{
  "timesheetId":"ts_91cd",
  "placementId":"plc_55ab",
  "status":"approved",
  "reviewedBy":"Jane Manager",
  "reviewedAt":"2026-06-16T09:14:00+10:00",
  "approvedHours":8.55
}`,
    responseExample: `{ "received": true }`,
  },

  // ============ INVOICES ============
  {
    id: 'invoice-create',
    group: 'Invoices',
    method: 'POST',
    path: '/v1/invoices',
    direction: 'inbound',
    auth: 'Bearer (agency)',
    summary: 'Generate invoice for approved timesheets',
    description: 'Roll up one or more approved timesheets into an invoice. Platform validates line items against approved hours and rate cards.',
    requestBody: [
      { name: 'invoiceNumber', type: 'string', required: true, description: 'Agency-issued number.', example: 'INV-2026-00091' },
      { name: 'periodStart', type: 'string (ISO date)', required: true, description: 'Billing period start.' },
      { name: 'periodEnd', type: 'string (ISO date)', required: true, description: 'Billing period end.' },
      { name: 'clientId', type: 'string', required: true, description: 'Billed client (tenant) id.' },
      { name: 'lineItems', type: 'object[]', required: true, description: '[{ placementId, hours, rate, loadings[], total }]' },
      { name: 'subtotal', type: 'number', required: true, description: 'Sum of line items ex-GST.' },
      { name: 'gst', type: 'number', required: true, description: 'GST amount (10% AU).' },
      { name: 'total', type: 'number', required: true, description: 'Grand total inc-GST.' },
      { name: 'dueDate', type: 'string (ISO date)', required: true, description: 'Payment due date.' },
      { name: 'pdfUrl', type: 'string (uri)', required: false, description: 'Signed URL to invoice PDF.' },
    ],
    requestExample: `{
  "invoiceNumber":"INV-2026-00091",
  "periodStart":"2026-06-08",
  "periodEnd":"2026-06-14",
  "clientId":"tnt_4f9a",
  "lineItems":[
    { "placementId":"plc_55ab","hours":8.55,"rate":62.00,
      "loadings":[{ "type":"weekend","percentage":25,"amount":132.55 }],
      "total":662.65 }
  ],
  "subtotal":662.65,
  "gst":66.27,
  "total":728.92,
  "dueDate":"2026-07-14"
}`,
    responseBody: [
      { name: 'id', type: 'string', description: 'Platform invoice id.' },
      { name: 'status', type: 'enum', description: 'draft | sent | paid | overdue | disputed' },
      { name: 'createdAt', type: 'string (ISO-8601)', description: 'Server timestamp.' },
    ],
    responseExample: `{ "id":"inv_22ef","status":"sent","createdAt":"2026-06-16T10:00:00+10:00" }`,
    errorCodes: [
      { code: '422 line_item_mismatch', description: 'A line item does not match approved hours or contracted rate.' },
      { code: '409 duplicate_invoice_number', description: 'invoiceNumber already used for this agency.' },
    ],
  },

  {
    id: 'invoice-status-webhook',
    group: 'Invoices',
    method: 'POST',
    path: '{agency.webhookUrl}/invoice.status',
    direction: 'webhook',
    auth: 'HMAC X-Signature',
    summary: 'Invoice payment / dispute update',
    requestBody: [
      { name: 'invoiceId', type: 'string', required: true, description: 'Platform invoice id.' },
      { name: 'invoiceNumber', type: 'string', required: true, description: 'Agency invoice number.' },
      { name: 'status', type: 'enum', required: true, description: 'sent | paid | overdue | disputed' },
      { name: 'paidAt', type: 'string (ISO-8601)', required: false, description: 'When payment was settled.' },
      { name: 'amountPaid', type: 'number', required: false, description: 'Amount settled.' },
      { name: 'disputeReason', type: 'string', required: false, description: 'Required when status=disputed.' },
    ],
    requestExample: `{
  "invoiceId":"inv_22ef",
  "invoiceNumber":"INV-2026-00091",
  "status":"paid",
  "paidAt":"2026-06-30T11:22:00+10:00",
  "amountPaid":728.92
}`,
    responseExample: `{ "received": true }`,
  },

  // ============ ANALYTICS ============
  {
    id: 'analytics-agency',
    group: 'Analytics',
    method: 'GET',
    path: '/v1/agencies/{agencyId}/analytics',
    direction: 'outbound',
    auth: 'Bearer',
    summary: 'Fetch agency performance metrics',
    pathParams: [{ name: 'agencyId', type: 'string', required: true, description: 'Agency id.' }],
    queryParams: [
      { name: 'from', type: 'string (ISO date)', required: false, description: 'Period start.' },
      { name: 'to', type: 'string (ISO date)', required: false, description: 'Period end.' },
    ],
    responseBody: [
      { name: 'totalShiftsRequested', type: 'integer', description: 'Shifts broadcast in period.' },
      { name: 'totalShiftsFilled', type: 'integer', description: 'Shifts successfully filled.' },
      { name: 'fillRate', type: 'number', description: 'Percentage filled.' },
      { name: 'avgTimeToFillMinutes', type: 'integer', description: 'Avg minutes to fill.' },
      { name: 'totalRevenue', type: 'number', description: 'Billed revenue.' },
      { name: 'totalCost', type: 'number', description: 'Worker pay cost.' },
      { name: 'grossProfit', type: 'number', description: 'Revenue − cost.' },
      { name: 'marginPercentage', type: 'number', description: 'Margin %.' },
      { name: 'complianceAlerts', type: 'integer', description: 'Current open compliance alerts.' },
      { name: 'expiringDocuments', type: 'integer', description: 'Docs expiring < 30 days.' },
    ],
    responseExample: `{
  "totalShiftsRequested":124,"totalShiftsFilled":108,"fillRate":87.1,
  "avgTimeToFillMinutes":42,"totalRevenue":58420.00,"totalCost":36210.00,
  "grossProfit":22210.00,"marginPercentage":38.0,
  "complianceAlerts":1,"expiringDocuments":2
}`,
  },
];

export const agencyApiCommonHeaders = commonHeaders;

export const agencyApiErrorEnvelope = {
  description: 'All 4xx/5xx responses follow this envelope.',
  example: `{
  "error": {
    "code": "validation_error",
    "message": "One or more fields are invalid.",
    "requestId": "a1b2c3d4-…",
    "errors": [
      { "field": "abn", "code": "invalid_format", "message": "ABN must be 11 digits." }
    ]
  }
}`,
};

export const agencyApiWebhookNotes = [
  'All webhooks require X-Signature: hex(HMAC_SHA256(webhookSecret, rawBody)). Reject if mismatch.',
  'X-Event-Id is unique per event — use it for idempotency (ignore duplicates).',
  'Respond within 5 seconds with HTTP 2xx. Non-2xx triggers exponential-backoff retry up to 24h.',
  'Retries use the same X-Event-Id; ensure handler is idempotent.',
];
