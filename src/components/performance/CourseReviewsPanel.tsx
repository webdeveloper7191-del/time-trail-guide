import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Star, 
  ThumbsUp, 
  MessageSquare, 
  Edit2, 
  CheckCircle,
  User,
  PenLine,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { CourseReview, ReviewSummary } from '@/types/lmsEngagement';
import { mockCourseReviews, mockReviewSummaries } from '@/data/mockLmsEngagementData';
import { mockCourses, mockEnrollments } from '@/data/mockLmsData';
import { toast } from 'sonner';

interface CourseReviewsPanelProps {
  currentUserId: string;
  courseId?: string; // If provided, show reviews for specific course
}

export function CourseReviewsPanel({ currentUserId, courseId }: CourseReviewsPanelProps) {
  const [reviews, setReviews] = useState<CourseReview[]>(mockCourseReviews);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [newReview, setNewReview] = useState({ rating: 0, title: '', review: '' });
  const [hoverRating, setHoverRating] = useState(0);

  // Get completed courses for the user that they haven't reviewed
  const completedEnrollments = mockEnrollments.filter(
    e => e.staffId === currentUserId && e.status === 'completed'
  );
  
  const reviewedCourseIds = reviews
    .filter(r => r.staffId === currentUserId)
    .map(r => r.courseId);
  
  const coursesToReview = completedEnrollments
    .filter(e => !reviewedCourseIds.includes(e.courseId))
    .map(e => mockCourses.find(c => c.id === e.courseId))
    .filter(Boolean);

  const userReviews = reviews.filter(r => r.staffId === currentUserId);

  const displayedReviews = courseId 
    ? reviews.filter(r => r.courseId === courseId)
    : reviews;

  const handleSubmitReview = () => {
    if (!selectedCourseId || newReview.rating === 0 || !newReview.title || !newReview.review) {
      toast.error('Please fill in all fields');
      return;
    }

    const review: CourseReview = {
      id: `review-${Date.now()}`,
      staffId: currentUserId,
      staffName: 'Current User',
      courseId: selectedCourseId,
      rating: newReview.rating,
      title: newReview.title,
      review: newReview.review,
      helpfulCount: 0,
      verified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setReviews(prev => [review, ...prev]);
    setShowWriteReview(false);
    setSelectedCourseId(null);
    setNewReview({ rating: 0, title: '', review: '' });
    toast.success('Review submitted! Thank you for your feedback.');
  };

  const handleHelpful = (reviewId: string) => {
    setReviews(prev => prev.map(r => 
      r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r
    ));
    toast.success('Marked as helpful');
  };

  const getCourseTitle = (cId: string) => 
    mockCourses.find(c => c.id === cId)?.title || 'Unknown Course';

  const getReviewSummary = (cId: string): ReviewSummary | undefined => 
    mockReviewSummaries[cId];

  return (
    <div className="space-y-6">
      {/* Header with Write Review CTA */}
      {!courseId && coursesToReview.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <PenLine className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Share Your Experience</p>
                  <p className="text-sm text-muted-foreground">
                    You have {coursesToReview.length} course{coursesToReview.length > 1 ? 's' : ''} to review
                  </p>
                </div>
              </div>
              <Button onClick={() => setShowWriteReview(true)}>
                Write a Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Your Reviews */}
      {!courseId && userReviews.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Your Reviews</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {userReviews.map((review) => (
              <ReviewCard 
                key={review.id} 
                review={review} 
                showCourse 
                onHelpful={handleHelpful}
                isOwn
              />
            ))}
          </div>
        </div>
      )}

      {/* All Reviews or Course-Specific Reviews */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">
          {courseId ? 'Course Reviews' : 'Recent Reviews'}
        </h3>
        
        {courseId && (
          <ReviewSummaryCard summary={getReviewSummary(courseId)} />
        )}
        
        <div className="space-y-3">
          {displayedReviews
            .filter(r => r.staffId !== currentUserId)
            .slice(0, 10)
            .map((review) => (
              <ReviewCard 
                key={review.id} 
                review={review} 
                showCourse={!courseId}
                onHelpful={handleHelpful}
              />
            ))}
          
          {displayedReviews.filter(r => r.staffId !== currentUserId).length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">No reviews yet</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Be the first to share your experience
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Write Review Dialog */}
      <Dialog open={showWriteReview} onOpenChange={setShowWriteReview}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Course Selection */}
            <div className="space-y-2">
              <Label>Select Course</Label>
              <div className="grid gap-2 max-h-32 overflow-y-auto">
                {coursesToReview.map((course) => (
                  <button
                    key={course!.id}
                    className={cn(
                      "text-left p-3 rounded-lg border transition-colors",
                      selectedCourseId === course!.id 
                        ? "border-primary bg-primary/5" 
                        : "hover:bg-muted"
                    )}
                    onClick={() => setSelectedCourseId(course!.id)}
                  >
                    <p className="font-medium text-sm">{course!.title}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <Label>Your Rating</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className="p-1"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                  >
                    <Star 
                      className={cn(
                        "h-8 w-8 transition-colors",
                        (hoverRating || newReview.rating) >= star 
                          ? "fill-amber-400 text-amber-400" 
                          : "text-muted-foreground"
                      )} 
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">
                  {newReview.rating > 0 && `${newReview.rating} star${newReview.rating > 1 ? 's' : ''}`}
                </span>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label>Review Title</Label>
              <Input
                placeholder="Summarize your experience"
                value={newReview.title}
                onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            {/* Review */}
            <div className="space-y-2">
              <Label>Your Review</Label>
              <Textarea
                placeholder="Share what you learned, what you liked, and any suggestions..."
                rows={4}
                value={newReview.review}
                onChange={(e) => setNewReview(prev => ({ ...prev, review: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWriteReview(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReview}>
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReviewSummaryCard({ summary }: { summary?: ReviewSummary }) {
  if (!summary) return null;

  const maxRatingCount = Math.max(...Object.values(summary.ratingDistribution));

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-4xl font-bold">{summary.averageRating.toFixed(1)}</p>
            <div className="flex items-center gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star}
                  className={cn(
                    "h-4 w-4",
                    star <= Math.round(summary.averageRating) 
                      ? "fill-amber-400 text-amber-400" 
                      : "text-muted-foreground"
                  )} 
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.totalReviews} reviews
            </p>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-2">
                <span className="text-xs w-3">{rating}</span>
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-400 rounded-full"
                    style={{ 
                      width: `${(summary.ratingDistribution[rating as 1|2|3|4|5] / maxRatingCount) * 100}%` 
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8">
                  {summary.ratingDistribution[rating as 1|2|3|4|5]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ReviewCardProps {
  review: CourseReview;
  showCourse?: boolean;
  onHelpful: (reviewId: string) => void;
  isOwn?: boolean;
}

function ReviewCard({ review, showCourse, onHelpful, isOwn }: ReviewCardProps) {
  const getCourseTitle = (cId: string) => 
    mockCourses.find(c => c.id === cId)?.title || 'Unknown Course';

  return (
    <Card className={cn(isOwn && "border-primary/20 bg-primary/5")}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {review.staffName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{review.staffName}</span>
              {review.verified && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Verified
                </Badge>
              )}
              {isOwn && (
                <Badge variant="outline" className="text-xs">Your Review</Badge>
              )}
            </div>
            
            {showCourse && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {getCourseTitle(review.courseId)}
              </p>
            )}
            
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star}
                  className={cn(
                    "h-3.5 w-3.5",
                    star <= review.rating 
                      ? "fill-amber-400 text-amber-400" 
                      : "text-muted-foreground"
                  )} 
                />
              ))}
              <span className="text-xs text-muted-foreground ml-2">
                {format(parseISO(review.createdAt), 'MMM d, yyyy')}
              </span>
            </div>
            
            <h4 className="font-medium mt-2">{review.title}</h4>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {review.review}
            </p>
            
            <div className="flex items-center gap-3 mt-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => onHelpful(review.id)}
                disabled={isOwn}
              >
                <ThumbsUp className="h-3 w-3 mr-1" />
                Helpful ({review.helpfulCount})
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
