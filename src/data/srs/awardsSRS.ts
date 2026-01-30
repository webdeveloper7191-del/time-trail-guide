// Awards Module - Software Requirements Specification

import { ModuleSRS } from './rosterSRS';

export const awardsSRS: ModuleSRS = {
  moduleName: "Awards & Pay Compliance",
  version: "1.0.0",
  lastUpdated: "2026-01-30",
  overview: `The Awards & Pay Compliance module provides comprehensive management of Australian employment awards, enterprise bargaining agreements (EBAs), and pay rate calculations. It ensures organizations remain compliant with Fair Work Commission requirements while supporting complex pay scenarios including penalty rates, allowances, overtime calculations, and shift differentials. The system automatically tracks award updates and provides tools for customization while maintaining compliance audit trails.`,
  
  objectives: [
    "Ensure 100% compliance with Australian Modern Awards and Fair Work requirements",
    "Automate complex pay calculations including penalties, allowances, and overtime",
    "Reduce payroll errors by 95% through automated rate application",
    "Provide real-time visibility into pay compliance status",
    "Support Enterprise Bargaining Agreements alongside Modern Awards",
    "Enable custom rate overrides with full audit trail",
    "Automatically integrate Fair Work Commission rate updates"
  ],

  scope: [
    "Australian Modern Award configuration and management",
    "Classification levels and pay rate schedules",
    "Penalty rate calculations (weekend, public holiday, evening, night)",
    "Allowance management (meal, travel, uniform, first aid, etc.)",
    "Overtime calculation with configurable thresholds",
    "Enterprise Bargaining Agreement support",
    "Custom rate override management",
    "Fair Work Commission update integration",
    "Compliance auditing and reporting",
    "Pay simulation and what-if analysis"
  ],

  outOfScope: [
    "Payroll processing and payment execution",
    "Tax calculations and superannuation",
    "Single Touch Payroll (STP) reporting",
    "Workers compensation insurance",
    "Termination and redundancy calculations"
  ],

  actors: [
    {
      name: "Payroll Administrator",
      description: "Responsible for accurate pay processing and compliance maintenance",
      permissions: [
        "View and configure award settings",
        "Apply rate overrides with approval",
        "Run compliance reports",
        "Simulate pay scenarios",
        "Review and apply FWC updates"
      ]
    },
    {
      name: "HR Manager",
      description: "Oversees employment conditions and award interpretation",
      permissions: [
        "All Payroll Administrator permissions",
        "Approve custom rate overrides",
        "Configure allowance rules",
        "Manage EBA settings",
        "Access audit trails"
      ]
    },
    {
      name: "Finance Director",
      description: "Executive oversight of labour costs and compliance risk",
      permissions: [
        "View compliance dashboards",
        "Access cost impact reports",
        "Approve significant rate changes",
        "Review underpayment risk assessments"
      ]
    },
    {
      name: "Centre Manager",
      description: "Operational manager who needs visibility into staff pay conditions",
      permissions: [
        "View applicable awards for their staff",
        "View allowance eligibility",
        "Access pay rate information for budgeting",
        "View penalty rate calendars"
      ]
    },
    {
      name: "Employee",
      description: "Staff member who needs to understand their pay conditions",
      permissions: [
        "View own award classification",
        "View applicable pay rates and penalties",
        "View allowance entitlements",
        "Access pay breakdown for shifts"
      ]
    },
    {
      name: "System Administrator",
      description: "Technical administrator for system configuration",
      permissions: [
        "Import/export award data",
        "Configure integration settings",
        "Manage audit log retention",
        "Configure rule engine parameters"
      ]
    }
  ],

  functionalRequirements: [
    { id: "FR-AWD-001", category: "Award Management", requirement: "System shall maintain a library of Australian Modern Awards with classifications", priority: "Critical" },
    { id: "FR-AWD-002", category: "Award Management", requirement: "System shall support multiple effective-dated rate schedules per classification", priority: "Critical" },
    { id: "FR-AWD-003", category: "Award Management", requirement: "System shall allow enabling/disabling specific awards per organization", priority: "High" },
    { id: "FR-AWD-004", category: "Classification", requirement: "System shall define classification levels with minimum qualifications and experience", priority: "High" },
    { id: "FR-AWD-005", category: "Classification", requirement: "System shall support employment type variations (full-time, part-time, casual)", priority: "Critical" },
    { id: "FR-AWD-006", category: "Classification", requirement: "System shall calculate casual loading automatically (25%)", priority: "Critical" },
    { id: "FR-AWD-007", category: "Pay Rates", requirement: "System shall store and calculate hourly, weekly, and annual rates", priority: "Critical" },
    { id: "FR-AWD-008", category: "Pay Rates", requirement: "System shall apply minimum wage floor regardless of classification", priority: "Critical" },
    { id: "FR-AWD-009", category: "Penalty Rates", requirement: "System shall calculate Saturday penalty rates per award definition", priority: "Critical" },
    { id: "FR-AWD-010", category: "Penalty Rates", requirement: "System shall calculate Sunday penalty rates per award definition", priority: "Critical" },
    { id: "FR-AWD-011", category: "Penalty Rates", requirement: "System shall calculate public holiday penalty rates (typically 250%)", priority: "Critical" },
    { id: "FR-AWD-012", category: "Penalty Rates", requirement: "System shall calculate evening shift loading (after 6pm)", priority: "High" },
    { id: "FR-AWD-013", category: "Penalty Rates", requirement: "System shall calculate night shift loading (after 10pm)", priority: "High" },
    { id: "FR-AWD-014", category: "Overtime", requirement: "System shall calculate daily overtime thresholds (typically 8 or 10 hours)", priority: "Critical" },
    { id: "FR-AWD-015", category: "Overtime", requirement: "System shall calculate weekly overtime thresholds (typically 38 hours)", priority: "Critical" },
    { id: "FR-AWD-016", category: "Overtime", requirement: "System shall apply tiered overtime rates (1.5x first 2 hours, 2x thereafter)", priority: "Critical" },
    { id: "FR-AWD-017", category: "Allowances", requirement: "System shall manage allowance types (meal, travel, uniform, etc.)", priority: "High" },
    { id: "FR-AWD-018", category: "Allowances", requirement: "System shall support allowance triggers (shift duration, qualification, etc.)", priority: "High" },
    { id: "FR-AWD-019", category: "Allowances", requirement: "System shall handle allowance stacking and mutual exclusion rules", priority: "Medium" },
    { id: "FR-AWD-020", category: "EBA", requirement: "System shall support Enterprise Bargaining Agreements with custom terms", priority: "High" },
    { id: "FR-AWD-021", category: "EBA", requirement: "System shall allow EBA rates to override award minimums", priority: "High" },
    { id: "FR-AWD-022", category: "Overrides", requirement: "System shall allow custom rate overrides per staff member", priority: "Medium" },
    { id: "FR-AWD-023", category: "Overrides", requirement: "System shall maintain audit trail for all rate overrides", priority: "Critical" },
    { id: "FR-AWD-024", category: "FWC Updates", requirement: "System shall receive and display Fair Work Commission rate updates", priority: "High" },
    { id: "FR-AWD-025", category: "FWC Updates", requirement: "System shall allow scheduled application of rate updates", priority: "High" },
    { id: "FR-AWD-026", category: "Compliance", requirement: "System shall flag potential underpayment scenarios", priority: "Critical" },
    { id: "FR-AWD-027", category: "Compliance", requirement: "System shall generate compliance reports for audit", priority: "High" },
    { id: "FR-AWD-028", category: "Simulation", requirement: "System shall provide pay simulation tool for what-if analysis", priority: "Medium" },
    { id: "FR-AWD-029", category: "Integration", requirement: "System shall provide calculated rates to Roster module for costing", priority: "Critical" },
    { id: "FR-AWD-030", category: "Integration", requirement: "System shall export rate data in payroll system compatible format", priority: "High" }
  ],

  nonFunctionalRequirements: [
    { id: "NFR-AWD-001", category: "Performance", requirement: "Rate calculation shall complete within 100ms per shift" },
    { id: "NFR-AWD-002", category: "Performance", requirement: "Bulk rate simulation for 1000 shifts shall complete within 5 seconds" },
    { id: "NFR-AWD-003", category: "Accuracy", requirement: "All calculations shall be accurate to 4 decimal places" },
    { id: "NFR-AWD-004", category: "Audit", requirement: "All rate changes shall be logged with user, timestamp, old value, and new value" },
    { id: "NFR-AWD-005", category: "Availability", requirement: "Award data shall be available 99.9% during business hours" },
    { id: "NFR-AWD-006", category: "Security", requirement: "Pay rate data access shall be restricted by role-based permissions" },
    { id: "NFR-AWD-007", category: "Compliance", requirement: "System shall maintain 7-year retention of rate history for audit" },
    { id: "NFR-AWD-008", category: "Usability", requirement: "Rate override interface shall require maximum 3 clicks to apply" }
  ],

  userStories: [
    {
      id: "US-AWD-001",
      title: "Configure Staff Award Classification",
      actors: ["Payroll Administrator", "HR Manager"],
      description: "As a Payroll Administrator, I want to assign the correct award and classification to each staff member, so that their pay is calculated correctly according to their employment conditions.",
      acceptanceCriteria: [
        "Can search and select from available Modern Awards",
        "Can select classification level within the award",
        "Can specify employment type (full-time, part-time, casual)",
        "System displays applicable hourly and weekly rates",
        "Can set effective date for the classification",
        "History of classification changes is maintained"
      ],
      businessLogic: [
        "Classification determines base pay rate from award schedule",
        "Casual employees receive 25% loading on base rate",
        "Part-time employees receive pro-rata entitlements",
        "Higher classifications require specified qualifications",
        "Effective date cannot be backdated more than 28 days without approval",
        "Classification change triggers recalculation of any pending timesheets"
      ],
      priority: "critical",
      relatedModules: [
        { module: "Roster", relationship: "Classification determines shift cost calculations" },
        { module: "Performance", relationship: "Classification progression may link to performance outcomes" }
      ],
      endToEndJourney: [
        "1. HR Manager receives notification of new employee starting",
        "2. Opens Staff Profile > Pay Conditions section",
        "3. Clicks 'Configure Award' button",
        "4. Searches for 'Children's Services Award'",
        "5. Selects 'Children's Services Award 2010 [MA000120]'",
        "6. Browses classification levels, sees employee qualifications",
        "7. Employee has Diploma - selects 'Level 4.1 - Qualified Educator'",
        "8. Selects employment type: Part-time",
        "9. System shows: Base rate $32.47/hr, 25 hours/week",
        "10. Sets effective date: Employee start date",
        "11. Clicks 'Save Award Assignment'",
        "12. Confirmation shows classification applied",
        "13. Staff profile updates with award badge and rate"
      ],
      realWorldExample: {
        scenario: "Maria joins Sunshine Childcare as a qualified Diploma educator on a permanent part-time contract (25 hours/week).",
        steps: [
          "HR Manager Sarah opens Maria's new employee profile",
          "Goes to Pay Conditions and clicks 'Set Up Award'",
          "Searches for 'Children's Services' and selects the MA000120 award",
          "Reviews the classification table",
          "Maria has a Diploma of Early Childhood Education",
          "Sarah selects 'Level 4.1 - Qualified Educator with Diploma'",
          "Chooses 'Part-time' employment type",
          "System calculates: $32.47/hr base rate",
          "Weekly rate: $811.75 (25 hours at base)",
          "Sarah sets effective date as Maria's start date: 15 February 2026",
          "Saves the configuration",
          "Maria's profile now shows the award classification",
          "When Maria works her first shift, the correct rate is applied automatically"
        ],
        outcome: "Maria's employment conditions are correctly configured, ensuring all future pay calculations comply with the Children's Services Award."
      }
    },
    {
      id: "US-AWD-002",
      title: "Calculate Shift Pay with Penalties",
      actors: ["Payroll Administrator"],
      description: "As a Payroll Administrator, I want the system to automatically calculate the correct pay for each shift including all applicable penalties, so that staff are paid accurately for weekend and evening work.",
      acceptanceCriteria: [
        "System identifies day type (weekday, Saturday, Sunday, public holiday)",
        "System identifies time-of-day loadings (evening, night, early morning)",
        "Correct penalty multiplier is applied based on award rules",
        "Multiple penalties can stack where applicable",
        "Breakdown shows base rate and each penalty applied",
        "Total shift cost is calculated and displayed"
      ],
      businessLogic: [
        "Saturday penalty: typically 150% (1.5x base)",
        "Sunday penalty: typically 175% for permanent, 200% for casual",
        "Public holiday penalty: typically 250% (2.5x base)",
        "Evening loading: additional 10% after 6pm",
        "Night shift loading: additional 15% after 10pm",
        "Early morning loading: additional 10% before 6am",
        "Penalties compound multiplicatively for casual employees",
        "Minimum engagement periods may apply (e.g., 3 hours casual)"
      ],
      priority: "critical",
      relatedModules: [
        { module: "Roster", relationship: "Shift times determine which penalties apply" },
        { module: "Timesheet", relationship: "Actual worked hours used for final pay calculation" }
      ],
      endToEndJourney: [
        "1. Roster shows shift: Sunday 8am-4pm, Educator Level 3.1",
        "2. System identifies: Sunday shift, Children's Services Award",
        "3. Retrieves base rate: $28.73/hour",
        "4. Applies Sunday penalty rate: 175% = $50.28/hour",
        "5. Calculates 8 hours at penalty rate",
        "6. Adds meal break deduction (30 min unpaid)",
        "7. Total worked hours: 7.5 hours",
        "8. Gross pay: 7.5 × $50.28 = $377.10",
        "9. Cost breakdown displayed in Roster view",
        "10. Budget variance updated with actual cost"
      ],
      realWorldExample: {
        scenario: "Tom works a Sunday shift covering for a colleague on leave. He's a permanent part-time Level 3.1 Educator.",
        steps: [
          "Tom's shift runs Sunday 8:00 AM to 4:00 PM",
          "System identifies this is a Sunday shift",
          "Retrieves Tom's classification: Level 3.1, base rate $28.73/hr",
          "Looks up Sunday penalty for permanent employees: 175%",
          "Calculates penalty rate: $28.73 × 1.75 = $50.28/hr",
          "Shift duration: 8 hours with 30-min unpaid break = 7.5 hours worked",
          "Gross pay for shift: 7.5 × $50.28 = $377.10",
          "System generates pay breakdown:",
          "  - Base hours: 7.5",
          "  - Base rate: $28.73",
          "  - Sunday loading: 75%",
          "  - Penalty rate: $50.28",
          "  - Total: $377.10",
          "This appears on Tom's timesheet and in payroll export"
        ],
        outcome: "Tom receives correct Sunday penalty rates. The centre's budget shows accurate labour cost for weekend coverage."
      }
    },
    {
      id: "US-AWD-003",
      title: "Apply Fair Work Commission Rate Update",
      actors: ["Payroll Administrator", "HR Manager"],
      description: "As a Payroll Administrator, I want to receive and apply annual Fair Work Commission wage increases, so that our pay rates remain compliant with minimum wage requirements.",
      acceptanceCriteria: [
        "System displays notification when FWC update is available",
        "Update shows summary of rate changes (percentage and absolute)",
        "Can preview impact on current staff pay rates",
        "Can schedule update to apply on effective date",
        "Update can be applied in bulk to all affected classifications",
        "Audit trail records update application with user and timestamp"
      ],
      businessLogic: [
        "FWC Annual Wage Review typically effective 1 July each year",
        "Percentage increase applies to all classification levels",
        "New rates must not fall below National Minimum Wage",
        "Casual loading calculated on new base rate",
        "Existing rate overrides may need review after update",
        "Staff on higher rates than award are not affected"
      ],
      priority: "high",
      relatedModules: [
        { module: "Payroll Integration", relationship: "New rates exported to payroll system" },
        { module: "Budgeting", relationship: "Budget forecasts updated with new labour costs" }
      ],
      endToEndJourney: [
        "1. June: System receives FWC decision notification",
        "2. Alert appears: 'Children's Services Award update available'",
        "3. Payroll Admin opens FWC Updates section",
        "4. Sees: '3.5% increase effective 1 July 2026'",
        "5. Clicks 'View Details' to see classification-by-classification changes",
        "6. Level 3.1: $28.73 → $29.74 (+$1.01)",
        "7. Level 4.1: $32.47 → $33.61 (+$1.14)",
        "8. Clicks 'Preview Impact' to see cost implications",
        "9. Shows: 45 staff affected, annual cost increase: $47,250",
        "10. HR Manager approves the update",
        "11. Clicks 'Schedule Update for 1 July 2026'",
        "12. Confirmation: Update scheduled",
        "13. On 1 July, rates automatically update",
        "14. All pay calculations use new rates from this date"
      ],
      realWorldExample: {
        scenario: "The Fair Work Commission announces a 3.5% minimum wage increase for the 2026-27 financial year, affecting all Modern Awards.",
        steps: [
          "In late June, Payroll Admin Jenny sees a notification badge on Awards",
          "Opens the module and sees 'FWC Update Available' banner",
          "Clicks through to see the Children's Services Award update",
          "Summary shows: 3.5% increase across all classifications",
          "Effective date: 1 July 2026",
          "Jenny clicks 'Preview Staff Impact'",
          "System shows all 52 staff under this award",
          "Total annual cost increase: $58,400",
          "Average per-employee increase: $1,123/year",
          "Jenny forwards the impact report to HR Manager and Finance Director",
          "After approval, she schedules the update for 1 July",
          "Sets reminder to verify first pay run post-update",
          "On 1 July, rates automatically update in the system",
          "First pay run in July correctly applies new rates",
          "Audit log shows update applied by Jenny on scheduled date"
        ],
        outcome: "Annual wage increase applied seamlessly on the correct date. Compliance maintained, budget adjusted, and full audit trail recorded."
      }
    },
    {
      id: "US-AWD-004",
      title: "Create Custom Rate Override",
      actors: ["HR Manager", "Payroll Administrator"],
      description: "As an HR Manager, I want to apply a custom rate override for a staff member who is being paid above-award rates, so that their actual pay reflects their employment contract while maintaining audit compliance.",
      acceptanceCriteria: [
        "Can select staff member and classification",
        "Can specify override rate (hourly or annual)",
        "System validates override is not below award minimum",
        "Must provide reason for override",
        "Requires manager approval for overrides",
        "Override has effective date range (start and optional end)",
        "Full audit trail of override history"
      ],
      businessLogic: [
        "Override rate must be >= award minimum rate",
        "Override can be for base rate only or all-inclusive",
        "All-inclusive rate may absorb certain penalties",
        "Override reason is mandatory and auditable",
        "Approval workflow required for overrides > 20% above award",
        "Override end date triggers review reminder",
        "Expired overrides revert to standard award rate"
      ],
      priority: "medium",
      relatedModules: [
        { module: "Staff Profiles", relationship: "Override stored against staff pay configuration" },
        { module: "Payroll", relationship: "Override rate used in pay calculations" }
      ],
      endToEndJourney: [
        "1. HR Manager Sarah hires experienced Centre Director",
        "2. Negotiated salary: $95,000/year (above award)",
        "3. Opens Staff Profile > Pay Conditions",
        "4. Clicks 'Add Rate Override'",
        "5. Selects override type: 'Annual Salary'",
        "6. Enters amount: $95,000",
        "7. System checks: Award minimum for Level 6.3 is $78,400 ✓",
        "8. Selects: 'Above-award package (absorbs first 2 OT hours)'",
        "9. Enters reason: 'Negotiated package for experienced hire'",
        "10. Sets effective date: Employee start date",
        "11. Submits for approval",
        "12. Finance Director receives approval request",
        "13. Reviews justification and approves",
        "14. Override is activated with audit trail",
        "15. Payroll calculations use $95,000 annual rate"
      ],
      realWorldExample: {
        scenario: "Sunshine Childcare recruits an experienced Centre Director with 15 years experience. To attract this talent, they offer a package above the award rate.",
        steps: [
          "HR Manager Sarah completes contract negotiation",
          "Agreed package: $95,000 base + super (above Level 6.3 award of $78,400)",
          "Opens new employee's profile after onboarding setup",
          "Goes to Pay Conditions > Rate Overrides",
          "Clicks 'Create Override'",
          "Selects 'Annual Salary Override'",
          "Enters $95,000",
          "System validates: Above award minimum ✓",
          "Selects absorption clause: 'First 2 hours OT absorbed'",
          "This means first 2 overtime hours per week are included in salary",
          "Reason: 'Experienced hire - competitive package to secure talent'",
          "Attaches signed employment contract as documentation",
          "Submits to Finance Director for approval",
          "Director reviews and approves within 24 hours",
          "Override becomes active",
          "Audit log shows: Created by Sarah, Approved by Director, Date, Reason"
        ],
        outcome: "Above-award salary correctly configured with compliance documentation. Employee paid correctly from day one with full audit trail for Fair Work inspection."
      }
    },
    {
      id: "US-AWD-005",
      title: "Configure Allowance Rules",
      actors: ["Payroll Administrator", "HR Manager"],
      description: "As a Payroll Administrator, I want to configure allowance triggers and rates, so that staff automatically receive correct allowances based on their work conditions.",
      acceptanceCriteria: [
        "Can view all allowances defined in applicable awards",
        "Can enable/disable allowances for organization",
        "Can configure trigger conditions (shift duration, qualification, etc.)",
        "Can set custom rates where award permits",
        "Allowance stacking rules can be configured",
        "Can define mutual exclusion rules (either/or allowances)"
      ],
      businessLogic: [
        "Standard allowances: meal, travel, uniform, first aid, etc.",
        "Trigger types: shift duration, time of day, qualification held, task performed",
        "Meal allowance: typically after 5+ hours worked",
        "First aid allowance: if designated first aid officer",
        "Travel allowance: if required to travel between sites",
        "Some allowances are taxable, others are not",
        "Allowance frequency: per shift, per day, per week"
      ],
      priority: "high",
      relatedModules: [
        { module: "Roster", relationship: "Shift configuration includes allowance flags" },
        { module: "Staff Qualifications", relationship: "Qualification-based allowances check certifications" }
      ],
      endToEndJourney: [
        "1. Payroll Admin opens Awards > Allowances Configuration",
        "2. Views Children's Services Award allowances",
        "3. Sees: First Aid Allowance - $18.50/week - Disabled",
        "4. Centre has 3 designated first aid officers",
        "5. Clicks to enable First Aid Allowance",
        "6. Configures trigger: 'Staff with First Aid Qualification'",
        "7. Sets additional condition: 'Designated First Aid Officer flag'",
        "8. Confirms rate: $18.50/week (per award)",
        "9. Saves configuration",
        "10. Opens each first aid officer's profile",
        "11. Enables 'Designated First Aid Officer' flag",
        "12. Next pay run: 3 staff receive $18.50 allowance",
        "13. Allowance shows in their pay breakdown"
      ],
      realWorldExample: {
        scenario: "Rainbow Early Learning needs to set up the First Aid allowance for their designated first aid officers as required by the award.",
        steps: [
          "Payroll Admin opens the Allowances section under Awards",
          "Finds 'First Aid Allowance' - currently disabled",
          "Clicks 'Configure' to set up the allowance",
          "Sets trigger: Staff must have 'First Aid Certificate' qualification",
          "Adds condition: Staff must have 'Designated First Aid Officer' flag",
          "Confirms the award rate: $18.50 per week",
          "Sets taxable: Yes (as per ATO guidance)",
          "Enables the allowance",
          "Next, goes to Staff Profiles for the 3 designated officers",
          "For each: Emma, Tom, and Maria",
          "Enables the 'Designated First Aid Officer' flag",
          "Verifies each has current First Aid certificate",
          "System validates: all 3 now eligible for allowance",
          "Weekly payroll includes $18.50 allowance for each",
          "Pay slips show line item: 'First Aid Allowance: $18.50'"
        ],
        outcome: "First aid allowance correctly configured and automatically applied to designated officers. Award compliance maintained with clear audit trail."
      }
    },
    {
      id: "US-AWD-006",
      title: "Calculate Overtime with Tiered Rates",
      actors: ["Payroll Administrator"],
      description: "As a Payroll Administrator, I want the system to automatically calculate overtime at the correct tiered rates, so that staff working beyond standard hours are paid correctly.",
      acceptanceCriteria: [
        "System tracks daily hours against overtime thresholds",
        "System tracks weekly hours against overtime thresholds",
        "First overtime tier applies correct multiplier (e.g., 1.5x)",
        "Second overtime tier applies correct multiplier (e.g., 2.0x)",
        "Overtime calculations interact correctly with penalty rates",
        "Clear breakdown shows ordinary vs overtime hours"
      ],
      businessLogic: [
        "Daily overtime: hours worked beyond 8 or 10 per day (award-specific)",
        "Weekly overtime: hours worked beyond 38 per week",
        "First 2 overtime hours: typically 150% (time and a half)",
        "Subsequent overtime hours: typically 200% (double time)",
        "Overtime on penalty days: penalties may compound or replace",
        "Casual employees: overtime applies to shifts > 10 hours",
        "Reasonable overtime: consider health and safety factors"
      ],
      priority: "critical",
      relatedModules: [
        { module: "Roster", relationship: "Shift planning includes overtime projection warnings" },
        { module: "Fatigue Management", relationship: "Excessive overtime triggers fatigue alerts" }
      ],
      endToEndJourney: [
        "1. Educator Emma works 45 hours in a week",
        "2. Award threshold: 38 hours ordinary time",
        "3. System calculates: 38 hours ordinary, 7 hours overtime",
        "4. First 2 OT hours: $28.73 × 1.5 = $43.10/hr",
        "5. Remaining 5 OT hours: $28.73 × 2.0 = $57.46/hr",
        "6. Ordinary pay: 38 × $28.73 = $1,091.74",
        "7. First tier OT: 2 × $43.10 = $86.20",
        "8. Second tier OT: 5 × $57.46 = $287.30",
        "9. Total weekly pay: $1,465.24",
        "10. Timesheet shows breakdown by tier",
        "11. Manager sees overtime cost alert"
      ],
      realWorldExample: {
        scenario: "Due to staff shortages, Emma works extra shifts totalling 45 hours for the week instead of her usual 38.",
        steps: [
          "Emma's normal roster: 38 hours per week",
          "This week she covers 7 extra hours due to sick calls",
          "Monday 8 hrs, Tuesday 8 hrs, Wednesday 9 hrs (1 OT)",
          "Thursday 10 hrs (2 OT), Friday 10 hrs (2 OT + 2 double)",
          "Total: 45 hours = 38 ordinary + 7 overtime",
          "System calculates per award:",
          "  - Daily OT threshold: 8 hours",
          "  - Weekly OT threshold: 38 hours",
          "Emma's base rate: $28.73/hr",
          "Overtime tier 1 (first 2 hours): 150% = $43.10/hr",
          "Overtime tier 2 (subsequent): 200% = $57.46/hr",
          "Calculation:",
          "  - Ordinary: 38 hrs × $28.73 = $1,091.74",
          "  - Tier 1 OT: 2 hrs × $43.10 = $86.20",
          "  - Tier 2 OT: 5 hrs × $57.46 = $287.30",
          "  - Total: $1,465.24",
          "Timesheet shows detailed breakdown",
          "Manager receives notification of overtime spend"
        ],
        outcome: "Emma's overtime correctly calculated with tiered rates. Manager has visibility into overtime costs for budget management."
      }
    },
    {
      id: "US-AWD-007",
      title: "Run Compliance Audit Report",
      actors: ["HR Manager", "Finance Director"],
      description: "As an HR Manager, I want to run compliance audit reports that identify any potential underpayment issues, so that I can proactively address risks before they become Fair Work complaints.",
      acceptanceCriteria: [
        "Report compares actual pay against minimum award entitlements",
        "Identifies staff potentially paid below award",
        "Flags missing allowances that should apply",
        "Shows overtime hours not paid at correct rates",
        "Provides recommended remediation actions",
        "Can be scheduled to run automatically"
      ],
      businessLogic: [
        "Compare each payslip against award minimum calculations",
        "Check all applicable penalties were applied",
        "Verify allowance eligibility and payment",
        "Check overtime thresholds and tiered rates",
        "Consider absorption clauses in above-award contracts",
        "Calculate potential underpayment amounts",
        "Generate remediation recommendations"
      ],
      priority: "high",
      relatedModules: [
        { module: "Payroll", relationship: "Historical pay data used for comparison" },
        { module: "Timesheet", relationship: "Actual hours and conditions audited" }
      ],
      endToEndJourney: [
        "1. HR Manager schedules quarterly compliance audit",
        "2. Selects date range: Q1 2026 (Jan-Mar)",
        "3. Selects scope: All staff under Children's Services Award",
        "4. Runs comprehensive audit",
        "5. Report generates after 5 minutes",
        "6. Summary: 2 potential issues identified",
        "7. Issue 1: Staff #234 - Sunday penalty missing on 3 shifts",
        "8. Issue 2: Staff #167 - First aid allowance not paid",
        "9. Each issue shows: dates, amounts, recommended action",
        "10. HR Manager investigates each case",
        "11. Confirms issues are genuine errors",
        "12. Creates remediation plan to backpay",
        "13. Documents audit and response for records"
      ],
      realWorldExample: {
        scenario: "Sunshine Childcare conducts its quarterly compliance review to proactively identify any payroll issues.",
        steps: [
          "HR Manager Sarah runs the Q1 2026 Compliance Audit",
          "System analyses 156 staff across 3 months of payroll",
          "Report completes in 4 minutes",
          "Dashboard shows: 2 issues found, 154 staff compliant",
          "Issue 1: Tom (Staff #234)",
          "  - 3 Sunday shifts in February paid at ordinary rate",
          "  - Should have been 175% penalty rate",
          "  - Underpayment: $127.45",
          "Issue 2: Maria (Staff #167)",
          "  - Designated First Aid Officer since January",
          "  - Allowance of $18.50/week not paid for 8 weeks",
          "  - Underpayment: $148.00",
          "Sarah investigates:",
          "  - Tom's Sunday shifts: data entry error when roster created",
          "  - Maria's allowance: flag not enabled after designation",
          "Sarah creates remediation:",
          "  - Backpay for Tom: $127.45 in next pay run",
          "  - Backpay for Maria: $148.00 in next pay run",
          "  - Fixes the configuration for Maria's profile",
          "Documents the audit findings and remediation in the system"
        ],
        outcome: "Proactive audit identifies $275.45 in underpayments before employees raised concerns. Issues remediated quickly with full documentation for compliance records."
      }
    },
    {
      id: "US-AWD-008",
      title: "Simulate Pay Rate Changes",
      actors: ["Finance Director", "HR Manager"],
      description: "As a Finance Director, I want to simulate the cost impact of pay rate changes before they're applied, so that I can budget accurately and make informed decisions.",
      acceptanceCriteria: [
        "Can select rate change scenario (FWC increase, custom increase)",
        "Can specify percentage or fixed amount increase",
        "Can target specific classifications or all staff",
        "Simulation shows per-employee and total cost impact",
        "Can compare multiple scenarios side by side",
        "Results can be exported for budgeting"
      ],
      businessLogic: [
        "Simulation uses actual hours data from recent period",
        "Projects forward based on typical working patterns",
        "Includes penalty and overtime recalculations",
        "Shows annualized cost impact",
        "Compares against current budget allocation",
        "Identifies high-impact areas (departments, classifications)"
      ],
      priority: "medium",
      relatedModules: [
        { module: "Budgeting", relationship: "Simulation results inform budget planning" },
        { module: "Workforce Planning", relationship: "Cost scenarios support headcount decisions" }
      ],
      endToEndJourney: [
        "1. Finance Director wants to model 4% wage increase impact",
        "2. Opens Awards > Rate Simulation",
        "3. Creates new scenario: '4% Across All Classifications'",
        "4. Selects: All staff under Children's Services Award",
        "5. Enters increase: 4%",
        "6. Selects projection period: 12 months",
        "7. Uses last 3 months as baseline",
        "8. Runs simulation",
        "9. Results show: Current annual: $2.4M, Projected: $2.496M",
        "10. Increase: $96,000 per year (+4%)",
        "11. Breakdown by classification shows highest impact areas",
        "12. Level 4 educators: $45,000 increase (largest group)",
        "13. Exports results to Excel for budget submission",
        "14. Creates second scenario at 3.5% for comparison",
        "15. Comparison view shows $24,000 difference"
      ],
      realWorldExample: {
        scenario: "Sunshine Childcare's Finance Director needs to budget for the upcoming FWC wage increase and wants to model different scenarios.",
        steps: [
          "Finance Director opens Rate Simulation tool",
          "Creates Scenario 1: 'FWC 3.5% (Conservative)'",
          "Selects all 52 staff under Children's Services Award",
          "Enters 3.5% increase",
          "Runs simulation using past 3 months of actual data",
          "Results: Current $2.4M → Projected $2.484M (+$84,000)",
          "Creates Scenario 2: 'FWC 4.0% (Expected)'",
          "Results: Current $2.4M → Projected $2.496M (+$96,000)",
          "Creates Scenario 3: 'FWC 4.5% (Worst Case)'",
          "Results: Current $2.4M → Projected $2.508M (+$108,000)",
          "Comparison table shows all three scenarios",
          "Breakdown shows Level 4 educators drive 47% of increase",
          "Exports to Excel with detailed per-employee projections",
          "Includes in budget submission to board",
          "Board approves budget with 4% increase contingency"
        ],
        outcome: "Informed budgeting decision made with accurate cost projections. Organisation prepared for wage increase regardless of final FWC determination."
      }
    },
    {
      id: "US-AWD-009",
      title: "Configure Enterprise Bargaining Agreement",
      actors: ["HR Manager", "Payroll Administrator"],
      description: "As an HR Manager, I want to configure an Enterprise Bargaining Agreement with custom terms that override standard award conditions, so that our negotiated agreement is correctly applied.",
      acceptanceCriteria: [
        "Can create new EBA with name, code, and effective dates",
        "Can define custom classification levels and rates",
        "Can configure custom allowances and conditions",
        "EBA rates can exceed but not fall below award minimums",
        "Staff can be assigned to EBA instead of Modern Award",
        "System validates 'better off overall' test requirements"
      ],
      businessLogic: [
        "EBA must pass Better Off Overall Test (BOOT)",
        "Each condition compared against relevant award",
        "EBA rates must equal or exceed award minimums",
        "EBA allowances may differ from award allowances",
        "Effective period defined (typically 3-4 years)",
        "Nominal expiry triggers renegotiation workflow"
      ],
      priority: "high",
      relatedModules: [
        { module: "Staff Profiles", relationship: "Staff assigned to EBA coverage" },
        { module: "Compliance", relationship: "BOOT validation runs on EBA configuration" }
      ],
      endToEndJourney: [
        "1. HR Manager Sarah receives approved EBA from Fair Work",
        "2. Opens Awards module > Enterprise Agreements",
        "3. Clicks 'Create New EBA'",
        "4. Enters details: 'Sunshine Childcare EBA 2026'",
        "5. Sets effective dates: 1 July 2026 to 30 June 2030",
        "6. Moves to Classifications tab",
        "7. Creates 5 custom levels with negotiated rates",
        "8. Level 1: $30.50/hr (Award: $28.73 - exceeds ✓)",
        "9. Configures custom allowances",
        "10. Professional Development Allowance: $500/year",
        "11. Sets leave conditions: 5 weeks annual leave (Award: 4)",
        "12. Runs BOOT validation against Children's Services Award",
        "13. All conditions pass - better off overall",
        "14. Submits for Finance Director approval",
        "15. Upon approval, EBA becomes active option",
        "16. Staff can be assigned to EBA coverage"
      ],
      realWorldExample: {
        scenario: "Sunshine Childcare has negotiated an enterprise agreement with enhanced conditions. HR needs to configure it in the system.",
        steps: [
          "EBA approved by Fair Work Commission",
          "HR Manager Sarah opens Enterprise Agreements section",
          "Creates new agreement: 'Sunshine Childcare EBA 2026-2030'",
          "Agreement code: EBA-SC-2026",
          "Commencement: 1 July 2026",
          "Nominal Expiry: 30 June 2030",
          "Defines 5 classification levels:",
          "  Level 1: Support Worker - $30.50/hr",
          "  Level 2: Educator - $33.25/hr",
          "  Level 3: Qualified Educator - $36.00/hr",
          "  Level 4: Room Leader - $39.50/hr",
          "  Level 5: Educational Leader - $44.00/hr",
          "Configures EBA-specific allowances:",
          "  - Professional Development: $500/year",
          "  - Wellness Allowance: $200/year",
          "  - Phone Allowance: $25/month",
          "Leave entitlements:",
          "  - Annual Leave: 5 weeks (vs 4 weeks award)",
          "  - Personal Leave: 12 days (vs 10 days award)",
          "System runs BOOT comparison:",
          "  All rates exceed award ✓",
          "  Leave conditions exceed award ✓",
          "  Allowances provide additional benefits ✓",
          "  BOOT PASSED",
          "Finance Director reviews and approves",
          "EBA active from 1 July, ready for staff assignment"
        ],
        outcome: "Enterprise Agreement correctly configured with all negotiated terms. System ensures ongoing BOOT compliance for all calculations."
      }
    },
    {
      id: "US-AWD-010",
      title: "Apply Casual Loading Automatically",
      actors: ["Payroll Administrator"],
      description: "As a Payroll Administrator, I want casual loading to be automatically applied to all casual employee pay calculations, so that casuals receive correct rates without manual intervention.",
      acceptanceCriteria: [
        "System identifies casual employment type from staff profile",
        "25% loading automatically added to base rate",
        "Loading shows as separate line item in pay breakdown",
        "Casual loading applies before penalty rate calculations",
        "Can configure loading percentage per award if different",
        "Historical casual rates maintained for auditing"
      ],
      businessLogic: [
        "Standard casual loading: 25% of base rate",
        "Loading in lieu of: Annual leave, personal leave, notice period",
        "Loading applies to ordinary hours only",
        "Penalty rates calculate on base rate (not loaded rate)",
        "Minimum engagement: 3 hours per shift for casuals",
        "Casual conversion rights trigger after 12 months regular pattern"
      ],
      priority: "critical",
      relatedModules: [
        { module: "Roster", relationship: "Casual shift costing includes loading" },
        { module: "Staff Profiles", relationship: "Employment type determines loading application" }
      ],
      endToEndJourney: [
        "1. Casual educator Emma works a shift Monday 8 AM - 4 PM",
        "2. Her classification: Level 3.1, base rate $28.73/hr",
        "3. System calculates casual loading: $28.73 × 25% = $7.18",
        "4. Emma's casual rate: $28.73 + $7.18 = $35.91/hr",
        "5. Shift is 8 hours with 30 min unpaid break = 7.5 hours",
        "6. Gross pay: 7.5 × $35.91 = $269.33",
        "7. Pay breakdown shows:",
        "8. Base rate hours: 7.5 × $28.73 = $215.48",
        "9. Casual loading: 7.5 × $7.18 = $53.85",
        "10. Total: $269.33",
        "11. If shift was Sunday, penalty calculated on base rate",
        "12. Sunday: $28.73 × 200% = $57.46/hr + $7.18 loading = $64.64/hr"
      ],
      realWorldExample: {
        scenario: "Emma is a casual educator working two shifts this week - one regular weekday and one Sunday shift.",
        steps: [
          "Emma's profile shows: Employment Type = Casual",
          "Classification: Level 3.1, Base Rate: $28.73/hr",
          "Shift 1: Monday 8 AM - 4 PM (7.5 paid hours)",
          "System calculates:",
          "  Base: 7.5 hrs × $28.73 = $215.48",
          "  Casual Loading (25%): 7.5 × $7.18 = $53.85",
          "  Monday Total: $269.33",
          "Shift 2: Sunday 8 AM - 4 PM (7.5 paid hours)",
          "Sunday is a penalty day for casuals:",
          "  Base rate: $28.73",
          "  Sunday penalty for casual: 200%",
          "  Penalty rate: $28.73 × 2.0 = $57.46",
          "  Casual loading still applies: +$7.18",
          "  Sunday Total Rate: $64.64/hr",
          "  Sunday Pay: 7.5 × $64.64 = $484.80",
          "Weekly timesheet shows:",
          "  Monday: $269.33 (ordinary + loading)",
          "  Sunday: $484.80 (penalty + loading)",
          "  Week Total: $754.13",
          "Pay slip line items:",
          "  Ordinary Hours: $215.48",
          "  Casual Loading: $53.85",
          "  Sunday Penalty: $431.25",
          "  Sunday Casual Loading: $53.85"
        ],
        outcome: "Casual loading automatically calculated on all shifts. Penalty rates correctly applied on base before loading. No manual adjustment needed."
      }
    },
    {
      id: "US-AWD-011",
      title: "View Staff Award Classification History",
      actors: ["HR Manager", "Payroll Administrator"],
      description: "As an HR Manager, I want to view the complete history of a staff member's award classification changes, so that I can audit pay history and resolve disputes.",
      acceptanceCriteria: [
        "Can view full classification change history",
        "Each change shows: old value, new value, date, who changed",
        "Reason for change is captured and displayed",
        "Can export history to PDF for audit purposes",
        "History retained for 7 years per record-keeping requirements",
        "Search and filter by date range and change type"
      ],
      businessLogic: [
        "All classification changes logged automatically",
        "Captures: award, classification, employment type, rate",
        "Links to approval workflow where applicable",
        "Backdated changes create adjustment records",
        "History immutable - corrections add new records",
        "Supports Fair Work information requests"
      ],
      priority: "medium",
      relatedModules: [
        { module: "Audit Trail", relationship: "Classification changes part of master audit log" },
        { module: "Compliance Reports", relationship: "History feeds into compliance documentation" }
      ],
      endToEndJourney: [
        "1. Staff member questions pay rate from 2 years ago",
        "2. HR Manager opens their Staff Profile",
        "3. Navigates to Pay Conditions > Classification History",
        "4. Views timeline of all changes since hire date",
        "5. January 2024: Hired as Level 3.1 - $26.80/hr",
        "6. July 2024: FWC increase - $27.55/hr (auto-updated)",
        "7. September 2024: Promoted to Level 4.1 - $30.50/hr",
        "8. July 2025: FWC increase - $31.55/hr",
        "9. Each entry shows who made change and approval chain",
        "10. HR exports history as PDF for staff member",
        "11. PDF includes all rates, dates, and reasons",
        "12. Staff member satisfied with documentation"
      ],
      realWorldExample: {
        scenario: "Employee Tom believes he was underpaid after his promotion in 2024. HR investigates using classification history.",
        steps: [
          "Tom emails HR: 'I think my rate was wrong after my September 2024 promotion'",
          "HR Manager Sarah opens Tom's profile",
          "Goes to Pay Conditions > View Classification History",
          "Timeline shows:",
          "  15 Jan 2024: Initial hire - Level 3.1 - $26.80/hr",
          "    Reason: New employee - qualified educator",
          "    Approved by: Sarah Johnson (HR)",
          "  1 Jul 2024: FWC Rate Update - $27.55/hr",
          "    Reason: Annual Wage Review 2024 (2.8% increase)",
          "    Approved by: System (Automatic FWC update)",
          "  15 Sep 2024: Promotion - Level 4.1 - $30.50/hr",
          "    Reason: Promoted to Room Leader position",
          "    Approved by: Sarah Johnson (HR), Mike Director (Exec)",
          "  1 Jul 2025: FWC Rate Update - $31.55/hr",
          "    Reason: Annual Wage Review 2025 (3.4% increase)",
          "    Approved by: System (Automatic)",
          "Sarah reviews the September 2024 change",
          "Correct rate for Level 4.1 at that date: $30.50 ✓",
          "No underpayment - rate was correctly applied",
          "Sarah exports PDF and schedules call with Tom",
          "Shows him the audit trail with all approvals",
          "Tom understands and is satisfied with explanation"
        ],
        outcome: "Complete audit trail resolves employee query. Documentation demonstrates compliance. Trust maintained through transparency."
      }
    },
    {
      id: "US-AWD-012",
      title: "Calculate Split Shift Pay Correctly",
      actors: ["Payroll Administrator"],
      description: "As a Payroll Administrator, I want split shifts to be calculated with correct allowances and minimum payments, so that staff working broken shifts are paid fairly per award requirements.",
      acceptanceCriteria: [
        "System identifies split shifts (gap > 1 hour between segments)",
        "Split shift allowance applied automatically",
        "Minimum payment rules apply per segment",
        "Travel time consideration if required to leave premises",
        "Both segments contribute to daily/weekly hour totals",
        "Clear breakdown showing split shift calculation"
      ],
      businessLogic: [
        "Split shift: Break of more than 1 hour during shift",
        "Split shift allowance: varies by award (typically $15-25)",
        "Minimum engagement: Each segment minimum 2 hours",
        "Daily hours: Sum of both segments for overtime",
        "May attract meal allowance if second segment > threshold",
        "Some awards prohibit split shifts without consent"
      ],
      priority: "medium",
      relatedModules: [
        { module: "Roster", relationship: "Split shift indicator in roster view" },
        { module: "Timesheet", relationship: "Actual segments recorded for pay" }
      ],
      endToEndJourney: [
        "1. Educator Emma works a split shift: 7 AM - 10 AM, then 3 PM - 6 PM",
        "2. Gap between segments: 5 hours (split shift ✓)",
        "3. System identifies this as split shift pattern",
        "4. First segment: 3 hours ordinary time",
        "5. Second segment: 3 hours ordinary time",
        "6. Total daily hours: 6 hours",
        "7. Split shift allowance added: $16.50",
        "8. Second segment triggers meal allowance: $12.30",
        "9. Pay breakdown:",
        "10. Ordinary hours: 6 × $28.73 = $172.38",
        "11. Split shift allowance: $16.50",
        "12. Meal allowance: $12.30",
        "13. Total: $201.18"
      ],
      realWorldExample: {
        scenario: "Due to programming needs, Emma is rostered for a split shift covering morning and afternoon sessions with a long break.",
        steps: [
          "Roster shows Emma:",
          "  Segment 1: 7:00 AM - 10:00 AM (Nursery)",
          "  Break: 10:00 AM - 3:00 PM (5 hours off-site)",
          "  Segment 2: 3:00 PM - 6:00 PM (Nursery)",
          "Gap exceeds 1 hour - classified as split shift",
          "System calculates per Children's Services Award:",
          "Segment 1:",
          "  3 hours × $28.73 = $86.19",
          "Segment 2:",
          "  3 hours × $28.73 = $86.19",
          "Total ordinary hours: 6 hours",
          "Split shift allowance: $16.50 per award",
          "Meal allowance for Segment 2 (after 3 PM start): $12.30",
          "Gross pay calculation:",
          "  Ordinary: $172.38",
          "  Split Allowance: $16.50",
          "  Meal Allowance: $12.30",
          "  Total: $201.18",
          "Timesheet shows:",
          "  Hours: 6.0",
          "  Allowances: 2 (Split, Meal)",
          "  Pay Rate: $28.73/hr",
          "  Allowance Total: $28.80",
          "  Gross: $201.18",
          "Pay slip line items clearly show each component"
        ],
        outcome: "Split shift correctly identified and compensated. Staff receives fair pay for inconvenience of broken schedule."
      }
    },
    {
      id: "US-AWD-013",
      title: "Manage Public Holiday Penalty Rates",
      actors: ["Payroll Administrator", "HR Manager"],
      description: "As a Payroll Administrator, I want public holiday penalty rates to be automatically applied when staff work on gazetted public holidays, including state-specific variations.",
      acceptanceCriteria: [
        "System maintains calendar of public holidays",
        "State/territory specific holidays supported",
        "Correct penalty rate applied (typically 250%)",
        "Substitute day provisions handled",
        "Part-day public holiday provisions supported",
        "Staff working on PH shown in reports"
      ],
      businessLogic: [
        "National public holidays apply to all states",
        "State holidays apply only to relevant locations",
        "Public holiday rate typically 250% (2.5x base)",
        "Casual rate: Base + 25% loading + PH penalty",
        "Minimum payment provisions may apply",
        "Day in lieu may be offered as alternative"
      ],
      priority: "critical",
      relatedModules: [
        { module: "Calendar", relationship: "Public holiday calendar maintained centrally" },
        { module: "Roster", relationship: "Shows PH indicator on affected dates" }
      ],
      endToEndJourney: [
        "1. Australia Day falls on Monday 26 January",
        "2. Sunshine Centre operates on public holidays",
        "3. Centre Manager rosters 4 staff to work",
        "4. System identifies date as national public holiday",
        "5. All rostered shifts flagged with PH indicator",
        "6. Pay calculation for Emma (Level 3.1, $28.73 base):",
        "7. Public holiday rate: $28.73 × 250% = $71.83/hr",
        "8. Emma works 7.5 hours: 7.5 × $71.83 = $538.73",
        "9. For casual staff, loading also applies",
        "10. Reports show: 4 staff worked PH, total PH cost: $1,850",
        "11. Each staff receives PH rate in pay breakdown",
        "12. Payroll export includes PH hours separately"
      ],
      realWorldExample: {
        scenario: "Easter Monday is a public holiday. Several staff are rostered as the centre remains open for families who need care.",
        steps: [
          "Easter Monday: 21 April 2026 (national public holiday)",
          "Sunshine Centre open for essential care",
          "4 staff rostered:",
          "  Emma (permanent): 7.5 hours",
          "  Tom (permanent): 7.5 hours",
          "  Maria (casual): 7.5 hours",
          "  John (permanent): 5 hours",
          "System applies Easter Monday penalty rates:",
          "Emma & Tom (permanent, Level 3.1, $28.73):",
          "  PH Rate: $28.73 × 250% = $71.83/hr",
          "  Emma: 7.5 × $71.83 = $538.73",
          "  Tom: 7.5 × $71.83 = $538.73",
          "Maria (casual, Level 3.1, $28.73):",
          "  Base + Loading: $35.91",
          "  PH Rate: $28.73 × 275% = $79.01/hr",
          "  (Casual PH = Base × 250% + 25% loading)",
          "  Maria: 7.5 × $79.01 = $592.58",
          "John (permanent, Level 4.1, $32.47):",
          "  PH Rate: $32.47 × 250% = $81.18/hr",
          "  John: 5 × $81.18 = $405.90",
          "Total PH labour cost: $2,075.94",
          "Budget report shows PH premium: $1,350 above ordinary rates",
          "All PH hours exported with correct penalty codes"
        ],
        outcome: "Public holiday pay correctly calculated for all employment types. Compliance ensured, payroll accurate, cost visibility maintained."
      }
    },
    {
      id: "US-AWD-014",
      title: "Import Award Updates from Fair Work Database",
      actors: ["System Administrator", "Payroll Administrator"],
      description: "As a System Administrator, I want to import award updates directly from Fair Work Commission data feeds, so that our award definitions remain current and accurate.",
      acceptanceCriteria: [
        "Can connect to FWC data source",
        "Detects new versions of configured awards",
        "Shows detailed change comparison",
        "Can preview updates before applying",
        "Full audit trail of import and application",
        "Rollback capability if issues discovered"
      ],
      businessLogic: [
        "FWC publishes award variations via public data feeds",
        "Variations include: rate changes, clause changes, new allowances",
        "Import process validates data integrity",
        "Changes staged for review before activation",
        "Multiple awards can be updated in batch",
        "Notification sent to relevant administrators"
      ],
      priority: "high",
      relatedModules: [
        { module: "Notifications", relationship: "Alerts sent when updates available" },
        { module: "Audit", relationship: "All imports logged with full details" }
      ],
      endToEndJourney: [
        "1. System detects FWC update published for Children's Services Award",
        "2. Alert sent to Payroll Administrator and HR Manager",
        "3. Admin opens Award Updates section",
        "4. Sees: 'Update Available: MA000120 Version 23'",
        "5. Clicks 'View Changes' to see comparison",
        "6. Changes: 3.5% rate increase, new allowance clause",
        "7. Side-by-side shows old vs new values",
        "8. Admin clicks 'Import to Staging'",
        "9. System downloads and validates data",
        "10. Validation passed: data consistent with schema",
        "11. Admin sets effective date: 1 July 2026",
        "12. Submits for HR Manager approval",
        "13. HR Manager reviews and approves",
        "14. Update scheduled for automatic activation",
        "15. On 1 July, new rates become active"
      ],
      realWorldExample: {
        scenario: "Fair Work Commission releases annual wage review. Multiple awards need updating across the organization.",
        steps: [
          "Late June: FWC publishes annual wage review decision",
          "System automatically checks for updates daily",
          "Detection: 3 awards have new versions available:",
          "  - Children's Services Award (MA000120)",
          "  - Clerks Private Sector Award (MA000002)",
          "  - Miscellaneous Award (MA000104)",
          "Alert sent to system admin and payroll team",
          "Admin opens Award Updates console",
          "For each award, clicks 'View Changes':",
          "Children's Services (MA000120):",
          "  Rate increase: 3.75%",
          "  All classifications affected",
          "  New meal allowance rate: $14.55 (was $14.15)",
          "  Effective: 1 July 2026",
          "Admin clicks 'Import All' for 3 awards",
          "Progress: Downloading... Validating... Complete",
          "All 3 imports successful",
          "Admin sets effective date for each: 1 July 2026",
          "Generates impact report: 67 staff, $145,000 annual increase",
          "Submits batch for HR Director approval",
          "HR Director reviews and approves",
          "System schedules activation for 1 July 00:01 AM",
          "On 1 July, all calculations use new rates automatically"
        ],
        outcome: "Multi-award update processed in 30 minutes. Zero manual rate entry. Compliance guaranteed from first pay run after effective date."
      }
    },
    {
      id: "US-AWD-015",
      title: "Generate Better Off Overall Test Report",
      actors: ["HR Manager", "Finance Director"],
      description: "As an HR Manager, I want to generate a Better Off Overall Test (BOOT) report comparing an EBA against the relevant Modern Award, so that I can demonstrate compliance to Fair Work.",
      acceptanceCriteria: [
        "Report compares each EBA condition against award",
        "Line-by-line assessment: better, same, or worse",
        "Monetary value calculated for each difference",
        "Overall assessment determines BOOT pass/fail",
        "Report formatted for Fair Work submission",
        "Can run for individual or all EBA-covered staff"
      ],
      businessLogic: [
        "BOOT requires EBA be better off overall than award",
        "Individual conditions can be lower if offset by others",
        "Monetary value of each condition calculated",
        "Typical comparison points: rates, allowances, leave, conditions",
        "Annual value used for comparison",
        "Must consider 'typical' employee scenarios"
      ],
      priority: "high",
      relatedModules: [
        { module: "EBA Configuration", relationship: "Uses EBA terms for comparison" },
        { module: "Compliance", relationship: "BOOT reports part of compliance documentation" }
      ],
      endToEndJourney: [
        "1. HR Manager preparing EBA renewal needs BOOT analysis",
        "2. Opens Compliance > BOOT Assessment tool",
        "3. Selects: Sunshine Childcare EBA 2026",
        "4. Comparison Award: Children's Services Award MA000120",
        "5. Selects employee scenario: Level 3 Full-time",
        "6. System generates detailed comparison:",
        "7. Base Rate: EBA $33.25 vs Award $28.73 (+$4.52 BETTER)",
        "8. Annual Leave: EBA 5 weeks vs Award 4 weeks (+$1,150 BETTER)",
        "9. Personal Leave: Same at 10 days",
        "10. Overtime: Same rates and thresholds",
        "11. Allowances: EBA additional $700/year (BETTER)",
        "12. Overall: Employee $8,940/year better off",
        "13. BOOT Assessment: PASSED ✓",
        "14. Report exported in Fair Work submission format"
      ],
      realWorldExample: {
        scenario: "Sunshine Childcare is renewing its EBA and needs to demonstrate BOOT compliance for Fair Work approval.",
        steps: [
          "Current EBA expires 30 June 2026",
          "Negotiated new terms with employee representatives",
          "HR Manager must demonstrate BOOT compliance",
          "Opens BOOT Assessment tool",
          "Selects proposed 'Sunshine Childcare EBA 2026-2030'",
          "Comparison base: Children's Services Award MA000120",
          "Creates 3 test scenarios (required by FWC):",
          "Scenario 1: Level 3 Full-time Educator",
          "  Annual Award Earnings: $59,500",
          "  Annual EBA Earnings: $68,900",
          "  Difference: +$9,400 (15.8% better)",
          "  Assessment: PASSED",
          "Scenario 2: Level 4 Part-time (0.6 FTE)",
          "  Annual Award Earnings: $40,300",
          "  Annual EBA Earnings: $44,100",
          "  Difference: +$3,800 (9.4% better)",
          "  Assessment: PASSED",
          "Scenario 3: Level 2 Casual (average 20 hrs/wk)",
          "  Annual Award Earnings: $35,100",
          "  Annual EBA Earnings: $38,400",
          "  Difference: +$3,300 (9.4% better)",
          "  Assessment: PASSED",
          "Consolidated BOOT Report generated",
          "All scenarios better off - EBA passes BOOT",
          "PDF formatted for Fair Work submission",
          "Attached to EBA application package"
        ],
        outcome: "Comprehensive BOOT analysis demonstrates all employee types better off. Fair Work approval expedited with thorough documentation."
      }
    }
  ],

  tableSpecs: [
    {
      name: "ModernAwards",
      schema: "awards",
      description: "Australian Modern Award definitions from Fair Work Commission",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier" },
        { name: "name", type: "NVARCHAR(255)", mandatory: true, description: "Full award name" },
        { name: "code", type: "NVARCHAR(50)", mandatory: true, description: "FWC award code (e.g., MA000120)" },
        { name: "fwc_code", type: "NVARCHAR(50)", mandatory: false, description: "Official Fair Work Commission code" },
        { name: "industry", type: "NVARCHAR(100)", mandatory: true, description: "Industry category" },
        { name: "coverage_description", type: "NVARCHAR(MAX)", mandatory: false, description: "Who the award covers" },
        { name: "is_active", type: "BIT", mandatory: true, description: "Whether award is active", defaultValue: "1" },
        { name: "current_version", type: "NVARCHAR(50)", mandatory: true, description: "Current version number" },
        { name: "effective_from", type: "DATE", mandatory: true, description: "When current version took effect" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation" },
        { name: "updated_at", type: "DATETIME2", mandatory: true, description: "Last update" }
      ]
    },
    {
      name: "AwardClassifications",
      schema: "awards",
      description: "Classification levels within each award",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "award_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Parent award", foreignKey: "awards.ModernAwards.id" },
        { name: "code", type: "NVARCHAR(50)", mandatory: true, description: "Classification code (e.g., Level 4.1)" },
        { name: "name", type: "NVARCHAR(255)", mandatory: true, description: "Classification name" },
        { name: "description", type: "NVARCHAR(MAX)", mandatory: false, description: "Role description" },
        { name: "level", type: "INT", mandatory: true, description: "Numeric level for ordering" },
        { name: "stream", type: "NVARCHAR(100)", mandatory: false, description: "Award stream if applicable" },
        { name: "employment_type", type: "NVARCHAR(50)", mandatory: true, description: "full_time, part_time, casual" },
        { name: "required_qualifications", type: "NVARCHAR(MAX)", mandatory: false, description: "Minimum qualifications" },
        { name: "min_experience_months", type: "INT", mandatory: false, description: "Minimum experience required" },
        { name: "display_order", type: "INT", mandatory: true, description: "UI display order" }
      ]
    },
    {
      name: "ClassificationPayRates",
      schema: "awards",
      description: "Pay rates for each classification with effective dates",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "classification_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Parent classification", foreignKey: "awards.AwardClassifications.id" },
        { name: "rate_type", type: "NVARCHAR(50)", mandatory: true, description: "adult, junior, apprentice" },
        { name: "hourly_rate", type: "DECIMAL(10,4)", mandatory: true, description: "Hourly pay rate" },
        { name: "weekly_rate", type: "DECIMAL(10,2)", mandatory: false, description: "Weekly rate (38 hours)" },
        { name: "annual_rate", type: "DECIMAL(12,2)", mandatory: false, description: "Annual salary equivalent" },
        { name: "effective_from", type: "DATE", mandatory: true, description: "Rate effective date" },
        { name: "effective_to", type: "DATE", mandatory: false, description: "Rate end date (null = current)" },
        { name: "version", type: "NVARCHAR(50)", mandatory: true, description: "Award version this rate applies to" },
        { name: "is_current", type: "BIT", mandatory: true, description: "Whether this is the current rate", defaultValue: "1" }
      ]
    },
    {
      name: "AwardPenaltyRates",
      schema: "allowances",
      description: "Penalty rate multipliers for each award",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "award_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Parent award", foreignKey: "awards.ModernAwards.id" },
        { name: "penalty_type", type: "NVARCHAR(50)", mandatory: true, description: "saturday, sunday, public_holiday, evening, night" },
        { name: "employment_type", type: "NVARCHAR(50)", mandatory: true, description: "full_time, part_time, casual" },
        { name: "multiplier", type: "DECIMAL(5,4)", mandatory: true, description: "Rate multiplier (e.g., 1.5 = 150%)" },
        { name: "loading_type", type: "NVARCHAR(50)", mandatory: true, description: "replace or compound" },
        { name: "time_start", type: "TIME", mandatory: false, description: "Start time if time-based" },
        { name: "time_end", type: "TIME", mandatory: false, description: "End time if time-based" },
        { name: "is_active", type: "BIT", mandatory: true, description: "Whether active", defaultValue: "1" }
      ]
    },
    {
      name: "AwardAllowances",
      schema: "allowances",
      description: "Allowance definitions for each award",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "award_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Parent award", foreignKey: "awards.ModernAwards.id" },
        { name: "code", type: "NVARCHAR(50)", mandatory: true, description: "Allowance code" },
        { name: "name", type: "NVARCHAR(255)", mandatory: true, description: "Allowance name" },
        { name: "description", type: "NVARCHAR(MAX)", mandatory: false, description: "When allowance applies" },
        { name: "allowance_type", type: "NVARCHAR(50)", mandatory: true, description: "meal, travel, uniform, qualification, etc." },
        { name: "amount", type: "DECIMAL(10,4)", mandatory: true, description: "Allowance amount" },
        { name: "frequency", type: "NVARCHAR(50)", mandatory: true, description: "per_shift, per_day, per_week" },
        { name: "trigger_type", type: "NVARCHAR(50)", mandatory: true, description: "shift_duration, qualification, designation" },
        { name: "trigger_threshold", type: "NVARCHAR(50)", mandatory: false, description: "Trigger value (e.g., 5 hours)" },
        { name: "is_taxable", type: "BIT", mandatory: true, description: "Subject to tax", defaultValue: "1" },
        { name: "is_super_applicable", type: "BIT", mandatory: true, description: "Include in super calculation", defaultValue: "1" },
        { name: "is_stackable", type: "BIT", mandatory: true, description: "Can combine with other allowances", defaultValue: "1" },
        { name: "priority", type: "INT", mandatory: true, description: "Priority for non-stackable allowances", defaultValue: "0" }
      ]
    },
    {
      name: "CustomRateOverrides",
      schema: "overrides",
      description: "Custom rate overrides for individual staff",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier" },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Staff member", foreignKey: "roster_staff.Staff.id" },
        { name: "classification_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Classification if award-based" },
        { name: "override_type", type: "NVARCHAR(50)", mandatory: true, description: "hourly_rate, annual_salary, allowance" },
        { name: "override_value", type: "DECIMAL(12,4)", mandatory: true, description: "Override amount" },
        { name: "reason", type: "NVARCHAR(MAX)", mandatory: true, description: "Justification for override" },
        { name: "effective_from", type: "DATE", mandatory: true, description: "Start date" },
        { name: "effective_to", type: "DATE", mandatory: false, description: "End date (null = ongoing)" },
        { name: "absorption_details", type: "NVARCHAR(MAX)", mandatory: false, description: "What the package absorbs" },
        { name: "approved_by", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Approving manager" },
        { name: "approved_at", type: "DATETIME2", mandatory: true, description: "Approval timestamp" },
        { name: "document_url", type: "NVARCHAR(500)", mandatory: false, description: "Supporting document" },
        { name: "is_active", type: "BIT", mandatory: true, description: "Whether currently active", defaultValue: "1" }
      ]
    }
  ],

  integrations: [
    { system: "Roster Module", type: "Internal", description: "Provides pay rates for shift cost calculations and budget forecasting" },
    { system: "Timesheet Module", type: "Internal", description: "Applies rates and penalties to actual worked hours for pay calculation" },
    { system: "Staff Profiles", type: "Internal", description: "Links staff to award classifications and manages entitlements" },
    { system: "Fair Work Commission", type: "External", description: "Receives annual wage review updates and award changes" },
    { system: "Payroll System", type: "External", description: "Exports calculated pay data with rates, penalties, and allowances" },
    { system: "Xero/MYOB", type: "External", description: "Maps allowance types to payroll earnings categories" }
  ],

  businessRules: [
    { id: "BR-AWD-001", rule: "All pay rates must meet or exceed the National Minimum Wage", rationale: "Fair Work Act compliance requirement" },
    { id: "BR-AWD-002", rule: "Casual employees receive 25% loading in lieu of leave entitlements", rationale: "Standard casual loading per NES" },
    { id: "BR-AWD-003", rule: "Overtime applies after 38 hours per week or daily threshold per award", rationale: "Award-mandated overtime triggers" },
    { id: "BR-AWD-004", rule: "First 2 hours overtime at 150%, subsequent hours at 200%", rationale: "Standard tiered overtime rates (most awards)" },
    { id: "BR-AWD-005", rule: "Public holiday work attracts minimum 250% of base rate", rationale: "NES and award public holiday provisions" },
    { id: "BR-AWD-006", rule: "Rate changes cannot be backdated more than 2 pay periods without Finance approval", rationale: "Financial control and audit requirements" },
    { id: "BR-AWD-007", rule: "All rate overrides require documented justification and management approval", rationale: "Audit trail for Fair Work compliance" },
    { id: "BR-AWD-008", rule: "FWC rate updates must be applied on or before effective date", rationale: "Underpayment risk if delayed" },
    { id: "BR-AWD-009", rule: "Absorption clauses must be clearly documented and cannot reduce below award", rationale: "Better-off-overall test compliance" },
    { id: "BR-AWD-010", rule: "Historical rate data must be retained for 7 years", rationale: "Fair Work record-keeping requirements" }
  ]
};
