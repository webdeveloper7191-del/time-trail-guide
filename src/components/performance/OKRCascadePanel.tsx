import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Chip,
  Avatar,
  LinearProgress,
  Collapse,
  IconButton,
  Divider,
  Slider,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui/Button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RowActionsMenu } from './shared/RowActionsMenu';
import { CollapsibleStatsGrid, ScrollableTable } from './shared';
import { 
  Target, 
  Plus, 
  ChevronDown, 
  ChevronRight,
  Building2,
  Users,
  User,
  TrendingUp,
  AlertTriangle,
  Link2,
  BarChart3,
  Check,
  Edit3,
  Clock,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import { 
  Objective, 
  KeyResult,
  OKRLevel,
  OKRStatus,
  okrLevelLabels,
  okrStatusLabels,
} from '@/types/okr';
import { mockObjectives as initialMockObjectives, mockOKRCycles, mockTeams } from '@/data/mockOKRData';
import { mockStaff } from '@/data/mockStaffData';
import { format } from 'date-fns';
import { CreateOKRDrawer } from './CreateOKRDrawer';
import { toast } from 'sonner';

interface OKRCascadePanelProps {
  currentUserId: string;
}

const getLevelIcon = (level: OKRLevel) => {
  switch (level) {
    case 'company': return <Building2 size={16} />;
    case 'team': return <Users size={16} />;
    case 'individual': return <User size={16} />;
  }
};

const getLevelStyle = (level: OKRLevel) => {
  const styles: Record<OKRLevel, { bg: string; color: string; border: string }> = {
    company: { bg: 'rgba(139, 92, 246, 0.12)', color: 'rgb(124, 58, 237)', border: 'rgb(139, 92, 246)' },
    team: { bg: 'rgba(59, 130, 246, 0.12)', color: 'rgb(37, 99, 235)', border: 'rgb(59, 130, 246)' },
    individual: { bg: 'rgba(34, 197, 94, 0.12)', color: 'rgb(22, 163, 74)', border: 'rgb(34, 197, 94)' },
  };
  return styles[level];
};

const getStatusStyle = (status: OKRStatus) => {
  const styles: Record<OKRStatus, { bg: string; color: string }> = {
    draft: { bg: 'rgba(148, 163, 184, 0.12)', color: 'rgb(100, 116, 139)' },
    active: { bg: 'rgba(59, 130, 246, 0.12)', color: 'rgb(37, 99, 235)' },
    at_risk: { bg: 'rgba(239, 68, 68, 0.12)', color: 'rgb(220, 38, 38)' },
    on_track: { bg: 'rgba(34, 197, 94, 0.12)', color: 'rgb(22, 163, 74)' },
    completed: { bg: 'rgba(16, 185, 129, 0.12)', color: 'rgb(5, 150, 105)' },
    cancelled: { bg: 'rgba(148, 163, 184, 0.12)', color: 'rgb(100, 116, 139)' },
  };
  return styles[status];
};

const getProgressColor = (progress: number) => {
  if (progress >= 70) return 'success.main';
  if (progress >= 40) return 'warning.main';
  return 'error.main';
};

export function OKRCascadePanel({ currentUserId }: OKRCascadePanelProps) {
  const [objectives, setObjectives] = useState<Objective[]>(initialMockObjectives);
  const [expandedObjectives, setExpandedObjectives] = useState<Set<string>>(new Set(['obj-company-1']));
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState('all');
  const [editingKR, setEditingKR] = useState<string | null>(null);

  const getStaffName = (id: string) => {
    const staff = mockStaff.find(s => s.id === id);
    return staff ? `${staff.firstName} ${staff.lastName}` : 'Unknown';
  };

  const getTeamName = (id: string) => {
    const team = mockTeams.find(t => t.id === id);
    return team?.name || 'Unknown Team';
  };

  const toggleExpand = (id: string) => {
    setExpandedObjectives(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleViewObjective = (objective: Objective) => {
    setSelectedObjective(objective);
    setShowDetailSheet(true);
  };

  const handleUpdateKRProgress = (objectiveId: string, krId: string, newValue: number) => {
    setObjectives(prev => prev.map(obj => {
      if (obj.id === objectiveId) {
        const updatedKRs = obj.keyResults.map(kr => {
          if (kr.id === krId) {
            const progress = Math.round(((newValue - kr.startValue) / (kr.targetValue - kr.startValue)) * 100);
            return { ...kr, currentValue: newValue, progress: Math.max(0, Math.min(100, progress)) };
          }
          return kr;
        });
        const avgProgress = Math.round(updatedKRs.reduce((sum, kr) => sum + kr.progress, 0) / updatedKRs.length);
        return { ...obj, keyResults: updatedKRs, progress: avgProgress };
      }
      return obj;
    }));
    toast.success('Progress updated');
  };

  const handleCreateOKR = (newOKR: Partial<Objective>) => {
    const objective: Objective = {
      ...newOKR as Objective,
      id: `obj-new-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    };
    setObjectives(prev => [...prev, objective]);
    toast.success('Objective created successfully');
  };

  // Build hierarchy
  const companyObjectives = objectives.filter(o => o.level === 'company');
  const teamObjectives = objectives.filter(o => o.level === 'team');
  const individualObjectives = objectives.filter(o => o.level === 'individual');

  const getChildObjectives = (parentId: string) => {
    return objectives.filter(o => o.parentObjectiveId === parentId);
  };

  // Stats
  const totalObjectives = objectives.length;
  const onTrackCount = objectives.filter(o => o.status === 'on_track' || o.status === 'completed').length;
  const atRiskCount = objectives.filter(o => o.status === 'at_risk').length;
  const avgProgress = Math.round(objectives.reduce((sum, o) => sum + o.progress, 0) / totalObjectives);

  const renderKeyResult = (kr: KeyResult, objectiveId: string, allowEdit: boolean = false) => {
    const progressColor = getProgressColor(kr.progress);
    const isEditing = editingKR === kr.id;
    
    return (
      <Box key={kr.id} sx={{ py: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
          <Typography variant="body2" sx={{ flex: 1, pr: 2 }}>
            {kr.title}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" fontWeight={600}>
              {kr.currentValue}{kr.unit || ''} / {kr.targetValue}{kr.unit || ''}
            </Typography>
            <Chip 
              label={`${kr.progress}%`}
              size="small"
              sx={{ 
                fontSize: 11,
                height: 22,
                bgcolor: kr.progress >= 70 ? 'rgba(34, 197, 94, 0.12)' : kr.progress >= 40 ? 'rgba(251, 191, 36, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                color: kr.progress >= 70 ? 'rgb(22, 163, 74)' : kr.progress >= 40 ? 'rgb(161, 98, 7)' : 'rgb(220, 38, 38)',
              }}
            />
            {allowEdit && (
              <IconButton 
                size="small" 
                onClick={() => setEditingKR(isEditing ? null : kr.id)}
                sx={{ ml: 0.5 }}
              >
                {isEditing ? <Check size={14} /> : <Edit3 size={14} />}
              </IconButton>
            )}
          </Stack>
        </Stack>
        
        {isEditing ? (
          <Box sx={{ px: 1, pt: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 32 }}>
                {kr.startValue}
              </Typography>
              <Slider
                value={kr.currentValue}
                min={kr.startValue}
                max={kr.targetValue}
                onChange={(_, value) => handleUpdateKRProgress(objectiveId, kr.id, value as number)}
                valueLabelDisplay="on"
                size="small"
                sx={{
                  color: progressColor,
                  '& .MuiSlider-thumb': {
                    width: 16,
                    height: 16,
                  },
                  '& .MuiSlider-valueLabel': {
                    fontSize: 11,
                    bgcolor: progressColor,
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 32 }}>
                {kr.targetValue}
              </Typography>
            </Stack>
          </Box>
        ) : (
          <LinearProgress 
            variant="determinate" 
            value={kr.progress}
            sx={{ 
              height: 4, 
              borderRadius: 1,
              bgcolor: 'rgba(0,0,0,0.08)',
              '& .MuiLinearProgress-bar': { bgcolor: progressColor },
            }}
          />
        )}
      </Box>
    );
  };

  const renderObjectiveCard = (objective: Objective, depth: number = 0) => {
    const isExpanded = expandedObjectives.has(objective.id);
    const children = getChildObjectives(objective.id);
    const hasChildren = children.length > 0;
    const levelStyle = getLevelStyle(objective.level);
    const statusStyle = getStatusStyle(objective.status);
    const ownerName = getStaffName(objective.ownerId);

    return (
      <Box key={objective.id}>
        <Card 
          sx={{ 
            p: 0,
            ml: depth * 4,
            mb: 2,
            borderLeft: '4px solid',
            borderLeftColor: levelStyle.border,
            transition: 'all 0.2s ease',
            '&:hover': { boxShadow: 3 },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Stack direction="row" alignItems="flex-start" spacing={2}>
              {hasChildren && (
                <IconButton 
                  size="small" 
                  onClick={() => toggleExpand(objective.id)}
                  sx={{ mt: 0.5 }}
                >
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </IconButton>
              )}
              {!hasChildren && <Box sx={{ width: 32 }} />}
              
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                      <Chip 
                        icon={getLevelIcon(objective.level)}
                        label={okrLevelLabels[objective.level]}
                        size="small"
                        sx={{ 
                          fontSize: 11,
                          height: 24,
                          bgcolor: levelStyle.bg,
                          color: levelStyle.color,
                          '& .MuiChip-icon': { color: 'inherit' },
                        }}
                      />
                      <Chip 
                        label={okrStatusLabels[objective.status]}
                        size="small"
                        sx={{ 
                          fontSize: 11,
                          height: 24,
                          bgcolor: statusStyle.bg,
                          color: statusStyle.color,
                        }}
                      />
                    </Stack>
                    <Typography 
                      variant="subtitle1" 
                      fontWeight={600}
                      sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                      onClick={() => handleViewObjective(objective)}
                    >
                      {objective.title}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 0.5 }}>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Avatar sx={{ width: 20, height: 20, fontSize: 10 }}>
                          {ownerName.charAt(0)}
                        </Avatar>
                        <Typography variant="caption" color="text.secondary">
                          {ownerName}
                        </Typography>
                      </Stack>
                      {objective.teamId && (
                        <Typography variant="caption" color="text.secondary">
                          • {getTeamName(objective.teamId)}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        • {objective.cycle}
                      </Typography>
                    </Stack>
                  </Box>

                  <Stack direction="row" alignItems="flex-start" spacing={1}>
                    <Box sx={{ textAlign: 'right', minWidth: 80 }}>
                      <Typography 
                        variant="h5" 
                        fontWeight={700} 
                        sx={{ color: getProgressColor(objective.progress) }}
                      >
                        {objective.progress}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {objective.keyResults.length} Key Results
                      </Typography>
                    </Box>
                    <RowActionsMenu
                      actions={[
                        {
                          label: 'View Details',
                          icon: <Eye size={14} />,
                          onClick: (e) => { e.stopPropagation(); handleViewObjective(objective); },
                        },
                        {
                          label: 'Edit Objective',
                          icon: <Edit size={14} />,
                          onClick: (e) => { e.stopPropagation(); toast.info('Edit OKR drawer would open'); },
                        },
                        {
                          label: 'Add Key Result',
                          icon: <Plus size={14} />,
                          onClick: (e) => { e.stopPropagation(); toast.info('Add Key Result drawer would open'); },
                        },
                        {
                          label: 'Delete',
                          icon: <Trash2 size={14} />,
                          variant: 'destructive',
                          separator: true,
                          onClick: (e) => { 
                            e.stopPropagation(); 
                            setObjectives(prev => prev.filter(o => o.id !== objective.id));
                            toast.success('Objective deleted');
                          },
                        },
                      ]}
                    />
                  </Stack>
                </Stack>

                {/* Progress Bar */}
                <LinearProgress 
                  variant="determinate" 
                  value={objective.progress}
                  sx={{ 
                    mt: 2,
                    height: 6, 
                    borderRadius: 1,
                    bgcolor: 'rgba(0,0,0,0.08)',
                    '& .MuiLinearProgress-bar': { bgcolor: getProgressColor(objective.progress) },
                  }}
                />

                {/* Key Results Preview */}
                {objective.keyResults.length > 0 && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    {objective.keyResults.slice(0, 2).map(kr => renderKeyResult(kr, objective.id, true))}
                    {objective.keyResults.length > 2 && (
                      <Typography 
                        variant="caption" 
                        color="primary"
                        sx={{ cursor: 'pointer', display: 'block', mt: 1 }}
                        onClick={() => handleViewObjective(objective)}
                      >
                        +{objective.keyResults.length - 2} more key results
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </Stack>
          </Box>

          {/* Alignment indicator */}
          {hasChildren && (
            <Box sx={{ px: 2, pb: 1.5, pt: 0 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Link2 size={12} className="text-muted-foreground" />
                <Typography variant="caption" color="text.secondary">
                  {children.length} aligned objective{children.length > 1 ? 's' : ''}
                </Typography>
              </Stack>
            </Box>
          )}
        </Card>

        {/* Render children */}
        <Collapse in={isExpanded}>
          {children.map(child => renderObjectiveCard(child, depth + 1))}
        </Collapse>
      </Box>
    );
  };

  const renderDetailSheet = () => {
    if (!selectedObjective) return null;

    const levelStyle = getLevelStyle(selectedObjective.level);
    const statusStyle = getStatusStyle(selectedObjective.status);
    const ownerName = getStaffName(selectedObjective.ownerId);
    const parentObjective = selectedObjective.parentObjectiveId 
      ? objectives.find(o => o.id === selectedObjective.parentObjectiveId)
      : null;
    const children = getChildObjectives(selectedObjective.id);

    return (
      <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Objective Details</SheetTitle>
          </SheetHeader>

          <Box sx={{ mt: 3 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Chip 
                icon={getLevelIcon(selectedObjective.level)}
                label={okrLevelLabels[selectedObjective.level]}
                size="small"
                sx={{ 
                  bgcolor: levelStyle.bg,
                  color: levelStyle.color,
                  '& .MuiChip-icon': { color: 'inherit' },
                }}
              />
              <Chip 
                label={okrStatusLabels[selectedObjective.status]}
                size="small"
                sx={{ 
                  bgcolor: statusStyle.bg,
                  color: statusStyle.color,
                }}
              />
            </Stack>

            <Typography variant="h6" fontWeight={600} gutterBottom>
              {selectedObjective.title}
            </Typography>
            {selectedObjective.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {selectedObjective.description}
              </Typography>
            )}

            {/* Progress */}
            <Card sx={{ p: 2, mb: 3, textAlign: 'center' }}>
              <Typography variant="h3" fontWeight={700} sx={{ color: getProgressColor(selectedObjective.progress) }}>
                {selectedObjective.progress}%
              </Typography>
              <Typography variant="body2" color="text.secondary">Overall Progress</Typography>
              <LinearProgress 
                variant="determinate" 
                value={selectedObjective.progress}
                sx={{ 
                  mt: 2,
                  height: 8, 
                  borderRadius: 1,
                  '& .MuiLinearProgress-bar': { bgcolor: getProgressColor(selectedObjective.progress) },
                }}
              />
            </Card>

            {/* Meta */}
            <Stack spacing={1.5} sx={{ mb: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <User size={16} className="text-muted-foreground" />
                <Typography variant="body2">Owner: <strong>{ownerName}</strong></Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Clock size={16} className="text-muted-foreground" />
                <Typography variant="body2">
                  {format(new Date(selectedObjective.startDate), 'MMM d')} - {format(new Date(selectedObjective.endDate), 'MMM d, yyyy')}
                </Typography>
              </Stack>
            </Stack>

            {/* Parent Alignment */}
            {parentObjective && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Aligned To
                </Typography>
                <Card 
                  sx={{ 
                    p: 2, 
                    cursor: 'pointer',
                    borderLeft: '3px solid',
                    borderLeftColor: getLevelStyle(parentObjective.level).border,
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                  onClick={() => setSelectedObjective(parentObjective)}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Link2 size={14} />
                    <Chip 
                      label={okrLevelLabels[parentObjective.level]}
                      size="small"
                      sx={{ 
                        fontSize: 10,
                        height: 20,
                        ...getLevelStyle(parentObjective.level),
                      }}
                    />
                  </Stack>
                  <Typography variant="body2" fontWeight={500} sx={{ mt: 1 }}>
                    {parentObjective.title}
                  </Typography>
                </Card>
              </Box>
            )}

            {/* Key Results */}
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Key Results ({selectedObjective.keyResults.length})
            </Typography>
            <Stack spacing={0} divider={<Divider />}>
              {selectedObjective.keyResults.map(kr => renderKeyResult(kr, selectedObjective.id, true))}
            </Stack>

            {/* Child Objectives */}
            {children.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Aligned Objectives ({children.length})
                </Typography>
                <Stack spacing={1}>
                  {children.map(child => (
                    <Card 
                      key={child.id}
                      sx={{ 
                        p: 2, 
                        cursor: 'pointer',
                        borderLeft: '3px solid',
                        borderLeftColor: getLevelStyle(child.level).border,
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                      onClick={() => setSelectedObjective(child)}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Chip 
                            label={okrLevelLabels[child.level]}
                            size="small"
                            sx={{ 
                              fontSize: 10,
                              height: 20,
                              mb: 0.5,
                              ...getLevelStyle(child.level),
                            }}
                          />
                          <Typography variant="body2" fontWeight={500}>
                            {child.title}
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={600} sx={{ color: getProgressColor(child.progress) }}>
                          {child.progress}%
                        </Typography>
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        </SheetContent>
      </Sheet>
    );
  };

  return (
    <Box>
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'stretch', sm: 'center' }} 
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h6" fontWeight={600} color="text.primary" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
            OKR Alignment
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Company, team, and individual objectives with cascading alignment
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowCreateDrawer(true)}>
          <span className="hidden sm:inline">Create Objective</span>
          <span className="sm:hidden">New OKR</span>
        </Button>
      </Stack>

      {/* Summary Stats */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, 
        gap: { xs: 1.5, md: 2 }, 
        mb: { xs: 3, md: 4 } 
      }}>
        <Card sx={{ p: { xs: 2, md: 3 } }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <Target size={16} className="text-primary" />
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ fontSize: { xs: '0.6rem', md: '0.75rem' } }}>
              Total OKRs
            </Typography>
          </Stack>
          <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>{totalObjectives}</Typography>
        </Card>
        <Card sx={{ p: { xs: 2, md: 3 } }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <TrendingUp size={16} className="text-green-600" />
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ fontSize: { xs: '0.6rem', md: '0.75rem' } }}>
              On Track
            </Typography>
          </Stack>
          <Typography variant="h4" fontWeight={700} color="success.main" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>{onTrackCount}</Typography>
        </Card>
        <Card sx={{ p: { xs: 2, md: 3 } }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <AlertTriangle size={16} className="text-red-600" />
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ fontSize: { xs: '0.6rem', md: '0.75rem' } }}>
              At Risk
            </Typography>
          </Stack>
          <Typography variant="h4" fontWeight={700} color="error.main" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>{atRiskCount}</Typography>
        </Card>
        <Card sx={{ p: { xs: 2, md: 3 }, display: { xs: 'none', sm: 'block' } }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <BarChart3 size={16} className="text-blue-600" />
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ fontSize: { xs: '0.6rem', md: '0.75rem' } }}>
              Avg Progress
            </Typography>
          </Stack>
          <Typography variant="h4" fontWeight={700} color="primary.main" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>{avgProgress}%</Typography>
        </Card>
      </Box>

      <Tabs defaultValue="hierarchy" className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="mb-4 whitespace-nowrap">
            <TabsTrigger value="hierarchy" className="text-xs sm:text-sm">Hierarchy</TabsTrigger>
            <TabsTrigger value="company" className="text-xs sm:text-sm">Company ({companyObjectives.length})</TabsTrigger>
            <TabsTrigger value="team" className="text-xs sm:text-sm">Team ({teamObjectives.length})</TabsTrigger>
            <TabsTrigger value="individual" className="text-xs sm:text-sm">Individual ({individualObjectives.length})</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="hierarchy">
          {companyObjectives.map(obj => renderObjectiveCard(obj, 0))}
        </TabsContent>

        <TabsContent value="company">
          {companyObjectives.map(obj => renderObjectiveCard(obj, 0))}
        </TabsContent>

        <TabsContent value="team">
          {teamObjectives.map(obj => renderObjectiveCard(obj, 0))}
        </TabsContent>

        <TabsContent value="individual">
          {individualObjectives.map(obj => renderObjectiveCard(obj, 0))}
        </TabsContent>
      </Tabs>

      {renderDetailSheet()}
      
      <CreateOKRDrawer
        open={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        onSave={handleCreateOKR}
      />
    </Box>
  );
}
