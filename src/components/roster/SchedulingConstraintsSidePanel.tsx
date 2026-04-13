import React from 'react';
import { Shield } from 'lucide-react';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { SchedulingConstraintsPanel } from '@/components/settings/SchedulingConstraintsPanel';

interface SchedulingConstraintsSidePanelProps {
  open: boolean;
  onClose: () => void;
}

export function SchedulingConstraintsSidePanel({ open, onClose }: SchedulingConstraintsSidePanelProps) {
  return (
    <PrimaryOffCanvas
      title="Scheduling Constraints"
      description="Configure hard & soft constraints, contract templates, and location overrides"
      icon={Shield}
      size="4xl"
      open={open}
      onClose={onClose}
      isBackground
      actions={[]}
    >
      <SchedulingConstraintsPanel />
    </PrimaryOffCanvas>
  );
}
