import { useMemo } from 'react';
import {
  Chip,
  Box,
  Typography,
} from '@mui/material';
import { StaffMember, roleLabels, employmentTypeLabels, agencyLabels } from '@/types/roster';
import { format, startOfWeek, addDays } from 'date-fns';
import { Check, X, User } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="!w-[90vw] sm:!w-[720px] md:!w-[840px] !max-w-[900px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Staff Availability - Week of {format(weekStart, 'MMM d, yyyy')}
          </SheetTitle>
          <SheetDescription>
            View staff availability across the week
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 mt-6 h-[calc(100vh-200px)]">
          <Box sx={{ minWidth: 'max-content' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', position: 'sticky', top: 0, zIndex: 10, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ width: 180, flexShrink: 0, p: 1.5, fontWeight: 500, fontSize: '0.875rem', color: 'text.secondary', borderRight: 1, borderColor: 'divider' }}>
                Staff Member
              </Box>
              {dates.map((date, idx) => (
                <Box 
                  key={idx}
                  sx={{ flex: 1, minWidth: 80, p: 1, textAlign: 'center', borderRight: 1, borderColor: 'divider', bgcolor: 'action.hover' }}
                >
                  <Typography variant="body2" fontWeight={500}>{dayNames[idx]}</Typography>
                  <Typography variant="caption" color="text.secondary">{format(date, 'd MMM')}</Typography>
                </Box>
              ))}
            </Box>

            {/* Staff rows */}
            {staff.map((member) => (
              <Box key={member.id} sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' } }}>
                <Box sx={{ width: 180, flexShrink: 0, p: 1, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box 
                    sx={{ 
                      height: 28, 
                      width: 28, 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: 'white', 
                      fontSize: '0.625rem', 
                      fontWeight: 500,
                      flexShrink: 0,
                      bgcolor: member.color 
                    }}
                  >
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" fontWeight={500} noWrap>{member.name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.625rem' }}>
                      {roleLabels[member.role]}
                    </Typography>
                  </Box>
                </Box>

                {dates.map((date, dayIdx) => {
                  const availability = getAvailabilityForDay(member, dayIdx);
                  const onLeave = isOnTimeOff(member, date);
                  const isAvailable = availability?.available && !onLeave;

                  return (
                    <Box 
                      key={dayIdx}
                      sx={{ 
                        flex: 1, 
                        minWidth: 80, 
                        p: 0.5, 
                        borderRight: 1, 
                        borderColor: 'divider', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        bgcolor: onLeave ? 'warning.light' : isAvailable ? 'success.light' : 'action.disabledBackground',
                        opacity: onLeave || !isAvailable ? 0.6 : 1,
                      }}
                    >
                      {onLeave ? (
                        <Chip size="small" label="Leave" color="warning" variant="outlined" sx={{ fontSize: '0.5rem', height: 20 }} />
                      ) : isAvailable ? (
                        <>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, color: 'success.main' }}>
                            <Check size={12} />
                          </Box>
                          {availability?.startTime && availability?.endTime && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.5rem' }}>
                              {availability.startTime}-{availability.endTime}
                            </Typography>
                          )}
                        </>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, color: 'text.secondary' }}>
                          <X size={12} />
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>

          {/* Legend */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 2, mt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ height: 12, width: 12, borderRadius: 0.5, bgcolor: 'success.light', border: 1, borderColor: 'success.main' }} />
              <Typography variant="caption" color="text.secondary">Available</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ height: 12, width: 12, borderRadius: 0.5, bgcolor: 'action.disabledBackground', border: 1, borderColor: 'divider' }} />
              <Typography variant="caption" color="text.secondary">Unavailable</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ height: 12, width: 12, borderRadius: 0.5, bgcolor: 'warning.light', border: 1, borderColor: 'warning.main' }} />
              <Typography variant="caption" color="text.secondary">On Leave</Typography>
            </Box>
          </Box>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
