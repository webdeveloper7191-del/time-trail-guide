import React, { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Mail, Phone, Linkedin, Calendar, UserCheck, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import {
  JobPosting, Applicant, Interview, EmploymentType, InterviewType, ApplicationStatus,
  interviewTypeLabels, applicationStatusLabels, jobStatusLabels,
  WorkplaceOption, PayType, AdType, seekWorkTypes, seekCategories, workplaceOptionLabels, payTypeLabels, adTypeLabels,
} from '@/types/recruitment';
import { StaffMember } from '@/types/staff';
import { recruitmentStore } from '@/lib/recruitmentStore';

const lines = (s: string) => s.split('\n').map(x => x.trim()).filter(Boolean);
const fmtDT = (iso: string) => format(parseISO(iso), 'EEE d MMM yyyy, h:mm a');

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={cn('space-y-1.5', className)}><Label className="text-xs">{label}</Label>{children}</div>;
}

/* ---------------- Job create / edit (fields follow SEEK's job ad form) ---------------- */
function Section({ step, title, hint, children }: { step: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-b pb-5 last:border-0">
      <div><h4 className="text-sm font-semibold">{step}. {title}</h4>{hint && <p className="text-xs text-muted-foreground">{hint}</p>}</div>
      {children}
    </section>
  );
}

export function JobSheet({ open, onOpenChange, job, staff }: {
  open: boolean; onOpenChange: (o: boolean) => void; job?: JobPosting | null; staff: StaffMember[];
}) {
  const blank = {
    title: '', location: '', workplaceOption: 'on_site' as WorkplaceOption, category: '', subCategory: '',
    employmentType: 'full_time' as EmploymentType, payType: 'annual' as PayType, currency: 'AUD', salaryMin: '', salaryMax: '',
    showSalary: true, payDetails: '', jobSummary: '', ksp1: '', ksp2: '', ksp3: '', description: '', videoUrl: '',
    screeningQuestions: '', applicationMethod: 'internal' as 'internal' | 'external', externalApplyUrl: '', contactEmail: '',
    internalReference: '', adType: 'classic' as AdType, closingDate: '', hiringManagerId: '', department: '',
  };
  const [f, setF] = useState(blank);
  useEffect(() => {
    if (!open) return;
    if (!job) { setF(blank); return; }
    const ksp = job.keySellingPoints ?? job.benefits.slice(0, 3);
    setF({
      ...blank, title: job.title, location: job.location, workplaceOption: job.workplaceOption ?? 'on_site',
      category: job.category ?? '', subCategory: job.subCategory ?? '',
      employmentType: (['full_time', 'part_time', 'contract', 'casual'].includes(job.employmentType) ? job.employmentType : 'contract') as EmploymentType,
      payType: job.payType ?? ((job.salaryMax ?? 0) < 500 && job.salaryMax ? 'hourly' : 'annual'), currency: job.currency ?? 'AUD',
      salaryMin: job.salaryMin?.toString() ?? '', salaryMax: job.salaryMax?.toString() ?? '', showSalary: job.showSalary ?? true,
      payDetails: job.payDetails ?? '', jobSummary: job.jobSummary ?? '', ksp1: ksp[0] ?? '', ksp2: ksp[1] ?? '', ksp3: ksp[2] ?? '',
      description: job.description, videoUrl: job.videoUrl ?? '', screeningQuestions: (job.screeningQuestions ?? []).join('\n'),
      applicationMethod: job.applicationMethod ?? 'internal', externalApplyUrl: job.externalApplyUrl ?? '', contactEmail: job.contactEmail ?? '',
      internalReference: job.internalReference ?? '', adType: job.adType ?? 'classic', closingDate: job.closingDate ?? '',
      hiringManagerId: job.hiringManagerId, department: job.department,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, job]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const sel = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });

  const submit = (status?: JobPosting['status']) => {
    const missing = [!f.title.trim() && 'job title', !f.location.trim() && 'location', !f.category && 'category',
      !f.salaryMin && 'pay range from', !f.salaryMax && 'pay range to', !f.description.trim() && 'job description'].filter(Boolean);
    if (missing.length) { toast.error(`Required: ${missing.join(', ')}`); return; }
    const min = Number(f.salaryMin), max = Number(f.salaryMax);
    if (min > max) { toast.error('Pay range "from" cannot be higher than "to"'); return; }
    if (f.applicationMethod === 'external' && !/^https?:\/\//.test(f.externalApplyUrl)) { toast.error('Enter a valid application website (https://…)'); return; }
    const ksp = [f.ksp1, f.ksp2, f.ksp3].map(s => s.trim()).filter(Boolean);
    recruitmentStore.saveJob({
      ...(job ?? {}), title: f.title.trim(), location: f.location.trim(), workplaceOption: f.workplaceOption, category: f.category,
      subCategory: f.subCategory || undefined, employmentType: f.employmentType, payType: f.payType, currency: f.currency,
      salaryMin: min, salaryMax: max, showSalary: f.showSalary, payDetails: f.payDetails || undefined,
      jobSummary: f.jobSummary || undefined, keySellingPoints: ksp, benefits: ksp, description: f.description,
      videoUrl: f.videoUrl || undefined, screeningQuestions: lines(f.screeningQuestions), applicationMethod: f.applicationMethod,
      externalApplyUrl: f.applicationMethod === 'external' ? f.externalApplyUrl : undefined, contactEmail: f.contactEmail || undefined,
      internalReference: f.internalReference || undefined, adType: f.adType, closingDate: f.closingDate || undefined,
      hiringManagerId: f.hiringManagerId, department: f.department || f.category,
      requirements: job?.requirements ?? [], responsibilities: job?.responsibilities ?? [], status: status ?? job?.status ?? 'draft',
    });
    toast.success(status === 'open' ? 'Job published' : 'Job saved');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader><SheetTitle>{job ? 'Edit job ad' : 'Create a job ad'}</SheetTitle>
          <SheetDescription>Same fields as a SEEK job ad. Save as a draft, or publish to start accepting applicants.</SheetDescription></SheetHeader>
        <div className="space-y-5 py-4">
          <Section step={1} title="Classify your job">
            <Field label="Job title *"><Input value={f.title} onChange={set('title')} placeholder="e.g. Customer Service Officer" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Location *"><Input value={f.location} onChange={set('location')} placeholder="Suburb, city or region" /></Field>
              <Field label="Workplace option">
                <Select value={f.workplaceOption} onValueChange={sel('workplaceOption')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(workplaceOptionLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Category *">
                <Select value={f.category || undefined} onValueChange={sel('category')}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{seekCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Sub-category"><Input value={f.subCategory} onChange={set('subCategory')} placeholder="e.g. Customer Service - Call Centre" /></Field>
            </div>
            <Field label="Work type">
              <div className="flex flex-wrap gap-2">
                {seekWorkTypes.map(w => (
                  <Button key={w.value} type="button" size="sm" variant={f.employmentType === w.value ? 'default' : 'outline'} onClick={() => setF({ ...f, employmentType: w.value })}>{w.label}</Button>
                ))}
              </div>
            </Field>
          </Section>

          <Section step={2} title="Pay" hint="Pay range is required. You can choose whether candidates see it.">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Pay type">
                <Select value={f.payType} onValueChange={sel('payType')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(payTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Currency">
                <Select value={f.currency} onValueChange={sel('currency')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['AUD', 'NZD'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Pay range from *"><Input type="number" min={0} value={f.salaryMin} onChange={set('salaryMin')} /></Field>
              <Field label="Pay range to *"><Input type="number" min={0} value={f.salaryMax} onChange={set('salaryMax')} /></Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={f.showSalary} onCheckedChange={v => setF({ ...f, showSalary: v })} />Show pay on your job ad
            </label>
            <Field label="Pay shown on your job ad (optional)"><Input value={f.payDetails} onChange={set('payDetails')} placeholder="e.g. $70k + super + bonus" maxLength={50} /></Field>
          </Section>

          <Section step={3} title="Write your job ad">
            <Field label={`Job summary (${f.jobSummary.length}/150)`}><Textarea rows={2} maxLength={150} value={f.jobSummary} onChange={set('jobSummary')} placeholder="Shown in search results" /></Field>
            <Field label="Key selling points (up to 3)">
              <div className="space-y-2">
                {(['ksp1', 'ksp2', 'ksp3'] as const).map((k, i) => <Input key={k} maxLength={80} value={f[k]} onChange={set(k)} placeholder={`Selling point ${i + 1}`} />)}
              </div>
            </Field>
            <Field label="Job description *"><Textarea rows={8} value={f.description} onChange={set('description')} placeholder="About the role, responsibilities, skills and experience, benefits…" /></Field>
            <Field label="Video link (YouTube, optional)"><Input value={f.videoUrl} onChange={set('videoUrl')} placeholder="https://www.youtube.com/watch?v=…" /></Field>
          </Section>

          <Section step={4} title="Manage candidate applications">
            <Field label="Screening questions (one per line)"><Textarea rows={3} value={f.screeningQuestions} onChange={set('screeningQuestions')} placeholder={"Do you have the right to work in Australia?\nHow many years' experience do you have?"} /></Field>
            <Field label="How should candidates apply?">
              <Select value={f.applicationMethod} onValueChange={sel('applicationMethod')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="internal">Apply through this system</SelectItem><SelectItem value="external">Apply on my company website</SelectItem></SelectContent>
              </Select>
            </Field>
            {f.applicationMethod === 'external' && <Field label="Application website *"><Input value={f.externalApplyUrl} onChange={set('externalApplyUrl')} placeholder="https://" /></Field>}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Contact email (optional)"><Input type="email" value={f.contactEmail} onChange={set('contactEmail')} /></Field>
              <Field label="Your reference (optional)"><Input value={f.internalReference} onChange={set('internalReference')} /></Field>
            </div>
          </Section>

          <Section step={5} title="Ad type & internal details">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ad type">
                <Select value={f.adType} onValueChange={sel('adType')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(adTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Closing date"><Input type="date" value={f.closingDate} onChange={set('closingDate')} /></Field>
              <Field label="Hiring manager">
                <Select value={f.hiringManagerId || undefined} onValueChange={sel('hiringManagerId')}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Department"><Input value={f.department} onChange={set('department')} /></Field>
            </div>
          </Section>
        </div>
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="secondary" onClick={() => submit()}>Save draft</Button>
          {job?.status !== 'open' && <Button onClick={() => submit('open')}>Save & publish</Button>}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ---------------- Add applicant ---------------- */
export function AddApplicantSheet({ open, onOpenChange, jobs, defaultJobId }: {
  open: boolean; onOpenChange: (o: boolean) => void; jobs: JobPosting[]; defaultJobId?: string | null;
}) {
  const blank = { jobId: '', firstName: '', lastName: '', email: '', phone: '', source: 'Website', linkedInUrl: '', resumeUrl: '', coverLetter: '' };
  const [f, setF] = useState(blank);
  useEffect(() => { if (open) setF({ ...blank, jobId: defaultJobId ?? '' }); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultJobId]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const openJobs = jobs.filter(j => j.status !== 'closed' && j.status !== 'filled');

  const submit = () => {
    if (!f.jobId || !f.firstName.trim() || !f.lastName.trim() || !f.email.trim()) { toast.error('Job, name and email are required'); return; }
    if (!/^\S+@\S+\.\S+$/.test(f.email)) { toast.error('Enter a valid email'); return; }
    recruitmentStore.addApplicant({ ...f, tags: [], linkedInUrl: f.linkedInUrl || undefined, resumeUrl: f.resumeUrl || undefined, coverLetter: f.coverLetter || undefined });
    toast.success('Applicant added');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
        <SheetHeader><SheetTitle>Add applicant</SheetTitle><SheetDescription>Record a candidate who applied outside the system.</SheetDescription></SheetHeader>
        <div className="space-y-4 py-4">
          <Field label="Job *">
            <Select value={f.jobId || undefined} onValueChange={v => setF({ ...f, jobId: v })}>
              <SelectTrigger><SelectValue placeholder="Select job" /></SelectTrigger>
              <SelectContent>{openJobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title} — {j.location}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name *"><Input value={f.firstName} onChange={set('firstName')} /></Field>
            <Field label="Last name *"><Input value={f.lastName} onChange={set('lastName')} /></Field>
            <Field label="Email *"><Input type="email" value={f.email} onChange={set('email')} /></Field>
            <Field label="Phone"><Input value={f.phone} onChange={set('phone')} /></Field>
          </div>
          <Field label="Source">
            <Select value={f.source} onValueChange={v => setF({ ...f, source: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{['Website', 'LinkedIn', 'Indeed', 'Seek', 'Referral', 'Agency', 'Walk-in', 'Other'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="LinkedIn URL"><Input value={f.linkedInUrl} onChange={set('linkedInUrl')} /></Field>
          <Field label="Resume link"><Input value={f.resumeUrl} onChange={set('resumeUrl')} /></Field>
          <Field label="Cover letter"><Textarea rows={4} value={f.coverLetter} onChange={set('coverLetter')} /></Field>
        </div>
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Add applicant</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ---------------- Applicant detail ---------------- */
export function ApplicantDetailSheet({ applicant, job, interviews, staff, onOpenChange, onHire }: {
  applicant: Applicant | null; job?: JobPosting; interviews: Interview[]; staff: StaffMember[];
  onOpenChange: (o: boolean) => void; onHire: (a: Applicant) => void;
}) {
  const [note, setNote] = useState('');
  const [tag, setTag] = useState('');
  const [iv, setIv] = useState({ type: 'video' as InterviewType, date: '', time: '10:00', duration: '45', interviewer: '', location: '', meetingLink: '' });
  const [feedback, setFeedback] = useState<Record<string, { text: string; rating: number }>>({});
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  useEffect(() => { setNote(''); setShowReject(false); setRejectReason(''); }, [applicant?.id]);

  if (!applicant) return null;
  const a = applicant;
  const mine = interviews.filter(i => i.applicantId === a.id).sort((x, y) => x.scheduledAt.localeCompare(y.scheduledAt));
  const staffName = (id: string) => (() => { const s = staff.find(x => x.id === id); return s ? `${s.firstName} ${s.lastName}` : id; })();
  const closed = a.status === 'hired' || a.status === 'rejected' || a.status === 'withdrawn';

  const schedule = () => {
    if (!iv.date || !iv.time || !iv.interviewer) { toast.error('Date, time and interviewer are required'); return; }
    const when = new Date(`${iv.date}T${iv.time}`);
    if (when < new Date()) { toast.error('Interview must be in the future'); return; }
    recruitmentStore.scheduleInterview({ applicantId: a.id, jobId: a.jobId, type: iv.type, scheduledAt: when.toISOString(),
      duration: Number(iv.duration) || 30, interviewers: [iv.interviewer], location: iv.location || undefined, meetingLink: iv.meetingLink || undefined });
    toast.success('Interview scheduled');
    setIv({ ...iv, date: '' });
  };

  return (
    <Sheet open={!!applicant} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{a.firstName} {a.lastName}</SheetTitle>
          <SheetDescription>{job?.title ?? 'Unknown job'} · applied {format(parseISO(a.appliedAt), 'd MMM yyyy')} via {a.source}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">{applicationStatusLabels[a.status]}</Badge>
            <div className="flex" aria-label="Rating">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} aria-label={`Rate ${n}`} onClick={() => recruitmentStore.updateApplicant(a.id, { rating: n })}>
                  <Star className={cn('h-4 w-4', n <= a.rating ? 'fill-warning text-warning' : 'text-muted-foreground/40')} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1 text-sm">
            <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><a className="hover:underline" href={`mailto:${a.email}`}>{a.email}</a></p>
            {a.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{a.phone}</p>}
            {a.linkedInUrl && <p className="flex items-center gap-2"><Linkedin className="h-4 w-4 text-muted-foreground" /><a className="hover:underline" href={a.linkedInUrl} target="_blank" rel="noreferrer">LinkedIn profile</a></p>}
            {a.resumeUrl && <p><a className="text-primary hover:underline" href={a.resumeUrl} target="_blank" rel="noreferrer">View resume</a></p>}
          </div>

          {/* Stage */}
          <section className="space-y-2">
            <h4 className="text-sm font-semibold">Stage</h4>
            <div className="flex flex-wrap gap-2">
              <Select value={a.status} onValueChange={v => { recruitmentStore.moveApplicant(a.id, v as ApplicationStatus, `Moved to ${applicationStatusLabels[v as ApplicationStatus]}`); }}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>{(['new', 'screening', 'interview', 'offer'] as ApplicationStatus[]).map(s => <SelectItem key={s} value={s}>{applicationStatusLabels[s]}</SelectItem>)}</SelectContent>
              </Select>
              {a.status === 'offer' && <Button size="sm" onClick={() => onHire(a)}><UserCheck className="h-4 w-4 mr-1" />Hire & start onboarding</Button>}
              {!closed && <Button size="sm" variant="outline" onClick={() => setShowReject(s => !s)}><XCircle className="h-4 w-4 mr-1" />Reject</Button>}
              {!closed && <Button size="sm" variant="ghost" onClick={() => { recruitmentStore.moveApplicant(a.id, 'withdrawn', 'Candidate withdrew'); toast('Marked as withdrawn'); }}>Withdrawn</Button>}
            </div>
            {showReject && (
              <div className="flex gap-2">
                <Input placeholder="Reason (required, kept in notes)" value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
                <Button size="sm" variant="destructive" onClick={() => {
                  if (!rejectReason.trim()) { toast.error('Enter a reason'); return; }
                  recruitmentStore.moveApplicant(a.id, 'rejected', `Rejected: ${rejectReason.trim()}`); toast('Applicant rejected'); setShowReject(false);
                }}>Confirm</Button>
              </div>
            )}
          </section>

          {/* Tags */}
          <section className="space-y-2">
            <h4 className="text-sm font-semibold">Tags</h4>
            <div className="flex flex-wrap gap-1.5">
              {a.tags.map(t => (
                <Badge key={t} variant="outline" className="cursor-pointer" onClick={() => recruitmentStore.updateApplicant(a.id, { tags: a.tags.filter(x => x !== t) })}>{t} ×</Badge>
              ))}
              <Input className="h-7 w-32 text-xs" placeholder="Add tag" value={tag} onChange={e => setTag(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && tag.trim()) { recruitmentStore.updateApplicant(a.id, { tags: [...new Set([...a.tags, tag.trim()])] }); setTag(''); } }} />
            </div>
          </section>

          {a.coverLetter && <section className="space-y-1"><h4 className="text-sm font-semibold">Cover letter</h4><p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.coverLetter}</p></section>}

          {/* Interviews */}
          <section className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2"><Calendar className="h-4 w-4" />Interviews</h4>
            {mine.length === 0 && <p className="text-sm text-muted-foreground">None scheduled.</p>}
            {mine.map(i => (
              <div key={i.id} className="rounded-lg border p-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{interviewTypeLabels[i.type]} · {fmtDT(i.scheduledAt)}</span>
                  <Badge variant="secondary" className="capitalize">{i.status.replace('_', ' ')}</Badge>
                </div>
                <p className="text-muted-foreground">{i.duration} min with {i.interviewers.map(staffName).join(', ')}{i.location ? ` · ${i.location}` : ''}</p>
                {i.meetingLink && <a className="text-primary hover:underline" href={i.meetingLink} target="_blank" rel="noreferrer">Join link</a>}
                {i.feedback && <p className="italic">“{i.feedback}” {i.rating ? `(${i.rating}/5)` : ''}</p>}
                {i.status === 'scheduled' && (
                  <div className="space-y-2">
                    <Textarea rows={2} placeholder="Feedback" value={feedback[i.id]?.text ?? ''} onChange={e => setFeedback({ ...feedback, [i.id]: { text: e.target.value, rating: feedback[i.id]?.rating ?? 0 } })} />
                    <div className="flex flex-wrap items-center gap-2">
                      <Select value={String(feedback[i.id]?.rating || '')} onValueChange={v => setFeedback({ ...feedback, [i.id]: { text: feedback[i.id]?.text ?? '', rating: Number(v) } })}>
                        <SelectTrigger className="h-8 w-24"><SelectValue placeholder="Score" /></SelectTrigger>
                        <SelectContent>{[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n}/5</SelectItem>)}</SelectContent>
                      </Select>
                      <Button size="sm" onClick={() => {
                        if (!feedback[i.id]?.text?.trim()) { toast.error('Add feedback to complete the interview'); return; }
                        recruitmentStore.updateInterview(i.id, { status: 'completed', feedback: feedback[i.id].text, rating: feedback[i.id].rating || undefined });
                        toast.success('Interview completed');
                      }}>Complete</Button>
                      <Button size="sm" variant="outline" onClick={() => recruitmentStore.updateInterview(i.id, { status: 'no_show' })}>No-show</Button>
                      <Button size="sm" variant="ghost" onClick={() => recruitmentStore.updateInterview(i.id, { status: 'cancelled' })}>Cancel</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {!closed && (
              <div className="rounded-lg border border-dashed p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Schedule interview</p>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={iv.type} onValueChange={v => setIv({ ...iv, type: v as InterviewType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(interviewTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={iv.interviewer || undefined} onValueChange={v => setIv({ ...iv, interviewer: v })}>
                    <SelectTrigger><SelectValue placeholder="Interviewer" /></SelectTrigger>
                    <SelectContent>{staff.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="date" aria-label="Interview date" value={iv.date} onChange={e => setIv({ ...iv, date: e.target.value })} />
                  <Input type="time" aria-label="Interview time" step={900} value={iv.time} onChange={e => setIv({ ...iv, time: e.target.value })} />
                  <Input type="number" aria-label="Duration minutes" placeholder="Minutes" value={iv.duration} onChange={e => setIv({ ...iv, duration: e.target.value })} />
                  {iv.type === 'video' || iv.type === 'phone'
                    ? <Input placeholder="Meeting link / number" value={iv.meetingLink} onChange={e => setIv({ ...iv, meetingLink: e.target.value })} />
                    : <Input placeholder="Location" value={iv.location} onChange={e => setIv({ ...iv, location: e.target.value })} />}
                </div>
                <Button size="sm" onClick={schedule}>Schedule</Button>
              </div>
            )}
          </section>

          {/* Notes */}
          <section className="space-y-2">
            <h4 className="text-sm font-semibold">Notes & history</h4>
            {[...a.notes].reverse().map(n => (
              <div key={n.id} className="rounded-md bg-muted/50 p-2 text-sm">
                <p>{n.content}</p>
                <p className="text-xs text-muted-foreground mt-1">{staffName(n.createdBy)} · {fmtDT(n.createdAt)}</p>
              </div>
            ))}
            <div className="flex gap-2">
              <Input placeholder="Add a note" value={note} onChange={e => setNote(e.target.value)} />
              <Button size="sm" onClick={() => { if (note.trim()) { recruitmentStore.addNote(a.id, note.trim()); setNote(''); } }}>Add</Button>
            </div>
          </section>
          {job && <p className="text-xs text-muted-foreground">Job status: {jobStatusLabels[job.status]}</p>}
        </div>
      </SheetContent>
    </Sheet>
  );
}
