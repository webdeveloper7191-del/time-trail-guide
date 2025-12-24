import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Shift, Room, ShiftTemplate, defaultShiftTemplates } from '@/types/roster';
import { RosterTemplate, TemplateMatchResult } from '@/types/rosterTemplates';
import { format, addDays, startOfWeek } from 'date-fns';
import { FileStack, Check, Plus, AlertCircle, ArrowRight, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApplyTemplateModalProps {
  open: boolean;
  onClose: () => void;
  rosterTemplates: RosterTemplate[];
  shiftTemplates: ShiftTemplate[];
  existingShifts: Shift[];
  rooms: Room[];
  centreId: string;
  currentDate: Date;
  onApply: (shifts: Omit<Shift, 'id'>[]) => void;
}

export function ApplyTemplateModal({
  open,
  onClose,
  rosterTemplates,
  shiftTemplates,
  existingShifts,
  rooms,
  centreId,
  currentDate,
  onApply
}: ApplyTemplateModalProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [skipExisting, setSkipExisting] = useState(true);
  const [selectedShifts, setSelectedShifts] = useState<Set<string>>(new Set());

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const dates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const selectedTemplate = rosterTemplates.find(t => t.id === selectedTemplateId);

  const matchResults = useMemo((): TemplateMatchResult[] => {
    if (!selectedTemplate) return [];

    return selectedTemplate.shifts.map(templateShift => {
      // Find the actual date for this day of week in the current week
      const targetDate = dates.find(d => d.getDay() === templateShift.dayOfWeek);
      if (!targetDate) {
        return {
          templateShift,
          date: '',
          action: 'skip' as const,
          reason: 'Day not in range'
        };
      }

      const dateStr = format(targetDate, 'yyyy-MM-dd');
      
      // Check for existing shift at same room/time
      const existingShift = existingShifts.find(s => 
        s.centreId === centreId &&
        s.roomId === templateShift.roomId &&
        s.date === dateStr &&
        s.startTime === templateShift.startTime &&
        s.endTime === templateShift.endTime
      );

      if (existingShift) {
        return {
          templateShift,
          existingShift,
          date: dateStr,
          action: skipExisting ? 'skip' as const : 'update' as const,
          reason: 'Shift already exists'
        };
      }

      return {
        templateShift,
        date: dateStr,
        action: 'add' as const
      };
    });
  }, [selectedTemplate, dates, existingShifts, centreId, skipExisting]);

  const shiftsToAdd = matchResults.filter(r => r.action === 'add');
  const shiftsToSkip = matchResults.filter(r => r.action === 'skip');

  const handleApply = () => {
    const newShifts: Omit<Shift, 'id'>[] = matchResults
      .filter(r => r.action === 'add' || (!skipExisting && r.action === 'update'))
      .filter(r => selectedShifts.size === 0 || selectedShifts.has(r.templateShift.id))
      .map(result => ({
        staffId: '',
        centreId,
        roomId: result.templateShift.roomId,
        date: result.date,
        startTime: result.templateShift.startTime,
        endTime: result.templateShift.endTime,
        breakMinutes: result.templateShift.breakMinutes,
        status: 'draft' as const,
        isOpenShift: true,
        notes: result.templateShift.notes,
      }));

    onApply(newShifts);
    onClose();
  };

  const toggleShift = (shiftId: string) => {
    setSelectedShifts(prev => {
      const next = new Set(prev);
      if (next.has(shiftId)) {
        next.delete(shiftId);
      } else {
        next.add(shiftId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedShifts(new Set(shiftsToAdd.map(r => r.templateShift.id)));
  };

  const deselectAll = () => {
    setSelectedShifts(new Set());
  };

  const getRoomName = (roomId: string) => rooms.find(r => r.id === roomId)?.name || roomId;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileStack className="h-5 w-5 text-primary" />
            Apply Roster Template
          </DialogTitle>
          <DialogDescription>
            Apply a saved template to the current week. Existing shifts can be skipped or updated.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="space-y-2">
            <Label>Select Template</Label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a roster template..." />
              </SelectTrigger>
              <SelectContent>
                {rosterTemplates.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No templates saved yet. Save your current roster as a template first.
                  </div>
                ) : (
                  rosterTemplates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        <span>{template.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {template.shifts.length} shifts
                        </Badge>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate && (
            <>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={skipExisting}
                    onCheckedChange={(checked) => setSkipExisting(!!checked)}
                  />
                  Skip existing shifts (don't overwrite)
                </label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={deselectAll}>
                    Deselect All
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <Plus className="h-4 w-4" />
                  <span>{shiftsToAdd.length} to add</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Check className="h-4 w-4" />
                  <span>{shiftsToSkip.length} will be skipped</span>
                </div>
              </div>

              <ScrollArea className="flex-1 border rounded-lg">
                <div className="p-2 space-y-1">
                  {matchResults.map((result, idx) => {
                    const room = rooms.find(r => r.id === result.templateShift.roomId);
                    const isSelected = selectedShifts.size === 0 || selectedShifts.has(result.templateShift.id);
                    
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-md text-sm",
                          result.action === 'add' && "bg-emerald-50 dark:bg-emerald-950/20",
                          result.action === 'skip' && "bg-muted/50 opacity-60"
                        )}
                      >
                        {result.action === 'add' && (
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleShift(result.templateShift.id)}
                          />
                        )}
                        {result.action === 'skip' && (
                          <Check className="h-4 w-4 text-muted-foreground" />
                        )}
                        
                        <div className="flex-1 flex items-center gap-2">
                          <span className="font-medium">{room?.name || 'Unknown'}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {result.date ? format(new Date(result.date), 'EEE, MMM d') : 'N/A'}
                          </span>
                          <span>
                            {result.templateShift.startTime} - {result.templateShift.endTime}
                          </span>
                        </div>

                        <Badge variant={result.action === 'add' ? 'default' : 'secondary'} className="text-xs">
                          {result.action === 'add' ? 'Add' : 'Skip'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </>
          )}

          {!selectedTemplate && rosterTemplates.length > 0 && (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileStack className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>Select a template to preview shifts</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleApply} 
            disabled={!selectedTemplate || shiftsToAdd.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Apply {shiftsToAdd.length} Shifts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
