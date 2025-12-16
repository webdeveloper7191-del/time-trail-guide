import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      // Remove from avoid if adding to preferred
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
      // Remove from preferred if adding to avoid
      return { 
        ...prev, 
        avoidRooms: [...current, roomId],
        preferredRooms: (prev.preferredRooms || []).filter(id => id !== roomId)
      };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Scheduling Preferences
          </DialogTitle>
          <DialogDescription>
            Configure scheduling preferences for {staff.name}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <Tabs defaultValue="schedule" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="rooms">Rooms</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="schedule" className="space-y-6 mt-4">
              {/* Max Consecutive Days */}
              <div className="space-y-3">
                <Label className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Max Consecutive Work Days
                  </span>
                  <Badge variant="secondary">{preferences.maxConsecutiveDays} days</Badge>
                </Label>
                <Slider
                  value={[preferences.maxConsecutiveDays]}
                  onValueChange={([v]) => setPreferences({ ...preferences, maxConsecutiveDays: v })}
                  min={3}
                  max={7}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum number of days in a row this staff can work
                </p>
              </div>

              {/* Min Rest Hours */}
              <div className="space-y-3">
                <Label className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BedDouble className="h-4 w-4 text-primary" />
                    Minimum Rest Between Shifts
                  </span>
                  <Badge variant="secondary">{preferences.minRestHoursBetweenShifts}h</Badge>
                </Label>
                <Slider
                  value={[preferences.minRestHoursBetweenShifts]}
                  onValueChange={([v]) => setPreferences({ ...preferences, minRestHoursBetweenShifts: v })}
                  min={8}
                  max={14}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum hours of rest required between consecutive shifts
                </p>
              </div>

              {/* Max Shifts Per Week */}
              <div className="space-y-3">
                <Label className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Max Shifts Per Week
                  </span>
                  <Badge variant="secondary">{preferences.maxShiftsPerWeek} shifts</Badge>
                </Label>
                <Slider
                  value={[preferences.maxShiftsPerWeek]}
                  onValueChange={([v]) => setPreferences({ ...preferences, maxShiftsPerWeek: v })}
                  min={3}
                  max={7}
                  step={1}
                />
              </div>

              {/* Shift Time Preferences */}
              <Card className="bg-muted/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Shift Time Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="preferEarly" className="flex items-center gap-2">
                      <Sun className="h-4 w-4 text-amber-500" />
                      Prefer Early Shifts (6:30 AM - 2:30 PM)
                    </Label>
                    <Switch
                      id="preferEarly"
                      checked={preferences.preferEarlyShifts}
                      onCheckedChange={(checked) => setPreferences({ 
                        ...preferences, 
                        preferEarlyShifts: checked,
                        preferLateShifts: checked ? false : preferences.preferLateShifts
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="preferLate" className="flex items-center gap-2">
                      <Moon className="h-4 w-4 text-indigo-500" />
                      Prefer Late Shifts (10:30 AM - 6:30 PM)
                    </Label>
                    <Switch
                      id="preferLate"
                      checked={preferences.preferLateShifts}
                      onCheckedChange={(checked) => setPreferences({ 
                        ...preferences, 
                        preferLateShifts: checked,
                        preferEarlyShifts: checked ? false : preferences.preferEarlyShifts
                      })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rooms" className="space-y-4 mt-4">
              {/* Preferred Rooms */}
              <Card className="bg-emerald-500/5 border-emerald-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Heart className="h-4 w-4 text-emerald-500" />
                    Preferred Rooms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {allRooms.map(room => (
                      <div
                        key={room.id}
                        className={cn(
                          "flex items-center space-x-2 p-2 rounded-md border cursor-pointer transition-colors",
                          preferences.preferredRooms?.includes(room.id)
                            ? "bg-emerald-500/10 border-emerald-500"
                            : "bg-background hover:bg-muted"
                        )}
                        onClick={() => togglePreferredRoom(room.id)}
                      >
                        <Checkbox 
                          checked={preferences.preferredRooms?.includes(room.id)}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{room.name}</p>
                          <p className="text-xs text-muted-foreground">{room.ageGroup}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Rooms to Avoid */}
              <Card className="bg-destructive/5 border-destructive/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Ban className="h-4 w-4 text-destructive" />
                    Rooms to Avoid
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                          className="data-[state=checked]:bg-destructive"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{room.name}</p>
                          <p className="text-xs text-muted-foreground">{room.ageGroup}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4 mt-4">
              <Card className="bg-muted/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notifyPublish">Shift Published</Label>
                      <p className="text-xs text-muted-foreground">
                        Notify when new shifts are published
                      </p>
                    </div>
                    <Switch
                      id="notifyPublish"
                      checked={preferences.notifyOnPublish}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, notifyOnPublish: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notifySwap">Shift Swapped</Label>
                      <p className="text-xs text-muted-foreground">
                        Notify when shifts are swapped
                      </p>
                    </div>
                    <Switch
                      id="notifySwap"
                      checked={preferences.notifyOnSwap}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, notifyOnSwap: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notifyOpen">Open Shifts Available</Label>
                      <p className="text-xs text-muted-foreground">
                        Notify about new open shifts
                      </p>
                    </div>
                    <Switch
                      id="notifyOpen"
                      checked={preferences.notifyOnOpenShifts}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, notifyOnOpenShifts: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  <Bell className="h-4 w-4 inline mr-2" />
                  Notifications will be sent via email to <span className="font-medium">{staff.email || 'Not configured'}</span>
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Preferences</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
