import React, { useState, useEffect } from 'react';
import {
  Box,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Divider,
  Chip,
  Avatar,
  Alert,
} from '@mui/material';
import { Button } from '@/components/mui/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Plus,
  X,
  Edit,
  Calendar,
  Target,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { StaffMember } from '@/types/staff';
import { PerformanceImprovementPlan, PIPMilestone, pipStatusLabels } from '@/types/compensation';
import { format, parseISO, addDays } from 'date-fns';
import { toast } from 'sonner';

interface EditPIPDrawerProps {
  open: boolean;
  onClose: () => void;
  pip: PerformanceImprovementPlan;
  staff: StaffMember[];
  onSubmit: (updatedPip: Partial<PerformanceImprovementPlan>) => void;
}

export function EditPIPDrawer({ open, onClose, pip, staff, onSubmit }: EditPIPDrawerProps) {
  const [formData, setFormData] = useState({
    reason: pip.reason,
    performanceGaps: [...pip.performanceGaps],
    expectedOutcomes: [...pip.expectedOutcomes],
    supportProvided: [...pip.supportProvided],
    currentEndDate: pip.currentEndDate,
    hrPartnerId: pip.hrPartnerId || '',
    milestones: [...pip.milestones],
  });

  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    targetDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    if (open) {
      setFormData({
        reason: pip.reason,
        performanceGaps: [...pip.performanceGaps],
        expectedOutcomes: [...pip.expectedOutcomes],
        supportProvided: [...pip.supportProvided],
        currentEndDate: pip.currentEndDate,
        hrPartnerId: pip.hrPartnerId || '',
        milestones: [...pip.milestones],
      });
    }
  }, [open, pip]);

  const getStaffMember = (id: string) => staff.find((s) => s.id === id);
  const employee = getStaffMember(pip.staffId);

  const handleArrayFieldChange = (
    field: 'performanceGaps' | 'expectedOutcomes' | 'supportProvided',
    index: number,
    value: string
  ) => {
    const updated = [...formData[field]];
    updated[index] = value;
    setFormData({ ...formData, [field]: updated });
  };

  const addArrayField = (field: 'performanceGaps' | 'expectedOutcomes' | 'supportProvided') => {
    setFormData({ ...formData, [field]: [...formData[field], ''] });
  };

  const removeArrayField = (
    field: 'performanceGaps' | 'expectedOutcomes' | 'supportProvided',
    index: number
  ) => {
    if (formData[field].length > 1) {
      const updated = formData[field].filter((_, i) => i !== index);
      setFormData({ ...formData, [field]: updated });
    }
  };

  const updateMilestoneStatus = (milestoneId: string, status: PIPMilestone['status']) => {
    const updated = formData.milestones.map((m) =>
      m.id === milestoneId
        ? {
            ...m,
            status,
            completedDate: status === 'completed' ? format(new Date(), 'yyyy-MM-dd') : undefined,
          }
        : m
    );
    setFormData({ ...formData, milestones: updated });
  };

  const addMilestone = () => {
    if (!newMilestone.title.trim()) {
      toast.error('Please enter a milestone title');
      return;
    }
    const milestone: PIPMilestone = {
      id: `ms-new-${Date.now()}`,
      title: newMilestone.title,
      description: newMilestone.description,
      targetDate: newMilestone.targetDate,
      status: 'pending',
    };
    setFormData({
      ...formData,
      milestones: [...formData.milestones, milestone],
    });
    setNewMilestone({
      title: '',
      description: '',
      targetDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
    });
  };

  const removeMilestone = (milestoneId: string) => {
    // Only allow removing new (pending) milestones
    const milestone = formData.milestones.find((m) => m.id === milestoneId);
    if (milestone?.status !== 'pending') {
      toast.error('Cannot remove milestones that are in progress or completed');
      return;
    }
    setFormData({
      ...formData,
      milestones: formData.milestones.filter((m) => m.id !== milestoneId),
    });
  };

  const handleSubmit = () => {
    if (!formData.reason.trim()) {
      toast.error('Reason is required');
      return;
    }

    const cleanedData = {
      reason: formData.reason,
      performanceGaps: formData.performanceGaps.filter((g) => g.trim()),
      expectedOutcomes: formData.expectedOutcomes.filter((o) => o.trim()),
      supportProvided: formData.supportProvided.filter((s) => s.trim()),
      currentEndDate: formData.currentEndDate,
      hrPartnerId: formData.hrPartnerId || undefined,
      milestones: formData.milestones,
      updatedAt: new Date().toISOString(),
    };

    onSubmit(cleanedData);
    toast.success('PIP updated successfully');
    onClose();
  };

  const renderArrayField = (
    label: string,
    field: 'performanceGaps' | 'expectedOutcomes' | 'supportProvided',
    placeholder: string
  ) => (
    <Box>
      <Label className="text-sm font-medium mb-2 block">{label}</Label>
      <Stack spacing={1.5}>
        {formData[field].map((value, index) => (
          <Stack key={index} direction="row" spacing={1} alignItems="center">
            <Input
              value={value}
              onChange={(e) => handleArrayFieldChange(field, index, e.target.value)}
              placeholder={placeholder}
              className="flex-1"
            />
            {formData[field].length > 1 && (
              <IconButton size="small" onClick={() => removeArrayField(field, index)}>
                <X size={16} />
              </IconButton>
            )}
          </Stack>
        ))}
        <Button variant="ghost" size="small" onClick={() => addArrayField(field)} className="w-fit">
          <Plus size={14} className="mr-1" /> Add Another
        </Button>
      </Stack>
    </Box>
  );

  const statusIcons: Record<PIPMilestone['status'], React.ReactNode> = {
    pending: <Clock size={14} className="text-muted-foreground" />,
    in_progress: <AlertCircle size={14} className="text-info" />,
    completed: <CheckCircle2 size={14} className="text-success" />,
    missed: <X size={14} className="text-destructive" />,
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            Edit Performance Improvement Plan
          </SheetTitle>
          <SheetDescription>
            Update details and milestones for {employee?.firstName} {employee?.lastName}'s PIP
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Employee Info (read-only) */}
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar src={employee?.avatar} sx={{ width: 48, height: 48 }}>
                {employee?.firstName?.[0]}
                {employee?.lastName?.[0]}
              </Avatar>
              <Box flex={1}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {employee?.firstName} {employee?.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {employee?.position}
                </Typography>
              </Box>
              <Chip label={pipStatusLabels[pip.status]} color="warning" size="small" />
            </Stack>
          </Box>

          {/* HR Partner & End Date */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>HR Partner</InputLabel>
              <Select
                value={formData.hrPartnerId}
                onChange={(e) => setFormData({ ...formData, hrPartnerId: e.target.value })}
                label="HR Partner"
              >
                <MenuItem value="">None</MenuItem>
                {staff.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input
                type="date"
                value={formData.currentEndDate}
                onChange={(e) => setFormData({ ...formData, currentEndDate: e.target.value })}
              />
            </div>
          </Box>

          <Divider />

          {/* Reason */}
          <div className="space-y-1.5">
            <Label>Reason for PIP *</Label>
            <Textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Describe the overall reason for this PIP..."
              className="min-h-[80px]"
            />
          </div>

          {renderArrayField('Performance Gaps', 'performanceGaps', 'Performance gap...')}
          {renderArrayField('Expected Outcomes', 'expectedOutcomes', 'Expected outcome...')}
          {renderArrayField('Support Provided', 'supportProvided', 'Support to be provided...')}

          <Divider />

          {/* Milestones */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>
              Milestones
            </Typography>

            <Stack spacing={1.5} mb={2}>
              {formData.milestones.map((milestone) => (
                <Box
                  key={milestone.id}
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    bgcolor: milestone.status === 'completed' ? 'success.50' : 'grey.50',
                    border: '1px solid',
                    borderColor: milestone.status === 'completed' ? 'success.200' : 'divider',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box flex={1}>
                      <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                        {statusIcons[milestone.status]}
                        <Typography variant="body2" fontWeight={500}>
                          {milestone.title}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {milestone.description}
                      </Typography>
                      <Stack direction="row" spacing={1} mt={1} alignItems="center">
                        <Chip
                          label={format(parseISO(milestone.targetDate), 'MMM d, yyyy')}
                          size="small"
                          icon={<Calendar size={12} />}
                        />
                        {milestone.completedDate && (
                          <Chip
                            label={`Completed ${format(parseISO(milestone.completedDate), 'MMM d')}`}
                            size="small"
                            color="success"
                          />
                        )}
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={0.5}>
                      {milestone.status !== 'completed' && (
                        <Button
                          variant="ghost"
                          size="small"
                          onClick={() => updateMilestoneStatus(milestone.id, 'completed')}
                        >
                          <CheckCircle2 size={14} />
                        </Button>
                      )}
                      {milestone.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="small"
                          onClick={() => updateMilestoneStatus(milestone.id, 'in_progress')}
                        >
                          <Clock size={14} />
                        </Button>
                      )}
                      {milestone.status === 'pending' && (
                        <IconButton size="small" onClick={() => removeMilestone(milestone.id)}>
                          <X size={14} />
                        </IconButton>
                      )}
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>

            {/* Add New Milestone */}
            <Box sx={{ p: 2, border: '2px dashed', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" mb={1.5} display="block">
                Add a new milestone
              </Typography>
              <Stack spacing={1.5}>
                <Input
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                  placeholder="Milestone title"
                />
                <Textarea
                  value={newMilestone.description}
                  onChange={(e) =>
                    setNewMilestone({ ...newMilestone, description: e.target.value })
                  }
                  placeholder="Description"
                  className="min-h-[60px]"
                />
                <Stack direction="row" spacing={2} alignItems="center">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Target Date</Label>
                    <Input
                      type="date"
                      value={newMilestone.targetDate}
                      onChange={(e) =>
                        setNewMilestone({ ...newMilestone, targetDate: e.target.value })
                      }
                    />
                  </div>
                  <Button variant="outline" size="small" onClick={addMilestone} className="mt-5">
                    <Plus size={14} className="mr-1" /> Add
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </Box>
        </div>

        <SheetFooter className="pt-4 border-t">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleSubmit}>
            <Edit size={16} className="mr-1" /> Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default EditPIPDrawer;
