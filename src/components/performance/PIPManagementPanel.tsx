import React, { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Avatar,
  Chip,
  Divider,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui/Button';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Calendar,
  Target,
} from 'lucide-react';
import { StaffMember } from '@/types/staff';
import {
  PerformanceImprovementPlan,
  PIPStatus,
  pipStatusLabels,
  PIPCheckIn,
  PIPOutcome,
} from '@/types/compensation';
import { mockPIPs } from '@/data/mockCompensationData';
import { format, parseISO, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import {
  CreatePIPDrawer,
  AddCheckInDrawer,
  RecordOutcomeDrawer,
  EditPIPDrawer,
  PIPDetailSheet,
} from './pip';

interface PIPManagementPanelProps {
  staff: StaffMember[];
  currentUserId: string;
}

const statusColors: Record<PIPStatus, string> = {
  draft: 'grey',
  active: 'warning',
  extended: 'info',
  completed_success: 'success',
  completed_failure: 'error',
  cancelled: 'default',
};

export function PIPManagementPanel({ staff, currentUserId }: PIPManagementPanelProps) {
  const [pips, setPips] = useState<PerformanceImprovementPlan[]>(mockPIPs);
  const [selectedPIP, setSelectedPIP] = useState<PerformanceImprovementPlan | null>(null);
  
  // Drawer states
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showCheckInDrawer, setShowCheckInDrawer] = useState(false);
  const [showOutcomeDrawer, setShowOutcomeDrawer] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);

  const getStaffMember = (staffId: string) => staff.find(s => s.id === staffId);

  const activePIPs = pips.filter(p => p.status === 'active' || p.status === 'extended');
  const completedPIPs = pips.filter(p => p.status.startsWith('completed'));

  const calculateProgress = (pip: PerformanceImprovementPlan) => {
    const completedMilestones = pip.milestones.filter(m => m.status === 'completed').length;
    return pip.milestones.length > 0 ? (completedMilestones / pip.milestones.length) * 100 : 0;
  };

  const getDaysRemaining = (pip: PerformanceImprovementPlan) => {
    const endDate = parseISO(pip.currentEndDate);
    const today = new Date();
    return differenceInDays(endDate, today);
  };

  // Handlers
  const handleCreatePIP = (data: any) => {
    const newPIP: PerformanceImprovementPlan = {
      id: `pip-${Date.now()}`,
      staffId: data.staffId,
      managerId: data.managerId,
      hrPartnerId: data.hrPartnerId,
      status: 'active',
      reason: data.reason,
      performanceGaps: data.performanceGaps,
      expectedOutcomes: data.expectedOutcomes,
      supportProvided: data.supportProvided,
      startDate: data.startDate,
      originalEndDate: data.endDate,
      currentEndDate: data.endDate,
      extensionCount: 0,
      milestones: data.milestones.map((m: any, i: number) => ({
        id: `ms-${Date.now()}-${i}`,
        ...m,
        status: 'pending' as const,
      })),
      checkIns: [],
      documents: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPips([...pips, newPIP]);
  };

  const handleAddCheckIn = (checkIn: Omit<PIPCheckIn, 'id'>) => {
    if (!selectedPIP) return;
    const newCheckIn: PIPCheckIn = {
      id: `ci-${Date.now()}`,
      ...checkIn,
    };
    const updatedPIP = { ...selectedPIP, checkIns: [...selectedPIP.checkIns, newCheckIn], updatedAt: new Date().toISOString() };
    const updated = pips.map(p => p.id === selectedPIP.id ? updatedPIP : p);
    setPips(updated);
    setSelectedPIP(updatedPIP);
  };

  const handleRecordOutcome = (outcome: PIPOutcome, notes: string, effectiveDate?: string) => {
    if (!selectedPIP) return;
    const newStatus: PIPStatus = 
      outcome === 'improved' ? 'completed_success' :
      outcome === 'extended' ? 'extended' :
      outcome === 'terminated' || outcome === 'resigned' ? 'completed_failure' :
      selectedPIP.status;
    
    const updatedPIP = {
      ...selectedPIP,
      status: newStatus,
      outcome,
      outcomeNotes: notes,
      outcomeDate: effectiveDate || new Date().toISOString(),
      currentEndDate: outcome === 'extended' && effectiveDate ? effectiveDate : selectedPIP.currentEndDate,
      extensionCount: outcome === 'extended' ? selectedPIP.extensionCount + 1 : selectedPIP.extensionCount,
      updatedAt: new Date().toISOString(),
    };
    const updated = pips.map(p => p.id === selectedPIP.id ? updatedPIP : p);
    setPips(updated);
    setShowDetailSheet(false);
    setSelectedPIP(null);
  };

  const handleEditPIP = (updatedData: Partial<PerformanceImprovementPlan>) => {
    if (!selectedPIP) return;
    const updatedPIP = { ...selectedPIP, ...updatedData };
    const updated = pips.map(p => p.id === selectedPIP.id ? updatedPIP : p);
    setPips(updated);
    setSelectedPIP(updatedPIP);
  };

  const handleCardClick = (pip: PerformanceImprovementPlan) => {
    setSelectedPIP(pip);
    setShowDetailSheet(true);
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
        onClick={() => handleCardClick(pip)}
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

  return (
    <>
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
          <Button variant="default" onClick={() => setShowCreateDrawer(true)}>
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
                    {pips.filter(p => p.status === 'completed_success').length}
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
                    {pips.filter(p => p.status === 'completed_failure').length}
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

        {pips.length === 0 && (
          <Card sx={{ border: '2px dashed', borderColor: 'divider', bgcolor: 'transparent' }}>
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <AlertTriangle size={40} style={{ color: 'var(--muted-foreground)', margin: '0 auto 12px' }} />
              <Typography fontWeight={500}>No Performance Improvement Plans</Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                Create a PIP when formal intervention is needed
              </Typography>
              <Button variant="default" onClick={() => setShowCreateDrawer(true)} className="mt-4">
                <Plus size={16} className="mr-1" /> Create First PIP
              </Button>
            </Box>
          </Card>
        )}
      </Box>

      {/* Drawers and Sheets */}
      <CreatePIPDrawer
        open={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        staff={staff}
        currentUserId={currentUserId}
        onSubmit={handleCreatePIP}
      />

      {selectedPIP && (
        <>
          <PIPDetailSheet
            open={showDetailSheet}
            onClose={() => {
              setShowDetailSheet(false);
              setSelectedPIP(null);
            }}
            pip={selectedPIP}
            staff={staff}
            onAddCheckIn={() => {
              setShowCheckInDrawer(true);
            }}
            onRecordOutcome={() => {
              setShowOutcomeDrawer(true);
            }}
            onEdit={() => {
              setShowEditDrawer(true);
            }}
            onUploadDocument={() => {
              toast.info('Document upload coming soon');
            }}
          />

          <AddCheckInDrawer
            open={showCheckInDrawer}
            onClose={() => setShowCheckInDrawer(false)}
            pip={selectedPIP}
            staff={staff}
            currentUserId={currentUserId}
            onSubmit={handleAddCheckIn}
          />

          <RecordOutcomeDrawer
            open={showOutcomeDrawer}
            onClose={() => setShowOutcomeDrawer(false)}
            pip={selectedPIP}
            staff={staff}
            onSubmit={handleRecordOutcome}
          />

          <EditPIPDrawer
            open={showEditDrawer}
            onClose={() => setShowEditDrawer(false)}
            pip={selectedPIP}
            staff={staff}
            onSubmit={handleEditPIP}
          />
        </>
      )}
    </>
  );
}

export default PIPManagementPanel;
