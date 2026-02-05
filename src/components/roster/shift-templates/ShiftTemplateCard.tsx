 import { ShiftTemplate, ShiftSpecialType, QualificationType, StaffMember, shiftTypeLabels, qualificationLabels, roleLabels } from '@/types/roster';
 import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Clock, Edit2, Trash2, Check, X, GraduationCap, Award, RotateCcw, Phone, Moon, ArrowLeftRight, Zap, AlertTriangle } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { ShiftTypeSettings } from './ShiftTypeSettings';
 import { AllowanceType } from '@/types/allowances';
 import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
 
 const shiftTypeIcons: Record<ShiftSpecialType, React.ReactNode> = {
   regular: <Clock size={12} />,
   on_call: <Phone size={12} />,
   sleepover: <Moon size={12} />,
   broken: <ArrowLeftRight size={12} />,
   recall: <AlertTriangle size={12} />,
   emergency: <Zap size={12} />,
 };
 
 const colorOptions = [
   'hsl(200, 70%, 50%)',
   'hsl(150, 60%, 45%)',
   'hsl(280, 60%, 50%)',
   'hsl(30, 70%, 50%)',
   'hsl(340, 65%, 50%)',
   'hsl(220, 70%, 55%)',
   'hsl(45, 80%, 45%)',
   'hsl(180, 55%, 45%)',
 ];
 
 const classificationLevels = [
   'Level 2.1', 'Level 2.2', 'Level 2.3',
   'Level 3.1', 'Level 3.2', 'Level 3.3',
   'Level 4.1', 'Level 4.2', 'Level 4.3',
   'Level 5.1', 'Level 5.2', 'Level 5.3',
   'Level 6.1', 'Level 6.2', 'Level 6.3',
 ];
 
 interface ShiftTemplateCardProps {
   template: ShiftTemplate;
   isEditing: boolean;
   isDefault: boolean;
   hasChanged: boolean;
   onEdit: () => void;
   onCancelEdit: () => void;
   onUpdate: (updates: Partial<ShiftTemplate>) => void;
   onDelete: () => void;
   customAllowances: AllowanceType[];
   onCreateAllowance: (allowance: AllowanceType) => void;
 }
 
 export function ShiftTemplateCard({
   template,
   isEditing,
   isDefault,
   hasChanged,
   onEdit,
   onCancelEdit,
   onUpdate,
   onDelete,
   customAllowances,
   onCreateAllowance,
 }: ShiftTemplateCardProps) {
   const calculateDuration = (start: string, end: string, breakMins: number) => {
     const [startH, startM] = start.split(':').map(Number);
     const [endH, endM] = end.split(':').map(Number);
     let totalMins = (endH * 60 + endM) - (startH * 60 + startM);
     if (totalMins < 0) totalMins += 24 * 60;
     totalMins -= breakMins;
     return (totalMins / 60).toFixed(1);
   };
 
   if (isEditing) {
     return (
       <div className={cn("p-4 rounded-lg border-2 border-primary bg-background")}>
         <Tabs defaultValue="basic" className="w-full">
           <TabsList className="grid w-full grid-cols-4 mb-4">
             <TabsTrigger value="basic">Basic</TabsTrigger>
             <TabsTrigger value="requirements">Requirements</TabsTrigger>
             <TabsTrigger value="type">Shift Type</TabsTrigger>
             <TabsTrigger value="appearance">Appearance</TabsTrigger>
           </TabsList>
 
           <TabsContent value="basic" className="space-y-4">
             <div className="space-y-1.5">
               <Label className="text-sm font-medium text-primary">Template Name</Label>
               <Input
                 value={template.name}
                 onChange={(e) => onUpdate({ name: e.target.value })}
               />
             </div>
             
             <div className="grid grid-cols-3 gap-3">
               <div className="space-y-1.5">
                 <Label className="text-xs text-muted-foreground">Start Time</Label>
                 <Input
                   type="time"
                   value={template.startTime}
                   onChange={(e) => onUpdate({ startTime: e.target.value })}
                 />
               </div>
               <div className="space-y-1.5">
                 <Label className="text-xs text-muted-foreground">End Time</Label>
                 <Input
                   type="time"
                   value={template.endTime}
                   onChange={(e) => onUpdate({ endTime: e.target.value })}
                 />
               </div>
               <div className="space-y-1.5">
                 <Label className="text-xs text-muted-foreground">Break (min)</Label>
                 <Input
                   type="number"
                   value={template.breakMinutes}
                   onChange={(e) => onUpdate({ breakMinutes: parseInt(e.target.value) || 0 })}
                   min={0}
                   max={120}
                 />
               </div>
             </div>
           </TabsContent>
 
           <TabsContent value="requirements" className="space-y-4">
             {/* Qualifications */}
             <div className="space-y-1.5">
               <Label className="text-sm font-medium text-primary flex items-center gap-1.5">
                 <GraduationCap size={14} />
                 Required Qualifications
               </Label>
               <Select
                 value={template.requiredQualifications?.join(',') || ''}
                 onValueChange={(v) => onUpdate({ 
                   requiredQualifications: v ? v.split(',') as QualificationType[] : [] 
                 })}
               >
                 <SelectTrigger>
               <SelectValue placeholder={
                     template.requiredQualifications?.length 
                       ? `${template.requiredQualifications.length} selected`
                       : 'No requirements'
                   } />
                 </SelectTrigger>
                 <SelectContent>
                   {(Object.keys(qualificationLabels) as QualificationType[]).map((qual) => (
                     <SelectItem key={qual} value={qual}>
                       {qualificationLabels[qual]}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
               <p className="text-xs text-muted-foreground">Staff must have all selected qualifications</p>
             </div>
 
             {/* Classification Level */}
             <div className="space-y-1.5">
               <Label className="text-sm font-medium text-primary flex items-center gap-1.5">
                 <Award size={14} />
                 Minimum Classification
               </Label>
               <Select
                 value={template.minimumClassification || 'none'}
                 onValueChange={(v) => onUpdate({ 
                   minimumClassification: v === 'none' ? undefined : v 
                 })}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="No minimum" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="none">No minimum</SelectItem>
                   {classificationLevels.map((level) => (
                     <SelectItem key={level} value={level}>{level}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
 
             {/* Preferred Role */}
             <div className="space-y-1.5">
               <Label className="text-sm font-medium text-primary">Preferred Role</Label>
               <Select
                 value={template.preferredRole || 'none'}
                 onValueChange={(v) => onUpdate({ 
                   preferredRole: v === 'none' ? undefined : v as StaffMember['role']
                 })}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="Any role" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="none">Any role</SelectItem>
                   {(Object.keys(roleLabels) as StaffMember['role'][]).map((role) => (
                     <SelectItem key={role} value={role}>{roleLabels[role]}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           </TabsContent>
 
           <TabsContent value="type">
             <ShiftTypeSettings
               template={template}
               onUpdate={onUpdate}
               customAllowances={customAllowances}
               onCreateAllowance={onCreateAllowance}
             />
           </TabsContent>
 
           <TabsContent value="appearance">
             <div className="space-y-1.5">
               <Label className="text-sm font-medium text-primary">Color</Label>
               <div className="flex gap-2 flex-wrap">
                 {colorOptions.map(color => (
                   <button
                     key={color}
                     type="button"
                     onClick={() => onUpdate({ color })}
                     className={cn(
                       "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                       template.color === color ? "border-foreground" : "border-transparent"
                     )}
                     style={{ backgroundColor: color }}
                   />
                 ))}
               </div>
             </div>
           </TabsContent>
         </Tabs>
         
         {/* Actions */}
         <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-border">
           <Button variant="outline" size="sm" onClick={onCancelEdit}>
             <X size={14} className="mr-1" />
             Cancel
           </Button>
           <Button size="sm" onClick={onCancelEdit}>
             <Check size={14} className="mr-1" />
             Done
           </Button>
         </div>
       </div>
     );
   }
 
   // Display mode
   return (
     <div className="p-3 rounded-lg border border-border bg-background flex items-center gap-3">
       <div className="h-5 w-5 rounded-full flex-shrink-0" style={{ backgroundColor: template.color }} />
       <div className="flex-1 min-w-0">
         <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
           <span className="text-sm font-medium">{template.name}</span>
           {template.shiftType && template.shiftType !== 'regular' && (
             <Badge variant="outline" className="text-xs gap-1">
               {shiftTypeIcons[template.shiftType]}
               {shiftTypeLabels[template.shiftType]}
             </Badge>
           )}
           {isDefault && (
             <Badge variant={hasChanged ? "destructive" : "outline"} className="text-xs">
               {hasChanged ? "Modified" : "Default"}
             </Badge>
           )}
           {template.requiredQualifications && template.requiredQualifications.length > 0 && (
             <Badge variant="secondary" className="text-xs gap-1">
               <GraduationCap size={10} />
               {template.requiredQualifications.length} qual{template.requiredQualifications.length > 1 ? 's' : ''}
             </Badge>
           )}
           {template.minimumClassification && (
             <Badge variant="secondary" className="text-xs gap-1">
               <Award size={10} />
               {template.minimumClassification}
             </Badge>
           )}
         </div>
         <p className="text-xs text-muted-foreground">
           {template.startTime} - {template.endTime} • {template.breakMinutes}min break
           {template.preferredRole && ` • ${roleLabels[template.preferredRole]}`}
           {template.higherDutiesClassification && ` • HD: ${template.higherDutiesClassification}`}
           {template.isRemoteLocation && ` • Remote`}
         </p>
       </div>
       <Badge variant="outline" className="text-xs">
         {calculateDuration(template.startTime, template.endTime, template.breakMinutes)}h
       </Badge>
       <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
         <Edit2 size={14} />
       </Button>
       {isDefault ? (
         <TooltipProvider>
           <Tooltip>
             <TooltipTrigger asChild>
               <Button 
                 variant="ghost" 
                 size="icon" 
                 className="h-8 w-8 text-warning" 
                 onClick={onDelete}
                 disabled={!hasChanged}
               >
                 <RotateCcw size={14} />
               </Button>
             </TooltipTrigger>
             <TooltipContent>Reset to default</TooltipContent>
           </Tooltip>
         </TooltipProvider>
       ) : (
         <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
           <Trash2 size={14} />
         </Button>
       )}
     </div>
   );
 }