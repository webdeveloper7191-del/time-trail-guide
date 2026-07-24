import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
import {
  AgencyPartnerStore,
  AgencyPartnerApplication,
  AgencyPartnerInvite,
  ApplicationStatus,
  applicationStatusLabels,
  inviteStatusLabels,
} from '@/lib/agencyPartnerApplicationStore';
import { mockServiceCategories } from '@/data/mockAgencyData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Building2, Mail, RotateCcw, Ban, PlayCircle, CheckCircle2, XCircle, MessageSquarePlus, Send, Search, ArrowUp, ArrowDown, ArrowUpDown, X, Rocket, MapPin, Sparkles } from 'lucide-react';
import AgencyOnboardingWizard from '@/components/agency/AgencyOnboardingWizard';
import { mockLocations } from '@/data/mockLocationData';

const CURRENT_USER = 'admin@rostered.ai';

let __snap: { invites: ReturnType<typeof AgencyPartnerStore.getInvites>; applications: ReturnType<typeof AgencyPartnerStore.getApplications> } | null = null;
function refreshSnap() {
  __snap = { invites: AgencyPartnerStore.getInvites(), applications: AgencyPartnerStore.getApplications() };
}
refreshSnap();

function useStore() {
  return useSyncExternalStore(
    (cb) => AgencyPartnerStore.subscribe(() => { refreshSnap(); cb(); }),
    () => __snap!,
  );
}

const statusVariant: Record<ApplicationStatus, string> = {
  invited: 'bg-muted text-foreground',
  submitted: 'bg-blue-100 text-blue-800',
  in_review: 'bg-amber-100 text-amber-800',
  changes_requested: 'bg-orange-100 text-orange-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
};

export default function AgencyPartnerAdmin() {
  const { invites, applications } = useStore();
  const [tab, setTab] = useState('pending');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [reviewId, setReviewId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Agency Partners – Admin';
  }, []);

  const pending = applications.filter(a => ['submitted', 'in_review', 'changes_requested'].includes(a.status));
  const approved = applications.filter(a => a.status === 'approved');
  const rejected = applications.filter(a => a.status === 'rejected');

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-8 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight" style={{ letterSpacing: '-0.025em' }}>
              Agency Partners
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Invite, review, and approve staffing agencies before they begin onboarding.
            </p>
          </div>
          <Button onClick={() => setInviteOpen(true)}>
            <Send className="h-4 w-4 mr-2" /> Invite agency
          </Button>
        </header>

        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Open invites" value={invites.filter(i => ['sent', 'opened'].includes(i.status)).length} />
          <StatCard label="Awaiting review" value={pending.length} />
          <StatCard label="Approved" value={approved.length} />
          <StatCard label="Rejected" value={rejected.length} />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="pending">Pending review ({pending.length})</TabsTrigger>
            <TabsTrigger value="invites">Invites ({invites.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <ApplicationsTable rows={pending} onOpen={setReviewId} showFilters />
          </TabsContent>
          <TabsContent value="invites" className="mt-4">
            <InvitesTable invites={invites} />
          </TabsContent>
          <TabsContent value="approved" className="mt-4">
            <ApplicationsTable
              rows={approved}
              onOpen={setReviewId}
              showFilters
              statusOptions={[{ value: 'approved', label: applicationStatusLabels.approved }]}
            />
          </TabsContent>
          <TabsContent value="rejected" className="mt-4">
            <ApplicationsTable
              rows={rejected}
              onOpen={setReviewId}
              showFilters
              statusOptions={[{ value: 'rejected', label: applicationStatusLabels.rejected }]}
            />
          </TabsContent>
        </Tabs>
      </main>

      <InviteSheet open={inviteOpen} onOpenChange={setInviteOpen} />
      <ReviewSheet
        applicationId={reviewId}
        onOpenChange={(o) => !o && setReviewId(null)}
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </Card>
  );
}

type SortDir = 'asc' | 'desc';
type AppSortKey = 'agencyName' | 'status' | 'updatedAt' | 'submittedAt';
type InviteSortKey = 'agencyName' | 'status' | 'createdAt' | 'expiresAt';

const DATE_RANGES = [
  { value: 'any', label: 'Any time' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
] as const;
type DateRange = typeof DATE_RANGES[number]['value'];

function withinRange(iso: string, range: DateRange): boolean {
  if (range === 'any') return true;
  const days = range === '24h' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
  return Date.now() - new Date(iso).getTime() <= days * 86400_000;
}

function SortHeader<K extends string>({
  label, sortKey, active, dir, onSort, className,
}: { label: string; sortKey: K; active: K; dir: SortDir; onSort: (k: K) => void; className?: string }) {
  const isActive = active === sortKey;
  const Icon = isActive ? (dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {label} <Icon className="h-3 w-3 opacity-70" />
      </button>
    </TableHead>
  );
}

function FilterBar({
  search, onSearch, category, onCategory, statusValue, statusOptions, onStatus, dateRange, onDateRange, onClear, resultCount, totalCount,
}: {
  search: string; onSearch: (v: string) => void;
  category: string; onCategory: (v: string) => void;
  statusValue: string; statusOptions: { value: string; label: string }[]; onStatus: (v: string) => void;
  dateRange: DateRange; onDateRange: (v: DateRange) => void;
  onClear: () => void;
  resultCount: number; totalCount: number;
}) {
  const dirty = search || category !== 'all' || statusValue !== 'all' || dateRange !== 'any';
  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      <div className="relative flex-1 min-w-[220px]">
        <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search agency, contact, email…"
          className="pl-8"
        />
      </div>
      <Select value={category} onValueChange={onCategory}>
        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Industry" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All industries</SelectItem>
          {mockServiceCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={statusValue} onValueChange={onStatus}>
        <SelectTrigger className="w-[170px]"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {statusOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={dateRange} onValueChange={(v) => onDateRange(v as DateRange)}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Updated" /></SelectTrigger>
        <SelectContent>
          {DATE_RANGES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
        </SelectContent>
      </Select>
      {dirty && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="h-3.5 w-3.5 mr-1" /> Clear
        </Button>
      )}
      <div className="ml-auto text-xs text-muted-foreground">
        {resultCount} of {totalCount}
      </div>
    </div>
  );
}

const PENDING_STATUS_OPTIONS = [
  { value: 'submitted', label: applicationStatusLabels.submitted },
  { value: 'in_review', label: applicationStatusLabels.in_review },
  { value: 'changes_requested', label: applicationStatusLabels.changes_requested },
];

function ApplicationsTable({
  rows, onOpen, showFilters = false, statusOptions,
}: {
  rows: AgencyPartnerApplication[];
  onOpen: (id: string) => void;
  showFilters?: boolean;
  statusOptions?: { value: string; label: string }[];
}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [statusValue, setStatusValue] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange>('any');
  const [sortKey, setSortKey] = useState<AppSortKey>('updatedAt');
  const [dir, setDir] = useState<SortDir>('desc');

  const clear = () => { setSearch(''); setCategory('all'); setStatusValue('all'); setDateRange('any'); };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(a => {
      if (q && !`${a.agencyName} ${a.contactName} ${a.contactEmail}`.toLowerCase().includes(q)) return false;
      if (category !== 'all' && !a.serviceCategoryIds.includes(category)) return false;
      if (statusValue !== 'all' && a.status !== statusValue) return false;
      if (!withinRange(a.updatedAt, dateRange)) return false;
      return true;
    });
  }, [rows, search, category, statusValue, dateRange]);

  const sorted = useMemo(() => {
    const mult = dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = (a[sortKey] ?? '') as string;
      const bv = (b[sortKey] ?? '') as string;
      return av.localeCompare(bv) * mult;
    });
  }, [filtered, sortKey, dir]);

  const onSort = (k: AppSortKey) => {
    if (k === sortKey) setDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(k); setDir(k === 'agencyName' ? 'asc' : 'desc'); }
  };

  return (
    <>
      {showFilters && (
        <FilterBar
          search={search} onSearch={setSearch}
          category={category} onCategory={setCategory}
          statusValue={statusValue} statusOptions={statusOptions ?? PENDING_STATUS_OPTIONS} onStatus={setStatusValue}
          dateRange={dateRange} onDateRange={setDateRange}
          onClear={clear}
          resultCount={sorted.length} totalCount={rows.length}
        />
      )}
      {sorted.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          {rows.length === 0 ? 'No applications in this bucket.' : 'No results match your filters.'}
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader label="Agency" sortKey="agencyName" active={sortKey} dir={dir} onSort={onSort} />
                <TableHead>Contact</TableHead>
                <TableHead>Industries</TableHead>
                <SortHeader label="Status" sortKey="status" active={sortKey} dir={dir} onSort={onSort} />
                <SortHeader label="Updated" sortKey="updatedAt" active={sortKey} dir={dir} onSort={onSort} />
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((a) => (
                <TableRow key={a.id} className="cursor-pointer" onClick={() => onOpen(a.id)}>
                  <TableCell>
                    <div className="font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {a.agencyName}
                    </div>
                    {a.abn && <div className="text-xs text-muted-foreground">ABN {a.abn}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{a.contactName}</div>
                    <div className="text-xs text-muted-foreground">{a.contactEmail}</div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {a.serviceCategoryIds.map(id => mockServiceCategories.find(c => c.id === id)?.name).filter(Boolean).join(', ') || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusVariant[a.status]}>{applicationStatusLabels[a.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(a.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onOpen(a.id); }}>
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}

const INVITE_STATUS_OPTIONS = (Object.keys(inviteStatusLabels) as (keyof typeof inviteStatusLabels)[])
  .map(v => ({ value: v, label: inviteStatusLabels[v] }));

function InvitesTable({ invites }: { invites: AgencyPartnerInvite[] }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [statusValue, setStatusValue] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange>('any');
  const [sortKey, setSortKey] = useState<InviteSortKey>('createdAt');
  const [dir, setDir] = useState<SortDir>('desc');

  const clear = () => { setSearch(''); setCategory('all'); setStatusValue('all'); setDateRange('any'); };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invites.filter(i => {
      if (q && !`${i.agencyName} ${i.contactName} ${i.contactEmail}`.toLowerCase().includes(q)) return false;
      if (category !== 'all' && !i.serviceCategoryIds.includes(category)) return false;
      if (statusValue !== 'all' && i.status !== statusValue) return false;
      if (!withinRange(i.createdAt, dateRange)) return false;
      return true;
    });
  }, [invites, search, category, statusValue, dateRange]);

  const sorted = useMemo(() => {
    const mult = dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => (((a[sortKey] ?? '') as string).localeCompare((b[sortKey] ?? '') as string)) * mult);
  }, [filtered, sortKey, dir]);

  const onSort = (k: InviteSortKey) => {
    if (k === sortKey) setDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(k); setDir(k === 'agencyName' ? 'asc' : 'desc'); }
  };

  return (
    <>
      <FilterBar
        search={search} onSearch={setSearch}
        category={category} onCategory={setCategory}
        statusValue={statusValue} statusOptions={INVITE_STATUS_OPTIONS} onStatus={setStatusValue}
        dateRange={dateRange} onDateRange={setDateRange}
        onClear={clear}
        resultCount={sorted.length} totalCount={invites.length}
      />
      {sorted.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          {invites.length === 0 ? 'No invites yet.' : 'No results match your filters.'}
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader label="Agency" sortKey="agencyName" active={sortKey} dir={dir} onSort={onSort} />
                <TableHead>Contact</TableHead>
                <SortHeader label="Sent" sortKey="createdAt" active={sortKey} dir={dir} onSort={onSort} />
                <SortHeader label="Expires" sortKey="expiresAt" active={sortKey} dir={dir} onSort={onSort} />
                <SortHeader label="Status" sortKey="status" active={sortKey} dir={dir} onSort={onSort} />
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map(i => {
                const isOpen = i.status === 'sent' || i.status === 'opened';
                return (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.agencyName}</TableCell>
                    <TableCell>
                      <div className="text-sm">{i.contactName}</div>
                      <div className="text-xs text-muted-foreground">{i.contactEmail}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(i.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(i.expiresAt).toLocaleDateString()}</TableCell>
                    <TableCell><Badge variant="secondary">{inviteStatusLabels[i.status]}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {isOpen && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => { AgencyPartnerStore.resendInvite(i.id); toast.success('Invite resent'); }}>
                              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Resend
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => {
                              const app = AgencyPartnerStore.simulateAcceptance(i.id);
                              if (app) toast.success(`${i.agencyName} accepted — application ready for review`);
                            }}>
                              <PlayCircle className="h-3.5 w-3.5 mr-1" /> Simulate accept
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { AgencyPartnerStore.revokeInvite(i.id); toast.success('Invite revoked'); }}>
                              <Ban className="h-3.5 w-3.5 mr-1" /> Revoke
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}


function InviteSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [agencyName, setAgencyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [industries, setIndustries] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(14);

  const canSubmit = agencyName.trim() && contactName.trim() && /.+@.+\..+/.test(contactEmail);

  const submit = () => {
    if (!canSubmit) return;
    AgencyPartnerStore.createInvite({
      agencyName: agencyName.trim(),
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim(),
      serviceCategoryIds: industries,
      message: message.trim() || undefined,
      createdBy: CURRENT_USER,
      expiresInDays,
    });
    toast.success(`Invite sent to ${contactEmail}`);
    setAgencyName(''); setContactName(''); setContactEmail(''); setIndustries([]); setMessage(''); setExpiresInDays(14);
    onOpenChange(false);
  };

  const toggleInd = (id: string) =>
    setIndustries(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Send className="h-4 w-4" /> Invite agency partner
          </SheetTitle>
          <SheetDescription>
            Send a secure application link. The agency completes intake before onboarding begins.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid gap-1.5">
            <Label>Agency name</Label>
            <Input value={agencyName} onChange={e => setAgencyName(e.target.value)} placeholder="e.g. Bluewater Nursing Group" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Contact name</Label>
              <Input value={contactName} onChange={e => setContactName(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Contact email</Label>
              <Input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Industries</Label>
            <p className="text-xs text-muted-foreground">Sectors the agency will supply talent for.</p>
            <div className="flex flex-wrap gap-2">
              {mockServiceCategories.map(c => {
                const on = industries.includes(c.id);
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => toggleInd(c.id)}
                    className={`px-2.5 py-1 rounded-full border text-xs transition ${on ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-muted'}`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Personal message (optional)</Label>
            <Textarea rows={3} value={message} onChange={e => setMessage(e.target.value)} placeholder="Add context for the agency contact." />
          </div>
          <div className="grid gap-1.5 max-w-[240px]">
            <Label>Link expires in (days)</Label>
            <Input type="number" min={1} max={60} value={expiresInDays} onChange={e => setExpiresInDays(parseInt(e.target.value || '14', 10))} />
          </div>
        </div>
        <SheetFooter className="px-6 py-4 border-t bg-muted/30">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!canSubmit}>
            <Mail className="h-4 w-4 mr-2" /> Send invite
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function ReviewSheet({ applicationId, onOpenChange }: { applicationId: string | null; onOpenChange: (o: boolean) => void }) {
  const { applications } = useStore();
  const app = useMemo(() => applications.find(a => a.id === applicationId) ?? null, [applications, applicationId]);
  const [note, setNote] = useState('');
  const [changeSummary, setChangeSummary] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [approveMessage, setApproveMessage] = useState('');

  useEffect(() => { setNote(''); setChangeSummary(''); setRejectReason(''); setApproveMessage(''); }, [applicationId]);

  if (!app) return null;

  const decided = app.status === 'approved' || app.status === 'rejected';

  return (
    <Sheet open={!!applicationId} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" /> {app.agencyName}
          </SheetTitle>
          <SheetDescription>
            <Badge className={statusVariant[app.status]}>{applicationStatusLabels[app.status]}</Badge>
            <span className="ml-2 text-xs text-muted-foreground">
              Submitted {new Date(app.submittedAt).toLocaleDateString()}
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <section>
            <h3 className="text-sm font-semibold mb-2">Application details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Legal entity" value={app.legalEntityName ?? '—'} />
              <Field label="ABN" value={app.abn ?? '—'} />
              <Field label="Contact" value={`${app.contactName} · ${app.contactEmail}`} />
              <Field label="Phone" value={app.contactPhone ?? '—'} />
              <Field label="Website" value={app.website ?? '—'} />
              <Field label="Headquarters" value={app.headquartersCity ?? '—'} />
              <Field label="Years operating" value={app.yearsInOperation?.toString() ?? '—'} />
              <Field label="Candidate pool" value={app.candidatePoolSize?.toString() ?? '—'} />
              <Field label="Insurance" value={app.insuranceProvider ? `${app.insuranceProvider}${app.insuranceExpiry ? ` (exp ${new Date(app.insuranceExpiry).toLocaleDateString()})` : ''}` : '—'} />
              <Field label="Categories" value={app.serviceCategoryIds.map(id => mockServiceCategories.find(c => c.id === id)?.name).filter(Boolean).join(', ') || '—'} />
            </div>
            {app.references && (
              <div className="mt-3">
                <div className="text-xs text-muted-foreground uppercase">References</div>
                <div className="text-sm mt-1">{app.references}</div>
              </div>
            )}
            {app.notesFromApplicant && (
              <div className="mt-3">
                <div className="text-xs text-muted-foreground uppercase">Notes from applicant</div>
                <div className="text-sm mt-1 whitespace-pre-wrap">{app.notesFromApplicant}</div>
              </div>
            )}
          </section>

          <Separator />

          {!decided && (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold">Review actions</h3>

              {app.status === 'submitted' && (
                <Button variant="secondary" onClick={() => AgencyPartnerStore.moveToReview(app.id, CURRENT_USER)}>
                  Move to in-review
                </Button>
              )}

              <Card className="p-3 space-y-2">
                <Label className="text-xs">Request changes</Label>
                <Textarea rows={2} value={changeSummary} onChange={e => setChangeSummary(e.target.value)} placeholder="What does the agency need to update?" />
                <Button size="sm" variant="outline" disabled={!changeSummary.trim()} onClick={() => {
                  AgencyPartnerStore.requestChanges(app.id, CURRENT_USER, changeSummary.trim());
                  toast.success('Changes requested');
                  setChangeSummary('');
                }}>
                  <MessageSquarePlus className="h-4 w-4 mr-1" /> Send change request
                </Button>
              </Card>

              <Card className="p-3 space-y-2 border-emerald-200 bg-emerald-50/50">
                <Label className="text-xs">Approve</Label>
                <Textarea rows={2} value={approveMessage} onChange={e => setApproveMessage(e.target.value)} placeholder="Optional welcome note. Approval triggers the onboarding wizard." />
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => {
                  AgencyPartnerStore.approve(app.id, CURRENT_USER, approveMessage.trim() || undefined);
                  toast.success(`${app.agencyName} approved — onboarding wizard unlocked`);
                }}>
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Approve partner
                </Button>
              </Card>

              <Card className="p-3 space-y-2 border-rose-200 bg-rose-50/50">
                <Label className="text-xs">Reject</Label>
                <Textarea rows={2} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason (shared with applicant)." />
                <Button size="sm" variant="destructive" disabled={!rejectReason.trim()} onClick={() => {
                  AgencyPartnerStore.reject(app.id, CURRENT_USER, rejectReason.trim());
                  toast.success('Application rejected');
                }}>
                  <XCircle className="h-4 w-4 mr-1" /> Reject application
                </Button>
              </Card>
            </section>
          )}

          {decided && (
            <section className="rounded-md bg-muted p-3 text-sm">
              Decision by <span className="font-medium">{app.decisionBy}</span> on{' '}
              {app.decisionAt ? new Date(app.decisionAt).toLocaleString() : '—'}.
              {app.rejectionReason && <div className="mt-2 text-rose-700">Reason: {app.rejectionReason}</div>}
            </section>
          )}

          <Separator />

          <section>
            <h3 className="text-sm font-semibold mb-2">Activity</h3>
            <ol className="space-y-2">
              {(app.reviewNotes ?? []).slice().reverse().map(n => (
                <li key={n.id} className="text-sm">
                  <div className="text-xs text-muted-foreground">
                    {new Date(n.at).toLocaleString()} · {n.by} · <span className="uppercase">{n.action.replace(/_/g, ' ')}</span>
                  </div>
                  {n.message && <div className="mt-0.5">{n.message}</div>}
                </li>
              ))}
            </ol>

            <div className="mt-3 flex gap-2">
              <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Add internal note…" />
              <Button variant="outline" disabled={!note.trim()} onClick={() => {
                AgencyPartnerStore.addNote(app.id, CURRENT_USER, note.trim());
                setNote('');
              }}>Add</Button>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="text-sm mt-0.5">{value}</div>
    </div>
  );
}
