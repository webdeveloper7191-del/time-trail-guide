import { Fragment, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PricingSchedulePanel } from '@/components/settings/permissions/PricingSchedulePanel';
import { usePricingSchedule } from '@/lib/pricingScheduleStore';

import { Check, Lock, Sparkles, PhoneCall } from 'lucide-react';
import {
  PLANS,
  PLAN_ORDER,
  PlanTier,
  isAtLeast,
  planLabel,
} from '@/types/plans';
import { PERMISSION_MODULES, moduleGroups } from '@/types/permissions';
import { usePlan } from '@/lib/planStore';
import {
  planCoverage,
  planModuleActions,
  requiredModuleTier,
  usePlanEntitlements,
} from '@/lib/planEntitlementsStore';

import {
  ANNUAL_DISCOUNT_PER_USER,
  BillingCycle,
  PRICE_PER_USER,
  formatMoney,
  unitRate,
} from '@/lib/billingStore';
import { openCheckoutFlow } from '@/lib/upgradeFlow';

import { cn } from '@/lib/utils';


const fmt = (n: number | null) => (n === null ? 'Unlimited' : n.toLocaleString());

interface PlansPanelProps {
  /**
   * `tenant` (default) — shows the tenant's current plan and upgrade actions.
   * `admin` — catalogue configuration only, no purchase/upgrade CTAs.
   */
  mode?: 'tenant' | 'admin';
}

export function PlansPanel({ mode = 'tenant' }: PlansPanelProps = {}) {
  const isAdmin = mode === 'admin';
  const { tier } = usePlan();
  const entitlements = usePlanEntitlements();
  const [cycle, setCycle] = useState<BillingCycle>('monthly');

  const rows = useMemo(
    () =>
      PERMISSION_MODULES.map(m => ({
        id: m.id,
        label: m.label,
        group: m.group,
        needs: requiredModuleTier(m.id),
        included: PLAN_ORDER.map(t => planModuleActions(t, m.id).length > 0),
      })),
    [entitlements],
  );

  return (
    <div className="space-y-4">
      {isAdmin && <PricingSchedulePanel />}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">
            Prices are per user, per month, in AUD. Annual billing is charged 12 months up front.
          </p>
          {upcoming.length > 0 && (
            <p className="text-[11px] text-muted-foreground">
              New pricing takes effect{' '}
              {new Date(`${upcoming[0].effectiveFrom}T00:00:00`).toLocaleDateString('en-AU', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
              .
            </p>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <Label
            htmlFor="billing-cycle"
            className={cn(
              'text-xs cursor-pointer',
              cycle === 'monthly' ? 'font-medium text-foreground' : 'text-muted-foreground',
            )}
          >
            Monthly
          </Label>
          <Switch
            id="billing-cycle"
            checked={cycle === 'annual'}
            onCheckedChange={v => setCycle(v ? 'annual' : 'monthly')}
          />
          <Label
            htmlFor="billing-cycle"
            className={cn(
              'text-xs cursor-pointer',
              cycle === 'annual' ? 'font-medium text-foreground' : 'text-muted-foreground',
            )}
          >
            Annual
          </Label>
          <Badge variant="secondary" className="text-[10px]">
            Save more
          </Badge>
        </div>
      </div>


      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {PLAN_ORDER.map(t => {
          const p = PLANS[t];
          const current = !isAdmin && t === tier;
          const rate = unitRate(t, cycle);
          const saving = ANNUAL_DISCOUNT_PER_USER[t];
          return (
            <Card key={t} className={cn(current && 'border-primary ring-1 ring-primary/30')}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{p.label}</CardTitle>
                  {current && (
                    <Badge className="text-[10px] gap-1">
                      <Sparkles className="h-3 w-3" /> Current plan
                    </Badge>
                  )}
                </div>
                <CardDescription>{p.tagline}</CardDescription>
                <div className="pt-1">
                  <span className="text-2xl font-semibold tracking-tight">
                    {t === 'free' ? 'Free' : formatMoney(rate)}
                  </span>
                  {t !== 'free' && (
                    <span className="text-xs text-muted-foreground"> / user / month</span>
                  )}
                </div>
                {t !== 'free' && (
                  <div className="text-[11px] text-muted-foreground">
                    {cycle === 'annual'
                      ? `Save ${formatMoney(saving)} / user / month vs ${formatMoney(PRICE_PER_USER[t])} monthly`
                      : `${formatMoney(unitRate(t, 'annual'))} / user / month billed annually`}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-3">

                <ul className="space-y-1.5">
                  {p.highlights.map(h => (
                    <li key={h} className="flex gap-2 text-xs text-muted-foreground">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
                <div className="rounded-md border p-2 text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {planCoverage(t).granted}
                  </span>{' '}
                  of {planCoverage(t).total} capabilities included
                </div>

                <div className="grid grid-cols-2 gap-2 rounded-md border p-2 text-[11px]">
                  <div>
                    <div className="text-muted-foreground">Locations</div>
                    <div className="font-medium">{fmt(p.limits.locations)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Staff</div>
                    <div className="font-medium">
                      {p.limits.staff === null ? 'Unlimited' : `${p.limits.staff} max`}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Custom roles</div>
                    <div className="font-medium">{fmt(p.limits.customRoles)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">API credentials</div>
                    <div className="font-medium">{fmt(p.limits.apiCredentials)}</div>
                  </div>
                </div>
                {isAdmin ? (
                  <div className="rounded-md border border-dashed p-2 text-[11px] text-muted-foreground">
                    Catalogue definition. Tenants subscribe from Users &amp; Permissions → Plans.
                  </div>
                ) : p.contactSales ? (
                  <Button
                    className="w-full gap-1.5"
                    variant={current ? 'outline' : 'default'}
                    asChild={!current}
                    disabled={current}
                  >
                    {current ? (
                      <span>Current plan</span>
                    ) : (
                      <a href="mailto:sales@rostered.ai?subject=Enterprise%20plan%20enquiry">
                        <PhoneCall className="h-3.5 w-3.5" /> Talk to sales
                      </a>
                    )}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={current ? 'outline' : t === 'free' ? 'outline' : 'default'}
                    disabled={current}
                    onClick={() =>
                      openCheckoutFlow({
                        needs: t,
                        feature: `${p.label} plan`,
                        source: 'plans-panel',
                        cycle,
                      })
                    }
                  >
                    {current
                      ? 'Current plan'
                      : t === 'free'
                        ? 'Downgrade to Free'
                        : isAtLeast(tier, t)
                          ? `Switch to ${p.label}`
                          : `Upgrade to ${p.label}`}
                  </Button>
                )}


              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">What each plan unlocks</CardTitle>
          <CardDescription>
            Effective access is the role's permissions <strong>and</strong> the plan's entitlements.
            Anything locked here stays locked in the matrix, whatever the role allows.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="text-left font-medium px-4 py-2.5 min-w-[240px]">Module</th>
                  {PLAN_ORDER.map(t => (
                    <th key={t} className="px-3 py-2.5 font-medium text-center w-[130px]">
                      {planLabel(t)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {moduleGroups.map(group => {
                  const groupRows = rows.filter(r => r.group === group);
                  if (!groupRows.length) return null;
                  return (
                    <Fragment key={group}>
                      <tr className="bg-muted/30">
                        <td
                          colSpan={PLAN_ORDER.length + 1}
                          className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                        >
                          {group}
                        </td>
                      </tr>
                      {groupRows.map(r => (
                        <tr key={r.id} className="border-b hover:bg-muted/20">
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium">{r.label}</span>
                              {r.needs && r.needs !== 'free' && (
                                <Badge variant="secondary" className="text-[10px]">
                                  {planLabel(r.needs as PlanTier)}+
                                </Badge>
                              )}
                            </div>
                          </td>
                          {r.included.map((yes, i) => (
                            <td key={PLAN_ORDER[i]} className="px-3 py-2 text-center">
                              {yes ? (
                                <Check className="h-4 w-4 mx-auto text-primary" />
                              ) : (
                                <Lock className="h-3.5 w-3.5 mx-auto text-muted-foreground/50" />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
