import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { JobPosting, Applicant, pipelineStages, jobStatusLabels, applicationStatusLabels, ApplicationStatus } from '@/types/recruitment';
import { StaffMember } from '@/types/staff';
import { format, parseISO } from 'date-fns';
import { Briefcase, Users, Calendar, MapPin, DollarSign, Plus, ChevronRight, Star, GripVertical, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface RecruitmentDashboardProps {
  jobs: JobPosting[];
  applicants: Applicant[];
  staff: StaffMember[];
  onCreateJob: () => void;
  onViewJob: (job: JobPosting) => void;
  onViewApplicant: (applicant: Applicant) => void;
  onMoveApplicant: (applicantId: string, newStatus: ApplicationStatus) => void;
}

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  open: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  paused: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  closed: 'bg-muted text-muted-foreground',
  filled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

export function RecruitmentDashboard({
  jobs,
  applicants,
  staff,
  onCreateJob,
  onViewJob,
  onViewApplicant,
  onMoveApplicant,
}: RecruitmentDashboardProps) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('jobs');

  const selectedJob = jobs.find(j => j.id === selectedJobId);
  const jobApplicants = selectedJobId ? applicants.filter(a => a.jobId === selectedJobId) : [];

  const openJobs = jobs.filter(j => j.status === 'open');
  const totalApplicants = applicants.length;
  const interviewsScheduled = applicants.filter(a => a.status === 'interview').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Recruitment & ATS
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage job postings and track applicants through the pipeline
          </p>
        </div>
        <Button onClick={onCreateJob}>
          <Plus className="h-4 w-4 mr-2" />
          Post Job
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <Briefcase className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{openJobs.length}</p>
                <p className="text-sm text-muted-foreground">Open Positions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalApplicants}</p>
                <p className="text-sm text-muted-foreground">Total Applicants</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{interviewsScheduled}</p>
                <p className="text-sm text-muted-foreground">In Interviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Star className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{applicants.filter(a => a.status === 'offer').length}</p>
                <p className="text-sm text-muted-foreground">Offers Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="jobs">Job Postings</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline View</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="mt-4 space-y-4">
          {jobs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No job postings yet</p>
                <Button variant="outline" className="mt-4" onClick={onCreateJob}>
                  Create your first job posting
                </Button>
              </CardContent>
            </Card>
          ) : (
            jobs.map(job => (
              <Card key={job.id} className="hover:shadow-md transition-all cursor-pointer" onClick={() => { setSelectedJobId(job.id); setActiveTab('pipeline'); }}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{job.title}</h3>
                        <Badge className={statusColors[job.status]}>{jobStatusLabels[job.status]}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                        <span>{job.department}</span>
                        {job.salaryMin && <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />${job.salaryMin.toLocaleString()} - ${job.salaryMax?.toLocaleString()}</span>}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{job.applicantCount}</p>
                      <p className="text-xs text-muted-foreground">Applicants</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="pipeline" className="mt-4">
          {!selectedJobId ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Select a job from the Jobs tab to view its pipeline</p>
              </CardContent>
            </Card>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{selectedJob?.title}</h3>
                <Button variant="outline" size="sm" onClick={() => setSelectedJobId(null)}>
                  Back to Jobs
                </Button>
              </div>
              
              <div className="grid grid-cols-5 gap-4 overflow-x-auto pb-4">
                {pipelineStages.map(stage => {
                  const stageApplicants = jobApplicants.filter(a => a.status === stage.id);
                  return (
                    <div key={stage.id} className="min-w-[200px]">
                      <div className={cn('rounded-t-lg px-3 py-2 font-medium text-sm', stage.color)}>
                        {stage.label} ({stageApplicants.length})
                      </div>
                      <div className="bg-muted/50 rounded-b-lg p-2 min-h-[300px] space-y-2">
                        {stageApplicants.map(applicant => (
                          <Card key={applicant.id} className="cursor-pointer hover:shadow-sm" onClick={() => onViewApplicant(applicant)}>
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">{applicant.firstName[0]}{applicant.lastName[0]}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="font-medium text-sm truncate">{applicant.firstName} {applicant.lastName}</p>
                                  <p className="text-xs text-muted-foreground">{applicant.source}</p>
                                </div>
                              </div>
                              {applicant.rating > 0 && (
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={cn('h-3 w-3', i < applicant.rating ? 'fill-amber-400 text-amber-400' : 'text-muted')} />
                                  ))}
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
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default RecruitmentDashboard;
