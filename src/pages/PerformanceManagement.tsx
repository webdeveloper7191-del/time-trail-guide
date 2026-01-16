import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
import { GoalsTracker } from '@/components/performance/GoalsTracker';
import { ReviewsDashboard } from '@/components/performance/ReviewsDashboard';
import { FeedbackPanel } from '@/components/performance/FeedbackPanel';
import { ConversationsList } from '@/components/performance/ConversationsList';
import { usePerformanceData } from '@/hooks/usePerformanceData';
import { mockStaff } from '@/data/mockStaffData';
import { Goal, PerformanceReview, Conversation, Feedback } from '@/types/performance';
import { Target, ClipboardCheck, MessageSquareHeart, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const CURRENT_USER_ID = 'staff-2'; // Sarah Williams - Lead Educator

export default function PerformanceManagement() {
  const [activeTab, setActiveTab] = useState('goals');
  const [feedbackView, setFeedbackView] = useState<'received' | 'given' | 'all'>('received');
  
  const {
    reviews, goals, feedback, conversations, loading,
    fetchReviews, fetchGoals, fetchFeedback, fetchConversations,
    createGoal, updateGoalProgress, createFeedback
  } = usePerformanceData();

  useEffect(() => {
    fetchReviews();
    fetchGoals();
    fetchFeedback();
    fetchConversations();
  }, []);

  const handleCreateGoal = () => toast.info('Goal creation modal - coming soon');
  const handleViewGoal = (goal: Goal) => toast.info(`Viewing goal: ${goal.title}`);
  const handleCreateReview = () => toast.info('Review creation modal - coming soon');
  const handleViewReview = (review: PerformanceReview) => toast.info(`Viewing review: ${review.id}`);
  const handleScheduleConversation = () => toast.info('Schedule conversation modal - coming soon');
  const handleViewConversation = (conv: Conversation) => toast.info(`Viewing: ${conv.title}`);

  const handleSendFeedback = async (data: Omit<Feedback, 'id' | 'createdAt'>) => {
    await createFeedback(data);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Performance Management</h1>
            <p className="text-muted-foreground">Reviews, goals, feedback & continuous conversations</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 max-w-xl">
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
            </TabsList>

            <TabsContent value="goals" className="mt-6">
              <GoalsTracker
                goals={goals}
                onCreateGoal={handleCreateGoal}
                onViewGoal={handleViewGoal}
                onUpdateProgress={updateGoalProgress}
              />
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <ReviewsDashboard
                reviews={reviews}
                staff={mockStaff}
                currentUserId={CURRENT_USER_ID}
                onCreateReview={handleCreateReview}
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
                onScheduleConversation={handleScheduleConversation}
                onViewConversation={handleViewConversation}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
