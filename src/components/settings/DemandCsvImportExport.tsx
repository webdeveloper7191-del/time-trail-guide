import { useState, useRef, useCallback } from 'react';
import {
  Button,
  Card,
  CardContent,
  Stack,
  Box,
  Typography,
  Alert,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { format, parse, isValid } from 'date-fns';
import { ManualDemandEntry, useDemand } from '@/contexts/DemandContext';
import { Centre } from '@/types/roster';

interface DemandCsvImportExportProps {
  centre: Centre;
  onImportComplete?: () => void;
}

interface ImportResult {
  success: number;
  failed: number;
  warnings: string[];
  errors: string[];
}

interface ParsedRow {
  date: string;
  roomId: string;
  roomName: string;
  timeSlot: string;
  expectedDemand: number;
  notes?: string;
  isValid: boolean;
  error?: string;
}

export function DemandCsvImportExport({ centre, onImportComplete }: DemandCsvImportExportProps) {
  const { manualEntries, bulkAddManualEntries, getTimeSlots } = useDemand();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const generateCsvContent = useCallback(() => {
    const headers = ['Date', 'Room ID', 'Room Name', 'Time Slot', 'Expected Demand', 'Notes'];
    const rows: string[][] = [];

    // Filter entries for this centre
    const centreEntries = manualEntries.filter(e => e.centreId === centre.id);
    
    // Sort by date, room, time slot
    const sortedEntries = [...centreEntries].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (a.roomId !== b.roomId) return a.roomId.localeCompare(b.roomId);
      return a.timeSlot.localeCompare(b.timeSlot);
    });

    sortedEntries.forEach(entry => {
      const room = centre.rooms.find(r => r.id === entry.roomId);
      rows.push([
        entry.date,
        entry.roomId,
        room?.name || 'Unknown',
        entry.timeSlot,
        entry.expectedDemand.toString(),
        entry.notes || '',
      ]);
    });

    // If no entries, create a template with all rooms and time slots
    if (rows.length === 0) {
      const timeSlots = getTimeSlots();
      const today = format(new Date(), 'yyyy-MM-dd');
      
      centre.rooms.forEach(room => {
        timeSlots.forEach(slot => {
          rows.push([
            today,
            room.id,
            room.name,
            slot,
            '0',
            '',
          ]);
        });
      });
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Escape cells containing commas or quotes
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(','))
    ].join('\n');

    return csvContent;
  }, [manualEntries, centre, getTimeSlots]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    
    try {
      const csvContent = generateCsvContent();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `demand-data-${centre.name.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Demand data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export demand data');
    } finally {
      setIsExporting(false);
    }
  }, [generateCsvContent, centre.name]);

  const handleExportTemplate = useCallback(() => {
    const headers = ['Date', 'Room ID', 'Room Name', 'Time Slot', 'Expected Demand', 'Notes'];
    const timeSlots = getTimeSlots();
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const rows: string[][] = [];
    
    // Create template rows for all rooms and time slots
    centre.rooms.forEach(room => {
      timeSlots.slice(0, 3).forEach(slot => { // Just first 3 slots as examples
        rows.push([
          today,
          room.id,
          room.name,
          slot,
          '10', // Example value
          'Example note',
        ]);
      });
    });

    const csvContent = [
      '# Demand Data Import Template',
      '# Instructions:',
      '# - Date format: YYYY-MM-DD (e.g., 2024-01-15)',
      '# - Room ID: Use exact room IDs from your centre',
      '# - Time Slot: Use format HH:MM-HH:MM (e.g., 09:00-10:00)',
      '# - Expected Demand: Number between 0 and 999',
      '# - Notes: Optional text (max 500 chars)',
      '#',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `demand-template-${centre.name.toLowerCase().replace(/\s+/g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Template downloaded');
  }, [centre, getTimeSlots]);

  const parseCSV = useCallback((content: string): ParsedRow[] => {
    const lines = content.split('\n').filter(line => !line.startsWith('#') && line.trim());
    
    if (lines.length < 2) {
      return [];
    }

    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.trim().toLowerCase());
    
    const dateIdx = headers.findIndex(h => h === 'date');
    const roomIdIdx = headers.findIndex(h => h === 'room id');
    const roomNameIdx = headers.findIndex(h => h === 'room name');
    const timeSlotIdx = headers.findIndex(h => h === 'time slot');
    const demandIdx = headers.findIndex(h => h === 'expected demand');
    const notesIdx = headers.findIndex(h => h === 'notes');

    if (dateIdx === -1 || roomIdIdx === -1 || timeSlotIdx === -1 || demandIdx === -1) {
      throw new Error('Missing required columns: Date, Room ID, Time Slot, Expected Demand');
    }

    const parsedRows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV line (handling quoted values)
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const dateStr = values[dateIdx];
      const roomId = values[roomIdIdx];
      const roomName = values[roomNameIdx] || '';
      const timeSlot = values[timeSlotIdx];
      const demandStr = values[demandIdx];
      const notes = notesIdx !== -1 ? values[notesIdx] : '';

      const row: ParsedRow = {
        date: dateStr,
        roomId,
        roomName,
        timeSlot,
        expectedDemand: 0,
        notes: notes || undefined,
        isValid: true,
      };

      // Validate date
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateStr)) {
        row.isValid = false;
        row.error = `Invalid date format: ${dateStr} (expected YYYY-MM-DD)`;
      } else {
        const parsedDate = parse(dateStr, 'yyyy-MM-dd', new Date());
        if (!isValid(parsedDate)) {
          row.isValid = false;
          row.error = `Invalid date: ${dateStr}`;
        }
      }

      // Validate room ID
      const room = centre.rooms.find(r => r.id === roomId);
      if (!room) {
        row.isValid = false;
        row.error = `Unknown room ID: ${roomId}`;
      }

      // Validate time slot
      const timeSlotRegex = /^\d{2}:\d{2}-\d{2}:\d{2}$/;
      if (timeSlot !== 'All Day' && !timeSlotRegex.test(timeSlot)) {
        row.isValid = false;
        row.error = `Invalid time slot format: ${timeSlot}`;
      }

      // Validate demand
      const demand = parseInt(demandStr, 10);
      if (isNaN(demand) || demand < 0 || demand > 999) {
        row.isValid = false;
        row.error = `Invalid demand value: ${demandStr} (must be 0-999)`;
      } else {
        row.expectedDemand = demand;
      }

      parsedRows.push(row);
    }

    return parsedRows;
  }, [centre.rooms]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setSelectedFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = parseCSV(content);
        setParsedData(parsed);
        setShowImportDialog(true);
        setImportResult(null);
      } catch (error: any) {
        toast.error(error.message || 'Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [parseCSV]);

  const handleImport = useCallback(async () => {
    const validRows = parsedData.filter(r => r.isValid);
    
    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    const result: ImportResult = {
      success: 0,
      failed: 0,
      warnings: [],
      errors: [],
    };

    try {
      const entries: Omit<ManualDemandEntry, 'id' | 'createdAt' | 'updatedAt'>[] = [];
      
      for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i];
        setImportProgress(Math.round((i / parsedData.length) * 100));
        
        if (row.isValid) {
          entries.push({
            date: row.date,
            centreId: centre.id,
            roomId: row.roomId,
            timeSlot: row.timeSlot,
            expectedDemand: row.expectedDemand,
            notes: row.notes,
            source: 'import',
          });
          result.success++;
        } else {
          result.failed++;
          result.errors.push(`Row ${i + 2}: ${row.error}`);
        }
      }

      // Simulate async processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (entries.length > 0) {
        bulkAddManualEntries(entries);
      }

      setImportProgress(100);
      setImportResult(result);
      
      if (result.success > 0) {
        toast.success(`Imported ${result.success} demand entries`);
        onImportComplete?.();
      }
    } catch (error: any) {
      result.errors.push(error.message);
      setImportResult(result);
      toast.error('Import failed');
    } finally {
      setIsImporting(false);
    }
  }, [parsedData, centre.id, bulkAddManualEntries, onImportComplete]);

  const handleCloseDialog = () => {
    setShowImportDialog(false);
    setParsedData([]);
    setSelectedFile(null);
    setImportResult(null);
    setImportProgress(0);
  };

  const validCount = parsedData.filter(r => r.isValid).length;
  const invalidCount = parsedData.filter(r => !r.isValid).length;

  return (
    <>
      <Card variant="outlined">
        <CardContent sx={{ py: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <FileSpreadsheet size={18} className="text-muted-foreground" />
              <Typography variant="body2" fontWeight={500}>
                Bulk Import/Export
              </Typography>
            </Stack>
            
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FileText size={14} />}
                onClick={handleExportTemplate}
              >
                Download Template
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Download size={14} />}
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<Upload size={14} />}
                onClick={() => fileInputRef.current?.click()}
              >
                Import CSV
              </Button>
            </Stack>
          </Stack>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload size={20} />
              Import Demand Data
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedFile && (
              <Alert severity="info" sx={{ py: 1 }}>
                <Typography variant="body2">
                  <strong>File:</strong> {selectedFile.name} ({parsedData.length} rows)
                </Typography>
              </Alert>
            )}

            {!importResult && (
              <>
                <Stack direction="row" spacing={2}>
                  <Chip
                    icon={<CheckCircle2 size={14} />}
                    label={`${validCount} valid`}
                    color="success"
                    size="small"
                  />
                  {invalidCount > 0 && (
                    <Chip
                      icon={<AlertTriangle size={14} />}
                      label={`${invalidCount} invalid`}
                      color="error"
                      size="small"
                    />
                  )}
                </Stack>

                {invalidCount > 0 && (
                  <ScrollArea className="h-40 border rounded-md p-2">
                    <Stack spacing={1}>
                      {parsedData
                        .filter(r => !r.isValid)
                        .slice(0, 10)
                        .map((row, idx) => (
                          <Alert key={idx} severity="error" sx={{ py: 0.5 }}>
                            <Typography variant="caption">
                              {row.error}
                            </Typography>
                          </Alert>
                        ))}
                      {invalidCount > 10 && (
                        <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
                          ... and {invalidCount - 10} more errors
                        </Typography>
                      )}
                    </Stack>
                  </ScrollArea>
                )}

                {isImporting && (
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress variant="determinate" value={importProgress} />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Importing... {importProgress}%
                    </Typography>
                  </Box>
                )}
              </>
            )}

            {importResult && (
              <Stack spacing={2}>
                <Alert severity={importResult.success > 0 ? 'success' : 'error'}>
                  <Typography variant="body2">
                    <strong>Import Complete</strong>
                  </Typography>
                  <Typography variant="caption" display="block">
                    {importResult.success} entries imported successfully
                    {importResult.failed > 0 && `, ${importResult.failed} failed`}
                  </Typography>
                </Alert>

                {importResult.errors.length > 0 && (
                  <ScrollArea className="h-32 border rounded-md p-2">
                    <Stack spacing={1}>
                      {importResult.errors.slice(0, 10).map((error, idx) => (
                        <Typography key={idx} variant="caption" color="error">
                          {error}
                        </Typography>
                      ))}
                    </Stack>
                  </ScrollArea>
                )}
              </Stack>
            )}
          </div>

          <DialogFooter>
            <Button variant="outlined" onClick={handleCloseDialog}>
              {importResult ? 'Close' : 'Cancel'}
            </Button>
            {!importResult && (
              <Button
                variant="contained"
                onClick={handleImport}
                disabled={isImporting || validCount === 0}
              >
                Import {validCount} Entries
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
