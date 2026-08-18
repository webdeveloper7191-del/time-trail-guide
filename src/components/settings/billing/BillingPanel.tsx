import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  CreditCard,
  Download,
  Gem,
  Receipt,
  RefreshCw,
  Users,
  CalendarClock,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { PLANS, PLAN_ORDER } from '@/types/plans';
import {
  unitRate,
  billingStore,
  checkout,
  formatMoney,
  invoiceTotal,
  useBilling,
  CURRENCY,
} from '@/lib/billingStore';
import { cn } from '@/lib/utils';

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });

export function BillingPanel() {
  const billing = useBilling();
  const plan = PLANS[billing.tier];
  const totals = invoiceTotal(billing.tier, billing.cycle, billing.seats);

  return (
    <div className="space-y-4">
      {/* Current subscription */}
      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{plan.label}</CardTitle>
                  <Badge
                    variant={billing.status === 'active' ? 'default' : 'secondary'}
                    className="text-[10px] capitalize"
                  >
                    {billing.status === 'trialing' ? 'Trial' : billing.status}
                  </Badge>
                  {billing.cancelAtPeriodEnd && (
                    <Badge variant="outline" className="text-[10px]">
                      Cancels {dateFmt(billing.renewsOn)}
                    </Badge>
                  )}
                </div>
                <CardDescription>{plan.tagline}</CardDescription>
              </div>
              <Button size="sm" onClick={() => checkout.open({ tier: billing.tier, source: 'billing' })}>
                {billing.status === 'active' ? 'Update subscription' : 'Add payment method'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-md border p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" /> Users
                </div>
                <div className="text-lg font-semibold tracking-tight">{billing.seats}</div>
                <div className="text-[11px] text-muted-foreground">
                  {formatMoney(unitRate(billing.tier, billing.cycle))} per user / month
                </div>
              </div>
              <div className="rounded-md border p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Receipt className="h-3.5 w-3.5" /> Next invoice
                </div>
                <div className="text-lg font-semibold tracking-tight">
                  {formatMoney(totals.total)}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  incl. GST · {CURRENCY} · billed {billing.cycle}
                </div>
              </div>
              <div className="rounded-md border p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" /> Renews
                </div>
                <div className="text-lg font-semibold tracking-tight">
                  {dateFmt(billing.renewsOn)}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {billing.cancelAtPeriodEnd ? 'Cancellation scheduled' : 'Auto-renews'}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => checkout.open({ tier: billing.tier, source: 'seats' })}
              >
                <Users className="h-3.5 w-3.5" /> Change users
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() =>
                  checkout.open({
                    tier: billing.tier,
                    cycle: billing.cycle === 'annual' ? 'monthly' : 'annual',
                    source: 'cycle',
                  })
                }
              >
                <RefreshCw className="h-3.5 w-3.5" /> Switch to{' '}
                {billing.cycle === 'annual' ? 'monthly' : 'annual'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => {
                  billingStore.update({ cancelAtPeriodEnd: !billing.cancelAtPeriodEnd });
                  toast.success(
                    billing.cancelAtPeriodEnd
                      ? 'Subscription will renew as normal'
                      : `Subscription will end on ${dateFmt(billing.renewsOn)}`,
                  );
                }}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                {billing.cancelAtPeriodEnd ? 'Resume subscription' : 'Cancel at period end'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment method */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Payment method</CardTitle>
            <CardDescription>Card charged for every renewal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {billing.paymentMethod ? (
              <div className="rounded-md border p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {billing.paymentMethod.brand} •••• {billing.paymentMethod.last4}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {billing.paymentMethod.name} · expires{' '}
                  {String(billing.paymentMethod.expMonth).padStart(2, '0')}/
                  {String(billing.paymentMethod.expYear).slice(-2)}
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                No card on file. Add one to keep access after the trial ends.
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => checkout.open({ tier: billing.tier, source: 'payment-method' })}
            >
              {billing.paymentMethod ? 'Update card' : 'Add card'}
            </Button>
            <Separator />
            <div className="text-xs space-y-1">
              <div className="text-muted-foreground">Billed to</div>
              <div className="font-medium">{billing.companyName || '—'}</div>
              <div className="text-muted-foreground">{billing.billingEmail || 'No billing email'}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan pricing */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Change plan</CardTitle>
          <CardDescription>
            Per-user pricing, billed {billing.cycle}. Annual pays 10 months for 12.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {PLAN_ORDER.map(t => {
            const p = PLANS[t];
            const current = t === billing.tier && billing.status === 'active';
            return (
              <div
                key={t}
                className={cn(
                  'rounded-md border p-4 space-y-3',
                  current && 'border-primary ring-1 ring-primary/30',
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{p.label}</div>
                  {current && (
                    <Badge className="text-[10px] gap-1">
                      <Gem className="h-3 w-3" /> Current
                    </Badge>
                  )}
                </div>
                <div>
                  <span className="text-2xl font-semibold tracking-tight">
                    {formatMoney(PRICE_PER_USER[t])}
                  </span>
                  <span className="text-xs text-muted-foreground"> / user / month</span>
                </div>
                <p className="text-xs text-muted-foreground">{p.tagline}</p>
                <div className="text-[11px] text-muted-foreground">
                  {formatMoney(invoiceTotal(t, billing.cycle, billing.seats).total)} for{' '}
                  {billing.seats} users incl. GST
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  variant={current ? 'outline' : 'default'}
                  disabled={current}
                  onClick={() => checkout.open({ tier: t, cycle: billing.cycle, source: 'plan-card' })}
                >
                  {current ? 'Current plan' : `Choose ${p.label}`}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Invoices</CardTitle>
          <CardDescription>Receipts for every charge on this account.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {billing.invoices.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">
              No invoices yet — they appear here after your first payment.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="text-left font-medium px-4 py-2.5">Invoice</th>
                    <th className="text-left font-medium px-4 py-2.5">Date</th>
                    <th className="text-left font-medium px-4 py-2.5">Description</th>
                    <th className="text-right font-medium px-4 py-2.5">Amount</th>
                    <th className="text-center font-medium px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {billing.invoices.map(inv => (
                    <tr key={inv.id} className="border-b hover:bg-muted/20">
                      <td className="px-4 py-2 font-mono text-xs">{inv.id}</td>
                      <td className="px-4 py-2">{dateFmt(inv.date)}</td>
                      <td className="px-4 py-2 text-muted-foreground">{inv.description}</td>
                      <td className="px-4 py-2 text-right font-medium">{formatMoney(inv.amount)}</td>
                      <td className="px-4 py-2 text-center">
                        <Badge variant="secondary" className="text-[10px] capitalize">
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => toast.info('Receipt download is not wired up yet')}
                        >
                          <Download className="h-3.5 w-3.5" /> Receipt
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
