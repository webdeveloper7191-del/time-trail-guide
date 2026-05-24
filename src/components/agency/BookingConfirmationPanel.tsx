import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/mui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2, XCircle, Clock, Video, Phone, MapPin, Timer, Send, AlertTriangle, ThumbsUp, ThumbsDown,
} from 'lucide-react';
import {
  generateMockBookingConfirmations,
  confirmBooking,
  rejectBooking,
  schedulePreview,
  checkSlaExpiry,
  timeUntilDeadline,
} from '@/lib/bookingConfirmationService';
import { BookingConfirmation } from '@/types/agencyCompliance';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const statusStyles: Record<string, string> = {
  awaiting_centre: 'border-blue-200 text-blue-700 bg-blue-50',
  preview_scheduled: 'border-violet-200 text-violet-700 bg-violet-50',
  confirmed: 'border-emerald-200 text-emerald-700 bg-emerald-50',
  rejected: 'border-red-200 text-red-700 bg-red-50',
  auto_confirmed: 'border-emerald-200 text-emerald-700 bg-emerald-50',
  auto_rejected: 'border-orange-200 text-orange-700 bg-orange-50',
  withdrawn: 'border-slate-200 text-slate-700 bg-slate-50',
  expired: 'border-slate-200 text-slate-700 bg-slate-50',
};

export function BookingConfirmationPanel() {
  const [bookings, setBookings] = useState<BookingConfirmation[]>(() => generateMockBookingConfirmations());
  const [tab, setTab] = useState<'awaiting' | 'preview' | 'decided'>('awaiting');
  const [rejectDialog, setRejectDialog] = useState<BookingConfirmation | null>(null);
  const [rejectForm, setRejectForm] = useState<{ category: NonNullable<BookingConfirmation['rejectionCategory']>; reason: string }>({ category: 'fit', reason: '' });
  const [previewDialog, setPreviewDialog] = useState<BookingConfirmation | null>(null);
  const [previewForm, setPreviewForm] = useState<{ mode: NonNullable<BookingConfirmation['previewMode']>; when: string; notes: string }>({ mode: 'video', when: '', notes: '' });

  // Tick every 30s to update SLA countdowns and auto-expire
  const [, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => {
      setBookings(prev => prev.map(checkSlaExpiry));
      setTick(t => t + 1);
    }, 30000);
    return () => clearInterval(i);
  }, []);

  const filtered = useMemo(() => {
    if (tab === 'awaiting') return bookings.filter(b => b.status === 'awaiting_centre');
    if (tab === 'preview') return bookings.filter(b => b.status === 'preview_scheduled');
    return bookings.filter(b => ['confirmed', 'rejected', 'auto_confirmed', 'auto_rejected', 'withdrawn', 'expired'].includes(b.status));
  }, [bookings, tab]);

  const kpis = useMemo(() => ({
    awaiting: bookings.filter(b => b.status === 'awaiting_centre').length,
    overdue: bookings.filter(b => b.status === 'awaiting_centre' && timeUntilDeadline(b).isOverdue).length,
    confirmed: bookings.filter(b => b.status === 'confirmed' || b.status === 'auto_confirmed').length,
    rejected: bookings.filter(b => b.status === 'rejected' || b.status === 'auto_rejected').length,
  }), [bookings]);

  const handleConfirm = (b: BookingConfirmation) => {
    setBookings(prev => prev.map(x => x.id === b.id ? confirmBooking(x, 'Centre Director') : x));
  };

  const submitReject = () => {
    if (!rejectDialog) return;
    setBookings(prev => prev.map(x => x.id === rejectDialog.id ? rejectBooking(x, 'Centre Director', rejectForm.reason, rejectForm.category) : x));
    setRejectDialog(null);
    setRejectForm({ category: 'fit', reason: '' });
  };

  const submitPreview = () => {
    if (!previewDialog || !previewForm.when) return;
    setBookings(prev => prev.map(x => x.id === previewDialog.id ? schedulePreview(x, new Date(previewForm.when).toISOString(), previewForm.mode, previewForm.notes) : x));
    setPreviewDialog(null);
    setPreviewForm({ mode: 'video', when: '', notes: '' });
  };

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <KPI title="Awaiting Centre" value={kpis.awaiting} icon={Clock} tone="blue" />
        <KPI title="Overdue (SLA)" value={kpis.overdue} icon={AlertTriangle} tone="red" />
        <KPI title="Confirmed" value={kpis.confirmed} icon={CheckCircle2} tone="emerald" />
        <KPI title="Rejected" value={kpis.rejected} icon={XCircle} tone="amber" />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="awaiting">Awaiting Decision ({kpis.awaiting})</TabsTrigger>
          <TabsTrigger value="preview">Interview Scheduled</TabsTrigger>
          <TabsTrigger value="decided">Decided</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="bg-background border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-[11px] font-semibold">Candidate</TableHead>
              <TableHead className="text-[11px] font-semibold">Agency</TableHead>
              <TableHead className="text-[11px] font-semibold">Shift</TableHead>
              <TableHead className="text-[11px] font-semibold">Submitted</TableHead>
              <TableHead className="text-[11px] font-semibold">Centre SLA</TableHead>
              <TableHead className="text-[11px] font-semibold">Status</TableHead>
              <TableHead className="text-[11px] font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">No bookings in this view</TableCell></TableRow>
            )}
            {filtered.map(b => {
              const sla = timeUntilDeadline(b);
              return (
                <TableRow key={b.id} className="hover:bg-muted/20">
                  <TableCell>
                    <div className="text-[13px] font-medium">{b.candidateName}</div>
                    <div className="text-[11px] text-muted-foreground">{b.roleName}</div>
                  </TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">{b.agencyName}</TableCell>
                  <TableCell className="text-[12px]">
                    <div>{format(new Date(b.shiftDate), 'EEE d MMM')}</div>
                    <div className="text-[11px] text-muted-foreground">{b.shiftStartTime} – {b.shiftEndTime}</div>
                  </TableCell>
                  <TableCell className="text-[12px] text-muted-foreground">{format(new Date(b.submittedAt), 'h:mm a')}</TableCell>
                  <TableCell>
                    {b.status === 'awaiting_centre' || b.status === 'preview_scheduled' ? (
                      <div className="flex items-center gap-1.5">
                        <Timer className={cn('h-3.5 w-3.5', sla.severity === 'overdue' ? 'text-red-600' : sla.severity === 'critical' ? 'text-red-500' : sla.severity === 'warning' ? 'text-amber-500' : 'text-muted-foreground')} />
                        <span className={cn(
                          'text-[12px] font-medium',
                          sla.severity === 'overdue' ? 'text-red-600' : sla.severity === 'critical' ? 'text-red-500' : sla.severity === 'warning' ? 'text-amber-600' : 'text-foreground'
                        )}>
                          {sla.formatted}
                        </span>
                        <Badge variant="outline" className="text-[10px] h-5">{b.responseSlaMinutes}m SLA</Badge>
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={cn('inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border', statusStyles[b.status])}>
                      {b.status.replace('_', ' ')}
                    </span>
                    {b.rejectionReason && (
                      <div className="text-[11px] text-muted-foreground mt-0.5">{b.rejectionCategory}: {b.rejectionReason}</div>
                    )}
                    {b.previewScheduledAt && (
                      <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        {b.previewMode === 'video' && <Video className="h-3 w-3" />}
                        {b.previewMode === 'phone' && <Phone className="h-3 w-3" />}
                        {b.previewMode === 'in_person' && <MapPin className="h-3 w-3" />}
                        {format(new Date(b.previewScheduledAt), 'EEE d MMM, h:mm a')}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {b.status === 'awaiting_centre' || b.status === 'preview_scheduled' ? (
                      <div className="inline-flex gap-1">
                        <Button size="small" onClick={() => handleConfirm(b)} className="h-7 text-xs">
                          <ThumbsUp className="h-3 w-3 mr-1" /> Confirm
                        </Button>
                        {b.status === 'awaiting_centre' && (
                          <Button size="small" variant="outlined" onClick={() => setPreviewDialog(b)} className="h-7 text-xs">
                            <Video className="h-3 w-3 mr-1" /> Interview
                          </Button>
                        )}
                        <Button size="small" variant="outlined" onClick={() => setRejectDialog(b)} className="h-7 text-xs">
                          <ThumbsDown className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">
                        {b.decidedAt ? format(new Date(b.decidedAt), 'h:mm a') : ''}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Send className="h-4 w-4" /> Reverse SLA Policy</CardTitle>
          <CardDescription className="text-xs">
            Critical: 15m · Urgent: 30m · Standard: 60m. After deadline the booking auto-rejects (configurable).
            Reminders are sent at the configured intervals before the deadline.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Reject dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={(o) => !o && setRejectDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Candidate</DialogTitle>
            <DialogDescription>{rejectDialog?.candidateName} for {rejectDialog?.roleName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={rejectForm.category} onValueChange={(v) => setRejectForm(f => ({ ...f, category: v as typeof f.category }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="experience">Experience</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="rate">Rate</SelectItem>
                  <SelectItem value="availability">Availability</SelectItem>
                  <SelectItem value="fit">Fit</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Reason</Label>
              <Textarea value={rejectForm.reason} onChange={e => setRejectForm(f => ({ ...f, reason: e.target.value }))} rows={3} className="text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outlined" onClick={() => setRejectDialog(null)}>Cancel</Button>
            <Button onClick={submitReject} disabled={!rejectForm.reason}>Reject Candidate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Interview dialog */}
      <Dialog open={!!previewDialog} onOpenChange={(o) => !o && setPreviewDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Interview / Preview</DialogTitle>
            <DialogDescription>{previewDialog?.candidateName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Mode</Label>
              <Select value={previewForm.mode} onValueChange={(v) => setPreviewForm(f => ({ ...f, mode: v as typeof f.mode }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="video">Video Call</SelectItem>
                  <SelectItem value="in_person">In Person</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">When</Label>
              <Input type="datetime-local" value={previewForm.when} onChange={e => setPreviewForm(f => ({ ...f, when: e.target.value }))} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={previewForm.notes} onChange={e => setPreviewForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outlined" onClick={() => setPreviewDialog(null)}>Cancel</Button>
            <Button onClick={submitPreview} disabled={!previewForm.when}>Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
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
