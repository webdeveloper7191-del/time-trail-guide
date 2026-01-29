import React, { useState } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Chip,
  Avatar,
} from '@mui/material';
import { Button } from '@/components/mui/Button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Users, Scale, X } from 'lucide-react';
import type { CalibrationSession } from '@/types/advancedPerformance';
import { mockStaff } from '@/data/mockStaffData';

interface CreateCalibrationSessionDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (session: Partial<CalibrationSession>) => void;
}

export function CreateCalibrationSessionDrawer({ open, onClose, onSave }: CreateCalibrationSessionDrawerProps) {
  const [title, setTitle] = useState('');
  const [reviewCycle, setReviewCycle] = useState('Q1 2024 Review');
  const [scheduledDate, setScheduledDate] = useState('');
  const [facilitatorId, setFacilitatorId] = useState('');
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const addParticipant = (id: string) => {
    if (!participantIds.includes(id)) {
      setParticipantIds([...participantIds, id]);
    }
  };

  const removeParticipant = (id: string) => {
    setParticipantIds(participantIds.filter(p => p !== id));
  };

  const handleSave = () => {
    const session: Partial<CalibrationSession> = {
      id: `session-new-${Date.now()}`,
      title,
      reviewCycle,
      scheduledDate: new Date(scheduledDate).toISOString(),
      facilitatorId,
      participantIds,
      status: 'scheduled',
      notes,
    };
    onSave(session);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setReviewCycle('Q1 2024 Review');
    setScheduledDate('');
    setFacilitatorId('');
    setParticipantIds([]);
    setNotes('');
  };

  const isValid = title.trim() && scheduledDate && facilitatorId && participantIds.length > 0;

  const availableParticipants = mockStaff.filter(s => !participantIds.includes(s.id) && s.id !== facilitatorId);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Scale size={20} />
            Schedule Calibration Session
          </SheetTitle>
        </SheetHeader>

        <Box sx={{ mt: 3 }}>
          <Stack spacing={3}>
            {/* Title */}
            <Box>
              <Label htmlFor="title" className="mb-2 block">Session Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Q1 Performance Calibration - Engineering"
              />
            </Box>

            {/* Review Cycle */}
            <Box>
              <Label className="mb-2 block">Review Cycle</Label>
              <Select value={reviewCycle} onValueChange={setReviewCycle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Q1 2024 Review">Q1 2024 Review</SelectItem>
                  <SelectItem value="Q2 2024 Review">Q2 2024 Review</SelectItem>
                  <SelectItem value="Annual 2024">Annual 2024 Review</SelectItem>
                  <SelectItem value="Mid-Year 2024">Mid-Year 2024 Review</SelectItem>
                </SelectContent>
              </Select>
            </Box>

            {/* Date & Time */}
            <Box>
              <Label htmlFor="date" className="mb-2 block flex items-center gap-2">
                <Calendar size={14} />
                Scheduled Date & Time *
              </Label>
              <Input
                id="date"
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </Box>

            {/* Facilitator */}
            <Box>
              <Label className="mb-2 block">Facilitator *</Label>
              <Select value={facilitatorId} onValueChange={setFacilitatorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select facilitator..." />
                </SelectTrigger>
                <SelectContent>
                  {mockStaff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} - {s.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Box>

            {/* Participants */}
            <Box>
              <Label className="mb-2 block flex items-center gap-2">
                <Users size={14} />
                Participants * ({participantIds.length} selected)
              </Label>
              <Select value="" onValueChange={addParticipant}>
                <SelectTrigger>
                  <SelectValue placeholder="Add participants..." />
                </SelectTrigger>
                <SelectContent>
                  {availableParticipants.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} - {s.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {participantIds.length > 0 && (
                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
                  {participantIds.map(id => {
                    const staff = mockStaff.find(s => s.id === id);
                    if (!staff) return null;
                    return (
                      <Chip
                        key={id}
                        avatar={<Avatar sx={{ width: 24, height: 24, fontSize: 10 }}>{staff.firstName.charAt(0)}</Avatar>}
                        label={`${staff.firstName} ${staff.lastName}`}
                        onDelete={() => removeParticipant(id)}
                        deleteIcon={<X size={14} />}
                        size="small"
                      />
                    );
                  })}
                </Stack>
              )}
            </Box>

            {/* Notes */}
            <Box>
              <Label htmlFor="notes" className="mb-2 block">Session Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Agenda items, focus areas, preparation required..."
                rows={3}
              />
            </Box>
          </Stack>
        </Box>

        <SheetFooter className="mt-6">
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSave}
            disabled={!isValid}
          >
            Schedule Session
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
