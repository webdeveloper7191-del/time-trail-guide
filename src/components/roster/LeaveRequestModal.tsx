import { useState, useEffect } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Tab,
  Tabs,
  Box,
  MenuItem,
  TextField,
  Typography,
  FormHelperText,
} from '@mui/material';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TimeOff, timeOffTypeLabels, StaffMember } from '@/types/roster';
import { format } from 'date-fns';
import { Check, X, Clock, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import PrimaryOffCanvas, { OffCanvasAction } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { leaveRequestSchema, LeaveRequestFormValues } from '@/lib/validationSchemas';
import { toast } from 'sonner';

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
  const [tabValue, setTabValue] = useState(0);

  const methods = useForm<LeaveRequestFormValues>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      staffId: '',
      startDate: '',
      endDate: '',
      type: 'annual_leave',
      notes: '',
    },
    mode: 'onChange',
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = methods;

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      reset({
        staffId: '',
        startDate: '',
        endDate: '',
        type: 'annual_leave',
        notes: '',
      });
    }
  }, [open, reset]);

  const pendingRequests = leaveRequests.filter(r => r.status === 'pending');
  const approvedRequests = leaveRequests.filter(r => r.status === 'approved');
  const rejectedRequests = leaveRequests.filter(r => r.status === 'rejected');

  const onSubmit = (data: LeaveRequestFormValues) => {
    onCreateRequest({
      staffId: data.staffId,
      startDate: data.startDate,
      endDate: data.endDate,
      type: data.type,
      status: 'pending',
      notes: data.notes,
    });
    reset();
    toast.success('Leave request submitted');
    setTabValue(0); // Switch to pending tab
  };

  const statusColors = {
    pending: 'bg-amber-500/15 text-amber-700 border-amber-500/50',
    approved: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/50',
    rejected: 'bg-destructive/15 text-destructive border-destructive/50',
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const actions: OffCanvasAction[] = tabValue === 3 
    ? [
        { label: 'Cancel', onClick: handleClose, variant: 'outlined' },
        { label: 'Submit Request', onClick: handleSubmit(onSubmit), variant: 'primary', disabled: !isValid },
      ]
    : [];

  return (
    <FormProvider {...methods}>
      <PrimaryOffCanvas
        title="Leave Request Management"
        description="Manage staff leave requests and create new ones"
        width="500px"
        open={open}
        onClose={handleClose}
        actions={actions}
        showFooter={tabValue === 3}
      >
        <div>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>Pending <Badge variant="secondary" className="text-xs">{pendingRequests.length}</Badge></Box>} />
            <Tab label="Approved" />
            <Tab label="Rejected" />
            <Tab label="New Request" />
          </Tabs>

          {/* Pending Tab */}
          {tabValue === 0 && (
            <Box sx={{ mt: 2 }}>
              <ScrollArea className="h-[calc(100vh-320px)]">
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
              <ScrollArea className="h-[calc(100vh-320px)]">
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
              <ScrollArea className="h-[calc(100vh-320px)]">
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
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Staff Member *</Label>
                      <Controller
                        name="staffId"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            select
                            fullWidth
                            size="small"
                            placeholder="Select staff..."
                            error={!!errors.staffId}
                            helperText={errors.staffId?.message}
                          >
                            {staff.map((s) => (
                              <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                            ))}
                          </TextField>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Leave Type *</Label>
                      <Controller
                        name="type"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            select
                            fullWidth
                            size="small"
                            error={!!errors.type}
                            helperText={errors.type?.message}
                          >
                            {Object.entries(timeOffTypeLabels).map(([key, label]) => (
                              <MenuItem key={key} value={key}>{label}</MenuItem>
                            ))}
                          </TextField>
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date *</Label>
                      <Controller
                        name="startDate"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="date"
                            fullWidth
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            error={!!errors.startDate}
                            helperText={errors.startDate?.message}
                          />
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date *</Label>
                      <Controller
                        name="endDate"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="date"
                            fullWidth
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            error={!!errors.endDate}
                            helperText={errors.endDate?.message}
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Controller
                      name="notes"
                      control={control}
                      render={({ field }) => (
                        <Textarea 
                          {...field}
                          placeholder="Optional notes..." 
                        />
                      )}
                    />
                    {errors.notes && (
                      <FormHelperText error>{errors.notes.message}</FormHelperText>
                    )}
                  </div>
                </div>
              </form>
            </Box>
          )}
        </div>
      </PrimaryOffCanvas>
    </FormProvider>
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
