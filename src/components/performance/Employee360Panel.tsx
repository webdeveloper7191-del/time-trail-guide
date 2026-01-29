import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  mock360Requests, 
  mock360Responses, 
  mock360Competencies 
} from '@/data/mockAdvancedPerformanceData';
import { mockStaff } from '@/data/mockStaffData';
import type { Feedback360Request, Feedback360Competency } from '@/types/advancedPerformance';
import { toast } from 'sonner';

interface Employee360PanelProps {
  currentUserId: string;
}

// Pastel color palette
const pastelColors = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  green: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
  purple: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
  teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
};

const getStatusPastel = (status: string) => {
  switch (status) {
    case 'completed': return pastelColors.green;
    case 'in_progress': return pastelColors.blue;
    case 'pending': return pastelColors.amber;
    default: return pastelColors.purple;
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

  const renderRequestCard = (request: Feedback360Request, type: 'give' | 'receive') => {
    const statusPastel = getStatusPastel(request.status);
    const subject = mockStaff.find(s => s.id === request.subjectStaffId);
    const responses = mock360Responses.filter(r => r.requestId === request.id);
    const completedResponses = responses.filter(r => r.status === 'completed').length;
    
    return (
      <Card 
        key={request.id}
        className={cn(
          "transition-all hover:shadow-md cursor-pointer border",
          statusPastel.border
        )}
        onClick={() => type === 'give' ? handleOpenFeedback(request) : handleOpenResults(request)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Avatar className={cn("h-10 w-10", pastelColors.purple.bg)}>
                <AvatarFallback className={pastelColors.purple.text}>
                  {getStaffInitials(request.subjectStaffId)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={cn("text-xs", statusPastel.bg, statusPastel.text, statusPastel.border, "border")}>
                    {request.status === 'in_progress' ? 'In Progress' : 
                     request.status === 'completed' ? 'Completed' : 'Pending'}
                  </Badge>
                  {request.anonymousResponses && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Shield className="h-3 w-3" /> Anonymous
                    </Badge>
                  )}
                </div>
                <h4 className="font-semibold">{request.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {type === 'give' 
                    ? `Provide feedback for ${subject?.firstName} ${subject?.lastName}`
                    : `${completedResponses}/${responses.length} responses received`
                  }
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              {type === 'give' ? (
                <Button size="sm" className="gap-1">
                  <MessageSquare className="h-4 w-4" />
                  Give Feedback
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="gap-1">
                  <Eye className="h-4 w-4" />
                  View Results
                </Button>
              )}
            </div>
          </div>
          
          {type === 'receive' && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Response Progress</span>
                <span className="font-medium">{Math.round((completedResponses / responses.length) * 100)}%</span>
              </div>
              <Progress value={(completedResponses / responses.length) * 100} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Calculate aggregated results for my reviews
  const getAggregatedResults = (requestId: string) => {
    const responses = mock360Responses.filter(r => 
      r.requestId === requestId && r.status === 'completed'
    );
    
    const competencyAverages = mock360Competencies.map(comp => {
      const ratings = responses
        .flatMap(r => r.ratings)
        .filter(r => r.competencyId === comp.id)
        .map(r => r.rating);
      
      const avg = ratings.length > 0 
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
        : 0;
      
      return { ...comp, averageRating: avg, responseCount: ratings.length };
    });

    return competencyAverages;
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className={cn("border", pastelColors.amber.bg, pastelColors.amber.border)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Pending Feedback</p>
                <p className={cn("text-2xl font-bold", pastelColors.amber.text)}>{feedbackRequests.length}</p>
              </div>
              <Clock className={cn("h-8 w-8 opacity-50", pastelColors.amber.text)} />
            </div>
          </CardContent>
        </Card>

        <Card className={cn("border", pastelColors.purple.bg, pastelColors.purple.border)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">My Reviews</p>
                <p className={cn("text-2xl font-bold", pastelColors.purple.text)}>{myReviews.length}</p>
              </div>
              <User className={cn("h-8 w-8 opacity-50", pastelColors.purple.text)} />
            </div>
          </CardContent>
        </Card>

        <Card className={cn("border", pastelColors.green.bg, pastelColors.green.border)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Feedback Given</p>
                <p className={cn("text-2xl font-bold", pastelColors.green.text)}>{completedFeedback.length}</p>
              </div>
              <CheckCircle2 className={cn("h-8 w-8 opacity-50", pastelColors.green.text)} />
            </div>
          </CardContent>
        </Card>
      </div>

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

        <TabsContent value="pending" className="mt-6 space-y-4">
          {feedbackRequests.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500/50 mx-auto mb-4" />
                <p className="font-medium text-emerald-700">No pending feedback requests</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You're all caught up! Check back later for new requests.
                </p>
              </CardContent>
            </Card>
          ) : (
            feedbackRequests.map(req => renderRequestCard(req, 'give'))
          )}
        </TabsContent>

        <TabsContent value="my-reviews" className="mt-6 space-y-4">
          {myReviews.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="font-medium">No 360° reviews for you yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your manager will initiate reviews when scheduled
                </p>
              </CardContent>
            </Card>
          ) : (
            myReviews.map(req => renderRequestCard(req, 'receive'))
          )}
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
              <div className={cn("p-4 rounded-lg flex items-center gap-3", pastelColors.purple.bg)}>
                <Avatar className="h-12 w-12">
                  <AvatarFallback>{getStaffInitials(selectedRequest.subjectStaffId)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{getStaffName(selectedRequest.subjectStaffId)}</p>
                  <p className={cn("text-sm", pastelColors.purple.text)}>
                    {selectedRequest.anonymousResponses 
                      ? 'Your feedback will be anonymous' 
                      : 'Your name will be visible'}
                  </p>
                </div>
              </div>

              {/* Competency Ratings */}
              <div>
                <h3 className="font-semibold mb-4">Rate Competencies</h3>
                <div className="space-y-4">
                  {mock360Competencies.map((comp) => (
                    <Card key={comp.id} className="p-4">
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
                    </Card>
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
              <Card className={cn("p-4", pastelColors.blue.bg, pastelColors.blue.border, "border")}>
                <h4 className="font-semibold mb-1">{selectedRequest.title}</h4>
                <p className={cn("text-sm", pastelColors.blue.text)}>
                  {mock360Responses.filter(r => r.requestId === selectedRequest.id && r.status === 'completed').length} responses collected
                </p>
              </Card>

              <div>
                <h3 className="font-semibold mb-4">Competency Scores</h3>
                <div className="space-y-3">
                  {getAggregatedResults(selectedRequest.id).map((comp) => (
                    <div key={comp.id} className="p-4 rounded-lg border bg-background">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{comp.name}</p>
                          <Badge variant="outline" className="text-xs">{comp.category}</Badge>
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
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <SheetFooter className="mt-8">
            <Button onClick={() => setShowResultsSheet(false)}>
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
