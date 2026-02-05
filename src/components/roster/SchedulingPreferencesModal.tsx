import { useState, useEffect } from 'react';
import {
  Tab,
  Tabs,
  Switch as MuiSwitch,
  Slider as MuiSlider,
  Checkbox as MuiCheckbox,
} from '@mui/material';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
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
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Scheduling Preferences
          </SheetTitle>
          <SheetDescription>
            Configure scheduling preferences for {staff.name}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Schedule" />
            <Tab label="Rooms" />
            <Tab label="Notifications" />
          </Tabs>

          <ScrollArea className="h-[calc(100vh-320px)] mt-4">
            {/* Schedule Tab */}
            {tabValue === 0 && (
              <div className="space-y-5 pr-4">
                {/* Max Consecutive Days */}
                <FormSection title="Max Consecutive Work Days">
                  <Label className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Days in a row
                    </span>
                    <Badge variant="secondary">{preferences.maxConsecutiveDays} days</Badge>
                  </Label>
                  <MuiSlider
                    value={preferences.maxConsecutiveDays}
                    onChange={(_, v) => setPreferences({ ...preferences, maxConsecutiveDays: v as number })}
                    min={3}
                    max={7}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
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
                  <MuiSlider
                    value={preferences.minRestHoursBetweenShifts}
                    onChange={(_, v) => setPreferences({ ...preferences, minRestHoursBetweenShifts: v as number })}
                    min={8}
                    max={14}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
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
                  <MuiSlider
                    value={preferences.maxShiftsPerWeek}
                    onChange={(_, v) => setPreferences({ ...preferences, maxShiftsPerWeek: v as number })}
                    min={3}
                    max={7}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
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
                      <MuiSwitch
                        checked={preferences.preferEarlyShifts}
                        onChange={(e) => setPreferences({ 
                          ...preferences, 
                          preferEarlyShifts: e.target.checked,
                          preferLateShifts: e.target.checked ? false : preferences.preferLateShifts
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Moon className="h-4 w-4 text-primary" />
                        Prefer Late Shifts (10:30 AM - 6:30 PM)
                      </Label>
                      <MuiSwitch
                        checked={preferences.preferLateShifts}
                        onChange={(e) => setPreferences({ 
                          ...preferences, 
                          preferLateShifts: e.target.checked,
                          preferEarlyShifts: e.target.checked ? false : preferences.preferEarlyShifts
                        })}
                      />
                    </div>
                  </div>
                </FormSection>
              </div>
            )}

            {/* Rooms Tab */}
            {tabValue === 1 && (
              <div className="space-y-5 pr-4">
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
                        <MuiCheckbox 
                          checked={preferences.preferredRooms?.includes(room.id)}
                          size="small"
                          sx={{ '&.Mui-checked': { color: 'hsl(var(--primary))' } }}
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
                        <MuiCheckbox 
                          checked={preferences.avoidRooms?.includes(room.id)}
                          size="small"
                          color="error"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{room.name}</p>
                          <p className="text-xs text-muted-foreground">{room.ageGroup}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </FormSection>
              </div>
            )}

            {/* Notifications Tab */}
            {tabValue === 2 && (
              <div className="space-y-5 pr-4">
                <FormSection title="Notification Preferences">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Shift Published</Label>
                        <p className="text-xs text-muted-foreground">
                          Notify when new shifts are published
                        </p>
                      </div>
                      <MuiSwitch
                        checked={preferences.notifyOnPublish}
                        onChange={(e) => setPreferences({ ...preferences, notifyOnPublish: e.target.checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Shift Swapped</Label>
                        <p className="text-xs text-muted-foreground">
                          Notify when shifts are swapped
                        </p>
                      </div>
                      <MuiSwitch
                        checked={preferences.notifyOnSwap}
                        onChange={(e) => setPreferences({ ...preferences, notifyOnSwap: e.target.checked })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Open Shifts Available</Label>
                        <p className="text-xs text-muted-foreground">
                          Notify about new open shifts
                        </p>
                      </div>
                      <MuiSwitch
                        checked={preferences.notifyOnOpenShifts}
                        onChange={(e) => setPreferences({ ...preferences, notifyOnOpenShifts: e.target.checked })}
                      />
                    </div>
                  </div>
                </FormSection>

                <FormSection title="Email Configuration">
                  <p className="text-sm text-muted-foreground">
                    Notifications will be sent via email to <span className="font-medium">{staff.email || 'Not configured'}</span>
                  </p>
                </FormSection>
              </div>
            )}
          </ScrollArea>
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Preferences</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
