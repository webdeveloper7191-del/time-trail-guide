import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Search, ArrowDownToLine, ArrowUpFromLine, Webhook, Copy, Check, Send, FileDown } from 'lucide-react';
import DispatchShiftToAgenciesDialog from '@/components/agency/DispatchShiftToAgenciesDialog';
import { downloadAgencyApiPdf } from '@/utils/agencyApiPdf';
import {
  agencyApiSpec,
  agencyApiCommonHeaders,
  agencyApiErrorEnvelope,
  agencyApiWebhookNotes,
  agencyWebhookDeliveryHeaders,
  agencyWebhookRetrySchedule,
  agencyWebhookExpectedResponse,
  type ApiEndpoint,
  type ApiField,
} from '@/data/agencyIntegrationApiSpec';

const methodColor: Record<string, string> = {
  GET: 'bg-blue-100 text-blue-800 border-blue-200',
  POST: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  PUT: 'bg-amber-100 text-amber-800 border-amber-200',
  PATCH: 'bg-amber-100 text-amber-800 border-amber-200',
  DELETE: 'bg-rose-100 text-rose-800 border-rose-200',
};

const directionMeta = {
  outbound: { label: 'Platform → Agency', icon: ArrowUpFromLine, tone: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  inbound: { label: 'Agency → Platform', icon: ArrowDownToLine, tone: 'bg-teal-50 text-teal-700 border-teal-200' },
  webhook: { label: 'Webhook', icon: Webhook, tone: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' },
} as const;

const CopyBtn: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-7 px-2 text-xs"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
};

const FieldsTable: React.FC<{ fields: ApiField[] }> = ({ fields }) => (
  <div className="rounded-md border overflow-hidden">
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/40">
          <TableHead className="w-[200px]">Field</TableHead>
          <TableHead className="w-[180px]">Type</TableHead>
          <TableHead className="w-[90px]">Required</TableHead>
          <TableHead>Description</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fields.map((f) => (
          <TableRow key={f.name}>
            <TableCell className="font-mono text-xs">{f.name}</TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">{f.type}</TableCell>
            <TableCell>
              {f.required ? (
                <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">required</Badge>
              ) : (
                <span className="text-xs text-muted-foreground">optional</span>
              )}
            </TableCell>
            <TableCell className="text-sm">
              {f.description}
              {f.example !== undefined && (
                <div className="mt-1 text-[11px] text-muted-foreground font-mono">e.g. {String(f.example)}</div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

const CodeBlock: React.FC<{ code: string; label?: string }> = ({ code, label }) => (
  <div className="rounded-md border bg-slate-950 text-slate-50 overflow-hidden">
    <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 bg-slate-900">
      <span className="text-[11px] uppercase tracking-wider text-slate-400">{label ?? 'JSON'}</span>
      <CopyBtn text={code} />
    </div>
    <pre className="text-xs p-3 overflow-auto leading-relaxed"><code>{code}</code></pre>
  </div>
);

const EndpointCard: React.FC<{ ep: ApiEndpoint }> = ({ ep }) => {
  const dirMeta = directionMeta[ep.direction];
  const DirIcon = dirMeta.icon;
  return (
    <Card id={ep.id} className="scroll-mt-24">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={`${methodColor[ep.method]} border font-mono text-xs`} variant="outline">{ep.method}</Badge>
          <code className="text-sm font-mono break-all">{ep.path}</code>
          <Badge variant="outline" className={`${dirMeta.tone} text-[11px] gap-1`}>
            <DirIcon className="h-3 w-3" />
            {dirMeta.label}
          </Badge>
        </div>
        <CardTitle className="text-base mt-2">{ep.summary}</CardTitle>
        <CardDescription>{ep.description}</CardDescription>
        <div className="text-[11px] text-muted-foreground mt-1">Auth: <span className="font-mono">{ep.auth}</span></div>
      </CardHeader>
      <CardContent className="space-y-4">
        {ep.webhook && (
          <section className="rounded-md border bg-fuchsia-50/40 border-fuchsia-200 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Webhook className="h-4 w-4 text-fuchsia-700" />
              <h4 className="text-sm font-semibold">Webhook delivery — <span className="font-mono">{ep.webhook.eventName}</span></h4>
            </div>
            <div className="text-xs grid sm:grid-cols-2 gap-2">
              <div><span className="font-semibold">Expected response:</span> {ep.webhook.expectedResponse}</div>
              <div><span className="font-semibold">Dead-letter:</span> {ep.webhook.deadLetter}</div>
            </div>
            <div>
              <div className="text-xs font-semibold mb-1">Retry schedule</div>
              <ul className="text-xs list-disc pl-5 space-y-0.5">
                {ep.webhook.retrySchedule.map((r, i) => <li key={i} className="font-mono">{r}</li>)}
              </ul>
            </div>
          </section>
        )}
        {ep.requestHeaders && ep.requestHeaders.length > 0 && (
          <section>
            <h4 className="text-sm font-semibold mb-2">Headers</h4>
            <FieldsTable fields={ep.requestHeaders} />
          </section>
        )}
        {ep.pathParams && ep.pathParams.length > 0 && (
          <section>
            <h4 className="text-sm font-semibold mb-2">Path parameters</h4>
            <FieldsTable fields={ep.pathParams} />
          </section>
        )}
        {ep.queryParams && ep.queryParams.length > 0 && (
          <section>
            <h4 className="text-sm font-semibold mb-2">Query parameters</h4>
            <FieldsTable fields={ep.queryParams} />
          </section>
        )}
        {ep.requestBody && ep.requestBody.length > 0 && (
          <section>
            <h4 className="text-sm font-semibold mb-2">Request body</h4>
            <FieldsTable fields={ep.requestBody} />
          </section>
        )}
        {ep.requestSchema && (
          <details className="rounded-md border bg-muted/30">
            <summary className="cursor-pointer text-xs font-semibold px-3 py-2">Request JSON Schema</summary>
            <div className="p-3 pt-0">
              <CodeBlock code={JSON.stringify(ep.requestSchema, null, 2)} label="JSON Schema (Draft 2020-12)" />
            </div>
          </details>
        )}
        {ep.requestExample && (
          <section>
            <h4 className="text-sm font-semibold mb-2">Request example</h4>
            <CodeBlock code={ep.requestExample} label="Request" />
          </section>
        )}
        {ep.responseBody && ep.responseBody.length > 0 && (
          <section>
            <h4 className="text-sm font-semibold mb-2">Response body</h4>
            <FieldsTable fields={ep.responseBody} />
          </section>
        )}
        {ep.responseSchema && (
          <details className="rounded-md border bg-muted/30">
            <summary className="cursor-pointer text-xs font-semibold px-3 py-2">Response JSON Schema</summary>
            <div className="p-3 pt-0">
              <CodeBlock code={JSON.stringify(ep.responseSchema, null, 2)} label="JSON Schema (Draft 2020-12)" />
            </div>
          </details>
        )}
        {ep.responseExample && (
          <section>
            <h4 className="text-sm font-semibold mb-2">Response example</h4>
            <CodeBlock code={ep.responseExample} label="200 OK" />
          </section>
        )}
        {ep.errorCodes && ep.errorCodes.length > 0 && (
          <section>
            <h4 className="text-sm font-semibold mb-2">Error codes</h4>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-[260px]">Code</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ep.errorCodes.map((e) => (
                    <TableRow key={e.code}>
                      <TableCell className="font-mono text-xs">{e.code}</TableCell>
                      <TableCell className="text-sm">{e.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
};

const AgencyIntegrationApiDocs: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const groups = useMemo(() => {
    const g: Record<string, ApiEndpoint[]> = {};
    for (const ep of agencyApiSpec) {
      if (query) {
        const q = query.toLowerCase();
        if (
          !ep.summary.toLowerCase().includes(q) &&
          !ep.path.toLowerCase().includes(q) &&
          !ep.description.toLowerCase().includes(q) &&
          !ep.group.toLowerCase().includes(q)
        ) continue;
      }
      (g[ep.group] ||= []).push(ep);
    }
    return g;
  }, [query]);

  const groupNames = Object.keys(groups);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold tracking-tight">Agency Integration API</h1>
            <p className="text-sm text-muted-foreground">Request &amp; response contracts for integrating 3rd-party staffing agency platforms.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => downloadAgencyApiPdf()}>
            <FileDown className="h-4 w-4 mr-1.5" /> Download PDF
          </Button>
          <Button size="sm" onClick={() => setDispatchOpen(true)}>
            <Send className="h-4 w-4 mr-1.5" /> Dispatch shift
          </Button>
          <div className="relative w-72">
            <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search endpoints…" className="pl-8 h-9" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <Tabs defaultValue="endpoints">
          <TabsList>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="conventions">Conventions</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
          </TabsList>

          <TabsContent value="endpoints" className="mt-4 space-y-8">
            {groupNames.length === 0 && (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No endpoints match "{query}".</CardContent></Card>
            )}
            {groupNames.map((group) => (
              <section key={group} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold tracking-tight">{group}</h2>
                  <Badge variant="secondary">{groups[group].length}</Badge>
                </div>
                <div className="space-y-4">
                  {groups[group].map((ep) => <EndpointCard key={ep.id} ep={ep} />)}
                </div>
              </section>
            ))}
          </TabsContent>

          <TabsContent value="conventions" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Base URL &amp; versioning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="font-mono">https://api.rostered.ai/v1</span> — production</p>
                <p><span className="font-mono">https://api.sandbox.rostered.ai/v1</span> — sandbox</p>
                <p>Breaking changes are released under a new major version (<span className="font-mono">/v2</span>). Backwards-compatible additions roll out to <span className="font-mono">/v1</span> without notice.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Common request headers</CardTitle>
                <CardDescription>Required on every authenticated request.</CardDescription>
              </CardHeader>
              <CardContent>
                <FieldsTable fields={agencyApiCommonHeaders} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pagination</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>List endpoints accept <span className="font-mono">?cursor=</span> and <span className="font-mono">?limit=</span> (max 100). Responses include <span className="font-mono">nextCursor</span> when more pages exist.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rate limits</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>600 requests / minute / agency. <span className="font-mono">X-RateLimit-Remaining</span> and <span className="font-mono">Retry-After</span> headers are returned.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Webhook delivery contract</CardTitle>
                <CardDescription>Events posted from the platform to <span className="font-mono">{'{agency.webhookUrl}'}</span>.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <ul className="list-disc pl-5 space-y-1">
                  {agencyApiWebhookNotes.map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Delivery headers</CardTitle>
                <CardDescription>Sent on every webhook POST.</CardDescription>
              </CardHeader>
              <CardContent>
                <FieldsTable fields={agencyWebhookDeliveryHeaders} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Signature scheme (v1)</CardTitle>
                <CardDescription>
                  <span className="font-mono">X-RosteredAI-Signature: t=&lt;unix_ts&gt;,v1=&lt;hex&gt;</span> where
                  <span className="font-mono"> hex = HMAC_SHA256(webhookSecret, unix_ts + "." + rawBody)</span>.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock label="Node.js — verify signature" code={`import crypto from 'crypto';

// Reject requests older than 5 minutes to prevent replay.
const TOLERANCE_SECONDS = 300;

export function verifyRosteredSignature(rawBody, headerValue, secret) {
  const parts = Object.fromEntries(
    headerValue.split(',').map(p => p.split('='))
  );
  const ts = parseInt(parts.t, 10);
  const sig = parts.v1;
  if (!ts || !sig) return false;
  if (Math.abs(Date.now() / 1000 - ts) > TOLERANCE_SECONDS) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(\`\${ts}.\${rawBody}\`)
    .digest('hex');

  // timingSafeEqual requires equal length buffers
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(sig, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}`} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Retry schedule</CardTitle>
                <CardDescription>Applied to any non-2xx response (other than 410 Gone) or timeout (5 s).</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="w-[120px]">Attempt</TableHead>
                        <TableHead className="w-[200px]">Delay from previous</TableHead>
                        <TableHead>Cumulative time since first attempt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agencyWebhookRetrySchedule.map(r => (
                        <TableRow key={r.attempt}>
                          <TableCell className="font-mono text-xs">#{r.attempt}</TableCell>
                          <TableCell className="text-sm">{r.delay}</TableCell>
                          <TableCell className="text-sm">{r.cumulative}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Expected responses</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p><span className="font-semibold">Success:</span> {agencyWebhookExpectedResponse.success}</p>
                <p><span className="font-semibold">Reject permanently:</span> {agencyWebhookExpectedResponse.rejectSilently}</p>
                <p><span className="font-semibold">Retryable failure:</span> {agencyWebhookExpectedResponse.retry}</p>
                <p><span className="font-semibold">Timeout:</span> {agencyWebhookExpectedResponse.timeout}</p>
                <p><span className="font-semibold">Dead-letter:</span> {agencyWebhookExpectedResponse.deadLetter}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Event catalog</CardTitle>
                <CardDescription>All webhook events emitted by the platform.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="w-[260px]">Event</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agencyApiSpec.filter(e => e.direction === 'webhook').map(e => (
                        <TableRow key={e.id}>
                          <TableCell className="font-mono text-xs">{e.webhook?.eventName ?? e.id}</TableCell>
                          <TableCell className="text-sm">
                            <a href={`#${e.id}`} className="text-primary hover:underline">{e.summary}</a>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="errors" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Error envelope</CardTitle>
                <CardDescription>{agencyApiErrorEnvelope.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock code={agencyApiErrorEnvelope.example} label="Error" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Standard codes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="w-[220px]">HTTP / code</TableHead>
                        <TableHead>Meaning</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        ['400 invalid_request', 'Malformed JSON or missing required field.'],
                        ['401 unauthorized', 'Missing or invalid bearer token.'],
                        ['403 forbidden', 'Token lacks required scope.'],
                        ['404 not_found', 'Resource does not exist.'],
                        ['409 conflict', 'Duplicate or state conflict.'],
                        ['410 gone', 'Resource expired (e.g. SLA passed).'],
                        ['422 validation_error', 'Field validation failed — see errors[].'],
                        ['429 rate_limited', 'Too many requests — honour Retry-After.'],
                        ['500 internal_error', 'Server error — safe to retry with backoff.'],
                      ].map(([c, d]) => (
                        <TableRow key={c}>
                          <TableCell className="font-mono text-xs">{c}</TableCell>
                          <TableCell className="text-sm">{d}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <DispatchShiftToAgenciesDialog open={dispatchOpen} onOpenChange={setDispatchOpen} />
    </div>
  );
};

export default AgencyIntegrationApiDocs;
