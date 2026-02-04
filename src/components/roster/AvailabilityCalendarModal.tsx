import { useMemo } from 'react';
import {
  Chip,
  Box,
  Typography,
} from '@mui/material';
import { StaffMember, roleLabels } from '@/types/roster';
import { format, startOfWeek, addDays } from 'date-fns';
import { Check, X, Users } from 'lucide-react';
import PrimaryOffCanvas, { OffCanvasAction } from '@/components/ui/off-canvas/PrimaryOffCanvas';
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

  const actions: OffCanvasAction[] = [
    { label: 'Close', onClick: onClose, variant: 'outlined' },
  ];

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title={`Staff Availability - Week of ${format(weekStart, 'MMM d, yyyy')}`}
      description="View staff availability across the week"
      icon={Users}
      size="3xl"
      actions={actions}
    >
      <div className="space-y-4">
        {/* Availability Grid */}
        <div className="bg-background rounded-lg border overflow-hidden">
          <ScrollArea className="h-[calc(100vh-300px)]">
            <Box sx={{ minWidth: 'max-content' }}>
              {/* Header */}
              <Box sx={{ display: 'flex', position: 'sticky', top: 0, zIndex: 10, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ width: 180, flexShrink: 0, p: 1.5, fontWeight: 600, fontSize: '0.875rem', color: 'text.primary', borderRight: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
                  Staff Member
                </Box>
                {dates.map((date, idx) => (
                  <Box 
                    key={idx}
                    sx={{ flex: 1, minWidth: 90, p: 1, textAlign: 'center', borderRight: 1, borderColor: 'divider', bgcolor: 'grey.50' }}
                  >
                    <Typography variant="body2" fontWeight={600} color="text.primary">{dayNames[idx]}</Typography>
                    <Typography variant="caption" color="text.secondary">{format(date, 'd MMM')}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Staff rows */}
              {staff.map((member) => (
                <Box key={member.id} sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' } }}>
                  <Box sx={{ width: 180, flexShrink: 0, p: 1, borderRight: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'background.paper' }}>
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
                      <Typography variant="caption" fontWeight={500} noWrap color="text.primary">{member.name}</Typography>
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
                          minWidth: 90, 
                          p: 0.75, 
                          borderRight: 1, 
                          borderColor: 'divider', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          bgcolor: onLeave 
                            ? 'rgba(245, 158, 11, 0.15)' 
                            : isAvailable 
                              ? 'rgba(3, 169, 244, 0.08)' 
                              : 'grey.100',
                        }}
                      >
                        {onLeave ? (
                          <Chip 
                            size="small" 
                            label="Leave" 
                            sx={{ 
                              fontSize: '0.625rem', 
                              height: 22,
                              bgcolor: 'rgba(245, 158, 11, 0.2)',
                              color: '#b45309',
                              borderColor: '#f59e0b',
                              border: '1px solid',
                            }} 
                          />
                        ) : isAvailable ? (
                          <>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, color: 'hsl(var(--primary))' }}>
                              <Check size={14} strokeWidth={2.5} />
                            </Box>
                            {availability?.startTime && availability?.endTime && (
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.625rem', mt: 0.25 }}>
                                {availability.startTime}-{availability.endTime}
                              </Typography>
                            )}
                          </>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, color: 'text.disabled' }}>
                            <X size={14} />
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              ))}
            </Box>
          </ScrollArea>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 p-3 bg-background rounded-lg border">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-primary/10 border border-primary" />
            <span className="text-sm text-muted-foreground">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-muted border border-muted-foreground/30" />
            <span className="text-sm text-muted-foreground">Unavailable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b' }} />
            <span className="text-sm text-muted-foreground">On Leave</span>
          </div>
        </div>
      </div>
    </PrimaryOffCanvas>
  );
}
