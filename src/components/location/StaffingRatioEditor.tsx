 import React, { useState } from 'react';
 import { Plus, Trash2, Edit2, Save, X, Users } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Badge } from '@/components/ui/badge';
 import { Label } from '@/components/ui/label';
 import { Switch } from '@/components/ui/switch';
 import { Textarea } from '@/components/ui/textarea';
 import { StaffingRatio } from '@/types/location';
 
 interface StaffingRatioEditorProps {
   ratios: StaffingRatio[];
   onUpdate: (ratios: StaffingRatio[]) => void;
   isEditing: boolean;
   demandUnit?: string;
 }
 
 const StaffingRatioEditor: React.FC<StaffingRatioEditorProps> = ({
   ratios,
   onUpdate,
   isEditing,
   demandUnit = 'Units',
 }) => {
   const [editingRatioId, setEditingRatioId] = useState<string | null>(null);
   const [showAddForm, setShowAddForm] = useState(false);
   const [formData, setFormData] = useState<Partial<StaffingRatio>>({
     name: '',
     demandUnit: demandUnit,
     ratioNumerator: 1,
     ratioDenominator: 4,
     isDefault: false,
     notes: '',
   });
 
   const handleAddRatio = () => {
     const newRatio: StaffingRatio = {
       id: `ratio-${Date.now()}`,
       name: formData.name || 'New Ratio',
       demandUnit: formData.demandUnit || demandUnit,
       ratioNumerator: formData.ratioNumerator || 1,
       ratioDenominator: formData.ratioDenominator || 4,
       isDefault: formData.isDefault || false,
       notes: formData.notes,
     };
     
     let updatedRatios = [...ratios];
     if (newRatio.isDefault) {
       updatedRatios = updatedRatios.map(r => ({ ...r, isDefault: false }));
     }
     
     onUpdate([...updatedRatios, newRatio]);
     setShowAddForm(false);
     resetForm();
   };
 
   const handleUpdateRatio = (ratioId: string) => {
     let updatedRatios = ratios.map(r => {
       if (r.id === ratioId) {
         return {
           ...r,
           name: formData.name || r.name,
           demandUnit: formData.demandUnit || r.demandUnit,
           ratioNumerator: formData.ratioNumerator ?? r.ratioNumerator,
           ratioDenominator: formData.ratioDenominator ?? r.ratioDenominator,
           isDefault: formData.isDefault ?? r.isDefault,
           notes: formData.notes,
         };
       }
       return r;
     });
     
     if (formData.isDefault) {
       updatedRatios = updatedRatios.map(r => 
         r.id === ratioId ? r : { ...r, isDefault: false }
       );
     }
     
     onUpdate(updatedRatios);
     setEditingRatioId(null);
     resetForm();
   };
 
   const handleDeleteRatio = (ratioId: string) => {
     onUpdate(ratios.filter(r => r.id !== ratioId));
   };
 
   const startEditing = (ratio: StaffingRatio) => {
     setEditingRatioId(ratio.id);
     setFormData({
       name: ratio.name,
       demandUnit: ratio.demandUnit,
       ratioNumerator: ratio.ratioNumerator,
       ratioDenominator: ratio.ratioDenominator,
       isDefault: ratio.isDefault,
       notes: ratio.notes,
     });
   };
 
   const resetForm = () => {
     setFormData({
       name: '',
       demandUnit: demandUnit,
       ratioNumerator: 1,
       ratioDenominator: 4,
       isDefault: false,
       notes: '',
     });
   };
 
   const RatioForm = ({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) => (
     <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-4">
       <div className="grid grid-cols-2 gap-4">
         <div className="space-y-2">
           <Label>Ratio Name</Label>
           <Input
             value={formData.name}
             onChange={(e) => setFormData({ ...formData, name: e.target.value })}
             placeholder="e.g., Standard, Peak Hours"
           />
         </div>
         <div className="space-y-2">
           <Label>Demand Unit</Label>
           <Input
             value={formData.demandUnit}
             onChange={(e) => setFormData({ ...formData, demandUnit: e.target.value })}
             placeholder="e.g., Children, Patients"
           />
         </div>
       </div>
       
       <div className="grid grid-cols-3 gap-4">
         <div className="space-y-2">
           <Label>Staff (Numerator)</Label>
           <Input
             type="number"
             min={1}
             value={formData.ratioNumerator}
             onChange={(e) => setFormData({ ...formData, ratioNumerator: parseInt(e.target.value) || 1 })}
           />
         </div>
         <div className="space-y-2">
           <Label>{formData.demandUnit || 'Units'} (Denominator)</Label>
           <Input
             type="number"
             min={1}
             value={formData.ratioDenominator}
             onChange={(e) => setFormData({ ...formData, ratioDenominator: parseInt(e.target.value) || 1 })}
           />
         </div>
         <div className="space-y-2">
           <Label>Ratio Preview</Label>
           <div className="h-9 flex items-center">
             <Badge variant="outline" className="text-lg font-bold">
               {formData.ratioNumerator}:{formData.ratioDenominator}
             </Badge>
           </div>
         </div>
       </div>
       
       <div className="space-y-2">
         <Label>Notes (Optional)</Label>
         <Textarea
           value={formData.notes || ''}
           onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
           placeholder="Regulatory reference or special conditions"
           rows={2}
         />
       </div>
       
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-2">
           <Switch
             checked={formData.isDefault}
             onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
           />
           <Label>Set as default ratio</Label>
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
           <h3 className="text-sm font-semibold text-foreground">Staffing Ratios</h3>
           <p className="text-xs text-muted-foreground">Configure staff-to-demand ratios for compliance</p>
         </div>
         {isEditing && !showAddForm && (
           <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)}>
             <Plus className="h-4 w-4 mr-2" />
             Add Ratio
           </Button>
         )}
       </div>
 
       {showAddForm && (
         <RatioForm onSave={handleAddRatio} onCancel={() => { setShowAddForm(false); resetForm(); }} />
       )}
 
       {ratios.length > 0 ? (
         <div className="space-y-3">
           {ratios.map((ratio) => (
             <div key={ratio.id}>
               {editingRatioId === ratio.id ? (
                 <RatioForm 
                   onSave={() => handleUpdateRatio(ratio.id)} 
                   onCancel={() => { setEditingRatioId(null); resetForm(); }} 
                 />
               ) : (
                 <div className="bg-card border border-border rounded-lg p-4">
                   <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-2">
                       <h4 className="font-medium">{ratio.name}</h4>
                       {ratio.isDefault && (
                         <Badge variant="secondary" className="text-xs">Default</Badge>
                       )}
                     </div>
                     <div className="flex items-center gap-2">
                       <Badge variant="outline" className="text-lg font-bold">
                         {ratio.ratioNumerator}:{ratio.ratioDenominator}
                       </Badge>
                       {isEditing && (
                         <>
                           <Button variant="ghost" size="sm" onClick={() => startEditing(ratio)}>
                             <Edit2 className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="sm" onClick={() => handleDeleteRatio(ratio.id)}>
                             <Trash2 className="h-4 w-4 text-destructive" />
                           </Button>
                         </>
                       )}
                     </div>
                   </div>
                   <p className="text-xs text-muted-foreground">
                     {ratio.ratioNumerator} staff per {ratio.ratioDenominator} {ratio.demandUnit.toLowerCase()}
                   </p>
                   {ratio.notes && (
                     <p className="text-xs text-muted-foreground mt-2 italic">{ratio.notes}</p>
                   )}
                 </div>
               )}
             </div>
           ))}
         </div>
       ) : !showAddForm && (
         <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed border-border">
           <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
           <p className="text-sm text-muted-foreground">No staffing ratios configured</p>
           {isEditing && (
             <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowAddForm(true)}>
               <Plus className="h-4 w-4 mr-2" />
               Add First Ratio
             </Button>
           )}
         </div>
       )}
     </div>
   );
 };
 
 export default StaffingRatioEditor;