 import React, { useState } from 'react';
 import { Plus, Trash2, Edit2, Save, X, Shield } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Badge } from '@/components/ui/badge';
 import { Label } from '@/components/ui/label';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
 import { QualificationRequirement } from '@/types/location';
 
 interface QualificationRequirementEditorProps {
   requirements: QualificationRequirement[];
   onUpdate: (requirements: QualificationRequirement[]) => void;
   isEditing: boolean;
 }
 
 const PRESET_QUALIFICATIONS = [
   { id: 'first_aid', name: 'First Aid Certificate', shortName: 'First Aid' },
   { id: 'cpr', name: 'CPR Certification', shortName: 'CPR' },
   { id: 'wwc', name: 'Working with Children Check', shortName: 'WWC' },
   { id: 'police_check', name: 'Police Check', shortName: 'Police' },
   { id: 'diploma_ece', name: 'Diploma in Early Childhood Education', shortName: 'Diploma ECE' },
   { id: 'bachelor_ece', name: 'Bachelor of Early Childhood Education', shortName: 'Bachelor ECE' },
   { id: 'rn', name: 'Registered Nurse', shortName: 'RN' },
   { id: 'en', name: 'Enrolled Nurse', shortName: 'EN' },
   { id: 'food_safety', name: 'Food Safety Certificate', shortName: 'Food Safe' },
   { id: 'rsa', name: 'Responsible Service of Alcohol', shortName: 'RSA' },
   { id: 'manual_handling', name: 'Manual Handling', shortName: 'Manual' },
   { id: 'custom', name: 'Custom Qualification', shortName: 'Custom' },
 ];
 
 const QualificationRequirementEditor: React.FC<QualificationRequirementEditorProps> = ({
   requirements,
   onUpdate,
   isEditing,
 }) => {
   const [editingReqId, setEditingReqId] = useState<string | null>(null);
   const [showAddForm, setShowAddForm] = useState(false);
   const [formData, setFormData] = useState<Partial<QualificationRequirement>>({
     qualificationId: '',
     qualificationName: '',
     qualificationShortName: '',
     requirementType: 'mandatory',
     percentageRequired: 50,
     minimumCount: 1,
     notes: '',
   });
  const [quantityType, setQuantityType] = useState<'count' | 'percentage'>('count');
 
   const handleSelectPreset = (presetId: string) => {
     const preset = PRESET_QUALIFICATIONS.find(p => p.id === presetId);
     if (preset) {
       setFormData({
         ...formData,
         qualificationId: preset.id,
         qualificationName: preset.name,
         qualificationShortName: preset.shortName,
       });
     }
   };
 
   const handleAddRequirement = () => {
     const newReq: QualificationRequirement = {
       id: `qual-${Date.now()}`,
       qualificationId: formData.qualificationId || 'custom',
       qualificationName: formData.qualificationName || 'Custom Qualification',
       qualificationShortName: formData.qualificationShortName || 'Custom',
       requirementType: formData.requirementType || 'mandatory',
      percentageRequired: quantityType === 'percentage' ? formData.percentageRequired : undefined,
      minimumCount: quantityType === 'count' ? formData.minimumCount : undefined,
       notes: formData.notes,
     };
     
     onUpdate([...requirements, newReq]);
     setShowAddForm(false);
     resetForm();
   };
 
   const handleUpdateRequirement = (reqId: string) => {
     const updatedReqs = requirements.map(r => {
       if (r.id === reqId) {
         return {
           ...r,
           qualificationId: formData.qualificationId || r.qualificationId,
           qualificationName: formData.qualificationName || r.qualificationName,
           qualificationShortName: formData.qualificationShortName || r.qualificationShortName,
           requirementType: formData.requirementType || r.requirementType,
          percentageRequired: quantityType === 'percentage' ? formData.percentageRequired : undefined,
          minimumCount: quantityType === 'count' ? formData.minimumCount : undefined,
           notes: formData.notes,
         };
       }
       return r;
     });
     
     onUpdate(updatedReqs);
     setEditingReqId(null);
     resetForm();
   };
 
   const handleDeleteRequirement = (reqId: string) => {
     onUpdate(requirements.filter(r => r.id !== reqId));
   };
 
   const startEditing = (req: QualificationRequirement) => {
     setEditingReqId(req.id);
     setFormData({
       qualificationId: req.qualificationId,
       qualificationName: req.qualificationName,
       qualificationShortName: req.qualificationShortName,
       requirementType: req.requirementType,
       percentageRequired: req.percentageRequired || 50,
       minimumCount: req.minimumCount || 1,
       notes: req.notes,
     });
    setQuantityType(req.percentageRequired ? 'percentage' : 'count');
   };
 
   const resetForm = () => {
     setFormData({
       qualificationId: '',
       qualificationName: '',
       qualificationShortName: '',
       requirementType: 'mandatory',
       percentageRequired: 50,
       minimumCount: 1,
       notes: '',
     });
    setQuantityType('count');
   };
 
   const RequirementForm = ({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) => (
     <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-4">
       <div className="space-y-2">
         <Label>Select Qualification</Label>
         <Select value={formData.qualificationId} onValueChange={handleSelectPreset}>
           <SelectTrigger>
             <SelectValue placeholder="Choose a qualification type" />
           </SelectTrigger>
           <SelectContent>
             {PRESET_QUALIFICATIONS.map(preset => (
               <SelectItem key={preset.id} value={preset.id}>{preset.name}</SelectItem>
             ))}
           </SelectContent>
         </Select>
       </div>
       
       {formData.qualificationId === 'custom' && (
         <div className="grid grid-cols-2 gap-4">
           <div className="space-y-2">
             <Label>Qualification Name</Label>
             <Input
               value={formData.qualificationName}
               onChange={(e) => setFormData({ ...formData, qualificationName: e.target.value })}
               placeholder="Full qualification name"
             />
           </div>
           <div className="space-y-2">
             <Label>Short Name</Label>
             <Input
               value={formData.qualificationShortName}
               onChange={(e) => setFormData({ ...formData, qualificationShortName: e.target.value })}
               placeholder="e.g., Cert III"
             />
           </div>
         </div>
       )}
       
      <div className="space-y-2">
        <Label>Requirement Type</Label>
        <Select 
          value={formData.requirementType} 
          onValueChange={(v) => setFormData({ ...formData, requirementType: v as QualificationRequirement['requirementType'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mandatory">Mandatory</SelectItem>
            <SelectItem value="percentage">Percentage Required</SelectItem>
            <SelectItem value="preferred">Preferred</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <h4 className="text-sm font-medium text-foreground">Quantity Required</h4>
        <RadioGroup 
          value={quantityType} 
          onValueChange={(v) => setQuantityType(v as 'count' | 'percentage')}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="count" id="count" />
            <Label htmlFor="count" className="cursor-pointer">Minimum Count</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="percentage" id="percentage" />
            <Label htmlFor="percentage" className="cursor-pointer">Percentage of Staff</Label>
          </div>
        </RadioGroup>
        
        {quantityType === 'count' ? (
          <div className="space-y-2">
            <Label>Minimum Staff Required</Label>
            <Input
              type="number"
              min={1}
              value={formData.minimumCount}
              onChange={(e) => setFormData({ ...formData, minimumCount: parseInt(e.target.value) || 1 })}
              placeholder="e.g., 2"
            />
            <p className="text-xs text-muted-foreground">
              At least {formData.minimumCount} staff member(s) must hold this qualification
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Percentage of Staff Required</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={100}
                value={formData.percentageRequired}
                onChange={(e) => setFormData({ ...formData, percentageRequired: parseInt(e.target.value) || 50 })}
                placeholder="e.g., 50"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {formData.percentageRequired}% of rostered staff must hold this qualification
            </p>
          </div>
        )}
       </div>
       
       <div className="space-y-2">
         <Label>Notes (Optional)</Label>
         <Textarea
           value={formData.notes || ''}
           onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
           placeholder="Additional requirements or exemptions"
           rows={2}
         />
       </div>
       
       <div className="flex items-center justify-end gap-2">
         <Button variant="outline" size="sm" onClick={onCancel}>
           <X className="h-4 w-4 mr-1" /> Cancel
         </Button>
         <Button size="sm" onClick={onSave} disabled={!formData.qualificationId}>
           <Save className="h-4 w-4 mr-1" /> Save
         </Button>
       </div>
     </div>
   );
 
   const getRequirementBadge = (req: QualificationRequirement) => {
     switch (req.requirementType) {
       case 'mandatory':
        return <Badge className="bg-destructive text-destructive-foreground text-xs">Mandatory</Badge>;
       case 'percentage':
        return <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">{req.percentageRequired}% Required</Badge>;
       case 'preferred':
         return <Badge variant="outline" className="text-xs">Preferred</Badge>;
     }
   };
 
  const getQuantityBadge = (req: QualificationRequirement) => {
    if (req.minimumCount) {
      return <Badge variant="secondary" className="text-xs">Min: {req.minimumCount}</Badge>;
    }
    if (req.percentageRequired) {
      return <Badge variant="secondary" className="text-xs">{req.percentageRequired}%</Badge>;
    }
    return null;
  };

   return (
     <div className="space-y-4">
       <div className="flex items-center justify-between">
         <div>
           <h3 className="text-sm font-semibold text-foreground">Qualification Requirements</h3>
           <p className="text-xs text-muted-foreground">Define required qualifications for compliance</p>
         </div>
         {isEditing && !showAddForm && (
           <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)}>
             <Plus className="h-4 w-4 mr-2" />
             Add Requirement
           </Button>
         )}
       </div>
 
       {showAddForm && (
         <RequirementForm onSave={handleAddRequirement} onCancel={() => { setShowAddForm(false); resetForm(); }} />
       )}
 
       {requirements.length > 0 ? (
         <div className="space-y-3">
           {requirements.map((req) => (
             <div key={req.id}>
               {editingReqId === req.id ? (
                 <RequirementForm 
                   onSave={() => handleUpdateRequirement(req.id)} 
                   onCancel={() => { setEditingReqId(null); resetForm(); }} 
                 />
               ) : (
                 <div className="bg-card border border-border rounded-lg p-4">
                   <div className="flex items-center justify-between">
                     <div>
                       <div className="flex items-center gap-2 mb-1">
                         <h4 className="font-medium">{req.qualificationName}</h4>
                         {getRequirementBadge(req)}
                        {getQuantityBadge(req)}
                       </div>
                       {req.notes && (
                         <p className="text-xs text-muted-foreground">{req.notes}</p>
                       )}
                     </div>
                     <div className="flex items-center gap-2">
                       <Badge variant="secondary">{req.qualificationShortName}</Badge>
                       {isEditing && (
                         <>
                           <Button variant="ghost" size="sm" onClick={() => startEditing(req)}>
                             <Edit2 className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="sm" onClick={() => handleDeleteRequirement(req.id)}>
                             <Trash2 className="h-4 w-4 text-destructive" />
                           </Button>
                         </>
                       )}
                     </div>
                   </div>
                 </div>
               )}
             </div>
           ))}
         </div>
       ) : !showAddForm && (
         <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed border-border">
           <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
           <p className="text-sm text-muted-foreground">No qualification requirements</p>
           {isEditing && (
             <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowAddForm(true)}>
               <Plus className="h-4 w-4 mr-2" />
               Add First Requirement
             </Button>
           )}
         </div>
       )}
     </div>
   );
 };
 
 export default QualificationRequirementEditor;