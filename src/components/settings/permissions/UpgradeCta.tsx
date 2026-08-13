import { Button } from '@/components/ui/button';
import { Gem, Lock } from 'lucide-react';
import { PlanTier, PLANS, isAtLeast } from '@/types/plans';
import { usePlan } from '@/lib/planStore';
import { BillingCycle } from '@/lib/billingStore';
import { openUpgradeFlow } from '@/lib/upgradeFlow';
import { cn } from '@/lib/utils';

interface UpgradeCtaProps {
  /** Tier that unlocks the capability. */
  needs: PlanTier;
  /** Human label of the blocked capability. */
  feature: string;
  /** Where this CTA lives, for interest reporting. */
  source: string;
  moduleId?: string;
  /** Seats to prefill in checkout; defaults to the current subscription. */
  seats?: number;
  /** Billing cycle to prefill; defaults to the current subscription. */
  cycle?: BillingCycle;
  /** Skip the offer panel and open checkout directly. */
  skipOffer?: boolean;
  label?: string;
  size?: 'sm' | 'default';
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  className?: string;
  /** Hide entirely once the plan already covers the feature. */
  hideWhenEntitled?: boolean;
}

/**
 * Single upgrade entry point for every module. Routes through the shared
 * `openUpgradeFlow` handler so the side panel is always prefilled with the
 * same context (source module, plan, seats, cycle) and the interest is logged.
 */
export function UpgradeCta({
  needs,
  feature,
  source,
  moduleId,
  seats,
  cycle,
  skipOffer,
  label,
  size = 'sm',
  variant = 'default',
  className,
  hideWhenEntitled = true,
}: UpgradeCtaProps) {
  const { tier } = usePlan();
  const entitled = isAtLeast(tier, needs);
  if (entitled && hideWhenEntitled) return null;

  return (
    <Button
      size={size}
      variant={variant}
      className={cn('gap-1.5', className)}
      onClick={() => openUpgradeFlow({ needs, feature, source, moduleId, seats, cycle, skipOffer })}
    >
      {variant === 'default' ? (
        <Gem className="h-3.5 w-3.5" />
      ) : (
        <Lock className="h-3.5 w-3.5" />
      )}
      {label ?? `Upgrade to ${PLANS[needs].label}`}
    </Button>
  );
}

