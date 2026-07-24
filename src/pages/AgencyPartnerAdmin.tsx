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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Building2, Mail, RotateCcw, Ban, PlayCircle, CheckCircle2, XCircle, MessageSquarePlus, Send } from 'lucide-react';

const CURRENT_USER = 'admin@rostered.ai';

function useStore() {
  return useSyncExternalStore(
    (cb) => AgencyPartnerStore.subscribe(cb),
    () => ({ invites: AgencyPartnerStore.getInvites(), applications: AgencyPartnerStore.getApplications() }),
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
            <ApplicationsTable rows={pending} onOpen={setReviewId} />
          </TabsContent>
          <TabsContent value="invites" className="mt-4">
            <InvitesTable invites={invites} />
          </TabsContent>
          <TabsContent value="approved" className="mt-4">
            <ApplicationsTable rows={approved} onOpen={setReviewId} />
          </TabsContent>
          <TabsContent value="rejected" className="mt-4">
            <ApplicationsTable rows={rejected} onOpen={setReviewId} />
          </TabsContent>
        </Tabs>
      </main>

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
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

function ApplicationsTable({ rows, onOpen }: { rows: AgencyPartnerApplication[]; onOpen: (id: string) => void }) {
  if (rows.length === 0) {
    return <Card className="p-8 text-center text-sm text-muted-foreground">No applications in this bucket.</Card>;
  }
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agency</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Categories</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((a) => (
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
  );
}

function InvitesTable({ invites }: { invites: AgencyPartnerInvite[] }) {
  if (invites.length === 0) {
    return <Card className="p-8 text-center text-sm text-muted-foreground">No invites yet.</Card>;
  }
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agency</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Sent</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invites.map(i => {
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
  );
}

function InviteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [agencyName, setAgencyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(14);

  const canSubmit = agencyName.trim() && contactName.trim() && /.+@.+\..+/.test(contactEmail);

  const submit = () => {
    if (!canSubmit) return;
    AgencyPartnerStore.createInvite({
      agencyName: agencyName.trim(),
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim(),
      serviceCategoryIds: categories,
      message: message.trim() || undefined,
      createdBy: CURRENT_USER,
      expiresInDays,
    });
    toast.success(`Invite sent to ${contactEmail}`);
    setAgencyName(''); setContactName(''); setContactEmail(''); setCategories([]); setMessage(''); setExpiresInDays(14);
    onOpenChange(false);
  };

  const toggleCat = (id: string) =>
    setCategories(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite agency partner</DialogTitle>
          <DialogDescription>
            Send a secure application link. The agency completes intake before onboarding begins.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
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
            <Label>Service categories</Label>
            <div className="flex flex-wrap gap-2">
              {mockServiceCategories.map(c => {
                const on = categories.includes(c.id);
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => toggleCat(c.id)}
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
          <div className="grid gap-1.5">
            <Label>Link expires in (days)</Label>
            <Input type="number" min={1} max={60} value={expiresInDays} onChange={e => setExpiresInDays(parseInt(e.target.value || '14', 10))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!canSubmit}>
            <Mail className="h-4 w-4 mr-2" /> Send invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
