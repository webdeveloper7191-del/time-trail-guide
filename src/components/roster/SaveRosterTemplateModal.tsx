import { useState } from 'react';
import {
  TextField,
  Checkbox,
  Box,
  Typography,
} from '@mui/material';
import { Shift, Room } from '@/types/roster';
import { RosterTemplate, RosterTemplateShift } from '@/types/rosterTemplates';
import { format } from 'date-fns';
import { Save, FileText, Clock, Users } from 'lucide-react';
import PrimaryOffCanvas, { OffCanvasAction } from '@/components/ui/off-canvas/PrimaryOffCanvas';

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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Template Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Standard Week, Holiday Roster"
          size="small"
          fullWidth
        />

        <TextField
          label="Description (Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe when to use this template..."
          size="small"
          fullWidth
          multiline
          rows={2}
        />

        <Box>
          <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Include Rooms</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
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
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    bgcolor: isSelected ? 'rgba(3, 169, 244, 0.08)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease-in-out',
                    '&:hover': { 
                      bgcolor: isSelected ? 'rgba(3, 169, 244, 0.12)' : 'action.hover',
                      borderColor: isSelected ? 'primary.main' : 'primary.light',
                    },
                  }}
                >
                  <Checkbox checked={isSelected} size="small" color="primary" />
                  <Typography variant="body2" fontWeight={isSelected ? 600 : 400} color={isSelected ? 'primary.main' : 'text.primary'}>
                    {room.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                    {groupedShifts[room.id] || 0} shifts
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        <Box
          onClick={() => setIncludeStaffPreferences(!includeStaffPreferences)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1.5,
            bgcolor: 'action.hover',
            borderRadius: 1,
            cursor: 'pointer',
          }}
        >
          <Checkbox checked={includeStaffPreferences} size="small" />
          <Typography variant="body2">Include staff role preferences</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 1.5, bgcolor: 'rgba(3, 169, 244, 0.08)', borderRadius: 1.5, border: 1, borderColor: 'primary.main' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <FileText size={16} style={{ color: 'var(--mui-palette-primary-main)' }} />
            <Typography variant="body2">{relevantShifts.length} shifts</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Clock size={16} style={{ color: 'var(--mui-palette-primary-main)' }} />
            <Typography variant="body2">{dates.length} days</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Users size={16} style={{ color: 'var(--mui-palette-primary-main)' }} />
            <Typography variant="body2">{selectedRooms.length} rooms</Typography>
          </Box>
        </Box>
      </Box>
    </PrimaryOffCanvas>
  );
}
