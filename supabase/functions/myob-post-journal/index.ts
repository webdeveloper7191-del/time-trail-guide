import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { normaliseLines, readToken, writeToken } from '../_shared/accountingTokens.ts';

/**
 * Posts a payroll journal to MYOB AccountRight (GeneralLedger/GeneralJournal).
 *
 * Auth: OAuth2 refresh-token flow against secure.myob.com. Seed
 * MYOB_REFRESH_TOKEN once; the rotated token is persisted in accounting_tokens.
 */

const TOKEN_URL = 'https://secure.myob.com/oauth2/v1/authorize';
const API_ROOT = 'https://api.myob.com/accountright';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const clientId = Deno.env.get('MYOB_CLIENT_ID');
  const clientSecret = Deno.env.get('MYOB_CLIENT_SECRET');
  const seedRefresh = Deno.env.get('MYOB_REFRESH_TOKEN');
  const cfToken = Deno.env.get('MYOB_CF_TOKEN') ?? '';

  if (!clientId || !clientSecret || !seedRefresh) {
    return json(
      {
        error: 'not_connected',
        message:
          'MYOB is not connected yet. Add MYOB_CLIENT_ID, MYOB_CLIENT_SECRET and MYOB_REFRESH_TOKEN in backend secrets to enable live posting.',
      },
      503,
    );
  }

  try {
    const body = await req.json().catch(() => null);
    const mode = body?.mode === 'check' ? 'check' : 'post';

    // 1. Exchange the newest refresh token for an access token.
    const stored = await readToken('myob');
    const refreshToken = stored?.refresh_token ?? seedRefresh;

    const tokenRes = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    const tokenText = await tokenRes.text();
    if (!tokenRes.ok) {
      console.error(`MYOB token refresh failed [${tokenRes.status}]: ${tokenText}`);
      return json({ error: 'MYOB authentication failed', status: tokenRes.status, details: tokenText }, tokenRes.status);
    }
    const tokenJson = JSON.parse(tokenText);
    const accessToken: string = tokenJson.access_token;
    if (tokenJson.refresh_token && tokenJson.refresh_token !== refreshToken) {
      await writeToken('myob', { refresh_token: tokenJson.refresh_token, company_file_id: stored?.company_file_id ?? null });
    }

    const baseHeaders: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      'x-myobapi-key': clientId,
      'x-myobapi-version': 'v2',
      Accept: 'application/json',
    };
    if (cfToken) baseHeaders['x-myobapi-cftoken'] = cfToken;

    // 2. Resolve the company file.
    const filesRes = await fetch(`${API_ROOT}/`, { headers: baseHeaders });
    if (!filesRes.ok) {
      const details = await filesRes.text();
      console.error(`MYOB company file lookup failed [${filesRes.status}]: ${details}`);
      return json({ error: 'MYOB company file lookup failed', status: filesRes.status, details }, filesRes.status);
    }
    const files = (await filesRes.json()) as { Id: string; Name: string; Uri: string }[];
    const wantedId = body?.tenantId ?? Deno.env.get('MYOB_COMPANY_FILE_ID') ?? stored?.company_file_id;
    const file = (wantedId ? files.find((f) => f.Id === wantedId) : files[0]) ?? files[0];
    if (!file) return json({ error: 'No MYOB company file is available for this connection' }, 400);

    if (mode === 'check') {
      return json({ ok: true, tenants: files.map((f) => ({ tenantId: f.Id, tenantName: f.Name })) });
    }

    const cfUri = file.Uri?.replace(/\/$/, '') ?? `${API_ROOT}/${file.Id}`;

    // 3. Validate the journal.
    const { lines, error } = normaliseLines(body?.lines);
    if (error) return json({ error }, 400);

    // 4. Resolve account UIDs from display IDs (MYOB posts against UIDs).
    const codes = [...new Set(lines.map((l) => l.accountCode))];
    const uidByCode = new Map<string, string>();
    for (const code of codes) {
      const url = `${cfUri}/GeneralLedger/Account?$filter=DisplayID eq '${encodeURIComponent(code)}'`;
      const res = await fetch(url, { headers: baseHeaders });
      if (!res.ok) {
        const details = await res.text();
        console.error(`MYOB account lookup failed [${res.status}]: ${details}`);
        return json({ error: 'MYOB account lookup failed', status: res.status, details }, res.status);
      }
      const payload = await res.json();
      const uid = payload?.Items?.[0]?.UID;
      if (!uid) return json({ error: `MYOB account ${code} was not found in ${file.Name}` }, 400);
      uidByCode.set(code, uid);
    }

    const journalLines = lines.map((l) => {
      const isCredit = l.credit > 0;
      return {
        Account: { UID: uidByCode.get(l.accountCode) },
        Amount: Number((isCredit ? l.credit : l.debit).toFixed(2)),
        IsCredit: isCredit,
        Memo: l.description || 'Payroll',
      };
    });

    const postRes = await fetch(`${cfUri}/GeneralLedger/GeneralJournal`, {
      method: 'POST',
      headers: { ...baseHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        DateOccurred: body?.date ?? new Date().toISOString().slice(0, 10),
        Description: String(body?.narration ?? 'Payroll journal').slice(0, 255),
        Lines: journalLines,
      }),
    });

    const postText = await postRes.text();
    if (!postRes.ok) {
      console.error(`MYOB journal post failed [${postRes.status}]: ${postText}`);
      return json({ error: 'MYOB rejected the journal', status: postRes.status, details: postText }, postRes.status);
    }

    return json({
      ok: true,
      tenantId: file.Id,
      tenantName: file.Name,
      manualJournalId: postRes.headers.get('Location')?.split('/').pop() ?? null,
      lineCount: journalLines.length,
    });
  } catch (err) {
    console.error('myob-post-journal failed:', err);
    return json({ error: err instanceof Error ? err.message : 'Unexpected error' }, 500);
  }
});
