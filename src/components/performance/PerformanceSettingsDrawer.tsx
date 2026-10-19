import React, { useState, useEffect } from 'react';
import { Box, Stack, Typography, Divider } from '@mui/material';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui/Button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Sparkles, Coins, Eye, EyeOff, Users, Shield } from 'lucide-react';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { toast } from 'sonner';

import { performanceSettingsStore, usePerformanceSettings, type PerformanceSettings } from '@/lib/performanceSettingsStore';
export type { PerformanceSettings } from '@/lib/performanceSettingsStore';

interface PerformanceSettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings?: PerformanceSettings;
  onSave?: (settings: PerformanceSettings) => void;
}

export function PerformanceSettingsDrawer({ 
  open, 
  onOpenChange,
  settings,
  onSave,
}: PerformanceSettingsDrawerProps) {
  const savedSettings = usePerformanceSettings();
  const [localSettings, setLocalSettings] = useState<PerformanceSettings>(settings ?? savedSettings);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (open) setLocalSettings(structuredClone(settings ?? savedSettings));
  }, [open, settings, savedSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      performanceSettingsStore.save(localSettings);
      onSave?.(localSettings);
      toast.success('Settings saved successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save settings in this browser');
    } finally {
      setSaving(false);
    }
  };

  const updateRecognition = (key: keyof PerformanceSettings['recognition'], value: boolean | number) => {
    setLocalSettings(prev => ({
      ...prev,
      recognition: { ...prev.recognition, [key]: value },
    }));
  };

  const updateSurveys = (key: keyof PerformanceSettings['surveys'], value: boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      surveys: { ...prev.surveys, [key]: value },
    }));
  };

  const updateGoals = (key: keyof PerformanceSettings['goals'], value: boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      goals: { ...prev.goals, [key]: value },
    }));
  };

  return (
    <PrimaryOffCanvas
      title="Performance Settings"
      description="Configure module visibility and permissions"
      icon={Settings}
      size="md"
      open={open}
      onClose={() => onOpenChange(false)}
      actions={[
        { label: 'Cancel', onClick: () => onOpenChange(false), variant: 'outlined' },
        { label: saving ? 'Saving...' : 'Save Settings', onClick: handleSave, variant: 'primary', loading: saving },
      ]}
    >
      <div className="space-y-6">
        {/* Recognition Settings */}
        <Card sx={{ p: 0, overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, bgcolor: 'rgba(168, 85, 247, 0.06)', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Sparkles className="h-5 w-5 text-purple-600" />
              <Typography variant="subtitle1" fontWeight={600}>Recognition & Rewards</Typography>
            </Stack>
          </Box>
          <Box sx={{ p: 2.5 }}>
            <Stack spacing={3}>
              {/* Visibility Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    {localSettings.recognition.visibleInEmployeePortal ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    Visible in Employee Portal
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Show Recognition tab in the Employee Portal
                  </p>
                </div>
                <Switch
                  checked={localSettings.recognition.visibleInEmployeePortal}
                  onCheckedChange={(checked) => updateRecognition('visibleInEmployeePortal', checked)}
                />
              </div>

              <Divider />

              {/* Hide Independent Praise Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <EyeOff className="h-4 w-4 text-orange-600" />
                    Hide Independent Praise in Employee Portal
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Hide individual praise posts from showing in the Employee Portal feed
                  </p>
                </div>
                <Switch
                  checked={localSettings.recognition.hideIndependentPraise}
                  onCheckedChange={(checked) => updateRecognition('hideIndependentPraise', checked)}
                />
              </div>

              <Divider />

              {/* Points Awarding Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Coins className="h-4 w-4 text-amber-600" />
                    Employees Can Award Points
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Allow employees to include points when giving praise
                  </p>
                </div>
                <Switch
                  checked={localSettings.recognition.employeesCanAwardPoints}
                  onCheckedChange={(checked) => updateRecognition('employeesCanAwardPoints', checked)}
                />
              </div>

              {localSettings.recognition.employeesCanAwardPoints && (
                <div className="ml-6 p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Max Points Per Praise</Label>
                      <p className="text-xs text-muted-foreground">
                        Limit points employees can award at once
                      </p>
                    </div>
                    <Select value={String(localSettings.recognition.maxPointsPerPraise)} onValueChange={value => updateRecognition('maxPointsPerPraise', Number(value))}>
                      <SelectTrigger className="w-24" aria-label="Max points per praise"><SelectValue /></SelectTrigger>
                      <SelectContent>{[25, 50, 100].map(points => <SelectItem key={points} value={String(points)}>{points}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <Divider />

              {/* Approval Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    Require Approval for Redemptions
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Manager must approve before rewards are redeemed
                  </p>
                </div>
                <Switch
                  checked={localSettings.recognition.requireApprovalForRewards}
                  onCheckedChange={(checked) => updateRecognition('requireApprovalForRewards', checked)}
                />
              </div>
            </Stack>
          </Box>
        </Card>

        {/* Surveys Settings */}
        <Card sx={{ p: 0, overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, bgcolor: 'rgba(59, 130, 246, 0.06)', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Users className="h-5 w-5 text-blue-600" />
              <Typography variant="subtitle1" fontWeight={600}>Surveys</Typography>
            </Stack>
          </Box>
          <Box sx={{ p: 2.5 }}>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Anonymous by Default</Label>
                <p className="text-xs text-muted-foreground">
                  New surveys default to anonymous responses
                </p>
              </div>
              <Switch
                checked={localSettings.surveys.anonymousByDefault}
                onCheckedChange={(checked) => updateSurveys('anonymousByDefault', checked)}
              />
            </div>
          </Box>
        </Card>

        {/* Goals Settings */}
        <Card sx={{ p: 0, overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, bgcolor: 'rgba(34, 197, 94, 0.06)', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Settings className="h-5 w-5 text-green-600" />
              <Typography variant="subtitle1" fontWeight={600}>Goals</Typography>
            </Stack>
          </Box>
          <Box sx={{ p: 2.5 }}>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Employee Self-Creation</Label>
                <p className="text-xs text-muted-foreground">
                  Allow employees to create their own goals
                </p>
              </div>
              <Switch
                checked={localSettings.goals.allowSelfCreation}
                onCheckedChange={(checked) => updateGoals('allowSelfCreation', checked)}
              />
            </div>
          </Box>
        </Card>
      </div>
    </PrimaryOffCanvas>
  );
}
