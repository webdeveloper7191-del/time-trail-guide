import React from 'react';
import {
  UserCheck, CalendarCheck, Award, Users, Star, Layers, Info,
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
  AvailabilityConfig,
  SkillsConfig,
  EmployeePriorityConfig,
  PairingConfig,
  ActivationConfig,
  EmployeeSelectionConfig,
  ShiftTypeDiversityConfig,
} from '@/types/timefoldConstraintConfig';

interface StaffingMatchingSectionProps {
  availability: AvailabilityConfig;
  skills: SkillsConfig;
  priority: EmployeePriorityConfig;
  pairing: PairingConfig;
  activation: ActivationConfig;
  employeeSelection: EmployeeSelectionConfig;
  shiftTypeDiversity: ShiftTypeDiversityConfig;
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

export function StaffingMatchingSection({
  availability, skills, priority, pairing, activation, employeeSelection, shiftTypeDiversity, onUpdate,
}: StaffingMatchingSectionProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-primary" />
          Staffing & Matching
        </h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Skills, availability, employee pairing, and activation controls.
        </p>
      </div>

      {/* Skills */}
      <ConstraintCard
        icon={Award}
        title="Skills & Risk Factors"
        description="Match required/preferred skills and manage risk"
        enabled={skills.enabled}
        onToggle={v => onUpdate('skills', { ...skills, enabled: v })}
      >
        <InlineField label="Required skills enforced" tooltip="Hard constraint: employee must have all required skills">
          <Switch checked={skills.requiredSkillsEnforced}
            onCheckedChange={v => onUpdate('skills', { ...skills, requiredSkillsEnforced: v })} />
          {skills.requiredSkillsEnforced && (
            <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] px-1.5">HARD</Badge>
          )}
        </InlineField>
        <InlineField label="Skill match strategy">
          <Select value={skills.skillMatchStrategy}
            onValueChange={v => onUpdate('skills', { ...skills, skillMatchStrategy: v })}>
            <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">All Required</SelectItem>
              <SelectItem value="ANY" className="text-xs">Any Match</SelectItem>
            </SelectContent>
          </Select>
        </InlineField>
        <InlineField label="Preferred skills weight">
          <Slider value={[skills.preferredSkillsWeight]} onValueChange={([v]) => onUpdate('skills', { ...skills, preferredSkillsWeight: v })}
            min={0} max={100} step={5} className="w-32" />
          <span className="text-xs font-mono w-8 text-right">{skills.preferredSkillsWeight}</span>
        </InlineField>
        <InlineField label="Prohibit high-risk assignments" tooltip="Hard constraint: block high-risk employee/shift combos">
          <Switch checked={skills.riskFactors.enabled}
            onCheckedChange={v => onUpdate('skills', { ...skills, riskFactors: { ...skills.riskFactors, enabled: v } })} />
        </InlineField>
        {skills.riskFactors.enabled && (
          <>
            <InlineField label="  Block high risk">
              <Switch checked={skills.riskFactors.prohibitHighRisk}
                onCheckedChange={v => onUpdate('skills', { ...skills, riskFactors: { ...skills.riskFactors, prohibitHighRisk: v } })} />
              {skills.riskFactors.prohibitHighRisk && <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">HARD</Badge>}
            </InlineField>
            <InlineField label="  Penalise moderate risk">
              <Switch checked={skills.riskFactors.penalizeModerateRisk}
                onCheckedChange={v => onUpdate('skills', { ...skills, riskFactors: { ...skills.riskFactors, penalizeModerateRisk: v } })} />
              {skills.riskFactors.penalizeModerateRisk && <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">SOFT</Badge>}
            </InlineField>
          </>
        )}
      </ConstraintCard>

      {/* Availability */}
      <ConstraintCard
        icon={CalendarCheck}
        title="Employee Availability"
        description="Respect unavailability windows and scheduling preferences"
        enabled={availability.enabled}
        onToggle={v => onUpdate('availability', { ...availability, enabled: v })}
      >
        <InlineField label="Respect unavailability" tooltip="Hard constraint: never assign during unavailable windows">
          <Switch checked={availability.respectUnavailability}
            onCheckedChange={v => onUpdate('availability', { ...availability, respectUnavailability: v })} />
          {availability.respectUnavailability && <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">HARD</Badge>}
        </InlineField>
        <InlineField label="Prefer available slots">
          <Switch checked={availability.preferAvailableSlots}
            onCheckedChange={v => onUpdate('availability', { ...availability, preferAvailableSlots: v })} />
        </InlineField>
        <InlineField label="Allow preferences">
          <Switch checked={availability.allowPreferences}
            onCheckedChange={v => onUpdate('availability', { ...availability, allowPreferences: v })} />
        </InlineField>
        {availability.allowPreferences && (
          <InlineField label="Preference weight">
            <Slider value={[availability.preferenceWeight]} onValueChange={([v]) => onUpdate('availability', { ...availability, preferenceWeight: v })}
              min={0} max={100} step={5} className="w-32" />
            <span className="text-xs font-mono w-8 text-right">{availability.preferenceWeight}</span>
          </InlineField>
        )}
      </ConstraintCard>

      {/* Employee Selection */}
      <ConstraintCard
        icon={Star}
        title="Employee Selection Preferences"
        description="Preferred, unpreferred, or prohibited employees per shift"
        enabled={employeeSelection.enabled}
        onToggle={v => onUpdate('employeeSelection', { ...employeeSelection, enabled: v })}
      >
        <InlineField label="Preferred employees (reward)">
          <Switch checked={employeeSelection.preferredEmployees}
            onCheckedChange={v => onUpdate('employeeSelection', { ...employeeSelection, preferredEmployees: v })} />
          <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">SOFT +</Badge>
        </InlineField>
        <InlineField label="Unpreferred employees (penalise)">
          <Switch checked={employeeSelection.unpreferredEmployees}
            onCheckedChange={v => onUpdate('employeeSelection', { ...employeeSelection, unpreferredEmployees: v })} />
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">SOFT −</Badge>
        </InlineField>
        <InlineField label="Prohibited employees (block)">
          <Switch checked={employeeSelection.prohibitedEmployees}
            onCheckedChange={v => onUpdate('employeeSelection', { ...employeeSelection, prohibitedEmployees: v })} />
          {employeeSelection.prohibitedEmployees && <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">HARD</Badge>}
        </InlineField>
      </ConstraintCard>

      {/* Employee Priority */}
      <ConstraintCard
        icon={Star}
        title="Employee Priority"
        description="Weight employees differently based on priority level"
        enabled={priority.enabled}
        onToggle={v => onUpdate('priority', { ...priority, enabled: v })}
      >
        <InlineField label="Priority multiplier" tooltip="How much more weight higher-priority employees get">
          <Input type="number" value={priority.higherPriorityWeight}
            onChange={e => onUpdate('priority', { ...priority, higherPriorityWeight: Number(e.target.value) })}
            className="h-7 w-14 text-xs" min={1} max={10} />
          <span className="text-[10px] text-muted-foreground">× multiplier</span>
        </InlineField>
      </ConstraintCard>

      {/* Pairing */}
      <ConstraintCard
        icon={Users}
        title="Employee Pairing"
        description="Required, preferred, or prohibited pairings"
        enabled={pairing.enabled}
        onToggle={v => onUpdate('pairing', { ...pairing, enabled: v })}
      >
        <p className="text-[11px] text-muted-foreground">
          {pairing.pairs.length} pairing rules configured. Manage pairings in the Employee section.
        </p>
      </ConstraintCard>

      {/* Activation */}
      <ConstraintCard
        icon={UserCheck}
        title="Employee Activation"
        description="Optimise which employees are scheduled and their utilisation"
        enabled={activation.enabled}
        onToggle={v => onUpdate('activation', { ...activation, enabled: v })}
      >
        <InlineField label="Minimise activated employees">
          <Switch checked={activation.minimizeActivatedEmployees}
            onCheckedChange={v => onUpdate('activation', { ...activation, minimizeActivatedEmployees: v })} />
        </InlineField>
        <InlineField label="Maximise saturation" tooltip="Prefer fully utilising active employees over spreading thin">
          <Switch checked={activation.maximizeActivatedSaturation}
            onCheckedChange={v => onUpdate('activation', { ...activation, maximizeActivatedSaturation: v })} />
        </InlineField>
        {activation.activationRatio.enabled && (
          <InlineField label="Activation ratio range">
            <Input type="number" value={activation.activationRatio.minRatio}
              onChange={e => onUpdate('activation', {
                ...activation,
                activationRatio: { ...activation.activationRatio, minRatio: Number(e.target.value) },
              })}
              className="h-7 w-16 text-xs" min={0} max={1} step={0.1} />
            <span className="text-[10px] text-muted-foreground">to</span>
            <Input type="number" value={activation.activationRatio.maxRatio}
              onChange={e => onUpdate('activation', {
                ...activation,
                activationRatio: { ...activation.activationRatio, maxRatio: Number(e.target.value) },
              })}
              className="h-7 w-16 text-xs" min={0} max={1} step={0.1} />
          </InlineField>
        )}
      </ConstraintCard>

      {/* Shift Type Diversity */}
      <ConstraintCard
        icon={Layers}
        title="Shift Type Diversity"
        description="Limit variety of shift types assigned per employee"
        enabled={shiftTypeDiversity.enabled}
        onToggle={v => onUpdate('shiftTypeDiversity', { ...shiftTypeDiversity, enabled: v })}
      >
        {shiftTypeDiversity.limitShiftTypePerPeriod.enabled && (
          <InlineField label="Max shift types per employee">
            <Select value={shiftTypeDiversity.limitShiftTypePerPeriod.period}
              onValueChange={v => onUpdate('shiftTypeDiversity', {
                ...shiftTypeDiversity,
                limitShiftTypePerPeriod: { ...shiftTypeDiversity.limitShiftTypePerPeriod, period: v },
              })}>
              <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DAY" className="text-xs">Day</SelectItem>
                <SelectItem value="WEEK" className="text-xs">Week</SelectItem>
                <SelectItem value="MONTH" className="text-xs">Month</SelectItem>
              </SelectContent>
            </Select>
            <Input type="number" value={shiftTypeDiversity.limitShiftTypePerPeriod.maxShiftTypesPerEmployee}
              onChange={e => onUpdate('shiftTypeDiversity', {
                ...shiftTypeDiversity,
                limitShiftTypePerPeriod: { ...shiftTypeDiversity.limitShiftTypePerPeriod, maxShiftTypesPerEmployee: Number(e.target.value) },
              })}
              className="h-7 w-14 text-xs" min={1} max={10} />
          </InlineField>
        )}
      </ConstraintCard>
    </div>
  );
}
