import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Users, AlertTriangle, Bell } from 'lucide-react';
import { Centre } from '@/types/roster';

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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Budget Settings
          </DialogTitle>
          <DialogDescription>
            Configure budget limits and alerts for {centre.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Weekly Budget */}
          <div className="space-y-2">
            <Label htmlFor="weeklyBudget" className="text-sm font-medium">
              Weekly Budget
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="weeklyBudget"
                type="number"
                value={settings.weeklyBudget}
                onChange={(e) => setSettings({ ...settings, weeklyBudget: Number(e.target.value) })}
                className="pl-9"
                min={0}
                step={100}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Total labor budget for this centre per week
            </p>
          </div>

          {/* Overtime Threshold */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-500" />
                Overtime Threshold (hours/week)
              </span>
              <span className="font-semibold">{settings.overtimeThreshold}h</span>
            </Label>
            <Slider
              value={[settings.overtimeThreshold]}
              onValueChange={([v]) => setSettings({ ...settings, overtimeThreshold: v })}
              min={30}
              max={50}
              step={1}
            />
            <p className="text-xs text-muted-foreground">
              Hours after which overtime rates apply
            </p>
          </div>

          {/* Max Agency Percentage */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Max Agency Staff
              </span>
              <span className="font-semibold">{settings.maxAgencyPercent}%</span>
            </Label>
            <Slider
              value={[settings.maxAgencyPercent]}
              onValueChange={([v]) => setSettings({ ...settings, maxAgencyPercent: v })}
              min={0}
              max={50}
              step={5}
            />
            <p className="text-xs text-muted-foreground">
              Maximum percentage of shifts filled by agency staff
            </p>
          </div>

          {/* Alert Settings */}
          <Card className="bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Alert Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="alertOverBudget" className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Alert when over budget
                </Label>
                <Switch
                  id="alertOverBudget"
                  checked={settings.alertOnOverBudget}
                  onCheckedChange={(checked) => setSettings({ ...settings, alertOnOverBudget: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="alertNearBudget" className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Alert when near budget
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Threshold: {settings.nearBudgetThreshold}%
                  </p>
                </div>
                <Switch
                  id="alertNearBudget"
                  checked={settings.alertOnNearBudget}
                  onCheckedChange={(checked) => setSettings({ ...settings, alertOnNearBudget: checked })}
                />
              </div>

              {settings.alertOnNearBudget && (
                <div className="pl-6">
                  <Slider
                    value={[settings.nearBudgetThreshold]}
                    onValueChange={([v]) => setSettings({ ...settings, nearBudgetThreshold: v })}
                    min={70}
                    max={99}
                    step={5}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="alertOvertime" className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                  Alert on excessive overtime
                </Label>
                <Switch
                  id="alertOvertime"
                  checked={settings.alertOnOvertimeExcess}
                  onCheckedChange={(checked) => setSettings({ ...settings, alertOnOvertimeExcess: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
