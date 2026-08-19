import { useEffect, useMemo, useRef, useState } from 'react';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileSignature, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { PLANS, PLAN_ORDER, PlanTier } from '@/types/plans';
import { BillingCycle, formatMoney, priceFor, annualDiscountFor } from '@/lib/billingStore';
import { Tenant, tenantRate } from '@/lib/tenantStore';
import {
  TenantAgreementType,
  tenantAgreementStore,
  tenantAgreementTypeLabels,
} from '@/lib/tenantAgreementStore';

interface Props {
  tenant: Tenant | null;
  open: boolean;
  onClose: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);
const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const MAX_BYTES = 20 * 1024 * 1024;

/**
 * Platform-admin panel to issue a plan/subscription agreement for a tenant:
 * either send it for e-signature or record a copy signed offline.
 */
export function TenantAgreementPanel({ tenant, open, onClose }: Props) {
  const [mode, setMode] = useState<'send' | 'upload'>('send');
  const [type, setType] = useState<TenantAgreementType>('subscription_agreement');
  const [title, setTitle] = useState('');
  const [plan, setPlan] = useState<PlanTier>('growth');
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [seats, setSeats] = useState(10);

  const [signatoryName, setSignatoryName] = useState('');
  const [signatoryEmail, setSignatoryEmail] = useState('');
  const [countersignerName, setCountersignerName] = useState('Rostered.ai');
  const [countersignerEmail, setCountersignerEmail] = useState('contracts@rostered.ai');
  const [dueDate, setDueDate] = useState(inDays(10));
  const [effectiveDate, setEffectiveDate] = useState(inDays(14));
  const [termEndsOn, setTermEndsOn] = useState(inDays(379));
  const [message, setMessage] = useState('');

  const [signedOn, setSignedOn] = useState(today());
  const [file, setFile] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!tenant) return;
    setMode('send');
    setType('subscription_agreement');
    setPlan(tenant.plan);
    setCycle(tenant.cycle);
    setSeats(tenant.seats);
    setSignatoryName(tenant.contactName);
    setSignatoryEmail(tenant.contactEmail);
    setTitle('');
    setMessage('');
    setFile(null);
    setDueDate(inDays(10));
    setEffectiveDate(inDays(14));
    setTermEndsOn(inDays(379));
    setSignedOn(today());
  }, [tenant]);

  const rate = useMemo(
    () => (tenant ? tenantRate(tenant, priceFor(plan), annualDiscountFor(plan)) : null),
    [tenant, plan],
  );

  const perUserMonthly = rate
    ? cycle === 'annual'
      ? Math.max(0, rate.monthly - rate.annualDiscount)
      : rate.monthly
    : 0;
  const contractValue = cycle === 'annual' ? perUserMonthly * 12 * seats : perUserMonthly * seats;

  if (!tenant) return null;

  const resolvedTitle =
    title.trim() ||
    `${tenantAgreementTypeLabels[type]} — ${PLANS[plan].label} (${cycle === 'annual' ? 'annual' : 'monthly'})`;

  const pickFile = (f: File | null) => {
    if (!f) return;
    if (f.size > MAX_BYTES) {
      toast.error('File is larger than 20MB.');
      return;
    }
    const ok = ['application/pdf', 'image/png', 'image/jpeg'].includes(f.type);
    if (!ok) {
      toast.error('Upload a PDF, PNG or JPG.');
      return;
    }
    setFile(f);
  };

  const submit = () => {
    const common = {
      tenantId: tenant.id,
      tenantName: tenant.name,
      title: resolvedTitle,
      type,
      plan,
      cycle,
      seats,
      contractValue,
      signatoryName: signatoryName.trim(),
      signatoryEmail: signatoryEmail.trim(),
      effectiveDate,
      termEndsOn,
    };

    if (!common.signatoryName || !common.signatoryEmail) {
      toast.error('Add the signatory name and email.');
      return;
    }

    if (mode === 'send') {
      tenantAgreementStore.send({
        ...common,
        countersignerName: countersignerName.trim() || undefined,
        countersignerEmail: countersignerEmail.trim() || undefined,
        dueDate,
        message: message.trim() || undefined,
      });
      toast.success(`Agreement sent to ${common.signatoryEmail}`);
    } else {
      if (!file) {
        toast.error('Choose the signed file to upload.');
        return;
      }
      tenantAgreementStore.upload({
        ...common,
        fileName: file.name,
        fileSize: file.size,
        signedOn,
      });
      toast.success('Signed agreement recorded');
    }
    onClose();
  };

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title={`Plan agreement · ${tenant.name}`}
      description="Send the subscription agreement for e-signature, or record a copy the client signed offline."
      icon={FileSignature}
      size="lg"
      actions={[
        { label: 'Cancel', variant: 'outlined', onClick: onClose },
        {
          label: mode === 'send' ? 'Send for signature' : 'Save signed agreement',
          variant: 'primary',
          onClick: submit,
        },
      ]}
    >
      <div className="space-y-6">
        <Tabs value={mode} onValueChange={v => setMode(v as 'send' | 'upload')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="send" className="gap-1.5">
              <FileSignature className="h-3.5 w-3.5" /> Send for signature
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-1.5">
              <Upload className="h-3.5 w-3.5" /> Upload signed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Signatory name</Label>
                <Input value={signatoryName} onChange={e => setSignatoryName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Signatory email</Label>
                <Input
                  type="email"
                  value={signatoryEmail}
                  onChange={e => setSignatoryEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Countersigner (us)</Label>
                <Input value={countersignerName} onChange={e => setCountersignerName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Countersigner email</Label>
                <Input
                  type="email"
                  value={countersignerEmail}
                  onChange={e => setCountersignerEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Sign by</Label>
                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Subscription starts</Label>
                <Input
                  type="date"
                  value={effectiveDate}
                  onChange={e => setEffectiveDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Message to the client</Label>
              <Textarea
                rows={3}
                value={message}
                placeholder="Please review and sign to activate your subscription."
                onChange={e => setMessage(e.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-4 space-y-4">
            <div className="rounded-lg border border-dashed border-border p-4 text-center space-y-2">
              <input
                ref={fileInput}
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                className="hidden"
                onChange={e => pickFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <span className="font-medium">{file.name}</span>
                  <span className="text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setFile(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  PDF, PNG or JPG up to 20MB — the copy the client already signed.
                </p>
              )}
              <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
                <Upload className="h-3.5 w-3.5 mr-1.5" /> Choose file
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Signed by</Label>
                <Input value={signatoryName} onChange={e => setSignatoryName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Signatory email</Label>
                <Input
                  type="email"
                  value={signatoryEmail}
                  onChange={e => setSignatoryEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date signed</Label>
                <Input type="date" value={signedOn} onChange={e => setSignedOn(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Subscription starts</Label>
                <Input
                  type="date"
                  value={effectiveDate}
                  onChange={e => setEffectiveDate(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold tracking-tight">Document</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Document type</Label>
              <Select value={type} onValueChange={v => setType(v as TenantAgreementType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(tenantAgreementTypeLabels) as TenantAgreementType[]).map(t => (
                    <SelectItem key={t} value={t}>
                      {tenantAgreementTypeLabels[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Term ends</Label>
              <Input type="date" value={termEndsOn} onChange={e => setTermEndsOn(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Title</Label>
            <Input
              value={title}
              placeholder={resolvedTitle}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold tracking-tight">Commercial terms on this agreement</h3>
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
              <Label className="text-xs">Seats</Label>
              <Input
                type="number"
                min={1}
                value={seats}
                onChange={e => setSeats(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {formatMoney(perUserMonthly)} per user / month
              {rate?.custom && (
                <Badge variant="secondary" className="ml-2 text-[10px]">
                  Negotiated rate
                </Badge>
              )}
            </span>
            <span className="font-semibold">
              {formatMoney(contractValue)} {cycle === 'annual' ? 'per year' : 'per month'}
            </span>
          </div>
        </section>
      </div>
    </PrimaryOffCanvas>
  );
}
