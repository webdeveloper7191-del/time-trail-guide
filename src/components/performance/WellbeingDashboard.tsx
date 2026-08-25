import React, { useState } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Chip,
  Avatar,
  LinearProgress,
  Divider,
  IconButton,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui/Button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Heart, 
  AlertTriangle, 
  Clock, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Coffee,
  Sun,
  Moon,
  Battery,
  Zap,
  ChevronRight,
  Users,
} from 'lucide-react';
import { 
  WellbeingIndicator, 
  WellbeingCheckIn,
  wellbeingRiskLabels,
  WellbeingRiskLevel,
} from '@/types/advancedPerformance';
import { mockWellbeingIndicators, mockWellbeingCheckIns } from '@/data/mockAdvancedPerformanceData';
import { mockStaff } from '@/data/mockStaffData';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { format, differenceInDays } from 'date-fns';

interface WellbeingDashboardProps {
  currentUserId: string;
}

const getRiskLevelStyle = (level: WellbeingRiskLevel) => {
  const styles: Record<WellbeingRiskLevel, { bg: string; color: string; border: string }> = {
    low: { bg: 'rgba(34, 197, 94, 0.12)', color: 'rgb(22, 163, 74)', border: 'rgb(34, 197, 94)' },
    moderate: { bg: 'rgba(251, 191, 36, 0.12)', color: 'rgb(161, 98, 7)', border: 'rgb(251, 191, 36)' },
    high: { bg: 'rgba(249, 115, 22, 0.12)', color: 'rgb(194, 65, 12)', border: 'rgb(249, 115, 22)' },
    critical: { bg: 'rgba(239, 68, 68, 0.12)', color: 'rgb(185, 28, 28)', border: 'rgb(239, 68, 68)' },
  };
  return styles[level];
};

const getRiskIcon = (level: WellbeingRiskLevel) => {
  switch (level) {
    case 'low': return <Heart size={16} className="text-green-600" />;
    case 'moderate': return <Activity size={16} className="text-amber-600" />;
    case 'high': return <AlertTriangle size={16} className="text-orange-600" />;
    case 'critical': return <AlertTriangle size={16} className="text-red-600" />;
  }
};

export function WellbeingDashboard({ currentUserId }: WellbeingDashboardProps) {
  const [selectedIndicator, setSelectedIndicator] = useState<WellbeingIndicator | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);

  const getStaffInfo = (id: string) => mockStaff.find(s => s.id === id);

  // Summary stats
  const riskCounts = mockWellbeingIndicators.reduce((acc, ind) => {
    acc[ind.riskLevel] = (acc[ind.riskLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgWorkload = mockWellbeingIndicators.reduce((sum, ind) => sum + ind.workloadScore, 0) / mockWellbeingIndicators.length;
  const avgEngagement = mockWellbeingIndicators.reduce((sum, ind) => sum + ind.engagementScore, 0) / mockWellbeingIndicators.length;

  const handleViewIndicator = (indicator: WellbeingIndicator) => {
    setSelectedIndicator(indicator);
    setShowDetailSheet(true);
  };

  const renderSummaryCards = () => (
    <div className="grid gap-4 md:grid-cols-4 mb-6">
      <Card sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Heart size={18} className="text-green-600" />
          <Typography variant="caption" fontWeight={600} color="text.secondary">Low Risk</Typography>
        </Stack>
        <Typography variant="h4" fontWeight={700} color="success.main">
          {riskCounts.low || 0}
        </Typography>
      </Card>
      <Card sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Activity size={18} className="text-amber-600" />
          <Typography variant="caption" fontWeight={600} color="text.secondary">Moderate Risk</Typography>
        </Stack>
        <Typography variant="h4" fontWeight={700} sx={{ color: 'rgb(161, 98, 7)' }}>
          {riskCounts.moderate || 0}
        </Typography>
      </Card>
      <Card sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <AlertTriangle size={18} className="text-orange-600" />
          <Typography variant="caption" fontWeight={600} color="text.secondary">High Risk</Typography>
        </Stack>
        <Typography variant="h4" fontWeight={700} sx={{ color: 'rgb(194, 65, 12)' }}>
          {riskCounts.high || 0}
        </Typography>
      </Card>
      <Card sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <AlertTriangle size={18} className="text-red-600" />
          <Typography variant="caption" fontWeight={600} color="text.secondary">Critical</Typography>
        </Stack>
        <Typography variant="h4" fontWeight={700} color="error.main">
          {riskCounts.critical || 0}
        </Typography>
      </Card>
    </div>
  );

  const renderIndicatorCard = (indicator: WellbeingIndicator) => {
    const staff = getStaffInfo(indicator.staffId);
    const staffName = staff ? `${staff.firstName} ${staff.lastName}` : 'Unknown';
    const riskStyle = getRiskLevelStyle(indicator.riskLevel);

    return (
      <Card 
        key={indicator.id}
        sx={{ 
          p: 3,
          cursor: 'pointer',
          border: '1px solid',
          borderColor: indicator.riskLevel === 'critical' || indicator.riskLevel === 'high' 
            ? riskStyle.border 
            : 'divider',
          transition: 'all 0.2s ease',
          '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' },
        }}
        onClick={() => handleViewIndicator(indicator)}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ width: 40, height: 40 }}>
              {staff?.firstName.charAt(0) || '?'}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                {staffName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {staff?.position}
              </Typography>
            </Box>
          </Stack>
          <Chip 
            icon={getRiskIcon(indicator.riskLevel)}
            label={wellbeingRiskLabels[indicator.riskLevel]}
            size="small"
            sx={{ 
              bgcolor: riskStyle.bg,
              color: riskStyle.color,
              '& .MuiChip-icon': { color: 'inherit' },
            }}
          />
        </Stack>

        <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Overtime</Typography>
            <Typography variant="body2" fontWeight={600}>{indicator.overtimeHours}h</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Avg Day</Typography>
            <Typography variant="body2" fontWeight={600}>{indicator.averageWorkdayLength}h</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Days Since Leave</Typography>
            <Typography variant="body2" fontWeight={600}>{indicator.daysSinceLastLeave}</Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={2}>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">Workload</Typography>
              <Typography variant="caption" fontWeight={600}>{indicator.workloadScore}/10</Typography>
            </Stack>
            <LinearProgress 
              variant="determinate" 
              value={indicator.workloadScore * 10}
              sx={{ 
                height: 4, 
                borderRadius: 1,
                bgcolor: 'rgba(0,0,0,0.08)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: indicator.workloadScore > 7 ? 'error.main' : indicator.workloadScore > 5 ? 'warning.main' : 'success.main',
                }
              }}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">Engagement</Typography>
              <Typography variant="caption" fontWeight={600}>{indicator.engagementScore}/10</Typography>
            </Stack>
            <LinearProgress 
              variant="determinate" 
              value={indicator.engagementScore * 10}
              sx={{ 
                height: 4, 
                borderRadius: 1,
                bgcolor: 'rgba(0,0,0,0.08)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: indicator.engagementScore < 5 ? 'error.main' : indicator.engagementScore < 7 ? 'warning.main' : 'success.main',
                }
              }}
            />
          </Box>
        </Stack>

        {indicator.riskFactors.length > 0 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" flexWrap="wrap" gap={0.5}>
              {indicator.riskFactors.slice(0, 2).map((factor, index) => (
                <Chip 
                  key={index}
                  label={factor}
                  size="small"
                  sx={{ 
                    fontSize: 10,
                    height: 22,
                    bgcolor: 'rgba(239, 68, 68, 0.08)',
                    color: 'rgb(185, 28, 28)',
                  }}
                />
              ))}
              {indicator.riskFactors.length > 2 && (
                <Chip 
                  label={`+${indicator.riskFactors.length - 2} more`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: 10, height: 22 }}
                />
              )}
            </Stack>
          </Box>
        )}
      </Card>
    );
  };

  const renderDetailSheet = () => {
    if (!selectedIndicator) return null;
    
    const staff = getStaffInfo(selectedIndicator.staffId);
    const staffName = staff ? `${staff.firstName} ${staff.lastName}` : 'Unknown';
    const riskStyle = getRiskLevelStyle(selectedIndicator.riskLevel);

    const radarData = [
      { subject: 'Workload', value: 10 - selectedIndicator.workloadScore, fullMark: 10 },
      { subject: 'Engagement', value: selectedIndicator.engagementScore, fullMark: 10 },
      { subject: 'Leave Balance', value: Math.min(selectedIndicator.leaveBalance / 3, 10), fullMark: 10 },
      { subject: 'Work Hours', value: Math.max(0, 10 - (selectedIndicator.averageWorkdayLength - 8) * 2), fullMark: 10 },
      { subject: 'Breaks', value: Math.max(0, 10 - selectedIndicator.missedBreaks), fullMark: 10 },
    ];

    return (
      <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Wellbeing Details</SheetTitle>
          </SheetHeader>

          <Box sx={{ mt: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <Avatar sx={{ width: 56, height: 56, fontSize: 20 }}>
                {staff?.firstName.charAt(0) || '?'}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={600}>
                  {staffName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {staff?.position}
                </Typography>
              </Box>
              <Chip 
                icon={getRiskIcon(selectedIndicator.riskLevel)}
                label={wellbeingRiskLabels[selectedIndicator.riskLevel]}
                sx={{ 
                  bgcolor: riskStyle.bg,
                  color: riskStyle.color,
                  '& .MuiChip-icon': { color: 'inherit' },
                }}
              />
            </Stack>

            {/* Radar Chart */}
            <Card sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Wellbeing Overview
              </Typography>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 10 }} />
                    <Radar 
                      name="Score" 
                      dataKey="value" 
                      stroke="rgb(59, 130, 246)" 
                      fill="rgba(59, 130, 246, 0.3)" 
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </Box>
            </Card>

            {/* Metrics */}
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Key Metrics
            </Typography>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Card sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Clock size={16} className="text-muted-foreground" />
                  <Typography variant="caption" color="text.secondary">Overtime</Typography>
                </Stack>
                <Typography variant="h6" fontWeight={600}>{selectedIndicator.overtimeHours}h</Typography>
              </Card>
              <Card sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Sun size={16} className="text-muted-foreground" />
                  <Typography variant="caption" color="text.secondary">Avg Day Length</Typography>
                </Stack>
                <Typography variant="h6" fontWeight={600}>{selectedIndicator.averageWorkdayLength}h</Typography>
              </Card>
              <Card sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Calendar size={16} className="text-muted-foreground" />
                  <Typography variant="caption" color="text.secondary">Days Since Leave</Typography>
                </Stack>
                <Typography variant="h6" fontWeight={600}>{selectedIndicator.daysSinceLastLeave}</Typography>
              </Card>
              <Card sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Coffee size={16} className="text-muted-foreground" />
                  <Typography variant="caption" color="text.secondary">Missed Breaks</Typography>
                </Stack>
                <Typography variant="h6" fontWeight={600}>{selectedIndicator.missedBreaks}</Typography>
              </Card>
            </div>

            {/* Risk Factors */}
            {selectedIndicator.riskFactors.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Risk Factors
                </Typography>
                <Stack spacing={1}>
                  {selectedIndicator.riskFactors.map((factor, index) => (
                    <Stack key={index} direction="row" alignItems="center" spacing={1}>
                      <AlertTriangle size={14} className="text-orange-600" />
                      <Typography variant="body2">{factor}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Recommendations */}
            {selectedIndicator.recommendations.length > 0 && (
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Recommendations
                </Typography>
                <Stack spacing={1}>
                  {selectedIndicator.recommendations.map((rec, index) => (
                    <Stack key={index} direction="row" alignItems="center" spacing={1}>
                      <ChevronRight size={14} className="text-green-600" />
                      <Typography variant="body2">{rec}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        </SheetContent>
      </Sheet>
    );
  };

  // Sort by risk level (critical first)
  const sortedIndicators = [...mockWellbeingIndicators].sort((a, b) => {
    const order: Record<WellbeingRiskLevel, number> = { critical: 0, high: 1, moderate: 2, low: 3 };
    return order[a.riskLevel] - order[b.riskLevel];
  });

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={600} color="text.primary">
            Wellbeing & Burnout Indicators
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor workload patterns and identify burnout risks
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<Activity size={16} />}>
          Run Analysis
        </Button>
      </Stack>

      {renderSummaryCards()}

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Staff</TabsTrigger>
          <TabsTrigger value="attention">
            Needs Attention ({(riskCounts.high || 0) + (riskCounts.critical || 0)})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid gap-4 md:grid-cols-2">
            {sortedIndicators.map(renderIndicatorCard)}
          </div>
        </TabsContent>

        <TabsContent value="attention">
          <div className="grid gap-4 md:grid-cols-2">
            {sortedIndicators
              .filter(i => i.riskLevel === 'high' || i.riskLevel === 'critical')
              .map(renderIndicatorCard)}
          </div>
        </TabsContent>
      </Tabs>

      {renderDetailSheet()}
    </Box>
  );
}
