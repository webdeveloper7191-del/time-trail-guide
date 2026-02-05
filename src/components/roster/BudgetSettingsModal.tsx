import { useState } from 'react';
import { z } from 'zod';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Bell, 
  Calendar,
  Clock,
  GraduationCap,
  Shield,
  Target,
  Percent,
  Coffee,
  Car,
  Sun,
  Moon,
  BarChart3,
  TrendingDown,
} from 'lucide-react';
import { Centre } from '@/types/roster';
import PrimaryOffCanvas, { OffCanvasAction } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { StyledSwitch } from '@/components/ui/StyledSwitch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { FormSection, FormField, FormRow } from '@/components/ui/off-canvas/FormSection';

const budgetSettingsValidationSchema = z.object({
  weeklyBudget: z.number().min(0, 'Budget must be positive').max(1000000, 'Budget too high'),
  overtimeThreshold: z.number().min(30).max(50),
  maxAgencyPercent: z.number().min(0).max(50),
});

export interface BudgetSettings {
  weeklyBudget: number;
  overtimeThreshold: number;
  maxAgencyPercent: number;
  minStaffingCostFloor: number;
  alertOnLowCost: boolean;
  weekendPenaltyRate: number;
  publicHolidayPenaltyRate: number;
  mealAllowanceBudget: number;
  travelAllowanceBudget: number;
  minCasualPercent: number;
  maxCasualPercent: number;
  maxTraineePercent: number;
  minLeadEducatorsPerRoom: number;
  enableDailyBudgetCaps: boolean;
  dailyBudgetCaps: { [key: string]: number };
  earlyShiftPremium: number;
  lateShiftPremium: number;
  splitShiftAllowance: number;
  budgetVarianceTolerance: number;
  enableSeasonalAdjustments: boolean;
  schoolHolidayBudgetMultiplier: number;
  yearOverYearTarget: number;
  alertOnOverBudget: boolean;
  alertOnNearBudget: boolean;
  nearBudgetThreshold: number;
  alertOnOvertimeExcess: boolean;
}

interface BudgetSettingsModalProps {
  open: boolean;
  onClose: () => void;
  centre: Centre;
  currentBudget: number;
  onSave: (settings: BudgetSettings) => void;
}

const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export function BudgetSettingsModal({ open, onClose, centre, currentBudget, onSave }: BudgetSettingsModalProps) {
  const [settings, setSettings] = useState<BudgetSettings>({
    weeklyBudget: currentBudget,
    overtimeThreshold: 38,
    maxAgencyPercent: 25,
    minStaffingCostFloor: 500,
    alertOnLowCost: true,
    weekendPenaltyRate: 1.5,
    publicHolidayPenaltyRate: 2.5,
    mealAllowanceBudget: 200,
    travelAllowanceBudget: 150,
    minCasualPercent: 10,
    maxCasualPercent: 40,
    maxTraineePercent: 15,
    minLeadEducatorsPerRoom: 1,
    enableDailyBudgetCaps: false,
    dailyBudgetCaps: {
      Monday: Math.round(currentBudget / 5),
      Tuesday: Math.round(currentBudget / 5),
      Wednesday: Math.round(currentBudget / 5),
      Thursday: Math.round(currentBudget / 5),
      Friday: Math.round(currentBudget / 5),
    },
    earlyShiftPremium: 5,
    lateShiftPremium: 8,
    splitShiftAllowance: 25,
    budgetVarianceTolerance: 10,
    enableSeasonalAdjustments: false,
    schoolHolidayBudgetMultiplier: 1.2,
    yearOverYearTarget: -3,
    alertOnOverBudget: true,
    alertOnNearBudget: true,
    nearBudgetThreshold: 90,
    alertOnOvertimeExcess: true,
  });

  const handleSave = () => {
    const result = budgetSettingsValidationSchema.safeParse({
      weeklyBudget: settings.weeklyBudget,
      overtimeThreshold: settings.overtimeThreshold,
      maxAgencyPercent: settings.maxAgencyPercent,
    });
    
    if (!result.success) {
      toast.error('Please check your budget settings');
      return;
    }
    
    onSave(settings);
    toast.success('Budget settings saved');
    onClose();
  };

  const updateDailyBudget = (day: string, value: number) => {
    setSettings({
      ...settings,
      dailyBudgetCaps: { ...settings.dailyBudgetCaps, [day]: value }
    });
  };

  const actions: OffCanvasAction[] = [
    { label: 'Cancel', onClick: onClose, variant: 'outlined' },
    { label: 'Save Settings', onClick: handleSave, variant: 'primary' },
  ];

  return (
    <PrimaryOffCanvas
      title="Budget Settings"
      description={`Configure comprehensive budget limits and staffing controls for ${centre.name}`}
      width="900px"
      open={open}
      onClose={onClose}
      actions={actions}
      showFooter
    >
      <Tabs defaultValue="costs" className="mt-4">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="costs" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Costs</TabsTrigger>
          <TabsTrigger value="staffing" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Staffing</TabsTrigger>
          <TabsTrigger value="time" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Time-Based</TabsTrigger>
          <TabsTrigger value="forecast" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Forecast</TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[calc(100vh-280px)] pr-4 mt-4">
          {/* COSTS TAB */}
          <TabsContent value="costs" className="mt-0 space-y-6">
            {/* Weekly Budget */}
            <FormSection title="Weekly Budget">
              <FormField label="Total Budget" required tooltip="Total labor budget for this centre per week">
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={settings.weeklyBudget}
                  onChange={(e) => setSettings({ ...settings, weeklyBudget: Number(e.target.value) })}
                  className="pl-9 bg-background h-11"
                />
              </div>
              </FormField>
            </FormSection>

            {/* Minimum Staffing Cost Floor */}
            <FormSection title="Minimum Staffing Cost Floor" tooltip="Alert if daily costs drop below this (quality concern)">
              <div className="bg-background rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Enable low cost alerts</span>
                  <StyledSwitch
                    checked={settings.alertOnLowCost}
                    onChange={(checked) => setSettings({ ...settings, alertOnLowCost: checked })}
                    size="small"
                  />
                </div>
                <FormField label="Minimum Floor">
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={settings.minStaffingCostFloor}
                      onChange={(e) => setSettings({ ...settings, minStaffingCostFloor: Number(e.target.value) })}
                      disabled={!settings.alertOnLowCost}
                      className="pl-9 bg-background h-11"
                    />
                  </div>
                </FormField>
              </div>
            </FormSection>

            <Separator />

            {/* Penalty Rate Multipliers */}
            <FormSection title="Penalty Rate Multipliers">
              <FormRow columns={2}>
                <FormField label="Weekend Rate">
                  <div className="relative">
                    <Input
                      type="number"
                      value={settings.weekendPenaltyRate}
                      onChange={(e) => setSettings({ ...settings, weekendPenaltyRate: Number(e.target.value) })}
                      step={0.1}
                      min={1}
                      max={3}
                      className="bg-background pr-8 h-11"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">×</span>
                  </div>
                </FormField>
                <FormField label="Public Holiday Rate">
                  <div className="relative">
                    <Input
                      type="number"
                      value={settings.publicHolidayPenaltyRate}
                      onChange={(e) => setSettings({ ...settings, publicHolidayPenaltyRate: Number(e.target.value) })}
                      step={0.1}
                      min={1}
                      max={4}
                      className="bg-background pr-8 h-11"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">×</span>
                  </div>
                </FormField>
              </FormRow>
            </FormSection>

            <Separator />

            {/* Allowance Budgets */}
            <FormSection title="Allowance Budgets" tooltip="Weekly allowance budget limits">
              <FormRow columns={2}>
                <FormField label="Meal Allowance">
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={settings.mealAllowanceBudget}
                      onChange={(e) => setSettings({ ...settings, mealAllowanceBudget: Number(e.target.value) })}
                      className="pl-9 bg-background h-11"
                    />
                  </div>
                </FormField>
                <FormField label="Travel Allowance">
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={settings.travelAllowanceBudget}
                      onChange={(e) => setSettings({ ...settings, travelAllowanceBudget: Number(e.target.value) })}
                      className="pl-9 bg-background h-11"
                    />
                  </div>
                </FormField>
              </FormRow>
            </FormSection>
          </TabsContent>

          {/* STAFFING TAB */}
          <TabsContent value="staffing" className="mt-0 space-y-6">
            {/* Overtime Threshold */}
            <FormSection title="Overtime Threshold" tooltip="Hours after which overtime rates apply">
              <div className="bg-background rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Weekly threshold</span>
                  <Badge variant="secondary">{settings.overtimeThreshold}h/week</Badge>
                </div>
                <Slider
                  value={[settings.overtimeThreshold]}
                  onValueChange={(v) => setSettings({ ...settings, overtimeThreshold: v[0] })}
                  min={30}
                  max={50}
                  step={1}
                  className="w-full"
                />
              </div>
            </FormSection>

            {/* Agency Staff */}
            <FormSection title="Max Agency Staff">
              <div className="bg-background rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Maximum percentage</span>
                  <Badge variant="secondary">{settings.maxAgencyPercent}%</Badge>
                </div>
                <Slider
                  value={[settings.maxAgencyPercent]}
                  onValueChange={(v) => setSettings({ ...settings, maxAgencyPercent: v[0] })}
                  min={0}
                  max={50}
                  step={5}
                  className="w-full"
                />
              </div>
            </FormSection>

            <Separator />

            {/* Casual Staff Mix */}
            <FormSection title="Casual vs Permanent Mix">
              <FormRow columns={2}>
                <FormField label="Min Casual %">
                  <div className="bg-background rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{settings.minCasualPercent}%</Badge>
                    </div>
                    <Slider
                      value={[settings.minCasualPercent]}
                      onValueChange={(v) => setSettings({ ...settings, minCasualPercent: v[0] })}
                      min={0}
                      max={50}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </FormField>
                <FormField label="Max Casual %">
                  <div className="bg-background rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{settings.maxCasualPercent}%</Badge>
                    </div>
                    <Slider
                      value={[settings.maxCasualPercent]}
                      onValueChange={(v) => setSettings({ ...settings, maxCasualPercent: v[0] })}
                      min={10}
                      max={80}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </FormField>
              </FormRow>
            </FormSection>

            <Separator />

            {/* Trainee Limits */}
            <FormSection title="Max Trainee/Student Staff" tooltip="Cap on unqualified/trainee staff per shift">
              <div className="bg-background rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Maximum percentage</span>
                  <Badge variant="secondary">{settings.maxTraineePercent}%</Badge>
                </div>
                <Slider
                  value={[settings.maxTraineePercent]}
                  onValueChange={(v) => setSettings({ ...settings, maxTraineePercent: v[0] })}
                  min={0}
                  max={30}
                  step={5}
                  className="w-full"
                />
              </div>
            </FormSection>

            {/* Lead Educator Requirements */}
            <FormSection title="Lead Educator Requirements" tooltip="Minimum qualified lead educators required per room at all times">
              <FormField label="Min Lead Educators Per Room">
              <Select
                value={String(settings.minLeadEducatorsPerRoom)}
                onValueChange={(v) => setSettings({ ...settings, minLeadEducatorsPerRoom: Number(v) })}
              >
                <SelectTrigger className="bg-background h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Lead Educator</SelectItem>
                  <SelectItem value="2">2 Lead Educators</SelectItem>
                  <SelectItem value="3">3 Lead Educators</SelectItem>
                </SelectContent>
              </Select>
              </FormField>
            </FormSection>
          </TabsContent>

          {/* TIME-BASED TAB */}
          <TabsContent value="time" className="mt-0 space-y-6">
            {/* Daily Budget Caps */}
            <Card className="border border-border bg-muted/30">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Daily Budget Caps
                  </Label>
                  <StyledSwitch
                    checked={settings.enableDailyBudgetCaps}
                    onChange={(checked) => setSettings({ ...settings, enableDailyBudgetCaps: checked })}
                    size="small"
                  />
                </div>

                {settings.enableDailyBudgetCaps && (
                  <div className="space-y-2 pt-2">
                    {dayLabels.map((day) => (
                      <div key={day} className="flex items-center gap-3">
                        <span className="text-sm w-24">{day}</span>
                        <div className="relative flex-1">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={settings.dailyBudgetCaps[day]}
                            onChange={(e) => updateDailyBudget(day, Number(e.target.value))}
                            className="pl-9 bg-background"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Separator />

            {/* Shift Time Premiums */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Shift Time Premiums
              </Label>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <Sun className="h-3 w-3 text-amber-500" />
                    Early Shift Premium
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={settings.earlyShiftPremium}
                      onChange={(e) => setSettings({ ...settings, earlyShiftPremium: Number(e.target.value) })}
                      className="pl-9 bg-background pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">/hr</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Extra pay for shifts starting before 7am</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <Moon className="h-3 w-3 text-primary" />
                    Late Shift Premium
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={settings.lateShiftPremium}
                      onChange={(e) => setSettings({ ...settings, lateShiftPremium: Number(e.target.value) })}
                      className="pl-9 bg-background pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">/hr</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Extra pay for shifts ending after 6pm</p>
                </div>
              </div>
            </div>

            {/* Split Shift Allowance */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Split Shift Allowance
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={settings.splitShiftAllowance}
                  onChange={(e) => setSettings({ ...settings, splitShiftAllowance: Number(e.target.value) })}
                  className="pl-9 bg-background pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">/shift</span>
              </div>
              <p className="text-xs text-muted-foreground">Fixed payment for staff working split shifts</p>
            </div>
          </TabsContent>

          {/* FORECAST TAB */}
          <TabsContent value="forecast" className="mt-0 space-y-6">
            {/* Budget Variance Tolerance */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-primary flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Budget Variance Tolerance
                </Label>
                <Badge variant="secondary">±{settings.budgetVarianceTolerance}%</Badge>
              </div>
              <Slider
                value={[settings.budgetVarianceTolerance]}
                onValueChange={(v) => setSettings({ ...settings, budgetVarianceTolerance: v[0] })}
                min={5}
                max={25}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Acceptable deviation from budget before triggering alerts</p>
            </div>

            <Separator />

            {/* Seasonal Adjustments */}
            <Card className="border border-border bg-muted/30">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-500" />
                    Seasonal Budget Adjustments
                  </Label>
                  <StyledSwitch
                    checked={settings.enableSeasonalAdjustments}
                    onChange={(checked) => setSettings({ ...settings, enableSeasonalAdjustments: checked })}
                    size="small"
                  />
                </div>

                {settings.enableSeasonalAdjustments && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">School Holiday Multiplier</Label>
                      <Badge variant="outline">{settings.schoolHolidayBudgetMultiplier}×</Badge>
                    </div>
                    <Slider
                      value={[settings.schoolHolidayBudgetMultiplier]}
                      onValueChange={(v) => setSettings({ ...settings, schoolHolidayBudgetMultiplier: v[0] })}
                      min={1}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">Multiply budget during school holiday periods</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Year-over-Year Target */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Year-over-Year Target
                </Label>
                <Badge 
                  variant={settings.yearOverYearTarget < 0 ? 'default' : 'secondary'}
                  className={settings.yearOverYearTarget < 0 ? 'bg-primary' : ''}
                >
                  {settings.yearOverYearTarget > 0 ? '+' : ''}{settings.yearOverYearTarget}%
                </Badge>
              </div>
              <Slider
                value={[settings.yearOverYearTarget]}
                onValueChange={(v) => setSettings({ ...settings, yearOverYearTarget: v[0] })}
                min={-20}
                max={20}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Target change vs. same period last year (negative = cost reduction goal)</p>
            </div>

            <Separator />

            {/* Alert Settings */}
            <Card className="border border-border bg-muted/30">
              <CardHeader className="pb-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Alert Notifications
                </Label>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Alert when over budget
                  </Label>
                  <StyledSwitch
                    checked={settings.alertOnOverBudget}
                    onChange={(checked) => setSettings({ ...settings, alertOnOverBudget: checked })}
                    size="small"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Alert when near budget
                      </Label>
                      <p className="text-xs text-muted-foreground">Threshold: {settings.nearBudgetThreshold}%</p>
                    </div>
                    <StyledSwitch
                      checked={settings.alertOnNearBudget}
                      onChange={(checked) => setSettings({ ...settings, alertOnNearBudget: checked })}
                      size="small"
                    />
                  </div>
                  {settings.alertOnNearBudget && (
                    <div className="pl-6">
                      <Slider
                        value={[settings.nearBudgetThreshold]}
                        onValueChange={(v) => setSettings({ ...settings, nearBudgetThreshold: v[0] })}
                        min={70}
                        max={99}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-amber-500" />
                    Alert on excessive overtime
                  </Label>
                  <StyledSwitch
                    checked={settings.alertOnOvertimeExcess}
                    onChange={(checked) => setSettings({ ...settings, alertOnOvertimeExcess: checked })}
                    size="small"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </PrimaryOffCanvas>
  );
}
