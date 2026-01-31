// Performance Module - Software Requirements Specification
// Comprehensive v2.0 - Reorganized with Full Database Specifications

import { ModuleSRS, FieldSpec, TableSpec } from './rosterSRS';

export const performanceSRS: ModuleSRS = {
  moduleName: "Performance Management",
  version: "2.0.0",
  lastUpdated: "2026-01-31",
  overview: `The Performance Management module provides a comprehensive suite of tools for managing employee performance, development, and engagement across all industries. It encompasses goal setting and OKR tracking, performance reviews and calibration, 360° feedback, learning management, talent assessment (including 9-Box Grid and succession planning), recognition programs, and employee engagement surveys. The system supports both manager-led and self-service workflows, with deep integration across all performance-related activities.`,
  
  objectives: [
    "Increase goal completion rates by 40% through structured OKR framework",
    "Reduce performance review cycle time by 60% through automation",
    "Improve employee engagement scores by 25% through continuous feedback",
    "Enable data-driven talent decisions through 9-Box and succession planning",
    "Increase learning completion rates by 50% through integrated LMS",
    "Create a culture of recognition through gamified praise and rewards",
    "Provide real-time visibility into organizational performance health",
    "Link performance outcomes to compensation through merit and bonus integration"
  ],

  scope: [
    "OKR (Objectives and Key Results) management with cascading alignment",
    "Individual goal setting with milestones and progress tracking",
    "Performance review cycles with configurable criteria and calibration",
    "360° feedback collection and sentiment analysis",
    "Peer nomination workflow for feedback requests",
    "Recognition and praise wall with points-based rewards",
    "Learning Management System (LMS) with courses and learning paths",
    "Talent assessment including 9-Box Grid mapping",
    "Succession planning for key roles with readiness tracking",
    "Pulse surveys, eNPS tracking, and wellbeing monitoring",
    "1:1 conversation scheduling with agenda and action tracking",
    "Performance Improvement Plans (PIP) lifecycle management",
    "Development plans linked to learning resources",
    "Career pathing visualization with skill gap analysis",
    "Compensation integration (merit matrix and bonus calculations)",
    "Mentorship matching and tracking"
  ],

  outOfScope: [
    "Payroll processing and payment execution",
    "Recruitment and applicant tracking",
    "HR case management",
    "Time and attendance tracking",
    "Benefits administration"
  ],

  actors: [
    {
      name: "Employee",
      description: "Individual contributor who sets goals, receives feedback, and participates in reviews",
      permissions: [
        "Create and update personal goals and OKRs",
        "View own performance history and progress",
        "Complete self-assessment in reviews",
        "Provide peer feedback when requested",
        "Nominate peers for 360° feedback (subject to approval)",
        "Access own learning courses and certificates",
        "Give praise to colleagues and award points",
        "Redeem reward points from catalog",
        "Complete pulse surveys and wellbeing check-ins",
        "Request and schedule 1:1 meetings",
        "View own career path and development plan"
      ]
    },
    {
      name: "Manager",
      description: "People leader responsible for team performance and development",
      permissions: [
        "All Employee permissions",
        "Create and assign team OKRs",
        "Conduct performance reviews for direct reports",
        "Approve/reject peer nominations for 360° feedback",
        "Assign development plans, goals, and courses",
        "Schedule and conduct 1:1 conversations",
        "Nominate team members for rewards",
        "View team engagement metrics and pulse results",
        "Initiate and manage PIPs",
        "Participate in calibration sessions",
        "Assess potential for 9-Box placement",
        "Add succession candidates for key roles"
      ]
    },
    {
      name: "Senior Manager / Director",
      description: "Leader of managers with broader organizational responsibility",
      permissions: [
        "All Manager permissions",
        "View department-wide performance metrics",
        "Create department-level OKRs",
        "Approve merit and bonus allocations",
        "Lead calibration sessions",
        "Manage succession planning for key roles",
        "View 9-Box talent maps for department",
        "Approve significant rate changes",
        "Access skills gap analysis"
      ]
    },
    {
      name: "HR Business Partner",
      description: "HR professional supporting business units with people strategy",
      permissions: [
        "View all performance data for assigned business units",
        "Configure review cycles and criteria",
        "Manage talent assessment processes",
        "Design and deploy engagement surveys",
        "Access compliance and audit reports",
        "Oversee PIP processes with HR governance",
        "Configure recognition programs and reward catalog",
        "Manage mentorship matching",
        "Access sentiment analysis dashboards"
      ]
    },
    {
      name: "Learning Administrator",
      description: "Manages learning content, enrollment, and certifications",
      permissions: [
        "Create and manage courses and learning paths",
        "Bulk assign courses to employees",
        "View learning analytics and completion rates",
        "Manage certifications and renewal tracking",
        "Configure assessment questions and passing scores",
        "Import/export learning content"
      ]
    },
    {
      name: "Executive / C-Suite",
      description: "Organization leadership requiring strategic visibility",
      permissions: [
        "View organization-wide dashboards",
        "Access succession planning for executive roles",
        "View aggregate engagement and performance trends",
        "Approve significant compensation decisions",
        "Access benchmarking against industry data"
      ]
    },
    {
      name: "System Administrator",
      description: "Technical administrator for configuration and maintenance",
      permissions: [
        "Configure all module settings",
        "Manage integration connections",
        "Access full audit logs",
        "Manage user roles and permissions",
        "Configure notification templates",
        "Import/export configuration data"
      ]
    }
  ],

  functionalRequirements: [
    // OKRs
    { id: "FR-PRF-001", category: "OKRs", requirement: "System shall support hierarchical OKRs (Company → Department → Team → Individual)", priority: "Critical" },
    { id: "FR-PRF-002", category: "OKRs", requirement: "System shall allow Key Results with measurable targets and inline progress updates", priority: "Critical" },
    { id: "FR-PRF-003", category: "OKRs", requirement: "System shall calculate objective progress from weighted key result progress", priority: "High" },
    { id: "FR-PRF-004", category: "OKRs", requirement: "System shall visualize OKR alignment tree across organization levels", priority: "High" },
    // Goals
    { id: "FR-PRF-005", category: "Goals", requirement: "System shall support individual goals with milestones and due dates", priority: "High" },
    { id: "FR-PRF-006", category: "Goals", requirement: "System shall allow linking goals to OKRs, courses, and development plans", priority: "Medium" },
    { id: "FR-PRF-007", category: "Goals", requirement: "System shall auto-update goal progress when linked resources complete", priority: "Medium" },
    // Reviews
    { id: "FR-PRF-008", category: "Reviews", requirement: "System shall support configurable review cycles (annual, semi-annual, quarterly)", priority: "Critical" },
    { id: "FR-PRF-009", category: "Reviews", requirement: "System shall include self-assessment, manager assessment, and calibration phases", priority: "Critical" },
    { id: "FR-PRF-010", category: "Reviews", requirement: "System shall support configurable rating criteria with weight management", priority: "High" },
    { id: "FR-PRF-011", category: "Reviews", requirement: "System shall enforce review completion deadlines with reminders", priority: "High" },
    { id: "FR-PRF-012", category: "Reviews", requirement: "System shall require employee acknowledgment of final review", priority: "High" },
    // Calibration
    { id: "FR-PRF-013", category: "Calibration", requirement: "System shall provide calibration interface for rating alignment", priority: "High" },
    { id: "FR-PRF-014", category: "Calibration", requirement: "System shall show bell-curve distribution during calibration sessions", priority: "Medium" },
    { id: "FR-PRF-015", category: "Calibration", requirement: "System shall log all rating adjustments with justification", priority: "Critical" },
    // 360° Feedback
    { id: "FR-PRF-016", category: "Feedback", requirement: "System shall support 360° feedback collection from multiple sources", priority: "High" },
    { id: "FR-PRF-017", category: "Feedback", requirement: "System shall allow anonymous feedback with aggregation thresholds", priority: "High" },
    { id: "FR-PRF-018", category: "Feedback", requirement: "System shall support peer nomination workflow with manager approval", priority: "Medium" },
    { id: "FR-PRF-019", category: "Feedback", requirement: "System shall generate competency summary reports from 360° results", priority: "Medium" },
    // Recognition
    { id: "FR-PRF-020", category: "Recognition", requirement: "System shall provide praise wall for public recognition", priority: "High" },
    { id: "FR-PRF-021", category: "Recognition", requirement: "System shall support points-based reward system with monthly allowances", priority: "Medium" },
    { id: "FR-PRF-022", category: "Recognition", requirement: "System shall offer reward catalog for point redemption", priority: "Medium" },
    { id: "FR-PRF-023", category: "Recognition", requirement: "System shall provide leaderboards for recognition activity", priority: "Low" },
    // LMS
    { id: "FR-PRF-024", category: "LMS", requirement: "System shall manage courses with modules and assessments", priority: "High" },
    { id: "FR-PRF-025", category: "LMS", requirement: "System shall track course enrollment, progress, and completion", priority: "High" },
    { id: "FR-PRF-026", category: "LMS", requirement: "System shall issue certificates upon course completion", priority: "Medium" },
    { id: "FR-PRF-027", category: "LMS", requirement: "System shall support learning paths with sequential or flexible course ordering", priority: "Medium" },
    { id: "FR-PRF-028", category: "LMS", requirement: "System shall support bulk assignment of courses and paths to staff", priority: "High" },
    // Talent Assessment
    { id: "FR-PRF-029", category: "Talent", requirement: "System shall provide 9-Box Grid for talent mapping", priority: "High" },
    { id: "FR-PRF-030", category: "Talent", requirement: "System shall track flight risk and succession readiness indicators", priority: "High" },
    { id: "FR-PRF-031", category: "Talent", requirement: "System shall support drag-and-drop box reassignment with justification", priority: "Medium" },
    // Succession
    { id: "FR-PRF-032", category: "Succession", requirement: "System shall identify key roles and succession candidates", priority: "High" },
    { id: "FR-PRF-033", category: "Succession", requirement: "System shall track candidate readiness levels (Ready Now, 1-2 Years, 3+ Years)", priority: "Medium" },
    { id: "FR-PRF-034", category: "Succession", requirement: "System shall identify competency gaps for succession candidates", priority: "Medium" },
    // Engagement
    { id: "FR-PRF-035", category: "Engagement", requirement: "System shall support pulse surveys with configurable frequency", priority: "High" },
    { id: "FR-PRF-036", category: "Engagement", requirement: "System shall calculate and trend eNPS scores", priority: "High" },
    { id: "FR-PRF-037", category: "Engagement", requirement: "System shall support anonymity toggle with response rate warnings", priority: "Medium" },
    { id: "FR-PRF-038", category: "Engagement", requirement: "System shall provide wellbeing check-ins and burnout risk indicators", priority: "Medium" },
    // 1:1 Conversations
    { id: "FR-PRF-039", category: "1:1s", requirement: "System shall support 1:1 conversation scheduling and tracking", priority: "High" },
    { id: "FR-PRF-040", category: "1:1s", requirement: "System shall maintain conversation history with notes and action items", priority: "High" },
    { id: "FR-PRF-041", category: "1:1s", requirement: "System shall integrate with video meeting platforms (Zoom, Teams, Meet)", priority: "Medium" },
    // PIP
    { id: "FR-PRF-042", category: "PIP", requirement: "System shall support Performance Improvement Plan creation with milestones", priority: "High" },
    { id: "FR-PRF-043", category: "PIP", requirement: "System shall enforce PIP workflow with check-ins and formal outcomes", priority: "High" },
    { id: "FR-PRF-044", category: "PIP", requirement: "System shall maintain HR visibility and compliance logging throughout PIP", priority: "Critical" },
    // Compensation Integration
    { id: "FR-PRF-045", category: "Compensation", requirement: "System shall integrate merit increase recommendations with review ratings", priority: "Medium" },
    { id: "FR-PRF-046", category: "Compensation", requirement: "System shall support bonus calculation based on performance multipliers", priority: "Medium" },
    { id: "FR-PRF-047", category: "Compensation", requirement: "System shall visualize salary bands with compa-ratio indicators", priority: "Low" },
    // Career & Skills
    { id: "FR-PRF-048", category: "Career", requirement: "System shall visualize career paths with progression requirements", priority: "Medium" },
    { id: "FR-PRF-049", category: "Skills", requirement: "System shall track skills with proficiency levels", priority: "Medium" },
    { id: "FR-PRF-050", category: "Skills", requirement: "System shall generate skills gap analysis across teams", priority: "Medium" },
    // Development
    { id: "FR-PRF-051", category: "Development", requirement: "System shall link development plans to goals and courses", priority: "Medium" },
    { id: "FR-PRF-052", category: "Development", requirement: "System shall track development budget requests and approvals", priority: "Low" },
    // Mentorship
    { id: "FR-PRF-053", category: "Mentorship", requirement: "System shall support mentor/mentee matching based on skills and goals", priority: "Low" },
    { id: "FR-PRF-054", category: "Mentorship", requirement: "System shall track mentorship meetings and outcomes", priority: "Low" }
  ],

  nonFunctionalRequirements: [
    { id: "NFR-PRF-001", category: "Performance", requirement: "Dashboard shall load within 3 seconds for managers with up to 50 reports" },
    { id: "NFR-PRF-002", category: "Performance", requirement: "Review form shall auto-save within 2 seconds of changes" },
    { id: "NFR-PRF-003", category: "Scalability", requirement: "System shall support 10,000 concurrent users during review periods" },
    { id: "NFR-PRF-004", category: "Privacy", requirement: "Anonymous feedback shall require minimum 3 responses before display" },
    { id: "NFR-PRF-005", category: "Security", requirement: "Review ratings visible only to authorized reviewers and HR" },
    { id: "NFR-PRF-006", category: "Audit", requirement: "All rating changes logged with user, timestamp, and previous value" },
    { id: "NFR-PRF-007", category: "Availability", requirement: "99.9% uptime during review submission windows" },
    { id: "NFR-PRF-008", category: "Usability", requirement: "Mobile-responsive interface for feedback and survey completion" },
    { id: "NFR-PRF-009", category: "Retention", requirement: "Performance data retained for 7 years minimum for compliance" },
    { id: "NFR-PRF-010", category: "Integration", requirement: "REST APIs for integration with HRIS and payroll systems" }
  ],

  // ============================================================================
  // USER STORIES - Organized by Functional Area
  // ============================================================================
  userStories: [
    // ============================================================================
    // SECTION 1: OKR MANAGEMENT
    // ============================================================================
    {
      id: "US-PRF-001",
      title: "Create and Cascade Team OKRs",
      actors: ["Manager"],
      description: "As a Manager, I want to create team OKRs that align with company objectives, so that my team's work directly contributes to organizational goals.",
      acceptanceCriteria: [
        "Can view company-level OKRs for alignment",
        "Can create team OKR with multiple Key Results",
        "Can link team OKR to parent company OKR",
        "Team members can create individual OKRs aligned to team",
        "Progress rolls up from individual to team to company",
        "Visual alignment tree shows OKR hierarchy"
      ],
      businessLogic: [
        "OKR levels: Company → Department → Team → Individual",
        "Each OKR has 2-5 Key Results with measurable targets",
        "Key Result progress: 0-100% based on current vs target",
        "OKR progress: weighted average of Key Result progress",
        "Default KR weights are equal; can be customized",
        "OKR cycles typically quarterly or annual"
      ],
      priority: "critical",
      relatedModules: [
        { module: "Reviews", relationship: "OKR progress informs performance ratings" },
        { module: "Development", relationship: "OKRs can be linked to development plans" }
      ],
      endToEndJourney: [
        "1. CEO sets Company OKR: 'Become market leader in the region'",
        "2. Key Result: 'Increase locations from 10 to 15'",
        "3. Operations Director views company OKRs",
        "4. Creates aligned Department OKR: 'Ensure staffing capacity for expansion'",
        "5. Key Result: 'Reduce staff turnover to < 10%'",
        "6. Manager Sarah views department OKRs",
        "7. Creates Team OKR: 'Build high-performing team'",
        "8. Key Result 1: 'Achieve 90% staff satisfaction score'",
        "9. Key Result 2: 'Complete leadership training for 5 staff'",
        "10. Links Team OKR to Department OKR",
        "11. Staff member Emma views team OKR",
        "12. Creates Individual OKR: 'Develop leadership capabilities'",
        "13. Key Result: 'Complete 3 leadership courses by Q2'",
        "14. Alignment tree shows Company → Dept → Team → Individual connection",
        "15. As Emma completes courses, progress flows up the tree"
      ],
      realWorldExample: {
        scenario: "Organization sets ambitious growth targets. Each level creates aligned OKRs to contribute.",
        steps: [
          "Q1 planning: CEO presents company vision and OKRs",
          "Company OKR: 'Expand to 15 locations while maintaining quality'",
          "Key Results focus on location openings, quality ratings, and staff retention",
          "Operations Director creates department OKR to support expansion",
          "Focus on staffing capacity and training infrastructure",
          "Manager Sarah creates her team's contribution",
          "Team OKR: 'Model high-performance culture'",
          "KR1: Staff satisfaction 90%+ (measured quarterly)",
          "KR2: 100% compliance rating in audits",
          "KR3: 5 staff complete leadership pathway",
          "Sarah shares OKRs in team meeting",
          "Each team member creates individual OKRs",
          "Staff member Emma: 'Step up as senior contributor'",
          "Emma's KRs: Complete courses, mentor 2 juniors, lead 1 event",
          "Weekly check-ins update KR progress",
          "Q1 review shows alignment from individual to company"
        ],
        outcome: "All 150 staff have OKRs that visibly connect to company goals. Progress is transparent, and contribution to strategic objectives is clear."
      }
    },
    {
      id: "US-PRF-002",
      title: "Update Key Result Progress with Inline Slider",
      actors: ["Employee", "Manager"],
      description: "As an Employee, I want to update my Key Result progress using an interactive slider, so that my OKR reflects current achievement without manual percentage entry.",
      acceptanceCriteria: [
        "Key Result shows progress slider from 0-100%",
        "Slider updates on drag with live percentage display",
        "Parent Objective progress recalculates immediately",
        "Progress history maintained for trend visualization",
        "Can add notes when updating progress",
        "Manager receives notification on significant progress"
      ],
      businessLogic: [
        "Progress updates trigger Objective recalculation",
        "Weighted formula: Objective = Σ(KR progress × KR weight)",
        "Progress changes logged with timestamp and user",
        "Notifications sent when: +20% progress, 100% achieved, overdue",
        "Progress cannot exceed 100% without manager approval",
        "Historical snapshots taken weekly for trending"
      ],
      priority: "high",
      relatedModules: [
        { module: "Analytics", relationship: "Progress feeds performance dashboards" },
        { module: "Notifications", relationship: "Progress triggers alerts" }
      ],
      endToEndJourney: [
        "1. Emma opens her OKR dashboard",
        "2. Sees Key Result: 'Complete 3 leadership courses' at 33%",
        "3. Just finished second course",
        "4. Drags slider from 33% to 67%",
        "5. Popup prompts for note: 'Completed Delegation course'",
        "6. Clicks 'Save Progress'",
        "7. KR updates to 67%, parent Objective recalculates",
        "8. Objective moves from 45% to 58%",
        "9. Progress history shows trend line",
        "10. Manager Sarah receives notification: 'Emma: +34% on leadership KR'"
      ],
      realWorldExample: {
        scenario: "Staff member makes progress on learning Key Result during lunch break.",
        steps: [
          "Emma completes 'Conflict Resolution' module at 12:30 PM",
          "Opens OKR app on mobile during lunch",
          "Navigates to 'Develop Leadership' objective",
          "Sees KR: 'Complete 3 courses' currently at 33%",
          "Drags slider to 67% (2 of 3 done)",
          "Adds note: 'Conflict Resolution complete - 92% score'",
          "System saves and recalculates",
          "Objective jumps from 45% to 58%",
          "Badge appears: 'On Track for Q1 Target'",
          "Manager sees progress in dashboard that afternoon"
        ],
        outcome: "Real-time progress updates keep OKRs current. Manager has visibility without manual reporting."
      }
    },

    // ============================================================================
    // SECTION 2: PERFORMANCE REVIEWS
    // ============================================================================
    {
      id: "US-PRF-003",
      title: "Complete Performance Review Cycle",
      actors: ["Employee", "Manager", "HR Business Partner"],
      description: "As an Employee, I want to complete my self-assessment and receive manager feedback, so that I understand my performance and areas for development.",
      acceptanceCriteria: [
        "Employee receives notification when review cycle opens",
        "Can complete self-assessment against defined criteria",
        "Can add evidence and examples for each criterion",
        "Manager receives notification when self-assessment complete",
        "Manager completes their assessment of employee",
        "Can schedule calibration review with HR",
        "Employee sees final ratings after calibration"
      ],
      businessLogic: [
        "Review phases: Self-assessment → Manager review → Calibration → Finalize",
        "Criteria configured per review cycle (e.g., Core Values, Competencies)",
        "Rating scale: 1-5 or custom (Exceptional, Meets, Needs Improvement)",
        "Self-rating and manager rating captured separately",
        "Calibration may adjust final rating for consistency",
        "Review must be acknowledged by employee within 14 days"
      ],
      priority: "critical",
      relatedModules: [
        { module: "OKRs", relationship: "Goal achievement informs performance rating" },
        { module: "Compensation", relationship: "Final rating drives merit increase eligibility" }
      ],
      endToEndJourney: [
        "1. HR launches Annual Review cycle on 1 November",
        "2. All employees receive email: 'Annual Review Open - Due 15 Nov'",
        "3. Staff member Emma opens the Performance module",
        "4. Sees Review section with 'Complete Self-Assessment'",
        "5. Reviews the 5 criteria: Quality, Teamwork, Initiative, Development, Values",
        "6. For each criterion, adds self-rating and examples",
        "7. Quality: Rates 4/5, adds example of positive feedback received",
        "8. Submits self-assessment on 10 November",
        "9. Manager Sarah receives notification to review",
        "10. Sarah opens Emma's assessment, sees self-ratings",
        "11. Adds manager ratings for each criterion",
        "12. Overall rating: 4 - Exceeds Expectations",
        "13. Submits manager review",
        "14. HR schedules calibration session on 20 November",
        "15. During calibration, ratings reviewed against peer distribution",
        "16. Emma's rating confirmed as 4",
        "17. Sarah meets Emma to share feedback",
        "18. Emma acknowledges review in system",
        "19. Rating feeds into merit increase calculation"
      ],
      realWorldExample: {
        scenario: "Organization runs annual performance review in November. All 52 staff complete self-assessments followed by manager reviews.",
        steps: [
          "HR sets up review cycle with 5 criteria aligned to company values",
          "Cycle opens 1 November, all staff notified",
          "Staff member Emma logs in and sees her pending review",
          "She spends 30 minutes completing her self-assessment",
          "For 'Quality' she rates herself 4/5",
          "Adds evidence: 'Received 3 positive feedback emails'",
          "For 'Professional Development' she rates 5/5",
          "Evidence: 'Completed certification and 4 elective courses'",
          "Submits by 10 November deadline",
          "Manager Sarah reviews all 12 direct reports",
          "For Emma, agrees with most self-ratings",
          "Adjusts 'Initiative' from 4 to 3: 'Room for more proactive contribution'",
          "Overall manager rating: 4 - Exceeds Expectations",
          "Adds narrative: 'Strong year, ready for senior responsibilities'",
          "HR runs calibration session with all managers",
          "Discuss distribution: 8% Exceptional, 72% Meets, 20% Needs Work",
          "Emma's rating of 4 confirmed - consistent with evidence",
          "Sarah meets Emma, shares feedback and development focus",
          "Emma acknowledges and sets goals for next year"
        ],
        outcome: "Emma receives fair, calibrated feedback with clear examples. Her strong performance is recognized and linked to merit increase."
      }
    },
    {
      id: "US-PRF-004",
      title: "Calibrate Performance Ratings Across Department",
      actors: ["HR Business Partner", "Senior Manager"],
      description: "As an HR Business Partner, I want to facilitate calibration sessions where managers align performance ratings, so that ratings are fair and consistent across the organization.",
      acceptanceCriteria: [
        "Can create calibration session for department/division",
        "All pending reviews visible in session",
        "Can view rating distribution (bell curve)",
        "Managers can discuss and adjust ratings",
        "All adjustments logged with rationale",
        "Final ratings locked after calibration"
      ],
      businessLogic: [
        "Calibration typically at department level",
        "Expected distribution may be enforced or guided",
        "Changes require documented justification",
        "Escalation path for disputes",
        "Reviews locked to manager after calibration",
        "Employee sees only final calibrated rating"
      ],
      priority: "high",
      relatedModules: [
        { module: "Reviews", relationship: "Calibration is final step before review completion" },
        { module: "Compensation", relationship: "Calibrated ratings feed into merit decisions" }
      ],
      endToEndJourney: [
        "1. HR schedules calibration session for Operations department",
        "2. 4 Managers invited with their reviews",
        "3. 52 reviews total ready for calibration",
        "4. Session opens: Current distribution shown",
        "5. Distribution: 15% Exceeds, 70% Meets, 15% Needs Improvement",
        "6. Discussion begins with 'Exceeds' ratings",
        "7. Manager 1 presents: 3 staff rated 'Exceeds'",
        "8. Evidence reviewed: Goal achievement, behavior examples",
        "9. 2 confirmed, 1 adjusted down to 'Meets' (insufficient evidence)",
        "10. Process repeats for all ratings",
        "11. 'Needs Improvement' ratings discussed for support plans",
        "12. Final distribution: 12% Exceeds, 73% Meets, 15% NI",
        "13. All adjustments documented with reasons",
        "14. Session closed, ratings locked",
        "15. Managers can now share results with employees"
      ],
      realWorldExample: {
        scenario: "Organization runs annual calibration across 4 locations to ensure fair and consistent performance ratings.",
        steps: [
          "November: All 52 reviews completed by managers",
          "HR schedules calibration for 22 November, 9 AM",
          "4 Location Managers attend with HR facilitator",
          "Initial distribution across all locations:",
          "  Exceptional (5): 8 staff (15%)",
          "  Exceeds (4): 12 staff (23%)",
          "  Meets (3): 28 staff (54%)",
          "  Needs Improvement (2): 4 staff (8%)",
          "HR notes: Top-heavy - more 4s than typical",
          "Discussion starts with 'Exceptional' ratings:",
          "Location 1: Sarah presents Emma's case",
          "  Evidence: 100% goal completion, led 3 initiatives, promoted internally",
          "  Group consensus: Confirmed as Exceptional",
          "Location 2: Tom rated Exceptional",
          "  Evidence reviewed: Goals met but no stretch, good performer",
          "  Discussion: Better fit for 'Exceeds' - not exceptional evidence",
          "  Manager agrees to adjust with documented reason",
          "Process continues through all 52 reviews",
          "Adjustments made to 6 ratings (12%):",
          "  3 moved from 4 to 3 (evidence insufficient)",
          "  2 moved from 3 to 4 (manager undersold)",
          "  1 moved from 5 to 4 (discussed above)",
          "Final calibrated distribution:",
          "  Exceptional: 6 (12%)",
          "  Exceeds: 9 (17%)",
          "  Meets: 33 (63%)",
          "  Needs Improvement: 4 (8%)",
          "All changes documented in system",
          "Ratings locked - managers proceed to employee conversations"
        ],
        outcome: "Fair, consistent ratings across organization. Evidence-based decisions documented. Employee trust in process maintained."
      }
    },

    // ============================================================================
    // SECTION 3: 360° FEEDBACK & PEER NOMINATIONS
    // ============================================================================
    {
      id: "US-PRF-005",
      title: "Collect 360° Feedback",
      actors: ["Employee", "Manager", "HR Business Partner"],
      description: "As a Manager, I want to collect 360° feedback for my team member from multiple sources, so that they receive comprehensive input on their strengths and development areas.",
      acceptanceCriteria: [
        "Can initiate 360 feedback request for employee",
        "Can select feedback providers (peers, direct reports, cross-functional)",
        "Providers receive anonymous survey invitation",
        "Minimum 3 responses required before results visible",
        "Aggregated results show themes and ratings",
        "Employee receives summary report (anonymous sources)"
      ],
      businessLogic: [
        "Feedback sources: Self, Manager, Peers, Direct Reports, Others",
        "Minimum responses per category for anonymity: 3",
        "Competency-based questions with rating scales",
        "Open-ended questions for qualitative feedback",
        "Results aggregated to prevent identification",
        "Word cloud generated from open responses"
      ],
      priority: "high",
      relatedModules: [
        { module: "Reviews", relationship: "360 results can inform review discussions" },
        { module: "Development", relationship: "Feedback themes drive development focus" }
      ],
      endToEndJourney: [
        "1. Manager Sarah wants 360 feedback for Lead Staff Emma",
        "2. Opens Emma's profile and clicks '360° Feedback'",
        "3. Selects feedback type: 'Leadership Competencies'",
        "4. Nominates 6 peer colleagues, 2 junior staff, 1 external contact",
        "5. System sends anonymous survey invitations",
        "6. Survey includes 10 competency questions + 2 open-ended",
        "7. Over 2 weeks, 8 of 9 invitees complete surveys",
        "8. System generates aggregated report",
        "9. Shows ratings by competency with anonymous distribution",
        "10. 'Communication': Average 4.2, range 3-5",
        "11. 'Team Leadership': Average 3.8, range 3-4",
        "12. Open responses show themes: 'supportive', 'organized', 'could delegate more'",
        "13. Sarah reviews results with HR before sharing",
        "14. Schedules meeting with Emma to share feedback",
        "15. Emma receives report showing strengths and development areas",
        "16. Together they identify 2 development priorities"
      ],
      realWorldExample: {
        scenario: "Lead Staff Emma is being considered for a Coordinator role. Sarah gathers 360 feedback to assess her leadership readiness.",
        steps: [
          "Sarah opens 360 Feedback tool for Emma",
          "Selects 'Leadership Assessment' template",
          "Nominates 5 peer colleagues who work closely with Emma",
          "Nominates 3 junior staff who Emma supervises",
          "Adds 1 external contact for external perspective",
          "Submits request - 9 people receive anonymous surveys",
          "Survey asks about communication, decision-making, teamwork, etc.",
          "Over 10 days, 7 responses come in (78% response rate)",
          "System shows: Minimum 3 peer responses achieved ✓",
          "Report generates with aggregated results",
          "Strong areas: 'Supportive of team' 4.5/5, 'Organized' 4.3/5",
          "Development areas: 'Delegation' 3.2/5, 'Difficult conversations' 3.4/5",
          "Open comments: 'Takes on too much herself', 'Could coach more'",
          "Sarah reviews with HR - patterns are clear",
          "Shares with Emma: 'You're seen as very supportive'",
          "'Development area: trusting team and delegating more'",
          "Emma adds 'Delegation skills' to her development plan",
          "They agree on stretch assignment to practice delegation"
        ],
        outcome: "Emma receives comprehensive, anonymous feedback that highlights both strengths and specific development areas, informing her growth path."
      }
    },
    {
      id: "US-PRF-006",
      title: "Nominate Peers for 360° Feedback Review",
      actors: ["Employee", "Manager"],
      description: "As an Employee, I want to nominate peers to provide feedback on my performance, so that I receive comprehensive multi-source input during my review cycle.",
      acceptanceCriteria: [
        "Can nominate peers during active review cycle",
        "Must specify relationship type (peer, mentor, project collaborator)",
        "Must provide reason for nomination",
        "Manager receives nomination for approval",
        "Manager can approve, reject, or add additional nominators",
        "Approved nominators receive feedback request"
      ],
      businessLogic: [
        "Maximum nominations per cycle: Configurable (default 5)",
        "Relationship types: Peer, Cross-functional, Project Collaborator, Mentor",
        "Manager approval required within 48 hours or auto-escalates",
        "Rejection requires reason visible to employee",
        "Approved nominations create feedback requests with deadline",
        "Nomination deadline typically 2 weeks before review"
      ],
      priority: "medium",
      relatedModules: [
        { module: "Reviews", relationship: "Nominations feed into 360° portion of review" },
        { module: "Notifications", relationship: "Approvals and reminders sent" }
      ],
      endToEndJourney: [
        "1. Review cycle opens, Emma receives notification",
        "2. System prompts: 'Nominate peers for your 360° feedback'",
        "3. Emma opens nomination screen",
        "4. Searches for colleague Tom",
        "5. Selects relationship: 'Project Collaborator'",
        "6. Adds reason: 'Worked together on Q3 initiative'",
        "7. Nominates 3 more colleagues with reasons",
        "8. Submits nominations",
        "9. Manager Sarah receives approval request",
        "10. Reviews Emma's 4 nominations",
        "11. Approves 3, rejects 1 (no direct work interaction)",
        "12. Adds 2 additional nominators Sarah suggests",
        "13. 5 approved nominators receive feedback invitations",
        "14. Emma sees nomination status: 3 approved, 1 rejected",
        "15. Rejected nomination shows reason: 'Limited direct collaboration'"
      ],
      realWorldExample: {
        scenario: "Annual review cycle allows employees to nominate peers for feedback. Emma nominates colleagues she's worked with.",
        steps: [
          "Emma logs in during nomination period",
          "Sees: 'Nominate up to 5 peers for feedback'",
          "Nominates Tom (project partner), Maria (mentor), David (cross-team)",
          "Also nominates Alex (casual acquaintance)",
          "Sarah reviews nominations next day",
          "Approves Tom, Maria, David - clear working relationships",
          "Rejects Alex: 'Insufficient collaboration for meaningful feedback'",
          "Sarah adds: Lisa (frequent collaborator) and John (internal customer)",
          "Final list: 5 approved nominators",
          "All receive anonymous survey invitation",
          "Responses inform Emma's 360° feedback section"
        ],
        outcome: "Employee-nominated peers provide relevant feedback. Manager oversight ensures quality nominations."
      }
    },

    // ============================================================================
    // SECTION 4: RECOGNITION & REWARDS
    // ============================================================================
    {
      id: "US-PRF-007",
      title: "Recognize Colleague and Award Points",
      actors: ["Employee"],
      description: "As an Employee, I want to recognize a colleague's great work and award them points, so that I can show appreciation and they can earn rewards.",
      acceptanceCriteria: [
        "Can send praise to any colleague",
        "Must select a culture value the praise relates to",
        "Can optionally attach a badge",
        "Can optionally award points (within allowance)",
        "Praise posts to public praise wall",
        "Recipient receives notification",
        "Points add to recipient's balance"
      ],
      businessLogic: [
        "Each employee has monthly point-giving allowance (e.g., 100 points)",
        "Unused points do not roll over",
        "Points received accumulate in personal balance",
        "Points can be redeemed from reward catalog",
        "Praise visibility: Public (wall) or Private (recipient only)",
        "Culture values configured by organization"
      ],
      priority: "medium",
      relatedModules: [
        { module: "Rewards", relationship: "Points redeemable in reward catalog" },
        { module: "Engagement", relationship: "Recognition volume tracked as engagement metric" }
      ],
      endToEndJourney: [
        "1. Staff member Tom notices Emma handled a difficult situation brilliantly",
        "2. Opens Performance module and clicks 'Give Praise'",
        "3. Searches for Emma and selects her",
        "4. Types message: 'Amazing job today! You stayed calm and resolved the issue completely.'",
        "5. Selects culture value: 'Excellence in Service'",
        "6. Chooses badge: 'Problem Solver' 🌟",
        "7. Awards 25 points from his monthly allowance",
        "8. Selects visibility: Public (Praise Wall)",
        "9. Clicks 'Send Praise'",
        "10. Emma receives notification: 'Tom praised you!'",
        "11. Praise appears on public wall visible to all staff",
        "12. Colleagues can like and comment on the praise",
        "13. Emma's points balance increases by 25",
        "14. Tom's remaining allowance shows 75 points",
        "15. Emma later redeems 100 points for a café voucher"
      ],
      realWorldExample: {
        scenario: "After a challenging morning with an upset customer, Emma handled the situation professionally. Tom wants to publicly recognize her.",
        steps: [
          "Morning at the office - a customer is very upset about an issue",
          "Emma calmly listens, empathizes, and finds a solution",
          "Customer leaves satisfied and later sends a thank-you email",
          "Tom witnessed the interaction and is impressed",
          "At lunch, Tom opens the app and clicks 'Give Praise'",
          "Searches 'Emma' and selects her profile",
          "Writes: 'Amazing job with that customer this morning! Your calm approach and genuine empathy turned a tough situation into a positive. Real leadership! 👏'",
          "Selects value: 'Customer First'",
          "Picks badge: '⭐ Star Performer'",
          "Awards 30 points (he has 100 monthly allowance)",
          "Posts to public Praise Wall",
          "Emma gets push notification: 'Tom recognized you!'",
          "Opens app to see the praise with 3 likes already",
          "Sarah (manager) comments: 'Well deserved!'",
          "Emma's points balance: now 75 points total",
          "At 100 points, she'll redeem for a movie voucher"
        ],
        outcome: "Emma's excellent behavior is publicly celebrated. The recognition reinforces company values and contributes to positive culture."
      }
    },
    {
      id: "US-PRF-008",
      title: "Redeem Recognition Points for Rewards",
      actors: ["Employee"],
      description: "As an Employee, I want to redeem my accumulated recognition points for rewards from the company catalog, so that I receive tangible benefits for my contributions.",
      acceptanceCriteria: [
        "Can view current point balance",
        "Can browse reward catalog by category",
        "Rewards show point cost and availability",
        "Can redeem points for selected reward",
        "Redemption creates fulfillment request",
        "History shows all redemptions"
      ],
      businessLogic: [
        "Points earned through peer recognition",
        "Points expire after 12 months if not redeemed",
        "Catalog includes gift cards, experiences, merchandise",
        "Some rewards may require approval (high value)",
        "Fulfillment typically within 48 hours",
        "Insufficient points shows 'save more' progress"
      ],
      priority: "medium",
      relatedModules: [
        { module: "Recognition", relationship: "Points earned from praise posts" },
        { module: "HR", relationship: "Fulfillment processed by HR team" }
      ],
      endToEndJourney: [
        "1. Emma checks her point balance: 450 points",
        "2. Opens 'Rewards Catalog' section",
        "3. Browses categories: Experiences, Gift Cards, Merchandise",
        "4. Filters by 'Under 500 points'",
        "5. Sees 'Spa day voucher' - 400 points",
        "6. Clicks to view details",
        "7. Description: '$80 voucher for partner spa'",
        "8. Availability: In stock",
        "9. Clicks 'Redeem for 400 points'",
        "10. Confirmation: 'Are you sure? Balance will be 50 points'",
        "11. Confirms redemption",
        "12. Success message: 'Redemption submitted!'",
        "13. HR receives fulfillment request",
        "14. Next day: Emma receives spa voucher via email",
        "15. Balance shows 50 points, redemption in history"
      ],
      realWorldExample: {
        scenario: "After accumulating points over 3 months, Emma has enough for a meaningful reward.",
        steps: [
          "Emma accumulated 450 points from peer recognition",
          "Opens Rewards Catalog on Friday afternoon",
          "Browses 'Experiences' category",
          "Sees options: Movie tickets (100 pts), Dinner voucher (300 pts), Spa day (400 pts)",
          "Interested in Spa day voucher",
          "Clicks through to see details",
          "Value: $80 at partner spa, valid 12 months",
          "Emma selects 'Spa day voucher'",
          "Details show: Value $80, points 400, in stock",
          "Clicks 'Redeem'",
          "Pop-up: 'Confirm redemption of 400 points?'",
          "Emma confirms",
          "Success! Balance now: 50 points",
          "Email notification sent immediately",
          "HR team receives fulfillment request",
          "Within 24 hours, Emma receives:",
          "  - Email with spa voucher code",
          "  - Valid for 12 months at partner spa",
          "Emma books her spa day for the weekend"
        ],
        outcome: "Recognition translated into tangible reward. Emma feels valued. Motivation reinforced through reward system."
      }
    },

    // ============================================================================
    // SECTION 5: LEARNING MANAGEMENT SYSTEM (LMS)
    // ============================================================================
    {
      id: "US-PRF-009",
      title: "Complete Learning Path and Earn Certificate",
      actors: ["Employee", "Learning Administrator"],
      description: "As an Employee, I want to complete a learning path with multiple courses and earn a certificate, so that I can develop new skills and have my achievement recognized.",
      acceptanceCriteria: [
        "Can view assigned learning paths with course list",
        "Courses show duration, modules, and progress",
        "Must complete courses in defined sequence (if required)",
        "Each course has modules with content and assessments",
        "Assessment must be passed to complete course",
        "Path completion triggers certificate issuance",
        "Certificate shows in employee profile"
      ],
      businessLogic: [
        "Learning paths contain 2-10 courses",
        "Sequential paths require course completion in order",
        "Non-sequential allows any order",
        "Course progress: percentage of modules completed",
        "Assessment passing score configurable (default 70%)",
        "Certificate auto-generated with unique number",
        "Certificates may have expiry dates for compliance"
      ],
      priority: "high",
      relatedModules: [
        { module: "Skills", relationship: "Course completion updates skill proficiency" },
        { module: "Goals", relationship: "Linked goals auto-complete when course finishes" }
      ],
      endToEndJourney: [
        "1. Manager assigns 'Leadership Foundations' path to Emma",
        "2. Path contains 5 courses: Communication, Delegation, Feedback, Coaching, Conflict",
        "3. Emma receives notification of assignment",
        "4. Opens Learning module and sees path",
        "5. Path shows sequential completion required",
        "6. Starts Course 1: Communication",
        "7. Course has 4 modules: Videos, Readings, Practice, Assessment",
        "8. Completes modules 1-3, takes Module 4 assessment",
        "9. Scores 85% - passes course",
        "10. Course 1 marked complete, Course 2 unlocks",
        "11. Over 6 weeks, completes all 5 courses",
        "12. System generates 'Leadership Foundations Certificate'",
        "13. Certificate shows name, date, unique ID",
        "14. Appears in Emma's profile under Certifications",
        "15. Manager receives notification of completion",
        "16. Emma's skill profile updates: Leadership - Intermediate"
      ],
      realWorldExample: {
        scenario: "Emma is preparing for a senior role and needs to complete the Leadership Foundations learning path required for promotion.",
        steps: [
          "Manager assigns 'Leadership Foundations' path to Emma",
          "Path includes 5 courses totalling 20 hours of learning",
          "Emma receives email: 'New Learning Path Assigned'",
          "Opens LMS and sees the path with 5 locked courses",
          "Course 1 'Communication Excellence' is unlocked (sequential path)",
          "Emma starts Course 1 - estimates 4 hours to complete",
          "Module 1: 30-minute video on active listening",
          "Module 2: Reading on communication styles",
          "Module 3: Interactive scenario practice",
          "Module 4: 20-question assessment",
          "Emma scores 88% on assessment - Course 1 complete!",
          "Course 2 'Delegation Skills' unlocks",
          "Over 6 weeks, Emma completes all 5 courses",
          "Final course 'Conflict Resolution' - scores 92%",
          "System generates certificate with unique ID: LEAD-2026-00847",
          "Certificate appears in Emma's profile",
          "Manager sees completion in dashboard",
          "Emma's goal 'Complete Leadership Path' auto-updates to 100%",
          "Profile shows: 'Leadership - Intermediate' skill"
        ],
        outcome: "Emma completes structured leadership development with verified assessment. Achievement is certified, tracked, and contributes to promotion readiness."
      }
    },
    {
      id: "US-PRF-010",
      title: "Bulk Assign Learning Paths to Team",
      actors: ["Manager", "Learning Administrator"],
      description: "As a Manager, I want to bulk-assign a learning path to multiple team members with due dates, so that I can efficiently develop team capabilities.",
      acceptanceCriteria: [
        "Can select multiple staff members for assignment",
        "Staff list immediately visible when opening assignment",
        "'Select All' option available for quick selection",
        "Can set optional due date for completion",
        "Assigned staff receive notifications",
        "Dashboard shows assignment progress across team"
      ],
      businessLogic: [
        "Assignment creates enrollment record per staff",
        "Due date optional but recommended",
        "Overdue assignments flagged in reports",
        "Manager can extend due dates for individuals",
        "Progress tracked at path and course level",
        "Completion rates visible in team analytics"
      ],
      priority: "high",
      relatedModules: [
        { module: "Notifications", relationship: "Staff notified of new assignments" },
        { module: "Reporting", relationship: "Completion rates tracked" }
      ],
      endToEndJourney: [
        "1. Manager Sarah opens Learning Management",
        "2. Selects 'Compliance Training 2026' learning path",
        "3. Clicks 'Assign to Staff'",
        "4. Staff list appears immediately with checkboxes",
        "5. Clicks 'Select All' for her team of 12",
        "6. Unchecks 2 who already completed last year",
        "7. Sets due date: 28 February 2026",
        "8. Adds note: 'Required for annual compliance'",
        "9. Clicks 'Assign'",
        "10. Confirmation: '10 staff assigned'",
        "11. All 10 receive email notification",
        "12. Dashboard shows: 0% complete, 10 enrolled",
        "13. Sarah monitors progress weekly",
        "14. At due date: 9 complete, 1 overdue",
        "15. Extends due date for overdue staff member"
      ],
      realWorldExample: {
        scenario: "Annual compliance training must be completed by all staff. Sarah assigns the required path to her team.",
        steps: [
          "February 1: Sarah opens Learning Path assignment",
          "Selects 'Annual Compliance 2026' path",
          "Clicks 'Assign' button",
          "Staff list shows immediately",
          "Clicks 'Select All' - 12 staff selected",
          "Filters out 2 contractors not requiring training",
          "Sets due date: 28 February",
          "Adds message: 'Please complete by month-end for compliance'",
          "Submits assignment",
          "10 staff receive email with due date",
          "Dashboard shows 0/10 complete",
          "Week 2: 6/10 complete",
          "Week 3: 9/10 complete",
          "1 staff member on leave - extends to 15 March",
          "Final completion: 10/10",
          "Compliance report shows 100% team completion"
        ],
        outcome: "Efficient bulk assignment ensures team compliance. Progress tracking enables proactive management."
      }
    },

    // ============================================================================
    // SECTION 6: TALENT ASSESSMENT & 9-BOX GRID
    // ============================================================================
    {
      id: "US-PRF-011",
      title: "Map Talent on 9-Box Grid",
      actors: ["Manager", "HR Business Partner", "Senior Manager"],
      description: "As a Senior Manager, I want to map my organization's talent on a 9-Box Grid, so that I can identify high-potentials, plan succession, and allocate development resources effectively.",
      acceptanceCriteria: [
        "Can view 9-Box Grid for department or organization",
        "Employees plotted based on performance and potential ratings",
        "Can drag employees between boxes with justification",
        "Can filter by department, role, tenure",
        "Each box shows count and names",
        "Can identify high-potentials and at-risk talent",
        "Grid exports for talent review meetings"
      ],
      businessLogic: [
        "X-axis: Performance (Low, Medium, High)",
        "Y-axis: Potential (Low, Medium, High)",
        "9 boxes with labels: Star, High Potential, Core Player, etc.",
        "Performance from most recent review rating",
        "Potential assessed separately by manager",
        "Box moves trigger notification to HR",
        "Historical box position tracked for trends"
      ],
      priority: "high",
      relatedModules: [
        { module: "Succession", relationship: "High-potential talent feeds succession pools" },
        { module: "Development", relationship: "Box position informs development investment" }
      ],
      endToEndJourney: [
        "1. HR initiates annual talent review cycle",
        "2. Managers assess potential for each team member",
        "3. Potential assessment includes leadership, learning agility, aspiration",
        "4. Performance comes from completed annual reviews",
        "5. System auto-plots employees on 9-Box Grid",
        "6. Operations Director opens Organization 9-Box view",
        "7. Sees 150 employees distributed across boxes",
        "8. Top-right box (High Performance/High Potential): 12 'Stars'",
        "9. Bottom-left box (Low/Low): 3 employees flagged",
        "10. Clicks into 'Stars' box to see names",
        "11. Emma appears - strong performer, high potential",
        "12. Clicks Emma to see profile and development status",
        "13. Filters grid to show specific department only",
        "14. Exports filtered grid for talent review meeting",
        "15. In meeting, discusses each quadrant's development needs",
        "16. Action: Accelerate 'Stars' into leadership programs"
      ],
      realWorldExample: {
        scenario: "Organization conducts annual talent review to identify future leaders and plan development investments.",
        steps: [
          "HR launches talent assessment in January",
          "All managers assess potential for their direct reports",
          "Assessment covers: Leadership capability, Learning agility, Ambition, Engagement",
          "Each dimension rated 1-5, rolls up to overall potential score",
          "Combined with performance rating from November review",
          "System generates 9-Box Grid for organization",
          "Distribution shows:",
          "  - Stars (top-right): 8 employees (5%)",
          "  - High Potentials (top-middle): 15 employees (10%)",
          "  - Core Players (center): 92 employees (61%)",
          "  - Underperformers (bottom-left): 5 employees (3%)",
          "HR facilitates talent review with leadership team",
          "Discuss each 'Star' - development plans and retention strategies",
          "Identify Emma as ready for Coordinator role within 12 months",
          "Create action plan: leadership course, mentor assignment, acting role",
          "Discuss underperformers - 2 have improvement plans, 3 need support",
          "Export grid for board talent update",
          "Track movement quarterly - goal: 10% in 'Star' box by year-end"
        ],
        outcome: "Organization has clear view of talent distribution. 8 'Stars' identified for accelerated development. 5 underperformers receive targeted support."
      }
    },

    // ============================================================================
    // SECTION 7: SUCCESSION PLANNING
    // ============================================================================
    {
      id: "US-PRF-012",
      title: "Identify Succession Candidates for Key Roles",
      actors: ["Senior Manager", "HR Business Partner"],
      description: "As an HR Business Partner, I want to identify and track succession candidates for critical roles, so that leadership continuity is ensured.",
      acceptanceCriteria: [
        "Can define key roles requiring succession planning",
        "Can add candidates with readiness levels",
        "Readiness buckets: Ready Now, 1-2 Years, 3+ Years, Not Ready",
        "Can identify competency gaps per candidate",
        "Can link development actions to close gaps",
        "Pipeline visualization shows bench strength"
      ],
      businessLogic: [
        "Key roles: Positions critical to business continuity",
        "Readiness assessment considers: Skills, experience, performance, aspiration",
        "Minimum 2 candidates recommended per key role",
        "Bench strength: Percentage of roles with ready-now candidates",
        "Competency gaps drive development priorities",
        "Candidates must consent to succession tracking"
      ],
      priority: "high",
      relatedModules: [
        { module: "9-Box Grid", relationship: "High-potential talent feeds succession pools" },
        { module: "Development", relationship: "Gap closure drives development plans" }
      ],
      endToEndJourney: [
        "1. HR defines key roles: All Manager positions",
        "2. For 'Operations Manager' role:",
        "3. Adds Candidate 1: Emma - Ready in 1-2 Years",
        "4. Adds Candidate 2: Tom - Ready in 3+ Years",
        "5. Assesses Emma's competency gaps:",
        "6. Gap 1: Budget management (current: Intermediate, required: Advanced)",
        "7. Gap 2: Strategic planning (current: Basic, required: Intermediate)",
        "8. Creates development actions:",
        "9. Action 1: Finance for Managers course",
        "10. Action 2: Shadow current manager on quarterly planning",
        "11. Links actions to Emma's development plan",
        "12. Pipeline view shows: Operations Manager has 2 candidates",
        "13. Bench strength: 1 ready in 1-2 years",
        "14. Emma progresses through development actions",
        "15. After 18 months, moves to 'Ready Now' bucket"
      ],
      realWorldExample: {
        scenario: "Organization's Operations Manager is approaching retirement. HR ensures succession pipeline is robust.",
        steps: [
          "Current Operations Manager retiring in 24 months",
          "HR opens succession planning for this role",
          "Reviews 9-Box Grid for high-potential candidates",
          "Identifies 3 potential successors:",
          "  Emma: High performer, 5 years tenure, strong leadership",
          "  Tom: Solid performer, 8 years tenure, deep technical knowledge",
          "  Maria: High potential, 3 years tenure, fast learner",
          "Assesses readiness for each:",
          "  Emma: Ready in 12-18 months (1-2 Years bucket)",
          "  Tom: Ready in 24+ months (3+ Years bucket)",
          "  Maria: Ready in 24+ months (3+ Years bucket)",
          "Deep-dive on Emma's gaps:",
          "  Budget management: Gap of 2 levels",
          "  Stakeholder management: Gap of 1 level",
          "Creates development plan:",
          "  Q1: Finance for Managers course",
          "  Q2: Acting manager during vacation coverage",
          "  Q3: Lead budget planning for department",
          "  Q4: External leadership program",
          "Pipeline shows: Bench strength 67% (1 of 3 roles have ready-now)",
          "Monthly tracking of development progress",
          "Month 18: Emma moves to 'Ready Now'"
        ],
        outcome: "Clear succession pipeline with development roadmap. When retirement occurs, qualified successor is prepared."
      }
    },

    // ============================================================================
    // SECTION 8: ENGAGEMENT & WELLBEING
    // ============================================================================
    {
      id: "US-PRF-013",
      title: "Complete Pulse Survey and Track eNPS",
      actors: ["Employee", "HR Business Partner"],
      description: "As an Employee, I want to complete quick pulse surveys about my engagement, so that the organization can respond to workforce sentiment in real-time.",
      acceptanceCriteria: [
        "Survey contains 5-10 quick questions",
        "eNPS question included: 'How likely to recommend?'",
        "Can complete on mobile in under 2 minutes",
        "Responses are anonymous with aggregation thresholds",
        "Results available to HR with department breakdown",
        "Trends tracked over time (monthly, quarterly)"
      ],
      businessLogic: [
        "eNPS scale: 0-10 (Detractor: 0-6, Passive: 7-8, Promoter: 9-10)",
        "eNPS = % Promoters - % Detractors",
        "Minimum 5 responses per group for anonymity",
        "Survey frequency: Weekly, bi-weekly, or monthly",
        "Questions rotate from question bank",
        "Results suppressed if response count < threshold"
      ],
      priority: "high",
      relatedModules: [
        { module: "Analytics", relationship: "eNPS trends on executive dashboard" },
        { module: "Actions", relationship: "Low scores can trigger action plans" }
      ],
      endToEndJourney: [
        "1. Employee receives push notification: 'Quick pulse check'",
        "2. Opens app and sees 5-question survey",
        "3. Q1: 'I feel valued at work' - Selects 4/5",
        "4. Q2: 'My manager supports my development' - 5/5",
        "5. Q3: 'I have the tools I need' - 3/5",
        "6. Q4: 'Work-life balance is good' - 4/5",
        "7. Q5 (eNPS): 'How likely to recommend as employer?' - 8/10",
        "8. Optional comment: 'Need better equipment'",
        "9. Submits survey (90 seconds total)",
        "10. Thank you message displayed",
        "11. HR views aggregated results next week",
        "12. eNPS: +35 (65% promoters, 30% detractors)",
        "13. 'Tools' question flags for attention (avg 3.2)"
      ],
      realWorldExample: {
        scenario: "Organization runs monthly pulse surveys to track employee sentiment. This month's focus includes the new systems.",
        steps: [
          "First Monday of month: Pulse survey goes live",
          "All 52 staff receive push notification",
          "Emma opens her app during lunch break",
          "Survey appears: '5 quick questions about your experience'",
          "Q1: 'I feel valued at work' - Emma rates 4",
          "Q2: 'My manager supports my development' - rates 5",
          "Q3: 'I have the resources I need to do my job well' - rates 3",
          "Q4: 'I feel connected to our mission' - rates 5",
          "Q5: 'How likely are you to recommend us as an employer?' - rates 8",
          "Optional comment box: 'Love the team, but our equipment is slow'",
          "Submits - total time: 75 seconds",
          "By Friday: 45 of 52 staff completed (87% response)",
          "HR views results:",
          "  eNPS: +42 (excellent)",
          "    Promoters (9-10): 52%",
          "    Passives (7-8): 38%",
          "    Detractors (0-6): 10%",
          "  Lowest score: 'Resources' - 3.4 avg",
          "  Comments theme: Equipment concerns",
          "HR flags IT equipment issue for leadership",
          "Action plan created: Equipment replacement program",
          "Next month's survey tracks improvement"
        ],
        outcome: "Real-time engagement insights reveal actionable issue. Organization responds to equipment concerns. Staff feel heard."
      }
    },
    {
      id: "US-PRF-014",
      title: "Track Wellbeing and Burnout Risk",
      actors: ["Employee", "Manager", "HR Business Partner"],
      description: "As an HR Business Partner, I want to monitor wellbeing indicators and burnout risk across the organization, so that we can proactively support staff.",
      acceptanceCriteria: [
        "Employees can log daily mood and energy levels",
        "System calculates burnout risk from multiple factors",
        "Dashboard shows wellbeing trends by team",
        "High-risk individuals flagged for manager attention",
        "Integration with workload data from roster",
        "Confidential support resources surfaced when needed"
      ],
      businessLogic: [
        "Burnout risk factors: High hours, low breaks, consecutive days",
        "Mood tracking optional and private by default",
        "Aggregate trends visible to managers (not individual data)",
        "High-risk threshold triggers confidential alert to HR",
        "Resources include EAP, flexible work options",
        "Trend analysis compares to industry benchmarks"
      ],
      priority: "medium",
      relatedModules: [
        { module: "Roster", relationship: "Workload data feeds burnout calculation" },
        { module: "Leave", relationship: "Leave patterns inform wellbeing analysis" }
      ],
      endToEndJourney: [
        "1. Emma opens Wellbeing Check-in on mobile",
        "2. Daily prompt: 'How are you feeling today?'",
        "3. Selects mood: 😐 (neutral)",
        "4. Energy level: 3/5 (moderate)",
        "5. Optional note: 'Busy week, feeling stretched'",
        "6. Submits check-in",
        "7. System notes: Third consecutive low energy day",
        "8. Combined with: 45+ hours last week",
        "9. Burnout risk calculation: Elevated",
        "10. Emma receives: 'Consider taking a break'",
        "11. HR dashboard shows: 1 staff elevated risk",
        "12. HR contacts manager for discrete check-in",
        "13. Manager offers flexible schedule options",
        "14. Emma's workload adjusted for recovery",
        "15. Risk level returns to normal next week"
      ],
      realWorldExample: {
        scenario: "End of quarter push has staff working extended hours. Wellbeing monitoring identifies at-risk individuals.",
        steps: [
          "Q4 deadline approaching, workloads increasing",
          "HR monitors wellbeing dashboard weekly",
          "Dashboard shows: 3 staff with elevated burnout risk",
          "Risk factors identified:",
          "  - Consecutive 50+ hour weeks",
          "  - No leave taken in 60+ days",
          "  - Declining mood check-in scores",
          "HR notifies respective managers",
          "Manager Sarah discretely checks in with Emma",
          "Discovers: Emma covering for colleague on leave",
          "Adjusts workload: Redistributes tasks",
          "Encourages Emma to take 2 mental health days",
          "Emma's risk score decreases next week",
          "Post-quarter analysis shows early intervention prevented burnout",
          "Policy updated: Mandatory coverage limits during peak periods"
        ],
        outcome: "Proactive monitoring prevents burnout. Early intervention protects employee wellbeing and retention."
      }
    },

    // ============================================================================
    // SECTION 9: 1:1 CONVERSATIONS
    // ============================================================================
    {
      id: "US-PRF-015",
      title: "Schedule and Document 1:1 Conversations",
      actors: ["Manager", "Employee"],
      description: "As a Manager, I want to schedule regular 1:1 conversations with my team and document the discussions, so that I maintain consistent coaching relationships and track commitments.",
      acceptanceCriteria: [
        "Can schedule recurring 1:1 with frequency options",
        "Can integrate video meeting link (Zoom, Teams, Meet)",
        "Both parties can add agenda items before meeting",
        "Can capture notes during or after meeting",
        "Can create action items with owners and due dates",
        "History shows all past 1:1s with notes"
      ],
      businessLogic: [
        "Frequency options: Weekly, bi-weekly, monthly",
        "Calendar integration creates recurring events",
        "Agenda visible to both parties",
        "Notes captured with timestamps",
        "Action items carry forward until complete",
        "Meeting completion tracked in manager dashboard"
      ],
      priority: "high",
      relatedModules: [
        { module: "Calendar", relationship: "Meetings synced to calendar" },
        { module: "Goals", relationship: "Goal progress discussed in 1:1s" }
      ],
      endToEndJourney: [
        "1. Manager Sarah creates 1:1 series with Emma",
        "2. Selects: Bi-weekly, Friday 2 PM, 30 minutes",
        "3. Chooses template: 'Development Focus'",
        "4. Adds Zoom link for remote flexibility",
        "5. System creates calendar events for next 3 months",
        "6. Both receive invites",
        "7. Emma adds agenda items before first meeting:",
        "8. - Progress on leadership course",
        "9. - Challenge with delegation",
        "10. - Career path discussion",
        "11. Sarah adds:",
        "12. - Review Q1 goals progress",
        "13. - Feedback from recent project",
        "14. Meeting happens, Sarah captures notes:",
        "15. - Emma completed 2 of 5 modules ✓",
        "16. - Struggling to delegate programming tasks",
        "17. Creates action: 'Practice delegation with one task'",
        "18. Next 1:1 shows action items for follow-up"
      ],
      realWorldExample: {
        scenario: "Sarah establishes regular 1:1s with Emma who is preparing for a senior role. They use the time for coaching and progress reviews.",
        steps: [
          "Sarah opens Activities > 1:1 Conversations",
          "Clicks 'Schedule New 1:1'",
          "Selects: Emma Wilson",
          "Frequency: Bi-weekly (every 2 weeks)",
          "Day/Time: Friday 2:00 PM",
          "Duration: 30 minutes",
          "Adds Microsoft Teams meeting link",
          "Template: Development Focus",
          "System creates recurring calendar events",
          "Both receive calendar invites",
          "First 1:1 approaching...",
          "Emma adds agenda items:",
          "  - Progress on leadership course",
          "  - Challenge with delegation",
          "  - Career path discussion",
          "Sarah adds:",
          "  - Review Q1 goals progress",
          "  - Feedback from recent project",
          "Friday 2 PM: Meeting happens via Teams",
          "Sarah captures notes in system:",
          "  - Emma completed 2 of 5 modules ✓",
          "  - Struggling to delegate tasks",
          "  - Discussed strategies for trust-building",
          "Creates action items:",
          "  - Emma: Practice delegation with one task next week",
          "  - Sarah: Share delegation framework article",
          "Meeting ends, summary emailed to both",
          "Next 1:1 shows previous action items for review"
        ],
        outcome: "Consistent coaching relationship established. All discussions documented for continuity. Progress tracked over time."
      }
    },

    // ============================================================================
    // SECTION 10: PERFORMANCE IMPROVEMENT PLANS (PIP)
    // ============================================================================
    {
      id: "US-PRF-016",
      title: "Create and Manage PIP",
      actors: ["Manager", "HR Business Partner"],
      description: "As a Manager, I want to create a Performance Improvement Plan for an underperforming employee with clear milestones, so that they have a structured path to success with documented expectations.",
      acceptanceCriteria: [
        "Can initiate PIP with reason and duration",
        "Must define specific improvement milestones",
        "Each milestone has target date and success criteria",
        "Regular check-ins scheduled automatically",
        "Check-ins capture progress ratings and notes",
        "At conclusion, formal outcome recorded",
        "HR visibility throughout process"
      ],
      businessLogic: [
        "PIP duration typically 30, 60, or 90 days",
        "Minimum 3 milestones required",
        "Check-in frequency: weekly minimum",
        "Outcomes: Successful, Extended, Unsuccessful",
        "Unsuccessful outcome triggers offboarding workflow",
        "All documentation retained for legal compliance",
        "HR approval required to initiate and conclude"
      ],
      priority: "high",
      relatedModules: [
        { module: "Reviews", relationship: "Low review rating may trigger PIP" },
        { module: "HR", relationship: "HR oversight for compliance" }
      ],
      endToEndJourney: [
        "1. Staff member John receives poor performance review",
        "2. Manager Sarah consults with HR",
        "3. Decision: PIP appropriate for performance gaps",
        "4. Sarah opens PIP creation wizard",
        "5. Step 1: Reason - 'Consistent quality issues'",
        "6. Step 2: Duration - 60 days",
        "7. Step 3: Milestones:",
        "8. - Week 2: Complete quality training",
        "9. - Week 4: Zero defects in assigned work",
        "10. - Week 6: Positive client feedback",
        "11. - Week 8: Sustained improvement demonstrated",
        "12. Step 4: Support - Weekly coaching, training access",
        "13. HR reviews and approves PIP",
        "14. John receives formal PIP documentation",
        "15. Weekly check-ins documented with progress ratings",
        "16. Week 8: John meets all milestones",
        "17. PIP concluded as 'Successful'",
        "18. Documentation retained for records"
      ],
      realWorldExample: {
        scenario: "Staff member John has recurring quality issues. Manager initiates structured PIP with HR support.",
        steps: [
          "November review flags John's quality concerns",
          "Sarah discusses with HR Business Partner",
          "Decision: 60-day PIP with clear milestones",
          "Sarah opens PIP wizard in system",
          "Documents reason: 'Quality below standard, 5 incidents in Q4'",
          "Sets duration: 60 days (Jan 6 - Mar 6)",
          "Creates 4 milestones:",
          "  Week 2: Complete Quality Excellence course (LMS)",
          "  Week 4: Process 20 items with zero defects",
          "  Week 6: Receive positive feedback from supervisor",
          "  Week 8: Demonstrate sustained improvement",
          "Documents support provided:",
          "  - Weekly coaching sessions with senior colleague",
          "  - Access to quality training materials",
          "  - Reduced workload during improvement period",
          "HR reviews and approves PIP",
          "John receives formal documentation, signs acknowledgment",
          "Weekly check-ins recorded:",
          "  Week 1: Course started, positive attitude",
          "  Week 2: Course complete, early quality improvement",
          "  Week 4: 20 items processed, 1 minor issue (addressed)",
          "  Week 6: Positive feedback from supervisor",
          "  Week 8: All milestones met, consistent improvement",
          "Sarah records outcome: 'Successful - Performance improved'",
          "HR signs off, PIP closed",
          "John returns to normal performance tracking"
        ],
        outcome: "Structured improvement plan enables John's success. Documentation protects both employee and organization. HR compliance maintained."
      }
    },

    // ============================================================================
    // SECTION 11: DEVELOPMENT PLANS
    // ============================================================================
    {
      id: "US-PRF-017",
      title: "Assign and Track Development Plan",
      actors: ["Manager", "Employee", "HR Business Partner"],
      description: "As a Manager, I want to create a development plan for my team member with specific actions and resources, so that they have a clear path to grow their capabilities.",
      acceptanceCriteria: [
        "Can create development plan with focus areas",
        "Plan includes specific actions with owners and dates",
        "Can link to courses, mentors, experiences",
        "Progress tracked against each action",
        "Employee can update own progress",
        "Manager receives progress notifications"
      ],
      businessLogic: [
        "Development areas from: 360 feedback, review, career aspiration",
        "Actions types: Learn, Practice, Teach, Experience",
        "70-20-10 model encouraged: Experience, Social, Formal",
        "Links to LMS courses count as formal learning",
        "Stretch assignments count as experience",
        "Quarterly review cadence recommended"
      ],
      priority: "high",
      relatedModules: [
        { module: "LMS", relationship: "Courses linked to development actions" },
        { module: "Skills", relationship: "Development improves skill proficiency" }
      ],
      endToEndJourney: [
        "1. Manager Sarah creates development plan for Emma",
        "2. Focus area: 'Leadership and People Management'",
        "3. Based on: Career aspiration to become Coordinator",
        "4. Adds actions:",
        "5. Action 1: Complete Leadership course (Formal - 10%)",
        "6. Action 2: Shadow Sarah on budget meetings (Experience - 70%)",
        "7. Action 3: Mentor a new team member (Social - 20%)",
        "8. Sets timeline: 6 months",
        "9. Links LMS course to Action 1",
        "10. Emma receives plan notification",
        "11. Emma starts Leadership course",
        "12. Marks modules complete as she progresses",
        "13. At quarterly review, 60% complete",
        "14. Sarah adjusts timeline for Action 2 (meeting schedule changed)",
        "15. At 6 months, plan marked complete",
        "16. Emma's profile shows: Leadership skill progressed to 'Intermediate'"
      ],
      realWorldExample: {
        scenario: "Emma aspires to become a Coordinator. Sarah creates a comprehensive development plan to prepare her for the role.",
        steps: [
          "Sarah opens Emma's profile > Development section",
          "Clicks 'Create Development Plan'",
          "Plan name: 'Coordinator Preparation'",
          "Duration: 6 months (Jan - June 2026)",
          "Focus Areas:",
          "  1. Leadership & People Management",
          "  2. Budget & Financial Acumen",
          "  3. Compliance Knowledge",
          "Creates actions for each focus:",
          "Leadership:",
          "  - Complete 'Leadership Foundations' path (LMS)",
          "  - Lead team for 4 weeks during leave cover",
          "  - Mentor 2 new team members",
          "Budget:",
          "  - Shadow Sarah on monthly budget review (3 sessions)",
          "  - Take ownership of supplies budget",
          "Compliance:",
          "  - Complete Coordinator compliance module",
          "  - Lead mock audit preparation",
          "Links LMS courses to relevant actions",
          "Submits plan - Emma receives notification",
          "Emma reviews and acknowledges",
          "Monthly progress updates:",
          "  Month 1: Leadership course 40%, mentoring started",
          "  Month 2: Course complete, first budget shadow done",
          "  Month 3: Acting Team Lead role begins",
          "At 6 months: All actions complete or progressing",
          "Emma's skill profile updated:",
          "  Leadership: Novice → Intermediate",
          "  Budget Management: Added as new skill",
          "Development plan marked 'Complete'"
        ],
        outcome: "Structured development accelerates Emma's readiness. Clear milestones maintain momentum. Skill progression documented."
      }
    },

    // ============================================================================
    // SECTION 12: SKILLS & CAREER PATHING
    // ============================================================================
    {
      id: "US-PRF-018",
      title: "Track Skills Gap and Development Needs",
      actors: ["HR Business Partner", "Manager"],
      description: "As an HR Business Partner, I want to analyze skills gaps across the organization, so that I can plan learning investments and talent acquisition priorities.",
      acceptanceCriteria: [
        "Can view skills inventory across organization",
        "Gap analysis compares current vs required skills",
        "Can filter by department, role, or skill category",
        "Heat map shows critical gaps visually",
        "Recommendations link gaps to learning solutions",
        "Report exportable for planning purposes"
      ],
      businessLogic: [
        "Skills mapped to roles/positions",
        "Required level set per role (basic, intermediate, advanced)",
        "Gap = Required level - Current level",
        "Aggregated gaps show organizational priorities",
        "Links to LMS for available skill development",
        "External training flagged when internal not available"
      ],
      priority: "medium",
      relatedModules: [
        { module: "LMS", relationship: "Courses mapped to skills for gap closure" },
        { module: "Workforce Planning", relationship: "Skills gaps inform hiring priorities" }
      ],
      endToEndJourney: [
        "1. HR opens Skills Analytics dashboard",
        "2. Selects: All Staff, All Skills",
        "3. Heat map shows skills by department",
        "4. Critical gap identified: Leadership skills in Operations",
        "5. 15 staff need 'Advanced' leadership, only 5 have it",
        "6. Gap: 10 staff need development",
        "7. Drills into Leadership skill",
        "8. Shows 10 names with current vs required levels",
        "9. Recommendations appear:",
        "10. 'Leadership Foundations' course mapped (6 enrolled, 4 not)",
        "11. 'Leadership Masterclass' for advanced (0 enrolled)",
        "12. HR creates development initiative: 'Leadership 2026'",
        "13. Assigns appropriate courses to gap population",
        "14. Tracks progress quarterly"
      ],
      realWorldExample: {
        scenario: "HR is planning the 2026 learning budget and needs to understand organizational skill gaps to prioritize investments.",
        steps: [
          "HR Business Partner opens Skills Analytics",
          "Dashboard shows organization-wide view",
          "Heat map visualization:",
          "  - Green: Skills at or above required level",
          "  - Yellow: Minor gaps (1 level below)",
          "  - Red: Critical gaps (2+ levels below)",
          "Department view shows:",
          "  Operations: 3 red skills (Leadership, Budget, Compliance)",
          "  Administration: 1 red skill (Technology)",
          "  Customer Service: 2 yellow skills (Communication, Product)",
          "Clicks into 'Leadership' skill in Operations:",
          "  Required for Senior roles: Advanced level",
          "  Current state: 5 at Advanced, 10 at Intermediate, 5 at Basic",
          "  Gap: 15 staff need to progress",
          "Recommendations:",
          "  Course: 'Leadership Foundations' - Closes Intermediate gap",
          "  Course: 'Leadership Masterclass' - Closes Advanced gap",
          "  Coaching: External leadership coach program",
          "Cost estimate: $12,000 for courses, $8,000 for coaching",
          "HR creates 'Leadership Development 2026' initiative",
          "Assigns courses to 15 staff with manager notification",
          "Sets milestone: 80% completion by June",
          "Budget approved based on skills gap evidence",
          "Q2 check: 12 of 15 progressed one level",
          "Year-end: Gap reduced from 15 to 4 staff"
        ],
        outcome: "Data-driven learning investment. Skills gaps systematically closed. Workforce capability improved measurably."
      }
    },
    {
      id: "US-PRF-019",
      title: "Visualize Career Path and Progression Requirements",
      actors: ["Employee", "Manager"],
      description: "As an Employee, I want to see my potential career paths with progression requirements, so that I understand what's needed to advance.",
      acceptanceCriteria: [
        "Can view career ladder visualization",
        "Each level shows required skills and experience",
        "Current position highlighted on path",
        "Gap analysis shows what's needed for next level",
        "Can set target level and track readiness",
        "Development recommendations linked to gaps"
      ],
      businessLogic: [
        "Career paths defined by HR per job family",
        "Each level has: Title, skills, experience, qualifications",
        "Readiness score calculated from current vs required",
        "Skills from employee profile compared to level requirements",
        "Time-in-role contributes to experience",
        "Qualifications verified against HR records"
      ],
      priority: "medium",
      relatedModules: [
        { module: "Skills", relationship: "Skills contribute to readiness score" },
        { module: "Development", relationship: "Gaps drive development recommendations" }
      ],
      endToEndJourney: [
        "1. Emma opens Career Pathing tool",
        "2. Sees her current role: Senior Staff",
        "3. Visual ladder shows progression options:",
        "4. - Lead Staff (next level)",
        "5. - Coordinator",
        "6. - Manager",
        "7. Clicks 'Lead Staff' to see requirements",
        "8. Requirements: Leadership-Intermediate, Budget-Basic, 3 years experience",
        "9. Emma's readiness: 75%",
        "10. Gap: Leadership at Basic, needs Intermediate",
        "11. Recommendation: Complete Leadership course",
        "12. Emma sets 'Lead Staff' as target role",
        "13. Dashboard tracks progress toward readiness",
        "14. Completes Leadership course, readiness moves to 90%",
        "15. Manager notified when readiness reaches threshold"
      ],
      realWorldExample: {
        scenario: "Emma wants to understand what's needed to become a Coordinator. She explores career paths.",
        steps: [
          "Emma logs into Employee Portal",
          "Opens 'My Career' section",
          "Visual career ladder appears:",
          "  Current: Senior Staff (highlighted)",
          "  Next: Lead Staff",
          "  Then: Coordinator",
          "  Then: Manager",
          "Clicks 'Coordinator' to see requirements:",
          "  Skills: Leadership-Advanced, Budget-Intermediate, Compliance-Intermediate",
          "  Experience: 5+ years, 2+ years supervisory",
          "  Qualifications: Relevant certification recommended",
          "Readiness assessment:",
          "  Emma's readiness: 55%",
          "  Skills: 50% match",
          "  Experience: 80% (4 years total, 1 year supervisory)",
          "  Qualifications: 50% (working on certification)",
          "Gap analysis:",
          "  Leadership: Basic → Advanced (2 level gap)",
          "  Budget: None → Intermediate (2 level gap)",
          "  Supervisory experience: 1 more year needed",
          "Recommendations:",
          "  Enroll in 'Leadership Pathway' (links to LMS)",
          "  Complete 'Budget Fundamentals' course",
          "  Seek acting coordinator opportunity",
          "Emma sets 'Coordinator' as her target role",
          "Dashboard shows progress toward 100% readiness",
          "Manager Sarah sees Emma's career aspiration"
        ],
        outcome: "Clear visibility into career progression. Actionable recommendations for advancement. Motivated employee with growth plan."
      }
    },

    // ============================================================================
    // SECTION 13: COMPENSATION INTEGRATION
    // ============================================================================
    {
      id: "US-PRF-020",
      title: "Generate Merit Increase Recommendations from Performance",
      actors: ["HR Business Partner", "Senior Manager"],
      description: "As an HR Business Partner, I want to generate merit increase recommendations based on calibrated performance ratings, so that compensation decisions are fair and performance-linked.",
      acceptanceCriteria: [
        "Merit matrix maps performance to increase percentages",
        "System generates recommendations for all rated employees",
        "Recommendations consider compa-ratio position",
        "Managers can adjust within guidelines",
        "Budget tracking shows total cost impact",
        "Approval workflow for final sign-off"
      ],
      businessLogic: [
        "Merit matrix: Performance rating × Compa-ratio position",
        "High performers below midpoint get larger increases",
        "Low performers above midpoint get smaller/no increases",
        "Budget constraint limits total spend",
        "Manager discretion within +/- 1% of guideline",
        "Director approval for exceptions"
      ],
      priority: "medium",
      relatedModules: [
        { module: "Reviews", relationship: "Calibrated ratings feed merit calculations" },
        { module: "Compensation", relationship: "Recommendations update salary records" }
      ],
      endToEndJourney: [
        "1. Review cycle completes with calibrated ratings",
        "2. HR opens Merit Planning tool",
        "3. System loads 52 rated employees",
        "4. Merit matrix applied:",
        "5. Rating 5 + Below midpoint = 6% increase",
        "6. Rating 4 + At midpoint = 4% increase",
        "7. Rating 3 + Above midpoint = 2% increase",
        "8. Recommendations generated for each employee",
        "9. Emma: Rating 4, 5% below midpoint = 4.5% recommended",
        "10. Total cost: $125,000 (within $130,000 budget)",
        "11. Managers review their direct reports",
        "12. Sarah adjusts Emma from 4.5% to 5% (stretch performer)",
        "13. Adjustment within guidelines, no approval needed",
        "14. Director reviews and approves final allocations",
        "15. New salaries effective 1 January"
      ],
      realWorldExample: {
        scenario: "Annual merit increases linked to November review ratings. HR generates recommendations within budget.",
        steps: [
          "December: Calibrated ratings finalized for 52 staff",
          "HR opens Merit Planning dashboard",
          "Loads merit matrix for 2026:",
          "  Rating 5 (Exceptional):",
          "    Below midpoint: 6%",
          "    At midpoint: 5%",
          "    Above midpoint: 4%",
          "  Rating 4 (Exceeds):",
          "    Below midpoint: 5%",
          "    At midpoint: 4%",
          "    Above midpoint: 3%",
          "  Rating 3 (Meets):",
          "    Below midpoint: 3%",
          "    At midpoint: 2%",
          "    Above midpoint: 1%",
          "  Rating 2 (Needs Improvement): 0%",
          "System generates recommendations:",
          "  6 Exceptional: Avg 5.2% ($32K total)",
          "  15 Exceeds: Avg 4.1% ($48K total)",
          "  27 Meets: Avg 2.3% ($42K total)",
          "  4 Needs Improvement: 0%",
          "Total recommended: $122K (budget: $130K)",
          "Managers review their teams:",
          "Sarah reviews Emma: 4.5% recommended",
          "Notes strong project delivery, adjusts to 5%",
          "System tracks budget impact: Now $123K",
          "All adjustments within guidelines",
          "Director reviews and approves",
          "HR processes effective 1 January",
          "Employees notified with new salary"
        ],
        outcome: "Performance-linked merit increases. Fair process with manager input. Budget controlled."
      }
    }
  ],

  // ============================================================================
  // TABLE SPECIFICATIONS - Comprehensive Database Schema
  // ============================================================================
  tableSpecs: [
    // ============================================================================
    // GOALS SCHEMA - OKRs and Individual Goals
    // ============================================================================
    {
      name: "OKRCycles",
      schema: "performance_goals",
      description: "OKR time periods (quarters, years) for organizational alignment",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", indexed: true },
        { name: "name", type: "NVARCHAR(100)", mandatory: true, description: "Cycle name (e.g., Q1 2026, FY2026)" },
        { name: "cycle_type", type: "NVARCHAR(20)", mandatory: true, description: "quarterly, semi_annual, annual" },
        { name: "start_date", type: "DATE", mandatory: true, description: "Cycle start date" },
        { name: "end_date", type: "DATE", mandatory: true, description: "Cycle end date" },
        { name: "status", type: "NVARCHAR(20)", mandatory: true, description: "draft, active, closed", defaultValue: "'draft'" },
        { name: "is_active", type: "BIT", mandatory: true, description: "Currently active for goal creation", defaultValue: "1" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation", defaultValue: "GETUTCDATE()" },
        { name: "created_by", type: "UNIQUEIDENTIFIER", mandatory: false, description: "User who created" }
      ],
      indexes: ["IX_OKRCycles_TenantId (tenant_id)", "IX_OKRCycles_Dates (start_date, end_date)"]
    },
    {
      name: "Objectives",
      schema: "performance_goals",
      description: "OKR Objectives at company, department, team, and individual levels",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", indexed: true },
        { name: "cycle_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "OKR cycle", foreignKey: "performance_goals.OKRCycles.id", indexed: true },
        { name: "title", type: "NVARCHAR(500)", mandatory: true, description: "Objective statement" },
        { name: "description", type: "NVARCHAR(MAX)", mandatory: false, description: "Additional context and rationale" },
        { name: "level", type: "NVARCHAR(50)", mandatory: true, description: "company, department, team, individual" },
        { name: "owner_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Objective owner (staff or team)", indexed: true },
        { name: "owner_type", type: "NVARCHAR(20)", mandatory: true, description: "staff, team, department, company" },
        { name: "parent_objective_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Parent for alignment/cascading", foreignKey: "performance_goals.Objectives.id" },
        { name: "status", type: "NVARCHAR(50)", mandatory: true, description: "draft, active, completed, cancelled", defaultValue: "'draft'" },
        { name: "progress", type: "DECIMAL(5,2)", mandatory: true, description: "Overall progress 0-100", defaultValue: "0" },
        { name: "target_progress", type: "DECIMAL(5,2)", mandatory: true, description: "Expected progress at this point in cycle", defaultValue: "0" },
        { name: "is_stretch", type: "BIT", mandatory: true, description: "Whether this is a stretch/aspirational goal", defaultValue: "0" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation", defaultValue: "GETUTCDATE()" },
        { name: "updated_at", type: "DATETIME2", mandatory: true, description: "Last update", defaultValue: "GETUTCDATE()" }
      ],
      indexes: [
        "IX_Objectives_TenantCycle (tenant_id, cycle_id)",
        "IX_Objectives_OwnerId (owner_id)",
        "IX_Objectives_ParentId (parent_objective_id)",
        "IX_Objectives_Level (level)"
      ]
    },
    {
      name: "KeyResults",
      schema: "performance_goals",
      description: "Measurable Key Results for Objectives with progress tracking",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "objective_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Parent objective", foreignKey: "performance_goals.Objectives.id", indexed: true },
        { name: "title", type: "NVARCHAR(500)", mandatory: true, description: "Key result statement" },
        { name: "description", type: "NVARCHAR(MAX)", mandatory: false, description: "Measurement details" },
        { name: "result_type", type: "NVARCHAR(50)", mandatory: true, description: "percentage, number, currency, boolean, milestone" },
        { name: "start_value", type: "DECIMAL(15,4)", mandatory: true, description: "Baseline value at start" },
        { name: "target_value", type: "DECIMAL(15,4)", mandatory: true, description: "Target to achieve" },
        { name: "current_value", type: "DECIMAL(15,4)", mandatory: true, description: "Current progress value", defaultValue: "0" },
        { name: "unit", type: "NVARCHAR(50)", mandatory: false, description: "Unit of measurement (%, $, count, etc.)" },
        { name: "weight", type: "DECIMAL(5,2)", mandatory: true, description: "Weight in objective (0-1)", defaultValue: "1" },
        { name: "progress", type: "DECIMAL(5,2)", mandatory: true, description: "Calculated progress 0-100", defaultValue: "0" },
        { name: "confidence_level", type: "NVARCHAR(20)", mandatory: false, description: "on_track, at_risk, off_track" },
        { name: "last_updated_by", type: "UNIQUEIDENTIFIER", mandatory: false, description: "User who last updated progress" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation", defaultValue: "GETUTCDATE()" },
        { name: "updated_at", type: "DATETIME2", mandatory: true, description: "Last update", defaultValue: "GETUTCDATE()" }
      ],
      indexes: ["IX_KeyResults_ObjectiveId (objective_id)"],
      triggers: ["TR_KeyResults_UpdateObjectiveProgress - Recalculates parent objective progress on change"]
    },
    {
      name: "KeyResultHistory",
      schema: "performance_goals",
      description: "Historical snapshots of Key Result progress for trending",
      fields: [
        { name: "id", type: "BIGINT IDENTITY", mandatory: true, description: "Primary key" },
        { name: "key_result_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Key result", foreignKey: "performance_goals.KeyResults.id", indexed: true },
        { name: "snapshot_date", type: "DATE", mandatory: true, description: "Date of snapshot" },
        { name: "current_value", type: "DECIMAL(15,4)", mandatory: true, description: "Value at snapshot" },
        { name: "progress", type: "DECIMAL(5,2)", mandatory: true, description: "Progress at snapshot" },
        { name: "note", type: "NVARCHAR(500)", mandatory: false, description: "Update note" },
        { name: "updated_by", type: "UNIQUEIDENTIFIER", mandatory: false, description: "User who made update" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Snapshot timestamp", defaultValue: "GETUTCDATE()" }
      ],
      indexes: ["IX_KeyResultHistory_KRDate (key_result_id, snapshot_date)"]
    },
    {
      name: "Goals",
      schema: "performance_goals",
      description: "Individual goals with milestones (separate from OKRs)",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", indexed: true },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Goal owner", indexed: true },
        { name: "title", type: "NVARCHAR(500)", mandatory: true, description: "Goal title" },
        { name: "description", type: "NVARCHAR(MAX)", mandatory: false, description: "Goal details" },
        { name: "category", type: "NVARCHAR(100)", mandatory: true, description: "Performance, Development, Project, Personal" },
        { name: "priority", type: "NVARCHAR(20)", mandatory: true, description: "low, medium, high, critical", defaultValue: "'medium'" },
        { name: "status", type: "NVARCHAR(50)", mandatory: true, description: "not_started, in_progress, completed, overdue, cancelled", defaultValue: "'not_started'" },
        { name: "progress", type: "INT", mandatory: true, description: "Completion percentage 0-100", defaultValue: "0" },
        { name: "start_date", type: "DATE", mandatory: true, description: "Goal start date" },
        { name: "target_date", type: "DATE", mandatory: true, description: "Goal due date" },
        { name: "completed_at", type: "DATETIME2", mandatory: false, description: "When goal was completed" },
        { name: "linked_objective_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Linked OKR objective", foreignKey: "performance_goals.Objectives.id" },
        { name: "linked_review_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Linked performance review" },
        { name: "linked_course_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Linked LMS course" },
        { name: "created_by", type: "UNIQUEIDENTIFIER", mandatory: true, description: "User who created" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation", defaultValue: "GETUTCDATE()" },
        { name: "updated_at", type: "DATETIME2", mandatory: true, description: "Last update", defaultValue: "GETUTCDATE()" }
      ],
      indexes: [
        "IX_Goals_TenantId (tenant_id)",
        "IX_Goals_StaffId (staff_id)",
        "IX_Goals_Status (status)",
        "IX_Goals_TargetDate (target_date)"
      ]
    },
    {
      name: "GoalMilestones",
      schema: "performance_goals",
      description: "Milestones within individual goals",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "goal_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Parent goal", foreignKey: "performance_goals.Goals.id", indexed: true },
        { name: "title", type: "NVARCHAR(255)", mandatory: true, description: "Milestone title" },
        { name: "description", type: "NVARCHAR(500)", mandatory: false, description: "Milestone details" },
        { name: "target_date", type: "DATE", mandatory: true, description: "Milestone due date" },
        { name: "completed", type: "BIT", mandatory: true, description: "Whether milestone is complete", defaultValue: "0" },
        { name: "completed_at", type: "DATETIME2", mandatory: false, description: "When milestone was completed" },
        { name: "display_order", type: "INT", mandatory: true, description: "Order in goal", defaultValue: "0" }
      ],
      indexes: ["IX_GoalMilestones_GoalId (goal_id)"]
    },

    // ============================================================================
    // REVIEWS SCHEMA - Performance Reviews and Calibration
    // ============================================================================
    {
      name: "ReviewCycles",
      schema: "performance_reviews",
      description: "Performance review cycle definitions",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", indexed: true },
        { name: "name", type: "NVARCHAR(100)", mandatory: true, description: "Cycle name (e.g., Annual Review 2026)" },
        { name: "cycle_type", type: "NVARCHAR(20)", mandatory: true, description: "annual, semi_annual, quarterly" },
        { name: "period_start", type: "DATE", mandatory: true, description: "Period being reviewed start" },
        { name: "period_end", type: "DATE", mandatory: true, description: "Period being reviewed end" },
        { name: "self_assessment_start", type: "DATE", mandatory: true, description: "When self-assessment opens" },
        { name: "self_assessment_deadline", type: "DATE", mandatory: true, description: "Self-assessment due date" },
        { name: "manager_review_deadline", type: "DATE", mandatory: true, description: "Manager review due date" },
        { name: "calibration_deadline", type: "DATE", mandatory: true, description: "Calibration completion date" },
        { name: "status", type: "NVARCHAR(50)", mandatory: true, description: "draft, self_assessment, manager_review, calibration, completed", defaultValue: "'draft'" },
        { name: "include_okr_progress", type: "BIT", mandatory: true, description: "Show OKR progress in review", defaultValue: "1" },
        { name: "include_360_feedback", type: "BIT", mandatory: true, description: "Include 360 feedback section", defaultValue: "0" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation", defaultValue: "GETUTCDATE()" },
        { name: "created_by", type: "UNIQUEIDENTIFIER", mandatory: false, description: "HR user who created" }
      ],
      indexes: ["IX_ReviewCycles_TenantId (tenant_id)", "IX_ReviewCycles_Status (status)"]
    },
    {
      name: "ReviewCriteria",
      schema: "performance_reviews",
      description: "Configurable criteria for review cycles",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "cycle_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Review cycle", foreignKey: "performance_reviews.ReviewCycles.id", indexed: true },
        { name: "name", type: "NVARCHAR(100)", mandatory: true, description: "Criterion name (e.g., Quality of Work)" },
        { name: "description", type: "NVARCHAR(500)", mandatory: false, description: "What this criterion measures" },
        { name: "weight", type: "DECIMAL(5,2)", mandatory: true, description: "Weight in overall rating (0-100)", defaultValue: "20" },
        { name: "display_order", type: "INT", mandatory: true, description: "Display order in form", defaultValue: "0" },
        { name: "is_required", type: "BIT", mandatory: true, description: "Whether rating is mandatory", defaultValue: "1" }
      ],
      indexes: ["IX_ReviewCriteria_CycleId (cycle_id)"]
    },
    {
      name: "PerformanceReviews",
      schema: "performance_reviews",
      description: "Individual performance review records",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", indexed: true },
        { name: "cycle_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Review cycle", foreignKey: "performance_reviews.ReviewCycles.id", indexed: true },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Employee being reviewed", indexed: true },
        { name: "reviewer_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Manager conducting review", indexed: true },
        { name: "status", type: "NVARCHAR(50)", mandatory: true, description: "not_started, self_assessment, manager_review, calibration, complete", defaultValue: "'not_started'" },
        { name: "self_assessment_date", type: "DATETIME2", mandatory: false, description: "When self-assessment completed" },
        { name: "manager_review_date", type: "DATETIME2", mandatory: false, description: "When manager review completed" },
        { name: "calibration_date", type: "DATETIME2", mandatory: false, description: "When calibration completed" },
        { name: "overall_self_rating", type: "DECIMAL(3,2)", mandatory: false, description: "Employee's overall self-rating" },
        { name: "overall_manager_rating", type: "DECIMAL(3,2)", mandatory: false, description: "Manager's overall rating" },
        { name: "final_rating", type: "DECIMAL(3,2)", mandatory: false, description: "Calibrated final rating" },
        { name: "self_narrative", type: "NVARCHAR(MAX)", mandatory: false, description: "Employee's written self-assessment" },
        { name: "manager_narrative", type: "NVARCHAR(MAX)", mandatory: false, description: "Manager's written feedback" },
        { name: "strengths", type: "NVARCHAR(MAX)", mandatory: false, description: "JSON array of identified strengths" },
        { name: "development_areas", type: "NVARCHAR(MAX)", mandatory: false, description: "JSON array of development areas" },
        { name: "acknowledged_at", type: "DATETIME2", mandatory: false, description: "When employee acknowledged review" },
        { name: "acknowledgment_notes", type: "NVARCHAR(500)", mandatory: false, description: "Employee comments on acknowledgment" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation", defaultValue: "GETUTCDATE()" },
        { name: "updated_at", type: "DATETIME2", mandatory: true, description: "Last update", defaultValue: "GETUTCDATE()" }
      ],
      indexes: [
        "IX_PerformanceReviews_TenantId (tenant_id)",
        "IX_PerformanceReviews_CycleId (cycle_id)",
        "IX_PerformanceReviews_StaffId (staff_id)",
        "IX_PerformanceReviews_Status (status)"
      ]
    },
    {
      name: "ReviewRatings",
      schema: "performance_reviews",
      description: "Individual criterion ratings within a review",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "review_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Parent review", foreignKey: "performance_reviews.PerformanceReviews.id", indexed: true },
        { name: "criteria_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Review criterion", foreignKey: "performance_reviews.ReviewCriteria.id" },
        { name: "self_rating", type: "DECIMAL(3,2)", mandatory: false, description: "Employee's self-rating (1-5)" },
        { name: "manager_rating", type: "DECIMAL(3,2)", mandatory: false, description: "Manager's rating (1-5)" },
        { name: "final_rating", type: "DECIMAL(3,2)", mandatory: false, description: "Post-calibration rating" },
        { name: "self_comments", type: "NVARCHAR(MAX)", mandatory: false, description: "Employee's evidence/examples" },
        { name: "manager_comments", type: "NVARCHAR(MAX)", mandatory: false, description: "Manager's feedback" }
      ],
      indexes: ["IX_ReviewRatings_ReviewId (review_id)"]
    },
    {
      name: "CalibrationSessions",
      schema: "performance_reviews",
      description: "Calibration session records for rating alignment",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", indexed: true },
        { name: "cycle_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Review cycle", foreignKey: "performance_reviews.ReviewCycles.id" },
        { name: "name", type: "NVARCHAR(100)", mandatory: true, description: "Session name (e.g., Operations Calibration)" },
        { name: "department_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Department scope" },
        { name: "scheduled_date", type: "DATETIME2", mandatory: true, description: "Session date/time" },
        { name: "status", type: "NVARCHAR(50)", mandatory: true, description: "scheduled, in_progress, completed", defaultValue: "'scheduled'" },
        { name: "facilitator_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "HR facilitator" },
        { name: "notes", type: "NVARCHAR(MAX)", mandatory: false, description: "Session notes" },
        { name: "completed_at", type: "DATETIME2", mandatory: false, description: "When session completed" }
      ],
      indexes: ["IX_CalibrationSessions_CycleId (cycle_id)"]
    },
    {
      name: "CalibrationAdjustments",
      schema: "performance_reviews",
      description: "Audit log of rating adjustments during calibration",
      fields: [
        { name: "id", type: "BIGINT IDENTITY", mandatory: true, description: "Primary key" },
        { name: "session_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Calibration session", foreignKey: "performance_reviews.CalibrationSessions.id", indexed: true },
        { name: "review_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Review adjusted", foreignKey: "performance_reviews.PerformanceReviews.id" },
        { name: "original_rating", type: "DECIMAL(3,2)", mandatory: true, description: "Rating before adjustment" },
        { name: "adjusted_rating", type: "DECIMAL(3,2)", mandatory: true, description: "Rating after adjustment" },
        { name: "justification", type: "NVARCHAR(MAX)", mandatory: true, description: "Reason for adjustment", validation: "Min 20 characters" },
        { name: "adjusted_by", type: "UNIQUEIDENTIFIER", mandatory: true, description: "User who made adjustment" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Adjustment timestamp", defaultValue: "GETUTCDATE()" }
      ],
      indexes: ["IX_CalibrationAdjustments_SessionId (session_id)", "IX_CalibrationAdjustments_ReviewId (review_id)"]
    },

    // ============================================================================
    // FEEDBACK SCHEMA - 360° Feedback and Peer Recognition
    // ============================================================================
    {
      name: "FeedbackRequests",
      schema: "performance_feedback",
      description: "360° feedback request records",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", indexed: true },
        { name: "subject_staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Employee receiving feedback", indexed: true },
        { name: "requested_by", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Manager who initiated" },
        { name: "template_type", type: "NVARCHAR(50)", mandatory: true, description: "leadership, competencies, custom" },
        { name: "status", type: "NVARCHAR(50)", mandatory: true, description: "draft, collecting, completed, cancelled", defaultValue: "'draft'" },
        { name: "is_anonymous", type: "BIT", mandatory: true, description: "Whether responses are anonymous", defaultValue: "1" },
        { name: "min_responses", type: "INT", mandatory: true, description: "Minimum responses for results", defaultValue: "3" },
        { name: "deadline", type: "DATE", mandatory: true, description: "Response deadline" },
        { name: "response_count", type: "INT", mandatory: true, description: "Current response count", defaultValue: "0" },
        { name: "results_shared_at", type: "DATETIME2", mandatory: false, description: "When results shared with employee" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Request creation", defaultValue: "GETUTCDATE()" }
      ],
      indexes: ["IX_FeedbackRequests_SubjectId (subject_staff_id)", "IX_FeedbackRequests_Status (status)"]
    },
    {
      name: "FeedbackProviders",
      schema: "performance_feedback",
      description: "Nominated providers for 360° feedback",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "request_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Feedback request", foreignKey: "performance_feedback.FeedbackRequests.id", indexed: true },
        { name: "provider_staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Staff providing feedback", indexed: true },
        { name: "relationship", type: "NVARCHAR(50)", mandatory: true, description: "peer, direct_report, manager, cross_functional, external" },
        { name: "nominated_by", type: "NVARCHAR(20)", mandatory: true, description: "employee, manager" },
        { name: "approval_status", type: "NVARCHAR(20)", mandatory: true, description: "pending, approved, rejected", defaultValue: "'pending'" },
        { name: "approved_by", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Manager who approved" },
        { name: "rejection_reason", type: "NVARCHAR(255)", mandatory: false, description: "Reason if rejected" },
        { name: "invited_at", type: "DATETIME2", mandatory: false, description: "When invitation sent" },
        { name: "completed_at", type: "DATETIME2", mandatory: false, description: "When feedback submitted" },
        { name: "reminder_count", type: "INT", mandatory: true, description: "Reminders sent", defaultValue: "0" }
      ],
      indexes: ["IX_FeedbackProviders_RequestId (request_id)", "IX_FeedbackProviders_ProviderId (provider_staff_id)"]
    },
    {
      name: "FeedbackResponses",
      schema: "performance_feedback",
      description: "Submitted 360° feedback responses",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "provider_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Feedback provider record", foreignKey: "performance_feedback.FeedbackProviders.id", indexed: true },
        { name: "question_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Question answered" },
        { name: "rating", type: "INT", mandatory: false, description: "Numeric rating if applicable" },
        { name: "text_response", type: "NVARCHAR(MAX)", mandatory: false, description: "Open-ended response" },
        { name: "submitted_at", type: "DATETIME2", mandatory: true, description: "Submission timestamp", defaultValue: "GETUTCDATE()" }
      ],
      indexes: ["IX_FeedbackResponses_ProviderId (provider_id)"]
    },
    {
      name: "PraisePosts",
      schema: "performance_feedback",
      description: "Recognition praise posts for the praise wall",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", indexed: true },
        { name: "from_staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Person giving praise", indexed: true },
        { name: "to_staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Person receiving praise", indexed: true },
        { name: "culture_value", type: "NVARCHAR(100)", mandatory: true, description: "Culture value category" },
        { name: "badge_id", type: "NVARCHAR(50)", mandatory: false, description: "Badge attached" },
        { name: "message", type: "NVARCHAR(MAX)", mandatory: true, description: "Praise message" },
        { name: "points_awarded", type: "INT", mandatory: true, description: "Points given", defaultValue: "0" },
        { name: "visibility", type: "NVARCHAR(20)", mandatory: true, description: "public, private", defaultValue: "'public'" },
        { name: "like_count", type: "INT", mandatory: true, description: "Number of likes", defaultValue: "0" },
        { name: "comment_count", type: "INT", mandatory: true, description: "Number of comments", defaultValue: "0" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Post timestamp", defaultValue: "GETUTCDATE()" }
      ],
      indexes: [
        "IX_PraisePosts_TenantId (tenant_id)",
        "IX_PraisePosts_ToStaffId (to_staff_id)",
        "IX_PraisePosts_FromStaffId (from_staff_id)",
        "IX_PraisePosts_CreatedAt (created_at DESC)"
      ]
    },
    {
      name: "PointsBalance",
      schema: "performance_feedback",
      description: "Employee recognition point balances",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Staff member", indexed: true },
        { name: "current_balance", type: "INT", mandatory: true, description: "Available points", defaultValue: "0" },
        { name: "monthly_allowance", type: "INT", mandatory: true, description: "Points to give monthly", defaultValue: "100" },
        { name: "allowance_remaining", type: "INT", mandatory: true, description: "Give allowance remaining this month", defaultValue: "100" },
        { name: "total_earned", type: "INT", mandatory: true, description: "Lifetime points earned", defaultValue: "0" },
        { name: "total_redeemed", type: "INT", mandatory: true, description: "Lifetime points redeemed", defaultValue: "0" },
        { name: "last_earning_date", type: "DATE", mandatory: false, description: "Last date points received" },
        { name: "allowance_reset_date", type: "DATE", mandatory: true, description: "Next allowance reset" },
        { name: "updated_at", type: "DATETIME2", mandatory: true, description: "Last balance update", defaultValue: "GETUTCDATE()" }
      ],
      indexes: ["IX_PointsBalance_StaffId UNIQUE (staff_id)"]
    },
    {
      name: "RewardsCatalog",
      schema: "performance_feedback",
      description: "Available rewards for point redemption",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", indexed: true },
        { name: "name", type: "NVARCHAR(255)", mandatory: true, description: "Reward name" },
        { name: "description", type: "NVARCHAR(MAX)", mandatory: false, description: "Reward description" },
        { name: "category", type: "NVARCHAR(100)", mandatory: true, description: "gift_cards, experiences, merchandise, donations" },
        { name: "points_cost", type: "INT", mandatory: true, description: "Points required to redeem" },
        { name: "monetary_value", type: "DECIMAL(10,2)", mandatory: false, description: "Cash value if applicable" },
        { name: "image_url", type: "NVARCHAR(500)", mandatory: false, description: "Reward image" },
        { name: "quantity_available", type: "INT", mandatory: false, description: "Stock if limited" },
        { name: "requires_approval", type: "BIT", mandatory: true, description: "HR approval needed", defaultValue: "0" },
        { name: "is_active", type: "BIT", mandatory: true, description: "Available for redemption", defaultValue: "1" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation", defaultValue: "GETUTCDATE()" }
      ],
      indexes: ["IX_RewardsCatalog_TenantId (tenant_id)", "IX_RewardsCatalog_Category (category)"]
    },
    {
      name: "RewardRedemptions",
      schema: "performance_feedback",
      description: "Point redemption transactions",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Staff redeeming", indexed: true },
        { name: "reward_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Reward selected", foreignKey: "performance_feedback.RewardsCatalog.id" },
        { name: "points_spent", type: "INT", mandatory: true, description: "Points deducted" },
        { name: "status", type: "NVARCHAR(50)", mandatory: true, description: "pending, approved, fulfilled, cancelled", defaultValue: "'pending'" },
        { name: "approved_by", type: "UNIQUEIDENTIFIER", mandatory: false, description: "HR approver if required" },
        { name: "fulfilled_at", type: "DATETIME2", mandatory: false, description: "When reward delivered" },
        { name: "fulfillment_notes", type: "NVARCHAR(500)", mandatory: false, description: "Delivery details" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Redemption request time", defaultValue: "GETUTCDATE()" }
      ],
      indexes: ["IX_RewardRedemptions_StaffId (staff_id)", "IX_RewardRedemptions_Status (status)"]
    },

    // ============================================================================
    // LMS SCHEMA - Learning Management System
    // ============================================================================
    {
      name: "Courses",
      schema: "performance_lms",
      description: "Learning courses available in LMS",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", indexed: true },
        { name: "title", type: "NVARCHAR(255)", mandatory: true, description: "Course title" },
        { name: "description", type: "NVARCHAR(MAX)", mandatory: false, description: "Course description" },
        { name: "category_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Course category" },
        { name: "difficulty", type: "NVARCHAR(50)", mandatory: true, description: "beginner, intermediate, advanced" },
        { name: "duration_minutes", type: "INT", mandatory: true, description: "Estimated duration" },
        { name: "status", type: "NVARCHAR(50)", mandatory: true, description: "draft, published, archived", defaultValue: "'draft'" },
        { name: "course_type", type: "NVARCHAR(50)", mandatory: true, description: "elearning, instructor_led, blended, external" },
        { name: "thumbnail_url", type: "NVARCHAR(500)", mandatory: false, description: "Course thumbnail image" },
        { name: "certificate_on_completion", type: "BIT", mandatory: true, description: "Issue certificate", defaultValue: "0" },
        { name: "certificate_expiry_months", type: "INT", mandatory: false, description: "Certificate validity period" },
        { name: "passing_score", type: "INT", mandatory: true, description: "Minimum passing percentage", defaultValue: "70" },
        { name: "max_attempts", type: "INT", mandatory: false, description: "Assessment attempt limit" },
        { name: "linked_skill_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Skill developed by course" },
        { name: "skill_level_awarded", type: "NVARCHAR(20)", mandatory: false, description: "Proficiency level on completion" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation", defaultValue: "GETUTCDATE()" },
        { name: "updated_at", type: "DATETIME2", mandatory: true, description: "Last update", defaultValue: "GETUTCDATE()" },
        { name: "created_by", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Admin who created" }
      ],
      indexes: [
        "IX_Courses_TenantId (tenant_id)",
        "IX_Courses_Status (status)",
        "IX_Courses_CategoryId (category_id)"
      ]
    },
    {
      name: "CourseModules",
      schema: "performance_lms",
      description: "Modules within courses",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "course_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Parent course", foreignKey: "performance_lms.Courses.id", indexed: true },
        { name: "title", type: "NVARCHAR(255)", mandatory: true, description: "Module title" },
        { name: "description", type: "NVARCHAR(500)", mandatory: false, description: "Module description" },
        { name: "module_type", type: "NVARCHAR(50)", mandatory: true, description: "video, reading, interactive, assessment, assignment" },
        { name: "content_url", type: "NVARCHAR(500)", mandatory: false, description: "Content location" },
        { name: "duration_minutes", type: "INT", mandatory: false, description: "Module duration" },
        { name: "display_order", type: "INT", mandatory: true, description: "Order in course", defaultValue: "0" },
        { name: "is_required", type: "BIT", mandatory: true, description: "Must complete for course completion", defaultValue: "1" },
        { name: "is_assessment", type: "BIT", mandatory: true, description: "Whether this is graded", defaultValue: "0" }
      ],
      indexes: ["IX_CourseModules_CourseId (course_id)"]
    },
    {
      name: "LearningPaths",
      schema: "performance_lms",
      description: "Structured learning paths containing multiple courses",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", indexed: true },
        { name: "name", type: "NVARCHAR(255)", mandatory: true, description: "Path name" },
        { name: "description", type: "NVARCHAR(MAX)", mandatory: false, description: "Path description" },
        { name: "thumbnail_url", type: "NVARCHAR(500)", mandatory: false, description: "Path thumbnail" },
        { name: "is_sequential", type: "BIT", mandatory: true, description: "Must complete courses in order", defaultValue: "1" },
        { name: "total_courses", type: "INT", mandatory: true, description: "Number of courses", defaultValue: "0" },
        { name: "estimated_hours", type: "DECIMAL(5,1)", mandatory: false, description: "Total estimated hours" },
        { name: "certificate_on_completion", type: "BIT", mandatory: true, description: "Issue path certificate", defaultValue: "1" },
        { name: "status", type: "NVARCHAR(50)", mandatory: true, description: "draft, published, archived", defaultValue: "'draft'" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation", defaultValue: "GETUTCDATE()" }
      ],
      indexes: ["IX_LearningPaths_TenantId (tenant_id)", "IX_LearningPaths_Status (status)"]
    },
    {
      name: "LearningPathCourses",
      schema: "performance_lms",
      description: "Courses within learning paths",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "path_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Learning path", foreignKey: "performance_lms.LearningPaths.id", indexed: true },
        { name: "course_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Course", foreignKey: "performance_lms.Courses.id" },
        { name: "sequence_order", type: "INT", mandatory: true, description: "Order in path" },
        { name: "is_required", type: "BIT", mandatory: true, description: "Required for completion", defaultValue: "1" }
      ],
      indexes: ["IX_LearningPathCourses_PathId (path_id)"]
    },
    {
      name: "CourseEnrollments",
      schema: "performance_lms",
      description: "Staff enrollment in courses",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Enrolled staff", indexed: true },
        { name: "course_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Course", foreignKey: "performance_lms.Courses.id", indexed: true },
        { name: "path_enrollment_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "If part of path enrollment" },
        { name: "status", type: "NVARCHAR(50)", mandatory: true, description: "enrolled, in_progress, completed, failed, expired", defaultValue: "'enrolled'" },
        { name: "progress_percent", type: "INT", mandatory: true, description: "Completion percentage", defaultValue: "0" },
        { name: "started_at", type: "DATETIME2", mandatory: false, description: "When course started" },
        { name: "completed_at", type: "DATETIME2", mandatory: false, description: "When course completed" },
        { name: "due_date", type: "DATE", mandatory: false, description: "Completion deadline" },
        { name: "final_score", type: "INT", mandatory: false, description: "Assessment score if applicable" },
        { name: "attempts", type: "INT", mandatory: true, description: "Assessment attempts used", defaultValue: "0" },
        { name: "certificate_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Issued certificate" },
        { name: "assigned_by", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Manager who assigned" },
        { name: "enrolled_at", type: "DATETIME2", mandatory: true, description: "Enrollment timestamp", defaultValue: "GETUTCDATE()" }
      ],
      indexes: [
        "IX_CourseEnrollments_StaffId (staff_id)",
        "IX_CourseEnrollments_CourseId (course_id)",
        "IX_CourseEnrollments_Status (status)"
      ]
    },
    {
      name: "Certificates",
      schema: "performance_lms",
      description: "Issued learning certificates",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Certificate holder", indexed: true },
        { name: "certificate_type", type: "NVARCHAR(50)", mandatory: true, description: "course, learning_path" },
        { name: "source_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Course or path ID" },
        { name: "certificate_number", type: "NVARCHAR(50)", mandatory: true, description: "Unique certificate ID" },
        { name: "issued_at", type: "DATETIME2", mandatory: true, description: "Issue date", defaultValue: "GETUTCDATE()" },
        { name: "expires_at", type: "DATE", mandatory: false, description: "Expiry date if applicable" },
        { name: "status", type: "NVARCHAR(20)", mandatory: true, description: "valid, expired, revoked", defaultValue: "'valid'" },
        { name: "pdf_url", type: "NVARCHAR(500)", mandatory: false, description: "Generated certificate PDF" }
      ],
      indexes: [
        "IX_Certificates_StaffId (staff_id)",
        "IX_Certificates_CertificateNumber UNIQUE (certificate_number)"
      ]
    },

    // ============================================================================
    // TALENT SCHEMA - 9-Box, Succession, Skills
    // ============================================================================
    {
      name: "TalentAssessments",
      schema: "performance_talent",
      description: "9-Box talent assessment records",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", indexed: true },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Employee assessed", indexed: true },
        { name: "assessed_by", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Manager conducting assessment" },
        { name: "assessment_date", type: "DATE", mandatory: true, description: "Date of assessment" },
        { name: "assessment_period", type: "NVARCHAR(20)", mandatory: true, description: "Year or period" },
        { name: "performance_level", type: "NVARCHAR(20)", mandatory: true, description: "low, medium, high" },
        { name: "potential_level", type: "NVARCHAR(20)", mandatory: true, description: "low, medium, high" },
        { name: "nine_box_position", type: "NVARCHAR(50)", mandatory: true, description: "Derived box label (e.g., Star, Core Player)" },
        { name: "performance_score", type: "DECIMAL(3,2)", mandatory: false, description: "Performance score 1-5" },
        { name: "potential_score", type: "DECIMAL(3,2)", mandatory: false, description: "Potential score 1-5" },
        { name: "flight_risk", type: "NVARCHAR(20)", mandatory: false, description: "low, medium, high" },
        { name: "succession_readiness", type: "NVARCHAR(50)", mandatory: false, description: "ready_now, 1_2_years, 3_plus_years, not_ready" },
        { name: "learning_agility_score", type: "INT", mandatory: false, description: "Learning agility assessment" },
        { name: "leadership_potential_score", type: "INT", mandatory: false, description: "Leadership potential" },
        { name: "notes", type: "NVARCHAR(MAX)", mandatory: false, description: "Assessment notes" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation", defaultValue: "GETUTCDATE()" }
      ],
      indexes: [
        "IX_TalentAssessments_TenantId (tenant_id)",
        "IX_TalentAssessments_StaffId (staff_id)",
        "IX_TalentAssessments_NineBox (nine_box_position)"
      ]
    },
    {
      name: "KeyRoles",
      schema: "performance_talent",
      description: "Critical roles requiring succession planning",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", indexed: true },
        { name: "title", type: "NVARCHAR(255)", mandatory: true, description: "Role title" },
        { name: "department_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Department" },
        { name: "current_holder_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Current incumbent" },
        { name: "criticality", type: "NVARCHAR(20)", mandatory: true, description: "essential, important, standard" },
        { name: "vacancy_risk", type: "NVARCHAR(20)", mandatory: true, description: "low, medium, high, critical" },
        { name: "impact_of_vacancy", type: "NVARCHAR(MAX)", mandatory: false, description: "Business impact description" },
        { name: "required_competencies", type: "NVARCHAR(MAX)", mandatory: false, description: "JSON array of required skills" },
        { name: "min_years_experience", type: "INT", mandatory: false, description: "Experience requirement" },
        { name: "required_qualifications", type: "NVARCHAR(MAX)", mandatory: false, description: "Required certifications" },
        { name: "successor_count", type: "INT", mandatory: true, description: "Number of identified successors", defaultValue: "0" },
        { name: "bench_strength", type: "DECIMAL(5,2)", mandatory: false, description: "% with ready-now candidates" },
        { name: "last_reviewed_at", type: "DATETIME2", mandatory: false, description: "Last succession review" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation", defaultValue: "GETUTCDATE()" }
      ],
      indexes: ["IX_KeyRoles_TenantId (tenant_id)", "IX_KeyRoles_Criticality (criticality)"]
    },
    {
      name: "SuccessionCandidates",
      schema: "performance_talent",
      description: "Succession candidates for key roles",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "key_role_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Target role", foreignKey: "performance_talent.KeyRoles.id", indexed: true },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Candidate", indexed: true },
        { name: "readiness_level", type: "NVARCHAR(50)", mandatory: true, description: "ready_now, 1_2_years, 3_plus_years, not_ready" },
        { name: "overall_score", type: "INT", mandatory: false, description: "Readiness score 0-100" },
        { name: "performance_score", type: "INT", mandatory: false, description: "Performance component" },
        { name: "potential_score", type: "INT", mandatory: false, description: "Potential component" },
        { name: "experience_score", type: "INT", mandatory: false, description: "Experience component" },
        { name: "competency_gaps", type: "NVARCHAR(MAX)", mandatory: false, description: "JSON array of gaps" },
        { name: "development_actions", type: "NVARCHAR(MAX)", mandatory: false, description: "JSON array of actions" },
        { name: "mentor_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Assigned mentor" },
        { name: "notes", type: "NVARCHAR(MAX)", mandatory: false, description: "Assessment notes" },
        { name: "added_by", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Who added candidate" },
        { name: "added_at", type: "DATETIME2", mandatory: true, description: "When added", defaultValue: "GETUTCDATE()" },
        { name: "last_assessed_at", type: "DATETIME2", mandatory: false, description: "Last readiness assessment" }
      ],
      indexes: ["IX_SuccessionCandidates_KeyRoleId (key_role_id)", "IX_SuccessionCandidates_StaffId (staff_id)"]
    },
    {
      name: "Skills",
      schema: "performance_talent",
      description: "Skill definitions for the organization",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", indexed: true },
        { name: "name", type: "NVARCHAR(100)", mandatory: true, description: "Skill name" },
        { name: "description", type: "NVARCHAR(500)", mandatory: false, description: "Skill description" },
        { name: "category", type: "NVARCHAR(100)", mandatory: true, description: "technical, leadership, interpersonal, domain" },
        { name: "levels", type: "INT", mandatory: true, description: "Number of proficiency levels", defaultValue: "5" },
        { name: "level_descriptions", type: "NVARCHAR(MAX)", mandatory: false, description: "JSON of level definitions" },
        { name: "is_active", type: "BIT", mandatory: true, description: "Available for use", defaultValue: "1" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation", defaultValue: "GETUTCDATE()" }
      ],
      indexes: ["IX_Skills_TenantId (tenant_id)", "IX_Skills_Category (category)"]
    },
    {
      name: "StaffSkills",
      schema: "performance_talent",
      description: "Staff skill proficiency records",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Staff member", indexed: true },
        { name: "skill_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Skill", foreignKey: "performance_talent.Skills.id", indexed: true },
        { name: "current_level", type: "INT", mandatory: true, description: "Current proficiency level" },
        { name: "target_level", type: "INT", mandatory: false, description: "Target proficiency level" },
        { name: "assessed_by", type: "NVARCHAR(50)", mandatory: true, description: "self, manager, assessment, course" },
        { name: "last_assessed_at", type: "DATETIME2", mandatory: true, description: "When last assessed" },
        { name: "evidence", type: "NVARCHAR(MAX)", mandatory: false, description: "Supporting evidence" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation", defaultValue: "GETUTCDATE()" }
      ],
      indexes: ["IX_StaffSkills_StaffId (staff_id)", "IX_StaffSkills_SkillId (skill_id)"]
    },

    // ============================================================================
    // ENGAGEMENT SCHEMA - Surveys and Wellbeing
    // ============================================================================
    {
      name: "PulseSurveys",
      schema: "performance_engagement",
      description: "Pulse survey definitions",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", indexed: true },
        { name: "name", type: "NVARCHAR(100)", mandatory: true, description: "Survey name" },
        { name: "frequency", type: "NVARCHAR(20)", mandatory: true, description: "weekly, biweekly, monthly" },
        { name: "status", type: "NVARCHAR(20)", mandatory: true, description: "draft, active, paused, completed", defaultValue: "'draft'" },
        { name: "is_anonymous", type: "BIT", mandatory: true, description: "Anonymous responses", defaultValue: "1" },
        { name: "min_responses_for_results", type: "INT", mandatory: true, description: "Minimum for anonymity", defaultValue: "5" },
        { name: "include_enps", type: "BIT", mandatory: true, description: "Include eNPS question", defaultValue: "1" },
        { name: "next_send_date", type: "DATE", mandatory: false, description: "Next scheduled send" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation", defaultValue: "GETUTCDATE()" },
        { name: "created_by", type: "UNIQUEIDENTIFIER", mandatory: false, description: "HR user who created" }
      ],
      indexes: ["IX_PulseSurveys_TenantId (tenant_id)", "IX_PulseSurveys_Status (status)"]
    },
    {
      name: "SurveyInstances",
      schema: "performance_engagement",
      description: "Individual survey distribution instances",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "survey_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Parent survey", foreignKey: "performance_engagement.PulseSurveys.id", indexed: true },
        { name: "sent_at", type: "DATETIME2", mandatory: true, description: "When survey sent" },
        { name: "deadline", type: "DATE", mandatory: true, description: "Response deadline" },
        { name: "status", type: "NVARCHAR(20)", mandatory: true, description: "active, closed", defaultValue: "'active'" },
        { name: "total_recipients", type: "INT", mandatory: true, description: "Number of recipients" },
        { name: "response_count", type: "INT", mandatory: true, description: "Responses received", defaultValue: "0" },
        { name: "response_rate", type: "DECIMAL(5,2)", mandatory: false, description: "Response percentage" },
        { name: "enps_score", type: "INT", mandatory: false, description: "Calculated eNPS" },
        { name: "promoter_count", type: "INT", mandatory: true, description: "9-10 ratings", defaultValue: "0" },
        { name: "passive_count", type: "INT", mandatory: true, description: "7-8 ratings", defaultValue: "0" },
        { name: "detractor_count", type: "INT", mandatory: true, description: "0-6 ratings", defaultValue: "0" }
      ],
      indexes: ["IX_SurveyInstances_SurveyId (survey_id)", "IX_SurveyInstances_SentAt (sent_at)"]
    },
    {
      name: "SurveyResponses",
      schema: "performance_engagement",
      description: "Individual survey responses",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "instance_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Survey instance", foreignKey: "performance_engagement.SurveyInstances.id", indexed: true },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Respondent (null if anonymous)" },
        { name: "anonymous_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Anonymous tracking ID" },
        { name: "department_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "For aggregation" },
        { name: "enps_rating", type: "INT", mandatory: false, description: "0-10 eNPS rating" },
        { name: "question_responses", type: "NVARCHAR(MAX)", mandatory: false, description: "JSON of question:answer pairs" },
        { name: "open_comments", type: "NVARCHAR(MAX)", mandatory: false, description: "Free-text comments" },
        { name: "submitted_at", type: "DATETIME2", mandatory: true, description: "Response timestamp", defaultValue: "GETUTCDATE()" }
      ],
      indexes: ["IX_SurveyResponses_InstanceId (instance_id)", "IX_SurveyResponses_DepartmentId (department_id)"]
    },
    {
      name: "WellbeingCheckIns",
      schema: "performance_engagement",
      description: "Employee wellbeing self-check-ins",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Staff member", indexed: true },
        { name: "check_in_date", type: "DATE", mandatory: true, description: "Date of check-in" },
        { name: "mood_score", type: "INT", mandatory: true, description: "1-5 mood rating" },
        { name: "energy_score", type: "INT", mandatory: true, description: "1-5 energy rating" },
        { name: "stress_score", type: "INT", mandatory: false, description: "1-5 stress level" },
        { name: "workload_score", type: "INT", mandatory: false, description: "1-5 workload feeling" },
        { name: "notes", type: "NVARCHAR(500)", mandatory: false, description: "Private notes" },
        { name: "is_private", type: "BIT", mandatory: true, description: "Hidden from manager", defaultValue: "1" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Check-in timestamp", defaultValue: "GETUTCDATE()" }
      ],
      indexes: ["IX_WellbeingCheckIns_StaffDate (staff_id, check_in_date)"]
    },

    // ============================================================================
    // PIP SCHEMA - Performance Improvement Plans
    // ============================================================================
    {
      name: "PerformanceImprovementPlans",
      schema: "performance_pip",
      description: "Performance Improvement Plan records",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", indexed: true },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Employee on PIP", indexed: true },
        { name: "manager_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Manager overseeing PIP" },
        { name: "hr_partner_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "HR Business Partner" },
        { name: "reason", type: "NVARCHAR(MAX)", mandatory: true, description: "Reason for PIP" },
        { name: "performance_gaps", type: "NVARCHAR(MAX)", mandatory: false, description: "JSON array of gaps" },
        { name: "expected_outcomes", type: "NVARCHAR(MAX)", mandatory: false, description: "JSON array of outcomes" },
        { name: "support_provided", type: "NVARCHAR(MAX)", mandatory: false, description: "JSON array of support" },
        { name: "status", type: "NVARCHAR(50)", mandatory: true, description: "draft, active, extended, successful, unsuccessful, cancelled", defaultValue: "'draft'" },
        { name: "start_date", type: "DATE", mandatory: true, description: "PIP start date" },
        { name: "original_end_date", type: "DATE", mandatory: true, description: "Original planned end date" },
        { name: "current_end_date", type: "DATE", mandatory: true, description: "Current end date (may be extended)" },
        { name: "extension_count", type: "INT", mandatory: true, description: "Number of extensions", defaultValue: "0" },
        { name: "outcome", type: "NVARCHAR(50)", mandatory: false, description: "improved, extended, terminated, resigned" },
        { name: "outcome_notes", type: "NVARCHAR(MAX)", mandatory: false, description: "Outcome details" },
        { name: "outcome_date", type: "DATE", mandatory: false, description: "When outcome recorded" },
        { name: "hr_approved_at", type: "DATETIME2", mandatory: false, description: "HR approval timestamp" },
        { name: "hr_approved_by", type: "UNIQUEIDENTIFIER", mandatory: false, description: "HR approver" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation", defaultValue: "GETUTCDATE()" },
        { name: "updated_at", type: "DATETIME2", mandatory: true, description: "Last update", defaultValue: "GETUTCDATE()" }
      ],
      indexes: [
        "IX_PerformanceImprovementPlans_TenantId (tenant_id)",
        "IX_PerformanceImprovementPlans_StaffId (staff_id)",
        "IX_PerformanceImprovementPlans_Status (status)"
      ]
    },
    {
      name: "PIPMilestones",
      schema: "performance_pip",
      description: "Milestones within a PIP",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "pip_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Parent PIP", foreignKey: "performance_pip.PerformanceImprovementPlans.id", indexed: true },
        { name: "title", type: "NVARCHAR(255)", mandatory: true, description: "Milestone title" },
        { name: "description", type: "NVARCHAR(MAX)", mandatory: false, description: "Detailed requirements" },
        { name: "success_criteria", type: "NVARCHAR(MAX)", mandatory: true, description: "How success is measured" },
        { name: "target_date", type: "DATE", mandatory: true, description: "Milestone due date" },
        { name: "status", type: "NVARCHAR(50)", mandatory: true, description: "pending, in_progress, completed, missed", defaultValue: "'pending'" },
        { name: "completed_date", type: "DATE", mandatory: false, description: "When completed" },
        { name: "evidence", type: "NVARCHAR(MAX)", mandatory: false, description: "Completion evidence" },
        { name: "manager_notes", type: "NVARCHAR(MAX)", mandatory: false, description: "Manager assessment" },
        { name: "display_order", type: "INT", mandatory: true, description: "Order in PIP", defaultValue: "0" }
      ],
      indexes: ["IX_PIPMilestones_PIPId (pip_id)"]
    },
    {
      name: "PIPCheckIns",
      schema: "performance_pip",
      description: "Regular check-in records during PIP",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "pip_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Parent PIP", foreignKey: "performance_pip.PerformanceImprovementPlans.id", indexed: true },
        { name: "scheduled_date", type: "DATE", mandatory: true, description: "Scheduled check-in date" },
        { name: "completed_date", type: "DATE", mandatory: false, description: "When check-in completed" },
        { name: "attendees", type: "NVARCHAR(MAX)", mandatory: false, description: "JSON array of attendee IDs" },
        { name: "progress_rating", type: "INT", mandatory: false, description: "1-5 progress rating" },
        { name: "progress_summary", type: "NVARCHAR(MAX)", mandatory: false, description: "Progress discussion" },
        { name: "concerns", type: "NVARCHAR(MAX)", mandatory: false, description: "Issues or concerns" },
        { name: "next_steps", type: "NVARCHAR(MAX)", mandatory: false, description: "Agreed actions" },
        { name: "status", type: "NVARCHAR(20)", mandatory: true, description: "scheduled, completed, missed, rescheduled", defaultValue: "'scheduled'" },
        { name: "recorded_by", type: "UNIQUEIDENTIFIER", mandatory: false, description: "User who recorded" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation", defaultValue: "GETUTCDATE()" }
      ],
      indexes: ["IX_PIPCheckIns_PIPId (pip_id)"]
    },

    // ============================================================================
    // CONVERSATIONS SCHEMA - 1:1 Meetings
    // ============================================================================
    {
      name: "Conversations",
      schema: "performance_conversations",
      description: "1:1 conversation records between managers and staff",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier", indexed: true },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Staff member", indexed: true },
        { name: "manager_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Manager", indexed: true },
        { name: "conversation_type", type: "NVARCHAR(50)", mandatory: true, description: "one_on_one, check_in, coaching, feedback, career" },
        { name: "title", type: "NVARCHAR(255)", mandatory: false, description: "Meeting title" },
        { name: "scheduled_date", type: "DATETIME2", mandatory: true, description: "Scheduled date/time" },
        { name: "duration_minutes", type: "INT", mandatory: true, description: "Meeting duration", defaultValue: "30" },
        { name: "meeting_link", type: "NVARCHAR(500)", mandatory: false, description: "Video meeting URL" },
        { name: "status", type: "NVARCHAR(50)", mandatory: true, description: "scheduled, completed, cancelled, rescheduled", defaultValue: "'scheduled'" },
        { name: "completed_at", type: "DATETIME2", mandatory: false, description: "When meeting completed" },
        { name: "recurrence_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Recurring series ID" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation", defaultValue: "GETUTCDATE()" }
      ],
      indexes: [
        "IX_Conversations_TenantId (tenant_id)",
        "IX_Conversations_StaffId (staff_id)",
        "IX_Conversations_ManagerId (manager_id)",
        "IX_Conversations_ScheduledDate (scheduled_date)"
      ]
    },
    {
      name: "ConversationAgendaItems",
      schema: "performance_conversations",
      description: "Agenda items for conversations",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "conversation_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Parent conversation", foreignKey: "performance_conversations.Conversations.id", indexed: true },
        { name: "added_by", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Who added item" },
        { name: "content", type: "NVARCHAR(500)", mandatory: true, description: "Agenda item text" },
        { name: "is_discussed", type: "BIT", mandatory: true, description: "Marked as discussed", defaultValue: "0" },
        { name: "display_order", type: "INT", mandatory: true, description: "Order in agenda", defaultValue: "0" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "When added", defaultValue: "GETUTCDATE()" }
      ],
      indexes: ["IX_ConversationAgendaItems_ConversationId (conversation_id)"]
    },
    {
      name: "ConversationNotes",
      schema: "performance_conversations",
      description: "Notes captured during conversations",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "conversation_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Parent conversation", foreignKey: "performance_conversations.Conversations.id", indexed: true },
        { name: "content", type: "NVARCHAR(MAX)", mandatory: true, description: "Note content" },
        { name: "is_private", type: "BIT", mandatory: true, description: "Private to author", defaultValue: "0" },
        { name: "created_by", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Note author" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "When captured", defaultValue: "GETUTCDATE()" }
      ],
      indexes: ["IX_ConversationNotes_ConversationId (conversation_id)"]
    },
    {
      name: "ConversationActionItems",
      schema: "performance_conversations",
      description: "Action items from conversations",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "conversation_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Parent conversation", foreignKey: "performance_conversations.Conversations.id", indexed: true },
        { name: "description", type: "NVARCHAR(500)", mandatory: true, description: "Action item text" },
        { name: "owner_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Assigned owner" },
        { name: "due_date", type: "DATE", mandatory: false, description: "Due date" },
        { name: "status", type: "NVARCHAR(20)", mandatory: true, description: "open, completed, cancelled", defaultValue: "'open'" },
        { name: "completed_at", type: "DATETIME2", mandatory: false, description: "When completed" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "When created", defaultValue: "GETUTCDATE()" }
      ],
      indexes: ["IX_ConversationActionItems_ConversationId (conversation_id)", "IX_ConversationActionItems_OwnerId (owner_id)"]
    }
  ],

  // ============================================================================
  // INTEGRATIONS
  // ============================================================================
  integrations: [
    { system: "Roster Module", type: "Internal", description: "Leave patterns and attendance visible for performance context" },
    { system: "Awards Module", type: "Internal", description: "Performance ratings inform merit increase recommendations" },
    { system: "Staff Profiles", type: "Internal", description: "Certifications and qualifications linked to development" },
    { system: "SSO Provider", type: "External", description: "Single sign-on via SAML, OAuth, Azure AD, Okta" },
    { system: "Microsoft Teams", type: "External", description: "1:1 meeting scheduling and video links" },
    { system: "Zoom", type: "External", description: "Video meeting integration for 1:1s and reviews" },
    { system: "Google Meet", type: "External", description: "Video meeting integration" },
    { system: "Google Calendar", type: "External", description: "Calendar sync for meetings and deadlines" },
    { system: "Outlook Calendar", type: "External", description: "Calendar sync for meetings and deadlines" },
    { system: "Document Storage", type: "External", description: "LMS content, certificates, and evidence storage" },
    { system: "Email/Notification", type: "External", description: "Review reminders, praise notifications, survey invitations" },
    { system: "HRIS", type: "External", description: "Staff data sync, org structure, employment details" }
  ],

  // ============================================================================
  // BUSINESS RULES
  // ============================================================================
  businessRules: [
    { id: "BR-PRF-001", rule: "Performance reviews must include both self and manager assessment before calibration", rationale: "Ensures balanced perspective and employee voice" },
    { id: "BR-PRF-002", rule: "Anonymous feedback requires minimum 3 responses before display", rationale: "Protects anonymity of feedback providers" },
    { id: "BR-PRF-003", rule: "OKR progress cannot exceed 100% without manager approval", rationale: "Prevents gaming of stretch goals" },
    { id: "BR-PRF-004", rule: "PIP must have minimum 3 milestones and weekly check-ins", rationale: "Ensures structured improvement opportunity" },
    { id: "BR-PRF-005", rule: "Employee must acknowledge review within 14 days or it auto-closes", rationale: "Ensures timely completion of review process" },
    { id: "BR-PRF-006", rule: "Recognition points expire after 12 months if not redeemed", rationale: "Encourages engagement with reward program" },
    { id: "BR-PRF-007", rule: "Learning path completion requires all required courses to be passed", rationale: "Ensures skill development is verified" },
    { id: "BR-PRF-008", rule: "9-Box position changes require documented justification", rationale: "Audit trail for talent decisions" },
    { id: "BR-PRF-009", rule: "Succession candidates must have consent to be tracked", rationale: "Privacy and career transparency" },
    { id: "BR-PRF-010", rule: "Calibration rating adjustments require minimum 20-character justification", rationale: "Ensures meaningful documentation" },
    { id: "BR-PRF-011", rule: "Peer nominations for 360° require manager approval within 48 hours", rationale: "Prevents inappropriate nominations while keeping process moving" },
    { id: "BR-PRF-012", rule: "eNPS scores suppressed if department has fewer than 5 responses", rationale: "Statistical significance and anonymity protection" },
    { id: "BR-PRF-013", rule: "Merit increase recommendations must stay within +/- 1% of guideline without director approval", rationale: "Budget control with flexibility" },
    { id: "BR-PRF-014", rule: "Course assessment allows maximum 3 attempts unless Learning Admin overrides", rationale: "Encourages genuine learning while allowing reasonable attempts" },
    { id: "BR-PRF-015", rule: "Key Result weights within an Objective must sum to 1.0 (100%)", rationale: "Mathematical consistency in progress calculation" }
  ]
};
