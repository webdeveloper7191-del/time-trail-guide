// Roster Module - Software Requirements Specification

export interface UserStory {
  id: string;
  title: string;
  actors: string[];
  description: string;
  acceptanceCriteria: string[];
  businessLogic: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  relatedModules: { module: string; relationship: string }[];
  endToEndJourney: string[];
  realWorldExample: {
    scenario: string;
    steps: string[];
    outcome: string;
  };
}

export interface FieldSpec {
  name: string;
  type: string;
  mandatory: boolean;
  description: string;
  validation?: string;
  defaultValue?: string;
  foreignKey?: string;
}

export interface TableSpec {
  name: string;
  schema: string;
  description: string;
  fields: FieldSpec[];
}

export interface ModuleSRS {
  moduleName: string;
  version: string;
  lastUpdated: string;
  overview: string;
  objectives: string[];
  scope: string[];
  outOfScope: string[];
  actors: { name: string; description: string; permissions: string[] }[];
  functionalRequirements: { id: string; category: string; requirement: string; priority: string }[];
  nonFunctionalRequirements: { id: string; category: string; requirement: string }[];
  userStories: UserStory[];
  tableSpecs: TableSpec[];
  integrations: { system: string; type: string; description: string }[];
  businessRules: { id: string; rule: string; rationale: string }[];
}

export const rosterSRS: ModuleSRS = {
  moduleName: "Roster & Workforce Scheduling",
  version: "1.0.0",
  lastUpdated: "2026-01-30",
  overview: `The Roster & Workforce Scheduling module provides comprehensive workforce management capabilities for childcare centres. It enables centre managers to create, manage, and optimize staff schedules while ensuring compliance with National Quality Framework (NQF) ratios, fatigue management regulations, and Australian employment awards. The system supports multi-centre operations, agency staff integration, GPS-validated time and attendance, and AI-powered schedule optimization.`,
  
  objectives: [
    "Reduce manual scheduling effort by 70% through automation and templates",
    "Ensure 100% compliance with NQF educator-to-child ratios",
    "Minimize overtime costs through intelligent scheduling optimization",
    "Provide real-time visibility into staffing levels and compliance status",
    "Enable staff self-service for availability, leave requests, and shift swaps",
    "Integrate seamlessly with payroll through accurate time and attendance tracking",
    "Support multi-location operations with cross-centre staff deployment"
  ],

  scope: [
    "Centre and room configuration with capacity and ratio settings",
    "Staff profile management including qualifications and availability",
    "Shift creation, assignment, and template management",
    "Recurring shift pattern automation",
    "Open shift broadcasting and claim workflow",
    "GPS-validated clock in/out with geofencing",
    "Break scheduling with coverage validation",
    "Leave request and approval workflow",
    "Fatigue management and compliance monitoring",
    "NQF ratio compliance tracking and alerting",
    "Demand forecasting with external factor integration",
    "Cost tracking and budget variance analysis",
    "Roster publishing and staff notifications",
    "Shift swap request management"
  ],

  outOfScope: [
    "Payroll processing and payment disbursement",
    "Child enrollment and booking management",
    "Parent communication and billing",
    "HR onboarding and offboarding workflows",
    "Learning management for staff training"
  ],

  actors: [
    {
      name: "Centre Manager",
      description: "Responsible for day-to-day operations of a single childcare centre, including roster creation and staff management",
      permissions: [
        "Create, edit, and delete shifts for assigned centre",
        "Approve/reject leave requests and shift swaps",
        "View and manage staff availability",
        "Publish rosters and send notifications",
        "Override compliance warnings with justification",
        "Access cost and budget reports for centre"
      ]
    },
    {
      name: "Area Manager",
      description: "Oversees multiple centres within a region, with visibility across locations",
      permissions: [
        "All Centre Manager permissions across multiple centres",
        "Deploy staff across centres within region",
        "Access consolidated reporting and analytics",
        "Configure regional settings and policies",
        "Approve cross-centre transfers"
      ]
    },
    {
      name: "Educator (Staff)",
      description: "Front-line childcare worker who works assigned shifts and interacts with children",
      permissions: [
        "View own roster and upcoming shifts",
        "Submit availability and preferences",
        "Request time off and submit leave applications",
        "Clock in/out via mobile app",
        "Apply for open shifts",
        "Request shift swaps with colleagues"
      ]
    },
    {
      name: "Lead Educator",
      description: "Senior educator with room leadership responsibilities",
      permissions: [
        "All Educator permissions",
        "View room roster and coverage",
        "Record break times for team members",
        "Flag compliance issues",
        "Approve minor shift adjustments"
      ]
    },
    {
      name: "HR Administrator",
      description: "Manages staff records, qualifications, and employment details",
      permissions: [
        "Manage staff profiles and employment records",
        "Track and update qualifications and certifications",
        "Configure pay rates and classifications",
        "Access audit logs and compliance reports",
        "Manage agency staff records"
      ]
    },
    {
      name: "System Administrator",
      description: "Technical administrator responsible for system configuration",
      permissions: [
        "Configure centres, rooms, and geofence zones",
        "Set up shift templates and roster templates",
        "Configure fatigue rules and compliance thresholds",
        "Manage integrations and API access",
        "Access all system logs and diagnostics"
      ]
    },
    {
      name: "Agency Coordinator",
      description: "External agency representative who manages agency staff placements",
      permissions: [
        "View open shifts available for agency staff",
        "Assign agency workers to open shifts",
        "Update agency staff availability",
        "View timesheet reports for agency staff"
      ]
    }
  ],

  functionalRequirements: [
    { id: "FR-RST-001", category: "Centre Setup", requirement: "System shall allow configuration of multiple centres with unique operating hours, rooms, and capacity settings", priority: "Critical" },
    { id: "FR-RST-002", category: "Centre Setup", requirement: "System shall support room configuration with age groups, capacity limits, and NQF ratio requirements", priority: "Critical" },
    { id: "FR-RST-003", category: "Centre Setup", requirement: "System shall allow definition of geofence zones for GPS-based clock validation", priority: "High" },
    { id: "FR-RST-004", category: "Staff Management", requirement: "System shall maintain staff profiles with employment type, role, qualifications, and pay rates", priority: "Critical" },
    { id: "FR-RST-005", category: "Staff Management", requirement: "System shall track qualification expiry dates and generate alerts 30/60/90 days before expiry", priority: "High" },
    { id: "FR-RST-006", category: "Staff Management", requirement: "System shall allow staff to define weekly availability with start/end times per day", priority: "High" },
    { id: "FR-RST-007", category: "Staff Management", requirement: "System shall support alternate week availability patterns with configurable anchor dates", priority: "Medium" },
    { id: "FR-RST-008", category: "Shift Management", requirement: "System shall allow creation of shifts with date, time, room, and staff assignment", priority: "Critical" },
    { id: "FR-RST-009", category: "Shift Management", requirement: "System shall support shift templates for rapid shift creation", priority: "High" },
    { id: "FR-RST-010", category: "Shift Management", requirement: "System shall detect and prevent scheduling conflicts (overlapping shifts, outside availability)", priority: "Critical" },
    { id: "FR-RST-011", category: "Recurring Shifts", requirement: "System shall support creation of recurring shift patterns (daily, weekly, fortnightly, monthly)", priority: "High" },
    { id: "FR-RST-012", category: "Recurring Shifts", requirement: "System shall auto-generate future shifts based on recurring patterns", priority: "High" },
    { id: "FR-RST-013", category: "Recurring Shifts", requirement: "System shall allow bulk editing of all future instances in a recurring series", priority: "Medium" },
    { id: "FR-RST-014", category: "Open Shifts", requirement: "System shall allow creation of unassigned open shifts for staff to claim", priority: "High" },
    { id: "FR-RST-015", category: "Open Shifts", requirement: "System shall filter eligible staff for open shifts based on qualifications and availability", priority: "High" },
    { id: "FR-RST-016", category: "Open Shifts", requirement: "System shall notify eligible staff when new open shifts are posted", priority: "Medium" },
    { id: "FR-RST-017", category: "Time & Attendance", requirement: "System shall capture clock in/out events with timestamp and GPS coordinates", priority: "Critical" },
    { id: "FR-RST-018", category: "Time & Attendance", requirement: "System shall validate clock events against geofence zones and flag violations", priority: "High" },
    { id: "FR-RST-019", category: "Time & Attendance", requirement: "System shall calculate worked hours and variance from scheduled hours", priority: "Critical" },
    { id: "FR-RST-020", category: "Break Management", requirement: "System shall schedule breaks based on shift duration and award requirements", priority: "High" },
    { id: "FR-RST-021", category: "Break Management", requirement: "System shall validate room coverage during scheduled breaks", priority: "High" },
    { id: "FR-RST-022", category: "Leave Management", requirement: "System shall allow staff to submit leave requests with type and date range", priority: "High" },
    { id: "FR-RST-023", category: "Leave Management", requirement: "System shall track leave entitlements and balances by leave type", priority: "High" },
    { id: "FR-RST-024", category: "Leave Management", requirement: "System shall prevent shift assignment on approved leave dates", priority: "Critical" },
    { id: "FR-RST-025", category: "Compliance", requirement: "System shall calculate real-time educator-to-child ratios per room", priority: "Critical" },
    { id: "FR-RST-026", category: "Compliance", requirement: "System shall generate alerts when ratio thresholds are breached or at risk", priority: "Critical" },
    { id: "FR-RST-027", category: "Compliance", requirement: "System shall track qualified vs unqualified educator counts for 50% diploma rule", priority: "Critical" },
    { id: "FR-RST-028", category: "Fatigue Management", requirement: "System shall enforce maximum consecutive days worked limits", priority: "High" },
    { id: "FR-RST-029", category: "Fatigue Management", requirement: "System shall enforce minimum rest hours between shifts", priority: "High" },
    { id: "FR-RST-030", category: "Fatigue Management", requirement: "System shall calculate fatigue scores and flag high-risk staff", priority: "Medium" },
    { id: "FR-RST-031", category: "Publishing", requirement: "System shall allow batch publishing of roster for a date range", priority: "High" },
    { id: "FR-RST-032", category: "Publishing", requirement: "System shall send notifications to affected staff upon roster publication", priority: "High" },
    { id: "FR-RST-033", category: "Swap Requests", requirement: "System shall allow staff to request shift swaps with specific colleagues", priority: "Medium" },
    { id: "FR-RST-034", category: "Swap Requests", requirement: "System shall validate swap eligibility (qualifications, availability) before approval", priority: "Medium" },
    { id: "FR-RST-035", category: "Costing", requirement: "System shall calculate shift costs based on hourly rates, overtime, and penalties", priority: "High" },
    { id: "FR-RST-036", category: "Costing", requirement: "System shall track budget vs actual costs with variance reporting", priority: "High" },
    { id: "FR-RST-037", category: "Demand Forecasting", requirement: "System shall integrate child booking data to forecast staffing needs", priority: "Medium" },
    { id: "FR-RST-038", category: "Demand Forecasting", requirement: "System shall adjust demand forecasts based on external factors (weather, holidays)", priority: "Low" }
  ],

  nonFunctionalRequirements: [
    { id: "NFR-RST-001", category: "Performance", requirement: "Roster grid shall load within 2 seconds for up to 50 staff and 7-day view" },
    { id: "NFR-RST-002", category: "Performance", requirement: "GPS clock event shall be processed within 500ms including geofence validation" },
    { id: "NFR-RST-003", category: "Availability", requirement: "System shall maintain 99.5% uptime during centre operating hours (6AM-7PM)" },
    { id: "NFR-RST-004", category: "Scalability", requirement: "System shall support up to 500 concurrent users across 100 centres" },
    { id: "NFR-RST-005", category: "Security", requirement: "All API endpoints shall require authentication and role-based authorization" },
    { id: "NFR-RST-006", category: "Security", requirement: "GPS coordinates shall be encrypted in transit and at rest" },
    { id: "NFR-RST-007", category: "Compliance", requirement: "All data shall be stored in Australian data centres for privacy compliance" },
    { id: "NFR-RST-008", category: "Usability", requirement: "Mobile clock in/out shall work offline with sync when connectivity restored" },
    { id: "NFR-RST-009", category: "Audit", requirement: "All shift modifications shall be logged with user, timestamp, and change details" },
    { id: "NFR-RST-010", category: "Integration", requirement: "System shall provide REST API for payroll system integration" }
  ],

  userStories: [
    {
      id: "US-RST-001",
      title: "Create Weekly Roster from Template",
      actors: ["Centre Manager"],
      description: "As a Centre Manager, I want to apply a weekly roster template to quickly create a baseline schedule for the upcoming week, so that I can save time on repetitive scheduling tasks.",
      acceptanceCriteria: [
        "Can select from saved roster templates for my centre",
        "Template creates open shifts for each room/day/time combination",
        "Existing shifts on target dates are not overwritten",
        "Confirmation shows count of shifts to be created vs skipped",
        "Created shifts appear in draft status for review before publishing"
      ],
      businessLogic: [
        "Template shifts are created as Open Shifts without staff assignment",
        "Duplicate detection: Skip if matching room + date + start time already exists",
        "Template shifts inherit qualification requirements and role preferences",
        "Shifts are created in 'draft' status, not visible to staff until published"
      ],
      priority: "high",
      relatedModules: [
        { module: "Awards", relationship: "Shift cost preview uses award rates for budget estimation" },
        { module: "Compliance", relationship: "Created shifts trigger ratio compliance pre-check" }
      ],
      endToEndJourney: [
        "1. Centre Manager opens Roster view and selects week starting Monday",
        "2. Clicks 'Apply Template' button in toolbar",
        "3. Selects 'Standard Week' template from dropdown",
        "4. System validates no conflicting shifts exist",
        "5. Preview modal shows 35 shifts to create, 0 skipped",
        "6. Manager confirms application",
        "7. System creates 35 open shifts across 5 rooms × 7 days",
        "8. Roster grid refreshes showing new open shifts",
        "9. Manager begins assigning staff to shifts",
        "10. Once complete, Manager clicks 'Publish' to notify staff"
      ],
      realWorldExample: {
        scenario: "Sarah, Centre Manager at Sunshine Early Learning, prepares the roster for next week. Her centre has 5 rooms with consistent staffing patterns.",
        steps: [
          "Sarah logs in Monday morning to prepare next week's roster",
          "She navigates to the Roster view and clicks 'Apply Template'",
          "Selects 'Standard Week - Full Capacity' template",
          "System shows preview: 35 shifts will be created for Nursery, Toddler, Junior Preschool, Senior Preschool, and Kindy rooms",
          "Sarah confirms and the shifts appear as open (unassigned)",
          "She then drags staff members onto each shift based on their availability",
          "For the Nursery room, she ensures at least one ECT-qualified educator per shift",
          "Once all shifts are assigned, she clicks 'Publish' on Friday afternoon",
          "All staff receive email and app notifications with their schedules"
        ],
        outcome: "The weekly roster is created in 15 minutes instead of 2 hours, with all compliance checks passed automatically."
      }
    },
    {
      id: "US-RST-002",
      title: "Clock In with GPS Validation",
      actors: ["Educator (Staff)"],
      description: "As an Educator, I want to clock in using my mobile phone when I arrive at the centre, so that my attendance is accurately recorded with location verification.",
      acceptanceCriteria: [
        "Can clock in via mobile app with single tap",
        "GPS coordinates are captured automatically",
        "System validates location against centre geofence",
        "Visual confirmation shows clock time and location status",
        "Clock event is recorded even if outside geofence (with warning)",
        "Offline clock-in queues for sync when online"
      ],
      businessLogic: [
        "GPS accuracy must be ≤50 meters for valid location check",
        "Distance calculated using Haversine formula from centre coordinates",
        "Within geofence radius + buffer = 'valid', outside = 'warning'",
        "Clock time rounded to nearest minute for payroll",
        "Early clock-in (>15 min before shift) flagged for review",
        "Device info and IP captured for audit trail"
      ],
      priority: "critical",
      relatedModules: [
        { module: "Awards", relationship: "Clock times determine shift duration for pay calculation" },
        { module: "Compliance", relationship: "Clock events update real-time ratio calculations" }
      ],
      endToEndJourney: [
        "1. Educator Emma arrives at the centre car park at 6:25 AM",
        "2. Opens the staff app on her phone",
        "3. App shows her scheduled shift: 6:30 AM - 2:30 PM in Nursery",
        "4. Taps 'Clock In' button",
        "5. Phone requests GPS permission (if not already granted)",
        "6. App captures coordinates: -33.8688, 151.2093",
        "7. System calculates distance from centre: 45 meters",
        "8. Distance is within 100m geofence + 50m buffer",
        "9. Clock event created: 6:25 AM, status 'valid'",
        "10. App shows confirmation: 'Clocked in at 6:25 AM ✓'",
        "11. Manager dashboard updates to show Emma 'On Shift'"
      ],
      realWorldExample: {
        scenario: "Emma is an educator at Little Stars Childcare. She needs to clock in for her early shift while the building is still locked.",
        steps: [
          "Emma arrives at 6:25 AM, 5 minutes before her shift",
          "She waits in the car park for the Lead Educator to arrive with keys",
          "Opens the staff app and sees her shift details",
          "Taps 'Clock In' - the app shows a spinner briefly",
          "Confirmation appears: 'Clocked in at 6:25 AM - Location verified ✓'",
          "The Lead arrives at 6:28 AM and unlocks the building",
          "Emma enters and begins setting up the Nursery room",
          "At 2:35 PM, she clocks out from inside the building",
          "Her timesheet shows 8 hours 10 minutes worked"
        ],
        outcome: "Accurate attendance record with GPS verification proves Emma was at the centre, even though she clocked in before entering the building."
      }
    },
    {
      id: "US-RST-003",
      title: "Request and Approve Leave",
      actors: ["Educator (Staff)", "Centre Manager"],
      description: "As an Educator, I want to request time off through the system, so that my leave is properly tracked and my shifts can be covered. As a Centre Manager, I want to review and approve leave requests, ensuring adequate coverage before approval.",
      acceptanceCriteria: [
        "Staff can submit leave request with type, dates, and optional notes",
        "System calculates hours/days requested based on typical schedule",
        "Manager receives notification of pending request",
        "Manager can view leave calendar showing all requests",
        "Manager can approve or reject with reason",
        "Approved leave blocks shift assignment for those dates",
        "Leave balance is updated upon approval"
      ],
      businessLogic: [
        "Leave types: Annual, Sick, Personal, Unpaid - each with different balance tracking",
        "Hours calculated based on staff's typical hours (max_hours_per_week / 5)",
        "Pending leave shows as tentative in roster (staff still assignable)",
        "Approved leave creates 'on_leave' block preventing shift assignment",
        "Rejection requires mandatory reason text",
        "Sick leave can be backdated; other types require future dates"
      ],
      priority: "high",
      relatedModules: [
        { module: "Awards", relationship: "Leave loading percentages applied to Annual Leave payouts" },
        { module: "Performance", relationship: "Excessive sick leave may trigger performance conversation" }
      ],
      endToEndJourney: [
        "1. Educator John plans a family holiday in school holidays",
        "2. Opens staff app 6 weeks in advance",
        "3. Navigates to 'Leave' section",
        "4. Taps 'Request Leave' button",
        "5. Selects 'Annual Leave' type",
        "6. Picks dates: Monday 14th to Friday 18th (5 days)",
        "7. Adds note: 'Family holiday to Queensland'",
        "8. System shows: '38 hours from Annual Leave balance (72 hours available)'",
        "9. John submits the request",
        "10. Centre Manager Sarah receives notification",
        "11. Sarah opens leave calendar, sees John's pending request",
        "12. Checks roster coverage - adequate staff available",
        "13. Sarah approves the request",
        "14. John receives approval notification",
        "15. His balance updates to 34 hours remaining",
        "16. Roster shows John as 'On Leave' for those dates"
      ],
      realWorldExample: {
        scenario: "John, a permanent part-time educator (3 days/week), wants to take his kids to the Gold Coast during April school holidays.",
        steps: [
          "In February, John opens the app and goes to Leave",
          "He selects 'Annual Leave' and picks April 14-18",
          "The system calculates 22.8 hours (3 days × 7.6 hours)",
          "His balance shows 45.6 hours available",
          "He submits with note: 'School holiday trip with kids'",
          "Manager Sarah reviews on her dashboard",
          "She sees April is busy but has agency staff available",
          "Sarah approves the request the same day",
          "John gets push notification: 'Leave Approved!'",
          "When Sarah creates the April roster, system blocks those dates for John",
          "She assigns an Anzuk agency educator to cover John's shifts"
        ],
        outcome: "John's leave is approved and recorded, his balance is deducted, and the roster is planned around his absence with agency cover arranged."
      }
    },
    {
      id: "US-RST-004",
      title: "Monitor Real-Time Ratio Compliance",
      actors: ["Centre Manager", "Lead Educator"],
      description: "As a Centre Manager, I want to see real-time educator-to-child ratios for each room, so that I can ensure NQF compliance throughout the day and respond quickly to any breaches.",
      acceptanceCriteria: [
        "Dashboard shows current ratio for each room",
        "Colour coding: Green (compliant), Amber (at risk), Red (breach)",
        "Alert generated when ratio exceeds threshold",
        "Historical ratio snapshots saved for audit",
        "Drill-down shows which educators are present in each room",
        "Projected ratios shown for upcoming breaks/shift changes"
      ],
      businessLogic: [
        "Ratio = Booked Children / Educators Present",
        "NQF Ratios: Nursery 1:4, Toddler 1:5, Preschool 1:10, Kindy 1:11",
        "Breach if actual ratio > required ratio",
        "At Risk if ratio within 0.5 of threshold",
        "'Qualified' educator = Diploma ECE or higher",
        "50% rule: At least half of educators must be qualified",
        "Snapshots recorded every 15 minutes during operating hours"
      ],
      priority: "critical",
      relatedModules: [
        { module: "Roster", relationship: "Shift assignments determine educator presence" },
        { module: "Compliance", relationship: "Ratio breaches logged for regulatory reporting" }
      ],
      endToEndJourney: [
        "1. It's 10:30 AM, all rooms are at full capacity",
        "2. Centre Manager Sarah opens the Compliance Dashboard",
        "3. Dashboard shows: Nursery (1:3 ✓), Toddler (1:4 ✓), Preschool (1:9 ✓), Kindy (1:10 ✓)",
        "4. At 10:45 AM, an educator in Toddler room goes on break",
        "5. Dashboard updates: Toddler (1:6 ⚠️) - yellow warning",
        "6. Alert notification appears on Sarah's screen",
        "7. Sarah clicks through to see details",
        "8. Shows: 12 children, 2 educators, ratio 1:6 (required: 1:5)",
        "9. Sarah radios Lead Educator to send floater to Toddler",
        "10. Floater moves from Kindy (has excess coverage)",
        "11. Dashboard updates: Toddler (1:4 ✓) - green",
        "12. Ratio breach incident logged with 8-minute duration"
      ],
      realWorldExample: {
        scenario: "Bright Futures Childcare has 75 children enrolled across 4 rooms. During the busy 10 AM period, an unexpected educator absence creates a ratio challenge.",
        steps: [
          "Sarah arrives at 8 AM and checks the compliance dashboard",
          "All rooms show green - adequate staffing for current enrolments",
          "At 9:30 AM, educator Lisa calls in sick",
          "Dashboard shows Preschool turning amber: 1:11 (threshold 1:10)",
          "Sarah receives an urgent alert on her phone",
          "She immediately calls the agency to request emergency cover",
          "Meanwhile, she moves the admin assistant (who holds Certificate III) to Preschool as temporary support",
          "Dashboard shows Preschool back to 1:8 (green)",
          "Agency educator arrives at 10:30 AM",
          "Sarah documents the incident and temporary measure in the system",
          "End-of-day report shows 45-minute 'at risk' period with mitigation actions"
        ],
        outcome: "Despite unexpected absence, NQF compliance was maintained through real-time monitoring and quick response. Full documentation available for regulatory inspection."
      }
    },
    {
      id: "US-RST-005",
      title: "Claim Open Shift",
      actors: ["Educator (Staff)"],
      description: "As an Educator, I want to view and claim available open shifts, so that I can pick up extra hours when I'm available.",
      acceptanceCriteria: [
        "Can view list of open shifts matching my qualifications",
        "Each open shift shows date, time, room, and urgency level",
        "Can filter by date range and centre",
        "Can submit interest in a shift with one tap",
        "Receive notification when shift is confirmed or given to someone else",
        "Confirmed shift appears in my schedule automatically"
      ],
      businessLogic: [
        "Open shifts filtered by: qualification match, availability, no conflicts",
        "Staff can only see shifts they're eligible for based on role and qualifications",
        "First-come-first-served or manager approval depending on centre settings",
        "Claimed shift converts from OpenShift to Shift record",
        "Overtime threshold checked before allowing claim",
        "Cross-centre shifts only shown if staff has multi-location flag"
      ],
      priority: "high",
      relatedModules: [
        { module: "Awards", relationship: "Claimed shift may trigger overtime rates" },
        { module: "Fatigue", relationship: "System checks rest hours before allowing claim" }
      ],
      endToEndJourney: [
        "1. Educator Emma wants extra hours this week",
        "2. Opens app and goes to 'Available Shifts' section",
        "3. Sees 3 open shifts matching her qualifications",
        "4. Views details: Thursday 7AM-3PM Nursery (Urgent)",
        "5. Checks her calendar - she's available Thursday",
        "6. Taps 'Claim This Shift' button",
        "7. System validates: Emma has Diploma ECE (required ✓)",
        "8. System validates: No conflict with existing shifts ✓",
        "9. System validates: Won't exceed 45 hours this week ✓",
        "10. Shift assigned to Emma immediately (auto-approve enabled)",
        "11. Emma sees confirmation: 'Shift Confirmed!'",
        "12. Shift appears in her 'My Roster' view",
        "13. Manager receives notification of filled shift"
      ],
      realWorldExample: {
        scenario: "Emma is a casual educator at two centres. She's looking for extra shifts after a colleague went on parental leave.",
        steps: [
          "On Sunday evening, Emma opens the app to plan her week",
          "She sees 5 open shifts across both centres she works at",
          "One shift is marked 'Urgent' - tomorrow morning at Sunshine Centre",
          "Emma taps to view details: Monday 6:30AM-2:30PM, Nursery Room",
          "Requirements show: Certificate III minimum (Emma has Diploma ✓)",
          "She taps 'Claim Shift'",
          "System shows: 'This will bring your weekly total to 42 hours'",
          "Emma confirms - she's happy with the extra hours",
          "Confirmation appears: 'You're confirmed for Monday 6:30 AM at Sunshine Centre'",
          "She receives an email summary with the shift details",
          "Monday morning, she arrives and clocks in as normal"
        ],
        outcome: "The urgent shift was filled within hours of posting, and Emma earned extra income while the centre maintained adequate staffing."
      }
    },
    {
      id: "US-RST-006",
      title: "Create Recurring Shift Pattern",
      actors: ["Centre Manager"],
      description: "As a Centre Manager, I want to create recurring shift patterns for staff with fixed schedules, so that their shifts are automatically generated each week without manual entry.",
      acceptanceCriteria: [
        "Can create pattern with days of week, times, and room",
        "Can assign staff member to the pattern",
        "Pattern generates future shifts automatically",
        "Can set end date or number of occurrences",
        "Generated shifts appear as 'AI Generated' in roster",
        "Can edit single instance without affecting pattern",
        "Can bulk edit all future instances in series"
      ],
      businessLogic: [
        "Pattern types: Daily, Weekly, Fortnightly, Monthly",
        "Weekly: Select specific days (Mon, Wed, Fri)",
        "Fortnightly: Week 1 vs Week 2 pattern with anchor date",
        "Auto-generation runs nightly for next 8 weeks",
        "Pattern expiry triggers notification 14 days before",
        "Single edit: Breaks link to pattern for that instance only",
        "Series edit: Updates pattern definition and regenerates future shifts"
      ],
      priority: "high",
      relatedModules: [
        { module: "Staff Availability", relationship: "Pattern validates against staff availability" },
        { module: "Leave", relationship: "Generated shifts skip approved leave dates" }
      ],
      endToEndJourney: [
        "1. Centre Manager Sarah hires permanent staff member Tom",
        "2. Tom will work Monday, Tuesday, Thursday 7AM-3PM in Toddler room",
        "3. Sarah opens Roster and clicks 'Create Recurring Pattern'",
        "4. Enters name: 'Tom - Regular Weekly'",
        "5. Selects pattern: Weekly",
        "6. Checks days: Monday, Tuesday, Thursday",
        "7. Sets times: 7:00 AM to 3:00 PM",
        "8. Selects room: Toddler Room",
        "9. Assigns staff: Tom Wilson",
        "10. Sets duration: Ongoing (no end date)",
        "11. Sarah clicks 'Create Pattern'",
        "12. System generates 24 shifts (8 weeks × 3 days)",
        "13. Roster grid shows shifts with green recurring icon",
        "14. Each Monday, Tuesday, Thursday for 8 weeks shows Tom assigned"
      ],
      realWorldExample: {
        scenario: "Tom joins Happy Kids Childcare as a permanent part-time educator. His contract specifies fixed days each week.",
        steps: [
          "Sarah receives Tom's signed contract: Mon/Tue/Thu, 7AM-3PM",
          "She opens the Roster system and clicks 'Recurring Patterns'",
          "Clicks 'New Pattern' and enters 'Tom Wilson - PT Schedule'",
          "Selects Weekly recurrence and ticks Monday, Tuesday, Thursday",
          "Sets shift times 7:00 AM - 3:00 PM with 30 min break",
          "Assigns to Toddler Room (Tom's primary room)",
          "Links to Tom's staff profile",
          "Leaves end date blank (ongoing)",
          "Saves the pattern",
          "System immediately creates shifts for next 8 weeks",
          "Tom can now see his entire schedule in the staff app",
          "Each week, his shifts appear automatically without Sarah doing anything"
        ],
        outcome: "Tom's fixed schedule is set up once and automatically maintained, saving Sarah 15 minutes per week on manual shift entry."
      }
    },
    {
      id: "US-RST-007",
      title: "Request and Approve Shift Swap",
      actors: ["Educator (Staff)", "Centre Manager"],
      description: "As an Educator, I want to request a shift swap with a colleague when I can't work my assigned shift, so that coverage is maintained without creating an open shift.",
      acceptanceCriteria: [
        "Can view colleagues who are available and qualified to swap",
        "Can send swap request with reason",
        "Target colleague can accept or decline",
        "Manager receives notification for final approval",
        "Manager can approve or reject the swap",
        "Approved swap updates both staff members' rosters",
        "All parties notified of final outcome"
      ],
      businessLogic: [
        "Swap partner must have matching or higher qualifications",
        "Swap partner must not have conflicting shift",
        "Swap partner must be available (not on leave)",
        "Manager approval required for cross-room swaps",
        "Swaps within same room can be auto-approved if setting enabled",
        "Both original and new assignments logged for audit"
      ],
      priority: "medium",
      relatedModules: [
        { module: "Notifications", relationship: "Multi-party notification workflow" },
        { module: "Compliance", relationship: "Swap validates qualification requirements" }
      ],
      endToEndJourney: [
        "1. Educator Emma has a shift Friday 7AM-3PM but her child is sick",
        "2. Opens app Thursday evening and views Friday shift",
        "3. Taps 'Request Swap' button",
        "4. System shows eligible colleagues: Maria, David, Sarah",
        "5. Emma selects Maria and adds reason: 'Child unwell, need to stay home'",
        "6. Sends swap request",
        "7. Maria receives notification on her phone",
        "8. Maria views request: 'Emma wants to swap Friday shift'",
        "9. Maria is free Friday and taps 'Accept Swap'",
        "10. Centre Manager Sarah receives approval request",
        "11. Sarah sees swap: Emma → Maria, Nursery room, same qualifications",
        "12. Sarah approves the swap",
        "13. Emma receives: 'Swap Approved - Maria will cover your Friday shift'",
        "14. Maria receives: 'Swap Confirmed - You're working Friday 7AM-3PM'",
        "15. Roster updates to show Maria on Friday, Emma's shift removed"
      ],
      realWorldExample: {
        scenario: "Emma, a nursery room educator, discovers Thursday evening that her 5-year-old has chickenpox and she can't work Friday.",
        steps: [
          "Emma opens the app at 7 PM Thursday",
          "She views her Friday shift: 7 AM - 3 PM in Nursery",
          "Taps 'Request Swap' - she doesn't want to just cancel and leave them short",
          "System shows 3 colleagues with Diploma ECE who aren't working Friday",
          "Emma sees Maria is available and rostered off",
          "She selects Maria and types: 'Daughter has chickenpox, need to stay home'",
          "Sends the request",
          "Maria gets a push notification at 7:05 PM",
          "Maria checks her calendar - she was planning chores but can help",
          "Taps 'Accept' on the swap request",
          "Manager Sarah reviews at 7:15 PM",
          "She approves - Maria is fully qualified for Nursery",
          "Emma is relieved - shift is covered without a gap",
          "Maria earns extra hours she wasn't expecting"
        ],
        outcome: "Same-day swap request handled in 15 minutes. Nursery maintains qualified educator coverage, Emma can care for her sick child, and Maria gains extra income."
      }
    },
    {
      id: "US-RST-008",
      title: "Manage Agency Staff Placement",
      actors: ["Centre Manager", "Agency Coordinator"],
      description: "As a Centre Manager, I want to request and manage agency staff placements for shifts I cannot fill with internal staff, so that I maintain required coverage levels.",
      acceptanceCriteria: [
        "Can mark open shift as 'Agency Required'",
        "Agency receives notification of available shifts",
        "Agency can propose specific staff for shifts",
        "Manager can accept or reject agency proposals",
        "Accepted agency staff appear in roster with agency badge",
        "Agency staff can clock in/out like internal staff",
        "Separate cost tracking for agency labour"
      ],
      businessLogic: [
        "Agency shift rates loaded from agency contract settings",
        "Agency markup percentage applied on top of base rate",
        "Agency staff qualifications verified before acceptance",
        "Agency staff do not accrue leave or entitlements",
        "Agency timesheets routed to agency for invoicing",
        "Agency staff flagged with agency type (Anzuk, Randstad, etc.)"
      ],
      priority: "medium",
      relatedModules: [
        { module: "Awards", relationship: "Agency rates may differ from award rates" },
        { module: "Costing", relationship: "Agency costs tracked separately in budget" }
      ],
      endToEndJourney: [
        "1. Centre Manager Sarah has 2 open shifts she can't fill internally",
        "2. Opens each open shift and marks as 'Agency Required'",
        "3. Selects preferred agency: Anzuk Education",
        "4. Adds notes: 'Must have ECT qualification for Nursery'",
        "5. Agency Coordinator at Anzuk receives notification",
        "6. Reviews available staff matching requirements",
        "7. Proposes 'Jennifer Lee' for Shift 1, 'Mark Wong' for Shift 2",
        "8. Sarah receives proposal notification",
        "9. Opens proposal: sees Jennifer and Mark's qualifications and experience",
        "10. Sarah accepts both proposals",
        "11. Jennifer and Mark appear in roster with Anzuk badge",
        "12. Both receive shift details via Anzuk's system",
        "13. On shift day, they clock in using visitor tablets",
        "14. Timesheets at week end show internal vs agency hours",
        "15. Agency cost report shows $890 agency labour for week"
      ],
      realWorldExample: {
        scenario: "Rainbow Early Learning has a flu outbreak among staff. 4 educators are off sick and Sarah needs agency cover urgently.",
        steps: [
          "Monday morning, Sarah sees 4 sick calls - roster has major gaps",
          "She has 6 open shifts across Tuesday to Friday",
          "Fills 2 with overtime offers to existing staff",
          "Remaining 4 shifts marked as 'Agency Required - Urgent'",
          "Sends to Anzuk with qualification requirements listed",
          "Anzuk coordinator Julia responds within an hour",
          "Proposes 4 agency educators with matching qualifications",
          "Sarah reviews each profile - all have current WWC and First Aid",
          "She accepts all 4 proposals",
          "Agency staff receive details and arrive on schedule",
          "They clock in with temporary access badges",
          "All 4 shifts covered, ratios maintained throughout the week",
          "End of week: $1,780 in agency costs, but zero ratio breaches"
        ],
        outcome: "Emergency staffing crisis resolved within hours. Centre maintained compliance despite 25% of regular staff being absent."
      }
    },
    {
      id: "US-RST-009",
      title: "Submit Leave Request with Coverage Check",
      actors: ["Educator (Staff)", "Centre Manager"],
      description: "As an Educator, I want to submit a leave request that automatically checks roster impact, so that my manager can make informed approval decisions.",
      acceptanceCriteria: [
        "Can select leave type from approved list",
        "Can specify date range and partial days",
        "System shows current shifts affected by leave dates",
        "System indicates coverage gaps that would result",
        "Manager sees impact summary when reviewing request",
        "Approved leave blocks shift assignment for those dates"
      ],
      businessLogic: [
        "Leave types: Annual, Sick, Personal, Parental, Long Service, Unpaid",
        "Annual leave requires minimum 2 weeks notice (configurable)",
        "Sick leave can be submitted same-day with certificate upload",
        "System calculates hours against entitlement balance",
        "Approved leave creates 'unavailable' blocks in roster",
        "Partial day leave reduces available hours for that day"
      ],
      priority: "high",
      relatedModules: [
        { module: "Awards", relationship: "Leave entitlements calculated per award conditions" },
        { module: "Payroll", relationship: "Leave hours exported for leave pay processing" }
      ],
      endToEndJourney: [
        "1. Educator Emma wants to take 5 days annual leave in 3 weeks",
        "2. Opens Employee Portal and clicks 'Request Leave'",
        "3. Selects leave type: Annual Leave",
        "4. Sets dates: Monday 24 Feb to Friday 28 Feb",
        "5. System shows: 5 days, 38 hours of entitlement",
        "6. Current balance: 12.5 days available ✓",
        "7. Impact check shows: 3 scheduled shifts will be affected",
        "8. Emma adds note: 'Family holiday - booked flights'",
        "9. Submits request",
        "10. Manager Sarah receives notification",
        "11. Opens request, sees shift impact summary",
        "12. Notes: Nursery room needs coverage Mon/Wed/Fri",
        "13. Sarah checks other staff availability",
        "14. Approves leave request",
        "15. Emma receives approval notification",
        "16. Her shifts for those dates auto-convert to open shifts"
      ],
      realWorldExample: {
        scenario: "Emma has a family holiday planned and needs to request 5 days of annual leave during a typically busy period.",
        steps: [
          "Emma opens the Employee Portal on Sunday evening",
          "Clicks 'Request Leave' from the dashboard",
          "Selects 'Annual Leave' from dropdown",
          "Picks dates: 24-28 February (Mon-Fri)",
          "System calculates: 5 days = 38 hours",
          "Shows current balance: 12.5 days (95 hours)",
          "After approval, balance will be: 7.5 days (57 hours)",
          "Impact preview shows 3 shifts she's rostered for",
          "Adds note explaining the family holiday",
          "Attaches no documents (not required for annual leave)",
          "Submits the request",
          "Manager Sarah gets push notification",
          "Sarah opens the request in her app",
          "Sees: 3 shifts need coverage, Nursery room affected",
          "Checks Maria and Tom's availability - both can cover",
          "Approves with comment: 'Enjoy your holiday!'",
          "Emma's shifts become open shifts for reassignment",
          "Sarah assigns Maria to Monday, Tom to Wed/Fri"
        ],
        outcome: "Leave processed with full visibility of roster impact. Coverage arranged before leave begins. No compliance gaps."
      }
    },
    {
      id: "US-RST-010",
      title: "Validate Fatigue Compliance Before Publishing",
      actors: ["Centre Manager"],
      description: "As a Centre Manager, I want the system to check fatigue compliance before I publish the roster, so that I don't inadvertently breach OH&S requirements.",
      acceptanceCriteria: [
        "Validation runs automatically before publish",
        "Checks minimum rest hours between shifts (10 hours)",
        "Checks maximum consecutive days (5 days)",
        "Checks maximum hours per week (50 hours)",
        "Violations flagged with severity level",
        "Can override warnings with documented justification"
      ],
      businessLogic: [
        "Minimum rest period: 10 hours between shift end and next start",
        "Maximum consecutive days: 5 without 2 consecutive days off",
        "Maximum weekly hours: 50 (or contract limit)",
        "Daily maximum: 12 hours including overtime",
        "Violations categorized: Error (must fix) or Warning (can override)",
        "Override requires manager justification stored for audit"
      ],
      priority: "critical",
      relatedModules: [
        { module: "Compliance", relationship: "Fatigue violations logged for regulatory reporting" },
        { module: "Awards", relationship: "Award-specific fatigue rules apply" }
      ],
      endToEndJourney: [
        "1. Centre Manager Sarah finishes scheduling next week's roster",
        "2. Clicks 'Publish Roster' button",
        "3. System runs fatigue validation scan",
        "4. Progress bar shows checking 15 staff members",
        "5. Results: 2 issues found",
        "6. Error: Tom has only 8 hours between Thursday PM and Friday AM",
        "7. Warning: Emma has 6 consecutive work days",
        "8. Sarah clicks Tom's error to see details",
        "9. Thursday shift ends 9 PM, Friday starts 5 AM = 8 hours rest",
        "10. Sarah edits Friday shift to start 7 AM (10 hours rest ✓)",
        "11. For Emma's warning, Sarah documents: 'Staff shortage, Emma agreed'",
        "12. Re-runs validation: 0 errors, 1 documented warning",
        "13. Proceeds with publish",
        "14. All staff notified of published roster",
        "15. Audit log records Emma's override justification"
      ],
      realWorldExample: {
        scenario: "Sarah is finalizing the weekly roster but the validation catches two potential fatigue compliance issues.",
        steps: [
          "Sarah completes roster scheduling for next week",
          "Clicks 'Publish' expecting smooth publishing",
          "Validation screen appears with progress indicator",
          "After 5 seconds: '2 issues found - please review'",
          "Issue 1 (Red Error): Tom - Insufficient rest period",
          "Details: Thursday 1-9 PM, Friday 5 AM-1 PM",
          "Rest period: Only 8 hours (minimum 10 required)",
          "Issue 2 (Yellow Warning): Emma - 6 consecutive days",
          "Emma works Mon-Sat with Sunday off",
          "Award allows 5 consecutive before mandatory rest",
          "Sarah adjusts Tom's Friday shift to 7 AM start",
          "New rest period: 10 hours ✓",
          "For Emma, Sarah clicks 'Override with Justification'",
          "Types: 'Staff shortage due to flu outbreak. Emma consulted and agreed.'",
          "Links to Emma's written consent (uploaded earlier)",
          "Re-validates: 0 errors, 1 documented override",
          "Publishes roster successfully",
          "System logs override for compliance audit"
        ],
        outcome: "Roster published with full fatigue compliance or documented exceptions. Organization protected from OH&S violations."
      }
    },
    {
      id: "US-RST-011",
      title: "Generate Demand Forecast for Staffing",
      actors: ["Centre Manager", "Area Manager"],
      description: "As a Centre Manager, I want to see AI-generated staffing demand forecasts based on child bookings and historical patterns, so that I can plan adequate coverage.",
      acceptanceCriteria: [
        "System analyzes historical booking patterns",
        "Forecast shows expected children per room per day",
        "Staffing requirements calculated from forecasted demand",
        "Weather and holiday adjustments applied",
        "Forecast displayed alongside roster planning view",
        "Accuracy metrics shown for past forecasts"
      ],
      businessLogic: [
        "Base forecast from historical same-day-of-week patterns",
        "Adjusted for known factors: holidays, school terms, events",
        "Weather API integration for rain/heat adjustments",
        "Minimum staffing: Always meet NQF ratios",
        "Buffer staffing: Add 10% for unexpected demand",
        "Forecast generated weekly, updated daily"
      ],
      priority: "medium",
      relatedModules: [
        { module: "Child Booking System", relationship: "Imports confirmed and projected bookings" },
        { module: "Costing", relationship: "Forecast staffing drives budget projections" }
      ],
      endToEndJourney: [
        "1. It's Friday, Sarah is planning next week's roster",
        "2. Opens Demand Forecast section",
        "3. System displays predicted children per day per room",
        "4. Monday: Nursery 12, Toddler 18, Preschool 22, Kindy 24",
        "5. Thursday shows higher demand (payday week pattern)",
        "6. System recommends: 4-4-3-2 educators per room Monday",
        "7. Thursday recommendation: 4-5-3-3 (extra toddler coverage)",
        "8. Weather adjustment: Tuesday rain forecast = +5% bookings expected",
        "9. Sarah sees historical accuracy: 94% for this centre",
        "10. Accepts recommended staffing levels",
        "11. System auto-generates shift requirements",
        "12. Sarah assigns staff to meet recommendations"
      ],
      realWorldExample: {
        scenario: "Sarah uses AI-powered demand forecasting to optimize next week's staffing at Sunshine Centre.",
        steps: [
          "Friday afternoon, Sarah opens the Roster module",
          "Clicks 'Demand Forecast' tab for next week view",
          "System has analyzed:",
          "  - Last 12 weeks of same-day patterns",
          "  - Current bookings vs. historical conversion rates",
          "  - School holiday impact (not during holidays)",
          "  - Weather forecast (rain Tuesday, sunny rest of week)",
          "Forecast displayed:",
          "  - Monday: 76 children (typical start of week)",
          "  - Tuesday: 82 children (+5% rain adjustment)",
          "  - Wednesday: 74 children (mid-week dip)",
          "  - Thursday: 85 children (payday pattern)",
          "  - Friday: 68 children (typical drop-off)",
          "Staffing requirements calculated per room:",
          "  - Nursery: Consistent 4 educators (1:4 ratio)",
          "  - Toddler: 4-5 educators based on demand",
          "  - Preschool/Kindy: 2-3 based on ratios",
          "Total recommended hours: 412 for the week",
          "Compared to last week actual: 398 hours",
          "Sarah accepts recommendations as baseline",
          "Begins assigning staff to generated requirements"
        ],
        outcome: "Data-driven staffing plan reduces over/under-staffing by 15%. Labour costs optimized while maintaining compliance."
      }
    },
    {
      id: "US-RST-012",
      title: "Manage Staff Qualifications and Expiry Alerts",
      actors: ["HR Administrator", "Centre Manager"],
      description: "As an HR Administrator, I want to track staff qualifications with expiry dates and receive renewal alerts, so that we maintain a compliant workforce.",
      acceptanceCriteria: [
        "Can add multiple qualifications per staff member",
        "Each qualification has issue and expiry date",
        "Alerts generated 90/60/30 days before expiry",
        "Dashboard shows upcoming expiries across all staff",
        "Can upload qualification certificates as evidence",
        "Expired qualifications block certain shift assignments"
      ],
      businessLogic: [
        "Required qualifications: First Aid, CPR, Child Protection, WWC",
        "Role-specific: Diploma ECE, Bachelor ECE, Food Safety",
        "Alert recipients: Staff member, their manager, HR",
        "Grace period: 7 days after expiry before blocking",
        "Expired WWC: Immediate block from all shifts",
        "Qualification verification linked to regulatory body APIs where available"
      ],
      priority: "high",
      relatedModules: [
        { module: "Compliance", relationship: "Qualification status feeds compliance dashboard" },
        { module: "LMS", relationship: "Some qualifications earned through internal training" }
      ],
      endToEndJourney: [
        "1. HR Administrator opens Staff Qualifications dashboard",
        "2. Summary shows: 3 expiring in 30 days, 5 expiring in 60 days",
        "3. Clicks through to 30-day list",
        "4. Educator Tom's First Aid expires in 25 days",
        "5. HR sends reminder via system notification",
        "6. Tom books renewal course externally",
        "7. After completing course, Tom uploads new certificate",
        "8. HR reviews and approves the uploaded certificate",
        "9. Qualification extended with new expiry date",
        "10. Tom removed from expiring list",
        "11. For staff who don't renew, system flags at expiry",
        "12. Manager sees warning when trying to assign expired staff"
      ],
      realWorldExample: {
        scenario: "Monthly qualification review reveals several upcoming expiries that need proactive management.",
        steps: [
          "HR Admin Jenny opens the Qualification Dashboard",
          "Dashboard shows traffic light summary:",
          "  - Green: 45 staff with all current qualifications",
          "  - Amber: 8 staff with qualifications expiring soon",
          "  - Red: 2 staff with expired qualifications (grace period)",
          "Jenny drills into the Amber list",
          "Tom's First Aid: Expires in 25 days",
          "Maria's CPR: Expires in 45 days",
          "Emma's WWC: Expires in 55 days",
          "Jenny sends bulk reminder to all 8 staff",
          "Notification includes: Qualification, expiry date, renewal instructions",
          "Tom books external First Aid course",
          "After completion, uploads certificate via app",
          "Jenny reviews: Valid certificate from approved provider",
          "Approves update: New expiry date 3 years from issue",
          "Red list: John's CPR expired 5 days ago",
          "System shows warning on any shift assignment for John",
          "John's manager sees: 'CPR expired - cannot assign to regulated shifts'",
          "Jenny escalates: John books emergency CPR refresher",
          "After renewal, John's block is lifted"
        ],
        outcome: "Proactive qualification management ensures continuous compliance. No staff assigned without required certifications."
      }
    },
    {
      id: "US-RST-013",
      title: "Configure NQF Ratio Requirements Per Room",
      actors: ["System Administrator", "Centre Manager"],
      description: "As a System Administrator, I want to configure NQF educator-to-child ratios for each room type, so that the compliance engine uses correct regulatory requirements.",
      acceptanceCriteria: [
        "Can set ratio requirements per age group",
        "Can specify qualified educator percentage requirements",
        "State/territory-specific variations supported",
        "ECT requirements configurable per room count",
        "Changes logged with audit trail",
        "Effective dates allow future ratio changes"
      ],
      businessLogic: [
        "National ratios: Birth-24m 1:4, 24-36m 1:5, 36m-preschool 1:10, Kindy 1:11",
        "50% educators must hold approved Diploma (or higher)",
        "ECT required per: 25+ preschool children or 25+ kindy children",
        "State variations: Some states have stricter ratios",
        "Ratios apply during operating hours only",
        "Different ratios may apply during excursions"
      ],
      priority: "critical",
      relatedModules: [
        { module: "Compliance Dashboard", relationship: "Uses ratios for real-time monitoring" },
        { module: "AI Scheduler", relationship: "Uses ratios as hard constraints in optimization" }
      ],
      endToEndJourney: [
        "1. System Admin opens Centre Configuration",
        "2. Selects Sunshine Centre",
        "3. Opens Room Settings > Compliance Requirements",
        "4. For Nursery Room (0-24 months):",
        "5. Sets ratio: 1 educator per 4 children",
        "6. Sets qualification: 50% Diploma minimum",
        "7. For Toddler Room (24-36 months):",
        "8. Sets ratio: 1:5",
        "9. For Preschool (3-4 years):",
        "10. Sets ratio: 1:10, requires ECT if >25 children",
        "11. For Kindy (4-5 years):",
        "12. Sets ratio: 1:11, requires ECT if >25 children",
        "13. Saves configuration with effective date",
        "14. Compliance engine now uses these settings",
        "15. All ratio calculations update to new requirements"
      ],
      realWorldExample: {
        scenario: "New Victoria state regulations require stricter ratios for toddler rooms. Admin updates the system configuration.",
        steps: [
          "Victorian government announces new regulation",
          "Toddler room ratio changing from 1:5 to 1:4",
          "Effective date: 1 July 2026",
          "System Admin receives notification from HR",
          "Opens Compliance Configuration",
          "Selects 'Victorian Centres' location group",
          "Finds Toddler Room age group settings",
          "Current setting: 1 educator per 5 children",
          "Creates new ratio rule:",
          "  - Ratio: 1:4",
          "  - Age group: 24-36 months",
          "  - Effective from: 1 July 2026",
          "  - Applies to: All Victorian centres",
          "Saves with audit note: 'New VIC regulation compliance'",
          "System shows: Will affect 3 centres, ~15 toddler rooms",
          "Impact analysis: Will need 1-2 extra educators per centre",
          "Configuration scheduled to activate automatically",
          "On 1 July, compliance calculations use new ratio",
          "Any understaffing immediately flagged"
        ],
        outcome: "Regulatory change implemented system-wide with zero manual ratio adjustments needed on go-live date."
      }
    },
    {
      id: "US-RST-014",
      title: "Track Budget vs Actual Labour Costs",
      actors: ["Centre Manager", "Finance Director"],
      description: "As a Centre Manager, I want to see real-time budget vs actual labour costs for my roster, so that I can manage within approved limits.",
      acceptanceCriteria: [
        "Budget target set per centre per period",
        "Real-time actual cost calculated from roster",
        "Variance displayed as dollar and percentage",
        "Breakdown by cost type (ordinary, overtime, penalty, allowances)",
        "Trends shown over time (week, month, quarter)",
        "Alerts when approaching or exceeding budget"
      ],
      businessLogic: [
        "Budget set at weekly or monthly level",
        "Actual = Rostered hours × applicable rates",
        "Includes all pay elements: base, OT, penalties, allowances",
        "Variance calculated as Budget - Actual",
        "Positive variance = under budget, Negative = over budget",
        "Threshold alerts at 90%, 100%, 110% of budget"
      ],
      priority: "high",
      relatedModules: [
        { module: "Awards", relationship: "Provides rates for cost calculation" },
        { module: "Finance System", relationship: "Exports actuals for financial reporting" }
      ],
      endToEndJourney: [
        "1. Centre Manager Sarah opens Budget Dashboard",
        "2. Current period: Week of 24 February",
        "3. Budget: $12,500 weekly labour cost",
        "4. Current rostered: $11,850 (94.8%)",
        "5. Variance: +$650 under budget ✓",
        "6. Breakdown shows:",
        "7. Ordinary hours: $10,200",
        "8. Overtime: $450",
        "9. Penalty rates: $850",
        "10. Allowances: $350",
        "11. Week-over-week trend shows consistent performance",
        "12. Finance Director can see all centres consolidated",
        "13. Export to Excel for monthly reporting"
      ],
      realWorldExample: {
        scenario: "Sarah monitors labour costs weekly to ensure her centre stays within the approved budget while maintaining compliance.",
        steps: [
          "Monday morning, Sarah checks the Budget Dashboard",
          "Weekly budget for Sunshine Centre: $12,500",
          "Current roster shows $11,200 committed (89.6%)",
          "Sarah still needs to fill 2 open shifts",
          "If filled with regular staff: Total would be $11,850",
          "If filled with agency: Total would be $12,350",
          "Agency fills would be 98.8% of budget - acceptable",
          "Sarah tries internal first - sends shift to available staff",
          "Emma picks up one shift (saves $50 vs agency)",
          "No internal takers for second shift - assigns to agency",
          "Final roster cost: $12,100 (96.8% of budget)",
          "Dashboard shows green status - within target",
          "Cost breakdown:",
          "  - Ordinary: $9,800 (78.4%)",
          "  - Overtime: $320 (2.6%)",
          "  - Penalties: $1,200 (9.6%) - includes weekend",
          "  - Agency: $580 (4.6%)",
          "  - Allowances: $200 (1.6%)",
          "Sarah notes high penalty due to 2 Sunday shifts",
          "Plans to review Sunday staffing for next roster"
        ],
        outcome: "Centre meets budget target while maintaining full staffing. Manager has visibility to optimize costs proactively."
      }
    },
    {
      id: "US-RST-015",
      title: "Run AI-Powered Schedule Optimization",
      actors: ["Centre Manager", "Area Manager"],
      description: "As a Centre Manager, I want the AI to suggest an optimal roster that balances compliance, staff preferences, and cost, so that I can create efficient schedules faster.",
      acceptanceCriteria: [
        "Can initiate AI optimization for selected date range",
        "AI considers: compliance, availability, preferences, fairness, cost",
        "Results show multiple scenario options",
        "Can compare scenarios by different metrics",
        "Can accept AI suggestions or modify manually",
        "Optimization runs complete within 60 seconds"
      ],
      businessLogic: [
        "Hard constraints: NQF ratios, qualifications, availability, leave",
        "Soft constraints: Staff preferences, fairness, overtime minimization",
        "Objectives: Minimize cost while meeting coverage requirements",
        "Fairness: Balance shift distribution across eligible staff",
        "Preference matching: Higher weight to shift time preferences",
        "Solution quality scored 0-100 based on constraint satisfaction"
      ],
      priority: "high",
      relatedModules: [
        { module: "Staff Availability", relationship: "Availability windows are hard constraints" },
        { module: "Awards", relationship: "Rates influence cost optimization" }
      ],
      endToEndJourney: [
        "1. Centre Manager Sarah has 35 open shifts for next week",
        "2. Opens AI Scheduler and clicks 'Optimize Roster'",
        "3. Selects date range and rooms to optimize",
        "4. Sets priorities: Compliance > Cost > Staff Preference",
        "5. Clicks 'Generate Options'",
        "6. Progress shows AI working through constraints",
        "7. After 45 seconds, 3 options presented:",
        "8. Option A: Score 94, Cost $11,200, All compliant",
        "9. Option B: Score 91, Cost $10,800, 2 preference conflicts",
        "10. Option C: Score 88, Cost $10,500, 4 preference conflicts",
        "11. Sarah reviews Option A in detail",
        "12. Sees shift assignments by day and room",
        "13. One suggestion: Tom on Friday, but he prefers not to work Fridays",
        "14. Sarah swaps Tom with Maria (who is indifferent)",
        "15. Accepts modified Option A",
        "16. All 35 shifts populated with staff assignments"
      ],
      realWorldExample: {
        scenario: "Week's roster has 40 shifts to fill across 4 rooms. Sarah uses AI optimization to create an efficient schedule.",
        steps: [
          "Sarah applied weekly template - 40 open shifts created",
          "15 permanent staff available with various preferences",
          "Manual assignment would take 2+ hours",
          "Opens AI Scheduler panel",
          "Clicks 'Optimize' for week of 3 March",
          "Sets constraint priorities:",
          "  1. Compliance (must meet all ratios)",
          "  2. Cost (minimize overtime and agency)",
          "  3. Fairness (distribute hours evenly)",
          "  4. Preferences (honor stated preferences)",
          "AI processes in 40 seconds",
          "Three scenarios generated:",
          "  Option A: Balanced - Score 92, $12,100",
          "  Option B: Cost-Focused - Score 88, $11,400",
          "  Option C: Preference-Focused - Score 90, $12,600",
          "Sarah examines Option A details",
          "All rooms fully staffed with correct ratios",
          "Only 2 preference conflicts (out of 40 shifts)",
          "Tom assigned Friday despite 'prefer not' - AI chose for qualification reasons",
          "Sarah manually swaps Tom with equally-qualified Maria",
          "New score: 94 (improved by fixing preference)",
          "Sarah accepts the roster",
        "All 40 shifts assigned in 5 minutes total"
        ],
        outcome: "AI reduces roster creation time by 80% while optimizing for multiple objectives. Manager retains control for fine-tuning."
      }
    },
    {
      id: "US-RST-016",
      title: "Configure Geofence Zones for Clock Validation",
      actors: ["System Administrator", "Centre Manager"],
      description: "As a System Administrator, I want to define geofence zones around each centre, so that clock-in/out events can be validated against the employee's physical location.",
      acceptanceCriteria: [
        "Can set centre coordinates (latitude/longitude)",
        "Can define radius in meters for geofence zone",
        "Can create multiple zones per centre (main building, outdoor areas)",
        "System validates clock events against zones",
        "Out-of-zone events flagged with distance from boundary",
        "Override capability for managers with documented reason"
      ],
      businessLogic: [
        "Default radius: 100 meters from centre coordinates",
        "GPS accuracy must be ≤50 meters for reliable validation",
        "Distance calculated using Haversine formula",
        "Buffer zone: +20 meters before flagging as violation",
        "Outdoor zones may have larger radius",
        "Mobile GPS may be less accurate indoors - tolerance applied"
      ],
      priority: "high",
      relatedModules: [
        { module: "Time & Attendance", relationship: "Clock events validated against geofence" },
        { module: "Compliance", relationship: "Location validation supports audit requirements" }
      ],
      endToEndJourney: [
        "1. System Admin opens Centre Configuration for Sunshine Centre",
        "2. Navigates to Geofence Settings",
        "3. Map displays centre location with satellite view",
        "4. Enters centre coordinates: -37.8136, 144.9631",
        "5. Sets primary zone radius: 80 meters",
        "6. Draws secondary zone for outdoor play area",
        "7. Secondary zone: 150 meters (accounts for larger area)",
        "8. Names zones: 'Main Building', 'Outdoor Play'",
        "9. Saves configuration",
        "10. Tests with sample GPS coordinates",
        "11. Point inside: 'Within Geofence ✓'",
        "12. Point outside: 'Outside Geofence - 45m from boundary'"
      ],
      realWorldExample: {
        scenario: "Sunshine Centre has main building plus outdoor natural play area. Both need geofence coverage.",
        steps: [
          "System Admin opens Sunshine Centre configuration",
          "Google Maps view shows centre location",
          "Creates Zone 1: 'Main Building' - 80m radius",
          "Creates Zone 2: 'Bush Kinder Area' - 100m radius",
          "Saves geofence configuration",
          "Educator clocks in from parking lot - validated as within zone",
          "Clock events now geo-validated automatically"
        ],
        outcome: "Multi-zone geofencing accommodates complex site layouts. Staff can clock in from any valid location."
      }
    },
    {
      id: "US-RST-017",
      title: "Generate Timesheet from Roster and Clock Events",
      actors: ["Centre Manager", "Payroll Administrator"],
      description: "As a Centre Manager, I want to generate timesheets that compare rostered hours against actual clock events, so that I can approve accurate worked hours for payroll.",
      acceptanceCriteria: [
        "Timesheet shows rostered vs actual hours side by side",
        "Variance highlighted when actual differs from rostered",
        "Automatic calculation of overtime based on thresholds",
        "Allowances auto-applied based on shift conditions",
        "Manager can approve, adjust, or query timesheets",
        "Approved timesheets exported for payroll processing"
      ],
      businessLogic: [
        "Actual hours = Clock out - Clock in - Unpaid breaks",
        "Variance threshold for flagging: ±15 minutes",
        "Overtime calculated after 7.6 hours daily or 38 hours weekly",
        "Penalty rates applied for weekend/public holiday work",
        "Allowances triggered by shift conditions",
        "Timesheet period: Weekly or fortnightly"
      ],
      priority: "critical",
      relatedModules: [
        { module: "Awards", relationship: "Provides rates and allowances for calculation" },
        { module: "Payroll", relationship: "Approved timesheets exported for payment" }
      ],
      endToEndJourney: [
        "1. End of fortnight, Centre Manager opens Timesheet Review",
        "2. Sees list of 15 staff with pending timesheets",
        "3. Each row shows: Staff name, Rostered hours, Actual hours, Variance",
        "4. Emma: Rostered 76 hrs, Actual 78.5 hrs, Variance +2.5 hrs",
        "5. Clicks into Emma's timesheet for detail",
        "6. Day-by-day breakdown shows each shift",
        "7. Wednesday: Rostered 7:00-3:00, Actual 7:02-3:45 (+43 min)",
        "8. Overtime calculated: 2.5 hours at 1.5x rate",
        "9. Allowances shown: 1x meal allowance, 1x first aid",
        "10. Manager approves with comment on Wednesday overtime",
        "11. All approved timesheets exported to payroll"
      ],
      realWorldExample: {
        scenario: "Fortnight end timesheet review at Sunshine Centre for 15 staff before payroll processing.",
        steps: [
          "Monday morning, Manager opens Timesheet Review",
          "Dashboard shows 15 pending, 3 flagged with overtime",
          "Reviews each timesheet, approves with adjustments as needed",
          "Exports approved timesheets as CSV for payroll",
          "Complete review takes 30 minutes vs 3 hours manually"
        ],
        outcome: "Accurate timesheets with automated overtime and allowance calculations. Efficient review process."
      }
    },
    {
      id: "US-RST-018",
      title: "Broadcast Urgent Shift to Available Staff",
      actors: ["Centre Manager"],
      description: "As a Centre Manager, I want to broadcast an urgent open shift to all eligible staff simultaneously, so that I can fill last-minute gaps quickly.",
      acceptanceCriteria: [
        "Can select shift and click 'Broadcast Urgent'",
        "System identifies all eligible staff based on qualifications",
        "Push notification sent to all eligible staff",
        "First responder to accept gets the shift",
        "Other staff notified that shift has been filled",
        "Broadcast expires after configurable time"
      ],
      businessLogic: [
        "Eligibility: Correct qualifications, available, not already rostered",
        "Notification channels: Push, SMS (configurable)",
        "First-come-first-served assignment",
        "Concurrency handling: Only one acceptance processed",
        "Overtime implications shown before staff accept",
        "If unfilled after expiry, reverts to regular open shift"
      ],
      priority: "high",
      relatedModules: [
        { module: "Notifications", relationship: "Push/SMS broadcasts to staff" },
        { module: "Awards", relationship: "Shows pay implications including OT" }
      ],
      endToEndJourney: [
        "1. 6 AM: Educator calls in sick for 7 AM shift",
        "2. Centre Manager opens app on phone",
        "3. Finds the now-unassigned shift, taps 'Broadcast Urgent'",
        "4. System shows 8 eligible staff",
        "5. All receive push notification",
        "6. Tom accepts first, shift assigned to him",
        "7. Other 7 staff notified shift is filled",
        "8. Tom arrives at 7 AM, coverage maintained"
      ],
      realWorldExample: {
        scenario: "Early morning sick call requires urgent coverage in Nursery room.",
        steps: [
          "Manager broadcasts urgent shift to 8 eligible staff",
          "Within 3 minutes, Tom accepts",
          "System confirms Tom, notifies others",
          "Shift filled with minimal gap"
        ],
        outcome: "Critical shift filled in 3 minutes despite 45-minute notice. Broadcast enables rapid response."
      }
    },
    {
      id: "US-RST-019",
      title: "Manage Sleepover and On-Call Shifts",
      actors: ["Centre Manager", "Educator (Staff)"],
      description: "As a Centre Manager, I want to schedule sleepover and on-call shifts with appropriate allowances, so that overnight care is properly staffed and compensated.",
      acceptanceCriteria: [
        "Can create 'sleepover' shift type with overnight hours",
        "Sleepover allowance automatically applied",
        "Wake-up calls trigger callback rate if work required",
        "On-call shifts track standby time separately",
        "Callback during on-call paid at appropriate rate",
        "Clear rules for when sleepover converts to ordinary hours"
      ],
      businessLogic: [
        "Sleepover: Overnight presence, minimal active work expected",
        "Sleepover allowance: Flat rate (e.g., $75 per night)",
        "If woken for work: First 15 min included, thereafter paid",
        "On-call: Available but not on-site, standby allowance",
        "Callback from on-call: Minimum 3-hour payment",
        "Disturbance thresholds determine if sleepover converts to work"
      ],
      priority: "medium",
      relatedModules: [
        { module: "Awards", relationship: "Sleepover and on-call allowances configured" },
        { module: "Timesheet", relationship: "Sleepover vs work hours tracked separately" }
      ],
      endToEndJourney: [
        "1. Centre Manager creates sleepover shift 8 PM - 7 AM",
        "2. Selects shift type: 'Sleepover'",
        "3. System applies sleepover allowance: $75",
        "4. Assigns qualified educator Maria",
        "5. During night, child wakes at 2 AM requiring care",
        "6. Maria logs 45 minutes of active work",
        "7. System calculates: Sleepover allowance + 45 min at night rate",
        "8. Timesheet shows sleepover and work hours separately"
      ],
      realWorldExample: {
        scenario: "Family emergency requires overnight care. Sleepover shift with wake-up disturbance.",
        steps: [
          "Manager creates sleepover shift 8 PM - 7 AM",
          "Educator Maria assigned with $75 allowance",
          "Child wakes at 3 AM, 35 min care required",
          "20 min payable at night rate (15 min included in allowance)",
          "Total: $75 + $11.01 = $86.01"
        ],
        outcome: "Sleepover correctly compensated with automatic allowance and triggered work payment."
      }
    },
    {
      id: "US-RST-020",
      title: "View Staff Utilization Reports",
      actors: ["Area Manager", "Finance Director"],
      description: "As an Area Manager, I want to view staff utilization reports across centres, so that I can identify efficiency opportunities and optimize labour allocation.",
      acceptanceCriteria: [
        "Dashboard shows utilization percentage per staff member",
        "Can aggregate by centre, department, or role",
        "Comparison against contracted hours shown",
        "Overtime trends identified and highlighted",
        "Under-utilization flagged for review",
        "Export capability for detailed analysis"
      ],
      businessLogic: [
        "Utilization = Actual worked / Contracted hours × 100",
        "Target utilization: 90-100%",
        "Under 80%: Under-utilized flag",
        "Over 110%: Over-utilized (burnout risk)",
        "Calculation period: Weekly, monthly, quarterly",
        "Includes leave deductions for fair calculation"
      ],
      priority: "medium",
      relatedModules: [
        { module: "Budgeting", relationship: "Utilization impacts labour cost projections" },
        { module: "HR", relationship: "Patterns may indicate staffing level issues" }
      ],
      endToEndJourney: [
        "1. Area Manager opens Analytics Dashboard",
        "2. Selects 'Staff Utilization' report for last month",
        "3. Overview shows average utilization 94%",
        "4. One centre flagged at 82% - under-utilized",
        "5. Drills into details: 3 part-time staff at 70% each",
        "6. Identifies opportunity to optimize contracts",
        "7. Exports report for Centre Manager discussion"
      ],
      realWorldExample: {
        scenario: "Quarterly review identifies under-utilization at one centre.",
        steps: [
          "Report shows Rainbow Centre at 84% utilization",
          "3 part-time staff consistently under-used",
          "Analysis leads to contract rebalancing",
          "Q2 projects 12% labour cost saving"
        ],
        outcome: "Data-driven identification of inefficiency leads to cost optimization."
      }
    },
    {
      id: "US-RST-021",
      title: "Manage Cross-Centre Staff Deployments",
      actors: ["Area Manager", "Centre Manager"],
      description: "As an Area Manager, I want to deploy staff across multiple centres, so that I can balance workload without agency staff.",
      acceptanceCriteria: [
        "Can view staff availability across all centres",
        "Can assign staff to shifts at other centres",
        "Travel time and allowances calculated automatically",
        "Staff preferences for multi-site work respected",
        "Cross-centre shifts clearly marked in roster",
        "Cost charged to receiving centre's budget"
      ],
      businessLogic: [
        "Staff must be flagged as 'multi-site' eligible",
        "Travel allowance: Per km or flat rate by distance",
        "Time between centres counts as work time",
        "Home centre remains primary for entitlements",
        "Manager approval required from both centres",
        "Cross-deployment cost allocated to receiving centre"
      ],
      priority: "medium",
      relatedModules: [
        { module: "Staff Profiles", relationship: "Multi-site flag and preferences" },
        { module: "Awards", relationship: "Travel allowances calculated per rules" }
      ],
      endToEndJourney: [
        "1. Sunshine Centre short-staffed, Rainbow has excess",
        "2. Area Manager views regional availability",
        "3. Creates cross-deployment for Maria: Rainbow → Sunshine",
        "4. Travel allowance calculated: $15 (12 km)",
        "5. Both Centre Managers approve",
        "6. Maria notified of assignment at Sunshine",
        "7. Works shift, clocks in at Sunshine",
        "8. Travel allowance included in timesheet"
      ],
      realWorldExample: {
        scenario: "Training day leaves Sunshine short-staffed. Rainbow has spare capacity.",
        steps: [
          "Area Manager deploys 2 staff from Rainbow to Sunshine",
          "Travel allowance added: $10.20 each",
          "Both centres approve, staff notified",
          "Gap filled without agency cost"
        ],
        outcome: "Cross-centre deployment maximizes internal staff utilization."
      }
    },
    {
      id: "US-RST-022",
      title: "Configure Break Coverage and Staggering",
      actors: ["Centre Manager", "Lead Educator"],
      description: "As a Centre Manager, I want to plan staggered breaks that maintain room coverage, so that NQF ratios are never breached during meal breaks.",
      acceptanceCriteria: [
        "Can schedule breaks with specific times per staff",
        "System validates coverage before confirming",
        "Staggering suggestions based on ratio requirements",
        "Lead Educator can adjust break times during day",
        "Break taken vs scheduled captured in timesheet",
        "Alerts if ratio would be breached during break"
      ],
      businessLogic: [
        "Break duration based on shift length",
        "Minimum 2 educators in room at all times",
        "Breaks cannot overlap if it causes ratio breach",
        "Suggested stagger interval: 15-30 minutes",
        "Floater staff may cover multiple rooms during breaks",
        "Break times recorded for pay deduction"
      ],
      priority: "high",
      relatedModules: [
        { module: "Compliance", relationship: "Break coverage validation for ratios" },
        { module: "Timesheet", relationship: "Break times recorded for pay" }
      ],
      endToEndJourney: [
        "1. Centre Manager opens break planning for Toddler room",
        "2. 4 educators on shift, 15 children expected",
        "3. Required ratio 1:5 = minimum 3 educators always",
        "4. System suggests staggered 30-min breaks",
        "5. Manager approves break schedule",
        "6. Lead Educator manages actual break times",
        "7. Coverage maintained throughout lunch period"
      ],
      realWorldExample: {
        scenario: "Toddler room lunch period requires careful break staggering.",
        steps: [
          "System generates optimized break schedule",
          "Each educator takes break while 3 remain",
          "Ratio never breached during lunch period",
          "Break times automatically recorded"
        ],
        outcome: "Systematic break scheduling ensures continuous compliance."
      }
    },
    {
      id: "US-RST-023",
      title: "Integrate Child Attendance for Dynamic Staffing",
      actors: ["Centre Manager", "System Administrator"],
      description: "As a Centre Manager, I want staffing recommendations based on actual child attendance, so that levels respond to real demand.",
      acceptanceCriteria: [
        "System receives real-time child check-in data",
        "Staffing recommendations update as attendance changes",
        "Alerts when child count exceeds staff capacity",
        "End-of-day reconciliation compares planned vs actual",
        "Historical patterns inform future planning",
        "Integration with child booking system"
      ],
      businessLogic: [
        "Child check-in updates room occupancy in real-time",
        "Ratio calculation: Children present / Educators clocked in",
        "Understaffing alert when ratio >95% of threshold",
        "Overstaffing opportunity when ratio <60%",
        "15-minute refresh cycle for recommendations",
        "Late arrivals and early departures tracked"
      ],
      priority: "high",
      relatedModules: [
        { module: "Child Booking System", relationship: "Provides attendance data" },
        { module: "Compliance", relationship: "Real-time ratio monitoring" }
      ],
      endToEndJourney: [
        "1. Morning: Centre opens with 3 educators",
        "2. Children check in throughout morning",
        "3. System tracks ratio as attendance increases",
        "4. Alert at 9 AM: Nursery approaching capacity",
        "5. Manager assigns floater to Nursery",
        "6. Later: Early departures create overstaffing opportunity",
        "7. End of day report shows peak ratio times"
      ],
      realWorldExample: {
        scenario: "Flu season causes higher child absences than expected.",
        steps: [
          "Only 60% of expected children arrive",
          "System recommends releasing 2 casual staff",
          "Manager contacts casuals, reduces hours by consent",
          "$420 saved while maintaining compliance"
        ],
        outcome: "Real-time integration enables dynamic cost optimization."
      }
    },
    {
      id: "US-RST-024",
      title: "Export Roster to Personal Calendar",
      actors: ["Educator (Staff)"],
      description: "As an Educator, I want to sync my roster to my personal calendar, so that I see work alongside personal commitments.",
      acceptanceCriteria: [
        "Can generate personal iCal feed URL",
        "Shifts appear in Google Calendar, Outlook, Apple",
        "Updates sync automatically when roster changes",
        "Can choose what details to include",
        "Privacy options for shared calendars",
        "Feed remains active while employed"
      ],
      businessLogic: [
        "iCal feed URL unique per staff member",
        "Feed includes published shifts only",
        "Refresh frequency: Every 15-30 minutes",
        "Changed/cancelled shifts update in synced calendar",
        "Location field populated with centre address",
        "Reminder settings controlled by user's calendar app"
      ],
      priority: "low",
      relatedModules: [
        { module: "Notifications", relationship: "Changes trigger notification" },
        { module: "Staff Portal", relationship: "Feed URL in portal settings" }
      ],
      endToEndJourney: [
        "1. Educator opens Portal > Calendar Sync",
        "2. Generates unique iCal URL",
        "3. Adds URL to Google Calendar",
        "4. All shifts appear in personal calendar",
        "5. Future roster changes sync automatically",
        "6. Work schedule visible alongside personal events"
      ],
      realWorldExample: {
        scenario: "Staff member wants work shifts in Google Calendar with family events.",
        steps: [
          "Generates iCal link from Employee Portal",
          "Adds to Google Calendar",
          "All shifts appear with location and times",
          "Roster updates sync within 30 minutes"
        ],
        outcome: "Personal calendar always shows current roster. No manual entry needed."
      }
    },
    {
      id: "US-RST-025",
      title: "Manage Trainee and Student Placements",
      actors: ["Centre Manager", "HR Administrator"],
      description: "As a Centre Manager, I want to schedule trainee placements separately, so they don't count toward ratios but are visible in the roster.",
      acceptanceCriteria: [
        "Can create 'trainee' or 'student' placement type",
        "Placements visible but not counted in ratios",
        "Supervisor assignment for each placement",
        "Placement hours tracked for training records",
        "Different duration limits per placement type",
        "Reports show placement hours by trainee"
      ],
      businessLogic: [
        "Supernumerary: Not counted for ratio compliance",
        "Types: Cert III Student, Diploma Student, Trainee, Work Experience",
        "Supervisor must be qualified educator on same shift",
        "Maximum placement hours may apply",
        "Hours contribute to qualification progress",
        "No pay or reduced trainee rate"
      ],
      priority: "medium",
      relatedModules: [
        { module: "HR", relationship: "Trainee records and placement agreements" },
        { module: "Compliance", relationship: "Placement hours tracked for audit" }
      ],
      endToEndJourney: [
        "1. TAFE sends Cert III student for placement",
        "2. HR creates Student Placement profile",
        "3. Manager schedules placement with supervisor",
        "4. Placement appears in roster with 'Student' badge",
        "5. Not counted in ratio calculations",
        "6. Supervisor confirms hours each day",
        "7. Weekly report sent to TAFE with cumulative hours"
      ],
      realWorldExample: {
        scenario: "Centre hosts 2 TAFE students on placement.",
        steps: [
          "HR creates student profiles with placement agreements",
          "Manager schedules 2 days/week each",
          "Supervisors assigned to each student",
          "Hours tracked toward 120-hour requirement",
          "Reports generated for TAFE verification"
        ],
        outcome: "Student placements tracked without affecting ratio compliance."
      }
    }
  ],

  tableSpecs: [
    {
      name: "Centres",
      schema: "roster_core",
      description: "Stores childcare centre locations and configuration",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key, auto-generated UUID" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", foreignKey: "tenants.id" },
        { name: "name", type: "NVARCHAR(255)", mandatory: true, description: "Display name of the centre", validation: "1-255 characters" },
        { name: "code", type: "NVARCHAR(50)", mandatory: true, description: "Unique short code for the centre", validation: "Unique per tenant" },
        { name: "address", type: "NVARCHAR(500)", mandatory: false, description: "Street address" },
        { name: "suburb", type: "NVARCHAR(100)", mandatory: false, description: "Suburb/city name" },
        { name: "state", type: "NVARCHAR(50)", mandatory: false, description: "State/territory code (e.g., NSW, VIC)" },
        { name: "postcode", type: "NVARCHAR(20)", mandatory: false, description: "Postal code" },
        { name: "latitude", type: "DECIMAL(10,7)", mandatory: false, description: "GPS latitude for geofencing" },
        { name: "longitude", type: "DECIMAL(10,7)", mandatory: false, description: "GPS longitude for geofencing" },
        { name: "phone", type: "NVARCHAR(50)", mandatory: false, description: "Contact phone number" },
        { name: "email", type: "NVARCHAR(255)", mandatory: false, description: "Contact email address" },
        { name: "is_active", type: "BIT", mandatory: true, description: "Whether centre is operational", defaultValue: "1" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation timestamp", defaultValue: "GETUTCDATE()" },
        { name: "updated_at", type: "DATETIME2", mandatory: true, description: "Last update timestamp", defaultValue: "GETUTCDATE()" }
      ]
    },
    {
      name: "Rooms",
      schema: "roster_core",
      description: "Defines rooms within centres with age groups and capacity",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "centre_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Parent centre", foreignKey: "roster_core.Centres.id" },
        { name: "name", type: "NVARCHAR(100)", mandatory: true, description: "Room display name" },
        { name: "code", type: "NVARCHAR(50)", mandatory: false, description: "Short code for the room" },
        { name: "age_group", type: "NVARCHAR(50)", mandatory: true, description: "Age category: nursery, toddler, preschool, kindy" },
        { name: "capacity", type: "INT", mandatory: true, description: "Maximum children allowed" },
        { name: "min_age_months", type: "INT", mandatory: false, description: "Minimum age in months" },
        { name: "max_age_months", type: "INT", mandatory: false, description: "Maximum age in months" },
        { name: "required_ratio", type: "DECIMAL(5,2)", mandatory: true, description: "NQF educator-to-child ratio requirement" },
        { name: "min_qualified_staff", type: "INT", mandatory: true, description: "Minimum number of qualified educators", defaultValue: "1" },
        { name: "color", type: "NVARCHAR(50)", mandatory: false, description: "Display color for UI" },
        { name: "display_order", type: "INT", mandatory: true, description: "Sort order in UI", defaultValue: "0" },
        { name: "is_active", type: "BIT", mandatory: true, description: "Whether room is active", defaultValue: "1" }
      ]
    },
    {
      name: "Staff",
      schema: "roster_staff",
      description: "Employee and agency worker profiles",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier" },
        { name: "employee_id", type: "NVARCHAR(50)", mandatory: false, description: "HR system employee ID" },
        { name: "first_name", type: "NVARCHAR(100)", mandatory: true, description: "Staff member's first name" },
        { name: "last_name", type: "NVARCHAR(100)", mandatory: true, description: "Staff member's last name" },
        { name: "email", type: "NVARCHAR(255)", mandatory: false, description: "Email address for notifications" },
        { name: "phone", type: "NVARCHAR(50)", mandatory: false, description: "Mobile phone number" },
        { name: "avatar_url", type: "NVARCHAR(500)", mandatory: false, description: "Profile photo URL" },
        { name: "role", type: "NVARCHAR(50)", mandatory: true, description: "Job role: lead_educator, educator, assistant, cook, admin" },
        { name: "employment_type", type: "NVARCHAR(50)", mandatory: true, description: "permanent or casual" },
        { name: "agency_type", type: "NVARCHAR(50)", mandatory: false, description: "Agency name if external: anzuk, randstad, hays" },
        { name: "default_centre_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Primary work location", foreignKey: "roster_core.Centres.id" },
        { name: "hourly_rate", type: "DECIMAL(10,2)", mandatory: false, description: "Base hourly pay rate" },
        { name: "overtime_rate", type: "DECIMAL(10,2)", mandatory: false, description: "Overtime pay rate" },
        { name: "max_hours_per_week", type: "INT", mandatory: true, description: "Maximum contracted hours", defaultValue: "38" },
        { name: "is_active", type: "BIT", mandatory: true, description: "Active employee flag", defaultValue: "1" }
      ]
    },
    {
      name: "Shifts",
      schema: "roster_shifts",
      description: "Individual shift assignments with timing and status",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier" },
        { name: "centre_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Centre location", foreignKey: "roster_core.Centres.id" },
        { name: "room_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Room assignment", foreignKey: "roster_core.Rooms.id" },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Assigned staff member (null for open shifts)", foreignKey: "roster_staff.Staff.id" },
        { name: "shift_date", type: "DATE", mandatory: true, description: "Date of the shift" },
        { name: "start_time", type: "TIME", mandatory: true, description: "Shift start time" },
        { name: "end_time", type: "TIME", mandatory: true, description: "Shift end time" },
        { name: "break_minutes", type: "INT", mandatory: true, description: "Scheduled break duration", defaultValue: "0" },
        { name: "status", type: "NVARCHAR(50)", mandatory: true, description: "draft, published, confirmed, completed", defaultValue: "draft" },
        { name: "shift_type", type: "NVARCHAR(50)", mandatory: true, description: "regular, on_call, sleepover, broken", defaultValue: "regular" },
        { name: "is_open_shift", type: "BIT", mandatory: true, description: "Whether unassigned and available for claiming", defaultValue: "0" },
        { name: "is_ai_generated", type: "BIT", mandatory: true, description: "Created by AI solver", defaultValue: "0" },
        { name: "ai_generated_at", type: "DATETIME2", mandatory: false, description: "Timestamp of AI generation" },
        { name: "recurrence_group_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Links shifts in recurring series" },
        { name: "is_absent", type: "BIT", mandatory: true, description: "Staff marked absent", defaultValue: "0" },
        { name: "absence_reason", type: "NVARCHAR(50)", mandatory: false, description: "leave, sick, no_show, other" },
        { name: "replacement_staff_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Staff covering for absent original", foreignKey: "roster_staff.Staff.id" },
        { name: "notes", type: "NVARCHAR(MAX)", mandatory: false, description: "Free text notes" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation timestamp" },
        { name: "updated_at", type: "DATETIME2", mandatory: true, description: "Last update timestamp" }
      ]
    },
    {
      name: "ClockEvents",
      schema: "roster_attendance",
      description: "Time and attendance clock events with GPS validation",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier" },
        { name: "shift_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Associated shift", foreignKey: "roster_shifts.Shifts.id" },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Staff member", foreignKey: "roster_staff.Staff.id" },
        { name: "event_type", type: "NVARCHAR(50)", mandatory: true, description: "clock_in, clock_out, break_start, break_end" },
        { name: "scheduled_time", type: "DATETIME2", mandatory: false, description: "Expected time based on shift" },
        { name: "actual_time", type: "DATETIME2", mandatory: true, description: "Actual recorded time" },
        { name: "latitude", type: "DECIMAL(10,7)", mandatory: false, description: "GPS latitude" },
        { name: "longitude", type: "DECIMAL(10,7)", mandatory: false, description: "GPS longitude" },
        { name: "accuracy_meters", type: "INT", mandatory: false, description: "GPS accuracy in meters" },
        { name: "geofence_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Validated geofence zone", foreignKey: "roster_core.GeofenceZones.id" },
        { name: "within_geofence", type: "BIT", mandatory: false, description: "Whether within allowed zone" },
        { name: "distance_from_centre", type: "INT", mandatory: false, description: "Distance from centre in meters" },
        { name: "validation_status", type: "NVARCHAR(50)", mandatory: true, description: "valid, warning, invalid, manual_override", defaultValue: "valid" },
        { name: "validation_notes", type: "NVARCHAR(MAX)", mandatory: false, description: "Explanation for non-valid status" },
        { name: "device_info", type: "NVARCHAR(255)", mandatory: false, description: "Device/browser info for audit" },
        { name: "ip_address", type: "NVARCHAR(50)", mandatory: false, description: "IP address for audit" }
      ]
    },
    {
      name: "TimeOffRequests",
      schema: "roster_leave",
      description: "Leave and time off requests with approval workflow",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier" },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Requesting staff member", foreignKey: "roster_staff.Staff.id" },
        { name: "leave_type", type: "NVARCHAR(50)", mandatory: true, description: "annual_leave, sick_leave, personal_leave, unpaid_leave" },
        { name: "start_date", type: "DATE", mandatory: true, description: "First day of leave" },
        { name: "end_date", type: "DATE", mandatory: true, description: "Last day of leave" },
        { name: "hours_requested", type: "DECIMAL(10,2)", mandatory: false, description: "Total hours for partial day requests" },
        { name: "status", type: "NVARCHAR(50)", mandatory: true, description: "pending, approved, rejected, cancelled", defaultValue: "pending" },
        { name: "notes", type: "NVARCHAR(MAX)", mandatory: false, description: "Reason or additional notes" },
        { name: "approved_by", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Manager who approved", foreignKey: "roster_staff.Staff.id" },
        { name: "approved_at", type: "DATETIME2", mandatory: false, description: "Approval timestamp" },
        { name: "rejection_reason", type: "NVARCHAR(MAX)", mandatory: false, description: "Reason for rejection" }
      ]
    }
  ],

  integrations: [
    { system: "Awards Module", type: "Internal", description: "Provides pay rates, penalty calculations, and allowances for shift costing" },
    { system: "Performance Module", type: "Internal", description: "Links attendance patterns to performance reviews; leave patterns visible in 1:1 conversations" },
    { system: "Child Booking System", type: "External", description: "Imports daily child bookings for demand-based staffing calculations" },
    { system: "Payroll System", type: "External", description: "Exports approved timesheets with hours, rates, and allowances for payment processing" },
    { system: "HR System", type: "External", description: "Syncs staff profiles, employment details, and qualification records" },
    { system: "Agency Portals", type: "External", description: "Receives agency staff availability and sends shift requests to preferred agencies" },
    { system: "SMS/Email Gateway", type: "External", description: "Sends shift notifications, roster publications, and urgent alerts to staff" },
    { system: "Weather API", type: "External", description: "Fetches weather forecasts for demand adjustment factors" }
  ],

  businessRules: [
    { id: "BR-RST-001", rule: "Staff cannot be assigned to overlapping shifts at different centres", rationale: "Prevents impossible scheduling and ensures clear accountability" },
    { id: "BR-RST-002", rule: "Minimum 10 hours rest required between shift end and next shift start", rationale: "Fatigue management compliance and OH&S requirements" },
    { id: "BR-RST-003", rule: "Maximum 5 consecutive days worked before mandatory day off", rationale: "Fatigue management and award compliance" },
    { id: "BR-RST-004", rule: "NQF ratios must be maintained at all times during operating hours", rationale: "Regulatory compliance - breach is a notifiable incident" },
    { id: "BR-RST-005", rule: "50% of educators in each room must hold Diploma ECE or higher", rationale: "NQF qualification requirements for service approval" },
    { id: "BR-RST-006", rule: "At least one First Aid qualified person must be on-site at all times", rationale: "OH&S and regulatory compliance" },
    { id: "BR-RST-007", rule: "Published rosters cannot be edited without manager approval", rationale: "Staff rely on published schedules for planning" },
    { id: "BR-RST-008", rule: "Leave requests must be submitted minimum 2 weeks in advance for annual leave", rationale: "Allows adequate time for coverage planning (except sick leave)" },
    { id: "BR-RST-009", rule: "Shift swaps require matching or higher qualification levels", rationale: "Maintains compliance and service quality" },
    { id: "BR-RST-010", rule: "GPS clock validation fails if accuracy exceeds 100 meters", rationale: "Ensures location data is reliable for compliance verification" }
  ]
};
