import React, { useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Send, Search, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

// Example shift request — wired to API docs preview. Replace with the
// real selected shift when invoked from the roster.
export interface DispatchShift {
  shiftRequestId: string;
  tenantId: string;
  clientName: string;
  locationAddress: string;
  timezone: string;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  totalPositions: number;
  requirements: Array<{ roleName: string; quantity: number; skills?: string[]; certifications?: string[]; minExperience?: number }>;
  urgency: 'standard' | 'urgent' | 'critical';
  fillMode: 'express' | 'managed';
  slaDeadline: string;
  payRate: number;
  chargeRate: number;
  currency: string;
  instructions?: string;
}

export interface DispatchAgencyOption {
  id: string;
  name: string;
  coverage: string;
  fillRate: number;
  reliability: number;
  status: 'active' | 'suspended' | 'inactive';
}

const sampleShift: DispatchShift = {
  shiftRequestId: 'sr_01HXYZ',
  tenantId: 'tnt_4f9a',
  clientName: 'Sunrise Early Learning – Bondi',
  locationAddress: '12 Beach Rd, Bondi NSW 2026',
  timezone: 'Australia/Sydney',
  date: '2026-06-15',
  startTime: '07:30',
  endTime: '16:30',
  breakMinutes: 30,
  totalPositions: 2,
  requirements: [
    { roleName: 'Educator – Diploma', quantity: 2, skills: ['0-2yr room'], certifications: ['WWCC', 'First Aid'], minExperience: 2 },
  ],
  urgency: 'urgent',
  fillMode: 'managed',
  slaDeadline: '2026-06-14T18:00:00+10:00',
  payRate: 38.5,
  chargeRate: 62.0,
  currency: 'AUD',
  instructions: 'Use staff entry on Curlewis St.',
};

const sampleAgencies: DispatchAgencyOption[] = [
  { id: 'agy_01HXYZ', name: 'Bright Staffing', coverage: 'Inner Sydney · NSW', fillRate: 89, reliability: 94, status: 'active' },
  { id: 'agy_02ABCD', name: 'Reliable Care Partners', coverage: 'Greater Sydney', fillRate: 82, reliability: 91, status: 'active' },
  { id: 'agy_03EFGH', name: 'EduStaff Network', coverage: 'NSW · ACT', fillRate: 76, reliability: 88, status: 'active' },
  { id: 'agy_04WXYZ', name: 'OnDemand Educators', coverage: 'Sydney Eastern Suburbs', fillRate: 71, reliability: 85, status: 'active' },
  { id: 'agy_05QRST', name: 'Metro Relief Staff', coverage: 'Sydney CBD', fillRate: 65, reliability: 79, status: 'suspended' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift?: DispatchShift;
  agencies?: DispatchAgencyOption[];
}

const DispatchShiftToAgenciesDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  shift = sampleShift,
  agencies = sampleAgencies,
}) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [urgency, setUrgency] = useState<DispatchShift['urgency']>(shift.urgency);
  const [fillMode, setFillMode] = useState<DispatchShift['fillMode']>(shift.fillMode);
  const [slaDeadline, setSlaDeadline] = useState(shift.slaDeadline);
  const [allowOverfill, setAllowOverfill] = useState(false);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<Array<{ agencyId: string; status: string; deliveryId?: string; reason?: string }> | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return agencies;
    return agencies.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.coverage.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q)
    );
  }, [search, agencies]);

  const toggle = (id: string) => {
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const requestPayload = {
    agencyIds: selected,
    fillMode,
    urgency,
    slaDeadline,
    allowOverfill,
    ...(note ? { note } : {}),
  };

  const webhookPayload = {
    eventId: '8a4e7e10-7e1c-4f0d-9c1e-bc2f4a8b1234',
    eventType: 'shift.broadcast',
    occurredAt: new Date().toISOString(),
    apiVersion: '2026-06-01',
    data: shift,
  };

  const requestJson = JSON.stringify(requestPayload, null, 2);
  const webhookJson = JSON.stringify(webhookPayload, null, 2);
  const curlCmd = `curl -X POST 'https://api.rostered.ai/v1/shift-requests/${shift.shiftRequestId}/dispatch' \\
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \\
  -H 'X-Tenant-Id: ${shift.tenantId}' \\
  -H 'X-Request-Id: $(uuidgen)' \\
  -H 'Content-Type: application/json' \\
  -d '${requestJson.replace(/\n/g, ' ')}'`;

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const handleSend = async () => {
    if (selected.length === 0) {
      toast.error('Select at least one agency');
      return;
    }
    setSending(true);
    // Simulated dispatch — wire to real edge function when backend is ready.
    await new Promise(r => setTimeout(r, 600));
    const simulated = selected.map(id => {
      const a = agencies.find(x => x.id === id);
      if (a?.status !== 'active') {
        return { agencyId: id, status: 'skipped', reason: 'agency_inactive' };
      }
      return { agencyId: id, status: 'queued', deliveryId: `whd_${Math.random().toString(36).slice(2, 8)}` };
    });
    setResults(simulated);
    setSending(false);
    toast.success(`Dispatched to ${simulated.filter(r => r.status === 'queued').length} agencies`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-2xl w-full overflow-y-auto p-0">
        <SheetHeader className="px-6 pt-6 pb-3 border-b">
          <SheetTitle>Dispatch shift to agencies</SheetTitle>
          <SheetDescription>
            Select one or more partner agencies, preview the exact payload that will be POSTed, then send.
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 py-4 space-y-5">
          {/* Shift summary */}
          <Card className="p-4 bg-muted/30">
            <div className="text-xs text-muted-foreground mb-1 font-mono">{shift.shiftRequestId}</div>
            <div className="font-semibold text-sm">{shift.clientName}</div>
            <div className="text-xs text-muted-foreground">{shift.locationAddress}</div>
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
              <Badge variant="secondary">{shift.date}</Badge>
              <Badge variant="secondary">{shift.startTime} – {shift.endTime}</Badge>
              <Badge variant="secondary">{shift.totalPositions} positions</Badge>
              <Badge variant="secondary">{shift.requirements[0]?.roleName}</Badge>
              <Badge variant="outline">${shift.chargeRate}/hr charge</Badge>
            </div>
          </Card>

          {/* Dispatch options */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Urgency</Label>
              <Select value={urgency} onValueChange={(v: any) => setUrgency(v)}>
                <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Fill mode</Label>
              <Select value={fillMode} onValueChange={(v: any) => setFillMode(v)}>
                <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="express">Express — auto-confirm first qualified</SelectItem>
                  <SelectItem value="managed">Managed — await my approval</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Respond-by deadline (ISO-8601)</Label>
              <Input
                value={slaDeadline}
                onChange={e => setSlaDeadline(e.target.value)}
                className="h-9 mt-1 font-mono text-xs"
              />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <Checkbox id="overfill" checked={allowOverfill} onCheckedChange={v => setAllowOverfill(!!v)} />
              <Label htmlFor="overfill" className="text-xs cursor-pointer">
                Allow multiple agencies to fill seats (first-to-confirm otherwise)
              </Label>
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Note for agencies (optional, max 500 chars)</Label>
              <Textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="Priority partners only — please respond within 2 hours."
                className="mt-1 text-xs"
              />
            </div>
          </div>

          {/* Agency picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-semibold">Select agencies</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{selected.length} selected</span>
                {selected.length > 0 && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelected([])}>Clear</Button>
                )}
              </div>
            </div>
            <div className="relative mb-2">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search agencies…"
                className="pl-8 h-9"
              />
            </div>
            <div className="border rounded-md divide-y max-h-72 overflow-y-auto">
              {filtered.map(a => {
                const isSelected = selected.includes(a.id);
                const inactive = a.status !== 'active';
                return (
                  <button
                    key={a.id}
                    onClick={() => toggle(a.id)}
                    disabled={inactive}
                    className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors ${
                      isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'
                    } ${inactive ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Checkbox checked={isSelected} disabled={inactive} className="pointer-events-none" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{a.name}</span>
                        {inactive && <Badge variant="outline" className="text-[10px] capitalize">{a.status}</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{a.coverage} · <span className="font-mono">{a.id}</span></div>
                    </div>
                    <div className="text-right text-[11px] text-muted-foreground shrink-0">
                      <div>Fill {a.fillRate}%</div>
                      <div>Rel {a.reliability}%</div>
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">No agencies match "{search}".</div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div>
            <Label className="text-xs font-semibold">Preview payload</Label>
            <Tabs defaultValue="request" className="mt-1">
              <TabsList className="h-8">
                <TabsTrigger value="request" className="text-xs h-7">Dispatch request</TabsTrigger>
                <TabsTrigger value="webhook" className="text-xs h-7">Webhook to each agency</TabsTrigger>
                <TabsTrigger value="curl" className="text-xs h-7">cURL</TabsTrigger>
              </TabsList>
              <TabsContent value="request" className="mt-2">
                <div className="rounded-md border bg-slate-950 text-slate-50 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 bg-slate-900">
                    <span className="text-[11px] font-mono text-slate-400">POST /v1/shift-requests/{shift.shiftRequestId}/dispatch</span>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-slate-300 hover:text-slate-50" onClick={() => copy(requestJson, 'Request body')}>
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                  </div>
                  <pre className="text-[11px] p-3 overflow-auto max-h-72 leading-relaxed"><code>{requestJson}</code></pre>
                </div>
              </TabsContent>
              <TabsContent value="webhook" className="mt-2">
                <div className="rounded-md border bg-slate-950 text-slate-50 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 bg-slate-900">
                    <span className="text-[11px] font-mono text-slate-400">POST {'{agency.webhookUrl}'}  ·  X-RosteredAI-Event: shift.broadcast</span>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-slate-300 hover:text-slate-50" onClick={() => copy(webhookJson, 'Webhook payload')}>
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                  </div>
                  <pre className="text-[11px] p-3 overflow-auto max-h-72 leading-relaxed"><code>{webhookJson}</code></pre>
                </div>
              </TabsContent>
              <TabsContent value="curl" className="mt-2">
                <div className="rounded-md border bg-slate-950 text-slate-50 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 bg-slate-900">
                    <span className="text-[11px] font-mono text-slate-400">cURL</span>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-slate-300 hover:text-slate-50" onClick={() => copy(curlCmd, 'cURL command')}>
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                  </div>
                  <pre className="text-[11px] p-3 overflow-auto max-h-72 leading-relaxed"><code>{curlCmd}</code></pre>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Results */}
          {results && (
            <div className="rounded-md border bg-muted/30 p-3 space-y-2">
              <div className="text-xs font-semibold">Dispatch results</div>
              {results.map(r => {
                const a = agencies.find(x => x.id === r.agencyId);
                const isOk = r.status === 'queued' || r.status === 'delivered';
                return (
                  <div key={r.agencyId} className="flex items-center justify-between text-xs">
                    <span className="truncate">{a?.name ?? r.agencyId}</span>
                    <Badge variant={isOk ? 'default' : 'destructive'} className="text-[10px]">
                      {isOk && <Check className="h-3 w-3 mr-1" />}
                      {r.status}{r.reason ? ` · ${r.reason}` : ''}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-card sticky bottom-0 flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            {selected.length === 0 ? 'Select at least one agency to dispatch.' : `Dispatching to ${selected.length} ${selected.length === 1 ? 'agency' : 'agencies'}`}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSend} disabled={selected.length === 0 || sending}>
              <Send className="h-4 w-4 mr-1.5" />
              {sending ? 'Dispatching…' : 'Dispatch now'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DispatchShiftToAgenciesDialog;
