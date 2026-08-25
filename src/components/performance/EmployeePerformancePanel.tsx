import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Target,
  ClipboardCheck,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Star,
  MessageSquare,
  MessageSquarePlus,
  ClipboardList,
  PenLine,
  ThumbsUp,
} from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Goal,
  PerformanceReview,
  Conversation,
  goalStatusLabels,
  goalPriorityLabels,
  reviewStatusLabels,
  conversationTypeLabels,
} from '@/types/performance';
import { planTypeLabels, planStatusLabels } from '@/types/performancePlan';
import { mockReviews, mockGoals, mockConversations } from '@/data/mockPerformanceData';
import { mockAssignedPlans } from '@/data/mockPerformancePlanTemplates';
import {
  usePerformanceSelfService,
  performanceSelfService,
  applyGoalOverlay,
  applyReviewOverlay,
} from '@/lib/performanceSelfServiceStore';
import { UpdateGoalProgressDrawer } from './employee/UpdateGoalProgressDrawer';
import { SelfReviewDrawer } from './employee/SelfReviewDrawer';
import { ConversationPrepDrawer } from './employee/ConversationPrepDrawer';
import { RequestFeedbackDrawer } from './employee/RequestFeedbackDrawer';

interface EmployeePerformancePanelProps {
  currentUserId: string;
}

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  critical: 'bg-destructive/10 text-destructive',
};

const statusColors: Record<string, string> = {
  not_started: 'bg-muted text-muted-foreground',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  overdue: 'bg-destructive/10 text-destructive',
};

const reviewStatusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending_self: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  pending_manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-muted text-muted-foreground',
};

export function EmployeePerformancePanel({ currentUserId }: EmployeePerformancePanelProps) {
  const [activeTab, setActiveTab] = useState('goals');
  const overlay = usePerformanceSelfService();

  const [goalDrawer, setGoalDrawer] = useState<Goal | null>(null);
  const [reviewDrawer, setReviewDrawer] = useState<PerformanceReview | null>(null);
  const [conversationDrawer, setConversationDrawer] = useState<Conversation | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // My data, with employee self-service edits merged over the source records.
  const myGoals = useMemo(
    () => mockGoals.filter(g => g.staffId === currentUserId).map(g => applyGoalOverlay(g, overlay)),
    [currentUserId, overlay],
  );

  const myReviews = useMemo(
    () => mockReviews.filter(r => r.staffId === currentUserId).map(r => applyReviewOverlay(r, overlay)),
    [currentUserId, overlay],
  );

  const myConversations = useMemo(
    () => mockConversations.filter(c => c.staffId === currentUserId),
    [currentUserId],
  );

  const myPlans = useMemo(
    () => mockAssignedPlans.filter(p => p.staffId === currentUserId),
    [currentUserId],
  );

  const goalStats = useMemo(
    () => ({
      total: myGoals.length,
      active: myGoals.filter(g => g.status === 'in_progress').length,
      completed: myGoals.filter(g => g.status === 'completed').length,
      overdue: myGoals.filter(g => g.status === 'overdue').length,
      avgProgress: myGoals.length
        ? Math.round(myGoals.reduce((sum, g) => sum + g.progress, 0) / myGoals.length)
        : 0,
    }),
    [myGoals],
  );

  const pendingReviews = myReviews.filter(r => r.status === 'pending_self');

  const upcomingConversations = myConversations
    .filter(c => !c.completed && !isPast(parseISO(c.scheduledDate)))
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

  const unacknowledgedPlans = myPlans.filter(p => !overlay.planAcknowledgements[p.id]);

  const actionCount =
    pendingReviews.length + unacknowledgedPlans.length + goalStats.overdue;

  const handleAcknowledgePlan = (planId: string, planName: string) => {
    performanceSelfService.acknowledgePlan(planId);
    toast.success(`You acknowledged "${planName}"`);
  };

  return (
    <div className="space-y-6">
      {/* Things to do */}
      {actionCount > 0 && (
        <Card className="border-amber-500/30 bg-amber-50/60 dark:bg-amber-900/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  You have {actionCount} item{actionCount > 1 ? 's' : ''} needing your attention
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {pendingReviews.map(r => (
                    <Button
                      key={r.id}
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => setReviewDrawer(r)}
                    >
                      <PenLine className="mr-1.5 h-3.5 w-3.5" />
                      Complete self-review
                    </Button>
                  ))}
                  {unacknowledgedPlans.map(p => (
                    <Button
                      key={p.id}
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => setActiveTab('plans')}
                    >
                      <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
                      Acknowledge {p.templateName}
                    </Button>
                  ))}
                  {goalStats.overdue > 0 && (
                    <Button size="sm" variant="outline" className="h-8" onClick={() => setActiveTab('goals')}>
                      <Target className="mr-1.5 h-3.5 w-3.5" />
                      {goalStats.overdue} overdue goal{goalStats.overdue > 1 ? 's' : ''}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Active Goals</p>
                <p className="text-2xl font-bold text-primary">{goalStats.active}</p>
              </div>
              <Target className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Avg Progress</p>
                <p className="text-2xl font-bold text-green-600">{goalStats.avgProgress}%</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Pending Reviews</p>
                <p className="text-2xl font-bold text-amber-600">{pendingReviews.length}</p>
              </div>
              <ClipboardCheck className="h-8 w-8 text-amber-600/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Upcoming 1:1s</p>
                <p className="text-2xl font-bold text-purple-600">{upcomingConversations.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-600/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="goals" className="gap-2">
              <Target className="h-4 w-4" /> My Goals
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2">
              <ClipboardCheck className="h-4 w-4" /> My Reviews
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-2">
              <ClipboardList className="h-4 w-4" /> My Plans
            </TabsTrigger>
            <TabsTrigger value="conversations" className="gap-2">
              <MessageSquare className="h-4 w-4" /> My 1:1s
            </TabsTrigger>
          </TabsList>

          <Button size="sm" variant="outline" onClick={() => setFeedbackOpen(true)}>
            <MessageSquarePlus className="mr-1.5 h-4 w-4" />
            Request feedback
          </Button>
        </div>

        {/* ---------------------------------------------------------------- Goals */}
        <TabsContent value="goals" className="mt-6">
          <div className="space-y-4">
            {myGoals.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Target className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="font-medium">No goals assigned yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your manager will assign goals to help track your development
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {myGoals.map(goal => {
                  const update = overlay.goalProgress[goal.id];
                  return (
                    <Card key={goal.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium line-clamp-1">{goal.title}</h4>
                          <Badge className={cn('text-xs ml-2', priorityColors[goal.priority])}>
                            {goalPriorityLabels[goal.priority]}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {goal.description}
                        </p>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <Badge variant="outline" className={statusColors[goal.status]}>
                              {goalStatusLabels[goal.status]}
                            </Badge>
                            <span className="font-medium">{goal.progress}%</span>
                          </div>
                          <Progress value={goal.progress} className="h-2" />
                        </div>

                        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due: {format(parseISO(goal.targetDate), 'MMM d, yyyy')}
                          </span>
                          <span>
                            {goal.milestones.filter(m => m.completed).length}/{goal.milestones.length}{' '}
                            milestones
                          </span>
                        </div>

                        {update?.note && (
                          <p className="mt-3 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                            Your last note: {update.note}
                          </p>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3 w-full"
                          onClick={() => setGoalDrawer(goal)}
                        >
                          <PenLine className="mr-1.5 h-3.5 w-3.5" />
                          Update progress
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* -------------------------------------------------------------- Reviews */}
        <TabsContent value="reviews" className="mt-6">
          <div className="space-y-4">
            {myReviews.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <ClipboardCheck className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="font-medium">No performance reviews yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your reviews will appear here once scheduled
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {myReviews.map(review => {
                  const submitted = overlay.selfReviews[review.id];
                  return (
                    <Card key={review.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'p-2 rounded-lg',
                                review.status === 'pending_self'
                                  ? 'bg-amber-100 dark:bg-amber-900/30'
                                  : review.status === 'completed'
                                    ? 'bg-green-100 dark:bg-green-900/30'
                                    : 'bg-muted',
                              )}
                            >
                              <ClipboardCheck
                                className={cn(
                                  'h-5 w-5',
                                  review.status === 'pending_self'
                                    ? 'text-amber-600'
                                    : review.status === 'completed'
                                      ? 'text-green-600'
                                      : 'text-muted-foreground',
                                )}
                              />
                            </div>
                            <div>
                              <p className="font-medium">
                                {review.reviewCycle.charAt(0).toUpperCase() +
                                  review.reviewCycle.slice(1).replace('_', ' ')}{' '}
                                Review
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(parseISO(review.periodStart), 'MMM yyyy')} -{' '}
                                {format(parseISO(review.periodEnd), 'MMM yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {review.overallManagerRating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                <span className="font-medium">
                                  {review.overallManagerRating.toFixed(1)}
                                </span>
                              </div>
                            )}
                            <Badge className={reviewStatusColors[review.status]}>
                              {reviewStatusLabels[review.status]}
                            </Badge>
                          </div>
                        </div>

                        {review.status === 'pending_self' && (
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                            <p className="text-sm text-amber-700 dark:text-amber-400">
                              <AlertTriangle className="mr-1 inline h-4 w-4" />
                              Action required: Complete your self-review
                            </p>
                            <Button size="sm" onClick={() => setReviewDrawer(review)}>
                              Start self-review
                            </Button>
                          </div>
                        )}

                        {submitted && (
                          <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm">
                            <p className="flex items-center gap-1.5 font-medium">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              Self-review submitted{' '}
                              {format(parseISO(submitted.submittedAt), 'd MMM yyyy')}
                              {review.overallSelfRating && (
                                <span className="text-muted-foreground">
                                  · your average {review.overallSelfRating.toFixed(1)}
                                </span>
                              )}
                            </p>
                            <p className="mt-1 line-clamp-2 text-muted-foreground">
                              {submitted.summary}
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="mt-2 h-7 px-2"
                              onClick={() => setReviewDrawer(review)}
                            >
                              View my answers
                            </Button>
                          </div>
                        )}

                        {review.status === 'completed' && review.managerSummary && (
                          <div className="mt-3 rounded-lg bg-muted/50 p-3 text-sm">
                            <p className="font-medium">Manager summary</p>
                            <p className="mt-1 text-muted-foreground">{review.managerSummary}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ---------------------------------------------------------------- Plans */}
        <TabsContent value="plans" className="mt-6">
          <div className="space-y-3">
            {myPlans.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <ClipboardList className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="font-medium">No plans assigned</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Onboarding, probation and development plans will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              myPlans.map(plan => {
                const ack = overlay.planAcknowledgements[plan.id];
                return (
                  <Card key={plan.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{plan.templateName}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(plan.startDate), 'd MMM yyyy')} –{' '}
                            {format(parseISO(plan.endDate), 'd MMM yyyy')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{planTypeLabels[plan.type]}</Badge>
                          <Badge variant="outline">{planStatusLabels[plan.status]}</Badge>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Plan progress</span>
                          <span className="font-medium text-foreground">{plan.progress}%</span>
                        </div>
                        <Progress value={plan.progress} className="h-2" />
                      </div>

                      {plan.notes && (
                        <p className="mt-3 text-sm text-muted-foreground">{plan.notes}</p>
                      )}

                      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{plan.goalIds.length} goals</span>
                        <span>{plan.reviewIds.length} reviews</span>
                        <span>{plan.courseIds.length} courses</span>
                      </div>

                      {ack ? (
                        <p className="mt-3 flex items-center gap-1.5 text-sm text-green-700 dark:text-green-400">
                          <ThumbsUp className="h-4 w-4" />
                          Acknowledged {format(parseISO(ack.acknowledgedAt), 'd MMM yyyy')}
                        </p>
                      ) : (
                        <Button
                          size="sm"
                          className="mt-3"
                          onClick={() => handleAcknowledgePlan(plan.id, plan.templateName)}
                        >
                          <ThumbsUp className="mr-1.5 h-3.5 w-3.5" />
                          Acknowledge plan
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* -------------------------------------------------------- Conversations */}
        <TabsContent value="conversations" className="mt-6">
          <div className="space-y-4">
            {upcomingConversations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Upcoming
                </h4>
                <div className="space-y-3">
                  {upcomingConversations.map(conv => {
                    const prep = overlay.conversationPrep[conv.id];
                    return (
                      <Card key={conv.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <MessageSquare className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{conv.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(parseISO(conv.scheduledDate), 'EEEE, MMM d')} at{' '}
                                  {format(parseISO(conv.scheduledDate), 'h:mm a')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{conversationTypeLabels[conv.type]}</Badge>
                              <Badge variant="outline">
                                <Clock className="h-3 w-3 mr-1" />
                                {conv.duration}m
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setConversationDrawer(conv)}
                              >
                                {prep ? 'Edit my notes' : 'Add talking points'}
                              </Button>
                            </div>
                          </div>
                          {prep?.talkingPoints && (
                            <p className="mt-3 line-clamp-2 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                              {prep.talkingPoints}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {myConversations.filter(c => c.completed).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Past Conversations
                </h4>
                <div className="space-y-3">
                  {myConversations
                    .filter(c => c.completed)
                    .slice(0, 5)
                    .map(conv => {
                      const prep = overlay.conversationPrep[conv.id];
                      const done = prep?.completedActionItems.length ?? 0;
                      return (
                        <Card key={conv.id}>
                          <CardContent className="p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <div>
                                  <p className="font-medium">{conv.title}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {format(parseISO(conv.scheduledDate), 'MMM d, yyyy')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                  Completed
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setConversationDrawer(conv)}
                                >
                                  Open
                                </Button>
                              </div>
                            </div>
                            {conv.actionItems.length > 0 && (
                              <div className="mt-2 text-sm text-muted-foreground">
                                {done}/{conv.actionItems.length} action items done
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </div>
            )}

            {myConversations.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="font-medium">No conversations scheduled</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your 1:1 meetings with your manager will appear here
                  </p>
                </CardContent>
              </Card>
            )}

            {overlay.feedbackRequests.filter(r => r.fromStaffId === currentUserId).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Feedback I requested
                </h4>
                <div className="space-y-2">
                  {overlay.feedbackRequests
                    .filter(r => r.fromStaffId === currentUserId)
                    .map(req => (
                      <Card key={req.id}>
                        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-3">
                          <div>
                            <p className="text-sm font-medium">{req.topic}</p>
                            <p className="text-xs text-muted-foreground">
                              {req.toStaffName} · sent {format(parseISO(req.createdAt), 'd MMM yyyy')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {req.status}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                performanceSelfService.cancelFeedbackRequest(req.id);
                                toast.success('Request withdrawn');
                              }}
                            >
                              Withdraw
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <UpdateGoalProgressDrawer
        goal={goalDrawer}
        open={!!goalDrawer}
        onClose={() => setGoalDrawer(null)}
      />
      <SelfReviewDrawer
        review={reviewDrawer}
        open={!!reviewDrawer}
        onClose={() => setReviewDrawer(null)}
      />
      <ConversationPrepDrawer
        conversation={conversationDrawer}
        open={!!conversationDrawer}
        onClose={() => setConversationDrawer(null)}
      />
      <RequestFeedbackDrawer
        currentUserId={currentUserId}
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </div>
  );
}
