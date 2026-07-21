import { useState, useSyncExternalStore } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { CalendarClock, Clock, ArrowLeftRight, ScrollText, Sparkles, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
import {
  LeaveStore, subscribeLeave, getLeaveSnapshot, deriveShiftTag,
  type LeaveKind, type ShiftContext,
} from '@/lib/leaveAccrualEngine';

function useLeaveSnapshot() {
  return useSyncExternalStore(subscribeLeave, getLeaveSnapshot, getLeaveSnapshot);
}

const KIND_META: Record<LeaveKind, { label: string; hue: string; blurb: string }> = {
  RDO:  { label: 'RDO — Rostered Day Off', hue: 'bg-blue-50 text-blue-700 border-blue-200', blurb: 'Fixed cyclical day off funded by working slightly longer than the ordinary week.' },
  ADO:  { label: 'ADO — Accrued Day Off',  hue: 'bg-emerald-50 text-emerald-700 border-emerald-200', blurb: 'Time banked per ordinary hour worked, drawn down as full days when balance reaches a block.' },
  TOIL: { label: 'TOIL — Time Off In Lieu', hue: 'bg-violet-50 text-violet-700 border-violet-200', blurb: 'Overtime converted to leave (time-for-time or penalty-equivalent), instead of being paid out.' },
};

export default function LeaveAccrualsHub() {
  const snap = useLeaveSnapshot();

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-x-hidden">
        <div className="max-w-[1400px] mx-auto p-6 space-y-6">
          <header className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Full end-to-end slice
            </div>
            <h1 className="text-2xl font-semibold tracking-tight" style={{ letterSpacing: '-0.025em' }}>
              RDO · ADO · TOIL management
            </h1>
            <p className="text-sm text-muted-foreground max-w-3xl">
              Configure how rostered, accrued, and lieu days are earned and consumed across your awards, locations,
              and staff — and preview how the roster editor tags shifts based on that configuration.
            </p>
          </header>

          <div className="grid gap-3 md:grid-cols-3">
            {(['RDO', 'ADO', 'TOIL'] as LeaveKind[]).map(k => (
              <Card key={k} className="border">
                <CardHeader className="pb-2">
                  <Badge variant="outline" className={`w-fit ${KIND_META[k].hue}`}>{KIND_META[k].label}</Badge>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{KIND_META[k].blurb}</CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="config" className="w-full">
            <TabsList>
              <TabsTrigger value="config"><CalendarClock className="h-4 w-4 mr-1.5" />Configuration</TabsTrigger>
              <TabsTrigger value="ledger"><ScrollText className="h-4 w-4 mr-1.5" />Ledger</TabsTrigger>
              <TabsTrigger value="tagging"><ArrowLeftRight className="h-4 w-4 mr-1.5" />Roster tagging</TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="space-y-6 mt-4">
              <ConfigurationTab snap={snap} />
            </TabsContent>

            <TabsContent value="ledger" className="mt-4">
              <LedgerTab snap={snap} />
            </TabsContent>

            <TabsContent value="tagging" className="mt-4">
              <RosterTaggingTab snap={snap} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

// ---------- Configuration tab ----------

function ConfigurationTab({ snap }: { snap: ReturnType<typeof useLeaveSnapshot> }) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Layer 1 · Award rules</CardTitle>
          <CardDescription>Baseline accrual mechanics inherited by every location. Edits here apply plan-wide.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {snap.awards.map(a => (
            <div key={a.awardCode} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{a.awardName}</div>
                  <div className="text-xs text-muted-foreground">{a.awardCode}</div>
                </div>
                <div className="flex gap-1.5">
                  {a.rdo && <Badge variant="outline" className={KIND_META.RDO.hue}>RDO</Badge>}
                  {a.ado && <Badge variant="outline" className={KIND_META.ADO.hue}>ADO</Badge>}
                  {a.toil?.enabled && <Badge variant="outline" className={KIND_META.TOIL.hue}>TOIL</Badge>}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {a.rdo && (
                  <FieldGroup title="RDO">
                    <Field label="Cycle (weeks)" value={a.rdo.cycleWeeks}
                      onChange={(v) => LeaveStore.updateAward(a.awardCode, { rdo: { ...a.rdo!, cycleWeeks: Number(v) } })} />
                    <Field label="Hours per cycle" value={a.rdo.hoursPerCycle}
                      onChange={(v) => LeaveStore.updateAward(a.awardCode, { rdo: { ...a.rdo!, hoursPerCycle: Number(v) } })} />
                  </FieldGroup>
                )}
                {a.ado && (
                  <FieldGroup title="ADO">
                    <Field label="Max balance (h)" value={a.ado.maxBalanceHours}
                      onChange={(v) => LeaveStore.updateAward(a.awardCode, { ado: { ...a.ado!, maxBalanceHours: Number(v) } })} />
                    <Field label="Min block (h)" value={a.ado.minBlockHours}
                      onChange={(v) => LeaveStore.updateAward(a.awardCode, { ado: { ...a.ado!, minBlockHours: Number(v) } })} />
                  </FieldGroup>
                )}
                {a.toil && (
                  <FieldGroup title="TOIL">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Enabled</Label>
                      <Switch checked={a.toil.enabled}
                        onCheckedChange={(c) => LeaveStore.updateAward(a.awardCode, { toil: { ...a.toil!, enabled: c } })} />
                    </div>
                    <Field label="Expiry (days)" value={a.toil.expiryDays}
                      onChange={(v) => LeaveStore.updateAward(a.awardCode, { toil: { ...a.toil!, expiryDays: Number(v) } })} />
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Pre-approval</Label>
                      <Switch checked={a.toil.requiresPreApproval}
                        onCheckedChange={(c) => LeaveStore.updateAward(a.awardCode, { toil: { ...a.toil!, requiresPreApproval: c } })} />
                    </div>
                  </FieldGroup>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Layer 2 · Location policies</CardTitle>
          <CardDescription>Operational defaults per location. Overrides tighten but never loosen the award floor.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>RDO strategy</TableHead>
                <TableHead>ADO on hire</TableHead>
                <TableHead>TOIL cap (h)</TableHead>
                <TableHead>Notice (days)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snap.locations.map(l => (
                <TableRow key={l.locationId}>
                  <TableCell className="font-medium">{l.locationName}</TableCell>
                  <TableCell>
                    <Select value={l.rdoStrategy} onValueChange={(v) => LeaveStore.updateLocation(l.locationId, { rdoStrategy: v as typeof l.rdoStrategy })}>
                      <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed_day">Fixed day of month</SelectItem>
                        <SelectItem value="rolling">Rolling schedule</SelectItem>
                        <SelectItem value="staff_choice">Staff choice</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Switch checked={l.adoOfferedOnHire}
                      onCheckedChange={(c) => LeaveStore.updateLocation(l.locationId, { adoOfferedOnHire: c })} />
                  </TableCell>
                  <TableCell>
                    <Input type="number" value={l.toilCap} className="h-8 w-24"
                      onChange={(e) => LeaveStore.updateLocation(l.locationId, { toilCap: Number(e.target.value) })} />
                  </TableCell>
                  <TableCell>
                    <Input type="number" value={l.minNoticeDaysToTake} className="h-8 w-20"
                      onChange={(e) => LeaveStore.updateLocation(l.locationId, { minNoticeDaysToTake: Number(e.target.value) })} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Layer 3 · Staff opt-ins & balances</CardTitle>
          <CardDescription>Per-employee enrolment. Balances shown are live from the ledger.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                {(['RDO', 'ADO', 'TOIL'] as LeaveKind[]).map(k => (
                  <TableHead key={k} className="text-center">{k}</TableHead>
                ))}
                <TableHead className="text-right">Balance (h)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {snap.staff.map(s => (
                <TableRow key={s.staffId}>
                  <TableCell className="font-medium">{s.staffName}</TableCell>
                  {(['RDO', 'ADO', 'TOIL'] as LeaveKind[]).map(k => (
                    <TableCell key={k} className="text-center">
                      <Switch checked={s.optedIn[k]}
                        onCheckedChange={(c) => LeaveStore.updateStaffConfig(s.staffId, { optedIn: { ...s.optedIn, [k]: c } })} />
                    </TableCell>
                  ))}
                  <TableCell className="text-right text-xs text-muted-foreground">
                    RDO {s.balanceHours.RDO.toFixed(1)} · ADO {s.balanceHours.ADO.toFixed(1)} · TOIL {s.balanceHours.TOIL.toFixed(1)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 rounded-md bg-muted/40 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}
function Field({ label, value, onChange }: { label: string; value: number; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-xs">{label}</Label>
      <Input type="number" step="0.01" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-24" />
    </div>
  );
}

// ---------- Ledger tab ----------

function LedgerTab({ snap }: { snap: ReturnType<typeof useLeaveSnapshot> }) {
  const [filterStaff, setFilterStaff] = useState<string>('all');
  const [filterKind, setFilterKind] = useState<string>('all');
  const rows = snap.ledger.filter(e =>
    (filterStaff === 'all' || e.staffId === filterStaff) &&
    (filterKind === 'all' || e.kind === filterKind),
  );
  const nameOf = (id: string) => snap.staff.find(s => s.staffId === id)?.staffName ?? id;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base">Accrual ledger</CardTitle>
          <CardDescription>Every accrual, consumption, adjustment, expiry, and payout event.</CardDescription>
        </div>
        <div className="flex gap-2">
          <Select value={filterStaff} onValueChange={setFilterStaff}>
            <SelectTrigger className="h-8 w-40"><SelectValue placeholder="Staff" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All staff</SelectItem>
              {snap.staff.map(s => <SelectItem key={s.staffId} value={s.staffId}>{s.staffName}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterKind} onValueChange={setFilterKind}>
            <SelectTrigger className="h-8 w-32"><SelectValue placeholder="Kind" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All kinds</SelectItem>
              <SelectItem value="RDO">RDO</SelectItem>
              <SelectItem value="ADO">ADO</SelectItem>
              <SelectItem value="TOIL">TOIL</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Staff</TableHead>
              <TableHead>Kind</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Hours</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(e => (
              <TableRow key={e.id}>
                <TableCell className="text-xs">{e.occurredOn}</TableCell>
                <TableCell className="text-sm">{nameOf(e.staffId)}</TableCell>
                <TableCell><Badge variant="outline" className={KIND_META[e.kind].hue}>{e.kind}</Badge></TableCell>
                <TableCell className="text-xs capitalize">{e.type}</TableCell>
                <TableCell className={`text-right font-mono text-sm ${e.hours >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {e.hours > 0 ? '+' : ''}{e.hours.toFixed(2)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{e.sourceShiftId ?? '—'}</TableCell>
                <TableCell className="text-xs">{e.note}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">No ledger entries match.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ---------- Roster tagging demo ----------

function RosterTaggingTab({ snap }: { snap: ReturnType<typeof useLeaveSnapshot> }) {
  const [staffId, setStaffId] = useState(snap.staff[0]?.staffId ?? '');
  const [awardCode, setAwardCode] = useState(snap.awards[0]?.awardCode ?? '');
  const [locationId, setLocationId] = useState(snap.locations[0]?.locationId ?? '');
  const [ctx, setCtx] = useState<ShiftContext>({
    staffId: snap.staff[0]?.staffId ?? '',
    date: new Date().toISOString().slice(0, 10),
    scheduledHours: 8,
    actualHours: 10,
    isOvertime: true,
    isPublicHoliday: false,
    manualTag: 'NONE',
  });

  const award   = snap.awards.find(a => a.awardCode === awardCode);
  const staff   = snap.staff.find(s => s.staffId === staffId);
  const loc     = snap.locations.find(l => l.locationId === locationId);
  const derived = deriveShiftTag({ ...ctx, staffId }, award, loc, staff);

  const commit = () => {
    if (!derived.tag) { toast.info('No tag to post — this shift accrues nothing.'); return; }
    LeaveStore.postLedger({
      staffId, kind: derived.tag, type: 'accrual',
      hours: derived.autoAccrualHours, occurredOn: ctx.date,
      sourceShiftId: `demo-${Date.now()}`,
      note: derived.reason,
    });
    toast.success(`Posted ${derived.autoAccrualHours.toFixed(2)}h ${derived.tag} for ${staff?.staffName}`);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Simulated shift context</CardTitle>
          <CardDescription>Set the inputs the roster editor would have when a shift is saved.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Staff</Label>
              <Select value={staffId} onValueChange={setStaffId}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{snap.staff.map(s => <SelectItem key={s.staffId} value={s.staffId}>{s.staffName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Award</Label>
              <Select value={awardCode} onValueChange={setAwardCode}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{snap.awards.map(a => <SelectItem key={a.awardCode} value={a.awardCode}>{a.awardName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Location</Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{snap.locations.map(l => <SelectItem key={l.locationId} value={l.locationId}>{l.locationName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={ctx.date} onChange={(e) => setCtx({ ...ctx, date: e.target.value })} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Scheduled hours</Label>
              <Input type="number" step="0.25" value={ctx.scheduledHours} onChange={(e) => setCtx({ ...ctx, scheduledHours: Number(e.target.value) })} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Actual hours</Label>
              <Input type="number" step="0.25" value={ctx.actualHours} onChange={(e) => setCtx({ ...ctx, actualHours: Number(e.target.value) })} className="h-9" />
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label className="text-xs">Overtime</Label>
            <Switch checked={!!ctx.isOvertime} onCheckedChange={(c) => setCtx({ ...ctx, isOvertime: c })} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Public holiday</Label>
            <Switch checked={!!ctx.isPublicHoliday} onCheckedChange={(c) => setCtx({ ...ctx, isPublicHoliday: c })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Manual tag override</Label>
            <Select value={ctx.manualTag ?? 'NONE'} onValueChange={(v) => setCtx({ ...ctx, manualTag: v as ShiftContext['manualTag'] })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Auto (derive from context)</SelectItem>
                <SelectItem value="RDO">Force RDO</SelectItem>
                <SelectItem value="ADO">Force ADO</SelectItem>
                <SelectItem value="TOIL">Force TOIL</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" /> Derived tag
          </CardTitle>
          <CardDescription>What the roster editor would attach to this shift and post to the ledger.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
            <div className="flex items-center gap-2">
              {derived.tag
                ? <Badge className={KIND_META[derived.tag].hue} variant="outline">{derived.tag}</Badge>
                : <Badge variant="outline">No tag</Badge>}
              {derived.requiresApproval && <Badge variant="destructive">Requires approval</Badge>}
            </div>
            <div className="text-sm">{derived.reason}</div>
            <div className="text-xs text-muted-foreground">
              Ledger impact: <span className="font-mono">{derived.autoAccrualHours >= 0 ? '+' : ''}{derived.autoAccrualHours.toFixed(2)}h</span>
            </div>
          </div>

          <Button onClick={commit} className="w-full">
            Post to ledger <ArrowRight className="h-4 w-4 ml-2" />
          </Button>

          {staff && (
            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
              <div className="font-medium text-foreground">Current balance — {staff.staffName}</div>
              <div>RDO {staff.balanceHours.RDO.toFixed(2)}h · ADO {staff.balanceHours.ADO.toFixed(2)}h · TOIL {staff.balanceHours.TOIL.toFixed(2)}h</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
