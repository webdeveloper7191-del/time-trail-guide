import React from 'react';
import {
  DollarSign, Scale, MapPin, TrendingUp, Info,
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
  CostManagementConfig,
  FairnessConfig,
  TravelConfig,
  DemandSchedulingConfig,
} from '@/types/timefoldConstraintConfig';

interface CostFairnessSectionProps {
  costManagement: CostManagementConfig;
  fairness: FairnessConfig;
  travel: TravelConfig;
  demandScheduling: DemandSchedulingConfig;
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
        <div className="pl-9 space-y-2.5 pt-1">{children}</div>
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

export function CostFairnessSection({
  costManagement, fairness, travel, demandScheduling, onUpdate,
}: CostFairnessSectionProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          Cost & Fairness
        </h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Optimise labour costs, balance workload distribution, and manage travel.
        </p>
      </div>

      {/* Cost Management */}
      <ConstraintCard
        icon={DollarSign}
        title="Cost Management"
        description="Minimise labour costs through cost groups and rate optimisation"
        enabled={costManagement.enabled}
        onToggle={v => onUpdate('costManagement', { ...costManagement, enabled: v })}
      >
        <InlineField label="Cost groups" tooltip="Group employees by cost tier and minimise expensive assignments">
          <Switch checked={costManagement.costGroups.enabled}
            onCheckedChange={v => onUpdate('costManagement', { ...costManagement, costGroups: { ...costManagement.costGroups, enabled: v } })} />
        </InlineField>
        {costManagement.costGroups.enabled && (
          <InlineField label="  Minimise cost group usage">
            <Switch checked={costManagement.costGroups.minimizeCostGroupUsage}
              onCheckedChange={v => onUpdate('costManagement', { ...costManagement, costGroups: { ...costManagement.costGroups, minimizeCostGroupUsage: v } })} />
          </InlineField>
        )}
        <InlineField label="Prefer lower-cost employees">
          <Switch checked={costManagement.employeeRates.preferLowerCostEmployees}
            onCheckedChange={v => onUpdate('costManagement', { ...costManagement, employeeRates: { ...costManagement.employeeRates, preferLowerCostEmployees: v } })} />
        </InlineField>
        <InlineField label="Cost preference weight">
          <Slider value={[costManagement.employeeRates.weight]} onValueChange={([v]) => onUpdate('costManagement', {
            ...costManagement, employeeRates: { ...costManagement.employeeRates, weight: v },
          })} min={0} max={100} step={5} className="w-32" />
          <span className="text-xs font-mono w-8 text-right">{costManagement.employeeRates.weight}</span>
        </InlineField>
      </ConstraintCard>

      {/* Demand Scheduling */}
      <ConstraintCard
        icon={TrendingUp}
        title="Demand-Based Scheduling"
        description="Schedule based on hourly demand curves or fixed shift slots"
        enabled={demandScheduling.enabled}
        onToggle={v => onUpdate('demandScheduling', { ...demandScheduling, enabled: v })}
      >
        <InlineField label="Scheduling mode">
          <Select value={demandScheduling.mode}
            onValueChange={v => onUpdate('demandScheduling', { ...demandScheduling, mode: v })}>
            <SelectTrigger className="h-7 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="shift_slot" className="text-xs">Fixed Shift Slots</SelectItem>
              <SelectItem value="hourly_demand" className="text-xs">Hourly Demand</SelectItem>
            </SelectContent>
          </Select>
        </InlineField>
        {demandScheduling.mode === 'hourly_demand' && demandScheduling.hourlyDemand.enabled && (
          <>
            <InlineField label="Understaffing penalty">
              <Slider value={[demandScheduling.hourlyDemand.understaffingPenaltyWeight]}
                onValueChange={([v]) => onUpdate('demandScheduling', {
                  ...demandScheduling, hourlyDemand: { ...demandScheduling.hourlyDemand, understaffingPenaltyWeight: v },
                })} min={0} max={100} step={5} className="w-32" />
              <span className="text-xs font-mono w-8 text-right">{demandScheduling.hourlyDemand.understaffingPenaltyWeight}</span>
            </InlineField>
            <InlineField label="Overstaffing penalty">
              <Slider value={[demandScheduling.hourlyDemand.overstaffingPenaltyWeight]}
                onValueChange={([v]) => onUpdate('demandScheduling', {
                  ...demandScheduling, hourlyDemand: { ...demandScheduling.hourlyDemand, overstaffingPenaltyWeight: v },
                })} min={0} max={100} step={5} className="w-32" />
              <span className="text-xs font-mono w-8 text-right">{demandScheduling.hourlyDemand.overstaffingPenaltyWeight}</span>
            </InlineField>
          </>
        )}
      </ConstraintCard>

      {/* Fairness */}
      <ConstraintCard
        icon={Scale}
        title="Fairness & Balance"
        description="Balance workload and shift distribution across employees"
        enabled={fairness.enabled}
        onToggle={v => onUpdate('fairness', { ...fairness, enabled: v })}
      >
        <InlineField label="Balance time worked">
          <Switch checked={fairness.balanceTimeWorked.enabled}
            onCheckedChange={v => onUpdate('fairness', { ...fairness, balanceTimeWorked: { ...fairness.balanceTimeWorked, enabled: v } })} />
          {fairness.balanceTimeWorked.enabled && (
            <>
              <Slider value={[fairness.balanceTimeWorked.weight]} onValueChange={([v]) => onUpdate('fairness', {
                ...fairness, balanceTimeWorked: { ...fairness.balanceTimeWorked, weight: v },
              })} min={0} max={100} step={5} className="w-24" />
              <span className="text-xs font-mono w-8 text-right">{fairness.balanceTimeWorked.weight}</span>
            </>
          )}
        </InlineField>
        <InlineField label="Balance shift count">
          <Switch checked={fairness.balanceShiftCount.enabled}
            onCheckedChange={v => onUpdate('fairness', { ...fairness, balanceShiftCount: { ...fairness.balanceShiftCount, enabled: v } })} />
          {fairness.balanceShiftCount.enabled && (
            <>
              <Slider value={[fairness.balanceShiftCount.weight]} onValueChange={([v]) => onUpdate('fairness', {
                ...fairness, balanceShiftCount: { ...fairness.balanceShiftCount, weight: v },
              })} min={0} max={100} step={5} className="w-24" />
              <span className="text-xs font-mono w-8 text-right">{fairness.balanceShiftCount.weight}</span>
            </>
          )}
        </InlineField>
      </ConstraintCard>

      {/* Travel */}
      <ConstraintCard
        icon={MapPin}
        title="Shift Travel & Locations"
        description="Limit travel distance and locations per period"
        enabled={travel.enabled}
        onToggle={v => onUpdate('travel', { ...travel, enabled: v })}
      >
        <InlineField label="Max travel distance">
          <Input type="number" value={travel.maxTravelDistanceKm}
            onChange={e => onUpdate('travel', { ...travel, maxTravelDistanceKm: Number(e.target.value) })}
            className="h-7 w-16 text-xs" min={1} max={500} />
          <span className="text-[10px] text-muted-foreground">km</span>
          <Select value={travel.satisfiability}
            onValueChange={v => onUpdate('travel', { ...travel, satisfiability: v })}>
            <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="REQUIRED" className="text-xs">Required</SelectItem>
              <SelectItem value="PREFERRED" className="text-xs">Preferred</SelectItem>
            </SelectContent>
          </Select>
        </InlineField>
        <InlineField label="Include travel in rest calc" tooltip="Min gap between shifts includes travel time">
          <Input type="number" value={travel.minTimeBetweenShiftsIncludingTravelMinutes}
            onChange={e => onUpdate('travel', { ...travel, minTimeBetweenShiftsIncludingTravelMinutes: Number(e.target.value) })}
            className="h-7 w-16 text-xs" min={0} />
          <span className="text-[10px] text-muted-foreground">min</span>
        </InlineField>
        <InlineField label="Minimise travel distance">
          <Switch checked={travel.minimizeTravelDistance}
            onCheckedChange={v => onUpdate('travel', { ...travel, minimizeTravelDistance: v })} />
        </InlineField>
        <InlineField label="Max locations per period">
          <Switch checked={travel.maxLocationsPerPeriod.enabled}
            onCheckedChange={v => onUpdate('travel', { ...travel, maxLocationsPerPeriod: { ...travel.maxLocationsPerPeriod, enabled: v } })} />
          {travel.maxLocationsPerPeriod.enabled && (
            <>
              <Input type="number" value={travel.maxLocationsPerPeriod.maxLocations}
                onChange={e => onUpdate('travel', { ...travel, maxLocationsPerPeriod: { ...travel.maxLocationsPerPeriod, maxLocations: Number(e.target.value) } })}
                className="h-7 w-14 text-xs" min={1} max={20} />
              <span className="text-[10px] text-muted-foreground">per</span>
              <Select value={travel.maxLocationsPerPeriod.period}
                onValueChange={v => onUpdate('travel', { ...travel, maxLocationsPerPeriod: { ...travel.maxLocationsPerPeriod, period: v } })}>
                <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAY" className="text-xs">Day</SelectItem>
                  <SelectItem value="WEEK" className="text-xs">Week</SelectItem>
                  <SelectItem value="MONTH" className="text-xs">Month</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </InlineField>
      </ConstraintCard>
    </div>
  );
}
