import { useState } from 'react';
import {
  Checkbox,
  Box,
  Typography,
} from '@mui/material';
import { Shift, Room } from '@/types/roster';
import { RosterTemplate, RosterTemplateShift } from '@/types/rosterTemplates';
import { format } from 'date-fns';
import { Save, FileText, Clock, Users } from 'lucide-react';
import PrimaryOffCanvas, { OffCanvasAction } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection, FormField } from '@/components/ui/off-canvas/FormSection';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { StyledSwitch } from '@/components/ui/StyledSwitch';

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
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
            {rooms.map(room => {
              const isSelected = selectedRooms.includes(room.id);
              return (
                <Box
                  key={room.id}
                  onClick={() => toggleRoom(room.id)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1.5,
                    borderRadius: 1.5,
                    border: 1,
                    borderColor: isSelected ? 'hsl(var(--primary))' : 'divider',
                    bgcolor: isSelected ? 'rgba(3, 169, 244, 0.08)' : 'background.paper',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease-in-out',
                    '&:hover': { 
                      bgcolor: isSelected ? 'rgba(3, 169, 244, 0.12)' : 'action.hover',
                      borderColor: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.5)',
                    },
                  }}
                >
                  <Checkbox 
                    checked={isSelected} 
                    size="small" 
                    sx={{
                      color: 'hsl(var(--primary))',
                      '&.Mui-checked': { color: 'hsl(var(--primary))' },
                    }}
                  />
                  <Typography variant="body2" fontWeight={isSelected ? 600 : 400} color={isSelected ? 'hsl(var(--primary))' : 'text.primary'}>
                    {room.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                    {groupedShifts[room.id] || 0} shifts
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </FormSection>

        {/* Options */}
        <FormSection title="Options">
          <div className="bg-background rounded-lg border p-3">
            <StyledSwitch
              checked={includeStaffPreferences}
              onChange={setIncludeStaffPreferences}
              label="Include staff role preferences"
            />
          </div>
        </FormSection>

        {/* Summary */}
        <div className="flex items-center gap-4 p-3 bg-primary/5 border border-primary rounded-lg">
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
      </div>
    </PrimaryOffCanvas>
  );
}
