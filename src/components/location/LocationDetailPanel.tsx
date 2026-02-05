 import React, { useState, useEffect } from 'react';
import { MapPin, Layers, Building2, Phone, Mail, Globe, Edit2, Save, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
 import { cn } from '@/lib/utils';
 import { locationSchema, validateForm, getFieldError, ValidationError } from '@/lib/validation/locationValidation';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection, FormField, FormRow } from '@/components/ui/off-canvas/FormSection';
import { Location, Area, Department, LOCATION_STATUS_LABELS, AUSTRALIAN_STATES, AUSTRALIAN_TIMEZONES, StaffingRatio, QualificationRequirement, AreaCombiningThreshold } from '@/types/location';
import { INDUSTRY_TEMPLATES } from '@/types/industryConfig';
import StaffingRatioEditor from './StaffingRatioEditor';
import QualificationRequirementEditor from './QualificationRequirementEditor';
import AreaCombiningEditor from './AreaCombiningEditor';

interface LocationDetailPanelProps {
  open: boolean;
  onClose: () => void;
  location: Location | null;
  isNew: boolean;
  areas: Area[];
  departments: Department[];
   onSave?: (data: any) => void;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const LocationDetailPanel: React.FC<LocationDetailPanelProps> = ({
  open,
  onClose,
  location,
  isNew,
  areas,
  departments,
   onSave,
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(isNew);
   const [errors, setErrors] = useState<ValidationError[]>([]);
   const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: location?.name || '',
    code: location?.code || '',
    status: location?.status || 'pending_setup',
    phone: location?.phone || '',
    email: location?.email || '',
    timezone: location?.timezone || 'Australia/Melbourne',
    industryType: location?.industryType || 'custom',
    totalCapacity: location?.totalCapacity || 0,
    maxStaff: location?.maxStaff || 0,
    address: {
      line1: location?.address.line1 || '',
      line2: location?.address.line2 || '',
      suburb: location?.address.suburb || '',
      state: location?.address.state || 'VIC',
      postcode: location?.address.postcode || '',
      country: location?.address.country || 'Australia',
    },
  });

  // Location-level compliance config state
  const [underRoofRatios, setUnderRoofRatios] = useState<StaffingRatio[]>([]);
  const [locationQualifications, setLocationQualifications] = useState<QualificationRequirement[]>([]);
  const [areaCombiningThresholds, setAreaCombiningThresholds] = useState<AreaCombiningThreshold[]>([]);

   // Reset form when location changes or panel opens
   useEffect(() => {
     if (open) {
       setFormData({
         name: location?.name || '',
         code: location?.code || '',
         status: location?.status || 'pending_setup',
         phone: location?.phone || '',
         email: location?.email || '',
         timezone: location?.timezone || 'Australia/Melbourne',
         industryType: location?.industryType || 'custom',
         totalCapacity: location?.totalCapacity || 50,
         maxStaff: location?.maxStaff || 10,
         address: {
           line1: location?.address?.line1 || '',
           line2: location?.address?.line2 || '',
           suburb: location?.address?.suburb || '',
           state: location?.address?.state || 'VIC',
           postcode: location?.address?.postcode || '',
           country: location?.address?.country || 'Australia',
         },
       });
       setErrors([]);
       setIsEditing(isNew);
     }
   }, [open, location, isNew]);
 
  const handleSave = () => {
     const result = validateForm(locationSchema, formData);
     
     if (result.success === false) {
       setErrors(result.errors as ValidationError[]);
       toast.error('Please fix the validation errors');
       return;
     }
     
     setIsSaving(true);
     
     // Simulate save - in real app this would call API
     setTimeout(() => {
       if (onSave) {
          onSave({
            ...result.data,
            underRoofRatios,
            locationQualifications,
            areaCombiningThresholds,
          });
       }
       toast.success(isNew ? 'Location created successfully' : 'Location updated successfully');
       setErrors([]);
       setIsSaving(false);
       setIsEditing(false);
       onClose();
     }, 500);
  };

   const getError = (field: string) => getFieldError(errors, field);
 
  const actions = isEditing ? [
    { label: 'Cancel', onClick: () => isNew ? onClose() : setIsEditing(false), variant: 'outlined' as const },
     { label: isSaving ? 'Saving...' : 'Save Location', onClick: handleSave, variant: 'primary' as const, icon: <Save className="h-4 w-4" />, disabled: isSaving, loading: isSaving },
  ] : [
    { label: 'Edit', onClick: () => setIsEditing(true), variant: 'primary' as const, icon: <Edit2 className="h-4 w-4" /> },
  ];

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title={isNew ? 'New Location' : location?.name || 'Location Details'}
      description={isNew ? 'Create a new location' : `${location?.code} • ${location?.address?.suburb}`}
      icon={MapPin}
      size="xl"
      actions={actions}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="hours">Operating Hours</TabsTrigger>
          <TabsTrigger value="areas">Areas ({areas.length})</TabsTrigger>
          <TabsTrigger value="departments">Departments ({departments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          {/* Basic Info */}
          <FormSection title="Basic Information" tooltip="Configure the location details">
            <FormRow>
              <FormField label="Location Name" required error={getError('name')}>
                {isEditing ? (
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter location name"
                    className={getError('name') ? 'border-destructive' : ''}
                  />
                ) : (
                  <p className="text-sm font-medium">{location?.name}</p>
                )}
              </FormField>
              <FormField label="Location Code" required error={getError('code')}>
                {isEditing ? (
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., MEL-CBD"
                    className={getError('code') ? 'border-destructive' : ''}
                  />
                ) : (
                  <p className="text-sm font-medium">{location?.code}</p>
                )}
              </FormField>
            </FormRow>

            <FormRow>
              <FormField label="Status">
                {isEditing ? (
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v as Location['status'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LOCATION_STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline">{LOCATION_STATUS_LABELS[location?.status || 'pending_setup']}</Badge>
                )}
              </FormField>
              <FormField label="Industry Type" tooltip="Select the industry for compliance defaults">
                {isEditing ? (
                  <Select
                    value={formData.industryType}
                    onValueChange={(v) => setFormData({ ...formData, industryType: v as Location['industryType'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRY_TEMPLATES.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm font-medium capitalize">{location?.industryType}</p>
                )}
              </FormField>
            </FormRow>

            <FormRow>
              <FormField label="Total Capacity" required error={getError('totalCapacity')}>
                {isEditing ? (
                  <Input
                    type="number"
                    value={formData.totalCapacity}
                    onChange={(e) => setFormData({ ...formData, totalCapacity: parseInt(e.target.value) || 0 })}
                    className={getError('totalCapacity') ? 'border-destructive' : ''}
                  />
                ) : (
                  <p className="text-sm font-medium">{location?.totalCapacity}</p>
                )}
              </FormField>
              <FormField label="Max Staff" required error={getError('maxStaff')}>
                {isEditing ? (
                  <Input
                    type="number"
                    value={formData.maxStaff}
                    onChange={(e) => setFormData({ ...formData, maxStaff: parseInt(e.target.value) || 0 })}
                    className={getError('maxStaff') ? 'border-destructive' : ''}
                  />
                ) : (
                  <p className="text-sm font-medium">{location?.maxStaff}</p>
                )}
              </FormField>
            </FormRow>
          </FormSection>

          {/* Address */}
          <FormSection title="Address" tooltip="Physical location address">
            {isEditing ? (
              <>
                <FormField label="Street Address" required error={getError('address.line1')}>
                  <Input
                    value={formData.address.line1}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, line1: e.target.value } })}
                    placeholder="Street address"
                    className={getError('address.line1') ? 'border-destructive' : ''}
                  />
                </FormField>
                <FormField label="Address Line 2 (Optional)">
                  <Input
                    value={formData.address.line2}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, line2: e.target.value } })}
                    placeholder="Suite, unit, building, floor, etc."
                  />
                </FormField>
                <FormRow columns={3}>
                  <FormField label="Suburb" required error={getError('address.suburb')}>
                    <Input
                      value={formData.address.suburb}
                      onChange={(e) => setFormData({ ...formData, address: { ...formData.address, suburb: e.target.value } })}
                      className={getError('address.suburb') ? 'border-destructive' : ''}
                    />
                  </FormField>
                  <FormField label="State">
                    <Select
                      value={formData.address.state}
                      onValueChange={(v) => setFormData({ ...formData, address: { ...formData.address, state: v } })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AUSTRALIAN_STATES.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                  <FormField label="Postcode" required error={getError('address.postcode')}>
                    <Input
                      value={formData.address.postcode}
                      onChange={(e) => setFormData({ ...formData, address: { ...formData.address, postcode: e.target.value } })}
                      className={getError('address.postcode') ? 'border-destructive' : ''}
                    />
                  </FormField>
                </FormRow>
              </>
            ) : (
              <div className="text-sm">
                <p>{location?.address.line1}</p>
                {location?.address.line2 && <p>{location.address.line2}</p>}
                <p>{location?.address.suburb}, {location?.address.state} {location?.address.postcode}</p>
              </div>
            )}
          </FormSection>

          {/* Contact */}
          <FormSection title="Contact Details" tooltip="Location contact information">
            <FormRow>
              <FormField label="Phone">
                {isEditing ? (
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+61 3 1234 5678"
                  />
                ) : (
                  <p className="text-sm">{location?.phone || 'Not set'}</p>
                )}
              </FormField>
              <FormField label="Email">
                {isEditing ? (
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="location@example.com"
                  />
                ) : (
                  <p className="text-sm">{location?.email || 'Not set'}</p>
                )}
              </FormField>
            </FormRow>

            <FormField label="Timezone" tooltip="Local timezone for operating hours">
              {isEditing ? (
                <Select
                  value={formData.timezone}
                  onValueChange={(v) => setFormData({ ...formData, timezone: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUSTRALIAN_TIMEZONES.map(tz => (
                      <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm">{location?.timezone}</p>
              )}
            </FormField>
          </FormSection>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          {/* Under the Roof Ratios */}
          <FormSection title="Under the Roof Ratios" tooltip="Location-wide staffing requirements based on total attendance">
            <StaffingRatioEditor
              ratios={underRoofRatios}
              onUpdate={setUnderRoofRatios}
              isEditing={isEditing}
              demandUnit="Total Attendance"
              isLocationLevel={true}
            />
          </FormSection>

          {/* Location-wide Qualifications */}
          <FormSection title="Location-Wide Qualifications" tooltip="Qualification requirements that apply across all areas">
            <QualificationRequirementEditor
              requirements={locationQualifications}
              onUpdate={setLocationQualifications}
              isEditing={isEditing}
              industryType={formData.industryType as any}
            />
          </FormSection>

          {/* Area Combining Thresholds */}
          <FormSection title="Combine Area or Reduce Staff" tooltip="Configure when to prompt roster managers to combine areas or reduce staffing">
            <AreaCombiningEditor
              thresholds={areaCombiningThresholds}
              onUpdate={setAreaCombiningThresholds}
              isEditing={isEditing}
              industryType={formData.industryType as any}
            />
          </FormSection>
        </TabsContent>

        <TabsContent value="hours" className="space-y-4">
          <FormSection title="Weekly Operating Hours" tooltip="Configure when the location is open">
            <div className="space-y-3">
              {DAYS_OF_WEEK.map((day, index) => {
                const hours = location?.operatingHours.find(h => h.dayOfWeek === index);
                return (
                  <div key={day} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm font-medium w-24">{day}</span>
                    {hours?.isOpen ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          Open
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {hours.openTime} - {hours.closeTime}
                        </span>
                      </div>
                    ) : (
                      <Badge variant="secondary">Closed</Badge>
                    )}
                  </div>
                );
              })}
            </div>
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
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {area.staffingRatios[0] 
                          ? `${area.staffingRatios[0].minAttendance}-${area.staffingRatios[0].maxAttendance} → ${area.staffingRatios[0].staffRequired}`
                          : 'No ratio'
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">Staff ratio</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed border-border">
              <Layers className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No areas configured</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          {departments.length > 0 ? (
            <div className="space-y-3">
              {departments.map(dept => (
                <div key={dept.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{dept.name}</h4>
                        <p className="text-xs text-muted-foreground">{dept.code} • {dept.headcount || 0} staff</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">{dept.type}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed border-border">
              <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No departments configured</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PrimaryOffCanvas>
  );
};

export default LocationDetailPanel;
