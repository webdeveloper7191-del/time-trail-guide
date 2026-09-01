import { supabase } from '@/integrations/supabase/client';
import { PayRun } from '@/types/payroll';
import { JournalLine } from '@/lib/payroll/accountingExport';

/**
 * Cloud-backed persistence for pay runs (audit retention) and live Xero posting.
 * All server work happens in edge functions — the browser never holds
 * connector credentials or service-role keys.
 */

export async function fetchCloudRuns(): Promise<PayRun[]> {
  const { data, error } = await supabase.functions.invoke('payroll-archive', { method: 'GET' });
  if (error) throw error;
  return (data?.runs ?? []) as PayRun[];
}

export async function pushCloudRuns(runs: PayRun[]): Promise<void> {
  if (runs.length === 0) return;
  const { error } = await supabase.functions.invoke('payroll-archive', {
    body: { action: 'upsert', runs },
  });
  if (error) throw error;
}

export async function deleteCloudRun(id: string): Promise<void> {
  const { error } = await supabase.functions.invoke('payroll-archive', {
    body: { action: 'delete', id },
  });
  if (error) throw error;
}

export interface XeroPostResult {
  ok: boolean;
  connected: boolean;
  message: string;
  manualJournalId?: string | null;
  tenants?: { tenantId: string; tenantName: string }[];
}

async function callXero(body: Record<string, unknown>): Promise<XeroPostResult> {
  const { data, error } = await supabase.functions.invoke('xero-post-journal', { body });
  if (error) {
    const details =
      typeof (error as { context?: { text?: () => Promise<string> } }).context?.text === 'function'
        ? await (error as { context: { text: () => Promise<string> } }).context.text()
        : error.message;
    let parsed: Record<string, unknown> | null = null;
    try { parsed = JSON.parse(details); } catch { /* plain text */ }
    const notConnected = parsed?.error === 'not_connected';
    return {
      ok: false,
      connected: !notConnected,
      message: String(parsed?.message ?? parsed?.details ?? parsed?.error ?? details),
    };
  }
  return {
    ok: true,
    connected: true,
    message: 'Journal posted to Xero.',
    manualJournalId: data?.manualJournalId ?? null,
    tenants: data?.tenants,
  };
}

/** Verify the Xero connection and list available organisations. */
export function checkXeroConnection(): Promise<XeroPostResult> {
  return callXero({ mode: 'check' });
}

/** Post a balanced payroll journal to the connected Xero organisation. */
export function postJournalToXero(
  run: PayRun,
  lines: JournalLine[],
  tenantId?: string,
): Promise<XeroPostResult> {
  return callXero({
    mode: 'post',
    tenantId,
    date: run.periodEnd,
    narration: `Payroll — ${run.name}`,
    lines: lines.map((l) => ({
      accountCode: l.accountCode,
      description: l.description,
      debit: l.debit,
      credit: l.credit,
    })),
  });
}
