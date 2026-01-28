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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import { AssignedPlan, planTypeLabels } from '@/types/performancePlan';

interface CancelPlanConfirmDialogProps {
  open: boolean;
  plan: AssignedPlan | null;
  loading?: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function CancelPlanConfirmDialog({
  open,
  plan,
  loading = false,
  onConfirm,
  onCancel,
}: CancelPlanConfirmDialogProps) {
  const [reason, setReason] = useState('');

  React.useEffect(() => {
    if (!open) {
      setReason('');
    }
  }, [open]);

  if (!plan) return null;

  const handleConfirm = () => {
    onConfirm(reason);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle>Cancel Performance Plan</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Are you sure you want to cancel this plan? This action will stop all progress tracking.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="p-3 rounded-lg bg-muted/50 border border-border/60">
            <p className="text-sm font-medium">{plan.templateName}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {planTypeLabels[plan.type]}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Reason for Cancellation (Optional)</Label>
            <Textarea
              id="cancel-reason"
              placeholder="Enter reason for cancelling this plan..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Keep Plan
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Cancelling...' : 'Cancel Plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
