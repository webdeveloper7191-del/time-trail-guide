import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Target, 
  ClipboardCheck, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  Star,
  MessageSquare,
  BookOpen,
} from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  Goal, 
  PerformanceReview,
  Conversation,
  goalStatusLabels, 
  goalPriorityLabels,
  reviewStatusLabels,
  conversationTypeLabels,
} from '@/types/performance';
import { mockReviews, mockGoals, mockConversations } from '@/data/mockPerformanceData';

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

  // Filter data for current employee
  const myGoals = useMemo(() => 
    mockGoals.filter(g => g.staffId === currentUserId),
    [currentUserId]
  );

  const myReviews = useMemo(() => 
    mockReviews.filter(r => r.staffId === currentUserId),
    [currentUserId]
  );

  const myConversations = useMemo(() => 
    mockConversations.filter(c => c.staffId === currentUserId),
    [currentUserId]
  );

  // Stats
  const goalStats = useMemo(() => ({
    total: myGoals.length,
    active: myGoals.filter(g => g.status === 'in_progress').length,
    completed: myGoals.filter(g => g.status === 'completed').length,
    overdue: myGoals.filter(g => g.status === 'overdue').length,
    avgProgress: myGoals.length > 0 
      ? Math.round(myGoals.reduce((sum, g) => sum + g.progress, 0) / myGoals.length)
      : 0,
  }), [myGoals]);

  const reviewStats = useMemo(() => ({
    total: myReviews.length,
    pending: myReviews.filter(r => r.status === 'pending_self').length,
    completed: myReviews.filter(r => r.status === 'completed').length,
    avgRating: myReviews.filter(r => r.overallManagerRating)
      .reduce((sum, r, _, arr) => sum + (r.overallManagerRating || 0) / arr.length, 0),
  }), [myReviews]);

  const upcomingConversations = myConversations
    .filter(c => !c.completed && !isPast(parseISO(c.scheduledDate)))
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

  return (
    <div className="space-y-6">
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
                <p className="text-2xl font-bold text-amber-600">{reviewStats.pending}</p>
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
        <TabsList>
          <TabsTrigger value="goals" className="gap-2">
            <Target className="h-4 w-4" /> My Goals
          </TabsTrigger>
          <TabsTrigger value="reviews" className="gap-2">
            <ClipboardCheck className="h-4 w-4" /> My Reviews
          </TabsTrigger>
          <TabsTrigger value="conversations" className="gap-2">
            <MessageSquare className="h-4 w-4" /> My 1:1s
          </TabsTrigger>
        </TabsList>

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
                {myGoals.map(goal => (
                  <Card key={goal.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium line-clamp-1">{goal.title}</h4>
                        <Badge className={cn("text-xs ml-2", priorityColors[goal.priority])}>
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
                        <span>{goal.milestones.filter(m => m.completed).length}/{goal.milestones.length} milestones</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

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
                {myReviews.map(review => (
                  <Card key={review.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            review.status === 'pending_self' ? "bg-amber-100 dark:bg-amber-900/30" :
                            review.status === 'completed' ? "bg-green-100 dark:bg-green-900/30" :
                            "bg-muted"
                          )}>
                            <ClipboardCheck className={cn(
                              "h-5 w-5",
                              review.status === 'pending_self' ? "text-amber-600" :
                              review.status === 'completed' ? "text-green-600" :
                              "text-muted-foreground"
                            )} />
                          </div>
                          <div>
                            <p className="font-medium">
                              {review.reviewCycle.charAt(0).toUpperCase() + review.reviewCycle.slice(1).replace('_', ' ')} Review
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(parseISO(review.periodStart), 'MMM yyyy')} - {format(parseISO(review.periodEnd), 'MMM yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {review.overallManagerRating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                              <span className="font-medium">{review.overallManagerRating.toFixed(1)}</span>
                            </div>
                          )}
                          <Badge className={reviewStatusColors[review.status]}>
                            {reviewStatusLabels[review.status]}
                          </Badge>
                        </div>
                      </div>

                      {review.status === 'pending_self' && (
                        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                          <p className="text-sm text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="h-4 w-4 inline mr-1" />
                            Action required: Complete your self-review
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="conversations" className="mt-6">
          <div className="space-y-4">
            {upcomingConversations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Upcoming
                </h4>
                <div className="space-y-3">
                  {upcomingConversations.map(conv => (
                    <Card key={conv.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <MessageSquare className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{conv.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(parseISO(conv.scheduledDate), 'EEEE, MMM d')} at {format(parseISO(conv.scheduledDate), 'h:mm a')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {conversationTypeLabels[conv.type]}
                            </Badge>
                            <Badge variant="outline">
                              <Clock className="h-3 w-3 mr-1" />
                              {conv.duration}m
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {myConversations.filter(c => c.completed).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Past Conversations
                </h4>
                <div className="space-y-3">
                  {myConversations.filter(c => c.completed).slice(0, 5).map(conv => (
                    <Card key={conv.id} className="opacity-75">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="font-medium">{conv.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(parseISO(conv.scheduledDate), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            Completed
                          </Badge>
                        </div>
                        {conv.actionItems.length > 0 && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            {conv.actionItems.length} action item(s)
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
