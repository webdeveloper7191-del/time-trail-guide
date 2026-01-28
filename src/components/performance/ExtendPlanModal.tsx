import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Clock } from 'lucide-react';
import { format, parseISO, addDays, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { AssignedPlan } from '@/types/performancePlan';

interface ExtendPlanModalProps {
  open: boolean;
  plan: AssignedPlan | null;
  loading?: boolean;
  onExtend: (newEndDate: string) => void;
  onCancel: () => void;
}

export function ExtendPlanModal({
  open,
  plan,
  loading = false,
  onExtend,
  onCancel,
}: ExtendPlanModalProps) {
  const [newEndDate, setNewEndDate] = useState<Date | undefined>(
    plan ? addDays(parseISO(plan.endDate), 14) : undefined
  );

  React.useEffect(() => {
    if (plan) {
      setNewEndDate(addDays(parseISO(plan.endDate), 14));
    }
  }, [plan]);

  if (!plan) return null;

  const currentEndDate = parseISO(plan.endDate);
  const extensionDays = newEndDate ? differenceInDays(newEndDate, currentEndDate) : 0;

  const handleExtend = () => {
    if (newEndDate) {
      onExtend(newEndDate.toISOString());
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Extend Plan Duration</DialogTitle>
          <DialogDescription>
            Extend the end date for "{plan.templateName}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Current End Date</Label>
              <div className="flex items-center gap-2 text-sm font-medium">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                {format(currentEndDate, 'MMM d, yyyy')}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Extension</Label>
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Clock className="h-4 w-4" />
                +{extensionDays} days
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>New End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !newEndDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newEndDate ? format(newEndDate, 'PPP') : 'Select new end date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newEndDate}
                  onSelect={setNewEndDate}
                  disabled={(date) => date <= currentEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleExtend}
            disabled={loading || !newEndDate || extensionDays <= 0}
          >
            {loading ? 'Extending...' : 'Extend Plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
