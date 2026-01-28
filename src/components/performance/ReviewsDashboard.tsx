import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  PerformanceReview, 
  reviewStatusLabels,
  reviewCycleLabels,
  defaultReviewCriteria 
} from '@/types/performance';
import { StaffMember } from '@/types/staff';
import { format, parseISO } from 'date-fns';
import { 
  ClipboardCheck, 
  Calendar, 
  Star,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewsDashboardProps {
  reviews: PerformanceReview[];
  staff: StaffMember[];
  currentUserId: string;
  onCreateReview: () => void;
  onViewReview: (review: PerformanceReview) => void;
}

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending_self: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  pending_manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-muted text-muted-foreground line-through',
};

const statusIcons: Record<string, React.ReactNode> = {
  draft: <Clock className="h-3.5 w-3.5" />,
  pending_self: <AlertCircle className="h-3.5 w-3.5" />,
  pending_manager: <Clock className="h-3.5 w-3.5" />,
  completed: <CheckCircle2 className="h-3.5 w-3.5" />,
  cancelled: <Clock className="h-3.5 w-3.5" />,
};

export function ReviewsDashboard({ 
  reviews, 
  staff, 
  currentUserId,
  onCreateReview, 
  onViewReview 
}: ReviewsDashboardProps) {
  const getStaffMember = (staffId: string) => staff.find(s => s.id === staffId);

  // Separate reviews by status and relevance
  const pendingSelfReviews = reviews.filter(r => 
    r.status === 'pending_self' && r.staffId === currentUserId
  );
  const pendingManagerReviews = reviews.filter(r => 
    r.status === 'pending_manager' && r.reviewerId === currentUserId
  );
  const upcomingReviews = reviews.filter(r => 
    r.status === 'draft' || r.status === 'pending_self'
  );
  const completedReviews = reviews.filter(r => r.status === 'completed');

  const actionRequired = [...pendingSelfReviews, ...pendingManagerReviews];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10">
              <ClipboardCheck className="h-5 w-5 text-primary" />
            </div>
            Performance Reviews
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage appraisals and track performance cycles
          </p>
        </div>
        <Button onClick={onCreateReview} className="shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          Start Review
        </Button>
      </div>

      {/* Action Required Section */}
      {actionRequired.length > 0 && (
        <Card className="border-0 shadow-sm bg-amber-50/80 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2.5 text-amber-800 dark:text-amber-400">
              <div className="p-1.5 rounded-full bg-amber-500/20">
                <AlertCircle className="h-4 w-4" />
              </div>
              Action Required
              <Badge variant="secondary" className="ml-1">{actionRequired.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {actionRequired.map((review) => {
              const staffMember = getStaffMember(review.staffId);
              const isOwnReview = review.staffId === currentUserId;
              
              return (
                <div
                  key={review.id}
                  className="flex items-center gap-3 p-3 bg-background rounded-lg hover:shadow-sm cursor-pointer transition-all"
                  onClick={() => onViewReview(review)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={staffMember?.avatar} />
                    <AvatarFallback>
                      {staffMember?.firstName?.[0]}{staffMember?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">
                      {isOwnReview ? 'Your Self-Review' : `${staffMember?.firstName} ${staffMember?.lastName}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {reviewCycleLabels[review.reviewCycle]} Review • {format(parseISO(review.periodEnd), 'MMM yyyy')}
                    </p>
                  </div>
                  <Badge className={statusColors[review.status]}>
                    {statusIcons[review.status]}
                    <span className="ml-1">
                      {isOwnReview ? 'Complete Self-Review' : 'Complete Review'}
                    </span>
                  </Badge>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Reviews Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingReviews.length}</p>
                <p className="text-sm text-muted-foreground">Pending Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedReviews.length}</p>
                <p className="text-sm text-muted-foreground">Completed This Year</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {completedReviews.length > 0 
                    ? (completedReviews.reduce((sum, r) => sum + (r.overallManagerRating || 0), 0) / completedReviews.length).toFixed(1)
                    : '-'
                  }
                </p>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Reviews List */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          All Reviews
        </h3>
        
        {reviews.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <ClipboardCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No reviews yet</p>
              <Button variant="outline" className="mt-4" onClick={onCreateReview}>
                Start first review cycle
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => {
              const staffMember = getStaffMember(review.staffId);
              const reviewer = getStaffMember(review.reviewerId);
              
              return (
                <Card 
                  key={review.id}
                  className="hover:shadow-md transition-all cursor-pointer"
                  onClick={() => onViewReview(review)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={staffMember?.avatar} />
                        <AvatarFallback>
                          {staffMember?.firstName?.[0]}{staffMember?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">
                            {staffMember?.firstName} {staffMember?.lastName}
                          </p>
                          <Badge className={statusColors[review.status]}>
                            {statusIcons[review.status]}
                            <span className="ml-1">{reviewStatusLabels[review.status]}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {reviewCycleLabels[review.reviewCycle]} Review • 
                          {format(parseISO(review.periodStart), 'MMM d')} - {format(parseISO(review.periodEnd), 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Reviewer: {reviewer?.firstName} {reviewer?.lastName}
                        </p>
                      </div>

                      {review.status === 'completed' && review.overallManagerRating && (
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star className="h-5 w-5 fill-current" />
                            <span className="text-xl font-bold">{review.overallManagerRating}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Final Rating</p>
                        </div>
                      )}

                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReviewsDashboard;
