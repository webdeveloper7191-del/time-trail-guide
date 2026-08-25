import React from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Chip,
  LinearProgress,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Target,
  ClipboardCheck,
  MessageSquare,
  Smile,
  Users,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { Goal, PerformanceReview, Conversation, Feedback } from '@/types/performance';

interface PerformanceExecutiveDashboardProps {
  goals: Goal[];
  reviews: PerformanceReview[];
  conversations: Conversation[];
  feedback: Feedback[];
}

// Mock trend data
const mockTrendData = [
  { month: 'Aug', goalCompletion: 65, reviewCompletion: 70, happinessScore: 7.2, engagement: 72 },
  { month: 'Sep', goalCompletion: 68, reviewCompletion: 75, happinessScore: 7.5, engagement: 74 },
  { month: 'Oct', goalCompletion: 72, reviewCompletion: 78, happinessScore: 7.8, engagement: 76 },
  { month: 'Nov', goalCompletion: 70, reviewCompletion: 80, happinessScore: 7.4, engagement: 75 },
  { month: 'Dec', goalCompletion: 75, reviewCompletion: 85, happinessScore: 8.1, engagement: 80 },
  { month: 'Jan', goalCompletion: 78, reviewCompletion: 88, happinessScore: 7.9, engagement: 82 },
];

const COLORS = {
  primary: 'rgb(59, 130, 246)',
  success: 'rgb(34, 197, 94)',
  warning: 'rgb(251, 191, 36)',
  danger: 'rgb(239, 68, 68)',
  purple: 'rgb(168, 85, 247)',
};

export function PerformanceExecutiveDashboard({ 
  goals, 
  reviews, 
  conversations, 
  feedback 
}: PerformanceExecutiveDashboardProps) {
  // Calculate metrics
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const inProgressGoals = goals.filter(g => g.status === 'in_progress').length;
  const overdueGoals = goals.filter(g => g.status === 'overdue').length;
  const goalCompletionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  const totalReviews = reviews.length;
  const completedReviews = reviews.filter(r => r.status === 'completed').length;
  const pendingReviews = reviews.filter(r => r.status === 'pending_self' || r.status === 'pending_manager').length;
  const reviewCompletionRate = totalReviews > 0 ? Math.round((completedReviews / totalReviews) * 100) : 0;

  const completedConversations = conversations.filter(c => c.completed).length;
  const upcomingConversations = conversations.filter(c => !c.completed).length;

  const currentHappinessScore = 7.9;
  const previousHappinessScore = 8.1;
  const happinessChange = currentHappinessScore - previousHappinessScore;

  const eNPSScore = 42;
  const previousENPS = 38;
  const enpsChange = eNPSScore - previousENPS;

  // Goal status distribution for pie chart
  const goalDistribution = [
    { name: 'Completed', value: completedGoals, color: COLORS.success },
    { name: 'In Progress', value: inProgressGoals, color: COLORS.primary },
    { name: 'Overdue', value: overdueGoals, color: COLORS.danger },
    { name: 'Not Started', value: goals.filter(g => g.status === 'not_started').length, color: 'rgb(156, 163, 175)' },
  ].filter(d => d.value > 0);

  // Review status distribution
  const reviewDistribution = [
    { name: 'Completed', value: completedReviews, color: COLORS.success },
    { name: 'Pending Self', value: reviews.filter(r => r.status === 'pending_self').length, color: COLORS.warning },
    { name: 'Pending Manager', value: reviews.filter(r => r.status === 'pending_manager').length, color: COLORS.primary },
    { name: 'Draft', value: reviews.filter(r => r.status === 'draft').length, color: 'rgb(156, 163, 175)' },
  ].filter(d => d.value > 0);

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    change, 
    icon: Icon, 
    color,
    progress,
  }: { 
    title: string; 
    value: string | number; 
    subtitle?: string; 
    change?: number; 
    icon: any;
    color: string;
    progress?: number;
  }) => (
    <Card sx={{ p: 3, height: '100%' }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            {title}
          </Typography>
          <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mt: 0.5 }}>
            <Typography variant="h4" fontWeight={700}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Stack>
          {change !== undefined && (
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
              {getTrendIcon(change)}
              <Typography 
                variant="caption" 
                sx={{ color: change >= 0 ? 'rgb(22, 163, 74)' : 'rgb(220, 38, 38)' }}
              >
                {change >= 0 ? '+' : ''}{change.toFixed(1)} vs last month
              </Typography>
            </Stack>
          )}
          {progress !== undefined && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  bgcolor: 'action.hover',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: color,
                    borderRadius: 3,
                  },
                }} 
              />
            </Box>
          )}
        </Box>
        <Box sx={{ 
          p: 1.5, 
          borderRadius: 2, 
          bgcolor: `${color}15`,
        }}>
          <Icon style={{ color }} className="h-5 w-5" />
        </Box>
      </Stack>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Box>
        <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BarChart3 className="h-5 w-5 text-primary" />
          Performance Analytics Summary
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Executive overview of team performance metrics
        </Typography>
      </Box>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Goal Completion Rate"
          value={`${goalCompletionRate}%`}
          icon={Target}
          color={COLORS.primary}
          progress={goalCompletionRate}
        />
        <StatCard
          title="Review Completion Rate"
          value={`${reviewCompletionRate}%`}
          icon={ClipboardCheck}
          color={COLORS.success}
          progress={reviewCompletionRate}
        />
        <StatCard
          title="Happiness Score"
          value={currentHappinessScore.toFixed(1)}
          subtitle="/10"
          change={happinessChange}
          icon={Smile}
          color={COLORS.warning}
        />
        <StatCard
          title="eNPS Score"
          value={eNPSScore > 0 ? `+${eNPSScore}` : eNPSScore}
          change={enpsChange}
          icon={Award}
          color={COLORS.purple}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card sx={{ p: 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <Box>
              <Typography variant="h6" fontWeight={700}>{completedGoals}</Typography>
              <Typography variant="caption" color="text.secondary">Goals Completed</Typography>
            </Box>
          </Stack>
        </Card>
        <Card sx={{ p: 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <Box>
              <Typography variant="h6" fontWeight={700}>{overdueGoals}</Typography>
              <Typography variant="caption" color="text.secondary">Overdue Goals</Typography>
            </Box>
          </Stack>
        </Card>
        <Card sx={{ p: 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Clock className="h-5 w-5 text-amber-600" />
            <Box>
              <Typography variant="h6" fontWeight={700}>{pendingReviews}</Typography>
              <Typography variant="caption" color="text.secondary">Pending Reviews</Typography>
            </Box>
          </Stack>
        </Card>
        <Card sx={{ p: 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Calendar className="h-5 w-5 text-blue-600" />
            <Box>
              <Typography variant="h6" fontWeight={700}>{upcomingConversations}</Typography>
              <Typography variant="caption" color="text.secondary">Upcoming 1:1s</Typography>
            </Box>
          </Stack>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Performance Trends
          </Typography>
          <Box sx={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="goalCompletion" 
                  name="Goals"
                  stroke={COLORS.primary} 
                  fill={`${COLORS.primary}20`}
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="reviewCompletion" 
                  name="Reviews"
                  stroke={COLORS.success} 
                  fill={`${COLORS.success}20`}
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="engagement" 
                  name="Engagement"
                  stroke={COLORS.purple} 
                  fill={`${COLORS.purple}20`}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Card>

        {/* Distribution Charts */}
        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Status Distribution
          </Typography>
          <div className="grid grid-cols-2 gap-4">
            {/* Goals Pie */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block', mb: 1 }}>
                Goals
              </Typography>
              <Box sx={{ height: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={goalDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {goalDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Stack direction="row" justifyContent="center" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                {goalDistribution.map((item) => (
                  <Chip
                    key={item.name}
                    label={`${item.name}: ${item.value}`}
                    size="small"
                    sx={{ 
                      height: 20, 
                      fontSize: 10,
                      bgcolor: `${item.color}20`,
                      color: item.color,
                    }}
                  />
                ))}
              </Stack>
            </Box>

            {/* Reviews Pie */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block', mb: 1 }}>
                Reviews
              </Typography>
              <Box sx={{ height: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reviewDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {reviewDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Stack direction="row" justifyContent="center" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                {reviewDistribution.map((item) => (
                  <Chip
                    key={item.name}
                    label={`${item.name}: ${item.value}`}
                    size="small"
                    sx={{ 
                      height: 20, 
                      fontSize: 10,
                      bgcolor: `${item.color}20`,
                      color: item.color,
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </div>
        </Card>
      </div>

      {/* Feedback & Recognition Summary */}
      <Card sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Feedback & Recognition Activity
        </Typography>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="h4" fontWeight={700} color="primary.main">
              {feedback.filter(f => f.type === 'praise').length}
            </Typography>
            <Typography variant="caption" color="text.secondary">Praise Given</Typography>
          </Box>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="h4" fontWeight={700} color="success.main">
              {feedback.filter(f => f.type === 'constructive').length}
            </Typography>
            <Typography variant="caption" color="text.secondary">Constructive Feedback</Typography>
          </Box>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="h4" fontWeight={700} color="warning.main">
              {feedback.filter(f => f.type === 'coaching').length}
            </Typography>
            <Typography variant="caption" color="text.secondary">Coaching Sessions</Typography>
          </Box>
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="h4" fontWeight={700} color="secondary.main">
              {completedConversations}
            </Typography>
            <Typography variant="caption" color="text.secondary">1:1s Completed</Typography>
          </Box>
        </div>
      </Card>
    </div>
  );
}
