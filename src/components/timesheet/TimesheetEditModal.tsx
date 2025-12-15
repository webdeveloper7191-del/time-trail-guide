import { useState, useEffect } from 'react';
import { Timesheet, ClockEntry } from '@/types/timesheet';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TimesheetEditModalProps {
  timesheet: Timesheet | null;
  open: boolean;
  onClose: () => void;
  onSave: (timesheet: Timesheet) => void;
}

export function TimesheetEditModal({
  timesheet,
  open,
  onClose,
  onSave,
}: TimesheetEditModalProps) {
  const [entries, setEntries] = useState<ClockEntry[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (timesheet) {
      setEntries([...timesheet.entries]);
      setNotes(timesheet.notes || '');
    }
  }, [timesheet]);

  if (!timesheet) return null;

  const handleEntryChange = (
    index: number,
    field: 'clockIn' | 'clockOut',
    value: string
  ) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setEntries(newEntries);
  };

  const calculateTotalHours = (clockIn: string, clockOut: string | null): number => {
    if (!clockOut) return 0;
    const [inHour, inMin] = clockIn.split(':').map(Number);
    const [outHour, outMin] = clockOut.split(':').map(Number);
    const hours = (outHour * 60 + outMin - inHour * 60 - inMin) / 60;
    return Math.max(0, Math.round(hours * 100) / 100);
  };

  const handleSave = () => {
    const updatedEntries = entries.map((entry) => ({
      ...entry,
      totalHours: calculateTotalHours(entry.clockIn, entry.clockOut),
      overtime: Math.max(0, calculateTotalHours(entry.clockIn, entry.clockOut) - 8),
    }));

    const totalHours = updatedEntries.reduce((sum, e) => sum + e.totalHours, 0);
    const regularHours = Math.min(totalHours, 40);
    const overtimeHours = Math.max(0, totalHours - 40);

    const updatedTimesheet: Timesheet = {
      ...timesheet,
      entries: updatedEntries,
      totalHours: Math.round(totalHours * 100) / 100,
      regularHours: Math.round(regularHours * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      notes,
    };

    onSave(updatedTimesheet);
    toast({
      title: 'Timesheet Updated',
      description: 'The timesheet has been successfully updated.',
    });
    onClose();
  };

  const getDayName = (dateStr: string) => {
    return format(new Date(dateStr), 'EEE, MMM d');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Timesheet</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-4 p-3 rounded-lg bg-muted">
            <p className="font-medium">{timesheet.employee.name}</p>
            <p className="text-sm text-muted-foreground">
              Week: {format(new Date(timesheet.weekStartDate), 'MMM d')} -{' '}
              {format(new Date(timesheet.weekEndDate), 'MMM d, yyyy')}
            </p>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-semibold">Clock Entries</Label>
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className="grid grid-cols-3 gap-3 p-3 rounded-lg border border-border"
              >
                <div className="col-span-3 text-sm font-medium text-muted-foreground">
                  {getDayName(entry.date)}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Clock In</Label>
                  <Input
                    type="time"
                    value={entry.clockIn}
                    onChange={(e) => handleEntryChange(index, 'clockIn', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Clock Out</Label>
                  <Input
                    type="time"
                    value={entry.clockOut || ''}
                    onChange={(e) => handleEntryChange(index, 'clockOut', e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Hours: </span>
                    <span className="font-medium">
                      {calculateTotalHours(entry.clockIn, entry.clockOut)}h
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Label className="text-base font-semibold">Admin Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes for this timesheet..."
              className="mt-2"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
