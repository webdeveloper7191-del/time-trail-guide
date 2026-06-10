import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';
import { ExceptionReason, TimesheetException } from '@/types/timesheet';
import { toast } from 'sonner';

export const EXCEPTION_REASONS: { value: ExceptionReason; label: string }[] = [
  { value: 'missed_clock_in', label: 'Missed clock-in' },
  { value: 'missed_clock_out', label: 'Forgot to clock out' },
  { value: 'missed_break', label: 'Missed / short break' },
  { value: 'unpaid_overtime', label: 'Worked unpaid overtime' },
  { value: 'equipment_issue', label: 'Equipment / kiosk issue' },
  { value: 'incorrect_rate', label: 'Incorrect pay rate' },
  { value: 'shift_cut_short', label: 'Shift cut short' },
  { value: 'other', label: 'Other' },
];

interface RaiseExceptionDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (exception: TimesheetException) => void;
  raisedBy: 'staff' | 'manager';
  contextLabel?: string;
  initial?: TimesheetException;
}

export function RaiseExceptionDialog({
  open,
  onClose,
  onSubmit,
  raisedBy,
  contextLabel,
  initial,
}: RaiseExceptionDialogProps) {
  const [reason, setReason] = useState<ExceptionReason | ''>('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setReason(initial?.reason ?? '');
      setNote(initial?.note ?? '');
    }
  }, [open, initial]);

  const handleSubmit = () => {
    if (!reason) {
      toast.error('Select a reason');
      return;
    }
    if (!note.trim()) {
      toast.error('Add a short note explaining what happened');
      return;
    }
    onSubmit({
      reason: reason as ExceptionReason,
      note: note.trim(),
      raisedBy,
      raisedAt: new Date().toISOString(),
      resolved: false,
    });
    toast.success('Exception raised — routed to approver');
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col gap-0">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Raise exception
          </SheetTitle>
          <SheetDescription className="text-xs">
            {contextLabel
              ? `Flag this entry (${contextLabel}) for review.`
              : 'Flag this timesheet for human review before approval.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="space-y-1.5">
            <Label className="text-xs">Reason</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as ExceptionReason)}>
              <SelectTrigger><SelectValue placeholder="Select a reason..." /></SelectTrigger>
              <SelectContent>
                {EXCEPTION_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Note</Label>
            <Textarea
              placeholder="Explain briefly what happened..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[140px]"
            />
          </div>
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
            <p className="text-[11px] text-muted-foreground">
              This routes to the approver tier configured under{' '}
              <em>Workflow &amp; Notifications → Manual exception raised</em>. The timesheet
              will be locked from auto-approval until reviewed.
            </p>
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t border-border flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSubmit} className="flex-1">Raise exception</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
