import { useState, useMemo } from 'react';
import {
  Button,
  TextField,
  Card,
  CardContent,
  Stack,
  Box,
  Typography,
  Chip,
  Divider,
  IconButton,
  Alert,
  Switch,
  FormControlLabel,
  Slider,
  MenuItem,
} from '@mui/material';
import {
  Database,
  History,
  Plug,
  TrendingUp,
  Clock,
  BarChart3,
  AlertTriangle,
  Settings2,
  Plus,
  Trash2,
  RefreshCw,
  Calendar,
  Palette,
  Activity,
  Layers,
  Zap,
  FileSpreadsheet,
  CloudDownload,
} from 'lucide-react';
import PrimaryOffCanvas, { OffCanvasAction } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  DemandMasterSettings,
  DemandDataSourceType,
  DemandGranularity,
  ForecastMethod,
  DemandSchedulePattern,
  DemandThreshold,
} from '@/types/industryConfig';

interface DemandMasterSettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: DemandMasterSettings;
  onSave: (settings: DemandMasterSettings) => void;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const granularityOptions: { value: DemandGranularity; label: string }[] = [
  { value: '15min', label: '15 Minutes' },
  { value: '30min', label: '30 Minutes' },
  { value: '1hour', label: '1 Hour' },
  { value: '2hour', label: '2 Hours' },
  { value: '4hour', label: '4 Hours' },
  { value: 'daily', label: 'Daily' },
];

const forecastMethodOptions: { value: ForecastMethod; label: string; description: string }[] = [
  { value: 'moving_average', label: 'Moving Average', description: 'Simple average of recent data' },
  { value: 'weighted_average', label: 'Weighted Average', description: 'Recent data weighted more heavily' },
  { value: 'seasonal', label: 'Seasonal', description: 'Accounts for day/week/month patterns' },
  { value: 'ml_prediction', label: 'AI/ML Prediction', description: 'Machine learning based forecasting' },
  { value: 'manual', label: 'Manual Entry', description: 'Manually entered forecasts' },
];

const defaultSettings: DemandMasterSettings = {
  enabled: true,
  granularity: '30min',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  operatingHours: dayNames.map((_, i) => ({
    dayOfWeek: i,
    open: i === 0 || i === 6 ? '08:00' : '06:30',
    close: i === 0 || i === 6 ? '17:00' : '18:30',
    isOpen: i !== 0, // Closed Sunday
  })),
  dataSources: {
    manual: { type: 'manual', enabled: true, priority: 1, settings: {} },
    historical: { type: 'historical', enabled: true, priority: 2, settings: { weeksToAnalyze: 8 } },
    integration: { type: 'integration', enabled: false, priority: 3, settings: {} },
    forecast: { type: 'forecast', enabled: true, priority: 4, settings: {} },
  },
  forecasting: {
    enabled: true,
    method: 'weighted_average',
    lookbackWeeks: 8,
    confidenceThreshold: 70,
    autoAdjust: true,
    seasonalAdjustments: true,
  },
  schedulePatterns: [
    { id: 'morning-rush', name: 'Morning Rush', dayOfWeek: [1, 2, 3, 4, 5], startTime: '07:00', endTime: '09:00', expectedDemandMultiplier: 1.5, color: '#ef4444' },
    { id: 'afternoon-pickup', name: 'Afternoon Pickup', dayOfWeek: [1, 2, 3, 4, 5], startTime: '15:00', endTime: '18:00', expectedDemandMultiplier: 1.3, color: '#f97316' },
  ],
  thresholds: [
    { id: 'low', name: 'Low Demand', minDemand: 0, maxDemand: 10, requiredStaff: 2, color: '#22c55e', alertLevel: 'info' },
    { id: 'normal', name: 'Normal Demand', minDemand: 11, maxDemand: 25, requiredStaff: 4, color: '#3b82f6', alertLevel: 'info' },
    { id: 'high', name: 'High Demand', minDemand: 26, maxDemand: 40, requiredStaff: 6, color: '#f97316', alertLevel: 'warning' },
    { id: 'critical', name: 'Critical Demand', minDemand: 41, requiredStaff: 8, color: '#ef4444', alertLevel: 'critical' },
  ],
  alerts: {
    understaffing: true,
    overstaffing: true,
    demandSpike: true,
    forecastAccuracy: false,
    thresholdPercentage: 15,
  },
  display: {
    showForecast: true,
    showHistorical: true,
    showVariance: false,
    chartType: 'bar',
    colorScheme: 'default',
  },
};

export function DemandMasterSettingsModal({
  open,
  onClose,
  settings: initialSettings,
  onSave,
}: DemandMasterSettingsModalProps) {
  const [settings, setSettings] = useState<DemandMasterSettings>(initialSettings || defaultSettings);
  const [newPatternName, setNewPatternName] = useState('');
  const [newThresholdName, setNewThresholdName] = useState('');

  const handleSave = () => {
    onSave(settings);
    toast.success('Demand settings saved successfully');
    onClose();
  };

  const addSchedulePattern = () => {
    if (!newPatternName.trim()) return;
    const newPattern: DemandSchedulePattern = {
      id: `pattern-${Date.now()}`,
      name: newPatternName.trim(),
      dayOfWeek: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '17:00',
      expectedDemandMultiplier: 1.0,
      color: '#6366f1',
    };
    setSettings(prev => ({
      ...prev,
      schedulePatterns: [...prev.schedulePatterns, newPattern],
    }));
    setNewPatternName('');
  };

  const removeSchedulePattern = (id: string) => {
    setSettings(prev => ({
      ...prev,
      schedulePatterns: prev.schedulePatterns.filter(p => p.id !== id),
    }));
  };

  const updateSchedulePattern = (id: string, updates: Partial<DemandSchedulePattern>) => {
    setSettings(prev => ({
      ...prev,
      schedulePatterns: prev.schedulePatterns.map(p => 
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  };

  const addThreshold = () => {
    if (!newThresholdName.trim()) return;
    const newThreshold: DemandThreshold = {
      id: `threshold-${Date.now()}`,
      name: newThresholdName.trim(),
      minDemand: 0,
      requiredStaff: 1,
      color: '#6366f1',
      alertLevel: 'info',
    };
    setSettings(prev => ({
      ...prev,
      thresholds: [...prev.thresholds, newThreshold],
    }));
    setNewThresholdName('');
  };

  const removeThreshold = (id: string) => {
    setSettings(prev => ({
      ...prev,
      thresholds: prev.thresholds.filter(t => t.id !== id),
    }));
  };

  const updateThreshold = (id: string, updates: Partial<DemandThreshold>) => {
    setSettings(prev => ({
      ...prev,
      thresholds: prev.thresholds.map(t => 
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  };

  const actions: OffCanvasAction[] = [
    { label: 'Cancel', onClick: onClose, variant: 'outlined' },
    { label: 'Save Settings', onClick: handleSave, variant: 'primary' },
  ];

  return (
    <PrimaryOffCanvas
      title="Demand Master Settings"
      description="Configure how demand data is collected, forecasted, and displayed"
      width="1000px"
      open={open}
      onClose={onClose}
      actions={actions}
      showFooter
    >
      <Tabs defaultValue="general" className="mt-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">
            <Settings2 className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="sources">
            <Database className="h-4 w-4 mr-2" />
            Data Sources
          </TabsTrigger>
          <TabsTrigger value="forecasting">
            <TrendingUp className="h-4 w-4 mr-2" />
            Forecasting
          </TabsTrigger>
          <TabsTrigger value="patterns">
            <Activity className="h-4 w-4 mr-2" />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="display">
            <Palette className="h-4 w-4 mr-2" />
            Display
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[calc(100vh-320px)] mt-4">
          {/* General Settings */}
          <TabsContent value="general" className="mt-0">
            <Stack spacing={3}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>Enable Demand Tracking</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Track and forecast demand to optimize staffing
                      </Typography>
                    </Box>
                    <Switch
                      checked={settings.enabled}
                      onChange={(e) => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                    />
                  </Stack>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={600} mb={2}>Time Settings</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" mb={1}>Data Granularity</Typography>
                      <Select
                        value={settings.granularity}
                        onValueChange={(value: DemandGranularity) => 
                          setSettings(prev => ({ ...prev, granularity: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {granularityOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Box>
                    <TextField
                      label="Timezone"
                      value={settings.timezone}
                      onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
                      size="small"
                      fullWidth
                    />
                  </Box>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={600} mb={2}>Operating Hours</Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Set your standard operating hours for each day
                  </Typography>
                  <Stack spacing={1}>
                    {settings.operatingHours.map((hours, index) => (
                      <Stack 
                        key={hours.dayOfWeek} 
                        direction="row" 
                        spacing={2} 
                        alignItems="center"
                        sx={{ 
                          p: 1.5, 
                          borderRadius: 1, 
                          bgcolor: hours.isOpen ? 'background.default' : 'action.disabledBackground',
                          opacity: hours.isOpen ? 1 : 0.6,
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={hours.isOpen}
                              onChange={(e) => {
                                const newHours = [...settings.operatingHours];
                                newHours[index] = { ...hours, isOpen: e.target.checked };
                                setSettings(prev => ({ ...prev, operatingHours: newHours }));
                              }}
                            />
                          }
                          label={
                            <Typography variant="body2" fontWeight={500} sx={{ width: 80 }}>
                              {dayNames[hours.dayOfWeek]}
                            </Typography>
                          }
                        />
                        <TextField
                          type="time"
                          value={hours.open}
                          onChange={(e) => {
                            const newHours = [...settings.operatingHours];
                            newHours[index] = { ...hours, open: e.target.value };
                            setSettings(prev => ({ ...prev, operatingHours: newHours }));
                          }}
                          size="small"
                          disabled={!hours.isOpen}
                          sx={{ width: 130 }}
                        />
                        <Typography variant="body2" color="text.secondary">to</Typography>
                        <TextField
                          type="time"
                          value={hours.close}
                          onChange={(e) => {
                            const newHours = [...settings.operatingHours];
                            newHours[index] = { ...hours, close: e.target.value };
                            setSettings(prev => ({ ...prev, operatingHours: newHours }));
                          }}
                          size="small"
                          disabled={!hours.isOpen}
                          sx={{ width: 130 }}
                        />
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </TabsContent>

          {/* Data Sources */}
          <TabsContent value="sources" className="mt-0">
            <Stack spacing={3}>
              <Alert severity="info" icon={<Database size={20} />}>
                Configure where demand data comes from. You can enable multiple sources and set their priority.
              </Alert>

              {/* Manual Entry */}
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <FileSpreadsheet size={18} className="text-blue-500" />
                        <Typography variant="subtitle1" fontWeight={600}>Manual Entry</Typography>
                        <Chip label={`Priority ${settings.dataSources.manual.priority}`} size="small" />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        Manually enter expected demand values for each time slot
                      </Typography>
                    </Box>
                    <Switch
                      checked={settings.dataSources.manual.enabled}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        dataSources: {
                          ...prev.dataSources,
                          manual: { ...prev.dataSources.manual, enabled: e.target.checked },
                        },
                      }))}
                    />
                  </Stack>
                  {settings.dataSources.manual.enabled && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Button variant="outlined" size="small" startIcon={<Plus size={14} />}>
                        Open Manual Entry Form
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Historical Data */}
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <History size={18} className="text-amber-500" />
                        <Typography variant="subtitle1" fontWeight={600}>Historical Patterns</Typography>
                        <Chip label={`Priority ${settings.dataSources.historical.priority}`} size="small" />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        Use past data to predict future demand based on patterns
                      </Typography>
                    </Box>
                    <Switch
                      checked={settings.dataSources.historical.enabled}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        dataSources: {
                          ...prev.dataSources,
                          historical: { ...prev.dataSources.historical, enabled: e.target.checked },
                        },
                      }))}
                    />
                  </Stack>
                  {settings.dataSources.historical.enabled && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant="body2" fontWeight={500} mb={1}>Weeks to Analyze</Typography>
                      <Slider
                        value={settings.dataSources.historical.settings.weeksToAnalyze || 8}
                        onChange={(_, value) => setSettings(prev => ({
                          ...prev,
                          dataSources: {
                            ...prev.dataSources,
                            historical: { 
                              ...prev.dataSources.historical, 
                              settings: { ...prev.dataSources.historical.settings, weeksToAnalyze: value as number }
                            },
                          },
                        }))}
                        min={2}
                        max={52}
                        marks={[
                          { value: 4, label: '4w' },
                          { value: 12, label: '12w' },
                          { value: 26, label: '26w' },
                          { value: 52, label: '52w' },
                        ]}
                        valueLabelDisplay="auto"
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* External Integration */}
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <Plug size={18} className="text-green-500" />
                        <Typography variant="subtitle1" fontWeight={600}>External Integration</Typography>
                        <Chip label={`Priority ${settings.dataSources.integration.priority}`} size="small" />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        Sync demand data from booking systems, POS, or other sources
                      </Typography>
                    </Box>
                    <Switch
                      checked={settings.dataSources.integration.enabled}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        dataSources: {
                          ...prev.dataSources,
                          integration: { ...prev.dataSources.integration, enabled: e.target.checked },
                        },
                      }))}
                    />
                  </Stack>
                  {settings.dataSources.integration.enabled && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Stack spacing={2}>
                        <Alert severity="warning" sx={{ py: 0.5 }}>
                          No integration connected. Configure in Industry Settings.
                        </Alert>
                        <Stack direction="row" spacing={1}>
                          <Button variant="outlined" size="small" startIcon={<Plug size={14} />}>
                            Connect Integration
                          </Button>
                          <Button variant="outlined" size="small" startIcon={<RefreshCw size={14} />}>
                            Sync Now
                          </Button>
                        </Stack>
                      </Stack>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* AI Forecast */}
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <Zap size={18} className="text-purple-500" />
                        <Typography variant="subtitle1" fontWeight={600}>AI Forecasting</Typography>
                        <Chip label={`Priority ${settings.dataSources.forecast.priority}`} size="small" />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        AI-powered demand predictions based on multiple factors
                      </Typography>
                    </Box>
                    <Switch
                      checked={settings.dataSources.forecast.enabled}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        dataSources: {
                          ...prev.dataSources,
                          forecast: { ...prev.dataSources.forecast, enabled: e.target.checked },
                        },
                      }))}
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </TabsContent>

          {/* Forecasting */}
          <TabsContent value="forecasting" className="mt-0">
            <Stack spacing={3}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>Enable Forecasting</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Automatically predict future demand based on historical data
                      </Typography>
                    </Box>
                    <Switch
                      checked={settings.forecasting.enabled}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        forecasting: { ...prev.forecasting, enabled: e.target.checked },
                      }))}
                    />
                  </Stack>

                  {settings.forecasting.enabled && (
                    <Stack spacing={3}>
                      <Box>
                        <Typography variant="body2" fontWeight={500} mb={1}>Forecasting Method</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                          {forecastMethodOptions.map(method => {
                            const isSelected = settings.forecasting.method === method.value;
                            return (
                              <Card
                                key={method.value}
                                variant="outlined"
                                sx={{
                                  cursor: 'pointer',
                                  borderColor: isSelected ? 'primary.main' : 'divider',
                                  bgcolor: isSelected ? 'rgba(3, 169, 244, 0.08)' : 'background.paper',
                                  boxShadow: isSelected ? '0 0 0 2px rgba(3, 169, 244, 0.12)' : 'none',
                                }}
                                onClick={() => setSettings(prev => ({
                                  ...prev,
                                  forecasting: { ...prev.forecasting, method: method.value },
                                }))}
                              >
                                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                  <Typography variant="body2" fontWeight={isSelected ? 600 : 500}>
                                    {method.label}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {method.description}
                                  </Typography>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </Box>
                      </Box>

                      <Divider />

                      <Box>
                        <Typography variant="body2" fontWeight={500} mb={1}>
                          Lookback Period: {settings.forecasting.lookbackWeeks} weeks
                        </Typography>
                        <Slider
                          value={settings.forecasting.lookbackWeeks}
                          onChange={(_, value) => setSettings(prev => ({
                            ...prev,
                            forecasting: { ...prev.forecasting, lookbackWeeks: value as number },
                          }))}
                          min={2}
                          max={52}
                          marks={[
                            { value: 4, label: '4w' },
                            { value: 12, label: '12w' },
                            { value: 26, label: '26w' },
                            { value: 52, label: '52w' },
                          ]}
                          valueLabelDisplay="auto"
                        />
                      </Box>

                      <Box>
                        <Typography variant="body2" fontWeight={500} mb={1}>
                          Confidence Threshold: {settings.forecasting.confidenceThreshold}%
                        </Typography>
                        <Slider
                          value={settings.forecasting.confidenceThreshold}
                          onChange={(_, value) => setSettings(prev => ({
                            ...prev,
                            forecasting: { ...prev.forecasting, confidenceThreshold: value as number },
                          }))}
                          min={50}
                          max={95}
                          valueLabelDisplay="auto"
                        />
                        <Typography variant="caption" color="text.secondary">
                          Only use forecasts above this confidence level
                        </Typography>
                      </Box>

                      <Divider />

                      <Stack spacing={1}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.forecasting.autoAdjust}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                forecasting: { ...prev.forecasting, autoAdjust: e.target.checked },
                              }))}
                            />
                          }
                          label="Auto-adjust based on accuracy"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={settings.forecasting.seasonalAdjustments}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                forecasting: { ...prev.forecasting, seasonalAdjustments: e.target.checked },
                              }))}
                            />
                          }
                          label="Apply seasonal adjustments (holidays, school terms)"
                        />
                      </Stack>
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Stack>
          </TabsContent>

          {/* Patterns & Thresholds */}
          <TabsContent value="patterns" className="mt-0">
            <Stack spacing={3}>
              {/* Schedule Patterns */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} mb={1}>Schedule Patterns</Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Define recurring demand patterns (peak times, rush hours)
                  </Typography>

                  <Stack spacing={2}>
                    {settings.schedulePatterns.map(pattern => (
                      <Box 
                        key={pattern.id} 
                        sx={{ 
                          p: 2, 
                          border: '1px solid', 
                          borderColor: 'divider', 
                          borderRadius: 1,
                          borderLeft: `4px solid ${pattern.color}`,
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Box sx={{ flex: 1 }}>
                            <TextField
                              value={pattern.name}
                              onChange={(e) => updateSchedulePattern(pattern.id, { name: e.target.value })}
                              size="small"
                              variant="standard"
                              sx={{ fontWeight: 600, mb: 1 }}
                            />
                            <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                              <TextField
                                type="time"
                                value={pattern.startTime}
                                onChange={(e) => updateSchedulePattern(pattern.id, { startTime: e.target.value })}
                                size="small"
                                sx={{ width: 120 }}
                              />
                              <Typography variant="body2">to</Typography>
                              <TextField
                                type="time"
                                value={pattern.endTime}
                                onChange={(e) => updateSchedulePattern(pattern.id, { endTime: e.target.value })}
                                size="small"
                                sx={{ width: 120 }}
                              />
                            </Stack>
                            <Stack direction="row" spacing={0.5} mb={1}>
                              {dayNamesShort.map((day, i) => (
                                <Chip
                                  key={i}
                                  label={day}
                                  size="small"
                                  variant={pattern.dayOfWeek.includes(i) ? 'filled' : 'outlined'}
                                  onClick={() => {
                                    const newDays = pattern.dayOfWeek.includes(i)
                                      ? pattern.dayOfWeek.filter(d => d !== i)
                                      : [...pattern.dayOfWeek, i].sort();
                                    updateSchedulePattern(pattern.id, { dayOfWeek: newDays });
                                  }}
                                  sx={{ cursor: 'pointer' }}
                                />
                              ))}
                            </Stack>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Demand Multiplier: {pattern.expectedDemandMultiplier}x
                              </Typography>
                              <Slider
                                value={pattern.expectedDemandMultiplier}
                                onChange={(_, value) => updateSchedulePattern(pattern.id, { expectedDemandMultiplier: value as number })}
                                min={0.5}
                                max={3}
                                step={0.1}
                                size="small"
                              />
                            </Box>
                          </Box>
                          <IconButton size="small" onClick={() => removeSchedulePattern(pattern.id)}>
                            <Trash2 size={16} />
                          </IconButton>
                        </Stack>
                      </Box>
                    ))}

                    <Stack direction="row" spacing={1}>
                      <TextField
                        placeholder="New pattern name..."
                        value={newPatternName}
                        onChange={(e) => setNewPatternName(e.target.value)}
                        size="small"
                        fullWidth
                        onKeyPress={(e) => e.key === 'Enter' && addSchedulePattern()}
                      />
                      <Button variant="outlined" onClick={addSchedulePattern}>
                        <Plus size={16} />
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>

              {/* Demand Thresholds */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} mb={1}>Demand Thresholds</Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Set staffing requirements based on demand levels
                  </Typography>

                  <Stack spacing={2}>
                    {settings.thresholds.map(threshold => (
                      <Box 
                        key={threshold.id} 
                        sx={{ 
                          p: 2, 
                          border: '1px solid', 
                          borderColor: 'divider', 
                          borderRadius: 1,
                          borderLeft: `4px solid ${threshold.color}`,
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Box sx={{ flex: 1 }}>
                            <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                              <TextField
                                value={threshold.name}
                                onChange={(e) => updateThreshold(threshold.id, { name: e.target.value })}
                                size="small"
                                variant="standard"
                              />
                              <Select
                                value={threshold.alertLevel}
                                onValueChange={(value: 'info' | 'warning' | 'critical') => 
                                  updateThreshold(threshold.id, { alertLevel: value })
                                }
                              >
                                <SelectTrigger className="w-28 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="info">Info</SelectItem>
                                  <SelectItem value="warning">Warning</SelectItem>
                                  <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                              </Select>
                            </Stack>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <TextField
                                type="number"
                                label="Min Demand"
                                value={threshold.minDemand}
                                onChange={(e) => updateThreshold(threshold.id, { minDemand: parseInt(e.target.value) || 0 })}
                                size="small"
                                sx={{ width: 100 }}
                              />
                              <TextField
                                type="number"
                                label="Max Demand"
                                value={threshold.maxDemand || ''}
                                onChange={(e) => updateThreshold(threshold.id, { maxDemand: e.target.value ? parseInt(e.target.value) : undefined })}
                                size="small"
                                sx={{ width: 100 }}
                              />
                              <TextField
                                type="number"
                                label="Required Staff"
                                value={threshold.requiredStaff}
                                onChange={(e) => updateThreshold(threshold.id, { requiredStaff: parseInt(e.target.value) || 1 })}
                                size="small"
                                sx={{ width: 120 }}
                              />
                              <TextField
                                type="color"
                                value={threshold.color}
                                onChange={(e) => updateThreshold(threshold.id, { color: e.target.value })}
                                size="small"
                                sx={{ width: 60 }}
                              />
                            </Stack>
                          </Box>
                          <IconButton size="small" onClick={() => removeThreshold(threshold.id)}>
                            <Trash2 size={16} />
                          </IconButton>
                        </Stack>
                      </Box>
                    ))}

                    <Stack direction="row" spacing={1}>
                      <TextField
                        placeholder="New threshold name..."
                        value={newThresholdName}
                        onChange={(e) => setNewThresholdName(e.target.value)}
                        size="small"
                        fullWidth
                        onKeyPress={(e) => e.key === 'Enter' && addThreshold()}
                      />
                      <Button variant="outlined" onClick={addThreshold}>
                        <Plus size={16} />
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>

              {/* Alerts */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} mb={2}>Alert Settings</Typography>
                  <Stack spacing={1}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.alerts.understaffing}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            alerts: { ...prev.alerts, understaffing: e.target.checked },
                          }))}
                        />
                      }
                      label="Alert when understaffed"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.alerts.overstaffing}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            alerts: { ...prev.alerts, overstaffing: e.target.checked },
                          }))}
                        />
                      }
                      label="Alert when overstaffed"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.alerts.demandSpike}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            alerts: { ...prev.alerts, demandSpike: e.target.checked },
                          }))}
                        />
                      }
                      label="Alert on unexpected demand spikes"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.alerts.forecastAccuracy}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            alerts: { ...prev.alerts, forecastAccuracy: e.target.checked },
                          }))}
                        />
                      }
                      label="Alert on low forecast accuracy"
                    />
                  </Stack>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" fontWeight={500} mb={1}>
                      Alert Threshold: ±{settings.alerts.thresholdPercentage}%
                    </Typography>
                    <Slider
                      value={settings.alerts.thresholdPercentage}
                      onChange={(_, value) => setSettings(prev => ({
                        ...prev,
                        alerts: { ...prev.alerts, thresholdPercentage: value as number },
                      }))}
                      min={5}
                      max={50}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          </TabsContent>

          {/* Display Settings */}
          <TabsContent value="display" className="mt-0">
            <Stack spacing={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} mb={2}>Chart Display</Typography>
                  <Stack spacing={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.display.showForecast}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            display: { ...prev.display, showForecast: e.target.checked },
                          }))}
                        />
                      }
                      label="Show forecast line"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.display.showHistorical}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            display: { ...prev.display, showHistorical: e.target.checked },
                          }))}
                        />
                      }
                      label="Show historical comparison"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.display.showVariance}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            display: { ...prev.display, showVariance: e.target.checked },
                          }))}
                        />
                      }
                      label="Show variance indicators"
                    />
                  </Stack>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={600} mb={2}>Chart Type</Typography>
                  <Stack direction="row" spacing={1}>
                    {(['bar', 'line', 'area'] as const).map(type => (
                      <Card
                        key={type}
                        variant="outlined"
                        sx={{
                          flex: 1,
                          cursor: 'pointer',
                          borderColor: settings.display.chartType === type ? 'primary.main' : 'divider',
                          bgcolor: settings.display.chartType === type ? 'rgba(3, 169, 244, 0.08)' : 'background.paper',
                        }}
                        onClick={() => setSettings(prev => ({
                          ...prev,
                          display: { ...prev.display, chartType: type },
                        }))}
                      >
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                          <BarChart3 size={24} className={cn(
                            settings.display.chartType === type ? 'text-primary' : 'text-muted-foreground'
                          )} />
                          <Typography variant="body2" fontWeight={500} sx={{ mt: 1, textTransform: 'capitalize' }}>
                            {type}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={600} mb={2}>Color Scheme</Typography>
                  <Stack direction="row" spacing={1}>
                    {(['default', 'heatmap', 'gradient'] as const).map(scheme => (
                      <Card
                        key={scheme}
                        variant="outlined"
                        sx={{
                          flex: 1,
                          cursor: 'pointer',
                          borderColor: settings.display.colorScheme === scheme ? 'primary.main' : 'divider',
                          bgcolor: settings.display.colorScheme === scheme ? 'rgba(3, 169, 244, 0.08)' : 'background.paper',
                        }}
                        onClick={() => setSettings(prev => ({
                          ...prev,
                          display: { ...prev.display, colorScheme: scheme },
                        }))}
                      >
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                          <Box sx={{ 
                            height: 20, 
                            borderRadius: 1,
                            background: scheme === 'heatmap' 
                              ? 'linear-gradient(90deg, #22c55e, #eab308, #ef4444)'
                              : scheme === 'gradient'
                              ? 'linear-gradient(90deg, #3b82f6, #8b5cf6)'
                              : '#3b82f6',
                          }} />
                          <Typography variant="body2" fontWeight={500} sx={{ mt: 1, textTransform: 'capitalize' }}>
                            {scheme}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
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

export { defaultSettings as defaultDemandMasterSettings };
