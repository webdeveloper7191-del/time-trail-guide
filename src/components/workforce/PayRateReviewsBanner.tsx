import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StaffMember } from '@/types/staff';
import { useRateCategories } from '@/lib/rateCategoryStore';
import { RateReviewList } from '@/components/staff/RateReviewList';

/** Draws managers' attention to junior/apprentice/trainee pay changes waiting on them. */
export function PayRateReviewsBanner({ staff }: { staff: StaffMember[] }) {
  const store = useRateCategories();
  const [open, setOpen] = useState(true);
  const reviews = staff.flatMap(s => store.reviewsFor(s));
  if (!reviews.length) return null;
  const approvals = reviews.filter(r => r.needsApproval).length;
  const byId = Object.fromEntries(staff.map(s => [s.id, s]));

  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BellRing className="h-4 w-4 text-destructive" />
          <p className="text-sm font-semibold">
            {approvals > 0 ? `${approvals} pay rate change${approvals > 1 ? 's' : ''} waiting for your approval` : 'Upcoming pay rate changes'}
            {reviews.length > approvals && <span className="font-normal text-muted-foreground"> · {reviews.length - approvals} heads-up</span>}
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setOpen(o => !o)}>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      {open && (
        <RateReviewList
          reviews={reviews}
          staffName={id => <Link className="hover:underline" to={`/workforce/${id}`}>{byId[id]?.firstName} {byId[id]?.lastName}</Link>}
        />
      )}
    </div>
  );
}
