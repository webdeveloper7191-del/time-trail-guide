 import React, { useState } from 'react';
 import { Plus, Trash2, Edit2, Save, X, Combine, AlertCircle } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Badge } from '@/components/ui/badge';
 import { Label } from '@/components/ui/label';
 import { Switch } from '@/components/ui/switch';
 import { Textarea } from '@/components/ui/textarea';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { AreaCombiningThreshold } from '@/types/location';
 
 interface AreaCombiningEditorProps {
   thresholds: AreaCombiningThreshold[];
   onUpdate: (thresholds: AreaCombiningThreshold[]) => void;
   isEditing: boolean;
 }
 
 const TRIGGER_TYPES = [
   { value: 'attendance_percentage', label: 'Attendance Percentage', unit: '%', description: 'When area attendance falls below this % of capacity' },
   { value: 'absolute_count', label: 'Absolute Count', unit: '', description: 'When area attendance is below this number' },
   { value: 'staff_ratio', label: 'Staff Ratio Inefficiency', unit: '%', description: 'When staff utilization falls below this %' },
 ];
 
 const AreaCombiningEditor: React.FC<AreaCombiningEditorProps> = ({
   thresholds,
   onUpdate,
   isEditing,
 }) => {
   const [editingId, setEditingId] = useState<string | null>(null);
   const [showAddForm, setShowAddForm] = useState(false);
   const [formData, setFormData] = useState<Partial<AreaCombiningThreshold>>({
     name: '',
     description: '',
     triggerType: 'attendance_percentage',
     triggerValue: 50,
     isActive: true,
     promptMessage: '',
   });
 
   const handleAdd = () => {
     const newThreshold: AreaCombiningThreshold = {
       id: `threshold-${Date.now()}`,
       name: formData.name || 'New Threshold',
       description: formData.description,
       triggerType: formData.triggerType || 'attendance_percentage',
       triggerValue: formData.triggerValue || 50,
       isActive: formData.isActive ?? true,
       promptMessage: formData.promptMessage,
     };
     onUpdate([...thresholds, newThreshold]);
     setShowAddForm(false);
     resetForm();
   };
 
   const handleUpdate = (id: string) => {
     const updated = thresholds.map(t => {
       if (t.id === id) {
         return {
           ...t,
           name: formData.name || t.name,
           description: formData.description,
           triggerType: formData.triggerType || t.triggerType,
           triggerValue: formData.triggerValue ?? t.triggerValue,
           isActive: formData.isActive ?? t.isActive,
           promptMessage: formData.promptMessage,
         };
       }
       return t;
     });
     onUpdate(updated);
     setEditingId(null);
     resetForm();
   };
 
   const handleDelete = (id: string) => {
     onUpdate(thresholds.filter(t => t.id !== id));
   };
 
   const startEditing = (threshold: AreaCombiningThreshold) => {
     setEditingId(threshold.id);
     setFormData({
       name: threshold.name,
       description: threshold.description,
       triggerType: threshold.triggerType,
       triggerValue: threshold.triggerValue,
       isActive: threshold.isActive,
       promptMessage: threshold.promptMessage,
     });
   };
 
   const resetForm = () => {
     setFormData({
       name: '',
       description: '',
       triggerType: 'attendance_percentage',
       triggerValue: 50,
       isActive: true,
       promptMessage: '',
     });
   };
 
   const getTriggerTypeInfo = (type: string) => TRIGGER_TYPES.find(t => t.value === type);
 
   const ThresholdForm = ({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) => (
     <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-4">
       <div className="grid grid-cols-2 gap-4">
         <div className="space-y-2">
           <Label>Threshold Name</Label>
           <Input
             value={formData.name}
             onChange={(e) => setFormData({ ...formData, name: e.target.value })}
             placeholder="e.g., Low Attendance Combine"
           />
         </div>
         <div className="space-y-2">
           <Label>Trigger Type</Label>
           <Select
             value={formData.triggerType}
             onValueChange={(v) => setFormData({ ...formData, triggerType: v as AreaCombiningThreshold['triggerType'] })}
           >
             <SelectTrigger>
               <SelectValue />
             </SelectTrigger>
             <SelectContent>
               {TRIGGER_TYPES.map(t => (
                 <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>
       </div>
 
       <div className="space-y-2">
         <Label>Trigger Value {getTriggerTypeInfo(formData.triggerType || 'attendance_percentage')?.unit}</Label>
         <Input
           type="number"
           min={0}
           max={formData.triggerType === 'attendance_percentage' || formData.triggerType === 'staff_ratio' ? 100 : undefined}
           value={formData.triggerValue}
           onChange={(e) => setFormData({ ...formData, triggerValue: parseInt(e.target.value) || 0 })}
         />
         <p className="text-xs text-muted-foreground">
           {getTriggerTypeInfo(formData.triggerType || 'attendance_percentage')?.description}
         </p>
       </div>
 
       <div className="space-y-2">
         <Label>Prompt Message (Optional)</Label>
         <Textarea
           value={formData.promptMessage || ''}
           onChange={(e) => setFormData({ ...formData, promptMessage: e.target.value })}
           placeholder="Custom message to show roster manager when this threshold is triggered"
           rows={2}
         />
       </div>
 
       <div className="space-y-2">
         <Label>Description (Optional)</Label>
         <Textarea
           value={formData.description || ''}
           onChange={(e) => setFormData({ ...formData, description: e.target.value })}
           placeholder="Explain when this threshold applies"
           rows={2}
         />
       </div>
 
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-2">
           <Switch
             checked={formData.isActive}
             onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
           />
           <Label>Active</Label>
         </div>
         <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={onCancel}>
             <X className="h-4 w-4 mr-1" /> Cancel
           </Button>
           <Button size="sm" onClick={onSave}>
             <Save className="h-4 w-4 mr-1" /> Save
           </Button>
         </div>
       </div>
     </div>
   );
 
   return (
     <div className="space-y-4">
       <div className="flex items-center justify-between">
         <div>
           <h3 className="text-sm font-semibold text-foreground">Area Combining Thresholds</h3>
           <p className="text-xs text-muted-foreground">Configure when to prompt roster managers to combine areas</p>
         </div>
         {isEditing && !showAddForm && (
           <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)}>
             <Plus className="h-4 w-4 mr-2" />
             Add Threshold
           </Button>
         )}
       </div>
 
       {showAddForm && (
         <ThresholdForm onSave={handleAdd} onCancel={() => { setShowAddForm(false); resetForm(); }} />
       )}
 
       {thresholds.length > 0 ? (
         <div className="space-y-3">
           {thresholds.map((threshold) => (
             <div key={threshold.id}>
               {editingId === threshold.id ? (
                 <ThresholdForm
                   onSave={() => handleUpdate(threshold.id)}
                   onCancel={() => { setEditingId(null); resetForm(); }}
                 />
               ) : (
                 <div className="bg-card border border-border rounded-lg p-4">
                   <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-2">
                       <h4 className="font-medium">{threshold.name}</h4>
                       <Badge variant={threshold.isActive ? 'default' : 'secondary'} className="text-xs">
                         {threshold.isActive ? 'Active' : 'Inactive'}
                       </Badge>
                     </div>
                     <div className="flex items-center gap-2">
                       <Badge variant="outline" className="text-sm">
                         {getTriggerTypeInfo(threshold.triggerType)?.label}: {threshold.triggerValue}{getTriggerTypeInfo(threshold.triggerType)?.unit}
                       </Badge>
                       {isEditing && (
                         <>
                           <Button variant="ghost" size="sm" onClick={() => startEditing(threshold)}>
                             <Edit2 className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="sm" onClick={() => handleDelete(threshold.id)}>
                             <Trash2 className="h-4 w-4 text-destructive" />
                           </Button>
                         </>
                       )}
                     </div>
                   </div>
                   {threshold.description && (
                     <p className="text-xs text-muted-foreground">{threshold.description}</p>
                   )}
                   {threshold.promptMessage && (
                     <div className="mt-2 p-2 bg-warning/10 rounded text-xs text-warning-foreground flex items-start gap-2">
                       <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                       <span>{threshold.promptMessage}</span>
                     </div>
                   )}
                 </div>
               )}
             </div>
           ))}
         </div>
       ) : !showAddForm && (
         <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed border-border">
           <Combine className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
           <p className="text-sm text-muted-foreground">No area combining thresholds configured</p>
           {isEditing && (
             <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowAddForm(true)}>
               <Plus className="h-4 w-4 mr-2" />
               Add First Threshold
             </Button>
           )}
         </div>
       )}
     </div>
   );
 };
 
 export default AreaCombiningEditor;