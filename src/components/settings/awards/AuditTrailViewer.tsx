import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  BellRing,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  History,
  Info,
  RefreshCw,
  Search,
  Settings,
  Shield,
  TrendingUp,
  X,
  XCircle,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  AuditEvent,
  AuditEventType,
  RateChangeAlert,
  AlertPriority,
  AlertStatus,
  AwardVersion,
  auditEventTypeLabels,
  alertPriorityLabels,
  alertStatusLabels,
} from '@/types/awardAudit';
import { useAwardConfig } from '@/contexts/AwardConfigContext';

// Mock audit events
const mockAuditEvents: AuditEvent[] = [
  {
    id: 'ae-1',
    eventType: 'rate_override_created',
    entityType: 'classification',
    entityId: 'cls-3.1',
    entityName: 'Level 3.1 Educator',
    action: 'create',
    changes: [
      { field: 'hourlyRate', oldValue: 32.50, newValue: 34.00 },
    ],
    reason: 'Retention bonus for experienced staff',
    performedBy: 'user-123',
    performedByName: 'Jane Smith',
    performedAt: '2024-01-15T10:30:00Z',
    source: 'user',
  },
  {
    id: 'ae-2',
    eventType: 'fwc_rate_update',
    entityType: 'award',
    entityId: 'children-services-2020',
    entityName: "Children's Services Award 2020",
    action: 'update',
    changes: [
      { field: 'Level 3.1 hourlyRate', oldValue: 31.82, newValue: 32.50 },
      { field: 'Level 3.2 hourlyRate', oldValue: 32.45, newValue: 33.15 },
      { field: 'Level 4.1 hourlyRate', oldValue: 34.21, newValue: 34.95 },
    ],
    reason: 'FWC Annual Wage Review 2024',
    performedBy: 'system',
    performedAt: '2024-07-01T00:00:00Z',
    source: 'fwc_sync',
  },
  {
    id: 'ae-3',
    eventType: 'allowance_modified',
    entityType: 'allowance',
    entityId: 'fa-allowance',
    entityName: 'First Aid Allowance',
    action: 'update',
    changes: [
      { field: 'weeklyAmount', oldValue: 17.85, newValue: 18.50 },
    ],
    performedBy: 'user-456',
    performedByName: 'Michael Brown',
    performedAt: '2024-01-10T14:15:00Z',
    source: 'user',
  },
  {
    id: 'ae-4',
    eventType: 'eba_created',
    entityType: 'eba',
    entityId: 'eba-1',
    entityName: 'ABC Childcare EBA 2023',
    action: 'create',
    changes: [
      { field: 'status', oldValue: undefined, newValue: 'active' },
      { field: 'classifications', oldValue: undefined, newValue: '5 levels' },
    ],
    performedBy: 'user-123',
    performedByName: 'Jane Smith',
    performedAt: '2023-07-01T09:00:00Z',
    source: 'user',
  },
];

// Mock alerts
const mockAlerts: RateChangeAlert[] = [
  {
    id: 'alert-1',
    alertType: 'upcoming_fwc_change',
    priority: 'high',
    status: 'pending',
    affectedAwardId: 'children-services-2020',
    affectedAwardName: "Children's Services Award 2020",
    title: 'FWC Annual Wage Review - 3.75% Increase',
    message: 'The Fair Work Commission has announced a 3.75% increase to minimum wages effective 1 July 2025.',
    details: 'All classifications will be affected. Review pay rates before the effective date.',
    actionRequired: 'Update pay rates in payroll system before 1 July 2025',
    actionDeadline: '2025-06-30',
    triggerDate: '2025-07-01',
    createdAt: '2025-06-01T00:00:00Z',
  },
  {
    id: 'alert-2',
    alertType: 'eba_expiry',
    priority: 'medium',
    status: 'acknowledged',
    affectedEbaId: 'eba-1',
    affectedEbaName: 'ABC Childcare EBA 2023',
    title: 'Enterprise Agreement Expiring in 180 days',
    message: 'The ABC Childcare EBA 2023 will reach its nominal expiry date on 30 June 2026.',
    actionRequired: 'Begin negotiations for replacement agreement',
    actionDeadline: '2026-03-01',
    triggerDate: '2026-06-30',
    createdAt: '2025-01-01T00:00:00Z',
    acknowledgedAt: '2025-01-05T10:00:00Z',
    acknowledgedBy: 'Jane Smith',
  },
  {
    id: 'alert-3',
    alertType: 'rate_below_award',
    priority: 'critical',
    status: 'pending',
    affectedAwardId: 'children-services-2020',
    affectedAwardName: "Children's Services Award 2020",
    affectedStaffIds: ['staff-5'],
    title: 'Employee Rate Below Award Minimum',
    message: 'One employee\'s pay rate is below the minimum award rate after the latest FWC increase.',
    details: 'Staff ID: staff-5, Current: $31.50/hr, Minimum: $32.50/hr',
    actionRequired: 'Immediately increase pay rate to at least $32.50/hr',
    triggerDate: '2024-07-01',
    createdAt: '2024-07-02T00:00:00Z',
  },
  {
    id: 'alert-4',
    alertType: 'custom_rate_review',
    priority: 'low',
    status: 'actioned',
    title: 'Custom Rate Override Review',
    message: 'A custom rate override was created 6 months ago and should be reviewed.',
    actionRequired: 'Review if override is still appropriate',
    triggerDate: '2024-01-15',
    createdAt: '2024-07-15T00:00:00Z',
    actionedAt: '2024-07-16T09:00:00Z',
    actionedBy: 'Jane Smith',
    notes: 'Reviewed and confirmed - retention bonus still applies',
  },
];

// Mock award versions
const mockAwardVersions: AwardVersion[] = [
  {
    id: 'av-1',
    awardId: 'children-services-2020',
    awardName: "Children's Services Award 2020",
    version: '2024-07',
    effectiveDate: '2024-07-01',
    fwcReference: 'PR123456',
    fwcPublicationDate: '2024-06-15',
    changesSummary: 'Annual wage review - 3.5% increase to all classifications',
    changes: [
      { id: 'c1', changeType: 'rate_increase', affectedItem: 'Level 3.1 Base Rate', previousValue: 31.82, newValue: 32.50, changePercent: 2.14, description: 'Minimum rate increase' },
      { id: 'c2', changeType: 'rate_increase', affectedItem: 'Level 4.1 Base Rate', previousValue: 34.21, newValue: 34.95, changePercent: 2.16, description: 'Minimum rate increase' },
    ],
    rateSnapshot: {
      classifications: [
        { code: 'CSW-1', name: 'Support Worker Level 1', hourlyRate: 24.50, weeklyRate: 931, annualRate: 48412 },
        { code: 'Level 3.1', name: 'Educator Level 3.1', hourlyRate: 32.50, weeklyRate: 1235, annualRate: 64220 },
        { code: 'Level 4.1', name: 'Lead Educator 4.1', hourlyRate: 34.95, weeklyRate: 1328.10, annualRate: 69061 },
      ],
      allowances: [
        { code: 'FA', name: 'First Aid Allowance', amount: 18.50, frequency: 'per_week' },
        { code: 'EL', name: 'Educational Leader', amount: 2.35, frequency: 'per_hour' },
      ],
      penalties: [
        { type: 'Saturday', multiplier: 1.5 },
        { type: 'Sunday', multiplier: 2.0 },
        { type: 'Public Holiday', multiplier: 2.5 },
      ],
      casualLoading: 25,
      superannuationRate: 11.5,
    },
    isCurrent: true,
    isArchived: false,
    importedAt: '2024-06-15T10:00:00Z',
    importedBy: 'system',
  },
  {
    id: 'av-2',
    awardId: 'children-services-2020',
    awardName: "Children's Services Award 2020",
    version: '2023-07',
    effectiveDate: '2023-07-01',
    fwcReference: 'PR112233',
    changesSummary: 'Annual wage review - 5.75% increase',
    changes: [],
    rateSnapshot: {
      classifications: [
        { code: 'CSW-1', name: 'Support Worker Level 1', hourlyRate: 23.50, weeklyRate: 893, annualRate: 46436 },
        { code: 'Level 3.1', name: 'Educator Level 3.1', hourlyRate: 31.82, weeklyRate: 1209.16, annualRate: 62876 },
      ],
      allowances: [],
      penalties: [],
      casualLoading: 25,
      superannuationRate: 11,
    },
    isCurrent: false,
    isArchived: false,
    importedAt: '2023-06-20T10:00:00Z',
    importedBy: 'system',
  },
];

const priorityColors: Record<AlertPriority, string> = {
  critical: 'bg-red-500/10 text-red-700 border-red-200',
  high: 'bg-amber-500/10 text-amber-700 border-amber-200',
  medium: 'bg-blue-500/10 text-blue-700 border-blue-200',
  low: 'bg-gray-500/10 text-gray-700 border-gray-200',
};

const statusIcons: Record<AlertStatus, typeof Check> = {
  pending: Clock,
  acknowledged: Eye,
  actioned: CheckCircle2,
  dismissed: XCircle,
};

const eventTypeIcons: Record<string, typeof History> = {
  rate_override_created: Settings,
  rate_override_updated: Settings,
  rate_override_deleted: X,
  fwc_rate_update: TrendingUp,
  allowance_modified: FileText,
  eba_created: Shield,
  eba_updated: Shield,
  classification_changed: FileText,
};

export function AuditTrailViewer() {
  // Use context for real data from awardAuditService
  const { 
    auditEvents, 
    alerts, 
    awardVersions,
    refreshAuditData,
    acknowledgeAlert: contextAcknowledgeAlert,
    actionAlert: contextActionAlert,
    dismissAlert: contextDismissAlert,
  } = useAwardConfig();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<RateChangeAlert | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<AwardVersion | null>(null);
  const [alertStatusFilter, setAlertStatusFilter] = useState<string>('all');
  const [dismissReason, setDismissReason] = useState('');
  const [showDismissDialog, setShowDismissDialog] = useState(false);
  const [alertToDismiss, setAlertToDismiss] = useState<string | null>(null);
  
  // Combine context data with mock data for display
  const allAuditEvents = useMemo(() => {
    // If context has events, use them; otherwise fall back to mock
    return auditEvents.length > 0 ? auditEvents : mockAuditEvents;
  }, [auditEvents]);
  
  const allAlerts = useMemo(() => {
    return alerts.length > 0 ? alerts : mockAlerts;
  }, [alerts]);
  
  const allVersions = useMemo(() => {
    return awardVersions.length > 0 ? awardVersions : mockAwardVersions;
  }, [awardVersions]);

  const pendingAlerts = allAlerts.filter(a => a.status === 'pending');
  const criticalAlerts = pendingAlerts.filter(a => a.priority === 'critical');
  
  const filteredAlerts = useMemo(() => {
    if (alertStatusFilter === 'all') return allAlerts;
    return allAlerts.filter(a => a.status === alertStatusFilter);
  }, [allAlerts, alertStatusFilter]);

  const filteredEvents = useMemo(() => {
    return allAuditEvents.filter(event => {
      const matchesSearch = 
        event.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.performedByName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedEventType === 'all' || event.eventType === selectedEventType;
      return matchesSearch && matchesType;
    });
  }, [allAuditEvents, searchQuery, selectedEventType]);

  const handleAcknowledgeAlert = (alertId: string) => {
    contextAcknowledgeAlert(alertId);
  };

  const handleActionAlert = (alertId: string) => {
    contextActionAlert(alertId);
  };

  const handleDismissAlert = (alertId: string) => {
    setAlertToDismiss(alertId);
    setShowDismissDialog(true);
  };
  
  const confirmDismissAlert = () => {
    if (alertToDismiss && dismissReason) {
      contextDismissAlert(alertToDismiss, dismissReason);
      setShowDismissDialog(false);
      setDismissReason('');
      setAlertToDismiss(null);
    }
  };

  const handleExportAudit = () => {
    // Export to CSV
    const csvContent = [
      ['Date', 'Event Type', 'Entity', 'Action', 'Performed By', 'Reason'].join(','),
      ...allAuditEvents.map(e => [
        format(new Date(e.performedAt), 'yyyy-MM-dd HH:mm'),
        auditEventTypeLabels[e.eventType],
        e.entityName,
        e.action,
        e.performedByName || e.performedBy,
        e.reason || ''
      ].map(v => `"${v}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    
    toast.success('Audit trail exported', {
      description: 'CSV file download started',
    });
  };
  
  const handleRefresh = () => {
    refreshAuditData();
    toast.success('Data refreshed');
  };

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      {pendingAlerts.length > 0 && (
        <Card className={`card-material-elevated border-l-4 ${criticalAlerts.length > 0 ? 'border-l-red-500' : 'border-l-amber-500'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${criticalAlerts.length > 0 ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                  <BellRing className={`h-5 w-5 ${criticalAlerts.length > 0 ? 'text-red-600' : 'text-amber-600'}`} />
                </div>
                <div>
                  <p className="font-medium">
                    {pendingAlerts.length} Pending Alert{pendingAlerts.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {criticalAlerts.length > 0 && `${criticalAlerts.length} critical • `}
                    {pendingAlerts.filter(a => a.priority === 'high').length} high priority
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                View All Alerts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <History className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockAuditEvents.length}</p>
                <p className="text-sm text-muted-foreground">Audit Events</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingAlerts.length}</p>
                <p className="text-sm text-muted-foreground">Pending Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockAwardVersions.length}</p>
                <p className="text-sm text-muted-foreground">Award Versions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">98%</p>
                <p className="text-sm text-muted-foreground">Compliance Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts" className="relative">
            Alerts
            {pendingAlerts.length > 0 && (
              <span className="ml-2 h-5 w-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center">
                {pendingAlerts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="versions">Version History</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <Card className="card-material">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Rate Change Alerts</CardTitle>
                  <CardDescription>
                    FWC updates, EBA expiries, and compliance issues
                  </CardDescription>
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="actioned">Actioned</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {mockAlerts.map(alert => {
                    const StatusIcon = statusIcons[alert.status];

                    return (
                      <div
                        key={alert.id}
                        className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedAlert(alert)}
                      >
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                          alert.priority === 'critical' ? 'bg-red-500/10' :
                          alert.priority === 'high' ? 'bg-amber-500/10' :
                          alert.priority === 'medium' ? 'bg-blue-500/10' : 'bg-gray-500/10'
                        }`}>
                          <AlertTriangle className={`h-5 w-5 ${
                            alert.priority === 'critical' ? 'text-red-600' :
                            alert.priority === 'high' ? 'text-amber-600' :
                            alert.priority === 'medium' ? 'text-blue-600' : 'text-gray-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{alert.title}</p>
                            <Badge className={priorityColors[alert.priority]}>
                              {alertPriorityLabels[alert.priority]}
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {alertStatusLabels[alert.status]}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{alert.message}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Trigger: {format(new Date(alert.triggerDate), 'dd MMM yyyy')}
                            </span>
                            {alert.actionDeadline && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Deadline: {format(new Date(alert.actionDeadline), 'dd MMM yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card className="card-material">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search events..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                    <SelectTrigger className="w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Event Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      <SelectItem value="rate_override_created">Rate Overrides</SelectItem>
                      <SelectItem value="fwc_rate_update">FWC Updates</SelectItem>
                      <SelectItem value="allowance_modified">Allowance Changes</SelectItem>
                      <SelectItem value="eba_created">EBA Changes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" onClick={handleExportAudit}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="card-material">
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Timestamp</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Changes</TableHead>
                      <TableHead>By</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map(event => {
                      const Icon = eventTypeIcons[event.eventType] || History;

                      return (
                        <TableRow key={event.id}>
                          <TableCell className="font-mono text-sm">
                            <div>
                              <p>{format(new Date(event.performedAt), 'dd MMM yyyy')}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(event.performedAt), 'HH:mm:ss')}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span>{auditEventTypeLabels[event.eventType]}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{event.entityName}</p>
                              <p className="text-xs text-muted-foreground capitalize">{event.entityType}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {event.changes.slice(0, 2).map((change, idx) => (
                                <div key={idx} className="text-sm">
                                  <span className="text-muted-foreground">{change.field}: </span>
                                  {change.oldValue !== undefined && (
                                    <span className="line-through text-red-600 mr-1">{String(change.oldValue)}</span>
                                  )}
                                  <span className="text-emerald-600">{String(change.newValue)}</span>
                                </div>
                              ))}
                              {event.changes.length > 2 && (
                                <span className="text-xs text-muted-foreground">
                                  +{event.changes.length - 2} more
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {event.performedByName || event.performedBy}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {event.source.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions" className="space-y-4">
          <Card className="card-material">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Award Version History</CardTitle>
              <CardDescription>
                Historical snapshots of award rates and conditions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {mockAwardVersions.map(version => (
                    <Card
                      key={version.id}
                      className={`cursor-pointer hover:bg-muted/50 transition-colors ${version.isCurrent ? 'ring-2 ring-primary/20' : ''}`}
                      onClick={() => setSelectedVersion(version)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${version.isCurrent ? 'bg-primary/10' : 'bg-muted'}`}>
                              <FileText className={`h-5 w-5 ${version.isCurrent ? 'text-primary' : 'text-muted-foreground'}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{version.awardName}</p>
                                <Badge variant="secondary">v{version.version}</Badge>
                                {version.isCurrent && (
                                  <Badge className="bg-primary/10 text-primary">Current</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{version.changesSummary}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>Effective: {format(new Date(version.effectiveDate), 'dd MMM yyyy')}</span>
                                {version.fwcReference && <span>FWC: {version.fwcReference}</span>}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alert Detail Dialog */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent className="max-w-lg">
          {selectedAlert && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge className={priorityColors[selectedAlert.priority]}>
                    {alertPriorityLabels[selectedAlert.priority]}
                  </Badge>
                  <Badge variant="outline">
                    {alertStatusLabels[selectedAlert.status]}
                  </Badge>
                </div>
                <DialogTitle className="mt-2">{selectedAlert.title}</DialogTitle>
                <DialogDescription>{selectedAlert.message}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {selectedAlert.details && (
                  <div className="p-3 rounded-lg bg-muted text-sm">
                    {selectedAlert.details}
                  </div>
                )}
                {selectedAlert.actionRequired && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Action Required</p>
                    <p className="text-sm text-muted-foreground">{selectedAlert.actionRequired}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Trigger Date</p>
                    <p className="font-medium">{format(new Date(selectedAlert.triggerDate), 'dd MMM yyyy')}</p>
                  </div>
                  {selectedAlert.actionDeadline && (
                    <div>
                      <p className="text-muted-foreground">Action Deadline</p>
                      <p className="font-medium">{format(new Date(selectedAlert.actionDeadline), 'dd MMM yyyy')}</p>
                    </div>
                  )}
                </div>
                {selectedAlert.notes && (
                  <div className="p-3 rounded-lg border text-sm">
                    <p className="font-medium mb-1">Notes</p>
                    <p className="text-muted-foreground">{selectedAlert.notes}</p>
                  </div>
                )}
              </div>
              <DialogFooter className="gap-2">
                {selectedAlert.status === 'pending' && (
                  <>
                    <Button variant="outline" onClick={() => handleDismissAlert(selectedAlert.id)}>
                      <X className="h-4 w-4 mr-2" />
                      Dismiss
                    </Button>
                    <Button variant="outline" onClick={() => handleAcknowledgeAlert(selectedAlert.id)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Acknowledge
                    </Button>
                    <Button onClick={() => handleActionAlert(selectedAlert.id)}>
                      <Check className="h-4 w-4 mr-2" />
                      Mark Actioned
                    </Button>
                  </>
                )}
                {selectedAlert.status !== 'pending' && (
                  <Button variant="outline" onClick={() => setSelectedAlert(null)}>
                    Close
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Version Detail Dialog */}
      <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedVersion && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedVersion.awardName}</DialogTitle>
                <DialogDescription>
                  Version {selectedVersion.version} • Effective {format(new Date(selectedVersion.effectiveDate), 'dd MMMM yyyy')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">FWC Reference</p>
                      <p className="font-medium">{selectedVersion.fwcReference || 'N/A'}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Imported</p>
                      <p className="font-medium">{format(new Date(selectedVersion.importedAt), 'dd MMM yyyy HH:mm')}</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Classifications Snapshot</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead className="text-right">Hourly</TableHead>
                          <TableHead className="text-right">Weekly</TableHead>
                          <TableHead className="text-right">Annual</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedVersion.rateSnapshot.classifications.map(cls => (
                          <TableRow key={cls.code}>
                            <TableCell className="font-mono">{cls.code}</TableCell>
                            <TableCell>{cls.name}</TableCell>
                            <TableCell className="text-right">${cls.hourlyRate.toFixed(2)}</TableCell>
                            <TableCell className="text-right">${cls.weeklyRate.toFixed(2)}</TableCell>
                            <TableCell className="text-right">${cls.annualRate.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {selectedVersion.changes.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Changes from Previous Version</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedVersion.changes.map(change => (
                          <div key={change.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                            <span>{change.affectedItem}</span>
                            <div className="flex items-center gap-2">
                              <span className="line-through text-muted-foreground">${String(change.previousValue)}</span>
                              <span className="text-emerald-600 font-medium">${String(change.newValue)}</span>
                              {change.changePercent && (
                                <Badge variant="secondary">+{change.changePercent.toFixed(1)}%</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedVersion(null)}>
                  Close
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Snapshot
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
