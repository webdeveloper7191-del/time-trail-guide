import { useState } from 'react';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Download, BarChart3, FileText, TrendingUp, Users, Clock, Shield, DollarSign, Calendar, AlertTriangle, Layers, Scale, RotateCcw, MapPin, Activity, CheckSquare, Radio, ClipboardList, AlarmClock, Coffee, FileWarning, Timer, Building2, UserX, UserPlus, Award, CalendarCheck, FileCheck, Briefcase, GraduationCap, BarChart2, Gauge, LayoutGrid, Wallet, Grid3X3, ShieldAlert, Ratio, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { reportSummaryMetrics } from '@/data/mockReportData';

// Roster report components
import { StaffUtilisationReport } from '@/components/reports/StaffUtilisationReport';
import { OvertimeFatigueReport } from '@/components/reports/OvertimeFatigueReport';
import { OpenShiftFillReport } from '@/components/reports/OpenShiftFillReport';
import { AgencyUsageReport } from '@/components/reports/AgencyUsageReport';
import { CoverageGapReport } from '@/components/reports/CoverageGapReport';
import { AreaCombiningSavingsReport } from '@/components/reports/AreaCombiningSavingsReport';
import { FairnessReport } from '@/components/reports/FairnessReport';
import { RecurringPatternReport } from '@/components/reports/RecurringPatternReport';
import { MultiLocationDashboard } from '@/components/reports/MultiLocationDashboard';
import { DemandVsActualsDashboard } from '@/components/reports/DemandVsActualsDashboard';

// Timesheet report components
import { TimesheetApprovalDashboard } from '@/components/reports/TimesheetApprovalDashboard';
import { RealTimeAttendanceDashboard } from '@/components/reports/RealTimeAttendanceDashboard';
import { WeeklyTimesheetReport } from '@/components/reports/WeeklyTimesheetReport';
import { LatePunctualityReport } from '@/components/reports/LatePunctualityReport';
import { BreakComplianceReport } from '@/components/reports/BreakComplianceReport';
import { TimesheetExceptionReport } from '@/components/reports/TimesheetExceptionReport';
import { ApprovalSLAReport } from '@/components/reports/ApprovalSLAReport';
import { OvertimeByLocationReport } from '@/components/reports/OvertimeByLocationReport';
import { AttendanceTrendReport } from '@/components/reports/AttendanceTrendReport';

// Workforce report components
import { WorkforceOverviewDashboard } from '@/components/reports/WorkforceOverviewDashboard';
import { OnboardingPipelineDashboard } from '@/components/reports/OnboardingPipelineDashboard';
import { HeadcountFTEReport } from '@/components/reports/HeadcountFTEReport';
import { TurnoverRetentionReport } from '@/components/reports/TurnoverRetentionReport';
import { OnboardingCompletionReport } from '@/components/reports/OnboardingCompletionReport';
import { QualificationExpiryReport } from '@/components/reports/QualificationExpiryReport';
import { AvailabilityVsScheduledReport } from '@/components/reports/AvailabilityVsScheduledReport';
import { ContractDistributionReport } from '@/components/reports/ContractDistributionReport';
import { SkillsMatrixReport } from '@/components/reports/SkillsMatrixReport';

// Location Management report components
import { MultiSiteOpsDashboard } from '@/components/reports/MultiSiteOpsDashboard';
import { CapacityUtilDashboard } from '@/components/reports/CapacityUtilDashboard';
import { BudgetVsActualsReport } from '@/components/reports/BudgetVsActualsReport';
import { AreaUtilReport } from '@/components/reports/AreaUtilReport';
import { ComplianceViolationReport } from '@/components/reports/ComplianceViolationReport';
import { StaffingRatioComplianceReport } from '@/components/reports/StaffingRatioComplianceReport';
import { CrossLocationDeploymentReport } from '@/components/reports/CrossLocationDeploymentReport';

type ReportCategory = 'all' | 'dashboards' | 'reports' | 'roster' | 'timesheets' | 'workforce' | 'locations';

interface ReportItem {
  id: string;
  title: string;
  description: string;
  category: 'dashboard' | 'report';
  module: 'roster' | 'timesheets' | 'workforce' | 'locations';
  icon: React.ElementType;
  tags: string[];
  component: React.ComponentType;
}

const reportItems: ReportItem[] = [
  // Roster & Scheduling
  { id: 'multi-location', title: 'Multi-Location Overview', description: 'Real-time staffing, compliance, and budget status across all locations', category: 'dashboard', module: 'roster', icon: MapPin, tags: ['locations', 'compliance', 'budget'], component: MultiLocationDashboard },
  { id: 'demand-vs-actuals', title: 'Demand vs Actuals', description: 'Compare forecasted demand against actual attendance and staffing', category: 'dashboard', module: 'roster', icon: Activity, tags: ['demand', 'forecast', 'accuracy'], component: DemandVsActualsDashboard },
  { id: 'staff-utilisation', title: 'Staff Utilisation Report', description: 'Hours scheduled vs capacity with utilisation percentages per staff member', category: 'report', module: 'roster', icon: Users, tags: ['utilisation', 'hours', 'capacity'], component: StaffUtilisationReport },
  { id: 'overtime-fatigue', title: 'Overtime & Fatigue Risk', description: 'Overtime hours, fatigue scores, and rest compliance across the workforce', category: 'report', module: 'roster', icon: AlertTriangle, tags: ['overtime', 'fatigue', 'compliance'], component: OvertimeFatigueReport },
  { id: 'open-shift-fill', title: 'Open Shift Fill Rate', description: 'Track how quickly and effectively open shifts are being filled', category: 'report', module: 'roster', icon: Clock, tags: ['open shifts', 'fill rate', 'agency'], component: OpenShiftFillReport },
  { id: 'agency-usage', title: 'Agency Usage & Cost', description: 'Agency partner performance, costs, and quality metrics', category: 'report', module: 'roster', icon: DollarSign, tags: ['agency', 'cost', 'performance'], component: AgencyUsageReport },
  { id: 'coverage-gap', title: 'Shift Coverage Gap Analysis', description: 'Identify time slots and areas with insufficient staff coverage', category: 'report', module: 'roster', icon: Shield, tags: ['coverage', 'gaps', 'compliance'], component: CoverageGapReport },
  { id: 'area-combining', title: 'Area Combining Savings', description: 'Financial impact and operational data from area combining events', category: 'report', module: 'roster', icon: Layers, tags: ['savings', 'area combining', 'cost'], component: AreaCombiningSavingsReport },
  { id: 'fairness', title: 'Schedule Fairness Report', description: 'Distribution equity of shifts including weekends, early, and late assignments', category: 'report', module: 'roster', icon: Scale, tags: ['fairness', 'equity', 'distribution'], component: FairnessReport },
  { id: 'recurring-pattern', title: 'Recurring Pattern Adherence', description: 'Track how well recurring shift patterns are being followed', category: 'report', module: 'roster', icon: RotateCcw, tags: ['recurring', 'patterns', 'adherence'], component: RecurringPatternReport },
  // Timesheets & Attendance
  { id: 'ts-approval-pipeline', title: 'Approval Pipeline Dashboard', description: 'Timesheet approval queue with status tracking, SLA monitoring, and tier escalation', category: 'dashboard', module: 'timesheets', icon: CheckSquare, tags: ['approval', 'pipeline', 'timesheet'], component: TimesheetApprovalDashboard },
  { id: 'ts-realtime-attendance', title: 'Real-Time Attendance', description: 'Live view of who is clocked in, on break, absent, or late right now', category: 'dashboard', module: 'timesheets', icon: Radio, tags: ['attendance', 'live', 'clock-in'], component: RealTimeAttendanceDashboard },
  { id: 'ts-weekly-summary', title: 'Weekly Timesheet Summary', description: 'Aggregated hours, overtime, and approval status per staff member', category: 'report', module: 'timesheets', icon: ClipboardList, tags: ['weekly', 'summary', 'hours'], component: WeeklyTimesheetReport },
  { id: 'ts-late-punctuality', title: 'Late Clock-In / Early Clock-Out', description: 'Track punctuality issues with late arrivals and early departures', category: 'report', module: 'timesheets', icon: AlarmClock, tags: ['late', 'punctuality', 'clock-in'], component: LatePunctualityReport },
  { id: 'ts-break-compliance', title: 'Break Compliance Report', description: 'Monitor break duration compliance against required minimums', category: 'report', module: 'timesheets', icon: Coffee, tags: ['breaks', 'compliance', 'duration'], component: BreakComplianceReport },
  { id: 'ts-exceptions', title: 'Timesheet Exception Report', description: 'Manual edits, manager overrides, and retroactive entries audit trail', category: 'report', module: 'timesheets', icon: FileWarning, tags: ['exceptions', 'edits', 'overrides'], component: TimesheetExceptionReport },
  { id: 'ts-approval-sla', title: 'Approval SLA Report', description: 'Approver turnaround times and SLA compliance rates', category: 'report', module: 'timesheets', icon: Timer, tags: ['sla', 'turnaround', 'approval'], component: ApprovalSLAReport },
  { id: 'ts-overtime-location', title: 'Overtime by Location', description: 'Overtime hours and costs broken down by location and department', category: 'report', module: 'timesheets', icon: Building2, tags: ['overtime', 'location', 'department'], component: OvertimeByLocationReport },
  { id: 'ts-attendance-trend', title: 'Attendance Trend Report', description: 'Absenteeism patterns, attendance rates, and absence type breakdown', category: 'report', module: 'timesheets', icon: UserX, tags: ['attendance', 'trends', 'absenteeism'], component: AttendanceTrendReport },
  // Workforce Management
  { id: 'wf-overview', title: 'Workforce Overview Dashboard', description: 'Headcount, FTE, turnover rates, and contract type breakdown across locations', category: 'dashboard', module: 'workforce', icon: Users, tags: ['headcount', 'turnover', 'workforce'], component: WorkforceOverviewDashboard },
  { id: 'wf-onboarding-pipeline', title: 'Onboarding Pipeline Dashboard', description: 'Track onboarding progress, completion rates, and overdue items', category: 'dashboard', module: 'workforce', icon: UserPlus, tags: ['onboarding', 'pipeline', 'progress'], component: OnboardingPipelineDashboard },
  { id: 'wf-headcount-fte', title: 'Staff Headcount & FTE Report', description: 'Headcount and FTE breakdown by department, location, and contract type', category: 'report', module: 'workforce', icon: BarChart2, tags: ['headcount', 'fte', 'department'], component: HeadcountFTEReport },
  { id: 'wf-turnover', title: 'Staff Turnover & Retention', description: 'Monthly hires, terminations, turnover rates, and retention trends', category: 'report', module: 'workforce', icon: TrendingUp, tags: ['turnover', 'retention', 'trends'], component: TurnoverRetentionReport },
  { id: 'wf-onboarding-completion', title: 'Onboarding Completion Rate', description: 'Completion rates, average days, and overdue onboarding tasks', category: 'report', module: 'workforce', icon: FileCheck, tags: ['onboarding', 'completion', 'rate'], component: OnboardingCompletionReport },
  { id: 'wf-qualifications', title: 'Qualification & Certification Expiry', description: 'Track qualification validity, expiring soon, and expired certifications', category: 'report', module: 'workforce', icon: Award, tags: ['qualifications', 'certifications', 'expiry'], component: QualificationExpiryReport },
  { id: 'wf-availability', title: 'Availability vs Scheduled', description: 'Compare staff availability against scheduled hours and utilisation', category: 'report', module: 'workforce', icon: CalendarCheck, tags: ['availability', 'scheduled', 'utilisation'], component: AvailabilityVsScheduledReport },
  { id: 'wf-contracts', title: 'Contract Type Distribution', description: 'Distribution of full-time, part-time, casual, and contractor staff', category: 'report', module: 'workforce', icon: Briefcase, tags: ['contract', 'distribution', 'employment'], component: ContractDistributionReport },
  { id: 'wf-skills', title: 'Staff Skills Matrix', description: 'Skills coverage, proficiency levels, and certification counts per staff', category: 'report', module: 'workforce', icon: GraduationCap, tags: ['skills', 'matrix', 'certifications'], component: SkillsMatrixReport },
  // Location Management
  { id: 'loc-multi-site', title: 'Multi-Site Operations Dashboard', description: 'Real-time operational status, compliance, and alerts across all locations', category: 'dashboard', module: 'locations', icon: LayoutGrid, tags: ['multi-site', 'operations', 'status'], component: MultiSiteOpsDashboard },
  { id: 'loc-capacity', title: 'Capacity Utilisation Dashboard', description: 'Occupancy trends, peak usage, and capacity planning across areas', category: 'dashboard', module: 'locations', icon: Gauge, tags: ['capacity', 'utilisation', 'occupancy'], component: CapacityUtilDashboard },
  { id: 'loc-budget', title: 'Budget vs Actuals Report', description: 'Compare budgeted vs actual spending by location and category', category: 'report', module: 'locations', icon: Wallet, tags: ['budget', 'actuals', 'variance'], component: BudgetVsActualsReport },
  { id: 'loc-area-util', title: 'Area Utilisation Report', description: 'Individual area usage, occupancy rates, and operating hour efficiency', category: 'report', module: 'locations', icon: Grid3X3, tags: ['area', 'utilisation', 'occupancy'], component: AreaUtilReport },
  { id: 'loc-violations', title: 'Compliance Violation Summary', description: 'All compliance violations by location with severity and resolution status', category: 'report', module: 'locations', icon: ShieldAlert, tags: ['compliance', 'violations', 'severity'], component: ComplianceViolationReport },
  { id: 'loc-staffing-ratio', title: 'Staffing Ratio Compliance (NQF)', description: 'Ratio checks across areas and time slots with breach identification', category: 'report', module: 'locations', icon: Ratio, tags: ['ratio', 'nqf', 'staffing', 'compliance'], component: StaffingRatioComplianceReport },
  { id: 'loc-cross-deploy', title: 'Cross-Location Deployment', description: 'Staff movement between locations with hours and deployment frequency', category: 'report', module: 'locations', icon: ArrowLeftRight, tags: ['cross-location', 'deployment', 'transfer'], component: CrossLocationDeploymentReport },
];
const summaryCards = [
  { label: 'Avg Utilisation', value: `${reportSummaryMetrics.avgUtilisation}%`, icon: Users, trend: '+2.3%' },
  { label: 'Overtime Hours', value: `${reportSummaryMetrics.totalOvertimeHours}h`, icon: Clock, trend: '-4h', negative: true },
  { label: 'Fill Rate', value: `${reportSummaryMetrics.openShiftFillRate}%`, icon: TrendingUp, trend: '+5%' },
  { label: 'Agency Spend', value: `$${(reportSummaryMetrics.agencySpend / 1000).toFixed(1)}k`, icon: DollarSign, trend: '-$2.1k' },
  { label: 'Coverage Gaps', value: `${reportSummaryMetrics.coverageGaps}`, icon: AlertTriangle, trend: '-2', negative: true },
  { label: 'Fairness Score', value: `${reportSummaryMetrics.avgFairnessScore}`, icon: Scale, trend: '+3' },
];

export default function ReportsPage() {
  const [activeCategory, setActiveCategory] = useState<ReportCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const filteredItems = reportItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || 
      (activeCategory === 'dashboards' && item.category === 'dashboard') ||
      (activeCategory === 'reports' && item.category === 'report') ||
      (activeCategory === 'roster' && item.module === 'roster') ||
      (activeCategory === 'timesheets' && item.module === 'timesheets') ||
      (activeCategory === 'workforce' && item.module === 'workforce');
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const selectedItem = reportItems.find(r => r.id === selectedReport);

  if (selectedItem) {
    const ReportComponent = selectedItem.component;
    return (
      <div className="flex h-screen bg-background">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Button variant="ghost" size="sm" onClick={() => setSelectedReport(null)} className="text-muted-foreground">
                ← Back to Reports
              </Button>
              <div className="h-4 w-px bg-border" />
              <Badge variant="outline" className="text-xs">
                {selectedItem.category === 'dashboard' ? 'Dashboard' : 'Report'}
              </Badge>
              <h1 className="text-lg font-semibold tracking-tight text-foreground">{selectedItem.title}</h1>
            </div>
            <ReportComponent />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reports & Analytics</h1>
              <p className="text-sm text-muted-foreground mt-1">Roster scheduling dashboards and operational reports</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export All
            </Button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {summaryCards.map((card) => (
              <Card key={card.label} className="border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <card.icon className="h-4 w-4 text-muted-foreground" />
                    <span className={cn(
                      'text-xs font-medium',
                      card.negative ? 'text-destructive' : 'text-emerald-600'
                    )}>{card.trend}</span>
                  </div>
                  <p className="text-2xl font-bold tracking-tight text-foreground">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as ReportCategory)}>
              <TabsList className="h-9">
                <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
                <TabsTrigger value="dashboards" className="text-xs px-3">
                  <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                  Dashboards
                </TabsTrigger>
                <TabsTrigger value="reports" className="text-xs px-3">
                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                  Reports
                </TabsTrigger>
                <TabsTrigger value="roster" className="text-xs px-3">Roster</TabsTrigger>
                <TabsTrigger value="timesheets" className="text-xs px-3">Timesheets</TabsTrigger>
                <TabsTrigger value="workforce" className="text-xs px-3">Workforce</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>

          {/* Report grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className="border-border/60 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group"
                onClick={() => setSelectedReport(item.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
                      <item.icon className="h-4.5 w-4.5 text-accent-foreground" />
                    </div>
                    <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-medium">
                      {item.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-semibold mt-3 group-hover:text-primary transition-colors">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 pb-4">
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
