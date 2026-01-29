import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Chip,
  Avatar,
  Tooltip,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui/Button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { 
  Grid3X3,
  TrendingUp,
  AlertTriangle,
  User,
  Target,
  Award,
  ChevronRight,
  Info,
  Plus,
  Edit3,
} from 'lucide-react';
import { 
  TalentAssessment, 
  nineBoxPositions,
  PerformanceLevel,
  PotentialLevel,
} from '@/types/advancedPerformance';
import { mockTalentAssessments as initialMockAssessments } from '@/data/mockAdvancedPerformanceData';
import { mockStaff } from '@/data/mockStaffData';
import { TalentAssessmentDrawer } from './TalentAssessmentDrawer';
import { toast } from 'sonner';

interface NineBoxTalentGridProps {
  assessments?: TalentAssessment[];
  onSelectStaff?: (staffId: string) => void;
}

const getBoxColor = (performance: PerformanceLevel, potential: PotentialLevel) => {
  const position = nineBoxPositions.find(
    p => p.performance === performance && p.potential === potential
  );
  
  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    emerald: { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgb(16, 185, 129)', text: 'rgb(6, 95, 70)' },
    lime: { bg: 'rgba(132, 204, 22, 0.15)', border: 'rgb(132, 204, 22)', text: 'rgb(63, 98, 18)' },
    amber: { bg: 'rgba(251, 191, 36, 0.15)', border: 'rgb(251, 191, 36)', text: 'rgb(161, 98, 7)' },
    cyan: { bg: 'rgba(6, 182, 212, 0.15)', border: 'rgb(6, 182, 212)', text: 'rgb(14, 116, 144)' },
    blue: { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgb(59, 130, 246)', text: 'rgb(29, 78, 216)' },
    orange: { bg: 'rgba(249, 115, 22, 0.15)', border: 'rgb(249, 115, 22)', text: 'rgb(154, 52, 18)' },
    violet: { bg: 'rgba(139, 92, 246, 0.15)', border: 'rgb(139, 92, 246)', text: 'rgb(91, 33, 182)' },
    slate: { bg: 'rgba(100, 116, 139, 0.15)', border: 'rgb(100, 116, 139)', text: 'rgb(51, 65, 85)' },
    red: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgb(239, 68, 68)', text: 'rgb(185, 28, 28)' },
  };

  return colorMap[position?.color || 'slate'];
};

const getFlightRiskStyle = (risk: string) => {
  const styles: Record<string, { bg: string; color: string }> = {
    low: { bg: 'rgba(34, 197, 94, 0.12)', color: 'rgb(22, 163, 74)' },
    medium: { bg: 'rgba(251, 191, 36, 0.12)', color: 'rgb(161, 98, 7)' },
    high: { bg: 'rgba(239, 68, 68, 0.12)', color: 'rgb(220, 38, 38)' },
  };
  return styles[risk] || styles.low;
};

export function NineBoxTalentGrid({ assessments: initialAssessments, onSelectStaff }: NineBoxTalentGridProps) {
  const [assessments, setAssessments] = useState(initialAssessments || initialMockAssessments);
  const [selectedAssessment, setSelectedAssessment] = useState<TalentAssessment | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showAssessmentDrawer, setShowAssessmentDrawer] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<TalentAssessment | null>(null);

  const getStaffInfo = (id: string) => {
    return mockStaff.find(s => s.id === id);
  };

  const gridData = useMemo(() => {
    const grid: Record<string, TalentAssessment[]> = {};
    
    const levels: PerformanceLevel[] = ['low', 'medium', 'high'];
    const potentials: PotentialLevel[] = ['high', 'medium', 'low'];

    potentials.forEach(potential => {
      levels.forEach(performance => {
        const key = `${performance}-${potential}`;
        grid[key] = assessments.filter(
          a => a.performanceLevel === performance && a.potentialLevel === potential
        );
      });
    });

    return grid;
  }, [assessments]);

  const getBoxPosition = (performance: PerformanceLevel, potential: PotentialLevel) => {
    return nineBoxPositions.find(
      p => p.performance === performance && p.potential === potential
    );
  };

  const handleSelectAssessment = (assessment: TalentAssessment) => {
    setSelectedAssessment(assessment);
    setShowDetailSheet(true);
  };

  const handleSaveAssessment = (newAssessment: Partial<TalentAssessment>) => {
    if (editingAssessment) {
      setAssessments(prev => prev.map(a => 
        a.id === editingAssessment.id ? { ...a, ...newAssessment } as TalentAssessment : a
      ));
      toast.success('Assessment updated');
    } else {
      const completeAssessment: TalentAssessment = {
        ...newAssessment as TalentAssessment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setAssessments(prev => [...prev, completeAssessment]);
      toast.success('Assessment created');
    }
    setEditingAssessment(null);
  };

  const handleEditAssessment = (assessment: TalentAssessment) => {
    setEditingAssessment(assessment);
    setShowDetailSheet(false);
    setShowAssessmentDrawer(true);
  };

  const renderGridCell = (performance: PerformanceLevel, potential: PotentialLevel) => {
    const key = `${performance}-${potential}`;
    const cellAssessments = gridData[key] || [];
    const position = getBoxPosition(performance, potential);
    const colors = getBoxColor(performance, potential);

    return (
      <Box
        key={key}
        sx={{
          p: 2,
          minHeight: 140,
          bgcolor: colors.bg,
          border: '2px solid',
          borderColor: colors.border,
          borderRadius: 2,
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: 2,
          }
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
          <Typography 
            variant="caption" 
            fontWeight={700} 
            sx={{ color: colors.text, textTransform: 'uppercase', letterSpacing: 0.5 }}
          >
            {position?.label}
          </Typography>
          <Tooltip title={position?.description || ''}>
            <Info size={14} style={{ color: colors.text, opacity: 0.7 }} />
          </Tooltip>
        </Stack>
        
        <Stack direction="row" flexWrap="wrap" gap={0.5}>
          {cellAssessments.map(assessment => {
            const staff = getStaffInfo(assessment.staffId);
            const staffName = staff ? `${staff.firstName} ${staff.lastName}` : 'Unknown';
            return (
              <Tooltip key={assessment.id} title={staffName}>
                <Avatar
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    fontSize: 12,
                    cursor: 'pointer',
                    border: '2px solid white',
                    boxShadow: 1,
                    '&:hover': { transform: 'scale(1.1)' },
                    transition: 'transform 0.2s ease',
                  }}
                  onClick={() => handleSelectAssessment(assessment)}
                >
                  {staff?.firstName.charAt(0) || '?'}
                </Avatar>
              </Tooltip>
            );
          })}
          {cellAssessments.length === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No employees
            </Typography>
          )}
        </Stack>
      </Box>
    );
  };

  const renderDetailSheet = () => {
    if (!selectedAssessment) return null;
    
    const staff = getStaffInfo(selectedAssessment.staffId);
    const position = getBoxPosition(selectedAssessment.performanceLevel, selectedAssessment.potentialLevel);
    const colors = getBoxColor(selectedAssessment.performanceLevel, selectedAssessment.potentialLevel);
    const flightRiskStyle = getFlightRiskStyle(selectedAssessment.flightRisk);

    return (
      <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Talent Assessment</SheetTitle>
          </SheetHeader>

          <Box sx={{ mt: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <Avatar sx={{ width: 56, height: 56, fontSize: 20 }}>
                {staff?.firstName.charAt(0) || '?'}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  {staff ? `${staff.firstName} ${staff.lastName}` : 'Unknown'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {staff?.position}
                </Typography>
              </Box>
            </Stack>

            <Card sx={{ p: 2, mb: 3, bgcolor: colors.bg, border: '1px solid', borderColor: colors.border }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: colors.text }}>
                {position?.label}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, color: colors.text, opacity: 0.9 }}>
                {position?.description}
              </Typography>
            </Card>

            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Performance & Potential Scores
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Card sx={{ p: 2, flex: 1, textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight={700} color="primary.main">
                      {selectedAssessment.performanceScore.toFixed(1)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Performance</Typography>
                  </Card>
                  <Card sx={{ p: 2, flex: 1, textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight={700} color="secondary.main">
                      {selectedAssessment.potentialScore.toFixed(1)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Potential</Typography>
                  </Card>
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Risk & Readiness
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip 
                    icon={<AlertTriangle size={14} />}
                    label={`Flight Risk: ${selectedAssessment.flightRisk}`}
                    size="small"
                    sx={{ 
                      bgcolor: flightRiskStyle.bg,
                      color: flightRiskStyle.color,
                      '& .MuiChip-icon': { color: 'inherit' },
                      textTransform: 'capitalize',
                    }}
                  />
                  <Chip 
                    label={selectedAssessment.readiness.replace(/_/g, ' ')}
                    size="small"
                    sx={{ 
                      bgcolor: 'rgba(59, 130, 246, 0.12)',
                      color: 'rgb(37, 99, 235)',
                      textTransform: 'capitalize',
                    }}
                  />
                </Stack>
              </Box>

              {selectedAssessment.notes && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Notes
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedAssessment.notes}
                  </Typography>
                </Box>
              )}

              {position?.recommendations && position.recommendations.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Recommended Actions
                  </Typography>
                  <Stack spacing={1}>
                    {position.recommendations.map((rec, index) => (
                      <Stack key={index} direction="row" alignItems="center" spacing={1}>
                        <ChevronRight size={14} className="text-primary" />
                        <Typography variant="body2">{rec}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              )}

              {selectedAssessment.developmentRecommendations && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Development Recommendations
                  </Typography>
                  <Stack spacing={1}>
                    {selectedAssessment.developmentRecommendations.map((rec, index) => (
                      <Stack key={index} direction="row" alignItems="center" spacing={1}>
                        <Target size={14} className="text-green-600" />
                        <Typography variant="body2">{rec}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          </Box>
        </SheetContent>
      </Sheet>
    );
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={600} color="text.primary">
            9-Box Talent Grid
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Visual talent mapping for succession planning and calibration
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<TrendingUp size={16} />}>
            Run Calibration
          </Button>
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowAssessmentDrawer(true)}>
            Add Assessment
          </Button>
        </Stack>
      </Stack>

      <Card sx={{ p: 3 }}>
        <Box sx={{ display: 'grid', gap: 2 }}>
          {/* Y-Axis Label */}
          <Stack direction="row" spacing={2}>
            <Box sx={{ width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography 
                variant="caption" 
                fontWeight={600}
                color="text.secondary"
                sx={{ 
                  writingMode: 'vertical-rl', 
                  textOrientation: 'mixed',
                  transform: 'rotate(180deg)',
                }}
              >
                POTENTIAL →
              </Typography>
            </Box>
            
            {/* Grid */}
            <Box sx={{ flex: 1 }}>
              <Box 
                sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: 1.5,
                }}
              >
                {/* High Potential Row */}
                {renderGridCell('low', 'high')}
                {renderGridCell('medium', 'high')}
                {renderGridCell('high', 'high')}
                
                {/* Medium Potential Row */}
                {renderGridCell('low', 'medium')}
                {renderGridCell('medium', 'medium')}
                {renderGridCell('high', 'medium')}
                
                {/* Low Potential Row */}
                {renderGridCell('low', 'low')}
                {renderGridCell('medium', 'low')}
                {renderGridCell('high', 'low')}
              </Box>

              {/* X-Axis Label */}
              <Typography 
                variant="caption" 
                fontWeight={600}
                color="text.secondary"
                sx={{ display: 'block', textAlign: 'center', mt: 2 }}
              >
                PERFORMANCE →
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Legend */}
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" fontWeight={600} color="text.secondary" gutterBottom sx={{ display: 'block', mb: 1 }}>
            Legend
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {nineBoxPositions.slice(0, 5).map(pos => {
              const colors = getBoxColor(pos.performance, pos.potential);
              return (
                <Chip
                  key={pos.label}
                  label={pos.label}
                  size="small"
                  sx={{ 
                    fontSize: 11,
                    bgcolor: colors.bg,
                    color: colors.text,
                    border: '1px solid',
                    borderColor: colors.border,
                  }}
                />
              );
            })}
          </Stack>
        </Box>
      </Card>

      {renderDetailSheet()}
      
      <TalentAssessmentDrawer
        open={showAssessmentDrawer}
        onClose={() => { setShowAssessmentDrawer(false); setEditingAssessment(null); }}
        onSave={handleSaveAssessment}
        assessment={editingAssessment}
      />
    </Box>
  );
}
