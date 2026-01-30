import React, { useState } from 'react';
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
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui/Button';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  MessageSquare,
  Plus,
  Calendar,
  Target,
  ChevronRight,
  User,
  Upload,
} from 'lucide-react';
import { StaffMember } from '@/types/staff';
import {
  PerformanceImprovementPlan,
  PIPStatus,
  pipStatusLabels,
  pipOutcomeLabels,
} from '@/types/compensation';
import { mockPIPs } from '@/data/mockCompensationData';
import { format, parseISO, differenceInDays, isAfter } from 'date-fns';
import { toast } from 'sonner';

interface PIPManagementPanelProps {
  staff: StaffMember[];
  currentUserId: string;
  onCreatePIP?: () => void;
}

const statusColors: Record<PIPStatus, string> = {
  draft: 'grey',
  active: 'warning',
  extended: 'info',
  completed_success: 'success',
  completed_failure: 'error',
  cancelled: 'default',
};

export function PIPManagementPanel({ staff, currentUserId, onCreatePIP }: PIPManagementPanelProps) {
  const [selectedPIP, setSelectedPIP] = useState<PerformanceImprovementPlan | null>(null);

  const getStaffMember = (staffId: string) => staff.find(s => s.id === staffId);

  const activePIPs = mockPIPs.filter(p => p.status === 'active' || p.status === 'extended');
  const completedPIPs = mockPIPs.filter(p => p.status.startsWith('completed'));

  const calculateProgress = (pip: PerformanceImprovementPlan) => {
    const completedMilestones = pip.milestones.filter(m => m.status === 'completed').length;
    return pip.milestones.length > 0 ? (completedMilestones / pip.milestones.length) * 100 : 0;
  };

  const getDaysRemaining = (pip: PerformanceImprovementPlan) => {
    const endDate = parseISO(pip.currentEndDate);
    const today = new Date();
    return differenceInDays(endDate, today);
  };

  const renderPIPCard = (pip: PerformanceImprovementPlan) => {
    const staffMember = getStaffMember(pip.staffId);
    const manager = getStaffMember(pip.managerId);
    const progress = calculateProgress(pip);
    const daysRemaining = getDaysRemaining(pip);
    const isOverdue = daysRemaining < 0;

    return (
      <Card
        key={pip.id}
        sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
        onClick={() => setSelectedPIP(pip)}
      >
        <Box sx={{ p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar src={staffMember?.avatar} sx={{ width: 48, height: 48 }}>
                {staffMember?.firstName?.[0]}{staffMember?.lastName?.[0]}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {staffMember?.firstName} {staffMember?.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {staffMember?.position} • Manager: {manager?.firstName} {manager?.lastName}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={pipStatusLabels[pip.status]}
                color={statusColors[pip.status] as any}
                size="small"
              />
              {isOverdue && pip.status === 'active' && (
                <Chip label="Overdue" color="error" size="small" icon={<AlertTriangle size={14} />} />
              )}
            </Stack>
          </Stack>

          <Typography variant="body2" color="text.secondary" mb={2} sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {pip.reason}
          </Typography>

          <Box mb={2}>
            <Stack direction="row" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" color="text.secondary">Milestone Progress</Typography>
              <Typography variant="caption" fontWeight={600}>{Math.round(progress)}%</Typography>
            </Stack>
            <Progress value={progress} className="h-2" />
          </Box>

          <Divider sx={{ my: 1.5 }} />

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={2}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Calendar size={14} style={{ color: 'var(--muted-foreground)' }} />
                <Typography variant="caption" color="text.secondary">
                  {format(parseISO(pip.startDate), 'MMM d')} - {format(parseISO(pip.currentEndDate), 'MMM d, yyyy')}
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Target size={14} style={{ color: 'var(--muted-foreground)' }} />
                <Typography variant="caption" color="text.secondary">
                  {pip.milestones.filter(m => m.status === 'completed').length}/{pip.milestones.length} milestones
                </Typography>
              </Stack>
            </Stack>
            <Typography
              variant="caption"
              fontWeight={600}
              color={isOverdue ? 'error.main' : daysRemaining <= 14 ? 'warning.main' : 'text.secondary'}
            >
              {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days remaining`}
            </Typography>
          </Stack>
        </Box>
      </Card>
    );
  };

  const renderPIPDetail = (pip: PerformanceImprovementPlan) => {
    const staffMember = getStaffMember(pip.staffId);
    const manager = getStaffMember(pip.managerId);
    const hrPartner = pip.hrPartnerId ? getStaffMember(pip.hrPartnerId) : null;
    const progress = calculateProgress(pip);

    return (
      <Box>
        <Button variant="ghost" size="small" onClick={() => setSelectedPIP(null)} className="mb-4">
          ← Back to list
        </Button>

        <Card sx={{ mb: 3 }}>
          <Box sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar src={staffMember?.avatar} sx={{ width: 64, height: 64 }}>
                  {staffMember?.firstName?.[0]}{staffMember?.lastName?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {staffMember?.firstName} {staffMember?.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {staffMember?.position}
                  </Typography>
                  <Stack direction="row" spacing={1} mt={1}>
                    <Chip label={pipStatusLabels[pip.status]} color={statusColors[pip.status] as any} size="small" />
                    {pip.extensionCount > 0 && (
                      <Chip label={`Extended ${pip.extensionCount}x`} variant="outlined" size="small" />
                    )}
                  </Stack>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button variant="outline" size="small" onClick={() => toast.info('Schedule check-in')}>
                  <MessageSquare size={16} className="mr-1" /> Add Check-in
                </Button>
                <Button variant="outline" size="small" onClick={() => toast.info('Upload document')}>
                  <Upload size={16} className="mr-1" /> Upload
                </Button>
                <Button variant="default" size="small" onClick={() => toast.info('Record outcome')}>
                  Record Outcome
                </Button>
              </Stack>
            </Stack>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">Manager</Typography>
                <Typography variant="body2" fontWeight={500}>{manager?.firstName} {manager?.lastName}</Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">HR Partner</Typography>
                <Typography variant="body2" fontWeight={500}>
                  {hrPartner ? `${hrPartner.firstName} ${hrPartner.lastName}` : 'Not assigned'}
                </Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">Duration</Typography>
                <Typography variant="body2" fontWeight={500}>
                  {format(parseISO(pip.startDate), 'MMM d')} - {format(parseISO(pip.currentEndDate), 'MMM d, yyyy')}
                </Typography>
              </Box>
            </Box>

            <Box mb={3}>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>Reason for PIP</Typography>
              <Typography variant="body2" color="text.secondary">{pip.reason}</Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={600} mb={1} color="error.main">Performance Gaps</Typography>
                <Stack spacing={1}>
                  {pip.performanceGaps.map((gap, i) => (
                    <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                      <XCircle size={14} style={{ color: 'var(--destructive)', marginTop: 4 }} />
                      <Typography variant="body2">{gap}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={600} mb={1} color="success.main">Expected Outcomes</Typography>
                <Stack spacing={1}>
                  {pip.expectedOutcomes.map((outcome, i) => (
                    <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                      <Target size={14} style={{ color: 'var(--success)', marginTop: 4 }} />
                      <Typography variant="body2">{outcome}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={600} mb={1} color="primary.main">Support Provided</Typography>
                <Stack spacing={1}>
                  {pip.supportProvided.map((support, i) => (
                    <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                      <CheckCircle2 size={14} style={{ color: 'var(--primary)', marginTop: 4 }} />
                      <Typography variant="body2">{support}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Box>
          </Box>
        </Card>

        {/* Milestones */}
        <Card sx={{ mb: 3 }}>
          <Box sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1" fontWeight={600}>Milestones</Typography>
              <Chip label={`${Math.round(progress)}% Complete`} color="primary" size="small" />
            </Stack>
            <Stepper orientation="vertical">
              {pip.milestones.map((milestone) => (
                <Step key={milestone.id} active={milestone.status === 'in_progress'} completed={milestone.status === 'completed'}>
                  <StepLabel
                    error={milestone.status === 'missed'}
                    StepIconProps={{
                      sx: {
                        color: milestone.status === 'completed' ? 'success.main' : milestone.status === 'missed' ? 'error.main' : undefined,
                      }
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
                      <Typography variant="body2" fontWeight={500}>{milestone.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Due: {format(parseISO(milestone.targetDate), 'MMM d, yyyy')}
                      </Typography>
                    </Stack>
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" color="text.secondary" mb={1}>{milestone.description}</Typography>
                    {milestone.completedDate && (
                      <Chip label={`Completed ${format(parseISO(milestone.completedDate), 'MMM d')}`} size="small" color="success" />
                    )}
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Box>
        </Card>

        {/* Check-ins */}
        <Card>
          <Box sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>Check-in History</Typography>
            <Stack spacing={2}>
              {pip.checkIns.map((checkIn) => (
                <Box key={checkIn.id} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" fontWeight={500}>
                      {format(parseISO(checkIn.completedDate || checkIn.scheduledDate), 'MMM d, yyyy')}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" color="text.secondary">Progress:</Typography>
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
                  <Typography variant="body2" color="text.secondary">{checkIn.notes}</Typography>
                  {checkIn.nextSteps && (
                    <Typography variant="caption" color="primary.main" mt={1} display="block">
                      Next: {checkIn.nextSteps}
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
          </Box>
        </Card>
      </Box>
    );
  };

  if (selectedPIP) {
    return renderPIPDetail(selectedPIP);
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'flex-start' }} spacing={2}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'warning.light', display: 'flex' }}>
              <AlertTriangle size={20} style={{ color: 'var(--warning)' }} />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              Performance Improvement Plans
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Manage formal improvement plans with milestones and documentation
          </Typography>
        </Box>
        <Button variant="default" onClick={onCreatePIP}>
          <Plus size={16} className="mr-1" /> Create PIP
        </Button>
      </Stack>

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        <Card>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Clock size={20} style={{ color: 'var(--warning)' }} />
              <Box>
                <Typography variant="h5" fontWeight={700}>{activePIPs.length}</Typography>
                <Typography variant="caption" color="text.secondary">Active PIPs</Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
        <Card>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {mockPIPs.filter(p => p.status === 'completed_success').length}
                </Typography>
                <Typography variant="caption" color="text.secondary">Successful</Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
        <Card>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <XCircle size={20} style={{ color: 'var(--destructive)' }} />
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {mockPIPs.filter(p => p.status === 'completed_failure').length}
                </Typography>
                <Typography variant="caption" color="text.secondary">Unsuccessful</Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
        <Card>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Target size={20} style={{ color: 'var(--primary)' }} />
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {activePIPs.length > 0 
                    ? Math.round(activePIPs.reduce((sum, p) => sum + calculateProgress(p), 0) / activePIPs.length) 
                    : 0}%
                </Typography>
                <Typography variant="caption" color="text.secondary">Avg Progress</Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
      </Box>

      {/* Active PIPs */}
      {activePIPs.length > 0 && (
        <Box>
          <Typography variant="overline" color="text.secondary" fontWeight={600} mb={2} display="block">
            Active Plans
          </Typography>
          <Stack spacing={2}>
            {activePIPs.map(renderPIPCard)}
          </Stack>
        </Box>
      )}

      {/* Completed PIPs */}
      {completedPIPs.length > 0 && (
        <Box>
          <Typography variant="overline" color="text.secondary" fontWeight={600} mb={2} display="block">
            Completed Plans
          </Typography>
          <Stack spacing={2}>
            {completedPIPs.map(renderPIPCard)}
          </Stack>
        </Box>
      )}

      {mockPIPs.length === 0 && (
        <Card sx={{ border: '2px dashed', borderColor: 'divider', bgcolor: 'transparent' }}>
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <AlertTriangle size={40} style={{ color: 'var(--muted-foreground)', margin: '0 auto 12px' }} />
            <Typography fontWeight={500}>No Performance Improvement Plans</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Create a PIP when formal intervention is needed
            </Typography>
            <Button variant="default" onClick={onCreatePIP} className="mt-4">
              <Plus size={16} className="mr-1" /> Create First PIP
            </Button>
          </Box>
        </Card>
      )}
    </Box>
  );
}

export default PIPManagementPanel;
