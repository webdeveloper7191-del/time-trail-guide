import { useState, useCallback, useMemo } from 'react';
import { StaffMember, WeeklyAvailability } from '@/types/staff';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Save, CalendarIcon, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { locations } from '@/data/mockStaffData';
import { format, differenceInWeeks, startOfWeek, addWeeks } from 'date-fns';

interface InlineAvailabilityTableProps {
  staff: StaffMember;
  onSave?: (availability: WeeklyAvailability[], pattern: 'same_every_week' | 'alternate_weekly') => void;
}

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

interface AvailabilityRow extends WeeklyAvailability {
  week?: 1 | 2;
}

const daysOfWeek: { key: DayOfWeek; label: string; short: string }[] = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
];

function calculateHours(startTime?: string, endTime?: string): string {
  if (!startTime || !endTime) return '-';
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const hours = (endH + endM / 60) - (startH + startM / 60);
  return hours > 0 ? `${hours.toFixed(1)}h` : '-';
}

export function InlineAvailabilityTable({ staff, onSave }: InlineAvailabilityTableProps) {
  const [pattern, setPattern] = useState<'same_every_week' | 'alternate_weekly'>(staff.availabilityPattern);
  const [activeWeek, setActiveWeek] = useState<'week1' | 'week2'>('week1');
  const [hasChanges, setHasChanges] = useState(false);
  
  // Week 1 anchor date - the Monday when Week 1 starts
  const [week1StartDate, setWeek1StartDate] = useState<Date>(() => {
    // Default to the start of current week (Monday)
    return startOfWeek(new Date(), { weekStartsOn: 1 });
  });

  // Calculate which week is currently active based on anchor date
  const currentWeekInfo = useMemo(() => {
    const today = new Date();
    const weeksSinceAnchor = differenceInWeeks(
      startOfWeek(today, { weekStartsOn: 1 }),
      startOfWeek(week1StartDate, { weekStartsOn: 1 })
    );
    const isWeek1 = weeksSinceAnchor % 2 === 0;
    
    // Calculate date ranges for display
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    const nextWeekStart = addWeeks(currentWeekStart, 1);
    
    return {
      currentWeek: isWeek1 ? 1 : 2,
      nextWeek: isWeek1 ? 2 : 1,
      currentWeekRange: `${format(currentWeekStart, 'dd MMM')} - ${format(addWeeks(currentWeekStart, 1), 'dd MMM')}`,
      nextWeekRange: `${format(nextWeekStart, 'dd MMM')} - ${format(addWeeks(nextWeekStart, 1), 'dd MMM')}`,
    };
  }, [week1StartDate]);

  // Initialize availability data - for alternate weekly, we duplicate to create Week 1 & Week 2
  const initializeAvailability = useCallback(() => {
    const week1: AvailabilityRow[] = daysOfWeek.map(day => {
      const existing = staff.weeklyAvailability.find(a => a.dayOfWeek === day.key);
      return existing 
        ? { ...existing, week: 1 as const }
        : { dayOfWeek: day.key, isAvailable: false, week: 1 as const };
    });
    
    // Week 2 starts as copy of Week 1 for demo
    const week2: AvailabilityRow[] = daysOfWeek.map(day => {
      const existing = staff.weeklyAvailability.find(a => a.dayOfWeek === day.key);
      return existing 
        ? { ...existing, week: 2 as const }
        : { dayOfWeek: day.key, isAvailable: false, week: 2 as const };
    });
    
    return { week1, week2 };
  }, [staff.weeklyAvailability]);

  const [availability, setAvailability] = useState(initializeAvailability);

  const updateDay = (week: 'week1' | 'week2', dayKey: DayOfWeek, updates: Partial<AvailabilityRow>) => {
    setAvailability(prev => ({
      ...prev,
      [week]: prev[week].map(day => 
        day.dayOfWeek === dayKey ? { ...day, ...updates } : day
      )
    }));
    setHasChanges(true);
  };

  const addHours = (week: 'week1' | 'week2', dayKey: DayOfWeek) => {
    updateDay(week, dayKey, {
      isAvailable: true,
      startTime: '09:00',
      endTime: '17:00',
      breakMinutes: 30,
      area: locations[0]
    });
  };

  const removeHours = (week: 'week1' | 'week2', dayKey: DayOfWeek) => {
    updateDay(week, dayKey, {
      isAvailable: false,
      startTime: undefined,
      endTime: undefined,
      breakMinutes: undefined,
      area: undefined
    });
  };

  const handleSave = () => {
    if (onSave) {
      const allAvailability = pattern === 'same_every_week' 
        ? availability.week1 
        : [...availability.week1, ...availability.week2];
      onSave(allAvailability, pattern);
    }
    setHasChanges(false);
  };

  const getTotalHours = (weekData: AvailabilityRow[]): number => {
    return weekData.reduce((total, day) => {
      if (!day.isAvailable || !day.startTime || !day.endTime) return total;
      const [startH, startM] = day.startTime.split(':').map(Number);
      const [endH, endM] = day.endTime.split(':').map(Number);
      const hours = (endH + endM / 60) - (startH + startM / 60);
      return total + hours;
    }, 0);
  };

  const getAvailableDays = (weekData: AvailabilityRow[]): number => {
    return weekData.filter(d => d.isAvailable).length;
  };

  const renderAvailabilityTable = (weekData: AvailabilityRow[], week: 'week1' | 'week2') => (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[100px_1fr_1fr_80px_80px_1fr_50px] gap-0 bg-muted/50 text-sm font-medium border-b">
        <div className="px-3 py-2.5">Day</div>
        <div className="px-3 py-2.5 text-center">Start</div>
        <div className="px-3 py-2.5 text-center">Finish</div>
        <div className="px-3 py-2.5 text-center">Hours</div>
        <div className="px-3 py-2.5 text-center">Break</div>
        <div className="px-3 py-2.5 text-center">Area</div>
        <div className="px-3 py-2.5"></div>
      </div>
      
      {/* Rows */}
      {daysOfWeek.map((day) => {
        const dayData = weekData.find(a => a.dayOfWeek === day.key);
        const isAvailable = dayData?.isAvailable;
        
        return (
          <div 
            key={day.key} 
            className={cn(
              "grid grid-cols-[100px_1fr_1fr_80px_80px_1fr_50px] gap-0 border-t items-center transition-colors",
              isAvailable ? "bg-green-50/30 dark:bg-green-950/10" : "bg-muted/10"
            )}
          >
            {/* Day Label */}
            <div className="px-3 py-2">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isAvailable ? "bg-green-500" : "bg-muted-foreground/30"
                )} />
                <span className="font-medium text-sm">{day.label}</span>
              </div>
            </div>
            
            {isAvailable ? (
              <>
                {/* Start Time */}
                <div className="px-2 py-2">
                  <Input 
                    type="time" 
                    value={dayData?.startTime || ''} 
                    onChange={(e) => updateDay(week, day.key, { startTime: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                
                {/* End Time */}
                <div className="px-2 py-2">
                  <Input 
                    type="time" 
                    value={dayData?.endTime || ''}
                    onChange={(e) => updateDay(week, day.key, { endTime: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                
                {/* Hours (calculated) */}
                <div className="px-3 py-2 text-center">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {calculateHours(dayData?.startTime, dayData?.endTime)}
                  </Badge>
                </div>
                
                {/* Break */}
                <div className="px-2 py-2">
                  <Select 
                    value={String(dayData?.breakMinutes || 30)}
                    onValueChange={(v) => updateDay(week, day.key, { breakMinutes: parseInt(v) })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 min</SelectItem>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">60 min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Area */}
                <div className="px-2 py-2">
                  <Select 
                    value={dayData?.area || locations[0]}
                    onValueChange={(v) => updateDay(week, day.key, { area: v })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Remove */}
                <div className="px-2 py-2 text-center">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeHours(week, day.key)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Add Hours Button */}
                <div className="col-span-5 px-3 py-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={() => addHours(week, day.key)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Hours
                  </Button>
                </div>
                <div className="px-2 py-2"></div>
              </>
            )}
          </div>
        );
      })}
      
      {/* Summary Footer */}
      <div className="grid grid-cols-[100px_1fr_1fr_80px_80px_1fr_50px] gap-0 bg-muted/30 border-t text-sm font-medium">
        <div className="px-3 py-2.5">Total</div>
        <div className="px-3 py-2.5 text-center text-muted-foreground">
          {getAvailableDays(weekData)} days
        </div>
        <div className="px-3 py-2.5"></div>
        <div className="px-3 py-2.5 text-center">
          <Badge variant="default" className="font-mono text-xs">
            {getTotalHours(weekData).toFixed(1)}h
          </Badge>
        </div>
        <div className="col-span-3 px-3 py-2.5"></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Pattern Selection */}
      <div className="flex items-center justify-between">
        <RadioGroup 
          value={pattern} 
          onValueChange={(v) => {
            setPattern(v as 'same_every_week' | 'alternate_weekly');
            setHasChanges(true);
          }} 
          className="flex gap-6"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="same_every_week" id="same" />
            <Label htmlFor="same" className="font-medium cursor-pointer">Same Every Week</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="alternate_weekly" id="alternate" />
            <Label htmlFor="alternate" className="font-medium cursor-pointer">Alternate Weekly</Label>
          </div>
        </RadioGroup>
        
        {hasChanges && (
          <Button size="sm" onClick={handleSave} className="shadow-sm">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        )}
      </div>

      {/* Availability Table(s) */}
      {pattern === 'same_every_week' ? (
        renderAvailabilityTable(availability.week1, 'week1')
      ) : (
        <div className="space-y-4">
          {/* Week 1 Anchor Date Picker */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
            <div className="flex items-center gap-3">
              <Info className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Week 1 starts from</p>
                <p className="text-xs text-muted-foreground">
                  Set the anchor date to define which calendar weeks are Week 1 vs Week 2
                </p>
              </div>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="min-w-[160px] justify-start">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {format(week1StartDate, 'dd MMM yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={week1StartDate}
                  onSelect={(date) => {
                    if (date) {
                      // Always snap to Monday of selected week
                      setWeek1StartDate(startOfWeek(date, { weekStartsOn: 1 }));
                      setHasChanges(true);
                    }
                  }}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Current Week Indicator */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-600 text-white">This Week</Badge>
              <span className="text-sm font-medium">
                Week {currentWeekInfo.currentWeek}
              </span>
              <span className="text-xs text-muted-foreground">
                ({currentWeekInfo.currentWeekRange})
              </span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Next Week</Badge>
              <span className="text-sm font-medium">
                Week {currentWeekInfo.nextWeek}
              </span>
              <span className="text-xs text-muted-foreground">
                ({currentWeekInfo.nextWeekRange})
              </span>
            </div>
          </div>

          {/* Week Tabs */}
          <Tabs value={activeWeek} onValueChange={(v) => setActiveWeek(v as 'week1' | 'week2')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="week1" className="flex items-center gap-2">
                <Badge variant={activeWeek === 'week1' ? 'default' : 'secondary'} className="h-5 w-5 p-0 flex items-center justify-center text-xs">1</Badge>
                Week 1
                {currentWeekInfo.currentWeek === 1 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400 dark:border-green-800">
                    Current
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground ml-1">
                  ({getAvailableDays(availability.week1)} days, {getTotalHours(availability.week1).toFixed(0)}h)
                </span>
              </TabsTrigger>
              <TabsTrigger value="week2" className="flex items-center gap-2">
                <Badge variant={activeWeek === 'week2' ? 'default' : 'secondary'} className="h-5 w-5 p-0 flex items-center justify-center text-xs">2</Badge>
                Week 2
                {currentWeekInfo.currentWeek === 2 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400 dark:border-green-800">
                    Current
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground ml-1">
                  ({getAvailableDays(availability.week2)} days, {getTotalHours(availability.week2).toFixed(0)}h)
                </span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="week1" className="mt-0">
              {renderAvailabilityTable(availability.week1, 'week1')}
            </TabsContent>
            
            <TabsContent value="week2" className="mt-0">
              {renderAvailabilityTable(availability.week2, 'week2')}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Quick Stats */}
      {pattern === 'alternate_weekly' && (
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className={cn(
            "p-3 rounded-lg border",
            currentWeekInfo.currentWeek === 1 
              ? "bg-green-50/30 border-green-200 dark:bg-green-950/20 dark:border-green-900" 
              : "bg-muted/30"
          )}>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs text-muted-foreground">Week 1 Hours</p>
              {currentWeekInfo.currentWeek === 1 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">This Week</Badge>
              )}
            </div>
            <p className="text-lg font-semibold">
              {getTotalHours(availability.week1).toFixed(1)} hours
              <span className="text-sm font-normal text-muted-foreground ml-1">/ week</span>
            </p>
          </div>
          <div className={cn(
            "p-3 rounded-lg border",
            currentWeekInfo.currentWeek === 2 
              ? "bg-green-50/30 border-green-200 dark:bg-green-950/20 dark:border-green-900" 
              : "bg-muted/30"
          )}>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs text-muted-foreground">Week 2 Hours</p>
              {currentWeekInfo.currentWeek === 2 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">This Week</Badge>
              )}
            </div>
            <p className="text-lg font-semibold">
              {getTotalHours(availability.week2).toFixed(1)} hours
              <span className="text-sm font-normal text-muted-foreground ml-1">/ week</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
