import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Checkbox,
  Chip,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { Shift, Room } from '@/types/roster';
import { RosterTemplate, RosterTemplateShift } from '@/types/rosterTemplates';
import { format } from 'date-fns';
import { Save, FileText, Clock, Users } from 'lucide-react';
import CloseIcon from '@mui/icons-material/Close';

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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Save className="h-5 w-5" style={{ color: 'var(--mui-palette-primary-main)' }} />
          <Typography variant="h6">Save as Roster Template</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Save the current week's shifts as a reusable template
        </Typography>

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
              {rooms.map(room => (
                <Box
                  key={room.id}
                  onClick={() => toggleRoom(room.id)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    borderRadius: 1,
                    border: 1,
                    borderColor: 'divider',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Checkbox checked={selectedRooms.includes(room.id)} size="small" />
                  <Typography variant="body2">{room.name}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                    {groupedShifts[room.id] || 0} shifts
                  </Typography>
                </Box>
              ))}
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

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 1.5, bgcolor: 'primary.light', borderRadius: 1 }}>
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
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" onClick={onClose}>Cancel</Button>
        <Button 
          variant="contained"
          onClick={handleSave} 
          disabled={!name.trim() || relevantShifts.length === 0}
          startIcon={<Save size={16} />}
        >
          Save Template
        </Button>
      </DialogActions>
    </Dialog>
  );
}
