import { PlanTier } from '@/types/plans';
import { BillingCycle, billingStore, checkout } from '@/lib/billingStore';
import { upgradePrompt } from '@/lib/upgradePrompt';

/**
 * Single entry point for every upgrade / checkout touch point in the app.
 *
 * Any module calls `openUpgradeFlow({ needs, feature, source })` and gets the
 * same side panel, prefilled with the same context (source module, target
 * plan, seats and billing cycle) so the experience never differs by surface.
 */
export interface UpgradeFlowContext {
  /** Tier that unlocks the blocked capability. */
  needs: PlanTier;
  /** Human label of the blocked capability. */
  feature: string;
  /** Module / surface the request came from. */
  source: string;
  moduleId?: string;
  /** Seats to prefill; defaults to the current subscription seat count. */
  seats?: number;
  /** Billing cycle to prefill; defaults to the current subscription cycle. */
  cycle?: BillingCycle;
  /** Skip the offer panel and go straight to checkout. */
  skipOffer?: boolean;
}

/** Resolves the context against live subscription state so panels agree. */
export function resolveUpgradeContext(ctx: UpgradeFlowContext) {
  const billing = billingStore.get();
  return {
    ...ctx,
    seats: ctx.seats ?? billing.seats,
    cycle: ctx.cycle ?? billing.cycle,
  };
}

/** Opens the upgrade offer (or checkout directly when `skipOffer`). */
export function openUpgradeFlow(ctx: UpgradeFlowContext) {
  const resolved = resolveUpgradeContext(ctx);
  if (resolved.skipOffer) return openCheckoutFlow(resolved);
  upgradePrompt.open({
    needs: resolved.needs,
    feature: resolved.feature,
    source: resolved.source,
    moduleId: resolved.moduleId,
    seats: resolved.seats,
    cycle: resolved.cycle,
  });
}

/** Opens checkout prefilled with the same context the offer carried. */
export function openCheckoutFlow(ctx: UpgradeFlowContext) {
  const resolved = resolveUpgradeContext(ctx);
  checkout.open({
    tier: resolved.needs,
    cycle: resolved.cycle,
    seats: resolved.seats,
    source: resolved.source,
    feature: resolved.feature,
    moduleId: resolved.moduleId,
  });
}
