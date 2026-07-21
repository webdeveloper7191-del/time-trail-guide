import { useSyncExternalStore, useMemo, useState } from 'react';
import {
  subscribeLeave,
  getLeaveSnapshot,
  LeaveStore,
  findStaffByName,
  type LeaveKind,
} from '@/lib/leaveAccrualEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Send } from 'lucide-react';
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

  if (!staff) {
    return <div className="p-8 text-sm text-muted-foreground">No leave profile found for {employeeName}.</div>;
  }

  const myLedger = snap.ledger
    .filter(l => l.staffId === staff.staffId)
    .sort((a, b) => (a.occurredOn < b.occurredOn ? 1 : -1));

  const cards: { kind: LeaveKind; label: string; desc: string }[] = [
    { kind: 'RDO',  label: 'RDO',  desc: 'Rostered Day Off' },
    { kind: 'ADO',  label: 'ADO',  desc: 'Accrued Day Off' },
    { kind: 'TOIL', label: 'TOIL', desc: 'Time Off In Lieu' },
  ];

  const submitRequest = () => {
    if (!requestOpen || !reqDate) return;
    const hours = Number(reqHours);
    if (!hours || hours <= 0) return;
    if ((staff.balanceHours[requestOpen] ?? 0) < hours) {
      toast.error('Insufficient balance');
      return;
    }
    const entry = LeaveStore.postLedger({
      staffId: staff.staffId,
      kind: requestOpen,
      type: 'consumption',
      hours: -Math.abs(hours),
      occurredOn: reqDate,
      note: reqNote || `${requestOpen} leave request`,
    });
    toast.success(`${requestOpen} leave requested`, {
      description: `−${hours}h on ${reqDate} • entry ${entry.id}`,
    });
    setRequestOpen(null);
    setReqDate(''); setReqHours('8'); setReqNote('');
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Leave balances</h1>
        <p className="text-sm text-muted-foreground">Your accrued RDO, ADO and TOIL time.</p>
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
                  <Badge variant={optedIn ? 'default' : 'outline'}>{optedIn ? 'Opted in' : 'Not opted in'}</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">{c.desc}</p>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold tracking-tight">{bal.toFixed(2)}<span className="text-sm text-muted-foreground ml-1">hrs</span></div>
                <Button
                  size="sm" variant="outline" className="mt-3 w-full"
                  disabled={bal <= 0}
                  onClick={() => setRequestOpen(c.kind)}
                >
                  <Send className="h-3 w-3 mr-1.5" /> Request {c.label} leave
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestOpen(null)}>Cancel</Button>
            <Button onClick={submitRequest}>Submit request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
