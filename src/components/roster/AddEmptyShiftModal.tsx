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
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShiftTemplate, 
  Room, 
  QualificationType,
  qualificationLabels,
  roleLabels,
  StaffMember,
} from '@/types/roster';
import { 
  Clock, 
  Calendar, 
  Plus,
  GraduationCap,
  Award,
  Check,
  X,
  Layers,
} from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

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

  const selectAllRooms = () => setSelectedRoomIds(rooms.map(r => r.id));
  const deselectAllRooms = () => setSelectedRoomIds([]);
  const selectAllDates = () => setSelectedDates(availableDates.map(d => format(d, 'yyyy-MM-dd')));
  const deselectAllDates = () => setSelectedDates([]);

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
        };
        shifts.push(shift);
      });
    });

    return shifts;
  }, [selectedDates, selectedRoomIds, selectedTemplate, customStartTime, customEndTime, customBreakMinutes, centreId]);

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
  };

  const getRoomName = (roomId: string) => rooms.find(r => r.id === roomId)?.name || 'Unknown';

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[600px] sm:max-w-[600px] p-0">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Create Empty Shifts
          </SheetTitle>
          <SheetDescription>
            Create shifts without staff assigned. You can auto-assign staff later based on 
            availability, qualifications, and cost optimization.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-280px)]">
          <Box className="p-6 pt-4 space-y-4">
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
                  Select Dates
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" variant="text" onClick={selectAllDates}>Select All</Button>
                  <Button size="small" variant="text" onClick={deselectAllDates}>Clear</Button>
                </Box>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 1 }}>
                {availableDates.map(date => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const isSelected = selectedDates.includes(dateStr);
                  return (
                    <Box
                      key={dateStr}
                      onClick={() => toggleDate(dateStr)}
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
            </Box>

            {/* Preview */}
            {previewShifts.length > 0 && (
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Preview
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {previewShifts.length} empty shift(s) will be created:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                  {previewShifts.slice(0, 10).map(shift => (
                    <Chip
                      key={shift.id}
                      size="small"
                      label={`${getRoomName(shift.roomId)} - ${format(parseISO(shift.date), 'EEE d')}`}
                      variant="outlined"
                    />
                  ))}
                  {previewShifts.length > 10 && (
                    <Chip
                      size="small"
                      label={`+${previewShifts.length - 10} more`}
                      variant="outlined"
                      color="primary"
                    />
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </ScrollArea>

        <SheetFooter className="p-6 pt-4 border-t">
          <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
            <Button variant="outlined" onClick={onClose} sx={{ flex: 1 }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleAdd}
              disabled={previewShifts.length === 0}
              startIcon={<Plus size={16} />}
              sx={{ flex: 1 }}
            >
              Create {previewShifts.length} Shift(s)
            </Button>
          </Box>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
