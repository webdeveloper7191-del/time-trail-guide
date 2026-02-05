 import React, { useState, useEffect } from 'react';
import { Layers, Users, Shield, Clock, Plus, Trash2, Save, Edit2, Settings, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
 import { cn } from '@/lib/utils';
 import { areaSchema, validateForm, getFieldError, ValidationError } from '@/lib/validation/locationValidation';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
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
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
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

          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
            
           {/* Location selector for new areas */}
           {isNew && locations.length > 0 && (
             <div className="space-y-2">
               <Label>Location <span className="text-destructive">*</span></Label>
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
               {getError('locationId') && <p className="text-xs text-destructive mt-1">{getError('locationId')}</p>}
             </div>
           )}
 
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
               <Label>Area Name <span className="text-destructive">*</span></Label>
                {isEditing ? (
                   <div>
                     <Input
                       value={formData.name}
                       onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                       placeholder="Enter area name"
                       className={getError('name') ? 'border-destructive' : ''}
                     />
                     {getError('name') && <p className="text-xs text-destructive mt-1">{getError('name')}</p>}
                   </div>
                ) : (
                  <p className="text-sm font-medium">{area?.name}</p>
                )}
              </div>
              <div className="space-y-2">
               <Label>Area Code <span className="text-destructive">*</span></Label>
                {isEditing ? (
                   <div>
                     <Input
                       value={formData.code}
                       onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                       placeholder="e.g., NUR"
                       className={getError('code') ? 'border-destructive' : ''}
                     />
                     {getError('code') && <p className="text-xs text-destructive mt-1">{getError('code')}</p>}
                   </div>
                ) : (
                  <p className="text-sm font-medium">{area?.code}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
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
              </div>
              <div className="space-y-2">
                <Label>Service Category</Label>
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
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Service Type</Label>
                {isEditing ? (
                  <Input
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    placeholder="e.g., Early Learning"
                  />
                ) : (
                  <p className="text-sm font-medium">{area?.serviceType || 'Not set'}</p>
                )}
              </div>
              <div className="space-y-2">
               <Label>Capacity <span className="text-destructive">*</span></Label>
                {isEditing ? (
                   <div>
                     <Input
                       type="number"
                       value={formData.capacity}
                       onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                       className={getError('capacity') ? 'border-destructive' : ''}
                     />
                     {getError('capacity') && <p className="text-xs text-destructive mt-1">{getError('capacity')}</p>}
                   </div>
                ) : (
                  <p className="text-sm font-medium">{area?.capacity}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Staffing Limits</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
               <Label>Minimum Staff <span className="text-destructive">*</span></Label>
                {isEditing ? (
                   <div>
                     <Input
                       type="number"
                       value={formData.minimumStaff}
                       onChange={(e) => setFormData({ ...formData, minimumStaff: parseInt(e.target.value) || 1 })}
                       className={getError('minimumStaff') ? 'border-destructive' : ''}
                     />
                     {getError('minimumStaff') && <p className="text-xs text-destructive mt-1">{getError('minimumStaff')}</p>}
                   </div>
                ) : (
                  <p className="text-sm font-medium">{area?.minimumStaff}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Maximum Staff</Label>
                {isEditing ? (
                   <div>
                     <Input
                       type="number"
                       value={formData.maximumStaff}
                       onChange={(e) => setFormData({ ...formData, maximumStaff: parseInt(e.target.value) || 10 })}
                       className={getError('maximumStaff') ? 'border-destructive' : ''}
                     />
                     {getError('maximumStaff') && <p className="text-xs text-destructive mt-1">{getError('maximumStaff')}</p>}
                   </div>
                ) : (
                  <p className="text-sm font-medium">{area?.maximumStaff || 'No limit'}</p>
                )}
              </div>
            </div>
          </div>
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
