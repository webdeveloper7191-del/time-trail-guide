import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreditCard, Lock, Loader2, ShieldCheck, Minus, Plus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { PLANS, PlanTier } from '@/types/plans';
import { usePlan } from '@/lib/planStore';
import {
  BillingCycle,
  PRICE_PER_USER,
  billingStore,
  checkout,
  formatMoney,
  invoiceTotal,
  useCheckout,
  CURRENCY,
} from '@/lib/billingStore';
import { cn } from '@/lib/utils';

const digits = (v: string) => v.replace(/\D/g, '');

const formatCard = (v: string) =>
  digits(v)
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();

const formatExpiry = (v: string) => {
  const d = digits(v).slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)} / ${d.slice(2)}`;
};

const brandOf = (num: string) => {
  const d = digits(num);
  if (d.startsWith('4')) return 'Visa';
  if (/^5[1-5]/.test(d)) return 'Mastercard';
  if (/^3[47]/.test(d)) return 'Amex';
  return 'Card';
};

const COUNTRIES = ['Australia', 'New Zealand', 'United Kingdom', 'United States', 'Singapore'];

export function CheckoutDialog() {
  const { context } = useCheckout();
  const { setTier } = usePlan();

  const [tier, setLocalTier] = useState<PlanTier>('growth');
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [seats, setSeats] = useState(25);
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [name, setName] = useState('');
  const [card, setCard] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [country, setCountry] = useState('Australia');
  const [promo, setPromo] = useState('');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!context) return;
    const current = billingStore.get();
    setLocalTier(context.tier);
    setCycle(context.cycle ?? current.cycle);
    setSeats(context.seats ?? current.seats);
    setEmail(current.billingEmail);
    setCompany(current.companyName);
    setName(current.paymentMethod?.name ?? '');
    setCard('');
    setExpiry('');
    setCvc('');
    setPromo('');
    setProcessing(false);
    setDone(false);
  }, [context]);

  const plan = PLANS[tier];
  const totals = useMemo(() => invoiceTotal(tier, cycle, seats), [tier, cycle, seats]);

  const cardValid = digits(card).length >= 15;
  const expiryValid = digits(expiry).length === 4;
  const cvcValid = digits(cvc).length >= 3;
  const canPay =
    !!email.trim() && !!name.trim() && cardValid && expiryValid && cvcValid && seats > 0;

  const pay = () => {
    setProcessing(true);
    // Simulated Stripe Checkout session — no live charge is made.
    setTimeout(() => {
      const d = digits(expiry);
      billingStore.confirmCheckout({
        tier,
        cycle,
        seats,
        billingEmail: email.trim(),
        companyName: company.trim(),
        paymentMethod: {
          brand: brandOf(card),
          last4: digits(card).slice(-4),
          expMonth: Number(d.slice(0, 2)),
          expYear: 2000 + Number(d.slice(2)),
          name: name.trim(),
        },
      });
      setTier(tier);
      setProcessing(false);
      setDone(true);
      toast.success(`Subscribed to ${plan.label}`, {
        description: `${seats} users · ${formatMoney(totals.total)} ${CURRENCY} charged.`,
      });
    }, 1400);
  };

  return (
    <Dialog open={!!context} onOpenChange={o => !o && checkout.close()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden gap-0">
        {done ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 mx-auto text-primary" />
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Payment successful</h2>
              <p className="text-sm text-muted-foreground">
                {plan.label} is now active for {seats} users. A receipt was sent to{' '}
                <span className="text-foreground">{email}</span>.
              </p>
            </div>
            <Button onClick={() => checkout.close()}>Back to billing</Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-[1fr_1.1fr]">
            {/* Order summary */}
            <aside className="bg-muted/40 border-r p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Subscribe to
                </p>
                <h2 className="text-lg font-semibold tracking-tight">{plan.label}</h2>
                <p className="text-xs text-muted-foreground">{plan.tagline}</p>
              </div>

              <div className="flex rounded-md border bg-background p-0.5 text-xs">
                {(['monthly', 'annual'] as BillingCycle[]).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCycle(c)}
                    className={cn(
                      'flex-1 rounded-[4px] px-2 py-1.5 capitalize transition-colors',
                      cycle === c
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {c}
                    {c === 'annual' && ' · 2 months free'}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Users</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSeats(s => Math.max(1, s - 1))}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <Input
                    value={seats}
                    onChange={e => setSeats(Math.max(1, Number(digits(e.target.value)) || 1))}
                    className="h-8 text-center"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSeats(s => s + 1)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <Separator />

              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <dt>
                    {formatMoney(PRICE_PER_USER[tier])} × {seats} users × {totals.months} month
                    {totals.months === 1 ? '' : 's'}
                  </dt>
                  <dd className="text-foreground">{formatMoney(totals.subtotal)}</dd>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <dt>GST (10%)</dt>
                  <dd className="text-foreground">{formatMoney(totals.tax)}</dd>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <dt>Total due today</dt>
                  <dd>
                    {formatMoney(totals.total)} <span className="text-xs">{CURRENCY}</span>
                  </dd>
                </div>
              </dl>

              <div className="flex gap-2">
                <Input
                  value={promo}
                  onChange={e => setPromo(e.target.value.toUpperCase())}
                  placeholder="Promo code"
                  className="h-8 text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() =>
                    toast.info(
                      promo ? `Code “${promo}” will be validated at checkout` : 'Enter a code',
                    )
                  }
                >
                  Apply
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Renews {cycle === 'annual' ? 'yearly' : 'monthly'}. Adding users mid-cycle is
                prorated automatically.
              </p>
            </aside>

            {/* Payment details */}
            <section className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold tracking-tight">Payment details</h3>
                <Badge variant="secondary" className="gap-1 text-[10px]">
                  <Lock className="h-3 w-3" /> Secured by Stripe
                </Badge>
              </div>

              <div className="grid gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Billing email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="accounts@company.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Company name</Label>
                  <Input
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="Acme Care Group Pty Ltd"
                  />
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <Label className="text-xs">Card information</Label>
                  <div className="rounded-md border divide-y">
                    <div className="relative">
                      <Input
                        value={card}
                        onChange={e => setCard(formatCard(e.target.value))}
                        placeholder="1234 1234 1234 1234"
                        inputMode="numeric"
                        className="border-0 rounded-b-none focus-visible:ring-0 pr-16"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">
                        {card ? brandOf(card) : <CreditCard className="h-4 w-4" />}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 divide-x">
                      <Input
                        value={expiry}
                        onChange={e => setExpiry(formatExpiry(e.target.value))}
                        placeholder="MM / YY"
                        inputMode="numeric"
                        className="border-0 rounded-none rounded-bl-md focus-visible:ring-0"
                      />
                      <Input
                        value={cvc}
                        onChange={e => setCvc(digits(e.target.value).slice(0, 4))}
                        placeholder="CVC"
                        inputMode="numeric"
                        className="border-0 rounded-none rounded-br-md focus-visible:ring-0"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Name on card</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Country</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(c => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button className="w-full gap-2" disabled={!canPay || processing} onClick={pay}>
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Processing…
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5" /> Pay {formatMoney(totals.total)}
                  </>
                )}
              </Button>

              <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-px" />
                This is a demo checkout — no card is charged and no card data leaves this browser.
              </p>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
