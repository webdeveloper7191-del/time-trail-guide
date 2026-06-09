import { useState } from 'react';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
import { useBreakRules } from '@/lib/breakRulesStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  Settings,
  Shield,
  Clock,
  AlertTriangle,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Info,
  Zap,
  Timer,
  Coffee,
  UserCheck,
  Building2,
  Scale,
  Bell,
  ArrowRight,
  ChevronRight,
  Globe,
  Calendar,
  DollarSign,
  TrendingUp,
  Fingerprint,
  Eye,
  HelpCircle,
  Award,
} from 'lucide-react';
import { ApprovalTier, BreakRule, ApprovalRule, ApprovalRuleCondition, SlaBreachAction, ApprovalTriggerSet } from '@/types/compliance';
import { ApprovalDelegationModal } from '@/components/timesheet/ApprovalDelegationModal';
import { ApprovalFlowDesigner } from '@/components/timesheet/ApprovalFlowDesigner';
import { ComplianceDesigner, ComplianceState } from '@/components/timesheet/ComplianceDesigner';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { AwardsConfigurationTab } from '@/components/settings/AwardsConfigurationTab';
import {
  TimesheetPolicyScopeBar,
  PolicyTimeTracking,
  PolicyPermissions,
  PolicyApproving,
  PolicyUnscheduled,
  PolicyBreaks,
  PolicyIssues,
} from '@/components/settings/TimesheetPolicySettings';
import { Fingerprint as FingerprintIcon, ShieldCheck, CheckSquare, CalendarClock, Coffee as CoffeeIcon, AlertCircle } from 'lucide-react';
import { TimefoldConstraintPanel } from '@/components/roster/TimefoldConstraintPanel';
import { TimefoldIntegrationPanel } from '@/components/roster/TimefoldIntegrationPanel';
import { TimefoldConstraintConfigPanel } from '@/components/settings/TimefoldConstraintConfigPanel';
import { SchedulingConstraintsPanel } from '@/components/settings/SchedulingConstraintsPanel';
import { IntegrationManagerModal } from '@/components/settings/IntegrationManagerModal';
import { 
  TimefoldSolverConfig, 
  defaultSolverConfig, 
} from '@/lib/timefoldSolver';
import { Plug, PlugZap, Cpu } from 'lucide-react';




export default function TimesheetSettings() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Break Rules
  const [breakRules, setBreakRules] = useBreakRules();


  // Simplified compliance: only flag thresholds. Pay logic lives in Awards.
  const [compliance, setCompliance] = useState<ComplianceState>({
    effectiveAwardLabel: 'General / Clerks',
    effectiveAwardReference: 'MA000002',
    maxDailyHours: { enabled: true, value: 10, severity: 'warning' },
    maxWeeklyHours: { enabled: true, value: 38, severity: 'warning' },
    minRestBetweenShiftsHours: { enabled: true, value: 10, severity: 'critical' },
    maxConsecutiveDays: { enabled: true, value: 6, severity: 'warning' },
  });

  // Tenant-wide: auto-approve clean timesheets (skip Location Manager when no flags/OT/exceptions)
  const [autoApproveClean, setAutoApproveClean] = useState(false);

  // Step 1 — Location Manager (always first, cannot be removed)
  const [locationManagerStep, setLocationManagerStep] = useState({
    enabled: true,
    skipWhenAutoApproved: false,
    slaHours: 24,
    reminderHours: 4,
    breachAction: 'escalate' as SlaBreachAction,
    requireCommentOnReject: true,
    notifyStaffOnRoute: false,
  });

  // Additional approval steps — run after Location Manager when their triggers match
  const [approvalRules, setApprovalRules] = useState<ApprovalRule[]>([
    {
      id: 'ar-ot',
      name: 'High Overtime Review',
      triggers: { hasOvertime: true, overtimeOverHours: 8 },
      requiredTier: 'senior_manager',
      slaHours: 48,
      reminderHours: 6,
      slaBreachAction: 'escalate',
      escalationTier: 'director',
      requireCommentOnReject: true,
    },
    {
      id: 'ar-cf',
      name: 'Compliance Flag Review',
      triggers: { hasComplianceFlag: true },
      requiredTier: 'hr',
      slaHours: 72,
      reminderHours: 12,
      slaBreachAction: 'hold',
      requireCommentOnReject: true,
    },
  ]);





  // Notification Settings — per-event recipients + channels
  type NotifChannels = { email: boolean; inApp: boolean };
  type NotifRoleKey =
    | 'staff_owner'
    | 'direct_manager'
    | 'senior_manager'
    | 'hr'
    | 'payroll_admin';
  type NotifRecipients = Record<NotifRoleKey, boolean>;
  type NotifEventKey =
    | 'newSubmission'
    | 'emailOnFlag'
    | 'emailOnEscalation'
    | 'emailOnAutoApprove'
    | 'emailOnRejection'
    | 'missedClockOut'
    | 'unsubmittedNearCutoff'
    | 'slaDueSoon'
    | 'correction'
    | 'payAdjustment';

  const NOTIF_ROLES: { key: NotifRoleKey; label: string; short: string }[] = [
    { key: 'staff_owner',    label: 'Staff (timesheet owner)', short: 'Staff' },
    { key: 'direct_manager', label: 'Direct manager',          short: 'Manager' },
    { key: 'senior_manager', label: 'Senior manager',          short: 'Sr. Mgr' },
    { key: 'hr',             label: 'HR',                      short: 'HR' },
    { key: 'payroll_admin',  label: 'Payroll admin',           short: 'Payroll' },
  ];

  const noRoles: NotifRecipients = {
    staff_owner: false, direct_manager: false, senior_manager: false, hr: false, payroll_admin: false,
  };
  const rolesOf = (...keys: NotifRoleKey[]): NotifRecipients =>
    keys.reduce((acc, k) => ({ ...acc, [k]: true }), { ...noRoles });

  const defaultChannels: NotifChannels = { email: true, inApp: true };

  type NotifEvent = { channels: NotifChannels; recipients: NotifRecipients };

  const [notifications, setNotifications] = useState({
    // Legacy flags (kept for backward compat with other screens reading them)
    emailOnFlag: true,
    emailOnEscalation: true,
    emailOnAutoApprove: false,
    emailOnRejection: true,
    webhookUrl: '',
    dailyDigest: true,
    digestFrequency: 'daily' as 'daily' | 'weekly' | 'pay_cycle',
    digestWeekday: 'mon' as 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun',
    digestRecipients: rolesOf('direct_manager', 'senior_manager') as NotifRecipients,
    digestTime: '09:00',
    managerDigestTime: '17:00',
    quietHoursEnabled: false,
    quietHoursStart: '20:00',
    quietHoursEnd: '07:00',
    suppressOnWeekends: false,
    events: {
      newSubmission:        { channels: { ...defaultChannels }, recipients: rolesOf('direct_manager') },
      emailOnFlag:          { channels: { ...defaultChannels }, recipients: rolesOf('direct_manager', 'senior_manager') },
      emailOnEscalation:    { channels: { ...defaultChannels }, recipients: rolesOf('senior_manager', 'hr') },
      emailOnAutoApprove:   { channels: { email: false, inApp: true }, recipients: rolesOf('staff_owner', 'direct_manager') },
      emailOnRejection:     { channels: { ...defaultChannels }, recipients: rolesOf('staff_owner') },
      missedClockOut:       { channels: { ...defaultChannels }, recipients: rolesOf('staff_owner', 'direct_manager') },
      unsubmittedNearCutoff:{ channels: { ...defaultChannels }, recipients: rolesOf('staff_owner', 'direct_manager') },
      slaDueSoon:           { channels: { ...defaultChannels }, recipients: rolesOf('direct_manager', 'senior_manager') },
      correction:           { channels: { ...defaultChannels }, recipients: rolesOf('staff_owner', 'payroll_admin') },
      payAdjustment:        { channels: { ...defaultChannels }, recipients: rolesOf('staff_owner', 'payroll_admin') },
    } as Record<NotifEventKey, NotifEvent>,
  });


  // Delegations (for ApprovalDelegationModal)
  const [delegationOpen, setDelegationOpen] = useState(false);
  const [delegations, setDelegations] = useState<any[]>([]);

  // Mock approver directory — would come from staff/users API
  const approverDirectory = [
    { id: 'u1', name: 'Jane Doe', tier: 'senior_manager' as ApprovalTier },
    { id: 'u2', name: 'Robert Wilson', tier: 'hr' as ApprovalTier },
    { id: 'u3', name: 'Emily Brown', tier: 'manager' as ApprovalTier },
    { id: 'u4', name: 'David Lee', tier: 'manager' as ApprovalTier },
    { id: 'u5', name: 'Sarah Chen', tier: 'director' as ApprovalTier },
  ];

  const mockLocations = [
    { id: 'loc-1', name: 'Sydney CBD' },
    { id: 'loc-2', name: 'Melbourne Central' },
    { id: 'loc-3', name: 'Brisbane North' },
    { id: 'loc-4', name: 'Perth West' },
  ];

  const mockLocationGroups = [
    { id: 'grp-nsw', name: 'NSW Region' },
    { id: 'grp-vic', name: 'VIC Region' },
    { id: 'grp-qld', name: 'QLD Region' },
    { id: 'grp-wa', name: 'WA Region' },
    { id: 'grp-east', name: 'East Coast Cluster' },
    { id: 'grp-flagship', name: 'Flagship Sites' },
  ];

  const employmentTypeOptions = ['Full-time', 'Part-time', 'Casual', 'Agency', 'Contractor'];

  const handleSave = () => {
    toast.success('Settings saved successfully');
    setHasUnsavedChanges(false);
  };

  const handleReset = () => {
    toast.info('Settings reset to defaults');
    setHasUnsavedChanges(false);
  };







  const addBreakRule = () => {
    const newRule: BreakRule = {
      id: `br-${Date.now()}`,
      name: 'New Break',
      minWorkHoursRequired: 4,
      breakDurationMinutes: 15,
      type: 'paid',
      isMandatory: false,
    };
    setBreakRules([...breakRules, newRule]);
    setHasUnsavedChanges(true);
  };

  const removeBreakRule = (id: string) => {
    setBreakRules(breakRules.filter(r => r.id !== id));
    setHasUnsavedChanges(true);
  };

  const updateBreakRule = (id: string, updates: Partial<BreakRule>) => {
    setBreakRules(breakRules.map(r => r.id === id ? { ...r, ...updates } : r));
    setHasUnsavedChanges(true);
  };

  const addApprovalRule = () => {
    const newRule: ApprovalRule = {
      id: `ar-${Date.now()}`,
      name: 'New Step',
      triggers: { hasException: true },
      requiredTier: 'senior_manager',
      slaHours: 24,
      reminderHours: 4,
      slaBreachAction: 'escalate',
      requireCommentOnReject: true,
    };
    setApprovalRules(prev => [...prev, newRule]);
    setHasUnsavedChanges(true);
  };

  const removeApprovalRule = (id: string) => {
    setApprovalRules(prev => prev.filter(r => r.id !== id));
    setHasUnsavedChanges(true);
  };

  const updateApprovalRule = (id: string, updates: Partial<ApprovalRule>) => {
    setApprovalRules(prev => 
      prev.map(r => r.id === id ? { ...r, ...updates } : r)
    );
    setHasUnsavedChanges(true);
  };




  const getTierLabel = (tier: ApprovalTier) => {
    const labels: Record<ApprovalTier, string> = {
      auto: 'Auto-Approve',
      manager: 'Manager',
      senior_manager: 'Senior Manager',
      director: 'Director',
      hr: 'HR Department',
    };
    return labels[tier];
  };

  const [activeSection, setActiveSection] = useState<'timesheet' | 'awards' | 'solver'>('timesheet');
  
  // Solver configuration state
  const [showTimefoldPanel, setShowTimefoldPanel] = useState(false);
  const [showTimefoldIntegration, setShowTimefoldIntegration] = useState(false);
  const [showIntegrationManager, setShowIntegrationManager] = useState(false);
  const [showConstraintConfig, setShowConstraintConfig] = useState(false);
  const [timefoldConfig, setTimefoldConfig] = useState<TimefoldSolverConfig>(defaultSolverConfig);

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Settings className="h-6 w-6 text-primary" />
                  Settings
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure timesheet rules, approval workflows, and award interpretations
                </p>
              </div>
              <div className="flex items-center gap-3">
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                    Unsaved Changes
                  </Badge>
                )}
                <Button variant="outline" onClick={handleReset} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
                <Button onClick={handleSave} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Settings
                </Button>
              </div>
            </div>
          </div>
          
          {/* Main Section Tabs */}
          <div className="px-6 pb-2">
            <div className="flex gap-2">
              <Button
                variant={activeSection === 'timesheet' ? 'default' : 'outline'}
                onClick={() => setActiveSection('timesheet')}
                className="gap-2"
              >
                <Clock className="h-4 w-4" />
                Timesheet Settings
              </Button>
              <Button
                variant={activeSection === 'awards' ? 'default' : 'outline'}
                onClick={() => setActiveSection('awards')}
                className="gap-2"
              >
                <Award className="h-4 w-4" />
                Awards Configuration
              </Button>
              <Button
                variant={activeSection === 'solver' ? 'default' : 'outline'}
                onClick={() => setActiveSection('solver')}
                className="gap-2"
              >
                <Cpu className="h-4 w-4" />
                Solver & Integrations
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {activeSection === 'timesheet' ? (
            <div className="space-y-6">
              <TimesheetPolicyScopeBar />
            <Tabs defaultValue="time-tracking" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex flex-wrap h-auto">
                <TabsTrigger value="time-tracking" className="gap-2">
                  <FingerprintIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Time Tracking</span>
                </TabsTrigger>
                <TabsTrigger value="permissions" className="gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Permissions</span>
                </TabsTrigger>
                <TabsTrigger value="breaks" className="gap-2">
                  <Coffee className="h-4 w-4" />
                  <span className="hidden sm:inline">Breaks</span>
                </TabsTrigger>
                <TabsTrigger value="approving" className="gap-2">
                  <CheckSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Approving</span>
                </TabsTrigger>
                <TabsTrigger value="flags" className="gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="hidden sm:inline">Flags & Limits</span>
                </TabsTrigger>
                <TabsTrigger value="workflow" className="gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Workflow & Notifications</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="time-tracking"><PolicyTimeTracking /></TabsContent>
              <TabsContent value="permissions"><PolicyPermissions /></TabsContent>
              <TabsContent value="breaks" className="space-y-6"><PolicyBreaks /></TabsContent>
              <TabsContent value="approving" className="space-y-6">
                <PolicyApproving />
                <PolicyUnscheduled />
              </TabsContent>
              <TabsContent value="flags" className="space-y-6">
                <PolicyIssues />
                <ComplianceDesigner
                  value={compliance}
                  onChange={(next) => { setCompliance(next); setHasUnsavedChanges(true); }}
                />
              </TabsContent>







            {/* Workflow Tab */}
            <TabsContent value="workflow" className="space-y-6">
              <ApprovalFlowDesigner
                autoApproveClean={autoApproveClean}
                onAutoApproveCleanChange={setAutoApproveClean}
                locationManagerStep={locationManagerStep}
                onLocationManagerChange={setLocationManagerStep}
                rules={approvalRules}
                onAddRule={addApprovalRule}
                onUpdateRule={updateApprovalRule}
                onRemoveRule={removeApprovalRule}
                approverDirectory={approverDirectory}
                locations={mockLocations}
                locationGroups={mockLocationGroups}
                employmentTypes={employmentTypeOptions}
                onOpenDelegations={() => setDelegationOpen(true)}
                onDirty={() => setHasUnsavedChanges(true)}
              />



              {/* Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Notifications
                  </CardTitle>
                  <CardDescription>
                    Choose which channels deliver each event. In-app notifications appear in the bell menu.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Channel + recipients matrix */}
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-xs text-muted-foreground">
                        <tr>
                          <th className="text-left p-3 font-medium w-[30%]">Event</th>
                          <th className="text-left p-3 font-medium w-[110px]">Audience</th>
                          <th className="text-left p-3 font-medium">Recipients</th>
                          <th className="p-3 font-medium w-[80px]">In-App</th>
                          <th className="p-3 font-medium w-[80px]">Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {([
                          ['newSubmission',         'New timesheet submitted',       'manager', 'Staff submitted their timesheet — usually goes to their manager for approval.'],
                          ['emailOnFlag',           'Compliance flag raised',        'manager', 'A break, overtime or anomaly was flagged — review needed by the approver.'],
                          ['emailOnEscalation',     'Approval escalated',            'manager', 'SLA breached or skipped tier — escalated to a higher approver.'],
                          ['emailOnAutoApprove',    'Auto-approved',                 'staff',   'System auto-approved a timesheet — typically a courtesy to the staff member.'],
                          ['emailOnRejection',      'Timesheet rejected',            'staff',   'An approver rejected the timesheet — the staff member needs to fix and resubmit.'],
                          ['missedClockOut',        'Missed clock-out',              'both',    'Staff forgot to clock out — alert the staff member and their manager.'],
                          ['unsubmittedNearCutoff', 'Unsubmitted near pay cut-off',  'staff',   'Reminder before payroll close — sent to staff who haven\'t submitted.'],
                          ['slaDueSoon',            'Approval SLA due soon',         'manager', 'Reminder to approvers that pending timesheets are about to breach SLA.'],
                          ['correction',            'Timesheet corrected',           'both',    'A manager edited an approved timesheet — notify staff and payroll.'],
                          ['payAdjustment',         'Pay adjustment applied',        'staff',   'Back-pay or retro adjustment posted — notify staff and payroll.'],
                        ] as [NotifEventKey, string, 'staff' | 'manager' | 'both', string][]).map(([key, label, audience, desc]) => {
                          const ev = notifications.events[key];
                          const selectedRoles = NOTIF_ROLES.filter(r => ev.recipients[r.key]);
                          const audienceMeta = {
                            staff:   { label: 'Staff',   className: 'bg-blue-50 text-blue-700 border-blue-200' },
                            manager: { label: 'Manager', className: 'bg-amber-50 text-amber-700 border-amber-200' },
                            both:    { label: 'Both',    className: 'bg-violet-50 text-violet-700 border-violet-200' },
                          }[audience];
                          return (
                            <tr key={key} className="border-t align-top">
                              <td className="p-3">
                                <div className="font-medium">{label}</div>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</p>
                              </td>
                              <td className="p-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${audienceMeta.className}`}>
                                  {audienceMeta.label}
                                </span>
                              </td>
                              <td className="p-3">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 gap-1.5 max-w-[280px] justify-between font-normal">
                                      <span className="truncate text-xs">
                                        {selectedRoles.length === 0
                                          ? 'No recipients'
                                          : selectedRoles.length <= 2
                                            ? selectedRoles.map(r => r.short).join(', ')
                                            : `${selectedRoles.length} roles selected`}
                                      </span>
                                      <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start" className="w-56">
                                    <DropdownMenuLabel className="text-xs">Send to roles</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {NOTIF_ROLES.map((r) => (
                                      <DropdownMenuCheckboxItem
                                        key={r.key}
                                        checked={ev.recipients[r.key]}
                                        onCheckedChange={(checked) => {
                                          setNotifications({
                                            ...notifications,
                                            events: {
                                              ...notifications.events,
                                              [key]: {
                                                ...ev,
                                                recipients: { ...ev.recipients, [r.key]: !!checked },
                                              },
                                            },
                                          });
                                          setHasUnsavedChanges(true);
                                        }}
                                        onSelect={(e) => e.preventDefault()}
                                      >
                                        {r.label}
                                      </DropdownMenuCheckboxItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                              {(['inApp', 'email'] as (keyof NotifChannels)[]).map((ch) => (
                                <td key={ch} className="p-3 text-center">
                                  <Switch
                                    checked={ev.channels[ch]}
                                    onCheckedChange={(checked) => {
                                      setNotifications({
                                        ...notifications,
                                        events: {
                                          ...notifications.events,
                                          [key]: {
                                            ...ev,
                                            channels: { ...ev.channels, [ch]: checked },
                                          },
                                        },
                                      });
                                      setHasUnsavedChanges(true);
                                    }}
                                  />
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <strong>Audience</strong> classifies who the event is primarily about — <em>Staff</em>{' '}
                    events concern the timesheet owner, <em>Manager</em> events drive approval workflow,
                    <em> Both</em> affect either side. Use the <strong>Recipients</strong> dropdown to pick
                    exactly which roles receive each notification.
                  </p>

                  <Separator />

                  {/* Digests */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Digests</h4>
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Enable Daily Digest</p>
                          <p className="text-sm text-muted-foreground">Summary of pending approvals each morning</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.dailyDigest}
                        onCheckedChange={(checked) => {
                          setNotifications({ ...notifications, dailyDigest: checked });
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </div>
                    {notifications.dailyDigest && (
                      <div className="grid gap-4 md:grid-cols-2 pl-4">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Staff digest time</Label>
                          <Input
                            type="time"
                            value={notifications.digestTime}
                            onChange={(e) => {
                              setNotifications({ ...notifications, digestTime: e.target.value });
                              setHasUnsavedChanges(true);
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Manager digest time</Label>
                          <Input
                            type="time"
                            value={notifications.managerDigestTime}
                            onChange={(e) => {
                              setNotifications({ ...notifications, managerDigestTime: e.target.value });
                              setHasUnsavedChanges(true);
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Quiet hours */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Quiet Hours</h4>
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <p className="font-medium">Suppress non-critical notifications</p>
                        <p className="text-sm text-muted-foreground">
                          Hold notifications during quiet hours and weekends (critical alerts always send).
                        </p>
                      </div>
                      <Switch
                        checked={notifications.quietHoursEnabled}
                        onCheckedChange={(checked) => {
                          setNotifications({ ...notifications, quietHoursEnabled: checked });
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </div>
                    {notifications.quietHoursEnabled && (
                      <div className="grid gap-4 md:grid-cols-3 pl-4">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1.5 block">From</Label>
                          <Input
                            type="time"
                            value={notifications.quietHoursStart}
                            onChange={(e) => {
                              setNotifications({ ...notifications, quietHoursStart: e.target.value });
                              setHasUnsavedChanges(true);
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1.5 block">To</Label>
                          <Input
                            type="time"
                            value={notifications.quietHoursEnd}
                            onChange={(e) => {
                              setNotifications({ ...notifications, quietHoursEnd: e.target.value });
                              setHasUnsavedChanges(true);
                            }}
                          />
                        </div>
                        <div className="flex items-end">
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <Checkbox
                              checked={notifications.suppressOnWeekends}
                              onCheckedChange={(c) => {
                                setNotifications({ ...notifications, suppressOnWeekends: !!c });
                                setHasUnsavedChanges(true);
                              }}
                            />
                            Suppress on weekends
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Integrations */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Integrations</h4>




                    <div className="p-4 rounded-lg border space-y-2">
                      <Label className="text-sm font-medium">Webhook URL (optional)</Label>
                      <Input
                        type="url"
                        placeholder="https://example.com/webhooks/timesheets"
                        value={notifications.webhookUrl}
                        onChange={(e) => {
                          setNotifications({ ...notifications, webhookUrl: e.target.value });
                          setHasUnsavedChanges(true);
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        POST JSON payloads for every enabled event. Useful for custom integrations.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <ApprovalDelegationModal
                open={delegationOpen}
                onClose={() => setDelegationOpen(false)}
                currentUser="current-user"
                delegations={delegations}
                onCreateDelegation={(d) => {
                  setDelegations((prev) => [
                    ...prev,
                    { ...d, id: `del-${Date.now()}`, createdAt: new Date().toISOString(), status: 'active' },
                  ]);
                  setHasUnsavedChanges(true);
                }}
                onRevokeDelegation={(id) => setDelegations((prev) => prev.filter((d) => d.id !== id))}
              />
            </TabsContent>
            </Tabs>
            </div>
          ) : activeSection === 'awards' ? (
            <AwardsConfigurationTab />
          ) : (
            <div className="space-y-6">
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Cpu className="h-6 w-6 text-primary" />
                    Solver & Integration Configuration
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Configure the Timefold AI solver constraints, API connections, data mappings, and third-party integrations.
                  </p>
                </div>
              </div>

              {/* Configuration Modules - Vertical List */}
              <div className="space-y-3">
                {/* Solver Constraints */}
                <button
                  onClick={() => setShowTimefoldPanel(true)}
                  className="w-full text-left bg-background border border-border rounded-lg p-5 hover:border-primary/40 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-semibold text-foreground">Solver Constraints</h3>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">AI Engine</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-snug">
                        Configure AI optimization constraints including industry-specific rules, staffing ratios, and compliance requirements.
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
                  </div>
                </button>

                {/* Constraint Configuration - moved to Roster */}
                <div className="w-full text-left bg-muted/30 border border-border rounded-lg p-5">
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-semibold text-foreground">Constraint Configuration</h3>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">Moved to Roster</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-snug">
                        Scheduling constraints (H1-H20, S1-S20) are now configured directly from the Roster screen via the constraints button.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowTimefoldIntegration(true)}
                  className="w-full text-left bg-background border border-border rounded-lg p-5 hover:border-primary/40 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                      <PlugZap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-semibold text-foreground">Solver Integration</h3>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">API & Webhooks</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-snug">
                        Manage API connections, data mapping profiles, webhook endpoints, and constraint imports for the solver.
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
                  </div>
                </button>

                {/* Integration Manager */}
                <button
                  onClick={() => setShowIntegrationManager(true)}
                  className="w-full text-left bg-background border border-border rounded-lg p-5 hover:border-primary/40 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                      <Plug className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-semibold text-foreground">Integration Manager</h3>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">External Systems</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-snug">
                        Connect and manage external system integrations, data syncing, and third-party service configurations.
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
                  </div>
                </button>
              </div>

              {/* Helpful Tip */}
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/40 border border-border">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">Tip:</span> Start with Solver Constraints to select your industry and configure optimization rules. Then use Solver Integration for API connections and the Integration Manager for external system syncing.
                </p>
              </div>

              {/* Panels (rendered outside visible flow) */}
              <TimefoldConstraintPanel
                open={showTimefoldPanel}
                onClose={() => setShowTimefoldPanel(false)}
                config={timefoldConfig}
                onConfigChange={setTimefoldConfig}
              />
              <TimefoldIntegrationPanel
                open={showTimefoldIntegration}
                onClose={() => setShowTimefoldIntegration(false)}
              />
              <IntegrationManagerModal
                open={showIntegrationManager}
                onClose={() => setShowIntegrationManager(false)}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
