import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { User, Clock, Star, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { AvailableStaff, OnCallAssignment } from './types';
import { availableStaff } from './mockData';

interface AssignStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  existingAssignments: OnCallAssignment[];
  onAssign: (assignment: Omit<OnCallAssignment, 'id'>) => void;
}

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

export function AssignStaffDialog({ open, onOpenChange, date, existingAssignments, onAssign }: AssignStaffDialogProps) {
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [role, setRole] = useState<'primary' | 'backup'>('primary');
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('07:00');

  const alreadyAssignedIds = existingAssignments.filter(a => a.date === date).map(a => a.staffId);
  const hasPrimary = existingAssignments.some(a => a.date === date && a.isPrimary);
  const hasBackup = existingAssignments.some(a => a.date === date && !a.isPrimary);

  const filteredStaff = availableStaff.filter(s => !alreadyAssignedIds.includes(s.id) && s.isAvailable);
  const selectedStaff = availableStaff.find(s => s.id === selectedStaffId);

  const handleAssign = () => {
    if (!selectedStaff) return;

    onAssign({
      staffId: selectedStaff.id,
      staffName: selectedStaff.name,
      staffRole: selectedStaff.role,
      staffPhone: selectedStaff.phone,
      centreId: 'centre-1',
      centreName: 'Sunshine Early Learning',
      date,
      startTime,
      endTime,
      isPrimary: role === 'primary',
      escalationOrder: role === 'primary' ? 1 : 2,
      status: 'scheduled',
      callbackCount: 0,
    });

    const dateLabel = isValidDate ? format(parsedDate, 'MMM d') : date;
    toast.success(`${selectedStaff.name} assigned as ${role} on-call for ${dateLabel}`);
    setSelectedStaffId('');
    onOpenChange(false);
  };

  const parsedDate = date ? new Date(date) : null;
  const isValidDate = parsedDate && !isNaN(parsedDate.getTime());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Assign On-Call Staff
          </DialogTitle>
          <DialogDescription>
            {isValidDate ? format(parsedDate, 'EEEE, MMMM d, yyyy') : date || 'Select a date'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Role selection */}
          <div className="space-y-2">
            <Label>Assignment Role</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={role === 'primary' ? 'default' : 'outline'}
                size="sm"
                className="flex-1 gap-1.5"
                onClick={() => setRole('primary')}
                disabled={hasPrimary}
              >
                <Star className="h-3.5 w-3.5" />
                Primary
                {hasPrimary && <span className="text-[10px]">(filled)</span>}
              </Button>
              <Button
                type="button"
                variant={role === 'backup' ? 'default' : 'outline'}
                size="sm"
                className="flex-1 gap-1.5"
                onClick={() => setRole('backup')}
                disabled={hasBackup}
              >
                <Shield className="h-3.5 w-3.5" />
                Backup
                {hasBackup && <span className="text-[10px]">(filled)</span>}
              </Button>
            </div>
          </div>

          {/* Staff selection */}
          <div className="space-y-2">
            <Label>Select Staff Member</Label>
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a staff member..." />
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
                    No available staff for this date
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Selected staff preview */}
          {selectedStaff && (
            <div className="p-3 rounded-lg border bg-muted/30 flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {getInitials(selectedStaff.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{selectedStaff.name}</p>
                <p className="text-xs text-muted-foreground">{selectedStaff.role} • {selectedStaff.phone}</p>
              </div>
              <Badge className={role === 'primary' ? 'bg-amber-500/10 text-amber-700 ml-auto' : 'bg-blue-500/10 text-blue-700 ml-auto'}>
                {role}
              </Badge>
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAssign} disabled={!selectedStaffId || (role === 'primary' && hasPrimary) || (role === 'backup' && hasBackup)}>
            Assign On-Call
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
