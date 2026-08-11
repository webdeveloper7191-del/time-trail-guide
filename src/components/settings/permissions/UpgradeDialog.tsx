import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Gem, Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { PLANS, PLAN_ORDER, planRank } from '@/types/plans';
import { PERMISSION_MODULES, getSubPermissions } from '@/types/permissions';
import { planModuleActions, planSubActions, usePlanEntitlements } from '@/lib/planEntitlementsStore';
import { usePlan } from '@/lib/planStore';
import { upgradePrompt, useUpgradePrompt } from '@/lib/upgradePrompt';

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

export function UpgradeDialog() {
  const { context } = useUpgradePrompt();
  const { tier, setTier } = usePlan();
  const target = context?.needs ?? 'enterprise';
  const plan = PLANS[target];
  const { actions, modules } = useUnlockDelta(planRank(tier), target);

  const close = () => upgradePrompt.close();

  return (
    <Dialog open={!!context} onOpenChange={o => !o && close()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-primary/10">
              <Gem className="h-4 w-4 text-primary" />
            </span>
            <DialogTitle className="tracking-tight">Unlock with {plan.label}</DialogTitle>
            <Badge variant="secondary" className="text-[10px]">
              You're on {PLANS[tier].label}
            </Badge>
          </div>
          <DialogDescription>
            {context?.feature ? (
              <>
                <span className="text-foreground font-medium">{context.feature}</span> is included
                from the {plan.label} plan. {plan.tagline}
              </>
            ) : (
              plan.tagline
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border bg-muted/30 p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Upgrading unlocks {actions} more permission{actions === 1 ? '' : 's'} across{' '}
            {modules.length} module{modules.length === 1 ? '' : 's'}
          </div>
          <div className="flex flex-wrap gap-1">
            {modules.slice(0, 8).map(m => (
              <Badge key={m} variant="outline" className="text-[10px] font-normal">
                {m}
              </Badge>
            ))}
            {modules.length > 8 && (
              <Badge variant="outline" className="text-[10px] font-normal">
                +{modules.length - 8} more
              </Badge>
            )}
          </div>
        </div>

        <ul className="space-y-1.5">
          {plan.highlights.map(h => (
            <li key={h} className="flex gap-2 text-xs text-muted-foreground">
              <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
              {h}
            </li>
          ))}
        </ul>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              close();
              window.dispatchEvent(new CustomEvent('rai:open-plans'));
            }}
          >
            Compare plans
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setTier(target);
                close();
                toast.success(`Previewing the ${plan.label} plan`, {
                  description: 'Entitlements now reflect this tier so you can trial the workflow.',
                });
              }}
            >
              <Lock className="h-3.5 w-3.5" /> Start trial
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (context) upgradePrompt.requestUpgrade(context);
                close();
                toast.success('Upgrade request sent', {
                  description: `Our team will contact you about moving to ${plan.label}.`,
                });
              }}
            >
              Request upgrade
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
