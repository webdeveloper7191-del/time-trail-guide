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

export function loadViews(reportId: string): SavedReportView[] {
  if (typeof window === 'undefined') return [];
  return safeParse<SavedReportView[]>(localStorage.getItem(k.views(reportId)), []);
}

export function saveViews(reportId: string, views: SavedReportView[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(k.views(reportId), JSON.stringify(views));
}

export function upsertView(reportId: string, view: SavedReportView) {
  const all = loadViews(reportId);
  const idx = all.findIndex(v => v.id === view.id);
  if (idx >= 0) all[idx] = view; else all.unshift(view);
  saveViews(reportId, all);
  return all;
}

export function deleteView(reportId: string, viewId: string) {
  const all = loadViews(reportId).filter(v => v.id !== viewId);
  saveViews(reportId, all);
  return all;
}
