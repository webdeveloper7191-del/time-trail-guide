import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/mui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Calendar, ChevronLeft, ChevronRight, Clock, Users, MapPin,
  Eye, List, Grid3X3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday,
  getDay, parseISO
} from 'date-fns';
import { ShiftRequest } from '@/types/agency';
import { mockShiftRequests } from '@/data/mockAgencyData';

interface ShiftCalendarViewProps {
  onSelectShift?: (shiftId: string) => void;
}

const URGENCY_COLORS = {
  critical: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', dot: 'bg-destructive' },
  urgent: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500' },
  standard: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500' },
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  partially_filled: 'bg-amber-100 text-amber-800',
  filled: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-red-50 text-red-600',
  expired: 'bg-muted text-muted-foreground',
};

export function ShiftCalendarView({ onSelectShift }: ShiftCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [clientFilter, setClientFilter] = useState('all');

  const clients = useMemo(() => {
    const set = new Set(mockShiftRequests.map(s => s.clientName));
    return Array.from(set).sort();
  }, []);

  const filteredShifts = useMemo(() => {
    if (clientFilter === 'all') return mockShiftRequests;
    return mockShiftRequests.filter(s => s.clientName === clientFilter);
  }, [clientFilter]);

  // Group shifts by date
  const shiftsByDate = useMemo(() => {
    const map = new Map<string, ShiftRequest[]>();
    filteredShifts.forEach(shift => {
      const key = shift.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(shift);
    });
    return map;
  }, [filteredShifts]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const selectedDayShifts = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, 'yyyy-MM-dd');
    return shiftsByDate.get(key) || [];
  }, [selectedDate, shiftsByDate]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="small" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="h-7 w-7 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold min-w-[140px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <Button variant="ghost" size="small" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="h-7 w-7 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()); }}
            className="h-7 text-xs ml-2"
          >
            Today
          </Button>
        </div>
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue placeholder="All Clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2">
          <CardContent className="p-3">
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar cells */}
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {calendarDays.map((day, idx) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayShifts = shiftsByDate.get(dateKey) || [];
                const inMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const today = isToday(day);

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      'min-h-[80px] p-1 bg-background cursor-pointer transition-colors',
                      !inMonth && 'opacity-40',
                      isSelected && 'ring-2 ring-primary ring-inset',
                      today && !isSelected && 'bg-primary/5',
                      'hover:bg-muted/30'
                    )}
                  >
                    <div className={cn(
                      'text-[11px] font-medium mb-0.5',
                      today ? 'text-primary font-bold' : 'text-foreground'
                    )}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-0.5">
                      {dayShifts.slice(0, 3).map(shift => {
                        const colors = URGENCY_COLORS[shift.urgency];
                        return (
                          <div
                            key={shift.id}
                            onClick={(e) => { e.stopPropagation(); onSelectShift?.(shift.id); setSelectedDate(day); }}
                            className={cn(
                              'text-[9px] font-medium px-1 py-0.5 rounded truncate cursor-pointer',
                              colors.bg, colors.text
                            )}
                          >
                            {shift.startTime} {shift.clientName.split(' ')[0]}
                          </div>
                        );
                      })}
                      {dayShifts.length > 3 && (
                        <div className="text-[9px] text-muted-foreground text-center">
                          +{dayShifts.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 px-1">
              {Object.entries(URGENCY_COLORS).map(([key, colors]) => (
                <div key={key} className="flex items-center gap-1">
                  <div className={cn('h-2 w-2 rounded-full', colors.dot)} />
                  <span className="text-[10px] text-muted-foreground capitalize">{key}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Day Detail Panel */}
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold">
              {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a day'}
            </CardTitle>
            <CardDescription className="text-[11px]">
              {selectedDayShifts.length} shift{selectedDayShifts.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {selectedDayShifts.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No shifts on this date
              </div>
            ) : (
              <div className="space-y-2">
                {selectedDayShifts.map(shift => {
                  const colors = URGENCY_COLORS[shift.urgency];
                  return (
                    <div
                      key={shift.id}
                      className={cn(
                        'p-2.5 rounded-lg border cursor-pointer hover:bg-muted/30 transition-colors',
                        colors.border
                      )}
                      onClick={() => onSelectShift?.(shift.id)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <div className={cn('h-2 w-2 rounded-full', colors.dot)} />
                          <p className="text-xs font-semibold">{shift.clientName}</p>
                        </div>
                        <Badge className={cn('text-[9px] h-4 px-1', STATUS_COLORS[shift.status] || '')}>
                          {shift.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="space-y-0.5 text-[10px] text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {shift.startTime} - {shift.endTime}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5" />
                          {shift.locationName}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-2.5 w-2.5" />
                          {shift.filledPositions}/{shift.totalPositions} filled
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ShiftCalendarView;
