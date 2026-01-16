import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
import { RecruitmentDashboard } from '@/components/recruitment/RecruitmentDashboard';
import { recruitmentApi } from '@/lib/api/recruitmentApi';
import { mockStaff } from '@/data/mockStaffData';
import { JobPosting, Applicant, ApplicationStatus } from '@/types/recruitment';
import { toast } from 'sonner';

export default function RecruitmentPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);

  useEffect(() => {
    recruitmentApi.fetchJobs().then(r => r.data && setJobs(r.data));
    recruitmentApi.fetchApplicants().then(r => r.data && setApplicants(r.data));
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <RecruitmentDashboard
            jobs={jobs}
            applicants={applicants}
            staff={mockStaff}
            onCreateJob={() => toast.info('Job creation modal - coming soon')}
            onViewJob={(job) => toast.info(`Viewing: ${job.title}`)}
            onViewApplicant={(app) => toast.info(`Viewing: ${app.firstName} ${app.lastName}`)}
            onMoveApplicant={(id, status) => toast.success(`Moved to ${status}`)}
          />
        </div>
      </main>
    </div>
  );
}
