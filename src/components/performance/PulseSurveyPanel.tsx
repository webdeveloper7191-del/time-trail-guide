import React, { useState } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Chip,
  Avatar,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SemanticProgressBar } from '@/components/performance/shared/SemanticProgressBar';
import { StatusBadge } from '@/components/performance/shared/StatusBadge';
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
  Users,
  MessageSquare,
  Eye,
  CheckCircle2,
  Clock,
  Star,
  MoreHorizontal,
  Play,
} from 'lucide-react';
import { 
  PulseSurvey, 
  ENPSResult,
  PulseResponse,
} from '@/types/advancedPerformance';
import { 
  mockPulseSurveys as initialSurveys, 
  mockENPSResults,
  mockPulseResponses,
  mockSurveyResults,
  SurveyResultSummary,
} from '@/data/mockAdvancedPerformanceData';
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
import { format } from 'date-fns';
import { CreateSurveyDrawer } from './CreateSurveyDrawer';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PulseSurveyPanelProps {
  currentUserId: string;
}

const getStatusVariant = (status: string): 'active' | 'draft' | 'paused' | 'completed' => {
  switch (status) {
    case 'active': return 'active';
    case 'draft': return 'draft';
    case 'paused': return 'paused';
    case 'completed': return 'completed';
    default: return 'draft';
  }
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    active: 'Active',
    draft: 'Draft',
    paused: 'Paused',
    completed: 'Completed',
  };
  return labels[status] || status;
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up': return <TrendingUp size={16} className="text-green-600" />;
    case 'down': return <TrendingDown size={16} className="text-red-600" />;
    default: return <Minus size={16} className="text-muted-foreground" />;
  }
};

const getENPSColor = (score: number) => {
  if (score >= 50) return 'hsl(var(--chart-2))';
  if (score >= 20) return 'hsl(var(--chart-1))';
  if (score >= 0) return 'hsl(var(--chart-4))';
  return 'hsl(var(--destructive))';
};

const getRatingColor = (rating: number) => {
  if (rating >= 4) return 'hsl(var(--chart-2))';
  if (rating >= 3) return 'hsl(var(--chart-1))';
  if (rating >= 2) return 'hsl(var(--chart-4))';
  return 'hsl(var(--destructive))';
};

export function PulseSurveyPanel({ currentUserId }: PulseSurveyPanelProps) {
  const [surveys, setSurveys] = useState(initialSurveys);
  const [selectedSurvey, setSelectedSurvey] = useState<PulseSurvey | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showResultsSheet, setShowResultsSheet] = useState(false);
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);

  const latestENPS = mockENPSResults[0];
  const activeSurveys = surveys.filter(s => s.status === 'active');
  const completedSurveys = surveys.filter(s => s.status === 'completed');

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

  const handleSendSurvey = (survey: PulseSurvey) => {
    setSurveys(prev => prev.map(s => 
      s.id === survey.id ? { ...s, status: 'active' as const } : s
    ));
    toast.success(`Survey "${survey.title}" sent to recipients`);
    setShowDetailSheet(false);
  };

  const getSurveyResults = (surveyId: string): SurveyResultSummary | undefined => {
    return mockSurveyResults.find(r => r.surveyId === surveyId);
  };

  const getSurveyResponses = (surveyId: string): PulseResponse[] => {
    return mockPulseResponses.filter(r => r.surveyId === surveyId);
  };

  const enpsChartData = mockENPSResults.slice().reverse().map(r => ({
    period: r.period,
    score: r.score,
    promoters: r.promoters,
    passives: r.passives,
    detractors: r.detractors,
  }));

  const handleViewSurvey = (survey: PulseSurvey) => {
    setSelectedSurvey(survey);
    const responses = getSurveyResponses(survey.id);
    if (survey.status === 'completed' || responses.length > 0) {
      setShowResultsSheet(true);
    } else {
      setShowDetailSheet(true);
    }
  };

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
        <Box sx={{ flex: 1, p: 2, bgcolor: 'hsl(var(--chart-2) / 0.1)', borderRadius: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <ThumbsUp size={16} className="text-green-600" />
            <Typography variant="caption" fontWeight={600} color="text.secondary">Promoters</Typography>
          </Stack>
          <Typography variant="h6" fontWeight={700} sx={{ color: 'hsl(var(--chart-2))' }}>
            {latestENPS.promoters}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, p: 2, bgcolor: 'hsl(var(--muted))', borderRadius: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Meh size={16} className="text-muted-foreground" />
            <Typography variant="caption" fontWeight={600} color="text.secondary">Passives</Typography>
          </Stack>
          <Typography variant="h6" fontWeight={700} color="text.secondary">
            {latestENPS.passives}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, p: 2, bgcolor: 'hsl(var(--destructive) / 0.1)', borderRadius: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <ThumbsDown size={16} className="text-red-600" />
            <Typography variant="caption" fontWeight={600} color="text.secondary">Detractors</Typography>
          </Stack>
          <Typography variant="h6" fontWeight={700} sx={{ color: 'hsl(var(--destructive))' }}>
            {latestENPS.detractors}
          </Typography>
        </Box>
      </Stack>

      {/* Trend Chart */}
      <Box sx={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={enpsChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="period" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis domain={[-100, 100]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="hsl(var(--primary))" 
              fill="hsl(var(--primary) / 0.2)" 
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Card>
  );

  const renderSurveyTable = (surveyList: PulseSurvey[], emptyMessage: string, emptyIcon: React.ReactNode) => {
    if (surveyList.length === 0) {
      return (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          {emptyIcon}
          <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 1 }}>
            {emptyMessage}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {surveyList === activeSurveys 
              ? 'Create a pulse survey to start gathering feedback'
              : 'Completed surveys will appear here with their results'
            }
          </Typography>
        </Card>
      );
    }

    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Survey</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold w-24">Status</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold w-24 text-center">Questions</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold w-32">Responses</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold w-28">Frequency</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold w-32 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {surveyList.map(survey => {
              const results = getSurveyResults(survey.id);
              const responses = getSurveyResponses(survey.id);
              const responseRate = results?.responseRate || (responses.length > 0 ? Math.round((responses.length / 10) * 100) : 0);
              const isActive = survey.status === 'active';
              
              return (
                <TableRow 
                  key={survey.id}
                  className="group hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleViewSurvey(survey)}
                  style={{
                    borderLeft: isActive ? '3px solid hsl(var(--chart-2))' : undefined,
                  }}
                >
                  <TableCell className="py-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{survey.title}</p>
                        {survey.anonymousResponses && (
                          <Badge variant="outline" className="text-[10px] py-0">Anonymous</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        Target: {survey.targetAudience === 'all' ? 'All Staff' : survey.targetAudience}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <StatusBadge 
                      status={getStatusVariant(survey.status)}
                      label={getStatusLabel(survey.status)}
                    />
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <Badge variant="secondary" className="font-normal">
                      {survey.questions.length}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="w-24">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{responses.length}</span>
                        <span className="text-xs text-muted-foreground">{responseRate}%</span>
                      </div>
                      <SemanticProgressBar value={responseRate} size="xs" />
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className="text-xs capitalize">
                      {survey.frequency}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      {survey.status === 'active' && (
                        <Button 
                          size="small" 
                          variant="contained"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewSurvey(survey);
                          }}
                        >
                          Results
                        </Button>
                      )}
                      <Button 
                        size="small" 
                        variant="text"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewSurvey(survey);
                        }}
                        sx={{ minWidth: 32, p: 0.5 }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="small" variant="text" sx={{ minWidth: 32, p: 0.5 }}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
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
              <StatusBadge 
                status={getStatusVariant(selectedSurvey.status)}
                label={getStatusLabel(selectedSurvey.status)}
              />
              <Badge variant="outline" className="capitalize">
                {selectedSurvey.frequency}
              </Badge>
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
                        <Badge variant="secondary" className="text-[10px]">
                          {q.type}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {q.category}
                        </Badge>
                        {q.required && (
                          <Badge className="text-[10px] bg-red-50 text-red-700 border border-red-200 hover:bg-red-50">
                            Required
                          </Badge>
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                </Card>
              ))}
            </Stack>

            <Box sx={{ mt: 4 }}>
              <Button 
                variant="contained" 
                fullWidth 
                startIcon={<Send size={16} />}
                onClick={() => handleSendSurvey(selectedSurvey)}
              >
                Send Survey Now
              </Button>
            </Box>
          </Box>
        </SheetContent>
      </Sheet>
    );
  };

  const renderResultsSheet = () => {
    if (!selectedSurvey) return null;

    const results = getSurveyResults(selectedSurvey.id);
    const responses = getSurveyResponses(selectedSurvey.id);

    return (
      <Sheet open={showResultsSheet} onOpenChange={setShowResultsSheet}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <BarChart3 size={20} />
              {selectedSurvey.title} - Results
            </SheetTitle>
          </SheetHeader>

          <Box sx={{ mt: 3 }}>
            {/* Summary Stats */}
            <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
              <Card sx={{ flex: 1, p: 2, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={700} color="primary.main">
                  {responses.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">Responses</Typography>
              </Card>
              <Card sx={{ flex: 1, p: 2, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={700} sx={{ color: 'hsl(var(--chart-2))' }}>
                  {results?.responseRate || Math.round((responses.length / 10) * 100)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">Response Rate</Typography>
              </Card>
              <Card sx={{ flex: 1, p: 2, textAlign: 'center' }}>
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                  {selectedSurvey.status === 'completed' ? (
                    <CheckCircle2 size={20} className="text-green-600" />
                  ) : (
                    <Clock size={20} className="text-blue-600" />
                  )}
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                  {selectedSurvey.status}
                </Typography>
              </Card>
            </Stack>

            {/* Question Results */}
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Question Results
            </Typography>

            <Stack spacing={3}>
              {results?.questionResults.map((qr, index) => (
                <Card key={qr.questionId} sx={{ p: 3 }}>
                  <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
                    <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'primary.main' }}>
                      {index + 1}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={500}>
                        {qr.questionText}
                      </Typography>
                      <Badge variant="secondary" className="text-[10px] mt-1 capitalize">
                        {qr.questionType}
                      </Badge>
                    </Box>
                    {qr.averageRating && (
                      <Box sx={{ textAlign: 'right' }}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Star size={16} style={{ color: getRatingColor(qr.averageRating), fill: getRatingColor(qr.averageRating) }} />
                          <Typography variant="h6" fontWeight={700} sx={{ color: getRatingColor(qr.averageRating) }}>
                            {qr.averageRating.toFixed(1)}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">avg rating</Typography>
                      </Box>
                    )}
                  </Stack>

                  {/* Rating Distribution Bar Chart */}
                  {qr.ratingDistribution && (
                    <Box sx={{ height: 120, mt: 2 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={qr.ratingDistribution} layout="vertical">
                          <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis 
                            dataKey="rating" 
                            type="category" 
                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} 
                            width={30}
                            tickFormatter={(v) => `${v}★`}
                          />
                          <Tooltip 
                            formatter={(value: number) => [`${value} responses`, 'Count']}
                          />
                          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                            {qr.ratingDistribution.map((entry, i) => (
                              <Cell 
                                key={`cell-${i}`} 
                                fill={
                                  entry.rating >= 4 ? 'hsl(var(--chart-2))' :
                                  entry.rating >= 3 ? 'hsl(var(--chart-1))' :
                                  entry.rating >= 2 ? 'hsl(var(--chart-4))' :
                                  'hsl(var(--destructive))'
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  )}

                  {/* Text Responses */}
                  {qr.textResponses && qr.textResponses.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary" gutterBottom>
                        Text Responses ({qr.textResponses.length})
                      </Typography>
                      <Stack spacing={1} sx={{ mt: 1 }}>
                        {qr.textResponses.map((text, i) => (
                          <Box 
                            key={i} 
                            sx={{ 
                              p: 1.5, 
                              bgcolor: 'hsl(var(--muted))', 
                              borderRadius: 1,
                              borderLeft: '3px solid hsl(var(--primary))',
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              "{text}"
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Card>
              ))}

              {/* If no processed results, show raw response count */}
              {!results && responses.length > 0 && (
                <Card sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {responses.length} responses collected. Results being processed...
                  </Typography>
                </Card>
              )}
            </Stack>
          </Box>

          <SheetFooter className="mt-6">
            <Button variant="outlined" onClick={() => setShowResultsSheet(false)}>
              Close
            </Button>
            <Button variant="contained" startIcon={<BarChart3 size={16} />}>
              Export Results
            </Button>
          </SheetFooter>
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

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card sx={{ p: 2, bgcolor: 'hsl(var(--chart-2) / 0.08)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/40">
              <Play className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeSurveys.length}</p>
              <p className="text-xs text-muted-foreground">Active Surveys</p>
            </div>
          </div>
        </Card>
        <Card sx={{ p: 2, bgcolor: 'hsl(var(--muted) / 0.5)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedSurveys.length}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
        </Card>
        <Card sx={{ p: 2, bgcolor: 'hsl(var(--primary) / 0.08)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {mockPulseResponses.length}
              </p>
              <p className="text-xs text-muted-foreground">Total Responses</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="enps" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="enps">eNPS Dashboard</TabsTrigger>
          <TabsTrigger value="surveys">Active Surveys ({activeSurveys.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedSurveys.length})</TabsTrigger>
          <TabsTrigger value="all">All Surveys</TabsTrigger>
        </TabsList>

        <TabsContent value="enps">
          {renderENPSCard()}
        </TabsContent>

        <TabsContent value="surveys">
          {renderSurveyTable(
            activeSurveys,
            'No active surveys',
            <MessageSquare size={40} className="mx-auto mb-2 text-muted-foreground" />
          )}
        </TabsContent>

        <TabsContent value="completed">
          {renderSurveyTable(
            completedSurveys,
            'No completed surveys',
            <CheckCircle2 size={40} className="mx-auto mb-2 text-muted-foreground" />
          )}
        </TabsContent>

        <TabsContent value="all">
          {renderSurveyTable(
            surveys,
            'No surveys yet',
            <MessageSquare size={40} className="mx-auto mb-2 text-muted-foreground" />
          )}
        </TabsContent>
      </Tabs>

      {renderSurveyDetailSheet()}
      {renderResultsSheet()}
      
      <CreateSurveyDrawer
        open={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        onSave={handleCreateSurvey}
      />
    </Box>
  );
}
