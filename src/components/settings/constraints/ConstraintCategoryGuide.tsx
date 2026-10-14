import { ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ConstraintCategory } from '@/types/schedulingConstraints';

const guides: Record<ConstraintCategory, { title: string; summary: string; sources: string[]; example: string }> = {
  coverage_staffing: {
    title: 'How many staff are needed?',
    summary: 'Coverage checks the staff required on a shift. Demand planning calculates requirements separately using demand and area staffing ratios.',
    sources: ['Demand data + area ratios', 'Generated or manually created shifts', 'Required staff per shift'],
    example: 'Example only: demand of 20 at a 1:5 ratio requires 4 staff. With 3 assigned, the shift is short by 1. The default headcount below is not a demand forecast.',
  },
  employee_matching: {
    title: 'Who can work each shift?',
    summary: 'Compare shift requirements with staff roles, qualifications and qualification expiry dates. These checks select suitable people; they do not set headcount.',
    sources: ['Staff roles + qualifications', 'Shift requirements', 'Suitable staff'],
    example: 'Example only: a shift requiring a current qualification should exclude staff whose qualification has expired. Mentor rules apply when a trainee needs support.',
  },
  work_limits: {
    title: 'How much work and rest is allowed?',
    summary: 'Work and rest limits are maintained in Contract templates. This overview shows those same values without asking you to enter them again.',
    sources: ['Contract limits by employment type', 'Roster-wide checks', 'Hours + rest validation'],
    example: 'Example only: different contracts can have different maximum hours and minimum rest. Review the applicable template rather than setting another global limit here.',
  },
  shift_rules: {
    title: 'What makes an assignment valid?',
    summary: 'Protect locked assignments, prevent overlaps and respect staff availability. Shift duration checks are separate from contract work totals.',
    sources: ['Shift times + locks', 'Leave + availability', 'Assignment checks'],
    example: 'Example only: two shifts that overlap cannot be worked by the same person. A minimum shift duration is different from the maximum hours allowed in a week.',
  },
  compliance: {
    title: 'Which employment conditions apply?',
    summary: 'Check award compatibility, employment types and public holiday eligibility. Pay rates and award tables remain in Awards settings and staff Pay Conditions.',
    sources: ['Staff award + employment type', 'Shift + holiday eligibility', 'Compliance checks'],
    example: 'These scheduling controls do not replace award pay tables. A scheduling preference for permanent staff is not permission to change an award entitlement.',
  },
  cost_optimization: {
    title: 'Which valid roster costs less?',
    summary: 'Set preferences for reducing overtime, penalty-rate exposure and travel. Cost preferences should be balanced with coverage and required rules.',
    sources: ['Staff rates + roster hours', 'Cost preferences', 'Roster cost comparison'],
    example: 'Example only: prefer an eligible person within ordinary hours over one who would incur overtime. A cost preference does not make an unsuitable person eligible.',
  },
  fairness_preferences: {
    title: 'How should work be shared?',
    summary: 'Balance hours, shift counts and less desirable shifts while respecting staff preferences. Fairness targets are preferences, not contracted-hour limits.',
    sources: ['Roster distribution + preferences', 'Balance targets', 'Fairness preferences'],
    example: 'Example only: spread weekend work across suitable staff instead of assigning every weekend to one person. Different contracted hours may still mean different workloads.',
  },
  operational_quality: {
    title: 'How stable should the roster remain?',
    summary: 'Set preferences for familiar staff, established teams and fewer assignment changes. These are explicit rules here, not automatically derived guarantees.',
    sources: ['Existing assignments + team preferences', 'Continuity priorities', 'Roster stability'],
    example: 'Example only: prefer retaining the same staff at a location where practical, while still respecting availability and required qualifications.',
  },
};

export function ConstraintCategoryGuide({ category, onContracts }: { category: ConstraintCategory; onContracts: () => void }) {
  const guide = guides[category];
  return (
    <section className="space-y-4 border-b border-border pb-5">
      <div>
        <h2 className="text-lg font-semibold">{guide.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{guide.summary}</p>
      </div>
      <ol className="flex flex-wrap items-center gap-2 text-xs">
        {guide.sources.map((source, index) => <li key={source} className="flex items-center gap-2"><span className="font-medium">{source}</span>{index < guide.sources.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}</li>)}
      </ol>
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer flex items-center gap-1.5 text-primary"><Info className="h-3.5 w-3.5" /> Context & example</summary>
        <p className="mt-2 leading-relaxed">{guide.example}</p>
      </details>
      {category === 'work_limits' && <Button variant="outline" size="sm" onClick={onContracts}>Review contract limits <ArrowRight className="ml-2 h-3.5 w-3.5" /></Button>}
    </section>
  );
}