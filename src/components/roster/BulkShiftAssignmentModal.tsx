import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Shift, Room, StaffMember, ShiftTemplate, defaultShiftTemplates, roleLabels } from '@/types/roster';
import { format } from 'date-fns';
import { Users, Calendar, Clock, Plus, Check, AlertTriangle, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkShiftAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  staff: StaffMember[];
  rooms: Room[];
  dates: Date[];
  centreId: string;
  shiftTemplates: ShiftTemplate[];
  existingShifts: Shift[];
  onAssign: (shifts: Omit<Shift, 'id'>[]) => void;
}

export function BulkShiftAssignmentModal({
  open,
  onClose,
  staff,
  rooms,
  dates,
  centreId,
  shiftTemplates,
  existingShifts,
  onAssign
}: BulkShiftAssignmentModalProps) {
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [assignmentMode, setAssignmentMode] = useState<'all-to-all' | 'round-robin'>('all-to-all');

  const allTemplates = [...defaultShiftTemplates, ...shiftTemplates];
  const selectedTemplate = allTemplates.find(t => t.id === selectedTemplateId);

  const availableStaff = useMemo(() => {
    return staff.filter(s => 
      s.preferredCentres.includes(centreId) || s.preferredCentres.length === 0
    );
  }, [staff, centreId]);

  const previewShifts = useMemo(() => {
    if (!selectedRoomId || !selectedTemplate || selectedStaff.size === 0 || selectedDates.size === 0) {
      return [];
    }

    const staffArray = Array.from(selectedStaff);
    const dateArray = Array.from(selectedDates);
    const shifts: { staffId: string; date: string; hasConflict: boolean }[] = [];

    if (assignmentMode === 'all-to-all') {
      // Every staff member gets a shift on every selected date
      for (const date of dateArray) {
        for (const staffId of staffArray) {
          const hasConflict = existingShifts.some(s => 
            s.staffId === staffId && 
            s.date === date &&
            s.roomId === selectedRoomId
          );
          shifts.push({ staffId, date, hasConflict });
        }
      }
    } else {
      // Round-robin: distribute dates among staff
      dateArray.forEach((date, idx) => {
        const staffId = staffArray[idx % staffArray.length];
        const hasConflict = existingShifts.some(s => 
          s.staffId === staffId && 
          s.date === date &&
          s.roomId === selectedRoomId
        );
        shifts.push({ staffId, date, hasConflict });
      });
    }

    return shifts;
  }, [selectedStaff, selectedDates, selectedRoomId, selectedTemplate, assignmentMode, existingShifts]);

  const shiftsWithoutConflicts = previewShifts.filter(s => !s.hasConflict);

  const handleAssign = () => {
    if (!selectedTemplate) return;

    const newShifts: Omit<Shift, 'id'>[] = shiftsWithoutConflicts.map(preview => ({
      staffId: preview.staffId,
      centreId,
      roomId: selectedRoomId,
      date: preview.date,
      startTime: selectedTemplate.startTime,
      endTime: selectedTemplate.endTime,
      breakMinutes: selectedTemplate.breakMinutes,
      status: 'draft',
      isOpenShift: false,
    }));

    onAssign(newShifts);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setSelectedStaff(new Set());
    setSelectedDates(new Set());
    setSelectedRoomId('');
    setSelectedTemplateId('');
  };

  const toggleStaff = (staffId: string) => {
    setSelectedStaff(prev => {
      const next = new Set(prev);
      if (next.has(staffId)) {
        next.delete(staffId);
      } else {
        next.add(staffId);
      }
      return next;
    });
  };

  const toggleDate = (date: string) => {
    setSelectedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  const selectAllStaff = () => setSelectedStaff(new Set(availableStaff.map(s => s.id)));
  const deselectAllStaff = () => setSelectedStaff(new Set());
  const selectAllDates = () => setSelectedDates(new Set(dates.map(d => format(d, 'yyyy-MM-dd'))));
  const deselectAllDates = () => setSelectedDates(new Set());

  const getStaffName = (staffId: string) => staff.find(s => s.id === staffId)?.name || staffId;

  return (
    <Dialog open={open} onOpenChange={() => { onClose(); resetForm(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Bulk Shift Assignment
          </DialogTitle>
          <DialogDescription>
            Assign multiple staff members to shifts across multiple days at once
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="staff" className="h-full flex flex-col">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="staff" className="text-xs">
                <Users className="h-3.5 w-3.5 mr-1" />
                Staff ({selectedStaff.size})
              </TabsTrigger>
              <TabsTrigger value="dates" className="text-xs">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                Dates ({selectedDates.size})
              </TabsTrigger>
              <TabsTrigger value="shift" className="text-xs">
                <Clock className="h-3.5 w-3.5 mr-1" />
                Shift
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-xs">
                <Check className="h-3.5 w-3.5 mr-1" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="staff" className="flex-1 overflow-hidden mt-4">
              <div className="flex items-center justify-between mb-2">
                <Label>Select Staff Members</Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAllStaff}>Select All</Button>
                  <Button variant="ghost" size="sm" onClick={deselectAllStaff}>Clear</Button>
                </div>
              </div>
              <ScrollArea className="h-[300px] border rounded-lg">
                <div className="p-2 space-y-1">
                  {availableStaff.map(member => (
                    <label
                      key={member.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted/50",
                        selectedStaff.has(member.id) && "bg-primary/10"
                      )}
                    >
                      <Checkbox
                        checked={selectedStaff.has(member.id)}
                        onCheckedChange={() => toggleStaff(member.id)}
                      />
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                        style={{ backgroundColor: member.color }}
                      >
                        {member.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{member.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {roleLabels[member.role]} • {member.currentWeeklyHours}/{member.maxHoursPerWeek}h
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        ${member.hourlyRate}/hr
                      </Badge>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="dates" className="flex-1 overflow-hidden mt-4">
              <div className="flex items-center justify-between mb-2">
                <Label>Select Dates</Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAllDates}>Select All</Button>
                  <Button variant="ghost" size="sm" onClick={deselectAllDates}>Clear</Button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {dates.map(date => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const isSelected = selectedDates.has(dateStr);
                  return (
                    <label
                      key={dateStr}
                      className={cn(
                        "flex flex-col items-center p-3 rounded-lg border cursor-pointer hover:bg-muted/50",
                        isSelected && "bg-primary/10 border-primary"
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleDate(dateStr)}
                        className="sr-only"
                      />
                      <span className="text-xs text-muted-foreground">{format(date, 'EEE')}</span>
                      <span className="text-lg font-semibold">{format(date, 'd')}</span>
                      <span className="text-xs text-muted-foreground">{format(date, 'MMM')}</span>
                    </label>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="shift" className="flex-1 overflow-hidden mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Room</Label>
                <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a room..." />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map(room => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Shift Template</Label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a shift template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-3 w-3 rounded-full" 
                            style={{ backgroundColor: template.color }}
                          />
                          <span>{template.name}</span>
                          <span className="text-muted-foreground">
                            ({template.startTime} - {template.endTime})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assignment Mode</Label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={cn(
                      "flex flex-col p-3 rounded-lg border cursor-pointer hover:bg-muted/50",
                      assignmentMode === 'all-to-all' && "bg-primary/10 border-primary"
                    )}
                  >
                    <input
                      type="radio"
                      name="mode"
                      checked={assignmentMode === 'all-to-all'}
                      onChange={() => setAssignmentMode('all-to-all')}
                      className="sr-only"
                    />
                    <span className="font-medium text-sm">All to All</span>
                    <span className="text-xs text-muted-foreground">
                      Every staff member gets a shift on every selected date
                    </span>
                  </label>
                  <label
                    className={cn(
                      "flex flex-col p-3 rounded-lg border cursor-pointer hover:bg-muted/50",
                      assignmentMode === 'round-robin' && "bg-primary/10 border-primary"
                    )}
                  >
                    <input
                      type="radio"
                      name="mode"
                      checked={assignmentMode === 'round-robin'}
                      onChange={() => setAssignmentMode('round-robin')}
                      className="sr-only"
                    />
                    <span className="font-medium text-sm">Round Robin</span>
                    <span className="text-xs text-muted-foreground">
                      Distribute dates evenly among selected staff
                    </span>
                  </label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 overflow-hidden mt-4">
              {previewShifts.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>Select staff, dates, and shift template to preview</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-2 text-sm">
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <Plus className="h-4 w-4" />
                      <span>{shiftsWithoutConflicts.length} shifts to create</span>
                    </div>
                    {previewShifts.some(s => s.hasConflict) && (
                      <div className="flex items-center gap-1.5 text-amber-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{previewShifts.filter(s => s.hasConflict).length} conflicts (will be skipped)</span>
                      </div>
                    )}
                  </div>
                  <ScrollArea className="h-[260px] border rounded-lg">
                    <div className="p-2 space-y-1">
                      {previewShifts.map((preview, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-md text-sm",
                            preview.hasConflict 
                              ? "bg-amber-50 dark:bg-amber-950/20 opacity-60" 
                              : "bg-emerald-50 dark:bg-emerald-950/20"
                          )}
                        >
                          {preview.hasConflict ? (
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                          ) : (
                            <Check className="h-4 w-4 text-emerald-600" />
                          )}
                          <span className="font-medium">{getStaffName(preview.staffId)}</span>
                          <span className="text-muted-foreground">→</span>
                          <span>{format(new Date(preview.date), 'EEE, MMM d')}</span>
                          {selectedTemplate && (
                            <span className="text-muted-foreground">
                              {selectedTemplate.startTime} - {selectedTemplate.endTime}
                            </span>
                          )}
                          <Badge 
                            variant={preview.hasConflict ? 'outline' : 'default'} 
                            className="ml-auto text-xs"
                          >
                            {preview.hasConflict ? 'Conflict' : 'Will Add'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { onClose(); resetForm(); }}>Cancel</Button>
          <Button 
            onClick={handleAssign} 
            disabled={shiftsWithoutConflicts.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create {shiftsWithoutConflicts.length} Shifts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
