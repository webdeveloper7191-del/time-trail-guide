import { useState } from 'react';
import { Shift, ShiftSpecialType } from '@/types/roster';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Phone, Moon, Clock, ArrowUpCircle, Car, AlertTriangle, 
  ChevronDown, Zap, Info, PhoneCall, BedDouble
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShiftTypeEditorProps {
  shift: Shift;
  onChange: (shift: Shift) => void;
}

const SHIFT_TYPE_CONFIG: Record<ShiftSpecialType, { 
  label: string; 
  icon: typeof Phone; 
  color: string;
  description: string;
}> = {
  regular: { 
    label: 'Regular Shift', 
    icon: Clock, 
    color: 'text-muted-foreground bg-muted/50',
    description: 'Standard working shift'
  },
  on_call: { 
    label: 'On-Call', 
    icon: Phone, 
    color: 'text-blue-600 bg-blue-500/10',
    description: 'Available but not actively working. Triggers on-call allowance.'
  },
  sleepover: { 
    label: 'Sleepover', 
    icon: Moon, 
    color: 'text-purple-600 bg-purple-500/10',
    description: 'Overnight stay at facility. Triggers sleepover allowance.'
  },
  broken: { 
    label: 'Broken/Split Shift', 
    icon: Clock, 
    color: 'text-orange-600 bg-orange-500/10',
    description: 'Shift with unpaid break > 1 hour. Triggers broken shift allowance.'
  },
  recall: { 
    label: 'Recall', 
    icon: PhoneCall, 
    color: 'text-red-600 bg-red-500/10',
    description: 'Called back during on-call period. Minimum 2hr at overtime rates.'
  },
  emergency: { 
    label: 'Emergency Call-Out', 
    icon: AlertTriangle, 
    color: 'text-destructive bg-destructive/10',
    description: 'Emergency response. May trigger additional penalties.'
  },
};

export function ShiftTypeEditor({ shift, onChange }: ShiftTypeEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const currentType = shift.shiftType || 'regular';
  const config = SHIFT_TYPE_CONFIG[currentType];
  const Icon = config.icon;
  
  const handleShiftTypeChange = (type: ShiftSpecialType) => {
    const updates: Partial<Shift> = { shiftType: type === 'regular' ? undefined : type };
    
    // Clear type-specific fields when changing type
    if (type !== 'on_call' && type !== 'recall') {
      updates.onCallDetails = undefined;
    }
    if (type !== 'sleepover') {
      updates.sleepoverDetails = undefined;
    }
    if (type !== 'broken') {
      updates.brokenShiftDetails = undefined;
    }
    
    onChange({ ...shift, ...updates });
  };

  const handleOnCallChange = (field: string, value: string | boolean | number) => {
    onChange({
      ...shift,
      onCallDetails: {
        startTime: shift.onCallDetails?.startTime || shift.startTime,
        endTime: shift.onCallDetails?.endTime || shift.endTime,
        wasRecalled: shift.onCallDetails?.wasRecalled || false,
        ...shift.onCallDetails,
        [field]: value,
      },
    });
  };

  const handleSleepoverChange = (field: string, value: string | boolean | number) => {
    onChange({
      ...shift,
      sleepoverDetails: {
        bedtimeStart: shift.sleepoverDetails?.bedtimeStart || '22:00',
        bedtimeEnd: shift.sleepoverDetails?.bedtimeEnd || '06:00',
        wasDisturbed: shift.sleepoverDetails?.wasDisturbed || false,
        ...shift.sleepoverDetails,
        [field]: value,
      },
    });
  };

  const handleBrokenShiftChange = (field: string, value: string | number) => {
    onChange({
      ...shift,
      brokenShiftDetails: {
        firstShiftEnd: shift.brokenShiftDetails?.firstShiftEnd || '12:00',
        secondShiftStart: shift.brokenShiftDetails?.secondShiftStart || '15:00',
        unpaidGapMinutes: shift.brokenShiftDetails?.unpaidGapMinutes || 180,
        ...shift.brokenShiftDetails,
        [field]: value,
      },
    });
  };

  const handleHigherDutiesChange = (field: string, value: string | number | undefined) => {
    if (field === 'classification' && !value) {
      onChange({ ...shift, higherDuties: undefined });
    } else {
      onChange({
        ...shift,
        higherDuties: {
          classification: shift.higherDuties?.classification || '',
          ...shift.higherDuties,
          [field]: value,
        },
      });
    }
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", config.color)}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-medium">Shift Type & Allowances</h4>
              <p className="text-xs text-muted-foreground">
                {config.label}
              </p>
            </div>
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isExpanded && "rotate-180"
          )} />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="pt-4 space-y-4">
        {/* Shift Type Selector */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">
            Shift Type
          </Label>
          <Select 
            value={currentType} 
            onValueChange={(v) => handleShiftTypeChange(v as ShiftSpecialType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SHIFT_TYPE_CONFIG).map(([type, cfg]) => {
                const TypeIcon = cfg.icon;
                return (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      <TypeIcon className="h-4 w-4" />
                      <span>{cfg.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" />
            {config.description}
          </p>
        </div>

        {/* On-Call Details */}
        {(currentType === 'on_call' || currentType === 'recall') && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-600" />
                On-Call Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">On-Call Start</Label>
                  <Input 
                    type="time"
                    value={shift.onCallDetails?.startTime || shift.startTime}
                    onChange={(e) => handleOnCallChange('startTime', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">On-Call End</Label>
                  <Input 
                    type="time"
                    value={shift.onCallDetails?.endTime || shift.endTime}
                    onChange={(e) => handleOnCallChange('endTime', e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Was Recalled?</Label>
                  <p className="text-xs text-muted-foreground">Called in during on-call period</p>
                </div>
                <Switch 
                  checked={shift.onCallDetails?.wasRecalled || false}
                  onCheckedChange={(checked) => handleOnCallChange('wasRecalled', checked)}
                />
              </div>

              {shift.onCallDetails?.wasRecalled && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-xs">Recall Time</Label>
                    <Input 
                      type="time"
                      value={shift.onCallDetails?.recallTime || ''}
                      onChange={(e) => handleOnCallChange('recallTime', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Duration (mins)</Label>
                    <Input 
                      type="number"
                      min={0}
                      placeholder="120"
                      value={shift.onCallDetails?.recallDuration || ''}
                      onChange={(e) => handleOnCallChange('recallDuration', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <p className="col-span-2 text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Minimum 2 hours at overtime rates will apply
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sleepover Details */}
        {currentType === 'sleepover' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BedDouble className="h-4 w-4 text-purple-600" />
                Sleepover Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Bedtime Start</Label>
                  <Input 
                    type="time"
                    value={shift.sleepoverDetails?.bedtimeStart || '22:00'}
                    onChange={(e) => handleSleepoverChange('bedtimeStart', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Bedtime End</Label>
                  <Input 
                    type="time"
                    value={shift.sleepoverDetails?.bedtimeEnd || '06:00'}
                    onChange={(e) => handleSleepoverChange('bedtimeEnd', e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Was Disturbed?</Label>
                  <p className="text-xs text-muted-foreground">Woken during sleepover period</p>
                </div>
                <Switch 
                  checked={shift.sleepoverDetails?.wasDisturbed || false}
                  onCheckedChange={(checked) => handleSleepoverChange('wasDisturbed', checked)}
                />
              </div>

              {shift.sleepoverDetails?.wasDisturbed && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Disturbance Duration (mins)</Label>
                    <Input 
                      type="number"
                      min={0}
                      placeholder="30"
                      value={shift.sleepoverDetails?.disturbanceMinutes || ''}
                      onChange={(e) => handleSleepoverChange('disturbanceMinutes', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Minimum 1 hour at overtime rates will apply
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Broken Shift Details */}
        {currentType === 'broken' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                Broken Shift Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">First Shift Ends</Label>
                  <Input 
                    type="time"
                    value={shift.brokenShiftDetails?.firstShiftEnd || '12:00'}
                    onChange={(e) => handleBrokenShiftChange('firstShiftEnd', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Second Shift Starts</Label>
                  <Input 
                    type="time"
                    value={shift.brokenShiftDetails?.secondShiftStart || '15:00'}
                    onChange={(e) => handleBrokenShiftChange('secondShiftStart', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Unpaid Gap (mins)</Label>
                <Input 
                  type="number"
                  min={60}
                  value={shift.brokenShiftDetails?.unpaidGapMinutes || 180}
                  onChange={(e) => handleBrokenShiftChange('unpaidGapMinutes', parseInt(e.target.value) || 60)}
                />
                <p className="text-xs text-muted-foreground">
                  Gap must be over 60 minutes to qualify as broken shift
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Higher Duties */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <ArrowUpCircle className="h-4 w-4" />
              Higher Duties
            </Label>
            <Badge variant="outline" className="text-xs">
              {shift.higherDuties ? 'Active' : 'Not Applied'}
            </Badge>
          </div>
          <div className="space-y-2">
            <Select 
              value={shift.higherDuties?.classification || 'none'}
              onValueChange={(value) => handleHigherDutiesChange('classification', value === 'none' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select higher classification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Higher Duties</SelectItem>
                <SelectItem value="Level 2.1">Level 2.1</SelectItem>
                <SelectItem value="Level 2.2">Level 2.2</SelectItem>
                <SelectItem value="Level 2.3">Level 2.3</SelectItem>
                <SelectItem value="Level 3.1">Level 3.1</SelectItem>
                <SelectItem value="Level 3.2">Level 3.2</SelectItem>
                <SelectItem value="Level 3.3">Level 3.3</SelectItem>
                <SelectItem value="Level 4.1">Level 4.1</SelectItem>
                <SelectItem value="Level 4.2">Level 4.2</SelectItem>
                <SelectItem value="Level 4.3">Level 4.3</SelectItem>
                <SelectItem value="Level 5.1">Level 5.1</SelectItem>
                <SelectItem value="Level 5.2">Level 5.2</SelectItem>
                <SelectItem value="Level 5.3">Level 5.3</SelectItem>
                <SelectItem value="Level 6.1">Level 6.1</SelectItem>
                <SelectItem value="Level 6.2">Level 6.2</SelectItem>
                <SelectItem value="Level 6.3">Level 6.3</SelectItem>
                <SelectItem value="Lead Educator">Lead Educator</SelectItem>
                <SelectItem value="Room Leader">Room Leader</SelectItem>
                <SelectItem value="Educational Leader">Educational Leader</SelectItem>
                <SelectItem value="Assistant Director">Assistant Director</SelectItem>
                <SelectItem value="Director">Director</SelectItem>
              </SelectContent>
            </Select>
            {shift.higherDuties?.classification && (
              <div className="space-y-1">
                <Label className="text-xs">Duration (mins, leave blank for full shift)</Label>
                <Input 
                  type="number"
                  min={0}
                  placeholder="Full shift"
                  value={shift.higherDuties?.durationMinutes || ''}
                  onChange={(e) => handleHigherDutiesChange('durationMinutes', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Travel Allowance */}
        <div className="space-y-3">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Car className="h-4 w-4" />
            Travel / Vehicle Allowance
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Kilometres Travelled</Label>
              <Input 
                type="number"
                min={0}
                placeholder="0"
                value={shift.travelKilometres || ''}
                onChange={(e) => onChange({ ...shift, travelKilometres: e.target.value ? parseFloat(e.target.value) : undefined })}
              />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <Switch 
                checked={shift.isRemoteLocation || false}
                onCheckedChange={(checked) => onChange({ ...shift, isRemoteLocation: checked })}
              />
              <Label className="text-xs">Remote Location</Label>
            </div>
          </div>
          {(shift.travelKilometres || 0) > 0 && (
            <p className="text-xs text-emerald-600 flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Vehicle allowance: ${((shift.travelKilometres || 0) * 0.96).toFixed(2)} @ $0.96/km
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
