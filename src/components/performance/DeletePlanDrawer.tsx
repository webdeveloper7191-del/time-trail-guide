import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection } from '@/components/ui/off-canvas/FormSection';

interface DeletePlanDrawerProps {
  open: boolean;
  title: string;
  description: string;
  itemName: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeletePlanDrawer({
  open,
  title,
  description,
  itemName,
  confirmLabel = 'Delete',
  loading = false,
  onConfirm,
  onCancel,
}: DeletePlanDrawerProps) {
  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onCancel}
      title={title}
      icon={AlertTriangle}
      size="md"
      actions={[
        {
          label: 'Cancel',
          onClick: onCancel,
          variant: 'secondary',
          disabled: loading,
        },
        {
          label: loading ? 'Deleting...' : confirmLabel,
          onClick: onConfirm,
          variant: 'destructive',
          disabled: loading,
        },
      ]}
    >
      <FormSection title="Confirm Deletion" tooltip="This action cannot be undone">
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
        
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <p className="font-medium">{itemName}</p>
        </div>
      </FormSection>
    </PrimaryOffCanvas>
  );
}