import React from 'react';
import {
  Calendar, Shield, Lock, Layers, Timer, Users, AlertTriangle,
  Info,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type {
  ShiftPriorityConfig,
  ShiftSelectionConfig,
  BreakConfig,
  AlternativeShiftsConfig,
} from '@/types/timefoldConstraintConfig';

interface ShiftRulesSectionProps {
  shiftPriority: ShiftPriorityConfig;
  shiftSelection: ShiftSelectionConfig;
  breaks: BreakConfig;
  alternativeShifts: AlternativeShiftsConfig;
  onUpdate: (key: string, value: any) => void;
}

const ConstraintCard = ({ icon: Icon, title, description, enabled, onToggle, children }: {
  icon: React.ElementType;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  children?: React.ReactNode;
}) => (
  <Card className={cn("transition-all", !enabled && "opacity-60")}>
    <CardContent className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-md", enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <span className="text-sm font-semibold">{title}</span>
            <p className="text-[11px] text-muted-foreground">{description}</p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>
      {enabled && children && (
        <div className="pl-9 space-y-2.5 pt-1">
          {children}
        </div>
      )}
    </CardContent>
  </Card>
);

const InlineField = ({ label, tooltip, children }: { label: string; tooltip?: string; children: React.ReactNode }) => (
  <div className="flex items-center gap-2">
    <div className="flex items-center gap-1 min-w-[180px]">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {tooltip && (
        <Tooltip>
          <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
          <TooltipContent><p className="text-xs max-w-[220px]">{tooltip}</p></TooltipContent>
        </Tooltip>
      )}
    </div>
    {children}
  </div>
);

export function ShiftRulesSection({
  shiftPriority, shiftSelection, breaks, alternativeShifts, onUpdate,
}: ShiftRulesSectionProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Shift Rules
        </h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Control shift priorities, overlaps, breaks, and assignment rules.
        </p>
      </div>

      {/* Mandatory/Optional Shifts */}
      <ConstraintCard
        icon={AlertTriangle}
        title="Mandatory & Optional Shifts"
        description="Set priority levels and mandatory assignment requirements"
        enabled={shiftPriority.enabled}
        onToggle={v => onUpdate('shiftPriority', { ...shiftPriority, enabled: v })}
      >
        <InlineField label="Use shift priorities">
          <Switch checked={shiftPriority.usePriorities}
            onCheckedChange={v => onUpdate('shiftPriority', { ...shiftPriority, usePriorities: v })} />
        </InlineField>
        <InlineField label="Mandatory shifts must be assigned" tooltip="Hard constraint: all mandatory shifts will be filled">
          <Switch checked={shiftPriority.mandatoryShiftsMustBeAssigned}
            onCheckedChange={v => onUpdate('shiftPriority', { ...shiftPriority, mandatoryShiftsMustBeAssigned: v })} />
          {shiftPriority.mandatoryShiftsMustBeAssigned && (
            <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] px-1.5">HARD</Badge>
          )}
        </InlineField>
        <InlineField label="Optional shifts can be skipped">
          <Switch checked={shiftPriority.optionalShiftsCanBeSkipped}
            onCheckedChange={v => onUpdate('shiftPriority', { ...shiftPriority, optionalShiftsCanBeSkipped: v })} />
        </InlineField>
      </ConstraintCard>

      {/* Shift Selection (concurrent / limits) */}
      <ConstraintCard
        icon={Layers}
        title="Shift Selection & Limits"
        description="Control concurrent shifts and per-period shift limits"
        enabled={shiftSelection.enabled}
        onToggle={v => onUpdate('shiftSelection', { ...shiftSelection, enabled: v })}
      >
        <InlineField label="Concurrent shift limit" tooltip="Max shifts an employee can work simultaneously">
          <Switch checked={shiftSelection.concurrentShiftRules.enabled}
            onCheckedChange={v => onUpdate('shiftSelection', {
              ...shiftSelection,
              concurrentShiftRules: { ...shiftSelection.concurrentShiftRules, enabled: v },
            })} />
          {shiftSelection.concurrentShiftRules.enabled && (
            <Input type="number" value={shiftSelection.concurrentShiftRules.maxConcurrentShifts}
              onChange={e => onUpdate('shiftSelection', {
                ...shiftSelection,
                concurrentShiftRules: { ...shiftSelection.concurrentShiftRules, maxConcurrentShifts: Number(e.target.value) },
              })}
              className="h-7 w-14 text-xs" min={1} max={5} />
          )}
        </InlineField>
        <InlineField label="Limit by employee type">
          <Switch checked={shiftSelection.limitByEmployeeType.enabled}
            onCheckedChange={v => onUpdate('shiftSelection', {
              ...shiftSelection,
              limitByEmployeeType: { ...shiftSelection.limitByEmployeeType, enabled: v },
            })} />
        </InlineField>
        <InlineField label="Limit by shift type">
          <Switch checked={shiftSelection.limitByShiftType.enabled}
            onCheckedChange={v => onUpdate('shiftSelection', {
              ...shiftSelection,
              limitByShiftType: { ...shiftSelection.limitByShiftType, enabled: v },
            })} />
        </InlineField>
      </ConstraintCard>

      {/* Breaks */}
      <ConstraintCard
        icon={Timer}
        title="Shift Breaks"
        description="Break duration rules and deduction from worked time"
        enabled={breaks.enabled}
        onToggle={v => onUpdate('breaks', { ...breaks, enabled: v })}
      >
        <InlineField label="Deduct breaks from worked time" tooltip="Unlogged breaks won't count toward period limits">
          <Switch checked={breaks.deductBreaksFromWorkedTime}
            onCheckedChange={v => onUpdate('breaks', { ...breaks, deductBreaksFromWorkedTime: v })} />
        </InlineField>
        <InlineField label="Min shift for break">
          <Input type="number" value={breaks.defaultBreakRules.minShiftDurationForBreakMinutes}
            onChange={e => onUpdate('breaks', {
              ...breaks,
              defaultBreakRules: { ...breaks.defaultBreakRules, minShiftDurationForBreakMinutes: Number(e.target.value) },
            })}
            className="h-7 w-16 text-xs" min={0} />
          <span className="text-[10px] text-muted-foreground">min ({Math.round(breaks.defaultBreakRules.minShiftDurationForBreakMinutes / 60)}h)</span>
        </InlineField>
        <InlineField label="Break duration">
          <Input type="number" value={breaks.defaultBreakRules.breakDurationMinutes}
            onChange={e => onUpdate('breaks', {
              ...breaks,
              defaultBreakRules: { ...breaks.defaultBreakRules, breakDurationMinutes: Number(e.target.value) },
            })}
            className="h-7 w-16 text-xs" min={0} />
          <span className="text-[10px] text-muted-foreground">minutes</span>
        </InlineField>
      </ConstraintCard>

      {/* Alternative Shifts */}
      <ConstraintCard
        icon={Lock}
        title="Alternative Shifts"
        description="Allow flexible time slots for shift groups"
        enabled={alternativeShifts.enabled}
        onToggle={v => onUpdate('alternativeShifts', { ...alternativeShifts, enabled: v })}
      >
        <InlineField label="Allow shift groups">
          <Switch checked={alternativeShifts.allowShiftGroups}
            onCheckedChange={v => onUpdate('alternativeShifts', { ...alternativeShifts, allowShiftGroups: v })} />
        </InlineField>
        <InlineField label="Max alternatives per group">
          <Input type="number" value={alternativeShifts.maxAlternativesPerGroup}
            onChange={e => onUpdate('alternativeShifts', { ...alternativeShifts, maxAlternativesPerGroup: Number(e.target.value) })}
            className="h-7 w-14 text-xs" min={1} max={10} />
        </InlineField>
      </ConstraintCard>
    </div>
  );
}
