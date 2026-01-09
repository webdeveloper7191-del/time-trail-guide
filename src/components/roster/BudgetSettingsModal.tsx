import { useState } from 'react';
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
} from '@mui/material';
import { DollarSign, TrendingUp, Users, AlertTriangle, Bell } from 'lucide-react';
import { Centre } from '@/types/roster';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BudgetSettings {
  weeklyBudget: number;
  overtimeThreshold: number;
  maxAgencyPercent: number;
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

export function BudgetSettingsModal({ open, onClose, centre, currentBudget, onSave }: BudgetSettingsModalProps) {
  const [settings, setSettings] = useState<BudgetSettings>({
    weeklyBudget: currentBudget,
    overtimeThreshold: 38,
    maxAgencyPercent: 25,
    alertOnOverBudget: true,
    alertOnNearBudget: true,
    nearBudgetThreshold: 90,
    alertOnOvertimeExcess: true,
  });

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Budget Settings
          </SheetTitle>
          <SheetDescription>
            Configure budget limits and alerts for {centre.name}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 pr-4 h-[calc(100vh-220px)]">
          <Stack spacing={4}>
            {/* Weekly Budget */}
            <Box>
              <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
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

            {/* Overtime Threshold */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" fontWeight={500} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp size={16} style={{ color: '#f59e0b' }} />
                  Overtime Threshold (hours/week)
                </Typography>
                <Typography variant="body2" fontWeight={600}>{settings.overtimeThreshold}h</Typography>
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

            {/* Max Agency Percentage */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" fontWeight={500} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Users size={16} style={{ color: 'var(--mui-palette-primary-main)' }} />
                  Max Agency Staff
                </Typography>
                <Typography variant="body2" fontWeight={600}>{settings.maxAgencyPercent}%</Typography>
              </Box>
              <Slider
                value={settings.maxAgencyPercent}
                onChange={(_, v) => setSettings({ ...settings, maxAgencyPercent: v as number })}
                min={0}
                max={50}
                step={5}
                size="small"
              />
              <Typography variant="caption" color="text.secondary">
                Maximum percentage of shifts filled by agency staff
              </Typography>
            </Box>

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
                      <AlertTriangle size={16} style={{ color: '#ef4444' }} />
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
                          <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
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
                      <TrendingUp size={16} style={{ color: '#f59e0b' }} />
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
        </ScrollArea>

        <SheetFooter className="mt-6">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save Settings</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
