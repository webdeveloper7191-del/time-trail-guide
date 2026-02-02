import React, { useState, useMemo } from 'react';
import {
  Box,
  Stack,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Collapse,
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
import {
  Users,
  Crown,
  TrendingUp,
  AlertTriangle,
  Target,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit,
  Zap,
  MoreHorizontal,
  Search,
  Trash2,
  Archive,
  Send,
} from 'lucide-react';
import { StaffMember } from '@/types/staff';
import {
  KeyRole,
  SuccessionCandidate,
  SuccessionPipeline,
  readinessLabels,
  readinessColors,
  successionRiskLabels,
} from '@/types/compensation';
import { mockKeyRoles as initialMockKeyRoles, mockSuccessionCandidates as initialMockCandidates } from '@/data/mockCompensationData';
import { toast } from 'sonner';
import {
  AddKeyRoleDrawer,
  AddCandidateDrawer,
  EditKeyRoleDrawer,
  EditCandidateDrawer,
  KeyRoleDetailSheet,
} from './succession';

interface SuccessionPlanningPanelProps {
  staff: StaffMember[];
  currentUserId: string;
}

export function SuccessionPlanningPanel({ staff, currentUserId }: SuccessionPlanningPanelProps) {
  const [keyRoles, setKeyRoles] = useState<KeyRole[]>(initialMockKeyRoles);
  const [candidates, setCandidates] = useState<SuccessionCandidate[]>(initialMockCandidates);
  
  const [activeView, setActiveView] = useState<'pipeline' | 'candidates'>('pipeline');
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(new Set());
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());
  
  // Drawer/Sheet states
  const [showAddRoleDrawer, setShowAddRoleDrawer] = useState(false);
  const [showAddCandidateDrawer, setShowAddCandidateDrawer] = useState(false);
  const [showEditRoleDrawer, setShowEditRoleDrawer] = useState(false);
  const [showEditCandidateDrawer, setShowEditCandidateDrawer] = useState(false);
  const [showRoleDetailSheet, setShowRoleDetailSheet] = useState(false);
  
  const [selectedRole, setSelectedRole] = useState<KeyRole | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<SuccessionCandidate | null>(null);
  const [addCandidateForRoleId, setAddCandidateForRoleId] = useState<string | undefined>();

  const getStaffMember = (staffId: string) => staff.find(s => s.id === staffId);

  // Bulk action handlers for roles
  const handleRoleSelectAll = () => setSelectedRoleIds(new Set(keyRoles.map(r => r.id)));
  const handleRoleClearSelection = () => setSelectedRoleIds(new Set());
  const toggleRoleSelection = (id: string) => {
    setSelectedRoleIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const roleBulkActions = [
    { id: 'export', label: 'Export', icon: <Send size={14} />, onClick: () => { toast.success(`Exporting ${selectedRoleIds.size} role(s)...`); handleRoleClearSelection(); } },
    { id: 'archive', label: 'Archive', icon: <Archive size={14} />, onClick: () => { toast.success(`${selectedRoleIds.size} role(s) archived`); handleRoleClearSelection(); } },
    { id: 'delete', label: 'Delete', icon: <Trash2 size={14} />, onClick: () => { setKeyRoles(prev => prev.filter(r => !selectedRoleIds.has(r.id))); toast.success(`${selectedRoleIds.size} role(s) deleted`); handleRoleClearSelection(); }, variant: 'destructive' as const },
  ];

  // Bulk action handlers for candidates
  const handleCandidateSelectAll = () => setSelectedCandidateIds(new Set(candidates.map(c => c.id)));
  const handleCandidateClearSelection = () => setSelectedCandidateIds(new Set());
  const toggleCandidateSelection = (id: string) => {
    setSelectedCandidateIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const candidateBulkActions = [
    { id: 'export', label: 'Export', icon: <Send size={14} />, onClick: () => { toast.success(`Exporting ${selectedCandidateIds.size} candidate(s)...`); handleCandidateClearSelection(); } },
    { id: 'remove', label: 'Remove', icon: <Trash2 size={14} />, onClick: () => { setCandidates(prev => prev.filter(c => !selectedCandidateIds.has(c.id))); toast.success(`${selectedCandidateIds.size} candidate(s) removed`); handleCandidateClearSelection(); }, variant: 'destructive' as const },
  ];

  const pipelines = useMemo<SuccessionPipeline[]>(() => {
    return keyRoles.map(role => {
      const roleCandidates = candidates.filter(c => c.keyRoleId === role.id);
      const readyNowCount = roleCandidates.filter(c => c.readiness === 'ready_now').length;
      const benchStrength = roleCandidates.length > 0 ? (readyNowCount / roleCandidates.length) * 100 : 0;
      return { keyRole: role, candidates: roleCandidates, readyNowCount, benchStrength };
    });
  }, [keyRoles, candidates]);

  const stats = useMemo(() => {
    const totalRoles = keyRoles.length;
    const rolesAtRisk = keyRoles.filter(r => r.vacancyRisk === 'high' || r.vacancyRisk === 'critical').length;
    const readyNowTotal = candidates.filter(c => c.readiness === 'ready_now').length;
    const avgBenchStrength = pipelines.length > 0 
      ? pipelines.reduce((sum, p) => sum + p.benchStrength, 0) / pipelines.length 
      : 0;
    return { totalRoles, rolesAtRisk, readyNowTotal, avgBenchStrength };
  }, [keyRoles, candidates, pipelines]);

  const toggleRoleExpand = (roleId: string) => {
    setExpandedRoles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roleId)) {
        newSet.delete(roleId);
      } else {
        newSet.add(roleId);
      }
      return newSet;
    });
  };

  // CRUD handlers
  const handleAddRole = (role: Omit<KeyRole, 'id'>) => {
    const newRole: KeyRole = { ...role, id: `role-${Date.now()}` };
    setKeyRoles([...keyRoles, newRole]);
    toast.success(`Key role "${role.title}" added`);
  };

  const handleEditRole = (role: KeyRole) => {
    setKeyRoles(keyRoles.map(r => r.id === role.id ? role : r));
    toast.success(`Key role "${role.title}" updated`);
    setShowEditRoleDrawer(false);
    setShowRoleDetailSheet(false);
  };

  const handleDeleteRole = (roleId: string) => {
    const role = keyRoles.find(r => r.id === roleId);
    setKeyRoles(keyRoles.filter(r => r.id !== roleId));
    setCandidates(candidates.filter(c => c.keyRoleId !== roleId));
    toast.success(`Key role "${role?.title}" deleted`);
    setShowRoleDetailSheet(false);
  };

  const handleAddCandidate = (candidateData: Omit<SuccessionCandidate, 'id' | 'competencyGaps' | 'developmentActions' | 'overallScore'>) => {
    const overallScore = Math.round(
      (candidateData.performanceScore * 0.4) + 
      (candidateData.potentialScore * 0.35) + 
      (candidateData.experienceScore * 0.25)
    );
    const newCandidate: SuccessionCandidate = {
      ...candidateData,
      id: `candidate-${Date.now()}`,
      overallScore,
      competencyGaps: [],
      developmentActions: [],
    };
    setCandidates([...candidates, newCandidate]);
    toast.success('Candidate added to succession pipeline');
  };

  const handleEditCandidate = (candidate: SuccessionCandidate) => {
    setCandidates(candidates.map(c => c.id === candidate.id ? candidate : c));
    toast.success('Candidate updated');
    setShowEditCandidateDrawer(false);
  };

  const handleDeleteCandidate = (candidateId: string) => {
    setCandidates(candidates.filter(c => c.id !== candidateId));
    toast.success('Candidate removed from pipeline');
  };

  // Open handlers
  const openRoleDetail = (role: KeyRole) => {
    setSelectedRole(role);
    setShowRoleDetailSheet(true);
  };

  const openEditRole = (role: KeyRole) => {
    setSelectedRole(role);
    setShowEditRoleDrawer(true);
  };

  const openAddCandidateForRole = (roleId: string) => {
    setAddCandidateForRoleId(roleId);
    setShowAddCandidateDrawer(true);
  };

  const openEditCandidate = (candidate: SuccessionCandidate) => {
    setSelectedCandidate(candidate);
    setShowEditCandidateDrawer(true);
  };

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'critical': return 'destructive';
      case 'high': return 'warning';
      case 'medium': return 'secondary';
      default: return 'success';
    }
  };

  const getReadinessColor = (readiness: string) => {
    switch (readiness) {
      case 'ready_now': return 'success';
      case 'ready_1_2_years': return 'info';
      case 'ready_3_5_years': return 'warning';
      default: return 'secondary';
    }
  };

  const renderPipelineTable = () => (
    <Card>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-12 h-10"></TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground h-10">Key Role</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground h-10">Current Holder</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground h-10">Vacancy Risk</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground h-10 text-center">Candidates</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground h-10">Bench Strength</TableHead>
            <TableHead className="w-24 h-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pipelines.map((pipeline) => {
            const currentHolder = pipeline.keyRole.currentHolderId 
              ? getStaffMember(pipeline.keyRole.currentHolderId) 
              : null;
            const isExpanded = expandedRoles.has(pipeline.keyRole.id);
            const isAtRisk = pipeline.keyRole.vacancyRisk === 'high' || pipeline.keyRole.vacancyRisk === 'critical';
            const isReadyNow = pipeline.readyNowCount > 0;

            return (
              <React.Fragment key={pipeline.keyRole.id}>
                <TableRow 
                  className="group cursor-pointer hover:bg-muted/50 transition-colors"
                  style={{ 
                    borderLeft: isAtRisk 
                      ? '3px solid hsl(var(--destructive))' 
                      : isReadyNow 
                        ? '3px solid hsl(var(--chart-2))' 
                        : undefined,
                  }}
                  onClick={() => toggleRoleExpand(pipeline.keyRole.id)}
                >
                  <TableCell className="py-3">
                    <IconButton size="small" sx={{ p: 0.5 }}>
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </IconButton>
                  </TableCell>
                  <TableCell className="py-3">
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Box sx={{ 
                        p: 0.75, 
                        borderRadius: 1, 
                        bgcolor: 'primary.50',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Crown size={16} style={{ color: 'hsl(var(--primary))' }} />
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{pipeline.keyRole.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {pipeline.keyRole.department} • {pipeline.keyRole.criticality}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell className="py-3">
                    {currentHolder ? (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar src={currentHolder.avatar} sx={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                          {currentHolder.firstName?.[0]}{currentHolder.lastName?.[0]}
                        </Avatar>
                        <Typography variant="body2">
                          {currentHolder.firstName} {currentHolder.lastName}
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary" fontStyle="italic">Vacant</Typography>
                    )}
                  </TableCell>
                  <TableCell className="py-3">
                    <StatusBadge 
                      status={getRiskBadgeVariant(pipeline.keyRole.vacancyRisk) as any}
                      label={successionRiskLabels[pipeline.keyRole.vacancyRisk]}
                    />
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <Chip 
                      label={`${pipeline.candidates.length} (${pipeline.readyNowCount} ready)`}
                      size="small"
                      sx={{ fontSize: '0.7rem', fontWeight: 500 }}
                    />
                  </TableCell>
                  <TableCell className="py-3 w-40">
                    <SemanticProgressBar value={pipeline.benchStrength} showLabel size="sm" />
                  </TableCell>
                  <TableCell className="py-3">
                    <Stack 
                      direction="row" 
                      spacing={0.5} 
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <IconButton size="small" onClick={() => openEditRole(pipeline.keyRole)}>
                        <Edit size={14} />
                      </IconButton>
                      <IconButton size="small" onClick={() => openAddCandidateForRole(pipeline.keyRole.id)}>
                        <Plus size={14} />
                      </IconButton>
                      <IconButton size="small" onClick={() => openRoleDetail(pipeline.keyRole)}>
                        <MoreHorizontal size={14} />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>

                {/* Expanded Candidates */}
                <TableRow>
                  <TableCell colSpan={7} className="p-0 border-0">
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box sx={{ bgcolor: 'grey.50', py: 2, px: 4 }}>
                        {pipeline.candidates.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow className="hover:bg-transparent bg-muted/30">
                                <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground h-8">Candidate</TableHead>
                                <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground h-8">Readiness</TableHead>
                                <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground h-8">Performance</TableHead>
                                <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground h-8">Potential</TableHead>
                                <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground h-8">Experience</TableHead>
                                <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground h-8 text-center">Overall</TableHead>
                                <TableHead className="w-16 h-8"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {pipeline.candidates.map(candidate => {
                                const staffMember = getStaffMember(candidate.staffId);
                                const isReadyNowCandidate = candidate.readiness === 'ready_now';
                                return (
                                  <TableRow 
                                    key={candidate.id} 
                                    className="group/candidate cursor-pointer hover:bg-white transition-colors"
                                    style={{
                                      borderLeft: isReadyNowCandidate ? '3px solid hsl(var(--chart-2))' : undefined,
                                    }}
                                    onClick={() => openEditCandidate(candidate)}
                                  >
                                    <TableCell className="py-2">
                                      <Stack direction="row" alignItems="center" spacing={1}>
                                        <Avatar src={staffMember?.avatar} sx={{ width: 24, height: 24, fontSize: '0.65rem' }}>
                                          {staffMember?.firstName?.[0]}{staffMember?.lastName?.[0]}
                                        </Avatar>
                                        <Box>
                                          <Typography variant="caption" fontWeight={500}>
                                            {staffMember?.firstName} {staffMember?.lastName}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem' }}>
                                            {staffMember?.position}
                                          </Typography>
                                        </Box>
                                      </Stack>
                                    </TableCell>
                                    <TableCell className="py-2">
                                      <StatusBadge 
                                        status={getReadinessColor(candidate.readiness) as any}
                                        label={readinessLabels[candidate.readiness]}
                                      />
                                    </TableCell>
                                    <TableCell className="py-2 w-28">
                                      <SemanticProgressBar value={candidate.performanceScore} size="xs" />
                                    </TableCell>
                                    <TableCell className="py-2 w-28">
                                      <SemanticProgressBar value={candidate.potentialScore} size="xs" />
                                    </TableCell>
                                    <TableCell className="py-2 w-28">
                                      <SemanticProgressBar value={candidate.experienceScore} size="xs" />
                                    </TableCell>
                                    <TableCell className="py-2 text-center">
                                      <Typography variant="body2" fontWeight={700} sx={{ color: 'hsl(var(--primary))' }}>
                                        {candidate.overallScore}%
                                      </Typography>
                                    </TableCell>
                                    <TableCell className="py-2">
                                      <IconButton 
                                        size="small" 
                                        className="opacity-0 group-hover/candidate:opacity-100 transition-opacity"
                                        onClick={(e) => { e.stopPropagation(); openEditCandidate(candidate); }}
                                      >
                                        <Edit size={12} />
                                      </IconButton>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        ) : (
                          <Box sx={{ textAlign: 'center', py: 3 }}>
                            <Typography variant="body2" color="text.secondary" mb={2}>
                              No succession candidates identified
                            </Typography>
                            <Button size="small" variant="outline" onClick={() => openAddCandidateForRole(pipeline.keyRole.id)}>
                              <Plus size={14} className="mr-1" /> Add Candidate
                            </Button>
                          </Box>
                        )}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );

  const renderCandidatesTable = () => (
    <Card>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground h-10">Candidate</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground h-10">Target Role</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground h-10">Readiness</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground h-10">Performance</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground h-10">Potential</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground h-10 text-center">Overall Score</TableHead>
            <TableHead className="w-24 h-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((candidate) => {
            const staffMember = getStaffMember(candidate.staffId);
            const keyRole = keyRoles.find(r => r.id === candidate.keyRoleId);
            const isReadyNow = candidate.readiness === 'ready_now';
            const isHighPerformer = candidate.overallScore >= 80;

            return (
              <TableRow 
                key={candidate.id} 
                className="group cursor-pointer hover:bg-muted/50 transition-colors"
                style={{
                  borderLeft: isReadyNow 
                    ? '3px solid hsl(var(--chart-2))' 
                    : isHighPerformer 
                      ? '3px solid hsl(var(--primary))' 
                      : undefined,
                }}
                onClick={() => openEditCandidate(candidate)}
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
                        {staffMember?.position}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell className="py-3">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Crown size={14} style={{ color: 'hsl(var(--primary))' }} />
                    <Typography variant="body2">{keyRole?.title || 'Unknown Role'}</Typography>
                  </Stack>
                </TableCell>
                <TableCell className="py-3">
                  <StatusBadge 
                    status={getReadinessColor(candidate.readiness) as any}
                    label={readinessLabels[candidate.readiness]}
                  />
                </TableCell>
                <TableCell className="py-3 w-32">
                  <SemanticProgressBar value={candidate.performanceScore} showLabel size="sm" />
                </TableCell>
                <TableCell className="py-3 w-32">
                  <SemanticProgressBar value={candidate.potentialScore} showLabel size="sm" />
                </TableCell>
                <TableCell className="py-3 text-center">
                  <Typography variant="h6" fontWeight={700} sx={{ color: 'hsl(var(--primary))' }}>
                    {candidate.overallScore}%
                  </Typography>
                </TableCell>
                <TableCell className="py-3">
                  <Stack 
                    direction="row" 
                    spacing={0.5} 
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <IconButton size="small" onClick={() => openEditCandidate(candidate)}>
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
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'stretch', sm: 'flex-start' }}
        spacing={2}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
            <Box sx={{ p: { xs: 0.75, md: 1 }, borderRadius: 1.5, bgcolor: 'primary.light', display: 'flex' }}>
              <Crown size={18} style={{ color: 'var(--primary)' }} />
            </Box>
            <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
              Succession Planning
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Build leadership pipeline and manage talent readiness
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' }, flexWrap: 'wrap' }}>
          <Button
            variant={activeView === 'pipeline' ? 'default' : 'outline'}
            size="small"
            onClick={() => setActiveView('pipeline')}
            className="flex-1 sm:flex-none text-xs sm:text-sm"
          >
            Pipeline
          </Button>
          <Button
            variant={activeView === 'candidates' ? 'default' : 'outline'}
            size="small"
            onClick={() => setActiveView('candidates')}
            className="flex-1 sm:flex-none text-xs sm:text-sm"
          >
            Candidates
          </Button>
          <Button variant="default" size="small" onClick={() => setShowAddRoleDrawer(true)} className="text-xs sm:text-sm">
            <Plus size={14} className="mr-1" /> <span className="hidden sm:inline">Add Role</span><span className="sm:hidden">Add</span>
          </Button>
        </Stack>
      </Stack>

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: { xs: 1.5, md: 2 } }}>
        <Card>
          <Box sx={{ p: { xs: 1.5, md: 2 }, bgcolor: 'primary.50' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Crown size={16} style={{ color: 'var(--primary)' }} />
              <Box>
                <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>{stats.totalRoles}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', md: '0.75rem' } }}>Key Roles</Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
        <Card>
          <Box sx={{ p: { xs: 1.5, md: 2 }, bgcolor: 'error.50' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <AlertTriangle size={16} style={{ color: 'var(--destructive)' }} />
              <Box>
                <Typography variant="h5" fontWeight={700} color="error.main" sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>{stats.rolesAtRisk}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', md: '0.75rem' } }}>At Risk</Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
        <Card sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Box sx={{ p: { xs: 1.5, md: 2 }, bgcolor: 'success.50' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Zap size={16} style={{ color: 'var(--success)' }} />
              <Box>
                <Typography variant="h5" fontWeight={700} color="success.main" sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>{stats.readyNowTotal}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', md: '0.75rem' } }}>Ready Now</Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
        <Card sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Box sx={{ p: { xs: 1.5, md: 2 }, bgcolor: 'info.50' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <TrendingUp size={16} style={{ color: 'var(--info)' }} />
              <Box>
                <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>{Math.round(stats.avgBenchStrength)}%</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', md: '0.75rem' } }}>Bench Strength</Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
      </Box>

      {/* Search & Bulk Actions */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        spacing={{ xs: 1.5, sm: 2 }} 
        alignItems={{ xs: 'stretch', sm: 'center' }}
        sx={{ flexWrap: 'wrap' }}
      >
        <TextField
          placeholder="Search..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ minWidth: { xs: '100%', sm: 200 }, maxWidth: { sm: 280 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={16} className="text-muted-foreground" />
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ flex: 1, display: { xs: 'none', sm: 'block' } }} />
        {activeView === 'pipeline' ? (
          <InlineBulkActions
            selectedCount={selectedRoleIds.size}
            totalCount={keyRoles.length}
            onClearSelection={handleRoleClearSelection}
            onSelectAll={handleRoleSelectAll}
            actions={roleBulkActions}
            entityName="roles"
          />
        ) : (
          <InlineBulkActions
            selectedCount={selectedCandidateIds.size}
            totalCount={candidates.length}
            onClearSelection={handleCandidateClearSelection}
            onSelectAll={handleCandidateSelectAll}
            actions={candidateBulkActions}
            entityName="candidates"
          />
        )}
      </Stack>

      {/* Content */}
      {activeView === 'pipeline' ? renderPipelineTable() : renderCandidatesTable()}

      {/* Drawers and Sheets */}
      <AddKeyRoleDrawer
        open={showAddRoleDrawer}
        onClose={() => setShowAddRoleDrawer(false)}
        staff={staff}
        onSave={handleAddRole}
      />

      <AddCandidateDrawer
        open={showAddCandidateDrawer}
        onClose={() => {
          setShowAddCandidateDrawer(false);
          setAddCandidateForRoleId(undefined);
        }}
        staff={staff}
        keyRoles={keyRoles}
        selectedRoleId={addCandidateForRoleId}
        existingCandidates={candidates}
        onSave={handleAddCandidate}
      />

      <EditKeyRoleDrawer
        open={showEditRoleDrawer}
        onClose={() => setShowEditRoleDrawer(false)}
        role={selectedRole}
        staff={staff}
        onSave={handleEditRole}
      />

      <EditCandidateDrawer
        open={showEditCandidateDrawer}
        onClose={() => setShowEditCandidateDrawer(false)}
        candidate={selectedCandidate}
        staff={staff}
        keyRoles={keyRoles}
        onSave={handleEditCandidate}
      />

      <KeyRoleDetailSheet
        open={showRoleDetailSheet}
        onClose={() => setShowRoleDetailSheet(false)}
        role={selectedRole}
        candidates={selectedRole ? candidates.filter(c => c.keyRoleId === selectedRole.id) : []}
        staff={staff}
        onEdit={() => {
          setShowRoleDetailSheet(false);
          setShowEditRoleDrawer(true);
        }}
        onAddCandidate={() => {
          if (selectedRole) {
            setAddCandidateForRoleId(selectedRole.id);
            setShowAddCandidateDrawer(true);
          }
        }}
        onEditCandidate={openEditCandidate}
        onDeleteRole={() => selectedRole && handleDeleteRole(selectedRole.id)}
      />
    </Box>
  );
}

export default SuccessionPlanningPanel;
