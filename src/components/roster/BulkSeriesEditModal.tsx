import { useState, useMemo } from 'react';
import PrimaryOffCanvas from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection } from '@/components/ui/off-canvas/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shift, StaffMember, Room } from '@/types/roster';
import { Clock, MapPin, User, AlertTriangle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface BulkSeriesEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  highlightedRecurrenceGroupId: string;
  shifts: Shift[];
  staff: StaffMember[];
  rooms: Room[];
  onSave: (updates: Partial<Shift>) => void;
}

export function BulkSeriesEditModal({
  open,
  onOpenChange,
  highlightedRecurrenceGroupId,
  shifts,
  staff,
  rooms,
  onSave,
}: BulkSeriesEditModalProps) {
  const seriesShifts = useMemo(() => {
    return shifts.filter(
      s => s.recurring?.recurrenceGroupId === highlightedRecurrenceGroupId
    );
  }, [shifts, highlightedRecurrenceGroupId]);

  const firstShift = seriesShifts[0];
  
  // Form state - only track what should be changed
  const [updateTime, setUpdateTime] = useState(false);
  const [updateRoom, setUpdateRoom] = useState(false);
  const [updateStaff, setUpdateStaff] = useState(false);
  const [updateBreak, setUpdateBreak] = useState(false);
  
  const [startTime, setStartTime] = useState(firstShift?.startTime || '09:00');
  const [endTime, setEndTime] = useState(firstShift?.endTime || '17:00');
  const [roomId, setRoomId] = useState(firstShift?.roomId || '');
  const [staffId, setStaffId] = useState(firstShift?.staffId || '');
  const [breakMinutes, setBreakMinutes] = useState(firstShift?.breakMinutes || 30);

  const seriesInfo = useMemo(() => {
    if (seriesShifts.length === 0) return null;
    
    const staffMember = staff.find(s => s.id === firstShift?.staffId);
    const room = rooms.find(r => r.id === firstShift?.roomId);
    const pattern = firstShift?.recurring?.pattern || 'weekly';
    
    return {
      staffName: staffMember?.name || 'Unassigned',
      roomName: room?.name || 'Unknown',
      shiftCount: seriesShifts.length,
      pattern,
      startTime: firstShift?.startTime,
      endTime: firstShift?.endTime,
    };
  }, [seriesShifts, staff, rooms, firstShift]);

  const handleSave = () => {
    const updates: Partial<Shift> = {};
    
    if (updateTime) {
      updates.startTime = startTime;
      updates.endTime = endTime;
    }
    if (updateRoom) {
      updates.roomId = roomId;
    }
    if (updateStaff) {
      updates.staffId = staffId;
    }
    if (updateBreak) {
      updates.breakMinutes = breakMinutes;
    }
    
    if (Object.keys(updates).length > 0) {
      onSave(updates);
    }
    onOpenChange(false);
  };

  const hasChanges = updateTime || updateRoom || updateStaff || updateBreak;

  if (!seriesInfo) return null;

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={() => onOpenChange(false)}
      title="Edit Recurring Series"
      description={`Apply changes to all ${seriesInfo.shiftCount} shifts in this ${seriesInfo.pattern} series.`}
      icon={RefreshCw}
      size="md"
      actions={[
        { label: 'Cancel', variant: 'secondary', onClick: () => onOpenChange(false) },
        { label: `Update ${seriesInfo.shiftCount} Shifts`, variant: 'primary', onClick: handleSave, disabled: !hasChanges },
      ]}
    >
      <div className="space-y-4">
        {/* Current Series Info */}
        <FormSection title="Current Series Details">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{seriesInfo.staffName}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{seriesInfo.roomName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{seriesInfo.startTime} - {seriesInfo.endTime}</span>
            </div>
            <div>
              <Badge variant="outline" className="capitalize">
                {seriesInfo.pattern}
              </Badge>
            </div>
          </div>
        </FormSection>

        <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
            <div className="text-sm text-warning">
              <strong>Bulk Edit Warning:</strong> Changes will apply to all {seriesInfo.shiftCount} shifts 
              in this series. Toggle only the fields you want to update.
            </div>
          </div>
        </div>

        {/* Edit Options */}
        <FormSection title="Update Options">
          {/* Time Update */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="update-time" className="flex items-center gap-2 cursor-pointer">
                <Clock className="h-4 w-4" />
                Update Shift Times
              </Label>
              <Switch
                id="update-time"
                checked={updateTime}
                onCheckedChange={setUpdateTime}
              />
            </div>
            {updateTime && (
              <div className="grid grid-cols-2 gap-3 pl-6">
                <div>
                  <Label htmlFor="start-time" className="text-xs text-muted-foreground">
                    Start Time
                  </Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="end-time" className="text-xs text-muted-foreground">
                    End Time
                  </Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          {/* Room Update */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="update-room" className="flex items-center gap-2 cursor-pointer">
                <MapPin className="h-4 w-4" />
                Update Room
              </Label>
              <Switch
                id="update-room"
                checked={updateRoom}
                onCheckedChange={setUpdateRoom}
              />
            </div>
            {updateRoom && (
              <div className="pl-6">
                <Select value={roomId} onValueChange={setRoomId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          {/* Staff Update */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="update-staff" className="flex items-center gap-2 cursor-pointer">
                <User className="h-4 w-4" />
                Reassign to Different Staff
              </Label>
              <Switch
                id="update-staff"
                checked={updateStaff}
                onCheckedChange={setUpdateStaff}
              />
            </div>
            {updateStaff && (
              <div className="pl-6">
                <Select value={staffId} onValueChange={setStaffId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} - {s.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          {/* Break Update */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="update-break" className="flex items-center gap-2 cursor-pointer">
                <Clock className="h-4 w-4" />
                Update Break Duration
              </Label>
              <Switch
                id="update-break"
                checked={updateBreak}
                onCheckedChange={setUpdateBreak}
              />
            </div>
            {updateBreak && (
              <div className="pl-6">
                <Select 
                  value={breakMinutes.toString()} 
                  onValueChange={(v) => setBreakMinutes(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select break duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No break</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </FormSection>
      </div>
    </PrimaryOffCanvas>
  );
}
