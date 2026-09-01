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

/** Which Performance Setup section each workspace tab should open. */
export const tabConfigTargets: Record<string, PerformanceConfigTarget & { label: string }> = {
  plans: { section: 'rules', anchor: 'rules-plans', label: 'Configure plans' },
  goals: { section: 'rules', anchor: 'rules-goals', label: 'Configure goals' },
  'goal-recommendations': { section: 'lists', label: 'Configure categories' },
  okr: { section: 'lists', label: 'Configure OKR levels' },
  lms: { section: 'rules', anchor: 'rules-learning', label: 'Configure learning' },
  pip: { section: 'rules', anchor: 'rules-pip', label: 'Configure PIPs' },
  reviews: { section: 'scales', label: 'Configure rating scales' },
  feedback: { section: 'competencies', label: 'Configure competencies' },
  '360feedback': { section: 'rules', anchor: 'rules-feedback360', label: 'Configure 360°' },
  calibration: { section: 'rules', anchor: 'rules-reviews', label: 'Configure calibration' },
  recognition: { section: 'rewards', label: 'Configure rewards' },
  happiness: { section: 'rules', anchor: 'rules-happiness', label: 'Configure check-ins' },
  pulse: { section: 'rules', anchor: 'rules-surveys', label: 'Configure surveys' },
  wellbeing: { section: 'rules', anchor: 'rules-wellbeing', label: 'Configure thresholds' },
  nominations: { section: 'rewards', label: 'Configure nominations' },
  mentorship: { section: 'rules', anchor: 'rules-mentorship', label: 'Configure matching' },
  budget: { section: 'rules', anchor: 'rules-budget', label: 'Configure budget' },
  talent: { section: 'ninebox', label: 'Configure talent grid' },
  skills: { section: 'lists', label: 'Configure skills' },
  'career-pathing': { section: 'rules', anchor: 'rules-career', label: 'Configure career paths' },
  succession: { section: 'rules', anchor: 'rules-talent', label: 'Configure succession' },
  conversations: { section: 'lists', label: 'Configure 1:1 types' },
  analytics: { section: 'rules', anchor: 'rules-analytics', label: 'Configure analytics' },
  sentiment: { section: 'rules', anchor: 'rules-sentiment', label: 'Configure lexicon' },
  benchmarking: { section: 'rules', anchor: 'rules-benchmarking', label: 'Configure benchmarks' },
  compensation: { section: 'rules', anchor: 'rules-compensation', label: 'Configure bands' },
};
