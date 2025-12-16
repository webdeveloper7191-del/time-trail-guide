import { useState, useMemo } from 'react';
import { mockTimesheets, locations } from '@/data/mockTimesheets';
import { Timesheet, TimesheetStatus } from '@/types/timesheet';
import { validateCompliance } from '@/lib/complianceEngine';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
import { StatCard } from '@/components/timesheet/StatCard';
import { TimesheetTable } from '@/components/timesheet/TimesheetTable';
import { TimesheetDetailModal } from '@/components/timesheet/TimesheetDetailModal';
import { TimesheetEditModal } from '@/components/timesheet/TimesheetEditModal';
import { TimesheetAnalytics } from '@/components/timesheet/TimesheetAnalytics';
import { TimesheetCalendarView, OvertimeHeatmap } from '@/components/timesheet/TimesheetCalendarView';
import { TimesheetAuditTrail } from '@/components/timesheet/TimesheetAuditTrail';
import { ComplianceScorecard } from '@/components/timesheet/ComplianceScorecard';
import { ExportDialog } from '@/components/timesheet/ExportDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Download,
  Coffee,
  ShieldAlert,
  Zap,
  BarChart3,
  Calendar,
  History,
  Shield,
  CheckSquare,
  XCircle,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type TabValue = 'all' | 'exceptions' | TimesheetStatus;
type ViewMode = 'table' | 'analytics' | 'calendar' | 'audit' | 'compliance';

export default function TimesheetAdmin() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>(mockTimesheets);
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showSelection, setShowSelection] = useState(false);

  // Calculate stats with compliance
  const stats = useMemo(() => {
    const totalBreakMinutes = timesheets.reduce((sum, t) => sum + t.totalBreakMinutes, 0);
    let exceptionsCount = 0;
    let autoApproveEligible = 0;
    
    timesheets.forEach(t => {
      const validation = validateCompliance(t);
      if (!validation.isCompliant || validation.flags.length > 0) {
        exceptionsCount++;
      }
      if (validation.isCompliant && t.overtimeHours <= 2) {
        autoApproveEligible++;
      }
    });

    return {
      total: timesheets.length,
      pending: timesheets.filter((t) => t.status === 'pending').length,
      approved: timesheets.filter((t) => t.status === 'approved').length,
      rejected: timesheets.filter((t) => t.status === 'rejected').length,
      totalHours: timesheets.reduce((sum, t) => sum + t.totalHours, 0),
      totalBreakHours: Math.round((totalBreakMinutes / 60) * 10) / 10,
      exceptions: exceptionsCount,
      autoApproveEligible,
    };
  }, [timesheets]);

  // Filter timesheets
  const filteredTimesheets = useMemo(() => {
    return timesheets.filter((timesheet) => {
      if (activeTab === 'exceptions') {
        const validation = validateCompliance(timesheet);
        if (validation.isCompliant && validation.flags.length === 0) return false;
      } else if (activeTab !== 'all' && timesheet.status !== activeTab) {
        return false;
      }
      if (locationFilter !== 'all' && timesheet.location.id !== locationFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          timesheet.employee.name.toLowerCase().includes(query) ||
          timesheet.employee.email.toLowerCase().includes(query) ||
          timesheet.employee.department.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [timesheets, activeTab, locationFilter, searchQuery]);

  const handleView = (timesheet: Timesheet) => {
    setSelectedTimesheet(timesheet);
    setIsViewModalOpen(true);
  };

  const handleEdit = (timesheet: Timesheet) => {
    setSelectedTimesheet(timesheet);
    setIsEditModalOpen(true);
  };

  const handleSave = (updatedTimesheet: Timesheet) => {
    setTimesheets((prev) =>
      prev.map((t) => (t.id === updatedTimesheet.id ? updatedTimesheet : t))
    );
  };

  const handleApprove = (id: string) => {
    setTimesheets((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: 'approved' as TimesheetStatus, reviewedAt: new Date().toISOString() } : t
      )
    );
    setIsViewModalOpen(false);
    toast({ title: 'Timesheet Approved', description: 'The timesheet has been approved successfully.' });
  };

  const handleReject = (id: string) => {
    setTimesheets((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: 'rejected' as TimesheetStatus, reviewedAt: new Date().toISOString() } : t
      )
    );
    setIsViewModalOpen(false);
    toast({ title: 'Timesheet Rejected', description: 'The timesheet has been rejected.', variant: 'destructive' });
  };

  const handleBulkApprove = () => {
    setTimesheets((prev) =>
      prev.map((t) =>
        selectedIds.has(t.id) ? { ...t, status: 'approved' as TimesheetStatus, reviewedAt: new Date().toISOString() } : t
      )
    );
    toast({ title: 'Bulk Approved', description: `${selectedIds.size} timesheets approved.` });
    setSelectedIds(new Set());
    setShowSelection(false);
  };

  const handleBulkReject = () => {
    setTimesheets((prev) =>
      prev.map((t) =>
        selectedIds.has(t.id) ? { ...t, status: 'rejected' as TimesheetStatus, reviewedAt: new Date().toISOString() } : t
      )
    );
    toast({ title: 'Bulk Rejected', description: `${selectedIds.size} timesheets rejected.`, variant: 'destructive' });
    setSelectedIds(new Set());
    setShowSelection(false);
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Timesheet Management</h1>
              <p className="text-muted-foreground mt-1">Review and manage employee timesheets</p>
            </div>
            <div className="flex gap-2">
              {['table', 'analytics', 'calendar', 'audit', 'compliance'].map((mode) => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode(mode as ViewMode)}
                  className="capitalize"
                >
                  {mode === 'table' && <Users className="h-4 w-4 mr-1.5" />}
                  {mode === 'analytics' && <BarChart3 className="h-4 w-4 mr-1.5" />}
                  {mode === 'calendar' && <Calendar className="h-4 w-4 mr-1.5" />}
                  {mode === 'audit' && <History className="h-4 w-4 mr-1.5" />}
                  {mode === 'compliance' && <Shield className="h-4 w-4 mr-1.5" />}
                  {mode}
                </Button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            <StatCard title="Total" value={stats.total} icon={Clock} subtitle="This week" />
            <StatCard title="Pending" value={stats.pending} icon={AlertCircle} trend={{ value: 12, positive: false }} />
            <StatCard title="Exceptions" value={stats.exceptions} icon={ShieldAlert} subtitle="Need attention" />
            <StatCard title="Auto-Ready" value={stats.autoApproveEligible} icon={Zap} subtitle="No issues" />
            <StatCard title="Approved" value={stats.approved} icon={CheckCircle2} trend={{ value: 8, positive: true }} />
            <StatCard title="Hours" value={`${stats.totalHours.toFixed(1)}h`} icon={Users} subtitle="Net hours" />
            <StatCard title="Breaks" value={`${stats.totalBreakHours}h`} icon={Coffee} subtitle="Total breaks" />
          </div>

          {/* View Content */}
          {viewMode === 'table' && (
            <>
              {/* Filters & Actions */}
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search employees..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
                <div className="flex gap-3 flex-wrap">
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => setShowSelection(!showSelection)}>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    {showSelection ? 'Cancel' : 'Select'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsExportOpen(true)}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Bulk Actions */}
              {showSelection && selectedIds.size > 0 && (
                <div className="flex items-center gap-3 mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <span className="text-sm font-medium">{selectedIds.size} selected</span>
                  <Button size="sm" onClick={handleBulkApprove} className="bg-status-approved hover:bg-status-approved/90">
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Approve All
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleBulkReject}>
                    <XCircle className="h-4 w-4 mr-1.5" />
                    Reject All
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>Clear</Button>
                </div>
              )}

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="mb-6">
                <TabsList className="bg-card border border-border">
                  <TabsTrigger value="all">All <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">{stats.total}</span></TabsTrigger>
                  <TabsTrigger value="exceptions"><ShieldAlert className="h-3 w-3 mr-1" />Exceptions <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">{stats.exceptions}</span></TabsTrigger>
                  <TabsTrigger value="pending">Pending <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">{stats.pending}</span></TabsTrigger>
                  <TabsTrigger value="approved">Approved <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">{stats.approved}</span></TabsTrigger>
                  <TabsTrigger value="rejected">Rejected <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">{stats.rejected}</span></TabsTrigger>
                </TabsList>
              </Tabs>

              <TimesheetTable
                timesheets={filteredTimesheets}
                onView={handleView}
                onEdit={handleEdit}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                showSelection={showSelection}
              />
            </>
          )}

          {viewMode === 'analytics' && <TimesheetAnalytics timesheets={timesheets} />}
          
          {viewMode === 'calendar' && (
            <div className="space-y-6">
              <TimesheetCalendarView timesheets={timesheets} onTimesheetClick={handleView} />
              <OvertimeHeatmap timesheets={timesheets} />
            </div>
          )}
          
          {viewMode === 'audit' && <TimesheetAuditTrail timesheets={timesheets} />}
          
          {viewMode === 'compliance' && <ComplianceScorecard timesheets={timesheets} />}
        </div>
      </main>

      <TimesheetDetailModal timesheet={selectedTimesheet} open={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} onApprove={handleApprove} onReject={handleReject} />
      <TimesheetEditModal timesheet={selectedTimesheet} open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleSave} />
      <ExportDialog open={isExportOpen} onClose={() => setIsExportOpen(false)} timesheets={filteredTimesheets} />
    </div>
  );
}
