# Architecture rules

- Roster policy design screens save browser-only drafts with field-level location overrides; they do not apply scheduling rules, and existing operational configuration stays authoritative to avoid competing live settings.

- Performance task records and skills/career collections use shared browserState hooks in performanceLocalData; per-person gaps and manager insights are keyed by staff ID so switching people cannot reuse another person's edits.
- Calibration distribution derives from saved ratings in non-cancelled sessions, preferring calibrated values and rounding to the nearest rating bucket; wellbeing analysis upserts indicators for all staff with check-ins and uses their latest dated entry.
- Performance settings persist before reporting success, refresh drafts on drawer opening, and write existing goal, survey and reward policies through their authoritative stores.

- Role-preview dashboards derive read-only summaries from shared module stores with explicit timesheet date/location filters; attendance is never labelled roster coverage and preview profiles never imply authenticated access.
- Staff dashboard and employee portal share one preview profile and portal tab query links, so self-service navigation uses a consistent identity and destination.

- Employee schedule clock records are distinct from rostered shifts and filtered through `employeeSchedule`; actual attendance must not inflate scheduled hours or offer roster-only actions.
- Employee portal sample attendance is labelled and used only when no employee timesheets exist; it must not be presented as saved staff data.
- Scheduling rule categories share the existing constraint editor and category-specific context; presentation must distinguish contract templates from independent roster-wide checks because their configurations are not synchronised.
- AI features call Lovable AI Gateway only from Supabase Edge Functions (e.g. `candidate-fit`) with shared helpers in `supabase/functions/_shared/`; the key and prompts never reach the browser.
- Training records (courses, enrolments, certificates, learning paths) live in the shared `lmsStore` so admin and staff learning screens stay in sync; certificates are issued centrally when an enrolment completes.
- Timesheets live in the shared `timesheetStore` (admin edits, payroll reads approved only); award minimums are effective-dated via `awardRateSchedule` and back pay is detected from approved/posted runs in `backPayEngine` with a ledger, so rates and underpayments stay consistent across screens and are never paid twice.
- Recognition feeds use `recognitionStore`, engagement collections use `browserState`, and analysis is local in `engagementLogic`; browser-only persistence and calendar downloads must not imply online delivery or cross-device collaboration.
- Forms templates persist in `formTemplatesStore`; recognition surveys link by stable template ID through `surveyForms`, retaining recognition lifecycle, anonymity and duplicate-response checks so editing and completion share one survey definition.
- Value-based nominations use `recognitionWorkflowStore`, separate from review-feedback nominations; approval publishes a stable-ID post and an idempotent points ledger entry so repeated decisions cannot duplicate awards. Local approver selections are workflow configuration, not account permissions.
- Staff rewards use the shared `rewardsStore` wallet and ledger; milestone rewards run on workspace opening rather than implying a background scheduler or real-money fulfilment.

- Performance experience drafts are keyed by user/review/stage; analytics use dated records and privacy thresholds, and scorecards withhold fixed-weight totals when evidence is incomplete so missing sources never change the formula.
- Browser learning downloads store course snapshots in browserState and media in Cache Storage, with actual saved-progress checks and one shared course assessment player across screen sizes; no action implies server synchronisation.
- Development journeys persist explicit review, skill, plan, enrolment and follow-up review links; calibration from talent saves an assessed-staff snapshot and ratings, so navigation retains evidence context.
- Reviews snapshot cycle IDs, competencies and scale points at creation, merge stage-specific evidence and reject failed writes before draft removal; weighted scores use that immutable evidence for consistent comparisons.
- Scorecard 360 evidence must meet each request's threshold, including its anonymous subset, before aggregation; pooling cannot bypass privacy limits.
- Course authoring uses one lossless conversion to the shared LMS store; browser persistence precedes success and certificate issuance honours course/global policies and local completion approvals.
- Development setup persists a pending journey with stable linked IDs before child writes and resumes idempotently, preventing duplicate goals, reviews or plans after partial failures.
