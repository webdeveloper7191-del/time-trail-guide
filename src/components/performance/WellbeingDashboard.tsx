import React, { useState } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Chip,
  Avatar,
  LinearProgress,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui/Button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Heart, 
  AlertTriangle, 
  Clock, 
  Calendar,
  Activity,
  Coffee,
  Sun,
  ChevronRight,
  Eye,
  MessageSquare,
} from 'lucide-react';
import { 
  WellbeingIndicator, 
  wellbeingRiskLabels,
  WellbeingRiskLevel,
} from '@/types/advancedPerformance';
import { mockWellbeingIndicators } from '@/data/mockAdvancedPerformanceData';
import { mockStaff } from '@/data/mockStaffData';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
} from 'recharts';

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
    case 'low': return <Heart size={14} className="text-green-600" />;
    case 'moderate': return <Activity size={14} className="text-amber-600" />;
    case 'high': return <AlertTriangle size={14} className="text-orange-600" />;
    case 'critical': return <AlertTriangle size={14} className="text-red-600" />;
  }
};

export function WellbeingDashboard({ currentUserId }: WellbeingDashboardProps) {
  const [selectedIndicator, setSelectedIndicator] = useState<WellbeingIndicator | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const getStaffInfo = (id: string) => mockStaff.find(s => s.id === id);

  // Summary stats
  const riskCounts = mockWellbeingIndicators.reduce((acc, ind) => {
    acc[ind.riskLevel] = (acc[ind.riskLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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

  const renderIndicatorsTable = (indicators: WellbeingIndicator[]) => {
    if (indicators.length === 0) {
      return (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Heart size={40} className="mx-auto mb-2 text-muted-foreground" />
          <Typography variant="subtitle1" fontWeight={600}>No indicators found</Typography>
          <Typography variant="body2" color="text.secondary">
            All staff are within healthy ranges
          </Typography>
        </Card>
      );
    }

    return (
      <Card sx={{ overflow: 'hidden' }}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-semibold">Employee</TableHead>
              <TableHead className="font-semibold">Risk Level</TableHead>
              <TableHead className="font-semibold text-center">Overtime</TableHead>
              <TableHead className="font-semibold text-center">Avg Day</TableHead>
              <TableHead className="font-semibold">Workload</TableHead>
              <TableHead className="font-semibold">Engagement</TableHead>
              <TableHead className="font-semibold">Risk Factors</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {indicators.map((indicator) => {
              const staff = getStaffInfo(indicator.staffId);
              const staffName = staff ? `${staff.firstName} ${staff.lastName}` : 'Unknown';
              const riskStyle = getRiskLevelStyle(indicator.riskLevel);
              const isHovered = hoveredRow === indicator.id;
              const isHighRisk = indicator.riskLevel === 'critical' || indicator.riskLevel === 'high';

              return (
                <TableRow 
                  key={indicator.id}
                  className="cursor-pointer transition-colors"
                  style={{
                    borderLeft: isHighRisk ? `3px solid ${riskStyle.border}` : undefined,
                  }}
                  onMouseEnter={() => setHoveredRow(indicator.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => handleViewIndicator(indicator)}
                >
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ width: 32, height: 32, fontSize: 13 }}>
                        {staff?.firstName.charAt(0) || '?'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {staffName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {staff?.position}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      icon={getRiskIcon(indicator.riskLevel)}
                      label={wellbeingRiskLabels[indicator.riskLevel]}
                      size="small"
                      sx={{ 
                        bgcolor: riskStyle.bg,
                        color: riskStyle.color,
                        fontWeight: 500,
                        '& .MuiChip-icon': { color: 'inherit', marginLeft: '6px' },
                      }}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Typography 
                      variant="body2" 
                      fontWeight={indicator.overtimeHours > 10 ? 600 : 400}
                      color={indicator.overtimeHours > 10 ? 'error.main' : 'text.primary'}
                    >
                      {indicator.overtimeHours}h
                    </Typography>
                  </TableCell>
                  <TableCell className="text-center">
                    <Typography 
                      variant="body2"
                      fontWeight={indicator.averageWorkdayLength > 9 ? 600 : 400}
                      color={indicator.averageWorkdayLength > 9 ? 'warning.main' : 'text.primary'}
                    >
                      {indicator.averageWorkdayLength}h
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">
                          {indicator.workloadScore}/10
                        </Typography>
                      </Stack>
                      <LinearProgress 
                        variant="determinate" 
                        value={indicator.workloadScore * 10}
                        sx={{ 
                          height: 4, 
                          borderRadius: 1,
                          width: 80,
                          bgcolor: 'rgba(0,0,0,0.08)',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: indicator.workloadScore > 7 ? 'error.main' : indicator.workloadScore > 5 ? 'warning.main' : 'success.main',
                          }
                        }}
                      />
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">
                          {indicator.engagementScore}/10
                        </Typography>
                      </Stack>
                      <LinearProgress 
                        variant="determinate" 
                        value={indicator.engagementScore * 10}
                        sx={{ 
                          height: 4, 
                          borderRadius: 1,
                          width: 80,
                          bgcolor: 'rgba(0,0,0,0.08)',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: indicator.engagementScore < 5 ? 'error.main' : indicator.engagementScore < 7 ? 'warning.main' : 'success.main',
                          }
                        }}
                      />
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" flexWrap="wrap" gap={0.5}>
                      {indicator.riskFactors.slice(0, 2).map((factor, index) => (
                        <Chip 
                          key={index}
                          label={factor}
                          size="small"
                          sx={{ 
                            fontSize: 10,
                            height: 20,
                            bgcolor: 'rgba(239, 68, 68, 0.08)',
                            color: 'rgb(185, 28, 28)',
                          }}
                        />
                      ))}
                      {indicator.riskFactors.length > 2 && (
                        <Chip 
                          label={`+${indicator.riskFactors.length - 2}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: 10, height: 20 }}
                        />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack 
                      direction="row" 
                      spacing={0.5} 
                      justifyContent="flex-end"
                      sx={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s' }}
                    >
                      <Button variant="ghost" size="small" sx={{ minWidth: 32, p: 0.5 }}>
                        <Eye size={16} />
                      </Button>
                      <Button variant="ghost" size="small" sx={{ minWidth: 32, p: 0.5 }}>
                        <MessageSquare size={16} />
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
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

            {/* Metrics Table */}
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
              Key Metrics
            </Typography>
            <Card sx={{ overflow: 'hidden', mb: 3 }}>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Clock size={14} className="text-muted-foreground" />
                        <Typography variant="body2">Overtime Hours</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell className="text-right">
                      <Typography variant="body2" fontWeight={600}>{selectedIndicator.overtimeHours}h</Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Sun size={14} className="text-muted-foreground" />
                        <Typography variant="body2">Avg Day Length</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell className="text-right">
                      <Typography variant="body2" fontWeight={600}>{selectedIndicator.averageWorkdayLength}h</Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Calendar size={14} className="text-muted-foreground" />
                        <Typography variant="body2">Days Since Leave</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell className="text-right">
                      <Typography variant="body2" fontWeight={600}>{selectedIndicator.daysSinceLastLeave}</Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Coffee size={14} className="text-muted-foreground" />
                        <Typography variant="body2">Missed Breaks</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell className="text-right">
                      <Typography variant="body2" fontWeight={600}>{selectedIndicator.missedBreaks}</Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>

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

  const attentionNeeded = sortedIndicators.filter(i => i.riskLevel === 'critical' || i.riskLevel === 'high');

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
            Needs Attention ({attentionNeeded.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {renderIndicatorsTable(sortedIndicators)}
        </TabsContent>

        <TabsContent value="attention">
          {renderIndicatorsTable(attentionNeeded)}
        </TabsContent>
      </Tabs>

      {renderDetailSheet()}
    </Box>
  );
}
