import React, { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Target,
  ClipboardCheck,
  MessageSquare,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  Circle,
  AlertCircle,
  Play,
  Pause,
  XCircle,
  ChevronRight,
  FileText,
  MoreVertical,
} from 'lucide-react';
import { format, parseISO, differenceInDays, isPast, isToday } from 'date-fns';
import { 
  AssignedPlan, 
  planTypeLabels, 
  planStatusLabels, 
  planStatusColors, 
  planTypeColors,
  PlanStatus,
} from '@/types/performancePlan';
import { performancePlanTemplates } from '@/data/mockPerformancePlanTemplates';
import { Goal, PerformanceReview, Conversation } from '@/types/performance';
import { StaffMember } from '@/types/staff';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface PlanDetailSheetProps {
  open: boolean;
  plan: AssignedPlan | null;
  staff: StaffMember[];
  goals: Goal[];
  reviews: PerformanceReview[];
  conversations: Conversation[];
  onClose: () => void;
  onViewGoal: (goal: Goal) => void;
  onViewReview: (review: PerformanceReview) => void;
  onViewConversation: (conversation: Conversation) => void;
  onUpdateStatus: (planId: string, status: PlanStatus) => Promise<void>;
}

export function PlanDetailSheet({
  open,
  plan,
  staff,
  goals,
  reviews,
  conversations,
  onClose,
  onViewGoal,
  onViewReview,
  onViewConversation,
  onUpdateStatus,
}: PlanDetailSheetProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [updating, setUpdating] = useState(false);

  const template = useMemo(() => {
    if (!plan) return null;
    return performancePlanTemplates.find(t => t.id === plan.templateId);
  }, [plan]);

  const staffMember = useMemo(() => {
    if (!plan) return null;
    return staff.find(s => s.id === plan.staffId);
  }, [plan, staff]);

  const assignedBy = useMemo(() => {
    if (!plan) return null;
    return staff.find(s => s.id === plan.assignedBy);
  }, [plan, staff]);

  const planGoals = useMemo(() => {
    if (!plan) return [];
    return goals.filter(g => plan.goalIds.includes(g.id));
  }, [plan, goals]);

  const planReviews = useMemo(() => {
    if (!plan) return [];
    return reviews.filter(r => plan.reviewIds.includes(r.id));
  }, [plan, reviews]);

  const planConversations = useMemo(() => {
    if (!plan) return [];
    return conversations.filter(c => plan.conversationIds.includes(c.id));
  }, [plan, conversations]);

  const getDaysRemaining = () => {
    if (!plan) return '';
    const days = differenceInDays(parseISO(plan.endDate), new Date());
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Ends today';
    return `${days} days remaining`;
  };

  const getTimelineStatus = (daysFromStart: number) => {
    if (!plan) return 'future';
    const itemDate = new Date(parseISO(plan.startDate));
    itemDate.setDate(itemDate.getDate() + daysFromStart);
    
    if (isPast(itemDate) && !isToday(itemDate)) return 'past';
    if (isToday(itemDate)) return 'today';
    return 'future';
  };

  const handleStatusChange = async (newStatus: PlanStatus) => {
    if (!plan) return;
    setUpdating(true);
    try {
      await onUpdateStatus(plan.id, newStatus);
      toast.success(`Plan status updated to ${planStatusLabels[newStatus]}`);
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (!plan || !template) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col">
        <SheetHeader className="space-y-4 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={staffMember?.avatar} />
                <AvatarFallback>
                  {staffMember?.firstName[0]}{staffMember?.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-left">
                  {staffMember?.firstName} {staffMember?.lastName}
                </SheetTitle>
                <p className="text-sm text-muted-foreground">
                  {staffMember?.position}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={updating}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {plan.status !== 'active' && (
                  <DropdownMenuItem onClick={() => handleStatusChange('active')}>
                    <Play className="h-4 w-4 mr-2" />
                    Set as Active
                  </DropdownMenuItem>
                )}
                {plan.status === 'active' && (
                  <DropdownMenuItem onClick={() => handleStatusChange('on_hold')}>
                    <Pause className="h-4 w-4 mr-2" />
                    Put on Hold
                  </DropdownMenuItem>
                )}
                {plan.status !== 'completed' && (
                  <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark as Completed
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleStatusChange('cancelled')}
                  className="text-destructive"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Plan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={planTypeColors[plan.type]}>
              {planTypeLabels[plan.type]}
            </Badge>
            <Badge className={planStatusColors[plan.status]}>
              {planStatusLabels[plan.status]}
            </Badge>
          </div>

          <Card className="bg-muted/50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{plan.templateName}</span>
              </div>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </CardContent>
          </Card>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-4 mt-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="goals">
              Goals ({planGoals.length})
            </TabsTrigger>
            <TabsTrigger value="reviews">
              Reviews ({planReviews.length})
            </TabsTrigger>
            <TabsTrigger value="conversations">
              1:1s ({planConversations.length})
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 -mx-6 px-6">
            <TabsContent value="overview" className="mt-4 space-y-4">
              {/* Progress */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">{plan.progress}%</span>
                    <span className="text-sm text-muted-foreground">{getDaysRemaining()}</span>
                  </div>
                  <Progress value={plan.progress} className="h-3" />
                </CardContent>
              </Card>

              {/* Dates */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      Start Date
                    </div>
                    <span className="font-medium">{format(parseISO(plan.startDate), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      End Date
                    </div>
                    <span className="font-medium">{format(parseISO(plan.endDate), 'MMM d, yyyy')}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Assigned By
                    </div>
                    <span className="font-medium">
                      {assignedBy?.firstName} {assignedBy?.lastName}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {plan.notes && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{plan.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Summary Stats */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Plan Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <Target className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="text-2xl font-bold">{planGoals.length}</p>
                      <p className="text-xs text-muted-foreground">Goals</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <ClipboardCheck className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="text-2xl font-bold">{planReviews.length}</p>
                      <p className="text-xs text-muted-foreground">Reviews</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <MessageSquare className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="text-2xl font-bold">{planConversations.length}</p>
                      <p className="text-xs text-muted-foreground">1:1 Meetings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="goals" className="mt-4 space-y-3">
              {planGoals.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No goals linked to this plan yet</p>
                  </CardContent>
                </Card>
              ) : (
                planGoals.map((goal) => (
                  <Card 
                    key={goal.id} 
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => onViewGoal(goal)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {goal.status === 'completed' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : goal.status === 'overdue' ? (
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground" />
                            )}
                            <h4 className="font-medium">{goal.title}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {goal.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <Progress value={goal.progress} className="flex-1 h-2" />
                            <span className="text-sm font-medium">{goal.progress}%</span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="reviews" className="mt-4 space-y-3">
              {planReviews.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <ClipboardCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No reviews scheduled for this plan</p>
                  </CardContent>
                </Card>
              ) : (
                planReviews.map((review) => (
                  <Card 
                    key={review.id} 
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => onViewReview(review)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">
                            {review.reviewCycle.replace('_', ' ')} Review
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(review.periodStart), 'MMM yyyy')} - {format(parseISO(review.periodEnd), 'MMM yyyy')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={review.status === 'completed' ? 'default' : 'secondary'}>
                            {review.status.replace('_', ' ')}
                          </Badge>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="conversations" className="mt-4 space-y-3">
              {planConversations.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No conversations scheduled for this plan</p>
                  </CardContent>
                </Card>
              ) : (
                planConversations.map((conv) => (
                  <Card 
                    key={conv.id} 
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => onViewConversation(conv)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{conv.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(conv.scheduledDate), 'MMM d, yyyy')} • {conv.duration} min
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {conv.completed ? (
                            <Badge variant="default" className="bg-green-500">Completed</Badge>
                          ) : isPast(parseISO(conv.scheduledDate)) ? (
                            <Badge variant="destructive">Overdue</Badge>
                          ) : (
                            <Badge variant="secondary">Scheduled</Badge>
                          )}
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
