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
import { FileSignature, MoreVertical, Search, Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/billingStore';
import { Tenant, useTenants } from '@/lib/tenantStore';
import {
  TenantAgreement,
  TenantAgreementStatus,
  isOutstanding,
  tenantAgreementStatusLabels,
  tenantAgreementStore,
  tenantAgreementTypeLabels,
  useTenantAgreements,
} from '@/lib/tenantAgreementStore';
import { TenantAgreementPanel } from './TenantAgreementPanel';

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
export function TenantAgreementsPanel() {
  const agreements = useTenantAgreements();
  const tenants = useTenants();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'outstanding' | 'complete'>('all');
  const [issueFor, setIssueFor] = useState<Tenant | null>(null);
  const [newFor, setNewFor] = useState('');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return agreements.filter(a => {
      if (status === 'outstanding' && !isOutstanding(a)) return false;
      if (status === 'complete' && isOutstanding(a)) return false;
      if (!q) return true;
      return [a.tenantName, a.title, tenantAgreementTypeLabels[a.type]]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [agreements, query, status]);

  const outstanding = agreements.filter(isOutstanding).length;

  const openFor = (tenantId: string) => {
    const t = tenants.find(x => x.id === tenantId);
    if (t) setIssueFor(t);
  };

  return (
    <div className="space-y-4">
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
              <SelectItem value="complete">Signed / closed</SelectItem>
            </SelectContent>
          </Select>
          {outstanding > 0 && (
            <Badge variant="secondary" className="h-9 px-3 rounded-md">
              {outstanding} awaiting signature
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
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
              <th className="text-left font-medium px-3 py-2.5">Terms</th>
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
                      <div className="text-xs text-muted-foreground">
                        {tenantAgreementTypeLabels[a.type]}
                        {a.fileName ? ` · ${a.fileName}` : ''}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-muted-foreground">
                  {a.seats ? `${a.seats} seats` : '–'}
                  {a.contractValue != null && (
                    <div className="text-xs">
                      {formatMoney(a.contractValue)} {a.cycle === 'annual' ? '/ yr' : '/ mo'}
                    </div>
                  )}
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-popover">
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
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                  No agreements match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TenantAgreementPanel
        tenant={issueFor}
        open={!!issueFor}
        onClose={() => setIssueFor(null)}
      />
    </div>
  );
}
