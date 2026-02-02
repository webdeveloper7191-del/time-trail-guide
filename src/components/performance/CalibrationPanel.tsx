import React, { useState } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Chip,
  Avatar,
  LinearProgress,
  Divider,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui/Button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
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
  Scale, 
  Plus, 
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  AlertCircle,
  Eye,
  Edit,
} from 'lucide-react';
import { 
  CalibrationSession, 
  CalibrationRating,
  RatingDistribution,
} from '@/types/advancedPerformance';
import { mockCalibrationSessions, mockCalibrationRatings } from '@/data/mockAdvancedPerformanceData';
import { mockStaff } from '@/data/mockStaffData';
import { StatusBadge } from './shared/StatusBadge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

interface CalibrationPanelProps {
  currentUserId: string;
}

const getSessionStatusType = (status: string): 'pending' | 'in_progress' | 'completed' | 'cancelled' => {
  const mapping: Record<string, 'pending' | 'in_progress' | 'completed' | 'cancelled'> = {
    scheduled: 'pending',
    in_progress: 'in_progress',
    completed: 'completed',
    cancelled: 'cancelled',
  };
  return mapping[status] || 'pending';
};

const mockRatingDistribution: RatingDistribution[] = [
  { rating: 1, count: 0, percentage: 0, expectedPercentage: 5, variance: -5 },
  { rating: 2, count: 1, percentage: 10, expectedPercentage: 15, variance: -5 },
  { rating: 3, count: 2, percentage: 50, expectedPercentage: 50, variance: 0 },
  { rating: 4, count: 1, percentage: 30, expectedPercentage: 25, variance: 5 },
  { rating: 5, count: 0, percentage: 10, expectedPercentage: 5, variance: 5 },
];

export function CalibrationPanel({ currentUserId }: CalibrationPanelProps) {
  const [selectedSession, setSelectedSession] = useState<CalibrationSession | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const getStaffInfo = (id: string) => mockStaff.find(s => s.id === id);

  const upcomingSessions = mockCalibrationSessions.filter(s => s.status === 'scheduled');
  const completedSessions = mockCalibrationSessions.filter(s => s.status === 'completed');

  const handleViewSession = (session: CalibrationSession) => {
    setSelectedSession(session);
    setShowDetailSheet(true);
  };

  const getSessionRatings = (sessionId: string) => {
    return mockCalibrationRatings.filter(r => r.sessionId === sessionId);
  };

  const renderDistributionChart = () => {
    const chartData = mockRatingDistribution.map(d => ({
      rating: `Rating ${d.rating}`,
      actual: d.percentage,
      expected: d.expectedPercentage,
    }));

    return (
      <Card sx={{ p: 3, mb: 4 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Rating Distribution Analysis
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Compare actual ratings against expected bell curve distribution
        </Typography>
        
        <Box sx={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={0}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="rating" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit="%" />
              <Tooltip />
              <Bar dataKey="expected" name="Expected" fill="rgba(148, 163, 184, 0.4)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" name="Actual" fill="rgb(59, 130, 246)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>

        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={{ width: 12, height: 12, bgcolor: 'rgb(59, 130, 246)', borderRadius: 0.5 }} />
            <Typography variant="caption">Actual Distribution</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={{ width: 12, height: 12, bgcolor: 'rgba(148, 163, 184, 0.4)', borderRadius: 0.5 }} />
            <Typography variant="caption">Expected (Bell Curve)</Typography>
          </Stack>
        </Stack>
      </Card>
    );
  };

  const renderSessionsTable = (sessions: CalibrationSession[]) => {
    if (sessions.length === 0) {
      return (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Scale size={40} className="mx-auto mb-2 text-muted-foreground" />
          <Typography variant="subtitle1" fontWeight={600}>No sessions found</Typography>
          <Typography variant="body2" color="text.secondary">
            Schedule a calibration session to align ratings
          </Typography>
        </Card>
      );
    }

    return (
      <Card sx={{ overflow: 'hidden' }}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-semibold">Session</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Facilitator</TableHead>
              <TableHead className="font-semibold text-center">Participants</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-center">Adjustments</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => {
              const facilitator = getStaffInfo(session.facilitatorId);
              const facilitatorName = facilitator ? `${facilitator.firstName} ${facilitator.lastName}` : 'Unknown';
              const ratings = getSessionRatings(session.id);
              const adjustedCount = ratings.filter(r => r.calibratedRating !== undefined && r.calibratedRating !== r.originalRating).length;
              const isHovered = hoveredRow === session.id;

              return (
                <TableRow 
                  key={session.id}
                  className="cursor-pointer transition-colors"
                  onMouseEnter={() => setHoveredRow(session.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => handleViewSession(session)}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {session.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {session.reviewCycle}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Calendar size={14} className="text-muted-foreground" />
                      <Typography variant="body2">
                        {format(new Date(session.scheduledDate), 'MMM d, yyyy')}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
                        {facilitator?.firstName.charAt(0) || '?'}
                      </Avatar>
                      <Typography variant="body2">{facilitatorName}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell className="text-center">
                    <Chip 
                      icon={<Users size={12} />}
                      label={session.participantIds.length}
                      size="small"
                      variant="outlined"
                      sx={{ '& .MuiChip-icon': { marginLeft: '8px' } }}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={getSessionStatusType(session.status)} />
                  </TableCell>
                  <TableCell className="text-center">
                    {session.status === 'completed' ? (
                      <Chip 
                        label={adjustedCount}
                        size="small"
                        sx={{ 
                          minWidth: 32,
                          bgcolor: adjustedCount > 0 ? 'rgba(251, 191, 36, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                          color: adjustedCount > 0 ? 'rgb(161, 98, 7)' : 'rgb(22, 163, 74)',
                        }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">—</Typography>
                    )}
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
                        <Edit size={16} />
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
    if (!selectedSession) return null;
    
    const ratings = getSessionRatings(selectedSession.id);
    const facilitator = getStaffInfo(selectedSession.facilitatorId);
    const facilitatorName = facilitator ? `${facilitator.firstName} ${facilitator.lastName}` : 'Unknown';

    return (
      <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedSession.title}</SheetTitle>
          </SheetHeader>

          <Box sx={{ mt: 3 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
              <StatusBadge status={getSessionStatusType(selectedSession.status)} />
              <Chip 
                label={selectedSession.reviewCycle}
                size="small"
                variant="outlined"
              />
            </Stack>

            <Stack spacing={2} sx={{ mb: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Calendar size={16} className="text-muted-foreground" />
                <Typography variant="body2">
                  {format(new Date(selectedSession.scheduledDate), 'MMMM d, yyyy h:mm a')}
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Users size={16} className="text-muted-foreground" />
                <Typography variant="body2">
                  Facilitator: {facilitatorName}
                </Typography>
              </Stack>
            </Stack>

            {/* Rating Adjustments Table */}
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
              Rating Calibrations ({ratings.length})
            </Typography>
            
            <Card sx={{ overflow: 'hidden', mb: 3 }}>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">Employee</TableHead>
                    <TableHead className="font-semibold text-center">Original</TableHead>
                    <TableHead className="font-semibold text-center">Calibrated</TableHead>
                    <TableHead className="font-semibold text-center">Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ratings.map(rating => {
                    const staff = getStaffInfo(rating.staffId);
                    const staffName = staff ? `${staff.firstName} ${staff.lastName}` : 'Unknown';
                    const wasAdjusted = rating.calibratedRating !== undefined && rating.calibratedRating !== rating.originalRating;
                    const adjustmentDiff = rating.calibratedRating !== undefined 
                      ? rating.calibratedRating - rating.originalRating 
                      : 0;

                    return (
                      <TableRow 
                        key={rating.id}
                        style={{
                          borderLeft: wasAdjusted ? '3px solid rgb(59, 130, 246)' : undefined,
                        }}
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
                        <TableCell className="text-center">
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              textDecoration: wasAdjusted ? 'line-through' : 'none',
                              color: wasAdjusted ? 'text.secondary' : 'text.primary',
                            }}
                          >
                            {rating.originalRating.toFixed(1)}
                          </Typography>
                        </TableCell>
                        <TableCell className="text-center">
                          {wasAdjusted ? (
                            <Typography variant="body2" fontWeight={600} color="primary.main">
                              {rating.calibratedRating?.toFixed(1)}
                            </Typography>
                          ) : (
                            <Typography variant="body2">{rating.originalRating.toFixed(1)}</Typography>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {adjustmentDiff !== 0 ? (
                            <Chip 
                              size="small"
                              label={adjustmentDiff > 0 ? `+${adjustmentDiff.toFixed(1)}` : adjustmentDiff.toFixed(1)}
                              icon={adjustmentDiff > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                              sx={{ 
                                fontSize: 11,
                                height: 22,
                                bgcolor: adjustmentDiff > 0 
                                  ? 'rgba(34, 197, 94, 0.12)' 
                                  : 'rgba(239, 68, 68, 0.12)',
                                color: adjustmentDiff > 0 
                                  ? 'rgb(22, 163, 74)' 
                                  : 'rgb(220, 38, 38)',
                                '& .MuiChip-icon': { color: 'inherit', marginLeft: '6px' },
                              }}
                            />
                          ) : (
                            <Chip 
                              size="small"
                              label="—"
                              sx={{ fontSize: 11, height: 22, bgcolor: 'rgba(0,0,0,0.04)' }}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>

            {selectedSession.notes && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Session Notes
                </Typography>
                <Card sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <Typography variant="body2" color="text.secondary">
                    {selectedSession.notes}
                  </Typography>
                </Card>
              </Box>
            )}
          </Box>
        </SheetContent>
      </Sheet>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'stretch', sm: 'center' }} 
        spacing={2}
      >
        <Box>
          <Typography variant="h6" fontWeight={600} color="text.primary" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
            Calibration Sessions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Ensure fair and consistent performance ratings across teams
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={16} />} className="w-full sm:w-auto">
          <span className="hidden sm:inline">Schedule Session</span>
          <span className="sm:hidden">New Session</span>
        </Button>
      </Stack>

      {renderDistributionChart()}

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingSessions.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedSessions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {renderSessionsTable(upcomingSessions)}
        </TabsContent>

        <TabsContent value="completed">
          {renderSessionsTable(completedSessions)}
        </TabsContent>
      </Tabs>

      {renderDetailSheet()}
    </Box>
  );
}
