import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from 'lucide-react';
import { AssignedPlan, planTypeLabels } from '@/types/performancePlan';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection, FormField } from '@/components/ui/off-canvas/FormSection';

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
          variant: 'secondary',
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
      {/* Warning Section */}
      <FormSection title="Confirmation Required" tooltip="This action cannot be undone">
        <p className="text-sm text-muted-foreground">
          Are you sure you want to cancel this plan? This action will stop all progress tracking.
        </p>
        
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="font-medium">{plan.templateName}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {planTypeLabels[plan.type]}
          </p>
        </div>
      </FormSection>

      {/* Reason Section */}
      <FormSection title="Cancellation Details">
        <FormField label="Reason for Cancellation" tooltip="Optional but recommended for record keeping">
          <Textarea
            id="cancel-reason"
            placeholder="Enter reason for cancelling this plan..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </FormField>
      </FormSection>
    </PrimaryOffCanvas>
  );
}