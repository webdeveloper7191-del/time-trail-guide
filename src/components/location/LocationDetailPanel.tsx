import React, { useState } from 'react';
import { MapPin, Clock, Users, Layers, Building2, Phone, Mail, Globe, Edit2, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { Location, Area, Department, LOCATION_STATUS_LABELS, AUSTRALIAN_STATES, AUSTRALIAN_TIMEZONES } from '@/types/location';
import { INDUSTRY_TEMPLATES } from '@/types/industryConfig';

interface LocationDetailPanelProps {
  open: boolean;
  onClose: () => void;
  location: Location | null;
  isNew: boolean;
  areas: Area[];
  departments: Department[];
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const LocationDetailPanel: React.FC<LocationDetailPanelProps> = ({
  open,
  onClose,
  location,
  isNew,
  areas,
  departments,
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(isNew);
  
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

  const handleSave = () => {
    toast.success(isNew ? 'Location created successfully' : 'Location updated successfully');
    setIsEditing(false);
    onClose();
  };

  const actions = isEditing ? [
    { label: 'Cancel', onClick: () => isNew ? onClose() : setIsEditing(false), variant: 'outlined' as const },
    { label: 'Save Location', onClick: handleSave, variant: 'primary' as const, icon: <Save className="h-4 w-4" /> },
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
          <TabsTrigger value="hours">Operating Hours</TabsTrigger>
          <TabsTrigger value="areas">Areas ({areas.length})</TabsTrigger>
          <TabsTrigger value="departments">Departments ({departments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          {/* Basic Info */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location Name</Label>
                {isEditing ? (
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter location name"
                  />
                ) : (
                  <p className="text-sm font-medium">{location?.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Location Code</Label>
                {isEditing ? (
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., MEL-CBD"
                  />
                ) : (
                  <p className="text-sm font-medium">{location?.code}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
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
              </div>
              <div className="space-y-2">
                <Label>Industry Type</Label>
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
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Capacity</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={formData.totalCapacity}
                    onChange={(e) => setFormData({ ...formData, totalCapacity: parseInt(e.target.value) || 0 })}
                  />
                ) : (
                  <p className="text-sm font-medium">{location?.totalCapacity}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Max Staff</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={formData.maxStaff}
                    onChange={(e) => setFormData({ ...formData, maxStaff: parseInt(e.target.value) || 0 })}
                  />
                ) : (
                  <p className="text-sm font-medium">{location?.maxStaff}</p>
                )}
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Address</h3>
            
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label>Street Address</Label>
                  <Input
                    value={formData.address.line1}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, line1: e.target.value } })}
                    placeholder="Street address"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address Line 2 (Optional)</Label>
                  <Input
                    value={formData.address.line2}
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, line2: e.target.value } })}
                    placeholder="Suite, unit, building, floor, etc."
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Suburb</Label>
                    <Input
                      value={formData.address.suburb}
                      onChange={(e) => setFormData({ ...formData, address: { ...formData.address, suburb: e.target.value } })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
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
                  </div>
                  <div className="space-y-2">
                    <Label>Postcode</Label>
                    <Input
                      value={formData.address.postcode}
                      onChange={(e) => setFormData({ ...formData, address: { ...formData.address, postcode: e.target.value } })}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm">
                <p>{location?.address.line1}</p>
                {location?.address.line2 && <p>{location.address.line2}</p>}
                <p>{location?.address.suburb}, {location?.address.state} {location?.address.postcode}</p>
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Contact Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-3 w-3" /> Phone
                </Label>
                {isEditing ? (
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+61 3 1234 5678"
                  />
                ) : (
                  <p className="text-sm">{location?.phone || 'Not set'}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-3 w-3" /> Email
                </Label>
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
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-3 w-3" /> Timezone
              </Label>
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
            </div>
          </div>
        </TabsContent>

        <TabsContent value="hours" className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Weekly Operating Hours</h3>
            <div className="space-y-3">
              {DAYS_OF_WEEK.map((day, index) => {
                const hours = location?.operatingHours.find(h => h.dayOfWeek === index);
                return (
                  <div key={day} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm font-medium w-24">{day}</span>
                    {hours?.isOpen ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
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
          </div>
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
                          ? `${area.staffingRatios[0].ratioNumerator}:${area.staffingRatios[0].ratioDenominator}`
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
