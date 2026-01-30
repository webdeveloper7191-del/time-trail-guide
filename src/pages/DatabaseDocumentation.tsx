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
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import mermaid from 'mermaid';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: '#6366f1',
    primaryTextColor: '#ffffff',
    primaryBorderColor: '#4f46e5',
    lineColor: '#94a3b8',
    secondaryColor: '#f1f5f9',
    tertiaryColor: '#e2e8f0',
    background: '#ffffff',
    mainBkg: '#f8fafc',
    nodeBorder: '#cbd5e1',
    clusterBkg: '#f1f5f9',
    titleColor: '#1e293b',
    edgeLabelBackground: '#ffffff',
  },
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis',
  },
  er: {
    useMaxWidth: true,
    layoutDirection: 'TB',
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

// SQL Schema content (abbreviated for display)
const sqlSchemaContent = `/*
================================================================================
PERFORMANCE MANAGEMENT MODULE - MS SQL DATABASE SCHEMA
================================================================================
Multi-Tenant SaaS Application | Microservice Architecture
Version: 1.0.0

ARCHITECTURE NOTES:
- All tables include tenant_id for multi-tenancy isolation
- Row-Level Security (RLS) should be enabled on all tables
- Soft deletes supported via is_deleted + deleted_at columns
- Audit trail via created_at, updated_at, created_by, updated_by
================================================================================
*/

-- ============================================================================
-- SECTION 1: CORE / SHARED TABLES
-- ============================================================================

-- Tenants (Organizations)
CREATE TABLE core.Tenants (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    subdomain NVARCHAR(100) UNIQUE NOT NULL,
    plan_type NVARCHAR(50) NOT NULL DEFAULT 'standard',
    industry NVARCHAR(100),
    timezone NVARCHAR(100) DEFAULT 'UTC',
    locale NVARCHAR(20) DEFAULT 'en-US',
    currency_code NVARCHAR(3) DEFAULT 'USD',
    logo_url NVARCHAR(500),
    settings NVARCHAR(MAX), -- JSON for tenant-specific settings
    is_active BIT DEFAULT 1,
    trial_ends_at DATETIME2,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Users / Staff
CREATE TABLE core.Users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    email NVARCHAR(255) NOT NULL,
    first_name NVARCHAR(100) NOT NULL,
    last_name NVARCHAR(100) NOT NULL,
    display_name NVARCHAR(255),
    avatar_url NVARCHAR(500),
    phone NVARCHAR(50),
    employee_id NVARCHAR(50),
    department_id UNIQUEIDENTIFIER REFERENCES core.Departments(id),
    location_id UNIQUEIDENTIFIER REFERENCES core.Locations(id),
    manager_id UNIQUEIDENTIFIER REFERENCES core.Users(id),
    position_title NVARCHAR(255),
    employment_type NVARCHAR(50),
    hire_date DATE,
    years_experience DECIMAL(5,2),
    is_manager BIT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_Users_TenantEmail UNIQUE (tenant_id, email)
);

-- Departments
CREATE TABLE core.Departments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    name NVARCHAR(255) NOT NULL,
    code NVARCHAR(50),
    parent_department_id UNIQUEIDENTIFIER REFERENCES core.Departments(id),
    head_user_id UNIQUEIDENTIFIER,
    cost_center NVARCHAR(50),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_Departments_TenantName UNIQUE (tenant_id, name)
);

-- ============================================================================
-- SECTION 2: GOALS & OKR SERVICE
-- ============================================================================

-- OKR Cycles
CREATE TABLE goals.OKRCycles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    name NVARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Objectives
CREATE TABLE goals.Objectives (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    cycle_id UNIQUEIDENTIFIER NOT NULL REFERENCES goals.OKRCycles(id),
    title NVARCHAR(500) NOT NULL,
    description NVARCHAR(MAX),
    level NVARCHAR(20) NOT NULL, -- 'company', 'team', 'individual'
    status NVARCHAR(20) NOT NULL DEFAULT 'draft',
    owner_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    team_id UNIQUEIDENTIFIER REFERENCES core.Teams(id),
    parent_objective_id UNIQUEIDENTIFIER REFERENCES goals.Objectives(id),
    progress DECIMAL(5,2) DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Key Results
CREATE TABLE goals.KeyResults (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    objective_id UNIQUEIDENTIFIER NOT NULL REFERENCES goals.Objectives(id),
    title NVARCHAR(500) NOT NULL,
    description NVARCHAR(MAX),
    result_type NVARCHAR(20) NOT NULL,
    unit NVARCHAR(50),
    start_value DECIMAL(18,4) DEFAULT 0,
    target_value DECIMAL(18,4) NOT NULL,
    current_value DECIMAL(18,4) DEFAULT 0,
    progress DECIMAL(5,2) DEFAULT 0,
    owner_id UNIQUEIDENTIFIER REFERENCES core.Users(id),
    due_date DATE,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- ============================================================================
-- SECTION 3: REVIEWS SERVICE
-- ============================================================================

-- Performance Reviews
CREATE TABLE reviews.PerformanceReviews (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    cycle_id UNIQUEIDENTIFIER REFERENCES reviews.ReviewCycles(id),
    criteria_template_id UNIQUEIDENTIFIER,
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    reviewer_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    status NVARCHAR(20) NOT NULL DEFAULT 'draft',
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    overall_self_rating DECIMAL(3,2),
    overall_manager_rating DECIMAL(3,2),
    self_summary NVARCHAR(MAX),
    manager_summary NVARCHAR(MAX),
    strengths NVARCHAR(MAX),
    areas_for_improvement NVARCHAR(MAX),
    development_plan NVARCHAR(MAX),
    is_deleted BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- ============================================================================
-- SECTION 4: FEEDBACK SERVICE
-- ============================================================================

-- 360 Feedback Requests
CREATE TABLE feedback.Feedback360Requests (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    subject_staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    requester_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    cycle_id UNIQUEIDENTIFIER,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    due_date DATE NOT NULL,
    status NVARCHAR(20) DEFAULT 'draft',
    anonymous_responses BIT DEFAULT 1,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Praise Posts
CREATE TABLE feedback.PraisePosts (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    from_staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    to_staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    category NVARCHAR(50),
    message NVARCHAR(MAX) NOT NULL,
    points_awarded INT DEFAULT 0,
    is_public BIT DEFAULT 1,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- ============================================================================
-- SECTION 5: LMS SERVICE
-- ============================================================================

-- Courses
CREATE TABLE lms.Courses (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    thumbnail_url NVARCHAR(500),
    category_id UNIQUEIDENTIFIER,
    difficulty NVARCHAR(20) DEFAULT 'intermediate',
    duration_minutes INT NOT NULL,
    status NVARCHAR(20) DEFAULT 'draft',
    instructor_id UNIQUEIDENTIFIER REFERENCES core.Users(id),
    compliance_required BIT DEFAULT 0,
    certificate_on_completion BIT DEFAULT 0,
    passing_score DECIMAL(5,2) DEFAULT 70,
    average_rating DECIMAL(3,2) DEFAULT 0,
    enrollment_count INT DEFAULT 0,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Enrollments
CREATE TABLE lms.Enrollments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    course_id UNIQUEIDENTIFIER NOT NULL REFERENCES lms.Courses(id),
    status NVARCHAR(20) DEFAULT 'not_started',
    progress DECIMAL(5,2) DEFAULT 0,
    started_at DATETIME2,
    completed_at DATETIME2,
    expires_at DATETIME2,
    assigned_by UNIQUEIDENTIFIER REFERENCES core.Users(id),
    due_date DATE,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_Enrollments UNIQUE (staff_id, course_id)
);

-- ============================================================================
-- SECTION 6: TALENT SERVICE
-- ============================================================================

-- Skills
CREATE TABLE talent.Skills (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    name NVARCHAR(255) NOT NULL,
    category NVARCHAR(100),
    description NVARCHAR(MAX),
    is_core BIT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_Skills UNIQUE (tenant_id, name)
);

-- Career Paths
CREATE TABLE talent.CareerPaths (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    department_id UNIQUEIDENTIFIER REFERENCES core.Departments(id),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- 9-Box Talent Assessments
CREATE TABLE talent.TalentAssessments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    assessor_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    assessment_date DATE NOT NULL,
    performance_level NVARCHAR(10) NOT NULL,
    potential_level NVARCHAR(10) NOT NULL,
    performance_score DECIMAL(3,2),
    potential_score DECIMAL(3,2),
    flight_risk NVARCHAR(10) DEFAULT 'low',
    readiness NVARCHAR(20) DEFAULT 'not_ready',
    is_current BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- ============================================================================
-- SECTION 7: INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IX_Users_TenantId ON core.Users(tenant_id);
CREATE INDEX IX_Users_ManagerId ON core.Users(manager_id);
CREATE INDEX IX_Users_DepartmentId ON core.Users(department_id);
CREATE INDEX IX_Goals_TenantStaff ON goals.Goals(tenant_id, staff_id);
CREATE INDEX IX_PerformanceReviews_TenantStaff ON reviews.PerformanceReviews(tenant_id, staff_id);
CREATE INDEX IX_Enrollments_TenantStaff ON lms.Enrollments(tenant_id, staff_id);

-- Full schema available in docs/database/PerformanceModule_MSSQL_Schema.sql
`;

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

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const totalTables = erdSections.reduce((sum, section) => sum + section.tableCount, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
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
                  Performance Module Schema • {totalTables}+ Tables • 16 Schemas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="erd" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="erd" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              ERD Diagrams
            </TabsTrigger>
            <TabsTrigger value="sql" className="flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              SQL Schema
            </TabsTrigger>
          </TabsList>

          {/* ERD Diagrams Tab */}
          <TabsContent value="erd" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Sidebar Navigation */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Schemas</CardTitle>
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

          {/* SQL Schema Tab */}
          <TabsContent value="sql" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileCode className="h-5 w-5" />
                      MS SQL Schema
                    </CardTitle>
                    <CardDescription>
                      Multi-tenant database schema for Performance Management Module
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">MS SQL Server</Badge>
                    <Badge variant="outline">Multi-Tenant</Badge>
                    <Badge variant="outline">RLS Ready</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CodeBlock code={sqlSchemaContent} language="sql" />
                <p className="mt-4 text-sm text-muted-foreground">
                  📄 Full schema available at: <code className="bg-muted px-1 rounded">docs/database/PerformanceModule_MSSQL_Schema.sql</code>
                </p>
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
        </Tabs>
      </div>
    </div>
  );
};

export default DatabaseDocumentation;
