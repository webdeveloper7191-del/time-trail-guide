import React, { useState, useMemo } from 'react';
import {
  Box,
  Stack,
  Typography,
  Avatar,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  AvatarGroup,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui/Button';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Crown,
  TrendingUp,
  AlertTriangle,
  Target,
  GraduationCap,
  ChevronRight,
  Plus,
  Edit,
  Star,
  Zap,
  Clock,
  CheckCircle2,
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
import { mockKeyRoles, mockSuccessionCandidates } from '@/data/mockCompensationData';
import { toast } from 'sonner';

interface SuccessionPlanningPanelProps {
  staff: StaffMember[];
  currentUserId: string;
}

export function SuccessionPlanningPanel({ staff, currentUserId }: SuccessionPlanningPanelProps) {
  const [selectedRole, setSelectedRole] = useState<KeyRole | null>(null);
  const [activeView, setActiveView] = useState<'pipeline' | 'candidates'>('pipeline');

  const getStaffMember = (staffId: string) => staff.find(s => s.id === staffId);

  const pipelines = useMemo<SuccessionPipeline[]>(() => {
    return mockKeyRoles.map(role => {
      const candidates = mockSuccessionCandidates.filter(c => c.keyRoleId === role.id);
      const readyNowCount = candidates.filter(c => c.readiness === 'ready_now').length;
      const benchStrength = candidates.length > 0 ? (readyNowCount / candidates.length) * 100 : 0;
      return { keyRole: role, candidates, readyNowCount, benchStrength };
    });
  }, []);

  const stats = useMemo(() => {
    const totalRoles = mockKeyRoles.length;
    const rolesAtRisk = mockKeyRoles.filter(r => r.vacancyRisk === 'high' || r.vacancyRisk === 'critical').length;
    const readyNowTotal = mockSuccessionCandidates.filter(c => c.readiness === 'ready_now').length;
    const avgBenchStrength = pipelines.length > 0 
      ? pipelines.reduce((sum, p) => sum + p.benchStrength, 0) / pipelines.length 
      : 0;
    return { totalRoles, rolesAtRisk, readyNowTotal, avgBenchStrength };
  }, [pipelines]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'success';
    }
  };

  const renderPipelineView = () => (
    <Stack spacing={3}>
      {pipelines.map((pipeline) => {
        const currentHolder = pipeline.keyRole.currentHolderId 
          ? getStaffMember(pipeline.keyRole.currentHolderId) 
          : null;

        return (
          <Card key={pipeline.keyRole.id}>
            <Box sx={{ p: 3 }}>
              {/* Role Header */}
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
                    <Crown size={20} style={{ color: 'var(--primary)' }} />
                    <Typography variant="h6" fontWeight={600}>{pipeline.keyRole.title}</Typography>
                    <Chip 
                      label={successionRiskLabels[pipeline.keyRole.vacancyRisk]} 
                      size="small" 
                      color={getRiskColor(pipeline.keyRole.vacancyRisk) as any}
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {pipeline.keyRole.department} • {pipeline.keyRole.criticality} role
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button variant="ghost" size="small" onClick={() => setSelectedRole(pipeline.keyRole)}>
                    <Edit size={14} className="mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="small" onClick={() => toast.info('Add successor')}>
                    <Plus size={14} className="mr-1" /> Add Candidate
                  </Button>
                </Stack>
              </Stack>

              {/* Current Holder */}
              {currentHolder && (
                <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1, mb: 3 }}>
                  <Typography variant="caption" color="primary.main" fontWeight={600} mb={1} display="block">
                    CURRENT HOLDER
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar src={currentHolder.avatar} sx={{ width: 48, height: 48 }}>
                      {currentHolder.firstName?.[0]}{currentHolder.lastName?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {currentHolder.firstName} {currentHolder.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {currentHolder.position}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              )}

              {/* Succession Pipeline Visual */}
              <Box mb={3}>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                  <Typography variant="subtitle2" fontWeight={600}>Succession Pipeline</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Bench Strength: {Math.round(pipeline.benchStrength)}%
                  </Typography>
                </Stack>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
                  {(['ready_now', 'ready_1_2_years', 'ready_3_5_years', 'not_ready'] as const).map((readiness) => {
                    const candidatesInBucket = pipeline.candidates.filter(c => c.readiness === readiness);
                    
                    return (
                      <Box 
                        key={readiness}
                        sx={{ 
                          p: 2, 
                          borderRadius: 1, 
                          bgcolor: 'grey.50',
                          border: 1,
                          borderColor: candidatesInBucket.length > 0 ? readinessColors[readiness] : 'grey.200',
                          borderStyle: candidatesInBucket.length > 0 ? 'solid' : 'dashed',
                        }}
                      >
                        <Typography 
                          variant="caption" 
                          fontWeight={600} 
                          sx={{ color: readinessColors[readiness] }}
                          mb={1}
                          display="block"
                        >
                          {readinessLabels[readiness]}
                        </Typography>
                        {candidatesInBucket.length > 0 ? (
                          <Stack spacing={1}>
                            {candidatesInBucket.map(candidate => {
                              const staffMember = getStaffMember(candidate.staffId);
                              return (
                                <Stack key={candidate.id} direction="row" alignItems="center" spacing={1}>
                                  <Avatar src={staffMember?.avatar} sx={{ width: 28, height: 28, fontSize: '0.7rem' }}>
                                    {staffMember?.firstName?.[0]}{staffMember?.lastName?.[0]}
                                  </Avatar>
                                  <Box flex={1} minWidth={0}>
                                    <Typography variant="caption" fontWeight={500} noWrap>
                                      {staffMember?.firstName} {staffMember?.lastName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      Score: {candidate.overallScore}%
                                    </Typography>
                                  </Box>
                                </Stack>
                              );
                            })}
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            No candidates
                          </Typography>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              {/* Required Competencies */}
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} mb={1} display="block">
                  REQUIRED COMPETENCIES
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
                  {pipeline.keyRole.requiredCompetencies.map((comp, i) => (
                    <Chip key={i} label={comp} size="small" variant="outlined" />
                  ))}
                </Stack>
              </Box>
            </Box>
          </Card>
        );
      })}
    </Stack>
  );

  const renderCandidatesView = () => (
    <Stack spacing={2}>
      {mockSuccessionCandidates.map((candidate) => {
        const staffMember = getStaffMember(candidate.staffId);
        const keyRole = mockKeyRoles.find(r => r.id === candidate.keyRoleId);
        const mentor = candidate.mentorId ? getStaffMember(candidate.mentorId) : null;

        return (
          <Card key={candidate.id} sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}>
            <Box sx={{ p: 2.5 }}>
              <Stack direction="row" alignItems="flex-start" spacing={2}>
                <Avatar src={staffMember?.avatar} sx={{ width: 56, height: 56 }}>
                  {staffMember?.firstName?.[0]}{staffMember?.lastName?.[0]}
                </Avatar>
                
                <Box flex={1}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {staffMember?.firstName} {staffMember?.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {staffMember?.position}
                      </Typography>
                      <Stack direction="row" spacing={1} mt={1}>
                        <Chip 
                          label={`Successor for: ${keyRole?.title}`} 
                          size="small" 
                          variant="outlined"
                          icon={<Crown size={12} />}
                        />
                        <Chip 
                          label={readinessLabels[candidate.readiness]}
                          size="small"
                          sx={{ 
                            bgcolor: readinessColors[candidate.readiness],
                            color: 'white',
                          }}
                        />
                      </Stack>
                    </Box>
                    
                    <Box textAlign="center" sx={{ minWidth: 80 }}>
                      <Typography variant="h4" fontWeight={700} color="primary.main">
                        {candidate.overallScore}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Overall Score</Typography>
                    </Box>
                  </Stack>

                  {/* Score Breakdown */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mt: 2 }}>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" color="text.secondary">Performance</Typography>
                        <Typography variant="caption" fontWeight={600}>{candidate.performanceScore}%</Typography>
                      </Stack>
                      <Progress value={candidate.performanceScore} className="h-1.5" />
                    </Box>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" color="text.secondary">Potential</Typography>
                        <Typography variant="caption" fontWeight={600}>{candidate.potentialScore}%</Typography>
                      </Stack>
                      <Progress value={candidate.potentialScore} className="h-1.5" />
                    </Box>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" color="text.secondary">Experience</Typography>
                        <Typography variant="caption" fontWeight={600}>{candidate.experienceScore}%</Typography>
                      </Stack>
                      <Progress value={candidate.experienceScore} className="h-1.5" />
                    </Box>
                  </Box>

                  {/* Competency Gaps */}
                  {candidate.competencyGaps.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} mb={1} display="block">
                        DEVELOPMENT GAPS
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
                        {candidate.competencyGaps.map((gap) => (
                          <Chip
                            key={gap.id}
                            label={`${gap.competency} (${gap.currentLevel}→${gap.requiredLevel})`}
                            size="small"
                            color={gap.developmentPriority === 'high' ? 'error' : gap.developmentPriority === 'medium' ? 'warning' : 'default'}
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* Development Actions */}
                  {candidate.developmentActions.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} mb={1} display="block">
                        DEVELOPMENT ACTIONS
                      </Typography>
                      <Stack spacing={0.5}>
                        {candidate.developmentActions.slice(0, 2).map((action) => (
                          <Stack key={action.id} direction="row" alignItems="center" spacing={1}>
                            {action.status === 'completed' ? (
                              <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
                            ) : action.status === 'in_progress' ? (
                              <Clock size={14} style={{ color: 'var(--warning)' }} />
                            ) : (
                              <Target size={14} style={{ color: 'var(--muted-foreground)' }} />
                            )}
                            <Typography variant="caption">{action.title}</Typography>
                            <Chip label={action.type.replace('_', ' ')} size="small" sx={{ fontSize: '0.65rem', height: 18 }} />
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {/* Mentor */}
                  {mentor && (
                    <Stack direction="row" alignItems="center" spacing={1} mt={2}>
                      <Typography variant="caption" color="text.secondary">Mentor:</Typography>
                      <Avatar src={mentor.avatar} sx={{ width: 20, height: 20, fontSize: '0.6rem' }}>
                        {mentor.firstName?.[0]}
                      </Avatar>
                      <Typography variant="caption">{mentor.firstName} {mentor.lastName}</Typography>
                    </Stack>
                  )}
                </Box>
              </Stack>
            </Box>
          </Card>
        );
      })}
    </Stack>
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
          <Button variant="default" size="small" onClick={() => toast.info('Add key role')}>
            <Plus size={16} className="mr-1" /> Add Role
          </Button>
        </Stack>
      </Stack>

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        <Card>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Crown size={20} style={{ color: 'var(--primary)' }} />
              <Box>
                <Typography variant="h5" fontWeight={700}>{stats.totalRoles}</Typography>
                <Typography variant="caption" color="text.secondary">Key Roles</Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
        <Card>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <AlertTriangle size={20} style={{ color: 'var(--destructive)' }} />
              <Box>
                <Typography variant="h5" fontWeight={700} color="error.main">{stats.rolesAtRisk}</Typography>
                <Typography variant="caption" color="text.secondary">Roles at Risk</Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
        <Card>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Zap size={20} style={{ color: 'var(--success)' }} />
              <Box>
                <Typography variant="h5" fontWeight={700} color="success.main">{stats.readyNowTotal}</Typography>
                <Typography variant="caption" color="text.secondary">Ready Now</Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
        <Card>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
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
      {activeView === 'pipeline' ? renderPipelineView() : renderCandidatesView()}
    </Box>
  );
}

export default SuccessionPlanningPanel;
