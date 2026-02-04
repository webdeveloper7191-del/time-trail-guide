import React, { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Alert,
} from '@mui/material';
import { Button } from '@/components/mui/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  X,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { StaffMember } from '@/types/staff';
import { PIPMilestone } from '@/types/compensation';
import { format, addDays, addMonths } from 'date-fns';
import { toast } from 'sonner';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection, FormField, FormRow } from '@/components/ui/off-canvas/FormSection';

interface CreatePIPDrawerProps {
  open: boolean;
  onClose: () => void;
  staff: StaffMember[];
  currentUserId: string;
  onSubmit: (pipData: PIPFormData) => void;
}

export interface PIPFormData {
  staffId: string;
  managerId: string;
  hrPartnerId?: string;
  reason: string;
  performanceGaps: string[];
  expectedOutcomes: string[];
  supportProvided: string[];
  startDate: string;
  endDate: string;
  milestones: Omit<PIPMilestone, 'id' | 'status'>[];
}

export function CreatePIPDrawer({ open, onClose, staff, currentUserId, onSubmit }: CreatePIPDrawerProps) {
  const [formData, setFormData] = useState<PIPFormData>({
    staffId: '',
    managerId: currentUserId,
    hrPartnerId: '',
    reason: '',
    performanceGaps: [''],
    expectedOutcomes: [''],
    supportProvided: [''],
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addMonths(new Date(), 3), 'yyyy-MM-dd'),
    milestones: [],
  });

  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    targetDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
  });

  const handleArrayFieldChange = (field: 'performanceGaps' | 'expectedOutcomes' | 'supportProvided', index: number, value: string) => {
    const updated = [...formData[field]];
    updated[index] = value;
    setFormData({ ...formData, [field]: updated });
  };

  const addArrayField = (field: 'performanceGaps' | 'expectedOutcomes' | 'supportProvided') => {
    setFormData({ ...formData, [field]: [...formData[field], ''] });
  };

  const removeArrayField = (field: 'performanceGaps' | 'expectedOutcomes' | 'supportProvided', index: number) => {
    if (formData[field].length > 1) {
      const updated = formData[field].filter((_, i) => i !== index);
      setFormData({ ...formData, [field]: updated });
    }
  };

  const addMilestone = () => {
    if (!newMilestone.title.trim()) {
      toast.error('Please enter a milestone title');
      return;
    }
    setFormData({
      ...formData,
      milestones: [...formData.milestones, { ...newMilestone }],
    });
    setNewMilestone({
      title: '',
      description: '',
      targetDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    });
  };

  const removeMilestone = (index: number) => {
    setFormData({
      ...formData,
      milestones: formData.milestones.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = () => {
    if (!formData.staffId) {
      toast.error('Please select an employee');
      return;
    }
    if (!formData.reason.trim()) {
      toast.error('Please provide a reason for the PIP');
      return;
    }
    if (formData.performanceGaps.filter(g => g.trim()).length === 0) {
      toast.error('Please add at least one performance gap');
      return;
    }
    if (formData.expectedOutcomes.filter(o => o.trim()).length === 0) {
      toast.error('Please add at least one expected outcome');
      return;
    }
    if (formData.milestones.length === 0) {
      toast.error('Please add at least one milestone');
      return;
    }

    // Filter out empty values
    const cleanedData = {
      ...formData,
      performanceGaps: formData.performanceGaps.filter(g => g.trim()),
      expectedOutcomes: formData.expectedOutcomes.filter(o => o.trim()),
      supportProvided: formData.supportProvided.filter(s => s.trim()),
    };

    onSubmit(cleanedData);
    toast.success('PIP created successfully');
    onClose();
  };

  const renderArrayField = (
    field: 'performanceGaps' | 'expectedOutcomes' | 'supportProvided',
    placeholder: string
  ) => (
    <div className="space-y-2">
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
      <Button variant="ghost" size="small" onClick={() => addArrayField(field)} className="w-fit text-primary">
        <Plus size={14} className="mr-1" /> Add Another
      </Button>
    </div>
  );

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Create Performance Improvement Plan"
      icon={AlertTriangle}
      size="xl"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'secondary' },
        { label: 'Create PIP', onClick: handleSubmit, variant: 'primary' },
      ]}
    >
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          A PIP is a formal document. Ensure all information is accurate and has been reviewed with HR before proceeding.
        </Typography>
      </Alert>

      {/* Employee & Assignment Section */}
      <FormSection title="Employee & Assignment" tooltip="Select the employee and assign relevant parties">
        <FormRow>
          <FormField label="Employee" required tooltip="Select the employee for this PIP">
            <FormControl fullWidth size="small">
              <Select
                value={formData.staffId}
                onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                displayEmpty
              >
                <MenuItem value="" disabled>Select Employee</MenuItem>
                {staff.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} - {s.position}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </FormField>

          <FormField label="HR Partner" tooltip="Optionally assign an HR partner">
            <FormControl fullWidth size="small">
              <Select
                value={formData.hrPartnerId}
                onChange={(e) => setFormData({ ...formData, hrPartnerId: e.target.value })}
                displayEmpty
              >
                <MenuItem value="">None</MenuItem>
                {staff.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </FormField>
        </FormRow>
      </FormSection>

      {/* PIP Duration Section */}
      <FormSection title="PIP Duration" tooltip="Set the start and end dates for this improvement plan">
        <FormRow>
          <FormField label="Start Date" required>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
          </FormField>
          <FormField label="End Date" required>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </FormField>
        </FormRow>
      </FormSection>

      {/* Reason & Context Section */}
      <FormSection title="Reason & Context" tooltip="Document the reason for initiating this PIP">
        <FormField label="Reason for PIP" required>
          <Textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="Describe the overall reason for initiating this performance improvement plan..."
            className="min-h-[100px]"
          />
        </FormField>
      </FormSection>

      {/* Performance Gaps Section */}
      <FormSection title="Performance Gaps" tooltip="List specific areas where performance is not meeting expectations">
        <FormField label="Identified Gaps" required>
          {renderArrayField('performanceGaps', 'e.g., Missed 5 project deadlines in Q3')}
        </FormField>
      </FormSection>

      {/* Expected Outcomes Section */}
      <FormSection title="Expected Outcomes" tooltip="Define the measurable outcomes expected from this PIP">
        <FormField label="Success Criteria" required>
          {renderArrayField('expectedOutcomes', 'e.g., Meet 90% of deadlines within agreed timeframes')}
        </FormField>
      </FormSection>

      {/* Support Provided Section */}
      <FormSection title="Support Provided" tooltip="Document the support that will be provided to help the employee succeed">
        <FormField label="Support Resources">
          {renderArrayField('supportProvided', 'e.g., Weekly coaching sessions with manager')}
        </FormField>
      </FormSection>

      {/* Milestones Section */}
      <FormSection title="Milestones" tooltip="Define key checkpoints to track progress">
        <FormField label="Progress Checkpoints" required>
          <div className="space-y-3">
            {formData.milestones.length > 0 && (
              <Stack spacing={1.5}>
                {formData.milestones.map((milestone, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: 'hsl(var(--muted) / 0.5)',
                      border: '1px solid hsl(var(--border))',
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box flex={1}>
                        <Typography variant="body2" fontWeight={500}>
                          {milestone.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {milestone.description}
                        </Typography>
                        <Chip
                          label={format(new Date(milestone.targetDate), 'MMM d, yyyy')}
                          size="small"
                          sx={{ mt: 1 }}
                          icon={<Calendar size={12} />}
                        />
                      </Box>
                      <IconButton size="small" onClick={() => removeMilestone(index)}>
                        <X size={16} />
                      </IconButton>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}

            <Box sx={{ p: 2, border: '2px dashed hsl(var(--border))', borderRadius: 1 }}>
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
                  onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                  placeholder="Description of what needs to be achieved"
                  className="min-h-[60px]"
                />
                <Stack direction="row" spacing={2} alignItems="center">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs text-primary font-medium">Target Date</label>
                    <Input
                      type="date"
                      value={newMilestone.targetDate}
                      onChange={(e) => setNewMilestone({ ...newMilestone, targetDate: e.target.value })}
                    />
                  </div>
                  <Button variant="outline" size="small" onClick={addMilestone} className="mt-5 text-primary">
                    <Plus size={14} className="mr-1" /> Add Milestone
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </div>
        </FormField>
      </FormSection>
    </PrimaryOffCanvas>
  );
}

export default CreatePIPDrawer;
