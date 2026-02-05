import { useState, useEffect } from 'react';
import { StyledSwitch } from '@/components/ui/StyledSwitch';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Clock, 
  Calendar, 
  Bell, 
  Heart,
  Ban,
  Sun,
  Moon,
  BedDouble
} from 'lucide-react';
import { StaffMember, SchedulingPreferences, Room } from '@/types/roster';
import { cn } from '@/lib/utils';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection, FormField } from '@/components/ui/off-canvas/FormSection';

interface SchedulingPreferencesModalProps {
  open: boolean;
  onClose: () => void;
  staff: StaffMember;
  allRooms: Room[];
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
  staff, 
  allRooms,
  onSave 
}: SchedulingPreferencesModalProps) {
  const [preferences, setPreferences] = useState<SchedulingPreferences>(
    staff.schedulingPreferences || defaultPreferences
  );
  const [tabValue, setTabValue] = useState(0);

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
