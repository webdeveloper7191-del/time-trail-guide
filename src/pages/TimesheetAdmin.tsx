import { useState, useMemo } from 'react';
import { mockTimesheets, locations } from '@/data/mockTimesheets';
import { Timesheet, TimesheetStatus } from '@/types/timesheet';
import { validateCompliance } from '@/lib/complianceEngine';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
import { StatCard } from '@/components/timesheet/StatCard';
import { TimesheetTable } from '@/components/timesheet/TimesheetTable';
import { TimesheetDetailModal } from '@/components/timesheet/TimesheetDetailModal';
import { TimesheetEditModal } from '@/components/timesheet/TimesheetEditModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type TabValue = 'all' | 'exceptions' | TimesheetStatus;

export default function TimesheetAdmin() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>(mockTimesheets);
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Calculate stats with compliance
  const stats = useMemo(() => {
    const totalBreakMinutes = timesheets.reduce((sum, t) => sum + t.totalBreakMinutes, 0);
    
    // Count exceptions (timesheets with compliance issues)
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
      // Tab filter
      if (activeTab === 'exceptions') {
        const validation = validateCompliance(timesheet);
        if (validation.isCompliant && validation.flags.length === 0) {
          return false;
        }
      } else if (activeTab !== 'all' && timesheet.status !== activeTab) {
        return false;
      }

      // Location filter
      if (locationFilter !== 'all' && timesheet.location.id !== locationFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          timesheet.employee.name.toLowerCase().includes(query) ||
          timesheet.employee.email.toLowerCase().includes(query) ||
          timesheet.employee.department.toLowerCase().includes(query) ||
          timesheet.id.toLowerCase().includes(query)
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
        t.id === id
          ? { ...t, status: 'approved' as TimesheetStatus, reviewedAt: new Date().toISOString() }
          : t
      )
    );
    setIsViewModalOpen(false);
    toast({
      title: 'Timesheet Approved',
      description: 'The timesheet has been approved successfully.',
    });
  };

  const handleReject = (id: string) => {
    setTimesheets((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: 'rejected' as TimesheetStatus, reviewedAt: new Date().toISOString() }
          : t
      )
    );
    setIsViewModalOpen(false);
    toast({
      title: 'Timesheet Rejected',
      description: 'The timesheet has been rejected.',
      variant: 'destructive',
    });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Timesheet Management</h1>
            <p className="text-muted-foreground mt-1">
              Review and manage employee timesheets across all locations
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
            <StatCard
              title="Total Timesheets"
              value={stats.total}
              icon={Clock}
              subtitle="This week"
            />
            <StatCard
              title="Pending Review"
              value={stats.pending}
              icon={AlertCircle}
              trend={{ value: 12, positive: false }}
            />
            <StatCard
              title="Exceptions"
              value={stats.exceptions}
              icon={ShieldAlert}
              subtitle="Need attention"
            />
            <StatCard
              title="Auto-Approve Ready"
              value={stats.autoApproveEligible}
              icon={Zap}
              subtitle="No issues detected"
            />
            <StatCard
              title="Approved"
              value={stats.approved}
              icon={CheckCircle2}
              trend={{ value: 8, positive: true }}
            />
            <StatCard
              title="Total Hours"
              value={`${stats.totalHours.toFixed(1)}h`}
              icon={Users}
              subtitle="Net working hours"
            />
            <StatCard
              title="Break Hours"
              value={`${stats.totalBreakHours}h`}
              icon={Coffee}
              subtitle="Total break time"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-3">
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="mb-6">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                All
                <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
                  {stats.total}
                </span>
              </TabsTrigger>
              <TabsTrigger value="exceptions" className="data-[state=active]:bg-status-rejected data-[state=active]:text-white">
                <ShieldAlert className="h-3 w-3 mr-1" />
                Exceptions
                <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
                  {stats.exceptions}
                </span>
              </TabsTrigger>
              <TabsTrigger value="pending" className="data-[state=active]:bg-status-pending data-[state=active]:text-white">
                Pending
                <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
                  {stats.pending}
                </span>
              </TabsTrigger>
              <TabsTrigger value="approved" className="data-[state=active]:bg-status-approved data-[state=active]:text-white">
                Approved
                <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
                  {stats.approved}
                </span>
              </TabsTrigger>
              <TabsTrigger value="rejected" className="data-[state=active]:bg-status-rejected data-[state=active]:text-white">
                Rejected
                <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
                  {stats.rejected}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Table */}
          <TimesheetTable
            timesheets={filteredTimesheets}
            onView={handleView}
            onEdit={handleEdit}
          />
        </div>
      </main>

      {/* Modals */}
      <TimesheetDetailModal
        timesheet={selectedTimesheet}
        open={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <TimesheetEditModal
        timesheet={selectedTimesheet}
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
