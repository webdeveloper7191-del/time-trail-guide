import React, { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Divider,
  Chip,
  Alert,
} from '@mui/material';
import { Dialog, DialogContent, DialogActions } from '@/components/mui/Dialog';
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
  AlertTriangle,
  Calendar,
  Target,
  User,
  FileText,
} from 'lucide-react';
import { StaffMember } from '@/types/staff';
import { PIPMilestone } from '@/types/compensation';
import { format, addDays, addMonths } from 'date-fns';
import { toast } from 'sonner';

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

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Create Performance Improvement Plan
          </SheetTitle>
          <SheetDescription>
            Document performance concerns and create a structured improvement plan
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              A PIP is a formal document. Ensure all information is accurate and has been reviewed with HR before proceeding.
            </Typography>
          </Alert>

          {/* Employee Selection */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Employee *</InputLabel>
              <Select
                value={formData.staffId}
                onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                label="Employee *"
              >
                {staff.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} - {s.position}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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
          </Box>

          {/* Dates */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            <div className="space-y-1.5">
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>End Date *</Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
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
              placeholder="Describe the overall reason for initiating this performance improvement plan..."
              className="min-h-[100px]"
            />
          </div>

          <Divider />

          {/* Performance Gaps */}
          {renderArrayField('Performance Gaps *', 'performanceGaps', 'e.g., Missed 5 project deadlines in Q3')}

          {/* Expected Outcomes */}
          {renderArrayField('Expected Outcomes *', 'expectedOutcomes', 'e.g., Meet 90% of deadlines within agreed timeframes')}

          {/* Support Provided */}
          {renderArrayField('Support to be Provided', 'supportProvided', 'e.g., Weekly coaching sessions with manager')}

          <Divider />

          {/* Milestones */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>
              Milestones *
            </Typography>

            {formData.milestones.length > 0 && (
              <Stack spacing={1.5} mb={2}>
                {formData.milestones.map((milestone, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: 'grey.50',
                      border: '1px solid',
                      borderColor: 'divider',
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
                  onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                  placeholder="Description of what needs to be achieved"
                  className="min-h-[60px]"
                />
                <Stack direction="row" spacing={2} alignItems="center">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Target Date</Label>
                    <Input
                      type="date"
                      value={newMilestone.targetDate}
                      onChange={(e) => setNewMilestone({ ...newMilestone, targetDate: e.target.value })}
                    />
                  </div>
                  <Button variant="outline" size="small" onClick={addMilestone} className="mt-5">
                    <Plus size={14} className="mr-1" /> Add Milestone
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
            <FileText size={16} className="mr-1" /> Create PIP
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default CreatePIPDrawer;
