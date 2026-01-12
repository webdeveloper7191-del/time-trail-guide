import { useState, useMemo, useEffect } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  TextField,
  Box,
  Typography,
  FormHelperText,
} from '@mui/material';
import { Shift, StaffMember, roleLabels } from '@/types/roster';
import { ArrowLeftRight, Search, AlertTriangle, Check, Clock, User } from 'lucide-react';
import PrimaryOffCanvas, { OffCanvasAction } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { ScrollArea } from '@/components/ui/scroll-area';
import { shiftSwapSchema, ShiftSwapFormValues } from '@/lib/validationSchemas';
import { toast } from 'sonner';

interface ShiftSwapModalProps {
  open: boolean;
  onClose: () => void;
  shift: Shift | null;
  staff: StaffMember[];
  allShifts: Shift[];
  onSwap: (fromShift: Shift, toStaffId: string) => void;
}

export function ShiftSwapModal({ open, onClose, shift, staff, allShifts, onSwap }: ShiftSwapModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  // Reset state when modal opens/closes or shift changes
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSelectedStaffId(null);
    }
  }, [open, shift?.id]);

  // Guard: Don't render if shift is null
  if (!shift) {
    return null;
  }

  const currentStaff = staff.find(s => s.id === shift.staffId);

  const calculateShiftHours = (s: Shift) => {
    const [startH, startM] = s.startTime.split(':').map(Number);
    const [endH, endM] = s.endTime.split(':').map(Number);
    return ((endH * 60 + endM) - (startH * 60 + startM) - s.breakMinutes) / 60;
  };

  const eligibleStaff = useMemo(() => {
    return staff.filter(s => {
      // Exclude current staff
      if (s.id === shift.staffId) return false;
      
      // Check availability for the day
      const shiftDate = new Date(shift.date);
      const dayOfWeek = shiftDate.getDay();
      const availability = s.availability.find(a => a.dayOfWeek === dayOfWeek);
      if (!availability?.available) return false;
      
      // Check for conflicts with existing shifts
      const hasConflict = allShifts.some(existingShift => 
        existingShift.staffId === s.id && 
        existingShift.date === shift.date &&
        existingShift.id !== shift.id
      );
      if (hasConflict) return false;
      
      // Check weekly hours limit (allow up to 2 hours overtime)
      const shiftHours = calculateShiftHours(shift);
      if (s.currentWeeklyHours + shiftHours > s.maxHoursPerWeek + 2) return false;
      
      return true;
    }).filter(s => {
      if (!searchQuery) return true;
      return s.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [staff, shift, allShifts, searchQuery]);

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
    if (selectedStaffId && shift) {
      onSwap(shift, selectedStaffId);
      onClose();
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedStaffId(null);
    onClose();
  };

  const actions: OffCanvasAction[] = [
    {
      label: 'Cancel',
      onClick: handleClose,
      variant: 'outlined',
    },
    {
      label: 'Confirm Swap',
      onClick: handleSwap,
      variant: 'primary',
      disabled: !selectedStaffId,
    },
  ];

  return (
    <PrimaryOffCanvas
      title="Swap Shift"
      description="Select a staff member to swap this shift with"
      width="500px"
      open={open}
      onClose={handleClose}
      actions={actions}
      showFooter
    >
      <div className="space-y-4">
        {/* Current Assignment */}
        <Box sx={{ p: 2, borderRadius: 1, bgcolor: 'action.hover', border: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">Current Assignment</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1 }}>
            <Box sx={{ 
              height: 40, 
              width: 40, 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'white', 
              fontSize: '0.875rem', 
              fontWeight: 500, 
              bgcolor: currentStaff?.color || 'grey.500' 
            }}>
              {currentStaff?.name?.split(' ').map(n => n[0]).join('') || '?'}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1" fontWeight={500}>{currentStaff?.name || 'Unknown'}</Typography>
              <Typography variant="body2" color="text.secondary">
                {currentStaff ? roleLabels[currentStaff.role] : 'No role'}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" fontWeight={500}>{shift.startTime} - {shift.endTime}</Typography>
              <Typography variant="body2" color="text.secondary">{shift.date}</Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <ArrowLeftRight size={20} style={{ opacity: 0.5 }} />
        </Box>

        <TextField
          placeholder="Search staff to swap with..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          fullWidth
          InputProps={{ startAdornment: <Search size={16} style={{ marginRight: 8, opacity: 0.5 }} /> }}
        />

        <ScrollArea className="h-[calc(100vh-480px)]">
          {eligibleStaff.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, color: 'text.secondary' }}>
              <User size={48} style={{ opacity: 0.2, marginBottom: 8 }} />
              <Typography variant="body2" align="center">No eligible staff found for this shift</Typography>
              <Typography variant="caption" align="center" sx={{ mt: 1, opacity: 0.7 }}>
                Staff may be unavailable, have conflicts, or at max hours
              </Typography>
            </Box>
          ) : (
            <div className="space-y-2">
              {eligibleStaff.map((member) => {
                const conflicts = getConflicts(member.id);
                const hoursRemaining = member.maxHoursPerWeek - member.currentWeeklyHours;
                const isSelected = selectedStaffId === member.id;
                return (
                  <Box
                    key={member.id}
                    onClick={() => setSelectedStaffId(member.id)}
                    sx={{
                      p: 1.5, 
                      borderRadius: 1.5, 
                      border: 2, 
                      cursor: 'pointer',
                      borderColor: isSelected ? 'primary.main' : conflicts.length > 0 ? 'warning.main' : 'divider',
                      bgcolor: isSelected ? 'rgba(3, 169, 244, 0.08)' : 'transparent',
                      boxShadow: isSelected ? '0 0 0 3px rgba(3, 169, 244, 0.12)' : 'none',
                      '&:hover': { 
                        bgcolor: isSelected ? 'rgba(3, 169, 244, 0.12)' : 'action.hover',
                        borderColor: isSelected ? 'primary.main' : conflicts.length > 0 ? 'warning.main' : 'primary.light',
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ 
                        height: 40, 
                        width: 40, 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: 'white', 
                        fontSize: '0.875rem', 
                        fontWeight: 500, 
                        flexShrink: 0, 
                        bgcolor: member.color 
                      }}>
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight={isSelected ? 600 : 500} color={isSelected ? 'primary.main' : 'text.primary'} noWrap>{member.name}</Typography>
                          {isSelected && (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 18,
                                height: 18,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                                color: 'white',
                              }}
                            >
                              <Check size={10} />
                            </Box>
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {roleLabels[member.role]} • ${member.hourlyRate}/hr
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: hoursRemaining <= 0 ? 'error.main' : 'text.secondary' }}>
                          <Clock size={12} />
                          <Typography variant="caption">{hoursRemaining.toFixed(1)}h available this week</Typography>
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
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </PrimaryOffCanvas>
  );
}
