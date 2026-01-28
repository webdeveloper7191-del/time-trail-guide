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
import { PlanManagementPanel } from '@/components/performance/PlanManagementPanel';
import { AssignPlanDrawer } from '@/components/performance/AssignPlanDrawer';
import { BulkAssignPlanDrawer } from '@/components/performance/BulkAssignPlanDrawer';
import { PlanDetailSheet } from '@/components/performance/PlanDetailSheet';
import { PlanTemplatePreviewSheet } from '@/components/performance/PlanTemplatePreviewSheet';
import { CreateTemplateDrawer } from '@/components/performance/CreateTemplateDrawer';
import { QuickAssignPlanDrawer } from '@/components/performance/QuickAssignPlanDrawer';
import { PerformanceTaskManagementPanel } from '@/components/performance/PerformanceTaskManagementPanel';
import { CreateGoalModal } from '@/components/performance/CreateGoalModal';
import { LMSAdminModule } from '@/components/performance/LMSAdminModule';
import { usePerformanceData } from '@/hooks/usePerformanceData';
import { mockStaff } from '@/data/mockStaffData';
import { mockAssignedPlans } from '@/data/mockPerformancePlanTemplates';
import { Goal, PerformanceReview, Conversation, Feedback, ReviewRating } from '@/types/performance';
import { PerformancePlanTemplate, AssignedPlan, PlanStatus } from '@/types/performancePlan';
import { Target, ClipboardCheck, MessageSquareHeart, MessageSquare, BarChart3, Users, FileText, ListTodo, UserPlus, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const CURRENT_USER_ID = 'staff-2'; // Sarah Williams - Lead Educator

export default function PerformanceManagement() {
  const [activeTab, setActiveTab] = useState('plans');
  const [feedbackView, setFeedbackView] = useState<'received' | 'given' | 'all'>('received');
  
  // Detail sheet states
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showGoalDetail, setShowGoalDetail] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);
  const [showReviewDetail, setShowReviewDetail] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showConversationDetail, setShowConversationDetail] = useState(false);
  
  // Plan-related states
  const [selectedTemplate, setSelectedTemplate] = useState<PerformancePlanTemplate | null>(null);
  const [showAssignDrawer, setShowAssignDrawer] = useState(false);
  const [showBulkAssignDrawer, setShowBulkAssignDrawer] = useState(false);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [showCreateTemplateDrawer, setShowCreateTemplateDrawer] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PerformancePlanTemplate | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<AssignedPlan | null>(null);
  const [showPlanDetail, setShowPlanDetail] = useState(false);
  const [showQuickAssignDrawer, setShowQuickAssignDrawer] = useState(false);
  const [showCreateGoalModal, setShowCreateGoalModal] = useState(false);
  
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

  // Plan handlers
  const handleAssignPlan = (template: PerformancePlanTemplate) => {
    setSelectedTemplate(template);
    setShowAssignDrawer(true);
  };

  const handleBulkAssignPlan = (template: PerformancePlanTemplate) => {
    setSelectedTemplate(template);
    setShowBulkAssignDrawer(true);
  };

  const handleViewTemplate = (template: PerformancePlanTemplate) => {
    setSelectedTemplate(template);
    setShowTemplatePreview(true);
  };

  const handleViewPlan = (plan: AssignedPlan) => {
    setSelectedPlan(plan);
    setShowPlanDetail(true);
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setShowCreateTemplateDrawer(true);
  };

  const handleEditTemplate = (template: PerformancePlanTemplate) => {
    setEditingTemplate(template);
    setShowCreateTemplateDrawer(true);
  };

  const handleDuplicateTemplate = (template: PerformancePlanTemplate) => {
    const duplicated = { ...template, name: `${template.name} (Copy)`, isSystem: false };
    setEditingTemplate(duplicated as PerformancePlanTemplate);
    setShowCreateTemplateDrawer(true);
    toast.info('Editing duplicate - make changes and save');
  };

  const handleSaveTemplate = async (template: Omit<PerformancePlanTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    // In a real app, this would save to backend
    console.log('Saving template:', template);
    setShowCreateTemplateDrawer(false);
    setEditingTemplate(null);
  };

  const handleAssignPlanSubmit = async (data: {
    templateId: string;
    staffId: string;
    startDate: Date;
    notes?: string;
    selectedGoals: string[];
    selectedReviews: string[];
    selectedConversations: string[];
  }) => {
    // In a real app, this would create goals, reviews, and conversations
    // and link them to a new AssignedPlan
    console.log('Assigning plan:', data);
    toast.success('Performance plan assigned successfully!');
    setShowAssignDrawer(false);
    setSelectedTemplate(null);
  };

  const handleBulkAssignPlanSubmit = async (
    assignments: { staffId: string; startDate: Date; notes?: string }[],
    selectedGoals: string[],
    selectedReviews: string[],
    selectedConversations: string[]
  ) => {
    // In a real app, this would create multiple plans
    console.log('Bulk assigning plans:', assignments);
    toast.success(`Plans assigned to ${assignments.length} team members!`);
    setShowBulkAssignDrawer(false);
    setSelectedTemplate(null);
  };

  const handleUpdatePlanStatus = async (planId: string, status: PlanStatus) => {
    // In a real app, this would update the plan status in the backend
    console.log('Updating plan status:', planId, status);
    // Mock update for demonstration
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Performance Management</h1>
              <p className="text-muted-foreground">Plans, reviews, goals, feedback & continuous conversations</p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => setShowQuickAssignDrawer(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Assign Plan
              </Button>
              <PerformanceNotificationBell
                goals={goals}
                reviews={reviews}
                conversations={conversations}
                plans={mockAssignedPlans}
                currentUserId={CURRENT_USER_ID}
                onViewGoal={handleNotificationGoal}
                onViewReview={handleNotificationReview}
                onViewConversation={handleNotificationConversation}
                onViewPlan={(planId) => {
                  const plan = mockAssignedPlans.find(p => p.id === planId);
                  if (plan) handleViewPlan(plan);
                }}
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-9 max-w-6xl">
              <TabsTrigger value="plans" className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> Plans
              </TabsTrigger>
              <TabsTrigger value="lms" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" /> LMS
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <ListTodo className="h-4 w-4" /> Tasks
              </TabsTrigger>
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

            <TabsContent value="plans" className="mt-6">
              <PlanManagementPanel
                staff={mockStaff}
                goals={goals}
                reviews={reviews}
                conversations={conversations}
                onAssignPlan={handleAssignPlan}
                onBulkAssignPlan={handleBulkAssignPlan}
                onViewPlan={handleViewPlan}
                onViewTemplate={handleViewTemplate}
                onCreateTemplate={handleCreateTemplate}
                onEditTemplate={handleEditTemplate}
                onDuplicateTemplate={handleDuplicateTemplate}
              />
            </TabsContent>

            <TabsContent value="lms" className="mt-6">
              <LMSAdminModule
                currentUserId={CURRENT_USER_ID}
                staff={mockStaff}
              />
            </TabsContent>

            <TabsContent value="tasks" className="mt-6">
              <PerformanceTaskManagementPanel
                currentUserId={CURRENT_USER_ID}
                goals={goals}
                reviews={reviews}
                conversations={conversations}
                onNavigateToGoal={handleNotificationGoal}
                onNavigateToReview={handleNotificationReview}
                onNavigateToConversation={handleNotificationConversation}
              />
            </TabsContent>

            <TabsContent value="goals" className="mt-6">
              <GoalsTracker
                goals={goals}
                onCreateGoal={() => setShowCreateGoalModal(true)}
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

      {/* Plan Template Preview Sheet */}
      <PlanTemplatePreviewSheet
        open={showTemplatePreview}
        template={selectedTemplate}
        onClose={() => {
          setShowTemplatePreview(false);
          setSelectedTemplate(null);
        }}
        onAssign={(template) => {
          setShowTemplatePreview(false);
          handleAssignPlan(template);
        }}
      />

      {/* Assign Plan Drawer */}
      <AssignPlanDrawer
        open={showAssignDrawer}
        template={selectedTemplate}
        staff={mockStaff}
        currentUserId={CURRENT_USER_ID}
        onClose={() => {
          setShowAssignDrawer(false);
          setSelectedTemplate(null);
        }}
        onAssign={handleAssignPlanSubmit}
      />

      {/* Plan Detail Sheet */}
      <PlanDetailSheet
        open={showPlanDetail}
        plan={selectedPlan}
        staff={mockStaff}
        goals={goals}
        reviews={reviews}
        conversations={conversations}
        onClose={() => {
          setShowPlanDetail(false);
          setSelectedPlan(null);
        }}
        onViewGoal={(goal) => {
          setShowPlanDetail(false);
          handleViewGoal(goal);
        }}
        onViewReview={(review) => {
          setShowPlanDetail(false);
          handleViewReview(review);
        }}
        onViewConversation={(conv) => {
          setShowPlanDetail(false);
          handleViewConversation(conv);
        }}
        onUpdateStatus={handleUpdatePlanStatus}
      />

      {/* Bulk Assign Plan Drawer */}
      <BulkAssignPlanDrawer
        open={showBulkAssignDrawer}
        template={selectedTemplate}
        staff={mockStaff}
        currentUserId={CURRENT_USER_ID}
        onClose={() => {
          setShowBulkAssignDrawer(false);
          setSelectedTemplate(null);
        }}
        onAssign={handleBulkAssignPlanSubmit}
      />

      {/* Create/Edit Template Drawer */}
      <CreateTemplateDrawer
        open={showCreateTemplateDrawer}
        existingTemplate={editingTemplate}
        onClose={() => {
          setShowCreateTemplateDrawer(false);
          setEditingTemplate(null);
        }}
        onSave={handleSaveTemplate}
      />

      {/* Quick Assign Plan Drawer */}
      <QuickAssignPlanDrawer
        open={showQuickAssignDrawer}
        staff={mockStaff}
        currentUserId={CURRENT_USER_ID}
        onClose={() => setShowQuickAssignDrawer(false)}
        onAssign={handleAssignPlanSubmit}
      />

      {/* Create Goal Modal */}
      <CreateGoalModal
        open={showCreateGoalModal}
        onOpenChange={setShowCreateGoalModal}
        staffId={CURRENT_USER_ID}
        createdBy={CURRENT_USER_ID}
        onSubmit={async (data) => {
          await createGoal(data);
        }}
      />
    </div>
  );
}
