import { useSyncExternalStore } from 'react';

/**
 * Assign & Track store.
 *
 * Holds staff-level form assignments (once-off or recurring) and the individual
 * recipient tasks generated from them, so admins can track submission status
 * per staff member per occurrence.
 */

export type DeliveryMode = 'once' | 'recurring';
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly';
export type RecipientTaskStatus = 'not_started' | 'in_progress' | 'submitted' | 'cancelled';
export type DerivedTaskStatus = RecipientTaskStatus | 'overdue';
/** Review outcome applied by an admin after a submission arrives. */
export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export interface Recurrence {
  frequency: RecurrenceFrequency;
  /** 0 = Sunday ... 6 = Saturday. Used for weekly. */
  daysOfWeek?: number[];
  /** 1-31. Used for monthly. */
  dayOfMonth?: number;
  startDate: string; // yyyy-mm-dd
  endDate?: string;  // yyyy-mm-dd
}

export interface RecipientTask {
  id: string;
  assignmentId: string;
  staffId: string;
  staffName: string;
  /** yyyy-mm-dd the occurrence relates to */
  occurrenceDate: string;
  /** ISO datetime the response is due */
  dueAt: string;
  status: RecipientTaskStatus;
  submittedAt?: string;
  submissionId?: string;
  remindersSent: number;
  /** Admin review outcome for a submitted task. */
  reviewStatus?: ReviewStatus;
  reviewedAt?: string;
  reviewNote?: string;
}

export interface StaffFormAssignment {
  id: string;
  templateId: string;
  templateName: string;
  title: string;
  mode: DeliveryMode;
  /** Once-off due date (yyyy-mm-dd) */
  dueDate?: string;
  /** Local due time (HH:mm) applied to every occurrence */
  dueTime: string;
  recurrence?: Recurrence;
  staffIds: string[];
  staffNames: Record<string, string>;
  reminderEnabled: boolean;
  reminderHoursBefore: number;
  notes?: string;
  status: 'active' | 'cancelled';
  createdAt: string;
  createdBy: string;
}

export interface AssignmentInput {
  templateId: string;
  templateName: string;
  title: string;
  mode: DeliveryMode;
  dueDate?: string;
  dueTime: string;
  recurrence?: Recurrence;
  staff: { id: string; name: string }[];
  reminderEnabled: boolean;
  reminderHoursBefore: number;
  notes?: string;
}

/** Hard cap so a long recurrence never generates an unbounded task list. */
const MAX_OCCURRENCES = 26;

const pad = (n: number) => String(n).padStart(2, '0');
const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

export function buildOccurrenceDates(mode: DeliveryMode, dueDate: string | undefined, rec?: Recurrence): string[] {
  if (mode === 'once') return dueDate ? [dueDate] : [];
  if (!rec?.startDate) return [];

  const start = new Date(`${rec.startDate}T00:00:00`);
  const hardEnd = rec.endDate ? new Date(`${rec.endDate}T00:00:00`) : addDays(start, 90);
  const out: string[] = [];

  if (rec.frequency === 'daily') {
    for (let d = new Date(start); d <= hardEnd && out.length < MAX_OCCURRENCES; d = addDays(d, 1)) {
      out.push(toKey(d));
    }
  } else if (rec.frequency === 'weekly') {
    const days = rec.daysOfWeek?.length ? rec.daysOfWeek : [start.getDay()];
    for (let d = new Date(start); d <= hardEnd && out.length < MAX_OCCURRENCES; d = addDays(d, 1)) {
      if (days.includes(d.getDay())) out.push(toKey(d));
    }
  } else {
    const dom = rec.dayOfMonth ?? start.getDate();
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cursor <= hardEnd && out.length < MAX_OCCURRENCES) {
      const lastDay = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
      const day = Math.min(dom, lastDay);
      const occ = new Date(cursor.getFullYear(), cursor.getMonth(), day);
      if (occ >= start && occ <= hardEnd) out.push(toKey(occ));
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }
  return out;
}

function buildTasks(assignment: StaffFormAssignment): RecipientTask[] {
  const dates = buildOccurrenceDates(assignment.mode, assignment.dueDate, assignment.recurrence);
  const tasks: RecipientTask[] = [];
  dates.forEach(date => {
    assignment.staffIds.forEach(staffId => {
      tasks.push({
        id: `task-${assignment.id}-${date}-${staffId}`,
        assignmentId: assignment.id,
        staffId,
        staffName: assignment.staffNames[staffId] ?? staffId,
        occurrenceDate: date,
        dueAt: `${date}T${assignment.dueTime || '17:00'}:00`,
        status: 'not_started',
        remindersSent: 0,
      });
    });
  });
  return tasks;
}

export function deriveStatus(task: RecipientTask, now = new Date()): DerivedTaskStatus {
  if (task.status === 'submitted' || task.status === 'cancelled') return task.status;
  return new Date(task.dueAt) < now ? 'overdue' : task.status;
}

export const TASK_STATUS_LABELS: Record<DerivedTaskStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  submitted: 'Submitted',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

// ---------------------------------------------------------------- seed data

const today = new Date();
const seedDate = (offset: number) => toKey(addDays(today, offset));

function seed(): { assignments: StaffFormAssignment[]; tasks: RecipientTask[] } {
  const staffA = [
    { id: 'staff-1', name: 'Mark John' },
    { id: 'staff-2', name: 'Sarah Williams' },
    { id: 'staff-3', name: 'Elena Rodriguez' },
  ];

  const a1: StaffFormAssignment = {
    id: 'asg-seed-1',
    templateId: 'template-1',
    templateName: 'Daily Opening Checklist',
    title: 'Daily Opening Checklist — Melbourne CBD',
    mode: 'recurring',
    dueTime: '09:30',
    recurrence: { frequency: 'daily', startDate: seedDate(-3), endDate: seedDate(3) },
    staffIds: staffA.map(s => s.id),
    staffNames: Object.fromEntries(staffA.map(s => [s.id, s.name])),
    reminderEnabled: true,
    reminderHoursBefore: 2,
    notes: 'Complete before the first client arrives.',
    status: 'active',
    createdAt: new Date().toISOString(),
    createdBy: 'Tenant Admin',
  };

  const a2: StaffFormAssignment = {
    id: 'asg-seed-2',
    templateId: 'template-2',
    templateName: 'Incident Report Form',
    title: 'Quarterly safety attestation',
    mode: 'once',
    dueDate: seedDate(5),
    dueTime: '17:00',
    staffIds: staffA.slice(0, 2).map(s => s.id),
    staffNames: Object.fromEntries(staffA.slice(0, 2).map(s => [s.id, s.name])),
    reminderEnabled: false,
    reminderHoursBefore: 24,
    status: 'active',
    createdAt: new Date().toISOString(),
    createdBy: 'Tenant Admin',
  };

  const tasks = [...buildTasks(a1), ...buildTasks(a2)];
  // Give the seed a realistic mix of statuses.
  tasks.forEach((t, i) => {
    if (new Date(t.dueAt) < today) {
      if (i % 4 !== 0) {
        t.status = 'submitted';
        t.submittedAt = t.dueAt;
        t.submissionId = `sub-${t.id}`;
        t.reviewStatus = i % 3 === 0 ? 'approved' : i % 7 === 0 ? 'rejected' : 'pending';
      }
    } else if (i % 5 === 0) {
      t.status = 'in_progress';
    }
  });

  return { assignments: [a1, a2], tasks };
}

// ------------------------------------------------------------------- store

let state = seed();
const listeners = new Set<() => void>();
const emit = () => { state = { ...state }; listeners.forEach(l => l()); };
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

export const formDeliveryStore = {
  subscribe,
  getSnapshot: () => state,

  createAssignment(input: AssignmentInput): StaffFormAssignment {
    const assignment: StaffFormAssignment = {
      id: `asg-${Date.now()}`,
      templateId: input.templateId,
      templateName: input.templateName,
      title: input.title,
      mode: input.mode,
      dueDate: input.dueDate,
      dueTime: input.dueTime,
      recurrence: input.recurrence,
      staffIds: input.staff.map(s => s.id),
      staffNames: Object.fromEntries(input.staff.map(s => [s.id, s.name])),
      reminderEnabled: input.reminderEnabled,
      reminderHoursBefore: input.reminderHoursBefore,
      notes: input.notes,
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: 'Tenant Admin',
    };
    state.assignments = [assignment, ...state.assignments];
    state.tasks = [...buildTasks(assignment), ...state.tasks];
    emit();
    return assignment;
  },

  cancelAssignment(assignmentId: string) {
    state.assignments = state.assignments.map(a => a.id === assignmentId ? { ...a, status: 'cancelled' } : a);
    state.tasks = state.tasks.map(t =>
      t.assignmentId === assignmentId && t.status !== 'submitted' ? { ...t, status: 'cancelled' } : t
    );
    emit();
  },

  deleteAssignment(assignmentId: string) {
    state.assignments = state.assignments.filter(a => a.id !== assignmentId);
    state.tasks = state.tasks.filter(t => t.assignmentId !== assignmentId);
    emit();
  },

  setTaskStatus(taskId: string, status: RecipientTaskStatus) {
    state.tasks = state.tasks.map(t => t.id === taskId
      ? {
          ...t,
          status,
          submittedAt: status === 'submitted' ? new Date().toISOString() : undefined,
          submissionId: status === 'submitted' ? `sub-${t.id}` : undefined,
        }
      : t);
    emit();
  },

  setReviewStatus(taskIds: string[], reviewStatus: ReviewStatus, reviewNote?: string) {
    const set = new Set(taskIds);
    state.tasks = state.tasks.map(t => set.has(t.id)
      ? { ...t, reviewStatus, reviewedAt: new Date().toISOString(), reviewNote }
      : t);
    emit();
  },

  sendReminder(taskIds: string[]) {
    const set = new Set(taskIds);
    state.tasks = state.tasks.map(t => set.has(t.id) ? { ...t, remindersSent: t.remindersSent + 1 } : t);
    emit();
  },
};

export function useFormDelivery() {
  return useSyncExternalStore(formDeliveryStore.subscribe, formDeliveryStore.getSnapshot, formDeliveryStore.getSnapshot);
}

/** Rolled-up progress for one assignment. */
export function summariseAssignment(tasks: RecipientTask[], now = new Date()) {
  const counts: Record<DerivedTaskStatus, number> = {
    not_started: 0, in_progress: 0, submitted: 0, overdue: 0, cancelled: 0,
  };
  tasks.forEach(t => { counts[deriveStatus(t, now)] += 1; });
  const total = tasks.length;
  const completion = total ? Math.round((counts.submitted / total) * 100) : 0;
  return { counts, total, completion };
}
