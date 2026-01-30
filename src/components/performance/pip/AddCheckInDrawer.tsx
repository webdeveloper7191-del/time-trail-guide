import React, { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
} from '@mui/material';
import { Button } from '@/components/mui/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  MessageSquare,
  Calendar,
  Users,
  TrendingUp,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { StaffMember } from '@/types/staff';
import { PerformanceImprovementPlan, PIPCheckIn } from '@/types/compensation';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface AddCheckInDrawerProps {
  open: boolean;
  onClose: () => void;
  pip: PerformanceImprovementPlan;
  staff: StaffMember[];
  currentUserId: string;
  onSubmit: (checkIn: Omit<PIPCheckIn, 'id'>) => void;
}

export function AddCheckInDrawer({
  open,
  onClose,
  pip,
  staff,
  currentUserId,
  onSubmit,
}: AddCheckInDrawerProps) {
  const [formData, setFormData] = useState({
    scheduledDate: format(new Date(), 'yyyy-MM-dd'),
    completedDate: format(new Date(), 'yyyy-MM-dd'),
    attendees: [pip.staffId, pip.managerId],
    notes: '',
    progressRating: 3,
    concerns: '',
    nextSteps: '',
  });

  const getStaffMember = (id: string) => staff.find((s) => s.id === id);
  const employee = getStaffMember(pip.staffId);

  const handleAttendeeToggle = (staffId: string) => {
    if (formData.attendees.includes(staffId)) {
      // Don't remove if it's the employee or manager
      if (staffId === pip.staffId || staffId === pip.managerId) return;
      setFormData({
        ...formData,
        attendees: formData.attendees.filter((id) => id !== staffId),
      });
    } else {
      setFormData({
        ...formData,
        attendees: [...formData.attendees, staffId],
      });
    }
  };

  const handleSubmit = () => {
    if (!formData.notes.trim()) {
      toast.error('Please add notes for this check-in');
      return;
    }

    onSubmit({
      scheduledDate: formData.scheduledDate,
      completedDate: formData.completedDate,
      attendees: formData.attendees,
      notes: formData.notes,
      progressRating: formData.progressRating,
      concerns: formData.concerns || undefined,
      nextSteps: formData.nextSteps || undefined,
      createdBy: currentUserId,
    });

    toast.success('Check-in recorded successfully');
    onClose();
  };

  const progressLabels: Record<number, { label: string; color: string }> = {
    1: { label: 'No Progress', color: 'error' },
    2: { label: 'Limited Progress', color: 'warning' },
    3: { label: 'Some Progress', color: 'info' },
    4: { label: 'Good Progress', color: 'success' },
    5: { label: 'Excellent Progress', color: 'success' },
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Add Check-in
          </SheetTitle>
          <SheetDescription>
            Record a check-in meeting for {employee?.firstName} {employee?.lastName}'s PIP
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Context Card */}
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar src={employee?.avatar} sx={{ width: 40, height: 40 }}>
                {employee?.firstName?.[0]}
                {employee?.lastName?.[0]}
              </Avatar>
              <Box flex={1}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {employee?.firstName} {employee?.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  PIP Check-in #{pip.checkIns.length + 1}
                </Typography>
              </Box>
              <Chip
                label={`${pip.checkIns.length} previous`}
                size="small"
                variant="outlined"
              />
            </Stack>
          </Box>

          {/* Dates */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            <div className="space-y-1.5">
              <Label>Scheduled Date</Label>
              <Input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) =>
                  setFormData({ ...formData, scheduledDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Completed Date</Label>
              <Input
                type="date"
                value={formData.completedDate}
                onChange={(e) =>
                  setFormData({ ...formData, completedDate: e.target.value })
                }
              />
            </div>
          </Box>

          {/* Attendees */}
          <Box>
            <Label className="text-sm font-medium mb-2 block">Attendees</Label>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {staff.slice(0, 8).map((s) => {
                const isSelected = formData.attendees.includes(s.id);
                const isRequired = s.id === pip.staffId || s.id === pip.managerId;
                return (
                  <Chip
                    key={s.id}
                    avatar={<Avatar src={s.avatar}>{s.firstName[0]}</Avatar>}
                    label={`${s.firstName} ${s.lastName}`}
                    variant={isSelected ? 'filled' : 'outlined'}
                    color={isSelected ? 'primary' : 'default'}
                    onClick={() => handleAttendeeToggle(s.id)}
                    disabled={isRequired}
                    size="small"
                    sx={{ mb: 0.5 }}
                  />
                );
              })}
            </Stack>
          </Box>

          {/* Progress Rating */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Label className="text-sm font-medium">Progress Rating</Label>
              <Chip
                label={progressLabels[formData.progressRating].label}
                color={progressLabels[formData.progressRating].color as any}
                size="small"
              />
            </Stack>
            <Slider
              value={[formData.progressRating]}
              onValueChange={(value) =>
                setFormData({ ...formData, progressRating: value[0] })
              }
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
            <Stack direction="row" justifyContent="space-between" mt={1}>
              <Typography variant="caption" color="text.secondary">
                No Progress
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Excellent
              </Typography>
            </Stack>
          </Box>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Meeting Notes *</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Document the discussion, progress updates, and any feedback provided..."
              className="min-h-[120px]"
            />
          </div>

          {/* Concerns */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <AlertCircle size={14} className="text-warning" />
              Concerns (if any)
            </Label>
            <Textarea
              value={formData.concerns}
              onChange={(e) => setFormData({ ...formData, concerns: e.target.value })}
              placeholder="Document any concerns or blockers identified..."
              className="min-h-[80px]"
            />
          </div>

          {/* Next Steps */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <ArrowRight size={14} className="text-primary" />
              Next Steps
            </Label>
            <Textarea
              value={formData.nextSteps}
              onChange={(e) => setFormData({ ...formData, nextSteps: e.target.value })}
              placeholder="What actions need to be taken before the next check-in..."
              className="min-h-[80px]"
            />
          </div>
        </div>

        <SheetFooter className="pt-4 border-t">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleSubmit}>
            <MessageSquare size={16} className="mr-1" /> Save Check-in
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default AddCheckInDrawer;
