import React, { useState } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Chip,
  LinearProgress,
  Avatar,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { 
  BarChart3, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ThumbsUp,
  ThumbsDown,
  Meh,
  Send,
  Calendar,
  Users,
  MessageSquare,
} from 'lucide-react';
import { 
  PulseSurvey, 
  ENPSResult,
} from '@/types/advancedPerformance';
import { mockPulseSurveys as initialSurveys, mockENPSResults } from '@/data/mockAdvancedPerformanceData';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { CreateSurveyDrawer } from './CreateSurveyDrawer';
import { toast } from 'sonner';

interface PulseSurveyPanelProps {
  currentUserId: string;
}

const getSurveyStatusStyle = (status: string) => {
  const styles: Record<string, { bg: string; color: string }> = {
    active: { bg: 'rgba(34, 197, 94, 0.12)', color: 'rgb(22, 163, 74)' },
    draft: { bg: 'rgba(148, 163, 184, 0.12)', color: 'rgb(100, 116, 139)' },
    paused: { bg: 'rgba(251, 191, 36, 0.12)', color: 'rgb(161, 98, 7)' },
    completed: { bg: 'rgba(59, 130, 246, 0.12)', color: 'rgb(37, 99, 235)' },
  };
  return styles[status] || styles.draft;
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up': return <TrendingUp size={16} className="text-green-600" />;
    case 'down': return <TrendingDown size={16} className="text-red-600" />;
    default: return <Minus size={16} className="text-gray-500" />;
  }
};

const getENPSColor = (score: number) => {
  if (score >= 50) return 'rgb(22, 163, 74)';
  if (score >= 20) return 'rgb(59, 130, 246)';
  if (score >= 0) return 'rgb(251, 191, 36)';
  return 'rgb(239, 68, 68)';
};

export function PulseSurveyPanel({ currentUserId }: PulseSurveyPanelProps) {
  const [surveys, setSurveys] = useState(initialSurveys);
  const [selectedSurvey, setSelectedSurvey] = useState<PulseSurvey | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);

  const latestENPS = mockENPSResults[0];
  const activeSurveys = surveys.filter(s => s.status === 'active');

  const handleCreateSurvey = (newSurvey: Partial<PulseSurvey>) => {
    const survey: PulseSurvey = {
      ...newSurvey as PulseSurvey,
      createdBy: currentUserId,
      startDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSurveys(prev => [...prev, survey]);
    toast.success('Survey created successfully');
  };

  const enpsChartData = mockENPSResults.slice().reverse().map(r => ({
    period: r.period,
    score: r.score,
    promoters: r.promoters,
    passives: r.passives,
    detractors: r.detractors,
  }));

  const renderENPSCard = () => (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Employee Net Promoter Score
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
            <Typography variant="h3" fontWeight={700} sx={{ color: getENPSColor(latestENPS.score) }}>
              {latestENPS.score > 0 ? '+' : ''}{latestENPS.score}
            </Typography>
            {getTrendIcon(latestENPS.trend)}
            {latestENPS.previousScore !== undefined && (
              <Typography variant="body2" color="text.secondary">
                vs {latestENPS.previousScore > 0 ? '+' : ''}{latestENPS.previousScore}
              </Typography>
            )}
          </Stack>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" color="text.secondary">Response Rate</Typography>
          <Typography variant="h6" fontWeight={600}>{latestENPS.responseRate}%</Typography>
        </Box>
      </Stack>

      {/* Promoters/Passives/Detractors Breakdown */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Box sx={{ flex: 1, p: 2, bgcolor: 'rgba(34, 197, 94, 0.08)', borderRadius: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <ThumbsUp size={16} className="text-green-600" />
            <Typography variant="caption" fontWeight={600} color="text.secondary">Promoters</Typography>
          </Stack>
          <Typography variant="h6" fontWeight={700} sx={{ color: 'rgb(22, 163, 74)' }}>
            {latestENPS.promoters}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, p: 2, bgcolor: 'rgba(148, 163, 184, 0.08)', borderRadius: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Meh size={16} className="text-gray-500" />
            <Typography variant="caption" fontWeight={600} color="text.secondary">Passives</Typography>
          </Stack>
          <Typography variant="h6" fontWeight={700} sx={{ color: 'rgb(100, 116, 139)' }}>
            {latestENPS.passives}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, p: 2, bgcolor: 'rgba(239, 68, 68, 0.08)', borderRadius: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <ThumbsDown size={16} className="text-red-600" />
            <Typography variant="caption" fontWeight={600} color="text.secondary">Detractors</Typography>
          </Stack>
          <Typography variant="h6" fontWeight={700} sx={{ color: 'rgb(220, 38, 38)' }}>
            {latestENPS.detractors}
          </Typography>
        </Box>
      </Stack>

      {/* Trend Chart */}
      <Box sx={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={enpsChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
            <XAxis dataKey="period" tick={{ fontSize: 12 }} />
            <YAxis domain={[-100, 100]} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="rgb(59, 130, 246)" 
              fill="rgba(59, 130, 246, 0.2)" 
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Card>
  );

  const renderSurveyCard = (survey: PulseSurvey) => {
    const statusStyle = getSurveyStatusStyle(survey.status);
    
    return (
      <Card 
        key={survey.id} 
        sx={{ 
          p: 3,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' },
        }}
        onClick={() => {
          setSelectedSurvey(survey);
          setShowDetailSheet(true);
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              {survey.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {survey.questions.length} questions • {survey.frequency}
            </Typography>
          </Box>
          <Chip 
            label={survey.status}
            size="small"
            sx={{ 
              textTransform: 'capitalize',
              bgcolor: statusStyle.bg,
              color: statusStyle.color,
            }}
          />
        </Stack>

        <Stack direction="row" spacing={2}>
          {survey.anonymousResponses && (
            <Chip label="Anonymous" size="small" variant="outlined" sx={{ fontSize: 11 }} />
          )}
          <Chip 
            label={survey.targetAudience === 'all' ? 'All Staff' : survey.targetAudience}
            size="small" 
            variant="outlined" 
            sx={{ fontSize: 11, textTransform: 'capitalize' }} 
          />
        </Stack>
      </Card>
    );
  };

  const renderSurveyDetailSheet = () => {
    if (!selectedSurvey) return null;

    return (
      <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedSurvey.title}</SheetTitle>
          </SheetHeader>

          <Box sx={{ mt: 3 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
              <Chip 
                label={selectedSurvey.status}
                size="small"
                sx={{ 
                  textTransform: 'capitalize',
                  ...getSurveyStatusStyle(selectedSurvey.status),
                }}
              />
              <Chip 
                label={selectedSurvey.frequency}
                size="small"
                variant="outlined"
                sx={{ textTransform: 'capitalize' }}
              />
            </Stack>

            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Questions ({selectedSurvey.questions.length})
            </Typography>
            <Stack spacing={2}>
              {selectedSurvey.questions.map((q, index) => (
                <Card key={q.id} sx={{ p: 2 }}>
                  <Stack direction="row" spacing={2}>
                    <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'primary.main' }}>
                      {index + 1}
                    </Avatar>
                    <Box>
                      <Typography variant="body2">{q.text}</Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Chip 
                          label={q.type}
                          size="small"
                          sx={{ fontSize: 10, height: 20, textTransform: 'capitalize' }}
                        />
                        <Chip 
                          label={q.category}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: 10, height: 20, textTransform: 'capitalize' }}
                        />
                        {q.required && (
                          <Chip 
                            label="Required"
                            size="small"
                            sx={{ 
                              fontSize: 10, 
                              height: 20,
                              bgcolor: 'rgba(239, 68, 68, 0.12)',
                              color: 'rgb(220, 38, 38)',
                            }}
                          />
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                </Card>
              ))}
            </Stack>

            <Box sx={{ mt: 4 }}>
              <Button variant="contained" fullWidth startIcon={<Send size={16} />}>
                Send Survey Now
              </Button>
            </Box>
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
            Pulse Surveys & eNPS
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quick engagement checks and employee satisfaction tracking
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowCreateDrawer(true)}>
          Create Survey
        </Button>
      </Stack>

      <Tabs defaultValue="enps" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="enps">eNPS Dashboard</TabsTrigger>
          <TabsTrigger value="surveys">Active Surveys ({activeSurveys.length})</TabsTrigger>
          <TabsTrigger value="all">All Surveys</TabsTrigger>
        </TabsList>

        <TabsContent value="enps">
          {renderENPSCard()}
        </TabsContent>

        <TabsContent value="surveys">
          <div className="grid gap-4 md:grid-cols-2">
            {activeSurveys.map(renderSurveyCard)}
            {activeSurveys.length === 0 && (
              <Card sx={{ p: 4, textAlign: 'center', gridColumn: '1/-1' }}>
                <MessageSquare size={40} className="mx-auto mb-2 text-muted-foreground" />
                <Typography variant="subtitle1" fontWeight={600}>No active surveys</Typography>
                <Typography variant="body2" color="text.secondary">
                  Create a pulse survey to start gathering feedback
                </Typography>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="all">
          <div className="grid gap-4 md:grid-cols-2">
            {surveys.map(renderSurveyCard)}
          </div>
        </TabsContent>
      </Tabs>

      {renderSurveyDetailSheet()}
      
      <CreateSurveyDrawer
        open={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        onSave={handleCreateSurvey}
      />
    </Box>
  );
}
