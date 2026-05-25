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
  "locationName": "Sunshine ELC Bondi",
  "locationAddress": "12 Campbell Pde, Bondi NSW 2026",
  "areaId": "area-toddler-2",
  "areaName": "Toddler Room 2",
  "industry": "childcare",
  "jurisdiction": "NSW-AU",

  "date": "2026-06-04",
  "startTime": "07:00",
  "endTime": "15:30",
  "breakMinutes": 30,
  "shiftType": "regular",                 // regular|on_call|sleepover|split

  "role": {
    "id": "role-diploma-educator",
    "name": "Diploma Educator",
    "awardClassification": "CSE Level 3.4",
    "minExperienceYears": 1
  },

  "qualificationRequirements": [
    { "code": "WWCC",      "name": "Working With Children Check",  "mandatory": true,  "jurisdiction": "NSW-AU", "mustBeCurrentOn": "2026-06-04" },
    { "code": "FIRSTAID",  "name": "HLTAID012 First Aid",          "mandatory": true,  "mustBeCurrentOn": "2026-06-04" },
    { "code": "DIPLOMA_ECE","name":"Diploma of Early Childhood",   "mandatory": true,  "acceptedAlternatives": ["ACECQA_EQUIV_DIPLOMA"] },
    { "code": "ANAPHYLAXIS","name": "Anaphylaxis Training",        "mandatory": false, "preferred": true }
  ],
  "skillRequirements": ["nappy_change", "lead_room"],
  "languagePreferences": ["en"],

  "compensation": {                       // all fields optional except currency
    "currency": "AUD",
    "rateCardId": "rc-9",                 // if omitted, use payRate/chargeRate below
    "payRate": 48.00,                     // optional - hourly rate paid to worker
    "chargeRate": 62.00,                  // optional - hourly rate charged to centre
    "salaryOffered": null,                // optional flat salary (for perm/contract conversions)
    "loadings": {
      "casualLoadingPct": 25,
      "weekendMultiplier": 1.5,
      "publicHolidayMultiplier": 2.5,
      "overtimeMultiplier": 1.5
    },
    "allowances": [
      { "code": "TRAVEL", "amount": 15.00, "unit": "per_shift" }
    ],
    "estimatedShiftValue": 527.00,        // calculated, for agency reference
    "negotiable": false
  },

  "uniformAndPpe": { "dressCode": "Closed shoes, agency polo", "ppeProvided": ["gloves"] },
  "supervisor": { "name": "Sarah Chen", "phone": "+61-400-111-222" },
  "checkInMethod": "qr",                  // qr|geofence|pin|kiosk|manual
  "geofence": { "lat": -33.8915, "lng": 151.2767, "radiusMeters": 150 },

  "urgency": "high",                      // low|medium|high|critical
  "fillMode": "managed",                  // express|managed
  "notes": "Cover for sick leave; room has 12 toddlers",
  "agencyIds": ["agc-1","agc-2"],
  "responseDeadline": "2026-06-03T18:00:00Z",
  "preferredCandidateIds": ["cand-22"],   // optional bias for matching
  "blockedCandidateIds": []
}`,
    },
    response: {
      status: 201,
      body: `{
  "id": "sr-7781",
  "status": "broadcasting",
  "broadcastedTo": ["agc-1","agc-2"],
  "createdAt": "2026-06-03T09:12:11Z",
  "expiresAt": "2026-06-03T18:00:00Z",
  "estimatedShiftValue": 527.00,
  "qualificationRequirementCount": 4
}`,
    },
    errors: [
      { status: 400, code: 'INVALID_TIME_RANGE', description: 'endTime must be after startTime' },
      { status: 400, code: 'MISSING_QUALIFICATIONS', description: 'qualificationRequirements is required for clinical/childcare roles' },
      { status: 400, code: 'INVALID_RATE', description: 'payRate must be >= award minimum for the classification' },
      { status: 409, code: 'DUPLICATE_REQUEST', description: 'Identical open request already exists' },
    ],
    sideEffects: [
      'Webhook POST /agency-webhook/shift.broadcast fired to each agency with full shift payload',
      'Notification dispatched via agencyNotificationService',
      'Matching engine pre-filters agency talent pools using qualificationRequirements',
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
      "locationAddress":"12 Campbell Pde, Bondi NSW 2026",
      "areaName":"Toddler Room 2",
      "date":"2026-06-04","startTime":"07:00","endTime":"15:30","breakMinutes":30,
      "shiftType":"regular",
      "role":{"name":"Diploma Educator","awardClassification":"CSE Level 3.4","minExperienceYears":1},
      "qualificationRequirements":[
        {"code":"WWCC","mandatory":true,"jurisdiction":"NSW-AU"},
        {"code":"FIRSTAID","mandatory":true},
        {"code":"DIPLOMA_ECE","mandatory":true},
        {"code":"ANAPHYLAXIS","mandatory":false,"preferred":true}
      ],
      "skillRequirements":["nappy_change","lead_room"],
      "compensation":{
        "currency":"AUD","payRate":48.0,"chargeRate":62.0,
        "salaryOffered":null,"estimatedShiftValue":527.0,"negotiable":false
      },
      "urgency":"high","fillMode":"managed",
      "checkInMethod":"qr","supervisor":{"name":"Sarah Chen"},
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
    name: 'Submit Candidates (Agency -> Centre, multi-candidate)',
    method: 'POST',
    path: '/api/v1/agency/shift-requests/:id/submissions',
    description: 'Agency submits ONE submission containing N candidate proposals for a single shift request. Each candidate carries its own role offer, proposed rate, compliance snapshot, availability confirmation and ranking. Centre then accepts/rejects per candidate. Supports primary + backup ordering and partial fills for multi-slot shifts.',
    auth: 'Bearer JWT (agency)',
    consumer: 'AgencyPortal -> ShiftMatchingPanel',
    request: {
      pathParams: { id: 'sr-7781' },
      body: `{
  "shiftRequestId": "sr-7781",
  "agencyId": "agc-1",
  "submittedBy": { "userId": "agency-user-12", "name": "Mia Patel" },
  "agencyNotes": "Top 3 ranked; all confirmed available; happy to send replacement if rejected.",
  "expiresAt": "2026-06-03T13:12:11Z",            // mirrors reverse-SLA deadline
  "allowPartialFill": true,                        // centre can accept some, reject others
  "candidates": [
    {
      "candidateId": "cand-22",
      "rank": 1,                                    // 1 = primary, 2+ = backups
      "role": "primary",                            // primary|backup|alternate
      "offeredRoleId": "role-diploma-educator",
      "matchScore": 94,
      "distanceKm": 3.2,
      "availabilityConfirmedAt": "2026-06-03T09:45:00Z",
      "proposedRate": {
        "payRate": 48.00,
        "chargeRate": 62.00,
        "currency": "AUD",
        "counterOffer": false                       // true if differs from shift compensation
      },
      "complianceSnapshot": {
        "score": 96,
        "status": "compliant",
        "missingRequired": [],
        "qualificationsMatched": ["WWCC","FIRSTAID","DIPLOMA_ECE"],
        "qualificationsPreferredMatched": ["ANAPHYLAXIS"],
        "qualificationsExpiringWithin30Days": [],
        "snapshotAt": "2026-06-03T09:45:11Z"
      },
      "fatigueCheck": { "hoursThisWeek": 22, "withinLimits": true },
      "candidateConsentToShare": true,              // candidate consented to share profile with this centre
      "candidateAcceptanceStatus": "pending_offer", // pending_offer|pre_accepted (worker pre-approved by agency)
      "notes": "Has worked at this centre 4 times; 4.9★ avg"
    },
    {
      "candidateId": "cand-45",
      "rank": 2,
      "role": "backup",
      "offeredRoleId": "role-diploma-educator",
      "matchScore": 88,
      "distanceKm": 6.1,
      "availabilityConfirmedAt": "2026-06-03T09:46:00Z",
      "proposedRate": { "payRate": 48.00, "chargeRate": 62.00, "currency": "AUD", "counterOffer": false },
      "complianceSnapshot": { "score": 92, "status": "compliant", "missingRequired": [],
        "qualificationsMatched": ["WWCC","FIRSTAID","DIPLOMA_ECE"], "snapshotAt": "2026-06-03T09:46:05Z" },
      "candidateConsentToShare": true,
      "candidateAcceptanceStatus": "pending_offer"
    },
    {
      "candidateId": "cand-77",
      "rank": 3,
      "role": "alternate",
      "offeredRoleId": "role-cert3-educator",       // alternate role (lower qualification)
      "matchScore": 81,
      "distanceKm": 2.0,
      "proposedRate": { "payRate": 42.00, "chargeRate": 56.00, "currency": "AUD", "counterOffer": true },
      "complianceSnapshot": { "score": 90, "status": "compliant", "missingRequired": [],
        "qualificationsMatched": ["WWCC","FIRSTAID","CERT3_ECE"], "snapshotAt": "2026-06-03T09:46:30Z" },
      "candidateConsentToShare": true,
      "candidateAcceptanceStatus": "pending_offer"
    }
  ]
}`,
    },
    response: {
      status: 201,
      body: `{
  "submissionId": "sub-901",
  "shiftRequestId": "sr-7781",
  "status": "pending_centre_confirmation",
  "slaDeadline": "2026-06-03T13:12:11Z",
  "allowPartialFill": true,
  "totalSlotsRequested": 1,
  "totalSlotsRemaining": 1,
  "candidates": [
    { "id": "cand-22", "rank": 1, "role": "primary",   "status": "submitted", "complianceStatus": "compliant" },
    { "id": "cand-45", "rank": 2, "role": "backup",    "status": "submitted", "complianceStatus": "compliant" },
    { "id": "cand-77", "rank": 3, "role": "alternate", "status": "submitted", "complianceStatus": "compliant", "isCounterOffer": true }
  ]
}`,
    },
    errors: [
      { status: 400, code: 'EMPTY_CANDIDATES', description: 'candidates array must contain at least one entry' },
      { status: 400, code: 'DUPLICATE_RANK', description: 'rank values must be unique within the submission' },
      { status: 400, code: 'DUPLICATE_CANDIDATE', description: 'Same candidateId submitted twice in one submission' },
      { status: 409, code: 'CANDIDATE_ALREADY_SUBMITTED', description: 'Candidate already submitted for this shift by this or another agency' },
      { status: 409, code: 'CANDIDATE_DOUBLE_BOOKED', description: 'Candidate has a confirmed placement overlapping this shift' },
      { status: 422, code: 'COMPLIANCE_INELIGIBLE', description: 'One or more candidates missing required qualifications (details: { candidateId, missingRequired[] })' },
      { status: 422, code: 'CONSENT_MISSING', description: 'candidateConsentToShare must be true to submit profile to centre' },
      { status: 410, code: 'SHIFT_CLOSED', description: 'Shift request is no longer open' },
    ],
    sideEffects: [
      'Reverse SLA timer started via bookingConfirmationService (single timer for whole submission)',
      'Each candidate row persisted to agency_submission_candidates (rank-ordered)',
      'Webhook centre.submission.received fired to centre with full multi-candidate payload',
      'Counter-offers (rate mismatch) flagged for centre review',
    ],
  },
  {
    id: 'API-AG-005',
    name: 'Centre Confirm / Reject Submission (per-candidate decisions)',
    method: 'POST',
    path: '/api/v1/agency/submissions/:submissionId/decision',
    description: 'Centre records a decision per candidate within a single submission. Supports accepting one, accepting multiple (for multi-slot shifts), rejecting all, or partial fills. Each acceptance creates exactly one Placement.',
    auth: 'Bearer JWT (centre admin)',
    consumer: 'Centre -> BookingConfirmationPanel',
    request: {
      pathParams: { submissionId: 'sub-901' },
      body: `{
  "decisions": [
    {
      "candidateId": "cand-22",
      "decision": "accept",                        // accept|reject|hold|request_interview
      "acceptedRate": { "payRate": 48.00, "chargeRate": 62.00, "currency": "AUD" },
      "notes": "Confirmed for 7am start"
    },
    {
      "candidateId": "cand-45",
      "decision": "hold",                          // keep as standby backup
      "holdUntil": "2026-06-04T05:00:00Z"
    },
    {
      "candidateId": "cand-77",
      "decision": "reject",
      "rejectionReason": "rate_too_high",         // rate_too_high|under_qualified|unavailable|other
      "rejectionNotes": "Counter-offer above budget"
    }
  ],
  "closeSubmission": false                          // true = no further decisions accepted
}`,
    },
    response: {
      status: 200,
      body: `{
  "submissionId": "sub-901",
  "shiftRequestId": "sr-7781",
  "results": [
    { "candidateId": "cand-22", "decision": "accept", "placementId": "plc-555", "candidateOfferId": "off-330", "status": "confirmed_by_centre" },
    { "candidateId": "cand-45", "decision": "hold",   "status": "on_hold", "holdUntil": "2026-06-04T05:00:00Z" },
    { "candidateId": "cand-77", "decision": "reject", "status": "rejected" }
  ],
  "submissionStatus": "partially_decided",          // pending|partially_decided|closed
  "slotsFilled": 1,
  "slotsRemaining": 0,
  "decidedAt": "2026-06-03T11:00:02Z"
}`,
    },
    errors: [
      { status: 400, code: 'NO_DECISIONS', description: 'decisions array required' },
      { status: 404, code: 'CANDIDATE_NOT_IN_SUBMISSION', description: 'candidateId not part of this submission' },
      { status: 409, code: 'OVER_FILL', description: 'Cannot accept more candidates than open slots on the shift' },
      { status: 410, code: 'SLA_EXPIRED', description: 'Submission window closed; resubmit required' },
      { status: 410, code: 'COMPLIANCE_LAPSED', description: 'Compliance snapshot stale; agency must resubmit refreshed candidate' },
    ],
    sideEffects: [
      'For each accept: create candidate_shift_offer (status=offered) and Placement (status=pending_candidate)',
      'For each reject: free the slot, notify agency, record reason for analytics',
      'For each hold: keep candidate in backup queue; auto-roll if primary declines (API-AG-017)',
      'Webhook agency.submission.decided fired to agency with per-candidate result map',
      'Notification dispatched to each accepted candidate via their preferred channel',
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
  "missingRequired":[],
  "nextExpiryDate":"2026-08-01",
  "documents":[
    {
      "id":"doc-1","type":"WWCC","category":"government_check",
      "name":"Working With Children Check","number":"WWC1234567E",
      "jurisdiction":"NSW","country":"AU",
      "issuingAuthority":"NSW Office of the Children's Guardian",
      "issuedAt":"2024-01-12","expiresAt":"2029-01-11",
      "renewalCadence":"once_off_with_expiry","renewalIntervalMonths":60,
      "isMandatory":true,"isGovernmentVerified":true,
      "verificationSource":"OCG_API","verifiedAt":"2024-01-13T03:11:00Z",
      "verificationReference":"VRF-OCG-99812",
      "fileUrl":"https://storage/.../doc-1.pdf","fileMimeType":"application/pdf",
      "fileSizeBytes":184221,"uploadedBy":"candidate",
      "uploadedAt":"2024-01-12T10:00:00Z","status":"valid",
      "candidateAcknowledgedAt":"2024-01-12T10:01:00Z"
    },
    {
      "id":"doc-2","type":"FirstAid","category":"qualification",
      "name":"HLTAID012 - First Aid in Education and Care",
      "issuingAuthority":"RTO","rtoCode":"45160",
      "issuedAt":"2023-08-01","expiresAt":"2026-08-01",
      "renewalCadence":"recurring","renewalIntervalMonths":36,
      "isMandatory":true,"isGovernmentVerified":false,"status":"expiring_soon"
    },
    {
      "id":"doc-3","type":"PoliceCheck","category":"government_check",
      "issuingAuthority":"Australian Federal Police",
      "issuedAt":"2025-11-02","renewalCadence":"recurring","renewalIntervalMonths":12,
      "isMandatory":true,"isGovernmentVerified":true,
      "verificationSource":"AFP_NPCS","status":"valid"
    },
    {
      "id":"doc-4","type":"NDISWorkerScreening","category":"government_check",
      "jurisdiction":"NSW","issuingAuthority":"NDIS Quality and Safeguards Commission",
      "expiresAt":"2030-03-15","renewalCadence":"once_off_with_expiry",
      "renewalIntervalMonths":60,"isMandatory":false,"isGovernmentVerified":true,
      "verificationSource":"NDIS_REGISTER","status":"valid"
    },
    {
      "id":"doc-5","type":"VisaWorkRights","category":"government_check",
      "country":"AU","issuingAuthority":"Department of Home Affairs",
      "subclass":"500","workHoursLimitPerFortnight":48,
      "expiresAt":"2027-02-01","renewalCadence":"once_off_with_expiry",
      "isMandatory":true,"isGovernmentVerified":true,
      "verificationSource":"VEVO","verificationReference":"VEVO-7781123","status":"valid"
    },
    {
      "id":"doc-6","type":"Immunisation","category":"health",
      "name":"AIR Immunisation History Statement",
      "issuingAuthority":"Australian Immunisation Register",
      "issuedAt":"2025-04-01","renewalCadence":"ongoing_no_expiry",
      "isMandatory":true,"isGovernmentVerified":true,
      "verificationSource":"AIR_API","status":"valid"
    },
    {
      "id":"doc-7","type":"Qualification","category":"qualification",
      "name":"Diploma of Early Childhood Education and Care (CHC50121)",
      "issuingAuthority":"TAFE NSW","rtoCode":"90003",
      "issuedAt":"2022-11-30","renewalCadence":"once_off",
      "isMandatory":true,"isGovernmentVerified":false,
      "evidenceType":"certificate_pdf","status":"valid"
    }
  ]
}`,
    },
  },
  {
    id: 'API-AG-007',
    name: 'Upload Candidate Compliance Document',
    method: 'POST',
    path: '/api/v1/agency/candidates/:candidateId/compliance',
    description: 'Multipart upload of a compliance document by agency OR candidate self-service; triggers OCR + government verification where applicable.',
    auth: 'Bearer JWT (agency admin) OR short-lived candidate token',
    consumer: 'CandidateComplianceManager / Candidate self-service portal',
    request: {
      pathParams: { candidateId: 'cand-22' },
      headers: { 'Content-Type': 'multipart/form-data' },
      body: `form-data:
  type: "WWCC"                            # WWCC|PoliceCheck|NDISWorkerScreening|VisaWorkRights|Immunisation|FirstAid|CPR|Qualification|DriversLicence|Identity|Reference|Other
  category: "government_check"            # government_check|qualification|health|identity|reference|other
  name: "Working With Children Check"
  number: "WWC1234567E"
  jurisdiction: "NSW"
  country: "AU"
  issuingAuthority: "NSW Office of the Children's Guardian"
  rtoCode: null                           # required for RTO-issued qualifications
  subclass: null                          # required for visa docs
  issuedAt: "2024-01-12"
  expiresAt: "2029-01-11"                 # null when renewalCadence in once_off|ongoing_no_expiry
  renewalCadence: "once_off_with_expiry"  # once_off|once_off_with_expiry|recurring|ongoing_no_expiry
  renewalIntervalMonths: 60               # used to auto-suggest next renewal when recurring
  isMandatory: true
  requestGovernmentVerification: true     # triggers WWCC/AFP/NDIS/VEVO/AIR lookup if supported
  candidateConsentSignedAt: "2024-01-12T10:00:00Z"  # required for govt verifications
  uploadedBy: "candidate"                 # candidate|agency_admin|centre_admin
  file: <binary>                          # PDF / JPG / PNG, max 10MB`,
    },
    response: {
      status: 201,
      body: `{
  "id":"doc-9","status":"pending_verification",
  "verificationJobId":"vrf-31",
  "renewalDueAt":"2029-01-11",
  "requiresCandidateAcknowledgement":true
}`,
    },
    errors: [
      { status: 400, code: 'CONSENT_MISSING', description: 'Government verification requested without candidate consent' },
      { status: 413, code: 'FILE_TOO_LARGE', description: 'File exceeds 10MB' },
      { status: 415, code: 'UNSUPPORTED_FILE_TYPE', description: 'Only PDF/JPG/PNG accepted' },
    ],
    sideEffects: [
      'Government verification job enqueued when verificationSource is supported',
      'Renewal reminders scheduled at T-60, T-30, T-7 days before expiresAt',
      'Compliance score recomputed',
    ],
  },
  {
    id: 'API-AG-014',
    name: 'Qualification & Document Catalogue (per role/jurisdiction)',
    method: 'GET',
    path: '/api/v1/agency/qualifications/catalogue',
    description: 'Returns the canonical list of qualifications and government checks required or recommended for a given role + jurisdiction. Drives the candidate onboarding checklist and the missingRequired calculation.',
    auth: 'Bearer JWT (any authenticated user)',
    consumer: 'Candidate onboarding wizard / CandidateComplianceManager',
    request: { queryParams: { role: 'DiplomaEducator', jurisdiction: 'NSW', industry: 'childcare' } },
    response: {
      status: 200,
      body: `{
  "role":"DiplomaEducator","jurisdiction":"NSW",
  "items":[
    {"type":"WWCC","isMandatory":true,"renewalCadence":"once_off_with_expiry","renewalIntervalMonths":60,"governmentVerified":true,"verificationSource":"OCG_API"},
    {"type":"PoliceCheck","isMandatory":true,"renewalCadence":"recurring","renewalIntervalMonths":12,"governmentVerified":true,"verificationSource":"AFP_NPCS"},
    {"type":"FirstAid","isMandatory":true,"renewalCadence":"recurring","renewalIntervalMonths":36},
    {"type":"CPR","isMandatory":true,"renewalCadence":"recurring","renewalIntervalMonths":12},
    {"type":"Qualification","isMandatory":true,"renewalCadence":"once_off","acceptedQualifications":["CHC50121","CHC50113"]},
    {"type":"Immunisation","isMandatory":true,"renewalCadence":"ongoing_no_expiry"},
    {"type":"VisaWorkRights","isMandatory":"if_non_citizen","renewalCadence":"once_off_with_expiry"},
    {"type":"NDISWorkerScreening","isMandatory":false}
  ]
}`,
    },
  },
  {
    id: 'API-AG-015',
    name: 'Trigger Government Verification',
    method: 'POST',
    path: '/api/v1/agency/compliance/:documentId/verify',
    description: 'Calls the relevant government registry to verify the document (WWCC OCG, AFP NPCS, NDIS Register, VEVO, AIR). Idempotent; safe to retry.',
    auth: 'Bearer JWT (agency admin or system)',
    consumer: 'CandidateComplianceManager / nightly verification job',
    request: {
      pathParams: { documentId: 'doc-1' },
      body: `{ "force": false, "consentReference": "consent-7781" }`,
    },
    response: {
      status: 200,
      body: `{
  "documentId":"doc-1","verificationSource":"OCG_API",
  "result":"verified","verifiedAt":"2026-05-25T03:11:00Z",
  "verificationReference":"VRF-OCG-99812",
  "registryStatus":"current","expiresAt":"2029-01-11"
}`,
    },
    errors: [
      { status: 400, code: 'CONSENT_MISSING', description: 'No candidate consent on file' },
      { status: 404, code: 'NOT_ON_REGISTRY', description: 'Document number not found on government register' },
      { status: 502, code: 'UPSTREAM_UNAVAILABLE', description: 'Registry temporarily unavailable; retry queued' },
    ],
    sideEffects: ['Document status -> valid|rejected', 'Compliance score recomputed', 'Audit log entry'],
  },
  {
    id: 'API-AG-016',
    name: 'List Documents Due for Renewal',
    method: 'GET',
    path: '/api/v1/agency/compliance/renewals',
    description: 'Returns recurring/expiring documents due within the window; used by reminder service and dashboard.',
    auth: 'Bearer JWT (agency admin)',
    consumer: 'CandidateComplianceManager renewals dashboard',
    request: { queryParams: { withinDays: '60', candidateId: 'optional', type: 'optional' } },
    response: {
      status: 200,
      body: `{
  "items":[
    {"candidateId":"cand-22","documentId":"doc-2","type":"FirstAid","expiresAt":"2026-08-01","daysUntilExpiry":68,"renewalCadence":"recurring","remindersSent":1}
  ]
}`,
    },
  },
  {
    id: 'API-AG-017',
    name: 'Candidate Accept / Decline Shift Offer',
    method: 'POST',
    path: '/api/v1/agency/offers/:offerId/response',
    description: 'Candidate accepts or declines a shift offer pushed to them after centre confirmation. Acceptance locks the placement; decline triggers backup-candidate workflow.',
    auth: 'Short-lived candidate token (magic link / app session)',
    consumer: 'Candidate mobile/web portal',
    request: {
      pathParams: { offerId: 'off-7781' },
      body: `{
  "response":"accept",                    // accept | decline
  "declineReason": null,                  // required if decline
  "acknowledgements":{
    "shiftDetailsRead":true,
    "complianceConfirmed":true,
    "travelDistanceOk":true,
    "rateAccepted":true,
    "codeOfConductAccepted":true
  },
  "signatureBase64":"...",                // optional digital signature
  "respondedAt":"2026-06-03T11:30:00Z"
}`,
    },
    response: {
      status: 200,
      body: `{
  "offerId":"off-7781","placementId":"plc-555","status":"accepted",
  "confirmedAt":"2026-06-03T11:30:01Z",
  "nextSteps":["check_in_qr_url","centre_address","supervisor_contact"]
}`,
    },
    errors: [
      { status: 409, code: 'OFFER_EXPIRED', description: 'Candidate response window passed' },
      { status: 409, code: 'OFFER_ALREADY_DECIDED', description: 'Offer already accepted/declined' },
      { status: 412, code: 'COMPLIANCE_LAPSED', description: 'Candidate doc expired between submission and acceptance' },
    ],
    sideEffects: [
      'Placement.status -> confirmed (on accept) or pending (on decline -> next backup)',
      'Webhook offer.responded fired to agency + centre',
      'Roster cell updated to show confirmed candidate',
    ],
  },
  {
    id: 'API-AG-018',
    name: 'List Candidate Pending Offers',
    method: 'GET',
    path: '/api/v1/agency/candidates/:candidateId/offers',
    description: 'Inbox of shift offers awaiting candidate acceptance with countdown timers.',
    auth: 'Short-lived candidate token',
    consumer: 'Candidate mobile/web portal',
    request: { pathParams: { candidateId: 'cand-22' }, queryParams: { status: 'pending' } },
    response: {
      status: 200,
      body: `{
  "offers":[
    {"id":"off-7781","placementId":"plc-555","centreName":"Sunshine ELC Bondi",
     "shiftDate":"2026-06-04","startTime":"07:00","endTime":"15:30",
     "role":"Diploma Educator","payRate":48.0,"travelDistanceKm":3.2,
     "respondByDeadline":"2026-06-03T12:00:00Z","status":"pending"}
  ]
}`,
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
  "payload":{
    "...":"full shift body per API-AG-001 (role, qualificationRequirements, skillRequirements, compensation incl. payRate/chargeRate/salaryOffered, supervisor, checkInMethod, geofence, uniformAndPpe, urgency, fillMode)"
  }
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
  {
    id: 'WF-AG-03',
    name: 'Candidate Self-Onboarding & Document Submission',
    trigger: 'Candidate invited by agency (magic link / app)',
    steps: [
      { step: 1, actor: 'System', action: 'Fetch qualification catalogue for role + jurisdiction', endpoint: 'API-AG-014' },
      { step: 2, actor: 'Candidate', action: 'Reviews checklist; signs consent for government verifications' },
      { step: 3, actor: 'Candidate', action: 'Uploads each required document (uploadedBy=candidate)', endpoint: 'API-AG-007' },
      { step: 4, actor: 'System', action: 'Triggers government verification where supported', endpoint: 'API-AG-015' },
      { step: 5, actor: 'Candidate', action: 'Acknowledges accuracy of uploaded data' },
      { step: 6, actor: 'Agency Admin', action: 'Reviews unverified docs; marks verified or rejected' },
      { step: 7, actor: 'System', action: 'Sets candidate status=available once missingRequired is empty' },
    ],
    outcome: 'Candidate file is complete, fully verified, and eligible for shift submissions.',
  },
  {
    id: 'WF-AG-04',
    name: 'Candidate Offer Acceptance (post centre confirmation)',
    trigger: 'Centre accepts a candidate submission (API-AG-005)',
    steps: [
      { step: 1, actor: 'System', action: 'Creates candidate_shift_offer with respond-by deadline; pushes notification' },
      { step: 2, actor: 'Candidate', action: 'Opens offer in portal', endpoint: 'API-AG-018' },
      { step: 3, actor: 'System', action: 'Re-checks compliance freshness (no doc has expired since submission)' },
      { step: 4, actor: 'Candidate', action: 'Accepts or declines with acknowledgements + signature', endpoint: 'API-AG-017' },
      { step: 5, actor: 'System', action: 'On accept -> placement.status=confirmed; on decline -> next backup or re-broadcast' },
      { step: 6, actor: 'System', action: 'Sends candidate the shift pack (address, QR check-in URL, supervisor contact)' },
    ],
    outcome: 'Placement is only "confirmed" after both centre and candidate accept; lapsed compliance is caught before shift start.',
  },
  {
    id: 'WF-AG-05',
    name: 'Document Renewal Cycle',
    trigger: 'Recurring/expiring document approaches expiresAt',
    steps: [
      { step: 1, actor: 'System', action: 'Nightly job lists renewals due in 60 days', endpoint: 'API-AG-016' },
      { step: 2, actor: 'System', action: 'Sends reminder to candidate + agency at T-60, T-30, T-7, T-1' },
      { step: 3, actor: 'Candidate', action: 'Uploads renewed document', endpoint: 'API-AG-007' },
      { step: 4, actor: 'System', action: 'Re-runs government verification', endpoint: 'API-AG-015' },
      { step: 5, actor: 'System', action: 'On expiresAt without renewal -> document.status=expired; candidate becomes ineligible for new shifts' },
    ],
    outcome: 'Recurring qualifications stay current; lapses block new placements automatically.',
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
    'Guarantee per-candidate compliance (WWCC, Police Check, NDIS, Visa, Immunisation, Qualifications) at submission AND at candidate-acceptance time',
    'Distinguish once-off, once-off-with-expiry, recurring, and ongoing documents and manage renewals automatically',
    'Allow candidates to self-upload documents and acknowledge accuracy via short-lived token (no agency login)',
    'Verify documents against official government registries (OCG, AFP, NDIS, VEVO, AIR) with consent',
    'Close the booking loop with explicit centre confirmation AND candidate acceptance (two-sided handshake)',
    'Eliminate manual timesheet entry through clock-event -> timesheet bridge',
    'Provide auditable invoicing (charge vs pay rate, GST, RCTI)',
    'Feed match quality back into the engine via post-placement ratings',
  ],
  scope: [
    'Shift broadcast + agency inbox',
    'Candidate matching, submission, centre confirmation, and candidate acceptance',
    'Per-candidate compliance documents with renewal cadence and expiry alerts',
    'Candidate self-service portal for document upload and offer response',
    'Government registry verification (WWCC OCG, AFP NPCS, NDIS Register, VEVO, AIR)',
    'Qualification catalogue keyed by role + jurisdiction + industry',
    'Clock-in (QR / geofence / PIN / kiosk) and discrepancy handling',
    'Placement -> Timesheet bridge',
    'Invoicing incl. RCTI / GST',
    'Outbound webhooks (HMAC signed)',
    'Post-placement ratings feeding the match engine',
  ],
  outOfScope: [
    'Payroll disbursement to candidates (handled by agency payroll)',
    'Building government registry APIs themselves (we consume official adapters)',
  ],

  actors: [
    { name: 'Centre Admin', description: 'Schedules, broadcasts, confirms bookings, reconciles attendance.', permissions: ['shift_request.create', 'submission.decide', 'placement.reconcile', 'invoice.view'] },
    { name: 'Agency Scheduler', description: 'Receives broadcasts, matches and submits candidates.', permissions: ['shift_request.read', 'submission.create', 'candidate.manage'] },
    { name: 'Agency Billing', description: 'Generates invoices and tracks payments.', permissions: ['invoice.create', 'invoice.send'] },
    { name: 'Candidate', description: 'Self-uploads compliance documents, accepts/declines offers, clocks in/out.', permissions: ['document.upload:self', 'document.acknowledge:self', 'offer.respond:self', 'clock_event.create:self'] },
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
    { id: 'FR-AG-08', category: 'Compliance', requirement: 'Every compliance document must declare renewal cadence (once_off | once_off_with_expiry | recurring | ongoing_no_expiry) and renewal interval where applicable', priority: 'must' },
    { id: 'FR-AG-09', category: 'Compliance', requirement: 'System must call government registries (OCG WWCC, AFP NPCS, NDIS Register, VEVO, AIR) when verificationSource is supported and consent is on file', priority: 'must' },
    { id: 'FR-AG-10', category: 'Compliance', requirement: 'Qualification catalogue must drive missingRequired computation per role + jurisdiction + industry', priority: 'must' },
    { id: 'FR-AG-11', category: 'Compliance', requirement: 'Candidates must be able to self-upload documents via a short-lived token without an agency portal login', priority: 'must' },
    { id: 'FR-AG-12', category: 'Compliance', requirement: 'Candidate must record explicit consent before any government registry call (timestamp + reference stored)', priority: 'must' },
    { id: 'FR-AG-13', category: 'Compliance', requirement: 'Renewal reminders sent at T-60, T-30, T-7, T-1 days for any document with expiresAt', priority: 'must' },
    { id: 'FR-AG-14', category: 'Booking', requirement: 'Candidate must accept the offer (acknowledgements + optional signature) before placement becomes confirmed', priority: 'must' },
    { id: 'FR-AG-15', category: 'Booking', requirement: 'Compliance freshness re-checked at candidate acceptance; lapses block confirmation with COMPLIANCE_LAPSED', priority: 'must' },
    { id: 'FR-AG-16', category: 'Booking', requirement: 'Declined offer auto-rolls to next backup candidate (or re-broadcasts) within seconds', priority: 'should' },
    { id: 'FR-AG-17', category: 'Compliance', requirement: 'Visa documents must capture subclass and workHoursLimitPerFortnight; matching engine respects the cap', priority: 'must' },
    { id: 'FR-AG-18', category: 'Compliance', requirement: 'Qualifications must reference issuingAuthority and RTO code where applicable', priority: 'must' },
    { id: 'FR-AG-19', category: 'Audit', requirement: 'Every government_check_request stores requester, consent reference, registry response, and outcome', priority: 'must' },
    { id: 'FR-AG-20', category: 'Broadcast', requirement: 'Shift broadcast payload must include full role spec, qualification & skill requirements, supervisor, check-in method, and geofence so agencies can pre-filter without a callback', priority: 'must' },
    { id: 'FR-AG-21', category: 'Broadcast', requirement: 'Compensation fields (payRate, chargeRate, salaryOffered, loadings, allowances) are optional individually but currency is mandatory; system rejects payRate below award minimum for the role classification', priority: 'must' },
    { id: 'FR-AG-22', category: 'Broadcast', requirement: 'Each qualificationRequirement supports mandatory vs preferred, jurisdiction, mustBeCurrentOn (shift date) and acceptedAlternatives so agency match engine can correctly score eligibility', priority: 'must' },
    { id: 'FR-AG-23', category: 'Broadcast', requirement: 'Centre may flag compensation as negotiable, allowing agency to counter-offer via submission.proposedRate before centre acceptance', priority: 'should' },
  ],
  nonFunctionalRequirements: [
    { id: 'NFR-AG-01', category: 'Performance', requirement: 'Match engine returns within 1.5s for <500 candidates' },
    { id: 'NFR-AG-02', category: 'Security', requirement: 'All API endpoints scoped per tenant + per agency relationship' },
    { id: 'NFR-AG-03', category: 'Reliability', requirement: 'Webhook retries with exponential backoff, max 24h' },
    { id: 'NFR-AG-04', category: 'Auditability', requirement: 'Every state change written to audit_log with actor + diff' },
    { id: 'NFR-AG-05', category: 'Privacy', requirement: 'Compliance documents encrypted at rest; signed URLs expire in 15 min; PII redacted from registry response logs' },
    { id: 'NFR-AG-06', category: 'Compliance', requirement: 'Government verification calls retried max 3x; failures surface as pending_verification (never silently approve)' },
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
        { name: 'break_minutes', type: 'int', mandatory: true, description: 'Unpaid break minutes' },
        { name: 'shift_type', type: 'enum', mandatory: true, description: 'regular|on_call|sleepover|split' },
        { name: 'required_role', type: 'text', mandatory: true, description: 'Role required (denormalised role.name)' },
        { name: 'role_id', type: 'uuid', mandatory: false, description: 'FK to roles', foreignKey: 'roles.id' },
        { name: 'award_classification', type: 'text', mandatory: false, description: 'Award classification e.g. CSE Level 3.4' },
        { name: 'min_experience_years', type: 'numeric', mandatory: false, description: 'Minimum years of experience' },
        { name: 'qualification_requirements', type: 'jsonb', mandatory: true, description: 'Array of {code, name, mandatory, jurisdiction, mustBeCurrentOn, acceptedAlternatives, preferred}' },
        { name: 'skill_requirements', type: 'jsonb', mandatory: false, description: 'Array of skill codes' },
        { name: 'language_preferences', type: 'jsonb', mandatory: false, description: 'Preferred languages' },
        { name: 'pay_rate', type: 'numeric', mandatory: false, description: 'Optional hourly rate paid to worker' },
        { name: 'charge_rate', type: 'numeric', mandatory: false, description: 'Optional hourly rate charged to centre' },
        { name: 'salary_offered', type: 'numeric', mandatory: false, description: 'Optional flat salary (temp-to-perm / contract conversion)' },
        { name: 'currency', type: 'text', mandatory: true, description: 'ISO currency, default AUD' },
        { name: 'rate_card_id', type: 'uuid', mandatory: false, description: 'Reference rate card' },
        { name: 'loadings', type: 'jsonb', mandatory: false, description: 'Casual/weekend/PH/OT multipliers' },
        { name: 'allowances', type: 'jsonb', mandatory: false, description: 'Travel, meal, KM allowances' },
        { name: 'estimated_shift_value', type: 'numeric', mandatory: false, description: 'Calculated total for agency reference' },
        { name: 'compensation_negotiable', type: 'boolean', mandatory: false, description: 'Whether agency may counter-offer rate' },
        { name: 'check_in_method', type: 'enum', mandatory: true, description: 'qr|geofence|pin|kiosk|manual' },
        { name: 'geofence', type: 'jsonb', mandatory: false, description: '{lat, lng, radiusMeters}' },
        { name: 'supervisor', type: 'jsonb', mandatory: false, description: '{name, phone, email}' },
        { name: 'uniform_and_ppe', type: 'jsonb', mandatory: false, description: '{dressCode, ppeProvided[]}' },
        { name: 'urgency', type: 'enum', mandatory: true, description: 'low/medium/high/critical' },
        { name: 'fill_mode', type: 'enum', mandatory: true, description: 'express|managed' },
        { name: 'status', type: 'enum', mandatory: true, description: 'open/broadcasting/matched/filled/cancelled/expired' },
        { name: 'preferred_candidate_ids', type: 'jsonb', mandatory: false, description: 'Bias for matching engine' },
        { name: 'blocked_candidate_ids', type: 'jsonb', mandatory: false, description: 'Candidates to exclude' },
        { name: 'notes', type: 'text', mandatory: false, description: 'Free-text notes' },
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
      description: 'Per-candidate compliance docs with expiry, renewal cadence, and government-verification metadata.',
      fields: [
        { name: 'id', type: 'uuid', mandatory: true, description: 'PK' },
        { name: 'candidate_id', type: 'uuid', mandatory: true, description: 'FK -> candidates.id', indexed: true },
        { name: 'type', type: 'enum', mandatory: true, description: 'WWCC|PoliceCheck|NDISWorkerScreening|VisaWorkRights|Immunisation|FirstAid|CPR|Qualification|DriversLicence|Identity|Reference|Other' },
        { name: 'category', type: 'enum', mandatory: true, description: 'government_check|qualification|health|identity|reference|other' },
        { name: 'name', type: 'text', mandatory: false, description: 'Human-readable name (e.g. CHC50121)' },
        { name: 'number', type: 'text', mandatory: false, description: 'Document/registration number' },
        { name: 'jurisdiction', type: 'text', mandatory: false, description: 'State/territory (e.g. NSW)' },
        { name: 'country', type: 'text', mandatory: false, description: 'ISO country code' },
        { name: 'issuing_authority', type: 'text', mandatory: false, description: 'Body that issued the document' },
        { name: 'rto_code', type: 'text', mandatory: false, description: 'Registered Training Org code (qualifications)' },
        { name: 'subclass', type: 'text', mandatory: false, description: 'Visa subclass (visa docs)' },
        { name: 'work_hours_limit_per_fortnight', type: 'integer', mandatory: false, description: 'Visa work-hours cap if applicable' },
        { name: 'issued_at', type: 'date', mandatory: false, description: 'Issue date' },
        { name: 'expires_at', type: 'date', mandatory: false, description: 'Expiry date; null for once_off / ongoing_no_expiry' },
        { name: 'renewal_cadence', type: 'enum', mandatory: true, description: 'once_off|once_off_with_expiry|recurring|ongoing_no_expiry' },
        { name: 'renewal_interval_months', type: 'integer', mandatory: false, description: 'Used to auto-suggest renewals for recurring docs' },
        { name: 'is_mandatory', type: 'boolean', mandatory: true, description: 'Required for placement eligibility' },
        { name: 'is_government_verified', type: 'boolean', mandatory: true, description: 'True when verified against an official registry' },
        { name: 'verification_source', type: 'enum', mandatory: false, description: 'OCG_API|AFP_NPCS|NDIS_REGISTER|VEVO|AIR_API|MANUAL|NONE' },
        { name: 'verification_reference', type: 'text', mandatory: false, description: 'Registry reference returned by source' },
        { name: 'verified_at', type: 'timestamptz', mandatory: false, description: 'Verification timestamp' },
        { name: 'verified_by', type: 'text', mandatory: false, description: 'system|<userId>' },
        { name: 'candidate_consent_signed_at', type: 'timestamptz', mandatory: false, description: 'Consent timestamp for govt lookup' },
        { name: 'candidate_acknowledged_at', type: 'timestamptz', mandatory: false, description: 'Candidate confirmed accuracy of doc' },
        { name: 'uploaded_by', type: 'enum', mandatory: true, description: 'candidate|agency_admin|centre_admin|system' },
        { name: 'uploaded_at', type: 'timestamptz', mandatory: true, description: 'Upload timestamp' },
        { name: 'file_url', type: 'text', mandatory: false, description: 'Signed storage URL' },
        { name: 'file_mime_type', type: 'text', mandatory: false, description: 'MIME type' },
        { name: 'file_size_bytes', type: 'integer', mandatory: false, description: 'File size' },
        { name: 'reminders_sent', type: 'integer', mandatory: true, description: 'Count of expiry reminders sent', defaultValue: '0' },
        { name: 'last_reminder_at', type: 'timestamptz', mandatory: false, description: 'Last reminder sent at' },
        { name: 'status', type: 'enum', mandatory: true, description: 'pending_verification|valid|expiring_soon|expired|rejected|missing' },
      ],
    },
    {
      name: 'qualification_catalogue',
      schema: 'public',
      description: 'Canonical list of required/recommended qualifications and checks per role + jurisdiction.',
      fields: [
        { name: 'id', type: 'uuid', mandatory: true, description: 'PK' },
        { name: 'role', type: 'text', mandatory: true, description: 'Role key (e.g. DiplomaEducator)' },
        { name: 'jurisdiction', type: 'text', mandatory: true, description: 'State/territory' },
        { name: 'industry', type: 'text', mandatory: true, description: 'childcare|aged_care|disability|hospitality|...' },
        { name: 'document_type', type: 'enum', mandatory: true, description: 'See candidate_compliance_documents.type' },
        { name: 'is_mandatory', type: 'text', mandatory: true, description: 'true|false|if_non_citizen' },
        { name: 'renewal_cadence', type: 'enum', mandatory: true, description: 'Default cadence for this requirement' },
        { name: 'renewal_interval_months', type: 'integer', mandatory: false, description: 'Default renewal interval' },
        { name: 'government_verified', type: 'boolean', mandatory: true, description: 'Whether registry verification is available' },
        { name: 'verification_source', type: 'text', mandatory: false, description: 'Registry source key' },
        { name: 'accepted_qualifications', type: 'jsonb', mandatory: false, description: 'Array of acceptable qualification codes' },
      ],
    },
    {
      name: 'government_check_requests',
      schema: 'public',
      description: 'Audit trail of government registry verification calls.',
      fields: [
        { name: 'id', type: 'uuid', mandatory: true, description: 'PK' },
        { name: 'document_id', type: 'uuid', mandatory: true, description: 'FK -> candidate_compliance_documents.id' },
        { name: 'source', type: 'enum', mandatory: true, description: 'OCG_API|AFP_NPCS|NDIS_REGISTER|VEVO|AIR_API' },
        { name: 'requested_at', type: 'timestamptz', mandatory: true, description: 'When call was made' },
        { name: 'requested_by', type: 'text', mandatory: true, description: 'userId or "system"' },
        { name: 'consent_reference', type: 'text', mandatory: true, description: 'Candidate consent record reference' },
        { name: 'response_status', type: 'enum', mandatory: false, description: 'verified|not_found|expired|rejected|error' },
        { name: 'response_payload', type: 'jsonb', mandatory: false, description: 'Raw registry response (PII redacted)' },
        { name: 'completed_at', type: 'timestamptz', mandatory: false, description: 'Completion time' },
      ],
    },
    {
      name: 'candidate_shift_offers',
      schema: 'public',
      description: 'Offer pushed to candidate after centre confirmation; candidate must accept before shift becomes confirmed.',
      fields: [
        { name: 'id', type: 'uuid', mandatory: true, description: 'PK' },
        { name: 'placement_id', type: 'uuid', mandatory: true, description: 'FK -> agency_placements.id' },
        { name: 'candidate_id', type: 'uuid', mandatory: true, description: 'FK -> candidates.id', indexed: true },
        { name: 'submission_id', type: 'uuid', mandatory: true, description: 'FK -> agency_submissions.id' },
        { name: 'offer_sent_at', type: 'timestamptz', mandatory: true, description: 'When offer pushed to candidate' },
        { name: 'respond_by_deadline', type: 'timestamptz', mandatory: true, description: 'Hard cutoff for candidate response' },
        { name: 'status', type: 'enum', mandatory: true, description: 'pending|accepted|declined|expired|withdrawn' },
        { name: 'response_at', type: 'timestamptz', mandatory: false, description: 'When candidate responded' },
        { name: 'decline_reason', type: 'text', mandatory: false, description: 'Reason if declined' },
        { name: 'acknowledgements', type: 'jsonb', mandatory: false, description: 'Per-clause acceptance map (shift details, compliance, rate, code of conduct)' },
        { name: 'signature_url', type: 'text', mandatory: false, description: 'Stored digital signature image' },
        { name: 'reminders_sent', type: 'integer', mandatory: true, description: 'Reminder count', defaultValue: '0' },
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
    { id: 'BR-AG-07', rule: 'A document with renewalCadence=recurring auto-creates a renewal task at expiresAt - renewalIntervalMonths/12 anchor', rationale: 'Ensures rolling qualifications never lapse silently' },
    { id: 'BR-AG-08', rule: 'Government verification cannot be marked verified without a stored consent_reference', rationale: 'Privacy + Australian Privacy Principles compliance' },
    { id: 'BR-AG-09', rule: 'Candidate offer auto-expires at respond_by_deadline and triggers backup roll-over', rationale: 'Protects centre from no-response candidates' },
    { id: 'BR-AG-10', rule: 'Placement becomes confirmed only when BOTH centre acceptance AND candidate acceptance recorded', rationale: 'Two-sided handshake prevents disputes' },
    { id: 'BR-AG-11', rule: 'A document uploaded by candidate stays pending_verification until reviewed by agency admin OR auto-verified by registry', rationale: 'Prevents self-attested-only compliance' },
    { id: 'BR-AG-12', rule: 'Visa work-hours cap (workHoursLimitPerFortnight) is enforced by the match engine before submission', rationale: 'Avoids visa breaches' },
    { id: 'BR-AG-13', rule: 'qualification_catalogue is versioned per jurisdiction; changing requirements does not retroactively invalidate already-placed candidates for current shift', rationale: 'Stability of in-flight bookings' },

  ],
  apiEndpoints,
  workflows,
};
