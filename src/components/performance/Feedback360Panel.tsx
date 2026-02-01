import React, { useState } from 'react';
import { 
  Box, 
  Stack, 
  Typography, 
  Chip,
  Avatar,
  IconButton,
  LinearProgress,
  Tooltip,
  Paper,
} from '@mui/material';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Eye,
  MoreHorizontal,
  MessageSquare,
} from 'lucide-react';
import { 
  Feedback360Request, 
  Feedback360Response, 
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
import { format, isPast, parseISO } from 'date-fns';
import { Request360FeedbackDrawer } from './Request360FeedbackDrawer';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from './shared/StatusBadge';

interface Feedback360PanelProps {
  currentUserId: string;
}

const getStatusChipStyle = (status: string) => {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    completed: { bg: 'hsl(var(--chart-2) / 0.15)', color: 'hsl(var(--chart-2))', border: 'hsl(var(--chart-2) / 0.3)' },
    in_progress: { bg: 'hsl(var(--chart-1) / 0.15)', color: 'hsl(var(--chart-1))', border: 'hsl(var(--chart-1) / 0.3)' },
    pending: { bg: 'hsl(var(--chart-4) / 0.15)', color: 'hsl(var(--chart-4))', border: 'hsl(var(--chart-4) / 0.3)' },
    expired: { bg: 'hsl(var(--destructive) / 0.15)', color: 'hsl(var(--destructive))', border: 'hsl(var(--destructive) / 0.3)' },
    draft: { bg: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', border: 'hsl(var(--border))' },
  };
  return styles[status] || styles.draft;
};

const getSourceChipStyle = (source: string) => {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    self: { bg: 'hsl(var(--chart-5) / 0.15)', color: 'hsl(var(--chart-5))', border: 'hsl(var(--chart-5) / 0.3)' },
    manager: { bg: 'hsl(var(--chart-1) / 0.15)', color: 'hsl(var(--chart-1))', border: 'hsl(var(--chart-1) / 0.3)' },
    peer: { bg: 'hsl(var(--chart-2) / 0.15)', color: 'hsl(var(--chart-2))', border: 'hsl(var(--chart-2) / 0.3)' },
    direct_report: { bg: 'hsl(var(--chart-3) / 0.15)', color: 'hsl(var(--chart-3))', border: 'hsl(var(--chart-3) / 0.3)' },
    cross_functional: { bg: 'hsl(var(--chart-4) / 0.15)', color: 'hsl(var(--chart-4))', border: 'hsl(var(--chart-4) / 0.3)' },
    external: { bg: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', border: 'hsl(var(--border))' },
  };
  return styles[source] || styles.peer;
};

export function Feedback360Panel({ currentUserId }: Feedback360PanelProps) {
  const [selectedRequest, setSelectedRequest] = useState<Feedback360Request | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showRequest360Drawer, setShowRequest360Drawer] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

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

  const renderRequestRow = (request: Feedback360Request) => {
    const stats = getCompletionStats(request.id);
    const statusStyle = getStatusChipStyle(request.status);
    const subjectName = getStaffName(request.subjectStaffId);
    const subject = mockStaff.find(s => s.id === request.subjectStaffId);
    const isHovered = hoveredRow === request.id;
    const dueDate = parseISO(request.dueDate);
    const isOverdue = isPast(dueDate) && request.status !== 'completed';

    return (
      <TableRow 
        key={request.id}
        className="group cursor-pointer hover:bg-muted/50 transition-colors"
        onMouseEnter={() => setHoveredRow(request.id)}
        onMouseLeave={() => setHoveredRow(null)}
        onClick={() => handleViewRequest(request)}
        style={{
          borderLeft: isOverdue ? '3px solid hsl(var(--destructive))' : undefined,
        }}
      >
        <TableCell className="py-3">
          <div className="flex items-center gap-3">
            <Avatar 
              src={subject?.avatar} 
              sx={{ width: 36, height: 36, fontSize: '0.85rem', bgcolor: 'hsl(var(--muted))' }}
            >
              {subjectName.charAt(0)}
            </Avatar>
            <div>
              <p className="text-sm font-medium">{request.title}</p>
              <p className="text-xs text-muted-foreground">{subjectName}</p>
            </div>
          </div>
        </TableCell>
        <TableCell className="py-3">
          <div className="w-full max-w-[120px]">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">{stats.completed}/{stats.total}</span>
              <span className="font-medium">{stats.percentage}%</span>
            </div>
            <LinearProgress 
              variant="determinate" 
              value={stats.percentage} 
              sx={{ 
                height: 6, 
                borderRadius: 1,
                bgcolor: 'hsl(var(--muted))',
                '& .MuiLinearProgress-bar': {
                  bgcolor: stats.percentage === 100 ? 'hsl(var(--chart-2))' : 'hsl(var(--primary))',
                }
              }}
            />
          </div>
        </TableCell>
        <TableCell className="py-3">
          <Chip
            label={feedback360StatusLabels[request.status]}
            size="small"
            sx={{
              height: 24,
              fontSize: '0.7rem',
              fontWeight: 500,
              bgcolor: statusStyle.bg,
              color: statusStyle.color,
              border: `1px solid ${statusStyle.border}`,
            }}
          />
        </TableCell>
        <TableCell className="py-3">
          <div>
            <p className={`text-sm ${isOverdue ? 'text-destructive font-medium' : ''}`}>
              {format(dueDate, 'MMM d, yyyy')}
            </p>
          </div>
        </TableCell>
        <TableCell className="py-3">
          <div className="flex gap-1.5">
            {request.anonymousResponses && (
              <Chip 
                label="Anonymous" 
                size="small" 
                sx={{ 
                  height: 22, 
                  fontSize: '0.65rem',
                  bgcolor: 'hsl(var(--muted))',
                  color: 'hsl(var(--muted-foreground))',
                  border: '1px solid hsl(var(--border))',
                }}
              />
            )}
            {request.selfAssessmentCompleted && (
              <Chip 
                icon={<CheckCircle2 size={12} />}
                label="Self" 
                size="small"
                sx={{ 
                  height: 22, 
                  fontSize: '0.65rem',
                  bgcolor: 'hsl(var(--chart-2) / 0.15)',
                  color: 'hsl(var(--chart-2))',
                  border: '1px solid hsl(var(--chart-2) / 0.3)',
                  '& .MuiChip-icon': { color: 'inherit' }
                }}
              />
            )}
          </div>
        </TableCell>
        <TableCell className="py-3">
          <div 
            className="flex gap-1 transition-opacity duration-150"
            style={{ opacity: isHovered ? 1 : 0 }}
          >
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); handleViewRequest(request); }}>
              <Eye className="h-3 w-3" /> View
            </Button>
            <Tooltip title="More">
              <IconButton size="small" onClick={(e) => e.stopPropagation()} sx={{ color: 'hsl(var(--muted-foreground))' }}>
                <MoreHorizontal className="h-3.5 w-3.5" />
              </IconButton>
            </Tooltip>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const renderRequestsTable = (requests: Feedback360Request[]) => (
    <Paper variant="outlined" sx={{ overflow: 'hidden', borderRadius: 2, borderColor: 'hsl(var(--border))' }}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
            <TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">Subject</TableHead>
            <TableHead className="w-36 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Progress</TableHead>
            <TableHead className="w-28 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Status</TableHead>
            <TableHead className="w-28 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Due Date</TableHead>
            <TableHead className="w-32 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Flags</TableHead>
            <TableHead className="w-28"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map(renderRequestRow)}
        </TableBody>
      </Table>
    </Paper>
  );

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
                      <Paper key={response.id} variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: 'hsl(var(--border))' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{ width: 36, height: 36, fontSize: 14, bgcolor: 'hsl(var(--muted))' }}>
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
                                  border: `1px solid ${sourceStyle.border}`,
                                }}
                              />
                            </Box>
                          </Stack>
                          {response.status === 'completed' ? (
                            <CheckCircle2 size={20} className="text-chart-2" />
                          ) : (
                            <Clock size={20} className="text-chart-4" />
                          )}
                        </Stack>
                        
                        {response.status === 'completed' && response.strengths && (
                          <Box sx={{ mt: 2, p: 2, bgcolor: 'hsl(var(--chart-2) / 0.08)', borderRadius: 1 }}>
                            <Typography variant="caption" fontWeight={600} sx={{ color: 'hsl(var(--muted-foreground))' }}>
                              Strengths
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              {response.strengths}
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                    );
                  })}
                </Stack>
              </TabsContent>

              <TabsContent value="summary" className="mt-4">
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, borderColor: 'hsl(var(--border))' }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Overall Feedback Summary
                  </Typography>
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    {responses.filter(r => r.status === 'completed' && r.strengths).map(r => (
                      <Box key={r.id}>
                        <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                          {feedbackSourceLabels[r.sourceType]}
                        </Typography>
                        <Typography variant="body2">{r.strengths}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </TabsContent>

              <TabsContent value="competencies" className="mt-4">
                <Stack spacing={2}>
                  {mock360Competencies.map(comp => {
                    const avg = calculateAverageByCompetency(comp.id);
                    return (
                      <Paper key={comp.id} variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: 'hsl(var(--border))' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {comp.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                              {comp.category}
                            </Typography>
                          </Box>
                          {avg !== null ? (
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="h6" fontWeight={700} sx={{ color: 'hsl(var(--primary))' }}>
                                {avg.toFixed(1)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))' }}>/5</Typography>
                            </Stack>
                          ) : (
                            <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                              No ratings yet
                            </Typography>
                          )}
                        </Stack>
                        {avg !== null && (
                          <LinearProgress 
                            variant="determinate" 
                            value={(avg / 5) * 100}
                            sx={{ 
                              mt: 1, 
                              height: 4, 
                              borderRadius: 1,
                              bgcolor: 'hsl(var(--muted))',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: 'hsl(var(--primary))',
                              }
                            }}
                          />
                        )}
                      </Paper>
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
          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
            <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'hsl(var(--primary) / 0.1)', display: 'flex' }}>
              <Users size={20} style={{ color: 'hsl(var(--primary))' }} />
            </Box>
            <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
              360° Feedback
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
            Multi-source feedback collection for comprehensive evaluations
          </Typography>
        </Box>
        <Button onClick={() => setShowRequest360Drawer(true)} className="gap-2">
          <Plus size={16} />
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
          {activeRequests.length > 0 ? (
            renderRequestsTable(activeRequests)
          ) : (
            <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderStyle: 'dashed', borderColor: 'hsl(var(--border))' }}>
              <Users size={40} style={{ color: 'hsl(var(--muted-foreground))', margin: '0 auto 12px', opacity: 0.5 }} />
              <Typography variant="body1" fontWeight={500}>No active feedback requests</Typography>
              <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))', mt: 0.5 }}>
                Start a 360° feedback cycle for comprehensive evaluations
              </Typography>
              <Button variant="outline" className="mt-4" onClick={() => setShowRequest360Drawer(true)}>
                Request 360° Feedback
              </Button>
            </Paper>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {completedRequests.length > 0 ? (
            renderRequestsTable(completedRequests)
          ) : (
            <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderStyle: 'dashed', borderColor: 'hsl(var(--border))' }}>
              <Typography sx={{ color: 'hsl(var(--muted-foreground))' }}>No completed feedback requests yet</Typography>
            </Paper>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderStyle: 'dashed', borderColor: 'hsl(var(--border))' }}>
            <MessageSquare size={40} style={{ color: 'hsl(var(--muted-foreground))', margin: '0 auto 12px', opacity: 0.5 }} />
            <Typography variant="subtitle1" fontWeight={600}>
              No pending feedback requests
            </Typography>
            <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
              You'll see requests here when someone asks for your feedback
            </Typography>
          </Paper>
        </TabsContent>
      </Tabs>

      {renderDetailSheet()}
    </Box>
  );
}
