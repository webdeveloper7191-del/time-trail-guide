import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Box,
  Switch as MuiSwitch,
  Slider as MuiSlider,
  Checkbox as MuiCheckbox,
  Typography,
  FormControlLabel,
} from '@mui/material';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <User className="h-5 w-5 text-primary" />
        Scheduling Preferences
      </DialogTitle>
      <Typography variant="body2" color="text.secondary" sx={{ px: 3, pb: 1 }}>
        Configure scheduling preferences for {staff.name}
      </Typography>

      <DialogContent dividers>
        <ScrollArea className="max-h-[60vh]">
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Schedule" />
            <Tab label="Rooms" />
            <Tab label="Notifications" />
          </Tabs>

          {/* Schedule Tab */}
          {tabValue === 0 && (
            <Box sx={{ mt: 3 }} className="space-y-6">
              {/* Max Consecutive Days */}
              <div className="space-y-3">
                <Label className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Max Consecutive Work Days
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
                <MuiSlider
                  value={preferences.maxShiftsPerWeek}
                  onChange={(_, v) => setPreferences({ ...preferences, maxShiftsPerWeek: v as number })}
                  min={3}
                  max={7}
                  step={1}
                  marks
                  valueLabelDisplay="auto"
                />
              </div>

              {/* Shift Time Preferences */}
              <Card className="bg-muted/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Shift Time Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Sun className="h-4 w-4 text-amber-500" />
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
                      <Moon className="h-4 w-4 text-indigo-500" />
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
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Rooms Tab */}
          {tabValue === 1 && (
            <Box sx={{ mt: 3 }} className="space-y-4">
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
                        <MuiCheckbox 
                          checked={preferences.preferredRooms?.includes(room.id)}
                          size="small"
                          sx={{ '&.Mui-checked': { color: '#10b981' } }}
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
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Notifications Tab */}
          {tabValue === 2 && (
            <Box sx={{ mt: 3 }} className="space-y-4">
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
                </CardContent>
              </Card>

              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  <Bell className="h-4 w-4 inline mr-2" />
                  Notifications will be sent via email to <span className="font-medium">{staff.email || 'Not configured'}</span>
                </p>
              </div>
            </Box>
          )}
        </ScrollArea>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>Save Preferences</Button>
      </DialogActions>
    </Dialog>
  );
}