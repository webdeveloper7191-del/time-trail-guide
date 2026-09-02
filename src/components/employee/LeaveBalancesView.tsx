import { useSyncExternalStore, useMemo, useState } from 'react';
import {
  subscribeLeave,
  getLeaveSnapshot,
  findStaffByName,
  consumeLeave,
  planDrawdown,
  quoteToilCashout,
  requestToilCashout,
  type LeaveKind,
} from '@/lib/leaveAccrualEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Send, Banknote, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  employeeName: string;
}

export function LeaveBalancesView({ employeeName }: Props) {
  const snap = useSyncExternalStore(subscribeLeave, getLeaveSnapshot, getLeaveSnapshot);
  const staff = useMemo(() => findStaffByName(employeeName) ?? snap.staff[0], [snap.staff, employeeName]);
  const [requestOpen, setRequestOpen] = useState<null | LeaveKind>(null);
  const [reqDate, setReqDate] = useState('');
  const [reqHours, setReqHours] = useState('8');
  const [reqNote, setReqNote] = useState('');
  const [cashoutOpen, setCashoutOpen] = useState(false);
  const [cashHours, setCashHours] = useState('8');
  const [cashReason, setCashReason] = useState('');

  if (!staff) {
    return <div className="p-8 text-sm text-muted-foreground">No leave profile found for {employeeName}.</div>;
  }

  const myLedger = snap.ledger
    .filter(l => l.staffId === staff.staffId)
    .sort((a, b) => (a.occurredOn < b.occurredOn ? 1 : -1));

  const myCashouts = (snap.cashouts ?? []).filter(c => c.staffId === staff.staffId);

  // Current base rate: most recent recorded accrual rate, else a sensible default.
  const currentRate = myLedger.find(l => l.rateAtAccrual)?.rateAtAccrual ?? 35;

  const cards: { kind: LeaveKind; label: string; desc: string }[] = [
    { kind: 'RDO',  label: 'RDO',  desc: 'Rostered Day Off' },
    { kind: 'ADO',  label: 'ADO',  desc: 'Accrued Day Off' },
    { kind: 'TOIL', label: 'TOIL', desc: 'Time Off In Lieu' },
  ];

  const drawdownPreview = requestOpen && Number(reqHours) > 0
    ? planDrawdown({ staffId: staff.staffId, kind: requestOpen, hours: Number(reqHours), awardCode: staff.awardCode })
    : null;

  const cashoutQuote = cashoutOpen && Number(cashHours) > 0
    ? quoteToilCashout({ staffId: staff.staffId, hours: Number(cashHours), currentRate, awardCode: staff.awardCode })
    : null;

  const submitRequest = () => {
    if (!requestOpen || !reqDate) return;
    const hours = Number(reqHours);
    if (!hours || hours <= 0) return;
    const { plan } = consumeLeave({
      staffId: staff.staffId,
      kind: requestOpen,
      hours,
      occurredOn: reqDate,
      awardCode: staff.awardCode,
      note: reqNote || `${requestOpen} leave request`,
    });
    toast.success(`${requestOpen} leave requested`, {
      description: plan.unpaidHours > 0 || plan.negativeHours > 0 ? plan.message : `−${hours}h on ${reqDate}`,
    });
    setRequestOpen(null);
    setReqDate(''); setReqHours('8'); setReqNote('');
  };

  const submitCashout = () => {
    const hours = Number(cashHours);
    if (!hours || hours <= 0) return;
    const req = requestToilCashout({
      staffId: staff.staffId,
      staffName: staff.staffName,
      hours,
      currentRate,
      awardCode: staff.awardCode,
      reason: cashReason,
    });
    toast.success(req.status === 'approved' ? 'TOIL cash-out approved' : 'TOIL cash-out submitted for approval', {
      description: `${req.hours.toFixed(2)}h ≈ $${req.estimatedAmount.toFixed(2)} — paid via your next timesheet.`,
    });
    setCashoutOpen(false); setCashHours('8'); setCashReason('');
  };


  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Leave balances</h1>
        <p className="text-sm text-muted-foreground">Your accrued Rostered Day Off (RDO), Accrued Day Off (ADO) and Time Off in Lieu (TOIL) balances.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(c => {
          const bal = staff.balanceHours[c.kind] ?? 0;
          const optedIn = staff.optedIn[c.kind];
          return (
            <Card key={c.kind}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{c.label}</span>
                  <Badge variant={optedIn ? 'default' : 'outline'}>{optedIn ? 'Enrolled' : 'Not enrolled'}</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">{c.desc}</p>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-semibold tracking-tight ${bal < 0 ? 'text-destructive' : ''}`}>{bal.toFixed(2)}<span className="text-sm text-muted-foreground ml-1">hrs</span></div>
                {bal < 0 && <p className="text-xs text-destructive mt-1">Leave in advance — to be offset against future accruals</p>}
                <Button
                  size="sm" variant="outline" className="mt-3 w-full"
                  onClick={() => setRequestOpen(c.kind)}
                >
                  <Send className="h-3 w-3 mr-1.5" /> Request {c.label} leave
                </Button>
                {c.kind === 'TOIL' && (
                  <Button
                    size="sm" variant="secondary" className="mt-2 w-full"
                    disabled={bal <= 0}
                    onClick={() => setCashoutOpen(true)}
                  >
                    <Banknote className="h-3 w-3 mr-1.5" /> Request TOIL payout
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {myCashouts.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">TOIL payout requests</CardTitle></CardHeader>
          <CardContent className="divide-y">
            {myCashouts.map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="font-medium">{r.hours.toFixed(2)}h · ${r.estimatedAmount.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.requestedOn} — paid at the {r.basis === 'current_rate' ? 'rate at date of payment' : 'rate at time of accrual'}
                    {r.paidInPeriod ? ` • paid in ${r.paidInPeriod}` : ''}
                  </div>
                </div>
                <Badge variant="outline">{r.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}


      <Card>
        <CardHeader><CardTitle className="text-base">Recent activity</CardTitle></CardHeader>
        <CardContent>
          {myLedger.length === 0 ? (
            <p className="text-sm text-muted-foreground">No ledger entries yet.</p>
          ) : (
            <div className="divide-y">
              {myLedger.slice(0, 20).map(e => (
                <div key={e.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="flex items-center gap-3">
                    {e.type === 'accrual' ? <Clock className="h-4 w-4 text-emerald-600" /> : <Calendar className="h-4 w-4 text-amber-600" />}
                    <div>
                      <div className="font-medium">{e.kind} • {e.type}</div>
                      <div className="text-xs text-muted-foreground">{e.occurredOn} — {e.note}</div>
                    </div>
                  </div>
                  <div className={e.hours >= 0 ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                    {e.hours >= 0 ? '+' : ''}{e.hours.toFixed(2)}h
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!requestOpen} onOpenChange={(o) => !o && setRequestOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request {requestOpen} leave</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={reqDate} onChange={e => setReqDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Hours</Label>
              <Input type="number" min="0" step="0.25" value={reqHours} onChange={e => setReqHours(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Note (optional)</Label>
              <Input value={reqNote} onChange={e => setReqNote(e.target.value)} placeholder="Reason / cover arrangements" />
            </div>
            <p className="text-xs text-muted-foreground">
              Current balance: <strong>{(staff.balanceHours[requestOpen ?? 'TOIL'] ?? 0).toFixed(2)}h</strong>
            </p>
            {drawdownPreview && (drawdownPreview.unpaidHours > 0 || drawdownPreview.negativeHours > 0) && (
              <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{drawdownPreview.message}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestOpen(null)}>Cancel</Button>
            <Button onClick={submitRequest}>Submit request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cashoutOpen} onOpenChange={setCashoutOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cash out TOIL</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Hours to cash out</Label>
              <Input type="number" min="0" step="0.25" value={cashHours} onChange={e => setCashHours(e.target.value)} />
              <p className="text-xs text-muted-foreground">Available: {(staff.balanceHours.TOIL ?? 0).toFixed(2)}h</p>
            </div>
            <div className="space-y-1">
              <Label>Reason (optional)</Label>
              <Textarea rows={2} value={cashReason} onChange={e => setCashReason(e.target.value)} placeholder="Why you're cashing out" />
            </div>
            {cashoutQuote && (
              <div className="rounded-md border p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Estimated payment</span>
                  <span className="tabular-nums">${cashoutQuote.amount.toFixed(2)}</span>
                </div>
                <p className="text-muted-foreground">
                  {cashoutQuote.basis === 'current_rate'
                    ? `Paid at your current rate of $${currentRate.toFixed(2)}/h.`
                    : 'Paid at the rate that applied when each hour was banked (oldest hours first).'}
                  {' '}Blended rate ${cashoutQuote.blendedRate.toFixed(2)}/h.
                </p>
                {cashoutQuote.layers.map((l, i) => (
                  <div key={i} className="flex justify-between text-muted-foreground">
                    <span>{l.hours.toFixed(2)}h banked {l.accruedOn} @ ${l.rate.toFixed(2)}{l.multiplier !== 1 ? ` × ${l.multiplier}` : ''}</span>
                    <span className="tabular-nums">${l.amount.toFixed(2)}</span>
                  </div>
                ))}
                {cashoutQuote.warnings.map((w, i) => (
                  <div key={i} className="flex gap-2 text-amber-700"><AlertTriangle className="h-3.5 w-3.5 shrink-0" />{w}</div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Once approved, the hours leave your TOIL balance and the amount appears on your next timesheet as a TOIL cash-out line.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCashoutOpen(false)}>Cancel</Button>
            <Button onClick={submitCashout} disabled={!cashoutQuote || cashoutQuote.hours <= 0}>Submit cash-out</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
