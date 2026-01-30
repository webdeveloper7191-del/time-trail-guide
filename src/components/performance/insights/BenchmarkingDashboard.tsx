import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Chip,
  Tooltip,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui/Button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Target,
  Award,
  Users,
  AlertTriangle,
  CheckCircle2,
  Info,
  Building2,
  Globe,
} from 'lucide-react';
import { Goal, PerformanceReview, Feedback } from '@/types/performance';

interface BenchmarkingDashboardProps {
  goals: Goal[];
  reviews: PerformanceReview[];
  feedback: Feedback[];
}

type Industry = 'technology' | 'healthcare' | 'retail' | 'finance' | 'manufacturing' | 'education';

interface BenchmarkMetric {
  id: string;
  name: string;
  category: 'performance' | 'engagement' | 'development' | 'retention';
  yourValue: number;
  industryAvg: number;
  topQuartile: number;
  unit: string;
  higherIsBetter: boolean;
}

// Industry benchmark data (mock)
const industryBenchmarks: Record<Industry, BenchmarkMetric[]> = {
  technology: [
    { id: 'goal-completion', name: 'Goal Completion Rate', category: 'performance', yourValue: 0, industryAvg: 72, topQuartile: 85, unit: '%', higherIsBetter: true },
    { id: 'review-completion', name: 'Review Completion', category: 'performance', yourValue: 0, industryAvg: 88, topQuartile: 95, unit: '%', higherIsBetter: true },
    { id: 'feedback-frequency', name: 'Feedback per Employee', category: 'engagement', yourValue: 0, industryAvg: 4.2, topQuartile: 6.5, unit: '/qtr', higherIsBetter: true },
    { id: 'enps', name: 'Employee NPS', category: 'engagement', yourValue: 0, industryAvg: 32, topQuartile: 55, unit: '', higherIsBetter: true },
    { id: 'training-hours', name: 'Training Hours', category: 'development', yourValue: 0, industryAvg: 24, topQuartile: 40, unit: 'hrs/yr', higherIsBetter: true },
    { id: 'promotion-rate', name: 'Internal Promotion Rate', category: 'development', yourValue: 0, industryAvg: 15, topQuartile: 25, unit: '%', higherIsBetter: true },
    { id: 'turnover', name: 'Voluntary Turnover', category: 'retention', yourValue: 0, industryAvg: 13, topQuartile: 8, unit: '%', higherIsBetter: false },
    { id: 'retention', name: '1-Year Retention', category: 'retention', yourValue: 0, industryAvg: 82, topQuartile: 92, unit: '%', higherIsBetter: true },
  ],
  healthcare: [
    { id: 'goal-completion', name: 'Goal Completion Rate', category: 'performance', yourValue: 0, industryAvg: 68, topQuartile: 82, unit: '%', higherIsBetter: true },
    { id: 'review-completion', name: 'Review Completion', category: 'performance', yourValue: 0, industryAvg: 92, topQuartile: 98, unit: '%', higherIsBetter: true },
    { id: 'feedback-frequency', name: 'Feedback per Employee', category: 'engagement', yourValue: 0, industryAvg: 3.5, topQuartile: 5.5, unit: '/qtr', higherIsBetter: true },
    { id: 'enps', name: 'Employee NPS', category: 'engagement', yourValue: 0, industryAvg: 28, topQuartile: 48, unit: '', higherIsBetter: true },
    { id: 'training-hours', name: 'Training Hours', category: 'development', yourValue: 0, industryAvg: 32, topQuartile: 50, unit: 'hrs/yr', higherIsBetter: true },
    { id: 'promotion-rate', name: 'Internal Promotion Rate', category: 'development', yourValue: 0, industryAvg: 12, topQuartile: 20, unit: '%', higherIsBetter: true },
    { id: 'turnover', name: 'Voluntary Turnover', category: 'retention', yourValue: 0, industryAvg: 18, topQuartile: 10, unit: '%', higherIsBetter: false },
    { id: 'retention', name: '1-Year Retention', category: 'retention', yourValue: 0, industryAvg: 78, topQuartile: 88, unit: '%', higherIsBetter: true },
  ],
  retail: [
    { id: 'goal-completion', name: 'Goal Completion Rate', category: 'performance', yourValue: 0, industryAvg: 65, topQuartile: 78, unit: '%', higherIsBetter: true },
    { id: 'review-completion', name: 'Review Completion', category: 'performance', yourValue: 0, industryAvg: 75, topQuartile: 88, unit: '%', higherIsBetter: true },
    { id: 'feedback-frequency', name: 'Feedback per Employee', category: 'engagement', yourValue: 0, industryAvg: 2.8, topQuartile: 4.5, unit: '/qtr', higherIsBetter: true },
    { id: 'enps', name: 'Employee NPS', category: 'engagement', yourValue: 0, industryAvg: 22, topQuartile: 40, unit: '', higherIsBetter: true },
    { id: 'training-hours', name: 'Training Hours', category: 'development', yourValue: 0, industryAvg: 16, topQuartile: 28, unit: 'hrs/yr', higherIsBetter: true },
    { id: 'promotion-rate', name: 'Internal Promotion Rate', category: 'development', yourValue: 0, industryAvg: 18, topQuartile: 28, unit: '%', higherIsBetter: true },
    { id: 'turnover', name: 'Voluntary Turnover', category: 'retention', yourValue: 0, industryAvg: 25, topQuartile: 15, unit: '%', higherIsBetter: false },
    { id: 'retention', name: '1-Year Retention', category: 'retention', yourValue: 0, industryAvg: 70, topQuartile: 82, unit: '%', higherIsBetter: true },
  ],
  finance: [
    { id: 'goal-completion', name: 'Goal Completion Rate', category: 'performance', yourValue: 0, industryAvg: 75, topQuartile: 88, unit: '%', higherIsBetter: true },
    { id: 'review-completion', name: 'Review Completion', category: 'performance', yourValue: 0, industryAvg: 95, topQuartile: 99, unit: '%', higherIsBetter: true },
    { id: 'feedback-frequency', name: 'Feedback per Employee', category: 'engagement', yourValue: 0, industryAvg: 5.0, topQuartile: 7.5, unit: '/qtr', higherIsBetter: true },
    { id: 'enps', name: 'Employee NPS', category: 'engagement', yourValue: 0, industryAvg: 35, topQuartile: 58, unit: '', higherIsBetter: true },
    { id: 'training-hours', name: 'Training Hours', category: 'development', yourValue: 0, industryAvg: 28, topQuartile: 45, unit: 'hrs/yr', higherIsBetter: true },
    { id: 'promotion-rate', name: 'Internal Promotion Rate', category: 'development', yourValue: 0, industryAvg: 14, topQuartile: 22, unit: '%', higherIsBetter: true },
    { id: 'turnover', name: 'Voluntary Turnover', category: 'retention', yourValue: 0, industryAvg: 12, topQuartile: 7, unit: '%', higherIsBetter: false },
    { id: 'retention', name: '1-Year Retention', category: 'retention', yourValue: 0, industryAvg: 85, topQuartile: 93, unit: '%', higherIsBetter: true },
  ],
  manufacturing: [
    { id: 'goal-completion', name: 'Goal Completion Rate', category: 'performance', yourValue: 0, industryAvg: 70, topQuartile: 82, unit: '%', higherIsBetter: true },
    { id: 'review-completion', name: 'Review Completion', category: 'performance', yourValue: 0, industryAvg: 85, topQuartile: 94, unit: '%', higherIsBetter: true },
    { id: 'feedback-frequency', name: 'Feedback per Employee', category: 'engagement', yourValue: 0, industryAvg: 3.0, topQuartile: 5.0, unit: '/qtr', higherIsBetter: true },
    { id: 'enps', name: 'Employee NPS', category: 'engagement', yourValue: 0, industryAvg: 25, topQuartile: 42, unit: '', higherIsBetter: true },
    { id: 'training-hours', name: 'Training Hours', category: 'development', yourValue: 0, industryAvg: 20, topQuartile: 35, unit: 'hrs/yr', higherIsBetter: true },
    { id: 'promotion-rate', name: 'Internal Promotion Rate', category: 'development', yourValue: 0, industryAvg: 10, topQuartile: 18, unit: '%', higherIsBetter: true },
    { id: 'turnover', name: 'Voluntary Turnover', category: 'retention', yourValue: 0, industryAvg: 15, topQuartile: 9, unit: '%', higherIsBetter: false },
    { id: 'retention', name: '1-Year Retention', category: 'retention', yourValue: 0, industryAvg: 80, topQuartile: 90, unit: '%', higherIsBetter: true },
  ],
  education: [
    { id: 'goal-completion', name: 'Goal Completion Rate', category: 'performance', yourValue: 0, industryAvg: 78, topQuartile: 90, unit: '%', higherIsBetter: true },
    { id: 'review-completion', name: 'Review Completion', category: 'performance', yourValue: 0, industryAvg: 90, topQuartile: 97, unit: '%', higherIsBetter: true },
    { id: 'feedback-frequency', name: 'Feedback per Employee', category: 'engagement', yourValue: 0, industryAvg: 4.5, topQuartile: 7.0, unit: '/qtr', higherIsBetter: true },
    { id: 'enps', name: 'Employee NPS', category: 'engagement', yourValue: 0, industryAvg: 38, topQuartile: 60, unit: '', higherIsBetter: true },
    { id: 'training-hours', name: 'Training Hours', category: 'development', yourValue: 0, industryAvg: 35, topQuartile: 55, unit: 'hrs/yr', higherIsBetter: true },
    { id: 'promotion-rate', name: 'Internal Promotion Rate', category: 'development', yourValue: 0, industryAvg: 8, topQuartile: 15, unit: '%', higherIsBetter: true },
    { id: 'turnover', name: 'Voluntary Turnover', category: 'retention', yourValue: 0, industryAvg: 10, topQuartile: 6, unit: '%', higherIsBetter: false },
    { id: 'retention', name: '1-Year Retention', category: 'retention', yourValue: 0, industryAvg: 88, topQuartile: 95, unit: '%', higherIsBetter: true },
  ],
};

const industryLabels: Record<Industry, string> = {
  technology: 'Technology',
  healthcare: 'Healthcare',
  retail: 'Retail',
  finance: 'Financial Services',
  manufacturing: 'Manufacturing',
  education: 'Education',
};

const categoryColors: Record<string, { bg: string; text: string }> = {
  performance: { bg: 'bg-blue-50', text: 'text-blue-700' },
  engagement: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  development: { bg: 'bg-violet-50', text: 'text-violet-700' },
  retention: { bg: 'bg-amber-50', text: 'text-amber-700' },
};

export function BenchmarkingDashboard({ goals, reviews, feedback }: BenchmarkingDashboardProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<Industry>('technology');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Calculate actual metrics from data
  const calculatedMetrics = useMemo(() => {
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const totalGoals = goals.length;
    const goalCompletionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

    const completedReviews = reviews.filter(r => r.status === 'completed').length;
    const totalReviews = reviews.length;
    const reviewCompletionRate = totalReviews > 0 ? (completedReviews / totalReviews) * 100 : 0;

    const feedbackCount = feedback.length;
    const uniqueEmployees = new Set([...feedback.map(f => f.toStaffId), ...feedback.map(f => f.fromStaffId)]).size;
    const feedbackPerEmployee = uniqueEmployees > 0 ? feedbackCount / uniqueEmployees : 0;

    // Mock values for metrics we can't calculate from current data
    return {
      'goal-completion': Math.round(goalCompletionRate) || 68,
      'review-completion': Math.round(reviewCompletionRate) || 85,
      'feedback-frequency': Math.round(feedbackPerEmployee * 10) / 10 || 4.8,
      'enps': 42, // Mock
      'training-hours': 28, // Mock
      'promotion-rate': 18, // Mock
      'turnover': 11, // Mock
      'retention': 86, // Mock
    };
  }, [goals, reviews, feedback]);

  // Get benchmarks with calculated values
  const benchmarks = useMemo(() => {
    return industryBenchmarks[selectedIndustry].map(b => ({
      ...b,
      yourValue: calculatedMetrics[b.id as keyof typeof calculatedMetrics] || 0,
    }));
  }, [selectedIndustry, calculatedMetrics]);

  const filteredBenchmarks = useMemo(() => {
    if (selectedCategory === 'all') return benchmarks;
    return benchmarks.filter(b => b.category === selectedCategory);
  }, [benchmarks, selectedCategory]);

  // Calculate overall performance score
  const overallScore = useMemo(() => {
    let score = 0;
    let count = 0;

    benchmarks.forEach(b => {
      const performance = b.higherIsBetter
        ? (b.yourValue / b.topQuartile) * 100
        : (b.topQuartile / Math.max(b.yourValue, 1)) * 100;
      score += Math.min(100, performance);
      count++;
    });

    return count > 0 ? Math.round(score / count) : 0;
  }, [benchmarks]);

  // Radar chart data
  const radarData = useMemo(() => {
    const categories = ['performance', 'engagement', 'development', 'retention'];
    
    return categories.map(cat => {
      const catMetrics = benchmarks.filter(b => b.category === cat);
      const avgYourValue = catMetrics.reduce((sum, b) => {
        const normalized = b.higherIsBetter
          ? (b.yourValue / b.topQuartile) * 100
          : (b.topQuartile / Math.max(b.yourValue, 1)) * 100;
        return sum + Math.min(100, normalized);
      }, 0) / catMetrics.length;

      const avgIndustry = catMetrics.reduce((sum, b) => {
        const normalized = b.higherIsBetter
          ? (b.industryAvg / b.topQuartile) * 100
          : (b.topQuartile / Math.max(b.industryAvg, 1)) * 100;
        return sum + Math.min(100, normalized);
      }, 0) / catMetrics.length;

      return {
        category: cat.charAt(0).toUpperCase() + cat.slice(1),
        You: Math.round(avgYourValue),
        Industry: Math.round(avgIndustry),
        TopQuartile: 100,
      };
    });
  }, [benchmarks]);

  const getPerformanceStatus = (metric: BenchmarkMetric) => {
    if (metric.higherIsBetter) {
      if (metric.yourValue >= metric.topQuartile) return 'excellent';
      if (metric.yourValue >= metric.industryAvg) return 'good';
      return 'needs-improvement';
    } else {
      if (metric.yourValue <= metric.topQuartile) return 'excellent';
      if (metric.yourValue <= metric.industryAvg) return 'good';
      return 'needs-improvement';
    }
  };

  const statusConfig = {
    excellent: { icon: <Award className="h-4 w-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Top Performer' },
    good: { icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Above Average' },
    'needs-improvement': { icon: <AlertTriangle className="h-4 w-4" />, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Below Average' },
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'info.light', display: 'flex' }}>
              <BarChart3 className="h-5 w-5" style={{ color: 'var(--info)' }} />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              Industry Benchmarking
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Compare your performance metrics against industry standards
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={2}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Industry</InputLabel>
            <MuiSelect
              value={selectedIndustry}
              label="Industry"
              onChange={(e) => setSelectedIndustry(e.target.value as Industry)}
            >
              {Object.entries(industryLabels).map(([key, label]) => (
                <MenuItem key={key} value={key}>{label}</MenuItem>
              ))}
            </MuiSelect>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Category</InputLabel>
            <MuiSelect
              value={selectedCategory}
              label="Category"
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <MenuItem value="all">All Categories</MenuItem>
              <MenuItem value="performance">Performance</MenuItem>
              <MenuItem value="engagement">Engagement</MenuItem>
              <MenuItem value="development">Development</MenuItem>
              <MenuItem value="retention">Retention</MenuItem>
            </MuiSelect>
          </FormControl>
        </Stack>
      </Stack>

      {/* Overall Score Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
        <Box sx={{ p: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems={{ md: 'center' }}>
            <Box sx={{ textAlign: { xs: 'left', md: 'center' }, minWidth: 140 }}>
              <Typography variant="caption" color="text.secondary">Overall Score</Typography>
              <Typography variant="h2" fontWeight={700} color="primary.main">
                {overallScore}
              </Typography>
              <Typography variant="caption" color="text.secondary">out of 100</Typography>
            </Box>
            
            <Box flex={1}>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>
                Performance Summary
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Compared to {industryLabels[selectedIndustry]} industry benchmarks
              </Typography>
              
              <Stack direction="row" spacing={3} flexWrap="wrap">
                {['excellent', 'good', 'needs-improvement'].map((status) => {
                  const count = filteredBenchmarks.filter(b => getPerformanceStatus(b) === status).length;
                  const config = statusConfig[status as keyof typeof statusConfig];
                  return (
                    <Stack key={status} direction="row" alignItems="center" spacing={1}>
                      <Box className={`p-1 rounded ${config.bg} ${config.color}`}>
                        {config.icon}
                      </Box>
                      <Typography variant="body2">
                        {count} {config.label}
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Card>

      {/* Charts Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
        {/* Radar Chart */}
        <Card className="p-4">
          <Typography variant="subtitle2" fontWeight={600} mb={2}>
            Performance by Category
          </Typography>
          <Box sx={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="You" dataKey="You" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                <Radar name="Industry Avg" dataKey="Industry" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.2} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </Box>
        </Card>

        {/* Bar Chart */}
        <Card className="p-4">
          <Typography variant="subtitle2" fontWeight={600} mb={2}>
            Key Metrics Comparison
          </Typography>
          <Box sx={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredBenchmarks.slice(0, 6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                <ChartTooltip />
                <Bar dataKey="yourValue" name="Your Value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="industryAvg" name="Industry Avg" fill="#94a3b8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Card>
      </Box>

      {/* Metrics Detail Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
        {filteredBenchmarks.map((metric) => {
          const status = getPerformanceStatus(metric);
          const config = statusConfig[status];
          const catColors = categoryColors[metric.category];
          
          const percentile = metric.higherIsBetter
            ? Math.min(100, (metric.yourValue / metric.topQuartile) * 100)
            : Math.min(100, (metric.topQuartile / Math.max(metric.yourValue, 1)) * 100);

          return (
            <Card key={metric.id} className="p-4">
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box>
                  <Badge className={`${catColors.bg} ${catColors.text} text-xs mb-1`}>
                    {metric.category}
                  </Badge>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {metric.name}
                  </Typography>
                </Box>
                <Tooltip title={config.label}>
                  <Box className={`p-1.5 rounded-full ${config.bg} ${config.color}`}>
                    {config.icon}
                  </Box>
                </Tooltip>
              </Stack>

              <Typography variant="h4" fontWeight={700} mb={1}>
                {metric.yourValue}{metric.unit}
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Progress value={percentile} className="h-2" />
              </Box>

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">
                  Industry: {metric.industryAvg}{metric.unit}
                </Typography>
                <Typography variant="caption" color="success.main">
                  Top: {metric.topQuartile}{metric.unit}
                </Typography>
              </Stack>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}

export default BenchmarkingDashboard;
