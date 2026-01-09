import { useState } from 'react';
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
} from '@mui/material';
import { Room, OpenShift, QualificationType, qualificationLabels, ageGroupLabels } from '@/types/roster';
import { Plus, X, AlertCircle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const [roomId, setRoomId] = useState(selectedRoomId || '');
  const [date, setDate] = useState(selectedDate || '');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [urgency, setUrgency] = useState<OpenShift['urgency']>('medium');
  const [selectedQualifications, setSelectedQualifications] = useState<QualificationType[]>([]);

  const availableQualifications: QualificationType[] = [
    'diploma_ece', 'certificate_iii', 'first_aid', 'food_safety', 
    'working_with_children', 'bachelor_ece', 'masters_ece'
  ];

  const toggleQualification = (qual: QualificationType) => {
    setSelectedQualifications(prev => 
      prev.includes(qual) 
        ? prev.filter(q => q !== qual)
        : [...prev, qual]
    );
  };

  const handleSubmit = () => {
    if (!roomId || !date || !startTime || !endTime) return;

    onAdd({
      centreId,
      roomId,
      date,
      startTime,
      endTime,
      requiredQualifications: selectedQualifications,
      urgency,
      applicants: [],
    });

    // Reset form
    setRoomId('');
    setDate('');
    setStartTime('09:00');
    setEndTime('17:00');
    setUrgency('medium');
    setSelectedQualifications([]);
    onClose();
  };

  const urgencyColors = {
    low: { bgcolor: 'grey.100', color: 'grey.700' },
    medium: { bgcolor: 'warning.light', color: 'warning.dark' },
    high: { bgcolor: 'orange.100', color: 'orange.700' },
    critical: { bgcolor: 'error.light', color: 'error.dark' },
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Add Open Shift
          </SheetTitle>
          <SheetDescription>
            Create a new open shift that needs to be filled
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 pr-4 h-[calc(100vh-220px)]">
          <Stack spacing={3}>
            {/* Room Selection */}
            <FormControl fullWidth size="small">
              <InputLabel>Room / Area</InputLabel>
              <Select
                value={roomId}
                label="Room / Area"
                onChange={(e) => setRoomId(e.target.value)}
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
            </FormControl>

            {/* Date */}
            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            {/* Time */}
            <Stack direction="row" spacing={2}>
              <TextField
                label="Start Time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="End Time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Stack>

            {/* Urgency */}
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Urgency Level
              </Typography>
              <Stack direction="row" spacing={1}>
                {(['low', 'medium', 'high', 'critical'] as const).map((level) => (
                  <Button
                    key={level}
                    variant={urgency === level ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setUrgency(level)}
                    sx={{
                      flex: 1,
                      textTransform: 'capitalize',
                      ...(urgency === level && urgencyColors[level]),
                    }}
                  >
                    {level}
                  </Button>
                ))}
              </Stack>
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
          </Stack>
        </ScrollArea>

        <SheetFooter className="mt-6">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button 
            variant="contained"
            onClick={handleSubmit} 
            disabled={!roomId || !date || !startTime || !endTime}
            startIcon={<Plus size={16} />}
          >
            Add Open Shift
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
