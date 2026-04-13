import React, { useState } from 'react';
import {
  FileText, Plus, Trash2, ChevronDown, Clock, CalendarOff,
  RotateCcw, Info, Copy, GripVertical,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { ContractRule, WorkLimitConfig, TimeOffConfig, ShiftPatternConfig, Period, Satisfiability } from '@/types/timefoldConstraintConfig';

// ============= Satisfiability Badge =============

const SatisfiabilityToggle = ({ value, onChange }: { value: Satisfiability; onChange: (v: Satisfiability) => void }) => (
  <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
    <button
      onClick={() => onChange('REQUIRED')}
      className={cn(
        "px-2 py-0.5 text-[10px] font-medium rounded transition-all",
        value === 'REQUIRED'
          ? "bg-red-500 text-white shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      Required
    </button>
    <button
      onClick={() => onChange('PREFERRED')}
      className={cn(
        "px-2 py-0.5 text-[10px] font-medium rounded transition-all",
        value === 'PREFERRED'
          ? "bg-amber-500 text-white shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      Preferred
    </button>
  </div>
);

const PeriodSelect = ({ value, onChange }: { value: Period; onChange: (v: Period) => void }) => (
  <Select value={value} onValueChange={v => onChange(v as Period)}>
    <SelectTrigger className="h-7 w-24 text-xs">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="DAY" className="text-xs">Day</SelectItem>
      <SelectItem value="WEEK" className="text-xs">Week</SelectItem>
      <SelectItem value="MONTH" className="text-xs">Month</SelectItem>
    </SelectContent>
  </Select>
);

const MinutesToHours = ({ minutes }: { minutes?: number }) => {
  if (minutes === undefined) return null;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return <span className="text-[10px] text-muted-foreground ml-1">({hrs}h{mins > 0 ? ` ${mins}m` : ''})</span>;
};

// ============= Rule Row =============

interface RuleRowProps {
  label: string;
  tooltip?: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  children: React.ReactNode;
}

const RuleRow = ({ label, tooltip, enabled, onToggle, children }: RuleRowProps) => (
  <div className={cn(
    "flex items-start gap-3 p-2.5 rounded-lg border transition-all",
    enabled ? "bg-card border-border" : "bg-muted/30 border-border/40"
  )}>
    <div className="flex items-center gap-2 min-w-[200px] pt-0.5">
      <Switch checked={enabled} onCheckedChange={onToggle} className="scale-75" />
      <div className="flex items-center gap-1">
        <Label className={cn("text-xs font-medium", !enabled && "text-muted-foreground")}>{label}</Label>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
            <TooltipContent><p className="text-xs max-w-[250px]">{tooltip}</p></TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
    <div className={cn("flex-1 flex flex-wrap items-center gap-2", !enabled && "opacity-40 pointer-events-none")}>
      {children}
    </div>
  </div>
);

// ============= Work Limits Sub-Section =============

const WorkLimitsEditor = ({ config, onChange }: {
  config: WorkLimitConfig;
  onChange: (c: WorkLimitConfig) => void;
}) => {
  const update = <K extends keyof WorkLimitConfig>(key: K, val: WorkLimitConfig[K]) =>
    onChange({ ...config, [key]: val });

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground">Work Limits</span>
      </div>

      {/* Minutes per period */}
      <RuleRow
        label="Hours per Period"
        tooltip="Max/min working minutes in a day, week, or month"
        enabled={config.minutesPerPeriod.enabled}
        onToggle={v => update('minutesPerPeriod', { ...config.minutesPerPeriod, enabled: v })}
      >
        <PeriodSelect value={config.minutesPerPeriod.period} onChange={v => update('minutesPerPeriod', { ...config.minutesPerPeriod, period: v })} />
        <div className="flex items-center gap-1">
          <Label className="text-[10px] text-muted-foreground">Min</Label>
          <Input type="number" value={config.minutesPerPeriod.minMinutes ?? 0}
            onChange={e => update('minutesPerPeriod', { ...config.minutesPerPeriod, minMinutes: Number(e.target.value) })}
            className="h-7 w-16 text-xs" min={0} />
          <MinutesToHours minutes={config.minutesPerPeriod.minMinutes} />
        </div>
        <div className="flex items-center gap-1">
          <Label className="text-[10px] text-muted-foreground">Max</Label>
          <Input type="number" value={config.minutesPerPeriod.maxMinutes ?? 2400}
            onChange={e => update('minutesPerPeriod', { ...config.minutesPerPeriod, maxMinutes: Number(e.target.value) })}
            className="h-7 w-16 text-xs" min={0} />
          <MinutesToHours minutes={config.minutesPerPeriod.maxMinutes} />
        </div>
        <SatisfiabilityToggle value={config.minutesPerPeriod.satisfiability}
          onChange={v => update('minutesPerPeriod', { ...config.minutesPerPeriod, satisfiability: v })} />
      </RuleRow>

      {/* Days per period */}
      <RuleRow
        label="Days per Period"
        tooltip="Min/max working days in a period"
        enabled={config.daysPerPeriod.enabled}
        onToggle={v => update('daysPerPeriod', { ...config.daysPerPeriod, enabled: v })}
      >
        <PeriodSelect value={config.daysPerPeriod.period} onChange={v => update('daysPerPeriod', { ...config.daysPerPeriod, period: v })} />
        <div className="flex items-center gap-1">
          <Label className="text-[10px] text-muted-foreground">Min</Label>
          <Input type="number" value={config.daysPerPeriod.minDays ?? 0}
            onChange={e => update('daysPerPeriod', { ...config.daysPerPeriod, minDays: Number(e.target.value) })}
            className="h-7 w-14 text-xs" min={0} max={7} />
        </div>
        <div className="flex items-center gap-1">
          <Label className="text-[10px] text-muted-foreground">Max</Label>
          <Input type="number" value={config.daysPerPeriod.maxDays ?? 5}
            onChange={e => update('daysPerPeriod', { ...config.daysPerPeriod, maxDays: Number(e.target.value) })}
            className="h-7 w-14 text-xs" min={0} max={7} />
        </div>
        <SatisfiabilityToggle value={config.daysPerPeriod.satisfiability}
          onChange={v => update('daysPerPeriod', { ...config.daysPerPeriod, satisfiability: v })} />
      </RuleRow>

      {/* Consecutive days */}
      <RuleRow
        label="Consecutive Days Limit"
        tooltip="Maximum consecutive working days before a mandatory rest day"
        enabled={config.consecutiveDaysWorked.enabled}
        onToggle={v => update('consecutiveDaysWorked', { ...config.consecutiveDaysWorked, enabled: v })}
      >
        <div className="flex items-center gap-1">
          <Label className="text-[10px] text-muted-foreground">Max</Label>
          <Input type="number" value={config.consecutiveDaysWorked.maxConsecutiveDays}
            onChange={e => update('consecutiveDaysWorked', { ...config.consecutiveDaysWorked, maxConsecutiveDays: Number(e.target.value) })}
            className="h-7 w-14 text-xs" min={1} max={14} />
          <span className="text-[10px] text-muted-foreground">days</span>
        </div>
        <SatisfiabilityToggle value={config.consecutiveDaysWorked.satisfiability}
          onChange={v => update('consecutiveDaysWorked', { ...config.consecutiveDaysWorked, satisfiability: v })} />
      </RuleRow>

      {/* Weekend limits */}
      <RuleRow
        label="Weekend Limits"
        tooltip="Limit weekends worked per month and consecutive weekends"
        enabled={config.weekendLimits.enabled}
        onToggle={v => update('weekendLimits', { ...config.weekendLimits, enabled: v })}
      >
        <div className="flex items-center gap-1">
          <Label className="text-[10px] text-muted-foreground">Max/period</Label>
          <Input type="number" value={config.weekendLimits.maxWeekendsPerPeriod ?? 2}
            onChange={e => update('weekendLimits', { ...config.weekendLimits, maxWeekendsPerPeriod: Number(e.target.value) })}
            className="h-7 w-14 text-xs" min={0} max={5} />
        </div>
        <PeriodSelect value={config.weekendLimits.period} onChange={v => update('weekendLimits', { ...config.weekendLimits, period: v })} />
        <div className="flex items-center gap-1">
          <Label className="text-[10px] text-muted-foreground">Max consec.</Label>
          <Input type="number" value={config.weekendLimits.maxConsecutiveWeekends ?? 2}
            onChange={e => update('weekendLimits', { ...config.weekendLimits, maxConsecutiveWeekends: Number(e.target.value) })}
            className="h-7 w-14 text-xs" min={0} />
        </div>
      </RuleRow>

      {/* Shifts per period */}
      <RuleRow
        label="Shifts per Period"
        tooltip="Min/max number of shifts in a period"
        enabled={config.shiftsPerPeriod.enabled}
        onToggle={v => update('shiftsPerPeriod', { ...config.shiftsPerPeriod, enabled: v })}
      >
        <PeriodSelect value={config.shiftsPerPeriod.period} onChange={v => update('shiftsPerPeriod', { ...config.shiftsPerPeriod, period: v })} />
        <div className="flex items-center gap-1">
          <Label className="text-[10px] text-muted-foreground">Min</Label>
          <Input type="number" value={config.shiftsPerPeriod.minShifts ?? 0}
            onChange={e => update('shiftsPerPeriod', { ...config.shiftsPerPeriod, minShifts: Number(e.target.value) })}
            className="h-7 w-14 text-xs" min={0} />
        </div>
        <div className="flex items-center gap-1">
          <Label className="text-[10px] text-muted-foreground">Max</Label>
          <Input type="number" value={config.shiftsPerPeriod.maxShifts ?? 5}
            onChange={e => update('shiftsPerPeriod', { ...config.shiftsPerPeriod, maxShifts: Number(e.target.value) })}
            className="h-7 w-14 text-xs" min={0} />
        </div>
        <SatisfiabilityToggle value={config.shiftsPerPeriod.satisfiability}
          onChange={v => update('shiftsPerPeriod', { ...config.shiftsPerPeriod, satisfiability: v })} />
      </RuleRow>

      {/* Rolling window - minutes */}
      <RuleRow
        label="Rolling Window (Hours)"
        tooltip="Max minutes in a rolling N-day window"
        enabled={config.minutesRollingWindow.enabled}
        onToggle={v => update('minutesRollingWindow', { ...config.minutesRollingWindow, enabled: v })}
      >
        <div className="flex items-center gap-1">
          <Label className="text-[10px] text-muted-foreground">Window</Label>
          <Input type="number" value={config.minutesRollingWindow.windowDays}
            onChange={e => update('minutesRollingWindow', { ...config.minutesRollingWindow, windowDays: Number(e.target.value) })}
            className="h-7 w-14 text-xs" min={1} max={28} />
          <span className="text-[10px] text-muted-foreground">days</span>
        </div>
        <div className="flex items-center gap-1">
          <Label className="text-[10px] text-muted-foreground">Max</Label>
          <Input type="number" value={config.minutesRollingWindow.maxMinutes ?? 2400}
            onChange={e => update('minutesRollingWindow', { ...config.minutesRollingWindow, maxMinutes: Number(e.target.value) })}
            className="h-7 w-16 text-xs" min={0} />
          <MinutesToHours minutes={config.minutesRollingWindow.maxMinutes} />
        </div>
        <SatisfiabilityToggle value={config.minutesRollingWindow.satisfiability}
          onChange={v => update('minutesRollingWindow', { ...config.minutesRollingWindow, satisfiability: v })} />
      </RuleRow>
    </div>
  );
};

// ============= Time Off Sub-Section =============

const TimeOffEditor = ({ config, onChange }: {
  config: TimeOffConfig;
  onChange: (c: TimeOffConfig) => void;
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 mb-1">
      <CalendarOff className="h-3.5 w-3.5 text-primary" />
      <span className="text-xs font-semibold text-foreground">Time Off & Rest</span>
    </div>

    {/* Min time between shifts */}
    <div className="flex items-center gap-3 p-2.5 rounded-lg border bg-card">
      <Label className="text-xs font-medium min-w-[200px]">Min Rest Between Shifts</Label>
      <Input type="number" value={config.minTimeBetweenShiftsMinutes}
        onChange={e => onChange({ ...config, minTimeBetweenShiftsMinutes: Number(e.target.value) })}
        className="h-7 w-16 text-xs" min={0} max={1440} />
      <span className="text-[10px] text-muted-foreground">minutes</span>
      <MinutesToHours minutes={config.minTimeBetweenShiftsMinutes} />
    </div>

    {/* Days off per period */}
    <RuleRow
      label="Days Off per Period"
      tooltip="Minimum days off in a week/month"
      enabled={config.daysOffPerPeriod.enabled}
      onToggle={v => onChange({ ...config, daysOffPerPeriod: { ...config.daysOffPerPeriod, enabled: v } })}
    >
      <PeriodSelect value={config.daysOffPerPeriod.period}
        onChange={v => onChange({ ...config, daysOffPerPeriod: { ...config.daysOffPerPeriod, period: v } })} />
      <div className="flex items-center gap-1">
        <Label className="text-[10px] text-muted-foreground">Min</Label>
        <Input type="number" value={config.daysOffPerPeriod.minDaysOff}
          onChange={e => onChange({ ...config, daysOffPerPeriod: { ...config.daysOffPerPeriod, minDaysOff: Number(e.target.value) } })}
          className="h-7 w-14 text-xs" min={0} max={7} />
        <span className="text-[10px] text-muted-foreground">days</span>
      </div>
      <SatisfiabilityToggle value={config.daysOffPerPeriod.satisfiability}
        onChange={v => onChange({ ...config, daysOffPerPeriod: { ...config.daysOffPerPeriod, satisfiability: v } })} />
    </RuleRow>

    {/* Consecutive days off */}
    <RuleRow
      label="Consecutive Days Off"
      tooltip="Minimum consecutive rest days per period"
      enabled={config.consecutiveDaysOff.enabled}
      onToggle={v => onChange({ ...config, consecutiveDaysOff: { ...config.consecutiveDaysOff, enabled: v } })}
    >
      <PeriodSelect value={config.consecutiveDaysOff.period}
        onChange={v => onChange({ ...config, consecutiveDaysOff: { ...config.consecutiveDaysOff, period: v } })} />
      <div className="flex items-center gap-1">
        <Label className="text-[10px] text-muted-foreground">Min</Label>
        <Input type="number" value={config.consecutiveDaysOff.minConsecutiveDaysOff}
          onChange={e => onChange({ ...config, consecutiveDaysOff: { ...config.consecutiveDaysOff, minConsecutiveDaysOff: Number(e.target.value) } })}
          className="h-7 w-14 text-xs" min={0} max={7} />
        <span className="text-[10px] text-muted-foreground">days</span>
      </div>
      <SatisfiabilityToggle value={config.consecutiveDaysOff.satisfiability}
        onChange={v => onChange({ ...config, consecutiveDaysOff: { ...config.consecutiveDaysOff, satisfiability: v } })} />
    </RuleRow>
  </div>
);

// ============= Shift Patterns Sub-Section =============

const ShiftPatternsEditor = ({ config, onChange }: {
  config: ShiftPatternConfig;
  onChange: (c: ShiftPatternConfig) => void;
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 mb-1">
      <RotateCcw className="h-3.5 w-3.5 text-primary" />
      <span className="text-xs font-semibold text-foreground">Shift Patterns</span>
    </div>

    <div className="flex items-center gap-3 p-2.5 rounded-lg border bg-card">
      <Label className="text-xs font-medium min-w-[200px]">Min Gap Between Shifts</Label>
      <Input type="number" value={config.minTimeBetweenShiftsMinutes}
        onChange={e => onChange({ ...config, minTimeBetweenShiftsMinutes: Number(e.target.value) })}
        className="h-7 w-16 text-xs" min={0} max={1440} />
      <span className="text-[10px] text-muted-foreground">minutes</span>
      <MinutesToHours minutes={config.minTimeBetweenShiftsMinutes} />
    </div>

    <RuleRow
      label="Shift Rotations"
      tooltip="Enforce rotation patterns across the schedule"
      enabled={config.shiftRotations.enabled}
      onToggle={v => onChange({ ...config, shiftRotations: { ...config.shiftRotations, enabled: v } })}
    >
      <div className="flex items-center gap-2">
        <Switch checked={config.shiftRotations.enforceRotationPattern}
          onCheckedChange={v => onChange({ ...config, shiftRotations: { ...config.shiftRotations, enforceRotationPattern: v } })}
          className="scale-75" />
        <Label className="text-[10px] text-muted-foreground">Enforce pattern</Label>
      </div>
    </RuleRow>

    <RuleRow
      label="Split Shifts"
      tooltip="Allow split shifts with configurable gaps"
      enabled={config.splitShifts.enabled}
      onToggle={v => onChange({ ...config, splitShifts: { ...config.splitShifts, enabled: v } })}
    >
      <div className="flex items-center gap-1">
        <Label className="text-[10px] text-muted-foreground">Min gap</Label>
        <Input type="number" value={config.splitShifts.minGapBetweenPartsMinutes}
          onChange={e => onChange({ ...config, splitShifts: { ...config.splitShifts, minGapBetweenPartsMinutes: Number(e.target.value) } })}
          className="h-7 w-16 text-xs" min={0} />
        <span className="text-[10px] text-muted-foreground">min</span>
      </div>
      <div className="flex items-center gap-1">
        <Label className="text-[10px] text-muted-foreground">Max gap</Label>
        <Input type="number" value={config.splitShifts.maxGapBetweenPartsMinutes}
          onChange={e => onChange({ ...config, splitShifts: { ...config.splitShifts, maxGapBetweenPartsMinutes: Number(e.target.value) } })}
          className="h-7 w-16 text-xs" min={0} />
        <span className="text-[10px] text-muted-foreground">min</span>
      </div>
    </RuleRow>

    <RuleRow
      label="On-Call Shifts"
      tooltip="Configure on-call shift behavior"
      enabled={config.onCallShifts.enabled}
      onToggle={v => onChange({ ...config, onCallShifts: { ...config.onCallShifts, enabled: v } })}
    >
      <div className="flex items-center gap-2">
        <Switch checked={config.onCallShifts.countAsWorkedTime}
          onCheckedChange={v => onChange({ ...config, onCallShifts: { ...config.onCallShifts, countAsWorkedTime: v } })}
          className="scale-75" />
        <Label className="text-[10px] text-muted-foreground">Count as worked time</Label>
      </div>
    </RuleRow>
  </div>
);

// ============= Single Contract Card =============

const ContractCard = ({ contract, onUpdate, onDelete, onDuplicate }: {
  contract: ContractRule;
  onUpdate: (c: ContractRule) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);

  const priorityColors: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-700 border-red-200',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
    NORMAL: 'bg-blue-100 text-blue-700 border-blue-200',
    LOW: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  const empTypeLabels: Record<string, string> = {
    full_time: 'Full Time',
    part_time: 'Part Time',
    casual: 'Casual',
    agency: 'Agency',
    contractor: 'Contractor',
  };

  return (
    <Card className={cn("transition-all", expanded && "ring-1 ring-primary/20")}>
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <FileText className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{contract.name}</span>
            <Badge className={cn("text-[10px] px-1.5", priorityColors[contract.priority])}>
              {contract.priority}
            </Badge>
            <Badge variant="outline" className="text-[10px] px-1.5">
              {empTypeLabels[contract.employmentType] || contract.employmentType}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {contract.workLimits.minutesPerPeriod.enabled
              ? `${Math.round((contract.workLimits.minutesPerPeriod.maxMinutes ?? 0) / 60)}h max/${contract.workLimits.minutesPerPeriod.period.toLowerCase()}`
              : 'No hour limits'}
            {' · '}
            {contract.timeOffRules.daysOffPerPeriod.enabled
              ? `${contract.timeOffRules.daysOffPerPeriod.minDaysOff} days off/${contract.timeOffRules.daysOffPerPeriod.period.toLowerCase()}`
              : 'No time off rules'}
            {' · '}
            Rest: {Math.round(contract.timeOffRules.minTimeBetweenShiftsMinutes / 60)}h
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); onDuplicate(); }}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Duplicate</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={e => { e.stopPropagation(); onDelete(); }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
        </div>
      </div>

      {expanded && (
        <CardContent className="pt-0 space-y-4 border-t mx-4 px-0 pb-4 mt-0 pt-4">
          {/* Contract identity */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Contract Name</Label>
              <Input value={contract.name}
                onChange={e => onUpdate({ ...contract, name: e.target.value })}
                className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Employment Type</Label>
              <Select value={contract.employmentType}
                onValueChange={v => onUpdate({ ...contract, employmentType: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(empTypeLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Priority (1=highest)</Label>
              <Select value={contract.priority}
                onValueChange={v => onUpdate({ ...contract, priority: v as any })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CRITICAL" className="text-xs">Critical (10×)</SelectItem>
                  <SelectItem value="HIGH" className="text-xs">High (7×)</SelectItem>
                  <SelectItem value="NORMAL" className="text-xs">Normal (4×)</SelectItem>
                  <SelectItem value="LOW" className="text-xs">Low (1×)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Work Limits */}
          <WorkLimitsEditor
            config={contract.workLimits}
            onChange={wl => onUpdate({ ...contract, workLimits: wl })}
          />

          <Separator />

          {/* Time Off */}
          <TimeOffEditor
            config={contract.timeOffRules}
            onChange={to => onUpdate({ ...contract, timeOffRules: to })}
          />

          <Separator />

          {/* Shift Patterns */}
          <ShiftPatternsEditor
            config={contract.shiftPatterns}
            onChange={sp => onUpdate({ ...contract, shiftPatterns: sp })}
          />
        </CardContent>
      )}
    </Card>
  );
};

// ============= Main Section =============

interface ContractTemplatesSectionProps {
  contracts: ContractRule[];
  onChange: (contracts: ContractRule[]) => void;
}

export function ContractTemplatesSection({ contracts, onChange }: ContractTemplatesSectionProps) {
  const addContract = () => {
    const newContract: ContractRule = {
      id: `contract-${Date.now()}`,
      name: 'New Contract',
      priority: 'NORMAL',
      employmentType: 'full_time',
      workLimits: {
        enabled: true,
        minutesPerPeriod: { enabled: true, period: 'WEEK', minMinutes: 0, maxMinutes: 2400, satisfiability: 'REQUIRED' },
        minutesRollingWindow: { enabled: false, windowDays: 7, satisfiability: 'PREFERRED' },
        daysPerPeriod: { enabled: true, period: 'WEEK', minDays: 0, maxDays: 5, satisfiability: 'REQUIRED' },
        daysRollingWindow: { enabled: false, windowDays: 14, satisfiability: 'PREFERRED' },
        shiftsPerPeriod: { enabled: false, period: 'WEEK', satisfiability: 'PREFERRED' },
        weekendLimits: { enabled: false, maxWeekendsPerPeriod: 2, period: 'MONTH', maxConsecutiveWeekends: 2, maxWeekendMinutes: 960 },
        consecutiveDaysWorked: { enabled: true, maxConsecutiveDays: 6, satisfiability: 'REQUIRED' },
      },
      timeOffRules: {
        enabled: true,
        minTimeBetweenShiftsMinutes: 600,
        consecutiveDaysOff: { enabled: true, minConsecutiveDaysOff: 2, period: 'WEEK', satisfiability: 'PREFERRED' },
        daysOffPerPeriod: { enabled: true, period: 'WEEK', minDaysOff: 2, satisfiability: 'PREFERRED' },
      },
      shiftPatterns: {
        enabled: true,
        minTimeBetweenShiftsMinutes: 600,
        shiftRotations: { enabled: false, enforceRotationPattern: false },
        splitShifts: { enabled: false, minGapBetweenPartsMinutes: 60, maxGapBetweenPartsMinutes: 240 },
        onCallShifts: { enabled: false, countAsWorkedTime: false },
      },
    };
    onChange([...contracts, newContract]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Contract Templates
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Define work limits, time off, and shift patterns per employment contract type.
            Each rule can be Required (hard) or Preferred (soft with priority weighting).
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={addContract}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Contract
        </Button>
      </div>

      <div className="space-y-2">
        {contracts.map((contract, i) => (
          <ContractCard
            key={contract.id}
            contract={contract}
            onUpdate={c => {
              const next = [...contracts];
              next[i] = c;
              onChange(next);
            }}
            onDelete={() => onChange(contracts.filter((_, j) => j !== i))}
            onDuplicate={() => {
              const dup = { ...contract, id: `contract-${Date.now()}`, name: `${contract.name} (Copy)` };
              onChange([...contracts, dup]);
            }}
          />
        ))}
        {contracts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No contract templates defined</p>
            <p className="text-xs">Add a contract to configure work limits and time off rules</p>
          </div>
        )}
      </div>
    </div>
  );
}
