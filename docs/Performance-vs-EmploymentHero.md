# Performance Module — Gap Audit & Employment Hero Comparison

Date: 2026-10-19. Source: Employment Hero Help Centre, Performance category
(https://help.employmenthero.com/hc/en-au/categories/17133076123535-Performance).

## Part 1 — What is still pending in our performance module

Everything below is browser-local (per Piyush's "no backend" constraint), so
"pending" means incomplete frontend behaviour, not missing server work.

### Real gaps (not working or stubbed)

1. **Succession — Archive role is toast-only.** Reports success but changes
   nothing (`SuccessionPlanningPanel.tsx:123`). Needs an archived status on the
   role record and a filter to show/hide archived roles.
2. **Pulse surveys — Export Results button has no handler**
   (`PulseSurveyPanel.tsx:560-562`). Needs CSV export built from `pulseResults`.
3. **Calibration — "Actual observed spread" is hardcoded.** The distribution
   chart uses fixed counts/percentages instead of saved calibration ratings
   (`CalibrationPanel.tsx:67-89`). Needs derivation from
   `performanceOperationsStore` ratings.
4. **OKRs — Create OKR drawer uses static mock parent objectives.**
   Objectives created in the shared store do not appear as parent options
   (`CreateOKRDrawer.tsx:38,101-106`). Needs to read the operations store.
5. **Performance tasks are component state.** Tasks, pipelines and custom task
   types reset on remount (`PerformanceTaskManagementPanel.tsx:155-158`).
   Needs a persisted store like the other modules.
6. **Skills & Career panel is fixture-only.** Skills, staff skills and career
   paths are component state seeded from mocks (`SkillsCareerPanel.tsx:118,
   136-144,193-208`); employee career pathing is hardcoded to `staff-1`
   (`EmployeeCareerPathingPanel.tsx:54-71`). Needs a persisted store and the
   shared preview identity.
7. **Wellbeing check-ins don't create an indicator for a staff member who has
   none** (`performanceOperationsStore.ts:145` maps over existing indicators
   only).
8. **Settings drawer simulates saving** — waits 500 ms and reports success
   without persisting (`PerformanceSettingsDrawer.tsx:60-67`).
9. **Mobile course player "Sync" is toast-only** (`MobileCoursePlayer.tsx:610`).
10. **Analytics are fixed samples.** Performance trends, happiness (7.9/8.1),
    eNPS (42/38) and industry benchmarks are hardcoded
    (`PerformanceAnalyticsDashboard.tsx:165-175`,
    `PerformanceExecutiveDashboard.tsx:50-56,89-95`,
    `BenchmarkingDashboard.tsx:75`). Trends should derive from stored reviews,
    goals and pulse results where the data exists.

### Known and accepted (by design, browser-only)

- All records persist in localStorage only — no cross-device or multi-user
  sharing, no real email/notification delivery, no real calendar sync
  (invites are .ics downloads), no real finance integration for budgets.
- Sample identities are used for role previews (`staff-2` manager, `staff-1`
  employee) and are labelled as previews.
- Goals/reviews/feedback/PIPs/mentorship/budgets/wellbeing/surveys/
  calibration all persist locally and survive refresh.

## Part 2 — Employment Hero performance feature set

EH's performance category covers:

| EH feature | What it does |
|---|---|
| **9-Box Talent Grid** | Plots staff on performance × potential grid; visibility settings for ratings. |
| **Employee scorecard** | Per-employee performance score summary. |
| **Performance reviews** | Cycles, configurable rating scales and questions, manager and employee completion, visibility/manager access settings, question visibility and notification settings. |
| **360 reviews** | Separate from performance reviews; self + peer reviews; admin setup. |
| **Goals (OKRs)** | Create/modify goals, update progress. |
| **Org performance levels** | Track and evaluate org and employee performance levels. |
| **Hero AI** | Ask AI questions about performance reviews. |

Notably EH's help centre shows **no** mentorship matching, development budget
tracking, wellbeing check-ins, pulse surveys inside performance (theirs is a
separate product), succession candidate pools, calibration sessions, PIP
workflows, or task management — several of which we already have.

## Part 3 — Comparison and how we beat them

| Area | Employment Hero | rostered.ai today | Verdict |
|---|---|---|---|
| Performance reviews | Yes, configurable scales/questions, notifications | Yes — cycles, self + manager flow, custom criteria, persisted | Parity; we lack review notification *settings* UI (no real sending, browser-only) |
| 360 reviews | Yes, separate flow | Yes — peer nominations with approval workflow, persisted | Parity (ours adds approver gating) |
| Goals / OKRs | Basic goal CRUD + progress | Goals with milestones + OKRs with alignment, persisted | **We lead** (alignment tree, linked reviews); fix mock parent selector |
| 9-Box grid | Yes | Talent assessments exist in operations store, but no 9-box grid view | **Gap — build a 9-box grid** (performance × potential from saved assessments) |
| Employee scorecard | Yes | No single scorecard view | **Gap — build an employee scorecard** combining review rating, goal progress, recognition count |
| Rating visibility settings | Yes | No visibility configuration | Gap — small settings addition |
| Hero AI (AI questions on reviews) | Yes | We have AI candidate-fit via edge function; nothing in performance | Opportunity — AI review summary via existing AI Gateway pattern |
| Mentorship matching | Not offered | Built, persisted | **We lead** |
| Development budgets | Not offered | Built, persisted | **We lead** |
| Wellbeing + pulse surveys | Separate EH products | Built into performance | **We lead** |
| Succession planning | Not in help centre | Built (roles/candidates/CSV) | **We lead**; fix archive action |
| Calibration | Not in help centre | Built; fix hardcoded spread | **We lead** once fixed |
| PIPs | Not in help centre | Built with check-ins, outcomes, attachments | **We lead** |
| Task management | Not offered | Built; needs persistence fix | **We lead** once fixed |
| Learning/LMS tie-in | Separate product | Built into performance with certificates | **We lead** |

### Priority order to "do better than EH"

1. Fix the real gaps in Part 1 (items 1–7) — they are visible broken buttons
   and hardcoded numbers.
2. Build the **9-Box Talent Grid** from existing talent assessment data —
   EH's flagship feature we don't match yet.
3. Build the **employee scorecard** — one page per staff member combining
   review ratings, goal/OKR progress, recognition and learning.
4. Derive analytics trends from stored data instead of fixed samples.
5. Optionally: AI review summaries via the existing AI Gateway edge-function
   pattern (EH charges for Hero AI; ours would be included).
