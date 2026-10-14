import React, { useState, useMemo } from 'react';
import {
  Users, UserCheck, Clock, Calendar, Shield, DollarSign,
  Scale, Target, Save, RotateCcw, Info, Sparkles, Check,
  Search, Building2, Globe, ChevronDown, ExternalLink,
  CircleDot, CircleOff, Filter, FileText, HelpCircle,
  Plus, Trash2, GitBranch, Zap,
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  type ConstraintCategory,
  type ConstraintDefinition,
  type ConstraintEnforcement,
  type Satisfiability,
  type SchedulingConstraintsConfig,
  type ConditionalRule,
  type ConstraintCondition,
  type ConditionField,
  constraintCategories,
  CONSTRAINT_DEFINITIONS,
  CONDITION_FIELDS,
  createDefaultConstraintsConfig,
  getConstraintsByCategory,
  getEffectiveSetting,
} from '@/types/schedulingConstraints';
import { industryPresets } from '@/types/timefoldConstraintPresets';
import {
  type TimefoldConstraintConfiguration,
  defaultConstraintConfig,
} from '@/types/timefoldConstraintConfig';
import { ContractTemplatesSection } from './constraints/ContractTemplatesSection';
import { ConstraintCategoryGuide } from './constraints/ConstraintCategoryGuide';

const categoryIconMap: Record<string, React.ElementType> = {
  Users, UserCheck, Clock, Calendar, Shield, DollarSign, Scale, Target,
};

const categoryOrder: ConstraintCategory[] = [
  'coverage_staffing', 'employee_matching', 'work_limits', 'shift_rules',
  'compliance', 'cost_optimization', 'fairness_preferences', 'operational_quality',
];

// ============= Conditional Rule Presets =============

const RULE_PRESETS: { id: string; label: string; emoji: string; description: string; factory: () => Omit<ConditionalRule, 'id'> }[] = [
  {
    id: 'weekend',
    label: 'Weekend Override',
    emoji: '📅',
    description: 'Different settings for Saturday & Sunday shifts',
    factory: () => ({
      label: 'Weekend Override',
      enabled: true,
      conditions: [{ id: `cond-${Date.now()}`, field: 'dayOfWeek', values: ['sat', 'sun'] }],
      enforcement: 'SOFT',
      priority: 3,
      weight: 70,
      parameterOverrides: {},
    }),
  },
  {
    id: 'night',
    label: 'Night Shift Rules',
    emoji: '🌙',
    description: 'Adjusted constraints for evening & night shifts',
    factory: () => ({
      label: 'Night Shift Rules',
      enabled: true,
      conditions: [{ id: `cond-${Date.now()}`, field: 'timeOfDay', values: ['evening', 'night'] }],
      enforcement: 'HARD',
      priority: 2,
      weight: 80,
      parameterOverrides: {},
    }),
  },
  {
    id: 'casual',
    label: 'Casual Staff Flexibility',
    emoji: '👤',
    description: 'Relaxed rules for casual & agency employees',
    factory: () => ({
      label: 'Casual Staff Flexibility',
      enabled: true,
      conditions: [{ id: `cond-${Date.now()}`, field: 'employmentType', values: ['casual', 'agency'] }],
      enforcement: 'SOFT',
      satisfiability: 'PREFERRED',
      priority: 7,
      weight: 40,
      parameterOverrides: {},
    }),
  },
  {
    id: 'public-holiday',
    label: 'Public Holiday Rules',
    emoji: '🎉',
    description: 'Stricter or different enforcement on public holidays',
    factory: () => ({
      label: 'Public Holiday Rules',
      enabled: true,
      conditions: [{ id: `cond-${Date.now()}`, field: 'publicHoliday', values: ['true'] }],
      enforcement: 'HARD',
      priority: 1,
      weight: 90,
      parameterOverrides: {},
    }),
  },
  {
    id: 'weekday-ft',
    label: 'Weekday Full-Time',
    emoji: '💼',
    description: 'Standard weekday rules for full-time & part-time staff',
    factory: () => ({
      label: 'Weekday Full-Time',
      enabled: true,
      conditions: [
        { id: `cond-${Date.now()}-1`, field: 'dayOfWeek', values: ['mon', 'tue', 'wed', 'thu', 'fri'] },
        { id: `cond-${Date.now()}-2`, field: 'employmentType', values: ['full-time', 'part-time'] },
      ],
      enforcement: 'HARD',
      priority: 2,
      weight: 60,
      parameterOverrides: {},
    }),
  },
  {
    id: 'emergency',
    label: 'Emergency Shift Override',
    emoji: '🚨',
    description: 'Relaxed constraints for emergency & callback shifts',
    factory: () => ({
      label: 'Emergency Shift Override',
      enabled: true,
      conditions: [{ id: `cond-${Date.now()}`, field: 'shiftType', values: ['emergency', 'callback', 'recall'] }],
      enforcement: 'SOFT',
      satisfiability: 'PREFERRED',
      priority: 8,
      weight: 30,
      parameterOverrides: {},
    }),
  },
];



const HELP_TEXT = {
  enforcement: {
    title: 'Enforcement Level',
    description: 'Controls how strictly the solver treats this constraint.',
    options: {
      HARD: 'The solver will NEVER violate this rule. If it cannot be satisfied, the schedule is considered infeasible. Use for legal/safety requirements.',
      SOFT: 'The solver will TRY to satisfy this rule but may violate it if needed. Violations incur a penalty based on weight & priority.',
      OFF: 'This constraint is completely disabled and ignored by the solver.',
    },
  },
  satisfiability: {
    title: 'Satisfiability',
    description: 'Determines whether the solver must satisfy this rule or just prefer it.',
    options: {
      REQUIRED: 'Must be satisfied — treated as a hard blocker. The solver will not produce a solution that violates this.',
      PREFERRED: 'Should be satisfied — the solver will try its best but can break this rule, applying a penalty weighted by priority.',
    },
  },
  priority: {
    title: 'Priority (1–10)',
    description: 'Sets the relative importance when multiple soft constraints conflict. Lower number = higher priority. The multiplier shows how much the penalty is amplified.',
    scale: '1–2 = Critical (10× penalty), 3–4 = High (7×), 5–6 = Medium (5×), 7–8 = Low (3×), 9–10 = Minimal (1×)',
  },
  weight: {
    title: 'Weight (1–100)',
    description: 'Fine-tunes the penalty score within the same priority level. Higher weight = larger penalty for violations. Two constraints at the same priority but different weights will have proportionally different penalties.',
    example: 'E.g., Weight 80 at Priority 3 produces a bigger penalty than Weight 20 at Priority 3.',
  },
};

// ============= Help Tooltip Wrapper =============

const HelpTooltip = ({ title, description, extra }: { title: string; description: string; extra?: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button type="button" className="inline-flex p-0.5 rounded hover:bg-muted">
        <Info className="h-3 w-3 text-muted-foreground" />
      </button>
    </TooltipTrigger>
    <TooltipContent side="top" className="max-w-[300px]">
      <p className="text-xs font-semibold mb-0.5">{title}</p>
      <p className="text-[11px] text-muted-foreground">{description}</p>
      {extra && <p className="text-[10px] text-muted-foreground/80 mt-1 italic">{extra}</p>}
    </TooltipContent>
  </Tooltip>
);

// ============= Enforcement Selector =============

const EnforcementSelector = ({ value, onChange }: {
  value: ConstraintEnforcement;
  onChange: (v: ConstraintEnforcement) => void;
}) => (
  <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
    {(['HARD', 'SOFT', 'OFF'] as const).map(opt => (
      <Tooltip key={opt}>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm"
            onClick={() => onChange(opt)}
            className={cn(
              "px-2.5 py-1 text-[10px] font-medium rounded transition-all",
              value === opt
                ? opt === 'HARD'
                  ? "bg-destructive text-destructive-foreground shadow-sm"
                  : opt === 'SOFT'
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-background text-muted-foreground shadow-sm border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt === 'HARD' ? 'Required' : opt === 'SOFT' ? 'Preferred' : 'Off'}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[250px]">
          <p className="text-[11px]">{HELP_TEXT.enforcement.options[opt]}</p>
        </TooltipContent>
      </Tooltip>
    ))}
  </div>
);

// ============= Satisfiability Selector =============

const SatisfiabilitySelector = ({ value, onChange }: {
  value: Satisfiability;
  onChange: (v: Satisfiability) => void;
}) => (
  <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
    {(['REQUIRED', 'PREFERRED'] as const).map(opt => (
      <Tooltip key={opt}>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm"
            onClick={() => onChange(opt)}
            className={cn(
              "px-2 py-0.5 text-[10px] font-medium rounded transition-all",
              value === opt
                ? opt === 'REQUIRED'
                  ? "bg-destructive text-destructive-foreground shadow-sm"
                  : "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt === 'REQUIRED' ? 'Required' : 'Preferred'}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[250px]">
          <p className="text-[11px]">{HELP_TEXT.satisfiability.options[opt]}</p>
        </TooltipContent>
      </Tooltip>
    ))}
  </div>
);

// ============= Conditional Rule Builder =============

const ConditionalRuleCard = ({ rule, definition, onUpdate, onRemove }: {
  rule: ConditionalRule;
  definition: ConstraintDefinition;
  onUpdate: (rule: ConditionalRule) => void;
  onRemove: () => void;
}) => {
  const [expanded, setExpanded] = useState(true);

  const addCondition = () => {
    const usedFields = rule.conditions.map(c => c.field);
    const availableField = CONDITION_FIELDS.find(f => !usedFields.includes(f.field));
    if (!availableField) return;
    onUpdate({
      ...rule,
      conditions: [...rule.conditions, {
        id: `cond-${Date.now()}`,
        field: availableField.field,
        values: [],
      }],
    });
  };

  const updateCondition = (condId: string, updates: Partial<ConstraintCondition>) => {
    onUpdate({
      ...rule,
      conditions: rule.conditions.map(c => c.id === condId ? { ...c, ...updates } : c),
    });
  };

  const removeCondition = (condId: string) => {
    onUpdate({
      ...rule,
      conditions: rule.conditions.filter(c => c.id !== condId),
    });
  };

  const toggleValue = (condId: string, value: string, currentValues: string[]) => {
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    updateCondition(condId, { values: newValues });
  };

  return (
    <div className={cn("border rounded-md transition-all", rule.enabled ? "border-primary/30 bg-primary/5" : "border-border/50 bg-muted/20")}>
      <div className="flex items-center gap-2 px-3 py-2">
        <Switch checked={rule.enabled} onCheckedChange={v => onUpdate({ ...rule, enabled: v })} />
        <Input
          value={rule.label}
          onChange={e => onUpdate({ ...rule, label: e.target.value })}
          className="h-6 text-xs font-medium border-none bg-transparent shadow-none p-0 focus-visible:ring-0"
          placeholder="Rule name..."
        />
        <div className="flex-1" />
        <Badge variant="outline" className="text-[9px] px-1.5">
          {rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''}
        </Badge>
        <button onClick={() => setExpanded(!expanded)} className="p-0.5 hover:bg-muted rounded">
          <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", expanded && "rotate-180")} />
        </button>
        <button onClick={onRemove} className="p-0.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-2.5 border-t pt-2.5">
          {/* Conditions */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">When</Label>
              <HelpTooltip title="Conditions" description="This rule applies only when ALL conditions are met (AND logic). Add multiple conditions to narrow the scope." />
            </div>
            {rule.conditions.map((cond, idx) => {
              const fieldDef = CONDITION_FIELDS.find(f => f.field === cond.field);
              return (
                <div key={cond.id} className="flex items-start gap-2 bg-background rounded-md p-2 border">
                  {idx > 0 && <span className="text-[10px] font-medium text-muted-foreground mt-1">AND</span>}
                  <Select
                    value={cond.field}
                    onValueChange={(v: string) => updateCondition(cond.id, { field: v as ConditionField, values: [] })}
                  >
                    <SelectTrigger className="h-7 w-36 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONDITION_FIELDS.map(f => (
                        <SelectItem key={f.field} value={f.field} className="text-xs">{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-[10px] text-muted-foreground mt-1.5">is</span>
                  {fieldDef?.type === 'multi-select' && fieldDef.options && (
                    <div className="flex flex-wrap gap-1 flex-1">
                      {fieldDef.options.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => toggleValue(cond.id, opt.value, cond.values)}
                          className={cn(
                            "px-2 py-0.5 text-[10px] rounded-full border transition-all",
                            cond.values.includes(opt.value)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-muted-foreground border-border hover:border-primary/50"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {fieldDef?.type === 'boolean' && (
                    <div className="flex gap-1">
                      {['true', 'false'].map(v => (
                        <button
                          key={v}
                          onClick={() => updateCondition(cond.id, { values: [v] })}
                          className={cn(
                            "px-2.5 py-0.5 text-[10px] rounded border transition-all",
                            cond.values[0] === v
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-muted-foreground border-border"
                          )}
                        >
                          {v === 'true' ? 'Yes' : 'No'}
                        </button>
                      ))}
                    </div>
                  )}
                  <button onClick={() => removeCondition(cond.id)} className="p-0.5 hover:bg-destructive/10 rounded mt-0.5">
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              );
            })}
            {rule.conditions.length < CONDITION_FIELDS.length && (
              <button
                onClick={addCondition}
                className="flex items-center gap-1 text-[11px] text-primary hover:underline"
              >
                <Plus className="h-3 w-3" /> Add condition
              </button>
            )}
          </div>

          {/* Overrides */}
          <Separator />
          <div className="space-y-2">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Then Override</Label>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Enforcement:</Label>
                <EnforcementSelector value={rule.enforcement || 'SOFT'} onChange={v => onUpdate({ ...rule, enforcement: v })} />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Priority:</Label>
                <Select value={String(rule.priority ?? 5)} onValueChange={v => onUpdate({ ...rule, priority: Number(v) })}>
                  <SelectTrigger className="h-7 w-20 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(p => (
                      <SelectItem key={p} value={String(p)} className="text-xs">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0 flex-1">
                <Label className="text-xs text-muted-foreground">Weight:</Label>
                <Slider value={[rule.weight ?? 50]} onValueChange={([v]) => onUpdate({ ...rule, weight: v })} min={1} max={100} step={1} className="flex-1" />
                <span className="text-xs font-mono w-6 text-right">{rule.weight ?? 50}</span>
              </div>
            </div>

            {/* Parameter overrides */}
            {definition.parameters.length > 0 && (
              <div className="space-y-1.5 mt-2">
                <Label className="text-[10px] text-muted-foreground">Parameter Overrides (leave empty to use default):</Label>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-3">
                  {definition.parameters.filter(param => advanced || !/penalty|bonus|reward|weight/i.test(param.key)).map(param => (
                    <div key={param.key} className="flex items-center gap-2">
                      <Label className="text-[11px] text-muted-foreground min-w-[120px] ">{param.label}</Label>
                      {param.type === 'number' && (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={rule.parameterOverrides[param.key] === undefined ? '' : param.unit === 'min' ? rule.parameterOverrides[param.key] / 60 : rule.parameterOverrides[param.key]}
                            onChange={e => onUpdate({
                              ...rule,
                              parameterOverrides: { ...rule.parameterOverrides, [param.key]: e.target.value ? (param.unit === 'min' ? Math.round(Number(e.target.value) * 60) : Number(e.target.value)) : undefined },
                            })}
                            placeholder={String(param.unit === 'min' ? param.defaultValue / 60 : param.defaultValue)}
                            className="h-6 w-20 text-[11px]"
                            min={param.unit === 'min' && param.min !== undefined ? param.min / 60 : param.min}
                            max={param.unit === 'min' && param.max !== undefined ? param.max / 60 : param.max}
                            step={param.unit === 'min' || param.unit === 'hrs' ? 0.25 : param.step ?? 1}
                          />
                          {param.unit && <span className="text-[9px] text-muted-foreground">{param.unit === 'min' || param.unit === 'hrs' ? 'hours' : param.unit}</span>}
                        </div>
                      )}
                      {param.type === 'select' && (
                        <Select
                          value={rule.parameterOverrides[param.key] === undefined ? '' : param.unit === 'min' ? rule.parameterOverrides[param.key] / 60 : rule.parameterOverrides[param.key]}
                          onValueChange={v => onUpdate({
                            ...rule,
                            parameterOverrides: { ...rule.parameterOverrides, [param.key]: v || undefined },
                          })}
                        >
                          <SelectTrigger className="h-6 w-36 text-[11px]"><SelectValue placeholder="Default" /></SelectTrigger>
                          <SelectContent>
                            {param.options?.map(o => <SelectItem key={o.value} value={o.value} className="text-[11px]">{o.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                      {param.type === 'boolean' && (
                        <Switch
                          checked={rule.parameterOverrides[param.key] ?? param.defaultValue}
                          onCheckedChange={v => onUpdate({
                            ...rule,
                            parameterOverrides: { ...rule.parameterOverrides, [param.key]: v },
                          })}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============= Constraint Row =============

const ConstraintRow = ({ definition, enforcement, satisfiability, weight, priority, parameters, conditionalRules, isLocationScope, hasOverride, onEnforcementChange, onSatisfiabilityChange, onWeightChange, onPriorityChange, onParameterChange, onConditionalRulesChange }: {
  definition: ConstraintDefinition;
  enforcement: ConstraintEnforcement;
  satisfiability: Satisfiability;
  weight: number;
  priority: number;
  parameters: Record<string, any>;
  conditionalRules: ConditionalRule[];
  isLocationScope: boolean;
  hasOverride: boolean;
  onEnforcementChange: (v: ConstraintEnforcement) => void;
  onSatisfiabilityChange: (v: Satisfiability) => void;
  onWeightChange: (v: number) => void;
  onPriorityChange: (v: number) => void;
  onParameterChange: (key: string, value: any) => void;
  onConditionalRulesChange: (rules: ConditionalRule[]) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const isActive = enforcement !== 'OFF';
  const hasParams = definition.parameters.length > 0;
  const canExpand = isActive;
  const [advanced, setAdvanced] = useState(false);

  return (
    <div className={cn(
      "group border rounded-lg transition-all",
      isActive ? "bg-card border-border" : "bg-muted/30 border-border/50",
      expanded && "ring-1 ring-primary/20",
    )}>
      {/* Main Row */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-4">
        {/* Code */}
        <Badge variant="outline" className={cn(
          "text-[10px] font-mono px-1.5 shrink-0 min-w-[32px] justify-center",
          definition.code.startsWith('H') ? "border-destructive/30 text-destructive" : "border-primary/30 text-primary"
        )}>
          {definition.code}
        </Badge>

        {/* Name + Description */}
        <Button variant="ghost" className="flex-1 min-w-[180px] h-auto p-0 text-left justify-start hover:bg-transparent whitespace-normal" onClick={() => canExpand && setExpanded(!expanded)} aria-expanded={expanded}>
          <div className="w-full">
          <div className="flex items-center gap-1.5">
            <span className={cn("text-sm font-medium", !isActive && "text-muted-foreground")}>
              {definition.name}
            </span>
            {hasOverride && isLocationScope && (
              <Badge variant="secondary" className="text-[9px] px-1 bg-primary/10 text-primary border-primary/20">
                Override
              </Badge>
            )}
            {isActive && (
              <Badge variant="outline" className={cn(
                "text-[9px] px-1",
                satisfiability === 'REQUIRED' ? "border-destructive/30 text-destructive" : "border-primary/30 text-primary"
              )}>
                {satisfiability}
              </Badge>
            )}
            {conditionalRules.length > 0 && (
              <Badge variant="outline" className="text-[9px] px-1 border-primary/30 text-primary">
                <GitBranch className="h-2.5 w-2.5 mr-0.5" />
                {conditionalRules.filter(r => r.enabled).length} rule{conditionalRules.filter(r => r.enabled).length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            {definition.description}
          </p>
          </div>
        </Button>

        {/* Enforcement */}
        <EnforcementSelector value={enforcement} onChange={onEnforcementChange} />

        {/* Expand */}
        {canExpand && (
          <Button variant="ghost" size="icon" onClick={() => setExpanded(!expanded)} aria-label={`Configure ${definition.name}`} aria-expanded={expanded}>
            <ChevronDown className={cn("h-4 w-4 transition-transform text-muted-foreground", expanded && "rotate-180")} />
          </Button>
        )}
      </div>

      {/* Expanded Settings */}
      {expanded && isActive && (
        <div className="px-3 pb-3 pt-0 space-y-3 border-t mx-3 mt-0 pt-3">
          {/* Business Reason */}
          <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            <span><strong>Why:</strong> {definition.businessReason}</span>
          </div>

          <Button variant="ghost" size="sm" className="text-primary" onClick={() => setAdvanced(!advanced)} aria-expanded={advanced}>Advanced scoring & conditional rules <ChevronDown className={cn("ml-2 h-3.5 w-3.5", advanced && "rotate-180")} /></Button>
          {/* Satisfiability + Priority + Weight Row */}
          {advanced && <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">Advanced enforcement:</Label>
                <HelpTooltip title={HELP_TEXT.satisfiability.title} description={HELP_TEXT.satisfiability.description} />
              </div>
              <SatisfiabilitySelector value={satisfiability} onChange={onSatisfiabilityChange} />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">Priority:</Label>
                <HelpTooltip title={HELP_TEXT.priority.title} description={HELP_TEXT.priority.description} extra={HELP_TEXT.priority.scale} />
              </div>
              <Select value={String(priority)} onValueChange={v => onPriorityChange(Number(v))}>
                <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(p => (
                    <SelectItem key={p} value={String(p)} className="text-xs">
                      {p} ({p <= 2 ? '10×' : p <= 4 ? '7×' : p <= 6 ? '5×' : p <= 8 ? '3×' : '1×'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Weight slider */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Weight:</Label>
                <HelpTooltip title={HELP_TEXT.weight.title} description={HELP_TEXT.weight.description} extra={HELP_TEXT.weight.example} />
              </div>
              <Slider value={[weight]} onValueChange={([v]) => onWeightChange(v)} min={1} max={100} step={1} className="flex-1" />
              <span className="text-xs font-mono font-medium w-6 text-right">{weight}</span>
            </div>
          </div>

          }
          {/* Parameters */}
          {hasParams && (
            <>
              <Separator />
              <div className="space-y-2.5">
                <Label className="text-xs font-semibold text-foreground">Configuration Values</Label>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-5 gap-y-4">
                  {definition.parameters.map(param => (
                    <div key={param.key} className="flex items-center gap-2">
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        <Label className="text-xs text-muted-foreground ">{param.label}</Label>
                        {param.tooltip && (
                          <Tooltip>
                            <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                            <TooltipContent><p className="text-xs max-w-[250px]">{param.tooltip}</p></TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      {param.type === 'number' && (
                        <div className="flex items-center gap-1.5">
                          <Input type="number" aria-label={param.label} value={param.unit === 'min' ? (parameters[param.key] ?? param.defaultValue) / 60 : parameters[param.key] ?? param.defaultValue}
                            onChange={e => onParameterChange(param.key, param.unit === 'min' ? Math.round(Number(e.target.value) * 60) : Number(e.target.value))}
                            className="h-7 w-20 text-xs" min={param.unit === 'min' && param.min !== undefined ? param.min / 60 : param.min} max={param.unit === 'min' && param.max !== undefined ? param.max / 60 : param.max} step={param.unit === 'min' || param.unit === 'hrs' ? 0.25 : param.step ?? 1} />
                          {param.unit && <span className="text-[10px] text-muted-foreground">{param.unit === 'min' || param.unit === 'hrs' ? 'hours' : param.unit}</span>}
                        </div>
                      )}
                      {param.type === 'select' && (
                        <Select value={String(parameters[param.key] ?? param.defaultValue)}
                          onValueChange={v => onParameterChange(param.key, v)}>
                          <SelectTrigger className="h-7 w-40 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {param.options?.map(o => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                      {param.type === 'boolean' && (
                        <Switch checked={parameters[param.key] ?? param.defaultValue}
                          onCheckedChange={v => onParameterChange(param.key, v)} />
                      )}
                      {param.type === 'text' && (
                        <Input value={parameters[param.key] ?? param.defaultValue}
                          onChange={e => onParameterChange(param.key, e.target.value)}
                          className="h-7 w-40 text-xs" />
                      )}
                      {param.perContract && (
                        <Badge variant="outline" className="text-[9px] px-1 text-muted-foreground">per contract</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Conditional Rules */}
          {advanced && <><Separator />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5 text-primary" />
                <Label className="text-xs font-semibold text-foreground">Conditional Rules</Label>
                <HelpTooltip
                  title="Conditional Rules"
                  description="Add rules that override this constraint's settings when specific conditions are met (e.g., different max hours on weekends or for casual staff)."
                  extra="Conditions use AND logic — all conditions in a rule must match. Multiple rules are evaluated top-down; first matching rule wins."
                />
                {conditionalRules.length > 0 && (
                  <Badge variant="secondary" className="text-[9px] px-1.5">
                    {conditionalRules.length} rule{conditionalRules.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowPresetMenu(!showPresetMenu)}
                  className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                >
                  <Plus className="h-3 w-3" /> Add rule ▾
                </button>
                {showPresetMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowPresetMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 w-72 bg-popover border rounded-lg shadow-lg p-1.5 max-h-[320px] overflow-y-auto">
                      <button
                        onClick={() => { onConditionalRulesChange([...conditionalRules, {
                          id: `rule-${Date.now()}`,
                          label: `Rule ${conditionalRules.length + 1}`,
                          enabled: true,
                          conditions: [],
                          parameterOverrides: {},
                        }]); setShowPresetMenu(false); }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-muted text-left transition-colors"
                      >
                        <span className="text-sm">✏️</span>
                        <div>
                          <p className="text-xs font-medium">Blank Rule</p>
                          <p className="text-[10px] text-muted-foreground">Start from scratch with no conditions</p>
                        </div>
                      </button>
                      <Separator className="my-1" />
                      <p className="px-2.5 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                        <Zap className="h-3 w-3" /> Quick Presets
                      </p>
                      {RULE_PRESETS.map(preset => (
                        <button
                          key={preset.id}
                          onClick={() => { onConditionalRulesChange([...conditionalRules, { id: `rule-${Date.now()}-${preset.id}`, ...preset.factory() }]); setShowPresetMenu(false); }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-muted text-left transition-colors"
                        >
                          <span className="text-sm">{preset.emoji}</span>
                          <div>
                            <p className="text-xs font-medium">{preset.label}</p>
                            <p className="text-[10px] text-muted-foreground">{preset.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            {conditionalRules.length === 0 && (
              <div className="flex items-center gap-3 pl-5 py-2">
                <p className="text-[10px] text-muted-foreground italic">
                  No conditional rules — this constraint applies uniformly.
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {RULE_PRESETS.slice(0, 3).map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => onConditionalRulesChange([...conditionalRules, { id: `rule-${Date.now()}-${preset.id}`, ...preset.factory() }])}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full border border-primary/20 text-primary hover:bg-primary/5 transition-colors"
                    >
                      <span>{preset.emoji}</span> {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              {conditionalRules.map(rule => (
                <ConditionalRuleCard
                  key={rule.id}
                  rule={rule}
                  definition={definition}
                  onUpdate={updated => onConditionalRulesChange(conditionalRules.map(r => r.id === rule.id ? updated : r))}
                  onRemove={() => onConditionalRulesChange(conditionalRules.filter(r => r.id !== rule.id))}
                />
              ))}
            </div>
          </div>

          {definition.timefoldMapping && (
            <a
              href={`https://docs.timefold.ai/employee-shift-scheduling/latest/${definition.timefoldMapping}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
            >
              <ExternalLink className="h-2.5 w-2.5" />
              Timefold docs
            </a>
          )}
          </>}
        </div>
      )}
    </div>
  );
};

// ============= Category Section =============

const CategorySection = ({ category, config, isLocationScope, onUpdate, searchQuery, ruleFilter }: {
  searchQuery: string;
  ruleFilter: string;
  category: ConstraintCategory;
  config: SchedulingConstraintsConfig;
  isLocationScope: boolean;
  onUpdate: (id: string, field: string, value: any) => void;
}) => {
  const meta = constraintCategories[category];
  const definitions = getConstraintsByCategory(category).filter(definition => {
    const setting = config.constraints[definition.id];
    if (!setting) return false;
    const effective = getEffectiveSetting(setting, config.activeLocationId);
    const query = searchQuery.trim().toLowerCase();
    return (ruleFilter === 'all' || effective.enforcement === ruleFilter) && (!query || `${definition.name} ${definition.description} ${definition.code}`.toLowerCase().includes(query));
  });
  const Icon = categoryIconMap[meta.icon] || Target;

  const activeCount = definitions.filter(d => {
    const setting = config.constraints[d.id];
    if (!setting) return false;
    const effective = getEffectiveSetting(setting, config.activeLocationId);
    return effective.enforcement !== 'OFF';
  }).length;

  const hardCount = definitions.filter(d => {
    const setting = config.constraints[d.id];
    if (!setting) return false;
    return getEffectiveSetting(setting, config.activeLocationId).enforcement === 'HARD';
  }).length;

  const softCount = definitions.filter(d => {
    const setting = config.constraints[d.id];
    if (!setting) return false;
    return getEffectiveSetting(setting, config.activeLocationId).enforcement === 'SOFT';
  }).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <div className={cn("p-1.5 rounded-md", activeCount > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{meta.label}</span>
            <Badge variant={activeCount > 0 ? "default" : "secondary"} className="text-[10px] px-1.5">
              {activeCount}/{definitions.length}
            </Badge>
            {hardCount > 0 && <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[9px] px-1">{hardCount} Required</Badge>}
            {softCount > 0 && <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] px-1">{softCount} Preferred</Badge>}
          </div>
          <p className="text-[11px] text-muted-foreground">{meta.description}</p>
        </div>
      </div>

      {definitions.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No rules match your search.</p>}
      <div className="space-y-3">
        {definitions.map(def => {
          const setting = config.constraints[def.id];
          if (!setting) return null;
          const effective = getEffectiveSetting(setting, config.activeLocationId);
          const hasOverride = isLocationScope && config.activeLocationId
            ? !!setting.locationOverrides[config.activeLocationId]
            : false;

          return (
            <ConstraintRow
              key={def.id}
              definition={def}
              enforcement={effective.enforcement}
              satisfiability={effective.satisfiability}
              weight={effective.weight}
              priority={effective.priority}
              parameters={effective.parameters}
              conditionalRules={setting.conditionalRules || []}
              isLocationScope={isLocationScope}
              hasOverride={hasOverride}
              onEnforcementChange={v => onUpdate(def.id, 'enforcement', v)}
              onSatisfiabilityChange={v => onUpdate(def.id, 'satisfiability', v)}
              onWeightChange={v => onUpdate(def.id, 'weight', v)}
              onPriorityChange={v => onUpdate(def.id, 'priority', v)}
              onParameterChange={(key, val) => onUpdate(def.id, `param.${key}`, val)}
              onConditionalRulesChange={rules => onUpdate(def.id, 'conditionalRules', rules)}
            />
          );
        })}
      </div>
    </div>
  );
};

// ============= Main Panel =============

export interface SchedulingConstraintsPanelRef {
  handleSave: () => void;
  handleReset: () => void;
  showHelp: boolean;
  toggleHelp: () => void;
}

interface SchedulingConstraintsPanelProps {
  onReady?: (ref: SchedulingConstraintsPanelRef) => void;
}

export function SchedulingConstraintsPanel({ onReady }: SchedulingConstraintsPanelProps = {}) {
  const [constraintConfig, setConstraintConfig] = useState<SchedulingConstraintsConfig>(createDefaultConstraintsConfig);
  const [contractConfig, setContractConfig] = useState<TimefoldConstraintConfiguration>(() => ({
    ...defaultConstraintConfig,
  }));
  const [activeTab, setActiveTab] = useState<string>('coverage_staffing');
  const [searchQuery, setSearchQuery] = useState('');
  const [ruleFilter, setRuleFilter] = useState('all');
  const [filterCategory, setFilterCategory] = useState<ConstraintCategory | 'all'>('all');
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const isLocationScope = constraintConfig.scope === 'location';

  const locations = [
    { id: 'loc-1', name: 'Melbourne CBD Centre' },
    { id: 'loc-2', name: 'Sydney North Shore' },
    { id: 'loc-3', name: 'Brisbane Southbank' },
  ];

  const handleUpdate = (constraintId: string, field: string, value: any) => {
    setConstraintConfig(prev => {
      const next = { ...prev, constraints: { ...prev.constraints } };
      const setting = { ...next.constraints[constraintId] };

      if (isLocationScope && prev.activeLocationId) {
        const overrides = { ...setting.locationOverrides };
        const existing = overrides[prev.activeLocationId] || {};

        if (field === 'enforcement') overrides[prev.activeLocationId] = { ...existing, enforcement: value };
        else if (field === 'satisfiability') overrides[prev.activeLocationId] = { ...existing, satisfiability: value };
        else if (field === 'weight') overrides[prev.activeLocationId] = { ...existing, weight: value };
        else if (field === 'priority') overrides[prev.activeLocationId] = { ...existing, priority: value };
        else if (field.startsWith('param.')) {
          const paramKey = field.slice(6);
          overrides[prev.activeLocationId] = { ...existing, parameters: { ...(existing.parameters ?? {}), [paramKey]: value } };
        }
        setting.locationOverrides = overrides;
      } else {
        if (field === 'enforcement') setting.enforcement = value;
        else if (field === 'satisfiability') setting.satisfiability = value;
        else if (field === 'weight') setting.weight = value;
        else if (field === 'priority') setting.priority = value;
        else if (field === 'conditionalRules') setting.conditionalRules = value;
        else if (field.startsWith('param.')) {
          const paramKey = field.slice(6);
          setting.parameters = { ...setting.parameters, [paramKey]: value };
        }
      }

      next.constraints[constraintId] = setting;
      return next;
    });
  };

  const handleSave = () => { toast.success('Constraint configuration saved successfully'); };

  const handleReset = () => {
    setConstraintConfig(createDefaultConstraintsConfig());
    setContractConfig({ ...defaultConstraintConfig });
    setActivePreset(null);
    toast.info('Configuration reset to defaults');
  };

  React.useEffect(() => {
    onReady?.({
      handleSave,
      handleReset,
      showHelp,
      toggleHelp: () => setShowHelp(prev => !prev),
    });
  });

  const applyPreset = (presetId: string) => {
    const preset = industryPresets.find(p => p.id === presetId);
    if (preset) {
      setContractConfig({ ...preset.config });
      setActivePreset(presetId);
      toast.success(`Applied "${preset.name}" preset`);
    }
  };

  // Filter constraints for the constraint tabs
  const filteredCategories = useMemo(() => {
    return categoryOrder.filter(cat => {
      if (filterCategory !== 'all' && cat !== filterCategory) return false;
      const defs = getConstraintsByCategory(cat);
      return defs.some(d => {
        const matchesSearch = !searchQuery
          || d.name.toLowerCase().includes(searchQuery.toLowerCase())
          || d.code.toLowerCase().includes(searchQuery.toLowerCase())
          || d.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
      });
    });
  }, [searchQuery, filterCategory]);

  // Stats
  const stats = useMemo(() => {
    const all = CONSTRAINT_DEFINITIONS;
    let hard = 0, soft = 0, off = 0;
    all.forEach(d => {
      const s = constraintConfig.constraints[d.id];
      if (!s) return;
      const e = getEffectiveSetting(s, constraintConfig.activeLocationId);
      if (e.enforcement === 'HARD') hard++;
      else if (e.enforcement === 'SOFT') soft++;
      else off++;
    });
    return { total: all.length, hard, soft, off };
  }, [constraintConfig]);

  const contractCount = contractConfig.employeeConstraints.contracts.contracts.length;

  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="space-y-4">

      {/* Help Guide */}
      {showHelp && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4 text-primary" />
              Understanding Constraint Configuration
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <p className="text-xs font-medium">🔴 Hard / 🟡 Soft / ⚪ Off — Enforcement</p>
                <p className="text-[11px] text-muted-foreground">
                  <strong>Hard</strong> constraints must never be violated — the solver treats them as absolute rules (e.g., legal requirements).
                  <strong> Soft</strong> constraints are best-effort — the solver tries to satisfy them but can break them if needed, applying a penalty.
                  <strong> Off</strong> disables the constraint entirely.
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium">Required vs Preferred — Satisfiability</p>
                <p className="text-[11px] text-muted-foreground">
                  <strong>Required</strong> means the rule acts as a hard blocker — it must be satisfied.
                  <strong> Preferred</strong> means the solver will try but can break it, using priority & weight to determine the penalty cost.
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium">Priority (1–10) — Relative Importance</p>
                <p className="text-[11px] text-muted-foreground">
                  Determines which soft constraints the solver prioritises when it can't satisfy all of them. Lower number = higher importance.
                  Priority 1–2 applies a <strong>10× penalty multiplier</strong>, 3–4 = 7×, 5–6 = 5×, 7–8 = 3×, 9–10 = 1×.
                  A priority-1 constraint will almost always be satisfied before a priority-10 one.
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium">Weight (1–100) — Fine-Tuning</p>
                <p className="text-[11px] text-muted-foreground">
                  Within the same priority level, weight controls how much penalty a violation costs. A constraint with weight 80 costs 4× more than one with weight 20
                  at the same priority. Use weight to fine-tune between constraints of equal importance.
                  <br /><strong>Formula:</strong> Penalty = Weight × Priority Multiplier × Violation Count.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-muted/50 border text-xs">
        <div className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium">{contractCount} Contracts</span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-1.5">
          <CircleDot className="h-3.5 w-3.5 text-destructive" />
          <span className="font-medium">{stats.hard} Required</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CircleDot className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium">{stats.soft} Preferred</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CircleOff className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">{stats.off} Off</span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <span className="text-muted-foreground">{stats.total} total constraints</span>
      </div>

      {/* Scope Toggle */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
              <button
                onClick={() => setConstraintConfig(p => ({ ...p, scope: 'business', activeLocationId: null }))}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-all",
                  !isLocationScope ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Globe className="h-3.5 w-3.5" />
                Business-Wide
              </button>
              <button
                onClick={() => setConstraintConfig(p => ({ ...p, scope: 'location', activeLocationId: p.activeLocationId || locations[0]?.id || null }))}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-all",
                  isLocationScope ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Building2 className="h-3.5 w-3.5" />
                Location Override
              </button>
            </div>

            {isLocationScope && (
              <Select value={constraintConfig.activeLocationId || ''} onValueChange={v => setConstraintConfig(p => ({ ...p, activeLocationId: v }))}>
                <SelectTrigger className="h-8 w-56 text-xs"><SelectValue placeholder="Select location..." /></SelectTrigger>
                <SelectContent>
                  {locations.map(loc => <SelectItem key={loc.id} value={loc.id} className="text-xs">{loc.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            {isLocationScope && (
              <p className="text-[10px] text-muted-foreground flex-1">
                Overrides only apply to the selected location. Unmodified constraints inherit business-wide defaults.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-[190px_minmax(0,1fr)] gap-5">
        <nav aria-label="Scheduling categories" className="md:border-r border-border md:pr-3">
          <div className="flex md:flex-col gap-1 overflow-x-auto pb-2">
            <Button variant={activeTab === 'contracts' ? 'secondary' : 'ghost'} className="justify-start shrink-0 text-xs" onClick={() => { setActiveTab('contracts'); setSearchQuery(''); }}>
              <FileText className="h-4 w-4 mr-2" /> Contract templates
            </Button>
            {categoryOrder.map(category => {
              const meta = constraintCategories[category];
              const Icon = categoryIconMap[meta.icon] || Target;
              return <Button key={category} variant={activeTab === category ? 'secondary' : 'ghost'} className={cn("justify-start shrink-0 text-xs h-auto py-3 whitespace-normal text-left", activeTab === category && "text-primary")} onClick={() => { setActiveTab(category); setSearchQuery(''); }}>
                <Icon className="h-4 w-4 mr-2 shrink-0" />{meta.label}
              </Button>;
            })}
          </div>
        </nav>
        <div className="min-w-0 space-y-4">
          {activeTab === 'contracts' ? <>
            <div className="border-b border-border pb-4">
              <h2 className="text-lg font-semibold">Contract templates</h2>
              <p className="mt-1 text-sm text-muted-foreground">Employment-specific hours, rest and shift patterns.</p>
              <details className="mt-3 text-xs">
                <summary className="cursor-pointer text-primary">Industry starting points</summary>
                <div className="flex flex-wrap gap-2 mt-3">{industryPresets.map(preset => <Button key={preset.id} variant={activePreset === preset.id ? 'secondary' : 'outline'} size="sm" onClick={() => applyPreset(preset.id)}>{preset.name}</Button>)}</div>
              </details>
            </div>
            <ContractTemplatesSection contracts={contractConfig.employeeConstraints.contracts.contracts} onChange={contracts => setContractConfig(prev => ({ ...prev, employeeConstraints: { ...prev.employeeConstraints, contracts: { ...prev.employeeConstraints.contracts, contracts } } }))} />
          </> : <>
            <ConstraintCategoryGuide category={activeTab as ConstraintCategory} onContracts={() => setActiveTab('contracts')} />
            {activeTab !== 'work_limits' && <p className="text-xs text-muted-foreground border-l-2 border-primary pl-3">Policy configuration preview · These category settings are not currently connected to Auto-Schedule.</p>}
            {activeTab === 'work_limits' ? <div className="space-y-3">
              <h3 className="text-sm font-semibold">Contract work & rest limits</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted"><tr><th className="p-3">Contract</th><th className="p-3">Maximum hours</th><th className="p-3">Minimum rest</th><th className="p-3">Consecutive days</th></tr></thead>
                  <tbody>{contractConfig.employeeConstraints.contracts.contracts.map(contract => <tr key={contract.id} className="border-b border-border">
                    <td className="p-3 font-medium">{contract.name}</td>
                    <td className="p-3">{contract.workLimits.enabled && contract.workLimits.minutesPerPeriod.enabled && contract.workLimits.minutesPerPeriod.maxMinutes !== undefined ? `${Number((contract.workLimits.minutesPerPeriod.maxMinutes / 60).toFixed(2))} hours / ${contract.workLimits.minutesPerPeriod.period.toLowerCase()}` : 'Not set'}</td>
                    <td className="p-3">{contract.timeOffRules.enabled ? `${Number((contract.timeOffRules.minTimeBetweenShiftsMinutes / 60).toFixed(2))} hours` : 'Not set'}</td>
                    <td className="p-3">{contract.workLimits.enabled && contract.workLimits.consecutiveDaysWorked.enabled ? `${contract.workLimits.consecutiveDaysWorked.maxConsecutiveDays} days` : 'Not set'}</td>
                  </tr>)}</tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">Edit these values in Contract templates. Duplicate roster-wide hour, rest and consecutive-day inputs have been removed from this screen.</p>
            </div> : <><div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-0 flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input aria-label="Search rules in this category" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Search this category…" className="pl-9 h-9" />
              </div>
              <Select value={ruleFilter} onValueChange={setRuleFilter}>
                <SelectTrigger className="w-36 h-9" aria-label="Filter rule status"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="all">All rules</SelectItem><SelectItem value="HARD">Required</SelectItem><SelectItem value="SOFT">Preferred</SelectItem><SelectItem value="OFF">Off</SelectItem></SelectContent>
              </Select>
            </div>
            <CategorySection key={activeTab} category={activeTab as ConstraintCategory} config={constraintConfig} isLocationScope={isLocationScope} onUpdate={handleUpdate} searchQuery={searchQuery} ruleFilter={ruleFilter} />
            </>}
          </>}
        </div>
      </div>
    </div>
  );
}
