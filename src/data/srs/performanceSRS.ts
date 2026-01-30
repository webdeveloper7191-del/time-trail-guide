// Performance Module - Software Requirements Specification

import { ModuleSRS } from './rosterSRS';

export const performanceSRS: ModuleSRS = {
  moduleName: "Performance Management",
  version: "1.0.0",
  lastUpdated: "2026-01-30",
  overview: `The Performance Management module provides a comprehensive suite of tools for managing employee performance, development, and engagement. It encompasses goal setting and OKR tracking, performance reviews and calibration, 360° feedback, learning management, talent assessment (including 9-Box Grid and succession planning), recognition programs, and employee engagement surveys. The system supports both manager-led and self-service workflows, with deep integration across all performance-related activities.`,
  
  objectives: [
    "Increase goal completion rates by 40% through structured OKR framework",
    "Reduce performance review cycle time by 60% through automation",
    "Improve employee engagement scores by 25% through continuous feedback",
    "Enable data-driven talent decisions through 9-Box and succession planning",
    "Increase learning completion rates by 50% through integrated LMS",
    "Create a culture of recognition through gamified praise and rewards",
    "Provide real-time visibility into organizational performance health"
  ],

  scope: [
    "OKR (Objectives and Key Results) management with cascading alignment",
    "Individual goal setting with milestones and progress tracking",
    "Performance review cycles with configurable criteria",
    "Calibration sessions for rating alignment",
    "360° feedback collection and analysis",
    "Recognition and praise wall with points-based rewards",
    "Learning Management System (LMS) with courses and paths",
    "Talent assessment including 9-Box Grid mapping",
    "Succession planning for key roles",
    "Pulse surveys and eNPS tracking",
    "1:1 conversation scheduling and tracking",
    "Performance Improvement Plans (PIP) management",
    "Development plans with linked resources",
    "Career pathing visualization",
    "Compensation integration (merit and bonus)"
  ],

  outOfScope: [
    "Payroll and compensation processing",
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
        "Create and update personal goals",
        "View own OKRs and progress",
        "Complete self-assessment in reviews",
        "Provide peer feedback when requested",
        "Access own learning courses and certificates",
        "Give praise to colleagues",
        "Redeem reward points",
        "Complete pulse surveys",
        "Request 1:1 meetings"
      ]
    },
    {
      name: "Manager",
      description: "People leader responsible for team performance and development",
      permissions: [
        "All Employee permissions",
        "Create and assign team OKRs",
        "Conduct performance reviews for direct reports",
        "Assign development plans and courses",
        "Schedule and conduct 1:1 conversations",
        "Nominate team members for rewards",
        "View team engagement metrics",
        "Initiate and manage PIPs",
        "Participate in calibration sessions"
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
        "View 9-Box talent maps for department"
      ]
    },
    {
      name: "HR Business Partner",
      description: "HR professional supporting business units with people strategy",
      permissions: [
        "View all performance data for assigned business units",
        "Configure review cycles and criteria",
        "Manage talent assessment processes",
        "Run engagement surveys",
        "Access compliance and audit reports",
        "Oversee PIP processes",
        "Configure recognition programs"
      ]
    },
    {
      name: "Learning Administrator",
      description: "Manages learning content and enrollment",
      permissions: [
        "Create and manage courses and learning paths",
        "Assign courses to employees",
        "View learning analytics",
        "Manage certifications and renewals",
        "Configure assessment questions"
      ]
    },
    {
      name: "Executive / C-Suite",
      description: "Organization leadership requiring strategic visibility",
      permissions: [
        "View organization-wide dashboards",
        "Access succession planning for executive roles",
        "View aggregate engagement and performance trends",
        "Approve significant compensation decisions"
      ]
    },
    {
      name: "System Administrator",
      description: "Technical administrator for configuration and maintenance",
      permissions: [
        "Configure all module settings",
        "Manage integration connections",
        "Access audit logs",
        "Manage user roles and permissions",
        "Configure notification templates"
      ]
    }
  ],

  functionalRequirements: [
    { id: "FR-PRF-001", category: "OKRs", requirement: "System shall support hierarchical OKRs (Company → Team → Individual)", priority: "Critical" },
    { id: "FR-PRF-002", category: "OKRs", requirement: "System shall allow Key Results with measurable targets and progress tracking", priority: "Critical" },
    { id: "FR-PRF-003", category: "OKRs", requirement: "System shall calculate objective progress from weighted key result progress", priority: "High" },
    { id: "FR-PRF-004", category: "Goals", requirement: "System shall support individual goals with milestones and due dates", priority: "High" },
    { id: "FR-PRF-005", category: "Goals", requirement: "System shall allow linking goals to OKRs, courses, and development plans", priority: "Medium" },
    { id: "FR-PRF-006", category: "Reviews", requirement: "System shall support configurable review cycles (annual, semi-annual, quarterly)", priority: "Critical" },
    { id: "FR-PRF-007", category: "Reviews", requirement: "System shall include self-assessment, manager assessment, and calibration phases", priority: "Critical" },
    { id: "FR-PRF-008", category: "Reviews", requirement: "System shall support configurable rating criteria and scales", priority: "High" },
    { id: "FR-PRF-009", category: "Reviews", requirement: "System shall enforce review completion deadlines with reminders", priority: "High" },
    { id: "FR-PRF-010", category: "Calibration", requirement: "System shall provide calibration interface for rating alignment", priority: "High" },
    { id: "FR-PRF-011", category: "Calibration", requirement: "System shall show bell-curve distribution during calibration", priority: "Medium" },
    { id: "FR-PRF-012", category: "Feedback", requirement: "System shall support 360° feedback collection from multiple sources", priority: "High" },
    { id: "FR-PRF-013", category: "Feedback", requirement: "System shall allow anonymous feedback with aggregation thresholds", priority: "High" },
    { id: "FR-PRF-014", category: "Recognition", requirement: "System shall provide praise wall for public recognition", priority: "High" },
    { id: "FR-PRF-015", category: "Recognition", requirement: "System shall support points-based reward system", priority: "Medium" },
    { id: "FR-PRF-016", category: "Recognition", requirement: "System shall offer reward catalog for point redemption", priority: "Medium" },
    { id: "FR-PRF-017", category: "LMS", requirement: "System shall manage courses with modules and assessments", priority: "High" },
    { id: "FR-PRF-018", category: "LMS", requirement: "System shall track course enrollment, progress, and completion", priority: "High" },
    { id: "FR-PRF-019", category: "LMS", requirement: "System shall issue certificates upon course completion", priority: "Medium" },
    { id: "FR-PRF-020", category: "LMS", requirement: "System shall support learning paths with sequential courses", priority: "Medium" },
    { id: "FR-PRF-021", category: "Talent", requirement: "System shall provide 9-Box Grid for talent mapping", priority: "High" },
    { id: "FR-PRF-022", category: "Talent", requirement: "System shall track flight risk and succession readiness", priority: "High" },
    { id: "FR-PRF-023", category: "Succession", requirement: "System shall identify key roles and succession candidates", priority: "High" },
    { id: "FR-PRF-024", category: "Succession", requirement: "System shall track candidate readiness levels", priority: "Medium" },
    { id: "FR-PRF-025", category: "Engagement", requirement: "System shall support pulse surveys with configurable frequency", priority: "High" },
    { id: "FR-PRF-026", category: "Engagement", requirement: "System shall calculate and trend eNPS scores", priority: "High" },
    { id: "FR-PRF-027", category: "1:1s", requirement: "System shall support 1:1 conversation scheduling and tracking", priority: "High" },
    { id: "FR-PRF-028", category: "1:1s", requirement: "System shall maintain conversation history and action items", priority: "High" },
    { id: "FR-PRF-029", category: "PIP", requirement: "System shall support Performance Improvement Plan creation and tracking", priority: "High" },
    { id: "FR-PRF-030", category: "PIP", requirement: "System shall enforce PIP workflow with milestones and outcomes", priority: "High" },
    { id: "FR-PRF-031", category: "Compensation", requirement: "System shall integrate merit increase recommendations with reviews", priority: "Medium" },
    { id: "FR-PRF-032", category: "Compensation", requirement: "System shall support bonus calculation based on performance", priority: "Medium" },
    { id: "FR-PRF-033", category: "Career", requirement: "System shall visualize career paths with progression requirements", priority: "Medium" },
    { id: "FR-PRF-034", category: "Skills", requirement: "System shall track skills with proficiency levels", priority: "Medium" },
    { id: "FR-PRF-035", category: "Development", requirement: "System shall link development plans to goals and courses", priority: "Medium" }
  ],

  nonFunctionalRequirements: [
    { id: "NFR-PRF-001", category: "Performance", requirement: "Dashboard shall load within 3 seconds for managers with up to 50 reports" },
    { id: "NFR-PRF-002", category: "Performance", requirement: "Review form shall auto-save within 2 seconds of changes" },
    { id: "NFR-PRF-003", category: "Scalability", requirement: "System shall support 10,000 concurrent users during review periods" },
    { id: "NFR-PRF-004", category: "Privacy", requirement: "Anonymous feedback shall require minimum 3 responses before display" },
    { id: "NFR-PRF-005", category: "Security", requirement: "Review ratings visible only to authorized reviewers and HR" },
    { id: "NFR-PRF-006", category: "Audit", requirement: "All rating changes logged with user, timestamp, and previous value" },
    { id: "NFR-PRF-007", category: "Availability", requirement: "99.9% uptime during review submission windows" },
    { id: "NFR-PRF-008", category: "Usability", requirement: "Mobile-responsive interface for feedback and survey completion" }
  ],

  userStories: [
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
        "1. CEO sets Company OKR: 'Become #1 childcare provider in Victoria'",
        "2. Key Result: 'Increase centres from 10 to 15'",
        "3. Operations Director views company OKRs",
        "4. Creates aligned Department OKR: 'Ensure staffing capacity for expansion'",
        "5. Key Result: 'Reduce staff turnover to < 10%'",
        "6. Centre Manager Sarah views department OKRs",
        "7. Creates Team OKR: 'Build high-performing Sunshine Centre team'",
        "8. Key Result 1: 'Achieve 90% staff satisfaction score'",
        "9. Key Result 2: 'Complete leadership training for 5 educators'",
        "10. Links Team OKR to Department OKR",
        "11. Educator Emma views team OKR",
        "12. Creates Individual OKR: 'Develop leadership capabilities'",
        "13. Key Result: 'Complete 3 leadership courses by Q2'",
        "14. Alignment tree shows Company → Dept → Team → Individual connection",
        "15. As Emma completes courses, progress flows up the tree"
      ],
      realWorldExample: {
        scenario: "Sunshine Childcare sets ambitious growth targets. Each level of the organization creates aligned OKRs to contribute.",
        steps: [
          "Q1 planning: CEO presents company vision and OKRs",
          "Company OKR: 'Expand to 15 centres while maintaining quality'",
          "Key Results focus on centre openings, ratings, and staff retention",
          "Operations Director creates department OKR to support expansion",
          "Focus on staffing capacity and training infrastructure",
          "Centre Manager Sarah creates her team's contribution",
          "Team OKR: 'Model high-performance culture at Sunshine Centre'",
          "KR1: Staff satisfaction 90%+ (measured quarterly)",
          "KR2: 100% compliance rating in regulatory audits",
          "KR3: 5 staff complete leadership pathway",
          "Sarah shares OKRs in team meeting",
          "Each educator creates individual OKRs",
          "Educator Emma: 'Step up as senior educator'",
          "Emma's KRs: Complete courses, mentor 2 juniors, lead 1 parent event",
          "Weekly check-ins update KR progress",
          "Q1 review shows alignment from individual to company"
        ],
        outcome: "All 150 staff have OKRs that visibly connect to company goals. Progress is transparent, and contribution to strategic objectives is clear."
      }
    },
    {
      id: "US-PRF-002",
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
        "Review must be acknowledged by employee"
      ],
      priority: "critical",
      relatedModules: [
        { module: "OKRs", relationship: "Goal achievement informs performance rating" },
        { module: "Compensation", relationship: "Final rating drives merit increase eligibility" }
      ],
      endToEndJourney: [
        "1. HR launches Annual Review cycle on 1 November",
        "2. All employees receive email: 'Annual Review Open - Due 15 Nov'",
        "3. Educator Emma opens the Performance module",
        "4. Sees Review section with 'Complete Self-Assessment'",
        "5. Reviews the 5 criteria: Quality, Teamwork, Initiative, Development, Values",
        "6. For each criterion, adds self-rating and examples",
        "7. Quality: Rates 4/5, adds example of positive parent feedback",
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
        scenario: "Sunshine Childcare runs its annual performance review in November. All 52 staff complete self-assessments followed by manager reviews.",
        steps: [
          "HR sets up review cycle with 5 criteria aligned to company values",
          "Cycle opens 1 November, all staff notified",
          "Educator Emma logs in and sees her pending review",
          "She spends 30 minutes completing her self-assessment",
          "For 'Quality of Care' she rates herself 4/5",
          "Adds evidence: 'Received 3 parent compliment emails'",
          "For 'Professional Development' she rates 5/5",
          "Evidence: 'Completed Diploma and 4 elective courses'",
          "Submits by 10 November deadline",
          "Centre Manager Sarah reviews all 12 direct reports",
          "For Emma, agrees with most self-ratings",
          "Adjusts 'Initiative' from 4 to 3: 'Room for more proactive contribution'",
          "Overall manager rating: 4 - Exceeds Expectations",
          "Adds narrative: 'Strong year, ready for senior responsibilities'",
          "HR runs calibration session with all centre managers",
          "Discuss distribution: 8% Exceptional, 72% Meets, 20% Needs Work",
          "Emma's rating of 4 confirmed - consistent with evidence",
          "Sarah meets Emma, shares feedback and development focus",
          "Emma acknowledges and sets goals for next year"
        ],
        outcome: "Emma receives fair, calibrated feedback with clear examples. Her strong performance is recognized and linked to merit increase."
      }
    },
    {
      id: "US-PRF-003",
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
        "1. Manager Sarah wants 360 feedback for Lead Educator Emma",
        "2. Opens Emma's profile and clicks '360° Feedback'",
        "3. Selects feedback type: 'Leadership Competencies'",
        "4. Nominates 6 peer educators, 2 assistant educators, 1 parent rep",
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
        scenario: "Lead Educator Emma is being considered for a Centre Coordinator role. Sarah gathers 360 feedback to assess her leadership readiness.",
        steps: [
          "Sarah opens 360 Feedback tool for Emma",
          "Selects 'Leadership Assessment' template",
          "Nominates 5 peer educators who work closely with Emma",
          "Nominates 3 assistant educators who Emma supervises",
          "Adds 1 parent volunteer for external perspective",
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
      id: "US-PRF-004",
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
        "13. Filters grid to show 'Education' department only",
        "14. Exports filtered grid for talent review meeting",
        "15. In meeting, discusses each quadrant's development needs",
        "16. Action: Accelerate 'Stars' into leadership programs"
      ],
      realWorldExample: {
        scenario: "Sunshine Childcare conducts annual talent review to identify future leaders and plan development investments.",
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
          "Identify Emma as ready for Centre Coordinator within 12 months",
          "Create action plan: leadership course, mentor assignment, acting role",
          "Discuss underperformers - 2 have improvement plans, 3 need support",
          "Export grid for board talent update",
          "Track movement quarterly - goal: 10% in 'Star' box by year-end"
        ],
        outcome: "Organization has clear view of talent distribution. 8 'Stars' identified for accelerated development. 5 underperformers receive targeted support."
      }
    },
    {
      id: "US-PRF-005",
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
      id: "US-PRF-006",
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
        "1. Educator Tom notices Emma handled a difficult parent situation brilliantly",
        "2. Opens Performance module and clicks 'Give Praise'",
        "3. Searches for Emma and selects her",
        "4. Types message: 'Amazing job with that upset parent today! You stayed calm and turned it around completely.'",
        "5. Selects culture value: 'Excellence in Care'",
        "6. Chooses badge: 'Parent Whisperer' 🌟",
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
        scenario: "After a challenging morning with an upset parent, Emma handled the situation professionally. Tom wants to publicly recognize her.",
        steps: [
          "Morning at Sunshine Centre - a parent is very upset about an incident",
          "Emma calmly listens, empathizes, and finds a solution",
          "Parent leaves satisfied and later sends a thank-you email",
          "Tom witnessed the interaction and is impressed",
          "At lunch, Tom opens the app and clicks 'Give Praise'",
          "Searches 'Emma' and selects her profile",
          "Writes: 'Amazing job with Mrs. Johnson this morning! Your calm approach and genuine empathy turned a tough situation into a positive. Real leadership! 👏'",
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
      id: "US-PRF-007",
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
        { module: "HR System", relationship: "Outcome may trigger termination process" }
      ],
      endToEndJourney: [
        "1. Manager Sarah has concerns about educator John's performance",
        "2. Consults with HR - informal coaching hasn't improved situation",
        "3. HR agrees PIP is appropriate next step",
        "4. Sarah opens Performance module, navigates to John's profile",
        "5. Clicks 'Initiate PIP'",
        "6. Enters reason: 'Consistent late arrivals, incomplete documentation'",
        "7. Sets duration: 60 days",
        "8. Creates Milestone 1: 'Zero late arrivals for 2 weeks'",
        "9. Creates Milestone 2: 'Complete all daily documentation on time'",
        "10. Creates Milestone 3: 'Positive parent feedback maintained'",
        "11. System schedules weekly check-ins",
        "12. HR reviews and approves PIP",
        "13. John receives formal PIP notification",
        "14. Meeting held to discuss expectations and support",
        "15. Week 1 check-in: John arrived on time all week ✓",
        "16. Week 4 check-in: Documentation still inconsistent ✗",
        "17. Sarah documents concerns and extends Milestone 2",
        "18. By Day 60, John meets all milestones",
        "19. Sarah records outcome: 'Successful Completion'",
        "20. PIP closes, John returns to normal performance tracking"
      ],
      realWorldExample: {
        scenario: "Educator John has been arriving late and not completing required documentation despite informal warnings. A formal PIP is necessary.",
        steps: [
          "Sarah documents pattern: 8 late arrivals in past month",
          "Daily observation notes missing 40% of time",
          "Informal coaching conversations haven't worked",
          "Sarah meets with HR to discuss options",
          "HR advises formal PIP with clear improvement targets",
          "Sarah creates PIP with 60-day duration",
          "Milestones defined:",
          "  1. Punctuality: Zero late arrivals (tracked via clock-in)",
          "  2. Documentation: 100% completion of daily notes",
          "  3. Quality: Maintain positive parent interactions",
          "Support offered: Alarm reminder, documentation template, buddy check-in",
          "HR approves the PIP",
          "John receives formal letter and meets with Sarah and HR",
          "Expectations explained, support discussed, John signs acknowledgment",
          "System schedules weekly check-ins on Friday afternoons",
          "Week 1: John on time every day, documentation improved",
          "Week 2: One late arrival, Sarah documents and discusses",
          "Week 3-4: Sustained improvement across all areas",
          "Week 6-8: John maintains standards consistently",
          "Day 60: Final review - all milestones met",
          "Sarah records 'Successful Completion' with HR approval",
          "John receives confirmation letter",
          "PIP closed, regular performance tracking resumes"
        ],
        outcome: "John successfully improves with structured support. Documentation protects both employee and organization. No termination necessary."
      }
    },
    {
      id: "US-PRF-008",
      title: "Plan Succession for Key Role",
      actors: ["HR Business Partner", "Senior Manager"],
      description: "As an HR Business Partner, I want to identify and develop succession candidates for key roles, so that we have leadership continuity and are prepared for planned or unplanned departures.",
      acceptanceCriteria: [
        "Can designate roles as 'Key Roles' for succession planning",
        "Can assign succession candidates to each key role",
        "Candidates have readiness assessment (Ready Now, 1-2 Years, 3+ Years)",
        "Can track development actions for each candidate",
        "Dashboard shows succession coverage by role",
        "Alerts when key roles have no Ready Now candidates"
      ],
      businessLogic: [
        "Key role criteria: strategic impact, difficulty to replace, knowledge concentration",
        "Each key role should have 2-3 candidates",
        "Readiness levels: Ready Now, 1-2 Years, 3+ Years, Develop",
        "Development actions linked to readiness gaps",
        "Emergency succession plan for Ready Now candidates",
        "Update succession plans annually or on role change"
      ],
      priority: "high",
      relatedModules: [
        { module: "Talent 9-Box", relationship: "High-potential talent considered for succession" },
        { module: "Development", relationship: "Succession candidates have development plans" }
      ],
      endToEndJourney: [
        "1. HR identifies 'Centre Director' as key role for succession planning",
        "2. Opens Succession module and adds role",
        "3. Enters current incumbent: Sarah (Sunshine Centre)",
        "4. Reviews 9-Box to identify high-potential candidates",
        "5. Adds 3 candidates: Emma (Lead Educator), Maria (Assistant Director), James (External)",
        "6. Assesses Emma: Performance 4, Potential 5 = High",
        "7. Readiness assessment for Emma: '1-2 Years'",
        "8. Identifies gaps: Financial management, regulatory compliance",
        "9. Creates development actions for Emma",
        "10. Action 1: Shadow Sarah on budgeting for 3 months",
        "11. Action 2: Complete compliance certification",
        "12. Maria assessed as 'Ready Now' - already has experience",
        "13. James (external) marked as emergency backup",
        "14. Dashboard shows: Centre Director = 1 Ready Now, 1 In Development",
        "15. Quarterly review updates progress on development actions",
        "16. After 12 months, Emma moves to 'Ready Now'"
      ],
      realWorldExample: {
        scenario: "Sunshine Childcare's Centre Director Sarah is considering retirement in 2 years. HR needs to build succession pipeline.",
        steps: [
          "HR Business Partner opens Succession Planning module",
          "Adds 'Centre Director - Sunshine' as key role",
          "Current holder: Sarah, retirement projected 2027",
          "Reviews internal talent pool from 9-Box",
          "Three candidates identified:",
          "  - Emma (Lead Educator): High performer, high potential",
          "  - Maria (Assistant Director at other centre): Experienced",
          "  - External: James (Former director, now consultant)",
          "Emma assessed:",
          "  - Strengths: Team leadership, parent relations, education quality",
          "  - Gaps: Budget management, regulatory compliance, HR issues",
          "  - Readiness: 1-2 Years",
          "Development plan created for Emma:",
          "  - Shadow Sarah on monthly budgeting",
          "  - Attend compliance audit as observer",
          "  - Complete Centre Management certification",
          "  - Act as Director during Sarah's leave (3 weeks)",
          "Maria assessed as 'Ready Now' - backup if urgent",
          "Dashboard shows: Coverage = 67% (2 of 3 roles have Ready Now)",
          "Quarterly review: Emma progressing well",
          "12 months later: Emma moves to 'Ready Now'",
          "When Sarah announces retirement, smooth transition planned"
        ],
        outcome: "Key role has developed succession pipeline. Emma ready to step up when Sarah retires. No leadership gap anticipated."
      }
    },
    {
      id: "US-PRF-009",
      title: "Schedule and Track 1:1 Conversations",
      actors: ["Manager", "Employee"],
      description: "As a Manager, I want to schedule regular 1:1 conversations with my team members and track discussion topics and action items, so that I can provide consistent coaching and support.",
      acceptanceCriteria: [
        "Can schedule recurring or one-off 1:1 meetings",
        "Both manager and employee can add agenda items",
        "Meeting notes captured during or after conversation",
        "Action items created with owners and due dates",
        "History of all 1:1s visible on employee profile",
        "Integration with calendar systems (Google, Outlook)"
      ],
      businessLogic: [
        "Recommended frequency: Weekly or bi-weekly",
        "Agenda template options: Check-in, Development, Performance",
        "Private notes visible only to manager",
        "Shared notes visible to both parties",
        "Action items can link to goals or development plans",
        "Missed 1:1s flagged for manager attention"
      ],
      priority: "high",
      relatedModules: [
        { module: "Goals", relationship: "Action items can become goal milestones" },
        { module: "Development", relationship: "1:1 discussions feed into development plans" }
      ],
      endToEndJourney: [
        "1. Manager Sarah sets up recurring 1:1s with Emma",
        "2. Selects frequency: Every 2 weeks, Friday 2 PM",
        "3. Duration: 30 minutes",
        "4. System sends calendar invite to both",
        "5. Before meeting, Emma adds agenda item: 'Discuss leadership course'",
        "6. Sarah adds: 'Review progress on Q1 goal'",
        "7. Friday 2 PM: Meeting begins",
        "8. Sarah opens 1:1 in system during conversation",
        "9. Takes notes under each agenda item",
        "10. Creates action item: 'Emma to complete Module 3 by next 1:1'",
        "11. After meeting, Emma receives summary email",
        "12. Action item tracked in Emma's profile",
        "13. Next 1:1: Previous action items shown for follow-up"
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
          "  - Feedback from recent parent event",
          "Friday 2 PM: Meeting happens",
          "Sarah captures notes in system:",
          "  - Emma completed 2 of 5 modules ✓",
          "  - Struggling to delegate programming tasks",
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
    {
      id: "US-PRF-010",
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
        "8. Optional comment: 'Need better laptops'",
        "9. Submits survey (90 seconds total)",
        "10. Thank you message displayed",
        "11. HR views aggregated results next week",
        "12. eNPS: +35 (65% promoters, 30% detractors)",
        "13. 'Tools' question flags for attention (avg 3.2)"
      ],
      realWorldExample: {
        scenario: "Sunshine Childcare runs monthly pulse surveys to track employee sentiment. This month's focus includes the new scheduling system.",
        steps: [
          "First Monday of month: Pulse survey goes live",
          "All 52 staff receive push notification",
          "Emma opens her app during lunch break",
          "Survey appears: '5 quick questions about your experience'",
          "Q1: 'I feel valued at work' - Emma rates 4",
          "Q2: 'My manager supports my development' - rates 5",
          "Q3: 'I have the resources I need to do my job well' - rates 3",
          "Q4: 'I feel connected to our mission' - rates 5",
          "Q5: 'How likely are you to recommend Sunshine as an employer to a friend?' - rates 8",
          "Optional comment box: 'Love the team, but our tablets are slow'",
          "Submits - total time: 75 seconds",
          "By Friday: 45 of 52 staff completed (87% response)",
          "HR views results:",
          "  eNPS: +42 (excellent)",
          "    Promoters (9-10): 52%",
          "    Passives (7-8): 38%",
          "    Detractors (0-6): 10%",
          "  Lowest score: 'Resources' - 3.4 avg",
          "  Comments theme: Technology/equipment concerns",
          "HR flags IT equipment issue for leadership",
          "Action plan created: Tablet replacement program",
          "Next month's survey tracks improvement"
        ],
        outcome: "Real-time engagement insights reveal actionable issue. Organization responds to equipment concerns. Staff feel heard."
      }
    },
    {
      id: "US-PRF-011",
      title: "Request and Provide Peer Feedback",
      actors: ["Employee", "Manager"],
      description: "As an Employee, I want to request feedback from peers who have worked with me, so that I can understand how I'm perceived and identify development areas.",
      acceptanceCriteria: [
        "Can select specific peers to request feedback from",
        "Feedback template includes competency ratings",
        "Open-ended questions capture qualitative input",
        "Feedback can be anonymous or attributed",
        "Manager notified when feedback received",
        "Employee can view aggregated feedback summary"
      ],
      businessLogic: [
        "Maximum peer requests: 5 per quarter",
        "Request expires after 14 days if not completed",
        "Anonymous requires minimum 3 responses for display",
        "Attributed feedback shows name with consent",
        "Competency ratings: 1-5 scale",
        "Optional 'growth area' and 'strength' prompts"
      ],
      priority: "medium",
      relatedModules: [
        { module: "360 Feedback", relationship: "Peer feedback feeds into 360 processes" },
        { module: "Reviews", relationship: "Feedback can inform performance reviews" }
      ],
      endToEndJourney: [
        "1. Educator Emma wants feedback on her team collaboration",
        "2. Opens Feedback section and clicks 'Request Feedback'",
        "3. Types focus area: 'Team collaboration and communication'",
        "4. Selects 4 colleagues who work closely with her",
        "5. Chooses: Anonymous (aggregated only)",
        "6. Sends request",
        "7. Colleagues receive notification to provide feedback",
        "8. Peer Maria opens feedback request",
        "9. Rates Emma's collaboration: 4/5",
        "10. Writes: 'Great at sharing ideas, could improve follow-through'",
        "11. After 3 responses received, Emma sees aggregated results",
        "12. Collaboration avg: 4.2/5",
        "13. Theme: Strong ideas, follow-through mentioned by 2 peers",
        "14. Emma discusses insights with manager in next 1:1"
      ],
      realWorldExample: {
        scenario: "Emma is preparing for her annual review and wants to gather peer perspectives on her collaboration skills.",
        steps: [
          "Emma opens the Feedback module",
          "Clicks 'Request Peer Feedback'",
          "Focus area: 'Collaboration and teamwork'",
          "Selects 4 close colleagues:",
          "  - Maria (same room, works daily)",
          "  - Tom (different room, project work)",
          "  - Sarah (cross-functional)",
          "  - John (same level, different team)",
          "Chooses anonymous feedback",
          "Writes personalized message: 'I'm working on my collaboration skills...'",
          "Sends request - all 4 notified",
          "Over next week, 3 respond:",
          "Maria rates:",
          "  - Collaboration: 4/5",
          "  - Communication: 5/5",
          "  - Strength: 'Always willing to help others'",
          "  - Growth: 'Sometimes takes on too much'",
          "Tom and Sarah also complete",
          "John doesn't respond (no consequence, optional)",
          "After 3 responses, Emma can view results:",
          "  Collaboration: 4.0 average",
          "  Communication: 4.7 average",
          "  Common strength: Supportive, shares knowledge",
          "  Common growth area: Follow-through on commitments",
          "Emma reviews insights",
          "Adds 'improve follow-through' to development goals",
          "Discusses with Sarah in 1:1 meeting"
        ],
        outcome: "Emma gains valuable peer perspective. Identifies specific development focus. Takes ownership of improvement."
      }
    },
    {
      id: "US-PRF-012",
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
        "3. Based on: Career aspiration to become Centre Coordinator",
        "4. Adds actions:",
        "5. Action 1: Complete Leadership course (Formal - 70%)",
        "6. Action 2: Shadow Sarah on budget meetings (Experience - 20%)",
        "7. Action 3: Mentor a new educator (Practice - 10%)",
        "8. Sets timeline: 6 months",
        "9. Links LMS course to Action 1",
        "10. Emma receives plan notification",
        "11. Emma starts Leadership course",
        "12. Marks modules complete as she progresses",
        "13. At quarterly review, 60% complete",
        "14. Sarah adjusts timeline for Action 2 (budget cycle delayed)",
        "15. At 6 months, plan marked complete",
        "16. Emma's profile shows: Leadership skill progressed to 'Intermediate'"
      ],
      realWorldExample: {
        scenario: "Emma aspires to become a Centre Coordinator. Sarah creates a comprehensive development plan to prepare her for the role.",
        steps: [
          "Sarah opens Emma's profile > Development section",
          "Clicks 'Create Development Plan'",
          "Plan name: 'Centre Coordinator Preparation'",
          "Duration: 6 months (Jan - June 2026)",
          "Focus Areas:",
          "  1. Leadership & People Management",
          "  2. Budget & Financial Acumen",
          "  3. Regulatory Compliance",
          "Creates actions for each focus:",
          "Leadership:",
          "  - Complete 'Leadership Foundations' path (LMS)",
          "  - Lead Toddler room for 4 weeks during leave cover",
          "  - Mentor 2 new educators",
          "Budget:",
          "  - Shadow Sarah on monthly budget review (3 sessions)",
          "  - Take ownership of room supplies budget",
          "Compliance:",
          "  - Complete Centre Coordinator compliance module",
          "  - Lead mock regulatory audit preparation",
          "Links LMS courses to relevant actions",
          "Submits plan - Emma receives notification",
          "Emma reviews and acknowledges",
          "Monthly progress updates:",
          "  Month 1: Leadership course 40%, mentoring started",
          "  Month 2: Course complete, first budget shadow done",
          "  Month 3: Acting Room Leader role begins",
          "At 6 months: All actions complete or progressing",
          "Emma's skill profile updated:",
          "  Leadership: Novice → Intermediate",
          "  Budget Management: Added as new skill",
          "Development plan marked 'Complete'"
        ],
        outcome: "Structured development accelerates Emma's readiness. Clear milestones maintain momentum. Skill progression documented."
      }
    },
    {
      id: "US-PRF-013",
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
        "2. 4 Centre Managers invited with their reviews",
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
        scenario: "Sunshine Childcare runs annual calibration across 4 centres to ensure fair and consistent performance ratings.",
        steps: [
          "November: All 52 reviews completed by managers",
          "HR schedules calibration for 22 November, 9 AM",
          "4 Centre Managers attend with HR facilitator",
          "Initial distribution across all centres:",
          "  Exceptional (5): 8 staff (15%)",
          "  Exceeds (4): 12 staff (23%)",
          "  Meets (3): 28 staff (54%)",
          "  Needs Improvement (2): 4 staff (8%)",
          "HR notes: Top-heavy - more 4s than typical",
          "Discussion starts with 'Exceptional' ratings:",
          "Centre 1: Sarah presents Emma's case",
          "  Evidence: 100% goal completion, led 3 initiatives, promoted internally",
          "  Group consensus: Confirmed as Exceptional",
          "Centre 2: Tom rated Exceptional",
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
    {
      id: "US-PRF-014",
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
        "Points may have expiry (e.g., 12 months)",
        "Rewards: Gift cards, experiences, merchandise",
        "Some rewards may have quantity limits",
        "Redemption triggers notification to HR for fulfillment",
        "Tax implications noted on taxable rewards"
      ],
      priority: "medium",
      relatedModules: [
        { module: "Recognition", relationship: "Points earned through praise and awards" },
        { module: "Payroll", relationship: "Taxable rewards reported to payroll" }
      ],
      endToEndJourney: [
        "1. Employee Emma checks her point balance: 450 points",
        "2. Opens Rewards Catalog",
        "3. Browses categories: Gift Cards, Experiences, Merchandise",
        "4. Filters to 'Under 500 points'",
        "5. Sees: Coffee voucher (100), Movie pass (250), Spa voucher (400)",
        "6. Selects: Spa voucher (400 points)",
        "7. Clicks 'Redeem Now'",
        "8. Confirmation: 'You're about to redeem 400 points for Spa Voucher'",
        "9. Confirms redemption",
        "10. Balance updates: 450 - 400 = 50 points remaining",
        "11. HR receives fulfillment notification",
        "12. Emma receives spa voucher code via email within 48 hours",
        "13. Redemption appears in Emma's history"
      ],
      realWorldExample: {
        scenario: "Emma has accumulated points through recognition from colleagues. She wants to treat herself to something special.",
        steps: [
          "Emma has received recognition throughout the year:",
          "  - 5 praise posts averaging 25 points each = 125 points",
          "  - 2 'Values Champion' badges at 100 points = 200 points",
          "  - Birthday bonus from company = 100 points",
          "  - Team achievement award = 50 points",
          "Total accumulated: 475 points",
          "Previous redemption: Coffee voucher (25 points)",
          "Current balance: 450 points",
          "Emma opens Rewards section",
          "Views catalog with excitement",
          "Categories: Gift Cards, Experiences, Wellness, Merchandise",
          "Clicks into 'Wellness' category:",
          "  - Massage voucher: 300 points",
          "  - Spa day voucher: 400 points",
          "  - Gym membership (1 month): 250 points",
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
    {
      id: "US-PRF-015",
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
          "  Education: 2 yellow skills (Assessment, Curriculum)",
          "Clicks into 'Leadership' skill in Operations:",
          "  Required for Room Leaders+: Advanced level",
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
    }
  ],

  tableSpecs: [
    {
      name: "OKRCycles",
      schema: "goals",
      description: "OKR time periods (quarters, years)",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier" },
        { name: "name", type: "NVARCHAR(100)", mandatory: true, description: "Cycle name (e.g., Q1 2026)" },
        { name: "start_date", type: "DATE", mandatory: true, description: "Cycle start date" },
        { name: "end_date", type: "DATE", mandatory: true, description: "Cycle end date" },
        { name: "is_active", type: "BIT", mandatory: true, description: "Currently active cycle", defaultValue: "1" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation" }
      ]
    },
    {
      name: "Objectives",
      schema: "goals",
      description: "OKR Objectives at various levels",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier" },
        { name: "cycle_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "OKR cycle", foreignKey: "goals.OKRCycles.id" },
        { name: "title", type: "NVARCHAR(500)", mandatory: true, description: "Objective statement" },
        { name: "description", type: "NVARCHAR(MAX)", mandatory: false, description: "Additional context" },
        { name: "level", type: "NVARCHAR(50)", mandatory: true, description: "company, department, team, individual" },
        { name: "owner_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Objective owner" },
        { name: "parent_objective_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Parent for alignment", foreignKey: "goals.Objectives.id" },
        { name: "status", type: "NVARCHAR(50)", mandatory: true, description: "draft, active, completed, cancelled", defaultValue: "draft" },
        { name: "progress", type: "DECIMAL(5,2)", mandatory: true, description: "Overall progress 0-100", defaultValue: "0" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation" },
        { name: "updated_at", type: "DATETIME2", mandatory: true, description: "Last update" }
      ]
    },
    {
      name: "KeyResults",
      schema: "goals",
      description: "Measurable Key Results for Objectives",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "objective_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Parent objective", foreignKey: "goals.Objectives.id" },
        { name: "title", type: "NVARCHAR(500)", mandatory: true, description: "Key result statement" },
        { name: "result_type", type: "NVARCHAR(50)", mandatory: true, description: "percentage, number, currency, boolean" },
        { name: "start_value", type: "DECIMAL(15,4)", mandatory: true, description: "Baseline value" },
        { name: "target_value", type: "DECIMAL(15,4)", mandatory: true, description: "Target to achieve" },
        { name: "current_value", type: "DECIMAL(15,4)", mandatory: true, description: "Current progress", defaultValue: "0" },
        { name: "weight", type: "DECIMAL(5,2)", mandatory: true, description: "Weight in objective (0-1)", defaultValue: "1" },
        { name: "progress", type: "DECIMAL(5,2)", mandatory: true, description: "Calculated progress 0-100", defaultValue: "0" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation" },
        { name: "updated_at", type: "DATETIME2", mandatory: true, description: "Last update" }
      ]
    },
    {
      name: "PerformanceReviews",
      schema: "reviews",
      description: "Individual performance review records",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier" },
        { name: "cycle_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Review cycle" },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Employee being reviewed" },
        { name: "reviewer_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Manager conducting review" },
        { name: "status", type: "NVARCHAR(50)", mandatory: true, description: "not_started, self_assessment, manager_review, calibration, complete", defaultValue: "not_started" },
        { name: "self_assessment_date", type: "DATETIME2", mandatory: false, description: "When self-assessment completed" },
        { name: "manager_review_date", type: "DATETIME2", mandatory: false, description: "When manager review completed" },
        { name: "overall_self_rating", type: "DECIMAL(3,2)", mandatory: false, description: "Employee's overall self-rating" },
        { name: "overall_manager_rating", type: "DECIMAL(3,2)", mandatory: false, description: "Manager's overall rating" },
        { name: "final_rating", type: "DECIMAL(3,2)", mandatory: false, description: "Calibrated final rating" },
        { name: "self_narrative", type: "NVARCHAR(MAX)", mandatory: false, description: "Employee's written self-assessment" },
        { name: "manager_narrative", type: "NVARCHAR(MAX)", mandatory: false, description: "Manager's written feedback" },
        { name: "acknowledged_at", type: "DATETIME2", mandatory: false, description: "When employee acknowledged review" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation" },
        { name: "updated_at", type: "DATETIME2", mandatory: true, description: "Last update" }
      ]
    },
    {
      name: "Courses",
      schema: "lms",
      description: "Learning courses available in LMS",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier" },
        { name: "title", type: "NVARCHAR(255)", mandatory: true, description: "Course title" },
        { name: "description", type: "NVARCHAR(MAX)", mandatory: false, description: "Course description" },
        { name: "category_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "Course category" },
        { name: "difficulty", type: "NVARCHAR(50)", mandatory: true, description: "beginner, intermediate, advanced" },
        { name: "duration_minutes", type: "INT", mandatory: true, description: "Estimated duration" },
        { name: "status", type: "NVARCHAR(50)", mandatory: true, description: "draft, published, archived", defaultValue: "draft" },
        { name: "certificate_on_completion", type: "BIT", mandatory: true, description: "Issue certificate", defaultValue: "0" },
        { name: "passing_score", type: "INT", mandatory: true, description: "Minimum passing percentage", defaultValue: "70" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation" },
        { name: "updated_at", type: "DATETIME2", mandatory: true, description: "Last update" }
      ]
    },
    {
      name: "TalentAssessments",
      schema: "talent",
      description: "9-Box talent assessment records",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier" },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Employee assessed" },
        { name: "assessed_by", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Manager conducting assessment" },
        { name: "assessment_year", type: "INT", mandatory: true, description: "Year of assessment" },
        { name: "performance_level", type: "NVARCHAR(20)", mandatory: true, description: "low, medium, high" },
        { name: "potential_level", type: "NVARCHAR(20)", mandatory: true, description: "low, medium, high" },
        { name: "nine_box_position", type: "NVARCHAR(50)", mandatory: true, description: "Derived box label" },
        { name: "flight_risk", type: "NVARCHAR(20)", mandatory: false, description: "low, medium, high" },
        { name: "succession_readiness", type: "NVARCHAR(50)", mandatory: false, description: "ready_now, 1-2_years, 3+_years" },
        { name: "notes", type: "NVARCHAR(MAX)", mandatory: false, description: "Assessment notes" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation" }
      ]
    },
    {
      name: "PraisePosts",
      schema: "feedback",
      description: "Recognition praise posts",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier" },
        { name: "from_staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Person giving praise" },
        { name: "to_staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Person receiving praise" },
        { name: "category", type: "NVARCHAR(100)", mandatory: true, description: "Culture value category" },
        { name: "badge_id", type: "NVARCHAR(50)", mandatory: false, description: "Badge attached" },
        { name: "message", type: "NVARCHAR(MAX)", mandatory: true, description: "Praise message" },
        { name: "points_awarded", type: "INT", mandatory: true, description: "Points given", defaultValue: "0" },
        { name: "visibility", type: "NVARCHAR(20)", mandatory: true, description: "public, private", defaultValue: "public" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation" }
      ]
    },
    {
      name: "PerformanceImprovementPlans",
      schema: "pip",
      description: "Performance Improvement Plan records",
      fields: [
        { name: "id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Primary key" },
        { name: "tenant_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Multi-tenancy identifier" },
        { name: "staff_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Employee on PIP" },
        { name: "manager_id", type: "UNIQUEIDENTIFIER", mandatory: true, description: "Manager overseeing PIP" },
        { name: "hr_partner_id", type: "UNIQUEIDENTIFIER", mandatory: false, description: "HR Business Partner" },
        { name: "reason", type: "NVARCHAR(MAX)", mandatory: true, description: "Reason for PIP" },
        { name: "status", type: "NVARCHAR(50)", mandatory: true, description: "draft, active, extended, successful, unsuccessful", defaultValue: "draft" },
        { name: "start_date", type: "DATE", mandatory: true, description: "PIP start date" },
        { name: "original_end_date", type: "DATE", mandatory: true, description: "Original planned end date" },
        { name: "current_end_date", type: "DATE", mandatory: true, description: "Current end date (may be extended)" },
        { name: "outcome", type: "NVARCHAR(50)", mandatory: false, description: "Final outcome if concluded" },
        { name: "outcome_notes", type: "NVARCHAR(MAX)", mandatory: false, description: "Outcome details" },
        { name: "concluded_at", type: "DATETIME2", mandatory: false, description: "When PIP concluded" },
        { name: "created_at", type: "DATETIME2", mandatory: true, description: "Record creation" },
        { name: "updated_at", type: "DATETIME2", mandatory: true, description: "Last update" }
      ]
    }
  ],

  integrations: [
    { system: "Roster Module", type: "Internal", description: "Leave patterns and attendance visible for performance context" },
    { system: "Awards Module", type: "Internal", description: "Performance ratings inform merit increase recommendations" },
    { system: "Staff Profiles", type: "Internal", description: "Certifications and qualifications linked to development" },
    { system: "SSO Provider", type: "External", description: "Single sign-on for secure access" },
    { system: "Calendar System", type: "External", description: "1:1 and review meeting scheduling integration" },
    { system: "Document Storage", type: "External", description: "LMS content and certificate storage" },
    { system: "Email/Notification", type: "External", description: "Review reminders, praise notifications, survey invitations" }
  ],

  businessRules: [
    { id: "BR-PRF-001", rule: "Performance reviews must include both self and manager assessment before calibration", rationale: "Ensures balanced perspective and employee voice" },
    { id: "BR-PRF-002", rule: "Anonymous feedback requires minimum 3 responses before display", rationale: "Protects anonymity of feedback providers" },
    { id: "BR-PRF-003", rule: "OKR progress cannot exceed 100% without manager approval", rationale: "Prevents gaming of stretch goals" },
    { id: "BR-PRF-004", rule: "PIP must have minimum 3 milestones and weekly check-ins", rationale: "Ensures structured improvement opportunity" },
    { id: "BR-PRF-005", rule: "Employee must acknowledge review within 14 days or it auto-closes", rationale: "Ensures timely completion of review process" },
    { id: "BR-PRF-006", rule: "Recognition points expire after 12 months if not redeemed", rationale: "Encourages engagement with reward program" },
    { id: "BR-PRF-007", rule: "Course assessment must be passed to mark course complete", rationale: "Ensures actual learning occurred" },
    { id: "BR-PRF-008", rule: "Calibration adjustments require documented justification", rationale: "Audit trail for rating changes" },
    { id: "BR-PRF-009", rule: "Key roles must have at least 2 succession candidates identified", rationale: "Reduces risk of leadership gaps" },
    { id: "BR-PRF-010", rule: "Merit recommendations require completed performance review", rationale: "Links compensation to documented performance" }
  ]
};
