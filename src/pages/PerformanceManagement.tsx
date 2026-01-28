import React, { useState, useEffect, useMemo } from 'react';
import { Box, Stack, Typography, Tab } from '@mui/material';
import { Tabs } from '@/components/mui/Tabs';
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
import { CreateGoalDrawer } from '@/components/performance/CreateGoalDrawer';
import { LMSAdminModule } from '@/components/performance/LMSAdminModule';
import { ScheduleConversationDrawer } from '@/components/performance/ScheduleConversationDrawer';
import { StartReviewDrawer } from '@/components/performance/StartReviewDrawer';
import { usePerformanceData } from '@/hooks/usePerformanceData';
import { mockStaff } from '@/data/mockStaffData';
import { mockAssignedPlans } from '@/data/mockPerformancePlanTemplates';
import { Goal, PerformanceReview, Conversation, Feedback, ReviewRating } from '@/types/performance';
import { PerformancePlanTemplate, AssignedPlan, PlanStatus } from '@/types/performancePlan';
import { Target, ClipboardCheck, MessageSquareHeart, MessageSquare, BarChart3, Users, FileText, ListTodo, GraduationCap } from 'lucide-react';
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
  const [showCreateGoalDrawer, setShowCreateGoalDrawer] = useState(false);
  const [showScheduleConversationModal, setShowScheduleConversationModal] = useState(false);
  const [showStartReviewDrawer, setShowStartReviewDrawer] = useState(false);
  
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
    if (goal) handleViewGoal(goal);
  };

  const handleNotificationReview = (reviewId: string) => {
    const review = reviews.find(r => r.id === reviewId);
    if (review) handleViewReview(review);
  };

  const handleNotificationConversation = (conversationId: string) => {
    const conv = conversations.find(c => c.id === conversationId);
    if (conv) handleViewConversation(conv);
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
    console.log('Saving template:', template);
    const isEditing = editingTemplate !== null;
    setShowCreateTemplateDrawer(false);
    setEditingTemplate(null);
    toast.success(isEditing ? 'Template updated successfully!' : 'Template created successfully!');
  };

  const handleDeleteTemplate = (templateId: string) => {
    console.log('Deleting template:', templateId);
    toast.success('Template deleted successfully');
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
    console.log('Bulk assigning plans:', assignments);
    toast.success(`Plans assigned to ${assignments.length} team members!`);
    setShowBulkAssignDrawer(false);
    setSelectedTemplate(null);
  };

  const handleUpdatePlanStatus = async (planId: string, status: PlanStatus) => {
    console.log('Updating plan status:', planId, status);
    toast.success(`Plan status updated to ${status}`);
  };

  const handleDeletePlan = async (planId: string) => {
    console.log('Deleting plan:', planId);
    toast.success('Plan deleted successfully');
    setShowPlanDetail(false);
    setSelectedPlan(null);
  };

  const handleExtendPlan = async (planId: string, newEndDate: string) => {
    console.log('Extending plan:', planId, 'to', newEndDate);
    toast.success('Plan extended successfully');
  };

  const tabConfig = [
    { value: 'plans', label: 'Plans', icon: FileText },
    { value: 'lms', label: 'Learning', icon: GraduationCap },
    { value: 'tasks', label: 'Tasks', icon: ListTodo },
    { value: 'goals', label: 'Goals', icon: Target },
    { value: 'reviews', label: 'Reviews', icon: ClipboardCheck },
    { value: 'feedback', label: 'Feedback', icon: MessageSquareHeart },
    { value: 'conversations', label: '1:1s', icon: MessageSquare },
    { value: 'team', label: 'Team', icon: Users },
    { value: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AdminSidebar />
      <Box component="main" sx={{ flex: 1, p: 4, overflow: 'auto' }}>
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
          {/* Header */}
          <Stack 
            direction="row" 
            justifyContent="space-between" 
            alignItems="flex-start"
            sx={{ mb: 4 }}
          >
            <Box>
              <Typography variant="h4" fontWeight={600} color="text.primary" gutterBottom>
                Performance Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Track development plans, reviews, goals, and continuous feedback
              </Typography>
            </Box>
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
          </Stack>

          {/* Tab Navigation */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(_, value) => setActiveTab(value)}
              variant="scrollable"
              scrollButtons="auto"
            >
              {tabConfig.map(tab => (
                <Tab
                  key={tab.value}
                  value={tab.value}
                  label={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <tab.icon size={16} />
                      <span>{tab.label}</span>
                    </Stack>
                  }
                />
              ))}
            </Tabs>
          </Box>

          {/* Tab Content */}
          <Box>
            {activeTab === 'plans' && (
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
                onDeleteTemplate={handleDeleteTemplate}
              />
            )}

            {activeTab === 'lms' && (
              <LMSAdminModule
                currentUserId={CURRENT_USER_ID}
                staff={mockStaff}
              />
            )}

            {activeTab === 'tasks' && (
              <PerformanceTaskManagementPanel
                currentUserId={CURRENT_USER_ID}
                goals={goals}
                reviews={reviews}
                conversations={conversations}
                onNavigateToGoal={handleNotificationGoal}
                onNavigateToReview={handleNotificationReview}
                onNavigateToConversation={handleNotificationConversation}
              />
            )}

            {activeTab === 'goals' && (
              <GoalsTracker
                goals={goals}
                onCreateGoal={() => setShowCreateGoalDrawer(true)}
                onViewGoal={handleViewGoal}
                onUpdateProgress={updateGoalProgress}
              />
            )}

            {activeTab === 'reviews' && (
              <ReviewsDashboard
                reviews={reviews}
                staff={mockStaff}
                currentUserId={CURRENT_USER_ID}
                onCreateReview={() => setShowStartReviewDrawer(true)}
                onViewReview={handleViewReview}
              />
            )}

            {activeTab === 'feedback' && (
              <FeedbackPanel
                feedback={feedback}
                staff={mockStaff}
                currentUserId={CURRENT_USER_ID}
                onSendFeedback={handleSendFeedback}
                view={feedbackView}
                onViewChange={setFeedbackView}
              />
            )}

            {activeTab === 'conversations' && (
              <ConversationsList
                conversations={conversations}
                staff={mockStaff}
                currentUserId={CURRENT_USER_ID}
                onScheduleConversation={() => setShowScheduleConversationModal(true)}
                onViewConversation={handleViewConversation}
              />
            )}

            {activeTab === 'team' && (
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
            )}

            {activeTab === 'analytics' && (
              <PerformanceAnalyticsDashboard
                goals={goals}
                reviews={reviews}
                feedback={feedback}
                conversations={conversations}
              />
            )}
          </Box>
        </Box>
      </Box>

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
        onDeletePlan={handleDeletePlan}
        onExtendPlan={handleExtendPlan}
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

      {/* Create Goal Drawer */}
      <CreateGoalDrawer
        open={showCreateGoalDrawer}
        onOpenChange={setShowCreateGoalDrawer}
        staffId={CURRENT_USER_ID}
        createdBy={CURRENT_USER_ID}
        onSubmit={async (data) => {
          await createGoal(data);
        }}
      />

      {/* Schedule Conversation Drawer */}
      <ScheduleConversationDrawer
        open={showScheduleConversationModal}
        onOpenChange={setShowScheduleConversationModal}
        staff={mockStaff}
        managerId={CURRENT_USER_ID}
        onSubmit={async (data) => {
          await createConversation(data);
        }}
      />

      {/* Start Review Drawer */}
      <StartReviewDrawer
        open={showStartReviewDrawer}
        onOpenChange={setShowStartReviewDrawer}
        staff={mockStaff}
        reviewerId={CURRENT_USER_ID}
        onSubmit={async (data) => {
          await createReview(data);
        }}
      />
    </Box>
  );
}
