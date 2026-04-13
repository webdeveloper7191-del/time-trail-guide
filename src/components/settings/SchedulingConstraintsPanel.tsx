import React, { useState, useMemo } from 'react';
import {
  Users, UserCheck, Clock, Calendar, Shield, DollarSign,
  Scale, Target, Save, RotateCcw, Info, Sparkles, Check,
  Search, Building2, Globe, ChevronDown, ExternalLink,
  CircleDot, CircleOff, Filter, FileText, HelpCircle,
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
  constraintCategories,
  CONSTRAINT_DEFINITIONS,
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

const categoryIconMap: Record<string, React.ElementType> = {
  Users, UserCheck, Clock, Calendar, Shield, DollarSign, Scale, Target,
};

const categoryOrder: ConstraintCategory[] = [
  'coverage_staffing', 'employee_matching', 'work_limits', 'shift_rules',
  'compliance', 'cost_optimization', 'fairness_preferences', 'operational_quality',
];

// ============= Help Text Constants =============

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
          <button
            onClick={() => onChange(opt)}
            className={cn(
              "px-2.5 py-1 text-[10px] font-medium rounded transition-all",
              value === opt
                ? opt === 'HARD'
                  ? "bg-red-500 text-white shadow-sm"
                  : opt === 'SOFT'
                    ? "bg-amber-500 text-white shadow-sm"
                    : "bg-background text-muted-foreground shadow-sm border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt === 'HARD' ? '🔴 Hard' : opt === 'SOFT' ? '🟡 Soft' : '⚪ Off'}
          </button>
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
          <button
            onClick={() => onChange(opt)}
            className={cn(
              "px-2 py-0.5 text-[10px] font-medium rounded transition-all",
              value === opt
                ? opt === 'REQUIRED'
                  ? "bg-red-500 text-white shadow-sm"
                  : "bg-amber-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt === 'REQUIRED' ? 'Required' : 'Preferred'}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[250px]">
          <p className="text-[11px]">{HELP_TEXT.satisfiability.options[opt]}</p>
        </TooltipContent>
      </Tooltip>
    ))}
  </div>
);

// ============= Constraint Row =============

const ConstraintRow = ({ definition, enforcement, satisfiability, weight, priority, parameters, isLocationScope, hasOverride, onEnforcementChange, onSatisfiabilityChange, onWeightChange, onPriorityChange, onParameterChange }: {
  definition: ConstraintDefinition;
  enforcement: ConstraintEnforcement;
  satisfiability: Satisfiability;
  weight: number;
  priority: number;
  parameters: Record<string, any>;
  isLocationScope: boolean;
  hasOverride: boolean;
  onEnforcementChange: (v: ConstraintEnforcement) => void;
  onSatisfiabilityChange: (v: Satisfiability) => void;
  onWeightChange: (v: number) => void;
  onPriorityChange: (v: number) => void;
  onParameterChange: (key: string, value: any) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const isActive = enforcement !== 'OFF';
  const hasParams = definition.parameters.length > 0;
  const canExpand = isActive && (hasParams || enforcement === 'SOFT');

  return (
    <div className={cn(
      "group border rounded-lg transition-all",
      isActive ? "bg-card border-border" : "bg-muted/30 border-border/50",
      expanded && "ring-1 ring-primary/20",
    )}>
      {/* Main Row */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Code */}
        <Badge variant="outline" className={cn(
          "text-[10px] font-mono px-1.5 shrink-0 min-w-[32px] justify-center",
          definition.code.startsWith('H') ? "border-red-300 text-red-600" : "border-amber-300 text-amber-600"
        )}>
          {definition.code}
        </Badge>

        {/* Name + Description */}
        <button
          className="flex-1 min-w-0 text-left"
          onClick={() => canExpand && setExpanded(!expanded)}
        >
          <div className="flex items-center gap-1.5">
            <span className={cn("text-sm font-medium", !isActive && "text-muted-foreground")}>
              {definition.name}
            </span>
            {hasOverride && isLocationScope && (
              <Badge variant="secondary" className="text-[9px] px-1 bg-blue-100 text-blue-700 border-blue-200">
                Override
              </Badge>
            )}
            {isActive && (
              <Badge variant="outline" className={cn(
                "text-[9px] px-1",
                satisfiability === 'REQUIRED' ? "border-red-200 text-red-600" : "border-amber-200 text-amber-600"
              )}>
                {satisfiability}
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
            {definition.description}
          </p>
        </button>

        {/* Enforcement */}
        <EnforcementSelector value={enforcement} onChange={onEnforcementChange} />

        {/* Expand */}
        {canExpand && (
          <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-muted rounded">
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform text-muted-foreground", expanded && "rotate-180")} />
          </button>
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

          {/* Satisfiability + Priority + Weight Row */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">Satisfiability:</Label>
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

          {/* Parameters */}
          {hasParams && (
            <>
              <Separator />
              <div className="space-y-2.5">
                <Label className="text-xs font-semibold text-foreground">Configuration Values</Label>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {definition.parameters.map(param => (
                    <div key={param.key} className="flex items-center gap-2">
                      <div className="flex items-center gap-1 min-w-[160px]">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">{param.label}</Label>
                        {param.tooltip && (
                          <Tooltip>
                            <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                            <TooltipContent><p className="text-xs max-w-[250px]">{param.tooltip}</p></TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      {param.type === 'number' && (
                        <div className="flex items-center gap-1.5">
                          <Input type="number" value={parameters[param.key] ?? param.defaultValue}
                            onChange={e => onParameterChange(param.key, Number(e.target.value))}
                            className="h-7 w-20 text-xs" min={param.min} max={param.max} step={param.step ?? 1} />
                          {param.unit && <span className="text-[10px] text-muted-foreground">{param.unit}</span>}
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

          {/* Timefold docs link */}
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
        </div>
      )}
    </div>
  );
};

// ============= Category Section =============

const CategorySection = ({ category, config, isLocationScope, onUpdate }: {
  category: ConstraintCategory;
  config: SchedulingConstraintsConfig;
  isLocationScope: boolean;
  onUpdate: (id: string, field: string, value: any) => void;
}) => {
  const meta = constraintCategories[category];
  const definitions = getConstraintsByCategory(category);
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
            {hardCount > 0 && <Badge className="bg-red-100 text-red-700 border-red-200 text-[9px] px-1">{hardCount} Hard</Badge>}
            {softCount > 0 && <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[9px] px-1">{softCount} Soft</Badge>}
          </div>
          <p className="text-[11px] text-muted-foreground">{meta.description}</p>
        </div>
      </div>

      <div className="space-y-1.5 pl-1">
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
              isLocationScope={isLocationScope}
              hasOverride={hasOverride}
              onEnforcementChange={v => onUpdate(def.id, 'enforcement', v)}
              onSatisfiabilityChange={v => onUpdate(def.id, 'satisfiability', v)}
              onWeightChange={v => onUpdate(def.id, 'weight', v)}
              onPriorityChange={v => onUpdate(def.id, 'priority', v)}
              onParameterChange={(key, val) => onUpdate(def.id, `param.${key}`, val)}
            />
          );
        })}
      </div>
    </div>
  );
};

// ============= Main Panel =============

export function SchedulingConstraintsPanel() {
  const [constraintConfig, setConstraintConfig] = useState<SchedulingConstraintsConfig>(createDefaultConstraintsConfig);
  const [contractConfig, setContractConfig] = useState<TimefoldConstraintConfiguration>(() => ({
    ...defaultConstraintConfig,
  }));
  const [activeTab, setActiveTab] = useState<string>('contracts');
  const [searchQuery, setSearchQuery] = useState('');
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Scheduling Constraints
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Full constraint configuration — contracts, H1-H20 hard constraints, S1-S20 soft constraints, all with configurable values
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowHelp(!showHelp)} className={cn(showHelp && "bg-muted")}>
            <HelpCircle className="h-3.5 w-3.5 mr-1" /> How it works
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="h-3.5 w-3.5 mr-1" /> Save
          </Button>
        </div>
      </div>

      {/* Help Guide */}
      {showHelp && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4 text-primary" />
              Understanding Constraint Configuration
            </h3>
            <div className="grid grid-cols-2 gap-4">
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
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border text-xs">
        <div className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium">{contractCount} Contracts</span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-1.5">
          <CircleDot className="h-3.5 w-3.5 text-red-500" />
          <span className="font-medium">{stats.hard} Hard</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CircleDot className="h-3.5 w-3.5 text-amber-500" />
          <span className="font-medium">{stats.soft} Soft</span>
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

      {/* Industry Presets */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Quick Presets</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {industryPresets.map(preset => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className={cn(
                "relative flex flex-col items-center gap-1 p-2.5 rounded-lg border text-center transition-all hover:border-primary/50 hover:bg-primary/5",
                activePreset === preset.id
                  ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                  : "border-border bg-card"
              )}
            >
              {activePreset === preset.id && (
                <div className="absolute top-1 right-1"><Check className="h-3 w-3 text-primary" /></div>
              )}
              <span className="text-lg">{preset.icon}</span>
              <span className="text-[10px] font-medium">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 flex-wrap">
          <TabsTrigger value="contracts" className="flex items-center gap-1.5 text-xs px-3 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <FileText className="h-3.5 w-3.5" />
            Contracts ({contractCount})
          </TabsTrigger>
          <TabsTrigger value="constraints" className="flex items-center gap-1.5 text-xs px-3 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Shield className="h-3.5 w-3.5" />
            All Constraints ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="hard" className="flex items-center gap-1.5 text-xs px-3 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <CircleDot className="h-3.5 w-3.5 text-red-500" />
            Hard ({stats.hard})
          </TabsTrigger>
          <TabsTrigger value="soft" className="flex items-center gap-1.5 text-xs px-3 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <CircleDot className="h-3.5 w-3.5 text-amber-500" />
            Soft ({stats.soft})
          </TabsTrigger>
        </TabsList>

        {/* Search + Category Filter (shown for constraint tabs) */}
        {activeTab !== 'contracts' && (
          <div className="flex items-center gap-2 mt-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search constraints..." className="h-8 pl-8 text-xs" />
            </div>
            <Select value={filterCategory} onValueChange={v => setFilterCategory(v as any)}>
              <SelectTrigger className="h-8 w-48 text-xs">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Categories</SelectItem>
                {categoryOrder.map(cat => (
                  <SelectItem key={cat} value={cat} className="text-xs">{constraintCategories[cat].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <ScrollArea className="h-[calc(100vh-520px)] min-h-[400px] mt-3">
          <div className="pr-4">
            {/* Contracts Tab */}
            <TabsContent value="contracts" className="mt-0">
              <ContractTemplatesSection
                contracts={contractConfig.employeeConstraints.contracts.contracts}
                onChange={contracts => setContractConfig(prev => ({
                  ...prev,
                  employeeConstraints: {
                    ...prev.employeeConstraints,
                    contracts: { ...prev.employeeConstraints.contracts, contracts },
                  },
                }))}
              />
            </TabsContent>

            {/* All Constraints Tab */}
            <TabsContent value="constraints" className="mt-0">
              <div className="space-y-6">
                {filteredCategories.map(cat => (
                  <CategorySection key={cat} category={cat} config={constraintConfig} isLocationScope={isLocationScope} onUpdate={handleUpdate} />
                ))}
                {filteredCategories.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No constraints match your filters</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Hard Only Tab */}
            <TabsContent value="hard" className="mt-0">
              <div className="space-y-6">
                {filteredCategories.map(cat => {
                  const defs = getConstraintsByCategory(cat).filter(d => {
                    const s = constraintConfig.constraints[d.id];
                    if (!s) return false;
                    return getEffectiveSetting(s, constraintConfig.activeLocationId).enforcement === 'HARD';
                  });
                  if (defs.length === 0) return null;
                  const meta = constraintCategories[cat];
                  const Icon = categoryIconMap[meta.icon] || Target;
                  return (
                    <div key={cat} className="space-y-2">
                      <div className="flex items-center gap-2 px-1">
                        <div className="p-1.5 rounded-md bg-red-100 text-red-600"><Icon className="h-4 w-4" /></div>
                        <span className="text-sm font-semibold">{meta.label}</span>
                        <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] px-1.5">{defs.length}</Badge>
                      </div>
                      <div className="space-y-1.5 pl-1">
                        {defs.map(def => {
                          const setting = constraintConfig.constraints[def.id];
                          if (!setting) return null;
                          const effective = getEffectiveSetting(setting, constraintConfig.activeLocationId);
                          const hasOverride = isLocationScope && constraintConfig.activeLocationId
                            ? !!setting.locationOverrides[constraintConfig.activeLocationId] : false;
                          return (
                            <ConstraintRow key={def.id} definition={def} enforcement={effective.enforcement}
                              satisfiability={effective.satisfiability} weight={effective.weight} priority={effective.priority}
                              parameters={effective.parameters} isLocationScope={isLocationScope} hasOverride={hasOverride}
                              onEnforcementChange={v => handleUpdate(def.id, 'enforcement', v)}
                              onSatisfiabilityChange={v => handleUpdate(def.id, 'satisfiability', v)}
                              onWeightChange={v => handleUpdate(def.id, 'weight', v)}
                              onPriorityChange={v => handleUpdate(def.id, 'priority', v)}
                              onParameterChange={(k, val) => handleUpdate(def.id, `param.${k}`, val)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* Soft Only Tab */}
            <TabsContent value="soft" className="mt-0">
              <div className="space-y-6">
                {filteredCategories.map(cat => {
                  const defs = getConstraintsByCategory(cat).filter(d => {
                    const s = constraintConfig.constraints[d.id];
                    if (!s) return false;
                    return getEffectiveSetting(s, constraintConfig.activeLocationId).enforcement === 'SOFT';
                  });
                  if (defs.length === 0) return null;
                  const meta = constraintCategories[cat];
                  const Icon = categoryIconMap[meta.icon] || Target;
                  return (
                    <div key={cat} className="space-y-2">
                      <div className="flex items-center gap-2 px-1">
                        <div className="p-1.5 rounded-md bg-amber-100 text-amber-600"><Icon className="h-4 w-4" /></div>
                        <span className="text-sm font-semibold">{meta.label}</span>
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-1.5">{defs.length}</Badge>
                      </div>
                      <div className="space-y-1.5 pl-1">
                        {defs.map(def => {
                          const setting = constraintConfig.constraints[def.id];
                          if (!setting) return null;
                          const effective = getEffectiveSetting(setting, constraintConfig.activeLocationId);
                          const hasOverride = isLocationScope && constraintConfig.activeLocationId
                            ? !!setting.locationOverrides[constraintConfig.activeLocationId] : false;
                          return (
                            <ConstraintRow key={def.id} definition={def} enforcement={effective.enforcement}
                              satisfiability={effective.satisfiability} weight={effective.weight} priority={effective.priority}
                              parameters={effective.parameters} isLocationScope={isLocationScope} hasOverride={hasOverride}
                              onEnforcementChange={v => handleUpdate(def.id, 'enforcement', v)}
                              onSatisfiabilityChange={v => handleUpdate(def.id, 'satisfiability', v)}
                              onWeightChange={v => handleUpdate(def.id, 'weight', v)}
                              onPriorityChange={v => handleUpdate(def.id, 'priority', v)}
                              onParameterChange={(k, val) => handleUpdate(def.id, `param.${k}`, val)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
