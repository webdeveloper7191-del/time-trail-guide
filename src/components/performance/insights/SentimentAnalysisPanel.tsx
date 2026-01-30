import React, { useState, useMemo, useEffect } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Chip,
  Avatar,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui/Button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown,
  Minus,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Filter,
  Calendar,
} from 'lucide-react';
import { Feedback, feedbackTypeLabels } from '@/types/performance';
import { StaffMember } from '@/types/staff';
import { formatDistanceToNow, parseISO, format, subMonths } from 'date-fns';

interface SentimentAnalysisPanelProps {
  feedback: Feedback[];
  staff: StaffMember[];
  currentUserId: string;
}

type SentimentLabel = 'positive' | 'negative' | 'neutral';

interface SentimentResult {
  feedbackId: string;
  sentiment: SentimentLabel;
  score: number; // -1 to 1
  confidence: number; // 0 to 1
  keywords: string[];
}

interface SentimentTrend {
  month: string;
  positive: number;
  negative: number;
  neutral: number;
  avgScore: number;
}

// Simple rule-based sentiment analysis (no external dependencies)
function analyzeSentiment(text: string): { sentiment: SentimentLabel; score: number; confidence: number; keywords: string[] } {
  const positiveWords = [
    'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'outstanding', 'exceptional',
    'good', 'well', 'helpful', 'appreciate', 'thank', 'thanks', 'love', 'impressed',
    'professional', 'dedicated', 'reliable', 'supportive', 'creative', 'innovative',
    'brilliant', 'superb', 'perfect', 'awesome', 'incredible', 'remarkable', 'success'
  ];
  
  const negativeWords = [
    'poor', 'bad', 'terrible', 'awful', 'disappointing', 'frustrating', 'difficult',
    'problem', 'issue', 'concern', 'improve', 'better', 'lacks', 'missing', 'failed',
    'late', 'slow', 'confused', 'unclear', 'mistake', 'error', 'wrong', 'weak'
  ];
  
  const intensifiers = ['very', 'really', 'extremely', 'highly', 'absolutely', 'completely'];
  const negators = ['not', "n't", 'never', 'no', 'without'];
  
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  
  let positiveCount = 0;
  let negativeCount = 0;
  const foundKeywords: string[] = [];
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i].replace(/[^a-z]/g, '');
    const prevWord = i > 0 ? words[i - 1].replace(/[^a-z]/g, '') : '';
    const isNegated = negators.some(n => prevWord.includes(n));
    const hasIntensifier = intensifiers.includes(prevWord);
    const multiplier = hasIntensifier ? 1.5 : 1;
    
    if (positiveWords.includes(word)) {
      if (isNegated) {
        negativeCount += multiplier;
        foundKeywords.push(`not ${word}`);
      } else {
        positiveCount += multiplier;
        foundKeywords.push(word);
      }
    }
    
    if (negativeWords.includes(word)) {
      if (isNegated) {
        positiveCount += multiplier * 0.5; // Negated negative is weakly positive
      } else {
        negativeCount += multiplier;
        foundKeywords.push(word);
      }
    }
  }
  
  const total = positiveCount + negativeCount;
  let score = 0;
  let sentiment: SentimentLabel = 'neutral';
  let confidence = 0.5;
  
  if (total > 0) {
    score = (positiveCount - negativeCount) / total;
    confidence = Math.min(0.95, 0.5 + (total * 0.1));
    
    if (score > 0.2) sentiment = 'positive';
    else if (score < -0.2) sentiment = 'negative';
    else sentiment = 'neutral';
  }
  
  return {
    sentiment,
    score: Math.max(-1, Math.min(1, score)),
    confidence,
    keywords: [...new Set(foundKeywords)].slice(0, 5),
  };
}

const sentimentColors: Record<SentimentLabel, { bg: string; text: string; icon: React.ReactNode }> = {
  positive: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <ThumbsUp className="h-4 w-4" /> },
  negative: { bg: 'bg-red-50', text: 'text-red-700', icon: <ThumbsDown className="h-4 w-4" /> },
  neutral: { bg: 'bg-slate-50', text: 'text-slate-700', icon: <Minus className="h-4 w-4" /> },
};

export function SentimentAnalysisPanel({ feedback, staff, currentUserId }: SentimentAnalysisPanelProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<SentimentResult[]>([]);
  const [timeRange, setTimeRange] = useState<'all' | '3m' | '6m' | '1y'>('all');

  const getStaffMember = (staffId: string) => staff.find(s => s.id === staffId);

  // Analyze all feedback on mount
  useEffect(() => {
    setAnalyzing(true);
    
    // Simulate processing time
    setTimeout(() => {
      const analyzed = feedback.map(f => {
        const analysis = analyzeSentiment(f.message);
        return {
          feedbackId: f.id,
          ...analysis,
        };
      });
      setResults(analyzed);
      setAnalyzing(false);
    }, 500);
  }, [feedback]);

  // Filter by time range
  const filteredFeedback = useMemo(() => {
    if (timeRange === 'all') return feedback;
    
    const now = new Date();
    const cutoff = timeRange === '3m' ? subMonths(now, 3) :
                   timeRange === '6m' ? subMonths(now, 6) :
                   subMonths(now, 12);
    
    return feedback.filter(f => parseISO(f.createdAt) >= cutoff);
  }, [feedback, timeRange]);

  const filteredResults = useMemo(() => {
    const feedbackIds = new Set(filteredFeedback.map(f => f.id));
    return results.filter(r => feedbackIds.has(r.feedbackId));
  }, [results, filteredFeedback]);

  // Calculate stats
  const stats = useMemo(() => {
    const positive = filteredResults.filter(r => r.sentiment === 'positive').length;
    const negative = filteredResults.filter(r => r.sentiment === 'negative').length;
    const neutral = filteredResults.filter(r => r.sentiment === 'neutral').length;
    const total = filteredResults.length;
    
    const avgScore = total > 0 
      ? filteredResults.reduce((sum, r) => sum + r.score, 0) / total 
      : 0;
    
    return {
      positive,
      negative,
      neutral,
      total,
      avgScore,
      positiveRate: total > 0 ? (positive / total) * 100 : 0,
      negativeRate: total > 0 ? (negative / total) * 100 : 0,
    };
  }, [filteredResults]);

  // Pie chart data
  const pieData = [
    { name: 'Positive', value: stats.positive, color: '#10b981' },
    { name: 'Neutral', value: stats.neutral, color: '#94a3b8' },
    { name: 'Negative', value: stats.negative, color: '#ef4444' },
  ];

  // Trend data by month
  const trendData = useMemo(() => {
    const monthMap = new Map<string, { positive: number; negative: number; neutral: number; scores: number[] }>();
    
    filteredFeedback.forEach((f, idx) => {
      const month = format(parseISO(f.createdAt), 'MMM yyyy');
      const result = filteredResults[idx];
      
      if (!monthMap.has(month)) {
        monthMap.set(month, { positive: 0, negative: 0, neutral: 0, scores: [] });
      }
      
      const entry = monthMap.get(month)!;
      if (result) {
        entry[result.sentiment]++;
        entry.scores.push(result.score);
      }
    });
    
    return Array.from(monthMap.entries())
      .map(([month, data]) => ({
        month,
        ...data,
        avgScore: data.scores.length > 0 
          ? ((data.scores.reduce((a, b) => a + b, 0) / data.scores.length + 1) / 2) * 100 
          : 50,
      }))
      .slice(-6);
  }, [filteredFeedback, filteredResults]);

  // Top keywords
  const topKeywords = useMemo(() => {
    const keywordCounts = new Map<string, { count: number; sentiment: SentimentLabel }>();
    
    filteredResults.forEach(r => {
      r.keywords.forEach(kw => {
        const existing = keywordCounts.get(kw);
        if (existing) {
          existing.count++;
        } else {
          keywordCounts.set(kw, { count: 1, sentiment: r.sentiment });
        }
      });
    });
    
    return Array.from(keywordCounts.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10);
  }, [filteredResults]);

  if (analyzing) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={48} sx={{ mb: 2 }} />
        <Typography color="text.secondary">Analyzing feedback sentiment...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'secondary.light', display: 'flex' }}>
              <Brain className="h-5 w-5" style={{ color: 'var(--secondary)' }} />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              Sentiment Analysis
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            AI-powered analysis of feedback text for sentiment trends
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={1}>
          {(['3m', '6m', '1y', 'all'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setTimeRange(range)}
            >
              {range === 'all' ? 'All Time' : range.toUpperCase()}
            </Button>
          ))}
        </Stack>
      </Stack>

      {/* Stats Overview */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        <Card className="p-4">
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="caption" color="text.secondary">Total Analyzed</Typography>
              <Typography variant="h4" fontWeight={600}>{stats.total}</Typography>
            </Box>
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </Stack>
        </Card>
        
        <Card className="p-4 bg-emerald-50/50">
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="caption" color="text.secondary">Positive</Typography>
              <Typography variant="h4" fontWeight={600} color="success.main">
                {stats.positiveRate.toFixed(0)}%
              </Typography>
            </Box>
            <ThumbsUp className="h-8 w-8 text-emerald-500" />
          </Stack>
        </Card>
        
        <Card className="p-4 bg-red-50/50">
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="caption" color="text.secondary">Negative</Typography>
              <Typography variant="h4" fontWeight={600} color="error.main">
                {stats.negativeRate.toFixed(0)}%
              </Typography>
            </Box>
            <ThumbsDown className="h-8 w-8 text-red-500" />
          </Stack>
        </Card>
        
        <Card className="p-4">
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="caption" color="text.secondary">Avg Sentiment</Typography>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography variant="h4" fontWeight={600}>
                  {((stats.avgScore + 1) / 2 * 100).toFixed(0)}
                </Typography>
                {stats.avgScore > 0.1 ? (
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                ) : stats.avgScore < -0.1 ? (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                ) : (
                  <Minus className="h-5 w-5 text-slate-500" />
                )}
              </Stack>
            </Box>
            <Sparkles className="h-8 w-8 text-amber-500" />
          </Stack>
        </Card>
      </Box>

      {/* Charts Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 2fr' }, gap: 3 }}>
        {/* Pie Chart */}
        <Card className="p-4">
          <Typography variant="subtitle2" fontWeight={600} mb={2}>
            Sentiment Distribution
          </Typography>
          <Box sx={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Box>
          <Stack direction="row" justifyContent="center" spacing={2} mt={2}>
            {pieData.map((entry) => (
              <Stack key={entry.name} direction="row" alignItems="center" spacing={0.5}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: entry.color }} />
                <Typography variant="caption">{entry.name}: {entry.value}</Typography>
              </Stack>
            ))}
          </Stack>
        </Card>

        {/* Trend Chart */}
        <Card className="p-4">
          <Typography variant="subtitle2" fontWeight={600} mb={2}>
            Sentiment Trend Over Time
          </Typography>
          <Box sx={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="avgScore" name="Sentiment Score" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Card>
      </Box>

      {/* Keywords */}
      <Card className="p-4">
        <Typography variant="subtitle2" fontWeight={600} mb={2}>
          Top Keywords Detected
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {topKeywords.map(([keyword, data]) => {
            const colors = sentimentColors[data.sentiment];
            return (
              <Chip
                key={keyword}
                label={`${keyword} (${data.count})`}
                size="small"
                className={`${colors.bg} ${colors.text}`}
              />
            );
          })}
          {topKeywords.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No keywords detected yet
            </Typography>
          )}
        </Stack>
      </Card>

      {/* Recent Feedback with Sentiment */}
      <Box>
        <Typography variant="subtitle2" fontWeight={600} mb={2}>
          Recent Feedback Analysis
        </Typography>
        <Stack spacing={2}>
          {filteredFeedback.slice(0, 5).map((f) => {
            const result = results.find(r => r.feedbackId === f.id);
            const fromStaff = getStaffMember(f.fromStaffId);
            const toStaff = getStaffMember(f.toStaffId);
            const colors = result ? sentimentColors[result.sentiment] : sentimentColors.neutral;

            return (
              <Card key={f.id} className="p-3">
                <Stack direction="row" alignItems="flex-start" spacing={2}>
                  <Avatar src={fromStaff?.avatar} sx={{ width: 36, height: 36 }}>
                    {fromStaff?.firstName?.[0]}{fromStaff?.lastName?.[0]}
                  </Avatar>
                  
                  <Box flex={1} minWidth={0}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                      <Typography variant="body2" fontWeight={500}>
                        {fromStaff?.firstName} → {toStaff?.firstName}
                      </Typography>
                      <Chip
                        size="small"
                        label={feedbackTypeLabels[f.type]}
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {f.message}
                    </Typography>
                    {result && result.keywords.length > 0 && (
                      <Stack direction="row" spacing={0.5} mt={1} flexWrap="wrap">
                        {result.keywords.slice(0, 3).map(kw => (
                          <Badge key={kw} variant="outline" className="text-xs">
                            {kw}
                          </Badge>
                        ))}
                      </Stack>
                    )}
                  </Box>
                  
                  {result && (
                    <Box className={`px-2 py-1 rounded-md ${colors.bg} ${colors.text} flex items-center gap-1`}>
                      {colors.icon}
                      <span className="text-xs font-medium capitalize">{result.sentiment}</span>
                    </Box>
                  )}
                </Stack>
              </Card>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
}

export default SentimentAnalysisPanel;
