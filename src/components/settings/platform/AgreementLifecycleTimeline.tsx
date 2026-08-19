import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Check, Eye, FileText, Mail, Send, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AgreementEventKind,
  TenantAgreement,
  agreementTimeline,
  dealTypeLabels,
  renewalSummary,
} from '@/lib/tenantAgreementStore';

const ICONS: Record<AgreementEventKind, typeof Mail> = {
  generated: FileText,
  sent: Send,
  opened: Eye,
  reminder: Mail,
  signed: Check,
  declined: X,
  overdue: AlertTriangle,
};

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
    : 'Pending';

interface Props {
  agreement: TenantAgreement;
  /** The agreement this one renews, when available — shows the lineage. */
  previous?: TenantAgreement;
}

/**
 * New vs Renewal lifecycle timeline: generated, sent, opened, reminders,
 * signed and overdue events for the document.
 */
export function AgreementLifecycleTimeline({ agreement, previous }: Props) {
  const events = agreementTimeline(agreement);
  const isRenewal = agreement.dealType === 'renewal';

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight">
          {isRenewal ? 'Renewal timeline' : 'Document timeline'}
        </h3>
        <Badge variant={isRenewal ? 'secondary' : 'outline'} className="text-[10px]">
          {dealTypeLabels[agreement.dealType ?? 'new']}
        </Badge>
      </div>

      {isRenewal && (
        <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {previous ? (
            <>
              Renews <span className="text-foreground">{previous.title}</span>
              {previous.termEndsOn ? ` · previous term ends ${previous.termEndsOn}` : ''} ·{' '}
              {renewalSummary(previous)}
            </>
          ) : (
            <>Renewal of an earlier term{agreement.renewalOfId ? ` (${agreement.renewalOfId})` : ''}.</>
          )}
        </div>
      )}

      <ol className="relative space-y-3 pl-1">
        {events.map((e, i) => {
          const Icon = e.done ? ICONS[e.kind] : Clock;
          const danger = e.kind === 'overdue' || e.kind === 'declined';
          return (
            <li key={`${e.kind}-${i}`} className="flex items-start gap-3">
              <span
                className={cn(
                  'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border',
                  danger
                    ? 'bg-destructive/10 border-destructive/30 text-destructive'
                    : e.done
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'bg-muted border-border text-muted-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="text-sm min-w-0">
                <div className={cn(!e.done && 'text-muted-foreground', danger && 'text-destructive')}>
                  {e.label}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {dt(e.at)}
                  {e.detail ? ` · ${e.detail}` : ''}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default AgreementLifecycleTimeline;
