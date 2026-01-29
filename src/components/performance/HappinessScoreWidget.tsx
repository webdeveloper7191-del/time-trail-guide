import React, { useState } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Slider,
  Avatar,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui/Button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { 
  Smile, 
  Frown, 
  Meh, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  Send,
  ChevronRight,
  Users,
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { format, subMonths } from 'date-fns';
import { toast } from 'sonner';

interface HappinessScoreWidgetProps {
  currentUserId: string;
  isManager?: boolean;
}

interface HappinessEntry {
  id: string;
  staffId: string;
  score: number;
  comment?: string;
  date: string;
}

// Mock data for happiness scores
const mockHappinessHistory: { period: string; score: number; responseCount: number }[] = [
  { period: 'Aug 2024', score: 7.2, responseCount: 8 },
  { period: 'Sep 2024', score: 7.5, responseCount: 10 },
  { period: 'Oct 2024', score: 7.8, responseCount: 9 },
  { period: 'Nov 2024', score: 7.4, responseCount: 11 },
  { period: 'Dec 2024', score: 8.1, responseCount: 10 },
  { period: 'Jan 2025', score: 7.9, responseCount: 8 },
];

const mockTeamScores = [
  { staffId: 'staff-1', name: 'Mark Thompson', score: 8, trend: 'up' },
  { staffId: 'staff-2', name: 'Sarah Williams', score: 9, trend: 'up' },
  { staffId: 'staff-3', name: 'Emma Davis', score: 7, trend: 'stable' },
  { staffId: 'staff-4', name: 'James Wilson', score: 6, trend: 'down' },
];

const mockDistribution = [
  { range: '1-3', count: 1, label: 'Low', color: 'rgb(239, 68, 68)' },
  { range: '4-6', count: 2, label: 'Moderate', color: 'rgb(251, 191, 36)' },
  { range: '7-8', count: 4, label: 'Good', color: 'rgb(59, 130, 246)' },
  { range: '9-10', count: 3, label: 'Excellent', color: 'rgb(34, 197, 94)' },
];

export function HappinessScoreWidget({ currentUserId, isManager = false }: HappinessScoreWidgetProps) {
  const [showSubmitSheet, setShowSubmitSheet] = useState(false);
  const [score, setScore] = useState<number>(7);
  const [comment, setComment] = useState('');
  const [hasSubmittedThisMonth, setHasSubmittedThisMonth] = useState(false);

  const currentScore = mockHappinessHistory[mockHappinessHistory.length - 1]?.score || 0;
  const previousScore = mockHappinessHistory[mockHappinessHistory.length - 2]?.score || currentScore;
  const trend = currentScore > previousScore ? 'up' : currentScore < previousScore ? 'down' : 'stable';
  const change = currentScore - previousScore;

  const getScoreColor = (s: number) => {
    if (s >= 8) return 'rgb(34, 197, 94)';
    if (s >= 6) return 'rgb(59, 130, 246)';
    if (s >= 4) return 'rgb(251, 191, 36)';
    return 'rgb(239, 68, 68)';
  };

  const getScoreEmoji = (s: number) => {
    if (s >= 8) return <Smile className="h-6 w-6 text-green-500" />;
    if (s >= 5) return <Meh className="h-6 w-6 text-amber-500" />;
    return <Frown className="h-6 w-6 text-red-500" />;
  };

  const getTrendIcon = (t: string) => {
    if (t === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (t === 'down') return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const handleSubmitScore = () => {
    if (score < 1 || score > 10) return;
    
    toast.success('Thanks for sharing how you feel! Your response is anonymous.');
    setShowSubmitSheet(false);
    setHasSubmittedThisMonth(true);
    setComment('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'stretch', sm: 'flex-start' }}
        spacing={2}
      >
        <Box>
          <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Smile className="h-5 w-5 text-primary" />
            Happiness Score
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monthly team happiness tracking
          </Typography>
        </Box>
        {!hasSubmittedThisMonth && (
          <Button 
            variant="contained" 
            startIcon={<Send size={16} />} 
            onClick={() => setShowSubmitSheet(true)}
          >
            Submit My Score
          </Button>
        )}
      </Stack>

      {/* Main Score Card */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        <Card sx={{ flex: 1, p: 3 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
            <Box>
              <Typography variant="caption" color="text.secondary">
                Team Happiness Score
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                <Typography 
                  variant="h2" 
                  fontWeight={700} 
                  sx={{ color: getScoreColor(currentScore) }}
                >
                  {currentScore.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">/10</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
                {getTrendIcon(trend)}
                <Typography 
                  variant="body2" 
                  sx={{ color: change >= 0 ? 'rgb(22, 163, 74)' : 'rgb(220, 38, 38)' }}
                >
                  {change >= 0 ? '+' : ''}{change.toFixed(1)} vs last month
                </Typography>
              </Stack>
            </Box>
            {getScoreEmoji(currentScore)}
          </Stack>

          {/* Response Rate */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Users className="h-4 w-4 text-muted-foreground" />
                <Typography variant="body2" color="text.secondary">
                  Response Rate
                </Typography>
              </Stack>
              <Typography variant="subtitle2" fontWeight={600}>
                {mockHappinessHistory[mockHappinessHistory.length - 1]?.responseCount || 0} / 10 (80%)
              </Typography>
            </Stack>
          </Box>
        </Card>

        {/* Distribution Card */}
        <Card sx={{ flex: 1, p: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Score Distribution
          </Typography>
          <Box sx={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockDistribution} layout="vertical">
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="label" 
                  width={70}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value} responses`, 'Count']}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {mockDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Card>
      </Stack>

      {/* Trend Chart */}
      <Card sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Happiness Trend
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Typography variant="caption" color="text.secondary">
              Last 6 months
            </Typography>
          </Stack>
        </Stack>
        <Box sx={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockHappinessHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis 
                dataKey="period" 
                tick={{ fontSize: 12 }}
                tickLine={false}
              />
              <YAxis 
                domain={[0, 10]} 
                tick={{ fontSize: 12 }}
                tickLine={false}
                ticks={[0, 2, 4, 6, 8, 10]}
              />
              <Tooltip 
                formatter={(value: number) => [value.toFixed(1), 'Score']}
                labelStyle={{ fontWeight: 600 }}
              />
              <defs>
                <linearGradient id="happinessGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="rgb(59, 130, 246)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="rgb(59, 130, 246)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="rgb(59, 130, 246)" 
                fill="url(#happinessGradient)"
                strokeWidth={2}
                dot={{ fill: 'rgb(59, 130, 246)', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: 'rgb(59, 130, 246)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Card>

      {/* Team Breakdown (Manager View) */}
      {isManager && (
        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Team Member Scores
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Individual scores are kept anonymous unless team members choose to share
          </Typography>
          <Stack spacing={2}>
            {mockTeamScores.map((member) => (
              <Stack 
                key={member.staffId} 
                direction="row" 
                alignItems="center" 
                spacing={2}
                sx={{ 
                  p: 2, 
                  borderRadius: 1, 
                  bgcolor: 'action.hover',
                }}
              >
                <Avatar sx={{ width: 36, height: 36 }}>
                  {member.name.split(' ').map(n => n[0]).join('')}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={500}>
                    {member.name}
                  </Typography>
                </Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box 
                    sx={{ 
                      px: 1.5, 
                      py: 0.5, 
                      borderRadius: 1, 
                      bgcolor: `${getScoreColor(member.score)}20`,
                      color: getScoreColor(member.score),
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {member.score}/10
                  </Box>
                  {getTrendIcon(member.trend)}
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Card>
      )}

      {/* Submit Score Sheet */}
      <Sheet open={showSubmitSheet} onOpenChange={setShowSubmitSheet}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Smile size={20} />
              How are you feeling?
            </SheetTitle>
          </SheetHeader>

          <Box sx={{ mt: 4 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Your response is <strong>completely anonymous</strong>. We use these scores to understand team wellbeing and identify areas for improvement.
            </Typography>

            {/* Score Slider */}
            <Box sx={{ px: 2, mb: 4 }}>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} sx={{ mb: 3 }}>
                <Typography 
                  variant="h1" 
                  fontWeight={700} 
                  sx={{ color: getScoreColor(score) }}
                >
                  {score}
                </Typography>
                <Typography variant="h4" color="text.secondary">/10</Typography>
              </Stack>
              <Slider
                value={score}
                onChange={(_, value) => setScore(value as number)}
                min={1}
                max={10}
                step={1}
                marks={[
                  { value: 1, label: '😢' },
                  { value: 5, label: '😐' },
                  { value: 10, label: '😊' },
                ]}
                sx={{
                  '& .MuiSlider-thumb': {
                    bgcolor: getScoreColor(score),
                  },
                  '& .MuiSlider-track': {
                    bgcolor: getScoreColor(score),
                    borderColor: getScoreColor(score),
                  },
                  '& .MuiSlider-markLabel': {
                    fontSize: 20,
                  },
                }}
              />
            </Box>

            {/* Score Labels */}
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 4, px: 1 }}>
              <Typography variant="caption" color="text.secondary">Very Unhappy</Typography>
              <Typography variant="caption" color="text.secondary">Very Happy</Typography>
            </Stack>

            {/* Optional Comment */}
            <Box>
              <Typography variant="caption" fontWeight={500} gutterBottom sx={{ display: 'block' }}>
                Any comments? (Optional)
              </Typography>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share what's on your mind..."
                rows={3}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Your comment will remain anonymous
              </Typography>
            </Box>
          </Box>

          <SheetFooter className="mt-6">
            <Button variant="outlined" onClick={() => setShowSubmitSheet(false)}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSubmitScore}>
              Submit Score
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
