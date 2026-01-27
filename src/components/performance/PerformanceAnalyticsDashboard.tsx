import React, { useMemo } from 'react';
import {
  Box,
  Stack,
  Typography,
  Grid,
  Paper,
} from '@mui/material';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { Goal, PerformanceReview, Feedback, Conversation } from '@/types/performance';
import {
  Target,
  ClipboardCheck,
  MessageSquareHeart,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
} from 'lucide-react';

interface PerformanceAnalyticsDashboardProps {
  goals: Goal[];
  reviews: PerformanceReview[];
  feedback: Feedback[];
  conversations: Conversation[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export function PerformanceAnalyticsDashboard({
  goals,
  reviews,
  feedback,
  conversations,
}: PerformanceAnalyticsDashboardProps) {
  // Goal Statistics
  const goalStats = useMemo(() => {
    const total = goals.length;
    const completed = goals.filter((g) => g.status === 'completed').length;
    const inProgress = goals.filter((g) => g.status === 'in_progress').length;
    const overdue = goals.filter((g) => g.status === 'overdue').length;
    const notStarted = goals.filter((g) => g.status === 'not_started').length;
    const avgProgress = total > 0 ? goals.reduce((sum, g) => sum + g.progress, 0) / total : 0;

    return {
      total,
      completed,
      inProgress,
      overdue,
      notStarted,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      avgProgress: Math.round(avgProgress),
    };
  }, [goals]);

  const goalsByCategory = useMemo(() => {
    const categories: Record<string, number> = {};
    goals.forEach((g) => {
      categories[g.category] = (categories[g.category] || 0) + 1;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [goals]);

  const goalStatusData = useMemo(
    () => [
      { name: 'Completed', value: goalStats.completed, color: '#10b981' },
      { name: 'In Progress', value: goalStats.inProgress, color: '#3b82f6' },
      { name: 'Overdue', value: goalStats.overdue, color: '#ef4444' },
      { name: 'Not Started', value: goalStats.notStarted, color: '#9ca3af' },
    ],
    [goalStats]
  );

  // Review Statistics
  const reviewStats = useMemo(() => {
    const total = reviews.length;
    const completed = reviews.filter((r) => r.status === 'completed').length;
    const pending = reviews.filter((r) => r.status === 'pending_self' || r.status === 'pending_manager').length;

    const avgScore =
      reviews
        .filter((r) => r.overallManagerRating)
        .reduce((sum, r) => sum + (r.overallManagerRating || 0), 0) /
        (reviews.filter((r) => r.overallManagerRating).length || 1);

    return {
      total,
      completed,
      pending,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      avgScore: avgScore.toFixed(1),
    };
  }, [reviews]);

  // Feedback Statistics
  const feedbackStats = useMemo(() => {
    const total = feedback.length;
    const praise = feedback.filter((f) => f.type === 'praise').length;
    const constructive = feedback.filter((f) => f.type === 'constructive').length;
    const coaching = feedback.filter((f) => f.type === 'coaching').length;

    return {
      total,
      praise,
      constructive,
      coaching,
      praiseRate: total > 0 ? Math.round((praise / total) * 100) : 0,
    };
  }, [feedback]);

  const feedbackTypeData = useMemo(
    () => [
      { name: 'Praise', value: feedbackStats.praise, color: '#10b981' },
      { name: 'Constructive', value: feedbackStats.constructive, color: '#f59e0b' },
      { name: 'Coaching', value: feedbackStats.coaching, color: '#3b82f6' },
    ],
    [feedbackStats]
  );

  // Conversation Statistics
  const conversationStats = useMemo(() => {
    const total = conversations.length;
    const completed = conversations.filter((c) => c.completed).length;
    const upcoming = conversations.filter((c) => !c.completed).length;

    // Mock monthly data
    const monthlyData = [
      { month: 'Jan', count: 4 },
      { month: 'Feb', count: 6 },
      { month: 'Mar', count: 5 },
      { month: 'Apr', count: 8 },
      { month: 'May', count: 7 },
      { month: 'Jun', count: 9 },
    ];

    return {
      total,
      completed,
      upcoming,
      monthlyData,
      avgPerMonth: total > 0 ? Math.round(total / 6) : 0,
    };
  }, [conversations]);

  // Performance trend data (mock)
  const performanceTrendData = useMemo(
    () => [
      { month: 'Q1 2023', goals: 65, reviews: 3.8, feedback: 12 },
      { month: 'Q2 2023', goals: 72, reviews: 4.0, feedback: 18 },
      { month: 'Q3 2023', goals: 68, reviews: 3.9, feedback: 15 },
      { month: 'Q4 2023', goals: 78, reviews: 4.2, feedback: 22 },
      { month: 'Q1 2024', goals: 82, reviews: 4.3, feedback: 25 },
    ],
    []
  );

  const StatCard = ({
    icon,
    title,
    value,
    subtitle,
    trend,
    trendValue,
  }: {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    subtitle: string;
    trend?: 'up' | 'down';
    trendValue?: string;
  }) => (
    <Card>
      <CardContent className="pt-6">
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="caption" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ my: 0.5 }}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: trend === 'up' ? 'success.100' : trend === 'down' ? 'error.100' : 'grey.100',
            }}
          >
            {icon}
          </Box>
        </Stack>
        {trend && trendValue && (
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
            {trend === 'up' ? (
              <TrendingUp className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            )}
            <Typography
              variant="caption"
              sx={{ color: trend === 'up' ? 'success.main' : 'error.main' }}
            >
              {trendValue} from last period
            </Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
        Performance Analytics
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Target className="h-5 w-5 text-primary" />}
            title="Goal Completion"
            value={`${goalStats.completionRate}%`}
            subtitle={`${goalStats.completed} of ${goalStats.total} goals`}
            trend="up"
            trendValue="+8%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<ClipboardCheck className="h-5 w-5 text-blue-500" />}
            title="Avg Review Score"
            value={reviewStats.avgScore}
            subtitle={`${reviewStats.completed} reviews completed`}
            trend="up"
            trendValue="+0.3"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<MessageSquareHeart className="h-5 w-5 text-green-500" />}
            title="Feedback Given"
            value={feedbackStats.total}
            subtitle={`${feedbackStats.praiseRate}% positive`}
            trend="up"
            trendValue="+12"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<MessageSquare className="h-5 w-5 text-purple-500" />}
            title="1:1 Meetings"
            value={conversationStats.total}
            subtitle={`${conversationStats.avgPerMonth} avg/month`}
            trend="up"
            trendValue="+2"
          />
        </Grid>
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance Trends Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={performanceTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="goals"
                    name="Goal Completion %"
                    stroke="#10b981"
                    fill="#10b98133"
                  />
                  <Area
                    type="monotone"
                    dataKey="feedback"
                    name="Feedback Count"
                    stroke="#3b82f6"
                    fill="#3b82f633"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Goal Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={goalStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {goalStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Goals by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={goalsByCategory} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">1:1 Meeting Frequency</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={conversationStats.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Meetings" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Feedback Type Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={feedbackTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    dataKey="value"
                    label={({ name }) => name}
                  >
                    {feedbackTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.50' }}>
                    <CheckCircle2 className="h-6 w-6 mx-auto text-green-600 mb-1" />
                    <Typography variant="h6" fontWeight={600}>
                      {goalStats.completed}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Goals Completed
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.50' }}>
                    <Clock className="h-6 w-6 mx-auto text-amber-600 mb-1" />
                    <Typography variant="h6" fontWeight={600}>
                      {goalStats.inProgress}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      In Progress
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.50' }}>
                    <AlertTriangle className="h-6 w-6 mx-auto text-red-600 mb-1" />
                    <Typography variant="h6" fontWeight={600}>
                      {goalStats.overdue}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Overdue
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.50' }}>
                    <Users className="h-6 w-6 mx-auto text-blue-600 mb-1" />
                    <Typography variant="h6" fontWeight={600}>
                      {reviewStats.pending}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pending Reviews
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
