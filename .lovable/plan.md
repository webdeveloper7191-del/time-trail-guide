# Close Performance Persistence Gaps

## Scope
- Persist calibration sessions and rating adjustments, and use the existing scheduling drawer rather than generating a fixed session.
- Persist employee OKR progress in the shared performance operations store so admin and employee views stay in sync.
- Wire wellbeing check-in submission into the employee experience and surface submitted history in the wellbeing dashboard.
- Persist goal CRUD beyond component state so reloads retain created, edited, progressed, and deleted goals.
- Enable assigned-plan editing, including general fields and plan-specific goals, reviews, conversations, and cancellation reason.

## Implementation
1. Extend the performance operations store with calibration session/rating CRUD and shared persisted goal records where needed.
2. Refactor Calibration and Employee OKR screens to read/write the shared store and keep selected detail state synchronized after updates.
3. Connect the wellbeing check-in modal to the employee portal and save entries through the operations store; show recent check-ins in admin wellbeing details.
4. Replace the remaining mock-only goal API behavior with a local persistent store used by existing hooks.
5. Add editable plan configuration fields to assigned plans, implement `updatePlan`, wire the existing Edit Plan drawer into plan details, and persist cancellation reasons.
6. Verify relevant tabs and workflows in the browser, including persistence after reload.

## Technical Notes
- Persistence will follow the project’s current local store pattern (`useSyncExternalStore` + localStorage); no backend scope is added.
- Existing UI components, right-side sheets, permissions, and terminology remain unchanged.
