import type { RuleNode } from './filterOperators';

/** A saved view = filter tree + visible columns + sort + name. Per-report. */
export interface SavedReportView {
  id: string;
  name: string;
  rules: RuleNode[];
  hiddenColumns: string[];
  sortCol: string | null;
  sortDir: 'asc' | 'desc' | null;
  createdAt: number;
  /** Pinned views float to the top of the list. */
  pinned?: boolean;
  /** When true, the view is auto-applied on report mount. Only one per report. */
  isDefault?: boolean;
}

const NS = 'reports.v1';

const k = {
  hiddenCols: (reportId: string) => `${NS}.${reportId}.hiddenCols`,
  views: (reportId: string) => `${NS}.${reportId}.views`,
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export function loadHiddenColumns(reportId: string): string[] {
  if (typeof window === 'undefined') return [];
  return safeParse<string[]>(localStorage.getItem(k.hiddenCols(reportId)), []);
}

export function saveHiddenColumns(reportId: string, hidden: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(k.hiddenCols(reportId), JSON.stringify(hidden));
}

/** Sort views: pinned first (newest pinned first), then unpinned (newest first). */
function sortViews(views: SavedReportView[]): SavedReportView[] {
  return [...views].sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    return b.createdAt - a.createdAt;
  });
}

export function loadViews(reportId: string): SavedReportView[] {
  if (typeof window === 'undefined') return [];
  return sortViews(safeParse<SavedReportView[]>(localStorage.getItem(k.views(reportId)), []));
}

export function saveViews(reportId: string, views: SavedReportView[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(k.views(reportId), JSON.stringify(views));
}

export function upsertView(reportId: string, view: SavedReportView) {
  const all = loadViews(reportId);
  const idx = all.findIndex(v => v.id === view.id);
  if (idx >= 0) all[idx] = view; else all.unshift(view);
  const sorted = sortViews(all);
  saveViews(reportId, sorted);
  return sorted;
}

export function deleteView(reportId: string, viewId: string) {
  const all = loadViews(reportId).filter(v => v.id !== viewId);
  saveViews(reportId, all);
  return all;
}

/** Toggle pinned state for a view. Returns sorted list. */
export function togglePinView(reportId: string, viewId: string) {
  const all = loadViews(reportId).map(v =>
    v.id === viewId ? { ...v, pinned: !v.pinned } : v
  );
  const sorted = sortViews(all);
  saveViews(reportId, sorted);
  return sorted;
}

/** Set or clear the default view. Only one default per report. */
export function setDefaultView(reportId: string, viewId: string | null) {
  const all = loadViews(reportId).map(v => ({
    ...v,
    isDefault: viewId !== null && v.id === viewId,
  }));
  const sorted = sortViews(all);
  saveViews(reportId, sorted);
  return sorted;
}

export function getDefaultView(reportId: string): SavedReportView | null {
  return loadViews(reportId).find(v => v.isDefault) ?? null;
}
