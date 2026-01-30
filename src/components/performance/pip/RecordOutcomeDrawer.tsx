import React, { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Avatar,
  Chip,
  Alert,
  Divider,
} from '@mui/material';
import { Button } from '@/components/mui/Button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  CheckCircle2,
  XCircle,
  Clock,
  UserMinus,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';
import { StaffMember } from '@/types/staff';
import { PerformanceImprovementPlan, PIPOutcome, pipOutcomeLabels } from '@/types/compensation';
import { format, differenceInDays, parseISO } from 'date-fns';
import { toast } from 'sonner';

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
    color: 'text-success',
  },
  {
    value: 'extended',
    label: 'Plan Extended',
    description: 'Additional time needed to demonstrate improvement',
    icon: <Clock className="h-5 w-5" />,
    color: 'text-info',
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
    color: 'text-warning',
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
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            Record PIP Outcome
          </SheetTitle>
          <SheetDescription>
            Document the final outcome of the Performance Improvement Plan
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Employee Summary */}
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
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
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">
                  PIP Duration
                </Typography>
                <Typography variant="caption" fontWeight={500}>
                  {format(parseISO(pip.startDate), 'MMM d')} -{' '}
                  {format(parseISO(pip.currentEndDate), 'MMM d, yyyy')}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">
                  Milestones Completed
                </Typography>
                <Typography variant="caption" fontWeight={500}>
                  {completedMilestones}/{totalMilestones} ({Math.round(progressPercent)}%)
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">
                  Check-ins Held
                </Typography>
                <Typography variant="caption" fontWeight={500}>
                  {pip.checkIns.length}
                </Typography>
              </Stack>
              {pip.extensionCount > 0 && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    Extensions
                  </Typography>
                  <Chip label={`${pip.extensionCount} extension(s)`} size="small" color="info" />
                </Stack>
              )}
            </Stack>
          </Box>

          <Alert severity="warning" icon={<AlertTriangle size={18} />}>
            <Typography variant="body2">
              Recording an outcome will close this PIP. Ensure you have consulted with HR before proceeding.
            </Typography>
          </Alert>

          {/* Outcome Selection */}
          <Box>
            <Label className="text-sm font-medium mb-3 block">Select Outcome *</Label>
            <RadioGroup value={outcome} onValueChange={(value) => setOutcome(value as PIPOutcome)}>
              <Stack spacing={1.5}>
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
                    <Box flex={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <span className={option.color}>{option.icon}</span>
                        <Typography variant="body2" fontWeight={500}>
                          {option.label}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    </Box>
                  </label>
                ))}
              </Stack>
            </RadioGroup>
          </Box>

          {/* Conditional Date Fields */}
          {outcome === 'extended' && (
            <div className="space-y-1.5">
              <Label>New End Date *</Label>
              <Input
                type="date"
                value={extensionEndDate}
                onChange={(e) => setExtensionEndDate(e.target.value)}
              />
              <Typography variant="caption" color="text.secondary">
                The plan will be extended to this date
              </Typography>
            </div>
          )}

          {(outcome === 'terminated' || outcome === 'resigned') && (
            <div className="space-y-1.5">
              <Label>Effective Date *</Label>
              <Input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </div>
          )}

          {outcome === 'improved' && (
            <div className="space-y-1.5">
              <Label>Outcome Date</Label>
              <Input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </div>
          )}

          {/* Outcome Notes */}
          <div className="space-y-1.5">
            <Label>Outcome Notes *</Label>
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
          </div>
        </div>

        <SheetFooter className="pt-4 border-t">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            className={
              outcome === 'terminated'
                ? 'bg-destructive hover:bg-destructive/90'
                : outcome === 'improved'
                ? 'bg-success hover:bg-success/90'
                : ''
            }
          >
            <FileCheck size={16} className="mr-1" /> Record Outcome
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default RecordOutcomeDrawer;
