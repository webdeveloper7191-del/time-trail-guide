/*
================================================================================
PERFORMANCE MANAGEMENT MODULE - MS SQL DATABASE SCHEMA
================================================================================
Multi-Tenant SaaS Application | Microservice Architecture
Version: 1.0.0
Generated: 2025-01-30

ARCHITECTURE NOTES:
- All tables include tenant_id for multi-tenancy isolation
- Row-Level Security (RLS) should be enabled on all tables
- Soft deletes supported via is_deleted + deleted_at columns
- Audit trail via created_at, updated_at, created_by, updated_by
- Indexes optimized for common query patterns
- Foreign keys enforce referential integrity within tenant boundaries

MICROSERVICE BOUNDARIES:
1. Core Service: Tenants, Users, Departments, Teams
2. Goals Service: Goals, OKRs, Key Results
3. Reviews Service: Performance Reviews, Calibration
4. Feedback Service: 360 Feedback, Recognition, Praise
5. Learning Service (LMS): Courses, Paths, Enrollments
6. Talent Service: Skills, Career Pathing, 9-Box, Succession
7. Engagement Service: Surveys, Wellbeing, Happiness
8. Compensation Service: Salary Bands, Merit, Bonuses
9. Tasks Service: Performance Tasks, Pipelines
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
    plan_type NVARCHAR(50) NOT NULL DEFAULT 'standard', -- 'starter', 'standard', 'enterprise'
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

-- Departments
CREATE TABLE core.Departments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    name NVARCHAR(255) NOT NULL,
    code NVARCHAR(50),
    parent_department_id UNIQUEIDENTIFIER REFERENCES core.Departments(id),
    head_user_id UNIQUEIDENTIFIER, -- FK to Users added after Users table
    cost_center NVARCHAR(50),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_Departments_TenantName UNIQUE (tenant_id, name)
);

-- Locations
CREATE TABLE core.Locations (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    name NVARCHAR(255) NOT NULL,
    address NVARCHAR(500),
    city NVARCHAR(100),
    state NVARCHAR(100),
    country NVARCHAR(100),
    postal_code NVARCHAR(20),
    timezone NVARCHAR(100),
    is_active BIT DEFAULT 1,
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
    employee_id NVARCHAR(50), -- Internal employee number
    department_id UNIQUEIDENTIFIER REFERENCES core.Departments(id),
    location_id UNIQUEIDENTIFIER REFERENCES core.Locations(id),
    manager_id UNIQUEIDENTIFIER REFERENCES core.Users(id),
    position_title NVARCHAR(255),
    employment_type NVARCHAR(50), -- 'full_time', 'part_time', 'contractor'
    hire_date DATE,
    termination_date DATE,
    years_experience DECIMAL(5,2),
    is_manager BIT DEFAULT 0,
    is_active BIT DEFAULT 1,
    last_login_at DATETIME2,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_Users_TenantEmail UNIQUE (tenant_id, email)
);

-- Add FK for department head
ALTER TABLE core.Departments 
ADD CONSTRAINT FK_Departments_HeadUser 
FOREIGN KEY (head_user_id) REFERENCES core.Users(id);

-- User Roles (for authorization)
CREATE TABLE core.UserRoles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    user_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    role NVARCHAR(50) NOT NULL, -- 'admin', 'hr_admin', 'manager', 'employee'
    scope_type NVARCHAR(50), -- 'global', 'department', 'team'
    scope_id UNIQUEIDENTIFIER, -- Department or Team ID if scoped
    granted_by UNIQUEIDENTIFIER REFERENCES core.Users(id),
    granted_at DATETIME2 DEFAULT GETUTCDATE(),
    expires_at DATETIME2,
    CONSTRAINT UQ_UserRoles UNIQUE (tenant_id, user_id, role, scope_type, scope_id)
);

-- Teams (cross-departmental groups)
CREATE TABLE core.Teams (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    leader_id UNIQUEIDENTIFIER REFERENCES core.Users(id),
    department_id UNIQUEIDENTIFIER REFERENCES core.Departments(id),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Team Members
CREATE TABLE core.TeamMembers (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    team_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Teams(id),
    user_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    role NVARCHAR(50) DEFAULT 'member', -- 'leader', 'member'
    joined_at DATETIME2 DEFAULT GETUTCDATE(),
    left_at DATETIME2,
    CONSTRAINT UQ_TeamMembers UNIQUE (team_id, user_id)
);

-- ============================================================================
-- SECTION 2: GOALS & OKR SERVICE
-- ============================================================================

-- OKR Cycles
CREATE TABLE goals.OKRCycles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    name NVARCHAR(100) NOT NULL, -- 'Q1 2025', '2025 Annual'
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
    status NVARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'active', 'at_risk', 'on_track', 'completed', 'cancelled'
    owner_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    team_id UNIQUEIDENTIFIER REFERENCES core.Teams(id),
    parent_objective_id UNIQUEIDENTIFIER REFERENCES goals.Objectives(id),
    progress DECIMAL(5,2) DEFAULT 0, -- 0-100
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
    result_type NVARCHAR(20) NOT NULL, -- 'percentage', 'number', 'currency', 'boolean'
    unit NVARCHAR(50), -- '%', '$', 'users', etc.
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

-- Key Result Progress Updates
CREATE TABLE goals.KeyResultUpdates (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    key_result_id UNIQUEIDENTIFIER NOT NULL REFERENCES goals.KeyResults(id),
    previous_value DECIMAL(18,4),
    new_value DECIMAL(18,4) NOT NULL,
    notes NVARCHAR(MAX),
    updated_by UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Goals (standalone goals, separate from OKRs)
CREATE TABLE goals.Goals (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    title NVARCHAR(500) NOT NULL,
    description NVARCHAR(MAX),
    category NVARCHAR(100),
    priority NVARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    status NVARCHAR(20) NOT NULL DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed', 'overdue', 'cancelled'
    progress DECIMAL(5,2) DEFAULT 0,
    start_date DATE NOT NULL,
    target_date DATE NOT NULL,
    completed_at DATETIME2,
    linked_review_id UNIQUEIDENTIFIER, -- FK added later
    linked_plan_id UNIQUEIDENTIFIER, -- FK added later
    created_by UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    is_deleted BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Goal Milestones
CREATE TABLE goals.GoalMilestones (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    goal_id UNIQUEIDENTIFIER NOT NULL REFERENCES goals.Goals(id),
    title NVARCHAR(500) NOT NULL,
    target_date DATE NOT NULL,
    completed BIT DEFAULT 0,
    completed_at DATETIME2,
    order_index INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Goal Categories (configurable per tenant)
CREATE TABLE goals.GoalCategories (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(500),
    color NVARCHAR(20),
    is_active BIT DEFAULT 1,
    display_order INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- ============================================================================
-- SECTION 3: REVIEWS SERVICE
-- ============================================================================

-- Review Cycles
CREATE TABLE reviews.ReviewCycles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    name NVARCHAR(255) NOT NULL,
    cycle_type NVARCHAR(20) NOT NULL, -- 'annual', 'semi_annual', 'quarterly', 'monthly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    self_review_deadline DATE,
    manager_review_deadline DATE,
    status NVARCHAR(20) DEFAULT 'draft', -- 'draft', 'active', 'completed', 'cancelled'
    nomination_deadline DATE, -- for 360 feedback
    max_peer_nominations INT DEFAULT 5,
    created_by UNIQUEIDENTIFIER REFERENCES core.Users(id),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Review Criteria Templates
CREATE TABLE reviews.ReviewCriteriaTemplates (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    is_default BIT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Review Criteria Items
CREATE TABLE reviews.ReviewCriteriaItems (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    template_id UNIQUEIDENTIFIER NOT NULL REFERENCES reviews.ReviewCriteriaTemplates(id),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    weight DECIMAL(5,2) NOT NULL, -- Percentage weight (all must sum to 100)
    display_order INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Performance Reviews
CREATE TABLE reviews.PerformanceReviews (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    cycle_id UNIQUEIDENTIFIER REFERENCES reviews.ReviewCycles(id),
    criteria_template_id UNIQUEIDENTIFIER REFERENCES reviews.ReviewCriteriaTemplates(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    reviewer_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    status NVARCHAR(20) NOT NULL DEFAULT 'draft', -- 'draft', 'pending_self', 'pending_manager', 'completed', 'cancelled'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    overall_self_rating DECIMAL(3,2), -- 1.00-5.00
    overall_manager_rating DECIMAL(3,2),
    self_summary NVARCHAR(MAX),
    manager_summary NVARCHAR(MAX),
    strengths NVARCHAR(MAX), -- JSON array
    areas_for_improvement NVARCHAR(MAX), -- JSON array
    development_plan NVARCHAR(MAX),
    career_aspirations NVARCHAR(MAX),
    next_review_date DATE,
    self_submitted_at DATETIME2,
    manager_submitted_at DATETIME2,
    completed_at DATETIME2,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Review Ratings (per criteria)
CREATE TABLE reviews.ReviewRatings (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    review_id UNIQUEIDENTIFIER NOT NULL REFERENCES reviews.PerformanceReviews(id),
    criteria_item_id UNIQUEIDENTIFIER NOT NULL REFERENCES reviews.ReviewCriteriaItems(id),
    self_rating DECIMAL(3,2), -- 1.00-5.00
    manager_rating DECIMAL(3,2),
    self_comments NVARCHAR(MAX),
    manager_comments NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Calibration Sessions
CREATE TABLE reviews.CalibrationSessions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    title NVARCHAR(255) NOT NULL,
    cycle_id UNIQUEIDENTIFIER REFERENCES reviews.ReviewCycles(id),
    facilitator_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    department_id UNIQUEIDENTIFIER REFERENCES core.Departments(id),
    scheduled_date DATETIME2 NOT NULL,
    completed_at DATETIME2,
    status NVARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
    notes NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Calibration Participants
CREATE TABLE reviews.CalibrationParticipants (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    session_id UNIQUEIDENTIFIER NOT NULL REFERENCES reviews.CalibrationSessions(id),
    user_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    role NVARCHAR(20) DEFAULT 'participant', -- 'facilitator', 'participant'
    joined_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_CalibrationParticipants UNIQUE (session_id, user_id)
);

-- Calibration Ratings
CREATE TABLE reviews.CalibrationRatings (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    session_id UNIQUEIDENTIFIER NOT NULL REFERENCES reviews.CalibrationSessions(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    review_id UNIQUEIDENTIFIER REFERENCES reviews.PerformanceReviews(id),
    original_rating DECIMAL(3,2) NOT NULL,
    calibrated_rating DECIMAL(3,2),
    rating_justification NVARCHAR(MAX),
    discussion_notes NVARCHAR(MAX),
    adjusted_by UNIQUEIDENTIFIER REFERENCES core.Users(id),
    adjusted_at DATETIME2,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- ============================================================================
-- SECTION 4: FEEDBACK SERVICE (360° Feedback, Recognition)
-- ============================================================================

-- 360 Competencies (configurable per tenant)
CREATE TABLE feedback.Competencies (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    category NVARCHAR(100),
    is_active BIT DEFAULT 1,
    display_order INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- 360 Feedback Requests
CREATE TABLE feedback.Feedback360Requests (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    subject_staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    requester_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    cycle_id UNIQUEIDENTIFIER REFERENCES reviews.ReviewCycles(id),
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    due_date DATE NOT NULL,
    status NVARCHAR(20) DEFAULT 'draft', -- 'draft', 'pending', 'in_progress', 'completed', 'expired'
    anonymous_responses BIT DEFAULT 1,
    self_assessment_completed BIT DEFAULT 0,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- 360 Feedback Responses
CREATE TABLE feedback.Feedback360Responses (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    request_id UNIQUEIDENTIFIER NOT NULL REFERENCES feedback.Feedback360Requests(id),
    responder_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    source_type NVARCHAR(20) NOT NULL, -- 'self', 'manager', 'peer', 'direct_report', 'cross_functional', 'external'
    is_anonymous BIT DEFAULT 0,
    status NVARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'declined'
    strengths NVARCHAR(MAX),
    areas_for_improvement NVARCHAR(MAX),
    additional_comments NVARCHAR(MAX),
    submitted_at DATETIME2,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- 360 Feedback Ratings (per competency)
CREATE TABLE feedback.Feedback360Ratings (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    response_id UNIQUEIDENTIFIER NOT NULL REFERENCES feedback.Feedback360Responses(id),
    competency_id UNIQUEIDENTIFIER NOT NULL REFERENCES feedback.Competencies(id),
    rating DECIMAL(3,2) NOT NULL, -- 1.00-5.00
    comments NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Peer Nominations
CREATE TABLE feedback.PeerNominations (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    cycle_id UNIQUEIDENTIFIER NOT NULL REFERENCES reviews.ReviewCycles(id),
    nominator_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    nominee_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    reason NVARCHAR(MAX),
    relationship NVARCHAR(50), -- 'peer', 'cross_functional', 'project_collaborator', 'mentor'
    status NVARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'completed'
    approved_by UNIQUEIDENTIFIER REFERENCES core.Users(id),
    approved_at DATETIME2,
    rejection_reason NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- General Feedback (ongoing feedback)
CREATE TABLE feedback.Feedback (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    from_staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    to_staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    feedback_type NVARCHAR(20) NOT NULL, -- 'praise', 'constructive', 'coaching', 'general'
    message NVARCHAR(MAX) NOT NULL,
    is_private BIT DEFAULT 0,
    linked_goal_id UNIQUEIDENTIFIER REFERENCES goals.Goals(id),
    linked_review_id UNIQUEIDENTIFIER REFERENCES reviews.PerformanceReviews(id),
    is_deleted BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Culture Values
CREATE TABLE feedback.CultureValues (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(500),
    icon NVARCHAR(50),
    color NVARCHAR(20),
    is_active BIT DEFAULT 1,
    display_order INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Praise / Recognition Wall
CREATE TABLE feedback.PraisePosts (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    from_staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    to_staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    category NVARCHAR(50), -- 'teamwork', 'innovation', 'leadership', etc.
    message NVARCHAR(MAX) NOT NULL,
    points_awarded INT DEFAULT 0,
    is_public BIT DEFAULT 1,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Praise Badges (awarded with praise)
CREATE TABLE feedback.PraiseBadges (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    praise_id UNIQUEIDENTIFIER NOT NULL REFERENCES feedback.PraisePosts(id),
    culture_value_id UNIQUEIDENTIFIER REFERENCES feedback.CultureValues(id),
    badge_name NVARCHAR(100) NOT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Praise Likes
CREATE TABLE feedback.PraiseLikes (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    praise_id UNIQUEIDENTIFIER NOT NULL REFERENCES feedback.PraisePosts(id),
    user_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_PraiseLikes UNIQUE (praise_id, user_id)
);

-- Praise Comments
CREATE TABLE feedback.PraiseComments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    praise_id UNIQUEIDENTIFIER NOT NULL REFERENCES feedback.PraisePosts(id),
    user_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    content NVARCHAR(MAX) NOT NULL,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Recognition Points Ledger
CREATE TABLE feedback.RecognitionPointsLedger (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    user_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    points INT NOT NULL, -- positive = earned, negative = spent
    transaction_type NVARCHAR(50) NOT NULL, -- 'earned_praise', 'gave_praise', 'redeemed', 'bonus', 'expired'
    reference_type NVARCHAR(50), -- 'praise', 'reward_redemption'
    reference_id UNIQUEIDENTIFIER,
    notes NVARCHAR(500),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Rewards Catalog
CREATE TABLE feedback.RewardsCatalog (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    category NVARCHAR(100),
    points_cost INT NOT NULL,
    image_url NVARCHAR(500),
    stock_quantity INT, -- NULL = unlimited
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Reward Redemptions
CREATE TABLE feedback.RewardRedemptions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    user_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    reward_id UNIQUEIDENTIFIER NOT NULL REFERENCES feedback.RewardsCatalog(id),
    points_spent INT NOT NULL,
    status NVARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'fulfilled', 'cancelled'
    fulfilled_at DATETIME2,
    fulfilled_by UNIQUEIDENTIFIER REFERENCES core.Users(id),
    notes NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- ============================================================================
-- SECTION 5: LEARNING SERVICE (LMS)
-- ============================================================================

-- Course Categories
CREATE TABLE lms.CourseCategories (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    parent_category_id UNIQUEIDENTIFIER REFERENCES lms.CourseCategories(id),
    display_order INT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Courses
CREATE TABLE lms.Courses (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    thumbnail_url NVARCHAR(500),
    category_id UNIQUEIDENTIFIER REFERENCES lms.CourseCategories(id),
    subcategory NVARCHAR(100),
    difficulty NVARCHAR(20) DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced', 'expert'
    duration_minutes INT NOT NULL,
    status NVARCHAR(20) DEFAULT 'draft', -- 'draft', 'published', 'archived'
    instructor_name NVARCHAR(255),
    instructor_id UNIQUEIDENTIFIER REFERENCES core.Users(id),
    industry NVARCHAR(100),
    compliance_required BIT DEFAULT 0,
    certificate_on_completion BIT DEFAULT 0,
    validity_period_days INT, -- for compliance courses
    passing_score DECIMAL(5,2) DEFAULT 70, -- percentage
    max_attempts INT,
    average_rating DECIMAL(3,2) DEFAULT 0,
    enrollment_count INT DEFAULT 0,
    is_deleted BIT DEFAULT 0,
    created_by UNIQUEIDENTIFIER REFERENCES core.Users(id),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Course Prerequisite
CREATE TABLE lms.CoursePrerequisites (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    course_id UNIQUEIDENTIFIER NOT NULL REFERENCES lms.Courses(id),
    prerequisite_course_id UNIQUEIDENTIFIER NOT NULL REFERENCES lms.Courses(id),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_CoursePrerequisites UNIQUE (course_id, prerequisite_course_id)
);

-- Course Skills
CREATE TABLE lms.CourseSkills (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    course_id UNIQUEIDENTIFIER NOT NULL REFERENCES lms.Courses(id),
    skill_id UNIQUEIDENTIFIER NOT NULL, -- FK to talent.Skills
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Course Tags
CREATE TABLE lms.CourseTags (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    course_id UNIQUEIDENTIFIER NOT NULL REFERENCES lms.Courses(id),
    tag NVARCHAR(100) NOT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Course Modules
CREATE TABLE lms.CourseModules (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    course_id UNIQUEIDENTIFIER NOT NULL REFERENCES lms.Courses(id),
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    duration_minutes INT DEFAULT 0,
    display_order INT NOT NULL,
    is_locked BIT DEFAULT 0,
    unlock_after_module_id UNIQUEIDENTIFIER REFERENCES lms.CourseModules(id),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Module Content
CREATE TABLE lms.ModuleContent (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    module_id UNIQUEIDENTIFIER NOT NULL REFERENCES lms.CourseModules(id),
    title NVARCHAR(255) NOT NULL,
    content_type NVARCHAR(20) NOT NULL, -- 'video', 'document', 'quiz', 'scorm', 'interactive', 'webinar', 'external_link'
    content_url NVARCHAR(500),
    content_data NVARCHAR(MAX), -- JSON for rich content
    duration_minutes INT,
    description NVARCHAR(MAX),
    display_order INT NOT NULL,
    is_mandatory BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Assessments
CREATE TABLE lms.Assessments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    module_id UNIQUEIDENTIFIER NOT NULL REFERENCES lms.CourseModules(id),
    title NVARCHAR(255) NOT NULL,
    assessment_type NVARCHAR(20) NOT NULL, -- 'quiz', 'assignment', 'practical', 'certification_exam'
    passing_score DECIMAL(5,2) DEFAULT 70,
    time_limit_minutes INT,
    max_attempts INT DEFAULT 3,
    shuffle_questions BIT DEFAULT 0,
    show_correct_answers BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Assessment Questions
CREATE TABLE lms.AssessmentQuestions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    assessment_id UNIQUEIDENTIFIER NOT NULL REFERENCES lms.Assessments(id),
    question_type NVARCHAR(20) NOT NULL, -- 'multiple_choice', 'true_false', 'multi_select', 'short_answer', 'matching'
    question_text NVARCHAR(MAX) NOT NULL,
    options NVARCHAR(MAX), -- JSON array of options
    correct_answer NVARCHAR(MAX) NOT NULL, -- JSON for complex answers
    points DECIMAL(5,2) DEFAULT 1,
    explanation NVARCHAR(MAX),
    display_order INT NOT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Learning Paths
CREATE TABLE lms.LearningPaths (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    thumbnail_url NVARCHAR(500),
    estimated_duration_minutes INT,
    require_sequential_completion BIT DEFAULT 0,
    industry NVARCHAR(100),
    is_deleted BIT DEFAULT 0,
    created_by UNIQUEIDENTIFIER REFERENCES core.Users(id),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Learning Path Courses
CREATE TABLE lms.LearningPathCourses (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    learning_path_id UNIQUEIDENTIFIER NOT NULL REFERENCES lms.LearningPaths(id),
    course_id UNIQUEIDENTIFIER NOT NULL REFERENCES lms.Courses(id),
    display_order INT NOT NULL,
    is_required BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_LearningPathCourses UNIQUE (learning_path_id, course_id)
);

-- Learning Path Tags
CREATE TABLE lms.LearningPathTags (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    learning_path_id UNIQUEIDENTIFIER NOT NULL REFERENCES lms.LearningPaths(id),
    tag NVARCHAR(100) NOT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Enrollments
CREATE TABLE lms.Enrollments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    course_id UNIQUEIDENTIFIER NOT NULL REFERENCES lms.Courses(id),
    status NVARCHAR(20) DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed', 'failed', 'expired'
    progress DECIMAL(5,2) DEFAULT 0,
    started_at DATETIME2,
    completed_at DATETIME2,
    expires_at DATETIME2,
    last_accessed_at DATETIME2,
    assigned_by UNIQUEIDENTIFIER REFERENCES core.Users(id),
    due_date DATE,
    notes NVARCHAR(MAX),
    is_deleted BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_Enrollments UNIQUE (staff_id, course_id)
);

-- Module Progress
CREATE TABLE lms.ModuleProgress (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    enrollment_id UNIQUEIDENTIFIER NOT NULL REFERENCES lms.Enrollments(id),
    module_id UNIQUEIDENTIFIER NOT NULL REFERENCES lms.CourseModules(id),
    status NVARCHAR(20) DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed'
    progress DECIMAL(5,2) DEFAULT 0,
    started_at DATETIME2,
    completed_at DATETIME2,
    CONSTRAINT UQ_ModuleProgress UNIQUE (enrollment_id, module_id)
);

-- Content Progress
CREATE TABLE lms.ContentProgress (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    enrollment_id UNIQUEIDENTIFIER NOT NULL REFERENCES lms.Enrollments(id),
    content_id UNIQUEIDENTIFIER NOT NULL REFERENCES lms.ModuleContent(id),
    completed BIT DEFAULT 0,
    progress_seconds INT DEFAULT 0, -- for video content
    completed_at DATETIME2,
    CONSTRAINT UQ_ContentProgress UNIQUE (enrollment_id, content_id)
);

-- Assessment Attempts
CREATE TABLE lms.AssessmentAttempts (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    enrollment_id UNIQUEIDENTIFIER NOT NULL REFERENCES lms.Enrollments(id),
    assessment_id UNIQUEIDENTIFIER NOT NULL REFERENCES lms.Assessments(id),
    attempt_number INT NOT NULL,
    score DECIMAL(5,2),
    passed BIT,
    started_at DATETIME2 NOT NULL,
    completed_at DATETIME2,
    time_spent_seconds INT,
    answers NVARCHAR(MAX) -- JSON of answers
);

-- Certificates
CREATE TABLE lms.Certificates (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    course_id UNIQUEIDENTIFIER NOT NULL REFERENCES lms.Courses(id),
    enrollment_id UNIQUEIDENTIFIER NOT NULL REFERENCES lms.Enrollments(id),
    certificate_number NVARCHAR(100) NOT NULL,
    issued_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    expires_at DATETIME2,
    status NVARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'revoked'
    verification_url NVARCHAR(500),
    CONSTRAINT UQ_CertificateNumber UNIQUE (tenant_id, certificate_number)
);

-- Learning Path Enrollments
CREATE TABLE lms.LearningPathEnrollments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    learning_path_id UNIQUEIDENTIFIER NOT NULL REFERENCES lms.LearningPaths(id),
    status NVARCHAR(20) DEFAULT 'enrolled', -- 'enrolled', 'in_progress', 'completed', 'overdue'
    progress DECIMAL(5,2) DEFAULT 0,
    assigned_by UNIQUEIDENTIFIER REFERENCES core.Users(id),
    due_date DATE,
    started_at DATETIME2,
    completed_at DATETIME2,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_LearningPathEnrollments UNIQUE (staff_id, learning_path_id)
);

-- Course Notes
CREATE TABLE lms.CourseNotes (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    course_id UNIQUEIDENTIFIER NOT NULL REFERENCES lms.Courses(id),
    module_id UNIQUEIDENTIFIER REFERENCES lms.CourseModules(id),
    content_id UNIQUEIDENTIFIER REFERENCES lms.ModuleContent(id),
    note_text NVARCHAR(MAX) NOT NULL,
    timestamp_seconds INT, -- for video notes
    is_deleted BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Content Bookmarks
CREATE TABLE lms.ContentBookmarks (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    course_id UNIQUEIDENTIFIER NOT NULL REFERENCES lms.Courses(id),
    module_id UNIQUEIDENTIFIER REFERENCES lms.CourseModules(id),
    content_id UNIQUEIDENTIFIER NOT NULL REFERENCES lms.ModuleContent(id),
    label NVARCHAR(255),
    timestamp_seconds INT,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Course Reviews
CREATE TABLE lms.CourseReviews (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    course_id UNIQUEIDENTIFIER NOT NULL REFERENCES lms.Courses(id),
    rating DECIMAL(3,2) NOT NULL, -- 1.00-5.00
    title NVARCHAR(255),
    review_text NVARCHAR(MAX),
    helpful_count INT DEFAULT 0,
    verified BIT DEFAULT 0, -- completed the course
    is_deleted BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_CourseReviews UNIQUE (staff_id, course_id)
);

-- Learning Streaks
CREATE TABLE lms.LearningStreaks (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_activity_date DATE,
    daily_goal_minutes INT DEFAULT 30,
    weekly_goal_minutes INT DEFAULT 150,
    streak_freezes_available INT DEFAULT 2,
    streak_freezes_used INT DEFAULT 0,
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_LearningStreaks UNIQUE (tenant_id, staff_id)
);

-- Daily Learning Activity
CREATE TABLE lms.DailyActivity (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    activity_date DATE NOT NULL,
    minutes_learned INT DEFAULT 0,
    courses_completed INT DEFAULT 0,
    modules_completed INT DEFAULT 0,
    goal_met BIT DEFAULT 0,
    CONSTRAINT UQ_DailyActivity UNIQUE (tenant_id, staff_id, activity_date)
);

-- Achievements / Badges
CREATE TABLE lms.Achievements (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    icon NVARCHAR(100),
    achievement_type NVARCHAR(50), -- 'streak', 'completion', 'mastery', 'engagement', 'milestone'
    requirement_value INT, -- e.g., 7 for 7-day streak
    rarity NVARCHAR(20) DEFAULT 'common', -- 'common', 'rare', 'epic', 'legendary'
    points_value INT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Earned Achievements
CREATE TABLE lms.EarnedAchievements (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    achievement_id UNIQUEIDENTIFIER NOT NULL REFERENCES lms.Achievements(id),
    earned_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    progress INT DEFAULT 100, -- current progress toward achievement
    CONSTRAINT UQ_EarnedAchievements UNIQUE (staff_id, achievement_id)
);

-- ============================================================================
-- SECTION 6: TALENT SERVICE (Skills, Career, 9-Box, Succession)
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

-- Staff Skills
CREATE TABLE talent.StaffSkills (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    skill_id UNIQUEIDENTIFIER NOT NULL REFERENCES talent.Skills(id),
    current_level NVARCHAR(20) NOT NULL, -- 'none', 'beginner', 'intermediate', 'advanced', 'expert'
    target_level NVARCHAR(20),
    last_assessed_at DATETIME2,
    assessed_by UNIQUEIDENTIFIER REFERENCES core.Users(id),
    notes NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_StaffSkills UNIQUE (staff_id, skill_id)
);

-- Skill Certifications
CREATE TABLE talent.SkillCertifications (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    staff_skill_id UNIQUEIDENTIFIER NOT NULL REFERENCES talent.StaffSkills(id),
    certification_name NVARCHAR(255) NOT NULL,
    issuing_body NVARCHAR(255),
    issued_date DATE,
    expiry_date DATE,
    credential_url NVARCHAR(500),
    created_at DATETIME2 DEFAULT GETUTCDATE()
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

-- Career Levels
CREATE TABLE talent.CareerLevels (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    career_path_id UNIQUEIDENTIFIER NOT NULL REFERENCES talent.CareerPaths(id),
    title NVARCHAR(255) NOT NULL,
    level_number INT NOT NULL,
    required_experience_years DECIMAL(5,2) DEFAULT 0,
    salary_range_min DECIMAL(18,2),
    salary_range_max DECIMAL(18,2),
    description NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Career Level Required Skills
CREATE TABLE talent.CareerLevelSkills (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    career_level_id UNIQUEIDENTIFIER NOT NULL REFERENCES talent.CareerLevels(id),
    skill_id UNIQUEIDENTIFIER NOT NULL REFERENCES talent.Skills(id),
    min_level NVARCHAR(20) NOT NULL, -- 'beginner', 'intermediate', 'advanced', 'expert'
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_CareerLevelSkills UNIQUE (career_level_id, skill_id)
);

-- Staff Career Progress
CREATE TABLE talent.StaffCareerProgress (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    current_path_id UNIQUEIDENTIFIER NOT NULL REFERENCES talent.CareerPaths(id),
    current_level_id UNIQUEIDENTIFIER NOT NULL REFERENCES talent.CareerLevels(id),
    target_level_id UNIQUEIDENTIFIER REFERENCES talent.CareerLevels(id),
    readiness_percentage DECIMAL(5,2) DEFAULT 0,
    estimated_time_to_next_level NVARCHAR(50),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_StaffCareerProgress UNIQUE (tenant_id, staff_id)
);

-- 9-Box Talent Assessments
CREATE TABLE talent.TalentAssessments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    assessor_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    assessment_date DATE NOT NULL,
    performance_level NVARCHAR(10) NOT NULL, -- 'low', 'medium', 'high'
    potential_level NVARCHAR(10) NOT NULL, -- 'low', 'medium', 'high'
    performance_score DECIMAL(3,2), -- 1.00-5.00
    potential_score DECIMAL(3,2),
    notes NVARCHAR(MAX),
    development_recommendations NVARCHAR(MAX), -- JSON array
    flight_risk NVARCHAR(10) DEFAULT 'low', -- 'low', 'medium', 'high'
    readiness NVARCHAR(20) DEFAULT 'not_ready', -- 'ready_now', 'ready_1_year', 'ready_2_years', 'not_ready'
    is_current BIT DEFAULT 1, -- latest assessment
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Key Roles (for succession planning)
CREATE TABLE talent.KeyRoles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    title NVARCHAR(255) NOT NULL,
    department_id UNIQUEIDENTIFIER REFERENCES core.Departments(id),
    current_holder_id UNIQUEIDENTIFIER REFERENCES core.Users(id),
    criticality NVARCHAR(20) DEFAULT 'important', -- 'essential', 'important', 'standard'
    vacancy_risk NVARCHAR(20) DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
    impact_of_vacancy NVARCHAR(MAX),
    required_competencies NVARCHAR(MAX), -- JSON array
    last_reviewed_at DATETIME2,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Succession Candidates
CREATE TABLE talent.SuccessionCandidates (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    key_role_id UNIQUEIDENTIFIER NOT NULL REFERENCES talent.KeyRoles(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    readiness NVARCHAR(20) NOT NULL, -- 'ready_now', 'ready_1_2_years', 'ready_3_5_years', 'not_ready'
    overall_score DECIMAL(5,2), -- 0-100
    performance_score DECIMAL(5,2),
    potential_score DECIMAL(5,2),
    experience_score DECIMAL(5,2),
    mentor_id UNIQUEIDENTIFIER REFERENCES core.Users(id),
    notes NVARCHAR(MAX),
    added_at DATETIME2 DEFAULT GETUTCDATE(),
    last_assessed_at DATETIME2,
    CONSTRAINT UQ_SuccessionCandidates UNIQUE (key_role_id, staff_id)
);

-- Succession Competency Gaps
CREATE TABLE talent.SuccessionCompetencyGaps (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    candidate_id UNIQUEIDENTIFIER NOT NULL REFERENCES talent.SuccessionCandidates(id),
    competency NVARCHAR(255) NOT NULL,
    current_level DECIMAL(3,2), -- 1.00-5.00
    required_level DECIMAL(3,2),
    gap_value DECIMAL(3,2),
    development_priority NVARCHAR(10) DEFAULT 'medium', -- 'low', 'medium', 'high'
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Development Actions (for succession)
CREATE TABLE talent.DevelopmentActions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    candidate_id UNIQUEIDENTIFIER NOT NULL REFERENCES talent.SuccessionCandidates(id),
    title NVARCHAR(255) NOT NULL,
    action_type NVARCHAR(50), -- 'training', 'project', 'mentoring', 'stretch_assignment', 'external_course'
    description NVARCHAR(MAX),
    target_date DATE,
    completed_date DATE,
    status NVARCHAR(20) DEFAULT 'planned', -- 'planned', 'in_progress', 'completed', 'cancelled'
    linked_learning_path_id UNIQUEIDENTIFIER REFERENCES lms.LearningPaths(id),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- ============================================================================
-- SECTION 7: ENGAGEMENT SERVICE (Surveys, Wellbeing)
-- ============================================================================

-- Pulse Surveys
CREATE TABLE engagement.PulseSurveys (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    frequency NVARCHAR(20), -- 'weekly', 'bi_weekly', 'monthly', 'quarterly'
    status NVARCHAR(20) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
    target_audience NVARCHAR(20) DEFAULT 'all', -- 'all', 'department', 'team'
    anonymous_responses BIT DEFAULT 1,
    start_date DATE NOT NULL,
    end_date DATE,
    created_by UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    is_deleted BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Survey Target Groups
CREATE TABLE engagement.SurveyTargets (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    survey_id UNIQUEIDENTIFIER NOT NULL REFERENCES engagement.PulseSurveys(id),
    target_type NVARCHAR(20) NOT NULL, -- 'department', 'team', 'location'
    target_id UNIQUEIDENTIFIER NOT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Survey Questions
CREATE TABLE engagement.SurveyQuestions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    survey_id UNIQUEIDENTIFIER NOT NULL REFERENCES engagement.PulseSurveys(id),
    question_text NVARCHAR(MAX) NOT NULL,
    question_type NVARCHAR(20) NOT NULL, -- 'rating', 'enps', 'text', 'yes_no', 'multiple_choice'
    category NVARCHAR(50), -- 'engagement', 'satisfaction', 'culture', 'leadership', 'workload', 'growth'
    is_required BIT DEFAULT 1,
    options NVARCHAR(MAX), -- JSON for multiple choice options
    display_order INT NOT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Survey Responses
CREATE TABLE engagement.SurveyResponses (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    survey_id UNIQUEIDENTIFIER NOT NULL REFERENCES engagement.PulseSurveys(id),
    responder_id UNIQUEIDENTIFIER REFERENCES core.Users(id), -- NULL if anonymous
    submitted_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Survey Answer Values
CREATE TABLE engagement.SurveyAnswers (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    response_id UNIQUEIDENTIFIER NOT NULL REFERENCES engagement.SurveyResponses(id),
    question_id UNIQUEIDENTIFIER NOT NULL REFERENCES engagement.SurveyQuestions(id),
    answer_value NVARCHAR(MAX), -- text or number stored as string
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- eNPS Results (aggregated)
CREATE TABLE engagement.ENPSResults (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    survey_id UNIQUEIDENTIFIER REFERENCES engagement.PulseSurveys(id),
    period NVARCHAR(20) NOT NULL, -- 'Jan 2025', 'Q1 2025', etc.
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    score DECIMAL(5,2) NOT NULL, -- -100 to 100
    promoters_count INT DEFAULT 0,
    passives_count INT DEFAULT 0,
    detractors_count INT DEFAULT 0,
    total_responses INT DEFAULT 0,
    response_rate DECIMAL(5,2),
    previous_score DECIMAL(5,2),
    trend NVARCHAR(10), -- 'up', 'down', 'stable'
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Happiness Score Tracking
CREATE TABLE engagement.HappinessScores (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    score INT NOT NULL, -- 1-10
    month_year NVARCHAR(7) NOT NULL, -- '2025-01'
    notes NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_HappinessScores UNIQUE (staff_id, month_year)
);

-- Wellbeing Indicators
CREATE TABLE engagement.WellbeingIndicators (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    average_workday_length DECIMAL(4,2),
    consecutive_work_days INT DEFAULT 0,
    leave_balance DECIMAL(5,2),
    last_leave_date DATE,
    days_since_last_leave INT,
    missed_breaks INT DEFAULT 0,
    after_hours_messages INT DEFAULT 0,
    workload_score DECIMAL(3,2), -- 1.0-10.0
    engagement_score DECIMAL(3,2),
    risk_level NVARCHAR(20) DEFAULT 'low', -- 'low', 'moderate', 'high', 'critical'
    risk_factors NVARCHAR(MAX), -- JSON array
    recommendations NVARCHAR(MAX), -- JSON array
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Wellbeing Check-ins (employee self-reported)
CREATE TABLE engagement.WellbeingCheckIns (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    check_in_date DATE NOT NULL,
    energy_level INT, -- 1-5
    stress_level INT, -- 1-5
    work_life_balance INT, -- 1-5
    mood NVARCHAR(50),
    notes NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- ============================================================================
-- SECTION 8: COMPENSATION SERVICE
-- ============================================================================

-- Salary Bands
CREATE TABLE compensation.SalaryBands (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    level NVARCHAR(20) NOT NULL, -- 'entry', 'mid', 'senior', 'lead', 'principal', 'executive'
    title NVARCHAR(255) NOT NULL,
    min_salary DECIMAL(18,2) NOT NULL,
    mid_salary DECIMAL(18,2) NOT NULL,
    max_salary DECIMAL(18,2) NOT NULL,
    currency NVARCHAR(3) DEFAULT 'USD',
    department_id UNIQUEIDENTIFIER REFERENCES core.Departments(id),
    effective_date DATE NOT NULL,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Employee Compensation
CREATE TABLE compensation.EmployeeCompensation (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    salary_band_id UNIQUEIDENTIFIER REFERENCES compensation.SalaryBands(id),
    current_salary DECIMAL(18,2) NOT NULL,
    currency NVARCHAR(3) DEFAULT 'USD',
    compa_ratio DECIMAL(5,2), -- current / mid-point
    last_review_date DATE,
    last_increase_date DATE,
    last_increase_percent DECIMAL(5,2),
    bonus_target_percent DECIMAL(5,2),
    stock_options INT,
    effective_date DATE NOT NULL,
    is_current BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Merit Matrix
CREATE TABLE compensation.MeritMatrices (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    name NVARCHAR(255) NOT NULL,
    effective_year INT NOT NULL,
    total_budget_percent DECIMAL(5,2),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Merit Matrix Cells
CREATE TABLE compensation.MeritMatrixCells (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    matrix_id UNIQUEIDENTIFIER NOT NULL REFERENCES compensation.MeritMatrices(id),
    performance_rating INT NOT NULL, -- 1-5
    compa_ratio_range NVARCHAR(10) NOT NULL, -- 'below', 'at', 'above'
    recommended_increase DECIMAL(5,2) NOT NULL,
    min_increase DECIMAL(5,2),
    max_increase DECIMAL(5,2),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Merit Recommendations
CREATE TABLE compensation.MeritRecommendations (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    cycle_year INT NOT NULL,
    review_id UNIQUEIDENTIFIER REFERENCES reviews.PerformanceReviews(id),
    performance_rating DECIMAL(3,2),
    current_salary DECIMAL(18,2) NOT NULL,
    current_compa_ratio DECIMAL(5,2),
    recommended_increase_percent DECIMAL(5,2),
    recommended_new_salary DECIMAL(18,2),
    manager_adjusted_percent DECIMAL(5,2),
    manager_adjusted_salary DECIMAL(18,2),
    justification NVARCHAR(MAX),
    status NVARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'processed'
    approved_by UNIQUEIDENTIFIER REFERENCES core.Users(id),
    approved_at DATETIME2,
    effective_date DATE,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Bonus Calculations
CREATE TABLE compensation.BonusCalculations (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    bonus_type NVARCHAR(20) NOT NULL, -- 'annual', 'quarterly', 'spot', 'retention', 'signing'
    cycle_year INT NOT NULL,
    cycle_period NVARCHAR(10), -- 'Q1', 'Q2', etc.
    target_percent DECIMAL(5,2),
    performance_multiplier DECIMAL(4,2), -- 0.00-2.00
    company_multiplier DECIMAL(4,2),
    individual_multiplier DECIMAL(4,2),
    calculated_amount DECIMAL(18,2),
    final_amount DECIMAL(18,2),
    status NVARCHAR(20) DEFAULT 'draft', -- 'draft', 'pending_approval', 'approved', 'paid'
    approved_by UNIQUEIDENTIFIER REFERENCES core.Users(id),
    paid_date DATE,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- ============================================================================
-- SECTION 9: PERFORMANCE PLANS SERVICE
-- ============================================================================

-- Performance Plan Templates
CREATE TABLE plans.PlanTemplates (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    plan_type NVARCHAR(30) NOT NULL, -- 'onboarding', 'probation', 'annual_development', 'performance_improvement', 'leadership_development', 'skill_development', 'succession', 'custom'
    industry NVARCHAR(100),
    duration_days INT NOT NULL,
    is_system BIT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_by UNIQUEIDENTIFIER REFERENCES core.Users(id),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Template Tags
CREATE TABLE plans.PlanTemplateTags (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    template_id UNIQUEIDENTIFIER NOT NULL REFERENCES plans.PlanTemplates(id),
    tag NVARCHAR(100) NOT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Template Goal Items
CREATE TABLE plans.PlanTemplateGoals (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    template_id UNIQUEIDENTIFIER NOT NULL REFERENCES plans.PlanTemplates(id),
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    category NVARCHAR(100),
    priority NVARCHAR(20) DEFAULT 'medium',
    target_days_from_start INT NOT NULL,
    display_order INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Template Goal Milestones
CREATE TABLE plans.PlanTemplateGoalMilestones (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    template_goal_id UNIQUEIDENTIFIER NOT NULL REFERENCES plans.PlanTemplateGoals(id),
    title NVARCHAR(255) NOT NULL,
    days_from_start INT NOT NULL,
    display_order INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Template Review Items
CREATE TABLE plans.PlanTemplateReviews (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    template_id UNIQUEIDENTIFIER NOT NULL REFERENCES plans.PlanTemplates(id),
    title NVARCHAR(255) NOT NULL,
    review_cycle NVARCHAR(20), -- 'monthly', 'quarterly', 'semi_annual', 'annual'
    days_from_start INT NOT NULL,
    custom_criteria NVARCHAR(MAX), -- JSON
    display_order INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Template Conversation Items
CREATE TABLE plans.PlanTemplateConversations (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    template_id UNIQUEIDENTIFIER NOT NULL REFERENCES plans.PlanTemplates(id),
    title NVARCHAR(255) NOT NULL,
    conversation_type NVARCHAR(20), -- 'one_on_one', 'check_in', 'coaching', 'feedback', 'career'
    days_from_start INT NOT NULL,
    duration_minutes INT DEFAULT 30,
    agenda_items NVARCHAR(MAX), -- JSON array
    display_order INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Template Linked Learning
CREATE TABLE plans.PlanTemplateLearning (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    template_id UNIQUEIDENTIFIER NOT NULL REFERENCES plans.PlanTemplates(id),
    learning_path_id UNIQUEIDENTIFIER REFERENCES lms.LearningPaths(id),
    course_id UNIQUEIDENTIFIER REFERENCES lms.Courses(id),
    is_required BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Assigned Plans
CREATE TABLE plans.AssignedPlans (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    template_id UNIQUEIDENTIFIER NOT NULL REFERENCES plans.PlanTemplates(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    assigned_by UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    plan_type NVARCHAR(30) NOT NULL,
    status NVARCHAR(20) DEFAULT 'draft', -- 'draft', 'active', 'completed', 'cancelled', 'on_hold'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    notes NVARCHAR(MAX),
    progress DECIMAL(5,2) DEFAULT 0,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Plan Linked Goals
CREATE TABLE plans.PlanGoals (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    plan_id UNIQUEIDENTIFIER NOT NULL REFERENCES plans.AssignedPlans(id),
    goal_id UNIQUEIDENTIFIER NOT NULL REFERENCES goals.Goals(id),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Plan Linked Reviews
CREATE TABLE plans.PlanReviews (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    plan_id UNIQUEIDENTIFIER NOT NULL REFERENCES plans.AssignedPlans(id),
    review_id UNIQUEIDENTIFIER NOT NULL REFERENCES reviews.PerformanceReviews(id),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Plan Linked Conversations
CREATE TABLE plans.PlanConversations (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    plan_id UNIQUEIDENTIFIER NOT NULL REFERENCES plans.AssignedPlans(id),
    conversation_id UNIQUEIDENTIFIER NOT NULL, -- FK to conversations table
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Plan Linked Learning
CREATE TABLE plans.PlanLearning (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    plan_id UNIQUEIDENTIFIER NOT NULL REFERENCES plans.AssignedPlans(id),
    learning_path_id UNIQUEIDENTIFIER REFERENCES lms.LearningPaths(id),
    course_id UNIQUEIDENTIFIER REFERENCES lms.Courses(id),
    enrollment_id UNIQUEIDENTIFIER REFERENCES lms.Enrollments(id),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- ============================================================================
-- SECTION 10: PIP (Performance Improvement Plans)
-- ============================================================================

CREATE TABLE pip.PerformanceImprovementPlans (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    manager_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    hr_partner_id UNIQUEIDENTIFIER REFERENCES core.Users(id),
    status NVARCHAR(30) DEFAULT 'draft', -- 'draft', 'active', 'extended', 'completed_success', 'completed_failure', 'cancelled'
    reason NVARCHAR(MAX) NOT NULL,
    performance_gaps NVARCHAR(MAX), -- JSON array
    expected_outcomes NVARCHAR(MAX), -- JSON array
    support_provided NVARCHAR(MAX), -- JSON array
    start_date DATE NOT NULL,
    original_end_date DATE NOT NULL,
    current_end_date DATE NOT NULL,
    extension_count INT DEFAULT 0,
    outcome NVARCHAR(20), -- 'improved', 'extended', 'terminated', 'resigned', 'pending'
    outcome_date DATE,
    outcome_notes NVARCHAR(MAX),
    is_deleted BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- PIP Milestones
CREATE TABLE pip.PIPMilestones (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    pip_id UNIQUEIDENTIFIER NOT NULL REFERENCES pip.PerformanceImprovementPlans(id),
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    target_date DATE NOT NULL,
    completed_date DATE,
    status NVARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'missed'
    evidence NVARCHAR(MAX),
    manager_notes NVARCHAR(MAX),
    display_order INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- PIP Check-ins
CREATE TABLE pip.PIPCheckIns (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    pip_id UNIQUEIDENTIFIER NOT NULL REFERENCES pip.PerformanceImprovementPlans(id),
    scheduled_date DATE NOT NULL,
    completed_date DATE,
    notes NVARCHAR(MAX),
    progress_rating INT, -- 1-5
    concerns NVARCHAR(MAX),
    next_steps NVARCHAR(MAX),
    created_by UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- PIP Check-in Attendees
CREATE TABLE pip.PIPCheckInAttendees (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    check_in_id UNIQUEIDENTIFIER NOT NULL REFERENCES pip.PIPCheckIns(id),
    user_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- PIP Documents
CREATE TABLE pip.PIPDocuments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    pip_id UNIQUEIDENTIFIER NOT NULL REFERENCES pip.PerformanceImprovementPlans(id),
    document_type NVARCHAR(30) NOT NULL, -- 'initial_notice', 'extension', 'check_in_notes', 'outcome_letter', 'supporting_evidence'
    title NVARCHAR(255) NOT NULL,
    file_url NVARCHAR(500),
    notes NVARCHAR(MAX),
    uploaded_by UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    uploaded_at DATETIME2 DEFAULT GETUTCDATE()
);

-- ============================================================================
-- SECTION 11: CONVERSATIONS / 1:1 MEETINGS
-- ============================================================================

CREATE TABLE activities.Conversations (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    manager_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    conversation_type NVARCHAR(20) NOT NULL, -- 'one_on_one', 'check_in', 'coaching', 'feedback', 'career'
    title NVARCHAR(255) NOT NULL,
    scheduled_date DATETIME2 NOT NULL,
    duration_minutes INT DEFAULT 30,
    meeting_link NVARCHAR(500), -- Zoom/Teams/Meet link
    meeting_platform NVARCHAR(20), -- 'zoom', 'teams', 'meet'
    completed BIT DEFAULT 0,
    next_meeting_date DATETIME2,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Conversation Notes
CREATE TABLE activities.ConversationNotes (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    conversation_id UNIQUEIDENTIFIER NOT NULL REFERENCES activities.Conversations(id),
    content NVARCHAR(MAX) NOT NULL,
    created_by UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Conversation Action Items
CREATE TABLE activities.ConversationActionItems (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    conversation_id UNIQUEIDENTIFIER NOT NULL REFERENCES activities.Conversations(id),
    title NVARCHAR(500) NOT NULL,
    assignee_id UNIQUEIDENTIFIER REFERENCES core.Users(id),
    due_date DATE,
    completed BIT DEFAULT 0,
    completed_at DATETIME2,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- ============================================================================
-- SECTION 12: TASKS SERVICE
-- ============================================================================

-- Task Pipelines
CREATE TABLE tasks.Pipelines (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    is_default BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Pipeline Stages
CREATE TABLE tasks.PipelineStages (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    pipeline_id UNIQUEIDENTIFIER NOT NULL REFERENCES tasks.Pipelines(id),
    name NVARCHAR(100) NOT NULL,
    color NVARCHAR(20),
    display_order INT NOT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Custom Task Types
CREATE TABLE tasks.CustomTaskTypes (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    label NVARCHAR(100) NOT NULL,
    color NVARCHAR(20),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Performance Tasks
CREATE TABLE tasks.PerformanceTasks (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    title NVARCHAR(500) NOT NULL,
    description NVARCHAR(MAX),
    task_type NVARCHAR(50) NOT NULL, -- 'goal_action', 'review_followup', 'development_task', 'coaching_task', 'pip_action', 'training_task', or custom
    status NVARCHAR(20) DEFAULT 'open', -- 'open', 'in_progress', 'blocked', 'completed', 'cancelled'
    priority NVARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    pipeline_id UNIQUEIDENTIFIER REFERENCES tasks.Pipelines(id),
    stage_id UNIQUEIDENTIFIER REFERENCES tasks.PipelineStages(id),
    assignee_id UNIQUEIDENTIFIER REFERENCES core.Users(id),
    created_for_id UNIQUEIDENTIFIER REFERENCES core.Users(id), -- the employee this task is about
    due_date DATE,
    -- Linked items
    linked_goal_id UNIQUEIDENTIFIER REFERENCES goals.Goals(id),
    linked_review_id UNIQUEIDENTIFIER REFERENCES reviews.PerformanceReviews(id),
    linked_plan_id UNIQUEIDENTIFIER REFERENCES plans.AssignedPlans(id),
    linked_conversation_id UNIQUEIDENTIFIER REFERENCES activities.Conversations(id),
    completed_at DATETIME2,
    created_by UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    is_deleted BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Task Comments
CREATE TABLE tasks.TaskComments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    task_id UNIQUEIDENTIFIER NOT NULL REFERENCES tasks.PerformanceTasks(id),
    user_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    comment_text NVARCHAR(MAX) NOT NULL,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Task Attachments
CREATE TABLE tasks.TaskAttachments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    task_id UNIQUEIDENTIFIER NOT NULL REFERENCES tasks.PerformanceTasks(id),
    file_name NVARCHAR(255) NOT NULL,
    file_url NVARCHAR(500) NOT NULL,
    file_type NVARCHAR(100),
    file_size INT,
    uploaded_by UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    uploaded_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Task Activity Log
CREATE TABLE tasks.TaskActivityLog (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    task_id UNIQUEIDENTIFIER NOT NULL REFERENCES tasks.PerformanceTasks(id),
    activity_type NVARCHAR(30) NOT NULL, -- 'status_change', 'assignment_change', 'priority_change', 'comment_added', 'attachment_added', 'edit', 'created', 'pipeline_change'
    description NVARCHAR(MAX),
    old_value NVARCHAR(500),
    new_value NVARCHAR(500),
    field_name NVARCHAR(100),
    user_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- ============================================================================
-- SECTION 13: MENTORSHIP
-- ============================================================================

-- Mentor Profiles
CREATE TABLE mentorship.MentorProfiles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    skills NVARCHAR(MAX), -- JSON array
    interests NVARCHAR(MAX), -- JSON array
    career_goals NVARCHAR(MAX), -- JSON array
    years_experience DECIMAL(5,2),
    max_mentees INT DEFAULT 3,
    current_mentees INT DEFAULT 0,
    availability NVARCHAR(10) DEFAULT 'medium', -- 'high', 'medium', 'low'
    preferred_meeting_frequency NVARCHAR(20) DEFAULT 'biweekly', -- 'weekly', 'biweekly', 'monthly'
    bio NVARCHAR(MAX),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_MentorProfiles UNIQUE (tenant_id, staff_id)
);

-- Mentee Profiles
CREATE TABLE mentorship.MenteeProfiles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    desired_skills NVARCHAR(MAX), -- JSON array
    interests NVARCHAR(MAX), -- JSON array
    career_goals NVARCHAR(MAX), -- JSON array
    development_areas NVARCHAR(MAX), -- JSON array
    preferred_meeting_frequency NVARCHAR(20) DEFAULT 'biweekly',
    bio NVARCHAR(MAX),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_MenteeProfiles UNIQUE (tenant_id, staff_id)
);

-- Mentorship Matches
CREATE TABLE mentorship.MentorshipMatches (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    mentor_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    mentee_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    status NVARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'completed', 'cancelled'
    match_score INT, -- 0-100
    match_reasons NVARCHAR(MAX), -- JSON array
    start_date DATE,
    end_date DATE,
    goals NVARCHAR(MAX), -- JSON array
    meeting_count INT DEFAULT 0,
    last_meeting_date DATE,
    notes NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Mentorship Meetings
CREATE TABLE mentorship.MentorshipMeetings (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    match_id UNIQUEIDENTIFIER NOT NULL REFERENCES mentorship.MentorshipMatches(id),
    scheduled_date DATETIME2 NOT NULL,
    completed_date DATETIME2,
    duration_minutes INT,
    topics NVARCHAR(MAX), -- JSON array
    action_items NVARCHAR(MAX), -- JSON array
    notes NVARCHAR(MAX),
    status NVARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'rescheduled'
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- ============================================================================
-- SECTION 14: DEVELOPMENT BUDGET
-- ============================================================================

-- Development Budgets (per employee per year)
CREATE TABLE budget.DevelopmentBudgets (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    fiscal_year INT NOT NULL,
    total_budget DECIMAL(18,2) NOT NULL,
    used_budget DECIMAL(18,2) DEFAULT 0,
    pending_budget DECIMAL(18,2) DEFAULT 0,
    currency NVARCHAR(3) DEFAULT 'USD',
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_DevelopmentBudgets UNIQUE (tenant_id, staff_id, fiscal_year)
);

-- Budget Requests
CREATE TABLE budget.BudgetRequests (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    budget_id UNIQUEIDENTIFIER NOT NULL REFERENCES budget.DevelopmentBudgets(id),
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    category NVARCHAR(30) NOT NULL, -- 'training', 'conference', 'certification', 'books', 'tools', 'coaching', 'other'
    amount DECIMAL(18,2) NOT NULL,
    currency NVARCHAR(3) DEFAULT 'USD',
    vendor NVARCHAR(255),
    event_date DATE,
    event_location NVARCHAR(255),
    justification NVARCHAR(MAX),
    expected_outcomes NVARCHAR(MAX), -- JSON array
    status NVARCHAR(20) DEFAULT 'draft', -- 'draft', 'pending_approval', 'approved', 'rejected', 'completed', 'cancelled'
    submitted_at DATETIME2,
    reviewed_by UNIQUEIDENTIFIER REFERENCES core.Users(id),
    reviewed_at DATETIME2,
    approval_notes NVARCHAR(MAX),
    rejection_reason NVARCHAR(MAX),
    receipt_url NVARCHAR(500),
    completed_at DATETIME2,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Budget Approvers
CREATE TABLE budget.BudgetApprovers (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    max_approval_amount DECIMAL(18,2) NOT NULL,
    department_id UNIQUEIDENTIFIER REFERENCES core.Departments(id), -- NULL = all departments
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- ============================================================================
-- SECTION 15: AUDIT & NOTIFICATIONS
-- ============================================================================

-- Audit Log (system-wide)
CREATE TABLE audit.AuditLog (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    user_id UNIQUEIDENTIFIER,
    action NVARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'login', 'export', etc.
    entity_type NVARCHAR(100) NOT NULL, -- Table name
    entity_id UNIQUEIDENTIFIER,
    old_values NVARCHAR(MAX), -- JSON
    new_values NVARCHAR(MAX), -- JSON
    ip_address NVARCHAR(50),
    user_agent NVARCHAR(500),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Notifications
CREATE TABLE notifications.Notifications (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    user_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    notification_type NVARCHAR(50) NOT NULL, -- 'review_due', 'goal_reminder', 'feedback_received', 'survey_invite', etc.
    title NVARCHAR(255) NOT NULL,
    message NVARCHAR(MAX),
    action_url NVARCHAR(500),
    reference_type NVARCHAR(50), -- Entity type
    reference_id UNIQUEIDENTIFIER,
    is_read BIT DEFAULT 0,
    read_at DATETIME2,
    is_email_sent BIT DEFAULT 0,
    email_sent_at DATETIME2,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Notification Preferences
CREATE TABLE notifications.NotificationPreferences (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Tenants(id),
    user_id UNIQUEIDENTIFIER NOT NULL REFERENCES core.Users(id),
    notification_type NVARCHAR(50) NOT NULL,
    in_app_enabled BIT DEFAULT 1,
    email_enabled BIT DEFAULT 1,
    frequency NVARCHAR(20) DEFAULT 'immediate', -- 'immediate', 'daily_digest', 'weekly_digest'
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_NotificationPreferences UNIQUE (user_id, notification_type)
);

-- ============================================================================
-- SECTION 16: INDEXES FOR PERFORMANCE
-- ============================================================================

-- Core indexes
CREATE INDEX IX_Users_TenantId ON core.Users(tenant_id);
CREATE INDEX IX_Users_ManagerId ON core.Users(manager_id);
CREATE INDEX IX_Users_DepartmentId ON core.Users(department_id);
CREATE INDEX IX_Users_Email ON core.Users(email);
CREATE INDEX IX_Departments_TenantId ON core.Departments(tenant_id);
CREATE INDEX IX_Teams_TenantId ON core.Teams(tenant_id);

-- Goals indexes
CREATE INDEX IX_Goals_TenantStaff ON goals.Goals(tenant_id, staff_id);
CREATE INDEX IX_Goals_Status ON goals.Goals(tenant_id, status);
CREATE INDEX IX_Objectives_TenantCycle ON goals.Objectives(tenant_id, cycle_id);
CREATE INDEX IX_KeyResults_ObjectiveId ON goals.KeyResults(objective_id);

-- Reviews indexes
CREATE INDEX IX_PerformanceReviews_TenantStaff ON reviews.PerformanceReviews(tenant_id, staff_id);
CREATE INDEX IX_PerformanceReviews_Status ON reviews.PerformanceReviews(tenant_id, status);
CREATE INDEX IX_PerformanceReviews_CycleId ON reviews.PerformanceReviews(cycle_id);

-- Feedback indexes
CREATE INDEX IX_Feedback360Requests_SubjectStaff ON feedback.Feedback360Requests(tenant_id, subject_staff_id);
CREATE INDEX IX_PraisePosts_ToStaff ON feedback.PraisePosts(tenant_id, to_staff_id);
CREATE INDEX IX_RecognitionPoints_UserId ON feedback.RecognitionPointsLedger(tenant_id, user_id);

-- LMS indexes
CREATE INDEX IX_Courses_TenantStatus ON lms.Courses(tenant_id, status);
CREATE INDEX IX_Enrollments_TenantStaff ON lms.Enrollments(tenant_id, staff_id);
CREATE INDEX IX_Enrollments_CourseStatus ON lms.Enrollments(course_id, status);
CREATE INDEX IX_LearningPathEnrollments_Staff ON lms.LearningPathEnrollments(tenant_id, staff_id);

-- Talent indexes
CREATE INDEX IX_StaffSkills_Staff ON talent.StaffSkills(tenant_id, staff_id);
CREATE INDEX IX_TalentAssessments_Staff ON talent.TalentAssessments(tenant_id, staff_id);
CREATE INDEX IX_SuccessionCandidates_KeyRole ON talent.SuccessionCandidates(key_role_id);

-- Engagement indexes
CREATE INDEX IX_SurveyResponses_SurveyId ON engagement.SurveyResponses(survey_id);
CREATE INDEX IX_WellbeingIndicators_Staff ON engagement.WellbeingIndicators(tenant_id, staff_id);

-- Plans indexes
CREATE INDEX IX_AssignedPlans_TenantStaff ON plans.AssignedPlans(tenant_id, staff_id);
CREATE INDEX IX_AssignedPlans_Status ON plans.AssignedPlans(tenant_id, status);

-- Tasks indexes
CREATE INDEX IX_PerformanceTasks_TenantAssignee ON tasks.PerformanceTasks(tenant_id, assignee_id);
CREATE INDEX IX_PerformanceTasks_Status ON tasks.PerformanceTasks(tenant_id, status);
CREATE INDEX IX_PerformanceTasks_Pipeline ON tasks.PerformanceTasks(pipeline_id, stage_id);

-- Audit indexes
CREATE INDEX IX_AuditLog_TenantEntity ON audit.AuditLog(tenant_id, entity_type, entity_id);
CREATE INDEX IX_AuditLog_CreatedAt ON audit.AuditLog(created_at DESC);

-- Notification indexes
CREATE INDEX IX_Notifications_UserUnread ON notifications.Notifications(user_id, is_read);
CREATE INDEX IX_Notifications_CreatedAt ON notifications.Notifications(created_at DESC);

-- ============================================================================
-- SECTION 17: ROW-LEVEL SECURITY POLICIES (Conceptual - implement per tenant isolation)
-- ============================================================================
/*
NOTE: MS SQL Server doesn't have built-in RLS like PostgreSQL, but you can implement
tenant isolation using:

1. Security Policies with Predicates (SQL Server 2016+):

-- Create a function to get current tenant
CREATE FUNCTION security.fn_tenant_filter(@tenant_id UNIQUEIDENTIFIER)
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN SELECT 1 AS fn_result 
WHERE @tenant_id = CAST(SESSION_CONTEXT(N'TenantId') AS UNIQUEIDENTIFIER);

-- Create security policy
CREATE SECURITY POLICY core.TenantPolicy
ADD FILTER PREDICATE security.fn_tenant_filter(tenant_id) ON core.Users,
ADD BLOCK PREDICATE security.fn_tenant_filter(tenant_id) ON core.Users AFTER INSERT
WITH (STATE = ON);

2. Application-level enforcement:
   - Always include tenant_id in WHERE clauses
   - Use stored procedures that enforce tenant isolation
   - Implement middleware that validates tenant context

3. Connection-level isolation:
   - Set session context on connection: EXEC sp_set_session_context @key = N'TenantId', @value = @TenantId;
   - All queries automatically filtered by tenant
*/

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

PRINT 'Performance Module Database Schema created successfully.';
PRINT 'Remember to:';
PRINT '1. Create schemas: core, goals, reviews, feedback, lms, talent, engagement, compensation, plans, pip, activities, tasks, mentorship, budget, audit, notifications';
PRINT '2. Implement Row-Level Security policies for tenant isolation';
PRINT '3. Set up appropriate database maintenance plans';
PRINT '4. Configure backup and disaster recovery';
PRINT '5. Add additional indexes based on query patterns';
