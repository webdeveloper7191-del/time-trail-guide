import React, { useState } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Chip,
  Avatar,
  IconButton,
  LinearProgress,
  Divider,
} from '@mui/material';
import { Card } from '@/components/mui/Card';
import { Button } from '@/components/mui/Button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Plus, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Eye,
  UserCheck,
  UserX,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';
import { 
  Feedback360Request, 
  Feedback360Response, 
  Feedback360Competency,
  feedbackSourceLabels,
  feedback360StatusLabels,
  FeedbackSourceType,
} from '@/types/advancedPerformance';
import { 
  mock360Requests, 
  mock360Responses, 
  mock360Competencies 
} from '@/data/mockAdvancedPerformanceData';
import { mockStaff } from '@/data/mockStaffData';
import { format } from 'date-fns';
import { Request360FeedbackDrawer } from './Request360FeedbackDrawer';
import { toast } from 'sonner';

interface Feedback360PanelProps {
  currentUserId: string;
}

const getStatusChipStyle = (status: string) => {
  const styles: Record<string, { bg: string; color: string }> = {
    completed: { bg: 'rgba(34, 197, 94, 0.12)', color: 'rgb(22, 163, 74)' },
    in_progress: { bg: 'rgba(59, 130, 246, 0.12)', color: 'rgb(37, 99, 235)' },
    pending: { bg: 'rgba(251, 191, 36, 0.12)', color: 'rgb(161, 98, 7)' },
    expired: { bg: 'rgba(239, 68, 68, 0.12)', color: 'rgb(220, 38, 38)' },
    draft: { bg: 'rgba(148, 163, 184, 0.12)', color: 'rgb(100, 116, 139)' },
  };
  return styles[status] || styles.draft;
};

const getSourceChipStyle = (source: string) => {
  const styles: Record<string, { bg: string; color: string }> = {
    self: { bg: 'rgba(139, 92, 246, 0.12)', color: 'rgb(124, 58, 237)' },
    manager: { bg: 'rgba(59, 130, 246, 0.12)', color: 'rgb(37, 99, 235)' },
    peer: { bg: 'rgba(34, 197, 94, 0.12)', color: 'rgb(22, 163, 74)' },
    direct_report: { bg: 'rgba(236, 72, 153, 0.12)', color: 'rgb(219, 39, 119)' },
    cross_functional: { bg: 'rgba(251, 191, 36, 0.12)', color: 'rgb(161, 98, 7)' },
    external: { bg: 'rgba(148, 163, 184, 0.12)', color: 'rgb(100, 116, 139)' },
  };
  return styles[source] || styles.peer;
};

export function Feedback360Panel({ currentUserId }: Feedback360PanelProps) {
  const [selectedRequest, setSelectedRequest] = useState<Feedback360Request | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showRequest360Drawer, setShowRequest360Drawer] = useState(false);
  const [activeTab, setActiveTab] = useState('active');

  const getStaffName = (id: string) => {
    const staff = mockStaff.find(s => s.id === id);
    return staff ? `${staff.firstName} ${staff.lastName}` : 'Unknown';
  };

  const getResponsesForRequest = (requestId: string) => {
    return mock360Responses.filter(r => r.requestId === requestId);
  };

  const getCompletionStats = (requestId: string) => {
    const responses = getResponsesForRequest(requestId);
    const completed = responses.filter(r => r.status === 'completed').length;
    const total = responses.length;
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const activeRequests = mock360Requests.filter(r => ['pending', 'in_progress'].includes(r.status));
  const completedRequests = mock360Requests.filter(r => r.status === 'completed');

  const handleViewRequest = (request: Feedback360Request) => {
    setSelectedRequest(request);
    setShowDetailSheet(true);
  };

  const handleSubmit360Request = async (data: {
    subjectStaffId: string;
    title: string;
    description: string;
    dueDate: string;
    anonymousResponses: boolean;
    includeSelfAssessment: boolean;
    selectedCompetencies: string[];
    responders: { staffId: string; sourceType: FeedbackSourceType }[];
  }) => {
    // In a real app, this would call an API
    console.log('Creating 360 feedback request:', data);
    toast.success(`360° feedback request created for ${getStaffName(data.subjectStaffId)}`);
  };

  const renderRequestCard = (request: Feedback360Request) => {
    const stats = getCompletionStats(request.id);
    const statusStyle = getStatusChipStyle(request.status);
    const subjectName = getStaffName(request.subjectStaffId);

    return (
      <Card 
        key={request.id} 
        sx={{ 
          p: 3, 
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': { 
            boxShadow: 3,
            transform: 'translateY(-2px)',
          } 
        }}
        onClick={() => handleViewRequest(request)}
      >
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                {request.title}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                  {subjectName.charAt(0)}
                </Avatar>
                <Typography variant="body2" color="text.secondary">
                  {subjectName}
                </Typography>
              </Stack>
            </Box>
            <Chip 
              label={feedback360StatusLabels[request.status]} 
              size="small"
              sx={{ 
                backgroundColor: statusStyle.bg,
                color: statusStyle.color,
                fontWeight: 500,
              }}
            />
          </Stack>

          <Box>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Responses: {stats.completed}/{stats.total}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stats.percentage}%
              </Typography>
            </Stack>
            <LinearProgress 
              variant="determinate" 
              value={stats.percentage} 
              sx={{ 
                height: 6, 
                borderRadius: 1,
                bgcolor: 'rgba(0,0,0,0.08)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: stats.percentage === 100 ? 'success.main' : 'primary.main',
                }
              }}
            />
          </Box>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1}>
              {request.anonymousResponses && (
                <Chip 
                  label="Anonymous" 
                  size="small" 
                  variant="outlined"
                  sx={{ fontSize: 11, height: 24 }}
                />
              )}
              {request.selfAssessmentCompleted && (
                <Chip 
                  icon={<CheckCircle2 size={12} />}
                  label="Self Done" 
                  size="small"
                  sx={{ 
                    fontSize: 11, 
                    height: 24,
                    bgcolor: 'rgba(34, 197, 94, 0.12)',
                    color: 'rgb(22, 163, 74)',
                    '& .MuiChip-icon': { color: 'inherit' }
                  }}
                />
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Due: {format(new Date(request.dueDate), 'MMM d, yyyy')}
            </Typography>
          </Stack>
        </Stack>
      </Card>
    );
  };

  const renderDetailSheet = () => {
    if (!selectedRequest) return null;
    
    const responses = getResponsesForRequest(selectedRequest.id);
    const subjectName = getStaffName(selectedRequest.subjectStaffId);

    const calculateAverageByCompetency = (competencyId: string) => {
      const completedResponses = responses.filter(r => r.status === 'completed');
      const ratings = completedResponses
        .flatMap(r => r.ratings)
        .filter(r => r.competencyId === competencyId);
      if (ratings.length === 0) return null;
      return ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    };

    return (
      <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedRequest.title}</SheetTitle>
          </SheetHeader>

          <Box sx={{ mt: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <Avatar sx={{ width: 48, height: 48 }}>
                {subjectName.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {subjectName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Due: {format(new Date(selectedRequest.dueDate), 'MMMM d, yyyy')}
                </Typography>
              </Box>
            </Stack>

            <Tabs defaultValue="responses" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="responses">Responses</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="competencies">By Competency</TabsTrigger>
              </TabsList>

              <TabsContent value="responses" className="mt-4">
                <Stack spacing={2}>
                  {responses.map(response => {
                    const sourceStyle = getSourceChipStyle(response.sourceType);
                    const responderName = response.isAnonymous 
                      ? 'Anonymous' 
                      : getStaffName(response.responderId);

                    return (
                      <Card key={response.id} sx={{ p: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{ width: 36, height: 36, fontSize: 14 }}>
                              {response.isAnonymous ? '?' : responderName.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={600}>
                                {responderName}
                              </Typography>
                              <Chip 
                                label={feedbackSourceLabels[response.sourceType]}
                                size="small"
                                sx={{ 
                                  mt: 0.5,
                                  fontSize: 11,
                                  height: 22,
                                  bgcolor: sourceStyle.bg,
                                  color: sourceStyle.color,
                                }}
                              />
                            </Box>
                          </Stack>
                          {response.status === 'completed' ? (
                            <CheckCircle2 size={20} className="text-green-600" />
                          ) : (
                            <Clock size={20} className="text-amber-600" />
                          )}
                        </Stack>
                        
                        {response.status === 'completed' && response.strengths && (
                          <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(34, 197, 94, 0.06)', borderRadius: 1 }}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary">
                              Strengths
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {response.strengths}
                            </Typography>
                          </Box>
                        )}
                      </Card>
                    );
                  })}
                </Stack>
              </TabsContent>

              <TabsContent value="summary" className="mt-4">
                <Card sx={{ p: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Overall Feedback Summary
                  </Typography>
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    {responses.filter(r => r.status === 'completed' && r.strengths).map(r => (
                      <Box key={r.id}>
                        <Typography variant="caption" color="text.secondary">
                          {feedbackSourceLabels[r.sourceType]}
                        </Typography>
                        <Typography variant="body2">{r.strengths}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Card>
              </TabsContent>

              <TabsContent value="competencies" className="mt-4">
                <Stack spacing={2}>
                  {mock360Competencies.map(comp => {
                    const avg = calculateAverageByCompetency(comp.id);
                    return (
                      <Card key={comp.id} sx={{ p: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {comp.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {comp.category}
                            </Typography>
                          </Box>
                          {avg !== null ? (
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="h6" fontWeight={700} color="primary.main">
                                {avg.toFixed(1)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">/5</Typography>
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No ratings yet
                            </Typography>
                          )}
                        </Stack>
                        {avg !== null && (
                          <LinearProgress 
                            variant="determinate" 
                            value={(avg / 5) * 100}
                            sx={{ mt: 1, height: 4, borderRadius: 1 }}
                          />
                        )}
                      </Card>
                    );
                  })}
                </Stack>
              </TabsContent>
            </Tabs>
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
            360° Feedback
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Multi-source feedback collection for comprehensive evaluations
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setShowRequest360Drawer(true)}>
          Request 360° Feedback
        </Button>
      </Stack>

      <Request360FeedbackDrawer
        open={showRequest360Drawer}
        onOpenChange={setShowRequest360Drawer}
        onSubmit={handleSubmit360Request}
        staff={mockStaff}
        currentUserId={currentUserId}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeRequests.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            My Pending Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeRequests.map(renderRequestCard)}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedRequests.length > 0 ? (
              completedRequests.map(renderRequestCard)
            ) : (
              <Card sx={{ p: 4, gridColumn: '1/-1', textAlign: 'center' }}>
                <Typography color="text.secondary">No completed feedback requests yet</Typography>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <MessageSquare size={40} className="mx-auto mb-2 text-muted-foreground" />
            <Typography variant="subtitle1" fontWeight={600}>
              No pending feedback requests
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You'll see requests here when someone asks for your feedback
            </Typography>
          </Card>
        </TabsContent>
      </Tabs>

      {renderDetailSheet()}
    </Box>
  );
}
