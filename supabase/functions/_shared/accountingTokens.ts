/**
 * Rotating refresh-token storage for accounting integrations.
 *
 * MYOB and QuickBooks both rotate the refresh token on every exchange, so the
 * value seeded from a secret is only good once. The latest token is persisted
 * here (service-role only table) and used for subsequent refreshes.
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const restHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

export interface StoredToken {
  refresh_token: string;
  realm_id?: string | null;
  company_file_id?: string | null;
}

export async function readToken(platform: string): Promise<StoredToken | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/accounting_tokens?platform=eq.${platform}&select=refresh_token,realm_id,company_file_id`,
    { headers: restHeaders },
  );
  if (!res.ok) {
    console.error(`accounting_tokens read failed [${res.status}]: ${await res.text()}`);
    return null;
  }
  const rows = (await res.json()) as StoredToken[];
  return rows[0] ?? null;
}

export async function writeToken(platform: string, token: StoredToken): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/accounting_tokens?on_conflict=platform`, {
    method: 'POST',
    headers: { ...restHeaders, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify([{ platform, ...token }]),
  });
  if (!res.ok) console.error(`accounting_tokens write failed [${res.status}]: ${await res.text()}`);
}

export interface JournalLineInput {
  accountCode: string;
  description?: string;
  debit?: number;
  credit?: number;
}

/** Normalise incoming lines into signed amounts and validate the journal balances. */
export function normaliseLines(raw: unknown): { lines: { accountCode: string; description: string; debit: number; credit: number }[]; error?: string } {
  const arr = Array.isArray(raw) ? (raw as JournalLineInput[]) : [];
  const lines = arr
    .filter((l) => typeof l?.accountCode === 'string' && l.accountCode.trim().length > 0)
    .map((l) => ({
      accountCode: l.accountCode.trim(),
      description: (l.description ?? '').slice(0, 300),
      debit: Number((l.debit ?? 0).toFixed(2)),
      credit: Number((l.credit ?? 0).toFixed(2)),
    }))
    .filter((l) => l.debit !== 0 || l.credit !== 0);

  if (lines.length < 2) return { lines, error: 'A journal needs at least two lines with mapped account codes' };
  const balance = lines.reduce((s, l) => s + l.debit - l.credit, 0);
  if (Math.abs(balance) > 0.01) return { lines, error: `Journal does not balance (out by ${balance.toFixed(2)})` };
  return { lines };
}
