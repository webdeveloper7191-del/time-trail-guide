import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths, isSameDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  GraduationCap, 
  Calendar,
  Users,
  MapPin,
  ClipboardCheck,
  PartyPopper,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  mockPublicHolidays, 
  mockRosterEvents, 
  RosterEvent, 
  eventTypeConfig,
  getHolidaysForDate,
  getEventsForDate,
} from '@/data/mockHolidaysEvents';
import PrimaryOffCanvas, { OffCanvasAction } from '@/components/ui/off-canvas/PrimaryOffCanvas';
 import { FormSection } from '@/components/ui/off-canvas/FormSection';

interface HolidayEventCalendarPanelProps {
  open: boolean;
  onClose: () => void;
  currentDate: Date;
  onDateClick?: (date: Date) => void;
}

const eventIcons: Record<RosterEvent['type'], React.ReactNode> = {
  staff_meeting: <Users className="h-3 w-3" />,
  training: <BookOpen className="h-3 w-3" />,
  inspection: <ClipboardCheck className="h-3 w-3" />,
  celebration: <PartyPopper className="h-3 w-3" />,
  excursion: <MapPin className="h-3 w-3" />,
  parent_event: <Users className="h-3 w-3" />,
  other: <Calendar className="h-3 w-3" />,
};

export function HolidayEventCalendarPanel({ 
  open,
  onClose,
  currentDate: initialDate, 
  onDateClick,
}: HolidayEventCalendarPanelProps) {
  const [viewDate, setViewDate] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get first day of week for padding
  const startDayOfWeek = monthStart.getDay();
  const paddingDays = Array(startDayOfWeek).fill(null);

  // Get holidays and events for the current month
  const monthHolidays = useMemo(() => {
    const startStr = format(monthStart, 'yyyy-MM-dd');
    const endStr = format(monthEnd, 'yyyy-MM-dd');
    return mockPublicHolidays.filter(h => h.date >= startStr && h.date <= endStr);
  }, [monthStart, monthEnd]);

  const monthEvents = useMemo(() => {
    const startStr = format(monthStart, 'yyyy-MM-dd');
    const endStr = format(monthEnd, 'yyyy-MM-dd');
    return mockRosterEvents.filter(e => e.date >= startStr && e.date <= endStr);
  }, [monthStart, monthEnd]);

  // Selected date details
  const selectedDateDetails = useMemo(() => {
    if (!selectedDate) return { holidays: [], events: [] };
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return {
      holidays: getHolidaysForDate(dateStr),
      events: getEventsForDate(dateStr),
    };
  }, [selectedDate]);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    onDateClick?.(date);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setViewDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  // Legend items
  const legendItems = [
    { icon: <Flag className="h-3.5 w-3.5 text-destructive fill-destructive/20" />, label: 'Public Holiday' },
    { icon: <GraduationCap className="h-3.5 w-3.5 text-amber-500" />, label: 'School Holiday' },
    { icon: <Calendar className="h-3.5 w-3.5 text-primary" />, label: 'Centre Event' },
  ];

  const actions: OffCanvasAction[] = [
    { label: 'Close', onClick: onClose, variant: 'outlined' },
  ];

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Holidays & Events Calendar"
      description="View public holidays, school holidays, and centre events"
      icon={Calendar}
      size="lg"
      actions={actions}
    >
      <div className="space-y-4">
         {/* Month Navigation with Card Style */}
         <FormSection title="Navigate" variant="card">
           <div className="flex items-center justify-between -mt-2">
          <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-base font-semibold">{format(viewDate, 'MMMM yyyy')}</h3>
          <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
         </FormSection>

         {/* Legend with Card Style */}
         <FormSection title="Legend" variant="card">
           <div className="flex flex-wrap gap-3 -mt-2">
          {legendItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </div>
         </FormSection>

        {/* Calendar Grid */}
         <FormSection title="Calendar" variant="card">
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
            
            {/* Padding for first week */}
            {paddingDays.map((_, idx) => (
              <div key={`pad-${idx}`} className="aspect-square" />
            ))}
            
            {/* Days */}
            {daysInMonth.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const holidays = getHolidaysForDate(dateStr);
              const events = getEventsForDate(dateStr);
              const hasPublicHoliday = holidays.some(h => h.type === 'public_holiday');
              const hasSchoolHoliday = holidays.some(h => h.type === 'school_holiday');
              const hasEvents = events.length > 0;
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <TooltipProvider key={dateStr}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleDayClick(day)}
                        className={cn(
                          "aspect-square p-1 rounded-lg text-sm relative transition-all hover:bg-accent",
                          "flex flex-col items-center justify-start",
                          hasPublicHoliday && "bg-destructive/10 hover:bg-destructive/20",
                          hasSchoolHoliday && !hasPublicHoliday && "bg-amber-50 dark:bg-amber-500/10",
                          isSelected && "ring-2 ring-primary ring-offset-1",
                          isTodayDate && "font-bold"
                        )}
                      >
                        <span className={cn(
                          "text-sm",
                          hasPublicHoliday && "text-destructive font-medium",
                          isTodayDate && "text-primary"
                        )}>
                          {format(day, 'd')}
                        </span>
                        
                        {/* Indicators */}
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {hasPublicHoliday && (
                            <Flag className="h-3 w-3 text-destructive fill-destructive/20" />
                          )}
                          {hasSchoolHoliday && !hasPublicHoliday && (
                            <GraduationCap className="h-3 w-3 text-amber-500" />
                          )}
                          {hasEvents && (
                            <div className="relative">
                              <Calendar className="h-3 w-3 text-primary" />
                              {events.length > 1 && (
                                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary text-[7px] text-primary-foreground flex items-center justify-center">
                                  {events.length}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="space-y-1.5">
                        <p className="font-medium text-xs">{format(day, 'EEEE, MMMM d, yyyy')}</p>
                        {holidays.map(h => (
                          <div key={h.id} className="flex items-center gap-1.5">
                            {h.type === 'public_holiday' ? (
                              <Flag className="h-3 w-3 text-destructive" />
                            ) : (
                              <GraduationCap className="h-3 w-3 text-amber-500" />
                            )}
                            <span className="text-xs">{h.name}</span>
                          </div>
                        ))}
                        {events.map(ev => (
                          <div key={ev.id} className="flex items-center gap-1.5">
                            <div 
                              className="h-2 w-2 rounded-full shrink-0" 
                              style={{ backgroundColor: eventTypeConfig[ev.type].color }}
                            />
                            <span className="text-xs">{ev.name}</span>
                          </div>
                        ))}
                        {holidays.length === 0 && events.length === 0 && (
                          <p className="text-xs text-muted-foreground">No holidays or events</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
         </FormSection>

        {/* Selected Date Details */}
        {selectedDate && (selectedDateDetails.holidays.length > 0 || selectedDateDetails.events.length > 0) && (
           <FormSection title={format(selectedDate, 'EEEE, MMMM d, yyyy')} variant="card">
            <div className="space-y-2">
              {selectedDateDetails.holidays.map(h => (
                <div key={h.id} className="flex items-center gap-2">
                  {h.type === 'public_holiday' ? (
                    <Badge variant="destructive" className="text-xs">
                      <Flag className="h-3 w-3 mr-1" />
                      Public Holiday
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                      <GraduationCap className="h-3 w-3 mr-1" />
                      School Holiday
                    </Badge>
                  )}
                  <span className="text-sm">{h.name}</span>
                </div>
              ))}
              {selectedDateDetails.events.map(ev => (
                <div key={ev.id} className="flex items-start gap-2">
                  <Badge 
                    variant="outline" 
                    className="text-xs shrink-0"
                    style={{ borderColor: eventTypeConfig[ev.type].color, color: eventTypeConfig[ev.type].color }}
                  >
                    {eventIcons[ev.type]}
                    <span className="ml-1">{eventTypeConfig[ev.type].label}</span>
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">{ev.name}</p>
                    {ev.description && (
                      <p className="text-xs text-muted-foreground">{ev.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
           </FormSection>
        )}

        {/* Upcoming this month */}
         <FormSection title="Upcoming This Month" variant="card">
          <ScrollArea className="h-48">
             <div className="space-y-2">
              {monthHolidays.filter(h => h.type === 'public_holiday').map(h => (
                <div 
                  key={h.id} 
                  className="flex items-center gap-3 p-2 rounded-lg bg-destructive/5 border border-destructive/20 cursor-pointer hover:bg-destructive/10"
                  onClick={() => setSelectedDate(new Date(h.date))}
                >
                  <Flag className="h-4 w-4 text-destructive shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{h.name}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(h.date), 'EEEE, MMM d')}</p>
                  </div>
                </div>
              ))}
              {monthEvents.map(ev => (
                <div 
                  key={ev.id} 
                  className="flex items-center gap-3 p-2 rounded-lg border cursor-pointer hover:bg-accent"
                  onClick={() => setSelectedDate(new Date(ev.date))}
                >
                  <div 
                    className="h-4 w-4 rounded-full shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: eventTypeConfig[ev.type].color }}
                  >
                    <span className="text-white">{eventIcons[ev.type]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ev.name}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(ev.date), 'EEEE, MMM d')}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {eventTypeConfig[ev.type].label}
                  </Badge>
                </div>
              ))}
              {monthHolidays.filter(h => h.type === 'public_holiday').length === 0 && monthEvents.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No holidays or events this month
                </p>
              )}
            </div>
          </ScrollArea>
         </FormSection>
      </div>
    </PrimaryOffCanvas>
  );
}
