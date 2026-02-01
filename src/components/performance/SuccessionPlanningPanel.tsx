import React, { useState, useMemo } from 'react';
import {
  Box,
  Stack,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Collapse,
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
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-12"></TableHead>
            <TableHead>Key Role</TableHead>
            <TableHead>Current Holder</TableHead>
            <TableHead>Vacancy Risk</TableHead>
            <TableHead className="text-center">Candidates</TableHead>
            <TableHead>Bench Strength</TableHead>
            <TableHead className="w-24"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pipelines.map((pipeline) => {
            const currentHolder = pipeline.keyRole.currentHolderId 
              ? getStaffMember(pipeline.keyRole.currentHolderId) 
              : null;
            const isExpanded = expandedRoles.has(pipeline.keyRole.id);
            const isAtRisk = pipeline.keyRole.vacancyRisk === 'high' || pipeline.keyRole.vacancyRisk === 'critical';

            return (
              <React.Fragment key={pipeline.keyRole.id}>
                <TableRow 
                  className="group cursor-pointer hover:bg-muted/50"
                  style={{ 
                    borderLeft: isAtRisk ? '3px solid hsl(var(--destructive))' : undefined,
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
                        <Crown size={16} style={{ color: 'var(--primary)' }} />
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
                      sx={{ fontSize: '0.75rem' }}
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
                              <TableRow className="hover:bg-transparent">
                                <TableHead className="text-xs">Candidate</TableHead>
                                <TableHead className="text-xs">Readiness</TableHead>
                                <TableHead className="text-xs">Performance</TableHead>
                                <TableHead className="text-xs">Potential</TableHead>
                                <TableHead className="text-xs">Experience</TableHead>
                                <TableHead className="text-xs text-center">Overall</TableHead>
                                <TableHead className="w-16"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {pipeline.candidates.map(candidate => {
                                const staffMember = getStaffMember(candidate.staffId);
                                return (
                                  <TableRow 
                                    key={candidate.id} 
                                    className="group/candidate cursor-pointer hover:bg-white"
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
                                      <Typography variant="body2" fontWeight={700} color="primary.main">
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
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead>Candidate</TableHead>
            <TableHead>Target Role</TableHead>
            <TableHead>Readiness</TableHead>
            <TableHead>Performance</TableHead>
            <TableHead>Potential</TableHead>
            <TableHead className="text-center">Overall Score</TableHead>
            <TableHead className="w-24"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((candidate) => {
            const staffMember = getStaffMember(candidate.staffId);
            const keyRole = keyRoles.find(r => r.id === candidate.keyRoleId);

            return (
              <TableRow 
                key={candidate.id} 
                className="group cursor-pointer hover:bg-muted/50"
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
                    <Crown size={14} style={{ color: 'var(--primary)' }} />
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
                  <Typography variant="h6" fontWeight={700} color="primary.main">
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
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'flex-start' }} spacing={2}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'primary.light', display: 'flex' }}>
              <Crown size={20} style={{ color: 'var(--primary)' }} />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              Succession Planning
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Build leadership pipeline and manage talent readiness
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant={activeView === 'pipeline' ? 'default' : 'outline'}
            size="small"
            onClick={() => setActiveView('pipeline')}
          >
            Pipeline View
          </Button>
          <Button
            variant={activeView === 'candidates' ? 'default' : 'outline'}
            size="small"
            onClick={() => setActiveView('candidates')}
          >
            Candidates
          </Button>
          <Button variant="default" size="small" onClick={() => setShowAddRoleDrawer(true)}>
            <Plus size={16} className="mr-1" /> Add Role
          </Button>
        </Stack>
      </Stack>

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        <Card>
          <Box sx={{ p: 2, bgcolor: 'primary.50' }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Crown size={20} style={{ color: 'var(--primary)' }} />
              <Box>
                <Typography variant="h5" fontWeight={700}>{stats.totalRoles}</Typography>
                <Typography variant="caption" color="text.secondary">Key Roles</Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
        <Card>
          <Box sx={{ p: 2, bgcolor: 'error.50' }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <AlertTriangle size={20} style={{ color: 'var(--destructive)' }} />
              <Box>
                <Typography variant="h5" fontWeight={700} color="error.main">{stats.rolesAtRisk}</Typography>
                <Typography variant="caption" color="text.secondary">Roles at Risk</Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
        <Card>
          <Box sx={{ p: 2, bgcolor: 'success.50' }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Zap size={20} style={{ color: 'var(--success)' }} />
              <Box>
                <Typography variant="h5" fontWeight={700} color="success.main">{stats.readyNowTotal}</Typography>
                <Typography variant="caption" color="text.secondary">Ready Now</Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
        <Card>
          <Box sx={{ p: 2, bgcolor: 'info.50' }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <TrendingUp size={20} style={{ color: 'var(--info)' }} />
              <Box>
                <Typography variant="h5" fontWeight={700}>{Math.round(stats.avgBenchStrength)}%</Typography>
                <Typography variant="caption" color="text.secondary">Avg Bench Strength</Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
      </Box>

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
