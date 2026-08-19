import { useState } from 'react';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Activity, Check, Clock, Eye, Mail, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/billingStore';
import {
  OWNER_ROLE_LABELS,
  OWNER_ROLE_OPTIONS,
  OwnerRole,
  TenantAgreement,
  daysToDue,
  isOutstanding,
  isOverdue,
  salesRepById,
  tenantAgreementStatusLabels,
  tenantAgreementStore,
  tenantAgreementTypeLabels,
  trackingSummary,
  useTenantAgreements,
} from '@/lib/tenantAgreementStore';

interface Props {
  agreementId: string | null;
  onClose: () => void;
}

const dt = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString('en-AU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : '–';

/** Delivery + signature tracking for a single tenant agreement. */
export function AgreementTrackingPanel({ agreementId, onClose }: Props) {
  const all = useTenantAgreements();
  const agreement: TenantAgreement | undefined = all.find(a => a.id === agreementId);
  const [declineReason, setDeclineReason] = useState('');

  if (!agreement) return null;

  const due = daysToDue(agreement);
  const overdue = isOverdue(agreement);
  const outstanding = isOutstanding(agreement);

  const steps = [
    { label: 'Sent', at: agreement.sentAt, done: !!agreement.sentAt, icon: Mail },
    { label: 'Opened by client', at: agreement.viewedAt, done: !!agreement.viewedAt, icon: Eye },
    {
      label: agreement.source === 'upload' ? 'Signed copy uploaded' : 'Signed',
      at: agreement.completedAt,
      done: !!agreement.completedAt,
      icon: Check,
    },
  ];

  return (
    <PrimaryOffCanvas
      open={!!agreementId}
      onClose={onClose}
      title="Document tracking"
      description={`${agreement.tenantName} · ${agreement.title}`}
      icon={Activity}
      size="lg"
      actions={[{ label: 'Close', variant: 'outlined', onClick: onClose }]}
    >
      <div className="space-y-6">
        <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">
              {tenantAgreementStatusLabels[agreement.status]}
            </span>
            {overdue && <Badge variant="destructive">Overdue</Badge>}
            {!overdue && outstanding && due !== null && (
              <Badge variant="secondary">{due} days to sign</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{trackingSummary(agreement)}</p>
        </div>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold tracking-tight">Progress</h3>
          <ol className="space-y-3">
            {steps.map(s => (
              <li key={s.label} className="flex items-start gap-3">
                <span
                  className={cn(
                    'mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border',
                    s.done
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'bg-muted border-border text-muted-foreground',
                  )}
                >
                  {s.done ? <s.icon className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                </span>
                <div className="text-sm">
                  <div className={cn(!s.done && 'text-muted-foreground')}>{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.done ? dt(s.at) : 'Pending'}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold tracking-tight">Signatories</h3>
          {agreement.signatories.map(sig => (
            <div
              key={sig.email + sig.role}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
            >
              <div>
                <div className="font-medium">{sig.name}</div>
                <div className="text-xs text-muted-foreground">
                  {sig.email} · {sig.role === 'client' ? 'Client' : 'Rostered.ai'}
                </div>
              </div>
              {sig.signedAt ? (
                <Badge variant="secondary" className="gap-1">
                  <Check className="h-3 w-3" /> Signed {dt(sig.signedAt)}
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" /> Awaiting
                </Badge>
              )}
            </div>
          ))}
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          {(['salesRepId', 'onboardingManagerId', 'accountManagerId'] as OwnerRole[]).map(role => (
            <div className="space-y-1.5" key={role}>
              <Label className="text-xs">{OWNER_ROLE_LABELS[role]}</Label>
              <Select
                value={agreement[role] ?? ''}
                onValueChange={v => {
                  tenantAgreementStore.assignOwner(agreement.id, role, v);
                  toast.success(`${OWNER_ROLE_LABELS[role]} set to ${salesRepById(v)?.name}`);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Assign ${OWNER_ROLE_LABELS[role].toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {OWNER_ROLE_OPTIONS[role].map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                      {r.territory ? ` · ${r.territory}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          <div className="space-y-1.5">
            <Label className="text-xs">Contract value</Label>
            <div className="h-10 flex items-center rounded-md border border-border px-3 text-sm">
              {agreement.contractValue != null
                ? `${formatMoney(agreement.contractValue)} ${agreement.cycle === 'annual' ? '/ yr' : '/ mo'}`
                : '–'}
              <span className="ml-2 text-xs text-muted-foreground">
                {tenantAgreementTypeLabels[agreement.type]}
              </span>
            </div>
          </div>
        </section>

        {outstanding && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold tracking-tight">Actions</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  tenantAgreementStore.resend(agreement.id);
                  toast.success('Reminder sent');
                }}
              >
                <Mail className="h-3.5 w-3.5 mr-1.5" /> Send reminder
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => tenantAgreementStore.markViewed(agreement.id)}
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" /> Log an open
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  tenantAgreementStore.markSigned(agreement.id, 'Platform admin');
                  toast.success('Marked as signed');
                }}
              >
                <Check className="h-3.5 w-3.5 mr-1.5" /> Mark as signed
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                className="h-9"
                placeholder="Decline reason (optional)"
                value={declineReason}
                onChange={e => setDeclineReason(e.target.value)}
              />
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-destructive"
                onClick={() => {
                  tenantAgreementStore.markDeclined(agreement.id, declineReason.trim() || undefined);
                  setDeclineReason('');
                }}
              >
                <X className="h-3.5 w-3.5 mr-1.5" /> Declined
              </Button>
            </div>
          </section>
        )}

        <section className="space-y-2">
          <h3 className="text-sm font-semibold tracking-tight">Audit trail</h3>
          <div className="space-y-2">
            {[...agreement.history].reverse().map((h, i) => (
              <div key={i} className="rounded-md border border-border px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span>{h.label}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{dt(h.at)}</span>
                </div>
                {h.by && <div className="text-xs text-muted-foreground">by {h.by}</div>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </PrimaryOffCanvas>
  );
}

export default AgreementTrackingPanel;
