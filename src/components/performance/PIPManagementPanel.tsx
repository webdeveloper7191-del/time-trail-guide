import React, { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Avatar,
  Chip,
  IconButton,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SemanticProgressBar } from './shared/SemanticProgressBar';
import { StatusBadge } from './shared/StatusBadge';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Calendar,
  Target,
  Edit,
  MoreHorizontal,
  Eye,
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

const getStatusBadgeVariant = (status: PIPStatus) => {
  switch (status) {
    case 'active': return 'warning';
    case 'extended': return 'info';
    case 'completed_success': return 'success';
    case 'completed_failure': return 'destructive';
    case 'cancelled': return 'muted';
    default: return 'secondary';
  }
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

  const handleRowClick = (pip: PerformanceImprovementPlan) => {
    setSelectedPIP(pip);
    setShowDetailSheet(true);
  };

  const renderPIPTable = (pipList: PerformanceImprovementPlan[], title: string) => (
    <Box>
      <Typography variant="overline" color="text.secondary" fontWeight={600} mb={2} display="block">
        {title}
      </Typography>
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Employee</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Timeline</TableHead>
              <TableHead className="text-center">Check-ins</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pipList.map(pip => {
              const staffMember = getStaffMember(pip.staffId);
              const manager = getStaffMember(pip.managerId);
              const progress = calculateProgress(pip);
              const daysRemaining = getDaysRemaining(pip);
              const isOverdue = daysRemaining < 0 && pip.status === 'active';

              return (
                <TableRow 
                  key={pip.id} 
                  className="group cursor-pointer hover:bg-muted/50"
                  style={{
                    borderLeft: isOverdue ? '3px solid hsl(var(--destructive))' : undefined,
                  }}
                  onClick={() => handleRowClick(pip)}
                >
                  <TableCell className="py-3">
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Avatar src={staffMember?.avatar} sx={{ width: 36, height: 36 }}>
                        {staffMember?.firstName?.[0]}{staffMember?.lastName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {staffMember?.firstName} {staffMember?.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Manager: {manager?.firstName} {manager?.lastName}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell className="py-3 max-w-xs">
                    <Typography variant="body2" className="line-clamp-2">
                      {pip.reason}
                    </Typography>
                  </TableCell>
                  <TableCell className="py-3">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <StatusBadge 
                        status={getStatusBadgeVariant(pip.status) as any}
                        label={pipStatusLabels[pip.status]}
                      />
                      {isOverdue && (
                        <Chip 
                          label="Overdue" 
                          color="error" 
                          size="small" 
                          sx={{ fontSize: '0.65rem', height: 20 }}
                        />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell className="py-3 w-36">
                    <Box>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          {pip.milestones.filter(m => m.status === 'completed').length}/{pip.milestones.length}
                        </Typography>
                        <Typography variant="caption" fontWeight={600}>
                          {Math.round(progress)}%
                        </Typography>
                      </Stack>
                      <SemanticProgressBar 
                        value={progress} 
                        status={progress >= 100 ? 'completed' : progress >= 50 ? 'on_track' : 'at_risk'}
                        size="sm"
                      />
                    </Box>
                  </TableCell>
                  <TableCell className="py-3">
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={0.5} mb={0.5}>
                        <Calendar size={12} className="text-muted-foreground" />
                        <Typography variant="caption">
                          {format(parseISO(pip.startDate), 'MMM d')} - {format(parseISO(pip.currentEndDate), 'MMM d')}
                        </Typography>
                      </Stack>
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        color={isOverdue ? 'error.main' : daysRemaining <= 14 ? 'warning.main' : 'text.secondary'}
                      >
                        {isOverdue ? `${Math.abs(daysRemaining)}d overdue` : `${daysRemaining}d left`}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <Chip 
                      label={pip.checkIns.length} 
                      size="small" 
                      sx={{ minWidth: 32 }}
                    />
                  </TableCell>
                  <TableCell className="py-3">
                    <Stack 
                      direction="row" 
                      spacing={0.5} 
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <IconButton size="small" onClick={() => handleRowClick(pip)}>
                        <Eye size={14} />
                      </IconButton>
                      <IconButton size="small" onClick={() => { setSelectedPIP(pip); setShowEditDrawer(true); }}>
                        <Edit size={14} />
                      </IconButton>
                      <IconButton size="small">
                        <MoreHorizontal size={14} />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </Box>
  );

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
            <Box sx={{ p: 2, bgcolor: 'warning.50' }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Clock size={20} style={{ color: 'var(--warning)' }} />
                <Box>
                  <Typography variant="h5" fontWeight={700}>{activePIPs.length}</Typography>
                  <Typography variant="caption" color="text.secondary">Active PIPs</Typography>
                </Box>
              </Stack>
            </Box>
          </Card>
          <Card>
            <Box sx={{ p: 2, bgcolor: 'success.50' }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
                <Box>
                  <Typography variant="h5" fontWeight={700} color="success.main">
                    {pips.filter(p => p.status === 'completed_success').length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Successful</Typography>
                </Box>
              </Stack>
            </Box>
          </Card>
          <Card>
            <Box sx={{ p: 2, bgcolor: 'error.50' }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <XCircle size={20} style={{ color: 'var(--destructive)' }} />
                <Box>
                  <Typography variant="h5" fontWeight={700} color="error.main">
                    {pips.filter(p => p.status === 'completed_failure').length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Unsuccessful</Typography>
                </Box>
              </Stack>
            </Box>
          </Card>
          <Card>
            <Box sx={{ p: 2, bgcolor: 'primary.50' }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
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

        {/* Active PIPs Table */}
        {activePIPs.length > 0 && renderPIPTable(activePIPs, 'Active Plans')}

        {/* Completed PIPs Table */}
        {completedPIPs.length > 0 && renderPIPTable(completedPIPs, 'Completed Plans')}

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
