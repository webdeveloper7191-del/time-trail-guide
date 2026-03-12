import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/mui/Button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  Search, Filter, ChevronDown, UserCog, Users, CheckCircle2, Clock,
  AlertTriangle, Plus, MoreVertical, FileText, Shield, Mail, ChevronRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface OnboardingCandidate {
  id: string;
  name: string;
  role: string;
  email: string;
  startedAt: string;
  progress: number;
  currentStep: string;
  status: 'in_progress' | 'pending_review' | 'completed' | 'blocked';
  documentsUploaded: number;
  documentsRequired: number;
  daysInOnboarding: number;
}

const MOCK_ONBOARDING: OnboardingCandidate[] = [
  { id: '1', name: 'Sarah Johnson', role: 'Registered Nurse', email: 'sarah.j@email.com', startedAt: '2025-03-05', progress: 75, currentStep: 'Documents', status: 'in_progress', documentsUploaded: 4, documentsRequired: 6, daysInOnboarding: 7 },
  { id: '2', name: 'David Park', role: 'Personal Care Assistant', email: 'david.p@email.com', startedAt: '2025-03-08', progress: 50, currentStep: 'Bank & Super', status: 'in_progress', documentsUploaded: 2, documentsRequired: 5, daysInOnboarding: 4 },
  { id: '3', name: 'Amy Chen', role: 'Early Childhood Teacher', email: 'amy.c@email.com', startedAt: '2025-03-01', progress: 100, currentStep: 'Complete', status: 'completed', documentsUploaded: 7, documentsRequired: 7, daysInOnboarding: 11 },
  { id: '4', name: 'Marcus Brown', role: 'Chef', email: 'marcus.b@email.com', startedAt: '2025-03-10', progress: 25, currentStep: 'Emergency Contacts', status: 'in_progress', documentsUploaded: 0, documentsRequired: 4, daysInOnboarding: 2 },
  { id: '5', name: 'Priya Sharma', role: 'Wait Staff', email: 'priya.s@email.com', startedAt: '2025-03-06', progress: 62, currentStep: 'Tax Declaration', status: 'blocked', documentsUploaded: 3, documentsRequired: 4, daysInOnboarding: 6 },
  { id: '6', name: 'Tom Wilson', role: 'Kitchen Hand', email: 'tom.w@email.com', startedAt: '2025-03-09', progress: 37, currentStep: 'Your Details', status: 'pending_review', documentsUploaded: 1, documentsRequired: 3, daysInOnboarding: 3 },
];

interface AgencyOnboardingScreenProps {
  onStartOnboarding?: () => void;
}

export function AgencyOnboardingScreen({ onStartOnboarding }: AgencyOnboardingScreenProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = MOCK_ONBOARDING.filter(c => {
    const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.role.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const total = MOCK_ONBOARDING.length;
  const inProgress = MOCK_ONBOARDING.filter(c => c.status === 'in_progress').length;
  const completed = MOCK_ONBOARDING.filter(c => c.status === 'completed').length;
  const blocked = MOCK_ONBOARDING.filter(c => c.status === 'blocked').length;
  const pendingReview = MOCK_ONBOARDING.filter(c => c.status === 'pending_review').length;
  const avgProgress = Math.round(MOCK_ONBOARDING.reduce((a, c) => a + c.progress, 0) / total);

  const getStatusBadge = (status: OnboardingCandidate['status']) => {
    const config = {
      in_progress: { label: 'In Progress', className: 'bg-primary/10 text-primary' },
      pending_review: { label: 'Pending Review', className: 'bg-status-pending-bg text-status-pending' },
      completed: { label: 'Completed', className: 'bg-status-approved-bg text-status-approved' },
      blocked: { label: 'Blocked', className: 'bg-status-rejected-bg text-status-rejected' },
    }[status];
    return <Badge className={cn('text-xs border-0', config.className)}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        {[
          { title: 'Total Onboarding', value: total, icon: UserCog, color: 'bg-primary/10 text-primary' },
          { title: 'In Progress', value: inProgress, icon: Clock, color: 'bg-primary/10 text-primary' },
          { title: 'Pending Review', value: pendingReview, icon: FileText, color: 'bg-status-pending-bg text-status-pending' },
          { title: 'Completed', value: completed, icon: CheckCircle2, color: 'bg-status-approved-bg text-status-approved' },
          { title: 'Blocked', value: blocked, icon: AlertTriangle, color: 'bg-status-rejected-bg text-status-rejected' },
        ].map(kpi => (
          <div key={kpi.title} className="bg-background border border-border rounded-xl p-4 flex items-start justify-between">
            <div>
              <p className="text-[13px] text-muted-foreground font-medium">{kpi.title}</p>
              <p className="text-xl font-bold tracking-tight mt-1">{kpi.value}</p>
            </div>
            <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', kpi.color.split(' ')[0])}>
              <kpi.icon className={cn('h-4 w-4', kpi.color.split(' ')[1])} />
            </div>
          </div>
        ))}
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {[
          { value: 'all', label: 'All Candidates', count: total, icon: Users },
          { value: 'in_progress', label: 'In Progress', count: inProgress, icon: Clock },
          { value: 'pending_review', label: 'Pending Review', count: pendingReview, icon: FileText },
          { value: 'completed', label: 'Completed', count: completed, icon: CheckCircle2 },
          { value: 'blocked', label: 'Blocked', count: blocked, icon: AlertTriangle },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors',
              statusFilter === tab.value
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
            <span className={cn(
              'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
              statusFilter === tab.value ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            )}>
              {String(tab.count).padStart(2, '0')}
            </span>
          </button>
        ))}
      </div>

      {/* Search + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative max-w-[300px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by name and role"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <Button variant="outlined" size="small" className="h-9">
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            Filter
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </div>
        <Button size="small" onClick={onStartOnboarding}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Start Onboarding
        </Button>
      </div>

      {/* Onboarding Table */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-xs font-semibold">Candidate ⇅</TableHead>
              <TableHead className="text-xs font-semibold">Role</TableHead>
              <TableHead className="text-xs font-semibold">Current Step</TableHead>
              <TableHead className="text-xs font-semibold">Progress</TableHead>
              <TableHead className="text-xs font-semibold">Documents</TableHead>
              <TableHead className="text-xs font-semibold">Days</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
              <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(candidate => (
              <TableRow key={candidate.id} className="hover:bg-muted/20">
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-semibold text-primary">
                        {candidate.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{candidate.name}</p>
                      <p className="text-[13px] text-muted-foreground">{candidate.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{candidate.role}</TableCell>
                <TableCell className="text-sm">{candidate.currentStep}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <Progress value={candidate.progress} className="h-2 flex-1" />
                    <span className="text-sm font-medium">{candidate.progress}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {candidate.documentsUploaded}/{candidate.documentsRequired}
                  </span>
                </TableCell>
                <TableCell className="text-sm">{candidate.daysInOnboarding}d</TableCell>
                <TableCell>{getStatusBadge(candidate.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="small" className="h-7 text-xs">
                      View <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded hover:bg-muted text-muted-foreground">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Send Reminder</DropdownMenuItem>
                        <DropdownMenuItem>Review Documents</DropdownMenuItem>
                        <DropdownMenuItem>Reset Progress</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Cancel Onboarding</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-sm text-muted-foreground">
                  No onboarding candidates match your filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default AgencyOnboardingScreen;
