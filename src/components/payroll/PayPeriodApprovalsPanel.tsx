import { useMemo, useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Clock, RotateCcw, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas';
import { PayPeriodApproval, PayPeriodApprovalStatus } from '@/types/payroll';
import { payPeriodApprovalStore, usePayPeriodApprovals } from '@/lib/payroll/payPeriodApprovalStore';
import { getPayrollOperator, setPayrollOperator } from '@/lib/payroll/operator';
import { payrollStore, usePayroll } from '@/lib/payroll/payrollStore';
import { toast } from 'sonner';

const currency = (n: number) => n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });

const statusMeta: Record<PayPeriodApprovalStatus, { label: string; variant: 'secondary' | 'default' | 'destructive' | 'outline' }> = {
  pending: { label: 'Awaiting approval', variant: 'secondary' },
  approved: { label: 'Approved', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  withdrawn: { label: 'Withdrawn', variant: 'outline' },
};

type Filter = 'pending' | 'approved' | 'closed' | 'all';

interface Props {
  onCreateRunFor?: (approval: PayPeriodApproval) => void;
}

export function PayPeriodApprovalsPanel({ onCreateRunFor }: Props) {
  usePayPeriodApprovals();
  usePayroll();
  const settings = payrollStore.getSettings();
  const all = payPeriodApprovalStore.all();

  const [filter, setFilter] = useState<Filter>('pending');
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [approver, setApprover] = useState(getPayrollOperator());
  const [note, setNote] = useState('');

  const rows = useMemo(() => all.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'closed') return a.status === 'rejected' || a.status === 'withdrawn';
    return a.status === filter;
  }), [all, filter]);

  const review = reviewId ? payPeriodApprovalStore.get(reviewId) : undefined;
  const counts = {
    pending: all.filter((a) => a.status === 'pending').length,
    approved: all.filter((a) => a.status === 'approved' && !a.consumedByRunId).length,
    used: all.filter((a) => !!a.consumedByRunId).length,
  };

  const closeReview = () => { setReviewId(null); setNote(''); };

  const decide = (kind: 'approve' | 'reject') => {
    if (!review) return;
    const result = kind === 'approve'
      ? payPeriodApprovalStore.approve(review.id, approver, note.trim() || undefined)
      : payPeriodApprovalStore.reject(review.id, approver, note);
    if (!result.ok) { toast.error(result.message); return; }
    setPayrollOperator(approver);
    toast.success(result.message);
    closeReview();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: 'Awaiting approval', value: counts.pending, icon: Clock },
          { label: 'Approved, run not created', value: counts.approved, icon: CheckCircle2 },
          { label: 'Used by a pay run', value: counts.used, icon: ShieldCheck },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-semibold tracking-tight">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
        {settings.requirePeriodApproval
          ? 'A pay period must be approved here before payroll can create a pay run for it. Each approval is single use and is released again if the run is deleted.'
          : 'Period approval is currently switched off in Payroll settings — pay runs can be created without sign-off. Requests raised here are recorded but not enforced.'}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="pending">Pending{counts.pending ? ` (${counts.pending})` : ''}</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="closed">Rejected / withdrawn</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="rounded-lg border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Payment date</TableHead>
              <TableHead>Requested by</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Employees</TableHead>
              <TableHead className="text-right">Hours</TableHead>
              <TableHead className="text-right">Est. gross</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center">
                  <ShieldCheck className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nothing here. Payroll raises a request from <span className="font-medium">New pay run</span> when a period needs sign-off.
                  </p>
                </TableCell>
              </TableRow>
            )}
            {rows.map((a) => (
              <TableRow key={a.id} className="cursor-pointer" onClick={() => { setReviewId(a.id); setNote(''); }}>
                <TableCell className="font-medium">
                  {a.periodStart} → {a.periodEnd}
                  <span className="block text-xs text-muted-foreground">{a.id} · {a.cycle}</span>
                </TableCell>
                <TableCell className="text-sm">{a.paymentDate}</TableCell>
                <TableCell className="text-sm">
                  {a.requestedBy}
                  <span className="block text-xs text-muted-foreground">{a.requestedAt.slice(0, 10)}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={statusMeta[a.status].variant}>{statusMeta[a.status].label}</Badge>
                  {a.consumedByRunId && <span className="block text-xs text-muted-foreground mt-1">Used by {a.consumedByRunId}</span>}
                </TableCell>
                <TableCell className="text-right tabular-nums">{a.summary.employees}</TableCell>
                <TableCell className="text-right tabular-nums">{a.summary.totalHours.toFixed(1)}</TableCell>
                <TableCell className="text-right tabular-nums">{currency(a.summary.estimatedGross)}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-1">
                    {(a.status === 'rejected' || a.status === 'withdrawn') && (
                      <Button variant="ghost" size="sm" aria-label={`Resubmit ${a.id}`} onClick={() => { payPeriodApprovalStore.resubmit(a.id, getPayrollOperator()); toast.success('Request resubmitted for approval.'); }}>
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" aria-label={`Delete ${a.id}`} onClick={() => { payPeriodApprovalStore.remove(a.id); toast.success('Request removed.'); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PrimaryOffCanvas
        open={!!review}
        onClose={closeReview}
        title="Review pay period"
        description={review ? `${review.periodStart} → ${review.periodEnd} · paid ${review.paymentDate}` : ''}
        icon={ShieldCheck}
        size="lg"
        actions={review?.status === 'pending'
          ? [
            { label: 'Reject', variant: 'outlined' as const, onClick: () => decide('reject') },
            { label: 'Approve period', variant: 'primary' as const, onClick: () => decide('approve') },
          ]
          : [{ label: 'Close', variant: 'outlined' as const, onClick: closeReview }]}
      >
        {review && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Employees', value: String(review.summary.employees) },
                { label: 'Timesheets', value: String(review.summary.timesheets) },
                { label: 'Total hours', value: review.summary.totalHours.toFixed(1) },
                { label: 'Estimated gross', value: currency(review.summary.estimatedGross) },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-semibold tabular-nums tracking-tight">{s.value}</p>
                </div>
              ))}
            </div>

            {(review.summary.unapprovedTimesheets > 0 || review.summary.unmatchedEmployees > 0) && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 space-y-1 text-xs">
                <p className="text-sm font-medium text-destructive">Check before approving</p>
                {review.summary.unapprovedTimesheets > 0 && <p>{review.summary.unapprovedTimesheets} timesheet(s) in this period are not approved.</p>}
                {review.summary.unmatchedEmployees > 0 && <p>{review.summary.unmatchedEmployees} employee(s) have no workforce record — the timesheet rate will be used.</p>}
              </div>
            )}

            <div className="rounded-lg border p-3 text-sm space-y-1">
              <p><span className="text-muted-foreground">Requested by</span> {review.requestedBy} · {new Date(review.requestedAt).toLocaleString('en-AU')}</p>
              {review.requestNote && <p className="text-muted-foreground">“{review.requestNote}”</p>}
              {review.decidedBy && (
                <p className="pt-1">
                  <span className="text-muted-foreground">{review.status === 'approved' ? 'Approved by' : 'Decided by'}</span> {review.decidedBy} · {new Date(review.decidedAt!).toLocaleString('en-AU')}
                  {review.decisionNote && <span className="block text-muted-foreground">“{review.decisionNote}”</span>}
                </p>
              )}
            </div>

            {review.status === 'pending' && (
              <>
                <div className="space-y-2">
                  <Label>Approver</Label>
                  <Input value={approver} onChange={(e) => setApprover(e.target.value)} placeholder="Your name" />
                  {settings.requireSeparateApprover && (
                    <p className="text-xs text-muted-foreground">Segregation of duties is on — {review.requestedBy} cannot approve their own request.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Note {`(required when rejecting)`}</Label>
                  <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Context for the decision…" />
                </div>
              </>
            )}

            {review.status === 'approved' && !review.consumedByRunId && onCreateRunFor && (
              <Button className="w-full" onClick={() => { onCreateRunFor(review); closeReview(); }}>
                Create the pay run for this period
              </Button>
            )}
            {review.status === 'approved' && review.consumedByRunId && (
              <p className="text-xs text-muted-foreground">This approval has been used by pay run {review.consumedByRunId}.</p>
            )}
            {review.status === 'rejected' && (
              <Button variant="outline" className="w-full" onClick={() => { payPeriodApprovalStore.resubmit(review.id, getPayrollOperator()); toast.success('Request resubmitted for approval.'); closeReview(); }}>
                <RotateCcw className="h-4 w-4 mr-2" />Resubmit for approval
              </Button>
            )}
          </div>
        )}
      </PrimaryOffCanvas>
    </div>
  );
}
