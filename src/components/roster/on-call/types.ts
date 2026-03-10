export interface OnCallAssignment {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  staffPhone: string;
  staffAvatar?: string;
  centreId: string;
  centreName: string;
  date: string;
  startTime: string;
  endTime: string;
  isPrimary: boolean;
  escalationOrder: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  callbackCount: number;
  lastCallback?: string;
}

export interface EscalationContact {
  order: number;
  staffId: string;
  staffName: string;
  staffRole: string;
  phone: string;
  responseTimeMinutes: number;
  isAvailable: boolean;
}

export interface CallbackHistoryItem {
  id: string;
  date: string;
  staffName: string;
  type: 'callback' | 'recall' | 'emergency';
  duration: string;
  outcome: string;
  paidAmount: number;
}

export interface AvailableStaff {
  id: string;
  name: string;
  role: string;
  phone: string;
  isAvailable: boolean;
}

export const statusColors: Record<OnCallAssignment['status'], string> = {
  scheduled: 'bg-blue-500/10 text-blue-700',
  active: 'bg-green-500/10 text-green-700 animate-pulse',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-red-500/10 text-red-700',
};

export const callbackTypeColors: Record<CallbackHistoryItem['type'], string> = {
  callback: 'bg-amber-500/10 text-amber-700',
  recall: 'bg-orange-500/10 text-orange-700',
  emergency: 'bg-red-500/10 text-red-700',
};
