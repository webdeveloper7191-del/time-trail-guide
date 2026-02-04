import React, { useState } from 'react';
import { Avatar, Chip, Divider, Alert as MuiAlert } from '@mui/material';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle2, XCircle, Clock, UserMinus, FileCheck, AlertTriangle } from 'lucide-react';
import { StaffMember } from '@/types/staff';
import { PerformanceImprovementPlan, PIPOutcome } from '@/types/compensation';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection, FormField } from '@/components/ui/off-canvas/FormSection';

interface RecordOutcomeDrawerProps {
  open: boolean;
  onClose: () => void;
  pip: PerformanceImprovementPlan;
  staff: StaffMember[];
  onSubmit: (outcome: PIPOutcome, notes: string, effectiveDate?: string) => void;
}

const outcomeOptions: { value: PIPOutcome; label: string; description: string; icon: React.ReactNode; color: string }[] = [
  {
    value: 'improved',
    label: 'Performance Improved',
    description: 'Employee has successfully met the improvement goals',
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: 'text-green-600',
  },
  {
    value: 'extended',
    label: 'Plan Extended',
    description: 'Additional time needed to demonstrate improvement',
    icon: <Clock className="h-5 w-5" />,
    color: 'text-blue-600',
  },
  {
    value: 'terminated',
    label: 'Employment Terminated',
    description: 'Employee did not meet improvement requirements',
    icon: <XCircle className="h-5 w-5" />,
    color: 'text-destructive',
  },
  {
    value: 'resigned',
    label: 'Employee Resigned',
    description: 'Employee chose to leave during the PIP period',
    icon: <UserMinus className="h-5 w-5" />,
    color: 'text-amber-600',
  },
];

export function RecordOutcomeDrawer({
  open,
  onClose,
  pip,
  staff,
  onSubmit,
}: RecordOutcomeDrawerProps) {
  const [outcome, setOutcome] = useState<PIPOutcome | ''>('');
  const [notes, setNotes] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [extensionEndDate, setExtensionEndDate] = useState('');

  const getStaffMember = (id: string) => staff.find((s) => s.id === id);
  const employee = getStaffMember(pip.staffId);

  const completedMilestones = pip.milestones.filter((m) => m.status === 'completed').length;
  const totalMilestones = pip.milestones.length;
  const progressPercent = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  const handleSubmit = () => {
    if (!outcome) {
      toast.error('Please select an outcome');
      return;
    }
    if (!notes.trim()) {
      toast.error('Please provide outcome notes');
      return;
    }
    if (outcome === 'extended' && !extensionEndDate) {
      toast.error('Please provide the new end date for the extension');
      return;
    }

    onSubmit(outcome, notes, outcome === 'extended' ? extensionEndDate : effectiveDate);
    toast.success('Outcome recorded successfully');
    onClose();
  };

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Record PIP Outcome"
      description="Document the final outcome of the Performance Improvement Plan"
      icon={FileCheck}
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'secondary' },
        { 
          label: 'Record Outcome', 
          onClick: handleSubmit, 
          variant: outcome === 'terminated' ? 'destructive' : 'primary',
        },
      ]}
    >
      <div className="space-y-6">
        {/* Employee Summary */}
        <FormSection title="PIP Summary">
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
          </div>

          <Divider className="my-3" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">PIP Duration</span>
              <span className="font-medium">
                {format(parseISO(pip.startDate), 'MMM d')} - {format(parseISO(pip.currentEndDate), 'MMM d, yyyy')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Milestones Completed</span>
              <span className="font-medium">
                {completedMilestones}/{totalMilestones} ({Math.round(progressPercent)}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Check-ins Held</span>
              <span className="font-medium">{pip.checkIns.length}</span>
            </div>
            {pip.extensionCount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Extensions</span>
                <Chip label={`${pip.extensionCount} extension(s)`} size="small" color="info" />
              </div>
            )}
          </div>
        </FormSection>

        {/* Warning */}
        <MuiAlert severity="warning" icon={<AlertTriangle size={18} />}>
          Recording an outcome will close this PIP. Ensure you have consulted with HR before proceeding.
        </MuiAlert>

        {/* Outcome Selection */}
        <FormSection title="Select Outcome" tooltip="Choose the final outcome of this PIP">
          <RadioGroup value={outcome} onValueChange={(value) => setOutcome(value as PIPOutcome)}>
            <div className="space-y-2">
              {outcomeOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    outcome === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <RadioGroupItem value={option.value} className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={option.color}>{option.icon}</span>
                      <span className="font-medium text-sm">{option.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </RadioGroup>
        </FormSection>

        {/* Conditional Date Fields */}
        {outcome === 'extended' && (
          <FormSection title="Extension Details">
            <FormField label="New End Date" required tooltip="The plan will be extended to this date">
              <Input
                type="date"
                value={extensionEndDate}
                onChange={(e) => setExtensionEndDate(e.target.value)}
              />
            </FormField>
          </FormSection>
        )}

        {(outcome === 'terminated' || outcome === 'resigned' || outcome === 'improved') && (
          <FormSection title="Effective Date">
            <FormField label={outcome === 'improved' ? 'Outcome Date' : 'Effective Date'}>
              <Input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </FormField>
          </FormSection>
        )}

        {/* Outcome Notes */}
        <FormSection title="Documentation" tooltip="Provide detailed notes about this outcome">
          <FormField label="Outcome Notes" required>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                outcome === 'improved'
                  ? 'Document how the employee demonstrated improvement and met the PIP goals...'
                  : outcome === 'extended'
                  ? 'Document the reason for extension and what additional time will be used for...'
                  : outcome === 'terminated'
                  ? 'Document the decision-making process and key factors leading to termination...'
                  : outcome === 'resigned'
                  ? 'Document the circumstances of the resignation...'
                  : 'Select an outcome above to see guidance...'
              }
              className="min-h-[150px]"
            />
          </FormField>
        </FormSection>
      </div>
    </PrimaryOffCanvas>
  );
}

export default RecordOutcomeDrawer;
