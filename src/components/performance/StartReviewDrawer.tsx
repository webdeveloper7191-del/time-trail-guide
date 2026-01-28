import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PerformanceReview, ReviewCycle, reviewCycleLabels } from '@/types/performance';
import { StaffMember } from '@/types/staff';
import { format, subMonths, startOfYear, endOfYear, startOfQuarter, endOfQuarter } from 'date-fns';
import { CalendarIcon, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas/PrimaryOffCanvas';

const reviewSchema = z.object({
  staffId: z.string().min(1, 'Team member is required'),
  reviewCycle: z.enum(['annual', 'semi_annual', 'quarterly', 'monthly']),
  periodStart: z.date({ required_error: 'Start date is required' }),
  periodEnd: z.date({ required_error: 'End date is required' }),
});

interface StartReviewDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<PerformanceReview, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  staff: StaffMember[];
  reviewerId: string;
}

export function StartReviewDrawer({ open, onOpenChange, onSubmit, staff, reviewerId }: StartReviewDrawerProps) {
  const [staffId, setStaffId] = useState('');
  const [reviewCycle, setReviewCycle] = useState<ReviewCycle>('quarterly');
  const [periodStart, setPeriodStart] = useState<Date>();
  const [periodEnd, setPeriodEnd] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCycleChange = (cycle: ReviewCycle) => {
    setReviewCycle(cycle);
    const now = new Date();
    switch (cycle) {
      case 'annual':
        setPeriodStart(startOfYear(now));
        setPeriodEnd(endOfYear(now));
        break;
      case 'semi_annual':
        setPeriodStart(subMonths(now, 6));
        setPeriodEnd(now);
        break;
      case 'quarterly':
        setPeriodStart(startOfQuarter(now));
        setPeriodEnd(endOfQuarter(now));
        break;
      case 'monthly':
        setPeriodStart(subMonths(now, 1));
        setPeriodEnd(now);
        break;
    }
  };

  const handleSubmit = async () => {
    const validation = reviewSchema.safeParse({ staffId, reviewCycle, periodStart, periodEnd });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        staffId,
        reviewerId,
        reviewCycle,
        periodStart: format(periodStart!, 'yyyy-MM-dd'),
        periodEnd: format(periodEnd!, 'yyyy-MM-dd'),
        status: 'pending_self',
        ratings: [],
      });
      onOpenChange(false);
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStaffId('');
    setReviewCycle('quarterly');
    setPeriodStart(undefined);
    setPeriodEnd(undefined);
    setErrors({});
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const activeStaff = staff.filter(s => s.status === 'active');

  return (
    <PrimaryOffCanvas
      title="Start Performance Review"
      description="Initiate a review cycle for a team member"
      icon={ClipboardCheck}
      size="md"
      open={open}
      onClose={handleClose}
      actions={[
        { label: 'Cancel', onClick: handleClose, variant: 'outlined' },
        { label: loading ? 'Starting...' : 'Start Review', onClick: handleSubmit, variant: 'primary', disabled: loading, loading },
      ]}
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <Label>Team Member *</Label>
          <Select value={staffId} onValueChange={setStaffId}>
            <SelectTrigger className={errors.staffId ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select team member" />
            </SelectTrigger>
            <SelectContent>
              {activeStaff.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={s.avatar} />
                      <AvatarFallback className="text-xs">{s.firstName[0]}{s.lastName[0]}</AvatarFallback>
                    </Avatar>
                    {s.firstName} {s.lastName}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.staffId && <p className="text-xs text-destructive">{errors.staffId}</p>}
        </div>

        <div className="space-y-2">
          <Label>Review Cycle *</Label>
          <Select value={reviewCycle} onValueChange={v => handleCycleChange(v as ReviewCycle)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(reviewCycleLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Period Start *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('w-full justify-start text-left font-normal', !periodStart && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {periodStart ? format(periodStart, 'MMM d, yyyy') : 'Start'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={periodStart} onSelect={setPeriodStart} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Period End *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('w-full justify-start text-left font-normal', !periodEnd && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {periodEnd ? format(periodEnd, 'MMM d, yyyy') : 'End'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={periodEnd} onSelect={setPeriodEnd} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-muted/50 border">
          <p className="text-sm text-muted-foreground">
            The team member will receive a notification to complete their self-review first.
          </p>
        </div>
      </div>
    </PrimaryOffCanvas>
  );
}

export default StartReviewDrawer;
