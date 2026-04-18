import { toast } from 'sonner';
import {
  listAllReportIds, loadViews, markScheduleDispatched, nextRunAt,
  type SavedReportView,
} from './reportViewStorage';

const DISPATCH_LOG_KEY = 'reports.v1.scheduleDispatchLog';

export interface DispatchLogEntry {
  reportId: string;
  viewId: string;
  viewName: string;
  cadence: string;
  format: string;
  recipients: string;
  dispatchedAt: number;
}

export function getDispatchLog(): DispatchLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(DISPATCH_LOG_KEY) || '[]');
  } catch {
    return [];
  }
}

function appendLog(entry: DispatchLogEntry) {
  const all = getDispatchLog();
  all.unshift(entry);
  localStorage.setItem(DISPATCH_LOG_KEY, JSON.stringify(all.slice(0, 50)));
}

/**
 * Walk every report's saved views and dispatch any schedule whose nextRunAt
 * is in the past. In a real backend this would hit an edge function; here
 * we just toast + record a log entry so the user can see the schedule fired.
 */
export function runDueScheduledExports(now = Date.now()) {
  if (typeof window === 'undefined') return 0;
  const reportIds = listAllReportIds();
  let dispatched = 0;
  reportIds.forEach(rid => {
    const views = loadViews(rid);
    views.forEach((v: SavedReportView) => {
      if (!v.schedule) return;
      const due = nextRunAt(v.schedule, now);
      if (due > now) return;
      // Dispatch
      markScheduleDispatched(rid, v.id, now);
      appendLog({
        reportId: rid,
        viewId: v.id,
        viewName: v.name,
        cadence: v.schedule.cadence,
        format: v.schedule.format,
        recipients: v.schedule.recipients,
        dispatchedAt: now,
      });
      dispatched++;
      toast.success(`Scheduled export sent: ${v.name}`, {
        description: `${v.schedule.format.toUpperCase()} emailed to ${v.schedule.recipients} (${v.schedule.cadence})`,
      });
    });
  });
  return dispatched;
}

/**
 * Mount-once hook entry point — call from App once. Runs immediately + every 60s.
 */
export function startScheduledExportRunner() {
  if (typeof window === 'undefined') return () => {};
  // Defer slightly so first render finishes before any toast
  const t = window.setTimeout(() => runDueScheduledExports(), 1500);
  const i = window.setInterval(() => runDueScheduledExports(), 60_000);
  return () => {
    window.clearTimeout(t);
    window.clearInterval(i);
  };
}
