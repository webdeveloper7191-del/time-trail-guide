import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Chip,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { Shift, StaffMember, roleLabels, qualificationLabels } from '@/types/roster';
import { ArrowLeftRight, Search, AlertTriangle, Check, Clock, User } from 'lucide-react';
import CloseIcon from '@mui/icons-material/Close';

interface ShiftSwapModalProps {
  open: boolean;
  onClose: () => void;
  shift: Shift;
  staff: StaffMember[];
  allShifts: Shift[];
  onSwap: (fromShift: Shift, toStaffId: string) => void;
}

export function ShiftSwapModal({ open, onClose, shift, staff, allShifts, onSwap }: ShiftSwapModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  const currentStaff = staff.find(s => s.id === shift.staffId);

  const eligibleStaff = useMemo(() => {
    return staff.filter(s => {
      if (s.id === shift.staffId) return false;
      const shiftDate = new Date(shift.date);
      const dayOfWeek = shiftDate.getDay();
      const availability = s.availability.find(a => a.dayOfWeek === dayOfWeek);
      if (!availability?.available) return false;
      const hasConflict = allShifts.some(existingShift => 
        existingShift.staffId === s.id && 
        existingShift.date === shift.date &&
        existingShift.id !== shift.id
      );
      if (hasConflict) return false;
      const shiftHours = calculateShiftHours(shift);
      if (s.currentWeeklyHours + shiftHours > s.maxHoursPerWeek + 2) return false;
      return true;
    }).filter(s => {
      if (!searchQuery) return true;
      return s.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [staff, shift, allShifts, searchQuery]);

  const calculateShiftHours = (s: Shift) => {
    const [startH, startM] = s.startTime.split(':').map(Number);
    const [endH, endM] = s.endTime.split(':').map(Number);
    return ((endH * 60 + endM) - (startH * 60 + startM) - s.breakMinutes) / 60;
  };

  const getConflicts = (staffId: string) => {
    const conflicts: string[] = [];
    const member = staff.find(s => s.id === staffId);
    if (!member) return conflicts;
    const shiftHours = calculateShiftHours(shift);
    const newTotalHours = member.currentWeeklyHours + shiftHours;
    if (newTotalHours > member.maxHoursPerWeek) {
      conflicts.push(`Will result in ${Math.round((newTotalHours - member.maxHoursPerWeek) * 10) / 10}h overtime`);
    }
    return conflicts;
  };

  const handleSwap = () => {
    if (selectedStaffId) {
      onSwap(shift, selectedStaffId);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ArrowLeftRight className="h-5 w-5" style={{ color: 'var(--mui-palette-primary-main)' }} />
          <Typography variant="h6">Swap Shift</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Current Assignment */}
        <Box sx={{ p: 2, borderRadius: 1, bgcolor: 'action.hover', border: 1, borderColor: 'divider', mb: 2 }}>
          <Typography variant="caption" color="text.secondary">Current Assignment</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1 }}>
            <Box sx={{ height: 40, width: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.875rem', fontWeight: 500, bgcolor: currentStaff?.color }}>
              {currentStaff?.name.split(' ').map(n => n[0]).join('')}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" fontWeight={500}>{currentStaff?.name}</Typography>
              <Typography variant="body2" color="text.secondary">{currentStaff && roleLabels[currentStaff.role]}</Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" fontWeight={500}>{shift.startTime} - {shift.endTime}</Typography>
              <Typography variant="body2" color="text.secondary">{shift.date}</Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <ArrowLeftRight size={20} style={{ opacity: 0.5 }} />
        </Box>

        <TextField
          placeholder="Search staff to swap with..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          fullWidth
          InputProps={{ startAdornment: <Search size={16} style={{ marginRight: 8, opacity: 0.5 }} /> }}
          sx={{ mb: 2 }}
        />

        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
          {eligibleStaff.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, color: 'text.secondary' }}>
              <User size={48} style={{ opacity: 0.2, marginBottom: 8 }} />
              <Typography variant="body2" align="center">No eligible staff found for this shift</Typography>
            </Box>
          ) : (
            eligibleStaff.map((member) => {
              const conflicts = getConflicts(member.id);
              const hoursRemaining = member.maxHoursPerWeek - member.currentWeeklyHours;
              const isSelected = selectedStaffId === member.id;
              return (
                <Box
                  key={member.id}
                  onClick={() => setSelectedStaffId(member.id)}
                  sx={{
                    p: 1.5, mb: 1, borderRadius: 1, border: 2, cursor: 'pointer',
                    borderColor: isSelected ? 'primary.main' : conflicts.length > 0 ? 'warning.main' : 'divider',
                    bgcolor: isSelected ? 'primary.light' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ height: 40, width: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.875rem', fontWeight: 500, flexShrink: 0, bgcolor: member.color }}>
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={500} noWrap>{member.name}</Typography>
                        {isSelected && <Check size={16} style={{ color: 'var(--mui-palette-primary-main)' }} />}
                      </Box>
                      <Typography variant="caption" color="text.secondary">{roleLabels[member.role]} • ${member.hourlyRate}/hr</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: hoursRemaining <= 0 ? 'error.main' : 'text.secondary' }}>
                        <Clock size={12} />
                        <Typography variant="caption">{hoursRemaining}h available this week</Typography>
                      </Box>
                    </Box>
                  </Box>
                  {conflicts.length > 0 && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: 'warning.light', borderRadius: 0.5, display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                      <AlertTriangle size={14} />
                      <Typography variant="caption">{conflicts.join(', ')}</Typography>
                    </Box>
                  )}
                </Box>
              );
            })
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSwap} disabled={!selectedStaffId} startIcon={<ArrowLeftRight size={16} />}>
          Confirm Swap
        </Button>
      </DialogActions>
    </Dialog>
  );
}
