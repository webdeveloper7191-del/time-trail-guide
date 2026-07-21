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
import { Plus, Trash2, Save, CalendarIcon, Info, Moon, Copy } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { locations } from '@/data/mockStaffData';
import { format, differenceInWeeks, startOfWeek, addWeeks } from 'date-fns';

type PatternKey =
  | 'same_every_week'
  | 'alternate_weekly'
  | 'three_week_cycle'
  | 'four_week_cycle';

interface InlineAvailabilityTableProps {
  staff: StaffMember;
  onSave?: (
    availability: WeeklyAvailability[],
    pattern: PatternKey,
    anchor?: string,
  ) => void;
}

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
type WeekIdx = 1 | 2 | 3 | 4;

interface AvailabilityRow extends WeeklyAvailability {
  week: WeekIdx;
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

const PATTERN_WEEKS: Record<PatternKey, number> = {
  same_every_week: 1,
  alternate_weekly: 2,
  three_week_cycle: 3,
  four_week_cycle: 4,
};

const PATTERN_LABELS: Record<PatternKey, string> = {
  same_every_week: 'Same Every Week',
  alternate_weekly: 'Alternate Weekly (2-wk)',
  three_week_cycle: '3-Week Cycle',
  four_week_cycle: '4-Week Cycle',
};

function calculateHours(startTime?: string, endTime?: string): string {
  if (!startTime || !endTime) return '-';
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const hours = (endH + endM / 60) - (startH + startM / 60);
  return hours > 0 ? `${hours.toFixed(1)}h` : '-';
}

export function InlineAvailabilityTable({ staff, onSave }: InlineAvailabilityTableProps) {
  const [pattern, setPattern] = useState<PatternKey>(staff.availabilityPattern as PatternKey);
  const cycleWeeks = PATTERN_WEEKS[pattern];

  const [activeWeek, setActiveWeek] = useState<WeekIdx>(1);
  const [hasChanges, setHasChanges] = useState(false);

  const [anchorDate, setAnchorDate] = useState<Date>(() => {
    return staff.availabilityCycleAnchor
      ? startOfWeek(new Date(staff.availabilityCycleAnchor), { weekStartsOn: 1 })
      : startOfWeek(new Date(), { weekStartsOn: 1 });
  });

  // Compute which cycle week is "current"
  const currentWeekInfo = useMemo(() => {
    const today = new Date();
    const weeksSince = differenceInWeeks(
      startOfWeek(today, { weekStartsOn: 1 }),
      startOfWeek(anchorDate, { weekStartsOn: 1 }),
    );
    const currentWeek = (((weeksSince % cycleWeeks) + cycleWeeks) % cycleWeeks) + 1;
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    return {
      currentWeek: currentWeek as WeekIdx,
      currentWeekRange: `${format(currentWeekStart, 'dd MMM')} - ${format(addWeeks(currentWeekStart, 1), 'dd MMM')}`,
    };
  }, [anchorDate, cycleWeeks]);

  // Initialize a rows-by-week map for up to 4 weeks
  const initializeAvailability = useCallback(() => {
    const perWeek: Record<WeekIdx, AvailabilityRow[]> = { 1: [], 2: [], 3: [], 4: [] };
    ([1, 2, 3, 4] as WeekIdx[]).forEach(w => {
      perWeek[w] = daysOfWeek.map(day => {
        // Prefer a row explicitly tagged with this week; fall back to untagged (same-week) row
        const existing =
          staff.weeklyAvailability.find(a => a.dayOfWeek === day.key && a.week === w) ||
          (w === 1 ? staff.weeklyAvailability.find(a => a.dayOfWeek === day.key && !a.week) : undefined);
        return existing
          ? { ...existing, week: w }
          : { dayOfWeek: day.key, isAvailable: false, week: w };
      });
    });
    return perWeek;
  }, [staff.weeklyAvailability]);

  const [availability, setAvailability] = useState(initializeAvailability);

  const updateDay = (week: WeekIdx, dayKey: DayOfWeek, updates: Partial<AvailabilityRow>) => {
    setAvailability(prev => ({
      ...prev,
      [week]: prev[week].map(day =>
        day.dayOfWeek === dayKey ? { ...day, ...updates } : day,
      ),
    }));
    setHasChanges(true);
  };

  const addHours = (week: WeekIdx, dayKey: DayOfWeek) =>
    updateDay(week, dayKey, {
      isAvailable: true,
      isRdo: false,
      startTime: '09:00',
      endTime: '17:00',
      breakMinutes: 30,
      area: locations[0],
    });

  const removeHours = (week: WeekIdx, dayKey: DayOfWeek) =>
    updateDay(week, dayKey, {
      isAvailable: false,
      isRdo: false,
      startTime: undefined,
      endTime: undefined,
      breakMinutes: undefined,
      area: undefined,
    });

  const markRdo = (week: WeekIdx, dayKey: DayOfWeek) =>
    updateDay(week, dayKey, {
      isAvailable: false,
      isRdo: true,
      startTime: undefined,
      endTime: undefined,
      breakMinutes: undefined,
      area: undefined,
    });

  const WEEKDAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const WEEKENDS: DayOfWeek[] = ['saturday', 'sunday'];
  const ALL_DAYS: DayOfWeek[] = [...WEEKDAYS, ...WEEKENDS];

  const copyDayTo = (week: WeekIdx, sourceKey: DayOfWeek, targets: DayOfWeek[]) => {
    const source = availability[week].find(d => d.dayOfWeek === sourceKey);
    if (!source) return;
    setAvailability(prev => ({
      ...prev,
      [week]: prev[week].map(day =>
        targets.includes(day.dayOfWeek) && day.dayOfWeek !== sourceKey
          ? {
              ...day,
              isAvailable: source.isAvailable,
              isRdo: source.isRdo,
              startTime: source.startTime,
              endTime: source.endTime,
              breakMinutes: source.breakMinutes,
              area: source.area,
            }
          : day,
      ),
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!onSave) {
      setHasChanges(false);
      return;
    }
    if (cycleWeeks === 1) {
      // Strip week tag for single-week pattern
      const rows = availability[1].map(({ week: _w, ...rest }) => rest);
      onSave(rows, pattern, undefined);
    } else {
      const rows: WeeklyAvailability[] = [];
      for (let w = 1 as WeekIdx; w <= cycleWeeks; w = (w + 1) as WeekIdx) {
        rows.push(...availability[w]);
      }
      onSave(rows, pattern, format(anchorDate, 'yyyy-MM-dd'));
    }
    setHasChanges(false);
  };

  const getTotalHours = (weekData: AvailabilityRow[]): number =>
    weekData.reduce((total, day) => {
      if (!day.isAvailable || !day.startTime || !day.endTime) return total;
      const [startH, startM] = day.startTime.split(':').map(Number);
      const [endH, endM] = day.endTime.split(':').map(Number);
      return total + ((endH + endM / 60) - (startH + startM / 60));
    }, 0);

  const getAvailableDays = (weekData: AvailabilityRow[]): number =>
    weekData.filter(d => d.isAvailable).length;

  const getRdoDays = (weekData: AvailabilityRow[]): number =>
    weekData.filter(d => d.isRdo).length;

  const renderActionMenu = (
    week: WeekIdx,
    dayKey: DayOfWeek,
    trigger: React.ReactNode,
    opts: { hasData: boolean },
  ) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem onClick={() => addHours(week, dayKey)}>
          <Plus className="h-3.5 w-3.5 mr-2" /> Shift
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => markRdo(week, dayKey)}>
          <Moon className="h-3.5 w-3.5 mr-2" /> Rostered Day Off
        </DropdownMenuItem>
        {opts.hasData && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => copyDayTo(week, dayKey, WEEKDAYS)}>
              <Copy className="h-3.5 w-3.5 mr-2" /> Copy to Weekdays
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => copyDayTo(week, dayKey, WEEKENDS)}>
              <Copy className="h-3.5 w-3.5 mr-2" /> Copy to Weekend
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => copyDayTo(week, dayKey, ALL_DAYS)}>
              <Copy className="h-3.5 w-3.5 mr-2" /> Copy to Full Week
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderAvailabilityTable = (weekData: AvailabilityRow[], week: WeekIdx) => (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-[100px_1fr_1fr_80px_80px_1fr_50px] gap-0 bg-muted/50 text-sm font-medium border-b">
        <div className="px-3 py-2.5">Day</div>
        <div className="px-3 py-2.5 text-center">Start</div>
        <div className="px-3 py-2.5 text-center">Finish</div>
        <div className="px-3 py-2.5 text-center">Hours</div>
        <div className="px-3 py-2.5 text-center">Break</div>
        <div className="px-3 py-2.5 text-center">Area</div>
        <div className="px-3 py-2.5" />
      </div>

      {daysOfWeek.map((day) => {
        const dayData = weekData.find(a => a.dayOfWeek === day.key);
        const isAvailable = !!dayData?.isAvailable;
        const isRdo = !!dayData?.isRdo;

        return (
          <div
            key={day.key}
            className={cn(
              'grid grid-cols-[100px_1fr_1fr_80px_80px_1fr_50px] gap-0 border-t items-center transition-colors',
              isAvailable && 'bg-green-50/30 dark:bg-green-950/10',
              isRdo && 'bg-rose-50/40 dark:bg-rose-950/10',
              !isAvailable && !isRdo && 'bg-muted/10',
            )}
          >
            <div className="px-3 py-2">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    isAvailable ? 'bg-green-500' : isRdo ? 'bg-rose-500' : 'bg-muted-foreground/30',
                  )}
                />
                <span className="font-medium text-sm">{day.label}</span>
              </div>
            </div>

            {isAvailable ? (
              <>
                <div className="px-2 py-2">
                  <Input
                    type="time"
                    value={dayData?.startTime || ''}
                    onChange={(e) => updateDay(week, day.key, { startTime: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="px-2 py-2">
                  <Input
                    type="time"
                    value={dayData?.endTime || ''}
                    onChange={(e) => updateDay(week, day.key, { endTime: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="px-3 py-2 text-center">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {calculateHours(dayData?.startTime, dayData?.endTime)}
                  </Badge>
                </div>
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
            ) : isRdo ? (
              <>
                <div className="col-span-5 px-3 py-2">
                  <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900 gap-1">
                    <Moon className="h-3 w-3" />
                    RDO — Rostered Day Off (hard block, Week {week} of {cycleWeeks})
                  </Badge>
                </div>
                <div className="px-2 py-2 text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeHours(week, day.key)}
                    title="Clear RDO"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="col-span-5 px-3 py-2 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => addHours(week, day.key)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Hours
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    onClick={() => markRdo(week, day.key)}
                    title={`Mark this weekday as an RDO in Week ${week}`}
                  >
                    <Moon className="h-3 w-3 mr-1" />
                    Mark as RDO
                  </Button>
                </div>
                <div className="px-2 py-2" />
              </>
            )}
          </div>
        );
      })}

      <div className="grid grid-cols-[100px_1fr_1fr_80px_80px_1fr_50px] gap-0 bg-muted/30 border-t text-sm font-medium">
        <div className="px-3 py-2.5">Total</div>
        <div className="px-3 py-2.5 text-center text-muted-foreground">
          {getAvailableDays(weekData)} days
          {getRdoDays(weekData) > 0 && (
            <span className="ml-2 text-rose-600">· {getRdoDays(weekData)} RDO</span>
          )}
        </div>
        <div className="px-3 py-2.5" />
        <div className="px-3 py-2.5 text-center">
          <Badge variant="default" className="font-mono text-xs">
            {getTotalHours(weekData).toFixed(1)}h
          </Badge>
        </div>
        <div className="col-span-3 px-3 py-2.5" />
      </div>
    </div>
  );

  const visibleWeeks = ([1, 2, 3, 4] as WeekIdx[]).slice(0, cycleWeeks);

  return (
    <div className="space-y-4">
      {/* Pattern Selection */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <RadioGroup
          value={pattern}
          onValueChange={(v) => {
            const next = v as PatternKey;
            setPattern(next);
            setActiveWeek(1);
            setHasChanges(true);
          }}
          className="flex flex-wrap gap-4"
        >
          {(Object.keys(PATTERN_LABELS) as PatternKey[]).map(key => (
            <div key={key} className="flex items-center gap-2">
              <RadioGroupItem value={key} id={key} />
              <Label htmlFor={key} className="font-medium cursor-pointer text-sm">
                {PATTERN_LABELS[key]}
              </Label>
            </div>
          ))}
        </RadioGroup>

        {hasChanges && (
          <Button size="sm" onClick={handleSave} className="shadow-sm">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        )}
      </div>

      {/* Single-week view */}
      {cycleWeeks === 1 ? (
        renderAvailabilityTable(availability[1], 1)
      ) : (
        <div className="space-y-4">
          {/* Anchor Date */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
            <div className="flex items-center gap-3">
              <Info className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Week 1 starts from</p>
                <p className="text-xs text-muted-foreground">
                  Anchors the {cycleWeeks}-week cycle. Today falls in Week {currentWeekInfo.currentWeek} ({currentWeekInfo.currentWeekRange}).
                </p>
              </div>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="min-w-[160px] justify-start">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {format(anchorDate, 'dd MMM yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={anchorDate}
                  onSelect={(date) => {
                    if (date) {
                      setAnchorDate(startOfWeek(date, { weekStartsOn: 1 }));
                      setHasChanges(true);
                    }
                  }}
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Week Tabs */}
          <Tabs value={String(activeWeek)} onValueChange={(v) => setActiveWeek(Number(v) as WeekIdx)}>
            <TabsList
              className="grid w-full mb-4"
              style={{ gridTemplateColumns: `repeat(${cycleWeeks}, minmax(0, 1fr))` }}
            >
              {visibleWeeks.map(w => (
                <TabsTrigger key={w} value={String(w)} className="flex items-center gap-2">
                  <Badge
                    variant={activeWeek === w ? 'default' : 'secondary'}
                    className="h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {w}
                  </Badge>
                  Week {w}
                  {currentWeekInfo.currentWeek === w && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-4 bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400 dark:border-green-800"
                    >
                      Current
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground ml-1 hidden md:inline">
                    ({getAvailableDays(availability[w])}d, {getTotalHours(availability[w]).toFixed(0)}h)
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {visibleWeeks.map(w => (
              <TabsContent key={w} value={String(w)} className="mt-0">
                {renderAvailabilityTable(availability[w], w)}
              </TabsContent>
            ))}
          </Tabs>

          {/* Quick Stats */}
          <div
            className="grid gap-3 pt-2"
            style={{ gridTemplateColumns: `repeat(${cycleWeeks}, minmax(0, 1fr))` }}
          >
            {visibleWeeks.map(w => (
              <div
                key={w}
                className={cn(
                  'p-3 rounded-lg border',
                  currentWeekInfo.currentWeek === w
                    ? 'bg-green-50/30 border-green-200 dark:bg-green-950/20 dark:border-green-900'
                    : 'bg-muted/30',
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs text-muted-foreground">Week {w}</p>
                  {currentWeekInfo.currentWeek === w && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">This Week</Badge>
                  )}
                </div>
                <p className="text-lg font-semibold">
                  {getTotalHours(availability[w]).toFixed(1)}h
                  {getRdoDays(availability[w]) > 0 && (
                    <span className="text-xs font-normal text-rose-600 ml-2">
                      {getRdoDays(availability[w])} RDO
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
