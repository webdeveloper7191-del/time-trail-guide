import { useState, useMemo } from 'react';
import {
  Button,
  TextField,
  Card,
  CardContent,
  Stack,
  Box,
  Typography,
  Chip,
  IconButton,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Plus,
  Trash2,
  Save,
  Calendar,
  Clock,
  FileSpreadsheet,
  Download,
  Upload,
  Copy,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';
import PrimaryOffCanvas, { OffCanvasAction } from '@/components/ui/off-canvas/PrimaryOffCanvas';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, addDays, startOfWeek, parse } from 'date-fns';
import { Centre, Room } from '@/types/roster';
import { ManualDemandEntry, useDemand } from '@/contexts/DemandContext';
import { z } from 'zod';

interface DemandDataEntryModalProps {
  open: boolean;
  onClose: () => void;
  centre: Centre;
  currentDate: Date;
}

const demandEntrySchema = z.object({
  expectedDemand: z.number().min(0).max(999),
  notes: z.string().max(500).optional(),
});

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function DemandDataEntryModal({
  open,
  onClose,
  centre,
  currentDate,
}: DemandDataEntryModalProps) {
  const { 
    settings, 
    manualEntries, 
    addManualEntry, 
    updateManualEntry, 
    deleteManualEntry,
    bulkAddManualEntries,
    getTimeSlots,
    getThresholdForDemand,
    getActivePatterns,
  } = useDemand();

  const [selectedRoom, setSelectedRoom] = useState<string>(centre.rooms[0]?.id || '');
  const [weekStart, setWeekStart] = useState(() => startOfWeek(currentDate, { weekStartsOn: 1 }));
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [bulkValue, setBulkValue] = useState('');
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());

  const timeSlots = useMemo(() => getTimeSlots(), [getTimeSlots]);
  
  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const selectedRoomData = centre.rooms.find(r => r.id === selectedRoom);

  // Get entries for the current view
  const entriesMap = useMemo(() => {
    const map = new Map<string, ManualDemandEntry>();
    manualEntries
      .filter(e => e.centreId === centre.id && e.roomId === selectedRoom)
      .forEach(e => {
        map.set(`${e.date}-${e.timeSlot}`, e);
      });
    return map;
  }, [manualEntries, centre.id, selectedRoom]);

  const getCellKey = (date: Date, timeSlot: string) => {
    return `${format(date, 'yyyy-MM-dd')}-${timeSlot}`;
  };

  const getCellValue = (date: Date, timeSlot: string) => {
    const key = getCellKey(date, timeSlot);
    const entry = entriesMap.get(key);
    return entry?.expectedDemand;
  };

  const handleCellClick = (date: Date, timeSlot: string) => {
    const key = getCellKey(date, timeSlot);
    const currentValue = getCellValue(date, timeSlot);
    setEditingCell(key);
    setEditValue(currentValue?.toString() || '');
  };

  const handleCellSave = (date: Date, timeSlot: string) => {
    const key = getCellKey(date, timeSlot);
    const dateStr = format(date, 'yyyy-MM-dd');
    const numValue = parseInt(editValue) || 0;

    // Validate
    const result = demandEntrySchema.safeParse({ expectedDemand: numValue });
    if (!result.success) {
      toast.error('Invalid value. Must be between 0 and 999.');
      return;
    }

    const existingEntry = entriesMap.get(key);
    
    if (existingEntry) {
      updateManualEntry(existingEntry.id, { expectedDemand: numValue });
    } else if (numValue > 0) {
      addManualEntry({
        date: dateStr,
        centreId: centre.id,
        roomId: selectedRoom,
        timeSlot,
        expectedDemand: numValue,
        source: 'manual',
      });
    }
    
    setEditingCell(null);
    setEditValue('');
  };

  const handleCellKeyDown = (e: React.KeyboardEvent, date: Date, timeSlot: string) => {
    if (e.key === 'Enter') {
      handleCellSave(date, timeSlot);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleBulkFill = () => {
    if (!bulkValue) return;
    const numValue = parseInt(bulkValue) || 0;
    
    const result = demandEntrySchema.safeParse({ expectedDemand: numValue });
    if (!result.success) {
      toast.error('Invalid value. Must be between 0 and 999.');
      return;
    }

    const entries: Omit<ManualDemandEntry, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    
    weekDates.forEach(date => {
      const dayOfWeek = date.getDay();
      const opHours = settings.operatingHours.find(h => h.dayOfWeek === dayOfWeek);
      
      if (!opHours?.isOpen) return;
      
      timeSlots.forEach(timeSlot => {
        const key = getCellKey(date, timeSlot);
        if (!entriesMap.has(key)) {
          entries.push({
            date: format(date, 'yyyy-MM-dd'),
            centreId: centre.id,
            roomId: selectedRoom,
            timeSlot,
            expectedDemand: numValue,
            source: 'manual',
          });
        }
      });
    });

    if (entries.length > 0) {
      bulkAddManualEntries(entries);
      toast.success(`Added ${entries.length} demand entries`);
    }
    setBulkValue('');
  };

  const handleCopyWeek = (direction: 'prev' | 'next') => {
    const targetWeekStart = addDays(weekStart, direction === 'next' ? 7 : -7);
    const sourceEntries = manualEntries.filter(
      e => e.centreId === centre.id && e.roomId === selectedRoom
    );

    const newEntries: Omit<ManualDemandEntry, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    
    weekDates.forEach((date, dayIndex) => {
      const targetDate = addDays(targetWeekStart, dayIndex);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      sourceEntries
        .filter(e => e.date === dateStr)
        .forEach(e => {
          newEntries.push({
            date: format(targetDate, 'yyyy-MM-dd'),
            centreId: centre.id,
            roomId: selectedRoom,
            timeSlot: e.timeSlot,
            expectedDemand: e.expectedDemand,
            notes: e.notes,
            source: 'manual',
          });
        });
    });

    if (newEntries.length > 0) {
      bulkAddManualEntries(newEntries);
      toast.success(`Copied ${newEntries.length} entries to ${direction} week`);
    }
  };

  const handleClearRoom = () => {
    const roomEntries = manualEntries.filter(
      e => e.centreId === centre.id && e.roomId === selectedRoom
    );
    roomEntries.forEach(e => deleteManualEntry(e.id));
    toast.success(`Cleared ${roomEntries.length} entries`);
  };

  const getTotalForDay = (date: Date) => {
    return timeSlots.reduce((sum, slot) => {
      return sum + (getCellValue(date, slot) || 0);
    }, 0);
  };

  const getTotalForSlot = (timeSlot: string) => {
    return weekDates.reduce((sum, date) => {
      return sum + (getCellValue(date, timeSlot) || 0);
    }, 0);
  };

  const actions: OffCanvasAction[] = [
    { label: 'Close', onClick: onClose, variant: 'outlined' },
  ];

  return (
    <PrimaryOffCanvas
      title="Demand Data Entry"
      description={`Enter expected demand for ${centre.name}`}
      width="1100px"
      open={open}
      onClose={onClose}
      actions={actions}
      showFooter
    >
      <Stack spacing={3} sx={{ mt: 2 }}>
        {/* Controls */}
        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={2} alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary">Zone</Typography>
                  <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {centre.rooms.map(room => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.name} (Cap: {room.capacity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">Week</Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <IconButton size="small" onClick={() => setWeekStart(addDays(weekStart, -7))}>
                      <ChevronLeft size={18} />
                    </IconButton>
                    <Typography variant="body2" fontWeight={500} sx={{ minWidth: 180, textAlign: 'center' }}>
                      {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
                    </Typography>
                    <IconButton size="small" onClick={() => setWeekStart(addDays(weekStart, 7))}>
                      <ChevronRight size={18} />
                    </IconButton>
                  </Stack>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Copy size={14} />}
                  onClick={() => handleCopyWeek('next')}
                >
                  Copy to Next Week
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  onClick={handleClearRoom}
                >
                  Clear All
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Quick fill */}
        <Card variant="outlined">
          <CardContent sx={{ py: 1.5 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Quick fill empty cells:
              </Typography>
              <Input
                type="number"
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                placeholder="Value"
                className="w-24"
                min={0}
                max={999}
              />
              <Button variant="contained" size="small" onClick={handleBulkFill}>
                Fill Empty
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Data grid */}
        <Card variant="outlined">
          <ScrollArea className="h-[calc(100vh-400px)]">
            <TableContainer component={Paper} elevation={0}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell 
                      sx={{ 
                        bgcolor: 'background.paper', 
                        fontWeight: 600, 
                        minWidth: 100,
                        position: 'sticky',
                        left: 0,
                        zIndex: 3,
                      }}
                    >
                      Time Slot
                    </TableCell>
                    {weekDates.map((date, idx) => {
                      const dayOfWeek = date.getDay();
                      const opHours = settings.operatingHours.find(h => h.dayOfWeek === dayOfWeek);
                      const isOpen = opHours?.isOpen ?? true;
                      
                      return (
                        <TableCell 
                          key={idx} 
                          align="center"
                          sx={{ 
                            bgcolor: isOpen ? 'background.paper' : 'action.disabledBackground',
                            minWidth: 90,
                          }}
                        >
                          <Typography variant="caption" fontWeight={600} display="block">
                            {format(date, 'EEE')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(date, 'MMM d')}
                          </Typography>
                          {!isOpen && (
                            <Chip label="Closed" size="small" sx={{ mt: 0.5, height: 16, fontSize: 9 }} />
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell align="center" sx={{ bgcolor: 'action.hover', fontWeight: 600 }}>
                      Total
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {timeSlots.map((timeSlot) => (
                    <TableRow key={timeSlot} hover>
                      <TableCell 
                        sx={{ 
                          fontWeight: 500, 
                          fontSize: 11,
                          position: 'sticky',
                          left: 0,
                          bgcolor: 'background.paper',
                          zIndex: 1,
                        }}
                      >
                        {timeSlot}
                      </TableCell>
                      {weekDates.map((date, idx) => {
                        const key = getCellKey(date, timeSlot);
                        const value = getCellValue(date, timeSlot);
                        const isEditing = editingCell === key;
                        const threshold = value ? getThresholdForDemand(value) : undefined;
                        const patterns = getActivePatterns(format(date, 'yyyy-MM-dd'), timeSlot);
                        const hasPattern = patterns.length > 0;
                        
                        const dayOfWeek = date.getDay();
                        const opHours = settings.operatingHours.find(h => h.dayOfWeek === dayOfWeek);
                        const isOpen = opHours?.isOpen ?? true;

                        if (!isOpen) {
                          return (
                            <TableCell 
                              key={idx} 
                              align="center"
                              sx={{ bgcolor: 'action.disabledBackground' }}
                            >
                              -
                            </TableCell>
                          );
                        }

                        return (
                          <TableCell 
                            key={idx} 
                            align="center"
                            onClick={() => !isEditing && handleCellClick(date, timeSlot)}
                            sx={{ 
                              cursor: 'pointer',
                              bgcolor: threshold?.color ? `${threshold.color}15` : 'transparent',
                              borderLeft: hasPattern ? `3px solid ${patterns[0].color}` : undefined,
                              '&:hover': { bgcolor: 'action.hover' },
                              p: 0.5,
                            }}
                          >
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleCellSave(date, timeSlot)}
                                onKeyDown={(e) => handleCellKeyDown(e, date, timeSlot)}
                                autoFocus
                                className="w-16 h-7 text-center text-sm"
                                min={0}
                                max={999}
                              />
                            ) : (
                              <Box
                                sx={{
                                  minHeight: 28,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {value !== undefined ? (
                                  <Typography 
                                    variant="body2" 
                                    fontWeight={500}
                                    sx={{ color: threshold?.color }}
                                  >
                                    {value}
                                  </Typography>
                                ) : (
                                  <Typography variant="body2" color="text.disabled">
                                    -
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell align="center" sx={{ bgcolor: 'action.hover', fontWeight: 600 }}>
                        {getTotalForSlot(timeSlot)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals row */}
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell 
                      sx={{ 
                        fontWeight: 600,
                        position: 'sticky',
                        left: 0,
                        bgcolor: 'action.hover',
                        zIndex: 1,
                      }}
                    >
                      Daily Total
                    </TableCell>
                    {weekDates.map((date, idx) => (
                      <TableCell key={idx} align="center" sx={{ fontWeight: 600 }}>
                        {getTotalForDay(date)}
                      </TableCell>
                    ))}
                    <TableCell align="center" sx={{ fontWeight: 700 }}>
                      {weekDates.reduce((sum, date) => sum + getTotalForDay(date), 0)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </ScrollArea>
        </Card>

        {/* Legend */}
        <Card variant="outlined">
          <CardContent sx={{ py: 1.5 }}>
            <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                Thresholds:
              </Typography>
              {settings.thresholds.map(threshold => (
                <Stack key={threshold.id} direction="row" spacing={0.5} alignItems="center">
                  <Box 
                    sx={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: 0.5, 
                      bgcolor: threshold.color,
                    }} 
                  />
                  <Typography variant="caption">
                    {threshold.name} ({threshold.minDemand}{threshold.maxDemand ? `-${threshold.maxDemand}` : '+'})
                  </Typography>
                </Stack>
              ))}
              
              <Box sx={{ borderLeft: 1, borderColor: 'divider', pl: 2, ml: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  Peak Patterns:
                </Typography>
              </Box>
              {settings.schedulePatterns.slice(0, 3).map(pattern => (
                <Stack key={pattern.id} direction="row" spacing={0.5} alignItems="center">
                  <Box 
                    sx={{ 
                      width: 3, 
                      height: 12, 
                      bgcolor: pattern.color,
                    }} 
                  />
                  <Typography variant="caption">
                    {pattern.name} ({pattern.expectedDemandMultiplier}x)
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>

        {/* Summary */}
        <Alert severity="info" icon={<FileSpreadsheet size={20} />}>
          <Typography variant="body2">
            <strong>{selectedRoomData?.name || 'Room'}</strong> has capacity of{' '}
            <strong>{selectedRoomData?.capacity || 0}</strong>. 
            Entered <strong>{entriesMap.size}</strong> demand values for this room.
            {settings.dataSources.historical.enabled && (
              <> Historical patterns will auto-fill missing values.</>
            )}
          </Typography>
        </Alert>
      </Stack>
    </PrimaryOffCanvas>
  );
}
