import { useState } from 'react';
import { timesheetApi } from '@/lib/api/timesheetApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  PhoneCall,
  Plus,
  Clock,
  User,
  Calendar,
  Timer,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  MapPin,
  Save,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

// ============= Types =============
export interface CallbackEvent {
  id: string;
  onCallShiftId: string;
  staffId: string;
  staffName: string;
  centreId: string;
  centreName: string;
  callbackType: 'callback' | 'recall' | 'emergency';
  // Times
  callReceivedAt: string;
  arrivalTime?: string;
  workStartTime: string;
  workEndTime: string;
  departureTime?: string;
  // Calculated
  actualWorkedMinutes: number;
  paidMinutes: number;
  minimumEngagementApplied: boolean;
  minimumEngagementHours: number;
  // Pay
  dayType: 'weekday' | 'saturday' | 'sunday' | 'public_holiday';
  rateMultiplier: number;
  baseRate: number;
  calculatedPay: number;
  travelTimeMinutes: number;
  // Meta
  reason: string;
  notes?: string;
  status: 'logged' | 'approved' | 'rejected' | 'paid';
  loggedBy: string;
  loggedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

// Mock data
const mockCallbackEvents: CallbackEvent[] = [
  {
    id: 'cb-1',
    onCallShiftId: 'oncall-shift-1',
    staffId: 'staff-1',
    staffName: 'Sarah Johnson',
    centreId: 'centre-1',
    centreName: 'Sunshine Early Learning',
    callbackType: 'callback',
    callReceivedAt: '2025-03-04T22:15:00',
    arrivalTime: '2025-03-04T22:45:00',
    workStartTime: '2025-03-04T22:50:00',
    workEndTime: '2025-03-04T23:35:00',
    departureTime: '2025-03-04T23:40:00',
    actualWorkedMinutes: 45,
    paidMinutes: 180,
    minimumEngagementApplied: true,
    minimumEngagementHours: 3,
    dayType: 'weekday',
    rateMultiplier: 1.5,
    baseRate: 35.00,
    calculatedPay: 157.50,
    travelTimeMinutes: 30,
    reason: 'Child welfare check required',
    notes: 'Parent called about sick child, nurse assessment needed',
    status: 'approved',
    loggedBy: 'System',
    loggedAt: '2025-03-04T23:40:00',
    approvedBy: 'Centre Manager',
    approvedAt: '2025-03-05T09:00:00',
  },
  {
    id: 'cb-2',
    onCallShiftId: 'oncall-shift-2',
    staffId: 'staff-3',
    staffName: 'Emily Chen',
    centreId: 'centre-1',
    centreName: 'Sunshine Early Learning',
    callbackType: 'recall',
    callReceivedAt: '2025-03-03T06:30:00',
    workStartTime: '2025-03-03T07:00:00',
    workEndTime: '2025-03-03T11:00:00',
    actualWorkedMinutes: 240,
    paidMinutes: 240,
    minimumEngagementApplied: false,
    minimumEngagementHours: 3,
    dayType: 'sunday',
    rateMultiplier: 2.0,
    baseRate: 35.00,
    calculatedPay: 280.00,
    travelTimeMinutes: 30,
    reason: 'Staff shortage - emergency recall',
    status: 'logged',
    loggedBy: 'Admin',
    loggedAt: '2025-03-03T11:15:00',
  },
  {
    id: 'cb-3',
    onCallShiftId: 'oncall-shift-3',
    staffId: 'staff-2',
    staffName: 'Michael Brown',
    centreId: 'centre-2',
    centreName: 'Rainbow Kids Centre',
    callbackType: 'emergency',
    callReceivedAt: '2025-03-02T03:00:00',
    arrivalTime: '2025-03-02T03:25:00',
    workStartTime: '2025-03-02T03:30:00',
    workEndTime: '2025-03-02T04:15:00',
    departureTime: '2025-03-02T04:20:00',
    actualWorkedMinutes: 45,
    paidMinutes: 240,
    minimumEngagementApplied: true,
    minimumEngagementHours: 4,
    dayType: 'saturday',
    rateMultiplier: 2.5,
    baseRate: 35.00,
    calculatedPay: 350.00,
    travelTimeMinutes: 25,
    reason: 'Alarm triggered - security response required',
    notes: 'False alarm, facility secured',
    status: 'paid',
    loggedBy: 'System',
    loggedAt: '2025-03-02T04:20:00',
    approvedBy: 'Admin',
    approvedAt: '2025-03-02T10:00:00',
  },
];

const callbackTypeColors: Record<CallbackEvent['callbackType'], string> = {
  callback: 'bg-amber-500/10 text-amber-700',
  recall: 'bg-orange-500/10 text-orange-700',
  emergency: 'bg-red-500/10 text-red-700',
};

const statusColors: Record<CallbackEvent['status'], string> = {
  logged: 'bg-blue-500/10 text-blue-700',
  approved: 'bg-green-500/10 text-green-700',
  rejected: 'bg-red-500/10 text-red-700',
  paid: 'bg-emerald-500/10 text-emerald-700',
};

const dayTypeLabels: Record<CallbackEvent['dayType'], string> = {
  weekday: 'Weekday',
  saturday: 'Saturday',
  sunday: 'Sunday',
  public_holiday: 'Public Holiday',
};

export function CallbackEventLoggingPanel() {
  const [events, setEvents] = useState<CallbackEvent[]>(mockCallbackEvents);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // New event form
  const [form, setForm] = useState({
    staffName: '',
    staffId: '',
    centreName: '',
    centreId: '',
    callbackType: 'callback' as CallbackEvent['callbackType'],
    callReceivedAt: '',
    workStartTime: '',
    workEndTime: '',
    dayType: 'weekday' as CallbackEvent['dayType'],
    baseRate: '35.00',
    reason: '',
    notes: '',
    travelTimeMinutes: '30',
  });

  // Auto-calculate pay
  const calculatePay = () => {
    if (!form.workStartTime || !form.workEndTime) return null;

    const start = new Date(form.workStartTime);
    const end = new Date(form.workEndTime);
    const actualMinutes = Math.max(0, (end.getTime() - start.getTime()) / 60000);
    
    // Minimum engagement rules by day type
    const minHours: Record<string, number> = {
      weekday: 2,
      saturday: 3,
      sunday: 3,
      public_holiday: 4,
    };
    const multipliers: Record<string, number> = {
      weekday: 1.5,
      saturday: 1.5,
      sunday: 2.0,
      public_holiday: 2.5,
    };

    const minMinutes = (minHours[form.dayType] || 2) * 60;
    const paidMinutes = Math.max(actualMinutes, minMinutes);
    const rateMultiplier = multipliers[form.dayType] || 1.5;
    const baseRate = parseFloat(form.baseRate) || 35;
    const pay = (paidMinutes / 60) * baseRate * rateMultiplier;

    return {
      actualMinutes: Math.round(actualMinutes),
      paidMinutes: Math.round(paidMinutes),
      minimumEngagementApplied: actualMinutes < minMinutes,
      minimumEngagementHours: minHours[form.dayType] || 2,
      rateMultiplier,
      calculatedPay: Math.round(pay * 100) / 100,
    };
  };

  const handleLogCallback = () => {
    if (!form.staffName || !form.workStartTime || !form.workEndTime || !form.reason) {
      toast.error('Please fill in required fields');
      return;
    }

    const calc = calculatePay();
    if (!calc) return;

    const newEvent: CallbackEvent = {
      id: `cb-${Date.now()}`,
      onCallShiftId: `oncall-shift-${Date.now()}`,
      staffId: form.staffId || `staff-${Date.now()}`,
      staffName: form.staffName,
      centreId: form.centreId || 'centre-1',
      centreName: form.centreName || 'Default Centre',
      callbackType: form.callbackType,
      callReceivedAt: form.callReceivedAt || form.workStartTime,
      workStartTime: form.workStartTime,
      workEndTime: form.workEndTime,
      actualWorkedMinutes: calc.actualMinutes,
      paidMinutes: calc.paidMinutes,
      minimumEngagementApplied: calc.minimumEngagementApplied,
      minimumEngagementHours: calc.minimumEngagementHours,
      dayType: form.dayType,
      rateMultiplier: calc.rateMultiplier,
      baseRate: parseFloat(form.baseRate) || 35,
      calculatedPay: calc.calculatedPay,
      travelTimeMinutes: parseInt(form.travelTimeMinutes) || 0,
      reason: form.reason,
      notes: form.notes || undefined,
      status: 'logged',
      loggedBy: 'Admin',
      loggedAt: new Date().toISOString(),
    };

    setEvents(prev => [newEvent, ...prev]);
    setIsSheetOpen(false);
    toast.success('Callback event logged successfully');
  };

  const generateTimesheetEntry = (event: CallbackEvent) => {
    // Auto-generate a timesheet clock entry from the approved callback
    const entry = {
      id: `ts-callback-${event.id}`,
      date: event.workStartTime.split('T')[0],
      clockIn: event.workStartTime,
      clockOut: event.workEndTime,
      breaks: [] as any[],
      totalBreakMinutes: 0,
      grossHours: event.paidMinutes / 60,
      netHours: event.paidMinutes / 60,
      overtime: 0,
      notes: `[CALLBACK - ${event.callbackType.toUpperCase()}] ${event.reason}. Rate: ${event.rateMultiplier}x, Min engagement: ${event.minimumEngagementApplied ? event.minimumEngagementHours + 'h applied' : 'not needed'}. Pay: $${event.calculatedPay.toFixed(2)}`,
      wasEdited: false,
    };
    return entry;
  };

  const handleApprove = (id: string) => {
    const event = events.find(e => e.id === id);
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status: 'approved' as const, approvedBy: 'Admin', approvedAt: new Date().toISOString() } : e));
    
    if (event) {
      const tsEntry = generateTimesheetEntry(event);
      console.log('[Callback→Timesheet] Auto-generated timesheet entry:', tsEntry);
      toast.success(
        `Callback approved — timesheet entry created for ${(event.paidMinutes / 60).toFixed(1)}h at ${event.rateMultiplier}x rate ($${event.calculatedPay.toFixed(2)})`,
        { duration: 5000 }
      );
    } else {
      toast.success('Callback approved');
    }
  };

  const handleReject = (id: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status: 'rejected' as const } : e));
    toast.success('Callback rejected');
  };

  const filteredEvents = events.filter(e => {
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    if (filterType !== 'all' && e.callbackType !== filterType) return false;
    return true;
  });

  const totalPay = events.filter(e => e.status !== 'rejected').reduce((sum, e) => sum + e.calculatedPay, 0);
  const pendingCount = events.filter(e => e.status === 'logged').length;

  const calc = calculatePay();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Callback Event Log</h3>
          <p className="text-sm text-muted-foreground">Record and manage on-call callback events with automatic minimum engagement calculation</p>
        </div>
        <Button onClick={() => setIsSheetOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Log Callback
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <PhoneCall className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{events.length}</p>
                <p className="text-sm text-muted-foreground">Total Callbacks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalPay.toFixed(0)}</p>
                <p className="text-sm text-muted-foreground">Total Callback Pay</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-material">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Timer className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {events.filter(e => e.minimumEngagementApplied).length}
                </p>
                <p className="text-sm text-muted-foreground">Min. Engagement Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="logged">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="callback">Callback</SelectItem>
            <SelectItem value="recall">Recall</SelectItem>
            <SelectItem value="emergency">Emergency</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Events List */}
      <ScrollArea className="h-[calc(100vh-420px)]">
        <div className="space-y-3 pr-4">
          {filteredEvents.map(event => (
            <Card key={event.id} className="card-material">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${callbackTypeColors[event.callbackType]}`}>
                      <PhoneCall className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{event.staffName}</span>
                        <Badge className={callbackTypeColors[event.callbackType]}>
                          {event.callbackType.charAt(0).toUpperCase() + event.callbackType.slice(1)}
                        </Badge>
                        <Badge className={statusColors[event.status]}>
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {event.centreName} • {format(new Date(event.callReceivedAt), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-foreground">${event.calculatedPay.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{event.rateMultiplier}x rate</p>
                  </div>
                </div>

                {/* Time breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                  <div className="p-2 rounded bg-muted/50 text-xs">
                    <span className="text-muted-foreground block">Actual Worked</span>
                    <span className="font-semibold">{Math.floor(event.actualWorkedMinutes / 60)}h {event.actualWorkedMinutes % 60}m</span>
                  </div>
                  <div className="p-2 rounded bg-muted/50 text-xs">
                    <span className="text-muted-foreground block">Paid Hours</span>
                    <span className="font-semibold">{(event.paidMinutes / 60).toFixed(1)}h</span>
                  </div>
                  <div className="p-2 rounded bg-muted/50 text-xs">
                    <span className="text-muted-foreground block">Day Type</span>
                    <span className="font-semibold">{dayTypeLabels[event.dayType]}</span>
                  </div>
                  <div className="p-2 rounded bg-muted/50 text-xs">
                    <span className="text-muted-foreground block">Travel</span>
                    <span className="font-semibold">{event.travelTimeMinutes}min</span>
                  </div>
                  {event.minimumEngagementApplied && (
                    <div className="p-2 rounded bg-amber-500/10 text-xs">
                      <span className="text-amber-600 block">Min Engagement</span>
                      <span className="font-semibold text-amber-700">{event.minimumEngagementHours}h applied</span>
                    </div>
                  )}
                </div>

                {/* Reason */}
                <p className="text-sm text-muted-foreground mb-3">{event.reason}</p>
                {event.notes && <p className="text-xs text-muted-foreground italic mb-3">{event.notes}</p>}

                {/* Timesheet link indicator */}
                {(event.status === 'approved' || event.status === 'paid') && (
                  <div className="flex items-center gap-2 mb-3 p-2 rounded bg-emerald-500/10 border border-emerald-200/50">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs text-emerald-700 font-medium">
                      Timesheet entry auto-generated • {(event.paidMinutes / 60).toFixed(1)}h @ {event.rateMultiplier}x = ${event.calculatedPay.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Actions */}
                {event.status === 'logged' && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button size="sm" variant="outline" className="gap-1 text-green-700" onClick={() => handleApprove(event.id)}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve & Create Timesheet
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-red-700" onClick={() => handleReject(event.id)}>
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {filteredEvents.length === 0 && (
            <Card className="card-material">
              <CardContent className="p-8 text-center">
                <PhoneCall className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Callback Events</h3>
                <p className="text-sm text-muted-foreground">No callback events match the current filters.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* Log Callback Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-amber-600" />
              Log Callback Event
            </SheetTitle>
            <SheetDescription>
              Record when an on-call staff member was called back to work.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-5">
            {/* Staff & Centre */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Staff Member *</Label>
                <Input placeholder="Staff name" value={form.staffName} onChange={e => setForm(p => ({ ...p, staffName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Centre</Label>
                <Input placeholder="Centre name" value={form.centreName} onChange={e => setForm(p => ({ ...p, centreName: e.target.value }))} />
              </div>
            </div>

            {/* Type and Day */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Callback Type</Label>
                <Select value={form.callbackType} onValueChange={(v: CallbackEvent['callbackType']) => setForm(p => ({ ...p, callbackType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="callback">Callback</SelectItem>
                    <SelectItem value="recall">Recall</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Day Type</Label>
                <Select value={form.dayType} onValueChange={(v: CallbackEvent['dayType']) => setForm(p => ({ ...p, dayType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekday">Weekday</SelectItem>
                    <SelectItem value="saturday">Saturday</SelectItem>
                    <SelectItem value="sunday">Sunday</SelectItem>
                    <SelectItem value="public_holiday">Public Holiday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Times */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Times</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Call Received At</Label>
                  <Input type="datetime-local" value={form.callReceivedAt} onChange={e => setForm(p => ({ ...p, callReceivedAt: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Travel Time (min)</Label>
                  <Input type="number" value={form.travelTimeMinutes} onChange={e => setForm(p => ({ ...p, travelTimeMinutes: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Work Start *</Label>
                  <Input type="datetime-local" value={form.workStartTime} onChange={e => setForm(p => ({ ...p, workStartTime: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Work End *</Label>
                  <Input type="datetime-local" value={form.workEndTime} onChange={e => setForm(p => ({ ...p, workEndTime: e.target.value }))} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Rate */}
            <div className="space-y-2">
              <Label>Base Hourly Rate ($)</Label>
              <Input type="number" step="0.01" value={form.baseRate} onChange={e => setForm(p => ({ ...p, baseRate: e.target.value }))} />
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Input placeholder="Why was the callback needed?" value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Additional notes..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>

            {/* Auto-calculated preview */}
            {calc && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Pay Calculation Preview
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-2 bg-white rounded border">
                      <span className="text-muted-foreground text-xs">Actual Worked</span>
                      <p className="font-semibold">{Math.floor(calc.actualMinutes / 60)}h {calc.actualMinutes % 60}m</p>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <span className="text-muted-foreground text-xs">Paid Hours</span>
                      <p className="font-bold text-amber-700">{(calc.paidMinutes / 60).toFixed(1)}h</p>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <span className="text-muted-foreground text-xs">Rate Multiplier</span>
                      <p className="font-semibold">{calc.rateMultiplier}x</p>
                    </div>
                    <div className="p-2 bg-white rounded border">
                      <span className="text-muted-foreground text-xs">Estimated Pay</span>
                      <p className="font-bold text-green-700">${calc.calculatedPay.toFixed(2)}</p>
                    </div>
                  </div>
                  {calc.minimumEngagementApplied && (
                    <div className="mt-3 flex items-center gap-2 p-2 bg-amber-100 rounded text-xs text-amber-800">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Minimum engagement of {calc.minimumEngagementHours}h applied ({dayTypeLabels[form.dayType]} rule)
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <SheetFooter className="flex gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsSheetOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleLogCallback} className="flex-1 gap-2">
              <Save className="h-4 w-4" />
              Log Callback
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
