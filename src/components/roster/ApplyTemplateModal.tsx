import { useState, useMemo } from 'react';
import { Shift, Room, ShiftTemplate } from '@/types/roster';
import { RosterTemplate, TemplateMatchResult } from '@/types/rosterTemplates';
import { format, addDays, startOfWeek } from 'date-fns';
import { FileStack, Check, Plus, ArrowRight, Layers } from 'lucide-react';
import PrimaryOffCanvas, { OffCanvasAction } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { FormSection, FormField } from '@/components/ui/off-canvas/FormSection';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
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
      
      // Only skip if there's an exactly matching OPEN shift (same room, date, time)
      // This allows adding template shifts even if staff shifts exist at same time/place
      const existingShift = skipExisting ? existingShifts.find(s => {
        // Be defensive: treat a shift as "open" only if it's truly unassigned.
        // Some flows may accidentally set isOpenShift=true on assigned shifts.
        const isTrulyOpen = !s.staffId;

        return (
          s.centreId === centreId &&
          s.roomId === templateShift.roomId &&
          s.date === dateStr &&
          s.startTime === templateShift.startTime &&
          s.endTime === templateShift.endTime &&
          isTrulyOpen
        );
      }) : undefined;

      if (existingShift) {
        return {
          templateShift,
          existingShift,
          date: dateStr,
          action: 'skip' as const,
          reason: 'Open shift already exists'
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

  return (
    <PrimaryOffCanvas
      open={open}
      onClose={onClose}
      title="Apply Roster Template"
      description="Apply a saved template to the current week"
      icon={FileStack}
      size="lg"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'outlined' },
        { 
          label: `Apply ${shiftsToAdd.length} Shifts`, 
          onClick: handleApply, 
          variant: 'primary',
          disabled: !selectedTemplate || shiftsToAdd.length === 0,
          icon: <Plus size={16} />
        },
      ]}
    >
      <div className="space-y-5">
        {/* Template Selection */}
        <FormSection title="Select Template">
          <FormField label="Template" required tooltip="Choose a saved roster template to apply">
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger className="bg-background h-11">
                <SelectValue placeholder="Select a template..." />
              </SelectTrigger>
              <SelectContent>
                {rosterTemplates.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                    No templates saved yet
                  </div>
                ) : (
                  rosterTemplates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <Layers size={14} className="text-primary" />
                        <span>{template.name}</span>
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {template.shifts.length} shifts
                        </Badge>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </FormField>
        </FormSection>

        {selectedTemplate && (
          <>
            {/* Options */}
            <FormSection title="Options">
              <div className="flex items-center justify-between bg-background rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={skipExisting}
                    onCheckedChange={(checked) => setSkipExisting(checked as boolean)}
                  />
                  <span className="text-sm">Skip existing shifts (don't overwrite)</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll}>Select All</Button>
                  <Button variant="ghost" size="sm" onClick={deselectAll}>Deselect All</Button>
                </div>
              </div>
            </FormSection>

            {/* Summary */}
            <FormSection title="Preview">
              <div className="flex items-center gap-4 p-4 bg-background border rounded-lg">
                <div className="flex items-center gap-1.5 text-primary">
                  <Plus size={16} />
                  <span className="text-sm font-medium">{shiftsToAdd.length} to add</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Check size={16} />
                  <span className="text-sm">{shiftsToSkip.length} will be skipped</span>
                </div>
              </div>
            </FormSection>

            {/* Shifts Table */}
            <FormSection title="Shifts to Apply">
              <div className="bg-background rounded-lg border overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-[32px_1fr_24px_120px_100px_80px] items-center gap-3 px-4 py-2 bg-muted/50 border-b">
                  <div />
                  <span className="text-xs font-medium text-muted-foreground">Room</span>
                  <div />
                  <span className="text-xs font-medium text-muted-foreground">Date</span>
                  <span className="text-xs font-medium text-muted-foreground">Time</span>
                  <span className="text-xs font-medium text-muted-foreground text-right">Status</span>
                </div>
                
                <ScrollArea className="h-64">
                  <div className="divide-y divide-border">
                    {matchResults.map((result, idx) => {
                      const room = rooms.find(r => r.id === result.templateShift.roomId);
                      const isSelected = selectedShifts.size === 0 || selectedShifts.has(result.templateShift.id);
                      
                      return (
                        <div
                          key={idx}
                          onClick={() => result.action === 'add' && toggleShift(result.templateShift.id)}
                          className={cn(
                            "grid grid-cols-[32px_1fr_24px_120px_100px_80px] items-center gap-3 px-4 py-3 transition-all",
                            result.action === 'skip' ? "opacity-60" : "cursor-pointer hover:bg-primary/5",
                            result.action === 'add' && isSelected && "bg-primary/5"
                          )}
                        >
                          <div className="flex items-center justify-center">
                            {result.action === 'add' ? (
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleShift(result.templateShift.id)}
                                className="border-primary data-[state=checked]:bg-primary"
                              />
                            ) : (
                              <Check size={16} className="text-muted-foreground/40" />
                            )}
                          </div>
                          
                          <span className={cn(
                            "text-sm font-medium",
                            isSelected && result.action === 'add' ? "text-primary" : "text-foreground"
                          )}>
                            {room?.name || 'Unknown'}
                          </span>
                          <ArrowRight size={12} className="text-muted-foreground/40" />
                          <span className="text-sm">
                            {result.date ? format(new Date(result.date), 'EEE, MMM d') : 'N/A'}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {result.templateShift.startTime} - {result.templateShift.endTime}
                          </span>
                          <div className="flex justify-end">
                            <Badge 
                              variant={result.action === 'add' && isSelected ? 'default' : 'secondary'}
                              className={cn(
                                "text-xs",
                                result.action === 'add' && isSelected && "bg-primary text-primary-foreground"
                              )}
                            >
                              {result.action === 'add' ? 'Add' : 'Skip'}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </FormSection>
          </>
        )}

        {!selectedTemplate && rosterTemplates.length > 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-background rounded-lg border">
            <FileStack size={48} className="opacity-20 mb-2" />
            <p className="text-sm">Select a template to preview shifts</p>
          </div>
        )}
      </div>
    </PrimaryOffCanvas>
  );
}
