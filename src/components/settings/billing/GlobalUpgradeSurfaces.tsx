import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UpgradePanel } from '@/components/settings/permissions/UpgradePanel';
import { CheckoutPanel } from '@/components/settings/billing/CheckoutPanel';

const PLANS_ROUTE = '/settings/permissions';

/**
 * Mounts the upgrade + checkout side panels once for the whole app so any
 * module can call `upgradePrompt.open(...)` or `checkout.open(...)`.
 */
export function GlobalUpgradeSurfaces() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // "Compare plans" works from anywhere: route to the plans tab when needed.
  useEffect(() => {
    const onOpenPlans = () => {
      if (pathname !== PLANS_ROUTE) navigate(PLANS_ROUTE, { state: { tab: 'plans' } });
    };
    window.addEventListener('rai:open-plans', onOpenPlans);
    return () => window.removeEventListener('rai:open-plans', onOpenPlans);
  }, [navigate, pathname]);

  return (
    <>
      <UpgradePanel />
      <CheckoutPanel />
    </>
  );
}
