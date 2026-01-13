import { useState } from 'react';
import { 
  OnCallConfiguration, 
  DEFAULT_ON_CALL_CONFIGS, 
  AwardType,
  AWARD_NAMES 
} from '@/types/allowances';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Phone, 
  PhoneCall, 
  Save, 
  RotateCcw, 
  Settings2,
  Calendar,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface OnCallSettingsEditorProps {
  awardType: AwardType;
  currentConfig?: OnCallConfiguration;
  onSave: (config: OnCallConfiguration) => void;
  open: boolean;
  onClose: () => void;
}

export function OnCallSettingsEditor({
  awardType,
  currentConfig,
  onSave,
  open,
  onClose,
}: OnCallSettingsEditorProps) {
  const defaultConfig = DEFAULT_ON_CALL_CONFIGS[awardType];
  const [config, setConfig] = useState<OnCallConfiguration>(
    currentConfig || defaultConfig
  );

  const handleReset = () => {
    setConfig(defaultConfig);
    toast.info('Reset to default award values');
  };

  const handleSave = () => {
    onSave(config);
    toast.success('On-call settings saved');
    onClose();
  };

  const updateConfig = (field: keyof OnCallConfiguration, value: number | string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-blue-600" />
            On-Call Rate Configuration
          </DialogTitle>
          <DialogDescription>
            Configure standby and callback rates for on-call shifts under{' '}
            <Badge variant="outline">{AWARD_NAMES[awardType]}</Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Standby Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-600" />
                Standby Allowance
              </CardTitle>
              <CardDescription className="text-xs">
                Paid to employees for being available, regardless of whether they're called
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="standbyRate">Standby Rate ($)</Label>
                  <Input
                    id="standbyRate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={config.standbyRate}
                    onChange={(e) => updateConfig('standbyRate', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="standbyRateType">Rate Type</Label>
                  <Select
                    value={config.standbyRateType}
                    onValueChange={(value) => updateConfig('standbyRateType', value as OnCallConfiguration['standbyRateType'])}
                  >
                    <SelectTrigger id="standbyRateType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_period">Per On-Call Period</SelectItem>
                      <SelectItem value="per_hour">Per Hour On-Call</SelectItem>
                      <SelectItem value="daily">Per Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weekendStandbyRate" className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Weekend Standby Rate ($)
                  </Label>
                  <Input
                    id="weekendStandbyRate"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Same as standard"
                    value={config.weekendStandbyRate || ''}
                    onChange={(e) => updateConfig('weekendStandbyRate', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use standard rate
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publicHolidayMultiplier" className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Public Holiday Multiplier
                  </Label>
                  <Input
                    id="publicHolidayMultiplier"
                    type="number"
                    step="0.1"
                    min="1"
                    placeholder="e.g., 2.0"
                    value={config.publicHolidayStandbyMultiplier || ''}
                    onChange={(e) => updateConfig('publicHolidayStandbyMultiplier', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Multiplied by standard standby rate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Callback Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-amber-600" />
                Callback Payment
              </CardTitle>
              <CardDescription className="text-xs">
                Paid when an on-call employee is actually called in to work
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="callbackMinimumHours">Minimum Hours Paid</Label>
                  <Input
                    id="callbackMinimumHours"
                    type="number"
                    step="0.5"
                    min="0"
                    value={config.callbackMinimumHours}
                    onChange={(e) => updateConfig('callbackMinimumHours', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum payment even for shorter work
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="callbackRateMultiplier">Rate Multiplier</Label>
                  <Input
                    id="callbackRateMultiplier"
                    type="number"
                    step="0.1"
                    min="1"
                    value={config.callbackRateMultiplier}
                    onChange={(e) => updateConfig('callbackRateMultiplier', parseFloat(e.target.value) || 1)}
                  />
                  <p className="text-xs text-muted-foreground">
                    e.g., 1.5 = time-and-a-half
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maximumCallbacksPerPeriod">Maximum Callbacks Per Period</Label>
                <Input
                  id="maximumCallbacksPerPeriod"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={config.maximumCallbacksPerPeriod || ''}
                  onChange={(e) => updateConfig('maximumCallbacksPerPeriod', parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum separate callbacks in one on-call period (leave empty for unlimited)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4" />
                Rate Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Standard on-call (not called):</p>
                  <p className="font-semibold text-emerald-600">
                    ${config.standbyRate.toFixed(2)} / {config.standbyRateType.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">If called (minimum):</p>
                  <p className="font-semibold text-amber-600">
                    ${config.standbyRate.toFixed(2)} + {config.callbackMinimumHours}h @ {config.callbackRateMultiplier}x
                  </p>
                </div>
                {config.weekendStandbyRate && config.weekendStandbyRate > 0 && (
                  <div>
                    <p className="text-muted-foreground">Weekend standby:</p>
                    <p className="font-semibold">${config.weekendStandbyRate.toFixed(2)}</p>
                  </div>
                )}
                {config.publicHolidayStandbyMultiplier && config.publicHolidayStandbyMultiplier > 0 && (
                  <div>
                    <p className="text-muted-foreground">Public holiday standby:</p>
                    <p className="font-semibold">
                      ${(config.standbyRate * config.publicHolidayStandbyMultiplier).toFixed(2)} ({config.publicHolidayStandbyMultiplier}x)
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Quick access button for on-call settings
export function OnCallSettingsButton({
  awardType,
  currentConfig,
  onSave,
}: {
  awardType: AwardType;
  currentConfig?: OnCallConfiguration;
  onSave: (config: OnCallConfiguration) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Settings2 className="h-4 w-4" />
        On-Call Rates
      </Button>
      <OnCallSettingsEditor
        awardType={awardType}
        currentConfig={currentConfig}
        onSave={onSave}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}