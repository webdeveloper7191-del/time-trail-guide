import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createOpenAI } from "npm:@ai-sdk/openai";
import { streamText, APICallError } from "npm:ai";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  getLovableAiGatewayResponseHeaders,
} from "../_shared/run-id.ts";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

const cors = {
  ...corsHeaders,
  "Access-Control-Allow-Headers": `${corsHeaders["Access-Control-Allow-Headers"] ?? "authorization, x-client-info, apikey, content-type"}, x-lovable-aig-run-id`,
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const INSTRUCTIONS = `You are an assistant helping a hiring manager assess how well an applicant matches a job.
Rules:
- Use ONLY the applicant profile and job requirements supplied. Never invent experience, qualifications, dates or employers.
- Every claim must cite evidence by quoting or closely paraphrasing the applicant profile in "quotes".
- If evidence for a requirement is missing, say "No evidence provided" — absence of evidence is not proof the candidate lacks it.
- Do not consider or comment on age, gender, ethnicity, religion, disability, family status, or other protected attributes, nor proxies for them.
- Be balanced and concise. This is decision support; the hiring manager makes the decision.

Respond in Markdown with exactly these sections:
## Overall fit
One line: Strong fit / Good fit / Partial fit / Weak fit, followed by a 2–3 sentence rationale.
## Requirement-by-requirement
A table with columns: Requirement | Assessment (Met / Partly met / Not evidenced) | Evidence from profile
## Strengths
Bullets, each with evidence.
## Gaps and risks
Bullets; distinguish "not evidenced" from "contradicted".
## Suggested interview questions
3–5 questions that would verify gaps or claims.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return json({ error: "AI is not configured for this app." }, 500);

  let body: { profile?: string; requirements?: string; jobTitle?: string };
  try { body = await req.json(); } catch { return json({ error: "Invalid request." }, 400); }
  const profile = (body.profile ?? "").trim();
  const requirements = (body.requirements ?? "").trim();
  if (!profile || !requirements) return json({ error: "Both the applicant profile and job requirements are needed." }, 400);
  if (profile.length + requirements.length > 60000) return json({ error: "The text is too long. Please shorten the profile or requirements." }, 400);

  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(req));
  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  const result = streamText({
    model: provider.responses(MODEL),
    instructions: INSTRUCTIONS,
    messages: [{
      role: "user",
      content: `JOB: ${body.jobTitle ?? "(untitled)"}\n\n=== JOB REQUIREMENTS ===\n${requirements}\n\n=== APPLICANT PROFILE ===\n${profile}`,
    }],
    abortSignal: req.signal,
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "medium",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  } as Parameters<typeof streamText>[0]);

  const iterator = result.fullStream[Symbol.asyncIterator]();
  const encoder = new TextEncoder();

  const errorInfo = (err: unknown) => {
    const status = APICallError.isInstance(err) ? err.statusCode ?? 500 : 500;
    let message = "The AI summary could not be generated. Please try again later.";
    if (status === 402) message = "AI credits have run out. Add credits in Settings → Plans & credits to keep using AI summaries.";
    else if (status === 429) message = "Too many AI requests right now. Please wait a minute and try again.";
    else if (status === 403) message = "AI access is not available for this workspace right now.";
    else if (APICallError.isInstance(err) && status < 500 && err.message) message = err.message;
    return { status, message };
  };

  // Read until the first text (or error) before sending headers, so failures keep their status.
  const buffered: string[] = [];
  try {
    while (true) {
      const { value, done } = await iterator.next();
      if (done) break;
      if (value.type === "error") { const e = errorInfo(value.error); return json({ error: e.message }, e.status); }
      if (value.type === "text-delta") { buffered.push((value as { text?: string; delta?: string }).text ?? (value as { delta?: string }).delta ?? ""); break; }
    }
  } catch (err) {
    if ((err as Error)?.name === "AbortError") return new Response(null, { status: 499, headers: cors });
    const e = errorInfo(err); return json({ error: e.message }, e.status);
  }
  if (buffered.length === 0) return json({ error: "The AI returned no summary. Please try again." }, 502);

  const stream = new ReadableStream({
    async start(controller) {
      for (const b of buffered) controller.enqueue(encoder.encode(b));
      try {
        while (true) {
          const { value, done } = await iterator.next();
          if (done) break;
          if (value.type === "text-delta") controller.enqueue(encoder.encode((value as { text?: string; delta?: string }).text ?? (value as { delta?: string }).delta ?? ""));
          if (value.type === "error") { controller.enqueue(encoder.encode(`\n\n> ⚠️ ${errorInfo(value.error).message}`)); break; }
        }
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") controller.enqueue(encoder.encode(`\n\n> ⚠️ ${errorInfo(err).message}`));
      }
      controller.close();
    },
    cancel() { iterator.return?.(); },
  });

  const headers = getLovableAiGatewayResponseHeaders(undefined, { ...cors, "Content-Type": "text/plain; charset=utf-8" });
  const runId = runIdFetch.getRunId();
  if (runId) { headers.set("X-Lovable-AIG-Run-ID", runId); headers.set("Access-Control-Expose-Headers", "X-Lovable-AIG-Run-ID"); }
  return new Response(stream, { headers });
});
