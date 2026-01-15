// Agency Escalation Service
// Handles automatic escalation logic for agency shift broadcasts

import { ShiftUrgency } from '@/types/agency';

export type EscalationStatus = 'pending' | 'escalated' | 'filled' | 'expired' | 'cancelled';

export interface AgencyResponse {
  agencyId: string;
  agencyName: string;
  respondedAt: string;
  candidatesSubmitted: number;
  candidates: CandidateSubmission[];
  status: 'pending' | 'submitted' | 'accepted' | 'rejected' | 'withdrawn';
}

export interface CandidateSubmission {
  id: string;
  candidateId: string;
  candidateName: string;
  profileImageUrl?: string;
  matchScore: number;
  skillMatch: number;
  proximityMatch: number;
  reliabilityScore: number;
  payRate: number;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  submittedAt: string;
  responseTimeMinutes: number;
}

export interface BroadcastTrackingRecord {
  id: string;
  shiftId: string;
  shiftDate: string;
  shiftTime: string;
  centreId: string;
  centreName: string;
  roomName?: string;
  role?: string;
  
  // Broadcast settings
  broadcastedAt: string;
  urgency: ShiftUrgency;
  responseDeadline: string;
  autoEscalateAt: string;
  
  // Agency tracking
  agenciesNotified: number;
  agenciesResponded: number;
  totalCandidatesSubmitted: number;
  
  // Responses
  responses: AgencyResponse[];
  
  // Escalation
  currentTier: number;
  maxTiers: number;
  escalationHistory: EscalationEvent[];
  
  // Status
  status: EscalationStatus;
  filledAt?: string;
  filledBy?: {
    agencyId: string;
    agencyName: string;
    candidateId: string;
    candidateName: string;
  };
}

export interface EscalationEvent {
  id: string;
  timestamp: string;
  type: 'initial_broadcast' | 'tier_escalate' | 'urgency_increase' | 'deadline_extend' | 'manual_escalate' | 'filled' | 'expired';
  fromTier?: number;
  toTier?: number;
  fromUrgency?: ShiftUrgency;
  toUrgency?: ShiftUrgency;
  agenciesNotified?: string[];
  reason: string;
}

export interface EscalationRule {
  triggerAfterMinutes: number;
  action: 'escalate_tier' | 'increase_urgency' | 'extend_deadline' | 'notify_supervisor';
  newUrgency?: ShiftUrgency;
  extendMinutes?: number;
  notifyAgencies?: string[];
}

// Default escalation rules
export const defaultEscalationRules: EscalationRule[] = [
  {
    triggerAfterMinutes: 30,
    action: 'escalate_tier',
  },
  {
    triggerAfterMinutes: 60,
    action: 'increase_urgency',
    newUrgency: 'urgent',
  },
  {
    triggerAfterMinutes: 120,
    action: 'escalate_tier',
  },
  {
    triggerAfterMinutes: 180,
    action: 'increase_urgency',
    newUrgency: 'critical',
  },
  {
    triggerAfterMinutes: 240,
    action: 'notify_supervisor',
  },
];

// Escalation service functions
export function checkEscalationNeeded(
  record: BroadcastTrackingRecord,
  rules: EscalationRule[] = defaultEscalationRules
): EscalationRule | null {
  if (record.status !== 'pending') return null;
  
  const broadcastTime = new Date(record.broadcastedAt).getTime();
  const now = Date.now();
  const elapsedMinutes = (now - broadcastTime) / (1000 * 60);
  
  // Find the first rule that should trigger but hasn't been applied yet
  for (const rule of rules) {
    if (elapsedMinutes >= rule.triggerAfterMinutes) {
      // Check if this rule has already been applied
      const alreadyApplied = record.escalationHistory.some(event => {
        if (rule.action === 'escalate_tier' && event.type === 'tier_escalate') {
          return event.toTier === record.currentTier + 1;
        }
        if (rule.action === 'increase_urgency' && event.type === 'urgency_increase') {
          return event.toUrgency === rule.newUrgency;
        }
        return false;
      });
      
      if (!alreadyApplied) {
        return rule;
      }
    }
  }
  
  return null;
}

export function applyEscalation(
  record: BroadcastTrackingRecord,
  rule: EscalationRule
): BroadcastTrackingRecord {
  const event: EscalationEvent = {
    id: `esc-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: 'initial_broadcast',
    reason: '',
  };
  
  const updatedRecord = { ...record };
  
  switch (rule.action) {
    case 'escalate_tier':
      if (record.currentTier < record.maxTiers) {
        event.type = 'tier_escalate';
        event.fromTier = record.currentTier;
        event.toTier = record.currentTier + 1;
        event.reason = `No response after ${rule.triggerAfterMinutes} minutes, escalating to tier ${record.currentTier + 1}`;
        updatedRecord.currentTier = record.currentTier + 1;
      }
      break;
      
    case 'increase_urgency':
      if (rule.newUrgency) {
        event.type = 'urgency_increase';
        event.fromUrgency = record.urgency;
        event.toUrgency = rule.newUrgency;
        event.reason = `Urgency increased from ${record.urgency} to ${rule.newUrgency} after ${rule.triggerAfterMinutes} minutes`;
        updatedRecord.urgency = rule.newUrgency;
      }
      break;
      
    case 'extend_deadline':
      if (rule.extendMinutes) {
        event.type = 'deadline_extend';
        event.reason = `Deadline extended by ${rule.extendMinutes} minutes`;
        const currentDeadline = new Date(record.responseDeadline);
        currentDeadline.setMinutes(currentDeadline.getMinutes() + rule.extendMinutes);
        updatedRecord.responseDeadline = currentDeadline.toISOString();
      }
      break;
      
    case 'notify_supervisor':
      event.type = 'manual_escalate';
      event.reason = 'Supervisor notified for manual intervention';
      break;
  }
  
  updatedRecord.escalationHistory = [...record.escalationHistory, event];
  
  return updatedRecord;
}

export function calculateTimeRemaining(deadline: string): {
  minutes: number;
  isOverdue: boolean;
  formatted: string;
} {
  const deadlineTime = new Date(deadline).getTime();
  const now = Date.now();
  const diffMinutes = Math.floor((deadlineTime - now) / (1000 * 60));
  
  if (diffMinutes <= 0) {
    return {
      minutes: Math.abs(diffMinutes),
      isOverdue: true,
      formatted: `${Math.abs(diffMinutes)}m overdue`,
    };
  }
  
  if (diffMinutes < 60) {
    return {
      minutes: diffMinutes,
      isOverdue: false,
      formatted: `${diffMinutes}m remaining`,
    };
  }
  
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  
  return {
    minutes: diffMinutes,
    isOverdue: false,
    formatted: `${hours}h ${mins}m remaining`,
  };
}

// Generate mock tracking data
export function generateMockBroadcastRecords(): BroadcastTrackingRecord[] {
  return [
    {
      id: 'broadcast-1',
      shiftId: 'open-1',
      shiftDate: '2024-01-16',
      shiftTime: '07:00 - 15:00',
      centreId: 'centre-1',
      centreName: 'Sunshine Early Learning',
      roomName: 'Toddlers',
      role: 'Early Childhood Educator',
      broadcastedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      urgency: 'urgent',
      responseDeadline: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      autoEscalateAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      agenciesNotified: 4,
      agenciesResponded: 2,
      totalCandidatesSubmitted: 5,
      responses: [
        {
          agencyId: 'agency-1',
          agencyName: 'Elite Childcare Staffing',
          respondedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          candidatesSubmitted: 3,
          status: 'submitted',
          candidates: [
            {
              id: 'sub-1',
              candidateId: 'cand-1',
              candidateName: 'Sarah Mitchell',
              matchScore: 94,
              skillMatch: 95,
              proximityMatch: 92,
              reliabilityScore: 96,
              payRate: 42,
              status: 'pending',
              submittedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
              responseTimeMinutes: 15,
            },
            {
              id: 'sub-2',
              candidateId: 'cand-2',
              candidateName: 'James Wong',
              matchScore: 88,
              skillMatch: 90,
              proximityMatch: 85,
              reliabilityScore: 91,
              payRate: 40,
              status: 'pending',
              submittedAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
              responseTimeMinutes: 17,
            },
            {
              id: 'sub-3',
              candidateId: 'cand-3',
              candidateName: 'Emily Chen',
              matchScore: 82,
              skillMatch: 85,
              proximityMatch: 78,
              reliabilityScore: 88,
              payRate: 38,
              status: 'pending',
              submittedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
              responseTimeMinutes: 20,
            },
          ],
        },
        {
          agencyId: 'agency-2',
          agencyName: 'Quick Staff Solutions',
          respondedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
          candidatesSubmitted: 2,
          status: 'submitted',
          candidates: [
            {
              id: 'sub-4',
              candidateId: 'cand-4',
              candidateName: 'Michael Brown',
              matchScore: 91,
              skillMatch: 92,
              proximityMatch: 90,
              reliabilityScore: 93,
              payRate: 44,
              status: 'pending',
              submittedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
              responseTimeMinutes: 25,
            },
            {
              id: 'sub-5',
              candidateId: 'cand-5',
              candidateName: 'Lisa Taylor',
              matchScore: 86,
              skillMatch: 88,
              proximityMatch: 84,
              reliabilityScore: 89,
              payRate: 41,
              status: 'pending',
              submittedAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
              responseTimeMinutes: 27,
            },
          ],
        },
      ],
      currentTier: 1,
      maxTiers: 3,
      escalationHistory: [
        {
          id: 'esc-init-1',
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          type: 'initial_broadcast',
          reason: 'Initial broadcast to 4 agencies',
          agenciesNotified: ['agency-1', 'agency-2', 'agency-3', 'agency-4'],
        },
      ],
      status: 'pending',
    },
    {
      id: 'broadcast-2',
      shiftId: 'open-2',
      shiftDate: '2024-01-16',
      shiftTime: '12:00 - 18:00',
      centreId: 'centre-1',
      centreName: 'Sunshine Early Learning',
      roomName: 'Preschool',
      role: 'Lead Educator',
      broadcastedAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
      urgency: 'critical',
      responseDeadline: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
      autoEscalateAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      agenciesNotified: 4,
      agenciesResponded: 3,
      totalCandidatesSubmitted: 4,
      responses: [
        {
          agencyId: 'agency-1',
          agencyName: 'Elite Childcare Staffing',
          respondedAt: new Date(Date.now() - 100 * 60 * 1000).toISOString(),
          candidatesSubmitted: 2,
          status: 'submitted',
          candidates: [
            {
              id: 'sub-6',
              candidateId: 'cand-6',
              candidateName: 'Amanda Green',
              matchScore: 97,
              skillMatch: 98,
              proximityMatch: 95,
              reliabilityScore: 99,
              payRate: 45,
              status: 'accepted',
              submittedAt: new Date(Date.now() - 100 * 60 * 1000).toISOString(),
              responseTimeMinutes: 20,
            },
            {
              id: 'sub-7',
              candidateId: 'cand-7',
              candidateName: 'Robert Lee',
              matchScore: 85,
              skillMatch: 87,
              proximityMatch: 82,
              reliabilityScore: 88,
              payRate: 40,
              status: 'rejected',
              submittedAt: new Date(Date.now() - 98 * 60 * 1000).toISOString(),
              responseTimeMinutes: 22,
            },
          ],
        },
        {
          agencyId: 'agency-3',
          agencyName: 'Care Connect Agency',
          respondedAt: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
          candidatesSubmitted: 1,
          status: 'submitted',
          candidates: [
            {
              id: 'sub-8',
              candidateId: 'cand-8',
              candidateName: 'Jennifer White',
              matchScore: 79,
              skillMatch: 82,
              proximityMatch: 75,
              reliabilityScore: 84,
              payRate: 39,
              status: 'rejected',
              submittedAt: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
              responseTimeMinutes: 40,
            },
          ],
        },
        {
          agencyId: 'agency-2',
          agencyName: 'Quick Staff Solutions',
          respondedAt: new Date(Date.now() - 70 * 60 * 1000).toISOString(),
          candidatesSubmitted: 1,
          status: 'submitted',
          candidates: [
            {
              id: 'sub-9',
              candidateId: 'cand-9',
              candidateName: 'David Martinez',
              matchScore: 83,
              skillMatch: 85,
              proximityMatch: 80,
              reliabilityScore: 86,
              payRate: 41,
              status: 'rejected',
              submittedAt: new Date(Date.now() - 70 * 60 * 1000).toISOString(),
              responseTimeMinutes: 50,
            },
          ],
        },
      ],
      currentTier: 2,
      maxTiers: 3,
      escalationHistory: [
        {
          id: 'esc-init-2',
          timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
          type: 'initial_broadcast',
          reason: 'Initial broadcast to 4 agencies',
        },
        {
          id: 'esc-tier-2',
          timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
          type: 'tier_escalate',
          fromTier: 1,
          toTier: 2,
          reason: 'No response after 30 minutes, escalating to tier 2',
        },
        {
          id: 'esc-urg-2',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          type: 'urgency_increase',
          fromUrgency: 'urgent',
          toUrgency: 'critical',
          reason: 'Urgency increased from urgent to critical after 60 minutes',
        },
      ],
      status: 'filled',
      filledAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
      filledBy: {
        agencyId: 'agency-1',
        agencyName: 'Elite Childcare Staffing',
        candidateId: 'cand-6',
        candidateName: 'Amanda Green',
      },
    },
    {
      id: 'broadcast-3',
      shiftId: 'open-3',
      shiftDate: '2024-01-17',
      shiftTime: '08:00 - 16:00',
      centreId: 'centre-2',
      centreName: 'Little Stars Centre',
      roomName: 'Babies',
      role: 'Certificate III Educator',
      broadcastedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      urgency: 'standard',
      responseDeadline: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      autoEscalateAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
      agenciesNotified: 2,
      agenciesResponded: 0,
      totalCandidatesSubmitted: 0,
      responses: [],
      currentTier: 1,
      maxTiers: 3,
      escalationHistory: [
        {
          id: 'esc-init-3',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          type: 'initial_broadcast',
          reason: 'Initial broadcast to 2 agencies',
        },
      ],
      status: 'pending',
    },
  ];
}
