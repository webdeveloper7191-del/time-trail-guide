import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Stack,
  Rating,
  Chip,
  Avatar,
  Paper,
  LinearProgress,
  IconButton,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Star,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  User,
  Shield,
  ThumbsUp,
  XCircle,
  ChevronRight,
  Filter,
} from 'lucide-react';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import {
  getAgencyPerformanceMetrics,
  getOverallAnalytics,
  AgencyPerformanceMetrics,
} from '@/lib/agencyRatingService';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';
import { format } from 'date-fns';

interface AgencyPerformanceDashboardProps {
  open: boolean;
  onClose: () => void;
  centreId?: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted))'];

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'primary',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: typeof TrendingUp;
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: 'primary' | 'success' | 'warning' | 'error';
}) {
  const colorMap = {
    primary: 'primary.main',
    success: 'success.main',
    warning: 'warning.main',
    error: 'error.main',
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box
            sx={{
              p: 1,
              borderRadius: 1,
              bgcolor: `${colorMap[color]}15`,
              color: colorMap[color],
            }}
          >
            <Icon size={20} />
          </Box>
          {trend && trendValue && (
            <Chip
              size="small"
              label={trendValue}
              color={trend === 'up' ? 'success' : 'error'}
              icon={trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              sx={{ height: 20, '& .MuiChip-label': { px: 0.5, fontSize: '0.7rem' } }}
            />
          )}
        </Stack>
        <Typography variant="h5" fontWeight="bold">
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}

function AgencyCard({
  agency,
  onSelect,
}: {
  agency: AgencyPerformanceMetrics;
  onSelect: () => void;
}) {
  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'success';
    if (rating >= 3.5) return 'warning';
    return 'error';
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
      }}
      onClick={onSelect}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
          <Building2 size={24} />
        </Avatar>
        
        <Box flex={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="subtitle1" fontWeight="medium">
              {agency.agencyName}
            </Typography>
            {agency.overallRating >= 4.5 && (
              <Chip size="small" label="Top Performer" color="success" sx={{ height: 20 }} />
            )}
            {agency.issueRate > 15 && (
              <Chip size="small" label="Needs Attention" color="error" sx={{ height: 20 }} />
            )}
          </Stack>
          
          <Stack direction="row" spacing={2} mt={0.5}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Rating value={agency.overallRating} precision={0.1} size="small" readOnly />
              <Typography variant="body2" color="text.secondary">
                ({agency.overallRating.toFixed(1)})
              </Typography>
            </Stack>
            
            <Typography variant="body2" color="text.secondary">
              {agency.totalPlacements} placements
            </Typography>
          </Stack>
        </Box>
        
        <Stack spacing={0.5} alignItems="flex-end">
          <Stack direction="row" spacing={1}>
            <Chip
              size="small"
              label={`${agency.fillRate.toFixed(0)}% fill`}
              color={agency.fillRate >= 85 ? 'success' : 'warning'}
              variant="outlined"
              sx={{ height: 20 }}
            />
            <Chip
              size="small"
              label={`${agency.avgResponseTime.toFixed(0)}m response`}
              variant="outlined"
              sx={{ height: 20 }}
            />
          </Stack>
        </Stack>
        
        <IconButton size="small">
          <ChevronRight size={20} />
        </IconButton>
      </Stack>
    </Paper>
  );
}

function AgencyDetailView({ agency }: { agency: AgencyPerformanceMetrics }) {
  return (
    <Stack spacing={3}>
      {/* Header */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
            <Building2 size={28} />
          </Avatar>
          <Box flex={1}>
            <Typography variant="h6">{agency.agencyName}</Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Rating value={agency.overallRating} precision={0.1} readOnly />
              <Typography variant="body2" color="text.secondary">
                {agency.overallRating.toFixed(1)} ({agency.totalPlacements} reviews)
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {/* KPI Cards */}
      <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2}>
        <MetricCard
          title="Fill Rate"
          value={`${agency.fillRate.toFixed(0)}%`}
          icon={CheckCircle2}
          trend={agency.fillRate >= 85 ? 'up' : 'down'}
          trendValue={agency.fillRate >= 85 ? '+3%' : '-2%'}
          color={agency.fillRate >= 85 ? 'success' : 'warning'}
        />
        <MetricCard
          title="Response Time"
          value={`${agency.avgResponseTime.toFixed(0)}m`}
          icon={Clock}
          trend={agency.avgResponseTime <= 30 ? 'up' : 'down'}
          trendValue={agency.avgResponseTime <= 30 ? '-5m' : '+8m'}
          color={agency.avgResponseTime <= 30 ? 'success' : 'warning'}
        />
        <MetricCard
          title="On-Time Rate"
          value={`${agency.onTimeRate.toFixed(0)}%`}
          icon={TrendingUp}
          color={agency.onTimeRate >= 90 ? 'success' : 'warning'}
        />
        <MetricCard
          title="Issue Rate"
          value={`${agency.issueRate.toFixed(1)}%`}
          icon={AlertTriangle}
          color={agency.issueRate <= 10 ? 'success' : 'error'}
        />
      </Box>

      {/* Category Ratings */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
          Category Ratings
        </Typography>
        <Stack spacing={2}>
          {[
            { label: 'Candidate Quality', value: agency.avgCandidateQuality, icon: User },
            { label: 'Communication', value: agency.avgCommunication, icon: Users },
            { label: 'Professionalism', value: agency.avgProfessionalism, icon: Shield },
            { label: 'Compliance', value: agency.avgCompliance, icon: CheckCircle2 },
          ].map((cat) => (
            <Stack key={cat.label} direction="row" alignItems="center" spacing={2}>
              <Box sx={{ width: 140, display: 'flex', alignItems: 'center', gap: 1 }}>
                <cat.icon size={16} className="text-muted-foreground" />
                <Typography variant="body2">{cat.label}</Typography>
              </Box>
              <Box flex={1}>
                <LinearProgress
                  variant="determinate"
                  value={(cat.value / 5) * 100}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'action.hover',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: cat.value >= 4 ? 'success.main' : cat.value >= 3 ? 'warning.main' : 'error.main',
                    },
                  }}
                />
              </Box>
              <Typography variant="body2" fontWeight="medium" sx={{ width: 40 }}>
                {cat.value.toFixed(1)}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Paper>

      {/* Performance Trend */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
          Performance Trend (Last 6 Months)
        </Typography>
        <Box height={200}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={agency.trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                }}
              />
              <Line
                type="monotone"
                dataKey="rating"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* Top Workers */}
      {agency.topWorkers.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
            Top Workers
          </Typography>
          <Stack spacing={1}>
            {agency.topWorkers.map((worker, index) => (
              <Stack
                key={worker.id}
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{ py: 1, borderBottom: index < agency.topWorkers.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  {worker.name.charAt(0)}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="body2" fontWeight="medium">
                    {worker.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {worker.shiftsCompleted} shifts completed
                  </Typography>
                </Box>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Star size={14} className="text-warning" />
                  <Typography variant="body2" fontWeight="medium">
                    {worker.rating.toFixed(1)}
                  </Typography>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}

export function AgencyPerformanceDashboard({ open, onClose, centreId }: AgencyPerformanceDashboardProps) {
  const [selectedAgency, setSelectedAgency] = useState<AgencyPerformanceMetrics | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'comparison'>('overview');
  const [sortBy, setSortBy] = useState<'rating' | 'placements' | 'fillRate'>('rating');

  const analytics = useMemo(() => getOverallAnalytics(), []);
  const agencies = useMemo(() => {
    const data = getAgencyPerformanceMetrics();
    return data.sort((a, b) => {
      if (sortBy === 'rating') return b.overallRating - a.overallRating;
      if (sortBy === 'placements') return b.totalPlacements - a.totalPlacements;
      return b.fillRate - a.fillRate;
    });
  }, [sortBy]);

  const pieData = useMemo(() => {
    return agencies.map(a => ({
      name: a.agencyName,
      value: a.totalPlacements,
    }));
  }, [agencies]);

  const comparisonData = useMemo(() => {
    return agencies.map(a => ({
      name: a.agencyName.split(' ')[0],
      rating: a.overallRating,
      fillRate: a.fillRate / 20,
      responseTime: (60 - a.avgResponseTime) / 12,
    }));
  }, [agencies]);

  return (
    <PrimaryOffCanvas open={open} onClose={onClose} title="Agency Performance Dashboard" size="4xl">
      {selectedAgency ? (
        <Box>
          <Button
            variant="text"
            size="small"
            onClick={() => setSelectedAgency(null)}
            sx={{ mb: 2 }}
          >
            ← Back to Overview
          </Button>
          <AgencyDetailView agency={selectedAgency} />
        </Box>
      ) : (
        <Stack spacing={3}>
          {/* Overview Stats */}
          <Box display="grid" gridTemplateColumns="repeat(4, 1fr)" gap={2}>
            <MetricCard
              title="Total Agencies"
              value={analytics.totalAgencies}
              icon={Building2}
              color="primary"
            />
            <MetricCard
              title="Total Placements"
              value={analytics.totalPlacements}
              subtitle="Last 30 days"
              icon={Users}
              trend="up"
              trendValue="+12%"
              color="success"
            />
            <MetricCard
              title="Avg. Rating"
              value={analytics.avgRating.toFixed(1)}
              icon={Star}
              color={analytics.avgRating >= 4 ? 'success' : 'warning'}
            />
            <MetricCard
              title="Avg. Fill Rate"
              value={`${analytics.avgFillRate.toFixed(0)}%`}
              icon={TrendingUp}
              trend="up"
              trendValue="+5%"
              color="success"
            />
          </Box>

          {/* Alerts */}
          {analytics.needsAttention.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, borderColor: 'warning.main', bgcolor: 'warning.main', opacity: 0.1 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <AlertTriangle size={20} className="text-warning" />
                <Typography variant="subtitle2">
                  {analytics.needsAttention.length} agencies need attention
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} mt={1}>
                {analytics.needsAttention.slice(0, 3).map(a => (
                  <Chip
                    key={a.agencyId}
                    size="small"
                    label={a.agencyName}
                    color="warning"
                    onClick={() => setSelectedAgency(a)}
                  />
                ))}
              </Stack>
            </Paper>
          )}

          {/* View Toggle */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, value) => value && setViewMode(value)}
              size="small"
            >
              <ToggleButton value="overview">
                <BarChart3 size={16} className="mr-1" /> Overview
              </ToggleButton>
              <ToggleButton value="comparison">
                <PieChart size={16} className="mr-1" /> Comparison
              </ToggleButton>
            </ToggleButtonGroup>

            <Stack direction="row" spacing={1}>
              <Chip
                label="Rating"
                variant={sortBy === 'rating' ? 'filled' : 'outlined'}
                onClick={() => setSortBy('rating')}
                size="small"
              />
              <Chip
                label="Placements"
                variant={sortBy === 'placements' ? 'filled' : 'outlined'}
                onClick={() => setSortBy('placements')}
                size="small"
              />
              <Chip
                label="Fill Rate"
                variant={sortBy === 'fillRate' ? 'filled' : 'outlined'}
                onClick={() => setSortBy('fillRate')}
                size="small"
              />
            </Stack>
          </Stack>

          {viewMode === 'comparison' && (
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              {/* Placements Distribution */}
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Placements Distribution
                </Typography>
                <Box height={200}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>

              {/* Performance Comparison */}
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Performance Comparison
                </Typography>
                <Box height={200}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 8,
                        }}
                      />
                      <Bar dataKey="rating" fill="hsl(var(--primary))" name="Rating" />
                      <Bar dataKey="fillRate" fill="hsl(var(--warning))" name="Fill Rate" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Box>
          )}

          {/* Agency List */}
          <Box>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              All Agencies ({agencies.length})
            </Typography>
            <Stack spacing={1}>
              {agencies.map((agency) => (
                <AgencyCard
                  key={agency.agencyId}
                  agency={agency}
                  onSelect={() => setSelectedAgency(agency)}
                />
              ))}
            </Stack>
          </Box>
        </Stack>
      )}
    </PrimaryOffCanvas>
  );
}

// Need to import Button
import { Button } from '@mui/material';
