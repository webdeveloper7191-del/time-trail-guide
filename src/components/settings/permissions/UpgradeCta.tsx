import { Button } from '@/components/ui/button';
import { Gem, Lock } from 'lucide-react';
import { PlanTier, PLANS, hasPlan } from '@/types/plans';
import { usePlan } from '@/lib/planStore';
import { upgradePrompt } from '@/lib/upgradePrompt';
import { cn } from '@/lib/utils';

interface UpgradeCtaProps {
  /** Tier that unlocks the capability. */
  needs: PlanTier;
  /** Human label of the blocked capability. */
  feature: string;
  /** Where this CTA lives, for interest reporting. */
  source: string;
  moduleId?: string;
  label?: string;
  size?: 'sm' | 'default';
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  className?: string;
  /** Hide entirely once the plan already covers the feature. */
  hideWhenEntitled?: boolean;
}

/**
 * Single upgrade entry point for every module. Opens the global upgrade side
 * panel and logs the interest so demand per capability can be reported.
 */
export function UpgradeCta({
  needs,
  feature,
  source,
  moduleId,
  label,
  size = 'sm',
  variant = 'default',
  className,
  hideWhenEntitled = true,
}: UpgradeCtaProps) {
  const { tier } = usePlan();
  const entitled = hasPlan(tier, needs);
  if (entitled && hideWhenEntitled) return null;

  return (
    <Button
      size={size}
      variant={variant}
      className={cn('gap-1.5', className)}
      onClick={() => upgradePrompt.open({ needs, feature, source, moduleId })}
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
