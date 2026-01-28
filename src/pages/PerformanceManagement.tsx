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
import { ScheduleConversationModal } from '@/components/performance/ScheduleConversationModal';
import { StartReviewModal } from '@/components/performance/StartReviewModal';
import { usePerformanceData } from '@/hooks/usePerformanceData';
import { mockStaff } from '@/data/mockStaffData';
import { mockAssignedPlans } from '@/data/mockPerformancePlanTemplates';
import { Goal, PerformanceReview, Conversation, Feedback, ReviewRating } from '@/types/performance';
import { PerformancePlanTemplate, AssignedPlan, PlanStatus } from '@/types/performancePlan';
import { Target, ClipboardCheck, MessageSquareHeart, MessageSquare, BarChart3, Users, FileText, ListTodo, UserPlus, GraduationCap, Plus, Calendar } from 'lucide-react';
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
  const [showScheduleConversationModal, setShowScheduleConversationModal] = useState(false);
  const [showStartReviewModal, setShowStartReviewModal] = useState(false);
  
  const {
    reviews, goals, feedback, conversations, loading,
    fetchReviews, fetchGoals, fetchFeedback, fetchConversations,
    createGoal, updateGoal, updateGoalProgress, deleteGoal,
    createFeedback, submitSelfReview, completeManagerReview,
    createReview, createConversation,
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
    // Deep clone with new IDs for all nested items
    const duplicated: PerformancePlanTemplate = {
      ...template,
      id: `tpl-custom-${Date.now()}`,
      name: `${template.name} (Copy)`,
      isSystem: false,
      goals: template.goals.map(g => ({
        ...g,
        id: `g-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        milestones: g.milestones.map(m => ({ ...m })),
      })),
      reviews: template.reviews.map(r => ({
        ...r,
        id: `r-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      })),
      conversations: template.conversations.map(c => ({
        ...c,
        id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingTemplate(duplicated);
    setShowCreateTemplateDrawer(true);
    toast.info('Customize this template and save as your own');
  };

  const handleSaveTemplate = async (template: Omit<PerformancePlanTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    // In a real app, this would save to backend
    console.log('Saving template:', template);
    const isEditing = editingTemplate !== null;
    setShowCreateTemplateDrawer(false);
    setEditingTemplate(null);
    toast.success(isEditing ? 'Template updated successfully!' : 'Template created successfully!');
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
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Enhanced Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Performance Management
              </h1>
              <p className="text-base text-muted-foreground">
                Track development plans, reviews, goals, and continuous feedback
              </p>
            </div>
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

          {/* Refined Tab Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between border-b border-border/60">
              <TabsList className="h-12 bg-transparent p-0 gap-1">
                <TabsTrigger 
                  value="plans" 
                  className="px-4 py-2.5 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none text-muted-foreground data-[state=active]:text-foreground font-medium transition-colors"
                >
                  <FileText className="h-4 w-4 mr-2" /> Plans
                </TabsTrigger>
                <TabsTrigger 
                  value="lms" 
                  className="px-4 py-2.5 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none text-muted-foreground data-[state=active]:text-foreground font-medium transition-colors"
                >
                  <GraduationCap className="h-4 w-4 mr-2" /> Learning
                </TabsTrigger>
                <TabsTrigger 
                  value="tasks" 
                  className="px-4 py-2.5 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none text-muted-foreground data-[state=active]:text-foreground font-medium transition-colors"
                >
                  <ListTodo className="h-4 w-4 mr-2" /> Tasks
                </TabsTrigger>
                <TabsTrigger 
                  value="goals" 
                  className="px-4 py-2.5 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none text-muted-foreground data-[state=active]:text-foreground font-medium transition-colors"
                >
                  <Target className="h-4 w-4 mr-2" /> Goals
                </TabsTrigger>
                <TabsTrigger 
                  value="reviews" 
                  className="px-4 py-2.5 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none text-muted-foreground data-[state=active]:text-foreground font-medium transition-colors"
                >
                  <ClipboardCheck className="h-4 w-4 mr-2" /> Reviews
                </TabsTrigger>
                <TabsTrigger 
                  value="feedback" 
                  className="px-4 py-2.5 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none text-muted-foreground data-[state=active]:text-foreground font-medium transition-colors"
                >
                  <MessageSquareHeart className="h-4 w-4 mr-2" /> Feedback
                </TabsTrigger>
                <TabsTrigger 
                  value="conversations" 
                  className="px-4 py-2.5 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none text-muted-foreground data-[state=active]:text-foreground font-medium transition-colors"
                >
                  <MessageSquare className="h-4 w-4 mr-2" /> 1:1s
                </TabsTrigger>
                <TabsTrigger 
                  value="team" 
                  className="px-4 py-2.5 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none text-muted-foreground data-[state=active]:text-foreground font-medium transition-colors"
                >
                  <Users className="h-4 w-4 mr-2" /> Team
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics" 
                  className="px-4 py-2.5 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none text-muted-foreground data-[state=active]:text-foreground font-medium transition-colors"
                >
                  <BarChart3 className="h-4 w-4 mr-2" /> Analytics
                </TabsTrigger>
              </TabsList>
              {/* Contextual Action Buttons */}
              {activeTab === 'goals' && (
                <Button 
                  onClick={() => setShowCreateGoalModal(true)} 
                  className="gap-2 shadow-sm"
                  size="default"
                >
                  <Plus className="h-4 w-4" />
                  New Goal
                </Button>
              )}
              {activeTab === 'reviews' && (
                <Button 
                  onClick={() => setShowStartReviewModal(true)} 
                  className="gap-2 shadow-sm"
                  size="default"
                >
                  <Plus className="h-4 w-4" />
                  Start Review
                </Button>
              )}
              {activeTab === 'conversations' && (
                <Button 
                  onClick={() => setShowScheduleConversationModal(true)} 
                  className="gap-2 shadow-sm"
                  size="default"
                >
                  <Calendar className="h-4 w-4" />
                  Schedule 1:1
                </Button>
              )}
            </div>

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
                onQuickAssignPlan={() => setShowQuickAssignDrawer(true)}
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
                onCreateReview={() => setShowStartReviewModal(true)}
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
                onScheduleConversation={() => setShowScheduleConversationModal(true)}
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

      {/* Schedule Conversation Modal */}
      <ScheduleConversationModal
        open={showScheduleConversationModal}
        onOpenChange={setShowScheduleConversationModal}
        staff={mockStaff}
        managerId={CURRENT_USER_ID}
        onSubmit={async (data) => {
          await createConversation(data);
        }}
      />

      {/* Start Review Modal */}
      <StartReviewModal
        open={showStartReviewModal}
        onOpenChange={setShowStartReviewModal}
        staff={mockStaff}
        reviewerId={CURRENT_USER_ID}
        onSubmit={async (data) => {
          await createReview(data);
        }}
      />
    </div>
  );
}
