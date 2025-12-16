import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Shift, StaffMember, roleLabels, qualificationLabels } from '@/types/roster';
import { ArrowLeftRight, Search, AlertTriangle, Check, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShiftSwapModalProps {
  open: boolean;
  onClose: () => void;
  shift: Shift;
  staff: StaffMember[];
  allShifts: Shift[];
  onSwap: (fromShift: Shift, toStaffId: string) => void;
}

export function ShiftSwapModal({ open, onClose, shift, staff, allShifts, onSwap }: ShiftSwapModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  const currentStaff = staff.find(s => s.id === shift.staffId);

  // Find eligible staff for swap
  const eligibleStaff = useMemo(() => {
    return staff.filter(s => {
      // Can't swap with self
      if (s.id === shift.staffId) return false;
      
      // Check if staff is available on the shift date
      const shiftDate = new Date(shift.date);
      const dayOfWeek = shiftDate.getDay();
      const availability = s.availability.find(a => a.dayOfWeek === dayOfWeek);
      if (!availability?.available) return false;

      // Check if staff already has a shift at that time
      const hasConflict = allShifts.some(existingShift => 
        existingShift.staffId === s.id && 
        existingShift.date === shift.date &&
        existingShift.id !== shift.id
      );
      if (hasConflict) return false;

      // Check hours capacity
      const shiftHours = calculateShiftHours(shift);
      if (s.currentWeeklyHours + shiftHours > s.maxHoursPerWeek + 2) return false; // Allow slight overtime

      return true;
    }).filter(s => {
      if (!searchQuery) return true;
      return s.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [staff, shift, allShifts, searchQuery]);

  const calculateShiftHours = (s: Shift) => {
    const [startH, startM] = s.startTime.split(':').map(Number);
    const [endH, endM] = s.endTime.split(':').map(Number);
    return ((endH * 60 + endM) - (startH * 60 + startM) - s.breakMinutes) / 60;
  };

  const getConflicts = (staffId: string) => {
    const conflicts: string[] = [];
    const member = staff.find(s => s.id === staffId);
    if (!member) return conflicts;

    const shiftHours = calculateShiftHours(shift);
    const newTotalHours = member.currentWeeklyHours + shiftHours;
    
    if (newTotalHours > member.maxHoursPerWeek) {
      conflicts.push(`Will result in ${Math.round((newTotalHours - member.maxHoursPerWeek) * 10) / 10}h overtime`);
    }

    return conflicts;
  };

  const handleSwap = () => {
    if (selectedStaffId) {
      onSwap(shift, selectedStaffId);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            Swap Shift
          </DialogTitle>
        </DialogHeader>

        {/* Current Assignment */}
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground mb-2">Current Assignment</p>
          <div className="flex items-center gap-3">
            <div 
              className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: currentStaff?.color }}
            >
              {currentStaff?.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <p className="font-medium">{currentStaff?.name}</p>
              <p className="text-sm text-muted-foreground">{currentStaff && roleLabels[currentStaff.role]}</p>
            </div>
            <div className="text-right">
              <p className="font-medium">{shift.startTime} - {shift.endTime}</p>
              <p className="text-sm text-muted-foreground">{shift.date}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search staff to swap with..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Eligible Staff */}
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {eligibleStaff.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <User className="h-12 w-12 mb-2 opacity-50" />
                <p className="text-center">No eligible staff found<br/>for this shift</p>
              </div>
            ) : (
              eligibleStaff.map((member) => {
                const conflicts = getConflicts(member.id);
                const hoursRemaining = member.maxHoursPerWeek - member.currentWeeklyHours;
                const isSelected = selectedStaffId === member.id;

                return (
                  <div
                    key={member.id}
                    onClick={() => setSelectedStaffId(member.id)}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      isSelected 
                        ? "border-primary bg-primary/5 ring-1 ring-primary" 
                        : "border-border bg-card hover:border-muted-foreground/50",
                      conflicts.length > 0 && !isSelected && "border-amber-500/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0"
                        style={{ backgroundColor: member.color }}
                      >
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{member.name}</p>
                          {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                        </div>
                        <p className="text-sm text-muted-foreground">{roleLabels[member.role]} • ${member.hourlyRate}/hr</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          <span className={cn(hoursRemaining <= 0 && "text-destructive")}>
                            {hoursRemaining}h available this week
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {member.qualifications.slice(0, 3).map((q, idx) => (
                            <Badge key={idx} variant="secondary" className="text-[10px] px-1 py-0 h-4">
                              {qualificationLabels[q.type].slice(0, 8)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {conflicts.length > 0 && (
                      <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-600 bg-amber-500/10 p-2 rounded">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <div>{conflicts.join(', ')}</div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSwap} disabled={!selectedStaffId}>
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Confirm Swap
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
