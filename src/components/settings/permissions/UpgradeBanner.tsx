import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Gem, Lock } from 'lucide-react';
import { PERMISSION_MODULES, getSubPermissions } from '@/types/permissions';
import { PLANS, PLAN_ORDER, PlanTier, planRank } from '@/types/plans';
import { planModuleActions, planSubActions, usePlanEntitlements } from '@/lib/planEntitlementsStore';
import { usePlan } from '@/lib/planStore';
import { openUpgradeFlow } from '@/lib/upgradeFlow';
import { upgradePrompt } from '@/lib/upgradePrompt';

/**
 * Promotes the next tier from the top of the Users & Permissions page:
 * counts everything the current plan is missing and offers the upgrade.
 */
export function UpgradeBanner() {
  const { tier } = usePlan();
  const entitlements = usePlanEntitlements();

  const next: PlanTier | null = PLAN_ORDER[planRank(tier) + 1] ?? null;

  const stats = useMemo(() => {
    if (!next) return { locked: 0, modules: [] as string[] };
    let locked = 0;
    const modules: string[] = [];
    for (const m of PERMISSION_MODULES) {
      let delta = Math.max(
        0,
        planModuleActions(next, m.id).length - planModuleActions(tier, m.id).length,
      );
      for (const sub of getSubPermissions(m.id)) {
        delta += Math.max(
          0,
          planSubActions(next, m.id, sub.id).length - planSubActions(tier, m.id, sub.id).length,
        );
      }
      if (delta > 0) {
        locked += delta;
        modules.push(m.label);
      }
    }
    return { locked, modules };
  }, [tier, next, entitlements]);

  if (!next || stats.locked === 0) return null;

  const plan = PLANS[next];

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Gem className="h-4 w-4 text-primary" />
          <p className="text-sm font-medium tracking-tight">
            {stats.locked} permissions across {stats.modules.length} modules are locked on{' '}
            {PLANS[tier].label}
          </p>
        </div>
        <p className="text-xs text-muted-foreground max-w-2xl">
          {plan.label} unlocks them — {plan.tagline}
        </p>
        <div className="flex flex-wrap gap-1 pt-0.5">
          {stats.modules.slice(0, 6).map(m => (
            <Badge key={m} variant="outline" className="text-[10px] font-normal gap-1">
              <Lock className="h-2.5 w-2.5" />
              {m}
            </Badge>
          ))}
          {stats.modules.length > 6 && (
            <Badge variant="outline" className="text-[10px] font-normal">
              +{stats.modules.length - 6} more
            </Badge>
          )}
        </div>
      </div>
      <Button
        size="sm"
        className="gap-1.5 shrink-0"
        onClick={() =>
          openUpgradeFlow({
            needs: next,
            feature: `${stats.locked} locked permissions`,
            source: 'permissions-banner',
          })
        }
      >
        See what {plan.label} unlocks <ArrowRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
