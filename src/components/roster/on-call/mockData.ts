import { format, addDays, startOfWeek } from 'date-fns';
import type { OnCallAssignment, EscalationContact, CallbackHistoryItem, AvailableStaff } from './types';

export const availableStaff: AvailableStaff[] = [
  { id: 's1', name: 'Sarah Johnson', role: 'Senior Educator', phone: '0412 345 678', isAvailable: true },
  { id: 's2', name: 'Michael Brown', role: 'Team Leader', phone: '0423 456 789', isAvailable: true },
  { id: 's3', name: 'Emily Chen', role: 'Centre Coordinator', phone: '0434 567 890', isAvailable: true },
  { id: 's4', name: 'James Wilson', role: 'Nurse', phone: '0445 678 901', isAvailable: true },
  { id: 's5', name: 'Lisa Park', role: 'Senior Educator', phone: '0456 789 012', isAvailable: true },
  { id: 's6', name: 'David Kim', role: 'Team Leader', phone: '0467 890 123', isAvailable: true },
  { id: 's7', name: 'Rachel Adams', role: 'Educator', phone: '0478 901 234', isAvailable: false },
];

export const generateWeekAssignments = (): OnCallAssignment[] => {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const staff = availableStaff.slice(0, 5);

  const assignments: OnCallAssignment[] = [];
  for (let i = 0; i < 7; i++) {
    const date = format(addDays(weekStart, i), 'yyyy-MM-dd');
    const primaryIdx = i % staff.length;
    const secondaryIdx = (i + 1) % staff.length;

    assignments.push({
      id: `oc-${i}-primary`,
      staffId: staff[primaryIdx].id,
      staffName: staff[primaryIdx].name,
      staffRole: staff[primaryIdx].role,
      staffPhone: staff[primaryIdx].phone,
      centreId: 'centre-1',
      centreName: 'Sunshine Early Learning',
      date,
      startTime: '17:00',
      endTime: '07:00',
      isPrimary: true,
      escalationOrder: 1,
      status: i < 2 ? 'completed' : i === 2 ? 'active' : 'scheduled',
      callbackCount: i < 2 ? Math.floor(Math.random() * 3) : 0,
      lastCallback: i === 0 ? '2025-03-03T22:30:00' : undefined,
    });

    assignments.push({
      id: `oc-${i}-secondary`,
      staffId: staff[secondaryIdx].id,
      staffName: staff[secondaryIdx].name,
      staffRole: staff[secondaryIdx].role,
      staffPhone: staff[secondaryIdx].phone,
      centreId: 'centre-1',
      centreName: 'Sunshine Early Learning',
      date,
      startTime: '17:00',
      endTime: '07:00',
      isPrimary: false,
      escalationOrder: 2,
      status: i < 2 ? 'completed' : i === 2 ? 'active' : 'scheduled',
      callbackCount: 0,
    });
  }
  return assignments;
};

export const mockEscalation: EscalationContact[] = [
  { order: 1, staffId: 's3', staffName: 'Emily Chen', staffRole: 'Centre Coordinator', phone: '0434 567 890', responseTimeMinutes: 5, isAvailable: true },
  { order: 2, staffId: 's2', staffName: 'Michael Brown', staffRole: 'Team Leader', phone: '0423 456 789', responseTimeMinutes: 10, isAvailable: true },
  { order: 3, staffId: 's1', staffName: 'Sarah Johnson', staffRole: 'Senior Educator', phone: '0412 345 678', responseTimeMinutes: 15, isAvailable: false },
];

export const mockCallbackHistory: CallbackHistoryItem[] = [
  { id: 'h1', date: '2025-03-04', staffName: 'Sarah Johnson', type: 'callback', duration: '45min', outcome: 'Resolved', paidAmount: 157.50 },
  { id: 'h2', date: '2025-03-03', staffName: 'Emily Chen', type: 'recall', duration: '4h', outcome: 'Staff covered', paidAmount: 280.00 },
  { id: 'h3', date: '2025-03-02', staffName: 'Michael Brown', type: 'emergency', duration: '45min', outcome: 'False alarm', paidAmount: 350.00 },
  { id: 'h4', date: '2025-02-28', staffName: 'Lisa Park', type: 'callback', duration: '1.5h', outcome: 'Resolved', paidAmount: 105.00 },
  { id: 'h5', date: '2025-02-25', staffName: 'James Wilson', type: 'callback', duration: '30min', outcome: 'Resolved', paidAmount: 105.00 },
];
