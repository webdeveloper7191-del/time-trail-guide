import { useState } from 'react';
import { Shift, Room } from '@/types/roster';
import { Checkbox } from '@/components/ui/checkbox';
import { RosterTemplate, RosterTemplateShift } from '@/types/rosterTemplates';
import { format } from 'date-fns';
import { Save, FileText, Clock, Users } from 'lucide-react';
import PrimaryOffCanvas, { OffCanvasAction } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection, FormField, FormRow } from '@/components/ui/off-canvas/FormSection';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { StyledSwitch } from '@/components/ui/StyledSwitch';
import { cn } from '@/lib/utils';

interface SaveRosterTemplateModalProps {
  open: boolean;
  onClose: () => void;
  shifts: Shift[];
  rooms: Room[];
  centreId: string;
  dates: Date[];
  onSave: (template: Omit<RosterTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function SaveRosterTemplateModal({
  open,
  onClose,
  shifts,
  rooms,
  centreId,
  dates,
  onSave
}: SaveRosterTemplateModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedRooms, setSelectedRooms] = useState<string[]>(rooms.map(r => r.id));
  const [includeStaffPreferences, setIncludeStaffPreferences] = useState(false);

  const relevantShifts = shifts.filter(s => 
    s.centreId === centreId && 
    selectedRooms.includes(s.roomId) &&
    dates.some(d => format(d, 'yyyy-MM-dd') === s.date)
  );

  const handleSave = () => {
    if (!name.trim()) return;

    const templateShifts: RosterTemplateShift[] = relevantShifts.map(shift => {
      const shiftDate = new Date(shift.date);
      return {
        id: `ts-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        roomId: shift.roomId,
        dayOfWeek: shiftDate.getDay(),
        startTime: shift.startTime,
        endTime: shift.endTime,
        breakMinutes: shift.breakMinutes,
        notes: shift.notes,
      };
    });

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      centreId,
      shifts: templateShifts,
    });

    setName('');
    setDescription('');
    onClose();
  };

  const toggleRoom = (roomId: string) => {
    setSelectedRooms(prev => 
      prev.includes(roomId) 
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    );
  };

  const groupedShifts = rooms.reduce((acc, room) => {
    acc[room.id] = relevantShifts.filter(s => s.roomId === room.id).length;
    return acc;
  }, {} as Record<string, number>);

  const actions: OffCanvasAction[] = [
    { label: 'Cancel', onClick: onClose, variant: 'outlined' },
    { 
      label: 'Save Template', 
      onClick: handleSave, 
      variant: 'primary',
      disabled: !name.trim() || relevantShifts.length === 0,
      icon: <Save size={16} />
    },
  ];

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Save as Roster Template"
      description="Save the current week's shifts as a reusable template"
      icon={Save}
      size="lg"
      actions={actions}
    >
      <div className="space-y-5">
        {/* Template Details Section */}
        <FormSection title="Template Details">
          <FormField label="Template Name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Standard Week, Holiday Roster"
              className="bg-background"
            />
          </FormField>

          <FormField label="Description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe when to use this template..."
              rows={2}
              className="bg-background resize-none"
            />
          </FormField>
        </FormSection>

        {/* Rooms Selection */}
        <FormSection title="Include Rooms" tooltip="Select which rooms to include in this template">
          <div className="grid grid-cols-2 gap-3">
            {rooms.map(room => {
              const isSelected = selectedRooms.includes(room.id);
              return (
                <div
                  key={room.id}
                  onClick={() => toggleRoom(room.id)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all",
                    isSelected 
                      ? "border-primary bg-primary/5" 
                      : "border-border bg-background hover:border-primary/50"
                  )}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleRoom(room.id)}
                    className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                  <span className={cn(
                    "text-sm",
                    isSelected ? "font-semibold text-primary" : "text-foreground"
                  )}>
                    {room.name}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {groupedShifts[room.id] || 0} shifts
                  </span>
                </div>
              );
            })}
          </div>
        </FormSection>

        {/* Options */}
        <FormSection title="Options">
          <div className="bg-background rounded-lg border p-4">
            <StyledSwitch
              checked={includeStaffPreferences}
              onChange={setIncludeStaffPreferences}
              label="Include staff role preferences"
            />
          </div>
        </FormSection>

        {/* Summary */}
        <FormSection title="Summary">
          <div className="flex items-center gap-4 p-4 bg-background border rounded-lg">
            <div className="flex items-center gap-1.5">
              <FileText size={16} className="text-primary" />
              <span className="text-sm font-medium">{relevantShifts.length} shifts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={16} className="text-primary" />
              <span className="text-sm font-medium">{dates.length} days</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users size={16} className="text-primary" />
              <span className="text-sm font-medium">{selectedRooms.length} rooms</span>
            </div>
          </div>
        </FormSection>
      </div>
    </PrimaryOffCanvas>
  );
}
