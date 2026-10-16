import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
import { RecruitmentDashboard } from '@/components/recruitment/RecruitmentDashboard';
import { JobSheet, AddApplicantSheet, ApplicantDetailSheet } from '@/components/recruitment/RecruitmentSheets';
import { recruitmentStore, useRecruitment } from '@/lib/recruitmentStore';
import { mockStaff } from '@/data/mockStaffData';
import { JobPosting, Applicant } from '@/types/recruitment';
import { toast } from 'sonner';

export default function RecruitmentPage() {
  const { jobs, applicants, interviews } = useRecruitment();
  const navigate = useNavigate();
  const [jobSheet, setJobSheet] = useState<{ open: boolean; job: JobPosting | null }>({ open: false, job: null });
  const [addApp, setAddApp] = useState<{ open: boolean; jobId: string | null }>({ open: false, jobId: null });
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const selectedApp = applicants.find(a => a.id === selectedAppId) ?? null;

  const hire = (a: Applicant) => {
    const job = jobs.find(j => j.id === a.jobId);
    setSelectedAppId(null);
    toast(`Converting ${a.firstName} to staff`, { description: 'Finish the onboarding steps to create their staff profile.' });
    const params = new URLSearchParams({ applicantId: a.id, firstName: a.firstName, lastName: a.lastName, email: a.email, phone: a.phone ?? '', position: job?.title ?? '' });
    navigate(`/workforce/onboarding?${params.toString()}`);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <RecruitmentDashboard
            jobs={jobs}
            applicants={applicants}
            interviews={interviews}
            staff={mockStaff}
            onCreateJob={() => setJobSheet({ open: true, job: null })}
            onEditJob={(job) => setJobSheet({ open: true, job })}
            onAddApplicant={(jobId) => setAddApp({ open: true, jobId })}
            onViewApplicant={(app) => setSelectedAppId(app.id)}
          />
        </div>
      </main>
      <JobSheet open={jobSheet.open} job={jobSheet.job} staff={mockStaff} onOpenChange={o => setJobSheet(s => ({ ...s, open: o }))} />
      <AddApplicantSheet open={addApp.open} defaultJobId={addApp.jobId} jobs={jobs} onOpenChange={o => setAddApp(s => ({ ...s, open: o }))} />
      <ApplicantDetailSheet applicant={selectedApp} job={jobs.find(j => j.id === selectedApp?.jobId)} interviews={interviews}
        staff={mockStaff} onOpenChange={o => !o && setSelectedAppId(null)} onHire={hire} />
    </div>
  );
}
