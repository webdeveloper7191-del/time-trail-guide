import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ArrowRightLeft, Clock, Star, Shield, Trash2, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { AvailableStaff, OnCallAssignment } from './types';
import { availableStaff } from './mockData';

interface SwapStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: OnCallAssignment | null;
  existingAssignments: OnCallAssignment[];
  onSwap: (assignmentId: string, newStaff: AvailableStaff, startTime: string, endTime: string) => void;
  onRemove: (assignmentId: string) => void;
}

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

export function SwapStaffDialog({ open, onOpenChange, assignment, existingAssignments, onSwap, onRemove }: SwapStaffDialogProps) {
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('07:00');

  if (!assignment) return null;

  const alreadyAssignedIds = existingAssignments
    .filter(a => a.date === assignment.date && a.id !== assignment.id)
    .map(a => a.staffId);

  const filteredStaff = availableStaff.filter(
    s => !alreadyAssignedIds.includes(s.id) && s.id !== assignment.staffId && s.isAvailable
  );

  const selectedStaff = availableStaff.find(s => s.id === selectedStaffId);

  const handleSwap = () => {
    if (!selectedStaff) return;
    onSwap(assignment.id, selectedStaff, startTime, endTime);
    toast.success(`Swapped ${assignment.staffName} → ${selectedStaff.name} as ${assignment.isPrimary ? 'primary' : 'backup'} on ${format(new Date(assignment.date), 'MMM d')}`);
    setSelectedStaffId('');
    onOpenChange(false);
  };

  const handleRemove = () => {
    onRemove(assignment.id);
    toast.success(`Removed ${assignment.staffName} from on-call on ${format(new Date(assignment.date), 'MMM d')}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Swap / Reassign On-Call
          </DialogTitle>
          <DialogDescription>
            {format(new Date(assignment.date), 'EEEE, MMMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current assignment */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Current Assignment</Label>
            <div className="p-3 rounded-lg border bg-muted/30 flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className={assignment.isPrimary ? 'bg-amber-500/10 text-amber-700 text-xs' : 'bg-blue-500/10 text-blue-700 text-xs'}>
                  {getInitials(assignment.staffName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-sm">{assignment.staffName}</p>
                <p className="text-xs text-muted-foreground">{assignment.staffRole} • {assignment.startTime}–{assignment.endTime}</p>
              </div>
              <Badge className={assignment.isPrimary ? 'bg-amber-500/10 text-amber-700' : 'bg-blue-500/10 text-blue-700'}>
                {assignment.isPrimary ? (
                  <span className="flex items-center gap-1"><Star className="h-3 w-3" /> Primary</span>
                ) : (
                  <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Backup</span>
                )}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowRightLeft className="h-3 w-3" /> Swap with
            </span>
            <Separator className="flex-1" />
          </div>

          {/* New staff selection */}
          <div className="space-y-2">
            <Label>Replacement Staff</Label>
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose replacement..." />
              </SelectTrigger>
              <SelectContent>
                {filteredStaff.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex items-center gap-2">
                      <span>{s.name}</span>
                      <span className="text-muted-foreground text-xs">— {s.role}</span>
                    </div>
                  </SelectItem>
                ))}
                {filteredStaff.length === 0 && (
                  <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                    No available staff to swap
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* New staff preview */}
          {selectedStaff && (
            <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {getInitials(selectedStaff.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-sm">{selectedStaff.name}</p>
                <p className="text-xs text-muted-foreground">{selectedStaff.role} • {selectedStaff.phone}</p>
              </div>
              <UserCheck className="h-4 w-4 text-primary" />
            </div>
          )}

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Start Time
              </Label>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> End Time
              </Label>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5 sm:mr-auto"
            onClick={handleRemove}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove Assignment
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSwap} disabled={!selectedStaffId} className="gap-1.5">
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Confirm Swap
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
