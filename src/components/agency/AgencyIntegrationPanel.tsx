import { useEffect, useMemo, useState } from 'react';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  AgencyPartnerStore,
  ALL_SCOPES,
  ALL_WEBHOOK_EVENTS,
  integrationReadiness,
  type AgencyIntegrationConfig,
  type AgencyPartnerApplication,
  type IntegrationEnv,
  type IntegrationScope,
  type WebhookEvent,
  type RoleMapping,
} from '@/lib/agencyPartnerApplicationStore';
import { usePositions } from '@/lib/masterData/positionsStore';
import { KeyRound, RotateCw, Ban, Plus, Send, CheckCircle2, XCircle, AlertTriangle, Trash2, RefreshCw, Copy } from 'lucide-react';

const CURRENT_USER = 'admin@rostered.ai';

export function AgencyIntegrationPanel({
  app, open, onClose,
}: { app: AgencyPartnerApplication | null; open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState('overview');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!open) return;
    const unsub = AgencyPartnerStore.subscribe(() => setTick(t => t + 1));
    return () => { unsub(); };
  }, [open]);
  useEffect(() => { if (open) setTab('overview'); }, [open, app?.id]);

  if (!app) return null;
  const cfg = AgencyPartnerStore.getIntegration(app.id);
  const readiness = integrationReadiness(cfg);

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title={`Integration — ${app.agencyName}`}
      description="API credentials, webhooks, mapping and delivery log."
      widthClassName="w-full sm:max-w-3xl"
    >
      <div className="px-6 py-3 border-b flex items-center gap-3">
        <ReadinessPill label="Credentials" ok={readiness.credentials} />
        <ReadinessPill label="Webhook" ok={readiness.webhook} />
        <ReadinessPill label="Events" ok={readiness.events} />
        <ReadinessPill label="Mapping" ok={readiness.mapping} />
        <div className="ml-auto text-xs text-muted-foreground">
          {cfg.lastSuccessfulDeliveryAt
            ? `Last delivered ${new Date(cfg.lastSuccessfulDeliveryAt).toLocaleString()}`
            : 'No deliveries yet'}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-6 mt-4 flex-wrap justify-start h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="webhook">Webhook</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="limits">Rate limits & IP</TabsTrigger>
          <TabsTrigger value="mapping">Role mapping</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="deliveries">Delivery log</TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <TabsContent value="overview" className="mt-0">
            <OverviewTab app={app} cfg={cfg} setTab={setTab} />
          </TabsContent>
          <TabsContent value="credentials" className="mt-0">
            <CredentialsTab app={app} cfg={cfg} />
          </TabsContent>
          <TabsContent value="webhook" className="mt-0">
            <WebhookTab app={app} cfg={cfg} />
          </TabsContent>
          <TabsContent value="events" className="mt-0">
            <EventsTab app={app} cfg={cfg} />
          </TabsContent>
          <TabsContent value="limits" className="mt-0">
            <LimitsTab app={app} cfg={cfg} />
          </TabsContent>
          <TabsContent value="mapping" className="mt-0">
            <MappingTab app={app} cfg={cfg} />
          </TabsContent>
          <TabsContent value="notifications" className="mt-0">
            <NotificationsTab app={app} cfg={cfg} />
          </TabsContent>
          <TabsContent value="deliveries" className="mt-0">
            <DeliveriesTab app={app} cfg={cfg} />
          </TabsContent>
        </div>
      </Tabs>
    </PrimaryOffCanvas>
  );
}

function ReadinessPill({ label, ok }: { label: string; ok: boolean }) {
  return (
    <Badge variant="outline" className={ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}>
      {ok ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
      {label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------
function OverviewTab({ app, cfg, setTab }: { app: AgencyPartnerApplication; cfg: AgencyIntegrationConfig; setTab: (t: string) => void }) {
  const items: { key: string; title: string; ok: boolean; tab: string; hint: string }[] = [
    { key: 'creds', title: 'API credentials issued', ok: cfg.credentials.some(c => !c.revokedAt), tab: 'credentials', hint: 'Mint a client id / secret so the agency can authenticate.' },
    { key: 'wh', title: 'Webhook endpoint verified', ok: !!cfg.webhookUrl && !!cfg.webhookVerifiedAt, tab: 'webhook', hint: 'Set the URL, rotate a signing secret, send a test event.' },
    { key: 'ev', title: 'Event subscriptions selected', ok: cfg.eventSubscriptions.length > 0, tab: 'events', hint: 'Pick which events we push to this partner.' },
    { key: 'map', title: 'Role mapping resolved', ok: cfg.roleMappings.length > 0 && cfg.roleMappings.every(m => !!m.positionId), tab: 'mapping', hint: 'Reconcile every agency role label to a tenant position id.' },
    { key: 'not', title: 'Notification routing set', ok: cfg.notifications.dispatchFailureRecipients.length > 0, tab: 'notifications', hint: 'Route dispatch failure and dead-letter alerts.' },
  ];
  return (
    <div className="space-y-3">
      <Card className="p-4 flex items-center gap-3">
        <div className="text-sm">Environment</div>
        <Select value={cfg.env} onValueChange={(v: IntegrationEnv) => AgencyPartnerStore.updateIntegration(app.id, CURRENT_USER, { env: v }, `Switched to ${v}.`)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="sandbox">Sandbox</SelectItem>
            <SelectItem value="production">Production</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto text-xs text-muted-foreground">
          Agency ID: <span className="font-mono">{app.id}</span>
        </div>
      </Card>
      {items.map(it => (
        <Card key={it.key} className="p-3 flex items-center gap-3">
          {it.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-amber-600" />}
          <div className="flex-1">
            <div className="text-sm font-medium">{it.title}</div>
            <div className="text-xs text-muted-foreground">{it.hint}</div>
          </div>
          <Button size="sm" variant="outline" onClick={() => setTab(it.tab)}>{it.ok ? 'Review' : 'Configure'}</Button>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------
function CredentialsTab({ app, cfg }: { app: AgencyPartnerApplication; cfg: AgencyIntegrationConfig }) {
  const [env, setEnv] = useState<IntegrationEnv>(cfg.env);
  const [scopes, setScopes] = useState<IntegrationScope[]>(['shifts.read', 'placements.write']);

  const toggleScope = (s: IntegrationScope) =>
    setScopes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const issue = () => {
    if (scopes.length === 0) return toast.error('Pick at least one scope.');
    const cred = AgencyPartnerStore.issueCredentials(app.id, CURRENT_USER, env, scopes);
    toast.success(`Issued ${env} credentials (${cred.clientId})`, {
      description: 'Copy the client secret now — it is only shown once in production.',
    });
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <div className="text-sm font-medium">Issue new credential</div>
        <div className="flex items-center gap-3">
          <div>
            <Label className="text-xs">Environment</Label>
            <Select value={env} onValueChange={(v: IntegrationEnv) => setEnv(v)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox</SelectItem>
                <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={issue} className="mt-4"><KeyRound className="h-4 w-4 mr-2" />Mint credential</Button>
        </div>
        <div>
          <Label className="text-xs">Scopes</Label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {ALL_SCOPES.map(s => (
              <label key={s} className="flex items-center gap-2 text-sm">
                <Checkbox checked={scopes.includes(s)} onCheckedChange={() => toggleScope(s)} />
                <span className="font-mono text-xs">{s}</span>
              </label>
            ))}
          </div>
        </div>
      </Card>

      <div className="text-sm font-medium">Existing credentials</div>
      {cfg.credentials.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">No credentials issued yet.</Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client ID</TableHead>
                <TableHead>Env</TableHead>
                <TableHead>Scopes</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cfg.credentials.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">
                    <div>{c.clientId}</div>
                    <div className="text-muted-foreground">{c.clientSecretPreview}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.env === 'production' ? 'default' : 'secondary'}>{c.env}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                      {c.scopes.map(s => <Badge key={s} variant="outline" className="font-mono text-[10px]">{s}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString()}
                    {c.rotatedAt && <div>rotated {new Date(c.rotatedAt).toLocaleDateString()}</div>}
                  </TableCell>
                  <TableCell>
                    {c.revokedAt
                      ? <Badge variant="destructive">Revoked</Badge>
                      : <Badge className="bg-emerald-100 text-emerald-800">Active</Badge>}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(c.clientId); toast.success('Client ID copied'); }}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    {!c.revokedAt && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => { AgencyPartnerStore.rotateClientSecret(app.id, c.id, CURRENT_USER); toast.success('Secret rotated'); }}>
                          <RotateCw className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { AgencyPartnerStore.revokeCredential(app.id, c.id, CURRENT_USER); toast.success('Credential revoked'); }}>
                          <Ban className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Webhook
// ---------------------------------------------------------------------------
function WebhookTab({ app, cfg }: { app: AgencyPartnerApplication; cfg: AgencyIntegrationConfig }) {
  const [url, setUrl] = useState(cfg.webhookUrl ?? '');
  useEffect(() => setUrl(cfg.webhookUrl ?? ''), [cfg.webhookUrl]);

  const save = () => {
    try { new URL(url); } catch { return toast.error('Enter a valid https URL.'); }
    if (!url.startsWith('https://')) return toast.error('Webhook URL must use https.');
    AgencyPartnerStore.updateIntegration(app.id, CURRENT_USER, { webhookUrl: url, webhookVerifiedAt: undefined }, 'Webhook URL updated.');
    toast.success('Webhook URL saved — send a test to verify.');
  };
  const rotate = () => {
    AgencyPartnerStore.rotateWebhookSecret(app.id, CURRENT_USER);
    toast.success('Signing secret rotated');
  };
  const sendTest = () => {
    try {
      const ok = AgencyPartnerStore.sendTestDelivery(app.id, 'shift.broadcast', CURRENT_USER);
      ok ? toast.success('Test event delivered — webhook verified') : toast.error('Test failed. Check endpoint.');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <div>
          <Label>Endpoint URL</Label>
          <div className="flex gap-2 mt-1">
            <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://agency.example.com/rostered/webhook" />
            <Button onClick={save}>Save</Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Must be https. Rostered.ai signs every payload with <code className="font-mono">X-RosteredAI-Signature</code>.</p>
        </div>
        <Separator />
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Label>Signing secret</Label>
            <div className="text-sm font-mono mt-1">{cfg.webhookSigningSecretPreview ?? '— not generated —'}</div>
          </div>
          <Button variant="outline" onClick={rotate}><RotateCw className="h-4 w-4 mr-2" />Rotate</Button>
        </div>
        <Separator />
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Label>Verification</Label>
            <div className="text-sm mt-1">
              {cfg.webhookVerifiedAt
                ? <span className="text-emerald-700">Verified {new Date(cfg.webhookVerifiedAt).toLocaleString()}</span>
                : <span className="text-amber-700">Not verified — send a test</span>}
            </div>
          </div>
          <Button variant="outline" onClick={sendTest} disabled={!cfg.webhookUrl}>
            <Send className="h-4 w-4 mr-2" />Send test shift.broadcast
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
function EventsTab({ app, cfg }: { app: AgencyPartnerApplication; cfg: AgencyIntegrationConfig }) {
  const toggle = (ev: WebhookEvent) => {
    const next = cfg.eventSubscriptions.includes(ev)
      ? cfg.eventSubscriptions.filter(e => e !== ev)
      : [...cfg.eventSubscriptions, ev];
    AgencyPartnerStore.updateIntegration(app.id, CURRENT_USER, { eventSubscriptions: next }, 'Event subscriptions updated.');
  };
  return (
    <Card className="p-4 space-y-2">
      <div className="text-sm font-medium">Subscribed events</div>
      <p className="text-xs text-muted-foreground">Only checked events are delivered to this partner's webhook.</p>
      <div className="mt-2 space-y-2">
        {ALL_WEBHOOK_EVENTS.map(ev => (
          <label key={ev} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50">
            <Checkbox checked={cfg.eventSubscriptions.includes(ev)} onCheckedChange={() => toggle(ev)} />
            <span className="font-mono text-sm">{ev}</span>
          </label>
        ))}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Limits & IP
// ---------------------------------------------------------------------------
function LimitsTab({ app, cfg }: { app: AgencyPartnerApplication; cfg: AgencyIntegrationConfig }) {
  const [rpm, setRpm] = useState(String(cfg.rateLimitRpm));
  const [burst, setBurst] = useState(String(cfg.rateLimitBurst));
  const [ipText, setIpText] = useState(cfg.ipAllowlist.join('\n'));
  useEffect(() => { setRpm(String(cfg.rateLimitRpm)); setBurst(String(cfg.rateLimitBurst)); setIpText(cfg.ipAllowlist.join('\n')); }, [cfg]);

  const save = () => {
    const r = Number(rpm), b = Number(burst);
    if (!Number.isFinite(r) || r < 1) return toast.error('RPM must be ≥ 1.');
    if (!Number.isFinite(b) || b < 0) return toast.error('Burst must be ≥ 0.');
    const ips = ipText.split('\n').map(l => l.trim()).filter(Boolean);
    AgencyPartnerStore.updateIntegration(app.id, CURRENT_USER, {
      rateLimitRpm: r, rateLimitBurst: b, ipAllowlist: ips,
    }, 'Rate limit / IP allowlist updated.');
    toast.success('Limits saved');
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Requests / minute</Label>
          <Input value={rpm} onChange={e => setRpm(e.target.value)} type="number" min={1} />
        </div>
        <div>
          <Label>Burst allowance</Label>
          <Input value={burst} onChange={e => setBurst(e.target.value)} type="number" min={0} />
        </div>
      </div>
      <div>
        <Label>IP allowlist (one CIDR or IP per line — empty = allow all)</Label>
        <Textarea value={ipText} onChange={e => setIpText(e.target.value)} rows={5} placeholder="203.0.113.0/24&#10;198.51.100.42" />
      </div>
      <div className="text-right">
        <Button onClick={save}>Save limits</Button>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Role mapping
// ---------------------------------------------------------------------------
function MappingTab({ app, cfg }: { app: AgencyPartnerApplication; cfg: AgencyIntegrationConfig }) {
  const positions = usePositions();
  const activePositions = positions.filter(p => p.status === 'active');
  const [newLabel, setNewLabel] = useState('');

  // Auto-seed from rate cards if empty
  useEffect(() => {
    if (cfg.roleMappings.length === 0 && (app.rateCards?.length ?? 0) > 0) {
      const seeded: RoleMapping[] = (app.rateCards ?? [])
        .filter(rc => rc.roleName)
        .map(rc => ({ id: `map_${rc.id}`, agencyRoleLabel: rc.roleName }));
      if (seeded.length > 0) {
        AgencyPartnerStore.updateIntegration(app.id, CURRENT_USER, { roleMappings: seeded }, 'Seeded role mappings from rate cards.');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app.id]);

  const update = (mappings: RoleMapping[]) =>
    AgencyPartnerStore.updateIntegration(app.id, CURRENT_USER, { roleMappings: mappings }, 'Role mappings updated.');

  const addRow = () => {
    const label = newLabel.trim();
    if (!label) return;
    update([...cfg.roleMappings, { id: `map_${Date.now()}`, agencyRoleLabel: label }]);
    setNewLabel('');
  };
  const setPosition = (mapId: string, positionId: string) => {
    const pos = activePositions.find(p => p.id === positionId);
    update(cfg.roleMappings.map(m => m.id === mapId
      ? { ...m, positionId, positionLabel: pos?.label, confirmedAt: new Date().toISOString(), confirmedBy: CURRENT_USER }
      : m));
  };
  const removeRow = (mapId: string) => update(cfg.roleMappings.filter(m => m.id !== mapId));

  const unresolved = cfg.roleMappings.filter(m => !m.positionId).length;

  return (
    <div className="space-y-4">
      <Card className="p-3 flex items-center gap-2 text-sm">
        {unresolved > 0
          ? <><AlertTriangle className="h-4 w-4 text-amber-600" /><span>{unresolved} role label{unresolved === 1 ? '' : 's'} still unmapped — dispatch will be blocked until every label is bound to a tenant position.</span></>
          : cfg.roleMappings.length === 0
            ? <><AlertTriangle className="h-4 w-4 text-amber-600" /><span>Add at least one role mapping.</span></>
            : <><CheckCircle2 className="h-4 w-4 text-emerald-600" /><span>All agency role labels are mapped.</span></>}
      </Card>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agency role label</TableHead>
              <TableHead>Tenant position</TableHead>
              <TableHead>Confirmed</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {cfg.roleMappings.map(m => (
              <TableRow key={m.id}>
                <TableCell className="font-mono text-xs">{m.agencyRoleLabel}</TableCell>
                <TableCell>
                  <Select value={m.positionId ?? ''} onValueChange={v => setPosition(m.id, v)}>
                    <SelectTrigger className="w-64"><SelectValue placeholder="Pick position…" /></SelectTrigger>
                    <SelectContent>
                      {activePositions.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {m.confirmedAt ? new Date(m.confirmedAt).toLocaleDateString() : '—'}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" onClick={() => removeRow(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={4}>
                <div className="flex gap-2">
                  <Input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Add agency role label (e.g. RN, EN, ECT)" />
                  <Button variant="outline" onClick={addRow}><Plus className="h-4 w-4 mr-1" />Add</Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
function NotificationsTab({ app, cfg }: { app: AgencyPartnerApplication; cfg: AgencyIntegrationConfig }) {
  const [dispatch, setDispatch] = useState(cfg.notifications.dispatchFailureRecipients.join(', '));
  const [dlq, setDlq] = useState(cfg.notifications.deadLetterRecipients.join(', '));
  const [email, setEmail] = useState(cfg.notifications.channelEmail);
  const [inApp, setInApp] = useState(cfg.notifications.channelInApp);
  useEffect(() => {
    setDispatch(cfg.notifications.dispatchFailureRecipients.join(', '));
    setDlq(cfg.notifications.deadLetterRecipients.join(', '));
    setEmail(cfg.notifications.channelEmail);
    setInApp(cfg.notifications.channelInApp);
  }, [cfg]);

  const parse = (s: string) => s.split(/[,\n]/).map(x => x.trim()).filter(Boolean);
  const save = () => {
    AgencyPartnerStore.updateIntegration(app.id, CURRENT_USER, {
      notifications: {
        dispatchFailureRecipients: parse(dispatch),
        deadLetterRecipients: parse(dlq),
        channelEmail: email,
        channelInApp: inApp,
      },
    }, 'Notification routing updated.');
    toast.success('Routing saved');
  };

  return (
    <Card className="p-4 space-y-3">
      <div>
        <Label>Dispatch-failure recipients</Label>
        <Textarea value={dispatch} onChange={e => setDispatch(e.target.value)} rows={2} placeholder="ops@tenant.com, oncall@tenant.com" />
        <p className="text-xs text-muted-foreground mt-1">Alerted when a shift.broadcast fails to deliver after retries.</p>
      </div>
      <div>
        <Label>Dead-letter recipients</Label>
        <Textarea value={dlq} onChange={e => setDlq(e.target.value)} rows={2} placeholder="integrations@tenant.com" />
        <p className="text-xs text-muted-foreground mt-1">Alerted when a delivery lands in the dead-letter queue.</p>
      </div>
      <Separator />
      <div className="flex items-center justify-between">
        <div><Label>Email</Label><p className="text-xs text-muted-foreground">Send email alerts.</p></div>
        <Switch checked={email} onCheckedChange={setEmail} />
      </div>
      <div className="flex items-center justify-between">
        <div><Label>In-app</Label><p className="text-xs text-muted-foreground">Post to admin notification centre.</p></div>
        <Switch checked={inApp} onCheckedChange={setInApp} />
      </div>
      <div className="text-right">
        <Button onClick={save}>Save routing</Button>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Deliveries
// ---------------------------------------------------------------------------
function DeliveriesTab({ app, cfg }: { app: AgencyPartnerApplication; cfg: AgencyIntegrationConfig }) {
  const [filter, setFilter] = useState<'all' | 'delivered' | 'failed' | 'dead_letter'>('all');
  const rows = useMemo(() => filter === 'all' ? cfg.deliveries : cfg.deliveries.filter(d => d.status === filter), [cfg.deliveries, filter]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select value={filter} onValueChange={(v: typeof filter) => setFilter(v)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="dead_letter">Dead letter</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto text-xs text-muted-foreground">Showing {rows.length} of {cfg.deliveries.length}</div>
      </div>
      {rows.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">No deliveries recorded.</Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Attempt</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Response</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="text-xs text-muted-foreground">{new Date(d.attemptedAt).toLocaleString()}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {d.event}{d.isTest && <Badge variant="outline" className="ml-1 text-[10px]">test</Badge>}
                  </TableCell>
                  <TableCell className="text-xs">#{d.attempt}</TableCell>
                  <TableCell>
                    {d.status === 'delivered' && <Badge className="bg-emerald-100 text-emerald-800"><CheckCircle2 className="h-3 w-3 mr-1" />Delivered</Badge>}
                    {d.status === 'failed' && <Badge className="bg-rose-100 text-rose-800"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>}
                    {d.status === 'retrying' && <Badge className="bg-amber-100 text-amber-800">Retrying</Badge>}
                    {d.status === 'dead_letter' && <Badge variant="destructive">Dead letter</Badge>}
                  </TableCell>
                  <TableCell className="text-xs">
                    {d.responseCode ?? '—'} · {d.latencyMs ?? '—'}ms
                    {d.errorMessage && <div className="text-rose-700">{d.errorMessage}</div>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => { AgencyPartnerStore.retryDelivery(app.id, d.id, CURRENT_USER); toast.success('Retry queued'); }}>
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />Retry
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
