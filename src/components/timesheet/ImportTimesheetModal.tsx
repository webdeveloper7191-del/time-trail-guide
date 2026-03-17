import { useState, useRef, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Timesheet, ClockEntry, BreakEntry } from '@/types/timesheet';
import { locations } from '@/data/mockTimesheets';
import { Upload, FileSpreadsheet, FileText, CheckCircle2, AlertTriangle, Download, Folder, ArrowRight, ArrowLeft, Columns3, Sparkles, Link2, Link2Off } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';

interface ImportTimesheetModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (timesheets: Timesheet[]) => void;
}

// ── Target fields the system expects ──────────────────────────────
interface TargetField {
  key: string;
  label: string;
  required: boolean;
  aliases: string[]; // fuzzy match candidates
  category: 'employee' | 'shift' | 'break' | 'other';
}

const TARGET_FIELDS: TargetField[] = [
  { key: 'employeeName', label: 'Employee Name', required: true, aliases: ['employee name', 'name', 'employee', 'staff name', 'worker', 'full name', 'staff'], category: 'employee' },
  { key: 'employeeEmail', label: 'Email', required: false, aliases: ['email', 'employee email', 'e-mail', 'email address', 'staff email'], category: 'employee' },
  { key: 'payrollId', label: 'Payroll ID', required: false, aliases: ['payroll id', 'payroll', 'employee id', 'emp id', 'staff id', 'id', 'payroll number'], category: 'employee' },
  { key: 'department', label: 'Department', required: false, aliases: ['department', 'dept', 'division', 'team', 'unit'], category: 'employee' },
  { key: 'position', label: 'Position', required: false, aliases: ['position', 'role', 'title', 'job title', 'designation'], category: 'employee' },
  { key: 'location', label: 'Location', required: false, aliases: ['location', 'centre', 'center', 'site', 'branch', 'office', 'workplace'], category: 'shift' },
  { key: 'date', label: 'Date', required: true, aliases: ['date', 'shift date', 'work date', 'day'], category: 'shift' },
  { key: 'clockIn', label: 'Clock In', required: true, aliases: ['clock in', 'start time', 'start', 'time in', 'in', 'shift start', 'begin'], category: 'shift' },
  { key: 'clockOut', label: 'Clock Out', required: true, aliases: ['clock out', 'end time', 'end', 'time out', 'out', 'shift end', 'finish'], category: 'shift' },
  { key: 'breakStart', label: 'Break Start', required: false, aliases: ['break start', 'break in', 'lunch start', 'break begin'], category: 'break' },
  { key: 'breakEnd', label: 'Break End', required: false, aliases: ['break end', 'break out', 'lunch end', 'break finish'], category: 'break' },
  { key: 'notes', label: 'Notes', required: false, aliases: ['notes', 'comments', 'remarks', 'note', 'memo'], category: 'other' },
];

// ── Column mapping types ──────────────────────────────────────────
interface ColumnMapping {
  sourceColumn: string;
  targetField: string | null; // null = skip
  confidence: number; // 0-100
  autoDetected: boolean;
}

type WizardStep = 'upload' | 'map' | 'preview';

// ── Fuzzy matching ────────────────────────────────────────────────
function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

function fuzzyScore(source: string, alias: string): number {
  const s = normalizeHeader(source);
  const a = alias.toLowerCase();
  if (s === a) return 100;
  if (s.includes(a) || a.includes(s)) return 85;
  // word overlap
  const sWords = s.split(/\s+/);
  const aWords = a.split(/\s+/);
  const overlap = sWords.filter(w => aWords.includes(w)).length;
  if (overlap > 0) return 50 + (overlap / Math.max(sWords.length, aWords.length)) * 40;
  // starts with
  if (s.startsWith(a.slice(0, 3)) || a.startsWith(s.slice(0, 3))) return 30;
  return 0;
}

function autoDetectMappings(headers: string[]): ColumnMapping[] {
  const usedTargets = new Set<string>();
  // Score all pairs first
  const allScores: { headerIdx: number; targetKey: string; score: number }[] = [];
  headers.forEach((h, hi) => {
    TARGET_FIELDS.forEach(tf => {
      const best = Math.max(...tf.aliases.map(a => fuzzyScore(h, a)));
      if (best > 25) allScores.push({ headerIdx: hi, targetKey: tf.key, score: best });
    });
  });
  // Sort by score desc and greedily assign
  allScores.sort((a, b) => b.score - a.score);
  const mappings: ColumnMapping[] = headers.map(h => ({
    sourceColumn: h,
    targetField: null,
    confidence: 0,
    autoDetected: false,
  }));
  for (const { headerIdx, targetKey, score } of allScores) {
    if (usedTargets.has(targetKey)) continue;
    if (mappings[headerIdx].targetField !== null) continue;
    mappings[headerIdx] = { sourceColumn: headers[headerIdx], targetField: targetKey, confidence: score, autoDetected: true };
    usedTargets.add(targetKey);
  }
  return mappings;
}

// ── Parsed raw data (before mapping) ──────────────────────────────
interface RawFileData {
  headers: string[];
  rows: Record<string, string>[]; // header → value
}

interface ParsedRow {
  employeeName: string;
  employeeEmail: string;
  payrollId: string;
  department: string;
  position: string;
  location: string;
  date: string;
  clockIn: string;
  clockOut: string;
  breakStart?: string;
  breakEnd?: string;
  notes?: string;
}

interface ImportPreview {
  rows: ParsedRow[];
  errors: string[];
  warnings: string[];
}

// ── COMPONENT ─────────────────────────────────────────────────────
export function ImportTimesheetModal({ open, onClose, onImport }: ImportTimesheetModalProps) {
  const [step, setStep] = useState<WizardStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<RawFileData | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('upload');
    setSelectedFile(null);
    setRawData(null);
    setMappings([]);
    setPreview(null);
    setImporting(false);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Step 1: Parse raw file ──────────────────────────────────────
  const parseCSVRaw = (text: string): RawFileData => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return { headers: [], rows: [] };
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = values[i] || ''; });
      return row;
    });
    return { headers, rows };
  };

  const parseExcelRaw = async (file: File): Promise<RawFileData> => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
    if (json.length === 0) return { headers: [], rows: [] };
    const headers = Object.keys(json[0]);
    const rows = json.map(r => {
      const row: Record<string, string> = {};
      headers.forEach(h => { row[h] = String(r[h] ?? ''); });
      return row;
    });
    return { headers, rows };
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);

    try {
      let data: RawFileData;
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        data = parseCSVRaw(text);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        data = await parseExcelRaw(file);
      } else {
        toast.error('Unsupported file format. Use CSV or Excel.');
        return;
      }

      if (data.headers.length === 0) {
        toast.error('No columns found in file.');
        return;
      }

      setRawData(data);
      const detected = autoDetectMappings(data.headers);
      setMappings(detected);
      setStep('map');
      toast.success(`${data.rows.length} rows detected. Map your columns below.`);
    } catch {
      toast.error('Failed to parse file');
    }
  };

  // ── Step 2: Column mapping helpers ──────────────────────────────
  const updateMapping = useCallback((index: number, targetField: string | null) => {
    setMappings(prev => {
      const next = [...prev];
      // Clear any other mapping pointing to the same target
      if (targetField) {
        next.forEach((m, i) => {
          if (i !== index && m.targetField === targetField) {
            next[i] = { ...m, targetField: null, confidence: 0, autoDetected: false };
          }
        });
      }
      next[index] = { ...next[index], targetField, confidence: targetField ? 100 : 0, autoDetected: false };
      return next;
    });
  }, []);

  const mappedTargets = useMemo(() => new Set(mappings.filter(m => m.targetField).map(m => m.targetField!)), [mappings]);

  const requiredFieldsMissing = useMemo(() => {
    return TARGET_FIELDS.filter(tf => tf.required && !mappedTargets.has(tf.key));
  }, [mappedTargets]);

  const mappingStats = useMemo(() => {
    const mapped = mappings.filter(m => m.targetField).length;
    const autoMapped = mappings.filter(m => m.targetField && m.autoDetected).length;
    const skipped = mappings.filter(m => !m.targetField).length;
    return { mapped, autoMapped, skipped, total: mappings.length };
  }, [mappings]);

  // ── Step 2→3: Apply mapping to produce ParsedRows ──────────────
  const applyMappingAndValidate = useCallback(() => {
    if (!rawData) return;

    const fieldMap = new Map<string, string>(); // sourceColumn → targetField
    mappings.forEach(m => {
      if (m.targetField) fieldMap.set(m.sourceColumn, m.targetField);
    });

    const rows: ParsedRow[] = rawData.rows.map(rawRow => {
      const mapped: Record<string, string> = {};
      for (const [source, target] of fieldMap) {
        mapped[target] = rawRow[source] || '';
      }
      return {
        employeeName: mapped.employeeName || '',
        employeeEmail: mapped.employeeEmail || '',
        payrollId: mapped.payrollId || '',
        department: mapped.department || '',
        position: mapped.position || '',
        location: mapped.location || '',
        date: mapped.date || '',
        clockIn: mapped.clockIn || '',
        clockOut: mapped.clockOut || '',
        breakStart: mapped.breakStart || undefined,
        breakEnd: mapped.breakEnd || undefined,
        notes: mapped.notes || undefined,
      };
    }).filter(r => r.employeeName);

    const errors: string[] = [];
    const warnings: string[] = [];
    rows.forEach((row, i) => {
      if (!row.employeeName) errors.push(`Row ${i + 2}: Missing employee name`);
      if (!row.date) errors.push(`Row ${i + 2}: Missing date`);
      if (!row.clockIn || !row.clockOut) errors.push(`Row ${i + 2}: Missing clock in/out times`);
      if (!row.department) warnings.push(`Row ${i + 2}: No department specified`);
      if (!row.employeeEmail) warnings.push(`Row ${i + 2}: No email specified`);
    });

    setPreview({ rows, errors, warnings });
    setStep('preview');
  }, [rawData, mappings]);

  // ── Step 3: Import ─────────────────────────────────────────────
  const calculateHours = (clockIn: string, clockOut: string): number => {
    const [inH, inM] = clockIn.split(':').map(Number);
    const [outH, outM] = clockOut.split(':').map(Number);
    return Math.max(0, (outH * 60 + outM - inH * 60 - inM) / 60);
  };

  const handleImport = async () => {
    if (!preview || preview.errors.length > 0) return;
    setImporting(true);

    const grouped = new Map<string, ParsedRow[]>();
    preview.rows.forEach(row => {
      const key = `${row.payrollId || row.employeeName}-${row.employeeEmail}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(row);
    });

    const timesheets: Timesheet[] = [];
    let processed = 0;
    const total = grouped.size;

    for (const [, rows] of grouped) {
      const first = rows[0];
      const loc = locations.find(l => l.name.toLowerCase().includes(first.location.toLowerCase())) || locations[0];

      const clockEntries: ClockEntry[] = rows.map((row, i) => {
        const grossHours = calculateHours(row.clockIn, row.clockOut);
        const breakMins = row.breakStart && row.breakEnd ? calculateHours(row.breakStart, row.breakEnd) * 60 : 30;
        const netHours = Math.max(0, grossHours - breakMins / 60);
        const breaks: BreakEntry[] = [{
          id: `brk-imp-${i}`,
          startTime: row.breakStart || '12:00',
          endTime: row.breakEnd || '12:30',
          duration: breakMins,
          type: 'lunch',
        }];
        return {
          id: `entry-imp-${Date.now()}-${i}`,
          date: row.date,
          clockIn: row.clockIn,
          clockOut: row.clockOut,
          breaks,
          totalBreakMinutes: breakMins,
          grossHours,
          netHours,
          overtime: Math.max(0, netHours - 8),
          notes: row.notes,
        };
      });

      const totalHours = clockEntries.reduce((s, e) => s + e.netHours, 0);
      const overtimeHours = clockEntries.reduce((s, e) => s + e.overtime, 0);
      const sortedDates = rows.map(r => r.date).sort();

      timesheets.push({
        id: `TS-IMP-${Date.now()}-${processed}`,
        employee: {
          id: `E-IMP-${Date.now()}-${processed}`,
          name: first.employeeName,
          email: first.employeeEmail,
          department: first.department || 'General',
          position: first.position || 'Staff',
        },
        location: loc,
        weekStartDate: sortedDates[0],
        weekEndDate: sortedDates[sortedDates.length - 1],
        status: 'pending',
        entries: clockEntries,
        totalHours,
        regularHours: totalHours - overtimeHours,
        overtimeHours,
        totalBreakMinutes: clockEntries.reduce((s, e) => s + e.totalBreakMinutes, 0),
        submittedAt: new Date().toISOString(),
        notes: `Imported from ${selectedFile?.name}`,
      });

      processed++;
      setProgress(Math.round((processed / total) * 100));
      await new Promise(r => setTimeout(r, 100));
    }

    onImport(timesheets);
    toast.success(`${timesheets.length} timesheet(s) imported successfully`);
    reset();
    onClose();
  };

  const downloadTemplate = () => {
    const headers = 'Employee Name,Email,Payroll ID,Department,Position,Location,Date,Clock In,Clock Out,Break Start,Break End,Notes';
    const sample1 = 'John Smith,john@company.com,PAY001,Engineering,Developer,Downtown Office,2024-01-08,09:00,17:00,12:00,12:30,';
    const sample2 = 'John Smith,john@company.com,PAY001,Engineering,Developer,Downtown Office,2024-01-09,08:30,16:30,12:00,12:30,Day 2';
    const blob = new Blob([headers + '\n' + sample1 + '\n' + sample2], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timesheet_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  // ── Stepper UI ──────────────────────────────────────────────────
  const steps: { key: WizardStep; label: string; icon: React.ReactNode }[] = [
    { key: 'upload', label: 'Upload', icon: <Upload className="h-4 w-4" /> },
    { key: 'map', label: 'Map Columns', icon: <Columns3 className="h-4 w-4" /> },
    { key: 'preview', label: 'Validate & Import', icon: <CheckCircle2 className="h-4 w-4" /> },
  ];

  const stepIndex = steps.findIndex(s => s.key === step);

  const confidenceBadge = (confidence: number, autoDetected: boolean) => {
    if (confidence >= 85) return <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-primary/90">{autoDetected ? 'Auto' : 'Manual'} • {confidence}%</Badge>;
    if (confidence >= 50) return <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-accent">{autoDetected ? 'Auto' : 'Manual'} • {confidence}%</Badge>;
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Import Timesheets
          </DialogTitle>
          <DialogDescription>Upload a file, map columns, then validate and import.</DialogDescription>
        </DialogHeader>

        {/* ── Stepper ──────────────────────────────────────────── */}
        <div className="flex items-center gap-1 py-2">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-1 flex-1">
              <div className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex-1 justify-center',
                i < stepIndex && 'bg-primary/10 text-primary',
                i === stepIndex && 'bg-primary text-primary-foreground',
                i > stepIndex && 'bg-muted text-muted-foreground',
              )}>
                {s.icon}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
            </div>
          ))}
        </div>

        <div className="space-y-4 py-2">
          {/* ── STEP 1: Upload ───────────────────────────────── */}
          {step === 'upload' && (
            <>
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileSelect} className="hidden" />
                <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Drop file here or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">Supports .csv, .xlsx, .xls</p>
              </div>

              <Button variant="outline" size="sm" className="w-full" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download CSV Template
              </Button>
            </>
          )}

          {/* ── STEP 2: Column Mapping ───────────────────────── */}
          {step === 'map' && rawData && (
            <>
              {/* File summary */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                {selectedFile?.name.endsWith('.csv') ? (
                  <FileText className="h-6 w-6 text-primary" />
                ) : (
                  <FileSpreadsheet className="h-6 w-6 text-primary" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{selectedFile?.name}</p>
                  <p className="text-xs text-muted-foreground">{rawData.headers.length} columns • {rawData.rows.length} rows</p>
                </div>
              </div>

              {/* Mapping stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded-lg bg-primary/10">
                  <p className="text-lg font-bold text-primary">{mappingStats.mapped}</p>
                  <p className="text-[10px] text-muted-foreground">Mapped</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-accent/50">
                  <p className="text-lg font-bold text-accent-foreground">{mappingStats.autoMapped}</p>
                  <p className="text-[10px] text-muted-foreground">Auto-detected</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted">
                  <p className="text-lg font-bold text-muted-foreground">{mappingStats.skipped}</p>
                  <p className="text-[10px] text-muted-foreground">Skipped</p>
                </div>
              </div>

              {/* Required fields warning */}
              {requiredFieldsMissing.length > 0 && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-destructive">Required fields not mapped:</p>
                    <p className="text-xs text-destructive/80">{requiredFieldsMissing.map(f => f.label).join(', ')}</p>
                  </div>
                </div>
              )}

              {/* Column mapping list */}
              <ScrollArea className="h-[300px] pr-2">
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr,auto,1fr] gap-2 px-1 mb-1">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">Your Column</p>
                    <div />
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">Maps To</p>
                  </div>
                  {mappings.map((mapping, idx) => {
                    const targetField = TARGET_FIELDS.find(tf => tf.key === mapping.targetField);
                    const isRequired = targetField?.required;
                    return (
                      <div key={idx} className={cn(
                        'grid grid-cols-[1fr,auto,1fr] gap-2 items-center p-2 rounded-lg border transition-colors',
                        mapping.targetField ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border',
                      )}>
                        {/* Source column */}
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex flex-col min-w-0">
                            <p className="text-sm font-medium truncate">{mapping.sourceColumn}</p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              e.g. "{rawData.rows[0]?.[mapping.sourceColumn] || '—'}"
                            </p>
                          </div>
                        </div>

                        {/* Arrow + confidence */}
                        <div className="flex flex-col items-center gap-0.5">
                          {mapping.targetField ? (
                            <Link2 className="h-4 w-4 text-primary" />
                          ) : (
                            <Link2Off className="h-4 w-4 text-muted-foreground" />
                          )}
                          {confidenceBadge(mapping.confidence, mapping.autoDetected)}
                        </div>

                        {/* Target selector */}
                        <Select
                          value={mapping.targetField || '__skip__'}
                          onValueChange={(val) => updateMapping(idx, val === '__skip__' ? null : val)}
                        >
                          <SelectTrigger className={cn(
                            'h-9 text-sm',
                            !mapping.targetField && 'text-muted-foreground',
                          )}>
                            <SelectValue placeholder="Skip this column" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__skip__">
                              <span className="text-muted-foreground">— Skip —</span>
                            </SelectItem>
                            {/* Group by category */}
                            {(['employee', 'shift', 'break', 'other'] as const).map(cat => {
                              const fields = TARGET_FIELDS.filter(tf => tf.category === cat);
                              return fields.map(tf => {
                                const isTaken = mappedTargets.has(tf.key) && mapping.targetField !== tf.key;
                                return (
                                  <SelectItem key={tf.key} value={tf.key} disabled={isTaken}>
                                    <span className="flex items-center gap-1.5">
                                      {tf.label}
                                      {tf.required && <span className="text-destructive">*</span>}
                                      {isTaken && <span className="text-[10px] text-muted-foreground">(in use)</span>}
                                    </span>
                                  </SelectItem>
                                );
                              });
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Auto-detect hint */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Columns were auto-matched using fuzzy detection. Review and adjust as needed.
              </div>
            </>
          )}

          {/* ── STEP 3: Validate & Preview ───────────────────── */}
          {step === 'preview' && preview && (
            <>
              {/* File info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                {selectedFile?.name.endsWith('.csv') ? (
                  <FileText className="h-6 w-6 text-primary" />
                ) : (
                  <FileSpreadsheet className="h-6 w-6 text-primary" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">{selectedFile?.name}</p>
                  <p className="text-xs text-muted-foreground">{preview.rows.length} rows mapped</p>
                </div>
                <Badge variant={preview.errors.length === 0 ? 'default' : 'destructive'}>
                  {preview.errors.length === 0 ? 'Valid' : `${preview.errors.length} errors`}
                </Badge>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-primary/10">
                  <p className="text-2xl font-bold text-primary">{preview.rows.length}</p>
                  <p className="text-xs text-muted-foreground">Rows</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-accent/50">
                  <p className="text-2xl font-bold text-accent-foreground">{preview.warnings.length}</p>
                  <p className="text-xs text-muted-foreground">Warnings</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-destructive/10">
                  <p className="text-2xl font-bold text-destructive">{preview.errors.length}</p>
                  <p className="text-xs text-muted-foreground">Errors</p>
                </div>
              </div>

              {/* Errors */}
              {preview.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" /> Errors (must fix before importing)
                  </p>
                  <ScrollArea className="h-24 border rounded-lg p-3">
                    {preview.errors.map((err, i) => (
                      <p key={i} className="text-xs text-destructive mb-1">{err}</p>
                    ))}
                  </ScrollArea>
                </div>
              )}

              {/* Warnings */}
              {preview.warnings.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2 text-accent-foreground">
                    <AlertTriangle className="h-4 w-4" /> Warnings
                  </p>
                  <ScrollArea className="h-20 border rounded-lg p-3">
                    {preview.warnings.map((w, i) => (
                      <p key={i} className="text-xs text-muted-foreground mb-1">{w}</p>
                    ))}
                  </ScrollArea>
                </div>
              )}

              {/* Preview table */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Preview (first 5 rows)</p>
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-2 text-left">Name</th>
                        <th className="p-2 text-left">Email</th>
                        <th className="p-2 text-left">Payroll ID</th>
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-left">In</th>
                        <th className="p-2 text-left">Out</th>
                        <th className="p-2 text-left">Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{row.employeeName}</td>
                          <td className="p-2 text-muted-foreground">{row.employeeEmail || '—'}</td>
                          <td className="p-2 text-muted-foreground">{row.payrollId || '—'}</td>
                          <td className="p-2">{row.date}</td>
                          <td className="p-2">{row.clockIn}</td>
                          <td className="p-2">{row.clockOut}</td>
                          <td className="p-2">{row.location || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {importing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Importing...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>

          {step === 'map' && (
            <>
              <Button variant="outline" onClick={() => { setStep('upload'); setRawData(null); setMappings([]); }}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                onClick={applyMappingAndValidate}
                disabled={requiredFieldsMissing.length > 0}
              >
                Validate & Preview <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </>
          )}

          {step === 'preview' && preview && (
            <>
              <Button variant="outline" onClick={() => setStep('map')}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Mapping
              </Button>
              <Button onClick={handleImport} disabled={importing || preview.errors.length > 0}>
                <Upload className="h-4 w-4 mr-2" />
                Import {preview.rows.length} Rows
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
