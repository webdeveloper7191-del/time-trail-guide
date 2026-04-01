import React, { useState } from 'react';
import {
  FileText, CalendarCheck, Star, Users, MapPin, Coffee,
  UserCheck, Scale, Layers, ArrowLeftRight, DollarSign,
  TrendingUp, AlertTriangle, Award, ListChecks, UserPlus,
  Save, RotateCcw, ChevronRight, Info, Shield, Settings2,
  Sparkles, Check,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  TimefoldConstraintConfiguration,
  defaultConstraintConfig,
  constraintCategoryLabels,
  constraintCategoryDescriptions,
  type Satisfiability,
  type Period,
} from '@/types/timefoldConstraintConfig';

const iconMap: Record<string, React.ElementType> = {
  FileText, CalendarCheck, Star, Users, MapPin, Coffee,
  UserCheck, Scale, Layers, ArrowLeftRight, DollarSign,
  TrendingUp, AlertTriangle, Award, ListChecks, UserPlus,
};

// ============= Shared Sub-Components =============

const SectionToggle = ({ label, description, enabled, onToggle, badge, children }: {
  label: string; description: string; enabled: boolean; onToggle: (v: boolean) => void;
  badge?: string; children?: React.ReactNode;
}) => (
  <div className="space-y-3">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{label}</span>
          {badge && <Badge variant="outline" className="text-[10px] px-1.5">{badge}</Badge>}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch checked={enabled} onCheckedChange={onToggle} />
    </div>
    {enabled && children && <div className="pl-4 border-l-2 border-primary/20 space-y-3 mt-2">{children}</div>}
  </div>
);

const NumberField = ({ label, value, onChange, unit, min, max, tooltip }: {
  label: string; value: number | undefined; onChange: (v: number) => void;
  unit?: string; min?: number; max?: number; tooltip?: string;
}) => (
  <div className="flex items-center gap-2">
    <div className="flex items-center gap-1 min-w-[140px]">
      <Label className="text-xs text-muted-foreground whitespace-nowrap">{label}</Label>
      {tooltip && (
        <Tooltip><TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
          <TooltipContent><p className="text-xs max-w-[200px]">{tooltip}</p></TooltipContent></Tooltip>
      )}
    </div>
    <Input type="number" value={value ?? ''} onChange={e => onChange(Number(e.target.value))}
      className="h-8 w-24 text-xs" min={min} max={max} />
    {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
  </div>
);

const SelectField = ({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) => (
  <div className="flex items-center gap-2">
    <Label className="text-xs text-muted-foreground min-w-[140px]">{label}</Label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map(o => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  </div>
);

const periodOptions = [
  { value: 'DAY', label: 'Day' }, { value: 'WEEK', label: 'Week' },
  { value: 'MONTH', label: 'Month' }, { value: 'YEAR', label: 'Year' },
];
const satisfiabilityOptions = [
  { value: 'REQUIRED', label: 'Required (Hard)' }, { value: 'PREFERRED', label: 'Preferred (Soft)' },
];

const WeightSlider = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <div className="space-y-1">
    <div className="flex justify-between">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <span className="text-xs font-medium text-foreground">{value}</span>
    </div>
    <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={0} max={100} step={1} className="w-full" />
  </div>
);

// ============= Category Section Components =============

const ConstraintCategory = ({ iconName, label, description, enabled, onToggle, children }: {
  iconName: string; label: string; description: string; enabled: boolean;
  onToggle: (v: boolean) => void; children: React.ReactNode;
}) => {
  const Icon = iconMap[iconName] || Settings2;
  return (
    <AccordionItem value={label} className="border rounded-lg px-4 mb-2">
      <AccordionTrigger className="hover:no-underline py-3">
        <div className="flex items-center gap-3 flex-1">
          <div className={cn("p-1.5 rounded-md", enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{label}</span>
              <Badge variant={enabled ? "default" : "secondary"} className="text-[10px] px-1.5">
                {enabled ? 'Active' : 'Off'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{description}</p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-4">
        <div className="flex items-center justify-between mb-3 pt-1">
          <Label className="text-xs font-medium">Enable this constraint</Label>
          <Switch checked={enabled} onCheckedChange={onToggle} />
        </div>
        {enabled && <div className="space-y-4">{children}</div>}
      </AccordionContent>
    </AccordionItem>
  );
};

// ============= Main Component =============

export function TimefoldConstraintConfigPanel() {
  const [config, setConfig] = useState<TimefoldConstraintConfiguration>(defaultConstraintConfig);
  const [activeTab, setActiveTab] = useState('employee');

  const updateEmployee = <K extends keyof TimefoldConstraintConfiguration['employeeConstraints']>(
    key: K, updater: (prev: TimefoldConstraintConfiguration['employeeConstraints'][K]) => TimefoldConstraintConfiguration['employeeConstraints'][K]
  ) => {
    setConfig(prev => ({
      ...prev,
      employeeConstraints: { ...prev.employeeConstraints, [key]: updater(prev.employeeConstraints[key]) },
    }));
  };

  const updateShift = <K extends keyof TimefoldConstraintConfiguration['shiftConstraints']>(
    key: K, updater: (prev: TimefoldConstraintConfiguration['shiftConstraints'][K]) => TimefoldConstraintConfiguration['shiftConstraints'][K]
  ) => {
    setConfig(prev => ({
      ...prev,
      shiftConstraints: { ...prev.shiftConstraints, [key]: updater(prev.shiftConstraints[key]) },
    }));
  };

  const handleSave = () => {
    toast.success('Constraint configuration saved successfully');
  };

  const handleReset = () => {
    setConfig(defaultConstraintConfig);
    toast.info('Configuration reset to defaults');
  };

  const ec = config.employeeConstraints;
  const sc = config.shiftConstraints;

  const employeeActiveCount = Object.values(ec).filter(v => v.enabled).length;
  const shiftActiveCount = Object.values(sc).filter(v => v.enabled).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Timefold Constraint Configuration
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure employee resource constraints and shift service constraints for the AI solver.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="h-3.5 w-3.5 mr-1" /> Save
          </Button>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          These constraints map directly to the{' '}
          <a href="https://docs.timefold.ai/employee-shift-scheduling/latest/" target="_blank" rel="noreferrer"
            className="text-primary underline">Timefold Employee Shift Scheduling API</a>.
          Hard constraints cannot be violated. Soft constraints are penalized with configurable weights.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="employee" className="text-xs">
            Employee Constraints
            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{employeeActiveCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="shift" className="text-xs">
            Shift Constraints
            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{shiftActiveCount}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* ==================== EMPLOYEE CONSTRAINTS ==================== */}
        <TabsContent value="employee" className="mt-3">
          <Accordion type="multiple" className="space-y-0">

            {/* --- Contracts / Work Limits --- */}
            <ConstraintCategory iconName="FileText" label={constraintCategoryLabels.contracts}
              description={constraintCategoryDescriptions.contracts}
              enabled={ec.contracts.enabled}
              onToggle={v => updateEmployee('contracts', p => ({ ...p, enabled: v }))}>
              
              {ec.contracts.contracts.map((contract, ci) => (
                <Card key={contract.id} className="bg-muted/30">
                  <CardContent className="p-3 space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">{contract.name}</Badge>
                      <span className="text-[10px] text-muted-foreground">({contract.employmentType})</span>
                    </div>

                    {/* Work Limits */}
                    <SectionToggle label="Minutes per Period" description="Limit total minutes worked in a fixed period"
                      badge="Work Limit" enabled={contract.workLimits.minutesPerPeriod.enabled}
                      onToggle={v => updateEmployee('contracts', p => {
                        const c = [...p.contracts]; c[ci] = { ...c[ci], workLimits: { ...c[ci].workLimits, minutesPerPeriod: { ...c[ci].workLimits.minutesPerPeriod, enabled: v } } }; return { ...p, contracts: c };
                      })}>
                      <SelectField label="Period" value={contract.workLimits.minutesPerPeriod.period}
                        onChange={v => updateEmployee('contracts', p => { const c = [...p.contracts]; c[ci] = { ...c[ci], workLimits: { ...c[ci].workLimits, minutesPerPeriod: { ...c[ci].workLimits.minutesPerPeriod, period: v as Period } } }; return { ...p, contracts: c }; })}
                        options={periodOptions} />
                      <NumberField label="Min Minutes" value={contract.workLimits.minutesPerPeriod.minMinutes} unit="min"
                        onChange={v => updateEmployee('contracts', p => { const c = [...p.contracts]; c[ci] = { ...c[ci], workLimits: { ...c[ci].workLimits, minutesPerPeriod: { ...c[ci].workLimits.minutesPerPeriod, minMinutes: v } } }; return { ...p, contracts: c }; })} />
                      <NumberField label="Max Minutes" value={contract.workLimits.minutesPerPeriod.maxMinutes} unit="min"
                        onChange={v => updateEmployee('contracts', p => { const c = [...p.contracts]; c[ci] = { ...c[ci], workLimits: { ...c[ci].workLimits, minutesPerPeriod: { ...c[ci].workLimits.minutesPerPeriod, maxMinutes: v } } }; return { ...p, contracts: c }; })} />
                      <SelectField label="Satisfiability" value={contract.workLimits.minutesPerPeriod.satisfiability}
                        onChange={v => updateEmployee('contracts', p => { const c = [...p.contracts]; c[ci] = { ...c[ci], workLimits: { ...c[ci].workLimits, minutesPerPeriod: { ...c[ci].workLimits.minutesPerPeriod, satisfiability: v as Satisfiability } } }; return { ...p, contracts: c }; })}
                        options={satisfiabilityOptions} />
                    </SectionToggle>

                    <Separator />

                    <SectionToggle label="Days per Period" description="Limit days worked in a fixed period"
                      badge="Work Limit" enabled={contract.workLimits.daysPerPeriod.enabled}
                      onToggle={v => updateEmployee('contracts', p => { const c = [...p.contracts]; c[ci] = { ...c[ci], workLimits: { ...c[ci].workLimits, daysPerPeriod: { ...c[ci].workLimits.daysPerPeriod, enabled: v } } }; return { ...p, contracts: c }; })}>
                      <SelectField label="Period" value={contract.workLimits.daysPerPeriod.period}
                        onChange={v => updateEmployee('contracts', p => { const c = [...p.contracts]; c[ci] = { ...c[ci], workLimits: { ...c[ci].workLimits, daysPerPeriod: { ...c[ci].workLimits.daysPerPeriod, period: v as Period } } }; return { ...p, contracts: c }; })}
                        options={periodOptions} />
                      <NumberField label="Max Days" value={contract.workLimits.daysPerPeriod.maxDays} unit="days"
                        onChange={v => updateEmployee('contracts', p => { const c = [...p.contracts]; c[ci] = { ...c[ci], workLimits: { ...c[ci].workLimits, daysPerPeriod: { ...c[ci].workLimits.daysPerPeriod, maxDays: v } } }; return { ...p, contracts: c }; })} />
                      <SelectField label="Satisfiability" value={contract.workLimits.daysPerPeriod.satisfiability}
                        onChange={v => updateEmployee('contracts', p => { const c = [...p.contracts]; c[ci] = { ...c[ci], workLimits: { ...c[ci].workLimits, daysPerPeriod: { ...c[ci].workLimits.daysPerPeriod, satisfiability: v as Satisfiability } } }; return { ...p, contracts: c }; })}
                        options={satisfiabilityOptions} />
                    </SectionToggle>

                    <Separator />

                    <SectionToggle label="Consecutive Days" description="Max consecutive days an employee can work"
                      badge="Work Limit" enabled={contract.workLimits.consecutiveDaysWorked.enabled}
                      onToggle={v => updateEmployee('contracts', p => { const c = [...p.contracts]; c[ci] = { ...c[ci], workLimits: { ...c[ci].workLimits, consecutiveDaysWorked: { ...c[ci].workLimits.consecutiveDaysWorked, enabled: v } } }; return { ...p, contracts: c }; })}>
                      <NumberField label="Max Consecutive" value={contract.workLimits.consecutiveDaysWorked.maxConsecutiveDays} unit="days"
                        onChange={v => updateEmployee('contracts', p => { const c = [...p.contracts]; c[ci] = { ...c[ci], workLimits: { ...c[ci].workLimits, consecutiveDaysWorked: { ...c[ci].workLimits.consecutiveDaysWorked, maxConsecutiveDays: v } } }; return { ...p, contracts: c }; })} />
                    </SectionToggle>

                    <Separator />

                    <SectionToggle label="Weekend Limits" description="Limit weekend work frequency"
                      badge="Work Limit" enabled={contract.workLimits.weekendLimits.enabled}
                      onToggle={v => updateEmployee('contracts', p => { const c = [...p.contracts]; c[ci] = { ...c[ci], workLimits: { ...c[ci].workLimits, weekendLimits: { ...c[ci].workLimits.weekendLimits, enabled: v } } }; return { ...p, contracts: c }; })}>
                      <NumberField label="Max Weekends" value={contract.workLimits.weekendLimits.maxWeekendsPerPeriod} unit="per period"
                        onChange={v => updateEmployee('contracts', p => { const c = [...p.contracts]; c[ci] = { ...c[ci], workLimits: { ...c[ci].workLimits, weekendLimits: { ...c[ci].workLimits.weekendLimits, maxWeekendsPerPeriod: v } } }; return { ...p, contracts: c }; })} />
                      <NumberField label="Max Consecutive" value={contract.workLimits.weekendLimits.maxConsecutiveWeekends}
                        onChange={v => updateEmployee('contracts', p => { const c = [...p.contracts]; c[ci] = { ...c[ci], workLimits: { ...c[ci].workLimits, weekendLimits: { ...c[ci].workLimits.weekendLimits, maxConsecutiveWeekends: v } } }; return { ...p, contracts: c }; })} />
                    </SectionToggle>

                    <Separator />

                    {/* Time Off */}
                    <SectionToggle label="Time Off Rules" description="Min rest between shifts and days off requirements"
                      badge="Time Off" enabled={contract.timeOffRules.enabled}
                      onToggle={v => updateEmployee('contracts', p => { const c = [...p.contracts]; c[ci] = { ...c[ci], timeOffRules: { ...c[ci].timeOffRules, enabled: v } }; return { ...p, contracts: c }; })}>
                      <NumberField label="Min Rest Between Shifts" value={contract.timeOffRules.minTimeBetweenShiftsMinutes} unit="min"
                        onChange={v => updateEmployee('contracts', p => { const c = [...p.contracts]; c[ci] = { ...c[ci], timeOffRules: { ...c[ci].timeOffRules, minTimeBetweenShiftsMinutes: v } }; return { ...p, contracts: c }; })}
                        tooltip="Minimum minutes of rest between end of one shift and start of next" />
                      <NumberField label="Min Consecutive Days Off" value={contract.timeOffRules.consecutiveDaysOff.minConsecutiveDaysOff} unit="days"
                        onChange={v => updateEmployee('contracts', p => { const c = [...p.contracts]; c[ci] = { ...c[ci], timeOffRules: { ...c[ci].timeOffRules, consecutiveDaysOff: { ...c[ci].timeOffRules.consecutiveDaysOff, minConsecutiveDaysOff: v } } }; return { ...p, contracts: c }; })} />
                      <NumberField label="Min Days Off per Period" value={contract.timeOffRules.daysOffPerPeriod.minDaysOff} unit="days"
                        onChange={v => updateEmployee('contracts', p => { const c = [...p.contracts]; c[ci] = { ...c[ci], timeOffRules: { ...c[ci].timeOffRules, daysOffPerPeriod: { ...c[ci].timeOffRules.daysOffPerPeriod, minDaysOff: v } } }; return { ...p, contracts: c }; })} />
                    </SectionToggle>

                    <Separator />

                    {/* Shift Patterns */}
                    <SectionToggle label="Shift Patterns" description="Rotations, split shifts, and on-call configuration"
                      badge="Patterns" enabled={contract.shiftPatterns.enabled}
                      onToggle={v => updateEmployee('contracts', p => { const c = [...p.contracts]; c[ci] = { ...c[ci], shiftPatterns: { ...c[ci].shiftPatterns, enabled: v } }; return { ...p, contracts: c }; })}>
                      <NumberField label="Min Time Between Shifts" value={contract.shiftPatterns.minTimeBetweenShiftsMinutes} unit="min"
                        onChange={v => updateEmployee('contracts', p => { const c = [...p.contracts]; c[ci] = { ...c[ci], shiftPatterns: { ...c[ci].shiftPatterns, minTimeBetweenShiftsMinutes: v } }; return { ...p, contracts: c }; })} />
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Enable Shift Rotations</Label>
                        <Switch checked={contract.shiftPatterns.shiftRotations.enabled}
                          onCheckedChange={v => updateEmployee('contracts', p => { const c = [...p.contracts]; c[ci] = { ...c[ci], shiftPatterns: { ...c[ci].shiftPatterns, shiftRotations: { ...c[ci].shiftPatterns.shiftRotations, enabled: v } } }; return { ...p, contracts: c }; })} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Enable Split Shifts</Label>
                        <Switch checked={contract.shiftPatterns.splitShifts.enabled}
                          onCheckedChange={v => updateEmployee('contracts', p => { const c = [...p.contracts]; c[ci] = { ...c[ci], shiftPatterns: { ...c[ci].shiftPatterns, splitShifts: { ...c[ci].shiftPatterns.splitShifts, enabled: v } } }; return { ...p, contracts: c }; })} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Enable On-Call Shifts</Label>
                        <Switch checked={contract.shiftPatterns.onCallShifts.enabled}
                          onCheckedChange={v => updateEmployee('contracts', p => { const c = [...p.contracts]; c[ci] = { ...c[ci], shiftPatterns: { ...c[ci].shiftPatterns, onCallShifts: { ...c[ci].shiftPatterns.onCallShifts, enabled: v } } }; return { ...p, contracts: c }; })} />
                      </div>
                    </SectionToggle>
                  </CardContent>
                </Card>
              ))}
            </ConstraintCategory>

            {/* --- Availability --- */}
            <ConstraintCategory iconName="CalendarCheck" label={constraintCategoryLabels.availability}
              description={constraintCategoryDescriptions.availability}
              enabled={ec.availability.enabled}
              onToggle={v => updateEmployee('availability', p => ({ ...p, enabled: v }))}>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium">Respect Unavailability</Label>
                  <p className="text-[10px] text-muted-foreground">Hard constraint — never schedule during unavailable times</p>
                </div>
                <Switch checked={ec.availability.respectUnavailability}
                  onCheckedChange={v => updateEmployee('availability', p => ({ ...p, respectUnavailability: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium">Prefer Available Slots</Label>
                  <p className="text-[10px] text-muted-foreground">Soft constraint — prefer scheduling when available</p>
                </div>
                <Switch checked={ec.availability.preferAvailableSlots}
                  onCheckedChange={v => updateEmployee('availability', p => ({ ...p, preferAvailableSlots: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium">Allow Preferences</Label>
                  <p className="text-[10px] text-muted-foreground">Let employees express preferred/unpreferred times</p>
                </div>
                <Switch checked={ec.availability.allowPreferences}
                  onCheckedChange={v => updateEmployee('availability', p => ({ ...p, allowPreferences: v }))} />
              </div>
              {ec.availability.allowPreferences && (
                <WeightSlider label="Preference Weight" value={ec.availability.preferenceWeight}
                  onChange={v => updateEmployee('availability', p => ({ ...p, preferenceWeight: v }))} />
              )}
            </ConstraintCategory>

            {/* --- Priority --- */}
            <ConstraintCategory iconName="Star" label={constraintCategoryLabels.priority}
              description={constraintCategoryDescriptions.priority}
              enabled={ec.priority.enabled}
              onToggle={v => updateEmployee('priority', p => ({ ...p, enabled: v }))}>
              <NumberField label="Higher Priority Weight" value={ec.priority.higherPriorityWeight} unit="x multiplier"
                onChange={v => updateEmployee('priority', p => ({ ...p, higherPriorityWeight: v }))}
                tooltip="How much more weight higher-priority employees get for preference constraints" />
              <div className="flex flex-wrap gap-1.5 mt-1">
                {ec.priority.priorityLevels.map(l => (
                  <Badge key={l} variant="outline" className="text-[10px]">{l}</Badge>
                ))}
              </div>
            </ConstraintCategory>

            {/* --- Pairing --- */}
            <ConstraintCategory iconName="Users" label={constraintCategoryLabels.pairing}
              description={constraintCategoryDescriptions.pairing}
              enabled={ec.pairing.enabled}
              onToggle={v => updateEmployee('pairing', p => ({ ...p, enabled: v }))}>
              <p className="text-xs text-muted-foreground">
                Configure required, preferred, unpreferred, or prohibited employee pairings.
                Pairs can be managed per-employee in staff profiles.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(['REQUIRED', 'PREFERRED', 'UNPREFERRED', 'PROHIBITED'] as const).map(type => (
                  <div key={type} className="p-2 rounded border bg-muted/30 text-center">
                    <Badge variant={type === 'REQUIRED' ? 'default' : type === 'PROHIBITED' ? 'destructive' : 'outline'} className="text-[10px]">{type}</Badge>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {type === 'REQUIRED' && 'Must work together'}
                      {type === 'PREFERRED' && 'Should work together'}
                      {type === 'UNPREFERRED' && 'Avoid if possible'}
                      {type === 'PROHIBITED' && 'Never together'}
                    </p>
                  </div>
                ))}
              </div>
            </ConstraintCategory>

            {/* --- Travel --- */}
            <ConstraintCategory iconName="MapPin" label={constraintCategoryLabels.travel}
              description={constraintCategoryDescriptions.travel}
              enabled={ec.travel.enabled}
              onToggle={v => updateEmployee('travel', p => ({ ...p, enabled: v }))}>
              <NumberField label="Max Travel Distance" value={ec.travel.maxTravelDistanceKm} unit="km"
                onChange={v => updateEmployee('travel', p => ({ ...p, maxTravelDistanceKm: v }))} />
              <SelectField label="Satisfiability" value={ec.travel.satisfiability}
                onChange={v => updateEmployee('travel', p => ({ ...p, satisfiability: v as Satisfiability }))}
                options={satisfiabilityOptions} />
              <NumberField label="Min Time Incl. Travel" value={ec.travel.minTimeBetweenShiftsIncludingTravelMinutes} unit="min"
                onChange={v => updateEmployee('travel', p => ({ ...p, minTimeBetweenShiftsIncludingTravelMinutes: v }))} />
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Minimize Travel Distance</Label>
                <Switch checked={ec.travel.minimizeTravelDistance}
                  onCheckedChange={v => updateEmployee('travel', p => ({ ...p, minimizeTravelDistance: v }))} />
              </div>
              <SectionToggle label="Max Locations per Period" description="Limit how many locations an employee works at"
                enabled={ec.travel.maxLocationsPerPeriod.enabled}
                onToggle={v => updateEmployee('travel', p => ({ ...p, maxLocationsPerPeriod: { ...p.maxLocationsPerPeriod, enabled: v } }))}>
                <SelectField label="Period" value={ec.travel.maxLocationsPerPeriod.period}
                  onChange={v => updateEmployee('travel', p => ({ ...p, maxLocationsPerPeriod: { ...p.maxLocationsPerPeriod, period: v as Period } }))}
                  options={periodOptions} />
                <NumberField label="Max Locations" value={ec.travel.maxLocationsPerPeriod.maxLocations}
                  onChange={v => updateEmployee('travel', p => ({ ...p, maxLocationsPerPeriod: { ...p.maxLocationsPerPeriod, maxLocations: v } }))} />
              </SectionToggle>
            </ConstraintCategory>

            {/* --- Breaks --- */}
            <ConstraintCategory iconName="Coffee" label={constraintCategoryLabels.breaks}
              description={constraintCategoryDescriptions.breaks}
              enabled={ec.breaks.enabled}
              onToggle={v => updateEmployee('breaks', p => ({ ...p, enabled: v }))}>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium">Deduct Breaks from Worked Time</Label>
                  <p className="text-[10px] text-muted-foreground">Break time is not counted towards hours worked</p>
                </div>
                <Switch checked={ec.breaks.deductBreaksFromWorkedTime}
                  onCheckedChange={v => updateEmployee('breaks', p => ({ ...p, deductBreaksFromWorkedTime: v }))} />
              </div>
              <NumberField label="Min Shift for Break" value={ec.breaks.defaultBreakRules.minShiftDurationForBreakMinutes} unit="min"
                onChange={v => updateEmployee('breaks', p => ({ ...p, defaultBreakRules: { ...p.defaultBreakRules, minShiftDurationForBreakMinutes: v } }))}
                tooltip="Minimum shift duration before a break is required" />
              <NumberField label="Break Duration" value={ec.breaks.defaultBreakRules.breakDurationMinutes} unit="min"
                onChange={v => updateEmployee('breaks', p => ({ ...p, defaultBreakRules: { ...p.defaultBreakRules, breakDurationMinutes: v } }))} />
            </ConstraintCategory>

            {/* --- Activation --- */}
            <ConstraintCategory iconName="UserCheck" label={constraintCategoryLabels.activation}
              description={constraintCategoryDescriptions.activation}
              enabled={ec.activation.enabled}
              onToggle={v => updateEmployee('activation', p => ({ ...p, enabled: v }))}>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium">Minimize Activated Employees</Label>
                  <p className="text-[10px] text-muted-foreground">Use fewest employees possible to cover all shifts</p>
                </div>
                <Switch checked={ec.activation.minimizeActivatedEmployees}
                  onCheckedChange={v => updateEmployee('activation', p => ({ ...p, minimizeActivatedEmployees: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium">Maximize Saturation</Label>
                  <p className="text-[10px] text-muted-foreground">Maximize utilization of activated employees</p>
                </div>
                <Switch checked={ec.activation.maximizeActivatedSaturation}
                  onCheckedChange={v => updateEmployee('activation', p => ({ ...p, maximizeActivatedSaturation: v }))} />
              </div>
              <SectionToggle label="Activation Ratio" description="Maintain ratio between employee groups (e.g. full-time vs contractors)"
                enabled={ec.activation.activationRatio.enabled}
                onToggle={v => updateEmployee('activation', p => ({ ...p, activationRatio: { ...p.activationRatio, enabled: v } }))}>
                <NumberField label="Min Ratio" value={ec.activation.activationRatio.minRatio}
                  onChange={v => updateEmployee('activation', p => ({ ...p, activationRatio: { ...p.activationRatio, minRatio: v } }))} />
                <NumberField label="Max Ratio" value={ec.activation.activationRatio.maxRatio}
                  onChange={v => updateEmployee('activation', p => ({ ...p, activationRatio: { ...p.activationRatio, maxRatio: v } }))} />
              </SectionToggle>
            </ConstraintCategory>

            {/* --- Fairness --- */}
            <ConstraintCategory iconName="Scale" label={constraintCategoryLabels.fairness}
              description={constraintCategoryDescriptions.fairness}
              enabled={ec.fairness.enabled}
              onToggle={v => updateEmployee('fairness', p => ({ ...p, enabled: v }))}>
              <SectionToggle label="Balance Time Worked" description="Distribute total working hours evenly across employees"
                enabled={ec.fairness.balanceTimeWorked.enabled}
                onToggle={v => updateEmployee('fairness', p => ({ ...p, balanceTimeWorked: { ...p.balanceTimeWorked, enabled: v } }))}>
                <WeightSlider label="Weight" value={ec.fairness.balanceTimeWorked.weight}
                  onChange={v => updateEmployee('fairness', p => ({ ...p, balanceTimeWorked: { ...p.balanceTimeWorked, weight: v } }))} />
              </SectionToggle>
              <SectionToggle label="Balance Shift Count" description="Distribute number of shifts evenly across employees"
                enabled={ec.fairness.balanceShiftCount.enabled}
                onToggle={v => updateEmployee('fairness', p => ({ ...p, balanceShiftCount: { ...p.balanceShiftCount, enabled: v } }))}>
                <WeightSlider label="Weight" value={ec.fairness.balanceShiftCount.weight}
                  onChange={v => updateEmployee('fairness', p => ({ ...p, balanceShiftCount: { ...p.balanceShiftCount, weight: v } }))} />
              </SectionToggle>
            </ConstraintCategory>

            {/* --- Shift Type Diversity --- */}
            <ConstraintCategory iconName="Layers" label={constraintCategoryLabels.shiftTypeDiversity}
              description={constraintCategoryDescriptions.shiftTypeDiversity}
              enabled={ec.shiftTypeDiversity.enabled}
              onToggle={v => updateEmployee('shiftTypeDiversity', p => ({ ...p, enabled: v }))}>
              <SectionToggle label="Limit Shift Types per Period" description="Max number of different shift types per employee"
                enabled={ec.shiftTypeDiversity.limitShiftTypePerPeriod.enabled}
                onToggle={v => updateEmployee('shiftTypeDiversity', p => ({ ...p, limitShiftTypePerPeriod: { ...p.limitShiftTypePerPeriod, enabled: v } }))}>
                <SelectField label="Period" value={ec.shiftTypeDiversity.limitShiftTypePerPeriod.period}
                  onChange={v => updateEmployee('shiftTypeDiversity', p => ({ ...p, limitShiftTypePerPeriod: { ...p.limitShiftTypePerPeriod, period: v as Period } }))}
                  options={periodOptions} />
                <NumberField label="Max Shift Types" value={ec.shiftTypeDiversity.limitShiftTypePerPeriod.maxShiftTypesPerEmployee}
                  onChange={v => updateEmployee('shiftTypeDiversity', p => ({ ...p, limitShiftTypePerPeriod: { ...p.limitShiftTypePerPeriod, maxShiftTypesPerEmployee: v } }))} />
              </SectionToggle>
            </ConstraintCategory>

          </Accordion>
        </TabsContent>

        {/* ==================== SHIFT CONSTRAINTS ==================== */}
        <TabsContent value="shift" className="mt-3">
          <Accordion type="multiple" className="space-y-0">

            {/* --- Alternative Shifts --- */}
            <ConstraintCategory iconName="ArrowLeftRight" label={constraintCategoryLabels.alternativeShifts}
              description={constraintCategoryDescriptions.alternativeShifts}
              enabled={sc.alternativeShifts.enabled}
              onToggle={v => updateShift('alternativeShifts', p => ({ ...p, enabled: v }))}>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Allow Shift Groups</Label>
                <Switch checked={sc.alternativeShifts.allowShiftGroups}
                  onCheckedChange={v => updateShift('alternativeShifts', p => ({ ...p, allowShiftGroups: v }))} />
              </div>
              <NumberField label="Max Alternatives per Group" value={sc.alternativeShifts.maxAlternativesPerGroup}
                onChange={v => updateShift('alternativeShifts', p => ({ ...p, maxAlternativesPerGroup: v }))} />
            </ConstraintCategory>

            {/* --- Cost Management --- */}
            <ConstraintCategory iconName="DollarSign" label={constraintCategoryLabels.costManagement}
              description={constraintCategoryDescriptions.costManagement}
              enabled={sc.costManagement.enabled}
              onToggle={v => updateShift('costManagement', p => ({ ...p, enabled: v }))}>
              <SectionToggle label="Cost Groups" description="Group shifts by cost category and minimize expensive group usage"
                enabled={sc.costManagement.costGroups.enabled}
                onToggle={v => updateShift('costManagement', p => ({ ...p, costGroups: { ...p.costGroups, enabled: v } }))}>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Minimize Cost Group Usage</Label>
                  <Switch checked={sc.costManagement.costGroups.minimizeCostGroupUsage}
                    onCheckedChange={v => updateShift('costManagement', p => ({ ...p, costGroups: { ...p.costGroups, minimizeCostGroupUsage: v } }))} />
                </div>
              </SectionToggle>
              <SectionToggle label="Employee Rates" description="Prefer employees with lower hourly rates"
                enabled={sc.costManagement.employeeRates.enabled}
                onToggle={v => updateShift('costManagement', p => ({ ...p, employeeRates: { ...p.employeeRates, enabled: v } }))}>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Prefer Lower Cost</Label>
                  <Switch checked={sc.costManagement.employeeRates.preferLowerCostEmployees}
                    onCheckedChange={v => updateShift('costManagement', p => ({ ...p, employeeRates: { ...p.employeeRates, preferLowerCostEmployees: v } }))} />
                </div>
                <WeightSlider label="Cost Optimization Weight" value={sc.costManagement.employeeRates.weight}
                  onChange={v => updateShift('costManagement', p => ({ ...p, employeeRates: { ...p.employeeRates, weight: v } }))} />
              </SectionToggle>
            </ConstraintCategory>

            {/* --- Demand Scheduling --- */}
            <ConstraintCategory iconName="TrendingUp" label={constraintCategoryLabels.demandScheduling}
              description={constraintCategoryDescriptions.demandScheduling}
              enabled={sc.demandScheduling.enabled}
              onToggle={v => updateShift('demandScheduling', p => ({ ...p, enabled: v }))}>
              <SelectField label="Scheduling Mode" value={sc.demandScheduling.mode}
                onChange={v => updateShift('demandScheduling', p => ({ ...p, mode: v as 'shift_slot' | 'hourly_demand' }))}
                options={[{ value: 'shift_slot', label: 'Shift Slot' }, { value: 'hourly_demand', label: 'Hourly Demand' }]} />
              {sc.demandScheduling.mode === 'hourly_demand' && (
                <SectionToggle label="Hourly Demand Settings" description="Configure over/understaffing tolerances"
                  enabled={sc.demandScheduling.hourlyDemand.enabled}
                  onToggle={v => updateShift('demandScheduling', p => ({ ...p, hourlyDemand: { ...p.hourlyDemand, enabled: v } }))}>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Allow Overstaffing</Label>
                    <Switch checked={sc.demandScheduling.hourlyDemand.allowOverstaffing}
                      onCheckedChange={v => updateShift('demandScheduling', p => ({ ...p, hourlyDemand: { ...p.hourlyDemand, allowOverstaffing: v } }))} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Allow Understaffing</Label>
                    <Switch checked={sc.demandScheduling.hourlyDemand.allowUnderstaffing}
                      onCheckedChange={v => updateShift('demandScheduling', p => ({ ...p, hourlyDemand: { ...p.hourlyDemand, allowUnderstaffing: v } }))} />
                  </div>
                  <WeightSlider label="Overstaffing Penalty" value={sc.demandScheduling.hourlyDemand.overstaffingPenaltyWeight}
                    onChange={v => updateShift('demandScheduling', p => ({ ...p, hourlyDemand: { ...p.hourlyDemand, overstaffingPenaltyWeight: v } }))} />
                  <WeightSlider label="Understaffing Penalty" value={sc.demandScheduling.hourlyDemand.understaffingPenaltyWeight}
                    onChange={v => updateShift('demandScheduling', p => ({ ...p, hourlyDemand: { ...p.hourlyDemand, understaffingPenaltyWeight: v } }))} />
                </SectionToggle>
              )}
            </ConstraintCategory>

            {/* --- Shift Priority --- */}
            <ConstraintCategory iconName="AlertTriangle" label={constraintCategoryLabels.shiftPriority}
              description={constraintCategoryDescriptions.shiftPriority}
              enabled={sc.shiftPriority.enabled}
              onToggle={v => updateShift('shiftPriority', p => ({ ...p, enabled: v }))}>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium">Use Shift Priorities</Label>
                  <p className="text-[10px] text-muted-foreground">Higher priority shifts are scheduled first</p>
                </div>
                <Switch checked={sc.shiftPriority.usePriorities}
                  onCheckedChange={v => updateShift('shiftPriority', p => ({ ...p, usePriorities: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium">Mandatory Shifts Must Be Assigned</Label>
                  <p className="text-[10px] text-muted-foreground">Hard constraint — mandatory shifts cannot be left unassigned</p>
                </div>
                <Switch checked={sc.shiftPriority.mandatoryShiftsMustBeAssigned}
                  onCheckedChange={v => updateShift('shiftPriority', p => ({ ...p, mandatoryShiftsMustBeAssigned: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium">Optional Shifts Can Be Skipped</Label>
                  <p className="text-[10px] text-muted-foreground">Optional shifts may be left unscheduled if needed</p>
                </div>
                <Switch checked={sc.shiftPriority.optionalShiftsCanBeSkipped}
                  onCheckedChange={v => updateShift('shiftPriority', p => ({ ...p, optionalShiftsCanBeSkipped: v }))} />
              </div>
            </ConstraintCategory>

            {/* --- Skills --- */}
            <ConstraintCategory iconName="Award" label={constraintCategoryLabels.skills}
              description={constraintCategoryDescriptions.skills}
              enabled={sc.skills.enabled}
              onToggle={v => updateShift('skills', p => ({ ...p, enabled: v }))}>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium">Required Skills Enforced</Label>
                  <p className="text-[10px] text-muted-foreground">Hard constraint — employees must have all required skills</p>
                </div>
                <Switch checked={sc.skills.requiredSkillsEnforced}
                  onCheckedChange={v => updateShift('skills', p => ({ ...p, requiredSkillsEnforced: v }))} />
              </div>
              <WeightSlider label="Preferred Skills Weight" value={sc.skills.preferredSkillsWeight}
                onChange={v => updateShift('skills', p => ({ ...p, preferredSkillsWeight: v }))} />
              <SelectField label="Skill Match Strategy" value={sc.skills.skillMatchStrategy}
                onChange={v => updateShift('skills', p => ({ ...p, skillMatchStrategy: v as 'ALL' | 'ANY' }))}
                options={[{ value: 'ALL', label: 'All Skills Required' }, { value: 'ANY', label: 'Any Skill Sufficient' }]} />
              <SectionToggle label="Risk Factors" description="Manage risk-based scheduling constraints"
                enabled={sc.skills.riskFactors.enabled}
                onToggle={v => updateShift('skills', p => ({ ...p, riskFactors: { ...p.riskFactors, enabled: v } }))}>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Prohibit High Risk (Hard)</Label>
                  <Switch checked={sc.skills.riskFactors.prohibitHighRisk}
                    onCheckedChange={v => updateShift('skills', p => ({ ...p, riskFactors: { ...p.riskFactors, prohibitHighRisk: v } }))} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Penalize Moderate Risk (Soft)</Label>
                  <Switch checked={sc.skills.riskFactors.penalizeModerateRisk}
                    onCheckedChange={v => updateShift('skills', p => ({ ...p, riskFactors: { ...p.riskFactors, penalizeModerateRisk: v } }))} />
                </div>
              </SectionToggle>
            </ConstraintCategory>

            {/* --- Shift Selection --- */}
            <ConstraintCategory iconName="ListChecks" label={constraintCategoryLabels.shiftSelection}
              description={constraintCategoryDescriptions.shiftSelection}
              enabled={sc.shiftSelection.enabled}
              onToggle={v => updateShift('shiftSelection', p => ({ ...p, enabled: v }))}>
              <SectionToggle label="Shifts Worked per Period" description="Control how many shifts each employee works per period"
                enabled={sc.shiftSelection.shiftsWorkedPerPeriod.enabled}
                onToggle={v => updateShift('shiftSelection', p => ({ ...p, shiftsWorkedPerPeriod: { ...p.shiftsWorkedPerPeriod, enabled: v } }))}>
                <SelectField label="Period" value={sc.shiftSelection.shiftsWorkedPerPeriod.period}
                  onChange={v => updateShift('shiftSelection', p => ({ ...p, shiftsWorkedPerPeriod: { ...p.shiftsWorkedPerPeriod, period: v as Period } }))}
                  options={periodOptions} />
                <NumberField label="Min Shifts" value={sc.shiftSelection.shiftsWorkedPerPeriod.minShifts}
                  onChange={v => updateShift('shiftSelection', p => ({ ...p, shiftsWorkedPerPeriod: { ...p.shiftsWorkedPerPeriod, minShifts: v } }))} />
                <NumberField label="Max Shifts" value={sc.shiftSelection.shiftsWorkedPerPeriod.maxShifts}
                  onChange={v => updateShift('shiftSelection', p => ({ ...p, shiftsWorkedPerPeriod: { ...p.shiftsWorkedPerPeriod, maxShifts: v } }))} />
                <SelectField label="Satisfiability" value={sc.shiftSelection.shiftsWorkedPerPeriod.satisfiability}
                  onChange={v => updateShift('shiftSelection', p => ({ ...p, shiftsWorkedPerPeriod: { ...p.shiftsWorkedPerPeriod, satisfiability: v as Satisfiability } }))}
                  options={satisfiabilityOptions} />
              </SectionToggle>
              <SectionToggle label="Concurrent Shift Rules" description="Limit simultaneously scheduled shifts (e.g. limited equipment)"
                enabled={sc.shiftSelection.concurrentShiftRules.enabled}
                onToggle={v => updateShift('shiftSelection', p => ({ ...p, concurrentShiftRules: { ...p.concurrentShiftRules, enabled: v } }))}>
                <NumberField label="Max Concurrent Shifts" value={sc.shiftSelection.concurrentShiftRules.maxConcurrentShifts}
                  onChange={v => updateShift('shiftSelection', p => ({ ...p, concurrentShiftRules: { ...p.concurrentShiftRules, maxConcurrentShifts: v } }))} />
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Resource Limited</Label>
                  <Switch checked={sc.shiftSelection.concurrentShiftRules.resourceLimited}
                    onCheckedChange={v => updateShift('shiftSelection', p => ({ ...p, concurrentShiftRules: { ...p.concurrentShiftRules, resourceLimited: v } }))} />
                </div>
              </SectionToggle>
            </ConstraintCategory>

            {/* --- Employee Selection --- */}
            <ConstraintCategory iconName="UserPlus" label={constraintCategoryLabels.employeeSelection}
              description={constraintCategoryDescriptions.employeeSelection}
              enabled={sc.employeeSelection.enabled}
              onToggle={v => updateShift('employeeSelection', p => ({ ...p, enabled: v }))}>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium">Preferred Employees</Label>
                  <p className="text-[10px] text-muted-foreground">Soft reward when a preferred employee is assigned</p>
                </div>
                <Switch checked={sc.employeeSelection.preferredEmployees}
                  onCheckedChange={v => updateShift('employeeSelection', p => ({ ...p, preferredEmployees: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium">Unpreferred Employees</Label>
                  <p className="text-[10px] text-muted-foreground">Soft penalty when an unpreferred employee is assigned</p>
                </div>
                <Switch checked={sc.employeeSelection.unpreferredEmployees}
                  onCheckedChange={v => updateShift('employeeSelection', p => ({ ...p, unpreferredEmployees: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-medium">Prohibited Employees</Label>
                  <p className="text-[10px] text-muted-foreground">Hard constraint — prohibited employees are never assigned</p>
                </div>
                <Switch checked={sc.employeeSelection.prohibitedEmployees}
                  onCheckedChange={v => updateShift('employeeSelection', p => ({ ...p, prohibitedEmployees: v }))} />
              </div>
            </ConstraintCategory>

          </Accordion>
        </TabsContent>
      </Tabs>
    </div>
  );
}
