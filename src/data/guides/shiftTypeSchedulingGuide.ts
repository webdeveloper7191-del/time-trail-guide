/**
 * Step-by-Step Guide: Scheduling On-Call, Callback & Emergency Shifts
 * ===================================================================
 * 
 * This guide explains how to schedule specialized shift types in the roster
 * and how they flow through to timesheet pay calculations.
 * 
 * ─────────────────────────────────────────────────────────────────────────
 * 
 * GUIDE 1: SCHEDULING AN ON-CALL (STANDBY) SHIFT
 * ================================================
 * 
 * Use Case: You need Sarah (Lead Educator) to be available on standby 
 * from 6 PM to 6 AM in case a night-shift staff member calls in sick.
 * 
 * STEP 1 — Open the Roster
 *   • Navigate to the Roster page
 *   • Select the correct centre and the target week
 *   • Choose Week or Day view for best visibility
 * 
 * STEP 2 — Use the On-Call Template
 *   Option A: Template Dropdown
 *     • In the roster grid, click the "+" button on Sarah's row for the target date
 *     • From the dropdown, select the "On-Call" shift template
 *     • The shift is created with the on-call icon (📞) and correct times
 * 
 *   Option B: Drag to On-Call Lane
 *     • In Day view, locate the "On-Call Lane" at the bottom of the grid
 *     • Drag Sarah's name from the staff sidebar into the On-Call Lane
 *     • The system auto-creates an on-call shift with default times (18:00–06:00)
 * 
 *   Option C: Create + Change Type
 *     • Create a regular shift for Sarah
 *     • Right-click the shift → "Change Shift Type" → select "On-Call"
 *     • Or hover over the shift card and click the phone (📞) quick-toggle icon
 * 
 * STEP 3 — Configure On-Call Details
 *   • Click the shift to open the Shift Detail Panel
 *   • Verify the on-call period start/end times
 *   • Set escalation order if multiple staff are on standby
 *   • Add notes (e.g., "Primary contact for Nursery room")
 * 
 * STEP 4 — Publish
 *   • Click "Publish Roster" to notify Sarah of her on-call assignment
 *   • Sarah receives a notification with her standby schedule
 * 
 * PAY CALCULATION:
 *   • Standby Allowance: Flat rate per period (e.g., $50/night) OR hourly rate
 *   • Does NOT count toward 38-hour weekly overtime threshold
 *   • Weekend standby may attract a higher rate (configurable in Awards Settings)
 *   • Public holiday standby attracts a multiplier (e.g., 1.5×)
 *   • Timesheet entry: Shows as "On-Call Allowance" line item
 * 
 * EXAMPLE TIMESHEET OUTPUT:
 *   ┌─────────────────────────────────────────────────────────┐
 *   │ Sarah Chen — Week of 17 Mar 2026                       │
 *   ├─────────────┬──────────┬───────────┬───────────────────┤
 *   │ Date        │ Type     │ Hours     │ Pay               │
 *   ├─────────────┼──────────┼───────────┼───────────────────┤
 *   │ Mon 17 Mar  │ Regular  │ 8.0h      │ $320.00           │
 *   │ Mon 17 Mar  │ On-Call  │ 12h block │ $50.00 (flat)     │
 *   │ Tue 18 Mar  │ Regular  │ 8.0h      │ $320.00           │
 *   └─────────────┴──────────┴───────────┴───────────────────┘
 * 
 * 
 * ─────────────────────────────────────────────────────────────────────────
 * 
 * GUIDE 2: LOGGING A CALLBACK (FROM ON-CALL)
 * ===========================================
 * 
 * Use Case: At 10:30 PM, the night-shift educator calls in sick. Sarah 
 * (who is on standby) is called back to cover. She works from 11 PM to 3 AM.
 * 
 * STEP 1 — Open the On-Call Roster Overlay
 *   • From the Roster page, click the "On-Call" tab/overlay button
 *   • Locate Sarah's active on-call assignment for tonight
 *   • Her status should show as "Active" (green pulsing indicator)
 * 
 * STEP 2 — Log the Callback Event
 *   • Click Sarah's on-call card → "Log Callback"
 *   • Enter the callback details:
 *     - Time called: 22:30
 *     - Time arrived/started: 23:00 (30 min travel)
 *     - Reason: "Night educator called in sick"
 *     - Room assigned: Nursery
 *   • Save the callback event
 * 
 * STEP 3 — Record Callback End
 *   • When Sarah finishes, update the callback:
 *     - End time: 03:00
 *     - Actual hours worked: 4 hours
 *   • The system calculates: max(actual_hours, minimum_engagement)
 *     - If minimum engagement is 3 hours, Sarah gets paid for 4 hours (actual)
 *     - If she only worked 1 hour, she'd still get paid for 3 hours (minimum)
 * 
 * STEP 4 — Approve for Payroll
 *   • The callback auto-generates a timesheet entry
 *   • Review in Timesheets → the callback appears as a separate line
 *   • Approve to push to payroll
 * 
 * PAY CALCULATION:
 *   • Callback Rate: base_rate × callback_multiplier (e.g., 1.5×)
 *   • Minimum Engagement: 3 hours guaranteed (configurable per award)
 *   • Formula: max(actual_hours, 3) × base_rate × 1.5
 *   • Sarah's example: max(4h, 3h) × $40 × 1.5 = 4 × $60 = $240
 *   • PLUS: Original standby allowance is still paid ($50)
 *   • Travel allowance may also apply (configurable)
 * 
 * EXAMPLE TIMESHEET OUTPUT:
 *   ┌───────────────────────────────────────────────────────────────┐
 *   │ Sarah Chen — Mon 17 Mar 2026                                 │
 *   ├──────────────────┬──────────┬───────────┬────────────────────┤
 *   │ Item             │ Type     │ Hours     │ Pay                │
 *   ├──────────────────┼──────────┼───────────┼────────────────────┤
 *   │ Regular Shift    │ Regular  │ 8.0h      │ $320.00            │
 *   │ On-Call Standby  │ On-Call  │ 12h block │ $50.00 (flat)      │
 *   │ Callback Work    │ Callback │ 4.0h      │ $240.00 (1.5×)    │
 *   │ Travel Allowance │ Allowance│ —         │ $25.00             │
 *   ├──────────────────┼──────────┼───────────┼────────────────────┤
 *   │ TOTAL            │          │           │ $635.00            │
 *   └──────────────────┴──────────┴───────────┴────────────────────┘
 * 
 * IMPORTANT RULES:
 *   • Callback pay STACKS with standby allowance (staff gets both)
 *   • After callback, 10-hour rest period is mandatory before next shift
 *   • If next shift starts within 10 hours, it triggers overtime rates
 *   • Multiple callbacks in one on-call period: each is separate engagement
 * 
 * 
 * ─────────────────────────────────────────────────────────────────────────
 * 
 * GUIDE 3: SCHEDULING AN EMERGENCY CALLBACK
 * ==========================================
 * 
 * Use Case: At 2 AM on a public holiday, the fire alarm triggers at the 
 * centre. All available staff within 15km must be contacted immediately.
 * 
 * STEP 1 — Trigger Emergency Protocol
 *   • From the On-Call Overlay, click "Emergency Call-Out" (red button)
 *   • Or from the Roster toolbar, click the emergency (🚨) icon
 *   • This bypasses the normal escalation chain
 * 
 * STEP 2 — Configure Emergency Details
 *   • Select the affected centre
 *   • Enter the reason: "Fire alarm activation — facility check required"
 *   • Set urgency: "Critical"
 *   • The system automatically:
 *     - Identifies all available staff within travel distance
 *     - Sends mass notifications (SMS + push) simultaneously
 *     - Does NOT wait for sequential escalation responses
 * 
 * STEP 3 — Track Responses
 *   • The Emergency Response Panel shows real-time status:
 *     - ✅ Sarah — Accepted (ETA 20 min)
 *     - ✅ James — Accepted (ETA 35 min)
 *     - ❌ Maria — Declined (childcare)
 *     - ⏳ Tom — No response
 *   • Once sufficient staff accept, mark remaining as "Not Required"
 *   • Staff who accepted but are no longer needed get "good-faith" minimum pay
 * 
 * STEP 4 — Log Emergency Shift
 *   • For each responding staff member, an emergency shift is auto-created:
 *     - Shift type: Emergency
 *     - Start time: When they arrived
 *     - End time: When released
 *   • The shift card shows a red emergency icon (🚨)
 * 
 * STEP 5 — Post-Emergency Rest Period
 *   • System flags any shifts within 10 hours of emergency end
 *   • Manager must reassign or cancel those shifts
 *   • Affected staff see a notification about enforced rest
 * 
 * PAY CALCULATION:
 *   • Emergency Rate: base_rate × emergency_multiplier (e.g., 2.5×)
 *   • Minimum Engagement: 4 hours (higher than callback)
 *   • Public Holiday: Additional multiplier stacks (e.g., 2.5 × 2.5 = highest applicable)
 *   • NOTE: Only the HIGHEST single multiplier applies (no double-stacking)
 *   • Actual formula: max(actual_hours, 4) × base_rate × highest_applicable_multiplier
 *   • Travel allowance applies automatically
 *   • "Good-faith" responders: Paid minimum engagement even if turned away on arrival
 * 
 * EXAMPLE — Sarah responds to emergency on Public Holiday:
 *   • Arrived 2:25 AM, released 5:00 AM (2h 35min actual)
 *   • Minimum engagement: 4 hours
 *   • Base rate: $40/hr
 *   • Public holiday emergency multiplier: 2.5× (highest applicable)
 *   • Pay: max(2.58h, 4h) × $40 × 2.5 = 4 × $100 = $400
 *   • Plus travel: $35
 *   • Total: $435
 * 
 * EXAMPLE TIMESHEET OUTPUT:
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │ Sarah Chen — Tue 18 Mar 2026 (Public Holiday)                  │
 *   ├────────────────────┬───────────┬────────┬─────────────────────┤
 *   │ Item               │ Type      │ Hours  │ Pay                 │
 *   ├────────────────────┼───────────┼────────┼─────────────────────┤
 *   │ Emergency Call-Out  │ Emergency │ 4.0h*  │ $400.00 (2.5×)     │
 *   │ Travel Allowance    │ Allowance │ —      │ $35.00              │
 *   ├────────────────────┼───────────┼────────┼─────────────────────┤
 *   │ TOTAL              │           │        │ $435.00              │
 *   └────────────────────┴───────────┴────────┴─────────────────────┘
 *   * Minimum engagement applied (actual: 2h 35min → paid: 4h)
 * 
 * 
 * ─────────────────────────────────────────────────────────────────────────
 * 
 * GUIDE 4: SCHEDULING A RECALL SHIFT
 * ====================================
 * 
 * Use Case: At 3 PM, two educators call in sick for the afternoon. Tom 
 * (who finished his morning shift at 1 PM) is recalled for urgent coverage.
 * 
 * STEP 1 — Initiate Recall
 *   • In the Roster grid, identify the staffing gap
 *   • Click "Find Coverage" or the recall icon on the understaffed slot
 *   • The system shows available off-duty staff sorted by:
 *     - Proximity to centre
 *     - Hours already worked this week (prefer lower)
 *     - Qualifications match
 *     - Willingness to work extra (from preferences)
 * 
 * STEP 2 — Contact & Confirm
 *   • Select Tom from the available list
 *   • Send recall request (SMS/push notification)
 *   • Tom accepts → Recall shift is created automatically
 *   • Shift card shows orange recall icon
 *   • NOTE: Recall is VOLUNTARY for off-duty staff — they can decline
 * 
 * STEP 3 — Verify Rest Period
 *   • System checks: Tom finished at 1 PM, recalled at 3 PM = 2h gap
 *   • ⚠️ Warning: Less than 10-hour rest period
 *   • The recall shift is flagged but allowed (manager override required)
 *   • Tom's NEXT shift (tomorrow morning) is also checked for rest compliance
 * 
 * PAY CALCULATION:
 *   • Recall Rate: base_rate × recall_multiplier (e.g., 1.75×)
 *   • Minimum Engagement: 4 hours guaranteed
 *   • Insufficient rest penalty: Next shift may attract overtime rates
 *   • Travel allowance: Applies (Tom has to travel back to centre)
 *   • Formula: max(actual_hours, 4) × base_rate × 1.75 + travel
 *   • Tom's example: max(5h, 4h) × $38 × 1.75 = 5 × $66.50 = $332.50
 * 
 * 
 * ─────────────────────────────────────────────────────────────────────────
 * 
 * QUICK REFERENCE: SHIFT TYPE COMPARISON
 * ========================================
 * 
 * ┌──────────────┬────────────┬─────────┬──────────┬──────────────────────┐
 * │ Shift Type   │ Multiplier │ Min Hrs │ Travel   │ Trigger              │
 * ├──────────────┼────────────┼─────────┼──────────┼──────────────────────┤
 * │ Regular      │ 1.0×       │ —       │ No       │ Scheduled normally   │
 * │ On-Call      │ Flat rate  │ —       │ No       │ Rostered standby     │
 * │ Callback     │ 1.5×       │ 3h      │ Yes      │ Called from on-call  │
 * │ Recall       │ 1.75×      │ 4h      │ Yes      │ Called when off-duty │
 * │ Emergency    │ 2.5×       │ 4h      │ Yes      │ Critical incident    │
 * │ Sleepover    │ Flat rate  │ —       │ No       │ Overnight at centre  │
 * └──────────────┴────────────┴─────────┴──────────┴──────────────────────┘
 * 
 * ALLOWANCE STACKING RULES:
 *   • On-Call + Callback = Both paid (standby + callback work)
 *   • On-Call + Emergency = Both paid (standby + emergency work)
 *   • Callback + Recall = NOT stackable (one or the other)
 *   • Sleepover + Disturbance = Flat rate OR overtime (whichever is higher)
 *   • Weekend/PH multipliers = Only highest single multiplier applies
 * 
 * REST PERIOD RULES:
 *   • 10-hour minimum between active duty periods
 *   • Violated rest → next shift attracts overtime rates
 *   • System flags violations but allows manager override
 */

export const SHIFT_TYPE_SCHEDULING_GUIDE = {
  version: '1.0',
  lastUpdated: '2026-03-18',
  guides: [
    'on-call-standby',
    'callback-from-on-call',
    'emergency-callback',
    'recall-shift',
  ],
} as const;
