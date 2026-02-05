import React, { useState } from 'react';
import { Layers, Users, Shield, Clock, Plus, Trash2, Save, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { Area, Location, AREA_STATUS_LABELS, StaffingRatio, QualificationRequirement } from '@/types/location';

interface AreaDetailPanelProps {
  open: boolean;
  onClose: () => void;
  area: Area | null;
  isNew: boolean;
  location: Location | null;
}

const AreaDetailPanel: React.FC<AreaDetailPanelProps> = ({
  open,
  onClose,
  area,
  isNew,
  location,
}) => {
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(isNew);
  
  const [formData, setFormData] = useState({
    name: area?.name || '',
    code: area?.code || '',
    status: area?.status || 'active',
    color: area?.color || 'hsl(200, 70%, 50%)',
    capacity: area?.capacity || 0,
    ageGroup: area?.ageGroup || '',
    serviceType: area?.serviceType || '',
    minimumStaff: area?.minimumStaff || 1,
    maximumStaff: area?.maximumStaff || 10,
  });

  const handleSave = () => {
    toast.success(isNew ? 'Area created successfully' : 'Area updated successfully');
    setIsEditing(false);
    onClose();
  };

  const actions = isEditing ? [
    { label: 'Cancel', onClick: () => isNew ? onClose() : setIsEditing(false), variant: 'outlined' as const },
    { label: 'Save Area', onClick: handleSave, variant: 'primary' as const, icon: <Save className="h-4 w-4" /> },
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
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Area Name</Label>
                {isEditing ? (
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter area name"
                  />
                ) : (
                  <p className="text-sm font-medium">{area?.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Area Code</Label>
                {isEditing ? (
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., NUR"
                  />
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
                <Label>Age Group / Category</Label>
                {isEditing ? (
                  <Input
                    value={formData.ageGroup}
                    onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                    placeholder="e.g., Nursery (0-2)"
                  />
                ) : (
                  <p className="text-sm font-medium">{area?.ageGroup || 'Not set'}</p>
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
                <Label>Capacity</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                  />
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
                <Label>Minimum Staff</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={formData.minimumStaff}
                    onChange={(e) => setFormData({ ...formData, minimumStaff: parseInt(e.target.value) || 1 })}
                  />
                ) : (
                  <p className="text-sm font-medium">{area?.minimumStaff}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Maximum Staff</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={formData.maximumStaff}
                    onChange={(e) => setFormData({ ...formData, maximumStaff: parseInt(e.target.value) || 10 })}
                  />
                ) : (
                  <p className="text-sm font-medium">{area?.maximumStaff || 'No limit'}</p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ratios" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Staffing Ratios</h3>
              <p className="text-xs text-muted-foreground">Configure staff-to-demand ratios for compliance</p>
            </div>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Ratio
            </Button>
          </div>

          {area?.staffingRatios && area.staffingRatios.length > 0 ? (
            <div className="space-y-3">
              {area.staffingRatios.map((ratio: StaffingRatio) => (
                <div key={ratio.id} className="bg-card border border-border rounded-lg p-4">
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
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {ratio.ratioNumerator} staff per {ratio.ratioDenominator} {ratio.demandUnit.toLowerCase()}
                  </p>
                  {ratio.notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic">{ratio.notes}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed border-border">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No staffing ratios configured</p>
              <Button size="sm" variant="outline" className="mt-3">
                <Plus className="h-4 w-4 mr-2" />
                Add First Ratio
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="qualifications" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Qualification Requirements</h3>
              <p className="text-xs text-muted-foreground">Define required qualifications for this area</p>
            </div>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Requirement
            </Button>
          </div>

          {area?.qualificationRequirements && area.qualificationRequirements.length > 0 ? (
            <div className="space-y-3">
              {area.qualificationRequirements.map((req: QualificationRequirement) => (
                <div key={req.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{req.qualificationName}</h4>
                        <Badge 
                          variant={req.requirementType === 'mandatory' ? 'default' : 'outline'}
                          className={cn(
                            'text-xs',
                            req.requirementType === 'mandatory' && 'bg-red-500 text-white',
                            req.requirementType === 'percentage' && 'bg-amber-100 text-amber-700',
                          )}
                        >
                          {req.requirementType === 'mandatory' ? 'Mandatory' : 
                           req.requirementType === 'percentage' ? `${req.percentageRequired}% Required` : 
                           'Preferred'}
                        </Badge>
                      </div>
                      {req.notes && (
                        <p className="text-xs text-muted-foreground">{req.notes}</p>
                      )}
                    </div>
                    <Badge variant="secondary">{req.qualificationShortName}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed border-border">
              <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No qualification requirements</p>
              <Button size="sm" variant="outline" className="mt-3">
                <Plus className="h-4 w-4 mr-2" />
                Add First Requirement
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Compliance Rules</h3>
              <p className="text-xs text-muted-foreground">Automated compliance checking rules</p>
            </div>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </div>

          {area?.complianceRules && area.complianceRules.length > 0 ? (
            <div className="space-y-3">
              {area.complianceRules.map(rule => (
                <div key={rule.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{rule.name}</h4>
                    <Badge 
                      variant={rule.severity === 'critical' ? 'destructive' : 'outline'}
                      className={cn(
                        'text-xs',
                        rule.severity === 'warning' && 'bg-amber-100 text-amber-700',
                      )}
                    >
                      {rule.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{rule.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed border-border">
              <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No compliance rules configured</p>
              <Button size="sm" variant="outline" className="mt-3">
                <Plus className="h-4 w-4 mr-2" />
                Add First Rule
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PrimaryOffCanvas>
  );
};

export default AreaDetailPanel;
