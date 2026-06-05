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
import { Checkbox } from '@/components/ui/checkbox';
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

interface AutoApprovalCondition {
  id: string;
  name: string;
  enabled: boolean;
  parameter?: number;
  description: string;
}




type ComplianceSource = 'award' | 'location' | 'tenant';
type AustralianState = 'NSW' | 'VIC' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'NT' | 'ACT';
type AwardTypeKey = 'general' | 'children_services' | 'healthcare' | 'hospitality' | 'retail' | 'social_community' | 'aged_care' | 'disability';

interface JurisdictionConfig {
  id: string;
  name: string;
  code: string;
  state: AustralianState;
  awardType: AwardTypeKey;
  // Hours limits
  maxDailyHours: number;
  maxWeeklyHours: number;
  // Overtime
  overtimeThresholdDaily: number;
  overtimeThresholdWeekly: number;
  overtimeMultiplier: number;
  doubleTimeThreshold: number;
  doubleTimeMultiplier: number;
  // Rest & span (AU NES)
  minRestBetweenShiftsHours: number;
  maxConsecutiveDays: number;
  spanOfHoursMax: number;
  // Penalty rates (multipliers)
  saturdayMultiplier: number;
  sundayMultiplier: number;
  publicHolidayMultiplier: number;
  nightLoadingMultiplier: number;
  // Casual & engagement
  casualLoadingPercent: number;
  minEngagementHours: number;
  // Source attribution per group (Award > Location > Tenant)
  sourceMap: {
    hoursLimits: ComplianceSource;
    overtime: ComplianceSource;
    restSpan: ComplianceSource;
    penalties: ComplianceSource;
    engagement: ComplianceSource;
  };
}

interface EscalationConfig {
  tier: ApprovalTier;
  slaHours: number;
  escalateTo: ApprovalTier;
  notifyEmails: string[];
}

function SourceBadge({ source }: { source: ComplianceSource }) {
  const map = {
    award: { label: 'From Award', icon: Award, cls: 'bg-primary text-primary-foreground border-transparent' },
    location: { label: 'Location override', icon: Building2, cls: 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400' },
    tenant: { label: 'Tenant default', icon: Globe, cls: 'bg-muted text-muted-foreground border-border' },
  } as const;
  const { label, icon: Icon, cls } = map[source];
  return (
    <Badge variant="outline" className={`gap-1 text-[10px] h-5 ${cls}`}>
      <Icon className="h-3 w-3" /> {label}
    </Badge>
  );
}

export default function TimesheetSettings() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Auto-Approval Conditions
  const [autoApprovalEnabled, setAutoApprovalEnabled] = useState(true);
  const [autoApprovalConditions, setAutoApprovalConditions] = useState<AutoApprovalCondition[]>([
    { id: 'cond-1', name: 'No Compliance Flags', enabled: true, description: 'Timesheet has no critical or warning flags' },
    { id: 'cond-2', name: 'Within Regular Hours', enabled: true, parameter: 40, description: 'Total hours do not exceed weekly threshold' },
    { id: 'cond-3', name: 'No Overtime', enabled: false, parameter: 0, description: 'Timesheet contains zero overtime hours' },
    { id: 'cond-4', name: 'Overtime Under Limit', enabled: true, parameter: 2, description: 'Overtime hours below specified threshold' },
    { id: 'cond-5', name: 'All Breaks Taken', enabled: true, description: 'All mandatory breaks properly recorded' },
    { id: 'cond-6', name: 'No Pattern Anomalies', enabled: true, description: 'Clock patterns consistent with historical data' },
    { id: 'cond-7', name: 'Complete Clock Entries', enabled: true, description: 'All days have both clock-in and clock-out' },
  ]);

  // Flagging Rules



  // Break Rules
  const [breakRules, setBreakRules] = useBreakRules();

  // Jurisdiction Config — defaults to Australia (NES + Modern Awards)
  const [jurisdiction, setJurisdiction] = useState<JurisdictionConfig>({
    id: 'au-nes',
    name: 'Australia — National Employment Standards',
    code: 'AU-NES',
    state: 'NSW',
    awardType: 'general',
    maxDailyHours: 10,
    maxWeeklyHours: 38,
    overtimeThresholdDaily: 8,
    overtimeThresholdWeekly: 38,
    overtimeMultiplier: 1.5,
    doubleTimeThreshold: 10,
    doubleTimeMultiplier: 2.0,
    minRestBetweenShiftsHours: 10,
    maxConsecutiveDays: 6,
    spanOfHoursMax: 12,
    saturdayMultiplier: 1.25,
    sundayMultiplier: 1.5,
    publicHolidayMultiplier: 2.5,
    nightLoadingMultiplier: 1.15,
    casualLoadingPercent: 25,
    minEngagementHours: 3,
    sourceMap: {
      hoursLimits: 'tenant',
      overtime: 'award',
      restSpan: 'award',
      penalties: 'award',
      engagement: 'award',
    },
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

  // Escalation Config
  const [escalationConfigs, setEscalationConfigs] = useState<EscalationConfig[]>([
    { tier: 'manager', slaHours: 24, escalateTo: 'senior_manager', notifyEmails: [] },
    { tier: 'senior_manager', slaHours: 48, escalateTo: 'director', notifyEmails: [] },
    { tier: 'director', slaHours: 72, escalateTo: 'hr', notifyEmails: [] },
    { tier: 'hr', slaHours: 96, escalateTo: 'hr', notifyEmails: [] },
  ]);

  // Notification Settings — per-event channel matrix
  type NotifChannels = { email: boolean; slack: boolean; teams: boolean; inApp: boolean };
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

  const defaultChannels: NotifChannels = { email: true, slack: false, teams: false, inApp: true };

  const [notifications, setNotifications] = useState({
    // Legacy flags (kept for backward compat with other screens reading them)
    emailOnFlag: true,
    emailOnEscalation: true,
    emailOnAutoApprove: false,
    emailOnRejection: true,
    slackIntegration: false,
    teamsIntegration: false,
    webhookUrl: '',
    dailyDigest: true,
    digestTime: '09:00',
    managerDigestTime: '17:00',
    quietHoursEnabled: false,
    quietHoursStart: '20:00',
    quietHoursEnd: '07:00',
    suppressOnWeekends: false,
    events: {
      newSubmission:        { ...defaultChannels },
      emailOnFlag:          { ...defaultChannels },
      emailOnEscalation:    { ...defaultChannels },
      emailOnAutoApprove:   { email: false, slack: false, teams: false, inApp: true },
      emailOnRejection:     { ...defaultChannels },
      missedClockOut:       { ...defaultChannels },
      unsubmittedNearCutoff:{ ...defaultChannels },
      slaDueSoon:           { ...defaultChannels },
      correction:           { ...defaultChannels },
      payAdjustment:        { ...defaultChannels },
    } as Record<NotifEventKey, NotifChannels>,
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

  const employmentTypeOptions = ['Full-time', 'Part-time', 'Casual', 'Agency', 'Contractor'];

  const handleSave = () => {
    toast.success('Settings saved successfully');
    setHasUnsavedChanges(false);
  };

  const handleReset = () => {
    toast.info('Settings reset to defaults');
    setHasUnsavedChanges(false);
  };

  const updateCondition = (id: string, updates: Partial<AutoApprovalCondition>) => {
    setAutoApprovalConditions(prev => 
      prev.map(c => c.id === id ? { ...c, ...updates } : c)
    );
    setHasUnsavedChanges(true);
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
                  <span className="hidden sm:inline">Anomaly Flags</span>
                </TabsTrigger>
                <TabsTrigger value="compliance" className="gap-2">
                  <Scale className="h-4 w-4" />
                  <span className="hidden sm:inline">Compliance</span>
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
              <TabsContent value="flags" className="space-y-6"><PolicyIssues /></TabsContent>




            {/* Auto-Approval Tab */}
            <TabsContent value="approving" className="space-y-6">
              {/* Master Toggle */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary" />
                        Automatic Approval Engine
                      </CardTitle>
                      <CardDescription>
                        Enable automatic approval for timesheets that meet all specified conditions
                      </CardDescription>
                    </div>
                    <Switch
                      checked={autoApprovalEnabled}
                      onCheckedChange={(checked) => {
                        setAutoApprovalEnabled(checked);
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                </CardHeader>
                {autoApprovalEnabled && (
                  <CardContent className="pt-0">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-700">Auto-Approval Active</p>
                        <p className="text-sm text-green-600/80">
                          Timesheets meeting all enabled conditions below will be automatically approved without manual review
                        </p>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Conditions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    Auto-Approval Conditions
                  </CardTitle>
                  <CardDescription>
                    All enabled conditions must be met for automatic approval. Disable conditions to make auto-approval more lenient.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {autoApprovalConditions.map((condition) => (
                    <div
                      key={condition.id}
                      className={`p-4 rounded-lg border transition-all ${
                        condition.enabled 
                          ? 'bg-primary/5 border-primary/20' 
                          : 'bg-muted/50 border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={condition.enabled}
                            onCheckedChange={(checked) => updateCondition(condition.id, { enabled: checked })}
                            disabled={!autoApprovalEnabled}
                          />
                          <div>
                            <p className={`font-medium ${!condition.enabled && 'text-muted-foreground'}`}>
                              {condition.name}
                            </p>
                            <p className="text-sm text-muted-foreground">{condition.description}</p>
                          </div>
                        </div>
                        {condition.parameter !== undefined && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={condition.parameter}
                              onChange={(e) => updateCondition(condition.id, { parameter: Number(e.target.value) })}
                              className="w-20 text-center"
                              disabled={!condition.enabled || !autoApprovalEnabled}
                            />
                            <span className="text-sm text-muted-foreground">
                              {condition.name.includes('Hours') ? 'hours' : 'hrs'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Logic Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    Approval Logic Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm">
                    <p className="text-muted-foreground mb-2">// Auto-approval will trigger when:</p>
                    <div className="space-y-1">
                      {autoApprovalConditions.filter(c => c.enabled).map((c, i, arr) => (
                        <div key={c.id} className="flex items-center gap-2">
                          <span className="text-green-600">✓</span>
                          <span>
                            {c.name}
                            {c.parameter !== undefined && (
                              <span className="text-primary"> ({c.parameter}h)</span>
                            )}
                          </span>
                          {i < arr.length - 1 && <span className="text-muted-foreground ml-2">AND</span>}
                        </div>
                      ))}
                    </div>
                    {autoApprovalConditions.filter(c => c.enabled).length === 0 && (
                      <p className="text-amber-600">⚠ No conditions enabled - all timesheets will be auto-approved</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>




            {/* Breaks Tab */}
            <TabsContent value="breaks" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Coffee className="h-5 w-5 text-primary" />
                        Break Rules Configuration
                      </CardTitle>
                      <CardDescription>
                        Define mandatory and optional break rules based on hours worked. These rules are jurisdiction-aware and enforced during compliance validation.
                      </CardDescription>
                    </div>
                    <Button onClick={addBreakRule} variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Break Rule
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {breakRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-4 rounded-lg border bg-card"
                    >
                      <div className="grid gap-4 md:grid-cols-6 items-end">
                        <div className="md:col-span-2">
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Break Name</Label>
                          <Input
                            value={rule.name}
                            onChange={(e) => updateBreakRule(rule.id, { name: e.target.value })}
                            placeholder="Break name"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1.5 block">After Hours Worked</Label>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={rule.minWorkHoursRequired}
                              onChange={(e) => updateBreakRule(rule.id, { minWorkHoursRequired: Number(e.target.value) })}
                              min={0}
                              max={24}
                            />
                            <span className="text-sm text-muted-foreground">hrs</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Duration</Label>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={rule.breakDurationMinutes}
                              onChange={(e) => updateBreakRule(rule.id, { breakDurationMinutes: Number(e.target.value) })}
                              min={5}
                              max={120}
                            />
                            <span className="text-sm text-muted-foreground">min</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Type</Label>
                          <Select
                            value={rule.type}
                            onValueChange={(value: 'paid' | 'unpaid') => updateBreakRule(rule.id, { type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="paid">Paid</SelectItem>
                              <SelectItem value="unpaid">Unpaid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-4 justify-between">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={rule.isMandatory}
                              onCheckedChange={(checked) => updateBreakRule(rule.id, { isMandatory: checked })}
                            />
                            <span className="text-sm">{rule.isMandatory ? 'Mandatory' : 'Optional'}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeBreakRule(rule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {breakRules.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No break rules configured. Click "Add Break Rule" to create one.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Break Enforcement Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Timer className="h-5 w-5 text-primary" />
                    Break Enforcement Logic
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Badge className="bg-primary/10 text-primary border-primary/20">Mandatory</Badge>
                      <p className="text-sm text-muted-foreground">
                        If an employee works more than the required hours and doesn't take the break, a <strong>Missed Break</strong> flag is raised. This blocks auto-approval.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge className="bg-muted text-muted-foreground">Optional</Badge>
                      <p className="text-sm text-muted-foreground">
                        Optional breaks are tracked but not enforced. Employees can take them without triggering flags if missed.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Paid</Badge>
                      <p className="text-sm text-muted-foreground">
                        Break time counts towards total paid hours.
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Unpaid</Badge>
                      <p className="text-sm text-muted-foreground">
                        Break time is deducted from total hours when calculating pay.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Compliance Tab */}
            <TabsContent value="compliance" className="space-y-6">
              {/* Precedence banner */}
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Scale className="h-5 w-5 text-primary mt-0.5" />
                    <div className="space-y-2 flex-1">
                      <p className="font-medium tracking-tight">Compliance precedence</p>
                      <p className="text-sm text-muted-foreground">
                        Effective rules are resolved in this order — the first available value wins:
                      </p>
                      <div className="flex items-center gap-2 flex-wrap text-sm">
                        <Badge className="bg-primary text-primary-foreground gap-1">
                          <Award className="h-3 w-3" /> 1. Award / EBA
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="gap-1">
                          <Building2 className="h-3 w-3" /> 2. Location override
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="gap-1 text-muted-foreground">
                          <Globe className="h-3 w-3" /> 3. Tenant default
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Award rules from Fair Work always override location and tenant settings.
                        Use location overrides only where an EBA, registered agreement, or local condition genuinely changes the rule.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Jurisdiction selector */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    Jurisdiction & Award
                  </CardTitle>
                  <CardDescription>
                    Defaults to Australia's National Employment Standards (NES). Select your state and
                    primary Modern Award — these determine the baseline values for every card below.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Country / Framework</Label>
                      <Input value={jurisdiction.name} disabled className="mt-1.5" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">State / Territory</Label>
                      <Select
                        value={jurisdiction.state}
                        onValueChange={(v: AustralianState) => {
                          setJurisdiction({ ...jurisdiction, state: v });
                          setHasUnsavedChanges(true);
                        }}
                      >
                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(['NSW','VIC','QLD','SA','WA','TAS','NT','ACT'] as AustralianState[]).map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Primary Modern Award</Label>
                      <Select
                        value={jurisdiction.awardType}
                        onValueChange={(v: AwardTypeKey) => {
                          setJurisdiction({ ...jurisdiction, awardType: v });
                          setHasUnsavedChanges(true);
                        }}
                      >
                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General / Clerks</SelectItem>
                          <SelectItem value="children_services">Children's Services Award (MA000120)</SelectItem>
                          <SelectItem value="healthcare">Health Professionals Award (MA000027)</SelectItem>
                          <SelectItem value="aged_care">Aged Care Award (MA000018)</SelectItem>
                          <SelectItem value="disability">SCHCADS Disability Stream</SelectItem>
                          <SelectItem value="social_community">SCHCADS (MA000100)</SelectItem>
                          <SelectItem value="hospitality">Hospitality Award (MA000009)</SelectItem>
                          <SelectItem value="retail">Retail Award (MA000004)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="rounded-md border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
                    Configure individual award penalty rates, allowances, and classifications in
                    <span className="font-medium text-foreground"> Settings → Awards</span>.
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Hours Limits */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Working Hours Limits
                      </CardTitle>
                      <SourceBadge source={jurisdiction.sourceMap.hoursLimits} />
                    </div>
                    <CardDescription className="text-xs">
                      NES: 38 ordinary hours/week. Daily max varies by award.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Maximum Daily Hours</Label>
                        <span className="font-mono text-lg">{jurisdiction.maxDailyHours}h</span>
                      </div>
                      <Slider
                        value={[jurisdiction.maxDailyHours]}
                        onValueChange={([value]) => {
                          setJurisdiction({ ...jurisdiction, maxDailyHours: value });
                          setHasUnsavedChanges(true);
                        }}
                        min={6}
                        max={16}
                        step={1}
                      />
                    </div>
                    <Separator />
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Maximum Weekly Hours</Label>
                        <span className="font-mono text-lg">{jurisdiction.maxWeeklyHours}h</span>
                      </div>
                      <Slider
                        value={[jurisdiction.maxWeeklyHours]}
                        onValueChange={([value]) => {
                          setJurisdiction({ ...jurisdiction, maxWeeklyHours: value });
                          setHasUnsavedChanges(true);
                        }}
                        min={30}
                        max={60}
                        step={1}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Overtime Configuration */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Overtime Configuration
                      </CardTitle>
                      <SourceBadge source={jurisdiction.sourceMap.overtime} />
                    </div>
                    <CardDescription className="text-xs">
                      Most AU awards: 1.5× first 2h then 2× thereafter.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 grid-cols-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Daily OT Threshold</Label>
                        <div className="flex items-center gap-1 mt-1">
                          <Input
                            type="number"
                            value={jurisdiction.overtimeThresholdDaily}
                            onChange={(e) => {
                              setJurisdiction({ ...jurisdiction, overtimeThresholdDaily: Number(e.target.value) });
                              setHasUnsavedChanges(true);
                            }}
                          />
                          <span className="text-sm text-muted-foreground">hrs</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Weekly OT Threshold</Label>
                        <div className="flex items-center gap-1 mt-1">
                          <Input
                            type="number"
                            value={jurisdiction.overtimeThresholdWeekly}
                            onChange={(e) => {
                              setJurisdiction({ ...jurisdiction, overtimeThresholdWeekly: Number(e.target.value) });
                              setHasUnsavedChanges(true);
                            }}
                          />
                          <span className="text-sm text-muted-foreground">hrs</span>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="grid gap-4 grid-cols-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">OT Rate Multiplier</Label>
                        <div className="flex items-center gap-1 mt-1">
                          <Input
                            type="number"
                            step="0.1"
                            value={jurisdiction.overtimeMultiplier}
                            onChange={(e) => {
                              setJurisdiction({ ...jurisdiction, overtimeMultiplier: Number(e.target.value) });
                              setHasUnsavedChanges(true);
                            }}
                          />
                          <span className="text-sm text-muted-foreground">×</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Double Time After</Label>
                        <div className="flex items-center gap-1 mt-1">
                          <Input
                            type="number"
                            value={jurisdiction.doubleTimeThreshold}
                            onChange={(e) => {
                              setJurisdiction({ ...jurisdiction, doubleTimeThreshold: Number(e.target.value) });
                              setHasUnsavedChanges(true);
                            }}
                          />
                          <span className="text-sm text-muted-foreground">hrs</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-1/2">
                      <Label className="text-xs text-muted-foreground">Double Time Multiplier</Label>
                      <div className="flex items-center gap-1 mt-1">
                        <Input
                          type="number"
                          step="0.1"
                          value={jurisdiction.doubleTimeMultiplier}
                          onChange={(e) => {
                            setJurisdiction({ ...jurisdiction, doubleTimeMultiplier: Number(e.target.value) });
                            setHasUnsavedChanges(true);
                          }}
                        />
                        <span className="text-sm text-muted-foreground">×</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Rest & Span (NEW — was missing) */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Timer className="h-5 w-5 text-primary" />
                        Rest & Span of Hours
                      </CardTitle>
                      <SourceBadge source={jurisdiction.sourceMap.restSpan} />
                    </div>
                    <CardDescription className="text-xs">
                      NES: minimum 10h rest between shifts. Span of hours per award.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Min Rest Between Shifts</Label>
                      <div className="flex items-center gap-1 mt-1">
                        <Input
                          type="number"
                          value={jurisdiction.minRestBetweenShiftsHours}
                          onChange={(e) => {
                            setJurisdiction({ ...jurisdiction, minRestBetweenShiftsHours: Number(e.target.value) });
                            setHasUnsavedChanges(true);
                          }}
                        />
                        <span className="text-sm text-muted-foreground">hrs</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Max Consecutive Workdays</Label>
                      <div className="flex items-center gap-1 mt-1">
                        <Input
                          type="number"
                          value={jurisdiction.maxConsecutiveDays}
                          onChange={(e) => {
                            setJurisdiction({ ...jurisdiction, maxConsecutiveDays: Number(e.target.value) });
                            setHasUnsavedChanges(true);
                          }}
                        />
                        <span className="text-sm text-muted-foreground">days</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Span of Hours (start to end)</Label>
                      <div className="flex items-center gap-1 mt-1">
                        <Input
                          type="number"
                          value={jurisdiction.spanOfHoursMax}
                          onChange={(e) => {
                            setJurisdiction({ ...jurisdiction, spanOfHoursMax: Number(e.target.value) });
                            setHasUnsavedChanges(true);
                          }}
                        />
                        <span className="text-sm text-muted-foreground">hrs</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Penalty Rates (NEW — was missing) */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        Penalty Rate Multipliers
                      </CardTitle>
                      <SourceBadge source={jurisdiction.sourceMap.penalties} />
                    </div>
                    <CardDescription className="text-xs">
                      Multipliers applied on top of base hourly rate.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { key: 'saturdayMultiplier' as const, label: 'Saturday' },
                      { key: 'sundayMultiplier' as const, label: 'Sunday' },
                      { key: 'publicHolidayMultiplier' as const, label: 'Public Holiday' },
                      { key: 'nightLoadingMultiplier' as const, label: 'Night Shift Loading' },
                    ].map(({ key, label }) => (
                      <div key={key} className="grid grid-cols-2 items-center gap-3">
                        <Label className="text-sm">{label}</Label>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            step="0.05"
                            value={jurisdiction[key]}
                            onChange={(e) => {
                              setJurisdiction({ ...jurisdiction, [key]: Number(e.target.value) });
                              setHasUnsavedChanges(true);
                            }}
                          />
                          <span className="text-sm text-muted-foreground">×</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Casual & Min Engagement (NEW — was missing) */}
                <Card className="md:col-span-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-primary" />
                        Casual Loading & Minimum Engagement
                      </CardTitle>
                      <SourceBadge source={jurisdiction.sourceMap.engagement} />
                    </div>
                    <CardDescription className="text-xs">
                      Casual loading (typically 25%) compensates for lack of paid leave. Most awards
                      require a minimum engagement per shift (commonly 2–3 hours).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-6 md:grid-cols-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Casual Loading</Label>
                      <div className="flex items-center gap-1 mt-1">
                        <Input
                          type="number"
                          value={jurisdiction.casualLoadingPercent}
                          onChange={(e) => {
                            setJurisdiction({ ...jurisdiction, casualLoadingPercent: Number(e.target.value) });
                            setHasUnsavedChanges(true);
                          }}
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Minimum Engagement per Shift</Label>
                      <div className="flex items-center gap-1 mt-1">
                        <Input
                          type="number"
                          step="0.5"
                          value={jurisdiction.minEngagementHours}
                          onChange={(e) => {
                            setJurisdiction({ ...jurisdiction, minEngagementHours: Number(e.target.value) });
                            setHasUnsavedChanges(true);
                          }}
                        />
                        <span className="text-sm text-muted-foreground">hrs</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

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
                  {/* Channel matrix */}
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-xs text-muted-foreground">
                        <tr>
                          <th className="text-left p-3 font-medium">Event</th>
                          <th className="p-3 font-medium">In-App</th>
                          <th className="p-3 font-medium">Email</th>
                          <th className="p-3 font-medium">Slack</th>
                          <th className="p-3 font-medium">Teams</th>
                        </tr>
                      </thead>
                      <tbody>
                        {([
                          ['newSubmission', 'New timesheet submitted'],
                          ['emailOnFlag', 'Compliance flag raised'],
                          ['emailOnEscalation', 'Approval escalated'],
                          ['emailOnAutoApprove', 'Auto-approved'],
                          ['emailOnRejection', 'Timesheet rejected'],
                          ['missedClockOut', 'Missed clock-out'],
                          ['unsubmittedNearCutoff', 'Unsubmitted near pay cut-off'],
                          ['slaDueSoon', 'Approval SLA due soon'],
                          ['correction', 'Timesheet corrected'],
                          ['payAdjustment', 'Pay adjustment applied'],
                        ] as [NotifEventKey, string][]).map(([key, label]) => (
                          <tr key={key} className="border-t">
                            <td className="p-3 font-medium">{label}</td>
                            {(['inApp', 'email', 'slack', 'teams'] as (keyof NotifChannels)[]).map((ch) => (
                              <td key={ch} className="p-3 text-center">
                                <Switch
                                  checked={notifications.events[key][ch]}
                                  onCheckedChange={(checked) => {
                                    setNotifications({
                                      ...notifications,
                                      events: {
                                        ...notifications.events,
                                        [key]: { ...notifications.events[key], [ch]: checked },
                                      },
                                    });
                                    setHasUnsavedChanges(true);
                                  }}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

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

                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-[hsl(290,60%,25%)] flex items-center justify-center">
                          <span className="text-primary-foreground font-bold text-lg">#</span>
                        </div>
                        <div>
                          <p className="font-medium">Slack</p>
                          <p className="text-sm text-muted-foreground">Route notifications to a Slack workspace</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.slackIntegration}
                        onCheckedChange={(checked) => {
                          setNotifications({ ...notifications, slackIntegration: checked });
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-[hsl(220,70%,45%)] flex items-center justify-center">
                          <span className="text-primary-foreground font-bold text-sm">T</span>
                        </div>
                        <div>
                          <p className="font-medium">Microsoft Teams</p>
                          <p className="text-sm text-muted-foreground">Post notifications to a Teams channel</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.teamsIntegration}
                        onCheckedChange={(checked) => {
                          setNotifications({ ...notifications, teamsIntegration: checked });
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </div>

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
