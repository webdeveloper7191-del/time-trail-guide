import React from 'react';
import { Calendar, Users, Clock, MapPin, Shield, AlertTriangle, Bell, Layers, Building, UserCheck } from 'lucide-react';

export interface ERDSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  tableCount: number;
  diagram: string;
}

// Roster Module ERD Sections
export const rosterErdSections: ERDSection[] = [
  {
    id: 'roster-architecture',
    title: 'Roster Architecture',
    icon: React.createElement(Layers, { className: "h-4 w-4" }),
    description: 'High-level overview of workforce scheduling system',
    tableCount: 0,
    diagram: `graph TB
    subgraph "Roster & Scheduling Platform"
        CORE[🔵 Core Service<br/>Centres, Rooms, Staff Profiles]
        
        subgraph "Scheduling Domain"
            SHIFTS[📅 Shifts Service<br/>Shifts, Open Shifts, Templates]
            RECUR[🔄 Recurring Service<br/>Patterns, Series, Auto-Generation]
            AVAIL[⏰ Availability Service<br/>Staff Availability, Preferences]
        end
        
        subgraph "Compliance Domain"
            RATIO[👶 Ratio Compliance<br/>NQF Ratios, Room Capacity]
            FATIGUE[😴 Fatigue Management<br/>Rest Rules, Consecutive Days]
            QUALS[🎓 Qualifications<br/>Certifications, Expiry Tracking]
        end
        
        subgraph "Operations Domain"
            CLOCK[📍 Time & Attendance<br/>Clock In/Out, GPS Validation]
            BREAKS[☕ Break Scheduling<br/>Meal/Rest Breaks, Coverage]
            LEAVE[🏖️ Leave Management<br/>Time Off, Approvals]
        end
        
        subgraph "Intelligence Domain"
            SOLVER[🤖 AI Solver<br/>Timefold Constraints, Optimization]
            DEMAND[📊 Demand Forecasting<br/>Weather, Events, Capacity]
            COST[💰 Cost Analysis<br/>Budget, Overtime, Agency]
        end
        
        NOTIFY[🔔 Notifications<br/>Publish, Swap Requests]
    end
    
    CORE --> SHIFTS
    CORE --> AVAIL
    SHIFTS --> RECUR
    SHIFTS --> RATIO
    SHIFTS --> FATIGUE
    AVAIL --> QUALS
    SHIFTS --> CLOCK
    SHIFTS --> BREAKS
    AVAIL --> LEAVE
    SHIFTS --> SOLVER
    SOLVER --> DEMAND
    SHIFTS --> COST
    SHIFTS --> NOTIFY`,
  },
  {
    id: 'roster-core',
    title: 'Centres & Rooms',
    icon: React.createElement(Building, { className: "h-4 w-4" }),
    description: 'Childcare centres, rooms, age groups, capacity settings',
    tableCount: 6,
    diagram: `erDiagram
    Tenants ||--o{ Centres : has
    Centres ||--o{ Rooms : contains
    Centres ||--o{ CentreOperatingHours : has
    Centres ||--o{ GeofenceZones : has
    
    Rooms ||--o{ RoomRatioRules : has
    Rooms ||--o{ RoomCapacitySchedule : has
    
    Tenants {
        uuid id PK
        string name
        string subdomain UK
        string timezone
        string country_code
        boolean is_active
    }
    
    Centres {
        uuid id PK
        uuid tenant_id FK
        string name
        string code UK
        string address
        string suburb
        string state
        string postcode
        decimal latitude
        decimal longitude
        string phone
        string email
        boolean is_active
        datetime created_at
    }
    
    CentreOperatingHours {
        uuid id PK
        uuid centre_id FK
        int day_of_week
        time open_time
        time close_time
        boolean is_closed
    }
    
    Rooms {
        uuid id PK
        uuid centre_id FK
        string name
        string code
        string age_group
        int capacity
        int min_age_months
        int max_age_months
        decimal required_ratio
        int min_qualified_staff
        string color
        int display_order
        boolean is_active
    }
    
    RoomRatioRules {
        uuid id PK
        uuid room_id FK
        string age_group
        decimal children_per_educator
        int min_educators
        boolean requires_qualified
        string regulation_reference
    }
    
    GeofenceZones {
        uuid id PK
        uuid centre_id FK
        string name
        decimal latitude
        decimal longitude
        int radius_meters
        int allowed_buffer_meters
        boolean is_active
    }`,
  },
  {
    id: 'roster-staff',
    title: 'Staff Management',
    icon: React.createElement(Users, { className: "h-4 w-4" }),
    description: 'Staff profiles, employment details, qualifications',
    tableCount: 9,
    diagram: `erDiagram
    Staff ||--o{ StaffQualifications : has
    Staff ||--o{ StaffAvailability : has
    Staff ||--o{ StaffPreferredCentres : prefers
    Staff ||--o{ StaffSchedulingPreferences : has
    Staff ||--o{ StaffPayRates : has
    Staff ||--o{ StaffAgencyDetails : "agency info"
    
    QualificationTypes ||--o{ StaffQualifications : "qualified as"
    
    Staff {
        uuid id PK
        uuid tenant_id FK
        string employee_id UK
        string first_name
        string last_name
        string email UK
        string phone
        string avatar_url
        string role
        string employment_type
        string agency_type
        uuid default_centre_id FK
        decimal hourly_rate
        decimal overtime_rate
        int max_hours_per_week
        boolean is_active
        datetime created_at
    }
    
    QualificationTypes {
        uuid id PK
        uuid tenant_id FK
        string code UK
        string name
        string category
        boolean requires_expiry
        int renewal_period_months
        boolean is_mandatory
    }
    
    StaffQualifications {
        uuid id PK
        uuid staff_id FK
        uuid qualification_type_id FK
        string certificate_number
        date issue_date
        date expiry_date
        string status
        string document_url
        datetime verified_at
        uuid verified_by FK
    }
    
    StaffAvailability {
        uuid id PK
        uuid staff_id FK
        int day_of_week
        boolean is_available
        time start_time
        time end_time
        int week_pattern
        date anchor_date
    }
    
    StaffSchedulingPreferences {
        uuid id PK
        uuid staff_id FK
        string preferred_rooms
        string avoid_rooms
        int max_consecutive_days
        int min_rest_hours
        boolean prefer_early_shifts
        boolean prefer_late_shifts
        int max_shifts_per_week
        boolean willing_multi_location
        int max_travel_distance_km
    }
    
    StaffPayRates {
        uuid id PK
        uuid staff_id FK
        string rate_type
        decimal rate_value
        string rate_unit
        date effective_from
        date effective_to
        boolean is_current
    }`,
  },
  {
    id: 'roster-shifts',
    title: 'Shifts & Templates',
    icon: React.createElement(Calendar, { className: "h-4 w-4" }),
    description: 'Shift assignments, open shifts, shift templates',
    tableCount: 8,
    diagram: `erDiagram
    Shifts ||--o| Staff : "assigned to"
    Shifts ||--o| Rooms : "in room"
    Shifts ||--o| ShiftTemplates : "from template"
    Shifts ||--o{ ShiftBreaks : has
    Shifts ||--o{ ShiftNotes : has
    Shifts ||--o| RecurringPatterns : "part of series"
    
    OpenShifts ||--o{ OpenShiftApplicants : has
    
    ShiftTemplates ||--o{ TemplateAllowances : includes
    
    Shifts {
        uuid id PK
        uuid tenant_id FK
        uuid centre_id FK
        uuid room_id FK
        uuid staff_id FK
        date shift_date
        time start_time
        time end_time
        int break_minutes
        string status
        string shift_type
        boolean is_open_shift
        boolean is_ai_generated
        datetime ai_generated_at
        uuid recurrence_group_id FK
        boolean is_absent
        string absence_reason
        uuid replacement_staff_id FK
        datetime created_at
        datetime updated_at
    }
    
    OpenShifts {
        uuid id PK
        uuid tenant_id FK
        uuid centre_id FK
        uuid room_id FK
        date shift_date
        time start_time
        time end_time
        int break_minutes
        string urgency
        string required_qualifications
        string minimum_classification
        string preferred_role
        string notes
        datetime created_at
    }
    
    OpenShiftApplicants {
        uuid id PK
        uuid open_shift_id FK
        uuid staff_id FK
        datetime applied_at
        string status
        string notes
    }
    
    ShiftTemplates {
        uuid id PK
        uuid tenant_id FK
        string name
        time start_time
        time end_time
        int break_minutes
        string color
        string shift_type
        string required_qualifications
        string minimum_classification
        string preferred_role
        boolean is_active
    }
    
    ShiftBreaks {
        uuid id PK
        uuid shift_id FK
        string break_type
        time scheduled_start
        time scheduled_end
        time actual_start
        time actual_end
        int duration_minutes
        boolean is_paid
        string status
    }`,
  },
  {
    id: 'roster-recurring',
    title: 'Recurring Patterns',
    icon: React.createElement(Clock, { className: "h-4 w-4" }),
    description: 'Recurring shift patterns, series management, auto-generation',
    tableCount: 5,
    diagram: `erDiagram
    RecurringPatterns ||--o{ RecurringPatternDays : has
    RecurringPatterns ||--o{ GeneratedShifts : generates
    RecurringPatterns ||--o| Staff : "assigned to"
    RecurringPatterns ||--o| Rooms : "in room"
    
    RecurringPatternNotifications ||--o| RecurringPatterns : tracks
    
    RecurringPatterns {
        uuid id PK
        uuid tenant_id FK
        uuid centre_id FK
        uuid room_id FK
        string name
        string description
        string recurrence_type
        date start_date
        date end_date
        string end_type
        int end_after_occurrences
        int week_interval
        int month_day
        time shift_start_time
        time shift_end_time
        int break_minutes
        string role_id
        uuid assigned_staff_id FK
        string required_qualifications
        boolean is_active
        datetime created_at
        uuid created_by FK
    }
    
    RecurringPatternDays {
        uuid id PK
        uuid pattern_id FK
        int day_of_week
    }
    
    GeneratedShifts {
        uuid id PK
        uuid pattern_id FK
        uuid shift_id FK
        date generated_date
        string status
        string modification_notes
    }
    
    RecurringPatternNotifications {
        uuid id PK
        uuid pattern_id FK
        string notification_type
        date trigger_date
        boolean is_sent
        datetime sent_at
    }`,
  },
  {
    id: 'roster-templates',
    title: 'Roster Templates',
    icon: React.createElement(Calendar, { className: "h-4 w-4" }),
    description: 'Weekly roster templates, bulk assignment, template application',
    tableCount: 4,
    diagram: `erDiagram
    RosterTemplates ||--o{ RosterTemplateShifts : contains
    RosterTemplates ||--o{ TemplateApplicationLogs : "applied via"
    
    RosterTemplateShifts ||--o| Rooms : "for room"
    RosterTemplateShifts ||--o| ShiftTemplates : "uses template"
    
    RosterTemplates {
        uuid id PK
        uuid tenant_id FK
        uuid centre_id FK
        string name
        string description
        boolean is_default
        datetime created_at
        datetime updated_at
        uuid created_by FK
    }
    
    RosterTemplateShifts {
        uuid id PK
        uuid template_id FK
        uuid room_id FK
        uuid shift_template_id FK
        int day_of_week
        time start_time
        time end_time
        int break_minutes
        string staff_role
        string required_qualifications
        string notes
    }
    
    TemplateApplicationLogs {
        uuid id PK
        uuid template_id FK
        uuid centre_id FK
        date week_start_date
        int shifts_created
        int shifts_skipped
        string skip_reasons
        datetime applied_at
        uuid applied_by FK
    }`,
  },
  {
    id: 'roster-attendance',
    title: 'Time & Attendance',
    icon: React.createElement(MapPin, { className: "h-4 w-4" }),
    description: 'Clock in/out events, GPS validation, attendance records',
    tableCount: 5,
    diagram: `erDiagram
    ClockEvents ||--o| Shifts : "for shift"
    ClockEvents ||--o| Staff : "by staff"
    ClockEvents ||--o| GeofenceZones : "validated against"
    
    AttendanceRecords ||--o{ AttendanceIssues : has
    AttendanceRecords ||--o| Shifts : "for shift"
    
    ClockEvents {
        uuid id PK
        uuid tenant_id FK
        uuid shift_id FK
        uuid staff_id FK
        string event_type
        datetime scheduled_time
        datetime actual_time
        decimal latitude
        decimal longitude
        int accuracy_meters
        uuid geofence_id FK
        boolean within_geofence
        int distance_from_centre
        string validation_status
        string validation_notes
        string device_info
        string ip_address
        datetime created_at
    }
    
    AttendanceRecords {
        uuid id PK
        uuid tenant_id FK
        uuid shift_id FK
        uuid staff_id FK
        datetime clock_in_time
        datetime clock_out_time
        int scheduled_minutes
        int worked_minutes
        int break_minutes
        int variance_minutes
        string overall_status
        boolean is_approved
        uuid approved_by FK
        datetime approved_at
    }
    
    AttendanceIssues {
        uuid id PK
        uuid attendance_id FK
        string issue_type
        string description
        string severity
        boolean is_resolved
        uuid resolved_by FK
        datetime resolved_at
        string resolution_notes
    }`,
  },
  {
    id: 'roster-compliance',
    title: 'Compliance & Ratios',
    icon: React.createElement(Shield, { className: "h-4 w-4" }),
    description: 'NQF ratio compliance, qualification requirements, certification tracking',
    tableCount: 6,
    diagram: `erDiagram
    ComplianceFlags ||--o| Centres : "for centre"
    ComplianceFlags ||--o| Rooms : "for room"
    
    RatioSnapshots ||--o{ RatioSlotDetails : has
    RatioSnapshots ||--o| Rooms : "for room"
    
    QualificationAlerts ||--o| Staff : "for staff"
    QualificationAlerts ||--o| StaffQualifications : "regarding"
    
    ComplianceFlags {
        uuid id PK
        uuid tenant_id FK
        uuid centre_id FK
        uuid room_id FK
        date flag_date
        string time_slot
        string flag_type
        string severity
        string message
        string affected_staff_ids
        boolean is_resolved
        uuid resolved_by FK
        datetime resolved_at
    }
    
    RatioSnapshots {
        uuid id PK
        uuid tenant_id FK
        uuid room_id FK
        date snapshot_date
        time time_slot
        int booked_children
        int actual_children
        int educators_present
        decimal current_ratio
        decimal required_ratio
        boolean is_compliant
    }
    
    RatioSlotDetails {
        uuid id PK
        uuid snapshot_id FK
        uuid staff_id FK
        boolean is_qualified
        string qualification_level
    }
    
    QualificationAlerts {
        uuid id PK
        uuid tenant_id FK
        uuid staff_id FK
        uuid qualification_id FK
        string alert_type
        date expiry_date
        int days_until_expiry
        boolean is_acknowledged
        uuid acknowledged_by FK
        datetime acknowledged_at
    }`,
  },
  {
    id: 'roster-fatigue',
    title: 'Fatigue Management',
    icon: React.createElement(AlertTriangle, { className: "h-4 w-4" }),
    description: 'Fatigue rules, rest requirements, violation tracking',
    tableCount: 5,
    diagram: `erDiagram
    FatigueRules ||--o{ FatigueViolations : "violated by"
    
    FatigueScores ||--o{ FatigueFactors : has
    FatigueScores ||--o| Staff : "for staff"
    
    FatigueViolations ||--o| Staff : "by staff"
    FatigueViolations ||--o{ ViolationShifts : "involves shifts"
    
    FatigueRules {
        uuid id PK
        uuid tenant_id FK
        string name
        string description
        int max_consecutive_days
        int max_weekly_hours
        int min_rest_between_shifts
        int max_night_shifts_consecutive
        time night_shift_start
        time night_shift_end
        int fatigue_score_threshold
        boolean is_active
    }
    
    FatigueScores {
        uuid id PK
        uuid tenant_id FK
        uuid staff_id FK
        int current_score
        string risk_level
        datetime last_updated
        int projected_score_next_week
    }
    
    FatigueFactors {
        uuid id PK
        uuid score_id FK
        string factor_name
        int contribution
        string details
    }
    
    FatigueViolations {
        uuid id PK
        uuid tenant_id FK
        uuid staff_id FK
        uuid rule_id FK
        string violation_type
        string severity
        string description
        decimal current_value
        decimal limit_value
        datetime detected_at
        boolean is_acknowledged
        uuid acknowledged_by FK
    }
    
    ViolationShifts {
        uuid id PK
        uuid violation_id FK
        uuid shift_id FK
    }`,
  },
  {
    id: 'roster-leave',
    title: 'Leave & Time Off',
    icon: React.createElement(Calendar, { className: "h-4 w-4" }),
    description: 'Leave requests, approvals, entitlements',
    tableCount: 4,
    diagram: `erDiagram
    TimeOffRequests ||--o| Staff : "requested by"
    TimeOffRequests ||--o| Staff : "approved by"
    
    LeaveEntitlements ||--o| Staff : "for staff"
    LeaveEntitlements ||--o{ LeaveTransactions : tracks
    
    TimeOffRequests {
        uuid id PK
        uuid tenant_id FK
        uuid staff_id FK
        string leave_type
        date start_date
        date end_date
        decimal hours_requested
        string status
        string notes
        uuid approved_by FK
        datetime approved_at
        string rejection_reason
        datetime created_at
    }
    
    LeaveEntitlements {
        uuid id PK
        uuid tenant_id FK
        uuid staff_id FK
        string leave_type
        int fiscal_year
        decimal accrued_hours
        decimal used_hours
        decimal pending_hours
        decimal balance_hours
        datetime last_calculated
    }
    
    LeaveTransactions {
        uuid id PK
        uuid entitlement_id FK
        uuid time_off_id FK
        string transaction_type
        decimal hours
        string notes
        datetime created_at
    }`,
  },
  {
    id: 'roster-demand',
    title: 'Demand & Forecasting',
    icon: React.createElement(Layers, { className: "h-4 w-4" }),
    description: 'Child bookings, demand forecasts, external factors',
    tableCount: 5,
    diagram: `erDiagram
    DemandData ||--o| Rooms : "for room"
    
    DemandForecasts ||--o{ ForecastFactors : has
    DemandForecasts ||--o| Rooms : "for room"
    
    ExternalFactors ||--o{ AffectedCentres : affects
    
    WeatherForecasts ||--o{ WeatherAlerts : has
    
    DemandData {
        uuid id PK
        uuid tenant_id FK
        uuid centre_id FK
        uuid room_id FK
        date booking_date
        string time_slot
        int booked_children
        int projected_children
        decimal historical_attendance
        decimal utilisation_percent
    }
    
    DemandForecasts {
        uuid id PK
        uuid tenant_id FK
        uuid centre_id FK
        uuid room_id FK
        date forecast_date
        int baseline_demand
        int adjusted_demand
        decimal confidence
        int recommended_staff
        int scheduled_staff
        int variance
    }
    
    ForecastFactors {
        uuid id PK
        uuid forecast_id FK
        string factor_type
        string factor_name
        decimal multiplier
    }
    
    ExternalFactors {
        uuid id PK
        uuid tenant_id FK
        string factor_type
        string name
        date start_date
        date end_date
        decimal demand_multiplier
        string notes
        string source
    }
    
    WeatherForecasts {
        uuid id PK
        uuid tenant_id FK
        string location
        date forecast_date
        string condition
        decimal temp_min
        decimal temp_max
        int precipitation_probability
        int uv_index
    }`,
  },
  {
    id: 'roster-notifications',
    title: 'Notifications & Publishing',
    icon: React.createElement(Bell, { className: "h-4 w-4" }),
    description: 'Roster publishing, shift notifications, swap requests',
    tableCount: 5,
    diagram: `erDiagram
    RosterPublications ||--o{ PublicationNotifications : triggers
    RosterPublications ||--o| Centres : "for centre"
    
    ShiftNotifications ||--o| Staff : "for staff"
    
    SwapRequests ||--o| Shifts : "original shift"
    SwapRequests ||--o| Staff : "requested by"
    SwapRequests ||--o| Staff : "swap with"
    
    RosterPublications {
        uuid id PK
        uuid tenant_id FK
        uuid centre_id FK
        date week_start
        date week_end
        datetime published_at
        uuid published_by FK
        int shifts_count
        int staff_notified
        string notification_methods
    }
    
    PublicationNotifications {
        uuid id PK
        uuid publication_id FK
        uuid staff_id FK
        string notification_type
        string channel
        boolean is_sent
        datetime sent_at
        boolean is_read
        datetime read_at
    }
    
    ShiftNotifications {
        uuid id PK
        uuid tenant_id FK
        uuid staff_id FK
        uuid shift_id FK
        string notification_type
        string title
        string message
        string channels
        datetime created_at
        boolean is_read
        datetime read_at
    }
    
    SwapRequests {
        uuid id PK
        uuid tenant_id FK
        uuid shift_id FK
        uuid requester_id FK
        uuid target_staff_id FK
        uuid target_shift_id FK
        string status
        string reason
        datetime requested_at
        uuid approved_by FK
        datetime approved_at
    }`,
  },
  {
    id: 'roster-costs',
    title: 'Cost & Budget',
    icon: React.createElement(Layers, { className: "h-4 w-4" }),
    description: 'Roster costs, budget tracking, overtime analysis',
    tableCount: 4,
    diagram: `erDiagram
    RosterCostSummaries ||--o| Centres : "for centre"
    
    ShiftCostBreakdowns ||--o| Shifts : "for shift"
    ShiftCostBreakdowns ||--o{ CostLineItems : has
    
    BudgetAllocations ||--o{ BudgetVariances : tracks
    
    RosterCostSummaries {
        uuid id PK
        uuid tenant_id FK
        uuid centre_id FK
        date week_start
        date week_end
        decimal regular_hours
        decimal overtime_hours
        decimal regular_cost
        decimal overtime_cost
        decimal agency_cost
        decimal allowances_cost
        decimal total_cost
        decimal cost_per_child
        decimal budget_amount
        decimal budget_variance
    }
    
    ShiftCostBreakdowns {
        uuid id PK
        uuid shift_id FK
        decimal base_hours
        decimal overtime_hours
        decimal base_cost
        decimal overtime_cost
        decimal penalty_cost
        decimal allowances_cost
        decimal total_cost
    }
    
    CostLineItems {
        uuid id PK
        uuid breakdown_id FK
        string item_type
        string description
        decimal quantity
        decimal rate
        decimal amount
    }
    
    BudgetAllocations {
        uuid id PK
        uuid tenant_id FK
        uuid centre_id FK
        int fiscal_year
        int fiscal_month
        decimal allocated_budget
        decimal actual_spend
        decimal variance
        string variance_reason
    }`,
  },
];

// Roster Module SQL Schema
export const rosterSchemaContent = `-- =============================================
-- ROSTER MODULE - MS SQL DATABASE SCHEMA
-- Multi-Tenant Childcare Workforce Scheduling
-- =============================================
-- Version: 1.0.0
-- Database: Microsoft SQL Server 2019+
-- Features: Multi-tenant, GPS validation, NQF compliance
-- =============================================

-- =============================================
-- SCHEMA: roster_core
-- Core entities: Centres, Rooms, Operating Hours
-- =============================================

CREATE SCHEMA roster_core;
GO

-- Centres Table
CREATE TABLE roster_core.Centres (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    name NVARCHAR(255) NOT NULL,
    code NVARCHAR(50) NOT NULL,
    address NVARCHAR(500),
    suburb NVARCHAR(100),
    state NVARCHAR(50),
    postcode NVARCHAR(20),
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    phone NVARCHAR(50),
    email NVARCHAR(255),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_Centre_Code UNIQUE (tenant_id, code)
);

-- Centre Operating Hours
CREATE TABLE roster_core.CentreOperatingHours (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    centre_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_core.Centres(id),
    day_of_week INT NOT NULL,                   -- 0=Sunday, 6=Saturday
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_closed BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Rooms Table
CREATE TABLE roster_core.Rooms (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    centre_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_core.Centres(id),
    name NVARCHAR(100) NOT NULL,
    code NVARCHAR(50),
    age_group NVARCHAR(50) NOT NULL,            -- 'nursery', 'toddler', 'preschool', 'kindy'
    capacity INT NOT NULL,
    min_age_months INT,
    max_age_months INT,
    required_ratio DECIMAL(5,2) NOT NULL,       -- Children per educator
    min_qualified_staff INT DEFAULT 1,
    color NVARCHAR(50),
    display_order INT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Room Ratio Rules (NQF Compliance)
CREATE TABLE roster_core.RoomRatioRules (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    room_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_core.Rooms(id),
    age_group NVARCHAR(50) NOT NULL,
    children_per_educator DECIMAL(5,2) NOT NULL,
    min_educators INT DEFAULT 1,
    requires_qualified BIT DEFAULT 1,
    regulation_reference NVARCHAR(255),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Geofence Zones for GPS Clock-in
CREATE TABLE roster_core.GeofenceZones (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    centre_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_core.Centres(id),
    name NVARCHAR(100) NOT NULL,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    radius_meters INT NOT NULL DEFAULT 100,
    allowed_buffer_meters INT DEFAULT 50,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- =============================================
-- SCHEMA: roster_staff
-- Staff profiles, qualifications, availability
-- =============================================

CREATE SCHEMA roster_staff;
GO

-- Staff Table
CREATE TABLE roster_staff.Staff (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    employee_id NVARCHAR(50),
    first_name NVARCHAR(100) NOT NULL,
    last_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(255),
    phone NVARCHAR(50),
    avatar_url NVARCHAR(500),
    role NVARCHAR(50) NOT NULL,                 -- 'lead_educator', 'educator', 'assistant', 'cook', 'admin'
    employment_type NVARCHAR(50) NOT NULL,      -- 'permanent', 'casual'
    agency_type NVARCHAR(50),                   -- 'anzuk', 'randstad', 'hays', etc.
    default_centre_id UNIQUEIDENTIFIER REFERENCES roster_core.Centres(id),
    hourly_rate DECIMAL(10,2),
    overtime_rate DECIMAL(10,2),
    max_hours_per_week INT DEFAULT 38,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_Staff_Email UNIQUE (tenant_id, email),
    CONSTRAINT UQ_Staff_EmployeeId UNIQUE (tenant_id, employee_id)
);

-- Qualification Types
CREATE TABLE roster_staff.QualificationTypes (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    code NVARCHAR(50) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    category NVARCHAR(100),
    requires_expiry BIT DEFAULT 1,
    renewal_period_months INT,
    is_mandatory BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_QualType_Code UNIQUE (tenant_id, code)
);

-- Staff Qualifications
CREATE TABLE roster_staff.StaffQualifications (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_staff.Staff(id),
    qualification_type_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_staff.QualificationTypes(id),
    certificate_number NVARCHAR(100),
    issue_date DATE,
    expiry_date DATE,
    status NVARCHAR(50) DEFAULT 'active',       -- 'active', 'expired', 'expiring_soon', 'pending_renewal'
    document_url NVARCHAR(500),
    verified_at DATETIME2,
    verified_by UNIQUEIDENTIFIER,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Staff Availability
CREATE TABLE roster_staff.StaffAvailability (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_staff.Staff(id),
    day_of_week INT NOT NULL,                   -- 0-6
    is_available BIT DEFAULT 1,
    start_time TIME,
    end_time TIME,
    week_pattern INT DEFAULT 0,                 -- 0=every week, 1=week1, 2=week2 (alternate)
    anchor_date DATE,                           -- Reference date for alternate weeks
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Staff Preferred Centres
CREATE TABLE roster_staff.StaffPreferredCentres (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_staff.Staff(id),
    centre_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_core.Centres(id),
    preference_order INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Staff Scheduling Preferences
CREATE TABLE roster_staff.StaffSchedulingPreferences (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_staff.Staff(id),
    preferred_rooms NVARCHAR(MAX),              -- JSON array of room IDs
    avoid_rooms NVARCHAR(MAX),                  -- JSON array of room IDs
    max_consecutive_days INT DEFAULT 5,
    min_rest_hours INT DEFAULT 10,
    prefer_early_shifts BIT DEFAULT 0,
    prefer_late_shifts BIT DEFAULT 0,
    max_shifts_per_week INT DEFAULT 5,
    willing_multi_location BIT DEFAULT 0,
    max_travel_distance_km INT,
    notify_on_publish BIT DEFAULT 1,
    notify_on_swap BIT DEFAULT 1,
    notify_on_open_shifts BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Staff Pay Rates
CREATE TABLE roster_staff.StaffPayRates (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_staff.Staff(id),
    rate_type NVARCHAR(50) NOT NULL,            -- 'base', 'overtime', 'penalty', 'allowance'
    rate_value DECIMAL(10,4) NOT NULL,
    rate_unit NVARCHAR(20) DEFAULT 'hour',      -- 'hour', 'day', 'flat'
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_current BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Staff Agency Details
CREATE TABLE roster_staff.StaffAgencyDetails (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_staff.Staff(id),
    agency_name NVARCHAR(255) NOT NULL,
    agency_code NVARCHAR(50),
    agency_staff_id NVARCHAR(100),
    agency_hourly_rate DECIMAL(10,2),
    agency_markup_percent DECIMAL(5,2),
    contract_start_date DATE,
    contract_end_date DATE,
    notes NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- =============================================
-- SCHEMA: roster_shifts
-- Shifts, open shifts, templates
-- =============================================

CREATE SCHEMA roster_shifts;
GO

-- Shift Templates
CREATE TABLE roster_shifts.ShiftTemplates (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    name NVARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_minutes INT DEFAULT 0,
    color NVARCHAR(50),
    shift_type NVARCHAR(50) DEFAULT 'regular',  -- 'regular', 'on_call', 'sleepover', 'broken'
    required_qualifications NVARCHAR(MAX),      -- JSON array
    minimum_classification NVARCHAR(50),
    preferred_role NVARCHAR(50),
    on_call_settings NVARCHAR(MAX),             -- JSON object
    sleepover_settings NVARCHAR(MAX),           -- JSON object
    broken_shift_settings NVARCHAR(MAX),        -- JSON object
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Template Allowances
CREATE TABLE roster_shifts.TemplateAllowances (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    template_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_shifts.ShiftTemplates(id),
    allowance_code NVARCHAR(50) NOT NULL,
    allowance_name NVARCHAR(255),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Shifts Table
CREATE TABLE roster_shifts.Shifts (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    centre_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_core.Centres(id),
    room_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_core.Rooms(id),
    staff_id UNIQUEIDENTIFIER REFERENCES roster_staff.Staff(id),
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_minutes INT DEFAULT 0,
    status NVARCHAR(50) DEFAULT 'draft',        -- 'draft', 'published', 'confirmed', 'completed'
    shift_type NVARCHAR(50) DEFAULT 'regular',
    is_open_shift BIT DEFAULT 0,
    is_ai_generated BIT DEFAULT 0,
    ai_generated_at DATETIME2,
    recurrence_group_id UNIQUEIDENTIFIER,
    is_absent BIT DEFAULT 0,
    absence_reason NVARCHAR(50),
    replacement_staff_id UNIQUEIDENTIFIER REFERENCES roster_staff.Staff(id),
    notes NVARCHAR(MAX),
    on_call_details NVARCHAR(MAX),              -- JSON object
    sleepover_details NVARCHAR(MAX),            -- JSON object
    broken_shift_details NVARCHAR(MAX),         -- JSON object
    higher_duties NVARCHAR(MAX),                -- JSON object
    is_remote_location BIT DEFAULT 0,
    travel_kilometres DECIMAL(10,2),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    created_by UNIQUEIDENTIFIER,
    updated_by UNIQUEIDENTIFIER
);

-- Shift Breaks
CREATE TABLE roster_shifts.ShiftBreaks (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    shift_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_shifts.Shifts(id),
    break_type NVARCHAR(50) NOT NULL,           -- 'meal', 'rest', 'other'
    scheduled_start TIME,
    scheduled_end TIME,
    actual_start TIME,
    actual_end TIME,
    duration_minutes INT NOT NULL,
    is_paid BIT DEFAULT 0,
    status NVARCHAR(50) DEFAULT 'scheduled',    -- 'scheduled', 'started', 'completed', 'missed', 'skipped'
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Shift Notes
CREATE TABLE roster_shifts.ShiftNotes (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    shift_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_shifts.Shifts(id),
    note_type NVARCHAR(50),
    content NVARCHAR(MAX) NOT NULL,
    created_by UNIQUEIDENTIFIER NOT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Open Shifts
CREATE TABLE roster_shifts.OpenShifts (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    centre_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_core.Centres(id),
    room_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_core.Rooms(id),
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_minutes INT DEFAULT 0,
    urgency NVARCHAR(50) DEFAULT 'medium',      -- 'low', 'medium', 'high', 'critical'
    required_qualifications NVARCHAR(MAX),
    minimum_classification NVARCHAR(50),
    preferred_role NVARCHAR(50),
    template_id UNIQUEIDENTIFIER REFERENCES roster_shifts.ShiftTemplates(id),
    notes NVARCHAR(MAX),
    is_filled BIT DEFAULT 0,
    filled_by UNIQUEIDENTIFIER REFERENCES roster_staff.Staff(id),
    filled_at DATETIME2,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    created_by UNIQUEIDENTIFIER
);

-- Open Shift Applicants
CREATE TABLE roster_shifts.OpenShiftApplicants (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    open_shift_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_shifts.OpenShifts(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_staff.Staff(id),
    applied_at DATETIME2 DEFAULT GETUTCDATE(),
    status NVARCHAR(50) DEFAULT 'pending',      -- 'pending', 'approved', 'rejected', 'withdrawn'
    notes NVARCHAR(MAX)
);

-- =============================================
-- SCHEMA: roster_recurring
-- Recurring shift patterns
-- =============================================

CREATE SCHEMA roster_recurring;
GO

-- Recurring Patterns
CREATE TABLE roster_recurring.RecurringPatterns (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    centre_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_core.Centres(id),
    room_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_core.Rooms(id),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    recurrence_type NVARCHAR(50) NOT NULL,      -- 'daily', 'weekly', 'fortnightly', 'monthly'
    start_date DATE NOT NULL,
    end_date DATE,
    end_type NVARCHAR(50) DEFAULT 'never',      -- 'never', 'after_occurrences', 'on_date'
    end_after_occurrences INT,
    week_interval INT DEFAULT 1,
    month_day INT,
    shift_start_time TIME NOT NULL,
    shift_end_time TIME NOT NULL,
    break_minutes INT DEFAULT 0,
    role_id NVARCHAR(50),
    assigned_staff_id UNIQUEIDENTIFIER REFERENCES roster_staff.Staff(id),
    required_qualifications NVARCHAR(MAX),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    created_by UNIQUEIDENTIFIER
);

-- Recurring Pattern Days (for weekly patterns)
CREATE TABLE roster_recurring.RecurringPatternDays (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    pattern_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_recurring.RecurringPatterns(id),
    day_of_week INT NOT NULL                    -- 0-6
);

-- Generated Shifts (tracking)
CREATE TABLE roster_recurring.GeneratedShifts (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    pattern_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_recurring.RecurringPatterns(id),
    shift_id UNIQUEIDENTIFIER REFERENCES roster_shifts.Shifts(id),
    generated_date DATE NOT NULL,
    status NVARCHAR(50) DEFAULT 'pending',      -- 'pending', 'confirmed', 'modified', 'cancelled'
    modification_notes NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Recurring Pattern Notifications
CREATE TABLE roster_recurring.RecurringPatternNotifications (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    pattern_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_recurring.RecurringPatterns(id),
    notification_type NVARCHAR(50) NOT NULL,    -- 'expiring_soon', 'expired', 'renewed'
    trigger_date DATE NOT NULL,
    is_sent BIT DEFAULT 0,
    sent_at DATETIME2
);

-- =============================================
-- SCHEMA: roster_templates
-- Roster templates for week planning
-- =============================================

CREATE SCHEMA roster_templates;
GO

-- Roster Templates
CREATE TABLE roster_templates.RosterTemplates (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    centre_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_core.Centres(id),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    is_default BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    created_by UNIQUEIDENTIFIER
);

-- Roster Template Shifts
CREATE TABLE roster_templates.RosterTemplateShifts (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    template_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_templates.RosterTemplates(id),
    room_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_core.Rooms(id),
    shift_template_id UNIQUEIDENTIFIER REFERENCES roster_shifts.ShiftTemplates(id),
    day_of_week INT NOT NULL,                   -- 0-6
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_minutes INT DEFAULT 0,
    staff_role NVARCHAR(50),
    required_qualifications NVARCHAR(MAX),
    notes NVARCHAR(MAX)
);

-- Template Application Logs
CREATE TABLE roster_templates.TemplateApplicationLogs (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    template_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_templates.RosterTemplates(id),
    centre_id UNIQUEIDENTIFIER NOT NULL,
    week_start_date DATE NOT NULL,
    shifts_created INT DEFAULT 0,
    shifts_skipped INT DEFAULT 0,
    skip_reasons NVARCHAR(MAX),                 -- JSON array
    applied_at DATETIME2 DEFAULT GETUTCDATE(),
    applied_by UNIQUEIDENTIFIER
);

-- =============================================
-- SCHEMA: roster_attendance
-- Time and attendance, GPS validation
-- =============================================

CREATE SCHEMA roster_attendance;
GO

-- Clock Events
CREATE TABLE roster_attendance.ClockEvents (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    shift_id UNIQUEIDENTIFIER REFERENCES roster_shifts.Shifts(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_staff.Staff(id),
    event_type NVARCHAR(50) NOT NULL,           -- 'clock_in', 'clock_out', 'break_start', 'break_end'
    scheduled_time DATETIME2,
    actual_time DATETIME2 NOT NULL,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    accuracy_meters INT,
    geofence_id UNIQUEIDENTIFIER REFERENCES roster_core.GeofenceZones(id),
    within_geofence BIT,
    distance_from_centre INT,
    validation_status NVARCHAR(50) DEFAULT 'valid',  -- 'valid', 'warning', 'invalid', 'manual_override'
    validation_notes NVARCHAR(MAX),
    device_info NVARCHAR(255),
    ip_address NVARCHAR(50),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Attendance Records
CREATE TABLE roster_attendance.AttendanceRecords (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    shift_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_shifts.Shifts(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_staff.Staff(id),
    clock_in_time DATETIME2,
    clock_out_time DATETIME2,
    scheduled_minutes INT,
    worked_minutes INT,
    break_minutes INT DEFAULT 0,
    variance_minutes INT,
    overall_status NVARCHAR(50) DEFAULT 'pending',  -- 'valid', 'needs_review', 'invalid', 'approved'
    is_approved BIT DEFAULT 0,
    approved_by UNIQUEIDENTIFIER,
    approved_at DATETIME2,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Attendance Issues
CREATE TABLE roster_attendance.AttendanceIssues (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    attendance_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_attendance.AttendanceRecords(id),
    issue_type NVARCHAR(50) NOT NULL,           -- 'early_clock_in', 'late_clock_in', 'outside_geofence', etc.
    description NVARCHAR(MAX),
    severity NVARCHAR(20) DEFAULT 'warning',
    is_resolved BIT DEFAULT 0,
    resolved_by UNIQUEIDENTIFIER,
    resolved_at DATETIME2,
    resolution_notes NVARCHAR(MAX)
);

-- =============================================
-- SCHEMA: roster_compliance
-- NQF compliance, ratio tracking, qualifications
-- =============================================

CREATE SCHEMA roster_compliance;
GO

-- Compliance Flags
CREATE TABLE roster_compliance.ComplianceFlags (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    centre_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_core.Centres(id),
    room_id UNIQUEIDENTIFIER REFERENCES roster_core.Rooms(id),
    flag_date DATE NOT NULL,
    time_slot NVARCHAR(50),
    flag_type NVARCHAR(50) NOT NULL,            -- 'ratio_breach', 'qualification_gap', 'overtime_warning', etc.
    severity NVARCHAR(20) NOT NULL,             -- 'info', 'warning', 'critical'
    message NVARCHAR(MAX) NOT NULL,
    affected_staff_ids NVARCHAR(MAX),           -- JSON array
    is_resolved BIT DEFAULT 0,
    resolved_by UNIQUEIDENTIFIER,
    resolved_at DATETIME2,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Ratio Snapshots
CREATE TABLE roster_compliance.RatioSnapshots (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    room_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_core.Rooms(id),
    snapshot_date DATE NOT NULL,
    time_slot TIME NOT NULL,
    booked_children INT,
    actual_children INT,
    educators_present INT,
    current_ratio DECIMAL(5,2),
    required_ratio DECIMAL(5,2),
    is_compliant BIT,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Ratio Slot Details
CREATE TABLE roster_compliance.RatioSlotDetails (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    snapshot_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_compliance.RatioSnapshots(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_staff.Staff(id),
    is_qualified BIT DEFAULT 0,
    qualification_level NVARCHAR(100)
);

-- Qualification Alerts
CREATE TABLE roster_compliance.QualificationAlerts (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_staff.Staff(id),
    qualification_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_staff.StaffQualifications(id),
    alert_type NVARCHAR(50) NOT NULL,           -- 'expiring_soon', 'expired', 'renewal_due'
    expiry_date DATE,
    days_until_expiry INT,
    is_acknowledged BIT DEFAULT 0,
    acknowledged_by UNIQUEIDENTIFIER,
    acknowledged_at DATETIME2,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- =============================================
-- SCHEMA: roster_fatigue
-- Fatigue management, rest requirements
-- =============================================

CREATE SCHEMA roster_fatigue;
GO

-- Fatigue Rules
CREATE TABLE roster_fatigue.FatigueRules (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    max_consecutive_days INT DEFAULT 5,
    max_weekly_hours INT DEFAULT 38,
    min_rest_between_shifts INT DEFAULT 10,     -- hours
    max_night_shifts_consecutive INT DEFAULT 3,
    night_shift_start TIME DEFAULT '22:00',
    night_shift_end TIME DEFAULT '06:00',
    fatigue_score_threshold INT DEFAULT 70,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Fatigue Scores
CREATE TABLE roster_fatigue.FatigueScores (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_staff.Staff(id),
    current_score INT NOT NULL,                 -- 0-100, higher = more fatigued
    risk_level NVARCHAR(20) NOT NULL,           -- 'low', 'moderate', 'high', 'critical'
    last_updated DATETIME2 DEFAULT GETUTCDATE(),
    projected_score_next_week INT
);

-- Fatigue Factors
CREATE TABLE roster_fatigue.FatigueFactors (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    score_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_fatigue.FatigueScores(id),
    factor_name NVARCHAR(100) NOT NULL,
    contribution INT NOT NULL,
    details NVARCHAR(MAX)
);

-- Fatigue Violations
CREATE TABLE roster_fatigue.FatigueViolations (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_staff.Staff(id),
    rule_id UNIQUEIDENTIFIER REFERENCES roster_fatigue.FatigueRules(id),
    violation_type NVARCHAR(50) NOT NULL,       -- 'consecutive_days', 'weekly_hours', 'rest_break', etc.
    severity NVARCHAR(20) NOT NULL,             -- 'warning', 'violation', 'critical'
    description NVARCHAR(MAX),
    current_value DECIMAL(10,2),
    limit_value DECIMAL(10,2),
    detected_at DATETIME2 DEFAULT GETUTCDATE(),
    is_acknowledged BIT DEFAULT 0,
    acknowledged_by UNIQUEIDENTIFIER,
    acknowledged_at DATETIME2
);

-- Violation Shifts
CREATE TABLE roster_fatigue.ViolationShifts (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    violation_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_fatigue.FatigueViolations(id),
    shift_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_shifts.Shifts(id)
);

-- =============================================
-- SCHEMA: roster_leave
-- Leave requests and entitlements
-- =============================================

CREATE SCHEMA roster_leave;
GO

-- Time Off Requests
CREATE TABLE roster_leave.TimeOffRequests (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_staff.Staff(id),
    leave_type NVARCHAR(50) NOT NULL,           -- 'annual_leave', 'sick_leave', 'personal_leave', 'unpaid_leave'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    hours_requested DECIMAL(10,2),
    status NVARCHAR(50) DEFAULT 'pending',      -- 'pending', 'approved', 'rejected', 'cancelled'
    notes NVARCHAR(MAX),
    approved_by UNIQUEIDENTIFIER,
    approved_at DATETIME2,
    rejection_reason NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Leave Entitlements
CREATE TABLE roster_leave.LeaveEntitlements (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_staff.Staff(id),
    leave_type NVARCHAR(50) NOT NULL,
    fiscal_year INT NOT NULL,
    accrued_hours DECIMAL(10,2) DEFAULT 0,
    used_hours DECIMAL(10,2) DEFAULT 0,
    pending_hours DECIMAL(10,2) DEFAULT 0,
    balance_hours DECIMAL(10,2) AS (accrued_hours - used_hours - pending_hours),
    last_calculated DATETIME2
);

-- Leave Transactions
CREATE TABLE roster_leave.LeaveTransactions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    entitlement_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_leave.LeaveEntitlements(id),
    time_off_id UNIQUEIDENTIFIER REFERENCES roster_leave.TimeOffRequests(id),
    transaction_type NVARCHAR(50) NOT NULL,     -- 'accrual', 'usage', 'adjustment', 'carryover'
    hours DECIMAL(10,2) NOT NULL,
    notes NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- =============================================
-- SCHEMA: roster_demand
-- Demand forecasting, external factors
-- =============================================

CREATE SCHEMA roster_demand;
GO

-- Demand Data
CREATE TABLE roster_demand.DemandData (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    centre_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_core.Centres(id),
    room_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_core.Rooms(id),
    booking_date DATE NOT NULL,
    time_slot NVARCHAR(50),
    booked_children INT,
    projected_children INT,
    historical_attendance DECIMAL(5,2),
    utilisation_percent DECIMAL(5,2),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Demand Forecasts
CREATE TABLE roster_demand.DemandForecasts (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    centre_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_core.Centres(id),
    room_id UNIQUEIDENTIFIER REFERENCES roster_core.Rooms(id),
    forecast_date DATE NOT NULL,
    baseline_demand INT,
    adjusted_demand INT,
    confidence DECIMAL(5,2),
    recommended_staff INT,
    scheduled_staff INT,
    variance INT,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Forecast Factors
CREATE TABLE roster_demand.ForecastFactors (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    forecast_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_demand.DemandForecasts(id),
    factor_type NVARCHAR(50) NOT NULL,
    factor_name NVARCHAR(255),
    multiplier DECIMAL(5,4)
);

-- External Factors
CREATE TABLE roster_demand.ExternalFactors (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    factor_type NVARCHAR(50) NOT NULL,          -- 'weather', 'public_holiday', 'school_holidays', 'event', 'custom'
    name NVARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    demand_multiplier DECIMAL(5,4),
    affected_centres NVARCHAR(MAX),             -- JSON array or 'all'
    notes NVARCHAR(MAX),
    source NVARCHAR(50) DEFAULT 'manual',       -- 'automatic', 'manual'
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Weather Forecasts
CREATE TABLE roster_demand.WeatherForecasts (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    location NVARCHAR(255) NOT NULL,
    forecast_date DATE NOT NULL,
    condition NVARCHAR(50),                     -- 'clear', 'cloudy', 'rain', 'storm', etc.
    temp_min DECIMAL(5,2),
    temp_max DECIMAL(5,2),
    precipitation_probability INT,
    uv_index INT,
    humidity INT,
    alerts NVARCHAR(MAX),                       -- JSON array
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- =============================================
-- SCHEMA: roster_notifications
-- Publishing, notifications, swap requests
-- =============================================

CREATE SCHEMA roster_notifications;
GO

-- Roster Publications
CREATE TABLE roster_notifications.RosterPublications (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    centre_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_core.Centres(id),
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    published_at DATETIME2 DEFAULT GETUTCDATE(),
    published_by UNIQUEIDENTIFIER NOT NULL,
    shifts_count INT DEFAULT 0,
    staff_notified INT DEFAULT 0,
    notification_methods NVARCHAR(MAX)          -- JSON array ['email', 'sms', 'push']
);

-- Publication Notifications
CREATE TABLE roster_notifications.PublicationNotifications (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    publication_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_notifications.RosterPublications(id),
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_staff.Staff(id),
    notification_type NVARCHAR(50) NOT NULL,
    channel NVARCHAR(50) NOT NULL,              -- 'email', 'sms', 'push'
    is_sent BIT DEFAULT 0,
    sent_at DATETIME2,
    is_read BIT DEFAULT 0,
    read_at DATETIME2
);

-- Shift Notifications
CREATE TABLE roster_notifications.ShiftNotifications (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    staff_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_staff.Staff(id),
    shift_id UNIQUEIDENTIFIER REFERENCES roster_shifts.Shifts(id),
    notification_type NVARCHAR(50) NOT NULL,    -- 'shift_published', 'shift_swapped', 'open_shift_available', etc.
    title NVARCHAR(255) NOT NULL,
    message NVARCHAR(MAX),
    channels NVARCHAR(MAX),                     -- JSON array
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    is_read BIT DEFAULT 0,
    read_at DATETIME2
);

-- Swap Requests
CREATE TABLE roster_notifications.SwapRequests (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    shift_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_shifts.Shifts(id),
    requester_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_staff.Staff(id),
    target_staff_id UNIQUEIDENTIFIER REFERENCES roster_staff.Staff(id),
    target_shift_id UNIQUEIDENTIFIER REFERENCES roster_shifts.Shifts(id),
    status NVARCHAR(50) DEFAULT 'pending',      -- 'pending', 'approved', 'rejected', 'cancelled'
    reason NVARCHAR(MAX),
    requested_at DATETIME2 DEFAULT GETUTCDATE(),
    approved_by UNIQUEIDENTIFIER,
    approved_at DATETIME2
);

-- =============================================
-- SCHEMA: roster_costs
-- Cost tracking and budget
-- =============================================

CREATE SCHEMA roster_costs;
GO

-- Roster Cost Summaries
CREATE TABLE roster_costs.RosterCostSummaries (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    centre_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_core.Centres(id),
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    regular_hours DECIMAL(10,2) DEFAULT 0,
    overtime_hours DECIMAL(10,2) DEFAULT 0,
    regular_cost DECIMAL(12,2) DEFAULT 0,
    overtime_cost DECIMAL(12,2) DEFAULT 0,
    agency_cost DECIMAL(12,2) DEFAULT 0,
    allowances_cost DECIMAL(12,2) DEFAULT 0,
    total_cost DECIMAL(12,2) DEFAULT 0,
    cost_per_child DECIMAL(10,2),
    budget_amount DECIMAL(12,2),
    budget_variance DECIMAL(12,2),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Shift Cost Breakdowns
CREATE TABLE roster_costs.ShiftCostBreakdowns (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    shift_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_shifts.Shifts(id),
    base_hours DECIMAL(10,2),
    overtime_hours DECIMAL(10,2),
    base_cost DECIMAL(10,2),
    overtime_cost DECIMAL(10,2),
    penalty_cost DECIMAL(10,2),
    allowances_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Cost Line Items
CREATE TABLE roster_costs.CostLineItems (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    breakdown_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_costs.ShiftCostBreakdowns(id),
    item_type NVARCHAR(50) NOT NULL,            -- 'base', 'overtime', 'penalty', 'allowance'
    description NVARCHAR(255),
    quantity DECIMAL(10,2),
    rate DECIMAL(10,4),
    amount DECIMAL(10,2)
);

-- Budget Allocations
CREATE TABLE roster_costs.BudgetAllocations (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id UNIQUEIDENTIFIER NOT NULL,
    centre_id UNIQUEIDENTIFIER NOT NULL REFERENCES roster_core.Centres(id),
    fiscal_year INT NOT NULL,
    fiscal_month INT NOT NULL,
    allocated_budget DECIMAL(12,2),
    actual_spend DECIMAL(12,2),
    variance DECIMAL(12,2),
    variance_reason NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- =============================================
-- INDEXES
-- =============================================

-- Core indexes
CREATE INDEX IX_Centres_TenantId ON roster_core.Centres(tenant_id);
CREATE INDEX IX_Rooms_CentreId ON roster_core.Rooms(centre_id);
CREATE INDEX IX_GeofenceZones_CentreId ON roster_core.GeofenceZones(centre_id);

-- Staff indexes
CREATE INDEX IX_Staff_TenantId ON roster_staff.Staff(tenant_id);
CREATE INDEX IX_Staff_DefaultCentre ON roster_staff.Staff(default_centre_id);
CREATE INDEX IX_StaffQualifications_StaffId ON roster_staff.StaffQualifications(staff_id);
CREATE INDEX IX_StaffQualifications_ExpiryDate ON roster_staff.StaffQualifications(expiry_date);
CREATE INDEX IX_StaffAvailability_StaffId ON roster_staff.StaffAvailability(staff_id);

-- Shift indexes
CREATE INDEX IX_Shifts_TenantId ON roster_shifts.Shifts(tenant_id);
CREATE INDEX IX_Shifts_CentreId ON roster_shifts.Shifts(centre_id);
CREATE INDEX IX_Shifts_RoomId ON roster_shifts.Shifts(room_id);
CREATE INDEX IX_Shifts_StaffId ON roster_shifts.Shifts(staff_id);
CREATE INDEX IX_Shifts_ShiftDate ON roster_shifts.Shifts(shift_date);
CREATE INDEX IX_Shifts_Status ON roster_shifts.Shifts(status);
CREATE INDEX IX_Shifts_RecurrenceGroup ON roster_shifts.Shifts(recurrence_group_id);
CREATE INDEX IX_OpenShifts_CentreId ON roster_shifts.OpenShifts(centre_id);
CREATE INDEX IX_OpenShifts_Date ON roster_shifts.OpenShifts(shift_date);

-- Recurring indexes
CREATE INDEX IX_RecurringPatterns_TenantId ON roster_recurring.RecurringPatterns(tenant_id);
CREATE INDEX IX_RecurringPatterns_CentreId ON roster_recurring.RecurringPatterns(centre_id);
CREATE INDEX IX_RecurringPatterns_Active ON roster_recurring.RecurringPatterns(is_active);

-- Attendance indexes
CREATE INDEX IX_ClockEvents_ShiftId ON roster_attendance.ClockEvents(shift_id);
CREATE INDEX IX_ClockEvents_StaffId ON roster_attendance.ClockEvents(staff_id);
CREATE INDEX IX_ClockEvents_ActualTime ON roster_attendance.ClockEvents(actual_time);
CREATE INDEX IX_AttendanceRecords_ShiftId ON roster_attendance.AttendanceRecords(shift_id);
CREATE INDEX IX_AttendanceRecords_StaffId ON roster_attendance.AttendanceRecords(staff_id);

-- Compliance indexes
CREATE INDEX IX_ComplianceFlags_CentreId ON roster_compliance.ComplianceFlags(centre_id);
CREATE INDEX IX_ComplianceFlags_Date ON roster_compliance.ComplianceFlags(flag_date);
CREATE INDEX IX_ComplianceFlags_Severity ON roster_compliance.ComplianceFlags(severity);
CREATE INDEX IX_RatioSnapshots_RoomId ON roster_compliance.RatioSnapshots(room_id);
CREATE INDEX IX_RatioSnapshots_Date ON roster_compliance.RatioSnapshots(snapshot_date);

-- Fatigue indexes
CREATE INDEX IX_FatigueScores_StaffId ON roster_fatigue.FatigueScores(staff_id);
CREATE INDEX IX_FatigueViolations_StaffId ON roster_fatigue.FatigueViolations(staff_id);
CREATE INDEX IX_FatigueViolations_Severity ON roster_fatigue.FatigueViolations(severity);

-- Leave indexes
CREATE INDEX IX_TimeOffRequests_StaffId ON roster_leave.TimeOffRequests(staff_id);
CREATE INDEX IX_TimeOffRequests_Status ON roster_leave.TimeOffRequests(status);
CREATE INDEX IX_TimeOffRequests_Dates ON roster_leave.TimeOffRequests(start_date, end_date);
CREATE INDEX IX_LeaveEntitlements_StaffId ON roster_leave.LeaveEntitlements(staff_id);

-- Demand indexes
CREATE INDEX IX_DemandData_RoomId ON roster_demand.DemandData(room_id);
CREATE INDEX IX_DemandData_Date ON roster_demand.DemandData(booking_date);
CREATE INDEX IX_DemandForecasts_CentreId ON roster_demand.DemandForecasts(centre_id);
CREATE INDEX IX_ExternalFactors_Dates ON roster_demand.ExternalFactors(start_date, end_date);

-- Notification indexes
CREATE INDEX IX_RosterPublications_CentreId ON roster_notifications.RosterPublications(centre_id);
CREATE INDEX IX_ShiftNotifications_StaffId ON roster_notifications.ShiftNotifications(staff_id);
CREATE INDEX IX_SwapRequests_ShiftId ON roster_notifications.SwapRequests(shift_id);
CREATE INDEX IX_SwapRequests_Status ON roster_notifications.SwapRequests(status);

-- Cost indexes
CREATE INDEX IX_RosterCostSummaries_CentreId ON roster_costs.RosterCostSummaries(centre_id);
CREATE INDEX IX_RosterCostSummaries_Week ON roster_costs.RosterCostSummaries(week_start, week_end);
CREATE INDEX IX_ShiftCostBreakdowns_ShiftId ON roster_costs.ShiftCostBreakdowns(shift_id);

-- =============================================
-- END OF ROSTER MODULE SCHEMA
-- =============================================
`;

export const rosterTableCount = 65;
export const rosterSchemaCount = 11;
