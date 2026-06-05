import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Award, Globe, Clock, TrendingUp, Timer, DollarSign, UserCheck, Sparkles, RotateCcw, CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AWARD_PRESETS, AwardPreset, AwardTypeKey, formatPresetSummary } from '@/data/awardPresets';

type AustralianState = 'NSW' | 'VIC' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'NT' | 'ACT';

export interface ComplianceValues extends AwardPreset {}

export interface ComplianceState {
  state: AustralianState;
  awardType: AwardTypeKey;
  // Per-field overrides — undefined means "use award default"
  overrides: Partial<ComplianceValues>;
}

interface Props {
  value: ComplianceState;
  onChange: (next: ComplianceState) => void;
}

type FieldKey = keyof ComplianceValues;

interface FieldDef {
  key: FieldKey;
  label: string;
  unit: string;
  step?: number;
  hint?: string;
}

const SECTIONS: { id: string; title: string; description: string; icon: React.ElementType; fields: FieldDef[] }[] = [
  {
    id: 'hours',
    title: 'Working hours & rest',
    description: 'Maximum hours, span of a working day, and minimum rest between shifts.',
    icon: Clock,
    fields: [
      { key: 'maxDailyHours', label: 'Maximum daily hours', unit: 'hrs' },
      { key: 'maxWeeklyHours', label: 'Maximum weekly hours', unit: 'hrs' },
      { key: 'minRestBetweenShiftsHours', label: 'Minimum rest between shifts', unit: 'hrs', hint: 'NES baseline is 10h.' },
      { key: 'maxConsecutiveDays', label: 'Maximum consecutive workdays', unit: 'days' },
      { key: 'spanOfHoursMax', label: 'Span of hours (start to end)', unit: 'hrs' },
    ],
  },
  {
    id: 'ot',
    title: 'Overtime & double time',
    description: 'Thresholds and multipliers that trigger overtime pay.',
    icon: TrendingUp,
    fields: [
      { key: 'overtimeThresholdDaily', label: 'Daily OT threshold', unit: 'hrs', step: 0.1 },
      { key: 'overtimeThresholdWeekly', label: 'Weekly OT threshold', unit: 'hrs' },
      { key: 'overtimeMultiplier', label: 'Overtime rate', unit: '×', step: 0.1 },
      { key: 'doubleTimeThreshold', label: 'Double time after', unit: 'hrs', step: 0.5 },
      { key: 'doubleTimeMultiplier', label: 'Double time rate', unit: '×', step: 0.1 },
    ],
  },
  {
    id: 'penalties',
    title: 'Penalty rates',
    description: 'Multipliers applied on top of base hourly rate for weekends, public holidays, and night shift.',
    icon: DollarSign,
    fields: [
      { key: 'saturdayMultiplier', label: 'Saturday', unit: '×', step: 0.05 },
      { key: 'sundayMultiplier', label: 'Sunday', unit: '×', step: 0.05 },
      { key: 'publicHolidayMultiplier', label: 'Public holiday', unit: '×', step: 0.05 },
      { key: 'nightLoadingMultiplier', label: 'Night shift loading', unit: '×', step: 0.05 },
    ],
  },
  {
    id: 'casual',
    title: 'Casual & minimum engagement',
    description: 'Casual loading (typically 25%) and minimum hours paid per shift.',
    icon: UserCheck,
    fields: [
      { key: 'casualLoadingPercent', label: 'Casual loading', unit: '%' },
      { key: 'minEngagementHours', label: 'Minimum engagement per shift', unit: 'hrs', step: 0.5 },
    ],
  },
];

const STATES: AustralianState[] = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];

export function ComplianceDesigner({ value, onChange }: Props) {
  const preset = AWARD_PRESETS[value.awardType];
  const overrideCount = Object.keys(value.overrides).length;

  const effective: ComplianceValues = useMemo(
    () => ({ ...preset, ...value.overrides }),
    [preset, value.overrides]
  );

  const setOverride = (key: FieldKey, val: number) => {
    onChange({ ...value, overrides: { ...value.overrides, [key]: val } });
  };
  const clearOverride = (key: FieldKey) => {
    const next = { ...value.overrides };
    delete next[key];
    onChange({ ...value, overrides: next });
  };
  const clearAll = () => onChange({ ...value, overrides: {} });

  return (
    <div className="space-y-6">
      {/* Step 1 — Baseline */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 tracking-tight">
                <Sparkles className="h-5 w-5 text-primary" />
                Step 1 — Pick your baseline
              </CardTitle>
              <CardDescription className="mt-1">
                Choose your state and Modern Award. All compliance fields below auto-fill from this preset.
              </CardDescription>
            </div>
            <Badge variant="outline" className="gap-1 text-[10px] h-5">
              <Award className="h-3 w-3" /> Award-driven
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">State / Territory</Label>
              <Select
                value={value.state}
                onValueChange={(v: AustralianState) => onChange({ ...value, state: v })}
              >
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Modern Award</Label>
              <Select
                value={value.awardType}
                onValueChange={(v: AwardTypeKey) => onChange({ ...value, awardType: v })}
              >
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(AWARD_PRESETS) as AwardTypeKey[]).map(k => (
                    <SelectItem key={k} value={k}>
                      {AWARD_PRESETS[k].label} ({AWARD_PRESETS[k].reference})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border bg-muted/30 p-3 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-foreground/80">
              {formatPresetSummary(value.state, preset)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Step 2 — Overrides */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="tracking-tight">Step 2 — Override only what's different</CardTitle>
              <CardDescription className="mt-1">
                Every field uses the award default. Toggle <span className="font-medium text-foreground">Override</span> on a row to change it.
                Custom values are saved as location overrides and surface a <Badge variant="outline" className="ml-1 h-4 text-[10px] px-1 bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400">Custom</Badge> badge.
              </CardDescription>
            </div>
            {overrideCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearAll} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> Reset all ({overrideCount})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={['hours']} className="space-y-2">
            {SECTIONS.map(section => {
              const sectionOverrides = section.fields.filter(f => value.overrides[f.key] !== undefined).length;
              const Icon = section.icon;
              return (
                <AccordionItem key={section.id} value={section.id} className="border rounded-md px-3 data-[state=open]:bg-muted/20">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <Icon className="h-4 w-4 text-primary shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-sm tracking-tight">{section.title}</p>
                        <p className="text-xs text-muted-foreground font-normal">{section.description}</p>
                      </div>
                      {sectionOverrides > 0 ? (
                        <Badge variant="outline" className="bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400 h-5 text-[10px]">
                          {sectionOverrides} custom
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="h-5 text-[10px] text-muted-foreground">
                          Award default
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-3">
                    <div className="divide-y border rounded-md bg-background">
                      {section.fields.map(field => (
                        <FieldRow
                          key={field.key as string}
                          field={field}
                          presetValue={preset[field.key] as number}
                          overrideValue={value.overrides[field.key] as number | undefined}
                          effectiveValue={effective[field.key] as number}
                          onOverride={(v) => setOverride(field.key, v)}
                          onReset={() => clearOverride(field.key)}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Step 3 — Review */}
      {overrideCount > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm tracking-tight flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Active overrides
            </CardTitle>
            <CardDescription className="text-xs">
              These values replace the award default. Everything else inherits from <span className="font-medium">{preset.label}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {SECTIONS.flatMap(s => s.fields).filter(f => value.overrides[f.key] !== undefined).map(f => (
                <div key={f.key as string} className="flex items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-sm">
                  <span className="text-foreground/80">{f.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground line-through">
                      {preset[f.key]}{f.unit}
                    </span>
                    <span className="font-mono font-medium">
                      {value.overrides[f.key]}{f.unit}
                    </span>
                    <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs" onClick={() => clearOverride(f.key)}>
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface FieldRowProps {
  field: FieldDef;
  presetValue: number;
  overrideValue: number | undefined;
  effectiveValue: number;
  onOverride: (v: number) => void;
  onReset: () => void;
}

function FieldRow({ field, presetValue, overrideValue, effectiveValue, onOverride, onReset }: FieldRowProps) {
  const isOverride = overrideValue !== undefined;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium tracking-tight truncate">{field.label}</p>
        {field.hint && <p className="text-[11px] text-muted-foreground">{field.hint}</p>}
      </div>

      {!isOverride ? (
        <>
          <div className="text-right">
            <span className="font-mono text-sm">{presetValue}<span className="text-muted-foreground ml-0.5">{field.unit}</span></span>
          </div>
          <Badge variant="outline" className="h-5 text-[10px] text-muted-foreground shrink-0">
            <Award className="h-2.5 w-2.5 mr-1" /> Award
          </Badge>
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => onOverride(presetValue)}>
            Override
          </Button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step={field.step ?? 1}
              value={overrideValue}
              onChange={e => onOverride(Number(e.target.value))}
              className="h-8 w-20 text-right font-mono text-sm"
            />
            <span className="text-xs text-muted-foreground w-8">{field.unit}</span>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'h-5 text-[10px] shrink-0',
              'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400'
            )}
          >
            Custom
          </Badge>
          <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={onReset}>
            <RotateCcw className="h-3 w-3" /> Reset
          </Button>
        </>
      )}
    </div>
  );
}
