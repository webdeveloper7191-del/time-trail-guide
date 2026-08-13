import { useMemo } from 'react';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Gem, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { PLANS, PLAN_ORDER, planRank } from '@/types/plans';
import { PERMISSION_MODULES, getSubPermissions } from '@/types/permissions';
import { planModuleActions, planSubActions, usePlanEntitlements } from '@/lib/planEntitlementsStore';
import { usePlan } from '@/lib/planStore';
import { upgradePrompt, useUpgradePrompt } from '@/lib/upgradePrompt';
import { openCheckoutFlow } from '@/lib/upgradeFlow';
import { InvoiceHistorySection } from '@/components/settings/billing/InvoiceHistorySection';

/** Everything the target tier adds on top of the current tier. */
function useUnlockDelta(fromRank: number, toTier: string) {
  const entitlements = usePlanEntitlements();
  return useMemo(() => {
    const from = PLAN_ORDER[Math.max(0, fromRank)];
    const to = toTier as (typeof PLAN_ORDER)[number];
    let actions = 0;
    const modules: string[] = [];
    for (const m of PERMISSION_MODULES) {
      const before = planModuleActions(from, m.id).length;
      const after = planModuleActions(to, m.id).length;
      let delta = Math.max(0, after - before);
      for (const sub of getSubPermissions(m.id)) {
        delta += Math.max(
          0,
          planSubActions(to, m.id, sub.id).length - planSubActions(from, m.id, sub.id).length,
        );
      }
      if (delta > 0) {
        actions += delta;
        modules.push(m.label);
      }
    }
    return { actions, modules };
  }, [fromRank, toTier, entitlements]);
}

/**
 * Global upgrade offer, rendered as a right-aligned side panel. Any module can
 * open it with `upgradePrompt.open({ needs, feature, source })`.
 */
export function UpgradePanel() {
  const { context } = useUpgradePrompt();
  const { tier } = usePlan();
  const target = context?.needs ?? 'enterprise';
  const plan = PLANS[target];
  const { actions, modules } = useUnlockDelta(planRank(tier), target);

  const close = () => upgradePrompt.close();

  return (
    <PrimaryOffCanvas
      open={!!context}
      onClose={close}
      title={`Unlock with ${plan.label}`}
      description={plan.tagline}
      icon={Gem}
      size="md"
      isBackground
      headerActions={
        <Badge variant="secondary" className="text-[10px]">
          You're on {PLANS[tier].label}
        </Badge>
      }
      actions={[
        {
          label: 'Compare plans',
          variant: 'outlined',
          onClick: () => {
            close();
            window.dispatchEvent(new CustomEvent('rai:open-plans'));
          },
        },
        {
          label: `Upgrade to ${plan.label}`,
          variant: 'primary',
          onClick: () => {
            if (context) upgradePrompt.requestUpgrade(context);
            close();
            openCheckoutFlow({
              needs: target,
              feature: context?.feature ?? plan.label,
              source: context?.source ?? 'upgrade-panel',
              moduleId: context?.moduleId,
              seats: context?.seats,
              cycle: context?.cycle,
            });
          },
        },
      ]}
    >
      {context?.feature && (
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground font-medium">{context.feature}</span> is included from
          the {plan.label} plan.
        </p>
      )}

      <div className="rounded-lg border bg-background p-3 space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Upgrading unlocks {actions} more permission{actions === 1 ? '' : 's'} across{' '}
          {modules.length} module{modules.length === 1 ? '' : 's'}
        </div>
        <div className="flex flex-wrap gap-1">
          {modules.slice(0, 12).map(m => (
            <Badge key={m} variant="outline" className="text-[10px] font-normal">
              {m}
            </Badge>
          ))}
          {modules.length > 12 && (
            <Badge variant="outline" className="text-[10px] font-normal">
              +{modules.length - 12} more
            </Badge>
          )}
        </div>
      </div>

      <ul className="space-y-1.5 rounded-lg border bg-background p-3">
        {plan.highlights.map(h => (
          <li key={h} className="flex gap-2 text-xs text-muted-foreground">
            <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
            {h}
          </li>
        ))}
      </ul>

      <InvoiceHistorySection limit={3} />

      <Button
        variant="ghost"
        size="sm"
        className="w-full"
        onClick={() => {
          if (context) upgradePrompt.requestUpgrade(context);
          close();
          toast.success('Upgrade request sent', {
            description: `Our team will contact you about moving to ${plan.label}.`,
          });
        }}
      >
        Or ask sales to contact me
      </Button>
    </PrimaryOffCanvas>
  );
}

/** @deprecated Kept so existing imports keep working — now renders a side panel. */
export const UpgradeDialog = UpgradePanel;
