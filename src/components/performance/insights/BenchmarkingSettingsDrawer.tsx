import React, { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  IconButton,
} from '@mui/material';
import { Button } from '@/components/mui/Button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/mui/Card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Trash2,
  Save,
  Settings,
  Building2,
  Target,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

interface BenchmarkingSettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (settings: BenchmarkingSettings) => void;
  currentSettings?: BenchmarkingSettings;
}

export interface CustomMetric {
  id: string;
  name: string;
  category: 'performance' | 'engagement' | 'development' | 'retention';
  unit: string;
  higherIsBetter: boolean;
  yourTarget: number;
  industryAvg: number;
  topQuartile: number;
}

export interface BenchmarkingSettings {
  companyName: string;
  primaryIndustry: string;
  companySize: 'small' | 'medium' | 'large' | 'enterprise';
  region: string;
  fiscalYearStart: string;
  enableQuarterlyReports: boolean;
  showConfidenceIntervals: boolean;
  customMetrics: CustomMetric[];
  enabledCategories: string[];
  benchmarkSources: string[];
}

const defaultSettings: BenchmarkingSettings = {
  companyName: '',
  primaryIndustry: 'technology',
  companySize: 'medium',
  region: 'Asia Pacific',
  fiscalYearStart: '01',
  enableQuarterlyReports: true,
  showConfidenceIntervals: false,
  customMetrics: [],
  enabledCategories: ['performance', 'engagement', 'development', 'retention'],
  benchmarkSources: ['Industry Reports', 'Peer Networks', 'Public Data'],
};

const industryOptions = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'retail', label: 'Retail' },
  { value: 'finance', label: 'Financial Services' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'education', label: 'Education' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'professional_services', label: 'Professional Services' },
];

const companySizeOptions = [
  { value: 'small', label: 'Small (1-50)' },
  { value: 'medium', label: 'Medium (51-500)' },
  { value: 'large', label: 'Large (501-5000)' },
  { value: 'enterprise', label: 'Enterprise (5000+)' },
];

const regionOptions = [
  'Asia Pacific',
  'North America',
  'Europe',
  'Middle East',
  'Latin America',
  'Africa',
  'Global',
];

const categoryOptions = [
  { value: 'performance', label: 'Performance' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'development', label: 'Development' },
  { value: 'retention', label: 'Retention' },
];

const monthOptions = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export function BenchmarkingSettingsDrawer({
  open,
  onOpenChange,
  onSave,
  currentSettings,
}: BenchmarkingSettingsDrawerProps) {
  const [settings, setSettings] = useState<BenchmarkingSettings>(currentSettings || defaultSettings);
  const [showAddMetric, setShowAddMetric] = useState(false);
  const [newMetric, setNewMetric] = useState<Partial<CustomMetric>>({
    category: 'performance',
    higherIsBetter: true,
  });

  const handleAddCustomMetric = () => {
    if (!newMetric.name?.trim()) {
      toast.error('Please enter a metric name');
      return;
    }

    const metric: CustomMetric = {
      id: `custom-${Date.now()}`,
      name: newMetric.name.trim(),
      category: newMetric.category || 'performance',
      unit: newMetric.unit || '',
      higherIsBetter: newMetric.higherIsBetter ?? true,
      yourTarget: newMetric.yourTarget || 0,
      industryAvg: newMetric.industryAvg || 0,
      topQuartile: newMetric.topQuartile || 0,
    };

    setSettings({
      ...settings,
      customMetrics: [...settings.customMetrics, metric],
    });

    setNewMetric({ category: 'performance', higherIsBetter: true });
    setShowAddMetric(false);
    toast.success('Custom metric added');
  };

  const handleRemoveCustomMetric = (id: string) => {
    setSettings({
      ...settings,
      customMetrics: settings.customMetrics.filter((m) => m.id !== id),
    });
  };

  const handleToggleCategory = (category: string) => {
    const enabled = settings.enabledCategories.includes(category);
    setSettings({
      ...settings,
      enabledCategories: enabled
        ? settings.enabledCategories.filter((c) => c !== category)
        : [...settings.enabledCategories, category],
    });
  };

  const handleResetToDefaults = () => {
    setSettings(defaultSettings);
    toast.info('Settings reset to defaults');
  };

  const handleSave = () => {
    onSave(settings);
    toast.success('Benchmarking settings saved');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Benchmarking Settings
          </SheetTitle>
          <SheetDescription>
            Configure your company profile and custom metrics for accurate benchmarking
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-6">
            {/* Company Profile */}
            <div className="space-y-4">
              <Typography variant="subtitle2" fontWeight={600} className="text-muted-foreground uppercase tracking-wide text-xs flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Company Profile
              </Typography>
              
              <Card className="p-4 space-y-4">
                <TextField
                  label="Company Name"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  fullWidth
                  size="small"
                  placeholder="Your Organization"
                />

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Primary Industry</InputLabel>
                    <MuiSelect
                      value={settings.primaryIndustry}
                      label="Primary Industry"
                      onChange={(e) => setSettings({ ...settings, primaryIndustry: e.target.value })}
                    >
                      {industryOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </MuiSelect>
                  </FormControl>

                  <FormControl size="small" fullWidth>
                    <InputLabel>Company Size</InputLabel>
                    <MuiSelect
                      value={settings.companySize}
                      label="Company Size"
                      onChange={(e) => setSettings({ ...settings, companySize: e.target.value as any })}
                    >
                      {companySizeOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </MuiSelect>
                  </FormControl>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Region</InputLabel>
                    <MuiSelect
                      value={settings.region}
                      label="Region"
                      onChange={(e) => setSettings({ ...settings, region: e.target.value })}
                    >
                      {regionOptions.map((region) => (
                        <MenuItem key={region} value={region}>
                          {region}
                        </MenuItem>
                      ))}
                    </MuiSelect>
                  </FormControl>

                  <FormControl size="small" fullWidth>
                    <InputLabel>Fiscal Year Start</InputLabel>
                    <MuiSelect
                      value={settings.fiscalYearStart}
                      label="Fiscal Year Start"
                      onChange={(e) => setSettings({ ...settings, fiscalYearStart: e.target.value })}
                    >
                      {monthOptions.map((month) => (
                        <MenuItem key={month.value} value={month.value}>
                          {month.label}
                        </MenuItem>
                      ))}
                    </MuiSelect>
                  </FormControl>
                </Stack>
              </Card>
            </div>

            <Divider />

            {/* Display Options */}
            <div className="space-y-4">
              <Typography variant="subtitle2" fontWeight={600} className="text-muted-foreground uppercase tracking-wide text-xs">
                Display Options
              </Typography>
              
              <Card className="p-4 space-y-3">
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enableQuarterlyReports}
                      onChange={(e) => setSettings({ ...settings, enableQuarterlyReports: e.target.checked })}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Enable quarterly reports</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Generate benchmark comparisons each quarter
                      </Typography>
                    </Box>
                  }
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.showConfidenceIntervals}
                      onChange={(e) => setSettings({ ...settings, showConfidenceIntervals: e.target.checked })}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={500}>Show confidence intervals</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Display statistical confidence bands on charts
                      </Typography>
                    </Box>
                  }
                />
              </Card>
            </div>

            <Divider />

            {/* Categories */}
            <div className="space-y-4">
              <Typography variant="subtitle2" fontWeight={600} className="text-muted-foreground uppercase tracking-wide text-xs">
                Enabled Categories
              </Typography>
              
              <Card className="p-4">
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {categoryOptions.map((cat) => {
                    const isEnabled = settings.enabledCategories.includes(cat.value);
                    return (
                      <Badge
                        key={cat.value}
                        className={`cursor-pointer transition-all ${
                          isEnabled
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                        onClick={() => handleToggleCategory(cat.value)}
                      >
                        {cat.label}
                      </Badge>
                    );
                  })}
                </Stack>
                <Typography variant="caption" color="text.secondary" className="mt-2 block">
                  Click to toggle categories displayed in benchmarking dashboard
                </Typography>
              </Card>
            </div>

            <Divider />

            {/* Custom Metrics */}
            <div className="space-y-4">
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" fontWeight={600} className="text-muted-foreground uppercase tracking-wide text-xs flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Custom Metrics ({settings.customMetrics.length})
                </Typography>
                <Button size="small" variant="outlined" onClick={() => setShowAddMetric(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Metric
                </Button>
              </Stack>

              {/* Add Metric Form */}
              {showAddMetric && (
                <Card className="p-4 border-2 border-dashed border-primary/30 bg-primary/5 space-y-3">
                  <Typography variant="subtitle2" fontWeight={600}>New Custom Metric</Typography>
                  
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="Metric Name"
                      value={newMetric.name || ''}
                      onChange={(e) => setNewMetric({ ...newMetric, name: e.target.value })}
                      size="small"
                      placeholder="e.g., Employee Satisfaction"
                      sx={{ flex: 2 }}
                    />
                    <FormControl size="small" sx={{ flex: 1 }}>
                      <InputLabel>Category</InputLabel>
                      <MuiSelect
                        value={newMetric.category}
                        label="Category"
                        onChange={(e) => setNewMetric({ ...newMetric, category: e.target.value as any })}
                      >
                        {categoryOptions.map((cat) => (
                          <MenuItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </MenuItem>
                        ))}
                      </MuiSelect>
                    </FormControl>
                  </Stack>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="Unit"
                      value={newMetric.unit || ''}
                      onChange={(e) => setNewMetric({ ...newMetric, unit: e.target.value })}
                      size="small"
                      placeholder="e.g., %, hrs, score"
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="Your Target"
                      type="number"
                      value={newMetric.yourTarget || ''}
                      onChange={(e) => setNewMetric({ ...newMetric, yourTarget: parseFloat(e.target.value) })}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="Industry Avg"
                      type="number"
                      value={newMetric.industryAvg || ''}
                      onChange={(e) => setNewMetric({ ...newMetric, industryAvg: parseFloat(e.target.value) })}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="Top Quartile"
                      type="number"
                      value={newMetric.topQuartile || ''}
                      onChange={(e) => setNewMetric({ ...newMetric, topQuartile: parseFloat(e.target.value) })}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                  </Stack>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={newMetric.higherIsBetter ?? true}
                        onChange={(e) => setNewMetric({ ...newMetric, higherIsBetter: e.target.checked })}
                        size="small"
                      />
                    }
                    label={<Typography variant="body2">Higher is better</Typography>}
                  />

                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" variant="text" onClick={() => setShowAddMetric(false)}>
                      Cancel
                    </Button>
                    <Button size="small" variant="contained" onClick={handleAddCustomMetric}>
                      Add Metric
                    </Button>
                  </Stack>
                </Card>
              )}

              {/* Existing Custom Metrics */}
              {settings.customMetrics.length > 0 ? (
                <div className="space-y-2">
                  {settings.customMetrics.map((metric) => (
                    <Card key={metric.id} className="p-3">
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="body2" fontWeight={500}>
                              {metric.name}
                            </Typography>
                            <Badge variant="outline" className="text-xs capitalize">
                              {metric.category}
                            </Badge>
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            Target: {metric.yourTarget}{metric.unit} • Industry: {metric.industryAvg}{metric.unit} • Top: {metric.topQuartile}{metric.unit}
                          </Typography>
                        </Box>
                        <IconButton size="small" onClick={() => handleRemoveCustomMetric(metric.id)}>
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </Stack>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-4 border-dashed text-center">
                  <Typography variant="body2" color="text.secondary">
                    No custom metrics defined yet
                  </Typography>
                </Card>
              )}
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="px-6 py-4 border-t">
          <Stack direction="row" spacing={2} justifyContent="space-between" width="100%">
            <Button variant="text" onClick={handleResetToDefaults} color="secondary">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </Stack>
          </Stack>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
