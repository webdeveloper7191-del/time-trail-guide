import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Database, 
  FileCode, 
  ChevronDown, 
  ChevronRight,
  Copy, 
  Check,
  Layers,
  Users,
  Target,
  MessageSquare,
  GraduationCap,
  TrendingUp,
  Heart,
  DollarSign,
  ClipboardList,
  AlertTriangle,
  Calendar,
  CheckSquare,
  UserPlus,
  Wallet,
  Shield,
  Bell,
  ArrowLeft,
  Clock
} from 'lucide-react';
import { rosterErdSections, rosterSchemaContent, rosterTableCount, rosterSchemaCount } from '@/data/rosterDatabaseSchema';
import { useNavigate } from 'react-router-dom';
import mermaid from 'mermaid';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    // Node colors
    primaryColor: '#e0e7ff',
    primaryTextColor: '#1e1b4b',
    primaryBorderColor: '#6366f1',
    // Secondary elements
    secondaryColor: '#f1f5f9',
    secondaryTextColor: '#1e293b',
    secondaryBorderColor: '#cbd5e1',
    // Tertiary elements
    tertiaryColor: '#fef3c7',
    tertiaryTextColor: '#78350f',
    tertiaryBorderColor: '#f59e0b',
    // Lines and labels
    lineColor: '#64748b',
    textColor: '#1e293b',
    // Background
    background: '#ffffff',
    mainBkg: '#e0e7ff',
    nodeBorder: '#6366f1',
    // Clusters/subgraphs
    clusterBkg: '#f8fafc',
    clusterBorder: '#94a3b8',
    // Title
    titleColor: '#0f172a',
    // Edge labels
    edgeLabelBackground: '#ffffff',
    // Notes
    noteBkgColor: '#fef9c3',
    noteTextColor: '#713f12',
    noteBorderColor: '#facc15',
    // Actor (for sequence diagrams)
    actorTextColor: '#1e293b',
    actorBkg: '#e0e7ff',
    actorBorder: '#6366f1',
    // Signals
    signalColor: '#1e293b',
    signalTextColor: '#1e293b',
    // Labels
    labelColor: '#1e293b',
    labelTextColor: '#1e293b',
    // ER Diagram specific
    attributeBackgroundColorOdd: '#f8fafc',
    attributeBackgroundColorEven: '#f1f5f9',
  },
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis',
    nodeSpacing: 50,
    rankSpacing: 50,
  },
  er: {
    useMaxWidth: true,
    layoutDirection: 'TB',
    entityPadding: 15,
  },
});

interface ERDSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  tableCount: number;
  diagram: string;
}

const erdSections: ERDSection[] = [
  {
    id: 'architecture',
    title: 'Service Architecture',
    icon: <Layers className="h-4 w-4" />,
    description: 'High-level overview of microservice boundaries',
    tableCount: 0,
    diagram: `graph TB
    subgraph "Multi-Tenant SaaS Platform"
        CORE[🔵 Core Service<br/>Tenants, Users, Departments, Teams]
        
        subgraph "Performance Domain"
            GOALS[🟢 Goals Service<br/>OKRs, Key Results, Goals]
            REVIEWS[🟣 Reviews Service<br/>Reviews, Calibration, Criteria]
            FEEDBACK[🟠 Feedback Service<br/>360°, Recognition, Praise]
        end
        
        subgraph "Development Domain"
            LMS[🔴 LMS Service<br/>Courses, Paths, Certifications]
            TALENT[🟡 Talent Service<br/>Skills, Career, 9-Box, Succession]
            MENTORSHIP[🤝 Mentorship Service<br/>Matching, Meetings]
        end
        
        subgraph "Engagement Domain"
            ENGAGE[🩵 Engagement Service<br/>Surveys, eNPS, Wellbeing]
            COMP[💰 Compensation Service<br/>Salary, Merit, Bonus]
        end
        
        subgraph "Operations Domain"
            PLANS[📋 Plans Service<br/>Templates, Assigned Plans]
            PIP[⚠️ PIP Service<br/>Improvement Plans]
            TASKS[✅ Tasks Service<br/>Pipelines, Performance Tasks]
            ACTIVITIES[💬 Activities Service<br/>Conversations, 1:1s]
        end
        
        BUDGET[💵 Budget Service<br/>Development Budget]
        AUDIT[📝 Audit & Notifications]
    end
    
    CORE --> GOALS
    CORE --> REVIEWS
    CORE --> FEEDBACK
    CORE --> LMS
    CORE --> TALENT
    CORE --> ENGAGE
    CORE --> COMP
    CORE --> PLANS
    CORE --> PIP
    CORE --> TASKS
    CORE --> ACTIVITIES
    CORE --> MENTORSHIP
    CORE --> BUDGET`,
  },
  {
    id: 'core',
    title: 'Core Service',
    icon: <Users className="h-4 w-4" />,
    description: 'Tenants, Users, Departments, Teams, Roles',
    tableCount: 7,
    diagram: `erDiagram
    Tenants ||--o{ Users : has
    Tenants ||--o{ Departments : has
    Tenants ||--o{ Locations : has
    Tenants ||--o{ Teams : has
    
    Departments ||--o| Users : "headed by"
    Departments ||--o{ Departments : "parent of"
    
    Users ||--o{ Users : "manages"
    Users ||--o| Departments : "belongs to"
    Users ||--o| Locations : "works at"
    Users ||--o{ UserRoles : has
    Users ||--o{ TeamMembers : "member of"
    
    Teams ||--o{ TeamMembers : has
    Teams ||--o| Users : "led by"
    
    Tenants {
        uuid id PK
        string name
        string subdomain UK
        string plan_type
        string industry
        string currency_code
        boolean is_active
    }
    
    Users {
        uuid id PK
        uuid tenant_id FK
        string email
        string first_name
        string last_name
        uuid department_id FK
        uuid manager_id FK
        string position_title
        boolean is_manager
    }
    
    Departments {
        uuid id PK
        uuid tenant_id FK
        string name
        uuid parent_department_id FK
        uuid head_user_id FK
    }
    
    Teams {
        uuid id PK
        uuid tenant_id FK
        string name
        uuid leader_id FK
    }`,
  },
  {
    id: 'goals',
    title: 'Goals & OKR Service',
    icon: <Target className="h-4 w-4" />,
    description: 'Objectives, Key Results, Goals, Milestones',
    tableCount: 7,
    diagram: `erDiagram
    OKRCycles ||--o{ Objectives : contains
    Objectives ||--o{ KeyResults : has
    Objectives ||--o{ Objectives : "parent of"
    KeyResults ||--o{ KeyResultUpdates : tracks
    
    Goals ||--o{ GoalMilestones : has
    GoalCategories ||--o{ Goals : categorizes
    
    OKRCycles {
        uuid id PK
        uuid tenant_id FK
        string name
        date start_date
        date end_date
        boolean is_active
    }
    
    Objectives {
        uuid id PK
        uuid cycle_id FK
        string title
        string level
        string status
        uuid owner_id FK
        uuid parent_objective_id FK
        decimal progress
    }
    
    KeyResults {
        uuid id PK
        uuid objective_id FK
        string title
        string result_type
        decimal start_value
        decimal target_value
        decimal current_value
        decimal progress
    }
    
    Goals {
        uuid id PK
        uuid staff_id FK
        string title
        string priority
        string status
        decimal progress
        date target_date
    }
    
    GoalMilestones {
        uuid id PK
        uuid goal_id FK
        string title
        date target_date
        boolean completed
    }`,
  },
  {
    id: 'reviews',
    title: 'Reviews Service',
    icon: <ClipboardList className="h-4 w-4" />,
    description: 'Performance Reviews, Calibration, Criteria',
    tableCount: 8,
    diagram: `erDiagram
    ReviewCycles ||--o{ PerformanceReviews : contains
    ReviewCycles ||--o{ CalibrationSessions : has
    
    ReviewCriteriaTemplates ||--o{ ReviewCriteriaItems : contains
    ReviewCriteriaTemplates ||--o| PerformanceReviews : "used by"
    
    PerformanceReviews ||--o{ ReviewRatings : has
    ReviewCriteriaItems ||--o{ ReviewRatings : "rated by"
    
    CalibrationSessions ||--o{ CalibrationParticipants : has
    CalibrationSessions ||--o{ CalibrationRatings : produces
    
    ReviewCycles {
        uuid id PK
        string name
        string cycle_type
        date period_start
        date period_end
        string status
    }
    
    PerformanceReviews {
        uuid id PK
        uuid cycle_id FK
        uuid staff_id FK
        uuid reviewer_id FK
        string status
        decimal overall_self_rating
        decimal overall_manager_rating
    }
    
    ReviewRatings {
        uuid id PK
        uuid review_id FK
        uuid criteria_item_id FK
        decimal self_rating
        decimal manager_rating
    }
    
    CalibrationSessions {
        uuid id PK
        uuid cycle_id FK
        uuid facilitator_id FK
        datetime scheduled_date
        string status
    }`,
  },
  {
    id: 'feedback',
    title: 'Feedback Service',
    icon: <MessageSquare className="h-4 w-4" />,
    description: '360° Feedback, Recognition, Praise Wall',
    tableCount: 14,
    diagram: `erDiagram
    Feedback360Requests ||--o{ Feedback360Responses : has
    Feedback360Responses ||--o{ Feedback360Ratings : contains
    Competencies ||--o{ Feedback360Ratings : "rated on"
    
    PraisePosts ||--o{ PraiseBadges : has
    PraisePosts ||--o{ PraiseLikes : receives
    PraisePosts ||--o{ PraiseComments : has
    CultureValues ||--o| PraiseBadges : "linked to"
    
    RewardsCatalog ||--o{ RewardRedemptions : "redeemed as"
    
    Feedback360Requests {
        uuid id PK
        uuid subject_staff_id FK
        uuid requester_id FK
        string title
        date due_date
        string status
        boolean anonymous_responses
    }
    
    Feedback360Responses {
        uuid id PK
        uuid request_id FK
        uuid responder_id FK
        string source_type
        string status
    }
    
    PraisePosts {
        uuid id PK
        uuid from_staff_id FK
        uuid to_staff_id FK
        string category
        text message
        int points_awarded
    }
    
    RecognitionPointsLedger {
        uuid id PK
        uuid user_id FK
        int points
        string transaction_type
    }`,
  },
  {
    id: 'lms',
    title: 'LMS Service',
    icon: <GraduationCap className="h-4 w-4" />,
    description: 'Courses, Learning Paths, Enrollments, Certificates',
    tableCount: 22,
    diagram: `erDiagram
    CourseCategories ||--o{ Courses : contains
    Courses ||--o{ CourseModules : has
    Courses ||--o{ Enrollments : "enrolled in"
    Courses ||--o{ Certificates : issues
    
    CourseModules ||--o{ ModuleContent : contains
    CourseModules ||--o{ Assessments : has
    
    Assessments ||--o{ AssessmentQuestions : contains
    Assessments ||--o{ AssessmentAttempts : "attempted in"
    
    LearningPaths ||--o{ LearningPathCourses : contains
    LearningPaths ||--o{ LearningPathEnrollments : "enrolled in"
    
    Enrollments ||--o{ ModuleProgress : tracks
    
    Courses {
        uuid id PK
        string title
        uuid category_id FK
        string difficulty
        int duration_minutes
        string status
        boolean certificate_on_completion
    }
    
    CourseModules {
        uuid id PK
        uuid course_id FK
        string title
        int display_order
    }
    
    Enrollments {
        uuid id PK
        uuid staff_id FK
        uuid course_id FK
        string status
        decimal progress
        datetime completed_at
    }
    
    LearningPaths {
        uuid id PK
        string name
        int estimated_duration_minutes
        boolean require_sequential_completion
    }
    
    Certificates {
        uuid id PK
        uuid staff_id FK
        uuid course_id FK
        string certificate_number UK
        datetime expires_at
    }`,
  },
  {
    id: 'talent',
    title: 'Talent Service',
    icon: <TrendingUp className="h-4 w-4" />,
    description: 'Skills, Career Pathing, 9-Box, Succession',
    tableCount: 12,
    diagram: `erDiagram
    Skills ||--o{ StaffSkills : "assessed in"
    Skills ||--o{ CareerLevelSkills : "required for"
    
    StaffSkills ||--o{ SkillCertifications : has
    
    CareerPaths ||--o{ CareerLevels : contains
    CareerLevels ||--o{ CareerLevelSkills : requires
    
    KeyRoles ||--o{ SuccessionCandidates : has
    SuccessionCandidates ||--o{ DevelopmentActions : has
    
    Skills {
        uuid id PK
        string name UK
        string category
        boolean is_core
    }
    
    StaffSkills {
        uuid id PK
        uuid staff_id FK
        uuid skill_id FK
        string current_level
        string target_level
    }
    
    CareerPaths {
        uuid id PK
        string name
        uuid department_id FK
    }
    
    CareerLevels {
        uuid id PK
        uuid career_path_id FK
        string title
        int level_number
        decimal salary_range_min
        decimal salary_range_max
    }
    
    TalentAssessments {
        uuid id PK
        uuid staff_id FK
        string performance_level
        string potential_level
        string flight_risk
        string readiness
    }
    
    KeyRoles {
        uuid id PK
        string title
        string criticality
        string vacancy_risk
    }`,
  },
  {
    id: 'engagement',
    title: 'Engagement Service',
    icon: <Heart className="h-4 w-4" />,
    description: 'Pulse Surveys, eNPS, Wellbeing Indicators',
    tableCount: 9,
    diagram: `erDiagram
    PulseSurveys ||--o{ SurveyQuestions : contains
    PulseSurveys ||--o{ SurveyResponses : receives
    PulseSurveys ||--o| ENPSResults : "aggregated in"
    
    SurveyResponses ||--o{ SurveyAnswers : contains
    SurveyQuestions ||--o{ SurveyAnswers : "answered by"
    
    PulseSurveys {
        uuid id PK
        string title
        string frequency
        string status
        boolean anonymous_responses
    }
    
    SurveyQuestions {
        uuid id PK
        uuid survey_id FK
        text question_text
        string question_type
        string category
    }
    
    ENPSResults {
        uuid id PK
        uuid survey_id FK
        decimal score
        int promoters_count
        int detractors_count
        string trend
    }
    
    WellbeingIndicators {
        uuid id PK
        uuid staff_id FK
        decimal overtime_hours
        decimal workload_score
        string risk_level
    }
    
    WellbeingCheckIns {
        uuid id PK
        uuid staff_id FK
        int energy_level
        int stress_level
        int work_life_balance
    }`,
  },
  {
    id: 'compensation',
    title: 'Compensation Service',
    icon: <DollarSign className="h-4 w-4" />,
    description: 'Salary Bands, Merit Cycles, Bonus Programs',
    tableCount: 8,
    diagram: `erDiagram
    SalaryBands ||--o{ EmployeeCompensation : "applies to"
    
    MeritCycles ||--o{ MeritAllocations : contains
    MeritCycles ||--o{ MeritBudgets : has
    
    BonusPrograms ||--o{ BonusCriteria : defines
    BonusPrograms ||--o{ BonusAllocations : awards
    
    SalaryBands {
        uuid id PK
        string level
        string title
        decimal min_salary
        decimal mid_salary
        decimal max_salary
    }
    
    EmployeeCompensation {
        uuid id PK
        uuid staff_id FK
        uuid salary_band_id FK
        decimal current_salary
        decimal compa_ratio
        decimal bonus_target_percent
    }
    
    MeritCycles {
        uuid id PK
        string name
        int fiscal_year
        decimal total_budget
        string status
    }
    
    MeritAllocations {
        uuid id PK
        uuid staff_id FK
        decimal current_salary
        decimal increase_percent
        decimal new_salary
        string status
    }
    
    BonusPrograms {
        uuid id PK
        string name
        string bonus_type
        decimal budget_amount
    }`,
  },
  {
    id: 'plans',
    title: 'Plans & PIP Service',
    icon: <AlertTriangle className="h-4 w-4" />,
    description: 'Development Plans, Templates, Performance Improvement',
    tableCount: 16,
    diagram: `erDiagram
    PlanTemplates ||--o{ PlanTemplateGoals : defines
    PlanTemplates ||--o{ AssignedPlans : "used in"
    
    PlanTemplateGoals ||--o{ PlanTemplateGoalMilestones : has
    
    AssignedPlans ||--o{ PlanGoals : links
    AssignedPlans ||--o{ PlanReviews : links
    AssignedPlans ||--o{ PlanLearning : links
    
    PerformanceImprovementPlans ||--o{ PIPMilestones : has
    PerformanceImprovementPlans ||--o{ PIPCheckIns : has
    PerformanceImprovementPlans ||--o{ PIPDocuments : has
    
    PlanTemplates {
        uuid id PK
        string name
        string plan_type
        int default_duration_days
    }
    
    AssignedPlans {
        uuid id PK
        uuid template_id FK
        uuid staff_id FK
        string status
        date start_date
        date end_date
        decimal progress
    }
    
    PerformanceImprovementPlans {
        uuid id PK
        uuid staff_id FK
        uuid manager_id FK
        string status
        text reason
        date start_date
        date current_end_date
        string outcome
    }
    
    PIPMilestones {
        uuid id PK
        uuid pip_id FK
        string title
        date target_date
        string status
    }`,
  },
  {
    id: 'activities',
    title: 'Activities & Tasks',
    icon: <CheckSquare className="h-4 w-4" />,
    description: 'Conversations, 1:1s, Performance Tasks, Pipelines',
    tableCount: 10,
    diagram: `erDiagram
    Conversations ||--o{ ConversationNotes : has
    Conversations ||--o{ ConversationActionItems : creates
    
    Pipelines ||--o{ PipelineStages : contains
    Pipelines ||--o| PerformanceTasks : "managed in"
    
    PerformanceTasks ||--o{ TaskComments : has
    PerformanceTasks ||--o{ TaskAttachments : has
    PerformanceTasks ||--o{ TaskActivityLog : logs
    
    Conversations {
        uuid id PK
        uuid staff_id FK
        uuid manager_id FK
        string conversation_type
        datetime scheduled_date
        boolean completed
    }
    
    ConversationActionItems {
        uuid id PK
        uuid conversation_id FK
        string title
        uuid assignee_id FK
        date due_date
        boolean completed
    }
    
    Pipelines {
        uuid id PK
        string name
        boolean is_default
    }
    
    PerformanceTasks {
        uuid id PK
        string title
        string task_type
        string status
        string priority
        uuid assignee_id FK
        date due_date
    }`,
  },
  {
    id: 'mentorship',
    title: 'Mentorship Service',
    icon: <UserPlus className="h-4 w-4" />,
    description: 'Mentor/Mentee Profiles, Matching, Meetings',
    tableCount: 4,
    diagram: `erDiagram
    MentorProfiles ||--o{ MentorshipMatches : "matched in"
    MenteeProfiles ||--o{ MentorshipMatches : "matched in"
    MentorshipMatches ||--o{ MentorshipMeetings : schedules
    
    MentorProfiles {
        uuid id PK
        uuid staff_id FK
        json skills
        json career_goals
        int max_mentees
        int current_mentees
        string availability
    }
    
    MenteeProfiles {
        uuid id PK
        uuid staff_id FK
        json desired_skills
        json development_areas
        string preferred_meeting_frequency
    }
    
    MentorshipMatches {
        uuid id PK
        uuid mentor_id FK
        uuid mentee_id FK
        string status
        int match_score
        json goals
        int meeting_count
    }
    
    MentorshipMeetings {
        uuid id PK
        uuid match_id FK
        date scheduled_date
        int duration_minutes
        json topics
        string status
    }`,
  },
  {
    id: 'budget',
    title: 'Budget & Audit',
    icon: <Wallet className="h-4 w-4" />,
    description: 'Development Budgets, Audit Logs, Notifications',
    tableCount: 5,
    diagram: `erDiagram
    DevelopmentBudgets ||--o{ BudgetRequests : tracks
    
    DevelopmentBudgets {
        uuid id PK
        uuid staff_id FK
        int fiscal_year
        decimal total_budget
        decimal used_budget
        decimal pending_budget
    }
    
    BudgetRequests {
        uuid id PK
        uuid staff_id FK
        string title
        string category
        decimal amount
        string status
        uuid reviewed_by FK
    }
    
    AuditLog {
        uuid id PK
        uuid user_id FK
        string action
        string entity_type
        uuid entity_id
        json old_values
        json new_values
    }
    
    Notifications {
        uuid id PK
        uuid user_id FK
        string notification_type
        string title
        boolean is_read
        boolean is_email_sent
    }
    
    NotificationPreferences {
        uuid id PK
        uuid user_id FK
        string notification_type
        boolean in_app_enabled
        boolean email_enabled
    }`,
  },
];

// Awards Module ERD Sections
const awardsErdSections: ERDSection[] = [
  {
    id: 'awards-overview',
    title: 'Awards Architecture',
    icon: <DollarSign className="h-4 w-4" />,
    description: 'High-level overview of Australian Award compliance system',
    tableCount: 0,
    diagram: `graph TB
    subgraph "Awards Compliance Platform"
        CORE[🔵 Core Awards<br/>Modern Awards, Classifications, Base Rates]
        
        subgraph "Award Configuration Domain"
            AWARDS[📋 Awards Service<br/>Modern Awards, Classifications]
            RATES[💰 Rates Service<br/>Pay Rates, Allowances, Penalties]
            OVERRIDES[⚙️ Overrides Service<br/>Custom Rates, Rule Builder]
        end
        
        subgraph "Enterprise Agreements Domain"
            EBA[📑 EBA Service<br/>Enterprise Agreements, Custom Terms]
            EBARATES[💵 EBA Rates<br/>Classifications, Pay Structures]
            EBACOND[📝 EBA Conditions<br/>Leave, Penalties, Allowances]
        end
        
        subgraph "Compliance Domain"
            AUDIT[🔍 Audit Service<br/>Version History, Change Logs]
            ALERTS[🔔 Alerts Service<br/>Rate Changes, Compliance Issues]
            FWC[⚖️ FWC Updates<br/>Fair Work Commission Rates]
        end
        
        subgraph "Calculation Engine"
            OVERTIME[⏱️ Overtime Calculator<br/>Thresholds, Multipliers]
            PENALTY[📊 Penalty Engine<br/>Weekend, Holiday, Shift Rates]
            ALLOWANCE[💳 Allowance Engine<br/>Stacking, Exclusions]
        end
    end
    
    CORE --> AWARDS
    CORE --> EBA
    AWARDS --> RATES
    AWARDS --> OVERRIDES
    EBA --> EBARATES
    EBA --> EBACOND
    RATES --> AUDIT
    RATES --> ALERTS
    FWC --> RATES
    RATES --> OVERTIME
    RATES --> PENALTY
    RATES --> ALLOWANCE`,
  },
  {
    id: 'modern-awards',
    title: 'Modern Awards',
    icon: <Shield className="h-4 w-4" />,
    description: 'Australian Modern Awards, Classifications, Base Rates',
    tableCount: 8,
    diagram: `erDiagram
    ModernAwards ||--o{ AwardClassifications : contains
    ModernAwards ||--o{ AwardAllowances : defines
    ModernAwards ||--o{ AwardPenaltyRates : defines
    ModernAwards ||--o{ AwardVersions : "has versions"
    ModernAwards ||--o{ TenantAwardConfigs : "enabled for"
    
    AwardClassifications ||--o{ ClassificationPayRates : has
    AwardClassifications ||--o{ RateSchedules : "scheduled rates"
    
    ModernAwards {
        uuid id PK
        string name
        string code UK
        string fwc_code
        string industry
        string coverage_description
        boolean is_active
        string current_version
        datetime created_at
        datetime updated_at
    }
    
    AwardClassifications {
        uuid id PK
        uuid award_id FK
        string code UK
        string name
        string description
        int level
        string stream
        string employment_type
        string required_qualifications
        int min_experience_months
        int display_order
    }
    
    ClassificationPayRates {
        uuid id PK
        uuid classification_id FK
        string rate_type
        decimal hourly_rate
        decimal weekly_rate
        decimal annual_rate
        date effective_from
        date effective_to
        string version
        boolean is_current
    }
    
    RateSchedules {
        uuid id PK
        uuid classification_id FK
        string schedule_name
        decimal hourly_rate
        decimal weekly_rate
        date effective_date
        string notes
    }
    
    TenantAwardConfigs {
        uuid id PK
        uuid tenant_id FK
        uuid award_id FK
        boolean is_enabled
        boolean auto_update
        string current_version
        datetime installed_at
        string installed_by
    }`,
  },
  {
    id: 'allowances-penalties',
    title: 'Allowances & Penalties',
    icon: <DollarSign className="h-4 w-4" />,
    description: 'Award Allowances, Penalty Rates, Shift Differentials',
    tableCount: 7,
    diagram: `erDiagram
    AwardAllowances ||--o{ AllowanceExclusions : "excludes with"
    AwardAllowances ||--o{ TenantAllowanceOverrides : "overridden by"
    
    AwardPenaltyRates ||--o{ TenantPenaltyOverrides : "overridden by"
    
    ShiftDifferentials ||--o{ DifferentialRules : has
    
    AwardAllowances {
        uuid id PK
        uuid award_id FK
        string code UK
        string name
        string description
        string allowance_type
        decimal amount
        string frequency
        string trigger_type
        boolean is_taxable
        boolean is_super_applicable
        boolean is_stackable
        int priority
        string conditions
        string xero_earnings_type_id
    }
    
    AllowanceExclusions {
        uuid id PK
        uuid allowance_id FK
        uuid excludes_allowance_id FK
        string reason
    }
    
    AwardPenaltyRates {
        uuid id PK
        uuid award_id FK
        string penalty_type
        string day_type
        time start_time
        time end_time
        decimal multiplier
        boolean applies_to_casual
        decimal casual_additional_loading
    }
    
    ShiftDifferentials {
        uuid id PK
        uuid award_id FK
        string shift_type
        time start_time
        time end_time
        decimal rate_addition
        decimal rate_multiplier
        boolean is_compound
    }
    
    DifferentialRules {
        uuid id PK
        uuid differential_id FK
        string day_of_week
        boolean applies_public_holiday
        decimal override_multiplier
    }
    
    TenantAllowanceOverrides {
        uuid id PK
        uuid tenant_id FK
        uuid allowance_id FK
        decimal custom_amount
        boolean is_enabled
        string reason
        datetime created_at
        string created_by
    }
    
    TenantPenaltyOverrides {
        uuid id PK
        uuid tenant_id FK
        uuid penalty_id FK
        decimal custom_multiplier
        boolean is_enabled
        string reason
        datetime created_at
        string created_by
    }`,
  },
  {
    id: 'enterprise-agreements',
    title: 'Enterprise Agreements',
    icon: <FileCode className="h-4 w-4" />,
    description: 'EBAs, Custom Classifications, Negotiated Terms',
    tableCount: 10,
    diagram: `erDiagram
    EnterpriseAgreements ||--o{ EBAClassifications : defines
    EnterpriseAgreements ||--o{ EBAPayRates : has
    EnterpriseAgreements ||--o{ EBAAllowances : includes
    EnterpriseAgreements ||--o{ EBALeaveEntitlements : provides
    EnterpriseAgreements ||--o{ EBAConditions : contains
    EnterpriseAgreements ||--o{ EBARedundancyScale : defines
    EnterpriseAgreements ||--o| ModernAwards : "based on"
    
    EBAClassifications ||--o{ EBAPayRates : "has rates"
    
    EnterpriseAgreements {
        uuid id PK
        uuid tenant_id FK
        string name
        string code UK
        string agreement_type
        string status
        string coverage_description
        json applicable_states
        json industry_classifications
        date approval_date
        date commencement_date
        date nominal_expiry_date
        string fwc_reference
        string fwc_approval_number
        uuid underlying_award_id FK
        decimal superannuation_rate
        string version
        uuid previous_version_id FK
        text notes
        datetime created_at
        datetime updated_at
        string created_by
    }
    
    EBAClassifications {
        uuid id PK
        uuid eba_id FK
        string code UK
        string name
        string description
        int level
        json required_qualifications
        int min_experience_months
        string mapped_award_classification
    }
    
    EBAPayRates {
        uuid id PK
        uuid classification_id FK
        string rate_type
        decimal base_rate
        date effective_from
        date effective_to
        decimal annual_increase_percent
        date next_increase_date
        text notes
    }
    
    EBAAllowances {
        uuid id PK
        uuid eba_id FK
        string code UK
        string name
        string description
        decimal amount
        string frequency
        string conditions
        boolean is_taxable
        boolean is_super_applicable
        string xero_earnings_type_id
    }
    
    EBALeaveEntitlements {
        uuid id PK
        uuid eba_id FK
        string leave_type
        decimal entitlement_days
        string accrual_method
        string conditions
        boolean exceeds_nes
        decimal nes_entitlement_days
    }
    
    EBAPenaltyRates {
        uuid id PK
        uuid eba_id FK
        decimal saturday_multiplier
        decimal sunday_multiplier
        decimal public_holiday_multiplier
        time evening_start
        time evening_end
        decimal evening_multiplier
        time night_start
        time night_end
        decimal night_multiplier
        decimal overtime_first_2hrs
        decimal overtime_after_2hrs
        decimal casual_loading
    }
    
    EBAConditions {
        uuid id PK
        uuid eba_id FK
        string category
        string title
        text description
        string clause_reference
    }
    
    EBARedundancyScale {
        uuid id PK
        uuid eba_id FK
        int years_of_service
        int weeks_pay_entitlement
        string conditions
    }`,
  },
  {
    id: 'rate-overrides',
    title: 'Custom Rate Overrides',
    icon: <Target className="h-4 w-4" />,
    description: 'Tenant-specific rate customizations and rule builder',
    tableCount: 6,
    diagram: `erDiagram
    CustomRateOverrides ||--o{ RateOverrideHistory : tracks
    CustomRules ||--o{ RuleConditions : has
    CustomRules ||--o{ RuleActions : performs
    
    OvertimeConfigs ||--o{ OvertimeThresholds : defines
    
    CustomRateOverrides {
        uuid id PK
        uuid tenant_id FK
        uuid classification_id FK
        uuid staff_id FK
        string override_type
        decimal custom_hourly_rate
        decimal custom_weekly_rate
        decimal rate_adjustment_percent
        date effective_from
        date effective_to
        string reason
        string approval_status
        uuid approved_by FK
        datetime approved_at
        datetime created_at
        string created_by
    }
    
    RateOverrideHistory {
        uuid id PK
        uuid override_id FK
        decimal previous_rate
        decimal new_rate
        string change_reason
        datetime changed_at
        string changed_by
    }
    
    CustomRules {
        uuid id PK
        uuid tenant_id FK
        string name
        string description
        string rule_type
        boolean is_active
        int priority
        string logic_operator
        datetime created_at
        string created_by
    }
    
    RuleConditions {
        uuid id PK
        uuid rule_id FK
        string field
        string operator
        string value
        string value_type
        int condition_order
        string group_operator
    }
    
    RuleActions {
        uuid id PK
        uuid rule_id FK
        string action_type
        string target_field
        string action_value
        string value_type
        int action_order
    }
    
    OvertimeConfigs {
        uuid id PK
        uuid tenant_id FK
        uuid award_id FK
        string name
        boolean is_active
        decimal daily_threshold_hours
        decimal weekly_threshold_hours
        decimal standard_multiplier
        decimal double_time_multiplier
        datetime created_at
        string created_by
    }
    
    OvertimeThresholds {
        uuid id PK
        uuid config_id FK
        string threshold_type
        decimal hours_threshold
        decimal multiplier
        int tier_order
    }`,
  },
  {
    id: 'audit-compliance',
    title: 'Audit & Compliance',
    icon: <Shield className="h-4 w-4" />,
    description: 'Version history, rate change alerts, compliance tracking',
    tableCount: 8,
    diagram: `erDiagram
    AwardVersions ||--o{ AwardVersionChanges : contains
    AwardVersions ||--o{ RateChangeAlerts : triggers
    
    AuditEvents ||--o{ AuditEventChanges : logs
    
    ComplianceChecks ||--o{ ComplianceIssues : finds
    ComplianceChecks ||--o{ ComplianceWarnings : raises
    
    AwardVersions {
        uuid id PK
        uuid award_id FK
        string version
        date effective_date
        date expiry_date
        string fwc_reference
        date fwc_publication_date
        text changes_summary
        json rate_snapshot
        boolean is_current
        boolean is_archived
        datetime imported_at
        string imported_by
        text notes
    }
    
    AwardVersionChanges {
        uuid id PK
        uuid version_id FK
        string change_type
        string affected_item
        string affected_item_id
        decimal previous_value
        decimal new_value
        decimal change_percent
        text description
    }
    
    RateChangeAlerts {
        uuid id PK
        uuid tenant_id FK
        string alert_type
        string priority
        string status
        uuid affected_award_id FK
        uuid affected_eba_id FK
        json affected_staff_ids
        string title
        text message
        text details
        string action_required
        date action_deadline
        date trigger_date
        datetime created_at
        datetime acknowledged_at
        string acknowledged_by
        datetime actioned_at
        string actioned_by
        text notes
    }
    
    AuditEvents {
        uuid id PK
        uuid tenant_id FK
        string event_type
        string entity_type
        uuid entity_id
        string entity_name
        string action
        string reason
        string performed_by
        string performed_by_name
        datetime performed_at
        string source
        json alerts_created
    }
    
    AuditEventChanges {
        uuid id PK
        uuid event_id FK
        string field
        text old_value
        text new_value
    }
    
    ComplianceChecks {
        uuid id PK
        uuid tenant_id FK
        datetime check_date
        uuid staff_id FK
        uuid award_id FK
        uuid eba_id FK
        boolean is_compliant
        int compliance_score
        string performed_by
        text notes
    }
    
    ComplianceIssues {
        uuid id PK
        uuid check_id FK
        string severity
        string category
        string title
        text description
        json affected_staff_ids
        json affected_pay_periods
        decimal estimated_underpayment
        string recommended_action
        date remediation_deadline
        string status
        datetime resolved_at
        string resolved_by
        text resolution_notes
    }
    
    ComplianceWarnings {
        uuid id PK
        uuid check_id FK
        string category
        string title
        text description
        string recommendation
    }`,
  },
  {
    id: 'fwc-updates',
    title: 'FWC Rate Updates',
    icon: <Bell className="h-4 w-4" />,
    description: 'Fair Work Commission rate updates and installation tracking',
    tableCount: 4,
    diagram: `erDiagram
    FWCUpdates ||--o{ FWCRateChanges : contains
    FWCUpdates ||--o{ FWCAllowanceChanges : contains
    FWCUpdates ||--o{ FWCPenaltyChanges : contains
    
    TenantUpdateInstalls ||--o| FWCUpdates : installs
    
    FWCUpdates {
        uuid id PK
        uuid award_id FK
        string award_name
        string award_code
        string version
        string previous_version
        date release_date
        date effective_date
        string source
        string source_url
        string status
        int total_changes
        decimal rate_increase_percent
        text summary_notes
        text detailed_notes
    }
    
    FWCRateChanges {
        uuid id PK
        uuid update_id FK
        string classification_id
        string classification_name
        decimal previous_rate
        decimal new_rate
        decimal change_percent
        string change_type
    }
    
    FWCAllowanceChanges {
        uuid id PK
        uuid update_id FK
        string allowance_id
        string allowance_name
        decimal previous_rate
        decimal new_rate
        decimal change_percent
    }
    
    FWCPenaltyChanges {
        uuid id PK
        uuid update_id FK
        string penalty_type
        decimal previous_multiplier
        decimal new_multiplier
    }
    
    TenantUpdateInstalls {
        uuid id PK
        uuid tenant_id FK
        uuid update_id FK
        uuid award_id FK
        string current_version
        datetime installed_at
        string installed_by
        boolean auto_update
        datetime scheduled_for
    }`,
  },
  {
    id: 'staff-awards',
    title: 'Staff Award Assignments',
    icon: <Users className="h-4 w-4" />,
    description: 'Staff to award/EBA mappings, multi-award employees',
    tableCount: 5,
    diagram: `erDiagram
    StaffAwardAssignments ||--o{ StaffClassificationHistory : tracks
    StaffAwardAssignments ||--o| ModernAwards : "assigned to"
    StaffAwardAssignments ||--o| EnterpriseAgreements : "covered by"
    
    MultiAwardEmployees ||--o{ AdditionalAgreements : has
    MultiAwardEmployees ||--o{ StaffClassifications : "classified in"
    
    StaffAwardAssignments {
        uuid id PK
        uuid staff_id FK
        uuid award_id FK
        uuid eba_id FK
        uuid classification_id FK
        string employment_type
        date effective_from
        date effective_to
        boolean is_current
        datetime created_at
        string created_by
    }
    
    StaffClassificationHistory {
        uuid id PK
        uuid assignment_id FK
        uuid previous_classification_id FK
        uuid new_classification_id FK
        date change_date
        string change_reason
        string changed_by
    }
    
    MultiAwardEmployees {
        uuid id PK
        uuid staff_id FK
        uuid primary_agreement_id FK
        string primary_agreement_type
        text notes
        datetime updated_at
        string updated_by
    }
    
    AdditionalAgreements {
        uuid id PK
        uuid multi_award_id FK
        uuid agreement_id FK
        string agreement_type
        json applicable_conditions
        int priority
    }
    
    StaffClassifications {
        uuid id PK
        uuid multi_award_id FK
        uuid agreement_id FK
        uuid classification_id FK
        string classification_name
        date effective_from
    }`,
  },
];

// SQL Schema will be loaded from file
const SQL_SCHEMA_URL = '/database/PerformanceModule_MSSQL_Schema.sql';

const MermaidDiagram: React.FC<{ chart: string; id: string }> = ({ chart, id }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;
      
      try {
        containerRef.current.innerHTML = '';
        const { svg } = await mermaid.render(`mermaid-${id}`, chart);
        containerRef.current.innerHTML = svg;
        setError(null);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError('Failed to render diagram');
      }
    };

    renderDiagram();
  }, [chart, id]);

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="w-full overflow-x-auto bg-card rounded-lg p-4 border"
    />
  );
};

const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language = 'sql' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 z-10"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
      <ScrollArea className="h-[600px] w-full rounded-lg border bg-muted/50">
        <pre className="p-4 text-sm font-mono whitespace-pre overflow-x-auto">
          <code className={`language-${language}`}>{code}</code>
        </pre>
      </ScrollArea>
    </div>
  );
};

const DatabaseDocumentation: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('architecture');
  const [expandedSections, setExpandedSections] = useState<string[]>(['architecture']);
  const [sqlSchemaContent, setSqlSchemaContent] = useState<string>('Loading schema...');
  const [isLoadingSchema, setIsLoadingSchema] = useState(true);

  // Load SQL schema from file
  useEffect(() => {
    const loadSchema = async () => {
      try {
        const response = await fetch(SQL_SCHEMA_URL);
        if (response.ok) {
          const text = await response.text();
          setSqlSchemaContent(text);
        } else {
          setSqlSchemaContent('-- Failed to load schema file');
        }
      } catch (error) {
        console.error('Error loading schema:', error);
        setSqlSchemaContent('-- Error loading schema file');
      } finally {
        setIsLoadingSchema(false);
      }
    };
    loadSchema();
  }, []);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const totalTables = erdSections.reduce((sum, section) => sum + section.tableCount, 0);
  const awardsTableCount = awardsErdSections.reduce((sum, section) => sum + section.tableCount, 0);
  
  // Awards SQL Schema content
  const awardsSchemaContent = `-- =============================================
-- Awards Module Database Schema
-- Australian Modern Awards & Enterprise Agreements
-- MS SQL Server Implementation
-- =============================================

-- =============================================
-- SCHEMA: awards
-- Core Modern Awards Configuration
-- =============================================

CREATE SCHEMA awards;
GO

-- Modern Awards Master Table
CREATE TABLE awards.ModernAwards (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    name NVARCHAR(255) NOT NULL,
    code NVARCHAR(50) NOT NULL,
    fwc_code NVARCHAR(20),                    -- Fair Work Commission code (e.g., MA000120)
    industry NVARCHAR(100),
    coverage_description NVARCHAR(MAX),
    is_active BIT DEFAULT 1,
    current_version NVARCHAR(50),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_ModernAwards_Code UNIQUE (tenant_id, code)
);

-- Award Classifications
CREATE TABLE awards.AwardClassifications (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    award_id UNIQUEIDENTIFIER NOT NULL REFERENCES awards.ModernAwards(id),
    code NVARCHAR(50) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    level INT,
    stream NVARCHAR(100),                     -- e.g., 'Direct Care', 'General', 'Food Services'
    employment_type NVARCHAR(50),             -- 'Adult', 'Apprentice', 'Junior'
    required_qualifications NVARCHAR(MAX),
    min_experience_months INT,
    display_order INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_Classification_Code UNIQUE (award_id, code)
);

-- Classification Pay Rates (with effective dates for scheduled increases)
CREATE TABLE awards.ClassificationPayRates (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    classification_id UNIQUEIDENTIFIER NOT NULL REFERENCES awards.AwardClassifications(id),
    rate_type NVARCHAR(20) NOT NULL,          -- 'hourly', 'weekly', 'annual'
    hourly_rate DECIMAL(10,4) NOT NULL,
    weekly_rate DECIMAL(10,2),
    annual_rate DECIMAL(12,2),
    effective_from DATE NOT NULL,
    effective_to DATE,
    version NVARCHAR(50),                     -- e.g., 'FWC 2024-25'
    is_current BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Rate Schedules (for planned future increases)
CREATE TABLE awards.RateSchedules (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    classification_id UNIQUEIDENTIFIER NOT NULL REFERENCES awards.AwardClassifications(id),
    schedule_name NVARCHAR(100),
    hourly_rate DECIMAL(10,4) NOT NULL,
    weekly_rate DECIMAL(10,2),
    effective_date DATE NOT NULL,
    notes NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Tenant Award Configurations
CREATE TABLE awards.TenantAwardConfigs (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    award_id UNIQUEIDENTIFIER NOT NULL REFERENCES awards.ModernAwards(id),
    is_enabled BIT DEFAULT 1,
    auto_update BIT DEFAULT 0,
    current_version NVARCHAR(50),
    installed_at DATETIME2,
    installed_by NVARCHAR(255),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_TenantAward UNIQUE (tenant_id, award_id)
);

-- =============================================
-- SCHEMA: allowances
-- Award Allowances and Penalty Rates
-- =============================================

CREATE SCHEMA allowances;
GO

-- Award Allowances
CREATE TABLE allowances.AwardAllowances (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    award_id UNIQUEIDENTIFIER NOT NULL REFERENCES awards.ModernAwards(id),
    code NVARCHAR(50) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    allowance_type NVARCHAR(50),              -- 'expense', 'skill', 'condition', 'on_call'
    amount DECIMAL(10,4) NOT NULL,
    frequency NVARCHAR(50) NOT NULL,          -- 'per_hour', 'per_shift', 'per_week', 'per_annum'
    trigger_type NVARCHAR(50),                -- 'Standby', 'Callback', 'Recall', 'Emergency'
    is_taxable BIT DEFAULT 1,
    is_super_applicable BIT DEFAULT 0,
    is_stackable BIT DEFAULT 1,
    priority INT DEFAULT 0,
    conditions NVARCHAR(MAX),
    xero_earnings_type_id NVARCHAR(100),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_Allowance_Code UNIQUE (award_id, code)
);

-- Allowance Mutual Exclusions
CREATE TABLE allowances.AllowanceExclusions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    allowance_id UNIQUEIDENTIFIER NOT NULL REFERENCES allowances.AwardAllowances(id),
    excludes_allowance_id UNIQUEIDENTIFIER NOT NULL REFERENCES allowances.AwardAllowances(id),
    reason NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_Exclusion UNIQUE (allowance_id, excludes_allowance_id)
);

-- Award Penalty Rates
CREATE TABLE allowances.AwardPenaltyRates (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    award_id UNIQUEIDENTIFIER NOT NULL REFERENCES awards.ModernAwards(id),
    penalty_type NVARCHAR(50) NOT NULL,       -- 'weekend', 'public_holiday', 'evening', 'night'
    day_type NVARCHAR(50),                    -- 'saturday', 'sunday', 'public_holiday'
    start_time TIME,
    end_time TIME,
    multiplier DECIMAL(5,4) NOT NULL,
    applies_to_casual BIT DEFAULT 1,
    casual_additional_loading DECIMAL(5,4),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Shift Differentials
CREATE TABLE allowances.ShiftDifferentials (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    award_id UNIQUEIDENTIFIER NOT NULL REFERENCES awards.ModernAwards(id),
    shift_type NVARCHAR(50) NOT NULL,         -- 'evening', 'night', 'early_morning'
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    rate_addition DECIMAL(10,4),
    rate_multiplier DECIMAL(5,4),
    is_compound BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Differential Rules
CREATE TABLE allowances.DifferentialRules (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    differential_id UNIQUEIDENTIFIER NOT NULL REFERENCES allowances.ShiftDifferentials(id),
    day_of_week NVARCHAR(20),
    applies_public_holiday BIT DEFAULT 0,
    override_multiplier DECIMAL(5,4),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Tenant Allowance Overrides
CREATE TABLE allowances.TenantAllowanceOverrides (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    allowance_id UNIQUEIDENTIFIER NOT NULL REFERENCES allowances.AwardAllowances(id),
    custom_amount DECIMAL(10,4),
    is_enabled BIT DEFAULT 1,
    reason NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    created_by NVARCHAR(255),
    CONSTRAINT UQ_TenantAllowanceOverride UNIQUE (tenant_id, allowance_id)
);

-- Tenant Penalty Overrides
CREATE TABLE allowances.TenantPenaltyOverrides (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    penalty_id UNIQUEIDENTIFIER NOT NULL REFERENCES allowances.AwardPenaltyRates(id),
    custom_multiplier DECIMAL(5,4),
    is_enabled BIT DEFAULT 1,
    reason NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    created_by NVARCHAR(255),
    CONSTRAINT UQ_TenantPenaltyOverride UNIQUE (tenant_id, penalty_id)
);

-- =============================================
-- SCHEMA: eba
-- Enterprise Business Agreements
-- =============================================

CREATE SCHEMA eba;
GO

-- Enterprise Agreements
CREATE TABLE eba.EnterpriseAgreements (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    name NVARCHAR(255) NOT NULL,
    code NVARCHAR(50) NOT NULL,
    agreement_type NVARCHAR(50) NOT NULL,     -- 'modern_award', 'enterprise_agreement', 'individual_flexibility'
    status NVARCHAR(50) DEFAULT 'active',     -- 'active', 'expired', 'pending_approval', 'superseded'
    coverage_description NVARCHAR(MAX),
    applicable_states NVARCHAR(MAX),          -- JSON array
    industry_classifications NVARCHAR(MAX),   -- JSON array
    approval_date DATE,
    commencement_date DATE NOT NULL,
    nominal_expiry_date DATE NOT NULL,
    fwc_reference NVARCHAR(100),
    fwc_approval_number NVARCHAR(100),
    underlying_award_id UNIQUEIDENTIFIER REFERENCES awards.ModernAwards(id),
    superannuation_rate DECIMAL(5,4) DEFAULT 0.115,
    version NVARCHAR(50),
    previous_version_id UNIQUEIDENTIFIER,
    notes NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    created_by NVARCHAR(255),
    CONSTRAINT UQ_EBA_Code UNIQUE (tenant_id, code)
);

-- EBA Classifications
CREATE TABLE eba.EBAClassifications (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    eba_id UNIQUEIDENTIFIER NOT NULL REFERENCES eba.EnterpriseAgreements(id),
    code NVARCHAR(50) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    level INT,
    required_qualifications NVARCHAR(MAX),    -- JSON array
    min_experience_months INT,
    mapped_award_classification NVARCHAR(100),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_EBA_Classification UNIQUE (eba_id, code)
);

-- EBA Pay Rates
CREATE TABLE eba.EBAPayRates (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    classification_id UNIQUEIDENTIFIER NOT NULL REFERENCES eba.EBAClassifications(id),
    rate_type NVARCHAR(20) NOT NULL,
    base_rate DECIMAL(10,4) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    annual_increase_percent DECIMAL(5,4),
    next_increase_date DATE,
    notes NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- EBA Allowances
CREATE TABLE eba.EBAAllowances (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    eba_id UNIQUEIDENTIFIER NOT NULL REFERENCES eba.EnterpriseAgreements(id),
    code NVARCHAR(50) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    amount DECIMAL(10,4) NOT NULL,
    frequency NVARCHAR(50) NOT NULL,
    conditions NVARCHAR(MAX),
    is_taxable BIT DEFAULT 1,
    is_super_applicable BIT DEFAULT 0,
    xero_earnings_type_id NVARCHAR(100),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_EBA_Allowance UNIQUE (eba_id, code)
);

-- EBA Leave Entitlements
CREATE TABLE eba.EBALeaveEntitlements (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    eba_id UNIQUEIDENTIFIER NOT NULL REFERENCES eba.EnterpriseAgreements(id),
    leave_type NVARCHAR(50) NOT NULL,
    entitlement_days DECIMAL(5,2) NOT NULL,
    accrual_method NVARCHAR(50),              -- 'progressive', 'anniversary', 'immediate'
    conditions NVARCHAR(MAX),
    exceeds_nes BIT DEFAULT 0,
    nes_entitlement_days DECIMAL(5,2),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- EBA Penalty Rates
CREATE TABLE eba.EBAPenaltyRates (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    eba_id UNIQUEIDENTIFIER NOT NULL REFERENCES eba.EnterpriseAgreements(id),
    saturday_multiplier DECIMAL(5,4),
    sunday_multiplier DECIMAL(5,4),
    public_holiday_multiplier DECIMAL(5,4),
    evening_start TIME,
    evening_end TIME,
    evening_multiplier DECIMAL(5,4),
    night_start TIME,
    night_end TIME,
    night_multiplier DECIMAL(5,4),
    overtime_first_2hrs DECIMAL(5,4),
    overtime_after_2hrs DECIMAL(5,4),
    casual_loading DECIMAL(5,4),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- EBA Conditions
CREATE TABLE eba.EBAConditions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    eba_id UNIQUEIDENTIFIER NOT NULL REFERENCES eba.EnterpriseAgreements(id),
    category NVARCHAR(50) NOT NULL,           -- 'hours', 'breaks', 'rosters', 'consultation', 'dispute', 'other'
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    clause_reference NVARCHAR(100),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- EBA Redundancy Scale
CREATE TABLE eba.EBARedundancyScale (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    eba_id UNIQUEIDENTIFIER NOT NULL REFERENCES eba.EnterpriseAgreements(id),
    years_of_service INT NOT NULL,
    weeks_pay_entitlement INT NOT NULL,
    conditions NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- =============================================
-- SCHEMA: overrides
-- Custom Rate Overrides and Rule Builder
-- =============================================

CREATE SCHEMA overrides;
GO

-- Custom Rate Overrides
CREATE TABLE overrides.CustomRateOverrides (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    classification_id UNIQUEIDENTIFIER REFERENCES awards.AwardClassifications(id),
    staff_id UNIQUEIDENTIFIER,
    override_type NVARCHAR(50) NOT NULL,      -- 'classification', 'individual', 'bulk'
    custom_hourly_rate DECIMAL(10,4),
    custom_weekly_rate DECIMAL(10,2),
    rate_adjustment_percent DECIMAL(5,4),
    effective_from DATE NOT NULL,
    effective_to DATE,
    reason NVARCHAR(MAX),
    approval_status NVARCHAR(50) DEFAULT 'pending',
    approved_by UNIQUEIDENTIFIER,
    approved_at DATETIME2,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    created_by NVARCHAR(255)
);

-- Rate Override History
CREATE TABLE overrides.RateOverrideHistory (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    override_id UNIQUEIDENTIFIER NOT NULL REFERENCES overrides.CustomRateOverrides(id),
    previous_rate DECIMAL(10,4),
    new_rate DECIMAL(10,4),
    change_reason NVARCHAR(MAX),
    changed_at DATETIME2 DEFAULT GETUTCDATE(),
    changed_by NVARCHAR(255)
);

-- Custom Rules (Rule Builder)
CREATE TABLE overrides.CustomRules (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    rule_type NVARCHAR(50) NOT NULL,          -- 'pay_adjustment', 'allowance_trigger', 'penalty_override'
    is_active BIT DEFAULT 1,
    priority INT DEFAULT 0,
    logic_operator NVARCHAR(10) DEFAULT 'AND', -- 'AND', 'OR'
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    created_by NVARCHAR(255)
);

-- Rule Conditions
CREATE TABLE overrides.RuleConditions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    rule_id UNIQUEIDENTIFIER NOT NULL REFERENCES overrides.CustomRules(id),
    field NVARCHAR(100) NOT NULL,             -- 'daily_hours', 'weekly_hours', 'years_of_service', etc.
    operator NVARCHAR(50) NOT NULL,           -- 'equals', 'greater_than', 'less_than', 'between', etc.
    value NVARCHAR(MAX) NOT NULL,
    value_type NVARCHAR(50) NOT NULL,         -- 'number', 'string', 'date', 'boolean'
    condition_order INT DEFAULT 0,
    group_operator NVARCHAR(10) DEFAULT 'AND',
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Rule Actions
CREATE TABLE overrides.RuleActions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    rule_id UNIQUEIDENTIFIER NOT NULL REFERENCES overrides.CustomRules(id),
    action_type NVARCHAR(50) NOT NULL,        -- 'apply_multiplier', 'add_flat_rate', 'trigger_allowance'
    target_field NVARCHAR(100) NOT NULL,
    action_value NVARCHAR(MAX) NOT NULL,
    value_type NVARCHAR(50) NOT NULL,
    action_order INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Overtime Configurations
CREATE TABLE overrides.OvertimeConfigs (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    award_id UNIQUEIDENTIFIER REFERENCES awards.ModernAwards(id),
    name NVARCHAR(255) NOT NULL,
    is_active BIT DEFAULT 1,
    daily_threshold_hours DECIMAL(5,2) DEFAULT 7.6,
    weekly_threshold_hours DECIMAL(5,2) DEFAULT 38,
    standard_multiplier DECIMAL(5,4) DEFAULT 1.5,
    double_time_multiplier DECIMAL(5,4) DEFAULT 2.0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    created_by NVARCHAR(255)
);

-- Overtime Thresholds
CREATE TABLE overrides.OvertimeThresholds (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    config_id UNIQUEIDENTIFIER NOT NULL REFERENCES overrides.OvertimeConfigs(id),
    threshold_type NVARCHAR(50) NOT NULL,     -- 'daily', 'weekly'
    hours_threshold DECIMAL(5,2) NOT NULL,
    multiplier DECIMAL(5,4) NOT NULL,
    tier_order INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- =============================================
-- SCHEMA: audit
-- Compliance and Audit Trail
-- =============================================

CREATE SCHEMA audit;
GO

-- Award Versions
CREATE TABLE audit.AwardVersions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    award_id UNIQUEIDENTIFIER NOT NULL REFERENCES awards.ModernAwards(id),
    version NVARCHAR(50) NOT NULL,
    effective_date DATE NOT NULL,
    expiry_date DATE,
    fwc_reference NVARCHAR(100),
    fwc_publication_date DATE,
    changes_summary NVARCHAR(MAX),
    rate_snapshot NVARCHAR(MAX),              -- JSON snapshot of all rates
    is_current BIT DEFAULT 0,
    is_archived BIT DEFAULT 0,
    imported_at DATETIME2 DEFAULT GETUTCDATE(),
    imported_by NVARCHAR(255),
    notes NVARCHAR(MAX)
);

-- Award Version Changes
CREATE TABLE audit.AwardVersionChanges (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    version_id UNIQUEIDENTIFIER NOT NULL REFERENCES audit.AwardVersions(id),
    change_type NVARCHAR(50) NOT NULL,        -- 'rate_increase', 'allowance_change', 'penalty_change', etc.
    affected_item NVARCHAR(255) NOT NULL,
    affected_item_id NVARCHAR(100),
    previous_value DECIMAL(10,4),
    new_value DECIMAL(10,4),
    change_percent DECIMAL(5,4),
    description NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Rate Change Alerts
CREATE TABLE audit.RateChangeAlerts (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    alert_type NVARCHAR(50) NOT NULL,         -- 'upcoming_fwc_change', 'eba_expiry', 'rate_below_award', etc.
    priority NVARCHAR(20) NOT NULL,           -- 'low', 'medium', 'high', 'critical'
    status NVARCHAR(50) DEFAULT 'pending',    -- 'pending', 'acknowledged', 'actioned', 'dismissed'
    affected_award_id UNIQUEIDENTIFIER,
    affected_eba_id UNIQUEIDENTIFIER,
    affected_staff_ids NVARCHAR(MAX),         -- JSON array
    title NVARCHAR(255) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    details NVARCHAR(MAX),
    action_required NVARCHAR(MAX),
    action_deadline DATE,
    trigger_date DATE NOT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    acknowledged_at DATETIME2,
    acknowledged_by NVARCHAR(255),
    actioned_at DATETIME2,
    actioned_by NVARCHAR(255),
    notes NVARCHAR(MAX)
);

-- Audit Events
CREATE TABLE audit.AuditEvents (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    event_type NVARCHAR(50) NOT NULL,
    entity_type NVARCHAR(50) NOT NULL,        -- 'award', 'eba', 'classification', 'allowance', etc.
    entity_id UNIQUEIDENTIFIER NOT NULL,
    entity_name NVARCHAR(255),
    action NVARCHAR(50) NOT NULL,             -- 'create', 'update', 'delete', 'enable', 'disable', 'sync'
    reason NVARCHAR(MAX),
    performed_by NVARCHAR(255) NOT NULL,
    performed_by_name NVARCHAR(255),
    performed_at DATETIME2 DEFAULT GETUTCDATE(),
    source NVARCHAR(50) NOT NULL,             -- 'user', 'system', 'fwc_sync', 'import'
    alerts_created NVARCHAR(MAX)              -- JSON array of alert IDs
);

-- Audit Event Changes
CREATE TABLE audit.AuditEventChanges (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    event_id UNIQUEIDENTIFIER NOT NULL REFERENCES audit.AuditEvents(id),
    field NVARCHAR(100) NOT NULL,
    old_value NVARCHAR(MAX),
    new_value NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Compliance Checks
CREATE TABLE audit.ComplianceChecks (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    check_date DATETIME2 DEFAULT GETUTCDATE(),
    staff_id UNIQUEIDENTIFIER,
    award_id UNIQUEIDENTIFIER,
    eba_id UNIQUEIDENTIFIER,
    is_compliant BIT NOT NULL,
    compliance_score INT,
    performed_by NVARCHAR(255),
    notes NVARCHAR(MAX)
);

-- Compliance Issues
CREATE TABLE audit.ComplianceIssues (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    check_id UNIQUEIDENTIFIER NOT NULL REFERENCES audit.ComplianceChecks(id),
    severity NVARCHAR(20) NOT NULL,           -- 'critical', 'major', 'minor'
    category NVARCHAR(50) NOT NULL,           -- 'pay_rate', 'allowance', 'leave', 'penalty', 'super', etc.
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    affected_staff_ids NVARCHAR(MAX),
    affected_pay_periods NVARCHAR(MAX),
    estimated_underpayment DECIMAL(12,2),
    recommended_action NVARCHAR(MAX),
    remediation_deadline DATE,
    status NVARCHAR(50) DEFAULT 'open',       -- 'open', 'in_progress', 'resolved', 'accepted_risk'
    resolved_at DATETIME2,
    resolved_by NVARCHAR(255),
    resolution_notes NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Compliance Warnings
CREATE TABLE audit.ComplianceWarnings (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    check_id UNIQUEIDENTIFIER NOT NULL REFERENCES audit.ComplianceChecks(id),
    category NVARCHAR(50) NOT NULL,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    recommendation NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- =============================================
-- SCHEMA: fwc
-- Fair Work Commission Updates
-- =============================================

CREATE SCHEMA fwc;
GO

-- FWC Updates
CREATE TABLE fwc.FWCUpdates (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    award_id UNIQUEIDENTIFIER NOT NULL REFERENCES awards.ModernAwards(id),
    award_name NVARCHAR(255),
    award_code NVARCHAR(50),
    version NVARCHAR(50) NOT NULL,
    previous_version NVARCHAR(50),
    release_date DATE NOT NULL,
    effective_date DATE NOT NULL,
    source NVARCHAR(50) NOT NULL,             -- 'fwc', 'manual', 'imported'
    source_url NVARCHAR(500),
    status NVARCHAR(50) DEFAULT 'available',  -- 'available', 'installed', 'scheduled', 'skipped'
    total_changes INT,
    rate_increase_percent DECIMAL(5,4),
    summary_notes NVARCHAR(MAX),
    detailed_notes NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- FWC Rate Changes
CREATE TABLE fwc.FWCRateChanges (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    update_id UNIQUEIDENTIFIER NOT NULL REFERENCES fwc.FWCUpdates(id),
    classification_id NVARCHAR(100),
    classification_name NVARCHAR(255),
    previous_rate DECIMAL(10,4),
    new_rate DECIMAL(10,4),
    change_percent DECIMAL(5,4),
    change_type NVARCHAR(20),                 -- 'increase', 'decrease', 'unchanged'
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- FWC Allowance Changes
CREATE TABLE fwc.FWCAllowanceChanges (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    update_id UNIQUEIDENTIFIER NOT NULL REFERENCES fwc.FWCUpdates(id),
    allowance_id NVARCHAR(100),
    allowance_name NVARCHAR(255),
    previous_rate DECIMAL(10,4),
    new_rate DECIMAL(10,4),
    change_percent DECIMAL(5,4),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- FWC Penalty Changes
CREATE TABLE fwc.FWCPenaltyChanges (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    update_id UNIQUEIDENTIFIER NOT NULL REFERENCES fwc.FWCUpdates(id),
    penalty_type NVARCHAR(100),
    previous_multiplier DECIMAL(5,4),
    new_multiplier DECIMAL(5,4),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Tenant Update Installations
CREATE TABLE fwc.TenantUpdateInstalls (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    update_id UNIQUEIDENTIFIER NOT NULL REFERENCES fwc.FWCUpdates(id),
    award_id UNIQUEIDENTIFIER NOT NULL,
    current_version NVARCHAR(50),
    installed_at DATETIME2,
    installed_by NVARCHAR(255),
    auto_update BIT DEFAULT 0,
    scheduled_for DATETIME2,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_TenantUpdateInstall UNIQUE (tenant_id, update_id)
);

-- =============================================
-- SCHEMA: staff_awards
-- Staff Award Assignments
-- =============================================

CREATE SCHEMA staff_awards;
GO

-- Staff Award Assignments
CREATE TABLE staff_awards.StaffAwardAssignments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    staff_id UNIQUEIDENTIFIER NOT NULL,
    award_id UNIQUEIDENTIFIER REFERENCES awards.ModernAwards(id),
    eba_id UNIQUEIDENTIFIER REFERENCES eba.EnterpriseAgreements(id),
    classification_id UNIQUEIDENTIFIER,
    employment_type NVARCHAR(50),             -- 'full_time', 'part_time', 'casual'
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_current BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    created_by NVARCHAR(255)
);

-- Staff Classification History
CREATE TABLE staff_awards.StaffClassificationHistory (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    assignment_id UNIQUEIDENTIFIER NOT NULL REFERENCES staff_awards.StaffAwardAssignments(id),
    previous_classification_id UNIQUEIDENTIFIER,
    new_classification_id UNIQUEIDENTIFIER NOT NULL,
    change_date DATE NOT NULL,
    change_reason NVARCHAR(MAX),
    changed_by NVARCHAR(255),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Multi-Award Employees
CREATE TABLE staff_awards.MultiAwardEmployees (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    staff_id UNIQUEIDENTIFIER NOT NULL,
    primary_agreement_id UNIQUEIDENTIFIER NOT NULL,
    primary_agreement_type NVARCHAR(50) NOT NULL,
    notes NVARCHAR(MAX),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_by NVARCHAR(255)
);

-- Additional Agreements
CREATE TABLE staff_awards.AdditionalAgreements (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    multi_award_id UNIQUEIDENTIFIER NOT NULL REFERENCES staff_awards.MultiAwardEmployees(id),
    agreement_id UNIQUEIDENTIFIER NOT NULL,
    agreement_type NVARCHAR(50) NOT NULL,
    applicable_conditions NVARCHAR(MAX),      -- JSON array
    priority INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Staff Classifications (for multi-award)
CREATE TABLE staff_awards.StaffClassifications (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    multi_award_id UNIQUEIDENTIFIER NOT NULL REFERENCES staff_awards.MultiAwardEmployees(id),
    agreement_id UNIQUEIDENTIFIER NOT NULL,
    classification_id UNIQUEIDENTIFIER NOT NULL,
    classification_name NVARCHAR(255),
    effective_from DATE NOT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- =============================================
-- INDEXES
-- =============================================

-- Awards indexes
CREATE INDEX IX_ModernAwards_TenantId ON awards.ModernAwards(tenant_id);
CREATE INDEX IX_ModernAwards_Code ON awards.ModernAwards(code);
CREATE INDEX IX_AwardClassifications_AwardId ON awards.AwardClassifications(award_id);
CREATE INDEX IX_ClassificationPayRates_ClassificationId ON awards.ClassificationPayRates(classification_id);
CREATE INDEX IX_ClassificationPayRates_EffectiveFrom ON awards.ClassificationPayRates(effective_from);

-- Allowances indexes
CREATE INDEX IX_AwardAllowances_AwardId ON allowances.AwardAllowances(award_id);
CREATE INDEX IX_AwardPenaltyRates_AwardId ON allowances.AwardPenaltyRates(award_id);

-- EBA indexes
CREATE INDEX IX_EnterpriseAgreements_TenantId ON eba.EnterpriseAgreements(tenant_id);
CREATE INDEX IX_EnterpriseAgreements_Status ON eba.EnterpriseAgreements(status);
CREATE INDEX IX_EBAClassifications_EbaId ON eba.EBAClassifications(eba_id);

-- Audit indexes
CREATE INDEX IX_RateChangeAlerts_TenantId ON audit.RateChangeAlerts(tenant_id);
CREATE INDEX IX_RateChangeAlerts_Status ON audit.RateChangeAlerts(status);
CREATE INDEX IX_AuditEvents_TenantId ON audit.AuditEvents(tenant_id);
CREATE INDEX IX_AuditEvents_EntityType ON audit.AuditEvents(entity_type);

-- Staff awards indexes
CREATE INDEX IX_StaffAwardAssignments_StaffId ON staff_awards.StaffAwardAssignments(staff_id);
CREATE INDEX IX_StaffAwardAssignments_IsCurrent ON staff_awards.StaffAwardAssignments(is_current);

-- =============================================
-- END OF AWARDS MODULE SCHEMA
-- =============================================
`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Database Documentation</h1>
                  <p className="text-sm text-muted-foreground">
                    Performance ({totalTables}+ tables) • Awards ({awardsTableCount}+ tables) • Roster ({rosterTableCount}+ tables) • Multi-Tenant Schemas
                  </p>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/docs/srs')} className="gap-2">
              <FileCode className="h-4 w-4" />
              SRS Documentation
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="performance-erd" className="space-y-6">
          <TabsList className="grid w-full max-w-4xl grid-cols-6">
            <TabsTrigger value="performance-erd" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Performance</span> ERD
            </TabsTrigger>
            <TabsTrigger value="performance-sql" className="flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              <span className="hidden sm:inline">Performance</span> SQL
            </TabsTrigger>
            <TabsTrigger value="awards-erd" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Awards</span> ERD
            </TabsTrigger>
            <TabsTrigger value="awards-sql" className="flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              <span className="hidden sm:inline">Awards</span> SQL
            </TabsTrigger>
            <TabsTrigger value="roster-erd" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Roster</span> ERD
            </TabsTrigger>
            <TabsTrigger value="roster-sql" className="flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              <span className="hidden sm:inline">Roster</span> SQL
            </TabsTrigger>
          </TabsList>

          {/* Performance ERD Diagrams Tab */}
          <TabsContent value="performance-erd" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar Navigation */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Performance Schemas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {erdSections.map((section) => (
                      <Button
                        key={section.id}
                        variant={activeSection === section.id ? 'secondary' : 'ghost'}
                        className="w-full justify-start gap-2 text-sm"
                        onClick={() => {
                          setActiveSection(section.id);
                          if (!expandedSections.includes(section.id)) {
                            toggleSection(section.id);
                          }
                        }}
                      >
                        {section.icon}
                        <span className="truncate">{section.title}</span>
                        {section.tableCount > 0 && (
                          <Badge variant="outline" className="ml-auto text-xs">
                            {section.tableCount}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3 space-y-4">
                {erdSections.map((section) => (
                  <Collapsible
                    key={section.id}
                    open={expandedSections.includes(section.id)}
                    onOpenChange={() => toggleSection(section.id)}
                  >
                    <Card id={section.id}>
                      <CollapsibleTrigger className="w-full">
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                {section.icon}
                              </div>
                              <div className="text-left">
                                <CardTitle className="text-lg">{section.title}</CardTitle>
                                <CardDescription>{section.description}</CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {section.tableCount > 0 && (
                                <Badge>{section.tableCount} tables</Badge>
                              )}
                              {expandedSections.includes(section.id) ? (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <MermaidDiagram chart={section.diagram} id={section.id} />
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Performance SQL Schema Tab */}
          <TabsContent value="performance-sql" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileCode className="h-5 w-5" />
                      Performance Module - MS SQL Schema
                    </CardTitle>
                    <CardDescription>
                      Full multi-tenant database schema with all {totalTables}+ tables and fields
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">MS SQL Server</Badge>
                    <Badge variant="outline">Multi-Tenant</Badge>
                    <Badge variant="outline">RLS Ready</Badge>
                    <Badge variant="outline">2000+ Lines</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const blob = new Blob([sqlSchemaContent], { type: 'text/sql' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'PerformanceModule_MSSQL_Schema.sql';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      disabled={isLoadingSchema}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Download SQL
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingSchema ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-3 text-muted-foreground">Loading complete schema...</span>
                  </div>
                ) : (
                  <CodeBlock code={sqlSchemaContent} language="sql" />
                )}
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    📄 This is the <strong>complete</strong> schema with all tables, fields, constraints, and indexes.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    File location: <code className="bg-background px-1 rounded">docs/database/PerformanceModule_MSSQL_Schema.sql</code>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Schema Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-primary">16</div>
                  <p className="text-sm text-muted-foreground">Schemas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-primary">100+</div>
                  <p className="text-sm text-muted-foreground">Tables</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-primary">2000+</div>
                  <p className="text-sm text-muted-foreground">Lines of SQL</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-primary">50+</div>
                  <p className="text-sm text-muted-foreground">Indexes</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Awards ERD Diagrams Tab */}
          <TabsContent value="awards-erd" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar Navigation */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Awards Schemas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {awardsErdSections.map((section) => (
                      <Button
                        key={section.id}
                        variant={activeSection === section.id ? 'secondary' : 'ghost'}
                        className="w-full justify-start gap-2 text-sm"
                        onClick={() => {
                          setActiveSection(section.id);
                          if (!expandedSections.includes(section.id)) {
                            toggleSection(section.id);
                          }
                        }}
                      >
                        {section.icon}
                        <span className="truncate">{section.title}</span>
                        {section.tableCount > 0 && (
                          <Badge variant="outline" className="ml-auto text-xs">
                            {section.tableCount}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3 space-y-4">
                {awardsErdSections.map((section) => (
                  <Collapsible
                    key={section.id}
                    open={expandedSections.includes(section.id)}
                    onOpenChange={() => toggleSection(section.id)}
                  >
                    <Card id={section.id}>
                      <CollapsibleTrigger className="w-full">
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                {section.icon}
                              </div>
                              <div className="text-left">
                                <CardTitle className="text-lg">{section.title}</CardTitle>
                                <CardDescription>{section.description}</CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {section.tableCount > 0 && (
                                <Badge>{section.tableCount} tables</Badge>
                              )}
                              {expandedSections.includes(section.id) ? (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <MermaidDiagram chart={section.diagram} id={section.id} />
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Awards SQL Schema Tab */}
          <TabsContent value="awards-sql" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileCode className="h-5 w-5" />
                      Awards Module - MS SQL Schema
                    </CardTitle>
                    <CardDescription>
                      Australian Awards compliance schema with {awardsTableCount}+ tables
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">MS SQL Server</Badge>
                    <Badge variant="outline">Multi-Tenant</Badge>
                    <Badge variant="outline">FWC Compliant</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const blob = new Blob([awardsSchemaContent], { type: 'text/sql' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'AwardsModule_MSSQL_Schema.sql';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Download SQL
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CodeBlock code={awardsSchemaContent} language="sql" />
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    📄 This schema covers Australian Modern Awards, Enterprise Agreements, and compliance tracking.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Awards Schema Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-primary">8</div>
                  <p className="text-sm text-muted-foreground">Schemas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-primary">{awardsTableCount}+</div>
                  <p className="text-sm text-muted-foreground">Tables</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-primary">FWC</div>
                  <p className="text-sm text-muted-foreground">Compliant</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-primary">EBA</div>
                  <p className="text-sm text-muted-foreground">Support</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Roster ERD Diagrams Tab */}
          <TabsContent value="roster-erd" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar Navigation */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Roster Schemas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {rosterErdSections.map((section) => (
                      <Button
                        key={section.id}
                        variant={activeSection === section.id ? 'secondary' : 'ghost'}
                        className="w-full justify-start gap-2 text-sm"
                        onClick={() => {
                          setActiveSection(section.id);
                          if (!expandedSections.includes(section.id)) {
                            toggleSection(section.id);
                          }
                        }}
                      >
                        {section.icon}
                        <span className="truncate">{section.title}</span>
                        {section.tableCount > 0 && (
                          <Badge variant="outline" className="ml-auto text-xs">
                            {section.tableCount}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3 space-y-4">
                {rosterErdSections.map((section) => (
                  <Collapsible
                    key={section.id}
                    open={expandedSections.includes(section.id)}
                    onOpenChange={() => toggleSection(section.id)}
                  >
                    <Card id={section.id}>
                      <CollapsibleTrigger className="w-full">
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                {section.icon}
                              </div>
                              <div className="text-left">
                                <CardTitle className="text-lg">{section.title}</CardTitle>
                                <CardDescription>{section.description}</CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {section.tableCount > 0 && (
                                <Badge>{section.tableCount} tables</Badge>
                              )}
                              {expandedSections.includes(section.id) ? (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <MermaidDiagram chart={section.diagram} id={section.id} />
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Roster SQL Schema Tab */}
          <TabsContent value="roster-sql" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileCode className="h-5 w-5" />
                      Roster Module - MS SQL Schema
                    </CardTitle>
                    <CardDescription>
                      Childcare workforce scheduling schema with {rosterTableCount}+ tables
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">MS SQL Server</Badge>
                    <Badge variant="outline">Multi-Tenant</Badge>
                    <Badge variant="outline">NQF Compliant</Badge>
                    <Badge variant="outline">GPS Validation</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const blob = new Blob([rosterSchemaContent], { type: 'text/sql' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'RosterModule_MSSQL_Schema.sql';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Download SQL
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CodeBlock code={rosterSchemaContent} language="sql" />
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    📄 This schema covers workforce scheduling, attendance tracking, NQF compliance, and fatigue management.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Roster Schema Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-primary">{rosterSchemaCount}</div>
                  <p className="text-sm text-muted-foreground">Schemas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-primary">{rosterTableCount}+</div>
                  <p className="text-sm text-muted-foreground">Tables</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-primary">NQF</div>
                  <p className="text-sm text-muted-foreground">Compliant</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-primary">GPS</div>
                  <p className="text-sm text-muted-foreground">Validation</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DatabaseDocumentation;
