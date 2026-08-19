import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Activity, BellRing, FileSignature, MoreVertical, RefreshCw, Search, Upload, FileText } from 'lucide-react';
import { dueReminders, sendableReminders } from '@/lib/agreementReminderStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/billingStore';
import { Tenant, useTenants } from '@/lib/tenantStore';
import {
  dealTypeLabels,
  isRenewalDue,
  renewalSummary,
  OWNER_ROLE_LABELS,
  OWNER_ROLE_OPTIONS,
  OwnerRole,
  TenantAgreement,
  TenantAgreementStatus,
  isOutstanding,
  isOverdue,
  salesRepById,
  trackingSummary,
  tenantAgreementStatusLabels,
  tenantAgreementStore,
  tenantAgreementTypeLabels,
  useTenantAgreements,
} from '@/lib/tenantAgreementStore';
import { TenantAgreementPanel } from './TenantAgreementPanel';
import { AgreementTrackingPanel } from './AgreementTrackingPanel';
import { RenewalDocumentPanel } from './RenewalDocumentPanel';
import { AgreementWorkQueue } from './AgreementWorkQueue';

const statusStyle: Record<TenantAgreementStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  viewed: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  signed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  uploaded: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  declined: 'bg-destructive/10 text-destructive',
  expired: 'bg-muted text-muted-foreground',
};

const dateLabel = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })
    : '–';

/** Platform-admin view of every subscription agreement issued to tenants. */
export function TenantAgreementsPanel({ query: externalQuery }: { query?: string } = {}) {
  const agreements = useTenantAgreements();
  const tenants = useTenants();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<
    'all' | 'outstanding' | 'overdue' | 'complete' | 'renewals' | 'new' | 'renewal'
  >('all');
  const [renewFrom, setRenewFrom] = useState<TenantAgreement | null>(null);
  const [repRole, setRepRole] = useState<OwnerRole>('salesRepId');
  const [rep, setRep] = useState<string>('all');
  const [trackId, setTrackId] = useState<string | null>(null);
  const [renewalDoc, setRenewalDoc] = useState<TenantAgreement | null>(null);
  const [issueFor, setIssueFor] = useState<Tenant | null>(null);
  const [newFor, setNewFor] = useState('');
  const [queueOpen, setQueueOpen] = useState(false);

  const rows = useMemo(() => {
    const q = (externalQuery?.trim() || query).trim().toLowerCase();
    return agreements.filter(a => {
      if (status === 'outstanding' && !isOutstanding(a)) return false;
      if (status === 'overdue' && !isOverdue(a)) return false;
      if (status === 'complete' && isOutstanding(a)) return false;
      if (status === 'renewals' && !isRenewalDue(a)) return false;
      if (status === 'new' && (a.dealType ?? 'new') !== 'new') return false;
      if (status === 'renewal' && a.dealType !== 'renewal') return false;
      if (rep !== 'all' && (a[repRole] ?? 'unassigned') !== rep) return false;
      if (!q) return true;
      return [
        a.tenantName,
        a.title,
        tenantAgreementTypeLabels[a.type],
        salesRepById(a.salesRepId)?.name ?? '',
        salesRepById(a.onboardingManagerId)?.name ?? '',
        salesRepById(a.accountManagerId)?.name ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [agreements, query, externalQuery, status, rep, repRole]);

  const outstanding = agreements.filter(isOutstanding).length;
  const overdueCount = agreements.filter(isOverdue).length;
  const renewalsDue = agreements.filter(a => isRenewalDue(a)).length;
  const remindersDue = useMemo(
    () => sendableReminders(dueReminders(agreements)).length,
    [agreements],
  );

  const openFor = (tenantId: string) => {
    const t = tenants.find(x => x.id === tenantId);
    if (t) {
      setRenewFrom(null);
      setIssueFor(t);
    }
  };

  const openRenewal = (a: TenantAgreement) => {
    const t = tenants.find(x => x.id === a.tenantId);
    if (!t) {
      toast.error('Organisation not found for this agreement.');
      return;
    }
    setRenewFrom(a);
    setIssueFor(t);
  };

  return (
    <div className="space-y-4">
      <AgreementWorkQueue
        agreements={agreements}
        ownerRole={repRole}
        open={queueOpen}
        onClose={() => setQueueOpen(false)}
        onSelectOwner={(role, ownerId) => {
          setRepRole(role);
          setRep(ownerId);
          setQueueOpen(false);
        }}
      />

      <div className="flex flex-wrap items-center gap-2 justify-between">

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 h-9"
              placeholder="Search organisation or document"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={v => setStatus(v as typeof status)}>
            <SelectTrigger className="h-9 w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All agreements</SelectItem>
              <SelectItem value="outstanding">Awaiting signature</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="complete">Signed / closed</SelectItem>
              <SelectItem value="renewals">Renewals due</SelectItem>
              <SelectItem value="new">New business</SelectItem>
              <SelectItem value="renewal">Renewals</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={repRole}
            onValueChange={v => {
              setRepRole(v as OwnerRole);
              setRep('all');
            }}
          >
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(OWNER_ROLE_LABELS) as OwnerRole[]).map(r => (
                <SelectItem key={r} value={r}>
                  {OWNER_ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={rep} onValueChange={setRep}>
            <SelectTrigger className="h-9 w-[200px]">
              <SelectValue placeholder={OWNER_ROLE_LABELS[repRole]} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {OWNER_ROLE_LABELS[repRole].toLowerCase()}s</SelectItem>
              {OWNER_ROLE_OPTIONS[repRole].map(r => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {renewalsDue > 0 && (
            <Badge
              variant="secondary"
              className="h-9 px-3 rounded-md cursor-pointer"
              onClick={() => setStatus('renewals')}
            >
              {renewalsDue} renewal{renewalsDue > 1 ? 's' : ''} due
            </Badge>
          )}
          {overdueCount > 0 && (
            <Badge variant="destructive" className="h-9 px-3 rounded-md">
              {overdueCount} overdue
            </Badge>
          )}
          {outstanding > 0 && (
            <Badge variant="secondary" className="h-9 px-3 rounded-md">
              {outstanding} awaiting signature
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-9" onClick={() => setQueueOpen(true)}>
            <BellRing className="h-4 w-4 mr-1.5" /> Work queue
            {remindersDue > 0 && (
              <Badge variant="secondary" className="ml-2 text-[10px]">
                {remindersDue}
              </Badge>
            )}
          </Button>
          <Select
            value={newFor}
            onValueChange={v => {
              setNewFor('');
              openFor(v);
            }}
          >
            <SelectTrigger className="h-9 w-[240px]">
              <SelectValue placeholder="Choose an organisation…" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {tenants.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="h-9"
            onClick={() => {
              if (!issueFor && tenants[0]) setIssueFor(tenants[0]);
            }}
          >
            <FileSignature className="h-4 w-4 mr-1.5" /> New agreement
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-3 py-2.5">Organisation</th>
              <th className="text-left font-medium px-3 py-2.5">Document</th>
              <th className="text-left font-medium px-3 py-2.5">Type</th>
              <th className="text-left font-medium px-3 py-2.5">Terms</th>
              <th className="text-left font-medium px-3 py-2.5">Owners</th>
              <th className="text-left font-medium px-3 py-2.5">Status</th>
              <th className="text-left font-medium px-3 py-2.5">Sent / signed</th>
              <th className="text-left font-medium px-3 py-2.5">Starts</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((a: TenantAgreement) => (
              <tr key={a.id} className="hover:bg-muted/40">
                <td className="px-3 py-3 font-medium">{a.tenantName}</td>
                <td className="px-3 py-3">
                  <div className="flex items-start gap-2">
                    {a.source === 'upload' ? (
                      <Upload className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    )}
                    <div>
                      <div>{a.title}</div>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant={a.dealType === 'renewal' ? 'secondary' : 'outline'}
                          className="text-[10px]"
                        >
                          {dealTypeLabels[a.dealType ?? 'new']}
                        </Badge>
                        {isRenewalDue(a) && (
                          <Badge variant="destructive" className="text-[10px]">
                            Renewal due
                          </Badge>
                        )}
                      </div>
                      {a.fileName && (
                        <div className="text-xs text-muted-foreground">{a.fileName}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <Badge variant="outline" className="text-[11px] font-normal">
                    {tenantAgreementTypeLabels[a.type]}
                  </Badge>
                </td>

                <td className="px-3 py-3 text-muted-foreground">
                  {a.seats ? `${a.seats} seats` : '–'}
                  {a.contractValue != null && (
                    <div className="text-xs">
                      {formatMoney(a.contractValue)} {a.cycle === 'annual' ? '/ yr' : '/ mo'}
                    </div>
                  )}
                  {a.termMonths && <div className="text-xs">{a.termMonths}-month term</div>}
                  {a.termEndsOn && (
                    <div className="text-xs">
                      Ends {dateLabel(`${a.termEndsOn}T00:00:00`)} · {renewalSummary(a)}
                    </div>
                  )}
                </td>
                <td className="px-3 py-3 text-muted-foreground text-xs leading-5">
                  <div>Sales: {salesRepById(a.salesRepId)?.name ?? 'Unassigned'}</div>
                  <div>Onboarding: {salesRepById(a.onboardingManagerId)?.name ?? 'Unassigned'}</div>
                  <div>Account: {salesRepById(a.accountManagerId)?.name ?? 'Unassigned'}</div>
                </td>
                <td className="px-3 py-3">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                      statusStyle[a.status],
                    )}
                  >
                    {tenantAgreementStatusLabels[a.status]}
                  </span>
                  <div className="mt-1 text-xs text-muted-foreground">{trackingSummary(a)}</div>
                </td>
                <td className="px-3 py-3 text-muted-foreground">
                  {a.completedAt ? `Signed ${dateLabel(a.completedAt)}` : `Sent ${dateLabel(a.sentAt)}`}
                  {isOutstanding(a) && a.dueDate && (
                    <div className="text-xs">Due {dateLabel(`${a.dueDate}T00:00:00`)}</div>
                  )}
                </td>
                <td className="px-3 py-3 text-muted-foreground">
                  {a.effectiveDate ? dateLabel(`${a.effectiveDate}T00:00:00`) : '–'}
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Track document"
                    onClick={() => setTrackId(a.id)}
                  >
                    <Activity className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-popover">
                      <DropdownMenuItem onClick={() => setTrackId(a.id)}>
                        Track document
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {isOutstanding(a) && (
                        <>
                          <DropdownMenuItem
                            onClick={() => {
                              tenantAgreementStore.resend(a.id);
                              toast.success('Reminder sent');
                            }}
                          >
                            Send reminder
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              tenantAgreementStore.markSigned(a.id, 'Platform admin');
                              toast.success('Marked as signed');
                            }}
                          >
                            Mark as signed
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => tenantAgreementStore.markDeclined(a.id)}>
                            Mark as declined
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem onClick={() => setRenewalDoc(a)}>
                        <FileText className="h-3.5 w-3.5 mr-2" /> Generate renewal document
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openRenewal(a)}>
                        <RefreshCw className="h-3.5 w-3.5 mr-2" /> Send renewal
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openFor(a.tenantId)}>
                        New agreement for this client
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => toast.success(`Downloading ${a.fileName ?? `${a.title}.pdf`}`)}
                      >
                        Download copy
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => tenantAgreementStore.remove(a.id)}
                      >
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-muted-foreground">
                  No agreements match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AgreementTrackingPanel agreementId={trackId} onClose={() => setTrackId(null)} />

      <RenewalDocumentPanel
        source={renewalDoc}
        open={!!renewalDoc}
        onClose={() => setRenewalDoc(null)}
      />

      <TenantAgreementPanel
        tenant={issueFor}
        renewalOf={renewFrom}
        open={!!issueFor}
        onClose={() => {
          setIssueFor(null);
          setRenewFrom(null);
        }}
      />
    </div>
  );
}
