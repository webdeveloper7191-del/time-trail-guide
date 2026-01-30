import React, { useState, useEffect } from 'react';
import {
  Box,
  Stack,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Avatar,
  Chip,
} from '@mui/material';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/mui/Button';
import { Edit, Crown, Plus, X } from 'lucide-react';
import { StaffMember } from '@/types/staff';
import { KeyRole, SuccessionCandidate, readinessLabels, CompetencyGap, DevelopmentAction } from '@/types/compensation';
import { toast } from 'sonner';

interface EditCandidateDrawerProps {
  open: boolean;
  onClose: () => void;
  candidate: SuccessionCandidate | null;
  staff: StaffMember[];
  keyRoles: KeyRole[];
  onSave: (candidate: SuccessionCandidate) => void;
}

export function EditCandidateDrawer({ 
  open, 
  onClose, 
  candidate,
  staff, 
  keyRoles,
  onSave 
}: EditCandidateDrawerProps) {
  const [readiness, setReadiness] = useState<SuccessionCandidate['readiness']>('ready_1_2_years');
  const [performanceScore, setPerformanceScore] = useState(75);
  const [potentialScore, setPotentialScore] = useState(75);
  const [experienceScore, setExperienceScore] = useState(70);
  const [mentorId, setMentorId] = useState('');
  const [notes, setNotes] = useState('');
  const [newGapCompetency, setNewGapCompetency] = useState('');
  const [competencyGaps, setCompetencyGaps] = useState<CompetencyGap[]>([]);
  const [newActionTitle, setNewActionTitle] = useState('');
  const [developmentActions, setDevelopmentActions] = useState<DevelopmentAction[]>([]);

  useEffect(() => {
    if (candidate) {
      setReadiness(candidate.readiness);
      setPerformanceScore(candidate.performanceScore);
      setPotentialScore(candidate.potentialScore);
      setExperienceScore(candidate.experienceScore);
      setMentorId(candidate.mentorId || '');
      setNotes(candidate.notes || '');
      setCompetencyGaps(candidate.competencyGaps || []);
      setDevelopmentActions(candidate.developmentActions || []);
    }
  }, [candidate]);

  const handleAddGap = () => {
    if (newGapCompetency.trim()) {
      const currentLevel = 2;
      const requiredLevel = 4;
      setCompetencyGaps([
        ...competencyGaps,
        {
          id: `gap-${Date.now()}`,
          competency: newGapCompetency.trim(),
          currentLevel,
          requiredLevel,
          gap: requiredLevel - currentLevel,
          developmentPriority: 'medium',
        }
      ]);
      setNewGapCompetency('');
    }
  };

  const handleRemoveGap = (gapId: string) => {
    setCompetencyGaps(competencyGaps.filter(g => g.id !== gapId));
  };

  const handleAddAction = () => {
    if (newActionTitle.trim()) {
      setDevelopmentActions([
        ...developmentActions,
        {
          id: `action-${Date.now()}`,
          title: newActionTitle.trim(),
          type: 'training',
          description: 'Development action to address competency gap',
          status: 'planned',
          targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }
      ]);
      setNewActionTitle('');
    }
  };

  const handleRemoveAction = (actionId: string) => {
    setDevelopmentActions(developmentActions.filter(a => a.id !== actionId));
  };

  const handleSave = () => {
    if (!candidate) return;

    const overallScore = Math.round((performanceScore * 0.4) + (potentialScore * 0.35) + (experienceScore * 0.25));

    onSave({
      ...candidate,
      readiness,
      performanceScore,
      potentialScore,
      experienceScore,
      overallScore,
      mentorId: mentorId || undefined,
      notes: notes.trim() || undefined,
      competencyGaps,
      developmentActions,
      lastAssessedAt: new Date().toISOString(),
    });

    onClose();
  };

  if (!candidate) return null;

  const staffMember = staff.find(s => s.id === candidate.staffId);
  const keyRole = keyRoles.find(r => r.id === candidate.keyRoleId);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Edit size={20} className="text-primary" />
            Edit Candidate
          </SheetTitle>
          <SheetDescription>
            Update candidate scores and development plan
          </SheetDescription>
        </SheetHeader>

        <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Candidate Info */}
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar src={staffMember?.avatar} sx={{ width: 48, height: 48 }}>
                {staffMember?.firstName?.[0]}{staffMember?.lastName?.[0]}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {staffMember?.firstName} {staffMember?.lastName}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Crown size={14} className="text-primary" />
                  <Typography variant="caption" color="text.secondary">
                    Successor for: {keyRole?.title}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Box>

          <FormControl fullWidth>
            <InputLabel>Readiness Level</InputLabel>
            <Select
              value={readiness}
              label="Readiness Level"
              onChange={(e) => setReadiness(e.target.value as any)}
            >
              {Object.entries(readinessLabels).map(([key, label]) => (
                <MenuItem key={key} value={key}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>
              Candidate Scores
            </Typography>
            <Stack spacing={3}>
              <Box>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Performance Score (40% weight)</Typography>
                  <Typography variant="body2" fontWeight={600}>{performanceScore}%</Typography>
                </Stack>
                <Slider
                  value={performanceScore}
                  onChange={(_, v) => setPerformanceScore(v as number)}
                  min={0}
                  max={100}
                  valueLabelDisplay="auto"
                />
              </Box>
              <Box>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Potential Score (35% weight)</Typography>
                  <Typography variant="body2" fontWeight={600}>{potentialScore}%</Typography>
                </Stack>
                <Slider
                  value={potentialScore}
                  onChange={(_, v) => setPotentialScore(v as number)}
                  min={0}
                  max={100}
                  valueLabelDisplay="auto"
                />
              </Box>
              <Box>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Experience Score (25% weight)</Typography>
                  <Typography variant="body2" fontWeight={600}>{experienceScore}%</Typography>
                </Stack>
                <Slider
                  value={experienceScore}
                  onChange={(_, v) => setExperienceScore(v as number)}
                  min={0}
                  max={100}
                  valueLabelDisplay="auto"
                />
              </Box>
              <Box sx={{ p: 1.5, bgcolor: 'primary.50', borderRadius: 1 }}>
                <Typography variant="body2" fontWeight={600} color="primary.main">
                  Overall Score: {Math.round((performanceScore * 0.4) + (potentialScore * 0.35) + (experienceScore * 0.25))}%
                </Typography>
              </Box>
            </Stack>
          </Box>

          <FormControl fullWidth>
            <InputLabel>Assigned Mentor</InputLabel>
            <Select
              value={mentorId}
              label="Assigned Mentor"
              onChange={(e) => setMentorId(e.target.value)}
            >
              <MenuItem value="">No mentor assigned</MenuItem>
              {staff.filter(s => s.id !== candidate.staffId).map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} - {s.position}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Competency Gaps */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              Competency Gaps
            </Typography>
            <Stack direction="row" spacing={1} mb={1}>
              <TextField
                size="small"
                value={newGapCompetency}
                onChange={(e) => setNewGapCompetency(e.target.value)}
                placeholder="Add competency gap"
                fullWidth
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddGap())}
              />
              <Button variant="outline" size="small" onClick={handleAddGap}>
                <Plus size={16} />
              </Button>
            </Stack>
            <Stack spacing={1}>
              {competencyGaps.map((gap) => (
                <Stack key={gap.id} direction="row" alignItems="center" justifyContent="space-between" 
                  sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>{gap.competency}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Level {gap.currentLevel} → {gap.requiredLevel}
                    </Typography>
                  </Box>
                  <Button variant="ghost" size="small" onClick={() => handleRemoveGap(gap.id)}>
                    <X size={14} />
                  </Button>
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* Development Actions */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              Development Actions
            </Typography>
            <Stack direction="row" spacing={1} mb={1}>
              <TextField
                size="small"
                value={newActionTitle}
                onChange={(e) => setNewActionTitle(e.target.value)}
                placeholder="Add development action"
                fullWidth
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAction())}
              />
              <Button variant="outline" size="small" onClick={handleAddAction}>
                <Plus size={16} />
              </Button>
            </Stack>
            <Stack spacing={1}>
              {developmentActions.map((action) => (
                <Stack key={action.id} direction="row" alignItems="center" justifyContent="space-between"
                  sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>{action.title}</Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip label={action.type.replace('_', ' ')} size="small" sx={{ fontSize: '0.65rem', height: 18 }} />
                      <Chip 
                        label={action.status} 
                        size="small" 
                        color={action.status === 'completed' ? 'success' : action.status === 'in_progress' ? 'warning' : 'default'}
                        sx={{ fontSize: '0.65rem', height: 18 }} 
                      />
                    </Stack>
                  </Box>
                  <Button variant="ghost" size="small" onClick={() => handleRemoveAction(action.id)}>
                    <X size={14} />
                  </Button>
                </Stack>
              ))}
            </Stack>
          </Box>

          <TextField
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={3}
            fullWidth
          />
        </Box>

        <SheetFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="default" onClick={handleSave}>Save Changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default EditCandidateDrawer;
