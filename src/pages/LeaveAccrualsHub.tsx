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
  LeaveStore, subscribeLeave, getLeaveSnapshot, deriveShiftTag, DEFAULT_SHORTFALL,
  approveToilCashout, rejectToilCashout, markCashoutPaid,
  type LeaveKind, type ShiftContext, type ToilCashoutBasis, type ShortfallTreatment,
} from '@/lib/leaveAccrualEngine';


export function useLeaveSnapshot() {
  return useSyncExternalStore(subscribeLeave, getLeaveSnapshot, getLeaveSnapshot);
}

/** Award-focused view: Layer 1 award rules + Layer 2 location policies. For embedding in Award Settings. */
export function LeaveAccrualsAwardSection() {
  const snap = useLeaveSnapshot();
  return (
    <div className="space-y-6">
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
      <ConfigurationTab snap={snap} />
    </div>
  );
}

/** Workforce-focused view: Layer 3 staff opt-ins/balances + ledger. For embedding in Workforce. */
export function LeaveAccrualsWorkforceSection() {
  const snap = useLeaveSnapshot();
  return (
    <Tabs defaultValue="staff" className="w-full">
      <TabsList>
        <TabsTrigger value="staff"><CalendarClock className="h-4 w-4 mr-1.5" />Staff opt-ins & balances</TabsTrigger>
        <TabsTrigger value="ledger"><ScrollText className="h-4 w-4 mr-1.5" />Ledger</TabsTrigger>
        <TabsTrigger value="tagging"><ArrowLeftRight className="h-4 w-4 mr-1.5" />Roster tagging</TabsTrigger>
      </TabsList>
      <TabsContent value="staff" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Staff opt-ins & balances</CardTitle>
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
      </TabsContent>
      <TabsContent value="ledger" className="mt-4"><LedgerTab snap={snap} /></TabsContent>
      <TabsContent value="tagging" className="mt-4"><RosterTaggingTab snap={snap} /></TabsContent>
    </Tabs>
  );
}

const KIND_META: Record<LeaveKind, { label: string; hue: string; blurb: string }> = {
  RDO:  { label: 'RDO — Rostered Day Off', hue: 'bg-blue-50 text-blue-700 border-blue-200', blurb: 'A fixed day off each roster cycle, accrued by working additional time on ordinary days (e.g. a 38-hour week worked over 19 days).' },
  ADO:  { label: 'ADO — Accrued Day Off',  hue: 'bg-emerald-50 text-emerald-700 border-emerald-200', blurb: 'Time accrued for each ordinary hour worked, taken as a full day once the minimum block balance is reached.' },
  TOIL: { label: 'TOIL — Time Off in Lieu', hue: 'bg-violet-50 text-violet-700 border-violet-200', blurb: 'Overtime hours banked as paid time off instead of an overtime payment, taken at the rate prescribed by the award (time-for-time or penalty-equivalent).' },
};

export default function LeaveAccrualsHub() {
  const snap = useLeaveSnapshot();

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-x-hidden">
        <div className="max-w-[1400px] mx-auto p-6 space-y-6">
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight" style={{ letterSpacing: '-0.025em' }}>
              Flexibility &amp; Accrued Leave (RDO · ADO · TOIL)
            </h1>
            <p className="text-sm text-muted-foreground max-w-3xl">
              Configure how Rostered Days Off, Accrued Days Off and Time Off in Lieu are accrued, taken and paid out.
              Settings apply at three levels: award defaults, location policies, and individual staff enrolment.
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
              <TabsTrigger value="cashouts"><Sparkles className="h-4 w-4 mr-1.5" />TOIL payouts</TabsTrigger>
              <TabsTrigger value="ledger"><ScrollText className="h-4 w-4 mr-1.5" />Ledger</TabsTrigger>
              <TabsTrigger value="tagging"><ArrowLeftRight className="h-4 w-4 mr-1.5" />Roster tagging</TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="space-y-6 mt-4">
              <ConfigurationTab snap={snap} />
            </TabsContent>

            <TabsContent value="cashouts" className="mt-4">
              <CashoutsTab snap={snap} />
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
          <CardTitle className="text-base">Award rules (organisation defaults)</CardTitle>
          <CardDescription>Baseline accrual mechanics for each award. Every location inherits these settings unless a location policy narrows them.</CardDescription>
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

              {a.toil?.enabled && (
                <div className="rounded-md border bg-muted/20 p-3 space-y-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">TOIL payout (cashing out)</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Controls how banked TOIL hours are valued when an employee is paid out instead of taking the time off.
                      Because TOIL may have been banked at an earlier base rate, choose the rate that applies at payment.
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Permit TOIL payout</Label>
                        <Switch checked={a.toil.cashoutEnabled ?? false}
                          onCheckedChange={(c) => LeaveStore.updateAward(a.awardCode, { toil: { ...a.toil!, cashoutEnabled: c } })} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Requires manager approval</Label>
                        <Switch checked={a.toil.cashoutRequiresApproval ?? true}
                          onCheckedChange={(c) => LeaveStore.updateAward(a.awardCode, { toil: { ...a.toil!, cashoutRequiresApproval: c } })} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Include overtime penalty in payout</Label>
                        <Switch checked={a.toil.cashoutIncludesPenalty ?? true}
                          onCheckedChange={(c) => LeaveStore.updateAward(a.awardCode, { toil: { ...a.toil!, cashoutIncludesPenalty: c } })} />
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs">Payout rate basis</Label>
                      <Select
                        value={a.toil.cashoutRateBasis ?? 'accrual_rate'}
                        onValueChange={(v) => LeaveStore.updateAward(a.awardCode, { toil: { ...a.toil!, cashoutRateBasis: v as ToilCashoutBasis } })}
                      >
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="accrual_rate">Rate at time of accrual (award default)</SelectItem>
                          <SelectItem value="current_rate">Rate at date of payment</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {(a.toil.cashoutRateBasis ?? 'accrual_rate') === 'accrual_rate'
                          ? 'Hours are paid oldest-first at the base rate (and overtime multiplier) that applied when each hour was banked.'
                          : 'All banked hours are paid at the employee’s base rate on the payment date, so later pay increases raise the payout value.'}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Minimum payout (hours)" value={a.toil.minCashoutHours ?? 0}
                          onChange={(v) => LeaveStore.updateAward(a.awardCode, { toil: { ...a.toil!, minCashoutHours: Number(v) } })} />
                        <Field label="Maximum per payout (hours)" value={a.toil.maxCashoutHoursPerRequest ?? 0}
                          onChange={(v) => LeaveStore.updateAward(a.awardCode, { toil: { ...a.toil!, maxCashoutHoursPerRequest: Number(v) } })} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-md border bg-muted/20 p-3 space-y-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Insufficient balance treatment</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    When leave is taken without sufficient accrued balance, choose how the shortfall is treated:
                    record the shortfall as unpaid leave (leave without pay), or allow the balance to go negative
                    (leave in advance), to be offset against future accruals.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {(['RDO', 'ADO', 'TOIL'] as LeaveKind[]).map(k => {
                    const sf = a.shortfall ?? DEFAULT_SHORTFALL;
                    return (
                      <div key={k} className="space-y-2 rounded-md bg-background p-3 border">
                        <Badge variant="outline" className={`w-fit ${KIND_META[k].hue}`}>{k}</Badge>
                        <Select
                          value={sf.treatment[k]}
                          onValueChange={(v) => LeaveStore.updateAward(a.awardCode, {
                            shortfall: { ...sf, treatment: { ...sf.treatment, [k]: v as ShortfallTreatment } },
                          })}
                        >
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="leave_without_pay">Leave without pay (default)</SelectItem>
                            <SelectItem value="allow_negative">Leave in advance (negative balance)</SelectItem>
                          </SelectContent>
                        </Select>
                        {sf.treatment[k] === 'allow_negative' && (
                          <Field label="Maximum negative balance (hours)" value={sf.maxNegativeHours[k] ?? 0}
                            onChange={(v) => LeaveStore.updateAward(a.awardCode, {
                              shortfall: { ...sf, maxNegativeHours: { ...sf.maxNegativeHours, [k]: Number(v) } },
                            })} />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Leave in advance requires manager approval</Label>
                  <Switch
                    checked={(a.shortfall ?? DEFAULT_SHORTFALL).requiresApprovalToGoNegative}
                    onCheckedChange={(c) => LeaveStore.updateAward(a.awardCode, {
                      shortfall: { ...(a.shortfall ?? DEFAULT_SHORTFALL), requiresApprovalToGoNegative: c },
                    })}
                  />
                </div>
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
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const rows = snap.ledger.filter(e =>
    (filterStaff === 'all' || e.staffId === filterStaff) &&
    (filterKind === 'all' || e.kind === filterKind) &&
    (!fromDate || e.occurredOn >= fromDate) &&
    (!toDate || e.occurredOn <= toDate),
  );
  const nameOf = (id: string) => snap.staff.find(s => s.staffId === id)?.staffName ?? id;

  const exportCsv = () => {
    const header = ['Date','Staff','Kind','Type','Hours','Source','Note'];
    const body = rows.map(e => [
      e.occurredOn, nameOf(e.staffId), e.kind, e.type,
      e.hours.toFixed(2), e.sourceShiftId ?? '', (e.note ?? '').replace(/"/g, '""'),
    ]);
    const csv = [header, ...body].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `leave-ledger-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} entries`);
  };

  const exportPdf = async () => {
    const { default: jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF();
    doc.setFontSize(14); doc.text('Leave Accrual Ledger', 14, 16);
    doc.setFontSize(9); doc.setTextColor(120);
    doc.text(`Generated ${new Date().toLocaleString()} • ${rows.length} entries`, 14, 22);
    if (fromDate || toDate) doc.text(`Period: ${fromDate || '…'} → ${toDate || '…'}`, 14, 27);
    autoTable(doc, {
      startY: 32,
      head: [['Date','Staff','Kind','Type','Hours','Source','Note']],
      body: rows.map(e => [
        e.occurredOn, nameOf(e.staffId), e.kind, e.type,
        `${e.hours >= 0 ? '+' : ''}${e.hours.toFixed(2)}`,
        e.sourceShiftId ?? '—', e.note ?? '',
      ]),
      styles: { fontSize: 8 },
    });
    doc.save(`leave-ledger-${new Date().toISOString().slice(0,10)}.pdf`);
    toast.success('PDF downloaded');
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 flex-wrap">
        <div>
          <CardTitle className="text-base">Accrual ledger</CardTitle>
          <CardDescription>Every accrual, consumption, adjustment, expiry, and payout event.</CardDescription>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Input type="date" className="h-8 w-36" value={fromDate} onChange={e => setFromDate(e.target.value)} placeholder="From" />
          <span className="text-xs text-muted-foreground">→</span>
          <Input type="date" className="h-8 w-36" value={toDate} onChange={e => setToDate(e.target.value)} placeholder="To" />
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
          <Button size="sm" variant="outline" onClick={exportCsv}>Export CSV</Button>
          <Button size="sm" onClick={exportPdf}>Export PDF</Button>
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

// ---------- TOIL cash-outs tab ----------

const CASHOUT_BADGE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

function CashoutsTab({ snap }: { snap: ReturnType<typeof useLeaveSnapshot> }) {
  const requests = snap.cashouts ?? [];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">TOIL cash-out requests</CardTitle>
        <CardDescription>
          Employees request a cash-out from their portal. On approval the hours leave the TOIL balance and the amount is
          released to the next timesheet/pay run as a <span className="font-mono text-xs">TOIL_CASHOUT</span> earnings line.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">No cash-out requests yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead>Basis</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.staffName}</TableCell>
                  <TableCell className="text-muted-foreground">{r.requestedOn}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.hours.toFixed(2)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.basis === 'current_rate' ? 'Current rate' : 'Original accrual rates'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">${r.estimatedAmount.toFixed(2)}</TableCell>
                  <TableCell><Badge variant="outline" className={CASHOUT_BADGE[r.status]}>{r.status}</Badge></TableCell>
                  <TableCell className="text-right space-x-1.5">
                    {r.status === 'pending' && (
                      <>
                        <Button size="sm" className="h-7" onClick={() => { approveToilCashout(r.id); toast.success('Cash-out approved'); }}>Approve</Button>
                        <Button size="sm" variant="outline" className="h-7" onClick={() => { rejectToilCashout(r.id, 'Declined by manager'); toast('Cash-out rejected'); }}>Reject</Button>
                      </>
                    )}
                    {r.status === 'approved' && (
                      <Button size="sm" variant="outline" className="h-7"
                        onClick={() => { markCashoutPaid(r.id, new Date().toISOString().slice(0, 7)); toast.success('Marked as paid'); }}>
                        Mark paid
                      </Button>
                    )}
                    {r.status === 'paid' && <span className="text-xs text-muted-foreground">{r.paidInPeriod}</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
