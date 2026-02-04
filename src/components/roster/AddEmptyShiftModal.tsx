import { useState, useMemo } from 'react';
import {
  Button,
  Box,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import PrimaryOffCanvas, { OffCanvasAction } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { StyledSwitch } from '@/components/ui/StyledSwitch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShiftTemplate, 
  Room, 
  QualificationType,
  qualificationLabels,
  roleLabels,
  StaffMember,
  RecurrencePattern,
  RecurrenceEndType,
  RecurringShiftConfig,
} from '@/types/roster';
import { 
  Clock, 
  Plus,
  GraduationCap,
  Award,
  Check,
  Layers,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import { format, parseISO, addDays, addWeeks, addMonths } from 'date-fns';

interface EmptyShift {
  id: string;
  centreId: string;
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  template?: ShiftTemplate;
  requiredQualifications?: QualificationType[];
  minimumClassification?: string;
  preferredRole?: StaffMember['role'];
  recurring?: RecurringShiftConfig;
}

interface AddEmptyShiftModalProps {
  open: boolean;
  onClose: () => void;
  rooms: Room[];
  centreId: string;
  availableDates: Date[];
  shiftTemplates: ShiftTemplate[];
  onAdd: (shifts: EmptyShift[]) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

export function AddEmptyShiftModal({
  open,
  onClose,
  rooms,
  centreId,
  availableDates,
  shiftTemplates,
  onAdd,
}: AddEmptyShiftModalProps) {
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [customStartTime, setCustomStartTime] = useState('09:00');
  const [customEndTime, setCustomEndTime] = useState('17:00');
  const [customBreakMinutes, setCustomBreakMinutes] = useState(30);
  const [activeTab, setActiveTab] = useState('template');
  
  // Recurring shift state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>('weekly');
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default
  const [recurrenceEndType, setRecurrenceEndType] = useState<RecurrenceEndType>('after_occurrences');
  const [recurrenceEndAfter, setRecurrenceEndAfter] = useState(8);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  const selectedTemplate = shiftTemplates.find(t => t.id === selectedTemplateId);

  const toggleRoom = (roomId: string) => {
    setSelectedRoomIds(prev => 
      prev.includes(roomId) 
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    );
  };

  const toggleDate = (dateStr: string) => {
    setSelectedDates(prev => 
      prev.includes(dateStr) 
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    );
  };

  const toggleDayOfWeek = (day: number) => {
    setSelectedDaysOfWeek(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => a - b)
    );
  };

  const selectAllRooms = () => setSelectedRoomIds(rooms.map(r => r.id));
  const deselectAllRooms = () => setSelectedRoomIds([]);
  const selectAllDates = () => setSelectedDates(availableDates.map(d => format(d, 'yyyy-MM-dd')));
  const deselectAllDates = () => setSelectedDates([]);

  const recurrenceConfig: RecurringShiftConfig | undefined = isRecurring ? {
    isRecurring: true,
    pattern: recurrencePattern,
    daysOfWeek: recurrencePattern === 'weekly' || recurrencePattern === 'fortnightly' ? selectedDaysOfWeek : undefined,
    endType: recurrenceEndType,
    endAfterOccurrences: recurrenceEndType === 'after_occurrences' ? recurrenceEndAfter : undefined,
    endDate: recurrenceEndType === 'on_date' ? recurrenceEndDate : undefined,
    recurrenceGroupId: `recurring-${Date.now()}`,
  } : undefined;

  const previewShifts = useMemo(() => {
    const shifts: EmptyShift[] = [];
    
    selectedDates.forEach(date => {
      selectedRoomIds.forEach(roomId => {
        const shift: EmptyShift = {
          id: `empty-${date}-${roomId}-${Date.now()}-${Math.random()}`,
          centreId,
          roomId,
          date,
          startTime: selectedTemplate?.startTime || customStartTime,
          endTime: selectedTemplate?.endTime || customEndTime,
          breakMinutes: selectedTemplate?.breakMinutes ?? customBreakMinutes,
          template: selectedTemplate,
          requiredQualifications: selectedTemplate?.requiredQualifications,
          minimumClassification: selectedTemplate?.minimumClassification,
          preferredRole: selectedTemplate?.preferredRole,
          recurring: recurrenceConfig,
        };
        shifts.push(shift);
      });
    });

    return shifts;
  }, [selectedDates, selectedRoomIds, selectedTemplate, customStartTime, customEndTime, customBreakMinutes, centreId, recurrenceConfig]);

  // Calculate total recurring shifts for preview
  const recurringShiftCount = useMemo(() => {
    if (!isRecurring || selectedDates.length === 0 || selectedRoomIds.length === 0) return 0;
    
    let count = 0;
    const baseCount = selectedRoomIds.length;
    
    if (recurrenceEndType === 'after_occurrences') {
      count = baseCount * recurrenceEndAfter;
    } else if (recurrenceEndType === 'on_date' && recurrenceEndDate) {
      // Estimate based on pattern
      const startDate = selectedDates[0] ? parseISO(selectedDates[0]) : new Date();
      const endDate = parseISO(recurrenceEndDate);
      const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (recurrencePattern === 'daily') {
        count = baseCount * Math.max(0, diffDays);
      } else if (recurrencePattern === 'weekly') {
        count = baseCount * selectedDaysOfWeek.length * Math.ceil(diffDays / 7);
      } else if (recurrencePattern === 'fortnightly') {
        count = baseCount * selectedDaysOfWeek.length * Math.ceil(diffDays / 14);
      } else if (recurrencePattern === 'monthly') {
        count = baseCount * Math.ceil(diffDays / 30);
      }
    } else {
      count = baseCount * 52; // "Never" shows approximate yearly
    }
    
    return Math.max(count, previewShifts.length);
  }, [isRecurring, selectedDates, selectedRoomIds, recurrenceEndType, recurrenceEndAfter, recurrenceEndDate, recurrencePattern, selectedDaysOfWeek, previewShifts.length]);

  const handleAdd = () => {
    if (previewShifts.length === 0) return;
    onAdd(previewShifts);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setSelectedRoomIds([]);
    setSelectedDates([]);
    setSelectedTemplateId('');
    setCustomStartTime('09:00');
    setCustomEndTime('17:00');
    setCustomBreakMinutes(30);
    setActiveTab('template');
    setIsRecurring(false);
    setRecurrencePattern('weekly');
    setSelectedDaysOfWeek([1, 2, 3, 4, 5]);
    setRecurrenceEndType('after_occurrences');
    setRecurrenceEndAfter(8);
    setRecurrenceEndDate('');
  };

  const getRoomName = (roomId: string) => rooms.find(r => r.id === roomId)?.name || 'Unknown';

  const actions: OffCanvasAction[] = [
    {
      label: 'Cancel',
      variant: 'outlined',
      onClick: onClose,
    },
    {
      label: isRecurring 
        ? `Create Recurring Series (${recurringShiftCount} shifts)`
        : `Create ${previewShifts.length} Shift(s)`,
      variant: 'primary',
      onClick: handleAdd,
      disabled: previewShifts.length === 0,
      icon: isRecurring ? <RefreshCw size={16} /> : <Plus size={16} />,
    },
  ];

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Create Empty Shifts"
      description="Create shifts without staff assigned. You can auto-assign staff later based on availability, qualifications, and cost optimization."
      icon={Layers}
      size="lg"
      actions={actions}
    >
      <div className="space-y-4">
        {/* Step 1: Select Template or Custom Times */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="template">Use Template</TabsTrigger>
            <TabsTrigger value="custom">Custom Times</TabsTrigger>
          </TabsList>

          <TabsContent value="template" className="space-y-3">
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Select Shift Template
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {shiftTemplates.map(template => (
                <Box
                  key={template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: selectedTemplateId === template.id ? 'primary.main' : 'divider',
                    bgcolor: selectedTemplateId === template.id ? 'primary.50' : 'background.paper',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      borderColor: selectedTemplateId === template.id ? 'primary.main' : 'primary.light',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: template.color, flexShrink: 0 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {template.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {template.startTime} - {template.endTime} • {template.breakMinutes}min break
                      </Typography>
                    </Box>
                    {selectedTemplateId === template.id && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </Box>
                  {/* Show requirements if any */}
                  {(template.requiredQualifications?.length || template.minimumClassification || template.preferredRole) && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                      {template.requiredQualifications?.map(q => (
                        <Chip 
                          key={q} 
                          size="small" 
                          label={qualificationLabels[q]} 
                          icon={<GraduationCap size={12} />}
                          variant="outlined"
                          sx={{ fontSize: '0.65rem', height: 20 }}
                        />
                      ))}
                      {template.minimumClassification && (
                        <Chip 
                          size="small" 
                          label={template.minimumClassification} 
                          icon={<Award size={12} />}
                          variant="outlined"
                          color="secondary"
                          sx={{ fontSize: '0.65rem', height: 20 }}
                        />
                      )}
                      {template.preferredRole && (
                        <Chip 
                          size="small" 
                          label={roleLabels[template.preferredRole]} 
                          variant="outlined"
                          color="info"
                          sx={{ fontSize: '0.65rem', height: 20 }}
                        />
                      )}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </TabsContent>

          <TabsContent value="custom" className="space-y-3">
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Custom Shift Times
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
              <TextField
                type="time"
                value={customStartTime}
                onChange={(e) => setCustomStartTime(e.target.value)}
                label="Start Time"
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                type="time"
                value={customEndTime}
                onChange={(e) => setCustomEndTime(e.target.value)}
                label="End Time"
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                type="number"
                value={customBreakMinutes}
                onChange={(e) => setCustomBreakMinutes(parseInt(e.target.value) || 0)}
                label="Break (min)"
                size="small"
                inputProps={{ min: 0, max: 120 }}
              />
            </Box>
          </TabsContent>
        </Tabs>

        {/* Recurring Shift Options */}
        <Box sx={{ 
          p: 2, 
          borderRadius: 2, 
          border: '1px solid',
          borderColor: isRecurring ? 'hsl(var(--primary))' : 'divider',
          bgcolor: isRecurring ? 'rgba(3, 169, 244, 0.06)' : 'background.paper',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: isRecurring ? 2 : 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <RefreshCw className={`h-5 w-5 ${isRecurring ? 'text-primary' : 'text-muted-foreground'}`} />
              <Box>
                <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                  Recurring Shift
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Automatically create shifts on a schedule
                </Typography>
              </Box>
            </Box>
            <StyledSwitch
              checked={isRecurring}
              onChange={setIsRecurring}
              label=""
            />
          </Box>

          {isRecurring && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              {/* Recurrence Pattern */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Repeat every
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {(['daily', 'weekly', 'fortnightly', 'monthly'] as RecurrencePattern[]).map((pattern) => (
                    <Chip
                      key={pattern}
                      label={pattern.charAt(0).toUpperCase() + pattern.slice(1)}
                      onClick={() => setRecurrencePattern(pattern)}
                      color={recurrencePattern === pattern ? 'primary' : 'default'}
                      variant={recurrencePattern === pattern ? 'filled' : 'outlined'}
                      size="small"
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Days of Week (for weekly/fortnightly) */}
              {(recurrencePattern === 'weekly' || recurrencePattern === 'fortnightly') && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    On these days
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {DAYS_OF_WEEK.map((day) => (
                      <Chip
                        key={day.value}
                        label={day.label}
                        onClick={() => toggleDayOfWeek(day.value)}
                        color={selectedDaysOfWeek.includes(day.value) ? 'primary' : 'default'}
                        variant={selectedDaysOfWeek.includes(day.value) ? 'filled' : 'outlined'}
                        size="small"
                        sx={{ cursor: 'pointer', minWidth: 40 }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* End Type */}
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Ends
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                      label="Never"
                      onClick={() => setRecurrenceEndType('never')}
                      color={recurrenceEndType === 'never' ? 'primary' : 'default'}
                      variant={recurrenceEndType === 'never' ? 'filled' : 'outlined'}
                      size="small"
                      sx={{ cursor: 'pointer' }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                      label="After"
                      onClick={() => setRecurrenceEndType('after_occurrences')}
                      color={recurrenceEndType === 'after_occurrences' ? 'primary' : 'default'}
                      variant={recurrenceEndType === 'after_occurrences' ? 'filled' : 'outlined'}
                      size="small"
                      sx={{ cursor: 'pointer' }}
                    />
                    {recurrenceEndType === 'after_occurrences' && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          type="number"
                          value={recurrenceEndAfter}
                          onChange={(e) => setRecurrenceEndAfter(parseInt(e.target.value) || 1)}
                          size="small"
                          inputProps={{ min: 1, max: 52 }}
                          sx={{ width: 70 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          occurrences
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                      label="On date"
                      onClick={() => setRecurrenceEndType('on_date')}
                      color={recurrenceEndType === 'on_date' ? 'primary' : 'default'}
                      variant={recurrenceEndType === 'on_date' ? 'filled' : 'outlined'}
                      size="small"
                      sx={{ cursor: 'pointer' }}
                    />
                    {recurrenceEndType === 'on_date' && (
                      <TextField
                        type="date"
                        value={recurrenceEndDate}
                        onChange={(e) => setRecurrenceEndDate(e.target.value)}
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: 160 }}
                      />
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Recurring Preview */}
              <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: 'success.100', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Calendar className="h-4 w-4 text-emerald-700" />
                <Typography variant="caption" color="success.dark">
                  {recurrenceEndType === 'never' 
                    ? 'This will create an ongoing recurring shift series'
                    : recurrenceEndType === 'after_occurrences'
                      ? `This will create ${recurringShiftCount} shifts over ${recurrenceEndAfter} ${recurrencePattern === 'weekly' ? 'weeks' : recurrencePattern}${recurrencePattern === 'weekly' || recurrencePattern === 'fortnightly' ? '' : 's'}`
                      : recurrenceEndDate 
                        ? `This will create approximately ${recurringShiftCount} shifts until ${format(parseISO(recurrenceEndDate), 'MMM d, yyyy')}`
                        : 'Select an end date'
                  }
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        {/* Step 2: Select Rooms */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              Select Rooms
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="text" onClick={selectAllRooms}>Select All</Button>
              <Button size="small" variant="text" onClick={deselectAllRooms}>Clear</Button>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {rooms.map(room => (
              <Chip
                key={room.id}
                label={room.name}
                onClick={() => toggleRoom(room.id)}
                color={selectedRoomIds.includes(room.id) ? 'primary' : 'default'}
                variant={selectedRoomIds.includes(room.id) ? 'filled' : 'outlined'}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Box>

        {/* Step 3: Select Dates */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              {isRecurring ? 'Start Date' : 'Select Dates'}
            </Typography>
            {!isRecurring && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" variant="text" onClick={selectAllDates}>Select All</Button>
                <Button size="small" variant="text" onClick={deselectAllDates}>Clear</Button>
              </Box>
            )}
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 1 }}>
            {availableDates.map(date => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const isSelected = selectedDates.includes(dateStr);
              // For recurring, only allow single date selection
              const shouldShow = isRecurring ? (selectedDates.length === 0 || isSelected) : true;
              if (!shouldShow && isRecurring) return null;
              
              return (
                <Box
                  key={dateStr}
                  onClick={() => {
                    if (isRecurring) {
                      setSelectedDates(isSelected ? [] : [dateStr]);
                    } else {
                      toggleDate(dateStr);
                    }
                  }}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    bgcolor: isSelected ? 'primary.50' : 'background.paper',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      borderColor: isSelected ? 'primary.main' : 'primary.light',
                    },
                  }}
                >
                  <Typography variant="caption" color="text.secondary" display="block">
                    {format(date, 'EEE')}
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {format(date, 'MMM d')}
                  </Typography>
                </Box>
              );
            })}
          </Box>
          {isRecurring && selectedDates.length === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Select a start date for the recurring series
            </Typography>
          )}
        </Box>

        {/* Preview */}
        {previewShifts.length > 0 && (
          <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {isRecurring && <RefreshCw className="h-4 w-4 text-emerald-600" />}
              <Typography variant="subtitle2" fontWeight={600}>
                {isRecurring ? 'Recurring Series Preview' : 'Preview'}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {isRecurring 
                ? `${recurringShiftCount} shifts will be created in this recurring series`
                : `${previewShifts.length} empty shift(s) will be created:`
              }
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {previewShifts.slice(0, 10).map(shift => (
                <Chip
                  key={shift.id}
                  size="small"
                  label={`${getRoomName(shift.roomId)} - ${format(parseISO(shift.date), 'EEE d')}`}
                  variant="outlined"
                  icon={isRecurring ? <RefreshCw size={12} /> : undefined}
                />
              ))}
              {(isRecurring ? recurringShiftCount : previewShifts.length) > 10 && (
                <Chip
                  size="small"
                  label={`+${(isRecurring ? recurringShiftCount : previewShifts.length) - 10} more`}
                  variant="outlined"
                  color="primary"
                />
              )}
            </Box>
          </Box>
        )}
      </div>
    </PrimaryOffCanvas>
  );
}
