// Roster Module - Software Requirements Specification
// Organized by functional area for logical flow

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
  indexed?: boolean;
}

export interface TableSpec {
  name: string;
  schema: string;
  description: string;
  fields: FieldSpec[];
  indexes?: string[];
  triggers?: string[];
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
  version: "2.0.0",
  lastUpdated: "2026-01-30",
  overview: `The Roster & Workforce Scheduling module provides comprehensive workforce management capabilities across all industries. It enables managers to create, manage, and optimize staff schedules while ensuring compliance with industry-specific regulations, fatigue management requirements, and applicable employment awards. The system supports multi-location operations, agency staff integration, GPS-validated time and attendance, and AI-powered schedule optimization.`,
  
  objectives: [
    "Reduce manual scheduling effort by 70% through automation and templates",
    "Ensure 100% compliance with industry-specific staffing ratios and regulations",
    "Minimize overtime costs through intelligent scheduling optimization",
    "Provide real-time visibility into staffing levels and compliance status",
    "Enable staff self-service for availability, leave requests, and shift swaps",
    "Integrate seamlessly with payroll through accurate time and attendance tracking",
    "Support multi-location operations with cross-site staff deployment"
  ],

  scope: [
    "Location and department configuration with capacity and ratio settings",
    "Staff profile management including qualifications and availability",
    "Shift creation, assignment, and template management",
    "Recurring shift pattern automation",
    "Open shift broadcasting and claim workflow",
    "GPS-validated clock in/out with geofencing",
    "Break scheduling with coverage validation",
    "Leave request and approval workflow",
    "Fatigue management and compliance monitoring",
    "Industry-specific ratio compliance tracking and alerting",
    "Demand forecasting with external factor integration",
    "Cost tracking and budget variance analysis",
    "Roster publishing and staff notifications",
    "Shift swap request management"
  ],

  outOfScope: [
    "Payroll processing and payment disbursement",
    "Customer/client booking management",
    "Customer communication and billing",
    "HR onboarding and offboarding workflows",
    "Learning management for staff training"
  ],

  actors: [
    {
      name: "Location Manager",
      description: "Responsible for day-to-day operations of a single location, including roster creation and staff management",
      permissions: [
        "Create, edit, and delete shifts for assigned location",
        "Approve/reject leave requests and shift swaps",
        "View and manage staff availability",
        "Publish rosters and send notifications",
        "Override compliance warnings with justification",
        "Access cost and budget reports for location"
      ]
    },
    {
      name: "Area Manager",
      description: "Oversees multiple locations within a region, with visibility across sites",
      permissions: [
        "All Location Manager permissions across multiple locations",
        "Deploy staff across locations within region",
        "Access consolidated reporting and analytics",
        "Configure regional settings and policies",
        "Approve cross-location transfers"
      ]
    },
    {
      name: "Staff Member",
      description: "Front-line worker who works assigned shifts and provides services",
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
      name: "Team Leader",
      description: "Senior staff with team leadership responsibilities",
      permissions: [
        "All Staff Member permissions",
        "View team roster and coverage",
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
        "Configure locations, departments, and geofence zones",
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
    },
    {
      name: "Payroll Administrator",
      description: "Processes timesheets and manages payroll integration",
      permissions: [
        "View and approve timesheets",
        "Investigate timesheet anomalies",
        "Export approved timesheets to payroll",
        "Configure approval workflows"
      ]
    }
  ],

  functionalRequirements: [
    // Location Setup
    { id: "FR-RST-001", category: "Location Setup", requirement: "System shall allow configuration of multiple locations with unique operating hours, departments, and capacity settings", priority: "Critical" },
    { id: "FR-RST-002", category: "Location Setup", requirement: "System shall support department configuration with service types, capacity limits, and staffing ratio requirements", priority: "Critical" },
    { id: "FR-RST-003", category: "Location Setup", requirement: "System shall allow definition of geofence zones for GPS-based clock validation", priority: "High" },
    // Staff Management
    { id: "FR-RST-004", category: "Staff Management", requirement: "System shall maintain staff profiles with employment type, role, qualifications, and pay rates", priority: "Critical" },
    { id: "FR-RST-005", category: "Staff Management", requirement: "System shall track qualification expiry dates and generate alerts 30/60/90 days before expiry", priority: "High" },
    { id: "FR-RST-006", category: "Staff Management", requirement: "System shall allow staff to define weekly availability with start/end times per day", priority: "High" },
    { id: "FR-RST-007", category: "Staff Management", requirement: "System shall support alternate week availability patterns with configurable anchor dates", priority: "Medium" },
    // Shift Management
    { id: "FR-RST-008", category: "Shift Management", requirement: "System shall allow creation of shifts with date, time, department, and staff assignment", priority: "Critical" },
    { id: "FR-RST-009", category: "Shift Management", requirement: "System shall support shift templates for rapid shift creation", priority: "High" },
    { id: "FR-RST-010", category: "Shift Management", requirement: "System shall detect and prevent scheduling conflicts (overlapping shifts, outside availability)", priority: "Critical" },
    // Recurring Shifts
    { id: "FR-RST-011", category: "Recurring Shifts", requirement: "System shall support creation of recurring shift patterns (daily, weekly, fortnightly, monthly)", priority: "High" },
    { id: "FR-RST-012", category: "Recurring Shifts", requirement: "System shall auto-generate future shifts based on recurring patterns", priority: "High" },
    { id: "FR-RST-013", category: "Recurring Shifts", requirement: "System shall allow bulk editing of all future instances in a recurring series", priority: "Medium" },
    // Open Shifts
    { id: "FR-RST-014", category: "Open Shifts", requirement: "System shall allow creation of unassigned open shifts for staff to claim", priority: "High" },
    { id: "FR-RST-015", category: "Open Shifts", requirement: "System shall filter eligible staff for open shifts based on qualifications and availability", priority: "High" },
    { id: "FR-RST-016", category: "Open Shifts", requirement: "System shall notify eligible staff when new open shifts are posted", priority: "Medium" },
    // Time & Attendance
    { id: "FR-RST-017", category: "Time & Attendance", requirement: "System shall capture clock in/out events with timestamp and GPS coordinates", priority: "Critical" },
    { id: "FR-RST-018", category: "Time & Attendance", requirement: "System shall validate clock events against geofence zones and flag violations", priority: "High" },
    { id: "FR-RST-019", category: "Time & Attendance", requirement: "System shall calculate worked hours and variance from scheduled hours", priority: "Critical" },
    // Break Management
    { id: "FR-RST-020", category: "Break Management", requirement: "System shall schedule breaks based on shift duration and award requirements", priority: "High" },
    { id: "FR-RST-021", category: "Break Management", requirement: "System shall validate department coverage during scheduled breaks", priority: "High" },
    // Leave Management
    { id: "FR-RST-022", category: "Leave Management", requirement: "System shall allow staff to submit leave requests with type and date range", priority: "High" },
    { id: "FR-RST-023", category: "Leave Management", requirement: "System shall track leave entitlements and balances by leave type", priority: "High" },
    { id: "FR-RST-024", category: "Leave Management", requirement: "System shall prevent shift assignment on approved leave dates", priority: "Critical" },
    // Compliance
    { id: "FR-RST-025", category: "Compliance", requirement: "System shall calculate real-time staff-to-service ratios per department", priority: "Critical" },
    { id: "FR-RST-026", category: "Compliance", requirement: "System shall generate alerts when ratio thresholds are breached or at risk", priority: "Critical" },
    { id: "FR-RST-027", category: "Compliance", requirement: "System shall track qualified vs unqualified staff counts for regulatory requirements", priority: "Critical" },
    // Fatigue Management
    { id: "FR-RST-028", category: "Fatigue Management", requirement: "System shall enforce maximum consecutive days worked limits", priority: "High" },
    { id: "FR-RST-029", category: "Fatigue Management", requirement: "System shall enforce minimum rest hours between shifts", priority: "High" },
    { id: "FR-RST-030", category: "Fatigue Management", requirement: "System shall calculate fatigue scores and flag high-risk staff", priority: "Medium" },
    // Publishing
    { id: "FR-RST-031", category: "Publishing", requirement: "System shall allow batch publishing of roster for a date range", priority: "High" },
    { id: "FR-RST-032", category: "Publishing", requirement: "System shall send notifications to affected staff upon roster publication", priority: "High" },
    // Swap Requests
    { id: "FR-RST-033", category: "Swap Requests", requirement: "System shall allow staff to request shift swaps with specific colleagues", priority: "Medium" },
    { id: "FR-RST-034", category: "Swap Requests", requirement: "System shall validate swap eligibility (qualifications, availability) before approval", priority: "Medium" },
    // Costing
    { id: "FR-RST-035", category: "Costing", requirement: "System shall calculate shift costs based on hourly rates, overtime, and penalties", priority: "High" },
    { id: "FR-RST-036", category: "Costing", requirement: "System shall track budget vs actual costs with variance reporting", priority: "High" },
    // Demand Forecasting
    { id: "FR-RST-037", category: "Demand Forecasting", requirement: "System shall integrate service demand data to forecast staffing needs", priority: "Medium" },
    { id: "FR-RST-038", category: "Demand Forecasting", requirement: "System shall adjust demand forecasts based on external factors (weather, holidays)", priority: "Low" },
    // Agency Integration
    { id: "FR-RST-039", category: "Agency Integration", requirement: "System shall broadcast unfilled shifts to configured agency partners", priority: "Medium" },
    { id: "FR-RST-040", category: "Agency Integration", requirement: "System shall track agency worker placements and ratings", priority: "Medium" }
  ],

  nonFunctionalRequirements: [
    { id: "NFR-RST-001", category: "Performance", requirement: "Roster grid shall load within 2 seconds for up to 50 staff and 7-day view" },
    { id: "NFR-RST-002", category: "Performance", requirement: "GPS clock event shall be processed within 500ms including geofence validation" },
    { id: "NFR-RST-003", category: "Availability", requirement: "System shall maintain 99.5% uptime during operating hours" },
    { id: "NFR-RST-004", category: "Scalability", requirement: "System shall support up to 500 concurrent users across 100 locations" },
    { id: "NFR-RST-005", category: "Security", requirement: "All API endpoints shall require authentication and role-based authorization" },
    { id: "NFR-RST-006", category: "Security", requirement: "GPS coordinates shall be encrypted in transit and at rest" },
    { id: "NFR-RST-007", category: "Compliance", requirement: "All data shall be stored in compliant data centres for privacy requirements" },
    { id: "NFR-RST-008", category: "Usability", requirement: "Mobile clock in/out shall work offline with sync when connectivity restored" },
    { id: "NFR-RST-009", category: "Audit", requirement: "All shift modifications shall be logged with user, timestamp, and change details" },
    { id: "NFR-RST-010", category: "Integration", requirement: "System shall provide REST API for payroll system integration" },
    { id: "NFR-RST-011", category: "Backup", requirement: "Database shall be backed up every 15 minutes with point-in-time recovery" },
    { id: "NFR-RST-012", category: "Retention", requirement: "Audit logs and historical data shall be retained for 7 years minimum" }
  ],

  // ============================================================================
  // USER STORIES - Organized by Functional Area
  // ============================================================================
  userStories: [
    // ============================================================================
    // SECTION 1: LOCATION & DEPARTMENT CONFIGURATION
    // ============================================================================
    {
      id: "US-RST-001",
      title: "Configure Location with Departments and Compliance Settings",
      actors: ["System Administrator", "Location Manager"],
      description: "As a System Administrator, I want to configure locations with their departments, operating hours, and compliance requirements, so that the roster system has the foundation for accurate scheduling and compliance monitoring.",
      acceptanceCriteria: [
        "Can create new location with name, address, and contact details",
        "Can define operating hours per day of week",
        "Can configure multiple departments within a location",
        "Can set GPS coordinates for geofence validation",
        "Can configure industry-specific ratio requirements per department",
        "Can specify qualification percentage requirements",
        "Changes are logged with full audit trail"
      ],
      businessLogic: [
        "Location code must be unique within tenant",
        "GPS coordinates required for geofencing feature",
        "Default geofence radius: 100 meters, configurable up to 500m",
        "Industry types: healthcare, aged_care, childcare, hospitality, retail, manufacturing, logistics",
        "Ratio requirements cascade to all departments unless overridden",
        "Operating hours determine valid clock-in windows"
      ],
      priority: "critical",
      relatedModules: [
        { module: "Compliance", relationship: "Ratio requirements used for compliance monitoring" },
        { module: "Time & Attendance", relationship: "Geofence coordinates used for GPS validation" }
      ],
      endToEndJourney: [
        "1. System Administrator opens Location Configuration",
        "2. Clicks 'Add New Location'",
        "3. Enters basic info: Name 'Downtown Branch', code 'DT001'",
        "4. Enters address and GPS coordinates from map picker",
        "5. Sets geofence radius to 150 meters",
        "6. Selects industry type: 'Healthcare'",
        "7. Configures operating hours: Mon-Fri 6am-9pm, Sat 8am-6pm",
        "8. Adds Department 1: 'High Care' with ratio 1:4",
        "9. Adds Department 2: 'Standard Care' with ratio 1:6",
        "10. Sets qualification requirements: 50% diploma minimum",
        "11. Saves configuration",
        "12. Location appears in roster dropdown for scheduling"
      ],
      realWorldExample: {
        scenario: "New healthcare facility opening requires complete system configuration before operations begin.",
        steps: [
          "Operations Manager provides floor plan and service types",
          "System Admin creates location with exact address",
          "GPS coordinates set using building entrance",
          "4 departments configured: ICU (1:2), General (1:4), Rehab (1:6), Admin (1:10)",
          "Qualification rules set per department type",
          "Operating hours configured for 24/7 operation",
          "Geofence set to 100m radius"
        ],
        outcome: "Location fully configured and ready for staff assignment and roster creation."
      }
    },
    {
      id: "US-RST-002",
      title: "Configure Staffing Ratio Requirements Per Department",
      actors: ["System Administrator", "Location Manager"],
      description: "As a System Administrator, I want to configure staff-to-service ratios for each department type, so that the compliance engine uses correct regulatory requirements.",
      acceptanceCriteria: [
        "Can set ratio requirements per service type",
        "Can specify qualified staff percentage requirements",
        "State/territory-specific variations supported",
        "Specialist requirements configurable per department",
        "Changes logged with audit trail",
        "Effective dates allow future ratio changes"
      ],
      businessLogic: [
        "Ratios configurable per industry (e.g., Healthcare 1:4, Aged Care 1:5, Childcare 1:4-1:11)",
        "Qualification percentage rules (e.g., 50% must hold specific qualification)",
        "Specialist requirements per department type",
        "State variations: Some states have stricter ratios",
        "Ratios apply during operating hours only",
        "Different ratios may apply during special events"
      ],
      priority: "critical",
      relatedModules: [
        { module: "Compliance Dashboard", relationship: "Uses ratios for real-time monitoring" },
        { module: "AI Scheduler", relationship: "Uses ratios as hard constraints in optimization" }
      ],
      endToEndJourney: [
        "1. System Admin opens Location Configuration",
        "2. Selects Downtown Branch",
        "3. Opens Department Settings > Compliance Requirements",
        "4. For Department A (High Care):",
        "5. Sets ratio: 1 staff per 4 clients",
        "6. Sets qualification: 50% must hold Diploma minimum",
        "7. For Department B (Standard Care):",
        "8. Sets ratio: 1:5",
        "9. For Department C (Low Intensity):",
        "10. Sets ratio: 1:10, requires qualified supervisor",
        "11. For Department D (Admin Support):",
        "12. Sets ratio: 1:15, no specific qualification required",
        "13. Saves configuration with effective date",
        "14. Compliance engine now uses these settings",
        "15. All ratio calculations update to new requirements"
      ],
      realWorldExample: {
        scenario: "New state regulations require stricter ratios for certain departments. Admin updates the system configuration.",
        steps: [
          "State government announces new regulation",
          "Department B ratio changing from 1:5 to 1:4",
          "Effective date: 1 July 2026",
          "System Admin receives notification from HR",
          "Opens Compliance Configuration",
          "Creates new ratio rule with future effective date",
          "System schedules activation for specified date",
          "On effective date, new ratio becomes active automatically"
        ],
        outcome: "Regulatory change implemented seamlessly with advance notice. Compliance automatic from effective date."
      }
    },
    {
      id: "US-RST-003",
      title: "Configure Geofence Zones for Clock Validation",
      actors: ["System Administrator"],
      description: "As a System Administrator, I want to define geofence zones around locations, so that staff clock events can be validated against their physical presence.",
      acceptanceCriteria: [
        "Can define circular geofence with center point and radius",
        "Can define multiple zones per location (e.g., main building, annex)",
        "Can set buffer distance for marginal GPS accuracy",
        "Can configure validation rules (strict, warning, disabled)",
        "Can view geofence overlay on map interface",
        "Changes take effect immediately for new clock events"
      ],
      businessLogic: [
        "Geofence validation uses Haversine formula for distance calculation",
        "Minimum radius: 50 meters (accounts for GPS drift)",
        "Maximum radius: 500 meters (for large campuses)",
        "Buffer zone: Additional 20% added for marginal cases",
        "Validation modes: strict (block invalid), warning (allow with flag), disabled",
        "Indoor GPS accuracy typically ±20m, outdoor ±5m"
      ],
      priority: "high",
      relatedModules: [
        { module: "Time & Attendance", relationship: "Uses geofence for clock validation" },
        { module: "Compliance", relationship: "Geofence violations logged for audit" }
      ],
      endToEndJourney: [
        "1. System Admin opens Location Settings > Geofence Configuration",
        "2. Map view shows location with current zone",
        "3. Admin adjusts center point to building entrance",
        "4. Sets radius to 100 meters (standard urban location)",
        "5. Adds secondary zone for parking lot (150m radius, offset center)",
        "6. Sets validation mode to 'Warning' for first month",
        "7. Saves configuration",
        "8. Next clock event uses new geofence settings",
        "9. Staff outside zone see warning but can still clock",
        "10. Manager reviews geofence warnings weekly"
      ],
      realWorldExample: {
        scenario: "Campus location has multiple buildings requiring separate geofence zones.",
        steps: [
          "Main building set with 80m radius",
          "Annex building 200m away gets separate 60m zone",
          "Parking lot gets 120m zone for early arrivals",
          "All zones linked to single location",
          "Staff can clock from any valid zone",
          "System tracks which zone was used for analytics"
        ],
        outcome: "Multi-building campus fully covered with accurate clock validation."
      }
    },

    // ============================================================================
    // SECTION 2: STAFF PROFILE & QUALIFICATIONS MANAGEMENT
    // ============================================================================
    {
      id: "US-RST-004",
      title: "Manage Staff Qualifications and Expiry Alerts",
      actors: ["HR Administrator", "Location Manager"],
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
        "Required qualifications: First Aid, CPR, Background Check, Certification",
        "Role-specific: Diploma, Bachelor, Trade Certificate, Food Safety",
        "Alert recipients: Staff member, their manager, HR",
        "Grace period: 7 days after expiry before blocking",
        "Expired background check: Immediate block from all shifts",
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
        "4. Staff member Tom's First Aid expires in 25 days",
        "5. HR sends reminder via system notification",
        "6. Tom books renewal course externally",
        "7. After completing course, Tom uploads new certificate",
        "8. HR reviews and approves the uploaded certificate",
        "9. Qualification extended with new expiry date",
        "10. Tom removed from expiring list"
      ],
      realWorldExample: {
        scenario: "Monthly qualification review reveals several upcoming expiries that need proactive management.",
        steps: [
          "HR Admin opens the Qualification Dashboard",
          "Dashboard shows traffic light summary",
          "Green: 45 staff with all current qualifications",
          "Amber: 8 staff with qualifications expiring soon",
          "Red: 2 staff with expired qualifications (grace period)",
          "HR sends bulk reminder to amber list",
          "Staff complete renewals and upload certificates",
          "HR approves updates, all move to green"
        ],
        outcome: "Proactive qualification management ensures continuous compliance."
      }
    },
    {
      id: "US-RST-005",
      title: "Submit and Manage Staff Availability",
      actors: ["Staff Member", "Location Manager"],
      description: "As a Staff Member, I want to submit my weekly availability, so that managers can schedule me during times I'm able to work.",
      acceptanceCriteria: [
        "Can set default availability per day of week",
        "Can specify available hours with start/end times",
        "Can set different patterns for alternating weeks",
        "Can submit temporary availability changes with date range",
        "Manager can view and approve availability changes",
        "Availability conflicts prevent shift assignment"
      ],
      businessLogic: [
        "Availability types: Available, Preferred, Unavailable",
        "Time granularity: 15-minute blocks",
        "Alternating patterns: Week A/Week B with anchor date",
        "Temporary changes require manager approval if <7 days notice",
        "Approved availability blocks shift assignment outside hours",
        "Preferences used as soft constraints in AI scheduling"
      ],
      priority: "high",
      relatedModules: [
        { module: "AI Scheduler", relationship: "Availability is hard constraint" },
        { module: "Open Shifts", relationship: "Filters eligible shifts by availability" }
      ],
      endToEndJourney: [
        "1. Staff member Emma opens Availability Settings",
        "2. Sets regular week: Mon-Wed 7am-3pm, Thu-Fri 9am-5pm",
        "3. Marks Saturday as 'Available if needed'",
        "4. Marks Sunday as 'Unavailable'",
        "5. Saves default availability pattern",
        "6. Later, Emma needs 2 weeks modified for university exams",
        "7. Submits temporary change: Mon-Wed only for 2 weeks",
        "8. Manager Sarah receives notification",
        "9. Sarah approves the temporary change",
        "10. Emma's availability updates for those specific weeks",
        "11. Roster shows Emma unavailable Thu-Fri during exam period"
      ],
      realWorldExample: {
        scenario: "Part-time student staff member needs flexible scheduling around university commitments.",
        steps: [
          "Emma sets semester availability: Mon/Wed/Fri mornings",
          "Summer break: Full availability Mon-Sat",
          "Exam periods: Reduced to 2 days/week",
          "All changes submitted with evidence (timetable)",
          "Manager approves based on business needs",
          "AI scheduler uses availability for all future rosters"
        ],
        outcome: "Staff work-life balance maintained while ensuring scheduling accuracy."
      }
    },
    {
      id: "US-RST-006",
      title: "Manage Alternate Week Availability Patterns",
      actors: ["Staff Member", "Location Manager"],
      description: "As a Staff Member with rotating personal commitments, I want to set different availability patterns for alternating weeks, so that my schedule accommodates custody arrangements or recurring obligations.",
      acceptanceCriteria: [
        "Can define Week A and Week B patterns",
        "Can set anchor date to align patterns",
        "System correctly calculates which week applies to any date",
        "Visual indicator shows Week A vs Week B in calendar",
        "Manager can view patterns when scheduling",
        "Patterns integrate with shift assignment validation"
      ],
      businessLogic: [
        "Anchor date determines Week A start",
        "Week number calculated: (targetDate - anchorDate) / 7 % 2",
        "Week A = even result, Week B = odd result",
        "Fortnightly recurrence can align with Week A/B",
        "Conflicts flagged when shift assigned outside pattern availability",
        "Pattern changes require 2 weeks notice by default"
      ],
      priority: "medium",
      relatedModules: [
        { module: "Recurring Shifts", relationship: "Fortnightly patterns align with Week A/B" },
        { module: "AI Scheduler", relationship: "Considers alternating availability" }
      ],
      endToEndJourney: [
        "1. Staff member Tom has shared custody: Week A with kids, Week B without",
        "2. Opens Availability and selects 'Alternating Weeks' option",
        "3. Sets anchor date: First Monday of custody arrangement",
        "4. Week A pattern: Mon-Wed 9am-3pm only (school hours)",
        "5. Week B pattern: Mon-Fri 7am-6pm (full flexibility)",
        "6. Saves alternating pattern",
        "7. Manager opens roster planning",
        "8. System shows Tom's availability varies by week",
        "9. Color coding indicates Week A (yellow) vs Week B (green)",
        "10. Shifts assigned respecting correct week pattern"
      ],
      realWorldExample: {
        scenario: "Staff member with shared custody needs different hours on alternating weeks.",
        steps: [
          "Tom documents custody schedule with HR",
          "Sets Week A: School-hours only (custody week)",
          "Sets Week B: Full availability (non-custody week)",
          "Anchor date aligned with custody calendar",
          "All future rosters automatically apply correct pattern",
          "No weekly availability submissions needed"
        ],
        outcome: "Consistent, predictable scheduling that respects personal commitments."
      }
    },

    // ============================================================================
    // SECTION 3: SHIFT CREATION & TEMPLATES
    // ============================================================================
    {
      id: "US-RST-007",
      title: "Create Weekly Roster from Template",
      actors: ["Location Manager"],
      description: "As a Location Manager, I want to apply a weekly roster template to quickly create a baseline schedule for the upcoming week, so that I can save time on repetitive scheduling tasks.",
      acceptanceCriteria: [
        "Can select from saved roster templates for my location",
        "Template creates open shifts for each department/day/time combination",
        "Existing shifts on target dates are not overwritten",
        "Confirmation shows count of shifts to be created vs skipped",
        "Created shifts appear in draft status for review before publishing"
      ],
      businessLogic: [
        "Template shifts are created as Open Shifts without staff assignment",
        "Duplicate detection: Skip if matching department + date + start time already exists",
        "Template shifts inherit qualification requirements and role preferences",
        "Shifts are created in 'draft' status, not visible to staff until published"
      ],
      priority: "high",
      relatedModules: [
        { module: "Awards", relationship: "Shift cost preview uses award rates for budget estimation" },
        { module: "Compliance", relationship: "Created shifts trigger ratio compliance pre-check" }
      ],
      endToEndJourney: [
        "1. Location Manager opens Roster view and selects week starting Monday",
        "2. Clicks 'Apply Template' button in toolbar",
        "3. Selects 'Standard Week' template from dropdown",
        "4. System validates no conflicting shifts exist",
        "5. Preview modal shows 35 shifts to create, 0 skipped",
        "6. Manager confirms application",
        "7. System creates 35 open shifts across 5 departments × 7 days",
        "8. Roster grid refreshes showing new open shifts",
        "9. Manager begins assigning staff to shifts",
        "10. Once complete, Manager clicks 'Publish' to notify staff"
      ],
      realWorldExample: {
        scenario: "Sarah, Location Manager at Downtown Branch, prepares the roster for next week. Her location has 5 departments with consistent staffing patterns.",
        steps: [
          "Sarah logs in Monday morning to prepare next week's roster",
          "She navigates to the Roster view and clicks 'Apply Template'",
          "Selects 'Standard Week - Full Capacity' template",
          "System shows preview: 35 shifts will be created across all departments",
          "Sarah confirms and the shifts appear as open (unassigned)",
          "She then drags staff members onto each shift based on their availability"
        ],
        outcome: "The weekly roster is created in 15 minutes instead of 2 hours, with all compliance checks passed automatically."
      }
    },
    {
      id: "US-RST-008",
      title: "Create Recurring Shift Pattern",
      actors: ["Location Manager"],
      description: "As a Location Manager, I want to create recurring shift patterns for staff with fixed schedules, so that their shifts are automatically generated each week without manual entry.",
      acceptanceCriteria: [
        "Can create pattern with days of week, times, and department",
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
        "1. Location Manager Sarah hires permanent staff member Tom",
        "2. Tom will work Monday, Tuesday, Thursday 7AM-3PM in Dept A",
        "3. Sarah opens Roster and clicks 'Create Recurring Pattern'",
        "4. Enters name: 'Tom - Regular Weekly'",
        "5. Selects pattern: Weekly",
        "6. Checks days: Monday, Tuesday, Thursday",
        "7. Sets times: 7:00 AM to 3:00 PM",
        "8. Selects department: Dept A",
        "9. Assigns staff: Tom Wilson",
        "10. Sets duration: Ongoing (no end date)",
        "11. Sarah clicks 'Create Pattern'",
        "12. System generates 24 shifts (8 weeks × 3 days)",
        "13. Roster grid shows shifts with green recurring icon"
      ],
      realWorldExample: {
        scenario: "Tom joins the organization as a permanent part-time staff member. His contract specifies fixed days each week.",
        steps: [
          "Sarah receives Tom's signed contract: Mon/Tue/Thu, 7AM-3PM",
          "She opens the Roster system and clicks 'Recurring Patterns'",
          "Creates 'Tom Wilson - PT Schedule' with Weekly recurrence",
          "Assigns to Dept A with 30-min break",
          "Leaves end date blank (ongoing)",
          "System immediately creates shifts for next 8 weeks",
          "Tom can now see his entire schedule in the staff app"
        ],
        outcome: "Tom's fixed schedule is set up once and automatically maintained, saving 15 minutes per week on manual entry."
      }
    },
    {
      id: "US-RST-009",
      title: "Copy Week Roster to Future Date Range",
      actors: ["Location Manager"],
      description: "As a Location Manager, I want to copy an existing week's roster to a future date range, so that I can quickly replicate successful schedules.",
      acceptanceCriteria: [
        "Select source week with complete roster",
        "Choose target week(s) for copying",
        "Option to copy with or without staff assignments",
        "Skip dates that already have shifts",
        "Preview shows shifts to be created",
        "Bulk create with single confirmation"
      ],
      businessLogic: [
        "Source week must have at least 1 shift",
        "Target dates calculated by day-of-week offset",
        "Conflict detection: Skip if matching shift exists",
        "Staff assignment optional (creates open shifts if unchecked)",
        "Copied shifts created in 'draft' status",
        "Maximum 4 weeks can be copied at once"
      ],
      priority: "medium",
      relatedModules: [
        { module: "Roster Templates", relationship: "Alternative to template application" },
        { module: "Publishing", relationship: "Copied shifts require publication" }
      ],
      endToEndJourney: [
        "1. Manager completes excellent roster for week of March 3",
        "2. Wants to replicate for next 2 weeks",
        "3. Opens 'Copy Week' from roster toolbar",
        "4. Selects source: March 3-9",
        "5. Selects targets: March 10-16, March 17-23",
        "6. Checks 'Include staff assignments'",
        "7. Preview shows: 70 shifts to create across 2 weeks",
        "8. Confirms copy",
        "9. All shifts created in draft status",
        "10. Manager reviews and publishes"
      ],
      realWorldExample: {
        scenario: "Holiday closure roster replicated for multiple weeks.",
        steps: [
          "Reduced roster created for holiday period",
          "Only 3 staff per day instead of usual 6",
          "Copy applied to all 3 weeks of holiday period",
          "Minor adjustments made for public holidays",
          "Published in single batch"
        ],
        outcome: "3 weeks of roster created in 5 minutes."
      }
    },
    {
      id: "US-RST-010",
      title: "Detect Expiring Recurring Shift Series (Background)",
      actors: ["System", "Location Manager"],
      description: "As a System, I want to automatically detect recurring shift series that are about to expire, so that managers can extend or renew patterns before they end.",
      acceptanceCriteria: [
        "System scans all recurring shift patterns nightly",
        "Identifies series ending within 14 days (warning) or 7 days (critical)",
        "Counts remaining occurrences for each expiring series",
        "Generates in-app alerts for affected managers",
        "Sends email notifications to staff and managers",
        "Expiry notifications include pattern details and renewal options"
      ],
      businessLogic: [
        "Background job runs daily at 2 AM",
        "Warning threshold: 14 days from last occurrence",
        "Critical threshold: 7 days from last occurrence",
        "Notification deduplication: Don't re-notify within 3 days",
        "Email template includes: Staff name, pattern type, end date, occurrences remaining",
        "In-app badge shows count of expiring series"
      ],
      priority: "medium",
      relatedModules: [
        { module: "Notifications", relationship: "Triggers email and in-app alerts" },
        { module: "Recurring Patterns", relationship: "Scans active pattern definitions" }
      ],
      endToEndJourney: [
        "1. Background service runs at 2 AM daily",
        "2. Scans all shifts with recurrence_group_id",
        "3. Groups by series and finds last occurrence date",
        "4. Emma's 'Mon/Wed/Fri' pattern ends in 5 days",
        "5. System creates notification: severity 'critical'",
        "6. Manager Sarah receives in-app alert",
        "7. Emma receives email: 'Your recurring schedule ends soon'",
        "8. Sarah extends the pattern for another 8 weeks",
        "9. System generates new shift instances",
        "10. Notification cleared from dashboard"
      ],
      realWorldExample: {
        scenario: "Tom's weekly pattern was set with an end date 6 days away.",
        steps: [
          "Nightly job detects Tom's series ending in 6 days",
          "Critical notification created",
          "Manager receives alert with 'Extend Series' button",
          "Manager clicks through, extends pattern indefinitely",
          "System generates shifts for next 8 weeks"
        ],
        outcome: "Pattern extended before disruption. Staff schedule continuity maintained."
      }
    },

    // ============================================================================
    // SECTION 4: SHIFT ASSIGNMENT & AI SCHEDULING
    // ============================================================================
    {
      id: "US-RST-011",
      title: "Run AI-Powered Schedule Optimization",
      actors: ["Location Manager", "Area Manager"],
      description: "As a Location Manager, I want the AI to suggest an optimal roster that balances compliance, staff preferences, and cost, so that I can create efficient schedules faster.",
      acceptanceCriteria: [
        "Can initiate AI optimization for selected date range",
        "AI considers: compliance, availability, preferences, fairness, cost",
        "Results show multiple scenario options",
        "Can compare scenarios by different metrics",
        "Can accept AI suggestions or modify manually",
        "Optimization runs complete within 60 seconds"
      ],
      businessLogic: [
        "Hard constraints: Staffing ratios, qualifications, availability, leave",
        "Soft constraints: Staff preferences, fairness, overtime minimization",
        "Objectives: Minimize cost while meeting coverage requirements",
        "Algorithm: Constraint satisfaction with cost optimization",
        "Fairness: Balance hours across staff within 10%",
        "Presets: Compliance First, Cost Focused, Balanced"
      ],
      priority: "medium",
      relatedModules: [
        { module: "Timefold", relationship: "Solver engine for optimization" },
        { module: "Awards", relationship: "Cost calculations for optimization" }
      ],
      endToEndJourney: [
        "1. Location Manager Sarah opens Roster for next week",
        "2. Has 10 open shifts and 8 available staff",
        "3. Clicks 'AI Optimize' button",
        "4. Selects preset: 'Balanced'",
        "5. Progress indicator shows optimization running",
        "6. After 30 seconds, results appear",
        "7. Scenario A: All shifts covered, $2,340 cost, 85% preference match",
        "8. Scenario B: All shifts covered, $2,180 cost, 72% preference match",
        "9. Sarah selects Scenario A (better staff satisfaction)",
        "10. Shifts auto-assigned based on AI recommendation",
        "11. Sarah reviews and publishes"
      ],
      realWorldExample: {
        scenario: "Complex week with multiple events requires optimal scheduling.",
        steps: [
          "Week includes public holiday with penalty rates",
          "3 staff on leave, agency budget limited",
          "AI considers all constraints",
          "Generates 3 scenarios with trade-offs",
          "Manager selects option balancing cost and compliance",
          "30 shifts optimally assigned in 45 seconds"
        ],
        outcome: "AI scheduling reduces planning time from 3 hours to 15 minutes with better outcomes."
      }
    },
    {
      id: "US-RST-012",
      title: "Calculate Skill Match Scores for Assignments (Background)",
      actors: ["System", "Location Manager"],
      description: "As a System, I want to calculate skill match scores between staff and shift requirements, so that auto-assignment uses the best-fit staff.",
      acceptanceCriteria: [
        "Match score calculated from multiple factors",
        "Required qualifications are mandatory (pass/fail)",
        "Preferred skills contribute to score (weighted)",
        "Skill levels compared to minimum requirements",
        "Staff ranked by score for each shift",
        "Auto-assign uses ranked list"
      ],
      businessLogic: [
        "Mandatory = Must have qualification, or score capped at 40",
        "Each skill: (staffLevel / requiredLevel) × weight",
        "Weights configurable per organization",
        "Score normalized to 0-100 scale",
        "Staff with >50 score and mandatory=true eligible",
        "Break ties by: lowest hourly rate (cost optimization)"
      ],
      priority: "medium",
      relatedModules: [
        { module: "Staff Profiles", relationship: "Qualifications and skills stored" },
        { module: "AI Scheduler", relationship: "Uses scores for optimization" }
      ],
      endToEndJourney: [
        "1. Open shift requires: First Aid (mandatory), Leadership (preferred)",
        "2. System evaluates available staff:",
        "3. Emma: First Aid ✓, Leadership 4/5 = Score 85",
        "4. Tom: First Aid ✓, Leadership 3/5 = Score 72",
        "5. Maria: First Aid ✗ = Score 38 (capped, ineligible)",
        "6. Ranked list: Emma (85), Tom (72)",
        "7. Manager sees recommendation: Emma is best match",
        "8. Auto-assign selects Emma",
        "9. Skill match details visible in assignment panel"
      ],
      realWorldExample: {
        scenario: "Auto-fill 10 open shifts using skill matching.",
        steps: [
          "10 shifts need staffing, 12 available staff",
          "System calculates 120 match scores (10 × 12)",
          "Optimizes: maximize total match while covering all shifts",
          "Result: All shifts filled with avg score 78",
          "Manager reviews and accepts recommendations"
        ],
        outcome: "Best-fit assignments reduce training gaps and improve quality."
      }
    },
    {
      id: "US-RST-013",
      title: "Detect Cross-Location Shift Conflicts",
      actors: ["System", "Location Manager"],
      description: "As a System, I want to detect when a staff member is assigned overlapping shifts at different locations, so that impossible schedules are prevented.",
      acceptanceCriteria: [
        "Real-time conflict detection across all locations",
        "Blocks overlapping shift assignment at different sites",
        "Considers travel time between locations",
        "Conflict details shown with both shifts",
        "Cannot override cross-location conflicts (physical impossibility)",
        "Checks run before any shift create/edit"
      ],
      businessLogic: [
        "Overlap = Shift A end time > Shift B start time at different location",
        "Travel buffer: Configurable per location pair (default 30 min)",
        "Conflict types: Same time (hard block), Insufficient travel (warning)",
        "Multi-location staff: Extra validation required",
        "Conflict logged for audit regardless of outcome",
        "Detection runs synchronously on shift operations"
      ],
      priority: "critical",
      relatedModules: [
        { module: "Publishing", relationship: "Conflicts block roster publication" },
        { module: "Shift Swaps", relationship: "Conflicts block swap approval" }
      ],
      endToEndJourney: [
        "1. Manager at Location A assigns Emma to 9am-3pm shift",
        "2. Manager at Location B tries to assign Emma 2pm-6pm same day",
        "3. System detects potential conflict",
        "4. Calculates travel time: 25 minutes between locations",
        "5. Shift A ends 3pm, Shift B starts 2pm = 1 hour overlap",
        "6. Error displayed: 'Emma already assigned 9am-3pm at Location A'",
        "7. Assignment blocked, cannot override",
        "8. Manager B selects different staff member",
        "9. Conflict attempt logged for Area Manager visibility"
      ],
      realWorldExample: {
        scenario: "Multi-location staff accidentally double-booked.",
        steps: [
          "Tom works at both Downtown and North branches",
          "Downtown manager schedules Tom for Monday afternoon",
          "North manager doesn't know, tries to schedule Tom Monday all day",
          "System blocks the North assignment",
          "Error message shows the conflict details",
          "North manager assigns someone else",
          "Area Manager sees conflict report"
        ],
        outcome: "Physical impossibility prevented automatically across locations."
      }
    },

    // ============================================================================
    // SECTION 5: OPEN SHIFTS & CLAIMS
    // ============================================================================
    {
      id: "US-RST-014",
      title: "Claim Open Shift",
      actors: ["Staff Member"],
      description: "As a Staff Member, I want to view and claim available open shifts, so that I can pick up extra hours when I'm available.",
      acceptanceCriteria: [
        "Can view list of open shifts matching my qualifications",
        "Each open shift shows date, time, department, and urgency level",
        "Can filter by date range and location",
        "Can submit interest in a shift with one tap",
        "Receive notification when shift is confirmed or given to someone else",
        "Confirmed shift appears in my schedule automatically"
      ],
      businessLogic: [
        "Open shifts filtered by: qualification match, availability, no conflicts",
        "Staff can only see shifts they're eligible for based on role and qualifications",
        "First-come-first-served or manager approval depending on location settings",
        "Claimed shift converts from OpenShift to Shift record",
        "Overtime threshold checked before allowing claim",
        "Cross-location shifts only shown if staff has multi-location flag"
      ],
      priority: "high",
      relatedModules: [
        { module: "Awards", relationship: "Claimed shift may trigger overtime rates" },
        { module: "Fatigue", relationship: "System checks rest hours before allowing claim" }
      ],
      endToEndJourney: [
        "1. Staff member Emma wants extra hours this week",
        "2. Opens app and goes to 'Available Shifts' section",
        "3. Sees 3 open shifts matching her qualifications",
        "4. Views details: Thursday 7AM-3PM Dept A (Urgent)",
        "5. Checks her calendar - she's available Thursday",
        "6. Taps 'Claim This Shift' button",
        "7. System validates: Emma has required qualification ✓",
        "8. System validates: No conflict with existing shifts ✓",
        "9. System validates: Won't exceed 45 hours this week ✓",
        "10. Shift assigned to Emma immediately (auto-approve enabled)",
        "11. Emma sees confirmation: 'Shift Confirmed!'",
        "12. Shift appears in her 'My Roster' view"
      ],
      realWorldExample: {
        scenario: "Emma is a casual staff member at two locations looking for extra shifts.",
        steps: [
          "On Sunday evening, Emma opens the app to plan her week",
          "She sees 5 open shifts across both locations she works at",
          "One shift is marked 'Urgent' - tomorrow morning",
          "Emma taps to view details and sees requirements",
          "She taps 'Claim Shift' and system validates eligibility",
          "Confirmation appears immediately",
          "She receives an email summary with the shift details"
        ],
        outcome: "The urgent shift was filled within hours of posting, and Emma earned extra income."
      }
    },
    {
      id: "US-RST-015",
      title: "Broadcast Urgent Open Shifts",
      actors: ["Location Manager", "System"],
      description: "As a Location Manager, I want to broadcast urgent unfilled shifts to all eligible staff, so that last-minute gaps can be filled quickly.",
      acceptanceCriteria: [
        "Can mark shift as 'Urgent' with broadcast option",
        "Broadcast sends push notification to all eligible staff",
        "Eligibility based on qualifications, availability, and fatigue status",
        "First qualified responder gets the shift (configurable)",
        "Broadcast expires after configurable time",
        "If unfilled, auto-escalates to agency (if configured)"
      ],
      businessLogic: [
        "Urgent flag: Within 24 hours of shift start",
        "Broadcast channels: Push notification, SMS (optional), email",
        "Response window: First 30 minutes priority to internal staff",
        "Auto-escalation: After 1 hour without response, escalate to agencies",
        "Eligibility exclusions: On leave, already at max hours, fatigue flagged",
        "Multiple claims: First timestamp wins (within 1-minute tie window)"
      ],
      priority: "high",
      relatedModules: [
        { module: "Agency Portal", relationship: "Escalation broadcasts to agency partners" },
        { module: "Notifications", relationship: "Multi-channel broadcast delivery" }
      ],
      endToEndJourney: [
        "1. 6 AM: Staff member calls in sick for 7 AM shift",
        "2. Manager opens roster and sees uncovered shift",
        "3. Marks shift as 'Urgent' and clicks 'Broadcast Now'",
        "4. System identifies 8 eligible staff members",
        "5. Push notifications sent: 'Urgent: Can you work 7AM-3PM today?'",
        "6. Within 10 minutes, Emma responds 'I'll take it'",
        "7. Emma is assigned, shift removed from broadcast",
        "8. Other staff see 'This shift has been filled'",
        "9. Manager sees confirmation: 'Filled by Emma at 6:12 AM'"
      ],
      realWorldExample: {
        scenario: "Last-minute sick call creates coverage gap.",
        steps: [
          "Manager receives sick call at 5:30 AM",
          "Broadcasts urgent shift to 12 eligible staff",
          "3 staff respond within 15 minutes",
          "First responder (Tom) gets the shift",
          "Others thanked for willingness",
          "No agency cost incurred"
        ],
        outcome: "Urgent gap filled by internal staff within 15 minutes."
      }
    },
    {
      id: "US-RST-016",
      title: "Broadcast to Agency Partners and Track Proposals",
      actors: ["Location Manager", "Agency Coordinator", "System"],
      description: "As a Location Manager, I want unfilled shifts to be automatically broadcast to agency partners after internal staff timeout, so that coverage gaps are filled even when internal options are exhausted.",
      acceptanceCriteria: [
        "Shifts auto-broadcast to agencies after configurable timeout",
        "Multiple agencies can receive broadcast simultaneously",
        "Agency portal shows available shifts for their workers",
        "Agency can propose specific workers with qualifications",
        "Manager can accept or reject proposals",
        "Accepted agency worker added to shift with agency flag"
      ],
      businessLogic: [
        "Internal broadcast timeout: 30-60 minutes (configurable)",
        "Agency priority order based on location preference settings",
        "Proposal includes: Worker name, qualifications, hourly rate, availability",
        "Manager can compare proposals from multiple agencies",
        "Acceptance creates shift assignment with agency_type populated",
        "Agency billing rates tracked separately from staff rates"
      ],
      priority: "medium",
      relatedModules: [
        { module: "Open Shifts", relationship: "Agency broadcast follows internal broadcast" },
        { module: "Costing", relationship: "Agency rates impact budget tracking" }
      ],
      endToEndJourney: [
        "1. 7 AM urgent shift broadcast to internal staff at 6 AM",
        "2. No internal responses after 30 minutes",
        "3. System auto-escalates to 2 configured agencies",
        "4. Agency A proposes Sarah (Diploma, $45/hr)",
        "5. Agency B proposes Mike (Certificate, $38/hr)",
        "6. Manager reviews proposals at 6:45 AM",
        "7. Selects Sarah based on higher qualification",
        "8. Confirms at agency rate: $45/hr",
        "9. Sarah receives assignment notification via agency",
        "10. Shift shows in roster with 'Agency' badge",
        "11. Sarah arrives and clocks in normally"
      ],
      realWorldExample: {
        scenario: "Tuesday shift unfilled after internal broadcast timeout.",
        steps: [
          "Internal broadcast: No responses after 45 minutes",
          "Auto-escalation to 3 agency partners",
          "2 agencies respond with proposals",
          "Manager compares: Agency A ($52/hr), Agency B ($48/hr)",
          "Selects Agency B worker with matching qualifications",
          "Worker arrives, completes shift successfully",
          "Manager rates worker 4.5 stars for future reference"
        ],
        outcome: "Seamless agency integration fills gap when internal staff unavailable."
      }
    },
    {
      id: "US-RST-017",
      title: "Auto-Escalate Unanswered Agency Broadcasts",
      actors: ["System", "Location Manager"],
      description: "As a System, I want to automatically escalate open shift broadcasts to additional agencies if initial agencies don't respond, so that shift coverage is maximized.",
      acceptanceCriteria: [
        "Escalation triggered after configurable timeout (default 30 min)",
        "Additional agency tiers added to broadcast",
        "Manager notified of escalation with current status",
        "Escalation stops when shift is filled or limit reached",
        "Configurable maximum agencies per broadcast",
        "Escalation history logged for review"
      ],
      businessLogic: [
        "Tier 1: Primary agency partners (first 30 min)",
        "Tier 2: Secondary agencies (30-60 min)",
        "Tier 3: All available agencies (60+ min)",
        "Cooldown: Don't broadcast same shift to same agency twice",
        "Maximum escalations: 3 tiers or manager-defined limit",
        "Final fallback: Manager alerted to unfillable shift"
      ],
      priority: "medium",
      relatedModules: [
        { module: "Agency Portal", relationship: "Agencies see escalated shifts" },
        { module: "Notifications", relationship: "Manager alerts for escalations" }
      ],
      endToEndJourney: [
        "1. Open shift broadcast to Agency A at 2 PM",
        "2. No response from Agency A by 2:30 PM",
        "3. System auto-escalates: Adds Agency B and C",
        "4. Manager receives notification: 'Escalated to 2 more agencies'",
        "5. Agency B responds at 2:45 PM with proposal",
        "6. Manager accepts, shift filled",
        "7. Escalation log shows: Tier 1 timeout, Tier 2 success",
        "8. Report shows average fill time and tier distribution"
      ],
      realWorldExample: {
        scenario: "Difficult-to-fill Saturday night shift requires escalation.",
        steps: [
          "Friday 2 PM: Shift broadcast to preferred agency",
          "No response by 2:30 PM → Tier 2 escalation",
          "Still no response by 3 PM → Tier 3 (all agencies)",
          "Agency C finally proposes worker at 3:15 PM",
          "Manager accepts despite higher rate",
          "Analytics show Saturday nights need earlier broadcasting"
        ],
        outcome: "Multi-tier escalation ensures coverage even for challenging shifts."
      }
    },

    // ============================================================================
    // SECTION 6: TIME & ATTENDANCE
    // ============================================================================
    {
      id: "US-RST-018",
      title: "Clock In with GPS Validation",
      actors: ["Staff Member"],
      description: "As a Staff Member, I want to clock in using my mobile phone when I arrive at the location, so that my attendance is accurately recorded with location verification.",
      acceptanceCriteria: [
        "Can clock in via mobile app with single tap",
        "GPS coordinates are captured automatically",
        "System validates location against location geofence",
        "Visual confirmation shows clock time and location status",
        "Clock event is recorded even if outside geofence (with warning)",
        "Offline clock-in queues for sync when online"
      ],
      businessLogic: [
        "GPS accuracy must be ≤50 meters for valid location check",
        "Distance calculated using Haversine formula from location coordinates",
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
        "1. Staff member Emma arrives at the location car park at 6:25 AM",
        "2. Opens the staff app on her phone",
        "3. App shows her scheduled shift: 6:30 AM - 2:30 PM in Department A",
        "4. Taps 'Clock In' button",
        "5. Phone requests GPS permission (if not already granted)",
        "6. App captures coordinates: -33.8688, 151.2093",
        "7. System calculates distance from location: 45 meters",
        "8. Distance is within 100m geofence + 50m buffer",
        "9. Clock event created: 6:25 AM, status 'valid'",
        "10. App shows confirmation: 'Clocked in at 6:25 AM ✓'",
        "11. Manager dashboard updates to show Emma 'On Shift'"
      ],
      realWorldExample: {
        scenario: "Emma is a staff member who needs to clock in for her early shift.",
        steps: [
          "Emma arrives at 6:25 AM, 5 minutes before her shift",
          "She opens the staff app and sees her shift details",
          "Taps 'Clock In' - the app shows a spinner briefly",
          "Confirmation appears: 'Clocked in at 6:25 AM - Location verified ✓'",
          "At 2:35 PM, she clocks out from inside the building",
          "Her timesheet shows 8 hours 10 minutes worked"
        ],
        outcome: "Accurate attendance record with GPS verification proves Emma was at the location."
      }
    },
    {
      id: "US-RST-019",
      title: "Detect Timesheet Anomalies and Patterns (Background)",
      actors: ["System", "Payroll Administrator"],
      description: "As a System, I want to detect irregular clock patterns and potential fraud indicators, so that anomalies are flagged for review before payroll.",
      acceptanceCriteria: [
        "Detects missing clock out events",
        "Flags unusually early clock in (before 5 AM)",
        "Flags unusually late clock out (after 10 PM)",
        "Detects pattern drift from historical average",
        "Identifies excessive daily hours (>12h)",
        "Buddy punching indicators when device data available"
      ],
      businessLogic: [
        "Missing clock out: Critical severity, blocks approval",
        "Early/late punches: Warning severity",
        "Pattern drift: >60 min from average = info flag",
        "Excessive hours: Critical, requires investigation",
        "Buddy punch detection: Same device, multiple staff, similar times",
        "Historical comparison uses 30-day rolling average"
      ],
      priority: "high",
      relatedModules: [
        { module: "Compliance", relationship: "Anomalies logged for audit" },
        { module: "Timesheet", relationship: "Flags shown in timesheet review" }
      ],
      endToEndJourney: [
        "1. Timesheet review opens for 15 staff",
        "2. System shows: 2 anomalies detected",
        "3. Anomaly 1: Tom missing clock out on Wednesday",
        "4. Anomaly 2: Emma clocked in at 4:30 AM (unusual)",
        "5. Payroll Admin investigates Tom's entry",
        "6. Contacts Tom: He forgot to clock out, left at 3 PM",
        "7. Admin manually enters 3 PM clock out",
        "8. Emma's early start confirmed (special event)",
        "9. Both anomalies resolved, approval proceeds"
      ],
      realWorldExample: {
        scenario: "Pattern drift catches time issue.",
        steps: [
          "Staff member historically clocks in at 8:00 AM average",
          "Last 5 days showing 7:15 AM clock in",
          "Pattern drift flag raised: 45 min earlier than usual",
          "Manager investigates: No approved early starts",
          "Issue clarified and documented"
        ],
        outcome: "Anomaly detection prevents issues before payroll."
      }
    },
    {
      id: "US-RST-020",
      title: "Generate Timesheet from Clock Events (Background)",
      actors: ["System", "Staff Member"],
      description: "As a System, I want to automatically generate timesheets from clock events and scheduled shifts, so that staff have accurate records of worked hours.",
      acceptanceCriteria: [
        "Timesheet auto-generated at end of each pay period",
        "Clock events matched to scheduled shifts",
        "Variance calculated between scheduled and actual hours",
        "Missed breaks flagged for review",
        "Staff can view but not edit generated timesheet",
        "Manager can adjust with audit trail"
      ],
      businessLogic: [
        "Pay period: Weekly (Mon-Sun) or Fortnightly",
        "Clock matching: Within 2 hours of shift start/end",
        "Unmatched clocks: Flag for manual review",
        "Break deduction: Based on recorded breaks or scheduled duration",
        "Overtime trigger: >7.6 hours/day or >38 hours/week",
        "Rounding: Clock times rounded to nearest 15 min for pay"
      ],
      priority: "critical",
      relatedModules: [
        { module: "Payroll", relationship: "Timesheets exported for pay processing" },
        { module: "Awards", relationship: "Overtime and penalties calculated" }
      ],
      endToEndJourney: [
        "1. Sunday 11:59 PM: Pay period ends",
        "2. Background job runs at midnight",
        "3. For each staff member, collects clock events for week",
        "4. Matches events to scheduled shifts",
        "5. Calculates worked hours, breaks, overtime",
        "6. Generates timesheet record with line items",
        "7. Monday 6 AM: Staff receive notification to review",
        "8. Staff opens app, sees timesheet with 38.5 hours",
        "9. Breakdown shows: 5 shifts, 30 min overtime",
        "10. Staff confirms 'Looks correct'",
        "11. Timesheet moves to 'Pending Approval' status"
      ],
      realWorldExample: {
        scenario: "End of fortnight timesheet generation.",
        steps: [
          "System processes 45 staff timesheets overnight",
          "42 generate cleanly, 3 have anomalies",
          "Anomalies: Missing clock out, exceeded 12 hours, missed break",
          "Staff notified to review and confirm",
          "Managers investigate anomalies",
          "All timesheets resolved by Tuesday"
        ],
        outcome: "Automated timesheet generation reduces manual effort by 90%."
      }
    },
    {
      id: "US-RST-021",
      title: "Determine Timesheet Approval Chain (Background)",
      actors: ["System", "Payroll Administrator"],
      description: "As a System, I want to automatically determine the correct approval chain for each timesheet based on configurable rules, so that approvals route correctly.",
      acceptanceCriteria: [
        "Auto-approve: Normal hours, no exceptions, no overtime",
        "Manager approval: Overtime <8 hours or exceptions",
        "Senior Manager: Overtime >8 hours",
        "HR approval: Compliance violations",
        "Escalation if SLA deadline exceeded",
        "Full approval history maintained"
      ],
      businessLogic: [
        "Auto-approve conditions: No flags, no OT, all breaks taken",
        "Tier order: Auto → Manager → Senior Manager → HR → Director",
        "SLA deadlines: Manager 24h, Senior 48h, HR 72h",
        "Escalation adds next tier if SLA exceeded",
        "Each step logs: approver, timestamp, notes",
        "Completion when final required tier approves"
      ],
      priority: "high",
      relatedModules: [
        { module: "Timesheet", relationship: "Approval status visible on timesheet" },
        { module: "Notifications", relationship: "Approvers notified when action needed" }
      ],
      endToEndJourney: [
        "1. Emma submits timesheet: 38 hours, no flags",
        "2. System evaluates: Normal hours ✓, No OT ✓, No exceptions ✓",
        "3. Auto-approval triggered",
        "4. Tom submits timesheet: 42 hours, 4h OT",
        "5. System evaluates: OT >2h = Manager approval required",
        "6. Manager Sarah receives notification",
        "7. Sarah approves within 12 hours",
        "8. Maria submits: 12h day flagged for excessive hours",
        "9. System routes to Manager + HR",
        "10. Both must approve before payroll export"
      ],
      realWorldExample: {
        scenario: "Complex timesheet requires multi-tier approval.",
        steps: [
          "Staff worked 52 hours with missed break and 14 OT hours",
          "System creates 3-tier chain: Manager → Senior → HR",
          "Each tier reviews and approves with justification",
          "All tiers complete within 48 hours",
          "Timesheet approved for payroll"
        ],
        outcome: "Appropriate oversight for exceptional circumstances."
      }
    },

    // ============================================================================
    // SECTION 7: LEAVE MANAGEMENT
    // ============================================================================
    {
      id: "US-RST-022",
      title: "Request and Approve Leave",
      actors: ["Staff Member", "Location Manager"],
      description: "As a Staff Member, I want to request time off through the system, so that my leave is properly tracked and my shifts can be covered. As a Location Manager, I want to review and approve leave requests, ensuring adequate coverage before approval.",
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
        "1. Staff member John plans a family holiday",
        "2. Opens staff app 6 weeks in advance",
        "3. Navigates to 'Leave' section",
        "4. Taps 'Request Leave' button",
        "5. Selects 'Annual Leave' type",
        "6. Picks dates: Monday 14th to Friday 18th (5 days)",
        "7. Adds note: 'Family holiday'",
        "8. System shows: '38 hours from Annual Leave balance (72 hours available)'",
        "9. John submits the request",
        "10. Location Manager Sarah receives notification",
        "11. Sarah checks roster coverage - adequate staff available",
        "12. Sarah approves the request",
        "13. John receives approval notification",
        "14. His balance updates accordingly"
      ],
      realWorldExample: {
        scenario: "Part-time staff member needs annual leave for family trip.",
        steps: [
          "John submits leave request for 5 days in April",
          "System calculates proportional hours based on part-time schedule",
          "Manager reviews and sees adequate coverage exists",
          "Approves request same day",
          "John gets confirmation notification",
          "Roster shows John as 'On Leave' for those dates"
        ],
        outcome: "Leave properly tracked with balance deducted and roster blocked."
      }
    },
    {
      id: "US-RST-023",
      title: "Calculate and Accrue Leave Balances (Background)",
      actors: ["System", "Payroll Administrator"],
      description: "As a System, I want to automatically calculate leave accruals based on hours worked, so that staff balances are always accurate.",
      acceptanceCriteria: [
        "Annual leave accrues at 1/52 of annual entitlement per week",
        "Personal/sick leave accrues at 10 days per year pro-rata",
        "Long service leave accrues per state requirements",
        "Accruals calculated per pay period based on actual hours",
        "Balances visible to staff and managers",
        "Accrual transactions logged for audit"
      ],
      businessLogic: [
        "Annual leave: 4 weeks (152 hours) per year for full-time",
        "Accrual rate: Hours worked × (152 / 1976) = 0.07692",
        "Personal leave: Hours worked × (76 / 1976) = 0.03846",
        "Long service leave: State-specific (typically after 7 years)",
        "Pro-rata for part-time based on actual hours",
        "Balances cannot go negative without director approval"
      ],
      priority: "high",
      relatedModules: [
        { module: "Timesheet", relationship: "Accruals based on approved hours" },
        { module: "Payroll", relationship: "Leave balances exported for pay processing" }
      ],
      endToEndJourney: [
        "1. End of fortnight, timesheets approved",
        "2. Emma worked 76 hours this period",
        "3. Annual leave accrual: 76 × 0.07692 = 5.85 hours",
        "4. Personal leave accrual: 76 × 0.03846 = 2.92 hours",
        "5. Long service accrual: per state formula",
        "6. Balances updated in staff profile",
        "7. Transaction log shows all accruals",
        "8. Staff can view updated balances in app"
      ],
      realWorldExample: {
        scenario: "Part-time staff accrues proportional leave.",
        steps: [
          "Tom works 20 hours/week (part-time)",
          "Fortnightly accrual: 40 hours × 0.07692 = 3.08 hours AL",
          "Full-time equivalent would be 5.85 hours",
          "Tom's balance reflects actual hours worked",
          "Year-end: Proportional entitlement accrued"
        ],
        outcome: "Accurate pro-rata accruals for all employment types."
      }
    },

    // ============================================================================
    // SECTION 8: BREAK SCHEDULING & COMPLIANCE
    // ============================================================================
    {
      id: "US-RST-024",
      title: "Schedule Breaks with Ratio-Compliant Staggering",
      actors: ["Location Manager", "Team Leader"],
      description: "As a Location Manager, I want break schedules that maintain required ratios, so that compliance is never breached during meal breaks.",
      acceptanceCriteria: [
        "System suggests break times based on shift patterns",
        "Staggered breaks ensure minimum coverage maintained",
        "Visual timeline shows coverage during break periods",
        "Alerts if proposed breaks would breach ratios",
        "Team Leader can adjust within compliance limits",
        "Break times recorded automatically for payroll"
      ],
      businessLogic: [
        "Break duration based on shift length and award requirements",
        "Minimum staff in department at all times",
        "Breaks cannot overlap if it causes ratio breach",
        "Suggested stagger interval: 15-30 minutes",
        "Floater staff may cover multiple departments during breaks",
        "Break times recorded for pay deduction"
      ],
      priority: "high",
      relatedModules: [
        { module: "Compliance", relationship: "Break coverage validation for ratios" },
        { module: "Timesheet", relationship: "Break times recorded for pay" }
      ],
      endToEndJourney: [
        "1. Location Manager opens break planning for Dept B",
        "2. 4 staff on shift, 15 clients expected",
        "3. Required ratio 1:5 = minimum 3 staff always",
        "4. System suggests staggered 30-min breaks",
        "5. Manager approves break schedule",
        "6. Team Leader manages actual break times",
        "7. Coverage maintained throughout lunch period"
      ],
      realWorldExample: {
        scenario: "Lunch period requires careful break staggering.",
        steps: [
          "System generates optimized break schedule",
          "Each staff member takes break while minimum coverage maintained",
          "Ratio never breached during lunch period",
          "Break times automatically recorded"
        ],
        outcome: "Systematic break scheduling ensures continuous compliance."
      }
    },

    // ============================================================================
    // SECTION 9: SHIFT SWAPS
    // ============================================================================
    {
      id: "US-RST-025",
      title: "Request and Approve Shift Swap",
      actors: ["Staff Member", "Location Manager"],
      description: "As a Staff Member, I want to request a shift swap with a colleague when I can't work my assigned shift, so that coverage is maintained without creating an open shift.",
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
        "Manager approval required for cross-department swaps",
        "Swaps within same department can be auto-approved if setting enabled",
        "Both original and new assignments logged for audit"
      ],
      priority: "medium",
      relatedModules: [
        { module: "Notifications", relationship: "Multi-party notification workflow" },
        { module: "Compliance", relationship: "Swap validates qualification requirements" }
      ],
      endToEndJourney: [
        "1. Staff member Emma has a shift Friday but needs time off",
        "2. Opens app and views Friday shift",
        "3. Taps 'Request Swap' button",
        "4. System shows eligible colleagues: Maria, David, Sarah",
        "5. Emma selects Maria and adds reason: 'Family commitment'",
        "6. Sends swap request",
        "7. Maria receives notification on her phone",
        "8. Maria views request and taps 'Accept Swap'",
        "9. Location Manager receives approval request",
        "10. Manager sees swap details and approves",
        "11. Emma receives: 'Swap Approved'",
        "12. Maria's roster updated with new shift"
      ],
      realWorldExample: {
        scenario: "Staff member needs to swap shift due to personal commitment.",
        steps: [
          "Emma realizes she has a conflict for Friday's shift",
          "Uses app to find eligible swap partners",
          "Sends request to Maria with explanation",
          "Maria accepts within 2 hours",
          "Manager approves after checking qualifications",
          "Both staff notified, rosters updated"
        ],
        outcome: "Coverage maintained through peer-to-peer swap without manager intervention."
      }
    },

    // ============================================================================
    // SECTION 10: ROSTER PUBLISHING & NOTIFICATIONS
    // ============================================================================
    {
      id: "US-RST-026",
      title: "Publish Roster and Notify Staff",
      actors: ["Location Manager"],
      description: "As a Location Manager, I want to publish the completed roster to make it visible to staff and trigger notifications, so that everyone knows their upcoming shifts.",
      acceptanceCriteria: [
        "Can select date range for publication",
        "Pre-publish validation checks for issues",
        "One-click publish for validated roster",
        "All affected staff receive notifications",
        "Notification shows changes from previous version",
        "Published shifts visible in staff app immediately"
      ],
      businessLogic: [
        "Pre-publish checks: Compliance ratios, conflicts, unfilled shifts",
        "Publish can be blocked by critical errors",
        "Warnings can be overridden with justification",
        "Notification channels: Push, email, SMS (configurable)",
        "Change detection: New, modified, deleted shifts highlighted",
        "7-day advance notice required for compliance (configurable)"
      ],
      priority: "high",
      relatedModules: [
        { module: "Notifications", relationship: "Multi-channel notification delivery" },
        { module: "Compliance", relationship: "Pre-publish validation" }
      ],
      endToEndJourney: [
        "1. Manager Sarah completes next week's roster",
        "2. Clicks 'Publish Roster' button",
        "3. System runs pre-publish validation",
        "4. Results: 0 errors, 1 warning (unfilled Saturday shift)",
        "5. Sarah acknowledges warning: 'Will fill from agency'",
        "6. Clicks 'Confirm Publish'",
        "7. Roster status changes to 'Published'",
        "8. 12 staff receive push notifications",
        "9. Notifications show: 'Your roster for next week is ready'",
        "10. Staff open app and see their shifts",
        "11. Changes since draft highlighted in yellow"
      ],
      realWorldExample: {
        scenario: "Friday afternoon roster publication for next week.",
        steps: [
          "Manager finalizes all shift assignments",
          "Runs validation - all checks pass",
          "Publishes roster at 3 PM Friday",
          "15 staff receive instant notifications",
          "Staff can view and sync to personal calendars",
          "One staff calls about conflict - manager adjusts",
          "Updated roster re-published"
        ],
        outcome: "Staff have full visibility of next week's schedule with adequate notice."
      }
    },
    {
      id: "US-RST-027",
      title: "Export Roster to Personal Calendar",
      actors: ["Staff Member"],
      description: "As a Staff Member, I want to sync my roster to my personal calendar, so that I see work alongside personal commitments.",
      acceptanceCriteria: [
        "Can generate personal iCal feed URL",
        "Shifts appear in Google Calendar, Outlook, Apple Calendar",
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
        "Location field populated with address",
        "Reminder settings controlled by user's calendar app"
      ],
      priority: "low",
      relatedModules: [
        { module: "Notifications", relationship: "Changes trigger notification" },
        { module: "Staff Portal", relationship: "Feed URL in portal settings" }
      ],
      endToEndJourney: [
        "1. Staff member opens Portal > Calendar Sync",
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
          "Adds to Google Calendar as subscription",
          "All shifts appear with location and times",
          "Roster updates sync within 30 minutes"
        ],
        outcome: "Personal calendar always shows current roster without manual entry."
      }
    },

    // ============================================================================
    // SECTION 11: COMPLIANCE & RATIO MONITORING
    // ============================================================================
    {
      id: "US-RST-028",
      title: "Monitor Real-Time Staffing Ratio Compliance",
      actors: ["Location Manager", "Team Leader"],
      description: "As a Location Manager, I want to see real-time staff-to-service ratios for each department, so that I can ensure regulatory compliance throughout the day and respond quickly to any breaches.",
      acceptanceCriteria: [
        "Dashboard shows current ratio for each department",
        "Colour coding: Green (compliant), Amber (at risk), Red (breach)",
        "Alert generated when ratio exceeds threshold",
        "Historical ratio snapshots saved for audit",
        "Drill-down shows which staff are present in each department",
        "Projected ratios shown for upcoming breaks/shift changes"
      ],
      businessLogic: [
        "Ratio = Service Demand / Staff Present",
        "Ratios configurable per industry and department type",
        "Breach if actual ratio > required ratio",
        "At Risk if ratio within 0.5 of threshold",
        "'Qualified' staff = relevant qualification for department",
        "Snapshots recorded every 15 minutes during operating hours"
      ],
      priority: "critical",
      relatedModules: [
        { module: "Roster", relationship: "Shift assignments determine staff presence" },
        { module: "Compliance", relationship: "Ratio breaches logged for regulatory reporting" }
      ],
      endToEndJourney: [
        "1. It's 10:30 AM, all departments are at full capacity",
        "2. Location Manager Sarah opens the Compliance Dashboard",
        "3. Dashboard shows all departments in green",
        "4. At 10:45 AM, a staff member goes on break",
        "5. Dashboard updates to amber warning",
        "6. Alert notification appears on Sarah's screen",
        "7. Sarah clicks through to see details",
        "8. Sends floater to cover",
        "9. Dashboard returns to green",
        "10. Incident logged with 8-minute duration"
      ],
      realWorldExample: {
        scenario: "Unexpected staff absence creates ratio challenge.",
        steps: [
          "Staff member calls in sick during shift",
          "Dashboard immediately shows department at risk",
          "Manager receives urgent alert",
          "Moves admin staff with qualification to cover",
          "Dashboard returns to green",
          "Calls agency for remaining shift coverage",
          "End-of-day report shows mitigation actions"
        ],
        outcome: "Real-time monitoring enables rapid response to maintain compliance."
      }
    },
    {
      id: "US-RST-029",
      title: "Validate Ratio Compliance Before Shift Changes",
      actors: ["System", "Location Manager"],
      description: "As a System, I want to validate staffing ratio impact before any shift create, edit, or delete operation, so that non-compliant changes are prevented proactively.",
      acceptanceCriteria: [
        "Validation runs automatically on shift operations",
        "Calculates projected ratios after proposed change",
        "Blocks changes that would cause immediate breach",
        "Warnings for changes that create at-risk periods",
        "Manager can override warnings with justification",
        "Override logged for audit"
      ],
      businessLogic: [
        "Pre-change validation: Calculate current ratio",
        "Post-change projection: Calculate ratio after change",
        "Breach = Block operation (cannot override for critical departments)",
        "At-risk = Warning with override option",
        "Justification required text: minimum 20 characters",
        "All validation results logged regardless of outcome"
      ],
      priority: "critical",
      relatedModules: [
        { module: "Shift Management", relationship: "Validation hooks into all shift operations" },
        { module: "Audit", relationship: "Compliance decisions logged" }
      ],
      endToEndJourney: [
        "1. Manager tries to delete a shift from morning roster",
        "2. System calculates: Current 4 staff, ratio 1:5",
        "3. After deletion: 3 staff, ratio would be 1:7",
        "4. Required ratio: 1:5 - this would be a breach",
        "5. Error displayed: 'Cannot delete: Would breach ratio requirement'",
        "6. Manager must either find replacement or keep shift",
        "7. Manager assigns Tom to cover the shift instead",
        "8. Deletion now allowed: 3 staff + Tom = 4 staff",
        "9. Operation completes successfully"
      ],
      realWorldExample: {
        scenario: "Manager accidentally tries to remove too many staff.",
        steps: [
          "Manager wants to reduce costs by cutting afternoon shifts",
          "Tries to delete 2 shifts from same department",
          "First deletion succeeds (still compliant)",
          "Second deletion blocked (would breach ratio)",
          "Manager realizes the error",
          "Keeps second shift to maintain compliance"
        ],
        outcome: "Proactive validation prevents accidental non-compliance."
      }
    },

    // ============================================================================
    // SECTION 12: FATIGUE MANAGEMENT
    // ============================================================================
    {
      id: "US-RST-030",
      title: "Calculate Fatigue Scores in Real-Time (Background)",
      actors: ["System", "Location Manager"],
      description: "As a System, I want to continuously calculate fatigue scores for all staff based on their work patterns, so that managers can identify burnout risks proactively.",
      acceptanceCriteria: [
        "Fatigue score calculated from multiple factors",
        "Weekly hours contribution (0-35 points)",
        "Consecutive days contribution (0-30 points)",
        "Night shift frequency contribution (0-20 points)",
        "Rest period adequacy contribution (0-15 points)",
        "Risk levels: Low (<40), Moderate (40-60), High (60-80), Critical (>80)"
      ],
      businessLogic: [
        "Score recalculated when: shift added/modified, daily batch refresh",
        "Factors weighted: Hours 35%, Consecutive 30%, Nights 20%, Rest 15%",
        "14-day rolling window for calculations",
        "Violations logged separately from scores",
        "Recommendations generated based on contributing factors",
        "Projected next-week score estimated from scheduled shifts"
      ],
      priority: "high",
      relatedModules: [
        { module: "Compliance", relationship: "Violations feed compliance dashboard" },
        { module: "Roster", relationship: "Score visible when assigning shifts" }
      ],
      endToEndJourney: [
        "1. Emma works 45 hours in 6 consecutive days",
        "2. System calculates fatigue score",
        "3. Weekly hours: 45/40 × 35 = 39 points",
        "4. Consecutive days: 6/5 × 30 = 36 points",
        "5. Night shifts: 2 nights × 10 = 20 points",
        "6. Rest periods: Adequate = 0 points",
        "7. Total: 95 points = CRITICAL",
        "8. Manager receives urgent alert",
        "9. Recommendation: 'Schedule rest day immediately'",
        "10. Manager adjusts upcoming roster"
      ],
      realWorldExample: {
        scenario: "Staff approaching burnout detected by fatigue scoring.",
        steps: [
          "Weekly report shows 3 staff in 'High' fatigue zone",
          "All three worked 6+ consecutive days",
          "Manager reviews upcoming roster",
          "Adjusts to ensure mandatory rest days",
          "Fatigue scores decrease following week"
        ],
        outcome: "Proactive fatigue management prevents burnout and OH&S issues."
      }
    },
    {
      id: "US-RST-031",
      title: "Validate Fatigue Compliance Before Roster Publish",
      actors: ["Location Manager", "System"],
      description: "As a Location Manager, I want the system to check all staff fatigue compliance before publishing the roster, so that I don't accidentally create illegal or unsafe schedules.",
      acceptanceCriteria: [
        "Validation runs as part of publish workflow",
        "Checks: Maximum consecutive days, minimum rest hours, weekly limits",
        "Errors block publish, warnings allow override",
        "Each issue shows affected staff and specific violation",
        "Can override warnings with documented justification",
        "Override consent from affected staff can be attached"
      ],
      businessLogic: [
        "Max consecutive days: 5 (configurable per award)",
        "Minimum rest between shifts: 10 hours (configurable)",
        "Weekly hour limit: 38 ordinary + 12 overtime max",
        "Fatigue score >80: Warning",
        "Rest period violation: Error (critical safety issue)",
        "Override requires: Reason text, optional staff consent document"
      ],
      priority: "high",
      relatedModules: [
        { module: "Publishing", relationship: "Part of publish validation chain" },
        { module: "Compliance", relationship: "Fatigue violations logged for regulatory reporting" }
      ],
      endToEndJourney: [
        "1. Manager finishes scheduling and clicks Publish",
        "2. System runs fatigue validation scan",
        "3. Results: 2 issues found",
        "4. Error: Tom has only 8 hours between shifts",
        "5. Warning: Emma has 6 consecutive work days",
        "6. Manager clicks Tom's error to see details",
        "7. Adjusts Friday shift to give 10 hours rest",
        "8. For Emma's warning, documents justification",
        "9. Re-runs validation: 0 errors, 1 documented warning",
        "10. Proceeds with publish",
        "11. Audit log records Emma's override justification"
      ],
      realWorldExample: {
        scenario: "Publish validation catches two potential fatigue issues.",
        steps: [
          "Manager completes roster scheduling",
          "Publish validation finds rest period violation",
          "Adjusts shift times to fix violation",
          "Also finds consecutive days warning",
          "Gets staff consent and documents justification",
          "Publishes with documented override"
        ],
        outcome: "Roster published with full compliance or documented exceptions."
      }
    },

    // ============================================================================
    // SECTION 13: CROSS-LOCATION OPERATIONS
    // ============================================================================
    {
      id: "US-RST-032",
      title: "Manage Cross-Location Staff Deployments",
      actors: ["Area Manager", "Location Manager"],
      description: "As an Area Manager, I want to deploy staff across multiple locations, so that I can balance workload without agency staff.",
      acceptanceCriteria: [
        "Can view staff availability across all locations",
        "Can identify staff willing to work other locations",
        "Cross-location shift creates travel time allocation",
        "Staff notified of deployment with location details",
        "Mileage/travel allowance automatically applied",
        "Original and destination locations track the deployment"
      ],
      businessLogic: [
        "Staff must be flagged as 'multi-location' in profile",
        "Travel time: Calculated from home location to destination",
        "Travel allowance: Per-km rate or flat amount",
        "Minimum deployment: 4 hours (worth the travel)",
        "Staff consent: Can decline cross-location offers",
        "Insurance coverage confirmed for travel between sites"
      ],
      priority: "medium",
      relatedModules: [
        { module: "Staff Profiles", relationship: "Multi-location flag and home location stored" },
        { module: "Awards", relationship: "Travel allowance rates configured" }
      ],
      endToEndJourney: [
        "1. Downtown Branch short-staffed Thursday due to training",
        "2. Area Manager views regional availability",
        "3. North Branch has 2 staff with light Thursday roster",
        "4. Both flagged as willing to travel",
        "5. Creates deployment: Emma from North to Downtown",
        "6. System calculates travel allowance",
        "7. Emma receives notification with deployment details",
        "8. Emma accepts the deployment",
        "9. Thursday: Emma clocks in at Downtown Branch",
        "10. Timesheet shows shift + travel allowance",
        "11. Both locations see the deployment in their rosters"
      ],
      realWorldExample: {
        scenario: "Training day at one location creates staff shortage.",
        steps: [
          "Downtown sending 4 staff to training Thursday",
          "Need 2 extra staff to maintain coverage",
          "Area Manager finds 2 staff at nearby North Branch",
          "Creates cross-location deployments",
          "Staff accept and travel allowance calculated",
          "Both locations fully covered"
        ],
        outcome: "Internal resource sharing avoids agency costs."
      }
    },

    // ============================================================================
    // SECTION 14: BUDGET & COSTING
    // ============================================================================
    {
      id: "US-RST-033",
      title: "Track Labour Budget vs Actual Costs",
      actors: ["Location Manager", "Finance Director"],
      description: "As a Location Manager, I want to see real-time budget versus actual labour costs, so that I can manage staffing within budget constraints.",
      acceptanceCriteria: [
        "Dashboard shows budget allocation per period",
        "Actual costs calculated from roster and timesheets",
        "Variance displayed as absolute and percentage",
        "Drill-down by cost category (ordinary, overtime, penalties, agency)",
        "Alerts when approaching or exceeding budget",
        "Forecast end-of-period position based on current trends"
      ],
      businessLogic: [
        "Budget: Annual allocation divided by periods",
        "Actual costs from: Approved timesheets × pay rates",
        "Categories: Ordinary hours, overtime, weekend penalties, public holiday, agency",
        "Variance calculation: (Actual - Budget) / Budget × 100",
        "Alert thresholds: 90% (warning), 100% (critical), 110% (escalation)",
        "Forecast uses year-to-date trends + current roster"
      ],
      priority: "high",
      relatedModules: [
        { module: "Awards", relationship: "Pay rates drive cost calculations" },
        { module: "Timesheet", relationship: "Actual hours determine actual costs" }
      ],
      endToEndJourney: [
        "1. Location Manager Sarah opens Budget Dashboard",
        "2. Shows: Weekly budget $12,500, current spent $11,200",
        "3. Status: Green - within target at 89.6%",
        "4. Clicks to see cost breakdown",
        "5. Ordinary hours: $9,800 (78.4%)",
        "6. Overtime: $680 (5.4%)",
        "7. Weekend penalties: $480 (3.8%)",
        "8. Agency: $240 (1.9%)",
        "9. Views next week's roster projection",
        "10. Adjusts shifts to stay within budget"
      ],
      realWorldExample: {
        scenario: "End of week budget review with unfilled shifts.",
        steps: [
          "Sarah opens Budget Dashboard Friday afternoon",
          "Current week shows 89% of budget spent",
          "2 Saturday shifts still unfilled",
          "Calculates internal vs agency cost",
          "Tries internal first - one staff picks up",
          "Second goes to agency at higher rate",
          "Final cost: 97% of budget"
        ],
        outcome: "Budget target met while maintaining full staffing."
      }
    },
    {
      id: "US-RST-034",
      title: "Analyze Staff Utilization Across Locations",
      actors: ["Area Manager", "Finance Director"],
      description: "As an Area Manager, I want to see staff utilization rates across my locations, so that I can identify over/under-staffing patterns.",
      acceptanceCriteria: [
        "Report shows actual vs contracted hours per staff",
        "Can aggregate by location, department, or role",
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
        "4. One location flagged at 82% - under-utilized",
        "5. Drills into details: 3 part-time staff at 70% each",
        "6. Identifies opportunity to optimize contracts",
        "7. Exports report for Location Manager discussion"
      ],
      realWorldExample: {
        scenario: "Quarterly review identifies under-utilization.",
        steps: [
          "Report shows one location at 84% utilization",
          "Analysis reveals 3 part-time staff under-used",
          "Leads to contract rebalancing discussion",
          "Next quarter projects cost savings"
        ],
        outcome: "Data-driven identification of inefficiency leads to optimization."
      }
    },

    // ============================================================================
    // SECTION 15: FORECASTING & ANALYTICS
    // ============================================================================
    {
      id: "US-RST-035",
      title: "Generate Demand Forecast for Staffing",
      actors: ["Location Manager", "Area Manager"],
      description: "As a Location Manager, I want to see AI-generated staffing demand forecasts based on historical patterns and external factors, so that I can plan adequate coverage.",
      acceptanceCriteria: [
        "System analyzes historical booking patterns",
        "Forecast shows expected demand per department per day",
        "Staffing requirements calculated from forecasted demand",
        "Weather and holiday adjustments applied",
        "Forecast displayed alongside roster planning view",
        "Accuracy metrics shown for past forecasts"
      ],
      businessLogic: [
        "Base forecast from historical same-day-of-week patterns",
        "Adjusted for known factors: holidays, school terms, events",
        "Weather API integration for rain/heat adjustments",
        "Minimum staffing: Always meet regulatory ratios",
        "Buffer staffing: Add 10% for unexpected demand",
        "Forecast generated weekly, updated daily"
      ],
      priority: "medium",
      relatedModules: [
        { module: "Booking System", relationship: "Imports confirmed and projected bookings" },
        { module: "Costing", relationship: "Forecast staffing drives budget projections" }
      ],
      endToEndJourney: [
        "1. It's Friday, Sarah is planning next week's roster",
        "2. Opens Demand Forecast section",
        "3. System displays predicted demand per day per department",
        "4. Monday: Lower than usual (post-holiday)",
        "5. Thursday shows higher demand (payday pattern)",
        "6. Weather adjustment: Tuesday rain = +5% indoor demand",
        "7. Sarah sees historical accuracy: 94%",
        "8. Accepts recommended staffing levels",
        "9. System auto-generates shift requirements"
      ],
      realWorldExample: {
        scenario: "Using AI forecast to optimize weekly staffing.",
        steps: [
          "Forecast shows 15% higher demand Thursday (payday)",
          "Monday projected 10% lower (post-long weekend)",
          "Manager adjusts roster accordingly",
          "Thursday: Extra staff rostered",
          "Monday: Reduced to minimum coverage",
          "End of week: Demand matched forecast within 5%"
        ],
        outcome: "Data-driven staffing reduces over/under-staffing by 15%."
      }
    },
    {
      id: "US-RST-036",
      title: "Integrate Weather Data for Demand Forecasting",
      actors: ["System", "Location Manager"],
      description: "As a System, I want to integrate weather forecast data into staffing demand predictions, so that weather-sensitive operations can plan appropriately.",
      acceptanceCriteria: [
        "Weather API integration retrieves 7-day forecast",
        "Adjustments applied based on weather conditions",
        "Rain: Configurable impact on demand",
        "Extreme heat/cold: Configurable adjustments",
        "Weather icons visible in forecast view",
        "Configurable adjustment percentages per location"
      ],
      businessLogic: [
        "Weather data fetched daily at 6 AM",
        "Location coordinates used for local forecast",
        "Adjustment rules configurable per industry",
        "Default: Rain = +5% indoor, Heat >35°C = +10%",
        "Forecast confidence decreases beyond 3 days",
        "Manual override available for managers"
      ],
      priority: "low",
      relatedModules: [
        { module: "Demand Forecasting", relationship: "Weather is one demand factor" },
        { module: "Budgeting", relationship: "Weather impacts labour cost projections" }
      ],
      endToEndJourney: [
        "1. System fetches weather for location",
        "2. Tuesday forecast: Heavy rain all day",
        "3. Demand adjustment: +5% expected attendance",
        "4. Staffing recommendation increases by 1",
        "5. Manager sees weather icon on forecast chart",
        "6. Adjusts roster accordingly",
        "7. Actual attendance matches adjusted forecast"
      ],
      realWorldExample: {
        scenario: "Weather forecast influences staffing decisions.",
        steps: [
          "Forecast shows extreme heat for Thursday-Friday",
          "System recommends adjusted staffing levels",
          "Manager accepts recommendations",
          "Operations adjusted for weather",
          "Smooth service delivery despite conditions"
        ],
        outcome: "Weather-aware planning prevents operational issues."
      }
    },
    {
      id: "US-RST-037",
      title: "Integrate Service Demand for Dynamic Staffing",
      actors: ["Location Manager", "System Administrator"],
      description: "As a Location Manager, I want staffing recommendations based on actual service demand, so that levels respond to real demand.",
      acceptanceCriteria: [
        "System receives real-time service data",
        "Staffing recommendations update as demand changes",
        "Alerts when demand exceeds staff capacity",
        "End-of-day reconciliation compares planned vs actual",
        "Historical patterns inform future planning",
        "Integration with booking/CRM system"
      ],
      businessLogic: [
        "Check-in updates occupancy in real-time",
        "Ratio calculation: Clients present / Staff clocked in",
        "Understaffing alert when ratio >95% of threshold",
        "Overstaffing opportunity when ratio <60%",
        "15-minute refresh cycle for recommendations",
        "Late arrivals and early departures tracked"
      ],
      priority: "high",
      relatedModules: [
        { module: "Booking System", relationship: "Provides demand data" },
        { module: "Compliance", relationship: "Real-time ratio monitoring" }
      ],
      endToEndJourney: [
        "1. Morning: Location opens with planned staff",
        "2. Clients check in throughout morning",
        "3. System tracks ratio as attendance increases",
        "4. Alert at 9 AM: Department approaching capacity",
        "5. Manager assigns floater to cover",
        "6. Later: Early departures create overstaffing",
        "7. End of day report shows peak ratio times"
      ],
      realWorldExample: {
        scenario: "Lower than expected demand allows cost savings.",
        steps: [
          "Only 60% of expected clients arrive",
          "System recommends releasing 2 casual staff",
          "Manager contacts casuals, reduces hours by consent",
          "Significant savings while maintaining compliance"
        ],
        outcome: "Real-time integration enables dynamic cost optimization."
      }
    },

    // ============================================================================
    // SECTION 16: AGENCY MANAGEMENT
    // ============================================================================
    {
      id: "US-RST-038",
      title: "Rate Agency Workers Post-Placement",
      actors: ["Location Manager", "System"],
      description: "As a Location Manager, I want to rate agency workers after each placement, so that future recommendations prioritize reliable workers.",
      acceptanceCriteria: [
        "Rating prompt appears after agency shift completes",
        "5-star rating scale for overall performance",
        "Specific criteria: Punctuality, Skills, Teamwork, Attitude",
        "Free-text feedback option",
        "Ratings aggregate into reliability score",
        "Preferred worker flag for frequent high performers"
      ],
      businessLogic: [
        "Rating request triggered 2 hours after shift end",
        "Reminder sent if not rated within 24 hours",
        "Reliability score = weighted average of all ratings",
        "Preferred flag: avg rating >4.5 across 3+ placements",
        "Low ratings (<3) trigger agency notification",
        "Historical ratings visible when reviewing candidates"
      ],
      priority: "medium",
      relatedModules: [
        { module: "Agency Portal", relationship: "Ratings shared with agencies" },
        { module: "Shift Matching", relationship: "Reliability score influences ranking" }
      ],
      endToEndJourney: [
        "1. Agency worker Sarah completes shift at 3 PM",
        "2. At 5 PM, Manager receives rating prompt",
        "3. Rates Sarah: Overall 5★, Punctuality 5★, Skills 4★",
        "4. Adds note: 'Excellent performance'",
        "5. Rating saved, Sarah's reliability score updates",
        "6. Sarah flagged as 'Preferred Worker' for this location",
        "7. Next agency broadcast prioritizes Sarah",
        "8. Agency sees positive feedback"
      ],
      realWorldExample: {
        scenario: "Building a pool of reliable agency workers.",
        steps: [
          "Over 6 months, 5 agency workers used regularly",
          "Ratings show: 2 workers at 4.7+, 2 at 4.0, 1 at 2.8",
          "System recommends top 2 for future shifts",
          "Low-rated worker deprioritized",
          "Quality and reliability improve over time"
        ],
        outcome: "Data-driven agency worker selection improves quality."
      }
    },

    // ============================================================================
    // SECTION 17: REPORTING & AUDIT
    // ============================================================================
    {
      id: "US-RST-039",
      title: "Generate and Print Roster View",
      actors: ["Location Manager", "Staff Member"],
      description: "As a Location Manager, I want to generate a printable roster view, so that I can post physical schedules and share with staff who prefer paper.",
      acceptanceCriteria: [
        "Print-optimized layout with clear formatting",
        "Configurable date range (day, week, fortnight)",
        "Option to show all staff or specific department",
        "Staff names and shift times clearly visible",
        "Totals per staff member shown",
        "PDF export option for digital sharing"
      ],
      businessLogic: [
        "Print layout uses A4 landscape orientation",
        "Color-coding matches on-screen display",
        "Page breaks at department boundaries",
        "Header shows location, date range, generated timestamp",
        "Footer shows page numbers",
        "PDF generated client-side for privacy"
      ],
      priority: "low",
      relatedModules: [
        { module: "Reporting", relationship: "Part of report generation system" },
        { module: "Staff Portal", relationship: "Staff can print own schedule" }
      ],
      endToEndJourney: [
        "1. Manager opens Roster for week view",
        "2. Clicks 'Print' button in toolbar",
        "3. Print preview opens in new tab",
        "4. Layout formatted for A4 landscape",
        "5. All shifts visible with staff names",
        "6. Manager clicks Print → Physical printer",
        "7. Poster placed in staff break room",
        "8. Alternatively downloads PDF for email"
      ],
      realWorldExample: {
        scenario: "Weekly roster printed for staff notice board.",
        steps: [
          "Friday afternoon, roster finalized",
          "Manager prints week view for main location",
          "Second print for satellite location",
          "Posted in break rooms before weekend",
          "All staff see schedule on Monday morning"
        ],
        outcome: "Traditional communication supported alongside digital."
      }
    },
    {
      id: "US-RST-040",
      title: "View Shift History and Audit Trail",
      actors: ["Location Manager", "HR Administrator"],
      description: "As a Location Manager, I want to view the complete history of changes to any shift, so that I can audit who made changes and when.",
      acceptanceCriteria: [
        "Every shift modification logged with timestamp",
        "Shows: old value, new value, changed by, reason",
        "History accessible from shift detail panel",
        "Searchable by date range and user",
        "Export capability for compliance reports",
        "Retention period of 7 years"
      ],
      businessLogic: [
        "Logged events: create, edit, delete, publish, unpublish",
        "Each event captures: field changed, before/after values",
        "User ID stored with each event",
        "System actions logged as 'System'",
        "Soft delete: shifts marked deleted but retained in history",
        "Archive to cold storage after 2 years"
      ],
      priority: "medium",
      relatedModules: [
        { module: "Compliance", relationship: "Audit trail for regulatory requirements" },
        { module: "Reporting", relationship: "Exportable for compliance reports" }
      ],
      endToEndJourney: [
        "1. Manager opens shift detail panel",
        "2. Clicks 'View History' tab",
        "3. Timeline shows all events",
        "4. Created: Jan 5 10:30 AM by Sarah",
        "5. Staff changed: Jan 6 2:15 PM (Emma → Tom)",
        "6. Time changed: Jan 7 9:00 AM (8:00 → 8:30)",
        "7. Published: Jan 7 4:00 PM",
        "8. Each entry expandable for full details",
        "9. Export generates PDF audit report"
      ],
      realWorldExample: {
        scenario: "Investigation requires shift history review.",
        steps: [
          "HR receives complaint about scheduling",
          "Opens audit trail for disputed shifts",
          "Shows all changes with timestamps and users",
          "Evidence shows shifts assigned fairly",
          "Complaint resolved with documented proof"
        ],
        outcome: "Audit trail supports fair investigation outcomes."
      }
    },

    // ============================================================================
    // SECTION 18: PLACEMENTS & TRAINEES
    // ============================================================================
    {
      id: "US-RST-041",
      title: "Manage Trainee and Student Placements",
      actors: ["Location Manager", "HR Administrator"],
      description: "As a Location Manager, I want to schedule trainee placements separately, so they don't count toward ratios but are visible in the roster.",
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
        "Types: Certificate Student, Diploma Student, Trainee, Work Experience",
        "Supervisor must be qualified staff on same shift",
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
        "1. Training provider sends student for placement",
        "2. HR creates Student Placement profile",
        "3. Manager schedules placement with supervisor",
        "4. Placement appears in roster with 'Student' badge",
        "5. Not counted in ratio calculations",
        "6. Supervisor confirms hours each day",
        "7. Weekly report sent to training provider"
      ],
      realWorldExample: {
        scenario: "Location hosts students on placement.",
        steps: [
          "HR creates student profiles with placement agreements",
          "Manager schedules 2 days/week each",
          "Supervisors assigned to each student",
          "Hours tracked toward qualification requirement",
          "Reports generated for training provider"
        ],
        outcome: "Student placements tracked without affecting ratio compliance."
      }
    }
  ],

  // ============================================================================
  // TABLE SPECIFICATIONS - Comprehensive Database Schema
  // ============================================================================
  tableSpecs: [
    // ============================================================================
    // CORE SCHEMA - Locations, Departments, and Configuration
    // ============================================================================
    {
      name: "Tenants",
      schema: "roster_core",
      description: "Multi-tenant organization records for SaaS isolation",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key, auto-generated UUID" },
        { name: "name", type: "NVARCHAR(255)", mandatory: true, description: "Organization name", validation: "1-255 characters" },
        { name: "code", type: "NVARCHAR(50)", mandatory: true, description: "Unique organization code", validation: "Alphanumeric, unique" },
        { name: "industry_type", type: "NVARCHAR(50)", mandatory: true, description: "Primary industry: healthcare, aged_care, childcare, hospitality, retail, manufacturing, logistics" },
        { name: "country", type: "NVARCHAR(2)", mandatory: true, description: "ISO country code", defaultValue: "'AU'" },
        { name: "timezone", type: "NVARCHAR(50)", mandatory: true, description: "IANA timezone identifier", defaultValue: "'Australia/Sydney'" },
        { name: "subscription_tier", type: "NVARCHAR(50)", mandatory: true, description: "Subscription level: starter, professional, enterprise", defaultValue: "'starter'" },
        { name: "max_locations", type: "INT", mandatory: true, description: "Maximum locations allowed by subscription", defaultValue: "1" },
        { name: "max_staff", type: "INT", mandatory: true, description: "Maximum staff records allowed", defaultValue: "50" },
        { name: "is_active", type: "BIT", mandatory: true, description: "Whether tenant subscription is active", defaultValue: "1" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Tenant creation timestamp", defaultValue: "GETUTCDATE()" },
        { name: "updated_at", type: "DATETIME2", mandatory: true, description: "Last update timestamp", defaultValue: "GETUTCDATE()" }
      ],
      indexes: ["IX_Tenants_Code UNIQUE (code)", "IX_Tenants_IsActive (is_active)"]
    },
    {
      name: "Locations",
      schema: "roster_core",
      description: "Physical business locations and their configuration",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key, auto-generated UUID" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", foreignKey: "roster_core.Tenants.id", indexed: true },
        { name: "name", type: "NVARCHAR(255)", mandatory: true, description: "Display name of the location", validation: "1-255 characters" },
        { name: "code", type: "NVARCHAR(50)", mandatory: true, description: "Unique short code for the location", validation: "Unique per tenant" },
        { name: "address_line_1", type: "NVARCHAR(255)", mandatory: false, description: "Street address line 1" },
        { name: "address_line_2", type: "NVARCHAR(255)", mandatory: false, description: "Street address line 2" },
        { name: "suburb", type: "NVARCHAR(100)", mandatory: false, description: "Suburb/city name" },
        { name: "state", type: "NVARCHAR(50)", mandatory: false, description: "State/territory code (e.g., NSW, VIC, QLD)" },
        { name: "postcode", type: "NVARCHAR(20)", mandatory: false, description: "Postal code" },
        { name: "country", type: "NVARCHAR(2)", mandatory: true, description: "ISO country code", defaultValue: "'AU'" },
        { name: "latitude", type: "DECIMAL(10,7)", mandatory: false, description: "GPS latitude for geofencing" },
        { name: "longitude", type: "DECIMAL(10,7)", mandatory: false, description: "GPS longitude for geofencing" },
        { name: "geofence_radius_meters", type: "INT", mandatory: true, description: "Geofence radius for clock validation", defaultValue: "100" },
        { name: "phone", type: "NVARCHAR(50)", mandatory: false, description: "Contact phone number" },
        { name: "email", type: "NVARCHAR(255)", mandatory: false, description: "Contact email address" },
        { name: "industry_type", type: "NVARCHAR(50)", mandatory: true, description: "Industry category overriding tenant default" },
        { name: "timezone", type: "NVARCHAR(50)", mandatory: false, description: "Location timezone if different from tenant" },
        { name: "is_active", type: "BIT", mandatory: true, description: "Whether location is operational", defaultValue: "1" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation timestamp", defaultValue: "GETUTCDATE()" },
        { name: "updated_at", type: "DATETIME2", mandatory: true, description: "Last update timestamp", defaultValue: "GETUTCDATE()" },
        { name: "created_by", type: "UNIQUEIDENTIFIER", mandatory: false, description: "User who created the record" },
        { name: "updated_by", type: "UNIQUEIDENTIFIER", mandatory: false, description: "User who last updated the record" }
      ],
      indexes: [
        "IX_Locations_TenantId (tenant_id)",
        "IX_Locations_Code UNIQUE (tenant_id, code)",
        "IX_Locations_IsActive (is_active)"
      ]
    },
    {
      name: "LocationOperatingHours",
      schema: "roster_core",
      description: "Operating hours per day of week for each location",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "location_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Parent location", foreignKey: "roster_core.Locations.id", indexed: true },
        { name: "day_of_week", type: "TINYINT", mandatory: true, description: "Day of week: 0=Sunday, 1=Monday, ..., 6=Saturday" },
        { name: "is_open", type: "BIT", mandatory: true, description: "Whether location operates this day", defaultValue: "1" },
        { name: "open_time", type: "TIME", mandatory: false, description: "Opening time (null if closed)" },
        { name: "close_time", type: "TIME", mandatory: false, description: "Closing time (null if closed)" },
        { name: "effective_from", type: "DATE", mandatory: true, description: "Date these hours take effect" },
        { name: "effective_to", type: "DATE", mandatory: false, description: "Date these hours end (null for ongoing)" }
      ],
      indexes: ["IX_LocationOperatingHours_Location_Day (location_id, day_of_week)"]
    },
    {
      name: "Departments",
      schema: "roster_core",
      description: "Departments/rooms within locations with service types and capacity",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "location_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Parent location", foreignKey: "roster_core.Locations.id", indexed: true },
        { name: "name", type: "NVARCHAR(100)", mandatory: true, description: "Department display name" },
        { name: "code", type: "NVARCHAR(50)", mandatory: false, description: "Short code for the department" },
        { name: "service_type", type: "NVARCHAR(50)", mandatory: true, description: "Service category: high_care, standard, low_intensity, admin, specialized" },
        { name: "capacity", type: "INT", mandatory: true, description: "Maximum clients/capacity allowed" },
        { name: "required_ratio_numerator", type: "INT", mandatory: true, description: "Staff count in ratio (e.g., 1 in 1:4)", defaultValue: "1" },
        { name: "required_ratio_denominator", type: "INT", mandatory: true, description: "Client count in ratio (e.g., 4 in 1:4)" },
        { name: "min_qualified_staff", type: "INT", mandatory: true, description: "Minimum number of qualified staff", defaultValue: "1" },
        { name: "qualification_percentage", type: "DECIMAL(5,2)", mandatory: false, description: "Percentage of staff requiring qualification (e.g., 50.00)" },
        { name: "required_qualification_type", type: "NVARCHAR(100)", mandatory: false, description: "Primary qualification required for this department" },
        { name: "color", type: "NVARCHAR(7)", mandatory: false, description: "Display color hex code (e.g., #FF5733)" },
        { name: "display_order", type: "INT", mandatory: true, description: "Sort order in UI", defaultValue: "0" },
        { name: "is_active", type: "BIT", mandatory: true, description: "Whether department is active", defaultValue: "1" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation timestamp", defaultValue: "GETUTCDATE()" },
        { name: "updated_at", type: "DATETIME2", mandatory: true, description: "Last update timestamp", defaultValue: "GETUTCDATE()" }
      ],
      indexes: [
        "IX_Departments_LocationId (location_id)",
        "IX_Departments_ServiceType (service_type)"
      ]
    },
    {
      name: "GeofenceZones",
      schema: "roster_core",
      description: "GPS geofence zones for clock validation",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "location_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Parent location", foreignKey: "roster_core.Locations.id", indexed: true },
        { name: "name", type: "NVARCHAR(100)", mandatory: true, description: "Zone name (e.g., Main Building, Parking Lot)" },
        { name: "latitude", type: "DECIMAL(10,7)", mandatory: true, description: "Center point latitude" },
        { name: "longitude", type: "DECIMAL(10,7)", mandatory: true, description: "Center point longitude" },
        { name: "radius_meters", type: "INT", mandatory: true, description: "Zone radius in meters", validation: "50-500" },
        { name: "buffer_meters", type: "INT", mandatory: true, description: "Additional buffer for GPS accuracy", defaultValue: "20" },
        { name: "validation_mode", type: "NVARCHAR(20)", mandatory: true, description: "strict=block invalid, warning=allow with flag, disabled=no check", defaultValue: "'warning'" },
        { name: "is_primary", type: "BIT", mandatory: true, description: "Whether this is the main zone", defaultValue: "0" },
        { name: "is_active", type: "BIT", mandatory: true, description: "Whether zone is in use", defaultValue: "1" }
      ],
      indexes: ["IX_GeofenceZones_LocationId (location_id)"]
    },

    // ============================================================================
    // STAFF SCHEMA - Employee and Worker Records
    // ============================================================================
    {
      name: "Staff",
      schema: "roster_staff",
      description: "Employee and agency worker profiles",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", foreignKey: "roster_core.Tenants.id", indexed: true },
        { name: "employee_id", type: "NVARCHAR(50)", mandatory: false, description: "HR system employee ID" },
        { name: "user_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Linked user account for login", foreignKey: "auth.Users.id" },
        { name: "first_name", type: "NVARCHAR(100)", mandatory: true, description: "Staff member's first name" },
        { name: "last_name", type: "NVARCHAR(100)", mandatory: true, description: "Staff member's last name" },
        { name: "preferred_name", type: "NVARCHAR(100)", mandatory: false, description: "Preferred display name" },
        { name: "email", type: "NVARCHAR(255)", mandatory: false, description: "Email address for notifications" },
        { name: "phone", type: "NVARCHAR(50)", mandatory: false, description: "Mobile phone number" },
        { name: "date_of_birth", type: "DATE", mandatory: false, description: "Date of birth for age calculations" },
        { name: "avatar_url", type: "NVARCHAR(500)", mandatory: false, description: "Profile photo URL" },
        { name: "role", type: "NVARCHAR(50)", mandatory: true, description: "Job role: team_leader, senior_staff, staff, assistant, admin, trainee" },
        { name: "employment_type", type: "NVARCHAR(50)", mandatory: true, description: "permanent_fulltime, permanent_parttime, casual, fixed_term, agency" },
        { name: "employment_status", type: "NVARCHAR(50)", mandatory: true, description: "active, on_leave, suspended, terminated", defaultValue: "'active'" },
        { name: "hire_date", type: "DATE", mandatory: false, description: "Date of employment commencement" },
        { name: "termination_date", type: "DATE", mandatory: false, description: "Date of employment end (if applicable)" },
        { name: "agency_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Agency reference if external worker", foreignKey: "roster_agency.Agencies.id" },
        { name: "agency_worker_id", type: "NVARCHAR(50)", mandatory: false, description: "Agency's internal worker ID" },
        { name: "default_location_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Primary work location", foreignKey: "roster_core.Locations.id" },
        { name: "default_department_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Primary department", foreignKey: "roster_core.Departments.id" },
        { name: "award_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Applicable employment award", foreignKey: "awards.Awards.id" },
        { name: "classification_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Award classification level", foreignKey: "awards.Classifications.id" },
        { name: "hourly_rate", type: "DECIMAL(10,2)", mandatory: false, description: "Base hourly pay rate (override of award)" },
        { name: "annual_salary", type: "DECIMAL(12,2)", mandatory: false, description: "Annual salary for salaried staff" },
        { name: "contracted_hours_per_week", type: "DECIMAL(5,2)", mandatory: true, description: "Contracted weekly hours", defaultValue: "38.00" },
        { name: "max_hours_per_week", type: "DECIMAL(5,2)", mandatory: true, description: "Maximum allowed hours including overtime", defaultValue: "50.00" },
        { name: "multi_location", type: "BIT", mandatory: true, description: "Can work across multiple locations", defaultValue: "0" },
        { name: "is_active", type: "BIT", mandatory: true, description: "Active employee flag", defaultValue: "1" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation timestamp", defaultValue: "GETUTCDATE()" },
        { name: "updated_at", type: "DATETIME2", mandatory: true, description: "Last update timestamp", defaultValue: "GETUTCDATE()" }
      ],
      indexes: [
        "IX_Staff_TenantId (tenant_id)",
        "IX_Staff_EmployeeId (tenant_id, employee_id)",
        "IX_Staff_Email (email)",
        "IX_Staff_DefaultLocation (default_location_id)",
        "IX_Staff_EmploymentStatus (employment_status)",
        "IX_Staff_IsActive (is_active)"
      ]
    },
    {
      name: "StaffQualifications",
      schema: "roster_staff",
      description: "Qualifications and certifications held by staff",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Staff member", foreignKey: "roster_staff.Staff.id", indexed: true },
        { name: "qualification_type", type: "NVARCHAR(100)", mandatory: true, description: "Type: first_aid, cpr, wwcc, diploma_ece, certificate_iii, food_safety, etc." },
        { name: "qualification_name", type: "NVARCHAR(255)", mandatory: true, description: "Full qualification name" },
        { name: "issuing_body", type: "NVARCHAR(255)", mandatory: false, description: "Organization that issued qualification" },
        { name: "credential_id", type: "NVARCHAR(100)", mandatory: false, description: "Certificate/license number" },
        { name: "issue_date", type: "DATE", mandatory: true, description: "Date qualification was issued" },
        { name: "expiry_date", type: "DATE", mandatory: false, description: "Expiry date (null for non-expiring)" },
        { name: "status", type: "NVARCHAR(50)", mandatory: true, description: "current, expiring_soon, expired, revoked", defaultValue: "'current'" },
        { name: "document_url", type: "NVARCHAR(500)", mandatory: false, description: "URL to uploaded certificate image" },
        { name: "verified_at", type: "DATETIME2", mandatory: false, description: "When qualification was verified by HR" },
        { name: "verified_by", type: "UNIQUEIDENTIFIER", mandatory: false, description: "HR user who verified" },
        { name: "notes", type: "NVARCHAR(MAX)", mandatory: false, description: "Additional notes" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation timestamp", defaultValue: "GETUTCDATE()" },
        { name: "updated_at", type: "DATETIME2", mandatory: true, description: "Last update timestamp", defaultValue: "GETUTCDATE()" }
      ],
      indexes: [
        "IX_StaffQualifications_StaffId (staff_id)",
        "IX_StaffQualifications_Type (qualification_type)",
        "IX_StaffQualifications_Expiry (expiry_date)",
        "IX_StaffQualifications_Status (status)"
      ],
      triggers: ["TR_StaffQualifications_UpdateStatus - Updates status based on expiry_date"]
    },
    {
      name: "StaffAvailability",
      schema: "roster_staff",
      description: "Weekly availability patterns for staff",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Staff member", foreignKey: "roster_staff.Staff.id", indexed: true },
        { name: "pattern_type", type: "NVARCHAR(20)", mandatory: true, description: "default, week_a, week_b, temporary", defaultValue: "'default'" },
        { name: "day_of_week", type: "TINYINT", mandatory: true, description: "Day of week: 0=Sunday, ..., 6=Saturday" },
        { name: "availability_type", type: "NVARCHAR(20)", mandatory: true, description: "available, preferred, unavailable" },
        { name: "start_time", type: "TIME", mandatory: false, description: "Available from time (null = all day)" },
        { name: "end_time", type: "TIME", mandatory: false, description: "Available until time (null = all day)" },
        { name: "anchor_date", type: "DATE", mandatory: false, description: "Anchor date for week_a/week_b calculation" },
        { name: "effective_from", type: "DATE", mandatory: true, description: "Date availability starts" },
        { name: "effective_to", type: "DATE", mandatory: false, description: "Date availability ends (null for ongoing)" },
        { name: "approved_by", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Manager who approved change" },
        { name: "approved_at", type: "DATETIME2", mandatory: false, description: "When change was approved" },
        { name: "notes", type: "NVARCHAR(500)", mandatory: false, description: "Reason for availability pattern" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation timestamp", defaultValue: "GETUTCDATE()" }
      ],
      indexes: [
        "IX_StaffAvailability_StaffId (staff_id)",
        "IX_StaffAvailability_Effective (effective_from, effective_to)"
      ]
    },
    {
      name: "StaffLocationAssignments",
      schema: "roster_staff",
      description: "Which locations a staff member can work at",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Staff member", foreignKey: "roster_staff.Staff.id", indexed: true },
        { name: "location_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Location", foreignKey: "roster_core.Locations.id", indexed: true },
        { name: "is_primary", type: "BIT", mandatory: true, description: "Whether this is the home location", defaultValue: "0" },
        { name: "is_active", type: "BIT", mandatory: true, description: "Whether assignment is current", defaultValue: "1" },
        { name: "effective_from", type: "DATE", mandatory: true, description: "When assignment started" },
        { name: "effective_to", type: "DATE", mandatory: false, description: "When assignment ended" }
      ],
      indexes: ["IX_StaffLocationAssignments_StaffLocation UNIQUE (staff_id, location_id)"]
    },
    {
      name: "StaffFatigueScores",
      schema: "roster_staff",
      description: "Calculated fatigue risk scores for staff",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Staff member", foreignKey: "roster_staff.Staff.id", indexed: true },
        { name: "calculation_date", type: "DATE", mandatory: true, description: "Date of calculation" },
        { name: "total_score", type: "INT", mandatory: true, description: "Combined fatigue score (0-100)" },
        { name: "hours_component", type: "INT", mandatory: true, description: "Score from weekly hours (0-35)" },
        { name: "consecutive_component", type: "INT", mandatory: true, description: "Score from consecutive days (0-30)" },
        { name: "night_shift_component", type: "INT", mandatory: true, description: "Score from night shifts (0-20)" },
        { name: "rest_period_component", type: "INT", mandatory: true, description: "Score from rest adequacy (0-15)" },
        { name: "risk_level", type: "NVARCHAR(20)", mandatory: true, description: "low, moderate, high, critical" },
        { name: "hours_worked_14d", type: "DECIMAL(5,2)", mandatory: true, description: "Hours worked in last 14 days" },
        { name: "consecutive_days", type: "INT", mandatory: true, description: "Current consecutive days worked" },
        { name: "night_shifts_14d", type: "INT", mandatory: true, description: "Night shifts in last 14 days" },
        { name: "min_rest_hours", type: "DECIMAL(4,2)", mandatory: true, description: "Minimum rest period in 14 days" },
        { name: "recommendations", type: "NVARCHAR(MAX)", mandatory: false, description: "JSON array of recommendations" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Calculation timestamp", defaultValue: "GETUTCDATE()" }
      ],
      indexes: [
        "IX_StaffFatigueScores_StaffDate (staff_id, calculation_date)",
        "IX_StaffFatigueScores_RiskLevel (risk_level)"
      ]
    },

    // ============================================================================
    // SHIFTS SCHEMA - Shift Definitions and Assignments
    // ============================================================================
    {
      name: "Shifts",
      schema: "roster_shifts",
      description: "Individual shift assignments with timing and status",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", foreignKey: "roster_core.Tenants.id", indexed: true },
        { name: "location_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Location", foreignKey: "roster_core.Locations.id", indexed: true },
        { name: "department_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Department assignment", foreignKey: "roster_core.Departments.id", indexed: true },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Assigned staff (null for open shifts)", foreignKey: "roster_staff.Staff.id", indexed: true },
        { name: "shift_date", type: "DATE", mandatory: true, description: "Date of the shift", indexed: true },
        { name: "start_time", type: "TIME", mandatory: true, description: "Shift start time" },
        { name: "end_time", type: "TIME", mandatory: true, description: "Shift end time" },
        { name: "break_minutes", type: "INT", mandatory: true, description: "Scheduled break duration in minutes", defaultValue: "30" },
        { name: "paid_break_minutes", type: "INT", mandatory: true, description: "Paid break portion", defaultValue: "0" },
        { name: "calculated_hours", type: "DECIMAL(5,2)", mandatory: false, description: "Net hours (end-start-break)" },
        { name: "status", type: "NVARCHAR(50)", mandatory: true, description: "draft, published, confirmed, in_progress, completed, cancelled", defaultValue: "'draft'" },
        { name: "shift_type", type: "NVARCHAR(50)", mandatory: true, description: "regular, on_call, sleepover, broken, training", defaultValue: "'regular'" },
        { name: "is_open_shift", type: "BIT", mandatory: true, description: "Whether unassigned and available for claiming", defaultValue: "0" },
        { name: "urgency_level", type: "NVARCHAR(20)", mandatory: true, description: "normal, urgent, critical", defaultValue: "'normal'" },
        { name: "is_ai_generated", type: "BIT", mandatory: true, description: "Created by AI solver", defaultValue: "0" },
        { name: "ai_generated_at", type: "DATETIME2", mandatory: false, description: "Timestamp of AI generation" },
        { name: "ai_match_score", type: "INT", mandatory: false, description: "Skill match score if AI-assigned" },
        { name: "recurrence_pattern_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Links to recurring pattern definition", foreignKey: "roster_shifts.RecurrencePatterns.id" },
        { name: "recurrence_group_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Groups shifts in same series" },
        { name: "is_recurrence_exception", type: "BIT", mandatory: true, description: "Modified from pattern", defaultValue: "0" },
        { name: "shift_template_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Created from this template", foreignKey: "roster_shifts.ShiftTemplates.id" },
        { name: "is_absent", type: "BIT", mandatory: true, description: "Staff marked absent", defaultValue: "0" },
        { name: "absence_reason", type: "NVARCHAR(50)", mandatory: false, description: "leave, sick, no_show, emergency, other" },
        { name: "replacement_staff_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Staff covering for absent original", foreignKey: "roster_staff.Staff.id" },
        { name: "estimated_cost", type: "DECIMAL(10,2)", mandatory: false, description: "Pre-calculated shift cost estimate" },
        { name: "actual_cost", type: "DECIMAL(10,2)", mandatory: false, description: "Final calculated cost after completion" },
        { name: "notes", type: "NVARCHAR(MAX)", mandatory: false, description: "Free text notes" },
        { name: "published_at", type: "DATETIME2", mandatory: false, description: "When shift was published to staff" },
        { name: "published_by", type: "UNIQUEIDENTIFIER", mandatory: false, description: "User who published" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation timestamp", defaultValue: "GETUTCDATE()" },
        { name: "updated_at", type: "DATETIME2", mandatory: true, description: "Last update timestamp", defaultValue: "GETUTCDATE()" },
        { name: "created_by", type: "UNIQUEIDENTIFIER", mandatory: false, description: "User who created" },
        { name: "updated_by", type: "UNIQUEIDENTIFIER", mandatory: false, description: "User who last updated" }
      ],
      indexes: [
        "IX_Shifts_TenantId (tenant_id)",
        "IX_Shifts_LocationDate (location_id, shift_date)",
        "IX_Shifts_StaffDate (staff_id, shift_date)",
        "IX_Shifts_DepartmentDate (department_id, shift_date)",
        "IX_Shifts_Status (status)",
        "IX_Shifts_IsOpenShift (is_open_shift)",
        "IX_Shifts_RecurrenceGroup (recurrence_group_id)"
      ],
      triggers: [
        "TR_Shifts_CalculateHours - Auto-calculates calculated_hours on insert/update",
        "TR_Shifts_AuditLog - Logs all changes to ShiftAuditLog"
      ]
    },
    {
      name: "RecurrencePatterns",
      schema: "roster_shifts",
      description: "Definitions for recurring shift patterns",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", indexed: true },
        { name: "name", type: "NVARCHAR(100)", mandatory: true, description: "Pattern name (e.g., 'Tom - Weekly M/W/F')" },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Assigned staff for pattern", foreignKey: "roster_staff.Staff.id" },
        { name: "location_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Location", foreignKey: "roster_core.Locations.id" },
        { name: "department_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Department", foreignKey: "roster_core.Departments.id" },
        { name: "recurrence_type", type: "NVARCHAR(20)", mandatory: true, description: "daily, weekly, fortnightly, monthly" },
        { name: "days_of_week", type: "NVARCHAR(20)", mandatory: false, description: "Comma-separated days: 1,2,4 (Mon,Tue,Thu)" },
        { name: "week_pattern", type: "NVARCHAR(10)", mandatory: false, description: "For fortnightly: A, B, or AB" },
        { name: "anchor_date", type: "DATE", mandatory: false, description: "Reference date for week A/B calculation" },
        { name: "day_of_month", type: "INT", mandatory: false, description: "For monthly: day number (1-31)" },
        { name: "start_time", type: "TIME", mandatory: true, description: "Shift start time" },
        { name: "end_time", type: "TIME", mandatory: true, description: "Shift end time" },
        { name: "break_minutes", type: "INT", mandatory: true, description: "Break duration", defaultValue: "30" },
        { name: "pattern_start_date", type: "DATE", mandatory: true, description: "When pattern begins" },
        { name: "pattern_end_date", type: "DATE", mandatory: false, description: "When pattern ends (null = ongoing)" },
        { name: "occurrences_limit", type: "INT", mandatory: false, description: "Max occurrences if not using end date" },
        { name: "generation_horizon_weeks", type: "INT", mandatory: true, description: "How far ahead to generate", defaultValue: "8" },
        { name: "last_generated_date", type: "DATE", mandatory: false, description: "Last date shifts were generated to" },
        { name: "is_active", type: "BIT", mandatory: true, description: "Whether pattern is active", defaultValue: "1" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation timestamp", defaultValue: "GETUTCDATE()" },
        { name: "updated_at", type: "DATETIME2", mandatory: true, description: "Last update timestamp", defaultValue: "GETUTCDATE()" }
      ],
      indexes: [
        "IX_RecurrencePatterns_TenantId (tenant_id)",
        "IX_RecurrencePatterns_StaffId (staff_id)",
        "IX_RecurrencePatterns_IsActive (is_active)"
      ]
    },
    {
      name: "ShiftTemplates",
      schema: "roster_shifts",
      description: "Reusable shift templates for quick creation",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", indexed: true },
        { name: "location_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Location-specific template", foreignKey: "roster_core.Locations.id" },
        { name: "name", type: "NVARCHAR(100)", mandatory: true, description: "Template name" },
        { name: "description", type: "NVARCHAR(500)", mandatory: false, description: "Template description" },
        { name: "department_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Department", foreignKey: "roster_core.Departments.id" },
        { name: "start_time", type: "TIME", mandatory: true, description: "Default start time" },
        { name: "end_time", type: "TIME", mandatory: true, description: "Default end time" },
        { name: "break_minutes", type: "INT", mandatory: true, description: "Default break", defaultValue: "30" },
        { name: "shift_type", type: "NVARCHAR(50)", mandatory: true, description: "regular, on_call, etc.", defaultValue: "'regular'" },
        { name: "required_qualification", type: "NVARCHAR(100)", mandatory: false, description: "Minimum qualification required" },
        { name: "is_active", type: "BIT", mandatory: true, description: "Whether template is available", defaultValue: "1" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation timestamp", defaultValue: "GETUTCDATE()" }
      ],
      indexes: ["IX_ShiftTemplates_TenantLocation (tenant_id, location_id)"]
    },
    {
      name: "RosterTemplates",
      schema: "roster_shifts",
      description: "Weekly roster templates containing multiple shifts",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", indexed: true },
        { name: "location_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Location", foreignKey: "roster_core.Locations.id" },
        { name: "name", type: "NVARCHAR(100)", mandatory: true, description: "Template name (e.g., 'Standard Week - Full Capacity')" },
        { name: "description", type: "NVARCHAR(500)", mandatory: false, description: "Template description" },
        { name: "is_default", type: "BIT", mandatory: true, description: "Default template for location", defaultValue: "0" },
        { name: "is_active", type: "BIT", mandatory: true, description: "Whether template is available", defaultValue: "1" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation timestamp", defaultValue: "GETUTCDATE()" },
        { name: "created_by", type: "UNIQUEIDENTIFIER", mandatory: false, description: "User who created" }
      ],
      indexes: ["IX_RosterTemplates_TenantLocation (tenant_id, location_id)"]
    },
    {
      name: "RosterTemplateShifts",
      schema: "roster_shifts",
      description: "Individual shifts within a roster template",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "roster_template_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Parent template", foreignKey: "roster_shifts.RosterTemplates.id", indexed: true },
        { name: "department_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Department", foreignKey: "roster_core.Departments.id" },
        { name: "day_of_week", type: "TINYINT", mandatory: true, description: "Day: 0=Sunday, ..., 6=Saturday" },
        { name: "start_time", type: "TIME", mandatory: true, description: "Shift start time" },
        { name: "end_time", type: "TIME", mandatory: true, description: "Shift end time" },
        { name: "break_minutes", type: "INT", mandatory: true, description: "Break duration", defaultValue: "30" },
        { name: "shift_type", type: "NVARCHAR(50)", mandatory: true, description: "Shift type", defaultValue: "'regular'" },
        { name: "required_qualification", type: "NVARCHAR(100)", mandatory: false, description: "Minimum qualification" },
        { name: "preferred_role", type: "NVARCHAR(50)", mandatory: false, description: "Preferred staff role" }
      ],
      indexes: ["IX_RosterTemplateShifts_TemplateId (roster_template_id)"]
    },
    {
      name: "ShiftSwapRequests",
      schema: "roster_shifts",
      description: "Staff requests to swap shifts with colleagues",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", indexed: true },
        { name: "shift_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Shift to be swapped", foreignKey: "roster_shifts.Shifts.id" },
        { name: "requesting_staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Staff requesting swap", foreignKey: "roster_staff.Staff.id" },
        { name: "target_staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Staff offered the swap", foreignKey: "roster_staff.Staff.id" },
        { name: "reason", type: "NVARCHAR(500)", mandatory: false, description: "Reason for swap request" },
        { name: "status", type: "NVARCHAR(50)", mandatory: true, description: "pending_colleague, pending_manager, approved, rejected, cancelled", defaultValue: "'pending_colleague'" },
        { name: "colleague_response_at", type: "DATETIME2", mandatory: false, description: "When colleague responded" },
        { name: "colleague_response", type: "NVARCHAR(20)", mandatory: false, description: "accepted, declined" },
        { name: "manager_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Manager who approved/rejected" },
        { name: "manager_response_at", type: "DATETIME2", mandatory: false, description: "When manager responded" },
        { name: "manager_notes", type: "NVARCHAR(500)", mandatory: false, description: "Manager's notes on decision" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Request submission timestamp", defaultValue: "GETUTCDATE()" }
      ],
      indexes: [
        "IX_ShiftSwapRequests_ShiftId (shift_id)",
        "IX_ShiftSwapRequests_RequestingStaff (requesting_staff_id)",
        "IX_ShiftSwapRequests_Status (status)"
      ]
    },
    {
      name: "OpenShiftClaims",
      schema: "roster_shifts",
      description: "Staff claims/applications for open shifts",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "shift_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Open shift", foreignKey: "roster_shifts.Shifts.id", indexed: true },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Staff claiming shift", foreignKey: "roster_staff.Staff.id", indexed: true },
        { name: "claim_timestamp", type: "DATETIME2", mandatory: true, description: "When claim was submitted", defaultValue: "GETUTCDATE()" },
        { name: "status", type: "NVARCHAR(50)", mandatory: true, description: "pending, approved, rejected, expired", defaultValue: "'pending'" },
        { name: "skill_match_score", type: "INT", mandatory: false, description: "Calculated match score" },
        { name: "notes", type: "NVARCHAR(500)", mandatory: false, description: "Staff notes with claim" },
        { name: "processed_at", type: "DATETIME2", mandatory: false, description: "When claim was processed" },
        { name: "processed_by", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Manager who processed (null for auto)" }
      ],
      indexes: [
        "IX_OpenShiftClaims_ShiftId (shift_id)",
        "IX_OpenShiftClaims_StaffId (staff_id)",
        "IX_OpenShiftClaims_Status (status)"
      ]
    },
    {
      name: "ShiftAuditLog",
      schema: "roster_shifts",
      description: "Complete audit trail of all shift modifications",
      fields: [
        { name: "id", type: "BIGINT IDENTITY", mandatory: true, description: "Primary key, auto-increment" },
        { name: "shift_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Shift that was modified", indexed: true },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", indexed: true },
        { name: "action", type: "NVARCHAR(50)", mandatory: true, description: "create, update, delete, publish, unpublish, assign, unassign" },
        { name: "field_changed", type: "NVARCHAR(100)", mandatory: false, description: "Which field was modified" },
        { name: "old_value", type: "NVARCHAR(MAX)", mandatory: false, description: "Previous value (JSON for complex)" },
        { name: "new_value", type: "NVARCHAR(MAX)", mandatory: false, description: "New value (JSON for complex)" },
        { name: "changed_by", type: "UNIQUEIDENTIFIER", mandatory: false, description: "User who made change (null for system)" },
        { name: "changed_by_name", type: "NVARCHAR(200)", mandatory: false, description: "User name snapshot" },
        { name: "change_reason", type: "NVARCHAR(500)", mandatory: false, description: "Reason for change" },
        { name: "ip_address", type: "NVARCHAR(50)", mandatory: false, description: "Client IP address" },
        { name: "user_agent", type: "NVARCHAR(500)", mandatory: false, description: "Client browser/app" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Timestamp of change", defaultValue: "GETUTCDATE()" }
      ],
      indexes: [
        "IX_ShiftAuditLog_ShiftId (shift_id)",
        "IX_ShiftAuditLog_TenantDate (tenant_id, created_at)",
        "IX_ShiftAuditLog_ChangedBy (changed_by)"
      ]
    },

    // ============================================================================
    // ATTENDANCE SCHEMA - Clock Events and Timesheets
    // ============================================================================
    {
      name: "ClockEvents",
      schema: "roster_attendance",
      description: "Time and attendance clock events with GPS validation",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", indexed: true },
        { name: "shift_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Associated shift", foreignKey: "roster_shifts.Shifts.id", indexed: true },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Staff member", foreignKey: "roster_staff.Staff.id", indexed: true },
        { name: "location_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Location clocked at", foreignKey: "roster_core.Locations.id" },
        { name: "event_type", type: "NVARCHAR(50)", mandatory: true, description: "clock_in, clock_out, break_start, break_end" },
        { name: "scheduled_time", type: "DATETIME2", mandatory: false, description: "Expected time based on shift" },
        { name: "actual_time", type: "DATETIME2", mandatory: true, description: "Actual recorded time" },
        { name: "rounded_time", type: "DATETIME2", mandatory: false, description: "Time rounded for payroll (nearest 15 min)" },
        { name: "latitude", type: "DECIMAL(10,7)", mandatory: false, description: "GPS latitude" },
        { name: "longitude", type: "DECIMAL(10,7)", mandatory: false, description: "GPS longitude" },
        { name: "accuracy_meters", type: "INT", mandatory: false, description: "GPS accuracy in meters" },
        { name: "geofence_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Validated geofence zone", foreignKey: "roster_core.GeofenceZones.id" },
        { name: "within_geofence", type: "BIT", mandatory: false, description: "Whether within allowed zone" },
        { name: "distance_from_location", type: "INT", mandatory: false, description: "Distance from location center in meters" },
        { name: "validation_status", type: "NVARCHAR(50)", mandatory: true, description: "valid, warning, invalid, manual_override", defaultValue: "'valid'" },
        { name: "validation_notes", type: "NVARCHAR(MAX)", mandatory: false, description: "Explanation for non-valid status" },
        { name: "is_offline_sync", type: "BIT", mandatory: true, description: "Captured offline and synced later", defaultValue: "0" },
        { name: "offline_captured_at", type: "DATETIME2", mandatory: false, description: "Original capture time if offline" },
        { name: "device_id", type: "NVARCHAR(100)", mandatory: false, description: "Device identifier" },
        { name: "device_info", type: "NVARCHAR(255)", mandatory: false, description: "Device model/OS for audit" },
        { name: "ip_address", type: "NVARCHAR(50)", mandatory: false, description: "Client IP address" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation timestamp", defaultValue: "GETUTCDATE()" }
      ],
      indexes: [
        "IX_ClockEvents_TenantId (tenant_id)",
        "IX_ClockEvents_ShiftId (shift_id)",
        "IX_ClockEvents_StaffDate (staff_id, actual_time)",
        "IX_ClockEvents_LocationDate (location_id, actual_time)",
        "IX_ClockEvents_ValidationStatus (validation_status)"
      ]
    },
    {
      name: "Timesheets",
      schema: "roster_attendance",
      description: "Aggregated timesheet records for pay periods",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", indexed: true },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Staff member", foreignKey: "roster_staff.Staff.id", indexed: true },
        { name: "location_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary location for period", foreignKey: "roster_core.Locations.id" },
        { name: "pay_period_start", type: "DATE", mandatory: true, description: "Start of pay period" },
        { name: "pay_period_end", type: "DATE", mandatory: true, description: "End of pay period" },
        { name: "status", type: "NVARCHAR(50)", mandatory: true, description: "draft, submitted, pending_approval, approved, rejected, exported", defaultValue: "'draft'" },
        { name: "total_scheduled_hours", type: "DECIMAL(6,2)", mandatory: true, description: "Sum of scheduled shift hours", defaultValue: "0" },
        { name: "total_worked_hours", type: "DECIMAL(6,2)", mandatory: true, description: "Sum of actual worked hours", defaultValue: "0" },
        { name: "total_break_hours", type: "DECIMAL(5,2)", mandatory: true, description: "Sum of break time", defaultValue: "0" },
        { name: "ordinary_hours", type: "DECIMAL(6,2)", mandatory: true, description: "Hours at ordinary rate", defaultValue: "0" },
        { name: "overtime_hours_1_5x", type: "DECIMAL(5,2)", mandatory: true, description: "Hours at 1.5x rate", defaultValue: "0" },
        { name: "overtime_hours_2x", type: "DECIMAL(5,2)", mandatory: true, description: "Hours at 2x rate", defaultValue: "0" },
        { name: "weekend_hours", type: "DECIMAL(5,2)", mandatory: true, description: "Weekend penalty hours", defaultValue: "0" },
        { name: "public_holiday_hours", type: "DECIMAL(5,2)", mandatory: true, description: "Public holiday hours", defaultValue: "0" },
        { name: "night_shift_hours", type: "DECIMAL(5,2)", mandatory: true, description: "Night shift hours", defaultValue: "0" },
        { name: "estimated_gross_pay", type: "DECIMAL(10,2)", mandatory: false, description: "Calculated gross pay estimate" },
        { name: "anomaly_count", type: "INT", mandatory: true, description: "Number of detected anomalies", defaultValue: "0" },
        { name: "submitted_at", type: "DATETIME2", mandatory: false, description: "When timesheet was submitted" },
        { name: "approved_at", type: "DATETIME2", mandatory: false, description: "When timesheet was approved" },
        { name: "approved_by", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Manager who approved" },
        { name: "approval_notes", type: "NVARCHAR(MAX)", mandatory: false, description: "Approval comments" },
        { name: "exported_at", type: "DATETIME2", mandatory: false, description: "When exported to payroll" },
        { name: "payroll_reference", type: "NVARCHAR(100)", mandatory: false, description: "Reference from payroll system" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation timestamp", defaultValue: "GETUTCDATE()" },
        { name: "updated_at", type: "DATETIME2", mandatory: true, description: "Last update timestamp", defaultValue: "GETUTCDATE()" }
      ],
      indexes: [
        "IX_Timesheets_TenantId (tenant_id)",
        "IX_Timesheets_StaffPeriod (staff_id, pay_period_start)",
        "IX_Timesheets_Status (status)",
        "IX_Timesheets_PayPeriod (pay_period_start, pay_period_end)"
      ]
    },
    {
      name: "TimesheetLineItems",
      schema: "roster_attendance",
      description: "Individual shift entries within a timesheet",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "timesheet_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Parent timesheet", foreignKey: "roster_attendance.Timesheets.id", indexed: true },
        { name: "shift_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Related shift", foreignKey: "roster_shifts.Shifts.id" },
        { name: "shift_date", type: "DATE", mandatory: true, description: "Date of work" },
        { name: "department_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Department worked", foreignKey: "roster_core.Departments.id" },
        { name: "scheduled_start", type: "TIME", mandatory: false, description: "Scheduled start time" },
        { name: "scheduled_end", type: "TIME", mandatory: false, description: "Scheduled end time" },
        { name: "actual_start", type: "TIME", mandatory: false, description: "Actual clock in time" },
        { name: "actual_end", type: "TIME", mandatory: false, description: "Actual clock out time" },
        { name: "break_minutes", type: "INT", mandatory: true, description: "Break taken in minutes", defaultValue: "0" },
        { name: "scheduled_hours", type: "DECIMAL(5,2)", mandatory: true, description: "Scheduled hours", defaultValue: "0" },
        { name: "worked_hours", type: "DECIMAL(5,2)", mandatory: true, description: "Actual hours worked", defaultValue: "0" },
        { name: "variance_minutes", type: "INT", mandatory: true, description: "Difference from scheduled (+ early/late)", defaultValue: "0" },
        { name: "overtime_hours", type: "DECIMAL(5,2)", mandatory: true, description: "Overtime hours for this entry", defaultValue: "0" },
        { name: "pay_type", type: "NVARCHAR(50)", mandatory: true, description: "ordinary, overtime_1_5x, overtime_2x, weekend, public_holiday", defaultValue: "'ordinary'" },
        { name: "hourly_rate", type: "DECIMAL(10,2)", mandatory: false, description: "Applicable hourly rate" },
        { name: "line_total", type: "DECIMAL(10,2)", mandatory: false, description: "Calculated pay for this line" },
        { name: "has_anomaly", type: "BIT", mandatory: true, description: "Whether anomaly detected", defaultValue: "0" },
        { name: "anomaly_type", type: "NVARCHAR(100)", mandatory: false, description: "Type of anomaly if any" },
        { name: "anomaly_resolved", type: "BIT", mandatory: true, description: "Whether anomaly was resolved", defaultValue: "0" },
        { name: "notes", type: "NVARCHAR(500)", mandatory: false, description: "Entry notes" }
      ],
      indexes: [
        "IX_TimesheetLineItems_TimesheetId (timesheet_id)",
        "IX_TimesheetLineItems_ShiftId (shift_id)",
        "IX_TimesheetLineItems_Date (shift_date)"
      ]
    },
    {
      name: "TimesheetAnomalies",
      schema: "roster_attendance",
      description: "Detected timesheet anomalies for review",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "timesheet_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Parent timesheet", foreignKey: "roster_attendance.Timesheets.id", indexed: true },
        { name: "line_item_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Specific line item", foreignKey: "roster_attendance.TimesheetLineItems.id" },
        { name: "anomaly_type", type: "NVARCHAR(100)", mandatory: true, description: "missing_clock_out, early_clock_in, excessive_hours, pattern_drift, etc." },
        { name: "severity", type: "NVARCHAR(20)", mandatory: true, description: "info, warning, critical" },
        { name: "description", type: "NVARCHAR(500)", mandatory: true, description: "Human-readable description" },
        { name: "expected_value", type: "NVARCHAR(100)", mandatory: false, description: "What was expected" },
        { name: "actual_value", type: "NVARCHAR(100)", mandatory: false, description: "What was found" },
        { name: "status", type: "NVARCHAR(50)", mandatory: true, description: "open, investigating, resolved, ignored", defaultValue: "'open'" },
        { name: "resolution_type", type: "NVARCHAR(50)", mandatory: false, description: "corrected, justified, ignored" },
        { name: "resolution_notes", type: "NVARCHAR(MAX)", mandatory: false, description: "Explanation of resolution" },
        { name: "resolved_by", type: "UNIQUEIDENTIFIER", mandatory: false, description: "User who resolved" },
        { name: "resolved_at", type: "DATETIME2", mandatory: false, description: "When resolved" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Detection timestamp", defaultValue: "GETUTCDATE()" }
      ],
      indexes: [
        "IX_TimesheetAnomalies_TimesheetId (timesheet_id)",
        "IX_TimesheetAnomalies_Status (status)",
        "IX_TimesheetAnomalies_Severity (severity)"
      ]
    },

    // ============================================================================
    // LEAVE SCHEMA - Leave Requests and Balances
    // ============================================================================
    {
      name: "LeaveRequests",
      schema: "roster_leave",
      description: "Staff leave requests and approvals",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", indexed: true },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Requesting staff member", foreignKey: "roster_staff.Staff.id", indexed: true },
        { name: "leave_type", type: "NVARCHAR(50)", mandatory: true, description: "annual, sick, personal, parental, long_service, unpaid, other" },
        { name: "start_date", type: "DATE", mandatory: true, description: "First day of leave" },
        { name: "end_date", type: "DATE", mandatory: true, description: "Last day of leave" },
        { name: "start_half_day", type: "BIT", mandatory: true, description: "First day is half day", defaultValue: "0" },
        { name: "end_half_day", type: "BIT", mandatory: true, description: "Last day is half day", defaultValue: "0" },
        { name: "hours_requested", type: "DECIMAL(6,2)", mandatory: true, description: "Total leave hours requested" },
        { name: "days_requested", type: "DECIMAL(4,1)", mandatory: true, description: "Total days requested" },
        { name: "status", type: "NVARCHAR(50)", mandatory: true, description: "draft, pending, approved, rejected, cancelled, withdrawn", defaultValue: "'pending'" },
        { name: "reason", type: "NVARCHAR(MAX)", mandatory: false, description: "Staff reason for leave" },
        { name: "approver_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Manager who approved/rejected" },
        { name: "approval_date", type: "DATETIME2", mandatory: false, description: "When decision was made" },
        { name: "approval_notes", type: "NVARCHAR(MAX)", mandatory: false, description: "Manager's notes on decision" },
        { name: "certificate_required", type: "BIT", mandatory: true, description: "Whether certificate is required", defaultValue: "0" },
        { name: "certificate_url", type: "NVARCHAR(500)", mandatory: false, description: "Medical certificate attachment" },
        { name: "certificate_uploaded_at", type: "DATETIME2", mandatory: false, description: "When certificate was uploaded" },
        { name: "affects_shifts", type: "INT", mandatory: true, description: "Number of shifts affected", defaultValue: "0" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Request submission timestamp", defaultValue: "GETUTCDATE()" },
        { name: "updated_at", type: "DATETIME2", mandatory: true, description: "Last update timestamp", defaultValue: "GETUTCDATE()" }
      ],
      indexes: [
        "IX_LeaveRequests_TenantId (tenant_id)",
        "IX_LeaveRequests_StaffId (staff_id)",
        "IX_LeaveRequests_Dates (start_date, end_date)",
        "IX_LeaveRequests_Status (status)",
        "IX_LeaveRequests_LeaveType (leave_type)"
      ]
    },
    {
      name: "LeaveBalances",
      schema: "roster_leave",
      description: "Current leave balances per staff member",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Staff member", foreignKey: "roster_staff.Staff.id", indexed: true },
        { name: "leave_type", type: "NVARCHAR(50)", mandatory: true, description: "annual, sick, personal, long_service" },
        { name: "annual_entitlement_hours", type: "DECIMAL(6,2)", mandatory: true, description: "Annual entitlement in hours" },
        { name: "accrued_hours", type: "DECIMAL(8,2)", mandatory: true, description: "Total hours accrued to date", defaultValue: "0" },
        { name: "taken_hours", type: "DECIMAL(8,2)", mandatory: true, description: "Total hours taken to date", defaultValue: "0" },
        { name: "pending_hours", type: "DECIMAL(6,2)", mandatory: true, description: "Hours in pending requests", defaultValue: "0" },
        { name: "available_hours", type: "DECIMAL(8,2)", mandatory: true, description: "Accrued - Taken - Pending", defaultValue: "0" },
        { name: "ytd_accrued_hours", type: "DECIMAL(6,2)", mandatory: true, description: "Hours accrued this financial year", defaultValue: "0" },
        { name: "ytd_taken_hours", type: "DECIMAL(6,2)", mandatory: true, description: "Hours taken this financial year", defaultValue: "0" },
        { name: "last_accrual_date", type: "DATE", mandatory: false, description: "Date of last accrual calculation" },
        { name: "next_anniversary", type: "DATE", mandatory: false, description: "Next leave anniversary date" },
        { name: "updated_at", type: "DATETIME2", mandatory: true, description: "Last balance update", defaultValue: "GETUTCDATE()" }
      ],
      indexes: [
        "IX_LeaveBalances_StaffType UNIQUE (staff_id, leave_type)"
      ],
      triggers: ["TR_LeaveBalances_CalculateAvailable - Recalculates available_hours on update"]
    },
    {
      name: "LeaveTransactions",
      schema: "roster_leave",
      description: "Transaction log of all leave balance changes",
      fields: [
        { name: "id", type: "BIGINT IDENTITY", mandatory: true, description: "Primary key" },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Staff member", foreignKey: "roster_staff.Staff.id", indexed: true },
        { name: "leave_type", type: "NVARCHAR(50)", mandatory: true, description: "Leave type" },
        { name: "transaction_type", type: "NVARCHAR(50)", mandatory: true, description: "accrual, taken, adjustment, payout, opening_balance" },
        { name: "hours", type: "DECIMAL(6,2)", mandatory: true, description: "Hours (positive=credit, negative=debit)" },
        { name: "balance_after", type: "DECIMAL(8,2)", mandatory: true, description: "Balance after this transaction" },
        { name: "reference_type", type: "NVARCHAR(50)", mandatory: false, description: "leave_request, timesheet, manual" },
        { name: "reference_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Related record ID" },
        { name: "pay_period", type: "DATE", mandatory: false, description: "Pay period for accruals" },
        { name: "notes", type: "NVARCHAR(500)", mandatory: false, description: "Transaction notes" },
        { name: "created_by", type: "UNIQUEIDENTIFIER", mandatory: false, description: "User for manual adjustments" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Transaction timestamp", defaultValue: "GETUTCDATE()" }
      ],
      indexes: [
        "IX_LeaveTransactions_StaffType (staff_id, leave_type)",
        "IX_LeaveTransactions_CreatedAt (created_at)"
      ]
    },

    // ============================================================================
    // AGENCY SCHEMA - External Agency Integration
    // ============================================================================
    {
      name: "Agencies",
      schema: "roster_agency",
      description: "External staffing agency partners",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", indexed: true },
        { name: "name", type: "NVARCHAR(255)", mandatory: true, description: "Agency name" },
        { name: "code", type: "NVARCHAR(50)", mandatory: true, description: "Short code" },
        { name: "contact_name", type: "NVARCHAR(100)", mandatory: false, description: "Primary contact person" },
        { name: "email", type: "NVARCHAR(255)", mandatory: false, description: "Contact email" },
        { name: "phone", type: "NVARCHAR(50)", mandatory: false, description: "Contact phone" },
        { name: "api_endpoint", type: "NVARCHAR(500)", mandatory: false, description: "API integration endpoint" },
        { name: "api_key", type: "NVARCHAR(255)", mandatory: false, description: "Encrypted API key" },
        { name: "priority_order", type: "INT", mandatory: true, description: "Priority for escalation", defaultValue: "1" },
        { name: "escalation_tier", type: "INT", mandatory: true, description: "Which tier for auto-escalation", defaultValue: "1" },
        { name: "default_hourly_rate", type: "DECIMAL(10,2)", mandatory: false, description: "Default hourly rate" },
        { name: "commission_percentage", type: "DECIMAL(5,2)", mandatory: false, description: "Agency commission %" },
        { name: "is_active", type: "BIT", mandatory: true, description: "Whether agency is active", defaultValue: "1" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation timestamp", defaultValue: "GETUTCDATE()" }
      ],
      indexes: ["IX_Agencies_TenantId (tenant_id)", "IX_Agencies_Code (code)"]
    },
    {
      name: "AgencyShiftBroadcasts",
      schema: "roster_agency",
      description: "Shift broadcasts to agency partners",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "shift_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Shift being broadcast", foreignKey: "roster_shifts.Shifts.id", indexed: true },
        { name: "agency_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Target agency", foreignKey: "roster_agency.Agencies.id" },
        { name: "broadcast_at", type: "DATETIME2", mandatory: true, description: "When broadcast was sent", defaultValue: "GETUTCDATE()" },
        { name: "escalation_tier", type: "INT", mandatory: true, description: "Current escalation tier", defaultValue: "1" },
        { name: "status", type: "NVARCHAR(50)", mandatory: true, description: "pending, proposal_received, accepted, rejected, expired", defaultValue: "'pending'" },
        { name: "expires_at", type: "DATETIME2", mandatory: true, description: "When broadcast expires" },
        { name: "proposal_received_at", type: "DATETIME2", mandatory: false, description: "When agency responded" },
        { name: "proposed_worker_name", type: "NVARCHAR(100)", mandatory: false, description: "Proposed worker name" },
        { name: "proposed_worker_qualifications", type: "NVARCHAR(MAX)", mandatory: false, description: "JSON of qualifications" },
        { name: "proposed_hourly_rate", type: "DECIMAL(10,2)", mandatory: false, description: "Proposed rate" },
        { name: "accepted_at", type: "DATETIME2", mandatory: false, description: "When proposal was accepted" },
        { name: "accepted_by", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Manager who accepted" }
      ],
      indexes: [
        "IX_AgencyShiftBroadcasts_ShiftId (shift_id)",
        "IX_AgencyShiftBroadcasts_AgencyId (agency_id)",
        "IX_AgencyShiftBroadcasts_Status (status)"
      ]
    },
    {
      name: "AgencyWorkerRatings",
      schema: "roster_agency",
      description: "Manager ratings of agency workers after placements",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "agency_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Agency", foreignKey: "roster_agency.Agencies.id", indexed: true },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Agency worker", foreignKey: "roster_staff.Staff.id", indexed: true },
        { name: "shift_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Shift worked", foreignKey: "roster_shifts.Shifts.id" },
        { name: "location_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Location worked", foreignKey: "roster_core.Locations.id" },
        { name: "overall_rating", type: "TINYINT", mandatory: true, description: "Overall 1-5 star rating" },
        { name: "punctuality_rating", type: "TINYINT", mandatory: false, description: "Punctuality 1-5" },
        { name: "skills_rating", type: "TINYINT", mandatory: false, description: "Skills 1-5" },
        { name: "teamwork_rating", type: "TINYINT", mandatory: false, description: "Teamwork 1-5" },
        { name: "attitude_rating", type: "TINYINT", mandatory: false, description: "Attitude 1-5" },
        { name: "comments", type: "NVARCHAR(MAX)", mandatory: false, description: "Free-text feedback" },
        { name: "would_rehire", type: "BIT", mandatory: true, description: "Would use this worker again", defaultValue: "1" },
        { name: "rated_by", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Manager who rated" },
        { name: "rated_at", type: "DATETIME2", mandatory: true, description: "When rating was submitted", defaultValue: "GETUTCDATE()" }
      ],
      indexes: [
        "IX_AgencyWorkerRatings_AgencyId (agency_id)",
        "IX_AgencyWorkerRatings_StaffId (staff_id)",
        "IX_AgencyWorkerRatings_LocationId (location_id)"
      ]
    },

    // ============================================================================
    // BUDGET SCHEMA - Costing and Budgets
    // ============================================================================
    {
      name: "LocationBudgets",
      schema: "roster_budget",
      description: "Labour budgets per location per period",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", indexed: true },
        { name: "location_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Location", foreignKey: "roster_core.Locations.id", indexed: true },
        { name: "budget_period_type", type: "NVARCHAR(20)", mandatory: true, description: "weekly, fortnightly, monthly, annual" },
        { name: "period_start", type: "DATE", mandatory: true, description: "Start of budget period" },
        { name: "period_end", type: "DATE", mandatory: true, description: "End of budget period" },
        { name: "total_budget", type: "DECIMAL(12,2)", mandatory: true, description: "Total labour budget" },
        { name: "ordinary_hours_budget", type: "DECIMAL(10,2)", mandatory: false, description: "Budget for ordinary hours" },
        { name: "overtime_budget", type: "DECIMAL(10,2)", mandatory: false, description: "Budget for overtime" },
        { name: "penalty_rates_budget", type: "DECIMAL(10,2)", mandatory: false, description: "Budget for penalty rates" },
        { name: "agency_budget", type: "DECIMAL(10,2)", mandatory: false, description: "Budget for agency staff" },
        { name: "allowances_budget", type: "DECIMAL(10,2)", mandatory: false, description: "Budget for allowances" },
        { name: "actual_spend", type: "DECIMAL(12,2)", mandatory: true, description: "Actual spend to date", defaultValue: "0" },
        { name: "forecast_spend", type: "DECIMAL(12,2)", mandatory: false, description: "Projected end-of-period spend" },
        { name: "variance_amount", type: "DECIMAL(12,2)", mandatory: false, description: "Actual - Budget" },
        { name: "variance_percentage", type: "DECIMAL(5,2)", mandatory: false, description: "Variance as percentage" },
        { name: "alert_threshold_warning", type: "DECIMAL(5,2)", mandatory: true, description: "% for warning alert", defaultValue: "90.00" },
        { name: "alert_threshold_critical", type: "DECIMAL(5,2)", mandatory: true, description: "% for critical alert", defaultValue: "100.00" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation timestamp", defaultValue: "GETUTCDATE()" },
        { name: "updated_at", type: "DATETIME2", mandatory: true, description: "Last update timestamp", defaultValue: "GETUTCDATE()" }
      ],
      indexes: [
        "IX_LocationBudgets_LocationPeriod (location_id, period_start)"
      ]
    },

    // ============================================================================
    // COMPLIANCE SCHEMA - Ratio and Compliance Tracking
    // ============================================================================
    {
      name: "RatioSnapshots",
      schema: "roster_compliance",
      description: "Point-in-time staffing ratio snapshots for audit",
      fields: [
        { name: "id", type: "BIGINT IDENTITY", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", indexed: true },
        { name: "location_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Location", foreignKey: "roster_core.Locations.id", indexed: true },
        { name: "department_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Department", foreignKey: "roster_core.Departments.id", indexed: true },
        { name: "snapshot_time", type: "DATETIME2", mandatory: true, description: "When snapshot was taken", indexed: true },
        { name: "client_count", type: "INT", mandatory: true, description: "Number of clients present" },
        { name: "staff_count", type: "INT", mandatory: true, description: "Number of staff clocked in" },
        { name: "qualified_staff_count", type: "INT", mandatory: true, description: "Staff with required qualification" },
        { name: "actual_ratio", type: "DECIMAL(5,2)", mandatory: true, description: "Calculated ratio (clients/staff)" },
        { name: "required_ratio", type: "DECIMAL(5,2)", mandatory: true, description: "Required ratio for compliance" },
        { name: "compliance_status", type: "NVARCHAR(20)", mandatory: true, description: "compliant, at_risk, breach" },
        { name: "breach_duration_minutes", type: "INT", mandatory: false, description: "Duration if in breach" },
        { name: "mitigation_action", type: "NVARCHAR(500)", mandatory: false, description: "Action taken to address breach" }
      ],
      indexes: [
        "IX_RatioSnapshots_LocationTime (location_id, snapshot_time)",
        "IX_RatioSnapshots_ComplianceStatus (compliance_status)"
      ]
    },
    {
      name: "ComplianceIncidents",
      schema: "roster_compliance",
      description: "Logged compliance breaches and near-misses",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", indexed: true },
        { name: "location_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Location", foreignKey: "roster_core.Locations.id" },
        { name: "department_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Department if applicable", foreignKey: "roster_core.Departments.id" },
        { name: "incident_type", type: "NVARCHAR(100)", mandatory: true, description: "ratio_breach, fatigue_violation, qualification_gap, etc." },
        { name: "severity", type: "NVARCHAR(20)", mandatory: true, description: "low, medium, high, critical" },
        { name: "incident_start", type: "DATETIME2", mandatory: true, description: "When incident started" },
        { name: "incident_end", type: "DATETIME2", mandatory: false, description: "When incident ended" },
        { name: "duration_minutes", type: "INT", mandatory: false, description: "Total duration" },
        { name: "description", type: "NVARCHAR(MAX)", mandatory: true, description: "Description of the incident" },
        { name: "root_cause", type: "NVARCHAR(500)", mandatory: false, description: "Root cause analysis" },
        { name: "immediate_action", type: "NVARCHAR(MAX)", mandatory: false, description: "Actions taken during incident" },
        { name: "corrective_action", type: "NVARCHAR(MAX)", mandatory: false, description: "Follow-up corrective actions" },
        { name: "reported_by", type: "UNIQUEIDENTIFIER", mandatory: false, description: "User who reported/detected" },
        { name: "investigated_by", type: "UNIQUEIDENTIFIER", mandatory: false, description: "User who investigated" },
        { name: "status", type: "NVARCHAR(50)", mandatory: true, description: "open, investigating, closed, escalated", defaultValue: "'open'" },
        { name: "closed_at", type: "DATETIME2", mandatory: false, description: "When incident was closed" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation timestamp", defaultValue: "GETUTCDATE()" }
      ],
      indexes: [
        "IX_ComplianceIncidents_LocationDate (location_id, incident_start)",
        "IX_ComplianceIncidents_Type (incident_type)",
        "IX_ComplianceIncidents_Status (status)"
      ]
    }
  ],

  // ============================================================================
  // INTEGRATIONS
  // ============================================================================
  integrations: [
    { system: "Payroll System", type: "Export", description: "Approved timesheets exported for payroll processing via REST API or file export" },
    { system: "HRIS", type: "Bidirectional", description: "Staff records synchronized with HR Information System" },
    { system: "Booking/CRM System", type: "Import", description: "Service demand data for staffing forecasts and real-time occupancy" },
    { system: "Agency Portal", type: "Bidirectional", description: "Open shifts shared, proposals received, ratings synchronized" },
    { system: "Calendar (iCal)", type: "Export", description: "Staff roster sync to Google Calendar, Outlook, Apple Calendar" },
    { system: "SMS Gateway", type: "Export", description: "Urgent shift notifications and reminders via Twilio, MessageBird, etc." },
    { system: "Push Notifications", type: "Export", description: "Mobile app notifications via Firebase Cloud Messaging" },
    { system: "Weather API", type: "Import", description: "Weather data for demand forecasting (OpenWeatherMap, Bureau of Meteorology)" },
    { system: "Qualification Registry", type: "Import", description: "Verification of qualifications against regulatory body APIs" },
    { system: "SSO/Identity Provider", type: "Bidirectional", description: "Single sign-on via SAML, OAuth, Azure AD, Okta" }
  ],

  // ============================================================================
  // BUSINESS RULES
  // ============================================================================
  businessRules: [
    { id: "BR-RST-001", rule: "Shifts cannot be assigned to staff who are on approved leave", rationale: "Prevents scheduling conflicts and ensures accurate leave tracking" },
    { id: "BR-RST-002", rule: "Minimum 10 hours rest required between shift end and next shift start", rationale: "Fatigue management compliance and staff wellbeing" },
    { id: "BR-RST-003", rule: "Maximum 5 consecutive days worked without 2 consecutive days off", rationale: "Award compliance and fatigue prevention" },
    { id: "BR-RST-004", rule: "Open shifts can only be claimed by staff with matching qualifications", rationale: "Ensures compliance requirements are met" },
    { id: "BR-RST-005", rule: "Published roster requires 7 days advance notice", rationale: "Award requirement for roster notification" },
    { id: "BR-RST-006", rule: "Overtime requires manager pre-approval or documented justification", rationale: "Budget control and compliance" },
    { id: "BR-RST-007", rule: "Cross-location shifts require travel allowance calculation", rationale: "Fair compensation for additional travel" },
    { id: "BR-RST-008", rule: "Agency staff must have verified qualifications before assignment", rationale: "Regulatory compliance and quality assurance" },
    { id: "BR-RST-009", rule: "Break scheduling must maintain minimum staffing ratios at all times", rationale: "Continuous regulatory compliance" },
    { id: "BR-RST-010", rule: "Shift swaps require same or higher qualification level", rationale: "Maintains service quality and compliance" },
    { id: "BR-RST-011", rule: "Recurring shift patterns must generate shifts at least 8 weeks in advance", rationale: "Ensures staff visibility into future schedules" },
    { id: "BR-RST-012", rule: "Expiring recurring series must trigger notifications 14 days before end date", rationale: "Prevents unexpected schedule gaps" },
    { id: "BR-RST-013", rule: "Fatigue score above 80 requires immediate manager intervention", rationale: "OH&S compliance and duty of care" },
    { id: "BR-RST-014", rule: "Cross-location conflicts are non-overridable blocking errors", rationale: "Physical impossibility of being in two places" },
    { id: "BR-RST-015", rule: "Agency shift broadcasts must auto-escalate after 30 minutes without response", rationale: "Ensures urgent shifts get filled in time" },
    { id: "BR-RST-016", rule: "Ratio compliance validation must run before any shift create/edit/delete", rationale: "Proactive breach prevention" },
    { id: "BR-RST-017", rule: "Leave accruals must be calculated per hour worked, not per shift", rationale: "Accurate pro-rata entitlements for part-time staff" },
    { id: "BR-RST-018", rule: "All shift modifications must be logged with user, timestamp, and before/after values", rationale: "Complete audit trail for compliance" },
    { id: "BR-RST-019", rule: "GPS clock validation requires accuracy ≤50 meters", rationale: "Ensures reliable location verification" },
    { id: "BR-RST-020", rule: "Timesheet anomalies must be resolved before approval can complete", rationale: "Prevents payroll errors and fraud" },
    { id: "BR-RST-021", rule: "Staff qualification expiry alerts must be sent at 90, 60, and 30 days before expiry", rationale: "Adequate time for renewal process" },
    { id: "BR-RST-022", rule: "Expired background checks result in immediate block from all shift assignments", rationale: "Child/client safety is non-negotiable" },
    { id: "BR-RST-023", rule: "Maximum weekly hours including overtime cannot exceed 50 hours without director approval", rationale: "OH&S and burnout prevention" },
    { id: "BR-RST-024", rule: "Agency worker ratings must be submitted within 24 hours of shift completion", rationale: "Ensures timely and accurate feedback" },
    { id: "BR-RST-025", rule: "Trainee/student placements are supernumerary and do not count toward ratios", rationale: "Regulatory compliance for training programs" }
  ]
};
