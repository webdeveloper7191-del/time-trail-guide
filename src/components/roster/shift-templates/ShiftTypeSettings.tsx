 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Switch } from '@/components/ui/switch';
 import { ShiftTemplate, ShiftSpecialType, shiftTypeLabels, shiftTypeDescriptions } from '@/types/roster';
 import { 
   AllowanceType, 
   AwardType,
   DEFAULT_ON_CALL_CONFIGS, 
   DEFAULT_SLEEPOVER_CONFIGS, 
   DEFAULT_BROKEN_SHIFT_CONFIGS 
 } from '@/types/allowances';
 import { AllowanceDropdownWithCreate } from '../AllowanceDropdownWithCreate';
 import { Phone, Moon, ArrowLeftRight, Clock, Zap, AlertTriangle, ChevronDown, Car, TrendingUp } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { useState } from 'react';
 
 const shiftTypeIcons: Record<ShiftSpecialType, React.ReactNode> = {
   regular: <Clock size={14} />,
   on_call: <Phone size={14} />,
   sleepover: <Moon size={14} />,
   broken: <ArrowLeftRight size={14} />,
   recall: <AlertTriangle size={14} />,
   emergency: <Zap size={14} />,
 };
 
 interface ShiftTypeSettingsProps {
   template: Partial<ShiftTemplate>;
   onUpdate: (updates: Partial<ShiftTemplate>) => void;
   customAllowances: AllowanceType[];
   onCreateAllowance: (allowance: AllowanceType) => void;
 }
 
 export function ShiftTypeSettings({
   template,
   onUpdate,
   customAllowances,
   onCreateAllowance,
 }: ShiftTypeSettingsProps) {
   const shiftType = template.shiftType || 'regular';
   const [onCallOpen, setOnCallOpen] = useState(true);
   const [sleepoverOpen, setSleepoverOpen] = useState(true);
   const [brokenOpen, setBrokenOpen] = useState(true);
   const [additionalOpen, setAdditionalOpen] = useState(true);
 
   const handleShiftTypeChange = (newType: ShiftSpecialType) => {
     const award: AwardType = 'children_services';
     const updates: Partial<ShiftTemplate> = { shiftType: newType };
     
     if (newType === 'on_call') {
       const config = DEFAULT_ON_CALL_CONFIGS[award];
       updates.onCallSettings = {
         defaultStartTime: '18:00',
         defaultEndTime: '06:00',
         standbyRate: config.standbyRate,
         standbyRateType: config.standbyRateType,
         callbackMinimumHours: config.callbackMinimumHours,
         callbackRateMultiplier: config.callbackRateMultiplier,
         weekendStandbyRate: config.weekendStandbyRate,
         publicHolidayStandbyMultiplier: config.publicHolidayStandbyMultiplier,
       };
     } else if (newType === 'sleepover') {
       const config = DEFAULT_SLEEPOVER_CONFIGS[award];
       updates.sleepoverSettings = {
         bedtimeStart: '22:00',
         bedtimeEnd: '06:00',
         flatRate: config.flatRate,
         disturbanceRatePerHour: config.disturbanceRatePerHour,
         disturbanceMinimumHours: config.disturbanceMinimumHours,
         disturbanceRateMultiplier: config.disturbanceRateMultiplier,
         weekendFlatRate: config.weekendFlatRate,
         publicHolidayFlatRate: config.publicHolidayFlatRate,
       };
     } else if (newType === 'broken') {
       const config = DEFAULT_BROKEN_SHIFT_CONFIGS[award];
       updates.brokenShiftSettings = {
         firstShiftEnd: '11:00',
         secondShiftStart: '15:00',
         unpaidGapMinutes: 240,
         allowanceRate: config.allowanceRate,
         minimumGapMinutes: config.minimumGapMinutes,
         maximumGapMinutes: config.maximumGapMinutes,
         gapBonusRate: config.gapBonusRate,
       };
     }
     
     onUpdate(updates);
   };
 
   return (
     <div className="space-y-4">
       {/* Shift Type Selector */}
       <div className="space-y-1.5">
         <Label className="text-sm font-medium text-primary">Shift Type</Label>
         <Select value={shiftType} onValueChange={(v) => handleShiftTypeChange(v as ShiftSpecialType)}>
           <SelectTrigger>
             <SelectValue />
           </SelectTrigger>
           <SelectContent>
             {(Object.keys(shiftTypeLabels) as ShiftSpecialType[]).map(type => (
               <SelectItem key={type} value={type}>
                 <div className="flex items-center gap-2">
                   {shiftTypeIcons[type]}
                   <span>{shiftTypeLabels[type]}</span>
                 </div>
               </SelectItem>
             ))}
           </SelectContent>
         </Select>
         <p className="text-xs text-muted-foreground">{shiftTypeDescriptions[shiftType]}</p>
       </div>
 
       {/* On-Call Settings */}
       {shiftType === 'on_call' && (
         <Collapsible open={onCallOpen} onOpenChange={setOnCallOpen} className="rounded-lg border border-border bg-muted/30">
           <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-sm font-medium">
             <div className="flex items-center gap-2">
               <Phone size={14} className="text-primary" />
               <span>On-Call Settings</span>
             </div>
             <ChevronDown size={16} className={cn("transition-transform", onCallOpen && "rotate-180")} />
           </CollapsibleTrigger>
           <CollapsibleContent className="px-3 pb-3 space-y-4">
             {/* Period Times */}
             <div className="grid grid-cols-2 gap-3">
               <div className="space-y-1.5">
                 <Label className="text-xs text-muted-foreground">On-Call Start</Label>
                 <Input
                   type="time"
                   value={template.onCallSettings?.defaultStartTime || '18:00'}
                   onChange={(e) => onUpdate({ 
                     onCallSettings: { ...template.onCallSettings, defaultStartTime: e.target.value } 
                   })}
                 />
               </div>
               <div className="space-y-1.5">
                 <Label className="text-xs text-muted-foreground">On-Call End</Label>
                 <Input
                   type="time"
                   value={template.onCallSettings?.defaultEndTime || '06:00'}
                   onChange={(e) => onUpdate({ 
                     onCallSettings: { ...template.onCallSettings, defaultEndTime: e.target.value } 
                   })}
                 />
               </div>
             </div>
             
             {/* Standby Pay */}
             <p className="text-xs font-medium text-muted-foreground pt-2">Standby Pay (paid regardless of callback)</p>
             <div className="grid grid-cols-2 gap-3">
               <div className="space-y-1.5">
                 <Label className="text-xs text-muted-foreground">Standby Rate ($)</Label>
                 <Input
                   type="number"
                   value={template.onCallSettings?.standbyRate || 15.42}
                   onChange={(e) => onUpdate({ 
                     onCallSettings: { ...template.onCallSettings, standbyRate: parseFloat(e.target.value) || 0 } 
                   })}
                   min={0}
                   step={0.01}
                 />
               </div>
               <div className="space-y-1.5">
                 <Label className="text-xs text-muted-foreground">Rate Type</Label>
                 <Select
                   value={template.onCallSettings?.standbyRateType || 'per_period'}
                   onValueChange={(v) => onUpdate({ 
                     onCallSettings: { ...template.onCallSettings, standbyRateType: v as 'per_period' | 'per_hour' | 'daily' } 
                   })}
                 >
                   <SelectTrigger><SelectValue /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="per_period">Per Period</SelectItem>
                     <SelectItem value="per_hour">Per Hour</SelectItem>
                     <SelectItem value="daily">Per Day</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
             </div>
             <div className="space-y-1.5">
               <Label className="text-xs text-muted-foreground">Weekend Standby Rate ($)</Label>
               <Input
                 type="number"
                 value={template.onCallSettings?.weekendStandbyRate || ''}
                 onChange={(e) => onUpdate({ 
                   onCallSettings: { ...template.onCallSettings, weekendStandbyRate: parseFloat(e.target.value) || undefined } 
                 })}
                 placeholder="Higher rate for Sat/Sun"
                 min={0}
                 step={0.01}
               />
             </div>
             
             {/* Callback Pay */}
             <p className="text-xs font-medium text-muted-foreground pt-2">Callback Pay (when called in)</p>
             <div className="grid grid-cols-2 gap-3">
               <div className="space-y-1.5">
                 <Label className="text-xs text-muted-foreground">Minimum Hours</Label>
                 <Input
                   type="number"
                   value={template.onCallSettings?.callbackMinimumHours || 2}
                   onChange={(e) => onUpdate({ 
                     onCallSettings: { ...template.onCallSettings, callbackMinimumHours: parseInt(e.target.value) || 2 } 
                   })}
                   min={1}
                   max={8}
                 />
               </div>
               <div className="space-y-1.5">
                 <Label className="text-xs text-muted-foreground">Rate Multiplier</Label>
                 <Input
                   type="number"
                   value={template.onCallSettings?.callbackRateMultiplier || 1.5}
                   onChange={(e) => onUpdate({ 
                     onCallSettings: { ...template.onCallSettings, callbackRateMultiplier: parseFloat(e.target.value) || 1.5 } 
                   })}
                   min={1}
                   max={3}
                   step={0.25}
                 />
               </div>
             </div>
             <div className="space-y-1.5">
               <Label className="text-xs text-muted-foreground">Public Holiday Multiplier</Label>
               <Input
                 type="number"
                 value={template.onCallSettings?.publicHolidayStandbyMultiplier || ''}
                 onChange={(e) => onUpdate({ 
                   onCallSettings: { ...template.onCallSettings, publicHolidayStandbyMultiplier: parseFloat(e.target.value) || undefined } 
                 })}
                 placeholder="e.g. 2.5"
                 min={1}
                 max={3}
                 step={0.25}
               />
             </div>
           </CollapsibleContent>
         </Collapsible>
       )}
 
       {/* Sleepover Settings */}
       {shiftType === 'sleepover' && (
         <Collapsible open={sleepoverOpen} onOpenChange={setSleepoverOpen} className="rounded-lg border border-border bg-muted/30">
           <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-sm font-medium">
             <div className="flex items-center gap-2">
               <Moon size={14} className="text-primary" />
               <span>Sleepover Settings</span>
             </div>
             <ChevronDown size={16} className={cn("transition-transform", sleepoverOpen && "rotate-180")} />
           </CollapsibleTrigger>
           <CollapsibleContent className="px-3 pb-3 space-y-4">
             {/* Period Times */}
             <div className="grid grid-cols-2 gap-3">
               <div className="space-y-1.5">
                 <Label className="text-xs text-muted-foreground">Bedtime Start</Label>
                 <Input
                   type="time"
                   value={template.sleepoverSettings?.bedtimeStart || '22:00'}
                   onChange={(e) => onUpdate({ 
                     sleepoverSettings: { ...template.sleepoverSettings, bedtimeStart: e.target.value } 
                   })}
                 />
               </div>
               <div className="space-y-1.5">
                 <Label className="text-xs text-muted-foreground">Bedtime End</Label>
                 <Input
                   type="time"
                   value={template.sleepoverSettings?.bedtimeEnd || '06:00'}
                   onChange={(e) => onUpdate({ 
                     sleepoverSettings: { ...template.sleepoverSettings, bedtimeEnd: e.target.value } 
                   })}
                 />
               </div>
             </div>
             
             {/* Flat Rate Pay */}
             <p className="text-xs font-medium text-muted-foreground pt-2">Flat Rate (paid for sleepover)</p>
             <div className="grid grid-cols-3 gap-3">
               <div className="space-y-1.5">
                 <Label className="text-xs text-muted-foreground">Flat Rate ($)</Label>
                 <Input
                   type="number"
                   value={template.sleepoverSettings?.flatRate || 69.85}
                   onChange={(e) => onUpdate({ 
                     sleepoverSettings: { ...template.sleepoverSettings, flatRate: parseFloat(e.target.value) || 0 } 
                   })}
                   min={0}
                   step={0.01}
                 />
               </div>
               <div className="space-y-1.5">
                 <Label className="text-xs text-muted-foreground">Weekend Rate ($)</Label>
                 <Input
                   type="number"
                   value={template.sleepoverSettings?.weekendFlatRate || ''}
                   onChange={(e) => onUpdate({ 
                     sleepoverSettings: { ...template.sleepoverSettings, weekendFlatRate: parseFloat(e.target.value) || undefined } 
                   })}
                   min={0}
                   step={0.01}
                 />
               </div>
               <div className="space-y-1.5">
                 <Label className="text-xs text-muted-foreground">Public Hol Rate ($)</Label>
                 <Input
                   type="number"
                   value={template.sleepoverSettings?.publicHolidayFlatRate || ''}
                   onChange={(e) => onUpdate({ 
                     sleepoverSettings: { ...template.sleepoverSettings, publicHolidayFlatRate: parseFloat(e.target.value) || undefined } 
                   })}
                   min={0}
                   step={0.01}
                 />
               </div>
             </div>
             
             {/* Disturbance Pay */}
             <p className="text-xs font-medium text-muted-foreground pt-2">Disturbance Pay (when sleep is interrupted)</p>
             <div className="grid grid-cols-3 gap-3">
               <div className="space-y-1.5">
                 <Label className="text-xs text-muted-foreground">Hourly Rate ($)</Label>
                 <Input
                   type="number"
                   value={template.sleepoverSettings?.disturbanceRatePerHour || 45.50}
                   onChange={(e) => onUpdate({ 
                     sleepoverSettings: { ...template.sleepoverSettings, disturbanceRatePerHour: parseFloat(e.target.value) || 0 } 
                   })}
                   min={0}
                   step={0.01}
                 />
               </div>
               <div className="space-y-1.5">
                 <Label className="text-xs text-muted-foreground">Min Hours</Label>
                 <Input
                   type="number"
                   value={template.sleepoverSettings?.disturbanceMinimumHours || 1}
                   onChange={(e) => onUpdate({ 
                     sleepoverSettings: { ...template.sleepoverSettings, disturbanceMinimumHours: parseInt(e.target.value) || 1 } 
                   })}
                   min={1}
                   max={4}
                 />
               </div>
               <div className="space-y-1.5">
                 <Label className="text-xs text-muted-foreground">Rate Multiplier</Label>
                 <Input
                   type="number"
                   value={template.sleepoverSettings?.disturbanceRateMultiplier || 1.5}
                   onChange={(e) => onUpdate({ 
                     sleepoverSettings: { ...template.sleepoverSettings, disturbanceRateMultiplier: parseFloat(e.target.value) || 1.5 } 
                   })}
                   min={1}
                   max={3}
                   step={0.25}
                 />
               </div>
             </div>
           </CollapsibleContent>
         </Collapsible>
       )}
 
       {/* Broken/Split Shift Settings */}
       {shiftType === 'broken' && (
         <Collapsible open={brokenOpen} onOpenChange={setBrokenOpen} className="rounded-lg border border-border bg-muted/30">
           <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-sm font-medium">
             <div className="flex items-center gap-2">
               <ArrowLeftRight size={14} className="text-primary" />
               <span>Split Shift Settings</span>
             </div>
             <ChevronDown size={16} className={cn("transition-transform", brokenOpen && "rotate-180")} />
           </CollapsibleTrigger>
           <CollapsibleContent className="px-3 pb-3 space-y-4">
             {/* Shift Times */}
             <div className="grid grid-cols-2 gap-3">
               <div className="space-y-1.5">
                 <Label className="text-xs text-muted-foreground">First Shift Ends</Label>
                 <Input
                   type="time"
                   value={template.brokenShiftSettings?.firstShiftEnd || '11:00'}
                   onChange={(e) => onUpdate({ 
                     brokenShiftSettings: { ...template.brokenShiftSettings, firstShiftEnd: e.target.value } 
                   })}
                 />
               </div>
               <div className="space-y-1.5">
                 <Label className="text-xs text-muted-foreground">Second Shift Starts</Label>
                 <Input
                   type="time"
                   value={template.brokenShiftSettings?.secondShiftStart || '15:00'}
                   onChange={(e) => onUpdate({ 
                     brokenShiftSettings: { ...template.brokenShiftSettings, secondShiftStart: e.target.value } 
                   })}
                 />
               </div>
             </div>
             <div className="space-y-1.5">
               <Label className="text-xs text-muted-foreground">Unpaid Gap (minutes)</Label>
               <Input
                 type="number"
                 value={template.brokenShiftSettings?.unpaidGapMinutes || 240}
                 onChange={(e) => onUpdate({ 
                   brokenShiftSettings: { ...template.brokenShiftSettings, unpaidGapMinutes: parseInt(e.target.value) || 0 } 
                 })}
                 min={60}
                 max={600}
               />
             </div>
             
             {/* Allowance Pay */}
             <p className="text-xs font-medium text-muted-foreground pt-2">Broken Shift Allowance</p>
             <div className="grid grid-cols-2 gap-3">
               <div className="space-y-1.5">
                 <Label className="text-xs text-muted-foreground">Allowance Rate ($)</Label>
                 <Input
                   type="number"
                   value={template.brokenShiftSettings?.allowanceRate || 18.46}
                   onChange={(e) => onUpdate({ 
                     brokenShiftSettings: { ...template.brokenShiftSettings, allowanceRate: parseFloat(e.target.value) || 0 } 
                   })}
                   min={0}
                   step={0.01}
                 />
               </div>
               <div className="space-y-1.5">
                 <Label className="text-xs text-muted-foreground">Gap Bonus Rate ($)</Label>
                 <Input
                   type="number"
                   value={template.brokenShiftSettings?.gapBonusRate || ''}
                   onChange={(e) => onUpdate({ 
                     brokenShiftSettings: { ...template.brokenShiftSettings, gapBonusRate: parseFloat(e.target.value) || undefined } 
                   })}
                   placeholder="Per hour over min gap"
                   min={0}
                   step={0.01}
                 />
               </div>
             </div>
             <div className="grid grid-cols-2 gap-3">
               <div className="space-y-1.5">
                 <Label className="text-xs text-muted-foreground">Min Gap (minutes)</Label>
                 <Input
                   type="number"
                   value={template.brokenShiftSettings?.minimumGapMinutes || 60}
                   onChange={(e) => onUpdate({ 
                     brokenShiftSettings: { ...template.brokenShiftSettings, minimumGapMinutes: parseInt(e.target.value) || 60 } 
                   })}
                   min={30}
                   max={240}
                 />
               </div>
               <div className="space-y-1.5">
                 <Label className="text-xs text-muted-foreground">Max Gap (minutes)</Label>
                 <Input
                   type="number"
                   value={template.brokenShiftSettings?.maximumGapMinutes || ''}
                   onChange={(e) => onUpdate({ 
                     brokenShiftSettings: { ...template.brokenShiftSettings, maximumGapMinutes: parseInt(e.target.value) || undefined } 
                   })}
                   min={60}
                   max={600}
                 />
               </div>
             </div>
           </CollapsibleContent>
         </Collapsible>
       )}
 
       {/* Additional Allowances */}
       <Collapsible open={additionalOpen} onOpenChange={setAdditionalOpen} className="rounded-lg border border-border bg-muted/30">
         <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-sm font-medium">
           <div className="flex items-center gap-2">
             <TrendingUp size={14} className="text-primary" />
             <span>Additional Allowances</span>
           </div>
           <ChevronDown size={16} className={cn("transition-transform", additionalOpen && "rotate-180")} />
         </CollapsibleTrigger>
         <CollapsibleContent className="px-3 pb-3 space-y-4">
           {/* Prebuilt Allowances */}
           <div className="space-y-1.5">
             <Label className="text-xs text-muted-foreground">Select Allowances</Label>
             <AllowanceDropdownWithCreate
               selectedAllowances={template.selectedAllowances || []}
               onAllowancesChange={(allowances) => onUpdate({ selectedAllowances: allowances })}
               customAllowances={customAllowances}
               onCreateAllowance={onCreateAllowance}
             />
           </div>
 
           <div className="space-y-1.5">
             <Label className="text-xs text-muted-foreground">Higher Duties Classification</Label>
             <Input
               value={template.higherDutiesClassification || ''}
               onChange={(e) => onUpdate({ higherDutiesClassification: e.target.value || undefined })}
               placeholder="e.g. Level 4.1"
             />
             <p className="text-xs text-muted-foreground">If this shift involves higher duties</p>
           </div>
           
           <div className="flex items-center gap-3">
             <Switch
               checked={template.isRemoteLocation || false}
               onCheckedChange={(checked) => onUpdate({ isRemoteLocation: checked })}
             />
             <div className="flex items-center gap-2">
               <Car size={14} className="text-muted-foreground" />
               <span className="text-sm">Remote Location</span>
             </div>
           </div>
           
           {template.isRemoteLocation && (
             <div className="space-y-1.5">
               <Label className="text-xs text-muted-foreground">Default Travel (km)</Label>
               <Input
                 type="number"
                 value={template.defaultTravelKilometres || ''}
                 onChange={(e) => onUpdate({ defaultTravelKilometres: parseInt(e.target.value) || undefined })}
                 placeholder="e.g. 50"
                 min={0}
                 max={500}
               />
             </div>
           )}
         </CollapsibleContent>
       </Collapsible>
     </div>
   );
 }