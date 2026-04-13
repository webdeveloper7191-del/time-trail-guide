import React from 'react';
import { Target, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// This section shows a summary of operational quality constraints
// that are derived from contract templates + other sections.
// It provides a read-only overview + links to relevant docs.

const qualityConstraints = [
  {
    code: 'S8',
    name: 'Preserve Pre-Assignments',
    description: 'Prefer retaining manually assigned employees to maintain trust & stability',
    source: 'Shift Rules → Mandatory/Optional',
    docLink: 'real-time-planning-preview#minimizing_disruption_due_to_real_time_planning',
  },
  {
    code: 'S12',
    name: 'Client-Specific Staff Preference',
    description: 'Prefer employees familiar with a client/site for better service quality',
    source: 'Staffing → Employee Selection',
    docLink: 'shift-service-constraints/shift-assignments/employee-selection#preferred_employee',
  },
  {
    code: 'S14',
    name: 'Continuity of Care / Service',
    description: 'Prefer same staff for same client/location to maintain care continuity',
    source: 'Staffing → Employee Selection',
    docLink: 'shift-service-constraints/shift-assignments/employee-selection#preferred_employee',
  },
  {
    code: 'S16',
    name: 'Reduce Roster Volatility',
    description: 'Penalise frequent reassignments to maintain operational stability',
    source: 'Shift Rules → Mandatory/Optional',
    docLink: 'real-time-planning-preview#minimizing_disruption_due_to_real_time_planning',
  },
  {
    code: 'S18',
    name: 'Team Cohesion',
    description: 'Prefer assigning known teams together for better productivity',
    source: 'Staffing → Employee Pairing',
    docLink: 'employee-resource-constraints/pairing-employees',
  },
  {
    code: 'S19',
    name: 'Managerial Override Respect',
    description: 'Penalise solver changes to manually curated rosters',
    source: 'Shift Rules → Mandatory/Optional',
    docLink: 'real-time-planning-preview#minimizing_disruption_due_to_real_time_planning',
  },
  {
    code: 'S20',
    name: 'Workforce Diversity Balance',
    description: 'Encourage balanced team composition for policy & ESG goals',
    source: 'Staffing → Shift Type Diversity',
    docLink: null,
  },
];

export function OperationalQualitySection() {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Operational Quality
        </h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          These constraints are derived from settings in other sections. They ensure continuity, stability, and team cohesion.
        </p>
      </div>

      <div className="space-y-2">
        {qualityConstraints.map(c => (
          <Card key={c.code}>
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="text-[10px] font-mono px-1.5 mt-0.5 border-amber-300 text-amber-600 shrink-0">
                  {c.code}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{c.name}</span>
                    <Badge variant="secondary" className="text-[9px] px-1.5">SOFT</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{c.description}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-muted-foreground">
                      Configured in: <span className="font-medium text-foreground">{c.source}</span>
                    </span>
                    {c.docLink && (
                      <a
                        href={`https://docs.timefold.ai/employee-shift-scheduling/latest/${c.docLink}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-primary hover:underline"
                      >
                        Timefold docs →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-blue-800 dark:text-blue-300">How these work</p>
              <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">
                Operational quality constraints are automatically enforced based on your Contract Templates, 
                Staffing & Matching, and Shift Rules configuration. Adjusting settings in those sections 
                directly affects how these quality metrics are scored by the solver.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
