import { useEffect, useMemo, useState } from 'react';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import { PLANS } from '@/types/plans';
import { formatMoney } from '@/lib/billingStore';
import { planContractDefaultsStore } from '@/lib/planContractDefaultsStore';
import {
  TenantAgreement,
  addMonths,
  effectiveUplift,
  renewalDocumentBody,
  tenantAgreementStore,
  upliftBasisLabels,
  upliftedValue,
} from '@/lib/tenantAgreementStore';

interface Props {
  /** The expiring agreement the renewal is generated from. */
  source: TenantAgreement | null;
  open: boolean;
  onClose: () => void;
}

const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

/**
 * Generates a renewal agreement pre-filled from the expiring term (falling
 * back to the plan-level contract defaults) so it can be reviewed, edited and
 * then sent for signature.
 */
export function RenewalDocumentPanel({ source, open, onClose }: Props) {
  const [body, setBody] = useState('');
  const [dueDate, setDueDate] = useState(inDays(10));
  const [message, setMessage] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(inDays(14));

  const draft = useMemo(() => {
    if (!source) return null;
    const tier = source.plan ?? 'growth';
    const planDefaults = planContractDefaultsStore.get(tier);
    const termMonths = source.termMonths ?? planDefaults.termMonths;
    const priceTerms = source.priceTerms ?? planDefaults.priceTerms;
    const start = source.termEndsOn ?? inDays(14);
    const value =
      source.contractValue != null ? upliftedValue(source.contractValue, priceTerms) : undefined;
    return {
      tier,
      termMonths,
      priceTerms,
      start,
      termEndsOn: addMonths(start, termMonths),
      contractValue: value != null ? Math.round(value * 100) / 100 : undefined,
      termsNotes: source.termsNotes ?? planDefaults.termsNotes,
      inheritedTerm: source.termMonths == null,
      inheritedTerms: source.priceTerms == null,
    };
  }, [source]);

  useEffect(() => {
    if (!source || !draft) return;
    setEffectiveDate(draft.start);
    setDueDate(inDays(10));
    setMessage(`Your ${PLANS[draft.tier].label} subscription renews on ${draft.start}. Please review and sign.`);
    setBody(
      renewalDocumentBody({
        tenantName: source.tenantName,
        title: `Renewal Agreement — ${PLANS[draft.tier].label}`,
        previous: source,
        planLabel: PLANS[draft.tier].label,
        cycle: source.cycle,
        seats: source.seats,
        contractValue: draft.contractValue,
        effectiveDate: draft.start,
        termEndsOn: draft.termEndsOn,
        termMonths: draft.termMonths,
        priceTerms: draft.priceTerms,
        termsNotes: draft.termsNotes,
        signatoryName: source.signatories[0]?.name,
        signatoryEmail: source.signatories[0]?.email,
      }),
    );
  }, [source, draft]);

  if (!source || !draft) return null;

  const title = `Renewal Agreement — ${PLANS[draft.tier].label} (${
    source.cycle === 'annual' ? 'annual' : 'monthly'
  })`;

  const baseInput = () => ({
    tenantId: source.tenantId,
    tenantName: source.tenantName,
    title,
    type: 'renewal' as const,
    plan: draft.tier,
    cycle: source.cycle,
    seats: source.seats,
    contractValue: draft.contractValue,
    signatoryName: source.signatories[0]?.name ?? source.tenantName,
    signatoryEmail: source.signatories[0]?.email ?? '',
    countersignerName: 'Rostered.ai',
    countersignerEmail: 'contracts@rostered.ai',
    effectiveDate,
    termEndsOn: addMonths(effectiveDate, draft.termMonths),
    salesRepId: source.salesRepId,
    onboardingManagerId: source.onboardingManagerId,
    accountManagerId: source.accountManagerId,
    dealType: 'renewal' as const,
    renewalOfId: source.id,
    termMonths: draft.termMonths,
    priceTerms: draft.priceTerms,
    termsNotes: body,
    dueDate,
    message: message.trim() || undefined,
  });

  const saveDraft = () => {
    tenantAgreementStore.createDraft(baseInput());
    toast.success('Renewal document saved as a draft for review');
    onClose();
  };

  const sendNow = () => {
    const input = baseInput();
    if (!input.signatoryEmail) {
      toast.error('The expiring agreement has no signatory email.');
      return;
    }
    const doc = tenantAgreementStore.createDraft(input);
    tenantAgreementStore.sendDraft(doc.id, { dueDate, message: input.message });
    toast.success(`Renewal sent to ${input.signatoryEmail}`);
    onClose();
  };

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Renewal document"
      description={`Generated from "${source.title}" — review before sending for signature.`}
      icon={FileText}
      size="lg"
      actions={[
        { label: 'Cancel', variant: 'outlined', onClick: onClose },
        { label: 'Save draft', variant: 'outlined', onClick: saveDraft },
        { label: 'Send for signature', variant: 'primary', onClick: sendNow },
      ]}
    >
      <div className="space-y-5">
        <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1.5 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">{title}</span>
            <Badge variant="secondary">Renewal</Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {draft.termMonths}-month term · {upliftBasisLabels[draft.priceTerms.basis]}
            {draft.priceTerms.basis !== 'none'
              ? ` · ${effectiveUplift(draft.priceTerms).toFixed(1)}% uplift applied`
              : ''}
            {source.contractValue != null && draft.contractValue != null && (
              <>
                {' '}
                · {formatMoney(source.contractValue)} → {formatMoney(draft.contractValue)}{' '}
                {source.cycle === 'annual' ? '/ yr' : '/ mo'}
              </>
            )}
          </div>
          {(draft.inheritedTerm || draft.inheritedTerms) && (
            <div className="text-xs text-muted-foreground">
              Missing terms inherited from the {PLANS[draft.tier].label} plan defaults.
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">New term starts</Label>
            <Input
              type="date"
              value={effectiveDate}
              onChange={e => setEffectiveDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Sign by</Label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Document preview (editable)</Label>
          <Textarea
            rows={20}
            className="font-mono text-xs leading-5"
            value={body}
            onChange={e => setBody(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Message to the client</Label>
          <Textarea rows={3} value={message} onChange={e => setMessage(e.target.value)} />
        </div>
      </div>
    </PrimaryOffCanvas>
  );
}

export default RenewalDocumentPanel;
