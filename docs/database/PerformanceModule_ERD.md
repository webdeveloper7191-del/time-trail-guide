# Performance Management Module - Entity Relationship Diagrams

## Overview

This document provides visual ERD representations for the Performance Management Module database schema, organized by microservice boundaries.

**Schema Legend:**
- 🔵 **Core** - Shared tenant/user data
- 🟢 **Goals** - OKRs and Goals
- 🟣 **Reviews** - Performance reviews and calibration
- 🟠 **Feedback** - 360° feedback and recognition
- 🔴 **LMS** - Learning management
- 🟡 **Talent** - Skills, career pathing, succession
- 🩵 **Engagement** - Surveys and wellbeing
- 💰 **Compensation** - Salary and merit
- 📋 **Plans** - Development plans and templates
- ⚠️ **PIP** - Performance improvement plans
- 💬 **Activities** - Conversations and 1:1s
- ✅ **Tasks** - Performance tasks and pipelines
- 🤝 **Mentorship** - Mentor matching
- 💵 **Budget** - Development budget tracking

---

## High-Level Service Architecture

```mermaid
graph TB
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
    CORE --> BUDGET
    
    GOALS --> REVIEWS
    GOALS --> TASKS
    REVIEWS --> FEEDBACK
    REVIEWS --> PLANS
    LMS --> TALENT
    LMS --> PLANS
    TALENT --> MENTORSHIP
    PLANS --> PIP
    ACTIVITIES --> TASKS
```

---

## 1. Core Service ERD

```mermaid
erDiagram
    Tenants ||--o{ Departments : has
    Tenants ||--o{ Locations : has
    Tenants ||--o{ Users : has
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
    Teams ||--o| Departments : "belongs to"
    
    Tenants {
        uuid id PK
        string name
        string subdomain UK
        string plan_type
        string industry
        string timezone
        string currency_code
        json settings
        boolean is_active
        datetime trial_ends_at
    }
    
    Users {
        uuid id PK
        uuid tenant_id FK
        string email
        string first_name
        string last_name
        string employee_id
        uuid department_id FK
        uuid location_id FK
        uuid manager_id FK
        string position_title
        string employment_type
        date hire_date
        boolean is_manager
        boolean is_active
    }
    
    Departments {
        uuid id PK
        uuid tenant_id FK
        string name
        string code
        uuid parent_department_id FK
        uuid head_user_id FK
        string cost_center
        boolean is_active
    }
    
    Locations {
        uuid id PK
        uuid tenant_id FK
        string name
        string city
        string country
        string timezone
    }
    
    Teams {
        uuid id PK
        uuid tenant_id FK
        string name
        uuid leader_id FK
        uuid department_id FK
    }
    
    TeamMembers {
        uuid id PK
        uuid team_id FK
        uuid user_id FK
        string role
        datetime joined_at
    }
    
    UserRoles {
        uuid id PK
        uuid user_id FK
        string role
        string scope_type
        uuid scope_id
        datetime expires_at
    }
```

---

## 2. Goals & OKR Service ERD

```mermaid
erDiagram
    OKRCycles ||--o{ Objectives : contains
    Objectives ||--o{ KeyResults : has
    Objectives ||--o{ Objectives : "parent of"
    KeyResults ||--o{ KeyResultUpdates : tracks
    
    Goals ||--o{ GoalMilestones : has
    GoalCategories ||--o{ Goals : categorizes
    
    Users ||--o{ Objectives : owns
    Users ||--o{ Goals : has
    Users ||--o{ KeyResults : owns
    Teams ||--o| Objectives : owns
    
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
        uuid tenant_id FK
        uuid cycle_id FK
        string title
        string level "company|team|individual"
        string status "draft|active|at_risk|completed"
        uuid owner_id FK
        uuid team_id FK
        uuid parent_objective_id FK
        decimal progress
        date start_date
        date end_date
    }
    
    KeyResults {
        uuid id PK
        uuid tenant_id FK
        uuid objective_id FK
        string title
        string result_type "percentage|number|currency|boolean"
        string unit
        decimal start_value
        decimal target_value
        decimal current_value
        decimal progress
        uuid owner_id FK
        date due_date
    }
    
    KeyResultUpdates {
        uuid id PK
        uuid key_result_id FK
        decimal previous_value
        decimal new_value
        string notes
        uuid updated_by FK
    }
    
    Goals {
        uuid id PK
        uuid tenant_id FK
        uuid staff_id FK
        string title
        string category
        string priority "low|medium|high|critical"
        string status
        decimal progress
        date start_date
        date target_date
        uuid linked_review_id FK
    }
    
    GoalMilestones {
        uuid id PK
        uuid goal_id FK
        string title
        date target_date
        boolean completed
    }
    
    GoalCategories {
        uuid id PK
        uuid tenant_id FK
        string name
        string color
    }
```

---

## 3. Reviews Service ERD

```mermaid
erDiagram
    ReviewCycles ||--o{ PerformanceReviews : contains
    ReviewCycles ||--o{ CalibrationSessions : has
    
    ReviewCriteriaTemplates ||--o{ ReviewCriteriaItems : contains
    ReviewCriteriaTemplates ||--o| PerformanceReviews : "used by"
    
    PerformanceReviews ||--o{ ReviewRatings : has
    ReviewCriteriaItems ||--o{ ReviewRatings : "rated by"
    
    CalibrationSessions ||--o{ CalibrationParticipants : has
    CalibrationSessions ||--o{ CalibrationRatings : produces
    
    Users ||--o{ PerformanceReviews : "reviewed"
    Users ||--o{ PerformanceReviews : "reviewer"
    
    ReviewCycles {
        uuid id PK
        uuid tenant_id FK
        string name
        string cycle_type "annual|quarterly"
        date period_start
        date period_end
        date self_review_deadline
        date manager_review_deadline
        string status
        date nomination_deadline
        int max_peer_nominations
    }
    
    ReviewCriteriaTemplates {
        uuid id PK
        uuid tenant_id FK
        string name
        boolean is_default
        boolean is_active
    }
    
    ReviewCriteriaItems {
        uuid id PK
        uuid template_id FK
        string name
        string description
        decimal weight
        int display_order
    }
    
    PerformanceReviews {
        uuid id PK
        uuid tenant_id FK
        uuid cycle_id FK
        uuid criteria_template_id FK
        uuid staff_id FK
        uuid reviewer_id FK
        string status "draft|pending_self|pending_manager|completed"
        date period_start
        date period_end
        decimal overall_self_rating
        decimal overall_manager_rating
        text self_summary
        text manager_summary
        json strengths
        json areas_for_improvement
    }
    
    ReviewRatings {
        uuid id PK
        uuid review_id FK
        uuid criteria_item_id FK
        decimal self_rating
        decimal manager_rating
        text self_comments
        text manager_comments
    }
    
    CalibrationSessions {
        uuid id PK
        uuid tenant_id FK
        uuid cycle_id FK
        uuid facilitator_id FK
        uuid department_id FK
        datetime scheduled_date
        string status
    }
    
    CalibrationRatings {
        uuid id PK
        uuid session_id FK
        uuid staff_id FK
        uuid review_id FK
        decimal original_rating
        decimal calibrated_rating
        text rating_justification
    }
```

---

## 4. Feedback Service ERD (360° & Recognition)

```mermaid
erDiagram
    Feedback360Requests ||--o{ Feedback360Responses : has
    Feedback360Responses ||--o{ Feedback360Ratings : contains
    Competencies ||--o{ Feedback360Ratings : "rated on"
    
    PeerNominations }o--|| ReviewCycles : "for"
    
    PraisePosts ||--o{ PraiseBadges : has
    PraisePosts ||--o{ PraiseLikes : receives
    PraisePosts ||--o{ PraiseComments : has
    CultureValues ||--o| PraiseBadges : "linked to"
    
    RecognitionPointsLedger }o--|| Users : "belongs to"
    RewardsCatalog ||--o{ RewardRedemptions : "redeemed as"
    
    Users ||--o{ Feedback : gives
    Users ||--o{ Feedback : receives
    Users ||--o{ PraisePosts : gives
    Users ||--o{ PraisePosts : receives
    
    Competencies {
        uuid id PK
        uuid tenant_id FK
        string name
        string description
        string category
    }
    
    Feedback360Requests {
        uuid id PK
        uuid tenant_id FK
        uuid subject_staff_id FK
        uuid requester_id FK
        uuid cycle_id FK
        string title
        date due_date
        string status
        boolean anonymous_responses
    }
    
    Feedback360Responses {
        uuid id PK
        uuid request_id FK
        uuid responder_id FK
        string source_type "self|manager|peer|direct_report"
        boolean is_anonymous
        string status
        text strengths
        text areas_for_improvement
    }
    
    Feedback360Ratings {
        uuid id PK
        uuid response_id FK
        uuid competency_id FK
        decimal rating
        text comments
    }
    
    PeerNominations {
        uuid id PK
        uuid tenant_id FK
        uuid cycle_id FK
        uuid nominator_id FK
        uuid nominee_id FK
        string reason
        string relationship
        string status "pending|approved|rejected"
    }
    
    Feedback {
        uuid id PK
        uuid from_staff_id FK
        uuid to_staff_id FK
        string feedback_type "praise|constructive|coaching"
        text message
        boolean is_private
        uuid linked_goal_id FK
    }
    
    PraisePosts {
        uuid id PK
        uuid from_staff_id FK
        uuid to_staff_id FK
        string category
        text message
        int points_awarded
    }
    
    CultureValues {
        uuid id PK
        uuid tenant_id FK
        string name
        string description
        string icon
        string color
    }
    
    RecognitionPointsLedger {
        uuid id PK
        uuid user_id FK
        int points
        string transaction_type
        string reference_type
        uuid reference_id
    }
    
    RewardsCatalog {
        uuid id PK
        uuid tenant_id FK
        string name
        int points_cost
        int stock_quantity
    }
    
    RewardRedemptions {
        uuid id PK
        uuid user_id FK
        uuid reward_id FK
        int points_spent
        string status
    }
```

---

## 5. LMS Service ERD

```mermaid
erDiagram
    CourseCategories ||--o{ Courses : contains
    CourseCategories ||--o{ CourseCategories : "parent of"
    
    Courses ||--o{ CourseModules : has
    Courses ||--o{ CoursePrerequisites : requires
    Courses ||--o{ CourseSkills : teaches
    Courses ||--o{ CourseTags : tagged
    Courses ||--o{ Enrollments : "enrolled in"
    Courses ||--o{ Certificates : issues
    
    CourseModules ||--o{ ModuleContent : contains
    CourseModules ||--o{ Assessments : has
    CourseModules ||--o{ ModuleProgress : tracks
    
    Assessments ||--o{ AssessmentQuestions : contains
    Assessments ||--o{ AssessmentAttempts : "attempted in"
    
    LearningPaths ||--o{ LearningPathCourses : contains
    LearningPaths ||--o{ LearningPathEnrollments : "enrolled in"
    LearningPaths ||--o{ LearningPathTags : tagged
    
    Enrollments ||--o{ ModuleProgress : tracks
    Enrollments ||--o{ ContentProgress : tracks
    
    Users ||--o{ Enrollments : has
    Users ||--o{ LearningPathEnrollments : has
    Users ||--o{ LearningStreaks : maintains
    Users ||--o{ DailyActivity : logs
    Users ||--o{ EarnedAchievements : earns
    
    Achievements ||--o{ EarnedAchievements : "awarded as"
    
    Courses {
        uuid id PK
        uuid tenant_id FK
        string title
        uuid category_id FK
        string difficulty "beginner|intermediate|advanced|expert"
        int duration_minutes
        string status "draft|published|archived"
        uuid instructor_id FK
        boolean compliance_required
        boolean certificate_on_completion
        decimal passing_score
        decimal average_rating
        int enrollment_count
    }
    
    CourseModules {
        uuid id PK
        uuid course_id FK
        string title
        int duration_minutes
        int display_order
        boolean is_locked
    }
    
    ModuleContent {
        uuid id PK
        uuid module_id FK
        string title
        string content_type "video|document|quiz|scorm"
        string content_url
        int duration_minutes
        boolean is_mandatory
    }
    
    Assessments {
        uuid id PK
        uuid module_id FK
        string title
        string assessment_type "quiz|assignment|certification_exam"
        decimal passing_score
        int time_limit_minutes
        int max_attempts
    }
    
    AssessmentQuestions {
        uuid id PK
        uuid assessment_id FK
        string question_type
        text question_text
        json options
        json correct_answer
        decimal points
    }
    
    LearningPaths {
        uuid id PK
        uuid tenant_id FK
        string name
        string description
        int estimated_duration_minutes
        boolean require_sequential_completion
    }
    
    Enrollments {
        uuid id PK
        uuid staff_id FK
        uuid course_id FK
        string status "not_started|in_progress|completed"
        decimal progress
        datetime started_at
        datetime completed_at
        date due_date
    }
    
    Certificates {
        uuid id PK
        uuid staff_id FK
        uuid course_id FK
        uuid enrollment_id FK
        string certificate_number UK
        datetime issued_at
        datetime expires_at
        string status
    }
    
    LearningStreaks {
        uuid id PK
        uuid staff_id FK
        int current_streak
        int longest_streak
        date last_activity_date
        int daily_goal_minutes
    }
    
    Achievements {
        uuid id PK
        uuid tenant_id FK
        string title
        string achievement_type
        string rarity
        int points_value
    }
```

---

## 6. Talent Service ERD (Skills, Career, 9-Box, Succession)

```mermaid
erDiagram
    Skills ||--o{ StaffSkills : "assessed in"
    Skills ||--o{ CareerLevelSkills : "required for"
    
    StaffSkills ||--o{ SkillCertifications : has
    
    CareerPaths ||--o{ CareerLevels : contains
    CareerLevels ||--o{ CareerLevelSkills : requires
    
    CareerPaths ||--o{ StaffCareerProgress : "tracked in"
    CareerLevels ||--o| StaffCareerProgress : "current level"
    CareerLevels ||--o| StaffCareerProgress : "target level"
    
    KeyRoles ||--o{ SuccessionCandidates : has
    SuccessionCandidates ||--o{ SuccessionCompetencyGaps : has
    SuccessionCandidates ||--o{ DevelopmentActions : has
    
    Users ||--o{ StaffSkills : has
    Users ||--o{ TalentAssessments : assessed
    Users ||--o{ StaffCareerProgress : tracks
    Users ||--o{ SuccessionCandidates : "candidate for"
    
    Departments ||--o| CareerPaths : has
    Departments ||--o| KeyRoles : has
    
    Skills {
        uuid id PK
        uuid tenant_id FK
        string name UK
        string category
        string description
        boolean is_core
    }
    
    StaffSkills {
        uuid id PK
        uuid staff_id FK
        uuid skill_id FK
        string current_level "none|beginner|intermediate|advanced|expert"
        string target_level
        datetime last_assessed_at
        uuid assessed_by FK
    }
    
    SkillCertifications {
        uuid id PK
        uuid staff_skill_id FK
        string certification_name
        string issuing_body
        date issued_date
        date expiry_date
    }
    
    CareerPaths {
        uuid id PK
        uuid tenant_id FK
        string name
        uuid department_id FK
        boolean is_active
    }
    
    CareerLevels {
        uuid id PK
        uuid career_path_id FK
        string title
        int level_number
        decimal required_experience_years
        decimal salary_range_min
        decimal salary_range_max
    }
    
    CareerLevelSkills {
        uuid id PK
        uuid career_level_id FK
        uuid skill_id FK
        string min_level
    }
    
    StaffCareerProgress {
        uuid id PK
        uuid staff_id FK
        uuid current_path_id FK
        uuid current_level_id FK
        uuid target_level_id FK
        decimal readiness_percentage
        string estimated_time_to_next_level
    }
    
    TalentAssessments {
        uuid id PK
        uuid staff_id FK
        uuid assessor_id FK
        date assessment_date
        string performance_level "low|medium|high"
        string potential_level "low|medium|high"
        decimal performance_score
        decimal potential_score
        string flight_risk "low|medium|high"
        string readiness
        boolean is_current
    }
    
    KeyRoles {
        uuid id PK
        uuid tenant_id FK
        string title
        uuid department_id FK
        uuid current_holder_id FK
        string criticality "essential|important|standard"
        string vacancy_risk
        json required_competencies
    }
    
    SuccessionCandidates {
        uuid id PK
        uuid key_role_id FK
        uuid staff_id FK
        string readiness "ready_now|ready_1_2_years|ready_3_5_years"
        decimal overall_score
        uuid mentor_id FK
    }
    
    DevelopmentActions {
        uuid id PK
        uuid candidate_id FK
        string title
        string action_type "training|project|mentoring|stretch_assignment"
        string status
        uuid linked_learning_path_id FK
    }
```

---

## 7. Engagement Service ERD

```mermaid
erDiagram
    PulseSurveys ||--o{ SurveyQuestions : contains
    PulseSurveys ||--o{ SurveyTargets : targets
    PulseSurveys ||--o{ SurveyResponses : receives
    PulseSurveys ||--o| ENPSResults : "aggregated in"
    
    SurveyResponses ||--o{ SurveyAnswers : contains
    SurveyQuestions ||--o{ SurveyAnswers : "answered by"
    
    Users ||--o{ SurveyResponses : submits
    Users ||--o{ HappinessScores : reports
    Users ||--o{ WellbeingIndicators : tracks
    Users ||--o{ WellbeingCheckIns : completes
    
    PulseSurveys {
        uuid id PK
        uuid tenant_id FK
        string title
        string description
        string frequency "weekly|monthly|quarterly"
        string status "draft|active|closed"
        string target_audience "all|department|team"
        boolean anonymous_responses
        date start_date
        date end_date
    }
    
    SurveyQuestions {
        uuid id PK
        uuid survey_id FK
        text question_text
        string question_type "rating|enps|text|yes_no|multiple_choice"
        string category "engagement|satisfaction|culture"
        boolean is_required
        json options
        int display_order
    }
    
    SurveyTargets {
        uuid id PK
        uuid survey_id FK
        string target_type "department|team|location"
        uuid target_id FK
    }
    
    SurveyResponses {
        uuid id PK
        uuid survey_id FK
        uuid responder_id FK
        datetime submitted_at
    }
    
    SurveyAnswers {
        uuid id PK
        uuid response_id FK
        uuid question_id FK
        string answer_value
    }
    
    ENPSResults {
        uuid id PK
        uuid tenant_id FK
        uuid survey_id FK
        string period
        date period_start
        date period_end
        decimal score
        int promoters_count
        int passives_count
        int detractors_count
        int total_responses
        decimal response_rate
        string trend "up|down|stable"
    }
    
    HappinessScores {
        uuid id PK
        uuid staff_id FK
        int score
        string month_year
        text notes
    }
    
    WellbeingIndicators {
        uuid id PK
        uuid staff_id FK
        date period_start
        date period_end
        decimal overtime_hours
        int consecutive_work_days
        decimal leave_balance
        int days_since_last_leave
        decimal workload_score
        decimal engagement_score
        string risk_level "low|moderate|high|critical"
        json risk_factors
        json recommendations
    }
    
    WellbeingCheckIns {
        uuid id PK
        uuid staff_id FK
        date check_in_date
        int energy_level
        int stress_level
        int work_life_balance
        string mood
        text notes
    }
```

---

## 8. Compensation Service ERD

```mermaid
erDiagram
    SalaryBands ||--o{ EmployeeCompensation : "applies to"
    
    MeritCycles ||--o{ MeritAllocations : contains
    MeritCycles ||--o{ MeritBudgets : has
    
    BonusPrograms ||--o{ BonusCriteria : defines
    BonusPrograms ||--o{ BonusAllocations : awards
    
    Users ||--o{ EmployeeCompensation : has
    Users ||--o{ MeritAllocations : receives
    Users ||--o{ BonusAllocations : receives
    
    Departments ||--o| SalaryBands : has
    Departments ||--o| MeritBudgets : "budgeted for"
    
    SalaryBands {
        uuid id PK
        uuid tenant_id FK
        string level "entry|mid|senior|lead|executive"
        string title
        decimal min_salary
        decimal mid_salary
        decimal max_salary
        string currency
        uuid department_id FK
        date effective_date
    }
    
    EmployeeCompensation {
        uuid id PK
        uuid staff_id FK
        uuid salary_band_id FK
        decimal current_salary
        string currency
        decimal compa_ratio
        date last_review_date
        date last_increase_date
        decimal last_increase_percent
        decimal bonus_target_percent
        int stock_options
        boolean is_current
    }
    
    MeritCycles {
        uuid id PK
        uuid tenant_id FK
        string name
        int fiscal_year
        decimal total_budget
        decimal allocated_budget
        date effective_date
        date deadline
        string status "planning|active|completed"
    }
    
    MeritBudgets {
        uuid id PK
        uuid cycle_id FK
        uuid department_id FK
        decimal budget_amount
        decimal allocated_amount
        decimal remaining_amount
    }
    
    MeritAllocations {
        uuid id PK
        uuid cycle_id FK
        uuid staff_id FK
        uuid manager_id FK
        decimal current_salary
        decimal increase_percent
        decimal increase_amount
        decimal new_salary
        string justification
        string status "draft|submitted|approved|rejected"
    }
    
    BonusPrograms {
        uuid id PK
        uuid tenant_id FK
        string name
        string bonus_type "annual|quarterly|spot|project"
        decimal budget_amount
        date period_start
        date period_end
        string status
    }
    
    BonusCriteria {
        uuid id PK
        uuid program_id FK
        string name
        decimal weight
        string measurement_type "percentage|rating|boolean"
        decimal target_value
    }
    
    BonusAllocations {
        uuid id PK
        uuid program_id FK
        uuid staff_id FK
        decimal target_amount
        decimal actual_amount
        decimal performance_multiplier
        json criteria_scores
        string status "pending|approved|paid"
    }
```

---

## 9. Plans & PIP Service ERD

```mermaid
erDiagram
    PlanTemplates ||--o{ PlanTemplateTags : tagged
    PlanTemplates ||--o{ PlanTemplateGoals : defines
    PlanTemplates ||--o{ PlanTemplateReviews : schedules
    PlanTemplates ||--o{ PlanTemplateConversations : schedules
    PlanTemplates ||--o{ PlanTemplateLearning : assigns
    PlanTemplates ||--o{ AssignedPlans : "used in"
    
    PlanTemplateGoals ||--o{ PlanTemplateGoalMilestones : has
    
    AssignedPlans ||--o{ PlanGoals : links
    AssignedPlans ||--o{ PlanReviews : links
    AssignedPlans ||--o{ PlanConversations : links
    AssignedPlans ||--o{ PlanLearning : links
    
    PerformanceImprovementPlans ||--o{ PIPMilestones : has
    PerformanceImprovementPlans ||--o{ PIPCheckIns : has
    PerformanceImprovementPlans ||--o{ PIPDocuments : has
    
    PIPCheckIns ||--o{ PIPCheckInAttendees : has
    
    Users ||--o{ AssignedPlans : "assigned to"
    Users ||--o{ PerformanceImprovementPlans : "on plan"
    
    PlanTemplates {
        uuid id PK
        uuid tenant_id FK
        string name
        string plan_type "onboarding|development|transition|pip|probation"
        string description
        int default_duration_days
        boolean is_active
    }
    
    PlanTemplateGoals {
        uuid id PK
        uuid template_id FK
        string title
        string category
        string priority
        int target_days_from_start
    }
    
    AssignedPlans {
        uuid id PK
        uuid template_id FK
        uuid staff_id FK
        uuid assigned_by FK
        string plan_type
        string status "draft|active|completed|cancelled"
        date start_date
        date end_date
        decimal progress
    }
    
    PerformanceImprovementPlans {
        uuid id PK
        uuid tenant_id FK
        uuid staff_id FK
        uuid manager_id FK
        uuid hr_partner_id FK
        string status "draft|active|extended|completed_success|completed_failure"
        text reason
        json performance_gaps
        json expected_outcomes
        json support_provided
        date start_date
        date original_end_date
        date current_end_date
        int extension_count
        string outcome "improved|extended|terminated|resigned"
    }
    
    PIPMilestones {
        uuid id PK
        uuid pip_id FK
        string title
        text description
        date target_date
        date completed_date
        string status "pending|in_progress|completed|missed"
        text evidence
    }
    
    PIPCheckIns {
        uuid id PK
        uuid pip_id FK
        date scheduled_date
        date completed_date
        text notes
        int progress_rating
        text concerns
        text next_steps
    }
    
    PIPDocuments {
        uuid id PK
        uuid pip_id FK
        string document_type "initial_notice|extension|outcome_letter"
        string title
        string file_url
    }
```

---

## 10. Activities, Tasks & Mentorship ERD

```mermaid
erDiagram
    Conversations ||--o{ ConversationNotes : has
    Conversations ||--o{ ConversationActionItems : creates
    
    Pipelines ||--o{ PipelineStages : contains
    Pipelines ||--o| PerformanceTasks : "managed in"
    PipelineStages ||--o| PerformanceTasks : "positioned at"
    
    PerformanceTasks ||--o{ TaskComments : has
    PerformanceTasks ||--o{ TaskAttachments : has
    PerformanceTasks ||--o{ TaskActivityLog : logs
    CustomTaskTypes ||--o| PerformanceTasks : "typed as"
    
    MentorProfiles ||--o{ MentorshipMatches : "matched in"
    MenteeProfiles ||--o{ MentorshipMatches : "matched in"
    MentorshipMatches ||--o{ MentorshipMeetings : schedules
    
    Users ||--o{ Conversations : "participates in"
    Users ||--o{ PerformanceTasks : "assigned to"
    Users ||--o{ MentorProfiles : has
    Users ||--o{ MenteeProfiles : has
    
    Conversations {
        uuid id PK
        uuid tenant_id FK
        uuid staff_id FK
        uuid manager_id FK
        string conversation_type "one_on_one|check_in|coaching|feedback|career"
        string title
        datetime scheduled_date
        int duration_minutes
        string meeting_link
        boolean completed
        datetime next_meeting_date
    }
    
    ConversationNotes {
        uuid id PK
        uuid conversation_id FK
        text content
        uuid created_by FK
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
        uuid tenant_id FK
        string name
        boolean is_default
    }
    
    PipelineStages {
        uuid id PK
        uuid pipeline_id FK
        string name
        string color
        int display_order
    }
    
    PerformanceTasks {
        uuid id PK
        uuid tenant_id FK
        string title
        string task_type "goal_action|review_followup|development_task"
        string status "open|in_progress|blocked|completed"
        string priority
        uuid pipeline_id FK
        uuid stage_id FK
        uuid assignee_id FK
        uuid created_for_id FK
        date due_date
        uuid linked_goal_id FK
        uuid linked_review_id FK
        uuid linked_plan_id FK
    }
    
    TaskActivityLog {
        uuid id PK
        uuid task_id FK
        string activity_type
        string old_value
        string new_value
        uuid user_id FK
    }
    
    MentorProfiles {
        uuid id PK
        uuid staff_id FK
        json skills
        json interests
        json career_goals
        decimal years_experience
        int max_mentees
        int current_mentees
        string availability "high|medium|low"
        string preferred_meeting_frequency
    }
    
    MenteeProfiles {
        uuid id PK
        uuid staff_id FK
        json desired_skills
        json interests
        json career_goals
        json development_areas
        string preferred_meeting_frequency
    }
    
    MentorshipMatches {
        uuid id PK
        uuid mentor_id FK
        uuid mentee_id FK
        string status "pending|active|completed|cancelled"
        int match_score
        json match_reasons
        json goals
        int meeting_count
        date last_meeting_date
    }
    
    MentorshipMeetings {
        uuid id PK
        uuid match_id FK
        date scheduled_date
        date completed_date
        int duration_minutes
        json topics
        json action_items
        string status "scheduled|completed|cancelled"
    }
```

---

## 11. Budget & Audit Service ERD

```mermaid
erDiagram
    DevelopmentBudgets ||--o{ BudgetRequests : tracks
    
    BudgetRequests }o--|| Users : "submitted by"
    BudgetRequests }o--|| Users : "reviewed by"
    
    AuditLog }o--|| Users : "performed by"
    
    Notifications }o--|| Users : "sent to"
    NotificationPreferences }o--|| Users : "set by"
    
    DevelopmentBudgets {
        uuid id PK
        uuid tenant_id FK
        uuid staff_id FK
        int fiscal_year
        decimal total_budget
        decimal used_budget
        decimal pending_budget
        string currency
    }
    
    BudgetRequests {
        uuid id PK
        uuid tenant_id FK
        uuid staff_id FK
        string title
        text description
        string category "training|conference|certification|books|tools|coaching"
        decimal amount
        string currency
        string vendor
        date event_date
        string event_location
        text justification
        json expected_outcomes
        string status "draft|pending_approval|approved|rejected|completed"
        datetime submitted_at
        uuid reviewed_by FK
        datetime reviewed_at
        text approval_notes
        text rejection_reason
        string receipt_url
    }
    
    AuditLog {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        string action "create|update|delete|view|export"
        string entity_type
        uuid entity_id
        json old_values
        json new_values
        string ip_address
        string user_agent
    }
    
    Notifications {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        string notification_type "review_due|goal_reminder|feedback_received"
        string title
        text message
        string action_url
        string reference_type
        uuid reference_id
        boolean is_read
        datetime read_at
        boolean is_email_sent
    }
    
    NotificationPreferences {
        uuid id PK
        uuid user_id FK
        string notification_type
        boolean in_app_enabled
        boolean email_enabled
        string frequency "immediate|daily_digest|weekly_digest"
    }
```

---

## Cross-Service Relationships Overview

```mermaid
graph LR
    subgraph Core
        U[Users]
        D[Departments]
        T[Teams]
    end
    
    subgraph Goals
        O[Objectives]
        KR[Key Results]
        G[Goals]
    end
    
    subgraph Reviews
        PR[Performance Reviews]
        CS[Calibration Sessions]
    end
    
    subgraph Feedback
        F360[360 Feedback]
        PP[Praise Posts]
    end
    
    subgraph LMS
        C[Courses]
        LP[Learning Paths]
        E[Enrollments]
    end
    
    subgraph Talent
        SK[Skills]
        CP[Career Paths]
        TA[9-Box Assessments]
        SC[Succession]
    end
    
    subgraph Plans
        AP[Assigned Plans]
        PIP[PIP]
    end
    
    subgraph Tasks
        PT[Performance Tasks]
    end
    
    U --> O
    U --> G
    U --> PR
    U --> F360
    U --> E
    U --> SK
    U --> TA
    U --> AP
    U --> PT
    
    G --> PR
    G --> PT
    
    PR --> CS
    PR --> F360
    PR --> PT
    PR --> AP
    
    LP --> SC
    LP --> AP
    
    CP --> SK
    
    SC --> TA
    
    AP --> PIP
    AP --> PT
```

---

## Table Count Summary

| Schema | Table Count | Description |
|--------|-------------|-------------|
| core | 7 | Tenants, Users, Departments, Locations, Teams, TeamMembers, UserRoles |
| goals | 5 | OKRCycles, Objectives, KeyResults, KeyResultUpdates, Goals, GoalMilestones, GoalCategories |
| reviews | 6 | ReviewCycles, ReviewCriteriaTemplates, ReviewCriteriaItems, PerformanceReviews, ReviewRatings, CalibrationSessions, CalibrationParticipants, CalibrationRatings |
| feedback | 12 | Competencies, Feedback360Requests, Feedback360Responses, Feedback360Ratings, PeerNominations, Feedback, CultureValues, PraisePosts, PraiseBadges, PraiseLikes, PraiseComments, RecognitionPointsLedger, RewardsCatalog, RewardRedemptions |
| lms | 20 | CourseCategories, Courses, CoursePrerequisites, CourseSkills, CourseTags, CourseModules, ModuleContent, Assessments, AssessmentQuestions, LearningPaths, LearningPathCourses, LearningPathTags, Enrollments, ModuleProgress, ContentProgress, AssessmentAttempts, Certificates, LearningPathEnrollments, CourseReviews, LearningStreaks, DailyActivity, Achievements, EarnedAchievements |
| talent | 11 | Skills, StaffSkills, SkillCertifications, CareerPaths, CareerLevels, CareerLevelSkills, StaffCareerProgress, TalentAssessments, KeyRoles, SuccessionCandidates, SuccessionCompetencyGaps, DevelopmentActions |
| engagement | 8 | PulseSurveys, SurveyTargets, SurveyQuestions, SurveyResponses, SurveyAnswers, ENPSResults, HappinessScores, WellbeingIndicators, WellbeingCheckIns |
| compensation | 7 | SalaryBands, EmployeeCompensation, MeritCycles, MeritBudgets, MeritAllocations, BonusPrograms, BonusCriteria, BonusAllocations |
| plans | 11 | PlanTemplates, PlanTemplateTags, PlanTemplateGoals, PlanTemplateGoalMilestones, PlanTemplateReviews, PlanTemplateConversations, PlanTemplateLearning, AssignedPlans, PlanGoals, PlanReviews, PlanConversations, PlanLearning |
| pip | 5 | PerformanceImprovementPlans, PIPMilestones, PIPCheckIns, PIPCheckInAttendees, PIPDocuments |
| activities | 3 | Conversations, ConversationNotes, ConversationActionItems |
| tasks | 6 | Pipelines, PipelineStages, CustomTaskTypes, PerformanceTasks, TaskComments, TaskAttachments, TaskActivityLog |
| mentorship | 4 | MentorProfiles, MenteeProfiles, MentorshipMatches, MentorshipMeetings |
| budget | 2 | DevelopmentBudgets, BudgetRequests |
| audit | 1 | AuditLog |
| notifications | 2 | Notifications, NotificationPreferences |

**Total: ~100+ tables across 16 schemas**

---

## Notes

1. **Multi-Tenancy**: All tables include `tenant_id` for data isolation
2. **Soft Deletes**: Most tables support `is_deleted` flag
3. **Audit Trail**: Standard `created_at`, `updated_at` columns
4. **Foreign Keys**: Enforce referential integrity within tenant boundaries
5. **Indexes**: Optimized for common query patterns (tenant + entity lookups)
