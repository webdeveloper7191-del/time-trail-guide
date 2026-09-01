import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/xero';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

interface JournalLineInput {
  accountCode: string;
  description?: string;
  debit?: number;
  credit?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const lovableKey = Deno.env.get('LOVABLE_API_KEY');
  const xeroKey = Deno.env.get('XERO_API_KEY');

  if (!xeroKey || !lovableKey) {
    return json(
      {
        error: 'not_connected',
        message:
          'Xero is not connected yet. Link a Xero organisation from Payroll → Accounting integrations to enable live posting.',
      },
      503,
    );
  }

  try {
    const body = await req.json().catch(() => null);
    const narration = typeof body?.narration === 'string' ? body.narration.slice(0, 200) : '';
    const date = typeof body?.date === 'string' ? body.date : new Date().toISOString().slice(0, 10);
    const rawLines = Array.isArray(body?.lines) ? (body.lines as JournalLineInput[]) : [];
    const mode = body?.mode === 'check' ? 'check' : 'post';

    const baseHeaders = {
      Authorization: `Bearer ${lovableKey}`,
      'X-Connection-Api-Key': xeroKey,
      Accept: 'application/json',
    };

    const tenantsRes = await fetch(`${GATEWAY_URL}/connections`, { headers: baseHeaders });
    if (!tenantsRes.ok) {
      const details = await tenantsRes.text();
      console.error(`Xero tenant lookup failed [${tenantsRes.status}]: ${details}`);
      return json({ error: 'Xero tenant lookup failed', status: tenantsRes.status, details }, tenantsRes.status);
    }
    const tenants = await tenantsRes.json();
    const tenantId = body?.tenantId ?? tenants?.[0]?.tenantId;
    if (!tenantId) return json({ error: 'No Xero organisation is available for this connection' }, 400);

    if (mode === 'check') {
      return json({
        ok: true,
        tenants: (Array.isArray(tenants) ? tenants : []).map((t: Record<string, unknown>) => ({
          tenantId: t.tenantId,
          tenantName: t.tenantName,
        })),
      });
    }

    const lines = rawLines
      .filter((l) => typeof l?.accountCode === 'string' && l.accountCode.length > 0)
      .map((l) => ({
        AccountCode: l.accountCode,
        Description: (l.description ?? '').slice(0, 4000),
        LineAmount: Number(((l.debit ?? 0) - (l.credit ?? 0)).toFixed(2)),
      }))
      .filter((l) => l.LineAmount !== 0);

    if (lines.length < 2) return json({ error: 'A journal needs at least two balanced lines' }, 400);
    const balance = lines.reduce((sum, l) => sum + l.LineAmount, 0);
    if (Math.abs(balance) > 0.01) return json({ error: 'Journal does not balance', balance }, 400);

    const postRes = await fetch(`${GATEWAY_URL}/api.xro/2.0/ManualJournals`, {
      method: 'POST',
      headers: { ...baseHeaders, 'xero-tenant-id': tenantId, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ManualJournals: [
          { Narration: narration || 'Payroll journal', Date: date, Status: 'POSTED', JournalLines: lines },
        ],
      }),
    });

    const payload = await postRes.text();
    if (!postRes.ok) {
      console.error(`Xero journal post failed [${postRes.status}]: ${payload}`);
      return json({ error: 'Xero rejected the journal', status: postRes.status, details: payload }, postRes.status);
    }

    const parsed = JSON.parse(payload);
    const journal = parsed?.ManualJournals?.[0];
    return json({
      ok: true,
      tenantId,
      manualJournalId: journal?.ManualJournalID ?? null,
      lineCount: lines.length,
    });
  } catch (err) {
    console.error('xero-post-journal failed:', err);
    return json({ error: err instanceof Error ? err.message : 'Unexpected error' }, 500);
  }
});
