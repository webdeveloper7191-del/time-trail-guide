# Complete Performance Management data wiring

## Goal
Replace hardcoded performance values and session-only mock state with shared, durable stores so tenant configuration updates flow immediately into manager and staff workflows.

## Implementation

1. **Reactive performance configuration**
   - Add a reusable configuration hook around the existing performance configuration store.
   - Resolve each review cycle’s active rating scale and competency set, with safe fallbacks when a cycle is missing or inactive.
   - Update review creation and execution to use configured review cycles, competency weights, behavioural anchors, and scale labels/values instead of `defaultReviewCriteria` and fixed 1–5 labels.
   - Feed the same competencies and scale into 360 feedback, calibration summaries, skills insights, and goal rating surfaces where ratings are captured or displayed.

2. **Persistent operational performance store**
   - Create one versioned, local persistent store using the project’s `useSyncExternalStore` pattern.
   - Seed existing mock data once, then persist and share mutations for:
     - 360 requests and responses
     - happiness entries
     - wellbeing indicators and check-ins
     - pulse surveys and responses
     - PIPs, milestones, check-ins, outcomes, and status changes
     - OKRs and key-result progress
     - 9-Box talent assessments
   - Expose typed create/update/delete/status methods and ensure all tabs read the same reactive snapshot.

3. **Admin-to-staff workflows**
   - Make newly configured competencies/scales available in subsequent reviews and 360 requests immediately without a refresh.
   - Ensure created surveys, PIPs, OKRs, assessments, and staff submissions appear across relevant manager/staff views and remain after reload.
   - Preserve historical records by storing the selected scale/competency snapshot on newly created workflow records where their existing types support it; current configuration drives new records, not completed history.

4. **Staff selection for Skills & Career**
   - Replace the hardcoded `staff-1` route prop with the current selected staff member.
   - Keep the panel’s searchable selector authoritative and synchronize it when the parent-selected staff changes.
   - Scope skills, gaps, career progress, and manager insights to that selected staff member.

5. **Plans store and action states**
   - Replace component-local plan state with a shared versioned plan store so all consumers stay synchronized.
   - Wire create, single assignment, bulk assignment, extension, deletion, status updates, and template mutations to typed store APIs.
   - Validate missing records and failed writes; keep drawers open on failure and show clear success/error feedback only after confirmed mutations.
   - Remove remaining logging/toast-only placeholders and prevent partial success from being reported as a complete bulk assignment.

6. **Verification**
   - Run targeted type/tests through the project harness.
   - Browser-test configuration changes followed by review creation/execution, 360 creation, calibration display, goal flow, Skills staff switching, each persistent module mutation, and all plan actions.
   - Reload between checks to confirm persistence and inspect console/runtime errors.

## Technical notes
- Persistence will follow the project’s current client-side architecture: versioned `localStorage` stores with `useSyncExternalStore`, guarded reads/writes, typed snapshots, and immutable mutations.
- Existing mock records remain initial seed data only; they stop being the live source after store initialization.
- Scope is limited to the requested Performance Management workflows and their existing Employee Portal consumers.
