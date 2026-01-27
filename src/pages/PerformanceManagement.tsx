import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
import { GoalsTracker } from '@/components/performance/GoalsTracker';
import { ReviewsDashboard } from '@/components/performance/ReviewsDashboard';
import { FeedbackPanel } from '@/components/performance/FeedbackPanel';
import { ConversationsList } from '@/components/performance/ConversationsList';
import { GoalDetailSheet } from '@/components/performance/GoalDetailSheet';
import { ReviewExecutionSheet } from '@/components/performance/ReviewExecutionSheet';
import { ConversationDetailSheet } from '@/components/performance/ConversationDetailSheet';
import { PerformanceAnalyticsDashboard } from '@/components/performance/PerformanceAnalyticsDashboard';
import { TeamOverviewDashboard } from '@/components/performance/TeamOverviewDashboard';
import { PerformanceNotificationBell } from '@/components/performance/PerformanceNotificationBell';
import { usePerformanceData } from '@/hooks/usePerformanceData';
import { mockStaff } from '@/data/mockStaffData';
import { Goal, PerformanceReview, Conversation, Feedback, ReviewRating } from '@/types/performance';
import { Target, ClipboardCheck, MessageSquareHeart, MessageSquare, BarChart3, Users } from 'lucide-react';
import { toast } from 'sonner';

const CURRENT_USER_ID = 'staff-2'; // Sarah Williams - Lead Educator

export default function PerformanceManagement() {
  const [activeTab, setActiveTab] = useState('goals');
  const [feedbackView, setFeedbackView] = useState<'received' | 'given' | 'all'>('received');
  
  // Detail sheet states
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showGoalDetail, setShowGoalDetail] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);
  const [showReviewDetail, setShowReviewDetail] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showConversationDetail, setShowConversationDetail] = useState(false);
  
  const {
    reviews, goals, feedback, conversations, loading,
    fetchReviews, fetchGoals, fetchFeedback, fetchConversations,
    createGoal, updateGoal, updateGoalProgress, deleteGoal,
    createFeedback, submitSelfReview, completeManagerReview,
    addConversationNote, completeConversation
  } = usePerformanceData();

  useEffect(() => {
    fetchReviews();
    fetchGoals();
    fetchFeedback();
    fetchConversations();
  }, []);

  // Goal handlers
  const handleViewGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowGoalDetail(true);
  };

  const handleUpdateGoal = async (goalId: string, updates: Partial<Goal>) => {
    await updateGoal(goalId, updates);
    // Update local selected goal if it's the same
    if (selectedGoal?.id === goalId) {
      setSelectedGoal(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    await deleteGoal(goalId);
    setShowGoalDetail(false);
    setSelectedGoal(null);
  };

  // Review handlers
  const handleViewReview = (review: PerformanceReview) => {
    setSelectedReview(review);
    setShowReviewDetail(true);
  };

  const handleSubmitSelfReview = async (id: string, ratings: ReviewRating[], summary: string) => {
    await submitSelfReview(id, ratings, summary);
    toast.success('Self-review submitted successfully');
  };

  const handleCompleteManagerReview = async (
    id: string,
    ratings: ReviewRating[],
    summary: string,
    strengths: string[],
    areasForImprovement: string[],
    developmentPlan: string
  ) => {
    await completeManagerReview(id, ratings, summary, strengths, areasForImprovement, developmentPlan);
    toast.success('Review completed successfully');
  };

  // Conversation handlers
  const handleViewConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setShowConversationDetail(true);
  };

  const handleAddNote = async (id: string, content: string, createdBy: string) => {
    await addConversationNote(id, content, createdBy);
  };

  const handleCompleteConversation = async (id: string, actionItems: string[], nextMeetingDate?: string) => {
    await completeConversation(id, actionItems, nextMeetingDate);
  };

  // Feedback handler
  const handleSendFeedback = async (data: Omit<Feedback, 'id' | 'createdAt'>) => {
    await createFeedback(data);
  };

  // Notification navigation handlers
  const handleNotificationGoal = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      handleViewGoal(goal);
    }
  };

  const handleNotificationReview = (reviewId: string) => {
    const review = reviews.find(r => r.id === reviewId);
    if (review) {
      handleViewReview(review);
    }
  };

  const handleNotificationConversation = (conversationId: string) => {
    const conv = conversations.find(c => c.id === conversationId);
    if (conv) {
      handleViewConversation(conv);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Performance Management</h1>
              <p className="text-muted-foreground">Reviews, goals, feedback & continuous conversations</p>
            </div>
            <PerformanceNotificationBell
              goals={goals}
              reviews={reviews}
              conversations={conversations}
              currentUserId={CURRENT_USER_ID}
              onViewGoal={handleNotificationGoal}
              onViewReview={handleNotificationReview}
              onViewConversation={handleNotificationConversation}
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6 max-w-3xl">
              <TabsTrigger value="goals" className="flex items-center gap-2">
                <Target className="h-4 w-4" /> Goals
              </TabsTrigger>
              <TabsTrigger value="reviews" className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" /> Reviews
              </TabsTrigger>
              <TabsTrigger value="feedback" className="flex items-center gap-2">
                <MessageSquareHeart className="h-4 w-4" /> Feedback
              </TabsTrigger>
              <TabsTrigger value="conversations" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> 1:1s
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Team
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="goals" className="mt-6">
              <GoalsTracker
                goals={goals}
                onCreateGoal={() => toast.info('Goal creation modal - use the + button')}
                onViewGoal={handleViewGoal}
                onUpdateProgress={updateGoalProgress}
              />
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <ReviewsDashboard
                reviews={reviews}
                staff={mockStaff}
                currentUserId={CURRENT_USER_ID}
                onCreateReview={() => toast.info('Review creation modal - coming soon')}
                onViewReview={handleViewReview}
              />
            </TabsContent>

            <TabsContent value="feedback" className="mt-6">
              <FeedbackPanel
                feedback={feedback}
                staff={mockStaff}
                currentUserId={CURRENT_USER_ID}
                onSendFeedback={handleSendFeedback}
                view={feedbackView}
                onViewChange={setFeedbackView}
              />
            </TabsContent>

            <TabsContent value="conversations" className="mt-6">
              <ConversationsList
                conversations={conversations}
                staff={mockStaff}
                currentUserId={CURRENT_USER_ID}
                onScheduleConversation={() => toast.info('Schedule conversation modal - coming soon')}
                onViewConversation={handleViewConversation}
              />
            </TabsContent>

            <TabsContent value="team" className="mt-6">
              <TeamOverviewDashboard
                staff={mockStaff}
                goals={goals}
                reviews={reviews}
                feedback={feedback}
                conversations={conversations}
                currentUserId={CURRENT_USER_ID}
                onViewGoal={handleViewGoal}
                onViewReview={handleViewReview}
                onViewConversation={handleViewConversation}
              />
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <PerformanceAnalyticsDashboard
                goals={goals}
                reviews={reviews}
                feedback={feedback}
                conversations={conversations}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Goal Detail Sheet */}
      <GoalDetailSheet
        open={showGoalDetail}
        goal={selectedGoal}
        onClose={() => {
          setShowGoalDetail(false);
          setSelectedGoal(null);
        }}
        onUpdate={handleUpdateGoal}
        onUpdateProgress={updateGoalProgress}
        onDelete={handleDeleteGoal}
      />

      {/* Review Execution Sheet */}
      <ReviewExecutionSheet
        open={showReviewDetail}
        review={selectedReview}
        staff={mockStaff}
        currentUserId={CURRENT_USER_ID}
        onClose={() => {
          setShowReviewDetail(false);
          setSelectedReview(null);
        }}
        onSubmitSelfReview={handleSubmitSelfReview}
        onCompleteManagerReview={handleCompleteManagerReview}
      />

      {/* Conversation Detail Sheet */}
      <ConversationDetailSheet
        open={showConversationDetail}
        conversation={selectedConversation}
        staff={mockStaff}
        currentUserId={CURRENT_USER_ID}
        onClose={() => {
          setShowConversationDetail(false);
          setSelectedConversation(null);
        }}
        onAddNote={handleAddNote}
        onComplete={handleCompleteConversation}
      />
    </div>
  );
}
