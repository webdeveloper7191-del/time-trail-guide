import { useSyncExternalStore } from 'react';
import { UnifiedTask } from '@/types/unifiedTasks';

/**
 * Kanban board configuration for the Tasks module.
 *
 * Boards can group cards by a built-in field (status, priority, module, due
 * bucket) or by user-defined custom columns. Custom column placement and any
 * drag-driven field changes are stored as per-task overrides so the mock data
 * layer stays untouched.
 */

export type BoardGroupBy = 'status' | 'priority' | 'module' | 'due' | 'custom';

export interface BoardColumn {
  id: string;
  title: string;
  /** Semantic tone used for the column accent. */
  tone: 'neutral' | 'info' | 'progress' | 'warning' | 'danger' | 'success';
  /** Optional WIP limit — cards beyond this show a warning. */
  wipLimit?: number;
}

export interface TaskOverride {
  status?: string;
  priority?: string;
  customColumnId?: string;
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: string;
  title?: string;
  description?: string;
}

/** Secondary grouping used to split the board into horizontal swimlanes. */
export type BoardSwimlaneBy = 'none' | 'status' | 'priority' | 'module' | 'due';

/** A single message in a card's comment thread. */
export interface BoardComment {
  id: string;
  taskId: string;
  authorName: string;
  text: string;
  createdAt: string;
  /** Display names @mentioned in the body — used for notification chips. */
  mentions?: string[];
}

/** Comment-thread filter applied on top of the board's task list. */
export type BoardCommentFilter = 'all' | 'with_comments' | 'unread' | 'mentions_me';

interface BoardState {
  groupBy: BoardGroupBy;
  swimlaneBy: BoardSwimlaneBy;
  customColumns: BoardColumn[];
  overrides: Record<string, TaskOverride>;
  /** Comment threads keyed by task id. */
  comments: Record<string, BoardComment[]>;
  /** ISO timestamp of when the current user last read each thread. */
  threadReads: Record<string, string>;
  commentFilter: BoardCommentFilter;
}

/** Name used for locally authored comments and for "mentions me" matching. */
export const CURRENT_USER_NAME = 'You';



export const TONE_CLASSES: Record<BoardColumn['tone'], string> = {
  neutral: 'bg-muted text-muted-foreground',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  warning: 'bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

export const TONE_OPTIONS: BoardColumn['tone'][] = ['neutral', 'info', 'progress', 'warning', 'danger', 'success'];

const STATUS_COLUMNS: BoardColumn[] = [
  { id: 'open', title: 'Open', tone: 'info' },
  { id: 'in_progress', title: 'In progress', tone: 'progress' },
  { id: 'blocked', title: 'Blocked', tone: 'danger' },
  { id: 'completed', title: 'Completed', tone: 'success' },
  { id: 'cancelled', title: 'Cancelled', tone: 'neutral' },
];

const PRIORITY_COLUMNS: BoardColumn[] = [
  { id: 'critical', title: 'Critical', tone: 'danger' },
  { id: 'high', title: 'High', tone: 'warning' },
  { id: 'medium', title: 'Medium', tone: 'info' },
  { id: 'low', title: 'Low', tone: 'neutral' },
];

const MODULE_COLUMNS: BoardColumn[] = [
  { id: 'forms', title: 'Forms & Audits', tone: 'info' },
  { id: 'performance', title: 'Performance', tone: 'progress' },
  { id: 'roster', title: 'Roster', tone: 'success' },
  { id: 'timesheet', title: 'Timesheets', tone: 'warning' },
];

const DUE_COLUMNS: BoardColumn[] = [
  { id: 'overdue', title: 'Overdue', tone: 'danger' },
  { id: 'today', title: 'Due today', tone: 'warning' },
  { id: 'week', title: 'Next 7 days', tone: 'info' },
  { id: 'later', title: 'Later', tone: 'neutral' },
  { id: 'no_date', title: 'No due date', tone: 'neutral' },
];

const DEFAULT_CUSTOM_COLUMNS: BoardColumn[] = [
  { id: 'col-backlog', title: 'Backlog', tone: 'neutral' },
  { id: 'col-ready', title: 'Ready', tone: 'info' },
  { id: 'col-doing', title: 'Doing', tone: 'progress', wipLimit: 5 },
  { id: 'col-review', title: 'Review', tone: 'warning' },
  { id: 'col-done', title: 'Done', tone: 'success' },
];

const STORAGE_KEY = 'rostered.taskBoard.v1';

function load(): BoardState {
  const fallback: BoardState = {
    groupBy: 'status',
    swimlaneBy: 'none',
    customColumns: DEFAULT_CUSTOM_COLUMNS,
    overrides: {},
    comments: {},
    threadReads: {},
    commentFilter: 'all',
  };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<BoardState>;
    return {
      groupBy: parsed.groupBy ?? fallback.groupBy,
      swimlaneBy: parsed.swimlaneBy ?? fallback.swimlaneBy,
      customColumns: parsed.customColumns?.length ? parsed.customColumns : fallback.customColumns,
      overrides: parsed.overrides ?? {},
      comments: parsed.comments ?? {},
      threadReads: parsed.threadReads ?? {},
      commentFilter: parsed.commentFilter ?? 'all',
    };


  } catch {
    return fallback;
  }
}

let state: BoardState = load();
const listeners = new Set<() => void>();

function emit() {
  state = { ...state };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — board still works in-memory */
  }
  listeners.forEach(l => l());
}

export const taskBoardStore = {
  subscribe: (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; },
  getSnapshot: () => state,

  setGroupBy(groupBy: BoardGroupBy) {
    state.groupBy = groupBy;
    emit();
  },

  setSwimlaneBy(swimlaneBy: BoardSwimlaneBy) {
    state.swimlaneBy = swimlaneBy;
    emit();
  },

  /** Patch a task from the detail drawer's edit form. */
  updateTask(taskId: string, patch: TaskOverride) {
    const current = state.overrides[taskId] ?? {};
    state.overrides = { ...state.overrides, [taskId]: { ...current, ...patch } };
    emit();
  },

  setCustomColumns(columns: BoardColumn[]) {
    state.customColumns = columns;
    // Drop placements pointing at deleted columns.
    const ids = new Set(columns.map(c => c.id));
    Object.entries(state.overrides).forEach(([taskId, o]) => {
      if (o.customColumnId && !ids.has(o.customColumnId)) {
        state.overrides[taskId] = { ...o, customColumnId: undefined };
      }
    });
    emit();
  },

  /** Move a card into a column for the current grouping. */
  moveTask(taskId: string, groupBy: BoardGroupBy, columnId: string) {
    const current = state.overrides[taskId] ?? {};
    const next: TaskOverride = { ...current };
    if (groupBy === 'status') next.status = columnId;
    else if (groupBy === 'priority') next.priority = columnId;
    else if (groupBy === 'custom') next.customColumnId = columnId;
    else return; // module/due groupings are read-only
    state.overrides = { ...state.overrides, [taskId]: next };
    emit();
  },

  resetOverrides() {
    state.overrides = {};
    emit();
  },

  /** Start or continue a card's comment thread. */
  addComment(taskId: string, text: string, authorName = CURRENT_USER_NAME, mentions: string[] = []) {
    const body = text.trim();
    if (!body) return;
    const comment: BoardComment = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      taskId,
      authorName,
      text: body,
      createdAt: new Date().toISOString(),
      mentions: mentions.length ? mentions : undefined,
    };
    state.comments = {
      ...state.comments,
      [taskId]: [...(state.comments[taskId] ?? []), comment],
    };
    // Posting implies you've read everything up to now.
    if (authorName === CURRENT_USER_NAME) {
      state.threadReads = { ...state.threadReads, [taskId]: comment.createdAt };
    }
    emit();
  },

  deleteComment(taskId: string, commentId: string) {
    state.comments = {
      ...state.comments,
      [taskId]: (state.comments[taskId] ?? []).filter(c => c.id !== commentId),
    };
    emit();
  },

  /** Mark a card's thread as read up to now. */
  markThreadRead(taskId: string) {
    state.threadReads = { ...state.threadReads, [taskId]: new Date().toISOString() };
    emit();
  },

  /** Flag the thread as unread again (clears the read marker). */
  markThreadUnread(taskId: string) {
    const next = { ...state.threadReads };
    delete next[taskId];
    state.threadReads = next;
    emit();
  },

  markAllThreadsRead() {
    const now = new Date().toISOString();
    const next = { ...state.threadReads };
    Object.keys(state.comments).forEach(id => { next[id] = now; });
    state.threadReads = next;
    emit();
  },

  setCommentFilter(filter: BoardCommentFilter) {
    state.commentFilter = filter;
    emit();
  },
};

/** Comments on a thread the current user hasn't seen yet (their own never count). */
export function unreadCountFor(
  taskId: string,
  comments: Record<string, BoardComment[]>,
  threadReads: Record<string, string>,
): number {
  const thread = comments[taskId] ?? [];
  if (!thread.length) return 0;
  const readAt = threadReads[taskId];
  return thread.filter(c =>
    c.authorName !== CURRENT_USER_NAME && (!readAt || new Date(c.createdAt) > new Date(readAt)),
  ).length;
}

export function mentionsCurrentUser(taskId: string, comments: Record<string, BoardComment[]>): boolean {
  return (comments[taskId] ?? []).some(c => (c.mentions ?? []).includes(CURRENT_USER_NAME));
}

export const COMMENT_FILTER_LABELS: Record<BoardCommentFilter, string> = {
  all: 'All cards',
  with_comments: 'Has comments',
  unread: 'Unread comments',
  mentions_me: 'Mentions me',
};

/** Apply the board's comment filter to a task list. */
export function filterByComments(
  tasks: UnifiedTask[],
  filter: BoardCommentFilter,
  comments: Record<string, BoardComment[]>,
  threadReads: Record<string, string>,
): UnifiedTask[] {
  switch (filter) {
    case 'with_comments': return tasks.filter(t => (comments[t.id]?.length ?? 0) > 0);
    case 'unread': return tasks.filter(t => unreadCountFor(t.id, comments, threadReads) > 0);
    case 'mentions_me': return tasks.filter(t => mentionsCurrentUser(t.id, comments));
    default: return tasks;
  }
}



export function useTaskBoard() {
  return useSyncExternalStore(taskBoardStore.subscribe, taskBoardStore.getSnapshot, taskBoardStore.getSnapshot);
}

/** Apply stored board overrides on top of the source tasks. */
export function applyOverrides(tasks: UnifiedTask[], overrides: Record<string, TaskOverride>): UnifiedTask[] {
  return tasks.map(t => {
    const o = overrides[t.id];
    if (!o) return t;
    return {
      ...t,
      title: o.title ?? t.title,
      description: o.description ?? t.description,
      status: (o.status ?? t.status) as UnifiedTask['status'],
      priority: (o.priority ?? t.priority) as UnifiedTask['priority'],
      assigneeId: o.assigneeId ?? t.assigneeId,
      assigneeName: o.assigneeName ?? t.assigneeName,
      ...(o.dueDate !== undefined ? recomputeDue(o.dueDate) : {}),
    };
  });
}

function recomputeDue(dueDate: string): Pick<UnifiedTask, 'dueDate' | 'isOverdue' | 'daysUntilDue'> {
  if (!dueDate) return { dueDate: undefined, isOverdue: false, daysUntilDue: null };
  const due = new Date(dueDate);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const daysUntilDue = Math.round((due.getTime() - today.getTime()) / 86400000);
  return { dueDate, isOverdue: daysUntilDue < 0, daysUntilDue };
}

export function columnsFor(groupBy: BoardGroupBy, customColumns: BoardColumn[]): BoardColumn[] {
  switch (groupBy) {
    case 'priority': return PRIORITY_COLUMNS;
    case 'module': return MODULE_COLUMNS;
    case 'due': return DUE_COLUMNS;
    case 'custom': return customColumns;
    case 'status':
    default: return STATUS_COLUMNS;
  }
}

export const GROUP_BY_LABELS: Record<BoardGroupBy, string> = {
  status: 'Status',
  priority: 'Priority / severity',
  module: 'Module',
  due: 'Due date',
  custom: 'Custom columns',
};

export const SWIMLANE_LABELS: Record<BoardSwimlaneBy, string> = {
  none: 'No swimlanes',
  status: 'Status',
  priority: 'Priority / severity',
  module: 'Module',
  due: 'Due date',
};

/** Swimlane rows for a secondary grouping (never the same axis as the columns). */
export function swimlanesFor(swimlaneBy: BoardSwimlaneBy): BoardColumn[] {
  switch (swimlaneBy) {
    case 'status': return STATUS_COLUMNS;
    case 'priority': return PRIORITY_COLUMNS;
    case 'module': return MODULE_COLUMNS;
    case 'due': return DUE_COLUMNS;
    default: return [];
  }
}

export function swimlaneKeyFor(task: UnifiedTask, swimlaneBy: BoardSwimlaneBy): string {
  switch (swimlaneBy) {
    case 'status': return task.status;
    case 'priority': return task.priority;
    case 'module': return task.module;
    case 'due': return dueBucket(task);
    default: return 'none';
  }
}

function dueBucket(task: UnifiedTask): string {
  if (!task.dueDate) return 'no_date';
  if (task.isOverdue) return 'overdue';
  if (task.daysUntilDue === null) return 'later';
  if (task.daysUntilDue <= 0) return 'today';
  if (task.daysUntilDue <= 7) return 'week';
  return 'later';
}

/** Which column a task belongs to under the current grouping. */
export function columnKeyFor(
  task: UnifiedTask,
  groupBy: BoardGroupBy,
  overrides: Record<string, TaskOverride>,
  columns: BoardColumn[],
): string {
  switch (groupBy) {
    case 'priority': return task.priority;
    case 'module': return task.module;
    case 'due': return dueBucket(task);
    case 'custom': {
      const placed = overrides[task.id]?.customColumnId;
      if (placed && columns.some(c => c.id === placed)) return placed;
      // Sensible default placement so the board is never empty on first use.
      if (task.status === 'completed') return columns[columns.length - 1]?.id ?? '';
      if (task.status === 'in_progress') return columns[Math.min(2, columns.length - 1)]?.id ?? '';
      return columns[0]?.id ?? '';
    }
    case 'status':
    default: return task.status;
  }
}

export const isGroupingEditable = (groupBy: BoardGroupBy) =>
  groupBy === 'status' || groupBy === 'priority' || groupBy === 'custom';
