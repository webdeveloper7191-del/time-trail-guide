import { useState, useEffect, useMemo } from 'react';
import { StyledSwitch } from '@/components/ui/StyledSwitch';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  User, 
  Clock, 
  Calendar, 
  Bell, 
  Heart,
  Ban,
  Sun,
  Moon,
  BedDouble,
  ChevronsUpDown,
  Check,
  Search
} from 'lucide-react';
import { StaffMember, SchedulingPreferences, Room, Centre } from '@/types/roster';
import { cn } from '@/lib/utils';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection, FormField } from '@/components/ui/off-canvas/FormSection';
import { CentreSelector } from './CentreSelector';

function SearchableStaffSelector({ staff, selectedId, onSelect }: { 
  staff: StaffMember[]; 
  selectedId: string; 
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = staff.find(s => s.id === selectedId);
  
  const filtered = useMemo(() => {
    if (!search) return staff;
    const q = search.toLowerCase();
    return staff.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.role?.toLowerCase().includes(q)
    );
  }, [staff, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="flex items-center gap-2 truncate">
            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
            {selected ? (
              <span className="truncate">{selected.name}{selected.role ? ` — ${selected.role}` : ''}</span>
            ) : (
              <span className="text-muted-foreground">Select staff member...</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-60 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No staff found.</p>
          ) : (
            filtered.map(s => (
              <div
                key={s.id}
                onClick={() => { onSelect(s.id); setOpen(false); setSearch(''); }}
                className={cn(
                  "flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                  s.id === selectedId && "bg-accent"
                )}
              >
                <Check className={cn("h-4 w-4 shrink-0", s.id === selectedId ? "opacity-100" : "opacity-0")} />
                <span className="truncate">{s.name}</span>
                {s.role && <span className="ml-auto text-xs text-muted-foreground truncate">{s.role}</span>}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface SchedulingPreferencesModalProps {
  open: boolean;
  onClose: () => void;
  staff: StaffMember;
  allStaff?: StaffMember[];
  allRooms: Room[];
  centres?: Centre[];
  onSave: (staffId: string, preferences: SchedulingPreferences) => void;
}

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

export function SchedulingPreferencesModal({ 
  open, 
  onClose, 
  staff: initialStaff, 
  allStaff,
  allRooms: defaultRooms,
  centres,
  onSave 
}: SchedulingPreferencesModalProps) {
  const [selectedStaffId, setSelectedStaffId] = useState(initialStaff.id);
  const staff = useMemo(() => {
    if (allStaff) {
      return allStaff.find(s => s.id === selectedStaffId) || initialStaff;
    }
    return initialStaff;
  }, [allStaff, selectedStaffId, initialStaff]);

  const [activeCentreId, setActiveCentreId] = useState(centres?.[0]?.id || '');
  const allRooms = useMemo(() => {
    if (centres && activeCentreId) {
      const centre = centres.find(c => c.id === activeCentreId);
      return centre?.rooms || defaultRooms;
    }
    return defaultRooms;
  }, [centres, activeCentreId, defaultRooms]);
  const [preferences, setPreferences] = useState<SchedulingPreferences>(
    staff.schedulingPreferences || defaultPreferences
  );
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    setSelectedStaffId(initialStaff.id);
  }, [initialStaff.id]);

  useEffect(() => {
    setPreferences(staff.schedulingPreferences || defaultPreferences);
  }, [staff]);

  const handleSave = () => {
    onSave(staff.id, preferences);
    onClose();
  };

  const togglePreferredRoom = (roomId: string) => {
    setPreferences(prev => {
      const current = prev.preferredRooms || [];
      if (current.includes(roomId)) {
        return { ...prev, preferredRooms: current.filter(id => id !== roomId) };
      }
      return { 
        ...prev, 
        preferredRooms: [...current, roomId],
        avoidRooms: (prev.avoidRooms || []).filter(id => id !== roomId)
      };
    });
  };

  const toggleAvoidRoom = (roomId: string) => {
    setPreferences(prev => {
      const current = prev.avoidRooms || [];
      if (current.includes(roomId)) {
        return { ...prev, avoidRooms: current.filter(id => id !== roomId) };
      }
      return { 
        ...prev, 
        avoidRooms: [...current, roomId],
        preferredRooms: (prev.preferredRooms || []).filter(id => id !== roomId)
      };
    });
  };

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Scheduling Preferences"
      description={`Configure scheduling preferences for ${staff.name}`}
      icon={User}
      size="lg"
      actions={[
        { label: 'Cancel', variant: 'secondary', onClick: onClose },
        { label: 'Save Preferences', variant: 'primary', onClick: handleSave },
      ]}
    >
      {/* Staff Selector */}
      {allStaff && allStaff.length > 1 && (
        <FormSection title="Staff Member">
          <SearchableStaffSelector
            staff={allStaff}
            selectedId={selectedStaffId}
            onSelect={setSelectedStaffId}
          />
        </FormSection>
      )}

      <Tabs value={tabValue.toString()} onValueChange={(v) => setTabValue(parseInt(v))} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="0">Schedule</TabsTrigger>
          <TabsTrigger value="1">Rooms</TabsTrigger>
          <TabsTrigger value="2">Notifications</TabsTrigger>
        </TabsList>

        {/* Schedule Tab */}
        <TabsContent value="0" className="space-y-4 mt-4">
                {/* Max Consecutive Days */}
                <FormSection title="Max Consecutive Work Days">
                  <Label className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Days in a row
                    </span>
                    <Badge variant="secondary">{preferences.maxConsecutiveDays} days</Badge>
                  </Label>
                  <Slider
                    value={[preferences.maxConsecutiveDays]}
                    onValueChange={(v) => setPreferences({ ...preferences, maxConsecutiveDays: v[0] })}
                    min={3}
                    max={7}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum number of days in a row this staff can work
                  </p>
                </FormSection>

                {/* Min Rest Hours */}
                <FormSection title="Minimum Rest Between Shifts">
                  <Label className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <BedDouble className="h-4 w-4 text-primary" />
                      Rest hours
                    </span>
                    <Badge variant="secondary">{preferences.minRestHoursBetweenShifts}h</Badge>
                  </Label>
                  <Slider
                    value={[preferences.minRestHoursBetweenShifts]}
                    onValueChange={(v) => setPreferences({ ...preferences, minRestHoursBetweenShifts: v[0] })}
                    min={8}
                    max={14}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum hours of rest required between consecutive shifts
                  </p>
                </FormSection>

                {/* Max Shifts Per Week */}
                <FormSection title="Max Shifts Per Week">
                  <Label className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Weekly limit
                    </span>
                    <Badge variant="secondary">{preferences.maxShiftsPerWeek} shifts</Badge>
                  </Label>
                  <Slider
                    value={[preferences.maxShiftsPerWeek]}
                    onValueChange={(v) => setPreferences({ ...preferences, maxShiftsPerWeek: v[0] })}
                    min={3}
                    max={7}
                    step={1}
                    className="mt-2"
                  />
                </FormSection>

                {/* Shift Time Preferences */}
                <FormSection title="Shift Time Preferences">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Sun className="h-4 w-4 text-warning" />
                        Prefer Early Shifts (6:30 AM - 2:30 PM)
                      </Label>
                      <StyledSwitch
                        checked={preferences.preferEarlyShifts}
                        onChange={(checked) => setPreferences({ 
                          ...preferences, 
                          preferEarlyShifts: checked,
                          preferLateShifts: checked ? false : preferences.preferLateShifts
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Moon className="h-4 w-4 text-primary" />
                        Prefer Late Shifts (10:30 AM - 6:30 PM)
                      </Label>
                      <StyledSwitch
                        checked={preferences.preferLateShifts}
                        onChange={(checked) => setPreferences({ 
                          ...preferences, 
                          preferLateShifts: checked,
                          preferEarlyShifts: checked ? false : preferences.preferEarlyShifts
                        })}
                      />
                    </div>
                  </div>
                </FormSection>
        </TabsContent>

        {/* Rooms Tab */}
        <TabsContent value="1" className="space-y-4 mt-4">
                {/* Location Selector */}
                {centres && centres.length > 0 && (
                  <FormSection title="Location">
                    <CentreSelector
                      centres={centres}
                      selectedCentreId={activeCentreId}
                      onCentreChange={setActiveCentreId}
                    />
                  </FormSection>
                )}
                {/* Preferred Rooms */}
                <FormSection title="Preferred Rooms">
                  <div className="grid grid-cols-2 gap-2">
                    {allRooms.map(room => (
                      <div
                        key={room.id}
                        className={cn(
                          "flex items-center space-x-2 p-2 rounded-md border cursor-pointer transition-colors",
                          preferences.preferredRooms?.includes(room.id)
                            ? "bg-primary/10 border-primary"
                            : "bg-background hover:bg-muted"
                        )}
                        onClick={() => togglePreferredRoom(room.id)}
                      >
                        <Checkbox 
                          checked={preferences.preferredRooms?.includes(room.id)}
                          className="border-primary data-[state=checked]:bg-primary"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{room.name}</p>
                          <p className="text-xs text-muted-foreground">{room.ageGroup}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </FormSection>

                {/* Rooms to Avoid */}
                <FormSection title="Rooms to Avoid">
                  <div className="grid grid-cols-2 gap-2">
                    {allRooms.map(room => (
                      <div
                        key={room.id}
                        className={cn(
                          "flex items-center space-x-2 p-2 rounded-md border cursor-pointer transition-colors",
                          preferences.avoidRooms?.includes(room.id)
                            ? "bg-destructive/10 border-destructive"
                            : "bg-background hover:bg-muted"
                        )}
                        onClick={() => toggleAvoidRoom(room.id)}
                      >
                        <Checkbox 
                          checked={preferences.avoidRooms?.includes(room.id)}
                          className="border-destructive data-[state=checked]:bg-destructive"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{room.name}</p>
                          <p className="text-xs text-muted-foreground">{room.ageGroup}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </FormSection>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="2" className="space-y-4 mt-4">
                <FormSection title="Notification Preferences">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Shift Published</Label>
                        <p className="text-xs text-muted-foreground">
                          Notify when new shifts are published
                        </p>
                      </div>
                      <StyledSwitch
                        checked={preferences.notifyOnPublish}
                        onChange={(checked) => setPreferences({ ...preferences, notifyOnPublish: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Shift Swapped</Label>
                        <p className="text-xs text-muted-foreground">
                          Notify when shifts are swapped
                        </p>
                      </div>
                      <StyledSwitch
                        checked={preferences.notifyOnSwap}
                        onChange={(checked) => setPreferences({ ...preferences, notifyOnSwap: checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Open Shifts Available</Label>
                        <p className="text-xs text-muted-foreground">
                          Notify about new open shifts
                        </p>
                      </div>
                      <StyledSwitch
                        checked={preferences.notifyOnOpenShifts}
                        onChange={(checked) => setPreferences({ ...preferences, notifyOnOpenShifts: checked })}
                      />
                    </div>
                  </div>
                </FormSection>

                <FormSection title="Email Configuration">
                  <p className="text-sm text-muted-foreground">
                    Notifications will be sent via email to <span className="font-medium">{staff.email || 'Not configured'}</span>
                  </p>
                </FormSection>
        </TabsContent>
      </Tabs>
    </PrimaryOffCanvas>
  );
}
