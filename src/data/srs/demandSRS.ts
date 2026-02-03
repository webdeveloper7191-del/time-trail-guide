// Demand Management Module - Software Requirements Specification
// Comprehensive documentation of demand forecasting, tracking, and staffing optimization

import { ModuleSRS } from './rosterSRS';

export const demandSRS: ModuleSRS = {
  moduleName: "Demand Management & Forecasting",
  version: "1.0.0",
  lastUpdated: "2026-02-03",
  overview: `The Demand Management module provides comprehensive demand tracking, forecasting, and staffing optimization capabilities across all industries. It enables managers to predict service demand, optimize staffing levels, and ensure appropriate resource allocation. The system integrates booking data, historical attendance patterns, external factors (weather, holidays, events), and configurable thresholds to calculate required staffing levels per zone/department and time slot. It supports both manual demand entry and automated integration with external booking/POS systems.`,

  objectives: [
    "Reduce understaffing incidents by 80% through accurate demand forecasting",
    "Minimize overstaffing costs by 15-25% through data-driven scheduling",
    "Achieve 95%+ forecast accuracy using historical patterns and ML prediction",
    "Provide real-time visibility into demand vs staffing coverage gaps",
    "Enable proactive staffing adjustments through 7-day rolling forecasts",
    "Integrate external factors (weather, holidays) for improved prediction accuracy",
    "Support industry-specific demand metrics and terminology"
  ],

  scope: [
    "Industry-agnostic demand configuration with customizable terminology",
    "Multi-source demand data integration (manual, historical, integration, forecast)",
    "Configurable time slot granularity (15min, 30min, 1hr, 2hr, 4hr, daily)",
    "Demand threshold configuration with staffing requirements per level",
    "Schedule pattern detection (morning rush, afternoon pickup, etc.)",
    "Historical attendance tracking and analysis",
    "Staff-to-demand ratio calculation and compliance monitoring",
    "External factor integration (weather, public holidays, school holidays, events)",
    "Demand forecasting with multiple methods (moving average, weighted, seasonal, ML)",
    "Real-time demand visualization with charts and histograms",
    "Understaffing and overstaffing alerts with cost impact analysis",
    "Optimization recommendations for cost savings and coverage"
  ],

  outOfScope: [
    "Actual shift creation and assignment (handled by Roster module)",
    "Customer/client booking management (data imported from external systems)",
    "Payroll and cost calculation (handled by Awards/Payroll modules)",
    "Staff availability management (handled by Roster module)",
    "Qualification tracking and compliance (handled by Roster module)"
  ],

  actors: [
    {
      name: "Location Manager",
      description: "Reviews demand forecasts and adjusts staffing plans for their location",
      permissions: [
        "View demand forecasts and analytics for assigned location",
        "Enter manual demand data for special events or overrides",
        "Configure schedule patterns for their location",
        "Acknowledge understaffing/overstaffing alerts",
        "Export demand reports for planning meetings"
      ]
    },
    {
      name: "Area Manager",
      description: "Analyzes demand trends across multiple locations for resource planning",
      permissions: [
        "All Location Manager permissions across multiple locations",
        "Compare demand patterns across locations",
        "Reallocate staff between locations based on demand",
        "Access consolidated demand analytics and trends",
        "Configure regional demand settings and thresholds"
      ]
    },
    {
      name: "Operations Analyst",
      description: "Configures demand forecasting models and analyzes accuracy metrics",
      permissions: [
        "Configure forecasting methods and parameters",
        "Define demand thresholds and staffing requirements",
        "Manage external factor integrations",
        "Analyze forecast accuracy and adjust models",
        "Create custom schedule patterns"
      ]
    },
    {
      name: "System Administrator",
      description: "Configures industry settings and integrations for demand data",
      permissions: [
        "Configure industry type and terminology",
        "Set up integrations with booking/POS systems",
        "Define operating hours and time slot granularity",
        "Configure alert thresholds and notifications",
        "Manage data source priorities and settings"
      ]
    },
    {
      name: "Rostering Coordinator",
      description: "Uses demand data to create optimized rosters",
      permissions: [
        "View demand forecasts to inform scheduling decisions",
        "Access staffing recommendations per time slot",
        "View historical demand vs actual staffing comparisons",
        "Receive alerts for upcoming demand spikes"
      ]
    }
  ],

  functionalRequirements: [
    // Industry Configuration
    { id: "FR-DMD-001", category: "Industry Configuration", requirement: "System shall support industry-specific terminology for demand units (e.g., Children, Customers, Patients, Calls)", priority: "Critical" },
    { id: "FR-DMD-002", category: "Industry Configuration", requirement: "System shall provide pre-configured templates for common industries (childcare, retail, healthcare, hospitality, call centre, manufacturing, events)", priority: "High" },
    { id: "FR-DMD-003", category: "Industry Configuration", requirement: "System shall allow customization of zone/department labels per industry context", priority: "Medium" },
    
    // Demand Data Sources
    { id: "FR-DMD-004", category: "Data Sources", requirement: "System shall support manual entry of expected demand per zone and time slot", priority: "Critical" },
    { id: "FR-DMD-005", category: "Data Sources", requirement: "System shall integrate with external booking systems to import confirmed demand", priority: "High" },
    { id: "FR-DMD-006", category: "Data Sources", requirement: "System shall calculate historical demand patterns from attendance records", priority: "High" },
    { id: "FR-DMD-007", category: "Data Sources", requirement: "System shall generate demand forecasts using configurable prediction methods", priority: "High" },
    { id: "FR-DMD-008", category: "Data Sources", requirement: "System shall merge data from multiple sources with configurable priority weighting", priority: "Medium" },
    
    // Time Slot Configuration
    { id: "FR-DMD-009", category: "Time Configuration", requirement: "System shall support configurable time slot granularity (15min, 30min, 1hr, 2hr, 4hr, daily)", priority: "High" },
    { id: "FR-DMD-010", category: "Time Configuration", requirement: "System shall allow definition of operating hours per day of week", priority: "High" },
    { id: "FR-DMD-011", category: "Time Configuration", requirement: "System shall support timezone configuration for multi-region operations", priority: "Medium" },
    
    // Demand Thresholds
    { id: "FR-DMD-012", category: "Thresholds", requirement: "System shall allow configuration of demand thresholds with min/max ranges", priority: "Critical" },
    { id: "FR-DMD-013", category: "Thresholds", requirement: "System shall map each threshold to required staffing levels", priority: "Critical" },
    { id: "FR-DMD-014", category: "Thresholds", requirement: "System shall assign color codes and alert levels to thresholds", priority: "Medium" },
    { id: "FR-DMD-015", category: "Thresholds", requirement: "System shall calculate required staff count using formula: CEIL(demand / ratio)", priority: "Critical" },
    
    // Schedule Patterns
    { id: "FR-DMD-016", category: "Schedule Patterns", requirement: "System shall allow definition of recurring schedule patterns (e.g., morning rush, dinner service)", priority: "High" },
    { id: "FR-DMD-017", category: "Schedule Patterns", requirement: "System shall apply demand multipliers to base demand during pattern periods", priority: "High" },
    { id: "FR-DMD-018", category: "Schedule Patterns", requirement: "System shall support pattern configuration by day of week and time range", priority: "High" },
    
    // Staffing Calculations
    { id: "FR-DMD-019", category: "Staffing Calculations", requirement: "System shall calculate required staff based on demand and industry-specific ratios", priority: "Critical" },
    { id: "FR-DMD-020", category: "Staffing Calculations", requirement: "System shall compare scheduled staff to required staff and identify gaps", priority: "Critical" },
    { id: "FR-DMD-021", category: "Staffing Calculations", requirement: "System shall track staffing compliance status (understaffed/optimal/overstaffed) per time slot", priority: "Critical" },
    { id: "FR-DMD-022", category: "Staffing Calculations", requirement: "System shall calculate potential cost savings from overstaffing scenarios", priority: "High" },
    
    // Historical Analysis
    { id: "FR-DMD-023", category: "Historical Analysis", requirement: "System shall track actual attendance vs booked demand for pattern analysis", priority: "High" },
    { id: "FR-DMD-024", category: "Historical Analysis", requirement: "System shall calculate attendance rate percentages per zone and time slot", priority: "High" },
    { id: "FR-DMD-025", category: "Historical Analysis", requirement: "System shall identify no-show patterns for forecast adjustment", priority: "Medium" },
    { id: "FR-DMD-026", category: "Historical Analysis", requirement: "System shall maintain configurable lookback period (1-12 weeks) for pattern analysis", priority: "Medium" },
    
    // External Factors
    { id: "FR-DMD-027", category: "External Factors", requirement: "System shall integrate weather forecasts to adjust demand predictions", priority: "Medium" },
    { id: "FR-DMD-028", category: "External Factors", requirement: "System shall account for public holidays with configurable demand multipliers", priority: "High" },
    { id: "FR-DMD-029", category: "External Factors", requirement: "System shall support school holiday calendar integration", priority: "Medium" },
    { id: "FR-DMD-030", category: "External Factors", requirement: "System shall allow manual entry of special events affecting demand", priority: "Medium" },
    
    // Forecasting
    { id: "FR-DMD-031", category: "Forecasting", requirement: "System shall support multiple forecasting methods: moving average, weighted average, seasonal, ML prediction", priority: "High" },
    { id: "FR-DMD-032", category: "Forecasting", requirement: "System shall calculate confidence scores (0-100%) for forecast predictions", priority: "Medium" },
    { id: "FR-DMD-033", category: "Forecasting", requirement: "System shall automatically adjust forecasts based on actual vs predicted accuracy", priority: "Medium" },
    { id: "FR-DMD-034", category: "Forecasting", requirement: "System shall generate 7-day rolling forecasts with daily refresh", priority: "High" },
    
    // Alerts & Notifications
    { id: "FR-DMD-035", category: "Alerts", requirement: "System shall generate alerts when staffing falls below threshold percentage", priority: "Critical" },
    { id: "FR-DMD-036", category: "Alerts", requirement: "System shall alert when overstaffing exceeds configurable threshold", priority: "High" },
    { id: "FR-DMD-037", category: "Alerts", requirement: "System shall notify on demand spikes exceeding forecast confidence bounds", priority: "Medium" },
    { id: "FR-DMD-038", category: "Alerts", requirement: "System shall provide forecast accuracy alerts when predictions deviate significantly", priority: "Low" },
    
    // Visualization
    { id: "FR-DMD-039", category: "Visualization", requirement: "System shall display demand histogram per zone showing time slot breakdown", priority: "High" },
    { id: "FR-DMD-040", category: "Visualization", requirement: "System shall show inline demand charts on roster view with booked vs attendance bars", priority: "High" },
    { id: "FR-DMD-041", category: "Visualization", requirement: "System shall visualize required vs scheduled staff as overlay lines on charts", priority: "High" },
    { id: "FR-DMD-042", category: "Visualization", requirement: "System shall color-code demand levels based on threshold configuration", priority: "Medium" },
    
    // Reporting
    { id: "FR-DMD-043", category: "Reporting", requirement: "System shall generate demand vs staffing variance reports", priority: "High" },
    { id: "FR-DMD-044", category: "Reporting", requirement: "System shall calculate optimization opportunities with cost impact", priority: "High" },
    { id: "FR-DMD-045", category: "Reporting", requirement: "System shall track forecast accuracy metrics over time", priority: "Medium" }
  ],

  nonFunctionalRequirements: [
    { id: "NFR-DMD-001", category: "Performance", requirement: "Demand calculations shall complete within 500ms for a single day/zone view" },
    { id: "NFR-DMD-002", category: "Performance", requirement: "Historical analysis shall process up to 12 weeks of data within 3 seconds" },
    { id: "NFR-DMD-003", category: "Availability", requirement: "Demand forecasting service shall maintain 99.5% uptime" },
    { id: "NFR-DMD-004", category: "Scalability", requirement: "System shall support demand tracking for up to 100 zones across 50 locations" },
    { id: "NFR-DMD-005", category: "Integration", requirement: "External booking system sync shall occur at minimum every 15 minutes" },
    { id: "NFR-DMD-006", category: "Accuracy", requirement: "Moving average forecast shall use seeded random for reproducible test data" },
    { id: "NFR-DMD-007", category: "Data Retention", requirement: "Historical demand data shall be retained for minimum 2 years" },
    { id: "NFR-DMD-008", category: "Real-time", requirement: "Dashboard shall refresh demand metrics every 60 seconds during operating hours" },
    { id: "NFR-DMD-009", category: "Offline", requirement: "Manual demand entries shall queue offline and sync when connectivity restored" },
    { id: "NFR-DMD-010", category: "Audit", requirement: "All demand data changes shall be logged with user, timestamp, and previous value" }
  ],

  userStories: [
    // ============================================================================
    // SECTION 1: DEMAND CONFIGURATION
    // ============================================================================
    {
      id: "US-DMD-001",
      title: "Configure Industry-Specific Demand Terminology",
      actors: ["System Administrator"],
      description: "As a System Administrator, I want to configure industry-specific terminology for demand tracking, so that the system uses language familiar to our staff and industry context.",
      acceptanceCriteria: [
        "Can select from predefined industry templates (childcare, retail, healthcare, etc.)",
        "Can customize demand unit labels (e.g., 'Children', 'Customers', 'Patients')",
        "Can configure zone/department labels (e.g., 'Room', 'Department', 'Ward')",
        "Can set ratio terminology (e.g., 'Staff:Child Ratio', 'Nurse:Patient Ratio')",
        "Can define peak period descriptions for the industry",
        "All UI labels update immediately upon configuration change"
      ],
      businessLogic: [
        "Industry templates provide default configurations for: childcare, retail, healthcare, hospitality, call_center, manufacturing, events, custom",
        "Childcare template: demandUnit='Child', zoneLabel='Room', ratioLabel='Staff:Child Ratio', peakIndicators=['Drop-off 7-9am', 'Pick-up 3-6pm']",
        "Healthcare template: demandUnit='Patient', zoneLabel='Ward', ratioLabel='Nurse:Patient Ratio'",
        "Retail template: demandUnit='Customer', zoneLabel='Department', primaryMetric='Foot Traffic'",
        "Custom template allows full customization of all labels",
        "Switching industry resets terminology to template defaults but preserves settings"
      ],
      priority: "critical",
      relatedModules: [
        { module: "Roster", relationship: "Terminology labels used in roster views" },
        { module: "Reporting", relationship: "Report headers use configured terminology" }
      ],
      endToEndJourney: [
        "1. System Administrator opens Settings > Demand Configuration",
        "2. Clicks 'Industry Setup' tab",
        "3. Reviews current industry: 'Childcare'",
        "4. Decides to customize for aged care context",
        "5. Switches to 'Healthcare' template",
        "6. Modifies demandUnit to 'Resident' (instead of 'Patient')",
        "7. Updates zoneLabel to 'Wing' (instead of 'Ward')",
        "8. Adds peak indicator: 'Medication Round 8am'",
        "9. Saves configuration",
        "10. Verifies roster view now shows 'Residents' and 'Wing' labels"
      ],
      realWorldExample: {
        scenario: "An aged care facility using healthcare template needs customized terminology",
        steps: [
          "Administrator selects Healthcare industry template",
          "Changes 'Patient' to 'Resident' to match aged care context",
          "Changes 'Ward' to 'Wing' matching facility layout",
          "Adds aged care-specific peak times for meals and medication rounds",
          "Saves and validates all screens reflect new terminology"
        ],
        outcome: "System now displays aged care-appropriate language across all demand and roster views"
      }
    },
    {
      id: "US-DMD-002",
      title: "Configure Demand Time Slot Granularity",
      actors: ["System Administrator", "Operations Analyst"],
      description: "As an Operations Analyst, I want to configure the granularity of demand time slots, so that we track demand at the appropriate level of detail for our operation.",
      acceptanceCriteria: [
        "Can select time slot granularity: 15min, 30min, 1hr, 2hr, 4hr, or daily",
        "Can configure operating hours per day of week",
        "Can mark days as open/closed",
        "Time slots auto-generate based on granularity and operating hours",
        "Existing demand data is aggregated/split when granularity changes"
      ],
      businessLogic: [
        "Time slot generation formula: For each operating hour, create slots based on granularity minutes",
        "Example for 30min granularity, 6am-6pm: generates 24 slots per day",
        "Example for 1hr granularity, 6am-6pm: generates 12 slots per day",
        "Daily granularity creates single 'All Day' slot",
        "Operating hours default: Weekdays 6:30am-6:30pm, Saturday 8am-5pm, Sunday closed",
        "Changing granularity triggers data migration: finer → aggregate values summed, coarser → values split proportionally",
        "Timezone stored in IANA format (e.g., 'Australia/Sydney')"
      ],
      priority: "high",
      relatedModules: [
        { module: "Roster", relationship: "Time slots align with shift boundaries for comparison" }
      ],
      endToEndJourney: [
        "1. Operations Analyst opens Demand Master Settings",
        "2. Reviews current granularity: '30min'",
        "3. For childcare with simpler patterns, changes to '3-hour blocks'",
        "4. System shows preview of new time slots: '06:00-09:00', '09:00-12:00', '12:00-15:00', '15:00-18:00'",
        "5. Confirms change with warning about data aggregation",
        "6. Adjusts Saturday operating hours to 8am-1pm",
        "7. Marks Sunday as closed",
        "8. Saves configuration",
        "9. Demand charts now show 4 bars per day instead of 24"
      ],
      realWorldExample: {
        scenario: "A childcare centre wants simpler 3-hour block tracking instead of 30-minute slots",
        steps: [
          "Analyst changes granularity from 30min to 3-hour blocks",
          "Reviews the 4 time slots: Morning (6-9am), Mid-Morning (9am-12pm), Afternoon (12-3pm), Late Afternoon (3-6pm)",
          "Historical data automatically aggregates: 6 x 30-min slots → 1 x 3-hour block",
          "Saves and verifies simpler demand visualization"
        ],
        outcome: "Demand tracking simplified to 4 daily slots matching natural childcare session patterns"
      }
    },
    {
      id: "US-DMD-003",
      title: "Configure Demand Thresholds with Staffing Requirements",
      actors: ["Operations Analyst", "Location Manager"],
      description: "As an Operations Analyst, I want to configure demand thresholds that map demand levels to required staffing counts, so that the system can automatically calculate staffing needs.",
      acceptanceCriteria: [
        "Can create multiple demand thresholds with min/max ranges",
        "Can assign required staff count to each threshold",
        "Can assign color code for visual identification",
        "Can set alert level (info, warning, critical) per threshold",
        "Thresholds must not have overlapping ranges",
        "System validates threshold coverage (no gaps in demand ranges)"
      ],
      businessLogic: [
        "Default thresholds: Low (0-10, 2 staff), Normal (11-25, 4 staff), High (26-40, 6 staff), Critical (41+, 8 staff)",
        "Required staff calculation: Uses threshold mapping first, falls back to ratio formula",
        "Ratio formula fallback: CEIL(bookedDemand / industryRatio)",
        "Industry ratios: childcare 4-11 depending on age, healthcare 4-6, retail 15-20",
        "Alert level mapping: 'info' → green badge, 'warning' → amber badge, 'critical' → red badge",
        "Threshold colors displayed in demand histograms and charts",
        "Overlapping threshold validation: Each demand value must map to exactly one threshold"
      ],
      priority: "critical",
      relatedModules: [
        { module: "Roster", relationship: "Required staff used in compliance calculations" },
        { module: "Alerts", relationship: "Alert levels trigger notifications" }
      ],
      endToEndJourney: [
        "1. Operations Analyst opens Demand Master Settings > Thresholds tab",
        "2. Reviews existing thresholds: Low, Normal, High, Critical",
        "3. Edits 'High' threshold: changes max from 40 to 35",
        "4. Increases required staff for 'High' from 6 to 7",
        "5. Creates new 'Very High' threshold: 36-45, 8 staff, orange color, warning level",
        "6. Updates 'Critical' threshold: 46+, 10 staff, red color, critical level",
        "7. System validates no overlapping ranges",
        "8. Saves configuration",
        "9. Demand charts now show 5 threshold bands instead of 4"
      ],
      realWorldExample: {
        scenario: "A retail store needs fine-grained thresholds for Christmas shopping season",
        steps: [
          "Creates 'Quiet' threshold: 0-20 customers, 2 staff, green, info level",
          "Creates 'Steady' threshold: 21-50 customers, 4 staff, blue, info level",
          "Creates 'Busy' threshold: 51-80 customers, 6 staff, amber, warning level",
          "Creates 'Peak' threshold: 81-120 customers, 9 staff, orange, warning level",
          "Creates 'Rush' threshold: 121+ customers, 12 staff, red, critical level",
          "Validates complete coverage from 0 to maximum expected demand"
        ],
        outcome: "Store has granular staffing requirements mapped to expected Christmas foot traffic"
      }
    },
    {
      id: "US-DMD-004",
      title: "Configure Schedule Patterns with Demand Multipliers",
      actors: ["Operations Analyst", "Location Manager"],
      description: "As a Location Manager, I want to configure recurring schedule patterns that increase expected demand during peak periods, so that forecasts account for predictable demand spikes.",
      acceptanceCriteria: [
        "Can create named schedule patterns (e.g., 'Morning Rush', 'Lunch Peak')",
        "Can specify days of week the pattern applies",
        "Can set start and end time for the pattern",
        "Can assign demand multiplier (e.g., 1.5 = 50% increase)",
        "Can assign color for visual identification on charts",
        "Multiple overlapping patterns use highest multiplier"
      ],
      businessLogic: [
        "Demand multiplier formula: effectiveDemand = baseDemand × multiplier",
        "Multiplier range: 0.5 (50% reduction) to 2.0 (100% increase)",
        "Pattern matching: Pattern applies if dayOfWeek matches AND timeSlot overlaps pattern time range",
        "Multiple pattern handling: When patterns overlap, system uses MAX(multiplier1, multiplier2, ...)",
        "Default patterns for childcare: Morning Rush (7-9am weekdays, 1.5x), Afternoon Pickup (3-6pm weekdays, 1.3x)",
        "Pattern colors display as left border on demand histogram bars",
        "Industry template peak indicators auto-create patterns with 1.2x multiplier"
      ],
      priority: "high",
      relatedModules: [
        { module: "Forecasting", relationship: "Patterns feed into forecast model" }
      ],
      endToEndJourney: [
        "1. Location Manager opens Demand Settings > Schedule Patterns",
        "2. Reviews existing patterns: Morning Rush, Afternoon Pickup",
        "3. Creates new pattern: 'Friday Early Pickup'",
        "4. Sets days: Friday only",
        "5. Sets time: 2:00 PM to 4:00 PM",
        "6. Sets multiplier: 1.4 (40% increase)",
        "7. Selects purple color for identification",
        "8. Saves pattern",
        "9. Views Friday roster and sees purple bars indicating elevated demand 2-4pm"
      ],
      realWorldExample: {
        scenario: "A restaurant needs lunch and dinner service patterns with different demand multipliers",
        steps: [
          "Creates 'Lunch Service' pattern: 11:30am-2pm, weekdays, 1.6x multiplier",
          "Creates 'Early Dinner' pattern: 5pm-7pm, weekdays, 1.4x multiplier",
          "Creates 'Prime Dinner' pattern: 7pm-9pm, Thu-Sat, 1.8x multiplier",
          "Creates 'Weekend Brunch' pattern: 10am-2pm, Sat-Sun, 1.7x multiplier",
          "Each pattern assigned distinct color for quick visual identification",
          "Overlapping Thu-Sat 7-9pm uses 1.8x (highest) not sum"
        ],
        outcome: "Demand forecasts accurately reflect restaurant's peak service periods throughout the week"
      }
    },

    // ============================================================================
    // SECTION 2: DEMAND DATA ENTRY & SOURCES
    // ============================================================================
    {
      id: "US-DMD-005",
      title: "Enter Manual Demand Data",
      actors: ["Location Manager", "Rostering Coordinator"],
      description: "As a Location Manager, I want to manually enter expected demand for specific dates and zones, so that I can account for known events or override automatic forecasts.",
      acceptanceCriteria: [
        "Can select specific date, zone, and time slot for entry",
        "Can enter expected demand count",
        "Can add notes explaining the demand entry",
        "Manual entries take priority over forecasted values",
        "Can view and edit existing manual entries",
        "Can bulk import demand data from spreadsheet"
      ],
      businessLogic: [
        "Manual entry structure: { date, centreId, roomId, timeSlot, expectedDemand, notes, source='manual' }",
        "Data source priority: 1. Manual (highest), 2. Integration, 3. Historical, 4. Forecast (lowest)",
        "When multiple sources exist, system uses highest priority non-null value",
        "Manual entries create audit log: { userId, timestamp, previousValue, newValue, notes }",
        "Bulk import accepts CSV/Excel with columns: Date, Zone, TimeSlot, ExpectedDemand, Notes",
        "Import validation: Date format (YYYY-MM-DD), Zone must exist, TimeSlot must match configured granularity",
        "Manual entries expire after their date passes (archived, not deleted)"
      ],
      priority: "critical",
      relatedModules: [
        { module: "Roster", relationship: "Manual entries inform scheduling decisions" }
      ],
      endToEndJourney: [
        "1. Location Manager learns of special event: School excursion bringing 15 extra children",
        "2. Opens Demand > Manual Entry screen",
        "3. Selects date: Next Tuesday",
        "4. Selects zone: Preschool Room",
        "5. Selects time slot: 9:00 AM - 12:00 PM",
        "6. Enters demand: 25 children (normal is 10)",
        "7. Adds note: 'Local school excursion visit'",
        "8. Saves entry",
        "9. Roster view now shows elevated staffing requirement for that slot",
        "10. Receives alert: 'Staffing gap detected - 2 additional staff required'"
      ],
      realWorldExample: {
        scenario: "Childcare centre hosting school holiday program with elevated attendance",
        steps: [
          "Manager opens bulk import and uploads school holiday demand spreadsheet",
          "Spreadsheet contains elevated demand for 2-week holiday period",
          "System validates all dates, zones, and time slots",
          "3 warnings: Zone 'Old Wing' not found, remapped to 'East Wing'",
          "Confirms import of 168 demand entries (14 days × 4 slots × 3 rooms)",
          "All entries marked source='import' for audit purposes"
        ],
        outcome: "Two weeks of school holiday demand pre-loaded, enabling proactive staffing arrangements"
      }
    },
    {
      id: "US-DMD-006",
      title: "View Demand Analytics Dashboard",
      actors: ["Location Manager", "Area Manager", "Rostering Coordinator"],
      description: "As a Location Manager, I want to view a comprehensive demand analytics dashboard, so that I can understand demand patterns and staffing requirements at a glance.",
      acceptanceCriteria: [
        "Can view demand data by date range (day, week, fortnight, month)",
        "Can filter by specific zone/room",
        "Dashboard shows: booked demand, actual attendance, attendance rate",
        "Dashboard shows: required staff vs scheduled staff comparison",
        "Dashboard shows: ratio compliance status per time slot",
        "Dashboard shows: optimization opportunities (cost savings, coverage gaps)",
        "Can toggle between chart types (bar, line, area)"
      ],
      businessLogic: [
        "Key metrics calculated per time slot:",
        "- bookedChildren: Sum of confirmed + casual bookings for slot",
        "- confirmedBookings: Permanent/recurring bookings (typically 80% of total)",
        "- casualBookings: Ad-hoc bookings (typically 20% of total)",
        "- historicalAttendance: Based on lookback period average (default 4 weeks)",
        "- attendanceRate: (historicalAttendance / bookedChildren) × 100, typically 85-95%",
        "- childAbsences: bookedChildren - historicalAttendance",
        "Staffing calculations:",
        "- requiredStaff: CEIL(bookedChildren / industryRatio)",
        "- scheduledStaff: Count of staff rostered for that slot",
        "- staffDifference: scheduledStaff - requiredStaff (positive = overstaffed)",
        "- staffRatioCompliant: scheduledStaff >= requiredStaff",
        "Cost calculations:",
        "- hoursExcess: MAX(0, staffDifference) × slotDurationHours",
        "- potentialSavings: hoursExcess × averageHourlyRate",
        "- hoursShortfall: MAX(0, -staffDifference) × slotDurationHours"
      ],
      priority: "high",
      relatedModules: [
        { module: "Roster", relationship: "Inline charts displayed on roster grid" },
        { module: "Costing", relationship: "Cost savings use hourly rate from Awards" }
      ],
      endToEndJourney: [
        "1. Location Manager opens Demand Analytics for current week",
        "2. Views summary cards: Total Bookings, Avg Attendance Rate, Staff Coverage, Cost Variance",
        "3. Examines demand histogram for Babies Room",
        "4. Notes high demand (90% capacity) during 9am-12pm slots",
        "5. Clicks into slot to see detail: 10 booked, 9 typically attend, 3 staff required",
        "6. Sees scheduled staff: 2 (red indicator - understaffed)",
        "7. Views optimization recommendations: 'Add 1 staff 9am-12pm to achieve compliance'",
        "8. Notes Friday afternoon shows overstaffing: 'Potential saving: $90 (3 excess hours)'",
        "9. Exports weekly demand report for management meeting"
      ],
      realWorldExample: {
        scenario: "Area Manager reviewing weekly demand patterns across three centres",
        steps: [
          "Opens consolidated view for all locations",
          "Sorts by 'Coverage Gap' to prioritize problem areas",
          "Identifies Centre 2 has consistent Monday understaffing",
          "Drills into Centre 2 Monday view: 4 slots understaffed by 1-2 staff",
          "Notes pattern: High casual bookings on Mondays not matching permanent staff",
          "Recommends: Add casual pool staff standing availability for Mondays",
          "Exports comparison report showing all three centres side-by-side"
        ],
        outcome: "Data-driven identification of systematic staffing gap with clear remediation path"
      }
    },
    {
      id: "US-DMD-007",
      title: "Track Historical Attendance Patterns",
      actors: ["Operations Analyst", "Location Manager"],
      description: "As an Operations Analyst, I want to track historical attendance patterns against bookings, so that forecasts can account for typical no-show rates.",
      acceptanceCriteria: [
        "System captures actual attendance when children/customers arrive",
        "Can compare booked vs actual for any historical period",
        "Can view attendance rate trends over time",
        "Can identify patterns (e.g., Mondays have 10% no-show rate)",
        "Configurable lookback period for pattern analysis (1-12 weeks)",
        "Can export historical data for external analysis"
      ],
      businessLogic: [
        "Attendance rate formula: (actualAttendance / bookedDemand) × 100",
        "Typical attendance rates: Childcare 85-95%, Healthcare 80-90%, Retail varies by weather",
        "Pattern detection: Calculate average attendance rate per day-of-week and time-slot",
        "Lookback configuration: Weeks 1-4 weighted higher than weeks 5-12 for recency bias",
        "Weighted average formula: Σ(attendanceRate × recencyWeight) / Σ(recencyWeight)",
        "Recency weights: Week 1 = 1.0, Week 2 = 0.9, Week 3 = 0.8, etc.",
        "Child absence tracking: Separate category from no-shows (e.g., sick leave)",
        "Historical data storage: Aggregated daily for > 90 days, detailed for < 90 days"
      ],
      priority: "high",
      relatedModules: [
        { module: "Forecasting", relationship: "Historical patterns feed forecast models" }
      ],
      endToEndJourney: [
        "1. Operations Analyst opens Historical Analysis for Q4",
        "2. Selects Babies Room for focused analysis",
        "3. Views attendance rate trend: averaging 88% across quarter",
        "4. Notes dip to 82% in week of school holidays (parents kept children home)",
        "5. Views day-of-week breakdown: Monday 85%, Friday 92%",
        "6. Views time-slot breakdown: Morning 90%, Afternoon 86%",
        "7. Identifies pattern: Friday afternoons have highest attendance (94%)",
        "8. Exports data to create 'Attendance Pattern' report",
        "9. Uses insights to adjust Monday staffing levels downward"
      ],
      realWorldExample: {
        scenario: "Childcare centre noticing high no-show rate wants to optimize staffing",
        steps: [
          "Analyst runs 8-week historical analysis across all rooms",
          "Discovers Toddler Room has 15% no-show rate on rainy days",
          "Integrates weather forecast data for pattern correlation",
          "Confirms: Rainy weather correlates with 10-15% attendance drop",
          "Creates weather-adjusted forecast model for Toddler Room",
          "Implements policy: On forecast rain days, roster 1 fewer staff in Toddler Room"
        ],
        outcome: "Weather-correlated staffing saves ~$200/week in overstaffing costs without compromising care"
      }
    },

    // ============================================================================
    // SECTION 3: STAFFING CALCULATIONS & COMPLIANCE
    // ============================================================================
    {
      id: "US-DMD-008",
      title: "Calculate Required Staffing from Demand",
      actors: ["System", "Location Manager"],
      description: "As the system, I want to automatically calculate required staffing levels based on demand and industry ratios, so that managers know minimum staffing requirements.",
      acceptanceCriteria: [
        "Required staff calculated per zone and time slot",
        "Calculation uses industry-specific ratios (e.g., 1:4 for babies)",
        "Demand thresholds can override ratio-based calculation",
        "Buffer percentage can be applied for margin",
        "Different ratios supported per zone/age group",
        "Calculation updates in real-time as demand changes"
      ],
      businessLogic: [
        "Primary calculation: requiredStaff = CEIL(bookedChildren / ratioRequirement)",
        "Example: 10 babies with 1:4 ratio → CEIL(10/4) = 3 staff required",
        "Industry ratios (Australia NQF):",
        "- Babies (0-2 years): 1:4 ratio",
        "- Toddlers (2-3 years): 1:5 ratio",
        "- Preschool (3-4 years): 1:10 ratio",
        "- Kindergarten (4-5 years): 1:11 ratio",
        "Buffer calculation: requiredStaff = CEIL(baseRequired × (1 + bufferPercentage/100))",
        "Threshold override: If demand matches threshold, use threshold.requiredStaff instead of ratio",
        "Mixed age groups: Calculate each age group separately, sum results",
        "Minimum staffing: Always at least 1 staff if demand > 0",
        "Additional constraints: 50% must hold Diploma qualification, 1 First Aid certified per room"
      ],
      priority: "critical",
      relatedModules: [
        { module: "Roster", relationship: "Feeds into roster compliance indicators" },
        { module: "Compliance", relationship: "Ratio compliance based on this calculation" }
      ],
      endToEndJourney: [
        "1. System receives booking update: Babies Room now has 11 children booked for Tuesday 9am",
        "2. System retrieves ratio for Babies Room: 1:4",
        "3. System calculates: CEIL(11/4) = 3 staff required",
        "4. System checks buffer setting: 10% buffer enabled",
        "5. System applies buffer: CEIL(3 × 1.1) = 4 staff required",
        "6. System checks scheduled staff for Tuesday 9am: 3 staff rostered",
        "7. System determines: Understaffed by 1",
        "8. System generates alert: 'Babies Room Tuesday 9am: 1 additional staff required'",
        "9. Location Manager receives notification",
        "10. Roster view shows red indicator on that time slot"
      ],
      realWorldExample: {
        scenario: "Multi-room childcare centre calculating staffing for typical weekday",
        steps: [
          "Babies Room: 12 children → CEIL(12/4) = 3 staff",
          "Toddlers Room: 14 children → CEIL(14/5) = 3 staff",
          "Preschool Room: 18 children → CEIL(18/10) = 2 staff",
          "Kindergarten Room: 22 children → CEIL(22/11) = 2 staff",
          "Total centre requirement: 10 staff (excluding admin, cook)",
          "System validates 50% qualification rule: Need 5 Diploma-qualified staff",
          "System validates First Aid: Need 4 First Aid certificates (1 per room)"
        ],
        outcome: "Centre knows they need 10 educators with 5 holding Diploma and 4 having First Aid"
      }
    },
    {
      id: "US-DMD-009",
      title: "Identify Staffing Gaps and Overages",
      actors: ["Location Manager", "Rostering Coordinator"],
      description: "As a Location Manager, I want to see where staffing doesn't match demand requirements, so that I can take corrective action before shifts occur.",
      acceptanceCriteria: [
        "Dashboard highlights understaffed time slots in red",
        "Dashboard highlights overstaffed time slots in amber",
        "Can see magnitude of gap (e.g., '2 staff short')",
        "Can see cost impact of overages",
        "Can filter to show only problematic slots",
        "Can click through to roster to make adjustments"
      ],
      businessLogic: [
        "Staffing gap formula: scheduledStaff - requiredStaff",
        "Gap interpretation:",
        "- Negative value: Understaffed (red indicator, critical priority)",
        "- Zero: Optimal (green indicator)",
        "- Positive: Overstaffed (amber indicator, optimization opportunity)",
        "Cost impact calculation:",
        "- Overstaffing cost: gapHours × averageHourlyRate × 1.0 (direct labor cost)",
        "- Understaffing risk: Compliance penalty, parent complaints, staff burnout",
        "Alert thresholds:",
        "- Understaffed any amount: Always alert",
        "- Overstaffed > 15%: Alert (configurable threshold)",
        "Ratio breach severity:",
        "- 1 staff short: Warning",
        "- 2+ staff short: Critical"
      ],
      priority: "critical",
      relatedModules: [
        { module: "Roster", relationship: "Gap indicators shown on roster grid" },
        { module: "Alerts", relationship: "Triggers understaffing alerts" }
      ],
      endToEndJourney: [
        "1. Location Manager opens Week View with gap overlay enabled",
        "2. Sees visual summary: 3 slots understaffed (red), 5 slots overstaffed (amber)",
        "3. Clicks 'Show Problems Only' filter",
        "4. View collapses to show only 8 problematic slots",
        "5. Sorts by severity: Understaffed first",
        "6. Reviews Tuesday 9am Babies Room: 2 staff short",
        "7. Clicks slot to see detail: Required 4, Scheduled 2",
        "8. Notes available staff list showing 3 eligible casual staff",
        "9. Clicks 'Assign Staff' and selects casual from list",
        "10. Gap reduces to 1 staff short, severity changes from Critical to Warning"
      ],
      realWorldExample: {
        scenario: "Friday afternoon has chronic overstaffing costing $500/week",
        steps: [
          "Manager runs 4-week gap analysis for Friday afternoons",
          "Identifies consistent pattern: 2-3 excess staff every Friday 3-6pm",
          "Reviews data: Children average 75% attendance Friday afternoons",
          "Parents often pick up early for weekend activities",
          "Calculates: 3 excess staff × 3 hours × $30/hr = $270/Friday",
          "Takes action: Moves 2 Friday afternoon staff to Monday morning (understaffed)",
          "Result: Balanced staffing, $540/week saved, compliance maintained"
        ],
        outcome: "Data-driven roster optimization eliminates chronic overstaffing"
      }
    },
    {
      id: "US-DMD-010",
      title: "View Optimization Recommendations",
      actors: ["Location Manager", "Area Manager"],
      description: "As a Location Manager, I want to receive optimization recommendations based on demand patterns, so that I can improve efficiency without manual analysis.",
      acceptanceCriteria: [
        "System generates actionable recommendations",
        "Recommendations include estimated cost impact",
        "Can accept/dismiss recommendations with one click",
        "Accepted recommendations update roster automatically",
        "Can view history of applied recommendations",
        "Recommendations prioritized by impact"
      ],
      businessLogic: [
        "Recommendation types:",
        "1. REDUCE_STAFF: When overstaffed > 1 for 3+ consecutive slots",
        "2. ADD_STAFF: When understaffed for any slot",
        "3. SHIFT_REBALANCE: When morning overstaffed and afternoon understaffed",
        "4. CASUAL_CONVERSION: When casual hours exceed 30% of location hours",
        "Cost calculation:",
        "- Savings = excessHours × hourlyRate",
        "- Hourly rate uses weighted average of current staff rates",
        "Recommendation confidence:",
        "- High (>80%): Based on 4+ weeks consistent pattern",
        "- Medium (60-80%): Based on 2-3 weeks pattern",
        "- Low (<60%): Based on forecast only",
        "Auto-dismiss: Recommendations expire 24 hours before affected shift",
        "Impact ordering: Sort by (savings × confidence) descending"
      ],
      priority: "high",
      relatedModules: [
        { module: "Roster", relationship: "Accepting recommendation creates/modifies shifts" },
        { module: "Costing", relationship: "Savings tracked in cost reports" }
      ],
      endToEndJourney: [
        "1. Manager opens Optimization Recommendations panel",
        "2. Sees top recommendation: 'Reduce Friday 3-6pm staffing by 1'",
        "3. Views detail: 'Based on 4-week pattern, Friday afternoons consistently overstaffed. Estimated weekly savings: $90'",
        "4. Sees confidence: High (87%)",
        "5. Reviews affected staff list: 3 options for reduction",
        "6. Clicks 'Accept' on recommendation",
        "7. System prompts: 'Remove Sarah from Friday 3-6pm shift? She has lowest seniority.'",
        "8. Confirms selection",
        "9. Roster updates, savings logged",
        "10. Recommendation moves to 'Applied' history"
      ],
      realWorldExample: {
        scenario: "System identifies shift rebalancing opportunity across rooms",
        steps: [
          "Recommendation: 'Move 1 staff from Preschool to Toddlers, Monday 9am-12pm'",
          "Rationale: Preschool overstaffed by 1, Toddlers understaffed by 1, same time slot",
          "Impact: Achieves compliance in both rooms with no additional cost",
          "Manager reviews eligible staff (qualified for both rooms)",
          "Selects educator with experience in both age groups",
          "Accepts recommendation",
          "System updates shift assignment, both rooms now at optimal staffing"
        ],
        outcome: "Zero-cost optimization achieves compliance through intelligent rebalancing"
      }
    },

    // ============================================================================
    // SECTION 4: FORECASTING & EXTERNAL FACTORS
    // ============================================================================
    {
      id: "US-DMD-011",
      title: "Generate Demand Forecasts Using Historical Data",
      actors: ["System", "Operations Analyst"],
      description: "As the system, I want to generate demand forecasts using historical patterns, so that staffing can be planned proactively for future periods.",
      acceptanceCriteria: [
        "Forecast generated for 7-day rolling window",
        "Multiple forecast methods available (moving avg, weighted, seasonal, ML)",
        "Confidence score provided for each forecast",
        "Forecast automatically adjusts as new data arrives",
        "Can compare forecast accuracy to actual outcomes",
        "Forecast visible on roster planning views"
      ],
      businessLogic: [
        "Forecast methods:",
        "1. Moving Average: Mean of last N weeks for same day/slot",
        "   - Formula: forecast = Σ(historical_values) / count",
        "2. Weighted Average: Recency-weighted mean",
        "   - Formula: forecast = Σ(value × weight) / Σ(weight)",
        "   - Weights: Week 1=1.0, Week 2=0.8, Week 3=0.6, Week 4=0.4",
        "3. Seasonal: Accounts for seasonal patterns (school terms, holidays)",
        "   - Applies seasonal adjustment factor from historical same-period",
        "4. ML Prediction: Machine learning model trained on historical data",
        "   - Inputs: day of week, time slot, season, weather, events",
        "Confidence calculation:",
        "- Based on variance in historical data",
        "- Higher variance = lower confidence",
        "- Formula: confidence = 100 - (stdDev / mean × 100)",
        "Auto-adjustment: When actual differs from forecast by >20%, model reweights",
        "Lookback period: Default 8 weeks, configurable 1-12 weeks"
      ],
      priority: "high",
      relatedModules: [
        { module: "Roster", relationship: "Forecasts inform future roster planning" }
      ],
      endToEndJourney: [
        "1. System runs nightly forecast generation at 2am",
        "2. For each zone, retrieves 8 weeks of historical demand",
        "3. Applies selected method: Weighted Average",
        "4. For Monday 9am slot: Week 1=12, Week 2=14, Week 3=11, Week 4=13",
        "5. Calculates: (12×1.0 + 14×0.8 + 11×0.6 + 13×0.4) / (1.0+0.8+0.6+0.4)",
        "6. Result: 12.5 → rounds to 13 children forecast",
        "7. Calculates confidence: stdDev=1.3, mean=12.5, confidence=90%",
        "8. Stores forecast: { date: 'next Monday', slot: '9am', forecast: 13, confidence: 90 }",
        "9. Location Manager opens next week view, sees forecast values",
        "10. High-confidence forecasts shown in solid color, low-confidence shown striped"
      ],
      realWorldExample: {
        scenario: "Centre preparing roster for school holiday period with no direct historical data",
        steps: [
          "System detects upcoming week is school holidays",
          "No historical data for these exact dates",
          "Falls back to 'same period last year' data",
          "Retrieves July school holidays from previous year",
          "Applies 5% growth factor based on enrollment trends",
          "Generates forecast with 70% confidence (lower due to annual data)",
          "Manager sees warning: 'Forecast based on previous year data'",
          "Manager reviews and applies 10% manual adjustment upward",
          "Combined forecast used for rostering"
        ],
        outcome: "Intelligent fallback to annual data provides usable forecast for unique periods"
      }
    },
    {
      id: "US-DMD-012",
      title: "Integrate External Factors into Demand Forecasts",
      actors: ["Operations Analyst", "System"],
      description: "As an Operations Analyst, I want demand forecasts to account for external factors like weather and holidays, so that predictions are more accurate.",
      acceptanceCriteria: [
        "Can configure weather integration with demand adjustments",
        "Can define public holiday impact on demand",
        "Can mark school holiday periods with multipliers",
        "Can add one-off events with demand impact",
        "External factor adjustments visible on forecast view",
        "Can override automatic adjustments manually"
      ],
      businessLogic: [
        "External factor types and default multipliers:",
        "1. Weather conditions:",
        "   - Clear/Cloudy: 1.0 (no change)",
        "   - Rain: 0.9 (10% reduction - parents WFH, fewer errands)",
        "   - Heavy Rain/Storm: 0.8 (20% reduction)",
        "   - Extreme Heat (>38°C): 0.85 (15% reduction - parents keep kids home)",
        "   - Snow: 0.5 (50% reduction - applies to relevant regions)",
        "2. Public Holidays:",
        "   - Most centres closed: 0.0",
        "   - Emergency services/healthcare: 0.6 (skeleton staff)",
        "3. School Holidays:",
        "   - Childcare typically 1.2 (20% increase - more bookings)",
        "   - Retail: 1.3 (30% increase)",
        "4. Special Events:",
        "   - User-defined multiplier 0.5 to 2.0",
        "Combined calculation: finalDemand = baseForecast × Π(factor multipliers)",
        "Example: Base 20, Rain (0.9), School Holiday (1.2) → 20 × 0.9 × 1.2 = 21.6 → 22"
      ],
      priority: "medium",
      relatedModules: [
        { module: "Forecasting", relationship: "Factors feed into forecast model" },
        { module: "Calendar", relationship: "Holiday calendar provides dates" }
      ],
      endToEndJourney: [
        "1. System detects weather forecast for next Tuesday: Heavy Rain",
        "2. Retrieves weather adjustment rule: Heavy Rain = 0.8 multiplier",
        "3. Applies to base forecast: 25 children → 25 × 0.8 = 20 children",
        "4. Also detects Tuesday is school holiday start",
        "5. Retrieves school holiday rule: 1.2 multiplier",
        "6. Applies combined: 25 × 0.8 × 1.2 = 24 children",
        "7. Forecast view shows factors: '25 base → 24 adjusted (Rain ↓, School Hol ↑)'",
        "8. Manager reviews and agrees with adjustment",
        "9. Required staff recalculated based on adjusted forecast",
        "10. Alert generated: 'Staff requirement changed from 7 to 6 for Tuesday'"
      ],
      realWorldExample: {
        scenario: "Retail store preparing for Boxing Day sales",
        steps: [
          "Analyst creates event: 'Boxing Day Sale' for December 26",
          "Sets demand multiplier: 2.5 (150% increase expected)",
          "Applies to all departments",
          "System detects public holiday: Boxing Day = 0.0 (closed)",
          "But store is open for sale, overrides holiday closure",
          "Creates exception: 'Open 8am-6pm for Boxing Day Sale'",
          "Combined forecast: Normal 100 customers → 250 customers",
          "Staff requirement jumps from 8 to 18 for the day",
          "System generates bulk open shifts for additional staff"
        ],
        outcome: "Event-driven demand spike properly captured with appropriate staffing escalation"
      }
    },

    // ============================================================================
    // SECTION 5: ALERTS & NOTIFICATIONS
    // ============================================================================
    {
      id: "US-DMD-013",
      title: "Receive Understaffing Alerts",
      actors: ["Location Manager", "Area Manager"],
      description: "As a Location Manager, I want to receive alerts when staffing falls below demand requirements, so that I can take immediate corrective action.",
      acceptanceCriteria: [
        "Alert generated when scheduled staff < required staff",
        "Alert shows affected zone, date, time slot, and magnitude",
        "Alert sent via in-app notification and email/SMS (configurable)",
        "Can acknowledge alert to stop repeat notifications",
        "Can snooze alert for specified period",
        "Alert history viewable for audit purposes"
      ],
      businessLogic: [
        "Alert trigger conditions:",
        "- scheduledStaff < requiredStaff for any time slot",
        "- Triggered 72hrs, 24hrs, and 2hrs before shift (configurable)",
        "Alert severity mapping:",
        "- Gap of 1: Warning (amber)",
        "- Gap of 2+: Critical (red)",
        "- Ratio breach: Critical (red) - regulatory requirement",
        "Notification channels:",
        "- In-app: Always sent",
        "- Email: Default on for Warning and Critical",
        "- SMS: Default on for Critical only",
        "- Push notification: If mobile app installed",
        "Alert content template:",
        "- Title: 'Staffing Alert: {Zone} {Date} {TimeSlot}'",
        "- Body: 'Scheduled: {scheduled}, Required: {required}. {gap} staff needed.'",
        "- Action buttons: 'View Roster', 'Find Available Staff', 'Snooze'",
        "Snooze options: 1hr, 4hrs, until tomorrow, until resolved",
        "Auto-resolve: Alert clears when gap is filled"
      ],
      priority: "critical",
      relatedModules: [
        { module: "Notifications", relationship: "Uses notification service for delivery" },
        { module: "Roster", relationship: "Links to roster for resolution" }
      ],
      endToEndJourney: [
        "1. System detects understaffing for tomorrow 9am Toddlers Room",
        "2. Gap: Required 4, Scheduled 2 (2 staff short)",
        "3. Severity: Critical (gap >= 2)",
        "4. Sends in-app notification to Location Manager",
        "5. Sends email with subject: 'CRITICAL: Staffing Alert - Toddlers 9am Tomorrow'",
        "6. Sends SMS: 'Urgent: 2 staff short for Toddlers 9am tomorrow. Check app.'",
        "7. Manager receives push notification on mobile",
        "8. Opens app, sees alert dashboard with 1 critical alert",
        "9. Clicks 'Find Available Staff'",
        "10. System shows 4 casual staff available for that slot",
        "11. Manager assigns 2 casual staff",
        "12. Alert auto-resolves, notification sent: 'Alert Resolved'"
      ],
      realWorldExample: {
        scenario: "Flu outbreak causes multiple staff sick calls",
        steps: [
          "Monday 6am: Staff member A calls in sick",
          "System updates roster: Babies Room now understaffed 9am-3pm",
          "Alert generated: Gap of 1, Warning severity",
          "Manager receives notification, acknowledges",
          "Monday 7am: Staff member B also calls in sick (same room)",
          "Alert escalates: Gap now 2, Critical severity",
          "SMS sent immediately to Manager and Area Manager",
          "Manager broadcasts open shift to casual pool",
          "Casual staff C claims shift within 30 minutes",
          "Gap reduces to 1, severity downgrades to Warning",
          "Manager contacts agency for additional coverage"
        ],
        outcome: "Rapid escalation ensures critical understaffing addressed before children arrive"
      }
    },
    {
      id: "US-DMD-014",
      title: "Receive Demand Spike Alerts",
      actors: ["Location Manager", "Rostering Coordinator"],
      description: "As a Location Manager, I want to be alerted when demand suddenly increases beyond forecast, so that I can arrange additional staffing.",
      acceptanceCriteria: [
        "Alert when actual demand exceeds forecast by configurable threshold",
        "Alert shows original forecast, current demand, and percentage increase",
        "Recommendations provided for addressing spike",
        "Can view historical spike patterns",
        "Alert configurable by zone and severity"
      ],
      businessLogic: [
        "Spike detection formula: (actualDemand - forecastDemand) / forecastDemand > threshold",
        "Default threshold: 15% (configurable 10-50%)",
        "Example: Forecast 20, Actual 25 → (25-20)/20 = 25% → Triggers alert",
        "Alert timing: Real-time when integration data updates, or on manual entry",
        "Recommendation engine:",
        "- If spike > 15%: Suggest extending current staff hours",
        "- If spike > 30%: Suggest calling in additional staff",
        "- If spike > 50%: Escalate to Area Manager",
        "Historical pattern check:",
        "- If spike matches recurring pattern, suggest creating schedule pattern",
        "- Example: 'Demand spike detected every first Monday of month'"
      ],
      priority: "medium",
      relatedModules: [
        { module: "Forecasting", relationship: "Compares to forecast values" }
      ],
      endToEndJourney: [
        "1. Booking system syncs: 8 new casual bookings for tomorrow",
        "2. Previous forecast: 15 children, New actual: 23 children",
        "3. Spike calculation: (23-15)/15 = 53% increase",
        "4. Exceeds 15% threshold → Alert generated",
        "5. Severity: High (>50% spike)",
        "6. Alert message: 'Demand Spike: Preschool Room tomorrow. Forecast 15 → Actual 23 (+53%)'",
        "7. Recommendation: 'Consider calling in 1 additional staff'",
        "8. Manager receives notification",
        "9. Reviews booking details: Local school booked group excursion",
        "10. Adds note: 'St. Mary's Primary visit'",
        "11. Creates schedule pattern: 'School Excursion Days' for future tracking"
      ],
      realWorldExample: {
        scenario: "Retail store website promotion drives unexpected foot traffic",
        steps: [
          "POS integration shows 40% more customers than forecast by 11am",
          "System generates demand spike alert to Store Manager",
          "Recommendation: 'Call in 2 additional floor staff'",
          "Manager checks staff availability app",
          "Finds 3 staff available for afternoon shift extension",
          "Calls in 2 staff for 12pm start",
          "Updates demand forecast for remainder of day",
          "Logs event: 'Website 25% off promotion' for future reference",
          "System learns: Future promotions should use 1.4x multiplier"
        ],
        outcome: "Real-time demand spike detection enables same-day staffing adjustment"
      }
    }
  ],

  // ============================================================================
  // TABLE SPECIFICATIONS
  // ============================================================================
  tableSpecs: [
    {
      name: "demand_entries",
      schema: "demand",
      description: "Stores demand data from all sources (manual, integration, forecast)",
      fields: [
        { name: "id", type: "uuid", mandatory: true, description: "Primary key", indexed: true },
        { name: "tenant_id", type: "uuid", mandatory: true, description: "Tenant identifier", foreignKey: "tenants.id", indexed: true },
        { name: "location_id", type: "uuid", mandatory: true, description: "Location/centre identifier", foreignKey: "locations.id", indexed: true },
        { name: "zone_id", type: "uuid", mandatory: true, description: "Zone/room/department identifier", foreignKey: "zones.id", indexed: true },
        { name: "date", type: "date", mandatory: true, description: "Date for demand entry", indexed: true },
        { name: "time_slot", type: "varchar(20)", mandatory: true, description: "Time slot (e.g., '09:00-12:00')" },
        { name: "expected_demand", type: "integer", mandatory: true, description: "Expected demand count", validation: "value >= 0" },
        { name: "actual_demand", type: "integer", mandatory: false, description: "Actual observed demand" },
        { name: "source", type: "varchar(20)", mandatory: true, description: "Data source: manual, integration, historical, forecast" },
        { name: "confidence", type: "decimal(5,2)", mandatory: false, description: "Forecast confidence 0-100" },
        { name: "notes", type: "text", mandatory: false, description: "User notes or system-generated context" },
        { name: "created_at", type: "timestamptz", mandatory: true, description: "Record creation timestamp", defaultValue: "now()" },
        { name: "updated_at", type: "timestamptz", mandatory: true, description: "Last update timestamp" },
        { name: "created_by", type: "uuid", mandatory: true, description: "User who created entry", foreignKey: "users.id" }
      ],
      indexes: ["idx_demand_location_date ON (location_id, date)", "idx_demand_zone_date ON (zone_id, date)"]
    },
    {
      name: "demand_thresholds",
      schema: "demand",
      description: "Configures demand levels and corresponding staffing requirements",
      fields: [
        { name: "id", type: "uuid", mandatory: true, description: "Primary key", indexed: true },
        { name: "tenant_id", type: "uuid", mandatory: true, description: "Tenant identifier", foreignKey: "tenants.id" },
        { name: "name", type: "varchar(50)", mandatory: true, description: "Threshold name (e.g., 'High Demand')" },
        { name: "min_demand", type: "integer", mandatory: true, description: "Minimum demand for this threshold", validation: "value >= 0" },
        { name: "max_demand", type: "integer", mandatory: false, description: "Maximum demand (null for unbounded)" },
        { name: "required_staff", type: "integer", mandatory: true, description: "Staff required at this level", validation: "value >= 1" },
        { name: "color", type: "varchar(7)", mandatory: true, description: "Hex color code for display", defaultValue: "'#3b82f6'" },
        { name: "alert_level", type: "varchar(20)", mandatory: true, description: "Alert severity: info, warning, critical" },
        { name: "display_order", type: "integer", mandatory: true, description: "Order for display in UI" }
      ]
    },
    {
      name: "schedule_patterns",
      schema: "demand",
      description: "Recurring patterns that affect demand (e.g., morning rush)",
      fields: [
        { name: "id", type: "uuid", mandatory: true, description: "Primary key", indexed: true },
        { name: "tenant_id", type: "uuid", mandatory: true, description: "Tenant identifier", foreignKey: "tenants.id" },
        { name: "location_id", type: "uuid", mandatory: false, description: "Location (null for all locations)", foreignKey: "locations.id" },
        { name: "name", type: "varchar(100)", mandatory: true, description: "Pattern name" },
        { name: "days_of_week", type: "integer[]", mandatory: true, description: "Array of days (0=Sun, 6=Sat)" },
        { name: "start_time", type: "time", mandatory: true, description: "Pattern start time" },
        { name: "end_time", type: "time", mandatory: true, description: "Pattern end time" },
        { name: "demand_multiplier", type: "decimal(3,2)", mandatory: true, description: "Multiplier (e.g., 1.5 = 50% increase)", validation: "value between 0.5 and 3.0" },
        { name: "color", type: "varchar(7)", mandatory: true, description: "Color for chart display" },
        { name: "is_active", type: "boolean", mandatory: true, description: "Whether pattern is currently active", defaultValue: "true" }
      ]
    },
    {
      name: "external_factors",
      schema: "demand",
      description: "External events and conditions affecting demand",
      fields: [
        { name: "id", type: "uuid", mandatory: true, description: "Primary key", indexed: true },
        { name: "tenant_id", type: "uuid", mandatory: true, description: "Tenant identifier", foreignKey: "tenants.id" },
        { name: "type", type: "varchar(30)", mandatory: true, description: "Factor type: weather, public_holiday, school_holidays, event, custom" },
        { name: "name", type: "varchar(100)", mandatory: true, description: "Factor name/description" },
        { name: "start_date", type: "date", mandatory: true, description: "Factor start date" },
        { name: "end_date", type: "date", mandatory: true, description: "Factor end date" },
        { name: "demand_multiplier", type: "decimal(3,2)", mandatory: true, description: "Impact multiplier" },
        { name: "affected_locations", type: "uuid[]", mandatory: false, description: "Specific locations (null = all)" },
        { name: "notes", type: "text", mandatory: false, description: "Additional context" },
        { name: "source", type: "varchar(20)", mandatory: true, description: "Source: automatic, manual" }
      ],
      indexes: ["idx_external_factors_dates ON (start_date, end_date)"]
    },
    {
      name: "demand_forecasts",
      schema: "demand",
      description: "System-generated demand forecasts",
      fields: [
        { name: "id", type: "uuid", mandatory: true, description: "Primary key", indexed: true },
        { name: "tenant_id", type: "uuid", mandatory: true, description: "Tenant identifier", foreignKey: "tenants.id" },
        { name: "location_id", type: "uuid", mandatory: true, description: "Location identifier", foreignKey: "locations.id" },
        { name: "zone_id", type: "uuid", mandatory: true, description: "Zone identifier", foreignKey: "zones.id" },
        { name: "date", type: "date", mandatory: true, description: "Forecast date" },
        { name: "time_slot", type: "varchar(20)", mandatory: true, description: "Time slot" },
        { name: "baseline_demand", type: "integer", mandatory: true, description: "Base forecast before adjustments" },
        { name: "adjusted_demand", type: "integer", mandatory: true, description: "Final forecast after all factors" },
        { name: "method", type: "varchar(30)", mandatory: true, description: "Forecast method used" },
        { name: "confidence", type: "decimal(5,2)", mandatory: true, description: "Confidence score 0-100" },
        { name: "factors_applied", type: "jsonb", mandatory: false, description: "Array of factors and multipliers applied" },
        { name: "generated_at", type: "timestamptz", mandatory: true, description: "When forecast was generated" }
      ],
      indexes: ["idx_forecasts_location_date ON (location_id, date)"]
    },
    {
      name: "demand_alerts",
      schema: "demand",
      description: "Demand-related alerts and notifications",
      fields: [
        { name: "id", type: "uuid", mandatory: true, description: "Primary key", indexed: true },
        { name: "tenant_id", type: "uuid", mandatory: true, description: "Tenant identifier", foreignKey: "tenants.id" },
        { name: "location_id", type: "uuid", mandatory: true, description: "Location identifier", foreignKey: "locations.id" },
        { name: "zone_id", type: "uuid", mandatory: false, description: "Zone identifier", foreignKey: "zones.id" },
        { name: "alert_type", type: "varchar(30)", mandatory: true, description: "Type: understaffing, overstaffing, demand_spike, forecast_accuracy" },
        { name: "severity", type: "varchar(20)", mandatory: true, description: "Severity: info, warning, critical" },
        { name: "date", type: "date", mandatory: true, description: "Affected date" },
        { name: "time_slot", type: "varchar(20)", mandatory: false, description: "Affected time slot" },
        { name: "message", type: "text", mandatory: true, description: "Alert message content" },
        { name: "details", type: "jsonb", mandatory: false, description: "Additional alert data" },
        { name: "status", type: "varchar(20)", mandatory: true, description: "Status: active, acknowledged, resolved, snoozed" },
        { name: "acknowledged_by", type: "uuid", mandatory: false, description: "User who acknowledged", foreignKey: "users.id" },
        { name: "acknowledged_at", type: "timestamptz", mandatory: false, description: "When acknowledged" },
        { name: "snoozed_until", type: "timestamptz", mandatory: false, description: "Snooze expiry time" },
        { name: "created_at", type: "timestamptz", mandatory: true, description: "Alert creation time" }
      ],
      indexes: ["idx_alerts_status ON (status, created_at)"]
    },
    {
      name: "demand_settings",
      schema: "demand",
      description: "Master demand configuration settings per tenant/location",
      fields: [
        { name: "id", type: "uuid", mandatory: true, description: "Primary key", indexed: true },
        { name: "tenant_id", type: "uuid", mandatory: true, description: "Tenant identifier", foreignKey: "tenants.id" },
        { name: "location_id", type: "uuid", mandatory: false, description: "Location (null for tenant default)", foreignKey: "locations.id" },
        { name: "enabled", type: "boolean", mandatory: true, description: "Whether demand tracking enabled", defaultValue: "true" },
        { name: "industry_type", type: "varchar(30)", mandatory: true, description: "Industry template type" },
        { name: "granularity", type: "varchar(10)", mandatory: true, description: "Time slot granularity", defaultValue: "'30min'" },
        { name: "timezone", type: "varchar(50)", mandatory: true, description: "IANA timezone" },
        { name: "terminology", type: "jsonb", mandatory: true, description: "Industry terminology settings" },
        { name: "operating_hours", type: "jsonb", mandatory: true, description: "Operating hours per day" },
        { name: "forecasting", type: "jsonb", mandatory: true, description: "Forecasting configuration" },
        { name: "alerts", type: "jsonb", mandatory: true, description: "Alert configuration" },
        { name: "display", type: "jsonb", mandatory: true, description: "Display preferences" }
      ]
    }
  ],

  // ============================================================================
  // INTEGRATIONS
  // ============================================================================
  integrations: [
    { system: "Xplor", type: "Childcare Booking", description: "Sync child bookings and attendance from Xplor childcare management system" },
    { system: "QikKids", type: "Childcare Booking", description: "Sync enrolments and sign-in/sign-out from QikKids" },
    { system: "Kidsoft", type: "Childcare Booking", description: "Import bookings and room occupancy from Kidsoft" },
    { system: "OpenWeather", type: "Weather", description: "7-day weather forecast for demand adjustments" },
    { system: "Public Holidays API", type: "Calendar", description: "Australian public holiday calendar" },
    { system: "School Terms API", type: "Calendar", description: "State-based school term and holiday dates" },
    { system: "Shopify POS", type: "Retail", description: "Real-time foot traffic and sales data" },
    { system: "OpenTable", type: "Hospitality", description: "Restaurant reservations and covers" },
    { system: "Genesys Cloud", type: "Call Centre", description: "Call volume forecasts and queue metrics" }
  ],

  // ============================================================================
  // BUSINESS RULES
  // ============================================================================
  businessRules: [
    { id: "BR-DMD-001", rule: "Required staff MUST be calculated as CEIL(bookedDemand / industryRatio) unless overridden by threshold configuration", rationale: "Ensures adequate staffing to meet regulatory ratios at all demand levels" },
    { id: "BR-DMD-002", rule: "Manual demand entries MUST take priority over all other data sources (integration, historical, forecast)", rationale: "Allows managers to override system predictions for known events" },
    { id: "BR-DMD-003", rule: "Demand forecasts MUST be regenerated daily with 7-day rolling window", rationale: "Ensures forecasts reflect latest data and booking changes" },
    { id: "BR-DMD-004", rule: "When multiple schedule patterns overlap for same time slot, system MUST use MAX(multipliers) not SUM", rationale: "Prevents double-counting demand impacts" },
    { id: "BR-DMD-005", rule: "Understaffing alerts MUST be generated immediately when scheduled < required, regardless of time until shift", rationale: "Early warning enables proactive resolution" },
    { id: "BR-DMD-006", rule: "Attendance rate MUST be calculated from minimum 2 weeks historical data before being used for predictions", rationale: "Prevents inaccurate predictions from insufficient data" },
    { id: "BR-DMD-007", rule: "External factors MUST be applied multiplicatively (base × factor1 × factor2) not additively", rationale: "Reflects compounding nature of demand impacts" },
    { id: "BR-DMD-008", rule: "Demand data older than 90 days MUST be aggregated to daily granularity to optimize storage", rationale: "Balances historical analysis needs with storage efficiency" },
    { id: "BR-DMD-009", rule: "Forecast confidence below 60% MUST be flagged with visual indicator and excluded from auto-rostering", rationale: "Prevents unreliable forecasts from driving poor staffing decisions" },
    { id: "BR-DMD-010", rule: "Weekend demand MUST default to zero for industries with typical Mon-Fri operation unless explicitly configured", rationale: "Prevents false alerts for industries closed on weekends" },
    { id: "BR-DMD-011", rule: "Cost savings calculations MUST use weighted average hourly rate of currently scheduled staff, not default rate", rationale: "Ensures accurate cost impact estimates for optimization recommendations" },
    { id: "BR-DMD-012", rule: "Demand spike alerts MUST only trigger when actual exceeds forecast by threshold AND absolute change exceeds 3 units", rationale: "Prevents noise alerts from small percentage changes on low base numbers" }
  ]
};
