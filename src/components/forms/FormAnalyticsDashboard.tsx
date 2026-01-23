import { useState, useMemo } from 'react';
import {
  Box,
  Stack,
  Typography,
  Grid,
  LinearProgress,
  Avatar,
} from '@mui/material';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MapPin,
  Users,
  FileText,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
} from 'recharts';
import { mockFormTemplates, mockFormSubmissions } from '@/data/mockFormData';
import { format, subDays, startOfWeek, eachDayOfInterval } from 'date-fns';

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

interface AnalyticsData {
  completionRates: { name: string; completed: number; overdue: number; pending: number }[];
  failureHotspots: { location: string; role: string; failures: number; total: number; rate: number }[];
  trendData: { date: string; submissions: number; failures: number }[];
  statusBreakdown: { name: string; value: number; color: string }[];
  topTemplates: { name: string; submissions: number; passRate: number }[];
}

export function FormAnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  // Generate mock analytics data
  const analyticsData: AnalyticsData = useMemo(() => {
    // Completion rates by template
    const completionRates = mockFormTemplates.map(template => {
      const templateSubmissions = mockFormSubmissions.filter(s => s.templateId === template.id);
      return {
        name: template.name.length > 20 ? template.name.slice(0, 20) + '...' : template.name,
        completed: templateSubmissions.filter(s => s.status === 'approved').length * 15 + Math.floor(Math.random() * 20),
        overdue: Math.floor(Math.random() * 8),
        pending: templateSubmissions.filter(s => s.status === 'pending_review').length * 5 + Math.floor(Math.random() * 10),
      };
    });

    // Failure hotspots by location and role
    const locations = ['Building A', 'Building B', 'Warehouse', 'Office', 'Kitchen'];
    const roles = ['Supervisor', 'Technician', 'Cleaner', 'Security', 'Manager'];
    const failureHotspots = locations.flatMap(location => 
      roles.slice(0, 2).map(role => ({
        location,
        role,
        failures: Math.floor(Math.random() * 15),
        total: 20 + Math.floor(Math.random() * 30),
        rate: Math.floor(Math.random() * 30),
      }))
    ).sort((a, b) => b.rate - a.rate).slice(0, 8);

    // Trend data
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const trendData = eachDayOfInterval({
      start: subDays(new Date(), days),
      end: new Date(),
    }).map(date => ({
      date: format(date, 'MMM d'),
      submissions: Math.floor(Math.random() * 20) + 10,
      failures: Math.floor(Math.random() * 5),
    }));

    // Status breakdown
    const statusBreakdown = [
      { name: 'Approved', value: 45, color: '#22c55e' },
      { name: 'Pending Review', value: 25, color: '#f59e0b' },
      { name: 'Submitted', value: 15, color: '#3b82f6' },
      { name: 'Rejected', value: 8, color: '#ef4444' },
      { name: 'Draft', value: 7, color: '#94a3b8' },
    ];

    // Top templates
    const topTemplates = mockFormTemplates.map(t => ({
      name: t.name,
      submissions: Math.floor(Math.random() * 50) + 20,
      passRate: 70 + Math.floor(Math.random() * 25),
    })).sort((a, b) => b.submissions - a.submissions);

    return {
      completionRates,
      failureHotspots,
      trendData,
      statusBreakdown,
      topTemplates,
    };
  }, [dateRange]);

  // Summary stats
  const stats = useMemo(() => ({
    totalSubmissions: 234,
    completionRate: 87,
    overdueCount: 12,
    failureRate: 8,
    avgResponseTime: '2.3 hrs',
    trend: 5.2,
  }), []);

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 3 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <div>
          <Typography variant="h5" fontWeight={600}>Form Analytics</Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor completion rates, identify issues, and track performance
          </Typography>
        </div>
        <Stack direction="row" spacing={2}>
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </Stack>
      </Stack>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent className="py-4">
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <div>
                  <Typography variant="caption" color="text.secondary">Total Submissions</Typography>
                  <Typography variant="h4" fontWeight={600}>{stats.totalSubmissions}</Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <Typography variant="caption" color="success.main">
                      +{stats.trend}% vs last period
                    </Typography>
                  </Stack>
                </div>
                <Avatar sx={{ bgcolor: 'primary.lighter', width: 48, height: 48 }}>
                  <FileText className="h-6 w-6 text-primary" />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent className="py-4">
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <div>
                  <Typography variant="caption" color="text.secondary">Completion Rate</Typography>
                  <Typography variant="h4" fontWeight={600}>{stats.completionRate}%</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.completionRate} 
                    sx={{ mt: 1, height: 6, borderRadius: 3 }}
                    color="success"
                  />
                </div>
                <Avatar sx={{ bgcolor: 'success.lighter', width: 48, height: 48 }}>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent className="py-4">
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <div>
                  <Typography variant="caption" color="text.secondary">Overdue Forms</Typography>
                  <Typography variant="h4" fontWeight={600}>{stats.overdueCount}</Typography>
                  <Typography variant="caption" color="warning.main">
                    Requires attention
                  </Typography>
                </div>
                <Avatar sx={{ bgcolor: 'warning.lighter', width: 48, height: 48 }}>
                  <Clock className="h-6 w-6 text-orange-600" />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent className="py-4">
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <div>
                  <Typography variant="caption" color="text.secondary">Failure Rate</Typography>
                  <Typography variant="h4" fontWeight={600}>{stats.failureRate}%</Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <TrendingDown className="h-3 w-3 text-green-500" />
                    <Typography variant="caption" color="success.main">
                      -2.1% improvement
                    </Typography>
                  </Stack>
                </div>
                <Avatar sx={{ bgcolor: 'error.lighter', width: 48, height: 48 }}>
                  <XCircle className="h-6 w-6 text-red-600" />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Submission Trend */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Submission Trends</CardTitle>
              <CardDescription>Daily submissions and failures over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.trendData.slice(-14)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="submissions" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Submissions"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="failures" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Failures"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Status Breakdown */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status Breakdown</CardTitle>
              <CardDescription>Current submission statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={analyticsData.statusBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {analyticsData.statusBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <Stack spacing={1} sx={{ mt: 2 }}>
                {analyticsData.statusBreakdown.map((item) => (
                  <Stack key={item.name} direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color }} />
                      <Typography variant="caption">{item.name}</Typography>
                    </Stack>
                    <Typography variant="caption" fontWeight={600}>{item.value}%</Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={3}>
        {/* Completion Rates by Template */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Completion by Template</CardTitle>
              <CardDescription>Form completion status across templates</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.completionRates} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" stackId="a" fill="#22c55e" name="Completed" />
                  <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" />
                  <Bar dataKey="overdue" stackId="a" fill="#ef4444" name="Overdue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Failure Hotspots */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader>
              <Stack direction="row" alignItems="center" spacing={1}>
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <CardTitle className="text-base">Failure Hotspots</CardTitle>
                  <CardDescription>Locations and roles with highest failure rates</CardDescription>
                </div>
              </Stack>
            </CardHeader>
            <CardContent>
              <Stack spacing={2}>
                {analyticsData.failureHotspots.map((hotspot, index) => (
                  <Box key={index} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <Typography variant="body2" fontWeight={500}>{hotspot.location}</Typography>
                        <Typography variant="caption" color="text.secondary">•</Typography>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <Typography variant="caption">{hotspot.role}</Typography>
                        </Stack>
                      </Stack>
                      <Badge variant={hotspot.rate > 20 ? 'destructive' : hotspot.rate > 10 ? 'secondary' : 'outline'}>
                        {hotspot.rate}% failure
                      </Badge>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <LinearProgress
                        variant="determinate"
                        value={hotspot.rate}
                        sx={{ flex: 1, height: 6, borderRadius: 3 }}
                        color={hotspot.rate > 20 ? 'error' : hotspot.rate > 10 ? 'warning' : 'success'}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {hotspot.failures}/{hotspot.total}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
