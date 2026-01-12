# Roster Scheduling Module - Functional Requirements Document

**Version:** 1.0  
**Last Updated:** January 2026  
**Module:** Staff Roster Scheduler  
**Industry:** Early Childhood Education (Childcare Centres)

---

## Table of Contents

1. [Overview](#1-overview)
2. [User Roles & Permissions](#2-user-roles--permissions)
3. [Core Entities](#3-core-entities)
4. [Functional Requirements](#4-functional-requirements)
5. [Business Rules & Constraints](#5-business-rules--constraints)
6. [Compliance Engine](#6-compliance-engine)
7. [Conflict Detection Rules](#7-conflict-detection-rules)
8. [Budget Management](#8-budget-management)
9. [Award Interpretation](#9-award-interpretation)
10. [Notifications & Alerts](#10-notifications--alerts)
11. [Reporting & Export](#11-reporting--export)
12. [Integration Points](#12-integration-points)

---

## 1. Overview

### 1.1 Purpose
The Roster Scheduling Module enables childcare centre managers to create, manage, and publish staff rosters while ensuring compliance with:
- Australian Early Childhood Education regulations (staff-to-child ratios)
- Fair Work Australia Modern Awards (pay rates, penalties, allowances)
- Individual staff availability and preferences
- Centre budget constraints

### 1.2 Key Objectives
- Optimize staff scheduling to meet child demand forecasts
- Maintain regulatory compliance (ratios, qualifications)
- Control labor costs within budget parameters
- Minimize scheduling conflicts and overtime
- Enable AI-assisted roster generation

### 1.3 Scope
The module covers:
- Multi-centre roster management
- Staff shift assignment and management
- Open shift management
- Leave request handling
- Shift swapping
- Budget tracking and forecasting
- Compliance monitoring
- Template-based scheduling

---

## 2. User Roles & Permissions

### 2.1 Staff Roles

| Role | Code | Description | Typical Qualifications |
|------|------|-------------|------------------------|
| Lead Educator | `lead_educator` | Room leader, responsible for educational program | Diploma ECE / Bachelor ECE |
| Educator | `educator` | Qualified childcare worker | Certificate III / Diploma |
| Assistant | `assistant` | Support staff, works under supervision | Working with Children Check |
| Cook | `cook` | Kitchen staff, meal preparation | Food Safety Certificate |
| Admin | `admin` | Administrative support | N/A |

### 2.2 Employment Types

| Type | Description | Award Loading |
|------|-------------|---------------|
| Permanent | Full-time or part-time contracted staff | Base rate |
| Casual | On-demand staff with no guaranteed hours | +25% casual loading |

### 2.3 Agency Staff Sources

| Agency Code | Agency Name |
|-------------|-------------|
| `anzuk` | Anzuk |
| `randstad` | Randstad |
| `quickcare` | Quick Care |
| `hays` | Hays |
| `internal` | Internal Pool |

---

## 3. Core Entities

### 3.1 Centre
```typescript
{
  id: string;
  name: string;
  code: string;                    // Short code (e.g., "BRC", "SSC")
  rooms: Room[];
  address: string;
  operatingHours: {
    start: string;                 // e.g., "06:30"
    end: string;                   // e.g., "18:30"
  };
}
```

### 3.2 Room
```typescript
{
  id: string;
  name: string;
  centreId: string;
  ageGroup: 'nursery' | 'toddler' | 'preschool' | 'kindy';
  capacity: number;                // Maximum children
  requiredRatio: number;           // Children per educator
  minQualifiedStaff: number;       // Minimum diploma-qualified staff
}
```

### 3.3 Age Group Configurations

| Age Group | Age Range | Staff:Child Ratio | Typical Capacity |
|-----------|-----------|-------------------|------------------|
| Nursery | 0-2 years | 1:4 | 8-12 children |
| Toddler | 2-3 years | 1:5 | 10-15 children |
| Preschool | 3-4 years | 1:10 | 20-22 children |
| Kindy | 4-5 years | 1:11 | 22 children |

### 3.4 Staff Member
```typescript
{
  id: string;
  name: string;
  avatar?: string;
  role: StaffRole;
  employmentType: 'permanent' | 'casual';
  agency?: AgencyType;
  qualifications: Qualification[];
  hourlyRate: number;
  overtimeRate: number;
  maxHoursPerWeek: number;
  currentWeeklyHours: number;
  preferredCentres: string[];
  availability: DayAvailability[];
  timeOff?: TimeOff[];
  schedulingPreferences?: SchedulingPreferences;
}
```

### 3.5 Qualification Types

| Code | Name | Expiry Tracked |
|------|------|----------------|
| `diploma_ece` | Diploma Early Childhood Education | No |
| `certificate_iii` | Certificate III in Early Childhood | No |
| `bachelor_ece` | Bachelor of Early Childhood Education | No |
| `masters_ece` | Masters in Early Childhood Education | No |
| `first_aid` | First Aid Certificate | Yes (annual) |
| `food_safety` | Food Safety Certificate | Yes (3 years) |
| `working_with_children` | Working with Children Check | Yes (5 years) |

### 3.6 Shift
```typescript
{
  id: string;
  staffId: string;
  centreId: string;
  roomId: string;
  date: string;                    // YYYY-MM-DD format
  startTime: string;               // HH:MM format
  endTime: string;
  breakMinutes: number;
  status: 'draft' | 'published' | 'confirmed' | 'completed';
  isOpenShift: boolean;
  notes?: string;
}
```

### 3.7 Open Shift
```typescript
{
  id: string;
  centreId: string;
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  requiredQualifications: QualificationType[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  applicants: string[];            // Staff IDs who applied
}
```

### 3.8 Shift Templates

| Template | Start Time | End Time | Break | Use Case |
|----------|------------|----------|-------|----------|
| Early | 06:30 | 14:30 | 30 min | Opening staff |
| Mid | 09:00 | 17:00 | 30 min | Core hours coverage |
| Late | 10:30 | 18:30 | 30 min | Closing staff |
| Short | 09:00 | 15:00 | 0 min | Part-time/casual |
| Full Day | 07:00 | 18:00 | 60 min | Extended coverage |

### 3.9 Leave/Time Off
```typescript
{
  id: string;
  staffId: string;
  startDate: string;
  endDate: string;
  type: 'annual_leave' | 'sick_leave' | 'personal_leave' | 'unpaid_leave';
  status: 'approved' | 'pending' | 'rejected';
  notes?: string;
}
```

---

## 4. Functional Requirements

### 4.1 Roster Views

#### FR-4.1.1 View Modes
The system SHALL support the following roster view modes:
- **Day View**: Single day with hourly timeline
- **Week View**: 7-day grid (Monday-Sunday)
- **Fortnight View**: 14-day grid (compact display)
- **Month View**: Full month overview (compact display)

#### FR-4.1.2 Timeline Grid
The system SHALL display:
- Rows for each room in the selected centre
- Columns for each date in the view period
- Shift cards showing staff assignments
- Open shift indicators for unfilled positions
- Demand data overlay (optional)
- Compliance flags for issues

#### FR-4.1.3 Staff Timeline Grid
The system SHALL provide an alternate view showing:
- Rows grouped by room, then by staff member
- All shifts for each staff member visible in their row
- Drag-and-drop capability for shift reassignment
- Staff search and filtering

### 4.2 Shift Management

#### FR-4.2.1 Create Shift
The system SHALL allow creating shifts by:
- Drag-and-drop from staff panel to grid cell
- Click "Add Shift" button in grid cell
- Select from predefined shift templates
- Custom time entry

#### FR-4.2.2 Edit Shift
The system SHALL allow editing:
- Start and end times
- Break duration
- Room assignment
- Notes
- Status

#### FR-4.2.3 Delete Shift
The system SHALL:
- Allow shift deletion with confirmation
- Track deletion in history for undo capability
- Update cost calculations immediately

#### FR-4.2.4 Duplicate Shift
The system SHALL allow duplicating shifts to:
- Same day (different room)
- Different days in the same week
- Via bulk assignment modal

#### FR-4.2.5 Shift Status Workflow
```
draft → published → confirmed → completed
```

| Status | Description | Editable | Visible to Staff |
|--------|-------------|----------|------------------|
| Draft | Not yet published | Yes | No |
| Published | Visible to staff | Yes | Yes |
| Confirmed | Staff acknowledged | Limited | Yes |
| Completed | Shift worked | No | Yes |

### 4.3 Open Shift Management

#### FR-4.3.1 Create Open Shift
The system SHALL allow creating open shifts with:
- Required qualifications
- Urgency level (low/medium/high/critical)
- Time requirements

#### FR-4.3.2 Fill Open Shift
The system SHALL support:
- Drag-and-drop staff assignment
- Click to assign from staff list
- AI-suggested optimal assignment
- Applicant tracking (staff who express interest)

### 4.4 Leave Management

#### FR-4.4.1 Leave Request
Staff MAY submit leave requests specifying:
- Leave type (annual/sick/personal/unpaid)
- Start and end dates
- Notes/reason

#### FR-4.4.2 Leave Approval
Managers SHALL be able to:
- Approve or reject leave requests
- View impact on roster coverage
- See pending requests in alert panel

### 4.5 Shift Swapping

#### FR-4.5.1 Initiate Swap
The system SHALL allow:
- Staff to propose shift swaps
- Select target shift and replacement staff
- Manager approval workflow

#### FR-4.5.2 Swap Validation
Before completing swap, system SHALL verify:
- Both staff are qualified for swapped shifts
- No scheduling conflicts created
- Overtime limits not exceeded

### 4.6 Template Management

#### FR-4.6.1 Save Roster Template
The system SHALL allow saving current roster as template with:
- Template name
- Description
- Tags for categorization
- Option to include open shifts

#### FR-4.6.2 Apply Roster Template
The system SHALL allow applying templates with options:
- Target week selection
- Conflict resolution (skip/overwrite)
- Staff mapping (when staff differ)

### 4.7 Bulk Operations

#### FR-4.7.1 Copy Week
The system SHALL allow copying all shifts from:
- Previous week to current week
- Any saved template

#### FR-4.7.2 Bulk Assignment
The system SHALL support assigning multiple shifts:
- Select staff member
- Select multiple dates
- Select room and shift template
- Apply with single action

### 4.8 Undo/Redo

#### FR-4.8.1 History Tracking
The system SHALL maintain history of:
- Shift additions
- Shift modifications
- Shift deletions
- Bulk operations

#### FR-4.8.2 Undo/Redo Actions
The system SHALL support:
- Keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z)
- Up to 50 history entries
- History panel showing all changes
- Revert to any point in history

---

## 5. Business Rules & Constraints

### 5.1 Regulatory Compliance Rules

#### BR-5.1.1 Staff-to-Child Ratios
The system SHALL enforce minimum staff-to-child ratios:

| Age Group | Maximum Children per Educator |
|-----------|-------------------------------|
| Nursery (0-2) | 4 |
| Toddler (2-3) | 5 |
| Preschool (3-4) | 10 |
| Kindy (4-5) | 11 |

**Calculation**: `Required Staff = CEILING(Booked Children / Ratio)`

#### BR-5.1.2 Qualification Requirements
- Each room MUST have at least one diploma-qualified educator during operating hours
- First aid certified staff MUST be present at all times
- Working with Children Check is REQUIRED for all staff

#### BR-5.1.3 Operating Hours
- Staff shifts MUST fall within centre operating hours
- Operating hours typically: 06:30 - 18:30

### 5.2 Staff Scheduling Rules

#### BR-5.2.1 Maximum Hours
- Default maximum: 38 hours/week (permanent full-time)
- Configurable per staff member
- Overtime triggered beyond threshold

#### BR-5.2.2 Minimum Rest Period
- Minimum 10 hours rest between shifts (default)
- Configurable per staff member (8-12 hours)

#### BR-5.2.3 Maximum Consecutive Days
- Default: 5 consecutive working days
- Configurable per staff member (3-7 days)

#### BR-5.2.4 Availability Constraints
- Staff can only be scheduled during available hours
- Availability defined per day of week
- Override possible with warning

#### BR-5.2.5 Leave Blocking
- Staff on approved leave CANNOT be scheduled
- No override allowed

### 5.3 Shift Rules

#### BR-5.3.1 Shift Overlap Prevention
- A staff member CANNOT have overlapping shifts on the same day
- No override allowed

#### BR-5.3.2 Break Requirements
```
Shift Duration >= 5 hours → Minimum 30 min unpaid break
Shift Duration >= 7.6 hours → Minimum 30 min unpaid break (may require second break)
```

#### BR-5.3.3 Split Shifts
- Split shift allowance payable when break exceeds 1 hour
- Maximum 2 shifts per day

---

## 6. Compliance Engine

### 6.1 Compliance Flag Types

| Flag Type | Severity | Description |
|-----------|----------|-------------|
| `ratio_breach` | Critical | Insufficient staff for booked children |
| `qualification_gap` | Critical | No qualified staff in room |
| `no_first_aid` | Critical | No first aid certified staff on duty |
| `understaffed` | Warning | Below optimal staffing levels |
| `overtime_warning` | Warning | Staff approaching/exceeding overtime |
| `break_violation` | Warning | Required break not scheduled |
| `certificate_expiring` | Info | Qualification expiring within 30 days |

### 6.2 Compliance Checking Trigger Points
- On shift creation
- On shift modification
- On shift deletion
- On demand data update
- On roster publish (full validation)

### 6.3 Compliance Flag Structure
```typescript
{
  id: string;
  type: ComplianceFlagType;
  severity: 'info' | 'warning' | 'critical';
  centreId: string;
  roomId?: string;
  date: string;
  timeSlot?: string;
  message: string;
  affectedStaff?: string[];
}
```

---

## 7. Conflict Detection Rules

### 7.1 Conflict Types

| Type | Severity | Can Override | Description |
|------|----------|--------------|-------------|
| `overlap` | Error | No | Shifts overlap on same day |
| `outside_availability` | Error/Warning | Yes | Outside available hours |
| `overtime_exceeded` | Warning | Yes | Exceeds weekly hour limit |
| `insufficient_rest` | Warning | Yes | Less than minimum rest between shifts |
| `max_consecutive_days` | Warning | Yes | Exceeds max consecutive work days |
| `on_leave` | Error | No | Scheduled during approved leave |
| `qualification_missing` | Warning | No | Missing required qualification |
| `preferred_room_violated` | Warning | Yes | Assigned to avoided room |

### 7.2 Conflict Detection Algorithm

```
FOR each new/modified shift:
  1. Check for overlapping shifts (same staff, same day)
  2. Validate against staff availability
  3. Calculate weekly hours including this shift
  4. Check leave records for date
  5. Calculate rest hours from adjacent days
  6. Count consecutive work days
  7. Check room preferences
  8. Verify required qualifications
  
RETURN list of detected conflicts with severity
```

### 7.3 Conflict Resolution
- **Error-level conflicts**: Block action, require resolution
- **Warning-level conflicts**: Allow with confirmation, log override
- **All conflicts**: Display in Conflict Panel for review

---

## 8. Budget Management

### 8.1 Budget Settings

#### 8.1.1 Core Budget Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `weeklyBudget` | Currency | $7,000 | Total weekly labor budget |
| `overtimeThreshold` | Hours | 38 | Weekly hours before overtime |
| `maxAgencyPercent` | Percent | 25% | Maximum agency staff cost |

#### 8.1.2 Cost Controls
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `minStaffingCostFloor` | Currency | $500 | Alert if daily cost below this |
| `weekendPenaltyRate` | Multiplier | 1.5x | Saturday rate multiplier |
| `publicHolidayPenaltyRate` | Multiplier | 2.5x | Public holiday multiplier |
| `mealAllowanceBudget` | Currency | $200 | Weekly meal allowance budget |
| `travelAllowanceBudget` | Currency | $150 | Weekly travel allowance budget |

#### 8.1.3 Staffing Thresholds
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `minCasualPercent` | Percent | 10% | Minimum casual staff ratio |
| `maxCasualPercent` | Percent | 40% | Maximum casual staff ratio |
| `maxTraineePercent` | Percent | 15% | Maximum trainee/student ratio |
| `minLeadEducatorsPerRoom` | Number | 1 | Minimum lead educators per room |

#### 8.1.4 Time-Based Budgets
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enableDailyBudgetCaps` | Boolean | false | Enable per-day budget limits |
| `dailyBudgetCaps` | Object | {Mon-Fri: weeklyBudget/5} | Per-day budget caps |
| `earlyShiftPremium` | Currency | $5/hour | Premium for shifts before 7am |
| `lateShiftPremium` | Currency | $8/hour | Premium for shifts after 6pm |
| `splitShiftAllowance` | Currency | $25 | Allowance for split shifts |

#### 8.1.5 Forecasting Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `budgetVarianceTolerance` | Percent | 10% | Acceptable deviation before alert |
| `schoolHolidayBudgetMultiplier` | Multiplier | 1.2x | Budget adjustment for school holidays |
| `yearOverYearTarget` | Percent | -3% | Target cost reduction YoY |

### 8.2 Cost Calculation

#### 8.2.1 Regular Hours Cost
```
Regular Cost = SUM(staff hours within threshold × hourly rate)
```

#### 8.2.2 Overtime Cost
```
Overtime Cost = SUM(staff hours over threshold × overtime rate)
Overtime Rate = Base Rate × 1.5 (first 2 hours) or × 2.0 (thereafter)
```

#### 8.2.3 Penalty Rates
Applied automatically based on:
- Saturday work (1.5x)
- Sunday work (2.0x)
- Public holidays (2.5x)
- Evening work after 6pm (1.1x - 1.15x)

### 8.3 Budget Tracking Display
- Real-time cost tracker bar
- Budget utilization percentage
- Color-coded status (green/yellow/red)
- Breakdown: Regular | Overtime | Total
- Comparison to weekly budget

---

## 9. Award Interpretation

### 9.1 Applicable Award
**Children's Services Award 2020** (MA000120)
- Effective Date: July 2024
- Casual Loading: 25%

### 9.2 Classification Levels

| Level | Description | Base Rate/Hour |
|-------|-------------|----------------|
| 1.1 | Support Worker - Entry | $22.46 |
| 2.1 | Children's Services - Entry | $24.44 |
| 3.1 | Qualified (Cert III) | $26.98 |
| 4.1 | Diploma Qualified | $30.28 |
| 5.1 | Bachelor/ECT | $34.60 |
| 6.1 | Director - Small | $40.14 |

### 9.3 Penalty Rates

| Condition | Rate |
|-----------|------|
| Saturday | 150% |
| Sunday | 200% |
| Public Holiday | 250% |
| Evening (after 6pm) | 110% |

### 9.4 Overtime Rates

| Condition | Rate |
|-----------|------|
| First 2 hours | 150% |
| After 2 hours | 200% |
| Sunday overtime | 200% |

### 9.5 Allowances

| Allowance | Type | Amount |
|-----------|------|--------|
| First Aid | Per week | $18.93 |
| Educational Leader | Per hour | $2.34 |
| Responsible Person | Per hour | $1.50 |
| Vehicle | Per km | $0.96 |
| Laundry | Per week | $6.30 |

---

## 10. Notifications & Alerts

### 10.1 Notification Types

| Type | Trigger | Recipients |
|------|---------|------------|
| `shift_published` | Roster published | Affected staff |
| `shift_swapped` | Swap approved | Both staff involved |
| `open_shift_available` | New open shift | Qualified staff |
| `shift_reminder` | 24h before shift | Assigned staff |
| `leave_approved` | Leave request approved | Requesting staff |
| `leave_rejected` | Leave request rejected | Requesting staff |

### 10.2 Delivery Channels
- Email
- SMS
- Push notification (mobile app)

### 10.3 Alert Triggers

| Alert | Condition | Severity |
|-------|-----------|----------|
| Budget Exceeded | Cost > Budget | Critical |
| Near Budget | Cost > 90% Budget | Warning |
| Overtime Excess | Staff > threshold | Warning |
| Ratio Breach | Insufficient staff | Critical |
| Qualification Gap | No qualified staff | Critical |
| Certificate Expiring | Expiry < 30 days | Info |

---

## 11. Reporting & Export

### 11.1 Export Formats

#### 11.1.1 PDF Export
Includes:
- Centre and date range header
- Room-by-room schedule grid
- Staff assignment details
- Cost summary
- Compliance status

#### 11.1.2 Excel Export
Includes:
- Multiple worksheets (Overview, By Room, By Staff)
- Shift details with formulas
- Cost calculations
- Pivot-ready data structure

### 11.2 Print View
- Optimized for A4/Letter printing
- Condensed grid layout
- Black and white friendly
- Essential information only

### 11.3 Weekly Summary Dashboard
- Total hours by staff
- Cost breakdown
- Compliance status
- Open shifts remaining
- Leave summary

### 11.4 Optimization Report
- Staffing efficiency metrics
- Cost optimization suggestions
- AI-generated recommendations
- Trend analysis

---

## 12. Integration Points

### 12.1 Data Sources

| Source | Data | Sync Frequency |
|--------|------|----------------|
| Child Bookings | Booked children per room/day | Real-time |
| Staff Database | Employee records, qualifications | Real-time |
| Time & Attendance | Actual hours worked | Daily |
| Payroll | Pay rates, allowances | On change |

### 12.2 External Systems

| System | Integration Type | Purpose |
|--------|------------------|---------|
| Payroll | Export | Timesheet data for pay processing |
| Booking System | Import | Child attendance forecasts |
| HR System | Bidirectional | Staff records, qualifications |
| Notification Service | Push | Email/SMS delivery |

### 12.3 Calendar Integration
- Public holiday calendar (Australian federal + state)
- School holiday calendar (state-specific)
- Centre-specific events

#### 12.3.1 Holiday Types
| Type | Display | Cost Impact |
|------|---------|-------------|
| Public Holiday | Red flag icon | 2.5x penalty rate |
| School Holiday | Graduation cap icon | Budget multiplier (1.2x) |
| Centre Event | Calendar icon | Staffing impact varies |

#### 12.3.2 Event Types
| Code | Label | Example |
|------|-------|---------|
| `staff_meeting` | Staff Meeting | Weekly team meeting |
| `training` | Training | First aid course |
| `inspection` | Inspection | ACECQA audit |
| `celebration` | Celebration | Birthday party |
| `excursion` | Excursion | Zoo trip |
| `parent_event` | Parent Event | Open day |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| ACECQA | Australian Children's Education and Care Quality Authority |
| ECE | Early Childhood Education |
| ECT | Early Childhood Teacher |
| Open Shift | Unfilled shift requiring staff assignment |
| Ratio | Staff-to-child ratio required by regulation |
| WWC | Working with Children Check |

---

## Appendix B: State-Specific Considerations

### B.1 Victoria (VIC)
- Queen's Birthday: Second Monday of June
- Melbourne Cup Day: First Tuesday of November (metro only)
- School terms: 4 terms per year

### B.2 New South Wales (NSW)
- Queen's Birthday: Second Monday of June
- Bank Holiday: First Monday of August

### B.3 Queensland (QLD)
- Royal Queensland Show (Brisbane): Second Wednesday of August
- Queen's Birthday: First Monday of October

---

## Appendix C: Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2026 | System | Initial document generation |

---

*This document is auto-generated based on the implemented roster scheduling module codebase.*
