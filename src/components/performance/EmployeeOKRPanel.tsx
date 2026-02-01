import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { 
  Target, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Building2,
  Users,
  User,
  Link2,
  Pencil,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockObjectives } from '@/data/mockOKRData';
import type { Objective, KeyResult, OKRStatus } from '@/types/okr';
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
import { Box, Typography, Paper, Chip, IconButton, Collapse, Avatar, Stack, Tooltip } from '@mui/material';

interface EmployeeOKRPanelProps {
  currentUserId: string;
}

const getStatusType = (status: OKRStatus) => {
  switch (status) {
    case 'on_track': return 'on_track' as const;
    case 'at_risk': return 'at_risk' as const;
    case 'completed': return 'completed' as const;
    case 'active': return 'active' as const;
    default: return 'draft' as const;
  }
};

const getLevelIcon = (level: string) => {
  switch (level) {
    case 'company': return Building2;
    case 'team': return Users;
    case 'individual': return User;
    default: return Target;
  }
};

const getLevelColor = (level: string) => {
  switch (level) {
    case 'company': return { bg: '#f3e8ff', text: '#7c3aed', border: '#c4b5fd' };
    case 'team': return { bg: '#dbeafe', text: '#2563eb', border: '#93c5fd' };
    case 'individual': return { bg: '#dcfce7', text: '#16a34a', border: '#86efac' };
    default: return { bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1' };
  }
};

export function EmployeeOKRPanel({ currentUserId }: EmployeeOKRPanelProps) {
  const [expandedObjectives, setExpandedObjectives] = useState<string[]>([]);
  const [objectives, setObjectives] = useState(mockObjectives);
  const [editingKR, setEditingKR] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const myObjectives = objectives.filter(o => o.level === 'individual');
  const teamObjectives = objectives.filter(o => o.level === 'team');
  const companyObjectives = objectives.filter(o => o.level === 'company');

  const stats = {
    total: myObjectives.length,
    onTrack: myObjectives.filter(o => o.status === 'on_track' || o.status === 'completed').length,
    atRisk: myObjectives.filter(o => o.status === 'at_risk').length,
    avgProgress: myObjectives.length > 0 
      ? Math.round(myObjectives.reduce((sum, o) => sum + o.progress, 0) / myObjectives.length)
      : 0,
  };

  const toggleExpand = (id: string) => {
    setExpandedObjectives(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const updateKeyResult = (objectiveId: string, krId: string, newValue: number) => {
    setObjectives(prev => prev.map(obj => {
      if (obj.id !== objectiveId) return obj;
      
      const updatedKRs = obj.keyResults.map(kr => {
        if (kr.id !== krId) return kr;
        const progress = Math.round((newValue / kr.targetValue) * 100);
        return { ...kr, currentValue: newValue, progress: Math.min(progress, 100) };
      });
      
      const avgProgress = Math.round(
        updatedKRs.reduce((sum, kr) => sum + kr.progress, 0) / updatedKRs.length
      );
      
      const newStatus: OKRStatus = avgProgress >= 100 ? 'completed' : avgProgress >= 70 ? 'on_track' : 'at_risk';
      
      return { 
        ...obj, 
        keyResults: updatedKRs, 
        progress: avgProgress,
        status: newStatus,
      };
    }));
    setEditingKR(null);
  };

  const renderObjectiveRow = (objective: Objective) => {
    const isExpanded = expandedObjectives.includes(objective.id);
    const LevelIcon = getLevelIcon(objective.level);
    const levelColor = getLevelColor(objective.level);
    const parentObjective = objective.parentObjectiveId 
      ? objectives.find(o => o.id === objective.parentObjectiveId)
      : null;
    const isHovered = hoveredRow === objective.id;

    return (
      <React.Fragment key={objective.id}>
        <TableRow 
          className="group cursor-pointer hover:bg-muted/50 transition-colors"
          onMouseEnter={() => setHoveredRow(objective.id)}
          onMouseLeave={() => setHoveredRow(null)}
          onClick={() => toggleExpand(objective.id)}
          style={{
            borderLeft: objective.status === 'at_risk' ? '3px solid #ef4444' : 
                        objective.status === 'completed' ? '3px solid #22c55e' : 'none'
          }}
        >
          <TableCell className="w-8">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </TableCell>
          <TableCell>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box 
                sx={{ 
                  p: 0.75, 
                  borderRadius: 1, 
                  bgcolor: levelColor.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <LevelIcon className="h-4 w-4" style={{ color: levelColor.text }} />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={500} sx={{ color: 'text.primary' }}>
                  {objective.title}
                </Typography>
                {objective.description && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    {objective.description.length > 60 
                      ? `${objective.description.substring(0, 60)}...` 
                      : objective.description}
                  </Typography>
                )}
              </Box>
            </Box>
          </TableCell>
          <TableCell>
            <Chip
              label={objective.level.charAt(0).toUpperCase() + objective.level.slice(1)}
              size="small"
              sx={{
                fontSize: '0.7rem',
                height: 22,
                bgcolor: levelColor.bg,
                color: levelColor.text,
                border: `1px solid ${levelColor.border}`,
              }}
            />
          </TableCell>
          <TableCell>
            <StatusBadge status={getStatusType(objective.status)} size="small" />
          </TableCell>
          <TableCell>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 140 }}>
              <Box sx={{ flex: 1 }}>
                <SemanticProgressBar 
                  value={objective.progress} 
                  status={objective.status === 'at_risk' ? 'at_risk' : objective.progress >= 100 ? 'completed' : 'on_track'}
                  size="sm"
                  showPercentage={false}
                />
              </Box>
              <Typography variant="body2" fontWeight={600} sx={{ 
                color: objective.progress >= 70 ? 'success.main' : 
                       objective.progress >= 40 ? 'warning.main' : 'error.main',
                minWidth: 36,
                textAlign: 'right'
              }}>
                {objective.progress}%
              </Typography>
            </Box>
          </TableCell>
          <TableCell>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {objective.keyResults.length} KRs
            </Typography>
          </TableCell>
          <TableCell>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {objective.cycle}
            </Typography>
          </TableCell>
          <TableCell>
            <Box 
              sx={{ 
                display: 'flex', 
                gap: 0.5, 
                opacity: isHovered ? 1 : 0,
                transition: 'opacity 0.15s'
              }}
            >
              <Tooltip title="Edit">
                <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                  <Pencil className="h-3.5 w-3.5" />
                </IconButton>
              </Tooltip>
              <Tooltip title="More">
                <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </IconButton>
              </Tooltip>
            </Box>
          </TableCell>
        </TableRow>

        {/* Expanded Key Results */}
        {isExpanded && (
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableCell colSpan={8} className="p-0">
              <Collapse in={isExpanded}>
                <Box sx={{ p: 2, pl: 6 }}>
                  {parentObjective && (
                    <Box 
                      sx={{ 
                        mb: 2, 
                        p: 1.5, 
                        borderRadius: 1, 
                        bgcolor: '#f3e8ff', 
                        border: '1px solid #c4b5fd',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <Link2 className="h-4 w-4" style={{ color: '#7c3aed' }} />
                      <Typography variant="caption" sx={{ color: '#7c3aed' }}>
                        Aligned to: <strong>{parentObjective.title}</strong>
                      </Typography>
                    </Box>
                  )}
                  
                  <Stack spacing={1.5}>
                    {objective.keyResults.map((kr) => (
                      <Paper 
                        key={kr.id} 
                        variant="outlined" 
                        sx={{ 
                          p: 2, 
                          bgcolor: 'background.paper',
                          '&:hover': { boxShadow: 1 }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                          <Typography variant="body2" fontWeight={500}>
                            {kr.title}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {kr.currentValue}{kr.unit} / {kr.targetValue}{kr.unit}
                            </Typography>
                            <Chip
                              label={`${kr.progress}%`}
                              size="small"
                              sx={{
                                fontSize: '0.7rem',
                                height: 20,
                                bgcolor: kr.progress >= 70 ? '#dcfce7' : kr.progress >= 40 ? '#fef3c7' : '#fee2e2',
                                color: kr.progress >= 70 ? '#16a34a' : kr.progress >= 40 ? '#d97706' : '#dc2626',
                              }}
                            />
                            <IconButton 
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingKR(editingKR === kr.id ? null : kr.id);
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </IconButton>
                          </Box>
                        </Box>
                        
                        <SemanticProgressBar 
                          value={kr.progress} 
                          status={kr.progress >= 100 ? 'completed' : kr.progress >= 70 ? 'on_track' : 'at_risk'}
                          size="sm"
                          showPercentage={false}
                        />

                        {editingKR === kr.id && (
                          <Box 
                            sx={{ 
                              mt: 2, 
                              p: 2, 
                              borderRadius: 1, 
                              bgcolor: '#dbeafe', 
                              border: '1px solid #93c5fd' 
                            }}
                          >
                            <Typography variant="caption" sx={{ color: '#2563eb', mb: 1, display: 'block' }}>
                              Update progress:
                            </Typography>
                            <Slider
                              value={[kr.currentValue]}
                              min={kr.startValue}
                              max={kr.targetValue}
                              step={1}
                              onValueChange={(val) => updateKeyResult(objective.id, kr.id, val[0])}
                              className="mb-2"
                            />
                            <Typography variant="caption" sx={{ color: '#2563eb', textAlign: 'center', display: 'block', fontWeight: 500 }}>
                              {kr.currentValue} / {kr.targetValue} {kr.unit}
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              </Collapse>
            </TableCell>
          </TableRow>
        )}
      </React.Fragment>
    );
  };

  const renderObjectivesTable = (objectivesList: Objective[], emptyIcon: React.ReactNode, emptyTitle: string, emptyDescription: string) => {
    if (objectivesList.length === 0) {
      return (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderStyle: 'dashed' }}>
          {emptyIcon}
          <Typography variant="body1" fontWeight={500} sx={{ mt: 2 }}>
            {emptyTitle}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {emptyDescription}
          </Typography>
        </Paper>
      );
    }

    return (
      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-8"></TableHead>
              <TableHead>Objective</TableHead>
              <TableHead className="w-24">Level</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-44">Progress</TableHead>
              <TableHead className="w-20">KRs</TableHead>
              <TableHead className="w-24">Cycle</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {objectivesList.map(renderObjectiveRow)}
          </TableBody>
        </Table>
      </Paper>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Stats Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f3e8ff', borderColor: '#c4b5fd' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>My OKRs</Typography>
              <Typography variant="h5" fontWeight={700} sx={{ color: '#7c3aed' }}>{stats.total}</Typography>
            </Box>
            <Target className="h-8 w-8 opacity-50" style={{ color: '#7c3aed' }} />
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#dcfce7', borderColor: '#86efac' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>On Track</Typography>
              <Typography variant="h5" fontWeight={700} sx={{ color: '#16a34a' }}>{stats.onTrack}</Typography>
            </Box>
            <TrendingUp className="h-8 w-8 opacity-50" style={{ color: '#16a34a' }} />
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fee2e2', borderColor: '#fca5a5' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>At Risk</Typography>
              <Typography variant="h5" fontWeight={700} sx={{ color: '#dc2626' }}>{stats.atRisk}</Typography>
            </Box>
            <AlertTriangle className="h-8 w-8 opacity-50" style={{ color: '#dc2626' }} />
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#dbeafe', borderColor: '#93c5fd' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>Avg Progress</Typography>
              <Typography variant="h5" fontWeight={700} sx={{ color: '#2563eb' }}>{stats.avgProgress}%</Typography>
            </Box>
            <CheckCircle2 className="h-8 w-8 opacity-50" style={{ color: '#2563eb' }} />
          </Box>
        </Paper>
      </Box>

      {/* OKR Tabs */}
      <Tabs defaultValue="my-okrs">
        <TabsList>
          <TabsTrigger value="my-okrs" className="gap-2">
            <User className="h-4 w-4" /> My OKRs ({myObjectives.length})
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" /> Team ({teamObjectives.length})
          </TabsTrigger>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="h-4 w-4" /> Company ({companyObjectives.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-okrs" className="mt-4">
          {renderObjectivesTable(
            myObjectives,
            <Target className="h-12 w-12 text-muted-foreground/50 mx-auto" />,
            "No OKRs assigned yet",
            "Your personal objectives will appear here once created"
          )}
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          {renderObjectivesTable(
            teamObjectives,
            <Users className="h-12 w-12 text-muted-foreground/50 mx-auto" />,
            "No team OKRs",
            "Team objectives will appear here"
          )}
        </TabsContent>

        <TabsContent value="company" className="mt-4">
          {renderObjectivesTable(
            companyObjectives,
            <Building2 className="h-12 w-12 text-muted-foreground/50 mx-auto" />,
            "No company OKRs",
            "Company-wide objectives will appear here"
          )}
        </TabsContent>
      </Tabs>
    </Box>
  );
}
