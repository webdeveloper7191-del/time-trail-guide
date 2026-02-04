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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'hsl(var(--primary))' }}>
                  <Plus size={16} />
                  <Typography variant="body2" fontWeight={500}>{shiftsToAdd.length} to add</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                  <Check size={16} />
                  <Typography variant="body2">{shiftsToSkip.length} will be skipped</Typography>
                </Box>
              </Box>

              {/* Table header */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: '32px 1fr 24px 120px 100px 80px', 
                alignItems: 'center', 
                gap: 1.5,
                p: 1.5,
                bgcolor: 'grey.100',
                borderRadius: '8px 8px 0 0',
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}>
                <Box />
                <Typography variant="caption" fontWeight={600} color="text.primary">Room</Typography>
                <Box />
                <Typography variant="caption" fontWeight={600} color="text.primary">Date</Typography>
                <Typography variant="caption" fontWeight={600} color="text.primary">Time</Typography>
                <Typography variant="caption" fontWeight={600} color="text.primary" textAlign="right">Status</Typography>
              </Box>

              <Box sx={{ 
                border: 1, 
                borderColor: 'divider',
                borderTop: 0,
                borderRadius: '0 0 8px 8px',
                bgcolor: 'background.paper',
                overflow: 'hidden',
              }}>
                {matchResults.map((result, idx) => {
                  const room = rooms.find(r => r.id === result.templateShift.roomId);
                  const isSelected = selectedShifts.size === 0 || selectedShifts.has(result.templateShift.id);
                  
                  return (
                    <Box
                      key={idx}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '32px 1fr 24px 120px 100px 80px',
                        alignItems: 'center',
                        gap: 1.5,
                        p: 1.5,
                        bgcolor: result.action === 'skip' 
                          ? 'grey.50' 
                          : (isSelected ? 'rgba(3, 169, 244, 0.06)' : 'background.paper'),
                        opacity: result.action === 'skip' ? 0.6 : 1,
                        borderBottom: idx < matchResults.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                        transition: 'all 0.15s ease-in-out',
                        cursor: result.action === 'add' ? 'pointer' : 'default',
                        '&:hover': result.action === 'add' ? {
                          bgcolor: 'rgba(3, 169, 244, 0.08)',
                        } : {},
                      }}
                      onClick={() => result.action === 'add' && toggleShift(result.templateShift.id)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {result.action === 'add' ? (
                          <Checkbox
                            checked={isSelected}
                            onChange={() => toggleShift(result.templateShift.id)}
                            size="small"
                            sx={{ 
                              p: 0,
                              '&.Mui-checked': { color: 'hsl(var(--primary))' }
                            }}
                          />
                        ) : (
                          <Check size={16} style={{ opacity: 0.4, color: 'var(--muted-foreground)' }} />
                        )}
                      </Box>
                      
                      <Typography 
                        variant="body2" 
                        fontWeight={500} 
                        color={isSelected && result.action === 'add' ? 'primary.main' : 'text.primary'}
                      >
                        {room?.name || 'Unknown'}
                      </Typography>
                      <ArrowRight size={12} style={{ opacity: 0.4, color: 'var(--muted-foreground)' }} />
                      <Typography variant="body2" color="text.primary">
                        {result.date ? format(new Date(result.date), 'EEE, MMM d') : 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {result.templateShift.startTime} - {result.templateShift.endTime}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Chip 
                          size="small" 
                          label={result.action === 'add' ? 'Add' : 'Skip'}
                          sx={{ 
                            height: 24,
                            borderRadius: '6px',
                            fontWeight: 500,
                            fontSize: '0.7rem',
                            bgcolor: result.action === 'add' && isSelected 
                              ? 'hsl(var(--primary))' 
                              : (result.action === 'add' ? 'rgba(3, 169, 244, 0.12)' : 'grey.200'),
                            color: result.action === 'add' && isSelected 
                              ? 'white' 
                              : (result.action === 'add' ? 'hsl(var(--primary))' : 'text.secondary'),
                            border: result.action === 'add' && !isSelected ? '1px solid rgba(3, 169, 244, 0.3)' : 'none',
                          }}
                        />
                      </Box>
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
