import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/mui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, Clock, Repeat, Save, X, Check, 
  ChevronLeft, ChevronRight, Copy, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, addDays, startOfWeek, addWeeks, isSameDay } from 'date-fns';

interface CandidateAvailabilityCalendarProps {
  open: boolean;
  onClose: () => void;
  candidateId: string;
  candidateName: string;
  onSave: (availability: AvailabilityData) => void;
}

interface TimeSlot {
  start: string;
  end: string;
}

interface DayAvailability {
  available: boolean;
  slots: TimeSlot[];
}

interface RecurringPattern {
  id: string;
  name: string;
  type: 'weekly' | 'fortnightly' | 'monthly';
  startDate: string;
  endDate?: string;
  days: Record<string, DayAvailability>;
}

interface AvailabilityData {
  candidateId: string;
  weeklyDefault: Record<string, DayAvailability>;
  overrides: Record<string, DayAvailability>;
  patterns: RecurringPattern[];
  blackoutDates: string[];
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const DEFAULT_AVAILABILITY: Record<string, DayAvailability> = {
  monday: { available: true, slots: [{ start: '06:00', end: '22:00' }] },
  tuesday: { available: true, slots: [{ start: '06:00', end: '22:00' }] },
  wednesday: { available: true, slots: [{ start: '06:00', end: '22:00' }] },
  thursday: { available: true, slots: [{ start: '06:00', end: '22:00' }] },
  friday: { available: true, slots: [{ start: '06:00', end: '22:00' }] },
  saturday: { available: false, slots: [] },
  sunday: { available: false, slots: [] },
};

const CandidateAvailabilityCalendar = ({ 
  open, 
  onClose, 
  candidateId, 
  candidateName,
  onSave 
}: CandidateAvailabilityCalendarProps) => {
  const [activeTab, setActiveTab] = useState('weekly');
  const [weeklyAvailability, setWeeklyAvailability] = useState<Record<string, DayAvailability>>(DEFAULT_AVAILABILITY);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [overrides, setOverrides] = useState<Record<string, DayAvailability>>({});
  const [patterns, setPatterns] = useState<RecurringPattern[]>([]);
  const [blackoutDates, setBlackoutDates] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ day: string; hour: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ day: string; hour: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(true);

  const handleMouseDown = useCallback((day: string, hour: number) => {
    const dayAvail = weeklyAvailability[day];
    const isCurrentlySelected = dayAvail.slots.some(
      slot => {
        const startHour = parseInt(slot.start.split(':')[0]);
        const endHour = parseInt(slot.end.split(':')[0]);
        return hour >= startHour && hour < endHour;
      }
    );
    setIsSelecting(!isCurrentlySelected);
    setIsDragging(true);
    setDragStart({ day, hour });
    setDragEnd({ day, hour });
  }, [weeklyAvailability]);

  const handleMouseEnter = useCallback((day: string, hour: number) => {
    if (isDragging && dragStart?.day === day) {
      setDragEnd({ day, hour });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && dragStart && dragEnd && dragStart.day === dragEnd.day) {
      const day = dragStart.day;
      const startHour = Math.min(dragStart.hour, dragEnd.hour);
      const endHour = Math.max(dragStart.hour, dragEnd.hour) + 1;

      setWeeklyAvailability(prev => {
        const dayAvail = { ...prev[day] };
        
        if (isSelecting) {
          // Add new slot
          const newSlot = {
            start: `${startHour.toString().padStart(2, '0')}:00`,
            end: `${endHour.toString().padStart(2, '0')}:00`
          };
          
          // Merge overlapping slots
          const mergedSlots = [...dayAvail.slots, newSlot].sort((a, b) => 
            parseInt(a.start) - parseInt(b.start)
          );
          
          const consolidated: TimeSlot[] = [];
          for (const slot of mergedSlots) {
            if (consolidated.length === 0) {
              consolidated.push(slot);
            } else {
              const last = consolidated[consolidated.length - 1];
              const lastEnd = parseInt(last.end);
              const slotStart = parseInt(slot.start);
              if (slotStart <= lastEnd) {
                last.end = slot.end > last.end ? slot.end : last.end;
              } else {
                consolidated.push(slot);
              }
            }
          }
          
          dayAvail.slots = consolidated;
          dayAvail.available = consolidated.length > 0;
        } else {
          // Remove selection
          dayAvail.slots = dayAvail.slots.flatMap(slot => {
            const slotStart = parseInt(slot.start.split(':')[0]);
            const slotEnd = parseInt(slot.end.split(':')[0]);
            
            if (endHour <= slotStart || startHour >= slotEnd) {
              return [slot];
            }
            
            const result: TimeSlot[] = [];
            if (slotStart < startHour) {
              result.push({ start: slot.start, end: `${startHour.toString().padStart(2, '0')}:00` });
            }
            if (slotEnd > endHour) {
              result.push({ start: `${endHour.toString().padStart(2, '0')}:00`, end: slot.end });
            }
            return result;
          });
          dayAvail.available = dayAvail.slots.length > 0;
        }
        
        return { ...prev, [day]: dayAvail };
      });
    }
    
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }, [isDragging, dragStart, dragEnd, isSelecting]);

  const isHourSelected = (day: string, hour: number) => {
    const dayAvail = weeklyAvailability[day];
    return dayAvail.slots.some(slot => {
      const startHour = parseInt(slot.start.split(':')[0]);
      const endHour = parseInt(slot.end.split(':')[0]);
      return hour >= startHour && hour < endHour;
    });
  };

  const isHourInDragRange = (day: string, hour: number) => {
    if (!isDragging || !dragStart || !dragEnd || dragStart.day !== day) return false;
    const minHour = Math.min(dragStart.hour, dragEnd.hour);
    const maxHour = Math.max(dragStart.hour, dragEnd.hour);
    return hour >= minHour && hour <= maxHour;
  };

  const toggleDayAvailability = (day: string) => {
    setWeeklyAvailability(prev => ({
      ...prev,
      [day]: {
        available: !prev[day].available,
        slots: !prev[day].available ? [{ start: '06:00', end: '22:00' }] : []
      }
    }));
  };

  const copyToAllWeekdays = (sourceDay: string) => {
    const sourceAvail = weeklyAvailability[sourceDay];
    setWeeklyAvailability(prev => {
      const updated = { ...prev };
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
        updated[day] = { ...sourceAvail };
      });
      return updated;
    });
    toast.success(`Copied ${sourceDay} availability to all weekdays`);
  };

  const addRecurringPattern = () => {
    const newPattern: RecurringPattern = {
      id: `pattern-${Date.now()}`,
      name: `Pattern ${patterns.length + 1}`,
      type: 'weekly',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      days: { ...DEFAULT_AVAILABILITY }
    };
    setPatterns([...patterns, newPattern]);
  };

  const handleSave = () => {
    const data: AvailabilityData = {
      candidateId,
      weeklyDefault: weeklyAvailability,
      overrides,
      patterns,
      blackoutDates
    };
    onSave(data);
    toast.success('Availability saved successfully');
    onClose();
  };

  const getWeekDates = () => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Availability Calendar - {candidateName}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekly" className="gap-2">
              <Clock className="h-4 w-4" />
              Weekly Default
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="h-4 w-4" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="patterns" className="gap-2">
              <Repeat className="h-4 w-4" />
              Recurring Patterns
            </TabsTrigger>
          </TabsList>

          {/* Weekly Default Tab */}
          <TabsContent value="weekly" className="flex-1 overflow-auto">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  Drag to select available hours (click and drag across time slots)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="select-none"
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {/* Header */}
                  <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-1 mb-2">
                    <div className="text-xs font-medium text-muted-foreground">Time</div>
                    {DAYS.map((day, idx) => (
                      <div key={day} className="text-center">
                        <div className="text-xs font-medium">{DAY_LABELS[idx]}</div>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <Switch
                            checked={weeklyAvailability[day].available}
                            onCheckedChange={() => toggleDayAvailability(day)}
                            className="scale-75"
                          />
                          <Button
                            variant="ghost"
                            size="small"
                            className="h-5 w-5 p-0"
                            onClick={() => copyToAllWeekdays(day)}
                            title="Copy to weekdays"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Time Grid */}
                  <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-1 max-h-[400px] overflow-y-auto">
                    {HOURS.map(hour => (
                      <div key={hour} className="contents">
                        <div className="text-xs text-muted-foreground py-1 sticky left-0 bg-background">
                          {hour.toString().padStart(2, '0')}:00
                        </div>
                        {DAYS.map(day => {
                          const isSelected = isHourSelected(day, hour);
                          const isInDrag = isHourInDragRange(day, hour);
                          const showPreview = isInDrag && isSelecting !== isSelected;
                          
                          return (
                            <div
                              key={`${day}-${hour}`}
                              className={cn(
                                "h-6 rounded cursor-pointer transition-colors border",
                                isSelected && !showPreview && "bg-primary/80 border-primary",
                                !isSelected && !showPreview && "bg-muted/30 border-transparent hover:bg-muted/50",
                                showPreview && isSelecting && "bg-primary/40 border-primary/60",
                                showPreview && !isSelecting && "bg-destructive/30 border-destructive/50"
                              )}
                              onMouseDown={() => handleMouseDown(day, hour)}
                              onMouseEnter={() => handleMouseEnter(day, hour)}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Weekly Summary</h4>
                  <div className="grid grid-cols-7 gap-2">
                    {DAYS.map((day, idx) => {
                      const dayAvail = weeklyAvailability[day];
                      const totalHours = dayAvail.slots.reduce((sum, slot) => {
                        return sum + (parseInt(slot.end) - parseInt(slot.start));
                      }, 0);
                      
                      return (
                        <div key={day} className="text-center">
                          <div className="text-xs font-medium">{DAY_LABELS[idx]}</div>
                          <Badge variant={dayAvail.available ? 'default' : 'secondary'} className="text-xs">
                            {totalHours}h
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar View Tab */}
          <TabsContent value="calendar" className="flex-1 overflow-auto">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Week of {format(currentWeekStart, 'MMM d, yyyy')}</CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, -1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                    >
                      Today
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {getWeekDates().map((date, idx) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const isBlackout = blackoutDates.includes(dateStr);
                    const hasOverride = dateStr in overrides;
                    const dayAvail = hasOverride ? overrides[dateStr] : weeklyAvailability[DAYS[idx]];
                    
                    return (
                      <Card 
                        key={dateStr}
                        className={cn(
                          "cursor-pointer transition-colors",
                          isBlackout && "bg-destructive/10 border-destructive/30",
                          hasOverride && !isBlackout && "border-primary"
                        )}
                        onClick={() => {
                          if (isBlackout) {
                            setBlackoutDates(prev => prev.filter(d => d !== dateStr));
                          } else {
                            setBlackoutDates(prev => [...prev, dateStr]);
                          }
                        }}
                      >
                        <CardContent className="p-3">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">{DAY_LABELS[idx]}</div>
                            <div className="text-lg font-bold">{format(date, 'd')}</div>
                            {isBlackout ? (
                              <Badge variant="destructive" className="text-xs mt-1">
                                <X className="h-3 w-3 mr-1" />
                                Unavailable
                              </Badge>
                            ) : (
                              <div className="mt-1 space-y-1">
                                {dayAvail.slots.map((slot, i) => (
                                  <div key={i} className="text-xs text-muted-foreground">
                                    {slot.start} - {slot.end}
                                  </div>
                                ))}
                                {dayAvail.slots.length === 0 && (
                                  <div className="text-xs text-muted-foreground">No slots</div>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Click on a date to mark it as unavailable (blackout)
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recurring Patterns Tab */}
          <TabsContent value="patterns" className="flex-1 overflow-auto">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Recurring Availability Patterns</h3>
                <Button size="small" onClick={addRecurringPattern}>
                  <Repeat className="h-4 w-4 mr-2" />
                  Add Pattern
                </Button>
              </div>

              {patterns.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <Repeat className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recurring patterns defined</p>
                    <p className="text-xs">Add patterns for predictable schedules (e.g., alternating weeks)</p>
                  </CardContent>
                </Card>
              ) : (
                patterns.map((pattern, idx) => (
                  <Card key={pattern.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={pattern.name}
                            onChange={(e) => {
                              const updated = [...patterns];
                              updated[idx].name = e.target.value;
                              setPatterns(updated);
                            }}
                            className="text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-primary rounded px-1"
                          />
                          <Select
                            value={pattern.type}
                            onValueChange={(value: 'weekly' | 'fortnightly' | 'monthly') => {
                              const updated = [...patterns];
                              updated[idx].type = value;
                              setPatterns(updated);
                            }}
                          >
                            <SelectTrigger className="w-32 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="fortnightly">Fortnightly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          variant="ghost"
                          size="small"
                          onClick={() => setPatterns(patterns.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-7 gap-2">
                        {DAYS.map((day, dayIdx) => (
                          <div key={day} className="text-center">
                            <div className="text-xs font-medium mb-1">{DAY_LABELS[dayIdx]}</div>
                            <Switch
                              checked={pattern.days[day]?.available ?? false}
                              onCheckedChange={(checked) => {
                                const updated = [...patterns];
                                updated[idx].days[day] = {
                                  available: checked,
                                  slots: checked ? [{ start: '06:00', end: '22:00' }] : []
                                };
                                setPatterns(updated);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Availability
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CandidateAvailabilityCalendar;
