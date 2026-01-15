import { useState } from 'react';
import { AdminSidebar } from '@/components/timesheet/AdminSidebar';
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
import { ApprovalTier, BreakRule, ApprovalRule } from '@/types/compliance';
import { AwardsConfigurationTab } from '@/components/settings/AwardsConfigurationTab';

interface AutoApprovalCondition {
  id: string;
  name: string;
  enabled: boolean;
  parameter?: number;
  description: string;
}

interface FlaggingRule {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  severity: 'info' | 'warning' | 'critical';
  threshold?: number;
  description: string;
}

interface JurisdictionConfig {
  id: string;
  name: string;
  code: string;
  maxDailyHours: number;
  maxWeeklyHours: number;
  overtimeThresholdDaily: number;
  overtimeThresholdWeekly: number;
  overtimeMultiplier: number;
  doubleTimeThreshold: number;
  doubleTimeMultiplier: number;
}

interface EscalationConfig {
  tier: ApprovalTier;
  slaHours: number;
  escalateTo: ApprovalTier;
  notifyEmails: string[];
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
  const [flaggingRules, setFlaggingRules] = useState<FlaggingRule[]>([
    { id: 'flag-1', name: 'Early Clock-In', type: 'early_clock_in', enabled: true, severity: 'warning', threshold: 5, description: 'Flag clock-ins before specified hour (24h format)' },
    { id: 'flag-2', name: 'Late Clock-Out', type: 'late_clock_out', enabled: true, severity: 'warning', threshold: 22, description: 'Flag clock-outs after specified hour (24h format)' },
    { id: 'flag-3', name: 'Missing Clock-Out', type: 'missing_clock_out', enabled: true, severity: 'critical', description: 'Flag entries without clock-out recorded' },
    { id: 'flag-4', name: 'Excessive Daily Hours', type: 'max_daily_hours', enabled: true, severity: 'critical', threshold: 12, description: 'Flag when daily hours exceed limit' },
    { id: 'flag-5', name: 'Pattern Drift', type: 'pattern_drift', enabled: true, severity: 'info', threshold: 60, description: 'Flag deviation from average clock time (minutes)' },
    { id: 'flag-6', name: 'Buddy Punching Suspected', type: 'buddy_punching', enabled: true, severity: 'critical', description: 'Flag potential unauthorized punching' },
    { id: 'flag-7', name: 'Missed Break', type: 'missed_break', enabled: true, severity: 'warning', description: 'Flag when mandatory breaks not taken' },
    { id: 'flag-8', name: 'Exceeded Break', type: 'exceeded_break', enabled: true, severity: 'info', threshold: 150, description: 'Flag when break exceeds % of allowed time' },
    { id: 'flag-9', name: 'High Overtime', type: 'overtime_threshold', enabled: true, severity: 'warning', threshold: 50, description: 'Flag when overtime exceeds % of weekly threshold' },
    { id: 'flag-10', name: 'Irregular Punch Pattern', type: 'irregular_punch', enabled: true, severity: 'warning', description: 'Flag unusual punch sequences' },
  ]);

  // Break Rules
  const [breakRules, setBreakRules] = useState<BreakRule[]>([
    { id: 'br-1', name: 'Lunch Break', minWorkHoursRequired: 6, breakDurationMinutes: 30, type: 'unpaid', isMandatory: true },
    { id: 'br-2', name: 'Morning Rest', minWorkHoursRequired: 4, breakDurationMinutes: 15, type: 'paid', isMandatory: false },
    { id: 'br-3', name: 'Afternoon Rest', minWorkHoursRequired: 8, breakDurationMinutes: 15, type: 'paid', isMandatory: false },
  ]);

  // Jurisdiction Config
  const [jurisdiction, setJurisdiction] = useState<JurisdictionConfig>({
    id: 'us-federal',
    name: 'US Federal',
    code: 'US-FED',
    maxDailyHours: 12,
    maxWeeklyHours: 60,
    overtimeThresholdDaily: 8,
    overtimeThresholdWeekly: 40,
    overtimeMultiplier: 1.5,
    doubleTimeThreshold: 12,
    doubleTimeMultiplier: 2.0,
  });

  // Approval Chain Config
  const [approvalRules, setApprovalRules] = useState<ApprovalRule[]>([
    { id: 'ar-1', name: 'Standard Auto-Approve', condition: 'all', requiredTier: 'auto' },
    { id: 'ar-2', name: 'Moderate Overtime', condition: 'overtime', threshold: 2, requiredTier: 'manager', escalationTier: 'senior_manager', escalationHours: 24 },
    { id: 'ar-3', name: 'High Overtime', condition: 'overtime', threshold: 8, requiredTier: 'senior_manager', escalationTier: 'director', escalationHours: 48 },
    { id: 'ar-4', name: 'Compliance Issues', condition: 'compliance_flag', requiredTier: 'hr', escalationHours: 72 },
    { id: 'ar-5', name: 'Exception Review', condition: 'exception', requiredTier: 'manager', escalationTier: 'hr', escalationHours: 48 },
  ]);

  // Escalation Config
  const [escalationConfigs, setEscalationConfigs] = useState<EscalationConfig[]>([
    { tier: 'manager', slaHours: 24, escalateTo: 'senior_manager', notifyEmails: [] },
    { tier: 'senior_manager', slaHours: 48, escalateTo: 'director', notifyEmails: [] },
    { tier: 'director', slaHours: 72, escalateTo: 'hr', notifyEmails: [] },
    { tier: 'hr', slaHours: 96, escalateTo: 'hr', notifyEmails: [] },
  ]);

  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailOnFlag: true,
    emailOnEscalation: true,
    emailOnAutoApprove: false,
    emailOnRejection: true,
    slackIntegration: false,
    dailyDigest: true,
    digestTime: '09:00',
  });

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

  const updateFlaggingRule = (id: string, updates: Partial<FlaggingRule>) => {
    setFlaggingRules(prev => 
      prev.map(r => r.id === id ? { ...r, ...updates } : r)
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
    setBreakRules(prev => [...prev, newRule]);
    setHasUnsavedChanges(true);
  };

  const removeBreakRule = (id: string) => {
    setBreakRules(prev => prev.filter(r => r.id !== id));
    setHasUnsavedChanges(true);
  };

  const updateBreakRule = (id: string, updates: Partial<BreakRule>) => {
    setBreakRules(prev => 
      prev.map(r => r.id === id ? { ...r, ...updates } : r)
    );
    setHasUnsavedChanges(true);
  };

  const addApprovalRule = () => {
    const newRule: ApprovalRule = {
      id: `ar-${Date.now()}`,
      name: 'New Rule',
      condition: 'exception',
      requiredTier: 'manager',
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'warning': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'info': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
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

  const [activeSection, setActiveSection] = useState<'timesheet' | 'awards'>('timesheet');

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
            </div>
          </div>
        </header>

        <div className="p-6">
          {activeSection === 'timesheet' ? (
            <Tabs defaultValue="auto-approval" className="space-y-6">
              <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-flex">
                <TabsTrigger value="auto-approval" className="gap-2">
                  <Zap className="h-4 w-4" />
                  <span className="hidden sm:inline">Auto-Approval</span>
                </TabsTrigger>
                <TabsTrigger value="flagging" className="gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="hidden sm:inline">Flagging</span>
                </TabsTrigger>
                <TabsTrigger value="breaks" className="gap-2">
                  <Coffee className="h-4 w-4" />
                  <span className="hidden sm:inline">Breaks</span>
                </TabsTrigger>
                <TabsTrigger value="compliance" className="gap-2">
                  <Scale className="h-4 w-4" />
                  <span className="hidden sm:inline">Compliance</span>
                </TabsTrigger>
                <TabsTrigger value="workflow" className="gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Workflow</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="gap-2">
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">Alerts</span>
                </TabsTrigger>
              </TabsList>

            {/* Auto-Approval Tab */}
            <TabsContent value="auto-approval" className="space-y-6">
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

            {/* Flagging Tab */}
            <TabsContent value="flagging" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    Anomaly Detection & Flagging Rules
                  </CardTitle>
                  <CardDescription>
                    Configure which patterns and anomalies should trigger compliance flags. Flags can block auto-approval or require additional review.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {flaggingRules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`p-4 rounded-lg border transition-all ${
                        rule.enabled ? 'bg-card' : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={(checked) => updateFlaggingRule(rule.id, { enabled: checked })}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`font-medium ${!rule.enabled && 'text-muted-foreground'}`}>
                                {rule.name}
                              </p>
                              <Badge className={getSeverityColor(rule.severity)} variant="outline">
                                {rule.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{rule.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {rule.threshold !== undefined && (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={rule.threshold}
                                onChange={(e) => updateFlaggingRule(rule.id, { threshold: Number(e.target.value) })}
                                className="w-20 text-center"
                                disabled={!rule.enabled}
                              />
                            </div>
                          )}
                          <Select
                            value={rule.severity}
                            onValueChange={(value: 'info' | 'warning' | 'critical') => 
                              updateFlaggingRule(rule.id, { severity: value })
                            }
                            disabled={!rule.enabled}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="info">Info</SelectItem>
                              <SelectItem value="warning">Warning</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Severity Legend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    Severity Levels
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-700">Info</p>
                        <p className="text-sm text-blue-600/80">
                          Informational flags that don't affect approval. Visible for awareness only.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-700">Warning</p>
                        <p className="text-sm text-amber-600/80">
                          Requires manual review. Blocks auto-approval but allows submission.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-700">Critical</p>
                        <p className="text-sm text-red-600/80">
                          Blocks submission until resolved. Escalates to HR for review.
                        </p>
                      </div>
                    </div>
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    Jurisdiction Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure labor law compliance rules for your jurisdiction. These settings ensure timesheets comply with local regulations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <Label>Jurisdiction Name</Label>
                        <Input
                          value={jurisdiction.name}
                          onChange={(e) => {
                            setJurisdiction({ ...jurisdiction, name: e.target.value });
                            setHasUnsavedChanges(true);
                          }}
                        />
                      </div>
                      <div>
                        <Label>Jurisdiction Code</Label>
                        <Input
                          value={jurisdiction.code}
                          onChange={(e) => {
                            setJurisdiction({ ...jurisdiction, code: e.target.value });
                            setHasUnsavedChanges(true);
                          }}
                        />
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                      <p className="text-sm font-medium">Common Jurisdictions</p>
                      <div className="flex flex-wrap gap-2">
                        {['US-FED', 'US-CA', 'US-NY', 'UK', 'EU', 'AU', 'CA'].map((code) => (
                          <Button
                            key={code}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setJurisdiction({ ...jurisdiction, code });
                              setHasUnsavedChanges(true);
                            }}
                            className={jurisdiction.code === code ? 'bg-primary text-primary-foreground' : ''}
                          >
                            {code}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Hours Limits */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Working Hours Limits
                    </CardTitle>
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
                        min={8}
                        max={24}
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
                        min={40}
                        max={84}
                        step={1}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Overtime Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Overtime Configuration
                    </CardTitle>
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
                        <Label className="text-xs text-muted-foreground">Double Time Threshold</Label>
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
              </div>
            </TabsContent>

            {/* Workflow Tab */}
            <TabsContent value="workflow" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Multi-Tier Approval Rules
                      </CardTitle>
                      <CardDescription>
                        Configure conditional routing rules that determine which approval tier handles each timesheet based on conditions.
                      </CardDescription>
                    </div>
                    <Button onClick={addApprovalRule} variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Rule
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {approvalRules.map((rule, index) => (
                    <div
                      key={rule.id}
                      className="p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="outline" className="font-mono">{index + 1}</Badge>
                        <Input
                          value={rule.name}
                          onChange={(e) => updateApprovalRule(rule.id, { name: e.target.value })}
                          className="max-w-xs font-medium"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-auto text-destructive hover:text-destructive"
                          onClick={() => removeApprovalRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-4 md:grid-cols-5 items-end">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Condition</Label>
                          <Select
                            value={rule.condition}
                            onValueChange={(value: ApprovalRule['condition']) => 
                              updateApprovalRule(rule.id, { condition: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Timesheets</SelectItem>
                              <SelectItem value="overtime">Has Overtime</SelectItem>
                              <SelectItem value="exception">Has Exception</SelectItem>
                              <SelectItem value="high_hours">High Hours</SelectItem>
                              <SelectItem value="compliance_flag">Compliance Flag</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {(rule.condition === 'overtime' || rule.condition === 'high_hours') && (
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Threshold</Label>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={rule.threshold || 0}
                                onChange={(e) => updateApprovalRule(rule.id, { threshold: Number(e.target.value) })}
                              />
                              <span className="text-sm text-muted-foreground">hrs</span>
                            </div>
                          </div>
                        )}
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Required Approver</Label>
                          <Select
                            value={rule.requiredTier}
                            onValueChange={(value: ApprovalTier) => 
                              updateApprovalRule(rule.id, { requiredTier: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">Auto-Approve</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="senior_manager">Senior Manager</SelectItem>
                              <SelectItem value="director">Director</SelectItem>
                              <SelectItem value="hr">HR Department</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1.5 block">Escalate To</Label>
                          <Select
                            value={rule.escalationTier || 'none'}
                            onValueChange={(value) => 
                              updateApprovalRule(rule.id, { 
                                escalationTier: value === 'none' ? undefined : value as ApprovalTier 
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Escalation</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="senior_manager">Senior Manager</SelectItem>
                              <SelectItem value="director">Director</SelectItem>
                              <SelectItem value="hr">HR Department</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1.5 block">SLA (hours)</Label>
                          <Input
                            type="number"
                            value={rule.escalationHours || 24}
                            onChange={(e) => updateApprovalRule(rule.id, { escalationHours: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Escalation Flow Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowRight className="h-5 w-5 text-primary" />
                    Escalation Flow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg overflow-x-auto">
                    {escalationConfigs.map((config, index) => (
                      <div key={config.tier} className="flex items-center">
                        <div className="text-center">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 ${
                            index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20'
                          }`}>
                            {config.tier === 'manager' && <UserCheck className="h-6 w-6" />}
                            {config.tier === 'senior_manager' && <Users className="h-6 w-6" />}
                            {config.tier === 'director' && <Building2 className="h-6 w-6" />}
                            {config.tier === 'hr' && <Shield className="h-6 w-6" />}
                          </div>
                          <p className="text-sm font-medium">{getTierLabel(config.tier)}</p>
                          <p className="text-xs text-muted-foreground">{config.slaHours}h SLA</p>
                        </div>
                        {index < escalationConfigs.length - 1 && (
                          <ChevronRight className="h-6 w-6 text-muted-foreground mx-4" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Configure when and how notifications are sent for timesheet events.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <div>
                          <p className="font-medium">Email on Flag</p>
                          <p className="text-sm text-muted-foreground">Send email when a compliance flag is raised</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.emailOnFlag}
                        onCheckedChange={(checked) => {
                          setNotifications({ ...notifications, emailOnFlag: checked });
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <ArrowRight className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="font-medium">Email on Escalation</p>
                          <p className="text-sm text-muted-foreground">Send email when a timesheet is escalated to next tier</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.emailOnEscalation}
                        onCheckedChange={(checked) => {
                          setNotifications({ ...notifications, emailOnEscalation: checked });
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">Email on Auto-Approve</p>
                          <p className="text-sm text-muted-foreground">Send confirmation when timesheet is auto-approved</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.emailOnAutoApprove}
                        onCheckedChange={(checked) => {
                          setNotifications({ ...notifications, emailOnAutoApprove: checked });
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <XCircle className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="font-medium">Email on Rejection</p>
                          <p className="text-sm text-muted-foreground">Send email when a timesheet is rejected</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.emailOnRejection}
                        onCheckedChange={(checked) => {
                          setNotifications({ ...notifications, emailOnRejection: checked });
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Daily Digest</h4>
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Enable Daily Digest</p>
                          <p className="text-sm text-muted-foreground">Receive a summary of pending approvals each day</p>
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
                      <div className="flex items-center gap-4 pl-4">
                        <Label>Send digest at</Label>
                        <Input
                          type="time"
                          value={notifications.digestTime}
                          onChange={(e) => {
                            setNotifications({ ...notifications, digestTime: e.target.value });
                            setHasUnsavedChanges(true);
                          }}
                          className="w-32"
                        />
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Integrations</h4>
                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-[#4A154B] flex items-center justify-center">
                          <span className="text-white font-bold text-lg">#</span>
                        </div>
                        <div>
                          <p className="font-medium">Slack Integration</p>
                          <p className="text-sm text-muted-foreground">Send notifications to a Slack channel</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            </Tabs>
          ) : (
            <AwardsConfigurationTab />
          )}
        </div>
      </main>
    </div>
  );
}
