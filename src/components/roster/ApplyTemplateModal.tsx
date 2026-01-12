import { useState, useMemo } from 'react';
import {
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Chip,
  Box,
  Typography,
  FormControlLabel,
} from '@mui/material';
import { Shift, Room, ShiftTemplate } from '@/types/roster';
import { RosterTemplate, TemplateMatchResult } from '@/types/rosterTemplates';
import { format, addDays, startOfWeek } from 'date-fns';
import { FileStack, Check, Plus, ArrowRight, Layers } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

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

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileStack className="h-5 w-5 text-primary" />
            Apply Roster Template
          </SheetTitle>
          <SheetDescription>
            Apply a saved template to the current week. Existing shifts can be skipped or updated.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 pr-4 mt-6 h-[calc(100vh-260px)]">
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Template</InputLabel>
              <Select
                value={selectedTemplateId}
                label="Select Template"
                onChange={(e) => setSelectedTemplateId(e.target.value)}
              >
                {rosterTemplates.length === 0 ? (
                  <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">
                      No templates saved yet. Save your current roster as a template first.
                    </Typography>
                  </MenuItem>
                ) : (
                  rosterTemplates.map(template => (
                    <MenuItem key={template.id} value={template.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Layers size={16} />
                        <span>{template.name}</span>
                        <Chip size="small" label={`${template.shifts.length} shifts`} />
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Box>

          {selectedTemplate && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={skipExisting}
                      onChange={(e) => setSkipExisting(e.target.checked)}
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">Skip existing shifts (don't overwrite)</Typography>}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="text" size="small" onClick={selectAll}>Select All</Button>
                  <Button variant="text" size="small" onClick={deselectAll}>Deselect All</Button>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main' }}>
                  <Plus size={16} />
                  <Typography variant="body2">{shiftsToAdd.length} to add</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                  <Check size={16} />
                  <Typography variant="body2">{shiftsToSkip.length} will be skipped</Typography>
                </Box>
              </Box>

              <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                {matchResults.map((result, idx) => {
                  const room = rooms.find(r => r.id === result.templateShift.roomId);
                  const isSelected = selectedShifts.size === 0 || selectedShifts.has(result.templateShift.id);
                  
                  return (
                    <Box
                      key={idx}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1.5,
                        borderBottom: idx < matchResults.length - 1 ? 1 : 0,
                        borderColor: 'divider',
                        bgcolor: result.action === 'add' 
                          ? (isSelected ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.06)') 
                          : 'action.hover',
                        opacity: result.action === 'skip' ? 0.6 : 1,
                        transition: 'all 0.15s ease-in-out',
                        cursor: result.action === 'add' ? 'pointer' : 'default',
                        '&:hover': result.action === 'add' ? {
                          bgcolor: 'rgba(34, 197, 94, 0.16)',
                        } : {},
                      }}
                      onClick={() => result.action === 'add' && toggleShift(result.templateShift.id)}
                    >
                      {result.action === 'add' && (
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleShift(result.templateShift.id)}
                          size="small"
                          color="success"
                        />
                      )}
                      {result.action === 'skip' && (
                        <Check size={16} style={{ opacity: 0.5 }} />
                      )}
                      
                      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight={isSelected ? 600 : 500} color={isSelected ? 'success.main' : 'text.primary'}>
                          {room?.name || 'Unknown'}
                        </Typography>
                        <ArrowRight size={12} style={{ opacity: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          {result.date ? format(new Date(result.date), 'EEE, MMM d') : 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                          {result.templateShift.startTime} - {result.templateShift.endTime}
                        </Typography>
                      </Box>

                      <Chip 
                        size="small" 
                        label={result.action === 'add' ? 'Add' : 'Skip'}
                        color={result.action === 'add' ? 'success' : 'default'}
                        variant={result.action === 'add' && isSelected ? 'filled' : 'outlined'}
                      />
                    </Box>
                  );
                })}
              </Box>
            </>
          )}

          {!selectedTemplate && rosterTemplates.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, color: 'text.secondary' }}>
              <FileStack size={48} style={{ opacity: 0.2, marginBottom: 8 }} />
              <Typography variant="body2">Select a template to preview shifts</Typography>
            </Box>
          )}
        </ScrollArea>

        <SheetFooter className="mt-6">
          <Button variant="outlined" onClick={onClose}>Cancel</Button>
          <Button 
            variant="contained"
            onClick={handleApply} 
            disabled={!selectedTemplate || shiftsToAdd.length === 0}
            startIcon={<Plus size={16} />}
          >
            Apply {shiftsToAdd.length} Shifts
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
