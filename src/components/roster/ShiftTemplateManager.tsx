 import { useState } from 'react';
 import { ShiftTemplate, defaultShiftTemplates } from '@/types/roster';
 import { Clock, Plus } from 'lucide-react';
 import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
 import { FormSection } from '@/components/ui/off-canvas/FormSection';
 import { Button } from '@/components/ui/button';
 import { AllowanceType } from '@/types/allowances';
 import { ShiftTemplateCard, NewTemplateForm } from './shift-templates';
 
 interface ShiftTemplateManagerProps {
   open: boolean;
   onClose: () => void;
   customTemplates: ShiftTemplate[];
   onSave: (templates: ShiftTemplate[]) => void;
 }
 
 const getEmptyTemplate = (): Partial<ShiftTemplate> => ({
   name: '',
   startTime: '09:00',
   endTime: '17:00',
   breakMinutes: 30,
   color: 'hsl(200, 70%, 50%)',
   shiftType: 'regular',
   requiredQualifications: [],
   minimumClassification: undefined,
   preferredRole: undefined,
   onCallSettings: undefined,
   sleepoverSettings: undefined,
   brokenShiftSettings: undefined,
   higherDutiesClassification: undefined,
   isRemoteLocation: false,
   defaultTravelKilometres: undefined,
   selectedAllowances: [],
 });
 
 export function ShiftTemplateManager({
   open,
   onClose,
   customTemplates,
   onSave
 }: ShiftTemplateManagerProps) {
   // Merge default templates with custom templates, allowing overrides
   const [templates, setTemplates] = useState<ShiftTemplate[]>(() => {
     const customIds = new Set(customTemplates.map(t => t.id));
     const defaults = defaultShiftTemplates.filter(t => !customIds.has(t.id) && !customTemplates.some(c => c.id.startsWith(`custom-${t.id}`)));
     return [...defaults, ...customTemplates];
   });
   const [editingId, setEditingId] = useState<string | null>(null);
   const [newTemplate, setNewTemplate] = useState<Partial<ShiftTemplate>>(getEmptyTemplate());
   const [isAdding, setIsAdding] = useState(false);
   const [customAllowances, setCustomAllowances] = useState<AllowanceType[]>([]);
 
   // Track which templates are defaults vs custom
   const isDefaultTemplate = (id: string) => defaultShiftTemplates.some(t => t.id === id);
 
   const handleCreateAllowance = (allowance: AllowanceType) => {
     setCustomAllowances(prev => [...prev, allowance]);
   };
 
   const handleAdd = () => {
     if (!newTemplate.name?.trim()) return;
 
     const template: ShiftTemplate = {
       id: `custom-${Date.now()}`,
       name: newTemplate.name.trim(),
       startTime: newTemplate.startTime || '09:00',
       endTime: newTemplate.endTime || '17:00',
       breakMinutes: newTemplate.breakMinutes || 30,
       color: newTemplate.color || 'hsl(200, 70%, 50%)',
       shiftType: newTemplate.shiftType || 'regular',
       requiredQualifications: newTemplate.requiredQualifications || [],
       minimumClassification: newTemplate.minimumClassification,
       preferredRole: newTemplate.preferredRole,
       onCallSettings: newTemplate.shiftType === 'on_call' ? newTemplate.onCallSettings : undefined,
       sleepoverSettings: newTemplate.shiftType === 'sleepover' ? newTemplate.sleepoverSettings : undefined,
       brokenShiftSettings: newTemplate.shiftType === 'broken' ? newTemplate.brokenShiftSettings : undefined,
       higherDutiesClassification: newTemplate.higherDutiesClassification,
       isRemoteLocation: newTemplate.isRemoteLocation,
       defaultTravelKilometres: newTemplate.defaultTravelKilometres,
       selectedAllowances: newTemplate.selectedAllowances || [],
     };
 
     setTemplates(prev => [...prev, template]);
     setNewTemplate(getEmptyTemplate());
     setIsAdding(false);
   };
 
   const handleUpdate = (id: string, updates: Partial<ShiftTemplate>) => {
     setTemplates(prev => prev.map(t => 
       t.id === id ? { ...t, ...updates } : t
     ));
   };
 
   const handleDelete = (id: string) => {
     if (isDefaultTemplate(id)) {
       const original = defaultShiftTemplates.find(t => t.id === id);
       if (original) {
         setTemplates(prev => prev.map(t => t.id === id ? { ...original } : t));
       }
     } else {
       setTemplates(prev => prev.filter(t => t.id !== id));
     }
   };
 
   const handleSave = () => {
     onSave(templates);
     onClose();
   };
 
   const hasTemplateChanged = (template: ShiftTemplate) => {
     const original = defaultShiftTemplates.find(t => t.id === template.id);
     if (!original) return false;
     return JSON.stringify(original) !== JSON.stringify(template);
   };
 
   return (
     <PrimaryOffCanvas
       open={open}
       onClose={onClose}
       title="Manage Shift Templates"
       description="Create and manage reusable shift templates with allowance configurations"
       icon={Clock}
       size="lg"
       actions={[
         { label: 'Cancel', variant: 'secondary', onClick: onClose },
         { label: 'Save Changes', variant: 'primary', onClick: handleSave },
       ]}
     >
       <FormSection title={`Shift Templates (${templates.length})`}>
         <div className="flex justify-end mb-3">
           {!isAdding && (
             <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)}>
               <Plus size={14} className="mr-1" />
               Add Template
             </Button>
           )}
         </div>
 
         <div className="space-y-3">
           {templates.map(template => (
             <ShiftTemplateCard
               key={template.id}
               template={template}
               isEditing={editingId === template.id}
               isDefault={isDefaultTemplate(template.id)}
               hasChanged={hasTemplateChanged(template)}
               onEdit={() => setEditingId(template.id)}
               onCancelEdit={() => setEditingId(null)}
               onUpdate={(updates) => handleUpdate(template.id, updates)}
               onDelete={() => handleDelete(template.id)}
               customAllowances={customAllowances}
               onCreateAllowance={handleCreateAllowance}
             />
           ))}
 
           {isAdding && (
             <NewTemplateForm
               template={newTemplate}
               onUpdate={(updates) => setNewTemplate(prev => ({ ...prev, ...updates }))}
               onAdd={handleAdd}
               onCancel={() => setIsAdding(false)}
               customAllowances={customAllowances}
               onCreateAllowance={handleCreateAllowance}
             />
           )}
 
           {templates.length === 0 && !isAdding && (
             <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
               <p className="text-sm">No custom templates yet.</p>
               <p className="text-xs">Click "Add Template" to create one.</p>
             </div>
           )}
         </div>
       </FormSection>
     </PrimaryOffCanvas>
   );
 }