import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  Send,
  CheckCircle2,
  Clock,
  Star,
  User,
  MessageSquare,
  Eye,
  ClipboardList,
  Shield,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  mock360Requests, 
  mock360Responses, 
  mock360Competencies 
} from '@/data/mockAdvancedPerformanceData';
import { mockStaff } from '@/data/mockStaffData';
import type { Feedback360Request } from '@/types/advancedPerformance';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Box, Typography, Paper, Avatar, Stack, IconButton, Tooltip, Chip } from '@mui/material';
import { SemanticProgressBar } from './shared/SemanticProgressBar';
import { StatusBadge } from './shared/StatusBadge';

interface Employee360PanelProps {
  currentUserId: string;
}

const getStatusType = (status: string) => {
  switch (status) {
    case 'completed': return 'completed' as const;
    case 'in_progress': return 'in_progress' as const;
    case 'pending': return 'pending' as const;
    default: return 'draft' as const;
  }
};

export function Employee360Panel({ currentUserId }: Employee360PanelProps) {
  const [selectedRequest, setSelectedRequest] = useState<Feedback360Request | null>(null);
  const [showFeedbackSheet, setShowFeedbackSheet] = useState(false);
  const [showResultsSheet, setShowResultsSheet] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // Requests where I need to give feedback (as a responder)
  const feedbackRequests = mock360Requests.filter(req => {
    const myResponse = mock360Responses.find(r => 
      r.requestId === req.id && r.responderId === currentUserId
    );
    return myResponse && myResponse.status === 'pending';
  });

  // Requests about me (self-assessment and results)
  const myReviews = mock360Requests.filter(req => req.subjectStaffId === currentUserId);

  // Completed feedback I've given
  const completedFeedback = mock360Responses.filter(r => 
    r.responderId === currentUserId && r.status === 'completed'
  );

  const handleOpenFeedback = (request: Feedback360Request) => {
    setSelectedRequest(request);
    setRatings({});
    setComments({});
    setStrengths('');
    setImprovements('');
    setShowFeedbackSheet(true);
  };

  const handleOpenResults = (request: Feedback360Request) => {
    setSelectedRequest(request);
    setShowResultsSheet(true);
  };

  const handleSubmitFeedback = () => {
    const missingRatings = mock360Competencies.filter(c => !ratings[c.id]);
    if (missingRatings.length > 0) {
      toast.error('Please rate all competencies');
      return;
    }

    toast.success('Feedback submitted successfully! Thank you for your input.');
    setShowFeedbackSheet(false);
    setSelectedRequest(null);
  };

  const getStaffName = (id: string) => {
    const staff = mockStaff.find(s => s.id === id);
    return staff ? `${staff.firstName} ${staff.lastName}` : 'Unknown';
  };

  const getStaffInitials = (id: string) => {
    const staff = mockStaff.find(s => s.id === id);
    return staff ? `${staff.firstName[0]}${staff.lastName[0]}` : '?';
  };

  const renderRatingStars = (competencyId: string) => {
    const currentRating = ratings[competencyId] || 0;
    
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRatings(prev => ({ ...prev, [competencyId]: star }))}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star 
              className={cn(
                "h-6 w-6 transition-colors",
                star <= currentRating 
                  ? "text-amber-400 fill-amber-400" 
                  : "text-muted-foreground/30"
              )} 
            />
          </button>
        ))}
      </div>
    );
  };

  // Calculate aggregated results for my reviews
  const getAggregatedResults = (requestId: string) => {
    const responses = mock360Responses.filter(r => 
      r.requestId === requestId && r.status === 'completed'
    );
    
    const competencyAverages = mock360Competencies.map(comp => {
      const ratingsArr = responses
        .flatMap(r => r.ratings)
        .filter(r => r.competencyId === comp.id)
        .map(r => r.rating);
      
      const avg = ratingsArr.length > 0 
        ? ratingsArr.reduce((a, b) => a + b, 0) / ratingsArr.length 
        : 0;
      
      return { ...comp, averageRating: avg, responseCount: ratingsArr.length };
    });

    return competencyAverages;
  };

  const renderRequestRow = (request: Feedback360Request, type: 'give' | 'receive') => {
    const subject = mockStaff.find(s => s.id === request.subjectStaffId);
    const responses = mock360Responses.filter(r => r.requestId === request.id);
    const completedResponses = responses.filter(r => r.status === 'completed').length;
    const progressPercent = Math.round((completedResponses / responses.length) * 100);
    const isHovered = hoveredRow === request.id;

    return (
      <TableRow 
        key={request.id}
        className="group cursor-pointer hover:bg-muted/50 transition-colors"
        onMouseEnter={() => setHoveredRow(request.id)}
        onMouseLeave={() => setHoveredRow(null)}
        onClick={() => type === 'give' ? handleOpenFeedback(request) : handleOpenResults(request)}
      >
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 36, height: 36, fontSize: '0.85rem', bgcolor: '#f3e8ff', color: '#7c3aed' }}>
              {getStaffInitials(request.subjectStaffId)}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={500}>
                {subject?.firstName} {subject?.lastName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {request.title}
              </Typography>
            </Box>
          </Box>
        </TableCell>
        <TableCell>
          <StatusBadge status={getStatusType(request.status)} size="small" />
        </TableCell>
        <TableCell>
          {request.anonymousResponses && (
            <Chip
              icon={<Shield className="h-3 w-3" />}
              label="Anonymous"
              size="small"
              variant="outlined"
              sx={{ height: 22, fontSize: '0.7rem' }}
            />
          )}
        </TableCell>
        <TableCell>
          {type === 'receive' ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 120 }}>
              <Box sx={{ flex: 1 }}>
                <SemanticProgressBar 
                  value={progressPercent} 
                  status={progressPercent >= 100 ? 'completed' : progressPercent >= 50 ? 'on_track' : 'at_risk'}
                  size="sm"
                  showPercentage={false}
                />
              </Box>
              <Typography variant="caption" fontWeight={500}>
                {completedResponses}/{responses.length}
              </Typography>
            </Box>
          ) : (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>—</Typography>
          )}
        </TableCell>
        <TableCell>
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 0.5, 
              opacity: isHovered ? 1 : 0,
              transition: 'opacity 0.15s'
            }}
          >
            {type === 'give' ? (
              <Button size="sm" className="h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); handleOpenFeedback(request); }}>
                <MessageSquare className="h-3 w-3" /> Give Feedback
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); handleOpenResults(request); }}>
                <Eye className="h-3 w-3" /> View Results
              </Button>
            )}
            <Tooltip title="More">
              <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="h-3.5 w-3.5" />
              </IconButton>
            </Tooltip>
          </Box>
        </TableCell>
      </TableRow>
    );
  };

  const renderEmptyState = (icon: React.ReactNode, title: string, description: string) => (
    <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderStyle: 'dashed' }}>
      {icon}
      <Typography variant="body1" fontWeight={500} sx={{ mt: 2 }}>{title}</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>{description}</Typography>
    </Paper>
  );

  const renderRequestsTable = (requests: Feedback360Request[], type: 'give' | 'receive') => {
    if (requests.length === 0) {
      return type === 'give' 
        ? renderEmptyState(
            <CheckCircle2 className="h-12 w-12 mx-auto" style={{ color: '#22c55e', opacity: 0.5 }} />,
            "No pending feedback requests",
            "You're all caught up! Check back later for new requests."
          )
        : renderEmptyState(
            <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />,
            "No 360° reviews for you yet",
            "Your manager will initiate reviews when scheduled"
          );
    }

    return (
      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>{type === 'give' ? 'Subject' : 'Review'}</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-28">Privacy</TableHead>
              <TableHead className="w-36">{type === 'receive' ? 'Responses' : ''}</TableHead>
              <TableHead className="w-40"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map(req => renderRequestRow(req, type))}
          </TableBody>
        </Table>
      </Paper>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Stats Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(3, 1fr)' }, gap: 2 }}>
        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fef3c7', borderColor: '#fcd34d' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>Pending Feedback</Typography>
              <Typography variant="h5" fontWeight={700} sx={{ color: '#d97706' }}>{feedbackRequests.length}</Typography>
            </Box>
            <Clock className="h-8 w-8 opacity-50" style={{ color: '#d97706' }} />
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f3e8ff', borderColor: '#c4b5fd' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>My Reviews</Typography>
              <Typography variant="h5" fontWeight={700} sx={{ color: '#7c3aed' }}>{myReviews.length}</Typography>
            </Box>
            <User className="h-8 w-8 opacity-50" style={{ color: '#7c3aed' }} />
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#dcfce7', borderColor: '#86efac' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>Feedback Given</Typography>
              <Typography variant="h5" fontWeight={700} sx={{ color: '#16a34a' }}>{completedFeedback.length}</Typography>
            </Box>
            <CheckCircle2 className="h-8 w-8 opacity-50" style={{ color: '#16a34a' }} />
          </Box>
        </Paper>
      </Box>

      {/* Tabs */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <MessageSquare className="h-4 w-4" /> Give Feedback ({feedbackRequests.length})
          </TabsTrigger>
          <TabsTrigger value="my-reviews" className="gap-2">
            <User className="h-4 w-4" /> My Reviews ({myReviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {renderRequestsTable(feedbackRequests, 'give')}
        </TabsContent>

        <TabsContent value="my-reviews" className="mt-4">
          {renderRequestsTable(myReviews, 'receive')}
        </TabsContent>
      </Tabs>

      {/* Feedback Sheet */}
      <Sheet open={showFeedbackSheet} onOpenChange={setShowFeedbackSheet}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-violet-600" />
              360° Feedback
            </SheetTitle>
          </SheetHeader>

          {selectedRequest && (
            <div className="mt-6 space-y-6">
              {/* Subject Info */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f3e8ff', borderColor: '#c4b5fd' }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ width: 48, height: 48 }}>
                    {getStaffInitials(selectedRequest.subjectStaffId)}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" fontWeight={600}>{getStaffName(selectedRequest.subjectStaffId)}</Typography>
                    <Typography variant="body2" sx={{ color: '#7c3aed' }}>
                      {selectedRequest.anonymousResponses 
                        ? 'Your feedback will be anonymous' 
                        : 'Your name will be visible'}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              {/* Competency Ratings */}
              <div>
                <h3 className="font-semibold mb-4">Rate Competencies</h3>
                <div className="space-y-4">
                  {mock360Competencies.map((comp) => (
                    <Paper key={comp.id} variant="outlined" sx={{ p: 2 }}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium">{comp.name}</p>
                          <p className="text-sm text-muted-foreground">{comp.description}</p>
                          <Badge variant="outline" className="mt-1 text-xs">{comp.category}</Badge>
                        </div>
                        <div className="flex-shrink-0">
                          {renderRatingStars(comp.id)}
                        </div>
                      </div>
                      <Textarea
                        value={comments[comp.id] || ''}
                        onChange={(e) => setComments(prev => ({ ...prev, [comp.id]: e.target.value }))}
                        placeholder="Optional comments..."
                        className="mt-3 resize-none"
                        rows={2}
                      />
                    </Paper>
                  ))}
                </div>
              </div>

              {/* Summary Comments */}
              <div className="space-y-4">
                <div>
                  <label className="font-medium mb-2 block">Key Strengths</label>
                  <Textarea
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    placeholder="What does this person do well?"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="font-medium mb-2 block">Areas for Improvement</label>
                  <Textarea
                    value={improvements}
                    onChange={(e) => setImprovements(e.target.value)}
                    placeholder="What could they improve on?"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          <SheetFooter className="mt-8">
            <Button variant="outline" onClick={() => setShowFeedbackSheet(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitFeedback} className="gap-2">
              <Send className="h-4 w-4" />
              Submit Feedback
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Results Sheet */}
      <Sheet open={showResultsSheet} onOpenChange={setShowResultsSheet}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-600" />
              My 360° Results
            </SheetTitle>
          </SheetHeader>

          {selectedRequest && (
            <div className="mt-6 space-y-6">
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#dbeafe', borderColor: '#93c5fd' }}>
                <Typography variant="body1" fontWeight={600}>{selectedRequest.title}</Typography>
                <Typography variant="body2" sx={{ color: '#2563eb' }}>
                  {mock360Responses.filter(r => r.requestId === selectedRequest.id && r.status === 'completed').length} responses collected
                </Typography>
              </Paper>

              <div>
                <h3 className="font-semibold mb-4">Competency Scores</h3>
                <div className="space-y-3">
                  {getAggregatedResults(selectedRequest.id).map((comp) => (
                    <Paper key={comp.id} variant="outlined" sx={{ p: 2 }}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{comp.name}</p>
                          <p className="text-xs text-muted-foreground">{comp.category}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star}
                                className={cn(
                                  "h-4 w-4",
                                  star <= Math.round(comp.averageRating)
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-muted-foreground/30"
                                )}
                              />
                            ))}
                          </div>
                          <span className="font-semibold">{comp.averageRating.toFixed(1)}</span>
                        </div>
                      </div>
                      <Progress value={(comp.averageRating / 5) * 100} className="h-2" />
                    </Paper>
                  ))}
                </div>
              </div>
            </div>
          )}

          <SheetFooter className="mt-8">
            <Button variant="outline" onClick={() => setShowResultsSheet(false)}>
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Box>
  );
}

export default Employee360Panel;
