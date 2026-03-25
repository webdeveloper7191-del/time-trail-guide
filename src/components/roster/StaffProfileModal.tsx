import { StaffMember, Shift, roleLabels, qualificationLabels, SchedulingPreferences, Room, Centre, DayAvailability } from '@/types/roster';
import { 
  Clock, 
  DollarSign, 
  Calendar, 
  Award, 
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  User,
  Sun,
  Moon,
  BedDouble,
  Heart,
  Ban,
  Bell,
  Settings2,
} from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';
import { useState } from 'react';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection } from '@/components/ui/off-canvas/FormSection';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { StyledSwitch } from '@/components/ui/StyledSwitch';
import { cn } from '@/lib/utils';
import { CentreSelector } from './CentreSelector';

interface StaffProfileModalProps {
  staff: StaffMember | null;
  shifts: Shift[];
  isOpen: boolean;
  onClose: () => void;
  allRooms?: Room[];
  centres?: Centre[];
  onSavePreferences?: (staffId: string, preferences: SchedulingPreferences) => void;
  onSaveAvailability?: (staffId: string, availability: DayAvailability[]) => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const defaultPreferences: SchedulingPreferences = {
  preferredRooms: [],
  avoidRooms: [],
  maxConsecutiveDays: 5,
  minRestHoursBetweenShifts: 10,
  preferEarlyShifts: false,
  preferLateShifts: false,
  maxShiftsPerWeek: 5,
  notifyOnPublish: true,
  notifyOnSwap: true,
  notifyOnOpenShifts: true,
};

export function StaffProfileModal({ staff, shifts, isOpen, onClose, allRooms = [], centres, onSavePreferences, onSaveAvailability }: StaffProfileModalProps) {
  const [tabValue, setTabValue] = useState('contact');
  
  if (!staff) return null;

  const staffShifts = shifts.filter(s => s.staffId === staff.id);
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  
  const thisWeekShifts = staffShifts.filter(s => {
    const shiftDate = parseISO(s.date);
    return isWithinInterval(shiftDate, { start: weekStart, end: weekEnd });
  });

  let weeklyHours = 0;
  thisWeekShifts.forEach(shift => {
    const [startH, startM] = shift.startTime.split(':').map(Number);
    const [endH, endM] = shift.endTime.split(':').map(Number);
    weeklyHours += ((endH * 60 + endM) - (startH * 60 + startM) - shift.breakMinutes) / 60;
  });

  const hoursProgress = (weeklyHours / staff.maxHoursPerWeek) * 100;
  const totalEarnings = weeklyHours * staff.hourlyRate;

  const upcomingShifts = staffShifts
    .filter(s => parseISO(s.date) >= now)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return (
    <PrimaryOffCanvas
      open={isOpen}
      onClose={onClose}
      title={staff.name}
      description={roleLabels[staff.role]}
      icon={User}
      size="lg"
      showFooter={false}
    >
      <div className="space-y-4">
        {/* Staff Header Card */}
        <div className="rounded-lg bg-gradient-to-r from-primary to-primary/80 p-4 text-primary-foreground">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-xl font-bold border-2 border-white/30">
              {staff.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold">{staff.name}</h3>
              <p className="text-sm opacity-90">{roleLabels[staff.role]}</p>
              <Badge variant={staff.agency ? "destructive" : "secondary"} className="mt-1">
                {staff.agency ? 'Agency' : 'Permanent'}
              </Badge>
            </div>
            <div className="text-right">
              <span className="text-2xl font-extrabold">${staff.hourlyRate}</span>
              <span className="text-xs opacity-80 block">/hour</span>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-muted/30">
          <div className="p-3 text-center border-r border-border">
            <div className="flex items-center justify-center gap-1 mb-1 text-muted-foreground">
              <Clock size={12} />
              <span className="text-xs">This Week</span>
            </div>
            <p className="text-base font-bold text-primary">{weeklyHours.toFixed(1)}h</p>
          </div>
          <div className="p-3 text-center border-r border-border">
            <div className="flex items-center justify-center gap-1 mb-1 text-muted-foreground">
              <DollarSign size={12} />
              <span className="text-xs">Earnings</span>
            </div>
            <p className="text-base font-bold text-success">${totalEarnings.toFixed(0)}</p>
          </div>
          <div className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1 text-muted-foreground">
              <Calendar size={12} />
              <span className="text-xs">Shifts</span>
            </div>
            <p className="text-base font-bold">{thisWeekShifts.length}</p>
          </div>
        </div>

        {/* Hours Progress */}
        <FormSection title="Weekly Hours Progress">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground">Progress</span>
            <span className={cn(
              "text-xs font-semibold",
              hoursProgress > 100 ? "text-destructive" : "text-primary"
            )}>
              {hoursProgress.toFixed(0)}%
            </span>
          </div>
          <Progress 
            value={Math.min(hoursProgress, 100)} 
            className={cn(
              "h-2",
              hoursProgress > 100 ? "[&>div]:bg-destructive" : "[&>div]:bg-primary"
            )}
          />
          <p className="text-xs text-muted-foreground mt-2">
            {weeklyHours.toFixed(1)} / {staff.maxHoursPerWeek} max hours
          </p>
        </FormSection>

        {/* Tabs */}
        <Tabs value={tabValue} onValueChange={setTabValue} className="w-full">
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="contact" className="text-xs">
              <Mail size={14} className="mr-1" />
              Contact
            </TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs">
              <Calendar size={14} className="mr-1" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="availability" className="text-xs">
              <Clock size={14} className="mr-1" />
              Availability
            </TabsTrigger>
            <TabsTrigger value="preferences" className="text-xs">
              <Settings2 size={14} className="mr-1" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="quals" className="text-xs">
              <Award size={14} className="mr-1" />
              Quals
            </TabsTrigger>
          </TabsList>

          {/* Contact Tab */}
          <TabsContent value="contact" className="mt-4 space-y-3">
            <FormSection title="Contact Details">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Mail size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{staff.email || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <Phone size={16} className="text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">{staff.phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </FormSection>
            
            <FormSection title="Pay Information">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Standard</p>
                  <p className="text-sm font-semibold text-primary">${staff.hourlyRate}/hr</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Overtime</p>
                  <p className="text-sm font-semibold text-warning">${staff.overtimeRate}/hr</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Max Hours</p>
                  <p className="text-sm font-semibold">{staff.maxHoursPerWeek}h</p>
                </div>
              </div>
            </FormSection>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="mt-4">
            <FormSection title="Upcoming Shifts">
              {upcomingShifts.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar size={40} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm text-muted-foreground">No upcoming shifts scheduled</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingShifts.map(shift => (
                    <div 
                      key={shift.id} 
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all"
                    >
                      <div className="min-w-[50px] text-center p-2 rounded-lg bg-primary/10">
                        <span className="text-[10px] font-semibold text-primary block">
                          {format(parseISO(shift.date), 'MMM')}
                        </span>
                        <span className="text-lg font-bold text-primary leading-none">
                          {format(parseISO(shift.date), 'd')}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{format(parseISO(shift.date), 'EEEE')}</p>
                        <p className="text-xs text-muted-foreground">{shift.startTime} - {shift.endTime}</p>
                      </div>
                      <Badge variant={shift.status === 'published' ? 'default' : 'secondary'} className="text-[10px] capitalize">
                        {shift.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </FormSection>
          </TabsContent>

          {/* Availability Tab */}
          <TabsContent value="availability" className="mt-4">
            <InlineAvailabilityEditor 
              staff={staff}
              onSave={onSaveAvailability ? (avail) => onSaveAvailability(staff.id, avail) : undefined}
            />
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="mt-4">
            <InlinePreferencesEditor
              staff={staff}
              allRooms={allRooms}
              centres={centres}
              onSave={onSavePreferences ? (prefs) => onSavePreferences(staff.id, prefs) : undefined}
            />
          </TabsContent>

          {/* Qualifications Tab */}
          <TabsContent value="quals" className="mt-4">
            <FormSection title="Qualifications">
              {staff.qualifications.length === 0 ? (
                <div className="text-center py-8">
                  <Award size={40} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm text-muted-foreground">No qualifications recorded</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {staff.qualifications.map((qual, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border",
                        qual.isExpired ? "border-destructive bg-destructive/5" : 
                        qual.isExpiringSoon ? "border-warning bg-warning/5" : 
                        "border-border"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg",
                        qual.isExpired ? "bg-destructive/10" : 
                        qual.isExpiringSoon ? "bg-warning/10" : 
                        "bg-success/10"
                      )}>
                        {qual.isExpired ? (
                          <AlertCircle size={18} className="text-destructive" />
                        ) : qual.isExpiringSoon ? (
                          <AlertCircle size={18} className="text-warning" />
                        ) : (
                          <CheckCircle2 size={18} className="text-success" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{qualificationLabels[qual.type]}</p>
                        {qual.expiryDate && (
                          <p className="text-xs text-muted-foreground">Expires: {qual.expiryDate}</p>
                        )}
                      </div>
                      <Badge 
                        variant={qual.isExpired ? "destructive" : qual.isExpiringSoon ? "outline" : "secondary"}
                        className={cn(
                          "text-[10px]",
                          qual.isExpiringSoon && !qual.isExpired && "border-warning text-warning"
                        )}
                      >
                        {qual.isExpired ? 'Expired' : qual.isExpiringSoon ? 'Expiring' : 'Valid'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </FormSection>
          </TabsContent>
        </Tabs>
      </div>
    </PrimaryOffCanvas>
  );
}

// ─── Inline Availability Editor ──────────────────────────────────────────────

function InlineAvailabilityEditor({ staff, onSave }: {
  staff: StaffMember;
  onSave?: (availability: DayAvailability[]) => void;
}) {
  const [availability, setAvailability] = useState<DayAvailability[]>(
    staff.availability || DAY_NAMES.map((_, i) => ({ dayOfWeek: i, available: i >= 1 && i <= 5 }))
  );
  const [dirty, setDirty] = useState(false);

  const toggleDay = (dayIndex: number) => {
    setAvailability(prev => prev.map(d => 
      d.dayOfWeek === dayIndex ? { ...d, available: !d.available } : d
    ));
    setDirty(true);
  };

  const updateTime = (dayIndex: number, field: 'startTime' | 'endTime', value: string) => {
    setAvailability(prev => prev.map(d => 
      d.dayOfWeek === dayIndex ? { ...d, [field]: value } : d
    ));
    setDirty(true);
  };

  const handleSave = () => {
    onSave?.(availability);
    setDirty(false);
  };

  return (
    <div className="space-y-4">
      <FormSection title="Weekly Availability">
        <div className="space-y-2">
          {availability.map((day) => (
            <div 
              key={day.dayOfWeek} 
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                day.available ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30"
              )}
            >
              <Checkbox
                checked={day.available}
                onCheckedChange={() => toggleDay(day.dayOfWeek)}
                className="border-primary data-[state=checked]:bg-primary"
              />
              <span className="text-sm font-medium w-10">{DAY_NAMES[day.dayOfWeek]}</span>
              {day.available ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={day.startTime || '06:30'}
                    onChange={(e) => updateTime(day.dayOfWeek, 'startTime', e.target.value)}
                    className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <input
                    type="time"
                    value={day.endTime || '18:30'}
                    onChange={(e) => updateTime(day.dayOfWeek, 'endTime', e.target.value)}
                    className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                  />
                </div>
              ) : (
                <span className="text-xs text-muted-foreground italic">Unavailable</span>
              )}
            </div>
          ))}
        </div>
      </FormSection>
      {onSave && dirty && (
        <button
          onClick={handleSave}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Save Availability
        </button>
      )}
    </div>
  );
}

// ─── Inline Preferences Editor ───────────────────────────────────────────────

function InlinePreferencesEditor({ staff, allRooms, centres, onSave }: {
  staff: StaffMember;
  allRooms: Room[];
  centres?: Centre[];
  onSave?: (preferences: SchedulingPreferences) => void;
}) {
  const [activeCentreId, setActiveCentreId] = useState(centres?.[0]?.id || '');
  const rooms = (() => {
    if (centres && activeCentreId) {
      const centre = centres.find(c => c.id === activeCentreId);
      return centre?.rooms || allRooms;
    }
    return allRooms;
  })();

  const [prefs, setPrefs] = useState<SchedulingPreferences>(
    staff.schedulingPreferences || defaultPreferences
  );
  const [dirty, setDirty] = useState(false);

  const update = (partial: Partial<SchedulingPreferences>) => {
    setPrefs(prev => ({ ...prev, ...partial }));
    setDirty(true);
  };

  const togglePreferred = (roomId: string) => {
    setPrefs(prev => {
      const current = prev.preferredRooms || [];
      if (current.includes(roomId)) {
        return { ...prev, preferredRooms: current.filter(id => id !== roomId) };
      }
      return { ...prev, preferredRooms: [...current, roomId], avoidRooms: (prev.avoidRooms || []).filter(id => id !== roomId) };
    });
    setDirty(true);
  };

  const toggleAvoid = (roomId: string) => {
    setPrefs(prev => {
      const current = prev.avoidRooms || [];
      if (current.includes(roomId)) {
        return { ...prev, avoidRooms: current.filter(id => id !== roomId) };
      }
      return { ...prev, avoidRooms: [...current, roomId], preferredRooms: (prev.preferredRooms || []).filter(id => id !== roomId) };
    });
    setDirty(true);
  };

  const handleSave = () => {
    onSave?.(prefs);
    setDirty(false);
  };

  return (
    <div className="space-y-4">
      {/* Schedule Limits */}
      <FormSection title="Schedule Limits">
        <div className="space-y-4">
          <div>
            <Label className="flex items-center justify-between">
              <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Max consecutive days</span>
              <Badge variant="secondary">{prefs.maxConsecutiveDays} days</Badge>
            </Label>
            <Slider value={[prefs.maxConsecutiveDays]} onValueChange={(v) => update({ maxConsecutiveDays: v[0] })} min={3} max={7} step={1} className="mt-2" />
          </div>
          <div>
            <Label className="flex items-center justify-between">
              <span className="flex items-center gap-2"><BedDouble className="h-4 w-4 text-primary" /> Min rest between shifts</span>
              <Badge variant="secondary">{prefs.minRestHoursBetweenShifts}h</Badge>
            </Label>
            <Slider value={[prefs.minRestHoursBetweenShifts]} onValueChange={(v) => update({ minRestHoursBetweenShifts: v[0] })} min={8} max={14} step={1} className="mt-2" />
          </div>
          <div>
            <Label className="flex items-center justify-between">
              <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Max shifts per week</span>
              <Badge variant="secondary">{prefs.maxShiftsPerWeek} shifts</Badge>
            </Label>
            <Slider value={[prefs.maxShiftsPerWeek]} onValueChange={(v) => update({ maxShiftsPerWeek: v[0] })} min={3} max={7} step={1} className="mt-2" />
          </div>
        </div>
      </FormSection>

      {/* Shift Time Preferences */}
      <FormSection title="Shift Time Preferences">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2"><Sun className="h-4 w-4 text-warning" /> Prefer Early Shifts</Label>
            <StyledSwitch checked={prefs.preferEarlyShifts} onChange={(checked) => update({ preferEarlyShifts: checked, preferLateShifts: checked ? false : prefs.preferLateShifts })} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2"><Moon className="h-4 w-4 text-primary" /> Prefer Late Shifts</Label>
            <StyledSwitch checked={prefs.preferLateShifts} onChange={(checked) => update({ preferLateShifts: checked, preferEarlyShifts: checked ? false : prefs.preferEarlyShifts })} />
          </div>
        </div>
      </FormSection>

      {/* Room Preferences */}
      {rooms.length > 0 && (
        <>
          {centres && centres.length > 0 && (
            <FormSection title="Location">
              <CentreSelector centres={centres} selectedCentreId={activeCentreId} onCentreChange={setActiveCentreId} />
            </FormSection>
          )}
          <FormSection title="Preferred Rooms">
            <div className="grid grid-cols-2 gap-2">
              {rooms.map(room => (
                <div
                  key={room.id}
                  className={cn(
                    "flex items-center space-x-2 p-2 rounded-md border cursor-pointer transition-colors",
                    prefs.preferredRooms?.includes(room.id) ? "bg-primary/10 border-primary" : "bg-background hover:bg-muted"
                  )}
                  onClick={() => togglePreferred(room.id)}
                >
                  <Checkbox checked={prefs.preferredRooms?.includes(room.id)} className="border-primary data-[state=checked]:bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{room.name}</p>
                    <p className="text-xs text-muted-foreground">{room.ageGroup}</p>
                  </div>
                </div>
              ))}
            </div>
          </FormSection>
          <FormSection title="Rooms to Avoid">
            <div className="grid grid-cols-2 gap-2">
              {rooms.map(room => (
                <div
                  key={room.id}
                  className={cn(
                    "flex items-center space-x-2 p-2 rounded-md border cursor-pointer transition-colors",
                    prefs.avoidRooms?.includes(room.id) ? "bg-destructive/10 border-destructive" : "bg-background hover:bg-muted"
                  )}
                  onClick={() => toggleAvoid(room.id)}
                >
                  <Checkbox checked={prefs.avoidRooms?.includes(room.id)} className="border-destructive data-[state=checked]:bg-destructive" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{room.name}</p>
                    <p className="text-xs text-muted-foreground">{room.ageGroup}</p>
                  </div>
                </div>
              ))}
            </div>
          </FormSection>
        </>
      )}

      {/* Notifications */}
      <FormSection title="Notifications">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label>Shift Published</Label>
              <p className="text-xs text-muted-foreground">Notify when new shifts are published</p>
            </div>
            <StyledSwitch checked={prefs.notifyOnPublish} onChange={(checked) => update({ notifyOnPublish: checked })} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Shift Swapped</Label>
              <p className="text-xs text-muted-foreground">Notify when shifts are swapped</p>
            </div>
            <StyledSwitch checked={prefs.notifyOnSwap} onChange={(checked) => update({ notifyOnSwap: checked })} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Open Shifts</Label>
              <p className="text-xs text-muted-foreground">Notify about new open shifts</p>
            </div>
            <StyledSwitch checked={prefs.notifyOnOpenShifts} onChange={(checked) => update({ notifyOnOpenShifts: checked })} />
          </div>
        </div>
      </FormSection>

      {onSave && dirty && (
        <button
          onClick={handleSave}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Save Preferences
        </button>
      )}
    </div>
  );
}
