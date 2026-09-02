import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { normaliseLines, readToken, writeToken } from '../_shared/accountingTokens.ts';

/**
 * Posts a payroll journal to QuickBooks Online as a JournalEntry.
 *
 * Auth: Intuit OAuth2 refresh-token flow. Seed QBO_REFRESH_TOKEN once; the
 * rotated token is persisted in accounting_tokens.
 */

const TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const MINOR_VERSION = '70';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const clientId = Deno.env.get('QBO_CLIENT_ID');
  const clientSecret = Deno.env.get('QBO_CLIENT_SECRET');
  const seedRefresh = Deno.env.get('QBO_REFRESH_TOKEN');
  const envRealm = Deno.env.get('QBO_REALM_ID');
  const sandbox = (Deno.env.get('QBO_ENVIRONMENT') ?? 'production').toLowerCase() === 'sandbox';
  const apiRoot = sandbox ? 'https://sandbox-quickbooks.api.intuit.com' : 'https://quickbooks.api.intuit.com';

  if (!clientId || !clientSecret || !seedRefresh) {
    return json(
      {
        error: 'not_connected',
        message:
          'QuickBooks is not connected yet. Add QBO_CLIENT_ID, QBO_CLIENT_SECRET, QBO_REFRESH_TOKEN and QBO_REALM_ID in backend secrets to enable live posting.',
      },
      503,
    );
  }

  try {
    const body = await req.json().catch(() => null);
    const mode = body?.mode === 'check' ? 'check' : 'post';

    const stored = await readToken('quickbooks');
    const refreshToken = stored?.refresh_token ?? seedRefresh;
    const realmId = body?.tenantId ?? stored?.realm_id ?? envRealm;
    if (!realmId) return json({ error: 'QBO_REALM_ID is not configured for this connection' }, 400);

    const tokenRes = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
    });
    const tokenText = await tokenRes.text();
    if (!tokenRes.ok) {
      console.error(`QuickBooks token refresh failed [${tokenRes.status}]: ${tokenText}`);
      return json({ error: 'QuickBooks authentication failed', status: tokenRes.status, details: tokenText }, tokenRes.status);
    }
    const tokenJson = JSON.parse(tokenText);
    const accessToken: string = tokenJson.access_token;
    if (tokenJson.refresh_token && tokenJson.refresh_token !== refreshToken) {
      await writeToken('quickbooks', { refresh_token: tokenJson.refresh_token, realm_id: realmId });
    }

    const baseHeaders = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const query = async (statement: string) => {
      const res = await fetch(
        `${apiRoot}/v3/company/${realmId}/query?minorversion=${MINOR_VERSION}&query=${encodeURIComponent(statement)}`,
        { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } },
      );
      const text = await res.text();
      if (!res.ok) {
        console.error(`QuickBooks query failed [${res.status}]: ${text}`);
        throw new Error(`[${res.status}]: ${text}`);
      }
      return JSON.parse(text);
    };

    if (mode === 'check') {
      const info = await query('select * from CompanyInfo');
      const company = info?.QueryResponse?.CompanyInfo?.[0];
      return json({
        ok: true,
        tenants: [{ tenantId: String(realmId), tenantName: company?.CompanyName ?? `QuickBooks company ${realmId}` }],
      });
    }

    const { lines, error } = normaliseLines(body?.lines);
    if (error) return json({ error }, 400);

    // Resolve QuickBooks account Ids from account numbers (falling back to name).
    const accounts = await query('select Id, Name, AcctNum from Account maxresults 1000');
    const rows = (accounts?.QueryResponse?.Account ?? []) as { Id: string; Name: string; AcctNum?: string }[];
    const idFor = (code: string) =>
      rows.find((a) => a.AcctNum === code)?.Id ?? rows.find((a) => a.Name === code)?.Id ?? null;

    const journalLines: unknown[] = [];
    for (const l of lines) {
      const accountId = idFor(l.accountCode);
      if (!accountId) return json({ error: `QuickBooks account ${l.accountCode} was not found in this company` }, 400);
      const isCredit = l.credit > 0;
      journalLines.push({
        Description: l.description || 'Payroll',
        Amount: Number((isCredit ? l.credit : l.debit).toFixed(2)),
        DetailType: 'JournalEntryLineDetail',
        JournalEntryLineDetail: {
          PostingType: isCredit ? 'Credit' : 'Debit',
          AccountRef: { value: accountId },
        },
      });
    }

    const postRes = await fetch(`${apiRoot}/v3/company/${realmId}/journalentry?minorversion=${MINOR_VERSION}`, {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify({
        TxnDate: body?.date ?? new Date().toISOString().slice(0, 10),
        PrivateNote: String(body?.narration ?? 'Payroll journal').slice(0, 4000),
        Line: journalLines,
      }),
    });
    const postText = await postRes.text();
    if (!postRes.ok) {
      console.error(`QuickBooks journal post failed [${postRes.status}]: ${postText}`);
      return json({ error: 'QuickBooks rejected the journal', status: postRes.status, details: postText }, postRes.status);
    }

    const parsed = JSON.parse(postText);
    return json({
      ok: true,
      tenantId: String(realmId),
      manualJournalId: parsed?.JournalEntry?.Id ?? null,
      lineCount: journalLines.length,
    });
  } catch (err) {
    console.error('quickbooks-post-journal failed:', err);
    return json({ error: err instanceof Error ? err.message : 'Unexpected error' }, 500);
  }
});
