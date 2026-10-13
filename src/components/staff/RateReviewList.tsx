import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Cake, GraduationCap, Info } from 'lucide-react';
import { toast } from 'sonner';
import type { RateReview } from '@/lib/rateCategory';
import { rateCategoryStore } from '@/lib/rateCategoryStore';
import { useState } from 'react';
import { daysLate } from '@/lib/rateBackPay';
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });

const iconFor = (r: RateReview) =>
  r.kind.startsWith('junior') ? Cake : r.kind === 'qualification_adult_rate' || r.kind.startsWith('apprentice') ? GraduationCap
    : r.severity === 'warning' ? AlertTriangle : Info;

export function RateReviewList({ reviews, staffName }: { reviews: RateReview[]; staffName?: (id: string) => React.ReactNode }) {
  const [pending, setPending] = useState<RateReview | null>(null);
  const approve = (r: RateReview) => {
    if (daysLate(r.effectiveFrom, new Date()) > 0) { setPending(r); return; }
    rateCategoryStore.approveReview(r); toast.success('Pay rate change approved');
  };
  const late = pending ? daysLate(pending.effectiveFrom, new Date()) : 0;
  return (
    <>
    <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Backdate this pay increase?</AlertDialogTitle>
          <AlertDialogDescription>
            {pending?.effectiveFrom && <>This change was due on {fmt(pending.effectiveFrom)} — {late} day{late === 1 ? '' : 's'} ago. </>}
            Backdating adds the difference ({pending?.fromPercent}% → {pending?.toPercent}%) for shifts worked since then to the next pay run.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="outline" onClick={() => { if (pending) rateCategoryStore.approveReview(pending, 'from_approval'); setPending(null); toast.success('Approved — new rate starts today'); }}>
            Start from today
          </Button>
          <Button onClick={() => { if (pending) rateCategoryStore.approveReview(pending, 'backdate'); setPending(null); toast.success('Approved and backdated — back-pay added for the next pay run'); }}>
            Backdate to {pending?.effectiveFrom ? fmt(pending.effectiveFrom) : 'due date'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <ul className="divide-y rounded-lg border bg-card">
      {reviews.map(r => {
        const Icon = iconFor(r);
        return (
          <li key={r.id} className="flex flex-wrap items-start gap-3 p-3">
            <Icon className={r.severity === 'action' ? 'h-4 w-4 mt-0.5 text-destructive' : 'h-4 w-4 mt-0.5 text-muted-foreground'} />
            <div className="flex-1 min-w-[220px]">
              <div className="flex flex-wrap items-center gap-2">
                {staffName && <span className="text-sm font-semibold">{staffName(r.staffId)}</span>}
                <span className="text-sm">{r.title}</span>
                {r.needsApproval
                  ? <Badge variant="destructive">Needs approval</Badge>
                  : <Badge variant="outline">{r.severity === 'warning' ? 'Warning' : 'Heads-up'}</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{r.detail}</p>
            </div>
            {r.needsApproval && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { rateCategoryStore.declineReview(r); toast('Kept at current rate'); }}>
                  Decline
                </Button>
                <Button size="sm" onClick={() => approve(r)}>
                  Approve
                </Button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
    </>
  );
}
