import { useState } from 'react';
import {
  Tab,
  Tabs,
  Box,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TimeOff, timeOffTypeLabels, StaffMember } from '@/types/roster';
import { format } from 'date-fns';
import { Check, X, Clock, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

interface LeaveRequest extends TimeOff {
  staffName: string;
  requestedDate: string;
}

interface LeaveRequestModalProps {
  open: boolean;
  onClose: () => void;
  staff: StaffMember[];
  leaveRequests: LeaveRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onCreateRequest: (request: Omit<TimeOff, 'id'>) => void;
}

export function LeaveRequestModal({ 
  open, 
  onClose, 
  staff, 
  leaveRequests, 
  onApprove, 
  onReject,
  onCreateRequest 
}: LeaveRequestModalProps) {
  const [selectedStaff, setSelectedStaff] = useState('');
  const [leaveType, setLeaveType] = useState<TimeOff['type']>('annual_leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [tabValue, setTabValue] = useState(0);

  const pendingRequests = leaveRequests.filter(r => r.status === 'pending');
  const approvedRequests = leaveRequests.filter(r => r.status === 'approved');
  const rejectedRequests = leaveRequests.filter(r => r.status === 'rejected');

  const handleSubmit = () => {
    if (!selectedStaff || !startDate || !endDate) return;
    onCreateRequest({
      staffId: selectedStaff,
      startDate,
      endDate,
      type: leaveType,
      status: 'pending',
      notes,
    });
    setSelectedStaff('');
    setStartDate('');
    setEndDate('');
    setNotes('');
  };

  const statusColors = {
    pending: 'bg-amber-500/15 text-amber-700 border-amber-500/50',
    approved: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/50',
    rejected: 'bg-destructive/15 text-destructive border-destructive/50',
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Leave Request Management
          </SheetTitle>
          <SheetDescription>
            Manage staff leave requests and create new ones
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>Pending <Badge variant="secondary" className="text-xs">{pendingRequests.length}</Badge></Box>} />
            <Tab label="Approved" />
            <Tab label="Rejected" />
            <Tab label="New Request" />
          </Tabs>

          {/* Pending Tab */}
          {tabValue === 0 && (
            <Box sx={{ mt: 2 }}>
              <ScrollArea className="h-[calc(100vh-280px)]">
                {pendingRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mb-2 opacity-50" />
                    <p>No pending requests</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingRequests.map((request) => (
                      <LeaveRequestCard 
                        key={request.id} 
                        request={request}
                        statusColors={statusColors}
                        onApprove={() => onApprove(request.id)}
                        onReject={() => onReject(request.id)}
                        showActions
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Box>
          )}

          {/* Approved Tab */}
          {tabValue === 1 && (
            <Box sx={{ mt: 2 }}>
              <ScrollArea className="h-[calc(100vh-280px)]">
                {approvedRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Check className="h-12 w-12 mb-2 opacity-50" />
                    <p>No approved requests</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {approvedRequests.map((request) => (
                      <LeaveRequestCard 
                        key={request.id} 
                        request={request}
                        statusColors={statusColors}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Box>
          )}

          {/* Rejected Tab */}
          {tabValue === 2 && (
            <Box sx={{ mt: 2 }}>
              <ScrollArea className="h-[calc(100vh-280px)]">
                {rejectedRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <X className="h-12 w-12 mb-2 opacity-50" />
                    <p>No rejected requests</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rejectedRequests.map((request) => (
                      <LeaveRequestCard 
                        key={request.id} 
                        request={request}
                        statusColors={statusColors}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Box>
          )}

          {/* New Request Tab */}
          {tabValue === 3 && (
            <Box sx={{ mt: 2 }}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Staff Member</Label>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={selectedStaff}
                      onChange={(e) => setSelectedStaff(e.target.value)}
                      placeholder="Select staff..."
                    >
                      {staff.map((s) => (
                        <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                      ))}
                    </TextField>
                  </div>

                  <div className="space-y-2">
                    <Label>Leave Type</Label>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value as TimeOff['type'])}
                    >
                      {Object.entries(timeOffTypeLabels).map(([key, label]) => (
                        <MenuItem key={key} value={key}>{label}</MenuItem>
                      ))}
                    </TextField>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea 
                    placeholder="Optional notes..." 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <Button onClick={handleSubmit} disabled={!selectedStaff || !startDate || !endDate} className="w-full">
                  Submit Leave Request
                </Button>
              </div>
            </Box>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function LeaveRequestCard({ 
  request, 
  statusColors, 
  onApprove, 
  onReject, 
  showActions 
}: { 
  request: LeaveRequest & { staffName: string }; 
  statusColors: Record<string, string>;
  onApprove?: () => void;
  onReject?: () => void;
  showActions?: boolean;
}) {
  return (
    <div className="p-4 rounded-lg border border-border bg-card">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{request.staffName}</p>
            <p className="text-sm text-muted-foreground">{timeOffTypeLabels[request.type]}</p>
          </div>
        </div>
        <Badge className={cn("text-xs", statusColors[request.status])}>
          {request.status}
        </Badge>
      </div>

      <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          <span>{request.startDate} → {request.endDate}</span>
        </div>
      </div>

      {request.notes && (
        <p className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">{request.notes}</p>
      )}

      {showActions && (
        <div className="mt-4 flex gap-2">
          <Button size="sm" onClick={onApprove} className="flex-1 gap-1">
            <Check className="h-4 w-4" />
            Approve
          </Button>
          <Button size="sm" variant="outline" onClick={onReject} className="flex-1 gap-1">
            <X className="h-4 w-4" />
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}
