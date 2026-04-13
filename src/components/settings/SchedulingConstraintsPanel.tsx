import React, { useState, useMemo } from 'react';
import {
  Users, UserCheck, Clock, Calendar, Shield, DollarSign,
  Scale, Target, Save, RotateCcw, Info, Sparkles, Check,
  Search, Building2, Globe, ChevronDown, ExternalLink,
  AlertTriangle, CircleDot, CircleOff, Filter,
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
  type SchedulingConstraintsConfig,
  constraintCategories,
  CONSTRAINT_DEFINITIONS,
  createDefaultConstraintsConfig,
  getConstraintsByCategory,
  getEffectiveSetting,
} from '@/types/schedulingConstraints';
import { industryPresets } from '@/types/timefoldConstraintPresets';

const categoryIconMap: Record<string, React.ElementType> = {
  Users, UserCheck, Clock, Calendar, Shield, DollarSign, Scale, Target,
};

const categoryOrder: ConstraintCategory[] = [
  'coverage_staffing', 'employee_matching', 'work_limits', 'shift_rules',
  'compliance', 'cost_optimization', 'fairness_preferences', 'operational_quality',
];

// ============= Enforcement Badge =============

const EnforcementBadge = ({ enforcement }: { enforcement: ConstraintEnforcement }) => {
  if (enforcement === 'HARD') {
    return <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] px-1.5 font-semibold">Hard</Badge>;
  }
  if (enforcement === 'SOFT') {
    return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-1.5 font-semibold">Soft</Badge>;
  }
  return <Badge variant="outline" className="text-muted-foreground text-[10px] px-1.5">Off</Badge>;
};

// ============= Enforcement Selector =============

const EnforcementSelector = ({ value, onChange, defaultType }: {
  value: ConstraintEnforcement;
  onChange: (v: ConstraintEnforcement) => void;
  defaultType: ConstraintEnforcement;
}) => (
  <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
    {(['HARD', 'SOFT', 'OFF'] as const).map(opt => (
      <button
        key={opt}
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
    ))}
  </div>
);

// ============= Constraint Row =============

const ConstraintRow = ({ definition, enforcement, weight, parameters, isLocationScope, hasOverride, onEnforcementChange, onWeightChange, onParameterChange }: {
  definition: ConstraintDefinition;
  enforcement: ConstraintEnforcement;
  weight: number;
  parameters: Record<string, any>;
  isLocationScope: boolean;
  hasOverride: boolean;
  onEnforcementChange: (v: ConstraintEnforcement) => void;
  onWeightChange: (v: number) => void;
  onParameterChange: (key: string, value: any) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const isActive = enforcement !== 'OFF';
  const hasParams = definition.parameters.length > 0;
  const isSoft = enforcement === 'SOFT';

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
          onClick={() => (hasParams || isSoft) && setExpanded(!expanded)}
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
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
            {definition.description}
          </p>
        </button>

        {/* Enforcement */}
        <EnforcementSelector value={enforcement} onChange={onEnforcementChange} defaultType={definition.defaultEnforcement} />

        {/* Expand */}
        {(hasParams || isSoft) && (
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

          {/* Weight slider for SOFT */}
          {isSoft && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs text-muted-foreground">Penalty Weight</Label>
                <span className="text-xs font-mono font-medium">{weight}</span>
              </div>
              <Slider value={[weight]} onValueChange={([v]) => onWeightChange(v)} min={1} max={100} step={1} />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Low priority</span>
                <span>High priority</span>
              </div>
            </div>
          )}

          {/* Parameters */}
          {hasParams && (
            <div className="space-y-2.5">
              {definition.parameters.map(param => (
                <div key={param.key} className="flex items-center gap-2">
                  <div className="flex items-center gap-1 min-w-[160px]">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">{param.label}</Label>
                    {param.tooltip && (
                      <Tooltip>
                        <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                        <TooltipContent><p className="text-xs max-w-[220px]">{param.tooltip}</p></TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  {param.type === 'number' && (
                    <div className="flex items-center gap-1.5">
                      <Input type="number" value={parameters[param.key] ?? param.defaultValue}
                        onChange={e => onParameterChange(param.key, Number(e.target.value))}
                        className="h-7 w-20 text-xs" min={param.min} max={param.max} />
                      {param.unit && <span className="text-[10px] text-muted-foreground">{param.unit}</span>}
                    </div>
                  )}
                  {param.type === 'select' && (
                    <Select value={parameters[param.key] ?? param.defaultValue}
                      onValueChange={v => onParameterChange(param.key, v)}>
                      <SelectTrigger className="h-7 w-36 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {param.options?.map(o => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                  {param.type === 'boolean' && (
                    <Switch checked={parameters[param.key] ?? param.defaultValue}
                      onCheckedChange={v => onParameterChange(param.key, v)} />
                  )}
                  {param.perContract && (
                    <Badge variant="outline" className="text-[9px] px-1 text-muted-foreground">per contract</Badge>
                  )}
                </div>
              ))}
            </div>
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
    const effective = getEffectiveSetting(setting, config.activeLocationId);
    return effective.enforcement !== 'OFF';
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
          </div>
          <p className="text-[11px] text-muted-foreground">{meta.description}</p>
        </div>
      </div>

      <div className="space-y-1.5 pl-1">
        {definitions.map(def => {
          const setting = config.constraints[def.id];
          const effective = getEffectiveSetting(setting, config.activeLocationId);
          const hasOverride = isLocationScope && config.activeLocationId 
            ? !!setting.locationOverrides[config.activeLocationId]
            : false;

          return (
            <ConstraintRow
              key={def.id}
              definition={def}
              enforcement={effective.enforcement}
              weight={effective.weight}
              parameters={effective.parameters}
              isLocationScope={isLocationScope}
              hasOverride={hasOverride}
              onEnforcementChange={v => onUpdate(def.id, 'enforcement', v)}
              onWeightChange={v => onUpdate(def.id, 'weight', v)}
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
  const [config, setConfig] = useState<SchedulingConstraintsConfig>(createDefaultConstraintsConfig);
  const [activeTab, setActiveTab] = useState<'all' | 'hard' | 'soft'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<ConstraintCategory | 'all'>('all');
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const isLocationScope = config.scope === 'location';

  // Demo locations
  const locations = [
    { id: 'loc-1', name: 'Melbourne CBD Centre' },
    { id: 'loc-2', name: 'Sydney North Shore' },
    { id: 'loc-3', name: 'Brisbane Southbank' },
  ];

  const handleUpdate = (constraintId: string, field: string, value: any) => {
    setConfig(prev => {
      const next = { ...prev, constraints: { ...prev.constraints } };
      const setting = { ...next.constraints[constraintId] };

      if (isLocationScope && prev.activeLocationId) {
        // Create/update location override
        const overrides = { ...setting.locationOverrides };
        const existing = overrides[prev.activeLocationId] || {};
        
        if (field === 'enforcement') {
          overrides[prev.activeLocationId] = { ...existing, enforcement: value };
        } else if (field === 'weight') {
          overrides[prev.activeLocationId] = { ...existing, weight: value };
        } else if (field.startsWith('param.')) {
          const paramKey = field.slice(6);
          overrides[prev.activeLocationId] = { 
            ...existing, 
            parameters: { ...(existing.parameters ?? {}), [paramKey]: value } 
          };
        }
        setting.locationOverrides = overrides;
      } else {
        // Update business-wide
        if (field === 'enforcement') setting.enforcement = value;
        else if (field === 'weight') setting.weight = value;
        else if (field.startsWith('param.')) {
          const paramKey = field.slice(6);
          setting.parameters = { ...setting.parameters, [paramKey]: paramKey };
          setting.parameters[paramKey] = value;
        }
      }

      next.constraints[constraintId] = setting;
      return next;
    });
  };

  const handleSave = () => {
    toast.success('Constraint configuration saved successfully');
  };

  const handleReset = () => {
    setConfig(createDefaultConstraintsConfig());
    setActivePreset(null);
    toast.info('Configuration reset to defaults');
  };

  // Filter constraints
  const filteredCategories = useMemo(() => {
    return categoryOrder.filter(cat => {
      if (filterCategory !== 'all' && cat !== filterCategory) return false;
      const defs = getConstraintsByCategory(cat);
      return defs.some(d => {
        const matchesTab = activeTab === 'all' 
          || (activeTab === 'hard' && d.code.startsWith('H'))
          || (activeTab === 'soft' && d.code.startsWith('S'));
        const matchesSearch = !searchQuery 
          || d.name.toLowerCase().includes(searchQuery.toLowerCase())
          || d.code.toLowerCase().includes(searchQuery.toLowerCase())
          || d.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
      });
    });
  }, [activeTab, searchQuery, filterCategory]);

  // Stats
  const stats = useMemo(() => {
    const all = CONSTRAINT_DEFINITIONS;
    let hard = 0, soft = 0, off = 0;
    all.forEach(d => {
      const s = config.constraints[d.id];
      const e = getEffectiveSetting(s, config.activeLocationId);
      if (e.enforcement === 'HARD') hard++;
      else if (e.enforcement === 'SOFT') soft++;
      else off++;
    });
    return { total: all.length, hard, soft, off };
  }, [config]);

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
            Configure hard and soft constraints for the AI roster solver
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

      {/* Stats Bar */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-1.5">
            <CircleDot className="h-3.5 w-3.5 text-red-500" />
            <span className="text-xs font-medium">{stats.hard} Hard</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CircleDot className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-medium">{stats.soft} Soft</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CircleOff className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium">{stats.off} Off</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-xs text-muted-foreground">{stats.total} total constraints</span>
        </div>
      </div>

      {/* Scope Toggle */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
              <button
                onClick={() => setConfig(p => ({ ...p, scope: 'business', activeLocationId: null }))}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-all",
                  !isLocationScope ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Globe className="h-3.5 w-3.5" />
                Business-Wide
              </button>
              <button
                onClick={() => setConfig(p => ({ ...p, scope: 'location', activeLocationId: p.activeLocationId || locations[0]?.id || null }))}
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
              <Select value={config.activeLocationId || ''} onValueChange={v => setConfig(p => ({ ...p, activeLocationId: v }))}>
                <SelectTrigger className="h-8 w-56 text-xs">
                  <SelectValue placeholder="Select location..." />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(loc => (
                    <SelectItem key={loc.id} value={loc.id} className="text-xs">{loc.name}</SelectItem>
                  ))}
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
              onClick={() => {
                setActivePreset(preset.id);
                toast.success(`Applied ${preset.name} preset`);
              }}
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

      {/* Filter Bar */}
      <div className="flex items-center gap-2">
        {/* Tab filter */}
        <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
          {(['all', 'hard', 'soft'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded transition-all",
                activeTab === tab ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === 'all' ? `All (${stats.total})` : tab === 'hard' ? `Hard (${stats.hard})` : `Soft (${stats.soft})`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search constraints..."
            className="h-8 pl-8 text-xs"
          />
        </div>

        {/* Category filter */}
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

      {/* Constraint List */}
      <ScrollArea className="h-[calc(100vh-520px)] min-h-[300px]">
        <div className="space-y-6 pr-4">
          {filteredCategories.map(cat => (
            <CategorySection
              key={cat}
              category={cat}
              config={config}
              isLocationScope={isLocationScope}
              onUpdate={handleUpdate}
            />
          ))}
          {filteredCategories.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No constraints match your filters</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
