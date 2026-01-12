import { useState, useEffect } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Box,
  Typography,
  FormHelperText,
} from '@mui/material';
import { Room, OpenShift, QualificationType, qualificationLabels, ageGroupLabels } from '@/types/roster';
import { Plus, X, AlertCircle } from 'lucide-react';
import PrimaryOffCanvas, { OffCanvasAction } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { ScrollArea } from '@/components/ui/scroll-area';
import { openShiftSchema, OpenShiftFormValues } from '@/lib/validationSchemas';
import { toast } from 'sonner';

interface AddOpenShiftModalProps {
  open: boolean;
  onClose: () => void;
  rooms: Room[];
  centreId: string;
  selectedDate?: string;
  selectedRoomId?: string;
  onAdd: (openShift: Omit<OpenShift, 'id'>) => void;
}

export function AddOpenShiftModal({ 
  open, 
  onClose, 
  rooms, 
  centreId, 
  selectedDate,
  selectedRoomId,
  onAdd 
}: AddOpenShiftModalProps) {
  const [selectedQualifications, setSelectedQualifications] = useState<QualificationType[]>([]);

  const methods = useForm<OpenShiftFormValues>({
    resolver: zodResolver(openShiftSchema),
    defaultValues: {
      centreId,
      roomId: selectedRoomId || '',
      date: selectedDate || '',
      startTime: '09:00',
      endTime: '17:00',
      urgency: 'medium',
      requiredQualifications: [],
      notes: '',
    },
    mode: 'onChange',
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid },
  } = methods;

  const urgency = watch('urgency');

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      reset({
        centreId,
        roomId: selectedRoomId || '',
        date: selectedDate || '',
        startTime: '09:00',
        endTime: '17:00',
        urgency: 'medium',
        requiredQualifications: [],
        notes: '',
      });
      setSelectedQualifications([]);
    }
  }, [open, reset, centreId, selectedRoomId, selectedDate]);

  const availableQualifications: QualificationType[] = [
    'diploma_ece', 'certificate_iii', 'first_aid', 'food_safety', 
    'working_with_children', 'bachelor_ece', 'masters_ece'
  ];

  const toggleQualification = (qual: QualificationType) => {
    const newQuals = selectedQualifications.includes(qual) 
      ? selectedQualifications.filter(q => q !== qual)
      : [...selectedQualifications, qual];
    setSelectedQualifications(newQuals);
    setValue('requiredQualifications', newQuals);
  };

  const onSubmit = (data: OpenShiftFormValues) => {
    onAdd({
      centreId: data.centreId,
      roomId: data.roomId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      requiredQualifications: selectedQualifications,
      urgency: data.urgency,
      applicants: [],
    });

    toast.success('Open shift added');
    handleClose();
  };

  const handleClose = () => {
    reset();
    setSelectedQualifications([]);
    onClose();
  };

  const urgencyColors = {
    low: { bgcolor: 'grey.100', color: 'grey.700' },
    medium: { bgcolor: 'warning.light', color: 'warning.dark' },
    high: { bgcolor: 'orange.100', color: 'orange.700' },
    critical: { bgcolor: 'error.light', color: 'error.dark' },
  };

  const actions: OffCanvasAction[] = [
    { label: 'Cancel', onClick: handleClose, variant: 'outlined' },
    { label: 'Add Open Shift', onClick: handleSubmit(onSubmit), variant: 'primary', disabled: !isValid },
  ];

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <PrimaryOffCanvas
          title="Add Open Shift"
          description="Create a new open shift that needs to be filled"
          width="500px"
          open={open}
          onClose={handleClose}
          actions={actions}
          showFooter
        >
          <ScrollArea className="h-[calc(100vh-280px)]">
            <Stack spacing={3}>
              {/* Room Selection */}
              <Controller
                name="roomId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth size="small" error={!!errors.roomId}>
                    <InputLabel>Room / Area *</InputLabel>
                    <Select
                      {...field}
                      label="Room / Area *"
                    >
                      {rooms.map((room) => (
                        <MenuItem key={room.id} value={room.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{room.name}</span>
                            <Typography variant="caption" color="text.secondary">
                              {ageGroupLabels[room.ageGroup]}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.roomId && (
                      <FormHelperText>{errors.roomId.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />

              {/* Date */}
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Date *"
                    type="date"
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.date}
                    helperText={errors.date?.message}
                  />
                )}
              />

              {/* Time */}
              <Stack direction="row" spacing={2}>
                <Controller
                  name="startTime"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Start Time *"
                      type="time"
                      size="small"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.startTime}
                      helperText={errors.startTime?.message}
                    />
                  )}
                />
                <Controller
                  name="endTime"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="End Time *"
                      type="time"
                      size="small"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.endTime}
                      helperText={errors.endTime?.message}
                    />
                  )}
                />
              </Stack>

              {/* Urgency */}
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Urgency Level *
                </Typography>
                <Controller
                  name="urgency"
                  control={control}
                  render={({ field }) => (
                    <Stack direction="row" spacing={1}>
                      {(['low', 'medium', 'high', 'critical'] as const).map((level) => (
                        <Button
                          key={level}
                          variant={field.value === level ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => field.onChange(level)}
                          sx={{
                            flex: 1,
                            textTransform: 'capitalize',
                            ...(field.value === level && urgencyColors[level]),
                          }}
                        >
                          {level}
                        </Button>
                      ))}
                    </Stack>
                  )}
                />
              </Box>

              {/* Required Qualifications */}
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Required Qualifications (Optional)
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {availableQualifications.map((qual) => (
                    <Chip
                      key={qual}
                      label={qualificationLabels[qual]}
                      onClick={() => toggleQualification(qual)}
                      color={selectedQualifications.includes(qual) ? 'primary' : 'default'}
                      variant={selectedQualifications.includes(qual) ? 'filled' : 'outlined'}
                      size="small"
                      deleteIcon={selectedQualifications.includes(qual) ? <X size={14} /> : undefined}
                      onDelete={selectedQualifications.includes(qual) ? () => toggleQualification(qual) : undefined}
                    />
                  ))}
                </Box>
              </Box>

              {/* Notes */}
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Notes"
                    multiline
                    rows={3}
                    size="small"
                    fullWidth
                    placeholder="Optional notes about this open shift..."
                    error={!!errors.notes}
                    helperText={errors.notes?.message}
                  />
                )}
              />
            </Stack>
          </ScrollArea>
        </PrimaryOffCanvas>
      </form>
    </FormProvider>
  );
}
