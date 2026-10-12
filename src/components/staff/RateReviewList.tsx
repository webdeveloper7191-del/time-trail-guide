import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Cake, GraduationCap, Info } from 'lucide-react';
import { toast } from 'sonner';
import type { RateReview } from '@/lib/rateCategory';
import { rateCategoryStore } from '@/lib/rateCategoryStore';

const iconFor = (r: RateReview) =>
  r.kind.startsWith('junior') ? Cake : r.kind === 'qualification_adult_rate' || r.kind.startsWith('apprentice') ? GraduationCap
    : r.severity === 'warning' ? AlertTriangle : Info;

export function RateReviewList({ reviews, staffName }: { reviews: RateReview[]; staffName?: (id: string) => React.ReactNode }) {
  return (
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
                <Button size="sm" onClick={() => { rateCategoryStore.approveReview(r); toast.success('Pay rate change approved'); }}>
                  Approve
                </Button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
