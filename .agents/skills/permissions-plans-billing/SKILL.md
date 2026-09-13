---
name: permissions-plans-billing
description: Build or extend the user permissions (RBAC), subscription plans/entitlements, upgrade prompts, and billing module. Use when working on roles, permission matrix, plan tiers, upgrade/checkout flows, seat pricing, invoices, or tenant entitlement overrides.
---

# Permissions, Plans & Billing Module Guide

This skill captures the architecture of the Rostered.ai access-control and monetisation stack so new work follows the same patterns. It is a **front-end guide**: all state is currently client-side stores (localStorage) designed to be swapped for a backend later.

## 1. Four cooperating layers

```text
src/types/permissions.ts      RBAC universe: modules, sub-permissions, actions
src/types/plans.ts            Plan tiers + cumulative entitlement deltas
src/lib/permissionsStore.ts   Roles -> grant sets (per tenant)
src/lib/planEntitlementsStore.ts  Tier x key -> allowed actions (editable matrix)
src/lib/planStore.ts          Active tier for the current tenant
src/lib/billingStore.ts       Subscription state, pricing, proration, invoices
src/lib/upgradePrompt.ts      Central upgrade-promotion event bus
src/lib/upgradeFlow.ts        Single entry point: openUpgradeFlow/openCheckoutFlow
```

UI lives in `src/components/settings/permissions/` (roles, matrix, plans) and `src/components/settings/billing/` (billing, checkout, invoices). Global panels are mounted once in `GlobalUpgradeSurfaces.tsx` so any module can trigger them.

## 2. RBAC model (permissions.ts)

- **Actions**: `view, manage, approve, export, configure` (`ALL_ACTIONS`, `actionLabels`).
- **Modules**: `PERMISSION_MODULES` — each has `id`, `label`, `group`, `actions`.
- **Sub-permissions**: feature-level keys addressed as `module::sub` via `subKey(moduleId, subId)`; read with `getSubPermissions(moduleId)`.
- **Grant sets**: flat `Record<key, PermissionAction[]>` per role (`RoleGrants` in `src/lib/roleGrants.ts`).

### Grant algebra — always use roleGrants.ts helpers

Never mutate grant maps by hand. Use:
- `applyToggleAction` / `applyToggleSubAction` — cascade rules: granting a non-view action auto-adds `view`; revoking `view` clears all; sub-grants lift the parent.
- `applySetModuleActions` / `applySetSubActions` — bulk set with re-derived children/parents.
- `diffGrants`, `countChanges`, `grantTotal` — preview-before-save diffs (power `GrantDiffList` and role compare).
- `sanitiseGrants` — when importing role templates from JSON.
- `allGrantKeys()` — every addressable key with labels (cached).

## 3. Plans & entitlements (plans.ts + planEntitlementsStore.ts)

- Tiers: `free | essentials | growth | enterprise` in `PLAN_ORDER`; helpers `planRank`, `isAtLeast`, `planLabel`.
- `PLANS[tier]` holds label, tagline, highlights, and `limits` (`locations`, `staff`, `customRoles`, `apiCredentials`; `null` = unlimited). Staff are unlimited on all paid plans; only Free has a hard 3-staff cap.
- **Entitlements are cumulative tier deltas**: `FREE`, `ESSENTIALS`, `GROWTH`, `ENTERPRISE` in plans.ts. A grant is `true` (all actions) or an explicit action list. Resolution: `defaultPlanModuleActions` / `defaultPlanSubActions` walk tiers in order and union.
- **Gated keys**: a sub-permission is only tier-gated if listed in a `subs` delta; ungated subs inherit the parent module grant.
- The entitlement matrix is editable at runtime (`planEntitlementsStore`, key `rai.plan.entitlements.v7` — **bump the version suffix when the shape changes**). Edits must preserve cumulativity: use the store's `applyKey`, which propagates grants upward to higher tiers automatically.
- `planLimitsStore.ts` supports per-tenant entitlement/limit overrides (`TenantPricingPanel`, `PlanLimitsPanel`) with "tenants impacted" counts.

### Gating a feature in a module

```ts
import { usePlanEntitlements } from '@/lib/planEntitlementsStore';
// check planModuleActions(tier, moduleId) / planSubActions(tier, moduleId, subId)
// when blocked -> openUpgradeFlow({ needs: 'growth', feature: 'Payroll — Pay runs', source: 'payroll' })
```

## 4. Upgrade flow (upgradePrompt.ts + upgradeFlow.ts)

- **Never open panels ad hoc.** Any module calls `openUpgradeFlow({ needs, feature, source, moduleId?, seats?, cycle?, skipOffer? })` from `src/lib/upgradeFlow.ts`. It resolves seats/cycle from `billingStore` so every surface shows identical context.
- `upgradePrompt` is a tiny event-bus store (subscribe/emit pattern, like all stores here). It also logs every `viewed`/`requested` event to localStorage (`rai.upgrade.interest.v1`) for sales demand reporting.
- `UpgradePanel.tsx` renders the offer in a `PrimaryOffCanvas` (right-aligned sheet) showing the **unlock delta** (actions/modules gained vs current tier), plan highlights, invoice history, plus "Compare plans" (dispatches `rai:open-plans` window event) and "ask sales" fallback.
- `skipOffer: true` goes straight to `CheckoutPanel`.

## 5. Billing (billingStore.ts + pricingScheduleStore.ts)

- Pricing comes from a **scheduled price book**: `priceFor(tier, at)` / `annualDiscountFor(tier, at)` read the revision in force at a date, so future-dated price changes go live automatically. `PRICE_PER_USER` is a Proxy over `priceFor` for legacy call sites.
- Cycles: monthly vs annual (`ANNUAL_MONTHS_CHARGED = 12` up-front at discounted rate). `unitRate(tier, cycle, at)` is the single source for per-seat pricing.
- `invoiceTotal(tier, cycle, seats, taxRate, at)` → `{ subtotal, tax, total, months }`. Tax via `TAX_RULES` per billing country (AU GST 10% default).
- **Proration**: cycle/plan switching mid-period computes a credit for unused time on the old configuration and charges the new one pro-rata — keep this logic in billingStore, not in components.
- `BillingState` tracks status (`trialing|active|canceled`), tier, cycle, seats, `renewsOn`, `cancelAtPeriodEnd`, payment method (brand/last4 only — never full PAN), billing email, and invoice history.
- **Seat reconciliation**: `src/lib/billing/seatReconciliation.ts` compares billed seats vs active staff so billing drifts are surfaced, not silent.
- Plan changes flow through checkout: `checkout.open({ tier, cycle, seats, source, feature })`; on success call `planStore.setTier(tier)`.

## 6. Conventions to follow

- **Store pattern**: module-level cache + `listeners` set + `emit()`; `subscribe` returns an unsubscribe; React hook forces re-render on change (see planStore/usePlan as the minimal template). Persist to localStorage with a versioned `rai.*.vN` key and merge-with-defaults on load so new shipped modules still get baselines.
- **UI**: all editing surfaces are right-aligned `PrimaryOffCanvas` sheets; badges for plan/seat status; upgrade CTAs via `UpgradeCta`/`UpgradeBanner`.
- **Terminology**: "plan", "tier", "seats", "entitlements"; money formatted with `formatMoney` (en-AU, AUD). Time displays use 12-hour format.
- **Never** hardcode tier checks scattered through components — go through `planEntitlementsStore` helpers so platform-admin matrix edits take effect everywhere.
- When adding a new module: add to `PERMISSION_MODULES` (+ subs), add tier deltas in plans.ts, set role defaults in permissionsStore, and bump the entitlement storage version.

## 7. Key files reference

| Concern | File |
| --- | --- |
| Modules/actions/subs | `src/types/permissions.ts` |
| Tier definitions + deltas | `src/types/plans.ts` |
| Grant algebra | `src/lib/roleGrants.ts` |
| Roles CRUD + defaults | `src/lib/permissionsStore.ts` |
| Editable entitlement matrix | `src/lib/planEntitlementsStore.ts` |
| Active plan | `src/lib/planStore.ts` |
| Pricing/subscription/proration | `src/lib/billingStore.ts`, `src/lib/pricingScheduleStore.ts` |
| Upgrade bus + flow | `src/lib/upgradePrompt.ts`, `src/lib/upgradeFlow.ts` |
| Permissions UI | `src/components/settings/permissions/*` (RolesPanel, PermissionMatrixPanel, UserRoleAssignmentPanel, PlansPanel, PlanEntitlementMatrixPanel, RoleCompareDialog, RoleTemplatesSheet) |
| Billing UI | `src/components/settings/billing/*` (BillingPanel, CheckoutPanel, InvoiceHistorySection, GlobalUpgradeSurfaces) |
| Hub page | `src/pages/UserPermissions.tsx` (tabs: roles / matrix / users / plans / billing) |
