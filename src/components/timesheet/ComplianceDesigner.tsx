import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Award, ExternalLink, ShieldAlert, Clock, Timer, CalendarDays, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';

export type FlagSeverity = 'warning' | 'critical';

export interface FlagThreshold {
  enabled: boolean;
  value: number;
  severity: FlagSeverity;
}

export interface ComplianceState {
  // Read-only reference to which Awards configuration applies (for the info banner)
  effectiveAwardLabel: string;
  effectiveAwardReference: string;
  // Validation thresholds — used to raise flags on timesheets (not pay logic)
  maxDailyHours: FlagThreshold;
  maxWeeklyHours: FlagThreshold;
  minRestBetweenShiftsHours: FlagThreshold;
  maxConsecutiveDays: FlagThreshold;
}

interface Props {
  value: ComplianceState;
  onChange: (next: ComplianceState) => void;
}

interface ThresholdDef {
  key: keyof Omit<ComplianceState, 'effectiveAwardLabel' | 'effectiveAwardReference'>;
  label: string;
  description: string;
  unit: string;
  icon: React.ElementType;
  comparison: 'exceeds' | 'falls below';
}

const THRESHOLDS: ThresholdDef[] = [
  {
    key: 'maxDailyHours',
    label: 'Daily hours limit',
    description: 'Flag a timesheet day when worked hours exceed this limit.',
    unit: 'hrs',
    icon: Clock,
    comparison: 'exceeds',
  },
  {
    key: 'maxWeeklyHours',
    label: 'Weekly hours limit',
    description: 'Flag a timesheet week when total hours exceed this limit.',
    unit: 'hrs',
    icon: CalendarDays,
    comparison: 'exceeds',
  },
  {
    key: 'minRestBetweenShiftsHours',
    label: 'Minimum rest between shifts',
    description: 'Flag when the gap between two consecutive shifts falls below this many hours.',
    unit: 'hrs',
    icon: Timer,
    comparison: 'falls below',
  },
  {
    key: 'maxConsecutiveDays',
    label: 'Consecutive workdays limit',
    description: 'Flag when staff work more than this number of days in a row without a rest day.',
    unit: 'days',
    icon: Sun,
    comparison: 'exceeds',
  },
];

export function ComplianceDesigner({ value, onChange }: Props) {
  const update = (key: ThresholdDef['key'], patch: Partial<FlagThreshold>) => {
    onChange({ ...value, [key]: { ...value[key], ...patch } });
  };

  return (
    <div className="space-y-6">
      {/* Award source — read-only reference */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Award className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="font-medium tracking-tight">Pay rules are managed in Awards</p>
                <p className="text-sm text-muted-foreground">
                  Overtime, penalty rates, casual loading, and minimum engagement come from your award configuration.
                  This tab only controls which conditions raise <span className="font-medium text-foreground">compliance flags</span> on a timesheet for reviewer attention.
                </p>
                <p className="text-xs text-muted-foreground pt-1">
                  Effective award: <span className="font-medium text-foreground">{value.effectiveAwardLabel}</span>
                  {value.effectiveAwardReference && (
                    <span className="text-muted-foreground"> ({value.effectiveAwardReference})</span>
                  )}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild className="gap-1.5 shrink-0">
              <Link to="/settings?tab=awards">
                <ExternalLink className="h-3.5 w-3.5" /> Manage Awards
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Flagging thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 tracking-tight">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Compliance flag thresholds
          </CardTitle>
          <CardDescription>
            When a timesheet breaches one of these limits, a flag is raised for the reviewer. These are validation rules — they do not affect pay.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y border rounded-md">
            {THRESHOLDS.map((def) => {
              const t = value[def.key];
              const Icon = def.icon;
              return (
                <div key={def.key as string} className="flex items-start gap-4 p-4">
                  <Icon className="h-4 w-4 text-primary mt-1 shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Label className="font-medium text-sm tracking-tight">{def.label}</Label>
                      {!t.enabled && (
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Disabled</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{def.description}</p>
                    {t.enabled && (
                      <div className="flex items-center gap-2 pt-2">
                        <span className="text-xs text-muted-foreground">Flag when value {def.comparison}</span>
                        <Input
                          type="number"
                          step={def.unit === 'hrs' ? 0.5 : 1}
                          value={t.value}
                          onChange={(e) => update(def.key, { value: Number(e.target.value) })}
                          className="h-8 w-20 text-right font-mono text-sm"
                          disabled={!t.enabled}
                        />
                        <span className="text-xs text-muted-foreground">{def.unit}</span>
                        <span className="text-xs text-muted-foreground mx-2">·</span>
                        <span className="text-xs text-muted-foreground">Severity</span>
                        <Select
                          value={t.severity}
                          onValueChange={(v: FlagSeverity) => update(def.key, { severity: v })}
                        >
                          <SelectTrigger className="h-8 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="warning">Warning</SelectItem>
                            <SelectItem value="critical">Critical (blocks approval)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <Switch
                    checked={t.enabled}
                    onCheckedChange={(checked) => update(def.key, { enabled: checked })}
                  />
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            <span className="font-medium text-foreground">Warning</span> flags surface in the reviewer panel but allow approval.
            <span className="font-medium text-foreground ml-2">Critical</span> flags must be resolved or explicitly overridden before approval.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export const defaultComplianceState: ComplianceState = {
  effectiveAwardLabel: 'General / Clerks',
  effectiveAwardReference: 'MA000002',
  maxDailyHours: { enabled: true, value: 10, severity: 'warning' },
  maxWeeklyHours: { enabled: true, value: 38, severity: 'warning' },
  minRestBetweenShiftsHours: { enabled: true, value: 10, severity: 'critical' },
  maxConsecutiveDays: { enabled: true, value: 6, severity: 'warning' },
};
