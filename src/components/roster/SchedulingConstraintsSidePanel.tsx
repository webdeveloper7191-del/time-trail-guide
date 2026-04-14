import React, { useState, useCallback } from 'react';
import { Shield, HelpCircle } from 'lucide-react';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { SchedulingConstraintsPanel, SchedulingConstraintsPanelRef } from '@/components/settings/SchedulingConstraintsPanel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SchedulingConstraintsSidePanelProps {
  open: boolean;
  onClose: () => void;
}

export function SchedulingConstraintsSidePanel({ open, onClose }: SchedulingConstraintsSidePanelProps) {
  const [panelRef, setPanelRef] = useState<SchedulingConstraintsPanelRef | null>(null);

  const handleReady = useCallback((ref: SchedulingConstraintsPanelRef) => {
    setPanelRef(ref);
  }, []);

  return (
    <PrimaryOffCanvas
      title="Scheduling Constraints"
      description="Configure hard & soft constraints, contract templates, and location overrides"
      icon={Shield}
      size="4xl"
      open={open}
      onClose={onClose}
      isBackground
      headerActions={
        panelRef ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={panelRef.toggleHelp}
            className={cn(panelRef.showHelp && "bg-muted")}
          >
            <HelpCircle className="h-3.5 w-3.5 mr-1" /> How it works
          </Button>
        ) : null
      }
      actions={[
        {
          label: 'Reset',
          onClick: () => panelRef?.handleReset(),
          variant: 'secondary',
        },
        {
          label: 'Save',
          onClick: () => panelRef?.handleSave(),
          variant: 'default',
        },
      ]}
    >
      <SchedulingConstraintsPanel onReady={handleReady} />
    </PrimaryOffCanvas>
  );
}
