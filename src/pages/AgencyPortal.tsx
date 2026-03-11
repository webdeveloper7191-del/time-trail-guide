import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/mui/Button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, Users, Calendar, FileText, BarChart3, 
  Shield, AlertTriangle, TrendingUp, Clock, CheckCircle2,
  ArrowLeft, Plus, UserPlus, Zap, Receipt, ClipboardCheck, Briefcase,
  ArrowUpRight, ArrowDownRight, Search, Filter, Bell, Settings,
  Star, MapPin, DollarSign, Activity, Eye, MoreVertical,
  RefreshCw, Download, ChevronRight, Percent, Target, Upload,
  CalendarDays, List
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
import rosteredLogo from '@/assets/rostered-logo.png';
import { cn } from '@/lib/utils';

// ─── Tab Configuration ───────────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'candidates', label: 'Candidates', icon: Users },
  { id: 'clients', label: 'Clients', icon: Briefcase },
  { id: 'shifts', label: 'Shifts', icon: Calendar },
  { id: 'timesheets', label: 'Timesheets', icon: ClipboardCheck },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'profile', label: 'Profile', icon: Building2 },
] as const;

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KPICard({
  title, value, subtitle, icon: Icon, trend, trendValue, variant = 'default',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: typeof TrendingUp;
  trend?: 'up' | 'down';
  trendValue?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
}) {
  const iconBgMap = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-emerald-500/10 text-emerald-600',
    warning: 'bg-amber-500/10 text-amber-600',
    error: 'bg-destructive/10 text-destructive',
  };

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className={cn('p-2 rounded-lg', iconBgMap[variant])}>
            <Icon className="h-4 w-4" />
          </div>
          {trend && trendValue && (
            <Badge
              variant="secondary"
              className={cn(
                'text-[10px] px-1.5 py-0 h-5 font-medium',
                trend === 'up' ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
              )}
            >
              {trend === 'up' ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
              {trendValue}
            </Badge>
          )}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">{title}</p>
          {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Mini Stat ───────────────────────────────────────────────────────────────
function MiniStat({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Star }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold ml-auto">{value}</span>
    </div>
  );
}

const AgencyPortal = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
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

  const complianceColor = mockAgency.complianceScore >= 90 ? 'text-emerald-600' : 
    mockAgency.complianceScore >= 70 ? 'text-amber-600' : 'text-destructive';

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <header className="border-b bg-background sticky top-0 z-30">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="small" onClick={() => navigate('/')} className="h-8 w-8 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <img src={rosteredLogo} alt="Rostered.ai" className="h-7" />
              <div>
                <h1 className="text-base font-semibold tracking-tight leading-tight">
                  {mockAgency.tradingName || mockAgency.name}
                </h1>
                <p className="text-[11px] text-muted-foreground leading-tight">Agency Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                <span className="text-[11px] font-medium text-emerald-700">Active</span>
              </div>
              <div className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md border',
                mockAgency.complianceScore >= 90 
                  ? 'bg-emerald-50 border-emerald-200' 
                  : 'bg-amber-50 border-amber-200'
              )}>
                <Shield className={cn('h-3 w-3', complianceColor)} />
                <span className={cn('text-[11px] font-medium', complianceColor)}>
                  {mockAgency.complianceScore}% Compliant
                </span>
              </div>
              <Button variant="outlined" size="small" onClick={() => setShowOnboardingWizard(true)}>
                <Settings className="h-3.5 w-3.5 mr-1.5" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* ─── Tab Bar ──────────────────────────────────────────────────── */}
        <div className="px-6">
          <nav className="flex gap-0 -mb-px">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap',
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ─── Main Content ────────────────────────────────────────────────── */}
      <main className="px-6 py-5 max-w-[1400px] mx-auto">

        {/* ═══ DASHBOARD TAB ═══════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5">
            {/* KPI Row */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
              <KPICard
                title="Fill Rate"
                value={`${mockAgencyAnalytics.fillRate}%`}
                subtitle={`${mockAgencyAnalytics.totalShiftsFilled} of ${mockAgencyAnalytics.totalShiftsRequested} shifts`}
                icon={Target}
                trend="up"
                trendValue="+3.2%"
                variant="success"
              />
              <KPICard
                title="Avg Response Time"
                value={`${mockAgencyAnalytics.avgTimeToFillMinutes}m`}
                subtitle="Time to fill"
                icon={Clock}
                trend="down"
                trendValue="-5m"
                variant="success"
              />
              <KPICard
                title="Gross Margin"
                value={`$${mockAgencyAnalytics.grossProfit.toLocaleString()}`}
                subtitle={`${mockAgencyAnalytics.marginPercentage}% margin`}
                icon={DollarSign}
                trend="up"
                trendValue="+8.1%"
                variant="default"
              />
              <KPICard
                title="Active Candidates"
                value={mockAgencyAnalytics.totalActiveCandidates}
                subtitle={`${mockAgencyAnalytics.avgWorkerUtilization}% utilization`}
                icon={Users}
                variant="default"
              />
            </div>

            {/* Alerts Banner */}
            {(urgentShifts.length > 0 || overdueInvoices.length > 0) && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <div className="flex-1 space-y-1">
                      <p className="text-xs font-semibold text-amber-800">Attention Required</p>
                      <div className="flex flex-wrap gap-2">
                        {urgentShifts.length > 0 && (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-[10px]">
                            {urgentShifts.length} urgent shift{urgentShifts.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {overdueInvoices.length > 0 && (
                          <Badge variant="secondary" className="bg-red-100 text-red-800 text-[10px]">
                            {overdueInvoices.length} overdue invoice{overdueInvoices.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="small" onClick={() => setActiveTab('shifts')} className="text-xs">
                      View <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Secondary Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <MiniStat label="Open Shifts" value={openShifts.length} icon={Calendar} />
              <MiniStat label="Pending Invoices" value={mockInvoices.filter(i => i.status === 'draft' || i.status === 'sent').length} icon={FileText} />
              <MiniStat label="Total Revenue" value={`$${mockAgencyAnalytics.totalRevenue.toLocaleString()}`} icon={DollarSign} />
              <MiniStat label="Active Clients" value={mockAgencyAnalytics.totalActiveClients} icon={Star} />
            </div>

            {/* Two Column Layout */}
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Open Shifts */}
              <Card>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">Open Shifts</CardTitle>
                      <CardDescription className="text-[11px]">{openShifts.length} shifts need candidates</CardDescription>
                    </div>
                    <Button variant="ghost" size="small" onClick={() => setActiveTab('shifts')} className="text-xs">
                      View All <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-1.5">
                  {openShifts.slice(0, 4).map(shift => (
                    <div
                      key={shift.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border bg-background hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedShiftForMatching(shift.id);
                        setActiveTab('shifts');
                      }}
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
                            {format(new Date(shift.date), 'MMM d')} · {shift.startTime} - {shift.endTime}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={shift.urgency === 'critical' ? 'destructive' : 'secondary'}
                          className="text-[10px] h-5"
                        >
                          {shift.filledPositions}/{shift.totalPositions}
                        </Badge>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                  {openShifts.length === 0 && (
                    <div className="text-center py-6 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
                      All shifts filled
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Performers */}
              <Card>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">Top Performers</CardTitle>
                      <CardDescription className="text-[11px]">This month's best workers</CardDescription>
                    </div>
                    <Button variant="ghost" size="small" onClick={() => setActiveTab('candidates')} className="text-xs">
                      View All <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-1.5">
                  {mockAgencyAnalytics.topPerformers.map((performer, idx) => (
                    <div key={performer.candidateId} className="flex items-center gap-3 p-2.5 rounded-lg border bg-background">
                      <div className={cn(
                        'h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold',
                        idx === 0 ? 'bg-amber-100 text-amber-700' :
                        idx === 1 ? 'bg-slate-100 text-slate-600' :
                        idx === 2 ? 'bg-orange-100 text-orange-700' :
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
                </CardContent>
              </Card>
            </div>

            {/* Broadcast Inbox */}
            <ShiftBroadcastInbox
              onMatchCandidates={(id) => {
                setActiveTab('shifts');
              }}
            />
          </div>
        )}

        {/* ═══ CANDIDATES TAB ══════════════════════════════════════════════ */}
        {activeTab === 'candidates' && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative max-w-xs flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search candidates..."
                    value={candidateSearch}
                    onChange={e => setCandidateSearch(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                <Select value={candidateStatusFilter} onValueChange={setCandidateStatusFilter}>
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <Filter className="h-3 w-3 mr-1.5 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="on_shift">On Shift</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setShowBulkImport(true)} variant="outlined" size="small">
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Import
                </Button>
                <Button onClick={() => setShowCandidateForm(true)} size="small">
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                  Add Candidate
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2">
              <MiniStat label="Total" value={mockCandidates.length} icon={Users} />
              <MiniStat label="Available" value={mockCandidates.filter(c => c.status === 'available').length} icon={CheckCircle2} />
              <MiniStat label="On Shift" value={mockCandidates.filter(c => c.status === 'on_shift').length} icon={Clock} />
              <MiniStat label="Avg Rating" value={(mockCandidates.reduce((a, c) => a + c.averageRating, 0) / mockCandidates.length).toFixed(1)} icon={Star} />
            </div>

            {/* Candidate List */}
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredCandidates.map(candidate => (
                    <div key={candidate.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-primary">
                          {candidate.firstName[0]}{candidate.lastName[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{candidate.firstName} {candidate.lastName}</p>
                          <Badge
                            variant={candidate.status === 'available' ? 'default' : 'secondary'}
                            className={cn(
                              'text-[10px] h-5',
                              candidate.status === 'available' && 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                            )}
                          >
                            {candidate.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{candidate.primaryRole}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                          <span className="text-xs font-medium">{candidate.averageRating}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {candidate.totalShiftsCompleted} shifts
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCandidateForAvailability({ id: candidate.id, name: `${candidate.firstName} ${candidate.lastName}` });
                            setShowAvailabilityCalendar(true);
                          }}
                          className="h-7 w-7 p-0"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredCandidates.length === 0 && (
                    <div className="text-center py-10 text-xs text-muted-foreground">
                      No candidates match your filters
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══ CLIENTS TAB ═════════════════════════════════════════════════ */}
        {activeTab === 'clients' && <ClientManagementPanel />}

        {/* ═══ SHIFTS TAB ══════════════════════════════════════════════════ */}
        {activeTab === 'shifts' && (
          <div className="space-y-4">
            {selectedShift ? (
              <div className="space-y-4">
                <Button variant="ghost" size="small" onClick={() => setSelectedShiftForMatching(null)}>
                  <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                  Back to Shifts
                </Button>
                <ShiftMatchingPanel 
                  shiftRequest={selectedShift} 
                  onAssign={(placements) => {
                    console.log('Assigned placements:', placements);
                    setSelectedShiftForMatching(null);
                  }}
                  onClose={() => setSelectedShiftForMatching(null)} 
                />
              </div>
            ) : (
              <>
                {/* Toolbar */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {shiftViewMode === 'list' && (
                      <Select value={shiftStatusFilter} onValueChange={setShiftStatusFilter}>
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <Filter className="h-3 w-3 mr-1.5 text-muted-foreground" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="partially_filled">Partially Filled</SelectItem>
                          <SelectItem value="filled">Filled</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-md border bg-background">
                      <button
                        onClick={() => setShiftViewMode('list')}
                        className={cn(
                          'flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-l-md transition-colors',
                          shiftViewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <List className="h-3 w-3" /> List
                      </button>
                      <button
                        onClick={() => setShiftViewMode('calendar')}
                        className={cn(
                          'flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-r-md transition-colors',
                          shiftViewMode === 'calendar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <CalendarDays className="h-3 w-3" /> Calendar
                      </button>
                    </div>
                  </div>
                </div>

                {shiftViewMode === 'list' && (
                  <>
                {/* Stats */}
                <div className="grid grid-cols-4 gap-2">
                  <MiniStat label="Total" value={mockShiftRequests.length} icon={Calendar} />
                  <MiniStat label="Open" value={mockShiftRequests.filter(s => s.status === 'open').length} icon={AlertTriangle} />
                  <MiniStat label="Filled" value={mockShiftRequests.filter(s => s.status === 'filled').length} icon={CheckCircle2} />
                  <MiniStat label="Urgent" value={urgentShifts.length} icon={Zap} />
                </div>

                {/* Shift List */}
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {filteredShifts.map(shift => (
                        <div key={shift.id} className="px-4 py-3 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                'h-2 w-2 rounded-full',
                                shift.urgency === 'critical' ? 'bg-destructive' :
                                shift.urgency === 'urgent' ? 'bg-amber-500' :
                                'bg-emerald-500'
                              )} />
                              <p className="text-sm font-medium">{shift.clientName}</p>
                              <span className="text-[10px] text-muted-foreground">· {shift.locationName}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant={shift.urgency === 'critical' ? 'destructive' : 'outline'}
                                className="text-[10px] h-5"
                              >
                                {shift.urgency}
                              </Badge>
                              <Badge variant="secondary" className="text-[10px] h-5">
                                {shift.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(shift.date), 'MMM d, yyyy')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {shift.startTime} - {shift.endTime}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {shift.filledPositions}/{shift.totalPositions}
                              </span>
                              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                <DollarSign className="h-3 w-3" />
                                ${shift.chargeRate}/hr
                              </span>
                            </div>
                            {(shift.status === 'open' || shift.status === 'partially_filled') && (
                              <Button size="small" onClick={() => setSelectedShiftForMatching(shift.id)} className="h-7 text-xs">
                                <Zap className="h-3 w-3 mr-1" />
                                Match
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                  </>
                )}

                {shiftViewMode === 'calendar' && (
                  <ShiftCalendarView
                    onSelectShift={(id) => setSelectedShiftForMatching(id)}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* ═══ TIMESHEETS TAB ══════════════════════════════════════════════ */}
        {activeTab === 'timesheets' && <TimesheetApprovalWorkflow />}

        {/* ═══ INVOICES TAB ════════════════════════════════════════════════ */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <div className="grid grid-cols-4 gap-2 flex-1 mr-4">
              <MiniStat label="Total" value={mockInvoices.length} icon={FileText} />
                <MiniStat label="Draft/Sent" value={mockInvoices.filter(i => i.status === 'draft' || i.status === 'sent').length} icon={Clock} />
                <MiniStat label="Overdue" value={overdueInvoices.length} icon={AlertTriangle} />
                <MiniStat label="Total Value" value={`$${mockInvoices.reduce((a, i) => a + i.total, 0).toLocaleString()}`} icon={DollarSign} />
              </div>
              <Button onClick={() => setShowInvoiceGenerator(true)} size="small">
                <Receipt className="h-3.5 w-3.5 mr-1.5" />
                Generate Invoice
              </Button>
            </div>

            {/* Invoice List */}
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {mockInvoices.map(invoice => (
                    <div key={invoice.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className={cn(
                        'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
                        invoice.status === 'paid' ? 'bg-emerald-100' :
                        invoice.status === 'overdue' ? 'bg-red-100' :
                        'bg-muted'
                      )}>
                        <FileText className={cn(
                          'h-4 w-4',
                          invoice.status === 'paid' ? 'text-emerald-600' :
                          invoice.status === 'overdue' ? 'text-red-600' :
                          'text-muted-foreground'
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{invoice.invoiceNumber}</p>
                          <Badge
                            variant={invoice.status === 'paid' ? 'default' : invoice.status === 'overdue' ? 'destructive' : 'secondary'}
                            className={cn('text-[10px] h-5', invoice.status === 'paid' && 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100')}
                          >
                            {invoice.status}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{invoice.clientName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold">${invoice.total.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(invoice.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══ PROFILE TAB ═════════════════════════════════════════════════ */}
        {activeTab === 'profile' && (
          <div className="space-y-4 max-w-3xl">
            <Card>
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">Agency Details</CardTitle>
                    <CardDescription className="text-[11px]">Your agency profile and compliance information</CardDescription>
                  </div>
                  <Button variant="outlined" size="small" onClick={() => setShowOnboardingWizard(true)}>
                    Edit Profile
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { label: 'Legal Name', value: mockAgency.name },
                    { label: 'ABN', value: mockAgency.abn },
                    { label: 'Primary Contact', value: mockAgency.primaryContactName },
                    { label: 'Email', value: mockAgency.primaryContactEmail },
                    { label: 'Phone', value: mockAgency.primaryContactPhone },
                    { label: 'Address', value: `${mockAgency.address?.street || ''}, ${mockAgency.address?.suburb || ''} ${mockAgency.address?.state || ''} ${mockAgency.address?.postcode || ''}` },
                  ].map(item => (
                    <div key={item.label} className="space-y-0.5">
                      <p className="text-[11px] text-muted-foreground font-medium">{item.label}</p>
                      <p className="text-sm">{item.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Compliance */}
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold">Compliance & Certifications</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-3">
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
                    <p className="text-sm font-medium">Compliance Score</p>
                    <p className="text-[11px] text-muted-foreground">
                      {mockAgency.complianceScore >= 90 ? 'Excellent standing' : 'Some items need attention'}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {(mockAgency.complianceDocuments || []).slice(0, 4).map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded border">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs">{doc.type?.replace(/_/g, ' ') || `Document ${idx + 1}`}</span>
                      </div>
                      <Badge variant={doc.status === 'valid' ? 'default' : 'secondary'} className="text-[10px] h-5">
                        {doc.status || 'pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

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
    </div>
  );
};

export default AgencyPortal;
