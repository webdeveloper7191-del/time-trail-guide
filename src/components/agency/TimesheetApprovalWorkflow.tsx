import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/mui/Button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas';
import { FormSection, FormField, FormRow } from '@/components/ui/off-canvas/FormSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock, CheckCircle2, XCircle, AlertTriangle, FileText,
  User, DollarSign, Edit2, MessageSquare, Send,
  Download, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, parseISO, differenceInMinutes } from 'date-fns';

interface TimesheetEntry {
  id: string; candidateId: string; candidateName: string; shiftRequestId: string;
  clientName: string; locationName: string; date: string;
  scheduledStart: string; scheduledEnd: string; actualStart: string | null; actualEnd: string | null;
  breakMinutes: number; status: 'pending' | 'approved' | 'rejected' | 'queried' | 'amended';
  payRate: number; chargeRate: number; totalHours: number; grossPay: number; chargeAmount: number;
  notes?: string; disputeReason?: string; amendments?: Amendment[];
  approvedBy?: string; approvedAt?: string;
}

interface Amendment { id: string; field: string; oldValue: string; newValue: string; reason: string; timestamp: string; by: string; }

const MOCK_TIMESHEETS: TimesheetEntry[] = [
  { id: 'ts-1', candidateId: 'cand-1', candidateName: 'Sarah Chen', shiftRequestId: 'sr-1', clientName: 'Royal North Shore Hospital', locationName: 'Ward 4B - Medical', date: '2024-01-15', scheduledStart: '07:00', scheduledEnd: '15:30', actualStart: '06:55', actualEnd: '15:45', breakMinutes: 30, status: 'pending', payRate: 45, chargeRate: 65, totalHours: 8, grossPay: 360, chargeAmount: 520 },
  { id: 'ts-2', candidateId: 'cand-2', candidateName: 'Marcus Johnson', shiftRequestId: 'sr-2', clientName: 'The Langham Sydney', locationName: 'Main Kitchen', date: '2024-01-15', scheduledStart: '16:00', scheduledEnd: '23:00', actualStart: '16:00', actualEnd: '23:30', breakMinutes: 30, status: 'pending', payRate: 38, chargeRate: 55, totalHours: 7, grossPay: 266, chargeAmount: 385, notes: 'Extended shift due to function overrun' },
  { id: 'ts-3', candidateId: 'cand-3', candidateName: 'Emily Wong', shiftRequestId: 'sr-3', clientName: 'Little Scholars Early Learning', locationName: 'Bondi Centre', date: '2024-01-14', scheduledStart: '07:30', scheduledEnd: '16:00', actualStart: '07:25', actualEnd: '16:00', breakMinutes: 45, status: 'approved', payRate: 42, chargeRate: 60, totalHours: 7.75, grossPay: 325.50, chargeAmount: 465, approvedBy: 'Admin', approvedAt: '2024-01-15T09:00:00' },
  { id: 'ts-4', candidateId: 'cand-4', candidateName: 'David Park', shiftRequestId: 'sr-4', clientName: 'Royal North Shore Hospital', locationName: 'Emergency Department', date: '2024-01-14', scheduledStart: '19:00', scheduledEnd: '07:00', actualStart: '19:00', actualEnd: '07:15', breakMinutes: 60, status: 'queried', payRate: 55, chargeRate: 80, totalHours: 11.25, grossPay: 618.75, chargeAmount: 900, disputeReason: 'Break duration needs verification' }
];

const TimesheetApprovalWorkflow = () => {
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>(MOCK_TIMESHEETS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('pending');
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState<TimesheetEntry | null>(null);
  const [queryNote, setQueryNote] = useState('');
  const [amendmentReason, setAmendmentReason] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const filteredTimesheets = timesheets.filter(ts => {
    if (activeTab === 'pending') return ts.status === 'pending';
    if (activeTab === 'queried') return ts.status === 'queried';
    if (activeTab === 'approved') return ts.status === 'approved';
    if (activeTab === 'rejected') return ts.status === 'rejected';
    return true;
  });

  const pendingCount = timesheets.filter(ts => ts.status === 'pending').length;
  const queriedCount = timesheets.filter(ts => ts.status === 'queried').length;

  const toggleRowExpand = (id: string) => setExpandedRows(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const handleSelectAll = (checked: boolean) => { if (checked) setSelectedIds(new Set(filteredTimesheets.map(ts => ts.id))); else setSelectedIds(new Set()); };
  const handleSelectOne = (id: string, checked: boolean) => setSelectedIds(prev => { const next = new Set(prev); if (checked) next.add(id); else next.delete(id); return next; });

  const approveSelected = () => { setTimesheets(prev => prev.map(ts => selectedIds.has(ts.id) ? { ...ts, status: 'approved' as const, approvedBy: 'Admin', approvedAt: new Date().toISOString() } : ts)); toast.success(`${selectedIds.size} timesheet(s) approved`); setSelectedIds(new Set()); };
  const rejectSelected = () => { setTimesheets(prev => prev.map(ts => selectedIds.has(ts.id) ? { ...ts, status: 'rejected' as const } : ts)); toast.success(`${selectedIds.size} timesheet(s) rejected`); setSelectedIds(new Set()); };

  const queryTimesheet = (id: string, reason: string) => { setTimesheets(prev => prev.map(ts => ts.id === id ? { ...ts, status: 'queried' as const, disputeReason: reason } : ts)); toast.success('Query sent to worker'); setQueryNote(''); setShowDetailPanel(false); };

  const getVarianceInfo = (ts: TimesheetEntry) => {
    if (!ts.actualStart || !ts.actualEnd) return null;
    const scheduledMinutes = differenceInMinutes(parseISO(`2024-01-01T${ts.scheduledEnd}`), parseISO(`2024-01-01T${ts.scheduledStart}`));
    const actualMinutes = differenceInMinutes(parseISO(`2024-01-01T${ts.actualEnd}`), parseISO(`2024-01-01T${ts.actualStart}`));
    const variance = actualMinutes - scheduledMinutes;
    return { variance, isOver: variance > 0, label: variance > 0 ? `+${variance}min` : `${variance}min` };
  };

  const getStatusBadge = (status: TimesheetEntry['status']) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved': return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected': return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'queried': return <Badge variant="outline" className="border-orange-500 text-orange-600"><AlertTriangle className="h-3 w-3 mr-1" />Queried</Badge>;
      case 'amended': return <Badge variant="outline" className="border-blue-500 text-blue-600"><Edit2 className="h-3 w-3 mr-1" />Amended</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Pending Approval</p><p className="text-2xl font-bold">{pendingCount}</p></div><Clock className="h-8 w-8 text-muted-foreground" /></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Queries Open</p><p className="text-2xl font-bold">{queriedCount}</p></div><AlertTriangle className="h-8 w-8 text-orange-500" /></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">This Week Approved</p><p className="text-2xl font-bold">${timesheets.filter(t => t.status === 'approved').reduce((sum, t) => sum + t.chargeAmount, 0).toLocaleString()}</p></div><CheckCircle2 className="h-8 w-8 text-green-500" /></div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Pending Value</p><p className="text-2xl font-bold">${timesheets.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.chargeAmount, 0).toLocaleString()}</p></div><DollarSign className="h-8 w-8 text-muted-foreground" /></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Timesheet Approval</CardTitle>
            <div className="flex gap-2">
              {selectedIds.size > 0 && (
                <>
                  <Button variant="outlined" size="small" onClick={rejectSelected}><XCircle className="h-4 w-4 mr-1" />Reject ({selectedIds.size})</Button>
                  <Button size="small" onClick={approveSelected}><CheckCircle2 className="h-4 w-4 mr-1" />Approve ({selectedIds.size})</Button>
                </>
              )}
              <Button variant="outlined" size="small"><Download className="h-4 w-4 mr-1" />Export</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="pending" className="gap-1">Pending{pendingCount > 0 && <Badge variant="secondary" className="ml-1">{pendingCount}</Badge>}</TabsTrigger>
              <TabsTrigger value="queried" className="gap-1">Queried{queriedCount > 0 && <Badge variant="outline" className="ml-1 border-orange-500">{queriedCount}</Badge>}</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <div className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="grid grid-cols-[40px_1fr_1fr_120px_120px_100px_100px_100px_80px] gap-2 p-2 bg-muted/50 rounded-t-lg text-xs font-medium">
                  <div className="flex items-center"><Checkbox checked={selectedIds.size === filteredTimesheets.length && filteredTimesheets.length > 0} onCheckedChange={handleSelectAll} /></div>
                  <div>Worker / Client</div><div>Shift Details</div><div>Scheduled</div><div>Actual</div><div className="text-right">Hours</div><div className="text-right">Pay</div><div className="text-right">Charge</div><div>Status</div>
                </div>

                {filteredTimesheets.map(ts => {
                  const variance = getVarianceInfo(ts);
                  const isExpanded = expandedRows.has(ts.id);
                  return (
                    <div key={ts.id} className="border-b last:border-b-0">
                      <div className={cn('grid grid-cols-[40px_1fr_1fr_120px_120px_100px_100px_100px_80px] gap-2 p-2 items-center hover:bg-muted/30 cursor-pointer', selectedIds.has(ts.id) && 'bg-primary/5')} onClick={() => toggleRowExpand(ts.id)}>
                        <div className="flex items-center" onClick={e => e.stopPropagation()}><Checkbox checked={selectedIds.has(ts.id)} onCheckedChange={(checked) => handleSelectOne(ts.id, !!checked)} /></div>
                        <div><p className="text-sm font-medium">{ts.candidateName}</p><p className="text-xs text-muted-foreground">{ts.clientName}</p></div>
                        <div><p className="text-sm">{ts.locationName}</p><p className="text-xs text-muted-foreground">{format(parseISO(ts.date), 'EEE, MMM d')}</p></div>
                        <div className="text-sm">{ts.scheduledStart} - {ts.scheduledEnd}</div>
                        <div className="text-sm">{ts.actualStart || '--'} - {ts.actualEnd || '--'}{variance && <span className={cn('text-xs ml-1', variance.isOver ? 'text-orange-600' : 'text-green-600')}>({variance.label})</span>}</div>
                        <div className="text-sm text-right font-medium">{ts.totalHours}h</div>
                        <div className="text-sm text-right">${ts.grossPay.toFixed(2)}</div>
                        <div className="text-sm text-right font-medium">${ts.chargeAmount.toFixed(2)}</div>
                        <div className="flex items-center gap-1">{getStatusBadge(ts.status)}{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 bg-muted/20 border-t space-y-3">
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div><span className="text-muted-foreground">Pay Rate:</span><span className="ml-2 font-medium">${ts.payRate}/hr</span></div>
                            <div><span className="text-muted-foreground">Charge Rate:</span><span className="ml-2 font-medium">${ts.chargeRate}/hr</span></div>
                            <div><span className="text-muted-foreground">Break:</span><span className="ml-2 font-medium">{ts.breakMinutes} mins</span></div>
                            <div><span className="text-muted-foreground">Margin:</span><span className="ml-2 font-medium text-green-600">${(ts.chargeAmount - ts.grossPay).toFixed(2)} ({((ts.chargeAmount - ts.grossPay) / ts.chargeAmount * 100).toFixed(1)}%)</span></div>
                          </div>
                          {ts.notes && <div className="text-sm"><span className="text-muted-foreground">Notes:</span><span className="ml-2">{ts.notes}</span></div>}
                          {ts.disputeReason && <div className="p-2 bg-orange-50 dark:bg-orange-950/30 rounded text-sm"><span className="text-orange-600 font-medium">Query:</span><span className="ml-2">{ts.disputeReason}</span></div>}
                          {ts.amendments && ts.amendments.length > 0 && <div className="space-y-1"><span className="text-sm text-muted-foreground">Amendments:</span>{ts.amendments.map(a => <div key={a.id} className="text-xs p-2 bg-blue-50 dark:bg-blue-950/30 rounded"><span className="font-medium">{a.field}:</span> {a.oldValue} → {a.newValue}<span className="text-muted-foreground ml-2">({a.reason})</span></div>)}</div>}
                          <div className="flex gap-2 pt-2" onClick={e => e.stopPropagation()}>
                            {ts.status === 'pending' && (
                              <>
                                <Button size="small" onClick={() => { setSelectedTimesheet(ts); setShowDetailPanel(true); }}><Edit2 className="h-4 w-4 mr-1" />Review & Edit</Button>
                                <Button variant="outlined" size="small" onClick={() => { setTimesheets(prev => prev.map(t => t.id === ts.id ? { ...t, status: 'approved' as const, approvedBy: 'Admin', approvedAt: new Date().toISOString() } : t)); toast.success('Timesheet approved'); }}><CheckCircle2 className="h-4 w-4 mr-1" />Approve</Button>
                              </>
                            )}
                            {ts.status === 'queried' && <Button size="small" onClick={() => { setSelectedTimesheet(ts); setShowDetailPanel(true); }}><MessageSquare className="h-4 w-4 mr-1" />Respond to Query</Button>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredTimesheets.length === 0 && <div className="p-8 text-center text-muted-foreground"><FileText className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No timesheets in this category</p></div>}
              </ScrollArea>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Detail Side Panel */}
      <PrimaryOffCanvas
        open={showDetailPanel}
        onClose={() => setShowDetailPanel(false)}
        title="Review Timesheet"
        icon={Edit2}
        size="lg"
        isBackground
        actions={[
          ...(queryNote ? [{ label: 'Send Query', variant: 'outlined' as const, onClick: () => selectedTimesheet && queryTimesheet(selectedTimesheet.id, queryNote), icon: <Send className="h-4 w-4" /> }] : []),
          { label: 'Reject', variant: 'outlined' as const, onClick: () => { if (selectedTimesheet) { setTimesheets(prev => prev.map(ts => ts.id === selectedTimesheet.id ? { ...ts, status: 'rejected' as const } : ts)); toast.success('Timesheet rejected'); setShowDetailPanel(false); } }, icon: <XCircle className="h-4 w-4" /> },
          { label: 'Approve', variant: 'primary' as const, onClick: () => { if (selectedTimesheet) { setTimesheets(prev => prev.map(ts => ts.id === selectedTimesheet.id ? { ...ts, status: 'approved' as const, approvedBy: 'Admin', approvedAt: new Date().toISOString() } : ts)); toast.success('Timesheet approved'); setShowDetailPanel(false); } }, icon: <CheckCircle2 className="h-4 w-4" /> },
        ]}
      >
        {selectedTimesheet && (
          <>
            <FormSection title="Shift Information">
              <FormRow>
                <FormField label="Worker"><div className="text-sm font-medium">{selectedTimesheet.candidateName}</div></FormField>
                <FormField label="Client"><div className="text-sm font-medium">{selectedTimesheet.clientName}</div></FormField>
              </FormRow>
              <FormRow>
                <FormField label="Date"><div className="text-sm font-medium">{format(parseISO(selectedTimesheet.date), 'EEEE, MMMM d, yyyy')}</div></FormField>
                <FormField label="Location"><div className="text-sm font-medium">{selectedTimesheet.locationName}</div></FormField>
              </FormRow>
            </FormSection>

            <FormSection title="Time Details">
              <FormRow>
                <FormField label="Actual Start"><Input type="time" value={selectedTimesheet.actualStart || ''} onChange={() => {}} /></FormField>
                <FormField label="Actual End"><Input type="time" value={selectedTimesheet.actualEnd || ''} onChange={() => {}} /></FormField>
              </FormRow>
              <FormField label="Amendment Reason"><Input placeholder="Reason for amendment..." value={amendmentReason} onChange={(e) => setAmendmentReason(e.target.value)} /></FormField>
            </FormSection>

            <FormSection title="Query Worker">
              <Textarea placeholder="Enter query message to send to worker..." value={queryNote} onChange={(e) => setQueryNote(e.target.value)} rows={3} />
            </FormSection>
          </>
        )}
      </PrimaryOffCanvas>
    </div>
  );
};

export default TimesheetApprovalWorkflow;
