import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Stack, Typography, CircularProgress } from '@mui/material';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
import { PerformanceNavigation, GlobalSearch } from '@/components/performance/shared';
import { PerformanceNotificationBell } from '@/components/performance/PerformanceNotificationBell';
import { PerformanceSettingsDrawer, PerformanceSettings } from '@/components/performance/PerformanceSettingsDrawer';
import { usePerformanceData } from '@/hooks/usePerformanceData';
import { mockStaff } from '@/data/mockStaffData';
import { mockAssignedPlans } from '@/data/mockPerformancePlanTemplates';
import { Goal, PerformanceReview, Conversation, Feedback, ReviewRating } from '@/types/performance';
import { PerformancePlanTemplate, AssignedPlan, PlanStatus } from '@/types/performancePlan';
import { StaffMember } from '@/types/staff';
import { Settings, Database } from 'lucide-react';
import { Button } from '@/components/mui/Button';
import { toast } from 'sonner';

// Lazy load tab panels for code splitting
const PlanManagementPanel = lazy(() => import('@/components/performance/PlanManagementPanel').then(m => ({ default: m.PlanManagementPanel })));
const GoalsTracker = lazy(() => import('@/components/performance/GoalsTracker').then(m => ({ default: m.GoalsTracker })));
const OKRCascadePanel = lazy(() => import('@/components/performance/OKRCascadePanel').then(m => ({ default: m.OKRCascadePanel })));
const LMSAdminModule = lazy(() => import('@/components/performance/LMSAdminModule').then(m => ({ default: m.LMSAdminModule })));
const ReviewsDashboard = lazy(() => import('@/components/performance/ReviewsDashboard').then(m => ({ default: m.ReviewsDashboard })));
const FeedbackPanel = lazy(() => import('@/components/performance/FeedbackPanel').then(m => ({ default: m.FeedbackPanel })));
const Feedback360Panel = lazy(() => import('@/components/performance/Feedback360Panel').then(m => ({ default: m.Feedback360Panel })));
const CalibrationPanel = lazy(() => import('@/components/performance/CalibrationPanel').then(m => ({ default: m.CalibrationPanel })));
const UnifiedRecognitionPanel = lazy(() => import('@/components/performance/UnifiedRecognitionPanel').then(m => ({ default: m.UnifiedRecognitionPanel })));
const HappinessScoreWidget = lazy(() => import('@/components/performance/HappinessScoreWidget').then(m => ({ default: m.HappinessScoreWidget })));
const PulseSurveyPanel = lazy(() => import('@/components/performance/PulseSurveyPanel').then(m => ({ default: m.PulseSurveyPanel })));
const WellbeingDashboard = lazy(() => import('@/components/performance/WellbeingDashboard').then(m => ({ default: m.WellbeingDashboard })));
const NineBoxTalentGrid = lazy(() => import('@/components/performance/NineBoxTalentGrid').then(m => ({ default: m.NineBoxTalentGrid })));
const SkillsCareerPanel = lazy(() => import('@/components/performance/SkillsCareerPanel').then(m => ({ default: m.SkillsCareerPanel })));
const TeamOverviewDashboard = lazy(() => import('@/components/performance/TeamOverviewDashboard').then(m => ({ default: m.TeamOverviewDashboard })));
const PerformanceTaskManagementPanel = lazy(() => import('@/components/performance/PerformanceTaskManagementPanel').then(m => ({ default: m.PerformanceTaskManagementPanel })));
const ConversationsList = lazy(() => import('@/components/performance/ConversationsList').then(m => ({ default: m.ConversationsList })));
const PerformanceExecutiveDashboard = lazy(() => import('@/components/performance/PerformanceExecutiveDashboard').then(m => ({ default: m.PerformanceExecutiveDashboard })));
const PerformanceAnalyticsDashboard = lazy(() => import('@/components/performance/PerformanceAnalyticsDashboard').then(m => ({ default: m.PerformanceAnalyticsDashboard })));
const CompensationPanel = lazy(() => import('@/components/performance/CompensationPanel').then(m => ({ default: m.CompensationPanel })));
const PIPManagementPanel = lazy(() => import('@/components/performance/PIPManagementPanel').then(m => ({ default: m.PIPManagementPanel })));
const SuccessionPlanningPanel = lazy(() => import('@/components/performance/SuccessionPlanningPanel').then(m => ({ default: m.SuccessionPlanningPanel })));
const PeerNominationsPanel = lazy(() => import('@/components/performance/engagement/PeerNominationsPanel').then(m => ({ default: m.PeerNominationsPanel })));
const MentorshipMatchingPanel = lazy(() => import('@/components/performance/engagement/MentorshipMatchingPanel').then(m => ({ default: m.MentorshipMatchingPanel })));
const DevelopmentBudgetTracker = lazy(() => import('@/components/performance/engagement/DevelopmentBudgetTracker').then(m => ({ default: m.DevelopmentBudgetTracker })));
const CalendarIntegrationPanel = lazy(() => import('@/components/performance/engagement/CalendarIntegrationPanel').then(m => ({ default: m.CalendarIntegrationPanel })));
const GoalRecommendationsPanel = lazy(() => import('@/components/performance/goals/GoalRecommendationsPanel').then(m => ({ default: m.GoalRecommendationsPanel })));
const CareerPathingVisualization = lazy(() => import('@/components/performance/talent/CareerPathingVisualization').then(m => ({ default: m.CareerPathingVisualization })));
const SentimentAnalysisPanel = lazy(() => import('@/components/performance/insights/SentimentAnalysisPanel').then(m => ({ default: m.SentimentAnalysisPanel })));
const BenchmarkingDashboard = lazy(() => import('@/components/performance/insights/BenchmarkingDashboard').then(m => ({ default: m.BenchmarkingDashboard })));

// Eagerly load sheets/drawers as they're used across tabs
import { GoalDetailSheet } from '@/components/performance/GoalDetailSheet';
import { ReviewExecutionSheet } from '@/components/performance/ReviewExecutionSheet';
import { ConversationDetailSheet } from '@/components/performance/ConversationDetailSheet';
import { PlanDetailSheet } from '@/components/performance/PlanDetailSheet';
import { PlanTemplatePreviewSheet } from '@/components/performance/PlanTemplatePreviewSheet';
import { AssignPlanDrawer } from '@/components/performance/AssignPlanDrawer';
import { BulkAssignPlanDrawer } from '@/components/performance/BulkAssignPlanDrawer';
import { CreateTemplateDrawer } from '@/components/performance/CreateTemplateDrawer';
import { QuickAssignPlanDrawer } from '@/components/performance/QuickAssignPlanDrawer';
import { CreateGoalDrawer } from '@/components/performance/CreateGoalDrawer';
import { AssignGoalDrawer } from '@/components/performance/AssignGoalDrawer';
import { EditGoalDrawer } from '@/components/performance/EditGoalDrawer';
import { ScheduleConversationDrawer } from '@/components/performance/ScheduleConversationDrawer';
import { StartReviewDrawer } from '@/components/performance/StartReviewDrawer';
import { EditReviewDrawer } from '@/components/performance/reviews/EditReviewDrawer';
import { EditPlanDrawer } from '@/components/performance/plans/EditPlanDrawer';

const CURRENT_USER_ID = 'staff-2'; // Sarah Williams - Lead Educator

// Valid tab values for URL routing
const VALID_TABS = [
  'plans', 'goals', 'goal-recommendations', 'okr', 'lms', 'pip',
  'reviews', 'feedback', '360feedback', 'calibration',
  'recognition', 'happiness', 'pulse', 'wellbeing', 'nominations', 'mentorship', 'budget',
  'talent', 'skills', 'career-pathing', 'succession', 'team',
  'tasks', 'conversations', 'calendar',
  'summary', 'analytics', 'sentiment', 'benchmarking', 'compensation'
];

// Loading fallback component
function TabLoadingFallback() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
      <CircularProgress size={32} />
    </Box>
  );
}

export default function PerformanceManagement() {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  
  // Derive activeTab from URL, default to 'plans'
  const activeTab = useMemo(() => {
    if (tab && VALID_TABS.includes(tab)) return tab;
    return 'plans';
  }, [tab]);

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
  const [showEditPlanDrawer, setShowEditPlanDrawer] = useState(false);
  const [showCreateGoalDrawer, setShowCreateGoalDrawer] = useState(false);
  const [showAssignGoalDrawer, setShowAssignGoalDrawer] = useState(false);
  const [showEditGoalDrawer, setShowEditGoalDrawer] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showScheduleConversationModal, setShowScheduleConversationModal] = useState(false);
  const [showStartReviewDrawer, setShowStartReviewDrawer] = useState(false);
  const [showEditReviewDrawer, setShowEditReviewDrawer] = useState(false);
  const [editingReview, setEditingReview] = useState<PerformanceReview | null>(null);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
const [performanceSettings, setPerformanceSettings] = useState<PerformanceSettings>({
    recognition: {
      visibleInEmployeePortal: true,
      hideIndependentPraise: false,
      employeesCanAwardPoints: true,
      maxPointsPerPraise: 50,
      requireApprovalForRewards: false,
    },
    surveys: { anonymousByDefault: true },
    goals: { allowSelfCreation: true },
  });

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

  // URL-based tab change handler
  const handleTabChange = (newTab: string) => {
    navigate(`/performance/${newTab}`, { replace: true });
  };

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

  const handleEditReview = (review: PerformanceReview) => {
    setEditingReview(review);
    setShowEditReviewDrawer(true);
  };

  const handleDeleteReview = (reviewId: string) => {
    toast.success('Review deleted');
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
    staffIds: string[];
    startDate: Date;
    notes?: string;
    selectedGoals: string[];
    selectedReviews: string[];
    selectedConversations: string[];
  }) => {
    console.log('Assigning plan:', data);
    toast.success(`Performance plan assigned to ${data.staffIds.length} employee${data.staffIds.length > 1 ? 's' : ''}!`);
    setShowAssignDrawer(false);
    setShowQuickAssignDrawer(false);
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

  // Render the active tab content with Suspense
  const renderTabContent = () => {
    return (
      <Suspense fallback={<TabLoadingFallback />}>
        {activeTab === 'plans' && (
          <PlanManagementPanel
            staff={mockStaff}
            goals={goals}
            reviews={reviews}
            conversations={conversations}
            onAssignPlan={handleAssignPlan}
            onBulkAssignPlan={handleBulkAssignPlan}
            onViewPlan={handleViewPlan}
            onEditPlan={(plan) => {
              setSelectedPlan(plan);
              setShowEditPlanDrawer(true);
            }}
            onViewTemplate={handleViewTemplate}
            onCreateTemplate={handleCreateTemplate}
            onEditTemplate={handleEditTemplate}
            onDuplicateTemplate={handleDuplicateTemplate}
            onQuickAssignPlan={() => setShowQuickAssignDrawer(true)}
            onDeleteTemplate={handleDeleteTemplate}
            onDeletePlan={(planId) => {
              toast.success('Plan deleted successfully');
            }}
          />
        )}

        {activeTab === 'okr' && (
          <OKRCascadePanel currentUserId={CURRENT_USER_ID} />
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
            onEditReview={handleEditReview}
            onDeleteReview={handleDeleteReview}
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

        {activeTab === 'compensation' && (
          <CompensationPanel
            staff={mockStaff}
            currentUserId={CURRENT_USER_ID}
          />
        )}

        {activeTab === 'pip' && (
          <PIPManagementPanel
            staff={mockStaff}
            currentUserId={CURRENT_USER_ID}
          />
        )}

        {activeTab === 'succession' && (
          <SuccessionPlanningPanel
            staff={mockStaff}
            currentUserId={CURRENT_USER_ID}
          />
        )}

        {activeTab === 'nominations' && (
          <PeerNominationsPanel
            staff={mockStaff}
            currentUserId={CURRENT_USER_ID}
          />
        )}

        {activeTab === 'mentorship' && (
          <MentorshipMatchingPanel
            staff={mockStaff}
            currentUserId={CURRENT_USER_ID}
          />
        )}

        {activeTab === 'budget' && (
          <DevelopmentBudgetTracker
            staff={mockStaff}
            currentUserId={CURRENT_USER_ID}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarIntegrationPanel />
        )}

        {activeTab === 'goal-recommendations' && (
          <GoalRecommendationsPanel
            staff={mockStaff}
            currentStaffId={CURRENT_USER_ID}
            existingGoals={goals}
            onAdoptGoal={(rec) => {
              createGoal({
                staffId: CURRENT_USER_ID,
                title: rec.title,
                description: rec.description,
                category: rec.category,
                priority: rec.priority,
                status: 'not_started',
                progress: 0,
                startDate: new Date().toISOString().split('T')[0],
                targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                milestones: rec.suggestedMilestones.map((ms, i) => ({
                  id: `ms-${Date.now()}-${i}`,
                  title: ms,
                  targetDate: new Date(Date.now() + (30 * (i + 1)) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  completed: false,
                })),
                createdBy: CURRENT_USER_ID,
              });
            }}
          />
        )}

        {activeTab === 'career-pathing' && (
          <CareerPathingVisualization staffId={CURRENT_USER_ID} />
        )}

        {activeTab === 'sentiment' && (
          <SentimentAnalysisPanel
            feedback={feedback}
            staff={mockStaff}
            currentUserId={CURRENT_USER_ID}
          />
        )}

        {activeTab === 'benchmarking' && (
          <BenchmarkingDashboard
            goals={goals}
            reviews={reviews}
            feedback={feedback}
          />
        )}
      </Suspense>
    );
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AdminSidebar />
      <Box 
        component="main" 
        sx={{ 
          flex: 1, 
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
        }}
      >
        {/* Clean Header - Matching Reference Style */}
        <Box 
          sx={{ 
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 2, sm: 2.5 },
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Stack 
            direction="row"
            justifyContent="space-between" 
            alignItems="center"
          >
            <Box>
              <Typography 
                sx={{ 
                  fontSize: '1.375rem',
                  fontWeight: 600,
                  color: 'text.primary',
                  lineHeight: 1.3,
                }}
              >
                Performance Management
              </Typography>
              <Typography 
                sx={{ 
                  mt: 0.25,
                  fontSize: '0.8125rem',
                  color: 'text.secondary',
                }}
              >
                Manage goals, reviews, and team development
              </Typography>
            </Box>
            
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box
                component="button"
                onClick={() => navigate('/docs/database')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  color: 'text.secondary',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    borderColor: 'text.disabled',
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Database size={16} />
              </Box>
              <Box
                component="button"
                onClick={() => setShowSettingsDrawer(true)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  color: 'text.secondary',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    borderColor: 'text.disabled',
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Settings size={16} />
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
          </Stack>
        </Box>

        {/* Main Content Area */}
        <Box sx={{ flex: 1, px: { xs: 2, sm: 3, md: 4 }, py: 3 }}>
          {/* Tab Navigation - Matching Reference Style */}
          <PerformanceNavigation 
            activeTab={activeTab} 
            onTabChange={handleTabChange} 
          />

          {/* Search/Filter Toolbar */}
          <Box sx={{ mb: 3 }}>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', sm: 'center' }}
              spacing={2}
            >
              <Stack direction="row" spacing={1.5} sx={{ flex: 1 }}>
                <GlobalSearch
                  goals={goals}
                  reviews={reviews}
                  conversations={conversations}
                  staff={mockStaff}
                  onSelectGoal={handleViewGoal}
                  onSelectReview={handleViewReview}
                  onSelectConversation={handleViewConversation}
                  onSelectStaff={(staff: StaffMember) => {
                    handleTabChange('team');
                    toast.info(`Viewing ${staff.firstName} ${staff.lastName}'s profile`);
                  }}
                  onNavigateToTab={handleTabChange}
                />
              </Stack>
            </Stack>
          </Box>

          {/* Content Area - Clean White Card */}
          <Box
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              {renderTabContent()}
            </Box>
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

      {/* Edit Plan Drawer */}
      <EditPlanDrawer
        open={showEditPlanDrawer}
        plan={selectedPlan}
        staff={mockStaff}
        onClose={() => {
          setShowEditPlanDrawer(false);
          setSelectedPlan(null);
        }}
        onSave={async (planId, updates) => {
          toast.success('Plan updated successfully');
          setShowEditPlanDrawer(false);
          setSelectedPlan(null);
        }}
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

      {/* Edit Review Drawer */}
      <EditReviewDrawer
        open={showEditReviewDrawer}
        onClose={() => {
          setShowEditReviewDrawer(false);
          setEditingReview(null);
        }}
        review={editingReview}
        staff={mockStaff}
        onSave={(reviewId, updates) => {
          // In a real app, this would update the review
          toast.success('Review updated successfully');
          setShowEditReviewDrawer(false);
          setEditingReview(null);
        }}
      />

      <PerformanceSettingsDrawer
        open={showSettingsDrawer}
        onOpenChange={setShowSettingsDrawer}
        settings={performanceSettings}
        onSave={setPerformanceSettings}
      />
    </Box>
  );
}
