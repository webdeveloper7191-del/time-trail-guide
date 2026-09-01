import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const admin = () =>
  createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

type Run = Record<string, unknown> & { id?: string };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = admin();

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('pay_runs')
        .select('payload')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return json({ runs: (data ?? []).map((r) => r.payload) });
    }

    if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return json({ error: 'Invalid JSON body' }, 400);

    const action = (body as { action?: string }).action;

    if (action === 'delete') {
      const id = (body as { id?: string }).id;
      if (!id || typeof id !== 'string') return json({ error: 'id is required' }, 400);
      const { error } = await supabase.from('pay_runs').delete().eq('id', id);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === 'upsert') {
      const runs = (body as { runs?: Run[] }).runs;
      if (!Array.isArray(runs) || runs.length === 0) return json({ error: 'runs[] is required' }, 400);
      const rows = runs
        .filter((r) => typeof r?.id === 'string')
        .map((r) => ({
          id: r.id as string,
          name: typeof r.name === 'string' ? r.name : '',
          status: typeof r.status === 'string' ? r.status : 'draft',
          locked: Boolean(r.locked),
          period_start: typeof r.periodStart === 'string' ? r.periodStart : null,
          period_end: typeof r.periodEnd === 'string' ? r.periodEnd : null,
          reversal_of_run_id: typeof r.reversalOfRunId === 'string' ? r.reversalOfRunId : null,
          payload: r,
          updated_at: new Date().toISOString(),
        }));
      if (rows.length === 0) return json({ error: 'No valid runs supplied' }, 400);
      const { error } = await supabase.from('pay_runs').upsert(rows, { onConflict: 'id' });
      if (error) throw error;
      return json({ ok: true, count: rows.length });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (err) {
    console.error('payroll-archive failed:', err);
    return json({ error: err instanceof Error ? err.message : 'Unexpected error' }, 500);
  }
});
