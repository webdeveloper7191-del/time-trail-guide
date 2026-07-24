// Agency Integration API Specification
// REST contract for integrating 3rd-party staffing agency platforms with the Roster platform.
// All endpoints are JSON over HTTPS (TLS 1.2+). Auth: OAuth 2.0 client_credentials bearer token.
// Webhooks are signed with HMAC-SHA256 over the raw request body.

export interface ApiField {
  name: string;
  type: string;
  required?: boolean;
  description: string;
  example?: string | number | boolean | null;
  enum?: string[];
}

export type JSONSchema = Record<string, any>;

export interface ApiEndpoint {
  id: string;
  group: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  summary: string;
  description?: string;
  direction: 'outbound' | 'inbound' | 'webhook';
  auth: string;
  requestHeaders?: ApiField[];
  pathParams?: ApiField[];
  queryParams?: ApiField[];
  requestBody?: ApiField[];
  requestSchema?: JSONSchema;
  requestExample?: string;
  responseBody?: ApiField[];
  responseSchema?: JSONSchema;
  responseExample?: string;
  errorCodes?: { code: string; description: string }[];
  // Webhook-only metadata
  webhook?: {
    eventName: string;
    deliveryHeaders: ApiField[];
    retrySchedule: string[]; // human-readable schedule
    expectedResponse: string;
    deadLetter: string;
  };
}

// ============ COMMON SCHEMA FRAGMENTS ============

const addressSchema: JSONSchema = {
  type: 'object',
  required: ['street', 'suburb', 'state', 'postcode', 'country'],
  properties: {
    street: { type: 'string', example: '12 King St' },
    suburb: { type: 'string', example: 'Sydney' },
    state: { type: 'string', example: 'NSW' },
    postcode: { type: 'string', example: '2000' },
    country: { type: 'string', minLength: 2, maxLength: 2, example: 'AU', description: 'ISO 3166-1 alpha-2.' },
  },
};

const moneySchema: JSONSchema = {
  type: 'number',
  minimum: 0,
  description: 'Decimal amount with at most 2 decimal places.',
  multipleOf: 0.01,
};

const isoDateTime: JSONSchema = { type: 'string', format: 'date-time', description: 'ISO-8601 with timezone offset.' };
const isoDate: JSONSchema = { type: 'string', format: 'date', description: 'YYYY-MM-DD.' };

const candidateInputSchema: JSONSchema = {
  type: 'object',
  description: 'A candidate the agency has already contacted and CONFIRMED is available, willing, and compliant for this specific shift. Do NOT submit speculative or unconfirmed matches — the platform will reject any candidate missing confirmation fields.',
  required: ['externalId', 'firstName', 'lastName', 'email', 'phone', 'primaryRole', 'awardClassification', 'payRate', 'certifications', 'confirmedAvailable', 'confirmedAt', 'confirmationMethod'],
  properties: {
    externalId: { type: 'string', description: 'Agency-local candidate id. Unique per agency.' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    dateOfBirth: { ...isoDate, description: 'Required for compliance checks where law requires age verification.' },
    email: { type: 'string', format: 'email' },
    phone: { type: 'string', description: 'E.164 phone, e.g. +61400999111.' },
    employmentType: { type: 'string', enum: ['casual', 'temp', 'temp_to_perm', 'contractor'] },
    primaryRole: { type: 'string' },
    secondaryRoles: { type: 'array', items: { type: 'string' }, default: [] },
    yearsExperience: { type: 'integer', minimum: 0 },
    awardClassification: { type: 'string', description: 'Award + level, e.g. "CS Level 3.4".' },
    payRate: { ...moneySchema, description: 'Worker pay $/hr.' },
    skills: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'level'],
        properties: {
          name: { type: 'string' },
          level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
          yearsExperience: { type: 'integer', minimum: 0 },
        },
      },
    },
    certifications: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['name', 'issuer', 'issueDate', 'expiryDate'],
        properties: {
          name: { type: 'string' },
          issuer: { type: 'string' },
          documentNumber: { type: 'string' },
          issueDate: isoDate,
          expiryDate: isoDate,
          documentUrl: { type: 'string', format: 'uri', description: 'HTTPS signed URL to the certificate file.' },
          status: { type: 'string', enum: ['valid', 'expiring_soon', 'expired', 'missing'] },
        },
      },
    },
    preferredLocations: { type: 'array', items: { type: 'string' } },
    maxTravelDistanceKm: { type: 'integer', minimum: 0 },
    complianceScore: { type: 'integer', minimum: 0, maximum: 100 },
    reliabilityScore: { type: 'integer', minimum: 0, maximum: 100 },
    hoursWorkedThisWeek: { type: 'number', minimum: 0 },
    lastShiftEndTime: { ...isoDateTime, description: 'Used for fatigue / rest-break checks.' },
    rightToWork: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { type: 'string', enum: ['citizen', 'permanent_resident', 'visa_holder'] },
        visaSubclass: { type: 'string' },
        workHoursLimit: { type: 'integer', description: 'Weekly hours cap if applicable.' },
        evidenceUrl: { type: 'string', format: 'uri' },
        verifiedAt: isoDateTime,
      },
    },
    bankDetails: {
      type: 'object',
      description: 'Optional. Only required if platform handles payroll on behalf of agency.',
      properties: {
        bsb: { type: 'string', pattern: '^[0-9]{3}-?[0-9]{3}$' },
        accountNumber: { type: 'string' },
        accountName: { type: 'string' },
      },
    },
    superannuation: {
      type: 'object',
      properties: {
        fundName: { type: 'string' },
        memberNumber: { type: 'string' },
        usi: { type: 'string', description: 'Unique Superannuation Identifier.' },
      },
    },
    tfn: { type: 'string', description: 'Tax File Number. Encrypted at rest.' },
    confirmedAvailable: { type: 'boolean', enum: [true], description: 'MUST be true. Explicit confirmation that the agency has contacted the candidate and they have accepted this specific shift.' },
    confirmedAt: { ...isoDateTime, description: 'Timestamp when the candidate confirmed acceptance of the shift. Must be within the last 60 minutes.' },
    confirmationMethod: { type: 'string', enum: ['sms', 'call', 'app', 'email', 'in_person'], description: 'How the agency captured the candidate confirmation. Used for audit only.' },
    confirmationReference: { type: 'string', description: 'Optional agency-side reference (message id, call id, app booking id) for audit trace.' },
  },
};

// ============ COMMON HEADERS ============

const commonHeaders: ApiField[] = [
  { name: 'Authorization', type: 'string', required: true, description: 'Bearer access token (OAuth2 client_credentials).', example: 'Bearer eyJhbGciOi…' },
  { name: 'X-Tenant-Id', type: 'string', required: true, description: 'Tenant (client organisation) identifier.', example: 'tnt_4f9a…' },
  { name: 'X-Request-Id', type: 'string (uuid)', required: false, description: 'Idempotency / tracing key. Echoed in the response. Required for POST/PATCH/DELETE to safely retry.', example: 'a1b2c3d4-…' },
  { name: 'X-Idempotency-Key', type: 'string', required: false, description: 'Optional alternative to X-Request-Id for mutating requests. Server stores the first response for 24h.' },
  { name: 'Content-Type', type: 'string', required: true, description: 'Must be application/json.', example: 'application/json' },
  { name: 'Accept', type: 'string', required: false, description: 'Must be application/json.', example: 'application/json' },
  { name: 'User-Agent', type: 'string', required: false, description: 'Identify your integration, e.g. "BrightStaff-Connector/2.1".' },
];

// ============ WEBHOOK DELIVERY HEADERS (sent BY platform TO agency) ============

export const agencyWebhookDeliveryHeaders: ApiField[] = [
  { name: 'Content-Type', type: 'string', required: true, description: 'Always application/json; charset=utf-8.', example: 'application/json; charset=utf-8' },
  { name: 'User-Agent', type: 'string', required: true, description: 'Identifies the platform delivery agent.', example: 'RosteredAI-Webhooks/1.0' },
  { name: 'X-RosteredAI-Event', type: 'string', required: true, description: 'Event name (dot-namespaced).', example: 'shift.broadcast' },
  { name: 'X-RosteredAI-Event-Id', type: 'string (uuid)', required: true, description: 'Unique id per logical event. Use for idempotency — duplicate ids MUST be ignored.', example: '8a4e7e10-7e1c-4f0d-9c1e-bc2f4a8b1234' },
  { name: 'X-RosteredAI-Delivery-Id', type: 'string (uuid)', required: true, description: 'Unique id per delivery attempt. Differs across retries even when Event-Id is identical.' },
  { name: 'X-RosteredAI-Delivery-Attempt', type: 'integer', required: true, description: 'Retry attempt number, starting at 1. Max 8.', example: 1 },
  { name: 'X-RosteredAI-Timestamp', type: 'integer', required: true, description: 'Unix seconds at the moment the signature was computed. Reject requests skewed > 5 minutes.', example: 1749543600 },
  { name: 'X-RosteredAI-Signature', type: 'string', required: true, description: 'Comma-separated list of versioned signatures, e.g. "t=<ts>,v1=<hex>". v1 = hex(HMAC_SHA256(secret, timestamp + "." + rawBody)).', example: 't=1749543600,v1=3f7b…' },
  { name: 'X-RosteredAI-Signature-Version', type: 'string', required: true, description: 'Active signature scheme. Currently always "v1".', example: 'v1' },
  { name: 'X-RosteredAI-Tenant-Id', type: 'string', required: true, description: 'Originating tenant id.', example: 'tnt_4f9a…' },
  { name: 'X-RosteredAI-Agency-Id', type: 'string', required: true, description: 'Target agency id.', example: 'agy_01HXYZ…' },
  { name: 'X-RosteredAI-Api-Version', type: 'string', required: true, description: 'Webhook payload schema version.', example: '2026-06-01' },
];

export const agencyWebhookRetrySchedule = [
  { attempt: 1, delay: 'immediate', cumulative: '0 s' },
  { attempt: 2, delay: '+30 seconds', cumulative: '30 s' },
  { attempt: 3, delay: '+2 minutes', cumulative: '~2 m 30 s' },
  { attempt: 4, delay: '+10 minutes', cumulative: '~12 m 30 s' },
  { attempt: 5, delay: '+1 hour', cumulative: '~1 h 12 m' },
  { attempt: 6, delay: '+6 hours', cumulative: '~7 h 12 m' },
  { attempt: 7, delay: '+12 hours', cumulative: '~19 h 12 m' },
  { attempt: 8, delay: '+24 hours', cumulative: '~43 h (final)' },
];

export const agencyWebhookExpectedResponse = {
  success: '2xx within 5 seconds. Body may be empty or `{ "received": true }`.',
  rejectSilently: '410 Gone tells the platform to stop retrying and disable the endpoint after 3 consecutive 410s.',
  retry: 'Any non-2xx (other than 410) triggers the retry schedule above. After attempt 8 the event is moved to the dead-letter queue.',
  timeout: 'Connection or read timeout = 5 s. Timeouts count as a failed attempt.',
  deadLetter: 'Dead-lettered events are visible at GET /v1/agencies/{agencyId}/webhook-deliveries?status=dead_letter and can be replayed for up to 30 days.',
};

// ============ JSON SCHEMA BUILDERS FOR REUSE ============

const errorEnvelopeSchema: JSONSchema = {
  type: 'object',
  required: ['error'],
  properties: {
    error: {
      type: 'object',
      required: ['code', 'message', 'requestId'],
      properties: {
        code: { type: 'string', example: 'validation_error' },
        message: { type: 'string' },
        requestId: { type: 'string', format: 'uuid' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            required: ['field', 'code', 'message'],
            properties: {
              field: { type: 'string' },
              code: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
  },
};

// ============ ENDPOINTS ============

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
    description: 'OAuth 2.0 client_credentials grant. The client_id / client_secret pair is issued manually by the platform admin during onboarding (out of band) and shared with the agency. This endpoint exchanges those credentials for a short-lived bearer token used for all subsequent calls.',
    requestHeaders: [
      { name: 'Authorization', type: 'string', required: true, description: 'Basic base64(client_id:client_secret).' },
      { name: 'Content-Type', type: 'string', required: true, description: 'application/x-www-form-urlencoded' },
    ],
    requestBody: [
      { name: 'grant_type', type: 'string', required: true, description: 'Must be "client_credentials".', example: 'client_credentials' },
      { name: 'scope', type: 'string', required: false, description: 'Space-separated scopes: shifts.read shifts.write candidates.read placements.write timesheets.read invoices.write analytics.read', example: 'shifts.read placements.write' },
      { name: 'audience', type: 'string', required: false, description: 'Resource server audience. Defaults to "api.rostered.ai".' },
    ],
    requestSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['grant_type'],
      properties: {
        grant_type: { type: 'string', const: 'client_credentials' },
        scope: { type: 'string' },
        audience: { type: 'string' },
      },
    },
    requestExample: `grant_type=client_credentials&scope=shifts.read+placements.write`,
    responseBody: [
      { name: 'access_token', type: 'string', description: 'JWT bearer token.', example: 'eyJhbGciOi…' },
      { name: 'token_type', type: 'string', description: 'Always "Bearer".', example: 'Bearer' },
      { name: 'expires_in', type: 'integer', description: 'Lifetime in seconds.', example: 3600 },
      { name: 'scope', type: 'string', description: 'Granted scopes.', example: 'shifts.read placements.write' },
    ],
    responseSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['access_token', 'token_type', 'expires_in', 'scope'],
      properties: {
        access_token: { type: 'string' },
        token_type: { type: 'string', const: 'Bearer' },
        expires_in: { type: 'integer', minimum: 60, maximum: 86400 },
        scope: { type: 'string' },
        issued_token_type: { type: 'string' },
      },
    },
    responseExample: `{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "shifts.read placements.write"
}`,
    errorCodes: [
      { code: '401 invalid_client', description: 'client_id / client_secret rejected.' },
      { code: '400 invalid_scope', description: 'Requested scope not allowed for this agency.' },
      { code: '400 unsupported_grant_type', description: 'Only client_credentials is supported.' },
    ],
  },

  // ============ SHIFT DISPATCH (Platform → selected agencies) ============
  // Agencies are onboarded manually by the platform admin (out of band).
  // The integration is consumption-only: agencies receive shift requests via
  // webhook and respond through the Shift Requests / Placements / Timesheets / Invoices APIs.
  {
    id: 'shift-dispatch',
    group: 'Shift Dispatch',
    method: 'POST',
    path: '/v1/shift-requests/{shiftRequestId}/dispatch',
    direction: 'inbound',
    auth: 'Bearer (tenant admin scope)',
    summary: 'Push a shift request to one or more selected agencies',
    description: 'Targets specific agencies by id rather than broadcasting to all. Each selected agency receives a `shift.broadcast` webhook with the same eventId so the agency can de-duplicate. Returns per-agency delivery status.',
    pathParams: [{ name: 'shiftRequestId', type: 'string', required: true, description: 'Platform shift request id.' }],
    requestHeaders: commonHeaders,
    requestBody: [
      { name: 'agencyIds', type: 'string[]', required: true, description: 'Agencies to dispatch to. 1–20 ids per call.', example: '["agy_01","agy_02"]' },
      { name: 'fillMode', type: 'enum', required: false, description: 'Override fillMode on the broadcast: express | managed. Defaults to the shift request value.' },
      { name: 'urgency', type: 'enum', required: false, description: 'Override urgency: standard | urgent | critical.' },
      { name: 'slaDeadline', type: 'string (ISO-8601)', required: false, description: 'Override respond-by deadline. Must be in the future.' },
      { name: 'allowOverfill', type: 'boolean', required: false, description: 'When true, multiple agencies may fill the same shift up to totalPositions. Default false (first-to-confirm wins).' },
      { name: 'note', type: 'string', required: false, description: 'Free-text note relayed to agencies in the webhook (max 500 chars).' },
    ],
    requestSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['agencyIds'],
      properties: {
        agencyIds: { type: 'array', minItems: 1, maxItems: 20, uniqueItems: true, items: { type: 'string', pattern: '^agy_' } },
        fillMode: { type: 'string', enum: ['express', 'managed'] },
        urgency: { type: 'string', enum: ['standard', 'urgent', 'critical'] },
        slaDeadline: isoDateTime,
        allowOverfill: { type: 'boolean', default: false },
        note: { type: 'string', maxLength: 500 },
      },
    },
    requestExample: `{
  "agencyIds": ["agy_01HXYZ", "agy_02ABCD", "agy_03EFGH"],
  "fillMode": "managed",
  "urgency": "urgent",
  "slaDeadline": "2026-06-14T18:00:00+10:00",
  "allowOverfill": false,
  "note": "Priority partners only — please respond within 2 hours."
}`,
    responseBody: [
      { name: 'shiftRequestId', type: 'string', description: 'Echo of the target shift request id.' },
      { name: 'dispatchId', type: 'string', description: 'Identifier for this dispatch batch (use to query webhook deliveries).' },
      { name: 'dispatchedAt', type: 'string (ISO-8601)', description: 'Server timestamp.' },
      { name: 'results', type: 'object[]', description: '[{ agencyId, status, deliveryId, reason }]' },
    ],
    responseSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['shiftRequestId', 'dispatchId', 'dispatchedAt', 'results'],
      properties: {
        shiftRequestId: { type: 'string' },
        dispatchId: { type: 'string' },
        dispatchedAt: isoDateTime,
        results: {
          type: 'array',
          items: {
            type: 'object',
            required: ['agencyId', 'status'],
            properties: {
              agencyId: { type: 'string' },
              status: { type: 'string', enum: ['queued', 'delivered', 'skipped', 'failed'] },
              deliveryId: { type: 'string', description: 'Webhook delivery id (when queued / delivered).' },
              reason: { type: 'string', description: 'Populated when status = skipped | failed (e.g. "agency_inactive", "no_matching_coverage", "webhook_unreachable").' },
            },
          },
        },
      },
    },
    responseExample: `{
  "shiftRequestId": "sr_01HXYZ",
  "dispatchId": "dsp_9f2a",
  "dispatchedAt": "2026-06-10T09:00:00+10:00",
  "results": [
    { "agencyId":"agy_01HXYZ","status":"queued","deliveryId":"whd_aa11" },
    { "agencyId":"agy_02ABCD","status":"queued","deliveryId":"whd_bb22" },
    { "agencyId":"agy_03EFGH","status":"skipped","reason":"no_matching_coverage" }
  ]
}`,
    errorCodes: [
      { code: '404 shift_not_found', description: 'shiftRequestId does not exist.' },
      { code: '409 shift_already_filled', description: 'Shift is already filled and not in overfill mode.' },
      { code: '410 shift_closed', description: 'Shift SLA has expired or the shift was cancelled.' },
      { code: '422 invalid_agencies', description: 'One or more agencyIds are unknown or inactive (see errors[]).' },
    ],
  },



  // ============ SHIFT REQUESTS (Broadcast → Agency) ============
  {
    id: 'shift-broadcast',
    group: 'Shift Requests',
    method: 'POST',
    path: '{agency.webhookUrl}',
    direction: 'webhook',
    auth: 'HMAC X-RosteredAI-Signature',
    summary: 'shift.broadcast — open shift dispatched to agency',
    description: 'Fired when the tenant broadcasts an open shift. Agency must respond 2xx within 5 s; matching candidates are submitted asynchronously via POST /v1/shift-requests/{id}/candidates.',
    webhook: {
      eventName: 'shift.broadcast',
      deliveryHeaders: agencyWebhookDeliveryHeaders,
      retrySchedule: agencyWebhookRetrySchedule.map(r => `Attempt ${r.attempt}: ${r.delay} (cumulative ${r.cumulative})`),
      expectedResponse: '2xx within 5 s. Body MAY include `{ "accepted": boolean, "estimatedCandidates": integer, "declineReason": string }` to short-circuit the matching pipeline.',
      deadLetter: 'After attempt 8 the shift is marked as agency_unreachable and the platform tries the next-priority agency.',
    },
    requestHeaders: agencyWebhookDeliveryHeaders,
    requestBody: [
      { name: 'eventId', type: 'string (uuid)', required: true, description: 'Echo of X-RosteredAI-Event-Id for idempotency at the payload level.' },
      { name: 'eventType', type: 'string', required: true, description: 'Always "shift.broadcast".' },
      { name: 'occurredAt', type: 'string (ISO-8601)', required: true, description: 'When the event was generated.' },
      { name: 'apiVersion', type: 'string', required: true, description: 'Payload schema version.', example: '2026-06-01' },
      { name: 'data.shiftRequestId', type: 'string', required: true, description: 'Platform shift request id.', example: 'sr_01HXYZ…' },
      { name: 'data.tenantId', type: 'string', required: true, description: 'Originating tenant.' },
      { name: 'data.clientName', type: 'string', required: true, description: 'End-client / location name.' },
      { name: 'data.locationAddress', type: 'string', required: true, description: 'Address of the work site.' },
      { name: 'data.locationCoordinates', type: 'object', required: false, description: '{ lat, lng } for distance matching.' },
      { name: 'data.timezone', type: 'string', required: true, description: 'IANA timezone (e.g. Australia/Sydney) for date/startTime/endTime.' },
      { name: 'data.date', type: 'string (ISO date)', required: true, description: 'Shift date (in location timezone).' },
      { name: 'data.startTime', type: 'string (HH:mm)', required: true, description: 'Local start time.' },
      { name: 'data.endTime', type: 'string (HH:mm)', required: true, description: 'Local end time.' },
      { name: 'data.breakMinutes', type: 'integer', required: true, description: 'Unpaid break minutes.' },
      { name: 'data.requirements', type: 'object[]', required: true, description: '[{ roleName, quantity, skills[], certifications[], minExperience }]' },
      { name: 'data.urgency', type: 'enum', required: true, description: 'standard | urgent | critical' },
      { name: 'data.fillMode', type: 'enum', required: true, description: 'express | managed' },
      { name: 'data.slaDeadline', type: 'string (ISO-8601)', required: true, description: 'Respond-by deadline.' },
      { name: 'data.payRate', type: 'number', required: true, description: 'Pay rate $/hr to worker.' },
      { name: 'data.chargeRate', type: 'number', required: true, description: 'Agreed charge rate $/hr.' },
      { name: 'data.currency', type: 'string', required: true, description: 'ISO 4217 currency code.', example: 'AUD' },
      { name: 'data.instructions', type: 'string', required: false, description: 'Free-text site instructions.' },
      { name: 'data.dresscode', type: 'string', required: false, description: 'Required attire.' },
      { name: 'data.cancellationPolicy', type: 'object', required: false, description: '{ noticeHours, chargeIfWithinNotice }' },
    ],
    requestSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['eventId', 'eventType', 'occurredAt', 'apiVersion', 'data'],
      properties: {
        eventId: { type: 'string', format: 'uuid' },
        eventType: { type: 'string', const: 'shift.broadcast' },
        occurredAt: isoDateTime,
        apiVersion: { type: 'string' },
        data: {
          type: 'object',
          required: ['shiftRequestId', 'tenantId', 'clientName', 'locationAddress', 'timezone', 'date', 'startTime', 'endTime', 'breakMinutes', 'requirements', 'urgency', 'fillMode', 'slaDeadline', 'payRate', 'chargeRate', 'currency'],
          properties: {
            shiftRequestId: { type: 'string' },
            tenantId: { type: 'string' },
            clientId: { type: 'string' },
            clientName: { type: 'string' },
            locationName: { type: 'string' },
            locationAddress: { type: 'string' },
            locationCoordinates: {
              type: 'object',
              properties: {
                lat: { type: 'number', minimum: -90, maximum: 90 },
                lng: { type: 'number', minimum: -180, maximum: 180 },
              },
              required: ['lat', 'lng'],
            },
            timezone: { type: 'string', example: 'Australia/Sydney' },
            date: isoDate,
            startTime: { type: 'string', pattern: '^([01][0-9]|2[0-3]):[0-5][0-9]$' },
            endTime: { type: 'string', pattern: '^([01][0-9]|2[0-3]):[0-5][0-9]$' },
            breakMinutes: { type: 'integer', minimum: 0, maximum: 480 },
            totalPositions: { type: 'integer', minimum: 1 },
            requirements: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['roleName', 'quantity'],
                properties: {
                  roleId: { type: 'string' },
                  roleName: { type: 'string' },
                  quantity: { type: 'integer', minimum: 1 },
                  skills: { type: 'array', items: { type: 'string' }, default: [] },
                  certifications: { type: 'array', items: { type: 'string' }, default: [] },
                  minExperience: { type: 'integer', minimum: 0 },
                  preferredCandidateIds: { type: 'array', items: { type: 'string' } },
                },
              },
            },
            urgency: { type: 'string', enum: ['standard', 'urgent', 'critical'] },
            fillMode: { type: 'string', enum: ['express', 'managed'] },
            slaDeadline: isoDateTime,
            payRate: moneySchema,
            chargeRate: moneySchema,
            currency: { type: 'string', pattern: '^[A-Z]{3}$' },
            instructions: { type: 'string', maxLength: 2000 },
            dresscode: { type: 'string' },
            cancellationPolicy: {
              type: 'object',
              properties: {
                noticeHours: { type: 'integer', minimum: 0 },
                chargeIfWithinNotice: { type: 'string', enum: ['none', 'partial', 'full'] },
              },
            },
          },
        },
      },
    },
    requestExample: `{
  "eventId": "8a4e7e10-7e1c-4f0d-9c1e-bc2f4a8b1234",
  "eventType": "shift.broadcast",
  "occurredAt": "2026-06-10T09:00:00+10:00",
  "apiVersion": "2026-06-01",
  "data": {
    "shiftRequestId": "sr_01HXYZ",
    "tenantId": "tnt_4f9a",
    "clientId": "loc_bondi",
    "clientName": "Sunrise Early Learning – Bondi",
    "locationAddress": "12 Beach Rd, Bondi NSW 2026",
    "locationCoordinates": { "lat": -33.8915, "lng": 151.2767 },
    "timezone": "Australia/Sydney",
    "date": "2026-06-15",
    "startTime": "07:30",
    "endTime": "16:30",
    "breakMinutes": 30,
    "totalPositions": 2,
    "requirements": [
      {
        "roleId": "role_edu_dip",
        "roleName": "Educator – Diploma",
        "quantity": 2,
        "skills": ["0-2yr room"],
        "certifications": ["WWCC","First Aid"],
        "minExperience": 2
      }
    ],
    "urgency": "urgent",
    "fillMode": "managed",
    "slaDeadline": "2026-06-14T18:00:00+10:00",
    "payRate": 38.50,
    "chargeRate": 62.00,
    "currency": "AUD",
    "instructions": "Use staff entry on Curlewis St.",
    "cancellationPolicy": { "noticeHours": 24, "chargeIfWithinNotice": "partial" }
  }
}`,
    responseBody: [
      { name: 'accepted', type: 'boolean', description: 'Whether the agency accepts the brief.', example: true },
      { name: 'estimatedCandidates', type: 'integer', description: 'Number of candidates the agency expects to submit.', example: 3 },
      { name: 'declineReason', type: 'string', description: 'Required when accepted=false.' },
      { name: 'received', type: 'boolean', description: 'Generic ACK if no decision yet. Defaults to true on any 2xx with no body.' },
    ],
    responseSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      properties: {
        accepted: { type: 'boolean' },
        estimatedCandidates: { type: 'integer', minimum: 0 },
        declineReason: { type: 'string' },
        received: { type: 'boolean' },
      },
      allOf: [{
        if: { properties: { accepted: { const: false } }, required: ['accepted'] },
        then: { required: ['declineReason'] },
      }],
    },
    responseExample: `{ "accepted": true, "estimatedCandidates": 3 }`,
  },

  {
    id: 'shift-cancelled',
    group: 'Shift Requests',
    method: 'POST',
    path: '{agency.webhookUrl}',
    direction: 'webhook',
    auth: 'HMAC X-RosteredAI-Signature',
    summary: 'shift.cancelled — open shift withdrawn',
    description: 'Fired when a tenant cancels a shift before it has been filled. Agency should stop matching candidates immediately.',
    webhook: {
      eventName: 'shift.cancelled',
      deliveryHeaders: agencyWebhookDeliveryHeaders,
      retrySchedule: agencyWebhookRetrySchedule.map(r => `Attempt ${r.attempt}: ${r.delay} (cumulative ${r.cumulative})`),
      expectedResponse: '2xx within 5 s with empty body or `{ "received": true }`.',
      deadLetter: 'Same as shift.broadcast.',
    },
    requestSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['eventId', 'eventType', 'occurredAt', 'data'],
      properties: {
        eventId: { type: 'string', format: 'uuid' },
        eventType: { type: 'string', const: 'shift.cancelled' },
        occurredAt: isoDateTime,
        data: {
          type: 'object',
          required: ['shiftRequestId', 'tenantId', 'cancelledAt', 'reason'],
          properties: {
            shiftRequestId: { type: 'string' },
            tenantId: { type: 'string' },
            cancelledBy: { type: 'string' },
            cancelledAt: isoDateTime,
            reason: { type: 'string', enum: ['filled_internally', 'no_longer_needed', 'duplicate', 'client_cancelled', 'other'] },
            notes: { type: 'string' },
            chargeAmount: { ...moneySchema, description: 'Cancellation fee if applicable.' },
          },
        },
      },
    },
    requestExample: `{
  "eventId": "c5b2…",
  "eventType": "shift.cancelled",
  "occurredAt": "2026-06-14T16:10:00+10:00",
  "data": {
    "shiftRequestId": "sr_01HXYZ",
    "tenantId": "tnt_4f9a",
    "cancelledBy": "Jane Manager",
    "cancelledAt": "2026-06-14T16:10:00+10:00",
    "reason": "no_longer_needed",
    "chargeAmount": 0
  }
}`,
    responseExample: `{ "received": true }`,
  },

  {
    id: 'submit-confirmed-candidates',
    group: 'Shift Requests',
    method: 'POST',
    path: '/v1/shift-requests/{shiftRequestId}/candidates',
    direction: 'inbound',
    auth: 'Bearer (agency)',
    summary: 'Submit CONFIRMED candidates for a broadcast shift',
    description: 'Post ONLY candidates the agency has already contacted and who have explicitly confirmed acceptance of THIS shift. Speculative matches, "available" candidates, or shortlists must not be posted here — filter them agency-side first. Each record must carry `confirmedAvailable: true`, `confirmedAt` (≤ 60 minutes old), and `confirmationMethod`. The platform runs eligibility + compliance checks and, in express mode, may auto-create the placement.',
    pathParams: [{ name: 'shiftRequestId', type: 'string', required: true, description: 'Platform shift request id.' }],
    requestBody: [
      { name: 'candidates', type: 'object[]', required: true, description: 'Confirmed candidates only. See Candidate schema — `confirmedAvailable`, `confirmedAt`, `confirmationMethod` are mandatory.' },
    ],
    requestSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['candidates'],
      properties: {
        candidates: { type: 'array', minItems: 1, maxItems: 50, items: candidateInputSchema },
      },
    },
    requestExample: `{
  "candidates": [
    {
      "externalId": "bsc_993",
      "firstName": "Maria",
      "lastName": "Nguyen",
      "email": "maria.n@brightstaff.com.au",
      "phone": "+61400999111",
      "employmentType": "casual",
      "primaryRole": "Educator – Diploma",
      "yearsExperience": 5,
      "awardClassification": "CS Level 3.4",
      "payRate": 38.50,
      "skills": [{ "name":"0-2yr room","level":"advanced","yearsExperience":4 }],
      "certifications": [
        { "name":"WWCC","issuer":"NSW Govt","issueDate":"2023-02-10","expiryDate":"2028-02-10","status":"valid","documentUrl":"https://files.brightstaff.com.au/wwcc.pdf" },
        { "name":"First Aid","issuer":"St John","issueDate":"2024-09-01","expiryDate":"2026-09-01","status":"valid" }
      ],
      "rightToWork": { "status":"citizen" },
      "complianceScore": 98,
      "reliabilityScore": 95,
      "hoursWorkedThisWeek": 22,
      "lastShiftEndTime": "2026-06-14T16:30:00+10:00",
      "confirmedAvailable": true,
      "confirmedAt": "2026-06-15T08:12:44+10:00",
      "confirmationMethod": "sms",
      "confirmationReference": "twlo_SM1a2b3c"
    }
  ]
}`,
    responseBody: [
      { name: 'results', type: 'object[]', description: '[{ externalId, candidateId, matchScore, isEligible, ineligibilityReasons[] }]' },
    ],
    responseSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['results'],
      properties: {
        results: {
          type: 'array',
          items: {
            type: 'object',
            required: ['externalId', 'isEligible'],
            properties: {
              externalId: { type: 'string' },
              candidateId: { type: 'string', description: 'Platform-side id assigned to this candidate. Empty if ineligible.' },
              matchScore: { type: 'integer', minimum: 0, maximum: 100 },
              skillMatch: { type: 'integer', minimum: 0, maximum: 100 },
              proximityMatch: { type: 'integer', minimum: 0, maximum: 100 },
              availabilityMatch: { type: 'integer', minimum: 0, maximum: 100 },
              isEligible: { type: 'boolean' },
              ineligibilityReasons: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
    responseExample: `{
  "results": [
    { "externalId":"bsc_993","candidateId":"cand_77a1","matchScore":92,"skillMatch":90,"proximityMatch":95,"availabilityMatch":91,"isEligible":true }
  ]
}`,
    errorCodes: [
      { code: '404 shift_not_found', description: 'Shift request id not recognised.' },
      { code: '410 shift_closed', description: 'SLA expired or shift already filled.' },
      { code: '422 candidate_validation_error', description: 'One or more candidate records failed schema validation.' },
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
      { name: 'agreedPayRate', type: 'number', required: false, description: 'Per-placement override of broadcast pay rate.' },
      { name: 'agreedChargeRate', type: 'number', required: false, description: 'Per-placement override of broadcast charge rate.' },
    ],
    requestSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['shiftRequestId', 'candidateId', 'scheduledStart', 'scheduledEnd', 'breakMinutes'],
      properties: {
        shiftRequestId: { type: 'string' },
        candidateId: { type: 'string' },
        scheduledStart: isoDateTime,
        scheduledEnd: isoDateTime,
        breakMinutes: { type: 'integer', minimum: 0, maximum: 480 },
        isBackup: { type: 'boolean', default: false },
        backupPriority: { type: 'integer', minimum: 1 },
        agreedPayRate: moneySchema,
        agreedChargeRate: moneySchema,
        notes: { type: 'string', maxLength: 1000 },
      },
    },
    requestExample: `{
  "shiftRequestId": "sr_01HXYZ",
  "candidateId": "cand_77a1",
  "scheduledStart": "2026-06-15T07:30:00+10:00",
  "scheduledEnd": "2026-06-15T16:30:00+10:00",
  "breakMinutes": 30,
  "isBackup": false,
  "agreedChargeRate": 62.00
}`,
    responseBody: [
      { name: 'id', type: 'string', description: 'Placement id.' },
      { name: 'status', type: 'enum', description: 'pending | confirmed | checked_in | completed | no_show | cancelled' },
      { name: 'assignedAt', type: 'string (ISO-8601)', description: 'Assignment timestamp.' },
    ],
    responseSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['id', 'status', 'assignedAt'],
      properties: {
        id: { type: 'string' },
        shiftRequestId: { type: 'string' },
        candidateId: { type: 'string' },
        status: { type: 'string', enum: ['pending', 'confirmed', 'checked_in', 'completed', 'no_show', 'cancelled'] },
        assignedAt: isoDateTime,
        confirmationDeadline: { ...isoDateTime, description: 'Managed mode only.' },
      },
    },
    responseExample: `{
  "id":"plc_55ab",
  "shiftRequestId":"sr_01HXYZ",
  "candidateId":"cand_77a1",
  "status":"confirmed",
  "assignedAt":"2026-06-10T09:42:11Z"
}`,
    errorCodes: [
      { code: '409 already_filled', description: 'All positions already filled.' },
      { code: '422 not_eligible', description: 'Candidate failed eligibility (returned reasons in errors[]).' },
      { code: '422 fatigue_violation', description: 'Candidate exceeds weekly hours or rest break rule.' },
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
    requestSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      minProperties: 1,
      properties: {
        status: { type: 'string', enum: ['cancelled', 'confirmed'] },
        replacementCandidateId: { type: 'string' },
        reason: { type: 'string', enum: ['candidate_sick', 'candidate_unavailable', 'duplicate', 'client_request', 'other'] },
        notes: { type: 'string', maxLength: 1000 },
      },
      allOf: [{
        if: { properties: { status: { const: 'cancelled' } }, required: ['status'] },
        then: { required: ['reason'] },
      }],
    },
    requestExample: `{ "status":"cancelled","reason":"candidate_sick","notes":"Flu, returning Monday." }`,
    responseExample: `{ "id":"plc_55ab","status":"cancelled","updatedAt":"2026-06-14T22:10:00+10:00" }`,
  },

  {
    id: 'placement-webhook',
    group: 'Placements',
    method: 'POST',
    path: '{agency.webhookUrl}',
    direction: 'webhook',
    auth: 'HMAC X-RosteredAI-Signature',
    summary: 'placement.status — placement lifecycle event',
    description: 'Emitted on every transition: pending → confirmed → checked_in → completed; or → no_show / cancelled.',
    webhook: {
      eventName: 'placement.status',
      deliveryHeaders: agencyWebhookDeliveryHeaders,
      retrySchedule: agencyWebhookRetrySchedule.map(r => `Attempt ${r.attempt}: ${r.delay} (cumulative ${r.cumulative})`),
      expectedResponse: '2xx within 5 s.',
      deadLetter: 'Event moved to dead_letter; agency can replay via /v1/agencies/{agencyId}/webhook-deliveries.',
    },
    requestSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['eventId', 'eventType', 'occurredAt', 'data'],
      properties: {
        eventId: { type: 'string', format: 'uuid' },
        eventType: { type: 'string', const: 'placement.status' },
        occurredAt: isoDateTime,
        data: {
          type: 'object',
          required: ['placementId', 'shiftRequestId', 'candidateId', 'status', 'previousStatus'],
          properties: {
            placementId: { type: 'string' },
            shiftRequestId: { type: 'string' },
            candidateId: { type: 'string' },
            externalCandidateId: { type: 'string', description: 'Agency-side candidate id, if known.' },
            status: { type: 'string', enum: ['pending', 'confirmed', 'checked_in', 'completed', 'no_show', 'cancelled'] },
            previousStatus: { type: 'string', enum: ['pending', 'confirmed', 'checked_in', 'completed', 'no_show', 'cancelled'] },
            scheduledStart: isoDateTime,
            scheduledEnd: isoDateTime,
            clockedInAt: { ...isoDateTime, nullable: true },
            clockedOutAt: { ...isoDateTime, nullable: true },
            geoLocationClockIn: {
              type: 'object',
              properties: { lat: { type: 'number' }, lng: { type: 'number' }, accuracyMeters: { type: 'number' } },
            },
            geoLocationClockOut: {
              type: 'object',
              properties: { lat: { type: 'number' }, lng: { type: 'number' }, accuracyMeters: { type: 'number' } },
            },
            cancellationReason: { type: 'string' },
            replacedByPlacementId: { type: 'string' },
          },
        },
      },
    },
    requestHeaders: agencyWebhookDeliveryHeaders,
    requestExample: `{
  "eventId":"e7c2…",
  "eventType":"placement.status",
  "occurredAt":"2026-06-15T07:28:43+10:00",
  "data": {
    "placementId":"plc_55ab",
    "shiftRequestId":"sr_01HXYZ",
    "candidateId":"cand_77a1",
    "externalCandidateId":"bsc_993",
    "status":"checked_in",
    "previousStatus":"confirmed",
    "scheduledStart":"2026-06-15T07:30:00+10:00",
    "scheduledEnd":"2026-06-15T16:30:00+10:00",
    "clockedInAt":"2026-06-15T07:28:42+10:00",
    "geoLocationClockIn":{ "lat":-33.8915,"lng":151.2767,"accuracyMeters":12 }
  }
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
    requestSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['actualStart', 'actualEnd', 'breakMinutes', 'grossHours', 'netHours'],
      properties: {
        actualStart: isoDateTime,
        actualEnd: isoDateTime,
        breakMinutes: { type: 'integer', minimum: 0, maximum: 480 },
        grossHours: { type: 'number', minimum: 0, multipleOf: 0.01 },
        netHours: { type: 'number', minimum: 0, multipleOf: 0.01 },
        overtimeHours: { type: 'number', minimum: 0, multipleOf: 0.01 },
        publicHolidayHours: { type: 'number', minimum: 0 },
        nightShiftHours: { type: 'number', minimum: 0 },
        allowances: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'type', 'amount', 'taxable'],
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['per_shift', 'per_hour', 'per_km', 'fixed'] },
              amount: moneySchema,
              quantity: { type: 'number', minimum: 0 },
              taxable: { type: 'boolean' },
            },
          },
        },
        exceptions: {
          type: 'array',
          items: {
            type: 'object',
            required: ['reason'],
            properties: {
              reason: { type: 'string', enum: ['unpaid_overtime', 'late_start', 'early_finish', 'no_break_taken', 'incident', 'equipment_issue', 'other'] },
              note: { type: 'string', maxLength: 1000 },
            },
          },
        },
        supervisorSignatureUrl: { type: 'string', format: 'uri' },
        supervisorName: { type: 'string' },
        supervisorApprovedAt: isoDateTime,
        clockEvents: {
          type: 'array',
          description: 'Raw clock-in/out events for audit. Optional.',
          items: {
            type: 'object',
            required: ['type', 'timestamp'],
            properties: {
              type: { type: 'string', enum: ['clock_in', 'clock_out', 'break_start', 'break_end'] },
              timestamp: isoDateTime,
              geo: { type: 'object', properties: { lat: { type: 'number' }, lng: { type: 'number' } } },
              source: { type: 'string', enum: ['mobile', 'kiosk', 'manual'] },
            },
          },
        },
        notes: { type: 'string', maxLength: 2000 },
      },
    },
    requestExample: `{
  "actualStart":"2026-06-15T07:28:42+10:00",
  "actualEnd":"2026-06-15T16:32:10+10:00",
  "breakMinutes":30,
  "grossHours":9.05,
  "netHours":8.55,
  "overtimeHours":0.55,
  "allowances":[
    { "name":"Travel","type":"per_shift","amount":15.00,"taxable":true }
  ],
  "exceptions":[
    { "reason":"unpaid_overtime","note":"Stayed late for handover" }
  ],
  "supervisorSignatureUrl":"https://files.brightstaff.com.au/sig_plc55ab.png",
  "supervisorName":"Priya Manager",
  "supervisorApprovedAt":"2026-06-15T16:35:00+10:00",
  "clockEvents":[
    { "type":"clock_in","timestamp":"2026-06-15T07:28:42+10:00","source":"mobile" },
    { "type":"break_start","timestamp":"2026-06-15T12:00:00+10:00","source":"mobile" },
    { "type":"break_end","timestamp":"2026-06-15T12:30:00+10:00","source":"mobile" },
    { "type":"clock_out","timestamp":"2026-06-15T16:32:10+10:00","source":"mobile" }
  ]
}`,
    responseSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['timesheetId', 'status', 'submittedAt'],
      properties: {
        timesheetId: { type: 'string' },
        status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
        submittedAt: isoDateTime,
        approvalDeadline: isoDateTime,
      },
    },
    responseExample: `{ "timesheetId":"ts_91cd","status":"pending","submittedAt":"2026-06-15T16:40:02+10:00","approvalDeadline":"2026-06-17T16:40:02+10:00" }`,
  },

  {
    id: 'timesheet-status-webhook',
    group: 'Timesheets',
    method: 'POST',
    path: '{agency.webhookUrl}',
    direction: 'webhook',
    auth: 'HMAC X-RosteredAI-Signature',
    summary: 'timesheet.status — approval / rejection',
    webhook: {
      eventName: 'timesheet.status',
      deliveryHeaders: agencyWebhookDeliveryHeaders,
      retrySchedule: agencyWebhookRetrySchedule.map(r => `Attempt ${r.attempt}: ${r.delay} (cumulative ${r.cumulative})`),
      expectedResponse: '2xx within 5 s.',
      deadLetter: 'Same as other webhooks.',
    },
    requestHeaders: agencyWebhookDeliveryHeaders,
    requestSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['eventId', 'eventType', 'occurredAt', 'data'],
      properties: {
        eventId: { type: 'string', format: 'uuid' },
        eventType: { type: 'string', const: 'timesheet.status' },
        occurredAt: isoDateTime,
        data: {
          type: 'object',
          required: ['timesheetId', 'placementId', 'status', 'reviewedBy', 'reviewedAt'],
          properties: {
            timesheetId: { type: 'string' },
            placementId: { type: 'string' },
            shiftRequestId: { type: 'string' },
            status: { type: 'string', enum: ['approved', 'rejected'] },
            reviewedBy: { type: 'string' },
            reviewedAt: isoDateTime,
            rejectionReason: { type: 'string' },
            approvedHours: { type: 'number', minimum: 0 },
            approvedOvertimeHours: { type: 'number', minimum: 0 },
            adjustments: {
              type: 'array',
              items: {
                type: 'object',
                required: ['field', 'from', 'to', 'reason'],
                properties: {
                  field: { type: 'string', enum: ['actualStart', 'actualEnd', 'breakMinutes', 'netHours'] },
                  from: { type: ['string', 'number'] },
                  to: { type: ['string', 'number'] },
                  reason: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    requestExample: `{
  "eventId":"a91c…",
  "eventType":"timesheet.status",
  "occurredAt":"2026-06-16T09:14:00+10:00",
  "data": {
    "timesheetId":"ts_91cd",
    "placementId":"plc_55ab",
    "shiftRequestId":"sr_01HXYZ",
    "status":"approved",
    "reviewedBy":"Jane Manager",
    "reviewedAt":"2026-06-16T09:14:00+10:00",
    "approvedHours":8.55,
    "approvedOvertimeHours":0.55
  }
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
    requestSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['invoiceNumber', 'periodStart', 'periodEnd', 'clientId', 'lineItems', 'subtotal', 'gst', 'total', 'dueDate', 'currency'],
      properties: {
        invoiceNumber: { type: 'string', maxLength: 50 },
        periodStart: isoDate,
        periodEnd: isoDate,
        clientId: { type: 'string' },
        currency: { type: 'string', pattern: '^[A-Z]{3}$' },
        lineItems: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['description', 'hours', 'rate', 'subtotal', 'total'],
            properties: {
              id: { type: 'string' },
              placementId: { type: 'string' },
              timesheetId: { type: 'string' },
              candidateName: { type: 'string' },
              shiftDate: isoDate,
              description: { type: 'string' },
              hours: { type: 'number', minimum: 0 },
              rate: moneySchema,
              subtotal: moneySchema,
              loadings: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['type', 'percentage', 'amount'],
                  properties: {
                    type: { type: 'string', enum: ['weekend', 'public_holiday', 'overtime', 'night_shift', 'casual_loading', 'other'] },
                    percentage: { type: 'number', minimum: 0 },
                    amount: moneySchema,
                  },
                },
              },
              total: moneySchema,
            },
          },
        },
        subtotal: moneySchema,
        gst: moneySchema,
        total: moneySchema,
        dueDate: isoDate,
        paymentTerms: { type: 'string', description: 'e.g. NET-30.' },
        purchaseOrderNumber: { type: 'string' },
        pdfUrl: { type: 'string', format: 'uri' },
        bankDetails: {
          type: 'object',
          properties: {
            bsb: { type: 'string' },
            accountNumber: { type: 'string' },
            accountName: { type: 'string' },
          },
        },
      },
    },
    requestExample: `{
  "invoiceNumber":"INV-2026-00091",
  "periodStart":"2026-06-08",
  "periodEnd":"2026-06-14",
  "clientId":"tnt_4f9a",
  "currency":"AUD",
  "lineItems":[
    {
      "placementId":"plc_55ab",
      "timesheetId":"ts_91cd",
      "candidateName":"Maria Nguyen",
      "shiftDate":"2026-06-15",
      "description":"Educator – Diploma · Bondi",
      "hours":8.55,
      "rate":62.00,
      "subtotal":530.10,
      "loadings":[{ "type":"weekend","percentage":25,"amount":132.55 }],
      "total":662.65
    }
  ],
  "subtotal":662.65,
  "gst":66.27,
  "total":728.92,
  "dueDate":"2026-07-14",
  "paymentTerms":"NET-30",
  "purchaseOrderNumber":"PO-2026-AC-118"
}`,
    responseSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['id', 'status', 'createdAt'],
      properties: {
        id: { type: 'string' },
        invoiceNumber: { type: 'string' },
        status: { type: 'string', enum: ['draft', 'sent', 'paid', 'overdue', 'disputed'] },
        createdAt: isoDateTime,
        dueDate: isoDate,
      },
    },
    responseExample: `{ "id":"inv_22ef","invoiceNumber":"INV-2026-00091","status":"sent","createdAt":"2026-06-16T10:00:00+10:00","dueDate":"2026-07-14" }`,
    errorCodes: [
      { code: '422 line_item_mismatch', description: 'A line item does not match approved hours or contracted rate.' },
      { code: '409 duplicate_invoice_number', description: 'invoiceNumber already used for this agency.' },
    ],
  },

  {
    id: 'invoice-status-webhook',
    group: 'Invoices',
    method: 'POST',
    path: '{agency.webhookUrl}',
    direction: 'webhook',
    auth: 'HMAC X-RosteredAI-Signature',
    summary: 'invoice.status — payment / dispute update',
    webhook: {
      eventName: 'invoice.status',
      deliveryHeaders: agencyWebhookDeliveryHeaders,
      retrySchedule: agencyWebhookRetrySchedule.map(r => `Attempt ${r.attempt}: ${r.delay} (cumulative ${r.cumulative})`),
      expectedResponse: '2xx within 5 s.',
      deadLetter: 'Same as other webhooks.',
    },
    requestHeaders: agencyWebhookDeliveryHeaders,
    requestSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['eventId', 'eventType', 'occurredAt', 'data'],
      properties: {
        eventId: { type: 'string', format: 'uuid' },
        eventType: { type: 'string', const: 'invoice.status' },
        occurredAt: isoDateTime,
        data: {
          type: 'object',
          required: ['invoiceId', 'invoiceNumber', 'status'],
          properties: {
            invoiceId: { type: 'string' },
            invoiceNumber: { type: 'string' },
            status: { type: 'string', enum: ['sent', 'paid', 'overdue', 'disputed', 'cancelled'] },
            paidAt: { ...isoDateTime, nullable: true },
            amountPaid: moneySchema,
            currency: { type: 'string', pattern: '^[A-Z]{3}$' },
            paymentReference: { type: 'string' },
            disputeReason: { type: 'string' },
            disputedLineItemIds: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
    requestExample: `{
  "eventId":"f3b9…",
  "eventType":"invoice.status",
  "occurredAt":"2026-06-30T11:22:00+10:00",
  "data": {
    "invoiceId":"inv_22ef",
    "invoiceNumber":"INV-2026-00091",
    "status":"paid",
    "paidAt":"2026-06-30T11:22:00+10:00",
    "amountPaid":728.92,
    "currency":"AUD",
    "paymentReference":"EFT-998812"
  }
}`,
    responseExample: `{ "received": true }`,
  },

  // ============ SHIFT REQUEST LIFECYCLE WEBHOOKS ============
  {
    id: 'shift-updated',
    group: 'Shift Requests',
    method: 'POST',
    path: '{agency.webhookUrl}',
    direction: 'webhook',
    auth: 'HMAC X-RosteredAI-Signature',
    summary: 'shift_request.updated — broadcast details changed',
    description: 'Fired when a tenant edits a live shift request after dispatch (time, break, rates, requirements, instructions). Includes the full new payload plus a diff of what changed. Agency should re-evaluate any pending candidate submissions.',
    webhook: {
      eventName: 'shift_request.updated',
      deliveryHeaders: agencyWebhookDeliveryHeaders,
      retrySchedule: agencyWebhookRetrySchedule.map(r => `Attempt ${r.attempt}: ${r.delay} (cumulative ${r.cumulative})`),
      expectedResponse: '2xx within 5 s. Body MAY include `{ "withdrawCandidates": boolean }` to auto-withdraw previously submitted candidates that no longer match.',
      deadLetter: 'After 8 failed attempts the event is dead-lettered; replay via /v1/agencies/{agencyId}/webhook-deliveries/{deliveryId}/replay.',
    },
    requestHeaders: agencyWebhookDeliveryHeaders,
    requestSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['eventId', 'eventType', 'occurredAt', 'data'],
      properties: {
        eventId: { type: 'string', format: 'uuid' },
        eventType: { type: 'string', const: 'shift_request.updated' },
        occurredAt: isoDateTime,
        data: {
          type: 'object',
          required: ['shiftRequestId', 'tenantId', 'updatedAt', 'changes', 'shift'],
          properties: {
            shiftRequestId: { type: 'string' },
            tenantId: { type: 'string' },
            updatedBy: { type: 'string' },
            updatedAt: isoDateTime,
            changes: {
              type: 'array',
              description: 'Field-level diff of every changed property.',
              items: {
                type: 'object',
                required: ['field', 'from', 'to'],
                properties: {
                  field: { type: 'string', example: 'startTime' },
                  from: { },
                  to: { },
                },
              },
            },
            shift: { type: 'object', description: 'Full updated shift payload (same shape as shift.broadcast → data).' },
          },
        },
      },
    },
    requestExample: `{
  "eventId":"u1f4c2a0-…",
  "eventType":"shift_request.updated",
  "occurredAt":"2026-06-12T11:05:00+10:00",
  "data": {
    "shiftRequestId":"sr_01HXYZ",
    "tenantId":"tnt_4f9a",
    "updatedBy":"Jane Manager",
    "updatedAt":"2026-06-12T11:05:00+10:00",
    "changes":[
      { "field":"startTime","from":"07:30","to":"08:00" },
      { "field":"chargeRate","from":62.00,"to":65.00 }
    ],
    "shift": {
      "shiftRequestId":"sr_01HXYZ","tenantId":"tnt_4f9a","date":"2026-06-15",
      "startTime":"08:00","endTime":"16:30","breakMinutes":30,
      "payRate":38.50,"chargeRate":65.00,"currency":"AUD",
      "requirements":[{ "roleName":"Educator – Diploma","quantity":2 }]
    }
  }
}`,
    responseExample: `{ "received": true, "withdrawCandidates": false }`,
  },

  {
    id: 'shift-accepted',
    group: 'Shift Requests',
    method: 'POST',
    path: '{agency.webhookUrl}',
    direction: 'webhook',
    auth: 'HMAC X-RosteredAI-Signature',
    summary: 'shift_request.accepted — candidate confirmed for shift',
    description: "Fired when one of the agency's submitted candidates is accepted by the client (managed mode) or auto-confirmed (express mode). Carries the resulting placement id. Multiple events fire for multi-position shifts — one per filled seat.",
    webhook: {
      eventName: 'shift_request.accepted',
      deliveryHeaders: agencyWebhookDeliveryHeaders,
      retrySchedule: agencyWebhookRetrySchedule.map(r => `Attempt ${r.attempt}: ${r.delay} (cumulative ${r.cumulative})`),
      expectedResponse: '2xx within 5 s. Empty body or `{ "received": true }`.',
      deadLetter: 'After 8 failed attempts the event is dead-lettered. The placement remains valid regardless.',
    },
    requestHeaders: agencyWebhookDeliveryHeaders,
    requestSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['eventId', 'eventType', 'occurredAt', 'data'],
      properties: {
        eventId: { type: 'string', format: 'uuid' },
        eventType: { type: 'string', const: 'shift_request.accepted' },
        occurredAt: isoDateTime,
        data: {
          type: 'object',
          required: ['shiftRequestId', 'placementId', 'candidateId', 'positionsFilled', 'totalPositions'],
          properties: {
            shiftRequestId: { type: 'string' },
            placementId: { type: 'string' },
            candidateId: { type: 'string' },
            externalCandidateId: { type: 'string' },
            acceptedBy: { type: 'string' },
            acceptedAt: isoDateTime,
            positionsFilled: { type: 'integer', minimum: 1 },
            totalPositions: { type: 'integer', minimum: 1 },
            agreedPayRate: moneySchema,
            agreedChargeRate: moneySchema,
          },
        },
      },
    },
    requestExample: `{
  "eventId":"a2b8…",
  "eventType":"shift_request.accepted",
  "occurredAt":"2026-06-12T14:22:11+10:00",
  "data": {
    "shiftRequestId":"sr_01HXYZ",
    "placementId":"plc_55ab",
    "candidateId":"cand_77a1",
    "externalCandidateId":"bsc_993",
    "acceptedBy":"Jane Manager",
    "acceptedAt":"2026-06-12T14:22:11+10:00",
    "positionsFilled":1,
    "totalPositions":2,
    "agreedPayRate":38.50,
    "agreedChargeRate":62.00
  }
}`,
    responseExample: `{ "received": true }`,
  },

  {
    id: 'shift-rejected',
    group: 'Shift Requests',
    method: 'POST',
    path: '{agency.webhookUrl}',
    direction: 'webhook',
    auth: 'HMAC X-RosteredAI-Signature',
    summary: 'shift_request.rejected — submission(s) declined or shift closed to agency',
    description: 'Fired when (a) the client rejects one or more candidates submitted by this agency, (b) the shift is fully filled by another agency, or (c) the SLA deadline elapses with no accepted submissions. Inspect `data.scope` to differentiate.',
    webhook: {
      eventName: 'shift_request.rejected',
      deliveryHeaders: agencyWebhookDeliveryHeaders,
      retrySchedule: agencyWebhookRetrySchedule.map(r => `Attempt ${r.attempt}: ${r.delay} (cumulative ${r.cumulative})`),
      expectedResponse: '2xx within 5 s.',
      deadLetter: 'After 8 failed attempts the event is dead-lettered.',
    },
    requestHeaders: agencyWebhookDeliveryHeaders,
    requestSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['eventId', 'eventType', 'occurredAt', 'data'],
      properties: {
        eventId: { type: 'string', format: 'uuid' },
        eventType: { type: 'string', const: 'shift_request.rejected' },
        occurredAt: isoDateTime,
        data: {
          type: 'object',
          required: ['shiftRequestId', 'scope', 'reason'],
          properties: {
            shiftRequestId: { type: 'string' },
            scope: { type: 'string', enum: ['candidate', 'shift_closed_filled_elsewhere', 'sla_expired'] },
            reason: { type: 'string', enum: ['not_qualified', 'compliance_failed', 'price_too_high', 'duplicate_submission', 'client_choice', 'shift_filled', 'sla_expired', 'other'] },
            note: { type: 'string', maxLength: 1000 },
            rejectedBy: { type: 'string', nullable: true },
            rejectedAt: isoDateTime,
            rejectedCandidates: {
              type: 'array',
              items: {
                type: 'object',
                required: ['candidateId'],
                properties: {
                  candidateId: { type: 'string' },
                  externalCandidateId: { type: 'string' },
                  reason: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    requestExample: `{
  "eventId":"r9d4…",
  "eventType":"shift_request.rejected",
  "occurredAt":"2026-06-12T15:00:00+10:00",
  "data": {
    "shiftRequestId":"sr_01HXYZ",
    "scope":"candidate",
    "reason":"compliance_failed",
    "rejectedBy":"Jane Manager",
    "rejectedAt":"2026-06-12T15:00:00+10:00",
    "rejectedCandidates":[
      { "candidateId":"cand_77a2","externalCandidateId":"bsc_994","reason":"First Aid certificate expires before shift date." }
    ]
  }
}`,
    responseExample: `{ "received": true }`,
  },


  // ============ WEBHOOK DELIVERIES (introspection) ============
  {
    id: 'webhook-deliveries-list',
    group: 'Webhook Deliveries',
    method: 'GET',
    path: '/v1/agencies/{agencyId}/webhook-deliveries',
    direction: 'outbound',
    auth: 'Bearer (agency)',
    summary: 'List webhook deliveries (debug / replay)',
    pathParams: [{ name: 'agencyId', type: 'string', required: true, description: 'Agency id.' }],
    queryParams: [
      { name: 'status', type: 'enum', required: false, description: 'pending | success | failed | dead_letter' },
      { name: 'eventType', type: 'string', required: false, description: 'Filter by event name.' },
      { name: 'from', type: 'string (ISO-8601)', required: false, description: 'Created from.' },
      { name: 'to', type: 'string (ISO-8601)', required: false, description: 'Created to.' },
      { name: 'cursor', type: 'string', required: false, description: 'Pagination cursor.' },
      { name: 'limit', type: 'integer', required: false, description: 'Default 50, max 200.' },
    ],
    responseSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['data'],
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'eventId', 'eventType', 'status', 'attempts', 'createdAt'],
            properties: {
              id: { type: 'string' },
              eventId: { type: 'string', format: 'uuid' },
              eventType: { type: 'string' },
              status: { type: 'string', enum: ['pending', 'success', 'failed', 'dead_letter'] },
              attempts: { type: 'integer', minimum: 1 },
              lastAttemptAt: isoDateTime,
              nextAttemptAt: { ...isoDateTime, nullable: true },
              responseStatus: { type: 'integer' },
              responseBody: { type: 'string' },
              createdAt: isoDateTime,
            },
          },
        },
        nextCursor: { type: 'string', nullable: true },
      },
    },
    responseExample: `{
  "data": [
    {
      "id":"whd_01HZ",
      "eventId":"8a4e7e10-…",
      "eventType":"shift.broadcast",
      "status":"success",
      "attempts":1,
      "lastAttemptAt":"2026-06-10T09:00:01+10:00",
      "responseStatus":200,
      "createdAt":"2026-06-10T09:00:00+10:00"
    }
  ],
  "nextCursor": null
}`,
  },

  {
    id: 'webhook-deliveries-replay',
    group: 'Webhook Deliveries',
    method: 'POST',
    path: '/v1/agencies/{agencyId}/webhook-deliveries/{deliveryId}/replay',
    direction: 'inbound',
    auth: 'Bearer (agency)',
    summary: 'Replay a failed / dead-lettered webhook',
    pathParams: [
      { name: 'agencyId', type: 'string', required: true, description: 'Agency id.' },
      { name: 'deliveryId', type: 'string', required: true, description: 'Webhook delivery id.' },
    ],
    responseSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['deliveryId', 'status', 'queuedAt'],
      properties: {
        deliveryId: { type: 'string' },
        status: { type: 'string', enum: ['queued', 'success', 'failed'] },
        queuedAt: isoDateTime,
      },
    },
    responseExample: `{ "deliveryId":"whd_01HZ","status":"queued","queuedAt":"2026-06-11T10:00:00+10:00" }`,
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
    responseSchema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['totalShiftsRequested', 'totalShiftsFilled', 'fillRate'],
      properties: {
        totalShiftsRequested: { type: 'integer', minimum: 0 },
        totalShiftsFilled: { type: 'integer', minimum: 0 },
        fillRate: { type: 'number', minimum: 0, maximum: 100 },
        avgTimeToFillMinutes: { type: 'integer', minimum: 0 },
        totalRevenue: moneySchema,
        totalCost: moneySchema,
        grossProfit: { type: 'number' },
        marginPercentage: { type: 'number' },
        complianceAlerts: { type: 'integer', minimum: 0 },
        expiringDocuments: { type: 'integer', minimum: 0 },
        currency: { type: 'string', pattern: '^[A-Z]{3}$' },
      },
    },
    responseExample: `{
  "totalShiftsRequested":124,"totalShiftsFilled":108,"fillRate":87.1,
  "avgTimeToFillMinutes":42,"totalRevenue":58420.00,"totalCost":36210.00,
  "grossProfit":22210.00,"marginPercentage":38.0,
  "complianceAlerts":1,"expiringDocuments":2,"currency":"AUD"
}`,
  },
];

export const agencyApiCommonHeaders = commonHeaders;

export const agencyApiErrorEnvelope = {
  description: 'All 4xx/5xx responses follow this envelope.',
  schema: errorEnvelopeSchema,
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
  'Transport: HTTPS POST (TLS 1.2+). Bodies are UTF-8 JSON.',
  'Signing: X-RosteredAI-Signature = "t=<unix_ts>,v1=<hex>" where hex = HMAC_SHA256(webhookSecret, "<unix_ts>." + rawBody). Verify the timestamp is within 5 minutes of now to prevent replay.',
  'Idempotency: X-RosteredAI-Event-Id is unique per logical event. Persist seen ids for ≥ 48 h and treat duplicates as no-ops.',
  'Delivery attempts: X-RosteredAI-Delivery-Id changes per attempt; X-RosteredAI-Delivery-Attempt counts from 1 (max 8).',
  'Expected response: HTTP 2xx within 5 s. Body is optional; for shift.broadcast you may return { accepted, estimatedCandidates, declineReason } to control downstream behaviour.',
  'Retries: 30 s, 2 m, 10 m, 1 h, 6 h, 12 h, 24 h (cumulative ≈ 43 h). After 8 failed attempts the event is dead-lettered.',
  'Dead-letter: replay via POST /v1/agencies/{agencyId}/webhook-deliveries/{deliveryId}/replay. Visible for 30 days.',
  '410 Gone: respond 410 to permanently reject an event. Three consecutive 410s on any subscription suspend that subscription pending re-confirmation.',
  'Auto-disable: if no 2xx is received for 24 h across any events, the webhook is disabled and the agency primary contact is emailed.',
];
