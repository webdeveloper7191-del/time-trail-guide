import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, Users, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { StaffingRatio } from '@/types/location';

interface AttendanceBand {
  id: string;
  minAttendance: number;
  maxAttendance: number;
  staffRequired: number;
}

interface StaffingRatioEditorProps {
  ratios: StaffingRatio[];
  onUpdate: (ratios: StaffingRatio[]) => void;
  isEditing: boolean;
  demandUnit?: string;
  isLocationLevel?: boolean;
}

const StaffingRatioEditor: React.FC<StaffingRatioEditorProps> = ({
  ratios,
  onUpdate,
  isEditing,
  demandUnit = 'Units',
  isLocationLevel = false,
}) => {
  const [editingRatioId, setEditingRatioId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Partial<StaffingRatio> & { bands?: AttendanceBand[] }>({
    name: '',
    demandUnit: demandUnit,
    minAttendance: 1,
    maxAttendance: 4,
    staffRequired: 1,
    isDefault: false,
    notes: '',
    bands: [],
  });

  // Convert bands to individual ratios for storage
  const bandsToRatios = (name: string, demandUnit: string, bands: AttendanceBand[], isDefault: boolean, notes?: string): StaffingRatio[] => {
    if (bands.length === 0) {
      return [{
        id: `ratio-${Date.now()}`,
        name,
        demandUnit,
        minAttendance: formData.minAttendance || 1,
        maxAttendance: formData.maxAttendance || 4,
        staffRequired: formData.staffRequired || 1,
        isDefault,
        notes,
      }];
    }
    return bands.map((band, index) => ({
      id: `ratio-${Date.now()}-${index}`,
      name: bands.length > 1 ? `${name} (Band ${index + 1})` : name,
      demandUnit,
      minAttendance: band.minAttendance,
      maxAttendance: band.maxAttendance,
      staffRequired: band.staffRequired,
      isDefault: index === 0 ? isDefault : false,
      notes: index === 0 ? notes : undefined,
    }));
  };

  const addBand = () => {
    const lastBand = formData.bands && formData.bands.length > 0 
      ? formData.bands[formData.bands.length - 1]
      : { maxAttendance: formData.maxAttendance || 4 };
    
    const newBand: AttendanceBand = {
      id: `band-${Date.now()}`,
      minAttendance: lastBand.maxAttendance + 1,
      maxAttendance: lastBand.maxAttendance + 5,
      staffRequired: (formData.bands?.length || 0) + 2,
    };
    
    setFormData({
      ...formData,
      bands: [...(formData.bands || []), newBand],
    });
  };

  const updateBand = (bandId: string, field: keyof AttendanceBand, value: number) => {
    setFormData({
      ...formData,
      bands: formData.bands?.map(b => 
        b.id === bandId ? { ...b, [field]: value } : b
      ),
    });
  };

  const removeBand = (bandId: string) => {
    setFormData({
      ...formData,
      bands: formData.bands?.filter(b => b.id !== bandId),
    });
  };

  const handleAddRatio = () => {
    const hasBands = formData.bands && formData.bands.length > 0;
    const newRatios = hasBands 
      ? bandsToRatios(
          formData.name || 'New Ratio',
          formData.demandUnit || demandUnit,
          formData.bands!,
          formData.isDefault || false,
          formData.notes
        )
      : [{
          id: `ratio-${Date.now()}`,
          name: formData.name || 'New Ratio',
          demandUnit: formData.demandUnit || demandUnit,
          minAttendance: formData.minAttendance || 1,
          maxAttendance: formData.maxAttendance || 4,
          staffRequired: formData.staffRequired || 1,
          isDefault: formData.isDefault || false,
          notes: formData.notes,
        }];
    
    let updatedRatios = [...ratios];
    if (formData.isDefault) {
      updatedRatios = updatedRatios.map(r => ({ ...r, isDefault: false }));
    }
    
    onUpdate([...updatedRatios, ...newRatios]);
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
          minAttendance: formData.minAttendance ?? r.minAttendance,
          maxAttendance: formData.maxAttendance ?? r.maxAttendance,
          staffRequired: formData.staffRequired ?? r.staffRequired,
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
      minAttendance: ratio.minAttendance,
      maxAttendance: ratio.maxAttendance,
      staffRequired: ratio.staffRequired,
      isDefault: ratio.isDefault,
      notes: ratio.notes,
      bands: [],
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      demandUnit: demandUnit,
      minAttendance: 1,
      maxAttendance: 4,
      staffRequired: 1,
      isDefault: false,
      notes: '',
      bands: [],
    });
  };

  const RatioForm = ({ onSave, onCancel, isEditMode = false }: { onSave: () => void; onCancel: () => void; isEditMode?: boolean }) => (
    <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Ratio Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={isLocationLevel ? "e.g., Under Roof Standard" : "e.g., Standard, Peak Hours"}
          />
        </div>
        <div className="space-y-2">
          <Label>{isLocationLevel ? 'Unit Type' : 'Demand Unit'}</Label>
          <Input
            value={formData.demandUnit}
            onChange={(e) => setFormData({ ...formData, demandUnit: e.target.value })}
            placeholder={isLocationLevel ? "e.g., Total Children" : "e.g., Children, Patients"}
          />
        </div>
      </div>
      
      {/* Base attendance band */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Attendance Bands
          </h4>
          {!isEditMode && (
            <Button type="button" variant="outline" size="sm" onClick={addBand}>
              <Plus className="h-3 w-3 mr-1" />
              Add Band
            </Button>
          )}
        </div>
        
        {/* First/Base band */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Band 1</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Min {formData.demandUnit || demandUnit}</Label>
              <Input
                type="number"
                min={0}
                value={formData.minAttendance}
                onChange={(e) => setFormData({ ...formData, minAttendance: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Max {formData.demandUnit || demandUnit}</Label>
              <Input
                type="number"
                min={1}
                value={formData.maxAttendance}
                onChange={(e) => setFormData({ ...formData, maxAttendance: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Staff Required</Label>
              <Input
                type="number"
                min={1}
                value={formData.staffRequired}
                onChange={(e) => setFormData({ ...formData, staffRequired: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
            <span className="font-medium">{formData.minAttendance} - {formData.maxAttendance}</span> {(formData.demandUnit || demandUnit).toLowerCase()} → <span className="font-medium">{formData.staffRequired}</span> staff
          </div>
        </div>
        
        {/* Additional stacked bands */}
        {formData.bands && formData.bands.map((band, index) => (
          <div key={band.id} className="bg-card border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Band {index + 2}</span>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => removeBand(band.id)}
                className="h-6 w-6 p-0"
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Min {formData.demandUnit || demandUnit}</Label>
                <Input
                  type="number"
                  min={0}
                  value={band.minAttendance}
                  onChange={(e) => updateBand(band.id, 'minAttendance', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Max {formData.demandUnit || demandUnit}</Label>
                <Input
                  type="number"
                  min={1}
                  value={band.maxAttendance}
                  onChange={(e) => updateBand(band.id, 'maxAttendance', parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Staff Required</Label>
                <Input
                  type="number"
                  min={1}
                  value={band.staffRequired}
                  onChange={(e) => updateBand(band.id, 'staffRequired', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
            <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
              <span className="font-medium">{band.minAttendance} - {band.maxAttendance}</span> {(formData.demandUnit || demandUnit).toLowerCase()} → <span className="font-medium">{band.staffRequired}</span> staff
            </div>
          </div>
        ))}
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
          <h3 className="text-sm font-semibold text-foreground">{isLocationLevel ? 'Under the Roof Ratios' : 'Staffing Ratios'}</h3>
          <p className="text-xs text-muted-foreground">{isLocationLevel ? 'Location-wide staffing requirements based on total attendance' : 'Configure staff-to-demand ratios for compliance'}</p>
        </div>
        {isEditing && !showAddForm && (
          <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add {isLocationLevel ? 'Under Roof Ratio' : 'Ratio'}
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
                  isEditMode={true}
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
                      <Badge variant="outline" className="text-sm font-medium px-3 py-1">
                        {ratio.minAttendance}-{ratio.maxAttendance} → {ratio.staffRequired} staff
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
                    {ratio.minAttendance} to {ratio.maxAttendance} {ratio.demandUnit.toLowerCase()} requires {ratio.staffRequired} staff
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
          <p className="text-sm text-muted-foreground">{isLocationLevel ? 'No under the roof ratios configured' : 'No staffing ratios configured'}</p>
          {isEditing && (
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First {isLocationLevel ? 'Under Roof Ratio' : 'Ratio'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default StaffingRatioEditor;