import React, { useState, useMemo } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  TextField,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox,
  FormHelperText,
  Box,
  Typography,
  Chip,
  Stack,
} from '@mui/material';
import { format, addDays, addWeeks, parseISO, isBefore, isAfter } from 'date-fns';
import { Copy, Calendar, Repeat, CalendarDays, X } from 'lucide-react';
import PrimaryOffCanvas, { OffCanvasAction } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { Shift, Room } from '@/types/roster';
import { shiftCopySchema, ShiftCopyFormValues } from '@/lib/validationSchemas';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ShiftCopyModalProps {
  open: boolean;
  onClose: () => void;
  shift: Shift | null;
  rooms: Room[];
  existingShifts: Shift[];
  onCopy: (newShifts: Omit<Shift, 'id'>[]) => void;
}

export function ShiftCopyModal({
  open,
  onClose,
  shift,
  rooms,
  existingShifts,
  onCopy,
}: ShiftCopyModalProps) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);

  const methods = useForm<ShiftCopyFormValues>({
    resolver: zodResolver(shiftCopySchema),
    defaultValues: {
      sourceShiftId: shift?.id || '',
      targetDates: [],
      copyMode: 'single',
      recurringPattern: 'weekly',
      recurringEndDate: format(addWeeks(new Date(), 4), 'yyyy-MM-dd'),
      targetRoomId: shift?.roomId || '',
      copyToAllRooms: false,
    },
    mode: 'onChange',
  });

  const {
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = methods;

  const copyMode = watch('copyMode');
  const recurringPattern = watch('recurringPattern');
  const recurringEndDate = watch('recurringEndDate');
  const copyToAllRooms = watch('copyToAllRooms');

  // Generate recurring dates based on pattern
  const recurringDates = useMemo(() => {
    if (!shift || copyMode !== 'recurring' || !recurringEndDate) return [];

    const dates: string[] = [];
    const startDate = parseISO(shift.date);
    const endDate = parseISO(recurringEndDate);
    let currentDate = startDate;

    const increment = recurringPattern === 'daily' ? 1 : recurringPattern === 'weekly' ? 7 : 14;

    while (isBefore(currentDate, endDate) || currentDate.getTime() === endDate.getTime()) {
      currentDate = addDays(currentDate, increment);
      if (!isAfter(currentDate, endDate)) {
        dates.push(format(currentDate, 'yyyy-MM-dd'));
      }
    }

    return dates;
  }, [shift, copyMode, recurringPattern, recurringEndDate]);

  // Check for conflicts
  const getConflictsForDate = (date: string, roomId: string) => {
    return existingShifts.filter(
      (s) =>
        s.date === date &&
        s.roomId === roomId &&
        s.staffId === shift?.staffId
    );
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    
    setSelectedDates((prev) => {
      const exists = prev.some((d) => format(d, 'yyyy-MM-dd') === dateStr);
      if (exists) {
        return prev.filter((d) => format(d, 'yyyy-MM-dd') !== dateStr);
      }
      return [...prev, date];
    });
  };

  const handleRemoveDate = (dateToRemove: Date) => {
    setSelectedDates((prev) =>
      prev.filter((d) => format(d, 'yyyy-MM-dd') !== format(dateToRemove, 'yyyy-MM-dd'))
    );
  };

  const onSubmit = (data: ShiftCopyFormValues) => {
    if (!shift) return;

    let datesToCopy: string[] = [];

    if (data.copyMode === 'single' || data.copyMode === 'multiple') {
      datesToCopy = selectedDates.map((d) => format(d, 'yyyy-MM-dd'));
    } else if (data.copyMode === 'recurring') {
      datesToCopy = recurringDates;
    }

    if (datesToCopy.length === 0) {
      toast.error('Please select at least one date');
      return;
    }

    const targetRooms = data.copyToAllRooms ? rooms.map((r) => r.id) : [shift.roomId];
    const newShifts: Omit<Shift, 'id'>[] = [];

    datesToCopy.forEach((date) => {
      targetRooms.forEach((roomId) => {
        const conflicts = getConflictsForDate(date, roomId);
        if (conflicts.length === 0) {
          newShifts.push({
            staffId: shift.staffId,
            centreId: shift.centreId,
            roomId,
            date,
            startTime: shift.startTime,
            endTime: shift.endTime,
            breakMinutes: shift.breakMinutes,
            status: 'draft',
            isOpenShift: false,
          });
        }
      });
    });

    if (newShifts.length > 0) {
      onCopy(newShifts);
      toast.success(`Copied shift to ${newShifts.length} slot(s)`);
      handleClose();
    } else {
      toast.error('All selected dates have conflicts');
    }
  };

  const handleClose = () => {
    reset();
    setSelectedDates([]);
    onClose();
  };

  const actions: OffCanvasAction[] = [
    {
      label: 'Cancel',
      onClick: handleClose,
      variant: 'outlined',
    },
    {
      label: `Copy Shift${selectedDates.length > 0 || recurringDates.length > 0 ? ` (${copyMode === 'recurring' ? recurringDates.length : selectedDates.length})` : ''}`,
      onClick: handleSubmit(onSubmit),
      variant: 'primary',
      disabled: (copyMode !== 'recurring' && selectedDates.length === 0) || (copyMode === 'recurring' && recurringDates.length === 0),
    },
  ];

  if (!shift) return null;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <PrimaryOffCanvas
          title="Copy Shift"
          description="Copy this shift to other dates"
          width="480px"
          open={open}
          onClose={handleClose}
          actions={actions}
          showFooter
        >
          <div className="space-y-6">
            {/* Source Shift Info */}
            <Box sx={{ p: 2, borderRadius: 1, bgcolor: 'action.hover', border: 1, borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">
                Source Shift
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={500}>
                    {format(parseISO(shift.date), 'EEEE, MMM d, yyyy')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {shift.startTime} - {shift.endTime}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Copy Mode Selection */}
            <FormControl component="fieldset" fullWidth>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Copy Mode
              </Typography>
              <Controller
                name="copyMode"
                control={control}
                render={({ field }) => (
                  <RadioGroup {...field} row>
                    <FormControlLabel
                      value="single"
                      control={<Radio size="small" />}
                      label={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Calendar className="h-4 w-4" />
                          <span>Single Date</span>
                        </Stack>
                      }
                    />
                    <FormControlLabel
                      value="multiple"
                      control={<Radio size="small" />}
                      label={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CalendarDays className="h-4 w-4" />
                          <span>Multiple Dates</span>
                        </Stack>
                      }
                    />
                    <FormControlLabel
                      value="recurring"
                      control={<Radio size="small" />}
                      label={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Repeat className="h-4 w-4" />
                          <span>Recurring</span>
                        </Stack>
                      }
                    />
                  </RadioGroup>
                )}
              />
            </FormControl>

            {/* Date Selection for single/multiple modes */}
            {(copyMode === 'single' || copyMode === 'multiple') && (
              <div className="space-y-3">
                <Typography variant="subtitle2">
                  Select {copyMode === 'single' ? 'Date' : 'Dates'}
                </Typography>
                
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Calendar className="h-4 w-4" />}
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      {selectedDates.length > 0
                        ? `${selectedDates.length} date(s) selected`
                        : 'Click to select dates'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    {copyMode === 'single' ? (
                      <CalendarUI
                        mode="single"
                        selected={selectedDates[0]}
                        onSelect={(date) => {
                          setSelectedDates(date ? [date] : []);
                          setShowCalendar(false);
                        }}
                        disabled={(date) => format(date, 'yyyy-MM-dd') === shift.date}
                        initialFocus
                      />
                    ) : (
                      <CalendarUI
                        mode="multiple"
                        selected={selectedDates}
                        onSelect={(dates) => {
                          setSelectedDates(dates || []);
                        }}
                        disabled={(date) => format(date, 'yyyy-MM-dd') === shift.date}
                        initialFocus
                      />
                    )}
                  </PopoverContent>
                </Popover>

                {selectedDates.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedDates.map((date) => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      const hasConflict = getConflictsForDate(dateStr, shift.roomId).length > 0;
                      return (
                        <Chip
                          key={dateStr}
                          label={format(date, 'MMM d')}
                          size="small"
                          color={hasConflict ? 'warning' : 'default'}
                          onDelete={() => handleRemoveDate(date)}
                          deleteIcon={<X className="h-3 w-3" />}
                        />
                      );
                    })}
                  </Box>
                )}

                {errors.targetDates && (
                  <FormHelperText error>{errors.targetDates.message}</FormHelperText>
                )}
              </div>
            )}

            {/* Recurring Pattern Options */}
            {copyMode === 'recurring' && (
              <div className="space-y-4">
                <FormControl component="fieldset" fullWidth>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Repeat Pattern
                  </Typography>
                  <Controller
                    name="recurringPattern"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup {...field} row>
                        <FormControlLabel
                          value="daily"
                          control={<Radio size="small" />}
                          label="Daily"
                        />
                        <FormControlLabel
                          value="weekly"
                          control={<Radio size="small" />}
                          label="Weekly"
                        />
                        <FormControlLabel
                          value="fortnightly"
                          control={<Radio size="small" />}
                          label="Fortnightly"
                        />
                      </RadioGroup>
                    )}
                  />
                </FormControl>

                <Controller
                  name="recurringEndDate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="End Date"
                      type="date"
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      helperText={`Will create ${recurringDates.length} shifts`}
                    />
                  )}
                />

                {recurringDates.length > 0 && (
                  <Box sx={{ maxHeight: 150, overflow: 'auto', p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Preview: {recurringDates.length} dates
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {recurringDates.slice(0, 20).map((dateStr) => (
                        <Chip
                          key={dateStr}
                          label={format(parseISO(dateStr), 'MMM d')}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      {recurringDates.length > 20 && (
                        <Chip label={`+${recurringDates.length - 20} more`} size="small" />
                      )}
                    </Box>
                  </Box>
                )}
              </div>
            )}

            {/* Copy to all rooms option */}
            <Controller
              name="copyToAllRooms"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      Copy to all rooms ({rooms.length} rooms)
                    </Typography>
                  }
                />
              )}
            />
          </div>
        </PrimaryOffCanvas>
      </form>
    </FormProvider>
  );
}
