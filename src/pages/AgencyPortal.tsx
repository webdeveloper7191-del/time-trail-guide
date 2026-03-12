import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/mui/Button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Building2, Users, Calendar, FileText, BarChart3, 
  Shield, AlertTriangle, TrendingUp, Clock, CheckCircle2,
  ArrowLeft, Plus, UserPlus, Zap, Receipt, ClipboardCheck, Briefcase,
  ArrowUpRight, ArrowDownRight, Search, Filter, Bell, Settings,
  Star, MapPin, DollarSign, Activity, Eye, MoreVertical,
  RefreshCw, Download, ChevronRight, ChevronDown, Percent, Target, Upload,
  CalendarDays, List, Wrench, LayoutDashboard, UserCheck, Link2,
  History, HelpCircle, Globe, Timer, BellRing, UserCog
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockAgency, mockCandidates, mockShiftRequests, mockInvoices, mockAgencyAnalytics } from '@/data/mockAgencyData';
import { format } from 'date-fns';
import AgencyOnboardingWizard from '@/components/agency/AgencyOnboardingWizard';
import ShiftMatchingPanel from '@/components/agency/ShiftMatchingPanel';
import CandidateOnboardingForm from '@/components/agency/CandidateOnboardingForm';
import InvoiceGenerator from '@/components/agency/InvoiceGenerator';
import CandidateAvailabilityCalendar from '@/components/agency/CandidateAvailabilityCalendar';
import TimesheetApprovalWorkflow from '@/components/agency/TimesheetApprovalWorkflow';
import ClientManagementPanel from '@/components/agency/ClientManagementPanel';
import { ShiftBroadcastInbox } from '@/components/agency/ShiftBroadcastInbox';
import { ShiftCalendarView } from '@/components/agency/ShiftCalendarView';
import { CandidateBulkImport } from '@/components/agency/CandidateBulkImport';
import { CandidateProfilePanel } from '@/components/agency/CandidateProfilePanel';
import { AgencyAvailabilityScreen } from '@/components/agency/AgencyAvailabilityScreen';
import { AgencyOnboardingScreen } from '@/components/agency/AgencyOnboardingScreen';
import { AgencySettingsScreen } from '@/components/agency/AgencySettingsScreen';
import rosteredLogo from '@/assets/rostered-logo.png';
import { cn } from '@/lib/utils';
import { Candidate } from '@/types/agency';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ─── Sidebar Navigation Config ───────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    id: 'candidates-group',
    label: 'Candidate Management',
    icon: Users,
    children: [
      { id: 'candidates', label: 'Candidates', icon: UserCheck },
      { id: 'availability', label: 'Availability', icon: CalendarDays },
      { id: 'onboarding', label: 'Onboarding', icon: UserCog },
    ],
  },
  { id: 'clients', label: 'Clients', icon: Briefcase },
  {
    id: 'shifts-group',
    label: 'Shifts & Scheduling',
    icon: Calendar,
    children: [
      { id: 'shifts', label: 'Shift Requests', icon: Calendar },
      { id: 'broadcasts', label: 'Broadcast Inbox', icon: BellRing },
    ],
  },
  { id: 'timesheets', label: 'Timesheets', icon: ClipboardCheck },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'profile', label: 'Business Profile', icon: Building2 },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

type NavItem = { id: string; label: string; icon: typeof LayoutDashboard; children?: { id: string; label: string; icon: typeof LayoutDashboard }[] };

// ─── KPI Card matching screenshot style ──────────────────────────────────────
function KPICard({
  title, value, subtitle, icon: Icon, trend, trendValue, iconColor = 'text-primary bg-primary/10',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: typeof TrendingUp;
  trend?: 'up' | 'down';
  trendValue?: string;
  iconColor?: string;
}) {
  return (
    <div className="bg-background border border-border rounded-xl p-4 flex items-start justify-between">
      <div>
        <p className="text-[13px] text-muted-foreground font-medium">{title}</p>
        <p className="text-[22px] font-bold tracking-tight mt-1">{value}</p>
        {subtitle && (
          <p className={cn(
            'text-[11px] mt-0.5',
            trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
          )}>
            {trendValue && <span className="font-medium">{trendValue} </span>}
            {subtitle}
          </p>
        )}
      </div>
      <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', iconColor)}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
  );
}

const AgencyPortal = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['candidates-group', 'shifts-group']));
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [showInvoiceGenerator, setShowInvoiceGenerator] = useState(false);
  const [selectedShiftForMatching, setSelectedShiftForMatching] = useState<string | null>(null);
  const [showAvailabilityCalendar, setShowAvailabilityCalendar] = useState(false);
  const [selectedCandidateForAvailability, setSelectedCandidateForAvailability] = useState<{ id: string; name: string } | null>(null);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateStatusFilter, setCandidateStatusFilter] = useState('all');
  const [shiftStatusFilter, setShiftStatusFilter] = useState('all');
  const [shiftViewMode, setShiftViewMode] = useState<'list' | 'calendar'>('list');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());
  const [selectedCandidateForProfile, setSelectedCandidateForProfile] = useState<Candidate | null>(null);

  const openShifts = mockShiftRequests.filter(s => s.status === 'open' || s.status === 'partially_filled');
  const urgentShifts = mockShiftRequests.filter(s => s.urgency === 'critical' || s.urgency === 'urgent');
  const overdueInvoices = mockInvoices.filter(i => i.status === 'overdue');

  const selectedShift = selectedShiftForMatching 
    ? mockShiftRequests.find(s => s.id === selectedShiftForMatching) 
    : null;

  const filteredCandidates = useMemo(() => {
    return mockCandidates.filter(c => {
      const matchesSearch = !candidateSearch || 
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        c.primaryRole.toLowerCase().includes(candidateSearch.toLowerCase());
      const matchesStatus = candidateStatusFilter === 'all' || c.status === candidateStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [candidateSearch, candidateStatusFilter]);

  const filteredShifts = useMemo(() => {
    if (shiftStatusFilter === 'all') return mockShiftRequests;
    return mockShiftRequests.filter(s => s.status === shiftStatusFilter);
  }, [shiftStatusFilter]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId); else next.add(groupId);
      return next;
    });
  };

  const isActiveInGroup = (item: NavItem) => {
    if (item.children) return item.children.some(c => c.id === activeTab);
    return item.id === activeTab;
  };

  // Page titles
  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Dashboard', subtitle: 'Overview of your agency performance' },
    candidates: { title: 'Candidates', subtitle: 'Manage your candidate pool' },
    availability: { title: 'Candidate Availability', subtitle: 'View and manage candidate schedules' },
    onboarding: { title: 'Candidate Onboarding', subtitle: 'Onboard new candidates' },
    clients: { title: 'Clients', subtitle: 'Manage client relationships' },
    shifts: { title: 'Shift Requests', subtitle: 'View and manage incoming shifts' },
    broadcasts: { title: 'Broadcast Inbox', subtitle: 'Incoming shift broadcasts from centres' },
    timesheets: { title: 'Timesheets', subtitle: 'Manage Timesheets' },
    invoices: { title: 'Invoices', subtitle: 'Billing and invoicing' },
    profile: { title: 'Business Profile', subtitle: 'Your agency details and compliance' },
    settings: { title: 'Settings', subtitle: 'Configure your agency portal' },
  };

  const currentPage = pageTitles[activeTab] || { title: 'Agency Portal', subtitle: '' };

  return (
    <div className="min-h-screen flex bg-[#f8f9fb]">
      {/* ═══ LEFT SIDEBAR ══════════════════════════════════════════════════ */}
      <aside className="w-[200px] bg-background border-r border-border flex flex-col shrink-0 sticky top-0 h-screen">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-border">
          <img src={rosteredLogo} alt="Rostered.ai" className="h-8" />
        </div>

        {/* Search */}
        <div className="px-3 pt-3 pb-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search by keywords" className="pl-8 h-8 text-xs bg-muted/30 border-0" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {(NAV_ITEMS as readonly NavItem[]).map(item => {
            if (item.children) {
              const isExpanded = expandedGroups.has(item.id);
              const isGroupActive = isActiveInGroup(item);
              return (
                <div key={item.id}>
                  <button
                    onClick={() => toggleGroup(item.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors',
                      isGroupActive
                        ? 'bg-[#e0f7fa] text-[#00acc1]'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    <ChevronDown className={cn(
                      'h-3.5 w-3.5 transition-transform shrink-0',
                      isExpanded && 'rotate-180'
                    )} />
                  </button>
                  {isExpanded && (
                    <div className="ml-4 mt-0.5 space-y-0.5">
                      {item.children.map(child => (
                        <button
                          key={child.id}
                          onClick={() => setActiveTab(child.id)}
                          className={cn(
                            'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] transition-colors',
                            activeTab === child.id
                              ? 'text-[#00acc1] font-medium'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <child.icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{child.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors',
                  activeTab === item.id
                    ? 'bg-[#e0f7fa] text-[#00acc1]'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ═══ MAIN AREA ═════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ─── Top Bar ───────────────────────────────────────────────────── */}
        <header className="h-[52px] bg-background border-b border-border flex items-center justify-between px-6 shrink-0 sticky top-0 z-30">
          <div className="relative max-w-[280px] flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search by keywords" className="pl-8 h-8 text-xs" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              {mockAgency.tradingName?.toUpperCase() || 'AGENCY'}
              <ChevronDown className="h-3 w-3 ml-0.5" />
            </div>
            <button className="relative p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-destructive text-[8px] text-destructive-foreground flex items-center justify-center font-bold">3</span>
            </button>
            <button className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground">
              <Users className="h-4 w-4" />
            </button>
            <button className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground">
              <Settings className="h-4 w-4" />
            </button>
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {mockAgency.primaryContactName?.charAt(0) || 'A'}
            </div>
          </div>
        </header>

        {/* ─── Page Content ──────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          {/* Page Header */}
          <div className="px-6 pt-5 pb-4 flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">{currentPage.title}</h1>
              <p className="text-[13px] text-muted-foreground mt-0.5">{currentPage.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === 'candidates' && (
                <>
                  <Button variant="outlined" size="small" onClick={() => setShowBulkImport(true)}>
                    <Wrench className="h-3.5 w-3.5 mr-1.5" />
                    Tools
                  </Button>
                  <Button size="small" onClick={() => setShowCandidateForm(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add Candidate
                  </Button>
                </>
              )}
              {activeTab === 'invoices' && (
                <Button size="small" onClick={() => setShowInvoiceGenerator(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Generate Invoice
                </Button>
              )}
              {activeTab === 'profile' && (
                <Button variant="outlined" size="small" onClick={() => setShowOnboardingWizard(true)}>
                  Edit Profile
                </Button>
              )}
              {activeTab === 'shifts' && (
                <div className="flex items-center rounded-md border bg-background">
                  <button
                    onClick={() => setShiftViewMode('list')}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-l-md transition-colors',
                      shiftViewMode === 'list' ? 'bg-[#00acc1] text-white' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <List className="h-3 w-3" /> List
                  </button>
                  <button
                    onClick={() => setShiftViewMode('calendar')}
                    className={cn(
                      'flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-r-md transition-colors',
                      shiftViewMode === 'calendar' ? 'bg-[#00acc1] text-white' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <CalendarDays className="h-3 w-3" /> Calendar
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 pb-6">
            {/* ═══ DASHBOARD ═══════════════════════════════════════════════ */}
            {activeTab === 'dashboard' && (
              <div className="space-y-5">
                {/* KPI Row */}
                <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
                  <KPICard
                    title="Fill Rate"
                    value={`${mockAgencyAnalytics.fillRate}%`}
                    subtitle={`${mockAgencyAnalytics.totalShiftsFilled} of ${mockAgencyAnalytics.totalShiftsRequested} shifts`}
                    icon={Target}
                    iconColor="bg-emerald-100 text-emerald-600"
                  />
                  <KPICard
                    title="Avg Time to Fill"
                    value={`${mockAgencyAnalytics.avgTimeToFillMinutes}m`}
                    subtitle="Response time"
                    icon={Clock}
                    iconColor="bg-amber-100 text-amber-600"
                  />
                  <KPICard
                    title="Gross Margin"
                    value={`$${mockAgencyAnalytics.grossProfit.toLocaleString()}`}
                    subtitle={`${mockAgencyAnalytics.marginPercentage}% margin`}
                    trend="up"
                    trendValue="+8.1%"
                    icon={DollarSign}
                    iconColor="bg-blue-100 text-blue-600"
                  />
                  <KPICard
                    title="Active Candidates"
                    value={mockAgencyAnalytics.totalActiveCandidates}
                    subtitle={`${mockAgencyAnalytics.avgWorkerUtilization}% utilization`}
                    icon={Users}
                    iconColor="bg-purple-100 text-purple-600"
                  />
                </div>

                {/* Alerts */}
                {(urgentShifts.length > 0 || overdueInvoices.length > 0) && (
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50/60">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <div className="flex-1 flex items-center gap-3 text-[13px]">
                      {urgentShifts.length > 0 && (
                        <span className="text-amber-800">{urgentShifts.length} urgent shift(s) need attention</span>
                      )}
                      {overdueInvoices.length > 0 && (
                        <span className="text-red-700">{overdueInvoices.length} overdue invoice(s)</span>
                      )}
                    </div>
                    <Button variant="ghost" size="small" onClick={() => setActiveTab('shifts')} className="text-xs text-amber-700">
                      View <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Button>
                  </div>
                )}

                {/* Two Column */}
                <div className="grid gap-4 lg:grid-cols-2">
                  {/* Open Shifts */}
                  <div className="bg-background rounded-xl border border-border">
                    <div className="flex items-center justify-between px-4 pt-4 pb-2">
                      <div>
                        <p className="text-sm font-semibold">Open Shifts</p>
                        <p className="text-[11px] text-muted-foreground">{openShifts.length} shifts need candidates</p>
                      </div>
                      <Button variant="ghost" size="small" onClick={() => setActiveTab('shifts')} className="text-xs">
                        View All <ChevronRight className="h-3 w-3 ml-0.5" />
                      </Button>
                    </div>
                    <div className="px-4 pb-4 space-y-1.5">
                      {openShifts.slice(0, 4).map(shift => (
                        <div
                          key={shift.id}
                          className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => { setSelectedShiftForMatching(shift.id); setActiveTab('shifts'); }}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={cn(
                              'h-8 w-1 rounded-full',
                              shift.urgency === 'critical' ? 'bg-destructive' :
                              shift.urgency === 'urgent' ? 'bg-amber-500' : 'bg-emerald-500'
                            )} />
                            <div>
                              <p className="text-xs font-medium">{shift.clientName}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {format(new Date(shift.date), 'MMM d')} · {shift.startTime}–{shift.endTime}
                              </p>
                            </div>
                          </div>
                          <Badge variant={shift.urgency === 'critical' ? 'destructive' : 'secondary'} className="text-[10px] h-5">
                            {shift.filledPositions}/{shift.totalPositions}
                          </Badge>
                        </div>
                      ))}
                      {openShifts.length === 0 && (
                        <div className="text-center py-6 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
                          All shifts filled
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Top Performers */}
                  <div className="bg-background rounded-xl border border-border">
                    <div className="flex items-center justify-between px-4 pt-4 pb-2">
                      <div>
                        <p className="text-sm font-semibold">Top Performers</p>
                        <p className="text-[11px] text-muted-foreground">This month's best workers</p>
                      </div>
                      <Button variant="ghost" size="small" onClick={() => setActiveTab('candidates')} className="text-xs">
                        View All <ChevronRight className="h-3 w-3 ml-0.5" />
                      </Button>
                    </div>
                    <div className="px-4 pb-4 space-y-1.5">
                      {mockAgencyAnalytics.topPerformers.map((performer, idx) => (
                        <div key={performer.candidateId} className="flex items-center gap-3 p-2.5 rounded-lg border">
                          <div className={cn(
                            'h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold',
                            idx === 0 ? 'bg-amber-100 text-amber-700' :
                            idx === 1 ? 'bg-slate-100 text-slate-600' :
                            'bg-muted text-muted-foreground'
                          )}>
                            #{idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{performer.name}</p>
                            <p className="text-[10px] text-muted-foreground">{performer.shiftsCompleted} shifts</p>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                            <span className="text-xs font-semibold">{performer.shiftsCompleted}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Broadcast Inbox Preview */}
                <ShiftBroadcastInbox onMatchCandidates={() => setActiveTab('shifts')} />
              </div>
            )}

            {/* ═══ CANDIDATES ══════════════════════════════════════════════ */}
            {activeTab === 'candidates' && (
              <div className="space-y-4">
                {/* KPI Row */}
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                  <KPICard title="Total Candidates" value={mockCandidates.length} icon={Users} iconColor="bg-blue-100 text-blue-600" />
                  <KPICard title="Available" value={mockCandidates.filter(c => c.status === 'available').length} icon={CheckCircle2} iconColor="bg-emerald-100 text-emerald-600" />
                  <KPICard title="On Shift" value={mockCandidates.filter(c => c.status === 'on_shift').length} icon={Clock} iconColor="bg-amber-100 text-amber-600" />
                  <KPICard title="Avg Rating" value={(mockCandidates.reduce((a, c) => a + c.averageRating, 0) / mockCandidates.length).toFixed(1)} icon={Star} iconColor="bg-purple-100 text-purple-600" />
                </div>

                {/* Status Tabs */}
                <div className="flex items-center gap-1 border-b border-border">
                  {[
                    { value: 'all', label: 'All Candidates', count: mockCandidates.length },
                    { value: 'available', label: 'Available', count: mockCandidates.filter(c => c.status === 'available').length },
                    { value: 'on_shift', label: 'On Shift', count: mockCandidates.filter(c => c.status === 'on_shift').length },
                    { value: 'unavailable', label: 'Unavailable', count: mockCandidates.filter(c => c.status === 'unavailable').length },
                  ].map(tab => (
                    <button
                      key={tab.value}
                      onClick={() => setCandidateStatusFilter(tab.value)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors',
                        candidateStatusFilter === tab.value
                          ? 'border-[#00acc1] text-[#00acc1]'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {tab.label}
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                        candidateStatusFilter === tab.value
                          ? 'bg-[#e0f7fa] text-[#00acc1]'
                          : 'bg-muted text-muted-foreground'
                      )}>
                        {String(tab.count).padStart(2, '0')}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Search + Filter + Bulk Actions */}
                <div className="flex items-center gap-2">
                  <div className="relative max-w-[300px] flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search by employee name, Email, or role"
                      value={candidateSearch}
                      onChange={e => setCandidateSearch(e.target.value)}
                      className="pl-8 h-9 text-xs"
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outlined" size="small" className="h-9">
                        <Filter className="h-3.5 w-3.5 mr-1.5" />
                        Filter
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>By Role</DropdownMenuItem>
                      <DropdownMenuItem>By Rating</DropdownMenuItem>
                      <DropdownMenuItem>By Location</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outlined" size="small" className="h-9">
                        Bulk Actions
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setShowBulkImport(true)}>Import CSV/Excel</DropdownMenuItem>
                      <DropdownMenuItem>Export Selected</DropdownMenuItem>
                      <DropdownMenuItem>Send Notification</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Candidate Table */}
                <div className="bg-background rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="w-10">
                          <Checkbox
                            checked={selectedCandidateIds.size === filteredCandidates.length && filteredCandidates.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCandidateIds(new Set(filteredCandidates.map(c => c.id)));
                              } else {
                                setSelectedCandidateIds(new Set());
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead className="text-[11px] font-semibold">Name ⇅</TableHead>
                        <TableHead className="text-[11px] font-semibold">Role</TableHead>
                        <TableHead className="text-[11px] font-semibold">Status</TableHead>
                        <TableHead className="text-[11px] font-semibold">Rating ⇅</TableHead>
                        <TableHead className="text-[11px] font-semibold">Shifts</TableHead>
                        <TableHead className="text-[11px] font-semibold">Pay Rate ⇅</TableHead>
                        <TableHead className="text-[11px] font-semibold">Compliance</TableHead>
                        <TableHead className="text-[11px] font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCandidates.map(candidate => (
                        <TableRow key={candidate.id} className="hover:bg-muted/20">
                          <TableCell>
                            <Checkbox
                              checked={selectedCandidateIds.has(candidate.id)}
                              onCheckedChange={(checked) => {
                                setSelectedCandidateIds(prev => {
                                  const next = new Set(prev);
                                  if (checked) next.add(candidate.id); else next.delete(candidate.id);
                                  return next;
                                });
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-semibold text-primary">
                                  {candidate.firstName[0]}{candidate.lastName[0]}
                                </span>
                              </div>
                              <div>
                                <p className="text-[13px] font-medium">{candidate.firstName} {candidate.lastName}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-[12px] text-muted-foreground">{candidate.primaryRole}</TableCell>
                          <TableCell>
                            <span className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium',
                              candidate.status === 'available' ? 'bg-emerald-100 text-emerald-700' :
                              candidate.status === 'on_shift' ? 'bg-blue-100 text-blue-700' :
                              'bg-muted text-muted-foreground'
                            )}>
                              {candidate.status.replace('_', ' ')}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-0.5">
                              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                              <span className="text-[12px] font-medium">{candidate.averageRating}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-[12px]">{candidate.totalShiftsCompleted}</TableCell>
                          <TableCell className="text-[12px]">${candidate.payRate}/hr</TableCell>
                          <TableCell>
                            <span className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium',
                              candidate.complianceScore >= 80 ? 'bg-emerald-100 text-emerald-700' :
                              candidate.complianceScore >= 50 ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            )}>
                              {candidate.complianceScore}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setSelectedCandidateForAvailability({ id: candidate.id, name: `${candidate.firstName} ${candidate.lastName}` });
                                  setShowAvailabilityCalendar(true);
                                }}
                                className="p-1 rounded hover:bg-muted text-muted-foreground"
                              >
                                <Calendar className="h-3.5 w-3.5" />
                              </button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1 rounded hover:bg-muted text-muted-foreground">
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>View Profile</DropdownMenuItem>
                                  <DropdownMenuItem>Edit</DropdownMenuItem>
                                  <DropdownMenuItem>View Availability</DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive">Deactivate</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredCandidates.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-10 text-xs text-muted-foreground">
                            No candidates match your filters
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* ═══ AVAILABILITY ═════════════════════════════════════════════ */}
            {activeTab === 'availability' && (
              <div className="text-center py-16 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Candidate Availability Calendar</p>
                <p className="text-xs">Click the calendar icon on any candidate to view their availability</p>
                <Button variant="outlined" size="small" className="mt-4" onClick={() => setActiveTab('candidates')}>
                  Go to Candidates
                </Button>
              </div>
            )}

            {/* ═══ ONBOARDING ══════════════════════════════════════════════ */}
            {activeTab === 'onboarding' && (
              <div className="text-center py-16 text-muted-foreground">
                <UserCog className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Candidate Onboarding</p>
                <p className="text-xs">Start onboarding a new candidate</p>
                <Button size="small" className="mt-4" onClick={() => setShowCandidateForm(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Onboard New Candidate
                </Button>
              </div>
            )}

            {/* ═══ CLIENTS ═════════════════════════════════════════════════ */}
            {activeTab === 'clients' && <ClientManagementPanel />}

            {/* ═══ SHIFTS ══════════════════════════════════════════════════ */}
            {activeTab === 'shifts' && (
              <div className="space-y-4">
                {selectedShift && (
                  <ShiftMatchingPanel 
                    shiftRequest={selectedShift}
                    open={!!selectedShiftForMatching}
                    onAssign={(placements) => {
                      console.log('Assigned placements:', placements);
                      setSelectedShiftForMatching(null);
                    }}
                    onClose={() => setSelectedShiftForMatching(null)} 
                  />
                )}
                  <>
                    {/* KPI Row */}
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                      <KPICard title="Total Shifts" value={mockShiftRequests.length} icon={Calendar} iconColor="bg-blue-100 text-blue-600" />
                      <KPICard title="Open" value={mockShiftRequests.filter(s => s.status === 'open').length} subtitle="Need attention" icon={AlertTriangle} iconColor="bg-amber-100 text-amber-600" />
                      <KPICard title="Filled" value={mockShiftRequests.filter(s => s.status === 'filled').length} icon={CheckCircle2} iconColor="bg-emerald-100 text-emerald-600" />
                      <KPICard title="Urgent" value={urgentShifts.length} subtitle="Need attention" icon={Zap} iconColor="bg-red-100 text-red-600" />
                    </div>

                    {shiftViewMode === 'list' && (
                      <>
                        {/* Status Tabs */}
                        <div className="flex items-center gap-1 border-b border-border">
                          {[
                            { value: 'all', label: 'All Shifts', count: mockShiftRequests.length },
                            { value: 'open', label: 'Open', count: mockShiftRequests.filter(s => s.status === 'open').length },
                            { value: 'partially_filled', label: 'Partial', count: mockShiftRequests.filter(s => s.status === 'partially_filled').length },
                            { value: 'filled', label: 'Filled', count: mockShiftRequests.filter(s => s.status === 'filled').length },
                          ].map(tab => (
                            <button
                              key={tab.value}
                              onClick={() => setShiftStatusFilter(tab.value)}
                              className={cn(
                                'flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors',
                                shiftStatusFilter === tab.value
                                  ? 'border-[#00acc1] text-[#00acc1]'
                                  : 'border-transparent text-muted-foreground hover:text-foreground'
                              )}
                            >
                              {tab.label}
                              <span className={cn(
                                'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                                shiftStatusFilter === tab.value
                                  ? 'bg-[#e0f7fa] text-[#00acc1]'
                                  : 'bg-muted text-muted-foreground'
                              )}>
                                {String(tab.count).padStart(2, '0')}
                              </span>
                            </button>
                          ))}
                        </div>

                        {/* Search */}
                        <div className="flex items-center gap-2">
                          <div className="relative max-w-[300px] flex-1">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input placeholder="Search shifts..." className="pl-8 h-9 text-xs" />
                          </div>
                          <Button variant="outlined" size="small" className="h-9">
                            <Filter className="h-3.5 w-3.5 mr-1.5" />
                            Filter
                            <ChevronDown className="h-3 w-3 ml-1" />
                          </Button>
                        </div>

                        {/* Shift Table */}
                        <div className="bg-background rounded-xl border border-border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/30 hover:bg-muted/30">
                                <TableHead className="text-[11px] font-semibold">Client</TableHead>
                                <TableHead className="text-[11px] font-semibold">Location</TableHead>
                                <TableHead className="text-[11px] font-semibold">Date ⇅</TableHead>
                                <TableHead className="text-[11px] font-semibold">Time</TableHead>
                                <TableHead className="text-[11px] font-semibold">Positions</TableHead>
                                <TableHead className="text-[11px] font-semibold">Urgency</TableHead>
                                <TableHead className="text-[11px] font-semibold">Status</TableHead>
                                <TableHead className="text-[11px] font-semibold">Rate</TableHead>
                                <TableHead className="text-[11px] font-semibold text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredShifts.map(shift => (
                                <TableRow key={shift.id} className="hover:bg-muted/20">
                                  <TableCell className="text-[13px] font-medium">{shift.clientName}</TableCell>
                                  <TableCell className="text-[12px] text-muted-foreground">{shift.locationName}</TableCell>
                                  <TableCell className="text-[12px]">{format(new Date(shift.date), 'MMM d, yyyy')}</TableCell>
                                  <TableCell className="text-[12px]">{shift.startTime}–{shift.endTime}</TableCell>
                                  <TableCell className="text-[12px]">{shift.filledPositions}/{shift.totalPositions}</TableCell>
                                  <TableCell>
                                    <span className={cn(
                                      'inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium',
                                      shift.urgency === 'critical' ? 'bg-red-100 text-red-700' :
                                      shift.urgency === 'urgent' ? 'bg-amber-100 text-amber-700' :
                                      'bg-emerald-50 text-emerald-700'
                                    )}>
                                      {shift.urgency}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <span className={cn(
                                      'inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border',
                                      shift.status === 'open' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                                      shift.status === 'filled' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' :
                                      shift.status === 'partially_filled' ? 'border-amber-200 text-amber-700 bg-amber-50' :
                                      'border-border text-muted-foreground'
                                    )}>
                                      {shift.status.replace('_', ' ')}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-[12px] text-emerald-600 font-medium">${shift.chargeRate}/hr</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      {(shift.status === 'open' || shift.status === 'partially_filled') && (
                                        <Button size="small" onClick={() => setSelectedShiftForMatching(shift.id)} className="h-7 text-xs">
                                          <Zap className="h-3 w-3 mr-1" /> Match
                                        </Button>
                                      )}
                                      <button className="p-1 rounded hover:bg-muted text-muted-foreground">
                                        <MoreVertical className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </>
                    )}

                    {shiftViewMode === 'calendar' && (
                      <ShiftCalendarView onSelectShift={(id) => setSelectedShiftForMatching(id)} />
                    )}
                   </>
              </div>
            )}

            {/* ═══ BROADCASTS ══════════════════════════════════════════════ */}
            {activeTab === 'broadcasts' && (
              <ShiftBroadcastInbox onMatchCandidates={() => setActiveTab('shifts')} />
            )}

            {/* ═══ TIMESHEETS ══════════════════════════════════════════════ */}
            {activeTab === 'timesheets' && <TimesheetApprovalWorkflow />}

            {/* ═══ INVOICES ════════════════════════════════════════════════ */}
            {activeTab === 'invoices' && (
              <div className="space-y-4">
                {/* KPI Row */}
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                  <KPICard title="Total Invoices" value={mockInvoices.length} icon={FileText} iconColor="bg-blue-100 text-blue-600" />
                  <KPICard title="Draft/Sent" value={mockInvoices.filter(i => i.status === 'draft' || i.status === 'sent').length} subtitle="Need attention" icon={Clock} iconColor="bg-amber-100 text-amber-600" />
                  <KPICard title="Overdue" value={overdueInvoices.length} subtitle="Need attention" icon={AlertTriangle} iconColor="bg-red-100 text-red-600" trend="down" trendValue={`-${overdueInvoices.length}`} />
                  <KPICard title="Total Value" value={`$${mockInvoices.reduce((a, i) => a + i.total, 0).toLocaleString()}`} icon={DollarSign} iconColor="bg-emerald-100 text-emerald-600" />
                </div>

                {/* Invoice Table */}
                <div className="bg-background rounded-xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="text-[11px] font-semibold">Invoice #</TableHead>
                        <TableHead className="text-[11px] font-semibold">Client</TableHead>
                        <TableHead className="text-[11px] font-semibold">Period</TableHead>
                        <TableHead className="text-[11px] font-semibold">Amount</TableHead>
                        <TableHead className="text-[11px] font-semibold">Margin</TableHead>
                        <TableHead className="text-[11px] font-semibold">Status</TableHead>
                        <TableHead className="text-[11px] font-semibold">Due Date</TableHead>
                        <TableHead className="text-[11px] font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockInvoices.map(invoice => (
                        <TableRow key={invoice.id} className="hover:bg-muted/20">
                          <TableCell className="text-[13px] font-medium">{invoice.invoiceNumber}</TableCell>
                          <TableCell className="text-[12px] text-muted-foreground">{invoice.clientName}</TableCell>
                          <TableCell className="text-[12px]">
                            {format(new Date(invoice.periodStart), 'MMM d')}–{format(new Date(invoice.periodEnd), 'MMM d')}
                          </TableCell>
                          <TableCell className="text-[13px] font-semibold">${invoice.total.toLocaleString()}</TableCell>
                          <TableCell className="text-[12px] text-emerald-600">{invoice.marginPercentage}%</TableCell>
                          <TableCell>
                            <span className={cn(
                              'inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border',
                              invoice.status === 'paid' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' :
                              invoice.status === 'overdue' ? 'border-red-200 text-red-700 bg-red-50' :
                              invoice.status === 'sent' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                              'border-border text-muted-foreground bg-muted/50'
                            )}>
                              {invoice.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-[12px]">{format(new Date(invoice.dueDate), 'MMM d, yyyy')}</TableCell>
                          <TableCell className="text-right">
                            <button className="p-1 rounded hover:bg-muted text-muted-foreground">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* ═══ PROFILE ═════════════════════════════════════════════════ */}
            {activeTab === 'profile' && (
              <div className="space-y-4 max-w-4xl">
                <div className="bg-background rounded-xl border border-border p-5">
                  <h2 className="text-sm font-semibold mb-4">Agency Information</h2>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {[
                      { label: 'Legal Name', value: mockAgency.name },
                      { label: 'ABN', value: mockAgency.abn },
                      { label: 'Primary Contact', value: mockAgency.primaryContactName },
                      { label: 'Email', value: mockAgency.primaryContactEmail },
                      { label: 'Phone', value: mockAgency.primaryContactPhone },
                      { label: 'Address', value: `${mockAgency.address?.street || ''}, ${mockAgency.address?.suburb || ''} ${mockAgency.address?.state || ''} ${mockAgency.address?.postcode || ''}` },
                    ].map(item => (
                      <div key={item.label}>
                        <p className="text-[11px] text-muted-foreground font-medium mb-0.5">{item.label}</p>
                        <p className="text-[13px]">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-background rounded-xl border border-border p-5">
                  <h2 className="text-sm font-semibold mb-4">Compliance & Certifications</h2>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 mb-4">
                    <div className={cn(
                      'h-12 w-12 rounded-full flex items-center justify-center',
                      mockAgency.complianceScore >= 90 ? 'bg-emerald-100' : 'bg-amber-100'
                    )}>
                      <span className={cn(
                        'text-lg font-bold',
                        mockAgency.complianceScore >= 90 ? 'text-emerald-700' : 'text-amber-700'
                      )}>
                        {mockAgency.complianceScore}
                      </span>
                    </div>
                    <div>
                      <p className="text-[13px] font-medium">Compliance Score</p>
                      <p className="text-[11px] text-muted-foreground">
                        {mockAgency.complianceScore >= 90 ? 'Excellent standing' : 'Some items need attention'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {(mockAgency.complianceDocuments || []).slice(0, 4).map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-[12px]">{doc.name || doc.type?.replace(/_/g, ' ')}</span>
                        </div>
                        <span className={cn(
                          'inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium',
                          doc.status === 'valid' ? 'bg-emerald-100 text-emerald-700' :
                          doc.status === 'expiring_soon' ? 'bg-amber-100 text-amber-700' :
                          'bg-muted text-muted-foreground'
                        )}>
                          {doc.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ SETTINGS ════════════════════════════════════════════════ */}
            {activeTab === 'settings' && (
              <div className="text-center py-16 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Agency Settings</p>
                <p className="text-xs">Configure notifications, integrations, and preferences</p>
                <Button variant="outlined" size="small" className="mt-4" onClick={() => setShowOnboardingWizard(true)}>
                  Open Setup Wizard
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ─── Modals ──────────────────────────────────────────────────────── */}
      <AgencyOnboardingWizard 
        open={showOnboardingWizard} 
        onClose={() => setShowOnboardingWizard(false)}
        onComplete={(data) => {
          console.log('Agency onboarding completed:', data);
          setShowOnboardingWizard(false);
        }}
      />
      
      <CandidateOnboardingForm 
        open={showCandidateForm} 
        onClose={() => setShowCandidateForm(false)}
        onComplete={(candidate) => {
          console.log('Candidate onboarding completed:', candidate);
          setShowCandidateForm(false);
        }}
      />
      
      <InvoiceGenerator 
        open={showInvoiceGenerator} 
        onClose={() => setShowInvoiceGenerator(false)}
        onSave={(invoice) => {
          console.log('Invoice saved:', invoice);
          setShowInvoiceGenerator(false);
        }}
      />
      
      {selectedCandidateForAvailability && (
        <CandidateAvailabilityCalendar
          open={showAvailabilityCalendar}
          onClose={() => {
            setShowAvailabilityCalendar(false);
            setSelectedCandidateForAvailability(null);
          }}
          candidateId={selectedCandidateForAvailability.id}
          candidateName={selectedCandidateForAvailability.name}
          onSave={(data) => {
            console.log('Availability saved:', data);
            setShowAvailabilityCalendar(false);
            setSelectedCandidateForAvailability(null);
          }}
        />
      )}

      <CandidateBulkImport
        open={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onImport={(candidates) => {
          console.log('Imported candidates:', candidates);
        }}
      />
    </div>
  );
};

export default AgencyPortal;
