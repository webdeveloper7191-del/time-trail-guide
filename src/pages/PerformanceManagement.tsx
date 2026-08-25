import React, { useState, useEffect, useMemo } from 'react';
import { Box, Stack, Typography, Tab } from '@mui/material';
import { Tabs } from '@/components/mui/Tabs';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
import { PerformanceNavigation } from '@/components/performance/PerformanceNavigation';
import { ModuleWorkspace } from '@/components/performance/shared/ModuleWorkspace';
import { getWorkspaceMeta, type WorkspaceMeta } from '@/components/performance/workspaceConfig';
import { GoalRecommendationsPanel } from '@/components/performance/goals/GoalRecommendationsPanel';
import { PIPManagementPanel } from '@/components/performance/PIPManagementPanel';

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
import { AssignGoalDrawer } from '@/components/performance/AssignGoalDrawer';
import { EditGoalDrawer } from '@/components/performance/EditGoalDrawer';
import { LMSAdminModule } from '@/components/performance/LMSAdminModule';
import { ScheduleConversationDrawer } from '@/components/performance/ScheduleConversationDrawer';
import { StartReviewDrawer } from '@/components/performance/StartReviewDrawer';
// New advanced performance features
import { Feedback360Panel } from '@/components/performance/Feedback360Panel';
import { NineBoxTalentGrid } from '@/components/performance/NineBoxTalentGrid';
import { SkillsCareerPanel } from '@/components/performance/SkillsCareerPanel';
import { PulseSurveyPanel } from '@/components/performance/PulseSurveyPanel';
import { WellbeingDashboard } from '@/components/performance/WellbeingDashboard';
import { CalibrationPanel } from '@/components/performance/CalibrationPanel';
import { PeerNominationsPanel } from '@/components/performance/engagement/PeerNominationsPanel';
import { MentorshipMatchingPanel } from '@/components/performance/engagement/MentorshipMatchingPanel';
import { DevelopmentBudgetTracker } from '@/components/performance/engagement/DevelopmentBudgetTracker';
import { CareerPathingVisualization } from '@/components/performance/talent/CareerPathingVisualization';
import { SuccessionPlanningPanel } from '@/components/performance/SuccessionPlanningPanel';
import { CalendarIntegrationPanel } from '@/components/performance/engagement/CalendarIntegrationPanel';
import { SentimentAnalysisPanel } from '@/components/performance/insights/SentimentAnalysisPanel';
import { BenchmarkingDashboard } from '@/components/performance/insights/BenchmarkingDashboard';
import { CompensationPanel } from '@/components/performance/CompensationPanel';
import { PerformanceAdminPanel } from '@/components/performance/admin/PerformanceAdminPanel';
import { OKRCascadePanel } from '@/components/performance/OKRCascadePanel';
// New Employment Hero-style features
import { UnifiedRecognitionPanel } from '@/components/performance/UnifiedRecognitionPanel';
import { HappinessScoreWidget } from '@/components/performance/HappinessScoreWidget';
import { PerformanceExecutiveDashboard } from '@/components/performance/PerformanceExecutiveDashboard';
import { usePerformanceData } from '@/hooks/usePerformanceData';
import { mockStaff } from '@/data/mockStaffData';
import { performancePlanTemplates } from '@/data/mockPerformancePlanTemplates';
import { Goal, PerformanceReview, Conversation, Feedback, ReviewRating } from '@/types/performance';
import { PerformancePlanTemplate, AssignedPlan, PlanStatus } from '@/types/performancePlan';
import { Target, ClipboardCheck, MessageSquareHeart, MessageSquare, BarChart3, Users, FileText, ListTodo, GraduationCap, Users2, Grid3X3, Compass, HeartPulse, Scale, Activity, Crosshair, Sparkles, Smile, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { usePlanManagement } from '@/hooks/usePlanManagement';

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
  const [showAssignGoalDrawer, setShowAssignGoalDrawer] = useState(false);
  const [showEditGoalDrawer, setShowEditGoalDrawer] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
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
  const {
    assignedPlans,
    customTemplates,
    createPlan,
    updatePlanStatus,
    deletePlan,
    extendPlan,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  } = usePlanManagement();

  const workspaceMeta: WorkspaceMeta = useMemo(
    () =>
      getWorkspaceMeta(activeTab, {
        goals,
        reviews,
        feedback,
        conversations,
        staff: mockStaff,
        goTo: setActiveTab,
      }) ?? {
        icon: Target,
        title: 'Performance',
        description: 'Manage performance activity for your team.',
      },
    [activeTab, goals, reviews, feedback, conversations],
  );



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

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setShowEditGoalDrawer(true);
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
    const isEditing = editingTemplate !== null;
    if (editingTemplate && !editingTemplate.isSystem && customTemplates.some(item => item.id === editingTemplate.id)) {
      await updateTemplate(editingTemplate.id, template);
    } else {
      await createTemplate({ ...template, isSystem: false });
    }
    setShowCreateTemplateDrawer(false);
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (templateId: string) => {
    void deleteTemplate(templateId);
  };

  const handleAssignPlanSubmit = async (data: {
    templateId: string;
    staffIds: string[];
    startDate: Date;
    notes?: string;
    selectedGoals: string[];
    selectedReviews: string[];
    selectedConversations: string[];
  }) => {
    const template = [...performancePlanTemplates, ...customTemplates].find(item => item.id === data.templateId);
    if (!template) {
      toast.error('Plan template could not be found');
      return;
    }
    await Promise.all(data.staffIds.map(staffId => createPlan({
      templateId: template.id,
      templateName: template.name,
      staffId,
      assignedBy: CURRENT_USER_ID,
      type: template.type,
      status: 'active',
      startDate: data.startDate.toISOString(),
      endDate: new Date(data.startDate.getTime() + template.durationDays * 86400000).toISOString(),
      notes: data.notes,
      goalIds: data.selectedGoals,
      reviewIds: data.selectedReviews,
      conversationIds: data.selectedConversations,
      learningPathIds: template.learningPathIds ?? [],
      courseIds: template.courseIds ?? [],
    })));
    setShowAssignDrawer(false);
    setSelectedTemplate(null);
  };

  const handleBulkAssignPlanSubmit = async (
    assignments: { staffId: string; startDate: Date; notes?: string }[],
    selectedGoals: string[],
    selectedReviews: string[],
    selectedConversations: string[]
  ) => {
    const template = selectedTemplate;
    if (!template) return;
    await Promise.all(assignments.map(assignment => createPlan({
      templateId: template.id,
      templateName: template.name,
      staffId: assignment.staffId,
      assignedBy: CURRENT_USER_ID,
      type: template.type,
      status: 'active',
      startDate: assignment.startDate.toISOString(),
      endDate: new Date(assignment.startDate.getTime() + template.durationDays * 86400000).toISOString(),
      notes: assignment.notes,
      goalIds: selectedGoals,
      reviewIds: selectedReviews,
      conversationIds: selectedConversations,
      learningPathIds: template.learningPathIds ?? [],
      courseIds: template.courseIds ?? [],
    })));
    setShowBulkAssignDrawer(false);
    setSelectedTemplate(null);
  };

  const handleUpdatePlanStatus = async (planId: string, status: PlanStatus) => {
    await updatePlanStatus(planId, status);
    setSelectedPlan(prev => prev?.id === planId ? { ...prev, status } : prev);
  };

  const handleDeletePlan = async (planId: string) => {
    await deletePlan(planId);
    setShowPlanDetail(false);
    setSelectedPlan(null);
  };

  const handleExtendPlan = async (planId: string, newEndDate: string) => {
    await extendPlan(planId, newEndDate);
    setSelectedPlan(prev => prev?.id === planId ? { ...prev, endDate: newEndDate } : prev);
  };

  const tabConfig = [
    { value: 'plans', label: 'Plans', icon: FileText },
    { value: 'okr', label: 'OKRs', icon: Crosshair },
    { value: 'lms', label: 'Learning', icon: GraduationCap },
    { value: 'tasks', label: 'Tasks', icon: ListTodo },
    { value: 'goals', label: 'Goals', icon: Target },
    { value: 'reviews', label: 'Reviews', icon: ClipboardCheck },
    { value: 'feedback', label: 'Feedback', icon: MessageSquareHeart },
    { value: '360feedback', label: '360°', icon: Users2 },
    { value: 'recognition', label: 'Recognition', icon: Sparkles },
    { value: 'happiness', label: 'Happiness', icon: Smile },
    { value: 'conversations', label: '1:1s', icon: MessageSquare },
    { value: 'talent', label: '9-Box', icon: Grid3X3 },
    { value: 'skills', label: 'Skills', icon: Compass },
    { value: 'pulse', label: 'Pulse', icon: Activity },
    { value: 'wellbeing', label: 'Wellbeing', icon: HeartPulse },
    { value: 'calibration', label: 'Calibration', icon: Scale },
    { value: 'team', label: 'Team', icon: Users },
    { value: 'summary', label: 'Summary', icon: TrendingUp },
    { value: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AdminSidebar />
      <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4 }, overflow: 'auto' }}>
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
          {/* Header */}
          <Stack 
            direction="row"
            justifyContent="space-between" 
            alignItems="center"
            spacing={2}
            sx={{ mb: { xs: 2, md: 3 } }}
          >
            <Box>
              <Typography 
                variant="h5" 
                fontWeight={600} 
                color="text.primary" 
                sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, letterSpacing: '-0.025em' }}
              >
                Performance Management
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ display: { xs: 'none', sm: 'block' }, mt: 0.25 }}
              >
                Track development plans, reviews, goals, and continuous feedback
              </Typography>
            </Box>

            <PerformanceNotificationBell
              goals={goals}
              reviews={reviews}
              conversations={conversations}
              plans={assignedPlans}
              currentUserId={CURRENT_USER_ID}
              onViewGoal={handleNotificationGoal}
              onViewReview={handleNotificationReview}
              onViewConversation={handleNotificationConversation}
              onViewPlan={(planId) => {
                const plan = assignedPlans.find(p => p.id === planId);
                if (plan) handleViewPlan(plan);
              }}
            />
          </Stack>

          {/* Grouped Tab Navigation */}
          <PerformanceNavigation activeTab={activeTab} onTabChange={setActiveTab} />


          {/* Tab Content */}
          {activeTab === 'lms' && (
            <LMSAdminModule currentUserId={CURRENT_USER_ID} staff={mockStaff} />
          )}

          {activeTab !== 'lms' && (
          <ModuleWorkspace
            key={activeTab}
            storageKey={activeTab}
            icon={workspaceMeta.icon}
            title={workspaceMeta.title}
            description={workspaceMeta.description}
            kpis={workspaceMeta.kpis}
            steps={workspaceMeta.steps}
            guideTitle={workspaceMeta.guideTitle}
          >
            {activeTab === 'plans' && (
              <PlanManagementPanel
                embedded
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
                assignedPlans={assignedPlans}
                customTemplates={customTemplates}
              />
            )}

            {activeTab === 'goal-recommendations' && (
              <GoalRecommendationsPanel
                embedded
                staff={mockStaff}
                currentStaffId={CURRENT_USER_ID}
                existingGoals={goals}
                onAdoptGoal={(rec) => {
                  const durationMatch = rec.suggestedDuration.match(/(\d+)\s*(month|week|day)/i);
                  const amount = Number(durationMatch?.[1] ?? 3);
                  const unit = durationMatch?.[2]?.toLowerCase() ?? 'month';
                  const durationDays = unit.startsWith('week') ? amount * 7 : unit.startsWith('day') ? amount : amount * 30;
                  const startDate = new Date();
                  const targetDate = new Date(startDate.getTime() + durationDays * 86400000);
                  void createGoal({
                    staffId: CURRENT_USER_ID,
                    title: rec.title,
                    description: rec.description,
                    category: rec.category,
                    priority: rec.priority,
                    status: 'not_started',
                    progress: 0,
                    startDate: startDate.toISOString(),
                    targetDate: targetDate.toISOString(),
                    milestones: rec.suggestedMilestones.map((title, index) => ({
                      id: `milestone-${Date.now()}-${index}`,
                      title,
                      targetDate: new Date(startDate.getTime() + Math.round(durationDays * ((index + 1) / rec.suggestedMilestones.length)) * 86400000).toISOString(),
                      completed: false,
                    })),
                    createdBy: CURRENT_USER_ID,
                  }).then(goal => {
                    if (goal) setActiveTab('goals');
                  });
                }}
              />
            )}

            {activeTab === 'pip' && (
              <PIPManagementPanel embedded staff={mockStaff} currentUserId={CURRENT_USER_ID} />
            )}

            {activeTab === 'okr' && (
              <OKRCascadePanel embedded currentUserId={CURRENT_USER_ID} />
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
                embedded
                goals={goals}
                onCreateGoal={() => setShowCreateGoalDrawer(true)}
                onAssignGoal={() => setShowAssignGoalDrawer(true)}
                onViewGoal={handleViewGoal}
                onEditGoal={handleEditGoal}
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

            {activeTab === '360feedback' && (
              <Feedback360Panel currentUserId={CURRENT_USER_ID} />
            )}

            {activeTab === 'recognition' && (
              <UnifiedRecognitionPanel
                staff={mockStaff}
                currentUserId={CURRENT_USER_ID}
              />
            )}

            {activeTab === 'happiness' && (
              <HappinessScoreWidget
                currentUserId={CURRENT_USER_ID}
                isManager={true}
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

            {activeTab === 'talent' && (
              <NineBoxTalentGrid />
            )}

            {activeTab === 'skills' && (
              <SkillsCareerPanel staffId="staff-1" />
            )}

            {activeTab === 'pulse' && (
              <PulseSurveyPanel currentUserId={CURRENT_USER_ID} />
            )}

            {activeTab === 'wellbeing' && (
              <WellbeingDashboard currentUserId={CURRENT_USER_ID} />
            )}

            {activeTab === 'calibration' && (
              <CalibrationPanel currentUserId={CURRENT_USER_ID} />
            )}

            {activeTab === 'nominations' && <PeerNominationsPanel embedded staff={mockStaff} currentUserId={CURRENT_USER_ID} />}
            {activeTab === 'mentorship' && <MentorshipMatchingPanel embedded staff={mockStaff} currentUserId={CURRENT_USER_ID} />}
            {activeTab === 'budget' && <DevelopmentBudgetTracker embedded staff={mockStaff} currentUserId={CURRENT_USER_ID} />}
            {activeTab === 'career-pathing' && <CareerPathingVisualization embedded staffId={CURRENT_USER_ID} />}
            {activeTab === 'succession' && <SuccessionPlanningPanel embedded staff={mockStaff} currentUserId={CURRENT_USER_ID} />}
            {activeTab === 'calendar' && <CalendarIntegrationPanel embedded />}
            {activeTab === 'sentiment' && <SentimentAnalysisPanel embedded feedback={feedback} staff={mockStaff} currentUserId={CURRENT_USER_ID} />}
            {activeTab === 'benchmarking' && <BenchmarkingDashboard embedded goals={goals} reviews={reviews} feedback={feedback} />}
            {activeTab === 'compensation' && <CompensationPanel embedded staff={mockStaff} currentUserId={CURRENT_USER_ID} />}
            {activeTab === 'admin-config' && <PerformanceAdminPanel embedded />}

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

            {activeTab === 'summary' && (
              <PerformanceExecutiveDashboard
                goals={goals}
                reviews={reviews}
                conversations={conversations}
                feedback={feedback}
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
          </ModuleWorkspace>
          )}

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

      {/* Assign Goal to Employees Drawer */}
      <AssignGoalDrawer
        open={showAssignGoalDrawer}
        onOpenChange={setShowAssignGoalDrawer}
        staff={mockStaff}
        createdBy={CURRENT_USER_ID}
        onSubmit={async (data) => {
          await createGoal(data);
        }}
      />

      {/* Edit Goal Drawer */}
      <EditGoalDrawer
        open={showEditGoalDrawer}
        onOpenChange={(open) => {
          setShowEditGoalDrawer(open);
          if (!open) setEditingGoal(null);
        }}
        goal={editingGoal}
        onSubmit={async (goalId, data) => {
          await updateGoal(goalId, data);
        }}
        onDelete={handleDeleteGoal}
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
