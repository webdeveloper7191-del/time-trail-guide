import { Timesheet } from '@/types/timesheet';
import { StatusBadge } from './StatusBadge';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface TimesheetDetailModalProps {
  timesheet: Timesheet | null;
  open: boolean;
  onClose: () => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export function TimesheetDetailModal({
  timesheet,
  open,
  onClose,
  onApprove,
  onReject,
}: TimesheetDetailModalProps) {
  if (!timesheet) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-teal-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getDayName = (dateStr: string) => {
    return format(new Date(dateStr), 'EEEE');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Timesheet Details</span>
            <StatusBadge status={timesheet.status} />
          </DialogTitle>
        </DialogHeader>

        {/* Employee Info */}
        <div className="flex items-center gap-4 py-4">
          <Avatar className={`h-14 w-14 ${getAvatarColor(timesheet.employee.name)}`}>
            <AvatarFallback className="text-white text-lg font-medium">
              {getInitials(timesheet.employee.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold">{timesheet.employee.name}</h3>
            <p className="text-sm text-muted-foreground">{timesheet.employee.email}</p>
            <p className="text-sm text-muted-foreground">
              {timesheet.employee.position} • {timesheet.employee.department}
            </p>
          </div>
        </div>

        <Separator />

        {/* Week Info */}
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Week:</span>
            <span className="font-medium">
              {format(new Date(timesheet.weekStartDate), 'MMM d')} -{' '}
              {format(new Date(timesheet.weekEndDate), 'MMM d, yyyy')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Location:</span>
            <span className="font-medium">{timesheet.location.name}</span>
          </div>
        </div>

        {/* Hours Summary */}
        <div className="grid grid-cols-3 gap-4 py-4">
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-card-foreground">{timesheet.totalHours}h</p>
            <p className="text-sm text-muted-foreground">Total Hours</p>
          </div>
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-card-foreground">{timesheet.regularHours}h</p>
            <p className="text-sm text-muted-foreground">Regular Hours</p>
          </div>
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-status-pending">{timesheet.overtimeHours}h</p>
            <p className="text-sm text-muted-foreground">Overtime</p>
          </div>
        </div>

        <Separator />

        {/* Clock Entries */}
        <div className="py-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Clock In/Out Entries
          </h4>
          <div className="space-y-2">
            {timesheet.entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div>
                  <p className="font-medium">{getDayName(entry.date)}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(entry.date), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-muted-foreground">Clock In</p>
                    <p className="font-medium">{entry.clockIn}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Clock Out</p>
                    <p className={`font-medium ${!entry.clockOut ? 'text-status-rejected' : ''}`}>
                      {entry.clockOut || 'Missing'}
                    </p>
                  </div>
                  <div className="text-center min-w-[60px]">
                    <p className="text-muted-foreground">Hours</p>
                    <p className="font-medium">{entry.totalHours}h</p>
                  </div>
                  {entry.overtime > 0 && (
                    <div className="text-center min-w-[60px]">
                      <p className="text-muted-foreground">OT</p>
                      <p className="font-medium text-status-pending">+{entry.overtime}h</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        {timesheet.notes && (
          <>
            <Separator />
            <div className="py-4">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-status-rejected-bg">
                <AlertCircle className="h-5 w-5 text-status-rejected mt-0.5" />
                <div>
                  <p className="font-medium text-status-rejected">Review Notes</p>
                  <p className="text-sm text-foreground mt-1">{timesheet.notes}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Actions for Pending */}
        {timesheet.status === 'pending' && (
          <>
            <Separator />
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => onReject?.(timesheet.id)}
                className="text-status-rejected border-status-rejected hover:bg-status-rejected-bg"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => onApprove?.(timesheet.id)}
                className="bg-status-approved hover:bg-status-approved/90"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
