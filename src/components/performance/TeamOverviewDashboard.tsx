import React, { useMemo, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  Collapse,
  Grid,
} from '@mui/material';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Goal, PerformanceReview, Feedback, Conversation } from '@/types/performance';
import { StaffMember } from '@/types/staff';
import { format, parseISO, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns';
import {
  Users,
  Target,
  ClipboardCheck,
  MessageSquareHeart,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamOverviewDashboardProps {
  staff: StaffMember[];
  goals: Goal[];
  reviews: PerformanceReview[];
  feedback: Feedback[];
  conversations: Conversation[];
  currentUserId: string;
  onViewGoal: (goal: Goal) => void;
  onViewReview: (review: PerformanceReview) => void;
  onViewConversation: (conversation: Conversation) => void;
}

interface TeamMemberSummary {
  staffMember: StaffMember;
  goals: Goal[];
  reviews: PerformanceReview[];
  feedbackReceived: Feedback[];
  conversations: Conversation[];
  stats: {
    goalsCompleted: number;
    goalsTotal: number;
    avgProgress: number;
    pendingReview: boolean;
    lastFeedback?: string;
    nextConversation?: Conversation;
    overdue: number;
  };
}

export function TeamOverviewDashboard({
  staff,
  goals,
  reviews,
  feedback,
  conversations,
  currentUserId,
  onViewGoal,
  onViewReview,
  onViewConversation,
}: TeamOverviewDashboardProps) {
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  // Filter to direct reports (mock - in real app this would come from org structure)
  const directReports = useMemo(() => {
    // For demo, show all staff except current user
    return staff.filter((s) => s.id !== currentUserId);
  }, [staff, currentUserId]);

  // Build summary for each team member
  const teamSummaries: TeamMemberSummary[] = useMemo(() => {
    return directReports.map((member) => {
      const memberGoals = goals.filter((g) => g.staffId === member.id);
      const memberReviews = reviews.filter((r) => r.staffId === member.id);
      const memberFeedback = feedback.filter((f) => f.toStaffId === member.id);
      const memberConversations = conversations.filter(
        (c) => c.staffId === member.id || c.managerId === member.id
      );

      const goalsCompleted = memberGoals.filter((g) => g.status === 'completed').length;
      const avgProgress =
        memberGoals.length > 0
          ? memberGoals.reduce((sum, g) => sum + g.progress, 0) / memberGoals.length
          : 0;
      const overdue = memberGoals.filter((g) => g.status === 'overdue').length;
      const pendingReview = memberReviews.some(
        (r) => r.status === 'pending_self' || r.status === 'pending_manager'
      );
      const nextConversation = memberConversations
        .filter((c) => !c.completed && !isPast(parseISO(c.scheduledDate)))
        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())[0];

      return {
        staffMember: member,
        goals: memberGoals,
        reviews: memberReviews,
        feedbackReceived: memberFeedback,
        conversations: memberConversations,
        stats: {
          goalsCompleted,
          goalsTotal: memberGoals.length,
          avgProgress: Math.round(avgProgress),
          pendingReview,
          lastFeedback: memberFeedback[0]?.createdAt,
          nextConversation,
          overdue,
        },
      };
    });
  }, [directReports, goals, reviews, feedback, conversations]);

  // Team-wide stats
  const teamStats = useMemo(() => {
    const totalGoals = teamSummaries.reduce((sum, m) => sum + m.stats.goalsTotal, 0);
    const completedGoals = teamSummaries.reduce((sum, m) => sum + m.stats.goalsCompleted, 0);
    const pendingReviews = teamSummaries.filter((m) => m.stats.pendingReview).length;
    const overdue = teamSummaries.reduce((sum, m) => sum + m.stats.overdue, 0);
    const upcomingConversations = teamSummaries.filter((m) => m.stats.nextConversation).length;

    return {
      totalGoals,
      completedGoals,
      completionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
      pendingReviews,
      overdue,
      upcomingConversations,
    };
  }, [teamSummaries]);

  const toggleExpand = (memberId: string) => {
    setExpandedMember(expandedMember === memberId ? null : memberId);
  };

  const getConversationDateLabel = (conversation: Conversation) => {
    const date = parseISO(conversation.scheduledDate);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    const days = differenceInDays(date, new Date());
    return `In ${days} days`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={600}>
            <Users className="h-5 w-5 inline mr-2" />
            Team Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Performance snapshot of your direct reports
          </Typography>
        </Box>
      </Stack>

      {/* Team Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent className="pt-4 pb-4">
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.100' }}>
                  <Users className="h-5 w-5 text-primary" />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    {directReports.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Team Members
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent className="pt-4 pb-4">
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'success.100' }}>
                  <Target className="h-5 w-5 text-green-600" />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    {teamStats.completionRate}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Goal Completion
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent className="pt-4 pb-4">
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'warning.100' }}>
                  <ClipboardCheck className="h-5 w-5 text-amber-600" />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    {teamStats.pendingReviews}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Pending Reviews
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent className="pt-4 pb-4">
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: teamStats.overdue > 0 ? 'error.100' : 'grey.100' }}>
                  <AlertTriangle className={cn('h-5 w-5', teamStats.overdue > 0 ? 'text-red-600' : 'text-gray-400')} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    {teamStats.overdue}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Overdue Goals
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Team Member List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Direct Reports</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Stack divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}>
            {teamSummaries.map((summary) => (
              <Box key={summary.staffMember.id}>
                {/* Member Row */}
                <Box
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => toggleExpand(summary.staffMember.id)}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ width: 40, height: 40 }}>
                      {summary.staffMember.avatar ? (
                        <img src={summary.staffMember.avatar} alt="" />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {summary.staffMember.firstName} {summary.staffMember.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {summary.staffMember.position}
                      </Typography>
                    </Box>

                    {/* Quick Stats */}
                    <Stack direction="row" spacing={3} alignItems="center">
                      <Box sx={{ textAlign: 'center', minWidth: 80 }}>
                        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                          <Target className="h-3.5 w-3.5 text-muted-foreground" />
                          <Typography variant="body2" fontWeight={600}>
                            {summary.stats.goalsCompleted}/{summary.stats.goalsTotal}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          Goals
                        </Typography>
                      </Box>

                      <Box sx={{ width: 100 }}>
                        <LinearProgress
                          variant="determinate"
                          value={summary.stats.avgProgress}
                          sx={{ height: 6, borderRadius: 3 }}
                          color={summary.stats.avgProgress >= 75 ? 'success' : 'primary'}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {summary.stats.avgProgress}% avg
                        </Typography>
                      </Box>

                      {summary.stats.pendingReview && (
                        <Chip
                          label="Review Due"
                          size="small"
                          sx={{ 
                            fontSize: '0.7rem',
                            bgcolor: 'rgba(251, 191, 36, 0.15)',
                            color: 'rgb(161, 98, 7)',
                          }}
                        />
                      )}

                      {summary.stats.overdue > 0 && (
                        <Chip
                          label={`${summary.stats.overdue} Overdue`}
                          size="small"
                          sx={{ 
                            fontSize: '0.7rem',
                            bgcolor: 'rgba(239, 68, 68, 0.12)',
                            color: 'rgb(185, 28, 28)',
                          }}
                        />
                      )}

                      {summary.stats.nextConversation && (
                        <Chip
                          icon={<Calendar className="h-3 w-3" />}
                          label={getConversationDateLabel(summary.stats.nextConversation)}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                    </Stack>

                    <IconButton size="small">
                      {expandedMember === summary.staffMember.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </IconButton>
                  </Stack>
                </Box>

                {/* Expanded Details */}
                <Collapse in={expandedMember === summary.staffMember.id}>
                  <Box sx={{ px: 3, pb: 3, pt: 1, bgcolor: 'grey.50' }}>
                    <Grid container spacing={3}>
                      {/* Goals */}
                      <Grid item xs={12} md={4}>
                        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Active Goals
                        </Typography>
                        <Stack spacing={1}>
                          {summary.goals
                            .filter((g) => g.status !== 'completed' && g.status !== 'cancelled')
                            .slice(0, 3)
                            .map((goal) => (
                              <Box
                                key={goal.id}
                                sx={{
                                  p: 1.5,
                                  bgcolor: 'background.paper',
                                  borderRadius: 1,
                                  border: 1,
                                  borderColor: 'divider',
                                  cursor: 'pointer',
                                  '&:hover': { borderColor: 'primary.main' },
                                }}
                                onClick={() => onViewGoal(goal)}
                              >
                                <Typography variant="body2" fontWeight={500} noWrap>
                                  {goal.title}
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={goal.progress}
                                    sx={{ flex: 1, height: 4, borderRadius: 2 }}
                                  />
                                  <Typography variant="caption">{goal.progress}%</Typography>
                                </Stack>
                              </Box>
                            ))}
                          {summary.goals.filter((g) => g.status !== 'completed').length === 0 && (
                            <Typography variant="body2" color="text.secondary">
                              No active goals
                            </Typography>
                          )}
                        </Stack>
                      </Grid>

                      {/* Reviews */}
                      <Grid item xs={12} md={4}>
                        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Reviews
                        </Typography>
                        <Stack spacing={1}>
                          {summary.reviews.slice(0, 2).map((review) => (
                            <Box
                              key={review.id}
                              sx={{
                                p: 1.5,
                                bgcolor: 'background.paper',
                                borderRadius: 1,
                                border: 1,
                                borderColor: 'divider',
                                cursor: 'pointer',
                                '&:hover': { borderColor: 'primary.main' },
                              }}
                              onClick={() => onViewReview(review)}
                            >
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="body2" fontWeight={500}>
                                  {review.reviewCycle.charAt(0).toUpperCase() + review.reviewCycle.slice(1)} Review
                                </Typography>
                                <Chip
                                  label={review.status.replace('_', ' ')}
                                  size="small"
                                  sx={{ 
                                    fontSize: '0.65rem',
                                    bgcolor: review.status === 'completed' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(251, 191, 36, 0.15)',
                                    color: review.status === 'completed' ? 'rgb(21, 128, 61)' : 'rgb(161, 98, 7)',
                                  }}
                                />
                              </Stack>
                              <Typography variant="caption" color="text.secondary">
                                {format(parseISO(review.periodStart), 'MMM yyyy')} - {format(parseISO(review.periodEnd), 'MMM yyyy')}
                              </Typography>
                            </Box>
                          ))}
                          {summary.reviews.length === 0 && (
                            <Typography variant="body2" color="text.secondary">
                              No reviews
                            </Typography>
                          )}
                        </Stack>
                      </Grid>

                      {/* Upcoming 1:1s */}
                      <Grid item xs={12} md={4}>
                        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Upcoming 1:1s
                        </Typography>
                        <Stack spacing={1}>
                          {summary.conversations
                            .filter((c) => !c.completed)
                            .slice(0, 2)
                            .map((conv) => (
                              <Box
                                key={conv.id}
                                sx={{
                                  p: 1.5,
                                  bgcolor: 'background.paper',
                                  borderRadius: 1,
                                  border: 1,
                                  borderColor: 'divider',
                                  cursor: 'pointer',
                                  '&:hover': { borderColor: 'primary.main' },
                                }}
                                onClick={() => onViewConversation(conv)}
                              >
                                <Typography variant="body2" fontWeight={500}>
                                  {conv.title}
                                </Typography>
                                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <Typography variant="caption" color="text.secondary">
                                    {format(parseISO(conv.scheduledDate), 'MMM d, h:mm a')}
                                  </Typography>
                                </Stack>
                              </Box>
                            ))}
                          {summary.conversations.filter((c) => !c.completed).length === 0 && (
                            <Typography variant="body2" color="text.secondary">
                              No upcoming meetings
                            </Typography>
                          )}
                        </Stack>
                      </Grid>
                    </Grid>
                  </Box>
                </Collapse>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
