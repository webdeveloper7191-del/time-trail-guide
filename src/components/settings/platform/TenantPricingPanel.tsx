import { useEffect, useState } from 'react';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tag } from 'lucide-react';
import { toast } from 'sonner';
import { PLANS, PLAN_ORDER, PlanTier } from '@/types/plans';
import { BillingCycle, formatMoney, priceFor, annualDiscountFor } from '@/lib/billingStore';
import { Tenant, TenantPricing, tenantStore } from '@/lib/tenantStore';
import {
  LIMIT_LABEL,
  LimitKey,
  LimitOverrides,
  validatePlanLimits,
} from '@/lib/planLimitsStore';
import { cn } from '@/lib/utils';

interface Props {
  tenant: Tenant | null;
  open: boolean;
  onClose: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

/** Client-specific pricing: negotiated per-user rates that override the price book. */
export function TenantPricingPanel({ tenant, open, onClose }: Props) {
  const [plan, setPlan] = useState<PlanTier>('growth');
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [seats, setSeats] = useState(10);
  const [custom, setCustom] = useState(false);
  const [draft, setDraft] = useState<TenantPricing>({
    monthly: 9,
    annualDiscount: 1.5,
    effectiveFrom: today(),
  });

  const [limits, setLimits] = useState<LimitOverrides>({});

  useEffect(() => {
    if (!tenant) return;
    setPlan(tenant.plan);
    setCycle(tenant.cycle);
    setSeats(tenant.seats);
    setCustom(!!tenant.customPricing);
    setLimits(tenant.limitOverrides ?? {});
    setDraft(
      tenant.customPricing ?? {
        monthly: priceFor(tenant.plan),
        annualDiscount: annualDiscountFor(tenant.plan),
        effectiveFrom: today(),
      },
    );
  }, [tenant]);

  if (!tenant) return null;

  const listMonthly = priceFor(plan);
  const listDiscount = annualDiscountFor(plan);
  const effMonthly = custom ? draft.monthly : listMonthly;
  const effDiscount = custom ? draft.annualDiscount : listDiscount;
  const unit = cycle === 'annual' ? Math.max(0, effMonthly - effDiscount) : effMonthly;
  const listUnit = cycle === 'annual' ? Math.max(0, listMonthly - listDiscount) : listMonthly;
  const perMonth = unit * seats;
  const savingPerYear = (listUnit - unit) * seats * 12;

  const save = () => {
    tenantStore.update(tenant.id, { plan, cycle, seats });
    tenantStore.setPricing(tenant.id, custom ? draft : undefined);
    toast.success(custom ? 'Client pricing saved' : 'Reverted to standard price book');
    onClose();
  };

  const set = (patch: Partial<TenantPricing>) => setDraft(d => ({ ...d, ...patch }));

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title={`Pricing · ${tenant.name}`}
      description="Set the subscription and, where a rate has been negotiated, a client-specific price that overrides the standard price book."
      icon={Tag}
      size="lg"
      actions={[
        { label: 'Cancel', variant: 'outlined', onClick: onClose },
        { label: 'Save pricing', variant: 'primary', onClick: save },
      ]}
    >
      <div className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold tracking-tight">Subscription</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Plan</Label>
              <Select value={plan} onValueChange={v => setPlan(v as PlanTier)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_ORDER.map(t => (
                    <SelectItem key={t} value={t}>
                      {PLANS[t].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Billing cycle</Label>
              <Select value={cycle} onValueChange={v => setCycle(v as BillingCycle)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Paid seats</Label>
              <Input
                type="number"
                min={1}
                value={seats}
                onChange={e => setSeats(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
          </div>
        </section>

        <section className="space-y-3 rounded-lg border p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold tracking-tight">Plan limits</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {PLANS[plan].label} allows {fmtLimit(planCaps.staff)} staff,{' '}
                {fmtLimit(planCaps.locations)} locations. Override only where a deal has been
                agreed.
              </p>
            </div>
            <Switch checked={limitsOverridden} onCheckedChange={toggleLimits} />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {limitChecks.map(c => (
              <div
                key={c.key}
                className={cn(
                  'rounded-md border p-2 text-xs',
                  c.status === 'breach' && 'border-destructive/40 bg-destructive/5',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{c.label}</span>
                  <span className="font-medium">
                    {c.used.toLocaleString()} / {fmtLimit(c.limit)}
                  </span>
                </div>
                {c.status === 'breach' && (
                  <p className="text-destructive mt-0.5">
                    {c.excess} over the {PLANS[plan].label} cap.
                  </p>
                )}
              </div>
            ))}
          </div>

          {limitsOverridden && (
            <div className="grid gap-3 sm:grid-cols-2 pt-1">
              {(['staff', 'locations'] as LimitKey[]).map(key => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs">{LIMIT_LABEL[key]} maximum (blank = unlimited)</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Unlimited"
                    value={limits[key]?.value ?? ''}
                    onChange={e =>
                      setLimits(l => ({
                        ...l,
                        [key]: {
                          reason: l[key]?.reason ?? '',
                          approvedBy: l[key]?.approvedBy,
                          value: e.target.value === '' ? null : Number(e.target.value) || 0,
                        },
                      }))
                    }
                  />
                </div>
              ))}
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Override reason</Label>
                <Textarea
                  rows={2}
                  placeholder="e.g. Free pilot extended to 8 staff until contract signature"
                  value={limits.staff?.reason ?? limits.locations?.reason ?? ''}
                  onChange={e =>
                    setLimits(l => {
                      const reason = e.target.value;
                      const next: typeof l = { ...l };
                      for (const k of ['staff', 'locations'] as LimitKey[]) {
                        if (next[k]) next[k] = { ...next[k]!, reason };
                      }
                      return next;
                    })
                  }
                />
              </div>
            </div>
          )}
        </section>

        <section className="space-y-3 rounded-lg border p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold tracking-tight">Client-specific pricing</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Standard rate today is {formatMoney(listMonthly)} / user / month
                {listDiscount > 0 && ` (less ${formatMoney(listDiscount)} when billed annually)`}.
              </p>
            </div>
            <Switch checked={custom} onCheckedChange={setCustom} />
          </div>

          {custom && (
            <div className="grid gap-3 sm:grid-cols-2 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs">Negotiated monthly rate / user</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={draft.monthly}
                  onChange={e => set({ monthly: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Annual discount / user</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={draft.annualDiscount}
                  onChange={e => set({ annualDiscount: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Effective from</Label>
                <Input
                  type="date"
                  value={draft.effectiveFrom}
                  onChange={e => set({ effectiveFrom: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Expires on (optional)</Label>
                <Input
                  type="date"
                  value={draft.expiresOn ?? ''}
                  onChange={e => set({ expiresOn: e.target.value || undefined })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Contract note</Label>
                <Textarea
                  rows={2}
                  placeholder="e.g. 3-year agreement, rate locked until renewal"
                  value={draft.note ?? ''}
                  onChange={e => set({ note: e.target.value })}
                />
              </div>
            </div>
          )}
        </section>

        <section className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Effective rate</span>
            <span className="font-medium">
              {formatMoney(unit)} / user / month
              {custom && (
                <Badge variant="secondary" className="ml-2 text-[10px]">
                  Custom
                </Badge>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {seats} seats · billed {cycle === 'annual' ? '12 months up front' : 'monthly'}
            </span>
            <span className="font-semibold">
              {formatMoney(cycle === 'annual' ? perMonth * 12 : perMonth)}{' '}
              {cycle === 'annual' ? 'per year' : 'per month'}
            </span>
          </div>
          {savingPerYear !== 0 && (
            <p className="text-xs text-muted-foreground">
              {savingPerYear > 0
                ? `${formatMoney(savingPerYear)} a year below list price.`
                : `${formatMoney(Math.abs(savingPerYear))} a year above list price.`}
            </p>
          )}
        </section>
      </div>
    </PrimaryOffCanvas>
  );
}
