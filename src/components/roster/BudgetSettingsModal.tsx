import { useState, useEffect } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  TextField,
  Slider,
  Switch,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Box,
  Typography,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
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

// Zod validation schema for budget settings
const budgetSettingsValidationSchema = z.object({
  weeklyBudget: z.number().min(0, 'Budget must be positive').max(1000000, 'Budget too high'),
  overtimeThreshold: z.number().min(30).max(50),
  maxAgencyPercent: z.number().min(0).max(50),
});

export interface BudgetSettings {
  // Core Budget
  weeklyBudget: number;
  overtimeThreshold: number;
  maxAgencyPercent: number;
  
  // Cost Controls
  minStaffingCostFloor: number;
  alertOnLowCost: boolean;
  weekendPenaltyRate: number;
  publicHolidayPenaltyRate: number;
  mealAllowanceBudget: number;
  travelAllowanceBudget: number;
  
  // Staffing Thresholds
  minCasualPercent: number;
  maxCasualPercent: number;
  maxTraineePercent: number;
  minLeadEducatorsPerRoom: number;
  
  // Time-Based Budgets
  enableDailyBudgetCaps: boolean;
  dailyBudgetCaps: { [key: string]: number };
  earlyShiftPremium: number;
  lateShiftPremium: number;
  splitShiftAllowance: number;
  
  // Forecasting & Targets
  budgetVarianceTolerance: number;
  enableSeasonalAdjustments: boolean;
  schoolHolidayBudgetMultiplier: number;
  yearOverYearTarget: number;
  
  // Alerts
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
    // Core Budget
    weeklyBudget: currentBudget,
    overtimeThreshold: 38,
    maxAgencyPercent: 25,
    
    // Cost Controls
    minStaffingCostFloor: 500,
    alertOnLowCost: true,
    weekendPenaltyRate: 1.5,
    publicHolidayPenaltyRate: 2.5,
    mealAllowanceBudget: 200,
    travelAllowanceBudget: 150,
    
    // Staffing Thresholds
    minCasualPercent: 10,
    maxCasualPercent: 40,
    maxTraineePercent: 15,
    minLeadEducatorsPerRoom: 1,
    
    // Time-Based Budgets
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
    
    // Forecasting & Targets
    budgetVarianceTolerance: 10,
    enableSeasonalAdjustments: false,
    schoolHolidayBudgetMultiplier: 1.2,
    yearOverYearTarget: -3,
    
    // Alerts
    alertOnOverBudget: true,
    alertOnNearBudget: true,
    nearBudgetThreshold: 90,
    alertOnOvertimeExcess: true,
  });

  const handleSave = () => {
    // Validate core settings
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
      width="700px"
      open={open}
      onClose={onClose}
      actions={actions}
      showFooter
    >

        <Tabs defaultValue="costs" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="costs">Costs</TabsTrigger>
            <TabsTrigger value="staffing">Staffing</TabsTrigger>
            <TabsTrigger value="time">Time-Based</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-280px)] pr-4 mt-4">
            {/* COSTS TAB */}
            <TabsContent value="costs" className="mt-0">
              <Stack spacing={3}>
                {/* Weekly Budget */}
                <Box>
                  <Typography variant="body2" fontWeight={500} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DollarSign size={16} className="text-primary" />
                    Weekly Budget
                  </Typography>
                  <TextField
                    type="number"
                    value={settings.weeklyBudget}
                    onChange={(e) => setSettings({ ...settings, weeklyBudget: Number(e.target.value) })}
                    size="small"
                    fullWidth
                    InputProps={{
                      startAdornment: <DollarSign size={16} style={{ marginRight: 8, opacity: 0.5 }} />,
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Total labor budget for this centre per week
                  </Typography>
                </Box>

                {/* Minimum Staffing Cost Floor */}
                <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
                  <CardContent sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" fontWeight={500} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingDown size={16} className="text-orange-500" />
                        Minimum Staffing Cost Floor
                      </Typography>
                      <Switch
                        checked={settings.alertOnLowCost}
                        onChange={(e) => setSettings({ ...settings, alertOnLowCost: e.target.checked })}
                        size="small"
                      />
                    </Box>
                    <TextField
                      type="number"
                      value={settings.minStaffingCostFloor}
                      onChange={(e) => setSettings({ ...settings, minStaffingCostFloor: Number(e.target.value) })}
                      size="small"
                      fullWidth
                      disabled={!settings.alertOnLowCost}
                      InputProps={{
                        startAdornment: <DollarSign size={16} style={{ marginRight: 8, opacity: 0.5 }} />,
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Alert if daily costs drop below this (quality concern)
                    </Typography>
                  </CardContent>
                </Card>

                <Divider />

                {/* Penalty Rate Multipliers */}
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Percent size={16} />
                  Penalty Rate Multipliers
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
                      Weekend Rate
                    </Typography>
                    <TextField
                      type="number"
                      value={settings.weekendPenaltyRate}
                      onChange={(e) => setSettings({ ...settings, weekendPenaltyRate: Number(e.target.value) })}
                      size="small"
                      fullWidth
                      inputProps={{ step: 0.1, min: 1, max: 3 }}
                      InputProps={{
                        endAdornment: <Typography variant="caption" sx={{ ml: 1 }}>×</Typography>,
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
                      Public Holiday Rate
                    </Typography>
                    <TextField
                      type="number"
                      value={settings.publicHolidayPenaltyRate}
                      onChange={(e) => setSettings({ ...settings, publicHolidayPenaltyRate: Number(e.target.value) })}
                      size="small"
                      fullWidth
                      inputProps={{ step: 0.1, min: 1, max: 4 }}
                      InputProps={{
                        endAdornment: <Typography variant="caption" sx={{ ml: 1 }}>×</Typography>,
                      }}
                    />
                  </Box>
                </Box>

                <Divider />

                {/* Allowance Budgets */}
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Coffee size={16} />
                  Allowance Budgets (Weekly)
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" fontWeight={500} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Coffee size={14} />
                      Meal Allowance
                    </Typography>
                    <TextField
                      type="number"
                      value={settings.mealAllowanceBudget}
                      onChange={(e) => setSettings({ ...settings, mealAllowanceBudget: Number(e.target.value) })}
                      size="small"
                      fullWidth
                      InputProps={{
                        startAdornment: <DollarSign size={16} style={{ marginRight: 8, opacity: 0.5 }} />,
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight={500} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Car size={14} />
                      Travel Allowance
                    </Typography>
                    <TextField
                      type="number"
                      value={settings.travelAllowanceBudget}
                      onChange={(e) => setSettings({ ...settings, travelAllowanceBudget: Number(e.target.value) })}
                      size="small"
                      fullWidth
                      InputProps={{
                        startAdornment: <DollarSign size={16} style={{ marginRight: 8, opacity: 0.5 }} />,
                      }}
                    />
                  </Box>
                </Box>
              </Stack>
            </TabsContent>

            {/* STAFFING TAB */}
            <TabsContent value="staffing" className="mt-0">
              <Stack spacing={3}>
                {/* Overtime Threshold */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight={500} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUp size={16} className="text-orange-500" />
                      Overtime Threshold
                    </Typography>
                    <Chip label={`${settings.overtimeThreshold}h/week`} size="small" />
                  </Box>
                  <Slider
                    value={settings.overtimeThreshold}
                    onChange={(_, v) => setSettings({ ...settings, overtimeThreshold: v as number })}
                    min={30}
                    max={50}
                    step={1}
                    size="small"
                  />
                  <Typography variant="caption" color="text.secondary">
                    Hours after which overtime rates apply
                  </Typography>
                </Box>

                {/* Agency Staff */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight={500} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Users size={16} className="text-primary" />
                      Max Agency Staff
                    </Typography>
                    <Chip label={`${settings.maxAgencyPercent}%`} size="small" />
                  </Box>
                  <Slider
                    value={settings.maxAgencyPercent}
                    onChange={(_, v) => setSettings({ ...settings, maxAgencyPercent: v as number })}
                    min={0}
                    max={50}
                    step={5}
                    size="small"
                  />
                </Box>

                <Divider />

                {/* Casual Staff Mix */}
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Users size={16} />
                  Casual vs Permanent Mix
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Min Casual %</Typography>
                      <Chip label={`${settings.minCasualPercent}%`} size="small" variant="outlined" />
                    </Box>
                    <Slider
                      value={settings.minCasualPercent}
                      onChange={(_, v) => setSettings({ ...settings, minCasualPercent: v as number })}
                      min={0}
                      max={50}
                      step={5}
                      size="small"
                    />
                  </Box>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Max Casual %</Typography>
                      <Chip label={`${settings.maxCasualPercent}%`} size="small" variant="outlined" />
                    </Box>
                    <Slider
                      value={settings.maxCasualPercent}
                      onChange={(_, v) => setSettings({ ...settings, maxCasualPercent: v as number })}
                      min={10}
                      max={80}
                      step={5}
                      size="small"
                    />
                  </Box>
                </Box>

                <Divider />

                {/* Trainee/Student Limits */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight={500} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GraduationCap size={16} className="text-blue-500" />
                      Max Trainee/Student Staff
                    </Typography>
                    <Chip label={`${settings.maxTraineePercent}%`} size="small" />
                  </Box>
                  <Slider
                    value={settings.maxTraineePercent}
                    onChange={(_, v) => setSettings({ ...settings, maxTraineePercent: v as number })}
                    min={0}
                    max={30}
                    step={5}
                    size="small"
                  />
                  <Typography variant="caption" color="text.secondary">
                    Cap on unqualified/trainee staff per shift
                  </Typography>
                </Box>

                {/* Lead Educator Requirements */}
                <Box>
                  <Typography variant="body2" fontWeight={500} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Shield size={16} className="text-green-500" />
                    Min Lead Educators Per Room
                  </Typography>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={settings.minLeadEducatorsPerRoom}
                      onChange={(e) => setSettings({ ...settings, minLeadEducatorsPerRoom: Number(e.target.value) })}
                    >
                      <MenuItem value={1}>1 Lead Educator</MenuItem>
                      <MenuItem value={2}>2 Lead Educators</MenuItem>
                      <MenuItem value={3}>3 Lead Educators</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary">
                    Minimum qualified lead educators required per room at all times
                  </Typography>
                </Box>
              </Stack>
            </TabsContent>

            {/* TIME-BASED TAB */}
            <TabsContent value="time" className="mt-0">
              <Stack spacing={3}>
                {/* Daily Budget Caps */}
                <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
                  <CardContent sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2" fontWeight={500} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Calendar size={16} className="text-primary" />
                        Daily Budget Caps
                      </Typography>
                      <Switch
                        checked={settings.enableDailyBudgetCaps}
                        onChange={(e) => setSettings({ ...settings, enableDailyBudgetCaps: e.target.checked })}
                        size="small"
                      />
                    </Box>
                    
                    {settings.enableDailyBudgetCaps && (
                      <Stack spacing={1.5}>
                        {dayLabels.map((day) => (
                          <Box key={day} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body2" sx={{ width: 100 }}>{day}</Typography>
                            <TextField
                              type="number"
                              value={settings.dailyBudgetCaps[day]}
                              onChange={(e) => updateDailyBudget(day, Number(e.target.value))}
                              size="small"
                              fullWidth
                              InputProps={{
                                startAdornment: <DollarSign size={14} style={{ marginRight: 4, opacity: 0.5 }} />,
                              }}
                            />
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>

                <Divider />

                {/* Peak Hours Premiums */}
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Clock size={16} />
                  Shift Time Premiums
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" fontWeight={500} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Sun size={14} className="text-yellow-500" />
                      Early Shift Premium
                    </Typography>
                    <TextField
                      type="number"
                      value={settings.earlyShiftPremium}
                      onChange={(e) => setSettings({ ...settings, earlyShiftPremium: Number(e.target.value) })}
                      size="small"
                      fullWidth
                      InputProps={{
                        startAdornment: <DollarSign size={14} style={{ marginRight: 4, opacity: 0.5 }} />,
                        endAdornment: <Typography variant="caption">/hr</Typography>,
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Extra pay for shifts starting before 7am
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight={500} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Moon size={14} className="text-indigo-500" />
                      Late Shift Premium
                    </Typography>
                    <TextField
                      type="number"
                      value={settings.lateShiftPremium}
                      onChange={(e) => setSettings({ ...settings, lateShiftPremium: Number(e.target.value) })}
                      size="small"
                      fullWidth
                      InputProps={{
                        startAdornment: <DollarSign size={14} style={{ marginRight: 4, opacity: 0.5 }} />,
                        endAdornment: <Typography variant="caption">/hr</Typography>,
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Extra pay for shifts ending after 6pm
                    </Typography>
                  </Box>
                </Box>

                {/* Split Shift Allowance */}
                <Box>
                  <Typography variant="body2" fontWeight={500} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Clock size={16} className="text-purple-500" />
                    Split Shift Allowance
                  </Typography>
                  <TextField
                    type="number"
                    value={settings.splitShiftAllowance}
                    onChange={(e) => setSettings({ ...settings, splitShiftAllowance: Number(e.target.value) })}
                    size="small"
                    fullWidth
                    InputProps={{
                      startAdornment: <DollarSign size={14} style={{ marginRight: 4, opacity: 0.5 }} />,
                      endAdornment: <Typography variant="caption">/shift</Typography>,
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Fixed payment for staff working split shifts
                  </Typography>
                </Box>
              </Stack>
            </TabsContent>

            {/* FORECAST TAB */}
            <TabsContent value="forecast" className="mt-0">
              <Stack spacing={3}>
                {/* Budget Variance Tolerance */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight={500} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Target size={16} className="text-primary" />
                      Budget Variance Tolerance
                    </Typography>
                    <Chip label={`±${settings.budgetVarianceTolerance}%`} size="small" />
                  </Box>
                  <Slider
                    value={settings.budgetVarianceTolerance}
                    onChange={(_, v) => setSettings({ ...settings, budgetVarianceTolerance: v as number })}
                    min={5}
                    max={25}
                    step={1}
                    size="small"
                  />
                  <Typography variant="caption" color="text.secondary">
                    Acceptable deviation from budget before triggering alerts
                  </Typography>
                </Box>

                <Divider />

                {/* Seasonal Adjustments */}
                <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
                  <CardContent sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2" fontWeight={500} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Calendar size={16} className="text-orange-500" />
                        Seasonal Budget Adjustments
                      </Typography>
                      <Switch
                        checked={settings.enableSeasonalAdjustments}
                        onChange={(e) => setSettings({ ...settings, enableSeasonalAdjustments: e.target.checked })}
                        size="small"
                      />
                    </Box>
                    
                    {settings.enableSeasonalAdjustments && (
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">School Holiday Multiplier</Typography>
                          <Chip label={`${settings.schoolHolidayBudgetMultiplier}×`} size="small" variant="outlined" />
                        </Box>
                        <Slider
                          value={settings.schoolHolidayBudgetMultiplier}
                          onChange={(_, v) => setSettings({ ...settings, schoolHolidayBudgetMultiplier: v as number })}
                          min={1}
                          max={2}
                          step={0.1}
                          size="small"
                        />
                        <Typography variant="caption" color="text.secondary">
                          Multiply budget during school holiday periods
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>

                {/* Year-over-Year Target */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight={500} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BarChart3 size={16} className="text-green-500" />
                      Year-over-Year Target
                    </Typography>
                    <Chip 
                      label={`${settings.yearOverYearTarget > 0 ? '+' : ''}${settings.yearOverYearTarget}%`} 
                      size="small" 
                      color={settings.yearOverYearTarget < 0 ? 'success' : 'warning'}
                    />
                  </Box>
                  <Slider
                    value={settings.yearOverYearTarget}
                    onChange={(_, v) => setSettings({ ...settings, yearOverYearTarget: v as number })}
                    min={-20}
                    max={20}
                    step={1}
                    size="small"
                  />
                  <Typography variant="caption" color="text.secondary">
                    Target change vs. same period last year (negative = cost reduction goal)
                  </Typography>
                </Box>

                <Divider />

                {/* Alert Settings */}
                <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
                  <CardHeader
                    title={
                      <Typography variant="body2" fontWeight={500} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Bell size={16} />
                        Alert Notifications
                      </Typography>
                    }
                    sx={{ pb: 0 }}
                  />
                  <CardContent>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AlertTriangle size={16} className="text-red-500" />
                          Alert when over budget
                        </Typography>
                        <Switch
                          checked={settings.alertOnOverBudget}
                          onChange={(e) => setSettings({ ...settings, alertOnOverBudget: e.target.checked })}
                          size="small"
                        />
                      </Box>

                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AlertTriangle size={16} className="text-orange-500" />
                              Alert when near budget
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Threshold: {settings.nearBudgetThreshold}%
                            </Typography>
                          </Box>
                          <Switch
                            checked={settings.alertOnNearBudget}
                            onChange={(e) => setSettings({ ...settings, alertOnNearBudget: e.target.checked })}
                            size="small"
                          />
                        </Box>
                        {settings.alertOnNearBudget && (
                          <Box sx={{ pl: 3, mt: 1 }}>
                            <Slider
                              value={settings.nearBudgetThreshold}
                              onChange={(_, v) => setSettings({ ...settings, nearBudgetThreshold: v as number })}
                              min={70}
                              max={99}
                              step={5}
                              size="small"
                            />
                          </Box>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TrendingUp size={16} className="text-orange-500" />
                          Alert on excessive overtime
                        </Typography>
                        <Switch
                          checked={settings.alertOnOvertimeExcess}
                          onChange={(e) => setSettings({ ...settings, alertOnOvertimeExcess: e.target.checked })}
                          size="small"
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </TabsContent>
          </ScrollArea>
        </Tabs>
    </PrimaryOffCanvas>
  );
}
