import { useState, useCallback } from 'react';
import { PrimaryOffCanvas } from '@/components/ui/off-canvas';
import { FormSection } from '@/components/ui/off-canvas/FormSection';
import { Button } from '@/components/mui/Button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Calendar, Clock, Repeat, Copy, X,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, addDays, startOfWeek, addWeeks } from 'date-fns';

interface CandidateAvailabilityCalendarProps {
  open: boolean;
  onClose: () => void;
  candidateId: string;
  candidateName: string;
  onSave: (availability: AvailabilityData) => void;
}

interface TimeSlot { start: string; end: string; }
interface DayAvailability { available: boolean; slots: TimeSlot[]; }
interface RecurringPattern { id: string; name: string; type: 'weekly' | 'fortnightly' | 'monthly'; startDate: string; endDate?: string; days: Record<string, DayAvailability>; }
interface AvailabilityData { candidateId: string; weeklyDefault: Record<string, DayAvailability>; overrides: Record<string, DayAvailability>; patterns: RecurringPattern[]; blackoutDates: string[]; }

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

const CandidateAvailabilityCalendar = ({ open, onClose, candidateId, candidateName, onSave }: CandidateAvailabilityCalendarProps) => {
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
    const isCurrentlySelected = dayAvail.slots.some(slot => { const s = parseInt(slot.start.split(':')[0]); const e = parseInt(slot.end.split(':')[0]); return hour >= s && hour < e; });
    setIsSelecting(!isCurrentlySelected);
    setIsDragging(true); setDragStart({ day, hour }); setDragEnd({ day, hour });
  }, [weeklyAvailability]);

  const handleMouseEnter = useCallback((day: string, hour: number) => {
    if (isDragging && dragStart?.day === day) setDragEnd({ day, hour });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && dragStart && dragEnd && dragStart.day === dragEnd.day) {
      const day = dragStart.day;
      const startHour = Math.min(dragStart.hour, dragEnd.hour);
      const endHour = Math.max(dragStart.hour, dragEnd.hour) + 1;
      setWeeklyAvailability(prev => {
        const dayAvail = { ...prev[day] };
        if (isSelecting) {
          const newSlot = { start: `${startHour.toString().padStart(2, '0')}:00`, end: `${endHour.toString().padStart(2, '0')}:00` };
          const mergedSlots = [...dayAvail.slots, newSlot].sort((a, b) => parseInt(a.start) - parseInt(b.start));
          const consolidated: TimeSlot[] = [];
          for (const slot of mergedSlots) {
            if (consolidated.length === 0) { consolidated.push(slot); }
            else { const last = consolidated[consolidated.length - 1]; if (parseInt(slot.start) <= parseInt(last.end)) { last.end = slot.end > last.end ? slot.end : last.end; } else { consolidated.push(slot); } }
          }
          dayAvail.slots = consolidated; dayAvail.available = consolidated.length > 0;
        } else {
          dayAvail.slots = dayAvail.slots.flatMap(slot => {
            const ss = parseInt(slot.start.split(':')[0]); const se = parseInt(slot.end.split(':')[0]);
            if (endHour <= ss || startHour >= se) return [slot];
            const result: TimeSlot[] = [];
            if (ss < startHour) result.push({ start: slot.start, end: `${startHour.toString().padStart(2, '0')}:00` });
            if (se > endHour) result.push({ start: `${endHour.toString().padStart(2, '0')}:00`, end: slot.end });
            return result;
          });
          dayAvail.available = dayAvail.slots.length > 0;
        }
        return { ...prev, [day]: dayAvail };
      });
    }
    setIsDragging(false); setDragStart(null); setDragEnd(null);
  }, [isDragging, dragStart, dragEnd, isSelecting]);

  const isHourSelected = (day: string, hour: number) => weeklyAvailability[day].slots.some(slot => { const s = parseInt(slot.start.split(':')[0]); const e = parseInt(slot.end.split(':')[0]); return hour >= s && hour < e; });
  const isHourInDragRange = (day: string, hour: number) => { if (!isDragging || !dragStart || !dragEnd || dragStart.day !== day) return false; return hour >= Math.min(dragStart.hour, dragEnd.hour) && hour <= Math.max(dragStart.hour, dragEnd.hour); };

  const toggleDayAvailability = (day: string) => {
    setWeeklyAvailability(prev => ({ ...prev, [day]: { available: !prev[day].available, slots: !prev[day].available ? [{ start: '06:00', end: '22:00' }] : [] } }));
  };

  const copyToAllWeekdays = (sourceDay: string) => {
    const sourceAvail = weeklyAvailability[sourceDay];
    setWeeklyAvailability(prev => { const updated = { ...prev }; ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => { updated[day] = { ...sourceAvail }; }); return updated; });
    toast.success(`Copied ${sourceDay} availability to all weekdays`);
  };

  const addRecurringPattern = () => {
    setPatterns([...patterns, { id: `pattern-${Date.now()}`, name: `Pattern ${patterns.length + 1}`, type: 'weekly', startDate: format(new Date(), 'yyyy-MM-dd'), days: { ...DEFAULT_AVAILABILITY } }]);
  };

  const handleSave = () => {
    onSave({ candidateId, weeklyDefault: weeklyAvailability, overrides, patterns, blackoutDates });
    toast.success('Availability saved successfully'); onClose();
  };

  const getWeekDates = () => Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const TABS = [
    { id: 'weekly', label: 'Weekly Default', icon: Clock },
    { id: 'calendar', label: 'Calendar View', icon: Calendar },
    { id: 'patterns', label: 'Recurring', icon: Repeat },
  ];

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title={`Availability - ${candidateName}`}
      icon={Calendar}
      size="2xl"
      isBackground
      actions={[
        { label: 'Cancel', variant: 'outlined', onClick: onClose },
        { label: 'Save Availability', variant: 'primary', onClick: handleSave },
      ]}
    >
      {/* Tab Navigation */}
      <div className="rounded-lg border border-border bg-background p-1 flex gap-1">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-medium transition-colors', activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/50')}>
            <tab.icon className="h-3.5 w-3.5" />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'weekly' && (
        <FormSection title="Drag to select available hours">
          <div className="select-none" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-1 mb-2">
              <div className="text-xs font-medium text-muted-foreground">Time</div>
              {DAYS.map((day, idx) => (
                <div key={day} className="text-center">
                  <div className="text-xs font-medium">{DAY_LABELS[idx]}</div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Switch checked={weeklyAvailability[day].available} onCheckedChange={() => toggleDayAvailability(day)} className="scale-75" />
                    <Button variant="ghost" size="small" className="h-5 w-5 p-0" onClick={() => copyToAllWeekdays(day)} title="Copy to weekdays"><Copy className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-1 max-h-[400px] overflow-y-auto">
              {HOURS.map(hour => (
                <div key={hour} className="contents">
                  <div className="text-xs text-muted-foreground py-1 sticky left-0 bg-background">{hour.toString().padStart(2, '0')}:00</div>
                  {DAYS.map(day => {
                    const isSelected = isHourSelected(day, hour);
                    const isInDrag = isHourInDragRange(day, hour);
                    const showPreview = isInDrag && isSelecting !== isSelected;
                    return (
                      <div key={`${day}-${hour}`} className={cn('h-6 rounded cursor-pointer transition-colors border', isSelected && !showPreview && 'bg-primary/80 border-primary', !isSelected && !showPreview && 'bg-muted/30 border-transparent hover:bg-muted/50', showPreview && isSelecting && 'bg-primary/40 border-primary/60', showPreview && !isSelecting && 'bg-destructive/30 border-destructive/50')} onMouseDown={() => handleMouseDown(day, hour)} onMouseEnter={() => handleMouseEnter(day, hour)} />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Weekly Summary</h4>
            <div className="grid grid-cols-7 gap-2">
              {DAYS.map((day, idx) => {
                const totalHours = weeklyAvailability[day].slots.reduce((sum, slot) => sum + (parseInt(slot.end) - parseInt(slot.start)), 0);
                return (
                  <div key={day} className="text-center">
                    <div className="text-xs font-medium">{DAY_LABELS[idx]}</div>
                    <Badge variant={weeklyAvailability[day].available ? 'default' : 'secondary'} className="text-xs">{totalHours}h</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </FormSection>
      )}

      {activeTab === 'calendar' && (
        <FormSection title={`Week of ${format(currentWeekStart, 'MMM d, yyyy')}`}>
          <div className="flex justify-end gap-2 -mt-2 mb-3">
            <Button variant="outlined" size="small" onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, -1))}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outlined" size="small" onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Today</Button>
            <Button variant="outlined" size="small" onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {getWeekDates().map((date, idx) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const isBlackout = blackoutDates.includes(dateStr);
              const hasOverride = dateStr in overrides;
              const dayAvail = hasOverride ? overrides[dateStr] : weeklyAvailability[DAYS[idx]];
              return (
                <div key={dateStr} className={cn('rounded-lg border p-3 text-center cursor-pointer transition-colors', isBlackout && 'bg-destructive/10 border-destructive/30', hasOverride && !isBlackout && 'border-primary')} onClick={() => { if (isBlackout) setBlackoutDates(prev => prev.filter(d => d !== dateStr)); else setBlackoutDates(prev => [...prev, dateStr]); }}>
                  <div className="text-xs text-muted-foreground">{DAY_LABELS[idx]}</div>
                  <div className="text-lg font-bold">{format(date, 'd')}</div>
                  {isBlackout ? <Badge variant="destructive" className="text-xs mt-1"><X className="h-3 w-3 mr-1" />Off</Badge> : (
                    <div className="mt-1 space-y-1">
                      {dayAvail.slots.map((slot, i) => <div key={i} className="text-xs text-muted-foreground">{slot.start}-{slot.end}</div>)}
                      {dayAvail.slots.length === 0 && <div className="text-xs text-muted-foreground">No slots</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Click on a date to mark it as unavailable (blackout)</p>
        </FormSection>
      )}

      {activeTab === 'patterns' && (
        <FormSection title="Recurring Availability Patterns">
          <div className="flex justify-end -mt-2 mb-2">
            <Button size="small" onClick={addRecurringPattern}><Repeat className="h-3.5 w-3.5 mr-1.5" />Add Pattern</Button>
          </div>
          {patterns.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Repeat className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recurring patterns defined</p>
              <p className="text-xs">Add a pattern to automate availability</p>
            </div>
          ) : (
            <div className="space-y-2">
              {patterns.map(pattern => (
                <div key={pattern.id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                  <div>
                    <p className="text-sm font-medium">{pattern.name}</p>
                    <p className="text-xs text-muted-foreground">{pattern.type} from {pattern.startDate}</p>
                  </div>
                  <Badge variant="outline">{pattern.type}</Badge>
                </div>
              ))}
            </div>
          )}
        </FormSection>
      )}
    </PrimaryOffCanvas>
  );
};

export default CandidateAvailabilityCalendar;
