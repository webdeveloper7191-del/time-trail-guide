import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  JobPosting, Applicant, Interview, jobStatusLabels, stageLabel, terminalStatuses,
  employmentTypeLabels, interviewTypeLabels,
} from '@/types/recruitment';
import { StaffMember } from '@/types/staff';
import { format, parseISO, isAfter } from 'date-fns';
import { Briefcase, Users, Calendar, MapPin, DollarSign, Plus, Star, MoreHorizontal, UserPlus, Search, Settings2, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { recruitmentStore, applicantCountFor, useRecruitment } from '@/lib/recruitmentStore';

interface RecruitmentDashboardProps {
  jobs: JobPosting[];
  applicants: Applicant[];
  interviews: Interview[];
  staff: StaffMember[];
  onCreateJob: () => void;
  onEditJob: (job: JobPosting) => void;
  onAddApplicant: (jobId: string | null) => void;
  onViewApplicant: (applicant: Applicant) => void;
}

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'outline', open: 'default', paused: 'secondary', closed: 'outline', filled: 'secondary',
};

export function RecruitmentDashboard({ jobs, applicants, interviews, staff, onCreateJob, onEditJob, onAddApplicant, onViewApplicant }: RecruitmentDashboardProps) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('jobs');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [dragId, setDragId] = useState<string | null>(null);

  const selectedJob = jobs.find(j => j.id === selectedJobId);
  const jobApplicants = selectedJobId ? applicants.filter(a => a.jobId === selectedJobId) : [];
  const jobTitle = (id: string) => jobs.find(j => j.id === id)?.title ?? '—';
  const staffName = (id: string) => (() => { const s = staff.find(x => x.id === id); return s ? `${s.firstName} ${s.lastName}` : id; })();
  const appName = (id: string) => { const a = applicants.find(x => x.id === id); return a ? `${a.firstName} ${a.lastName}` : '—'; };

  const upcoming = interviews.filter(i => i.status === 'scheduled' && isAfter(parseISO(i.scheduledAt), new Date()))
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const past = interviews.filter(i => !upcoming.includes(i)).sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));

  const filteredApplicants = useMemo(() => applicants.filter(a => {
    const q = search.toLowerCase();
    const matches = !q || `${a.firstName} ${a.lastName} ${a.email} ${a.tags.join(' ')}`.toLowerCase().includes(q);
    const active = !['hired', 'rejected', 'withdrawn'].includes(a.status);
    const st = statusFilter === 'all' || (statusFilter === 'active' ? active : a.status === statusFilter);
    return matches && st;
  }), [applicants, search, statusFilter]);

  const drop = (status: ApplicationStatus) => {
    if (!dragId) return;
    const a = applicants.find(x => x.id === dragId);
    setDragId(null);
    if (!a || a.status === status) return;
    if (status === 'hired') { toast.info('Open the applicant to hire and start onboarding'); onViewApplicant(a); return; }
    recruitmentStore.moveApplicant(a.id, status, `Moved to ${applicationStatusLabels[status]}`);
    toast.success(`${a.firstName} moved to ${applicationStatusLabels[status]}`);
  };

  const stats = [
    { icon: Briefcase, value: jobs.filter(j => j.status === 'open').length, label: 'Open positions' },
    { icon: Users, value: applicants.filter(a => !['hired', 'rejected', 'withdrawn'].includes(a.status)).length, label: 'Active applicants' },
    { icon: Calendar, value: upcoming.length, label: 'Upcoming interviews' },
    { icon: Star, value: applicants.filter(a => a.status === 'offer').length, label: 'Offers pending' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" />Recruitment & ATS</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage job postings and track applicants through the pipeline</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onAddApplicant(selectedJobId)}><UserPlus className="h-4 w-4 mr-2" />Add applicant</Button>
          <Button onClick={onCreateJob}><Plus className="h-4 w-4 mr-2" />Post job</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label}><CardContent className="pt-6"><div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10"><s.icon className="h-6 w-6 text-primary" /></div>
            <div><p className="text-2xl font-bold">{s.value}</p><p className="text-sm text-muted-foreground">{s.label}</p></div>
          </div></CardContent></Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="jobs">Job postings</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="applicants">All applicants</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="mt-4 space-y-3">
          {jobs.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-8 text-center">
              <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No job postings yet</p>
              <Button variant="outline" className="mt-4" onClick={onCreateJob}>Create your first job posting</Button>
            </CardContent></Card>
          ) : jobs.map(job => {
            const count = applicantCountFor(job.id, applicants);
            return (
              <Card key={job.id} className="hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <button className="flex-1 min-w-0 text-left" onClick={() => { setSelectedJobId(job.id); setActiveTab('pipeline'); }}>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{job.title}</h3>
                        <Badge variant={statusVariant[job.status]}>{jobStatusLabels[job.status]}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                        {job.department && <span>{job.department}</span>}
                        <span>{employmentTypeLabels[job.employmentType]}</span>
                        {job.salaryMin != null && <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />{job.salaryMin.toLocaleString()}{job.salaryMax ? ` – ${job.salaryMax.toLocaleString()}` : ''}</span>}
                        {job.closingDate && <span>Closes {format(parseISO(job.closingDate), 'd MMM yyyy')}</span>}
                      </div>
                    </button>
                    <div className="text-center"><p className="text-2xl font-bold">{count}</p><p className="text-xs text-muted-foreground">Applicants</p></div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Actions for ${job.title}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditJob(job)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAddApplicant(job.id)}>Add applicant</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {job.status !== 'open' && <DropdownMenuItem onClick={() => { recruitmentStore.setJobStatus(job.id, 'open'); toast.success('Job published'); }}>Publish</DropdownMenuItem>}
                        {job.status === 'open' && <DropdownMenuItem onClick={() => recruitmentStore.setJobStatus(job.id, 'paused')}>Pause</DropdownMenuItem>}
                        {job.status !== 'filled' && job.status !== 'draft' && <DropdownMenuItem onClick={() => recruitmentStore.setJobStatus(job.id, 'filled')}>Mark filled</DropdownMenuItem>}
                        {job.status !== 'closed' && <DropdownMenuItem onClick={() => recruitmentStore.setJobStatus(job.id, 'closed')}>Close</DropdownMenuItem>}
                        <DropdownMenuItem onClick={() => recruitmentStore.saveJob({ ...job, id: undefined, title: `${job.title} (copy)`, status: 'draft', postedAt: undefined })}>Duplicate</DropdownMenuItem>
                        {count === 0 && <DropdownMenuItem className="text-destructive" onClick={() => { recruitmentStore.deleteJob(job.id); toast('Job deleted'); }}>Delete</DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="pipeline" className="mt-4">
          <div className="flex items-center justify-between mb-4 gap-3">
            <Select value={selectedJobId ?? undefined} onValueChange={setSelectedJobId}>
              <SelectTrigger className="w-80"><SelectValue placeholder="Select a job" /></SelectTrigger>
              <SelectContent>{jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title} — {j.location}</SelectItem>)}</SelectContent>
            </Select>
            {selectedJob && <p className="text-sm text-muted-foreground">Drag cards between stages. Rejected/withdrawn: {jobApplicants.filter(a => a.status === 'rejected' || a.status === 'withdrawn').length}</p>}
          </div>
          {!selectedJobId ? (
            <Card className="border-dashed"><CardContent className="py-8 text-center"><p className="text-muted-foreground">Select a job to view its pipeline</p></CardContent></Card>
          ) : (
            <div className="grid grid-cols-5 gap-4 overflow-x-auto pb-4">
              {pipelineStages.map(stage => {
                const stageApplicants = jobApplicants.filter(a => a.status === stage.id);
                return (
                  <div key={stage.id} className="min-w-[200px]" onDragOver={e => e.preventDefault()} onDrop={() => drop(stage.id)}>
                    <div className="rounded-t-lg px-3 py-2 font-medium text-sm bg-secondary text-secondary-foreground">{stage.label} ({stageApplicants.length})</div>
                    <div className="bg-muted/50 rounded-b-lg p-2 min-h-[300px] space-y-2">
                      {stageApplicants.map(applicant => (
                        <Card key={applicant.id} draggable onDragStart={() => setDragId(applicant.id)}
                          className={cn('cursor-grab hover:shadow-sm', dragId === applicant.id && 'opacity-50')} onClick={() => onViewApplicant(applicant)}>
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{applicant.firstName[0]}{applicant.lastName[0]}</AvatarFallback></Avatar>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{applicant.firstName} {applicant.lastName}</p>
                                <p className="text-xs text-muted-foreground">{applicant.source}</p>
                              </div>
                            </div>
                            {applicant.rating > 0 && (
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn('h-3 w-3', i < applicant.rating ? 'fill-warning text-warning' : 'text-muted-foreground/30')} />)}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="applicants" className="mt-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search name, email or tag" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="all">All</SelectItem>
                {Object.entries(applicationStatusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b"><tr>
                <th className="text-left p-3">Name</th><th className="text-left p-3">Job</th><th className="text-left p-3">Stage</th>
                <th className="text-left p-3">Rating</th><th className="text-left p-3">Source</th><th className="text-left p-3">Applied</th>
              </tr></thead>
              <tbody>
                {filteredApplicants.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No applicants match.</td></tr>}
                {filteredApplicants.map(a => (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/40 cursor-pointer" onClick={() => onViewApplicant(a)}>
                    <td className="p-3 font-medium">{a.firstName} {a.lastName}<div className="text-xs text-muted-foreground">{a.email}</div></td>
                    <td className="p-3">{jobTitle(a.jobId)}</td>
                    <td className="p-3"><Badge variant={a.status === 'rejected' ? 'destructive' : 'secondary'}>{applicationStatusLabels[a.status]}</Badge></td>
                    <td className="p-3">{a.rating ? `${a.rating}/5` : '—'}</td>
                    <td className="p-3">{a.source}</td>
                    <td className="p-3">{format(parseISO(a.appliedAt), 'd MMM yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="interviews" className="mt-4 space-y-6">
          {[{ title: 'Upcoming', list: upcoming }, { title: 'Past & closed', list: past }].map(group => (
            <div key={group.title} className="space-y-2">
              <h3 className="text-sm font-semibold">{group.title} ({group.list.length})</h3>
              {group.list.length === 0 && <p className="text-sm text-muted-foreground">Nothing here.</p>}
              {group.list.map(i => (
                <Card key={i.id} className="cursor-pointer hover:shadow-sm" onClick={() => { const a = applicants.find(x => x.id === i.applicantId); if (a) onViewApplicant(a); }}>
                  <CardContent className="p-3 flex items-center justify-between gap-4 text-sm">
                    <div>
                      <p className="font-medium">{appName(i.applicantId)} · {jobTitle(i.jobId)}</p>
                      <p className="text-muted-foreground">{interviewTypeLabels[i.type]} · {format(parseISO(i.scheduledAt), 'EEE d MMM yyyy, h:mm a')} · {i.duration} min · {i.interviewers.map(staffName).join(', ')}</p>
                    </div>
                    <Badge variant="secondary" className="capitalize">{i.status === 'scheduled' && group.title !== 'Upcoming' ? 'Feedback due' : i.status.replace('_', ' ')}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default RecruitmentDashboard;
