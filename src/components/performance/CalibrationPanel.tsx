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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from 'lucide-react';
import { 
  CalibrationSession, 
  CalibrationRating,
  RatingDistribution,
} from '@/types/advancedPerformance';
import { mockCalibrationSessions, mockCalibrationRatings } from '@/data/mockAdvancedPerformanceData';
import { mockStaff } from '@/data/mockStaffData';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';

interface CalibrationPanelProps {
  currentUserId: string;
}

const getSessionStatusStyle = (status: string) => {
  const styles: Record<string, { bg: string; color: string }> = {
    scheduled: { bg: 'rgba(59, 130, 246, 0.12)', color: 'rgb(37, 99, 235)' },
    in_progress: { bg: 'rgba(251, 191, 36, 0.12)', color: 'rgb(161, 98, 7)' },
    completed: { bg: 'rgba(34, 197, 94, 0.12)', color: 'rgb(22, 163, 74)' },
    cancelled: { bg: 'rgba(148, 163, 184, 0.12)', color: 'rgb(100, 116, 139)' },
  };
  return styles[status] || styles.scheduled;
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

  const renderSessionCard = (session: CalibrationSession) => {
    const statusStyle = getSessionStatusStyle(session.status);
    const facilitator = getStaffInfo(session.facilitatorId);
    const facilitatorName = facilitator ? `${facilitator.firstName} ${facilitator.lastName}` : 'Unknown';
    const ratings = getSessionRatings(session.id);
    const adjustedCount = ratings.filter(r => r.calibratedRating !== undefined && r.calibratedRating !== r.originalRating).length;

    return (
      <Card 
        key={session.id}
        sx={{ 
          p: 3,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' },
        }}
        onClick={() => handleViewSession(session)}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              {session.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {session.reviewCycle}
            </Typography>
          </Box>
          <Chip 
            label={session.status.replace('_', ' ')}
            size="small"
            sx={{ 
              textTransform: 'capitalize',
              bgcolor: statusStyle.bg,
              color: statusStyle.color,
            }}
          />
        </Stack>

        <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Calendar size={14} className="text-muted-foreground" />
            <Typography variant="body2" color="text.secondary">
              {format(new Date(session.scheduledDate), 'MMM d, yyyy')}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Users size={14} className="text-muted-foreground" />
            <Typography variant="body2" color="text.secondary">
              {session.participantIds.length} participants
            </Typography>
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            Facilitator: {facilitatorName}
          </Typography>
          {session.status === 'completed' && (
            <Chip 
              label={`${adjustedCount} adjustments`}
              size="small"
              sx={{ 
                fontSize: 11,
                bgcolor: adjustedCount > 0 ? 'rgba(251, 191, 36, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                color: adjustedCount > 0 ? 'rgb(161, 98, 7)' : 'rgb(22, 163, 74)',
              }}
            />
          )}
        </Stack>
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
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedSession.title}</SheetTitle>
          </SheetHeader>

          <Box sx={{ mt: 3 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
              <Chip 
                label={selectedSession.status.replace('_', ' ')}
                size="small"
                sx={{ 
                  textTransform: 'capitalize',
                  ...getSessionStatusStyle(selectedSession.status),
                }}
              />
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

            {/* Rating Adjustments */}
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Rating Calibrations ({ratings.length})
            </Typography>
            <Stack spacing={2}>
              {ratings.map(rating => {
                const staff = getStaffInfo(rating.staffId);
                const staffName = staff ? `${staff.firstName} ${staff.lastName}` : 'Unknown';
                const wasAdjusted = rating.calibratedRating !== undefined && rating.calibratedRating !== rating.originalRating;
                const adjustmentDiff = rating.calibratedRating !== undefined 
                  ? rating.calibratedRating - rating.originalRating 
                  : 0;

                return (
                  <Card key={rating.id} sx={{ p: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ width: 36, height: 36, fontSize: 14 }}>
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
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            textDecoration: wasAdjusted ? 'line-through' : 'none',
                            color: wasAdjusted ? 'text.secondary' : 'text.primary',
                          }}
                        >
                          {rating.originalRating.toFixed(1)}
                        </Typography>
                        {wasAdjusted && (
                          <>
                            <Box sx={{ mx: 0.5 }}>→</Box>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Typography variant="body2" fontWeight={600} color="primary.main">
                                {rating.calibratedRating?.toFixed(1)}
                              </Typography>
                              {adjustmentDiff !== 0 && (
                                <Chip 
                                  size="small"
                                  label={adjustmentDiff > 0 ? `+${adjustmentDiff.toFixed(1)}` : adjustmentDiff.toFixed(1)}
                                  sx={{ 
                                    fontSize: 10,
                                    height: 18,
                                    bgcolor: adjustmentDiff > 0 
                                      ? 'rgba(34, 197, 94, 0.12)' 
                                      : 'rgba(239, 68, 68, 0.12)',
                                    color: adjustmentDiff > 0 
                                      ? 'rgb(22, 163, 74)' 
                                      : 'rgb(220, 38, 38)',
                                  }}
                                />
                              )}
                            </Stack>
                          </>
                        )}
                      </Stack>
                    </Stack>
                    
                    {rating.ratingJustification && (
                      <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(0,0,0,0.04)', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Justification
                        </Typography>
                        <Typography variant="body2">{rating.ratingJustification}</Typography>
                      </Box>
                    )}
                    
                    {rating.discussionNotes && (
                      <Box sx={{ mt: 1, p: 1.5, bgcolor: 'rgba(0,0,0,0.04)', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Notes
                        </Typography>
                        <Typography variant="body2">{rating.discussionNotes}</Typography>
                      </Box>
                    )}
                  </Card>
                );
              })}
            </Stack>

            {selectedSession.notes && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Session Notes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedSession.notes}
                </Typography>
              </Box>
            )}
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
            Calibration Sessions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ensure fair and consistent performance ratings across teams
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={16} />}>
          Schedule Session
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
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingSessions.map(renderSessionCard)}
            {upcomingSessions.length === 0 && (
              <Card sx={{ p: 4, textAlign: 'center', gridColumn: '1/-1' }}>
                <Scale size={40} className="mx-auto mb-2 text-muted-foreground" />
                <Typography variant="subtitle1" fontWeight={600}>No upcoming sessions</Typography>
                <Typography variant="body2" color="text.secondary">
                  Schedule a calibration session to align ratings
                </Typography>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="grid gap-4 md:grid-cols-2">
            {completedSessions.map(renderSessionCard)}
          </div>
        </TabsContent>
      </Tabs>

      {renderDetailSheet()}
    </Box>
  );
}
