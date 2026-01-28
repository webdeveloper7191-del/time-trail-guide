import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import { AssignedPlan, planTypeLabels } from '@/types/performancePlan';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas/PrimaryOffCanvas';

interface CancelPlanDrawerProps {
  open: boolean;
  plan: AssignedPlan | null;
  loading?: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function CancelPlanDrawer({
  open,
  plan,
  loading = false,
  onConfirm,
  onCancel,
}: CancelPlanDrawerProps) {
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
    <PrimaryOffCanvas
      open={open}
      onClose={onCancel}
      title="Cancel Performance Plan"
      icon={AlertTriangle}
      size="md"
      actions={[
        {
          label: 'Keep Plan',
          onClick: onCancel,
          variant: 'outlined',
          disabled: loading,
        },
        {
          label: loading ? 'Cancelling...' : 'Cancel Plan',
          onClick: handleConfirm,
          variant: 'destructive',
          disabled: loading,
        },
      ]}
    >
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Are you sure you want to cancel this plan? This action will stop all progress tracking.
        </p>
        
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="font-medium">{plan.templateName}</p>
          <p className="text-sm text-muted-foreground mt-1">
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
    </PrimaryOffCanvas>
  );
}