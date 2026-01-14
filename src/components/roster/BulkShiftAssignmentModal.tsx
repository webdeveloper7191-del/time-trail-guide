import { useState, useMemo } from 'react';
import {
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Chip,
  Tabs,
  Tab,
  Box,
  Typography,
} from '@mui/material';
import { Shift, Room, StaffMember, ShiftTemplate, defaultShiftTemplates, roleLabels } from '@/types/roster';
import { format } from 'date-fns';
import { Users, Calendar, Clock, Plus, Check, AlertTriangle, UserPlus } from 'lucide-react';
import PrimaryOffCanvas, { OffCanvasAction } from '@/components/ui/off-canvas/PrimaryOffCanvas';

interface BulkShiftAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  staff: StaffMember[];
  rooms: Room[];
  dates: Date[];
  centreId: string;
  shiftTemplates: ShiftTemplate[];
  existingShifts: Shift[];
  onAssign: (shifts: Omit<Shift, 'id'>[]) => void;
}

export function BulkShiftAssignmentModal({
  open,
  onClose,
  staff,
  rooms,
  dates,
  centreId,
  shiftTemplates,
  existingShifts,
  onAssign
}: BulkShiftAssignmentModalProps) {
  const [tabValue, setTabValue] = useState(0);
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [assignmentMode, setAssignmentMode] = useState<'all-to-all' | 'round-robin'>('all-to-all');

  const allTemplates = [...defaultShiftTemplates, ...shiftTemplates];
  const selectedTemplate = allTemplates.find(t => t.id === selectedTemplateId);

  const availableStaff = useMemo(() => {
    return staff.filter(s => 
      s.preferredCentres.includes(centreId) || s.preferredCentres.length === 0
    );
  }, [staff, centreId]);

  const previewShifts = useMemo(() => {
    if (!selectedRoomId || !selectedTemplate || selectedStaff.size === 0 || selectedDates.size === 0) {
      return [];
    }

    const staffArray = Array.from(selectedStaff);
    const dateArray = Array.from(selectedDates);
    const shifts: { staffId: string; date: string; hasConflict: boolean }[] = [];

    if (assignmentMode === 'all-to-all') {
      for (const date of dateArray) {
        for (const staffId of staffArray) {
          const hasConflict = existingShifts.some(s => 
            s.staffId === staffId && 
            s.date === date &&
            s.roomId === selectedRoomId
          );
          shifts.push({ staffId, date, hasConflict });
        }
      }
    } else {
      dateArray.forEach((date, idx) => {
        const staffId = staffArray[idx % staffArray.length];
        const hasConflict = existingShifts.some(s => 
          s.staffId === staffId && 
          s.date === date &&
          s.roomId === selectedRoomId
        );
        shifts.push({ staffId, date, hasConflict });
      });
    }

    return shifts;
  }, [selectedStaff, selectedDates, selectedRoomId, selectedTemplate, assignmentMode, existingShifts]);

  const shiftsWithoutConflicts = previewShifts.filter(s => !s.hasConflict);

  const handleAssign = () => {
    if (!selectedTemplate) return;

    const newShifts: Omit<Shift, 'id'>[] = shiftsWithoutConflicts.map(preview => ({
      staffId: preview.staffId,
      centreId,
      roomId: selectedRoomId,
      date: preview.date,
      startTime: selectedTemplate.startTime,
      endTime: selectedTemplate.endTime,
      breakMinutes: selectedTemplate.breakMinutes,
      status: 'draft',
      isOpenShift: false,
    }));

    onAssign(newShifts);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setSelectedStaff(new Set());
    setSelectedDates(new Set());
    setSelectedRoomId('');
    setSelectedTemplateId('');
    setTabValue(0);
  };

  const toggleStaff = (staffId: string) => {
    setSelectedStaff(prev => {
      const next = new Set(prev);
      if (next.has(staffId)) next.delete(staffId);
      else next.add(staffId);
      return next;
    });
  };

  const toggleDate = (date: string) => {
    setSelectedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const selectAllStaff = () => setSelectedStaff(new Set(availableStaff.map(s => s.id)));
  const deselectAllStaff = () => setSelectedStaff(new Set());
  const selectAllDates = () => setSelectedDates(new Set(dates.map(d => format(d, 'yyyy-MM-dd'))));
  const deselectAllDates = () => setSelectedDates(new Set());

  const getStaffName = (staffId: string) => staff.find(s => s.id === staffId)?.name || staffId;

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const actions: OffCanvasAction[] = [
    {
      label: 'Cancel',
      variant: 'outlined',
      onClick: handleClose,
    },
    {
      label: `Create ${shiftsWithoutConflicts.length} Shifts`,
      variant: 'primary',
      onClick: handleAssign,
      disabled: shiftsWithoutConflicts.length === 0,
      icon: <Plus size={16} />,
    },
  ];

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={handleClose}
      title="Bulk Shift Assignment"
      description="Create multiple shifts at once by selecting staff, dates, and shift template"
      icon={UserPlus}
      size="lg"
      actions={actions}
    >
      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} variant="fullWidth" sx={{ mb: 2 }}>
        <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Users size={14} />Staff ({selectedStaff.size})</Box>} />
        <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Calendar size={14} />Dates ({selectedDates.size})</Box>} />
        <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Clock size={14} />Shift</Box>} />
        <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Check size={14} />Preview</Box>} />
      </Tabs>

      {tabValue === 0 && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" fontWeight={500}>Select Staff Members</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="text" onClick={selectAllStaff}>Select All</Button>
              <Button size="small" variant="text" onClick={deselectAllStaff}>Clear</Button>
            </Box>
          </Box>
          <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
            {availableStaff.map(member => {
              const isSelected = selectedStaff.has(member.id);
              return (
                <Box
                  key={member.id}
                  onClick={() => toggleStaff(member.id)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    cursor: 'pointer',
                    bgcolor: isSelected ? 'rgba(3, 169, 244, 0.08)' : 'transparent',
                    borderBottom: 1,
                    borderColor: 'divider',
                    transition: 'all 0.15s ease-in-out',
                    '&:hover': { 
                      bgcolor: isSelected ? 'rgba(3, 169, 244, 0.12)' : 'action.hover',
                    },
                    '&:last-child': { borderBottom: 0 },
                  }}
                >
                  <Checkbox checked={isSelected} size="small" color="primary" />
                  <Box
                    sx={{
                      height: 32,
                      width: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      bgcolor: member.color,
                    }}
                  >
                    {member.name.charAt(0)}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={isSelected ? 600 : 500} color={isSelected ? 'primary.main' : 'text.primary'}>
                      {member.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {roleLabels[member.role]} • {member.currentWeeklyHours}/{member.maxHoursPerWeek}h
                    </Typography>
                  </Box>
                  <Chip 
                    size="small" 
                    label={`$${member.hourlyRate}/hr`} 
                    variant={isSelected ? 'filled' : 'outlined'}
                    color={isSelected ? 'primary' : 'default'}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" fontWeight={500}>Select Dates</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="text" onClick={selectAllDates}>Select All</Button>
              <Button size="small" variant="text" onClick={deselectAllDates}>Clear</Button>
            </Box>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
            {dates.map(date => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const isSelected = selectedDates.has(dateStr);
              return (
                <Box
                  key={dateStr}
                  onClick={() => toggleDate(dateStr)}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 1.5,
                    borderRadius: 1.5,
                    border: 2,
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    bgcolor: isSelected ? 'rgba(3, 169, 244, 0.08)' : 'transparent',
                    boxShadow: isSelected ? '0 0 0 3px rgba(3, 169, 244, 0.12)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease-in-out',
                    '&:hover': { 
                      bgcolor: isSelected ? 'rgba(3, 169, 244, 0.12)' : 'action.hover',
                      borderColor: isSelected ? 'primary.main' : 'primary.light',
                    },
                  }}
                >
                  <Typography variant="caption" color={isSelected ? 'primary.main' : 'text.secondary'}>{format(date, 'EEE')}</Typography>
                  <Typography variant="h6" fontWeight={isSelected ? 700 : 500} color={isSelected ? 'primary.main' : 'text.primary'}>{format(date, 'd')}</Typography>
                  <Typography variant="caption" color={isSelected ? 'primary.main' : 'text.secondary'}>{format(date, 'MMM')}</Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {tabValue === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Room</InputLabel>
            <Select value={selectedRoomId} label="Room" onChange={(e) => setSelectedRoomId(e.target.value)}>
              {rooms.map(room => (
                <MenuItem key={room.id} value={room.id}>{room.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Shift Template</InputLabel>
            <Select value={selectedTemplateId} label="Shift Template" onChange={(e) => setSelectedTemplateId(e.target.value)}>
              {allTemplates.map(template => (
                <MenuItem key={template.id} value={template.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ height: 12, width: 12, borderRadius: '50%', bgcolor: template.color }} />
                    <span>{template.name}</span>
                    <Typography variant="caption" color="text.secondary">
                      ({template.startTime} - {template.endTime})
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Assignment Mode</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
              {(['all-to-all', 'round-robin'] as const).map(mode => {
                const isSelected = assignmentMode === mode;
                return (
                  <Box
                    key={mode}
                    onClick={() => setAssignmentMode(mode)}
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      border: 2,
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      bgcolor: isSelected ? 'rgba(3, 169, 244, 0.08)' : 'transparent',
                      boxShadow: isSelected ? '0 0 0 3px rgba(3, 169, 244, 0.12)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease-in-out',
                      '&:hover': {
                        bgcolor: isSelected ? 'rgba(3, 169, 244, 0.12)' : 'action.hover',
                        borderColor: isSelected ? 'primary.main' : 'primary.light',
                      },
                    }}
                  >
                    <Typography variant="body2" fontWeight={isSelected ? 600 : 500} color={isSelected ? 'primary.main' : 'text.primary'}>
                      {mode === 'all-to-all' ? 'All to All' : 'Round Robin'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {mode === 'all-to-all' 
                        ? 'Every staff gets a shift on every date'
                        : 'Distribute dates evenly among staff'}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      )}

      {tabValue === 3 && (
        <Box>
          {previewShifts.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, color: 'text.secondary' }}>
              <Users size={48} style={{ opacity: 0.2, marginBottom: 8 }} />
              <Typography variant="body2">Select staff, dates, and shift template to preview</Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main' }}>
                  <Plus size={16} />
                  <Typography variant="body2">{shiftsWithoutConflicts.length} shifts to create</Typography>
                </Box>
                {previewShifts.some(s => s.hasConflict) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'warning.main' }}>
                    <AlertTriangle size={16} />
                    <Typography variant="body2">{previewShifts.filter(s => s.hasConflict).length} conflicts</Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                {previewShifts.map((preview, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1,
                      bgcolor: preview.hasConflict ? 'warning.light' : 'success.light',
                      opacity: preview.hasConflict ? 0.6 : 1,
                      borderBottom: idx < previewShifts.length - 1 ? 1 : 0,
                      borderColor: 'divider',
                    }}
                  >
                    {preview.hasConflict ? <AlertTriangle size={16} /> : <Check size={16} />}
                    <Typography variant="body2" fontWeight={500}>{getStaffName(preview.staffId)}</Typography>
                    <Typography variant="body2" color="text.secondary">→</Typography>
                    <Typography variant="body2">{format(new Date(preview.date), 'EEE d MMM')}</Typography>
                    <Chip 
                      size="small" 
                      label={preview.hasConflict ? 'Conflict' : 'Will Add'}
                      color={preview.hasConflict ? 'warning' : 'success'}
                      variant={preview.hasConflict ? 'outlined' : 'filled'}
                      sx={{ ml: 'auto' }}
                    />
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Box>
      )}
    </PrimaryOffCanvas>
  );
}
