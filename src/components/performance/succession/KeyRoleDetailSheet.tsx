import React from 'react';
import {
  Box,
  Stack,
  Typography,
  Avatar,
  Chip,
  Divider,
  AvatarGroup,
} from '@mui/material';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/mui/Button';
import { Progress } from '@/components/ui/progress';
import {
  Crown,
  Users,
  AlertTriangle,
  Calendar,
  Edit,
  UserPlus,
  TrendingUp,
  Target,
  Clock,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { StaffMember } from '@/types/staff';
import { KeyRole, SuccessionCandidate, readinessLabels, readinessColors, successionRiskLabels } from '@/types/compensation';

interface KeyRoleDetailSheetProps {
  open: boolean;
  onClose: () => void;
  role: KeyRole | null;
  candidates: SuccessionCandidate[];
  staff: StaffMember[];
  onEdit: () => void;
  onAddCandidate: () => void;
  onEditCandidate: (candidate: SuccessionCandidate) => void;
  onDeleteRole: () => void;
}

export function KeyRoleDetailSheet({ 
  open, 
  onClose, 
  role,
  candidates,
  staff,
  onEdit,
  onAddCandidate,
  onEditCandidate,
  onDeleteRole,
}: KeyRoleDetailSheetProps) {
  if (!role) return null;

  const getStaffMember = (staffId: string) => staff.find(s => s.id === staffId);
  const currentHolder = role.currentHolderId ? getStaffMember(role.currentHolderId) : null;
  
  const readyNowCount = candidates.filter(c => c.readiness === 'ready_now').length;
  const benchStrength = candidates.length > 0 ? (readyNowCount / candidates.length) * 100 : 0;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'success';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Crown size={20} className="text-primary" />
            {role.title}
          </SheetTitle>
          <SheetDescription>
            {role.department} • {role.criticality} role
          </SheetDescription>
        </SheetHeader>

        <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Actions */}
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button variant="outline" size="small" onClick={onEdit}>
              <Edit size={14} className="mr-1" /> Edit Role
            </Button>
            <Button variant="outline" size="small" onClick={onAddCandidate}>
              <UserPlus size={14} className="mr-1" /> Add Candidate
            </Button>
            <Button variant="destructive" size="small" onClick={onDeleteRole}>
              <Trash2 size={14} className="mr-1" /> Delete Role
            </Button>
          </Stack>

          {/* Status Cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={700}>{candidates.length}</Typography>
              <Typography variant="caption" color="text.secondary">Candidates</Typography>
            </Box>
            <Box sx={{ p: 2, bgcolor: 'success.50', borderRadius: 1, textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={700} color="success.main">{readyNowCount}</Typography>
              <Typography variant="caption" color="text.secondary">Ready Now</Typography>
            </Box>
            <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 1, textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={700} color="info.main">{Math.round(benchStrength)}%</Typography>
              <Typography variant="caption" color="text.secondary">Bench Strength</Typography>
            </Box>
          </Box>

          {/* Risk & Details */}
          <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle2" fontWeight={600}>Vacancy Risk</Typography>
              <Chip 
                label={successionRiskLabels[role.vacancyRisk]} 
                size="small" 
                color={getRiskColor(role.vacancyRisk) as any}
              />
            </Stack>
            {role.impactOfVacancy && (
              <Typography variant="body2" color="text.secondary">
                Impact: {role.impactOfVacancy}
              </Typography>
            )}
          </Box>

          {/* Current Holder */}
          {currentHolder && (
            <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
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

          {/* Required Competencies */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>Required Competencies</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
              {role.requiredCompetencies.map((comp, i) => (
                <Chip key={i} label={comp} size="small" variant="outlined" />
              ))}
            </Stack>
          </Box>

          <Divider />

          {/* Candidates List */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>
              Succession Candidates ({candidates.length})
            </Typography>
            
            {candidates.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 1, border: 1, borderStyle: 'dashed', borderColor: 'grey.300' }}>
                <Users size={32} style={{ color: 'var(--muted-foreground)', margin: '0 auto 8px' }} />
                <Typography variant="body2" color="text.secondary">No candidates identified yet</Typography>
                <Button variant="outline" size="small" onClick={onAddCandidate} sx={{ mt: 1 }}>
                  <UserPlus size={14} className="mr-1" /> Add First Candidate
                </Button>
              </Box>
            ) : (
              <Stack spacing={2}>
                {candidates.map(candidate => {
                  const staffMember = getStaffMember(candidate.staffId);
                  const mentor = candidate.mentorId ? getStaffMember(candidate.mentorId) : null;

                  return (
                    <Box 
                      key={candidate.id} 
                      sx={{ 
                        p: 2, 
                        border: 1, 
                        borderColor: 'divider', 
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'grey.50' },
                      }}
                      onClick={() => onEditCandidate(candidate)}
                    >
                      <Stack direction="row" alignItems="flex-start" spacing={2}>
                        <Avatar src={staffMember?.avatar} sx={{ width: 48, height: 48 }}>
                          {staffMember?.firstName?.[0]}{staffMember?.lastName?.[0]}
                        </Avatar>
                        <Box flex={1}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                              <Typography variant="subtitle2" fontWeight={600}>
                                {staffMember?.firstName} {staffMember?.lastName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {staffMember?.position}
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="h6" fontWeight={700} color="primary.main">
                                {candidate.overallScore}%
                              </Typography>
                              <Chip 
                                label={readinessLabels[candidate.readiness]}
                                size="small"
                                sx={{ 
                                  bgcolor: readinessColors[candidate.readiness],
                                  color: 'white',
                                  fontSize: '0.65rem',
                                }}
                              />
                            </Stack>
                          </Stack>

                          {/* Score Breakdown */}
                          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mt: 1.5 }}>
                            <Box>
                              <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                <Typography variant="caption" color="text.secondary">Performance</Typography>
                                <Typography variant="caption" fontWeight={600}>{candidate.performanceScore}%</Typography>
                              </Stack>
                              <Progress value={candidate.performanceScore} className="h-1" />
                            </Box>
                            <Box>
                              <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                <Typography variant="caption" color="text.secondary">Potential</Typography>
                                <Typography variant="caption" fontWeight={600}>{candidate.potentialScore}%</Typography>
                              </Stack>
                              <Progress value={candidate.potentialScore} className="h-1" />
                            </Box>
                            <Box>
                              <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                <Typography variant="caption" color="text.secondary">Experience</Typography>
                                <Typography variant="caption" fontWeight={600}>{candidate.experienceScore}%</Typography>
                              </Stack>
                              <Progress value={candidate.experienceScore} className="h-1" />
                            </Box>
                          </Box>

                          {/* Gaps & Actions Summary */}
                          <Stack direction="row" spacing={2} mt={1.5}>
                            {candidate.competencyGaps.length > 0 && (
                              <Typography variant="caption" color="warning.main">
                                <AlertTriangle size={12} style={{ display: 'inline', marginRight: 4 }} />
                                {candidate.competencyGaps.length} competency gaps
                              </Typography>
                            )}
                            {candidate.developmentActions.length > 0 && (
                              <Typography variant="caption" color="info.main">
                                <Target size={12} style={{ display: 'inline', marginRight: 4 }} />
                                {candidate.developmentActions.filter(a => a.status === 'completed').length}/{candidate.developmentActions.length} actions complete
                              </Typography>
                            )}
                            {mentor && (
                              <Typography variant="caption" color="text.secondary">
                                Mentor: {mentor.firstName} {mentor.lastName}
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>
        </Box>
      </SheetContent>
    </Sheet>
  );
}

export default KeyRoleDetailSheet;
