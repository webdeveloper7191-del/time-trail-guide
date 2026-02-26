import { useState, useEffect, useMemo } from 'react';
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
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Checkbox,
  ListItemText,
  OutlinedInput,
  ToggleButton,
  ToggleButtonGroup,
  Badge,
} from '@mui/material';
import { 
  Room, 
  OpenShift, 
  QualificationType, 
  qualificationLabels, 
  ageGroupLabels,
  ShiftTemplate,
  ShiftSpecialType,
  shiftTypeLabels,
  shiftTypeDescriptions,
  roleLabels,
  StaffMember,
  defaultShiftTemplates,
} from '@/types/roster';
import { Plus, X, AlertCircle, Clock, Moon, Phone, Split, ChevronDown, FileText, Car, Award, Layers, Calendar } from 'lucide-react';
import PrimaryOffCanvas, { OffCanvasAction } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection, FormField, FormRow } from '@/components/ui/off-canvas/FormSection';
import { StyledSwitch } from '@/components/ui/StyledSwitch';
import { openShiftSchema, OpenShiftFormValues } from '@/lib/validationSchemas';
import { toast } from 'sonner';
import { format, addDays, startOfWeek, eachDayOfInterval } from 'date-fns';

interface AddOpenShiftModalProps {
  open: boolean;
  onClose: () => void;
  rooms: Room[];
  centreId: string;
  selectedDate?: string;
  selectedRoomId?: string;
  onAdd: (openShifts: Omit<OpenShift, 'id'>[]) => void;
  shiftTemplates?: ShiftTemplate[];
  availableDates?: Date[];
}

type CreateMode = 'single' | 'bulk';

const shiftTypeIcons: Record<ShiftSpecialType, React.ReactNode> = {
  regular: <Clock size={16} />,
  on_call: <Phone size={16} />,
  sleepover: <Moon size={16} />,
  broken: <Split size={16} />,
  recall: <Phone size={16} />,
  emergency: <AlertCircle size={16} />,
};

const classificationLevels = [
  'Level 2.1', 'Level 2.2', 'Level 2.3',
  'Level 3.1', 'Level 3.2', 'Level 3.3',
  'Level 4.1', 'Level 4.2', 'Level 4.3',
  'Level 5.1', 'Level 5.2', 'Level 5.3',
  'Level 6.1', 'Level 6.2', 'Level 6.3',
];

export function AddOpenShiftModal({ 
  open, 
  onClose, 
  rooms, 
  centreId, 
  selectedDate,
  selectedRoomId,
  onAdd,
  shiftTemplates = defaultShiftTemplates,
  availableDates,
}: AddOpenShiftModalProps) {
  const [createMode, setCreateMode] = useState<CreateMode>('single');
  const [selectedQualifications, setSelectedQualifications] = useState<QualificationType[]>([]);
  const [selectedAllowances, setSelectedAllowances] = useState<string[]>([]);
  const [useTemplate, setUseTemplate] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  
  // Bulk mode selections
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  // Generate default dates for the next 2 weeks if not provided
  const dateOptions = useMemo(() => {
    if (availableDates && availableDates.length > 0) {
      return availableDates;
    }
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end: addDays(start, 13) });
  }, [availableDates]);

  const allTemplates = useMemo(() => {
    const custom = shiftTemplates.filter(t => !defaultShiftTemplates.some(d => d.id === t.id));
    return [...defaultShiftTemplates, ...custom];
  }, [shiftTemplates]);

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
      requiredEmployeeCount: 1,
      notes: '',
      breakMinutes: 30,
      shiftType: 'regular',
      minimumClassification: '',
      preferredRole: undefined,
      templateId: '',
      selectedAllowances: [],
      isRemoteLocation: false,
      defaultTravelKilometres: 0,
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
  const shiftType = watch('shiftType');

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
      requiredEmployeeCount: 1,
      notes: '',
      breakMinutes: 30,
        shiftType: 'regular',
        minimumClassification: '',
        preferredRole: undefined,
        templateId: '',
        selectedAllowances: [],
        isRemoteLocation: false,
        defaultTravelKilometres: 0,
      });
      setSelectedQualifications([]);
      setSelectedAllowances([]);
      setSelectedTemplateId('');
      setUseTemplate(true);
      setCreateMode('single');
      setSelectedRoomIds(selectedRoomId ? [selectedRoomId] : []);
      setSelectedDates(selectedDate ? [selectedDate] : []);
    }
  }, [open, reset, centreId, selectedRoomId, selectedDate]);

  // Apply template when selected
  useEffect(() => {
    if (selectedTemplateId && useTemplate) {
      const template = allTemplates.find(t => t.id === selectedTemplateId);
      if (template) {
        setValue('startTime', template.startTime);
        setValue('endTime', template.endTime);
        setValue('breakMinutes', template.breakMinutes);
        setValue('shiftType', template.shiftType || 'regular');
        setValue('minimumClassification', template.minimumClassification || '');
        setValue('preferredRole', template.preferredRole);
        setValue('templateId', template.id);
        
        if (template.requiredQualifications) {
          setSelectedQualifications(template.requiredQualifications);
          setValue('requiredQualifications', template.requiredQualifications);
        }
        
        if (template.selectedAllowances) {
          setSelectedAllowances(template.selectedAllowances);
          setValue('selectedAllowances', template.selectedAllowances);
        }

        // Apply special shift settings
        if (template.onCallSettings) {
          setValue('onCallStandbyRate', template.onCallSettings.standbyRate);
          setValue('onCallStandbyRateType', template.onCallSettings.standbyRateType);
          setValue('onCallCallbackMinimumHours', template.onCallSettings.callbackMinimumHours);
        }
        if (template.sleepoverSettings) {
          setValue('sleepoverBedtimeStart', template.sleepoverSettings.bedtimeStart);
          setValue('sleepoverBedtimeEnd', template.sleepoverSettings.bedtimeEnd);
          setValue('sleepoverFlatRate', template.sleepoverSettings.flatRate);
        }
        if (template.brokenShiftSettings) {
          setValue('brokenFirstShiftEnd', template.brokenShiftSettings.firstShiftEnd);
          setValue('brokenSecondShiftStart', template.brokenShiftSettings.secondShiftStart);
          setValue('brokenUnpaidGapMinutes', template.brokenShiftSettings.unpaidGapMinutes);
        }
        
        setValue('higherDutiesClassification', template.higherDutiesClassification || '');
        setValue('isRemoteLocation', template.isRemoteLocation || false);
        setValue('defaultTravelKilometres', template.defaultTravelKilometres || 0);
      }
    }
  }, [selectedTemplateId, useTemplate, allTemplates, setValue]);

  const availableQualifications: QualificationType[] = [
    'diploma_ece', 'certificate_iii', 'first_aid', 'food_safety', 
    'working_with_children', 'bachelor_ece', 'masters_ece'
  ];

  const availableAllowances = [
    { id: 'first_aid_allowance', name: 'First Aid Allowance' },
    { id: 'vehicle_allowance', name: 'Vehicle Allowance' },
    { id: 'phone_allowance', name: 'Phone Allowance' },
    { id: 'uniform_allowance', name: 'Uniform Allowance' },
    { id: 'meal_allowance', name: 'Meal Allowance' },
    { id: 'laundry_allowance', name: 'Laundry Allowance' },
  ];

  const toggleQualification = (qual: QualificationType) => {
    const newQuals = selectedQualifications.includes(qual) 
      ? selectedQualifications.filter(q => q !== qual)
      : [...selectedQualifications, qual];
    setSelectedQualifications(newQuals);
    setValue('requiredQualifications', newQuals);
  };

  const toggleAllowance = (allowanceId: string) => {
    const newAllowances = selectedAllowances.includes(allowanceId)
      ? selectedAllowances.filter(a => a !== allowanceId)
      : [...selectedAllowances, allowanceId];
    setSelectedAllowances(newAllowances);
    setValue('selectedAllowances', newAllowances);
  };

  const buildOpenShift = (data: OpenShiftFormValues, roomId: string, date: string): Omit<OpenShift, 'id'> => {
    const openShift: Omit<OpenShift, 'id'> = {
      centreId: data.centreId,
      roomId,
      date,
      startTime: data.startTime,
      endTime: data.endTime,
      requiredQualifications: selectedQualifications,
      urgency: data.urgency,
      applicants: [],
      requiredEmployeeCount: data.requiredEmployeeCount || 1,
      breakMinutes: data.breakMinutes,
      shiftType: data.shiftType,
      minimumClassification: data.minimumClassification || undefined,
      preferredRole: data.preferredRole,
      templateId: data.templateId || undefined,
      selectedAllowances: selectedAllowances.length > 0 ? selectedAllowances : undefined,
      notes: data.notes || undefined,
      higherDutiesClassification: data.higherDutiesClassification || undefined,
      isRemoteLocation: data.isRemoteLocation || undefined,
      defaultTravelKilometres: data.defaultTravelKilometres || undefined,
    };

    // Add special shift settings
    if (data.shiftType === 'on_call' && data.onCallStandbyRate) {
      openShift.onCallSettings = {
        standbyRate: data.onCallStandbyRate,
        standbyRateType: data.onCallStandbyRateType,
        callbackMinimumHours: data.onCallCallbackMinimumHours,
      };
    }
    if (data.shiftType === 'sleepover' && data.sleepoverBedtimeStart) {
      openShift.sleepoverSettings = {
        bedtimeStart: data.sleepoverBedtimeStart,
        bedtimeEnd: data.sleepoverBedtimeEnd,
        flatRate: data.sleepoverFlatRate,
      };
    }
    if (data.shiftType === 'broken' && data.brokenFirstShiftEnd) {
      openShift.brokenShiftSettings = {
        firstShiftEnd: data.brokenFirstShiftEnd,
        secondShiftStart: data.brokenSecondShiftStart,
        unpaidGapMinutes: data.brokenUnpaidGapMinutes,
      };
    }

    return openShift;
  };

  const onSubmit = (data: OpenShiftFormValues) => {
    let openShifts: Omit<OpenShift, 'id'>[] = [];

    if (createMode === 'single') {
      openShifts = [buildOpenShift(data, data.roomId, data.date)];
    } else {
      // Bulk mode - create shifts for all selected room/date combinations
      if (selectedRoomIds.length === 0 || selectedDates.length === 0) {
        toast.error('Please select at least one room and one date');
        return;
      }

      for (const roomId of selectedRoomIds) {
        for (const date of selectedDates) {
          openShifts.push(buildOpenShift(data, roomId, date));
        }
      }
    }

    onAdd(openShifts);
    toast.success(`Created ${openShifts.length} open shift${openShifts.length > 1 ? 's' : ''}`);
    handleClose();
  };

  const handleClose = () => {
    reset();
    setSelectedQualifications([]);
    setSelectedAllowances([]);
    setSelectedTemplateId('');
    setSelectedRoomIds([]);
    setSelectedDates([]);
    setCreateMode('single');
    onClose();
  };

  const urgencyColors = {
    low: { bgcolor: 'grey.100', color: 'grey.700' },
    medium: { bgcolor: 'warning.light', color: 'warning.dark' },
    high: { bgcolor: 'orange.100', color: 'orange.700' },
    critical: { bgcolor: 'error.light', color: 'error.dark' },
  };

  const bulkCount = selectedRoomIds.length * selectedDates.length;

  const handleCreate = async () => {
    // In bulk mode the form's roomId/date fields may be empty (hidden), but the schema still requires them.
    // Keep them in sync so react-hook-form validation doesn't block submission.
    if (createMode === 'bulk') {
      if (selectedRoomIds.length === 0 || selectedDates.length === 0) {
        toast.error('Please select at least one room and one date');
        return;
      }
      setValue('roomId', selectedRoomIds[0], { shouldValidate: true, shouldDirty: true });
      setValue('date', selectedDates[0], { shouldValidate: true, shouldDirty: true });
    }

    // handleSubmit returns a function
    await handleSubmit(onSubmit)();
  };

  const actions: OffCanvasAction[] = [
    { label: 'Cancel', onClick: handleClose, variant: 'outlined' },
    {
      label:
        createMode === 'bulk' && bulkCount > 1
          ? `Create ${bulkCount} Open Shifts`
          : 'Add Open Shift',
      onClick: handleCreate,
      variant: 'primary',
      disabled:
        createMode === 'single'
          ? !isValid
          : selectedRoomIds.length === 0 || selectedDates.length === 0,
    },
  ];
  const handleRoomToggle = (roomId: string) => {
    setSelectedRoomIds(prev => 
      prev.includes(roomId) 
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    );
  };

  const handleDateToggle = (date: string) => {
    setSelectedDates(prev => 
      prev.includes(date)
        ? prev.filter(d => d !== date)
        : [...prev, date]
    );
  };

  const handleSelectAllRooms = () => {
    if (selectedRoomIds.length === rooms.length) {
      setSelectedRoomIds([]);
    } else {
      setSelectedRoomIds(rooms.map(r => r.id));
    }
  };

  const handleSelectAllDates = () => {
    const allDateStrings = dateOptions.map(d => format(d, 'yyyy-MM-dd'));
    if (selectedDates.length === allDateStrings.length) {
      setSelectedDates([]);
    } else {
      setSelectedDates(allDateStrings);
    }
  };

  const renderShiftTypeSettings = () => {
    switch (shiftType) {
      case 'on_call':
        return (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Phone size={16} /> On-Call Settings
            </Typography>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <Controller
                  name="onCallStandbyRate"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Standby Rate ($)"
                      type="number"
                      size="small"
                      fullWidth
                      InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  )}
                />
                <Controller
                  name="onCallStandbyRateType"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <InputLabel>Rate Type</InputLabel>
                      <Select {...field} label="Rate Type">
                        <MenuItem value="per_hour">Per Hour</MenuItem>
                        <MenuItem value="per_period">Per Period</MenuItem>
                        <MenuItem value="daily">Daily</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Stack>
              <Controller
                name="onCallCallbackMinimumHours"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Callback Minimum Hours"
                    type="number"
                    size="small"
                    fullWidth
                    InputProps={{ inputProps: { min: 0, max: 8, step: 0.5 } }}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                )}
              />
            </Stack>
          </Box>
        );

      case 'sleepover':
        return (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Moon size={16} /> Sleepover Settings
            </Typography>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <Controller
                  name="sleepoverBedtimeStart"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Bedtime Start"
                      type="time"
                      size="small"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
                <Controller
                  name="sleepoverBedtimeEnd"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Bedtime End"
                      type="time"
                      size="small"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Stack>
              <Controller
                name="sleepoverFlatRate"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Flat Rate ($)"
                    type="number"
                    size="small"
                    fullWidth
                    InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                )}
              />
            </Stack>
          </Box>
        );

      case 'broken':
        return (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'secondary.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Split size={16} /> Split Shift Settings
            </Typography>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <Controller
                  name="brokenFirstShiftEnd"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="First Shift Ends"
                      type="time"
                      size="small"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
                <Controller
                  name="brokenSecondShiftStart"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Second Shift Starts"
                      type="time"
                      size="small"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Stack>
              <Controller
                name="brokenUnpaidGapMinutes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Unpaid Gap (minutes)"
                    type="number"
                    size="small"
                    fullWidth
                    InputProps={{ inputProps: { min: 60, max: 480, step: 15 } }}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
            </Stack>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <PrimaryOffCanvas
          title="Add Open Shift"
          description="Create open shifts that need to be filled"
          size="lg"
          open={open}
          onClose={handleClose}
          actions={actions}
          showFooter
        >
          <Stack spacing={3}>
              {/* Creation Mode Section */}
              <FormSection title="Creation Mode">
                <ToggleButtonGroup
                  value={createMode}
                  exclusive
                  onChange={(_, value) => value && setCreateMode(value)}
                  size="medium"
                  fullWidth
                  sx={{
                    bgcolor: 'grey.100',
                    borderRadius: 2,
                    p: 0.5,
                    '& .MuiToggleButton-root': {
                      border: 'none',
                      borderRadius: 1.5,
                      py: 1.25,
                      px: 2,
                      fontWeight: 500,
                      textTransform: 'none',
                      color: 'text.secondary',
                      '&:hover': {
                        bgcolor: 'transparent',
                      },
                      '&.Mui-selected': {
                        bgcolor: 'background.paper',
                        color: 'text.primary',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        '&:hover': {
                          bgcolor: 'background.paper',
                        },
                      },
                    },
                  }}
                >
                  <ToggleButton value="single" sx={{ flex: 1, gap: 1 }}>
                    <Clock size={18} />
                    Single Shift
                  </ToggleButton>
                  <ToggleButton value="bulk" sx={{ flex: 1, gap: 1 }}>
                    <Badge badgeContent={bulkCount > 0 ? bulkCount : undefined} color="primary">
                      <Layers size={18} />
                    </Badge>
                    Bulk Create
                  </ToggleButton>
                </ToggleButtonGroup>
              </FormSection>

              {/* Shift Template Section */}
              <FormSection title="Shift Template">
                <StyledSwitch
                  checked={useTemplate}
                  onChange={setUseTemplate}
                  label="Use Shift Template"
                />
                {useTemplate && (
                  <FormControl fullWidth size="small" sx={{ mt: 1.5 }}>
                    <InputLabel>Select Template</InputLabel>
                    <Select
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      label="Select Template"
                    >
                      <MenuItem value="">
                        <em>Custom</em>
                      </MenuItem>
                      {allTemplates.map((template) => (
                        <MenuItem key={template.id} value={template.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                bgcolor: template.color,
                              }}
                            />
                            <span>{template.name}</span>
                            <Typography variant="caption" color="text.secondary">
                              {template.startTime} - {template.endTime}
                            </Typography>
                            {template.shiftType && template.shiftType !== 'regular' && (
                              <Chip
                                size="small"
                                label={shiftTypeLabels[template.shiftType]}
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </FormSection>

              {/* Shift Details Section */}
              <FormSection title="Shift Details">
                {/* Room Selection - Different UI for single vs bulk */}
                {createMode === 'single' ? (
                  <FormField label="Room / Area" required>
                    <Controller
                      name="roomId"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth size="small" error={!!errors.roomId}>
                          <Select {...field} displayEmpty>
                            <MenuItem value="" disabled><em>Select room or area</em></MenuItem>
                            {rooms.map((room) => (
                              <MenuItem key={room.id} value={room.id}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <span>{room.name}</span>
                                  <Typography variant="caption" color="text.secondary">{ageGroupLabels[room.ageGroup]}</Typography>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.roomId && <FormHelperText>{errors.roomId.message}</FormHelperText>}
                        </FormControl>
                      )}
                    />
                  </FormField>
                ) : (
                  <FormField label={`Select Rooms (${selectedRoomIds.length} selected)`} required>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                      <Button size="small" onClick={handleSelectAllRooms}>
                        {selectedRoomIds.length === rooms.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </Box>
                    <FormControl fullWidth size="small" error={selectedRoomIds.length === 0}>
                      <Select
                        multiple
                        value={selectedRoomIds}
                        onChange={(e) => setSelectedRoomIds(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                        input={<OutlinedInput />}
                        displayEmpty
                        renderValue={(selected) => selected.length === 0 ? <em>Select rooms</em> : (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((roomId) => {
                              const room = rooms.find(r => r.id === roomId);
                              return room ? <Chip key={roomId} label={room.name} size="small" /> : null;
                            })}
                          </Box>
                        )}
                        MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
                      >
                        {rooms.map((room) => (
                          <MenuItem key={room.id} value={room.id}>
                            <Checkbox checked={selectedRoomIds.includes(room.id)} />
                            <ListItemText primary={room.name} secondary={ageGroupLabels[room.ageGroup]} />
                          </MenuItem>
                        ))}
                      </Select>
                      {selectedRoomIds.length === 0 && <FormHelperText>Please select at least one room</FormHelperText>}
                    </FormControl>
                  </FormField>
                )}

                {/* Date Selection */}
                {createMode === 'single' ? (
                  <FormField label="Date" required>
                    <Controller
                      name="date"
                      control={control}
                      render={({ field }) => (
                        <TextField {...field} type="date" size="small" fullWidth InputLabelProps={{ shrink: true }} error={!!errors.date} helperText={errors.date?.message} />
                      )}
                    />
                  </FormField>
                ) : (
                  <FormField label={`Select Dates (${selectedDates.length} selected)`} required>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                      <Button size="small" onClick={handleSelectAllDates}>
                        {selectedDates.length === dateOptions.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, p: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, maxHeight: 150, overflow: 'auto' }}>
                      {dateOptions.map((date) => {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                        return (
                          <Chip
                            key={dateStr}
                            label={
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 0.25 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1.2 }}>{format(date, 'EEE')}</Typography>
                                <Typography variant="caption" sx={{ lineHeight: 1.2 }}>{format(date, 'd MMM')}</Typography>
                              </Box>
                            }
                            onClick={() => handleDateToggle(dateStr)}
                            color={selectedDates.includes(dateStr) ? 'primary' : 'default'}
                            variant={selectedDates.includes(dateStr) ? 'filled' : 'outlined'}
                            size="small"
                            sx={{ minWidth: 60, height: 'auto', py: 0.5, ...(isWeekend && !selectedDates.includes(dateStr) && { borderColor: 'warning.main', bgcolor: 'warning.50' }) }}
                          />
                        );
                      })}
                    </Box>
                    {selectedDates.length === 0 && <FormHelperText error>Please select at least one date</FormHelperText>}
                  </FormField>
                )}

                {/* Bulk Summary */}
                {createMode === 'bulk' && bulkCount > 0 && (
                  <Alert severity="info" icon={<Layers size={18} />}>
                    This will create <strong>{bulkCount}</strong> open shift{bulkCount > 1 ? 's' : ''} ({selectedRoomIds.length} room{selectedRoomIds.length > 1 ? 's' : ''} × {selectedDates.length} date{selectedDates.length > 1 ? 's' : ''})
                  </Alert>
                )}

                <FormRow>
                  <FormField label="Start Time" required>
                    <Controller name="startTime" control={control} render={({ field }) => (
                      <TextField {...field} type="time" size="small" fullWidth InputLabelProps={{ shrink: true }} error={!!errors.startTime} helperText={errors.startTime?.message} />
                    )} />
                  </FormField>
                  <FormField label="End Time" required>
                    <Controller name="endTime" control={control} render={({ field }) => (
                      <TextField {...field} type="time" size="small" fullWidth InputLabelProps={{ shrink: true }} error={!!errors.endTime} helperText={errors.endTime?.message} />
                    )} />
                  </FormField>
                </FormRow>

                <FormRow>
                  <FormField label="Break (mins)">
                    <Controller name="breakMinutes" control={control} render={({ field }) => (
                      <TextField {...field} type="number" size="small" fullWidth InputProps={{ inputProps: { min: 0, max: 120, step: 15 } }} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                    )} />
                  </FormField>
                  <FormField label="Required Employees">
                    <Controller name="requiredEmployeeCount" control={control} render={({ field }) => (
                      <TextField {...field} type="number" size="small" fullWidth InputProps={{ inputProps: { min: 1, max: 50, step: 1 } }} onChange={(e) => field.onChange(parseInt(e.target.value) || 1)} helperText="Number of staff needed" />
                    )} />
                  </FormField>
                </FormRow>

                <FormRow>
                  <FormField label="Shift Type">
                    <Controller name="shiftType" control={control} render={({ field }) => (
                      <FormControl fullWidth size="small">
                        <Select {...field}>
                          {(Object.keys(shiftTypeLabels) as ShiftSpecialType[]).map((type) => (
                            <MenuItem key={type} value={type}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{shiftTypeIcons[type]}<span>{shiftTypeLabels[type]}</span></Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )} />
                  </FormField>
                </FormRow>

                {shiftType && shiftType !== 'regular' && (
                  <Alert severity="info" sx={{ py: 0.5 }}>{shiftTypeDescriptions[shiftType]}</Alert>
                )}
                {renderShiftTypeSettings()}
              </FormSection>

              {/* Urgency Section */}
              <FormSection title="Urgency Level">
                <Controller
                  name="urgency"
                  control={control}
                  render={({ field }) => (
                    <Stack direction="row" spacing={1.5}>
                      {([
                        { level: 'low', color: '#10b981', lightBg: '#d1fae5', text: '#065f46' },
                        { level: 'medium', color: '#f59e0b', lightBg: '#fef3c7', text: '#92400e' },
                        { level: 'high', color: '#f97316', lightBg: '#ffedd5', text: '#9a3412' },
                        { level: 'critical', color: '#ef4444', lightBg: '#fee2e2', text: '#991b1b' },
                      ] as const).map(({ level, color, lightBg, text }) => {
                        const isSelected = field.value === level;
                        return (
                          <Button
                            key={level}
                            variant="outlined"
                            size="medium"
                            onClick={() => field.onChange(level)}
                            sx={{
                              flex: 1, py: 1.25, borderRadius: 2, textTransform: 'capitalize', fontWeight: 600, fontSize: '0.875rem',
                              transition: 'all 0.2s ease', borderWidth: 2,
                              borderColor: isSelected ? color : 'grey.300',
                              bgcolor: isSelected ? lightBg : 'transparent',
                              color: isSelected ? text : 'text.secondary',
                              '&:hover': { borderColor: color, bgcolor: lightBg, color: text, borderWidth: 2 },
                            }}
                          >
                            {level}
                          </Button>
                        );
                      })}
                    </Stack>
                  )}
                />
              </FormSection>

              {/* Requirements Section */}
              <FormSection title="Requirements & Classification">
                <FormField label="Preferred Role">
                  <Controller name="preferredRole" control={control} render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <Select {...field} displayEmpty value={field.value || ''}>
                        <MenuItem value=""><em>Any</em></MenuItem>
                        {(Object.keys(roleLabels) as StaffMember['role'][]).map((role) => (
                          <MenuItem key={role} value={role}>{roleLabels[role]}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )} />
                </FormField>
                <FormField label="Minimum Classification">
                  <Controller name="minimumClassification" control={control} render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <Select {...field} displayEmpty value={field.value || ''}>
                        <MenuItem value=""><em>No minimum</em></MenuItem>
                        {classificationLevels.map((level) => <MenuItem key={level} value={level}>{level}</MenuItem>)}
                      </Select>
                    </FormControl>
                  )} />
                </FormField>
                <FormField label="Higher Duties Classification">
                  <Controller name="higherDutiesClassification" control={control} render={({ field }) => (
                    <FormControl fullWidth size="small">
                      <Select {...field} displayEmpty value={field.value || ''}>
                        <MenuItem value=""><em>None</em></MenuItem>
                        {classificationLevels.map((level) => <MenuItem key={level} value={level}>{level}</MenuItem>)}
                      </Select>
                    </FormControl>
                  )} />
                </FormField>
                <FormField label="Required Qualifications">
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
                </FormField>
              </FormSection>

              {/* Allowances Section */}
              <FormSection title="Allowances">
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {availableAllowances.map((allowance) => (
                    <Chip
                      key={allowance.id}
                      label={allowance.name}
                      onClick={() => toggleAllowance(allowance.id)}
                      color={selectedAllowances.includes(allowance.id) ? 'success' : 'default'}
                      variant={selectedAllowances.includes(allowance.id) ? 'filled' : 'outlined'}
                      size="small"
                    />
                  ))}
                </Box>
              </FormSection>

              {/* Travel Section */}
              <FormSection title="Travel & Remote">
                <FormField label="Remote Location">
                  <Controller name="isRemoteLocation" control={control} render={({ field }) => (
                    <StyledSwitch checked={field.value || false} onChange={field.onChange} label="This is a remote location" size="small" />
                  )} />
                </FormField>
                <FormField label="Travel Distance (km)">
                  <Controller name="defaultTravelKilometres" control={control} render={({ field }) => (
                    <TextField {...field} type="number" size="small" fullWidth InputProps={{ inputProps: { min: 0, step: 1 } }} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                  )} />
                </FormField>
              </FormSection>

              {/* Notes Section */}
              <FormSection title="Additional Notes">
                <FormField label="Notes">
                  <Controller name="notes" control={control} render={({ field }) => (
                    <TextField {...field} multiline rows={3} size="small" fullWidth placeholder="Optional notes about this open shift..." error={!!errors.notes} helperText={errors.notes?.message} />
                  )} />
                </FormField>
              </FormSection>
          </Stack>
        </PrimaryOffCanvas>
      </form>
    </FormProvider>
  );
}