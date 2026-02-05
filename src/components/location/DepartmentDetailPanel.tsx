 import React, { useState, useEffect } from 'react';
import { Building2, DollarSign, Layers, Save, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
 import { departmentSchema, validateForm, getFieldError, ValidationError } from '@/lib/validation/locationValidation';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection, FormField, FormRow } from '@/components/ui/off-canvas/FormSection';
import { Department, Area, Location, DEPARTMENT_TYPE_LABELS } from '@/types/location';

interface DepartmentDetailPanelProps {
  open: boolean;
  onClose: () => void;
  department: Department | null;
  isNew: boolean;
  location: Location | null;
  areas: Area[];
   locations?: Location[];
   onSave?: (data: any) => void;
}

const DepartmentDetailPanel: React.FC<DepartmentDetailPanelProps> = ({
  open,
  onClose,
  department,
  isNew,
  location,
  areas,
   locations = [],
   onSave,
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(isNew);
   const [errors, setErrors] = useState<ValidationError[]>([]);
   const [isSaving, setIsSaving] = useState(false);
   const [selectedLocationId, setSelectedLocationId] = useState(department?.locationId || location?.id || '');
  
  const [formData, setFormData] = useState({
    name: department?.name || '',
    code: department?.code || '',
    type: department?.type || 'operational',
    description: department?.description || '',
    managerName: department?.managerName || '',
    budgetAllocation: department?.budgetAllocation || 0,
    costCentreCode: department?.costCentreCode || '',
    headcount: department?.headcount || 0,
    isActive: department?.isActive ?? true,
  });

   // Reset form when department changes or panel opens
   useEffect(() => {
     if (open) {
       setFormData({
         name: department?.name || '',
         code: department?.code || '',
         type: department?.type || 'operational',
         description: department?.description || '',
         managerName: department?.managerName || '',
         budgetAllocation: department?.budgetAllocation || 0,
         costCentreCode: department?.costCentreCode || '',
         headcount: department?.headcount || 0,
         isActive: department?.isActive ?? true,
       });
       setSelectedLocationId(department?.locationId || location?.id || '');
       setErrors([]);
       setIsEditing(isNew);
     }
   }, [open, department, location, isNew]);
 
  const handleSave = () => {
     const dataToValidate = {
       ...formData,
       locationId: selectedLocationId,
     };
     
     const result = validateForm(departmentSchema, dataToValidate);
     
     if (result.success === false) {
       setErrors(result.errors as ValidationError[]);
       toast.error('Please fix the validation errors');
       return;
     }
     
     setIsSaving(true);
     
     setTimeout(() => {
       if (onSave) {
         onSave(result.data);
       }
       toast.success(isNew ? 'Department created successfully' : 'Department updated successfully');
       setErrors([]);
       setIsSaving(false);
       setIsEditing(false);
       onClose();
     }, 500);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(amount);
  };

   const getError = (field: string) => getFieldError(errors, field);
 
  const actions = isEditing ? [
    { label: 'Cancel', onClick: () => isNew ? onClose() : setIsEditing(false), variant: 'outlined' as const },
     { label: isSaving ? 'Saving...' : 'Save Department', onClick: handleSave, variant: 'primary' as const, icon: <Save className="h-4 w-4" />, disabled: isSaving, loading: isSaving },
  ] : [
    { label: 'Edit', onClick: () => setIsEditing(true), variant: 'primary' as const, icon: <Edit2 className="h-4 w-4" /> },
  ];

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title={isNew ? 'New Department' : department?.name || 'Department Details'}
      description={isNew ? 'Create a new department' : `${department?.code} • ${location?.name}`}
      icon={Building2}
      size="lg"
      actions={actions}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="areas">Areas ({areas.length})</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <FormSection title="Basic Information" tooltip="Configure the department details">
           {/* Location selector for new departments */}
           {isNew && locations.length > 0 && (
              <FormField label="Location" required error={getError('locationId')}>
               <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                 <SelectTrigger className={getError('locationId') ? 'border-destructive' : ''}>
                   <SelectValue placeholder="Select a location" />
                 </SelectTrigger>
                 <SelectContent>
                   {locations.map(loc => (
                     <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
              </FormField>
           )}
 
            <FormRow>
              <FormField label="Department Name" required error={getError('name')}>
                {isEditing ? (
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter department name"
                    className={getError('name') ? 'border-destructive' : ''}
                  />
                ) : (
                  <p className="text-sm font-medium">{department?.name}</p>
                )}
              </FormField>
              <FormField label="Department Code" required error={getError('code')}>
                {isEditing ? (
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., EDU"
                    className={getError('code') ? 'border-destructive' : ''}
                  />
                ) : (
                  <p className="text-sm font-medium">{department?.code}</p>
                )}
              </FormField>
            </FormRow>

            <FormRow>
              <FormField label="Department Type">
                {isEditing ? (
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v as Department['type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DEPARTMENT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className="capitalize">{DEPARTMENT_TYPE_LABELS[department?.type || 'operational']}</Badge>
                )}
              </FormField>
              <FormField label="Headcount" error={getError('headcount')}>
                {isEditing ? (
                  <Input
                    type="number"
                    value={formData.headcount}
                    onChange={(e) => setFormData({ ...formData, headcount: parseInt(e.target.value) || 0 })}
                    className={getError('headcount') ? 'border-destructive' : ''}
                  />
                ) : (
                  <p className="text-sm font-medium">{department?.headcount || 0} staff</p>
                )}
              </FormField>
            </FormRow>

            <FormField label="Description" error={getError('description')}>
              {isEditing ? (
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of department responsibilities"
                  rows={3}
                  className={getError('description') ? 'border-destructive' : ''}
                />
              ) : (
                <p className="text-sm text-muted-foreground">{department?.description || 'No description'}</p>
              )}
            </FormField>
          </FormSection>

          <FormSection title="Management" tooltip="Department management information">
            <FormField label="Department Manager">
              {isEditing ? (
                <Input
                  value={formData.managerName}
                  onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                  placeholder="Manager name"
                />
              ) : (
                <p className="text-sm font-medium">{department?.managerName || 'Not assigned'}</p>
              )}
            </FormField>
          </FormSection>
        </TabsContent>

        <TabsContent value="areas" className="space-y-4">
          {areas.length > 0 ? (
            <div className="space-y-3">
              {areas.map(area => (
                <div key={area.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="h-10 w-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: area.color ? `${area.color}20` : 'hsl(var(--primary) / 0.1)' }}
                      >
                        <Layers className="h-5 w-5" style={{ color: area.color || 'hsl(var(--primary))' }} />
                      </div>
                      <div>
                        <h4 className="font-medium">{area.name}</h4>
                        <p className="text-xs text-muted-foreground">{area.code} • Capacity: {area.capacity}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{area.serviceCategory || 'No Category'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed border-border">
              <Layers className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No areas assigned to this department</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="budget" className="space-y-6">
          <FormSection title="Budget Information" tooltip="Department budget and cost centre configuration">
            <FormRow>
              <FormField label="Budget Allocation">
                {isEditing ? (
                  <Input
                    type="number"
                    value={formData.budgetAllocation}
                    onChange={(e) => setFormData({ ...formData, budgetAllocation: parseFloat(e.target.value) || 0 })}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-lg font-semibold">{formatCurrency(department?.budgetAllocation || 0)}</span>
                  </div>
                )}
              </FormField>
              <FormField label="Cost Centre Code">
                {isEditing ? (
                  <Input
                    value={formData.costCentreCode}
                    onChange={(e) => setFormData({ ...formData, costCentreCode: e.target.value })}
                    placeholder="e.g., CC-EDU-001"
                  />
                ) : (
                  <p className="text-sm font-medium">{department?.costCentreCode || 'Not set'}</p>
                )}
              </FormField>
            </FormRow>
          </FormSection>
        </TabsContent>
      </Tabs>
    </PrimaryOffCanvas>
  );
};

export default DepartmentDetailPanel;
