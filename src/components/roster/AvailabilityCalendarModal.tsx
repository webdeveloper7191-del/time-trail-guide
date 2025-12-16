import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StaffMember, roleLabels, employmentTypeLabels, agencyLabels } from '@/types/roster';
import { format, startOfWeek, addDays } from 'date-fns';
import { Check, X, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvailabilityCalendarModalProps {
  open: boolean;
  onClose: () => void;
  staff: StaffMember[];
  currentDate: Date;
}

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function AvailabilityCalendarModal({ open, onClose, staff, currentDate }: AvailabilityCalendarModalProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const dates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getAvailabilityForDay = (member: StaffMember, dayOfWeek: number) => {
    // Convert our day index (0=Mon) to the availability dayOfWeek (0=Sun)
    const availDayOfWeek = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
    return member.availability.find(a => a.dayOfWeek === availDayOfWeek);
  };

  const isOnTimeOff = (member: StaffMember, date: Date) => {
    if (!member.timeOff) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    return member.timeOff.some(to => 
      to.status === 'approved' && 
      dateStr >= to.startDate && 
      dateStr <= to.endDate
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Staff Availability - Week of {format(weekStart, 'MMM d, yyyy')}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[600px]">
          <div className="min-w-max">
            {/* Header */}
            <div className="flex sticky top-0 z-10 bg-card border-b border-border">
              <div className="w-56 shrink-0 p-3 font-medium text-sm text-muted-foreground border-r border-border">
                Staff Member
              </div>
              {dates.map((date, idx) => (
                <div 
                  key={idx}
                  className="flex-1 min-w-[100px] p-2 text-center border-r border-border bg-muted/50"
                >
                  <div className="text-sm font-medium">{dayNames[idx]}</div>
                  <div className="text-xs text-muted-foreground">{format(date, 'd MMM')}</div>
                </div>
              ))}
            </div>

            {/* Staff rows */}
            {staff.map((member) => (
              <div key={member.id} className="flex border-b border-border hover:bg-muted/20">
                <div className="w-56 shrink-0 p-2 border-r border-border flex items-center gap-2">
                  <div 
                    className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {roleLabels[member.role]} • {member.agency ? agencyLabels[member.agency] : employmentTypeLabels[member.employmentType]}
                    </p>
                  </div>
                </div>

                {dates.map((date, dayIdx) => {
                  const availability = getAvailabilityForDay(member, dayIdx);
                  const onLeave = isOnTimeOff(member, date);
                  const isAvailable = availability?.available && !onLeave;

                  return (
                    <div 
                      key={dayIdx}
                      className={cn(
                        "flex-1 min-w-[100px] p-2 border-r border-border flex flex-col items-center justify-center",
                        onLeave && "bg-amber-500/10",
                        isAvailable && "bg-emerald-500/5",
                        !isAvailable && !onLeave && "bg-muted/30"
                      )}
                    >
                      {onLeave ? (
                        <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-600">
                          On Leave
                        </Badge>
                      ) : isAvailable ? (
                        <>
                          <div className="flex items-center gap-1 text-emerald-600 mb-1">
                            <Check className="h-4 w-4" />
                            <span className="text-xs font-medium">Available</span>
                          </div>
                          {availability?.startTime && availability?.endTime && (
                            <span className="text-[10px] text-muted-foreground">
                              {availability.startTime} - {availability.endTime}
                            </span>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <X className="h-4 w-4" />
                          <span className="text-xs">Unavailable</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Legend */}
        <div className="flex items-center gap-6 pt-3 border-t border-border text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-emerald-500/20 border border-emerald-500" />
            <span className="text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-muted border border-border" />
            <span className="text-muted-foreground">Unavailable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-amber-500/20 border border-amber-500" />
            <span className="text-muted-foreground">On Leave</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
