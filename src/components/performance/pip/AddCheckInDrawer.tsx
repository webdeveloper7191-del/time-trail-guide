import React, { useState } from 'react';
import { Avatar, Chip, Stack } from '@mui/material';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { MessageSquare, AlertCircle, ArrowRight } from 'lucide-react';
import { StaffMember } from '@/types/staff';
import { PerformanceImprovementPlan, PIPCheckIn } from '@/types/compensation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection, FormField, FormRow } from '@/components/ui/off-canvas/FormSection';

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

  const progressLabels: Record<number, { label: string; color: 'error' | 'warning' | 'info' | 'success' }> = {
    1: { label: 'No Progress', color: 'error' },
    2: { label: 'Limited Progress', color: 'warning' },
    3: { label: 'Some Progress', color: 'info' },
    4: { label: 'Good Progress', color: 'success' },
    5: { label: 'Excellent Progress', color: 'success' },
  };

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Add Check-in"
      description={`Record a check-in meeting for ${employee?.firstName} ${employee?.lastName}'s PIP`}
      icon={MessageSquare}
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'secondary' },
        { label: 'Save Check-in', onClick: handleSubmit, variant: 'primary' },
      ]}
    >
      <div className="space-y-6">
        {/* Employee Context */}
        <FormSection title="Check-in Context">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Avatar src={employee?.avatar} sx={{ width: 40, height: 40 }}>
              {employee?.firstName?.[0]}
              {employee?.lastName?.[0]}
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-sm">
                {employee?.firstName} {employee?.lastName}
              </p>
              <p className="text-xs text-muted-foreground">
                PIP Check-in #{pip.checkIns.length + 1}
              </p>
            </div>
            <Chip label={`${pip.checkIns.length} previous`} size="small" variant="outlined" />
          </div>
        </FormSection>

        {/* Meeting Dates */}
        <FormSection title="Meeting Details" tooltip="When the check-in was scheduled and completed">
          <FormRow>
            <FormField label="Scheduled Date">
              <Input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              />
            </FormField>
            <FormField label="Completed Date">
              <Input
                type="date"
                value={formData.completedDate}
                onChange={(e) => setFormData({ ...formData, completedDate: e.target.value })}
              />
            </FormField>
          </FormRow>

          <FormField label="Attendees" tooltip="Select who attended this check-in">
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
          </FormField>
        </FormSection>

        {/* Progress Rating */}
        <FormSection title="Progress Assessment" tooltip="Rate the employee's progress">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary">Progress Rating</span>
              <Chip
                label={progressLabels[formData.progressRating].label}
                color={progressLabels[formData.progressRating].color}
                size="small"
              />
            </div>
            <Slider
              value={[formData.progressRating]}
              onValueChange={(value) => setFormData({ ...formData, progressRating: value[0] })}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>No Progress</span>
              <span>Excellent</span>
            </div>
          </div>
        </FormSection>

        {/* Notes */}
        <FormSection title="Meeting Notes" tooltip="Document the discussion and any feedback">
          <FormField label="Notes" required>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Document the discussion, progress updates, and any feedback provided..."
              className="min-h-[120px]"
            />
          </FormField>

          <FormField 
            label="Concerns" 
            tooltip="Document any concerns or blockers identified"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <AlertCircle size={14} className="text-amber-500" />
              <span className="text-xs text-muted-foreground">Optional</span>
            </div>
            <Textarea
              value={formData.concerns}
              onChange={(e) => setFormData({ ...formData, concerns: e.target.value })}
              placeholder="Document any concerns or blockers identified..."
              className="min-h-[80px]"
            />
          </FormField>

          <FormField 
            label="Next Steps" 
            tooltip="Actions before the next check-in"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowRight size={14} className="text-primary" />
              <span className="text-xs text-muted-foreground">Optional</span>
            </div>
            <Textarea
              value={formData.nextSteps}
              onChange={(e) => setFormData({ ...formData, nextSteps: e.target.value })}
              placeholder="What actions need to be taken before the next check-in..."
              className="min-h-[80px]"
            />
          </FormField>
        </FormSection>
      </div>
    </PrimaryOffCanvas>
  );
}

export default AddCheckInDrawer;
