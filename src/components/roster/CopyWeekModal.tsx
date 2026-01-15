import { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Stack,
  Chip,
  Alert,
  Divider,
  FormControlLabel,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Badge,
} from '@mui/material';
import { 
  Copy, 
  Calendar, 
  Users, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  AlertTriangle,
  Check,
  X,
  Layers,
  Clock,
  Filter,
  Eye,
  Repeat,
  ArrowRight,
  CalendarDays,
  CalendarRange,
  Building2,
  UserCheck,
  Shuffle,
  Minus,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, eachDayOfInterval, isSameDay, differenceInWeeks } from 'date-fns';
import { cn } from '@/lib/utils';
import { Shift, Room, StaffMember } from '@/types/roster';
import PrimaryOffCanvas, { OffCanvasAction } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

type PeriodType = 'week' | 'fortnight' | 'month' | 'custom';
type ConflictHandling = 'skip' | 'overwrite' | 'merge';
type StaffAssignment = 'keep' | 'unassign' | 'smart';

interface CopyWeekModalProps {
  open: boolean;
  onClose: () => void;
  shifts: Shift[];
  rooms: Room[];
  staff: StaffMember[];
  centreId: string;
  currentDate: Date;
  onCopy: (newShifts: Omit<Shift, 'id'>[]) => void;
}

interface ShiftPreview {
  original: Shift;
  newDate: string;
  conflict?: Shift;
  action: 'add' | 'skip' | 'overwrite';
  selected: boolean;
}

export function CopyWeekModal({
  open,
  onClose,
  shifts,
  rooms,
  staff,
  centreId,
  currentDate,
  onCopy,
}: CopyWeekModalProps) {
  // Source selection
  const [sourcePeriodType, setSourcePeriodType] = useState<PeriodType>('week');
  const [sourceWeekOffset, setSourceWeekOffset] = useState(-1); // -1 = last week
  const [sourceCustomStart, setSourceCustomStart] = useState<Date | null>(null);
  const [sourceCustomEnd, setSourceCustomEnd] = useState<Date | null>(null);

  // Target selection
  const [targetPeriodType, setTargetPeriodType] = useState<PeriodType>('week');
  const [targetWeekOffset, setTargetWeekOffset] = useState(0); // 0 = current week
  const [targetRepeatCount, setTargetRepeatCount] = useState(1);

  // Options
  const [conflictHandling, setConflictHandling] = useState<ConflictHandling>('skip');
  const [staffAssignment, setStaffAssignment] = useState<StaffAssignment>('keep');
  const [copyDraftsOnly, setCopyDraftsOnly] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set(rooms.map(r => r.id)));
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set());
  const [filterByStaff, setFilterByStaff] = useState(false);

  // Preview
  const [showPreview, setShowPreview] = useState(false);
  const [previewSelection, setPreviewSelection] = useState<Set<string>>(new Set());

  // Calculate source date range
  const sourceDateRange = useMemo(() => {
    if (sourcePeriodType === 'custom' && sourceCustomStart && sourceCustomEnd) {
      return { start: sourceCustomStart, end: sourceCustomEnd };
    }
    
    const baseDate = addWeeks(currentDate, sourceWeekOffset);
    const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
    
    switch (sourcePeriodType) {
      case 'week':
        return { start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) };
      case 'fortnight':
        return { start: weekStart, end: addDays(weekStart, 13) };
      case 'month':
        return { start: weekStart, end: addDays(weekStart, 27) };
      default:
        return { start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) };
    }
  }, [currentDate, sourceWeekOffset, sourcePeriodType, sourceCustomStart, sourceCustomEnd]);

  // Calculate target date ranges (can be multiple if repeating)
  const targetDateRanges = useMemo(() => {
    const ranges: { start: Date; end: Date }[] = [];
    const sourceDuration = Math.ceil((sourceDateRange.end.getTime() - sourceDateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < targetRepeatCount; i++) {
      let baseOffset = targetWeekOffset;
      
      if (targetPeriodType === 'week') {
        baseOffset = targetWeekOffset + i;
      } else if (targetPeriodType === 'fortnight') {
        baseOffset = targetWeekOffset + (i * 2);
      } else if (targetPeriodType === 'month') {
        baseOffset = targetWeekOffset + (i * 4);
      }
      
      const baseDate = addWeeks(currentDate, baseOffset);
      const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
      ranges.push({ start: weekStart, end: addDays(weekStart, sourceDuration) });
    }
    
    return ranges;
  }, [currentDate, targetWeekOffset, targetPeriodType, targetRepeatCount, sourceDateRange]);

  // Get source shifts
  const sourceShifts = useMemo(() => {
    const startStr = format(sourceDateRange.start, 'yyyy-MM-dd');
    const endStr = format(sourceDateRange.end, 'yyyy-MM-dd');
    
    return shifts.filter(s => {
      if (s.centreId !== centreId) return false;
      if (s.date < startStr || s.date > endStr) return false;
      if (!selectedRooms.has(s.roomId)) return false;
      if (copyDraftsOnly && s.status !== 'draft') return false;
      if (filterByStaff && selectedStaff.size > 0 && !selectedStaff.has(s.staffId)) return false;
      return true;
    });
  }, [shifts, sourceDateRange, centreId, selectedRooms, copyDraftsOnly, filterByStaff, selectedStaff]);

  // Generate preview with conflict detection
  const shiftPreviews = useMemo((): ShiftPreview[] => {
    const previews: ShiftPreview[] = [];
    
    targetDateRanges.forEach(targetRange => {
      const daysDiff = differenceInWeeks(targetRange.start, sourceDateRange.start) * 7;
      
      sourceShifts.forEach(shift => {
        const originalDate = new Date(shift.date);
        const newDate = addDays(originalDate, daysDiff);
        const newDateStr = format(newDate, 'yyyy-MM-dd');
        
        // Check for conflicts in target
        const conflict = shifts.find(s => 
          s.centreId === centreId &&
          s.roomId === shift.roomId &&
          s.date === newDateStr &&
          s.startTime === shift.startTime &&
          s.endTime === shift.endTime &&
          (staffAssignment === 'keep' ? s.staffId === shift.staffId : true)
        );
        
        let action: ShiftPreview['action'] = 'add';
        if (conflict) {
          action = conflictHandling === 'skip' ? 'skip' : conflictHandling === 'overwrite' ? 'overwrite' : 'add';
        }
        
        const previewId = `${shift.id}-${newDateStr}`;
        
        previews.push({
          original: shift,
          newDate: newDateStr,
          conflict,
          action,
          selected: previewSelection.has(previewId) || (action !== 'skip' && previewSelection.size === 0),
        });
      });
    });
    
    return previews;
  }, [sourceShifts, targetDateRanges, sourceDateRange, shifts, centreId, conflictHandling, staffAssignment, previewSelection]);

  // Stats
  const stats = useMemo(() => {
    const toAdd = shiftPreviews.filter(p => p.action === 'add' && p.selected).length;
    const toSkip = shiftPreviews.filter(p => p.action === 'skip').length;
    const toOverwrite = shiftPreviews.filter(p => p.action === 'overwrite' && p.selected).length;
    const conflicts = shiftPreviews.filter(p => p.conflict).length;
    
    return { toAdd, toSkip, toOverwrite, conflicts, total: shiftPreviews.length };
  }, [shiftPreviews]);

  const handleCopy = useCallback(() => {
    const shiftsToCreate = shiftPreviews
      .filter(p => p.selected && p.action !== 'skip')
      .map(p => {
        const newShift: Omit<Shift, 'id'> = {
          ...p.original,
          date: p.newDate,
          status: 'draft',
        };
        
        // Handle staff assignment
        if (staffAssignment === 'unassign') {
          newShift.staffId = '';
          newShift.isOpenShift = true;
        } else if (staffAssignment === 'smart') {
          // Smart assignment could check availability - for now just keep
          newShift.staffId = p.original.staffId;
        }
        
        // Remove id from spread
        const { id, ...shiftWithoutId } = newShift as Shift & { id?: string };
        return shiftWithoutId;
      });
    
    if (shiftsToCreate.length === 0) {
      toast.error('No shifts to copy');
      return;
    }
    
    onCopy(shiftsToCreate);
    toast.success(`Copied ${shiftsToCreate.length} shift${shiftsToCreate.length > 1 ? 's' : ''}`);
    handleClose();
  }, [shiftPreviews, staffAssignment, onCopy]);

  const handleClose = () => {
    setShowPreview(false);
    setPreviewSelection(new Set());
    onClose();
  };

  const toggleRoomSelection = (roomId: string) => {
    const newSet = new Set(selectedRooms);
    if (newSet.has(roomId)) {
      newSet.delete(roomId);
    } else {
      newSet.add(roomId);
    }
    setSelectedRooms(newSet);
  };

  const toggleStaffSelection = (staffId: string) => {
    const newSet = new Set(selectedStaff);
    if (newSet.has(staffId)) {
      newSet.delete(staffId);
    } else {
      newSet.add(staffId);
    }
    setSelectedStaff(newSet);
  };

  const togglePreviewSelection = (previewId: string) => {
    const newSet = new Set(previewSelection);
    if (newSet.has(previewId)) {
      newSet.delete(previewId);
    } else {
      newSet.add(previewId);
    }
    setPreviewSelection(newSet);
  };

  const selectAllPreviews = () => {
    const allIds = shiftPreviews
      .filter(p => p.action !== 'skip')
      .map(p => `${p.original.id}-${p.newDate}`);
    setPreviewSelection(new Set(allIds));
  };

  const deselectAllPreviews = () => {
    setPreviewSelection(new Set());
  };

  const getStaffName = (staffId: string) => {
    return staff.find(s => s.id === staffId)?.name || 'Unknown';
  };

  const getRoomName = (roomId: string) => {
    return rooms.find(r => r.id === roomId)?.name || 'Unknown';
  };

  const actions: OffCanvasAction[] = showPreview ? [
    { label: 'Back', onClick: () => setShowPreview(false), variant: 'outlined' },
    { 
      label: `Copy ${stats.toAdd + stats.toOverwrite} Shifts`, 
      onClick: handleCopy, 
      variant: 'primary',
      disabled: stats.toAdd + stats.toOverwrite === 0,
    },
  ] : [
    { label: 'Cancel', onClick: handleClose, variant: 'outlined' },
    { 
      label: 'Preview', 
      onClick: () => setShowPreview(true), 
      variant: 'primary',
      disabled: sourceShifts.length === 0,
    },
  ];

  const WeekNavigator = ({ 
    offset, 
    onOffsetChange, 
    periodType,
    label 
  }: { 
    offset: number; 
    onOffsetChange: (o: number) => void; 
    periodType: PeriodType;
    label: string;
  }) => {
    const baseDate = addWeeks(currentDate, offset);
    const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
    const weekEnd = periodType === 'fortnight' 
      ? addDays(weekStart, 13) 
      : periodType === 'month' 
        ? addDays(weekStart, 27)
        : endOfWeek(weekStart, { weekStartsOn: 1 });
    
    return (
      <Box sx={{ 
        p: 2, 
        borderRadius: 2, 
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          {label}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={1}>
          <button
            onClick={() => onOffsetChange(offset - 1)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Typography variant="subtitle2" fontWeight={600}>
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {offset === 0 ? 'Current' : offset === -1 ? 'Last' : offset === 1 ? 'Next' : `${Math.abs(offset)} ${offset < 0 ? 'ago' : 'ahead'}`} {periodType}
            </Typography>
          </Box>
          <button
            onClick={() => onOffsetChange(offset + 1)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </Stack>
      </Box>
    );
  };

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={handleClose}
      title={showPreview ? "Preview & Confirm" : "Copy Week / Period"}
      description={showPreview 
        ? `Review ${stats.total} shifts before copying`
        : "Copy shifts from one period to another with smart options"
      }
      icon={Copy}
      size="lg"
      actions={actions}
    >
      <Stack spacing={3}>
        {!showPreview ? (
          <>
            {/* Source Period Selection */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarDays className="h-4 w-4" />
                Copy From (Source)
              </Typography>
              
              <ToggleButtonGroup
                value={sourcePeriodType}
                exclusive
                onChange={(_, v) => v && setSourcePeriodType(v)}
                size="small"
                fullWidth
                sx={{ mb: 2 }}
              >
                <ToggleButton value="week">Week</ToggleButton>
                <ToggleButton value="fortnight">Fortnight</ToggleButton>
                <ToggleButton value="month">4 Weeks</ToggleButton>
              </ToggleButtonGroup>
              
              <WeekNavigator 
                offset={sourceWeekOffset} 
                onOffsetChange={setSourceWeekOffset}
                periodType={sourcePeriodType}
                label="Source period"
              />
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                <Typography variant="body2" color="primary.main" fontWeight={500}>
                  {sourceShifts.length} shift{sourceShifts.length !== 1 ? 's' : ''} found in this period
                </Typography>
              </Box>
            </Box>

            <Divider>
              <Chip 
                icon={<ArrowRight className="h-4 w-4" />} 
                label="Copy To" 
                size="small" 
              />
            </Divider>

            {/* Target Period Selection */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarRange className="h-4 w-4" />
                Copy To (Target)
              </Typography>
              
              <ToggleButtonGroup
                value={targetPeriodType}
                exclusive
                onChange={(_, v) => v && setTargetPeriodType(v)}
                size="small"
                fullWidth
                sx={{ mb: 2 }}
              >
                <ToggleButton value="week">Week</ToggleButton>
                <ToggleButton value="fortnight">Fortnight</ToggleButton>
                <ToggleButton value="month">4 Weeks</ToggleButton>
              </ToggleButtonGroup>
              
              <WeekNavigator 
                offset={targetWeekOffset} 
                onOffsetChange={setTargetWeekOffset}
                periodType={targetPeriodType}
                label="Target period"
              />
              
              {/* Repeat Option */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Repeat copy to multiple periods
                </Typography>
                <Stack direction="row" spacing={1}>
                  {[1, 2, 3, 4, 6, 8, 12].map(count => (
                    <Chip
                      key={count}
                      label={count === 1 ? '1×' : `${count}×`}
                      onClick={() => setTargetRepeatCount(count)}
                      color={targetRepeatCount === count ? 'primary' : 'default'}
                      variant={targetRepeatCount === count ? 'filled' : 'outlined'}
                      size="small"
                    />
                  ))}
                </Stack>
                {targetRepeatCount > 1 && (
                  <Alert severity="info" sx={{ mt: 1 }} icon={<Repeat className="h-4 w-4" />}>
                    Will copy to {targetRepeatCount} consecutive {targetPeriodType}s
                  </Alert>
                )}
              </Box>
            </Box>

            <Divider />

            {/* Advanced Options */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ChevronDown className="h-4 w-4" />}>
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Filter className="h-4 w-4" />
                  Filters & Options
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={2}>
                  {/* Room Filter */}
                  <Box>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Building2 className="h-3 w-3" />
                        Rooms
                      </Typography>
                      <button
                        onClick={() => {
                          if (selectedRooms.size === rooms.length) {
                            setSelectedRooms(new Set());
                          } else {
                            setSelectedRooms(new Set(rooms.map(r => r.id)));
                          }
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        {selectedRooms.size === rooms.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </Stack>
                    <Stack direction="row" flexWrap="wrap" gap={0.5}>
                      {rooms.map(room => (
                        <Chip
                          key={room.id}
                          label={room.name}
                          onClick={() => toggleRoomSelection(room.id)}
                          color={selectedRooms.has(room.id) ? 'primary' : 'default'}
                          variant={selectedRooms.has(room.id) ? 'filled' : 'outlined'}
                          size="small"
                        />
                      ))}
                    </Stack>
                  </Box>

                  {/* Staff Filter */}
                  <Box>
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={filterByStaff}
                          onChange={(e) => setFilterByStaff(e.target.checked)}
                        />
                      }
                      label={
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Users className="h-3 w-3" />
                          Filter by specific staff
                        </Typography>
                      }
                    />
                    {filterByStaff && (
                      <ScrollArea className="h-32 mt-1 border rounded-lg p-2">
                        <Stack spacing={0.5}>
                          {staff.slice(0, 20).map(s => (
                            <FormControlLabel
                              key={s.id}
                              control={
                                <Checkbox
                                  size="small"
                                  checked={selectedStaff.has(s.id)}
                                  onChange={() => toggleStaffSelection(s.id)}
                                />
                              }
                              label={<Typography variant="body2">{s.name}</Typography>}
                            />
                          ))}
                        </Stack>
                      </ScrollArea>
                    )}
                  </Box>

                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={copyDraftsOnly}
                        onChange={(e) => setCopyDraftsOnly(e.target.checked)}
                      />
                    }
                    label={<Typography variant="body2">Copy draft shifts only</Typography>}
                  />
                </Stack>
              </AccordionDetails>
            </Accordion>

            {/* Conflict Handling */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AlertTriangle className="h-4 w-4" />
                Conflict Handling
              </Typography>
              <ToggleButtonGroup
                value={conflictHandling}
                exclusive
                onChange={(_, v) => v && setConflictHandling(v)}
                size="small"
                fullWidth
              >
                <ToggleButton value="skip">
                  <Stack alignItems="center" spacing={0.5}>
                    <Minus className="h-4 w-4" />
                    <Typography variant="caption">Skip</Typography>
                  </Stack>
                </ToggleButton>
                <ToggleButton value="overwrite">
                  <Stack alignItems="center" spacing={0.5}>
                    <Shuffle className="h-4 w-4" />
                    <Typography variant="caption">Overwrite</Typography>
                  </Stack>
                </ToggleButton>
                <ToggleButton value="merge">
                  <Stack alignItems="center" spacing={0.5}>
                    <Layers className="h-4 w-4" />
                    <Typography variant="caption">Add Anyway</Typography>
                  </Stack>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Staff Assignment */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <UserCheck className="h-4 w-4" />
                Staff Assignment
              </Typography>
              <ToggleButtonGroup
                value={staffAssignment}
                exclusive
                onChange={(_, v) => v && setStaffAssignment(v)}
                size="small"
                fullWidth
              >
                <ToggleButton value="keep">
                  <Stack alignItems="center" spacing={0.5}>
                    <Users className="h-4 w-4" />
                    <Typography variant="caption">Keep Same</Typography>
                  </Stack>
                </ToggleButton>
                <ToggleButton value="unassign">
                  <Stack alignItems="center" spacing={0.5}>
                    <Calendar className="h-4 w-4" />
                    <Typography variant="caption">Make Open</Typography>
                  </Stack>
                </ToggleButton>
                <ToggleButton value="smart">
                  <Stack alignItems="center" spacing={0.5}>
                    <Shuffle className="h-4 w-4" />
                    <Typography variant="caption">Smart Assign</Typography>
                  </Stack>
                </ToggleButton>
              </ToggleButtonGroup>
              {staffAssignment === 'unassign' && (
                <Alert severity="info" sx={{ mt: 1 }} icon={false}>
                  Copied shifts will become open shifts
                </Alert>
              )}
              {staffAssignment === 'smart' && (
                <Alert severity="info" sx={{ mt: 1 }} icon={false}>
                  Will attempt to assign based on staff availability
                </Alert>
              )}
            </Box>
          </>
        ) : (
          /* Preview Mode */
          <>
            {/* Summary Stats */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
              <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: 'success.50', textAlign: 'center' }}>
                <Typography variant="h5" color="success.main" fontWeight={700}>{stats.toAdd}</Typography>
                <Typography variant="caption" color="success.main">To Add</Typography>
              </Box>
              <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: 'warning.50', textAlign: 'center' }}>
                <Typography variant="h5" color="warning.main" fontWeight={700}>{stats.toOverwrite}</Typography>
                <Typography variant="caption" color="warning.main">Overwrite</Typography>
              </Box>
              <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: 'grey.100', textAlign: 'center' }}>
                <Typography variant="h5" color="text.secondary" fontWeight={700}>{stats.toSkip}</Typography>
                <Typography variant="caption" color="text.secondary">Skip</Typography>
              </Box>
              <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: 'error.50', textAlign: 'center' }}>
                <Typography variant="h5" color="error.main" fontWeight={700}>{stats.conflicts}</Typography>
                <Typography variant="caption" color="error.main">Conflicts</Typography>
              </Box>
            </Box>

            {/* Selection Controls */}
            <Stack direction="row" spacing={1}>
              <button
                onClick={selectAllPreviews}
                className="px-3 py-1.5 text-sm rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={deselectAllPreviews}
                className="px-3 py-1.5 text-sm rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              >
                Deselect All
              </button>
            </Stack>

            {/* Preview List */}
            <ScrollArea className="h-[400px]">
              <Stack spacing={1}>
                {shiftPreviews.map((preview, idx) => {
                  const previewId = `${preview.original.id}-${preview.newDate}`;
                  const isSelected = preview.selected || previewSelection.has(previewId);
                  
                  return (
                    <Box
                      key={idx}
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: preview.action === 'skip' ? 'grey.300' : isSelected ? 'primary.main' : 'divider',
                        bgcolor: preview.action === 'skip' ? 'grey.50' : isSelected ? 'primary.50' : 'background.paper',
                        opacity: preview.action === 'skip' ? 0.6 : 1,
                        cursor: preview.action === 'skip' ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': preview.action !== 'skip' ? { borderColor: 'primary.main' } : {},
                      }}
                      onClick={() => preview.action !== 'skip' && togglePreviewSelection(previewId)}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        {preview.action !== 'skip' ? (
                          <Checkbox
                            size="small"
                            checked={isSelected}
                            sx={{ p: 0 }}
                          />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground" />
                        )}
                        
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="body2" fontWeight={500} noWrap>
                              {getRoomName(preview.original.roomId)}
                            </Typography>
                            <Chip 
                              label={format(new Date(preview.newDate), 'EEE, MMM d')} 
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <Typography variant="caption" color="text.secondary">
                              {preview.original.startTime} - {preview.original.endTime}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">•</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {staffAssignment === 'unassign' ? 'Open Shift' : getStaffName(preview.original.staffId)}
                            </Typography>
                          </Stack>
                        </Box>
                        
                        {preview.action === 'add' && (
                          <Chip label="Add" size="small" color="success" icon={<Check className="h-3 w-3" />} />
                        )}
                        {preview.action === 'overwrite' && (
                          <Chip label="Replace" size="small" color="warning" icon={<Shuffle className="h-3 w-3" />} />
                        )}
                        {preview.action === 'skip' && (
                          <Chip label="Skip" size="small" color="default" icon={<Minus className="h-3 w-3" />} />
                        )}
                      </Stack>
                      
                      {preview.conflict && (
                        <Alert severity="warning" sx={{ mt: 1, py: 0.5 }} icon={<AlertTriangle className="h-3 w-3" />}>
                          <Typography variant="caption">
                            Conflicts with existing shift: {getStaffName(preview.conflict.staffId)}
                          </Typography>
                        </Alert>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            </ScrollArea>
          </>
        )}
      </Stack>
    </PrimaryOffCanvas>
  );
}
