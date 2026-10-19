# Architecture rules

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
