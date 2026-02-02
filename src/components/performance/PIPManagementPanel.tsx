import React, { useState, useMemo } from 'react';
import {
  Box,
  Stack,
  Typography,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
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
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SemanticProgressBar } from './shared/SemanticProgressBar';
import { StatusBadge } from './shared/StatusBadge';
import { InlineBulkActions } from './shared/InlineBulkActions';
import { RowActionsMenu, RowAction } from './shared/RowActionsMenu';
import { CollapsibleStatsGrid, ScrollableTable } from './shared';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Calendar,
  Target,
  Edit,
  Eye,
  Search,
  Trash2,
  Archive,
  Send,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Drawer states
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showCheckInDrawer, setShowCheckInDrawer] = useState(false);
  const [showOutcomeDrawer, setShowOutcomeDrawer] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);

  const getStaffMember = (staffId: string) => staff.find(s => s.id === staffId);

  // Filtered PIPs based on search and status
  const filteredPIPs = useMemo(() => {
    return pips.filter(pip => {
      const staffMember = getStaffMember(pip.staffId);
      const staffName = staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : '';
      const matchesSearch = 
        staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pip.reason.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || pip.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [pips, searchQuery, statusFilter, staff]);

  const activePIPs = filteredPIPs.filter(p => p.status === 'active' || p.status === 'extended');
  const completedPIPs = filteredPIPs.filter(p => p.status.startsWith('completed'));

  const calculateProgress = (pip: PerformanceImprovementPlan) => {
    const completedMilestones = pip.milestones.filter(m => m.status === 'completed').length;
    return pip.milestones.length > 0 ? (completedMilestones / pip.milestones.length) * 100 : 0;
  };

  const getDaysRemaining = (pip: PerformanceImprovementPlan) => {
    const endDate = parseISO(pip.currentEndDate);
    const today = new Date();
    return differenceInDays(endDate, today);
  };

  // Selection handlers
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(filteredPIPs.map(p => p.id)));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Bulk action handlers
  const handleBulkCancel = () => {
    setPips(prev => prev.map(p => 
      selectedIds.has(p.id) ? { ...p, status: 'cancelled' as const } : p
    ));
    toast.success(`${selectedIds.size} PIP(s) cancelled`);
    handleClearSelection();
  };

  const handleBulkArchive = () => {
    toast.success(`${selectedIds.size} PIP(s) archived`);
    handleClearSelection();
  };

  const handleBulkExport = () => {
    toast.success(`Exporting ${selectedIds.size} PIP(s)...`);
    handleClearSelection();
  };

  const bulkActions = [
    { id: 'archive', label: 'Archive', icon: <Archive size={14} />, onClick: handleBulkArchive },
    { id: 'export', label: 'Export', icon: <Send size={14} />, onClick: handleBulkExport },
    { id: 'cancel', label: 'Cancel', icon: <Trash2 size={14} />, onClick: handleBulkCancel, variant: 'destructive' as const },
  ];

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
      <Typography 
        variant="overline" 
        sx={{ 
          fontSize: '0.65rem', 
          fontWeight: 600, 
          letterSpacing: '0.1em',
          color: 'text.secondary',
          mb: 2, 
          display: 'block' 
        }}
      >
        {title}
      </Typography>
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-10">
                <Checkbox 
                  checked={pipList.every(p => selectedIds.has(p.id)) && pipList.length > 0}
                  onCheckedChange={() => {
                    if (pipList.every(p => selectedIds.has(p.id))) {
                      setSelectedIds(prev => {
                        const next = new Set(prev);
                        pipList.forEach(p => next.delete(p.id));
                        return next;
                      });
                    } else {
                      setSelectedIds(prev => {
                        const next = new Set(prev);
                        pipList.forEach(p => next.add(p.id));
                        return next;
                      });
                    }
                  }}
                />
              </TableHead>
              <TableHead className="text-[0.65rem] uppercase tracking-wider font-semibold text-muted-foreground">Employee</TableHead>
              <TableHead className="text-[0.65rem] uppercase tracking-wider font-semibold text-muted-foreground">Reason</TableHead>
              <TableHead className="text-[0.65rem] uppercase tracking-wider font-semibold text-muted-foreground">Status</TableHead>
              <TableHead className="text-[0.65rem] uppercase tracking-wider font-semibold text-muted-foreground">Progress</TableHead>
              <TableHead className="text-[0.65rem] uppercase tracking-wider font-semibold text-muted-foreground">Timeline</TableHead>
              <TableHead className="text-[0.65rem] uppercase tracking-wider font-semibold text-muted-foreground text-center">Check-ins</TableHead>
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
              const isAtRisk = daysRemaining <= 14 && daysRemaining >= 0 && pip.status === 'active';
              const isSuccess = pip.status === 'completed_success';

              // Determine border color: red for overdue, amber for at-risk, green for success
              const borderColor = isOverdue 
                ? 'hsl(var(--destructive))' 
                : isAtRisk 
                  ? 'hsl(var(--chart-4))' 
                  : isSuccess 
                    ? 'hsl(var(--chart-2))' 
                    : 'transparent';

              return (
                <TableRow 
                  key={pip.id} 
                  className="group cursor-pointer hover:bg-muted/50 transition-colors"
                  style={{ borderLeft: `3px solid ${borderColor}` }}
                  onClick={() => handleRowClick(pip)}
                >
                  <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      checked={selectedIds.has(pip.id)}
                      onCheckedChange={() => toggleSelection(pip.id)}
                    />
                  </TableCell>
                  <TableCell className="py-3">
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Avatar src={staffMember?.avatar} sx={{ width: 36, height: 36 }}>
                        {staffMember?.firstName?.[0]}{staffMember?.lastName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.875rem' }}>
                          {staffMember?.firstName} {staffMember?.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          Manager: {manager?.firstName} {manager?.lastName}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell className="py-3 max-w-xs">
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }} className="line-clamp-2">
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
                          sx={{ fontSize: '0.65rem', height: 20, fontWeight: 600 }}
                        />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell className="py-3 w-36">
                    <Box>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          {pip.milestones.filter(m => m.status === 'completed').length}/{pip.milestones.length}
                        </Typography>
                        <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
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
                        <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                          {format(parseISO(pip.startDate), 'MMM d')} - {format(parseISO(pip.currentEndDate), 'MMM d')}
                        </Typography>
                      </Stack>
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        sx={{ 
                          fontSize: '0.7rem',
                          color: isOverdue ? 'error.main' : daysRemaining <= 14 ? 'warning.main' : 'text.secondary'
                        }}
                      >
                        {isOverdue ? `${Math.abs(daysRemaining)}d overdue` : `${daysRemaining}d left`}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <Chip 
                      label={pip.checkIns.length} 
                      size="small" 
                      sx={{ minWidth: 32, fontSize: '0.75rem', fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                    <RowActionsMenu
                      actions={[
                        {
                          label: 'View Details',
                          icon: <Eye size={14} />,
                          onClick: (e) => { e.stopPropagation(); handleRowClick(pip); },
                        },
                        {
                          label: 'Edit PIP',
                          icon: <Edit size={14} />,
                          onClick: (e) => { e.stopPropagation(); setSelectedPIP(pip); setShowEditDrawer(true); },
                        },
                        {
                          label: 'Cancel',
                          icon: <Trash2 size={14} />,
                          variant: 'destructive',
                          separator: true,
                          onClick: (e) => { 
                            e.stopPropagation(); 
                            setPips(prev => prev.map(p => p.id === pip.id ? { ...p, status: 'cancelled' as const } : p));
                            toast.success('PIP cancelled');
                          },
                        },
                      ]}
                    />
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
        {/* Header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'flex-start' }} spacing={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
              <Box sx={{ p: { xs: 0.75, md: 1 }, borderRadius: 1.5, bgcolor: 'warning.light', display: 'flex' }}>
                <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
              </Box>
              <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
                Performance Improvement Plans
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Manage formal improvement plans with milestones and documentation
            </Typography>
          </Box>
          <Button variant="default" onClick={() => setShowCreateDrawer(true)} className="w-full sm:w-auto">
            <Plus size={16} className="mr-1" /> <span className="hidden sm:inline">Create PIP</span><span className="sm:hidden">New PIP</span>
          </Button>
        </Stack>

        {/* Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: { xs: 1.5, md: 2 } }}>
          <Card>
            <Box sx={{ p: { xs: 1.5, md: 2 }, bgcolor: 'warning.50' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Clock size={18} style={{ color: 'var(--warning)' }} />
                <Box>
                  <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>{activePIPs.length}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', md: '0.75rem' } }}>Active PIPs</Typography>
                </Box>
              </Stack>
            </Box>
          </Card>
          <Card>
            <Box sx={{ p: { xs: 1.5, md: 2 }, bgcolor: 'success.50' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                <Box>
                  <Typography variant="h5" fontWeight={700} color="success.main" sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                    {pips.filter(p => p.status === 'completed_success').length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', md: '0.75rem' } }}>Successful</Typography>
                </Box>
              </Stack>
            </Box>
          </Card>
          <Card sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Box sx={{ p: { xs: 1.5, md: 2 }, bgcolor: 'error.50' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <XCircle size={18} style={{ color: 'var(--destructive)' }} />
                <Box>
                  <Typography variant="h5" fontWeight={700} color="error.main" sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                    {pips.filter(p => p.status === 'completed_failure').length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', md: '0.75rem' } }}>Unsuccessful</Typography>
                </Box>
              </Stack>
            </Box>
          </Card>
          <Card sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Box sx={{ p: { xs: 1.5, md: 2 }, bgcolor: 'primary.50' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Target size={18} style={{ color: 'var(--primary)' }} />
                <Box>
                  <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                    {activePIPs.length > 0 
                      ? Math.round(activePIPs.reduce((sum, p) => sum + calculateProgress(p), 0) / activePIPs.length) 
                      : 0}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', md: '0.75rem' } }}>Avg Progress</Typography>
                </Box>
              </Stack>
            </Box>
          </Card>
        </Box>

        {/* Search, Filters & Bulk Actions */}
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          alignItems={{ xs: 'stretch', sm: 'center' }}
          sx={{ flexWrap: 'wrap' }}
        >
          <TextField
            placeholder="Search PIPs..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ minWidth: 200, flex: { xs: 1, sm: 'initial' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} className="text-muted-foreground" />
                </InputAdornment>
              ),
            }}
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="extended">Extended</SelectItem>
              <SelectItem value="completed_success">Successful</SelectItem>
              <SelectItem value="completed_failure">Unsuccessful</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Box sx={{ flex: 1 }} />

          <InlineBulkActions
            selectedCount={selectedIds.size}
            totalCount={filteredPIPs.length}
            onClearSelection={handleClearSelection}
            onSelectAll={handleSelectAll}
            actions={bulkActions}
            entityName="PIPs"
          />
        </Stack>

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
