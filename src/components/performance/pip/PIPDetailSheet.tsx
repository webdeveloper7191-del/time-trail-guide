import React from 'react';
import {
  Box,
  Stack,
  Typography,
  Avatar,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
} from '@mui/material';
import { Button } from '@/components/mui/Button';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  AlertTriangle,
  Calendar,
  Target,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Upload,
  FileCheck,
  Edit,
  Clock,
  User,
} from 'lucide-react';
import { StaffMember } from '@/types/staff';
import {
  PerformanceImprovementPlan,
  PIPStatus,
  pipStatusLabels,
  pipOutcomeLabels,
} from '@/types/compensation';
import { format, parseISO, differenceInDays } from 'date-fns';

interface PIPDetailSheetProps {
  open: boolean;
  onClose: () => void;
  pip: PerformanceImprovementPlan;
  staff: StaffMember[];
  onAddCheckIn: () => void;
  onRecordOutcome: () => void;
  onEdit: () => void;
  onUploadDocument: () => void;
}

const statusColors: Record<PIPStatus, string> = {
  draft: 'grey',
  active: 'warning',
  extended: 'info',
  completed_success: 'success',
  completed_failure: 'error',
  cancelled: 'default',
};

export function PIPDetailSheet({
  open,
  onClose,
  pip,
  staff,
  onAddCheckIn,
  onRecordOutcome,
  onEdit,
  onUploadDocument,
}: PIPDetailSheetProps) {
  const getStaffMember = (id: string) => staff.find((s) => s.id === id);

  const employee = getStaffMember(pip.staffId);
  const manager = getStaffMember(pip.managerId);
  const hrPartner = pip.hrPartnerId ? getStaffMember(pip.hrPartnerId) : null;

  const completedMilestones = pip.milestones.filter((m) => m.status === 'completed').length;
  const totalMilestones = pip.milestones.length;
  const progressPercent = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  const daysRemaining = differenceInDays(parseISO(pip.currentEndDate), new Date());
  const isOverdue = daysRemaining < 0;
  const isActive = pip.status === 'active' || pip.status === 'extended';

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 bg-background z-10 border-b">
          <SheetHeader className="p-6 pb-4">
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar src={employee?.avatar} sx={{ width: 56, height: 56 }}>
                  {employee?.firstName?.[0]}
                  {employee?.lastName?.[0]}
                </Avatar>
                <Box>
                  <SheetTitle className="text-xl">
                    {employee?.firstName} {employee?.lastName}
                  </SheetTitle>
                  <SheetDescription>{employee?.position}</SheetDescription>
                  <Stack direction="row" spacing={1} mt={1}>
                    <Chip
                      label={pipStatusLabels[pip.status]}
                      color={statusColors[pip.status] as any}
                      size="small"
                    />
                    {pip.extensionCount > 0 && (
                      <Chip label={`Extended ${pip.extensionCount}x`} variant="outlined" size="small" />
                    )}
                    {isOverdue && isActive && (
                      <Chip label="Overdue" color="error" size="small" icon={<AlertTriangle size={12} />} />
                    )}
                  </Stack>
                </Box>
              </Stack>
              <button
                onClick={onClose}
                className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"></line><line x1="6" x2="18" y1="6" y2="18"></line></svg>
                <span className="sr-only">Close</span>
              </button>
            </Stack>
          </SheetHeader>

          {/* Action Buttons */}
          {isActive && (
            <Box sx={{ px: 3, pb: 2 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button variant="outline" size="small" onClick={onAddCheckIn}>
                  <MessageSquare size={14} className="mr-1" /> Add Check-in
                </Button>
                <Button variant="outline" size="small" onClick={onUploadDocument}>
                  <Upload size={14} className="mr-1" /> Upload
                </Button>
                <Button variant="outline" size="small" onClick={onEdit}>
                  <Edit size={14} className="mr-1" /> Edit
                </Button>
                <Button variant="default" size="small" onClick={onRecordOutcome}>
                  <FileCheck size={14} className="mr-1" /> Record Outcome
                </Button>
              </Stack>
            </Box>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Key Info Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                <User size={14} className="text-muted-foreground" />
                <Typography variant="caption" color="text.secondary">
                  Manager
                </Typography>
              </Stack>
              <Typography variant="body2" fontWeight={500}>
                {manager?.firstName} {manager?.lastName}
              </Typography>
            </Box>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                <User size={14} className="text-muted-foreground" />
                <Typography variant="caption" color="text.secondary">
                  HR Partner
                </Typography>
              </Stack>
              <Typography variant="body2" fontWeight={500}>
                {hrPartner ? `${hrPartner.firstName} ${hrPartner.lastName}` : 'Not assigned'}
              </Typography>
            </Box>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                <Calendar size={14} className="text-muted-foreground" />
                <Typography variant="caption" color="text.secondary">
                  Duration
                </Typography>
              </Stack>
              <Typography variant="body2" fontWeight={500}>
                {format(parseISO(pip.startDate), 'MMM d')} -{' '}
                {format(parseISO(pip.currentEndDate), 'MMM d, yyyy')}
              </Typography>
              {isActive && (
                <Typography
                  variant="caption"
                  color={isOverdue ? 'error.main' : daysRemaining <= 14 ? 'warning.main' : 'text.secondary'}
                  fontWeight={500}
                >
                  {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days remaining`}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Progress */}
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Stack direction="row" justifyContent="space-between" mb={1}>
              <Typography variant="body2" fontWeight={500}>
                Milestone Progress
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {completedMilestones}/{totalMilestones} ({Math.round(progressPercent)}%)
              </Typography>
            </Stack>
            <Progress value={progressPercent} className="h-2" />
          </Box>

          <Divider />

          {/* Reason */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              Reason for PIP
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {pip.reason}
            </Typography>
          </Box>

          {/* Three Columns */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={1} color="error.main">
                Performance Gaps
              </Typography>
              <Stack spacing={1}>
                {pip.performanceGaps.map((gap, i) => (
                  <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                    <XCircle size={14} className="text-destructive mt-0.5 shrink-0" />
                    <Typography variant="body2">{gap}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={1} color="success.main">
                Expected Outcomes
              </Typography>
              <Stack spacing={1}>
                {pip.expectedOutcomes.map((outcome, i) => (
                  <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                    <Target size={14} className="text-success mt-0.5 shrink-0" />
                    <Typography variant="body2">{outcome}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={1} color="primary.main">
                Support Provided
              </Typography>
              <Stack spacing={1}>
                {pip.supportProvided.map((support, i) => (
                  <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                    <CheckCircle2 size={14} className="text-primary mt-0.5 shrink-0" />
                    <Typography variant="body2">{support}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Box>

          <Divider />

          {/* Milestones */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>
              Milestones
            </Typography>
            <Stepper orientation="vertical">
              {pip.milestones.map((milestone) => (
                <Step
                  key={milestone.id}
                  active={milestone.status === 'in_progress'}
                  completed={milestone.status === 'completed'}
                >
                  <StepLabel
                    error={milestone.status === 'missed'}
                    StepIconProps={{
                      sx: {
                        color:
                          milestone.status === 'completed'
                            ? 'success.main'
                            : milestone.status === 'missed'
                            ? 'error.main'
                            : undefined,
                      },
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
                      <Typography variant="body2" fontWeight={500}>
                        {milestone.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Due: {format(parseISO(milestone.targetDate), 'MMM d, yyyy')}
                      </Typography>
                    </Stack>
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {milestone.description}
                    </Typography>
                    {milestone.completedDate && (
                      <Chip
                        label={`Completed ${format(parseISO(milestone.completedDate), 'MMM d')}`}
                        size="small"
                        color="success"
                      />
                    )}
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Box>

          <Divider />

          {/* Check-in History */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>
              Check-in History ({pip.checkIns.length})
            </Typography>
            {pip.checkIns.length > 0 ? (
              <Stack spacing={2}>
                {pip.checkIns.map((checkIn) => (
                  <Box key={checkIn.id} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" fontWeight={500}>
                        {format(parseISO(checkIn.completedDate || checkIn.scheduledDate), 'MMM d, yyyy')}
                      </Typography>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          Progress:
                        </Typography>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Box
                            key={n}
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: n <= checkIn.progressRating ? 'primary.main' : 'grey.300',
                            }}
                          />
                        ))}
                      </Stack>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {checkIn.notes}
                    </Typography>
                    {checkIn.nextSteps && (
                      <Typography variant="caption" color="primary.main" mt={1} display="block">
                        Next: {checkIn.nextSteps}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 1 }}>
                <MessageSquare size={24} className="text-muted-foreground mx-auto mb-2" />
                <Typography variant="body2" color="text.secondary">
                  No check-ins recorded yet
                </Typography>
              </Box>
            )}
          </Box>

          {/* Outcome (if completed) */}
          {pip.outcome && (
            <>
              <Divider />
              <Box
                sx={{
                  p: 3,
                  borderRadius: 1,
                  bgcolor:
                    pip.outcome === 'improved'
                      ? 'success.50'
                      : pip.outcome === 'terminated'
                      ? 'error.50'
                      : 'grey.50',
                  border: '1px solid',
                  borderColor:
                    pip.outcome === 'improved'
                      ? 'success.200'
                      : pip.outcome === 'terminated'
                      ? 'error.200'
                      : 'divider',
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                  {pip.outcome === 'improved' ? (
                    <CheckCircle2 className="text-success" size={20} />
                  ) : (
                    <XCircle className="text-destructive" size={20} />
                  )}
                  <Typography variant="subtitle2" fontWeight={600}>
                    {pipOutcomeLabels[pip.outcome]}
                  </Typography>
                  {pip.outcomeDate && (
                    <Chip
                      label={format(parseISO(pip.outcomeDate), 'MMM d, yyyy')}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Stack>
                {pip.outcomeNotes && (
                  <Typography variant="body2" color="text.secondary">
                    {pip.outcomeNotes}
                  </Typography>
                )}
              </Box>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default PIPDetailSheet;
