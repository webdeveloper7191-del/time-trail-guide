// Agency Notification Service
// Handles notification templates and sending notifications to agencies

export type NotificationChannel = 'email' | 'sms' | 'app_push' | 'webhook';
export type NotificationEventType = 
  | 'shift_broadcast'
  | 'shift_urgent'
  | 'shift_escalated'
  | 'shift_filled'
  | 'shift_cancelled'
  | 'candidate_accepted'
  | 'candidate_rejected'
  | 'timesheet_reminder'
  | 'compliance_alert';

export interface NotificationTemplate {
  id: string;
  name: string;
  eventType: NotificationEventType;
  channel: NotificationChannel;
  subject: string;
  body: string;
  isActive: boolean;
  variables: TemplateVariable[];
  createdAt: string;
  updatedAt: string;
}

export interface TemplateVariable {
  key: string;
  description: string;
  example: string;
}

export interface NotificationRecord {
  id: string;
  templateId: string;
  eventType: NotificationEventType;
  channel: NotificationChannel;
  recipientId: string;
  recipientName: string;
  recipientContact: string; // email or phone
  subject: string;
  body: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  sentAt?: string;
  deliveredAt?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

// Template variables available for each event type
export const eventTypeVariables: Record<NotificationEventType, TemplateVariable[]> = {
  shift_broadcast: [
    { key: '{{agency_name}}', description: 'Agency name', example: 'Elite Staffing' },
    { key: '{{centre_name}}', description: 'Centre/Location name', example: 'Little Scholars Bondi' },
    { key: '{{shift_date}}', description: 'Date of the shift', example: 'Monday, 15 January 2024' },
    { key: '{{shift_time}}', description: 'Start and end time', example: '07:00 - 15:30' },
    { key: '{{role_required}}', description: 'Role needed', example: 'Early Childhood Teacher' },
    { key: '{{urgency}}', description: 'Urgency level', example: 'urgent' },
    { key: '{{pay_rate}}', description: 'Maximum pay rate', example: '$45.00/hr' },
    { key: '{{response_deadline}}', description: 'Deadline to respond', example: '4 hours' },
    { key: '{{broadcast_link}}', description: 'Link to view/respond', example: 'https://app.example.com/shifts/123' },
    { key: '{{special_requirements}}', description: 'Any special requirements', example: 'First Aid certified' },
  ],
  shift_urgent: [
    { key: '{{agency_name}}', description: 'Agency name', example: 'Elite Staffing' },
    { key: '{{centre_name}}', description: 'Centre name', example: 'Little Scholars Bondi' },
    { key: '{{shift_date}}', description: 'Shift date', example: 'Today' },
    { key: '{{shift_time}}', description: 'Shift time', example: '07:00 - 15:30' },
    { key: '{{time_remaining}}', description: 'Time until shift starts', example: '2 hours' },
  ],
  shift_escalated: [
    { key: '{{agency_name}}', description: 'Agency name', example: 'Elite Staffing' },
    { key: '{{centre_name}}', description: 'Centre name', example: 'Little Scholars Bondi' },
    { key: '{{shift_date}}', description: 'Shift date', example: 'Monday, 15 January' },
    { key: '{{shift_time}}', description: 'Shift time', example: '07:00 - 15:30' },
    { key: '{{escalation_tier}}', description: 'Current escalation tier', example: 'Tier 2' },
    { key: '{{new_urgency}}', description: 'New urgency level', example: 'critical' },
    { key: '{{increased_rate}}', description: 'New offered rate', example: '$55.00/hr' },
  ],
  shift_filled: [
    { key: '{{agency_name}}', description: 'Agency name', example: 'Elite Staffing' },
    { key: '{{centre_name}}', description: 'Centre name', example: 'Little Scholars Bondi' },
    { key: '{{shift_date}}', description: 'Shift date', example: 'Monday, 15 January' },
    { key: '{{shift_time}}', description: 'Shift time', example: '07:00 - 15:30' },
    { key: '{{worker_name}}', description: 'Assigned worker name', example: 'Sarah Chen' },
    { key: '{{filled_by_agency}}', description: 'Agency that filled', example: 'Quick Staff' },
  ],
  shift_cancelled: [
    { key: '{{agency_name}}', description: 'Agency name', example: 'Elite Staffing' },
    { key: '{{centre_name}}', description: 'Centre name', example: 'Little Scholars Bondi' },
    { key: '{{shift_date}}', description: 'Shift date', example: 'Monday, 15 January' },
    { key: '{{shift_time}}', description: 'Shift time', example: '07:00 - 15:30' },
    { key: '{{cancellation_reason}}', description: 'Reason for cancellation', example: 'Centre closed' },
  ],
  candidate_accepted: [
    { key: '{{candidate_name}}', description: 'Worker name', example: 'Sarah Chen' },
    { key: '{{centre_name}}', description: 'Centre name', example: 'Little Scholars Bondi' },
    { key: '{{shift_date}}', description: 'Shift date', example: 'Monday, 15 January' },
    { key: '{{shift_time}}', description: 'Shift time', example: '07:00 - 15:30' },
    { key: '{{pay_rate}}', description: 'Agreed pay rate', example: '$45.00/hr' },
    { key: '{{report_to}}', description: 'Who to report to', example: 'Jane Smith (Centre Director)' },
    { key: '{{address}}', description: 'Centre address', example: '123 Beach Road, Bondi NSW 2026' },
  ],
  candidate_rejected: [
    { key: '{{candidate_name}}', description: 'Worker name', example: 'Sarah Chen' },
    { key: '{{centre_name}}', description: 'Centre name', example: 'Little Scholars Bondi' },
    { key: '{{shift_date}}', description: 'Shift date', example: 'Monday, 15 January' },
    { key: '{{rejection_reason}}', description: 'Reason (optional)', example: 'Position filled' },
  ],
  timesheet_reminder: [
    { key: '{{candidate_name}}', description: 'Worker name', example: 'Sarah Chen' },
    { key: '{{shift_date}}', description: 'Shift date', example: 'Monday, 15 January' },
    { key: '{{centre_name}}', description: 'Centre name', example: 'Little Scholars Bondi' },
    { key: '{{submission_deadline}}', description: 'Deadline to submit', example: '48 hours' },
  ],
  compliance_alert: [
    { key: '{{agency_name}}', description: 'Agency name', example: 'Elite Staffing' },
    { key: '{{compliance_issue}}', description: 'Issue description', example: 'WWCC expiring' },
    { key: '{{worker_name}}', description: 'Affected worker', example: 'Sarah Chen' },
    { key: '{{expiry_date}}', description: 'Document expiry', example: '31 January 2024' },
  ],
};

// Default notification templates
export const defaultNotificationTemplates: NotificationTemplate[] = [
  {
    id: 'tpl-broadcast-email',
    name: 'Shift Broadcast - Email',
    eventType: 'shift_broadcast',
    channel: 'email',
    subject: '🔔 New Shift Available: {{role_required}} at {{centre_name}}',
    body: `Hi {{agency_name}},

We have a new shift available that matches your service capabilities.

📍 Location: {{centre_name}}
📅 Date: {{shift_date}}
⏰ Time: {{shift_time}}
👤 Role: {{role_required}}
💰 Rate: Up to {{pay_rate}}
⚡ Urgency: {{urgency}}

{{special_requirements}}

Please respond within {{response_deadline}}.

Click here to view and submit candidates: {{broadcast_link}}

Best regards,
Roster Management Team`,
    isActive: true,
    variables: eventTypeVariables.shift_broadcast,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'tpl-broadcast-sms',
    name: 'Shift Broadcast - SMS',
    eventType: 'shift_broadcast',
    channel: 'sms',
    subject: '',
    body: `NEW SHIFT: {{role_required}} at {{centre_name}}, {{shift_date}} {{shift_time}}. Rate: {{pay_rate}}. Respond within {{response_deadline}}. View: {{broadcast_link}}`,
    isActive: true,
    variables: eventTypeVariables.shift_broadcast,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'tpl-urgent-email',
    name: 'Urgent Shift - Email',
    eventType: 'shift_urgent',
    channel: 'email',
    subject: '🚨 URGENT: Shift starting in {{time_remaining}} - {{centre_name}}',
    body: `URGENT STAFFING REQUIRED

Hi {{agency_name}},

We urgently need staff for a shift starting in {{time_remaining}}.

📍 {{centre_name}}
📅 {{shift_date}}
⏰ {{shift_time}}

Immediate response required. Higher rates available for quick confirmation.

Respond Now →`,
    isActive: true,
    variables: eventTypeVariables.shift_urgent,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'tpl-escalated-email',
    name: 'Shift Escalated - Email',
    eventType: 'shift_escalated',
    channel: 'email',
    subject: '⚠️ Escalated Shift: Increased rates available - {{centre_name}}',
    body: `Hi {{agency_name}},

A shift has been escalated to {{escalation_tier}} with increased rates.

📍 {{centre_name}}
📅 {{shift_date}}
⏰ {{shift_time}}
⚡ New Urgency: {{new_urgency}}
💰 New Rate: {{increased_rate}}

Priority response requested.`,
    isActive: true,
    variables: eventTypeVariables.shift_escalated,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'tpl-filled-email',
    name: 'Shift Filled - Email',
    eventType: 'shift_filled',
    channel: 'email',
    subject: '✅ Shift Filled: {{centre_name}} - {{shift_date}}',
    body: `Hi {{agency_name}},

The following shift has been filled:

📍 {{centre_name}}
📅 {{shift_date}}
⏰ {{shift_time}}
👤 Filled by: {{worker_name}} ({{filled_by_agency}})

Thank you for your interest. We'll notify you of future opportunities.`,
    isActive: true,
    variables: eventTypeVariables.shift_filled,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'tpl-accepted-email',
    name: 'Candidate Accepted - Email',
    eventType: 'candidate_accepted',
    channel: 'email',
    subject: '✅ Shift Confirmed: {{candidate_name}} - {{centre_name}}',
    body: `Great news!

{{candidate_name}} has been confirmed for:

📍 {{centre_name}}
📫 {{address}}
📅 {{shift_date}}
⏰ {{shift_time}}
💰 Rate: {{pay_rate}}
👋 Report to: {{report_to}}

Please ensure {{candidate_name}} arrives 10 minutes early.

Important: Worker must bring valid ID and any required documentation.`,
    isActive: true,
    variables: eventTypeVariables.candidate_accepted,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: 'tpl-accepted-sms',
    name: 'Candidate Accepted - SMS',
    eventType: 'candidate_accepted',
    channel: 'sms',
    subject: '',
    body: `CONFIRMED: {{candidate_name}} at {{centre_name}}, {{shift_date}} {{shift_time}}. Report to {{report_to}}. Arrive 10min early.`,
    isActive: true,
    variables: eventTypeVariables.candidate_accepted,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

// Previous worker tracking
export interface PreviousWorkerRecord {
  workerId: string;
  workerName: string;
  agencyId: string;
  agencyName: string;
  centreId: string;
  centreName: string;
  shiftsWorked: number;
  lastShiftDate: string;
  averageRating: number;
  reliabilityScore: number;
  preferredByLocation: boolean;
  notes?: string;
}

// Generate mock previous workers for a location
export function generateMockPreviousWorkers(centreId: string): PreviousWorkerRecord[] {
  const mockWorkers: PreviousWorkerRecord[] = [
    {
      workerId: 'prev-1',
      workerName: 'Sarah Chen',
      agencyId: 'agency-1',
      agencyName: 'Elite Childcare Staffing',
      centreId,
      centreName: 'Demo Centre',
      shiftsWorked: 15,
      lastShiftDate: '2024-01-10',
      averageRating: 4.8,
      reliabilityScore: 98,
      preferredByLocation: true,
      notes: 'Excellent with babies room',
    },
    {
      workerId: 'prev-2',
      workerName: 'Michael Rodriguez',
      agencyId: 'agency-2',
      agencyName: 'Quick Staff Solutions',
      centreId,
      centreName: 'Demo Centre',
      shiftsWorked: 8,
      lastShiftDate: '2024-01-08',
      averageRating: 4.5,
      reliabilityScore: 92,
      preferredByLocation: true,
    },
    {
      workerId: 'prev-3',
      workerName: 'Emma Williams',
      agencyId: 'agency-3',
      agencyName: 'Care Connect Agency',
      centreId,
      centreName: 'Demo Centre',
      shiftsWorked: 22,
      lastShiftDate: '2024-01-12',
      averageRating: 4.9,
      reliabilityScore: 99,
      preferredByLocation: true,
      notes: 'Former permanent staff, knows centre well',
    },
    {
      workerId: 'prev-4',
      workerName: 'David Park',
      agencyId: 'agency-1',
      agencyName: 'Elite Childcare Staffing',
      centreId,
      centreName: 'Demo Centre',
      shiftsWorked: 5,
      lastShiftDate: '2023-12-20',
      averageRating: 4.2,
      reliabilityScore: 85,
      preferredByLocation: false,
    },
    {
      workerId: 'prev-5',
      workerName: 'Lisa Thompson',
      agencyId: 'agency-4',
      agencyName: 'Premium Educators',
      centreId,
      centreName: 'Demo Centre',
      shiftsWorked: 3,
      lastShiftDate: '2023-11-15',
      averageRating: 4.6,
      reliabilityScore: 90,
      preferredByLocation: false,
    },
  ];

  return mockWorkers;
}

// Simulate sending notification
export async function sendNotification(
  template: NotificationTemplate,
  recipientId: string,
  recipientName: string,
  recipientContact: string,
  variables: Record<string, string>
): Promise<NotificationRecord> {
  // Replace variables in subject and body
  let subject = template.subject;
  let body = template.body;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(key.replace(/[{}]/g, '\\$&'), 'g');
    subject = subject.replace(regex, value);
    body = body.replace(regex, value);
  }

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const record: NotificationRecord = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    templateId: template.id,
    eventType: template.eventType,
    channel: template.channel,
    recipientId,
    recipientName,
    recipientContact,
    subject,
    body,
    status: 'sent',
    sentAt: new Date().toISOString(),
  };

  return record;
}

// Get templates by event type
export function getTemplatesByEvent(eventType: NotificationEventType): NotificationTemplate[] {
  return defaultNotificationTemplates.filter(t => t.eventType === eventType && t.isActive);
}
