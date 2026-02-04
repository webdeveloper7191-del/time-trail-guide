import React, { useState, useEffect } from 'react';
import { IconButton, Avatar, Chip } from '@mui/material';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Edit, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { StaffMember } from '@/types/staff';
import { PerformanceImprovementPlan, PIPMilestone, pipStatusLabels } from '@/types/compensation';
import { format, parseISO, addDays } from 'date-fns';
import { toast } from 'sonner';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection, FormField, FormRow } from '@/components/ui/off-canvas/FormSection';

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
    <div className="space-y-2">
      {formData[field].map((value, index) => (
        <div key={index} className="flex items-center gap-2">
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
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={() => addArrayField(field)} className="w-fit">
        <Plus size={14} className="mr-1" /> Add Another
      </Button>
    </div>
  );

  const statusIcons: Record<PIPMilestone['status'], React.ReactNode> = {
    pending: <Clock size={14} className="text-muted-foreground" />,
    in_progress: <AlertCircle size={14} className="text-blue-500" />,
    completed: <CheckCircle2 size={14} className="text-green-500" />,
    missed: <X size={14} className="text-destructive" />,
  };

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Edit Performance Improvement Plan"
      icon={Edit}
      size="lg"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'secondary' },
        { label: 'Save Changes', onClick: handleSubmit, variant: 'primary' },
      ]}
    >
      <div className="space-y-6">
        {/* Employee Info */}
        <FormSection title="Employee Information">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Avatar src={employee?.avatar} sx={{ width: 48, height: 48 }}>
              {employee?.firstName?.[0]}
              {employee?.lastName?.[0]}
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold">
                {employee?.firstName} {employee?.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{employee?.position}</p>
            </div>
            <Chip label={pipStatusLabels[pip.status]} color="warning" size="small" />
          </div>
        </FormSection>

        {/* HR Partner & End Date */}
        <FormSection title="Plan Settings" tooltip="Configure the HR partner and plan end date">
          <FormRow>
            <FormField label="HR Partner">
              <Select
                value={formData.hrPartnerId}
                onValueChange={(value) => setFormData({ ...formData, hrPartnerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select HR Partner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="End Date">
              <Input
                type="date"
                value={formData.currentEndDate}
                onChange={(e) => setFormData({ ...formData, currentEndDate: e.target.value })}
              />
            </FormField>
          </FormRow>
        </FormSection>

        {/* Reason */}
        <FormSection title="PIP Details" tooltip="Document the reason and gaps for this PIP">
          <FormField label="Reason for PIP" required>
            <Textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Describe the overall reason for this PIP..."
              className="min-h-[80px]"
            />
          </FormField>

          <FormField label="Performance Gaps" tooltip="List the specific performance gaps identified">
            {renderArrayField('Performance Gaps', 'performanceGaps', 'Performance gap...')}
          </FormField>

          <FormField label="Expected Outcomes" tooltip="What outcomes are expected from this PIP">
            {renderArrayField('Expected Outcomes', 'expectedOutcomes', 'Expected outcome...')}
          </FormField>

          <FormField label="Support Provided" tooltip="Support that will be provided to the employee">
            {renderArrayField('Support Provided', 'supportProvided', 'Support to be provided...')}
          </FormField>
        </FormSection>

        {/* Milestones */}
        <FormSection title="Milestones" tooltip="Track progress through milestones">
          <div className="space-y-2">
            {formData.milestones.map((milestone) => (
              <div
                key={milestone.id}
                className={`p-3 rounded-lg border ${
                  milestone.status === 'completed'
                    ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900'
                    : 'bg-muted/50 border-border'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {statusIcons[milestone.status]}
                      <span className="font-medium text-sm">{milestone.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{milestone.description}</p>
                    <div className="flex items-center gap-2 mt-2">
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
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {milestone.status !== 'completed' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateMilestoneStatus(milestone.id, 'completed')}
                      >
                        <CheckCircle2 size={14} />
                      </Button>
                    )}
                    {milestone.status === 'pending' && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateMilestoneStatus(milestone.id, 'in_progress')}
                        >
                          <Clock size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeMilestone(milestone.id)}
                        >
                          <X size={14} />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Milestone */}
          <div className="p-3 border-2 border-dashed border-border rounded-lg mt-3">
            <p className="text-xs text-muted-foreground mb-2">Add a new milestone</p>
            <div className="space-y-2">
              <Input
                value={newMilestone.title}
                onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                placeholder="Milestone title"
              />
              <Textarea
                value={newMilestone.description}
                onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                placeholder="Description"
                className="min-h-[60px]"
              />
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    type="date"
                    value={newMilestone.targetDate}
                    onChange={(e) => setNewMilestone({ ...newMilestone, targetDate: e.target.value })}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={addMilestone}>
                  <Plus size={14} className="mr-1" /> Add
                </Button>
              </div>
            </div>
          </div>
        </FormSection>
      </div>
    </PrimaryOffCanvas>
  );
}

export default EditPIPDrawer;
