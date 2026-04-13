import React, { useState } from 'react';
import {
  Shield, Save, RotateCcw, Globe, Building2, Sparkles, Check,
  FileText, Calendar, UserCheck, DollarSign, Target,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  type TimefoldConstraintConfiguration,
  defaultConstraintConfig,
} from '@/types/timefoldConstraintConfig';
import { industryPresets } from '@/types/timefoldConstraintPresets';
import { ContractTemplatesSection } from './constraints/ContractTemplatesSection';
import { ShiftRulesSection } from './constraints/ShiftRulesSection';
import { StaffingMatchingSection } from './constraints/StaffingMatchingSection';
import { CostFairnessSection } from './constraints/CostFairnessSection';
import { OperationalQualitySection } from './constraints/OperationalQualitySection';

type Scope = 'business' | 'location';

const sectionTabs = [
  { id: 'contracts', label: 'Contracts', icon: FileText },
  { id: 'shift-rules', label: 'Shift Rules', icon: Calendar },
  { id: 'staffing', label: 'Staffing & Matching', icon: UserCheck },
  { id: 'cost', label: 'Cost & Fairness', icon: DollarSign },
  { id: 'quality', label: 'Quality', icon: Target },
] as const;

export function SchedulingConstraintsPanel() {
  const [config, setConfig] = useState<TimefoldConstraintConfiguration>(() => ({
    ...defaultConstraintConfig,
  }));
  const [scope, setScope] = useState<Scope>('business');
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('contracts');

  const isLocationScope = scope === 'location';

  // Demo locations
  const locations = [
    { id: 'loc-1', name: 'Melbourne CBD Centre' },
    { id: 'loc-2', name: 'Sydney North Shore' },
    { id: 'loc-3', name: 'Brisbane Southbank' },
  ];

  // Update helpers
  const updateEmployeeConstraint = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      employeeConstraints: { ...prev.employeeConstraints, [key]: value },
    }));
  };

  const updateShiftConstraint = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      shiftConstraints: { ...prev.shiftConstraints, [key]: value },
    }));
  };

  const handleSave = () => {
    toast.success('Constraint configuration saved successfully');
  };

  const handleReset = () => {
    setConfig({ ...defaultConstraintConfig });
    setActivePreset(null);
    toast.info('Configuration reset to defaults');
  };

  const applyPreset = (presetId: string) => {
    const preset = industryPresets.find(p => p.id === presetId);
    if (preset) {
      setConfig({ ...preset.config });
      setActivePreset(presetId);
      toast.success(`Applied "${preset.name}" preset`);
    }
  };

  // Stats
  const contractCount = config.employeeConstraints.contracts.contracts.length;
  const enabledFeatures = [
    config.employeeConstraints.availability.enabled && 'Availability',
    config.employeeConstraints.fairness.enabled && 'Fairness',
    config.shiftConstraints.skills.enabled && 'Skills',
    config.shiftConstraints.costManagement.enabled && 'Cost',
    config.employeeConstraints.travel.enabled && 'Travel',
    config.employeeConstraints.pairing.enabled && 'Pairing',
  ].filter(Boolean);

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
            Full Timefold ESS constraint configuration — contracts, rules, and optimization settings
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
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border text-xs">
        <div className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium">{contractCount} Contracts</span>
        </div>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">
          Enabled: {enabledFeatures.join(', ') || 'None'}
        </span>
      </div>

      {/* Scope Toggle */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
              <button
                onClick={() => { setScope('business'); setActiveLocationId(null); }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-all",
                  !isLocationScope ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Globe className="h-3.5 w-3.5" />
                Business-Wide
              </button>
              <button
                onClick={() => { setScope('location'); setActiveLocationId(activeLocationId || locations[0]?.id || null); }}
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
              <Select value={activeLocationId || ''} onValueChange={v => setActiveLocationId(v)}>
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
                Overrides apply to selected location only. Unmodified settings inherit business-wide defaults.
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

      {/* Section Tabs */}
      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="w-full justify-start h-auto p-1 bg-muted/50">
          {sectionTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-1.5 text-xs px-3 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <ScrollArea className="h-[calc(100vh-520px)] min-h-[400px] mt-3">
          <div className="pr-4">
            <TabsContent value="contracts" className="mt-0">
              <ContractTemplatesSection
                contracts={config.employeeConstraints.contracts.contracts}
                onChange={contracts => updateEmployeeConstraint('contracts', {
                  ...config.employeeConstraints.contracts,
                  contracts,
                })}
              />
            </TabsContent>

            <TabsContent value="shift-rules" className="mt-0">
              <ShiftRulesSection
                shiftPriority={config.shiftConstraints.shiftPriority}
                shiftSelection={config.shiftConstraints.shiftSelection}
                breaks={config.employeeConstraints.breaks}
                alternativeShifts={config.shiftConstraints.alternativeShifts}
                onUpdate={(key, value) => {
                  if (key === 'breaks') {
                    updateEmployeeConstraint(key, value);
                  } else {
                    updateShiftConstraint(key, value);
                  }
                }}
              />
            </TabsContent>

            <TabsContent value="staffing" className="mt-0">
              <StaffingMatchingSection
                availability={config.employeeConstraints.availability}
                skills={config.shiftConstraints.skills}
                priority={config.employeeConstraints.priority}
                pairing={config.employeeConstraints.pairing}
                activation={config.employeeConstraints.activation}
                employeeSelection={config.shiftConstraints.employeeSelection}
                shiftTypeDiversity={config.employeeConstraints.shiftTypeDiversity}
                onUpdate={(key, value) => {
                  if (key === 'skills' || key === 'employeeSelection') {
                    updateShiftConstraint(key, value);
                  } else {
                    updateEmployeeConstraint(key, value);
                  }
                }}
              />
            </TabsContent>

            <TabsContent value="cost" className="mt-0">
              <CostFairnessSection
                costManagement={config.shiftConstraints.costManagement}
                fairness={config.employeeConstraints.fairness}
                travel={config.employeeConstraints.travel}
                demandScheduling={config.shiftConstraints.demandScheduling}
                onUpdate={(key, value) => {
                  if (key === 'costManagement' || key === 'demandScheduling') {
                    updateShiftConstraint(key, value);
                  } else {
                    updateEmployeeConstraint(key, value);
                  }
                }}
              />
            </TabsContent>

            <TabsContent value="quality" className="mt-0">
              <OperationalQualitySection />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
