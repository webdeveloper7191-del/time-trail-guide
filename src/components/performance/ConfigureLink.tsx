import React from 'react';
import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Tabs available inside Performance Setup (PerformanceAdminPanel). */
export type PerfConfigSection =
  | 'scales'
  | 'competencies'
  | 'cycles'
  | 'lists'
  | 'ninebox'
  | 'rewards'
  | 'rules';

export const PERFORMANCE_CONFIG_EVENT = 'performance:open-config';

export interface PerformanceConfigTarget {
  section: PerfConfigSection;
  /** Optional DOM id of a rules section to scroll to. */
  anchor?: string;
}

/** Jump the Performance workspace to the matching Performance Setup tab. */
export function openPerformanceConfig(target: PerformanceConfigTarget) {
  window.dispatchEvent(new CustomEvent<PerformanceConfigTarget>(PERFORMANCE_CONFIG_EVENT, { detail: target }));
}

interface ConfigureLinkProps extends PerformanceConfigTarget {
  label?: string;
  className?: string;
}

/** Small inline link shown on a tab header that opens the relevant admin settings. */
export function ConfigureLink({ section, anchor, label = 'Configure', className }: ConfigureLinkProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={`h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground ${className ?? ''}`}
      onClick={() => openPerformanceConfig({ section, anchor })}
    >
      <Settings2 className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}
