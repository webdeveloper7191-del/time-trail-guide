import { useState, useMemo } from 'react';
import {
  Chip,
  Box,
  Typography,
} from '@mui/material';
import { Checkbox } from '@/components/ui/checkbox';
import { Shift, Room, StaffMember, ShiftTemplate, defaultShiftTemplates, roleLabels } from '@/types/roster';
import { format } from 'date-fns';
import { Users, Calendar, Clock, Plus, Check, AlertTriangle, UserPlus } from 'lucide-react';
import PrimaryOffCanvas, { OffCanvasAction } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection, FormField, FormRow } from '@/components/ui/off-canvas/FormSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [activeTab, setActiveTab] = useState('staff');
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
    setActiveTab('staff');
  };

  const toggleStaff = (staffId: string) => {
    setSelectedStaff(prev => {
      const next = new Set(prev);
      if (next.has(staffId)) next.delete(staffId);
      else next.add(staffId);
      return next;
    });
  };

  const toggleDate = (date: string) => {
    setSelectedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  const selectAllStaff = () => setSelectedStaff(new Set(availableStaff.map(s => s.id)));
  const deselectAllStaff = () => setSelectedStaff(new Set());
  const selectAllDates = () => setSelectedDates(new Set(dates.map(d => format(d, 'yyyy-MM-dd'))));
  const deselectAllDates = () => setSelectedDates(new Set());

  const getStaffName = (staffId: string) => staff.find(s => s.id === staffId)?.name || staffId;

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const actions: OffCanvasAction[] = [
    {
      label: 'Cancel',
      variant: 'outlined',
      onClick: handleClose,
    },
    {
      label: `Create ${shiftsWithoutConflicts.length} Shifts`,
      variant: 'primary',
      onClick: handleAssign,
      disabled: shiftsWithoutConflicts.length === 0,
      icon: <Plus size={16} />,
    },
  ];

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={handleClose}
      title="Bulk Shift Assignment"
      description="Create multiple shifts at once by selecting staff, dates, and shift template"
      icon={UserPlus}
      size="lg"
      actions={actions}
    >
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="staff" className="flex items-center gap-1.5">
              <Users size={14} />Staff ({selectedStaff.size})
            </TabsTrigger>
            <TabsTrigger value="dates" className="flex items-center gap-1.5">
              <Calendar size={14} />Dates ({selectedDates.size})
            </TabsTrigger>
            <TabsTrigger value="shift" className="flex items-center gap-1.5">
              <Clock size={14} />Shift
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-1.5">
              <Check size={14} />Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="staff" className="mt-4">
            <FormSection title="Select Staff Members">
              <div className="flex items-center justify-end gap-2 mb-3">
                <button onClick={selectAllStaff} className="text-xs text-primary hover:underline">Select All</button>
                <button onClick={deselectAllStaff} className="text-xs text-muted-foreground hover:underline">Clear</button>
              </div>
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {availableStaff.map(member => {
                  const isSelected = selectedStaff.has(member.id);
                  return (
                    <div
                      key={member.id}
                      onClick={() => toggleStaff(member.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                        isSelected 
                          ? "border-primary bg-primary/5" 
                          : "border-border bg-background hover:border-primary/50"
                      )}
                    >
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleStaff(member.id)} />
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                        style={{ backgroundColor: member.color }}
                      >
                        {member.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className={cn("text-sm", isSelected ? "font-semibold text-primary" : "text-foreground")}>
                          {member.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {roleLabels[member.role]} • {member.currentWeeklyHours}/{member.maxHoursPerWeek}h
                        </p>
                      </div>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full border",
                        isSelected ? "border-primary text-primary" : "border-border text-muted-foreground"
                      )}>
                        ${member.hourlyRate}/hr
                      </span>
                    </div>
                  );
                })}
              </div>
            </FormSection>
          </TabsContent>

          <TabsContent value="dates" className="mt-4">
            <FormSection title="Select Dates">
              <div className="flex items-center justify-end gap-2 mb-3">
                <button onClick={selectAllDates} className="text-xs text-primary hover:underline">Select All</button>
                <button onClick={deselectAllDates} className="text-xs text-muted-foreground hover:underline">Clear</button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {dates.map(date => {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const isSelected = selectedDates.has(dateStr);
                  return (
                    <div
                      key={dateStr}
                      onClick={() => toggleDate(dateStr)}
                      className={cn(
                        "flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-all",
                        isSelected 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <span className={cn("text-xs", isSelected ? "text-primary" : "text-muted-foreground")}>
                        {format(date, 'EEE')}
                      </span>
                      <span className={cn("text-lg font-semibold", isSelected ? "text-primary" : "text-foreground")}>
                        {format(date, 'd')}
                      </span>
                      <span className={cn("text-xs", isSelected ? "text-primary" : "text-muted-foreground")}>
                        {format(date, 'MMM')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </FormSection>
          </TabsContent>

          <TabsContent value="shift" className="mt-4 space-y-4">
            <FormSection title="Room & Template">
              <FormField label="Room" required>
                <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room..." />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map(room => (
                      <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Shift Template" required>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: template.color }} />
                          <span>{template.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({template.startTime} - {template.endTime})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </FormSection>

            <FormSection title="Assignment Mode">
              <div className="grid grid-cols-2 gap-3">
                {(['all-to-all', 'round-robin'] as const).map(mode => {
                  const isSelected = assignmentMode === mode;
                  return (
                    <div
                      key={mode}
                      onClick={() => setAssignmentMode(mode)}
                      className={cn(
                        "p-3 rounded-lg border-2 cursor-pointer transition-all",
                        isSelected 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <p className={cn("text-sm font-medium", isSelected ? "text-primary" : "text-foreground")}>
                        {mode === 'all-to-all' ? 'All to All' : 'Round Robin'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {mode === 'all-to-all' 
                          ? 'Every staff gets a shift on every date'
                          : 'Distribute dates evenly among staff'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </FormSection>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <FormSection title="Preview Shifts">
              {previewShifts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Users size={48} className="opacity-20 mb-2" />
                  <p className="text-sm">Select staff, dates, and shift template to preview</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1.5 text-primary">
                      <Plus size={16} />
                      <span className="text-sm font-medium">{shiftsWithoutConflicts.length} shifts to create</span>
                    </div>
                    {previewShifts.some(s => s.hasConflict) && (
                      <div className="flex items-center gap-1.5 text-destructive">
                        <AlertTriangle size={16} />
                        <span className="text-sm">{previewShifts.filter(s => s.hasConflict).length} conflicts</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="rounded-lg border overflow-hidden">
                    <div className="grid grid-cols-[32px_1fr_24px_1fr_100px] items-center gap-3 p-3 bg-muted/50 border-b">
                      <div />
                      <span className="text-xs font-semibold">Staff Member</span>
                      <div />
                      <span className="text-xs font-semibold">Date</span>
                      <span className="text-xs font-semibold text-right">Status</span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {previewShifts.map((preview, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "grid grid-cols-[32px_1fr_24px_1fr_100px] items-center gap-3 p-3 border-b last:border-0",
                            preview.hasConflict ? "bg-destructive/5" : "bg-background"
                          )}
                        >
                          <div className="flex items-center justify-center">
                            {preview.hasConflict ? (
                              <AlertTriangle size={16} className="text-destructive" />
                            ) : (
                              <Check size={16} className="text-primary" />
                            )}
                          </div>
                          <span className="text-sm font-medium truncate">{getStaffName(preview.staffId)}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-sm text-muted-foreground">{format(new Date(preview.date), 'EEE, MMM d')}</span>
                          <span className={cn(
                            "text-xs px-2 py-1 rounded-full text-right",
                            preview.hasConflict 
                              ? "bg-destructive/10 text-destructive" 
                              : "bg-primary/10 text-primary"
                          )}>
                            {preview.hasConflict ? 'Conflict' : 'Will Add'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </FormSection>
          </TabsContent>
        </Tabs>
      </div>
    </PrimaryOffCanvas>
  );
}
