import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/mui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Clock, QrCode, MapPin, KeyRound, Monitor, UserCheck, CheckCircle2, AlertTriangle, Send, XCircle, Timer, FileSpreadsheet,
} from 'lucide-react';
import {
  generateMockReconciliations,
  approveReconciliation,
  rejectReconciliation,
  pushToTimesheet,
  createClockEvent,
  reconcile,
  DEFAULT_RECONCILIATION_SETTINGS,
} from '@/lib/attendanceReconciliationService';
import {
  AttendanceReconciliation,
  ClockMethod,
  DiscrepancyType,
} from '@/types/agencyCompliance';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

const discrepancyLabels: Record<DiscrepancyType, string> = {
  late_start: 'Late start',
  early_finish: 'Early finish',
  late_finish: 'Late finish',
  early_start: 'Early start',
  no_show: 'No-show',
  partial_shift: 'Partial shift',
  outside_geofence: 'Outside geofence',
  missing_clock_out: 'Missing clock-out',
  over_break: 'Over break',
};

const methodIcon: Record<ClockMethod, typeof QrCode> = {
  qr_code: QrCode,
  geofence: MapPin,
  pin: KeyRound,
  kiosk: Monitor,
  manual: UserCheck,
  supervisor: UserCheck,
};

export function AttendanceReconciliationPanel() {
  const [records, setRecords] = useState<AttendanceReconciliation[]>(() => generateMockReconciliations());
  const [tab, setTab] = useState<'pending' | 'approved' | 'pushed'>('pending');
  const [reviewDialog, setReviewDialog] = useState<AttendanceReconciliation | null>(null);
  const [reviewForm, setReviewForm] = useState<{ hoursPayable: string; notes: string }>({ hoursPayable: '', notes: '' });
  const [clockDialog, setClockDialog] = useState<AttendanceReconciliation | null>(null);
  const [clockForm, setClockForm] = useState<{ method: ClockMethod; time: string; type: 'clock_in' | 'clock_out'; geofenceMatched: boolean; notes: string }>({ method: 'qr_code', time: '', type: 'clock_in', geofenceMatched: true, notes: '' });

  const kpis = useMemo(() => ({
    pending: records.filter(r => r.status === 'pending').length,
    autoMatched: records.filter(r => r.status === 'auto_matched').length,
    approved: records.filter(r => r.status === 'supervisor_approved').length,
    pushed: records.filter(r => r.status === 'pushed_to_timesheet').length,
    noShows: records.filter(r => r.discrepancies.includes('no_show')).length,
  }), [records]);

  const filtered = useMemo(() => {
    if (tab === 'pending') return records.filter(r => r.status === 'pending' || r.status === 'auto_matched' || r.status === 'disputed');
    if (tab === 'approved') return records.filter(r => r.status === 'supervisor_approved' || r.status === 'rejected');
    return records.filter(r => r.status === 'pushed_to_timesheet');
  }, [records, tab]);

  const openReview = (r: AttendanceReconciliation) => {
    setReviewForm({ hoursPayable: String(r.hoursPayable), notes: '' });
    setReviewDialog(r);
  };

  const submitApprove = async () => {
    if (!reviewDialog) return;
    const hp = parseFloat(reviewForm.hoursPayable);
    const updated = approveReconciliation(reviewDialog, 'Centre Supervisor', isNaN(hp) ? undefined : hp, reviewForm.notes || undefined);
    setRecords(prev => prev.map(x => x.id === updated.id ? updated : x));
    setReviewDialog(null);
    toast.success('Reconciliation approved');

    if (DEFAULT_RECONCILIATION_SETTINGS.autoPushToTimesheetOnApproval) {
      try {
        const pushed = await pushToTimesheet(updated);
        setRecords(prev => prev.map(x => x.id === pushed.id ? pushed : x));
        toast.success('Pushed to timesheet');
      } catch (e) {
        toast.error('Could not push to timesheet');
      }
    }
  };

  const submitReject = () => {
    if (!reviewDialog) return;
    const updated = rejectReconciliation(reviewDialog, 'Centre Supervisor', reviewForm.notes || 'Rejected');
    setRecords(prev => prev.map(x => x.id === updated.id ? updated : x));
    setReviewDialog(null);
  };

  const handlePush = async (r: AttendanceReconciliation) => {
    try {
      const pushed = await pushToTimesheet(r);
      setRecords(prev => prev.map(x => x.id === pushed.id ? pushed : x));
      toast.success('Pushed to timesheet');
    } catch {
      toast.error('Push failed');
    }
  };

  const openClock = (r: AttendanceReconciliation) => {
    setClockForm({ method: 'qr_code', time: new Date().toISOString().slice(0, 16), type: r.actualStart ? 'clock_out' : 'clock_in', geofenceMatched: true, notes: '' });
    setClockDialog(r);
  };

  const submitClock = () => {
    if (!clockDialog || !clockForm.time) return;
    const ts = new Date(clockForm.time).toISOString();
    const event = createClockEvent({
      placementId: clockDialog.placementId,
      candidateId: clockDialog.candidateId,
      type: clockForm.type,
      method: clockForm.method,
      timestamp: ts,
      geofenceMatched: clockForm.geofenceMatched,
      notes: clockForm.notes,
      isManualOverride: clockForm.method === 'manual' || clockForm.method === 'supervisor',
    });
    setRecords(prev => prev.map(r => {
      if (r.id !== clockDialog.id) return r;
      const updated: AttendanceReconciliation = {
        ...r,
        clockEvents: [...r.clockEvents, event],
        actualStart: clockForm.type === 'clock_in' ? ts : r.actualStart,
        actualEnd: clockForm.type === 'clock_out' ? ts : r.actualEnd,
      };
      return reconcile(updated);
    }));
    setClockDialog(null);
    toast.success(`${clockForm.type === 'clock_in' ? 'Clock-in' : 'Clock-out'} recorded`);
  };

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        <KPI title="Pending Review" value={kpis.pending} icon={Clock} tone="amber" />
        <KPI title="Auto-Matched" value={kpis.autoMatched} icon={CheckCircle2} tone="emerald" />
        <KPI title="Approved" value={kpis.approved} icon={UserCheck} tone="blue" />
        <KPI title="In Timesheet" value={kpis.pushed} icon={FileSpreadsheet} tone="emerald" />
        <KPI title="No-Shows" value={kpis.noShows} icon={AlertTriangle} tone="red" />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="pending">Pending / Auto-matched</TabsTrigger>
          <TabsTrigger value="approved">Approved / Rejected</TabsTrigger>
          <TabsTrigger value="pushed">Pushed to Timesheet</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="bg-background border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-[11px] font-semibold">Candidate</TableHead>
              <TableHead className="text-[11px] font-semibold">Shift</TableHead>
              <TableHead className="text-[11px] font-semibold">Scheduled</TableHead>
              <TableHead className="text-[11px] font-semibold">Actual</TableHead>
              <TableHead className="text-[11px] font-semibold">Δ Start / End</TableHead>
              <TableHead className="text-[11px] font-semibold">Hours</TableHead>
              <TableHead className="text-[11px] font-semibold">Discrepancies</TableHead>
              <TableHead className="text-[11px] font-semibold">Clock Method</TableHead>
              <TableHead className="text-[11px] font-semibold">Status</TableHead>
              <TableHead className="text-[11px] font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={10} className="text-center text-sm text-muted-foreground py-8">No records in this view</TableCell></TableRow>
            )}
            {filtered.map(r => {
              const firstClock = r.clockEvents[0];
              const MethodIcon = firstClock ? methodIcon[firstClock.method] : Timer;
              return (
                <TableRow key={r.id} className="hover:bg-muted/20 align-top">
                  <TableCell className="text-[13px] font-medium">{r.candidateName}</TableCell>
                  <TableCell className="text-[12px]">{format(new Date(r.shiftDate), 'EEE d MMM')}</TableCell>
                  <TableCell className="text-[12px]">{format(new Date(r.scheduledStart), 'h:mm a')} – {format(new Date(r.scheduledEnd), 'h:mm a')}</TableCell>
                  <TableCell className="text-[12px]">
                    {r.actualStart ? format(new Date(r.actualStart), 'h:mm a') : <span className="text-red-600">—</span>}
                    {' – '}
                    {r.actualEnd ? format(new Date(r.actualEnd), 'h:mm a') : <span className="text-amber-600">missing</span>}
                  </TableCell>
                  <TableCell className="text-[12px]">
                    <span className={cn(Math.abs(r.startDeltaMinutes) > 5 ? r.startDeltaMinutes > 0 ? 'text-red-600' : 'text-amber-600' : 'text-emerald-600')}>
                      {r.startDeltaMinutes >= 0 ? '+' : ''}{r.startDeltaMinutes}m
                    </span>
                    {' / '}
                    <span className={cn(Math.abs(r.endDeltaMinutes) > 5 ? r.endDeltaMinutes < 0 ? 'text-red-600' : 'text-amber-600' : 'text-emerald-600')}>
                      {r.endDeltaMinutes >= 0 ? '+' : ''}{r.endDeltaMinutes}m
                    </span>
                  </TableCell>
                  <TableCell className="text-[12px]">
                    <div>{r.hoursWorked}h worked</div>
                    <div className="text-[11px] text-muted-foreground">vs {r.hoursBooked}h booked</div>
                    <div className="text-[11px] font-medium text-emerald-700">{r.hoursPayable}h payable</div>
                  </TableCell>
                  <TableCell>
                    {r.discrepancies.length === 0 ? <span className="text-emerald-600 text-[11px]">None</span> : (
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {r.discrepancies.map(d => (
                          <Badge key={d} variant="outline" className="text-[10px] border-amber-200 text-amber-700 bg-amber-50">
                            {discrepancyLabels[d]}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-[12px]">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MethodIcon className="h-3.5 w-3.5" />
                      <span>{firstClock?.method.replace('_', ' ') ?? 'not clocked'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      {(r.status === 'pending' || r.status === 'auto_matched' || r.status === 'disputed') && (
                        <>
                          <Button size="small" variant="outlined" onClick={() => openClock(r)} className="h-7 text-xs" title="Record clock event">
                            <QrCode className="h-3 w-3 mr-1" /> Clock
                          </Button>
                          <Button size="small" onClick={() => openReview(r)} className="h-7 text-xs">Review</Button>
                        </>
                      )}
                      {r.status === 'supervisor_approved' && (
                        <Button size="small" onClick={() => handlePush(r)} className="h-7 text-xs">
                          <Send className="h-3 w-3 mr-1" /> Push
                        </Button>
                      )}
                      {r.status === 'pushed_to_timesheet' && (
                        <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700 bg-emerald-50">
                          TS #{r.timesheetEntryId?.slice(-6)}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4" /> Capture methods enabled</CardTitle>
          <CardDescription className="text-xs">
            QR code · Geofence ({DEFAULT_RECONCILIATION_SETTINGS.geofenceRadiusMeters}m radius) · PIN · Kiosk · Supervisor override.
            Auto-match tolerance: ±{DEFAULT_RECONCILIATION_SETTINGS.toleranceMinutesLateStart}m start / ±{DEFAULT_RECONCILIATION_SETTINGS.toleranceMinutesEarlyFinish}m finish.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Review dialog */}
      <Dialog open={!!reviewDialog} onOpenChange={(o) => !o && setReviewDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Reconciliation</DialogTitle>
            <DialogDescription>{reviewDialog?.candidateName} · {reviewDialog && format(new Date(reviewDialog.shiftDate), 'EEE d MMM')}</DialogDescription>
          </DialogHeader>
          {reviewDialog && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Scheduled" value={`${format(new Date(reviewDialog.scheduledStart), 'h:mm a')} – ${format(new Date(reviewDialog.scheduledEnd), 'h:mm a')}`} />
                <Field label="Actual" value={`${reviewDialog.actualStart ? format(new Date(reviewDialog.actualStart), 'h:mm a') : '—'} – ${reviewDialog.actualEnd ? format(new Date(reviewDialog.actualEnd), 'h:mm a') : 'missing'}`} />
                <Field label="Hours Worked" value={`${reviewDialog.hoursWorked}h`} />
                <Field label="Hours Booked" value={`${reviewDialog.hoursBooked}h`} />
              </div>
              {reviewDialog.discrepancies.length > 0 && (
                <div>
                  <Label className="text-xs">Discrepancies</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {reviewDialog.discrepancies.map(d => (
                      <Badge key={d} variant="outline" className="text-[10px] border-amber-200 text-amber-700 bg-amber-50">
                        {discrepancyLabels[d]}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <Label className="text-xs">Hours Payable (override)</Label>
                <Input type="number" step="0.25" value={reviewForm.hoursPayable} onChange={e => setReviewForm(f => ({ ...f, hoursPayable: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea value={reviewForm.notes} onChange={e => setReviewForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="text-sm" />
              </div>
              {reviewDialog.clockEvents.length > 0 && (
                <div>
                  <Label className="text-xs">Clock Events</Label>
                  <div className="border rounded-md p-2 mt-1 space-y-1">
                    {reviewDialog.clockEvents.map(e => (
                      <div key={e.id} className="text-[11px] text-muted-foreground flex items-center gap-2">
                        <Timer className="h-3 w-3" />
                        <span className="font-medium text-foreground">{e.type.replace('_', ' ')}</span>
                        <span>{format(new Date(e.timestamp), 'h:mm a')}</span>
                        <span>· {e.method}</span>
                        {e.geofenceMatched === false && <span className="text-red-600">· outside geofence</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outlined" onClick={submitReject}><XCircle className="h-3.5 w-3.5 mr-1" /> Reject</Button>
            <Button onClick={submitApprove}><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve & Push</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clock event dialog */}
      <Dialog open={!!clockDialog} onOpenChange={(o) => !o && setClockDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Clock Event</DialogTitle>
            <DialogDescription>{clockDialog?.candidateName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Type</Label>
                <select value={clockForm.type} onChange={e => setClockForm(f => ({ ...f, type: e.target.value as typeof f.type }))} className="h-9 w-full rounded-md border border-input bg-background text-sm px-2">
                  <option value="clock_in">Clock in</option>
                  <option value="clock_out">Clock out</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Method</Label>
                <select value={clockForm.method} onChange={e => setClockForm(f => ({ ...f, method: e.target.value as ClockMethod }))} className="h-9 w-full rounded-md border border-input bg-background text-sm px-2">
                  <option value="qr_code">QR Code</option>
                  <option value="geofence">Geofence</option>
                  <option value="pin">PIN</option>
                  <option value="kiosk">Kiosk</option>
                  <option value="supervisor">Supervisor override</option>
                  <option value="manual">Manual entry</option>
                </select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Time</Label>
              <Input type="datetime-local" value={clockForm.time} onChange={e => setClockForm(f => ({ ...f, time: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <input id="geo" type="checkbox" checked={clockForm.geofenceMatched} onChange={e => setClockForm(f => ({ ...f, geofenceMatched: e.target.checked }))} />
              <Label htmlFor="geo" className="text-xs">Geofence matched (within venue radius)</Label>
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={clockForm.notes} onChange={e => setClockForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outlined" onClick={() => setClockDialog(null)}>Cancel</Button>
            <Button onClick={submitClock} disabled={!clockForm.time}>Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-[13px] font-medium">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: AttendanceReconciliation['status'] }) {
  const map: Record<AttendanceReconciliation['status'], string> = {
    pending: 'border-amber-200 text-amber-700 bg-amber-50',
    auto_matched: 'border-emerald-200 text-emerald-700 bg-emerald-50',
    supervisor_approved: 'border-blue-200 text-blue-700 bg-blue-50',
    disputed: 'border-orange-200 text-orange-700 bg-orange-50',
    rejected: 'border-red-200 text-red-700 bg-red-50',
    pushed_to_timesheet: 'border-emerald-200 text-emerald-700 bg-emerald-50',
  };
  return <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border', map[status])}>{status.replace(/_/g, ' ')}</span>;
}

function KPI({ title, value, icon: Icon, tone }: { title: string; value: number | string; icon: typeof Clock; tone: 'blue' | 'emerald' | 'amber' | 'red' }) {
  const toneClass = {
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
  }[tone];
  return (
    <div className="bg-background border border-border rounded-xl p-4 flex items-start justify-between">
      <div>
        <p className="text-[13px] text-muted-foreground font-medium">{title}</p>
        <p className="text-[22px] font-bold tracking-tight mt-1">{value}</p>
      </div>
      <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', toneClass)}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
  );
}
