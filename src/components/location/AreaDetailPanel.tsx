 import React, { useState, useEffect } from 'react';
import { Layers, Save, Edit2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
 import { cn } from '@/lib/utils';
 import { areaSchema, validateForm, getFieldError, ValidationError } from '@/lib/validation/locationValidation';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection, FormField, FormRow } from '@/components/ui/off-canvas/FormSection';
import { Area, Location, AREA_STATUS_LABELS, StaffingRatio, QualificationRequirement, ComplianceRule } from '@/types/location';
import StaffingRatioEditor from './StaffingRatioEditor';
import QualificationRequirementEditor from './QualificationRequirementEditor';
import ComplianceRuleEditor from './ComplianceRuleEditor';
import { industryComplianceConfigs } from '@/data/mockLocationData';
import { INDUSTRY_TEMPLATES } from '@/types/industryConfig';

interface AreaDetailPanelProps {
  open: boolean;
  onClose: () => void;
  area: Area | null;
  isNew: boolean;
  location: Location | null;
   locations?: Location[];
   onSave?: (data: any) => void;
}

const AreaDetailPanel: React.FC<AreaDetailPanelProps> = ({
  open,
  onClose,
  area,
  isNew,
  location,
   locations = [],
   onSave,
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(isNew);
   const [errors, setErrors] = useState<ValidationError[]>([]);
   const [isSaving, setIsSaving] = useState(false);
   const [selectedLocationId, setSelectedLocationId] = useState(area?.locationId || location?.id || '');
  
  const [formData, setFormData] = useState({
    name: area?.name || '',
    code: area?.code || '',
    status: area?.status || 'active',
    color: area?.color || 'hsl(200, 70%, 50%)',
    capacity: area?.capacity || 0,
    serviceCategory: area?.serviceCategory || '',
    serviceType: area?.serviceType || '',
    minimumStaff: area?.minimumStaff || 1,
    maximumStaff: area?.maximumStaff || 10,
  });
  const [staffingRatios, setStaffingRatios] = useState<StaffingRatio[]>(area?.staffingRatios || []);
  const [qualificationRequirements, setQualificationRequirements] = useState<QualificationRequirement[]>(area?.qualificationRequirements || []);
  const [complianceRules, setComplianceRules] = useState<ComplianceRule[]>(area?.complianceRules || []);

  // Get current location for industry context
  const currentLocation = selectedLocationId 
    ? locations.find(l => l.id === selectedLocationId) || location 
    : location;

  // Apply industry defaults
  const handleApplyIndustryDefaults = () => {
    if (!currentLocation?.industryType) {
      toast.error('Please select an industry type for this location first');
      return;
    }
    
    const config = industryComplianceConfigs.find(c => c.industryType === currentLocation.industryType);
    if (!config) {
      toast.error('No industry defaults available');
      return;
    }
    
    // Apply default ratios (generate new IDs to avoid conflicts)
    const newRatios = config.defaultRatios.map((r, idx) => ({
      ...r,
      id: `ratio-${Date.now()}-${idx}`,
    }));
    setStaffingRatios(newRatios);
    
    // Apply default qualifications
    const newQuals = config.defaultQualifications.map((q, idx) => ({
      ...q,
      id: `qual-${Date.now()}-${idx}`,
    }));
    setQualificationRequirements(newQuals);
    
    // Apply first matching area preset category if available
    if (config.areaPresets.length > 0) {
      setFormData(prev => ({
        ...prev,
        serviceCategory: config.areaPresets[0].serviceCategory || '',
        serviceType: config.areaPresets[0].serviceType || '',
      }));
    }
    
    toast.success(`Applied ${INDUSTRY_TEMPLATES.find(t => t.id === currentLocation.industryType)?.name || 'industry'} defaults`);
  };

   // Reset form when area changes or panel opens
   useEffect(() => {
     if (open) {
       setFormData({
         name: area?.name || '',
         code: area?.code || '',
         status: area?.status || 'active',
         color: area?.color || 'hsl(200, 70%, 50%)',
         capacity: area?.capacity || 20,
          serviceCategory: area?.serviceCategory || '',
         serviceType: area?.serviceType || '',
         minimumStaff: area?.minimumStaff || 1,
         maximumStaff: area?.maximumStaff || 10,
       });
       setSelectedLocationId(area?.locationId || location?.id || '');
       setStaffingRatios(area?.staffingRatios || []);
       setQualificationRequirements(area?.qualificationRequirements || []);
       setComplianceRules(area?.complianceRules || []);
       setErrors([]);
       setIsEditing(isNew);
     }
   }, [open, area, location, isNew]);
 
  const handleSave = () => {
     const dataToValidate = {
       ...formData,
       locationId: selectedLocationId,
     };
     
     const result = validateForm(areaSchema, dataToValidate);
     
     if (result.success === false) {
       setErrors(result.errors as ValidationError[]);
       toast.error('Please fix the validation errors');
       return;
     }
     
     setIsSaving(true);
     
     setTimeout(() => {
       if (onSave) {
          onSave({
            ...result.data,
            staffingRatios,
            qualificationRequirements,
            complianceRules,
          });
       }
       toast.success(isNew ? 'Area created successfully' : 'Area updated successfully');
       setErrors([]);
       setIsSaving(false);
       setIsEditing(false);
       onClose();
     }, 500);
  };

   const getError = (field: string) => getFieldError(errors, field);
 
  const actions = isEditing ? [
    { label: 'Cancel', onClick: () => isNew ? onClose() : setIsEditing(false), variant: 'outlined' as const },
     { label: isSaving ? 'Saving...' : 'Save Area', onClick: handleSave, variant: 'primary' as const, icon: <Save className="h-4 w-4" />, disabled: isSaving, loading: isSaving },
  ] : [
    { label: 'Edit', onClick: () => setIsEditing(true), variant: 'primary' as const, icon: <Edit2 className="h-4 w-4" /> },
  ];

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title={isNew ? 'New Area' : area?.name || 'Area Details'}
      description={isNew ? 'Create a new area' : `${area?.code} • ${location?.name}`}
      icon={Layers}
      size="xl"
      actions={actions}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="ratios">Staffing Ratios</TabsTrigger>
          <TabsTrigger value="qualifications">Qualifications</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          {/* Apply Industry Defaults Button */}
          {isEditing && currentLocation?.industryType && currentLocation.industryType !== 'custom' && (
            <div className="bg-primary/10 border-l-4 border-primary rounded-r-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-primary" />
                    Quick Setup
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Apply {INDUSTRY_TEMPLATES.find(t => t.id === currentLocation.industryType)?.name || 'industry'} default ratios, qualifications, and categories
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={handleApplyIndustryDefaults}>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Apply Industry Defaults
                </Button>
              </div>
            </div>
          )}

          <FormSection title="Basic Information" tooltip="Configure the basic area details">
           {/* Location selector for new areas */}
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
              <FormField label="Area Name" required error={getError('name')}>
                {isEditing ? (
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter area name"
                    className={getError('name') ? 'border-destructive' : ''}
                  />
                ) : (
                  <p className="text-sm font-medium">{area?.name}</p>
                )}
              </FormField>
              <FormField label="Area Code" required error={getError('code')}>
                {isEditing ? (
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., NUR"
                    className={getError('code') ? 'border-destructive' : ''}
                  />
                ) : (
                  <p className="text-sm font-medium">{area?.code}</p>
                )}
              </FormField>
            </FormRow>

            <FormRow>
              <FormField label="Status">
                {isEditing ? (
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v as Area['status'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(AREA_STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline">{AREA_STATUS_LABELS[area?.status || 'active']}</Badge>
                )}
              </FormField>
              <FormField label="Service Category">
                {isEditing ? (
                  currentLocation?.serviceCategories && currentLocation.serviceCategories.length > 0 ? (
                    <Select 
                      value={formData.serviceCategory} 
                      onValueChange={(v) => setFormData({ ...formData, serviceCategory: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentLocation.serviceCategories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={formData.serviceCategory}
                      onChange={(e) => setFormData({ ...formData, serviceCategory: e.target.value })}
                      placeholder="e.g., Nursery, ICU, Kitchen"
                    />
                  )
                ) : (
                  <p className="text-sm font-medium">{area?.serviceCategory || 'Not set'}</p>
                )}
              </FormField>
            </FormRow>

            <FormRow>
              <FormField label="Service Type">
                {isEditing ? (
                  <Input
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    placeholder="e.g., Early Learning"
                  />
                ) : (
                  <p className="text-sm font-medium">{area?.serviceType || 'Not set'}</p>
                )}
              </FormField>
              <FormField label="Capacity" required error={getError('capacity')}>
                {isEditing ? (
                  <Input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                    className={getError('capacity') ? 'border-destructive' : ''}
                  />
                ) : (
                  <p className="text-sm font-medium">{area?.capacity}</p>
                )}
              </FormField>
            </FormRow>
          </FormSection>

          <FormSection title="Staffing Limits" tooltip="Set minimum and maximum staff requirements">
            <FormRow>
              <FormField label="Minimum Staff" required error={getError('minimumStaff')}>
                {isEditing ? (
                  <Input
                    type="number"
                    value={formData.minimumStaff}
                    onChange={(e) => setFormData({ ...formData, minimumStaff: parseInt(e.target.value) || 1 })}
                    className={getError('minimumStaff') ? 'border-destructive' : ''}
                  />
                ) : (
                  <p className="text-sm font-medium">{area?.minimumStaff}</p>
                )}
              </FormField>
              <FormField label="Maximum Staff" error={getError('maximumStaff')}>
                {isEditing ? (
                  <Input
                    type="number"
                    value={formData.maximumStaff}
                    onChange={(e) => setFormData({ ...formData, maximumStaff: parseInt(e.target.value) || 10 })}
                    className={getError('maximumStaff') ? 'border-destructive' : ''}
                  />
                ) : (
                  <p className="text-sm font-medium">{area?.maximumStaff || 'No limit'}</p>
                )}
              </FormField>
            </FormRow>
          </FormSection>
        </TabsContent>

        <TabsContent value="ratios" className="space-y-4">
          <StaffingRatioEditor
            ratios={staffingRatios}
            onUpdate={setStaffingRatios}
            isEditing={isEditing}
            demandUnit={formData.serviceType || 'Units'}
          />
        </TabsContent>

        <TabsContent value="qualifications" className="space-y-4">
          <QualificationRequirementEditor
            requirements={qualificationRequirements}
            onUpdate={setQualificationRequirements}
            isEditing={isEditing}
            industryType={location?.industryType}
          />
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <ComplianceRuleEditor
            rules={complianceRules}
            onUpdate={setComplianceRules}
            isEditing={isEditing}
          />
        </TabsContent>
      </Tabs>
    </PrimaryOffCanvas>
  );
};

export default AreaDetailPanel;
